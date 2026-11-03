// Memory Tap: watch the pads light up, then tap them in the same order (or backwards). The last level remembers numbers.
(function (MA) {
  'use strict';

  const { h, rand } = MA.util;

  const LEVELS = [
    { id: 'mem3', name: '3 in a row', eg: 'Watch 3 lights', pads: 4, len: 3 },
    { id: 'mem4', name: '4 in a row', eg: 'Watch 4 lights', pads: 4, len: 4 },
    { id: 'mem5', name: '5 lights, 6 pads', eg: 'Watch 5 lights', pads: 6, len: 5 },
    { id: 'mem6', name: '6 lights, 9 pads', eg: 'Watch 6 lights', pads: 9, len: 6 },
    { id: 'memback', name: 'Backwards', eg: 'Tap them in reverse', pads: 6, len: 4, back: true },
    { id: 'memnum', name: 'Remember the number', eg: '5 digits', len: 5, digits: true },
  ];
  const PADS = [['#ef4444', '🍎'], ['#3b82f6', '🐳'], ['#22c55e', '🐸'], ['#eab308', '⭐'], ['#a855f7', '🍇'], ['#f97316', '🦊'],
    ['#ec4899', '🌸'], ['#14b8a6', '🐢'], ['#64748b', '🐘']];

  function problem(level, seq) {
    const lv = LEVELS[level - 1];
    const answer = lv.digits ? Number(seq.join('')) : (lv.back ? seq.slice().reverse() : seq).map(i => PADS[i][1]).join(' ');
    return { mode: lv.digits ? 'digits' : 'pads', pads: lv.pads, back: !!lv.back, seq, answer, params: [seq], key: seq.join('.'),
      memo: lv.digits ? `The number was ${seq.join('')}` : `${lv.back ? 'Backwards: ' : ''}${answer}` };
  }
  const fromParams = (pr, level) => problem(level, pr[0]);
  function make(level) {
    const lv = LEVELS[level - 1];
    const seq = [];
    while (seq.length < lv.len) {
      const v = lv.digits ? rand(seq.length ? 0 : 1, 9) : rand(0, lv.pads - 1);
      if (v !== seq[seq.length - 1]) seq.push(v);
    }
    return problem(level, seq);
  }

  function explain(p) {
    if (p.mode === 'digits') return { hint: 'Say the digits quietly to yourself while you watch.', steps: ['Say the number out loud as it shows.', `Split it up: ${p.seq.slice(0, 2).join('')}, ${p.seq.slice(2).join('')}.`] };
    return { hint: p.back ? 'Start with the last one that lit up.' : 'Say the names to yourself as they light up.',
      steps: [p.back ? 'Remember the order, then start from the end.' : 'Say each one as it lights up.', `The order was: ${p.answer}.`] };
  }

  function render(p, stage, api) {
    const status = h('p', { class: 'nl-ask mt-status', text: 'Watch carefully…' });
    const box = h('div', { class: 'mt', 'data-ready': '0' });
    let ready = false, pos = 0;
    const want = p.back ? p.seq.slice().reverse() : p.seq;

    if (p.mode === 'digits') {
      const show = h('div', { class: 'mt-digit' });
      const ans = MA.ui.padAnswer({
        answer: (v, o) => (ready ? api.answer(v, o) : null), busy: api.busy,
      }, { maxLen: 6 });
      const replay = h('button', { class: 'btn btn-soft mt-again', type: 'button', onclick: () => ready && !api.busy() && play() }, '👀 Show me again');
      const play = () => {
        ready = false;
        box.dataset.ready = '0';
        status.textContent = 'Remember this number…';
        p.seq.forEach((d, k) => {
          api.after(300 + k * 900, () => { show.textContent = String(d); show.classList.add('on'); MA.sound.play('hop'); });
          api.after(300 + k * 900 + 650, () => { show.textContent = ''; show.classList.remove('on'); });
        });
        api.after(300 + p.seq.length * 900, () => { ready = true; box.dataset.ready = '1'; status.textContent = 'Now type the number!'; });
      };
      box.append(show);
      stage.append(h('div', { class: 'ev ev-pad' }, h('div', { class: 'ev-side' }, status, box, ans.line, replay), ans.pad));
      play();
      return ans.destroy;
    }

    const cols = p.pads === 4 ? 2 : 3;
    const pads = Array.from({ length: p.pads }, (_, i) => h('button', { class: 'mt-pad', type: 'button', 'data-pad': String(i),
      style: { '--c': PADS[i][0] }, 'aria-label': PADS[i][1], onclick: () => tap(i) }, h('span', { text: PADS[i][1] })));
    const flash = (i, ms) => { pads[i].classList.add('on'); api.after(ms, () => pads[i].classList.remove('on')); };
    function play() {
      ready = false;
      pos = 0;
      box.dataset.ready = '0';
      status.textContent = 'Watch carefully…';
      p.seq.forEach((i, k) => api.after(500 + k * 750, () => { flash(i, 450); MA.sound.play('hop'); }));
      api.after(500 + p.seq.length * 750, () => {
        ready = true;
        box.dataset.ready = '1';
        status.textContent = p.back ? 'Your turn! Tap them BACKWARDS.' : 'Your turn! Tap them in the same order.';
      });
    }
    function tap(i) {
      if (!ready || api.busy()) return;
      flash(i, 250);
      if (i === want[pos]) {
        MA.sound.play('tap');
        if (++pos === want.length) api.right({ delay: 1100 });
        return;
      }
      const ok = api.wrong(p.back ? 'Start with the last one that lit up. Watch again!' : 'Oops! Watch again.');
      if (ok === false && !api.busy()) play();
    }
    box.append(h('div', { class: 'mt-pads', style: { '--cols': cols } }, pads));
    stage.append(h('div', { class: 'ev' }, status, box));
    play();
  }

  MA.games.register({
    id: 'memory',
    title: 'Memory Tap',
    icon: '🧠',
    color: '#7c3aed',
    shelf: 'Brain games',
    blurb: 'Watch, remember, repeat',
    intro: 'Watch the lights, then tap them in the same order.',
    levels: LEVELS,
    make,
    fromParams,
    explain,
    check: (p, v) => v === p.answer,
    say: p => (p.mode === 'digits' ? 'Remember the number.' : 'Watch carefully.'),
    render,
  });
})(window.MA);
