// Measure Up: measure with a centimetre ruler, draw lines, pick the right unit, and change metres to centimetres.
(function (MA) {
  'use strict';

  const { h, rand, pick, shuffle } = MA.util;
  const M = MA.math;

  const LEVELS = [
    { id: 'cm0', name: 'Measure from 0', eg: 'The pencil is ? cm' },
    { id: 'cmgap', name: 'Not starting at 0', eg: 'From 3 to 11' },
    { id: 'cmdiff', name: 'How much longer?', eg: '9 cm and 5 cm' },
    { id: 'draw', name: 'Draw a line', eg: 'Make it 7 cm' },
    { id: 'unit', name: 'Pick the unit', eg: 'cm, m, g, kg, ml or l' },
    { id: 'mcm', name: 'Metres and centimetres', eg: '2 m 35 cm = ? cm' },
  ];
  const RULER = 15;
  const THINGS = [
    { name: 'pencil', cls: 'pencil' }, { name: 'crayon', cls: 'crayon' }, { name: 'straw', cls: 'straw' },
    { name: 'ribbon', cls: 'ribbon' }, { name: 'worm', cls: 'worm' }, { name: 'paintbrush', cls: 'brush' },
  ];
  const UNITS = {
    cm: { word: 'centimetres', kind: 'length', why: 'Small things, like a pencil or your hand, are measured in centimetres (cm).' },
    m: { word: 'metres', kind: 'length', why: 'Big things, like a room or a bus, are measured in metres (m). 1 m = 100 cm.' },
    g: { word: 'grams', kind: 'weight', why: 'Light things, like an apple, are weighed in grams (g).' },
    kg: { word: 'kilograms', kind: 'weight', why: 'Heavy things, like a bag of rice, are weighed in kilograms (kg). 1 kg = 1000 g.' },
    ml: { word: 'millilitres', kind: 'liquid', why: 'A little bit of liquid, like a cup, is measured in millilitres (ml).' },
    l: { word: 'litres', kind: 'liquid', why: 'Lots of liquid, like a bucket, is measured in litres (l). 1 l = 1000 ml.' },
  };
  const FACTS = [
    ['✏️', 'A pencil is about 15', 'cm'], ['🥄', 'A spoon is about 15', 'cm'], ['✋', 'Your hand is about 12', 'cm'],
    ['📕', 'A book is about 25', 'cm'], ['🪥', 'A toothbrush is about 18', 'cm'], ['🍌', 'A banana is about 20', 'cm'],
    ['🚪', 'A door is about 2', 'm'], ['🏫', 'A classroom is about 8', 'm'], ['🚌', 'A bus is about 12', 'm'],
    ['🌳', 'A tall tree is about 20', 'm'], ['🏊', 'A swimming pool is about 25', 'm'], ['🦒', 'A giraffe is about 5', 'm'],
    ['🍎', 'An apple weighs about 150', 'g'], ['🍪', 'A biscuit weighs about 10', 'g'], ['✉️', 'A letter weighs about 20', 'g'],
    ['🍚', 'A bag of rice weighs about 5', 'kg'], ['🍉', 'A watermelon weighs about 3', 'kg'], ['🧒', 'A child weighs about 25', 'kg'],
    ['🐕', 'A dog weighs about 10', 'kg'], ['🥄', 'A spoon holds about 5', 'ml'], ['☕', 'A cup holds about 200', 'ml'],
    ['🧃', 'A juice box holds about 200', 'ml'], ['🪣', 'A bucket holds about 10', 'l'], ['🛁', 'A bathtub holds about 150', 'l'],
    ['🍶', 'A big water bottle holds about 1', 'l'], ['🐟', 'A fish tank holds about 40', 'l'],
  ];

  // ---------- Problems ----------
  function measure(t, start, len) {
    return { mode: 'measure', t, start, len, answer: len, params: ['measure', t, start, len], key: `m${t}${start}-${len}`,
      memo: start ? `${start + len} − ${start} = ${len} cm` : `The ${THINGS[t].name} is ${len} cm` };
  }
  function diff(t, u, a, b) {
    return { mode: 'diff', t, u, a, b, answer: a - b, params: ['diff', t, u, a, b], key: `d${a}-${b}`,
      memo: `${a} cm − ${b} cm = ${a - b} cm` };
  }
  function draw(len) {
    return { mode: 'draw', len, answer: len, params: ['draw', len], key: `draw${len}`, memo: `A ${len} cm line goes from 0 to ${len}` };
  }
  function unit(i) {
    const [, text, u] = FACTS[i];
    return { mode: 'unit', i, answer: u, params: ['unit', i], key: `u${i}`, memo: `${text} ${u}` };
  }
  function mcm(kind, a, b) {
    let q, answer, memo;
    if (kind === 'to-cm') { q = `${a} m ${b} cm = ? cm`; answer = a * 100 + b; }
    else if (kind === 'to-m') { q = `${a * 100} cm = ? m`; answer = a; }
    else { q = `1 m − ${b} cm = ? cm`; answer = 100 - b; }
    memo = q.replace('?', answer);
    return { mode: 'mcm', kind, a, b, q, answer, params: ['mcm', kind, a, b], key: `${kind}${a}.${b}`, memo };
  }

  function fromParams(pr) {
    const [mode, ...a] = pr;
    return { measure, diff, draw, unit, mcm }[mode](...a);
  }

  const thing = () => rand(0, THINGS.length - 1);
  function make(level) {
    switch (level) {
      case 1: return measure(thing(), 0, rand(2, 14));
      case 2: { const start = rand(1, 6); return measure(thing(), start, rand(2, RULER - start)); }
      case 3: {
        const [t, u] = shuffle(THINGS.map((_, k) => k));
        const a = rand(4, 15);
        return diff(t, u, a, rand(1, a - 1));
      }
      case 4: return draw(rand(3, 14));
      case 5: return unit(rand(0, FACTS.length - 1));
      default: {
        const r = Math.random();
        if (r < 0.5) return mcm('to-cm', rand(1, 5), Math.random() < 0.6 ? 5 * rand(1, 19) : rand(1, 99));
        if (r < 0.7) return mcm('to-m', rand(2, 9), 0);
        return mcm('left', 1, 10 * rand(1, 9) - (Math.random() < 0.3 ? 5 : 0));
      }
    }
  }

  // ---------- Explanations ----------
  function explain(p) {
    const name = p.t != null ? THINGS[p.t].name : '';
    switch (p.mode) {
      case 'measure':
        return p.start
          ? { hint: "It doesn't start at 0! Take the start away from the end.",
            steps: [`The ${name} starts at ${p.start} and ends at ${p.start + p.len}.`, `${p.start + p.len} − ${p.start} = ${p.len}`,
              `Or count the spaces from ${p.start} to ${p.start + p.len}: ${p.len} spaces.`, `So it is ${p.len} cm long.`] }
          : { hint: 'Look at the number where the end of it lines up.',
            steps: [`The ${name} starts at 0.`, `Its end lines up with ${p.len}.`, `So it is ${p.len} cm long.`] };
      case 'diff':
        return { hint: 'Measure both, then take the shorter one away from the longer one.',
          steps: [`The ${name} is ${p.a} cm. The ${THINGS[p.u].name} is ${p.b} cm.`, `${p.a} − ${p.b} = ${p.answer}`,
            `So the ${name} is ${p.answer} cm longer.`] };
      case 'draw':
        return { hint: `Start at 0 and stop at ${p.len}.`, steps: ['A line always starts at 0 on the ruler.', `Count ${p.len} centimetres along and stop at ${p.len}.`] };
      case 'unit': {
        const u = UNITS[p.answer];
        return { hint: u.kind === 'length' ? 'Is it small like a pencil, or big like a room?' : u.kind === 'weight' ? 'Is it light like an apple, or heavy like a bag of rice?' : 'Is it a little drink, or a big bucket of water?',
          steps: [u.why, `${FACTS[p.i][1]} ${p.answer}.`] };
      }
      default:
        if (p.kind === 'to-cm') return { hint: '1 m is 100 cm.', steps: [`1 m = 100 cm, so ${p.a} m = ${p.a * 100} cm.`, `${p.a * 100} + ${p.b} = ${p.answer}`, `So ${p.a} m ${p.b} cm = ${p.answer} cm.`] };
        if (p.kind === 'to-m') return { hint: 'Every 100 cm makes 1 m.', steps: ['100 cm = 1 m.', `${p.a * 100} cm is ${p.a} hundreds, so it is ${p.a} m.`] };
        return { hint: '1 m is 100 cm.', steps: ['1 m = 100 cm.', `100 − ${p.b} = ${p.answer}`, `So ${p.answer} cm are left.`] };
    }
  }

  // ---------- Drawing ----------
  // A strip of things above a ruler. Everything is placed in % of the ruler so it lines up at any size.
  const pct = cm => (100 * cm / RULER) + '%';
  function bar(t, start, len, label) {
    return h('div', { class: 'mu-lane' },
      h('div', { class: `mu-thing ${THINGS[t].cls}`, style: { left: pct(start), width: pct(len) } }),
      label ? h('span', { class: 'mu-label', style: { left: pct(start) }, text: label }) : null);
  }
  function ruler(onTap) {
    const ticks = [];
    for (let i = 0; i <= RULER * 2; i++) {
      const cm = i / 2;
      ticks.push(h('span', { class: 'mu-tick' + (i % 2 ? ' half' : ''), style: { left: pct(cm) } },
        i % 2 ? null : h('b', { text: String(cm) })));
    }
    const taps = onTap ? h('div', { class: 'mu-taps' }, Array.from({ length: RULER }, (_, k) => k + 1).map(cm =>
      h('button', { class: 'mu-tap', type: 'button', 'data-cm': String(cm), 'aria-label': `${cm} centimetres`,
        style: { left: pct(cm - 0.5), width: pct(1) }, onclick: () => onTap(cm) }))) : null;
    return h('div', { class: 'mu-ruler' }, ticks, taps, h('span', { class: 'mu-unit', text: 'cm' }));
  }
  function scale(...kids) { return h('div', { class: 'mu-scale' }, h('div', { class: 'mu-inner' }, kids)); }

  function render(p, stage, api) {
    if (p.mode === 'unit') {
      const [icon, text, u] = FACTS[p.i];
      const others = shuffle(Object.keys(UNITS).filter(k => k !== u && UNITS[k].kind !== UNITS[u].kind)).slice(0, 2);
      const twin = Object.keys(UNITS).find(k => k !== u && UNITS[k].kind === UNITS[u].kind);
      const ch = MA.ui.choices(shuffle([u, twin, ...others]), v => api.answer(v, { delay: 1300 }),
        { className: 'cc-choices', label: v => [h('b', { text: v }), h('small', { text: UNITS[v].word })] });
      stage.append(h('div', { class: 'ev' }, h('div', { class: 'cal-big', text: icon }),
        h('p', { class: 'nl-ask' }, text + ' ', h('span', { class: 'nl-q', text: '?' })), ch.el));
      return ch.destroy;
    }
    if (p.mode === 'mcm') {
      const ans = MA.ui.padAnswer(api, { maxLen: 3, after: p.kind === 'to-m' ? 'm' : 'cm' });
      stage.append(h('div', { class: 'ev ev-pad' },
        h('div', { class: 'ev-side' }, h('div', { class: 'mu-fact', text: '1 m = 100 cm' }),
          h('p', { class: 'mu-q', text: p.q.split(' = ')[0] + ' =' }), ans.line),
        ans.pad));
      return ans.destroy;
    }
    if (p.mode === 'draw') {
      const line = h('div', { class: 'mu-thing ribbon drawn', style: { left: '0%', width: '0%' } });
      const tap = cm => {
        if (api.busy()) return;
        line.style.width = pct(cm);
        MA.sound.play('tap');
        const ok = api.answer(cm, { delay: 1200 });
        if (ok === false) api.after(800, () => { if (!api.busy()) line.style.width = '0%'; });
      };
      stage.append(h('div', { class: 'ev' }, h('p', { class: 'nl-ask' }, 'Tap the ruler to draw a line ', h('b', { text: `${p.len} cm` }), ' long.'),
        scale(h('div', { class: 'mu-lane' }, line), ruler(tap))));
      return null;
    }
    const lanes = p.mode === 'diff'
      ? [bar(p.t, 0, p.a, THINGS[p.t].name), bar(p.u, 0, p.b, THINGS[p.u].name)]
      : [bar(p.t, p.start, p.len)];
    const ask = p.mode === 'diff' ? `How much longer is the ${THINGS[p.t].name} than the ${THINGS[p.u].name}?` : `How long is the ${THINGS[p.t].name}?`;
    const opts = p.mode === 'measure' && p.start
      ? shuffle([p.len, ...shuffle([...new Set([p.start + p.len, p.len + 1, p.len - 1].filter(v => v > 0 && v !== p.len))]).slice(0, 3)])
      : M.nearby(p.answer, 4, { max: 20 }).filter(v => v > 0);
    const ch = MA.ui.choices(opts, v => api.answer(v, { delay: 1200 }), { label: v => `${v} cm` });
    stage.append(h('div', { class: 'ev' }, h('p', { class: 'nl-ask', text: ask }), scale(...lanes, ruler()), ch.el));
    return ch.destroy;
  }

  function visual(p) {
    if (p.mode === 'measure') return scale(bar(p.t, p.start, p.len), ruler());
    if (p.mode === 'draw') return scale(h('div', { class: 'mu-lane' }, h('div', { class: 'mu-thing ribbon', style: { left: '0%', width: pct(p.len) } })), ruler());
    return null;
  }

  MA.games.register({
    id: 'ruler',
    title: 'Measure Up',
    icon: '📏',
    color: '#ca8a04',
    shelf: 'Measuring and graphs',
    blurb: 'Rulers, centimetres and metres',
    intro: 'Line things up with the ruler and read the number.',
    levels: LEVELS,
    make,
    fromParams,
    explain,
    visual,
    say: p => (p.mode === 'measure' ? `How long is the ${THINGS[p.t].name}?`
      : p.mode === 'diff' ? `How much longer is the ${THINGS[p.t].name} than the ${THINGS[p.u].name}?`
        : p.mode === 'draw' ? `Draw a line ${p.len} centimetres long.`
          : p.mode === 'unit' ? `${FACTS[p.i][1]} what?`
            : p.kind === 'to-cm' ? `${p.a} metres ${p.b} centimetres is how many centimetres?`
              : p.kind === 'to-m' ? `${p.a * 100} centimetres is how many metres?`
                : `1 metre take away ${p.b} centimetres is how many centimetres?`),
    render,
  });
})(window.MA);
