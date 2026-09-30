// chB.js: chapter B of "Last Light of September", the orchard and the rain (BAR(13) → BAR(25)). See
// docs/lastlight/STORYBOARD.md.
//   B1  BAR(13) → BAR(17)  the whip pan lands in the orchard: the cat hops onto the basket's rim; Clawd flicks the red
//                          leaf into the basket and picks the basket up (bar 13); tug, tug, POP, and the apple flies into
//                          the basket (bar 14); the cat bats a windfall to Clawd's feet and Clawd laughs (bar 15); a glint
//                          high in the tree, and Clawd's eyes go up (bar 16).
//   B2  BAR(17) → BAR(21)  eyeline-match cut to a low angle up the tree: tiptoe (bar 17), hop and brush (bar 18), crouch,
//                          jump and grab on AT(19, 3); a proud landing; clouds cover the sun; a raindrop hits Clawd's nose
//                          on bar 20; Clawd looks up and the camera tilts up into grey cloud.
//   B3  BAR(21) → BAR(25)  tilt down out of the same cloud into rain: the soaked cat; Clawd scoops it into the basket and
//                          the red leaf lands on its head; the run along the lane to the lit cottage; in at the door on
//                          bar 24, and it shuts. Out: brushWipe in door wood, first half.
(() => {
  const T13 = BAR(13), T14 = BAR(14), T15 = BAR(15), T16 = BAR(16), T17 = BAR(17), T18 = BAR(18), T19 = BAR(19);
  const T20 = BAR(20), T21 = BAR(21), T22 = BAR(22), T23 = BAR(23), T24 = BAR(24), T25 = BAR(25);

  // ---------- helpers ----------
  // Multiplane camera (as in chapter A): p = 1 is the action plane, p < 1 is farther and moves less. C.ty is a TILT in
  // world px: a rotation of the camera moves every layer by the same amount, so it is added without parallax.
  const inLayer = (C, p, fn) => { camBegin(C.rx + (C.x - C.rx) * p, C.ry + (C.y - C.ry) * p + (C.ty || 0), C.z); fn(); camEnd(); };
  // ∫ of a piecewise-linear rate [[t, v], ...]: positions from eased speeds, in closed form
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
  const stemAt = (P, s, r) => [P[0] + .95 * s * Math.sin(r), P[1] - .95 * s * Math.cos(r)];   // a leaf held by its stem
  const visX = (C, p, pad = 80) => { const c = C.rx + (C.x - C.rx) * p, h = W / 2 / C.z + pad; return [c - h, c + h]; };
  function tufts(x0, x1, y, n, seed, col, t, wind = 0, h = 26, vis = null) {
    for (let i = 0; i < n; i++) {
      const x = lerp(x0, x1, (i + hash(i * 3.7 + seed)) / n); if (vis && (x < vis[0] || x > vis[1])) continue;
      const hh = h * lerp(.6, 1.2, hash(i + seed * 2)), sw = wob(t, .35, hash(i + seed)) * 4 + wind;
      boilSeed('Btuft' + seed + '_' + i);
      inkLine([[x - 11 + sw * .8, y - hh * .72], [x, y + 2], [x - 2 + sw, y - hh], [x + 1, y + 2], [x + 12 + sw * .9, y - hh * .78]], .7, col, 'inkfine', 0);
    }
  }
  // A sky like lib's skyBlend() (the same anchors, crossfaded in RGB), in 6 bands over just the visible part of the layer,
  // which halves its cost. v = [x0, x1] visible in this layer, y0..y1 the part of the sky to cover.
  function skyCheap(a, b, k, v, y0, y1, key) {
    const A = SKIES[a].map((c, i) => mixCol(c, SKIES[b][i], clamp(k))), n = 6, h = y1 - y0, x0 = v[0] - 60, w = v[1] - v[0] + 120;
    const cols = [...Array(n)].map((_, i) => { const x = i / (n - 1) * 3, j = Math.min(Math.floor(x), 2); return mixCol(A[j], A[j + 1], x - j); });
    boilSeed(key);
    paint(rectPts(x0, y0, w, h), { wash: cols[0], ink: null });
    for (let i = 1; i < n; i++) {
      const yy = y0 + h * i / n, soft = h / n * .6;
      paint(rectPts(x0 - 40, yy - soft, w + 80, y0 + h - yy + soft + 40), { fill: cols[i], fillOp: 235, bleed: .35, tex: .15, border: .25, ink: null });
    }
  }
  // the sun, painted like chapter A's: the halo goes down first, then the light, then the disc
  function sunDisc(sx, sy, r, a, key) {
    if (a <= .01) return;
    boilSeed(key);
    paint(ellPts(sx, sy, r * 3.3, r * 3.1, 30, 6), { fill: '#F2A854', fillOp: 70 * a, bleed: .35, tex: .25, border: .2, ink: null });
    paint(ellPts(sx, sy, r * 1.8, r * 1.7, 28, 3), { fill: '#FBD08A', fillOp: 120 * a, bleed: .25, tex: .2, border: .15, ink: null });
    glow(sx, sy, r * 8, '#FFBE5E', .6 * a);
    paint(ellPts(sx, sy, r, r, 30, 1), { wash: mixCol('#F2C28A', '#FFF3DA', a), ink: null });
  }
  // A small burst of light: little stars popping out around (x, y)
  function sparkle(x, y, t, t0, key, n = 6, d0 = 20, d1 = 60) {
    for (let i = 0; i < n; i++) {
      const k = seg(t, t0 + i * .05, t0 + .6 + i * .05); if (k <= 0 || k >= 1) continue;
      const a = i / n * TAU + .4 + .3 * hash(i + 7), d = d0 + (d1 - d0) * easeOut(k);
      boilSeed(key + i);
      paint(starPts(x + Math.cos(a) * d, y + Math.sin(a) * d, (7 + 5 * hash(i + 2)) * backOut(k) * (1 - k * .5), .28, 4, k * 2), { wash: PAL.cream, washOp: 255 * (1 - k * k), ink: null });
    }
  }

  // An apple tree, in the style of lib's maple(): (x, y) = the foot of the trunk, s = its unit (the crown is ~22s wide).
  // o: {key, seed, sway, tone (a colour filter for haze or rain), lite (the cheap far version), apples (how many)}
  const LEAFC = [FALL.olive, FALL.moss, '#A9A24C', FALL.leafGreen, '#C6AE55'];
  function appleTree(x, y, s, o = {}) {
    const key = o.key || 'at', seed = o.seed ?? 1, sway = o.sway ?? 0, tone = o.tone || (c => c), lite = !!o.lite;
    const sw = clamp(s / 14, .4, 1.4);
    boilSeed(key + ' trunk');
    paint(ribbon([[x, y], [x - .35 * s, y - 3.5 * s], [x + .2 * s, y - 7 * s]], 2.1 * s, 1.2 * s),
      lite ? { wash: tone(FALL.bark), ink: null } : { wash: tone(FALL.bark), fill: tone(FALL.barkDk), fillOp: 90, tex: .7, bleed: .05, ink: PAL.ink, sw });
    if (!lite) for (const [ex, ey] of [[-7, -10], [6, -11], [0, -14]])
      inkLine([[x + .2 * s, y - 6.5 * s], [x + ex * .5 * s, y + (ey * .5 - 1.5) * s], [x + ex * s, y + ey * s]], clamp(s / 9, .5, 2.4), tone(FALL.barkDk), 'ink', .5);
    const blobs = [[-7.5, -9.5, 5, 3.2], [7.5, -10, 5, 3.2], [0, -10.5, 6.5, 3.6], [-10, -13, 4.4, 3.4], [10, -13.5, 4.4, 3.4],
      [-4.8, -14.5, 6.2, 4], [4.8, -15, 6.2, 4], [0, -18, 6.6, 3.8]];
    blobs.forEach(([bx, by, rx, ry], i) => {
      boilSeed(key + ' crown' + i);
      const low = clamp((by + 19) / 10), c = LEAFC[(i + seed) % LEAFC.length], sx = sway * Math.sin(i * 1.7 + seed) * s * .25;
      const P = ellPts(x + bx * s + sx, y + by * s, rx * s, ry * s, lite ? 14 : 24, s * .45, hash(i + seed) * 3);
      paint(P, lite ? { wash: tone(mixCol(c, '#4A5526', .3 * low)), ink: null }
        : { wash: tone(mixCol(c, '#4A5526', .3 * low)), fill: tone(mixCol(c, '#3A4420', .5 * low)), fillOp: 120, bleed: .18, tex: .8, border: .6, ink: null });
    });
    if (!lite) {
      boilSeed(key + ' dabs');
      for (let i = 0; i < 22; i++) {
        const a = hash(i * 3.1 + seed) * TAU, r = Math.sqrt(hash(i * 5.7 + seed)), dx = Math.cos(a) * r * 11, dy = -14 + Math.sin(a) * r * 6;
        paint(ellPts(x + (dx + sway * .2) * s, y + dy * s, s * .7, s * .45, 8, s * .1, a), { wash: tone(mixCol(LEAFC[i % 5], '#F2E08A', .3 * (1 - r))), washOp: 230, ink: null });
      }
    }
    boilSeed(key + ' fruit');
    const n = o.apples ?? 12, ar = s * .42;
    for (let i = 0; i < n; i++) {
      const a = hash(i * 4.3 + seed * 7) * TAU, r = Math.sqrt(hash(i * 6.1 + seed)), ax = x + Math.cos(a) * r * 10 * s + sway * .2 * s, ay = y - 13.5 * s + Math.sin(a) * r * 5.2 * s;
      if (lite) paint(ellPts(ax, ay, ar, ar, 10), { wash: tone(FALL.apple), ink: null });
      else {
        paint(ellPts(ax, ay, ar, ar * .92, 12), { wash: tone(FALL.apple), ink: PAL.ink, sw: sw * .6 });
        paint(ellPts(ax - ar * .35, ay - ar * .3, ar * .28, ar * .18, 8, 0, -.6), { wash: tone(FALL.appleLt), washOp: 200, ink: null });
      }
    }
  }
  // a cheap apple for the crowns: one washed body with a thin outline, a highlight and a stem (no watercolour fill)
  function fruit(x, y, r, key, col = FALL.apple) {
    boilSeed(key);
    paint(ellPts(x, y, r, r * .92, 12), { wash: col, ink: PAL.ink, sw: clamp(r / 11, .4, 1) * .8 });
    paint(ellPts(x - r * .35, y - r * .3, r * .28, r * .18, 8, 0, -.6), { wash: FALL.appleLt, washOp: 200, ink: null });
    inkLine([[x, y - r * .8], [x + r * .1, y - r * 1.3]], clamp(r / 11, .4, 1.2), FALL.stem, 'ink', 0);
  }
  // a far slope planted in rows of little apple trees (the orchard climbing the hill behind)
  function orchardSlope(t, tone, key, x0 = -600, x1 = 3000, vis = [-1e9, 1e9]) {
    const hill = x => 700 - .1 * (x - x0) - 40 * Math.sin(x * .002 + 1);
    const P = [[x1, 1600], [x0, 1600]];
    for (let i = 0; i <= 24; i++) { const x = lerp(x0, x1, i / 24); P.push([x, hill(x)]); }
    boilSeed(key + ' hill');
    paint(P, { wash: tone('#C9B36A'), fill: tone('#A89A52'), fillOp: 60, bleed: .04, tex: .4, border: .1, ink: null, curv: .5 });
    [[40, 11, 150], [95, 14, 185], [160, 17, 225]].forEach(([dy, s, gap], row) => {
      for (let x = x0 + (row % 2) * gap / 2; x < x1; x += gap) {
        if (x < vis[0] || x > vis[1]) continue;
        const y = hill(x) + dy, h = hash(x * .013 + row);
        boilSeed(key + row + '_' + Math.round(x));
        paint(ellPts(x, y - s * .9, s * 1.25, s * .8, 12, s * .15, h), { wash: tone(mixCol(LEAFC[Math.floor(h * 5)], '#8E8A40', .2)), ink: null });
        paint(ellPts(x - s * .35, y - s * .9, s * .16, s * .16, 6), { wash: tone(FALL.apple), ink: null });
        paint(ellPts(x + s * .4, y - s * .6, s * .16, s * .16, 6), { wash: tone(FALL.apple), ink: null });
      }
    });
  }

  // ======================================================================================================
  // B1: the orchard
  // ======================================================================================================
  const U = 24, CS = 20, BS = 12, LS = 34;                     // Clawd, the cat, the basket, the red leaf
  const G1 = 880, BX = 1200, BY = G1 - 2, RIM1 = BY - 4.2 * BS; // the basket at the foot of the tree
  const TX = BX + 150, TY = G1 - 14;                            // the big apple tree
  const CXs = BX - 250;                                         // where Clawd stops (side view)
  const HAZE1 = '#F1C48E';
  // acting times, on the performed beat
  const tCatHop = AT(13, 1.62), tCatRim = AT(13, 2), tStopB = AT(13, 3.05);
  const tWind = AT(13, 3.3), tToss = AT(13, 3.62), tLeafIn = AT(13, 4.2);
  const tStep = AT(13, 4.15), tCatOff = AT(13, 4.3), tCatDown = AT(13, 4.7), tTurnB = AT(13, 4.45), tGrab = AT(13, 4.85);
  const tLift = T14, tLookUp = AT(14, 1.4), tReach = AT(14, 1.55), tHold = AT(14, 1.88);
  const tTug1 = AT(14, 2), tTug2 = AT(14, 3), tPop = AT(14, 4), tInB = AT(14, 4.6);
  const tDown0 = AT(15, 1.05), tDown1 = AT(15, 1.5);
  const tSpot = AT(15, 1.4), tCrouch = AT(15, 1.8), tBat = AT(15, 2.15), tRollEnd = AT(15, 2.8), tLaugh = AT(15, 3), tSitUp = AT(15, 3.2);
  const tUpEyes = AT(16, 1.45), tUpBody = AT(16, 1.8), tWonder = AT(16, 2.2), tGlint = AT(16, 3), tDet = AT(16, 4);

  // Clawd's feet: the trot in (eased to a stop), then two steps up to the basket
  const TROT = [[T13, 1.3], [tStopB - .7, 1.3], [tStopB, 0]];
  const STEP = [[tStep, 0], [tStep + .12, 2.6], [tStep + .3, 2.6], [tStep + .42, 0]];
  const trotS = t => integ(t, TROT), stepS = t => integ(t, STEP), TROT_END = trotS(tStopB);
  const X1 = t => CXs - 4 * U * (TROT_END - trotS(Math.min(t, tStopB))) + 4 * U * stepS(t);
  const CXf = X1(tStep + 1);                                    // where Clawd stands facing us
  const TUG = armPt(CXf, G1, U, { view: 'front', aL: 1.2 }, 'L');   // the apple on the low bough, at the raised hand
  const PERFECT = [TX - 70, G1 - 13 * U];                       // the one perfect apple, high up
  const WF = [BX + 92, G1 + 40];                                // the windfall the cat bats

  const EMO1 = [[0, 'happy'], [tStopB - .25, 'hopeful', { lookX: .6, lookY: -.4 }], [tToss + .2, 'happy', { lookX: .9, lookY: .5 }],
    [tLift - .05, 'determined', { lookX: .6, lookY: .2 }], [tLift + .5, 'happy', { lookX: .3 }],
    [tLookUp, 'neutral', { eyes: 'look', lookX: -.75, lookY: -1 }], [tTug1 - .08, 'determined', { lookX: -.7, lookY: -1 }],
    [tPop, 'surprised', { lookX: -.3, lookY: -1 }], [tInB + .05, 'excited', { lookX: .8, lookY: .1 }],
    [tDown1, 'happy', { lookX: .5, lookY: .3 }], [tBat + .15, 'neutral', { eyes: 'look', lookX: .8, lookY: .6 }],
    [tLaugh, 'laugh'], [AT(16, 1.05), 'happy', { lookX: .4 }], [tUpEyes, 'neutral', { eyes: 'look', lookX: .45, lookY: -1 }],
    [tWonder, 'hopeful', { eyes: 'shine', mouth: 'o', lookX: .45, lookY: -1 }], [tDet, 'determined', { lookX: .5, lookY: -1 }]];

  // squash for one tug: a quick pull that peaks just after t0 and lets go
  const tug = (t, t0, a) => a * Math.max(0, easeOut(seg(t, t0 - .12, t0 + .06)) - ease(seg(t, t0 + .14, t0 + .4)));
  function pose1(t) {
    const cl = emotions(t, EMO1, { take: .8 });
    const o = { ...cl, hat: 'beanie', boilKey: 'B1clawd' };
    const x = X1(t), ph = trotS(t) + stepS(t) + .15;
    const rate = (trotS(t + .03) + stepS(t + .03) - trotS(t - .03) - stepS(t - .03)) / .06, mv = clamp(rate / 1.3);
    let hold = null;
    if (t < tTurnB) {                                              // side view: the trot in, the stop, the flick
      Object.assign(o, { view: 'side', flip: false, walk: ph, smear: 0 });
      o.dy = -.34 * mv * Math.abs(Math.cos(ph * TAU)) + (cl.dy || 0) * .3;
      o.rot = -.04 * mv + (cl.rot || 0) * .3 - .09 * ease(seg(t, tWind, tToss)) * (1 - ease(seg(t, tToss, tToss + .15))) + .1 * Math.sin(Math.PI * seg(t, tToss, tToss + .5));
      let aL = .5 + .06 * Math.sin(t * 5);
      aL = lerp(aL, 1.15, ease(seg(t, tWind, tToss)));             // wind-up
      aL = lerp(aL, .15, easeOut(seg(t, tToss, tToss + .14)));     // the flick
      aL = lerp(aL, .4, ease(seg(t, tToss + .35, tToss + .7)));
      o.aL = aL;
      if (t < tToss + .07) hold = 'L';
    } else {                                                       // facing us: the basket, the tugs, the laugh, the look up
      Object.assign(o, turn(t, tTurnB, tTurnB + .16, .25, 0));
      if (t < tStep + .42) o.walk = ph;
      let aR = lerp(.3, .26, ease(seg(t, tTurnB + .1, tGrab)));
      aR = lerp(aR, .8, backOut(seg(t, tLift + .1, tLift + .5)));
      aR = lerp(aR, .26, ease(seg(t, tDown0, tDown1)));
      aR -= .07 * spring(t, tInB, 6, 14);
      aR = lerp(aR, cl.aR ?? .2, ease(seg(t, tDown1 + .15, tDown1 + .6)));
      let aL = cl.aL ?? .2;
      aL = lerp(aL, 1.2, ease(seg(t, tReach, tHold)) * (1 - ease(seg(t, tPop + .35, tPop + .85))));
      if (t > tPop) aL += .3 * Math.sin(Math.PI * seg(t, tPop, tPop + .4));   // the arm flies up as the apple lets go
      o.aL = aL; o.aR = aR;
      // the strain: the lift, then each tug squashes Clawd down and leans away from the bough
      const pull = tug(t, tTug1, .05) + tug(t, tTug2, .08) + (t < tPop ? .12 * easeIn(seg(t, tPop - .6, tPop)) : 0);
      const strain = .08 * Math.sin(Math.PI * seg(t, tLift, tLift + .4));
      o.sq = (cl.sq || 0) * (t > tHold && t < tPop ? .2 : 1) + pull + strain;
      o.dy = (cl.dy || 0) * (t > tHold && t < tPop + .6 ? .2 : 1) + .4 * pull;
      o.rot = (cl.rot || 0) * (t > tHold && t < tPop ? .2 : 1) + .9 * pull - .12 * spring(t, tPop, 4, 11);
      if (t > tHold && t < tPop) o.dx = .2 * Math.sin(t * 43) * pull;   // it trembles
      if (t > tUpBody) o.rot = (o.rot || 0) - .06 * ease(seg(t, tUpBody, tUpBody + .5));   // leans back to look up
    }
    return { x, o, hold };
  }

  // the basket: on the ground, then hanging from Clawd's right hand (it swings about the handle), then set down again
  let BREST = BX;
  function basket1(t, P) {
    if (t < tLift) return { x: BX, y: BY, rot: 0, held: false };
    if (t > tDown1 + .02) return { x: BREST, y: BY, rot: 0, held: false };
    const [hx, hy] = armPt(P.x, G1, U, P.o, 'R'), k = ease(seg(t, tLift, tLift + .12));
    const rot = .1 * spring(t, tLift + .4, 5, 9) - .09 * spring(t, tInB, 5, 11) + .03 * Math.sin(t * 2.1) * k;
    return { x: lerp(BX, hx, k), y: lerp(BY, hy + 9.6 * BS, k), rot: rot * k, held: true, hx, hy };
  }
  function drawBasket1(t, B) {
    const o = { key: 'B1basket', apples: t < tInB ? 4 : 5, leaf: t >= tLeafIn };
    if (!B.held) { basket(B.x, B.y, BS, o); return; }
    push(); translate(B.hx, B.hy); rotate(B.rot); translate(-B.hx, -B.hy); basket(B.x, B.y, BS, o); pop();
  }

  // the cat in B1: trots in, hops onto the rim, sits; hops down onto the grass; the windfall; aloof; looks up with Clawd
  const CAT_RIM = [BX - 40, RIM1 + 3], CAT_G = [BX + 150, G1 + 6];
  function cat1(t) {
    const base = { boilKey: 'B1cat' };
    const squash = t0 => Math.sin(Math.PI * seg(t, t0 - .12, t0)) * .1, settle = t0 => spring(t, t0, 8, 20) * .9;
    if (t < tCatHop) {
      const k = seg(t, T13, tCatHop), x = lerp(BX - 110, BX - 78, easeOut(k)), cr = seg(t, tCatHop - .16, tCatHop);
      return { x, y: G1 + 2, o: { ...base, pose: cr > .3 ? 'crouch' : 'walk', walk: (x - BX) / (2.9 * CS), tailUp: .85 * (1 - cr), tail: .3 * Math.sin(t * 4), ears: .6 } };
    }
    if (t < tCatRim) {
      const k = seg(t, tCatHop, tCatRim), p = arcPt([BX - 78, G1 + 2], CAT_RIM, 70, k);
      return { x: p[0], y: p[1], o: { ...base, pose: 'pounce', rot: lerp(-.3, .15, k), ears: .8, noShadow: true } };
    }
    if (t < tCatOff) {   // on the rim, facing us
      const land = settle(tCatRim), pre = squash(tCatOff);
      let look = [-.85, .15];
      if (t > tToss) look = [lerp(-.85, .55, ease(seg(t, tToss, tToss + .3))), lerp(.15, .8, ease(seg(t, tToss + .1, tLeafIn)))];
      const sniff = .12 * Math.sin(Math.PI * seg(t, tLeafIn - .05, tLeafIn + .3));
      return { x: CAT_RIM[0], y: CAT_RIM[1], o: { ...base, pose: 'sit', sy: 1 - .12 * land - pre, sx: 1 + .08 * land + pre * .6, dy: sniff, look, pupil: .35,
        blink: 1 - Math.sin(Math.PI * seg(t, AT(13, 2.9), AT(13, 3.35))) * .95, ears: .5 + .3 * Math.sin(t * 1.7), tail: .8 * Math.sin(t * 1.3), noShadow: true } };
    }
    if (t < tCatDown) {
      const k = seg(t, tCatOff, tCatDown), p = arcPt(CAT_RIM, CAT_G, 55, k);
      return { x: p[0], y: p[1], o: { ...base, pose: 'pounce', rot: lerp(-.25, .2, k), ears: .2, noShadow: k < .8 } };
    }
    // on the grass
    const land = settle(tCatDown), inB = seg(t, tPop, tInB);
    if (t >= tCrouch && t < tSitUp) {   // stalk, bat, watch it roll
      const lunge = Math.sin(Math.PI * seg(t, tBat - .06, tBat + .2)), pre = squash(tSitUp);
      return { x: CAT_G[0] - 26 * lunge, y: CAT_G[1], o: { ...base, pose: lunge > .35 ? 'pounce' : 'crouch', flip: true, dy: -.25 * lunge, pupil: .95, ears: 1,
        rot: .04 * Math.sin(t * 22) * (t < tBat - .1 ? 1 : 0), tail: .7 * Math.sin(t * 9), look: [.6, .4], sy: 1 - pre, sx: 1 + pre * .6 } };
    }
    let look = [-.9, -.3], eyes = 'open', pupil = .3, ears = .5 + .25 * Math.sin(t * 1.3);
    if (t > tPop && t < tInB + .5) look = [lerp(-.6, -.2, inB), lerp(-1, .1, inB)];
    if (t > tSpot && t < tCrouch) { look = [-.8, .8]; ears = 1; pupil = .8; }
    if (t >= tSitUp) { look = [.95, -.25]; eyes = t < AT(16, 1.8) ? 'half' : 'open'; pupil = .3; }   // aloof: "I meant to do that"
    if (t > tWonder) { look = [-.3, -1]; pupil = .7; ears = .9; }
    const sb = 1 - Math.sin(Math.PI * seg(t, AT(15, 4.2), AT(15, 4.75))) * .95;
    return { x: CAT_G[0], y: CAT_G[1], o: { ...base, pose: 'sit', look, eyes, pupil, ears, blink: sb, sy: 1 - .12 * land - squash(tCrouch), sx: 1 + .08 * land,
      tail: t >= tSitUp ? 1.2 * spring(t, tSitUp + .4, 4, 13) + .3 * Math.sin(t * 1.4) : .5 * Math.sin(t * 1.1) } };
  }

  // the tug apple: hanging on the low bough, held (pulled down with the hand), then POP: it flies into the basket
  function tugApple(t, P) {
    if (t < tHold) return { x: TUG[0] + 2 * Math.sin(t * 1.6), y: TUG[1], rot: .1 * Math.sin(t * 1.3), bend: 0 };
    if (t < tPop) { const [hx, hy] = armPt(P.x, G1, U, P.o, 'L'); return { x: hx, y: hy, rot: 0, bend: hy - TUG[1] }; }
    const P0 = pose1(tPop), [px, py] = armPt(P0.x, G1, U, P0.o, 'L'), a = t - tPop, bend0 = py - TUG[1];
    const bend = bend0 * Math.exp(-4.5 * a) * Math.cos(13 * a);
    if (t >= tInB) return { gone: true, bend };
    const P1 = pose1(tInB), B1 = basket1(tInB, P1), k = seg(t, tPop, tInB);
    const [x, y] = arcPt([px, py], [B1.x + .8 * BS, B1.y - 4.9 * BS], 190, k);
    return { x, y, rot: 7 * k, bend };
  }

  // the big apple tree: trunk, limbs, crown masses, dabs, then the apples. bend (px) pulls the low bough down.
  const BIG = [[-470, -250, 205, 95], [-250, -330, 230, 130], [20, -370, 225, 140], [235, -320, 170, 110], [-420, -470, 205, 130],
    [-130, -545, 250, 150], [175, -505, 190, 130], [-300, -660, 195, 120], [30, -700, 215, 125]];
  const BIGAPPLES = [[-560, -215], [-345, -205], [-250, -262], [-150, -238], [-35, -268], [95, -250], [205, -262], [300, -290],
    [-470, -392], [-265, -432], [115, -425], [-110, -475], [245, -430], [-360, -565], [-10, -610], [160, -585], [-560, -300]];
  function bigTree(t, bend, sway) {
    const bendAt = dx => bend * clamp((-dx - 150) / 330);
    boilSeed('B1trunk');
    paint(ribbon([[TX + 10, TY + 6], [TX - 14, TY - 150], [TX - 55, TY - 300]], 74, 44), { wash: FALL.bark, fill: FALL.barkDk, fillOp: 100, tex: .7, bleed: .05, ink: PAL.ink, sw: 1.3 });
    boilSeed('B1limbs');
    paint(ribbon([[TX - 50, TY - 270], [TX - 250, TY - 245 + bendAt(-250) * .6], [TX - 470, TY - 205 + bendAt(-470)], [TX - 600, TY - 215 + bendAt(-600)]], 30, 12), { wash: FALL.bark, fill: FALL.barkDk, fillOp: 80, tex: .6, ink: PAL.ink, sw: .9 });
    for (const [ex, ey, w] of [[200, -330, 22], [-130, -520, 22], [60, -620, 16], [-330, -440, 16]])
      paint(ribbon([[TX - 50, TY - 280], [TX + ex * .5 - 30, TY + ey * .55 - 120], [TX + ex, TY + ey]], w, w * .4), { wash: FALL.bark, ink: PAL.ink, sw: .8 });
    BIG.forEach(([bx, by, rx, ry], i) => {
      boilSeed('B1crown' + i);
      const low = clamp((by + 560) / 330), c = LEAFC[(i + 2) % 5], sx = sway * Math.sin(i * 1.7) * 6;
      paint(ellPts(TX + bx + sx, TY + by + bendAt(bx), rx, ry, 26, 12, hash(i + 4) * 3),
        { wash: mixCol(c, '#4A5526', .32 * low), fill: mixCol(c, '#3A4420', .5 * low), fillOp: 120, bleed: .18, tex: .8, border: .6, ink: null });
    });
    boilSeed('B1dabs');
    for (let i = 0; i < 26; i++) {
      const bx = -680 + 1060 * hash(i * 3.1 + 2), by = -760 + 560 * hash(i * 5.7 + 1), lit = clamp((bx + 200) / 500) * clamp((-by - 250) / 400);
      paint(ellPts(TX + bx + sway * 4, TY + by + bendAt(bx) * .8, 15, 10, 8, 2, hash(i) * 3), { wash: mixCol(LEAFC[i % 5], '#F6D98A', .45 * lit), washOp: 230, ink: null });
    }
    BIGAPPLES.forEach(([ax, ay], i) => fruit(TX + ax + sway * 3, TY + ay + bendAt(ax), 11 + 2 * hash(i + 3), 'B1ap' + i));
  }
  // the one perfect apple: a little bigger, and the low sun catches it
  function perfectApple(t, key = 'B1perfect') {
    const [x, y] = PERFECT, g = ease(seg(t, tGlint - .1, tGlint + .3)) * (1 - .5 * seg(t, tGlint + .8, T17));
    if (g > 0) glow(x, y, 70 + 40 * g, '#FFD68A', .9 * g);
    apple(x, y + 2 * Math.sin(t * 1.4), 15, { key, rot: .08 * Math.sin(t * 1.1) });
    if (t > tGlint - .05) {
      const k = seg(t, tGlint - .05, tGlint + .9), s = 26 * Math.sin(Math.PI * k);
      boilSeed(key + ' glint');
      if (s > 1) paint(starPts(x - 5, y - 6, s, .2, 4, k * .8), { wash: '#FFF6DC', ink: null });
      sparkle(x - 5, y - 6, t, tGlint, key + ' sp', 5, 14, 46);
    }
  }

  const C1R = { x: BX - 110, y: 515 };
  function cam1(t) {
    const k = seg(t, T13, T13 + .7), land = 350 * (1 - Math.pow(1 - k, 3)) - 350;   // the whip pan lands: 1500 px/s → rest
    const up = ease(seg(t, tUpBody - .1, T17 - .1));
    return { x: C1R.x + land + 12 * Math.sin(t * .37) + 70 * up, y: C1R.y + 3 * Math.sin(t * .5), ty: -150 * up, z: lerp(1.09, 1.13, seg(t, T13, T16)) + .07 * up, rx: 960, ry: 540 };
  }
  function set1(C, t, sway) {
    inLayer(C, .06, () => {
      skyCheap('gold', 'amber', lerp(.55, .85, seg(t, T13, T17)), visX(C, .06, 0), -250, 1000, 'B1sky');
      sunDisc(1560, 455, 48, 1, 'B1sun');
      clouds(t, { key: 'B1cl', y: 140, n: 3, x0: -300, x1: 2500, spread: 110, scale: .9, speed: 6, col: '#F6DCC0', op: 170, seed: 11 });
    });
    inLayer(C, .25, () => orchardSlope(t, c => mixCol(c, HAZE1, .45), 'B1far', -600, 3000, visX(C, .25, 60)));
    inLayer(C, .5, () => {
      boilSeed('B1meadow');
      const v = visX(C, .5, 60);
      paint(rectPts(v[0], 745, v[1] - v[0], 420), { wash: mixCol(FALL.grass, HAZE1, .3), fill: mixCol(FALL.grassDk, HAZE1, .3), fillOp: 55, bleed: .02, tex: .5, border: .15, ink: null });
      const tone = c => mixCol(c, HAZE1, .35);
      appleTree(-60, 790, 13, { key: 'B1m1', seed: 2, lite: true, tone, sway: sway * .4, apples: 10 });
      appleTree(560, 776, 10, { key: 'B1m2', seed: 4, lite: true, tone, sway: sway * .4, apples: 8 });
      appleTree(2080, 784, 12, { key: 'B1m3', seed: 3, lite: true, tone, sway: sway * .4, apples: 9 });
    });
    inLayer(C, 1, () => {
      boilSeed('B1ground');
      const v = visX(C, 1, 60);
      paint(rectPts(v[0], 790, v[1] - v[0], 380), { wash: FALL.grass, fill: FALL.grassDk, fillOp: 70, bleed: .02, tex: .6, border: .15, ink: null });
      boilSeed('B1shade');   // the tree's shadow pool on the grass
      paint(ellPts(TX - 150, G1 - 4, 520, 44, 26, 8), { fill: '#6E5A3A', fillOp: 70, bleed: .2, tex: .4, border: .2, ink: null });
      tufts(-400, 3000, 812, 44, 7, mixCol(FALL.grassDk, PAL.ink, .15), t, 0, 20, visX(C, 1));
    });
  }
  function shotB1(t, lt, dur) {
    const C = cam1(t), sway = .4 * Math.sin(t * 1.05);
    set1(C, t, sway);
    const P = pose1(t), B = basket1(t, P), A = tugApple(t, P);
    inLayer(C, 1, () => {
      bigTree(t, A.bend || 0, sway);
      perfectApple(t);
      if (!A.gone && t < tPop) { boilSeed('B1twig'); inkLine([[TUG[0] + 14, TUG[1] - 46 + .35 * A.bend], [lerp(TUG[0] + 8, A.x, .5), lerp(TUG[1] - 30, A.y - 16, .5)], [A.x + 1, A.y - 15]], 2.2, FALL.barkDk, 'ink', .4); }
      if (!A.gone) apple(A.x, A.y, 15, { key: 'B1tug', rot: A.rot });
      apple(BX - 390, G1 + 16, 11, { key: 'B1wf2', rot: .6, noLeaf: true });
      if (B.held) drawBasket1(t, B);                                // hanging: behind the arm that holds it
      else drawBasket1(t, B);
      const c = cat1(t);
      if (c.y < G1) cat(c.x, c.y, CS, c.o);
      clawd(P.x, G1, U, P.o);
      if (c.y >= G1) cat(c.x, c.y, CS, c.o);
      // the windfall: batted by the cat, it rolls to Clawd's feet and bumps them
      const rk = seg(t, tBat, tRollEnd), stopX = P.x + 4.2 * U + 14, rx = lerp(WF[0], stopX, easeOut(rk)) + 7 * spring(t, tRollEnd, 7, 16);
      apple(rx, WF[1] - 14, 14, { key: 'B1wf', rot: (rx - WF[0]) / 14 + .3, noLeaf: true });
      // the red leaf: held on the arm tip, then flicked into the basket
      if (P.hold) {
        const [hx, hy] = armPt(P.x, G1, U, P.o, 'L'), r = .55 + .05 * Math.sin(t * 2.3), [cx, cy] = stemAt([hx, hy], LS, r);
        boilSeed('B1red'); redLeaf(cx, cy, LS, r);
      } else if (t < tLeafIn) {
        const P0 = pose1(tToss + .07), [hx, hy] = armPt(P0.x, G1, U, P0.o, 'L'), [cx, cy] = stemAt([hx, hy], LS, .55);
        const k = seg(t, tToss + .07, tLeafIn), q = ease(k), [x, y] = arcPt([cx, cy], [BX + 2.2 * BS, RIM1 - 1.3 * BS], 70, q);
        boilSeed('B1red'); redLeaf(x + 10 * Math.sin(k * 9), y, lerp(LS, 1.6 * BS, q), lerp(.55, .5, q) + .6 * Math.sin(k * 7) * (1 - k), { spin: lerp(Math.cos(k * 11), 1, q * q) });
      }
      if (!A.gone && t >= tPop) { sparkle(A.x, A.y, t, tPop, 'B1pop', 5, 12, 40); }
      if (t > tPop - .05 && t < tPop + 1.6) {   // two leaves shaken off the bough
        for (let i = 0; i < 2; i++) {
          const a = t - tPop - i * .15; if (a < 0) continue;
          boilSeed('B1shake' + i);
          leaf(TUG[0] + 40 - i * 70 + 30 * Math.sin(a * 3 + i), TUG[1] - 20 + 120 * a, 11, a * 3 + i, i ? FALL.gold : FALL.olive, { spin: Math.cos(a * 5 + i) });
        }
      }
    });
    inLayer(C, 1.3, () => {
      leafField(t, { key: 'B1lf', n: 4, seed: 31, y0: -300, y1: 1300, x0: 0, x1: 3000, size: [12, 15], fall: [60, 90], cols: [FALL.gold, FALL.olive, FALL.amber], wind: 16 });
      tufts(-800, 3600, 1085, 50, 17, mixCol(FALL.grassDk, PAL.ink, .3), t, 0, 44, visX(C, 1.3));
    });
    if (t < T13 + .35) whip(.5 + .5 * ease(seg(t, T13, T13 + .35)));
  }
  { const P = pose1(tDown1 + .01); BREST = armPt(P.x, G1, U, P.o, 'R')[0]; }

  // ======================================================================================================
  // B2: a low angle up the tree
  // ======================================================================================================
  const U2 = 26, CS2 = 21, BS2 = 13, G2 = 1000, X2 = 760;
  const RTIP = armPt(X2, G2, U2, { view: 'front', aR: 1.5 }, 'R');
  const APPLE2 = [RTIP[0] + 4, G2 - 12.1 * U2];                 // the perfect apple, right over the reaching hand
  const TWIG2 = [APPLE2[0] + 6, APPLE2[1] - 52];
  const tTip0 = AT(17, 1.25), tTip1 = AT(17, 1.9), tTipEnd = AT(17, 3.3), tSag = AT(17, 3.55), tRe = AT(17, 4.5);
  const tHop0 = T18 + .05, tHop1 = AT(18, 1.8), tHopTop = (tHop0 + tHop1) / 2, tFume = AT(18, 2.4);
  const tCr0 = AT(19, 1.2), tLaunch = AT(19, 2.4), tGrab2 = AT(19, 3), tLand2 = 2 * tGrab2 - tLaunch, tProud = AT(19, 3.95);
  const tSurp = AT(20, 1.3), tLook = AT(20, 1.9), tTilt0 = AT(20, 2.3);
  const EMO2 = [[0, 'determined', { lookX: .5, lookY: -1 }], [tSag, 'thinking', { lookX: .45, lookY: -1 }], [tRe, 'determined', { lookX: .5, lookY: -1 }],
    [tHopTop + .45, 'angry', { lookX: .45, lookY: -1, emote: 'anger' }], [AT(19, 1), 'determined', { lookX: .5, lookY: -1 }],
    [tGrab2, 'excited', { lookX: .5, lookY: -.6 }], [tProud, 'proud'], [T20 + .08, 'surprised', { lookX: 0, lookY: -.2 }],
    [tLook, 'nervous', { lookX: .15, lookY: -1, emote: 'sweat' }]];
  function pose2(t) {
    const cl = emotions(t, EMO2, { take: .8 });
    const o = { ...cl, view: 'front', hat: 'beanie', boilKey: 'B2clawd' };
    const tip = ease(seg(t, tTip0, tTip1)) * (1 - ease(seg(t, tTipEnd, tSag + .1)));
    const hop = jump(t, tHop0, tHop1, 4.3), big = jump(t, tLaunch, tLand2, 5.5);
    const crouch = ease(seg(t, tCr0, tLaunch - .08)) * (1 - seg(t, tLaunch - .08, tLaunch));
    const inAir = (t > tHop0 && t < tHop1) || (t > tLaunch && t < tLand2);
    const reach = Math.max(tip, inAir ? 1 : 0, ease(seg(t, tRe, tHop0)) * (t < tHop1 ? 1 : 0));
    o.dy = (cl.dy || 0) * (1 - reach) - .3 * tip + hop.dy + big.dy + .25 * crouch;
    o.sq = (cl.sq || 0) * (1 - reach) - .16 * tip + hop.sq + big.sq + .3 * crouch - .1 * Math.sin(Math.PI * seg(t, tHop0, tHop1)) - .14 * Math.sin(Math.PI * seg(t, tLaunch, tLand2));
    o.dx = .05 * Math.sin(t * 38) * tip;
    let aR = lerp(cl.aR ?? .2, 1.5, reach), aL = lerp(cl.aL ?? .2, 1.25, reach);
    aR = lerp(aR, -.9, crouch); aL = lerp(aL, -.9, crouch);
    if (t > tGrab2) { aR = lerp(1.5, 1.2, ease(seg(t, tGrab2, tProud))); aL = lerp(1.4, cl.aL ?? -.9, ease(seg(t, tGrab2 + .2, tProud + .3))); }
    if (t > tProud) aR = lerp(1.2 + .05 * Math.sin(t * 3), .45, ease(seg(t, T20 + .5, tLook)));
    o.aR = aR; o.aL = aL;
    o.lookX = lerp(o.lookX ?? 0, .5, reach); o.lookY = lerp(o.lookY ?? 0, -1, reach);
    if (t > tProud - .2 && t < T20 + .3) { o.tint = 'gold'; o.tintK = .55 * ease(seg(t, tProud - .2, tProud + .3)) * (1 - seg(t, T20, T20 + .3)); delete o.col; delete o.dk; delete o.lt; }
    return { x: X2, o, air: inAir };
  }
  function apple2(t, P) {   // hanging (swinging after the brush), then in the hand
    if (t < tGrab2) {
      const sw = .55 * spring(t, tHopTop, 3.2, 7.5) + .04 * Math.sin(t * 1.3), L = 52;
      return { x: TWIG2[0] + Math.sin(sw) * L - 6, y: TWIG2[1] + Math.cos(sw) * L, rot: sw, twig: true };
    }
    const [hx, hy] = armPt(P.x, G2, U2, P.o, 'R');
    return { x: hx, y: hy - 6, rot: .2, twig: false };
  }
  // the grey deck of cloud that the camera tilts up into (B2) and down out of (B3): the same painting in both shots
  function greyDeck(t, base, key) {
    boilSeed(key + ' deck');
    paint(rectPts(-600, -3200, 3200, 3200 + base - 60), { wash: '#6E7688', fill: '#5B6374', fillOp: 90, bleed: .1, tex: .5, border: .2, ink: null });
    for (let i = 0; i < 9; i++) {   // the billowing underside, lit a little from below
      const x = -500 + i * 330 + 40 * Math.sin(t * .2 + i), y = base - 40 + 30 * hash(i + 3);
      boilSeed(key + ' belly' + i);
      paint(ellPts(x, y, 230 + 60 * hash(i), 110 + 30 * hash(i + 1), 22, 10), { wash: mixCol('#7B8396', '#8E95A6', hash(i + 5)), fill: '#5E6678', fillOp: 90, bleed: .2, tex: .5, ink: null });
    }
    for (let i = 0; i < 7; i++) {   // darker masses inside the deck, for texture during the tilt
      const x = -300 + i * 420 + 60 * hash(i + 11), y = base - 500 - 700 * hash(i + 13);
      boilSeed(key + ' mass' + i);
      paint(ellPts(x, y, 380, 200, 20, 20), { fill: mixCol('#56607A', '#707A8E', hash(i + 17)), fillOp: 110, bleed: .3, tex: .5, border: .3, ink: null });
    }
  }
  const DECK_BASE = 60;
  function cam2(t) {
    const follow = Math.sin(Math.PI * seg(t, tLaunch - .15, tLand2 + .3));
    const tilt = t > tTilt0 ? -1750 * (1 - Math.pow(1 - ease(seg(t, tTilt0, T21)), 1.6)) : 0;
    return { x: 960 + 10 * Math.sin(t * .31), y: 540 - 60 * follow, ty: tilt, z: lerp(1, 1.06, seg(t, T17, T20)) + .03 * follow, rx: 960, ry: 540 };
  }
  function shotB2(t, lt, dur) {
    const C = cam2(t), dim = ease(seg(t, T17 + .5, T20 + .3)), sway = .4 * Math.sin(t * 1.05) * (1 + dim);
    const tone = c => mixCol(c, '#6F7A8E', .38 * dim);
    inLayer(C, .1, () => {
      skyCheap('amber', 'storm', dim, visX(C, .1, 0), -300, 1000, 'B2sky');
      const sunA = 1 - ease(seg(t, T18 + .6, T20 - .3));
      sunDisc(560, 230, 46, sunA, 'B2sun');
      // the cloud bank slides in from the right over the sun
      const cx = lerp(1900, 420, ease(seg(t, T17, T20)));
      for (let i = 0; i < 6; i++) {
        boilSeed('B2bank' + i);
        paint(ellPts(cx + i * 190 - 80 * hash(i), 230 + 70 * Math.sin(i * 1.9), 200 + 50 * hash(i + 2), 105 + 25 * hash(i + 4), 22, 10),
          { wash: mixCol('#9AA0AE', '#7C8597', hash(i + 6)), fill: '#6F788A', fillOp: 80, bleed: .2, tex: .45, ink: null });
      }
      greyDeck(t, lerp(-260, DECK_BASE, ease(seg(t, T17, T20 + 1))), 'B2');
    });
    inLayer(C, .35, () => {
      boilSeed('B2hill');
      paint([[-500, 960], [300, 935], [1100, 948], [1900, 925], [2600, 945], [2600, 1400], [-500, 1400]], { wash: tone(mixCol('#B9A866', HAZE1, .4)), ink: null, curv: .5 });
    });
    const P = pose2(t), A = apple2(t, P);
    inLayer(C, 1, () => {
      boilSeed('B2ground');
      paint(rectPts(-600, 985, 3200, 600), { wash: tone(FALL.grass), fill: tone(FALL.grassDk), fillOp: 70, bleed: .02, tex: .6, border: .15, ink: null });
      // the trunk, wide at the foot and narrowing as it climbs (the low angle), then the bough that holds the apple
      boilSeed('B2trunk');
      paint(ribbon([[1390, 1020], [1350, 700], [1300, 380], [1270, -400]], 150, 60), { wash: tone(FALL.bark), fill: tone(FALL.barkDk), fillOp: 110, tex: .75, bleed: .05, ink: PAL.ink, sw: 1.4 });
      boilSeed('B2bough');
      const bend = t > tGrab2 ? -22 * Math.exp(-5 * (t - tGrab2)) * Math.cos(12 * (t - tGrab2)) : 0;
      paint(ribbon([[1300, 520], [1100, 560], [TWIG2[0] + 40, TWIG2[1] - 20 + bend], [TWIG2[0] - 180, TWIG2[1] - 60 + bend]], 34, 10), { wash: tone(FALL.bark), fill: tone(FALL.barkDk), fillOp: 90, tex: .6, ink: PAL.ink, sw: 1 });
      // the crown seen from below: dark, backlit masses with sky between
      const M = [[180, 120, 300, 170], [620, 40, 330, 150], [1000, 120, 300, 190], [1450, 180, 330, 210], [1800, 60, 280, 200], [760, 330, 230, 110],
        [1150, 400, 240, 120], [400, 330, 210, 100], [1650, 420, 230, 120], [980, 520, 170, 70], [1300, -250, 380, 220], [500, -300, 360, 200]];
      M.forEach(([x, y, rx, ry], i) => {
        boilSeed('B2mass' + i);
        const c = LEAFC[i % 5];
        paint(ellPts(x + sway * 8 * Math.sin(i), y, rx, ry, 24, 14, hash(i) * 3), { wash: tone(mixCol(c, '#39401E', .45)), fill: tone(mixCol(c, '#262B14', .5)), fillOp: 110, bleed: .15, tex: .8, border: .6, ink: null });
      });
      boilSeed('B2rim');   // warm rim light along the lower edges while the sun is out
      for (let i = 0; i < 18; i++) {
        const x = 150 + 1700 * hash(i * 3.3), y = 250 + 300 * hash(i * 5.1);
        paint(ellPts(x, y, 16, 10, 8, 2, hash(i) * 3), { wash: mixCol(tone('#E8C46A'), '#8C8A5E', dim), washOp: 220, ink: null });
      }
      [[330, 470], [560, 430], [1120, 480], [1520, 500], [1700, 330], [260, 300], [1380, 330], [820, 250]].forEach(([x, y], i) => apple(x, y + sway * 3, 13, { key: 'B2ap' + i, noLeaf: i % 2 > 0, col: tone(FALL.apple) }));
      // the twig and the perfect apple
      if (A.twig) { boilSeed('B2twig'); inkLine([[TWIG2[0], TWIG2[1] + bend], [A.x + 2, A.y - 16]], 1.6, FALL.stem, 'ink', .3); }
      if (A.twig && t < tGrab2) {
        const g = 1 - dim * .7;
        glow(A.x, A.y, 60, '#FFD68A', .6 * g);
      }
      // the basket and the cat, watching from the foot of the trunk
      basket(1170, G2 + 6, BS2, { key: 'B2basket', apples: 5, leaf: true });
      const hopWatch = Math.max(Math.sin(Math.PI * seg(t, tHop0, tHop1)), Math.sin(Math.PI * seg(t, tLaunch, tLand2)));
      const flinch = seg(t, T20 + .15, T20 + .4);
      cat(1300, G2 + 10, CS2, { pose: 'sit', look: [-.8, lerp(-.2, -1, hopWatch)], pupil: .5 + .4 * hopWatch, ears: lerp(.6, -1, flinch), eyes: flinch > .5 ? 'half' : 'open',
        tail: .5 * Math.sin(t * 1.2), sy: 1 - .06 * flinch, boilKey: 'B2cat', wet: .3 * seg(t, T20, T21) });
      clawd(P.x, G2, U2, P.o);
      apple(A.x, A.y, 15, { key: 'B2perfect', rot: A.rot });
      if (t > tGrab2) sparkle(A.x, A.y, t, tGrab2, 'B2grab', 7, 20, 70);
      if (t < tHopTop + .6) sparkle(APPLE2[0], APPLE2[1] + 14, t, tHopTop, 'B2brush', 4, 10, 30);
      // the raindrop: it falls onto Clawd's nose on bar 20 and splashes
      const nose = bodyPt(P.x, G2, U2, P.o, 0, -4.9);
      if (t > T20 - .35 && t < T20) {
        const k = seg(t, T20 - .35, T20), y = lerp(nose[1] - 600, nose[1], k * k);
        boilSeed('B2drop'); paint(through([[nose[0], y - 16], [nose[0] + 5, y - 2], [nose[0], y + 4], [nose[0] - 5, y - 2]], 4), { wash: '#C9D6E6', ink: PAL.ink, sw: .6 });
      }
      if (t >= T20 && t < T20 + .45) {
        const k = seg(t, T20, T20 + .45);
        boilSeed('B2splash');
        for (let i = 0; i < 5; i++) { const a = -Math.PI * (.15 + .7 * i / 4), d = 8 + 34 * easeOut(k); paint(ellPts(nose[0] + Math.cos(a) * d, nose[1] + Math.sin(a) * d * .8 + 30 * k * k, 3.5 * (1 - k), 3.5 * (1 - k), 8), { wash: '#C9D6E6', ink: null }); }
      }
    });
    inLayer(C, 1.25, () => {
      const M = [[-60, 40, 260, 170], [1990, 110, 250, 190]];
      M.forEach(([x, y, rx, ry], i) => { boilSeed('B2near' + i); paint(ellPts(x + sway * 10, y, rx, ry, 22, 14, i), { wash: tone('#3E4622'), fill: tone('#2A3016'), fillOp: 100, bleed: .12, tex: .8, ink: null }); });
      tufts(-800, 2800, 1075, 40, 23, tone(mixCol(FALL.grassDk, PAL.ink, .3)), t, 0, 46, visX(C, 1.25));
    });
    if (t > T20 - .2) rain(t, { key: 'B2rain', k: .25 * seg(t, T20 - .2, T21) + .1, n: 160, col: '#AEBACB', seed: 5 });
  }

  // ======================================================================================================
  // B3: the rain, and the run home
  // ======================================================================================================
  const U3 = 22, CS3 = 18, BS3 = 11, LS3 = 31, G3 = 900, X3 = 760, BX3 = X3 + 175;
  const CAT3 = [BX3 + 120, G3 + 6];
  const tSettle3 = AT(21, 2.3), tShake = AT(21, 2.9), tMis = AT(21, 3.6), tSeeCat = AT(21, 4), tApIn = AT(21, 4.4);
  const tGrab3 = T22, tSwoop = AT(22, 1.45), tScoop = AT(22, 1.85), tLeafUp = AT(22, 1.95), tLeafOn = AT(22, 2.75);
  const tEars = AT(22, 3), tLove = AT(22, 3.25), tTurnR = AT(22, 4.05), tRun = AT(22, 4.45);
  const tSee3 = AT(23, 2.3), tDoor = AT(24, 1.15), tBack = AT(24, 1.55), tIn0 = AT(24, 1.9), tIn1 = AT(24, 2.8), tShut0 = AT(24, 3.05), tShut1 = AT(24, 3.6);
  const RUN = [[tRun - .1, 0], [tRun + .35, 4.2], [T24 - .4, 4.2], [T24, 0]];
  const runS = t => integ(t, RUN), RUN_END = runS(T24 + 1);
  const X3r = t => X3 + 4 * U3 * runS(t) + 30 * ease(seg(t, tGrab3, tSwoop)) * (1 - ease(seg(t, tScoop, tTurnR)));
  const DOOR = [X3 + 4 * U3 * RUN_END + 20, G3 - 30], CS_COT = 21;     // the cottage door (ground at its middle)
  const RAIN_T = c => mixCol(c, '#5D6680', .42);
  const wetK = t => ease(seg(t, T21, tSettle3 + 1));
  const EMO3 = [[0, 'nervous', { lookX: .1, lookY: -1 }], [tSettle3, 'nervous'], [tSeeCat, 'sad', { lookX: .8, lookY: .3 }],
    [tGrab3, 'determined', { lookX: .8, lookY: .3 }], [tScoop + .1, 'surprised', { lookX: .9, lookY: .1 }], [tLove, 'love', { lookX: .8, lookY: .1 }],
    [tTurnR, 'determined'], [tSee3, 'hopeful', { lookX: .6, lookY: -.3 }], [tDoor + .1, 'relieved']];
  function pose3(t) {
    const cl = emotions(t, EMO3, { take: .7 });
    const o = { ...cl, hat: 'beanie', boilKey: 'B3clawd' };
    const w = wetK(t), x = X3r(t);
    o.col = mixCol(cl.col || PAL.clay, '#7C7F95', .25 * w); o.dk = mixCol(cl.dk || PAL.clayDk, '#4E5570', .25 * w); o.lt = mixCol(cl.lt || '#F5B394', '#A9ADBF', .3 * w); o.tint = null;
    let basketHand = null, u = U3;
    if (t < tTurnR) {
      o.view = 'front';
      let aR = lerp(cl.aR ?? .2, .9, 1 - ease(seg(t, tApIn - .3, tApIn + .1)));   // still holding the perfect apple up
      aR = lerp(aR, .25, ease(seg(t, tApIn + .1, tGrab3)));
      aR = lerp(aR, .6, ease(seg(t, tGrab3, tGrab3 + .3)));
      aR = lerp(aR, -.55, ease(seg(t, tGrab3 + .3, tSwoop)));   // the swoop down…
      aR = lerp(aR, .55, backOut(seg(t, tSwoop, tScoop + .15)));   // …and up with the cat in it
      o.aR = aR;
      if (t > tGrab3) basketHand = 'R';
    } else if (t < T24 + .05) {                                   // the run
      const ph = runS(t) * 1.0 + .1, mv = clamp((runS(t + .03) - runS(t - .03)) / .06 / 4.2);
      Object.assign(o, turn(t, tTurnR, tTurnR + .16, 0, .25));
      if (t > tTurnR + .16) o.view = 'side';
      o.walk = ph; o.dy = -.5 * mv * Math.abs(Math.cos(ph * TAU)) + (cl.dy || 0) * .3; o.rot = -.1 * mv + (cl.rot || 0) * .3;
      o.sq = (cl.sq || 0) * .4 + .15 * Math.sin(Math.PI * seg(t, tRun - .35, tRun + .05)) + .12 * spring(t, T24, 6, 14);
      o.smear = .25 * mv; o.smearDir = 1;
      o.aL = .72 + .06 * Math.sin(ph * TAU); basketHand = 'L';
    } else {                                                      // at the door: turn away and go in
      Object.assign(o, turn(t, tBack, tBack + .2, .25, .5));
      const k = ease(seg(t, tIn0, tIn1));
      u = lerp(U3, 15, k);
      o.walk = t > tIn0 && t < tIn1 ? seg(t, tIn0, tIn1) * 2.5 : null;
      if (o.view === 'side') { o.aL = .72; basketHand = 'L'; } else basketHand = null;
    }
    const y = t > tIn0 ? lerp(G3, DOOR[1] - 4, ease(seg(t, tIn0, tIn1))) : G3;
    const xx = t > tIn0 ? lerp(DOOR[0] - 40, DOOR[0], ease(seg(t, tIn0, tIn1))) : x;
    return { x: xx, y, u, o, basketHand };
  }
  // where the basket is: on the ground, hanging from the right hand (front view), or held out front by the rim (side view)
  function basket3(t, P) {
    if (!P.basketHand) {
      if (t < tGrab3) return { x: BX3, y: G3 + 2, rot: 0 };
      return null;   // carried in, out of sight behind Clawd
    }
    const [hx, hy] = armPt(P.x, P.y, P.u, P.o, P.basketHand);
    if (P.basketHand === 'R') return { x: hx, y: hy + 9.6 * BS3, rot: .06 * Math.sin(t * 3), hx, hy, hang: true };
    return { x: hx + 4.4 * BS3 - 6, y: hy + 4.2 * BS3 + 4, rot: 0, hx, hy };
  }
  function cat3(t, B) {
    const w = clamp(seg(t, T21, tShake) * 1.2);
    if (t < tScoop) {   // on the grass, soaked and miserable
      const shake = t > tShake && t < tShake + .5 ? Math.sin((t - tShake) * 55) * .12 * (1 - seg(t, tShake, tShake + .5)) : 0;
      const pop = seg(t, tScoop - .12, tScoop);
      return { x: CAT3[0], y: CAT3[1], o: { pose: 'sit', wet: w, ears: -1, eyes: t > tMis ? 'half' : 'open', look: t > tMis ? [-.8, .2] : [.2, -1], pupil: .4, rot: shake, tail: .2 * Math.sin(t * 2),
        sy: 1 - .15 * pop, boilKey: 'B3cat' } };
    }
    if (!B) return null;
    const k = seg(t, tScoop, tScoop + .3), inY = B.y - .35 * BS3, p = arcPt(CAT3, [B.x + 4, inY], 50, ease(k));
    const up = seg(t, tEars, tEars + .5);
    return { x: k < 1 ? p[0] : B.x + 4, y: k < 1 ? p[1] : inY, inBasket: true, o: { pose: 'loaf', wet: 1, ears: lerp(-1, .7, up), eyes: t < tEars ? 'wide' : t < AT(22, 3.4) ? 'open' : 'half',
      look: t < tEars ? [-.3, .2] : [lerp(0, -.8, seg(t, AT(22, 3.3), AT(22, 3.6))), lerp(-1, .1, seg(t, AT(22, 3.3), AT(22, 3.6)))], pupil: .6, noShadow: true, boilKey: 'B3cat',
      blink: 1 - Math.sin(Math.PI * seg(t, AT(22, 3.7), AT(22, 4.1))) * .95 } };
  }
  function cam3(t) {
    const tilt = -1750 * Math.pow(1 - ease(seg(t, T21, tSettle3)), 1.6);
    const run = X3r(t) - X3, lead = 260 * ease(seg(t, tRun, tRun + .8));
    return { x: 900 + run * .92 + lead * (1 - ease(seg(t, T24 - .6, T24 + .6))) + 8 * Math.sin(t * .3), y: 540, ty: tilt, z: 1.08 - .04 * ease(seg(t, tRun, T24)), rx: 960, ry: 540 };
  }
  function puddles(t, x0, x1, key) {
    for (let i = 0; i < 14; i++) {
      const x = x0 + (x1 - x0) * (i + .5 * hash(i * 3)) / 14, y = G3 + 10 + 50 * hash(i * 7), w = 60 + 70 * hash(i * 5);
      boilSeed(key + i);
      paint(ellPts(x, y, w, w * .2, 20, 2), { wash: '#8A93A6', fill: '#6F7890', fillOp: 70, bleed: .05, tex: .3, ink: mixCol(PAL.ink, '#6F7890', .5), sw: .5 });
      const a = frac(t * 1.3 + hash(i)), r = 8 + (w * .7) * a;
      inkLine([[x - r, y], [x, y - r * .18], [x + r, y], [x, y + r * .18], [x - r, y]], .6 * (1 - a), '#C3CFDC', 'inkfine', .8);
    }
  }
  function shotB3(t, lt, dur) {
    const C = cam3(t), w = wetK(t), sway = .5 * Math.sin(t * 1.4);
    const tone = c => mixCol(c, '#5D6680', .42 * w);
    inLayer(C, .1, () => {
      skyCheap('storm', 'rain', w, visX(C, .1, 0), -300, 1000, 'B3sky');
      greyDeck(t, DECK_BASE, 'B2');
    });
    inLayer(C, .3, () => orchardSlope(t, c => mixCol(mixCol(c, '#7A8296', .55), '#5D6680', .3 * w), 'B3far', -800, 3400, visX(C, .3, 60)));
    inLayer(C, .6, () => {
      boilSeed('B3meadow');
      paint(rectPts(-900, 760, 5000, 1000), { wash: tone(mixCol(FALL.grass, '#8C93A4', .3)), fill: tone(FALL.grassDk), fillOp: 55, bleed: .02, tex: .5, border: .15, ink: null });
      appleTree(120, 800, 13, { key: 'B3m1', seed: 5, lite: true, tone: c => tone(mixCol(c, '#8C93A4', .3)), sway: sway * .5, apples: 9 });
      appleTree(1500, 790, 11, { key: 'B3m2', seed: 6, lite: true, tone: c => tone(mixCol(c, '#8C93A4', .3)), sway: sway * .5, apples: 7 });
    });
    rain(t, { key: 'B3rainB', k: .4 + .6 * w, n: 130, col: '#A9B5C6', len: 40, seed: 12, wind: .22 });
    const P = pose3(t), B = basket3(t, P), c = cat3(t, B);
    inLayer(C, 1, () => {
      boilSeed('B3ground');
      paint(rectPts(-800, 820, 5200, 900), { wash: tone(FALL.grass), fill: tone(FALL.grassDk), fillOp: 70, bleed: .02, tex: .6, border: .15, ink: null });
      boilSeed('B3lane');
      paint(rectPts(-800, 872, 5200, 100, 4), { wash: tone(FALL.path), fill: tone(mixCol(FALL.path, FALL.grassDk, .3)), fillOp: 80, bleed: .05, tex: .6, ink: null });
      appleTree(360, 850, 22, { key: 'B3tree', seed: 3, tone, sway, apples: 10 });
      const vis = visX(C, 1, 400);
      if (DOOR[0] + 26 * CS_COT > vis[0] && DOOR[0] - 26 * CS_COT < vis[1]) {
        const door = t < tDoor ? 0 : t < tShut0 ? backOut(seg(t, tDoor, tDoor + .45)) : 1 - ease(seg(t, tShut0, tShut1)) + .06 * spring(t, tShut1, 7, 18);
        cottage(DOOR[0], DOOR[1], CS_COT, { door: clamp(door), lit: 1, wet: 1, dusk: .25, key: 'B3cot' });
      }
      puddles(t, X3 - 500, DOOR[0] + 200, 'B3pud');
      splashes(t, { key: 'B3spl', x0: vis[0], x1: vis[1], y: G3 + 30, depth: 60, n: 18, k: w });
      if (B && !B.hang && B.hx === undefined) basket(B.x, B.y, BS3, { key: 'B3basket', apples: t < tApIn + .35 ? 5 : 6, leaf: t < tLeafUp });
      if (c && !c.inBasket) cat(c.x, c.y, CS3, c.o);
      const drawCarried = () => {
        if (!B || B.hx === undefined) return;
        const o = { key: 'B3basket', apples: 6, leaf: false };
        basket(B.x, B.y, BS3, { ...o, part: 'back' });
        if (c && c.inBasket) cat(c.x, c.y, CS3, c.o);
        basket(B.x, B.y, BS3, { ...o, part: 'front' });
        if (c && c.inBasket && t > tLeafUp) {   // the leaf pops up out of the basket and settles on the cat's head: an umbrella
          const [hx, hy] = catHead(c.x, c.y, CS3, c.o), k = seg(t, tLeafUp, tLeafOn), q = ease(k);
          const from = [B.x + 2.2 * BS3, B.y - 5.5 * BS3], to = [hx + 2, hy - 1.25 * CS3 - LS3 * .35];
          const [x, y] = k < 1 ? arcPt(from, to, 110, q) : to;
          boilSeed('B3red');
          redLeaf(x + 12 * Math.sin(k * 8) * (1 - k), y, lerp(1.6 * BS3, LS3, q), lerp(.5, -.12, q) + .5 * Math.sin(k * 9) * (1 - k) + .05 * Math.sin(t * 3), { spin: k < 1 ? lerp(Math.cos(k * 12), 1, q * q) : 1 });
          if (k >= 1) splashes(t, { key: 'B3leafspl', x0: to[0] - 25, x1: to[0] + 25, y: to[1] - 8, depth: 4, n: 3 });
        }
      };
      if (!(t > T24 + .05 && P.o.view !== 'side')) drawCarried();
      if (P.basketHand === 'R' && t < tApIn) {   // the perfect apple, still held up
        const [hx, hy] = armPt(P.x, P.y, P.u, P.o, 'R');
        apple(hx, hy - 6, 13, { key: 'B3perfect' });
      } else if (t >= tApIn - .01 && t < tApIn + .35) {
        const k = seg(t, tApIn, tApIn + .35), [x, y] = arcPt([X3 + 150, G3 - 160], [BX3 + 10, G3 - 60], 40, k);
        apple(x, y, 13, { key: 'B3perfect', rot: 4 * k });
      }
      if (t < T24 + .05 || t < tShut0) clawd(P.x, P.y, P.u, P.o);
      if (t > T24 + .05 && P.o.view === 'side') drawCarried();
    });
    rain(t, { key: 'B3rainF', k: w, n: 70, col: '#C3CFDC', len: 60, seed: 19, wind: .22 });
    if (t > T25 - .3) brushWipe(.5 * ease(seg(t, T25 - .3, T25)), [FALL.woodDk, FALL.wood]);
  }

  shots([[T13, shotB1], [T17, shotB2], [T21, shotB3]]);
})();
