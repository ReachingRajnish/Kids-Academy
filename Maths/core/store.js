// Players and their progress, saved in this browser.
// Saving can fail (private window, blocked storage); the app keeps working, it just forgets on reload.
(function (MA) {
  'use strict';

  const KEY = 'maths_adventure';
  const VERSION = 1;
  const SKILL_MEMORY = 20; // last N answers kept per skill

  let data = load();

  function blank() {
    return { version: VERSION, current: null, profiles: [] };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d && Array.isArray(d.profiles)) return migrate(d);
      }
    } catch (e) { /* fall through to a fresh start */ }
    return blank();
  }

  // Later versions upgrade old saves here instead of wiping them.
  function migrate(d) {
    d.version = VERSION;
    d.profiles.forEach(p => {
      p.settings = Object.assign({ sound: true, voice: false }, p.settings);
      p.games = p.games || {};
      p.skills = p.skills || {};
      p.facts = p.facts || {};
      Object.values(p.facts).forEach(skill => Object.entries(skill).forEach(([k, f]) => { f.key = f.key || k; }));
      p.stars = p.stars || 0;
      p.gems = p.gems || 0;
      p.creatures = p.creatures || [];
      p.chests = p.chests || {};
      p.log = p.log || {};
      p.streak = p.streak || { last: null, count: 0 };
    });
    return d;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* storage blocked */ }
  }

  function current() {
    return data.profiles.find(p => p.id === data.current) || null;
  }

  MA.store = {
    save,
    current,
    profiles: () => data.profiles,

    select(id) {
      data.current = id;
      save();
    },

    add(name, avatar, color) {
      const p = migrate({ profiles: [{
        id: 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1e4),
        name, avatar, color, created: Date.now(),
      }] }).profiles[0];
      data.profiles.push(p);
      data.current = p.id;
      save();
      return p;
    },

    remove(id) {
      data.profiles = data.profiles.filter(p => p.id !== id);
      if (data.current === id) data.current = null;
      save();
    },

    setting(name, value) {
      const p = current();
      if (!p) return undefined;
      if (value !== undefined) {
        p.settings[name] = value;
        save();
      }
      return p.settings[name];
    },

    // Progress in one game: highest open level, best stars per level, last level played.
    game(id) {
      const p = current();
      return p.games[id] || (p.games[id] = { unlocked: 1, best: {}, plays: 0, last: 1 });
    },

    recordSkill(skill, correct) {
      const p = current();
      const list = p.skills[skill] || (p.skills[skill] = []);
      list.push(correct ? 1 : 0);
      if (list.length > SKILL_MEMORY) list.splice(0, list.length - SKILL_MEMORY);
    },

    // Missed facts come back later. Each miss adds weight; each first-time right answer takes some away.
    recordFact(skill, problem, firstTry) {
      if (!problem.key) return;
      const p = current();
      const f = p.facts[skill] && p.facts[skill][problem.key];
      if (firstTry) {
        if (f && --f.m <= 0) delete p.facts[skill][problem.key];
      } else {
        const facts = p.facts[skill] || (p.facts[skill] = {});
        facts[problem.key] = { m: Math.min((f ? f.m : 0) + 2, 6), p: problem.params, key: problem.key, memo: problem.memo };
      }
    },

    // Rounds and seconds played each day, for the grown-ups page. Only the last 60 days are kept.
    logRound(secs) {
      const p = current();
      const d = new Date();
      const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const log = p.log || (p.log = {});
      const e = log[day] || (log[day] = { rounds: 0, secs: 0 });
      e.rounds++;
      e.secs += Math.min(secs, 1800);
      Object.keys(log).sort().slice(0, -60).forEach(k => delete log[k]);
    },

    missedFacts(skill) {
      const p = current();
      return Object.values((p && p.facts[skill]) || {});
    },
  };
})(window.MA);
