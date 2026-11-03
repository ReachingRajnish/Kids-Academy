// Screens, pop-ups, the keypad, the mascot and other pieces every game uses.
(function (MA) {
  'use strict';

  const { h } = MA.util;
  const screens = {};
  let cleanup = null;

  function app() {
    return document.getElementById('app');
  }

  // A screen is a function (root, params) that draws itself and may return a cleanup function.
  function screen(name, fn) {
    screens[name] = fn;
  }

  function go(name, params) {
    if (cleanup) { try { cleanup(); } catch (e) { /* keep going */ } }
    cleanup = null;
    closeAllModals();
    MA.voice.stop();
    const root = app();
    root.innerHTML = '';
    root.scrollTop = 0;
    window.scrollTo(0, 0);
    document.body.dataset.screen = name;
    const home = document.getElementById('kaHome');
    if (home) home.style.display = name === 'game' || name === 'sprint' ? 'none' : 'inline-flex';
    const result = screens[name](root, params || {});
    if (typeof result === 'function') cleanup = result;
  }

  function closeAllModals() {
    document.querySelectorAll('.modal-back, .confetti').forEach(m => m.remove());
  }

  // modal(card) shows a pop-up and returns a function that closes it.
  function modal(card, opts) {
    opts = opts || {};
    const back = h('div', { class: 'modal-back' + (opts.className ? ' ' + opts.className : '') }, card);
    const close = () => back.remove();
    if (opts.dismiss) back.addEventListener('click', e => { if (e.target === back) close(); });
    document.body.append(back);
    const focus = card.querySelector('[autofocus]');
    if (focus) setTimeout(() => focus.focus(), 30);
    return close;
  }

  function confirm(title, message, yes, no) {
    return new Promise(resolve => {
      const done = v => { close(); resolve(v); };
      const card = h('div', { class: 'modal-card' },
        h('h2', { text: title }),
        message ? h('p', { text: message }) : null,
        h('div', { class: 'modal-actions' },
          h('button', { class: 'btn btn-soft', type: 'button', onclick: () => done(false), text: no || 'No' }),
          h('button', { class: 'btn btn-main', type: 'button', onclick: () => done(true), text: yes || 'Yes' })));
      const close = modal(card);
    });
  }

  function toast(text, ms) {
    const t = h('div', { class: 'toast', role: 'status', text });
    document.body.append(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, ms || 1800);
  }

  // The number keypad. Also works with a real keyboard: digits, Backspace and Enter.
  function keypad(opts) {
    const maxLen = opts.maxLen || 4;
    let value = '';
    let disabled = false;
    const labels = { back: '⌫', ok: '✓' };
    const names = { back: 'Delete', ok: 'Check' };

    function press(k) {
      if (disabled) return;
      if (k === 'ok') {
        if (value !== '') opts.onSubmit(Number(value));
        return;
      }
      if (k === 'back') value = value.slice(0, -1);
      else if (value.length < maxLen) value = value === '0' ? k : value + k;
      MA.sound.play('tap');
      opts.onChange(value);
    }

    const pad = h('div', { class: 'keypad' },
      ['7', '8', '9', '4', '5', '6', '1', '2', '3', 'back', '0', 'ok'].map(k =>
        h('button', { class: `key key-${k}`, type: 'button', 'data-key': k, 'aria-label': names[k] || k,
          onclick: () => press(k) }, labels[k] || k)));

    function onKey(e) {
      if (e.target && e.target.tagName === 'INPUT') return;
      if (e.key >= '0' && e.key <= '9') press(e.key);
      else if (e.key === 'Backspace') press('back');
      else if (e.key === 'Enter') press('ok');
      else return;
      e.preventDefault();
    }
    document.addEventListener('keydown', onKey);

    return {
      el: pad,
      clear() { value = ''; opts.onChange(value); },
      disable(v) { disabled = v; pad.classList.toggle('disabled', v); },
      destroy() { document.removeEventListener('keydown', onKey); },
    };
  }

  // An answer box with the keypad. Typing fills the box and ✓ sends the number to api.answer.
  // opts: { before, after } words either side of the box (like '₹' or 'cm'), maxLen, delay.
  function padAnswer(api, opts) {
    opts = opts || {};
    const box = h('span', { class: 'pa-box', 'aria-label': 'Your answer' });
    const pad = keypad({
      maxLen: opts.maxLen || 4,
      onChange: v => { box.textContent = v; box.classList.remove('wrong'); },
      onSubmit: v => {
        const ok = api.answer(v, { delay: opts.delay || 1000 });
        if (ok === null) return;
        if (ok) {
          box.classList.add('right');
          pad.disable(true);
        } else {
          pad.clear();
          box.classList.add('wrong');
          if (api.busy()) pad.disable(true);
        }
      },
    });
    const line = h('div', { class: 'pa-line' },
      opts.before ? h('span', { text: opts.before }) : null, box, opts.after ? h('span', { text: opts.after }) : null);
    return { line, pad: pad.el, destroy: pad.destroy };
  }

  // Pip, our mascot: a round orange friend with a star on top.
  function mascot(mood, size) {
    const mouth = mood === 'wow'
      ? '<ellipse cx="50" cy="66" rx="8" ry="9" fill="#7a2d12"/>'
      : mood === 'think'
        ? '<path d="M42 67 Q50 63 58 67" stroke="#7a2d12" stroke-width="4" fill="none" stroke-linecap="round"/>'
        : '<path d="M38 62 Q50 76 62 62" stroke="#7a2d12" stroke-width="4.5" fill="none" stroke-linecap="round"/>';
    return h('span', { class: 'mascot', 'aria-hidden': 'true', style: { width: (size || 90) + 'px' }, html:
      `<svg viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 22 L50 8" stroke="#ff8a3d" stroke-width="4" stroke-linecap="round"/>
        <path d="M50 0 l3 6 6.5 1 -4.7 4.6 1.1 6.5 -5.9 -3.1 -5.9 3.1 1.1 -6.5 -4.7 -4.6 6.5 -1z" fill="#ffd23f"/>
        <ellipse cx="50" cy="104" rx="30" ry="5" fill="rgba(0,0,0,.12)"/>
        <path d="M14 62 C14 34 30 20 50 20 C70 20 86 34 86 62 C86 88 70 100 50 100 C30 100 14 88 14 62 Z" fill="#ff8a3d"/>
        <path d="M24 70 C28 86 40 94 50 94 C60 94 72 86 76 70" fill="#ffb27a" opacity=".55"/>
        <circle cx="37" cy="48" r="11" fill="#fff"/><circle cx="63" cy="48" r="11" fill="#fff"/>
        <circle cx="39" cy="50" r="5.5" fill="#222"/><circle cx="61" cy="50" r="5.5" fill="#222"/>
        <circle cx="41" cy="47.5" r="1.8" fill="#fff"/><circle cx="63" cy="47.5" r="1.8" fill="#fff"/>
        <circle cx="26" cy="62" r="5" fill="#ff6b6b" opacity=".45"/><circle cx="74" cy="62" r="5" fill="#ff6b6b" opacity=".45"/>
        ${mouth}
      </svg>` });
  }

  function stars(n, of) {
    of = of || 3;
    const row = h('span', { class: 'stars', 'aria-label': `${n} of ${of} stars` });
    for (let i = 0; i < of; i++) row.append(h('span', { class: i < n ? 'star on' : 'star', text: '★' }));
    return row;
  }

  // Ten-frames that show a small sum or take-away, for "Show me".
  function dots(p) {
    if (p.blank !== 'c' || (p.op !== '+' && p.op !== '-') || Math.max(p.a, p.c) > 20) return null;
    const total = p.op === '+' ? p.c : p.a;
    const frames = h('div', { class: 'frames' });
    let frame;
    for (let i = 0; i < Math.ceil(total / 10) * 10; i++) {
      if (i % 10 === 0) { frame = h('div', { class: 'frame' }); frames.append(frame); }
      let cls = 'dot';
      if (i >= total) cls += ' empty';
      else if (p.op === '+') cls += i < p.a ? ' a' : ' b';
      else cls += i >= p.a - p.b ? ' gone' : ' a';
      frame.append(h('span', { class: cls }));
    }
    return frames;
  }

  // A row of answer buttons. onPick(value, button) returns true (right), false (wrong) or null (ignored).
  // Keys 1, 2, 3... pick a button on a laptop.
  function choices(values, onPick, opts) {
    opts = opts || {};
    const row = h('div', { class: 'choices' + (opts.className ? ' ' + opts.className : '') });
    const btns = values.map((v, i) => {
      const b = h('button', { class: 'choice', type: 'button', 'data-value': String(v),
        'aria-label': opts.aria ? opts.aria(v) : String(v) }, opts.label ? opts.label(v) : String(v));
      b.addEventListener('click', () => choose(i));
      row.append(b);
      return b;
    });
    function choose(i) {
      const b = btns[i];
      if (!b || b.disabled) return;
      const ok = onPick(values[i], b);
      if (ok === true) b.classList.add('yes');
      else if (ok === false) { b.disabled = true; b.classList.add('no'); }
    }
    function onKey(e) {
      const n = Number(e.key);
      if (n >= 1 && n <= btns.length) choose(n - 1);
    }
    document.addEventListener('keydown', onKey);
    return { el: row, buttons: btns, destroy: () => document.removeEventListener('keydown', onKey) };
  }

  // Place value blocks: hundreds flats, tens rods and ones cubes.
  function blocks(hundreds, tens, ones) {
    const wrap = h('div', { class: 'blocks', 'aria-label': `${hundreds} hundreds, ${tens} tens, ${ones} ones` });
    [['flat', hundreds], ['rod', tens], ['cube', ones]].forEach(([kind, n]) => {
      if (!n) return;
      const g = h('div', { class: 'bgroup g-' + kind });
      for (let i = 0; i < n; i++) g.append(h('span', { class: 'b-' + kind }));
      wrap.append(g);
    });
    return wrap;
  }

  // An array: rows of things, for times tables. opts: { icon, split (a row number to draw a line under), size }.
  function array(rows, cols, opts) {
    opts = opts || {};
    const grid = h('div', { class: 'arr' + (opts.icon ? ' icons' : ''), style: { '--cols': cols, '--size': opts.size || '' },
      'aria-label': `${rows} rows of ${cols}` });
    for (let r = 0; r < rows; r++) {
      const row = h('div', { class: 'arr-row' + (opts.split && r === opts.split ? ' split' : '') });
      for (let c = 0; c < cols; c++) row.append(h('span', { class: 'arr-dot', text: opts.icon || '' }));
      grid.append(row);
    }
    return grid;
  }

  function confetti() {
    const box = h('div', { class: 'confetti', 'aria-hidden': 'true' });
    const colors = ['#ff8a3d', '#ffd23f', '#4fc3f7', '#66bb6a', '#ab47bc', '#ef5350'];
    for (let i = 0; i < 60; i++) {
      box.append(h('i', { style: {
        left: Math.random() * 100 + '%',
        background: colors[i % colors.length],
        animationDelay: Math.random() * 0.6 + 's',
        animationDuration: 1.6 + Math.random() * 1.2 + 's',
        transform: `rotate(${Math.random() * 360}deg)`,
      } }));
    }
    document.body.append(box);
    setTimeout(() => box.remove(), 3200);
  }

  MA.ui = { screen, go, modal, confirm, toast, keypad, padAnswer, mascot, stars, dots, confetti, choices, blocks, array };
})(window.MA);
