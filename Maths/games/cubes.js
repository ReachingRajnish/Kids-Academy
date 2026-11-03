// Cube Count: count the cubes in a stack, including the ones hiding underneath, and work out how many more make a big cube.
(function (MA) {
  'use strict';

  const { h, rand, pick } = MA.util;
  const M = MA.math;

  const LEVELS = [
    { id: 'cub1', name: 'Towers in a row', eg: '3 towers' },
    { id: 'cub2', name: 'A 2 by 2 stack', eg: 'Some cubes are hiding' },
    { id: 'cub3', name: 'A 2 by 3 stack', eg: 'Count the hidden ones' },
    { id: 'cub4', name: 'A 3 by 3 stack', eg: 'Up to 3 high' },
    { id: 'cubmore', name: 'Make a big cube', eg: 'How many more?' },
  ];
  const COLORS = [['#93c5fd', '#3b82f6', '#1d4ed8'], ['#fca5a5', '#ef4444', '#b91c1c'], ['#86efac', '#22c55e', '#15803d'], ['#fde68a', '#f59e0b', '#b45309']];

  const total = hs => hs.flat().reduce((a, b) => a + b, 0);

  // Heights never get taller towards the front, so every cube on top can be seen.
  function heights(w, d, max, min, least) {
    for (;;) {
      const hs = [];
      for (let y = 0; y < d; y++) {
        hs.push([]);
        for (let x = 0; x < w; x++) {
          const cap = Math.min(y ? hs[y - 1][x] : max, x ? hs[y][x - 1] : max);
          hs[y].push(rand(Math.min(min, cap), cap));
        }
      }
      if (total(hs) >= (least || 2) && hs[0][0] > 0) return hs;
    }
  }

  function problem(hs, color, goal) {
    const n = total(hs);
    const answer = goal ? goal.size - n : n;
    return { mode: goal ? 'more' : 'count', hs, color, goal, answer, params: [hs, color, goal], key: JSON.stringify(hs) + (goal ? 'm' : ''),
      memo: goal ? `${n} + ${answer} = ${goal.size} cubes` : `${hs.flat().filter(Boolean).join(' + ')} = ${n} cubes` };
  }
  const fromParams = pr => problem(pr[0], pr[1], pr[2]);

  function make(level) {
    const color = rand(0, COLORS.length - 1);
    switch (level) {
      case 1: return problem([Array.from({ length: rand(2, 3) }, () => rand(1, 3))], color);
      case 2: return problem(heights(2, 2, 3, 1), color);
      case 3: return problem(heights(3, 2, 3, 1, 6), color);
      case 4: return problem(heights(3, 3, 3, 0, 9), color);
      default: {
        const goal = pick([{ w: 2, d: 2, h: 2, size: 8 }, { w: 3, d: 2, h: 2, size: 12 }, { w: 3, d: 3, h: 2, size: 18 }]);
        let hs;
        do hs = heights(goal.w, goal.d, goal.h, 0, 3); while (total(hs) === goal.size);
        return problem(hs, color, goal);
      }
    }
  }

  function explain(p) {
    const towers = [];
    p.hs.forEach((row, y) => row.forEach((v, x) => v && towers.push(v)));
    const n = total(p.hs);
    const steps = [`Count each tower from the top down: ${towers.join(' + ')} = ${n}.`,
      'Cubes under the top ones are hiding, but they hold the top ones up!'];
    if (p.goal) steps.push(`A ${p.goal.w} by ${p.goal.d} by ${p.goal.h} cube needs ${p.goal.size}. ${p.goal.size} − ${n} = ${p.answer}.`);
    return { hint: 'Count how tall each tower is. Do not forget the cubes underneath.', steps };
  }

  // Draw the stack in 3D: back towers first, so nearer cubes cover them.
  function drawing(p, opts) {
    opts = opts || {};
    const s = opts.size || 46;
    const dx = s * 0.866, dy = s * 0.5;
    const d = p.hs.length, w = p.hs[0].length;
    const maxH = Math.max(...p.hs.flat());
    const W = (w + d) * dx + 4, H = (w + d) * dy + maxH * s + 4;
    const ox = d * dx + 2, oy = maxH * s + 2;
    const P = (x, y, z) => `${(ox + (x - y) * dx).toFixed(1)},${(oy + (x + y) * dy - z * s).toFixed(1)}`;
    const [top, left, right] = COLORS[p.color];
    const cubes = [];
    p.hs.forEach((row, y) => row.forEach((v, x) => { for (let z = 0; z < v; z++) cubes.push([x, y, z]); }));
    cubes.sort((a, b) => a[0] + a[1] - (b[0] + b[1]) || a[2] - b[2]);
    let svg = '';
    for (const [x, y, z] of cubes) {
      svg += `<polygon points="${P(x, y, z + 1)} ${P(x + 1, y, z + 1)} ${P(x + 1, y + 1, z + 1)} ${P(x, y + 1, z + 1)}" fill="${top}"/>`;
      svg += `<polygon points="${P(x, y + 1, z + 1)} ${P(x + 1, y + 1, z + 1)} ${P(x + 1, y + 1, z)} ${P(x, y + 1, z)}" fill="${left}"/>`;
      svg += `<polygon points="${P(x + 1, y, z + 1)} ${P(x + 1, y + 1, z + 1)} ${P(x + 1, y + 1, z)} ${P(x + 1, y, z)}" fill="${right}"/>`;
    }
    return h('div', { class: 'cb-pic' + (opts.small ? ' small' : ''), html:
      `<svg viewBox="0 0 ${W.toFixed(0)} ${H.toFixed(0)}" xmlns="http://www.w3.org/2000/svg" stroke="#1e1b4b" stroke-width="1.6" stroke-linejoin="round">${svg}</svg>` });
  }

  function render(p, stage, api) {
    const tops = p.hs.flat().filter(Boolean).length;
    const opts = [...new Set([p.answer, ...M.nearby(p.answer, 4, { max: 30 }), p.goal ? null : tops].filter(v => v != null && v >= 0))];
    const four = [p.answer, ...opts.filter(v => v !== p.answer).slice(0, 3)].sort(() => Math.random() - 0.5);
    const ch = MA.ui.choices(four, v => api.answer(v, { delay: 1200 }));
    const ask = p.goal ? `How many more cubes make a big ${p.goal.w} by ${p.goal.d} by ${p.goal.h} cube?` : 'How many cubes are there?';
    stage.append(h('div', { class: 'ev' }, h('p', { class: 'nl-ask', text: ask }),
      h('div', { class: 'cb-row' }, drawing(p), p.goal ? h('div', { class: 'cb-goal' }, h('small', { text: `Big cube: ${p.goal.size}` }),
        drawing({ hs: Array.from({ length: p.goal.d }, () => Array(p.goal.w).fill(p.goal.h)), color: 0 }, { size: 22, small: true })) : null),
      ch.el));
    return ch.destroy;
  }

  MA.games.register({
    id: 'cubes',
    title: 'Cube Count',
    icon: '🧊',
    color: '#2563eb',
    shelf: 'Brain games',
    blurb: 'Count cubes, even hidden ones',
    intro: 'Some cubes are hiding underneath. Count them too!',
    levels: LEVELS,
    make,
    fromParams,
    explain,
    visual: p => drawing(p, { size: 26, small: true }),
    say: p => (p.goal ? 'How many more cubes make the big cube?' : 'How many cubes are there?'),
    render,
  });
})(window.MA);
