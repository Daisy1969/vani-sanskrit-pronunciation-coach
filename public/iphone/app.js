(() => {
  'use strict';

  const STORAGE_KEY = 'vani-surya-shakti-iphone-v1';
  const SETTINGS_KEY = 'vani-surya-shakti-iphone-settings-v1';

  const poses = [
    { name: 'Samasthiti', pronunciation: 'suh-muh-STHI-tee', icon: '🧍', aliases: ['samasthiti', 'sama sthiti', 'samastiti', 'samas tithi', 'samasthithi'] },
    { name: 'Namaskar', pronunciation: 'nuh-muh-SKAR', icon: '🙏', aliases: ['namaskar', 'namaskara', 'namaskaar', 'namaste'] },
    { name: 'Urdhva Hastasana', pronunciation: 'oordh-vah hah-STAH-suh-nuh', icon: '🙆', aliases: ['urdhva hastasana', 'urdva hastasana', 'oordhva hastasana', 'urdhva hasta asana', 'urdva hasta sana'] },
    { name: 'Padahastasana', pronunciation: 'pah-dah-hah-STAH-suh-nuh', icon: '🙇', aliases: ['padahastasana', 'pada hastasana', 'padahasta asana', 'pada hasta sana', 'pad hastasana'] },
    { name: 'Ashwa Sanchalanasana', pronunciation: 'AHSH-wah sun-chah-lah-NAH-suh-nuh', icon: '🧎', aliases: ['ashwa sanchalanasana', 'aswa sanchalanasana', 'ashva sanchalanasana', 'ashwa sanchalana asana', 'ashwa san chalana sana'] },
    { name: 'Parvatasana', pronunciation: 'par-vah-TAHS-uh-nuh', icon: '🔺', aliases: ['parvatasana', 'parvata asana', 'parvata sana', 'parvat asana', 'mountain pose'] },
    { name: 'Sashtanga', pronunciation: 'sah-SHTAHN-gah', icon: '⬇️', aliases: ['sashtanga', 'sastanga', 'sashtang', 'ashtanga', 'eight points pose'] },
    { name: 'Bhujangasana', pronunciation: 'bhoo-jun-GAH-suh-nuh', icon: '🐍', aliases: ['bhujangasana', 'bhujanga asana', 'bhujanga sana', 'bujangasana', 'cobra pose'] },
    { name: 'Parvatasana', pronunciation: 'par-vah-TAHS-uh-nuh', icon: '🔺', aliases: ['parvatasana', 'parvata asana', 'parvata sana', 'parvat asana', 'mountain pose'] },
    { name: 'Padahastasana', pronunciation: 'pah-dah-hah-STAH-suh-nuh', icon: '🙇', aliases: ['padahastasana', 'pada hastasana', 'padahasta asana', 'pada hasta sana', 'pad hastasana'] },
    { name: 'Ashwa Sanchalanasana', pronunciation: 'AHSH-wah sun-chah-lah-NAH-suh-nuh', icon: '🧎', aliases: ['ashwa sanchalanasana', 'aswa sanchalanasana', 'ashva sanchalanasana', 'ashwa sanchalana asana', 'ashwa san chalana sana'] },
    { name: 'Parvatasana', pronunciation: 'par-vah-TAHS-uh-nuh', icon: '🔺', aliases: ['parvatasana', 'parvata asana', 'parvata sana', 'parvat asana', 'mountain pose'] },
    { name: 'Sashtanga', pronunciation: 'sah-SHTAHN-gah', icon: '⬇️', aliases: ['sashtanga', 'sastanga', 'sashtang', 'ashtanga', 'eight points pose'] },
    { name: 'Bhujangasana', pronunciation: 'bhoo-jun-GAH-suh-nuh', icon: '🐍', aliases: ['bhujangasana', 'bhujanga asana', 'bhujanga sana', 'bujangasana', 'cobra pose'] },
    { name: 'Parvatasana', pronunciation: 'par-vah-TAHS-uh-nuh', icon: '🔺', aliases: ['parvatasana', 'parvata asana', 'parvata sana', 'parvat asana', 'mountain pose'] },
    { name: 'Padahastasana', pronunciation: 'pah-dah-hah-STAH-suh-nuh', icon: '🙇', aliases: ['padahastasana', 'pada hastasana', 'padahasta asana', 'pada hasta sana', 'pad hastasana'] },
    { name: 'Urdhva Hastasana', pronunciation: 'oordh-vah hah-STAH-suh-nuh', icon: '🙆', aliases: ['urdhva hastasana', 'urdva hastasana', 'oordhva hastasana', 'urdhva hasta asana', 'urdva hasta sana'] },
    { name: 'Namaskar', pronunciation: 'nuh-muh-SKAR', icon: '🙏', aliases: ['namaskar', 'namaskara', 'namaskaar', 'namaste'] }
  ];

  const elements = {
    todayCycles: document.querySelector('#todayCycles'),
    daysCompleted: document.querySelector('#daysCompleted'),
    streakDays: document.querySelector('#streakDays'),
    sessionCycles: document.querySelector('#sessionCycles'),
    poseNumber: document.querySelector('#poseNumber'),
    poseIcon: document.querySelector('#poseIcon'),
    poseName: document.querySelector('#poseName'),
    posePronunciation: document.querySelector('#posePronunciation'),
    instruction: document.querySelector('#instruction'),
    heardText: document.querySelector('#heardText'),
    listeningIndicator: document.querySelector('#listeningIndicator'),
    startButton: document.querySelector('#startButton'),
    listenButton: document.querySelector('#listenButton'),
    confirmButton: document.querySelector('#confirmButton'),
    pauseButton: document.querySelector('#pauseButton'),
    sequenceDots: document.querySelector('#sequenceDots'),
    historyList: document.querySelector('#historyList'),
    settingsButton: document.querySelector('#settingsButton'),
    settingsDialog: document.querySelector('#settingsDialog'),
    voicePreference: document.querySelector('#voicePreference'),
    speechRate: document.querySelector('#speechRate'),
    speechRateValue: document.querySelector('#speechRateValue'),
    autoContinue: document.querySelector('#autoContinue'),
    resetTodayButton: document.querySelector('#resetTodayButton')
  };

  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const state = {
    running: false,
    paused: false,
    speaking: false,
    listening: false,
    accepted: false,
    poseIndex: 0,
    sessionCycles: 0,
    retryCount: 0,
    recognition: null,
    wakeLock: null,
    progress: loadJson(STORAGE_KEY, { days: {} }),
    settings: loadJson(SETTINGS_KEY, {
      voicePreference: 'system',
      speechRate: 0.82,
      autoContinue: true
    })
  };

  function loadJson(key, fallback) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key));
      return parsed && typeof parsed === 'object' ? parsed : fallback;
    } catch {
      return fallback;
    }
  }

  function saveProgress() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
  }

  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
  }

  function localDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function shiftDate(key, amount) {
    const [year, month, day] = key.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + amount);
    return localDateKey(date);
  }

  function todayCycles() {
    return state.progress.days[localDateKey()]?.cycles || 0;
  }

  function completedDays() {
    return Object.values(state.progress.days).filter(day => Number(day.cycles) > 0).length;
  }

  function currentStreak() {
    const today = localDateKey();
    let cursor = state.progress.days[today]?.cycles > 0 ? today : shiftDate(today, -1);
    let count = 0;
    while (state.progress.days[cursor]?.cycles > 0) {
      count += 1;
      cursor = shiftDate(cursor, -1);
    }
    return count;
  }

  function recordCompletedCycle() {
    const key = localDateKey();
    const existing = state.progress.days[key] || { cycles: 0 };
    existing.cycles = Number(existing.cycles || 0) + 1;
    existing.lastCompletedAt = new Date().toISOString();
    state.progress.days[key] = existing;
    saveProgress();
    return existing.cycles;
  }

  function renderProgress() {
    elements.todayCycles.textContent = String(todayCycles());
    elements.daysCompleted.textContent = String(completedDays());
    elements.streakDays.textContent = String(currentStreak());
    elements.sessionCycles.textContent = `Session: ${state.sessionCycles} ${state.sessionCycles === 1 ? 'cycle' : 'cycles'}`;

    const entries = Object.entries(state.progress.days)
      .filter(([, value]) => value.cycles > 0)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 21);

    if (!entries.length) {
      elements.historyList.innerHTML = '<p class="empty-history">Complete one full cycle to begin your history.</p>';
      return;
    }

    elements.historyList.innerHTML = entries.map(([key, value]) => {
      const [year, month, day] = key.split('-').map(Number);
      const label = new Intl.DateTimeFormat(undefined, {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
      }).format(new Date(year, month - 1, day));
      const cycles = Number(value.cycles);
      return `<div class="history-row"><span>${label}</span><strong>${cycles} ${cycles === 1 ? 'cycle' : 'cycles'}</strong></div>`;
    }).join('');
  }

  function createSequenceDots() {
    elements.sequenceDots.innerHTML = poses.map((_, index) => `<span data-index="${index}"></span>`).join('');
  }

  function renderPose() {
    const pose = poses[state.poseIndex];
    elements.poseNumber.textContent = `${state.poseIndex + 1} / ${poses.length}`;
    elements.poseIcon.textContent = pose.icon;
    elements.poseName.textContent = pose.name;
    elements.posePronunciation.textContent = pose.pronunciation;

    for (const dot of elements.sequenceDots.children) {
      const index = Number(dot.dataset.index);
      dot.classList.toggle('done', index < state.poseIndex);
      dot.classList.toggle('current', index === state.poseIndex);
    }
  }

  function setInstruction(text, heard = '') {
    elements.instruction.textContent = text;
    elements.heardText.textContent = heard;
  }

  function setListening(active) {
    state.listening = active;
    elements.listeningIndicator.hidden = !active;
    elements.listenButton.hidden = active || !state.running || state.paused;
  }

  function stopRecognition() {
    if (!state.recognition) return;
    try { state.recognition.abort(); } catch { /* no-op */ }
    state.recognition = null;
    setListening(false);
  }

  function normalise(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function compact(value) {
    return normalise(value).replace(/\s/g, '');
  }

  function editDistance(a, b) {
    const left = compact(a);
    const right = compact(b);
    if (!left.length) return right.length;
    if (!right.length) return left.length;
    const row = Array.from({ length: right.length + 1 }, (_, index) => index);
    for (let i = 1; i <= left.length; i += 1) {
      let previous = row[0];
      row[0] = i;
      for (let j = 1; j <= right.length; j += 1) {
        const held = row[j];
        const cost = left[i - 1] === right[j - 1] ? 0 : 1;
        row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + cost);
        previous = held;
      }
    }
    return row[right.length];
  }

  function similarity(a, b) {
    const left = compact(a);
    const right = compact(b);
    const longest = Math.max(left.length, right.length, 1);
    return 1 - editDistance(left, right) / longest;
  }

  function transcriptMatches(transcript, pose) {
    const heard = normalise(transcript);
    if (heard.length < 3) return false;

    return pose.aliases.some(alias => {
      const expected = normalise(alias);
      if (heard === expected || heard.includes(expected) || expected.includes(heard)) return true;
      const score = similarity(heard, expected);
      const sameOpening = compact(heard).slice(0, 4) === compact(expected).slice(0, 4);
      return score >= 0.59 || (sameOpening && score >= 0.48);
    });
  }

  function chooseVoice() {
    const voices = speechSynthesis.getVoices();
    if (!voices.length) return null;

    const preferredLanguages = voices.filter(voice => /^(en-IN|hi-IN|en-GB|en-AU|en-US)/i.test(voice.lang));
    const pool = preferredLanguages.length ? preferredLanguages : voices;
    const localPool = pool.filter(voice => voice.localService);
    const candidates = localPool.length ? localPool : pool;
    const preference = state.settings.voicePreference;

    const femalePattern = /(female|samantha|veena|lekha|karen|moira|serena|ava|susan|victoria|fiona|tessa|siri.*female)/i;
    const malePattern = /(male|rishi|daniel|alex|aaron|fred|thomas|oliver|siri.*male)/i;

    if (preference === 'female') {
      return candidates.find(voice => femalePattern.test(voice.name)) || candidates[0];
    }
    if (preference === 'male') {
      return candidates.find(voice => malePattern.test(voice.name)) || candidates[0];
    }

    return candidates.find(voice => /^(en-IN|hi-IN)/i.test(voice.lang)) || candidates[0];
  }

  function speak(text, afterSpeaking) {
    stopRecognition();
    speechSynthesis.cancel();
    state.speaking = true;
    setInstruction('Listen');

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = Number(state.settings.speechRate) || 0.82;
    utterance.pitch = 1;
    const voice = chooseVoice();
    if (voice) utterance.voice = voice;

    utterance.onend = () => {
      state.speaking = false;
      if (!state.running || state.paused) return;
      window.setTimeout(() => afterSpeaking?.(), 450);
    };
    utterance.onerror = () => {
      state.speaking = false;
      if (!state.running || state.paused) return;
      window.setTimeout(() => afterSpeaking?.(), 250);
    };

    speechSynthesis.speak(utterance);
  }

  function speakCurrentPose() {
    renderPose();
    state.retryCount = 0;
    elements.heardText.textContent = '';
    const pose = poses[state.poseIndex];
    speak(pose.name, beginListening);
  }

  function beginListening() {
    if (!state.running || state.paused) return;
    const pose = poses[state.poseIndex];
    state.accepted = false;

    if (!Recognition) {
      setInstruction(`Say “${pose.name}”, then tap I said it`);
      elements.listenButton.hidden = true;
      elements.confirmButton.hidden = false;
      return;
    }

    stopRecognition();
    const recognition = new Recognition();
    state.recognition = recognition;
    recognition.lang = 'en-IN';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 5;

    recognition.onstart = () => {
      setListening(true);
      elements.confirmButton.hidden = true;
      setInstruction(`Say “${pose.name}”`);
    };

    recognition.onresult = event => {
      const alternatives = [];
      for (let resultIndex = event.resultIndex; resultIndex < event.results.length; resultIndex += 1) {
        const result = event.results[resultIndex];
        for (let alternativeIndex = 0; alternativeIndex < result.length; alternativeIndex += 1) {
          const transcript = result[alternativeIndex]?.transcript?.trim();
          if (transcript) alternatives.push(transcript);
        }
      }

      if (alternatives.length) {
        elements.heardText.textContent = `Heard: ${alternatives[0]}`;
      }

      if (alternatives.some(transcript => transcriptMatches(transcript, pose))) {
        state.accepted = true;
        stopRecognition();
        onPoseConfirmed();
      }
    };

    recognition.onerror = event => {
      if (event.error === 'aborted') return;
      setListening(false);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setInstruction('Microphone access is blocked. Allow it in Safari settings, or use I said it.');
        elements.confirmButton.hidden = false;
        return;
      }
      if (event.error === 'audio-capture') {
        setInstruction('No microphone was available. Check the iPhone microphone, or use I said it.');
        elements.confirmButton.hidden = false;
        return;
      }
      elements.heardText.textContent = '';
    };

    recognition.onend = () => {
      setListening(false);
      state.recognition = null;
      if (state.accepted || !state.running || state.paused) return;

      if (state.retryCount < 1) {
        state.retryCount += 1;
        setInstruction(`I did not hear “${pose.name}”. Say it once more.`);
        window.setTimeout(beginListening, 800);
      } else {
        setInstruction(`Say “${pose.name}”, then tap Listen again if needed.`);
        elements.listenButton.hidden = false;
        elements.confirmButton.hidden = false;
      }
    };

    try {
      recognition.start();
    } catch {
      setInstruction(`Tap Listen again and say “${pose.name}”.`);
      elements.listenButton.hidden = false;
      elements.confirmButton.hidden = false;
    }
  }

  function onPoseConfirmed() {
    if (!state.running || state.paused) return;
    navigator.vibrate?.(45);
    elements.confirmButton.hidden = true;
    elements.listenButton.hidden = true;
    setInstruction('Good');

    if (state.poseIndex === poses.length - 1) {
      state.sessionCycles += 1;
      const cyclesToday = recordCompletedCycle();
      state.poseIndex = 0;
      renderProgress();
      renderPose();
      const message = `Cycle ${cyclesToday} completed today. ${poses[0].name}`;
      speak(message, beginListening);
      return;
    }

    state.poseIndex += 1;
    renderPose();
    const nextPose = poses[state.poseIndex];
    speak(nextPose.name, beginListening);
  }

  async function requestWakeLock() {
    if (!('wakeLock' in navigator)) return;
    try {
      state.wakeLock = await navigator.wakeLock.request('screen');
    } catch {
      state.wakeLock = null;
    }
  }

  async function releaseWakeLock() {
    try { await state.wakeLock?.release(); } catch { /* no-op */ }
    state.wakeLock = null;
  }

  function startPractice() {
    state.running = true;
    state.paused = false;
    state.poseIndex = 0;
    state.sessionCycles = 0;
    state.retryCount = 0;
    elements.startButton.hidden = true;
    elements.pauseButton.hidden = false;
    elements.pauseButton.textContent = '⏸ Pause';
    elements.confirmButton.hidden = true;
    elements.listenButton.hidden = true;
    renderProgress();
    renderPose();
    requestWakeLock();
    speakCurrentPose();
  }

  function togglePause() {
    if (!state.running) return;
    state.paused = !state.paused;

    if (state.paused) {
      stopRecognition();
      speechSynthesis.cancel();
      state.speaking = false;
      setInstruction('Paused');
      elements.pauseButton.textContent = '▶ Resume';
      elements.listenButton.hidden = true;
      elements.confirmButton.hidden = true;
      releaseWakeLock();
      return;
    }

    elements.pauseButton.textContent = '⏸ Pause';
    requestWakeLock();
    speakCurrentPose();
  }

  function applySettingsToForm() {
    elements.voicePreference.value = state.settings.voicePreference;
    elements.speechRate.value = String(state.settings.speechRate);
    elements.speechRateValue.textContent = `${Number(state.settings.speechRate).toFixed(2)}×`;
    elements.autoContinue.checked = Boolean(state.settings.autoContinue);
  }

  function bindEvents() {
    elements.startButton.addEventListener('click', startPractice);
    elements.pauseButton.addEventListener('click', togglePause);
    elements.listenButton.addEventListener('click', () => {
      state.retryCount = 0;
      beginListening();
    });
    elements.confirmButton.addEventListener('click', onPoseConfirmed);

    elements.settingsButton.addEventListener('click', () => {
      applySettingsToForm();
      elements.settingsDialog.showModal();
    });

    elements.voicePreference.addEventListener('change', () => {
      state.settings.voicePreference = elements.voicePreference.value;
      saveSettings();
    });

    elements.speechRate.addEventListener('input', () => {
      state.settings.speechRate = Number(elements.speechRate.value);
      elements.speechRateValue.textContent = `${state.settings.speechRate.toFixed(2)}×`;
      saveSettings();
    });

    elements.autoContinue.addEventListener('change', () => {
      state.settings.autoContinue = elements.autoContinue.checked;
      saveSettings();
    });

    elements.resetTodayButton.addEventListener('click', () => {
      if (!window.confirm("Reset today's completed cycle count?")) return;
      delete state.progress.days[localDateKey()];
      saveProgress();
      renderProgress();
      elements.settingsDialog.close();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && state.running && !state.paused) {
        requestWakeLock();
      }
    });

    window.addEventListener('pagehide', () => {
      stopRecognition();
      speechSynthesis.cancel();
      releaseWakeLock();
    });
  }

  function initialise() {
    createSequenceDots();
    applySettingsToForm();
    renderProgress();
    renderPose();
    bindEvents();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./service-worker.js').catch(() => {});
    }

    speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
  }

  initialise();
})();
