// chB.js: chapter B of "Last Light of September", the orchard and the rain (BAR(13) → BAR(25)). See
// docs/lastlight/STORYBOARD.md.
//   B1  BAR(13) → BAR(17)  the whip pan lands in the orchard: the cat hops onto the basket's rim; Clawd flicks the red
//                          leaf into the basket and picks the basket up (bar 13); tug, tug, POP, and the apple flies into
//                          the basket (bar 14); the cat bats a windfall to Clawd's feet and Clawd laughs (bar 15); a glint
//                          high in the tree, and Clawd's eyes go up (bar 16).
//   B2  BAR(17) → BAR(21)  eyeline-match cut to a low angle up the tree: tiptoe (bar 17), hop and brush (bar 18), crouch,
//                          jump and grab on AT(19, 3); a proud landing; clouds cover the sun; a raindrop hits Clawd's nose
//                          on bar 20; Clawd looks up and the camera tilts up into grey cloud.
//   B3  BAR(21) → BAR(25)  tilt down out of the same cloud into rain, and the colours drain to blue-grey (bar 21); the soaked
//                          cat shakes and Clawd tosses the perfect apple into the basket; Clawd lifts the basket to the cat,
//                          the cat hops in, and the red leaf flips up onto its head like an umbrella (bar 22, the camera
//                          pushes in); Clawd turns and runs right along the puddled lane, the camera pulls back and the lit
//                          cottage slides in ahead (bar 23); he stops at the door on bar 24, it swings open onto warm light,
//                          he turns away and goes in with the basket and cat, and the door thunks shut on beat 4. Out: a
//                          brushWipe in door wood, first half, in the last .3 s.
//   Seams   In: whip(p) with p .5 → 1 over the first .35 s (chapter A ends with p → .5). Out: brushWipe(p, [woodDk, wood]),
//           p 0 → .5 over the last .3 s, fully covered at BAR(25).
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
  const visY = (C, p, pad = 80) => { const c = C.ry + (C.y - C.ry) * p + (C.ty || 0), h = H / 2 / C.z + pad; return [c - h, c + h]; };
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
    const A = SKIES[a].map((c, i) => mixCol(c, SKIES[b][i], clamp(k))), n = 4, h = y1 - y0, x0 = v[0] - 60, w = v[1] - v[0] + 120;
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
    const a = Math.max(x0, Math.floor((vis[0] - 200) / 200) * 200), b = Math.min(x1, Math.ceil((vis[1] + 200) / 200) * 200), n = Math.max(2, Math.round((b - a) / 190));
    const P = [[b, 1600], [a, 1600]];
    for (let i = 0; i <= n; i++) { const x = lerp(a, b, i / n); P.push([x, hill(x)]); }
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
    // the first try: it keeps stretching, in small extra pushes that do not get there
    const pushK = tip * [AT(17, 2.1), AT(17, 3)].reduce((a, p) => a + Math.max(0, easeOut(seg(t, p - .12, p + .06)) - ease(seg(t, p + .1, p + .45))), 0);
    const hop = jump(t, tHop0, tHop1, 4.3), big = jump(t, tLaunch, tLand2, 5.5);
    const crouch = ease(seg(t, tCr0, tLaunch - .08)) * (1 - seg(t, tLaunch - .08, tLaunch));
    const inAir = (t > tHop0 && t < tHop1) || (t > tLaunch && t < tLand2);
    const reach = Math.max(tip, inAir ? 1 : 0, ease(seg(t, tRe, tHop0)) * (t < tHop1 ? 1 : 0));
    o.dy = (cl.dy || 0) * (1 - reach) - .6 * tip - .4 * pushK + hop.dy + big.dy + .25 * crouch;
    o.sq = (cl.sq || 0) * (1 - reach) - .2 * tip - .12 * pushK + hop.sq + big.sq + .3 * crouch - .1 * Math.sin(Math.PI * seg(t, tHop0, tHop1)) - .14 * Math.sin(Math.PI * seg(t, tLaunch, tLand2));
    o.dx = .08 * Math.sin(t * 34) * tip; o.rot = (cl.rot || 0) * (1 - reach) + .05 * Math.sin(t * 6.5) * tip;   // balancing on its toes
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
  function greyDeck(t, base, key, V) {   // V = [x0, x1, y0, y1]: the part of the layer that is on screen (everything else is skipped)
    const on = (x, y, rx, ry) => !V || (x + rx > V[0] && x - rx < V[1] && y + ry > V[2] && y - ry < V[3]);
    const top = V ? Math.max(-3200, V[2] - 100) : -3200;
    boilSeed(key + ' deck');
    if (base - 60 > top) paint(rectPts(V ? V[0] - 60 : -600, top, V ? V[1] - V[0] + 120 : 3200, base - 60 - top), { wash: '#6E7688', fill: '#5B6374', fillOp: 90, bleed: .1, tex: .5, border: .2, ink: null });
    for (let i = 0; i < 9; i++) {   // the billowing underside, lit a little from below
      const x = -500 + i * 330 + 40 * Math.sin(t * .2 + i), y = base - 40 + 30 * hash(i + 3), rx = 230 + 60 * hash(i), ry = 110 + 30 * hash(i + 1);
      if (!on(x, y, rx + 20, ry + 20)) continue;
      boilSeed(key + ' belly' + i);
      paint(ellPts(x, y, rx, ry, 22, 10), { wash: mixCol('#7B8396', '#8E95A6', hash(i + 5)), fill: '#5E6678', fillOp: 90, bleed: .2, tex: .5, ink: null });
    }
    for (let i = 0; i < 9; i++) {   // soft bands of cloud, so the tilt passes through layers
      const y = base - 160 - i * 230 - 40 * hash(i + 21), x = 400 + 500 * Math.sin(i * 2.1) + 60 * Math.sin(t * .15 + i), rx = 900 + 200 * hash(i + 23), ry = 70 + 40 * hash(i + 25);
      if (!on(x, y, rx + 30, ry + 30)) continue;
      boilSeed(key + ' band' + i);
      paint(ellPts(x, y, rx, ry, 24, 14), { fill: i % 2 ? '#7E879A' : '#535C72', fillOp: 95, bleed: .3, tex: .4, border: .3, ink: null });
    }
    for (let i = 0; i < 7; i++) {   // darker masses inside the deck, for texture during the tilt
      const x = -300 + i * 420 + 60 * hash(i + 11), y = base - 500 - 700 * hash(i + 13);
      if (!on(x, y, 400, 220)) continue;
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
      greyDeck(t, lerp(-260, DECK_BASE, ease(seg(t, T17, T20 + 1))), 'B2', [...visX(C, .1, 150), ...visY(C, .1, 260)]);
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
    if (t > T20 - .2) rain(t, { key: 'B2rain', k: .45 * seg(t, T20 - .2, T21) + .1, n: 160, col: '#AEBACB', seed: 5 });
  }

  // ======================================================================================================
  // B3: the rain, and the run home
  // ======================================================================================================
  const U3 = 22, CS3 = 18, BS3 = 11, LS3 = 34, G3 = 900, X3 = 760, COT = 34;
  const BX3 = X3 + 212, CAT3 = [BX3 + 175, G3 + 6];             // the basket on the grass, and the cat beyond it
  const DOORX = 2500, DOORY = G3 - 30, HALT = DOORX - 240;       // the cottage door (ground at its middle); where the run stops
  const tSettle3 = AT(21, 2.3), tShake = AT(21, 2.9), tMis = AT(21, 3.5), tSeeCat = AT(21, 4), tApIn = AT(21, 4.4);
  const tGrab3 = T22, tSwoop = AT(22, 1.5), tHop = AT(22, 1.85), tLand = tHop + .3, tLeafUp = tLand - .05, tLeafOn = AT(22, 2.95);
  const tEars = AT(22, 3.1), tLove = AT(22, 3.35), tTurnR = AT(22, 4.05), tRun = AT(22, 4.45), tSee3 = AT(23, 2.3);
  const tDoor = AT(24, 1.25), tFace = AT(24, 1.6), tIn0 = AT(24, 2), tIn1 = AT(24, 3.1), tShut0 = AT(24, 3.4), tShut1 = AT(24, 4);   // the door thunks shut on beat 4

  // Clawd's feet: a short step to the basket, a step toward the cat, then the run (a unit-speed profile; the distance is
  // fitted to the geometry, so the run stops just left of the door)
  const RUN = [[tRun - .12, 0], [tRun + .4, 1], [T24 - .5, 1], [T24 + .1, 0]];
  const runS = t => integ(t, RUN), RUN_END = runS(T24 + 1), RUN0 = X3 + 84, STRIDE = (HALT - RUN0) / 12;   // 12 whole strides
  const stepX = t => X3 + 34 * ease(seg(t, tGrab3 - .15, tGrab3 + .25)) + 50 * ease(seg(t, tSwoop - .15, tSwoop + .25));
  const runX = t => RUN0 + (HALT - RUN0) * runS(t) / RUN_END;
  const cx3 = t => t < tRun - .12 ? stepX(t) : runX(t);
  const wetK = t => ease(seg(t, T21 + .2, tSettle3 + 1.2));      // the colours drain to blue-grey as the rain arrives

  const EMO3 = [[0, 'nervous', { lookX: .1, lookY: -1 }], [tSeeCat, 'sad', { lookX: .8, lookY: .35 }], [tGrab3 + .1, 'determined', { lookX: .85, lookY: .3 }],
    [tLand + .08, 'surprised', { lookX: .9, lookY: .1 }], [tLove, 'love', { lookX: .8, lookY: .15 }], [tTurnR, 'determined'],
    [tSee3, 'hopeful', { lookX: .6, lookY: -.3 }], [tDoor + .15, 'relieved']];

  // Clawd: facing us for the rain, the apple and the scoop; in profile for the run; back to us at the door
  function pose3(t) {
    const cl = emotions(t, EMO3, { take: .7 }), w = wetK(t), lit = .3 * ease(seg(t, tDoor, tDoor + .6));
    const base = tintCols(cl), o = { ...cl, hat: 'beanie', boilKey: 'B3clawd', tint: null };
    const wc = (c, tc, k) => mixCol(mixCol(c, tc, k * w), '#FFC48A', lit);   // soaked, then warmed by the door light
    o.col = wc(base.col, '#7C7F95', .25); o.dk = wc(base.dk, '#4E5570', .25); o.lt = wc(base.lt, '#A9ADBF', .3);
    const x = cx3(t), spd = (cx3(t + .03) - cx3(t - .03)) / .06, mv = clamp(spd / 400), ph = (x - X3) / STRIDE;
    let hand = 'R', u = U3, y = G3, xx = x;
    if (t < tTurnR) {
      o.view = 'front';
      let aR = .5 + .05 * Math.sin(t * 2.2);                                          // the perfect apple, in the raised hand
      aR = lerp(aR, .8, ease(seg(t, tApIn - .28, tApIn - .08)));                       // wind-up
      aR = lerp(aR, .1, easeOut(seg(t, tApIn - .08, tApIn + .1)));                     // and toss it into the basket
      aR = lerp(aR, -1.05, ease(seg(t, tGrab3 - .15, tGrab3 + .2)));                   // reach down to the basket's rim
      aR = lerp(aR, -.55, ease(seg(t, tGrab3 + .25, tSwoop)));                         // lift it a little
      aR = lerp(aR, -.78, ease(seg(t, tSwoop, tSwoop + .25)));                         // tip it toward the cat
      aR = lerp(aR, .22, backOut(seg(t, tLand, tLand + .55)));                         // and up, with the cat in it
      o.aR = aR;
      o.rot = (o.rot || 0) + .1 * Math.sin(Math.PI * seg(t, tSwoop - .1, tLand + .4));  // leans toward the cat
      o.walk = ease(seg(t, tGrab3 - .15, tGrab3 + .25)) + ease(seg(t, tSwoop - .15, tSwoop + .25));   // one leg cycle per step
    } else if (t < tFace) {
      Object.assign(o, turn(t, tTurnR, tTurnR + .16, 0, .25));
      hand = o.view === 'front' || o.view === 'q' ? 'R' : 'L';
      o.walk = o.view === 'front' || o.view === 'q' ? null : (x - RUN0) / STRIDE + .25; o.dy = -.5 * mv * Math.abs(Math.cos(ph * TAU)) + (cl.dy || 0) * .3; o.rot = .1 * mv + (cl.rot || 0) * .3;
      o.sq = (cl.sq || 0) * .4 + .15 * Math.sin(Math.PI * seg(t, tRun - .35, tRun + .05)) + .12 * spring(t, T24 + .05, 6, 14);
      o.smear = Math.max(o.smear || 0, .25 * mv); o.smearDir = 1;
      o.aL = .72 + .06 * Math.sin(ph * TAU); hand = o.view === 'side' ? 'L' : hand;
      if (o.view === 'front' || o.view === 'q') o.aR = .22;
    } else {                                                                           // at the door: turn away and go in
      Object.assign(o, turn(t, tFace, tFace + .26, .25, .5)); hand = 'L';
      const k = ease(seg(t, tIn0, tIn1));
      u = lerp(U3, 11, k); y = lerp(G3, DOORY - 8, k); xx = lerp(HALT, DOORX - 30, k);
      o.walk = t > tIn0 && t < tIn1 + .1 ? seg(t, tIn0, tIn1) * 3.2 : null; o.aL = .72;
      o.dy = t > tIn0 && t < tIn1 ? -.25 * Math.abs(Math.sin(seg(t, tIn0, tIn1) * Math.PI * 3.2)) : 0;
      o.sq = (cl.sq || 0) * .4 + .12 * spring(t, T24 + .05, 6, 14);
    }
    return { x: xx, y, u, o, hand, mv, ph };
  }

  // where the basket sits when Clawd holds it by the rim: its left corner at the hand, the basket beyond it
  const holdAt = (P, view, hand) => {
    const [hx, hy] = armPt(P.x, P.y, P.u, { ...P.o, view }, hand), k = P.u / U3;
    return { x: hx + (4.4 * BS3 - 6) * k, y: hy + (4.2 * BS3 + 4) * k, hx, hy, k };
  };
  function basket3(t, P) {
    if (t < tGrab3 - .1) return { x: BX3, y: G3 + 2, k: 1, rot: 0, held: false };
    let h = holdAt(P, P.o.view, P.hand);
    if (t > tTurnR && t < tTurnR + .36) {                           // the basket passes from the right hand to the near hand
      const m = ease(seg(t, tTurnR + .06, tTurnR + .3)), a = holdAt(P, 'q', 'R'), b = holdAt(P, 'side', 'L');
      h = { x: lerp(a.x, b.x, m), y: lerp(a.y, b.y, m), hx: lerp(a.hx, b.hx, m), hy: lerp(a.hy, b.hy, m), k: 1 };
    }
    const lift = ease(seg(t, tGrab3 - .05, tGrab3 + .25));
    let rot = .04 * Math.sin(t * 2.1) * lift + .1 * spring(t, tLand, 6, 15);                 // the cat's weight lands, then settles
    rot += P.mv * (.17 + .06 * Math.sin(P.ph * TAU)) - .3 * spring(t, T24 - .05, 5, 14);      // trails on the run, swings on at the stop
    return { x: lerp(BX3, h.x, lift), y: lerp(G3 + 2, h.y, lift), k: h.k, hx: h.hx, hy: h.hy, rot: rot * lift, held: true };
  }

  // the cat: soaked on the grass, shakes, watches the basket come down, hops in, rides home
  function cat3(t, B, P) {
    const wet = lerp(.3, 1, ease(seg(t, T21, tShake))), base = { wet, boilKey: 'B3cat', pupil: .4 };
    if (t < tHop) {
      const sh = t > tShake && t < tShake + .5 ? Math.sin((t - tShake) * 60) * .13 * (1 - seg(t, tShake, tShake + .5)) : 0, cr = ease(seg(t, tHop - .18, tHop));
      let look = [.1, -1], eyes = 'open';
      if (t > tMis) { look = [-.8, .25]; eyes = 'half'; }
      if (t > tSwoop - .1) { look = [-.9, -.05]; eyes = 'open'; }                          // watches the basket come down
      const blink = 1 - Math.sin(Math.PI * seg(t, AT(21, 3.1), AT(21, 3.4))) * .95;
      return { x: CAT3[0], y: CAT3[1], mode: 'ground', o: { ...base, pose: 'sit', ears: -1, eyes, look, rot: sh, blink, tail: .2 * Math.sin(t * 2),
        sy: 1 - .17 * cr - (t > tShake && t < tShake + .5 ? .05 : 0), sx: 1 + .12 * cr } };
    }
    const inP = [B.x, B.y - 12 * B.k];
    if (t < tLand) {                                                                    // the hop: a side view, facing the basket
      const k = seg(t, tHop, tLand), p = arcPt(CAT3, inP, 62, ease(k));
      return { x: p[0], y: p[1], mode: 'fly', o: { ...base, pose: 'pounce', flip: true, rot: lerp(.2, -.3, k), ears: -.4, eyes: 'wide', noShadow: true } };
    }
    const land = spring(t, tLand, 8, 20) * .9, up = ease(seg(t, tEars, tEars + .5)), run = P.mv;
    let look = [-.8, .1], eyes = t < tEars - .05 ? 'wide' : 'open';
    if (t > tLeafUp && t < tEars + .1) look = [-.1, -1];                                  // eyes up at the leaf coming down
    if (t > tEars + .2) look = [lerp(-.5, -.85, seg(t, tEars + .2, tLove)), .1];          // then at Clawd
    if (t > tTurnR) { look = [.95, -.15]; eyes = 'open'; }                                // the cat rides facing the wind
    let pupil = .55, ears = lerp(-1, .65, up), blink = 1 - Math.sin(Math.PI * seg(t, AT(22, 3.7), AT(22, 4.05))) * .95;
    if (t > tDoor - .3) { look = [.9, -.35]; eyes = 'wide'; pupil = .95; ears = .9; }       // the door light
    if (t > tFace + .1) { look = [0, .15]; eyes = 'open'; pupil = .6; ears = .65; blink = 1 - Math.sin(Math.PI * seg(t, AT(24, 2.55), AT(24, 3.05))) * .95; }   // a last look back
    return { x: inP[0], y: inP[1], mode: 'in', o: { ...base, pose: 'sit', ears, eyes, look, pupil, blink, noShadow: true, sy: 1 - .12 * land, sx: 1 + .08 * land, tail: .1 } };
  }

  // the soaked cat's spiky fur: tufts along the head and shoulders, drawn under the cat so its outline covers their roots
  function wetFur(x, y, s, o, key) {
    const wet = o.wet || 0; if (wet < .4) return;
    const A = [[-1.9, -5.3, -1, 0], [-1.75, -4.5, -1, .55], [-1.3, -6.4, -.85, -.6], [1.9, -5.3, 1, 0], [1.75, -4.5, 1, .55], [1.3, -6.4, .85, -.6], [0, -6.85, .1, -1],
      [-2.05, -3.4, -1, .35], [2.05, -3.4, 1, .35], [-2.35, -2.1, -1, .55], [2.35, -2.1, 1, .55]];
    const col = mixCol(FALL.cat, '#4E5670', .3 * wet), sw = clamp(s / 22, .35, 1.4) * .8, kk = clamp((wet - .4) / .4);
    push(); translate(x, y + (o.dy || 0) * s); if (o.rot) rotate(o.rot); scale(o.sx ?? 1, o.sy ?? 1);
    boilSeed(key);
    A.forEach(([ax, ay, dx, dy], i) => {
      const L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, len = (.45 + .35 * hash(i * 3 + 1)) * kk, hw = .2, bx = ax - ux * .15, by = ay - uy * .15;
      paint([[(bx - uy * hw) * s, (by + ux * hw) * s], [(ax + ux * len) * s, (ay + uy * len + .2 * len) * s], [(bx + uy * hw) * s, (by - ux * hw) * s]], { wash: col, ink: PAL.ink, sw });
    });
    pop();
  }
  // water flung off by the shake
  function shakeDrops(t, x, y, key) {
    const a = t - tShake; if (a < 0 || a > .7) return;
    boilSeed(key);
    for (let i = 0; i < 10; i++) {
      const side = i % 2 ? 1 : -1, vx = side * (110 + 130 * hash(i + 2)), vy = -(140 + 160 * hash(i + 5)), r = 3.6 * (1 - a / .7) * (.7 + .6 * hash(i + 9));
      paint(ellPts(x + vx * a, y + vy * a + 560 * a * a, r, r * 1.25, 8), { wash: '#C9D6E6', washOp: 230, ink: null });
    }
  }
  // spray from the feet on the run
  function footSplash(t, P) {
    if (P.mv < .3) return;
    const spd = P.mv * 400, f = frac(P.ph * 2), hs = STRIDE / (2 * Math.max(spd, 60));
    boilSeed('B3foot');
    for (let i = 0; i < 2; i++) {
      const age = (f + i) * hs; if (age > .3) continue;
      const fx = P.x - spd * age + ((Math.floor(P.ph * 2) - i) & 1 ? 1.5 : -1.7) * U3;
      for (let j = 0; j < 3; j++) {
        const px = fx - (40 + 90 * hash(j + 3)) * age, py = G3 + 6 - (150 + 120 * hash(j + 7)) * age + 700 * age * age, r = 3.4 - age * 7;
        if (r > .5) paint(ellPts(px, py, r, r * 1.2, 8), { wash: '#C9D6E6', washOp: 230, ink: null });
      }
    }
  }
  function puddles(t, x0, x1, vis, key) {
    for (let i = 0; i < 18; i++) {
      const d = hash(i * 9 + 1) * 1.3, g = ease(seg(t, T21 + .5 + d, T21 + 2.3 + d)); if (g <= .02) continue;
      const x = x0 + (x1 - x0) * (i + .5 * hash(i * 3)) / 18, y = G3 + 10 + 50 * hash(i * 7), w = (60 + 70 * hash(i * 5)) * g;
      if (x + w < vis[0] || x - w > vis[1]) continue;
      boilSeed(key + i);
      paint(ellPts(x, y, w, w * .2, 20, 2), { wash: '#8A93A6', fill: '#6F7890', fillOp: 70, bleed: .05, tex: .3, ink: mixCol(PAL.ink, '#6F7890', .5), sw: .5 });
      const a = frac(t * 1.3 + hash(i)), r = 8 + (w * .7) * a;
      inkLine([[x - r, y], [x, y - r * .18], [x + r, y], [x, y + r * .18], [x - r, y]], .6 * (1 - a), '#C3CFDC', 'inkfine', .8);
    }
  }
  // leaves stuck flat to the wet lane
  function litter(vis, tone) {
    const cols = [FALL.amber, FALL.rust, FALL.gold, FALL.maple, FALL.olive];
    for (let i = 0; i < 16; i++) {
      const x = X3 - 500 + (DOORX + 900 - X3) * (i + hash(i * 4.1)) / 16, y = G3 + 22 + 60 * hash(i * 6.3);
      if (x < vis[0] || x > vis[1]) continue;
      boilSeed('B3lit' + i);
      leaf(x, y, 8 + 5 * hash(i + 2), hash(i * 3) * TAU, tone(cols[i % 5]), { spin: .3 + .2 * hash(i), ink: tone(FALL.barkDk) });
    }
  }
  // The door leaf again, to be painted OVER Clawd as it swings shut (cottage() paints its own under him). Same polygon, seed
  // and tone as lib's, so the two match to the stroke.
  function doorLeaf(x, y, s, d, tone) {
    if (d >= 1) return;
    const sw = clamp(s / 12, .6, 2), dw = 3.6 * s, dTop = y - 11 * s, arch = [];
    for (let i = 0; i <= 10; i++) { const a = Math.PI * i / 10; arch.push([x - Math.cos(a) * dw, dTop - Math.sin(a) * 2.6 * s]); }
    const hinge = x - dw, wdt = 2 * dw * (1 - ease(d) * .82);
    boilSeed('B3cot door');
    paint([[hinge, y], ...arch.map(([a, b]) => [hinge + (a - hinge) * wdt / (2 * dw), b]), [hinge + wdt, y]], { wash: tone(FALL.wood), fill: tone(FALL.woodDk), fillOp: 90, tex: .7, bleed: .05, ink: PAL.ink, sw });
    for (let i = 1; i < 4; i++) inkLine([[hinge + wdt * i / 4, y - .3 * s], [hinge + wdt * i / 4, dTop - 1.8 * s]], sw * .7, tone(FALL.woodDk), 'dry', 0);
    paint(ellPts(hinge + wdt * .85, y - 5.5 * s, .4 * s, .4 * s, 10), { wash: '#C9A45A', ink: PAL.ink, sw: sw * .7 });
  }

  // the basket with the cat in it: back of the basket, the cat, the front of the basket, then the leaf on its head
  function carried(t, B, c, P) {
    const k = B.k, bo = { key: 'B3basket', apples: 6, leaf: t < tLeafUp }, hasCat = c && c.mode !== 'ground';
    push(); translate(B.hx, B.hy); rotate(B.rot); translate(-B.hx, -B.hy);
    basket(B.x, B.y, BS3 * k, { ...bo, part: 'back' });
    if (hasCat) { wetFur(c.x, c.y, CS3 * k, c.o, 'B3furC'); cat(c.x, c.y, CS3 * k, c.o); }
    basket(B.x, B.y, BS3 * k, { ...bo, part: 'front' });
    if (hasCat && t >= tLeafUp) {                                   // the leaf pops out of the basket and settles on the cat's head
      const [hx, hy] = catHead(c.x, c.y, CS3 * k, c.o), kk = seg(t, tLeafUp, tLeafOn), q = ease(kk), s = LS3 * k;
      const from = [B.x + 2.2 * BS3 * k, B.y - 5.5 * BS3 * k], to = [hx + 3 * k, hy - 1.5 * CS3 * k - .62 * s];
      const [x, y] = kk < 1 ? arcPt(from, to, 120 * k, q) : to;
      const flutter = .12 * P.mv * Math.sin(P.ph * TAU * 2) + .05 * Math.sin(t * 3);
      boilSeed('B3red');
      redLeaf(x + 14 * Math.sin(kk * 8) * (1 - kk), y, lerp(1.6 * BS3 * k, s, q), lerp(.5, .3, q) + .5 * Math.sin(kk * 9) * (1 - kk) + flutter,
        { spin: kk < 1 ? lerp(Math.cos(kk * 12), 1, q * q) : 1 });
      if (kk >= 1) splashes(t, { key: 'B3leafspl', x0: to[0] - 18 * k, x1: to[0] + 18 * k, y: to[1] + 2 * k, depth: 6, n: 3 });
    }
    pop();
  }

  const CAM2 = [960 + 10 * Math.sin(T21 * .31), 540, 1.06];       // where B2's camera ended: the tilt starts from here
  function cam3(t) {
    const tilt = -1750 * Math.pow(1 - ease(seg(t, T21, tSettle3)), 1.6);
    const yz = kf(t, [[T21, [CAM2[1], CAM2[2]]], [tSettle3, [650, 1.12]], [tSeeCat - .3, [668, 1.15]], [tSwoop - .15, [738, 1.5]], [tLeafOn + .3, [742, 1.58]],
      [tTurnR + .25, [740, 1.52]], [tRun + 1.1, [695, 1.13]], [T24 - .7, [680, 1.17]], [T24 + .5, [650, 1.3]], [tShut1, [645, 1.36]], [T25, [640, 1.42]]], ease);
    let x = kf(t, [[T21, CAM2[0]], [tSettle3, 900], [tSeeCat - .3, 930], [tSwoop - .15, 985], [tLeafOn + .3, 1000], [tTurnR, 1000]], ease);
    if (t > tTurnR) x = lerp(1000, runX(t) + 330, ease(seg(t, tTurnR, tRun + 1.1)));       // pulls back and leads the run
    if (t > T24 - 1.3) x = lerp(x, DOORX - 90, ease(seg(t, T24 - 1.3, T24 + .35)));          // settles on the door
    return { x: x + 6 * Math.sin(t * .3), y: yz[0] + 3 * Math.sin(t * .4), ty: tilt, z: yz[1], rx: 960, ry: 540 };
  }

  function shotB3(t, lt, dur) {
    const C = cam3(t), w = wetK(t), sway = .5 * Math.sin(t * 1.4);
    const tone = c => mixCol(c, mixCol('#6F7A8E', '#596682', w), lerp(.38, .56, w));
    inLayer(C, .1, () => {
      skyCheap('storm', 'rain', w, visX(C, .1, 0), -300, 1000, 'B3sky');
      greyDeck(t, DECK_BASE, 'B2', [...visX(C, .1, 150), ...visY(C, .1, 260)]);
    });
    inLayer(C, .3, () => orchardSlope(t, c => mixCol(mixCol(c, '#7A8296', .55), '#5D6680', .3 * w), 'B3far', -800, 3800, visX(C, .3, 60)));
    inLayer(C, .6, () => {
      boilSeed('B3meadow');
      const mv = visX(C, .6, 60);
      paint(rectPts(mv[0], 760, mv[1] - mv[0], 320), { wash: tone(mixCol(FALL.grass, '#8C93A4', .3)), fill: tone(FALL.grassDk), fillOp: 55, bleed: .02, tex: .5, border: .15, ink: null });
      const v = visX(C, .6, 200), tt = c => tone(mixCol(c, '#8C93A4', .3));
      [[120, 800, 13, 5, 9], [880, 786, 10, 7, 6], [1500, 790, 11, 6, 7], [2150, 782, 12, 8, 8], [2800, 792, 11, 9, 7]].forEach(([x, y, s, seed, n]) => {
        if (x > v[0] - 300 && x < v[1] + 300) appleTree(x, y, s, { key: 'B3m' + seed, seed, lite: true, tone: tt, sway: sway * .5, apples: n });
      });
    });
    rain(t, { key: 'B2rain', k: lerp(.55, 1, ease(seg(t, T21, T21 + 1.8))), n: 160, col: '#AEBACB', seed: 5 });
    const P = pose3(t), B = basket3(t, P), c = cat3(t, B, P);
    inLayer(C, 1, () => {
      const vis = visX(C, 1, 400);
      boilSeed('B3ground');
      paint(rectPts(vis[0] - 300, 820, vis[1] - vis[0] + 600, Math.max(200, visY(C, 1, 80)[1] - 820)), { wash: tone(FALL.grass), fill: tone(FALL.grassDk), fillOp: 70, bleed: .02, tex: .6, border: .15, ink: null });
      boilSeed('B3lane');
      paint(rectPts(vis[0] - 300, 872, vis[1] - vis[0] + 600, 100, 4), { wash: tone(FALL.path), fill: tone(mixCol(FALL.path, FALL.grassDk, .3)), fillOp: 80, bleed: .05, tex: .6, ink: null });
      litter(vis, tone);
      if (vis[0] < 360 + 330) appleTree(360, 850, 22, { key: 'B3tree', seed: 3, tone, sway, apples: 10 });
      // the cottage, with its door: it swings open on bar 24 and shuts behind them
      const door = t < tDoor ? 0 : t < tShut0 ? backOut(seg(t, tDoor, tDoor + .5)) : 1 - ease(seg(t, tShut0, tShut1)) + .06 * spring(t, tShut1, 7, 18);
      const dk = clamp(door), doorOpen = Math.min(dk, .999);
      if (DOORX + 20 * COT > vis[0] && DOORX - 20 * COT < vis[1]) {
        cottage(DOORX, DOORY, COT, { door: doorOpen, lit: 1, wet: 1, dusk: .8, key: 'B3cot' });
        steam(t, DOORX + 11 * COT, DOORY - 31 * COT, 14, { key: 'B3smoke' });
        glow(DOORX, G3 + 50, 300, FALL.lamp, .55 * dk);              // the warm light spills onto the wet lane
      }
      puddles(t, X3 - 500, DOORX + 300, vis, 'B3pud');
      splashes(t, { key: 'B3spl', x0: vis[0], x1: vis[1], y: G3 + 30, depth: 60, n: 18, k: w });
      // the soaked cat on the grass, the basket on the grass
      if (!B.held) basket(B.x, B.y, BS3, { key: 'B3basket', apples: t < tApIn + .35 ? 5 : 6, leaf: true });
      if (c.mode === 'ground') {
        wetFur(c.x, c.y, CS3, c.o, 'B3furG'); cat(c.x, c.y, CS3, c.o);
        shakeDrops(t, c.x, c.y - 5 * CS3, 'B3drops');
      }
      if (B.held && t < tShut1 + .05) carried(t, B, c, P);
      // the perfect apple: in the raised hand, then tossed into the basket
      if (t < tApIn + .35) {
        if (t < tApIn) { const [hx, hy] = armPt(P.x, P.y, P.u, P.o, 'R'); apple(hx, hy - 8, 13, { key: 'B3perfect' }); }
        else {
          const Pa = pose3(tApIn), [hx, hy] = armPt(Pa.x, Pa.y, Pa.u, Pa.o, 'R'), k = seg(t, tApIn, tApIn + .35), [x, y] = arcPt([hx, hy - 8], [BX3 + 8, G3 - 40], 55, k);
          apple(x, y, 13, { key: 'B3perfect', rot: 4 * k });
        }
      }
      if (t < tShut1 + .05) clawd(P.x, P.y, P.u, P.o);
      if (t >= tShut0 - .02 && t < tShut1 + .12) doorLeaf(DOORX, DOORY, COT, doorOpen, c2 => mixCol(mixCol(c2, '#5D6680', .35), '#3A3F66', .32));   // the door closes over them
      footSplash(t, P);
    });
    rain(t, { key: 'B3rainF', k: w, n: 60, col: '#C3CFDC', len: 60, seed: 19, wind: .22 });
    if (t > T25 - .3) brushWipe(.5 * ease(seg(t, T25 - .3, T25)), [FALL.woodDk, FALL.wood]);
  }

  shots([[T13, shotB1], [T17, shotB2], [T21, shotB3]]);
})();
