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
    recordingBlob: null,
    recordingMime: "video/webm",
    iframePoll: null,
    taskAutoFinished: false,
    versions: {
      A: { completed: null, taskTimeMs: 0, sus: {}, susScore: null },
      B: { completed: null, taskTimeMs: 0, sus: {}, susScore: null },
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
    $("btn-open-version").textContent = "Load form & start timer";
    $("btn-open-version").disabled = false;
    $("task-hint").textContent = S.hints[v] || "";
    document
      .querySelectorAll('input[name="task-complete"]')
      .forEach((r) => (r.checked = false));
    $("btn-finish-task").disabled = true;
    hide($("task-error"));
    hide($("timer-auto-msg"));
    stopTimerDisplayOnly();
    stopIframePoll();
    $("timer-display").textContent = "00:00";
    state.timerStartedAt = null;
    state.timerAccumMs = 0;
    state.taskAutoFinished = false;
    const frame = $("form-frame");
    frame.src = "about:blank";
    show($("frame-placeholder"));
  }

  function stopIframePoll() {
    if (state.iframePoll) {
      clearInterval(state.iframePoll);
      state.iframePoll = null;
    }
  }

  function onTaskAutoComplete() {
    if (state.taskAutoFinished) return;
    if (!state.timerStartedAt && state.timerAccumMs === 0) return;
    state.taskAutoFinished = true;
    stopTimer();
    stopIframePoll();
    const yes = document.querySelector(
      'input[name="task-complete"][value="Yes"]'
    );
    if (yes) {
      yes.checked = true;
      $("btn-finish-task").disabled = false;
    }
    show($("timer-auto-msg"));
  }

  function startIframePoll() {
    stopIframePoll();
    state.iframePoll = setInterval(() => {
      const frame = $("form-frame");
      try {
        const href = frame.contentWindow.location.href || "";
        if (/04-confirmation\.html/i.test(href)) {
          onTaskAutoComplete();
        }
      } catch (_) {
        // cross-origin (Version A) — rely on postMessage
      }
    }, 600);
  }

  function loadFormAndStartTimer() {
    const v = currentVersion();
    const frame = $("form-frame");
    hide($("frame-placeholder"));
    frame.classList.add("is-loading");
    frame.src = S.urls[v];
    frame.onload = () => {
      frame.classList.remove("is-loading");
      // Version A opens login; try to open signup if same API available — can't cross-origin.
      // URL already has ?signup=yes for A.
    };
    startTimer();
    startIframePoll();
    $("btn-open-version").disabled = true;
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

  async function startRecording() {
    hide($("share-error"));
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: 15,
          displaySurface: "browser",
        },
        audio: false,
        // Chromium: prefer sharing this study tab only (forms run inside it)
        preferCurrentTab: true,
        selfBrowserSurface: "include",
        surfaceSwitching: "exclude",
        systemAudio: "exclude",
      });
      state.stream = stream;
      state.chunks = [];

      let mime = "video/webm;codecs=vp9";
      if (!MediaRecorder.isTypeSupported(mime)) mime = "video/webm";
      if (!MediaRecorder.isTypeSupported(mime)) mime = "";
      state.recordingMime = mime || "video/webm";

      const recorder = new MediaRecorder(
        stream,
        mime ? { mimeType: mime, videoBitsPerSecond: 600_000 } : undefined
      );
      state.recorder = recorder;
      state.chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size) state.chunks.push(e.data);
      };
      recorder.onstop = null; // handled in stopRecording()
      stream.getVideoTracks()[0].addEventListener("ended", () => {
        if (state.recorder && state.recorder.state === "recording") {
          stopRecording();
        }
      });
      recorder.start(1000);
      show($("rec-indicator"));
      show($("share-ok"));
      show($("btn-share-next"));
      $("btn-start-share").disabled = true;
    } catch (err) {
      $("share-error").textContent =
        "Sharing was blocked or cancelled. Please try again and choose this browser tab (not your entire screen).";
      show($("share-error"));
    }
  }

  function finalizeRecordingBlob() {
    if ((!state.recordingBlob || state.recordingBlob.size === 0) && state.chunks.length) {
      state.recordingBlob = new Blob(state.chunks, {
        type: state.recordingMime || "video/webm",
      });
    }
    return state.recordingBlob;
  }

  function stopRecording() {
    if (state._stoppingPromise) return state._stoppingPromise;

    state._stoppingPromise = new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        // Allow a final ondataavailable after stop
        setTimeout(() => {
          finalizeRecordingBlob();
          if (state.stream) {
            state.stream.getTracks().forEach((t) => t.stop());
            state.stream = null;
          }
          hide($("rec-indicator"));
          resolve(state.recordingBlob);
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

  function downloadBlob(blob, filename) {
    if (!blob || !blob.size) {
      throw new Error("Empty file");
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(url);
    }, 2500);
  }

  function downloadJSON() {
    const data = buildResults();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    downloadBlob(blob, fileBase() + "_results.json");
  }

  function downloadVideo() {
    finalizeRecordingBlob();
    if (!state.recordingBlob || !state.recordingBlob.size) {
      alert(
        "No recording is available yet. Make sure you shared this tab and completed both tasks."
      );
      return;
    }
    const ext = (state.recordingBlob.type || "").includes("mp4") ? "mp4" : "webm";
    downloadBlob(state.recordingBlob, fileBase() + "_recording." + ext);
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

  function buildResults() {
    finalizeRecordingBlob();
    return {
      study: "AB/BA B2B registration usability",
      participantId: state.participantId,
      order: state.order,
      sequence: state.sequence,
      consent: state.consent,
      startedAt: state.startedAt,
      finishedAt: state.finishedAt || new Date().toISOString(),
      versions: {
        A: { ...state.versions.A },
        B: { ...state.versions.B },
      },
      comparative: { ...state.comparative },
      background: { ...state.background },
      uploadLink: state.uploadLink || null,
      driveUpload: state.driveUpload || null,
      recording: state.recordingBlob
        ? {
            mimeType: state.recordingBlob.type,
            bytes: state.recordingBlob.size,
            filename: fileBase() + "_recording.webm",
          }
        : null,
    };
  }

  function updateMailto() {
    const subject = encodeURIComponent(
      "AB/BA study results — " + state.participantId + " (" + state.order + ")"
    );
    const body = encodeURIComponent(
      "Hello Maja,\n\nPlease find attached:\n1) " +
        fileBase() +
        "_results.json\n2) " +
        fileBase() +
        "_recording.webm\n\nParticipant ID: " +
        state.participantId +
        "\nOrder: " +
        state.order +
        "\n\nThank you."
    );
    const mail = $("btn-mailto");
    if (mail) {
      mail.href =
        "mailto:" + S.researcherEmail + "?subject=" + subject + "&body=" + body;
    }
  }

  function fallbackDownloadBoth() {
    try {
      downloadJSON();
    } catch (_) {}
    try {
      if (state.recordingBlob && state.recordingBlob.size) downloadVideo();
    } catch (_) {}
  }

  async function uploadToDrive() {
    const cfg = window.STUDY_UPLOAD || {};
    const status = $("upload-status");
    const setStatus = (msg, isError) => {
      if (!status) return;
      status.textContent = msg;
      status.classList.toggle("error", !!isError);
      status.classList.toggle("ok", !isError);
      show(status);
    };

    if (!cfg.endpoint) {
      setStatus(
        "Drive upload is not configured yet on this site. Downloading files now — please email them to the researcher.",
        true
      );
      fallbackDownloadBoth();
      return { ok: false, reason: "no-endpoint" };
    }

    finalizeRecordingBlob();
    const results = buildResults();
    const resultsJson = JSON.stringify(results, null, 2);

    setStatus("Uploading results to Google Drive…");

    let videoBase64 = null;
    let videoSkipped = false;
    if (state.recordingBlob && state.recordingBlob.size) {
      if (state.recordingBlob.size > (cfg.maxVideoBytes || 28 * 1024 * 1024)) {
        videoSkipped = true;
        setStatus(
          "Results JSON uploading… Video is large; it will download so you can add it to Drive manually."
        );
      } else {
        setStatus("Preparing video for upload…");
        videoBase64 = await blobToBase64(state.recordingBlob);
      }
    }

    setStatus("Sending to Google Drive…");
    const payload = {
      secret: cfg.secret,
      participantId: state.participantId,
      order: state.order,
      resultsJson: resultsJson,
      videoBase64: videoBase64,
      videoMime: state.recordingBlob ? state.recordingBlob.type : null,
    };

    try {
      const res = await fetch(cfg.endpoint, {
        method: "POST",
        // text/plain avoids CORS preflight with Apps Script
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
      let msg =
        "Uploaded to Google Drive. JSON: " +
        (data.json && data.json.name ? data.json.name : "saved");
      if (data.video && data.video.name) {
        msg += " · Video: " + data.video.name;
      } else if (videoSkipped || !state.recordingBlob) {
        msg +=
          " · Video not uploaded (too large or missing) — use Download recording.";
        if (state.recordingBlob) {
          try {
            downloadVideo();
          } catch (_) {}
        }
      }
      setStatus(msg, false);
      return { ok: true, data: data, videoSkipped: videoSkipped };
    } catch (err) {
      setStatus(
        "Automatic Drive upload failed (" +
          (err && err.message ? err.message : "error") +
          "). Downloading files instead — please email them or add them to the Drive folder.",
        true
      );
      try {
        downloadJSON();
      } catch (_) {}
      try {
        if (state.recordingBlob) downloadVideo();
      } catch (_) {}
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
    $("order-label").textContent =
      state.order === "AB"
        ? "Version A first, then Version B"
        : "Version B first, then Version A";
    go("step-share", 2);
  });

  $("btn-start-share").addEventListener("click", () => startRecording());

  $("btn-share-next").addEventListener("click", () => {
    state.seqIndex = 0;
    prepareTaskUI();
    go("step-task", 3);
  });

  $("btn-open-version").addEventListener("click", () => {
    loadFormAndStartTimer();
  });

  $("btn-finish-task").addEventListener("click", () => {
    hide($("task-error"));
    const done = radioValue("task-complete");
    if (!done) {
      $("task-error").textContent =
        "Please indicate whether you completed the task.";
      show($("task-error"));
      return;
    }
    if (!state.timerStartedAt && state.timerAccumMs === 0) {
      $("task-error").textContent =
        "Please load the form (starts the timer) before continuing.";
      show($("task-error"));
      return;
    }
    const v = currentVersion();
    const ms = stopTimer();
    stopIframePoll();
    state.versions[v].completed = done;
    state.versions[v].taskTimeMs = ms;
    // Clear iframe to free resources
    $("form-frame").src = "about:blank";
    prepareSUSUI();
    go("step-sus", state.seqIndex === 0 ? 4 : 6);
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
    finalizeRecordingBlob();
    updateMailto();
    $("download-status").textContent =
      "Participant " +
      state.participantId +
      " · Order " +
      state.order +
      " · SUS A: " +
      state.versions.A.susScore +
      " · SUS B: " +
      state.versions.B.susScore;
    go("step-download", 9);
    // Auto-upload to Drive (same user gesture; no setTimeout so downloads still work as fallback)
    uploadToDrive();
  });

  $("btn-dl-json").addEventListener("click", downloadJSON);
  $("btn-dl-video").addEventListener("click", downloadVideo);
  $("btn-dl-json-again").addEventListener("click", downloadJSON);
  $("btn-dl-video-again").addEventListener("click", downloadVideo);
  const btnUpload = $("btn-upload-drive");
  if (btnUpload) {
    btnUpload.addEventListener("click", () => uploadToDrive());
  }

  $("btn-finish").addEventListener("click", () => {
    state.uploadLink = ($("upload-link").value || "").trim();
    go("step-done");
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
