// scene.js: "Spark" (Fitz and The Tantrums), Soul Sleeve kinetic typography. See DESIGN.md.
// Every frame is a pure function of t: render.mjs draws frames in parallel and out of order.
// The words come from window.TIMELINE (masked placeholders unless the page has ?real=1), the
// music clock and vocal level from window.FEATURES. Nothing here logs word text.
(async () => {
  const D = window.DESIGN, TL = window.TIMELINE, F = window.FEATURES, P = D.palette;
  const W = 1920, H = 1080, DUR = F.duration, SX = D.safe.x, SY = D.safe.y;
  window.DUR = DUR;
  const canvas = document.getElementById('c'), g = canvas.getContext('2d');
  const BIG = 'ArchivoV', SMALL = 'FrauncesI';

  // ---- helpers ---------------------------------------------------------------------------
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, p) => a + (b - a) * p;
  const expoOut = p => (p <= 0 ? 0 : p >= 1 ? 1 : 1 - Math.pow(2, -10 * p));
  const expoInOut = p => (p <= 0 ? 0 : p >= 1 ? 1 : p < 0.5 ? Math.pow(2, 20 * p - 10) / 2 : (2 - Math.pow(2, -20 * p + 10)) / 2);
  const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const lastLE = (arr, t) => { let lo = 0, hi = arr.length - 1, r = -1; while (lo <= hi) { const m = (lo + hi) >> 1; if (arr[m] <= t) { r = m; lo = m + 1; } else hi = m - 1; } return r; };
  const typeOn = c => D.type[c][0], accentOn = c => D.type[c][1];

  // ---- music clock -------------------------------------------------------------------------
  const beats = F.beats, downs = F.downbeats, ph = F.downbeat_phase;
  const backbeats = beats.filter((_, k) => ((k - ph) % 4 + 4) % 4 === 1 || ((k - ph) % 4 + 4) % 4 === 3);
  const pulseAt = (arr, t, tau) => { const k = lastLE(arr, t); return k < 0 ? 0 : Math.exp(-(t - arr[k]) / tau); };
  const VDB = F.vocal_db, fps = F.fps;
  const vdbAt = t => VDB[clamp(Math.round(t * fps), 0, VDB.length - 1)];
  const nextDown = t => downs[Math.min(downs.length - 1, lastLE(downs, t) + 1)];

  // ---- type --------------------------------------------------------------------------------
  let CAP = 0.7, ASC = 0.75, DESC = 0.25;
  const SMALLR = 0.46, MAXS = 340;
  function setBig(size, weight, stretch) {
    g.font = `${Math.round(weight)} ${size.toFixed(2)}px ${BIG}`; g.fontStretch = stretch; g.letterSpacing = `${(-0.01 * size).toFixed(2)}px`;
  }
  function setSmall(size, weight) {
    g.font = `italic ${Math.round(weight)} ${size.toFixed(2)}px ${SMALL}`; g.fontStretch = 'normal'; g.letterSpacing = '0px';
  }
  function setLabel(size) {
    g.font = `600 ${size}px ${BIG}`; g.fontStretch = 'normal'; g.letterSpacing = `${(0.08 * size).toFixed(2)}px`;
  }
  const wcache = new Map();
  function nat(text, small, stretch, weight) {   // advance width at font size 100
    const wq = Math.round(weight / 10) * 10, key = `${small ? 's' : stretch}|${wq}|${text}`;
    let v = wcache.get(key);
    if (v === undefined) { if (small) setSmall(100, wq); else setBig(100, wq, stretch); v = g.measureText(text).width; wcache.set(key, v); }
    return v;
  }

  await Promise.all([document.fonts.load(`900 100px ${BIG}`), document.fonts.load(`italic 400 100px ${SMALL}`)]);
  setBig(100, 900, 'normal'); CAP = g.measureText('H').actualBoundingBoxAscent / 100;
  setSmall(100, 400); ASC = g.measureText('hdlk').actualBoundingBoxAscent / 100; DESC = g.measureText('gjpqy').actualBoundingBoxDescent / 100;

  // ---- words -------------------------------------------------------------------------------
  const LINES = TL.lines;
  const lineCount = LINES.length;
  const hookCls = LINES.reduce((b, l) => (l.cls_count > b.n ? { n: l.cls_count, c: l.cls } : b), { n: 0, c: -1 }).c;
  function prepWeights(line) {
    const peaks = line.words.map(w => w.peak), lo = Math.min(...peaks), hi = Math.max(...peaks);
    const nrm = db => clamp((db - lo) / Math.max(1.5, hi - lo));
    for (const w of line.words) {
      const n = Math.max(1, Math.round((w.e - w.t) * fps)), cm = new Float32Array(n + 1);
      let m = -120;
      for (let k = 0; k <= n; k++) { m = Math.max(m, vdbAt(w.t + k / fps)); cm[k] = nrm(m); }
      w._cm = cm;
    }
  }
  const loud = (w, t) => w._cm[clamp(Math.round((t - w.t) * fps), 0, w._cm.length - 1)];
  function weightOf(tk, t) {
    const L = loud(tk.w, t);
    if (tk.small) return lerp(D.weight.fnMin, D.weight.fnMax, L);
    if (tk.hero) return lerp(820, 900, L);
    return lerp(D.weight.min, D.weight.max, L);
  }
  function tokensOf(line) {
    return line.words.map((w, i) => {
      const small = w.fn || w.paren, text = (small ? w.text.toLowerCase() : w.text.toUpperCase()).replace(/'/g, '’');
      const tk = { i, w, small, hero: w.hero, text };
      tk.final = weightOf(tk, w.e);
      return tk;
    });
  }

  // ---- stack layout: rows of type, each big row set to fill the box width ------------------
  const GAPB = 24, GAPS = 16;   // word gaps at size 100 (big-big, around italics)
  function rowNat(row, stretch) {
    let s = 0;
    row.forEach((tk, j) => {
      s += tk.small ? nat(tk.text, true, '', tk.final) * SMALLR : nat(tk.text, false, stretch, tk.final);
      if (j) s += tk.small || row[j - 1].small ? GAPS : GAPB;
    });
    return s;
  }
  function sizeRows(rows, boxW, targetH, maxS = MAXS) {
    // pick each big row's width step so its height comes near targetH; italic-only rows size later
    const out = rows.map(row => {
      if (row.every(tk => tk.small)) return { row, conn: true };
      let best = null;
      for (const st of D.stretches) {
        const n = rowNat(row, st), s = Math.min(maxS, 100 * boxW / n), h = s * CAP;
        const cost = Math.abs(h - targetH) / targetH + (s >= maxS ? 0.5 * (1 - n * maxS / 100 / boxW) : 0) + (st === 'semi-expanded' ? 0.08 : 0);
        if (!best || cost < best.cost) best = { row, st, s, h, n, cost };
      }
      return best;
    });
    const bigS = out.filter(r => !r.conn).map(r => r.s);
    const ref = bigS.length ? bigS.reduce((a, b) => a + b, 0) / bigS.length : 120;
    for (const r of out) if (r.conn) { r.s = ref; r.h = ref * SMALLR * (ASC + DESC); r.st = 'normal'; r.n = rowNat(r.row, 'normal'); }
    return out;
  }
  function blockHeight(sized) {
    let h = 0;
    sized.forEach((r, j) => { h += r.h + (j ? 0.12 * Math.min(r.s, sized[j - 1].s) * CAP : 0); });
    return h;
  }
  function layoutStack(tokens, box, opt = {}) {
    const n = tokens.length, maxRows = opt.maxRows || 5;
    let best = null;
    for (let mask = 0; mask < 1 << (n - 1); mask++) {
      const rows = [[tokens[0]]];
      for (let i = 1; i < n; i++) { if (mask & (1 << (i - 1))) rows.push([tokens[i]]); else rows[rows.length - 1].push(tokens[i]); }
      if (rows.length > maxRows) continue;
      if (rows.some(r => r.filter(tk => !tk.small).length > 3 || (r.every(tk => tk.small) && tokens.some(tk => !tk.small)))) continue;
      const maxS = opt.maxS || MAXS, sized = sizeRows(rows, box.w, box.h / rows.length, maxS);
      const hTot = blockHeight(sized), k = Math.min(1, box.h / hTot);
      let cost = (1 - Math.min(1, hTot / box.h)) * 3 + (1 - k) * 5;
      sized.forEach((r, j) => {
        if (!r.conn && r.s >= maxS) cost += 1.5 * (1 - r.n * maxS / 100 / box.w);
        if (j < sized.length - 1 && r.row[r.row.length - 1].small && !r.conn) cost += 0.7;
      });
      for (let j = 1; j < rows.length; j++) {
        const a = rows[j - 1][rows[j - 1].length - 1].w, b = rows[j][0].w, gap = b.t - a.e;
        cost += gap > 0.3 ? -0.35 : gap < 0.06 ? 0.15 : 0;
      }
      const heroRow = sized.find(r => r.row.some(tk => tk.hero));
      if (heroRow && heroRow.s < Math.max(...sized.map(r => r.s)) - 1) cost += 0.45;
      cost += Math.max(0, rows.length - 4) * 0.4;
      if (!best || cost < best.cost) best = { cost, sized, k, hTot };
    }
    return place(best.sized, best.k, best.hTot * best.k, box, opt);
  }
  function place(sized, k, hTot, box, opt) {
    const align = opt.align || 'left', valign = opt.valign || 'center';
    let y = box.y + (valign === 'top' ? 0 : valign === 'bottom' ? box.h - hTot : (box.h - hTot) / 2);
    const rows = [], toks = [];
    sized.forEach((r, j) => {
      const s = r.s * k, h = r.h * k;
      if (j) y += 0.12 * Math.min(s, sized[j - 1].s * k) * CAP;
      const rw = r.n * s / 100, x0 = box.x + (align === 'left' ? 0 : align === 'right' ? box.w - rw : (box.w - rw) / 2);
      const base = r.conn ? y + s * SMALLR * ASC : y + s * CAP;
      const row = { x: x0, top: y, w: rw, h, base, s, conn: !!r.conn, toks: [] };
      let x = x0;
      r.row.forEach((tk, i) => {
        if (i) x += (tk.small || r.row[i - 1].small ? GAPS : GAPB) * s / 100;
        const size = tk.small ? s * SMALLR : s, bw = tk.small ? nat(tk.text, true, '', tk.final) * size / 100 : nat(tk.text, false, r.st, tk.final) * s / 100;
        const t = { ...tk, x, base, bw, size, stretch: r.st, row };
        row.toks.push(t); toks.push(t);
        x += bw;
      });
      rows.push(row);
      y += h;
    });
    return { rows, toks };
  }
  // A tall column: one big word per row (italics ride along), fit to the column, scrolled by time.
  function layoutColumn(tokens, box) {
    const rows = [];
    let cur = [];
    tokens.forEach(tk => { cur.push(tk); if (!tk.small) { rows.push(cur); cur = []; } });
    if (cur.length) { if (rows.length) rows[rows.length - 1].push(...cur); else rows.push(cur); }
    const sized = rows.map((row, j) => {
      const st = D.stretches[[0, 2, 1, 3, 0, 1][j % 6]], n = rowNat(row, st), s = Math.min(MAXS * 0.8, 100 * box.w / n);
      return { row, st, s, h: s * CAP, n };
    });
    return place(sized, 1, blockHeight(sized), box, { align: 'left', valign: 'top' });
  }

  // Word cards: one big word fills the frame and cuts on each sung onset; italics ride with the next big word.
  function layoutCards(tokens) {
    const groups = [];
    let cur = [];
    tokens.forEach(tk => { cur.push(tk); if (!tk.small) { groups.push(cur); cur = []; } });
    if (cur.length) { if (groups.length) groups[groups.length - 1].push(...cur); else groups.push(cur); }
    // a card must stay up 0.32 s: a big word sung sooner after the card's first word joins that card
    for (let i = 1; i < groups.length; i++) {
      const big = groups[i - 1].filter(tk => !tk.small);
      if (big.length < 2 && groups[i][0].w.t - groups[i - 1][0].w.t < 0.32) { groups[i - 1].push(...groups[i]); groups.splice(i--, 1); }
    }
    return groups.map(gr => layoutStack(gr, inset({ x: SX, y: SY + 40, w: W - 2 * SX, h: H - 2 * SY - 120 }, 1.07), { maxRows: 2, maxS: 620 }));
  }

  // ---- fields: flat shapes; type over a field takes that field's type color ------------------
  const R = (x, y, w, h, c) => ({ shape: 'rect', x, y, w, h, c });
  const C = (cx, cy, r, c, orbit) => ({ shape: 'circle', cx, cy, r, c, orbit });
  const B = (cx, cy, r, c, o = {}) => ({ shape: 'burst', cx, cy, r, c, n: o.n || 12, inner: o.inner || 0.78, spin: o.spin ?? 0.12, pulse: o.pulse ?? 0.05, reg: o.reg ?? true, step: o.step || 0 });
  const stepCount = (arr, t, tau) => { const k = lastLE(arr, t); return k < 0 ? 0 : k + expoOut((t - arr[k]) / tau); };
  function live(f, t) {   // the field's shape at time t
    if (f.shape === 'burst') return { ...f, rot: f.spin * t + f.step * stepCount(backbeats, t, 0.18), rr: f.r * (1 + f.pulse * pulseAt(backbeats, t, 0.16)) };
    if (f.alt) { const k = lastLE(downs, t), p = k < 0 ? 1 : expoOut((t - downs[k]) / 0.22), a = f.alt[(k + 2) % 2], b = f.alt[(k + 1) % 2]; return { ...f, [f.altProp]: lerp(a, b, p), ...(f.altProp === 'w' && f.anchorRight ? { x: W - lerp(a, b, p) } : {}) }; }
    if (f.shape === 'circle' && f.beat) return { ...f, r: f.r * (1 + f.beat * pulseAt(downs, t, 0.2)) };
    if (f.shape === 'circle' && f.orbit) { const a = t * 3.49; return { ...f, cx: f.orbit.cx + Math.cos(a) * f.orbit.d, cy: f.orbit.cy + Math.sin(a) * f.orbit.d }; }
    return f;
  }
  function shapePath(f) {
    if (f.shape === 'rect') g.rect(f.x, f.y, f.w, f.h);
    else if (f.shape === 'circle') { g.moveTo(f.cx + f.r, f.cy); g.arc(f.cx, f.cy, f.r, 0, Math.PI * 2); }
    else {
      for (let i = 0; i < 2 * f.n; i++) {
        const a = f.rot + i * Math.PI / f.n, r = i % 2 ? f.rr * f.inner : f.rr;
        i ? g.lineTo(f.cx + Math.cos(a) * r, f.cy + Math.sin(a) * r) : g.moveTo(f.cx + Math.cos(a) * r, f.cy + Math.sin(a) * r);
      }
      g.closePath();
    }
  }
  const bbox = f => f.shape === 'rect' ? [f.x, f.y, f.x + f.w, f.y + f.h] : f.shape === 'circle' ? [f.cx - f.r, f.cy - f.r, f.cx + f.r, f.cy + f.r]
    : [f.cx - f.rr, f.cy - f.rr, f.cx + f.rr, f.cy + f.rr];
  const hit = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
  function drawFields(fields) {
    for (const f of fields) {
      if (f.shape === 'burst' && f.reg) {   // misregistered plate: the same burst 3 px off, under it
        g.fillStyle = P[f.c]; g.globalAlpha = 0.35; g.beginPath(); shapePath({ ...f, cx: f.cx + 3, cy: f.cy + 3 }); g.fill(); g.globalAlpha = 1;
      }
      g.fillStyle = P[f.c]; g.beginPath(); shapePath(f); g.fill();
    }
  }
  // Draw `paint(colorName, accentName)` once per field it overlaps, clipped to the visible part of that field.
  function overFields(fields, box, paint) {
    for (let i = 0; i < fields.length; i++) {
      const fb = bbox(fields[i]);
      if (!hit(fb, box)) continue;
      g.save();
      g.beginPath(); shapePath(fields[i]); g.clip();
      for (let j = i + 1; j < fields.length; j++) {
        if (!hit(bbox(fields[j]), box)) continue;
        g.beginPath(); g.rect(-1e4, -1e4, 3e4, 3e4); shapePath(fields[j]); g.clip('evenodd');
      }
      paint(fields[i].c);
      g.restore();
    }
  }

  // ---- drawing type ------------------------------------------------------------------------
  function drawToken(tk, t, fieldColor, entranceT) {
    const p = expoOut((t - entranceT) / D.entrance);
    const wt = weightOf(tk, t);
    const role = tk.hero && !tk.small ? accentOn(fieldColor) : typeOn(fieldColor);
    g.fillStyle = P[role];
    const row = tk.row;
    g.save();
    g.beginPath(); g.rect(row.x - 40, row.top - row.h * 0.25, row.w + 80, row.h * 1.5); g.clip();
    const dy = (1 - p) * row.h * 1.05;
    if (tk.small) setSmall(tk.size, wt); else setBig(tk.size, wt, tk.stretch);
    const nw = g.measureText(tk.text).width, sx = tk.bw / Math.max(1, nw);
    g.translate(tk.x, tk.base + dy); g.scale(sx, 1); g.fillText(tk.text, 0, 0);
    g.restore();
    // held note: a bar fills under the word while the note is held
    const held = tk.w.e - tk.w.t;
    if (!tk.small && held >= 0.8) {
      const q = clamp((t - tk.w.t) / held), bh = Math.max(10, tk.size * CAP * 0.08);
      g.fillStyle = P[accentOn(fieldColor)];
      g.fillRect(tk.x, tk.base + tk.size * CAP * 0.1 + dy * 0.2, tk.bw * q, bh);
    }
  }
  function tokBox(tk) { return [tk.x - 8, tk.row.top - 8, tk.x + tk.bw + 8, tk.base + tk.size * 0.3]; }
  function drawTokens(toks, fields, t, from = -1) {
    for (const tk of toks) {
      const t0 = Math.max(from, tk.w.t - D.lead);
      if (t < t0) continue;
      overFields(fields, tokBox(tk), c => drawToken(tk, t, c, t0));
    }
  }
  function drawLabel(text, x, y, fields, align = 'left', size = 18) {
    setLabel(size);
    const w = g.measureText(text).width, x0 = align === 'right' ? x - w : x;
    overFields(fields, [x0 - 4, y - size, x0 + w + 4, y + 6], c => { g.fillStyle = P[typeOn(c)]; g.fillText(text, x0, y); });
  }

  // ---- compositions ------------------------------------------------------------------------
  const ZMAX = 1.035;   // drift 2% + downbeat punch 1.2%, plus margin
  const inset = (b, z) => ({ x: W / 2 - (W / 2 - b.x) / z, y: H / 2 - (H / 2 - b.y) / z, w: b.w / z, h: b.h / z });
  const BOX = inset({ x: SX, y: SY + 24, w: W - 2 * SX, h: H - 2 * SY - 88 }, ZMAX);   // the labels use the bottom 64 px
  const mirrorF = f => f.shape === 'rect' ? { ...f, x: W - f.x - f.w, anchorRight: !!f.alt && f.x === 0 } : { ...f, cx: W - f.cx, orbit: f.orbit && { ...f.orbit, cx: W - f.orbit.cx } };
  const disc = (cx, cy, r, c, label, dot) => [C(cx, cy, r, c), C(cx, cy, r * 0.36, label), C(cx, cy, r * 0.05, dot, { cx, cy, d: r * 0.2 })];
  const TEMPLATES = {
    VA: () => ({ fields: [R(0, 0, W, H, 'chalk'), R(1400, 0, 520, H, 'blush'), ...disc(1660, 560, 230, 'ink', 'signal', 'chalk')], box: { ...BOX, w: 1170 } }),
    VB: () => ({ fields: [R(0, 0, W, H, 'blush'), R(0, 0, W, 470, 'pine'), R(0, 458, W, 24, 'signal')], box: BOX }),
    VC: () => ({ fields: [R(0, 0, W, H, 'chalk'), B(1690, 210, 150, 'signal', { spin: 0.2 })], box: { ...BOX, y: 300, h: BOX.y + BOX.h - 300 } }),
    VD: () => ({ fields: [R(0, 0, W, H, 'blush'), R(0, 0, 640, H, 'ink')], box: BOX }),
    CA: () => ({ fields: [R(0, 0, W, H, 'signal'), B(1480, 560, 360, 'ink', { spin: 0.02, step: Math.PI / 12, reg: false })], box: BOX }),
    CB: () => ({ fields: [R(0, 0, W, H, 'ink'), { ...C(1760, 980, 430, 'signal'), beat: 0.05 }, { ...C(1760, 980, 150, 'ink'), beat: 0.12 }], box: BOX }),
    CC: () => ({ fields: [R(0, 0, W, H, 'ink'), { ...R(0, 0, 1080, H, 'signal'), alt: [1080, 760], altProp: 'w' }], box: BOX }),
    CH: () => ({ fields: [R(0, 0, W, H, 'ink'), B(1240, 540, 500, 'signal', { spin: 0.03, step: Math.PI / 12, pulse: 0.07 })], box: BOX }),
    CG: () => ({ fields: [R(0, 0, W, H, 'signal')], cards: true }),
    CT: k => ({ fields: k % 2 ? [R(0, 0, W, H, 'ink'), ...disc(1520, 560, 330, 'signal', 'blush', 'ink')] : [R(0, 0, W, H, 'signal'), ...disc(1520, 560, 330, 'ink', 'blush', 'ink')], column: { x: 128, y: 0, w: 1000 } }),
    BA: () => ({ fields: [R(0, 0, W, H, 'pine'), C(1420, 560, 400, 'blush')], box: BOX }),
    BB: () => ({ fields: [R(0, 0, W, H, 'pine'), R(0, 760, W, 320, 'chalk')], box: BOX }),
  };
  const SECTIONS = TL.sections;
  const counters = {};
  const COMPS = LINES.map((line, li) => {
    prepWeights(line);
    const sec = SECTIONS[line.section], kind = sec.kind, inSec = sec.lines.indexOf(li);
    counters[kind] = counters[kind] || 0;
    let name;
    if (kind === 'verse') name = ['VA', 'VB', 'VC', 'VD'][(inSec + line.section) % 4];
    else if (kind === 'bridge') name = ['BA', 'BB'][inSec % 2];
    else if (line.cls === hookCls) name = 'CH';
    else if (line.end - line.start > 4.6) name = (counters.long = (counters.long || 0) + 1) % 2 ? 'CT' : 'CG';
    else name = ['CA', 'CB', 'CC'][counters[kind]++ % 3];
    const tpl = TEMPLATES[name](li);
    const mirror = name !== 'CH' && name !== 'CT' && hash(li * 3.7) < 0.5;
    const fields = mirror ? tpl.fields.map(mirrorF) : tpl.fields;
    const tokens = tokensOf(line);
    let lay;
    if (tpl.column) lay = layoutColumn(tokens, { x: tpl.column.x, y: 0, w: tpl.column.w, h: H });
    else if (tpl.cards) { const cards = layoutCards(tokens); lay = { cards, toks: cards.flatMap(c => c.toks), rows: cards.flatMap(c => c.rows) }; }
    else {
      const box = mirror && tpl.box.w < BOX.w ? { ...tpl.box, x: W - tpl.box.x - tpl.box.w } : tpl.box;
      lay = layoutStack(tokens, box, { align: mirror && tpl.box.w < BOX.w ? 'right' : 'left', maxRows: 5 });
    }
    return { li, line, name, fields, lay, column: !!tpl.column, cards: !!tpl.cards, kind, start: line.words[0].t - D.lead };
  });
  COMPS.forEach((c, i) => {
    if (!i) return;
    const lastOn = Math.max(...COMPS[i - 1].line.words.map(w => w.t)) - D.lead;
    c.start = Math.min(c.start + 0.7, Math.max(c.start, lastOn + 0.22));
  });
  COMPS.forEach((c, i) => { c.end = i + 1 < COMPS.length ? COMPS[i + 1].start : DUR; });
  COMPS.forEach((c, i) => {
    const prev = COMPS[i - 1];
    if (!prev || prev.line.section === c.line.section) return;
    const lastOn = Math.max(...prev.line.words.map(w => w.t));
    c.wipeFrom = Math.max(c.start - 0.28, lastOn + 0.35);
  });

  // Interludes: intro, breaks longer than 3 s, outro.
  const INTER = [];
  INTER.push({ kind: 'intro', a: 0, b: COMPS[0].start });
  for (let i = 0; i + 1 < COMPS.length; i++) {
    const endSung = Math.max(...LINES[i].words.map(w => w.e));
    if (COMPS[i + 1].start - endSung > 3) INTER.push({ kind: 'break', a: endSung + 0.5, b: COMPS[i + 1].start, side: INTER.filter(x => x.kind === 'break').length });
  }
  const lastSung = Math.max(...LINES[lineCount - 1].words.map(w => w.e));
  INTER.push({ kind: 'outro', a: lastSung + 0.6, b: DUR });

  // ---- camera ------------------------------------------------------------------------------
  function zoomAt(a, b, t) { return 1 + 0.02 * clamp((t - a) / Math.max(0.5, b - a)) + 0.012 * pulseAt(downs, t, 0.12); }
  function camera(z) { g.setTransform(z, 0, 0, z, W / 2 * (1 - z), H / 2 * (1 - z)); }

  // ---- frames ------------------------------------------------------------------------------
  function columnScroll(c, t) {   // keep the newest sung row near 80% of the frame height
    const toks = c.lay.toks, rowsBottom = r => r.top + r.h;
    const target = k => Math.max(0, rowsBottom(toks[k].row) - H * 0.8);
    let k = -1;
    for (let i = 0; i < toks.length; i++) if (toks[i].w.t - D.lead <= t) k = i;
    if (k < 0) return target(0) > 0 ? 0 : 0;
    const prev = k ? target(k - 1) : 0, p = expoInOut((t - toks[k].w.t + D.lead) / 0.4);
    return lerp(prev, target(k), p);
  }
  const CARD_FIELDS = [
    [R(0, 0, W, H, 'signal'), B(1640, 860, 260, 'ink', { spin: 0.05, step: Math.PI / 12, reg: false })],
    [R(0, 0, W, H, 'ink'), B(300, 220, 220, 'signal', { spin: 0.05, step: Math.PI / 12 })],
    [R(0, 0, W, H, 'blush'), R(0, 700, W, 380, 'signal')],
    [R(0, 0, W, H, 'ink'), C(1600, 540, 420, 'signal'), C(1600, 540, 150, 'ink')],
  ];
  // A card cuts in with its first big word; italics sung just before it come up with it.
  const cardStart = (c, cd) => {
    const big = cd.toks.find(tk => !tk.small) || cd.toks[0], first = cd.toks[0];
    return Math.max(c.start, (big.w.t - first.w.t > 0.4 ? first.w.t : big.w.t) - D.lead);
  };
  function drawCards(c, t) {
    const cards = c.lay.cards;
    let k = 0;
    for (let i = 0; i < cards.length; i++) if (cardStart(c, cards[i]) <= t) k = i;
    const a = cardStart(c, cards[k]), b = k + 1 < cards.length ? cardStart(c, cards[k + 1]) : c.end;
    const fields = CARD_FIELDS[(k + c.li) % CARD_FIELDS.length].map(f => live(f, t));
    camera(1 + 0.05 * clamp((t - a) / Math.max(0.3, b - a)) + 0.012 * pulseAt(downs, t, 0.12));
    drawFields(fields);
    drawLabel('CHORUS', SX, H - SY, fields);
    drawLabel(`${String(c.li + 1).padStart(2, '0')} / ${lineCount}`, W - SX, H - SY, fields, 'right');
    drawTokens(cards[k].toks, fields, t, a);
  }
  function drawComp(c, t) {
    if (c.cards) return drawCards(c, t);
    const fields = c.fields.map(f => live(f, t));
    camera(zoomAt(c.start, c.end, t));
    drawFields(fields);
    const sec = SECTIONS[c.line.section];
    const label = (sec.kind === 'chorus' ? 'CHORUS' : sec.kind === 'bridge' ? 'BRIDGE' : 'VERSE');
    drawLabel(label, SX, H - SY, fields);
    drawLabel(`${String(c.li + 1).padStart(2, '0')} / ${lineCount}`, W - SX, H - SY, fields, 'right');
    if (c.column) {
      const dy = columnScroll(c, t);
      g.save(); g.translate(0, -dy + 120);
      // fields do not scroll; shift them the other way while type is drawn
      const shifted = fields.map(f => f.shape === 'rect' ? { ...f, y: f.y + dy - 120 } : { ...f, cy: f.cy + dy - 120 });
      drawTokens(c.lay.toks, shifted, t, c.start);
      g.restore();
    } else drawTokens(c.lay.toks, fields, t, c.start);
  }

  // Intro, breaks and outro: sleeve graphics on the beat grid.
  function drawStripes(t, a, b) {   // one palette stripe rises per beat
    const k0 = lastLE(beats, a), k = lastLE(beats, t), cols = ['signal', 'ink', 'blush', 'pine', 'signal', 'chalk', 'ink', 'blush'];
    const fields = [R(0, 0, W, H, 'chalk')];
    for (let i = Math.max(0, k0 + 1); i <= k; i++) {
      const j = i - k0 - 1, p = expoOut((t - beats[i]) / 0.18), x = (j % 8) * (W / 8);
      fields.push(R(x, H * (1 - p), W / 8 + 1, H, cols[j % 8]));
    }
    return fields;
  }
  function drawTitle(t, i, fields, width = 1500) {
    // "SPARK" set wide, letters land on beats; the band name in italics under it
    const word = TL.meta.title.toUpperCase(), st = 'semi-expanded';
    setBig(100, 900, st);
    const size = Math.min(560, width / g.measureText(word).width * 100);
    setBig(size, 900, st);
    const tw = g.measureText(word).width, x0 = (W - tw) / 2, base = H / 2 + size * CAP / 2 - 40;
    let x = x0;
    for (let n = 0; n < word.length; n++) {
      const ch = word[n], cw = (setBig(size, 900, st), g.measureText(ch).width);
      const tl = i.a + 3.9 + n * F.period, p = expoOut((t - tl) / 0.16);
      if (p > 0) overFields(fields, [x - 10, base - size, x + cw + 10, base + 20], c => {
        g.save(); g.beginPath(); g.rect(x - 20, base - size * CAP - 20, cw + 40, size * CAP + 40); g.clip();
        setBig(size, lerp(500, 900, p), st); g.fillStyle = P[typeOn(c)]; g.fillText(ch, x, base + (1 - p) * size * 0.9); g.restore();
      });
      x += cw;
    }
    const tb = i.a + 3.9 + 6 * F.period, pb = expoOut((t - tb) / 0.3);
    if (pb > 0) {
      const s = 84; setSmall(s, 400); const bw = g.measureText(TL.meta.artist).width;
      overFields(fields, [W / 2 - bw / 2 - 10, base + 30, W / 2 + bw / 2 + 10, base + 180], c => {
        g.save(); g.beginPath(); g.rect(0, base + 30, W, 150); g.clip();
        setSmall(s, 400); g.fillStyle = P[accentOn(c)]; g.fillText(TL.meta.artist, (W - bw) / 2, base + 130 + (1 - pb) * 100); g.restore();
      });
    }
  }
  function drawInter(i, t) {
    camera(1 + 0.012 * pulseAt(downs, t, 0.12));
    if (i.kind === 'intro') {
      const bar = (t - beats[0]) / (4 * F.period);
      if (bar < 2) { drawFields(drawStripes(t, 0, i.b)); return; }
      const fields = [R(0, 0, W, H, 'signal'), B(W - 260, 250, 190, 'ink', { spin: 0.3 })];
      if (bar >= 4) {   // the record slides out of the sleeve
        const p = expoOut((t - (beats[0] + 16 * F.period)) / 0.9);
        fields.splice(1, 0, ...disc(lerp(W / 2, W / 2 + 560, p), H / 2, 360, 'ink', 'blush', 'signal'));
      }
      drawFields(fields.map(f => live(f, t)));
      drawTitle(t, i, fields.map(f => live(f, t)));
      drawLabel('MORE THAN JUST A DREAM', SX, H - SY, fields);
      drawLabel('2013', W - SX, H - SY, fields, 'right');
      return;
    }
    if (i.kind === 'break') {
      const k = Math.max(0, lastLE(downs, t)), cols = ['ink', 'pine', 'signal'], bg = cols[k % 3];
      const fields = [R(0, 0, W, H, bg), ...disc(W / 2, H / 2, 380, bg === 'ink' ? 'signal' : 'ink', bg === 'signal' ? 'blush' : 'chalk', bg === 'ink' ? 'ink' : 'signal')];
      const live_ = fields.map(f => live(f, t));
      drawFields(live_);
      setLabel(34); const lw = g.measureText('SIDE B').width;
      drawLabel('SIDE B', W / 2 - lw / 2, H / 2 + 12, live_, 'left', 34);
      return;
    }
    // outro: the sleeve again
    const fields = [R(0, 0, W, H, 'chalk'), B(W / 2, H / 2 - 40, 430, 'signal', { spin: 0.02, step: Math.PI / 12, pulse: 0.06 })];
    const lf = fields.map(f => live(f, t));
    drawFields(lf);
    drawTitle(t, { a: i.a - 3.9 }, lf, 1240);
    drawLabel('MORE THAN JUST A DREAM', SX, H - SY, lf);
    drawLabel('2013', W - SX, H - SY, lf, 'right');
  }

  // static print grain, 4%
  const grain = document.createElement('canvas'); grain.width = grain.height = 256;
  { const gc = grain.getContext('2d'), im = gc.createImageData(256, 256); for (let i = 0; i < 256 * 256; i++) { const v = Math.floor(hash(i * 1.37) * 255); im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; } gc.putImageData(im, 0, 0); }
  let grainPat = null;

  function frame(t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = P.ink; g.fillRect(0, 0, W, H);
    const inter = INTER.find(i => t >= i.a && t < i.b);
    if (inter) drawInter(inter, t);
    else {
      let k = -1;
      for (let i = 0; i < COMPS.length; i++) if (COMPS[i].start <= t) k = i;
      drawComp(COMPS[Math.max(0, k)], t);
      const nx = COMPS[k + 1];
      if (nx && nx.wipeFrom !== undefined && t >= nx.wipeFrom && t < nx.start) {
        const p = expoInOut((t - nx.wipeFrom) / (nx.start - nx.wipeFrom));
        const cur = COMPS[Math.max(0, k)].fields[0].c, wc = nx.fields.map(f => f.c).find(c => c !== cur) || 'signal';
        g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = P[wc];
        if (nx.li % 2) g.fillRect(0, 0, W * p, H); else g.fillRect(0, H * (1 - p), W, H * p);
      }
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    grainPat = grainPat || g.createPattern(grain, 'repeat');
    g.globalAlpha = 0.04; g.fillStyle = grainPat; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
  }

  // ---- checks (numbers only) -----------------------------------------------------------------
  window.audit = () => {
    const zmax = 1.032, out = { words: 0, outsideSafe: 0, outsideFrame: 0, minOnScreen: 99, under300ms: 0, templates: {} };
    const tx = (x, y) => [W / 2 + (x - W / 2) * zmax, H / 2 + (y - H / 2) * zmax];
    for (const c of COMPS) {
      out.templates[c.name] = (out.templates[c.name] || 0) + 1;
      const cardEnd = tk => {   // a word card is on screen until the next card cuts in
        if (!c.cards) return c.end;
        const k = c.lay.cards.findIndex(cd => cd.toks.includes(tk)), nx = c.lay.cards[k + 1];
        return nx ? cardStart(c, nx) : c.end;
      };
      for (const tk of c.lay.toks) {
        out.words++;
        const shownAt = c.cards ? Math.max(cardStart(c, c.lay.cards.find(cd => cd.toks.includes(tk))), tk.w.t - D.lead) : Math.max(c.start, tk.w.t - D.lead);
        const delay = shownAt - (tk.w.t - D.lead);
        if (delay > 0.05) { out.delayedWords = (out.delayedWords || 0) + 1; out.maxDelay = Math.max(out.maxDelay || 0, +delay.toFixed(3)); }
        const [x0, y0] = tx(tk.x, tk.row.top), [x1, y1] = tx(tk.x + tk.bw, tk.base + (tk.small ? tk.size * DESC : 0));
        const safeX = x0 >= SX && x1 <= W - SX, safeY = c.column || (y0 >= SY && y1 <= H - SY);
        if (!(safeX && safeY)) out.outsideSafe++;
        if (x0 < 0 || x1 > W || (!c.column && (y0 < 0 || y1 > H))) out.outsideFrame++;
        const on = cardEnd(tk) - shownAt;
        out.minOnScreen = Math.min(out.minOnScreen, +on.toFixed(3));
        if (on < 0.3) out.under300ms++;
      }
    }
    // contrast of every field/type pair the scene can use (WCAG relative luminance)
    const lum = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(x => x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
    const cr = (a, b) => { const [x, y] = [lum(P[a]), lum(P[b])].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
    out.minContrast = +Math.min(...Object.entries(D.type).flatMap(([f, [a, b]]) => [cr(f, a), cr(f, b)])).toFixed(2);
    out.interludes = INTER.map(i => `${i.kind} ${i.a.toFixed(1)}-${i.b.toFixed(1)}`);
    out.masked = TL.meta.masked;
    return out;
  };
  window.tokensFor = li => COMPS[li].lay.toks.map(tk => tk.text);   // used only by the word-diff check

  // ---- render.mjs interface ------------------------------------------------------------------
  window.renderAt = async (t, type = 'image/png', q = 0.92) => { frame(t); return canvas.toDataURL(type, q); };
  window.renderSheet = async (times, cols = 3, w = 640, crop = null) => {
    const [cx, cy, cw, chh] = crop || [0, 0, W, H], h = Math.round(w * chh / cw), rows = Math.ceil(times.length / cols);
    const sc = document.createElement('canvas'); sc.width = cols * w; sc.height = rows * h;
    const c = sc.getContext('2d'), ms = [];
    for (let i = 0; i < times.length; i++) {
      const t0 = performance.now(); frame(times[i]); ms.push(Math.round(performance.now() - t0));
      const x = (i % cols) * w, y = Math.floor(i / cols) * h;
      c.drawImage(canvas, cx, cy, cw, chh, x, y, w, h);
      c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(x, y, 84, 22); c.fillStyle = '#fff'; c.font = '14px sans-serif'; c.fillText(times[i].toFixed(2) + 's', x + 6, y + 16);
    }
    return { url: sc.toDataURL('image/jpeg', 0.9), ms };
  };
  window.gpuInfo = () => 'canvas2d';
  window.SPARK = { COMPS, INTER, LINES };

  // studio scrubber
  const s = document.getElementById('scrub'), lab = document.getElementById('tt');
  if (s && !location.search.includes('render')) {
    s.max = DUR;
    const go = () => { const t0 = performance.now(); frame(+s.value); lab.textContent = `${(+s.value).toFixed(2)}s, ${Math.round(performance.now() - t0)} ms`; };
    s.addEventListener('input', go); go();
  }
  window.ready = true;
})();
