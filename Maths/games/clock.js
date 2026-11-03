// Clock Tower: read the time on a clock face, turn the hands to a time, and work out what time it will be later.
(function (MA) {
  'use strict';

  const { h, rand, pick, shuffle } = MA.util;

  const LEVELS = [
    { id: 'clk1', name: "O'clock", eg: '3:00' },
    { id: 'clk2', name: 'Half past', eg: '7:30' },
    { id: 'clk3', name: 'Quarter past and quarter to', eg: '4:15, 8:45' },
    { id: 'clk4', name: 'Five minutes', eg: '10:25' },
    { id: 'clkset', name: 'Set the clock', eg: 'Show half past 6' },
    { id: 'clkset5', name: 'Set the clock to 5 minutes', eg: 'Show 2:35' },
    { id: 'clklater', name: 'Later and earlier', eg: '2 hours after 9:00' },
    { id: 'clk1m', name: 'To the minute', eg: '5:47' },
  ];

  // A time is minutes after 12:00, from 0 to 719.
  const hourOf = t => Math.floor(t / 60) % 12 || 12;
  const minOf = t => t % 60;
  const at = (hr, m) => ((hr % 12) * 60 + m) % 720;
  const wrap = t => ((t % 720) + 720) % 720;
  const fmt = t => `${hourOf(t)}:${String(minOf(t)).padStart(2, '0')}`;

  function words(t) {
    const hr = hourOf(t), m = minOf(t), next = hourOf(t + 60);
    if (m === 0) return `${hr} o'clock`;
    if (m === 30) return `half past ${hr}`;
    if (m === 15) return `quarter past ${hr}`;
    if (m === 45) return `quarter to ${next}`;
    if (m % 5) return `${m} minutes past ${hr}`;
    return m < 30 ? `${m} past ${hr}` : `${60 - m} to ${next}`;
  }

  // ---------- The clock face ----------
  const NS = 'http://www.w3.org/2000/svg';
  function face(t, opts) {
    opts = opts || {};
    let marks = '';
    for (let i = 0; i < 60; i++) {
      const big = i % 5 === 0;
      marks += `<line x1="100" y1="${big ? 13 : 12}" x2="100" y2="${big ? 25 : 19}" stroke="#3b3355" stroke-width="${big ? 4 : 2}" stroke-linecap="round" transform="rotate(${i * 6} 100 100)"/>`;
    }
    let nums = '';
    for (let n = 1; n <= 12; n++) {
      const a = (n * 30 - 90) * Math.PI / 180;
      nums += `<text x="${(100 + 62 * Math.cos(a)).toFixed(1)}" y="${(100 + 62 * Math.sin(a)).toFixed(1)}">${n}</text>`;
    }
    const el = h('div', { class: 'ck-face' + (opts.small ? ' small' : ''), role: 'img', html:
      `<svg viewBox="0 0 200 200" xmlns="${NS}">
        <circle cx="100" cy="100" r="96" fill="#fff" stroke="#3b3355" stroke-width="7"/>
        ${marks}<g class="ck-nums">${nums}</g>
        <line class="ck-hour" x1="100" y1="100" x2="100" y2="52" stroke="#e5484d" stroke-width="10" stroke-linecap="round"/>
        <line class="ck-min" x1="100" y1="100" x2="100" y2="24" stroke="#2563eb" stroke-width="6" stroke-linecap="round"/>
        <circle cx="100" cy="100" r="8" fill="#3b3355"/>
      </svg>` });
    const hourHand = el.querySelector('.ck-hour');
    const minHand = el.querySelector('.ck-min');
    el.set = v => {
      hourHand.setAttribute('transform', `rotate(${v / 2} 100 100)`);
      minHand.setAttribute('transform', `rotate(${(v % 60) * 6} 100 100)`);
      el.setAttribute('aria-label', 'A clock');
    };
    el.set(t);
    return el;
  }

  // ---------- Problems ----------
  const LATER = [60, 120, 180, 30, -60, -120, -30, 15, 90];
  function amount(d) {
    const a = Math.abs(d), hr = Math.floor(a / 60), m = a % 60;
    return [hr ? `${hr} hour${hr > 1 ? 's' : ''}` : '', m ? `${m} minutes` : ''].filter(Boolean).join(' and ');
  }
  function laterWords(d) {
    const a = Math.abs(d);
    const amount = a === 30 ? 'half an hour' : a === 15 ? '15 minutes' : a === 90 ? '1 and a half hours' : `${a / 60} hour${a > 60 ? 's' : ''}`;
    return `${amount} ${d > 0 ? 'later' : 'earlier'}`;
  }

  function read(t) { return { mode: 'read', t, answer: fmt(t), params: ['read', t], key: `read${t}`, memo: `${fmt(t)} is ${words(t)}` }; }
  function set(t, start) { return { mode: 'set', t, start, answer: fmt(t), params: ['set', t, start], key: `set${t}`, memo: `${fmt(t)} is ${words(t)}` }; }
  function later(t, d) {
    const end = wrap(t + d);
    return { mode: 'later', t, d, end, answer: fmt(end), params: ['later', t, d], key: `later${t}${d}`,
      memo: `${laterWords(d)} than ${fmt(t)} is ${fmt(end)}` };
  }

  function fromParams(pr) {
    return pr[0] === 'read' ? read(pr[1]) : pr[0] === 'set' ? set(pr[1], pr[2]) : later(pr[1], pr[2]);
  }

  const anyHour = () => rand(1, 12);
  function make(level) {
    switch (level) {
      case 1: return read(at(anyHour(), 0));
      case 2: return read(at(anyHour(), Math.random() < 0.75 ? 30 : 0));
      case 3: return read(at(anyHour(), pick([15, 45, 15, 45, 30])));
      case 4: return read(at(anyHour(), pick([5, 10, 20, 25, 35, 40, 50, 55])));
      case 5: return set(at(anyHour(), pick([0, 30, 15, 45])), 0);
      case 6: return set(at(anyHour(), 5 * rand(1, 11)), 0);
      case 7: {
        const d = pick(LATER);
        return later(at(anyHour(), Math.abs(d) < 60 || d === 90 ? pick([0, 30]) : pick([0, 30, 15])), d);
      }
      default: {
        let m = rand(1, 59);
        if (m % 5 === 0) m++;
        return read(at(anyHour(), m));
      }
    }
  }

  // Wrong answers kids really give: the hands swapped, the hour one out, and the minutes a little off.
  function choicesFor(p) {
    const t = p.mode === 'later' ? p.end : p.t;
    const out = new Set();
    const m = minOf(t);
    if (m % 5 === 0 && m) out.add(fmt(at(m / 5, (hourOf(t) % 12) * 5)));
    out.add(fmt(wrap(t + 60)));
    out.add(fmt(wrap(t - 60)));
    if (p.mode === 'later') out.add(fmt(wrap(p.t - p.d)));
    if (m === 30 || m === 15 || m === 45) out.add(fmt(wrap(t + (m === 15 ? 30 : -30))));
    out.add(fmt(wrap(t + (m % 5 ? 5 : 15))));
    out.delete(fmt(t));
    return shuffle([fmt(t), ...shuffle([...out]).slice(0, 3)]);
  }

  function readSteps(t) {
    const hr = hourOf(t), m = minOf(t);
    const steps = [m === 0 ? `The short red hand points to ${hr}, so the hour is ${hr}.`
      : `The short red hand is between ${hr} and ${hourOf(t + 60)}, so the hour is still ${hr}.`];
    if (m === 0) steps.push("The long blue hand points to 12, so it is o'clock.");
    else if (m % 5 === 0) steps.push(`The long blue hand points to ${m / 5}. Count in fives: ${m / 5} × 5 = ${m} minutes.`);
    else steps.push(`The long blue hand is ${m % 5} small marks after the ${Math.floor(m / 5) || 12}. ${Math.floor(m / 5) * 5} + ${m % 5} = ${m} minutes.`);
    steps.push(`So it is ${fmt(t)}, ${words(t)}.`);
    return steps;
  }

  function explain(p) {
    if (p.mode === 'later') {
      const said = laterWords(p.d);
      const past12 = p.d > 0 ? hourOf(p.end) < hourOf(p.t) : hourOf(p.end) > hourOf(p.t);
      return {
        hint: `Start at ${fmt(p.t)} and move ${Math.abs(p.d) >= 60 ? 'the hours' : 'the minutes'} ${p.d > 0 ? 'forward' : 'back'}.`,
        steps: [`It is ${fmt(p.t)} now.`,
          `${said[0].toUpperCase() + said.slice(1)} means ${p.d > 0 ? 'add' : 'take away'} ${amount(p.d)}.`,
          past12 ? (p.d > 0 ? 'After 12 the hours start again at 1.' : 'Going back, 12 comes before 1.') : null,
          `So it ${p.d > 0 ? 'will be' : 'was'} ${fmt(p.end)}.`].filter(Boolean),
      };
    }
    const m = minOf(p.t);
    const hint = p.mode === 'set'
      ? (m === 0 ? 'Put the long hand on 12 and the short hand on the hour.' : 'Turn the minutes first, then check the short hand is near the right hour.')
      : m === 0 ? 'The short hand shows the hour. The long hand on 12 means o\'clock.'
        : m === 30 ? 'The long hand on 6 means half past.'
          : m === 45 ? 'The long hand on 9 means quarter to the next hour.'
            : 'Count the long hand in fives: 5, 10, 15...';
    return { hint, steps: readSteps(p.t) };
  }

  // ---------- Drawing ----------
  function renderRead(p, stage, api) {
    const showWords = p.level <= 3;
    const choices = MA.ui.choices(choicesFor(p), v => api.answer(v, { delay: 1200 }), {
      className: 'ck-choices',
      label: v => [h('b', { text: v }), showWords ? h('small', { text: words(at(...v.split(':').map(Number))) }) : null],
    });
    const top = p.mode === 'later'
      ? h('p', { class: 'nl-ask', text: `It is ${fmt(p.t)}. What time ${p.d > 0 ? 'will it be' : 'was it'} ${laterWords(p.d)}?` })
      : h('p', { class: 'nl-ask', text: 'What time does the clock show?' });
    stage.append(h('div', { class: 'ev ck' }, top, h('div', { class: 'ck-tower' }, face(p.t)), choices.el));
    return choices.destroy;
  }

  function renderSet(p, stage, api) {
    let t = p.start;
    const clock = face(t);
    const move = d => {
      if (api.busy()) return;
      t = wrap(t + d);
      clock.set(t);
      MA.sound.play('tap');
      api.clearTip();
    };
    const btn = (act, d, text, label) => h('button', { class: 'ck-turn', type: 'button', 'data-act': act, 'aria-label': label, onclick: () => move(d) }, text);
    const check = h('button', { class: 'btn btn-main btn-big ck-check', type: 'button', onclick: () => {
      if (api.busy()) return;
      if (t === p.t) return api.right({ delay: 1200 });
      const wrongHour = minOf(t) === minOf(p.t);
      api.wrong(wrongHour ? `The minutes are right. Now look at the short hand: it should be near ${hourOf(p.t)}.`
        : `Look at the long hand. For ${minOf(p.t)} minutes it points to ${minOf(p.t) / 5 || 12}.`);
    } }, '✓ Check');
    stage.append(h('div', { class: 'ev ck' },
      h('p', { class: 'nl-ask' }, 'Turn the hands to show ', h('b', { class: 'ck-target', text: fmt(p.t) }),
        p.level === 5 ? h('span', { class: 'ck-words', text: ` (${words(p.t)})` }) : null),
      h('div', { class: 'ck-set' },
        h('div', { class: 'ck-ctl' }, h('span', { class: 'ck-lbl min', text: 'Minutes' }), btn('m-', -5, '↺', 'Minute hand back'), btn('m+', 5, '↻', 'Minute hand forward')),
        h('div', { class: 'ck-tower' }, clock),
        h('div', { class: 'ck-ctl' }, h('span', { class: 'ck-lbl hr', text: 'Hours' }), btn('h-', -60, '↺', 'One hour back'), btn('h+', 60, '↻', 'One hour forward'))),
      check));
  }

  MA.games.register({
    id: 'clock',
    title: 'Clock Tower',
    icon: '🕰️',
    color: '#0891b2',
    shelf: 'Time and money',
    blurb: 'Tell the time and set the clock',
    intro: 'The short hand shows the hour. The long hand shows the minutes.',
    levels: LEVELS,
    make,
    fromParams,
    explain,
    visual: p => face(p.mode === 'later' ? p.end : p.t, { small: true }),
    say: p => (p.mode === 'set' ? `Turn the hands to show ${words(p.t)}.`
      : p.mode === 'later' ? `It is ${words(p.t)}. What time ${p.d > 0 ? 'will it be' : 'was it'} ${laterWords(p.d)}?`
        : 'What time does the clock show?'),
    render: (p, stage, api) => (p.mode === 'set' ? renderSet(p, stage, api) : renderRead(p, stage, api)),
  });

  MA.clock = { fmt, words, face };
})(window.MA);
