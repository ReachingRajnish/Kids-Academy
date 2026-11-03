// Array Garden: rows of flowers show what times means. Count them, plant them, turn them round and split them.
(function (MA) {
  'use strict';

  const { h, rand, pick, shuffle } = MA.util;
  const M = MA.math;

  const LEVELS = [
    { id: 'arrcount', name: 'Rows of flowers', eg: '3 rows of 4' },
    { id: 'arradd', name: 'Adding is times', eg: '4 + 4 + 4 = 3 × 4' },
    { id: 'arrplant', name: 'Plant the garden', eg: 'Plant 3 rows of 5' },
    { id: 'arrturn', name: 'Turn it round', eg: '3 × 5 = 5 × 3' },
    { id: 'arrsplit', name: 'Split it up', eg: '7 × 6 = 5 × 6 + 2 × 6' },
    { id: 'area', name: 'Count the squares', eg: 'A 4 by 6 rectangle' },
  ];
  const FLOWERS = ['🌷', '🌻', '🌼', '🌹', '🍓', '🥕'];
  const PLOT = { rows: 6, cols: 8 };
  const rowsOf = (r, c) => `${r} row${r > 1 ? 's' : ''} of ${c}`;

  // ---------- Problems ----------
  const P = {
    count: (r, c, f) => ({ answer: r * c, memo: `${rowsOf(r, c)} = ${r} × ${c} = ${r * c}` }),
    add: (r, c) => ({ answer: `${r} × ${c}`, memo: `${Array(r).fill(c).join(' + ')} = ${r} × ${c}` }),
    plant: (r, c) => ({ answer: rowsOf(r, c), memo: `${rowsOf(r, c)} is ${r} × ${c} = ${r * c}` }),
    turn: (r, c, f, blank) => ({ answer: blank ? r : r * c, memo: `${r} × ${c} = ${c} × ${r} = ${r * c}` }),
    split: (r, c) => ({ answer: (r - 5) * c, memo: `${r} × ${c} = ${5 * c} + ${(r - 5) * c} = ${r * c}` }),
    area: (r, c) => ({ answer: r * c, memo: `${r} rows of ${c} squares = ${r * c} squares` }),
  };
  function problem(mode, r, c, f, blank) {
    return Object.assign({ mode, r, c, f, blank, params: [mode, r, c, f, blank], key: `${mode}${r}x${c}${blank ? 'b' : ''}` }, P[mode](r, c, f, blank));
  }
  const fromParams = pr => problem(...pr);

  function make(level) {
    const f = rand(0, FLOWERS.length - 1);
    switch (level) {
      case 1: return problem('count', rand(2, 5), rand(2, 5), f);
      case 2: return problem('add', rand(2, 5), rand(2, 6), f);
      case 3: { const r = rand(2, PLOT.rows), c = rand(2, PLOT.cols); return problem('plant', r, c === r ? Math.min(c + 1, PLOT.cols) : c, f); }
      case 4: { const r = rand(2, 6), c = rand(3, 9); return problem('turn', r, c === r ? c + 1 : c, f, Math.random() < 0.5); }
      case 5: return problem('split', rand(6, 9), rand(3, 9), f);
      default: return problem('area', rand(3, 9), rand(3, 10), f);
    }
  }

  // ---------- Explanations ----------
  function explain(p) {
    const { r, c } = p;
    const run = Array.from({ length: r }, (_, k) => (k + 1) * c).join(', ');
    switch (p.mode) {
      case 'count': return { hint: `Count each row in ${c}s.`, steps: [`There are ${rowsOf(r, c)}.`, `Count in ${c}s: ${run}.`, `${r} × ${c} = ${r * c}`] };
      case 'add': return { hint: 'How many times is the same number added?',
        steps: [`${c} is added ${r} times.`, `${r} lots of ${c} is ${r} × ${c}.`, `${p.memo} = ${r * c}`] };
      case 'plant': return { hint: `Rows go across. You need ${r} rows, each with ${c} flowers.`,
        steps: ['Rows go across, like lines in a book.', `Make ${r} rows, each ${c} long.`, `That is ${r} × ${c} = ${r * c} flowers.`] };
      case 'turn': return { hint: 'Turning the garden round does not change how many flowers there are.',
        steps: [`${r} rows of ${c} turned round is ${c} rows of ${r}.`, `It is still ${r * c} flowers.`, p.memo] };
      case 'split': return { hint: `5 × ${c} is easy. Then add the other ${r - 5} rows.`,
        steps: [`Split ${r} rows into 5 rows and ${r - 5} rows.`, `5 × ${c} = ${5 * c}`, `${r - 5} × ${c} = ${(r - 5) * c}`, `${5 * c} + ${(r - 5) * c} = ${r * c}`] };
      default: return { hint: 'Count the squares in one row, then count the rows.',
        steps: [`There are ${c} squares in each row and ${r} rows.`, `${r} × ${c} = ${r * c}`, `So ${r * c} squares cover it.`] };
    }
  }

  // ---------- Playing ----------
  function garden(r, c, f, split) {
    return h('div', { class: 'ag-bed' }, MA.ui.array(r, c, { icon: FLOWERS[f], split }));
  }

  function renderPlant(p, stage, api) {
    let sel = { r: 0, c: 0 };
    const cells = [];
    const plot = h('div', { class: 'ag-plot', style: { '--cols': PLOT.cols } });
    for (let r = 1; r <= PLOT.rows; r++) for (let c = 1; c <= PLOT.cols; c++) {
      const b = h('button', { class: 'ag-soil', type: 'button', 'data-r': String(r), 'data-c': String(c), 'aria-label': `${r} rows of ${c}`,
        onclick: () => { if (api.busy()) return; sel = { r, c }; MA.sound.play('tap'); api.clearTip(); paint(); } });
      cells.push(b);
      plot.append(b);
    }
    const info = h('p', { class: 'ag-info' });
    function paint() {
      cells.forEach(b => {
        const on = +b.dataset.r <= sel.r && +b.dataset.c <= sel.c;
        b.textContent = on ? FLOWERS[p.f] : '';
        b.classList.toggle('on', on);
      });
      info.textContent = sel.r ? `${rowsOf(sel.r, sel.c)} = ${sel.r * sel.c} flowers` : 'Tap a square to plant up to there.';
    }
    paint();
    const check = h('button', { class: 'btn btn-main btn-big ag-check', type: 'button', onclick: () => {
      if (api.busy() || !sel.r) return;
      if (sel.r === p.r && sel.c === p.c) return api.right({ delay: 1200 });
      api.wrong(sel.r === p.c && sel.c === p.r ? `That's ${rowsOf(sel.r, sel.c)}. Rows go across: you need ${p.r} rows.`
        : `You planted ${rowsOf(sel.r, sel.c)}. You need ${p.r} rows with ${p.c} in each.`);
    } }, '✓ Check');
    stage.append(h('div', { class: 'ev' }, h('p', { class: 'nl-ask' }, 'Plant ', h('b', { text: rowsOf(p.r, p.c) }), '.'), plot, info, check));
  }

  function render(p, stage, api) {
    if (p.mode === 'plant') return renderPlant(p, stage, api);
    const wrap = h('div', { class: 'ev' });
    stage.append(wrap);
    if (p.mode === 'add') {
      const opts = shuffle([`${p.r} × ${p.c}`, `${p.r} + ${p.c}`, `${p.c} × ${p.c}`, `${p.r + 1} × ${p.c}`].filter((v, i, a) => a.indexOf(v) === i));
      const ch = MA.ui.choices(opts, v => api.answer(v, { delay: 1200 }));
      wrap.append(h('p', { class: 'nl-ask', text: `${Array(p.r).fill(p.c).join(' + ')} is the same as…` }), garden(p.r, p.c, p.f), ch.el);
      return ch.destroy;
    }
    if (p.mode === 'count') {
      const ch = MA.ui.choices(M.nearby(p.answer, 4, { max: 40, step: p.c }), v => api.answer(v, { delay: 1200 }));
      wrap.append(h('p', { class: 'nl-ask', text: `${rowsOf(p.r, p.c)}. How many altogether?` }), garden(p.r, p.c, p.f), ch.el);
      return ch.destroy;
    }
    // The rest use the keypad.
    wrap.classList.add('ev-pad');
    const ans = MA.ui.padAnswer(api, { maxLen: 3 });
    let side;
    if (p.mode === 'turn') {
      side = [h('div', { class: 'ag-pair' }, garden(p.r, p.c, p.f), h('span', { class: 'ag-turn', text: '↻' }), garden(p.c, p.r, p.f)),
        h('div', { class: 'qf-eq ag-eq' }, `${p.r} × ${p.c} = ${p.r * p.c}, so `,
          p.blank ? [h('span', { text: `${p.c} × ` }), ans.line, h('span', { text: ` = ${p.r * p.c}` })] : [h('span', { text: `${p.c} × ${p.r} = ` }), ans.line])];
    } else if (p.mode === 'split') {
      side = [h('p', { class: 'nl-ask', text: `Split the ${p.r} rows into 5 and ${p.r - 5}.` }), garden(p.r, p.c, p.f, 5),
        h('div', { class: 'qf-eq ag-eq' }, `${p.r} × ${p.c} = ${5 * p.c} + `, ans.line)];
    } else {
      const grid = h('div', { class: 'ag-area', style: { '--cols': p.c } }, Array.from({ length: p.r * p.c }, () => h('span')));
      side = [h('p', { class: 'nl-ask', text: 'How many squares cover the rectangle?' }), grid, ans.line];
    }
    wrap.append(h('div', { class: 'ev-side' }, side), ans.pad);
    return ans.destroy;
  }

  MA.games.register({
    id: 'arrays',
    title: 'Array Garden',
    icon: '🌷',
    color: '#16a34a',
    shelf: 'Times tables and sharing',
    blurb: 'Rows of flowers make times tables',
    intro: 'Rows go across. 3 rows of 4 is 3 × 4!',
    levels: LEVELS,
    make,
    fromParams,
    explain,
    check: (p, v) => v === p.answer,
    visual: p => (p.mode === 'area' ? null : MA.ui.array(p.r, p.c, { size: '16px', split: p.mode === 'split' ? 5 : 0 })),
    say: p => ({ count: () => `${rowsOf(p.r, p.c)}. How many altogether?`, add: () => `${Array(p.r).fill(p.c).join(' + ')} is the same as what?`,
      plant: () => `Plant ${rowsOf(p.r, p.c)}.`, turn: () => `${p.r} times ${p.c} is ${p.r * p.c}. What is ${p.c} times ${p.blank ? 'what' : p.r}?`,
      split: () => `${p.r} times ${p.c} is ${5 * p.c} plus what?`, area: () => 'How many squares cover the rectangle?' })[p.mode](),
    render,
  });
})(window.MA);
