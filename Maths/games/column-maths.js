// Stacked Addition and Stacked Subtraction: column maths, one column at a time.
// Adding shows the carried 1 moving to the next column. Taking away makes the kid tap the next digit
// to borrow, and catches the classic mistake of taking the small digit from the big one.
(function (MA) {
  'use strict';

  const { h, rand } = MA.util;
  const M = MA.math;
  const NAMES = ['ones', 'tens', 'hundreds', 'thousands'];
  const ONE = ['one', 'ten', 'hundred', 'thousand'];
  const cap = s => s[0].toUpperCase() + s.slice(1);
  const len = n => String(n).length;
  const digit = (n, c) => Math.floor(n / Math.pow(10, c)) % 10;
  const sum = list => list.reduce((a, b) => a + b, 0);

  // ---------- the column grid, shared by both games ----------
  function grid(rows, op, width, opts) {
    const el = h('div', { class: 'cm-grid', style: { '--w': width } });
    const cells = { head: [], carry: [], rows: rows.map(() => []), ans: [] };
    const put = (cell, row, c) => {
      cell.style.gridRow = row;
      cell.style.gridColumn = 2 + (width - 1 - c);
      cell.dataset.col = c;
      el.append(cell);
      return cell;
    };
    for (let c = 0; c < width; c++) {
      cells.head[c] = put(h('span', { class: `cm-head h${c}`, text: ['O', 'T', 'H', 'Th'][c] }), 1, c);
      cells.carry[c] = put(h('span', { class: 'cm-carry' }), 2, c);
      cells.ans[c] = put(h('span', { class: 'cm-ans' }), rows.length + 4, c);
    }
    rows.forEach((n, r) => {
      for (let c = 0; c < len(n); c++) {
        const d = digit(n, c);
        const cell = r === 0 && opts.borrow
          ? h('button', { class: 'cm-digit cm-top', type: 'button', 'aria-label': `${d} ${NAMES[c]}`, onclick: () => opts.borrow(c) },
            h('span', { class: 'was' }), h('span', { class: 'now', text: String(d) }))
          : h('span', { class: 'cm-digit', text: String(d) });
        cells.rows[r][c] = put(cell, 3 + r, c);
      }
    });
    const opEl = h('span', { class: 'cm-op', text: op });
    opEl.style.gridRow = 2 + rows.length;
    opEl.style.gridColumn = 1;
    el.append(opEl);
    const line = h('span', { class: 'cm-line' });
    line.style.gridRow = 3 + rows.length;
    line.style.gridColumn = `1 / ${width + 2}`;
    el.append(line);

    return {
      el, cells,
      highlight(c) {
        el.querySelectorAll('[data-col]').forEach(x => x.classList.toggle('cur', Number(x.dataset.col) === c));
      },
      write(c, d) {
        const cell = cells.ans[c];
        cell.textContent = String(d);
        cell.classList.remove('pop');
        void cell.offsetWidth;
        cell.classList.add('pop');
      },
    };
  }

  function stepsPanel(api, onSubmit) {
    const prompt = h('p', { class: 'cm-prompt', 'aria-live': 'polite' });
    const box = h('span', { class: 'cm-box' });
    const pad = MA.ui.keypad({
      maxLen: 3,
      onChange: v => { box.textContent = v; box.classList.remove('wrong'); },
      onSubmit: v => onSubmit(v),
    });
    return {
      prompt, box, pad,
      ask(text) {
        prompt.innerHTML = '';
        prompt.append(h('span', { text }), box);
        pad.clear();
        pad.disable(false);
        MA.voice.auto(text);
      },
      say(text) {
        prompt.innerHTML = '';
        prompt.append(h('span', { text }));
        MA.voice.auto(text);
      },
      miss(hint) {
        api.wrong(hint);
        pad.clear();
        box.classList.add('wrong');
        if (api.busy()) pad.disable(true);
      },
    };
  }

  // ---------- Stacked Addition ----------
  function carries(nums) {
    const out = [];
    let carry = 0;
    for (let c = 0; c < Math.max(...nums.map(len)); c++) {
      const s = carry + sum(nums.map(n => digit(n, c)));
      out.push(s >= 10);
      carry = Math.floor(s / 10);
    }
    return out;
  }

  const ADD_LEVELS = [
    { id: 'cadd1', name: '2-digit + 1-digit', eg: '34 + 5',
      gen: () => [rand(10, 89), rand(1, 9)], ok: (n, cs) => !cs.some(Boolean) },
    { id: 'cadd2', name: '2-digit + 2-digit', eg: '23 + 45',
      gen: () => [rand(10, 89), rand(10, 89)], ok: (n, cs) => !cs.some(Boolean) && sum(n) < 100 },
    { id: 'cadd3', name: 'Carrying a ten', eg: '38 + 47',
      gen: () => [rand(10, 89), rand(10, 89)], ok: (n, cs) => cs[0] && sum(n) < 100 },
    { id: 'cadd4', name: '3-digit, no carrying', eg: '324 + 152',
      gen: () => [rand(100, 899), rand(100, 899)], ok: (n, cs) => !cs.some(Boolean) && sum(n) < 1000 },
    { id: 'cadd5', name: '3-digit, one carry', eg: '357 + 128',
      gen: () => [rand(100, 899), rand(100, 899)], ok: (n, cs) => cs.filter(Boolean).length === 1 && sum(n) < 1000 },
    { id: 'cadd6', name: '3-digit, two carries', eg: '478 + 365',
      gen: () => [rand(100, 799), rand(100, 799)], ok: (n, cs) => cs[0] && cs[1] && sum(n) < 1000 },
    { id: 'cadd7', name: 'Adding three numbers', eg: '24 + 37 + 18',
      gen: () => [rand(10, 39), rand(10, 39), rand(10, 29)], ok: (n, cs) => cs[0] && sum(n) < 100 },
  ];

  function addProblem(nums) {
    const total = sum(nums);
    return { nums, answer: total, params: nums, key: nums.join('+'), memo: `${nums.join(' + ')} = ${total}` };
  }

  function makeAdd(level) {
    const lv = ADD_LEVELS[level - 1];
    for (let i = 0; i < 300; i++) {
      const nums = lv.gen();
      if (lv.ok(nums, carries(nums))) return addProblem(nums);
    }
    return addProblem([23, 45]);
  }

  function explainAdd(p) {
    const steps = [];
    let carry = 0;
    const cols = Math.max(...p.nums.map(len));
    for (let c = 0; c < cols; c++) {
      const ds = p.nums.filter(n => len(n) > c).map(n => digit(n, c));
      const parts = carry ? [carry, ...ds] : ds;
      const s = sum(parts);
      const last = c === cols - 1;
      let line;
      if (parts.length === 1) line = `${cap(NAMES[c])}: nothing to add, so bring down the ${s}.`;
      else if (s >= 10 && !last) line = `${cap(NAMES[c])}: ${parts.join(' + ')} = ${s}. Write ${s % 10} and carry ${Math.floor(s / 10)}.`;
      else line = `${cap(NAMES[c])}: ${parts.join(' + ')} = ${s}. Write ${s}.`;
      steps.push(line);
      carry = last ? 0 : Math.floor(s / 10);
    }
    steps.push(`So ${p.nums.join(' + ')} = ${p.answer}`);
    return { hint: 'Start with the ones, on the right.', steps };
  }

  function stepHint(parts, carry) {
    if (parts.length === 2 && !carry) return M.explain(M.make(parts[0], '+', parts[1])).hint;
    if (carry) return `Add the carried ${carry} first: ${carry} + ${parts[1]} = ${carry + parts[1]}. Then add the rest.`;
    return `Add two first: ${parts[0]} + ${parts[1]} = ${parts[0] + parts[1]}. Then add ${parts.slice(2).join(' + ')}.`;
  }

  function renderAdd(p, stage, api) {
    const nums = p.nums;
    const cols = Math.max(...nums.map(len));
    const width = Math.max(cols, len(p.answer));
    const g = grid(nums, '+', width, {});
    let c = 0, carry = 0;
    const panel = stepsPanel(api, submit);
    const digitsAt = col => nums.filter(n => len(n) > col).map(n => digit(n, col));

    function step() {
      g.highlight(c);
      const ds = digitsAt(c);
      if (ds.length === 1 && !carry) {
        panel.say(`Nothing to add in the ${NAMES[c]}. Bring down the ${ds[0]}.`);
        panel.pad.disable(true);
        g.write(c, ds[0]);
        c++;
        return api.after(1100, () => (c >= cols ? api.right() : step()));
      }
      const parts = carry ? [carry, ...ds] : ds;
      panel.ask(`${cap(NAMES[c])}: ${parts.join(' + ')} = `);
    }

    function submit(v) {
      if (api.busy()) return;
      const ds = digitsAt(c);
      const parts = carry ? [carry, ...ds] : ds;
      const s = sum(parts);
      if (v !== s) {
        let hint;
        if (carry && v === s - carry) hint = `Don't forget the ${carry} you carried!`;
        else if (s >= 10 && v === s % 10) hint = `Type the whole total. ${parts.join(' + ')} is more than 9.`;
        else hint = stepHint(parts, carry);
        return panel.miss(hint);
      }
      api.clearTip();
      MA.sound.play('tap');
      const last = c === cols - 1;
      if (last) {
        g.write(c, s % 10);
        if (s >= 10) g.write(c + 1, Math.floor(s / 10));
        carry = 0;
      } else {
        g.write(c, s % 10);
        carry = Math.floor(s / 10);
        if (carry) {
          const cell = g.cells.carry[c + 1];
          cell.textContent = String(carry);
          cell.classList.add('fly');
        }
      }
      c++;
      panel.pad.disable(true);
      if (c >= cols) {
        g.highlight(-1);
        panel.say(`${nums.join(' + ')} = ${p.answer}`);
        return api.right({ delay: 1500 });
      }
      api.after(450, step);
    }

    stage.append(h('div', { class: 'cm' }, h('div', { class: 'cm-paper' }, g.el, panel.prompt), panel.pad.el));
    step();
    return () => panel.pad.destroy();
  }

  MA.games.register({
    id: 'stacked-add',
    title: 'Stacked Addition',
    icon: '➕',
    color: '#ef5b8b',
    shelf: 'Column maths',
    blurb: 'Add in columns and carry',
    intro: 'Add one column at a time, starting with the ones.',
    levels: ADD_LEVELS,
    make: makeAdd,
    fromParams: addProblem,
    say: p => p.nums.join(' + '),
    explain: explainAdd,
    render: renderAdd,
  });

  // ---------- Stacked Subtraction ----------
  function borrows(a, b) {
    const out = [];
    let borrow = 0;
    for (let c = 0; c < len(a); c++) {
      const top = digit(a, c) - borrow;
      const need = top < digit(b, c);
      out.push(need);
      borrow = need ? 1 : 0;
    }
    return out;
  }

  const SUB_LEVELS = [
    { id: 'csub1', name: '2-digit − 1-digit', eg: '48 − 5',
      gen: () => [rand(10, 99), rand(1, 9)], ok: (a, b, bs) => !bs.some(Boolean) && a - b >= 10 },
    { id: 'csub2', name: '2-digit − 2-digit', eg: '68 − 25',
      gen: () => [rand(20, 99), rand(10, 89)], ok: (a, b, bs) => !bs.some(Boolean) && a - b >= 10 },
    { id: 'csub3', name: 'Borrowing a ten', eg: '72 − 38',
      gen: () => [rand(30, 99), rand(10, 89)], ok: (a, b, bs) => bs[0] && a - b >= 10 },
    { id: 'csub4', name: '3-digit, no borrowing', eg: '586 − 243',
      gen: () => [rand(200, 999), rand(100, 899)], ok: (a, b, bs) => !bs.some(Boolean) && a - b >= 100 },
    { id: 'csub5', name: '3-digit, one borrow', eg: '543 − 128',
      gen: () => [rand(200, 999), rand(100, 899)], ok: (a, b, bs) => bs.filter(Boolean).length === 1 && a - b >= 100 },
    { id: 'csub6', name: '3-digit, two borrows', eg: '632 − 275',
      gen: () => [rand(300, 999), rand(100, 899)], ok: (a, b, bs) => bs[0] && bs[1] && a - b >= 100 },
    { id: 'csub7', name: 'Borrowing across a zero', eg: '402 − 158',
      gen: () => { const a = rand(2, 9) * 100 + rand(0, 8); return [a, rand(100, a - 100)]; },
      ok: (a, b, bs) => digit(a, 1) === 0 && bs[0] && a - b >= 100 },
  ];

  function subProblem(nums) {
    const [a, b] = nums;
    return { nums, a, b, answer: a - b, params: nums, key: `${a}-${b}`, memo: `${a} − ${b} = ${a - b}` };
  }

  function makeSub(level) {
    const lv = SUB_LEVELS[level - 1];
    for (let i = 0; i < 500; i++) {
      const [a, b] = lv.gen();
      if (b > 0 && b < a && lv.ok(a, b, borrows(a, b))) return subProblem([a, b]);
    }
    return subProblem([72, 38]);
  }

  function explainSub(p) {
    const top = [];
    for (let c = 0; c < len(p.a); c++) top.push(digit(p.a, c));
    const steps = [];
    for (let c = 0; c < len(p.a); c++) {
      const bot = len(p.b) > c ? digit(p.b, c) : 0;
      if (top[c] < bot) {
        let k = c + 1;
        while (top[k] === 0) k++;
        if (k > c + 1) steps.push(`There are no ${NAMES[c + 1]}, so swap 1 ${ONE[k]} for 10 ${NAMES[k - 1]} first.`);
        for (let j = k; j > c; j--) { top[j]--; top[j - 1] += 10; }
        steps.push(`${cap(NAMES[c])}: ${top[c] - 10} is less than ${bot}, so borrow 1 ${ONE[c + 1]}. ${top[c]} − ${bot} = ${top[c] - bot}.`);
      } else {
        steps.push(`${cap(NAMES[c])}: ${top[c]} − ${bot} = ${top[c] - bot}.`);
      }
    }
    steps.push(`So ${p.a} − ${p.b} = ${p.answer}`);
    return { hint: 'Start with the ones, on the right.', steps };
  }

  function renderSub(p, stage, api) {
    const { a, b } = p;
    const cols = len(a);
    const top = [];
    for (let i = 0; i < cols; i++) top.push(digit(a, i));
    let c = 0;
    let phase = 'type';
    const g = grid([a, b], '−', cols, { borrow: tap });
    const panel = stepsPanel(api, submit);
    const bottom = col => (len(b) > col ? digit(b, col) : 0);

    function showTop(col) {
      const cell = g.cells.rows[0][col];
      const was = cell.querySelector('.was');
      was.textContent = (was.textContent ? was.textContent + ' ' : '') + cell.querySelector('.now').textContent;
      cell.querySelector('.now').textContent = String(top[col]);
      cell.classList.add('changed');
    }

    function step() {
      g.highlight(c);
      const bot = bottom(c);
      if (top[c] < bot) {
        phase = 'borrow';
        panel.say(`${cap(NAMES[c])}: ${top[c]} is less than ${bot}. Borrow 1 ${ONE[c + 1]}: tap the ${NAMES[c + 1]} digit.`);
        panel.pad.disable(false);
        return;
      }
      phase = 'type';
      if (len(b) <= c) {
        panel.say(`Nothing to take away in the ${NAMES[c]}. Bring down the ${top[c]}.`);
        panel.pad.disable(true);
        if (top[c] || c < cols - 1) g.write(c, top[c]);
        c++;
        return api.after(1100, () => (c >= cols ? done() : step()));
      }
      panel.ask(`${cap(NAMES[c])}: ${top[c]} − ${bot} = `);
    }

    function tap(k) {
      if (api.busy() || c >= cols) return;
      if (phase !== 'borrow') return api.tip('No need to borrow here. Take away and type the answer.');
      if (k <= c) return api.tip(`Borrow from the next column: the ${NAMES[c + 1]}.`);
      if (k === c + 1) {
        if (top[k] === 0) return api.tip(`There are no ${NAMES[k]} to borrow. Borrow from the ${NAMES[k + 1]} first!`);
        top[k]--; top[c] += 10;
        MA.sound.play('hop');
        showTop(k); showTop(c);
        api.clearTip();
        return step();
      }
      const between = top.slice(c + 1, k);
      if (top[k] > 0 && between.every(d => d === 0)) {
        top[k]--; top[k - 1] += 10;
        MA.sound.play('hop');
        showTop(k); showTop(k - 1);
        return api.tip(`1 ${ONE[k]} is 10 ${NAMES[k - 1]}. Now borrow from the ${NAMES[c + 1]}.`);
      }
      api.tip(`Borrow from the next column: the ${NAMES[c + 1]}.`);
    }

    function submit(v) {
      if (api.busy()) return;
      const bot = bottom(c);
      if (phase === 'borrow') {
        const next = top[c + 1] === 0 ? `the ${NAMES[c + 2]} first` : `the ${top[c + 1]} in the ${NAMES[c + 1]}`;
        return panel.miss(`You can't take ${bot} from ${top[c]}. Borrow first: tap ${next}.`);
      }
      const want = top[c] - bot;
      if (v !== want) return panel.miss(M.explain(M.make(top[c], '-', bot)).hint);
      api.clearTip();
      MA.sound.play('tap');
      if (want || c < cols - 1 || cols === 1) g.write(c, want);
      c++;
      panel.pad.disable(true);
      if (c >= cols) return done();
      api.after(450, step);
    }

    function done() {
      g.highlight(-1);
      panel.say(`${a} − ${b} = ${p.answer}`);
      api.right({ delay: 1500 });
    }

    stage.append(h('div', { class: 'cm' }, h('div', { class: 'cm-paper' }, g.el, panel.prompt), panel.pad.el));
    step();
    return () => panel.pad.destroy();
  }

  MA.games.register({
    id: 'stacked-sub',
    title: 'Stacked Subtraction',
    icon: '➖',
    color: '#0ea5a4',
    shelf: 'Column maths',
    blurb: 'Take away in columns and borrow',
    intro: 'Take away one column at a time. If the top is smaller, tap the next digit to borrow.',
    levels: SUB_LEVELS,
    make: makeSub,
    fromParams: subProblem,
    say: p => `${p.a} − ${p.b}`,
    explain: explainSub,
    render: renderSub,
  });
})(window.MA);
