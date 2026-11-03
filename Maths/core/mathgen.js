// The number-facts ladder: makes problems for each level, explains them, and makes believable wrong answers.
// A problem is a op b = c, with one of a, b or c hidden (the "blank").
(function (MA) {
  'use strict';

  const { rand, pick, shuffle } = MA.util;
  const SYM = { '+': '+', '-': '−', 'x': '×', '/': '÷' };

  function make(a, op, b, blank) {
    const c = op === '+' ? a + b : op === '-' ? a - b : op === 'x' ? a * b : a / b;
    blank = blank || 'c';
    const vals = { a, b, c };
    return {
      a, op, b, c, blank,
      answer: vals[blank],
      params: [a, op, b, blank],
      key: `${a}${op}${b}|${blank}`,
    };
  }

  const maybeSwap = (a, op, b, blank) => (Math.random() < 0.5 ? make(b, op, a, blank) : make(a, op, b, blank));

  // Each level is one skill. Levels past Grade 2 are there on purpose: kids can climb as far as they like.
  const LEVELS = [
    { id: 'add10', name: 'Adding to 10', eg: '4 + 3',
      gen() { const a = rand(1, 9); return make(a, '+', rand(1, 10 - a)); } },
    { id: 'sub10', name: 'Taking away to 10', eg: '9 − 4',
      gen() { const a = rand(2, 10); return make(a, '-', rand(1, a)); } },
    { id: 'make10', name: 'Make 10', eg: '7 + ? = 10',
      gen() { const a = rand(1, 9); return Math.random() < 0.5 ? make(a, '+', 10 - a, 'b') : make(10 - a, '+', a, 'a'); } },
    { id: 'add20', name: 'Adding to 20', eg: '8 + 5',
      gen() {
        if (Math.random() < 0.75) { const a = rand(2, 9); return maybeSwap(a, '+', rand(11 - a, 9)); }
        const a = rand(11, 18); return make(a, '+', rand(1, 20 - a));
      } },
    { id: 'sub20', name: 'Taking away to 20', eg: '15 − 7',
      gen() {
        const a = rand(11, 18);
        if (Math.random() < 0.75) return make(a, '-', rand(a - 9, 9));
        return make(a, '-', rand(1, a - 10));
      } },
    { id: 'mix20', name: 'Mixed to 20', eg: '? + 6 = 14',
      gen() {
        const r = Math.random();
        if (r < 0.35) return LEVELS[3].gen();
        if (r < 0.7) return LEVELS[4].gen();
        const c = rand(11, 18), a = rand(c - 9, 9);
        return make(a, '+', c - a, 'b');
      } },
    { id: 'tens', name: 'Jumping in tens', eg: '47 + 20',
      gen() {
        switch (rand(1, 4)) {
          case 1: { const a = 10 * rand(1, 8); return make(a, '+', 10 * rand(1, (100 - a) / 10)); }
          case 2: { const a = 10 * rand(2, 10); return make(a, '-', 10 * rand(1, a / 10 - 1)); }
          case 3: { const a = rand(11, 79); return make(a, '+', 10 * rand(1, Math.floor((99 - a) / 10))); }
          default: { const a = rand(21, 99); return make(a, '-', 10 * rand(1, Math.floor(a / 10) - 1)); }
        }
      } },
    { id: 'add2d1d', name: '2-digit + 1-digit', eg: '38 + 7',
      gen() {
        const o = rand(1, 9), a = 10 * rand(1, 8) + o;
        const carry = o === 9 ? true : Math.random() < 0.6;
        return make(a, '+', carry ? rand(10 - o, 9) : rand(1, 9 - o));
      } },
    { id: 'sub2d1d', name: '2-digit − 1-digit', eg: '42 − 7',
      gen() {
        const o = rand(0, 9), a = 10 * rand(2, 9) + o;
        const borrow = o === 0 ? true : o === 9 ? false : Math.random() < 0.6;
        return make(a, '-', borrow ? rand(o + 1, 9) : rand(1, o));
      } },
    { id: 'add2d2d', name: '2-digit + 2-digit', eg: '36 + 47',
      gen() {
        const ta = rand(1, 7), tb = rand(1, 8 - ta);
        let oa, ob;
        if (Math.random() < 0.6) { oa = rand(1, 9); ob = rand(10 - oa, 9); } else { oa = rand(1, 8); ob = rand(0, 9 - oa); }
        return make(10 * ta + oa, '+', 10 * tb + ob);
      } },
    { id: 'sub2d2d', name: '2-digit − 2-digit', eg: '72 − 35',
      gen() {
        let ta, tb, oa, ob;
        if (Math.random() < 0.6) { oa = rand(0, 8); ob = rand(oa + 1, 9); ta = rand(3, 9); tb = rand(1, ta - 2); }
        else { oa = rand(1, 9); ob = rand(0, oa); ta = rand(2, 9); tb = rand(1, ta - 1); }
        return make(10 * ta + oa, '-', 10 * tb + ob);
      } },
    { id: 'mul2510', name: '× 2, 5 and 10', eg: '5 × 7',
      gen() { return maybeSwap(rand(1, 10), 'x', pick([2, 5, 10])); } },
    { id: 'mul10', name: 'Times tables to 10', eg: '7 × 8',
      gen() { return make(rand(2, 10), 'x', rand(2, 10)); } },
    { id: 'div', name: 'Sharing (÷)', eg: '28 ÷ 4',
      gen() { const t = rand(2, 10), n = rand(1, 10); return make(t * n, '/', t); } },
    { id: 'missing', name: 'Missing numbers', eg: '? × 4 = 28',
      gen() {
        switch (rand(1, 4)) {
          case 1: return make(rand(2, 10), 'x', rand(2, 10), 'a');
          case 2: { const a = rand(30, 99); return make(a, '-', rand(11, a - 5), 'b'); }
          case 3: { const a = rand(11, 60); return make(a, '+', rand(11, 99 - a), 'a'); }
          default: { const t = rand(2, 10); return make(t * rand(2, 10), '/', t, 'b'); }
        }
      } },
    { id: 'add3d', name: 'Big adding to 1000', eg: '245 + 378',
      gen() { const a = rand(100, 899); return make(a, '+', rand(100, 999 - a)); } },
    { id: 'sub3d', name: 'Big taking away', eg: '634 − 258',
      gen() { const a = rand(200, 999); return make(a, '-', rand(100, a - 50)); } },
  ];

  // A new problem for level n (1-based). Missed facts come back about a third of the time.
  function problem(n, ctx) {
    const level = LEVELS[n - 1];
    const avoid = new Set((ctx && ctx.avoid) || []);
    const review = ((ctx && ctx.review) || []).filter(f => !avoid.has(`${f.p[0]}${f.p[1]}${f.p[2]}|${f.p[3]}`));
    if (review.length && Math.random() < 0.35) {
      const f = pick(review);
      return Object.assign(make(...f.p), { review: true });
    }
    let p;
    for (let i = 0; i < 25; i++) {
      p = level.gen();
      if (!avoid.has(p.key)) break;
    }
    return p;
  }

  function show(p, which) {
    return p.blank === which ? '?' : String(p[which]);
  }

  // ["8", "+", "?", "=", "14"]
  function tokens(p) {
    return [show(p, 'a'), SYM[p.op], show(p, 'b'), '=', show(p, 'c')];
  }

  function text(p) {
    return tokens(p).join(' ');
  }

  function counting(from, step, count) {
    const out = [];
    for (let i = 1; i <= count; i++) out.push(from + step * i);
    return out.join(', ');
  }

  // Step-by-step working for "Show me", in the words a teacher would use.
  function explain(p) {
    const { a, b, c, op } = p;
    const full = `${a} ${SYM[op]} ${b} = ${c}`;

    if (p.blank !== 'c') {
      const known = p.blank === 'a' ? b : a;
      let think;
      if (op === '+') think = `${c} − ${known} = ${p.answer}`;
      else if (op === 'x') think = `${c} ÷ ${known} = ${p.answer}`;
      else if (op === '-') think = p.blank === 'b' ? `${a} − ${c} = ${b}` : `${c} + ${b} = ${a}`;
      else think = p.blank === 'b' ? `${a} ÷ ${c} = ${b}` : `${c} × ${b} = ${a}`;
      return { hint: `Work backwards: ${think.split('=')[0].trim()} = ?`, steps: ['Work backwards from the answer.', think, `Check: ${full} ✓`] };
    }

    if (op === '+') {
      const big = Math.max(a, b), small = Math.min(a, b);
      if (c <= 10) {
        return { hint: `Start at ${big} and count on ${small}.`, steps: [`Start at ${big} and count on ${small}: ${counting(big, 1, small)}.`, full] };
      }
      if (a >= 100 || b >= 100) {
        const h1 = Math.floor(a / 100) * 100, h2 = Math.floor(b / 100) * 100;
        const t1 = Math.floor(a % 100 / 10) * 10, t2 = Math.floor(b % 100 / 10) * 10;
        const o = a % 10 + b % 10;
        return { hint: 'Add the hundreds, then the tens, then the ones.', steps: [
          `Hundreds: ${h1} + ${h2} = ${h1 + h2}`, `Tens: ${t1} + ${t2} = ${t1 + t2}`, `Ones: ${a % 10} + ${b % 10} = ${o}`,
          `${h1 + h2} + ${t1 + t2} + ${o} = ${c}`] };
      }
      if (a % 10 === 0 && b % 10 === 0) {
        return { hint: `Think in tens: ${a / 10} tens + ${b / 10} tens.`, steps: [`${a / 10} tens + ${b / 10} tens = ${c / 10} tens`, full] };
      }
      if (b % 10 === 0 || a % 10 === 0) {
        const tensPart = a % 10 === 0 ? a : b, other = tensPart === a ? b : a;
        return { hint: `Jump ${tensPart / 10} ten${tensPart > 10 ? 's' : ''} from ${other}.`, steps: [`Jump in tens from ${other}: ${counting(other, 10, tensPart / 10)}.`, full] };
      }
      if (small < 10) {
        const need = 10 - big % 10;
        if (small > need || (small === need)) {
          if (small === need) return { hint: `${big % 10} + ${small} makes a ten.`, steps: [`${big % 10} + ${small} = 10, so you reach the next ten.`, full] };
          return { hint: `Make a ten first: ${big} + ${need} = ${big + need}.`, steps: [
            `Make a ten first: ${big} + ${need} = ${big + need}`, `${small} − ${need} = ${small - need} still to add`, `${big + need} + ${small - need} = ${c}`] };
        }
        return { hint: `Just add the ones: ${big % 10} + ${small}.`, steps: [`Add the ones: ${big % 10} + ${small} = ${big % 10 + small}`, full] };
      }
      const t1 = a - a % 10, t2 = b - b % 10, o = a % 10 + b % 10;
      return { hint: `Add the tens first: ${t1} + ${t2}.`, steps: [`Tens: ${t1} + ${t2} = ${t1 + t2}`, `Ones: ${a % 10} + ${b % 10} = ${o}`, `${t1 + t2} + ${o} = ${c}`] };
    }

    if (op === '-') {
      if (a <= 10) {
        return { hint: `Start at ${a} and count back ${b}.`, steps: [`Start at ${a} and count back ${b}: ${counting(a, -1, b)}.`, full] };
      }
      if (b >= 100) {
        const h = Math.floor(b / 100) * 100, t = Math.floor(b % 100 / 10) * 10, o = b % 10;
        const s1 = a - h, s2 = s1 - t;
        return { hint: `Take away ${h} first.`, steps: [`${a} − ${h} = ${s1}`, `${s1} − ${t} = ${s2}`, `${s2} − ${o} = ${c}`] };
      }
      if (b % 10 === 0) {
        return { hint: `Jump back ${b / 10} ten${b > 10 ? 's' : ''}.`, steps: [`Jump back in tens from ${a}: ${counting(a, -10, b / 10)}.`, full] };
      }
      if (b < 10) {
        const ones = a % 10;
        if (ones >= b) return { hint: `Just take away the ones: ${ones} − ${b}.`, steps: [`Ones: ${ones} − ${b} = ${ones - b}`, full] };
        if (ones === 0) {
          return { hint: `Take ${b} from one ten: 10 − ${b}.`, steps: [`Take ${b} from one ten: 10 − ${b} = ${10 - b}`, `${a - 10} + ${10 - b} = ${c}`] };
        }
        return { hint: `Go back to ${a - ones} first.`, steps: [
          `Go back to the ten: ${a} − ${ones} = ${a - ones}`, `${b} − ${ones} = ${b - ones} still to take away`, `${a - ones} − ${b - ones} = ${c}`] };
      }
      const t = b - b % 10, mid = a - t;
      return { hint: `Take away the tens first: ${a} − ${t}.`, steps: [`Tens first: ${a} − ${t} = ${mid}`, `Then the ones: ${mid} − ${b % 10} = ${c}`] };
    }

    if (op === 'x') {
      if (a === 10 || b === 10) {
        const n = a === 10 ? b : a;
        return { hint: `${n} tens.`, steps: [`${n} × 10 is ${n} tens.`, full] };
      }
      const groups = Math.min(a, b), size = Math.max(a, b);
      if (groups === 1) return { hint: `1 group of ${size}.`, steps: [`${a} × ${b} means 1 group of ${size}.`, full] };
      return { hint: `Count in ${size}s, ${groups} times.`, steps: [`${a} × ${b} means ${groups} groups of ${size}.`, `Count in ${size}s: ${counting(0, size, groups)}.`, full] };
    }

    return { hint: `How many ${b}s make ${a}?`, steps: [`How many ${b}s make ${a}?`, `Count in ${b}s: ${counting(0, b, c)}.`, `That is ${c} ${b}s, so ${full}`] };
  }

  // Three wrong answers that look like real mistakes: off by one or two, a forgotten carry, a nearby times-table fact.
  function choices(p, count) {
    const ans = p.answer;
    const near = [1, -1, 2, -2, 3, -3].map(d => ans + d);
    let far = [];
    if (ans >= 10) far = [ans + 10, ans - 10];
    if (p.op === 'x' && p.blank === 'c') far = far.concat([ans + p.a, ans - p.a, ans + p.b, ans - p.b]);
    if (p.op === '/' || (p.op === 'x' && p.blank !== 'c')) far = far.concat([ans + 1, ans - 1]);
    const ok = v => Number.isInteger(v) && v >= 0 && v !== ans;
    const picked = new Set();
    for (const v of shuffle(far).filter(ok).slice(0, ans >= 10 ? 1 : 0)) picked.add(v);
    for (const v of shuffle(near).filter(ok)) if (picked.size < count - 1) picked.add(v);
    for (let d = 4; picked.size < count - 1; d++) picked.add(ans + d);
    return shuffle([ans, ...picked]);
  }

  const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  // 406 -> "four hundred and six"
  function words(n) {
    if (n < 20) return ONES[n];
    if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
    if (n === 1000) return 'one thousand';
    const r = n % 100;
    return ONES[Math.floor(n / 100)] + ' hundred' + (r ? ' and ' + words(r) : '');
  }

  // 352 -> {h: 3, t: 5, o: 2}
  function digits(n) {
    return { h: Math.floor(n / 100), t: Math.floor(n % 100 / 10), o: n % 10 };
  }

  // Wrong answers for any number: a digit swap (352 -> 325), and near misses by one, ten or a hundred.
  function nearby(ans, count, opts) {
    opts = opts || {};
    const max = opts.max == null ? 1000 : opts.max;
    const step = opts.step || 1;
    const ok = v => Number.isInteger(v) && v >= 0 && v <= max && v !== ans;
    const s = String(ans);
    const swaps = [];
    if (s.length === 2) swaps.push(Number(s[1] + s[0]));
    if (s.length === 3) swaps.push(Number(s[0] + s[2] + s[1]), Number(s[1] + s[0] + s[2]), Number(s[2] + s[1] + s[0]));
    const near = [ans + step, ans - step, ans + 1, ans - 1, ans + 10, ans - 10];
    if (ans >= 100) near.push(ans + 100, ans - 100);
    const picked = new Set();
    shuffle(swaps.filter(v => ok(v) && String(v).length === s.length)).slice(0, 1).forEach(v => picked.add(v));
    for (const v of shuffle(near).filter(ok)) if (picked.size < count - 1) picked.add(v);
    for (let d = 2; picked.size < count - 1; d++) { if (ok(ans + d)) picked.add(ans + d); else if (ok(ans - d)) picked.add(ans - d); }
    return shuffle([ans, ...picked]);
  }

  MA.math = { LEVELS, problem, make, tokens, text, explain, choices, SYM, words, digits, nearby };
})(window.MA);
