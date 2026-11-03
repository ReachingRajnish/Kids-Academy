// Shape Hunt: find shapes, count sides and corners, name solid shapes and their faces, and spot lines of symmetry.
(function (MA) {
  'use strict';

  const { h, rand, pick, shuffle } = MA.util;
  const M = MA.math;

  const LEVELS = [
    { id: 'hunt1', name: 'Find the shapes', eg: 'Tap all the triangles' },
    { id: 'hunt2', name: 'Tricky shape hunt', eg: 'Squares that are turned' },
    { id: 'sides', name: 'Sides and corners', eg: 'How many sides?' },
    { id: 'solid', name: 'Solid shapes', eg: 'Cube, cone, cylinder' },
    { id: 'faces', name: 'Faces, edges and corners', eg: 'A cube has ? faces' },
    { id: 'sym', name: 'Lines of symmetry', eg: 'Do both halves match?' },
  ];
  const COLORS = ['#ef5b5b', '#f5a524', '#22a95b', '#4f9cf9', '#a855f7', '#ec4899', '#14b8a6'];
  const FLAT = {
    circle: { sides: 0, tip: 'A circle is round all the way, with no corners.' },
    triangle: { sides: 3, tip: 'A triangle has 3 straight sides and 3 corners.' },
    square: { sides: 4, tip: 'A square has 4 sides all the same length, even when it is turned.' },
    rectangle: { sides: 4, tip: 'A rectangle has 4 sides and 4 square corners. Two sides are long and two are short.' },
    pentagon: { sides: 5, tip: 'A pentagon has 5 sides.' },
    hexagon: { sides: 6, tip: 'A hexagon has 6 sides.' },
    octagon: { sides: 8, tip: 'An octagon has 8 sides.' },
    oval: { sides: 0, tip: 'An oval is a stretched circle.' },
    rhombus: { sides: 4, tip: 'A rhombus looks like a diamond. Its corners are not square corners.' },
  };
  const SOLIDS = {
    cube: { faces: 6, edges: 12, corners: 8, things: ['🎲', '🧊'], tip: 'A cube has 6 square faces, like a dice.' },
    cuboid: { faces: 6, edges: 12, corners: 8, things: ['📦', '🧱'], tip: 'A cuboid is like a box: 6 rectangle faces.' },
    sphere: { flat: 0, things: ['⚽', '🏀', '🌍'], tip: 'A sphere is round like a ball. It has no flat faces.' },
    cylinder: { flat: 2, things: ['🥫', '🔋'], tip: 'A cylinder is like a tin: 2 flat circles and a curved side.' },
    cone: { flat: 1, things: ['🍦'], tip: 'A cone has 1 flat circle and a point at the top.' },
    pyramid: { faces: 5, edges: 8, corners: 5, things: [], tip: 'A pyramid has a square at the bottom and triangles that meet at a point.' },
    prism: { faces: 5, edges: 9, corners: 6, things: ['⛺'], tip: 'A triangular prism has 2 triangles and 3 rectangles, like a tent.' },
  };
  const plural = k => k + 's';
  const article = k => (/^[aeiou]/.test(k) ? 'an ' : 'a ') + k;

  // ---------- Drawing flat shapes (all centred on 50, 50) ----------
  const pts = list => list.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  function regular(n, r, start) {
    const out = [];
    for (let k = 0; k < n; k++) {
      const a = (start + k * 360 / n) * Math.PI / 180;
      out.push([50 + r * Math.cos(a), 50 + r * Math.sin(a)]);
    }
    return out;
  }
  const TRIANGLES = [regular(3, 44, -90), [[50, 8], [80, 88], [20, 88]], [[14, 86], [86, 86], [14, 20]], [[12, 84], [88, 76], [36, 16]]];
  function outline(k, v) {
    switch (k) {
      case 'circle': return '<circle cx="50" cy="50" r="42"/>';
      case 'oval': return '<ellipse cx="50" cy="50" rx="45" ry="27"/>';
      case 'triangle': return `<polygon points="${pts(TRIANGLES[v || 0])}"/>`;
      case 'square': return `<polygon points="${pts(regular(4, 52, -45))}"/>`;
      case 'rectangle': return v ? '<rect x="6" y="32" width="88" height="36"/>' : '<rect x="10" y="24" width="80" height="52"/>';
      case 'rhombus': return '<polygon points="50,4 80,50 50,96 20,50"/>';
      case 'pentagon': return `<polygon points="${pts(regular(5, 46, -90))}"/>`;
      case 'hexagon': return `<polygon points="${pts(regular(6, 46, -90))}"/>`;
      case 'octagon': return `<polygon points="${pts(regular(8, 46, -67.5))}"/>`;
      default: return '<path d="M50 88 C20 66 6 50 10 32 C14 16 36 12 50 30 C64 12 86 16 90 32 C94 50 80 66 50 88 Z"/>'; // heart
    }
  }
  function flat(it, extra) {
    return `<svg viewBox="-4 -4 108 108" xmlns="http://www.w3.org/2000/svg"><g transform="rotate(${it.rot || 0} 50 50)" fill="${COLORS[it.c || 0]}" stroke="#3b3355" stroke-width="3" stroke-linejoin="round">${outline(it.k, it.v)}</g>${extra || ''}</svg>`;
  }

  // ---------- Drawing solid shapes ----------
  function solid(k, color) {
    const c = color || '#4f9cf9';
    const st = 'stroke="#3b3355" stroke-width="2.5" stroke-linejoin="round"';
    const dash = 'stroke="#3b3355" stroke-width="2" stroke-dasharray="5 4" fill="none"';
    const shade = (x, o) => `<g opacity="${o}">${x}</g>`;
    const body = {
      cube: `<polygon points="25,45 75,45 75,95 25,95" fill="${c}" ${st}/>${shade(`<polygon points="25,45 45,25 95,25 75,45" fill="#fff" ${st}/>`, 0.6)}<polygon points="25,45 45,25 95,25 75,45" fill="${c}" fill-opacity=".7" ${st}/><polygon points="75,45 95,25 95,75 75,95" fill="${c}" fill-opacity=".85" ${st}/><polygon points="75,45 95,25 95,75 75,95" fill="#000" fill-opacity=".15"/>`,
      cuboid: `<polygon points="10,55 85,55 85,98 10,98" fill="${c}" ${st}/><polygon points="10,55 32,35 107,35 85,55" fill="${c}" fill-opacity=".7" ${st}/><polygon points="85,55 107,35 107,78 85,98" fill="${c}" ${st}/><polygon points="85,55 107,35 107,78 85,98" fill="#000" fill-opacity=".15"/>`,
      sphere: `<defs><radialGradient id="sg" cx="35%" cy="35%"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="${c}"/><stop offset="1" stop-color="${c}"/></radialGradient></defs><circle cx="60" cy="60" r="46" fill="url(#sg)" ${st}/><path d="M14 60 A46 13 0 0 0 106 60" fill="none" stroke="#3b3355" stroke-width="2"/><path d="M14 60 A46 13 0 0 1 106 60" ${dash}/>`,
      cylinder: `<path d="M24 28 L24 92 A36 11 0 0 0 96 92 L96 28" fill="${c}" ${st}/><path d="M24 92 A36 11 0 0 1 96 92" ${dash}/><ellipse cx="60" cy="28" rx="36" ry="11" fill="${c}" ${st}/><ellipse cx="60" cy="28" rx="36" ry="11" fill="#fff" fill-opacity=".35"/>`,
      cone: `<path d="M60 10 L22 92 A38 11 0 0 0 98 92 Z" fill="${c}" ${st}/><path d="M22 92 A38 11 0 0 1 98 92" ${dash}/>`,
      pyramid: `<polygon points="60,10 14,88 72,104" fill="${c}" ${st}/><polygon points="60,10 72,104 108,80" fill="${c}" ${st}/><polygon points="60,10 72,104 108,80" fill="#000" fill-opacity=".15"/><path d="M14 88 L50 66 L108 80 M50 66 L60 10" ${dash}/>`,
      prism: `<polygon points="12,98 40,48 68,98" fill="${c}" ${st}/><polygon points="40,48 80,22 108,72 68,98" fill="${c}" fill-opacity=".8" ${st}/><polygon points="40,48 80,22 108,72 68,98" fill="#000" fill-opacity=".12"/><path d="M12 98 L52 72 L80 22 M52 72 L108 72" ${dash}/>`,
    }[k];
    return `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
  }

  // ---------- Problems ----------
  function hunt(target, items) {
    const n = items.filter(it => it.k === target).length;
    return { mode: 'hunt', target, items, answer: `${n} ${plural(target)}`, params: ['hunt', target, items],
      key: `hunt${target}${items.map(it => it.k[0] + (it.rot || 0)).join('')}`, memo: FLAT[target].tip };
  }
  function sides(k, v, rot, ask) {
    const n = FLAT[k].sides;
    return { mode: 'sides', k, v, rot, ask, answer: n, params: ['sides', k, v, rot, ask], key: `sides${k}${v}${ask}`,
      memo: `${article(k)[0].toUpperCase() + article(k).slice(1)} has ${n} ${ask}` };
  }
  function name3d(k, thing) {
    return { mode: 'name3d', k, thing, answer: k, params: ['name3d', k, thing], key: `n3${k}${thing || ''}`,
      memo: thing ? `${thing} is shaped like ${article(k)}` : SOLIDS[k].tip };
  }
  function faces(k, ask) {
    const answer = SOLIDS[k][ask];
    const what = ask === 'flat' ? 'flat faces' : ask;
    return { mode: 'faces', k, ask, answer, params: ['faces', k, ask], key: `f${k}${ask}`,
      memo: `${article(k)[0].toUpperCase() + article(k).slice(1)} has ${answer} ${what}` };
  }
  function sym(k, v, angle, yes) {
    return { mode: 'sym', k, v, angle, yes, answer: yes ? 'Yes' : 'No', params: ['sym', k, v, angle, yes], key: `sym${k}${v}${angle}`,
      memo: yes ? `The line folds the ${k === 'heart' ? 'heart' : k} into two matching halves` : 'The two halves do not match, so it is not a line of symmetry' };
  }

  function fromParams(pr) {
    const [mode, ...a] = pr;
    return { hunt, sides, name3d, faces, sym }[mode](...a);
  }

  function field(target, pool, count, turn) {
    const others = pool.filter(k => k !== target && !(target === 'rectangle' && k === 'square'));
    const hits = rand(2, 4);
    const kinds = shuffle([...Array(hits).fill(target), ...Array.from({ length: count - hits }, () => pick(others))]);
    return kinds.map(k => ({
      k, c: rand(0, COLORS.length - 1),
      v: k === 'triangle' ? rand(0, turn ? 3 : 1) : k === 'rectangle' ? rand(0, 1) : 0,
      rot: turn ? pick([0, 15, 30, 45, 60, 90, 120, 160]) : k === 'square' || k === 'rectangle' ? 0 : pick([0, 0, 180]),
    }));
  }

  // Lines of symmetry for each shape, in degrees (0 is across, 90 is up and down).
  const AXES = {
    square: [0, 45, 90, 135], rectangle: [0, 90], rhombus: [0, 90], triangle: [90, 30, 150], tall: [90],
    pentagon: [90, 126, 162, 18, 54], hexagon: [0, 30, 60, 90, 120, 150], heart: [90], scalene: [],
  };
  const SYM = [['square', 0], ['rectangle', 0], ['rhombus', 0], ['triangle', 0], ['tall', 1], ['pentagon', 0], ['hexagon', 0], ['heart', 0], ['scalene', 3]];

  function make(level) {
    switch (level) {
      case 1: {
        const pool = ['triangle', 'circle', 'square', 'rectangle'];
        const target = pick(pool);
        return hunt(target, field(target, pool, 8, false));
      }
      case 2: {
        const target = pick(['triangle', 'square', 'rectangle', 'pentagon', 'hexagon']);
        return hunt(target, field(target, ['triangle', 'square', 'rectangle', 'pentagon', 'hexagon', 'octagon', 'oval', 'rhombus', 'circle'], 9, true));
      }
      case 3: {
        const k = pick(['triangle', 'square', 'rectangle', 'pentagon', 'hexagon', 'octagon', 'rhombus']);
        return sides(k, k === 'triangle' ? rand(0, 3) : 0, pick([0, 0, 20, 45, 90]), pick(['sides', 'corners']));
      }
      case 4: {
        const k = pick(Object.keys(SOLIDS));
        const things = SOLIDS[k].things;
        return name3d(k, things.length && Math.random() < 0.5 ? pick(things) : null);
      }
      case 5: {
        const k = pick(Object.keys(SOLIDS));
        return faces(k, SOLIDS[k].faces ? pick(['faces', 'edges', 'corners']) : 'flat');
      }
      default: {
        const [k, v] = pick(SYM);
        const axes = AXES[k];
        if (axes.length && Math.random() < 0.5) return sym(k, v, pick(axes), true);
        const off = [0, 30, 45, 60, 90, 120, 135, 150].filter(a => axes.every(x => Math.min(Math.abs(a - x), 180 - Math.abs(a - x)) >= 12));
        return sym(k, v, pick(off), false);
      }
    }
  }

  // ---------- Explanations ----------
  function explain(p) {
    switch (p.mode) {
      case 'hunt': return { hint: FLAT[p.target].tip, steps: [FLAT[p.target].tip, `There are ${p.answer} to find.`] };
      case 'sides': return { hint: `Put your finger on one ${p.ask === 'sides' ? 'side' : 'corner'} and count round.`,
        steps: [`Start at the top and count each ${p.ask === 'sides' ? 'straight side' : 'corner'} going round.`, `${article(p.k)[0].toUpperCase() + article(p.k).slice(1)} has ${p.answer} sides and ${p.answer} corners.`] };
      case 'name3d': return { hint: SOLIDS[p.k].tip, steps: [SOLIDS[p.k].tip, `So it is ${article(p.k)}.`] };
      case 'faces': {
        const s = SOLIDS[p.k];
        if (p.ask === 'flat') return { hint: 'A face is a flat side. Curved sides are not flat faces.', steps: [s.tip, `So ${article(p.k)} has ${p.answer} flat face${p.answer === 1 ? '' : 's'}.`] };
        const what = { faces: 'A face is a flat side.', edges: 'An edge is where two faces meet.', corners: 'A corner is where edges meet at a point.' }[p.ask];
        return { hint: what + ' Remember the ones you cannot see at the back.',
          steps: [what, s.tip, `${article(p.k)[0].toUpperCase() + article(p.k).slice(1)} has ${s.faces} faces, ${s.edges} edges and ${s.corners} corners.`] };
      }
      default: return { hint: 'Imagine folding the shape along the dashed line. Would the two halves match?',
        steps: ['Fold the shape along the dashed line in your head.', p.yes ? 'Both halves fit exactly on top of each other.' : 'The halves do not fit on top of each other.',
          p.yes ? 'So it is a line of symmetry.' : 'So it is not a line of symmetry.'] };
    }
  }

  // ---------- Playing ----------
  function symShape(p) {
    const k = p.k === 'tall' || p.k === 'scalene' ? 'triangle' : p.k;
    const a = p.angle * Math.PI / 180;
    const dx = 62 * Math.cos(a), dy = -62 * Math.sin(a);
    const line = `<line x1="${50 - dx}" y1="${50 - dy}" x2="${50 + dx}" y2="${50 + dy}" stroke="#2d2a3e" stroke-width="3.5" stroke-dasharray="7 5" stroke-linecap="round"/>`;
    return h('div', { class: 'sp-big', html: flat({ k, v: p.v, c: 4 }, line).replace('viewBox="-4 -4 108 108"', 'viewBox="-14 -14 128 128"') });
  }

  function renderHunt(p, stage, api) {
    const found = new Set();
    const need = p.items.filter(it => it.k === p.target).length;
    const counter = h('span', { class: 'sp-count', text: `0 of ${need}` });
    const btns = p.items.map((it, i) => h('button', { class: 'sp-shape', type: 'button', 'data-i': String(i), 'aria-label': 'A shape',
      style: { '--s': (0.72 + ((i * 37) % 28) / 100).toFixed(2) }, html: flat(it), onclick: e => {
        const b = e.currentTarget;
        if (api.busy() || found.has(i)) return;
        if (it.k === p.target) {
          found.add(i);
          b.classList.add('found');
          MA.sound.play('tap');
          counter.textContent = `${found.size} of ${need}`;
          if (found.size === need) api.right({ delay: 1100 });
        } else {
          b.classList.add('nope');
          api.after(600, () => b.classList.remove('nope'));
          api.wrong(`That one is ${article(it.k)}. ${FLAT[p.target].tip}`);
        }
      } }));
    stage.append(h('div', { class: 'ev' },
      h('p', { class: 'nl-ask' }, `Tap all the ${plural(p.target)}! `, counter),
      h('div', { class: 'sp-field' }, btns)));
  }

  function render(p, stage, api) {
    if (p.mode === 'hunt') return renderHunt(p, stage, api);
    let ask, pic, opts, label = null;
    if (p.mode === 'sides') {
      ask = `How many ${p.ask} does this shape have?`;
      pic = h('div', { class: 'sp-big', html: flat({ k: p.k, v: p.v, rot: p.rot, c: rand(0, 6) }) });
      opts = [3, 4, 5, 6, 8];
    } else if (p.mode === 'name3d') {
      ask = p.thing ? `What shape is this ${p.thing} like?` : 'What is this solid shape called?';
      pic = p.thing ? h('div', { class: 'cal-big sp-thing', text: p.thing }) : h('div', { class: 'sp-big', html: solid(p.k, COLORS[rand(0, 6)]) });
      opts = shuffle([p.k, ...shuffle(Object.keys(SOLIDS).filter(k => k !== p.k)).slice(0, 3)]);
    } else if (p.mode === 'faces') {
      const what = p.ask === 'flat' ? 'flat faces' : p.ask;
      ask = `How many ${what} does ${article(p.k)} have?`;
      pic = h('div', { class: 'sp-big', html: solid(p.k, COLORS[rand(0, 6)]) });
      opts = M.nearby(p.answer, 4, { max: 14 });
    } else {
      ask = 'Is the dashed line a line of symmetry?';
      pic = symShape(p);
      opts = ['Yes', 'No'];
      label = v => [h('b', { text: v === 'Yes' ? '👍 Yes' : '👎 No' })];
    }
    const ch = MA.ui.choices(opts, v => api.answer(v, { delay: 1200 }), { className: label ? 'cc-choices' : '', label });
    stage.append(h('div', { class: 'ev' }, h('p', { class: 'nl-ask', text: ask }), pic, ch.el));
    return ch.destroy;
  }

  function visual(p) {
    if (p.mode === 'hunt') return h('div', { class: 'sp-row' }, p.items.filter(it => it.k === p.target).map(it => h('span', { class: 'sp-mini', html: flat(it) })));
    if (p.mode === 'sym') return symShape(p);
    if (p.mode === 'name3d' || p.mode === 'faces') return h('div', { class: 'sp-mid', html: solid(p.k) });
    return null;
  }

  MA.games.register({
    id: 'shapes',
    title: 'Shape Hunt',
    icon: '🔷',
    color: '#7c3aed',
    shelf: 'Shapes and fractions',
    blurb: 'Flat shapes, solid shapes and symmetry',
    intro: 'Look closely: count the sides and the corners!',
    levels: LEVELS,
    make,
    fromParams,
    explain,
    visual,
    say: p => (p.mode === 'hunt' ? `Tap all the ${plural(p.target)}.`
      : p.mode === 'sides' ? `How many ${p.ask} does this shape have?`
        : p.mode === 'name3d' ? 'What is this solid shape called?'
          : p.mode === 'faces' ? `How many ${p.ask === 'flat' ? 'flat faces' : p.ask} does ${article(p.k)} have?`
            : 'Is the dashed line a line of symmetry?'),
    render,
  });
})(window.MA);
