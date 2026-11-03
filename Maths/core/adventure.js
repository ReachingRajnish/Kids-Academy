// The Adventure: worlds of map stops, the daily playlist, today's goals, gems and creatures.
// A stop is one game at one level. It counts as cleared when that level's best is 2 stars or more,
// so a level cleared from the Play screen is cleared on the map too.
(function (MA) {
  'use strict';

  const { pick, shuffle } = MA.util;
  const PASS = 2;
  const DAILY_SIZE = 5;
  const DAILY_ROUND = 5;
  const GEMS = { stop: 2, chest: 10, daily: 5, goal: 3, egg: 10 };

  const s = (game, level) => ({ game, level });
  const WORLDS = [
    { id: 'meadow', name: 'Number Meadow', icon: '🌱', color: '#4caf50', creature: 'hopper',
      text: 'Numbers to 20', deco: ['🌳', '🌼', '🍄', '🌷', '🐝'],
      stops: [s('froggy-hop', 1), s('rocket-launch', 1), s('number-line', 1), s('quick-facts', 2), s('bubble-pairs', 1),
        s('compare', 1), s('equation-maker', 1), s('froggy-hop', 4), s('quick-facts', 5), s('number-line', 2)] },
    { id: 'island', name: 'Hundred Island', icon: '🏝️', color: '#0ea5e9', creature: 'shelly',
      text: 'Numbers to 100', deco: ['🌴', '🐚', '🦀', '⛵', '🐠'],
      stops: [s('rocket-launch', 2), s('hundred-puzzle', 1), s('number-line', 4), s('rocket-launch', 3), s('hundred-puzzle', 2),
        s('number-line', 5), s('compare', 2), s('hundred-puzzle', 3), s('equation-maker', 2), s('froggy-hop', 7)] },
    { id: 'volcano', name: 'Carry Volcano', icon: '🌋', color: '#ef6c2f', creature: 'blaze',
      text: 'Adding and taking away to 100', deco: ['🪨', '🔥', '🌵', '🦎', '💎'],
      stops: [s('quick-facts', 8), s('stacked-add', 1), s('stacked-add', 2), s('stacked-sub', 1), s('stacked-sub', 2),
        s('bubble-pairs', 3), s('stacked-add', 3), s('stacked-sub', 3), s('bubble-pairs', 4), s('compare', 4), s('froggy-hop', 10)] },
    { id: 'mountain', name: 'Thousand Peaks', icon: '🏔️', color: '#7c6cf2', creature: 'summit',
      text: 'Numbers to 1000', deco: ['🌲', '❄️', '🦌', '⛺', '🦅'],
      stops: [s('rocket-launch', 4), s('rocket-launch', 5), s('hundred-puzzle', 6), s('number-line', 6), s('compare', 3),
        s('rocket-launch', 6), s('stacked-add', 4), s('stacked-sub', 4), s('number-line', 7), s('rocket-launch', 7), s('compare', 6)] },
    { id: 'space', name: 'Star Station', icon: '🚀', color: '#3b3a8f', creature: 'bolt',
      text: 'Big sums and times tables', deco: ['⭐', '🪐', '🌙', '☄️', '🛸'],
      stops: [s('stacked-add', 5), s('stacked-sub', 5), s('quick-facts', 12), s('equation-maker', 6), s('stacked-add', 6),
        s('stacked-sub', 6), s('froggy-hop', 13), s('quick-facts', 14), s('number-line', 8), s('stacked-add', 7), s('stacked-sub', 7), s('froggy-hop', 15)] },
  ];

  // The first five come from treasure chests; the rest hatch from eggs bought with gems.
  const CREATURES = [
    { id: 'hopper', icon: '🐸', name: 'Hopper', color: '#4caf50', line: 'Hops along number lines' },
    { id: 'shelly', icon: '🐢', name: 'Shelly', color: '#0ea5e9', line: 'Slow and steady, counts in tens' },
    { id: 'blaze', icon: '🐲', name: 'Blaze', color: '#ef6c2f', line: 'Breathes fire when it carries a ten' },
    { id: 'summit', icon: '🦅', name: 'Summit', color: '#7c6cf2', line: 'Flies high over the hundreds' },
    { id: 'bolt', icon: '🤖', name: 'Bolt', color: '#3b3a8f', line: 'Knows every times table' },
    { id: 'foxy', icon: '🦊', name: 'Foxy', color: '#f97316', line: 'Spots number patterns' },
    { id: 'inky', icon: '🐙', name: 'Inky', color: '#a855f7', line: 'Counts in eights with eight arms' },
    { id: 'hoot', icon: '🦉', name: 'Hoot', color: '#92400e', line: 'Always checks the answer' },
    { id: 'buzz', icon: '🐝', name: 'Buzz', color: '#eab308', line: 'Finds pairs that make 10' },
    { id: 'twinkle', icon: '🦄', name: 'Twinkle', color: '#ec4899', line: 'Loves shapes and sides' },
    { id: 'waddle', icon: '🐧', name: 'Waddle', color: '#334155', line: 'Counts backwards in twos' },
    { id: 'bamboo', icon: '🐼', name: 'Bamboo', color: '#16a34a', line: 'Shares things out fairly' },
    { id: 'roary', icon: '🦁', name: 'Roary', color: '#d97706', line: 'The biggest number wins' },
    { id: 'splash', icon: '🐳', name: 'Splash', color: '#0284c7', line: 'Swims all the way to 1000' },
    { id: 'flutter', icon: '🦋', name: 'Flutter', color: '#6366f1', line: 'Turns 47 into 74 and back' },
    { id: 'dotty', icon: '🐞', name: 'Dotty', color: '#dc2626', line: 'Counts dots in a flash' },
    { id: 'rexy', icon: '🦖', name: 'Rexy', color: '#65a30d', line: 'Stomps on silly mistakes' },
    { id: 'echo', icon: '🐬', name: 'Echo', color: '#0891b2', line: 'Doubles everything it hears' },
    { id: 'spike', icon: '🦔', name: 'Spike', color: '#78716c', line: 'Sharp at taking away' },
    { id: 'gumtree', icon: '🐨', name: 'Gumtree', color: '#64748b', line: 'Gives big numbers a hug' },
  ];

  const player = () => MA.store.current();
  const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const yesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const best = stop => MA.store.game(stop.game).best[stop.level] || 0;
  const passed = stop => best(stop) >= PASS;
  const worldDone = w => w.stops.every(passed);

  // A world opens when the one before is finished, or when its first stop gets 3 stars (the jump-ahead challenge).
  function worldOpen(i) {
    return i === 0 || worldDone(WORLDS[i - 1]) || best(WORLDS[i].stops[0]) === 3;
  }

  // Stops open one after another. The first stop of a world is open whenever you can see the world.
  function stopOpen(w, i) {
    return i === 0 || passed(w.stops[i - 1]);
  }

  function currentStop(w) {
    const i = w.stops.findIndex(st => !passed(st));
    return i < 0 ? w.stops.length : i;
  }

  // The world to suggest: the first open world that is not finished yet.
  function currentWorld() {
    const i = WORLDS.findIndex((w, k) => worldOpen(k) && !worldDone(w));
    return i < 0 ? WORLDS.length - 1 : i;
  }

  // ---------- Today's goals ----------
  const GOALS = [
    { id: 'daily', text: "Finish today's adventure", need: DAILY_SIZE },
    { id: 'stops', text: 'Clear 2 map stops', need: 2 },
    { id: 'free', text: 'Play a game from Play', need: 1 },
  ];

  function day() {
    const p = player();
    if (!p.today || p.today.date !== today()) p.today = { date: today(), daily: 0, stops: 0, free: 0, claimed: {} };
    return p.today;
  }

  function claimGoal(id) {
    const t = day();
    const g = GOALS.find(x => x.id === id);
    if (t.claimed[id] || t[id] < g.need) return false;
    t.claimed[id] = true;
    player().gems += GEMS.goal;
    MA.store.save();
    return true;
  }

  // ---------- Daily playlist ----------
  // Five short rounds: the next new stops, the weakest skill so far, a quick-facts round and a surprise.
  function daily() {
    const p = player();
    if (p.daily && p.daily.date === today()) return p.daily;
    const items = [];
    const key = it => `${it.game}:${it.level}`;
    const add = it => { if (it && !items.some(x => key(x) === key(it)) && items.length < DAILY_SIZE) items.push({ game: it.game, level: it.level, done: false, stars: 0 }); };

    const wi = currentWorld();
    const w = WORLDS[wi];
    w.stops.slice(currentStop(w), currentStop(w) + 2).forEach(add);

    const cleared = WORLDS.flatMap(x => x.stops).filter(passed);
    const accuracy = st => {
      const list = p.skills[MA.games.get(st.game).levels[st.level - 1].id] || [];
      return list.length ? list.reduce((a, b) => a + b, 0) / list.length : 1;
    };
    if (cleared.length) add(cleared.slice().sort((a, b) => accuracy(a) - accuracy(b))[0]);

    const qf = MA.store.game('quick-facts');
    add({ game: 'quick-facts', level: Math.min(qf.unlocked, MA.games.get('quick-facts').levels.length) });

    for (const g of shuffle(MA.games.list())) {
      if (items.length >= DAILY_SIZE) break;
      add({ game: g.id, level: Math.min(MA.store.game(g.id).unlocked, g.levels.length) });
    }
    p.daily = { date: today(), items, gift: false };
    MA.store.save();
    return p.daily;
  }

  function claimDailyGift() {
    const p = player();
    const d = daily();
    if (d.gift || !d.items.every(it => it.done)) return false;
    d.gift = true;
    p.gems += GEMS.daily;
    p.streak.count = p.streak.last === yesterday() ? p.streak.count + 1 : p.streak.last === today() ? p.streak.count : 1;
    p.streak.last = today();
    MA.store.save();
    return true;
  }

  // ---------- Chests and creatures ----------
  function openChest(w) {
    const p = player();
    if (p.chests[w.id] || !worldDone(w)) return null;
    p.chests[w.id] = true;
    p.gems += GEMS.chest;
    if (!p.creatures.includes(w.creature)) p.creatures.push(w.creature);
    MA.store.save();
    return CREATURES.find(c => c.id === w.creature);
  }

  function hatch() {
    const p = player();
    const left = CREATURES.slice(WORLDS.length).filter(c => !p.creatures.includes(c.id));
    if (!left.length || p.gems < GEMS.egg) return null;
    const c = pick(left);
    p.gems -= GEMS.egg;
    p.creatures.push(c.id);
    MA.store.save();
    return c;
  }

  // ---------- Keeping score at the end of every round ----------
  MA.games.listeners.push(info => {
    const p = player();
    const t = day();
    const notes = [];
    const { params } = info;
    if (params.mode === 'daily') {
      const d = daily();
      const it = d.items[params.item];
      if (it && !it.done) {
        it.done = true;
        it.stars = info.stars;
        t.daily = d.items.filter(x => x.done).length;
        notes.push(t.daily === DAILY_SIZE ? "🎁 Today's adventure is done! Open your gift." : `Today's adventure: ${t.daily} of ${DAILY_SIZE} done`);
      }
    } else if (!params.mode) {
      t.free++;
    }
    // Clearing a map stop for the first time, from the map or from Play.
    if (info.round === MA.games.ROUND && info.before < PASS && info.stars >= PASS) {
      const onMap = WORLDS.some(w => w.stops.some(st => st.game === info.game.id && st.level === info.level));
      if (onMap) {
        t.stops++;
        p.gems += GEMS.stop;
        notes.push(`🗺️ Map stop cleared! +${GEMS.stop} 💎`);
      }
    }
    return notes;
  });

  MA.adventure = {
    WORLDS, CREATURES, GOALS, GEMS, PASS, DAILY_ROUND,
    best, passed, worldDone, worldOpen, stopOpen, currentStop, currentWorld,
    day, claimGoal, daily, claimDailyGift, openChest, hatch,
  };
})(window.MA);
