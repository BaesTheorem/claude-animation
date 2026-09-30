// chD.js: chapter D of "Last Light of September", the last light (BAR(29) → BAR(39)). See docs/lastlight/STORYBOARD.md.
//   D1  BAR(29) → BAR(33)  out of the gold flash: the cottage door bursts open, Clawd hops out onto the porch and the cat
//                         follows. The camera pulls back and up (a dolly: far layers shrink less) to reveal the rain-washed
//                         valley under a sunset breaking below lifting clouds. A rainbow blooms over the orchard on BAR(31);
//                         Clawd is starstruck, and on the surge (BAR(32)) both arms go up. Clawd bounds off the porch: cut
//                         on action.
//   D2  BAR(33) → BAR(39)  the yard: Clawd lands, sees the leaf pile by the maple (idea, mischief), backs up, runs, leaps and
//                         lands in it on AT(34, 1): the leaves burst up, hang and drift down. The cat pounces in (bar 35);
//                         Clawd pops out laughing, leaves on the beanie (bar 36); the cat pops out wearing a leaf (bar 37);
//                         they lie back and watch the sun touch the hills (bar 38). The camera tilts up and pushes in until
//                         the sun's disc sits at screen (1180, 330), radius 150, for the match cut to the lamp in C2.
(() => {
  const tD1 = BAR(29), tD2 = BAR(33), tEnd = BAR(39);

  // ---------- helpers ----------
  // Multiplane camera. C = {x, y, z} is the camera on the action plane (p = 1, world coordinates, as camBegin takes them).
  // A layer at depth p (< 1 is farther) is drawn in design coordinates: the screen coordinates it has when the camera is
  // at state R. dolly: the camera moves bodily, so far layers shrink less as it pulls back; otherwise a lens zoom.
  const zOf = (p, z, dolly) => dolly ? 1 / (1 + p * (1 / z - 1)) : z;
  function inL(C, R, p, fn, dolly = true) {
    push(); translate(W / 2, H / 2); scale(zOf(p, C.z, dolly)); translate(p * (R.x - C.x), p * (R.y - C.y)); scale(1 / zOf(p, R.z, dolly)); translate(-W / 2, -H / 2);
    fn(); pop();
  }
  const scrL = (C, R, p, x, y, dolly = true) => {
    const a = zOf(p, C.z, dolly), b = zOf(p, R.z, dolly);
    return [W / 2 + a * (p * (R.x - C.x) + (x - W / 2) / b), H / 2 + a * (p * (R.y - C.y) + (y - H / 2) / b)];
  };
  // ∫ of a piecewise-linear rate [[t, v], ...] from the first key to t: positions from eased speeds, in closed form
  function integ(t, K) {
    let s = 0;
    for (let i = 1; i < K.length; i++) {
      const [a, va] = K[i - 1], [b, vb] = K[i];
      if (t <= a) break;
      const e = Math.min(t, b), ve = lerp(va, vb, (e - a) / (b - a));
      s += (va + ve) / 2 * (e - a);
    }
    const [tl, vl] = K[K.length - 1];
    return t > tl ? s + vl * (t - tl) : s;
  }
  // the low sun: the halo goes down before the light, so the light lands on it (a fill painted after a strong glow goes
  // pale), then the glow, then the disc as a flat wash
  function sunDisc(x, y, r, key, a = 1) {
    boilSeed(key + ' halo');
    paint(ellPts(x, y, r * 3.4, r * 3.1, 30, r * .1), { fill: '#F4A052', fillOp: 70, bleed: .35, tex: .25, border: .2, ink: null });
    paint(ellPts(x, y, r * 1.8, r * 1.7, 28, r * .05), { fill: '#FBC878', fillOp: 120, bleed: .25, tex: .2, border: .15, ink: null });
    glow(x, y, Math.min(r * 9, 500), '#FF9A4E', .72 * a);
    glow(x, y, r * 2.3, '#FFD49A', .5 * a);
    boilSeed(key + ' disc');   // a gold rim, then the pale disc, so it reads as a shape against its own light
    paint(ellPts(x, y, r * 1.05, r * 1.05, 44, r * .012), { wash: '#FFCF7E', ink: null });
    paint(ellPts(x, y, r, r, 44, r * .012), { wash: '#FFF3D4', ink: null });
  }
  // remnant rain clouds, lifting and thinning: long streaks, a dusky body over a rim lit from below by the low sun
  function cloudShape(cx, cy, w, h, seed) {
    const P = [], n = 9;
    for (let i = 0; i <= n; i++) { const k = i / n; P.push([cx - w / 2 + w * k, cy + h * .12 * Math.sin(i * 1.7 + seed) * Math.sin(Math.PI * k)]); }
    for (let i = n; i >= 0; i--) { const k = i / n, env = Math.pow(Math.sin(Math.PI * k), .7); P.push([cx - w / 2 + w * k, cy - h * env * (.55 + .45 * Math.abs(Math.sin(i * 2.3 + seed * 1.7)))]); }
    return through(P, 3);
  }
  function cloudBank(t, o) {
    const { key, n, x0, x1, y, seed = 1, lift = 0, t0 = 0, sc = 1, op = 1, near = null } = o;
    for (let i = 0; i < n; i++) {
      const h = j => hash(seed * 53 + i * 11 + j);
      const cx = lerp(x0, x1, (i + .2 + .6 * h(1)) / n) + (t - t0) * (3 + 5 * h(2)) * (h(3) > .5 ? 1 : -1);
      const cy = y + (h(4) - .5) * 150 * sc - lift * (t - t0) * (.7 + .6 * h(5)), w = (380 + 520 * h(6)) * sc, hh = (55 + 60 * h(7)) * sc;
      const lit = near ? clamp(1 - Math.hypot(cx - near[0], cy - near[1]) / 1100) : .3;
      boilSeed(key + i);
      paint(cloudShape(cx + 10, cy + hh * .2, w * 1.02, hh * .95, i + seed), { wash: mixCol('#F29C86', '#FFD89A', lit), washOp: 225 * op, ink: null });
      paint(cloudShape(cx, cy, w, hh, i + seed), { wash: mixCol('#957A9C', '#C39098', .45 * lit), washOp: 215 * op, fill: '#6E5A80', fillOp: 45 * op, bleed: .12, tex: .3, border: .4, ink: null });
    }
  }
  // a ridge of hills: [x0, x1] at base line yb, amp high, with a saddle at notch = [x, depth, width]
  function ridgePts(x0, x1, yb, amp, n, seed, notch) {
    const P = [[x1, yb + 1400], [x0, yb + 1400]];
    for (let i = 0; i <= n; i++) {
      const x = lerp(x0, x1, i / n);
      let y = yb - amp * (.45 + .3 * Math.sin(i * .83 + seed) + .25 * Math.sin(i * 2.1 + seed * 3));
      if (notch) y += notch[1] * Math.exp(-(((x - notch[0]) / notch[2]) ** 2));
      P.push([x, y]);
    }
    return P;
  }
  // a glint on a wet leaf or a puddle: a four-point star that blinks on and off
  function glint(x, y, s, t, ph, key, rate = 1.7) {
    const k = Math.pow(Math.max(0, Math.sin(t * rate + ph)), 4);
    if (k < .04) return 0;
    boilSeed(key);
    paint(starPts(x, y, s * (.4 + .6 * k), .2, 4, ph), { wash: '#FFF7DE', washOp: 255 * Math.min(1, k * 1.6), ink: null });
    return k;
  }
  // a far tree: a trunk and a few crown masses, no outline (cheap)
  function farTree(x, y, s, cols, key, sway = 0) {
    boilSeed(key);
    paint(ribbon([[x, y], [x - s * .2, y - s * 7], [x + s * .3, y - s * 12]], s * 1.7, s * .8), { wash: cols[4], ink: null });
    [[-5, -14, 6, 4.6, 0], [5, -14.5, 6, 4.6, 1], [0, -20, 8.2, 6.2, 2], [-3.8, -25.5, 5.4, 3.8, 3], [3.8, -25.5, 5.4, 3.8, 0]].forEach(([bx, by, rx, ry, ci], i) =>
      paint(ellPts(x + (bx + sway * Math.sin(i * 1.3)) * s, y + by * s, rx * s, ry * s, 16, s * .35, i), { wash: cols[ci], ink: null }));
  }
  // an apple tree in the far orchard: a round crown, lit on the right, with a few red dots (washes only: cheap)
  function appleTree(x, y, s, key, lit) {
    boilSeed(key);
    inkLine([[x, y], [x - s * .05, y - s * 1.3]], s * .2, '#7A5448', 'ink', 0);
    paint(ellPts(x, y - s * 2.1, s * 1.5, s * 1.2, 14, s * .06), { wash: mixCol('#7C8248', '#B9955A', .3 * lit), ink: null });
    paint(ellPts(x + s * .35, y - s * 2.35, s * .9, s * .7, 12), { wash: mixCol('#9EA055', '#F0BE72', .55 * lit), washOp: 230, ink: null });
    for (let i = 0; i < 3; i++) paint(ellPts(x + (hash(i + x) - .5) * s * 2, y - s * (1.5 + 1.2 * hash(i * 3 + x)), s * .22, s * .22, 6), { wash: FALL.apple, ink: null });
  }
  // grass tufts along a line; vis = [x0, x1] culls the ones off screen
  function tufts(x0, x1, y, n, seed, col, t, h = 26, vis = null) {
    for (let i = 0; i < n; i++) {
      const x = lerp(x0, x1, (i + hash(i * 3.7 + seed)) / n); if (vis && (x < vis[0] || x > vis[1])) continue;
      const hh = h * lerp(.6, 1.2, hash(i + seed * 2)), sw = wob(t, .3, hash(i + seed)) * 4;
      boilSeed('Dtuft' + seed + '_' + i);
      inkLine([[x - 11 + sw * .8, y - hh * .72], [x, y + 2], [x - 2 + sw, y - hh], [x + 1, y + 2], [x + 12 + sw * .9, y - hh * .78]], .8, col, 'inkfine', 0);
    }
  }
  // a leaf painted as one wash with an ink edge (cheap; lib's leaf() is a watercolour fill). sy < 1 lays it flat.
  function leafW(x, y, s, rot, col, spin = 1, sy = 1, ink = PAL.ink) {
    const c = Math.cos(rot), sn = Math.sin(rot), f = Math.sign(spin || 1) * Math.max(.18, Math.abs(spin));
    paint(MAPLE.map(([a, b]) => { const ax = a * s * f, by = b * s; return [x + (ax * c - by * sn), y + (ax * sn + by * c) * sy]; }), { wash: col, ink, sw: clamp(s / 22, .35, .9) });
  }
  const flatLeaf = (x, y, s, rot, col, key) => { boilSeed(key); leafW(x, y, s, rot, col, .9, .45, mixCol(PAL.ink, FALL.grassDk, .35)); };
  // Clawd lit by the low sun: the emotion's own colour, warmed
  const warm = (o, k) => {
    if (k <= 0) return o;
    const c = tintCols(o);
    return { ...o, col: mixCol(c.col, '#F7AE5E', .3 * k), dk: mixCol(c.dk, '#B5583A', .25 * k), lt: mixCol(c.lt, '#FFE2A6', .4 * k), tint: null };
  };
  const LEAFC = [FALL.amber, FALL.rust, FALL.gold, '#E6A03A', FALL.olive];

  // ======================================================================================================
  // D1: the door, the porch, the valley
  // ======================================================================================================
  const CX = 760, CY = 900, SC = 34, U1 = 21;               // the cottage (ground at the door), its scale, Clawd's size
  const PY = CY + 44;                                        // Clawd's feet on the porch deck
  const tRattle = AT(29, 1.62), tBurst = AT(29, 2), tHop0 = AT(29, 2.35), tHop1 = AT(29, 2.95), tBask = AT(29, 3.15);
  const tCatOut = AT(29, 3.95), tCatSit = AT(30, 1.6), tTurnR = BAR(30) - .08, tWalk0 = BAR(30) + .08, tWalk1 = AT(30, 2.05);
  const tPull0 = AT(30, 1.35), tPull1 = BAR(31) - .12, tBow = BAR(31), tLookUp = AT(31, 2.3), tStar = AT(31, 3);
  const tPush0 = AT(31, 2.85), tPush1 = AT(32, 2.2), tJoy = BAR(32), tPlay = AT(32, 3.3), tCrouch = AT(32, 4.15), tBound = AT(32, 4.6);
  const XP = CX + 330;                                       // where Clawd stops on the porch
  const R1 = { x: CX + 1150, y: CY - 520, z: .5 };           // the wide frame: far layers are laid out in its screen coordinates
  function cam1(t) {
    const x = kf(t, [[tD1, CX + 40], [tPull0, CX + 120], [tPull1, R1.x], [tPush0, R1.x + 25], [tPush1, CX + 740], [tD2, CX + 790]]);
    const y = kf(t, [[tD1, CY - 250], [tPull0, CY - 240], [tPull1, R1.y], [tPush0, R1.y - 6], [tPush1, CY - 360], [tD2, CY - 352]]);
    const z = kf(t, [[tD1, 1.12], [tPull0, 1.09], [tPull1, R1.z], [tPush0, R1.z], [tPush1, .82], [tD2, .85]]);
    return { x: x + 6 * Math.sin(t * .5), y: y + 4 * Math.sin(t * .37), z };
  }
  const SUN1 = [1510, 452], SUNR1 = 54;

  // ---------- D1 far layers (design coordinates = the wide frame's screen coordinates) ----------
  function d1Sky(t) {
    skyBlend('sunset', 'amber', .12, { key: 'D1sky', x0: -90, y0: -140, w: 2100, h: 860 });
    const [sx, sy] = SUN1;
    boilSeed('D1rays');   // pale shafts of light fanning up from under the lifting clouds
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI * (.52 + .5 * i / 6) + .03 * Math.sin(t * .4 + i), len = 1300 + 300 * hash(i + 3), w = 70 + 60 * hash(i + 7);
      paint([[sx + Math.cos(a) * 70, sy + Math.sin(a) * 70], [sx + Math.cos(a + w / len) * len, sy + Math.sin(a + w / len) * len], [sx + Math.cos(a - w / len) * len, sy + Math.sin(a - w / len) * len]],
        { wash: '#FFE8B8', washOp: 42 + 18 * Math.sin(t * .9 + i * 2), ink: null });
    }
    sunDisc(sx, sy, SUNR1, 'D1sun');
    cloudBank(t, { key: 'D1cl', n: 4, x0: -200, x1: 2150, y: 150, seed: 4, lift: 8, t0: tD1, sc: 1.05, op: lerp(1, .85, seg(t, tD1, tD2)), near: SUN1 });
    cloudBank(t, { key: 'D1cl2', n: 2, x0: 300, x1: 2100, y: 330, seed: 9, lift: 13, t0: tD1, sc: .75, op: lerp(.95, .6, seg(t, tD1, tD2)), near: SUN1 });
  }
  function d1Hills(t) {
    const R1p = ridgePts(-300, 2300, 540, 80, 26, 1.3, [SUN1[0] + 20, 30, 160]);
    boilSeed('D1h1');
    paint(R1p, { wash: '#A987A6', fill: '#8C6C96', fillOp: 45, bleed: .04, tex: .3, border: .1, ink: null, curv: .5 });
    inkLine(R1p.slice(2).filter(p => Math.abs(p[0] - SUN1[0]) < 700), 1.6, '#FFC98A', 'dry', .5);   // the rim of light on the ridge
    boilSeed('D1h2');
    paint(ridgePts(-300, 2300, 590, 60, 20, 4.1), { wash: '#94688A', fill: '#7A5478', fillOp: 55, bleed: .04, tex: .35, border: .1, ink: null, curv: .5 });
    glow(SUN1[0], 555, 280, '#FFB866', .75);   // the sun gilds the ridge under it
  }
  // the rainbow: soft watercolour bands on an arc; k = 0..1 blooms it from the left foot over to the right
  const BOW = ['#EE7A74', '#F4A765', '#F5D77E', '#AFCF86', '#86B7DC', '#A48ACB'];
  function rainbow(cx, cy, R, bw, k, t, key) {
    if (k <= 0) return;
    const sweep = easeOut(clamp(k * 1.25)), op = ease(clamp(k * 1.8)), a0 = Math.PI + .06, a1 = a0 + (Math.PI - .12) * sweep;
    const arc = (r, b0, b1) => { const P = []; for (let i = 0; i <= 18; i++) { const a = lerp(b0, b1, i / 18); P.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return P; };
    boilSeed(key + ' lift');   // lift the sky under the arc first, so the colours sit clean on it (watercolour "lifting")
    paint(ribbon(arc(R - bw * 2.5, a0, a1), bw * 7.5, bw * 7.5 * (sweep < 1 ? .4 : 1)), { wash: '#FFF0D8', washOp: 70 * op, ink: null });
    BOW.forEach((c, i) => {
      boilSeed(key + i);
      const r = R - i * bw, w = bw * 1.25;
      // three pieces per band: the feet fade into the air, the crown is strongest
      const cuts = [a0, a0 + .45, 2 * Math.PI - .51, 2 * Math.PI - .06], ops = [.55, 1, .55];
      for (let j = 0; j < 3; j++) {
        const b0 = cuts[j], b1 = Math.min(cuts[j + 1], a1); if (b1 <= b0 + .01) continue;
        paint(ribbon(arc(r, b0, b1), w, b1 < cuts[j + 1] ? w * .35 : w), { wash: c, washOp: 165 * op * ops[j], ink: null });
      }
    });
  }
  function d1Valley(t) {
    boilSeed('D1v fields');
    paint(ridgePts(-500, 2500, 640, 30, 14, 2.2), { wash: '#C99468', fill: '#A8705E', fillOp: 60, bleed: .05, tex: .5, border: .15, ink: null, curv: .5 });
    boilSeed('D1v orchard hill');   // the orchard's slope, lit
    paint(through([[560, 760], [700, 640], [880, 585], [1060, 575], [1250, 610], [1420, 690], [1560, 780]], 5), { wash: '#B99A5C', fill: '#8C7A48', fillOp: 70, bleed: .05, tex: .55, border: .2, ink: null });
    // three rows of apple trees across the slope
    for (let r = 0; r < 3; r++) for (let i = 0; i < 8; i++) {
      const x = 700 + i * 88 + r * 34 + 14 * hash(r * 9 + i), y = 612 + r * 34 - 34 * Math.sin((x - 560) / 1000 * Math.PI) + 60 * Math.max(0, (x - 1250) / 300) ** 2 * .6;
      if (x > 1440) continue;
      appleTree(x, y, 8.5 + 2.2 * r, 'D1at' + r + '_' + i, clamp((x - 700) / 700));
    }
    boilSeed('D1v stream');   // a stream catching the sky
    paint(ribbon([[-200, 770], [300, 740], [620, 790], [1000, 760], [1400, 800], [1800, 770], [2300, 800]], 26, 44), { wash: '#F6C49A', ink: null });
    // maples dotted on the slopes, lit on their right
    const tc = (a, b, c, k) => [a, b, c, a, mixCol(FALL.bark, '#8E5A6A', k)];
    [[140, 700, 5.4, tc(FALL.maple, FALL.rust, FALL.amber, .3)], [380, 690, 4.4, tc(FALL.amber, FALL.gold, FALL.rust, .3)], [1560, 700, 5, tc(FALL.crimson, FALL.maple, FALL.amber, .3)],
     [1760, 715, 6, tc(FALL.amber, FALL.maple, FALL.gold, .3)], [1960, 700, 4.6, tc(FALL.rust, FALL.amber, FALL.gold, .3)], [620, 770, 5.2, tc(FALL.gold, FALL.amber, FALL.maple, .3)]]
      .forEach(([x, y, s, c], i) => farTree(x, y, s, c, 'D1ft' + i, .15 * Math.sin(t * .7 + i)));
    boilSeed('D1v near field');
    paint(ridgePts(-500, 2500, 860, 40, 12, 5.5), { wash: '#B08A58', ink: null, curv: .5 });
    // wet glints on the valley floor and the stream
    for (let i = 0; i < 9; i++) glint(300 + 190 * i + 60 * hash(i), 765 + 25 * Math.sin(i * 1.9), 9, t, hash(i * 3) * TAU, 'D1vg' + i, 1.4 + .6 * hash(i));
  }

  // ---------- D1 action plane (world coordinates) ----------
  const DECK = { x0: CX - 16 * SC - 70, x1: CX + 16 * SC + 240, y0: CY - 8, y1: CY + 80, yb: CY + 112 };
  function d1Ground(t, C) {
    boilSeed('D1ground');   // the knoll the cottage sits on, falling away to the right
    paint(through([[-1600, CY + 60], [DECK.x1 + 200, CY + 90], [DECK.x1 + 700, CY + 200], [DECK.x1 + 1500, CY + 330], [4200, CY + 420], [4200, CY + 1600], [-1600, CY + 1600]], 4),
      { wash: mixCol(FALL.grass, '#D69A62', .25), fill: FALL.grassDk, fillOp: 70, bleed: .03, tex: .6, border: .15, ink: null });
    boilSeed('D1ground lit');   // the low sun warms the crest
    paint(through([[DECK.x1 + 100, CY + 96], [DECK.x1 + 700, CY + 206], [DECK.x1 + 1500, CY + 336], [4200, CY + 426], [4200, CY + 520], [DECK.x1 + 900, CY + 330], [DECK.x1 + 200, CY + 170]], 4),
      { fill: '#F2B66A', fillOp: 70, bleed: .15, tex: .3, border: .3, ink: null });
    // a maple behind the cottage on the left
    if (C.x - W / 2 / C.z < CX - 16 * SC - 330 + 420) farTree(CX - 16 * SC - 330, CY + 40, 30, [FALL.amber, FALL.rust, FALL.gold, '#E07A2E', FALL.bark], 'D1tree', .3 * Math.sin(t * .8));
  }
  function d1Deck() {
    const { x0, x1, y0, y1, yb } = DECK;
    boilSeed('D1deck');
    paint([[x0, y0], [x1, y0], [x1 + 14, y1], [x0 - 14, y1]], { wash: mixCol(FALL.wood, '#E2A06A', .3), fill: FALL.woodDk, fillOp: 60, tex: .6, bleed: .04, ink: PAL.ink, sw: 1.5 });
    for (let i = 1; i < 4; i++) { const y = y0 + (y1 - y0) * i / 4; inkLine([[x0 - 3.5 * i, y], [lerp(x0, x1, .5), y + 1.5], [x1 + 3.5 * i, y]], 1, FALL.woodDk, 'dry', 0); }
    paint(rectPts(x0 - 16, y1, x1 - x0 + 32, yb - y1, 1), { wash: FALL.woodDk, fill: FALL.barkDk, fillOp: 60, tex: .6, ink: PAL.ink, sw: 1.5 });
    boilSeed('D1steps');   // two stone steps down to the yard at the right end
    paint(rectPts(x1 + 10, y1 - 4, 150, 72, 2), { wash: mixCol(FALL.stone, '#E2A882', .25), ink: PAL.ink, sw: 1.4 });
    paint(rectPts(x1 + 70, y1 + 60, 170, 80, 2), { wash: mixCol(FALL.stone, '#D09A7A', .25), ink: PAL.ink, sw: 1.4 });
  }
  // the wet walls: a damp band along the foot of the wall that dries (shrinks) over the shot, and the sunset on the right
  function d1WallLight(t) {
    const dry = seg(t, tD1, tD2), hgt = lerp(190, 70, dry);
    boilSeed('D1damp');
    paint(rectPts(CX - 16 * SC + 6, CY - hgt, 32 * SC - 12, hgt - 4, 4), { fill: '#6E6A80', fillOp: lerp(55, 25, dry), bleed: .3, tex: .4, border: .5, ink: null });
    boilSeed('D1walllit');
    paint(rectPts(CX + 3.9 * SC, CY - 17.7 * SC, 12 * SC - 4, 17.5 * SC, 4), { fill: '#F4A060', fillOp: 85, bleed: .12, tex: .3, border: .5, ink: null });
    boilSeed('D1wallshade');
    paint(rectPts(CX - 16 * SC + 4, CY - 8.6 * SC, 12.3 * SC, 8.5 * SC, 4), { fill: '#A08AA8', fillOp: 55, bleed: .12, tex: .3, border: .5, ink: null });
    boilSeed('D1roofrim');   // the low sun catches the right-hand edge of the roof
    inkLine([[CX + 3 * SC, CY - 30 * SC + 3], [CX + 11 * SC, CY - 23.8 * SC], [CX + 19 * SC, CY - 17.5 * SC - 2]], 3.2, '#FFC47A', 'dry', 0);
  }
  // the lit room behind the open door, so Clawd steps out of warm light
  function doorway(door) {
    if (door < .25) return;
    const dw = 3.6 * SC, dTop = CY - 11 * SC, x0 = CX - dw + 2 * dw * (1 - ease(Math.min(door, .999)) * .82) + 3;
    const arch = x => dTop - 2.6 * SC * Math.sqrt(Math.max(0, 1 - ((x - CX) / dw) ** 2));
    const P = [[x0, CY - 2], [x0, arch(x0) + 4]];
    for (let i = 1; i < 10; i++) { const x = lerp(x0, CX + dw - 3, i / 10); P.push([x, arch(x) + 4]); }
    P.push([CX + dw - 3, CY - 2]);
    boilSeed('D1room');
    paint(P, { wash: mixCol('#E39A58', FALL.window, .3), washOp: 255 * seg(door, .25, .6), fill: '#B8603A', fillOp: 70 * seg(door, .25, .6), bleed: .05, tex: .4, ink: null });
    glow(CX, CY - 5 * SC, 4.5 * SC, FALL.lamp, .5 * seg(door, .25, .8));
  }
  // water dripping from the eaves, thinning out as the rain passes
  function drips(t) {
    const eave = CY - 17.5 * SC - 2;
    for (let i = 0; i < 7; i++) {
      const h = j => hash(i * 17 + j + 50), x = CX - 17 * SC + i * 5.6 * SC + 40 * h(1), per = 1.1 + .9 * h(2);
      if (h(6) < seg(t, tD1 + 3, tD2 - 2)) continue;   // the drips stop one by one
      const ph = ((t + h(3) * per) % per) / per, fallT = .62, grow = clamp(ph / (1 - fallT / per));
      const a = Math.max(0, (ph - (1 - fallT / per)) * per), y = eave + 8 + .5 * 2400 * a * a;
      boilSeed('D1drip' + i);
      if (y < DECK.y1 - 10) paint(ellPts(x, y + (a > 0 ? 6 : 3 * grow), 4 + 1.5 * grow, a > 0 ? 11 : 4 + 5 * grow, 10), { wash: '#EAF0F4', washOp: 210, ink: mixCol(PAL.ink, '#8FA0B8', .4), sw: .6 });
    }
  }
  function puddles(t) {
    [[CX + 420, CY + 58, 120, 14], [CX - 300, CY + 64, 90, 10], [DECK.x1 + 520, CY + 240, 190, 22], [DECK.x1 + 1100, CY + 330, 260, 28]].forEach(([x, y, rx, ry], i) => {
      boilSeed('D1pud' + i);
      paint(ellPts(x, y, rx, ry, 20, 2), { wash: '#EDA994', ink: mixCol(PAL.ink, FALL.grassDk, .4), sw: .6 });
      paint(ellPts(x + rx * .15, y - ry * .2, rx * .55, ry * .35, 14), { wash: '#FFE6B4', washOp: 200, ink: null });
      glint(x - rx * .3, y - ry * .1, 14, t, i * 2.1, 'D1pg' + i, 2.1);
    });
  }
  function d1Sparkle(t, C) {
    // wet leaves on the grass, each catching the light now and then
    const half = W / 2 / C.z + 60;
    for (let i = 0; i < 14; i++) {
      const h = j => hash(i * 23 + j + 700), x = DECK.x1 + 160 + i * 200 + 80 * h(1), y = CY + 150 + 0.12 * (x - DECK.x1) + 60 * h(2);
      if (Math.abs(x - C.x) > half) continue;
      flatLeaf(x, y, 17 + 5 * h(3), h(4) * TAU, LEAFC[i % LEAFC.length], 'D1wl' + i);
      glint(x + 8, y - 5, 16, t, h(5) * TAU, 'D1wg' + i, 1.5 + h(6));
    }
    tufts(DECK.x1 + 200, 4000, CY + 260, 26, 7, mixCol(FALL.grassDk, PAL.ink, .2), t, 34, [C.x - half, C.x + half]);
  }

  // ---------- Clawd and the cat in D1 ----------
  const EMO1 = [[0, 'excited', { lookX: .1, lookY: -.2 }], [tBask, 'hopeful', { lookX: .45, lookY: -.75 }], [tTurnR, 'happy', { lookX: .8 }],
    [tWalk1 + .2, 'hopeful', { eyes: 'shine', mouth: 'o', lookX: .9, lookY: -.15 }], [tStar, 'starstruck', { lookX: .45, lookY: -.75, aL: .15, aR: .25 }],
    [tJoy, 'excited', { eyes: 'happy', mouth: 'open' }], [tPlay, 'playful', { lookX: .8, lookY: .5 }]];
  function pose1(t) {
    const cl = emotions(t, EMO1, { take: .8 });
    const o = { ...cl, hat: 'beanie', boilKey: 'D1clawd' };
    let x, y, u;
    if (t < tHop1) {                                                // inside the door, then the hop out onto the porch
      const k = seg(t, tHop0, tHop1), hop = jump(t, tHop0, tHop1, 1.4);
      x = lerp(CX, CX + 20, ease(k)); y = lerp(CY - 4, PY, easeOut(k)); u = lerp(19, U1, ease(k));
      o.view = 'front'; o.dy = (cl.dy || 0) * .4 + hop.dy; o.sq = (cl.sq || 0) * .5 + hop.sq;
      o.aL = lerp(1.25, .9, k) + .1 * Math.sin(t * 9); o.aR = lerp(1.1, 1.3, k) + .1 * Math.sin(t * 8 + 1);
    } else if (t < tWalk0) {                                        // basking in the light, then a turn to the right
      x = CX + 20; y = PY; u = U1;
      if (t > tTurnR) Object.assign(o, turn(t, tTurnR, tTurnR + .18, 0, .125));
      o.sq = (cl.sq || 0) + spring(t, tHop1, 7, 17) * .35 - .06 * Math.sin(Math.PI * seg(t, tBask + .2, tBask + 1.4));   // a deep breath of the air
    } else {                                                        // along the porch, then a stop facing the valley
      const k = seg(t, tWalk0, tWalk1), d = (XP - CX - 20) * ease(k);
      x = CX + 20 + d; y = PY; u = U1;
      o.view = 'q';
      if (t < tWalk1) { o.walk = d / (4 * U1); o.dy = (cl.dy || 0) * .3 - .3 * Math.abs(Math.sin(d / (4 * U1) * TAU)); }
      if (t < tBound - .2) {
        // the eyes go up to the rainbow first, then the take
        if (t > tLookUp && t < tStar) { const e = ease(seg(t, tLookUp, tLookUp + .25)); o.lookX = lerp(.9, .5, e); o.lookY = lerp(-.15, -.9, e); o.mouth = 'O'; }
        // joy: both arms fling up on the surge, not in unison
        const up = backOut(seg(t, tJoy - .1, tJoy + .22));
        if (t > tJoy - .1 && t < tPlay + .3) {
          const d2 = 1 - ease(seg(t, tPlay - .15, tPlay + .3));
          o.aL = lerp(o.aL ?? .2, 1.5 + .14 * Math.sin(t * 8.5), up * d2); o.aR = lerp(o.aR ?? .2, 1.42 + .14 * Math.sin(t * 8.5 + 1.9), up * d2);
        }
        const hop = jump(t, tJoy + .02, tJoy + .5, 1.8), hop2 = jump(t, AT(32, 2), AT(32, 2) + .38, .8);
        o.dy = (o.dy || 0) + hop.dy + hop2.dy; o.sq = (o.sq || 0) + hop.sq + hop2.sq;
      } else {
        // crouch, then bound off the porch toward the yard (the cut lands mid-air)
        const crouch = Math.sin(Math.PI * seg(t, tCrouch, tBound)) * .22, k2 = seg(t, tBound, tBound + .7);
        x = XP + 520 * k2; y = PY + 210 * k2 * k2 - 260 * 4 * k2 * (1 - k2) * .5;
        o.sq = (cl.sq || 0) * .3 + (t < tBound ? crouch : -.18 * Math.sin(Math.PI * clamp(k2 * 1.6)));
        o.rot = t < tBound ? .05 : .18 * k2; o.aL = t < tBound ? -.4 : 1.2; o.aR = t < tBound ? -.3 : .9;
        o.dy = 0; if (t > tBound) o.noShadow = true;
      }
    }
    return { x, y, u, o: warm(o, .3 + .5 * seg(t, tBurst, tHop1)) };
  }
  function cat1(t) {   // → { x, y, s, o } or null
    if (t < tCatOut) return null;
    const blinkAt = (t0, d) => 1 - Math.sin(Math.PI * seg(t, t0, t0 + d)) * .95;
    if (t < tCatSit) {                                              // trotting out of the door
      const k = seg(t, tCatOut, tCatSit), x = lerp(CX - 20, CX + 150, ease(k)), y = lerp(CY - 6, PY - 2, easeOut(k)), s = lerp(13.5, 16, k);
      return { x, y, s, o: { pose: 'walk', walk: (x - CX) / 42, tailUp: .9, tail: .3 * Math.sin(t * 5), ears: .9, pupil: .5, dy: -.12 * Math.abs(Math.sin((x - CX) / 42 * TAU)), boilKey: 'D1cat' } };
    }
    const settle = spring(t, tCatSit, 8, 20) * .9, lookUp = ease(seg(t, AT(31, 3.4), AT(31, 3.8)));
    let look = [.9, -.5];                                           // up at Clawd, then out at the valley, then up at the rainbow
    look = [lerp(look[0], 1, ease(seg(t, AT(30, 3), AT(30, 3.3)))), lerp(look[1], -.1, ease(seg(t, AT(30, 3), AT(30, 3.3))))];
    look = [lerp(look[0], .6, lookUp), lerp(look[1], -1, lookUp)];
    const jolt = seg(t, tJoy + .05, tJoy + .15) * (1 - seg(t, tJoy + .6, tJoy + 1));
    if (t > tJoy + .2) look = [lerp(look[0], .95, ease(seg(t, tJoy + .2, tJoy + .5))), lerp(look[1], -.55, ease(seg(t, tJoy + .2, tJoy + .5)))];
    if (t > tBound) look = [1, lerp(-.5, .5, ease(seg(t, tBound, tBound + .4)))];
    return { x: CX + 150, y: PY - 2, s: 16, o: { pose: 'sit', sy: 1 - .12 * settle - .1 * jolt, sx: 1 + .08 * settle, look, pupil: lerp(.35, .9, jolt), eyes: jolt > .3 ? 'wide' : 'open',
      blink: blinkAt(AT(30, 4.1), .6) * blinkAt(AT(32, 2.6), .25), ears: 1 - 1.3 * jolt, tailUp: 1, tail: .5 * Math.sin(t * 2.2) + 1.1 * spring(t, tJoy + .4, 4, 12), boilKey: 'D1cat' } };
  }

  function shotD1(t, lt, dur) {
    const C = cam1(t);
    inL(C, R1, .06, () => d1Sky(t));
    inL(C, R1, .13, () => d1Hills(t));
    inL(C, R1, .15, () => rainbow(1000, 700, 330, 13, seg(t, tBow, tBow + 1.5), t, 'D1bow'));
    inL(C, R1, .32, () => d1Valley(t));
    camBegin(C.x, C.y, C.z);
    d1Ground(t, C);
    d1Deck();
    const door = t < tBurst ? .035 * Math.max(0, Math.sin(Math.PI * seg(t, tRattle, tRattle + .2))) + .03 * Math.max(0, Math.sin(Math.PI * seg(t, tRattle + .22, tRattle + .36)))
      : 1 - .16 * Math.abs(spring(t, tBurst + .12, 6, 16)) * seg(t, tBurst + .1, tBurst + .12) - .9 * (1 - easeOut(seg(t, tBurst, tBurst + .13)));
    cottage(CX, CY, SC, { door: Math.min(door, .999), lit: .5, wet: lerp(.55, .2, seg(t, tD1, tD2)), key: 'D1cot' });
    d1WallLight(t);
    doorway(door);
    puddles(t);
    const c = cat1(t), P = pose1(t);
    if (c && t < tCatSit - .6) cat(c.x, c.y, c.s, c.o);            // still in the doorway: behind Clawd
    if (t > tBurst) clawd(P.x, P.y, P.u, P.o);
    if (c && t >= tCatSit - .6) cat(c.x, c.y, c.s, c.o);
    d1Sparkle(t, C);
    drips(t);
    camEnd();
    if (lt < .7) flash(1 - ease(lt / .7), '#FFE7A8');               // the gold of C1 clears onto the scene
  }

  // ======================================================================================================
  // D2: the yard and the leaf pile
  // ======================================================================================================
  const U2 = 22, G2 = 905, CS2 = 17;                         // Clawd's size and ground line; the cat's size
  const tLand = AT(33, 1.33), tNotice = AT(33, 1.95), tIdea = AT(33, 2.55), tMisch = AT(33, 3.2);
  const tBack0 = AT(33, 3.4), tBack1 = AT(33, 4.08), tRun = AT(33, 4.35), tLeap = AT(33, 4.66), tImpact = BAR(34);
  const tCatGo = AT(34, 3.05), tCatCrouch = AT(34, 3.95), tPounce = BAR(35), tCatIn = AT(35, 1.5);
  const tPop = BAR(36), tCatPop = BAR(37), tTake = AT(37, 1.6), tLaugh2 = AT(37, 2.2), tTilt = AT(37, 3.2);
  const tLie = BAR(38), tSet = AT(38, 2.6), tRise = tEnd - 1.5;
  const R2 = { x: 960, y: 540, z: 1 };                       // D2's layers are laid out in the screen coordinates of this camera
  const P_SUN = .1, SUNX = 1265, SUNR2 = 90, sunY = t => lerp(300, 392, ease(seg(t, tD2, tSet)));
  const PILE = { x: 1170, y: 910, w: 610, h: 245 };
  const XL = 500, XB = 395, XR = 785, XIN = 1150;            // landing, backed up, take-off, where Clawd goes in
  const STEP = [165, 852];                                   // the cat's seat on the porch step
  const LEAF2 = [FALL.amber, FALL.rust, FALL.gold, '#E6A03A', FALL.olive];   // no maple red: the red leaf is indoors
  const LEAFB = [FALL.gold, FALL.amber, '#E6A03A', FALL.rust, '#F2C46A', FALL.amber];
  const bumpK = (t, t0) => t < t0 ? 0 : Math.exp(-4.5 * (t - t0)) * Math.cos(11 * (t - t0));
  const wriggle = t => seg(t, tCatIn + .3, tCatIn + .6) * (1 - seg(t, tPop - .3, tPop));
  function pileShape(t) {
    const h = PILE.h * (1 - .18 * seg(t, tImpact, tImpact + .12) + .08 * seg(t, tImpact + 2, tImpact + 9))
      * (1 - .24 * bumpK(t, tImpact) - .12 * bumpK(t, tCatIn) - .06 * bumpK(t, tPop) - .04 * bumpK(t, tCatPop) + .035 * wriggle(t) * Math.sin(t * 13));
    return { x: PILE.x, y: PILE.y, w: PILE.w * (1 + .1 * bumpK(t, tImpact) + .05 * bumpK(t, tCatIn)), h };
  }
  const pileTopAt = (x, P = PILE) => { const d = (x - P.x) / (P.w / 2); return Math.abs(d) >= 1 ? null : P.y - P.h * Math.sqrt(1 - d * d) * .97; };
  function cam2(t) {
    const x = kf(t, [[tD2, 880], [tNotice, 905], [tBack1, 885], [tImpact, 1000], [tImpact + 1.1, 1060], [AT(34, 3.3), 1055], [AT(35, 1), 990], [AT(35, 3.4), 1030],
      [tPop + .3, 1110], [AT(36, 3), 1135], [tCatPop, 1150], [tLie, 1160], [AT(38, 2.4), 1150], [tRise, 1150], [tEnd, 1150]]);
    const y = kf(t, [[tD2, 540], [tImpact, 540], [tImpact + 1.1, 395], [AT(34, 3.3), 400], [AT(35, 1), 530], [AT(35, 3.4), 540], [tPop + .3, 560], [AT(36, 3), 575],
      [tCatPop, 578], [tLie, 572], [AT(38, 2.4), 470], [tRise, 462], [tEnd, 150]]);
    const z = kf(t, [[tD2, 1], [tImpact, 1], [tImpact + 1.1, .95], [AT(34, 3.3), .95], [AT(35, 1), 1], [AT(35, 3.4), 1.02], [tPop + .3, 1.06], [AT(36, 3), 1.12],
      [tCatPop, 1.13], [tLie, 1.12], [AT(38, 2.4), 1], [tEnd, 1]]);
    const [sx, sy] = shakeXY(t, 9 * Math.exp(-7 * Math.max(0, t - tImpact)) * (t > tImpact ? 1 : 0));
    return { x: x + sx + 5 * Math.sin(t * .45), y: y + sy + 3 * Math.sin(t * .37), z };
  }

  // ---------- the leaf bursts: leaves thrown up out of the pile hang, then drift down and settle ----------
  // Each leaf: launched at (x0, y0) with (vx, vy), linear air drag k, falling at vt once slowed, swaying as it falls.
  // Its resting time (when it first reaches the pile's top or the ground, after the apex) is found once, at load.
  function burstPos(L, a) {
    const e = 1 - Math.exp(-L.k * a), sw = L.sway * Math.sin(L.w * a + L.ph) * Math.min(1, a / 1.2);
    return [L.x0 + L.vx / L.k * e + L.wind * a + sw, L.y0 + L.vt * a + (L.vy - L.vt) / L.k * e];
  }
  function makeBurst(n, seed, x0, y0, spread, vy, vx) {
    return [...Array(n)].map((_, i) => {
      const h = j => hash(seed * 131 + i * 17 + j);
      const L = { x0: x0 + (h(1) - .5) * spread, y0: y0 + h(2) * 30, delay: .05 * h(3), vx: (h(4) - .5) * 2 * vx, vy: -vy * (.5 + .5 * h(5)), k: 2.6 + 1.2 * h(6),
        vt: 42 + 38 * h(7), sway: 20 + 40 * h(8), w: 1.4 + 1.2 * h(9), ph: h(10) * TAU, s: 22 + 11 * h(11), col: LEAFB[Math.floor(h(12) * LEAFB.length)],
        spin: 2.5 + 3.5 * h(13), rest: (h(14) - .35) * 55, wind: 10 * (h(15) - .3) };
      L.land = 40;
      for (let a = .3; a < 40; a += .04) {
        const p = burstPos(L, a), top = pileTopAt(p[0]), g = top != null ? top + 6 + 8 * h(16) : G2 + L.rest;
        if (burstPos(L, a + .04)[1] > p[1] && p[1] >= g) { L.land = a; break; }
      }
      return L;
    });
  }
  const BURSTS = [[tImpact, makeBurst(40, 1, PILE.x - 40, PILE.y - PILE.h + 30, 300, 1550, 900)], [tCatIn, makeBurst(10, 2, 1110, 770, 120, 950, 360)],
    [tPop, makeBurst(8, 3, XIN, 650, 170, 820, 380)], [tCatPop + .05, makeBurst(5, 4, 1330, 735, 80, 620, 260)]];
  function bursts(t) {
    BURSTS.forEach(([t0, B], bi) => B.forEach((L, i) => {
      const a = t - t0 - L.delay; if (a <= 0) return;
      boilSeed('D2b' + bi + '_' + i);
      if (a < L.land) {
        const [x, y] = burstPos(L, a), sp = Math.exp(-1.2 * a);
        leafW(x, y, L.s, L.ph + L.spin * a * (.35 + .65 * sp) + .5 * Math.sin(L.w * a), L.col, Math.cos(a * L.spin * .8 + L.ph));
      } else {
        const [x, y] = burstPos(L, L.land), k = seg(a, L.land, L.land + .25);
        leafW(x, y, L.s, L.ph + L.spin * L.land * .4, L.col, lerp(Math.cos(L.land * L.spin * .8 + L.ph), .9, k), lerp(1, .5, k));
      }
    }));
  }

  // ---------- D2 set ----------
  const ridge2 = (() => {
    const f = x => 468 - 38 * Math.sin(x / 240 + 1) - 22 * Math.sin(x / 93 + 2) - 12 * Math.sin(x / 51) + 42 * Math.exp(-(((x - SUNX) / 175) ** 2));
    const off = sunY(tSet) + SUNR2 + 2 - f(SUNX);                 // the saddle holds the sun's disc when it touches down
    const P = [[2500, 1500], [-500, 1500]];
    for (let x = -500; x <= 2500; x += 40) P.push([x, f(x) + off]);
    return P;
  })();
  function d2Sky(t) {
    skyBlend('sunset', 'dusk', lerp(.04, .3, seg(t, tD2, tEnd)), { key: 'D2sky', x0: -120, y0: -250, w: 2200, h: 860 });
    cloudBank(t, { key: 'D2cl', n: 3, x0: -200, x1: 2200, y: 120, seed: 14, lift: 5, t0: tD1, sc: .95, op: lerp(.75, .45, seg(t, tD2, tEnd)), near: [SUNX, 360] });
  }
  function d2Hills(t) {
    const sy = sunY(t);
    boilSeed('D2rays');
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI * (.55 + .45 * i / 5) + .03 * Math.sin(t * .4 + i), len = 1100 + 250 * hash(i + 13), w = 60 + 50 * hash(i + 17);
      paint([[SUNX + Math.cos(a) * 60, sy + Math.sin(a) * 60], [SUNX + Math.cos(a + w / len) * len, sy + Math.sin(a + w / len) * len], [SUNX + Math.cos(a - w / len) * len, sy + Math.sin(a - w / len) * len]],
        { wash: '#FFE8B8', washOp: 38 + 16 * Math.sin(t * .9 + i * 2), ink: null });
    }
    sunDisc(SUNX, sy, SUNR2, 'D2sun');
    boilSeed('D2ridge');
    paint(ridge2, { wash: '#B08C9E', fill: '#957488', fillOp: 45, bleed: .04, tex: .3, border: .1, ink: null });
    inkLine(ridge2.slice(2).filter(p => Math.abs(p[0] - SUNX) < 650), 1.8, '#FFC98A', 'dry', .5);
    glow(SUNX, sy + SUNR2, 240, '#FFB060', .6 * seg(t, tD2 + 4, tSet));   // the hills glow where the sun is going down
  }
  function d2Valley(t) {
    boilSeed('D2v ridge');
    paint(ridgePts(-400, 2400, 585, 45, 18, 2.6), { wash: '#A2768A', ink: null, curv: .5 });
    boilSeed('D2v fields');
    paint(ridgePts(-400, 2400, 640, 25, 12, 6.1), { wash: '#C0906A', ink: null, curv: .5 });
    for (let r = 0; r < 2; r++) for (let i = 0; i < 7; i++) appleTree(1340 + i * 62 + r * 26, 612 + r * 26 + 6 * Math.sin(i), 6.5 + 1.5 * r, 'D2at' + r + '_' + i, .8);
    boilSeed('D2v stream');
    paint(ribbon([[-300, 668], [300, 652], [800, 676], [1300, 660], [1800, 684], [2400, 666]], 16, 26), { wash: '#F8CFA2', ink: null });
    const tc = (a, b, c) => [a, b, c, a, mixCol(FALL.bark, '#8E5A6A', .3)];
    [[1040, 640, 3.6, tc(FALL.rust, FALL.amber, FALL.gold)], [1880, 650, 4.2, tc(FALL.amber, FALL.gold, FALL.rust)], [2120, 640, 3.4, tc(FALL.gold, FALL.rust, FALL.amber)]]
      .forEach(([x, y, s, c], i) => farTree(x, y, s, c, 'D2ft' + i, .15 * Math.sin(t * .7 + i)));
    for (let i = 0; i < 6; i++) glint(1000 + 170 * i + 50 * hash(i + 40), 664 + 10 * Math.sin(i * 2.3), 8, t, hash(i * 7 + 2) * TAU, 'D2vg' + i, 1.3 + .5 * hash(i));
  }
  function d2Wall(t) {   // a low dry-stone wall along the back of the yard
    boilSeed('D2wall');
    paint(through([[-600, 742], [-600, 694], [300, 688], [1100, 694], [2000, 686], [2600, 692], [2600, 742]], 3), { wash: mixCol(FALL.stone, '#C98A7A', .3), fill: '#7E6A68', fillOp: 60, bleed: .03, tex: .7, border: .2, ink: PAL.ink, sw: 1 });
    for (let i = 0; i < 26; i++) { const x = -560 + i * 120 + 40 * hash(i + 60), y = 706 + 18 * hash(i + 61); inkLine([[x, y], [x + 30 + 30 * hash(i + 62), y - 4], [x + 70 + 20 * hash(i + 63), y + 2]], .8, mixCol(PAL.ink, FALL.stone, .35), 'inkfine', .6); }
    boilSeed('D2wall lit');
    inkLine([[-600, 692], [300, 686], [1100, 692], [2000, 684], [2600, 690]], 2.2, '#FFC98A', 'dry', .5);
  }
  function d2Yard(t, C) {
    boilSeed('D2ground');
    paint(rectPts(-300, 728, 2650, 560), { wash: mixCol(FALL.grass, '#D69A62', .25), fill: FALL.grassDk, fillOp: 60, bleed: .02, tex: .6, border: .15, ink: null });
    boilSeed('D2ground lit');
    paint(ellPts(1350, 800, 900, 70, 24, 6), { fill: '#F2B66A', fillOp: 60, bleed: .15, tex: .3, border: .3, ink: null });
    // the porch at the far left: the corner of the deck and two stone steps down into the yard
    boilSeed('D2porch');
    paint([[-300, 640], [150, 640], [160, 740], [-300, 740]], { wash: mixCol(FALL.wood, '#E2A06A', .3), ink: PAL.ink, sw: 1.4 });
    paint(rectPts(-300, 740, 470, 44, 1), { wash: FALL.woodDk, ink: PAL.ink, sw: 1.4 });
    paint(rectPts(40, 784, 220, 70, 2), { wash: mixCol(FALL.stone, '#E2A882', .25), ink: PAL.ink, sw: 1.4 });
    paint(rectPts(80, 852, 240, 62, 2), { wash: mixCol(FALL.stone, '#D09A7A', .25), ink: PAL.ink, sw: 1.4 });
    // puddles catching the sky
    [[560, 968, 150, 16], [1620, 990, 210, 20], [260, 1030, 120, 13]].forEach(([x, y, rx, ry], i) => {
      boilSeed('D2pud' + i);
      paint(ellPts(x, y, rx, ry, 20, 2), { wash: '#EDA994', ink: mixCol(PAL.ink, FALL.grassDk, .4), sw: .6 });
      paint(ellPts(x + rx * .15, y - ry * .2, rx * .55, ry * .35, 14), { wash: '#FFE6B4', washOp: 200, ink: null });
      glint(x - rx * .3, y - ry * .1, 13, t, i * 2.1 + 1, 'D2pg' + i, 2);
    });
    // the maple, and the rake leaning on it
    maple(680, 872, 19, { key: 'D2maple', seed: 3, cols: [FALL.amber, FALL.gold, FALL.rust, '#E07A2E'], sway: .35 * Math.sin(t * .8) + .5 * bumpK(t, tImpact) });
    boilSeed('D2rake');
    inkLine([[600, 900], [668, 700], [712, 572]], 3.2, FALL.wood, 'ink', 0);
    push(); translate(718, 556); rotate(.33);
    paint(rectPts(-34, -6, 68, 12, 1), { wash: mixCol(FALL.barkDk, PAL.ink, .3), ink: PAL.ink, sw: .8 });
    for (let i = 0; i < 7; i++) inkLine([[-30 + i * 10, -6], [-31 + i * 10, -26]], 1.3, mixCol(FALL.barkDk, PAL.ink, .3), 'ink', 0);
    pop();
  }

  // ---------- Clawd in D2 ----------
  const EMO2 = [[0, 'excited', { eyes: 'happy', mouth: 'open', emote: null }], [tNotice, 'neutral', { eyes: 'look', lookX: 1, lookY: .25 }], [tIdea, 'idea', { lookX: .8, lookY: -.2 }],
    [tMisch, 'mischief', { lookX: 1, lookY: .1 }], [tBack1, 'determined', { lookX: 1 }], [tPop, 'laugh'], [tTake, 'surprised', { lookX: .95, lookY: .1, emote: null }],
    [tLaugh2, 'laugh', { lookX: .6 }], [tLie, 'hopeful', { lookX: .5, lookY: -.9 }]];
  const beanieLeaves = (u, sw) => {   // leaves stuck on the beanie after the dive (body-local, front view)
    [[-1.9, -10.3, -.7, .95, FALL.gold], [1.7, -10.7, .6, .85, FALL.amber], [.5, -9.2, 2.4, .75, FALL.rust]].forEach(([lx, ly, r, s, c]) => leafW(lx * u, ly * u, s * u, r, c, .8));
  };
  function pose2(t) {   // → { x, o, behind } (behind: drawn behind the pile's front), or null while buried
    const cl = emotions(t, EMO2, { take: .8 });
    const o = { ...cl, hat: 'beanie', boilKey: 'D2clawd' };
    let x, behind = false;
    if (t < tLand) {                                                 // still in the air from the porch
      const k = seg(t, tD2 - .42, tLand), p = arcPt([150, 690], [XL, G2], 120, k);
      x = p[0]; o.dy = (p[1] - G2) / U2; o.view = 'q'; o.aL = 1.2 + .1 * Math.sin(t * 9); o.aR = .95; o.sq = -.14; o.rot = .1; o.noShadow = false;
    } else if (t < tBack0) {                                         // landed; the eyes find the pile; the idea
      x = XL; o.view = 'q';
      const land = .24 * Math.exp(-8 * (t - tLand)) * Math.cos(20 * (t - tLand));
      o.sq = (cl.sq || 0) + land; o.dy = (cl.dy || 0) * (t < tNotice ? .6 : 1);
    } else if (t < tBack1) {                                         // tiptoes backwards for a run-up, grinning
      const k = ease(seg(t, tBack0, tBack1)), d = (XL - XB) * k;
      x = XL - d; o.view = 'q'; o.walk = -d / (3 * U2);
      o.dy = (cl.dy || 0) * .4 - .35 * Math.abs(Math.sin(d / (3 * U2) * TAU)); o.rot = -.07; o.sq = (cl.sq || 0) + .04;
    } else if (t < tRun) {                                           // digs in: a crouch (the anticipation)
      x = XB; o.view = 'q'; o.sq = .22 * ease(seg(t, tBack1, tBack1 + .15)); o.rot = .1 * ease(seg(t, tBack1, tRun)); o.dy = 0;
      o.aL = -.6; o.aR = -.5; o.dx = -.25 * Math.sin(t * 40) * seg(t, tBack1 + .1, tRun);   // feet scrabbling
    } else if (t < tLeap) {                                          // the dash
      const k = seg(t, tRun, tLeap), d = (XR - XB) * (k * k * .6 + k * .4);
      x = XB + d; o.view = 'side'; o.walk = d / (2.2 * U2); o.smear = .45; o.smearDir = 1;
      o.dy = -.35 * Math.abs(Math.sin(d / (2.2 * U2) * TAU)); o.rot = .12; o.sq = -.08; o.aL = .8 * Math.sin(d / (2.2 * U2) * TAU);
    } else if (t < tImpact + .02) {                                  // the leap: an arc up and head first into the pile
      const k = seg(t, tLeap, tImpact), p = arcPt([XR, G2], [XIN, G2 - 150], 170, k);
      x = p[0]; o.dy = (p[1] - G2) / U2; o.view = 'side'; o.rot = lerp(.05, .75, k); o.sq = -.24 * Math.sin(Math.PI * clamp(k * 1.1)); o.aL = 1.3;
      o.smear = .35 * (1 - k); o.smearDir = 1; o.noShadow = true; behind = k > .82;
    } else if (t < tPop - .05) return null;                          // under the leaves
    else {                                                           // pops out laughing; later lies back to watch the sun
      x = XIN; behind = true; o.view = 'front'; o.noShadow = true;
      const up = backOut(seg(t, tPop - .05, tPop + .3)), lie = ease(seg(t, tLie, tLie + .9));
      o.dy = lerp(1.5, -7.1, up) + (cl.dy || 0) * .5 + 1.1 * lie; o.sq = (cl.sq || 0) - .12 * spring(t, tPop + .2, 6, 16);
      o.rot = (cl.rot || 0) * (1 - lie) - .36 * lie;
      if (t > tLaugh2 && t < tLie) o.aR = lerp(o.aR ?? .2, .9 + .08 * Math.sin(t * 12), ease(seg(t, tLaugh2, tLaugh2 + .25)));   // pointing at the cat's hat
      if (t > tLie) { o.aL = lerp(o.aL ?? .2, -.5, lie); o.aR = lerp(o.aR ?? .2, -.35, lie); }
      o.draw = beanieLeaves;
      o.seed = 3;
    }
    return { x, o: warm(o, .45), behind };
  }

  // ---------- the cat in D2 ----------
  function cat2(t) {   // → { x, y, o, behind, hat } or null while it is inside the pile
    const blinkAt = (t0, d) => 1 - Math.sin(Math.PI * seg(t, t0, t0 + d)) * .95;
    if (t < tCatGo) {                                                // on the porch step, watching
      const jolt = Math.exp(-5 * Math.max(0, t - tImpact)) * (t > tImpact ? 1 : 0), close = ease(seg(t, tBack0 + .3, tBack1)) * (1 - ease(seg(t, tRun, tRun + .4)));
      let look = [.8, .35];
      if (t > tImpact) { const k = ease(seg(t, tImpact + .1, tImpact + .6)), k2 = ease(seg(t, tImpact + 1.6, tCatGo - .1)); look = [lerp(.8, .45, k), lerp(.35, -1, k)]; look = [lerp(look[0], 1, k2), lerp(look[1], .1, k2)]; }
      return { x: STEP[0], y: STEP[1], front: true, o: { pose: 'sit', look, pupil: lerp(.4, 1, Math.max(jolt, .6 * seg(t, tImpact, tCatGo))), eyes: jolt > .4 ? 'wide' : 'open',
        ears: .9 - 1.6 * close - .8 * jolt, rot: -.12 * close, sy: 1 - .15 * jolt, sx: 1 + .08 * jolt, blink: blinkAt(AT(33, 2.8), .3), tailUp: 1 - close, tail: .6 * Math.sin(t * 2) + 1.2 * spring(t, tBack1 + .3, 4, 12), boilKey: 'D2cat' } };
    }
    if (t < tCatCrouch) {                                            // hops down and trots over to the pile
      const k = seg(t, tCatGo, tCatCrouch), hop = seg(t, tCatGo, tCatGo + .3), x = lerp(STEP[0], XR, ease(k) * .92 + k * .08);
      const y = t < tCatGo + .3 ? arcPt(STEP, [STEP[0] + 70, G2], 30, hop)[1] : G2;
      return { x, y, front: true, o: { pose: 'walk', walk: (x - STEP[0]) / 45, tailUp: .8, tail: .3 * Math.sin(t * 6), ears: 1, pupil: .9, dy: -.12 * Math.abs(Math.sin((x - STEP[0]) / 45 * TAU)), boilKey: 'D2cat' } };
    }
    if (t < tPounce) {                                               // the crouch and the wiggle before the pounce
      const w = Math.sin(t * 26) * seg(t, tCatCrouch + .35, tPounce - .05);
      return { x: XR + 4 * w, y: G2, front: true, o: { pose: 'crouch', tail: .9 * Math.sin(t * 7), pupil: 1, ears: 1, look: [1, -.4], sx: 1 + .04 * w, rot: -.03 * w, boilKey: 'D2cat' } };
    }
    if (t < tCatIn) {                                                // the pounce, into the pile
      const k = seg(t, tPounce, tCatIn), p = arcPt([XR, G2], [1110, 780], 120, k);
      return { x: p[0], y: p[1], front: k < .8, o: { pose: 'pounce', rot: lerp(-.35, .45, k), pupil: 1, ears: 1, noShadow: true, boilKey: 'D2cat' } };
    }
    if (t < tCatPop - .05) return null;
    if (t < tLie - .1) {                                             // pops out of the pile wearing a leaf
      const up = backOut(seg(t, tCatPop - .05, tCatPop + .3)), tilt = Math.sin(Math.PI * seg(t, tTilt, tTilt + 1.3));
      return { x: 1330, y: 775, front: false, hat: true, o: { pose: 'sit', dy: lerp(2.4, -.3, up), eyes: 'half', ears: .35, look: [-.85, .05], blink: blinkAt(AT(37, 2.55), .5), pupil: .3,
        rot: .16 * tilt, noShadow: true, boilKey: 'D2cat' } };
    }
    const k = seg(t, tLie - .1, tLie + .35);                          // hops up onto the top and settles down to watch the sun
    if (k < 1) { const p = arcPt([1330, 775 - .3 * CS2], [1315, 742], 40, k); return { x: p[0], y: p[1], front: k > .5, hat: true, o: { pose: 'sit', eyes: 'open', ears: .8, look: [.4, -.6], noShadow: true, sy: 1 - .1 * Math.sin(Math.PI * k), boilKey: 'D2cat' } }; }
    return { x: 1315, y: 742, front: true, hat: true, o: { pose: 'loaf', eyes: t > tSet ? 'half' : 'open', look: [.5, -.7], ears: .7, blink: blinkAt(AT(38, 3.3), .7), sy: 1 - .1 * spring(t, tLie + .35, 6, 14), tail: .4 * Math.sin(t * 1.5), boilKey: 'D2cat' } };
  }
  function drawCat2(c) {
    cat(c.x, c.y, CS2, c.o);
    if (c.hat) {   // the leaf the cat came up wearing
      const [hx, hy] = catHead(c.x, c.y, CS2, c.o), r = c.o.rot || 0;
      boilSeed('D2cathat');
      leafW(hx + 1.3 * CS2 * Math.sin(r) + 8 * r, hy - 1.35 * CS2 * Math.cos(r) + (c.o.pose === 'loaf' ? .6 * CS2 : 0), 1.25 * CS2, -.25 + 1.6 * r, FALL.gold, .75);
    }
  }
  // wriggles under the leaves while both are inside: two bumps chase about under the surface
  function pileBumps(t, P) {
    const w = wriggle(t); if (w <= 0) return;
    for (let i = 0; i < 2; i++) {
      const bx = P.x + 150 * Math.sin(t * 2.1 + i * 2.6), top = pileTopAt(bx, P) ?? P.y, hh = w * (18 + 14 * Math.abs(Math.sin(t * 3.3 + i * 1.7)));
      boilSeed('D2bump' + i);
      paint(ellPts(bx, top + 6, 60, hh + 6, 16, 1), { wash: mixCol(FALL.rust, FALL.amber, .4), ink: PAL.ink, sw: .9 });
      leafW(bx - 22, top - hh + 8, 15, t * 2 + i, LEAF2[i], .8); leafW(bx + 18, top - hh + 12, 13, -t * 2 + i, LEAF2[i + 2], .7);
    }
  }
  // loose leaves along the top of the pile, drawn over whoever is sticking out of it
  function pileRim(t, P) {
    for (let i = 0; i < 9; i++) {
      const x = P.x - 230 + i * 57 + 10 * hash(i + 80), top = pileTopAt(x, P); if (top == null) continue;
      boilSeed('D2rim' + i);
      leafW(x, top + 8 + 6 * hash(i + 81), 16 + 5 * hash(i + 82), hash(i + 83) * TAU + .15 * Math.sin(t * 3 + i) * wriggle(t), LEAF2[i % LEAF2.length], .7 + .3 * hash(i + 84));
    }
  }

  function shotD2(t, lt, dur) {
    const C = cam2(t);
    // the final move: a crane up (the yard drops out of frame, the far hills barely move) while a push brings the sun's
    // disc to screen (1180, 330) at radius 150 on BAR(39), the match cut to C2's lamp
    const e = ease(seg(t, tRise, tEnd)), S0 = scrL(C, R2, P_SUN, SUNX, sunY(t), false), rEnd = SUNR2 * cam2(tEnd).z;
    const k = lerp(1, 150 / rEnd, e), A = [lerp(S0[0], 1180, e), lerp(S0[1], 330, e)];
    push(); translate(A[0], A[1]); scale(k); translate(-S0[0], -S0[1]);
    inL(C, R2, .05, () => d2Sky(t), false);
    inL(C, R2, P_SUN, () => d2Hills(t), false);
    inL(C, R2, .28, () => d2Valley(t), false);
    inL(C, R2, .7, () => d2Wall(t), false);
    inL(C, R2, 1, () => {
      d2Yard(t, C);
      leafField(t, { key: 'D2lf0', n: 4, seed: 31, x0: 380, x1: 1100, y0: 150, y1: 980, size: [11, 15], fall: [40, 70], cols: LEAF2, wind: 8, sway: 50 });
      const c = cat2(t), P = pose2(t), S = pileShape(t);
      if (c && !c.front) drawCat2(c);
      if (P && P.behind) clawd(P.x, G2, U2, P.o);
      boilSeed('D2pilebase');
      pile(S.x, S.y, S.w, S.h, { key: 'D2pile', n: 5, leaf: 16, cols: LEAF2 });
      pileBumps(t, S);
      pileRim(t, S);
      if (c && c.front) drawCat2(c);
      if (P && !P.behind) clawd(P.x, G2, U2, P.o);
      bursts(t);
    }, false);
    inL(C, R2, 1.25, () => {
      leafField(t, { key: 'D2lf1', n: 3, seed: 37, x0: 0, x1: 2200, y0: -300, y1: 1300, size: [16, 19], fall: [70, 105], cols: LEAF2, wind: 14 });
      tufts(-400, 2400, 1085, 30, 41, mixCol(FALL.grassDk, PAL.ink, .3), t, 42);
    }, false);
    pop();
  }

  shots([[tD1, shotD1], [tD2, shotD2]]);
})();
