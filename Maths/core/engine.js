// The game engine. Every game plays the same way:
// a title card, then a round of 10 problems, "Try again" with a hint after one miss,
// "Show me" after two, then stars and maybe a new level.
//
// A game registers itself with:
//   { id, title, icon, color, shelf, blurb, intro, levels,
//     make(level, ctx) -> problem, render(problem, stage, api) -> cleanup?, say(problem) -> text,
//     check?(problem, value), explain?(problem) -> {hint, steps}, visual?(problem) -> element,
//     fromParams?(params, level) -> problem }
// A problem has { key, answer } and, for review and the results screen, { params, memo }.
// and calls api.answer(value) when the player answers (see api below).
(function (MA) {
  'use strict';

  const { h, pick } = MA.util;
  const ROUND = 10;
  const PRAISE = ['Great!', 'Super!', 'Brilliant!', 'Yes!', 'Awesome!', 'Spot on!', 'Fantastic!'];
  const list = [];

  MA.games = {
    ROUND,
    speed: 1, // the automated tests turn this down to play rounds quickly
    register(game) { list.push(game); },
    list: () => list,
    get: id => list.find(g => g.id === id),
    // Called at the end of every round with {game, level, stars, firstTry, round, before, params}.
    // A listener may return lines to show on the results screen, such as "+2 💎".
    listeners: [],
  };

  // Stars for a round, from how many were right the first time: 3 stars for 80%, 2 for 60%.
  function starsFor(firstTry, round) {
    const r = firstTry / (round || ROUND);
    return r >= 0.8 ? 3 : r >= 0.6 ? 2 : 1;
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
      setTimeout(finish, 1900 * MA.games.speed);
    });
  }

  // params: { gameId, level, round?, mode? ('adventure' | 'daily'), from? {screen, params, label} }
  MA.ui.screen('game', (root, params) => {
    const game = MA.games.get(params.gameId);
    const progress = MA.store.game(game.id);
    const from = params.from || { screen: 'play', label: '← Games' };
    const s = {
      level: params.level, round: params.round || ROUND, i: 0, tries: 0, results: [], avoid: [],
      missStreak: 0, easier: false, busy: true, stopped: false, finished: false,
      problem: null, gameCleanup: null, timers: [],
    };

    const after = (ms, fn) => { s.timers.push(setTimeout(() => { if (!s.stopped) fn(); }, ms * MA.games.speed)); };

    const dotsEl = h('div', { class: 'progress', 'aria-label': 'Progress' });
    for (let i = 0; i < s.round; i++) dotsEl.append(h('span', { class: 'pdot' }));
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
      if (s.i >= s.round) return finish();

      const level = s.easier && s.level > 1 ? s.level - 1 : s.level;
      s.easier = false;
      const skill = game.levels[level - 1].id;
      const review = MA.store.missedFacts(skill).filter(f => !s.avoid.includes(f.key));
      // Games that can rebuild a problem from saved params get missed ones back here.
      let p = game.fromParams && review.length && Math.random() < 0.3
        ? Object.assign(game.fromParams(pick(review).p, level), { review: true })
        : null;
      // No repeats within a round, even for levels with only a few possible problems.
      for (let tries = 0; !p || (s.avoid.includes(p.key) && tries < 30); tries++) {
        p = game.make(level, { review, avoid: s.avoid });
      }
      p.level = level;
      p.skill = skill;
      s.problem = p;
      MA.games.current = p; // read by the automated tests
      MA.games.currentGame = game.id;
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

    // Games call api.answer(value), or api.right() / api.wrong(hint) when they check answers themselves
    // (games with several steps). Each returns true when right, false when wrong,
    // and null when the tap is ignored (between problems or during "Show me").
    const api = {
      after,
      busy: () => s.busy,
      tries: () => s.tries,
      results: () => s.results.map(r => r.kind),
      // A short message that is not a miss, such as "Borrow from the hundreds first".
      tip(text) {
        if (s.busy) return;
        showMessage('try', h('span', { class: 'hint', text: '💡 ' + text }));
        MA.voice.auto(text);
      },
      clearTip() {
        if (!s.busy) { msg.innerHTML = ''; msg.className = 'game-msg'; }
      },
      answer(value, opts) {
        if (s.busy || s.stopped) return null;
        const p = s.problem;
        const correct = game.check ? game.check(p, value) : value === p.answer;
        return correct ? api.right(opts) : api.wrong();
      },
      right(opts) {
        if (s.busy || s.stopped) return null;
        s.busy = true;
        record(s.tries === 0 ? 'first' : 'second');
        MA.sound.play('correct');
        showMessage('good', h('span', { class: 'praise', text: s.tries === 0 ? pick(PRAISE) : 'You got it!' }));
        after((opts && opts.delay) || 1000, () => { s.i++; next(); });
        return true;
      },
      wrong(hint) {
        if (s.busy || s.stopped) return null;
        const p = s.problem;
        s.tries++;
        MA.sound.play('wrong');
        if (s.tries < 2) {
          hint = hint || (game.explain ? game.explain(p) : MA.math.explain(p)).hint;
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
      stage.classList.remove('locked'); // the last problem may have ended in "Show me"
      const firstTry = s.results.filter(r => r.kind === 'first').length;
      const starsN = starsFor(firstTry, s.round);
      const earned = firstTry + (starsN === 3 ? 5 : 0);
      const profile = MA.store.current();
      profile.stars += earned;
      progress.plays++;
      progress.last = s.level;
      const before = progress.best[s.level] || 0;
      // Short daily rounds count for stars and practice, but only full rounds open levels.
      const full = s.round === ROUND;
      let opened = 0;
      if (full) {
        progress.best[s.level] = Math.max(before, starsN);
        if (starsN === 3 && s.level < game.levels.length && progress.unlocked <= s.level) {
          progress.unlocked = s.level + 1;
          opened = s.level + 1;
        }
      }
      const notes = [];
      MA.games.listeners.forEach(fn => {
        const out = fn({ game, level: s.level, stars: starsN, firstTry, round: s.round, before, params });
        if (out) notes.push(...[].concat(out));
      });
      MA.store.save();
      chip.textContent = `Level ${s.level}`;

      const title = starsN === 3 ? 'Amazing!' : starsN === 2 ? 'Well done!' : 'Good try!';
      const starRow = MA.ui.stars(0);
      const toRemember = s.results.filter(r => r.kind !== 'first').map(r => r.problem);
      const back = () => MA.ui.go(from.screen, from.params);
      const replay = () => MA.ui.go('game', params);
      const actions = params.mode
        ? h('div', { class: 'result-actions' },
          h('button', { class: 'btn btn-soft', type: 'button', onclick: replay }, '↻ Play again'),
          h('button', { class: 'btn btn-main', type: 'button', 'data-back': '1', onclick: back }, from.label))
        : h('div', { class: 'result-actions' },
          h('button', { class: 'btn btn-soft', type: 'button', onclick: back }, from.label),
          h('button', { class: 'btn btn-soft', type: 'button', onclick: replay }, '↻ Play again'),
          progress.unlocked > s.level
            ? h('button', { class: 'btn btn-main', type: 'button', onclick: () => MA.ui.go('game', { gameId: game.id, level: s.level + 1 }) }, `Level ${s.level + 1} ▶`)
            : null);

      stage.innerHTML = '';
      stage.append(h('div', { class: 'results' },
        MA.ui.mascot(starsN === 3 ? 'wow' : 'happy', 100),
        h('h1', { text: title }),
        starRow,
        h('p', { class: 'result-line', text: `${firstTry} of ${s.round} right first time · ⭐ +${earned}` }),
        opened ? h('div', { class: 'unlocked' }, `🎉 New level open: Level ${opened} · ${game.levels[opened - 1].name}`) : null,
        notes.map(n => h('div', { class: 'unlocked note', text: n })),
        full && !params.mode && starsN < 3 && progress.unlocked <= s.level ? h('p', { class: 'result-tip', text: 'Get 3 stars to open the next level.' }) : null,
        toRemember.length ? h('div', { class: 'remember' }, h('span', { text: "Let's remember:" }),
          toRemember.map(p => h('span', { class: 'fact', text: p.memo || `${p.a} ${MA.math.SYM[p.op]} ${p.b} = ${p.c}` }))) : null,
        starsN === 1 && s.level > 1 && !params.mode
          ? h('button', { class: 'btn btn-link', type: 'button', onclick: () => MA.ui.go('game', { gameId: game.id, level: s.level - 1 }) }, `Warm up on Level ${s.level - 1}`)
          : null,
        actions));
      [...starRow.children].forEach((st, i) => {
        if (i < starsN) after(300 + i * 350, () => { st.classList.add('on'); MA.sound.play('star'); });
      });
      if (opened || starsN === 3 || notes.length) after(300 + starsN * 350, () => { MA.ui.confetti(); MA.sound.play('win'); });
      MA.voice.auto(`${title} ${firstTry} out of ${s.round} right first time.`);
    }

    async function exit() {
      const leave = () => MA.ui.go(from.screen, from.params);
      if (s.finished || (s.i === 0 && s.tries === 0)) return leave();
      const stop = await MA.ui.confirm('Stop this round?', "This round won't be saved.", 'Stop', 'Keep playing');
      if (stop) leave();
    }

    titleCard(screenEl, game, s.level).then(next);

    return () => {
      s.stopped = true;
      s.timers.forEach(clearTimeout);
      runGameCleanup();
    };
  });
})(window.MA);
