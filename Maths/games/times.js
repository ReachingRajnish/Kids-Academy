// Times Train: one times table per level, in the order that is easiest to learn, with a trick for each table.
(function (MA) {
  'use strict';

  const { h, rand, pick, shuffle } = MA.util;
  const M = MA.math;

  // Easiest first: 2, 10 and 5 are counting patterns; 3 and 4 build on them; 6, 9, 7 and 8 use tricks.
  const TABLES = [2, 10, 5, 3, 4, 6, 9, 7, 8, 11, 12];
  const LEVELS = [
    ...TABLES.map(t => ({ id: 'x' + t, name: `The ${t} times table`, eg: `7 × ${t}`, table: t })),
    { id: 'xmix', name: 'All the tables', eg: '7 × 8, 6 × 9', table: 0 },
  ];

  function trick(a, t) {
    const c = a * t;
    switch (t) {
      case 2: return `Times 2 is double: double ${a} is ${c}.`;
      case 10: return `Times 10: put a 0 on the end. ${a} becomes ${c}.`;
      case 5: return `Times 5 is half of times 10: ${a} × 10 = ${a * 10}, half of that is ${c}.`;
      case 3: return `Times 3 is double and one more: ${a} + ${a} + ${a} = ${c}.`;
      case 4: return `Times 4 is double, then double again: ${a} → ${a * 2} → ${c}.`;
      case 6: return `Times 6 is times 5 and one more ${a}: ${a * 5} + ${a} = ${c}.`;
      case 9: return `Times 9 is times 10, take away one ${a}: ${a * 10} − ${a} = ${c}.`;
      case 7: return `Times 7 is times 5 and times 2: ${a * 5} + ${a * 2} = ${c}.`;
      case 8: return `Times 8 is double, double, double: ${a} → ${a * 2} → ${a * 4} → ${c}.`;
      case 11: return a <= 9 ? `Times 11 up to 9: write the digit twice. ${a}${a}.` : `Times 11 is times 10 and one more ${a}: ${a * 10} + ${a} = ${c}.`;
      default: return `Times 12 is times 10 and times 2: ${a * 10} + ${a * 2} = ${c}.`;
    }
  }
  const counting = (t, n) => Array.from({ length: n }, (_, k) => (k + 1) * t).join(', ');

  // ---------- Problems ----------
  // fact: a × t (or t × a); miss: a blank in the sum; train: skip counting with one carriage empty.
  function fact(a, t, swap, blank) {
    const p = swap ? M.make(t, 'x', a, blank) : M.make(a, 'x', t, blank);
    return Object.assign(p, { mode: 'fact', n: a, t, swap, params: ['fact', a, t, swap, blank], key: `${swap ? t + 'x' + a : a + 'x' + t}|${blank || 'c'}`,
      memo: `${swap ? t : a} × ${swap ? a : t} = ${a * t}` });
  }
  function train(t, start, gap) {
    const cars = Array.from({ length: 6 }, (_, k) => (start + k) * t);
    return { mode: 'train', t, start, gap, cars, answer: cars[gap], params: ['train', t, start, gap], key: `train${t}.${start}.${gap}`,
      memo: `Count in ${t}s: ${cars.join(', ')}` };
  }
  const fromParams = pr => (pr[0] === 'train' ? train(pr[1], pr[2], pr[3]) : fact(pr[1], pr[2], pr[3], pr[4]));

  function make(level) {
    const t = LEVELS[level - 1].table || pick(TABLES.slice(3));
    const r = Math.random();
    if (r < 0.2) return train(t, rand(1, 7), rand(1, 5));
    const a = level === LEVELS.length ? rand(3, 12) : rand(1, 12);
    return fact(a, t, Math.random() < 0.35, r < 0.35 ? pick(['a', 'b']) : 'c');
  }

  function explain(p) {
    if (p.mode === 'train') {
      return { hint: `Count on in ${p.t}s: each carriage is ${p.t} more than the one before.`,
        steps: [`Each carriage is ${p.t} more.`, `${p.cars[p.gap - 1]} + ${p.t} = ${p.answer}`, `${p.start + p.gap} × ${p.t} = ${p.answer}`] };
    }
    const c = p.n * p.t;
    if (p.blank !== 'c') {
      const known = p.blank === 'a' ? p.b : p.a;
      return { hint: `What times ${known} makes ${c}? Count in ${known}s.`,
        steps: [`Count in ${known}s until you reach ${c}: ${counting(known, c / known)}.`, `That is ${p.answer} lots of ${known}.`, `So the missing number is ${p.answer}.`] };
    }
    return { hint: trick(p.n, p.t).split(':')[0] + '.',
      steps: [trick(p.n, p.t), p.n <= 10 ? `Or count in ${p.t}s: ${counting(p.t, p.n)}.` : null, `${p.memo}`].filter(Boolean) };
  }

  // ---------- Playing ----------
  function render(p, stage, api) {
    const ans = MA.ui.padAnswer(api, { maxLen: 3 });
    let show;
    if (p.mode === 'train') {
      show = h('div', { class: 'tt-train' },
        h('span', { class: 'tt-engine', text: '🚂' }),
        p.cars.map((v, k) => h('span', { class: 'tt-car' + (k === p.gap ? ' gap' : '') }, k === p.gap ? ans.line : String(v))));
    } else {
      show = h('div', { class: 'qf-eq tt-eq' }, M.tokens(p).map(tk => (tk === '?' ? ans.line : h('span', { class: 'tok', text: tk }))));
    }
    stage.append(h('div', { class: 'ev ev-pad' },
      h('div', { class: 'ev-side' }, h('p', { class: 'nl-ask', text: p.mode === 'train' ? `Count in ${p.t}s. Which number is missing?` : 'Times tables!' }), show),
      ans.pad));
    return ans.destroy;
  }

  MA.games.register({
    id: 'times',
    title: 'Times Train',
    icon: '🚂',
    color: '#0d9488',
    shelf: 'Times tables and sharing',
    blurb: 'Every times table, with tricks',
    intro: 'Learn one times table at a time. Every table has a trick!',
    levels: LEVELS,
    make,
    fromParams,
    explain,
    visual: p => (p.mode === 'fact' && p.n * p.t <= 60 ? MA.ui.array(p.n, p.t, { size: '14px' }) : null),
    say: p => (p.mode === 'train' ? `Count in ${p.t}s. Which number is missing?` : M.text(p)),
    render,
  });

  MA.times = { TABLES, trick };
})(window.MA);
