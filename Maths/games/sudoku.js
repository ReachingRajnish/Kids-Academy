// Picture Sudoku: fill the grid so every row, column and box has each picture (or number) once. 4×4, then 6×6.
(function (MA) {
  'use strict';

  const { h, rand, shuffle } = MA.util;

  const LEVELS = [
    { id: 'sd4a', name: 'Fruit sudoku', eg: '4 empty squares', n: 4, blanks: 4, pics: true },
    { id: 'sd4b', name: 'Bigger fruit sudoku', eg: '7 empty squares', n: 4, blanks: 7, pics: true },
    { id: 'sd4c', name: 'Number sudoku', eg: '1, 2, 3 and 4', n: 4, blanks: 8 },
    { id: 'sd4d', name: 'Tricky number sudoku', eg: '10 empty squares', n: 4, blanks: 10 },
    { id: 'sd6a', name: '6 by 6 sudoku', eg: '1 to 6', n: 6, blanks: 14 },
    { id: 'sd6b', name: 'Tricky 6 by 6', eg: '20 empty squares', n: 6, blanks: 20 },
  ];
  const PICS = ['🍎', '🍌', '🍇', '🍊', '🍓', '🥝'];
  const BOX = { 4: [2, 2], 6: [2, 3] }; // rows and columns in each box

  const peers = (n, i) => {
    const [br, bc] = BOX[n];
    const r = Math.floor(i / n), c = i % n;
    const out = [];
    for (let j = 0; j < n * n; j++) {
      const r2 = Math.floor(j / n), c2 = j % n;
      if (j !== i && (r2 === r || c2 === c || (Math.floor(r2 / br) === Math.floor(r / br) && Math.floor(c2 / bc) === Math.floor(c / bc)))) out.push(j);
    }
    return out;
  };

  // How many ways the grid can be finished (stops counting at 2).
  function solutions(n, grid) {
    const g = grid.slice();
    const pe = Array.from({ length: n * n }, (_, i) => peers(n, i));
    let count = 0;
    (function go() {
      if (count > 1) return;
      const i = g.indexOf(0);
      if (i < 0) { count++; return; }
      for (let v = 1; v <= n; v++) {
        if (pe[i].some(j => g[j] === v)) continue;
        g[i] = v;
        go();
        g[i] = 0;
      }
    })();
    return count;
  }

  function newPuzzle(n, blanks) {
    const [br, bc] = BOX[n];
    const order = (size, group) => shuffle(Array.from({ length: size / group }, (_, k) => k)).flatMap(b => shuffle(Array.from({ length: group }, (_, k) => b * group + k)));
    const rows = order(n, br), cols = order(n, bc), syms = shuffle(Array.from({ length: n }, (_, k) => k + 1));
    const sol = [];
    for (const r of rows) for (const c of cols) sol.push(syms[((r % br) * bc + Math.floor(r / br) + c) % n]);
    const grid = sol.slice();
    let removed = 0;
    for (const i of shuffle(sol.map((_, k) => k))) {
      if (removed >= blanks) break;
      const keep = grid[i];
      grid[i] = 0;
      if (solutions(n, grid) === 1) removed++;
      else grid[i] = keep;
    }
    return { sol: sol.join(''), grid: grid.join('') };
  }

  function puzzle(level, sol, grid) {
    const lv = LEVELS[level - 1];
    return { mode: 'sudoku', n: lv.n, pics: !!lv.pics, sol, grid, answer: 'every row, column and box filled', params: [sol, grid], key: grid,
      memo: `Each row, column and box has every ${lv.pics ? 'fruit' : 'number'} once` };
  }
  const fromParams = (pr, level) => puzzle(level, pr[0], pr[1]);
  function make(level) {
    const lv = LEVELS[level - 1];
    const { sol, grid } = newPuzzle(lv.n, lv.blanks);
    return puzzle(level, sol, grid);
  }

  const word = p => (p.pics ? 'fruit' : 'number');
  function explain(p) {
    return { hint: `Find a row or column with only one empty square. Which ${word(p)} is missing?`,
      steps: [`Look at one row. Which ${word(p)} is not there yet?`, 'Check its column and its box too.', 'Fill the squares that can only be one thing first.'] };
  }

  function render(p, stage, api) {
    const n = p.n, [br, bc] = BOX[n];
    const sym = v => (p.pics ? PICS[v - 1] : String(v));
    const cur = p.grid.split('').map(Number);
    const sol = p.sol.split('').map(Number);
    let sel = -1, slips = 0;

    const cells = cur.map((v, i) => {
      const r = Math.floor(i / n), c = i % n;
      const cls = 'sd-cell' + (v ? ' given' : ' empty') + ((c + 1) % bc === 0 && c < n - 1 ? ' bx' : '') + ((r + 1) % br === 0 && r < n - 1 ? ' by' : '');
      const b = h(v ? 'span' : 'button', { class: cls, type: v ? null : 'button', 'data-cell': String(i), 'aria-label': v ? sym(v) : 'Empty square' }, v ? sym(v) : '');
      if (!v) b.addEventListener('click', () => { if (!api.busy()) { sel = i; MA.sound.play('tap'); paint(); } });
      return b;
    });
    function paint() {
      if (sel >= 0 && cur[sel]) sel = cur.indexOf(0);
      cells.forEach((b, i) => b.classList.toggle('sel', i === sel));
    }
    function put(v) {
      if (api.busy()) return;
      if (sel < 0) sel = cur.indexOf(0);
      if (sel < 0) return;
      const cell = cells[sel];
      if (sol[sel] === v) {
        cur[sel] = v;
        cell.textContent = sym(v);
        cell.classList.remove('empty');
        cell.classList.add('filled');
        cell.disabled = true;
        MA.sound.play('tap');
        api.clearTip();
        if (!cur.includes(0)) { sel = -1; paint(); api.right({ delay: 1400, helped: slips >= 2 }); return; }
        sel = cur.indexOf(0, sel) >= 0 ? cur.indexOf(0, sel) : cur.indexOf(0);
        paint();
        return;
      }
      slips++;
      MA.sound.play('wrong');
      cell.classList.add('nope');
      api.after(450, () => cell.classList.remove('nope'));
      const r = Math.floor(sel / n), c = sel % n;
      const same = j => cur[j] === v;
      const inRow = Array.from({ length: n }, (_, k) => r * n + k).some(same);
      const inCol = Array.from({ length: n }, (_, k) => k * n + c).some(same);
      api.tip(inRow ? `There is already ${sym(v)} in this row.` : inCol ? `There is already ${sym(v)} in this column.`
        : peers(n, sel).some(same) ? `There is already ${sym(v)} in this box.` : `${sym(v)} doesn't go here. Try another empty square first.`);
    }
    sel = cur.indexOf(0);
    paint();
    const palette = h('div', { class: 'sd-palette' }, Array.from({ length: n }, (_, k) =>
      h('button', { class: 'sd-sym', type: 'button', 'data-sym': String(k + 1), onclick: () => put(k + 1) }, sym(k + 1))));
    stage.append(h('div', { class: 'ev sd' },
      h('p', { class: 'nl-ask', text: `Every row, column and box needs each ${word(p)} once.` }),
      h('div', { class: 'sd-grid', style: { '--n': n } }, cells),
      palette));
  }

  MA.games.register({
    id: 'sudoku',
    title: 'Picture Sudoku',
    icon: '🍓',
    color: '#e11d48',
    shelf: 'Brain games',
    blurb: 'Fill every row, column and box',
    intro: 'Tap an empty square, then pick what goes there.',
    levels: LEVELS,
    round: 5,
    make,
    fromParams,
    explain,
    say: p => `Every row, column and box needs each ${word(p)} once.`,
    render,
  });
})(window.MA);
