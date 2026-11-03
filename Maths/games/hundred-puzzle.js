// Hundred Puzzle: find where a number lives on the 100 board, then work out its neighbours.
(function (MA) {
  'use strict';

  const { h, rand, pick } = MA.util;

  const LEVELS = [
    { id: 'hpfind', name: 'Find it on the board', eg: 'Where does 67 go?' },
    { id: 'hp1', name: 'Next door numbers', eg: 'Right of 47' },
    { id: 'hp10', name: 'Above and below', eg: 'Below 47' },
    { id: 'hpall', name: 'All around', eg: 'Above, below, left, right' },
    { id: 'hpdiag', name: 'Corners', eg: 'Below and right of 47' },
    { id: 'hpbig', name: 'Bigger boards', eg: 'Below 347' },
  ];

  // [dr, dc] -> how it changes the number and how to say it
  const DIRS = {
    right: { dr: 0, dc: 1, d: 1, word: 'to the right of', rule: 'Going right adds 1.' },
    left: { dr: 0, dc: -1, d: -1, word: 'to the left of', rule: 'Going left takes away 1.' },
    down: { dr: 1, dc: 0, d: 10, word: 'below', rule: 'Going down adds 10.' },
    up: { dr: -1, dc: 0, d: -10, word: 'above', rule: 'Going up takes away 10.' },
    downRight: { dr: 1, dc: 1, d: 11, word: 'below and to the right of', rule: 'Down adds 10 and right adds 1, so add 11.' },
    downLeft: { dr: 1, dc: -1, d: 9, word: 'below and to the left of', rule: 'Down adds 10 and left takes 1, so add 9.' },
    upRight: { dr: -1, dc: 1, d: -9, word: 'above and to the right of', rule: 'Up takes 10 and right adds 1, so take away 9.' },
    upLeft: { dr: -1, dc: -1, d: -11, word: 'above and to the left of', rule: 'Up takes 10 and left takes 1, so take away 11.' },
  };
  const LEVEL_DIRS = {
    2: ['left', 'right'], 3: ['up', 'down'], 4: ['left', 'right', 'up', 'down'],
    5: ['downRight', 'downLeft', 'upRight', 'upLeft'], 6: Object.keys(DIRS),
  };

  function findProblem(target) {
    return { mode: 'find', target, answer: target, params: ['find', target], key: `f${target}`,
      memo: `${target} is in the row that starts with ${target - ((target - 1) % 10)}` };
  }

  function nearProblem(base, center, dir) {
    const D = DIRS[dir];
    const answer = center + D.d;
    return { mode: 'near', base, center, dir, answer, params: ['near', base, center, dir], key: `n${center}${dir}`,
      memo: `${cap(D.word)} ${center} is ${answer}` };
  }
  const cap = s => s[0].toUpperCase() + s.slice(1);

  function fromParams(params) {
    return params[0] === 'find' ? findProblem(params[1]) : nearProblem(params[1], params[2], params[3]);
  }

  function make(level) {
    if (level === 1) {
      let n;
      do { n = rand(2, 99); } while (n % 10 === 0 || n % 10 === 1);
      return findProblem(n);
    }
    const base = level === 6 ? 100 * rand(1, 9) : 0;
    const center = base + rand(1, 8) * 10 + rand(2, 9); // never on an edge, so every neighbour exists
    return nearProblem(base, center, pick(LEVEL_DIRS[level]));
  }

  function explain(p) {
    if (p.mode === 'find') {
      const start = p.target - ((p.target - 1) % 10);
      return { hint: `${p.target} is in the row that starts with ${start}.`,
        steps: [`Each row starts with a number ending in 1: 1, 11, 21, 31...`, `${p.target} is in the row that starts with ${start}.`,
          `Count along: ${start}, ${start + 1}... ${p.target}.`] };
    }
    const D = DIRS[p.dir];
    return { hint: D.rule, steps: [D.rule, `${p.center} ${D.d > 0 ? '+' : '−'} ${Math.abs(D.d)} = ${p.answer}`] };
  }

  function renderFind(p, stage, api) {
    const board = h('div', { class: 'hp-board' });
    for (let n = 1; n <= 100; n++) {
      const shown = n % 10 === 0 || n % 10 === 1;
      const cell = h('button', { class: 'hp-cell' + (shown ? ' shown' : ''), type: 'button', 'data-n': String(n),
        'aria-label': shown ? String(n) : 'Empty square', text: shown ? String(n) : '' });
      cell.addEventListener('click', () => {
        if (shown) return;
        const ok = api.answer(n, { delay: 1200 });
        if (ok) { cell.textContent = String(n); cell.classList.add('right'); }
        else if (ok === false) {
          cell.textContent = String(n);
          cell.classList.add('wrong');
          api.after(900, () => { cell.textContent = ''; cell.classList.remove('wrong'); });
        }
      });
      board.append(cell);
    }
    stage.append(h('div', { class: 'hp' },
      h('p', { class: 'nl-ask' }, 'Where does ', h('b', { class: 'hp-big', text: String(p.target) }), ' go? Tap its square.'),
      board));
  }

  function renderNear(p, stage, api) {
    const D = DIRS[p.dir];
    let box;
    const grid = h('div', { class: 'hp-window' });
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const isCenter = !dr && !dc;
        const isAsk = dr === D.dr && dc === D.dc;
        const cell = h('span', { class: 'hp-wcell' + (isCenter ? ' center' : '') + (isAsk ? ' ask' : '') },
          isCenter ? String(p.center) : '');
        if (isAsk) box = cell;
        grid.append(cell);
      }
    }
    box.textContent = '?';
    const pad = MA.ui.keypad({
      maxLen: 4,
      onChange: v => { box.textContent = v || '?'; box.classList.remove('wrong'); },
      onSubmit: v => {
        const ok = api.answer(v, { delay: 1000 });
        if (ok) { box.classList.add('right'); pad.disable(true); }
        else if (ok === false) { pad.clear(); box.classList.add('wrong'); if (api.busy()) pad.disable(true); }
      },
    });
    stage.append(h('div', { class: 'hp hp-near' },
      h('div', { class: 'hp-left' },
        h('p', { class: 'nl-ask', text: `What number is ${D.word} ${p.center}?` }),
        h('p', { class: 'hp-board-name', text: p.base ? `Board from ${p.base + 1} to ${p.base + 100}` : 'The 100 board' }),
        grid),
      pad.el));
    return () => pad.destroy();
  }

  MA.games.register({
    id: 'hundred-puzzle',
    title: 'Hundred Puzzle',
    icon: '💯',
    color: '#8b5cf6',
    shelf: 'Place value',
    blurb: 'Find numbers on the 100 board',
    intro: 'Every row on the board goes up by 1. Every column goes up by 10.',
    levels: LEVELS,
    make,
    fromParams,
    say: p => (p.mode === 'find' ? `Where does ${p.target} go?` : `What number is ${DIRS[p.dir].word} ${p.center}?`),
    explain,
    render: (p, stage, api) => (p.mode === 'find' ? renderFind(p, stage, api) : renderNear(p, stage, api)),
  });
})(window.MA);
