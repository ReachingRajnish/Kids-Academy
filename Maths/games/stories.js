// Maths Stories: short word problems with pictures. Read the story, work out what to do, and type the answer.
(function (MA) {
  'use strict';

  const { h, rand, pick, shuffle } = MA.util;
  const M = MA.math;

  const LEVELS = [
    { id: 'wpadd', name: 'Adding stories', eg: 'Riya has 5, gets 3 more' },
    { id: 'wpsub', name: 'Taking away stories', eg: '12 balloons, 4 fly away' },
    { id: 'wppick', name: 'Which sum?', eg: 'Pick the number sentence' },
    { id: 'wpcmp', name: 'How many more?', eg: '9 and 14' },
    { id: 'wpbig', name: 'Stories to 100', eg: '38 + 25' },
    { id: 'wpmul', name: 'Groups and sharing', eg: '4 bags of 5' },
    { id: 'wpmoney', name: 'Money stories', eg: '₹45 and ₹30' },
    { id: 'wptwo', name: 'Two steps', eg: 'Add, then take away' },
  ];
  const NAMES = ['Riya', 'Aarav', 'Ananya', 'Kabir', 'Meera', 'Arjun', 'Diya', 'Vihaan', 'Saanvi', 'Ishaan', 'Zoya', 'Rohan'];
  const THINGS = [['🥭', 'mangoes'], ['⭐', 'stickers'], ['✏️', 'pencils'], ['🎈', 'balloons'], ['📚', 'books'], ['🍬', 'sweets'],
    ['🚗', 'toy cars'], ['🐟', 'fish'], ['🌸', 'flowers'], ['🍪', 'biscuits']];
  const GROUPS = [['bags', 'in each bag'], ['boxes', 'in each box'], ['plates', 'on each plate'], ['rows', 'in each row']];
  const SHOP = [['🪁', 'kite'], ['⚽', 'ball'], ['📒', 'notebook'], ['🧃', 'juice'], ['🧸', 'teddy'], ['🍦', 'ice cream']];

  // ---------- The stories ----------
  // Each story: (name, thing, a, b, c) -> { text, answer, sentence }. The numbers are made in make() below.
  const T = {
    join: (n, t, a, b) => ({ text: `${n} has ${a} ${t[1]}. A friend gives ${n} ${b} more. How many ${t[1]} does ${n} have now?`, answer: a + b, sentence: `${a} + ${b} = ${a + b}` }),
    add2: (n, t, a, b) => ({ text: `${n} picks ${a} ${t[1]} in the morning and ${b} in the evening. How many altogether?`, answer: a + b, sentence: `${a} + ${b} = ${a + b}` }),
    away: (n, t, a, b) => ({ text: `${n} has ${a} ${t[1]}. ${n} gives ${b} away. How many are left?`, answer: a - b, sentence: `${a} − ${b} = ${a - b}` }),
    lost: (n, t, a, b) => ({ text: `There are ${a} ${t[1]} in the basket. ${b} fall out. How many are still in the basket?`, answer: a - b, sentence: `${a} − ${b} = ${a - b}` }),
    more: (n, t, a, b, c, n2) => ({ text: `${n} has ${a} ${t[1]}. ${n2} has ${b}. How many more does ${n2} have?`, answer: b - a, sentence: `${b} − ${a} = ${b - a}` }),
    fewer: (n, t, a, b, c, n2) => ({ text: `${n} has ${b} ${t[1]}. ${n2} has ${a}. How many fewer does ${n2} have?`, answer: b - a, sentence: `${b} − ${a} = ${b - a}` }),
    groups: (n, t, a, b, c) => ({ text: `${n} has ${a} ${GROUPS[c][0]} with ${b} ${t[1]} ${GROUPS[c][1]}. How many ${t[1]} altogether?`, answer: a * b, sentence: `${a} × ${b} = ${a * b}` }),
    share: (n, t, a, b, c) => ({ text: `${n} shares ${a * b} ${t[1]} equally into ${a} ${GROUPS[c][0]}. How many go ${GROUPS[c][1]}?`, answer: b, sentence: `${a * b} ÷ ${a} = ${b}` }),
    buy2: (n, t, a, b, c) => ({ text: `${n} buys a ${SHOP[c][1]} for ₹${a} and a ${SHOP[(c + 1) % SHOP.length][1]} for ₹${b}. How much is that altogether?`, answer: a + b, sentence: `₹${a} + ₹${b} = ₹${a + b}` }),
    change: (n, t, a, b, c) => ({ text: `${n} has ₹${a}. A ${SHOP[c][1]} costs ₹${b}. How much money is left after buying it?`, answer: a - b, sentence: `₹${a} − ₹${b} = ₹${a - b}` }),
    two: (n, t, a, b, c) => ({ text: `${n} has ${a} ${t[1]}. ${n} gets ${b} more, then gives ${c} to a friend. How many now?`, answer: a + b - c, sentence: `${a} + ${b} = ${a + b}, then ${a + b} − ${c} = ${a + b - c}` }),
  };
  const OP = { join: '+', add2: '+', away: '−', lost: '−', more: '−', fewer: '−', groups: '×', share: '÷', buy2: '+', change: '−' };

  function story(kind, ni, ti, a, b, c, pickMode) {
    const n = NAMES[ni], n2 = NAMES[(ni + 3) % NAMES.length], t = THINGS[ti];
    const s = T[kind](n, t, a, b, c, n2);
    return Object.assign({ mode: pickMode ? 'pick' : 'story', kind, ni, ti, a, b, c, n, t, params: [kind, ni, ti, a, b, c, !!pickMode],
      key: `${kind}${a}.${b}.${c}${pickMode ? 'p' : ''}`, memo: s.sentence }, s, pickMode ? { answer: s.sentence.split(' = ')[0] } : {});
  }
  const fromParams = pr => story(...pr);

  function make(level) {
    const ni = rand(0, NAMES.length - 1), ti = rand(0, THINGS.length - 1);
    switch (level) {
      case 1: return story(pick(['join', 'add2']), ni, ti, rand(2, 10), rand(2, 9), 0);
      case 2: { const a = rand(8, 20); return story(pick(['away', 'lost']), ni, ti, a, rand(2, a - 2), 0); }
      case 3: {
        const kind = pick(['join', 'away', 'add2', 'lost', 'more']);
        const a = rand(4, 12), b = rand(2, kind === 'more' ? 9 : a - 1);
        return story(kind, ni, ti, kind === 'more' ? a : a + (OP[kind] === '−' ? 4 : 0), kind === 'more' ? a + b : b, 0, true);
      }
      case 4: { const a = rand(4, 12); return story(pick(['more', 'fewer']), ni, ti, a, a + rand(2, 9), 0); }
      case 5: {
        const kind = pick(['join', 'away', 'add2', 'lost']);
        if (OP[kind] === '+') { const a = rand(15, 60); return story(kind, ni, ti, a, rand(11, 99 - a), 0); }
        const a = rand(35, 99); return story(kind, ni, ti, a, rand(11, a - 8), 0);
      }
      case 6: return story(pick(['groups', 'share']), ni, ti, rand(2, 6), rand(2, 6), rand(0, GROUPS.length - 1));
      case 7: {
        const c = rand(0, SHOP.length - 1);
        if (Math.random() < 0.5) { const a = rand(12, 60); return story('buy2', ni, ti, a, rand(10, 95 - a), c); }
        const a = pick([20, 50, 100]); return story('change', ni, ti, a, rand(Math.ceil(a / 3), a - 2), c);
      }
      default: { const a = rand(10, 40), b = rand(5, 30); return story('two', ni, ti, a, b, rand(5, a + b - 5)); }
    }
  }

  // Wrong number sentences for "Which sum?": the other operation, and the numbers the wrong way round.
  function sentences(p) {
    const [x, op, y] = p.answer.split(' ');
    const out = new Set([`${x} ${op === '+' ? '−' : '+'} ${y}`]);
    if (op === '−') out.add(`${y} − ${x}`);
    out.add(`${x} × ${y}`);
    out.delete(p.answer);
    return shuffle([p.answer, ...[...out].slice(0, 2)]);
  }

  function explain(p) {
    const op = p.kind === 'two' ? '+ then −' : OP[p.kind];
    const clue = { '+': 'more, altogether or in total means add', '−': 'left, gives away, fewer or how many more means take away',
      '×': 'groups with the same number in each means times', '÷': 'shares equally means divide', '+ then −': 'there are two steps: add first, then take away' }[op];
    return { hint: `Look for the clue words: ${clue}.`,
      steps: [`What do we know? ${p.text.split('. ').slice(0, -1).join('. ')}.`, `The clue: ${clue}.`, p.sentence] };
  }

  function picture(p) {
    const n = p.kind === 'groups' ? p.a * p.b : p.kind === 'share' ? p.a * p.b : ['buy2', 'change'].includes(p.kind) ? 0 : Math.max(p.a, p.b);
    if (!n || n > 24) return h('div', { class: 'ws-pic big', text: ['buy2', 'change'].includes(p.kind) ? SHOP[p.c][0] : p.t[0] });
    return h('div', { class: 'ws-pic', 'aria-hidden': 'true', text: p.t[0].repeat(n) });
  }

  function render(p, stage, api) {
    const book = h('div', { class: 'ws-book' }, picture(p), h('p', { class: 'ws-text', text: p.text }));
    if (p.mode === 'pick') {
      const ch = MA.ui.choices(sentences(p), v => api.answer(v, { delay: 1300 }), { className: 'ws-choices' });
      stage.append(h('div', { class: 'ev' }, book, h('p', { class: 'nl-ask', text: 'Which number sentence solves it?' }), ch.el));
      return ch.destroy;
    }
    const money = ['buy2', 'change'].includes(p.kind);
    const ans = MA.ui.padAnswer(api, { maxLen: 3, before: money ? '₹' : null });
    stage.append(h('div', { class: 'ev ev-pad' }, h('div', { class: 'ev-side' }, book, ans.line), ans.pad));
    return ans.destroy;
  }

  MA.games.register({
    id: 'stories',
    title: 'Maths Stories',
    icon: '📖',
    color: '#0ea5e9',
    shelf: 'Problem solving',
    blurb: 'Word problems with pictures',
    intro: 'Read the story. Look for the clue words!',
    levels: LEVELS,
    make,
    fromParams,
    explain,
    say: p => (p.mode === 'pick' ? `${p.text} Which number sentence solves it?` : p.text),
    render,
  });
})(window.MA);
