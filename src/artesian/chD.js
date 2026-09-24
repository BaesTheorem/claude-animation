// Chapter D · 116.30–151.94 s · Night trouble. Verse 4 (lines 27–31) and chorus 4 (lines 32–35).
// See docs/artesian/STORYBOARD.md and BRIEF.md.
//
//   D1 116.30 caving       section at the bit: walls crack, chunks fall, sand pours in; the blows land in sand
//   D2 122.92 rods         flooded cavity higher up: the yellow rods buckle a little more on every blow
//   D3 127.18 the jam      THE REFERENCE PAINTING: low angle, teal night, three men on the tongs, nothing gives
//   D4 132.68 forty h.p.   smash cut to the gauge climbing into the red; pull back: engine shaking, steam jets, Bill stoking
//   D5 135.14 it frees     cut on the engine's lurch: the pipe jolts loose, the men stagger
//   D6 136.94 the beam     whip-pan to the walking beam slamming down on the beat
//   D7 139.38 the ram      cut on the drop: the bit rams the rock, cracks run; its flare match-cuts to the lantern
//   D8 140.47 chorus       night rhythm by lantern: the driller's sledge on every "down", the hands on the bull rope
//   D9 146.20 dive         hatched iris into the bore, dive in dark rock to 2700 ft
//
// Chapter-local helpers (nothing here edits shared files): nightSky, farRigs, probe/ik (arm IK for man()), backMan (the
// driller drawn from behind), siltWipe, speedLines, hatchIris, shovel, bucket, chain, jet.
(() => {
  const bt = n => OFF + n * BEAT;                     // time of beat n
  const nextBeat = t => bt(Math.ceil(bpOf(t) - 1e-6));
  const MUD = mixCol(AP.earthDk, AP.tealDk, .45), SAND = mixCol('#D9BF8A', AP.teal, .18);

  // ---------- night ----------
  function nightSky(o = {}) {
    sky(AP.night, AP.teal, { tone: .9, split: o.split ?? .72, hatch: .7, still: true, y1: o.y1 });
    seed('dSkyX');
    pshade(rectPts(-80, -60, W + 160, (o.y1 ?? 960) + 60), AP.tealDk, .45, { kind: 'x', still: true });
    // long hand-hatched strokes across the sky, like the painting's
    for (let i = 0; i < 34; i++) {                     // loose cross-hatched patches, the painting's sky strokes
      const x = hash(i * 3.31) * (W + 200) - 100, y = hash(i * 5.17) * (o.hy ?? 640), a = HAND + 1.3 + (hash(i * 7.7) - .5) * .2;
      for (let j = 0; j < 4; j++) { const L = 30 + hash(i * 1.9 + j) * 40, ox = j * 9, oy = j * 5; pline([[x + ox, y + oy], [x + ox + Math.cos(a) * L, y + oy + Math.sin(a) * L]], .8, AP.tealDk, { passes: 1, over: 0, alpha: .6, j: .5 }); }
    }
    for (let i = 0; i < 26; i++) {                     // a few stars, twinkling out of step
      const x = hash(i * 11.3) * W, y = hash(i * 13.9) * (o.sy ?? 420), r = 1.5 + hash(i * 2.2) * 2.2, tw = .5 + .5 * Math.sin(T * (2 + hash(i) * 3) + i);
      pglow(x, y, r * 5, AP.bone, .25 + .25 * tw);
      pfill(ellPts(x, y, r, r, 6), AP.bone, { tone: .5 + .4 * tw, dens: .2, ink: null });
    }
  }
  // distant timber derricks on a low horizon, each with its own lantern
  function farRigs(yH, list, key) {
    const col = mixCol(AP.tealDk, AP.night, .35);
    seed('dHorz' + key);
    const hp = []; for (let k = 0; k <= 12; k++) hp.push([lerp(-100, W + 100, k / 12), yH + 5 * Math.sin(k * 2.1) + 4 * hash(k)]);
    pfill(hp.concat([[W + 100, yH + 400], [-100, yH + 400]]), mixCol(AP.night, AP.earthDk, .25), { tone: .8, dens: .9, ink: null, still: true });
    for (const [x, h, k] of list) {
      pglow(x + h * .05, yH - h * .08, h * .22, AP.lamp, .45 + .1 * Math.sin(T * 5 + k));
      derrick(x, yH, h, { col, key: 'far' + key + k, floor: false, bays: 5 });
    }
  }
  function lampFlicker(t, k = 0) { return 1 + .07 * Math.sin(t * 13.1 + k) + .05 * Math.sin(t * 23.7 + k * 2) + .03 * Math.sin(t * 41 + k); }
  // hanging lantern with its wire, a warm big glow first (it lights the scene) then the lamp itself
  function hangLamp(nail, len, s, t, swing = 0, big = 1) {
    const a = .05 * Math.sin(t * 1.6) + swing, p = [nail[0] + Math.sin(a) * len, nail[1] + Math.cos(a) * len], fl = lampFlicker(t);
    pglow(p[0], p[1], 520 * big * fl, AP.rust, .5 * big);
    pglow(p[0], p[1], 230 * big * fl, AP.lamp, .75 * big);
    seed('dLampWire' + nail[0]);
    pline([nail, [p[0], p[1] - 2 * s]], .9, AP.iron, { over: 0, passes: 1 });
    lantern(p[0], p[1], s, fl);
    return p;
  }

  // ---------- figures: probe the rig for joints, solve arms to targets ----------
  const _dc = document.createElement('canvas'); _dc.width = _dc.height = 8; const _dx = _dc.getContext('2d');
  function probe(fn) { const keep = X; X = _dx; try { return fn(); } finally { X = keep; } }
  // two-bone arm IK for the rig's angle convention (0 = straight down, + = forward/outward for side d)
  function ik(sh, tg, s, look, d) {
    const tall = look.tall || 1, up = 1.5 * s * tall, fl = 1.4 * s * tall + .32 * s;
    const vx = tg[0] - sh[0], vy = tg[1] - sh[1], D = clamp(Math.hypot(vx, vy), Math.abs(up - fl) + 1, up + fl - .5);
    const ang = Math.atan2(vx * d, vy), al = Math.acos(clamp((up * up + D * D - fl * fl) / (2 * up * D), -1, 1));
    const a1 = ang + (ang >= 0 ? -1 : 1) * al;                       // elbow hangs low
    const el = [sh[0] + Math.sin(a1) * d * up, sh[1] + Math.cos(a1) * up];
    let e = Math.atan2((tg[0] - el[0]) * d, tg[1] - el[1]) - a1;
    while (e > Math.PI) e -= TAU; while (e < -Math.PI) e += TAU;
    return [a1, e];
  }
  // side-view man with hands on targets (tgt.F / tgt.B in world space)
  function reach(key, x, y, s, pose, look, tgt, hooks = {}) {
    const P = { ...pose }, d = P.flip ? -1 : 1;
    if (tgt) {
      const J0 = probe(() => man(x, y, s, P, look));
      if (tgt.F) [P.shF, P.elF] = ik(J0.shF, tgt.F, s, look, d);
      if (tgt.B) [P.shB, P.elB] = ik(J0.shB, tgt.B, s, look, d);
    }
    seed(key); return man(x, y, s, P, look, hooks);
  }
  // The driller from behind: the rig's front view with the head repainted as the back of the head, the whole figure
  // rotated about his feet so he leans into the work. Arms reaching forward sit behind the torso, as they should.
  function backHead(J, L) {
    const c = J.head, s = J.s, b = L.build || 1, sw = Math.max(.7, s / 55);
    pfill(limb([J.neck, lerp2(J.neck, c, .75)], [.95 * s * b, .7 * s * Math.min(1.2, b)]), L.skin, { tone: .62, sw });
    pshade(limb([J.neck, lerp2(J.neck, c, .6)], [.5 * s * b, .4 * s]), L.skinDk, .55);
    for (const sd of [-1, 1]) pfill(ellPts(c[0] + sd * .5 * s, c[1] + .02 * s, .11 * s, .17 * s, 8), L.skin, { tone: .6, sw });
    for (const sd of [-1, 1]) pfill([[c[0] + sd * .4 * s, c[1] + .3 * s], [c[0] + sd * .55 * s, c[1] + .45 * s], [c[0] + sd * .42 * s, c[1] + .68 * s], [c[0] + sd * .3 * s, c[1] + .5 * s]], L.beardCol, { tone: .8, dens: 1.1, sw: sw * .8, curv: true });
    pfill(ellPts(c[0], c[1] + .05 * s, .5 * s, .6 * s, 22), L.skin, { tone: .6, dens: .7, sw });
    // a thick fringe of black hair round the back of the head, down to the nape: nothing here reads as a face
    pfill([[c[0] - .5 * s, c[1] - .3 * s], [c[0] + .5 * s, c[1] - .3 * s], [c[0] + .5 * s, c[1] + .15 * s], [c[0] + .3 * s, c[1] + .45 * s], [c[0], c[1] + .52 * s], [c[0] - .3 * s, c[1] + .45 * s], [c[0] - .5 * s, c[1] + .15 * s]], L.hair, { tone: .85, dens: 1.2, sw, curv: true });
    for (let i = 0; i < 7; i++) pline([[c[0] + (i - 3) * .13 * s, c[1] + .28 * s], [c[0] + (i - 3) * .12 * s, c[1] + .5 * s - Math.abs(i - 3) * .05 * s]], sw * .7, L.hair, { over: 0, passes: 1 });
    pshade(ellPts(c[0] + .25 * s, c[1] + .7 * s, .35 * s, .2 * s, 12), L.skinDk, .8);   // shadow of the skull on the neck
    const hc = L.hatCol, bw = 1.05 * s;
    pfill([[c[0] - .5 * s, c[1] - .42 * s], [c[0] - .45 * s, c[1] - .95 * s], [c[0], c[1] - 1.05 * s], [c[0] + .45 * s, c[1] - .95 * s], [c[0] + .5 * s, c[1] - .42 * s]], hc, { tone: .72, dens: .95, sw, curv: true });
    pline([[c[0] - .5 * s, c[1] - .5 * s], [c[0] + .5 * s, c[1] - .5 * s]], sw * 2.4, mixCol(hc, AP.graphite, .5), { over: 0 });
    pfill([[c[0] - bw, c[1] - .36 * s], [c[0], c[1] - .5 * s], [c[0] + bw, c[1] - .36 * s], [c[0] + bw * .9, c[1] - .26 * s], [c[0], c[1] - .32 * s], [c[0] - bw * .9, c[1] - .26 * s]], hc, { tone: .78, dens: 1, sw, curv: true });
  }
  function backMarks(J, L) {
    const s = J.s, n = J.neck, h = J.hip;
    pline([[n[0], n[1] + .4 * s], lerp2([n[0], n[1] + .4 * s], h, .5), [h[0], h[1] - .3 * s]], Math.max(.7, s / 55) * 1.1, mixCol(L.shirt, AP.graphite, .55), { curv: true, over: 0 });
    for (const sd of [-1, 1]) pline([[n[0] + sd * .9 * s, n[1] + .6 * s], [n[0] + sd * .45 * s, n[1] + 1.1 * s], [n[0] + sd * .6 * s, n[1] + 1.6 * s]], Math.max(.7, s / 55), mixCol(L.shirt, AP.graphite, .45), { curv: true, over: 0, passes: 1 });
    pshade([[n[0] + .15 * s, n[1] + .5 * s], [n[0] + 1.2 * s, n[1] + .5 * s], [h[0] + .9 * s, h[1] - .3 * s], [h[0] + .15 * s, h[1] - .3 * s]], AP.graphite, .45);
  }
  function backMan(key, x, y, s, pose, look, tgt, rot) {
    const P = { ...pose, view: 'front', face: 'closed', blink: 1 }, loc = p => rot2(p, -rot, [x, y]);
    if (tgt) {
      const J0 = probe(() => man(x, y, s, P, look));
      if (tgt.F) [P.shF, P.elF] = ik(J0.shF, loc(tgt.F), s, look, 1);
      if (tgt.B) [P.shB, P.elB] = ik(J0.shB, loc(tgt.B), s, look, -1);
    }
    X.save(); X.translate(x, y); X.rotate(rot); X.translate(-x, -y);
    seed(key); const J = man(x, y, s, P, look, { hold: J => { backMarks(J, look); backHead(J, look); } });
    X.restore();
    const out = {}; for (const k in J) out[k] = Array.isArray(J[k]) && typeof J[k][0] === 'number' ? rot2(J[k], rot, [x, y]) : J[k];
    return out;
  }
  // sweat: drops that bead at p and run/fall, each on its own clock
  function sweat(p, s, t, k, n = 2) {
    for (let i = 0; i < n; i++) {
      const per = 1.1 + hash(k * 7 + i) * .9, q = frac(t / per + hash(k * 3 + i)), dx = (hash(k + i * 5) - .5) * .5 * s;
      const y = p[1] + (q < .45 ? 0 : Math.pow((q - .45) / .55, 2) * 2.4 * s), a = q < .9 ? 1 : (1 - q) * 10;
      seed('dSw' + k + i);
      pfill(ellPts(p[0] + dx, y, .06 * s, .09 * s * (q < .45 ? .7 + q : 1.2), 7), mixCol(AP.paperLt, AP.waterLt, .3), { tone: .75 * a, dens: .3, ink: null });
      if (a > .3) pglow(p[0] + dx - .02 * s, y - .03 * s, .12 * s, AP.lamp, .5 * a);
    }
  }

  // ---------- props ----------
  function bucket(x, y, s) {
    seed('dBucket');
    pfill([[x - .55 * s, y - 1.1 * s], [x + .55 * s, y - 1.1 * s], [x + .42 * s, y], [x - .42 * s, y]], mixCol(AP.timberDk, AP.iron, .3), { tone: .75, dens: 1, sw: 1.1 });
    for (const k of [.25, .75]) pline([[x - lerp(.55, .42, k) * s, y - 1.1 * s + k * 1.1 * s], [x + lerp(.55, .42, k) * s, y - 1.1 * s + k * 1.1 * s]], 1.3, AP.iron, { over: 0 });
    pfill(ellPts(x, y - 1.1 * s, .55 * s, .12 * s, 14), AP.coal, { tone: .85, sw: .9 });
    pline([[x - .55 * s, y - 1.05 * s], [x - .3 * s, y - 1.75 * s], [x + .3 * s, y - 1.75 * s], [x + .55 * s, y - 1.05 * s]], 1, AP.iron, { curv: true, over: 0 });
    plit([[x - .45 * s, y - 1 * s], [x - .25 * s, y - 1 * s], [x - .2 * s, y - .1 * s], [x - .36 * s, y - .1 * s]], .55, mixCol(AP.lamp, AP.paperLt, .4));
  }
  function chain(P, s, key) {                          // links along a path, alternating face-on and edge-on
    seed('dChain' + key); const C = through(P, 10);
    let acc = 0;
    for (let i = 1; i < C.length; i++) {
      const d = Math.hypot(C[i][0] - C[i - 1][0], C[i][1] - C[i - 1][1]); acc += d; if (acc < s * .8) continue; acc = 0;
      const a = Math.atan2(C[i][1] - C[i - 1][1], C[i][0] - C[i - 1][0]), face = i % 2;
      pline(ellPts(C[i][0], C[i][1], s * .55, s * (face ? .3 : .08), 10, 0, a), face ? 1.2 : 1.6, AP.iron, { closed: true, passes: 1, j: .4 });
    }
  }
  function shovel(grip, ang, s, coal) {
    seed('dShovel');
    const u = [Math.cos(ang), Math.sin(ang)], n = [-u[1], u[0]], a = [grip[0] - u[0] * 1.1 * s, grip[1] - u[1] * 1.1 * s], b = [grip[0] + u[0] * 2.3 * s, grip[1] + u[1] * 2.3 * s];
    pfill(limb([a, b], [.2 * s, .2 * s]), AP.pine, { tone: .7, sw: .8 });
    const q = (x, y) => [b[0] + u[0] * x + n[0] * y, b[1] + u[1] * x + n[1] * y];
    pfill([q(0, -.45 * s), q(1.1 * s, -.5 * s), q(1.25 * s, 0), q(1.1 * s, .5 * s), q(0, .45 * s)], AP.iron, { tone: .85, dens: 1, sw: 1 });
    if (coal > 0) for (let i = 0; i < 5; i++) pfill(ellPts(...q((.3 + hash(i) * .7) * s, (hash(i * 3) - .5) * .6 * s), .18 * s * coal, .14 * s * coal, 6), AP.coal, { tone: .95, sw: .6 });
  }
  // steam jet from a nozzle along angle a; str 0..1
  function jet(key, p, a, s, t, str) {
    if (str <= 0) return;
    seed('dJet' + key); const u = [Math.cos(a), Math.sin(a)];
    for (let i = 0; i < 7; i++) {
      const k = frac(t * 3.2 + i / 7 + hash(key.length + i)), L = (1.2 + 5.5 * k) * s * str;
      psmoke(p[0] + u[0] * L + Math.sin(k * 9 + i) * .3 * s, p[1] + u[1] * L - k * k * 1.5 * s, s * (.25 + k * 1.3) * str, AP.paperLt, .7 * (1 - k) * str);
    }
    for (let i = 0; i < 3; i++) pline([p, [p[0] + u[0] * (1.8 + i * .6) * s * str + jit(3), p[1] + u[1] * (1.8 + i * .6) * s * str + jit(3)]], 1.4, AP.paperLt, { over: 0, passes: 1, alpha: .8 * str });
  }

  // ---------- transitions of this chapter ----------
  function siltWipe(p) {                                // mud boils up to fill the frame (0 → .5), settles away (.5 → 1)
    if (p <= 0 || p >= 1) return;
    const cover = p < .5 ? easeOut(p * 2) : 1 - ease((p - .5) * 2);
    seed('dSilt');
    for (let i = 0; i < 16; i++) {
      const x = hash(i * 4.1) * W, y = lerp(1000, hash(i * 2.7) * 900, cover) - (p > .5 ? (p - .5) * 300 : 0), r = 160 + hash(i * 1.3) * 260;
      psmoke(x, y, r * (.4 + cover), mixCol(MUD, AP.dust, .25 + hash(i) * .45), .95 * cover);
    }
    ptone(rectPts(-40, -40, W + 80, H + 80), MUD, clamp(cover * 1.02));
    pshade(rectPts(-40, -40, W + 80, H + 80), AP.earthDk, cover * 1.1);
    for (let i = 0; i < 12; i++) psmoke(hash(i * 6.1) * W, hash(i * 8.3) * 900 - T * 60 % 200, 120 + hash(i) * 160, mixCol(MUD, AP.dust, .5), .5 * cover);
  }
  function speedLines(k, vert, key) {
    if (k <= .02) return;
    seed('dSpd' + key);
    ptone(rectPts(-40, -40, W + 80, H + 80), AP.paper, .75 * k);
    for (let i = 0; i < 54; i++) {
      const a = hash(i * 3.7 + key.length), b = hash(i * 9.1), L = 200 + hash(i * 5.3) * 600, w = .7 + hash(i * 2.1) * 1.6;
      if (vert) { const x = a * W, y = b * (H + L) - L; pline([[x, y], [x, y + L]], w, AP.graphite, { alpha: k * .85, passes: 1, over: 0 }); }
      else { const y = a * 890, x = b * (W + L) - L; pline([[x, y], [x + L, y]], w, AP.graphite, { alpha: k * .85, passes: 1, over: 0 }); }
    }
  }
  function hatchIris(cx, cy, r) {                       // graphite closes in around (cx, cy), leaving a hole of radius r
    seed('dIris');
    X.save(); X.beginPath(); X.rect(-60, -60, W + 120, H + 120); X.arc(cx, cy, Math.max(0, r), 0, TAU); X.clip('evenodd');
    ptone(rectPts(-60, -60, W + 120, H + 120), AP.night, .93);
    pshade(rectPts(-60, -60, W + 120, H + 120), AP.graphite, 1.6);
    X.restore();
    if (r > 3) pline(ellPts(cx, cy, r, r, 44, r * .015), 2, AP.graphite, { closed: true });
  }
  const seamIn = lt => { if (lt < .35) scribbleWipe(.5 + lt / .7); };
  const seamOut = (lt, dur) => { if (lt > dur - .35) scribbleWipe((lt - (dur - .35)) / .7); };

  // ---------- D1 · 116.30 · the shaft caving ----------
  const X0 = 960, SW = 17;                                   // shaft centre and half-width (world)
  const CAVE_B0 = bt(218);                                   // first blow of the chapter (116.66), then every 4 beats
  const cyc = 4 * BEAT;
  const D1 = {
    d0: 2148,
    chunks: [ // side, y above the bit (world), height, depth into the wall, break time (lt)
      [-1, 98, 16, 12, 2.56], [1, 78, 13, 10, 2.7], [-1, 62, 12, 9, 2.95], [1, 114, 16, 11, 3.3], [-1, 40, 10, 8, 3.75],
      [1, 46, 13, 10, 4.72], [-1, 128, 14, 10, 5.0], [1, 24, 9, 7, 5.35],
    ],
    sands: [[-1, 84, 2.62], [1, 98, 2.9], [-1, 120, 4.8]],   // side, y above the bit, start (lt)
  };
  function bitLift(t) {                                     // slow lift, fast drop onto each 4-beat blow; world px
    const q = frac((t - CAVE_B0) / cyc);
    return q < .12 ? 0 : q < .86 ? 26 * easeOut((q - .12) / .74) : 26 * (1 - easeIn((q - .86) / .14));
  }
  function caving(t, lt, dur) {
    const blows = Math.max(0, Math.floor((t - CAVE_B0) / cyc) + 1), depth = D1.d0 + blows * .8, bY = depth * FT;
    const lastB = CAVE_B0 + (blows - 1) * cyc, since = t - lastB, onRock = lastB < 119.5;
    const heap = 30 * ease(seg(lt, 2.7, 6.4));               // sand heap height at the bottom (world)
    const z = lerp(4.0, 4.4, ease(lt / dur)), hitK = Math.exp(-since * 7), sh = shakeXY(t, hitK * (onRock ? 6 : 3));
    camOn(X0 + sh[0], bY - 70 / z + sh[1], z);
    section(X0, depth - 260, depth + 160, { halfW: 700 });
    seed('dNightTint1'); ptone(rectPts(X0 - 900, bY - 700, 1800, 1300), AP.tealDk, .28);
    // cracks creep outward from the wall where it will give
    for (const [sd, yy, h, w, tb] of D1.chunks) {
      const k = seg(lt, tb - 1.6, tb + .1), y = bY - yy;
      if (k <= 0) continue; seed('dCr' + yy);
      const e = X0 + sd * SW, P = [[e, y - h * .1], [e + sd * w * .9, y + h * .1], [e + sd * w * 1.3, y + h * .6], [e + sd * w * 2.2, y + h * 1.3]];
      pline(partial(P, k), .9, AP.graphite, { over: 0, passes: 1 });
      pline(partial([[e + sd * w * .9, y + h * .1], [e + sd * w * 1.6, y - h * .5]], k), .7, AP.graphite, { over: 0, passes: 1 });
    }
    // the shaft: a dark slot whose walls lose bites where chunks have broken away
    seed('dShaft1');
    const side = sd => {
      const pts = [[X0 + sd * SW, bY - 800]], bites = D1.chunks.filter(c => c[0] === sd).sort((a, b) => b[1] - a[1]);
      for (const [, yy, h, w, tb] of bites) {
        const k = ease(seg(lt, tb, tb + .12)), y = bY - yy; if (k <= 0) continue;
        pts.push([X0 + sd * SW, y - h * .15], [X0 + sd * (SW + w * k), y + h * .15], [X0 + sd * (SW + w * .8 * k), y + h * .9], [X0 + sd * SW, y + h * 1.05]);
      }
      pts.push([X0 + sd * SW, bY + 12]); return pts;
    };
    const L = side(-1), R = side(1).reverse();
    pfill(L.concat(R), AP.coal, { tone: .9, dens: 1, ink: null });
    pline(L, 1.3, AP.ironLt, { over: 0 }); pline(R, 1.3, AP.ironLt, { over: 0 });
    // rods and bit
    const lift = bitLift(t), tip = bY - lift;
    rods(X0, bY - 800, tip - 26, { w: 7 });
    bit(X0, tip, 12, { hit: onRock ? hitK : 0 });
    // falling chunks: gravity, a tumble, then they settle on the heap
    const floorY = bY + 12 - heap;
    for (const [sd, yy, h, w, tb] of D1.chunks) {
      const dt = lt - tb; if (dt < 0) continue;
      const y0 = bY - yy + h * .4, y = Math.min(floorY - 3 - hash(yy) * 4, y0 + 1200 * dt * dt), landed = y0 + 1200 * dt * dt >= floorY - 3 - hash(yy) * 4;
      const x = X0 + sd * lerp(SW + w * .4, 4 + hash(yy * 3) * 8, ease(clamp(dt * 3))), r = (landed ? 1 : dt) * 5 * sd + sd * hash(yy);
      seed('dChunk' + yy);
      const pc = [[-w * .5, -h * .5], [w * .45, -h * .45], [w * .55, h * .2], [w * .1, h * .55], [-w * .5, h * .4]].map(p => add2([x, y], rot2([p[0] * .8, p[1] * .7], r)));
      pfill(pc, mixCol('#4A4440', AP.paperLt, .22), { tone: .85, dens: 1, sw: .8 });
      if (!landed) for (let i = 0; i < 2; i++) pline([[x + (i - .5) * w * .5, y - h * .6], [x + (i - .5) * w * .5, y - h * .6 - 26]], .6, AP.graphiteLt, { over: 0, passes: 1 });
    }
    // sand streams out of the cracks, grains falling to the heap
    for (const [sd, yy, ts] of D1.sands) {
      const k0 = seg(lt, ts, ts + .3); if (k0 <= 0) continue;
      const m = [X0 + sd * SW, bY - yy], fall = floorY - m[1];
      seed('dSand' + yy);
      const P = []; for (let i = 0; i <= 8; i++) { const u = i / 8 * k0; P.push([m[0] - sd * (4 + 10 * Math.sqrt(u)), m[1] + u * u * fall]); }
      pfill(limb(P, [5, 4, 3.5, 3]), SAND, { tone: .6, dens: .9, sw: .5 });
      for (let j = 0; j < 14; j++) {
        const u = frac(lt * 1.9 + j / 14) * k0, gx = m[0] - sd * (4 + 12 * Math.sqrt(u)) + (hash(j + yy) - .5) * 6;
        pfill(ellPts(gx, m[1] + u * u * fall, 1.2, 1.2, 5), SAND, { tone: .9, ink: null });
      }
    }
    // the heap buries the bit; blows into it only raise a puff of sand
    if (heap > 1) {
      seed('dHeap');
      const hp = [[X0 - SW - 2, bY + 12]]; for (let i = 0; i <= 10; i++) { const u = i / 10; hp.push([X0 - SW + u * 2 * SW, bY + 12 - heap * (.55 + .45 * Math.sin(u * Math.PI)) - (hash(i) - .5) * 3]); }
      hp.push([X0 + SW + 2, bY + 12]);
      pfill(hp, SAND, { tone: .75, dens: 1, sw: .8 });
      pshade(hp.map(p => [p[0] + 4, p[1] + 5]), AP.earthDk, .6);
      if (!onRock && since < 1) for (let i = 0; i < 4; i++) psmoke(X0 + (hash(i) - .5) * 26, bY - heap - since * 40 * (1 + hash(i + 2)), 8 + since * 22, SAND, .7 * (1 - since));
    }
    ruler(X0 - 120, depth - 250, depth + 150, depth, { step: 10 });
    camOff();
    seamIn(lt);
    if (lt > dur - .3) siltWipe((lt - (dur - .3)) / .6);
  }

  // ---------- D2 · 122.92 · rods bending in the water down below ----------
  const RB = [230, 232, 234, 236].map(bt);                    // a blow every 2 beats
  function rodsBend(t, lt, dur) {
    const d = 2080, cy = d * FT, z = lerp(1.85, 2.0, ease(lt / dur));
    let base = 14, kick = 0;
    for (const b of RB) if (t >= b) { base += 15; kick += Math.exp(-(t - b) * 4.5) * Math.cos((t - b) * 16) * 22; }
    const amp = base + kick, hitK = RB.reduce((a, b) => a + (t >= b ? Math.exp(-(t - b) * 8) : 0), 0), sh = shakeXY(t, hitK * 4);
    camOn(X0 + sh[0], cy + sh[1], z);
    section(X0, d - 300, d + 300, { halfW: 700 });
    seed('dNightTint2'); ptone(rectPts(X0 - 900, cy - 700, 1800, 1400), AP.tealDk, .3);
    // the caved, flooded cavity (ragged, washed out wide), narrowing to the bore above and below
    seed('dCav');
    const top = cy - 330, bot = cy + 330, CV = [];
    for (let i = 0; i <= 14; i++) { const u = i / 14, y = lerp(top, bot, u), wdt = SW + (150 + 40 * Math.sin(u * 7 + 1)) * Math.pow(Math.sin(u * Math.PI), .6); CV.push([X0 - wdt - hash(i) * 14, y]); }
    for (let i = 14; i >= 0; i--) { const u = i / 14, y = lerp(top, bot, u), wdt = SW + (140 + 45 * Math.sin(u * 5 + 3)) * Math.pow(Math.sin(u * Math.PI), .6); CV.push([X0 + wdt + hash(i + 30) * 14, y]); }
    pfill(CV, AP.coal, { tone: .9, dens: 1, ink: AP.ironLt, sw: 1.2 });
    // muddy water fills it below the surface line
    const wl = cy - 170;
    X.save(); tracePath(CV); X.clip();
    pfill(rectPts(X0 - 400, wl, 800, 700), MUD, { tone: .8, dens: 1, ink: null });
    pshade(rectPts(X0 - 400, wl + 60, 800, 700), AP.tealDk, .5, { kind: 'x' });
    seed('dSiltDrift');
    for (let i = 0; i < 40; i++) { const x = X0 + (hash(i * 3) - .5) * 360 + Math.sin(t * .8 + i) * 10, y = wl + 20 + frac(hash(i * 5) + t * .03 * (1 + hash(i))) * 480; pfill(ellPts(x, y, 1.8, 1.4, 5), mixCol(MUD, AP.dust, .6), { tone: .8, ink: null }); }
    pline([[X0 - 400, wl], [X0 + 400, wl]], 1.1, mixCol(AP.teal, AP.paperLt, .3), { over: 0 });
    for (let i = 0; i < 3; i++) { const k = frac(t * .9 + i / 3); pline(ellPts(X0 + Math.sin(t) * 3, wl, 20 + k * 90, 3 + k * 6, 20), .8, mixCol(AP.teal, AP.paperLt, .4), { closed: true, passes: 1, alpha: 1 - k }); }
    X.restore();
    // the yellow rod string, buckling: one long bow plus an S, pinned top and bottom
    seed('dRodS');
    const RP = []; for (let i = 0; i <= 22; i++) { const u = i / 22, y = lerp(cy - 700, cy + 700, u), inCav = Math.pow(Math.sin(clamp((y - top) / (bot - top)) * Math.PI), 1.2);
      RP.push([X0 + inCav * (amp * Math.sin(u * Math.PI * 2 - .9) + amp * .35 * Math.sin(u * Math.PI * 5 + t * 1.3)), y]); }
    pfill(limb(RP, RP.map(() => 9)), AP.pine, { tone: .75, dens: .9, sw: 1 });
    plit(limb(RP.map(p => [p[0] - 2, p[1]]), RP.map(() => 3)), .6, mixCol(AP.lamp, AP.paperLt, .5));
    for (let i = 2; i < RP.length; i += 4) pfill(rectPts(RP[i][0] - 8, RP[i][1] - 5, 16, 10), AP.iron, { tone: .9, sw: .6 });
    // bubbles rising round the rods; silt shaken off the walls on each blow
    seed('dBub');
    for (let i = 0; i < 16; i++) { const k = frac(t * .35 + hash(i * 7)), y = lerp(bot - 40, wl + 6, k), x = X0 + (hash(i) - .5) * 200 + Math.sin(k * 12 + i) * 6; if (y > wl) pline(ellPts(x, y, 2 + hash(i) * 3, 2 + hash(i) * 3, 8), .7, mixCol(AP.waterLt, AP.paperLt, .4), { closed: true, passes: 1, alpha: .8 }); }
    for (const b of RB) { const e = t - b; if (e < 0 || e > 1.2) continue; for (let i = 0; i < 5; i++) psmoke(X0 + (i % 2 ? 1 : -1) * (120 + hash(i + b) * 40), cy - 60 + (hash(i * 3 + b) - .3) * 300, 20 + e * 50, mixCol(MUD, AP.dust, .5), .6 * (1 - e / 1.2)); }
    ruler(X0 - 300, d - 240, d + 240, null, { step: 10 });
    camOff();
    if (lt < .3) siltWipe(.5 + lt / .6);
  }

  // ---------- D3 / D5 · 127.18 · the jam (the reference painting) and its release ----------
  const PX = 960, COL_Y = 372, FLOOR = 812;                    // pipe x, collar top, front edge of the floor
  const REL = bt(253);                                        // 135.35: the pipe breaks loose, on the beat
  const LAMP_NAIL = [215, 150];
  function floorScene(t, lt, dur, rel) {
    const dr = rel ? t - REL : -1, free = dr > 0;
    const jolt = free ? 95 * easeOut(clamp(dr / .09)) + 60 * Math.max(0, dr - .09) : 0;            // the pipe jumps, then rides up
    const shk = free ? shakeXY(t, 16 * Math.exp(-dr * 5)) : [0, 0];
    const bar = pulse(t - 0 * BEAT, 2.2) * (bpOf(t) % 4 < 1 ? 1 : .35);                          // a heave on each bar, harder on the downbeat
    const strain = rel && free ? 0 : 1;
    const tr = k => strain * (Math.sin(t * 43 + k) * .5 + Math.sin(t * 27.3 + k * 2) * .5);       // trembling
    nightSky({ y1: 960, hy: 720 });
    const z = rel ? 1.06 : lerp(1, 1.06, ease(lt / dur)), whip = rel && lt > dur - .3 ? easeIn((lt - (dur - .3)) / .3) : 0;
    camOn(960 + shk[0] + whip * 700, 520 + shk[1] - (rel ? 0 : 0), z);
    farRigs(735, [[150, 330, 1], [560, 250, 2], [1480, 380, 3], [1830, 290, 4]], 'p');
    // our derrick's back legs and a brace, lit from below
    seed('dBackLegs');
    for (const [a, b] of [[[640, 812], [860, -120]], [[1300, 812], [1080, -120]]]) pfill(limb([a, b], [30, 22]), mixCol(AP.timberDk, AP.tealDk, .45), { tone: .7, dens: .9, sw: 1 });
    pfill(limb([[700, 300], [1240, 300]], [16, 16]), mixCol(AP.timberDk, AP.tealDk, .45), { tone: .7, dens: .9, sw: .9 });
    pline([[760, 60], [1200, 300]], 2, mixCol(AP.timberDk, AP.tealDk, .45), { over: 0 });
    // the lantern lights everything: its glow goes down first
    LIGHT = [.93, .37];
    const lampSwing = free ? spring(t, REL, 3, 9) * .35 : 0;
    const lp = [LAMP_NAIL[0] + Math.sin(.05 * Math.sin(t * 1.6) + lampSwing) * 170, LAMP_NAIL[1] + 170];
    pglow(lp[0], lp[1], 900 * lampFlicker(t), AP.rust, .34);
    // the pipe and its collar (rides up when it frees)
    seed('dPipe');
    const py = -jolt;
    pfill(rectPts(PX - 30, -200, 60, FLOOR + 220), AP.iron, { tone: .85, dens: 1, sw: 1.3 });
    plit(rectPts(PX - 24, -200, 12, FLOOR + 220), .7, mixCol(AP.lamp, AP.paperLt, .35), { kind: 'v' });
    pshade(rectPts(PX + 8, -200, 20, FLOOR + 220), AP.graphite, 1.2);
    for (let i = 0; i < 6; i++) pline([[PX - 30, 120 + i * 120 + py % 120], [PX + 30, 120 + i * 120 + py % 120]], .6, AP.ironLt, { over: 0, passes: 1 });
    seed('dCollar');
    const cT = COL_Y + py, cB = cT + 140, CW = 118;
    pfill([[PX - CW, cT + 16], [PX - CW + 16, cT], [PX + CW - 16, cT], [PX + CW, cT + 16], [PX + CW, cB - 16], [PX + CW - 16, cB], [PX - CW + 16, cB], [PX - CW, cB - 16]], AP.iron, { tone: .9, dens: 1.1, sw: 2 });
    pfill([[PX - CW - 8, cT + 10], [PX + CW + 8, cT + 10], [PX + CW + 8, cT + 30], [PX - CW - 8, cT + 30]], AP.ironLt, { tone: .8, dens: 1, sw: 1.4 });
    pfill([[PX - CW - 8, cB - 30], [PX + CW + 8, cB - 30], [PX + CW + 8, cB - 10], [PX - CW - 8, cB - 10]], AP.ironLt, { tone: .8, dens: 1, sw: 1.4 });
    plit([[PX - CW + 10, cT + 34], [PX - 50, cT + 34], [PX - 50, cB - 34], [PX - CW + 10, cB - 34]], .9, mixCol(AP.lamp, AP.rust, .25));
    plit([[PX - CW + 4, cT + 12], [PX - 20, cT + 12], [PX - 20, cT + 26], [PX - CW + 4, cT + 26]], .8, AP.lamp);
    pshade([[PX + 30, cT + 8], [PX + CW - 2, cT + 16], [PX + CW - 2, cB - 16], [PX + 30, cB - 8]], AP.graphite, 1.5);
    for (let i = 0; i < 6; i++) pfill(ellPts(PX - 92 + i * 37, cT + 70, 8, 8, 8), i < 3 ? mixCol(AP.ironLt, AP.lamp, .3) : AP.ironLt, { tone: .9, sw: .8 });
    if (free && dr < .5) for (let i = 0; i < 6; i++) pline([[PX - 100 + i * 40, cB + 20 + 40 * hash(i)], [PX - 100 + i * 40, cB + 110 + 60 * hash(i)]], 1.2, AP.paperLt, { over: 0, passes: 1, alpha: 1 - dr / .5 });
    // tong jaws round the pipe under the collar
    const jl = [PX - 18, cB + 34 + py * .9], jr = [PX + 18, cB + 18 + py * .9];
    const swingL = free ? -.35 * easeOut(clamp(dr / .35)) + spring(t, REL + .35, 4, 10) * .1 : 0, swingR = free ? .3 * easeOut(clamp(dr / .3)) : 0;
    const hL = add2(jl, rot2([-200, 36], swingL)), hR = add2(jr, rot2([520, 70], swingR));
    // hand2 (behind, taller, reaching out along the handle) and hand1 (low, heaving)
    const along = (k, dy = 0) => [lerp(jr[0], hR[0], k), lerp(jr[1], hR[1], k) + dy];
    const ds = k => free ? easeOut(clamp((dr - k) / .35)) : 0;                                 // staggered reactions
    const s2 = ds(.22), s1 = ds(.08), s0 = ds(.15), settle = k => free ? ease(clamp((dr - k) / .6)) : 0;
    LIGHT = [.96, .27];
    const p2 = { flip: true, lean: .55 + .05 * bar + tr(1) * .015 - s2 * 1.15 + settle(.8) * .45, head: -.45 - s2 * .3, hpF: .5 + s2 * .4, knF: .6, hpB: -.65 - s2 * .1, knB: .05 + s2 * .3, dx: s2 * .5,
      face: free ? (dr > 1.0 ? 'smile' : 'shout') : 'wince', mouth: free ? .3 : .1 + .1 * bar, blink: free ? clamp(1 - Math.abs(dr - 1.0) * 8) : clamp(1 - Math.abs(frac(t / 2.3) - .5) * 14), look: -.3 };
    const J2t = free ? null : { F: along(.66, 2 + tr(2) * 2), B: along(.8, 4) };
    const J2 = reach('dHand2', 1430 + s2 * 40, 836, 76, J2t ? p2 : { ...p2, shF: 2.6 - s2 * .3, elF: .4, shB: 2.2, elB: .8 }, CAST.hand2, J2t);
    const p1 = { flip: true, lean: .9 + .07 * bar + tr(3) * .02 + s1 * .45 - settle(.7) * .5, head: -.15 + s1 * .3, hpF: .75 + s1 * .5, knF: 1.05 - s1 * .3, hpB: -.5 - s1 * .2, knB: .18, dx: -s1 * 1.1,
      face: free ? (dr > 1.1 ? 'laugh' : 'shout') : 'grit', mouth: free ? .5 : .2 + .25 * bar, blink: free ? clamp(1 - Math.abs(dr - 1.1) * 8) : clamp(1 - Math.abs(frac(t / 1.9 + .3) - .5) * 14), look: -.6 };
    const J1t = free ? null : { F: along(.28, tr(4) * 2), B: along(.36, 2) };
    const J1 = reach('dHand1', 1240 - s1 * 60, 842, 84, J1t ? p1 : { ...p1, shF: 1.6 + s1 * .4, elF: -.2, shB: 1.3 + s1 * .6, elB: .1 }, CAST.hand1, J1t, {
      hold: () => { tongs(jr, hR, 34); } });
    // the floor's front edge (the camera is below it: feet go behind the planks)
    seed('dSill');
    pfill([[-80, FLOOR - 16], [W + 80, FLOOR - 22], [W + 80, FLOOR + 4], [-80, FLOOR + 6]], mixCol(AP.timber, AP.lamp, .15), { tone: .7, dens: .9, sw: 1.1, ink: AP.timberDk });
    pfill([[-80, FLOOR + 6], [W + 80, FLOOR + 4], [W + 80, 960], [-80, 960]], mixCol(AP.timberDk, AP.night, .3), { tone: .8, dens: 1, sw: 1.2 });
    for (let i = 0; i < 18; i++) { const x = -60 + i * 118 + hash(i) * 20; pfill(rectPts(x, FLOOR + 10, 104, 30), mixCol(AP.timber, AP.tealDk, .25 + hash(i * 2) * .2), { tone: .7, dens: .8, sw: .8 }); pline(ellPts(x + 52, FLOOR + 25, 18, 6, 12), .6, AP.timberDk, { closed: true, passes: 1 }); }
    pshade([[-80, FLOOR + 40], [W + 80, FLOOR + 40], [W + 80, 960], [-80, 960]], AP.graphite, 1.2);
    // dust off the planks when it lets go
    if (free && dr < 1.4) { seed('dJoltDust'); for (let i = 0; i < 9; i++) psmoke(PX + (hash(i) - .5) * 500, FLOOR - 20 - dr * 90 * hash(i + 3), 30 + dr * 90, mixCol(AP.dust, AP.teal, .3), .55 * (1 - dr / 1.4)); }
    bucket(1660, FLOOR - 6, 62);
    chain([[560, FLOOR - 10], [640, FLOOR - 16], [700, FLOOR - 8], [720, FLOOR + 30], [735, FLOOR + 70]], 16, 'a');
    // the driller, from behind, on the left tong (the handle runs into his hands, hidden in front of him)
    LIGHT = [.9, .43];
    tongs(jl, hL, 36);
    const rot = .15 + .02 * bar + tr(5) * .006 - s0 * .38 + settle(.9) * .16;
    const pd = { hpF: .32 + s0 * .1, knF: .3, hpB: .38 - s0 * .25, knB: .25, dy: s0 * (1 - settle(.6)) * .35 };
    const JD = backMan('dDriller', 490 - s0 * 20, 858, 92, free ? { ...pd, shF: .8 + s0 * .3, elF: -.5 * s0, shB: .6 + s0 * .7, elB: -.3 * s0 } : pd, CAST.driller,
      free ? null : { F: add2(hL, [28 + tr(6) * 2, -4]), B: add2(hL, [-14, 2]) }, rot);
    // warm lantern light washes over the men, then the lantern itself, in front on its nail
    pglow(lp[0] + 200, lp[1] + 150, 700, AP.rust, .1 * lampFlicker(t, 1));
    if (!free || dr < .6) { sweat(add2(J1.head, [.12 * 84, -.3 * 84]), 84, t, 1); sweat(add2(J2.head, [.15 * 76, -.25 * 76]), 76, t, 2, 1); sweat(add2(JD.neck, [.2 * 92, .15 * 92]), 92, t, 3); sweat(add2(JD.shF, [-.1 * 92, .6 * 92]), 92, t + .5, 4, 1); }
    else for (let i = 0; i < 8; i++) { const k = clamp((dr - .0) / .6); seed('dSpray' + i); const o = [J1.head, J2.head, JD.head][i % 3]; pfill(ellPts(o[0] + (hash(i) - .5) * 160 * k, o[1] - 40 * k + 120 * k * k, 3, 4, 6), AP.paperLt, { tone: .8 * (1 - k), ink: null }); }
    // the front leg of the derrick framing the left, the lantern hung from it
    seed('dFrontLeg');
    pfill(limb([[-60, 960], [460, -120]], [58, 44]), mixCol(AP.timberDk, AP.night, .35), { tone: .85, dens: 1, sw: 1.4 });
    plit(limb([[-40, 960], [470, -120]], [10, 8]), .5, mixCol(AP.lamp, AP.rust, .4));
    pfill(limb([[130, 150], [380, 150]], [18, 18]), mixCol(AP.timberDk, AP.night, .3), { tone: .85, sw: 1 });
    hangLamp(LAMP_NAIL, 170, 24, t, lampSwing, .5);
    camOff();
    if (rel) speedLines(whip, false, 'w5');
  }
  const jam = (t, lt, dur) => floorScene(t, lt, dur, false);
  const release = (t, lt, dur) => floorScene(t, lt, dur, true);

  // ---------- D4 · 132.68 · the engine at forty horse-power ----------
  function engineStrain(t, lt, dur) {
    const s = 66, ex = 980, ey = 820, gx = ex - 4.7 * s, gy = ey - 5.4 * s;
    const g = .55 + .62 * easeIn(seg(lt, .05, 1.15)) + .03 * Math.sin(t * 50), shake = .2 + .8 * ease(seg(lt, .5, 1.6)) + 1.4 * Math.exp(-Math.max(0, lt - 2.2) * 8) * (lt > 2.2 ? 1 : 0);
    const pull = ease(seg(lt, 1.1, 1.7)), z = lerp(3.6, 1.25, pull), sh = shakeXY(t, 3 + 6 * shake + (lt < .15 ? 12 : 0));
    nightSky({ y1: 960 });
    camOn(lerp(gx + 110, 860, pull) + sh[0], lerp(gy, 520, pull) + sh[1], z);
    farRigs(760, [[250, 280, 5], [1650, 520, 6]], 'e');
    seed('dEngGround'); pfill([[-400, 800], [2400, 800], [2400, 1400], [-400, 1400]], mixCol(AP.earthDk, AP.night, .45), { tone: .85, dens: 1, ink: null, still: true });
    // Bill at the firebox: scoop, then throw on the beat (the fire roars)
    const q = frac(bpOf(t) / 2 + .5), throwK = q < .6 ? easeOut(q / .6) : 1 - easeIn((q - .6) / .4);
    const roar = Math.exp(-frac(bpOf(t) / 2 + .5 - .6 + 1) * 8) * (q > .6 ? 1 : 0);
    const fire = .75 + .25 * Math.sin(t * 11) * .3 + .5 * roar;
    pglow(gx + .2 * s, ey - 3 * s, s * 9, AP.fire, .6 + .4 * roar);
    LIGHT = [-.85, -.5];
    const pb = kp(throwK, [[0, { lean: .55, shF: .5, elF: .35, shB: .95, elB: .55, hpF: .55, knF: .7, hpB: -.4, knB: .2, head: .15, face: 'grit' }],
      [1, { lean: .4, shF: 1.05, elF: .05, shB: .95, elB: .35, hpF: .4, knF: .25, hpB: -.5, knB: .1, head: -.05, face: 'grit', mouth: .3 }]]);
    seed('dBill');
    man(ex - 9.0 * s, ey, 64, pb, CAST.bill, { hold: J => shovel(J.handF, J.angF - .15, 64, 1 - throwK) });
    seed('dBillShovelReach'); if (throwK > .5) pline([[ex - 7.2 * s, ey - 3.2 * s], [ex - 5.4 * s, ey - 3.4 * s]], 1, AP.coal, { over: 0, passes: 1, alpha: (throwK - .5) * 2 });
    const E = engine(ex, ey, s, { ph: t * 3.2, fire, gauge: g, shake, smoke: 1 });
    // steam jets from the safety valve, the cylinder gland, a firebox seam
    const by = E.boilerY;
    jet('valve', [ex + .8 * s, by - 1.6 * s], -Math.PI / 2 - .2, s, t, seg(lt, .45, .8));
    jet('gland', [ex + 3.1 * s, by - 2.05 * s], -.2, s, t, seg(lt, .8, 1.1) * (1 + .6 * Math.exp(-Math.max(0, lt - 2.2) * 6)));
    jet('seam', [ex - 3.5 * s, by + .4 * s], Math.PI + .5, s * .8, t, seg(lt, 1.3, 1.6));
    // the needle's glow of danger: the red face of the gauge under strain
    pglow(gx, gy, s * 1.4, AP.red, .18 * seg(lt, .7, 1.1) * (1 + .3 * Math.sin(t * 30)));
    pglow(E.door[0], E.door[1], s * 3.5, AP.lamp, .5 * fire);
    camOff();
  }

  // ---------- D6 · 136.94 · the walking beam slams down ----------
  const BEAM0 = bt(257);                                       // blows at 137.49, 138.56, 139.63 (every 2 beats)
  function beamPh(t) { return frac((t - BEAM0) / (2 * BEAT)); }
  // Local walking beam. (Shared beam() drops the well end slowly over ph 0–.7 and lifts it fast over .7–1, the reverse
  // of its comment, so the blow can't land fast on the beat.) Here: p = 0 on the blow, slow rise, fast drop into p = 1.
  function beamD(x, y, s, p) {
    seed('dBeam');
    const lift = p < .1 ? 0 : p < .72 ? easeOut((p - .1) / .62) : 1 - easeIn((p - .72) / .28);   // 1 = well end up
    const ang = lerp(-.2, .2, lift) + spring(p * 2 * BEAT, 0, 9, 30) * .03;
    const pv = [x, y - 3 * s], wellEnd = polar(pv, Math.PI + ang, 4.2 * s), crankEnd = polar(pv, ang, 2.6 * s);
    pfill([[x - .5 * s, y], [x - .2 * s, y - 3 * s], [x + .2 * s, y - 3 * s], [x + .5 * s, y]], AP.timberDk, { tone: .7, sw: 1 });
    pfill(limb([wellEnd, pv, crankEnd], [.35 * s, .5 * s, .35 * s]), AP.timber, { tone: .7, dens: .9, sw: 1.2 });
    plit(limb([add2(wellEnd, [0, -.1 * s]), add2(pv, [0, -.15 * s])], [.08 * s, .1 * s]), .5, mixCol(AP.lamp, AP.paperLt, .4));
    pfill(ellPts(...pv, .18 * s, .18 * s, 10), AP.iron, { tone: .9, sw: .8 });
    return { wellEnd, crankEnd, pivot: pv, lift };
  }
  function beamSlam(t, lt, dur) {
    const s = 118, bx = 1200, by = 812, ph = beamPh(t), since = ((t - BEAM0) % (2 * BEAT) + 2 * BEAT) % (2 * BEAT);
    const hitK = t > BEAM0 - .05 ? Math.exp(-since * 7) : 0, arrive = lt < .3 ? 1 - easeOut(lt / .3) : 0;
    const sh = shakeXY(t, hitK * 14);
    nightSky({ y1: 960, sy: 600 });
    camOn(930 - arrive * 700 + sh[0], 540 + sh[1], 1.22);
    farRigs(760, [[380, 300, 7], [1780, 340, 8]], 'b');
    // derrick leg and floor at the well, the engine's firebox glow off to the right
    seed('dBmLeg'); pfill(limb([[420, 830], [700, -150]], [40, 30]), mixCol(AP.timberDk, AP.tealDk, .4), { tone: .8, dens: 1, sw: 1.2 });
    pglow(1900, 760, 420, AP.fire, .55 + .1 * Math.sin(t * 9));
    seed('dBmGround'); pfill([[-200, by - 10], [2200, by - 10], [2200, 1100], [-200, 1100]], mixCol(AP.timber, AP.night, .5), { tone: .8, dens: 1, sw: 1 });
    LIGHT = [.8, .6];
    const lamp = [bx + 60, by - 190];
    pglow(lamp[0], lamp[1], 620 * lampFlicker(t), AP.rust, .45); pglow(lamp[0], lamp[1], 240 * lampFlicker(t), AP.lamp, .6);
    const B = beamD(bx, by, s, ph);
    // the cable from the well end down to the clamp over the hole, the pitman out to the engine
    const hole = [B.wellEnd[0], by - 8];
    seed('dBmCable'); pline([B.wellEnd, [hole[0], hole[1] - 60]], 2.4, AP.iron, { over: 0 });
    pfill(rectPts(hole[0] - 22, hole[1] - 70, 44, 32), AP.iron, { tone: .9, sw: 1 });
    pline([B.crankEnd, [2100, by - 180]], 3, AP.iron, { over: 0 });
    // on the drop: speed lines at the well end; on the blow: dust off the floor
    if (ph > .76) for (let i = 0; i < 5; i++) pline([[B.wellEnd[0] - 60 + i * 30, B.wellEnd[1] - 40 - 80 * hash(i)], [B.wellEnd[0] - 60 + i * 30, B.wellEnd[1] - 200 - 80 * hash(i)]], 1, AP.paperLt, { over: 0, passes: 1, alpha: .8 });
    if (hitK > .05) { seed('dBmDust'); for (let i = 0; i < 6; i++) psmoke(hole[0] + (hash(i) - .5) * 220 * (1.4 - hitK), hole[1] - 30 - (1 - hitK) * 60 * hash(i + 2), 30 + (1 - hitK) * 70, mixCol(AP.dust, AP.teal, .3), .6 * hitK); }
    lantern(lamp[0] + spring(t, BEAM0, 4, 12) * 10 + spring(t, BEAM0 + 2 * BEAT, 4, 12) * 10, lamp[1], 22, lampFlicker(t));
    camOff();
    speedLines(arrive, false, 'w6');
  }

  // ---------- D7 · 139.38 · the bit rams (cut on the drop) ----------
  const RAM = bt(261);                                         // 139.63
  const LAMP8 = [1230, 250];                                   // screen spot shared by the ram's flare and the chorus lantern
  function ram(t, lt, dur) {
    const d = D1.d0 + 4 * .8 + (t >= RAM ? 1.2 : 0), bY = d * FT, z = 3.2, dr = t - RAM;
    const drop = t < RAM ? 70 * (1 - easeIn(seg(t, RAM - .32, RAM))) : 0, hitK = t >= RAM ? Math.exp(-dr * 5) : 0, sh = shakeXY(t, hitK * 18);
    camOn(X0 - (LAMP8[0] - 960) / z + sh[0], bY - (LAMP8[1] - 540) / z + sh[1], z);
    section(X0, d - 120, d + 280, { halfW: 700 });
    seed('dNightTint7'); ptone(rectPts(X0 - 900, bY - 500, 1800, 1400), AP.tealDk, .28);
    shaft(X0, d);
    const tip = bY - drop;
    rods(X0, bY - 700, tip - 26, { w: 7 });
    if (drop > 5) for (let i = 0; i < 4; i++) pline([[X0 - 30 + i * 20, tip - 60 - hash(i) * 30], [X0 - 30 + i * 20, tip - 150 - hash(i) * 40]], .8, AP.paperLt, { over: 0, passes: 1 });
    // cracks run out through the rock from the blow
    if (dr > 0) {
      seed('dRamCr');
      for (let i = 0; i < 7; i++) {
        const a = Math.PI / 2 + (i - 3) * .38 + (hash(i) - .5) * .2, L = 90 + hash(i * 3) * 150, k = easeOut(clamp(dr / .35));
        const P = [[X0, bY]]; for (let j = 1; j <= 4; j++) P.push(add2(polar([X0, bY], a + (hash(i * 5 + j) - .5) * .5, L * j / 4), [0, 0]));
        pline(partial(P, k), 1.1 - i % 2 * .3, AP.graphite, { over: 0 });
      }
      for (let i = 0; i < 8; i++) { const k = clamp(dr / .5), p = arcPt([X0, bY - 4], [X0 + (hash(i) - .5) * 120, bY + 10], 40 + hash(i + 2) * 60, k); if (k < 1) pfill(ellPts(p[0], p[1], 3, 2.4, 5), mixCol('#4A4440', AP.paperLt, .3), { tone: .9, sw: .5 }); }
    }
    bit(X0, tip, 12, { hit: hitK });
    if (hitK > .05) pglow(X0, bY, 90 * hitK + 20, AP.lamp, hitK);
    ruler(X0 - 120, d - 110, d + 250, d, { step: 10 });
    camOff();
    // the flare carries across the cut into the lantern
    const fl = seg(lt, dur - .2, dur);
    if (fl > 0) pglow(LAMP8[0], LAMP8[1], 200 + 500 * fl, AP.lamp, .6 + .4 * fl);
  }

  // ---------- D8 · 140.47 · chorus: night rhythm by lantern ----------
  const STRIKES = [263, 265, 267, 269, 271, 273].map(bt);     // the driller's "down"s: every other beat
  function chorusCrew(t, lt, dur) {
    const hitK = STRIKES.reduce((a, b) => a + (t >= b ? Math.exp(-(t - b) * 9) : 0), 0), sh = shakeXY(t, hitK * 5);
    nightSky({ y1: 960 });
    camOn(960 + sh[0], 520 + sh[1], lerp(1, 1.04, ease(lt / dur)));
    farRigs(740, [[180, 300, 9], [520, 230, 10], [1620, 360, 11]], 'c');
    // derrick: legs, crossbar with the lantern and the sheave for the bull rope
    const legC = mixCol(AP.timberDk, AP.tealDk, .4);
    seed('dCLegs');
    pfill(limb([[600, 812], [900, -200]], [34, 24]), legC, { tone: .8, dens: .95, sw: 1.1 });
    pfill(limb([[1480, 812], [1140, -200]], [34, 24]), legC, { tone: .8, dens: .95, sw: 1.1 });
    pfill(limb([[700, 170], [1400, 170]], [20, 20]), legC, { tone: .8, sw: 1 });
    pline([[640, 700], [1320, 200]], 2, legC, { over: 0 }); pline([[1440, 700], [780, 200]], 2, legC, { over: 0 });
    const swing = STRIKES.reduce((a, b) => a + spring(t, b, 3.5, 8) * .05, 0);
    const lampK = lt < .3 ? 1 + 2 * (1 - lt / .3) : 1;          // arrives flared from the ram's spark
    const lp = [LAMP8[0] + Math.sin(swing) * 80, LAMP8[1]];
    pglow(lp[0], lp[1], 900 * lampFlicker(t), AP.rust, .42 * Math.min(2, lampK));
    pglow(lp[0], lp[1], 300 * lampFlicker(t) * lampK, AP.lamp, .7);
    const sheave = [1380, 170];
    seed('dSheave'); pfill(ellPts(sheave[0], sheave[1] + 18, 26, 26, 14), AP.iron, { tone: .85, sw: 1 });
    // floor, the pipe through it, and the drive clamp where the sledge lands
    seed('dCFloor');
    pfill([[-80, 800], [W + 80, 800], [W + 80, 840], [-80, 840]], mixCol(AP.timber, AP.lamp, .12), { tone: .75, dens: .9, sw: 1.1 });
    for (let i = 0; i < 22; i++) pline([[-60 + i * 96, 802], [-60 + i * 96, 838]], .6, AP.timberDk, { over: 0, passes: 1 });
    pfill([[-80, 840], [W + 80, 840], [W + 80, 960], [-80, 960]], mixCol(AP.timberDk, AP.night, .45), { tone: .85, dens: 1, ink: null });
    const PX8 = 1010;
    // where the head lands: probe the rig in the strike pose and put the clamp there
    const sdS = 82, J0 = probe(() => man(0, 800, sdS, { ...POSES.hamDown }, CAST.driller)), ang0 = J0.angF + .9 * J0.dir, u = [Math.cos(ang0), Math.sin(ang0)], nn = [-u[1], u[0]];
    const hd = add2(J0.handF, [u[0] * 3 * sdS, u[1] * 3 * sdS]), faceA = add2(hd, [nn[0] * sdS, nn[1] * sdS]), faceB = add2(hd, [-nn[0] * sdS, -nn[1] * sdS]);
    const face = faceA[0] > faceB[0] ? faceA : faceB, clampY = face[1], dX = PX8 - 36 - face[0];
    seed('dCPipe');
    const kick = STRIKES.reduce((a, b) => a + (t >= b ? Math.exp(-(t - b) * 12) * 10 : 0), 0);
    pfill(rectPts(PX8 - 22, -200, 44, 1000 + kick), AP.iron, { tone: .85, dens: 1, sw: 1.2 });
    plit(rectPts(PX8 - 16, -200, 9, 1000), .6, mixCol(AP.lamp, AP.paperLt, .4), { kind: 'v' });
    pfill(rrPts(PX8 - 40, clampY - 40 + kick, 80, 80, 8), AP.iron, { tone: .9, dens: 1.1, sw: 1.4 });
    plit(rectPts(PX8 + 8, clampY - 30 + kick, 20, 60), .6, mixCol(AP.lamp, AP.rust, .3));
    // hands on the bull rope: yank on the off-beats, reach between (hand2 a hair late, and shorter)
    const pullPose = (lag, a) => { const q = frac(bpOf(t) / 2 - lag), k = q < .5 ? easeIn(q / .5) : 1 - ease((q - .5) / .5);
      return kp(k, [[0, { flip: true, lean: .25, shF: 2.5, elF: .15, shB: 2.25, elB: .25, hpF: .3, knF: .2, hpB: -.25, knB: .15, head: -.25, face: 'grit' }],
        [1, { flip: true, lean: -.35 * a, shF: 1.25, elF: .45, shB: 1.4, elB: .25, hpF: .5, knF: .3, hpB: -.4, knB: .35, head: .05, face: 'shout', mouth: .35 }]]); };
    LIGHT = [.6, .8];
    const J2 = (seed('dC2'), man(1790, 812, 68, { ...pullPose(.03, .8), face: 'grit' }, CAST.hand2));
    const J1 = (seed('dC1'), man(1580, 812, 72, pullPose(0, 1), CAST.hand1, { hold: J => {
      seed('dRope'); pline([[sheave[0] + 24, sheave[1] + 18], J.handF, J.handB, J2.handF, J2.handB, [1900, 790], [1960, 806]], 2.6, '#B89A68', { curv: true, over: 0 });
    } }));
    // the driller: wind up slow, strike fast onto the clamp on the beat, hold, recoil
    const tS = STRIKES[0], k = frac((t - tS) / (2 * BEAT) + .82);
    const P = k < .6 ? kp(k, [[0, POSES.hamDown], [.6, POSES.hamUp]], easeOut) : kp(k, [[.6, POSES.hamUp], [.82, POSES.hamDown]], easeIn);
    LIGHT = [-.8, .6];
    seed('dCDriller');
    man(dX, 800, sdS, { ...P, blink: clamp(1 - Math.abs(k - .8) * 12) * .8 }, CAST.driller, { hold: J => sledge(J.handF, J.angF + .9 * J.dir, sdS, { key: 'c' }) });
    // sparks off the clamp on each blow
    for (const b of STRIKES) {
      const e = t - b; if (e < 0 || e > .45) continue;
      seed('dSpk' + b); pglow(PX8 - 40, clampY, 180 * (1 - e / .45), AP.lamp, 1 - e / .45);
      for (let i = 0; i < 10; i++) { const a = -Math.PI * (.15 + .7 * hash(i + b)), r = 30 + e * 520 * (.5 + hash(i * 3)); pline([[PX8 - 40 + Math.cos(a) * r * .8, clampY + Math.sin(a) * r * .8 + e * e * 300], [PX8 - 40 + Math.cos(a) * r, clampY + Math.sin(a) * r + e * e * 300]], 1.3, AP.lamp, { over: 0, passes: 1, alpha: 1 - e / .45 }); }
    }
    pglow(lp[0] - 300, lp[1] + 300, 800, AP.rust, .18 * lampFlicker(t, 2));
    seed('dCLamp'); pline([[lp[0], 180], [lp[0], lp[1] - 44]], .9, AP.iron, { over: 0, passes: 1 }); lantern(lp[0], lp[1], 22, lampFlicker(t));
    camOff();
    const ir = seg(lt, dur - .5, dur);
    if (ir > 0) { const [hx, hy] = [(PX8 - 960) * 1.04 + 960, (800 - 520) * 1.04 + 540]; hatchIris(hx, hy - 10, lerp(1500, 0, easeIn(ir))); }
  }

  // ---------- D9 · 146.20 · the dive, in dark rock to 2700 ft ----------
  function diveD(t, lt, dur) {
    dive(t, lt, dur, { from: 2170, to: 2700, extra: (dCam) => {
      const cy = dCam * FT;
      seed('dDiveDark'); ptone(rectPts(-2000, cy - 2600, 5000, 5200), AP.night, .32);
      pshade(rectPts(-2000, cy - 2600, 5000, 5200), AP.tealDk, .45, { still: true });
      // the caved pocket we left behind at 2150, packed with fallen rubble
      seed('dPocket');
      const py = 2150 * FT, pk = [[X0 - 17, py - 260], [X0 - 70, py - 200], [X0 - 90, py - 90], [X0 - 40, py + 20], [X0 + 50, py + 20], [X0 + 85, py - 110], [X0 + 60, py - 230], [X0 + 17, py - 270]];
      pfill(pk, AP.coal, { tone: .9, dens: 1, sw: 1 });
      for (let i = 0; i < 9; i++) pfill(ellPts(X0 + (hash(i) - .5) * 130, py - 20 - hash(i * 3) * 150, 10 + hash(i) * 12, 8 + hash(i * 2) * 8, 6, 2), mixCol('#4A4440', AP.paperLt, .2), { tone: .85, sw: .7 });
      // hairline cracks spreading from the bore through the rock as the bit goes by
      seed('dDiveCr');
      for (let i = 0; i < 16; i++) {
        const dd = 2320 + i * 25 + hash(i) * 12, y = dd * FT, sd = i % 2 ? 1 : -1, k = seg(dCam, dd - 380, dd - 120);
        if (k <= 0) continue;
        const P = [[X0 + sd * 17, y]]; for (let j = 1; j <= 5; j++) P.push([X0 + sd * (17 + j * (50 + hash(i * 7) * 60)), y + (hash(i * 11 + j) - .45) * 60 * j]);
        pline(partial(P, easeOut(k)), 1.1, AP.graphite, { over: 0 });
      }
    } });
    if (lt < .45) hatchIris(960, 470, lerp(0, 1500, easeOut(lt / .45)));
    seamOut(lt, dur);
  }

  shots([[116.30, caving], [122.92, rodsBend], [127.18, jam], [132.68, engineStrain], [135.14, release], [136.94, beamSlam], [139.38, ram], [140.47, chorusCrew], [146.20, diveD]]);
})();
