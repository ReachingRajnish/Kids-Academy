// Fair Share: sharing out and grouping, division facts, fact families, remainders and times-or-share word problems.
(function (MA) {
  'use strict';

  const { h, rand, pick, shuffle } = MA.util;
  const M = MA.math;

  const LEVELS = [
    { id: 'deal', name: 'Share it out', eg: '12 sweets, 3 plates' },
    { id: 'groups', name: 'Make groups', eg: '15 apples, 5 in a bag' },
    { id: 'divfact', name: 'Sharing facts', eg: '20 ÷ 5' },
    { id: 'family', name: 'Fact families', eg: '3, 4 and 12' },
    { id: 'rem', name: 'Left over', eg: '14 ÷ 4 = 3, 2 left' },
    { id: 'divall', name: 'All the sharing facts', eg: '56 ÷ 8' },
    { id: 'story', name: 'Times or share?', eg: '6 boxes of 4 pencils' },
  ];
  const TREATS = [['🍬', 'sweets'], ['🍪', 'biscuits'], ['🍓', 'strawberries'], ['🥕', 'carrots'], ['🍎', 'apples']];
  const HOLDERS = { deal: [['🍽️', 'plates'], ['🧒', 'friends'], ['🐰', 'rabbits']], groups: [['🛍️', 'bag'], ['📦', 'box'], ['🧺', 'basket']] };

  const STORIES = [
    { op: 'x', text: (a, b) => `There are ${a} boxes with ${b} pencils in each. How many pencils?`, icon: '✏️' },
    { op: 'x', text: (a, b) => `${a} spiders each have 8 legs. How many legs?`, b: 8, icon: '🕷️' },
    { op: 'x', text: (a, b) => `A bus has ${a} rows of seats with ${b} seats in each row. How many seats?`, icon: '🚌' },
    { op: 'x', text: (a, b) => `${a} children each have ₹${b}. How much money altogether?`, icon: '🪙' },
    { op: '/', text: (a, b) => `${a * b} children make teams of ${b}. How many teams?`, icon: '⚽' },
    { op: '/', text: (a, b) => `${a * b} biscuits are shared between ${b} plates. How many on each plate?`, icon: '🍪' },
    { op: '/', text: (a, b) => `${a * b} legs belong to some cows. A cow has 4 legs. How many cows?`, b: 4, icon: '🐄' },
    { op: '/', text: (a, b) => `₹${a * b} is shared equally by ${b} friends. How much does each get?`, icon: '🪙' },
  ];

  // ---------- Problems ----------
  function deal(total, k, t, w) {
    return { mode: 'deal', total, k, t, w, answer: total / k, params: ['deal', total, k, t, w], key: `deal${total}/${k}`,
      memo: `${total} shared between ${k} = ${total / k} each, so ${total} ÷ ${k} = ${total / k}` };
  }
  function groups(total, g, t, w) {
    return { mode: 'groups', total, g, t, w, answer: total / g, params: ['groups', total, g, t, w], key: `grp${total}/${g}`,
      memo: `${total} in groups of ${g} makes ${total / g} groups, so ${total} ÷ ${g} = ${total / g}` };
  }
  function fact(a, b, blank) {
    const p = M.make(a * b, '/', b, blank);
    return Object.assign(p, { mode: 'fact', t: b, params: ['fact', a, b, blank], key: `${a * b}/${b}|${blank}`, memo: `${a * b} ÷ ${b} = ${a} because ${a} × ${b} = ${a * b}` });
  }
  function family(a, b, which) {
    const c = a * b;
    const facts = [[a, '×', b, c], [b, '×', a, c], [c, '÷', a, b], [c, '÷', b, a]];
    const f = facts[which];
    return { mode: 'family', a, b, c, which, f, answer: f[3], params: ['family', a, b, which], key: `fam${a}.${b}.${which}`,
      memo: `${a} × ${b} = ${c}, ${b} × ${a} = ${c}, ${c} ÷ ${a} = ${b}, ${c} ÷ ${b} = ${a}` };
  }
  function rem(each, k, left, t) {
    const total = each * k + left;
    return { mode: 'rem', each, k, left, t, total, answer: `${each} each, ${left} left`, params: ['rem', each, k, left, t], key: `rem${total}/${k}`,
      memo: `${total} ÷ ${k} = ${each} with ${left} left over` };
  }
  function story(i, a, b) {
    const s = STORIES[i];
    const answer = s.op === 'x' ? a * b : a;
    return { mode: 'story', i, a, b, op: s.op, q: s.text(a, b), answer, params: ['story', i, a, b], key: `st${i}.${a}.${b}`,
      memo: s.op === 'x' ? `${a} × ${b} = ${a * b}` : `${a * b} ÷ ${b} = ${a}` };
  }

  function fromParams(pr) {
    const [mode, ...x] = pr;
    return { deal, groups, fact, family, rem, story }[mode](...x);
  }

  function make(level) {
    const t = rand(0, TREATS.length - 1);
    switch (level) {
      case 1: { const k = rand(2, 4); return deal(k * rand(2, 5), k, t, rand(0, 2)); }
      case 2: { const g = pick([2, 3, 4, 5, 10]); return groups(g * rand(2, g === 10 ? 4 : 6), g, t, rand(0, 2)); }
      case 3: return fact(rand(1, 10), pick([2, 5, 10, 3, 4]), Math.random() < 0.8 ? 'c' : 'a');
      case 4: { const a = rand(2, 9); let b = rand(2, 9); if (b === a) b++; return family(a, b, rand(0, 3)); }
      case 5: { const k = rand(2, 5); return rem(rand(1, 5), k, rand(1, k - 1), t); }
      case 6: return fact(rand(2, 12), rand(2, 12), 'c');
      default: {
        const i = rand(0, STORIES.length - 1);
        const s = STORIES[i];
        return story(i, rand(2, 9), s.b || rand(2, 9));
      }
    }
  }

  // ---------- Explanations ----------
  function explain(p) {
    switch (p.mode) {
      case 'deal': return { hint: `Give one to each ${HOLDERS.deal[p.w][1].slice(0, -1)}, again and again, until none are left.`,
        steps: [`Share ${p.total} out one at a time between ${p.k}.`, `Count in ${p.k}s: ${Array.from({ length: p.answer }, (_, k) => (k + 1) * p.k).join(', ')}. That is ${p.answer} rounds.`, `So each gets ${p.answer}. ${p.total} ÷ ${p.k} = ${p.answer}`] };
      case 'groups': return { hint: `Count in ${p.g}s up to ${p.total}.`,
        steps: [`Make groups of ${p.g}: ${Array.from({ length: p.answer }, (_, k) => (k + 1) * p.g).join(', ')}.`, `That is ${p.answer} groups.`, `${p.total} ÷ ${p.g} = ${p.answer}`] };
      case 'fact': return { hint: p.blank === 'c' ? `What times ${p.b} makes ${p.a}?` : `Work backwards: ${p.c} × ${p.b}.`,
        steps: [p.blank === 'c' ? `Count in ${p.b}s until you get to ${p.a}: ${Array.from({ length: p.c }, (_, k) => (k + 1) * p.b).join(', ')}.` : `${p.c} × ${p.b} = ${p.a}`,
          `${p.a} ÷ ${p.b} = ${p.c}`, `Check: ${p.c} × ${p.b} = ${p.a}`] };
      case 'family': return { hint: `The three numbers are ${p.a}, ${p.b} and ${p.c}. The biggest one is the total.`,
        steps: [`${p.a}, ${p.b} and ${p.c} make a fact family.`, `${p.a} × ${p.b} = ${p.c} and ${p.b} × ${p.a} = ${p.c}`, `${p.c} ÷ ${p.a} = ${p.b} and ${p.c} ÷ ${p.b} = ${p.a}`] };
      case 'rem': return { hint: `Share them out. Some will be left that can't go round fairly.`,
        steps: [`${p.k} × ${p.each} = ${p.each * p.k}, and ${p.k} × ${p.each + 1} = ${p.k * (p.each + 1)} is too many.`, `So each gets ${p.each}.`, `${p.total} − ${p.each * p.k} = ${p.left} left over.`] };
      default: return { hint: p.op === 'x' ? 'Equal groups put together: that is times.' : 'Sharing out or making equal groups: that is divide.',
        steps: [p.op === 'x' ? `${p.a} groups of ${p.b}, so times: ${p.a} × ${p.b}.` : `Share ${p.a * p.b} into ${p.b}s, so divide: ${p.a * p.b} ÷ ${p.b}.`, p.memo] };
    }
  }

  // ---------- Playing ----------
  function renderDeal(p, stage, api) {
    const [icon, word] = TREATS[p.t];
    const [hIcon, hWord] = HOLDERS.deal[p.w];
    let left = p.total, next = 0;
    const jar = h('button', { class: 'fs-jar', type: 'button', 'aria-label': `Share one of the ${word}` });
    const plates = Array.from({ length: p.k }, () => h('div', { class: 'fs-plate' }, h('span', { class: 'fs-who', text: hIcon }), h('div', { class: 'fs-on' })));
    const paint = () => { jar.innerHTML = ''; jar.append(h('span', { class: 'fs-pile', text: icon.repeat(left) || '✔️' }), h('small', { text: left ? 'Tap to share one' : 'All shared!' })); };
    jar.addEventListener('click', () => {
      if (api.busy() || !left) return;
      left--;
      plates[next].querySelector('.fs-on').append(h('span', { class: 'fs-treat', text: icon }));
      next = (next + 1) % p.k;
      MA.sound.play('tap');
      paint();
    });
    paint();
    const ch = MA.ui.choices(M.nearby(p.answer, 4, { max: 20 }).filter(v => v > 0), v => api.answer(v, { delay: 1200 }));
    stage.append(h('div', { class: 'ev' },
      h('p', { class: 'nl-ask', text: `Share ${p.total} ${word} fairly between ${p.k} ${hWord}. How many does each get?` }),
      jar, h('div', { class: 'fs-plates' }, plates), ch.el));
    return ch.destroy;
  }

  function render(p, stage, api) {
    if (p.mode === 'deal') return renderDeal(p, stage, api);
    const wrap = h('div', { class: 'ev' });
    stage.append(wrap);
    if (p.mode === 'groups' || p.mode === 'rem') {
      const [icon, word] = TREATS[p.t];
      const pile = h('div', { class: 'pz-cookies', text: icon.repeat(p.total) });
      let ask, opts;
      if (p.mode === 'groups') {
        const [hIcon, hWord] = HOLDERS.groups[p.w];
        ask = `${p.total} ${word}. Each ${hWord} holds ${p.g}. How many ${hWord === 'box' ? 'boxes' : hWord + 's'} do we need?`;
        wrap.append(h('p', { class: 'nl-ask', text: ask }), pile, h('div', { class: 'fs-bag' }, h('span', { text: hIcon }), h('b', { text: `${p.g} in each` })));
        opts = M.nearby(p.answer, 4, { max: 20 }).filter(v => v > 0);
      } else {
        ask = `${p.total} ${word} shared between ${p.k} friends. How many each, and how many left over?`;
        wrap.append(h('p', { class: 'nl-ask', text: ask }), pile, h('div', { class: 'fs-plates small' }, Array.from({ length: p.k }, () => h('span', { class: 'fs-who', text: '🧒' }))));
        const alt = [[p.each + 1, p.total - (p.each + 1) * p.k], [p.each, p.left + 1], [p.each - 1, p.left + p.k], [p.each, 0]]
          .filter(([e, l]) => e > 0 && l >= 0 && !(e === p.each && l === p.left)).map(([e, l]) => `${e} each, ${l} left`);
        opts = shuffle([p.answer, ...shuffle([...new Set(alt)]).slice(0, 3)]);
      }
      const ch = MA.ui.choices(opts, v => api.answer(v, { delay: 1300 }), { className: p.mode === 'rem' ? 'fs-words' : '' });
      wrap.append(ch.el);
      return ch.destroy;
    }
    wrap.classList.add('ev-pad');
    const ans = MA.ui.padAnswer(api, { maxLen: 3 });
    let side;
    if (p.mode === 'fact') {
      side = [h('p', { class: 'nl-ask', text: 'Share it!' }), h('div', { class: 'qf-eq tt-eq' }, M.tokens(p).map(tk => (tk === '?' ? ans.line : h('span', { class: 'tok', text: tk }))))];
    } else if (p.mode === 'family') {
      const [x, op, y] = p.f;
      side = [h('div', { class: 'fs-tri' }, h('b', { class: 'top', text: String(p.c) }), h('span', { text: String(p.a) }), h('span', { text: String(p.b) })),
        h('div', { class: 'qf-eq tt-eq' }, h('span', { text: `${x} ${op} ${y} = ` }), ans.line)];
    } else {
      side = [h('div', { class: 'cal-big', text: STORIES[p.i].icon }), h('p', { class: 'nl-ask', text: p.q }), ans.line];
    }
    wrap.append(h('div', { class: 'ev-side' }, side), ans.pad);
    return ans.destroy;
  }

  function visual(p) {
    if (p.mode === 'deal') return MA.ui.array(p.answer, p.k, { icon: TREATS[p.t][0], size: '24px' });
    if (p.mode === 'groups') return h('div', { class: 'pz-groups' }, Array.from({ length: p.answer }, () => h('span', { class: 'pz-group on', text: TREATS[p.t][0].repeat(p.g) })));
    if (p.mode === 'rem') return h('div', { class: 'pz-groups' }, Array.from({ length: p.k }, () => h('span', { class: 'pz-group on', text: TREATS[p.t][0].repeat(p.each) })),
      h('span', { class: 'pz-group', text: TREATS[p.t][0].repeat(p.left) + ' left' }));
    return null;
  }

  MA.games.register({
    id: 'share',
    title: 'Fair Share',
    icon: '🍬',
    color: '#c026d3',
    shelf: 'Times tables and sharing',
    blurb: 'Share fairly and divide',
    intro: 'Fair means everyone gets the same!',
    levels: LEVELS,
    make,
    fromParams,
    explain,
    visual,
    say: p => ({ deal: () => `Share ${p.total} between ${p.k}. How many each?`, groups: () => `${p.total} in groups of ${p.g}. How many groups?`,
      fact: () => M.text(p), family: () => `${p.f[0]} ${p.f[1] === '×' ? 'times' : 'divided by'} ${p.f[2]} equals what?`,
      rem: () => `${p.total} shared between ${p.k}. How many each, and how many left over?`, story: () => p.q })[p.mode](),
    render,
  });
})(window.MA);
