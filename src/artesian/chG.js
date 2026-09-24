// Chapter G · 225.55–257.68 s · The strike, THE FINALE. Verse 7 (lines 54–58) and chorus 7 (lines 59–62).
// See docs/artesian/STORYBOARD.md and BRIEF.md.
//
//   G1 225.55 [54] whistle     white steam clears: Bill hangs on the whistle cord, yanks again ON the beat, the plume
//                              screams up into the dawn as the camera pulls back. Whip-pan out.
//   G2 229.24 [55] cheering    the crew at dawn: hats flung on arcs (each on its own clock), the two hands in a bear hug,
//                              the boss's jig, the driller roaring with his arms up. Iris of hatching onto the casing.
//   G3 233.54 [56] up the bore the reversed dive: the rock gives, the water bursts and races the camera UP the shaft
//                              past granite, rock, the coal and C's ichthyosaur, the shale, then the devil's parlour
//                              (the jet comes up through his floor: he is doused, steaming, teacup on his horn),
//                              sand, clay, soil and out of the casing. Cut on action.
//   G4 238.58 [57] the geyser  THE MONEY SHOT: the column bursts out of the casing, climbs through the derrick and
//                              crowns above it against the sunrise; spray curtains, arcs of drops, mist, a rainbow in
//                              pencil bands; the first blue sky of the film. Vertical whip down the falling water.
//   G5 243.00 [58] flowing     the driller under the falling water, arms wide, eyes shut, laughing; water pours off
//                              his hat brim; the crew behind. A wave of water thrown across the lens wipes to G6.
//   G6 246.86 chorus 7 a       celebration in the spray: the driller stomps and splashes ON every other beat, the
//                              hands kick between, Bill whirls his toque, the boss drinks from his bowler. Page turn.
//   G7 252.20 chorus 7 b       out on the plain: the water spreads; the squatter comes running, sheep race to it and
//                              drink; he splashes in and throws up his arms. Scribble out.
//
// GLOBALS defined here for other chapters (chapter H can put the geyser on the horizon, or the rainbow over the plain):
//   gGeyser(x, y, h, t, o) → { top, reach }   a surging artesian column from the casing mouth at (x, y), h px tall.
//       o.w base width (64) · o.spray 0..1 curtains/drops/mist · o.crown 0..1 how far the crown has bloomed ·
//       o.reach curtain half-width in widths (5) · o.drops count (110) · o.sun +1 sun on the right, -1 left ·
//       o.behind(G) hook drawn after the back curtains and before the column (a rainbow goes here) · o.key seed suffix
//   gRainbow(cx, cy, r, bw, a0, a1, k, alpha)  a rainbow in six pencil bands, outer radius r, band width bw, from angle
//       a0 to a1 (radians, canvas convention), drawn on to fraction k, faded at both ends
//   gDawnSky(o)                              the dawn sky (o.blue 0..1 brings cerulean into the zenith; o.x0/x1/y0/y1)
//   gSunrise(x, y, r, a)                     the rising sun with a wide gold blaze and pale pencil rays

// ------------------------------------------------------------------------------------------------------------------
// shared-able pieces
// ------------------------------------------------------------------------------------------------------------------
function gDawnSky(o = {}) {
  const x0 = o.x0 ?? -300, x1 = o.x1 ?? W + 300, y0 = o.y0 ?? -300, y1 = o.y1 ?? 920, b = o.blue ?? 0;
  seed('gSky' + (o.key || ''));
  const zen = mixCol('#E0AE78', '#86B6D4', b), mid = mixCol('#EDC27E', '#E6D39C', b * .6);
  const g = X.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, zen); g.addColorStop(.42, mid); g.addColorStop(.78, '#F0B274'); g.addColorStop(1, '#E48C60');
  X.save(); X.globalAlpha = .84; X.fillStyle = g; X.fillRect(x0, y0, x1 - x0, y1 - y0 + 40); X.restore();
  pshade(rectPts(x0, y0, x1 - x0, (y1 - y0) * .5), zen, .55, { still: true });
  if (b > 0) pshade(rectPts(x0, y0, x1 - x0, (y1 - y0) * .3), AP.waterDk, .3 * b, { still: true, kind: 'x' });
  pshade(rectPts(x0, y0 + (y1 - y0) * .42, x1 - x0, (y1 - y0) * .6), '#E49A5E', .38, { still: true, kind: 'v' });
}
function gSunrise(x, y, r, a = 1) {
  seed('gSun');
  pglow(x, y, r * 11, '#F4B860', .8 * a);
  pglow(x, y, r * 4, '#FFE2A0', .9 * a);
  for (let i = 0; i < 16; i++) {            // pale pencil rays fanning up from the disc
    const an = -Math.PI + (i + .5) / 16 * Math.PI + (hash(i * 3.3) - .5) * .08, w = .035 + hash(i * 1.7) * .03, L = r * (7 + hash(i * 5.1) * 7);
    if (i % 2) plit([[x, y], polar([x, y], an - w, L), polar([x, y], an + w, L)], .28 * a, '#FFF1CF');
  }
  pfill(ellPts(x, y, r, r, 30, r * .02), '#FBE9C0', { tone: .92, dens: .45, ink: AP.ochre, sw: 1.1, still: true });
}
function gRainbow(cx, cy, r, bw, a0, a1, k = 1, alpha = 1) {
  if (k <= 0 || alpha <= 0) return;
  const cols = ['#C8503A', '#E0883A', '#E6C45A', '#86B25A', '#4C8FB8', '#6E5E9E'], n = 20;
  cols.forEach((c, i) => {
    seed('gRbw' + i);
    const ro = r - i * bw, ri = ro - bw * 1.08;
    for (let j = 0; j < n; j++) {
      const u0 = j / n; if (u0 >= k) break;
      const u1 = Math.min((j + 1) / n, k), b0 = lerp(a0, a1, u0), b1 = lerp(a0, a1, u1), um = (u0 + u1) / 2;
      const f = Math.pow(Math.sin(Math.PI * um), .7) * alpha;
      const pts = [polar([cx, cy], b0, ro), polar([cx, cy], (b0 + b1) / 2, ro), polar([cx, cy], b1, ro), polar([cx, cy], b1, ri), polar([cx, cy], (b0 + b1) / 2, ri), polar([cx, cy], b0, ri)];
      ptone(pts, c, .2 * f);
      pshade(pts, c, .85 * f, { kind: i % 2 ? 'x' : 'h' });
    }
  });
}
function gGeyser(x, y, h, t, o = {}) {
  const w = o.w ?? 64, sp = o.spray ?? 1, crown = o.crown ?? 1, sun = o.sun ?? 1, key = o.key || '', n = 20;
  const sc = h / 700, ws = Math.max(.6, w / 64);
  const sway = k => (Math.sin(t * 1.5 + k * 2.3) * 20 + Math.sin(t * 3.3 + k * 6) * 6) * k * sc;
  const half = k => w / 2 * (1 + .9 * k * k * Math.min(1, h / 500)) * (1 + (.09 + .12 * k * k * k) * Math.sin(k * 11 - t * 15) + (.05 + .1 * k * k * k) * Math.sin(k * 23 - t * 29));
  const ax = k => x + sway(k), ay = k => y - k * h;
  const tx = ax(1), ty = y - h, reach = (o.reach ?? 5) * w * sp * (.35 + .65 * crown), cr = w * (.75 + 1.05 * crown);
  const WHITE = '#F6FBFC', FOAM = '#DCEEF5';
  // veils of spray falling from the crown, the outer ones first
  for (const sd of [-1, 1]) for (let v = 3; v >= 0; v--) {
    seed('gGyVeil' + sd + v + key);
    const x0 = tx + sd * cr * (.5 + v * .28), y0 = ty + cr * .25, x1 = x + sd * reach * (.45 + v * .2), wv = w * (.5 + v * .18) * (.6 + .4 * sp);
    const drift = Math.sin(t * 1.3 + v * 1.7 + sd) * 14 * sc;
    const C = []; for (let i = 0; i <= 8; i++) { const k = i / 8, xx = lerp(x0, x1, Math.sin(k * Math.PI / 2)) + drift * k; C.push([xx, lerp(y0, y + 6, k)]); }
    const out = limb(C, C.map((_, i) => wv * (.35 + i / 8 * .9)));
    pfill(out, AP.waterLt, { tone: .12 * sp, dens: .45 * sp, kind: 'v', ink: null, curv: true });
    for (let i = 0; i < 9; i++) {
      const q = frac(t * (1.1 + hash(i * 5 + v) * .6) + hash(i * 3 + v * 7 + sd)), k = q, j = Math.min(7, Math.floor(k * 8)), f = k * 8 - j, p = lerp2(C[j], C[j + 1], f), off = (hash(i * 9 + v) - .5) * wv * (.3 + k);
      const L = (30 + 50 * hash(i * 13)) * sc;
      pline([[p[0] + off, p[1] - L], [p[0] + off + sd * 2, p[1]]], .9 + hash(i) * 1.1, WHITE, { over: 0, passes: 1, alpha: .8 * sp, j: .4 });
    }
  }
  const G = { top: [tx, ty], reach };
  if (o.behind) o.behind(G);
  // mist rolling out from the foot
  seed('gGyMist' + key);
  for (let i = 0; i < 12; i++) { const q = frac(t * .22 + hash(i * 2.2)), sd = i % 2 ? 1 : -1; psmoke(x + sd * (w * .6 + q * reach * .95), y - 14 - q * 70 * sc, (50 + 90 * q) * sc * (1 + hash(i) * .6), '#EAF4F7', .5 * sp * (1 - q * .7)); }
  // the column: aerated white-blue water, shaded away from the sun
  const L = [], R = [];
  for (let i = 0; i <= n; i++) { const k = i / n; L.push([ax(k) - half(k), ay(k)]); R.push([ax(k) + half(k), ay(k)]); }
  const body = L.concat(R.slice().reverse()), band = (side, a, b) => side.map((p, i) => [lerp(p[0], ax(i / n), a), p[1]]).concat(side.map((p, i) => [lerp(p[0], ax(i / n), b), p[1]]).reverse());
  seed('gGyBody' + key);
  pfill(body, mixCol(AP.waterLt, AP.water, .35), { tone: .75, dens: .9, kind: 'v', sw: 1.2 * ws, ink: AP.waterDk, curv: true });
  const shadeSide = sun > 0 ? L : R, litSide = sun > 0 ? R : L;
  pshade(band(shadeSide, 0, .75), AP.water, 1.1, { kind: 'v' });
  pshade(band(shadeSide, 0, .3), AP.waterDk, .9, { kind: 'v' });
  plit(band(litSide, .15, .8), 1, WHITE, { kind: 'v' });
  plit(band(litSide, 0, .18), .6, '#FBDC98', { kind: 'v' });
  // rushing streaks inside the column
  for (let i = 0; i < 30; i++) {
    const k0 = frac(hash(i * 1.3) + t * (1.4 + hash(i) * .8)), k1 = Math.min(1, k0 + .05 + hash(i * 4) * .06), off = (hash(i * 3.7) - .5) * 1.4;
    pline([[ax(k0) + half(k0) * off, ay(k0)], [ax(k1) + half(k1) * off, ay(k1)]], (1 + hash(i * 2) * 1.4) * ws, i % 4 ? WHITE : AP.waterDk, { over: 0, passes: 1, alpha: .8, j: .4 });
  }
  // spray peeling off the sides of the upper column
  seed('gGyPeel' + key);
  for (let i = 0; i < 18; i++) {
    const q = frac(t * 1.3 + hash(i * 2.1)), k = .55 + .45 * hash(i * 3.9), sd = i % 2 ? 1 : -1, p0 = [ax(k) + sd * half(k), ay(k)];
    const p = arcPt(p0, [p0[0] + sd * w * (1 + 1.5 * hash(i)), p0[1] + h * .25], 40 * sc, q), pb = arcPt(p0, [p0[0] + sd * w * (1 + 1.5 * hash(i)), p0[1] + h * .25], 40 * sc, Math.max(0, q - .06));
    pline([pb, p], (1.4 + hash(i * 5) * 1.6) * ws, '#F4FBFD', { over: 0, passes: 1, alpha: 1 - q, j: .3 });
  }
  // the crown: a boiling cauliflower of white water, lobes swelling out and dropping away
  seed('gGyCrown' + key);
  if (o.cap !== false) {
    for (let i = 0; i < 16; i++) {
      const q = frac(t * .7 + hash(i * 2.9)), an = -Math.PI / 2 + (hash(i * 4.3) - .5) * 2.9, rr = cr * (.25 + q * .95);
      const c = [tx + Math.cos(an) * rr * 1.25, ty + Math.sin(an) * rr * .7 + q * q * cr * 1.1], r = cr * (.28 + .4 * hash(i * 7)) * (.7 + q * .6);
      pfill(ellPts(c[0], c[1], r, r * .82, 12, r * .06), q < .5 ? FOAM : AP.waterLt, { tone: .55 * (1 - q * .6), dens: .55, kind: 'x', ink: null });
      plit(ellPts(c[0] + sun * r * .25, c[1] - r * .25, r * .55, r * .4, 10), .8 * (1 - q * .5), WHITE);
      if (an < -.6 && an > -2.5) { const P = []; for (let k = 0; k <= 8; k++) P.push(polar(c, an - .9 + k / 8 * 1.8, r * (.98 + .05 * Math.sin(k * 2.3 + i)))); pline(P, .9 * ws, mixCol(AP.waterLt, AP.waterDk, .55), { over: 0, passes: 1, alpha: .7 * (1 - q), curv: true }); }
    }
    psmoke(tx, ty - cr * .1, cr * 1.1, '#F2F8FA', .55);
    pglow(tx + sun * cr * .4, ty - cr * .3, cr * 1.4, '#FFE8B0', .25);
  }
  // drops flung out on arcs from the crown
  seed('gGyDrops' + key);
  for (let i = 0; i < (o.drops ?? 110); i++) {
    const q = frac(t * (.5 + hash(i * 11) * .3) + hash(i)), sd = hash(i * 3) < .5 ? -1 : 1, spread = (.2 + hash(i * 5) * 1.15) * reach * sd;
    const pk = (60 + hash(i * 7) * 260) * sc * (.3 + .7 * crown), p0 = [tx + sd * cr * .4, ty], p1 = [x + spread, y + 30];
    const p = arcPt(p0, p1, pk, q), pb = arcPt(p0, p1, pk, Math.max(0, q - .025));
    pline([pb, p], (1.6 + hash(i * 13) * 2.4) * ws, q < .35 ? WHITE : AP.waterLt, { over: 0, passes: 1, alpha: sp * (q > .9 ? (1 - q) * 10 : 1), j: .3 });
  }
  // foam where it bursts from the casing
  seed('gGyFoam' + key);
  for (let i = 0; i < 7; i++) { const q = frac(t * 1.7 + i / 7); psmoke(x + (hash(i) - .5) * w * 2.6 * (.4 + q), y - 12 - q * 60 * sc, (20 + 36 * q) * ws, WHITE, .75 * (1 - q)); }
  return G;
}

