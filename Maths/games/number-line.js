// Roo's Number Line: find the missing number when counting in steps, then work out where the jumps land.
(function (MA) {
  'use strict';

  const { h, rand, pick } = MA.util;
  const M = MA.math;

  const LEVELS = [
    { id: 'nl1', name: 'Counting on in 1s', eg: '13, 14, ?, 16' },
    { id: 'nl1b', name: 'Counting back in 1s', eg: '20, 19, ?, 17' },
    { id: 'nl2', name: 'Counting in 2s', eg: '6, 8, ?, 12' },
    { id: 'nl5', name: 'Counting in 5s', eg: '25, 30, ?, 40' },
    { id: 'nl10', name: 'Counting in 10s', eg: '7, 17, ?, 37' },
    { id: 'nl100', name: 'Counting in 50s and 100s', eg: '250, 300, ?' },
    { id: 'nljump', name: '10 more, 100 less', eg: '46, jump +10' },
    { id: 'nljump2', name: 'Two jumps', eg: '38, +20, then +5' },
  ];
  const TICKS = 6;
  const signed = n => (n > 0 ? `+${n}` : `−${-n}`);

  function seqProblem(start, step, idx) {
    const values = [];
    for (let i = 0; i < TICKS; i++) values.push(start + i * step);
    const shown = values.map((v, i) => (i === idx ? '?' : String(v)));
    return { mode: 'seq', start, step, idx, values, answer: values[idx],
      params: ['seq', start, step, idx], key: `s${start},${step},${idx}`,
      prompt: `What number is missing?`, memo: values.join(', '), say: shown.join(', ') };
  }

  function jumpProblem(start, jumps) {
    const answer = jumps.reduce((a, j) => a + j, start);
    const words = jumps.map(signed).join(', then ');
    return { mode: 'jump', start, jumps, answer, params: ['jump', start, jumps], key: `j${start}${jumps.join('')}`,
      prompt: `Start at ${start}. Jump ${words}. Where does Roo land?`,
      memo: `${start} ${jumps.map(j => (j > 0 ? `+ ${j}` : `− ${-j}`)).join(' ')} = ${answer}`,
      say: `Start at ${start}. Jump ${jumps.map(j => (j > 0 ? `plus ${j}` : `minus ${-j}`)).join(', then ')}. Where does Roo land?` };
  }

  function fromParams(params) {
    return params[0] === 'seq' ? seqProblem(params[1], params[2], params[3]) : jumpProblem(params[1], params[2]);
  }

  function make(level) {
    const idx = rand(2, TICKS - 1);
    const up = Math.random() < 0.75;
    switch (level) {
      case 1: return seqProblem(rand(0, 94), 1, idx);
      case 2: return seqProblem(rand(6, 100), -1, idx);
      case 3: return up ? seqProblem(rand(0, 40) * 2 + (Math.random() < 0.2 ? 1 : 0), 2, idx) : seqProblem(rand(10, 50) * 2, -2, idx);
      case 4: return up ? seqProblem(5 * rand(0, 15), 5, idx) : seqProblem(5 * rand(5, 20), -5, idx);
      case 5: return up ? seqProblem(rand(1, 49), 10, idx) : seqProblem(rand(51, 99), -10, idx);
      case 6: {
        const step = pick([50, 100, 100, -100]);
        if (step === 50) return seqProblem(50 * rand(0, 10), 50, idx);
        if (step === 100) return seqProblem(10 * rand(0, 49), 100, idx);
        return seqProblem(10 * rand(50, 99), -100, idx);
      }
      case 7: {
        const j = pick([10, -10, 100, -100]);
        const start = j === 10 ? rand(11, 989) : j === -10 ? rand(20, 999) : j === 100 ? rand(11, 899) : rand(110, 999);
        return jumpProblem(start, [j]);
      }
      default: {
        if (Math.random() < 0.7) return jumpProblem(rand(11, 69), [10 * rand(1, 3), rand(1, 9)]);
        return jumpProblem(rand(45, 99), [-10 * rand(1, 3), -rand(1, 9)]);
      }
    }
  }

  function explain(p) {
    if (p.mode === 'seq') {
      const s = Math.abs(p.step);
      const before = p.values[p.idx - 1];
      return {
        hint: `The numbers go ${p.step > 0 ? 'up' : 'down'} by ${s} each time.`,
        steps: [`The numbers go ${p.step > 0 ? 'up' : 'down'} by ${s} each time.`,
          `${before} ${p.step > 0 ? '+' : '−'} ${s} = ${p.answer}`],
      };
    }
    let at = p.start;
    const steps = p.jumps.map(j => {
      const from = at;
      at += j;
      return `${from} ${j > 0 ? '+' : '−'} ${Math.abs(j)} = ${at}`;
    });
    const first = p.jumps[0];
    const hint = Math.abs(first) % 100 === 0 ? `Jumping ${Math.abs(first)} changes the hundreds digit.`
      : Math.abs(first) % 10 === 0 ? `Jumping ${Math.abs(first)} changes the tens digit.` : 'Make each jump one at a time.';
    return { hint, steps: [...steps, `Roo lands on ${p.answer}.`] };
  }

  function render(p, stage, api) {
    const track = h('div', { class: 'nl-track' }, h('div', { class: 'nl-line' }));
    const place = (el, x) => { el.style.left = x + '%'; track.append(el); return el; };
    const ticks = [];   // [x, label element]
    let stops = [];     // x positions Roo hops through to the answer

    if (p.mode === 'seq') {
      p.values.forEach((v, i) => {
        const x = 7 + i * (86 / (TICKS - 1));
        const label = h('b', { class: i === p.idx ? 'nl-q' : '', text: i === p.idx ? '?' : String(v) });
        ticks.push(place(h('span', { class: 'nl-tick' }, h('i'), label), x));
        if (i <= p.idx) stops.push(x);
      });
    } else {
      const total = p.jumps.reduce((a, j) => a + Math.abs(j), 0);
      const dir = p.answer >= p.start ? 1 : -1;
      let x = dir > 0 ? 8 : 92;
      stops = [x];
      ticks.push(place(h('span', { class: 'nl-tick' }, h('i'), h('b', { text: String(p.start) })), x));
      p.jumps.forEach((j, i) => {
        const next = x + dir * 84 * Math.abs(j) / total;
        const last = i === p.jumps.length - 1;
        const arc = h('span', { class: 'nl-arc' }, h('em', { text: signed(j) }));
        arc.style.width = Math.abs(next - x) + '%';
        place(arc, Math.min(x, next));
        ticks.push(place(h('span', { class: 'nl-tick' + (last ? '' : ' small') }, h('i'),
          last ? h('b', { class: 'nl-q', text: '?' }) : null), next));
        stops.push(next);
        x = next;
      });
    }

    const roo = place(h('span', { class: 'nl-roo', 'aria-hidden': 'true' }, '🦘'), stops[0]);

    function hop() {
      if (!roo.animate || stops.length < 2) return;
      const frames = [];
      stops.forEach((x, i) => {
        if (i > 0) frames.push({ left: (stops[i - 1] + x) / 2 + '%', transform: 'translate(-50%, -70px)' });
        frames.push({ left: x + '%', transform: 'translate(-50%, 0)' });
      });
      roo.animate(frames, { duration: 380 * (stops.length - 1), easing: 'ease-in-out', fill: 'forwards' });
    }

    const choices = MA.ui.choices(M.nearby(p.answer, 4, { step: Math.abs(p.step || p.jumps[0]) }), v => {
      const ok = api.answer(v, { delay: 400 * stops.length + 900 });
      if (ok) {
        MA.sound.play('hop');
        hop();
        const q = track.querySelector('.nl-q');
        q.textContent = String(p.answer);
        q.classList.add('filled');
      }
      return ok;
    });

    stage.append(h('div', { class: 'nl' }, h('p', { class: 'nl-ask', text: p.prompt }), track, choices.el));
    return choices.destroy;
  }

  MA.games.register({
    id: 'number-line',
    title: "Roo's Number Line",
    icon: '🦘',
    color: '#f29a1f',
    shelf: 'Place value',
    blurb: 'Count in steps and jump',
    intro: 'Find the missing number on the line.',
    levels: LEVELS,
    make,
    fromParams,
    say: p => p.say,
    explain,
    render,
  });
})(window.MA);
