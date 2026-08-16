/**
 * AB/BA remote study harness — consent, screen capture, timers, dual SUS, downloads.
 */
(function () {
  const URL_A = "https://majakle.github.io/sign-up/?signup=yes";
  const URL_B = "https://majakle.github.io/partner-access-redesign/";

  const SUS_ITEMS = [
    "I think I would be willing to use this registration process again if needed.",
    "I found the registration process unnecessarily complex.",
    "I thought the registration process was easy to use.",
    "I think I would need support from a technically experienced person to complete the registration.",
    "I found that the different parts of the registration process were well integrated.",
    "I thought there was too much inconsistency in the registration process.",
    "I imagine that most people would learn to use this registration process very quickly.",
    "I found the registration process very cumbersome to use.",
    "I felt confident while completing the registration process.",
    "I needed to learn many things before I could complete the registration process.",
  ];

  const SCALE = [
    { value: 1, label: "Strongly disagree" },
    { value: 2, label: "Disagree" },
    { value: 3, label: "Neither" },
    { value: 4, label: "Agree" },
    { value: 5, label: "Strongly agree" },
  ];

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

  const STORAGE_KEY = "abbaHarnessV1";

  const state = {
    step: "consent",
    participantId: "",
    order: null,
    design1Code: null,
    design2Code: null,
    recordingConsent: false,
    stream: null,
    recorder: null,
    chunks: [],
    videoBlob: null,
    recordingStoppedEarly: false,
    currentDesignSlot: 1,
    tasks: {
      1: emptyTask(),
      2: emptyTask(),
    },
    timerRaf: null,
    sus: { 1: {}, 2: {} },
    comparative: {},
    demographics: {},
  };

  function emptyTask() {
    return {
      code: null,
      url: null,
      openedAt: null,
      finishedAt: null,
      startPerf: null,
      endPerf: null,
      task_time_ms: null,
      completion: null,
      timerRunning: false,
    };
  }

  function $(id) {
    return document.getElementById(id);
  }

  function showStep(id) {
    document.querySelectorAll(".step").forEach((el) => el.classList.add("hidden"));
    const step = $("step-" + id);
    if (step) step.classList.remove("hidden");
    state.step = id;
    persist();
    window.scrollTo(0, 0);
  }

  function persist() {
    try {
      const snap = {
        step: state.step,
        participantId: state.participantId,
        order: state.order,
        design1Code: state.design1Code,
        design2Code: state.design2Code,
        recordingConsent: state.recordingConsent,
        currentDesignSlot: state.currentDesignSlot,
        tasks: {
          1: {
            ...state.tasks[1],
            timerRunning: false,
            startPerf: null,
            endPerf: null,
          },
          2: {
            ...state.tasks[2],
            timerRunning: false,
            startPerf: null,
            endPerf: null,
          },
        },
        sus: state.sus,
        comparative: state.comparative,
        demographics: state.demographics,
        recordingStoppedEarly: state.recordingStoppedEarly,
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
    } catch (_) {
      /* ignore */
    }
  }

  function restore() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const snap = JSON.parse(raw);
      Object.assign(state, {
        participantId: snap.participantId || "",
        order: snap.order,
        design1Code: snap.design1Code,
        design2Code: snap.design2Code,
        recordingConsent: snap.recordingConsent,
        currentDesignSlot: snap.currentDesignSlot || 1,
        sus: snap.sus || { 1: {}, 2: {} },
        comparative: snap.comparative || {},
        demographics: snap.demographics || {},
        recordingStoppedEarly: !!snap.recordingStoppedEarly,
      });
      if (snap.tasks) {
        state.tasks[1] = { ...emptyTask(), ...snap.tasks[1] };
        state.tasks[2] = { ...emptyTask(), ...snap.tasks[2] };
      }
    } catch (_) {
      /* ignore */
    }
  }

  function assignOrder(pid) {
    const digits = String(pid).replace(/\D/g, "");
    if (digits) {
      const n = parseInt(digits.slice(-1), 10);
      return n % 2 === 1 ? "AB" : "BA";
    }
    return Math.random() < 0.5 ? "AB" : "BA";
  }

  function applyOrder(order) {
    state.order = order;
    if (order === "AB") {
      state.design1Code = "A";
      state.design2Code = "B";
    } else {
      state.design1Code = "B";
      state.design2Code = "A";
    }
    state.tasks[1].code = state.design1Code;
    state.tasks[1].url = state.design1Code === "A" ? URL_A : URL_B;
    state.tasks[2].code = state.design2Code;
    state.tasks[2].url = state.design2Code === "A" ? URL_A : URL_B;
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

  function designHint(code) {
    if (code === "A") {
      return "Tip: If you see a sign-in screen, click Create account first. Fill the registration form with the test data, accept terms if required, then submit.";
    }
    return "Tip: Click Start partner application. On the company step, search Company XY (or the VAT), then Use these details. Complete the remaining steps.";
  }

  function formatMs(ms) {
    const s = Math.floor((ms || 0) / 1000);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return String(m).padStart(2, "0") + ":" + String(r).padStart(2, "0");
  }

  function updateTimerDisplay() {
    const slot = state.currentDesignSlot;
    const t = state.tasks[slot];
    if (!t.timerRunning || t.startPerf == null) {
      $("timer-display").textContent = formatMs(t.task_time_ms || 0);
      return;
    }
    const elapsed = performance.now() - t.startPerf;
    $("timer-display").textContent = formatMs(elapsed);
    state.timerRaf = requestAnimationFrame(updateTimerDisplay);
  }

  function startTimer(slot) {
    const t = state.tasks[slot];
    if (t.timerRunning) return;
    t.startPerf = performance.now();
    t.openedAt = new Date().toISOString();
    t.timerRunning = true;
    t.finishedAt = null;
    t.endPerf = null;
    t.task_time_ms = null;
    cancelAnimationFrame(state.timerRaf);
    updateTimerDisplay();
    persist();
  }

  function stopTimer(slot) {
    const t = state.tasks[slot];
    if (t.timerRunning && t.startPerf != null) {
      t.endPerf = performance.now();
      t.task_time_ms = Math.round(t.endPerf - t.startPerf);
      t.finishedAt = new Date().toISOString();
      t.timerRunning = false;
      cancelAnimationFrame(state.timerRaf);
      $("timer-display").textContent = formatMs(t.task_time_ms);
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
        persist();
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
      $("btn-share-continue").classList.remove("hidden");
      $("btn-start-share").disabled = true;
    } catch (err) {
      $("share-error").textContent =
        "Screen share was blocked or cancelled. Please try again and choose Entire screen.";
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
      if (state.stream) {
        state.stream.getTracks().forEach((t) => t.stop());
      }
    });
  }

  function scoreSus(answers) {
    let sum = 0;
    for (let i = 1; i <= 10; i++) {
      const r = Number(answers[i]);
      if (!r) return null;
      if (i % 2 === 1) sum += r - 1;
      else sum += 5 - r;
    }
    return sum * 2.5;
  }

  function buildSusForm(slot) {
    const form = $("sus-form");
    form.innerHTML = "";
    SUS_ITEMS.forEach((text, idx) => {
      const n = idx + 1;
      const item = document.createElement("div");
      item.className = "sus-item";
      item.innerHTML = `<p>${n}. ${text}</p>`;
      const scale = document.createElement("div");
      scale.className = "sus-scale";
      SCALE.forEach((opt) => {
        const id = `sus${slot}-${n}-${opt.value}`;
        const lab = document.createElement("label");
        lab.innerHTML = `<input type="radio" name="sus${slot}-${n}" value="${opt.value}" id="${id}" /><span>${opt.label}</span>`;
        if (String(state.sus[slot][n]) === String(opt.value)) {
          lab.querySelector("input").checked = true;
        }
        scale.appendChild(lab);
      });
      item.appendChild(scale);
      form.appendChild(item);
    });
  }

  function readSus(slot) {
    const answers = {};
    for (let n = 1; n <= 10; n++) {
      const el = document.querySelector(
        `input[name="sus${slot}-${n}"]:checked`
      );
      if (!el) return null;
      answers[n] = Number(el.value);
    }
    state.sus[slot] = answers;
    persist();
    return answers;
  }

  function buildResults() {
    const sus1 = state.sus[1];
    const sus2 = state.sus[2];
    return {
      study: "AB/BA partner registration harness",
      exported_at: new Date().toISOString(),
      participant_id: state.participantId,
      assigned_order: state.order,
      design1: {
        label: "Design 1",
        code: state.design1Code,
        url: state.tasks[1].url,
        completion: state.tasks[1].completion,
        opened_at: state.tasks[1].openedAt,
        finished_at: state.tasks[1].finishedAt,
        task_time_ms: state.tasks[1].task_time_ms,
        task_time_s:
          state.tasks[1].task_time_ms != null
            ? Math.round(state.tasks[1].task_time_ms / 1000)
            : null,
        sus_raw: sus1,
        sus_score: scoreSus(sus1),
      },
      design2: {
        label: "Design 2",
        code: state.design2Code,
        url: state.tasks[2].url,
        completion: state.tasks[2].completion,
        opened_at: state.tasks[2].openedAt,
        finished_at: state.tasks[2].finishedAt,
        task_time_ms: state.tasks[2].task_time_ms,
        task_time_s:
          state.tasks[2].task_time_ms != null
            ? Math.round(state.tasks[2].task_time_ms / 1000)
            : null,
        sus_raw: sus2,
        sus_score: scoreSus(sus2),
      },
      recording_stopped_early: state.recordingStoppedEarly,
      comparative: state.comparative,
      demographics: state.demographics,
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

  function downloadJson() {
    const data = buildResults();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const id = state.participantId.replace(/[^\w.-]+/g, "_") || "participant";
    downloadBlob(blob, `${id}_results.json`);
  }

  function downloadVideo() {
    if (!state.videoBlob) {
      alert("No recording available yet.");
      return;
    }
    const id = state.participantId.replace(/[^\w.-]+/g, "_") || "participant";
    const ext = (state.videoBlob.type || "").includes("mp4") ? "mp4" : "webm";
    downloadBlob(state.videoBlob, `${id}_recording.${ext}`);
  }

  function setupTaskStep(slot) {
    state.currentDesignSlot = slot;
    const t = state.tasks[slot];
    $("task-title").textContent = `Design ${slot} — registration task`;
    $("task-intro").textContent = `Open Design ${slot} in a new tab, complete the partner registration task with the fictional data, then return here. The timer starts when you open the design.`;
    $("task-hint").textContent = designHint(t.code);
    $("btn-open-design").textContent = `Open Design ${slot}`;
    $("btn-finish-task").disabled = true;
    document.querySelectorAll('input[name="task-complete"]').forEach((el) => {
      el.checked = false;
    });
    $("task-error").classList.add("hidden");
    $("timer-display").textContent = formatMs(t.task_time_ms || 0);
    showStep("task");
  }

  function setupSusStep(slot) {
    state.currentDesignSlot = slot;
    $("sus-title").textContent = `Usability questionnaire — Design ${slot}`;
    $("sus-intro").textContent = `Thinking only about Design ${slot} you just used, how much do you agree with each statement?`;
    buildSusForm(slot);
    $("sus-error").classList.add("hidden");
    showStep("sus");
  }

  $("btn-consent-continue").addEventListener("click", () => {
    const pid = $("participant-id").value.trim();
    const study = document.querySelector('input[name="consent-study"]:checked');
    const rec = document.querySelector('input[name="consent-record"]:checked');
    const err = $("consent-error");
    err.classList.add("hidden");

    if (!pid) {
      err.textContent = "Please enter your participant ID.";
      err.classList.remove("hidden");
      return;
    }
    if (!study || study.value !== "yes") {
      showStep("declined");
      return;
    }
    if (!rec || rec.value !== "yes") {
      showStep("declined");
      return;
    }

    state.participantId = pid;
    state.recordingConsent = true;
    applyOrder(assignOrder(pid));
    $("order-label").textContent =
      "Design 1 → Design 2 (session code " + state.order + ")";
    persist();
    showStep("share");
  });

  $("btn-start-share").addEventListener("click", () => {
    startShare();
  });

  $("btn-share-continue").addEventListener("click", () => {
    if (!state.recorder || state.recorder.state === "inactive") {
      $("share-error").textContent = "Please allow screen recording first.";
      $("share-error").classList.remove("hidden");
      return;
    }
    setupTaskStep(1);
  });

  $("btn-open-design").addEventListener("click", () => {
    const slot = state.currentDesignSlot;
    const t = state.tasks[slot];
    window.open(t.url, "_blank", "noopener,noreferrer");
    startTimer(slot);
    $("btn-finish-task").disabled = false;
  });

  $("btn-finish-task").addEventListener("click", () => {
    const slot = state.currentDesignSlot;
    const completion = document.querySelector(
      'input[name="task-complete"]:checked'
    );
    const err = $("task-error");
    err.classList.add("hidden");

    if (!state.tasks[slot].openedAt && state.tasks[slot].startPerf == null) {
      err.textContent = "Please open the design first (timer starts on Open).";
      err.classList.remove("hidden");
      return;
    }
    if (!completion) {
      err.textContent = "Please indicate whether you completed the design.";
      err.classList.remove("hidden");
      return;
    }

    stopTimer(slot);
    state.tasks[slot].completion = completion.value;
    persist();
    setupSusStep(slot);
  });

  $("btn-sus-continue").addEventListener("click", async () => {
    const slot = state.currentDesignSlot;
    const err = $("sus-error");
    err.classList.add("hidden");
    const answers = readSus(slot);
    if (!answers) {
      err.textContent = "Please answer all 10 statements.";
      err.classList.remove("hidden");
      return;
    }

    if (slot === 1) {
      setupTaskStep(2);
      return;
    }

    $("download-status").textContent = "Finalising recording…";
    showStep("download");
    await stopRecorder();
    $("download-status").textContent = state.videoBlob
      ? "Recording ready. Download both files before continuing."
      : "No video blob (share may have ended early). Still download the JSON.";
  });

  $("btn-dl-video").addEventListener("click", downloadVideo);
  $("btn-dl-json").addEventListener("click", downloadJson);
  $("btn-dl-video-again").addEventListener("click", downloadVideo);
  $("btn-dl-json-again").addEventListener("click", downloadJson);

  $("btn-after-download").addEventListener("click", () => {
    showStep("compare");
  });

  $("btn-finish-study").addEventListener("click", () => {
    const err = $("compare-error");
    err.classList.add("hidden");
    const pref = document.querySelector('input[name="pref"]:checked');
    const why = $("pref-why").value.trim();
    const diff = $("pref-diff").value.trim();

    if (!pref || !why || !diff) {
      err.textContent = "Please complete the three comparison questions.";
      err.classList.remove("hidden");
      return;
    }

    state.comparative = {
      preference: pref.value,
      preference_why: why,
      main_difference: diff,
    };
    state.demographics = {
      role: $("demo-role").value,
      b2b_experience: $("demo-b2b").value,
      device: $("demo-device").value,
      country: $("demo-country").value.trim(),
      age_group: $("demo-age").value,
      follow_up_interview: $("demo-interview").value,
      email: $("demo-email").value.trim(),
    };
    persist();
    downloadJson();
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (_) {
      /* ignore */
    }
    showStep("done");
  });

  fillTestData();
  restore();
  showStep("consent");
  if (state.participantId) {
    $("participant-id").value = state.participantId;
  }
})();
