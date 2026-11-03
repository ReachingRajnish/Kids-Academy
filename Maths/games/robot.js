// Robo Check: the robot says a maths fact. Is it true or false? Spotting mistakes builds number sense.
(function (MA) {
  'use strict';

  const { h, rand, pick } = MA.util;

  const LEVELS = [
    { id: 'tf10', name: 'Facts to 10', eg: '4 + 5 = 9?' },
    { id: 'tf20', name: 'Facts to 20', eg: '13 − 6 = 8?' },
    { id: 'tfcmp', name: 'Bigger or smaller', eg: '45 > 54?' },
    { id: 'tf100', name: 'Sums to 100', eg: '38 + 25 = 53?' },
    { id: 'tfx', name: 'Times tables', eg: '7 × 6 = 42?' },
    { id: 'tfpv', name: 'Place value', eg: '7 tens = 70?' },
    { id: 'tfmix', name: 'Robot master', eg: 'Anything goes!' },
  ];

  // A statement is [text, true value, the correct version for "Show me", a short reason].
  function arith(a, op, b, shown) {
    const c = op === '+' ? a + b : op === '−' ? a - b : a * b;
    return [`${a} ${op} ${b} = ${shown}`, shown === c, `${a} ${op} ${b} = ${c}`, op === '×' ? `${a} lots of ${b} is ${c}.` : `Work it out: ${a} ${op} ${b} = ${c}.`];
  }
  // A believable mistake: one out, ten out, a forgotten carry, or the digits swapped.
  function slip(c) {
    const s = String(c);
    const opts = [c + 1, c - 1, c + 10, c - 10, c + 2];
    if (s.length === 2 && s[0] !== s[1] && s[1] !== '0') opts.push(Number(s[1] + s[0]));
    return pick(opts.filter(v => v >= 0 && v !== c));
  }

  function statement(level, truth) {
    switch (level) {
      case 1: { const a = rand(0, 9), b = rand(0, 10 - a); return arith(a, '+', b, truth ? a + b : slip(a + b)); }
      case 2: {
        if (Math.random() < 0.5) { const a = rand(3, 12), b = rand(2, 20 - a); return arith(a, '+', b, truth ? a + b : slip(a + b)); }
        const a = rand(8, 20), b = rand(2, a); return arith(a, '−', b, truth ? a - b : slip(a - b));
      }
      case 3: {
        const a = rand(10, 99);
        let b = a % 10 && Math.floor(a / 10) !== a % 10 && Math.random() < 0.5 ? Number(String(a).split('').reverse().join('')) : rand(10, 99);
        if (b === a) b = a + 1;
        const real = a > b ? '>' : '<';
        const shownSign = truth ? real : (real === '>' ? '<' : '>');
        return [`${a} ${shownSign} ${b}`, truth, `${a} ${real} ${b}`, `${Math.max(a, b)} is bigger than ${Math.min(a, b)}.`];
      }
      case 4: {
        if (Math.random() < 0.6) { const a = rand(15, 70), b = rand(11, 99 - a); return arith(a, '+', b, truth ? a + b : slip(a + b)); }
        const a = rand(40, 99), b = rand(11, a - 10); return arith(a, '−', b, truth ? a - b : slip(a - b));
      }
      case 5: { const a = rand(2, 10), b = rand(2, 10); return arith(a, '×', b, truth ? a * b : pick([a * b + a, a * b - b, a * b + 1, a * b - 2].filter(v => v > 0 && v !== a * b))); }
      case 6: {
        const kind = rand(0, 3);
        if (kind === 0) { const t = rand(2, 9); const v = truth ? t * 10 : pick([t, t * 100, t * 10 + 1]); return [`${t} tens = ${v}`, truth, `${t} tens = ${t * 10}`, `Each ten is 10, so ${t} tens is ${t * 10}.`]; }
        if (kind === 1) {
          const H = rand(1, 9), t = rand(0, 9), o = rand(1, 9), n = H * 100 + t * 10 + o;
          const v = truth ? n : pick([H * 100 + o * 10 + t, n + 10, n - 100]);
          return [`${H * 100} + ${t * 10} + ${o} = ${v}`, truth && v === n, `${H * 100} + ${t * 10} + ${o} = ${n}`, `${H} hundreds, ${t} tens and ${o} ones make ${n}.`];
        }
        if (kind === 2) { const n = 2 * rand(3, 20); const v = truth ? n / 2 : n / 2 + pick([1, -1, 2]); return [`Half of ${n} is ${v}`, truth, `Half of ${n} is ${n / 2}`, `${n / 2} + ${n / 2} = ${n}.`]; }
        const n = rand(2, 20); const v = truth ? n * 2 : n * 2 + pick([1, -1, 10]); return [`Double ${n} is ${v}`, truth, `Double ${n} is ${n * 2}`, `${n} + ${n} = ${n * 2}.`];
      }
      default: return statement(rand(2, 6), truth);
    }
  }

  function problem(text, truth, right, why) {
    return { mode: 'tf', text, truth, right, why, answer: truth ? 'True' : 'False', params: [text, truth, right, why], key: text,
      memo: truth ? `${text} ✓` : `${text} ✗, it is ${right}` };
  }
  const fromParams = pr => problem(...pr);
  function make(level) {
    // Make sure it really is true or false (a "mistake" can land on the right answer by chance).
    const want = Math.random() < 0.5;
    const [text, truth, right, why] = statement(level, want);
    return problem(text, truth, right, why);
  }

  function explain(p) {
    return { hint: 'Work it out yourself first, then check what the robot said.',
      steps: [`The robot said: ${p.text}.`, p.why, p.truth ? 'So the robot is right: TRUE.' : `The robot made a mistake. It should be ${p.right}. FALSE.`] };
  }

  function render(p, stage, api) {
    const face = h('div', { class: 'rb-bot', 'aria-hidden': 'true' },
      h('span', { class: 'rb-antenna' }), h('span', { class: 'rb-head' }, h('i', { class: 'rb-eye' }), h('i', { class: 'rb-eye' }), h('b', { class: 'rb-mouth' })));
    const bubble = h('div', { class: 'rb-bubble', text: p.text });
    const ch = MA.ui.choices(['True', 'False'], v => {
      const ok = api.answer(v, { delay: 1300 });
      if (ok === true) face.classList.add(p.truth ? 'happy' : 'oops');
      else if (ok === false) { face.classList.add('shake'); api.after(500, () => face.classList.remove('shake')); }
      return ok;
    }, { className: 'rb-choices', label: v => [h('b', { text: v === 'True' ? '✓ True' : '✗ False' })] });
    stage.append(h('div', { class: 'ev rb' }, h('p', { class: 'nl-ask', text: 'Is the robot right?' }),
      h('div', { class: 'rb-row' }, face, bubble), ch.el));
    return ch.destroy;
  }

  MA.games.register({
    id: 'robot',
    title: 'Robo Check',
    icon: '🤖',
    color: '#475569',
    shelf: 'Problem solving',
    blurb: 'True or false?',
    intro: 'The robot is learning maths. Is it right?',
    levels: LEVELS,
    make,
    fromParams,
    explain,
    say: p => `The robot says: ${p.text}. True or false?`,
    render,
  });
})(window.MA);
