// Equation Maker: tap number cards into the boxes to make the target. Any cards that work are right.
(function (MA) {
  'use strict';

  const { h, rand, pick, shuffle } = MA.util;
  const M = MA.math;

  const LEVELS = [
    { id: 'em10', name: 'Make numbers to 10', eg: '? + ? = 7', op: '+', slots: 2 },
    { id: 'em20', name: 'Make numbers to 20', eg: '? + ? = 15', op: '+', slots: 2 },
    { id: 'emsub', name: 'Take-away cards', eg: '? − ? = 6', op: '-', slots: 2 },
    { id: 'emtens', name: 'Make tens', eg: '? + ? = 70', op: '+', slots: 2 },
    { id: 'em3', name: 'Three cards', eg: '? + ? + ? = 18', op: '+', slots: 3 },
    { id: 'emmul', name: 'Times cards', eg: '? × ? = 24', op: 'x', slots: 2 },
  ];
  const FACTOR_TARGETS = [12, 16, 18, 20, 24, 30, 36, 40];

  const calc = (op, vals) => (op === '+' ? vals.reduce((a, b) => a + b, 0) : op === '-' ? vals[0] - vals[1] : vals[0] * vals[1]);
  const sentence = (op, vals, target) => `${vals.join(` ${M.SYM[op]} `)} = ${target}`;

  // Every different way the cards can make the target.
  function solutions(op, slots, cards, target) {
    const out = new Map();
    const idx = cards.map((_, i) => i);
    const walk = (chosen) => {
      if (chosen.length === slots) {
        const vals = chosen.map(i => cards[i]);
        if (calc(op, vals) !== target) return;
        const key = op === '-' ? vals.join() : vals.slice().sort((a, b) => a - b).join();
        if (!out.has(key)) out.set(key, op === '-' ? vals : vals.slice().sort((a, b) => b - a));
        return;
      }
      idx.forEach(i => { if (!chosen.includes(i)) walk(chosen.concat(i)); });
    };
    walk([]);
    return [...out.values()];
  }

  function build(level, target, cards) {
    const lv = LEVELS[level - 1];
    const sols = solutions(lv.op, lv.slots, cards, target);
    return { op: lv.op, slots: lv.slots, target, cards, solutions: sols, answer: target,
      params: [level, target, cards], key: `${lv.op}${target}:${cards.slice().sort((a, b) => a - b).join()}`,
      memo: sentence(lv.op, sols[0], target) };
  }

  function make(level) {
    let target, solution, filler;
    switch (level) {
      case 1: target = rand(4, 10); { const a = rand(1, target - 1); solution = [a, target - a]; } filler = () => rand(1, 9); break;
      case 2: target = rand(11, 18); { const a = rand(target - 9, 9); solution = [a, target - a]; } filler = () => rand(1, 9); break;
      case 3: target = rand(1, 9); { const b = rand(1, 9); solution = [target + b, b]; } filler = () => rand(1, 18); break;
      case 4: target = 10 * rand(5, 10); { const a = 10 * rand(1, target / 10 - 1); solution = [a, target - a]; } filler = () => 10 * rand(1, 9); break;
      case 5: {
        target = rand(10, 20);
        do { solution = [rand(1, 9), rand(1, 9)]; solution.push(target - solution[0] - solution[1]); }
        while (solution[2] < 1 || solution[2] > 9);
        filler = () => rand(1, 9);
        break;
      }
      default: {
        target = pick(FACTOR_TARGETS);
        const pairs = [];
        for (let a = 2; a <= 10; a++) if (target % a === 0 && target / a >= 2 && target / a <= 10) pairs.push([a, target / a]);
        solution = pick(pairs);
        filler = () => rand(2, 10);
      }
    }
    const count = LEVELS[level - 1].slots === 3 ? 7 : 6;
    const cards = solution.slice();
    while (cards.length < count) cards.push(filler());
    return build(level, target, shuffle(cards));
  }

  function explain(p) {
    const ways = p.solutions.slice(0, 3).map(v => sentence(p.op, v, p.target));
    let hint;
    if (p.op === '+' && p.slots === 2) hint = `Pick one card, then ask: what goes with it to make ${p.target}?`;
    else if (p.op === '+') hint = `Pick two cards, add them, then find the card that makes ${p.target}.`;
    else if (p.op === '-') hint = `Put the bigger card first. What can you take away to leave ${p.target}?`;
    else hint = `Which times table has ${p.target} in it?`;
    return { hint, steps: [`One way: ${ways[0]}`, ...ways.slice(1).map(w => `Another way: ${w}`)] };
  }

  function render(p, stage, api) {
    const filled = new Array(p.slots).fill(null);
    const slots = filled.map(() => h('button', { class: 'em-slot', type: 'button', 'aria-label': 'Empty box' }));
    const cards = p.cards.map((n, i) => {
      const card = h('button', { class: 'em-card', type: 'button', 'data-value': String(n), 'aria-label': `Card ${n}` },
        h('span', { text: String(n) }));
      card.addEventListener('click', () => place(i));
      return card;
    });

    function paint() {
      slots.forEach((s, i) => {
        const k = filled[i];
        s.textContent = k == null ? '' : String(p.cards[k]);
        s.classList.toggle('full', k != null);
      });
      cards.forEach((c, i) => c.classList.toggle('used', filled.includes(i)));
    }

    function place(i) {
      if (api.busy() || filled.includes(i)) return;
      const at = filled.indexOf(null);
      if (at < 0) return;
      MA.sound.play('tap');
      filled[at] = i;
      paint();
      if (!filled.includes(null)) {
        const ok = api.answer(filled.map(k => p.cards[k]), { delay: 1300 });
        if (ok) slots.forEach(s => s.classList.add('right'));
        else if (ok === false) {
          slots.forEach(s => s.classList.add('wrong'));
          api.after(900, () => {
            slots.forEach(s => s.classList.remove('wrong'));
            if (!api.busy()) { filled.fill(null); paint(); }
          });
        }
      }
    }

    slots.forEach((s, i) => s.addEventListener('click', () => {
      if (api.busy() || filled[i] == null) return;
      filled[i] = null;
      paint();
    }));

    const eq = h('div', { class: 'em-eq' },
      slots.map((s, i) => [s, i < slots.length - 1 ? h('span', { class: 'em-op', text: M.SYM[p.op] }) : null]),
      h('span', { class: 'em-op', text: '=' }),
      h('span', { class: 'em-target' }, h('b', { text: String(p.target) }), p.target <= 10 && p.op === '+' ? MA.ui.dots(M.make(p.target, '+', 0)) : null));

    stage.append(h('div', { class: 'em' },
      h('p', { class: 'nl-ask', text: `Make ${p.target}! Tap cards to fill the boxes.` }),
      eq, h('div', { class: 'em-cards' }, cards)));
    paint();
  }

  MA.games.register({
    id: 'equation-maker',
    title: 'Equation Maker',
    icon: '🃏',
    color: '#e0820b',
    shelf: 'Number facts',
    blurb: 'Pick cards to make the number',
    intro: 'Tap number cards to make the target. There can be more than one way!',
    levels: LEVELS,
    make,
    fromParams: params => build(...params),
    check: (p, vals) => calc(p.op, vals) === p.target,
    say: p => `Make ${p.target}. ${new Array(p.slots).fill('?').join(` ${M.SYM[p.op]} `)} = ${p.target}`,
    explain,
    render,
  });
})(window.MA);
