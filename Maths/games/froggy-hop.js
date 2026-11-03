// Froggy Hop: tap the lily pad with the right answer and the frog jumps onto it.
(function (MA) {
  'use strict';

  const { h } = MA.util;
  const PAD = `<svg viewBox="0 0 100 70" preserveAspectRatio="none" aria-hidden="true">
    <path d="M50 35 L58 2 A49 33.5 0 1 1 42 2 Z" fill="#43a851" stroke="#2c7a37" stroke-width="2.5"/>
    <path d="M50 35 L16 24 M50 35 L84 24 M50 35 L26 60 M50 35 L74 60 M50 35 L50 67" stroke="#62c46f" stroke-width="2" fill="none"/>
  </svg>`;

  function equation(p) {
    return MA.math.tokens(p).map(t => h('span', { class: t === '?' ? 'blank' : 'tok', text: t }));
  }

  MA.games.register({
    id: 'froggy-hop',
    title: 'Froggy Hop',
    icon: '🐸',
    color: '#2bb673',
    shelf: 'Number facts',
    blurb: 'Hop onto the right answer',
    intro: 'Tap the lily pad with the right answer.',
    levels: MA.math.LEVELS,
    make: (level, ctx) => MA.math.problem(level, ctx),
    say: p => MA.math.text(p),

    render(p, stage, api) {
      const frog = h('div', { class: 'fh-frog', 'aria-hidden': 'true' }, '🐸');
      const question = h('div', { class: 'fh-question' }, equation(p));
      const pads = h('div', { class: 'fh-pads' });
      const pond = h('div', { class: 'fh-pond' },
        question, pads,
        h('div', { class: 'fh-log' }, frog),
        h('span', { class: 'fh-flower f1', 'aria-hidden': 'true' }, '🪷'),
        h('span', { class: 'fh-flower f2', 'aria-hidden': 'true' }, '🌸'));

      function jump(pad) {
        if (!frog.animate) return;
        const fr = frog.getBoundingClientRect(), pr = pad.getBoundingClientRect();
        const dx = pr.left + pr.width / 2 - (fr.left + fr.width / 2);
        const dy = pr.top + pr.height * 0.3 - (fr.top + fr.height / 2);
        frog.animate([
          { transform: 'translate(0, 0)' },
          { transform: `translate(${dx / 2}px, ${Math.min(dy, 0) - 90}px) scale(1.25)` },
          { transform: `translate(${dx}px, ${dy}px)` },
        ], { duration: 600, easing: 'ease-in-out', fill: 'forwards' });
      }

      function choose(pad, value) {
        if (pad.disabled) return;
        const ok = api.answer(value, { delay: 1200 });
        if (ok === null) return;
        if (ok) {
          MA.sound.play('hop');
          jump(pad);
          pad.classList.add('right');
          question.querySelector('.blank').textContent = String(p.answer);
          question.querySelector('.blank').classList.add('filled');
        } else {
          pad.disabled = true;
          pad.classList.add('sink');
          setTimeout(() => MA.sound.play('splash'), 150);
          frog.classList.remove('shake');
          void frog.offsetWidth;
          frog.classList.add('shake');
        }
      }

      const padEls = MA.math.choices(p, 4).map((v, i) => {
        const pad = h('button', { class: 'fh-pad', type: 'button', style: { '--i': i }, 'aria-label': `Answer ${v}`, html: PAD },
          h('span', { class: 'fh-num', text: String(v) }));
        pad.addEventListener('click', () => choose(pad, v));
        pads.append(pad);
        return { pad, v };
      });

      // Keys 1 to 4 pick a lily pad on a laptop.
      function onKey(e) {
        const n = Number(e.key);
        if (n >= 1 && n <= padEls.length) choose(padEls[n - 1].pad, padEls[n - 1].v);
      }
      document.addEventListener('keydown', onKey);

      stage.append(pond);
      return () => document.removeEventListener('keydown', onKey);
    },
  });
})(window.MA);
