// The grown-ups page: progress by skill, weak spots, time played, and settings. A sum only grown-ups can do opens it.
(function (MA) {
  'use strict';

  const { h, rand } = MA.util;
  const DAY = 86400000;

  // Which game and level every skill id belongs to.
  function skillNames() {
    const out = {};
    MA.games.list().forEach(g => g.levels.forEach((lv, i) => {
      if (!out[lv.id]) out[lv.id] = { game: g, level: i + 1, name: lv.name };
    }));
    return out;
  }
  const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const minutes = s => (!s ? '0 min' : s < 60 ? 'under 1 min' : `${Math.round(s / 60)} min`);

  // ---------- The grown-ups check ----------
  function gate(then) {
    const a = rand(12, 19), b = rand(3, 9);
    const input = h('input', { class: 'name-input', type: 'number', inputmode: 'numeric', 'aria-label': 'Answer', autofocus: true });
    const err = h('p', { class: 'form-error', role: 'alert' });
    const go = () => {
      if (Number(input.value) === a * b) { close(); then(); }
      else { err.textContent = 'Not quite. Ask a grown-up!'; input.value = ''; input.focus(); }
    };
    input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    const card = h('div', { class: 'modal-card gu-gate' },
      h('h2', { text: '🔒 For grown-ups' }),
      h('p', { text: `To open, type the answer to ${a} × ${b}.` }),
      input, err,
      h('div', { class: 'modal-actions' },
        h('button', { class: 'btn btn-soft', type: 'button', onclick: () => close() }, 'Cancel'),
        h('button', { class: 'btn btn-main', type: 'button', 'data-open': '1', onclick: go }, 'Open')));
    const close = MA.ui.modal(card);
    MA.grownups.lastGate = a * b; // read by the automated tests
  }

  // ---------- The page ----------
  MA.ui.screen('grownups', (root, params) => {
    const all = MA.store.profiles();
    if (!all.length) return MA.ui.go('profiles');
    const p = all.find(x => x.id === params.id) || MA.store.current() || all[0];
    const names = skillNames();

    const tabs = all.length > 1 ? h('div', { class: 'gu-tabs' }, all.map(x => h('button', {
      class: 'gu-tab' + (x.id === p.id ? ' on' : ''), type: 'button', 'data-kid': x.id, style: { '--c': x.color },
      onclick: () => MA.ui.go('grownups', { id: x.id }) }, h('span', { class: 'avatar small' }, x.avatar), x.name))) : null;

    // The last 7 days.
    const log = p.log || {};
    const days = [];
    for (let k = 6; k >= 0; k--) { const d = new Date(Date.now() - k * DAY); days.push({ d, v: log[ymd(d)] || { rounds: 0, secs: 0 } }); }
    const maxSecs = Math.max(60, ...days.map(x => x.v.secs));
    const week = days.reduce((a, x) => a + x.v.secs, 0);
    const rounds = Object.values(p.games).reduce((a, g) => a + (g.plays || 0), 0);

    const summary = h('div', { class: 'gu-stats' }, [
      ['⭐', p.stars, 'stars'], ['🎮', rounds, 'rounds played'], ['⏱️', minutes(week), 'this week'],
      ['🔥', p.streak && p.streak.count || 0, 'day streak'], ['🏆', (p.creatures || []).length, 'creatures'],
    ].map(([i, n, t]) => h('div', { class: 'gu-stat' }, h('span', { text: i }), h('b', { text: String(n) }), h('small', { text: t }))));

    const chart = h('div', { class: 'gu-week' }, days.map(x => h('div', { class: 'gu-day' },
      h('span', { class: 'gu-bar' }, h('i', { style: { height: (100 * x.v.secs / maxSecs) + '%' } })),
      h('small', { text: x.d.toLocaleDateString('en-IN', { weekday: 'short' }) }),
      h('b', { text: x.v.secs ? minutes(x.v.secs) : '–' }))));

    // Skills: how often right first time, over the last answers.
    const skills = Object.entries(p.skills).filter(([id, list]) => list.length >= 3 && names[id]).map(([id, list]) => ({
      id, info: names[id], n: list.length, pct: Math.round(100 * list.reduce((a, b) => a + b, 0) / list.length) }));
    skills.sort((a, b) => a.pct - b.pct);
    const band = pct => (pct >= 85 ? ['strong', 'Strong'] : pct >= 60 ? ['ok', 'Getting there'] : ['weak', 'Needs practice']);
    const skillRows = skills.length ? h('div', { class: 'gu-skills' }, skills.map(s => {
      const [cls, word] = band(s.pct);
      return h('div', { class: 'gu-skill ' + cls },
        h('span', { class: 'gu-gi', text: s.info.game.icon }),
        h('div', {}, h('b', { text: s.info.name }), h('small', { text: `${s.info.game.title} · Level ${s.info.level}` })),
        h('span', { class: 'gu-pct', text: `${s.pct}%` }), h('span', { class: 'gu-band', text: word }));
    })) : h('p', { class: 'gu-empty', text: 'Play a few rounds and skills will show here.' });

    // Weak spots: the facts missed most, which the games bring back for more practice.
    const facts = [];
    Object.entries(p.facts).forEach(([skill, list]) => Object.values(list).forEach(f => facts.push({ skill, f })));
    facts.sort((a, b) => b.f.m - a.f.m);
    const weak = facts.length ? h('div', { class: 'gu-facts' }, facts.slice(0, 12).map(({ skill, f }) =>
      h('span', { class: 'fact', title: names[skill] ? names[skill].game.title : '' }, f.memo || (names[skill] ? names[skill].name : f.key)))) : h('p', { class: 'gu-empty', text: 'No weak spots right now. 🎉' });

    // Settings for this child.
    const setRow = (key, label) => {
      const on = p.settings[key] !== false && !!p.settings[key];
      return h('button', { class: 'toggle', type: 'button', 'aria-pressed': String(on), 'data-setting': key, onclick: () => {
        p.settings[key] = !on; MA.store.save(); MA.ui.go('grownups', { id: p.id });
      } }, `${on ? '✅' : '⬜'} ${label}`);
    };
    const reset = h('button', { class: 'btn btn-soft gu-danger', type: 'button', 'data-reset': '1', onclick: async () => {
      const yes = await MA.ui.confirm(`Start ${p.name} again?`, `All of ${p.name}'s stars, levels, gems and creatures will be cleared.`, 'Clear progress', 'Keep');
      if (!yes) return;
      Object.assign(p, { games: {}, skills: {}, facts: {}, stars: 0, gems: 0, creatures: [], chests: {}, streak: { last: null, count: 0 }, daily: null, today: null, sprint: {}, log: {} });
      MA.store.save();
      MA.ui.toast(`${p.name} is starting fresh.`);
      MA.ui.go('grownups', { id: p.id });
    } }, '🗑️ Clear progress');

    const back = () => MA.ui.go(MA.store.current() ? 'hub' : 'profiles');
    root.append(h('div', { class: 'screen grownups-screen' },
      h('header', { class: 'top-bar' },
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Back', onclick: back }, '←'),
        h('h1', { class: 'bar-title', text: 'Grown-ups' })),
      tabs,
      h('section', { class: 'gu-card' }, h('h2', {}, h('span', { class: 'avatar small', style: { '--c': p.color } }, p.avatar), ` ${p.name}`), summary),
      h('section', { class: 'gu-card' }, h('h2', { text: 'Time played' }), chart),
      h('section', { class: 'gu-card' }, h('h2', { text: 'Skills' }), h('p', { class: 'gu-note', text: 'Right first time, over the last 20 answers of each skill. Weakest first.' }), skillRows),
      h('section', { class: 'gu-card' }, h('h2', { text: 'Weak spots' }), h('p', { class: 'gu-note', text: 'Facts missed recently. The games bring these back until they are right.' }), weak),
      h('section', { class: 'gu-card' }, h('h2', { text: 'Settings' }),
        h('div', { class: 'settings-row gu-settings' }, setRow('sound', 'Sounds'), MA.voice.available ? setRow('voice', 'Read questions aloud') : null,
          h('button', { class: 'toggle', type: 'button', onclick: () => MA.themes.picker() }, '🎨 Theme'), reset))));
  });

  MA.grownups = { open: () => gate(() => MA.ui.go('grownups')), gate };
})(window.MA);
