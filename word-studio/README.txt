KIDS ACADEMY - WORD SCRAMBLE & ANAGRAM STUDIO (v2)
==================================================

Why v2 Fixes the 3-Word Repeat Issue When Double-Clicking `word-games.html`:
- Browsers block `fetch('./data/*.json')` when you double-click an HTML file directly from Windows Explorer (`file://` protocol) due to CORS security rules, which previously forced the app into the 3-word demo fallback (`PLANET`, `DOLPHIN`, `BRIDGE`).
- v2 keeps all 4 raw `.json` files in `./data/*.json` AND includes `./data/word-banks-bundle.js` loaded via `<script src="./data/word-banks-bundle.js">`, which browsers NEVER block on `file://`!
- Whether you double-click `word-games.html` directly OR host it on GitHub Pages / a local server, all 5,523 puzzles load immediately and never repeat back-to-back.
