// The game engine. Every game plays the same way:
// a title card, then a round of 10 problems, "Try again" with a hint after one miss,
// "Show me" after two, then stars and maybe a new level.
//
// A game registers itself with:
//   { id, title, icon, color, shelf, blurb, intro, levels,
//     make(level, ctx) -> problem, render(problem, stage, api) -> cleanup?, say(problem) -> text,
//     check?(problem, value), explain?(problem) -> {hint, steps}, visual?(problem) -> element }
// and calls api.answer(value) when the player answers (see api below).
(function (MA) {
  'use strict';

  const { h, pick } = MA.util;
  const ROUND = 10;
  const PRAISE = ['Great!', 'Super!', 'Brilliant!', 'Yes!', 'Awesome!', 'Spot on!', 'Fantastic!'];
  const list = [];

  MA.games = {
    ROUND,
    register(game) { list.push(game); },
    list: () => list,
    get: id => list.find(g => g.id === id),
  };

  // Stars for a round, from how many were right the first time.
  function starsFor(firstTry) {
    return firstTry >= 8 ? 3 : firstTry >= 6 ? 2 : 1;
  }
  MA.games.starsFor = starsFor;

  function titleCard(root, game, level) {
    return new Promise(resolve => {
      const lv = game.levels[level - 1];
      const card = h('div', { class: 'title-card', role: 'button', 'aria-label': 'Start' },
        h('div', { class: 'title-icon' }, game.icon),
        h('h1', { text: game.title }),
        h('p', { text: `Level ${level} · ${lv.name}` }),
        h('p', { class: 'title-intro', text: game.intro }));
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        card.classList.add('out');
        setTimeout(() => { card.remove(); resolve(); }, 250);
      };
      card.addEventListener('click', finish);
      root.append(card);
      MA.voice.auto(game.intro);
      setTimeout(finish, 1900);
    });
  }

  MA.ui.screen('game', (root, params) => {
    const game = MA.games.get(params.gameId);
    const progress = MA.store.game(game.id);
    const s = {
      level: params.level, i: 0, tries: 0, results: [], avoid: [],
      missStreak: 0, easier: false, busy: true, stopped: false, finished: false,
      problem: null, gameCleanup: null, timers: [],
    };

    const after = (ms, fn) => { s.timers.push(setTimeout(() => { if (!s.stopped) fn(); }, ms)); };

    const dotsEl = h('div', { class: 'progress', 'aria-label': 'Progress' });
    for (let i = 0; i < ROUND; i++) dotsEl.append(h('span', { class: 'pdot' }));
    const chip = h('span', { class: 'level-chip' });
    const exitBtn = h('button', { class: 'icon-btn exit-btn', type: 'button', 'aria-label': 'Stop playing', onclick: exit }, '✕');
    const speakBtn = h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Read the question aloud',
      onclick: () => s.problem && MA.voice.say(game.say(s.problem)) }, '🔊');
    const bar = h('header', { class: 'game-bar' }, exitBtn,
      h('div', { class: 'game-name' }, h('span', { text: `${game.icon} ${game.title}` }), chip),
      dotsEl, MA.voice.available ? speakBtn : null);
    const stage = h('main', { class: 'stage' });
    const msg = h('div', { class: 'game-msg', 'aria-live': 'polite' });
    const screenEl = h('div', { class: 'game-screen', style: { '--game': game.color } }, bar, stage, msg);
    root.append(screenEl);

    function markDot(i, kind) {
      const d = dotsEl.children[i];
      if (d) d.className = 'pdot ' + kind;
    }

    function runGameCleanup() {
      if (s.gameCleanup) { try { s.gameCleanup(); } catch (e) { /* keep going */ } }
      s.gameCleanup = null;
    }

    function next() {
      if (s.stopped) return;
      runGameCleanup();
      msg.innerHTML = '';
      msg.className = 'game-msg';
      if (s.i >= ROUND) return finish();

      const level = s.easier && s.level > 1 ? s.level - 1 : s.level;
      s.easier = false;
      const skill = game.levels[level - 1].id;
      const p = game.make(level, { review: MA.store.missedFacts(skill), avoid: s.avoid });
      p.level = level;
      p.skill = skill;
      s.problem = p;
      s.avoid.push(p.key);
      s.tries = 0;
      s.busy = false;

      chip.textContent = level === s.level ? `Level ${s.level}` : `Level ${s.level} · warm-up`;
      stage.innerHTML = '';
      stage.classList.remove('locked');
      markDot(s.i, 'current');
      const c = game.render(p, stage, api);
      s.gameCleanup = typeof c === 'function' ? c : null;
      MA.voice.auto(game.say(p));
    }

    function record(kind) {
      const p = s.problem;
      s.results.push({ kind, problem: p });
      markDot(s.i, kind);
      MA.store.recordSkill(p.skill, kind === 'first');
      MA.store.recordFact(p.skill, p, kind === 'first');
      if (kind === 'missed') {
        if (++s.missStreak >= 2) { s.easier = true; s.missStreak = 0; }
      } else {
        s.missStreak = 0;
      }
      MA.store.save();
    }

    function showMessage(cls, ...kids) {
      msg.innerHTML = '';
      msg.className = 'game-msg show ' + cls;
      msg.append(...kids);
    }

    // Games call api.answer(value). It returns true when right, false when wrong,
    // and null when the tap is ignored (between problems or during "Show me").
    const api = {
      after,
      busy: () => s.busy,
      results: () => s.results.map(r => r.kind),
      answer(value, opts) {
        if (s.busy || s.stopped) return null;
        const p = s.problem;
        const correct = game.check ? game.check(p, value) : value === p.answer;
        if (correct) {
          s.busy = true;
          record(s.tries === 0 ? 'first' : 'second');
          MA.sound.play('correct');
          showMessage('good', h('span', { class: 'praise', text: s.tries === 0 ? pick(PRAISE) : 'You got it!' }));
          after((opts && opts.delay) || 1000, () => { s.i++; next(); });
          return true;
        }
        s.tries++;
        MA.sound.play('wrong');
        if (s.tries < 2) {
          const hint = (game.explain ? game.explain(p) : MA.math.explain(p)).hint;
          showMessage('try', h('strong', { text: 'Not quite. Try again!' }), h('span', { class: 'hint', text: '💡 ' + hint }));
          MA.voice.auto('Not quite. ' + hint);
          return false;
        }
        s.busy = true;
        record('missed');
        after(500, showMe);
        return false;
      },
    };

    function showMe() {
      const p = s.problem;
      const ex = game.explain ? game.explain(p) : MA.math.explain(p);
      const visual = game.visual ? game.visual(p) : MA.ui.dots(p);
      const steps = h('ol', { class: 'steps' }, ex.steps.map(t => h('li', { text: t })));
      const go = h('button', { class: 'btn btn-main', type: 'button', onclick: () => { s.i++; next(); } }, 'Got it ▶');
      msg.innerHTML = '';
      msg.className = 'game-msg';
      stage.classList.add('locked');
      stage.append(h('div', { class: 'show-me', role: 'dialog', 'aria-label': 'Show me' },
        h('div', { class: 'show-me-head' }, MA.ui.mascot('think', 56), h('h2', { text: "Let's work it out" })),
        visual, steps,
        h('p', { class: 'show-me-answer' }, 'The answer is ', h('b', { text: String(p.answer) })),
        go));
      [...steps.children].forEach((li, i) => after(350 + i * 650, () => li.classList.add('in')));
      MA.voice.auto(ex.steps.join('. '));
      setTimeout(() => go.focus(), 50);
    }

    function finish() {
      s.finished = true;
      s.problem = null;
      const firstTry = s.results.filter(r => r.kind === 'first').length;
      const starsN = starsFor(firstTry);
      const earned = firstTry + (starsN === 3 ? 5 : 0);
      const profile = MA.store.current();
      profile.stars += earned;
      progress.plays++;
      progress.last = s.level;
      progress.best[s.level] = Math.max(progress.best[s.level] || 0, starsN);
      let opened = 0;
      if (starsN === 3 && s.level < game.levels.length && progress.unlocked <= s.level) {
        progress.unlocked = s.level + 1;
        opened = s.level + 1;
      }
      MA.store.save();
      chip.textContent = `Level ${s.level}`;

      const title = starsN === 3 ? 'Amazing!' : starsN === 2 ? 'Well done!' : 'Good try!';
      const starRow = MA.ui.stars(0);
      const toRemember = s.results.filter(r => r.kind !== 'first').map(r => r.problem);
      const actions = h('div', { class: 'result-actions' },
        h('button', { class: 'btn btn-soft', type: 'button', onclick: () => MA.ui.go('play') }, '← Games'),
        h('button', { class: 'btn btn-soft', type: 'button', onclick: () => MA.ui.go('game', { gameId: game.id, level: s.level }) }, '↻ Play again'),
        progress.unlocked > s.level
          ? h('button', { class: 'btn btn-main', type: 'button', onclick: () => MA.ui.go('game', { gameId: game.id, level: s.level + 1 }) }, `Level ${s.level + 1} ▶`)
          : null);

      stage.innerHTML = '';
      stage.append(h('div', { class: 'results' },
        MA.ui.mascot(starsN === 3 ? 'wow' : 'happy', 100),
        h('h1', { text: title }),
        starRow,
        h('p', { class: 'result-line', text: `${firstTry} of ${ROUND} right first time · ⭐ +${earned}` }),
        opened ? h('div', { class: 'unlocked' }, `🎉 New level open: Level ${opened} · ${game.levels[opened - 1].name}`) : null,
        starsN < 3 && progress.unlocked <= s.level ? h('p', { class: 'result-tip', text: 'Get 3 stars to open the next level.' }) : null,
        toRemember.length ? h('div', { class: 'remember' }, h('span', { text: "Let's remember:" }),
          toRemember.map(p => h('span', { class: 'fact', text: game.answerText ? game.answerText(p) : `${p.a} ${MA.math.SYM[p.op]} ${p.b} = ${p.c}` }))) : null,
        starsN === 1 && s.level > 1
          ? h('button', { class: 'btn btn-link', type: 'button', onclick: () => MA.ui.go('game', { gameId: game.id, level: s.level - 1 }) }, `Warm up on Level ${s.level - 1}`)
          : null,
        actions));
      [...starRow.children].forEach((st, i) => {
        if (i < starsN) after(300 + i * 350, () => { st.classList.add('on'); MA.sound.play('star'); });
      });
      if (opened || starsN === 3) after(300 + starsN * 350, () => { MA.ui.confetti(); MA.sound.play('win'); });
      MA.voice.auto(`${title} ${firstTry} out of ${ROUND} right first time.`);
    }

    async function exit() {
      if (s.finished || (s.i === 0 && s.tries === 0)) return MA.ui.go('play');
      const stop = await MA.ui.confirm('Stop this round?', "This round won't be saved.", 'Stop', 'Keep playing');
      if (stop) MA.ui.go('play');
    }

    titleCard(screenEl, game, s.level).then(next);

    return () => {
      s.stopped = true;
      s.timers.forEach(clearTimeout);
      runGameCleanup();
    };
  });
})(window.MA);
