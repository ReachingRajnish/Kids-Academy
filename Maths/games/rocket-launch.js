// Rocket Launch: build numbers from hundreds, tens and ones blocks to fuel the rocket.
// 10 ones snap into a ten (and 10 tens into a hundred); taking one away when there are none breaks one open.
(function (MA) {
  'use strict';

  const { h, rand, pick } = MA.util;
  const M = MA.math;

  const LEVELS = [
    { id: 'pv20', name: 'Build numbers to 20', eg: 'Build 14' },
    { id: 'pv50', name: 'Build numbers to 50', eg: 'Build 37' },
    { id: 'pv99', name: 'Build numbers to 99', eg: 'Build 86' },
    { id: 'pv999', name: 'Build numbers to 999', eg: 'Build 974' },
    { id: 'pvread', name: 'Read the blocks', eg: 'What number is this?' },
    { id: 'pvwords', name: 'Build from words', eg: 'four hundred and six' },
    { id: 'pvmore', name: '10 more, 100 less', eg: '10 more than 295' },
  ];

  function parts(n) {
    const d = M.digits(n), out = [];
    if (d.h) out.push(`${d.h} hundred${d.h > 1 ? 's' : ''}`);
    if (d.t) out.push(`${d.t} ten${d.t > 1 ? 's' : ''}`);
    if (d.o || !out.length) out.push(`${d.o} one${d.o === 1 ? '' : 's'}`);
    return out.length > 1 ? out.slice(0, -1).join(', ') + ' and ' + out[out.length - 1] : out[0];
  }

  // The same problem can be rebuilt from [level, target, start] to bring missed ones back.
  function makeProblem(level, target, start) {
    start = start || 0;
    const p = { level, target, start, answer: target, params: [level, target, start], key: `${level}:${start}>${target}` };
    if (level === 5) {
      p.mode = 'read';
      p.prompt = 'What number do the blocks show?';
      p.memo = `${target} is ${parts(target)}`;
    } else if (level === 7) {
      const d = target - start;
      p.mode = 'build';
      p.delta = d;
      p.prompt = `Here is ${start}. Make it ${Math.abs(d)} ${d > 0 ? 'more' : 'less'}.`;
      p.memo = `${Math.abs(d)} ${d > 0 ? 'more' : 'less'} than ${start} is ${target}`;
    } else {
      p.mode = 'build';
      p.words = level === 6 ? M.words(target) : null;
      p.prompt = p.words ? `Build ${p.words}` : `Build ${target}`;
      p.memo = `${target} is ${parts(target)}`;
    }
    return p;
  }

  function withZero(n) {
    // Numbers with a 0 inside (406, 750) are the ones kids mix up.
    if (Math.random() < 0.5) return n;
    return Math.random() < 0.5 ? n - (n % 100) + (n % 10) : n - (n % 10);
  }

  function make(level) {
    switch (level) {
      case 1: return makeProblem(1, rand(11, 20));
      case 2: return makeProblem(2, rand(21, 50));
      case 3: return makeProblem(3, rand(51, 99));
      case 4: return makeProblem(4, withZero(rand(101, 999)));
      case 5: return makeProblem(5, Math.random() < 0.25 ? rand(21, 99) : withZero(rand(101, 999)));
      case 6: return makeProblem(6, withZero(rand(101, 999)));
      default: {
        const d = pick([10, -10, 100, -100]);
        let base = d === 10 ? rand(100, 989) : d === -10 ? rand(110, 999) : d === 100 ? rand(100, 899) : rand(200, 999);
        // Often cross a hundred: 295 + 10, 305 - 10.
        if (Math.abs(d) === 10 && Math.random() < 0.4) base = base - (base % 100) + (d > 0 ? 90 : 0) + (base % 10);
        if (base + d < 100 || base + d > 999 || base < 100) return make(level);
        return makeProblem(7, base + d, base);
      }
    }
  }

  function explain(p) {
    const d = M.digits(p.target);
    const split = [d.h ? d.h * 100 : null, d.t ? d.t * 10 : null, d.o || (!d.h && !d.t) ? d.o : null].filter(v => v !== null);
    if (p.mode === 'read') {
      return {
        hint: 'Count the hundreds, then the tens, then the ones.',
        steps: [`${d.h} hundreds make ${d.h * 100}`, `${d.t} tens make ${d.t * 10}`, `${d.o} ones make ${d.o}`, `${split.join(' + ')} = ${p.target}`],
      };
    }
    if (p.delta) {
      const one = Math.abs(p.delta) === 10 ? 'ten' : 'hundred';
      const steps = [`${p.start} ${p.delta > 0 ? '+' : '−'} ${Math.abs(p.delta)} = ${p.target}`];
      const before = M.digits(p.start);
      if (one === 'ten' && p.delta > 0 && before.t === 9) steps.push('10 tens make 1 hundred, so the hundreds go up by one.');
      if (one === 'ten' && p.delta < 0 && before.t === 0) steps.push('There are no tens, so swap 1 hundred for 10 tens first.');
      return { hint: `${p.delta > 0 ? 'Add' : 'Take away'} 1 ${one}.`, steps };
    }
    const steps = [`${p.target} = ${split.join(' + ')}`, `So use ${parts(p.target)}.`];
    if (p.words) steps.unshift(`"${p.words}" is ${p.target}.`);
    return { hint: `${p.words ? `"${p.words}" is ${p.target}. ` : ''}${p.target} is ${parts(p.target)}.`, steps };
  }

  function render(p, stage, api) {
    const c = M.digits(p.start);
    const showHundreds = p.target >= 100 || p.start >= 100;
    // Small numbers get bigger blocks so the cubes are easy to count.
    const tube = h('div', { class: 'rl-window' + (p.target < 100 && p.start < 100 ? ' big' : '') });
    const rocket = h('div', { class: 'rl-rocket' },
      h('div', { class: 'rl-nose' }), h('div', { class: 'rl-body' }, tube),
      h('div', { class: 'rl-fins' }), h('div', { class: 'rl-flame', 'aria-hidden': 'true' }, '🔥'));
    const panel = h('div', { class: 'rl-panel' });
    let cleanup = null;

    const value = () => c.h * 100 + c.t * 10 + c.o;

    if (p.mode === 'read') {
      const d = M.digits(p.target);
      tube.append(MA.ui.blocks(d.h, d.t, d.o));
      const choices = MA.ui.choices(M.nearby(p.target, 4), v => {
        const ok = api.answer(v, { delay: 1500 });
        if (ok) rocket.classList.add('launch');
        return ok;
      });
      cleanup = choices.destroy;
      panel.append(h('div', { class: 'rl-card' }, h('p', { class: 'rl-ask', text: p.prompt })), choices.el);
      stage.append(h('div', { class: 'rl' }, rocket, panel));
      return cleanup;
    }

    const counts = {};
    const valueEl = h('b', { class: 'rl-value' });

    function paint() {
      tube.innerHTML = '';
      tube.append(MA.ui.blocks(c.h, c.t, c.o));
      counts.h.textContent = c.h;
      counts.t.textContent = c.t;
      counts.o.textContent = c.o;
      valueEl.textContent = String(value());
      if (c.h && !showHundreds) colH.hidden = false;
    }

    function add(kind) {
      if (api.busy()) return;
      api.clearTip();
      MA.sound.play('tap');
      const before = Object.assign({}, c);
      c[kind]++;
      if (c.o === 10) { c.o = 0; c.t++; api.tip('10 ones make 1 ten!'); }
      if (c.t === 10) { c.t = 0; c.h++; api.tip('10 tens make 1 hundred!'); }
      if (c.h === 10) { Object.assign(c, before); api.tip('That would be 1000, too big for this rocket!'); }
      paint();
    }

    function remove(kind) {
      if (api.busy()) return;
      api.clearTip();
      MA.sound.play('tap');
      if (c[kind] > 0) c[kind]--;
      else if (kind === 'o' && c.t > 0) { c.t--; c.o = 9; api.tip('Swapped 1 ten for 10 ones, then took 1 away.'); }
      else if (kind === 'o' && c.h > 0) { c.h--; c.t = 9; c.o = 9; api.tip('Swapped 1 hundred for 10 tens, and 1 ten for 10 ones.'); }
      else if (kind === 't' && c.h > 0) { c.h--; c.t = 9; api.tip('Swapped 1 hundred for 10 tens, then took 1 away.'); }
      paint();
    }

    function column(kind, label, name) {
      counts[kind] = h('span', { class: 'rl-count' });
      return h('div', { class: `rl-col col-${kind}` },
        h('span', { class: 'rl-head', text: label }),
        h('span', { class: `rl-icon b-${kind === 'h' ? 'flat' : kind === 't' ? 'rod' : 'cube'}` }),
        counts[kind],
        h('div', { class: 'rl-btns' },
          h('button', { class: 'rl-minus', type: 'button', 'aria-label': `Take away a ${name}`, 'data-act': `-${kind}`, onclick: () => remove(kind) }, '−'),
          h('button', { class: 'rl-plus', type: 'button', 'aria-label': `Add a ${name}`, 'data-act': `+${kind}`, onclick: () => add(kind) }, '+')));
    }

    const colH = column('h', 'Hundreds', 'hundred');
    colH.hidden = !showHundreds;
    const launch = h('button', { class: 'btn btn-main btn-big rl-launch', type: 'button', onclick: () => {
      const ok = api.answer(value(), { delay: 1500 });
      if (ok) { rocket.classList.add('launch'); MA.sound.play('hop'); }
      else if (ok === false) { rocket.classList.remove('shake'); void rocket.offsetWidth; rocket.classList.add('shake'); }
    } }, '🚀 Launch!');

    panel.append(
      h('div', { class: 'rl-card' }, p.words
        ? [h('p', { class: 'rl-ask', text: 'Build this number:' }), h('p', { class: 'rl-words', text: p.words })]
        : h('p', { class: 'rl-ask big', text: p.prompt })),
      h('div', { class: 'rl-cols' }, colH, column('t', 'Tens', 'ten'), column('o', 'Ones', 'one')),
      h('p', { class: 'rl-made' }, 'Rocket number: ', valueEl),
      launch);
    paint();
    stage.append(h('div', { class: 'rl' }, rocket, panel));
  }

  MA.games.register({
    id: 'rocket-launch',
    title: 'Rocket Launch',
    icon: '🚀',
    color: '#3b82f6',
    shelf: 'Place value',
    blurb: 'Build numbers with blocks',
    intro: 'Build the number with hundreds, tens and ones, then launch!',
    levels: LEVELS,
    make,
    fromParams: params => makeProblem(...params),
    say: p => p.prompt,
    explain,
    visual: p => (p.mode === 'read' ? null : MA.ui.blocks(M.digits(p.target).h, M.digits(p.target).t, M.digits(p.target).o)),
    render,
  });
})(window.MA);