(() => {
  const bt = n => OFF + n * BEAT;
  const G_T0 = 225.55;

  // ---------- borrowed from chapter D (local there): IK so hands land on a cord or a mate's back ----------
  const _gc = document.createElement('canvas'); _gc.width = _gc.height = 8; const _gx = _gc.getContext('2d');
  function probe(fn) { const keep = X; X = _gx; try { return fn(); } finally { X = keep; } }
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
    const P = { ...pose }, d = P.flip ? -1 : 1;
    if (tgt) {
      const J0 = probe(() => man(x, y, s, P, look));
      if (tgt.F) [P.shF, P.elF] = ik(J0.shF, tgt.F, s, look, P.view === 'front' ? 1 : d);
      if (tgt.B) [P.shB, P.elB] = ik(J0.shB, tgt.B, s, look, P.view === 'front' ? -1 : d);
    }
    seed(key); return man(x, y, s, P, look, hooks);
  }
  // ---------- borrowed from chapter D: speed lines, iris of hatching ----------
  function speedLines(k, vert, key, col = AP.graphite, wash = AP.paper) {
    if (k <= .02) return;
    seed('gSpd' + key);
    ptone(rectPts(-40, -40, W + 80, H + 80), wash, .7 * k);
    for (let i = 0; i < 54; i++) {
      const a = hash(i * 3.7 + key.length), b = hash(i * 9.1), L = 200 + hash(i * 5.3) * 600, w = .7 + hash(i * 2.1) * 1.6;
      if (vert) { const x = a * W, y = b * (H + L) - L; pline([[x, y], [x, y + L]], w, col, { alpha: k * .85, passes: 1, over: 0 }); }
      else { const y = a * 890, x = b * (W + L) - L; pline([[x, y], [x + L, y]], w, col, { alpha: k * .85, passes: 1, over: 0 }); }
    }
  }
  function hatchIris(cx, cy, r, col = AP.earthDk) {
    seed('gIris');
    X.save(); X.beginPath(); X.rect(-60, -60, W + 120, H + 120); X.arc(cx, cy, Math.max(0, r), 0, TAU); X.clip('evenodd');
    ptone(rectPts(-60, -60, W + 120, H + 120), col, .93);
    pshade(rectPts(-60, -60, W + 120, H + 120), AP.graphite, 1.6);
    X.restore();
    if (r > 3) pline(ellPts(cx, cy, r, r, 44, r * .015), 2, AP.graphite, { closed: true });
  }
  // ---------- chapter C's fossils (local there; copied so the coal bed matches) ----------
  function ichthyosaur(x, y, sc, ang) {
    seed('G_ichthy');
    const Q = p => { const r = rot2([p[0] * sc, p[1] * sc], ang); return [x + r[0], y + r[1]]; }, bone = '#E6DCC4', ink = '#2E2A26';
    pshade([[180, -40], [320, -62], [470, -40], [580, 10], [640, 60], [560, 50], [440, 50], [300, 55], [190, 40]].map(Q), AP.graphite, .55, { curv: true });
    pfill([[0, -2], [100, -12], [170, -32], [205, -12], [200, 18], [160, 26], [100, 6], [0, 3]].map(Q), bone, { tone: .75, dens: .6, sw: 1, ink, curv: true });
    for (let i = 0; i < 14; i++) pline([Q([8 + i * 7, 3]), Q([9 + i * 7, 9])], 1.1, ink, { over: 0, passes: 1 });
    const eye = Q([158, -6]); pline(ellPts(eye[0], eye[1], 17 * sc, 16 * sc, 16), 1.4, ink, { closed: true });
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; pline([polar(eye, a, 10 * sc), polar(eye, a, 16 * sc)], .7, ink, { over: 0, passes: 1 }); }
    const SP = through([[200, -6], [270, -18], [350, -20], [430, -12], [510, 4], [570, 22], [600, 40], [650, 64]], 6);
    SP.forEach((p, i) => { const q = Q(p); pfill(ellPts(q[0], q[1], 4.2 * sc * (1 - i / SP.length * .5), 5.2 * sc * (1 - i / SP.length * .5), 7), bone, { tone: .85, ink: null }); });
    pline(SP.map(Q), .6, ink, { over: 0, passes: 1, curv: true });
    for (let i = 0; i < 16; i++) { const b = 225 + i * 15, bb = SP.find(p => p[0] >= b) || SP[0], L = 34 + Math.sin(i / 15 * Math.PI) * 26; pline([bb, [bb[0] - 6, bb[1] + L * .5], [bb[0] - 2, bb[1] + L]].map(Q), 2.2, bone, { curv: true, over: 0, passes: 1 }); }
    for (const [px, py, s2, a2] of [[235, 30, 1, .6], [450, 26, .7, .7]]) {
      const P = [[0, 0], [30, 12], [52, 30], [58, 52], [40, 50], [16, 30], [-4, 10]].map(p => [px + rot2(p, a2 - .6)[0] * s2, py + rot2(p, a2 - .6)[1] * s2]);
      pfill(P.map(Q), bone, { tone: .45, dens: .4, sw: .7, ink, curv: true });
      for (let i = 0; i < 12; i++) { const k = hash(i * 3.3 + px), p = lerp2(P[0], P[3], .15 + k * .75), o = (hash(i * 7.7 + px) - .5) * 18 * s2; pfill(ellPts(...Q([p[0] + o * .6, p[1] - o]), 2.4 * sc, 2.4 * sc, 5), bone, { tone: .9, ink: null }); }
    }
    pline([[600, 40], [640, 0], [676, -20], [664, 20], [650, 64]].map(Q), 1.8, '#B8AE98', { curv: true, over: 0 });
    pline([[650, 64], [690, 96], [672, 60]].map(Q), 1.8, '#B8AE98', { curv: true, over: 0 });
  }
  function ammonite(x, y, r, key) {
    seed('G_amm' + key);
    const P = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * TAU * 2.6, rr = r * Math.exp(-a * .17); P.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
    pfill(ellPts(x, y, r * 1.02, r * 1.02, 16), '#C8C0B0', { tone: .5, dens: .5, ink: null });
    pline(P, 1, '#2E2A26', { over: 0, passes: 1, curv: true });
    for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; pline([polar([x, y], a, r * .55), polar([x, y], a, r)], .6, '#2E2A26', { over: 0, passes: 1 }); }
  }
  function fern(x, y, L, ang, key) {
    seed('G_fern' + key);
    const u = [Math.cos(ang), Math.sin(ang)], n = [-u[1], u[0]];
    pline([[x, y], add2([x, y], u.map(v => v * L))], 1, '#8A8478', { over: 0, passes: 1 });
    for (let i = 1; i < 14; i++) { const b = add2([x, y], u.map(v => v * L * i / 14)), l = L * .22 * (1 - i / 16); for (const sd of [-1, 1]) pline([b, add2(b, add2(n.map(v => v * l * sd), u.map(v => v * l * .4)))], .8, '#8A8478', { over: 0, passes: 1 }); }
  }

  // ---------- chapter G's own pieces ----------
  // the plain at dawn: far haze band, the ground with long raking shadow hatching, optional cracks
  function dawnPlain(yH, o = {}) {
    const x0 = o.x0 ?? -300, x1 = o.x1 ?? W + 300, y1 = o.y1 ?? 1400;
    seed('gPlain' + (o.key || ''));
    const pts = []; for (let k = 0; k <= 20; k++) pts.push([lerp(x0, x1, k / 20), yH + 5 * Math.sin(k * 1.9) + 4 * hash(k)]);
    ptone([[x0, yH - 26], [x1, yH - 30], [x1, yH + 4], [x0, yH + 4]], '#C99A80', .45);
    pfill(pts.concat([[x1, y1], [x0, y1]]), o.col || '#C8A070', { tone: .62, dens: .8, ink: null, still: true });
    pshade(pts.map(p => [p[0], p[1] + (o.dk ?? 70)]).concat([[x1, y1], [x0, y1]]), mixCol(o.col || '#C8A070', AP.earthDk, .55), .6, { still: true, kind: 'x' });
    pline(pts, 1.1, AP.graphiteLt, { over: 0, passes: 1 });
    // gold light raking across the ground from the sunrise
    for (let i = 0; i < 18; i++) { const y = yH + 10 + Math.pow(hash(i * 3.1), 1.6) * (y1 - yH) * .5, xx = lerp(x0, x1, hash(i * 5.7)); pline([[xx, y], [xx + 120 + hash(i) * 260, y + 3]], 1.2, '#F6D58E', { over: 0, passes: 1, alpha: .55 }); }
    if (o.cracks) cracks(x0 + 200, yH + 30, x1 - 200, Math.min(y1, 900), 'g' + (o.key || ''), o.cracks);
  }
  function casing(x, y, s) {
    seed('gCasing' + x);
    pfill([[x - .55 * s, y], [x - .5 * s, y - 1.3 * s], [x + .5 * s, y - 1.3 * s], [x + .55 * s, y]], AP.iron, { tone: .85, dens: 1, sw: 1.1 });
    pfill(rectPts(x - .75 * s, y - 1.55 * s, 1.5 * s, .4 * s), AP.ironLt, { tone: .85, sw: 1 });
    plit([[x - .35 * s, y - 1.2 * s], [x - .2 * s, y - 1.2 * s], [x - .25 * s, y - .1 * s], [x - .4 * s, y - .1 * s]], .6);
    return [x, y - 1.55 * s];
  }
  // a puddle / sheet of water on the ground (ellipse-ish, spreading), with glints and gold sky reflected
  function pool(x, y, rx, ry, t, key) {
    if (rx < 4) return;
    seed('gPool' + key);
    const P = []; for (let i = 0; i < 22; i++) { const a = i / 22 * TAU; P.push([x + Math.cos(a) * rx * (1 + .12 * Math.sin(i * 2.3 + key.length)), y + Math.sin(a) * ry * (1 + .1 * Math.cos(i * 1.7))]); }
    pfill(P, AP.water, { tone: .55, dens: .85, kind: 'h', ink: AP.waterDk, sw: 1, curv: true });
    plit(P.map(p => [lerp(x, p[0], .8), lerp(y - ry * .2, p[1], .5)]), .45, '#F6D58E', { curv: true });
    for (let i = 0; i < Math.min(26, rx / 12); i++) {
      const a = hash(i * 3.1) * TAU, rr = Math.sqrt(hash(i * 5.3)) * .85, px = x + Math.cos(a) * rx * rr, py = y + Math.sin(a) * ry * rr, tw = .5 + .5 * Math.sin(t * (3 + hash(i) * 4) + i);
      pline([[px - 8, py], [px + 8, py]], 1.3, '#F2FAFC', { over: 0, passes: 1, alpha: tw });
    }
  }
  // crown splash: a ring of drops thrown up and out from (x, y); age in seconds since the impact
  function splash(x, y, s, age, key, amt = 1) {
    if (age < 0 || age > .7) return;
    seed('gSpl' + key);
    const k = age / .7;
    for (let i = 0; i < 14; i++) {
      const sd = i % 2 ? 1 : -1, sp = (.4 + hash(i * 3.3) * 1.2) * s * sd * amt, up = (1.2 + hash(i * 1.9) * 1.8) * s * amt;
      const p = arcPt([x, y], [x + sp * 2.2, y + .1 * s], up, k), pb = arcPt([x, y], [x + sp * 2.2, y + .1 * s], up, Math.max(0, k - .05));
      pline([pb, p], (1.4 + hash(i) * 1.6) * Math.max(.6, s / 60), i % 3 ? AP.waterLt : '#F4FBFD', { over: 0, passes: 1, alpha: 1 - k * .8 });
    }
    psmoke(x, y - .2 * s, s * (.4 + k * .9) * amt, '#E8F4F8', .6 * (1 - k));
    pline(ellPts(x, y, s * (.3 + k * 1.3) * amt, s * (.08 + k * .3) * amt, 18), 1, '#EAF6FA', { closed: true, passes: 1, alpha: 1 - k });
  }
  // falling water: streaks over a screen or world rect
  function rain(x0, y0, x1, y1, t, n, key, o = {}) {
    seed('gRain' + key);
    for (let i = 0; i < n; i++) {
      const q = frac(t * (o.speed ?? 1.6) * (.8 + hash(i * 7) * .5) + hash(i * 3)), x = lerp(x0, x1, hash(i * 1.9)) + (o.slant ?? 0) * q * 100, y = lerp(y0 - 80, y1, q), L = (o.len ?? 60) * (.6 + hash(i * 5) * .8);
      pline([[x - (o.slant ?? 0) * 8, y - L], [x, y]], (o.w ?? 1.3) * (.7 + hash(i) * .8), i % 4 ? (o.col || '#EEF7FA') : AP.waterLt, { over: 0, passes: 1, alpha: o.alpha ?? .8, j: .3 });
    }
  }
  // hanging sheets of falling water (the geyser's rain seen from underneath)
  function curtains(t, x0, x1, y0, y1, n, key, a = 1) {
    for (let i = 0; i < n; i++) {
      seed('gCurt' + key + i);
      const cx = lerp(x0, x1, (i + .5) / n) + Math.sin(t * .9 + i * 2.1) * 30, w = 90 + 110 * hash(i * 3.7), C = [];
      for (let k = 0; k <= 6; k++) C.push([cx + Math.sin(k * 1.3 + t * 1.7 + i) * 18 + (k / 6) * 40 * (hash(i) - .5), lerp(y0, y1, k / 6)]);
      pfill(limb(C, C.map((_, k) => w * (.6 + k / 6 * .6))), AP.waterLt, { tone: .1 * a, dens: .45 * a, kind: 'v', ink: null, curv: true });
      for (let j = 0; j < 6; j++) { const q = frac(t * (1.6 + hash(i * 5 + j) * .6) + hash(i * 7 + j)), y = lerp(y0, y1, q), xx = cx + (hash(i * 11 + j) - .5) * w; pline([[xx, y - 70], [xx, y]], 1.4, '#F4FBFD', { over: 0, passes: 1, alpha: .8 * a, j: .3 }); }
    }
  }
  // hats off heads: drawn around the head-contact point p (bottom of the crown), turned by rot
  function hatProp(kind, p, s, rot, col, key) {
    seed('gHat' + key);
    const Q = (u, v) => add2(p, rot2([u * s, v * s], rot)), sw = Math.max(.7, s / 55);
    if (kind === 'slouch' || kind === 'wide') {
      const bw = kind === 'wide' ? 1.25 : 1.05;
      pfill([Q(-.5, .02), Q(-.45, -.5), Q(0, -.62), Q(.45, -.5), Q(.5, .02)], col, { tone: .7, dens: .9, sw, curv: true });
      pline([Q(-.5, -.06), Q(.5, -.06)], sw * 2.4, mixCol(col, AP.graphite, .5), { over: 0 });
      pfill([Q(-bw, .1), Q(0, -.04), Q(bw, .1), Q(bw * .9, .18), Q(0, .12), Q(-bw * .9, .18)], col, { tone: .75, dens: 1, sw, curv: true });
    } else if (kind === 'bowler') {
      pfill([Q(-.5, .02), Q(-.48, -.45), Q(0, -.65), Q(.48, -.45), Q(.5, .02)], col, { tone: .85, dens: 1.1, sw, curv: true });
      pfill([Q(-.7, .06), Q(0, -.02), Q(.7, .06), Q(0, .12)], col, { tone: .9, dens: 1, sw, curv: true });
      plit([Q(-.3, -.45), Q(-.1, -.55), Q(-.2, -.25)], .5);
    } else if (kind === 'cap') {
      pfill([Q(-.55, .04), Q(-.5, -.34), Q(0, -.44), Q(.5, -.34), Q(.55, .04)], col, { tone: .8, dens: 1, sw, curv: true });
      pfill([Q(.35, .02), Q(1.0, .1), Q(.95, .18), Q(.4, .12)], mixCol(col, AP.graphite, .3), { tone: .85, sw });
    } else if (kind === 'toque') {
      pfill([Q(-.52, .04), Q(-.45, -.55), Q(0, -.75), Q(.45, -.55), Q(.52, .04)], col, { tone: .8, dens: 1.2, sw, curv: true, kind: 'v' });
      pline([Q(-.52, -.06), Q(.52, -.06)], sw * 3, mixCol(col, AP.paperLt, .35), { over: 0 });
    }
  }
  // a hat flung from p0 at time tr with velocity v (px/s), gravity g; returns the position/rotation at time t
  const fling = (t, tr, p0, v, g = 2600, spin = 7) => { const d = Math.max(0, t - tr); return { p: [p0[0] + v[0] * d, p0[1] + v[1] * d + .5 * g * d * d], rot: spin * d }; };
  // run cycle for man() (side view), phase p
  function runPose(p, amp = 1) {
    const a = p * TAU, s = Math.sin(a);
    return { lean: .3 * amp, hpF: .85 * s * amp, knF: .25 + 1.2 * clamp(Math.sin(a + 1.3)) * amp, hpB: -.85 * s * amp, knB: .25 + 1.2 * clamp(Math.sin(a + 1.3 + Math.PI)) * amp,
      shF: -.95 * s * amp, elF: 1.4, shB: .95 * s * amp, elB: 1.4, dy: .28 * Math.abs(Math.cos(a)) * amp, head: -.1 };
  }
  // the engine's whistle plume: a column of steam whose puffs carry the pull strength from when they left the whistle
  function plume(base, t, pullAt, o = {}) {
    const n = o.n ?? 44, life = o.life ?? 3, Hh = o.h ?? 1000, sc = o.s ?? 1;
    seed('gPlume' + (o.key || ''));
    // the billow: puffs leave the whistle fast and slow as they climb and swell; each carries the pull from when it left
    for (let i = n - 1; i >= 0; i--) {
      const q = frac(t / life + i / n), te = t - q * life, I = clamp(pullAt(te));
      if (I < .05) continue;
      const rise = (1 - Math.pow(1 - q, 1.25)) * Hh * (.5 + .5 * I), x = base[0] + Math.sin(q * 5 + i * 1.3) * 22 * sc * q - q * q * 260 * sc, y = base[1] - rise;
      const r = (34 + Math.sqrt(q) * 250) * sc * (.55 + .45 * I);
      psmoke(x, y, r, '#FBF5EA', .9 * (1 - q * .7) * I);
      psmoke(x + r * .3, y - r * .15, r * .62, '#F7D7A6', .45 * (1 - q) * I);      // dawn light on the sunward side
      psmoke(x - r * .35, y + r * .2, r * .5, '#C9B6A4', .25 * (1 - q) * I);       // cool shade underneath
      if (q > .12) {                                                                 // a scalloped pencil edge on the billow
        const a0 = -Math.PI * (.95 + .1 * hash(i)), P = [];
        for (let k = 0; k <= 10; k++) { const a = a0 + k / 10 * Math.PI * .9, bump = 1 + .1 * Math.abs(Math.sin(k * 1.9 + i)); P.push(polar([x, y], a, r * .72 * bump)); }
        pline(P, 1, AP.graphiteLt, { over: 0, passes: 1, alpha: .45 * (1 - q) * I, curv: true, j: .8 });
      }
    }
    // the dense jet at the whistle mouth
    const I0 = clamp(pullAt(t));
    if (I0 > .05) {
      pfill([[base[0] - 8 * sc, base[1]], [base[0] - 40 * sc * I0, base[1] - 170 * sc * I0], [base[0] + 36 * sc * I0, base[1] - 170 * sc * I0], [base[0] + 8 * sc, base[1]]], '#FFFDF8', { tone: .8 * I0, dens: .6, ink: null, kind: 'v' });
      for (let i = 0; i < 4; i++) psmoke(base[0] + (hash(i + BOILN % 4) - .5) * 20 * sc, base[1] - (40 + i * 45) * sc * I0, (22 + i * 16) * sc * I0, '#FFFFFF', .9 * I0);
    }
    // the scream: fast streaks shooting up the core
    for (let i = 0; i < 16; i++) {
      const q = frac(t * 2.2 + hash(i * 3.3)), I = clamp(pullAt(t - q * .4)), y = base[1] - 40 * sc - q * Hh * .7, L = (80 + 160 * hash(i)) * sc, x = base[0] + (hash(i * 5.1) - .5) * 60 * sc * (.3 + q) - q * q * 90 * sc;
      if (I > .1) pline([[x, y + L], [x, y]], 1.4 + hash(i) * 1.6, i % 3 ? '#FFFFFF' : AP.graphiteLt, { over: 0, passes: 1, alpha: .85 * I * (1 - q) });
    }
    // shock rings at the whistle mouth
    for (let i = 0; i < 3; i++) { const q = frac(t * 3 + i / 3); pline(ellPts(base[0], base[1] - 20 * sc, (14 + q * 80) * sc, (5 + q * 22) * sc, 16), 1.1, AP.graphite, { closed: true, passes: 1, alpha: .5 * (1 - q) * I0 }); }
  }
  // the tall brass whistle Bill works: a pipe up out of the firebox, the bell, the lever. Returns { mouth, pivot, tip }
  function whistle(x, y0, y1, s, pull) {
    seed('gWhistle');
    pfill(limb([[x, y0], [x, y1]], [.28 * s, .24 * s]), AP.iron, { tone: .85, sw: .9 });
    pfill([[x - .32 * s, y1], [x - .3 * s, y1 - 1.2 * s], [x - .22 * s, y1 - 1.35 * s], [x + .22 * s, y1 - 1.35 * s], [x + .3 * s, y1 - 1.2 * s], [x + .32 * s, y1]], AP.brass, { tone: .9, dens: .9, sw: 1 });
    for (const k of [.3, .7]) pline([[x - .31 * s, y1 - k * 1.2 * s], [x + .31 * s, y1 - k * 1.2 * s]], .9, mixCol(AP.brass, AP.graphite, .4), { over: 0, passes: 1 });
    plit([[x - .22 * s, y1 - .1 * s], [x - .12 * s, y1 - .1 * s], [x - .12 * s, y1 - 1.15 * s], [x - .2 * s, y1 - 1.15 * s]], .7, '#FFF1CF');
    const pv = [x - .3 * s, y1 + .15 * s], la = .12 + .55 * pull, tip = [pv[0] - 1.25 * s * Math.cos(la), pv[1] + 1.25 * s * Math.sin(la)];
    pline([pv, tip], 2.4, AP.iron, { over: 0 });
    pfill(ellPts(pv[0], pv[1], .12 * s, .12 * s, 8), AP.brass, { tone: .9, sw: .7 });
    return { mouth: [x, y1 - 1.35 * s], pivot: pv, tip };
  }
  // steam white-out that clears (k 0 = frame full of steam, 1 = gone)
  function steamOut(k, key) {
    if (k >= 1) return;
    seed('gSteam' + key);
    const a = 1 - easeOut(k);
    ptone(rectPts(-40, -40, W + 80, H + 80), '#FBF6EC', clamp(a * 1.15));
    for (let i = 0; i < 22; i++) {
      const hx = hash(i * 3.1) * W, hy = hash(i * 7.7) * 900, dx = hx - W / 2, dy = hy - 450, d = Math.hypot(dx, dy) || 1;
      psmoke(hx + dx / d * k * 500, hy + dy / d * k * 300 - k * 200, 220 + hash(i) * 260 + k * 200, '#FBF6EC', .9 * a);
    }
    pshade(rectPts(-40, -40, W + 80, H + 80), '#FFFFFF', .5 * a, { kind: 'v' });
  }
  // a wave of water thrown across the lens: covers (p 0 → .5) and drains down the frame (p .5 → 1)
  function waterWipe(p) {
    if (p <= 0 || p >= 1) return;
    seed('gWet');
    const cover = p < .5 ? easeOut(p * 2) : 1, drain = p < .5 ? 0 : ease((p - .5) * 2);
    // the sheet: its leading edge sweeps in from the right; when it drains, its top edge falls away down the frame
    const edgeX = y => lerp(W + 350, -350, cover) + 90 * Math.sin(y * .011 + 1.3) + 40 * Math.sin(y * .031);
    const topY = x => -80 + drain * 1150 + 50 * Math.sin(x * .009 + .7) + 25 * Math.sin(x * .027);
    const Q = [];
    if (p < .5) { for (let i = 0; i <= 18; i++) { const y = lerp(-80, H + 80, i / 18); Q.push([edgeX(y), y]); } Q.push([W + 500, H + 80], [W + 500, -80]); }
    else { for (let i = 0; i <= 24; i++) { const x = lerp(-100, W + 100, i / 24); Q.push([x, topY(x)]); } Q.push([W + 100, H + 80], [-100, H + 80]); }
    ptone(Q, mixCol(AP.water, AP.waterLt, .35), .96);
    pshade(Q, AP.waterDk, .8, { kind: 'v' });
    plit(Q, .35, '#F2FAFC', { kind: 'v' });
    if (p < .5) for (let i = 0; i < 26; i++) { const y = hash(i * 2.9) * 1000 - 40; psmoke(edgeX(y) + 10, y, 30 + 40 * hash(i), '#F4FBFD', .55); pline([[edgeX(y) - 30, y], [edgeX(y) + 60, y + 8]], 1.6, '#F4FBFD', { over: 0, passes: 1, alpha: .8 }); }
    for (let i = 0; i < 46; i++) { const x = hash(i * 6.1) * W, y0 = topY(x), L = 80 + hash(i) * 380; if (drain > 0) pline([[x, y0 - L * drain], [x, y0 + 20]], 2 + hash(i * 3) * 3, '#EAF6FA', { over: 0, passes: 1, alpha: .8 }); }
  }
  // the roar: short strokes radiating from a mouth
  function roar(p, s, k, key) {
    if (k <= 0) return;
    seed('gRoar' + key);
    for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * .32, r0 = s * (.8 + .2 * frac(T * 3 + i / 7)), r1 = r0 + s * .5; pline([polar(p, a, r0), polar(p, a, r1)], 1.4, AP.graphite, { over: 0, passes: 1, alpha: k }); }
  }

  // ================================================================================================
  // G1 · 225.55–229.24 · [54] "Hark! the whistle's blowing": Bill on the cord, the plume into the dawn
  // ================================================================================================
  const G1_YANK = bt(425);                               // 227.22: the second, bigger yank lands on the beat
  const g1Pull = t => {
    const lt = t - G_T0;
    let p = kf(lt, [[-2, 1], [1.05, 1], [1.4, .32], [G1_YANK - G_T0 - .02, .25], [G1_YANK - G_T0 + .05, 1]], ease);
    if (t > G1_YANK) p -= .14 * (1 - pulse(t, 5)) * (beatN(t) % 2);   // pumps the cord on alternate beats
    return clamp(p);
  };
  const by0 = (y, s) => y - 4.2 * s;                    // the engine's boiler line (see engine())
  function g1(t, lt, dur) {
    const z = kf(lt, [[0, 1.12], [1.1, 1.08], [3.3, .74]], ease), cy = kf(lt, [[0, 560], [1.1, 548], [3.3, 440]], ease);
    const whip = easeIn(seg(lt, dur - .28, dur));
    const cx = kf(lt, [[0, 900], [3.3, 960]], ease) + whip * 900;
    const sh = shakeXY(t, 3 * g1Pull(t));
    camOn(cx + sh[0], cy + sh[1], z);
    LIGHT = [-.75, .55];
    gDawnSky({ y0: -700, y1: 760, x0: -800, x1: 2800 });
    gSunrise(1780, 752, 46, 1);
    dawnPlain(760, { x0: -800, x1: 2800, y1: 1500, cracks: .35 });
    derrick(330, 770, 520, { key: 'g1' });
    // the engine and its whistle lever
    const ES = 64, EX = 1260, EY = 882, pull = g1Pull(t);
    const E = engine(EX, EY, ES, { ph: bpOf(t) * .5, fire: .8, gauge: .92, smoke: .6, smokePh: t * .5 });
    const WH = whistle(EX - 5.3 * ES, by0(EY, ES) - 2.1 * ES + 4, by0(EY, ES) - 4.5 * ES, ES, pull);
    plume(WH.mouth, t, g1Pull, { h: 1250, s: 1.15 });
    // Bill: both hands on the cord, the whole body in the pull
    const ant = seg(lt, 1.4, G1_YANK - G_T0 - .05) * (t < G1_YANK ? 1 : 0);
    const handle = [WH.tip[0] - 20 - 15 * pull, WH.tip[1] + 50 + 110 * pull - 30 * ant];
    const P = kp(pull, [[0, { lean: .08, head: -.6, hpF: .1, knF: .05, hpB: -.1, knB: .05, dy: .3 * ant, face: 'grit', mouth: .2 }],
      [1, { lean: -.4, head: -.45, hpF: .5, knF: .6, hpB: -.3, knB: .4, dy: 0, face: 'shout', mouth: .85 }]]);
    const bx = 690 - 25 * pull;
    const J = reach('g1bill', bx, EY, 62, { ...P, blink: lt > 1.3 && lt < 1.45 ? 1 : 0 }, CAST.bill, { F: handle, B: [handle[0] - 10, handle[1] + 40] });
    seed('g1cord'); pline([WH.tip, handle], 1.4, AP.earthDk, { over: 0 }); pline([handle, [handle[0] - 6, handle[1] + 50], [handle[0] - 16, handle[1] + 80]], 1.2, AP.earthDk, { over: 0, curv: true });
    pfill(rectPts(handle[0] - 5, handle[1] - 4, 10, 22), AP.timber, { tone: .85, sw: .8 });
    roar(J.head, 62, pull * seg(lt, .8, 1.2), 'g1');
    camOff();
    steamOut(seg(lt, 0, 1.15), 'g1');
    speedLines(whip, false, 'g1', AP.graphite, '#F2D8A8');
  }

  // ================================================================================================
  // G2 · 229.24–233.54 · [55] "the boys are madly cheering": hats, the hug, the jig, the driller roaring
  // ================================================================================================
  const G2_T0 = 229.24;
  function g2(t, lt, dur) {
    const whipIn = 1 - easeOut(seg(lt, 0, .3));
    const z = lerp(1, 1.1, ease(seg(lt, .2, dur))), cx = 960 - whipIn * 900 + 20 * ease(seg(lt, .2, dur)), cy = lerp(520, 500, ease(seg(lt, .2, dur)));
    const beatK = pulse(t, 8);
    camOn(cx, cy, z);
    LIGHT = [-.8, .45];
    gDawnSky({ y0: -300, x0: -600, x1: 2600, y1: 640, blue: .08 });
    gSunrise(1560, 636, 40, 1);
    dawnPlain(640, { x0: -600, x1: 2600, y1: 1400, cracks: .3, key: 'g2' });
    derrick(1150, 700, 560, { key: 'g2' });
    const top = casing(1150, 704, 20);
    // the distant engine still screaming, Bill a speck waving his toque
    engine(1720, 700, 20, { ph: bpOf(t) * .5, fire: .7, smoke: .5, smokePh: t * .5 });
    plume([1720 - 3.6 * 20 + 3, 700 - 4.2 * 20 - 2.3 * 20 - 19], t, () => 1, { h: 700, s: .6, n: 20, key: 'g2' });
    seed('g2bill'); man(1560, 704, 16, { view: 'front', shF: 2.6 + .4 * Math.sin(t * 9), elF: -.5, shB: .3, elB: .2, face: 'shout' }, { ...CAST.bill, hat: null });
    // ---- the hug: hand1 (facing right) and hand2 (facing left) clinch, hand2 swings hand1 off his feet on the beat
    const H1R = G2_T0 + .08, H2R = G2_T0 + .55, hugK = ease(seg(lt, .75, 1.35)), lift = hugK * Math.abs(Math.sin(bpOf(t) * Math.PI / 2 + .3));
    const h1x = lerp(380, 470, hugK), h2x = lerp(690, 598, hugK);
    const armUp = { shF: 2.9, elF: -.1 }, hugArms = { shF: 1.55, elF: 1.25, shB: 1.35, elB: 1.5 };
    let p1 = kp(lt, [[-.3, { lean: .1, shF: .4, elF: 1.6, shB: -.3, elB: .5, face: 'shout', mouth: .6 }], [H1R - G2_T0, { lean: -.2, ...armUp, shB: .6, elB: .4, face: 'shout', mouth: .8, head: -.35 }],
      [.75, { lean: -.1, ...armUp, shB: .9, elB: .5, face: 'laugh', head: -.2 }], [1.35, { lean: .25, ...hugArms, face: 'laugh', head: .05 }]]);
    let p2 = kp(lt, [[.1, { lean: .1, shF: .4, elF: 1.7, shB: -.2, elB: .4, face: 'shout', mouth: .7 }], [H2R - G2_T0, { lean: -.25, ...armUp, shB: .5, elB: .3, face: 'shout', mouth: .9, head: -.4 }],
      [.95, { lean: -.1, ...armUp, shB: 1, elB: .6, face: 'laugh', head: -.2 }], [1.4, { lean: .2, ...hugArms, face: 'laugh', head: .1 }]]);
    const lk1 = lt > H1R - G2_T0 ? { ...CAST.hand1, hat: null } : CAST.hand1, lk2 = lt > H2R - G2_T0 ? { ...CAST.hand2, hat: null } : CAST.hand2;
    seed('g2h2'); const J2 = man(h2x, 870, 62, { ...p2, flip: true, lean: p2.lean - .12 * lift, hpF: .15, knF: .3 + .2 * lift, hpB: -.15, knB: .25 }, lk2);
    seed('g2h1'); const J1 = man(h1x, 870, 62, { ...p1, dy: .9 * lift, hpF: .3 * lift, knF: .9 * lift + .05, hpB: -.2 - .3 * lift, knB: .6 * lift + .05 }, lk1);
    // hand2's arms round hand1's back, drawn over him
    if (hugK > .5) { seed('g2hug'); const s = 62, a = clamp((hugK - .5) * 2); for (const [dy, w] of [[.6, .5], [1.4, .46]]) pline([[J1.neck[0] - .6 * s, J1.neck[1] + dy * s], [J1.neck[0] - .1 * s, J1.neck[1] + (dy - .15) * s], [J1.neck[0] + .5 * s, J1.neck[1] + dy * s]], s * w * .12, CAST.hand2.skin, { curv: true, over: 0, alpha: a }); }
    // ---- the boss: a jig, heels kicking alternately on every beat, one arm up
    const bb = bpOf(t), bk = Math.floor(bb) % 2, bf = frac(bb), kick = Math.sin(Math.min(1, bf / .6) * Math.PI);
    const jig = { lean: -.08, head: -.1, face: 'laugh', mouth: .3, shF: 2.5 + .25 * Math.sin(t * 7), elF: .5, shB: -.6, elB: -1.4,
      hpF: bk ? .95 * kick : -.1, knF: bk ? .3 + .9 * kick : .15, hpB: bk ? -.1 : .9 * kick, knB: bk ? .15 : .3 + .9 * kick, dy: .35 * Math.sin(bf * Math.PI) };
    seed('g2boss'); man(1400, 872, 64, { ...jig, flip: true }, CAST.boss);
    // ---- the driller: centre, arms flung up, roaring; fists punch the sky on the beats
    const drP = kp(lt, [[0, { view: 'front', shF: 1.4, elF: .8, shB: 1.3, elB: .9, face: 'grit', head: 0 }], [.45, { view: 'front', shF: 2.85, elF: -.2, shB: 2.75, elB: -.3, face: 'shout', mouth: .9, head: -.35 }]], easeOut);
    const punch = beatN(t) % 2 ? beatK : 0, punchB = beatN(t) % 2 ? 0 : beatK;
    seed('g2drill');
    const JD = man(960, 876, 72, { ...drP, shF: drP.shF + .18 * punch, shB: drP.shB + .18 * punchB, dy: .12 * beatK * seg(lt, .45, .7) }, CAST.driller);
    roar([JD.head[0], JD.head[1] + .4 * 72], 72, seg(lt, .4, .6), 'g2');
    // ---- the hats: each on its own clock and arc (two more from mates off screen)
    const hats = [
      ['cap', CAST.hand1.hatCol, H1R, [h1x + 20, 870 - 7.4 * 62], [200, -1500], 66, 8],
      ['slouch', CAST.hand2.hatCol, H2R, [h2x - 25, 870 - 7.4 * 62], [-150, -1600], 66, -6],
      ['slouch', '#6E5A44', G2_T0 + 1.05, [-60, 640], [560, -1750], 56, 5],
      ['wide', '#B8A47C', G2_T0 + 1.7, [1990, 600], [-640, -1700], 58, -7],
      ['cap', '#5A6A4A', G2_T0 + 2.55, [760, 930], [120, -1900], 54, 9],
    ];
    hats.forEach(([kind, col, tr, p0, v, s, spin], i) => { if (t < tr) return; const f = fling(t, tr, p0, v, 2500, spin); hatProp(kind, f.p, s, f.rot, col, 'g2' + i); });
    const sp = scr(...top);
    camOff();
    speedLines(whipIn, false, 'g2', AP.graphite, '#F2D8A8');
    // iris of hatching onto the casing mouth, where the rumble is
    const ir = seg(lt, dur - .55, dur);
    if (ir > 0) { const r = lerp(1500, 0, easeIn(ir)); hatchIris(sp[0], sp[1], r); if (r < 160) pglow(sp[0], sp[1], 160, '#9CCBE0', ir); }
  }

  // ================================================================================================
  // G3 · 233.54–238.58 · [56] "rushing up the tubing from four thousand feet": the reversed dive
  // ================================================================================================
  const CX = 960, G3_DC = [[0, 3985], [.45, 3975], [1.05, 3560], [1.75, 2080], [2.2, 1400], [2.55, 1057], [3.9, 1054], [4.55, 300], [5.04, -60]];
  function g3(t, lt, dur) {
    // camera depth (ft) and zoom; the water head's depth (ft)
    const dC = kf(lt, G3_DC, ease), hallK = kf(lt, [[2.15, 0], [2.6, 1], [3.85, 1], [4.3, 0]], ease);
    const z = kf(lt, [[0, 1.25], [.45, 1.2], [1.05, .7], [1.75, .62], [2.2, .9], [2.6, 4.0], [3.85, 5.0], [4.3, .9], [4.75, .78], [5.04, 1.05]], ease);
    const wH = kf(lt, [[0, 4046], [.38, 4046], [1.05, 3450], [1.75, 1950], [2.2, 1250], [2.52, 1113], [2.62, 1018], [3.9, 540], [4.66, 0], [5.04, -300]], x => x);
    const blast = seg(lt, .38, .5), shk = shakeXY(t, (1 - seg(lt, .38, 1.2)) * blast * 14 + 2);
    const camY = lerp(dC * FT + 60 / z, lerp(1272, 1262, seg(lt, 2.6, 3.85)), hallK);
    camOn(lerp(CX, lerp(918, 900, seg(lt, 2.6, 3.85)), hallK) + shk[0], camY + shk[1], z);
    // the surface near the end: dawn sky, the plain line, the derrick
    if (camY - 540 / z < 0) {
      gDawnSky({ x0: CX - 3000, x1: CX + 3000, y0: -2600, y1: 0, blue: .25 });
      gSunrise(CX + 1100, -2, 70, 1);
      derrick(CX, 0, 900, { floor: true, key: 'g3' });
    }
    section(CX, dC - 1100 / z / FT, dC + 1100 / z / FT, { water: true });
    // coal bed furniture from chapter C
    if (dC > 1000 && dC < 3000) {
      for (const [dd, x, r, k] of [[1260, 330, 70, 1], [1420, 1350, 52, 2], [1580, 560, 86, 3], [1720, 1560, 60, 4], [1350, 1780, 44, 5]]) ammonite(x, dd * FT, r, k);
      fern(420, 1960 * FT, 260, -.4, 1); fern(1900, 2230 * FT, 220, -2.6, 2); fern(200, 2250 * FT, 200, -.9, 3);
      ichthyosaur(990, 2080 * FT, 2.4, -.07);
    }
    // the aquifer glowing up through the crack
    seed('g3aq');
    pglow(CX, 4060 * FT, 380 + 200 * blast, '#9CCBE0', .6 + .4 * blast);
    if (dC > 3500) for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * .4; pline([[CX, 4050 * FT], polar([CX, 4050 * FT], a + (hash(i) - .5) * .3, 60 + 90 * blast + 30 * hash(i * 2))], 1.6, AP.waterLt, { over: 0 }); }
    // the shaft, and the rods kicked up by the blast
    shaft(CX, 4046);
    const kickUp = blast * 60 * (1 - seg(lt, .5, 1.2) * .6);
    rods(CX, -40, 4046 * FT - 50 - kickUp, { w: 14, col: AP.pine }); bit(CX, 4046 * FT - kickUp, 34, { hit: Math.max(0, 1 - Math.abs(lt - .42) * 5) });
    // the water column in the shaft, from the aquifer up to the head
    const hy = wH * FT, by = 4050 * FT;
    if (lt > .38) {
      seed('g3col');
      pfill([[CX - 17, hy], [CX + 17, hy], [CX + 17, by], [CX - 17, by]], AP.water, { tone: .7, dens: 1, kind: 'v', ink: null });
      plit([[CX - 8, hy], [CX - 3, hy], [CX - 3, by], [CX - 8, by]], .8, '#EAF6FA', { kind: 'v' });
      for (let i = 0; i < 40; i++) { const q = frac(hash(i * 1.7) - lt * 1.6), y = lerp(hy, by, q); if (y > by) continue; const L = 40 + 80 * hash(i * 3); pline([[CX - 12 + hash(i * 5) * 24, y], [CX - 12 + hash(i * 5) * 24, Math.max(hy, y - L)]], 1.1, '#EAF6FA', { over: 0, passes: 1, alpha: .8 }); }
      // the churning head of the water: foam and spray, a glow
      const hz = 1 / Math.min(1, z);                   // keep the head readable when the camera is far out
      pglow(CX, hy, 110 * hz, '#CFEAF5', .9);
      for (let i = 0; i < 6; i++) psmoke(CX + (hash(i * 2 + BOILN % 3) - .5) * 30 * hz, hy - (10 + hash(i) * 30) * hz, (18 + hash(i * 3) * 20) * hz, '#F2F9FB', .85);
      for (let i = 0; i < 10; i++) { const q = frac(lt * 3 + i / 10), sd = (hash(i) - .5); pline([[CX + sd * 30 * hz * (1 + q), hy - q * 110 * hz], [CX + sd * 34 * hz * (1 + q), hy - q * 110 * hz + 24 * hz]], 1.4 * Math.min(2, hz), '#F4FBFD', { over: 0, passes: 1, alpha: 1 - q }); }
    }
    // the devil's parlour, flooded from below
    if (dC > 600 && dC < 1700) {
      const H0 = { t, hole: 1, chair: 'crushed', crack: 1, lit: 1 - .6 * seg(lt, 2.6, 3.4), wet: .08 + .22 * seg(lt, 2.62, 3.9),
        front: H => {
          // the devil, standing by his wrecked chair; the jet comes up through the floorboards right beside him
          const hit = 2.56, dS = H.ds;
          const before = lt < hit, after = lt - hit;
          const P = before
            ? { face: 'annoyed', lookUp: -1, look: .8, head: .3, lean: .12, shF: .6, elF: .9, shB: .2, elB: .6, hpF: .2, knF: .3, knB: .2, squash: .1, tail: Math.sin(t * 6) * .6, shake: .6, cupOnHorn: 1, cupWob: .1 * Math.sin(t * 13), dust: .6 }
            : after < .22 ? { face: 'shock', lookUp: .8, head: -.1, shF: 2.2, elF: .4, shB: 2, elB: .5, lean: -.2, squash: .2, hpF: .2, knF: .3, cupOnHorn: 1, cupWob: .5 * spring(t, t - after, 4, 18), soak: clamp(after * 5), dust: .3, blink: after < .06 ? 1 : 0 }
            : { face: 'soaked', lookUp: -.1, head: .2, lean: .15, shF: .15, elF: .2, shB: -.1, elB: .2, hpF: .35, knF: .6, hpB: .1, knB: .45, soak: 1, steam: 1, cupOnHorn: 1, cupWob: .25 * spring(t, t - after + .22, 5, 16), tail: -.8 + .05 * Math.sin(t * 3), squash: .22, blink: after > .22 && after < .34 ? 1 : 0 };
          seed('g3devil'); LIGHT = [.8, .3];
          const DJ = devil(HALL.x - 2.9 * HALL.s, H.floorY, dS, { ...P, fistF: before, fistB: before }, {});
          // the jet through the floor, hitting the ceiling hole, spraying all over him
          if (lt > hit - .06) {
            const k = seg(lt, hit - .06, hit + .08), jy = lerp(H.floorY, HALL.y - 20, k);
            seed('g3jet');
            pfill([[CX - 16, H.floorY], [CX - 22, jy], [CX + 22, jy], [CX + 16, H.floorY]], AP.water, { tone: .7, dens: 1, kind: 'v', sw: .5, ink: AP.waterDk, j: .2 });
            plit([[CX - 6, H.floorY], [CX - 8, jy], [CX - 2, jy], [CX - 1, H.floorY]], .8, '#EAF6FA', { kind: 'v' });
            for (let i = 0; i < 12; i++) { const q = frac(lt * 2.2 + hash(i)), sd = hash(i * 3) < .7 ? -1 : 1; const p = arcPt([CX, jy + 10], [CX + sd * (30 + 90 * hash(i * 5)), H.floorY], 40 + 40 * hash(i * 7), q), pb = arcPt([CX, jy + 10], [CX + sd * (30 + 90 * hash(i * 5)), H.floorY], 40 + 40 * hash(i * 7), Math.max(0, q - .06)); pline([pb, p], .45, i % 2 ? '#F4FBFD' : AP.waterLt, { over: 0, passes: 1, j: .15 }); }
            for (let i = 0; i < 5; i++) { const q = frac(lt * 1.2 + i / 5); psmoke(CX + (hash(i) - .5) * 60, HALL.y + 10 + q * 20, 10 + 22 * q, '#EEF7FA', .7 * (1 - q)); }
            // the spray sheet that catches him full in the face
            if (after > 0) { const a = 1 - seg(after, .3, 1.2) * .6; for (let i = 0; i < 9; i++) { const q = frac(lt * 2.5 + hash(i * 2.3)), y0 = HALL.y + 12 + hash(i * 4) * 20; pline([[CX - 18, y0], [lerp(CX - 18, DJ.head[0] + 10, q), y0 + q * q * 40]], .4, '#F4FBFD', { over: 0, passes: 1, alpha: a * (1 - q * .5), j: .15 }); } }
            // a thick rope of water slewing off the jet straight onto his head
            if (after > -.02) {
              const k2 = seg(after, -.02, .12), fade = 1 - seg(after, 1.0, 1.35) * .7, src = [CX - 14, HALL.y + 14], dst = add2(DJ.head, [dS * .1, -dS * .5]);
              const C = []; for (let i = 0; i <= 8; i++) C.push(arcPt(src, dst, 22, i / 8 * k2));
              seed('g3douse');
              pfill(limb(C, C.map((_, i) => lerp(9, 16, i / 8))), AP.water, { tone: .7 * fade, dens: fade, kind: 'v', sw: .4, ink: AP.waterDk, j: .15 });
              plit(limb(C, C.map(() => 3)), .8 * fade, '#EAF6FA');
              if (k2 >= 1) { for (let i = 0; i < 10; i++) { const q = frac(lt * 2.4 + hash(i * 3.1)), sd = i % 2 ? 1 : -1; const p = arcPt(dst, [dst[0] + sd * (10 + 30 * hash(i)), H.floorY], 18 + 20 * hash(i * 5), q); pline([p, [p[0], p[1] + 5]], .9, '#F4FBFD', { over: 0, passes: 1, alpha: fade, j: .1 }); } psmoke(dst[0], dst[1], dS * .8, '#F2F9FB', .6 * fade); }
            }
            // steam hissing off the devil where the water hits him
            if (after > .1) for (let i = 0; i < 5; i++) { const q = frac(lt * 1.1 + i / 5); psmoke(DJ.head[0] + (hash(i) - .5) * 2 * dS - q * 10, DJ.head[1] - dS * (.5 + q * 2.4), dS * (.3 + q * .8), AP.paperLt, .75 * (1 - q)); }
          }
        } };
      const LS = LIGHT;
      devilHall(HALL.x, HALL.y, HALL.s, H0);
      LIGHT = LS;
      devilHallHoleRim({ bore: [HALL.x, HALL.y] }, 1);
      if (lt > 2.62) { seed('g3hole'); pfill([[CX - 17, HALL.y - 40], [CX + 17, HALL.y - 40], [CX + 21, HALL.y + 8], [CX - 21, HALL.y + 8]], AP.water, { tone: .75, dens: 1, kind: 'v', ink: null }); plit([[CX - 7, HALL.y - 40], [CX - 2, HALL.y - 40], [CX - 2, HALL.y + 8], [CX - 7, HALL.y + 8]], .8, '#EAF6FA', { kind: 'v' }); }
    }
    // the casing mouth and the burst out into the dawn at the very end
    if (camY - 540 / z < 200) {
      const top = casing(CX, 4, 22);
      if (wH < 5) { const hh = clamp(-wH * FT * 2 + 40, 0, 1400); gGeyser(CX, top[1] + 4, hh, t, { w: 40, spray: seg(hh, 60, 500), crown: 0, drops: 30, key: 'g3' }); }
    }
    ruler(CX - 520, dC - 1100 / z / FT, dC + 1100 / z / FT, Math.max(0, wH));
    camOff();
    // speed lines while the camera races
    const vel = Math.abs(kf(lt + .03, G3_DC, ease) - dC) / .03;
    speedLines(clamp(vel / 4500) * .8, true, 'g3', AP.waterDk, mixCol(AP.paper, AP.waterLt, .3));
    if (lt < .3) hatchIris(W / 2, H / 2 - 60, lerp(0, 1500, easeIn(seg(lt, 0, .3))));
    // flash of spray on the cut
    if (lt > dur - .12) ptone(rectPts(-40, -40, W + 80, H + 80), '#F2FAFC', seg(lt, dur - .12, dur) * .8);
  }

  // ================================================================================================
  // G4 · 238.58–243.00 · [57] "spouts above the casing in a million-gallon flow": the geyser
  // ================================================================================================
  const GX = 860, GY = 780;
  function g4(t, lt, dur) {
    const hK = easeOut(seg(lt, 0, 1.4)), surge = .035 * Math.sin(t * 5.3) + .025 * Math.sin(t * 8.9 + 1);
    const hG = lerp(260, 640, hK) * (1 + surge * hK);
    const crown = ease(seg(lt, .8, 1.9));
    const z = kf(lt, [[0, 1.6], [1.4, .9], [dur, .94]], ease);
    const cy = kf(lt, [[0, 660], [1.4, 505], [dur, 500]], ease) + easeIn(seg(lt, dur - .3, dur)) * 520;
    const cx = kf(lt, [[0, 860], [1.4, 960], [dur, 950]], ease);
    const sh = shakeXY(t, 5 * (1 - seg(lt, 0, 1.5)));
    camOn(cx + sh[0], cy + sh[1], z);
    LIGHT = [-.8, .4];
    gDawnSky({ y0: -260, y1: GY - 20, x0: -900, x1: 2900, blue: .35 + .6 * ease(seg(lt, .5, 3)) });
    gSunrise(1560, GY - 44, 56, 1);
    dawnPlain(GY - 30, { x0: -900, x1: 2900, y1: 1600, key: 'g4', col: '#C49A6C' });
    // the water spreading over the plain
    pool(GX + 40, GY + 46, 140 + 560 * ease(seg(lt, .4, dur)), 22 + 70 * ease(seg(lt, .4, dur)), t, 'g4');
    // tiny crew dancing at the foot, each on his own bounce
    const crew = [[GX - 250, CAST.hand1, 0], [GX - 180, CAST.boss, .5], [GX + 190, CAST.driller, .25], [GX + 270, CAST.hand2, .75], [GX + 430, CAST.bill, .4]];
    crew.forEach(([x, L, ph], i) => { const b = Math.abs(Math.sin((bpOf(t) + ph) * Math.PI)); seed('g4c' + i); man(x, GY + 70, 17, { view: 'front', shF: 2.4 + .4 * b, elF: -.2, shB: 2.2 + .5 * (1 - b), elB: -.2, dy: .5 * b, face: 'shout' }, { ...L, hat: i === 2 ? L.hat : null }); });
    // the geyser: veils, the rainbow in the spray, then the column, the derrick lattice over its foot
    gGeyser(GX, GY - 6, hG, t, { w: 92, crown, spray: ease(seg(lt, .3, 1.7)), sun: 1, reach: 6,
      behind: () => gRainbow(GX - 40, GY + 90, 720, 20, Math.PI + .06, Math.PI + 1.28, ease(seg(lt, 1.4, 2.9)), crown) });
    derrick(GX, GY, 280, { key: 'g4' });
    casing(GX, GY - 2, 16);
    camOff();
    // whip down the falling water into G5
    const wd = easeIn(seg(lt, dur - .3, dur));
    speedLines(wd, true, 'g4', AP.waterDk, mixCol(AP.paper, AP.waterLt, .4));
    if (lt < .12) ptone(rectPts(-40, -40, W + 80, H + 80), '#F2FAFC', (1 - lt / .12) * .8);
  }

  // ================================================================================================
  // G5 · 243.00–246.86 · [58] "It's flowing, ever flowing": the driller under the falling water
  // ================================================================================================
  function g5(t, lt, dur) {
    const whipIn = 1 - easeOut(seg(lt, 0, .35));
    const z = lerp(1, 1.14, ease(seg(lt, .3, dur))), cx = 960, cy = lerp(520, 470, ease(seg(lt, .3, dur))) - whipIn * 500;
    camOn(cx, cy, z);
    LIGHT = [-.7, .3];
    gDawnSky({ y0: -200, y1: 660, x0: -600, x1: 2600, blue: 1, key: 'g5' });
    gSunrise(1620, 650, 44, 1);
    dawnPlain(660, { x0: -600, x1: 2600, y1: 1500, key: 'g5', col: '#B89468' });
    pool(960, 800, 1400, 170, t, 'g5');
    // the geyser's rain coming down all round them
    curtains(t, -200, W + 200, -300, 760, 9, 'g5b', .8);
    seed('g5mist'); for (let i = 0; i < 8; i++) { const q = frac(t * .2 + hash(i * 1.9)); psmoke(hash(i * 4.3) * W, 740 - q * 60, 120 + 90 * hash(i), '#EAF4F7', .4 * (1 - q * .6)); }
    // the crew behind: soaked, dancing
    const bb = bpOf(t);
    seed('g5h1'); man(430, 800, 46, { view: 'front', shF: 2.5 + .3 * Math.sin(bb * Math.PI), elF: -.3, shB: .8 + .5 * Math.abs(Math.sin(bb * Math.PI / 2)), elB: .6, face: 'laugh', dy: .3 * Math.abs(Math.sin(bb * Math.PI)) }, { ...CAST.hand1, hat: null });
    seed('g5boss'); const JB = man(1500, 806, 48, { flip: true, lean: .1, shF: 1.6, elF: 1.2, shB: 1.3, elB: 1.3, head: .15, face: 'smile', dy: .08 * Math.abs(Math.sin(bb * Math.PI)) }, { ...CAST.boss, hat: null });
    // the boss wringing his bowler out
    hatProp('bowler', [JB.handF[0] - 14, JB.handF[1] - 4], 48, 2.2 + .15 * Math.sin(t * 6), CAST.boss.hatCol, 'g5b');
    for (let i = 0; i < 3; i++) { const q = frac(t * 2 + i / 3); seed('g5bd' + i); pline([[JB.handF[0] - 20, JB.handF[1] + 10 + q * 90], [JB.handF[0] - 20, JB.handF[1] + 22 + q * 90]], 1.6, AP.waterLt, { over: 0, passes: 1, alpha: 1 - q }); }
    seed('g5h2'); man(1740, 810, 44, { view: 'front', shF: 2.8, elF: -.1, shB: 2.6 + .3 * Math.sin(t * 8), elB: -.2, face: 'shout', dy: .35 * Math.abs(Math.sin((bb + .5) * Math.PI)) }, { ...CAST.hand2, hat: null });
    // the driller: arms wide, face up into the downpour
    const brth = Math.sin(t * 2.2), up = ease(seg(lt, .2, 1.2));
    const P = { view: 'front', shF: lerp(1.2, 2.15, up) + .04 * brth, elF: lerp(.6, -.25, up), shB: lerp(1.1, 2.08, up) - .03 * brth, elB: lerp(.7, -.2, up), face: lt > .9 ? 'laugh' : 'closed', mouth: .5 * up, head: -.5 * up, blink: 1, dy: 0 };
    seed('g5drill');
    const J = man(960, 1170, 100, P, CAST.driller);
    // water pouring off his hat brim and his hands, splashing off his shoulders
    const s = 100;
    seed('g5brim');
    for (const sd of [-1, 1]) {
      const b = [J.head[0] + sd * 1.05 * s, J.head[1] - .3 * s];
      const R = []; for (let k = 0; k <= 6; k++) R.push([b[0] + sd * (4 + k * 3) + Math.sin(t * 9 + k * 1.3 + sd) * 2, b[1] + k * 34]);
      pfill(limb(R, R.map((_, k) => 10 + k * 3)), AP.waterLt, { tone: .6, dens: .8, kind: 'v', ink: mixCol(AP.waterLt, AP.waterDk, .5), sw: .8 });
      plit(limb(R, R.map(() => 4)), .9, '#F4FBFD');
      for (let i = 0; i < 5; i++) { const q = frac(t * 2.4 + i / 5 + (sd > 0 ? .3 : 0)); pline([[R[6][0] + sd * q * 10, R[6][1] + q * 200], [R[6][0] + sd * q * 10, R[6][1] + q * 200 + 26]], 2.6, i % 2 ? '#F2FAFC' : AP.waterLt, { over: 0, passes: 1, alpha: 1 - q * .6 }); }
    }
    for (const [hd, key] of [[J.handF, 'f'], [J.handB, 'b']]) for (let i = 0; i < 3; i++) { const q = frac(t * 1.8 + i / 3 + (key === 'f' ? .5 : 0)); seed('g5hd' + key + i); pline([[hd[0], hd[1] + 10 + q * 200], [hd[0], hd[1] + 26 + q * 200]], 1.8, AP.waterLt, { over: 0, passes: 1, alpha: 1 - q }); }
    for (let i = 0; i < 4; i++) { const b = i < 2 ? J.shF : J.shB, e = t - (Math.floor(t * 2.3 + i * .37) - i * .37) / 2.3; splash(b[0], b[1] - .1 * s, 30, e, 'g5s' + i, .8); }
    splash(J.top[0] + 20, J.top[1] + 20, 30, frac(t * 1.9) / 1.9, 'g5hat', .7);
    // the downpour, in front of everything
    curtains(t, 100, W - 100, -300, 1000, 4, 'g5f', .5);
    rain(-100, -200, W + 200, 1000, t, 170, 'g5', { len: 80, speed: 1.9, slant: -.2, alpha: .8, w: 1.6 });
    camOff();
    speedLines(whipIn, true, 'g5', AP.waterDk, mixCol(AP.paper, AP.waterLt, .4));
    if (lt > dur - .4) waterWipe((lt - (dur - .4)) / .8);
  }

  // ================================================================================================
  // G6 · 246.86–252.20 · chorus 7 [59, 60]: celebration in the spray, a stomp and a splash on every beat
  // ================================================================================================
  function g6(t, lt, dur) {
    const z = lerp(1, 1.08, ease(seg(lt, 0, dur))), cx = lerp(940, 980, ease(seg(lt, 0, dur))), cy = 500;
    const bb = bpOf(t), bf = frac(bb), bn = Math.floor(bb), hit = pulse(t, 8);
    const sh = shakeXY(t, 3 * hit * (bn % 2 ? 1 : .4));
    camOn(cx + sh[0], cy + sh[1], z);
    LIGHT = [-.75, .4];
    gDawnSky({ y0: -150, y1: 600, x0: -600, x1: 2600, blue: 1, key: 'g6' });
    gSunrise(1760, 590, 42, 1);
    dawnPlain(600, { x0: -600, x1: 2600, y1: 1500, key: 'g6', col: '#B89468' });
    pool(1000, 800, 1300, 150, t, 'g6');
    derrick(1270, 640, 540, { key: 'g6' });
    gGeyser(1270, 632, 1200, t, { w: 76, crown: 0, spray: 1, reach: 8, drops: 60, key: 'g6' });
    // Bill, far left, whirling his toque round his head
    const wq = t * 6;
    seed('g6bill'); const JBill = man(150, 836, 60, { view: 'front', shF: 2.6 + .25 * Math.sin(wq), elF: -.7 + .5 * Math.cos(wq), shB: .6, elB: .9, face: 'laugh', dy: .25 * Math.abs(Math.sin(bb * Math.PI)) }, { ...CAST.bill, hat: null });
    hatProp('toque', add2(JBill.handF, [Math.cos(wq) * 20, -10 + Math.sin(wq) * 10]), 50, Math.sin(wq) * .8, CAST.bill.hatCol, 'g6toque');
    // hand1 and hand2: arm in arm, swinging each other round; kicks land on the off-beats
    const sw = Math.sin(bb * Math.PI / 2), off = frac(bb + .5), kick = Math.sin(Math.min(1, off / .5) * Math.PI) * .9;
    seed('g6h1'); const J1 = man(380 + 30 * sw, 846, 62, { lean: -.2, shF: 1.2, elF: .4, shB: 2.5, elB: -.2, hpF: bn % 2 ? kick : .1, knF: .3, hpB: -.1, knB: .2, face: 'laugh', dy: .2 * Math.abs(sw) }, { ...CAST.hand1, hat: null });
    seed('g6h2'); const J2 = man(530 + 30 * sw, 846, 62, { flip: true, lean: -.2, shF: 1.2, elF: .4, shB: 2.4, elB: -.2, hpF: bn % 2 ? .1 : kick, knF: .3, hpB: -.1, knB: .2, face: 'shout', mouth: .5, dy: .2 * Math.abs(sw + .3) }, { ...CAST.hand2, hat: null });
    seed('g6link'); pline([J1.handF, lerp2(J1.handF, J2.handF, .5), J2.handF], 7, CAST.hand1.skin, { over: 0 });
    splash(J1.ankF[0] + 20, 846, 40, (bn % 2 ? bf - .3 : 9) * BEAT, 'g6k1');
    splash(J2.ankF[0] - 20, 846, 40, (bn % 2 ? 9 : bf - .3) * BEAT, 'g6k2');
    // the boss drinks the geyser out of his bowler
    const dq = seg(lt, 1.5, 2.2), drink = dq > 0 && lt < 4 ? 1 : 0;
    seed('g6boss'); const JB = man(1640, 840, 64, { flip: true, lean: -.25 * drink, head: -.5 * drink, shF: lerp(1.2, 2.6, ease(dq)), elF: lerp(1.3, 1.4, dq), shB: 1.2, elB: 1.4, face: drink && lt > 2.2 ? 'closed' : 'laugh', mouth: .3,
      dy: .15 * Math.abs(Math.sin(bb * Math.PI)) * (1 - drink) }, { ...CAST.boss, hat: null });
    hatProp('bowler', [JB.handF[0] - 8, JB.handF[1] + 18], 64, Math.PI + lerp(0, -.9, ease(dq)), CAST.boss.hatCol, 'g6b');
    if (dq > .6 && lt < 4) for (let i = 0; i < 3; i++) { const q = frac(t * 2.5 + i / 3); seed('g6bd' + i); pline([[JB.handF[0] - 30, JB.handF[1] + q * 120], [JB.handF[0] - 30, JB.handF[1] + 16 + q * 120]], 1.8, AP.waterLt, { over: 0, passes: 1, alpha: 1 - q }); }
    // the driller front and centre: a stomp ON every other beat, a splash, arms thrown up
    const k = frac((bb - 1) / 2), stomp = k < .08 ? 1 : 0;
    const lift = k < .1 ? 0 : k < .75 ? easeOut((k - .1) / .65) : 1 - easeIn((k - .75) / .25);
    const leg = Math.floor((bb - 1) / 2) % 2;
    seed('g6drill');
    const JD = man(870, 860, 70, { view: 'front', shF: 2.15 + .45 * lift, elF: -.2 - .4 * (1 - lift), shB: 2.05 + .45 * lift, elB: -.3, face: lift > .4 ? 'laugh' : 'shout', mouth: .6,
      hpF: leg ? .5 * lift : .02, knF: leg ? 1.4 * lift : .05, hpB: leg ? .02 : .5 * lift, knB: leg ? .05 : 1.4 * lift, dy: .25 * lift, squash: .08 * (1 - clamp(k * 6)) }, CAST.driller);
    const stompT = (k * 2) * BEAT;
    splash(leg ? JD.ankB[0] : JD.ankF[0], 860, 80, stompT, 'g6st', 1.3);
    // hats tossed into the spray on the beats
    for (let i = 0; i < 4; i++) { const tr = bt(462 + i * 2 + 1), f = fling(t, tr, [700 + i * 180, 900], [(i % 2 ? -1 : 1) * 200, -2100], 2400, (i % 2 ? -1 : 1) * 8); if (t > tr && f.p[1] < 1000) hatProp(['slouch', 'cap', 'wide', 'slouch'][i], f.p, 46, f.rot, ['#6E5A44', '#4A443E', '#B8A47C', '#8A6A44'][i], 'g6h' + i); }
    rain(-200, -300, W + 300, 1000, t, 90, 'g6', { len: 60, speed: 1.7, slant: -.15, alpha: .6 });
    camOff();
    if (lt < .4) waterWipe(.5 + lt / .8);
    if (lt > dur - .3) pageTurn((lt - (dur - .3)) / .6, -1);
  }

  // ================================================================================================
  // G7 · 252.20–257.68 · chorus 7 [61, 62]: the squatter comes running, the sheep race to the water
  // ================================================================================================
  function g7(t, lt, dur) {
    const z = lerp(1, 1.06, ease(seg(lt, 0, dur))), cx = lerp(960, 900, ease(seg(lt, 0, dur))), cy = 470;
    camOn(cx, cy, z);
    LIGHT = [-.8, .35];
    gDawnSky({ y0: -300, y1: 560, x0: -600, x1: 2600, blue: 1, key: 'g7' });
    gSunrise(1480, 552, 36, 1);
    dawnPlain(560, { x0: -600, x1: 2600, y1: 1500, key: 'g7', col: '#C49A6C', cracks: .25 });
    // the geyser on the right, the water spreading out across the cracked plain toward us
    const spread = ease(seg(lt, 0, dur));
    pool(1250, 690, 520 + 80 * spread, 88 + 20 * spread, t, 'g7a');
    pool(900, 800, 330 + 120 * spread, 52 + 22 * spread, t, 'g7b');
    derrick(1540, 600, 380, { key: 'g7' });
    gGeyser(1540, 598, 900, t, { w: 60, crown: 1, spray: 1, reach: 5, drops: 70, key: 'g7' });
    gRainbow(1500, 650, 520, 13, Math.PI + .15, Math.PI + 1.2, 1, .55);
    // crew waving him in by the derrick
    [[1340, CAST.driller, 0], [1420, CAST.hand1, .4], [1700, CAST.boss, .7]].forEach(([x, L, ph], i) => { const b = Math.abs(Math.sin((bpOf(t) + ph) * Math.PI)); seed('g7c' + i); man(x, 650, 26, { view: 'front', shF: 2.5 + .35 * b, elF: -.3, shB: 1.2 + 1.2 * b, elB: -.2, dy: .3 * b, face: 'shout' }, { ...L, hat: i === 0 ? L.hat : null }); });
    // sheep: from both sides, each on its own start, running to the water's edge and dropping their heads to drink
    const flock = [[-150, 760, 500, 800, 0], [-300, 820, 556, 852, .3], [-120, 700, 640, 738, .55], [-420, 866, 420, 866, .8], [250, 592, 600, 716, .2], [430, 586, 690, 706, .6], [-520, 790, 360, 828, 1.2]];
    flock.forEach(([x0, y0, x1, y1, st], i) => {
      const dT = 2.3 + hash(i * 3.1) * .7, k = seg(lt, st, st + dT), run = k < 1, e = 1 - Math.pow(1 - k, 1.6), y = lerp(y0, y1, e);
      const s = lerp(19, 30, clamp((y - 590) / 270));
      sheep(lerp(x0, x1, e), y - (run ? Math.abs(Math.sin(t * 13 + i * 1.7)) * .5 * s : 0), s, { walk: run ? t * 3.4 + i * .37 : undefined, graze: run ? 0 : ease(seg(lt, st + dT, st + dT + .4)), key: 'g7s' + i });
      if (!run) splash(lerp(x0, x1, 1) + 1.7 * s, y, s * 1.2, lt - st - dT, 'g7sd' + i, .5);
    });
    // the squatter: running in from the left, hat in hand, into the water; stops, flings his arms up
    const T_ARR = 3.1, run = seg(lt, 0, T_ARR), sx = lerp(80, 760, easeOut(run) * .25 + run * .75), sy = lerp(700, 800, run), ss = lerp(40, 62, run);
    if (lt < T_ARR) {
      const P = runPose(t * 2.6, 1);
      seed('g7sq'); const J = man(sx, sy, ss, { ...P, shF: 2.4 + .3 * Math.sin(t * 16), elF: -.2, face: 'shout', mouth: .7, head: -.2 }, { ...CAST.squatter, hat: null });
      hatProp('wide', add2(J.handF, [8, -6]), ss, -.4 + .4 * Math.sin(t * 16), CAST.squatter.hatCol, 'g7hat');
      if (sx > 520) splash(J.ankF[0], sy, 30, frac(t * 2.6) * .38, 'g7run', .7);
    } else {
      const a = lt - T_ARR, P = kp(a, [[0, { view: 'front', shF: .6, elF: .8, shB: .6, elB: .8, face: 'worry', mouth: .2, head: .2 }], [.35, { view: 'front', shF: 2.9, elF: -.1, shB: 2.75, elB: -.2, face: 'laugh', mouth: .7, head: -.4 }]], backOut);
      seed('g7sq'); const J = man(760, 800, 62, { ...P, dy: .5 * Math.max(0, Math.sin(clamp((a - .3) / .5) * Math.PI)), squash: .1 * spring(t, bt(476), 6, 16) }, { ...CAST.squatter, hat: null });
      splash(760, 800, 70, a, 'g7in', 1.4);
      const f = fling(t, 252.2 + T_ARR + .3, add2(J.handF, [0, -10]), [120, -1600], 2200, 6);
      hatProp('wide', t > 252.2 + T_ARR + .3 ? f.p : add2(J.handF, [0, -10]), 62, f.rot, CAST.squatter.hatCol, 'g7hat');
    }
    rain(900, -300, 2200, 700, t, 50, 'g7', { len: 40, speed: 1.5, alpha: .5 });
    camOff();
    if (lt < .3) pageTurn(.5 + lt / .6, -1);
    if (lt > dur - .35) scribbleWipe((lt - (dur - .35)) / .7);
  }

  shots([[225.55, g1], [229.24, g2], [233.54, g3], [238.58, g4], [243.0, g5], [246.86, g6], [252.2, g7]]);
})();
