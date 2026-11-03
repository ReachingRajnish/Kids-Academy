// Calendar Club: days of the week, months of the year, and reading a real calendar.
(function (MA) {
  'use strict';

  const { h, rand, pick, shuffle } = MA.util;
  const M = MA.math;

  const LEVELS = [
    { id: 'days', name: 'Days of the week', eg: 'What comes after Tuesday?' },
    { id: 'months', name: 'Months of the year', eg: 'Which month comes before June?' },
    { id: 'calread', name: 'Read the calendar', eg: 'What day is the 14th?' },
    { id: 'calweek', name: 'A week later', eg: 'One week after the 9th' },
    { id: 'calfacts', name: 'How many days?', eg: 'Days in April' },
    { id: 'calcount', name: 'Counting days', eg: 'From the 5th to the 12th' },
  ];
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const NTH = ['first', 'second', 'third', 'fourth'];
  const RHYME = '30 days have September, April, June and November. February has 28, and all the rest have 31.';

  const ord = n => n + (n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th');
  const daysIn = (y, m) => new Date(y, m + 1, 0).getDate();
  const firstDay = (y, m) => new Date(y, m, 1).getDay();
  const dayOf = (y, m, d) => (firstDay(y, m) + d - 1) % 7;

  const FACTS = [
    ['How many days are in a week?', 7, 'Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday: that is 7 days.'],
    ['How many months are in a year?', 12, 'January to December is 12 months.'],
    ['How many days are in a year?', 365, 'A year has 365 days. A leap year has one more, 366.'],
    ['How many days are in 2 weeks?', 14, 'Each week is 7 days. 7 + 7 = 14.'],
    ['How many days are in 3 weeks?', 21, 'Each week is 7 days. 7 + 7 + 7 = 21.'],
    ['How many weeks are in 14 days?', 2, '7 + 7 = 14, so 14 days is 2 weeks.'],
    ['How many weeks are in 21 days?', 3, '7 + 7 + 7 = 21, so 21 days is 3 weeks.'],
    ['How many hours are in a day?', 24, 'A day and a night together are 24 hours.'],
    ...MONTHS.map((name, m) => m === 1 ? null : [`How many days are in ${name}?`, daysIn(2026, m), RHYME]).filter(Boolean),
  ];

  // ---------- Problems ----------
  function seq(kind, i, d) {
    const list = kind === 'day' ? DAYS : MONTHS;
    const answer = list[((i + d) % list.length + list.length) % list.length];
    const q = kind === 'month' && d === 0 ? `Which is the ${ord(i + 1)} month of the year?`
      : d === 1 ? `What ${kind} comes after ${list[i]}?`
        : d === -1 ? `What ${kind} comes before ${list[i]}?`
          : `What ${kind} is ${Math.abs(d)} ${kind}s ${d > 0 ? 'after' : 'before'} ${list[i]}?`;
    const memo = d === 0 ? `${answer} is month number ${i + 1}` : d === 1 ? `After ${list[i]} comes ${answer}`
      : d === -1 ? `Before ${list[i]} comes ${answer}` : `${Math.abs(d)} ${kind}s ${d > 0 ? 'after' : 'before'} ${list[i]} is ${answer}`;
    return { mode: 'seq', kind, i, d, q, answer, params: ['seq', kind, i, d], key: `seq${kind}${i}${d}`, memo };
  }

  function dayof(y, m, date) {
    const answer = DAYS[dayOf(y, m, date)];
    return { mode: 'dayof', y, m, date, answer, q: `What day of the week is the ${ord(date)}?`, mark: [date],
      params: ['dayof', y, m, date], key: `dayof${y}${m}${date}`, memo: `${date} ${MONTHS[m]} ${y} is a ${answer}` };
  }

  function nth(y, m, wd, n) {
    const first = 1 + ((wd - firstDay(y, m) + 7) % 7);
    const answer = first + 7 * (n - 1);
    return { mode: 'nth', tap: true, y, m, wd, n, first, answer, q: `Tap the ${NTH[n - 1]} ${DAYS[wd]} of the month.`,
      params: ['nth', y, m, wd, n], key: `nth${y}${m}${wd}${n}`, memo: `The ${NTH[n - 1]} ${DAYS[wd]} is the ${ord(answer)}` };
  }

  function shift(y, m, date, d) {
    const answer = date + d;
    const amount = Math.abs(d) === 7 ? 'one week' : Math.abs(d) === 14 ? 'two weeks' : `${Math.abs(d)} days`;
    return { mode: 'shift', tap: true, y, m, date, d, answer, mark: [date],
      q: `Tap the date ${amount} ${d > 0 ? 'after' : 'before'} the ${ord(date)}.`,
      params: ['shift', y, m, date, d], key: `shift${y}${m}${date}${d}`, memo: `${amount} ${d > 0 ? 'after' : 'before'} the ${ord(date)} is the ${ord(answer)}` };
  }

  function wait(y, m, a, b) {
    return { mode: 'wait', y, m, a, b, answer: b - a, mark: [a, b],
      q: `Today is the ${ord(a)}. The party is on the ${ord(b)}. How many days until the party?`,
      params: ['wait', y, m, a, b], key: `wait${y}${m}${a}${b}`, memo: `From the ${ord(a)} to the ${ord(b)} is ${b - a} days` };
  }

  function fact(i) {
    const [q, answer] = FACTS[i];
    return { mode: 'fact', i, q, answer, params: ['fact', i], key: `fact${i}`, memo: `${q.replace('How many', 'There are').replace('?', '')}: ${answer}` };
  }

  function fromParams(pr) {
    const [mode, ...a] = pr;
    return { seq, dayof, nth, shift, wait, fact }[mode](...a);
  }

  const month = () => ({ y: pick([2026, 2027]), m: rand(0, 11) });
  function make(level) {
    const { y, m } = month();
    const len = daysIn(y, m);
    switch (level) {
      case 1: return seq('day', rand(0, 6), Math.random() < 0.7 ? pick([1, -1]) : pick([2, 3, -2]));
      case 2: return Math.random() < 0.25 ? seq('month', rand(0, 11), 0) : seq('month', rand(0, 11), Math.random() < 0.75 ? pick([1, -1]) : pick([2, 3, -2]));
      case 3: return Math.random() < 0.6 ? dayof(y, m, rand(1, len)) : nth(y, m, rand(0, 6), rand(1, 4));
      case 4: {
        const d = pick([7, 7, -7, 14]);
        const date = d > 0 ? rand(1, len - d) : rand(1 - d, len);
        return shift(y, m, date, d);
      }
      case 5: return fact(Math.random() < 0.4 ? rand(0, 7) : rand(8, FACTS.length - 1));
      default: {
        if (Math.random() < 0.5) {
          const a = rand(1, 20);
          return wait(y, m, a, a + rand(2, 10));
        }
        const d = pick([2, 3, 4, 5, 6, 8, 9, 10, 12]);
        return shift(y, m, rand(1, len - d), d);
      }
    }
  }

  // ---------- Explanations ----------
  function explain(p) {
    switch (p.mode) {
      case 'seq': {
        const list = p.kind === 'day' ? DAYS : MONTHS;
        if (p.d === 0) return { hint: 'Count the months from January: January is 1, February is 2...',
          steps: [list.slice(0, p.i + 1).map((n, k) => `${k + 1} ${n}`).join(', '), `So the ${ord(p.i + 1)} month is ${p.answer}.`] };
        const path = [];
        for (let k = 0; k <= Math.abs(p.d); k++) path.push(list[((p.i + Math.sign(p.d) * k) % list.length + list.length) % list.length]);
        return {
          hint: p.d > 0 ? `Say the ${p.kind}s in order, starting at ${list[p.i]}.` : `Say the ${p.kind}s backwards from ${list[p.i]}.`,
          steps: [list.join(', ') + (p.kind === 'day' ? ', then Sunday again.' : ', then January again.'),
            path.join(' → '), `So the answer is ${p.answer}.`],
        };
      }
      case 'dayof': return { hint: `Find ${p.date} on the calendar, then look at the top of its column.`,
        steps: [`Find ${p.date} on the calendar.`, `Look up its column to the top. It says ${p.answer.slice(0, 3)}.`, `So the ${ord(p.date)} is a ${p.answer}.`] };
      case 'nth': {
        const list = [];
        for (let k = 0; k < p.n; k++) list.push(p.first + 7 * k);
        return { hint: `Find the ${DAYS[p.wd]} column. Count down it.`,
          steps: [`Find the ${DAYS[p.wd].slice(0, 3)} column.`, `Count down: ${list.map((d, k) => `${NTH[k]} is ${d}`).join(', ')}.`,
            `So the ${NTH[p.n - 1]} ${DAYS[p.wd]} is the ${ord(p.answer)}.`] };
      }
      case 'shift': {
        const weeks = Math.abs(p.d) % 7 === 0;
        return { hint: weeks ? 'One week is 7 days. On a calendar that is one row down.' : `Count on ${p.d} days from the ${ord(p.date)}.`,
          steps: [weeks ? `One week is 7 days${Math.abs(p.d) === 14 ? ', so two weeks is 14 days' : ''}.` : `Start at the ${ord(p.date)} and count on ${p.d}.`,
            `${p.date} ${p.d > 0 ? '+' : '−'} ${Math.abs(p.d)} = ${p.answer}`,
            weeks ? `On the calendar, go straight ${p.d > 0 ? 'down' : 'up'} ${Math.abs(p.d) / 7 === 1 ? 'one row' : 'two rows'}.` : null,
            `So it is the ${ord(p.answer)}.`].filter(Boolean) };
      }
      case 'wait': return { hint: `Take away: ${p.b} − ${p.a}. Or count on from ${p.a} to ${p.b}.`,
        steps: [`The party is on the ${ord(p.b)}. Today is the ${ord(p.a)}.`, `${p.b} − ${p.a} = ${p.answer}`, `So there are ${p.answer} days to wait.`] };
      default: return { hint: FACTS[p.i][2], steps: [FACTS[p.i][2], `The answer is ${p.answer}.`] };
    }
  }

  // ---------- Drawing ----------
  function calendar(p, onTap) {
    const start = firstDay(p.y, p.m);
    const cells = [];
    for (let k = 0; k < start; k++) cells.push(h('span', { class: 'cal-cell blank' }));
    for (let d = 1; d <= daysIn(p.y, p.m); d++) {
      const wd = (start + d - 1) % 7;
      const cls = 'cal-cell cal-day' + (wd === 0 ? ' sun' : '') + ((p.mark || []).includes(d) ? ' mark' : '');
      cells.push(onTap
        ? h('button', { class: cls, type: 'button', 'data-date': String(d), 'aria-label': `${DAYS[wd]} ${ord(d)}`, onclick: e => onTap(d, e.currentTarget) }, String(d))
        : h('span', { class: cls, 'data-date': String(d) }, String(d)));
    }
    return h('div', { class: 'cal' },
      h('div', { class: 'cal-head', text: `${MONTHS[p.m]} ${p.y}` }),
      h('div', { class: 'cal-grid' }, DAYS.map((d, k) => h('span', { class: 'cal-wd' + (k === 0 ? ' sun' : ''), text: d.slice(0, 3) })), cells));
  }

  function week(list, hi) {
    return h('div', { class: 'cal-ring' }, list.map(n => h('span', { class: 'cal-pill' + (n === hi ? ' on' : ''), text: n.slice(0, 3) })));
  }

  function options(p) {
    if (p.mode === 'seq') {
      const list = p.kind === 'day' ? DAYS : MONTHS;
      const at = list.indexOf(p.answer);
      const near = [at + 1, at - 1, at + 2, at - 2, p.i].map(k => list[(k % list.length + list.length) % list.length]);
      return shuffle([p.answer, ...shuffle([...new Set(near)].filter(n => n !== p.answer)).slice(0, 3)]);
    }
    if (p.mode === 'dayof') {
      const at = DAYS.indexOf(p.answer);
      return shuffle([p.answer, ...shuffle([1, -1, 2, -2, 3]).slice(0, 3).map(k => DAYS[(at + k + 7) % 7])]);
    }
    if (p.mode === 'fact' && FACTS[p.i][2] === RHYME) return [28, 30, 31];
    return M.nearby(p.answer, 4, { max: 400 });
  }

  function render(p, stage, api) {
    const wrap = h('div', { class: 'ev calg' }, h('p', { class: 'nl-ask', text: p.q }));
    let destroy = null;
    if (p.tap) {
      wrap.append(calendar(p, (d, cell) => {
        const ok = api.answer(d, { delay: 1200 });
        if (ok) cell.classList.add('yes');
        else if (ok === false) { cell.classList.add('no'); api.after(700, () => cell.classList.remove('no')); }
      }));
    } else {
      if (p.y) wrap.append(calendar(p));
      else if (p.mode === 'seq') wrap.append(h('div', { class: 'cal-big', text: p.kind === 'day' ? '🗓️' : '📆' }));
      else wrap.append(h('div', { class: 'cal-big', text: '📅' }));
      const ch = MA.ui.choices(options(p), v => api.answer(v, { delay: 1200 }), { className: 'cal-choices' });
      wrap.append(ch.el);
      destroy = ch.destroy;
    }
    stage.append(wrap);
    return destroy;
  }

  function visual(p) {
    if (p.mode === 'seq') return week(p.kind === 'day' ? DAYS : MONTHS, p.answer);
    if (p.y) return calendar(Object.assign({}, p, { mark: p.mode === 'dayof' || p.mode === 'wait' ? p.mark : [p.answer] }));
    return null;
  }

  MA.games.register({
    id: 'calendar',
    title: 'Calendar Club',
    icon: '📅',
    color: '#db2777',
    shelf: 'Time and money',
    blurb: 'Days, months and dates',
    intro: 'Seven days in a week, twelve months in a year!',
    levels: LEVELS,
    make,
    fromParams,
    explain,
    visual,
    say: p => p.q,
    render,
  });
})(window.MA);
