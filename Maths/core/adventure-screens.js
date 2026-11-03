// Screens for the Adventure (worlds, the map, today's playlist) and the creature Collection.
(function (MA) {
  'use strict';

  const { h } = MA.util;
  const A = MA.adventure;

  const gameOf = stop => MA.games.get(stop.game);
  const levelOf = stop => gameOf(stop).levels[stop.level - 1];

  function creatureCard(c, owned, hintText) {
    return h('div', { class: 'creature' + (owned ? ' owned' : ''), style: { '--c': c.color }, 'data-creature': c.id },
      h('span', { class: 'creature-icon' }, owned ? c.icon : '❓'),
      h('b', { text: owned ? c.name : '???' }),
      h('small', { text: owned ? c.line : hintText }));
  }

  function playStop(stop, from) {
    MA.ui.go('game', { gameId: stop.game, level: stop.level, mode: 'adventure', from });
  }

  // ---------- Adventure: today's playlist and the worlds ----------
  MA.ui.screen('adventure', root => {
    if (!MA.store.current()) return MA.ui.go('profiles');
    const p = MA.store.current();
    const d = A.daily();
    const done = d.items.filter(it => it.done).length;
    const dailyCard = h('button', { class: 'daily-card', type: 'button', 'data-daily': '1', onclick: () => MA.ui.go('daily') },
      h('div', { class: 'daily-head' },
        h('span', { class: 'daily-sun', 'aria-hidden': 'true' }, '☀️'),
        h('div', {}, h('h2', { text: "Today's Adventure" }),
          h('p', { text: d.gift ? 'All done today. See you tomorrow!' : `${done} of ${d.items.length} done · 5 quick rounds` })),
        p.streak.count ? h('span', { class: 'streak', text: `🔥 ${p.streak.count} day${p.streak.count > 1 ? 's' : ''}` }) : null),
      h('div', { class: 'daily-mini' }, d.items.map(it => h('span', { class: 'mini' + (it.done ? ' done' : ''), text: gameOf(it).icon })),
        h('span', { class: 'mini gift' + (d.gift ? ' done' : ''), text: '🎁' })));

    const worlds = h('div', { class: 'world-grid' }, A.WORLDS.map((w, i) => {
      const open = A.worldOpen(i);
      const n = w.stops.filter(A.passed).length;
      const card = h('div', { class: 'world-card' + (open ? '' : ' locked'), style: { '--c': w.color }, 'data-world': w.id },
        h('span', { class: 'world-icon' }, w.icon),
        h('h3', { text: w.name }),
        h('p', { text: w.text }),
        h('span', { class: 'level-bar' }, h('i', { style: { width: (100 * n / w.stops.length) + '%' } })),
        h('span', { class: 'world-n', text: `${n} of ${w.stops.length} stops${p.chests[w.id] ? ' · 🎁 opened' : ''}` }));
      if (open) {
        card.setAttribute('role', 'button');
        card.tabIndex = 0;
        card.addEventListener('click', () => MA.ui.go('world', { id: w.id }));
      } else {
        card.append(h('p', { class: 'world-lock', text: `🔒 Finish ${A.WORLDS[i - 1].name} first, or jump ahead: get 3 stars on its first stop.` }),
          h('button', { class: 'btn btn-main', type: 'button', 'data-jump': w.id,
            onclick: () => playStop(w.stops[0], { screen: 'adventure', label: '🗺️ Back to Adventure' }) }, '🚀 Jump-ahead challenge'));
      }
      return card;
    }));

    root.append(h('div', { class: 'screen adventure-screen' },
      MA.ui.topBar('Adventure', () => MA.ui.go('hub')),
      dailyCard,
      h('h2', { class: 'section-title', text: 'Worlds' }),
      worlds));
  });

  // ---------- A world map: stops on a winding path, treasure at the end ----------
  function layout(n, cols) {
    const rows = Math.ceil(n / cols);
    const pts = [];
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / cols), k = i % cols;
      const c = r % 2 ? cols - 1 - k : k;
      pts.push({ x: 9 + c * (82 / (cols - 1)), y: rows === 1 ? 50 : 15 + r * (72 / (rows - 1)) });
    }
    return pts;
  }

  function pathD(pts) {
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      if (Math.abs(a.y - b.y) < 1) d += ` L ${b.x} ${b.y}`;
      else {
        const out = a.x > 50 ? 9 : -9;
        d += ` C ${a.x + out} ${a.y} ${b.x + out} ${b.y} ${b.x} ${b.y}`;
      }
    }
    return d;
  }

  MA.ui.screen('world', (root, params) => {
    if (!MA.store.current()) return MA.ui.go('profiles');
    const i = A.WORLDS.findIndex(w => w.id === params.id);
    const w = A.WORLDS[i];
    if (!w || !A.worldOpen(i)) return MA.ui.go('adventure');
    const p = MA.store.current();
    const from = { screen: 'world', params: { id: w.id }, label: '🗺️ Back to map' };
    const cur = A.currentStop(w);
    const n = w.stops.filter(A.passed).length;

    const map = h('div', { class: 'map', style: { '--c': w.color } });
    const cols = innerWidth > innerHeight * 1.05 ? 5 : 3;
    const pts = layout(w.stops.length + 1, cols);
    map.append(h('div', { class: 'map-path', html:
      `<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="${pathD(pts)}" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="14" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
        <path d="${pathD(pts)}" fill="none" stroke="rgba(120,80,30,.35)" stroke-width="3" stroke-dasharray="2 10" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
      </svg>` }));
    // Scenery, placed the same way every visit.
    w.deco.concat(w.deco).forEach((e, k) => map.append(h('span', { class: 'map-deco', 'aria-hidden': 'true', text: e,
      style: { left: ((k * 37 + 11) % 92 + 4) + '%', top: ((k * 53 + 7) % 84 + 6) + '%' } })));

    w.stops.forEach((st, k) => {
      const open = A.stopOpen(w, k);
      const ok = A.passed(st);
      const node = h('button', { class: 'stop' + (ok ? ' done' : open ? ' open' : ' locked') + (k === cur ? ' current' : ''), type: 'button',
        'data-stop': String(k), 'aria-label': `Stop ${k + 1}: ${gameOf(st).title}, level ${st.level}${ok ? ', cleared' : open ? '' : ', locked'}`,
        style: { left: pts[k].x + '%', top: pts[k].y + '%' } },
        h('span', { class: 'stop-icon' }, open || ok ? gameOf(st).icon : '🔒'),
        h('span', { class: 'stop-num', text: String(k + 1) }),
        ok ? MA.ui.stars(A.best(st)) : null);
      node.addEventListener('click', () => (open ? stopCard(st, k) : MA.ui.toast('Clear the stop before this one first!')));
      map.append(node);
      if (k === cur) {
        const pip = MA.ui.mascot('happy', 52);
        pip.classList.add('map-pip');
        pip.style.left = pts[k].x + '%';
        pip.style.top = pts[k].y + '%';
        map.append(pip);
      }
    });

    const finished = A.worldDone(w);
    const chestOpen = !!p.chests[w.id];
    const chest = h('button', { class: 'stop chest' + (chestOpen ? ' done' : finished ? ' ready' : ' locked'), type: 'button', 'data-chest': '1',
      'aria-label': chestOpen ? 'Treasure chest, opened' : finished ? 'Open the treasure chest' : 'Treasure chest, locked',
      style: { left: pts[w.stops.length].x + '%', top: pts[w.stops.length].y + '%' } },
      h('span', { class: 'stop-icon' }, chestOpen ? '🎁' : '🧰'));
    chest.addEventListener('click', () => {
      if (chestOpen) return MA.ui.toast('You already opened this treasure!');
      if (!finished) return MA.ui.toast('Clear every stop to open the treasure!');
      const c = A.openChest(w);
      MA.sound.play('win');
      MA.ui.confetti();
      reward('Treasure!', [`+${A.GEMS.chest} 💎`, `${c.name} joined your collection!`], creatureCard(c, true), () => MA.ui.go('world', { id: w.id }));
    });
    map.append(chest);

    function stopCard(st, k) {
      const g = gameOf(st), lv = levelOf(st);
      const card = h('div', { class: 'modal-card stop-card', style: { '--c': g.color } },
        h('button', { class: 'icon-btn close-x', type: 'button', 'aria-label': 'Close', onclick: () => close() }, '✕'),
        h('span', { class: 'game-icon' }, g.icon),
        h('h2', { text: `Stop ${k + 1}: ${g.title}` }),
        h('p', { text: `Level ${st.level} · ${lv.name}` }),
        h('p', { class: 'eg', text: `Like this: ${lv.eg}` }),
        A.best(st) ? h('p', {}, 'Your best: ', MA.ui.stars(A.best(st))) : h('p', { text: `Get ${A.PASS} stars to clear this stop.` }),
        h('button', { class: 'btn btn-main btn-big', type: 'button', 'data-play': '1', onclick: () => { close(); playStop(st, from); } }, 'Play ▶'));
      const close = MA.ui.modal(card, { dismiss: true });
    }

    root.append(h('div', { class: 'world-screen', style: { '--c': w.color } },
      h('div', { class: 'world-top' },
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Back', onclick: () => MA.ui.go('adventure') }, '←'),
        h('h1', { text: `${w.icon} ${w.name}` }),
        h('span', { class: 'star-count', text: `${n} / ${w.stops.length}` })),
      map));
  });

  function reward(title, lines, extra, then) {
    const card = h('div', { class: 'modal-card reward' },
      MA.ui.mascot('wow', 80), h('h2', { text: title }),
      lines.map(t => h('p', { class: 'reward-line', text: t })),
      extra,
      h('button', { class: 'btn btn-main btn-big', type: 'button', 'data-ok': '1', onclick: () => { close(); if (then) then(); } }, 'Yay!'));
    const close = MA.ui.modal(card);
  }

  // ---------- Today's Adventure: five quick rounds and a gift ----------
  MA.ui.screen('daily', root => {
    if (!MA.store.current()) return MA.ui.go('profiles');
    const p = MA.store.current();
    const d = A.daily();
    const next = d.items.findIndex(it => !it.done);
    const path = h('div', { class: 'daily-path' });
    d.items.forEach((it, k) => {
      const g = gameOf(it);
      const state = it.done ? 'done' : k === next ? 'current' : 'later';
      const stone = h('div', { class: `stone ${state}`, style: { '--c': g.color }, 'data-item': String(k) },
        h('span', { class: 'stone-icon' }, g.icon),
        h('b', { text: g.title }),
        h('small', { text: `Level ${it.level} · ${g.levels[it.level - 1].name}` }),
        it.done ? MA.ui.stars(it.stars) : null,
        state === 'current' ? h('button', { class: 'btn btn-main', type: 'button', 'data-play': '1', onclick: () => MA.ui.go('game', {
          gameId: it.game, level: it.level, round: A.DAILY_ROUND, mode: 'daily', item: k,
          from: { screen: 'daily', label: 'Continue ▶' },
        }) }, 'Play ▶') : null);
      path.append(stone);
    });
    const allDone = next < 0;
    const gift = h('button', { class: 'stone gift' + (d.gift ? ' done' : allDone ? ' current' : ' later'), type: 'button', 'data-gift': '1' },
      h('span', { class: 'stone-icon' }, d.gift ? '✅' : '🎁'), h('b', { text: d.gift ? 'Gift opened' : 'Gift' }),
      h('small', { text: d.gift ? 'Come back tomorrow!' : `+${A.GEMS.daily} 💎` }));
    gift.addEventListener('click', () => {
      if (d.gift) return MA.ui.toast('Come back tomorrow for a new adventure!');
      if (!allDone) return MA.ui.toast('Finish all five rounds to open the gift!');
      A.claimDailyGift();
      MA.sound.play('win');
      MA.ui.confetti();
      reward("Today's gift!", [`+${A.GEMS.daily} 💎`, `🔥 ${p.streak.count}-day streak!`], null, () => MA.ui.go('daily'));
    });
    path.append(gift);

    root.append(h('div', { class: 'screen daily-screen' },
      MA.ui.topBar("Today's Adventure", () => MA.ui.go('adventure')),
      h('p', { class: 'lead daily-lead', text: allDone ? (d.gift ? 'Brilliant! You finished today.' : 'All done! Open your gift.') : 'Five quick rounds. Do them in order!' }),
      path));
  });

  // ---------- Collection: creatures and eggs ----------
  MA.ui.screen('collection', root => {
    if (!MA.store.current()) return MA.ui.go('profiles');
    const p = MA.store.current();
    const owned = c => p.creatures.includes(c.id);
    const eggsLeft = A.CREATURES.slice(A.WORLDS.length).filter(c => !owned(c)).length;
    const canHatch = p.gems >= A.GEMS.egg && eggsLeft > 0;
    const egg = h('div', { class: 'egg-panel' },
      h('span', { class: 'egg', 'aria-hidden': 'true' }, '🥚'),
      h('div', {}, h('h2', { text: 'Mystery egg' }),
        h('p', { text: eggsLeft ? `Costs ${A.GEMS.egg} 💎. You have ${p.gems} 💎.` : 'You have hatched every egg!' })),
      h('button', { class: 'btn btn-main', type: 'button', 'data-hatch': '1', disabled: !canHatch, onclick: () => {
        const c = A.hatch();
        if (!c) return;
        const shell = h('span', { class: 'egg big wobble', 'aria-hidden': 'true' }, '🥚');
        const card = h('div', { class: 'modal-card reward' }, shell, h('h2', { text: 'Hatching...' }));
        const close = MA.ui.modal(card);
        MA.sound.play('hop');
        setTimeout(() => {
          close();
          MA.sound.play('win');
          MA.ui.confetti();
          reward(`${c.name} hatched!`, [c.line], creatureCard(c, true), () => MA.ui.go('collection'));
        }, 1400 * MA.games.speed);
      } }, 'Hatch an egg'));
    const grid = h('div', { class: 'creature-grid' }, A.CREATURES.map((c, k) => {
      const w = A.WORLDS.find(x => x.creature === c.id);
      return creatureCard(c, owned(c), w ? `Treasure in ${w.name}` : 'Hatch it from an egg');
    }));
    root.append(h('div', { class: 'screen collection-screen' },
      MA.ui.topBar('Collection', () => MA.ui.go('hub')),
      h('p', { class: 'lead', text: `${p.creatures.length} of ${A.CREATURES.length} creatures found` }),
      egg, grid));
  });
})(window.MA);
