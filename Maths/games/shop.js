// Coin Shop: count Indian coins and notes, pay the exact price, work out change, and pay with the fewest coins.
(function (MA) {
  'use strict';

  const { h, rand, pick, shuffle } = MA.util;

  const LEVELS = [
    { id: 'shop1', name: 'Count coins to ₹20', eg: '₹5 + ₹2 + ₹1' },
    { id: 'shop2', name: 'Pay to ₹20', eg: 'Pay ₹13' },
    { id: 'shop3', name: 'Count money to ₹100', eg: '₹50 + ₹20 + ₹5' },
    { id: 'shop4', name: 'Pay to ₹100', eg: 'Pay ₹68' },
    { id: 'shop5', name: 'Two things', eg: '₹24 + ₹15' },
    { id: 'shop6', name: 'Change', eg: 'Pay ₹50 for ₹18' },
    { id: 'shop7', name: 'Fewest coins and notes', eg: '₹175 with 4 pieces' },
  ];
  const ITEMS = [
    ['🍎', 'apple'], ['🍌', 'banana'], ['✏️', 'pencil'], ['📒', 'notebook'], ['🧃', 'juice box'], ['🍦', 'ice cream'],
    ['🪁', 'kite'], ['⚽', 'ball'], ['🧸', 'teddy'], ['🎈', 'balloon'], ['🍫', 'chocolate'], ['🥭', 'mango'],
    ['🖍️', 'box of crayons'], ['🧢', 'cap'], ['🚗', 'toy car'], ['📚', 'storybook'],
  ];
  const ALL = [200, 100, 50, 20, 10, 5, 2, 1];
  const COIN = v => v <= 10; // ₹1, ₹2, ₹5 and ₹10 are coins; ₹20 and up are notes
  const sum = list => list.reduce((a, b) => a + b, 0);
  const rs = v => '₹' + v;

  // The fewest pieces that make v: take the biggest one that fits, again and again.
  function fewest(v, bank) {
    const out = [];
    for (const d of bank || ALL) while (v >= d) { out.push(d); v -= d; }
    return out;
  }

  // ---------- Drawing money ----------
  function piece(v, opts) {
    opts = opts || {};
    const tag = opts.onclick ? 'button' : 'span';
    return h(tag, { class: (COIN(v) ? 'coin c' : 'note n') + v, type: opts.onclick ? 'button' : null, 'data-coin': String(v),
      'aria-label': `${v} rupee ${COIN(v) ? 'coin' : 'note'}`, onclick: opts.onclick }, h('b', { text: rs(v) }));
  }
  const pile = list => h('div', { class: 'sh-pile' }, list.map(v => piece(v)));
  const item = (i, price) => h('div', { class: 'sh-item' }, h('span', { class: 'sh-emoji', text: ITEMS[i][0] }),
    price != null ? h('span', { class: 'sh-tag', text: rs(price) }) : null);

  // ---------- Problems ----------
  function count(coins) {
    const total = sum(coins);
    return { mode: 'count', coins, total, answer: rs(total), params: ['count', coins], key: 'count' + coins.join('.'),
      memo: `${coins.map(rs).join(' + ')} = ${rs(total)}` };
  }
  function pay(i, price, bank, least) {
    const best = fewest(price, bank);
    return { mode: 'pay', i, price, bank, least, total: price, answer: best.map(rs).join(' + '),
      params: ['pay', i, price, bank, least], key: `pay${price}${least ? 'f' : ''}`,
      memo: `${rs(price)} = ${best.map(rs).join(' + ')}${least ? ` (${best.length} pieces)` : ''}` };
  }
  function two(i, j, a, b) {
    return { mode: 'two', i, j, a, b, total: a + b, answer: rs(a + b), params: ['two', i, j, a, b], key: `two${a}+${b}`,
      memo: `${rs(a)} + ${rs(b)} = ${rs(a + b)}` };
  }
  function change(i, price, note) {
    return { mode: 'change', i, price, note, total: note - price, answer: rs(note - price), params: ['change', i, price, note],
      key: `change${note}-${price}`, memo: `${rs(note)} − ${rs(price)} = ${rs(note - price)} change` };
  }

  function fromParams(pr) {
    const [mode, ...a] = pr;
    return { count, pay, two, change }[mode](...a);
  }

  function coinsTo(max, bank, n) {
    for (;;) {
      const list = [];
      for (let k = 0; k < n; k++) list.push(pick(bank));
      if (sum(list) <= max) return list.sort((x, y) => y - x);
    }
  }

  const anItem = () => rand(0, ITEMS.length - 1);
  function make(level) {
    switch (level) {
      case 1: return count(coinsTo(20, [1, 2, 5, 5, 10], rand(2, 5)));
      case 2: return pay(anItem(), rand(3, 20), [10, 5, 2, 1], false);
      case 3: return count(shuffle(coinsTo(100, [50, 20, 10, 5, 2, 1], rand(3, 6))));
      case 4: return pay(anItem(), rand(21, 99), [50, 20, 10, 5, 2, 1], false);
      case 5: {
        const [i, j] = shuffle(ITEMS.map((_, k) => k));
        return two(i, j, rand(11, 49), rand(5, 39));
      }
      case 6: {
        const note = pick([10, 20, 50, 50, 100, 100]);
        return change(anItem(), rand(Math.max(1, note / 2 - 5), note - 1), note);
      }
      default: return pay(anItem(), rand(30, 199), [100, 50, 20, 10, 5, 2, 1], true);
    }
  }

  // ---------- Explanations ----------
  function explain(p) {
    if (p.mode === 'count') {
      const sorted = p.coins.slice().sort((a, b) => b - a);
      let run = 0;
      const steps = sorted.map((v, k) => { run += v; return k === 0 ? `Start with the biggest: ${rs(v)}` : `${rs(run - v)} + ${rs(v)} = ${rs(run)}`; });
      return { hint: 'Start with the biggest coin or note, then count on.', steps: [...steps, `Altogether that is ${rs(p.total)}.`] };
    }
    if (p.mode === 'pay') {
      const best = fewest(p.price, p.bank);
      return {
        hint: p.least ? 'Use the biggest note or coin that fits, then the next biggest.' : `Use big coins first. Which coin is close to ${rs(p.price)}?`,
        steps: [`Take the biggest that fits into ${rs(p.price)}, again and again.`, `${rs(p.price)} = ${best.map(rs).join(' + ')}`,
          p.least ? `That is ${best.length} pieces of money.` : `Tap ${best.map(rs).join(', then ')}.`],
      };
    }
    if (p.mode === 'two') {
      const tens = Math.floor(p.b / 10) * 10, ones = p.b % 10;
      return { hint: 'Add the two prices together.',
        steps: [`${rs(p.a)} + ${rs(p.b)}`, tens ? `${p.a} + ${tens} = ${p.a + tens}` : null, ones ? `${p.a + tens} + ${ones} = ${p.total}` : null,
          `Both together cost ${rs(p.total)}.`].filter(Boolean) };
    }
    const up = Math.ceil(p.price / 10) * 10;
    return { hint: `Count up from ${rs(p.price)} to ${rs(p.note)}.`,
      steps: [`You gave ${rs(p.note)}. It cost ${rs(p.price)}.`,
        up > p.price && up < p.note ? `Count up: ${rs(p.price)} → ${rs(up)} is ${rs(up - p.price)}, ${rs(up)} → ${rs(p.note)} is ${rs(p.note - up)}.` : null,
        `${rs(p.note)} − ${rs(p.price)} = ${rs(p.total)}`, `Your change is ${rs(p.total)}.`].filter(Boolean) };
  }

  // ---------- Playing ----------
  function renderCount(p, stage, api) {
    const ans = MA.ui.padAnswer(api, { before: '₹', maxLen: 3 });
    let ask, show;
    if (p.mode === 'count') { ask = 'How much money is there?'; show = pile(p.coins); }
    else if (p.mode === 'two') {
      ask = `How much for the ${ITEMS[p.i][1]} and the ${ITEMS[p.j][1]}?`;
      show = h('div', { class: 'sh-row' }, item(p.i, p.a), h('span', { class: 'sh-plus', text: '+' }), item(p.j, p.b));
    } else {
      ask = `The ${ITEMS[p.i][1]} costs ${rs(p.price)}. You pay with ${rs(p.note)}. How much change do you get?`;
      show = h('div', { class: 'sh-row' }, item(p.i, p.price), h('span', { class: 'sh-plus', text: '←' }), piece(p.note));
    }
    stage.append(h('div', { class: 'ev ev-pad' },
      h('div', { class: 'ev-side' }, h('p', { class: 'nl-ask', text: ask }), h('div', { class: 'sh-counter' }, show), ans.line),
      ans.pad));
    return ans.destroy;
  }

  function renderPay(p, stage, api) {
    const tray = [];
    const trayEl = h('div', { class: 'sh-tray', 'aria-label': 'Money you are paying' });
    const totalEl = h('span', { class: 'sh-total' });
    const showTotal = p.level <= 2;
    function paint() {
      trayEl.innerHTML = '';
      tray.forEach((v, k) => trayEl.append(piece(v, { onclick: () => { if (!api.busy()) { tray.splice(k, 1); MA.sound.play('tap'); paint(); } } })));
      if (!tray.length) trayEl.append(h('span', { class: 'sh-empty', text: 'Tap money to put it here' }));
      totalEl.textContent = showTotal ? `You are paying ${rs(sum(tray))}` : `${tray.length} piece${tray.length === 1 ? '' : 's'}`;
    }
    const bank = h('div', { class: 'sh-bank' }, p.bank.slice().reverse().map(v => piece(v, { onclick: () => {
      if (api.busy() || tray.length >= 20) return;
      tray.push(v);
      tray.sort((a, b) => b - a);
      MA.sound.play('tap');
      api.clearTip();
      paint();
    } })));
    const payBtn = h('button', { class: 'btn btn-main btn-big sh-pay', type: 'button', onclick: () => {
      if (api.busy() || !tray.length) return;
      const s = sum(tray);
      if (s === p.price && (!p.least || tray.length === fewest(p.price, p.bank).length)) return api.right({ delay: 1200 });
      api.wrong(s < p.price ? `That's ${rs(s)}. You need ${rs(p.price - s)} more.`
        : s > p.price ? `That's ${rs(s)}, which is too much. Take some back.`
          : `That's the right money, but you can use fewer pieces. Try bigger ones!`);
    } }, '💰 Pay');
    paint();
    stage.append(h('div', { class: 'ev sh-pay-screen' },
      h('p', { class: 'nl-ask' }, p.least ? `Pay ${rs(p.price)} with the fewest coins and notes.` : `Pay exactly ${rs(p.price)} for the ${ITEMS[p.i][1]}.`),
      h('div', { class: 'sh-row' }, item(p.i, p.price), h('div', { class: 'sh-till' }, trayEl, totalEl)),
      bank, payBtn));
  }

  MA.games.register({
    id: 'shop',
    title: 'Coin Shop',
    icon: '🪙',
    color: '#ea580c',
    shelf: 'Time and money',
    blurb: 'Count rupees and go shopping',
    intro: 'Count the coins and notes, then pay the shopkeeper!',
    levels: LEVELS,
    make,
    fromParams,
    explain,
    check: (p, v) => v === p.total,
    visual: p => (p.mode === 'pay' ? pile(fewest(p.price, p.bank)) : p.mode === 'count' ? pile(p.coins.slice().sort((a, b) => b - a)) : null),
    say: p => (p.mode === 'count' ? 'How much money is there?'
      : p.mode === 'pay' ? `Pay ${rs(p.price)}${p.least ? ' with the fewest coins and notes' : ''}.`
        : p.mode === 'two' ? `The ${ITEMS[p.i][1]} costs ${rs(p.a)}. The ${ITEMS[p.j][1]} costs ${rs(p.b)}. How much for both?`
          : `It costs ${rs(p.price)}. You pay ${rs(p.note)}. How much change?`),
    render: (p, stage, api) => (p.mode === 'pay' ? renderPay(p, stage, api) : renderCount(p, stage, api)),
  });
})(window.MA);
