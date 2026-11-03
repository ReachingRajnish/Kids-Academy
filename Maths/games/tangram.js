// Shape Puzzle (tangram): fill the dark picture with the pieces. Turn a piece with ↻ until it fits.
(function (MA) {
  'use strict';

  const { h, rand, pick, shuffle } = MA.util;

  const LEVELS = [
    { id: 'tg1', name: 'Fill the shape', eg: '2 or 3 pieces', pool: ['square', 'bar', 'house', 'bigtri', 'tree', 'diamond'], turn: false, lines: true },
    { id: 'tg2', name: 'Turn the pieces', eg: 'Use ↻ to turn', pool: ['house', 'bigtri', 'tree', 'diamond', 'boat', 'bar'], turn: true, lines: true },
    { id: 'tg3', name: 'No lines to help', eg: 'Just the outline', pool: ['tree', 'diamond', 'boat', 'rocket', 'house', 'bigtri'], turn: true, lines: false },
    { id: 'tg4', name: 'One spare piece', eg: 'One piece is not needed', pool: ['boat', 'rocket', 'fish', 'diamond', 'tree'], turn: true, lines: false, spare: true },
  ];
  // Each puzzle is a list of pieces, drawn on a grid of units.
  const PUZZLES = {
    square: { name: 'square', pieces: [[[0, 0], [2, 0], [0, 2]], [[2, 0], [2, 2], [0, 2]]] },
    bar: { name: 'chocolate bar', pieces: [[[0, 0], [1, 0], [0, 1]], [[1, 0], [2, 0], [1, 1], [0, 1]], [[2, 0], [2, 1], [1, 1]]] },
    house: { name: 'house', pieces: [[[0, 1], [1, 0], [1, 1]], [[1, 0], [2, 1], [1, 1]], [[0, 1], [2, 1], [2, 2], [0, 2]]] },
    bigtri: { name: 'big triangle', pieces: [[[0, 0], [1, 0], [1, 1], [0, 1]], [[1, 0], [2, 0], [1, 1]], [[0, 1], [1, 1], [0, 2]]] },
    tree: { name: 'tree', pieces: [[[0, 2], [2, 0], [2, 2]], [[2, 0], [4, 2], [2, 2]], [[1.5, 2], [2.5, 2], [2.5, 4], [1.5, 4]]] },
    diamond: { name: 'diamond', pieces: [[[0, 1], [1, 0], [1, 1]], [[1, 0], [2, 1], [1, 1]], [[0, 1], [1, 1], [1, 2]], [[1, 1], [2, 1], [1, 2]]] },
    boat: { name: 'boat', pieces: [[[1, 0], [1, 2], [3, 2]], [[0, 2], [1, 2], [1, 3]], [[1, 2], [3, 2], [3, 3], [1, 3]], [[3, 2], [4, 2], [3, 3]]] },
    rocket: { name: 'rocket', pieces: [[[1, 1], [2, 2], [1, 2]], [[1, 2], [2, 2], [2, 3], [1, 3]], [[1, 3], [2, 3], [2, 4], [1, 4]], [[0, 4], [1, 3], [1, 4]], [[2, 3], [3, 4], [2, 4]]] },
    fish: { name: 'fish', pieces: [[[0, 1], [1, 0], [1, 1]], [[1, 0], [2, 1], [1, 1]], [[0, 1], [1, 1], [1, 2]], [[1, 1], [2, 1], [1, 2]], [[2, 1], [3, 0], [3, 1]], [[2, 1], [3, 1], [3, 2]]] },
  };
  const SPARES = [[[0, 0], [1, 0], [1, 1], [0, 1]], [[1, 0], [2, 0], [1, 1], [0, 1]], [[0, 0], [2, 0], [0, 2]], [[0, 0], [2, 0], [2, 1], [0, 1]]];
  const COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6'];

  // ---------- Geometry ----------
  const norm = poly => {
    const mx = Math.min(...poly.map(p => p[0])), my = Math.min(...poly.map(p => p[1]));
    return poly.map(([x, y]) => [x - mx, y - my]);
  };
  const turn = poly => norm(poly.map(([x, y]) => [-y, x])); // a quarter turn clockwise
  const turnN = (poly, n) => { let p = norm(poly); for (let k = 0; k < n % 4; k++) p = turn(p); return p; };
  const shapeKey = poly => norm(poly).map(p => p.join(',')).sort().join(' ');
  const fitsSomeTurn = (a, b) => [0, 1, 2, 3].some(k => shapeKey(turnN(a, k)) === shapeKey(b));
  const pts = (poly, u, ox, oy) => poly.map(([x, y]) => `${(ox + x * u).toFixed(1)},${(oy + y * u).toFixed(1)}`).join(' ');

  // ---------- Problems ----------
  function problem(level, id, flip, turns, spare) {
    const lv = LEVELS[level - 1];
    let slots = PUZZLES[id].pieces;
    if (flip) {
      const W = Math.max(...slots.flat().map(p => p[0]));
      slots = slots.map(poly => poly.map(([x, y]) => [W - x, y]));
    }
    const tray = slots.map((poly, k) => ({ base: norm(poly), turn: turns[k], slot: k }));
    if (spare != null) tray.push({ base: SPARES[spare], turn: turns[slots.length] || 0, slot: -1 });
    const order = tray.map((_, k) => k).sort((a, b) => ((a * 7 + turns.length) % 5) - ((b * 7 + turns.length) % 5));
    return { mode: 'tangram', id, slots, tray: order.map(k => tray[k]), lines: lv.lines, answer: `the ${PUZZLES[id].name}`,
      params: [id, flip, turns, spare], key: `${id}${flip ? 'f' : ''}${turns.join('')}`, memo: `Turn pieces with ↻ until they fit` };
  }
  const fromParams = (pr, level) => problem(level, ...pr);
  function make(level) {
    const lv = LEVELS[level - 1];
    const id = pick(lv.pool);
    const n = PUZZLES[id].pieces.length + (lv.spare ? 1 : 0);
    const turns = Array.from({ length: n }, () => (lv.turn ? rand(1, 3) : 0));
    let spare = null;
    if (lv.spare) {
      const ok = SPARES.map((s, k) => k).filter(k => !PUZZLES[id].pieces.some(sl => fitsSomeTurn(SPARES[k], sl)));
      spare = pick(ok);
    }
    return problem(level, id, Math.random() < 0.5, turns, spare);
  }

  function explain(p) {
    return { hint: 'Start with the biggest piece. Turn it with ↻ until it matches a corner of the picture.',
      steps: ['Pick the biggest piece first.', 'Find a corner of the picture with the same shape.', 'Turn the piece with ↻ until it matches, then tap that spot.'] };
  }

  // ---------- Playing ----------
  function render(p, stage, api) {
    const U = 70, pad = 8;
    const W = Math.max(...p.slots.flat().map(q => q[0])), H = Math.max(...p.slots.flat().map(q => q[1]));
    const svgNS = 'http://www.w3.org/2000/svg';
    const board = document.createElementNS(svgNS, 'svg');
    board.setAttribute('viewBox', `0 0 ${W * U + pad * 2} ${H * U + pad * 2}`);
    board.setAttribute('class', 'tg-board');
    const filled = p.slots.map(() => false);
    const slotEls = p.slots.map((poly, j) => {
      const el = document.createElementNS(svgNS, 'polygon');
      el.setAttribute('points', pts(poly, U, pad, pad));
      el.setAttribute('class', 'tg-slot' + (p.lines ? ' lines' : ''));
      el.setAttribute('data-slot', String(j));
      el.addEventListener('click', () => place(j));
      board.append(el);
      return el;
    });

    const state = p.tray.map(t => ({ base: t.base, turn: t.turn, used: false }));
    let sel = -1, slips = 0;
    const trayEl = h('div', { class: 'tg-tray' });
    const rotBtn = h('button', { class: 'btn btn-soft tg-rot', type: 'button', 'aria-label': 'Turn the piece', onclick: () => rotate() }, '↻ Turn');
    function pieceSvg(k) {
      const poly = turnN(state[k].base, state[k].turn);
      const w = Math.max(...poly.map(q => q[0])), hh = Math.max(...poly.map(q => q[1]));
      return `<svg viewBox="-4 -4 ${w * 40 + 8} ${hh * 40 + 8}" width="${w * 40 + 8}" height="${hh * 40 + 8}"><polygon points="${pts(poly, 40, 0, 0)}" fill="${COLORS[k % COLORS.length]}" stroke="#2d2a3e" stroke-width="2.5" stroke-linejoin="round"/></svg>`;
    }
    function paintTray() {
      trayEl.innerHTML = '';
      state.forEach((st, k) => {
        if (st.used) return;
        trayEl.append(h('button', { class: 'tg-piece' + (k === sel ? ' sel' : ''), type: 'button', 'data-piece': String(k), 'aria-label': 'A puzzle piece',
          html: pieceSvg(k), onclick: () => { if (api.busy()) return; if (sel === k) rotate(); else { sel = k; MA.sound.play('tap'); paintTray(); } } }));
      });
      rotBtn.disabled = sel < 0;
    }
    function rotate() {
      if (api.busy() || sel < 0) return;
      state[sel].turn = (state[sel].turn + 1) % 4;
      MA.sound.play('tap');
      api.clearTip();
      paintTray();
    }
    function place(j) {
      if (api.busy() || filled[j]) return;
      if (sel < 0) { api.tip('Pick a piece first, then tap where it goes.'); return; }
      if (shapeKey(turnN(state[sel].base, state[sel].turn)) === shapeKey(p.slots[j])) {
        filled[j] = true;
        slotEls[j].setAttribute('class', 'tg-slot done');
        slotEls[j].style.fill = COLORS[sel % COLORS.length];
        state[sel].used = true;
        sel = -1;
        MA.sound.play('correct');
        api.clearTip();
        paintTray();
        if (filled.every(Boolean)) api.right({ delay: 1400, helped: slips >= 2 });
        return;
      }
      slips++;
      MA.sound.play('wrong');
      api.tip(fitsSomeTurn(state[sel].base, p.slots[j]) ? 'Nearly! Turn it with ↻ and try again.' : "That piece doesn't fit there. Try another spot.");
    }
    paintTray();
    stage.append(h('div', { class: 'ev tg' },
      h('p', { class: 'nl-ask', text: `Fill the ${PUZZLES[p.id].name} with the pieces.` }),
      h('div', { class: 'tg-wrap' }, board),
      h('div', { class: 'tg-tools' }, trayEl, rotBtn)));
  }

  MA.games.register({
    id: 'tangram',
    title: 'Shape Puzzle',
    icon: '🧩',
    color: '#ea580c',
    shelf: 'Brain games',
    blurb: 'Fit the pieces into the picture',
    intro: 'Tap a piece, turn it with ↻, then tap where it fits.',
    levels: LEVELS,
    round: 5,
    make,
    fromParams,
    explain,
    say: p => `Fill the ${PUZZLES[p.id].name} with the pieces.`,
    render,
  });

  MA.tangram = { shapeKey, turnN };
})(window.MA);
