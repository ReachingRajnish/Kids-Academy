// Bubble Pairs: pop two bubbles that make the target number. Clear all the pairs to win.
(function (MA) {
  'use strict';

  const { h, rand, shuffle } = MA.util;

  const LEVELS = [
    { id: 'bp10', name: 'Pairs that make 10', target: 10, gen: () => rand(1, 9) },
    { id: 'bp20', name: 'Pairs that make 20', target: 20, gen: () => rand(1, 19) },
    { id: 'bp100t', name: 'Tens that make 100', target: 100, gen: () => 10 * rand(1, 9) },
    { id: 'bp100', name: 'Pairs that make 100', target: 100, gen: () => rand(11, 89) },
    { id: 'bp1000h', name: 'Hundreds that make 1000', target: 1000, gen: () => 100 * rand(1, 9) },
    { id: 'bp1000', name: 'Fifties that make 1000', target: 1000, gen: () => 50 + 100 * rand(0, 9) },
  ].map(l => Object.assign(l, { eg: `${l.gen()} + ? = ${l.target}` }));
  const PAIRS = 3;
  const COLORS = ['#4fc3f7', '#f48fb1', '#aed581', '#ffd54f', '#ce93d8', '#ffab91'];

  function build(target, firsts) {
    const pairs = firsts.map(a => [a, target - a]);
    const bubbles = shuffle(pairs.flat());
    return { target, pairs, bubbles, answer: target, params: [target, firsts], key: `${target}:${firsts.slice().sort((a, b) => a - b).join()}`,
      memo: pairs.map(([a, b]) => `${a} + ${b}`).join(', ') + ` = ${target}` };
  }

  function make(level) {
    const lv = LEVELS[level - 1];
    const used = new Set();
    const firsts = [];
    // Each pair uses two different values, and no value appears in two pairs.
    for (let tries = 0; firsts.length < PAIRS && tries < 200; tries++) {
      const a = lv.gen(), b = lv.target - a;
      if (used.has(a) || used.has(b)) continue;
      used.add(a); used.add(b);
      firsts.push(a);
    }
    return build(lv.target, firsts);
  }

  function explain(p) {
    return { hint: `Pick a bubble, then find the number that goes with it to make ${p.target}.`,
      steps: p.pairs.map(([a, b]) => `${a} + ${b} = ${p.target}`) };
  }

  function render(p, stage, api) {
    let picked = null;
    let popped = 0;
    const els = p.bubbles.map((n, i) => {
      const b = h('button', { class: 'bub', type: 'button', 'data-value': String(n), 'aria-label': `Bubble ${n}`,
        style: { '--c': COLORS[i % COLORS.length], '--d': (i * 0.37) + 's' } }, h('span', { text: String(n) }));
      b.addEventListener('click', () => tap(b, n));
      return b;
    });

    function tap(b, n) {
      if (api.busy() || b.classList.contains('popped')) return;
      if (!picked) { picked = { b, n }; b.classList.add('picked'); MA.sound.play('tap'); return; }
      if (picked.b === b) { b.classList.remove('picked'); picked = null; return; }
      const first = picked;
      picked = null;
      first.b.classList.remove('picked');
      if (first.n + n === p.target) {
        MA.sound.play('splash');
        [first.b, b].forEach(x => { x.classList.add('popped'); x.disabled = true; });
        popped++;
        if (popped === PAIRS) api.right({ delay: 1100 });
        else api.tip(`${first.n} + ${n} = ${p.target}. Pop!`);
      } else {
        [first.b, b].forEach(x => { x.classList.remove('shake'); void x.offsetWidth; x.classList.add('shake'); });
        api.wrong(`${first.n} + ${n} = ${first.n + n}, not ${p.target}. Try another pair.`);
      }
    }

    stage.append(h('div', { class: 'bp' },
      h('p', { class: 'nl-ask' }, 'Pop two bubbles that make ', h('b', { class: 'hp-big', text: String(p.target) })),
      h('div', { class: 'bp-pond' }, els)));
  }

  MA.games.register({
    id: 'bubble-pairs',
    title: 'Bubble Pairs',
    icon: '🫧',
    color: '#06b6d4',
    shelf: 'Number facts',
    blurb: 'Pop pairs that make 10',
    intro: 'Tap two bubbles that add up to the number.',
    levels: LEVELS,
    make,
    fromParams: params => build(...params),
    say: p => `Pop two bubbles that make ${p.target}.`,
    explain,
    render,
  });
})(window.MA);
