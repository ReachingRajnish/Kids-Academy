// Themes: the whole look can be switched from the main menu. Each theme is a stylesheet in css/themes/ scoped to
// <html data-theme="...">; Classic uses the base styles only. The choice is kept on this device.
(function (MA) {
  'use strict';

  const { h } = MA.util;
  const KEY = 'maths_adventure_theme';
  const THEMES = [
    { id: 'todo', name: 'Todo', text: 'Flat and bright', colors: ['#18a7c9', '#7cc22c', '#f5a623', '#262a3f'] },
    { id: 'classic', name: 'Classic', text: 'Light and simple', colors: ['#fff8ec', '#22a95b', '#ff8a3d', '#3b3355'] },
    { id: 'comic', name: 'Comic', text: 'Bold outlines', colors: ['#2a6ff0', '#ffc61a', '#1fb257', '#1d1842'] },
    { id: 'candy', name: 'Candy', text: 'Soft pastels', colors: ['#ffd9ec', '#dcccff', '#ff6fb1', '#9b5cff'] },
    { id: 'night', name: 'Night', text: 'Dark and glowing', colors: ['#141a3c', '#232b5e', '#ffb347', '#5eead4'] },
  ];
  const DEFAULT = 'todo';

  function get() {
    let id = null;
    try { id = localStorage.getItem(KEY); } catch (e) { /* storage may be blocked */ }
    return THEMES.some(t => t.id === id) ? id : DEFAULT;
  }

  function apply(id) {
    document.documentElement.dataset.theme = id;
  }

  function set(id) {
    apply(id);
    try { localStorage.setItem(KEY, id); } catch (e) { /* the theme still applies for this visit */ }
  }

  // The theme picker: tap a theme to switch at once and see it behind the pop-up.
  function picker() {
    const grid = h('div', { class: 'theme-grid' });
    function paint() {
      const cur = get();
      [...grid.children].forEach(b => b.setAttribute('aria-pressed', String(b.dataset.themeId === cur)));
    }
    THEMES.forEach(t => grid.append(h('button', { class: 'theme-card', type: 'button', 'data-theme-id': t.id,
      onclick: () => { set(t.id); MA.sound.play('tap'); paint(); } },
      h('span', { class: 'theme-swatch' }, t.colors.map(c => h('i', { style: { background: c } }))),
      h('b', { text: t.name }), h('small', { text: t.text }))));
    const card = h('div', { class: 'modal-card theme-picker' },
      h('button', { class: 'icon-btn close-x', type: 'button', 'aria-label': 'Close', onclick: () => close() }, '✕'),
      h('h2', { text: '🎨 Pick a theme' }), grid,
      h('div', { class: 'modal-actions' }, h('button', { class: 'btn btn-main', type: 'button', 'data-done': '1', onclick: () => close() }, 'Done')));
    paint();
    const close = MA.ui.modal(card, { dismiss: true });
  }

  apply(get());
  MA.themes = { THEMES, get, set, picker };
})(window.MA);
