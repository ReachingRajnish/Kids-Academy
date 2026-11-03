// Reads questions aloud with the browser's own voice.
(function (MA) {
  'use strict';

  const synth = window.speechSynthesis;
  let voice = null;

  function chooseVoice() {
    const voices = synth.getVoices();
    voice = voices.find(v => v.lang === 'en-IN') ||
            voices.find(v => v.lang === 'en-GB') ||
            voices.find(v => v.lang && v.lang.startsWith('en')) || null;
  }

  if (synth) {
    chooseVoice();
    synth.addEventListener && synth.addEventListener('voiceschanged', chooseVoice);
  }

  // "8 + ? = 14" -> "8 plus what number equals 14"
  function spoken(text) {
    return String(text)
      .replace(/\+/g, ' plus ')
      .replace(/−| - /g, ' minus ')
      .replace(/×/g, ' times ')
      .replace(/÷/g, ' divided by ')
      .replace(/\?/g, ' what number ')
      .replace(/=/g, ' equals ')
      .replace(/₹/g, ' rupees ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  MA.voice = {
    available: !!synth,
    spoken,

    say(text) {
      if (!synth || !text) return;
      try {
        synth.cancel();
        const u = new SpeechSynthesisUtterance(spoken(text));
        if (voice) u.voice = voice;
        u.lang = voice ? voice.lang : 'en-IN';
        u.rate = 0.92;
        synth.speak(u);
      } catch (e) { /* no voice on this device */ }
    },

    // Only speaks when the player has "Read aloud" switched on.
    auto(text) {
      if (MA.store.setting('voice')) this.say(text);
    },

    stop() {
      if (synth) synth.cancel();
    },
  };
})(window.MA);
