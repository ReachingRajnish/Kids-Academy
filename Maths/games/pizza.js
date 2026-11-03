// Pizza Party: equal parts, naming and shading fractions, sharing a group, and comparing fractions.
(function (MA) {
  'use strict';

  const { h, rand, pick, shuffle } = MA.util;
  const M = MA.math;

  const LEVELS = [
    { id: 'eqparts', name: 'Equal parts', eg: 'Which one is cut into halves?' },
    { id: 'unitfr', name: 'Halves, thirds and quarters', eg: '1/2, 1/3, 1/4' },
    { id: 'shade', name: 'Colour the fraction', eg: 'Colour 3/4' },
    { id: 'ofset', name: 'Sharing', eg: '1/3 of 12 cookies' },
    { id: 'frcmp', name: 'Which is more?', eg: '1/2 or 1/4' },
    { id: 'anyfr', name: 'Any fraction', eg: '5/8' },
  ];
  const ONE = ['', 'whole', 'half', 'third', 'quarter', 'fifth', 'sixth', 'seventh', 'eighth'];
  const MANY = ['', 'wholes', 'halves', 'thirds', 'quarters', 'fifths', 'sixths', 'sevenths', 'eighths'];
  const fr = (k, n) => `${k}/${n}`;
  const say = (k, n) => `${k === 1 ? 'one' : M.words(k)} ${k === 1 ? ONE[n] : MANY[n]}`;
  const parts = n => ['', '1 whole', 'halves', 'thirds', 'quarters', 'fifths', 'sixths', 'sevenths', 'eighths'][n];

  // ---------- Pictures ----------
  // A pizza (circle) or a chocolate bar (rectangle) cut into pieces. sizes are the share of each piece (they add to 1).
  function picture(shape, n, shaded, sizes, onTap) {
    sizes = sizes || Array(n).fill(1 / n);
    const on = new Set(shaded || []);
    let pieces = '';
    let at = 0;
    sizes.forEach((s, i) => {
      const fill = on.has(i) ? (shape === 'pizza' ? '#ff6b3d' : '#7b3f1d') : (shape === 'pizza' ? '#ffe7a8' : '#f3d9b8');
      let d;
      if (shape === 'pizza') {
        if (n === 1) d = 'M50 4 A46 46 0 1 1 49.99 4 Z';
        else {
          const a0 = (at * 360 - 90) * Math.PI / 180, a1 = ((at + s) * 360 - 90) * Math.PI / 180;
          d = `M50 50 L${(50 + 46 * Math.cos(a0)).toFixed(2)} ${(50 + 46 * Math.sin(a0)).toFixed(2)} A46 46 0 ${s > 0.5 ? 1 : 0} 1 ${(50 + 46 * Math.cos(a1)).toFixed(2)} ${(50 + 46 * Math.sin(a1)).toFixed(2)} Z`;
        }
      } else {
        d = `M${(4 + 92 * at).toFixed(2)} 22 h${(92 * s).toFixed(2)} v56 h${(-92 * s).toFixed(2)} Z`;
      }
      pieces += `<path class="pz-piece${on.has(i) ? ' on' : ''}" data-piece="${i}" d="${d}" fill="${fill}" stroke="${shape === 'pizza' ? '#c9893b' : '#5b2c12'}" stroke-width="2.5" stroke-linejoin="round"/>`;
      at += s;
    });
    const crust = shape === 'pizza' ? '<circle cx="50" cy="50" r="46" fill="none" stroke="#c9893b" stroke-width="5"/>' : '';
    const el = h('div', { class: 'pz-pic ' + shape, html: `<svg viewBox="${shape === 'pizza' ? '0 0 100 100' : '0 18 100 64'}" xmlns="http://www.w3.org/2000/svg">${pieces}${crust}</svg>` });
    if (onTap) el.querySelectorAll('.pz-piece').forEach(pc => pc.addEventListener('click', () => onTap(Number(pc.dataset.piece), pc)));
    return el;
  }
  const frac = (k, n) => h('span', { class: 'frac', 'aria-label': say(k, n) }, h('b', { text: String(k) }), h('i'), h('b', { text: String(n) }));

  // ---------- Problems ----------
  function equal(shape, n, opts) {
    const right = opts.findIndex(o => o.kind === 'eq');
    return { mode: 'equal', shape, n, opts, right, answer: `the one cut into ${n} equal parts`, params: ['equal', shape, n, opts],
      key: `eq${shape}${n}${opts.map(o => o.kind[0]).join('')}`, memo: `${parts(n)[0].toUpperCase() + parts(n).slice(1)} means ${n} equal parts` };
  }
  // first: which piece the colouring starts at, so the same fraction can look different.
  function name(shape, k, n, first) {
    first = first || 0;
    return { mode: 'name', shape, k, n, first, answer: fr(k, n), params: ['name', shape, k, n, first], key: `nm${shape}${k}/${n}@${first}`,
      memo: `${k} of ${n} equal parts is ${fr(k, n)}` };
  }
  function shade(shape, k, n) {
    return { mode: 'shade', shape, k, n, answer: `${k} pieces coloured`, params: ['shade', shape, k, n], key: `sh${shape}${k}/${n}`,
      memo: `${fr(k, n)}: colour ${k} of the ${n} pieces` };
  }
  function ofset(k, n, total, story) {
    const each = total / n;
    return { mode: 'ofset', k, n, total, story, answer: each * k, params: ['ofset', k, n, total, story], key: `of${k}/${n}of${total}${story ? 's' : ''}`,
      memo: k === 1 ? `${fr(1, n)} of ${total} = ${total} ÷ ${n} = ${each}` : `${fr(1, n)} of ${total} = ${each}, so ${fr(k, n)} of ${total} = ${each * k}` };
  }
  function cmp(a, b) {
    const va = a[0] / a[1], vb = b[0] / b[1];
    const answer = Math.abs(va - vb) < 1e-9 ? 'Same' : va > vb ? fr(...a) : fr(...b);
    return { mode: 'cmp', a, b, answer, params: ['cmp', a, b], key: `cmp${fr(...a)}${fr(...b)}`,
      memo: answer === 'Same' ? `${fr(...a)} is the same as ${fr(...b)}` : `${answer} is more than ${answer === fr(...a) ? fr(...b) : fr(...a)}` };
  }

  function fromParams(pr) {
    const [mode, ...a] = pr;
    return { equal, name, shade, ofset, cmp }[mode](...a);
  }

  function unequal(n) {
    for (;;) {
      const w = Array.from({ length: n }, () => rand(2, 7));
      if (Math.max(...w) / Math.min(...w) >= 1.7) {
        const t = w.reduce((x, y) => x + y, 0);
        return w.map(x => x / t);
      }
    }
  }

  const shapeOf = () => pick(['pizza', 'bar']);
  function make(level) {
    switch (level) {
      case 1: {
        const n = pick([2, 3, 4]);
        const other = pick([2, 3, 4, 6].filter(x => x !== n));
        return equal(shapeOf(), n, shuffle([{ kind: 'eq', n }, { kind: 'uneq', n, sizes: unequal(n) }, { kind: 'other', n: other }]));
      }
      case 2: { const n = pick([2, 3, 4, 4, 6, 8]); return name(shapeOf(), 1, n, rand(0, n - 1)); }
      case 3: { const n = pick([2, 3, 4, 4, 6, 8]); return shade(shapeOf(), rand(1, n - 1), n); }
      case 4: {
        const n = pick([2, 3, 4, 5]);
        const each = rand(2, n > 3 ? 4 : 6);
        const k = n > 2 && Math.random() < 0.25 ? rand(2, n - 1) : 1;
        return ofset(k, n, n * each, k === 1 && Math.random() < 0.5);
      }
      case 5: {
        const r = Math.random();
        if (r < 0.4) { const [x, y] = shuffle([2, 3, 4, 6, 8]); return cmp([1, x], [1, y]); }
        if (r < 0.75) { const n = pick([4, 5, 6, 8]); const [x, y] = shuffle(Array.from({ length: n - 1 }, (_, i) => i + 1)); return cmp([x, n], [y, n]); }
        const [a, b] = pick([[[1, 2], [2, 4]], [[1, 2], [4, 8]], [[2, 4], [4, 8]], [[1, 3], [2, 6]], [[1, 4], [2, 8]], [[3, 4], [6, 8]], [[2, 3], [4, 6]]]);
        return Math.random() < 0.5 ? cmp(a, b) : cmp(b, a);
      }
      default: { const n = pick([3, 4, 5, 6, 8]); return name(shapeOf(), rand(1, n - 1), n, rand(0, n - 1)); }
    }
  }

  // ---------- Explanations ----------
  function explain(p) {
    switch (p.mode) {
      case 'equal': return { hint: `Look for ${p.n} pieces that are all exactly the same size.`,
        steps: [`${parts(p.n)[0].toUpperCase() + parts(p.n).slice(1)} means ${p.n} pieces that are all the same size.`,
          'One picture has pieces of different sizes, so they are not equal.', `One picture has the wrong number of pieces.`] };
      case 'name': return { hint: 'Count all the pieces for the bottom number. Count the coloured pieces for the top number.',
        steps: [`There are ${p.n} equal pieces altogether. That is the bottom number.`, `${p.k} ${p.k === 1 ? 'is' : 'are'} coloured. That is the top number.`,
          `So it is ${fr(p.k, p.n)}, ${say(p.k, p.n)}.`] };
      case 'shade': return { hint: `The bottom number ${p.n} is how many pieces. The top number ${p.k} is how many to colour.`,
        steps: [`${fr(p.k, p.n)} means ${p.k} out of ${p.n} equal pieces.`, `Colour ${p.k} pieces and leave ${p.n - p.k}.`] };
      case 'ofset': {
        const each = p.total / p.n;
        return { hint: `Share ${p.total} into ${p.n} equal groups.`,
          steps: [`Share ${p.total} into ${p.n} equal groups: ${p.total} ÷ ${p.n} = ${each}.`,
            p.k > 1 ? `${fr(p.k, p.n)} is ${p.k} groups: ${p.k} × ${each} = ${p.answer}.` : `Each group has ${each}.`, `The answer is ${p.answer}.`] };
      }
      default: {
        const [a, b] = [p.a, p.b];
        const steps = a[1] === b[1] ? [`Both are cut into ${a[1]} pieces.`, 'More coloured pieces means more.']
          : a[0] === b[0] && a[0] === 1 ? ['The more pieces you cut, the smaller each piece is.', `So ${fr(1, Math.min(a[1], b[1]))} is bigger than ${fr(1, Math.max(a[1], b[1]))}.`]
            : ['Look at the pictures: the coloured parts are the same size.', `${fr(...a)} and ${fr(...b)} are equal.`];
        return { hint: 'Look at how much of each bar is coloured.', steps: [...steps, `The answer: ${p.answer}.`] };
      }
    }
  }

  // ---------- Playing ----------
  function render(p, stage, api) {
    const wrap = h('div', { class: 'ev pz' });
    stage.append(wrap);
    if (p.mode === 'shade') {
      const on = new Set();
      const holder = h('div', { class: 'pz-holder' });
      const paint = () => { holder.innerHTML = ''; holder.append(picture(p.shape, p.n, [...on], null, tap)); };
      function tap(i) {
        if (api.busy()) return;
        if (on.has(i)) on.delete(i); else on.add(i);
        MA.sound.play('tap');
        api.clearTip();
        paint();
      }
      paint();
      const check = h('button', { class: 'btn btn-main btn-big pz-check', type: 'button', onclick: () => {
        if (api.busy()) return;
        if (on.size === p.k) return api.right({ delay: 1200 });
        api.wrong(on.size < p.k ? `You coloured ${on.size}. Colour ${p.k} pieces.` : `You coloured ${on.size}. That's too many: you need ${p.k}.`);
      } }, '✓ Check');
      wrap.append(h('p', { class: 'nl-ask' }, 'Tap to colour ', frac(p.k, p.n), ` of the ${p.shape === 'pizza' ? 'pizza' : 'chocolate'}.`), holder, check);
      return null;
    }
    let ask, pic = null, opts, label = null;
    if (p.mode === 'equal') {
      ask = `Which ${p.shape === 'pizza' ? 'pizza' : 'chocolate bar'} is cut into ${parts(p.n)}?`;
      opts = p.opts.map((_, i) => i);
      label = i => picture(p.shape, p.opts[i].n, [], p.opts[i].sizes);
    } else if (p.mode === 'name') {
      ask = 'What fraction is coloured?';
      pic = picture(p.shape, p.n, Array.from({ length: p.k }, (_, i) => (i + p.first) % p.n));
      const wrong = p.k === 1 ? [2, 3, 4, 6, 8].filter(n => n !== p.n).map(n => [1, n])
        : [[p.n - p.k, p.n], [p.k, p.n - p.k], [p.k, p.n + 1], [p.k + 1, p.n], [p.k - 1, p.n]].filter(([k, n]) => k > 0 && k < n && fr(k, n) !== fr(p.k, p.n));
      const uniq = [...new Map(wrong.map(w => [fr(...w), w])).values()];
      opts = shuffle([fr(p.k, p.n), ...shuffle(uniq).slice(0, 3).map(w => fr(...w))]);
      label = v => frac(...v.split('/').map(Number));
    } else if (p.mode === 'ofset') {
      ask = p.story ? `Share ${p.total} cookies equally between ${p.n} plates. How many on each plate?` : null;
      const cookies = h('div', { class: 'pz-cookies' }, Array.from({ length: p.total }, () => h('span', { text: '🍪' })));
      pic = h('div', { class: 'pz-share' }, cookies, p.story ? h('div', { class: 'pz-plates' }, Array.from({ length: p.n }, () => h('span', { text: '🍽️' }))) : null);
      if (!p.story) wrap.append(h('p', { class: 'nl-ask' }, 'What is ', frac(p.k, p.n), ` of ${p.total} cookies?`));
      opts = M.nearby(p.answer, 4, { max: 40 }).filter(v => v > 0);
    } else {
      ask = 'Which is more?';
      pic = h('div', { class: 'pz-cmp' }, [p.a, p.b].map(([k, n]) => h('div', { class: 'pz-side' }, picture('bar', n, Array.from({ length: k }, (_, i) => i)), frac(k, n))));
      opts = [fr(...p.a), fr(...p.b), 'Same'];
      label = v => (v === 'Same' ? h('b', { text: '= Same' }) : frac(...v.split('/').map(Number)));
    }
    const ch = MA.ui.choices(opts, v => api.answer(v, { delay: 1300 }), { className: 'pz-choices' + (p.mode === 'equal' ? ' pics' : ''), label,
      aria: p.mode === 'equal' ? i => `Picture ${i + 1}` : null });
    if (ask) wrap.append(h('p', { class: 'nl-ask', text: ask }));
    if (pic) wrap.append(pic);
    wrap.append(ch.el);
    return ch.destroy;
  }

  function visual(p) {
    if (p.mode === 'equal') return picture(p.shape, p.n);
    if (p.mode === 'name' || p.mode === 'shade') return h('div', { class: 'pz-mid' }, picture(p.shape, p.n, Array.from({ length: p.k }, (_, i) => i)), frac(p.k, p.n));
    if (p.mode === 'ofset') return h('div', { class: 'pz-groups' }, Array.from({ length: p.n }, (_, g) => h('span', { class: 'pz-group' + (g < p.k ? ' on' : '') }, '🍪'.repeat(p.total / p.n))));
    return null;
  }

  MA.games.register({
    id: 'pizza',
    title: 'Pizza Party',
    icon: '🍕',
    color: '#dc2626',
    shelf: 'Shapes and fractions',
    blurb: 'Halves, quarters and fair shares',
    intro: 'Fair shares! Every piece must be the same size.',
    levels: LEVELS,
    make,
    fromParams,
    explain,
    visual,
    check: (p, v) => (p.mode === 'equal' ? v === p.right : v === p.answer),
    say: p => (p.mode === 'equal' ? `Which one is cut into ${parts(p.n)}?`
      : p.mode === 'name' ? 'What fraction is coloured?'
        : p.mode === 'shade' ? `Colour ${say(p.k, p.n)}.`
          : p.mode === 'ofset' ? (p.story ? `Share ${p.total} cookies between ${p.n} plates. How many on each plate?` : `What is ${say(p.k, p.n)} of ${p.total}?`)
            : `Which is more, ${say(...p.a)} or ${say(...p.b)}?`),
    render,
  });
})(window.MA);
