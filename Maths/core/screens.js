// The menu screens: choose a player, the main menu, and the games shelf with its level picker.
(function (MA) {
  'use strict';

  const { h, pick } = MA.util;
  const AVATARS = ['🦁', '🐯', '🐼', '🦊', '🐸', '🐙', '🦄', '🐲', '🐵', '🐧', '🐨', '🐰'];
  const COLORS = ['#ff8a3d', '#4f9cf9', '#2bb673', '#8e5bd8', '#ef5b8b', '#f5b700'];

  const AREAS = [
    { id: 'adventure', icon: '🗺️', name: 'Adventure', text: 'Follow the map and find treasure', color: '#ff8a1f' },
    { id: 'play', icon: '🎮', name: 'Play', text: 'Pick any game', color: '#6cc417' },
    { id: 'practice', icon: '⚡', name: 'Practice', text: 'Times tables and speed runs', color: '#12b8a6' },
    { id: 'brain', icon: '🧩', name: 'Brain Games', text: 'Puzzles and memory', color: '#7c4dff' },
    { id: 'collection', icon: '🏆', name: 'Collection', text: 'Your creatures', color: '#f2408a' },
  ];

  function starCount(p) {
    return h('span', { class: 'star-count', 'aria-label': `${p.stars} stars` }, '⭐ ', String(p.stars));
  }

  function gemCount(p) {
    return h('span', { class: 'star-count gem-count', 'aria-label': `${p.gems} gems` }, '💎 ', String(p.gems));
  }

  // ---------- Who's playing? ----------
  MA.ui.screen('profiles', root => {
    let removing = false;

    function draw() {
      root.innerHTML = '';
      const list = MA.store.profiles();
      if (!list.length) removing = false;
      const grid = h('div', { class: 'profile-grid' });
      list.forEach(p => grid.append(
        h('button', { class: 'profile-card' + (removing ? ' removing' : ''), type: 'button', style: { '--c': p.color },
          'aria-label': removing ? `Remove ${p.name}` : `Play as ${p.name}`,
          onclick: () => (removing ? remove(p) : choose(p)) },
          h('span', { class: 'avatar' }, p.avatar),
          h('span', { class: 'pname', text: p.name }),
          starCount(p),
          removing ? h('span', { class: 'del-badge', 'aria-hidden': 'true' }, '✕') : null)));
      if (!removing) {
        grid.append(h('button', { class: 'profile-card add', type: 'button', onclick: addPlayer },
          h('span', { class: 'avatar' }, '+'), h('span', { class: 'pname', text: 'Add player' })));
      }
      root.append(h('div', { class: 'screen profiles-screen' },
        h('div', { class: 'brand' }, MA.ui.mascot('happy', 110), h('h1', { text: 'Maths Adventure' })),
        h('p', { class: 'lead', text: removing ? 'Tap a player to remove them.' : list.length ? "Who's playing?" : "Let's make your player!" }),
        grid,
        list.length ? h('button', { class: 'btn btn-link', type: 'button', onclick: () => { removing = !removing; draw(); } },
          removing ? 'Done' : 'Remove a player') : null));
    }

    function choose(p) {
      MA.store.select(p.id);
      MA.sound.play('tap');
      MA.ui.go('hub');
    }

    async function remove(p) {
      const yes = await MA.ui.confirm(`Remove ${p.name}?`, `All of ${p.name}'s stars and levels will be deleted.`, 'Remove', 'Keep');
      if (yes) MA.store.remove(p.id);
      draw();
    }

    function addPlayer() {
      const used = MA.store.profiles().map(p => p.avatar);
      let avatar = pick(AVATARS.filter(a => !used.includes(a)).concat(used.length >= AVATARS.length ? AVATARS : []));
      let color = COLORS[MA.store.profiles().length % COLORS.length];

      const name = h('input', { class: 'name-input', type: 'text', maxlength: '14', placeholder: 'Your name',
        'aria-label': 'Name', autocomplete: 'off', autofocus: true });
      const avatarRow = h('div', { class: 'choice-row', role: 'group', 'aria-label': 'Pick an animal' });
      const colorRow = h('div', { class: 'choice-row', role: 'group', 'aria-label': 'Pick a colour' });
      const preview = h('span', { class: 'avatar big' });

      function refresh() {
        preview.textContent = avatar;
        preview.style.setProperty('--c', color);
        [...avatarRow.children].forEach(b => b.setAttribute('aria-pressed', String(b.textContent === avatar)));
        [...colorRow.children].forEach(b => b.setAttribute('aria-pressed', String(b.dataset.c === color)));
      }
      AVATARS.forEach(a => avatarRow.append(h('button', { class: 'pick-avatar', type: 'button',
        onclick: () => { avatar = a; refresh(); } }, a)));
      COLORS.forEach(c => colorRow.append(h('button', { class: 'pick-color', type: 'button', 'data-c': c,
        'aria-label': 'Colour', style: { background: c }, onclick: () => { color = c; refresh(); } })));

      const error = h('p', { class: 'form-error', role: 'alert' });
      function save() {
        const n = name.value.trim();
        if (!n) { error.textContent = 'Type a name first.'; name.focus(); return; }
        close();
        MA.store.add(n, avatar, color);
        MA.sound.play('star');
        MA.ui.go('hub');
      }
      name.addEventListener('keydown', e => { if (e.key === 'Enter') save(); });

      const card = h('div', { class: 'modal-card add-card' },
        h('h2', { text: 'New player' }),
        h('div', { class: 'add-top' }, preview, name),
        error,
        h('p', { class: 'small-label', text: 'Pick an animal' }), avatarRow,
        h('p', { class: 'small-label', text: 'Pick a colour' }), colorRow,
        h('div', { class: 'modal-actions' },
          h('button', { class: 'btn btn-soft', type: 'button', onclick: () => close(), text: 'Cancel' }),
          h('button', { class: 'btn btn-main', type: 'button', onclick: save, text: "Let's go!" })));
      refresh();
      const close = MA.ui.modal(card);
    }

    draw();
  });

  // ---------- Main menu ----------
  function toggle(setting, onIcon, offIcon, label) {
    const btn = h('button', { class: 'toggle', type: 'button' });
    function paint() {
      const on = !!MA.store.setting(setting);
      btn.setAttribute('aria-pressed', String(on));
      btn.textContent = `${on ? onIcon : offIcon} ${label}`;
    }
    btn.addEventListener('click', () => {
      MA.store.setting(setting, !MA.store.setting(setting));
      paint();
      if (setting === 'sound') MA.sound.play('tap');
      if (setting === 'voice' && MA.store.setting('voice')) MA.voice.say('I will read the questions to you.');
    });
    paint();
    return btn;
  }

  function topBar(title, back) {
    const p = MA.store.current();
    return h('header', { class: 'top-bar' },
      back ? h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Back', onclick: back }, '←') : null,
      h('button', { class: 'player-chip', type: 'button', style: { '--c': p.color }, 'aria-label': 'Change player',
        onclick: () => MA.ui.go('profiles') }, h('span', { class: 'avatar small' }, p.avatar), h('span', { text: p.name })),
      title ? h('h1', { class: 'bar-title', text: title }) : h('span', { class: 'spacer' }),
      h('span', { class: 'counts' }, starCount(p), gemCount(p)));
  }
  MA.ui.topBar = topBar;

  // Today's three goals, each worth a few gems once done.
  function goalsCard() {
    const A = MA.adventure;
    const t = A.day();
    const card = h('section', { class: 'goals-card', 'aria-label': "Today's goals" }, h('h2', { text: "⭐ Today's goals" }));
    A.GOALS.forEach(g => {
      const n = Math.min(t[g.id], g.need);
      const done = n >= g.need;
      card.append(h('div', { class: 'goal' + (t.claimed[g.id] ? ' claimed' : done ? ' ready' : ''), 'data-goal': g.id },
        h('span', { class: 'goal-text', text: g.text }),
        h('span', { class: 'goal-bar' }, h('i', { style: { width: (100 * n / g.need) + '%' } })),
        h('span', { class: 'goal-n', text: `${n}/${g.need}` }),
        t.claimed[g.id] ? h('span', { class: 'goal-done', text: '✓' })
          : done ? h('button', { class: 'btn btn-main goal-claim', type: 'button', onclick: () => {
            if (A.claimGoal(g.id)) { MA.sound.play('star'); MA.ui.toast(`+${A.GEMS.goal} 💎`); MA.ui.go('hub'); }
          } }, `Claim +${A.GEMS.goal} 💎`) : null));
    });
    return card;
  }

  MA.ui.screen('hub', root => {
    const p = MA.store.current();
    if (!p) return MA.ui.go('profiles');
    const tiles = h('div', { class: 'area-grid' }, AREAS.map(a =>
      h('button', { class: 'area-tile' + (a.soon ? ' soon' : '') + (a.id === 'adventure' ? ' hero' : ''), type: 'button',
        style: { '--c': a.color }, 'data-area': a.id,
        onclick: () => { if (a.soon) MA.ui.toast(`${a.name} is coming soon!`); else MA.ui.go(a.id); } },
        h('span', { class: 'area-icon' }, a.icon),
        h('span', { class: 'area-name', text: a.name }),
        h('span', { class: 'area-text', text: a.text }),
        a.soon ? h('span', { class: 'soon-badge', text: 'Soon' }) : null)));
    root.append(h('div', { class: 'screen hub-screen' },
      topBar(null),
      h('div', { class: 'hello' }, MA.ui.mascot('happy', 74), h('p', {}, `Hi ${p.name}! `, h('span', { text: 'What shall we play?' }))),
      goalsCard(),
      tiles,
      h('div', { class: 'settings-row' },
        MA.voice.available ? toggle('voice', '🔊', '🔈', 'Read aloud') : null,
        toggle('sound', '🎵', '🔇', 'Sounds'),
        h('button', { class: 'toggle', type: 'button', 'data-themes': '1', onclick: () => MA.themes.picker() }, '🎨 Theme'))));
  });

  // ---------- Games shelf ----------
  MA.ui.screen('play', root => {
    if (!MA.store.current()) return MA.ui.go('profiles');
    const shelves = {};
    MA.games.list().filter(g => g.shelf !== BRAIN).forEach(g => (shelves[g.shelf] = shelves[g.shelf] || []).push(g));
    root.append(h('div', { class: 'screen play-screen' },
      topBar('Play', () => MA.ui.go('hub')),
      Object.entries(shelves).map(([shelf, games]) => h('section', { class: 'shelf' },
        h('h2', { text: shelf }),
        h('div', { class: 'game-grid' }, games.map(g => gameCard(g)))))));
  });

  // ---------- Brain games: puzzles that build thinking skills ----------
  const BRAIN = 'Brain games';
  MA.ui.screen('brain', root => {
    if (!MA.store.current()) return MA.ui.go('profiles');
    const from = { screen: 'brain', label: '← Brain Games' };
    root.append(h('div', { class: 'screen play-screen brain-screen' },
      topBar('Brain Games', () => MA.ui.go('hub')),
      h('div', { class: 'game-grid' }, MA.games.list().filter(g => g.shelf === BRAIN).map(g => gameCard(g, from)))));
  });

  function gameCard(g, from) {
    const prog = MA.store.game(g.id);
    const n = g.levels.length;
    const open = Math.min(prog.unlocked, n);
    return h('button', { class: 'game-card', type: 'button', style: { '--c': g.color }, 'data-game': g.id, onclick: () => levelPicker(g, from) },
      h('span', { class: 'game-icon' }, g.icon),
      h('span', { class: 'game-title', text: g.title }),
      h('span', { class: 'game-blurb', text: g.blurb }),
      h('span', { class: 'game-level', text: `Lv.${open}` }),
      h('span', { class: 'level-bar' }, h('i', { style: { width: (100 * open / n) + '%' } })));
  }

  function levelPicker(g, from) {
    const prog = MA.store.game(g.id);
    let sel = Math.min(prog.unlocked, g.levels.length);
    const bubbles = h('div', { class: 'level-grid', role: 'listbox', 'aria-label': 'Levels' });
    const detail = h('div', { class: 'level-detail' });

    function paint() {
      [...bubbles.children].forEach((b, i) => {
        b.classList.toggle('selected', i + 1 === sel);
        b.setAttribute('aria-selected', String(i + 1 === sel));
      });
      const lv = g.levels[sel - 1];
      const ahead = sel > prog.unlocked;
      detail.innerHTML = '';
      detail.append(...[
        h('h3', { text: `Level ${sel} · ${lv.name}` }),
        h('p', { class: 'eg', text: `Like this: ${lv.eg}` }),
        ahead ? h('p', { class: 'ahead', text: '🚀 Skip-ahead challenge! Get 3 stars to jump straight here.' }) : null,
        prog.best[sel] ? h('p', { class: 'best' }, 'Your best: ', MA.ui.stars(prog.best[sel])) : null,
      ].filter(Boolean));
    }

    g.levels.forEach((lv, i) => {
      const n = i + 1;
      bubbles.append(h('button', { class: 'level-bubble' + (n > prog.unlocked ? ' ahead' : ''), type: 'button', role: 'option',
        'aria-label': `Level ${n}, ${lv.name}`, onclick: () => { sel = n; MA.sound.play('tap'); paint(); } },
        h('span', { class: 'lnum', text: String(n) }),
        prog.best[n] ? MA.ui.stars(prog.best[n]) : null));
    });

    const card = h('div', { class: 'modal-card picker', style: { '--c': g.color } },
      h('button', { class: 'icon-btn close-x', type: 'button', 'aria-label': 'Close', onclick: () => close() }, '✕'),
      h('div', { class: 'picker-head' }, h('span', { class: 'game-icon' }, g.icon),
        h('div', {}, h('h2', { text: g.title }), h('p', { text: g.intro }))),
      bubbles, detail,
      h('button', { class: 'btn btn-main btn-big', type: 'button', 'data-start': '1',
        onclick: () => { close(); MA.ui.go('game', { gameId: g.id, level: sel, from }); } }, 'Start ▶'));
    paint();
    const close = MA.ui.modal(card, { dismiss: true });
    const chosen = bubbles.children[sel - 1];
    if (chosen && chosen.scrollIntoView) chosen.scrollIntoView({ block: 'nearest' });
  }
})(window.MA);
