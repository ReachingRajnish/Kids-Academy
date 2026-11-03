// Croc Compare: pick <, = or > (the hungry crocodile eats the bigger number), then put numbers in order.
(function (MA) {
  'use strict';

  const { h, rand, pick, shuffle } = MA.util;
  const M = MA.math;

  const LEVELS = [
    { id: 'cmp20', name: 'Compare to 20', eg: '12 ? 9' },
    { id: 'cmp100', name: 'Compare to 100', eg: '47 ? 74' },
    { id: 'cmp1000', name: 'Compare to 1000', eg: '409 ? 490' },
    { id: 'cmpsum', name: 'Compare sums', eg: '23 + 5 ? 30' },
    { id: 'ord100', name: 'Order numbers to 100', eg: '58, 85, 15, 51' },
    { id: 'ord1000', name: 'Order numbers to 1000', eg: '304, 340, 430, 403' },
  ];
  const WORD = { '<': 'is less than', '=': 'is equal to', '>': 'is more than' };
  const SAY = { '<': 'less than', '=': 'equal to', '>': 'more than' };

  const sym = (x, y) => (x < y ? '<' : x > y ? '>' : '=');

  // A side is a number or a small sum like [23, '+', 5].
  const val = s => (Array.isArray(s) ? (s[1] === '+' ? s[0] + s[2] : s[0] - s[2]) : s);
  const show = s => (Array.isArray(s) ? `${s[0]} ${s[1] === '+' ? '+' : '−'} ${s[2]}` : String(s));

  function cmpProblem(left, right) {
    const answer = sym(val(left), val(right));
    return { mode: 'cmp', left, right, answer, params: ['cmp', left, right], key: `${show(left)}?${show(right)}`,
      memo: `${show(left)} ${answer} ${show(right)}` };
  }

  function ordProblem(nums, asc) {
    const sorted = nums.slice().sort((a, b) => (asc ? a - b : b - a));
    return { mode: 'ord', nums, asc, answer: sorted, params: ['ord', nums, asc], key: `${nums.join(',')}${asc ? '<' : '>'}`,
      memo: sorted.join(asc ? ' < ' : ' > ') };
  }

  function fromParams(params) {
    return params[0] === 'cmp' ? cmpProblem(params[1], params[2]) : ordProblem(params[1], params[2]);
  }

  // Close pairs are where kids slip: 47 and 74, 409 and 490, 36 and 39.
  function closePair(lo, hi) {
    const a = rand(lo, hi);
    const r = Math.random();
    let b;
    if (r < 0.15) b = a;
    else if (r < 0.5) {
      const s = String(a);
      b = Number(s.length === 2 ? s[1] + s[0] : pick([s[0] + s[2] + s[1], s[1] + s[0] + s[2]]));
      if (b < lo || String(b).length !== s.length) b = rand(lo, hi);
    } else if (r < 0.75) b = a - (a % 10) + rand(0, 9);
    else b = rand(lo, hi);
    return Math.random() < 0.5 ? [a, b] : [b, a];
  }

  function make(level) {
    switch (level) {
      case 1: { const a = rand(0, 20); const b = Math.random() < 0.15 ? a : rand(0, 20); return cmpProblem(a, b); }
      case 2: return cmpProblem(...closePair(10, 99));
      case 3: return cmpProblem(...closePair(100, 999));
      case 4: {
        const op = Math.random() < 0.6 ? '+' : '-';
        const left = op === '+' ? [rand(11, 39), '+', rand(2, 19)] : [rand(30, 60), '-', rand(2, 19)];
        const v = val(left);
        const r = Math.random();
        const right = r < 0.2 ? v : r < 0.6 ? v + pick([-2, -1, 1, 2]) : Math.random() < 0.5 ? 10 * Math.round(v / 10) : [rand(10, 39), '+', rand(2, 19)];
        return Math.random() < 0.5 ? cmpProblem(left, right) : cmpProblem(right, left);
      }
      case 5: {
        const t = rand(1, 8), o = rand(1, 9);
        const set = new Set([t * 10 + o, o * 10 + t]);
        while (set.size < 4) set.add(Math.random() < 0.5 ? t * 10 + rand(0, 9) : rand(10, 99));
        return ordProblem(shuffle([...set]), true);
      }
      default: {
        // The same digits in different places: 304, 340, 430, 403.
        const [x, y] = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        const z = rand(0, 9);
        const set = new Set([x * 100 + y * 10 + z, x * 100 + z * 10 + y, y * 100 + x * 10 + z, y * 100 + z * 10 + x]);
        while (set.size < 4) set.add(rand(100, 999));
        return ordProblem(shuffle([...set]).slice(0, 4), Math.random() < 0.5);
      }
    }
  }

  function placeWords(x, y) {
    const a = M.digits(x), b = M.digits(y);
    if (a.h !== b.h) return `Look at the hundreds first: ${a.h} hundreds and ${b.h} hundreds.`;
    if (a.t !== b.t) return `${a.h || b.h ? 'The hundreds are the same, so look at the tens' : 'Look at the tens first'}: ${a.t} tens and ${b.t} tens.`;
    if (a.o !== b.o) return `The tens are the same, so look at the ones: ${a.o} and ${b.o}.`;
    return 'They are the same number.';
  }

  function explain(p) {
    if (p.mode === 'ord') {
      const word = p.asc ? 'smallest' : 'biggest';
      return { hint: `Find the ${word} number first. Look at the ${p.nums[0] >= 100 ? 'hundreds' : 'tens'} digits.`,
        steps: [`Find the ${word} number first, then the next.`, p.answer.join(p.asc ? ' < ' : ' > ')] };
    }
    const lv = val(p.left), rv = val(p.right);
    const steps = [];
    if (Array.isArray(p.left)) steps.push(`${show(p.left)} = ${lv}`);
    if (Array.isArray(p.right)) steps.push(`${show(p.right)} = ${rv}`);
    steps.push(placeWords(lv, rv));
    steps.push(`${show(p.left)} ${WORD[p.answer]} ${show(p.right)}, so ${show(p.left)} ${p.answer} ${show(p.right)}`);
    const hint = Array.isArray(p.left) || Array.isArray(p.right) ? 'Work out the sum first, then compare.'
      : lv <= 20 && rv <= 20 ? 'The crocodile always eats the bigger number.' : placeWords(lv, rv);
    return { hint, steps };
  }

  function renderCmp(p, stage, api) {
    const slot = h('span', { class: 'cc-slot', 'aria-label': 'Answer' }, '🐊');
    const side = s => h('div', { class: 'cc-num' + (Array.isArray(s) ? ' sum' : '') },
      h('span', { text: show(s) }),
      !Array.isArray(s) && s <= 20 ? MA.ui.dots(M.make(s, '+', 0)) : null);
    const choices = MA.ui.choices(['<', '=', '>'], v => {
      const ok = api.answer(v, { delay: 1300 });
      if (ok) {
        slot.textContent = v;
        slot.classList.add('filled', v === '<' ? 'eat-right' : v === '>' ? 'eat-left' : 'same');
      }
      return ok;
    }, { className: 'cc-choices', aria: v => SAY[v], label: v => [h('b', { text: v }), h('small', { text: SAY[v] })] });
    stage.append(h('div', { class: 'cc' },
      h('p', { class: 'nl-ask', text: 'Which sign goes in the middle?' }),
      h('div', { class: 'cc-row' }, side(p.left), slot, side(p.right)),
      choices.el));
    return choices.destroy;
  }

  function renderOrd(p, stage, api) {
    const slots = p.nums.map(() => h('button', { class: 'co-slot', type: 'button', 'aria-label': 'Empty place' }));
    const placed = [];
    const tiles = p.nums.map((n, i) => {
      const t = h('button', { class: 'co-tile', type: 'button', 'data-value': String(n), text: String(n) });
      t.addEventListener('click', () => put(i));
      return t;
    });

    function paint() {
      slots.forEach((s, i) => {
        const k = placed[i];
        s.textContent = k == null ? '' : String(p.nums[k]);
        s.classList.toggle('full', k != null);
      });
      tiles.forEach((t, i) => { t.disabled = placed.includes(i); });
    }
    function put(i) {
      if (api.busy() || placed.includes(i)) return;
      MA.sound.play('tap');
      placed.push(i);
      paint();
      if (placed.length === p.nums.length) {
        const ok = api.answer(placed.map(k => p.nums[k]), { delay: 1300 });
        if (ok === false && !api.busy()) api.after(900, () => { placed.length = 0; paint(); });
      }
    }
    slots.forEach((s, i) => s.addEventListener('click', () => {
      if (api.busy() || placed[i] == null || placed.length === p.nums.length) return;
      placed.splice(i, 1);
      paint();
    }));

    stage.append(h('div', { class: 'co' },
      h('p', { class: 'nl-ask', text: p.asc ? 'Put them in order, smallest first.' : 'Put them in order, biggest first.' }),
      h('div', { class: 'co-tiles' }, tiles),
      h('div', { class: 'co-slots' }, slots.map((s, i) => [s, i < slots.length - 1 ? h('span', { class: 'co-sign', text: p.asc ? '<' : '>' }) : null])),
      h('p', { class: 'co-ends' }, h('span', { text: p.asc ? 'smallest' : 'biggest' }), h('span', { text: p.asc ? 'biggest' : 'smallest' }))));
    paint();
  }

  MA.games.register({
    id: 'compare',
    title: 'Croc Compare',
    icon: '🐊',
    color: '#16a34a',
    shelf: 'Place value',
    blurb: 'Bigger, smaller or the same?',
    intro: 'The hungry crocodile always eats the bigger number!',
    levels: LEVELS,
    make,
    fromParams,
    check: (p, v) => (p.mode === 'ord' ? v.join() === p.answer.join() : v === p.answer),
    say: p => (p.mode === 'ord' ? `Put ${p.nums.join(', ')} in order, ${p.asc ? 'smallest' : 'biggest'} first.`
      : `${show(p.left)}, and ${show(p.right)}. Less than, equal to, or more than?`),
    explain,
    render: (p, stage, api) => (p.mode === 'ord' ? renderOrd(p, stage, api) : renderCmp(p, stage, api)),
  });
})(window.MA);
