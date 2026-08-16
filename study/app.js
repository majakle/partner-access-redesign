(function () {
  "use strict";

  const S = window.STUDY;
  const TOTAL_STEPS = 9;

  const state = {
    participantId: "",
    order: "AB", // AB | BA
    sequence: ["A", "B"],
    seqIndex: 0,
    consent: false,
    startedAt: null,
    finishedAt: null,
    stream: null,
    recorder: null,
    chunks: [],
    recordingMime: "video/webm",
    recordingVersion: null,
    formWindow: null,
    formOpened: false,
    taskAutoFinished: false,
    versions: {
      A: {
        completed: null,
        taskTimeMs: 0,
        sus: {},
        susScore: null,
        recordingBlob: null,
      },
      B: {
        completed: null,
        taskTimeMs: 0,
        sus: {},
        susScore: null,
        recordingBlob: null,
      },
    },
    comparative: {},
    background: {},
    uploadLink: "",
    driveUpload: null,
    _stoppingPromise: null,
  };

  const $ = (id) => document.getElementById(id);
  const show = (el) => el && el.classList.remove("hidden");
  const hide = (el) => el && el.classList.add("hidden");

  function radioValue(name) {
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : null;
  }

  function formatTime(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return String(m).padStart(2, "0") + ":" + String(r).padStart(2, "0");
  }

  function scoreSUS(susMap) {
    // ratings 1..5; odd items (1,3,5,7,9): rating-1; even: 5-rating; * 2.5
    let sum = 0;
    for (let i = 1; i <= 10; i++) {
      const key = "s" + i;
      const r = Number(susMap[key]);
      if (!r) return null;
      sum += i % 2 === 1 ? r - 1 : 5 - r;
    }
    return sum * 2.5;
  }

  function assignOrder() {
    const saved = sessionStorage.getItem("abba-order");
    if (saved === "AB" || saved === "BA") {
      state.order = saved;
    } else {
      state.order = Math.random() < 0.5 ? "AB" : "BA";
      sessionStorage.setItem("abba-order", state.order);
    }
    state.sequence = state.order === "AB" ? ["A", "B"] : ["B", "A"];
  }

  function currentVersion() {
    return state.sequence[state.seqIndex];
  }

  function setProgress(n) {
    $("progress-label").textContent = "Step " + n + " of " + TOTAL_STEPS;
  }

  function hideAllSteps() {
    document.querySelectorAll(".step").forEach((s) => hide(s));
  }

  function go(stepId, progressNum) {
    hideAllSteps();
    show($(stepId));
    if (progressNum) setProgress(progressNum);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function fillTestData() {
    const dl = $("test-data-list");
    dl.innerHTML = "";
    S.testData.forEach(([k, v]) => {
      const dt = document.createElement("dt");
      dt.textContent = k;
      const dd = document.createElement("dd");
      dd.textContent = v;
      dl.appendChild(dt);
      dl.appendChild(dd);
    });
  }

  function buildSUSForm() {
    const root = $("sus-form");
    root.innerHTML = "";

    // Desktop table
    const tableWrap = document.createElement("div");
    tableWrap.className = "sus-desktop";
    const table = document.createElement("table");
    table.className = "sus-table";
    const thead = document.createElement("thead");
    const hr = document.createElement("tr");
    const th0 = document.createElement("th");
    th0.className = "item-col";
    th0.textContent = "Statement";
    hr.appendChild(th0);
    S.susScale.forEach((label) => {
      const th = document.createElement("th");
      th.textContent = label;
      hr.appendChild(th);
    });
    thead.appendChild(hr);
    table.appendChild(thead);
    const tbody = document.createElement("tbody");
    S.susItems.forEach((item, idx) => {
      const tr = document.createElement("tr");
      const td0 = document.createElement("td");
      td0.className = "item-col";
      td0.textContent = idx + 1 + ". " + item.text;
      tr.appendChild(td0);
      S.susScale.forEach((_, si) => {
        const td = document.createElement("td");
        const lab = document.createElement("label");
        const inp = document.createElement("input");
        inp.type = "radio";
        inp.name = "sus-" + item.id;
        inp.value = String(si + 1);
        lab.appendChild(inp);
        td.appendChild(lab);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    tableWrap.appendChild(table);
    root.appendChild(tableWrap);

    // Mobile stacked
    const mobile = document.createElement("div");
    mobile.className = "sus-mobile";
    S.susItems.forEach((item, idx) => {
      const block = document.createElement("div");
      block.className = "sus-item";
      const p = document.createElement("p");
      p.textContent = idx + 1 + ". " + item.text;
      block.appendChild(p);
      S.susScale.forEach((label, si) => {
        const lab = document.createElement("label");
        lab.className = "radio";
        const inp = document.createElement("input");
        inp.type = "radio";
        inp.name = "sus-" + item.id;
        inp.value = String(si + 1);
        lab.appendChild(inp);
        lab.appendChild(document.createTextNode(" " + label));
        block.appendChild(lab);
      });
      mobile.appendChild(block);
    });
    root.appendChild(mobile);
  }

  function buildRadioGroup(containerId, name, options) {
    const root = $(containerId);
    root.innerHTML = "";
    options.forEach((opt) => {
      const lab = document.createElement("label");
      lab.className = "radio";
      const inp = document.createElement("input");
      inp.type = "radio";
      inp.name = name;
      inp.value = opt;
      lab.appendChild(inp);
      lab.appendChild(document.createTextNode(" " + opt));
      root.appendChild(lab);
      if (opt === "Other") {
        const other = document.createElement("input");
        other.type = "text";
        other.id = name + "-other";
        other.placeholder = "Please specify";
        other.style.margin = "0.35rem 0 0.75rem 1.5rem";
        other.style.display = "none";
        root.appendChild(other);
        inp.addEventListener("change", () => {
          other.style.display = "block";
        });
      } else {
        inp.addEventListener("change", () => {
          const o = document.getElementById(name + "-other");
          if (o) o.style.display = "none";
        });
      }
    });
  }

  function prepareTaskUI() {
    const v = currentVersion();
    $("task-version-label").textContent = v;
    document.querySelectorAll(".task-ver").forEach((el) => {
      el.textContent = v;
    });
    $("btn-open-version").textContent = "Start recording & open form";
    $("btn-open-version").disabled = false;
    $("task-hint").textContent = S.hints[v] || "";
    document
      .querySelectorAll('input[name="task-complete"]')
      .forEach((r) => (r.checked = false));
    $("btn-finish-task").disabled = true;
    hide($("task-error"));
    hide($("timer-auto-msg"));
    hide($("share-error"));
    hide($("share-ok"));
    hide($("form-open-status"));
    stopTimerDisplayOnly();
    $("timer-display").textContent = "00:00";
    state.timerStartedAt = null;
    state.timerAccumMs = 0;
    state.taskAutoFinished = false;
    state.formOpened = false;
  }

  function onTaskAutoComplete() {
    if (state.taskAutoFinished) return;
    if (!state.timerStartedAt && state.timerAccumMs === 0) return;
    state.taskAutoFinished = true;
    // Go straight to SUS so the visible task time cannot bias ratings
    finishCurrentTaskAndGoToSUS("Yes");
  }

  async function finishCurrentTaskAndGoToSUS(completedValue) {
    const v = currentVersion();
    const ms = stopTimer();
    await stopRecording(v);
    state.versions[v].completed = completedValue;
    state.versions[v].taskTimeMs = ms;
    try {
      if (state.formWindow && !state.formWindow.closed) {
        // Leave form tab open briefly so they can read success; do not force-close here
      }
    } catch (_) {}
    hide($("timer-auto-msg"));
    hide($("share-ok"));
    hide($("form-open-status"));
    hide($("rec-indicator"));
    prepareSUSUI();
    go("step-sus", state.seqIndex === 0 ? 4 : 6);
  }

  function shareHelpText(err) {
    const name = (err && err.name) || "";
    const baseMac =
      " On a Mac: System Settings → Privacy & Security → Screen Recording → turn on Google Chrome (or Edge), then fully quit and reopen the browser.";
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      return (
        "This browser cannot record the screen. Open the study in Google Chrome or Microsoft Edge on a computer." +
        baseMac
      );
    }
    if (name === "NotAllowedError" || name === "NotFoundError") {
      return (
        "Screen share was blocked or cancelled (" +
        name +
        "). Click the button again. In the dialog choose Window → Google Chrome." +
        baseMac
      );
    }
    if (name === "AbortError") {
      return "Screen share was cancelled. Click “Start recording & open form” again and choose Window → Google Chrome.";
    }
    return (
      "Could not start recording" +
      (name ? " (" + name + ")" : "") +
      ". Use Chrome/Edge, click the button again, and choose Window → Google Chrome." +
      baseMac
    );
  }

  async function startRecordingAndOpenForm() {
    const v = currentVersion();
    hide($("task-error"));
    hide($("share-error"));
    hide($("share-ok"));
    hide($("form-open-status"));

    if (!window.isSecureContext) {
      $("share-error").textContent =
        "Screen recording only works on HTTPS. Open the GitHub Pages study link in Chrome.";
      show($("share-error"));
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      $("share-error").textContent = shareHelpText({ name: "Unsupported" });
      show($("share-error"));
      // Still allow completing the task without video
      openFormWindowOnly(v);
      return;
    }

    $("btn-open-version").disabled = true;

    // CRITICAL: call getDisplayMedia first, while this click is still a valid user gesture.
    // Opening a tab before share consumes the gesture and Chrome shows no picker.
    let recorded = false;
    try {
      const status = $("form-open-status");
      if (status) {
        status.textContent =
          "Choose Window → Google Chrome (or Edge) in the share dialog…";
        show(status);
      }
      await startFormRecording(v);
      recorded = true;
      show($("share-ok"));
    } catch (err) {
      $("share-error").textContent = shareHelpText(err);
      show($("share-error"));
      $("btn-open-version").disabled = false;
      // Open the form anyway so the study can continue without video
    }

    openFormWindowOnly(v);
    if (recorded) {
      hide($("form-open-status"));
      $("btn-open-version").textContent = "Recording… form opened";
    } else {
      const status = $("form-open-status");
      if (status) {
        status.textContent =
          "Form opened without recording. Fix screen-share permission, then click the button again (or continue without video).";
        show(status);
      }
    }
  }

  function openFormWindowOnly(v) {
    const win = window.open(S.urls[v], "abba-form-" + v);
    if (!win) {
      $("task-error").textContent =
        "Pop-up blocked. Allow pop-ups for this site, then try again.";
      show($("task-error"));
      $("btn-open-version").disabled = false;
      return;
    }
    state.formWindow = win;
    state.formOpened = true;
    startTimer();
    try {
      window.focus();
    } catch (_) {}
  }

  function prepareSUSUI() {
    const v = currentVersion();
    $("sus-version-label").textContent = "Version " + v;
    buildSUSForm();
    hide($("sus-error"));
  }

  function stopTimerDisplayOnly() {
    if (state.timerInterval) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
    }
  }

  function startTimer() {
    if (state.timerStartedAt) return;
    state.timerStartedAt = performance.now();
    stopTimerDisplayOnly();
    state.timerInterval = setInterval(() => {
      const elapsed =
        state.timerAccumMs + (performance.now() - state.timerStartedAt);
      $("timer-display").textContent = formatTime(elapsed);
    }, 250);
  }

  function stopTimer() {
    if (state.timerStartedAt) {
      state.timerAccumMs += performance.now() - state.timerStartedAt;
      state.timerStartedAt = null;
    }
    stopTimerDisplayOnly();
    $("timer-display").textContent = formatTime(state.timerAccumMs);
    return Math.round(state.timerAccumMs);
  }

  async function startFormRecording(version) {
    state._stoppingPromise = null;
    state.recordingVersion = version;
    state.chunks = [];

    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
    });
    state.stream = stream;

    let mime = "video/webm;codecs=vp8";
    if (!MediaRecorder.isTypeSupported(mime)) mime = "video/webm";
    if (!MediaRecorder.isTypeSupported(mime)) mime = "";
    state.recordingMime = mime || "video/webm";

    let recorder;
    try {
      recorder = new MediaRecorder(
        stream,
        mime ? { mimeType: mime, videoBitsPerSecond: 800_000 } : undefined
      );
    } catch (_) {
      recorder = new MediaRecorder(stream);
    }
    state.recorder = recorder;
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size) state.chunks.push(e.data);
    };
    recorder.onstop = null;
    stream.getVideoTracks()[0].addEventListener("ended", () => {
      if (state.recorder && state.recorder.state === "recording") {
        stopRecording(version);
      }
    });
    recorder.start(1000);
    show($("rec-indicator"));
  }

  function finalizeVersionBlob(version) {
    const v = version || state.recordingVersion;
    if (!v) return null;
    const existing = state.versions[v].recordingBlob;
    if ((!existing || !existing.size) && state.chunks.length) {
      state.versions[v].recordingBlob = new Blob(state.chunks, {
        type: state.recordingMime || "video/webm",
      });
    }
    return state.versions[v].recordingBlob;
  }

  function stopRecording(version) {
    const v = version || state.recordingVersion || currentVersion();
    if (state._stoppingPromise) return state._stoppingPromise;

    state._stoppingPromise = new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        setTimeout(() => {
          const blob = finalizeVersionBlob(v);
          if (state.stream) {
            state.stream.getTracks().forEach((t) => t.stop());
            state.stream = null;
          }
          state.recorder = null;
          state.chunks = [];
          state.recordingVersion = null;
          state._stoppingPromise = null;
          hide($("rec-indicator"));
          resolve(blob);
        }, 120);
      };

      if (!state.recorder || state.recorder.state === "inactive") {
        finish();
        return;
      }

      state.recorder.onstop = finish;
      try {
        state.recorder.requestData();
      } catch (_) {}
      try {
        state.recorder.stop();
      } catch (_) {
        finish();
      }
    });

    return state._stoppingPromise;
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const s = String(reader.result || "");
        const i = s.indexOf(",");
        resolve(i >= 0 ? s.slice(i + 1) : s);
      };
      reader.onerror = () => reject(reader.error || new Error("read failed"));
      reader.readAsDataURL(blob);
    });
  }

  function collectSUS() {
    const map = {};
    for (const item of S.susItems) {
      const val = radioValue("sus-" + item.id);
      if (!val) return null;
      map[item.id] = Number(val);
    }
    return map;
  }

  function fileBase() {
    return (
      (state.participantId || "Pxxxx") +
      "_" +
      state.order +
      "_" +
      (state.startedAt || "").slice(0, 10)
    );
  }

  function versionPayload(v) {
    const ver = state.versions[v];
    const blob = ver.recordingBlob;
    return {
      completed: ver.completed,
      taskTimeMs: ver.taskTimeMs,
      sus: { ...ver.sus },
      susScore: ver.susScore,
      recording: blob
        ? {
            mimeType: blob.type,
            bytes: blob.size,
            filename: fileBase() + "_Version" + v + "_recording.webm",
          }
        : null,
    };
  }

  function buildResults() {
    return {
      study: "AB/BA business to business registration usability",
      participantId: state.participantId,
      order: state.order,
      sequence: state.sequence,
      consent: state.consent,
      startedAt: state.startedAt,
      finishedAt: state.finishedAt || new Date().toISOString(),
      versions: {
        A: versionPayload("A"),
        B: versionPayload("B"),
      },
      comparative: { ...state.comparative },
      background: { ...state.background },
      uploadLink: state.uploadLink || null,
      driveUpload: state.driveUpload || null,
    };
  }

  async function encodeVideosForUpload(cfg) {
    const max = cfg.maxVideoBytes || 28 * 1024 * 1024;
    const videos = [];
    for (const v of ["A", "B"]) {
      const blob = state.versions[v].recordingBlob;
      if (!blob || !blob.size) continue;
      if (blob.size > max) continue;
      videos.push({
        version: v,
        base64: await blobToBase64(blob),
        mime: blob.type || "video/webm",
      });
    }
    return { videos: videos };
  }

  async function uploadToDrive() {
    const cfg = window.STUDY_UPLOAD || {};
    if (!cfg.endpoint) {
      console.warn("STUDY_UPLOAD.endpoint is not set; results were not uploaded.");
      return { ok: false, reason: "no-endpoint" };
    }

    try {
      const resultsJson = JSON.stringify(buildResults(), null, 2);
      const { videos } = await encodeVideosForUpload(cfg);
      const payload = {
        secret: cfg.secret,
        participantId: state.participantId,
        order: state.order,
        resultsJson: resultsJson,
        videos: videos,
      };
      const res = await fetch(cfg.endpoint, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
        redirect: "follow",
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (_) {
        throw new Error("Unexpected response from upload service");
      }
      if (!data.ok) throw new Error(data.error || "Upload failed");
      state.driveUpload = data;
      return { ok: true, data: data };
    } catch (err) {
      console.warn("Drive upload failed", err);
      return { ok: false, error: err };
    }
  }

  // ——— Event wiring ———

  document
    .querySelectorAll('input[name="task-complete"]')
    .forEach((r) => {
      r.addEventListener("change", () => {
        $("btn-finish-task").disabled = !radioValue("task-complete");
      });
    });

  $("btn-consent").addEventListener("click", () => {
    hide($("consent-error"));
    const c = radioValue("consent");
    if (!c) {
      $("consent-error").textContent = "Please select Yes or No.";
      show($("consent-error"));
      return;
    }
    if (c === "no") {
      go("step-declined");
      return;
    }
    state.consent = true;
    state.startedAt = new Date().toISOString();
    state.participantId =
      "P" +
      Date.now().toString(36).toUpperCase().slice(-6) +
      Math.floor(Math.random() * 90 + 10);
    assignOrder();
    go("step-share", 2);
  });

  $("btn-share-next").addEventListener("click", () => {
    state.seqIndex = 0;
    prepareTaskUI();
    go("step-task", 3);
  });

  $("btn-open-version").addEventListener("click", () => {
    startRecordingAndOpenForm();
  });

  $("btn-finish-task").addEventListener("click", async () => {
    hide($("task-error"));
    const done = radioValue("task-complete");
    if (!done) {
      $("task-error").textContent =
        "Please indicate whether you completed the task.";
      show($("task-error"));
      return;
    }
    if (!state.timerStartedAt && state.timerAccumMs === 0 && !state.taskAutoFinished) {
      $("task-error").textContent =
        "Please open the form (starts the timer) before continuing.";
      show($("task-error"));
      return;
    }
    if (state.taskAutoFinished) return;
    state.taskAutoFinished = true;
    await finishCurrentTaskAndGoToSUS(done);
  });

  window.addEventListener("message", (event) => {
    const data = event.data;
    if (!data || data.type !== "abba-task-complete") return;
    onTaskAutoComplete();
  });

  $("btn-sus-next").addEventListener("click", async () => {
    hide($("sus-error"));
    const map = collectSUS();
    if (!map) {
      $("sus-error").textContent = "Please answer all 10 statements.";
      show($("sus-error"));
      return;
    }
    const v = currentVersion();
    state.versions[v].sus = map;
    state.versions[v].susScore = scoreSUS(map);

    if (state.seqIndex === 0) {
      state.seqIndex = 1;
      prepareTaskUI();
      go("step-task", 5);
    } else {
      await stopRecording();
      go("step-stop-rec", 7);
    }
  });

  $("btn-after-stop").addEventListener("click", () => go("step-compare", 8));

  $("btn-compare-next").addEventListener("click", () => {
    hide($("compare-error"));
    const overall = radioValue("pref-overall");
    const easier = radioValue("pref-easier");
    if (!overall || !easier) {
      $("compare-error").textContent =
        "Please answer the required preference questions.";
      show($("compare-error"));
      return;
    }
    state.comparative = {
      preferredOverall: overall,
      preferredOverallWhy: $("pref-overall-why").value.trim(),
      easierFlow: easier,
      easierFlowWhy: $("pref-easier-why").value.trim(),
      preferRealLife: radioValue("pref-real"),
      preferRealLifeWhy: $("pref-real-why").value.trim(),
    };
    go("step-background", 9);
  });

  $("btn-background-next").addEventListener("click", () => {
    hide($("bg-error"));
    let role = radioValue("role");
    if (role === "Other") {
      role = ($("role-other") && $("role-other").value.trim()) || "Other";
    }
    let device = radioValue("device");
    if (device === "Other") {
      device = ($("device-other") && $("device-other").value.trim()) || "Other";
    }
    const b2b = radioValue("b2b");
    const prior = radioValue("prior");
    const age = radioValue("age");
    const country = ($("demo-country").value || "").trim();
    if (!role || !b2b || !prior || !device || !age || !country) {
      $("bg-error").textContent = "Please complete all required background questions.";
      show($("bg-error"));
      return;
    }
    state.background = { role, b2bExperience: b2b, priorRegistration: prior, device, country, age };
    state.finishedAt = new Date().toISOString();
    $("btn-background-next").disabled = true;
    go("step-done", 9);
    // Silent upload to Drive — no participant download UI
    uploadToDrive();
  });

  // Init
  fillTestData();
  buildRadioGroup("role-options", "role", S.roles);
  buildRadioGroup("b2b-options", "b2b", S.b2bExperience);
  buildRadioGroup("prior-options", "prior", S.priorRegistration);
  buildRadioGroup("device-options", "device", S.devices);
  buildRadioGroup("age-options", "age", S.ages);
  setProgress(1);

  if (/Mobi|Android/i.test(navigator.userAgent)) {
    show($("mobile-warn"));
  } else {
    hide($("mobile-warn"));
  }
})();
