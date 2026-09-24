// butterfly.js: "The Butterfly", 18 s, to Kevin MacLeod's "Carefree" (96 BPM). See STORYBOARD.md.
//   A (0–6):   the butterfly lands on a flower; Clawd sneaks, pounces, misses, and ends up wearing the flower. Whip pan.
//   B (6–11):  the chase: two jumps, a dive, a belly flop. Brush wipe.
//   C (11–18): late afternoon, Clawd sits and sulks; the butterfly lands on the flower on Clawd's head. Heart iris.
(() => {
  const WING = '#8E6FC8', WING2 = '#E58FB0', SPOT = PAL.ochre, STEM = '#4F7A45';
  const WIPE = [PAL.sap, PAL.ochre];

  // ---------- characters and props ----------
  // The butterfly, seen from above. open 0..1 = wing spread (a flap is open going 1 → small → 1).
  function butterfly(x, y, s, o = {}) {
    const open = clamp(o.open ?? 1, .3, 1), sw = clamp(s / 36, .5, 1.1);
    boilSeed('bfly');
    push(); translate(x, y); rotate(o.rot || 0);
    const S = pts => pts.map(([px, py]) => [px * s, py * s]);
    for (const side of [-1, 1]) {
      push(); scale(side * open, 1);
      paint(S([[.06, -.05], [.35, -.62], [.8, -.9], [1.18, -.72], [1.1, -.28], [.55, .02], [.08, .08]]), { wash: WING, fill: mixCol(WING, PAL.cream, .3), fillOp: 90, ink: PAL.ink, sw, curv: .55 });
      paint(S([[.06, .06], [.55, .08], [.86, .42], [.66, .86], [.3, .74], [.08, .4]]), { wash: WING2, ink: PAL.ink, sw, curv: .55 });
      paint(ellPts(.72 * s, -.5 * s, .16 * s, .13 * s, 10), { wash: SPOT, ink: null });
      paint(ellPts(.5 * s, .45 * s, .09 * s, .09 * s, 8), { wash: PAL.cream, ink: null });
      pop();
    }
    paint(ellPts(0, .12 * s, .09 * s, .5 * s, 12), { wash: PAL.ink, ink: null });
    paint(ellPts(0, -.45 * s, .13 * s, .12 * s, 10), { wash: PAL.ink, ink: null });
    for (const sd of [-1, 1]) inkLine([[sd * .04 * s, -.52 * s], [sd * .22 * s, -.85 * s], [sd * .36 * s, -.95 * s]], sw * .8, PAL.ink, 'inkfine', .6);
    pop();
  }
  const flapFly = t => .65 + .35 * Math.cos(t * TAU * 6);                          // 4 frames a flap at 24 fps
  const flapRest = (t, t0) => .35 + .65 * (.5 + .5 * Math.cos((t - t0) * TAU * .7));  // slow open and close at rest
  const wobXY = (t, a) => [a * 18 * Math.sin(t * 7.1), a * 24 * Math.sin(t * 9.3 + 1)];

  // A flower on a stem. squash 0..1 flattens it; noHead hides the head (it's on Clawd now).
  function flower(x, gy, h, t, o = {}) {
    boilSeed('flower' + (o.key ?? x));
    const sq = o.squash || 0, hh = h * (1 - .85 * sq), sway = (1 - sq) * 7 * Math.sin(t * 1.7 + x * .013) + (o.lean || 0);
    const hx = x + sway, hy = gy - hh;
    inkLine([[x, gy], [x + sway * .25, gy - hh * .5], [hx, hy]], 1.1, STEM, 'ink', .6);
    paint(ellPts(x + sway * .2 + 13, gy - hh * .35, 15, 6, 10, 0, -.55), { wash: PAL.sap, ink: PAL.ink, sw: .5 });
    if (o.noHead) return [hx, hy];
    const r = o.r || 22, col = o.col || PAL.cream;
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * TAU + hash(x) * 2;
      paint(ellPts(hx + Math.cos(a) * r * .7, hy + Math.sin(a) * r * .7 * (1 - .5 * sq), r * .5, r * .38, 10, 0, a), { wash: col, ink: PAL.ink, sw: .55 });
    }
    paint(ellPts(hx, hy, r * .38, r * .38, 10), { wash: PAL.ochre, ink: PAL.ink, sw: .55 });
    return [hx, hy];
  }
  // A dust puff that swells and fades, age in seconds.
  function puff(x, y, age, dir = -1) {
    if (age < 0 || age > .6) return;
    boilSeed('puff' + Math.round(x));
    const k = age / .6;
    for (let i = 0; i < 4; i++) {
      const px = x + dir * (20 + 70 * easeOut(k)) * (.5 + hash(i + x) * .8), py = y - 10 - 30 * easeOut(k) * hash(i + 9);
      paint(ellPts(px, py, 18 + 22 * k, 14 + 16 * k, 12), { fill: '#EFE4CF', fillOp: 200 * (1 - k), bleed: .2, tex: .3, ink: null });
    }
  }
  const bump = (t, a, b) => Math.sin(Math.PI * seg(t, a, b));
  // Screen streaks for the whip pan, k = 0..1 strength.
  function streaks(k) {
    if (k < .05) return;
    boilSeed('streaks');
    for (let i = 0; i < 14; i++) {
      const y = 60 + i * 72 + hash(i) * 30, x0 = hash(i + 50) * W * .6 - 200, len = 500 + 700 * hash(i + 90);
      const th = 3 + 5 * hash(i + 7);
      paint([[x0, y - th], [x0 + len * k, y - th * .4], [x0 + len * k + 20, y], [x0 + len * k, y + th * .4], [x0, y + th]], { wash: PAL.cream, washOp: 150 + 80 * hash(i + 3), ink: null });
    }
  }

  // ---------- set pieces ----------
  // Sky, far hills (parallax against camX) and clouds, in screen space. warm 0..1 shifts to late afternoon.
  function skyAndHills(t, camX = 0, warm = 0) {
    boilSeed('sky');
    const sky = mixCol('#A9CFE3', '#F2C98D', warm);
    paint(rectPts(-60, -60, W + 120, H + 120), { wash: sky, ink: null });
    paint(ellPts(W * .5, H * .62, W * .9, H * .3, 30, 8), { fill: mixCol('#DDEFF2', '#F4A98A', warm), fillOp: 120, bleed: .3, tex: .5, ink: null });
    if (warm > 0) glow(W * .78, H * .42, 380, '#FFD58A', .7 * warm);
    for (let i = 0; i < 4; i++) {   // clouds drift slowly, and slower than the hills
      boilSeed('cloud' + i);
      const cx = ((hash(i) * 2400 - camX * .08 + t * 12) % 2600 + 2600) % 2600 - 350, cy = 110 + 150 * hash(i + 4);
      for (let j = 0; j < 3; j++) paint(ellPts(cx + (j - 1) * 70, cy - (j === 1 ? 26 : 0), 90, 44, 16, 5), { wash: mixCol(PAL.cream, '#FFE3C4', warm), washOp: 235, ink: null });
    }
    const hillCols = [mixCol('#8DB9A0', '#C9A27A', warm * .6), mixCol('#6FA274', '#B08E5A', warm * .5)];
    [[.18, 600, 220], [.35, 680, 170]].forEach(([par, cy, ry], L) => {
      boilSeed('hills' + L);
      const period = 1500, off = ((-camX * par) % period + period) % period;
      for (let k = -1; k < 3; k++) {
        const hx = off + k * period + (L ? 700 : 0);
        paint(ellPts(hx, cy + ry, 900, ry * 1.3, 30, 4), { wash: hillCols[L], fill: mixCol(hillCols[L], PAL.ink, .15), fillOp: 60, bleed: .1, tex: .5, ink: L ? PAL.ink : null, sw: .6 });
      }
    });
  }
  // The meadow floor around world x in [x0, x1], ground line at G. Tufts and small flowers sit at fixed world spots.
  function meadow(x0, x1, G, t, warm = 0) {
    boilSeed('ground');
    const g = mixCol(PAL.sap, '#B6A05A', warm * .5);
    paint(rectPts(x0 - 200, G - 12, x1 - x0 + 400, 700, 3), { wash: g, fill: mixCol(g, PAL.ink, .25), fillOp: 70, bleed: .05, tex: .6, ink: null });
    inkLine([[x0 - 200, G - 10], [(x0 + x1) / 2, G - 16], [x1 + 200, G - 9]], 1, PAL.ink, 'ink', .5);
    for (let k = Math.floor(x0 / 110); k <= Math.ceil(x1 / 110); k++) {
      boilSeed('tuft' + k);
      const x = k * 110 + hash(k) * 60, y = G + 30 + hash(k + 3) * 120, s = wob(t, .6, hash(k) * 5) * 4;
      for (const d of [-1, 0, 1]) inkLine([[x + d * 6, y], [x + d * 10 + s, y - 18 - 10 * hash(k + d + 7)]], .7, mixCol(g, PAL.cream, .3), 'inkfine', .4);
      if (hash(k + 20) > .72) {   // small daisies in the grass
        const fc = [PAL.cream, WING2, '#F4D36B'][Math.floor(hash(k + 30) * 3)];
        for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; paint(ellPts(x + 20 + Math.cos(a) * 7, y - 6 + Math.sin(a) * 5, 6, 4.5, 8, 0, a), { wash: fc, ink: null }); }
        paint(ellPts(x + 20, y - 6, 3.5, 3.5, 8), { wash: PAL.ochre, ink: null });
      }
    }
  }
  // World position of a point in Clawd's body-local front-view space, for a pose o (matches clawd()'s transform).
  function bodyPt(x, G, u, o, lx, ly) {
    const sq = (o.sq || 0) + (o.take || 0), f = o.flip ? -1 : 1;
    const px = lx * u * f * (1 + sq * .6), py = ly * u * (1 - sq), r = o.rot || 0;
    return [x + (o.dx || 0) * u + px * Math.cos(r) - py * Math.sin(r), G + (o.dy || 0) * u + px * Math.sin(r) + py * Math.cos(r)];
  }
  const add = (a, b, k) => (a[k] || 0) + (b[k] || 0);

  // ---------- shot A: the flower ----------
  const GA = 860, FX = 1300, FH = 185, uA = 28;
  const tLand = 2.25, tLift = 4.3, tTake = 4.12, tSplat = 4.6;
  function bflyA(t) {
    if (t < tLand) {
      const p = kf(t, [[.6, [-120, 240]], [1.2, [420, 300]], [1.7, [860, 360]], [2.02, [1180, 560]], [tLand, [FX, GA - FH - 26]]], ease);
      const w = wobXY(t, 1 - seg(t, 1.8, tLand)); return { p: [p[0] + w[0], p[1] + w[1]], open: t > tLand - .12 ? .6 : flapFly(t), rot: .3 * Math.sin(t * 4) * (1 - seg(t, 1.8, tLand)) };
    }
    if (t < tLift) { const sway = 7 * Math.sin(t * 1.7 + FX * .013); return { p: [FX + sway, GA - FH - 26], open: flapRest(t, tLand), rot: .05 * Math.sin(t * 1.7) }; }
    const p = kf(t, [[tLift, [FX, GA - FH - 26]], [4.55, [1380, 470]], [4.95, [1140, 430]], [5.3, [1330, 450]], [5.6, [1250, 420]], [6.0, [2532, 502]]], ease);   // ends where shot B picks it up on screen
    const w = wobXY(t, .7); return { p: [p[0] + w[0], p[1] + w[1]], open: flapFly(t), rot: .35 * Math.sin(t * 5) };
  }
  function shotFlower(t, lt, dur) {
    const whip = easeIn(seg(t, 5.62, 6.0));
    const cx = 980 + 20 * Math.sin(t * .5) + 1500 * whip;
    skyAndHills(t, cx - 980);
    camBegin(cx, 640, 1.2 + .04 * ease(seg(t, 0, 4.6)));
    meadow(cx - 1100, cx + 1100, GA, t);
    flower(520, GA + 6, 95, t, { key: 'f1', col: WING2, r: 17 });
    flower(880, GA + 10, 70, t, { key: 'f2', r: 14 });
    const b = bflyA(t);

    // Clawd: happy → eyes follow the arrival → starstruck → mischief sneak → pounce → dizzy in the flower → determined
    const sneak = stroll(t, 2.95, 4.0, 700, 1010, uA);
    let x = t < 2.95 ? 700 : sneak.x;
    const hop = jump(t, tTake, tSplat, 4);
    if (t >= tTake) x = lerp(1010, 1235, easeOut(seg(t, tTake, tSplat)));
    if (t > 5.62) x += 900 * easeIn(seg(t, 5.62, 6.0));
    const mood = emotions(t, [[0, 'happy'], [.95, 'neutral'], [2.35, 'starstruck'], [2.95, 'mischief'], [4.68, 'dizzy'], [5.3, 'determined', { lookY: -1, lookX: .2 }]]);
    let pose = {};
    if (t < 2.95) pose = {};
    else if (t < tTake - .12) pose = { view: 'side', walk: sneak.walk, dy: -.9 * Math.abs(Math.sin(sneak.walk * Math.PI)), sq: -.06, aL: .9, aR: .9 };
    else if (t < tSplat) pose = { view: 'side', dy: hop.dy, sq: hop.sq, rot: .18 * ease(seg(t, tTake, tSplat)), aL: 1.2, aR: 1.2 };
    else if (t < 4.75) { const a = t - tSplat; pose = { view: 'side', sq: .35 * Math.exp(-a * 6), rot: .18 * (1 - seg(t, tSplat, 4.75)) }; }
    else if (t < 5.6) pose = turn(t, 4.75, 4.95, .25, 0);
    else pose = { ...turn(t, 5.6, 5.72, 0, .25), ...(t > 5.72 ? { view: 'side', walk: (t - 5.72) * 6 } : {}) };
    const cl = { ...mood, ...pose, dy: add(mood, pose, 'dy') * (t > 2.95 && t < 4.75 ? .3 : 1) + (pose.dy || 0) * .7, sq: add(mood, pose, 'sq'), rot: add(mood, pose, 'rot') };
    if (t < 2.35) {   // the eyes lead: they follow the butterfly in
      cl.lookX = clamp((b.p[0] - x) / 450, -1, 1); cl.lookY = clamp((b.p[1] - (GA - 6 * uA)) / 300, -1, 1);
    }
    if (t >= tSplat - .02) cl.hat = 'flower';
    // the target flower: squashed flat by the landing, then its head is gone (Clawd wears it)
    flower(FX, GA + 4, FH, t, { key: 'target', r: 30, squash: seg(t, tSplat - .06, tSplat), noHead: t > tSplat, lean: t > tSplat ? 30 : 0 });
    clawd(x, GA, uA, cl);
    // petals burst from the splat
    if (t > tSplat && t < tSplat + .8) {
      boilSeed('petals');
      const a = t - tSplat, k = seg(a, 0, .8);
      for (let i = 0; i < 7; i++) {
        const ang = -Math.PI / 2 + (i - 3) * .42, p = arcPt([FX - 20, GA - 120], [FX - 20 + Math.cos(ang) * 260, GA - 40 + 40 * hash(i)], 140 + 80 * hash(i + 3), easeOut(k));
        paint(ellPts(p[0], p[1], 12, 8, 8, 0, a * 8 + i), { wash: PAL.cream, washOp: 255 * (1 - k * k), ink: PAL.ink, sw: .4 });
      }
    }
    if (t > .6) butterfly(b.p[0], b.p[1], 46, b);
    const eye = toScreen(x, GA - 4 * uA);
    camEnd();
    streaks(seg(t, 5.7, 6.0));
    if (lt < .6) iris(...eye, lerp(0, 1500, easeIn(lt / .6)));
  }

  // ---------- shot B: the chase ----------
  const GB = 860, uB = 28, V = 560, tJ1 = 7.25, tJ1e = 7.87, tJ2 = 8.5, tFlop = 9.12;
  const runX = t => { const lt = t - 6; if (t < tFlop) return 200 + V * lt; const a = t - tFlop; return 200 + V * (tFlop - 6) + V * (1 - Math.exp(-5 * a)) / 5; };
  function shotChase(t, lt, dur) {
    const x = runX(t), xEnd = runX(99);
    const cx = x + 330 - 200 * ease(seg(t, tFlop, 10.2));
    skyAndHills(t, cx);
    camBegin(cx, 640, 1.22);
    meadow(cx - 1100, cx + 1100, GB, t);
    for (let k = Math.floor((cx - 1100) / 520); k <= (cx + 1100) / 520; k++) flower(k * 520 + 200 * hash(k + 40), GB + 8, 60 + 60 * hash(k + 41), t, { key: 'fb' + k, r: 12 + 6 * hash(k), col: hash(k + 42) > .5 ? PAL.cream : WING2 });

    // Clawd
    const mood = emotions(t, [[6, 'determined'], [9.16, 'ko'], [9.95, 'sad']]);
    const run = move('run', t), j1 = jump(t, tJ1, tJ1e, 5), j2 = jump(t, tJ2, tFlop, 3);
    let pose;
    if (t < tJ2 - .12) pose = { view: 'side', walk: t > tJ1 && t < tJ1e ? tJ1 * 2.4 : t * 2.4, dy: (t > tJ1 - .12 && t < tJ1e + .2 ? j1.dy : run.dy), sq: j1.sq, rot: -.06, aL: t > tJ1 && t < tJ1e ? 1.45 : run.aL, aR: t > tJ1 && t < tJ1e ? 1.35 : run.aR };
    else if (t < tFlop) pose = { view: 'side', walk: tJ2 * 2.4, dy: j2.dy, sq: t < tJ2 ? j2.sq : -.2, rot: .5 * ease(seg(t, tJ2, tFlop)), aL: 0, aR: 0 };
    else if (t < 9.9) { const a = t - tFlop; pose = { view: 'side', sq: .42 - .12 * seg(a, .1, .7) + .12 * Math.exp(-a * 9) * Math.cos(a * 30), rot: .5 * (1 - easeOut(seg(a, 0, .25))), aL: -.4, aR: -.4 }; }
    else pose = { ...turn(t, 9.9, 10.1, .25, 0), sq: .3 * (1 - easeOut(seg(t, 9.9, 10.2))) };
    const cl = { ...mood, ...pose, dy: (pose.dy || 0) + (t > 9.9 ? (mood.dy || 0) : 0), sq: add(mood, pose, 'sq') * (t < tFlop ? 1 : .8) + (t < tFlop ? 0 : 0), rot: pose.rot ?? mood.rot, hat: 'flower' };
    puff(runX(tJ1e) - 60, GB, t - tJ1e);   // dust behind Clawd: cream over the terracotta body mixes to purple
    puff(runX(tFlop) - 40, GB, t - tFlop);
    puff(runX(tFlop) + 80, GB, t - tFlop - .12, 1);
    clawd(x, GB, uB, cl);

    // the butterfly stays just ahead, rises out of reach of each jump, then circles back over the heap
    const ahead = s => [runX(Math.min(s, tFlop)) + 380 + 60 * Math.sin(s * 2.3), GB - 360 + 40 * Math.sin(s * 3.3) - 190 * bump(s, 7.15, 7.95) - 170 * bump(s, 8.4, 9.2)];
    const circ = s => [xEnd + 40 + 170 * Math.cos(s * 2.6), GB - 390 + 60 * Math.sin(s * 2.6)];
    const k = ease(seg(t, tFlop, 9.9)), A = ahead(t), C = circ(t), w = wobXY(t, .6);
    butterfly(lerp(A[0], C[0], k) + w[0], lerp(A[1], C[1], k) + w[1], 44, { open: flapFly(t), rot: .3 * Math.sin(t * 5) });
    camEnd();
    streaks(1 - seg(lt, 0, .35));
    if (lt > dur - .3) brushWipe((lt - (dur - .3)) / .6, WIPE);
  }

  // ---------- shot C: the landing ----------
  const GC = 900, uC = 50, XC = 960, tDown0 = 12.2, tOn = 13.5, tLook = 13.8, tSurp = 14.12, tLove = 14.75, tIris = 16.0;
  function shotLanding(t, lt, dur) {
    skyAndHills(t, 300 + 25 * lt, .85);
    const cy = 620 - 25 * ease(seg(t, 11.2, 17)), zoom = 1.02 + .16 * ease(seg(t, 12, 17.2));
    camBegin(960, cy, zoom);
    meadow(-300, W + 300, GC, t, .85);
    flower(560, GC + 20, 85, t, { key: 'c1', col: WING2, r: 16 });
    flower(1390, GC + 30, 110, t, { key: 'c2', r: 19 });
    flower(1260, GC + 40, 55, t, { key: 'c3', col: '#F4D36B', r: 12 });

    const mood = emotions(t, [[11, 'sad'], [tSurp, 'surprised', { lookY: -1, lookX: -.5 }], [tLove, 'love', { lookY: -.6, lookX: -.4 }]], { take: .45 });
    const cl = { ...mood, hat: 'flower' };
    if (t < tSurp) cl.emoteK = (mood.emoteK ?? 1) * (1 - ease(seg(t, 12.7, 13.1)));   // the rain cloud clears before the butterfly lands
    if (t < tSurp) { const k = ease(seg(t, tLook, tLook + .3)); cl.lookY = -k; cl.lookX = -.5 * k; }
    if (t > tLove) { const s = move('sway', t); cl.rot = (cl.rot || 0) * .3 + s.rot * .5; cl.dx = s.dx * .3; }
    clawd(XC, GC, uC, cl);

    // the butterfly spirals down onto the flower on Clawd's head and stays
    const hat = bodyPt(XC, GC, uC, cl, -2.6, -8.6), perch = [hat[0], hat[1] - .75 * uC];
    let p, open, rot = 0;
    if (t < tOn) {
      const k = seg(t, tDown0, tOn), e = ease(k), start = [1560, 80], rad = 230 * (1 - e);
      p = [lerp(start[0], perch[0], e) + rad * Math.cos(k * TAU * 1.25), lerp(start[1], perch[1], e) + rad * .45 * Math.sin(k * TAU * 1.25)];
      const w = wobXY(t, 1 - k); p = [p[0] + w[0], p[1] + w[1]]; open = t > tOn - .1 ? .6 : flapFly(t); rot = .3 * Math.sin(t * 4) * (1 - k);
    } else { p = perch; open = t > tLove ? .3 + .7 * (1 - pulse(t, 4)) : flapRest(t, tOn); rot = (cl.rot || 0); }
    if (t > tDown0) butterfly(p[0], p[1], 54, { open, rot });
    const heart = toScreen(XC - uC * .7, GC - 6.2 * uC);
    camEnd();
    boilSeed('transition');
    if (lt < .3) brushWipe(.5 + lt / .6, WIPE);
    if (t > tIris) {
      const r = t < tIris + .7 ? lerp(1900, 450, ease(seg(t, tIris, tIris + .7))) : t < 17.6 ? lerp(450, 410, seg(t, tIris + .7, 17.6)) : lerp(410, 0, easeIn(seg(t, 17.6, 17.95)));
      if (r < 4) iris(0, 0, 0, mixCol(PAL.night, PAL.rose, .25));
      else irisShape(heartPts(heart[0], heart[1] + r * .1, r, 40), mixCol(PAL.night, PAL.rose, .25));
    }
  }

  shots([[0, shotFlower], [6.0, shotChase], [11.0, shotLanding]]);
})();
