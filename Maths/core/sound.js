// Sound effects made in the browser, so there are no audio files to download.
(function (MA) {
  'use strict';

  let ctx = null;

  function audio() {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(ac, freq, at, dur, type, vol) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, ac.currentTime + at);
    gain.gain.setValueAtTime(0.0001, ac.currentTime + at);
    gain.gain.exponentialRampToValueAtTime(vol || 0.15, ac.currentTime + at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + at + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(ac.currentTime + at);
    osc.stop(ac.currentTime + at + dur + 0.05);
  }

  function slide(ac, from, to, dur, vol) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(from, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(to, ac.currentTime + dur);
    gain.gain.setValueAtTime(vol, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + dur + 0.05);
  }

  const SOUNDS = {
    tap: ac => tone(ac, 660, 0, 0.06, 'square', 0.05),
    correct: ac => { tone(ac, 660, 0, 0.12); tone(ac, 990, 0.1, 0.2); },
    wrong: ac => { tone(ac, 220, 0, 0.18, 'triangle', 0.12); tone(ac, 180, 0.12, 0.22, 'triangle', 0.1); },
    hop: ac => slide(ac, 300, 900, 0.25, 0.12),
    splash: ac => slide(ac, 500, 120, 0.35, 0.1),
    star: ac => [880, 1175, 1568].forEach((f, i) => tone(ac, f, i * 0.09, 0.25, 'sine', 0.12)),
    win: ac => [523, 659, 784, 1047].forEach((f, i) => tone(ac, f, i * 0.12, 0.3, 'triangle', 0.14)),
  };

  MA.sound = {
    play(name) {
      if (MA.store.setting('sound') === false) return;
      try {
        const ac = audio();
        if (ac && SOUNDS[name]) SOUNDS[name](ac);
      } catch (e) { /* sound is a bonus, never an error */ }
    },
  };
})(window.MA);
