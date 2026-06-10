/* ═══════════════════════════════════════════════
   AMBIENT SOUNDSCAPES — Procedural atmospheric audio
   Uses Web Audio API to generate soft wind noise
   and occasional gentle chime bells.
   No external audio files needed.
   ═══════════════════════════════════════════════ */

(function () {
  let audioCtx = null;
  let isPlaying = false;
  let masterGain = null;
  let windNode = null;
  let chimeInterval = null;

  const MASTER_VOLUME = 0.12;
  const WIND_VOLUME = 0.06;
  const CHIME_VOLUME = 0.08;

  /* ── Create UI Button ── */
  const btn = document.createElement('button');
  btn.className = 'ambient-toggle';
  btn.setAttribute('aria-label', 'Включить атмосферу');
  btn.setAttribute('title', 'Атмосфера');
  btn.innerHTML = `
    <svg class="ambient-toggle__icon ambient-toggle__icon--off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M11 5L6 9H2v6h4l5 4V5z"/>
      <line x1="23" y1="9" x2="17" y2="15"/>
      <line x1="17" y1="9" x2="23" y2="15"/>
    </svg>
    <svg class="ambient-toggle__icon ambient-toggle__icon--on" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M11 5L6 9H2v6h4l5 4V5z"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
    </svg>
  `;
  document.body.appendChild(btn);

  /* ── Wind Noise Generator ── */
  function createWindNoise(ctx) {
    /* Brown noise via IIR filter on white noise */
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // boost
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    /* Shape the wind with a bandpass filter */
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 300;
    filter.Q.value = 0.5;

    /* Slow LFO for volume modulation (breathing wind) */
    const windGain = ctx.createGain();
    windGain.gain.value = WIND_VOLUME;

    /* Modulate wind volume slowly */
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.08; // very slow
    lfoGain.gain.value = WIND_VOLUME * 0.4;

    lfo.connect(lfoGain);
    lfoGain.connect(windGain.gain);
    lfo.start();

    noise.connect(filter);
    filter.connect(windGain);

    noise.start();
    return { node: windGain, source: noise, lfo };
  }

  /* ── Chime Bell ── */
  function playChime(ctx, masterGainNode) {
    const now = ctx.currentTime;

    /* Random pentatonic note */
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 392.00, 440.00];
    const freq = notes[Math.floor(Math.random() * notes.length)];

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    /* Second harmonic for richness */
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = freq * 2.01; // slight detune

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0, now);
    oscGain.gain.linearRampToValueAtTime(CHIME_VOLUME * (0.4 + Math.random() * 0.6), now + 0.05);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);

    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(0, now);
    osc2Gain.gain.linearRampToValueAtTime(CHIME_VOLUME * 0.15, now + 0.03);
    osc2Gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);

    osc.connect(oscGain);
    osc2.connect(osc2Gain);
    oscGain.connect(masterGainNode);
    osc2Gain.connect(masterGainNode);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + 4);
    osc2.stop(now + 3);
  }

  /* ── Init Audio Context ── */
  function initAudio() {
    if (audioCtx) return;

    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(audioCtx.destination);

    /* Start wind */
    const wind = createWindNoise(audioCtx);
    windNode = wind;
    wind.node.connect(masterGain);

    /* Schedule random chimes */
    function scheduleChime() {
      if (!isPlaying) return;
      playChime(audioCtx, masterGain);
      const nextDelay = 4000 + Math.random() * 10000; // 4–14 seconds
      chimeInterval = setTimeout(scheduleChime, nextDelay);
    }
    scheduleChime();
  }

  /* ── Toggle ── */
  function toggle() {
    if (!isPlaying) {
      initAudio();
      isPlaying = true;
      btn.classList.add('ambient-toggle--active');
      btn.setAttribute('aria-label', 'Выключить атмосферу');

      /* Fade in */
      masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
      masterGain.gain.setValueAtTime(masterGain.gain.value, audioCtx.currentTime);
      masterGain.gain.linearRampToValueAtTime(MASTER_VOLUME, audioCtx.currentTime + 1.5);

      if (audioCtx.state === 'suspended') audioCtx.resume();
    } else {
      isPlaying = false;
      btn.classList.remove('ambient-toggle--active');
      btn.setAttribute('aria-label', 'Включить атмосферу');

      /* Fade out */
      masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
      masterGain.gain.setValueAtTime(masterGain.gain.value, audioCtx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.5);

      clearTimeout(chimeInterval);
    }
  }

  btn.addEventListener('click', toggle);
})();
