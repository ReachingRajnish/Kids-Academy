// Graph Stall: read picture graphs and bar graphs, then make a bar graph from a tally chart.
(function (MA) {
  'use strict';

  const { h, rand, pick, shuffle } = MA.util;
  const M = MA.math;

  const LEVELS = [
    { id: 'pg1', name: 'Picture graphs', eg: 'How many apples?' },
    { id: 'pg2', name: 'More and altogether', eg: 'How many more cows than pigs?' },
    { id: 'bg1', name: 'Bar graphs', eg: 'Read the top of the bar' },
    { id: 'bg2', name: 'Bar graphs that count in 2s and 5s', eg: '0, 5, 10, 15...' },
    { id: 'tally', name: 'Make a bar graph', eg: 'From a tally chart' },
    { id: 'pgx2', name: 'Each picture is 2', eg: 'Half a picture is 1' },
  ];
  const SETS = [
    { title: 'Fruit in the basket', what: 'fruit', cats: [['🍎', 'apples'], ['🍌', 'bananas'], ['🍇', 'grapes'], ['🍊', 'oranges']] },
    { title: 'Animals on the farm', what: 'animal', cats: [['🐄', 'cows'], ['🐔', 'hens'], ['🐑', 'sheep'], ['🐖', 'pigs']] },
    { title: 'Toys in the toy box', what: 'toy', cats: [['⚽', 'balls'], ['🧸', 'teddies'], ['🚗', 'cars'], ['🪁', 'kites']] },
    { title: 'Weather this month', what: 'kind of day', cats: [['☀️', 'sunny days'], ['🌧️', 'rainy days'], ['☁️', 'cloudy days'], ['🌬️', 'windy days']] },
  ];

  const name = (p, i) => SETS[p.set].cats[i][1];
  const icon = (p, i) => SETS[p.set].cats[i][0];

  function question(p) {
    const [type, a, b] = p.q;
    const what = SETS[p.set].what;
    if (type === 'count') return `How many ${name(p, a)} are there?`;
    if (type === 'more') return `How many more ${name(p, a)} than ${name(p, b)}?`;
    if (type === 'total') return `How many ${name(p, a)} and ${name(p, b)} altogether?`;
    if (type === 'most') return `Which ${what} is there the most of?`;
    return `Which ${what} is there the fewest of?`;
  }

  // ---------- Problems ----------
  // kind: 'pic' (picture graph), 'bar' (bar graph) or 'make' (make a bar graph from a tally).
  function graph(kind, set, values, scale, q) {
    const p = { mode: kind, set, values, scale, q };
    const [type, a, b] = q;
    if (kind === 'make') {
      p.answer = values.map((v, i) => `${name(p, i)} ${v}`).join(', ');
      p.memo = `Tally: ${p.answer}`;
    } else {
      const v = values;
      p.answer = type === 'count' ? v[a] : type === 'more' ? v[a] - v[b] : type === 'total' ? v[a] + v[b]
        : name(p, v.indexOf(type === 'most' ? Math.max(...v) : Math.min(...v)));
      p.memo = type === 'count' ? `${v[a]} ${name(p, a)}` : type === 'more' ? `${v[a]} − ${v[b]} = ${p.answer} more ${name(p, a)}`
        : type === 'total' ? `${v[a]} + ${v[b]} = ${p.answer} altogether` : `${type === 'most' ? 'Most' : 'Fewest'}: ${p.answer}`;
      p.text = question(p);
    }
    p.params = ['graph', kind, set, values, scale, q];
    p.key = `${kind}${set}:${values.join('.')}:${q.join('')}`;
    return p;
  }
  const fromParams = pr => graph(...pr.slice(1));

  function values(n, lo, hi, step, extremes) {
    for (;;) {
      const v = Array.from({ length: n }, () => step * rand(Math.ceil(lo / step), Math.floor(hi / step)));
      const max = Math.max(...v), min = Math.min(...v);
      const uniq = v.filter(x => x === max).length === 1 && v.filter(x => x === min).length === 1;
      if (!extremes || uniq) return v;
    }
  }

  function ask(v, types) {
    const type = pick(types);
    const idx = shuffle(v.map((_, i) => i));
    if (type === 'more') {
      const pair = idx.slice(0, 2).sort((x, y) => v[y] - v[x]);
      if (v[pair[0]] === v[pair[1]]) return ['count', idx[0]];
      return ['more', ...pair];
    }
    if (type === 'total') return ['total', idx[0], idx[1]];
    if (type === 'count') return ['count', idx[0]];
    return [type];
  }

  function make(level) {
    const set = rand(0, SETS.length - 1);
    switch (level) {
      case 1: { const v = values(3, 1, 8, 1, true); return graph('pic', set, v, 1, ask(v, ['count', 'count', 'most', 'least'])); }
      case 2: { const v = values(4, 1, 9, 1, true); return graph('pic', set, v, 1, ask(v, ['more', 'total', 'count', 'more'])); }
      case 3: { const v = values(4, 1, 10, 1, true); return graph('bar', set, v, 1, ask(v, ['count', 'more', 'total', 'most', 'least'])); }
      case 4: {
        const scale = pick([2, 5]);
        const v = values(4, scale, scale * 10, scale, true);
        return graph('bar', set, v, scale, ask(v, ['count', 'more', 'total']));
      }
      case 5: { const n = pick([3, 4]); return graph('make', set, values(n, 1, 9, 1, false), 1, ['make']); }
      default: { const v = values(4, 2, 16, 1, true); return graph('pic', set, v, 2, ask(v, ['count', 'more', 'total', 'count'])); }
    }
  }

  // ---------- Explanations ----------
  function readOne(p, i) {
    const v = p.values[i];
    if (p.mode === 'bar') return `The top of the ${name(p, i)} bar lines up with ${v}.`;
    if (p.scale === 2) {
      const full = Math.floor(v / 2);
      return `${name(p, i)}: ${full} whole picture${full === 1 ? '' : 's'}${v % 2 ? ' and a half' : ''}. Count in twos${v % 2 ? ', then 1 more' : ''}: ${v}.`;
    }
    return `There are ${v} ${name(p, i)}.`;
  }

  function explain(p) {
    if (p.mode === 'make') {
      return { hint: 'Count the tally marks for each one. A bundle of 5 has a line across it.',
        steps: p.values.map((v, i) => `${icon(p, i)} ${name(p, i)}: ${v} tally marks, so the bar goes up to ${v}.`) };
    }
    const [type, a, b] = p.q;
    const how = p.mode === 'bar' ? 'Go to the top of the bar, then look across to the numbers.'
      : p.scale === 2 ? 'Each picture means 2. Count in twos, and half a picture is 1.' : 'Count the pictures in the row.';
    if (type === 'count') return { hint: how, steps: [readOne(p, a), `So there are ${p.answer}.`] };
    if (type === 'more') return { hint: `Find both numbers, then take the smaller one from the bigger one.`,
      steps: [readOne(p, a), readOne(p, b), `${p.values[a]} − ${p.values[b]} = ${p.answer}`] };
    if (type === 'total') return { hint: 'Find both numbers, then add them.',
      steps: [readOne(p, a), readOne(p, b), `${p.values[a]} + ${p.values[b]} = ${p.answer}`] };
    const pickV = type === 'most' ? Math.max(...p.values) : Math.min(...p.values);
    return { hint: type === 'most' ? `Look for the ${p.mode === 'bar' ? 'tallest bar' : 'longest row'}.` : `Look for the ${p.mode === 'bar' ? 'shortest bar' : 'shortest row'}.`,
      steps: [p.values.map((v, i) => `${name(p, i)} ${v}`).join(', '), `The ${type === 'most' ? 'biggest' : 'smallest'} number is ${pickV}, so it is ${p.answer}.`] };
  }

  // ---------- Drawing ----------
  function picGraph(p) {
    return h('div', { class: 'gr-card' },
      h('h3', { class: 'gr-title', text: SETS[p.set].title }),
      h('div', { class: 'gr-pic' }, p.values.map((v, i) => {
        const pics = [];
        const full = p.scale === 2 ? Math.floor(v / 2) : v;
        for (let k = 0; k < full; k++) pics.push(h('span', { class: 'gr-p', text: icon(p, i) }));
        if (p.scale === 2 && v % 2) pics.push(h('span', { class: 'gr-p half' }, h('span', { text: icon(p, i) })));
        return h('div', { class: 'gr-prow', 'data-cat': String(i) }, h('span', { class: 'gr-plabel', text: name(p, i) }), h('span', { class: 'gr-pics' }, pics));
      })),
      p.scale === 2 ? h('p', { class: 'gr-key' }, 'Key: each ', h('b', { text: icon(p, 0) }), ' = 2') : null);
  }

  function tallyMarks(v) {
    let html = '';
    for (let g = 0; g < Math.ceil(v / 5); g++) {
      const n = Math.min(5, v - g * 5);
      let lines = '';
      for (let k = 0; k < Math.min(n, 4); k++) lines += `<line x1="${5 + k * 7}" y1="3" x2="${5 + k * 7}" y2="27"/>`;
      if (n === 5) lines += '<line x1="1" y1="24" x2="31" y2="6"/>';
      html += `<svg viewBox="0 0 34 30" width="34" height="30" stroke="#3b3355" stroke-width="3" stroke-linecap="round">${lines}</svg>`;
    }
    return h('span', { class: 'gr-tally', html, 'aria-label': `${v} tally marks` });
  }

  // A bar chart. With onSet, every column is a stack of buttons: tap a height to set the bar.
  function barGraph(p, vals, onSet) {
    const max = p.scale * 10;
    const grid = h('div', { class: 'gr-plot' });
    for (let k = 0; k <= 10; k++) grid.append(h('span', { class: 'gr-line', style: { bottom: (k * 10) + '%' } }, h('b', { text: String(k * p.scale) })));
    const cols = vals.map((v, i) => {
      const col = h('div', { class: 'gr-col', 'data-cat': String(i) },
        h('div', { class: 'gr-bar', style: { height: (100 * v / max) + '%', '--bc': ['#ef5b5b', '#f5b70a', '#7c5cff', '#22a95b'][i] } }));
      if (onSet) {
        for (let k = 1; k <= 10; k++) {
          col.append(h('button', { class: 'gr-cell', type: 'button', 'data-cat': String(i), 'data-v': String(k), 'aria-label': `${name(p, i)} ${k}`,
            style: { bottom: ((k - 1) * 10) + '%' }, onclick: () => onSet(i, k) }));
        }
      }
      return col;
    });
    grid.append(h('div', { class: 'gr-cols' }, cols));
    return h('div', { class: 'gr-card' },
      h('h3', { class: 'gr-title', text: SETS[p.set].title }),
      grid,
      h('div', { class: 'gr-names' }, vals.map((_, i) => h('span', {}, h('b', { text: icon(p, i) }), h('small', { text: name(p, i) })))));
  }

  function render(p, stage, api) {
    if (p.mode === 'make') {
      const vals = p.values.map(() => 0);
      let chart;
      const holder = h('div', { class: 'gr-holder' });
      const paint = () => { chart = barGraph(p, vals, set); holder.innerHTML = ''; holder.append(chart); };
      function set(i, k) {
        if (api.busy()) return;
        vals[i] = vals[i] === k ? k - 1 : k;
        MA.sound.play('tap');
        api.clearTip();
        paint();
      }
      paint();
      const tally = h('div', { class: 'gr-card gr-tallies' }, h('h3', { class: 'gr-title', text: 'Tally chart' }),
        p.values.map((v, i) => h('div', { class: 'gr-trow' }, h('span', { class: 'gr-plabel', text: `${icon(p, i)} ${name(p, i)}` }), tallyMarks(v))));
      const check = h('button', { class: 'btn btn-main btn-big gr-check', type: 'button', onclick: () => {
        if (api.busy()) return;
        const bad = vals.findIndex((v, i) => v !== p.values[i]);
        if (bad < 0) return api.right({ delay: 1200 });
        api.wrong(`Check the ${name(p, bad)} bar. Count its tally marks again.`);
      } }, '✓ Check');
      stage.append(h('div', { class: 'ev' }, h('p', { class: 'nl-ask', text: 'Make the bar graph. Tap to make each bar the right height.' }),
        h('div', { class: 'gr-two' }, tally, holder), check));
      return null;
    }
    const type = p.q[0];
    const cats = type === 'most' || type === 'least';
    const opts = cats ? p.values.map((_, i) => name(p, i)) : M.nearby(p.answer, 4, { max: 100, step: p.mode === 'bar' ? p.scale : 1 });
    const ch = MA.ui.choices(opts, v => api.answer(v, { delay: 1200 }),
      { className: cats ? 'cc-choices' : '', label: cats ? v => { const i = p.values.findIndex((_, k) => name(p, k) === v); return [h('b', { text: icon(p, i) }), h('small', { text: v })]; } : null });
    stage.append(h('div', { class: 'ev' }, h('p', { class: 'nl-ask', text: p.text }),
      p.mode === 'bar' ? barGraph(p, p.values) : picGraph(p), ch.el));
    return ch.destroy;
  }

  MA.games.register({
    id: 'graphs',
    title: 'Graph Stall',
    icon: '📊',
    color: '#2563eb',
    shelf: 'Measuring and graphs',
    blurb: 'Picture graphs and bar graphs',
    intro: 'Graphs show how many of each thing there are.',
    levels: LEVELS,
    make,
    fromParams,
    explain,
    check: (p, v) => (Array.isArray(v) ? v.join() === p.values.join() : v === p.answer),
    say: p => (p.mode === 'make' ? 'Make the bar graph from the tally chart.' : p.text),
    render,
  });
})(window.MA);
