// Boss challenges: at the end of each Adventure world, a boss round mixes problems from that world's stops.
// Every right answer knocks a heart off the boss. Beating the boss opens the world's treasure chest.
// The boss borrows each problem from the real game, so drawing, checking and "Show me" all come from that game.
(function (MA) {
  'use strict';

  const { h, pick } = MA.util;
  const BOSSES = {
    meadow: ['🐛', 'Captain Caterpillar'], island: ['🦈', 'Sharky'], market: ['🦹', 'The Price Pirate'], volcano: ['🐉', 'Magma Dragon'],
    garden: ['🕷️', 'The Shape Spider'], mountain: ['🦣', 'Mammoth'], jungle: ['🦍', 'King Kong-a-Times'], castle: ['🧙', 'The Riddle Wizard'],
    space: ['👾', 'Zorg the Alien'],
  };
  const worlds = () => MA.adventure.WORLDS;
  const inner = p => MA.games.get(p.bossGame);

  function wrap(world, g, lv, q) {
    return Object.assign(q, { boss: world, bossGame: g, lv, key: `${g}|${q.key}`, params: [world, g, lv, q.params] });
  }

  function make(level) {
    const w = worlds()[level - 1];
    const stop = pick(w.stops);
    const g = MA.games.get(stop.game);
    return wrap(w.id, stop.game, stop.level, g.make(stop.level, { review: [], avoid: [] }));
  }

  function fromParams(pr) {
    const [world, gid, lv, params] = pr;
    const g = MA.games.get(gid);
    if (!g.fromParams) return wrap(world, gid, lv, MA.math.make(...params)); // the number-fact games
    return wrap(world, gid, lv, g.fromParams(params, lv));
  }

  function render(p, stage, api) {
    const [face, name] = BOSSES[p.boss] || ['👾', 'The Boss'];
    const hits = api.results().filter(r => r !== 'missed').length;
    const hearts = MA.games.ROUND;
    const bar = h('div', { class: 'boss-bar' }, h('span', { class: 'boss-face', text: face }),
      h('div', {}, h('b', { text: name }),
        h('div', { class: 'boss-hearts', 'aria-label': `${hearts - hits} hearts left` },
          Array.from({ length: hearts }, (_, k) => h('i', { class: k < hearts - hits ? 'on' : '', text: '❤' })))));
    // The bar sits in the game's top bar, so the borrowed game keeps its whole screen.
    const slot = document.querySelector('.game-bar .game-name') || stage;
    slot.querySelectorAll('.boss-bar').forEach(b => b.remove());
    slot.append(bar);
    p.level = p.lv; // the borrowed game draws itself for its own level
    const g = inner(p);
    const cleanup = g.render(p, stage, api);
    return cleanup;
  }

  MA.games.register({
    id: 'boss',
    title: 'Boss Challenge',
    icon: '👾',
    color: '#be123c',
    shelf: 'Boss',
    hidden: true,
    steady: true, // the level is the world, so no easier warm-up level
    blurb: 'Beat the boss to open the treasure',
    intro: 'Every right answer knocks off a heart. Beat the boss!',
    get levels() { return worlds().map(w => ({ id: 'boss-' + w.id, name: `${w.name} boss`, eg: 'A mix of the whole world' })); },
    make,
    fromParams,
    check: (p, v) => { const g = inner(p); return g.check ? g.check(p, v) : v === p.answer; },
    explain: p => { const g = inner(p); return g.explain ? g.explain(p) : MA.math.explain(p); },
    visual: p => { const g = inner(p); return g.visual ? g.visual(p) : MA.ui.dots(p); },
    say: p => inner(p).say(p),
    render,
  });

  MA.bosses = BOSSES;
})(window.MA);
