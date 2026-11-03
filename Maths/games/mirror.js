// Mirror Match: finish the picture so both sides of the mirror line match.
(function (MA) {
  'use strict';

  const { h, rand, shuffle } = MA.util;

  const LEVELS = [
    { id: 'mir1', name: 'Small mirror', eg: '3 by 4 grid', rows: 3, cols: 4, cells: [2, 3] },
    { id: 'mir2', name: 'Bigger picture', eg: '4 by 6 grid', rows: 4, cols: 6, cells: [4, 5] },
    { id: 'mir3', name: 'Lots of squares', eg: '5 by 8 grid', rows: 5, cols: 8, cells: [6, 8] },
    { id: 'mir4', name: 'Mirror across', eg: 'Top and bottom', rows: 6, cols: 4, cells: [4, 6], across: true },
    { id: 'mir5', name: 'Two colours', eg: 'Red and blue', rows: 4, cols: 6, cells: [4, 6], colors: 2 },
    { id: 'mir6', name: 'Mirror master', eg: '6 by 8 grid', rows: 6, cols: 8, cells: [8, 11], colors: 2 },
  ];
  const COLOR = ['', '#ef4444', '#3b82f6'];

  // A picture is a list of [row, col, colour] on the half before the mirror line.
  function problem(level, cells) {
    const lv = LEVELS[level - 1];
    const mirror = ([r, c, k]) => (lv.across ? [lv.rows - 1 - r, c, k] : [r, lv.cols - 1 - c, k]);
    const want = cells.map(mirror);
    return { mode: 'mirror', rows: lv.rows, cols: lv.cols, across: !!lv.across, colors: lv.colors || 1, cells, want,
      answer: `${want.length} squares coloured in`, params: [cells], key: cells.map(x => x.join('')).join('.'),
      memo: 'A mirror picture is the same distance from the line on both sides' };
  }
  const fromParams = (pr, level) => problem(level, pr[0]);
  function make(level) {
    const lv = LEVELS[level - 1];
    const half = [];
    const hr = lv.across ? lv.rows / 2 : lv.rows, hc = lv.across ? lv.cols : lv.cols / 2;
    for (let r = 0; r < hr; r++) for (let c = 0; c < hc; c++) half.push([r, c]);
    const n = rand(lv.cells[0], lv.cells[1]);
    return problem(level, shuffle(half).slice(0, n).map(([r, c]) => [r, c, lv.colors === 2 ? rand(1, 2) : 1]).sort((a, b) => a[0] - b[0] || a[1] - b[1]));
  }

  function explain(p) {
    return { hint: `Count how far each square is from the mirror line, then do the same on the other side.`,
      steps: ['Pick one coloured square. Count the squares between it and the line.',
        'Count the same number on the other side of the line and colour that square.', 'Do the same for every square.'] };
  }

  function render(p, stage, api) {
    const { rows, cols, across } = p;
    const given = new Map(p.cells.map(([r, c, k]) => [`${r},${c}`, k]));
    const mine = new Map();
    const free = (r, c) => (across ? r >= rows / 2 : c >= cols / 2);
    const cells = [];
    const grid = h('div', { class: 'mm-grid' + (across ? ' across' : ''), style: { '--cols': cols, '--rows': rows } });
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const k = given.get(`${r},${c}`);
      const edge = across ? (r === rows / 2 - 1 ? ' line-b' : '') : (c === cols / 2 - 1 ? ' line-r' : '');
      const cell = free(r, c)
        ? h('button', { class: 'mm-cell free' + edge, type: 'button', 'data-r': String(r), 'data-c': String(c), 'aria-label': `Row ${r + 1}, column ${c + 1}`,
          onclick: () => tap(r, c, cell) })
        : h('span', { class: 'mm-cell' + edge, style: k ? { background: COLOR[k] } : null });
      cells.push(cell);
      grid.append(cell);
    }
    function tap(r, c, cell) {
      if (api.busy()) return;
      const key = `${r},${c}`;
      const k = ((mine.get(key) || 0) + 1) % (p.colors + 1);
      if (k) mine.set(key, k); else mine.delete(key);
      cell.style.background = k ? COLOR[k] : '';
      MA.sound.play('tap');
      api.clearTip();
    }
    const check = h('button', { class: 'btn btn-main btn-big mm-check', type: 'button', onclick: () => {
      if (api.busy()) return;
      const want = new Map(p.want.map(([r, c, k]) => [`${r},${c}`, k]));
      const ok = want.size === mine.size && [...want].every(([key, k]) => mine.get(key) === k);
      if (ok) return api.right({ delay: 1300 });
      const bad = [...new Set([...want.keys(), ...mine.keys()])].find(key => want.get(key) !== mine.get(key));
      const [r, c] = bad.split(',').map(Number);
      api.wrong(across ? `Look at column ${c + 1}. Count the squares from the line.` : `Look at row ${r + 1}. Count the squares from the line.`);
    } }, '✓ Check');
    stage.append(h('div', { class: 'ev' },
      h('p', { class: 'nl-ask', text: p.colors === 2 ? 'Make both sides match. Tap once for red, twice for blue.' : 'Colour squares so both sides match the mirror.' }),
      grid, check));
  }

  function visual(p) {
    const all = new Map([...p.cells, ...p.want].map(([r, c, k]) => [`${r},${c}`, k]));
    const grid = h('div', { class: 'mm-grid small' + (p.across ? ' across' : ''), style: { '--cols': p.cols, '--rows': p.rows } });
    for (let r = 0; r < p.rows; r++) for (let c = 0; c < p.cols; c++) {
      const k = all.get(`${r},${c}`);
      const edge = p.across ? (r === p.rows / 2 - 1 ? ' line-b' : '') : (c === p.cols / 2 - 1 ? ' line-r' : '');
      grid.append(h('span', { class: 'mm-cell' + edge, style: k ? { background: COLOR[k] } : null }));
    }
    return grid;
  }

  MA.games.register({
    id: 'mirror',
    title: 'Mirror Match',
    icon: '🦋',
    color: '#0891b2',
    shelf: 'Brain games',
    blurb: 'Make both sides match',
    intro: 'Like a butterfly, both sides must match!',
    levels: LEVELS,
    make,
    fromParams,
    explain,
    visual,
    say: p => 'Colour squares so both sides match the mirror.',
    render,
  });
})(window.MA);
