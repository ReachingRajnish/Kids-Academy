// Quick Facts: type the answer on the keypad and collect a sticker for each one right first time.
(function (MA) {
  'use strict';

  const { h } = MA.util;
  const STICKERS = ['🌈', '⭐', '🦄', '💎', '👑', '🚀', '🍩', '🎈', '🦋', '🌻'];

  MA.games.register({
    id: 'quick-facts',
    title: 'Quick Facts',
    icon: '📒',
    color: '#8e5bd8',
    shelf: 'Number facts',
    blurb: 'Type the answer, win stickers',
    intro: 'Type the answer and press the tick.',
    levels: MA.math.LEVELS,
    make: (level, ctx) => MA.math.problem(level, ctx),
    say: p => MA.math.text(p),

    render(p, stage, api) {
      let box;
      const eq = h('div', { class: 'qf-eq' }, MA.math.tokens(p).map(t =>
        t === '?' ? (box = h('span', { class: 'qf-box', 'aria-label': 'Your answer' })) : h('span', { class: 'tok', text: t })));

      const results = api.results();
      const stickers = h('div', { class: 'qf-stickers', 'aria-label': 'Stickers' });
      results.forEach((kind, i) => { if (kind === 'first') stickers.append(h('span', { class: 'sticker', text: STICKERS[i % STICKERS.length] })); });

      let streak = 0;
      for (let i = results.length - 1; i >= 0 && results[i] === 'first'; i--) streak++;
      const streakEl = h('div', { class: 'qf-streak' + (streak >= 2 ? ' hot' : '') }, streak >= 2 ? `🔥 ${streak} in a row` : '');

      const pad = MA.ui.keypad({
        maxLen: 4,
        onChange: v => { box.textContent = v; box.classList.remove('wrong'); },
        onSubmit: v => {
          const ok = api.answer(v, { delay: 900 });
          if (ok === null) return;
          if (ok) {
            box.classList.add('right');
            pad.disable(true);
            if (api.results().slice(-1)[0] === 'first') {
              stickers.append(h('span', { class: 'sticker pop', text: STICKERS[results.length % STICKERS.length] }));
            }
          } else {
            pad.clear();
            box.classList.add('wrong');
            if (api.busy()) pad.disable(true);
          }
        },
      });

      stage.append(h('div', { class: 'qf' },
        h('div', { class: 'qf-book' }, h('div', { class: 'qf-rings', 'aria-hidden': 'true' }), streakEl, eq, stickers),
        pad.el));
      return () => pad.destroy();
    },
  });
})(window.MA);
