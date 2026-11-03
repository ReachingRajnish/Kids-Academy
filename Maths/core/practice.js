// The Practice area: the times tables notebook, 60-second speed runs, and basic fact practice.
(function (MA) {
  'use strict';

  const { h, pick } = MA.util;
  const M = MA.math;
  const SPRINT_MS = 60000;
  const FROM = { screen: 'practice', label: '← Practice' };

  // Speed runs use the Quick Facts ladder, or one times table.
  const qf = id => M.LEVELS.findIndex(l => l.id === id) + 1;
  const SETS = [
    { id: 'add10', name: 'Adding to 10', icon: '➕', level: qf('add10') },
    { id: 'add20', name: 'Adding to 20', icon: '➕', level: qf('add20') },
    { id: 'sub20', name: 'Taking away to 20', icon: '➖', level: qf('sub20') },
    { id: 'mix20', name: 'Mixed to 20', icon: '🔀', level: qf('mix20') },
    { id: 'mul2510', name: '× 2, 5 and 10', icon: '✖️', level: qf('mul2510') },
    { id: 'mul10', name: 'All times tables', icon: '✖️', level: qf('mul10') },
    { id: 'div', name: 'Sharing facts', icon: '➗', level: qf('div') },
  ];
  const tableSet = t => ({ id: 'x' + t, name: `${t} times table`, icon: '🚂', table: t });
  const findSet = id => SETS.find(s => s.id === id) || (/^x\d+$/.test(id) ? tableSet(Number(id.slice(1))) : null);

  function fact(set) {
    if (set.table) {
      const a = MA.util.rand(1, 12);
      return Math.random() < 0.5 ? M.make(a, 'x', set.table) : M.make(set.table, 'x', a);
    }
    return M.LEVELS[set.level - 1].gen();
  }

  const bests = () => {
    const p = MA.store.current();
    p.sprint = p.sprint || {};
    return p.sprint;
  };
  const timesLevel = t => MA.times.TABLES.indexOf(t) + 1;

  // ---------- The Practice screen ----------
  MA.ui.screen('practice', root => {
    if (!MA.store.current()) return MA.ui.go('profiles');
    const best = bests();
    const times = MA.store.game('times');

    const notebook = h('div', { class: 'tt-book' }, [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(t =>
      h('button', { class: 'tt-page', type: 'button', 'data-table': String(t), onclick: () => tablePage(t) },
        h('span', { class: 'tt-x', text: `× ${t}` }),
        MA.ui.stars(times.best[timesLevel(t)] || 0),
        best['x' + t] ? h('small', { text: `⏱️ ${best['x' + t]}` }) : null)));

    const sprints = h('div', { class: 'pr-grid' }, SETS.map(s =>
      h('button', { class: 'pr-card', type: 'button', 'data-sprint': s.id, onclick: () => MA.ui.go('sprint', { set: s.id }) },
        h('span', { class: 'pr-icon', text: s.icon }), h('b', { text: s.name }),
        best[s.id] ? h('small', { text: `Best: ${best[s.id]} in a minute` }) : null)));

    const skills = MA.store.current().skills;
    const accuracy = l => { const r = skills[l.id] || []; return r.length >= 3 ? r.reduce((a, b) => a + b, 0) / r.length : null; };
    const weak = M.LEVELS.map((l, i) => ({ l, i, a: accuracy(l) })).filter(x => x.a !== null && x.a < 0.85).sort((x, y) => x.a - y.a)[0];
    const qfProg = MA.store.game('quick-facts');
    const basic = h('div', { class: 'pr-levels' }, M.LEVELS.map((l, i) =>
      h('button', { class: 'pr-level', type: 'button', 'data-basic': String(i + 1),
        onclick: () => MA.ui.go('game', { gameId: 'quick-facts', level: i + 1, from: FROM }) },
        h('b', { text: l.name }), h('small', { text: l.eg }), qfProg.best[i + 1] ? MA.ui.stars(qfProg.best[i + 1]) : null)));

    root.append(h('div', { class: 'screen practice-screen' },
      MA.ui.topBar('Practice', () => MA.ui.go('hub')),
      h('h2', { class: 'section-title', text: '📒 Times tables notebook' }),
      notebook,
      h('h2', { class: 'section-title', text: '⏱️ One-minute speed run' }),
      sprints,
      h('h2', { class: 'section-title', text: '📝 Take your time' }),
      weak ? h('button', { class: 'btn btn-main pr-weak', type: 'button', 'data-weak': '1',
        onclick: () => MA.ui.go('game', { gameId: 'quick-facts', level: weak.i + 1, from: FROM }) }, `💪 Practise a weak spot: ${weak.l.name}`) : null,
      basic));
  });

  function tablePage(t) {
    const lv = timesLevel(t);
    const facts = h('ol', { class: 'tt-list' }, Array.from({ length: 12 }, (_, k) =>
      h('li', {}, h('span', { text: `${k + 1} × ${t} = ` }), h('b', { text: String((k + 1) * t) }))));
    const card = h('div', { class: 'modal-card tt-card' },
      h('button', { class: 'icon-btn close-x', type: 'button', 'aria-label': 'Close', onclick: () => close() }, '✕'),
      h('h2', { text: `The ${t} times table` }),
      h('p', { class: 'tt-trick' }, h('b', { text: '💡 Trick: ' }), MA.times.trick(3, t)),
      facts,
      h('div', { class: 'modal-actions' },
        h('button', { class: 'btn btn-soft', type: 'button', 'data-sprint': 'x' + t, onclick: () => { close(); MA.ui.go('sprint', { set: 'x' + t }); } }, '⏱️ Speed run'),
        h('button', { class: 'btn btn-main', type: 'button', 'data-start': '1',
          onclick: () => { close(); MA.ui.go('game', { gameId: 'times', level: lv, from: FROM }); } }, 'Practise ▶')));
    const close = MA.ui.modal(card, { dismiss: true });
  }

  // ---------- A speed run: as many as you can in a minute ----------
  MA.ui.screen('sprint', (root, params) => {
    const set = findSet(params.set);
    if (!set || !MA.store.current()) return MA.ui.go('practice');
    const total = SPRINT_MS * MA.games.speed;
    let score = 0, problem = null, started = 0, timer = null, done = false, waiting = false;
    const missed = [];
    const timers = [];

    const scoreEl = h('span', { class: 'run-score', text: '0' });
    const fill = h('i');
    const secs = h('span', { class: 'run-secs', text: '60' });
    const box = h('span', { class: 'qf-box' });
    const eq = h('div', { class: 'qf-eq' });
    const stage = h('main', { class: 'stage sprint-stage' });
    const exitBtn = h('button', { class: 'icon-btn exit-btn', type: 'button', 'aria-label': 'Stop', onclick: () => MA.ui.go('practice') }, '✕');
    root.append(h('div', { class: 'game-screen sprint-screen', style: { '--game': '#3b82f6' } },
      h('header', { class: 'game-bar' }, exitBtn,
        h('div', { class: 'game-name' }, h('span', { text: `⏱️ ${set.name}` }), h('span', { class: 'level-chip', text: 'Speed run' })),
        h('div', { class: 'run-timer' }, fill), secs, h('span', { class: 'run-scorebox' }, '✓ ', scoreEl)),
      stage));

    function next() {
      problem = fact(set);
      MA.games.current = problem; // read by the automated tests
      eq.innerHTML = '';
      M.tokens(problem).forEach(t => eq.append(t === '?' ? box : h('span', { class: 'tok', text: t })));
      box.textContent = '';
      box.className = 'qf-box';
      waiting = false;
    }

    const pad = MA.ui.keypad({
      maxLen: 4,
      onChange: v => { if (!waiting) box.textContent = v; },
      onSubmit: v => {
        if (done || waiting || !problem) return;
        if (v === problem.answer) {
          score++;
          scoreEl.textContent = String(score);
          MA.sound.play('correct');
          pad.clear();
          next();
        } else {
          MA.sound.play('wrong');
          missed.push(`${M.text(problem).replace('?', problem.answer)}`);
          waiting = true;
          box.textContent = String(problem.answer);
          box.className = 'qf-box wrong shown';
          timers.push(setTimeout(() => { pad.clear(); next(); }, 800 * MA.games.speed));
        }
      },
    });

    function tick() {
      const left = Math.max(0, total - (Date.now() - started));
      fill.style.width = (100 * left / total) + '%';
      secs.textContent = String(Math.ceil(left / 1000 / MA.games.speed));
      if (left <= 0) finish();
    }

    function finish() {
      if (done) return;
      done = true;
      clearInterval(timer);
      pad.disable(true);
      const best = bests();
      const before = best[set.id] || 0;
      const isBest = score > before;
      if (isBest) best[set.id] = score;
      MA.store.current().stars += Math.min(score, 30);
      MA.store.save();
      const again = () => MA.ui.go('sprint', params);
      stage.innerHTML = '';
      stage.append(h('div', { class: 'results' },
        MA.ui.mascot(isBest ? 'wow' : 'happy', 100),
        h('h1', { text: isBest && before ? 'New best!' : isBest ? 'Great start!' : 'Well done!' }),
        h('p', { class: 'result-line run-final', text: `${score} right in one minute · ⭐ +${Math.min(score, 30)}` }),
        h('p', { class: 'result-tip', text: isBest ? (before ? `Your old best was ${before}.` : 'Can you beat it next time?') : `Your best is ${before}. Keep going!` }),
        missed.length ? h('div', { class: 'remember' }, h('span', { text: "Let's remember:" }),
          [...new Set(missed)].slice(0, 8).map(m => h('span', { class: 'fact', text: m }))) : null,
        h('div', { class: 'result-actions' },
          h('button', { class: 'btn btn-soft', type: 'button', onclick: () => MA.ui.go('practice') }, '← Practice'),
          h('button', { class: 'btn btn-main', type: 'button', 'data-again': '1', onclick: again }, '↻ Go again'))));
      if (isBest && score) { MA.ui.confetti(); MA.sound.play('win'); }
      MA.voice.auto(`${score} right in one minute!`);
    }

    // A "ready, go" card, then the clock starts.
    const ready = h('div', { class: 'title-card', role: 'button' },
      h('div', { class: 'title-icon' }, '⏱️'), h('h1', { text: set.name }),
      h('p', { text: 'How many can you get right in one minute?' }), h('p', { class: 'title-intro', text: 'Tap to start!' }));
    const go = () => {
      if (started) return;
      ready.remove();
      stage.append(h('div', { class: 'qf sprint' }, h('div', { class: 'qf-book' }, h('div', { class: 'qf-rings', 'aria-hidden': 'true' }), eq), pad.el));
      next();
      started = Date.now();
      timer = setInterval(tick, 100);
    };
    ready.addEventListener('click', go);
    root.querySelector('.sprint-screen').append(ready);

    return () => {
      done = true;
      clearInterval(timer);
      timers.forEach(clearTimeout);
      pad.destroy();
    };
  });

  MA.practice = { SETS, findSet };
})(window.MA);
