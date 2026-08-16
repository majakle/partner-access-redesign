/**
 * Form-first recording & timing helper (no SUS / comparative UI).
 */
(function () {
  const FORM_URL =
    "https://docs.google.com/forms/d/e/1FAIpQLSeXeWUYzFARmml6SxdrWYBA78pfs4-ltLulygOXVXgUJoUO_g/viewform";
  const URL_A = "https://majakle.github.io/sign-up/?signup=yes";
  const URL_B = "https://majakle.github.io/partner-access-redesign/";

  const TEST_DATA = [
    ["First name", "Anna"],
    ["Last name", "de Vries"],
    ["Work email", "anna@companyxy.test"],
    ["Phone", "NL +31 / 6 12345678"],
    ["Company name", "Company XY"],
    ["VAT ID", "NL123456789B01"],
    ["Postal code", "1234 AB"],
    ["House number", "12"],
    ["Street", "Street"],
    ["City", "City"],
    ["Country", "Netherlands"],
    ["Website (if asked)", "www.companyxy.test"],
    ["Social (if asked)", "instagram.com/companyxy"],
    ["About (if asked)", "Interior retail showroom focused on custom furniture."],
  ];

  const STORAGE_KEY = "abbaHelperV2";

  const state = {
    participantId: "",
    order: null,
    slot: 1,
    stream: null,
    recorder: null,
    chunks: [],
    videoBlob: null,
    recordingStoppedEarly: false,
    timerRaf: null,
    versions: {
      1: emptyVersion(),
      2: emptyVersion(),
    },
  };

  function emptyVersion() {
    return {
      code: null,
      url: null,
      openedAt: null,
      finishedAt: null,
      startPerf: null,
      task_time_ms: null,
      timerRunning: false,
    };
  }

  function $(id) {
    return document.getElementById(id);
  }

  function showStep(name) {
    document.querySelectorAll(".step").forEach((el) => el.classList.add("hidden"));
    const el = $("step-" + name);
    if (el) el.classList.remove("hidden");
    window.scrollTo(0, 0);
    persist();
  }

  function persist() {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          participantId: state.participantId,
          order: state.order,
          slot: state.slot,
          recordingStoppedEarly: state.recordingStoppedEarly,
          versions: {
            1: {
              ...state.versions[1],
              timerRunning: false,
              startPerf: null,
            },
            2: {
              ...state.versions[2],
              timerRunning: false,
              startPerf: null,
            },
          },
        })
      );
    } catch (_) {
      /* ignore */
    }
  }

  function restore() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const snap = JSON.parse(raw);
      state.participantId = snap.participantId || "";
      state.order = snap.order;
      state.slot = snap.slot || 1;
      state.recordingStoppedEarly = !!snap.recordingStoppedEarly;
      if (snap.versions) {
        state.versions[1] = { ...emptyVersion(), ...snap.versions[1] };
        state.versions[2] = { ...emptyVersion(), ...snap.versions[2] };
      }
      if (state.order) applyOrder(state.order);
    } catch (_) {
      /* ignore */
    }
  }

  function applyOrder(order) {
    state.order = order;
    if (order === "AB") {
      state.versions[1].code = "A";
      state.versions[1].url = URL_A;
      state.versions[2].code = "B";
      state.versions[2].url = URL_B;
    } else {
      state.versions[1].code = "B";
      state.versions[1].url = URL_B;
      state.versions[2].code = "A";
      state.versions[2].url = URL_A;
    }
  }

  function fillTestData() {
    const dl = $("test-data-list");
    dl.innerHTML = "";
    TEST_DATA.forEach(([k, v]) => {
      const dt = document.createElement("dt");
      dt.textContent = k;
      const dd = document.createElement("dd");
      dd.textContent = v;
      dl.appendChild(dt);
      dl.appendChild(dd);
    });
  }

  function hintFor(code) {
    if (code === "A") {
      return "Version A: If you see sign-in, click Create account. Fill with test data, then submit.";
    }
    return "Version B: Start partner application. Search Company XY (or VAT), Use these details, finish the steps.";
  }

  function formatMs(ms) {
    const s = Math.floor((ms || 0) / 1000);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return String(m).padStart(2, "0") + ":" + String(r).padStart(2, "0");
  }

  function updateTimerDisplay() {
    const v = state.versions[state.slot];
    if (!v.timerRunning || v.startPerf == null) {
      $("timer-display").textContent = formatMs(v.task_time_ms || 0);
      return;
    }
    $("timer-display").textContent = formatMs(performance.now() - v.startPerf);
    state.timerRaf = requestAnimationFrame(updateTimerDisplay);
  }

  function startTimer() {
    const v = state.versions[state.slot];
    if (v.timerRunning) return;
    v.startPerf = performance.now();
    v.openedAt = new Date().toISOString();
    v.timerRunning = true;
    v.finishedAt = null;
    v.task_time_ms = null;
    cancelAnimationFrame(state.timerRaf);
    updateTimerDisplay();
    persist();
  }

  function stopTimer() {
    const v = state.versions[state.slot];
    if (v.timerRunning && v.startPerf != null) {
      v.task_time_ms = Math.round(performance.now() - v.startPerf);
      v.finishedAt = new Date().toISOString();
      v.timerRunning = false;
      cancelAnimationFrame(state.timerRaf);
      $("timer-display").textContent = formatMs(v.task_time_ms);
    }
    persist();
  }

  function setRecordingUi(on) {
    $("rec-indicator").classList.toggle("hidden", !on);
  }

  async function startShare() {
    $("share-error").classList.add("hidden");
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 15 },
        audio: false,
      });
      state.stream = stream;
      state.chunks = [];
      state.videoBlob = null;
      state.recordingStoppedEarly = false;

      const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : MediaRecorder.isTypeSupported("video/webm")
          ? "video/webm"
          : "";
      const recorder = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream);
      state.recorder = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) state.chunks.push(e.data);
      };
      recorder.onstop = () => {
        state.videoBlob = new Blob(state.chunks, {
          type: recorder.mimeType || "video/webm",
        });
        setRecordingUi(false);
      };

      stream.getVideoTracks()[0].addEventListener("ended", () => {
        state.recordingStoppedEarly = true;
        if (state.recorder && state.recorder.state !== "inactive") {
          state.recorder.stop();
        }
        setRecordingUi(false);
      });

      recorder.start(1000);
      setRecordingUi(true);
      $("share-ok").classList.remove("hidden");
      $("btn-to-version1").classList.remove("hidden");
      $("btn-start-share").disabled = true;
    } catch (_) {
      $("share-error").textContent =
        "Screen share was blocked or cancelled. Try again and choose Entire screen.";
      $("share-error").classList.remove("hidden");
    }
  }

  function stopRecorder() {
    return new Promise((resolve) => {
      if (!state.recorder || state.recorder.state === "inactive") {
        if (state.chunks.length && !state.videoBlob) {
          state.videoBlob = new Blob(state.chunks, { type: "video/webm" });
        }
        resolve();
        return;
      }
      state.recorder.addEventListener("stop", () => resolve(), { once: true });
      try {
        state.recorder.stop();
      } catch (_) {
        resolve();
      }
      if (state.stream) state.stream.getTracks().forEach((t) => t.stop());
    });
  }

  function setupVersionStep(slot) {
    state.slot = slot;
    const v = state.versions[slot];
    $("version-title").textContent =
      "Version " + slot + " (code " + v.code + " in your results file)";
    $("version-intro").textContent =
      "Open the registration form for this version, complete the task with the fictional data, then click Finished. Afterwards, return to the Google Form for the SUS questions.";
    $("version-hint").textContent = hintFor(v.code);
    $("btn-open-version").textContent = "Open Version " + slot;
    $("btn-finish-version").disabled = true;
    $("version-error").classList.add("hidden");
    $("timer-display").textContent = formatMs(v.task_time_ms || 0);
    showStep("version");
  }

  function buildTimesJson() {
    return {
      study: "AB/BA recording helper (Form-first)",
      form_url: FORM_URL,
      exported_at: new Date().toISOString(),
      participant_id: state.participantId,
      assigned_order: state.order,
      recording_stopped_early: state.recordingStoppedEarly,
      version1: {
        slot: 1,
        code: state.versions[1].code,
        url: state.versions[1].url,
        opened_at: state.versions[1].openedAt,
        finished_at: state.versions[1].finishedAt,
        task_time_ms: state.versions[1].task_time_ms,
        task_time_s:
          state.versions[1].task_time_ms != null
            ? Math.round(state.versions[1].task_time_ms / 1000)
            : null,
      },
      version2: {
        slot: 2,
        code: state.versions[2].code,
        url: state.versions[2].url,
        opened_at: state.versions[2].openedAt,
        finished_at: state.versions[2].finishedAt,
        task_time_ms: state.versions[2].task_time_ms,
        task_time_s:
          state.versions[2].task_time_ms != null
            ? Math.round(state.versions[2].task_time_ms / 1000)
            : null,
      },
      url_map: { A: URL_A, B: URL_B },
    };
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function fileId() {
    return state.participantId.replace(/[^\w.-]+/g, "_") || "participant";
  }

  function downloadJson() {
    downloadBlob(
      new Blob([JSON.stringify(buildTimesJson(), null, 2)], {
        type: "application/json",
      }),
      fileId() + "_times.json"
    );
  }

  function downloadVideo() {
    if (!state.videoBlob) {
      alert("No recording available yet.");
      return;
    }
    const ext = (state.videoBlob.type || "").includes("mp4") ? "mp4" : "webm";
    downloadBlob(state.videoBlob, fileId() + "_recording." + ext);
  }

  // Query params: ?pid=P21&order=AB
  function applyQuery() {
    const q = new URLSearchParams(location.search);
    const pid = q.get("pid");
    const order = q.get("order");
    if (pid) {
      state.participantId = pid;
      $("participant-id").value = pid;
    }
    if (order === "AB" || order === "BA") {
      applyOrder(order);
      document.querySelectorAll('input[name="order"]').forEach((el) => {
        el.checked = el.value === order;
      });
    }
  }

  $("btn-start-share").addEventListener("click", () => {
    const pid = $("participant-id").value.trim();
    const orderEl = document.querySelector('input[name="order"]:checked');
    $("share-error").classList.add("hidden");
    if (!pid) {
      $("share-error").textContent = "Enter your participant ID.";
      $("share-error").classList.remove("hidden");
      return;
    }
    if (!orderEl) {
      $("share-error").textContent = "Select AB or BA (same as in the Form).";
      $("share-error").classList.remove("hidden");
      return;
    }
    state.participantId = pid;
    applyOrder(orderEl.value);
    persist();
    startShare();
  });

  $("btn-to-version1").addEventListener("click", () => {
    if (!state.recorder || state.recorder.state === "inactive") {
      $("share-error").textContent = "Allow screen recording first.";
      $("share-error").classList.remove("hidden");
      return;
    }
    setupVersionStep(1);
  });

  $("btn-open-version").addEventListener("click", () => {
    const v = state.versions[state.slot];
    window.open(v.url, "_blank", "noopener,noreferrer");
    startTimer();
    $("btn-finish-version").disabled = false;
  });

  $("btn-finish-version").addEventListener("click", async () => {
    const v = state.versions[state.slot];
    const err = $("version-error");
    err.classList.add("hidden");
    if (!v.openedAt && v.startPerf == null) {
      err.textContent = "Open this version first (timer starts on Open).";
      err.classList.remove("hidden");
      return;
    }
    stopTimer();

    if (state.slot === 1) {
      $("time-v1").textContent = formatMs(state.versions[1].task_time_ms);
      showStep("between");
      return;
    }

    $("sum-t1").textContent = formatMs(state.versions[1].task_time_ms);
    $("sum-t2").textContent = formatMs(state.versions[2].task_time_ms);
    $("download-status").textContent = "Finalising recording…";
    showStep("download");
    await stopRecorder();
    $("download-status").textContent = state.videoBlob
      ? "Ready — download both files, then continue in the Form."
      : "No video (share may have ended early). Still download the times JSON.";
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (_) {
      /* ignore */
    }
  });

  $("btn-to-version2").addEventListener("click", () => {
    setupVersionStep(2);
  });

  $("btn-dl-video").addEventListener("click", downloadVideo);
  $("btn-dl-json").addEventListener("click", downloadJson);

  fillTestData();
  restore();
  applyQuery();
  if (state.participantId) $("participant-id").value = state.participantId;
  showStep("setup");
})();
