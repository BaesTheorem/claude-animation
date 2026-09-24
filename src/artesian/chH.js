// Chapter H · 257.68–292.80 s · The land again. Verse 8 (lines 63–67) and the final chorus (68–73).
// See docs/artesian/STORYBOARD.md and BRIEF.md.
//
//   H1 257.68 [63] clear the timber   a log jam dams the new bore drain; the driller wrenches the key log out and heaves
//                                     it over his shoulder, the jam collapses, the water bursts through; hand1's pick
//                                     breaks the last lip on the beat and the camera runs with the water (whip-pan out)
//   H2 262.26 [64] glimmer / flash    close on the water: a gum leaf rides the current out of the dappled shade of the
//                                     coolibahs into the sun; soft glimmers in the shade, star glints in the sun; one
//                                     glint flares to white (flash cut)
//   H3 266.58 [65] belts of timber    tracking shot with the water's leading edge across the blazing plain, five parallax
//                                     layers; green comes up behind the water; a near trunk wipes past
//   H4 270.88 [66] hope and comfort   the squatter kneels at the stream, lifts the water in his cupped hands and drinks;
//                                     sheep drink, green shoots pop up on the beat, the homestead green behind
//   H5 275.08 [67] further down       high wide: the stream winds away to the horizon under the low sun; tilt up to sky
//   H6 278.79 [68–69] the rig         tilt down from the evening sky: the crew in silhouette at the rig, the driller's
//                                     blows on the odd beats, the last one for luck, then he shoulders the sledge
//   H7 284.62 [70–73] the rhyme       page turned back to the first page: the opening frame, green and full; pull back;
//                                     the colour lifts, then the contours un-draw; blank paper under the strip to the end
//
// Chapter-local helpers (nothing shared is edited): skyBand/speedLines/shimmer (copied from chA), probe/ik/reach
// (from chD, extended to the front view), pathOf, water (running water with shade/sun glints and a foaming front),
// wellhead, sprout, sil (a CAST look turned to silhouette), tool (sledge or pick in any colours).
(() => {
  const bt = n => OFF + n * BEAT;
  const GOLD = '#F2C15E', WLT = '#EAF6FA', GLINT = '#FFF8E4';

  // ---------- copied from chA ----------
  function skyBand(top, bot, y0, y1, o = {}) {
    seed(o.key || 'skyH');
    const x0 = o.x0 ?? -2400, x1 = o.x1 ?? 5200;
    const g = X.createLinearGradient(0, o.g0 ?? y0, 0, y1); g.addColorStop(0, top); g.addColorStop(o.split ?? 1, bot); g.addColorStop(1, bot);
    X.save(); X.globalAlpha = o.tone ?? .7; X.fillStyle = g; X.fillRect(x0, y0, x1 - x0, y1 - y0 + 4); X.restore();
    pshade(rectPts(x0, y0, x1 - x0, (y1 - y0) * .6), top, (o.hatch ?? .6) * .75, { still: true });
    pshade(rectPts(x0, y0 + (y1 - y0) * .35, x1 - x0, (y1 - y0) * .65 + 4), bot, (o.hatch ?? .6) * .5, { still: true, kind: 'v' });
  }
  function speedLines(k, dir = [1, 0], col = AP.graphite, key = 'spd') {
    if (k <= .02) return;
    seed(key);
    const n = Math.round(46 * k), hor = Math.abs(dir[0]) > Math.abs(dir[1]);
    for (let i = 0; i < n; i++) {
      const a = hash(i * 3.7 + BOILN), b = hash(i * 5.1 + BOILN * .7), L = (220 + 700 * hash(i * 9.1)) * k;
      const p = hor ? [a * (W + 400) - 200, b * 900] : [a * W, b * (H + 400) - 200];
      pline([p, [p[0] + (hor ? L : 0), p[1] + (hor ? 0 : L)]], .8 + 1.6 * hash(i), col, { over: 0, passes: 1, alpha: .35 + .5 * k, taper: .9 });
    }
    pshade(rectPts(-40, -40, W + 80, H + 80), col, .35 * k, { kind: hor ? 'h' : 'v' });
  }
  let sc = null;
  function shimmer(t, y0, y1, amp) {
    if (amp <= .05) return;
    y0 = Math.max(0, Math.round(y0)); y1 = Math.min(H, Math.round(y1)); const h = y1 - y0; if (h < 8) return;
    if (!sc) { const c = document.createElement('canvas'); c.width = W; c.height = H; sc = c.getContext('2d'); }
    sc.setTransform(1, 0, 0, 1, 0, 0); sc.clearRect(0, 0, W, h); sc.drawImage(X.canvas, 0, y0, W, h, 0, 0, W, h);
    X.save(); X.setTransform(1, 0, 0, 1, 0, 0); X.clearRect(0, y0, W, h);
    for (let y = 0; y < h; y += 3) {
      const k = Math.sin(y / h * Math.PI), dx = amp * k * (Math.sin(t * 7.3 + y * .19) + .5 * Math.sin(t * 13.1 - y * .07));
      X.drawImage(sc.canvas, 0, y, W, 3, dx, y0 + y, W, 3);
    }
    X.restore();
  }

  // ---------- figures: probe the rig for joints, solve arms to targets (from chD; front view added) ----------
  const _dc = document.createElement('canvas'); _dc.width = _dc.height = 8; const _dx = _dc.getContext('2d');
  function probe(fn) { const keep = X, z = ZOOM, pc = PCAM; X = _dx; try { return fn(); } finally { X = keep; ZOOM = z; PCAM = pc; } }
  function ik(sh, tg, s, look, d) {
    const tall = look.tall || 1, up = 1.5 * s * tall, fl = 1.4 * s * tall + .32 * s;
    const vx = tg[0] - sh[0], vy = tg[1] - sh[1], D = clamp(Math.hypot(vx, vy), Math.abs(up - fl) + 1, up + fl - .5);
    const ang = Math.atan2(vx * d, vy), al = Math.acos(clamp((up * up + D * D - fl * fl) / (2 * up * D), -1, 1));
    const a1 = ang + (ang >= 0 ? -1 : 1) * al;
    const el = [sh[0] + Math.sin(a1) * d * up, sh[1] + Math.cos(a1) * up];
    let e = Math.atan2((tg[0] - el[0]) * d, tg[1] - el[1]) - a1;
    while (e > Math.PI) e -= TAU; while (e < -Math.PI) e += TAU;
    return [a1, e];
  }
  function reach(key, x, y, s, pose, look, tgt, hooks = {}) {
    const P = { ...pose }, front = P.view === 'front', d = P.flip ? -1 : 1;
    if (tgt) {
      const J0 = probe(() => man(x, y, s, P, look));
      if (tgt.F) [P.shF, P.elF] = ik(J0.shF, tgt.F, s, look, front ? 1 : d);
      if (tgt.B) [P.shB, P.elB] = ik(J0.shB, tgt.B, s, look, front ? -1 : d);
    }
    seed(key); return man(x, y, s, P, look, hooks);
  }
  // a CAST look drawn as a silhouette against the evening sky (k: how far into the dark)
  const SILC = '#2A2430';
  function sil(L, k = .86) {
    const o = { ...L };
    for (const f of ['skin', 'skinDk', 'shirt', 'pants', 'hatCol', 'beardCol', 'hair', 'braces', 'vest', 'boots', 'check', 'chain', 'apron']) if (L[f]) o[f] = mixCol(L[f], SILC, k);
    return o;
  }
  // a two-handed tool gripped at `grip`, handle along `ang`: kind 'sledge' | 'pick'. Colours overridable (silhouettes).
  function tool(grip, ang, s, o = {}) {
    seed('tool' + (o.key ?? ''));
    const u = [Math.cos(ang), Math.sin(ang)], n = [-u[1], u[0]], len = o.len ?? 3;
    const butt = [grip[0] - u[0] * .9 * s, grip[1] - u[1] * .9 * s], hd = [grip[0] + u[0] * len * s, grip[1] + u[1] * len * s];
    pfill(limb([butt, hd], [.22 * s, .26 * s]), o.handle || AP.pine, { tone: .7, sw: .9, ink: o.ink });
    const q = (x, y) => [hd[0] + n[0] * x + u[0] * y, hd[1] + n[1] * x + u[1] * y];
    if (o.kind === 'pick') {
      // a curved double-pointed head across the handle
      pfill([q(-1.6 * s, -.05 * s), q(-.9 * s, -.22 * s), q(0, -.3 * s), q(.9 * s, -.22 * s), q(1.6 * s, -.05 * s), q(.9 * s, .12 * s), q(0, .22 * s), q(-.9 * s, .12 * s)], o.head || AP.iron, { tone: .9, dens: 1, sw: 1, curv: true, ink: o.ink });
      return { head: hd, tipA: q(1.6 * s, -.05 * s), tipB: q(-1.6 * s, -.05 * s) };
    }
    const hw = .5 * s, hl = 1.0 * s;
    pfill([q(-hl, -hw), q(hl, -hw), q(hl, hw), q(-hl, hw)], o.head || AP.iron, { tone: .9, dens: 1, sw: 1.1, ink: o.ink });
    if (!o.dark) plit([q(-hl * .8, -hw * .8), q(hl * .8, -hw * .8), q(hl * .8, -hw * .3), q(-hl * .8, -hw * .3)], .6);
    return { head: hd, faceA: q(hl, 0), faceB: q(-hl, 0) };
  }

  // ---------- running water ----------
  function pathOf(P, n = 6) {
    const C = through(P, n), cum = [0];
    for (let i = 1; i < C.length; i++) cum.push(cum[i - 1] + Math.hypot(C[i][0] - C[i - 1][0], C[i][1] - C[i - 1][1]));
    const L = cum[cum.length - 1];
    const at = u => {
      const d = clamp(u) * L; let i = 1; while (i < C.length - 1 && cum[i] < d) i++;
      const k = (d - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1), dx = C[i][0] - C[i - 1][0], dy = C[i][1] - C[i - 1][1], m = Math.hypot(dx, dy) || 1;
      return [lerp(C[i - 1][0], C[i][0], k), lerp(C[i - 1][1], C[i][1], k), dx / m, dy / m];
    };
    return { C, L, at };
  }
  // Water running along the centreline P (world). o: w (px, or fn(u) for perspective), front (0..1 of the path filled,
  // with a foaming tongue at its end), speed (px/s along the path), sun(x, y) → 0..1 lit (default 1), col, key,
  // ripples / glints (counts), gs (glint size), bank (px of wet dark earth either side)
  function water(P, t, o = {}) {
    const key = o.key || 'w', path = pathOf(P), fr = clamp(o.front ?? 1), wAt = u => typeof o.w === 'function' ? o.w(u) : (o.w ?? 40);
    const sunK = o.sun || (() => 1), spd = (o.speed ?? 200) / path.L, gs = o.gs ?? 1;
    if (fr <= .002) return path;
    const n = Math.max(6, Math.round(60 * fr)), pts = [], ws = [];
    for (let i = 0; i <= n; i++) { const u = fr * i / n, a = path.at(u); pts.push([a[0], a[1]]); ws.push(wAt(u) * (fr < 1 ? lerp(1, .5, Math.pow(i / n, 12)) : 1)); }
    seed('wb' + key);
    if (o.bank) pshade(limb(pts, ws.map(w => w + o.bank * 2), 2), AP.earthDk, .8);
    const body = limb(pts, ws, 2), col = o.col || AP.water;
    pfill(body, col, { tone: .72, dens: .95, ink: null, still: true });
    pshade(limb(pts.map((p, i) => [p[0], p[1] + ws[i] * .12]), ws.map(w => w * .5), 2), o.deep || AP.waterDk, .5, { still: true });
    plit(limb(pts.map((p, i) => [p[0], p[1] - ws[i] * .3]), ws.map(w => w * .2), 2), .55, o.sky || WLT, { still: true });
    const h = body.length / 2;
    pline(body.slice(0, h), o.sw ?? 1.3, o.edge || AP.waterDk, { over: 0, passes: 1 });
    pline(body.slice(h), o.sw ?? 1.3, o.edge || AP.waterDk, { over: 0, passes: 1 });
    // ripples running with the flow
    seed('wr' + key);
    for (let i = 0; i < (o.ripples ?? 40); i++) {
      const u = frac(hash(i * 3.7 + 1) + t * spd); if (u > fr - .015) continue;
      const a = path.at(u), w = wAt(u), off = (hash(i * 5.3) - .5) * .75 * w, c = [a[0] - a[3] * off, a[1] + a[2] * off], lv = sunK(c[0], c[1]);
      const l = (10 + 26 * hash(i * 7.1)) * Math.min(1, w / 30), bow = (hash(i) - .5) * l * .3;
      const tw = .5 + .5 * Math.sin(t * (2 + 2 * hash(i)) + i);
      pline([[c[0] - a[2] * l / 2 - a[3] * bow, c[1] - a[3] * l / 2 + a[2] * bow], c, [c[0] + a[2] * l / 2 - a[3] * bow, c[1] + a[3] * l / 2 + a[2] * bow]], 1 + .6 * lv, lv > .5 ? GLINT : o.sky || AP.waterLt,
        { over: 0, passes: 1, curv: true, alpha: lerp(.25 + .35 * tw, .7, lv) });
    }
    // glints: star flashes where the sun is on the water, faint glimmers in the shade
    seed('wg' + key);
    for (let i = 0; i < (o.glints ?? 16); i++) {
      const u = frac(hash(i * 9.1 + 4) + t * spd * .9); if (u > fr - .02) continue;
      const a = path.at(u), w = wAt(u), off = (hash(i * 2.9) - .5) * .6 * w, c = [a[0] - a[3] * off, a[1] + a[2] * off], lv = sunK(c[0], c[1]);
      const ph = frac(t * (.7 + .6 * hash(i * 4.4)) + hash(i * 6.6)), f = Math.max(0, 1 - Math.abs(ph - .5) * 7);
      if (f <= 0) continue;
      const r = (8 + 12 * hash(i)) * gs * Math.min(1.2, w / 40 + .3);
      if (lv > .35) {
        pglow(c[0], c[1], r * 4 * f, '#FFF1C8', f * lv);
        pline([[c[0] - r * f, c[1]], [c[0] + r * f, c[1]]], 1.3, GLINT, { over: 0, passes: 1, alpha: f });
        pline([[c[0], c[1] - r * .6 * f], [c[0], c[1] + r * .6 * f]], 1.1, GLINT, { over: 0, passes: 1, alpha: f });
      } else pline([[c[0] - r * .8, c[1]], [c[0] + r * .8, c[1]]], 1, WLT, { over: 0, passes: 1, alpha: .55 * f });
    }
    if (fr < 1) {   // the leading edge: a foaming tongue, dark wet earth just ahead of it
      seed('wf' + key);
      const a = path.at(fr), w = wAt(fr);
      pshade(ellPts(a[0] + a[2] * w * .5, a[1] + a[3] * w * .5, w * .8, w * .4, 12), AP.earthDk, .8);
      for (let i = 0; i < 7; i++) { const off = (i / 6 - .5) * w * .8, back = w * (.1 + .5 * hash(i + BOILN * .1)), c = [a[0] - a[2] * back - a[3] * off, a[1] - a[3] * back + a[2] * off];
        pline([[c[0] - a[3] * 5, c[1] + a[2] * 5], [c[0] + a[2] * 8, c[1] + a[3] * 8], [c[0] + a[3] * 5, c[1] - a[2] * 5]], 1.2, WLT, { over: 0, passes: 1, curv: true, alpha: .9 }); }
      psmoke(a[0], a[1], w * .45, '#E4F2F7', .35);
    }
    return path;
  }
  // the bore casing standing out of the ground at (x, y), water welling over its collar and spilling down both sides
  function wellhead(x, y, t, s = 1, o = {}) {
    seed('wellhead' + (o.key || ''));
    const top = y - 70 * s, pw = 20 * s, dk = o.dark;
    pfill(rectPts(x - pw, top, 2 * pw, y - top), dk ? SILC : AP.iron, { tone: .85, dens: 1, sw: 1.2 });
    if (!dk) plit(rectPts(x - pw * .7, top + 4, pw * .4, y - top - 8), .5);
    pfill(rectPts(x - pw * 1.4, top - 8 * s, 2.8 * pw, 14 * s), dk ? SILC : AP.ironLt, { tone: .85, sw: 1.1 });
    const bob = Math.sin(t * 9) * 2 * s, wc = o.col || AP.water, wl = o.lt || WLT;
    pfill(ellPts(x, top - 12 * s + bob, pw * 1.7, 15 * s, 16), wc, { tone: .75, dens: .9, ink: o.edge || AP.waterDk, sw: 1 });
    plit(ellPts(x - pw * .4, top - 17 * s + bob, pw * .8, 4 * s, 10), .8, wl);
    for (const sd of [-1, 1]) {
      pfill([[x + sd * pw, top - 16 * s], [x + sd * pw * 1.9, top - 6 * s], [x + sd * pw * 2.3, top + 30 * s], [x + sd * pw * 2.3, y + 2], [x + sd * pw * 1.3, y + 2], [x + sd * pw * 1.35, top + 18 * s], [x + sd * pw * .9, top]],
        o.sheet || AP.waterLt, { tone: .5, dens: .7, kind: 'v', ink: null, curv: true });
      for (let i = 0; i < 5; i++) { const k = frac(t * 2.2 + i / 5 + (sd > 0 ? .1 : 0)), px = x + sd * pw * (1.5 + .6 * hash(i + sd)), py = lerp(top, y, k); pline([[px, py - 14 * s], [px + sd * 1.5, py]], 1.1, wl, { over: 0, passes: 1, alpha: .85 }); }
    }
    for (let i = 0; i < 4; i++) psmoke(x + (hash(i) - .5) * pw * 5, y - 4 * s - hash(i + 2) * 10 * s, (10 + 12 * hash(i + 4)) * s, o.mist || '#E4F2F7', .4);
  }
  // a green shoot at (x, y) that springs up over [t0, t0 + .5]
  function sprout(x, y, s, t, t0, key) {
    const k = backOut(seg(t, t0, t0 + .5)); if (k <= 0) return;
    seed('sp' + key);
    const sw = Math.sin(t * 1.7 + x * .01) * .08, top = [x + sw * s * 2, y - 2.2 * s * k];
    pline([[x, y], [x + sw * s, y - 1.1 * s * k], top], Math.max(.8, s * .09), AP.sap, { over: 0, passes: 1, curv: true, taper: .5 });
    for (const sd of [-1, 1]) { const b = lerp2([x, y], top, .75), c = [b[0] + sd * .7 * s * k, b[1] - .35 * s * k];
      pfill(ellPts(c[0], c[1], .55 * s * k, .22 * s * k, 8, 0, sd * -.5), sd > 0 ? AP.grass : AP.leaf, { tone: .75, dens: .8, sw: .7 }); }
  }
  // a near trunk passing the lens (screen space): x = left edge, w = width
  function nearTrunk(x, w, key) {
    seed('nt' + key);
    const pts = [[x + w * .04, -60], [x + w * .96, -60], [x + w, 400], [x + w * .97, H + 60], [x + w * .02, H + 60], [x - w * .02, 500]];
    pfill(pts, mixCol(AP.timberDk, AP.graphite, .45), { tone: .9, dens: .9, sw: 2, kind: 'v', curv: true });
    for (let i = 0; i < 9; i++) { const bx = x + w * (.1 + .8 * hash(i * 3.3)); pline([[bx, -40], [bx + (hash(i) - .5) * 30, 300], [bx + (hash(i + 1) - .5) * 40, H + 40]], 2.4, AP.coal, { over: 0, passes: 1, curv: true, alpha: .6 }); }
    pline([[x + w * .03, -40], [x - w * .01, 500], [x + w * .03, H + 40]], 5, mixCol(GOLD, AP.timber, .4), { over: 0, passes: 1, alpha: .55, curv: true });
  }

  // ---------- hammer cycle (from chA): a blow on every odd beat ----------
  const DOWN = { view: 'side', lean: .5, shF: .95, elF: -.05, shB: .8, elB: .05, hpF: .5, knF: .6, hpB: -.3, knB: .35, head: .25, face: 'shout', mouth: .45 };
  const UP = { view: 'side', lean: -.15, shF: TAU - 2.5, elF: .55, shB: TAU - 2.35, elB: .4, hpF: .25, knF: .15, hpB: -.2, knB: .1, head: -.3, face: 'grit', mouth: 0 };
  const MID = { view: 'side', lean: .25, shF: .5, elF: .3, shB: .35, elB: .35, hpF: .35, knF: .35, hpB: -.25, knB: .2, head: .05, face: 'grit', mouth: .1 };
  function hammerPose(t, lag = 0) {
    const q = frac((bpOf(t) - 1) / 2 - lag);
    if (q < .06) return { P: { ...DOWN, squash: .06 }, off: .35, q };
    if (q < .3) { const k = easeOut(seg(q, .06, .3)); return { P: kp(k, [[0, DOWN], [1, MID]]), off: lerp(.35, .1, k), q }; }
    if (q < .84) { const k = seg(q, .3, .84); return { P: kp(k, [[0, MID], [1, UP]], easeOut), off: lerp(.1, .75, easeOut(k)), q }; }
    const k = seg(q, .84, 1); return { P: kp(k, [[0, UP], [1, DOWN]], easeIn), off: lerp(.75, .35, easeIn(k)), q };
  }
  function sparks(p, e, big = 1, key = 'spk') {    // e: seconds since the blow
    if (e < 0 || e > .45) return;
    const k = e / .45; seed(key);
    pglow(p[0], p[1], 190 * big * (1 - k * .5), AP.lamp, 1 - k);
    for (let i = 0; i < 12 + 8 * big; i++) { const a = -Math.PI * (.08 + .84 * hash(i * 3.3)), r = (40 + 150 * hash(i)) * (.4 + k) * big;
      pline([[p[0] + Math.cos(a) * r * .55, p[1] + Math.sin(a) * r * .55 + e * e * 400], [p[0] + Math.cos(a) * r, p[1] + Math.sin(a) * r + e * e * 400]], 1.6, i % 3 ? AP.lamp : GLINT, { over: 0, passes: 1, alpha: 1 - k * .8 }); }
  }

  // ================= H1 · 257.68–262.26 · clear away the timber and let the water run =================
  const G1 = 832, CHY = 866, WELL = 420, JAM = 1100, LIP = 1790;
  const DRILL1 = 1330, HAND1 = 1905;
  function front1(t) {          // the water's leading edge (world x)
    if (t < 258.95) return JAM - 12 + 4 * Math.sin(t * 7);
    if (t < 260.32) return Math.min(LIP - 30, JAM + (t - 258.95) * 520 + Math.pow(t - 258.95, 2) * 260);
    const d = t - 260.32; return LIP + 10 + d * 430 + d * d * 60;
  }
  const drainP = (() => { const P = []; for (let i = 0; i <= 24; i++) { const x = WELL + 60 + i * 220; P.push([x, CHY + 5 * Math.sin(i * 1.3) * (i > 1 ? 1 : 0)]); } return P; })();
  const drainPath = pathOf(drainP), uOfX = x => clamp((x - drainP[0][0]) / (drainP[drainP.length - 1][0] - drainP[0][0]));
  // the key log: its top end in the driller's hands (world), its foot in the jam until it's wrenched free, then thrown
  const LOGL = 360;
  const REL = 259.45, LAND = [960, 796], LANDT = 259.85;
  function logState(t, hands) {
    const seg2 = (c, ang, hl) => ({ a: [c[0] - Math.cos(ang) * hl, c[1] - Math.sin(ang) * hl], b: [c[0] + Math.cos(ang) * hl, c[1] + Math.sin(ang) * hl] });
    // gripped by its top end, its foot in the jam; wrenched free; then hoisted and held by the middle overhead
    const foot = t < 258.9 ? [JAM + 10, CHY + 6] : [JAM + 10 + 60 * seg(t, 258.9, 259.1), CHY + 6 - 90 * easeOut(seg(t, 258.9, 259.1))];
    const d = Math.hypot(hands[0] - foot[0], hands[1] - foot[1]) || 1, top = [foot[0] + (hands[0] - foot[0]) / d * LOGL, foot[1] + (hands[1] - foot[1]) / d * LOGL];
    const cG = lerp2(foot, top, .5), aG = Math.atan2(top[1] - foot[1], top[0] - foot[0]);
    if (t < REL) {
      const k = ease(seg(t, 259.0, 259.3));
      if (k <= 0) return { a: foot, b: top, held: true };
      return { ...seg2(lerp2(cG, add2(hands, [8, -16]), k), lerp(aG, -.1, k), LOGL / 2), held: true };
    }
    // released forward over the jam: it tumbles half a turn and lands on the far bank
    const k = seg(t, REL, LANDT), c = arcPt(add2(hands, [-30, 10]), LAND, 150, k);
    const ang = lerp(-.1, -.1 - Math.PI, ease(k)) + (k >= 1 ? spring(t, LANDT, 9, 26) * .06 : 0);
    return { ...seg2(c, ang, LOGL / 2 * lerp(1, .88, k)), held: false, landed: k >= 1 };
  }
  function drawLog(L, key = 'keylog', s = 1) {
    seed(key);
    const sh = limb([L.a, lerp2(L.a, L.b, .5), L.b], [54 * s, 48 * s, 40 * s]);
    pfill(sh, '#8C7A66', { tone: .7, dens: .9, sw: 1.3 });
    X.save(); tracePath(sh); X.clip(); pshade(limb([L.a, L.b].map(p => [p[0] + 6, p[1] + 8]), [18 * s, 12 * s]), AP.graphite, .7); X.restore();
    pline([lerp2(L.a, L.b, .1), lerp2(L.a, L.b, .8)].map(p => [p[0] - 5, p[1] - 6]), 1, AP.paperLt, { over: 0, passes: 1, alpha: .6 });
    const d = [L.b[0] - L.a[0], L.b[1] - L.a[1]], m = Math.hypot(...d) || 1, br = lerp2(L.a, L.b, .62);   // a snapped branch stub
    pfill(limb([br, [br[0] - d[1] / m * 40 + d[0] / m * 20, br[1] + d[0] / m * 40 + d[1] / m * 20]], [12 * s, 6 * s]), '#8C7A66', { tone: .7, sw: 1 });
    pfill(ellPts(L.b[0], L.b[1], 14 * s, 16 * s, 10, 1, Math.atan2(d[1], d[0])), '#C9B08A', { tone: .8, sw: 1 });   // cut end
  }
  // sticks of the jam: piled against the log, then carried off by the water
  function jam(t) {
    const burst = seg(t, 258.95, 260.8), fx = front1(t);
    // three logs stacked across the drain and a tangle of dead branches; the key log leans out of the pile
    [[JAM - 70, CHY - 4, 250, 34, .02], [JAM - 40, CHY - 30, 220, 30, -.06], [JAM - 10, CHY - 52, 170, 26, .1]].forEach(([x0, y0, len, w, a0], i) => {
      let c = [x0 + len / 2, y0], a = a0, go = 0;
      if (t > 258.95) { go = Math.pow(burst, 1.4) * (380 + 260 * i); c = [Math.min(c[0] + go, fx - len * .4), lerp(y0, CHY + 2, easeOut(seg(t, 258.95, 259.4 + i * .1)))]; a = a0 * (1 - burst) + Math.sin(t * 2.3 + i) * .06; }
      const u = [Math.cos(a) * len / 2, Math.sin(a) * len / 2];
      drawLog({ a: [c[0] - u[0], c[1] - u[1]], b: [c[0] + u[0], c[1] + u[1]] }, 'jamlog' + i, w / 34);
    });
    seed('jam');
    for (let i = 0; i < 9; i++) {
      const x0 = JAM - 60 + i * 26 + (hash(i) - .5) * 20, len = 60 + 60 * hash(i * 3), a0 = -1.1 + hash(i * 5) * 2.2;
      let c = [x0, CHY - 40 - 26 * hash(i + 2)], a = a0;
      if (t > 258.95) { const go = Math.pow(burst, 1.2) * (500 + 600 * hash(i * 7)); c = [Math.min(x0 + go, fx - 20), lerp(c[1], CHY + Math.sin(t * 4 + i) * 3, seg(t, 258.95, 259.5))]; a = a0 * (1 - burst) + Math.sin(t * 2 + i) * .15; }
      pline([[c[0] - Math.cos(a) * len / 2, c[1] - Math.sin(a) * len / 2], [c[0] + Math.cos(a) * len / 2, c[1] + Math.sin(a) * len / 2]], 2.4, '#6E5E4E', { over: 0 });
    }
  }
  // the dammed water piled up behind the jam (world), falling as it breaks
  function dammed(t) {
    const k = t < 258.95 ? 1 : 1 - easeOut(seg(t, 258.95, 259.7)); if (k <= 0) return;
    seed('dammed');
    const top = CHY - 20 - 34 * k, P = [[WELL + 150, CHY - 20], [WELL + 300, top + 8], [JAM - 200, top], [JAM - 80, top - 6 + 3 * Math.sin(t * 8)], [JAM - 40, CHY - 10], [JAM - 40, CHY + 22], [WELL + 150, CHY + 22]];
    pfill(P, AP.water, { tone: .75, dens: .95, ink: AP.waterDk, sw: 1.2, curv: true });
    plit([[WELL + 320, top + 12], [JAM - 200, top + 6], [JAM - 200, top + 12], [WELL + 320, top + 18]], .7, WLT);
    for (let i = 0; i < 5; i++) { const x = lerp(WELL + 350, JAM - 120, hash(i)), y = top + 16 + 20 * hash(i + 3); pline([[x, y], [x + 30, y]], 1.2, WLT, { over: 0, passes: 1, alpha: .5 + .5 * Math.sin(t * 5 + i) }); }
    for (let i = 0; i < 4; i++) { const k2 = frac(t * 1.8 + i / 4), x = JAM - 30 + i * 30, y = lerp(CHY - 30, CHY + 10, k2); pline([[x, y - 12], [x + 2, y]], 1.2, WLT, { over: 0, passes: 1, alpha: k }); }
  }
  // where hand1 must stand so the pick's point lands on the lip on the strike, and how high the lip mound stands
  let _pg = null;
  function pickGeo() {
    if (_pg) return _pg;
    const pJ = probe(() => man(0, G1 - 2, 54, { ...DOWN, flip: true }, CAST.hand1)), pa = pJ.angF + .35 * pJ.dir, pu = [Math.cos(pa), Math.sin(pa)], ph = add2(pJ.handF, [pu[0] * 3 * 54, pu[1] * 3 * 54]);
    const tA = add2(ph, [-pu[1] * 1.6 * 54, pu[0] * 1.6 * 54]), tB = add2(ph, [pu[1] * 1.6 * 54, -pu[0] * 1.6 * 54]), tip = tA[1] > tB[1] ? tA : tB;
    return (_pg = { pickX: LIP - tip[0], lipTop: tip[1] - 2 });
  }
  function shotH1(t, lt, dur) {
    LIGHT = [.8, .55];
    const fx = front1(t), whip = easeIn(seg(lt, dur - .32, dur));
    const run = ease(seg(t, 260.7, 261.8)), cx = lerp(1360, fx - lerp(420, 260, run), ease(seg(t, 260.3, 261.3))) + whip * 1500, cy = lerp(kf(t, [[257.68, 672], [258.9, 664], [259.25, 612], [259.7, 630], [260.3, 668]]), CHY - 150, run), z = lerp(lerp(1.24, 1.2, ease(lt / 2.5)), 1.35, run);
    camOn(cx, cy, z);
    const HZ = 560;
    skyBand('#86B4CF', '#F3D39A', -900, HZ + 30, { key: 'h1sky', tone: .75, g0: -300, x1: 7000 });
    pglow(-120, 360, 900, GOLD, .5); pglow(-120, 360, 300, '#FFF4DC', .5);
    seed('h1far');
    const ridge = []; for (let k = 0; k <= 40; k++) ridge.push([lerp(-900, 7000, k / 40), HZ - 8 - 14 * Math.max(0, Math.sin(k * .8 + 1)) * hash(k)]);
    ptone(ridge.concat([[7000, HZ + 8], [-900, HZ + 8]]), '#A9B07A', .45);
    const gnd = [[-900, HZ], [7000, HZ], [7000, 1300], [-900, 1300]];
    const g = X.createLinearGradient(0, HZ, 0, 900); g.addColorStop(0, '#DCC68E'); g.addColorStop(1, '#B4A064');
    X.save(); X.globalAlpha = .82; X.fillStyle = g; tracePath(gnd); X.fill(); X.restore();
    pshade(gnd, '#C9A77A', .5, { still: true });
    pline([[-900, HZ], [7000, HZ]], .9, AP.graphiteLt, { over: 0, passes: 1 });
    // belts of timber on the horizon and coolibahs along the drain further down
    for (let i = 0; i < 26; i++) { const x = -600 + i * 290 + 90 * hash(i * 3); tree(x, HZ + 6 + 8 * hash(i), 7 + 5 * hash(i * 2), { key: 'h1b' + i, leafCol: mixCol(AP.leaf, '#A9B07A', .35), sway: .5 }); }
    for (const [x, s] of [[2500, 34], [3100, 40], [3900, 30], [4600, 44]]) { pshade(ellPts(x + 150, CHY - 40, 190, 14, 12), AP.graphite, .6); tree(x, CHY - 40, s, { key: 'h1t' + x, sway: 1 }); }
    // the derrick over the bore, its shadow, the casing flowing
    seed('h1shadow'); pshade([[WELL - 260, G1 + 4], [WELL + 260, G1 + 4], [WELL + 700, G1 + 34], [WELL + 200, G1 + 34]], AP.graphite, .55);
    derrick(WELL, G1, 1150, { key: 'h1', floor: false });
    // hand2 by the derrick, leaning on his shovel, cheering when the water breaks
    const ch2 = seg(t, 259.05, 259.35) * (1 - seg(t, 261.2, 261.6));
    const h2P = kp(ch2, [[0, { view: 'side', lean: .08, shF: .7, elF: .9, shB: .5, elB: 1.1, hpF: .1, knF: .05, hpB: -.1, knB: .05, face: 'neutral', look: .6 }],
      [1, { view: 'side', lean: -.15, shF: 2.8, elF: .2, shB: .4, elB: .9, hpF: .1, knF: .05, hpB: -.1, knB: .05, head: -.3, face: 'shout', mouth: .5 }]]);
    seed('h1h2'); man(700, G1 - 4, 50, { ...h2P, dy: .12 * Math.abs(Math.sin((t - 259.1) * 8)) * ch2 }, CAST.hand2, { hold: J => { seed('h1shovel'); const g0 = ch2 > .5 ? J.handF : lerp2(J.handF, J.handB, .5), tipP = ch2 > .5 ? add2(g0, [10, -170]) : [g0[0] + 30, G1 + 2];
      pfill(limb([add2(g0, [-(tipP[0] - g0[0]) * .15, -(tipP[1] - g0[1]) * .15]), tipP], [7, 7]), AP.pine, { tone: .75, sw: .8 });
      pfill(ellPts(tipP[0], tipP[1] + (ch2 > .5 ? -12 : -8), 13, 20, 8), AP.iron, { tone: .9, sw: .9 }); } });
    // spoil heaps of fresh earth along the far edge of the new cut; the old drain beyond the lip is grassed
    seed('h1spoil');
    for (let i = 0; i < 16; i++) { const x = WELL + 150 + i * 90 + 30 * hash(i); if (x > LIP - 40) break; pfill(ellPts(x, CHY - 22, 58 + 20 * hash(i * 2), 13 + 6 * hash(i), 12, 2), '#9C6B43', { tone: .65, dens: .9, sw: .9 }); }
    for (let i = 0; i < 40; i++) { const x = LIP + 40 + i * 110 * (1 + hash(i)); pline([[x, CHY - 20], [x + (hash(i) - .5) * 10, CHY - 34 - 12 * hash(i + 1)]], 1, AP.sap, { over: 0, passes: 1 }); }
    // the trench: new cut (raw) up to the lip, the old drain (weathered) beyond
    seed('h1trench');
    const tr = [[WELL + 40, CHY - 18], [8000, CHY - 18], [8000, CHY + 22], [WELL + 40, CHY + 22]];
    pfill(tr, AP.earthDk, { tone: .75, dens: 1, ink: null, still: true });
    pshade(rectPts(WELL + 40, CHY - 18, 8000, 12), AP.coal, .8, { still: true });
    pline([[WELL + 40, CHY - 18], [8000, CHY - 18]], 1.2, AP.graphite, { over: 0, passes: 1 });
    // the uncut lip until the pick breaks it, then clods thrown
    const lt0 = pickGeo().lipTop;
    if (t < 260.32) { pfill([[LIP - 60, CHY + 22], [LIP - 50, CHY - 14], [LIP - 26, lt0 + 4], [LIP + 10, lt0], [LIP + 44, lt0 + 8], [LIP + 64, CHY - 16], [LIP + 70, CHY + 22]], '#B07A4A', { tone: .8, dens: 1, sw: 1.1, curv: true });
      pshade([[LIP - 20, lt0 + 30], [LIP + 30, lt0 + 26], [LIP + 64, CHY - 16], [LIP + 70, CHY + 22], [LIP - 20, CHY + 22]], AP.earthDk, .7); }
    else { const k = seg(t, 260.32, 261.1); if (k < 1) { seed('h1clods'); for (let i = 0; i < 7; i++) { const p = arcPt([LIP, lt0 + 10], [LIP - 160 + 320 * hash(i), CHY + 10], 60 + 90 * hash(i + 3), k); pfill(ellPts(p[0], p[1], 11, 8, 7, 1), '#9C6B43', { tone: .8, sw: .8 }); } } }
    // the pool round the casing, the drain filling to the front
    seed('h1pool'); pfill(ellPts(WELL + 20, CHY - 2, 150, 24, 24), AP.water, { tone: .7, dens: .9, ink: AP.waterDk, sw: 1.2 });
    dammed(t);
    water(drainP, t, { key: 'h1d', front: uOfX(fx), w: 32, speed: 380, bank: 0, ripples: 60, glints: 22, sun: () => .7 });
    wellhead(WELL, CHY - 10, t, 1, { key: 'h1' });
    jam(t);
    // the driller: grips the key log, wrenches it free, heaves it over his shoulder, then turns to watch the water go
    const hands = kf(t, [[257.68, [JAM + 190, 612]], [258.55, [JAM + 205, 600]], [258.95, [DRILL1 - 90, 520]], [259.3, [DRILL1 - 14, 232]], [REL, [DRILL1 - 170, 330]]], ease);
    const strain = t < 258.9 ? Math.sin(t * 60) * 3 * seg(t, 257.8, 258.2) : 0;
    const hk = add2(hands, [strain, 0]);
    let dP;
    if (t < 258.55) dP = { view: 'side', flip: true, lean: -.25 - .08 * seg(t, 257.7, 258.5), hpF: .5, knF: .35, hpB: -.4, knB: .35, head: .1, face: t < 258.05 ? 'grit' : 'wince', mouth: .15 };
    else if (t < REL) dP = kp(t, [[258.55, { view: 'side', flip: true, lean: -.35, hpF: .5, knF: .35, hpB: -.4, knB: .35, head: .1, face: 'grit' }], [258.95, { view: 'side', flip: true, lean: -.5, hpF: .6, knF: .45, hpB: -.45, knB: .3, head: -.1, face: 'shout', mouth: .5 }],
      [259.3, { view: 'side', flip: true, lean: -.2, hpF: .3, knF: .15, hpB: -.35, knB: .15, head: -.4, face: 'grit', squash: -.05 }], [REL, { view: 'side', flip: true, lean: .35, hpF: .55, knF: .45, hpB: -.4, knB: .2, head: -.1, face: 'shout', mouth: .8 }]]);
    else dP = kp(t, [[REL, { view: 'side', flip: true, lean: .35, shF: 1.9, elF: .1, shB: 1.8, elB: .15, hpF: .55, knF: .45, hpB: -.4, knB: .2, head: -.1, face: 'shout', mouth: .8 }],
      [259.75, { view: 'side', flip: true, lean: .45, shF: .9, elF: .3, shB: .7, elB: .4, hpF: .5, knF: .45, hpB: -.35, knB: .25, head: .1, face: 'grit' }],
      [260.1, { view: 'front', shF: 2.6, elF: -.35, shB: .5, elB: -1.9, head: -.15, face: 'laugh', look: .5 }]], ease);
    const L = logState(t, hk);
    if (!L.held) drawLog(L);
    if (L.landed) { const k = seg(t, LANDT, LANDT + 1); if (k < 1) { seed('h1logdust'); for (let i = 0; i < 7; i++) psmoke(LAND[0] + (hash(i) - .5) * 300 * (k + .3), LAND[1] - k * 50 * hash(i + 3), 20 + 50 * k, AP.dust, .6 * (1 - k)); } }
    seed('h1drill');
    if (t < REL) reach('h1drill', DRILL1, G1, 64, dP, CAST.driller, { F: hk, B: add2(hk, [26, 34]) }, { hold: () => drawLog(L) });
    else { seed('h1drill'); man(DRILL1, G1, 64, { ...dP, blink: t > 260.2 && t < 260.3 ? 1 : 0 }, CAST.driller); }
    // hand1 with the pick at the end of the cut: a stroke on each odd beat, the third breaks the lip; he hops clear
    const H = hammerPose(t), done = t > 260.34;
    const { pickX } = pickGeo(), pickY = G1 - 2;
    const hop = done ? Math.max(0, Math.sin(seg(t, 260.4, 260.8) * Math.PI)) : 0, back = done ? easeOut(seg(t, 260.4, 260.8)) * 90 : 0;
    const p1 = done ? kp(t, [[260.34, { ...DOWN, squash: .06 }], [260.6, { view: 'side', flip: true, lean: -.25, shF: 2.9, elF: .2, shB: 1.2, elB: .8, hpF: .4, knF: .5, hpB: -.3, knB: .4, head: -.3, face: 'laugh' }]]) : { ...H.P };
    seed('h1hand1');
    man(pickX + back, pickY, 54, { ...p1, flip: true, dy: hop * .8 }, CAST.hand1, { hold: J => tool(J.handF, J.angF + (done ? lerp(.35, -.4, seg(t, 260.34, 260.6)) : H.off) * J.dir, 54, { kind: 'pick', key: 'h1pick' }) });
    for (const b of [483, 485]) { const e = t - bt(b); if (e > 0 && e < .4) { seed('h1pd' + b); for (let i = 0; i < 5; i++) psmoke(LIP + (hash(i) - .5) * 80 * (e * 3 + .3), CHY - 20 - e * 80 * hash(i + 2), 12 + 30 * e, AP.dust, .6 * (1 - e / .4)); } }
    // splash where the water meets the lip and breaks through
    if (t > 259.8 && t < 261) { const k = seg(t, 260.32, 260.9); seed('h1splash'); for (let i = 0; i < 9; i++) { const a = -Math.PI * (.15 + .7 * hash(i)), r = (20 + 60 * hash(i + 4)) * (t < 260.32 ? .4 + .2 * Math.sin(t * 30 + i) : .5 + k); const c = [Math.min(fx, LIP) - 10, CHY - 10];
      pline([[c[0] + Math.cos(a) * r * .5, c[1] + Math.sin(a) * r * .5], [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]], 1.4, WLT, { over: 0, passes: 1, alpha: t < 260.32 ? .8 : 1 - k }); } }
    // the near bank: grass fringe
    seed('h1near'); pfill([[-900, CHY + 22], [8000, CHY + 22], [8000, 1300], [-900, 1300]], '#A89452', { tone: .7, dens: .9, ink: null, still: true });
    for (let i = 0; i < 90; i++) { const x = -600 + i * 70 + 40 * hash(i); pline([[x, CHY + 34], [x + (hash(i) - .5) * 14, CHY + 14 - 14 * hash(i + 2)]], 1.1, i % 3 ? AP.sap : '#8A7A48', { over: 0, passes: 1 }); }
    camOff();
    if (lt < .35) scribbleWipe(.5 + lt / .7);
    speedLines(whip, [1, 0], AP.graphite, 'h1whip');
  }

  // ================= H2 · 262.26–266.58 · how it glimmers in the shadow, how it flashes in the sun =================
  const SHADE_X = 1560;
  const camX2 = t => 760 + 1500 * ease(seg(t, 262.1, 266.7)) * .35 + 1500 * .65 * seg(t, 262.26, 266.58);
  const sun2 = (x, y) => clamp((x - SHADE_X + 40 * Math.sin(y * .03)) / 260);
  function shotH2(t, lt, dur) {
    LIGHT = [-.55, .8];
    const cx = camX2(t), arrive = 1 - easeOut(seg(lt, 0, .3)), flare = easeIn(seg(lt, dur - .4, dur));
    camOn(cx - arrive * 260, 540, 1);
    // above the far bank: canopy shade on the left, sunlit plain and sky on the right
    skyBand('#8EBAD4', '#F2D9A4', -200, 420, { key: 'h2sky', x0: -600, x1: 4200 });
    const SUN = [2700, 90]; pglow(SUN[0], SUN[1], 700, GOLD, .55); pglow(SUN[0], SUN[1], 200, '#FFFFFF', .6);
    seed('h2plain'); pfill([[SHADE_X - 300, 330], [4200, 320], [4200, 470], [SHADE_X - 300, 470]], '#D8C286', { tone: .75, dens: .8, ink: null, still: true });
    for (let i = 0; i < 8; i++) tree(SHADE_X + 200 + i * 300 + 80 * hash(i), 334, 8 + 4 * hash(i), { key: 'h2far' + i, sway: .6 });
    // the coolibahs on the far bank: trunks, dark canopy, their reflections
    const TR = [[180, 90], [640, 120], [1080, 80], [1380, 70]];
    seed('h2canopy');
    pfill([[-600, -300], [SHADE_X - 60, -300], [SHADE_X + 40, 20], [SHADE_X - 80, 200], [SHADE_X - 250, 300], [-600, 360]], mixCol(AP.leaf, AP.graphite, .35), { tone: .8, dens: 1.2, ink: null, curv: true });
    for (let i = 0; i < 26; i++) { const x = -500 + i * 80, y = 60 + 250 * hash(i * 2.1); if (x > SHADE_X + 20 - y * .5) continue; pfill(ellPts(x, y, 70 + 40 * hash(i), 40 + 20 * hash(i + 1), 12, 4), i % 2 ? AP.leaf : mixCol(AP.leaf, AP.sap, .4), { tone: .6, dens: 1, sw: .8, ink: mixCol(AP.leaf, AP.graphite, .5) }); }
    pfill([[-600, 300], [SHADE_X - 200, 300], [SHADE_X - 60, 470], [-600, 470]], mixCol(AP.leaf, AP.graphite, .55), { tone: .8, dens: 1.1, ink: null, still: true, curv: true });
    for (const [x, w] of TR) { seed('h2tr' + x);
      pfill([[x - w * .5, -300], [x + w * .5, -300], [x + w * .55, 400], [x + w * .8, 478], [x - w * .8, 478], [x - w * .55, 400]], '#9A8A78', { tone: .75, dens: 1, sw: 1.4, kind: 'v', curv: true });
      pshade([[x, -300], [x + w * .5, -300], [x + w * .55, 478], [x, 478]], AP.graphite, .8);
      for (let k = 0; k < 4; k++) pline([[x - w * .3 + k * w * .2, -200 + 100 * hash(k + x)], [x - w * .3 + k * w * .2 + 8, 300 + 80 * hash(k * 2 + x)]], 1, AP.graphite, { over: 0, passes: 1, alpha: .5 }); }
    // far bank: mud edge and grass, lit beyond the shade
    seed('h2bank');
    pfill([[-600, 452], [4200, 452], [4200, 486], [-600, 486]], '#8A6A48', { tone: .75, dens: .9, ink: null, still: true });
    pline([[-600, 486], [4200, 486]], 1.4, AP.graphite, { over: 0, passes: 1 });
    for (let i = 0; i < 120; i++) { const x = -560 + i * 40 + 20 * hash(i), lit = sun2(x, 460); pline([[x, 470], [x + (hash(i) - .5) * 10 + Math.sin(t * 1.4 + i) * 3, 432 - 26 * hash(i + 1)]], 1.2, mixCol(mixCol(AP.leaf, AP.graphite, .4), AP.grass, lit), { over: 0, passes: 1 }); }
    // the water: one broad surface, sky reflected far, deeper near
    seed('h2water');
    const wtop = 486, wbot = 900;
    const g = X.createLinearGradient(0, wtop, 0, wbot); g.addColorStop(0, '#A8D0E2'); g.addColorStop(.35, AP.water); g.addColorStop(1, AP.waterDk);
    X.save(); X.globalAlpha = .82; X.fillStyle = g; X.fillRect(-600, wtop, 4800, wbot - wtop + 200); X.restore();
    pshade(rectPts(-600, wtop, 4800, 600), AP.water, .8, { still: true });
    pshade(rectPts(-600, wtop + 200, 4800, 500), AP.waterDk, .45, { kind: 'x', still: true });
    // reflections: trunks wavering, the lit bank
    for (const [x, w] of TR) { seed('h2rf' + x); const P = []; for (let k = 0; k <= 8; k++) P.push([x + Math.sin(t * 3 + k * 1.3 + x) * 8 * k / 8, wtop + k * 40]); pshade(limb(P, P.map((_, k) => w * (1 - k / 12))), mixCol('#6A5A48', AP.waterDk, .4), .75); }
    // the canopy's shade over the water, ragged at its edge
    seed('h2shade');
    const edge = []; for (let k = 0; k <= 24; k++) { const y = lerp(wtop, wbot + 60, k / 24); edge.push([SHADE_X - 60 + (y - wtop) * .35 + 34 * Math.sin((y - wtop) / 70) + 6 * Math.sin(t * 1.3 + k), y]); }
    const shadeP = [[-600, wtop], ...edge, [-600, wbot + 60]];
    ptone(shadeP, AP.tealDk, .6); pshade(shadeP, AP.tealDk, 1.25, { still: true });
    // dapples: sun through the leaves, drifting as the canopy stirs (the glimmers)
    seed('h2dapple');
    for (let i = 0; i < 46; i++) {
      const x0 = -500 + hash(i * 3.1) * (SHADE_X + 300), y0 = wtop + 20 + hash(i * 7.3) * (wbot - wtop - 30); if (x0 > SHADE_X - 80 + (y0 - wtop) * .35) continue;
      const x = x0 + Math.sin(t * .9 + i) * 10, y = y0 + Math.cos(t * .7 + i * 2) * 4, r = (10 + 22 * hash(i)) * (.6 + (y0 - wtop) / 500), tw = .5 + .5 * Math.sin(t * 2.3 + i * 1.7);
      ptone(ellPts(x, y, r * 1.7, r * .35, 10, r * .12), '#9FD0E4', .22 + .2 * tw); plit(ellPts(x, y, r * 1.2, r * .22, 10, r * .1), .45 + .3 * tw, '#DCEFF5');
      if (tw > .6) pline([[x - r, y], [x + r * .9, y]], 1.2, WLT, { over: 0, passes: 1, alpha: (tw - .6) * 2 });
    }
    // flow: ripples in every lane, pale and soft in the shade, bright in the sun
    seed('h2rip');
    for (let i = 0; i < 150; i++) {
      const y = wtop + 14 + hash(i * 5.3) * (wbot - wtop - 20), depth = (y - wtop) / (wbot - wtop), sp = 340 * (.8 + .4 * hash(i));
      const x = -600 + frac(hash(i * 2.7) + (t - 262) * sp / 4800) * 4800, lv = sun2(x, y), l = (18 + 40 * hash(i * 7)) * (.6 + depth);
      pline([[x - l / 2, y + 2], [x, y - 2], [x + l / 2, y + 2]], 1 + depth * 1.4, lv > .5 ? GLINT : '#B8DAE8', { over: 0, passes: 1, curv: true, alpha: lv > .5 ? .8 : .3 + .25 * Math.sin(t * 3 + i) });
    }
    // the gum leaf riding the current
    const lx = cx + 70 + 30 * Math.sin(t * .8), ly = 700 + 22 * Math.sin(t * 1.1), la = .3 + .25 * Math.sin(t * .9);
    seed('h2leaf');
    pshade(ellPts(lx + 14, ly + 18, 115, 18, 12), AP.waterDk, 1);
    const leafP = []; for (let k = 0; k <= 10; k++) { const u = k / 10, w = Math.sin(u * Math.PI) * 30 * (1 - u * .4); leafP.push(rot2([lx - 115 + u * 230, ly - w + 20 * Math.sin(u * 2.5)], la, [lx, ly])); }
    for (let k = 10; k >= 0; k--) { const u = k / 10, w = Math.sin(u * Math.PI) * 22; leafP.push(rot2([lx - 115 + u * 230, ly + w + 20 * Math.sin(u * 2.5)], la, [lx, ly])); }
    const llit = sun2(lx, ly);
    pfill(leafP, mixCol(mixCol(AP.leaf, AP.graphite, .15), '#B8C45A', llit), { tone: .85, dens: 1, sw: 1.5, curv: true });
    if (llit > .3) plit(leafP.slice(2, 9).concat([[lx, ly]]), .6 * llit, '#FFF4C8');
    pline([0, .5, 1].map(u => rot2([lx - 118 + u * 236, ly + 20 * Math.sin(u * 2.5) - 2], la, [lx, ly])), 1.3, AP.graphite, { curv: true, over: 0, passes: 1 });
    // ripples it pushes, rings on the water
    for (let k = 0; k < 3; k++) { const r = frac(t * .8 + k / 3); pline(ellPts(lx - 40, ly + 4, 60 + r * 90, 10 + r * 16, 20).slice(5, 16), 1, llit > .5 ? GLINT : '#B8DAE8', { over: 0, passes: 1, alpha: .6 * (1 - r) }); }
    // glints in the sun: star flashes, crowded toward the sun's path
    seed('h2glint');
    for (let i = 0; i < 70; i++) {
      const x0 = SHADE_X + 80 + hash(i * 3.9) * 2400, y = wtop + 10 + Math.pow(hash(i * 8.1), 1.3) * (wbot - wtop - 20), x = x0 + ((t - 262) * 300) % 400;
      const lv = sun2(x, y) * clamp(1.2 - Math.abs(x - SUN[0]) / 1600); if (lv <= .05) continue;
      const ph = frac(t * (.8 + .7 * hash(i * 4.4)) + hash(i * 6.6)), f = Math.max(0, 1 - Math.abs(ph - .5) * 6); if (f <= 0) continue;
      const r = (14 + 26 * hash(i)) * (.6 + (y - wtop) / 500) * lv;
      pglow(x, y, r * 4 * f, '#FFF1C8', f); pline([[x - r * f, y], [x + r * f, y]], 1.6, GLINT, { over: 0, passes: 1, alpha: f }); pline([[x, y - r * .7 * f], [x, y + r * .7 * f]], 1.3, GLINT, { over: 0, passes: 1, alpha: f });
    }
    // the near bank: reeds, in shade then sun
    seed('h2near');
    for (let i = 0; i < 70; i++) { const x = -560 + i * 70 + 30 * hash(i), lit = sun2(x, 880), h = 60 + 90 * hash(i + 3);
      pline([[x, 905], [x + 14 * (hash(i) - .5) + Math.sin(t * 1.2 + i) * 6, 905 - h]], 2.2, mixCol(mixCol(AP.leaf, AP.graphite, .5), AP.sap, lit), { over: 0, passes: 1, taper: .8 }); }
    // the flare: a glint by the leaf blazes up to white
    if (flare > 0) { const fxp = lx + 140, fyp = ly - 10; pglow(fxp, fyp, lerp(60, 2600, flare), '#FFF6DC', 1.4 * flare); pglow(fxp, fyp, lerp(20, 600, flare), '#FFFFFF', 1.2 * flare); }
    camOff();
    if (flare > 0) ptone(rectPts(-40, -40, W + 80, H + 80), '#FFF8EA', clamp(flare * 1.1));
    speedLines(arrive, [1, 0], AP.graphite, 'h2whip');
  }

  // ================= H3 · 266.58–270.88 · by the silent belts of timber, by the miles of blazing plain =================
  const V3 = 560, TC3 = 270.88;
  function shotH3(t, lt, dur) {
    LIGHT = [.8, .5];
    const cam = V3 * (t - 266.58), HZ = 500, flash = 1 - easeOut(seg(lt, 0, .35));
    const layer = (f, fn) => { camOn(960 + cam * f, 540, 1); fn(); camOff(); };
    // sky and the sun behind us, low on the left
    skyBand('#86B4CF', '#F5D9A0', -100, HZ + 30, { key: 'h3sky', x0: -100, x1: W + 100, g0: 0 });
    pglow(120, 330, 800, GOLD, .5); pglow(120, 330, 240, '#FFF4DC', .55);
    // far: haze and the distant belts of timber
    layer(.05, () => { seed('h3far');
      const r = []; for (let k = 0; k <= 30; k++) r.push([lerp(-400, 3000, k / 30), HZ - 6 - 12 * Math.max(0, Math.sin(k * .9)) * hash(k)]);
      ptone(r.concat([[3000, HZ + 6], [-400, HZ + 6]]), '#B8B884', .45);
      for (let i = 0; i < 40; i++) { const x = -300 + i * 70 + 40 * hash(i * 3); if (hash(i * 7) < .35) continue; tree(x, HZ + 4, 4 + 3 * hash(i), { key: 'h3f' + i, leafCol: mixCol(AP.leaf, '#B8B884', .5), col: '#9A8A70' }); } });
    // the plain
    seed('h3plain');
    const gnd = [[-40, HZ], [W + 40, HZ], [W + 40, 1100], [-40, 1100]], g = X.createLinearGradient(0, HZ, 0, 900);
    g.addColorStop(0, '#E6CB8E'); g.addColorStop(1, '#C99A58'); X.save(); X.globalAlpha = .85; X.fillStyle = g; tracePath(gnd); X.fill(); X.restore();
    pshade(gnd, AP.dust, .5, { still: true }); pline([[-40, HZ], [W + 40, HZ]], .9, AP.graphiteLt, { over: 0, passes: 1 });
    // mid: the belts of timber, clumps with gaps of open plain
    layer(.28, () => { for (let i = 0; i < 30; i++) { const x = -200 + i * 150 + 60 * hash(i * 1.3); if (Math.floor(i / 5) % 2 && hash(i * 5) < .7) continue;
      pshade(ellPts(x + 70, 592, 90, 8, 10), AP.graphite, .5); tree(x, 590, 20 + 10 * hash(i * 2), { key: 'h3m' + i, sway: .6, leafCol: mixCol(AP.leaf, '#A9B07A', .2) }); } });
    // the plain's texture passing: tussocks and cracks, dry ahead of the water and greening behind
    const FX = cam + 1290;   // world x of the water's front (stream layer)
    layer(.62, () => { seed('h3tex');
      for (let i = 0; i < 160; i++) { const x = -200 + (i % 40) * 110 + 50 * hash(i), y = 620 + Math.floor(i / 40) * 34 + 16 * hash(i * 3), wet = clamp((FX * .62 / 1 - x) / 900);
        pline([[x, y], [x + 30 + 30 * hash(i + 2), y + 3 * (hash(i + 4) - .5)]], .9, mixCol(AP.earthDk, AP.leaf, wet * .6), { over: 0, passes: 1, alpha: .6 }); } });
    shimmer(t, 480, 600, 2.6);
    // the stream layer: the water's leading edge racing across the plain, green coming up behind it
    layer(1, () => {
      const P = []; for (let i = 0; i <= 30; i++) { const x = cam - 800 + i * 160; P.push([x, 770 + 26 * Math.sin(x / 260) + 12 * Math.sin(x / 97)]); }
      const path = pathOf(P), u0 = (FX - P[0][0]) / (P[P.length - 1][0] - P[0][0]);
      // green behind the front: a band of new grass along the banks
      seed('h3green');
      const gb = []; for (let i = 0; i <= 20; i++) { const x = lerp(cam - 800, FX, i / 20); gb.push([x, 770 + 26 * Math.sin(x / 260) + 12 * Math.sin(x / 97)]); }
      pfill(limb(gb, gb.map((_, i) => 230 * Math.pow(i / 20, .15) * (1 - Math.pow(i / 20, 8)) + 30)), AP.grass, { tone: .45, dens: .8, ink: null });
      // cracked mud ahead of it
      seed('h3cracks');
      for (let i = 0; i < 70; i++) { const x = cam - 900 + ((i * 97) % 3600), y = 660 + 220 * hash(i * 3.3); if (x < FX - 20) continue;
        pline([[x, y], [x + 26 * (hash(i) - .3), y + 14 * hash(i + 1)], [x + 50 * (hash(i + 2) - .3), y + 10]], .9, AP.earthDk, { over: 0, passes: 1, alpha: .75 }); }
      water(P, t, { key: 'h3', front: u0, w: 66, speed: 700, ripples: 70, glints: 24, bank: 3, sun: () => .9, gs: 1.3 });
      // grass springing up behind the front
      seed('h3sprigs');
      for (let i = 0; i < 90; i++) { const x = cam - 900 + ((i * 53.7) % 2400), sd = i % 2 ? 1 : -1, y = 770 + 26 * Math.sin(x / 260) + 12 * Math.sin(x / 97) + sd * (44 + 70 * hash(i)), h = clamp((FX - x) / 260) * (14 + 22 * hash(i + 5));
        if (h > 1) pline([[x, y], [x + (hash(i) - .5) * 8 + Math.sin(t * 1.3 + i) * 2, y - h]], 1.2, i % 3 ? AP.sap : AP.leaf, { over: 0, passes: 1 }); }
    });
    // near: tussocks and two trunks passing the lens
    layer(1.7, () => { seed('h3near');
      for (let i = 0; i < 80; i++) { const x = -200 + i * 90 + 50 * hash(i); pline([[x, 902], [x - 10 + 20 * hash(i + 1), 860 - 30 * hash(i + 2)]], 2, i % 4 ? '#9A8A50' : AP.sap, { over: 0, passes: 1, taper: .8 }); } });
    for (const [tx, w, f] of [[1500, 150, 2.2], [3200, 220, 2.4]]) { const x = tx - cam * f; if (x > -w - 20 && x < W + 20) nearTrunk(x, w, 'h3n' + tx); }
    // the wipe: a trunk right past the lens
    const xl = -90 - 4200 * (t - TC3); if (xl < W) { nearTrunk(xl, 2100, 'wipe'); speedLines(.3 * clamp((W - xl) / 600) * clamp(xl / 300 + 1), [1, 0], AP.graphite, 'h3wipe'); }
    if (flash > 0) { ptone(rectPts(-40, -40, W + 80, H + 80), '#FFF8EA', flash); pglow(1100, 500, 2000 * flash, '#FFF6DC', flash); }
  }

  // ================= H4 · 270.88–275.08 · it is bringing hope and comfort to the thirsty land again =================
  const SQX = 760, SQY = 742, SQS = 70;
  function shotH4(t, lt, dur) {
    LIGHT = [.75, .6];
    const cz = kf(t, [[270.88, [960, 560, 1]], [271.6, [920, 550, 1.06]], [273.0, [SQX + 110, 440, 1.72]], [275.08, [SQX + 120, 430, 1.78]]], ease);
    camOn(cz[0], cz[1], cz[2]);
    const HZ = 560;
    skyBand('#86B4CF', '#F4D8A0', -600, HZ + 30, { key: 'h4sky', g0: -200 });
    pglow(60, 300, 900, GOLD, .5); pglow(60, 300, 260, '#FFF4DC', .5);
    seed('h4far'); const r = []; for (let k = 0; k <= 30; k++) r.push([lerp(-900, 3000, k / 30), HZ - 8 - 14 * Math.max(0, Math.sin(k * .8)) * hash(k + 4)]);
    ptone(r.concat([[3000, HZ + 8], [-900, HZ + 8]]), '#A9B07A', .45);
    const gnd = [[-900, HZ], [3000, HZ], [3000, 1300], [-900, 1300]], g = X.createLinearGradient(0, HZ, 0, 900);
    g.addColorStop(0, '#C9C98A'); g.addColorStop(1, '#8FA254'); X.save(); X.globalAlpha = .82; X.fillStyle = g; tracePath(gnd); X.fill(); X.restore();
    pshade(gnd, AP.sap, .45, { still: true }); pline([[-900, HZ], [3000, HZ]], .9, AP.graphiteLt, { over: 0, passes: 1 });
    for (let i = 0; i < 16; i++) tree(-600 + i * 260 + 90 * hash(i), HZ + 4, 7 + 4 * hash(i * 3), { key: 'h4b' + i, sway: .5 });
    // the homestead back right, green now, the tank full; the windmill turning
    homestead(1300, 640, 11, { w: 26, green: 1, tank: 1, tone: .55, key: 'h4' });
    windmill(420, 648, 10, .4 + t * 1.8);
    // the stream across the foreground
    const SP = [[-700, 792], [0, 786], [700, 796], [1400, 788], [2200, 798], [3000, 792]];
    seed('h4bank'); pfill([[-900, 734], [3000, 734], [3000, 780], [-900, 780]], '#6E8A40', { tone: .6, dens: .9, ink: null, still: true });
    water(SP, t, { key: 'h4', w: 100, speed: 180, ripples: 70, glints: 20, bank: 2, sun: (x, y) => .8, gs: 1.2 });
    // sheep drinking along the bank
    for (const [x, s, fl, ph] of [[1250, 38, true, 0], [1480, 34, true, .4], [1720, 40, false, .7]]) {
      seed('h4sh' + x); pshade(ellPts(x + 40, 746, 70, 7, 10), AP.graphite, .6);
      sheep(x, 744, s, { flip: fl, drink: true, graze: .85 + .15 * Math.sin(t * 3 + ph * 6), key: 'h4s' + x });
      const hx = x + (fl ? -1 : 1) * 1.7 * s; for (let k = 0; k < 2; k++) { const rr = frac(t * .9 + k * .5 + ph); pline(ellPts(hx, 758, 10 + rr * 40, 3 + rr * 8, 16).slice(0, 9), 1, WLT, { over: 0, passes: 1, alpha: .7 * (1 - rr) }); }
    }
    // the squatter: scoops, lifts the water, looks at it, drinks, and turns his face up
    const s = SQS, sP = { view: 'side', hpF: 1.57, knF: 1.57, hpB: -.05, knB: 1.62, dy: -.3 };
    const lean = kf(t, [[270.88, .95], [271.5, 1.0], [272.3, .35], [272.9, .3], [273.3, .1], [273.8, -.12], [275.08, -.1]], ease);
    const head = kf(t, [[270.88, .35], [272.2, .35], [272.9, .45], [273.25, .05], [273.5, -.2], [274.0, -.45], [275.08, -.4]], ease);
    const J0 = probe(() => man(SQX, SQY, s, { ...sP, lean, head }, CAST.squatter));
    const cupAt = J0.head, mouth = [cupAt[0] + .55 * s, cupAt[1] + .45 * s];
    const cupT = kf(t, [[270.88, [SQX + 2.2 * s, 758]], [271.3, [SQX + 2.35 * s, 762]], [271.55, [SQX + 2.2 * s, 758]], [272.3, [SQX + 1.9 * s, J0.neck[1] + .9 * s]], [272.9, [SQX + 1.9 * s, J0.neck[1] + .7 * s]], [273.25, mouth], [273.5, mouth], [274.0, [SQX + 1.4 * s, SQY - 2.2 * s]]], ease);
    const cupped = t < 273.45, face = t < 272.6 ? 'neutral' : 'smile', blink = t > 272.5 && t < 272.6 ? 1 : t > 273.2 && t < 274.4 ? 1 : t > 274.4 && t < 274.5 ? .5 : 0;
    const hk = { F: add2(cupT, [.18 * s, 0]), B: add2(cupT, [-.1 * s, .12 * s]) };
    seed('h4sqShadow'); pshade(ellPts(SQX + 60, SQY + 2, 120, 9, 12), AP.graphite, .6);
    reach('h4sq', SQX, SQY, s, { ...sP, lean, head, face: t > 274.45 ? 'laugh' : face, blink, mouth: t > 274.45 ? .2 + .1 * Math.sin(t * 14) : 0, look: .3 }, CAST.squatter, hk, { front: J => {
      // the water held in his hands, spilling between the fingers
      if (cupped && t > 271.45) { seed('h4cup'); const c = lerp2(J.handF, J.handB, .5), lv = 1 - seg(t, 271.5, 273.4) * .6;
        pfill(ellPts(c[0] + .1 * s, c[1] - .12 * s, .42 * s, .13 * s * lv, 12), AP.water, { tone: .8, sw: .8, ink: AP.waterDk });
        plit(ellPts(c[0], c[1] - .16 * s, .22 * s, .04 * s, 8), .9, WLT);
        pglow(c[0], c[1] - .15 * s, .5 * s, '#FFF1C8', .6 * (.5 + .5 * Math.sin(t * 6))); }
      if (t > 271.45 && t < 274.2) { seed('h4drip'); const c = lerp2(J.handF, J.handB, .5);
        for (let i = 0; i < 6; i++) { const k = frac(t * 1.6 + i / 6), y0 = c[1] + .15 * s, y = lerp(y0, 770, k * k); pline([[c[0] + (hash(i) - .5) * .5 * s, y - 8], [c[0] + (hash(i) - .5) * .5 * s, y]], 1.4, WLT, { over: 0, passes: 1, alpha: .9 * (1 - k * .5) }); } }
      if (t > 273.3) { seed('h4beard'); for (let i = 0; i < 4; i++) { const p = add2(J.head, [(.25 + .3 * hash(i)) * s, (.35 + .35 * hash(i + 3)) * s]); pglow(p[0], p[1], 8, '#FFF6DC', .7 * (.5 + .5 * Math.sin(t * 5 + i))); pline([p, [p[0], p[1] + 4]], 1.2, WLT, { over: 0, passes: 1 }); } }
    } });
    // rings where his hands broke the water
    if (t < 272.6) for (let k = 0; k < 3; k++) { const rr = frac((t - 270.88) * .9 + k / 3); pline(ellPts(SQX + 2.2 * s, 764, 20 + rr * 110, 5 + rr * 20, 20).slice(0, 11), 1.2, WLT, { over: 0, passes: 1, alpha: .8 * (1 - rr) }); }
    // green shoots springing up on the beat, the far bank and the near
    for (let i = 0; i < 30; i++) { const b = 507 + Math.floor(i / 8), far = i % 3 === 0, x = far ? 300 + hash(i) * 1500 : -100 + hash(i * 3.3) * 2100, y = far ? 732 + 6 * hash(i) : 856 + 16 * hash(i + 4);
      sprout(x, y, far ? 11 : 26 + 10 * hash(i), t, bt(b) - .02 + .08 * hash(i * 5), 'h4' + i); }
    for (let i = 0; i < 9; i++) sprout(SQX - 200 + i * 55 + 20 * hash(i + 40), 738 + 6 * hash(i + 41), 12 + 5 * hash(i + 42), t, bt(507 + Math.floor(i / 2)) + .06 * hash(i + 43), 'h4k' + i);
    seed('h4near'); for (let i = 0; i < 70; i++) { const x = -800 + i * 60 + 30 * hash(i); pline([[x, 905], [x + (hash(i) - .5) * 14 + Math.sin(t * 1.3 + i) * 3, 880 - 26 * hash(i + 2)]], 1.6, i % 3 ? AP.sap : AP.leaf, { over: 0, passes: 1 }); }
    camOff();
    // the trunk wipe finishing (from H3)
    const xl = -90 - 4200 * (t - TC3); if (xl + 2100 > 0) { nearTrunk(xl, 2100, 'wipe'); speedLines(.3 * clamp((xl + 2100) / 600), [1, 0], AP.graphite, 'h4wipe'); }
  }

  // ================= H5 · 275.08–278.79 · it is flowing, ever flowing, further down =================
  const SUN5 = [1150, 470];
  function shotH5(t, lt, dur) {
    LIGHT = [-.2, .9];
    const up = easeIn(seg(lt, dur - .55, dur)), c = kf(t, [[275.08, [960, 620, 1.12]], [278.3, [960, 560, 1.0]]], ease);
    camOn(c[0], c[1] - up * 1100, c[2]);
    const HZ = 524;
    skyBand('#6E9EC4', '#F7CF86', -1700, HZ + 20, { key: 'h5sky', g0: -700, split: .9 });
    pglow(SUN5[0], SUN5[1], 1100, GOLD, .7); pglow(SUN5[0], SUN5[1], 380, '#FFF0C8', .7);
    sun(SUN5[0], SUN5[1], 46, 0); pglow(SUN5[0], SUN5[1], 110, '#FFFFFF', .5);
    // a line of cloud catching the light
    seed('h5cloud'); for (let i = 0; i < 6; i++) { const cx = 200 + i * 300 + 80 * hash(i), cy = 230 + 70 * hash(i + 3), L = 220 + 200 * hash(i + 5);
      ptone(ellPts(cx, cy, L, 9 + 6 * hash(i), 18), '#F8DDB0', .5); pline([[cx - L * .8, cy + 6], [cx + L * .7, cy + 4]], 1.2, '#E8A860', { over: 0, passes: 1, alpha: .5 }); }
    seed('h5far'); const r = []; for (let k = 0; k <= 30; k++) r.push([lerp(-600, 2600, k / 30), HZ - 5 - 10 * Math.max(0, Math.sin(k * .8)) * hash(k)]);
    ptone(r.concat([[2600, HZ + 6], [-600, HZ + 6]]), '#C8A878', .5);
    const gnd = [[-600, HZ], [2600, HZ], [2600, 1300], [-600, 1300]], g = X.createLinearGradient(0, HZ, 0, 1000);
    g.addColorStop(0, '#EAC98A'); g.addColorStop(1, '#B98A56'); X.save(); X.globalAlpha = .85; X.fillStyle = g; tracePath(gnd); X.fill(); X.restore();
    pshade(gnd, AP.dust, .5, { still: true }); pline([[-600, HZ], [2600, HZ]], .9, AP.graphiteLt, { over: 0, passes: 1 });
    // the stream winding from our feet to the sun, a green ribbon along it, timber on its banks
    const SP = [[260, 1010], [560, 880], [1000, 800], [760, 700], [980, 630], [1180, 572], [1080, 545], [1150, 528]];
    const path = pathOf(SP), wv = u => lerp(170, 4, Math.pow(u, .55));
    const fr = lerp(.9, 1, ease(seg(t, 275.08, 277.8)));
    seed('h5green'); const gp = [], gw = []; for (let i = 0; i <= 40; i++) { const u = fr * i / 40, a = path.at(u); gp.push([a[0], a[1]]); gw.push(wv(u) * 1.9 + 24); }
    pfill(limb(gp, gw, 2), AP.sap, { tone: .45, dens: .8, ink: null });
    pshade(limb(gp, gw.map(w => w * .6), 2), AP.leaf, .5);
    const trees = []; for (let i = 0; i < 26; i++) { const u = .08 + .9 * hash(i * 3.7), a = path.at(u), sd = i % 2 ? 1 : -1, off = wv(u) * (1.4 + 1.2 * hash(i)); if (u > fr) continue; trees.push([a[0] - a[3] * off * sd, a[1] + a[2] * off * sd, lerp(22, 2, Math.pow(u, .5)), i]); }
    trees.sort((a, b) => a[1] - b[1]);
    const wat = () => water(SP, t, { key: 'h5', front: fr, w: wv, speed: 260, ripples: 60, glints: 30, sun: (x, y) => clamp(1.2 - Math.abs(x - SUN5[0]) / 500), col: mixCol(AP.water, '#8FB8C8', .2), sky: '#F6E2B0', gs: .9 });
    for (const [x, y, s, i] of trees) if (y < 700) tree(x, y, s, { key: 'h5t' + i, sway: .5 });
    wat();
    // the sun's road on the water
    seed('h5road'); for (let i = 0; i < 18; i++) { const u = .72 + .28 * hash(i * 2.3); if (u > fr) continue; const a = path.at(u), w = wv(u), l = w * (1 + hash(i)), f = .5 + .5 * Math.sin(t * 4 + i * 2);
      pline([[a[0] - l / 2, a[1]], [a[0] + l / 2, a[1]]], 1.5, '#FFE6A8', { over: 0, passes: 1, alpha: .5 + .5 * f }); }
    for (const [x, y, s, i] of trees) if (y >= 700) { pshade(ellPts(x + s * 2, y + 2, s * 2.4, s * .3, 10), AP.graphite, .6); tree(x, y, s, { key: 'h5t' + i, sway: .5 }); }
    // birds heading downstream toward the sun
    for (let i = 0; i < 5; i++) { const k = frac((t - 275.08) / 5 + i * .13), p = lerp2([520 + 90 * i, 360 + 40 * hash(i)], [1100 + 20 * i, 470], ease(k)), bs = lerp(16, 3, k), fl = Math.sin(t * 9 + i * 2) * .5;
      pline([[p[0] - bs, p[1] - bs * (.35 + fl)], [p[0], p[1]], [p[0] + bs, p[1] - bs * (.35 + fl)]], 1.4, AP.graphite, { over: 0, passes: 1, curv: true, alpha: 1 - k * .5 }); }
    camOff();
    speedLines(up, [0, -1], AP.graphite, 'h5tilt');
  }

  // ================= H6 · 278.79–284.62 · chorus: the crew in silhouette at the rig; the last blow for luck =================
  const G6 = 820, CAS6 = 860, S6 = 66, LAST = bt(531);
  const SHOULDER = { view: 'side', flip: true, lean: -.05, shF: .3, elF: 1.6, shB: .15, elB: .35, hpF: .1, knF: .05, hpB: -.1, knB: .05, head: -.15, face: 'smile' };
  function shotH6(t, lt, dur) {
    LIGHT = [-.5, .6];
    const down = 1 - easeOut(seg(lt, 0, .7)), sinceLast = t - LAST;
    const shake = shakeXY(t, 9 * Math.exp(-Math.max(0, frac((bpOf(t) - 1) / 2)) * 2 * BEAT * 10) * (sinceLast > -.05 && sinceLast < .5 ? 1.8 : 1));
    const pz = ease(seg(t, 279.4, 283.8));
    camOn(lerp(960, 1000, pz) + shake[0], 540 - down * 1100 + lerp(0, -20, pz) + shake[1], lerp(1, 1.1, pz));
    const HZ = 742;
    skyBand('#4A6A96', '#F0A860', -1700, HZ + 20, { key: 'h6sky', g0: -500, split: .82 });
    const SUN = [1190, 668];
    pglow(SUN[0], SUN[1], 1400, '#F2A04E', .6); pglow(SUN[0], SUN[1], 520, GOLD, .8);
    seed('h6sun'); pfill(ellPts(SUN[0], SUN[1], 84, 84, 30), '#FFE6A8', { tone: .9, dens: .5, ink: '#E8A04A', sw: 1.2 });
    pglow(SUN[0], SUN[1], 170, '#FFFFFF', .55);
    seed('h6cloud'); for (let i = 0; i < 7; i++) { const cx = 200 + i * 280, cy = 380 + 60 * Math.sin(i * 1.7); for (let k = 0; k < 3; k++) psmoke(cx + k * 70, cy + 10 * k, 60 + 20 * hash(i + k), mixCol('#C86A48', '#6A5A7A', hash(i)), .4); }
    // the land in silhouette, far rises lit at the edge
    seed('h6land');
    ptone([[-1000, HZ - 14], [300, HZ - 26], [700, HZ - 10], [1600, HZ - 20], [3000, HZ - 8], [3000, HZ + 10], [-1000, HZ + 10]], '#5A4050', .6);
    pfill([[-1000, HZ], [3000, HZ], [3000, 1400], [-1000, 1400]], '#3A2E3A', { tone: .85, dens: 1, ink: null, still: true });
    pline([[-1000, HZ], [3000, HZ]], 1.2, '#E8A04A', { over: 0, passes: 1, alpha: .6 });
    for (let i = 0; i < 7; i++) { seed('h6ft' + i); tree(-300 + i * 420 + 120 * hash(i), HZ + 2, 10 + 6 * hash(i * 2), { key: 'h6t' + i, col: '#3A2E3A', leafCol: '#3E3444' }); }
    // the drain: a ribbon of the sky's gold across the dark ground
    water([[CAS6 - 40, G6 + 4], [560, 836], [200, 856], [-300, 870], [-1000, 876]], t, { key: 'h6d', w: u => lerp(18, 40, u), speed: 220, col: '#E8A866', deep: '#B8704A', sky: '#FFE6A8', edge: '#2A2430', ripples: 40, glints: 12, sun: () => 1 });
    // the derrick and the casing, the water welling over it
    derrick(CAS6, G6, 1000, { key: 'h6', col: '#3A3040', floor: false });
    wellhead(CAS6, G6, t, .9, { key: 'h6', dark: true, col: '#E8A866', lt: '#FFE6A8', sheet: '#F0B070', edge: '#2A2430', mist: '#F8C890' });
    const clampY = G6 - 72;
    seed('h6clamp'); pfill(rrPts(CAS6 - 34, clampY - 20, 68, 28, 6), SILC, { tone: .9, sw: 1.2 });
    // the crew, dark against the sky: they bob on every blow and throw their arms up at the last
    const cheer = seg(sinceLast, 0, .18) * (1 - seg(t, 284.35, 284.62) * 0), bob = Math.exp(-frac((bpOf(t) - 1) / 2) * 2 * BEAT * 8);
    const stand = (fl, b) => ({ view: 'side', flip: fl, lean: -.05 - .06 * b, shF: .25, elF: .5, shB: -.1, elB: .4, hpF: .08, knF: .05, hpB: -.08, knB: .05, head: -.1 * b, face: 'smile' });
    const hurrah = { view: 'front', shF: 2.7, elF: -.25, shB: 2.6, elB: -.3, face: 'shout', mouth: .6, head: -.3 };
    const crew = [[250, 'hand1', CAST.hand1, 54, false], [420, 'hand2', CAST.hand2, 52, false], [1560, 'boss', CAST.boss, 58, true], [1730, 'bill', CAST.bill, 56, true]];
    crew.forEach(([x, k, L, s, fl], i) => {
      const c = clamp(cheer * 1.2 - i * .04), P = c > 0 ? kp(c, [[0, stand(fl, 0)], [1, hurrah]]) : stand(fl, bob);
      const PP = { ...P, dy: c > .5 ? .25 * Math.abs(Math.sin((t - LAST) * 7 + i)) : 0 };
      for (let pass = 0; pass < 2; pass++) { seed('h6' + k); man(x, G6, s, PP, sil(L)); }
    });
    // the driller: blows on the odd beats, onto the clamp; after the last he swings the sledge up onto his shoulder
    const Ji = probe(() => man(0, G6, S6, { ...DOWN, flip: true }, CAST.driller)), a0 = Ji.angF + .35 * Ji.dir, u0 = [Math.cos(a0), Math.sin(a0)];
    const hd0 = add2(Ji.handF, [u0[0] * 3 * S6, u0[1] * 3 * S6]), faceP = add2(hd0, [-u0[1] * S6 * .5 * -1, u0[0] * S6 * .5 * -1]);
    const dX = CAS6 + 34 - hd0[0] + .1 * S6, H = hammerPose(t);
    let P = H.P, off = H.off;
    if (sinceLast > .06) { const k = seg(sinceLast, .06, .55); P = kp(k, [[0, H.P], [1, SHOULDER]], ease); off = lerp(H.off, 0, ease(k)); }
    const shk = sinceLast > .06 ? ease(seg(sinceLast, .06, .55)) : 0;
    for (let pass = 0; pass < 2; pass++) { seed('h6driller');
      man(dX, G6, S6, { ...P, flip: true }, sil(CAST.driller, .84), { hold: J => tool(J.handF, lerp(J.angF + off * J.dir, -.35, shk), S6, { key: 'h6s', handle: '#4A3A34', head: SILC, dark: true }) }); }
    // sparks off the clamp: every blow, the last one big
    for (const b of [523, 525, 527, 529, 531]) sparks([CAS6 + 30, clampY - 6], t - bt(b), b === 531 ? 1.7 : .8, 'h6spk' + b);
    camOff();
    if (lt > dur - .3) pageTurn((lt - (dur - .3)) / .6, -1);
    speedLines(down, [0, 1], AP.graphite, 'h6tilt');
  }

  // ================= H7 · 284.62–292.80 · the rhyme: the opening frame, green and full; the pencil lifts =================
  const Z6 = lerp(1, 1.045, ease(6 / 7.4)), CX6 = lerp(960, 930, ease(6 / 7.4));
  function shotH7(t, lt, dur) {
    LIGHT = [-.7, .7];
    const pull = ease(seg(t, 289.3, 291.9));
    const z = lerp(Z6 + .02 * ease(seg(t, 284.62, 289.3)), .66, pull), cx = lerp(CX6, 960, pull), cy = lerp(540, 505, pull);
    const colour = 1 - ease(seg(t, 290.2, 291.05)), draw = 1 - ease(seg(t, 290.95, 291.8));
    const sheepK = lerp(.5, 1, ease(seg(t, 284.62, 287.4)));
    openingFrame(t, { wet: 1, cam: [cx, cy, z], sheep: sheepK, colour, draw });
    // late-afternoon gold over the rhyme, lifting with the colour
    if (colour > 0) { camOn(cx, cy, z); pglow(1330, 150, 1300, GOLD, .5 * colour); pglow(1330, 150, 300, '#FFF4DC', .35 * colour); camOff(); ptone(rectPts(-40, -40, W + 80, 940), '#F2C878', .1 * colour); }
    paperFade(seg(t, 291.7, 291.9));
    if (lt < .3) pageTurn(.5 + lt / .6, -1);
  }

  shots([[257.68, shotH1], [262.26, shotH2], [266.58, shotH3], [270.88, shotH4], [275.08, shotH5], [278.79, shotH6], [284.62, shotH7]]);
})();
