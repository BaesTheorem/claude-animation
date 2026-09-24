// Chapter F · 189.20–225.55 s · Bedrock. Verse 6 (lines 45–49), chorus 6 (lines 50–53) and the hush.
// See docs/artesian/STORYBOARD.md and BRIEF.md. Storm-dark dusk: bruised indigo-violet sky, a red slit where the sun
// went, lantern and firebox glows warm on the men.
//
//   F1  189.20 listen      the driller kneels, ear to the casing, eyes shut; a knock rides up the pipe; he opens his eyes,
//                          glances down it, and the camera drops down the casing (vertical whip)
//   F2  191.35 bedrock     section: the bit on granite, and just below it, faint, the blue of the water. Light taps, then
//                          a push in as she starts bumping on the rock: the bit bounces, sparks, the ruler at 4000
//   F3  197.90 snap        whip up the rods to the floor: the rod bows on the beat and snaps, hand2 flinches
//   F4  199.44 anvil       cut on the beat: the driller hammers the bent iron straight on the anvil, hand1 holds it
//   F5  201.58 splice      cut on the beat: the two hands lash the splice, yanking the rope tight on the beat
//   F6  203.42 wire        match cut (rope lashing → wire coils): Bill binds the split walking beam with fencing wire;
//                          the engine starts, the beam slams, the crack flexes, and it holds
//   F7  207.68 wring       page turn: the whole crew on the tongs, the driller alone on his side, arms knotted; the pipe
//                          turns by main force on the beat; push in on him
//   F8  211.23 chorus      smash cut on the downbeat: max effort at dusk, two sledges alternating on every beat, the
//                          bull rope hauled, Bill stoking the roaring firebox
//   F9  214.05 low angle   the driller against the storm sky; the second sledge swings in on the off beats; hatch iris
//   F10 216.98 dive        dive through granite to 4040 ft; on the last blow a hairline crack of blue opens under the bit
//   F11 223.30 the hush    smash cut to silence: the crew freeze, listening; pebbles hop, dust lifts, tiny shakes
//   F12 224.35 his face    close on the driller: eyes shift, a single drop of sweat runs and falls. Held to 225.55,
//                          no wipe out: chapter G opens on the whistle's burst of steam.
//
// Chapter-local helpers (nothing here edits shared files): duskSky, duskRigs, planks, hangLamp, probe/ik/reach
// (arm IK, copied from chD), rotMan (a front-view figure tilted about a pivot), strikeAt/hamPose (sledge cycle),
// sparks, sweat, speedLines, hatchIris, beamF, anvil, pebbles.
(() => {
  const bt = n => OFF + n * BEAT;                     // time of beat n
  const VIO = '#2B2347', PLUM = '#6E3A52', DRED = '#A8442F', CLOUD = '#45395F', CLOUDLT = '#9A5560', DUSKGND = '#3C2E35';
  const TIMB = mixCol(AP.timberDk, VIO, .35);         // timber in the dusk
  const X0 = 960;

  // ---------- dusk ----------
  // Storm sky: bruised indigo over a plum horizon, the last red low under the cloud, lumpy banks lit from beneath.
  function duskSky(o = {}) {
    const y1 = o.y1 ?? 960;
    sky(VIO, PLUM, { tone: .92, split: o.split ?? .8, hatch: .75, still: true, y1, y0: -700 });
    seed('fSkyX');
    pshade(rectPts(-300, -300, W + 600, y1 + 360), '#1C1630', .42, { kind: 'x', still: true });
    const hy = o.hy ?? 760, sx = o.sunX ?? 1450;
    pglow(sx, hy, 1000, DRED, .5);
    pglow(sx, hy + 30, 380, AP.fire, .28);
    for (let b = 0; b < 4; b++) {
      const by = (o.cy ?? 40) + b * 135, drift = (T * (5 + b * 3)) % 290;
      seed('fCloud' + b);
      for (let i = 0; i < 10; i++) {
        const x = -420 + i * 290 + hash(b * 9 + i) * 120 + drift, y = by + (hash(b * 5 + i) - .5) * 60, r = 120 + hash(i * 3 + b) * 110;
        psmoke(x, y, r, mixCol(CLOUD, VIO, b * .1), .72);
        pline([[x - r * .72, y + r * .36], [x - r * .2, y + r * .56], [x + r * .5, y + r * .5], [x + r * .78, y + r * .3]], 1.2, mixCol(CLOUDLT, PLUM, b * .15), { curv: true, over: 0, passes: 1, alpha: .35 + b * .12 });
      }
    }
  }
  // distant derricks on a low horizon, silhouetted against the red
  function duskRigs(yH, list, key) {
    seed('fHorz' + key);
    const hp = []; for (let k = 0; k <= 12; k++) hp.push([lerp(-400, W + 400, k / 12), yH + 5 * Math.sin(k * 2.1) + 4 * hash(k)]);
    pfill(hp.concat([[W + 400, yH + 900], [-400, yH + 900]]), DUSKGND, { tone: .85, dens: .9, ink: null, still: true });
    for (const [x, h, k] of list) {
      pglow(x + h * .05, yH - h * .08, h * .2, AP.lamp, .35 + .08 * Math.sin(T * 5 + k));
      derrick(x, yH, h, { col: mixCol(VIO, AP.graphite, .3), key: 'fFar' + key + k, floor: false, bays: 5 });
    }
  }
  // the derrick floor: planks seen from just above (o.top px deep), the front edge at y, dark underneath
  function planks(y, o = {}) {
    seed('fPlank' + (o.key || ''));
    const x0 = o.x0 ?? -300, x1 = o.x1 ?? W + 300, top = o.top ?? 0, lit = mixCol(AP.timber, AP.lamp, .12);
    if (top > 0) {
      pfill([[x0, y - top], [x1, y - top], [x1, y - 4], [x0, y - 4]], mixCol(lit, VIO, .3), { tone: .75, dens: .9, ink: null });
      for (let i = 0; i < 26; i++) { const x = x0 + i * (x1 - x0) / 26; pline([[x + 20, y - top], [x, y - 4]], .7, TIMB, { over: 0, passes: 1 }); }
      for (let r = 1; r < 3; r++) pline([[x0, y - top * r / 3], [x1, y - top * r / 3]], .5, TIMB, { over: 0, passes: 1, alpha: .6 });
    }
    pfill([[x0, y - 12], [x1, y - 14], [x1, y + 10], [x0, y + 10]], lit, { tone: .72, dens: .9, sw: 1.1, ink: AP.timberDk });
    pfill([[x0, y + 10], [x1, y + 10], [x1, y + 600], [x0, y + 600]], mixCol(AP.timberDk, VIO, .45), { tone: .88, dens: 1, ink: null });
    for (let i = 0; i < 18; i++) { const x = x0 + i * 130 + hash(i) * 20; pline(ellPts(x + 52, y + 1, 14, 5, 10), .6, AP.timberDk, { closed: true, passes: 1 }); }
    pshade([[x0, y + 30], [x1, y + 30], [x1, y + 600], [x0, y + 600]], AP.graphite, 1.2);
  }
  // soft violet air in front of distant things (no strokes, no edge)
  function haze(x, y, r, a) {
    const g = X.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(43,35,71,${a})`); g.addColorStop(.6, `rgba(43,35,71,${a * .7})`); g.addColorStop(1, 'rgba(43,35,71,0)');
    X.save(); X.fillStyle = g; X.fillRect(x - r, y - r, 2 * r, 2 * r); X.restore();
  }
  const flick = (t, k = 0) => 1 + .07 * Math.sin(t * 13.1 + k) + .05 * Math.sin(t * 23.7 + k * 2) + .03 * Math.sin(t * 41 + k);
  function hangLamp(nail, len, s, t, swing = 0, big = 1) {
    const a = .05 * Math.sin(t * 1.6) + swing, p = [nail[0] + Math.sin(a) * len, nail[1] + Math.cos(a) * len], fl = flick(t);
    pglow(p[0], p[1], 560 * big * fl, AP.rust, .5 * big);
    pglow(p[0], p[1], 240 * big * fl, AP.lamp, .75 * big);
    seed('fLampWire' + nail[0]);
    pline([nail, [p[0], p[1] - 2 * s]], .9, AP.iron, { over: 0, passes: 1 });
    lantern(p[0], p[1], s, fl);
    return p;
  }
  function legs(list, key, col = TIMB) {        // big derrick legs / braces: [[a, b, w0, w1], ...]
    seed('fLegs' + key);
    for (const [a, b, w0, w1] of list) pfill(limb([a, b], [w0, w1 ?? w0 * .75]), col, { tone: .82, dens: .95, sw: 1.1 });
  }

  // ---------- figures: probe the rig for joints, solve arms to targets (from chD) ----------
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
    const P = { ...pose }, d = P.flip ? -1 : 1;
    if (tgt) {
      const J0 = probe(() => man(x, y, s, P, look));
      if (tgt.F) [P.shF, P.elF] = ik(J0.shF, tgt.F, s, look, d);
      if (tgt.B) [P.shB, P.elB] = ik(J0.shB, tgt.B, s, look, d);
    }
    seed(key); return man(x, y, s, P, look, hooks);
  }
  // front-view figure tilted by rot about the pivot pv (e.g. his hip), arms solved to world targets
  function rotMan(key, x, y, s, pose, look, tgt, rot, pv, hooks = {}) {
    const P = { ...pose }, loc = p => rot2(p, -rot, pv);
    if (tgt) {
      const J0 = probe(() => man(x, y, s, P, look));
      if (tgt.F) [P.shF, P.elF] = ik(J0.shF, loc(tgt.F), s, look, 1);
      if (tgt.B) [P.shB, P.elB] = ik(J0.shB, loc(tgt.B), s, look, -1);
    }
    X.save(); X.translate(pv[0], pv[1]); X.rotate(rot); X.translate(-pv[0], -pv[1]);
    seed(key); const J = man(x, y, s, P, look, hooks);
    X.restore();
    const out = {}; for (const k in J) out[k] = Array.isArray(J[k]) && typeof J[k][0] === 'number' ? rot2(J[k], rot, pv) : J[k];
    return out;
  }
  // where the sledge face lands in POSES.hamDown, relative to the feet
  function strikeAt(s, look, flip = false, down = POSES.hamDown) {
    const J = probe(() => man(0, 0, s, { ...down, flip }, look));
    const ang = J.angF + (down.off ?? .9) * J.dir, u = [Math.cos(ang), Math.sin(ang)], n = [-u[1], u[0]];
    const hd = add2(J.handF, [u[0] * 3 * s, u[1] * 3 * s]), a = add2(hd, [n[0] * s, n[1] * s]), b = add2(hd, [-n[0] * s, -n[1] * s]);
    if (down.pick === 'low') return a[1] > b[1] ? a : b;               // the face that comes down on the work
    return flip ? (a[0] < b[0] ? a : b) : (a[0] > b[0] ? a : b);
  }
  // sledge cycle landing on tS and every `per` seconds after: slow wind-up, fast strike, a short hold, recoil
  function hamK(t, tS, per) { return frac((t - tS) / per + .82); }
  function hamPose(k, down = POSES.hamDown, up = POSES.hamUp) { return k < .6 ? kp(k, [[0, down], [.6, up]], easeOut) : kp(k, [[.6, up], [.82, down]], easeIn); }
  // a waist-high blow (the anvil): arms driven out level, the handle angled down at .55 rad at impact. `off` rides in the
  // pose so kp() blends the sledge's angle from the wind-up into the blow.
  const HAM_UP_A = { ...POSES.hamUp, off: .9 };
  let _hamAnvil = null;                                   // computed on first use (p5 isn't up while scripts load)
  function hamAnvil() {
    if (_hamAnvil) return _hamAnvil;
    const P = { lean: .15, shF: 1.3, elF: .1, shB: 1.1, elB: .2, hpF: .25, knF: .25, hpB: -.2, knB: .15, head: .3, face: 'shout', mouth: .4 };
    const J = probe(() => man(0, 0, 90, P, CAST.driller)); return (_hamAnvil = { ...P, off: .25 - J.angF, pick: 'low' });
  }
  function sparks(p, e, key, o = {}) {
    const life = o.life ?? .45; if (e < 0 || e > life) return;
    const q = e / life; seed('fSpk' + key);
    pglow(p[0], p[1], (o.r ?? 180) * (1 - q), AP.lamp, 1 - q);
    for (let i = 0; i < (o.n ?? 10); i++) {
      const a = -Math.PI * (.12 + .76 * hash(i + key.length * 3.1)) + (o.tilt ?? 0), r = 30 + e * (o.v ?? 520) * (.5 + hash(i * 3 + 1));
      pline([[p[0] + Math.cos(a) * r * .8, p[1] + Math.sin(a) * r * .8 + e * e * 300], [p[0] + Math.cos(a) * r, p[1] + Math.sin(a) * r + e * e * 300]], o.w ?? 1.3, AP.lamp, { over: 0, passes: 1, alpha: 1 - q });
    }
  }
  function sweat(p, s, t, k, n = 2) {
    for (let i = 0; i < n; i++) {
      const per = 1.1 + hash(k * 7 + i) * .9, q = frac(t / per + hash(k * 3 + i)), dx = (hash(k + i * 5) - .5) * .5 * s;
      const y = p[1] + (q < .45 ? 0 : Math.pow((q - .45) / .55, 2) * 2.4 * s), a = q < .9 ? 1 : (1 - q) * 10;
      seed('fSw' + k + i);
      pfill(ellPts(p[0] + dx, y, .06 * s, .09 * s * (q < .45 ? .7 + q : 1.2), 7), mixCol(AP.paperLt, AP.waterLt, .3), { tone: .75 * a, dens: .3, ink: null });
      if (a > .3) pglow(p[0] + dx - .02 * s, y - .03 * s, .12 * s, AP.lamp, .5 * a);
    }
  }
  // the driller's knotted arm: veins and bunched muscle drawn over the near arm (use in hooks.front)
  function knots(J, k, s) {
    if (k <= 0) return;
    const L = CAST.driller, vc = mixCol(L.skinDk, AP.graphite, .2);
    seed('fKnots');
    const e = J.elF, w = J.wrF, sh = J.shF, fa = Math.atan2(w[1] - e[1], w[0] - e[0]), n = [-Math.sin(fa), Math.cos(fa)];
    for (let i = 0; i < 3; i++) {
      const off = (i - 1) * .13 * s, P = [];
      for (let j = 0; j <= 6; j++) { const u = j / 6, b = Math.sin(u * 9 + i * 2) * .05 * s; P.push([lerp(e[0], w[0], u) + n[0] * (off + b), lerp(e[1], w[1], u) + n[1] * (off + b)]); }
      pline(P, Math.max(.7, s / 70), vc, { curv: true, over: 0, passes: 1, alpha: .85 * k });
    }
    // the biceps bunched in two lumps, the forearm swollen
    const ua = Math.atan2(e[1] - sh[1], e[0] - sh[0]), un = [-Math.sin(ua), Math.cos(ua)];
    for (const [u, r] of [[.35, .3], [.68, .26]]) {
      const c = lerp2(sh, e, u), side = -1;
      pline([add2(c, [un[0] * side * .28 * s - Math.cos(ua) * r * s, un[1] * side * .28 * s - Math.sin(ua) * r * s]), add2(c, [un[0] * side * .42 * s, un[1] * side * .42 * s]), add2(c, [un[0] * side * .28 * s + Math.cos(ua) * r * s, un[1] * side * .28 * s + Math.sin(ua) * r * s])], Math.max(.8, s / 60), vc, { curv: true, over: 0, passes: 1, alpha: .8 * k });
    }
    plit(limb([lerp2(sh, e, .2), lerp2(sh, e, .75)], [.18 * s, .12 * s]).map(p => add2(p, [-LIGHT[0] * .15 * s, -LIGHT[1] * .15 * s])), .45 * k, mixCol(AP.lamp, AP.paperLt, .4));
  }

  // pipe tongs with a lamp-lit edge, so the lever reads against the dusk
  function tongsF(c, h, s) {
    tongs(c, h, s);
    seed('fTongLit' + c[1]);
    plit(limb([add2(c, [0, -.12 * s]), add2(h, [0, -.08 * s])], [.1 * s, .07 * s]), .7, mixCol(AP.lamp, AP.paperLt, .35));
  }
  // granite: pink feldspar and black mica flecks, only where the camera looks
  function speckles(d0, d1, x0, x1) {
    seed('fSpeck');
    for (let i = 0; i < 900; i++) {
      const d = 3100 + hash(i * 1.37) * 950, x = X0 + (hash(i * 2.71) - .5) * 3000;
      if (d < d0 || d > d1 || x < x0 || x > x1 || Math.abs(x - X0) < 26) continue;
      const pink = hash(i * 5.3) < .45, r = 2 + hash(i * 7.1) * 5;
      pfill(ellPts(x, d * FT, r, r * .7, 6, 0, hash(i) * 3), pink ? '#B98A7E' : '#2E2A2C', { tone: .75, ink: null });
    }
  }

  // ---------- transitions of this chapter ----------
  function speedLines(k, vert, key) {
    if (k <= .02) return;
    seed('fSpd' + key);
    ptone(rectPts(-40, -40, W + 80, H + 80), mixCol(AP.paper, VIO, .15), .75 * k);
    for (let i = 0; i < 54; i++) {
      const a = hash(i * 3.7 + key.length), b = hash(i * 9.1), L = 200 + hash(i * 5.3) * 600, w = .7 + hash(i * 2.1) * 1.6;
      if (vert) { const x = a * W, y = b * (H + L) - L; pline([[x, y], [x, y + L]], w, AP.graphite, { alpha: k * .85, passes: 1, over: 0 }); }
      else { const y = a * 890, x = b * (W + L) - L; pline([[x, y], [x + L, y]], w, AP.graphite, { alpha: k * .85, passes: 1, over: 0 }); }
    }
  }
  function hatchIris(cx, cy, r) {
    seed('fIris');
    X.save(); X.beginPath(); X.rect(-60, -60, W + 120, H + 120); X.arc(cx, cy, Math.max(0, r), 0, TAU); X.clip('evenodd');
    ptone(rectPts(-60, -60, W + 120, H + 120), VIO, .93);
    pshade(rectPts(-60, -60, W + 120, H + 120), AP.graphite, 1.6);
    X.restore();
    if (r > 3) pline(ellPts(cx, cy, r, r, 44, r * .015), 2, AP.graphite, { closed: true });
  }
  const seamIn = lt => { if (lt < .35) scribbleWipe(.5 + lt / .7); };

  // ================= F1 · 189.20 · ear to the casing =================
  const KNOCK = [355, 357].map(bt);                                   // 189.83, 190.90: the bit's knock from below
  const PIPE_L = 1150, PIPE_W = 76;
  function ripplesUp(t, x0, x1, yBot, yTop, times, dur = .4, col = AP.paperLt) {
    for (const b of times) {
      const e = t - b; if (e < 0 || e > dur + .15) continue;
      for (let j = 0; j < 3; j++) {
        const k = clamp((e - j * .05) / dur); if (k <= 0 || k >= 1) continue;
        const y = lerp(yBot, yTop, easeOut(k)), bow = (x1 - x0) * .08;
        seed('fRip' + j);
        pline([[x0 + 2, y], [(x0 + x1) / 2, y - bow], [x1 - 2, y]], 1.6, col, { curv: true, over: 0, passes: 1, alpha: (1 - k) });
        if (j === 0) pglow((x0 + x1) / 2, y, (x1 - x0) * .9, AP.lamp, .35 * (1 - k));
      }
    }
  }
  function listen(t, lt, dur) {
    const tilt = easeIn(seg(lt, dur - .42, dur)), z = lerp(1.18, 1.25, ease(lt / 1.7));
    camOn(930, 590 + tilt * 520, z);
    duskSky({ sunX: 1700, hy: 800 });
    duskRigs(800, [[1480, 300, 1], [1830, 230, 2]], 'a');
    legs([[[380, 870], [720, -300], 44, 32], [[1760, 870], [1420, -300], 44, 32]], 'f1');
    pfill(limb([[420, 180], [1700, 180]], [22, 22]), TIMB, { tone: .8, sw: 1 });
    // the lantern the hand holds up behind, and the firebox off to the right: the warm lights
    const lampP = [560 + Math.sin(t * 1.3) * 4, 520];
    pglow(lampP[0], lampP[1], 760 * flick(t), AP.rust, .45);
    pglow(lampP[0], lampP[1], 300 * flick(t), AP.lamp, .6);
    pglow(1900, 780, 560, AP.fire, .45 + .08 * Math.sin(t * 9));
    // the crew waiting in the gloom, pushed back
    LIGHT = [-.6, .8];
    seed('f1Boss'); man(300, 845, 46, { view: 'front', shF: .15, elF: .9, shB: .15, elB: .9, face: 'worry', blink: clamp(1 - Math.abs(lt - 1.4) * 12) }, CAST.boss);
    seed('f1Hand2'); const JH = man(470, 848, 48, { view: 'front', shF: .55, elF: -1.9, shB: .1, elB: .2, face: 'neutral', look: .6, blink: clamp(1 - Math.abs(lt - .9) * 12) }, CAST.hand2);
    haze(390, 640, 330, .38);
    lantern(JH.handF[0] + 4, JH.handF[1] + 30, 14, flick(t));
    // the casing up through the floor, lit on its left by the lantern
    seed('f1Pipe');
    pfill(rectPts(PIPE_L, -300, PIPE_W, 1200), AP.iron, { tone: .85, dens: 1, sw: 1.3 });
    plit(rectPts(PIPE_L + 6, -300, 14, 1200), .7, mixCol(AP.lamp, AP.paperLt, .35), { kind: 'v' });
    pshade(rectPts(PIPE_L + PIPE_W - 26, -300, 24, 1200), AP.graphite, 1.3);
    pfill(rectPts(PIPE_L - 14, 690, PIPE_W + 28, 64), AP.iron, { tone: .9, dens: 1.1, sw: 1.4 });
    plit(rectPts(PIPE_L - 8, 700, 24, 44), .6, mixCol(AP.lamp, AP.rust, .3));
    ripplesUp(t, PIPE_L, PIPE_L + PIPE_W, 880, 430, KNOCK);
    // the driller kneeling, leaning his head on the pipe; eyes shut, listening. The knock arrives, his eyes open,
    // wonder, and slide along the pipe toward the ground
    const s = 124, open = seg(lt, 1.12, 1.27), look = .75 * ease(seg(lt, 1.35, 1.7));
    const press = [KNOCK[0] + .38].reduce((a, b) => a + (t > b ? Math.exp(-(t - b) * 6) * Math.sin((t - b) * 20) * .01 : 0), 0);
    const pose = { view: 'front', shF: .1, elF: .7, shB: .18, elB: .6, hpF: .1, hpB: .1, face: lt < 1.2 ? 'neutral' : 'worry', blink: 1 - open, look, mouth: .14 * open };
    const x = 900, J0 = probe(() => man(x, 0, s, pose, CAST.driller)), hipY = 960, y = hipY - J0.hip[1], pv = [J0.hip[0], hipY];
    const rel = [J0.head[0] - J0.hip[0], J0.head[1] - J0.hip[1]], R = Math.hypot(...rel), tx = PIPE_L - .5 * s + 4;
    const rot = Math.asin(clamp((tx - pv[0]) / R, -1, 1)) + .006 * Math.sin(t * 2.1) + press;
    LIGHT = [.85, .5];
    const JD = rotMan('f1Driller', x, y, s, pose, CAST.driller, null, rot, pv, { front: J => {
      // his ear, pressed to the iron
      const c = J.head; seed('f1Ear'); pfill(ellPts(c[0] + .5 * s, c[1] - .02 * s, .1 * s, .17 * s, 10), CAST.driller.skin, { tone: .65, sw: 1.2 }); pline([[c[0] + .5 * s, c[1] - .1 * s], [c[0] + .46 * s, c[1] + .05 * s]], 1, CAST.driller.skinDk, { over: 0 }); } });
    // sound ticks where the pipe meets his ear
    for (const b of KNOCK) { const e = t - (b + .36); if (e < 0 || e > .35) continue; seed('f1Tick');
      for (let i = 0; i < 3; i++) pline([[PIPE_L + PIPE_W + 8 + i * 10, JD.head[1] - 20 + i * 18], [PIPE_L + PIPE_W + 22 + i * 12, JD.head[1] - 24 + i * 20]], 1, AP.paperLt, { over: 0, passes: 1, alpha: 1 - e / .35 }); }
    sweat(add2(JD.head, [-.3 * s, -.3 * s]), s, t, 11, 1);
    planks(876, { key: 'f1' });
    camOff();
    speedLines(tilt, true, 'f1');
    seamIn(lt);
  }

  // ================= F2 · 191.35 · the bit on the granite, the water beneath =================
  const BD = 3997, BY = BD * FT;
  const AQ_Y = 4050 * FT + 8 * Math.sin(4050);                         // the aquifer's top edge straight under the bore
  const TAPS = [359, 361].map(bt), BUMPS = [363, 365, 367, 369].map(bt);
  // the aquifer's top edge as section() draws it, so the dimming follows its line
  function aqEdge(x, halfW) { const a = 4050, y0 = a * FT; return [[x - halfW, y0 + 10 * Math.sin(a) + 8 * hash(a)], [x - halfW / 2, y0 - 6 + 12 * hash(a + 1)], [x, y0 + 8 * Math.sin(a)], [x + halfW / 2, y0 + 10 * hash(a + 2)], [x + halfW, y0 - 5]]; }
  // dim the water to a faint blue, and let it breathe
  function faintWater(t, halfW, lift = 0, key = '') {
    seed('fAqDim' + key);
    const E = aqEdge(X0, halfW), P = E.concat([[X0 + halfW, AQ_Y + 3000], [X0 - halfW, AQ_Y + 3000]]);
    ptone(P, '#6F6A78', .8 * (1 - lift));
    pshade(P, '#55506A', .7 * (1 - lift), { still: true, kind: 'x' });
    const br = .5 + .5 * Math.sin(t * 1.7);
    pglow(X0, AQ_Y + 60, 420, AP.waterLt, .16 + .08 * br + .3 * lift);
    seed('fAqGl' + key);
    for (let i = 0; i < 40; i++) {
      const gx = X0 + (hash(i * 3.3) - .5) * 1100 + frac(t * .02 + hash(i)) * 60, gy = AQ_Y + 14 + hash(i * 5.1) * 360, tw = .5 + .5 * Math.sin(t * (1.5 + hash(i) * 2) + i * 2);
      pline([[gx - 7, gy], [gx, gy - 1.5], [gx + 7, gy]], 1.2, '#DDEEF3', { over: 0, passes: 1, alpha: (.3 + .5 * lift) * tw });
    }
  }
  function lift1(t) {
    let y = 0;
    for (const b of TAPS) { const w = .6, u = (t - (b - w)) / w; if (u >= 0 && u < 1) y = Math.max(y, 12 * (u < .7 ? easeOut(u / .7) : 1 - easeIn((u - .7) / .3))); }
    for (const b of BUMPS) {
      const w = .9, u = (t - (b - w)) / w;
      if (u >= 0 && u < 1) y = Math.max(y, 46 * (u < .72 ? easeOut(u / .72) : 1 - easeIn((u - .72) / .28)));
      const e = t - b; if (e >= 0 && e < .6) y = Math.max(y, 18 * Math.exp(-e * 6) * Math.abs(Math.sin(e * 11)));   // it bounces off
    }
    return y;
  }
  function bedrock(t, lt, dur) {
    const arr = easeOut(seg(lt, 0, 1.0)), push = ease(seg(t, 193.3, 194.15)), leave = easeIn(seg(lt, dur - .36, dur));
    const z = lerp(1, 2.8, push), hitK = BUMPS.reduce((a, b) => a + (t >= b ? Math.exp(-(t - b) * 7) : 0), 0), sh = shakeXY(t, hitK * 7);
    const cy = lerp(BY - 1500, BY + 70, arr) - 40 * push - leave * 1500 / z;
    camOn(X0 + sh[0], cy + sh[1], z);
    const top = (cy - 700 / z) / FT, bot = (cy + 700 / z) / FT;
    section(X0, top, bot, { halfW: 1500 });
    seed('fTint2'); ptone(rectPts(X0 - 1600, cy - 900 / z, 3200, 1800 / z), VIO, .26);
    speckles(top, bot, X0 - 1000 / z, X0 + 1000 / z);
    faintWater(t, 1500, 0, '2');
    // quartz veins in the granite, pale
    seed('fVeins2');
    for (let i = 0; i < 9; i++) { const vy = (3830 + i * 26) * FT, vx = X0 + (hash(i * 7) - .5) * 1300; pline([[vx - 160, vy], [vx - 50, vy + 22 * (hash(i) - .5)], [vx + 60, vy + 10], [vx + 180, vy + 30 * (hash(i + 3) - .5)]], 1.1, AP.paperLt, { curv: true, over: 0, passes: 1, alpha: .45 }); }
    shaft(X0, BD);
    const tip = BY - lift1(t);
    rods(X0, BY - 2800, tip - 34, { w: 10 });
    ripplesUp(t, X0 - 15, X0 + 15, BY - 30, BY - 600, TAPS.concat(BUMPS), .5);
    // chips and grit off the granite on each bump
    for (const b of BUMPS) {
      const e = t - b; if (e < 0 || e > .6) continue; seed('fChip' + b);
      for (let i = 0; i < 9; i++) { const p = arcPt([X0 + (hash(i + b) - .5) * 10, BY - 2], [X0 + (hash(i * 3 + b) - .5) * 120, BY + 4], 20 + hash(i + 7) * 50, clamp(e / .45)); if (e < .45) pfill(ellPts(p[0], p[1], 2.2, 1.8, 5), '#C8C8C0', { tone: .9, ink: null }); }
    }
    bit(X0, tip, 20, { hit: hitK });
    if (hitK > .05) pglow(X0, BY, 70 * hitK + 10, AP.lamp, hitK);
    ruler(X0 - 300, top, bot, BD, { step: 50 });
    camOff();
    speedLines(Math.max(1 - easeOut(seg(lt, 0, .35)), leave), true, 'f2');
  }

  // ================= F3 · 197.90 · a rod snaps =================
  const SN1 = bt(371), SN2 = bt(372);                                  // 198.37 the beam drives down; 198.91 it snaps
  function snap(t, lt, dur) {
    const arrive = 1 - easeOut(seg(lt, 0, .32)), e2 = t - SN2, broke = e2 >= 0;
    const hitK = (t >= SN1 ? Math.exp(-(t - SN1) * 8) * .5 : 0) + (broke ? Math.exp(-e2 * 6) : 0), sh = shakeXY(t, hitK * 8);
    camOn(960 + sh[0], 470 + sh[1] + arrive * 260, 1.04);
    duskSky({ sunX: 300, hy: 790 });
    duskRigs(800, [[200, 260, 3], [1760, 300, 4]], 'b');
    legs([[[520, 830], [820, -300], 40, 30], [[1420, 830], [1110, -300], 40, 30]], 'f3');
    hangLamp([770, 110], 130, 22, t, broke ? spring(t, SN2, 3, 9) * .3 : 0, .6);
    // the rod: bows on the first drive, bows harder and snaps on the second
    const bow = broke ? 92 : (t >= SN1 ? 44 * Math.exp(-(t - SN1) * 5) * Math.cos((t - SN1) * 13) : 0) + 92 * easeIn(seg(t, SN2 - .22, SN2)) + 2 * Math.sin(t * 30);
    const R = []; for (let i = 0; i <= 20; i++) { const u = i / 20; R.push([X0 + bow * Math.sin(u * Math.PI), lerp(-300, 820, u)]); }
    seed('f3Rod');
    const rodDraw = (P, key) => {
      seed('f3R' + key);
      pfill(limb(P, P.map(() => 26)), AP.pine, { tone: .72, dens: .9, sw: 1.1 });
      plit(limb(P.map(p => [p[0] - 6, p[1]]), P.map(() => 6)), .55, mixCol(AP.lamp, AP.paperLt, .4));
      pshade(limb(P.map(p => [p[0] + 7, p[1]]), P.map(() => 9)), AP.graphite, .7);
    };
    const bi = 9;                                                   // the break, a little above the middle
    if (!broke) rodDraw(R, 'w');
    else {
      const kU = easeOut(clamp(e2 / .18)), aU = kU * .55 + spring(t, SN2 + .18, 3, 7) * .25, aL = -easeOut(clamp(e2 / .3)) * .32 - spring(t, SN2 + .3, 4, 9) * .06;
      const up = R.slice(0, bi + 1).map(p => rot2(p, aU, R[0])), lo = R.slice(bi).map(p => rot2(p, aL, R[20]));
      const jag = (P, end, dir, key) => { const a = P[end], sd = P[end === 0 ? 1 : P.length - 2], u = [a[0] - sd[0], a[1] - sd[1]], d = Math.hypot(...u) || 1; const v = [u[0] / d, u[1] / d], n = [-v[1], v[0]];
        const pts = []; for (let j = 0; j <= 6; j++) { const o = (j / 6 - .5) * 26, l = (j % 2 ? 26 : 6) + hash(j + key) * 16; pts.push([a[0] + n[0] * o + v[0] * l, a[1] + n[1] * o + v[1] * l]); }
        seed('f3J' + key); pfill([[a[0] - n[0] * 13, a[1] - n[1] * 13], ...pts, [a[0] + n[0] * 13, a[1] + n[1] * 13]], AP.pine, { tone: .8, dens: 1, sw: 1 }); };
      rodDraw(up, 'u'); jag(up, up.length - 1, 1, 1);
      rodDraw(lo, 'l'); jag(lo, 0, -1, 2);
      // splinters and a pencil burst at the break
      const bp = R[bi];
      if (e2 < .16) { seed('f3Burst'); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + hash(i) * .3, r0 = 40 + e2 * 300, r1 = r0 + 60 + hash(i * 3) * 60; pline([polar(bp, a, r0), polar(bp, a, r1)], 1.8, AP.graphite, { over: 0, passes: 1, alpha: 1 - e2 / .16 }); } }
      seed('f3Spl');
      for (let i = 0; i < 12; i++) {
        const k = clamp(e2 / (.5 + hash(i) * .3)); if (k >= 1) continue;
        const p = arcPt(bp, [bp[0] + (hash(i * 5) - .45) * 900, bp[1] + 300 + hash(i * 7) * 200], 180 + hash(i * 2) * 220, k), a = k * 12 * (hash(i) - .5) + i;
        pfill([polar(p, a, 16), polar(p, a + 2.9, 4), polar(p, a + Math.PI, 16), polar(p, a - .2, 4)], AP.pine, { tone: .8, sw: .8 });
      }
      if (e2 < 1) { seed('f3Dust'); for (let i = 0; i < 6; i++) psmoke(bp[0] + (hash(i) - .5) * 160 * (e2 + .3), bp[1] + (hash(i + 3) - .5) * 80 - e2 * 60, 30 + e2 * 80, mixCol(AP.dust, VIO, .3), .5 * (1 - e2)); }
    }
    // the floor clamp the rod runs through
    seed('f3Clamp'); pfill(rrPts(X0 - 60, 780, 120, 50, 8), AP.iron, { tone: .9, dens: 1.1, sw: 1.3 });
    // hand2 at the rod flinches from the snap; the driller, further off, jerks round
    LIGHT = [.9, .45];
    const f2 = broke ? easeOut(clamp((e2 - .04) / .16)) : 0, rec = broke ? ease(clamp((e2 - .3) / .3)) : 0;
    const p2 = kp(f2, [[0, { flip: true, lean: .2, shF: .45, elF: 1.7, shB: .3, elB: 1.8, hpF: .15, hpB: -.1, knF: .15, head: .1, face: 'grit', look: -.2 }],
      [1, { flip: true, lean: -.35 + rec * .12, shF: 2.4, elF: 1.4, shB: 2.1, elB: 1.5, hpF: .35, knF: .3, hpB: -.35, knB: .25, head: -.2, face: 'wince', look: -.6, dx: .35 }]]);
    seed('f3Hand2'); man(1330, 836, 74, { ...p2, blink: broke ? clamp(1 - Math.abs(e2 - .1) * 10) : 0 }, CAST.hand2);
    const fd = broke ? easeOut(clamp((e2 - .12) / .2)) : 0;
    seed('f3Driller'); man(430, 836, 80, { lean: .08 - fd * .22, shF: .45 + fd * .2, elF: .75, shB: .3 + fd * .2, elB: .9, hpF: .1, hpB: -.1, head: -fd * .25, face: fd > .5 ? 'shout' : 'neutral', mouth: fd * .3, look: .4, blink: broke ? clamp(1 - Math.abs(e2 - .14) * 10) : 0 }, CAST.driller,
      { hold: J => sledge(J.handF, Math.PI / 2 - .12, 80, { key: 'f3', len: 3.1 }) });
    planks(836, { key: 'f3' });
    camOff();
    speedLines(arrive, true, 'f3');
  }

  // ================= F4 · 199.44 · hammering it straight on the anvil =================
  const AN = [374, 376].map(bt);                                        // 199.98, 201.05
  function anvil(x, y, s) {                                             // (x, y) = middle of the face
    seed('f4Anvil');
    pfill([[x - 1.3 * s, y + 3 * s], [x + 1.3 * s, y + 3 * s], [x + 1.1 * s, y + 5.2 * s], [x - 1.1 * s, y + 5.2 * s]], mixCol(AP.timberDk, VIO, .2), { tone: .8, dens: 1, sw: 1.1 });   // stump
    for (let i = 0; i < 3; i++) pline(ellPts(x, y + 3 * s, (.4 + i * .35) * s, .1 * s, 12), .6, AP.timberDk, { closed: true, passes: 1 });
    pfill([[x - .7 * s, y + 1 * s], [x + .7 * s, y + 1 * s], [x + 1 * s, y + 3 * s], [x - 1 * s, y + 3 * s]], AP.iron, { tone: .9, dens: 1.1, sw: 1.2 });
    pfill([[x - 1.6 * s, y], [x + 1.8 * s, y], [x + 1.7 * s, y + .45 * s], [x + .6 * s, y + .6 * s], [x + .45 * s, y + 1.05 * s], [x - .45 * s, y + 1.05 * s], [x - .6 * s, y + .6 * s], [x - 1.5 * s, y + .45 * s]], AP.iron, { tone: .9, dens: 1.1, sw: 1.3 });
    pfill([[x - 1.6 * s, y], [x - 2.9 * s, y + .12 * s], [x - 1.6 * s, y + .45 * s]], AP.iron, { tone: .9, sw: 1.1 });   // horn
    plit([[x - 1.5 * s, y + .04 * s], [x + 1.7 * s, y + .04 * s], [x + 1.7 * s, y + .14 * s], [x - 1.5 * s, y + .14 * s]], .8, mixCol(AP.lamp, AP.paperLt, .3));
  }
  function anvilShot(t, lt, dur) {
    const sd = 90, hitK = AN.reduce((a, b) => a + (t >= b ? Math.exp(-(t - b) * 9) : 0), 0), sh = shakeXY(t, hitK * 6);
    camOn(1000 + sh[0], 440 + sh[1], lerp(.96, 1.0, ease(lt / dur)));
    duskSky({ sunX: 1600, hy: 800 });
    duskRigs(810, [[260, 300, 5], [1500, 240, 6]], 'c');
    legs([[[160, 840], [520, -300], 40, 30]], 'f4');
    // the forge at the right: its red is the light here
    const fr = .8 + .12 * Math.sin(t * 7) + .4 * hitK;
    pglow(1560, 640, 760, AP.fire, .55 * fr); pglow(1560, 640, 260, AP.lamp, .5 * fr);
    seed('f4Forge');
    pfill([[1420, 660], [1720, 660], [1700, 840], [1440, 840]], mixCol(AP.hell, VIO, .35), { tone: .85, dens: 1, sw: 1.1 });
    for (let r = 0; r < 4; r++) pline([[1430, 700 + r * 36], [1712, 700 + r * 36]], .6, AP.graphite, { over: 0, passes: 1 });
    pfill(ellPts(1570, 655, 130, 22, 14), AP.ember, { tone: .7 + .2 * fr, dens: .8, sw: .9 });
    // anvil where the sledge lands; the driller placed so his hamDown face meets it
    const S = strikeAt(sd, CAST.driller, false, hamAnvil()), G = 846, ay = G + S[1] + 8, ax = 1060, fx = ax - S[0], fy = G;
    anvil(ax, ay, (G - ay) / 5.2);
    // the bent iron: a hump that the blows flatten (orange from the forge, dimming)
    const bend = t < AN[0] ? .9 : t < AN[1] ? .45 : .06, spr = AN.reduce((a, b) => a + spring(t, b, 9, 40) * .08, 0);
    const h = 34 * (bend + spr), heat = .55 + .35 * hitK;
    const bar = [[ax - 230, ay - 6], [ax - 90, ay - 6 - h * .4], [ax, ay - 6 - h], [ax + 90, ay - 6 - h * .45], [ax + 230, ay - 6]];
    pglow(ax, ay - h, 160, AP.fire, heat * .7);
    seed('f4Bar'); pfill(limb(bar, [16, 16, 17, 16, 16], 5), mixCol(AP.ember, AP.lamp, heat * .4), { tone: .8, dens: .9, sw: 1.1 });
    plit(limb(bar.map(p => [p[0], p[1] - 4]), [4, 4, 5, 4, 4], 5), .7, AP.lamp);
    // hand1 holds the far end in the smith's tongs
    LIGHT = [-.85, .5];
    const tg = [ax + 520, ay + 70], hold = add2(tg, [0, spr * 30]);
    tongs([ax + 220, ay - 6], hold, 26);
    reach('f4Hand1', ax + 720, 846, 78, { flip: true, lean: .3, hpF: .3, knF: .3, hpB: -.25, knB: .15, head: .25 + hitK * .15, face: hitK > .3 ? 'wince' : 'grit', look: -.3 }, CAST.hand1, { F: add2(hold, [30, 0]), B: add2(hold, [80, 10]) });
    // the driller: winding up, the strike on the beat, the hold, the recoil
    const k = hamK(t, AN[0], 2 * BEAT), P = hamPose(k, hamAnvil(), HAM_UP_A);
    LIGHT = [-.8, .6];
    seed('f4Driller');
    man(fx, fy, sd, { ...P, blink: clamp(1 - Math.abs(k - .8) * 12) * .8 }, CAST.driller, { hold: J => sledge(J.handF, J.angF + P.off * J.dir, sd, { key: 'a' }) });
    for (const b of AN) sparks([ax, ay - 12], t - b, 'a' + b);
    planks(846, { key: 'f4', top: 20 });
    camOff();
  }

  // ================= F5 · 201.58 · splicing the rod =================
  const SP = [378, 380].map(bt);                                        // 202.12, 203.19: yanks
  const LASH = [960, 562];                                               // screen spot the wire coils match-cut to
  function splice(t, lt, dur) {
    const yank = SP.reduce((a, b) => { const e = t - b; return a + (e >= -.12 && e < 0 ? easeIn((e + .12) / .12) : e >= 0 && e < .6 ? Math.exp(-e * 5) : 0); }, 0);
    const tight = SP.reduce((a, b) => a + (t >= b ? 1 : 0), 0);
    camOn(960, 480, lerp(1.06, 1.12, ease(lt / dur)));
    duskSky({ sunX: 900, hy: 820 });
    duskRigs(812, [[330, 280, 7], [1600, 320, 8]], 'd');
    const lp = hangLamp([780, 60], 140, 22, t, 0, .7);
    // two trestles and the rod across them, the break in the middle fished with an iron strap
    seed('f5Trestle');
    for (const tx of [620, 1300]) { for (const d of [-1, 1]) pfill(limb([[tx, 590], [tx + d * 70, 846]], [14, 12]), TIMB, { tone: .8, sw: 1 }); pfill(rectPts(tx - 60, 586, 120, 16), mixCol(AP.timber, VIO, .2), { tone: .8, sw: 1 }); }
    seed('f5Rod');
    for (const [a, b] of [[[480, 566], [950, 562]], [[970, 562], [1440, 566]]]) { pfill(limb([a, b], [24, 24]), AP.pine, { tone: .72, dens: .9, sw: 1.1 }); plit(limb([add2(a, [0, -6]), add2(b, [0, -6])], [5, 5]), .5, mixCol(AP.lamp, AP.paperLt, .4)); }
    pfill(rectPts(870, 546, 180, 32), AP.iron, { tone: .9, dens: 1, sw: 1.1 });
    // the lashing: coils bunch tighter with each yank
    const n = 7 + 2 * tight, gap = lerp(20, 13, clamp(tight / 2)) - yank * 2;
    seed('f5Lash');
    for (let i = 0; i < n; i++) { const cx = LASH[0] + (i - (n - 1) / 2) * gap; pline([[cx - 6, LASH[1] - 22], [cx + 2, LASH[1]], [cx + 6, LASH[1] + 22]], 2.6, '#B89A68', { curv: true, over: 0, passes: 1 }); pline([[cx - 4, LASH[1] - 20], [cx + 2, LASH[1] - 4]], .8, AP.paperLt, { over: 0, passes: 1, alpha: .5 }); }
    const endL = [LASH[0] - (n - 1) / 2 * gap - 6, LASH[1] - 20], endR = [LASH[0] + (n - 1) / 2 * gap + 6, LASH[1] + 20];
    if (yank > .5) { seed('f5Creak'); for (let i = 0; i < 4; i++) pline([[LASH[0] - 60 + i * 40, LASH[1] - 44], [LASH[0] - 56 + i * 40, LASH[1] - 60]], 1, AP.graphite, { over: 0, passes: 1, alpha: yank - .5 }); }
    // the two hands haul the ends apart on the beat, gather between
    LIGHT = [.5, .85];
    const pull = (lag, fl) => { const y = clamp(yank); return kp(y, [[0, { flip: fl, lean: .35, hpF: .35, knF: .35, hpB: -.3, knB: .15, head: .2, face: 'grit' }],
      [1, { flip: fl, lean: -.45, hpF: .55, knF: .2, hpB: -.45, knB: .35, head: -.15, face: 'shout', mouth: .3 }]]); };
    const JL = reach('f5Hand1', 330, 846, 78, pull(0, false), CAST.hand1, { F: [endL[0] - 190 - yank * 40, endL[1] - 20], B: [endL[0] - 250 - yank * 40, endL[1] - 12] });
    const JR = reach('f5Hand2', 1590, 846, 74, pull(0, true), CAST.hand2, { F: [endR[0] + 190 + yank * 40, endR[1] - 60], B: [endR[0] + 250 + yank * 40, endR[1] - 50] });
    seed('f5Ropes');
    pline([endL, [endL[0] - 80, endL[1] - 20], JL.handF, JL.handB, [JL.handB[0] - 60, JL.handB[1] + 80]], 2.6, '#B89A68', { curv: true, over: 0 });
    pline([endR, [endR[0] + 80, endR[1] - 30], JR.handF, JR.handB, [JR.handB[0] + 60, JR.handB[1] + 90]], 2.6, '#B89A68', { curv: true, over: 0 });
    sweat(add2(JL.head, [.1 * 78, -.3 * 78]), 78, t, 21, 1);
    planks(846, { key: 'f5', top: 18 });
    camOff();
  }

  // ================= F6 · 203.42 · fencing wire round the split beam =================
  const COIL0 = 203.62, COILP = BEAT / 2, NCOIL = 8;                  // two turns of wire to the beat
  const TWIST = bt(385), START = TWIST + .1, STROKES = [386, 387, 388].map(bt);
  function beamF(pv, s, ang) {
    seed('f6Beam');
    const wellEnd = polar(pv, Math.PI + ang, 4.2 * s), crankEnd = polar(pv, ang, 2.6 * s);
    pfill([[pv[0] - .5 * s, pv[1] + 3 * s], [pv[0] - .2 * s, pv[1]], [pv[0] + .2 * s, pv[1]], [pv[0] + .5 * s, pv[1] + 3 * s]], TIMB, { tone: .75, sw: 1.1 });
    pfill(limb([wellEnd, pv, crankEnd], [.35 * s, .5 * s, .35 * s]), AP.timber, { tone: .72, dens: .9, sw: 1.3 });
    plit(limb([add2(wellEnd, [0, -.12 * s]), add2(pv, [0, -.18 * s])], [.06 * s, .08 * s]), .5, mixCol(AP.fire, AP.paperLt, .4));
    pshade(limb([add2(wellEnd, [0, .1 * s]), add2(pv, [0, .16 * s]), add2(crankEnd, [0, .1 * s])], [.14 * s, .2 * s, .14 * s]), AP.graphite, .6);
    pfill(ellPts(pv[0], pv[1], .18 * s, .18 * s, 10), AP.iron, { tone: .9, sw: .8 });
    return { wellEnd, crankEnd };
  }
  function wireShot(t, lt, dur) {
    const s = 108, pv = [1200, 562];
    // the beam: level and still until the engine starts, then pumping, landing on the beats
    let lift = .5, gap = 0, hitK = 0;
    if (t >= START) {
      const first = STROKES[0], u0 = seg(t, START, first);
      if (t < first) lift = u0 < .78 ? lerp(.5, 1, easeOut(u0 / .78)) : 1 - easeIn((u0 - .78) / .22);
      else { const q = frac((t - first) / BEAT); lift = q < .7 ? easeOut(q / .7) : 1 - easeIn((q - .7) / .3); }
      for (const b of STROKES) { const e = t - b; if (e >= 0 && e < .6) { hitK += Math.exp(-e * 8); gap += 5 * Math.exp(-e * 7) * (b === STROKES[0] ? 1 : .6); } }
    }
    const ang = lerp(-.15, .15, lift) + (t >= STROKES[0] ? spring(t, STROKES[0], 8, 34) * .015 : 0), sh = shakeXY(t, hitK * 5);
    const zin = ease(seg(t, 205.3, 206.3));
    camOn(lerp(960, 960, zin) + sh[0], lerp(480, 455, zin) + sh[1], lerp(1.02, 1.08, ease(lt / dur)) + .4 * zin);
    duskSky({ sunX: 1250, hy: 800 });
    duskRigs(830, [[180, 240, 9], [1650, 200, 10]], 'e');
    // the derrick over the well at the left; the engine to the right driving the beam
    derrick(700, 880, 1000, { col: TIMB, key: 'f6', floor: false, bays: 6 });
    const E = engine(1840, 880, 46, { ph: t >= START ? (t - START) * 1.87 : 0, fire: .8 + .1 * Math.sin(t * 8), gauge: .7, smoke: t >= START ? 1 : .35, smokePh: t * .6, shake: t >= START ? .15 : 0 });
    pglow(E.door[0], E.door[1], 700, AP.fire, .5);
    LIGHT = [-.8, .55];
    const B = beamF(pv, s, ang);
    seed('f6Cable'); pline([B.wellEnd, [B.wellEnd[0], 900]], 2.4, AP.iron, { over: 0 });
    pline([B.crankEnd, [1760, 700]], 3, AP.iron, { over: 0 });
    // the split: a jagged crack across the beam 2.2s left of the pivot, gaping on each slam
    const dirW = [Math.cos(Math.PI + ang), Math.sin(Math.PI + ang)], nrm = [-dirW[1], dirW[0]], C = add2(pv, [dirW[0] * 2.2 * s, dirW[1] * 2.2 * s]);
    const at = (a, b) => [C[0] + dirW[0] * a + nrm[0] * b, C[1] + dirW[1] * a + nrm[1] * b];
    seed('f6Crack');
    const cr = [[-6, -.34 * s], [8, -.2 * s], [-4, -.06 * s], [10, .08 * s], [-3, .22 * s], [6, .34 * s]];
    if (gap > .3) pfill(cr.map(([a, b]) => at(a - gap * .5, b)).concat(cr.slice().reverse().map(([a, b]) => at(a + gap * .5, b))), AP.coal, { tone: .95, ink: null });
    pline(cr.map(([a, b]) => at(a - gap * .5, b)), 1.2, AP.graphite, { over: 0 });
    pline([at(10, .08 * s), at(60, .12 * s), at(120, .1 * s)], .8, AP.graphite, { over: 0, passes: 1 });
    pline([at(-4, -.06 * s), at(-70, -.1 * s)], .8, AP.graphite, { over: 0, passes: 1 });
    if (gap > .8) { seed('f6CrDust'); for (let i = 0; i < 3; i++) psmoke(C[0] + (hash(i) - .5) * 30, C[1] + .3 * s + i * 8, 10 + gap * 3, AP.dust, .3 * gap / 5); }
    // the wire: two turns to the beat, then the pigtail twisted up with pliers
    const done = Math.min(NCOIL, Math.max(0, (t - COIL0) / COILP)), span = 88;
    seed('f6Wire');
    const strain = clamp(gap / 5);
    for (let i = 0; i < Math.ceil(done); i++) {
      const k = clamp(done - i), a = -span / 2 + i * span / (NCOIL - 1) + (i % 2) * 2;
      const P = [at(a - 11, -.4 * s), at(a + 2 + strain * 3, 0), at(a + 11, .4 * s)];
      pline(partial(through(P, 5), k), 2.2, '#5E5C5A', { over: 0, passes: 1 });
      if (k >= 1) pline([at(a - 9, -.34 * s), at(a - 3, -.12 * s)], .9, mixCol(AP.fire, AP.paperLt, .5), { over: 0, passes: 1, alpha: .8 });
    }
    const tw = ease(seg(t, TWIST - .3, TWIST + .15));
    if (tw > 0) { const base = at(span / 2 + 6, -.37 * s), P = []; for (let j = 0; j <= 10; j++) { const u = j / 10 * tw; P.push([base[0] + Math.sin(u * 16) * 5 + u * 10, base[1] - u * 46]); } pline(P, 1.3, '#8E8C88', { over: 0, passes: 1 }); }
    if (strain > .2) { seed('f6Strain'); for (let i = 0; i < 3; i++) pline([at(-span / 2 - 10 + i * 45, -.55 * s), at(-span / 2 - 4 + i * 45, -.7 * s)], 1, AP.graphite, { over: 0, passes: 1, alpha: strain }); }
    // Bill: winding (near hand circling the beam with the pliers, far hand steadying it), then stepping back to watch
    const wind = t < TWIST + .2, back = ease(seg(t, TWIST + .25, TWIST + .75)), cur = Math.min(NCOIL - 1, Math.floor(done)), ca = -span / 2 + cur * span / (NCOIL - 1);
    const orb = frac(done) * TAU, hF = wind ? (t < TWIST - .3 ? at(ca + 6, Math.cos(orb) * .5 * s) : at(span / 2 + 10, -.6 * s - 30 * Math.sin(t * 20) * tw)) : null;
    const held = STROKES.some(b => t > b + .35), relief = ease(seg(t, STROKES[0] + .45, STROKES[0] + .7));
    const pb = { flip: true, lean: .35 - back * .45, head: .15 - back * .45, hpF: .3 - back * .25, knF: .25, hpB: -.3 + back * .2, knB: .1, dx: back * .7,
      face: !wind ? (relief > .5 ? 'smile' : 'worry') : 'grit', look: .3, blink: clamp(1 - Math.abs(t - (STROKES[0] + .58)) * 10) + clamp(1 - Math.abs(t - (TWIST + .35)) * 10), mouth: held ? .1 : 0 };
    const tgt = wind ? { F: hF, B: at(span / 2 + 36, .05 * s) } : null;
    const P0 = wind ? pb : { ...pb, ...kp(relief, [[0, { shF: .75, elF: 1.9, shB: .55, elB: 1.8 }], [1, { shF: 2.5, elF: .5, shB: .35, elB: 1.5 }]], backOut) };
    const JB = reach('f6Bill', 1140, 880, 76, P0, CAST.bill, tgt, { front: J => {
      if (!wind) return; seed('f6Pliers'); const a = J.angF; pfill([J.handF, polar(J.handF, a - .12, 44), polar(J.handF, a + .12, 44)], AP.iron, { tone: .9, sw: .9 }); } });
    sweat(add2(JB.head, [-.2 * 76, -.25 * 76]), 76, t, 31, 1);
    planks(880, { key: 'f6' });
    camOff();
    if (lt > dur - .35) pageTurn((lt - (dur - .35)) / .7, 1);
  }

  // ================= F7 · 207.68 · wringing it from the bedrock =================
  const TURNS = [390, 392, 394].map(bt);                                // 208.53, 209.60, 210.67: the pipe gives
  function wring(t, lt, dur) {
    const PX = 1000;
    let rot = 0, lurch = 0; for (const b of TURNS) { const e = t - b; if (e >= 0) { rot += easeOut(clamp(e / .28)) / 6; lurch += Math.exp(-e * 4) * easeOut(clamp(e / .1)); } }
    const build = TURNS.reduce((a, b) => a + clamp(1 - Math.abs(t - b + .35) / .45), 0);                           // strain peaks just before each turn
    const tr = k => (.6 + build) * (Math.sin(t * 43 + k) * .5 + Math.sin(t * 27.3 + k * 2) * .5);
    const push = ease(seg(t, 208.75, 210.95)), z = lerp(1, 1.85, push), sh = shakeXY(t, lurch * 5);
    camOn(lerp(960, 560, push) + sh[0], lerp(480, 420, push) + sh[1], z);
    duskSky({ sunX: 1500, hy: 800 });
    duskRigs(800, [[240, 270, 11], [1780, 320, 12]], 'f');
    legs([[[560, 846], [860, -300], 40, 30], [[1500, 846], [1180, -300], 40, 30]], 'f7');
    const lp = hangLamp([760, 150], 170, 22, t, lurch * .06, .55);
    pglow(1900, 700, 600, AP.fire, .45);
    // the pipe, its collar turning: bolt heads and a chalk mark slide round
    seed('f7Pipe');
    pfill(rectPts(PX - 30, -300, 60, 1150), AP.iron, { tone: .85, dens: 1, sw: 1.3 });
    plit(rectPts(PX - 24, -300, 12, 1150), .6, mixCol(AP.lamp, AP.paperLt, .35), { kind: 'v' });
    pshade(rectPts(PX + 8, -300, 20, 1150), AP.graphite, 1.2);
    const cT = 380, cB = 500, CW = 96;
    pfill([[PX - CW, cT + 14], [PX - CW + 14, cT], [PX + CW - 14, cT], [PX + CW, cT + 14], [PX + CW, cB - 14], [PX + CW - 14, cB], [PX - CW + 14, cB], [PX - CW, cB - 14]], AP.iron, { tone: .9, dens: 1.1, sw: 1.8 });
    plit([[PX - CW + 8, cT + 18], [PX - 40, cT + 18], [PX - 40, cB - 18], [PX - CW + 8, cB - 18]], .8, mixCol(AP.lamp, AP.rust, .25));
    pshade([[PX + 30, cT + 8], [PX + CW - 2, cT + 14], [PX + CW - 2, cB - 14], [PX + 30, cB - 8]], AP.graphite, 1.4);
    seed('f7Bolts');
    for (let i = 0; i < 8; i++) { const a = (i / 8 + rot) * TAU, c = Math.cos(a); if (c < .05) continue; pfill(ellPts(PX + Math.sin(a) * (CW - 12), (cT + cB) / 2, 9 * c + 2, 9, 8), c > .6 ? mixCol(AP.ironLt, AP.lamp, .3) : AP.ironLt, { tone: .9, sw: .8 }); }
    const ma = (rot + .1) * TAU; if (Math.cos(ma) > 0) pline([[PX + Math.sin(ma) * 28, 520], [PX + Math.sin(ma) * 28, 840]], 3.2, AP.paperLt, { over: 0, passes: 1, alpha: .75 * Math.cos(ma) });
    // the tongs: the driller alone on the left handle, the rest of the crew on the right
    const jl = [PX - 22, 610], hL = add2(jl, rot2([-640, 70], -lurch * .06)), jr = [PX + 22, 650], hR = add2(jr, rot2([640, 70], lurch * .06));
    const along = (j, h, k, dy = 0) => [lerp(j[0], h[0], k), lerp(j[1], h[1], k) + dy];
    LIGHT = [-.75, .65];
    // right side: hand2, hand1 hauling; the boss on a rope off the handle's end
    const haul = (k, fl) => ({ flip: fl, lean: -.35 - .06 * build + tr(k) * .01 - lurch * .15, head: -.1, hpF: .5, knF: .25, hpB: -.4, knB: .3, dx: lurch * .3, face: build > .5 ? 'shout' : 'grit', mouth: .15 + .2 * build, blink: clamp(1 - Math.abs(frac(t / 2.1 + k) - .5) * 14) });
    tongsF(jr, hR, 46);
    reach('f7Boss', 1870, 846, 70, haul(3, true), CAST.boss, { F: [1760, 690], B: [1820, 700] });
    seed('f7Rope'); pline([hR, [1700, 700], [1790, 700], [1900, 720], [2100, 760]], 2.4, '#B89A68', { curv: true, over: 0 });
    const J2 = reach('f7Hand2', 1590, 846, 76, haul(2, true), CAST.hand2, { F: along(jr, hR, .74, -6), B: along(jr, hR, .86, -4) });
    const J1 = reach('f7Hand1', 1330, 846, 82, haul(1, true), CAST.hand1, { F: along(jr, hR, .36, -8), B: along(jr, hR, .5, -6) });
    tongsF(jl, hL, 48);
    // the driller: heaving the left handle alone, arms knotted, trembling
    LIGHT = [.8, .55];
    const pd = { lean: .62 + .05 * build + tr(5) * .012 + lurch * .12, head: -.35, hpF: .7, knF: 1.0, hpB: -.5, knB: .12, dx: lurch * .35, face: 'grit', mouth: .12 + .3 * build + .3 * lurch, blink: clamp(1 - Math.abs(t - 209.25) * 10) };
    const JD = reach('f7Driller', 390, 846, 98, pd, CAST.driller, { F: along(jl, hL, .5, tr(6) * 2), B: along(jl, hL, .66, 2) }, { front: J => knots(J, .5 + .5 * push, 98) });
    sweat(add2(JD.head, [.25 * 98, -.2 * 98]), 98, t, 41); sweat(add2(J1.head, [-.1 * 82, -.3 * 82]), 82, t, 42, 1);
    if (lurch > .2) { seed('f7Grunt'); for (let i = 0; i < 3; i++) pline([add2(JD.head, [70 + i * 8, -60 + i * 30]), add2(JD.head, [110 + i * 14, -80 + i * 36])], 1.2, AP.graphite, { over: 0, passes: 1, alpha: lurch }); }
    planks(846, { key: 'f7', top: 20 });
    camOff();
    if (lt < .35) pageTurn(.5 + lt / .7, 1);
  }

  // ================= F8 · 211.23 · chorus: max effort at dusk =================
  const DS = [396, 398, 400, 402, 404].map(bt), HS = [397, 399, 401, 403, 405].map(bt);   // driller evens, hand1 odds
  function crewWide(t, lt, dur) {
    const PX = 960, allB = DS.concat(HS), hitK = allB.reduce((a, b) => a + (t >= b ? Math.exp(-(t - b) * 9) : 0), 0), sh = shakeXY(t, hitK * 4);
    camOn(900 + sh[0], 490 + sh[1], lerp(.94, .99, ease(lt / dur)));
    duskSky({ sunX: 1250, hy: 790 });
    duskRigs(800, [[140, 280, 13], [520, 200, 14]], 'g');
    // the engine behind at the right; Bill heaving logs in on the beat, the firebox roaring
    const q = frac(bpOf(t) + .5), throwK = q < .6 ? easeOut(q / .6) : 1 - easeIn((q - .6) / .4), roar = Math.exp(-frac(bpOf(t)) * 5);
    const E = engine(1560, 800, 32, { ph: t * 3.2, fire: .8 + .4 * roar, gauge: .85 + .05 * Math.sin(t * 30), shake: .3, smokePh: t * 1.1 });
    pglow(E.door[0], E.door[1], 520, AP.fire, .6 + .4 * roar);
    LIGHT = [-.85, .5];
    seed('f8Bill'); man(E.door[0] - 120, 800, 36, kp(throwK, [[0, { lean: .55, shF: .5, elF: .35, shB: .95, elB: .55, hpF: .55, knF: .7, hpB: -.4, knB: .2, head: .15, face: 'grit' }],
      [1, { lean: .35, shF: 1.25, elF: .05, shB: 1.1, elB: .25, hpF: .4, knF: .25, hpB: -.5, knB: .1, face: 'shout' }]]), CAST.bill);
    // derrick legs, crossbar, lantern and the sheave for the bull rope
    legs([[[560, 812], [860, -300], 36, 26], [[1360, 812], [1060, -300], 36, 26]], 'f8');
    pfill(limb([[600, 150], [1320, 150]], [20, 20]), TIMB, { tone: .8, sw: 1 });
    const swing = allB.reduce((a, b) => a + spring(t, b, 3.5, 8) * .03, 0);
    hangLamp([1180, 150], 90, 22, t, swing, .7);
    const sheave = [640, 150]; seed('f8Sheave'); pfill(ellPts(sheave[0], sheave[1] + 18, 24, 24, 14), AP.iron, { tone: .85, sw: 1 });
    // the pipe and the drive clamp; both sledges land on it
    const sd = 80, s1 = 76, SD = strikeAt(sd, CAST.driller), S1 = strikeAt(s1, CAST.hand1, true);
    const clampY = 812 + (SD[1] + S1[1]) / 2, dX = PX - 40 - SD[0], hX = PX + 40 - S1[0];
    const kick = allB.reduce((a, b) => a + (t >= b ? Math.exp(-(t - b) * 12) * 8 : 0), 0);
    seed('f8Pipe');
    pfill(rectPts(PX - 22, -300, 44, 1120 + kick), AP.iron, { tone: .85, dens: 1, sw: 1.2 });
    plit(rectPts(PX - 16, -300, 9, 1120), .6, mixCol(AP.lamp, AP.paperLt, .4), { kind: 'v' });
    pfill(rrPts(PX - 40, clampY - 56 + kick, 80, 112, 8), AP.iron, { tone: .9, dens: 1.1, sw: 1.4 });
    plit(rectPts(PX - 30, clampY - 46 + kick, 16, 92), .6, mixCol(AP.lamp, AP.rust, .3));
    // the bull rope: hand2 and the boss haul on the off-beats at the left
    const pullP = (lag, a) => { const q2 = frac(bpOf(t) - lag + .5), k = q2 < .5 ? easeIn(q2 / .5) : 1 - ease((q2 - .5) / .5);
      return kp(k, [[0, { lean: .25, shF: 2.5, elF: .15, shB: 2.25, elB: .25, hpF: .3, knF: .2, hpB: -.25, knB: .15, head: -.25, face: 'grit' }],
        [1, { lean: -.4 * a, shF: 1.25, elF: .45, shB: 1.4, elB: .25, hpF: .5, knF: .3, hpB: -.4, knB: .35, head: .05, face: 'shout', mouth: .35 }]]); };
    LIGHT = [.6, .75];
    const JB = (seed('f8Boss'), man(-10, 812, 64, { ...pullP(.06, .7), flip: false }, CAST.boss));
    const J2 = (seed('f8Hand2'), man(190, 812, 68, pullP(0, 1), CAST.hand2, { hold: J => {
      seed('f8Rope'); pline([[sheave[0] - 22, sheave[1] + 20], J.handF, J.handB, JB.handF, JB.handB, [-120, 790], [-200, 806]], 2.6, '#B89A68', { curv: true, over: 0 }); } }));
    // hand1 (right, facing left) and the driller (left) alternate: a blow on every beat
    const k1 = hamK(t, HS[0], 2 * BEAT), kD = hamK(t, DS[0], 2 * BEAT);
    LIGHT = [.8, .55];
    seed('f8Hand1'); man(hX, 812, s1, { ...hamPose(k1), flip: true, blink: clamp(1 - Math.abs(k1 - .8) * 12) * .8 }, CAST.hand1, { hold: J => sledge(J.handF, J.angF + .9 * J.dir, s1, { key: 'h' }) });
    LIGHT = [-.8, .6];
    seed('f8Driller'); const JD = man(dX, 812, sd, { ...hamPose(kD), blink: clamp(1 - Math.abs(kD - .8) * 12) * .8 }, CAST.driller, { hold: J => sledge(J.handF, J.angF + .9 * J.dir, sd, { key: 'd' }) });
    for (const b of DS) sparks([PX - 40, clampY], t - b, 'd' + b);
    for (const b of HS) sparks([PX + 40, clampY], t - b, 'h' + b, { tilt: .3 });
    sweat(add2(JD.head, [-.1 * sd, -.35 * sd]), sd, t, 51);
    planks(812, { key: 'f8', top: 16 });
    camOff();
  }

  // ================= F9 · 214.05 · low angle on the driller =================
  function crewClose(t, lt, dur) {
    const allB = DS.concat(HS), hitK = allB.reduce((a, b) => a + (t >= b ? Math.exp(-(t - b) * 9) : 0), 0), sh = shakeXY(t, hitK * 7);
    camOn(960 + sh[0], 520 + sh[1], lerp(1, 1.06, ease(lt / dur)));
    duskSky({ sunX: 520, hy: 860, cy: 20 });
    legs([[[1500, 1000], [1250, -300], 50, 36]], 'f9');
    hangLamp([1240, 70], 120, 26, t, allB.reduce((a, b) => a + spring(t, b, 3.5, 8) * .04, 0), .75);
    const sd = 108, S = strikeAt(sd, CAST.driller), PX = 1160, g = 918, dX = PX - 50 - S[0], clampY = g + S[1];
    const kick = allB.reduce((a, b) => a + (t >= b ? Math.exp(-(t - b) * 12) * 12 : 0), 0);
    seed('f9Pipe');
    pfill(rectPts(PX - 34, -300, 68, 1600), AP.iron, { tone: .85, dens: 1, sw: 1.3 });
    plit(rectPts(PX - 26, -300, 14, 1600), .6, mixCol(AP.lamp, AP.paperLt, .4), { kind: 'v' });
    pshade(rectPts(PX + 10, -300, 22, 1600), AP.graphite, 1.2);
    pfill(rrPts(PX - 58, clampY - 90 + kick, 116, 180, 10), AP.iron, { tone: .9, dens: 1.1, sw: 1.6 });
    plit(rectPts(PX - 46, clampY - 76 + kick, 22, 150), .6, mixCol(AP.lamp, AP.rust, .3));
    // hand1's sledge swings in from the right on the off beats (he is just out of frame)
    const k1 = hamK(t, HS[0], 2 * BEAT), s1 = 104, S1 = strikeAt(s1, CAST.hand1, true);
    LIGHT = [.8, .55];
    seed('f9Hand1'); man(PX + 50 - S1[0], clampY - S1[1] + 0, s1, { ...hamPose(k1), flip: true }, CAST.hand1, { hold: J => sledge(J.handF, J.angF + .9 * J.dir, s1, { key: 'h9' }) });
    LIGHT = [-.75, .65];
    const kD = hamK(t, DS[0], 2 * BEAT);
    seed('f9Driller'); const JD = man(dX, g, sd, { ...hamPose(kD), blink: clamp(1 - Math.abs(kD - .8) * 12) * .8 }, CAST.driller, { hold: J => sledge(J.handF, J.angF + .9 * J.dir, sd, { key: 'd9' }), front: J => knots(J, .8, sd) });
    // sweat flung off him on each of his blows
    for (const b of DS) { const e = t - b; if (e < 0 || e > .6) continue; seed('f9Fling' + b); for (let i = 0; i < 7; i++) { const p = arcPt(add2(JD.head, [0, -.2 * sd]), add2(JD.head, [(hash(i + b) - .3) * 400, 260 + hash(i * 3) * 200]), 120 + hash(i) * 120, clamp(e / .6)); pfill(ellPts(p[0], p[1], 4, 6, 6), mixCol(AP.paperLt, AP.waterLt, .3), { tone: .8 * (1 - e / .6), ink: null }); pglow(p[0], p[1], 10, AP.lamp, .5 * (1 - e / .6)); } }
    sweat(add2(JD.head, [.2 * sd, -.2 * sd]), sd, t, 61);
    for (const b of DS) sparks([PX - 58, clampY], t - b, 'D' + b, { r: 260, v: 700, w: 1.8 });
    for (const b of HS) sparks([PX + 58, clampY], t - b, 'H' + b, { r: 200, v: 600, tilt: .4 });
    camOff();
    const ir = seg(lt, dur - .48, dur);
    if (ir > 0) { const [hx, hy] = scr2(PX, clampY, lerp(1, 1.06, ease(lt / dur))); hatchIris(hx, hy, lerp(1500, 0, easeIn(ir))); }
  }
  const scr2 = (x, y, z) => [(x - 960) * z + 960, (y - 520) * z + 540];

  // ================= F10 · 216.98 · the dive to 4040 ft, and the crack of blue =================
  const DB = [406, 407, 408, 409, 410, 411, 412, 413, 414].map(bt);    // a blow on every beat; the last, 221.34, cracks it
  const LAST = DB[DB.length - 1], BIT_END = (AQ_Y - 6) / FT;
  function diveF(t, lt, dur) {
    const n = DB.reduce((a, b) => a + (t >= b ? 1 : 0), 0), bitD = lerp(BD, BIT_END, n / DB.length);
    const zIn = ease(seg(t, 220.25, 221.2)), z = lerp(.55, 2.3, zIn) + 1.0 * ease(seg(t, 221.45, 223.3));
    const crack = t >= LAST ? t - LAST : -1;
    dive(t, lt, dur, { from: 3560, to: BIT_END, bitDepth: bitD, k: ease(seg(lt, .2, 221.2 - 216.98)), zoom: z, lead: lerp(140, 80, zIn), hits: t < LAST + .22,
      extra: (dCam) => {
        const cy = dCam * FT;
        seed('fDiveTint'); ptone(rectPts(-3000, cy - 3000, 7000, 6000), VIO, .26);
        faintWater(t, 2600, crack > 0 ? .35 * easeOut(clamp(crack / 1.5)) : 0, 'd');
        seed('fDiveVeins');
        for (let i = 0; i < 26; i++) { const vy = (3140 + i * 35 + hash(i) * 20) * FT, vx = X0 + (hash(i * 7) - .5) * 1700; pline([[vx - 190, vy], [vx - 60, vy + 26 * (hash(i) - .5)], [vx + 70, vy + 12], [vx + 210, vy + 36 * (hash(i + 3) - .5)]], 1.1, AP.paperLt, { curv: true, over: 0, passes: 1, alpha: .4 }); }
        // stress cracks gather round the bore as the blows go in
        speckles(dCam - 900 / z / FT, dCam + 900 / z / FT, X0 - 1100 / z, X0 + 1100 / z);
        seed('fDiveStress');
        for (let i = 0; i < n; i++) {
          const sd = i % 2 ? 1 : -1, y = (BD + 8 + i * 3.6) * FT, P = [[X0 + sd * 17, y]];
          for (let j = 1; j <= 5; j++) P.push([X0 + sd * (17 + j * (22 + hash(i * 7) * 16)), y - 6 * j + (hash(i * 11 + j) - .5) * 16]);
          pline(partial(P, easeOut(clamp((t - DB[i]) / .3))), .5, AP.graphite, { over: 0, passes: 1, alpha: .8 });
        }
      },
      over: () => {
        if (crack < 0) return;
        // the hairline crack of blue: from under the bit down into the water, branching out through the granite
        const k = easeOut(clamp(crack / .45)), yb = bitD * FT, gl = .6 + .4 * Math.sin(crack * 5), w = .9 / Math.max(1, z * .6);
        pglow(X0, yb + 8, 60 + 60 * k, AP.waterLt, (.55 + .25 * gl) * k);
        seed('fCrack');
        const main = [[X0 - 2, yb - 1], [X0 + 3, yb + 3], [X0 - 1, yb + 6], [X0 + 2, yb + 9], [X0, AQ_Y + 4]];
        pline(partial(main, k), w * 1.6, AP.waterLt, { over: 0, passes: 1 });
        pline(partial(main, k), w * .7, '#EAF6FA', { over: 0, passes: 1 });
        const br = [[[X0 + 3, yb + 3], [X0 + 18, yb + 1], [X0 + 34, yb + 5], [X0 + 58, yb + 1], [X0 + 84, yb + 4], [X0 + 118, yb]],
          [[X0 - 1, yb + 6], [X0 - 16, yb + 8], [X0 - 34, yb + 3], [X0 - 56, yb + 7], [X0 - 90, yb + 2], [X0 - 126, yb + 5]],
          [[X0 + 18, yb + 1], [X0 + 26, yb - 8], [X0 + 40, yb - 16], [X0 + 48, yb - 30]], [[X0 - 34, yb + 3], [X0 - 42, yb - 8], [X0 - 40, yb - 22]],
          [[X0 + 58, yb + 1], [X0 + 66, yb - 10], [X0 + 80, yb - 14]], [[X0 - 56, yb + 7], [X0 - 70, yb - 4], [X0 - 84, yb - 8]]];
        br.forEach((B, i) => { const kk = easeOut(clamp((crack - .15 - i * .18) / .5)); if (kk > 0) { pline(partial(B, kk), w * 1.1, AP.waterLt, { over: 0, passes: 1 }); pglow(B[B.length - 1][0], B[B.length - 1][1], 14 * kk, AP.waterLt, .4 * kk * gl); } });
        // beads of water pressing up the crack
        seed('fBeads');
        for (let i = 0; i < 5; i++) { const q = frac(crack * .8 + i / 5), p = [X0 + Math.sin(q * 9 + i) * 1.5, lerp(AQ_Y + 4, yb + 1, q)]; if (crack > .4) pfill(ellPts(p[0], p[1], 1.1, 1.3, 6), '#EAF6FA', { tone: .9 * (1 - q), ink: null }); }
      } });
    if (lt < .45) hatchIris(960, 470, lerp(0, 1500, easeOut(lt / .45)));
  }

  // ================= F11 · 223.30 · the hush =================
  const HUSH = 223.3;
  function pebbles(t, y0, xs, amt, key) {
    seed('fPeb' + key);
    xs.forEach(([x, r], i) => {
      const f = 5 + hash(i * 3) * 4, q = frac(t * f + hash(i * 7)), hop = q < .3 ? Math.sin(q / .3 * Math.PI) * (3 + hash(i) * 9) * amt * (hash(Math.floor(t * f) + i) < amt + .15 ? 1 : 0) : 0;
      pfill(ellPts(x, y0 - r * .6 - hop, r, r * .7, 8, r * .12), mixCol('#8A7A6A', AP.paperLt, hash(i) * .3), { tone: .85, sw: .8 });
      if (hop > 1) pline([[x - r, y0 - 1], [x + r, y0 - 1]], .7, AP.graphite, { over: 0, passes: 1, alpha: .5 });
    });
  }
  function riseDust(t, t0, list, amt, key) {
    seed('fRd' + key);
    list.forEach(([x, y], i) => { for (let j = 0; j < 3; j++) { const q = frac((t - t0) * (.35 + hash(i + j) * .2) + hash(i * 3 + j)); psmoke(x + (hash(i * 5 + j) - .5) * 60 + Math.sin(q * 4 + i) * 10, y - q * 150, 14 + q * 40, mixCol(AP.dust, VIO, .25), .5 * amt * Math.sin(q * Math.PI)); } });
  }
  function hush(t, lt, dur) {
    const trem = seg(t, HUSH, 225.55), sh = shakeXY(t, .6 + 2.4 * trem * trem);
    const z = lerp(1, 1.12, ease(lt / (dur + .3)));
    camOn(900 + sh[0], 500 + sh[1], z);
    duskSky({ sunX: 1300, hy: 790 });
    duskRigs(790, [[200, 260, 15], [1760, 300, 16]], 'h');
    legs([[[520, 820], [820, -300], 40, 30], [[1400, 820], [1100, -300], 40, 30]], 'f11');
    hangLamp([1150, 130], 120, 22, t, .05 * Math.sin(t * 9) * trem, .7);
    pglow(1900, 720, 520, AP.fire, .4);
    const PX = 960;
    seed('f11Pipe'); pfill(rectPts(PX - 22, -300, 44, 1120), AP.iron, { tone: .85, dens: 1, sw: 1.2 }); plit(rectPts(PX - 16, -300, 9, 1120), .6, mixCol(AP.lamp, AP.paperLt, .4), { kind: 'v' });
    const sd = 80, s1 = 76, SD = strikeAt(sd, CAST.driller), S1 = strikeAt(s1, CAST.hand1, true), clampY = 812 + (SD[1] + S1[1]) / 2;
    pfill(rrPts(PX - 40, clampY - 56, 80, 112, 8), AP.iron, { tone: .9, dens: 1.1, sw: 1.4 });
    // the boss at the back, a hand up: hush
    LIGHT = [.6, .75];
    const bh = easeOut(seg(lt, .1, .45));
    seed('f11Boss'); man(300, 812, 64, { view: 'front', shF: .15 + bh * .35, elF: .6 + bh * 2.0, shB: .06, elB: .15, face: 'worry', blink: clamp(1 - Math.abs(lt - .7) * 12) }, CAST.boss);
    // hand1's swing stops at the top; he lowers the sledge and listens
    const k1 = kp(lt, [[0, { ...hamPose(.45), flip: true }], [.25, { ...POSES.hamUp, flip: true, face: 'worry' }], [1.05, { flip: true, lean: -.05, shF: 2.2, elF: 1.3, shB: 1.9, elB: 1.4, hpF: .1, hpB: -.1, head: .25, face: 'worry', look: .6 }]], easeOut);
    LIGHT = [.8, .55];
    seed('f11Hand1'); man(PX + 40 - S1[0], 812, s1, { ...k1, blink: clamp(1 - Math.abs(lt - .5) * 12) }, CAST.hand1, { hold: J => sledge(J.handF, J.angF + .9 * J.dir, s1, { key: 'h11' }) });
    // the driller comes up out of his last blow, the sledge head down on the planks, head cocked
    const kd = kp(lt, [[0, POSES.hamDown], [.9, { lean: .08, shF: .55, elF: .1, shB: .4, elB: .15, hpF: .15, knF: .15, hpB: -.12, knB: .1, head: .35, face: 'worry', look: .5 }]], ease);
    LIGHT = [-.8, .6];
    seed('f11Driller'); const JD = man(PX - 40 - SD[0], 812, sd, { ...kd, blink: clamp(1 - Math.abs(lt - .35) * 12) }, CAST.driller, { hold: J => sledge(J.handF, J.angF + .9 * J.dir, sd, { key: 'd11' }) });
    sweat(add2(JD.head, [.2 * sd, -.25 * sd]), sd, t, 71, 1);
    planks(812, { key: 'f11', top: 34 });
    pebbles(t, 798, [[400, 9], [455, 6], [640, 8], [790, 5.5], [1190, 9], [1260, 6], [1470, 7.5], [1590, 5]], .35 + .65 * trem, 'a');
    // the pipe hums: short tremor strokes either side of it at the floor
    seed('f11Hum'); for (let i = 0; i < 4; i++) { const y = 700 + i * 26 + Math.sin(t * 40 + i) * 3; pline([[PX - 30, y], [PX - 44 - i * 3, y - 4]], 1, AP.paperLt, { over: 0, passes: 1, alpha: .3 + .6 * trem }); pline([[PX + 30, y], [PX + 44 + i * 3, y - 4]], 1, AP.paperLt, { over: 0, passes: 1, alpha: .3 + .6 * trem }); }
    riseDust(t, HUSH, [[430, 800], [700, 804], [1240, 800], [1520, 806]], .3 + .7 * trem, 'a');
    camOff();
  }

  // ================= F12 · 224.35 · the driller's face, held =================
  function face(t, lt, dur) {
    const trem = seg(t, HUSH, 225.55), sh = shakeXY(t, .8 + 3.2 * trem * trem);
    camOn(960 + sh[0], 500 + sh[1], lerp(1, 1.07, ease(lt / dur)));
    duskSky({ sunX: 1500, hy: 900, cy: 10 });
    legs([[[1500, 1100], [1320, -300], 70, 52]], 'f12');
    const lamp = [300, 160];
    pglow(lamp[0], lamp[1], 900 * flick(t), AP.rust, .45); pglow(lamp[0], lamp[1], 360 * flick(t), AP.lamp, .55);
    // side view, facing right toward the pipe; his head bows to listen, the eyes slide down, then flick up
    const s = 250, look = kf(lt, [[0, .1], [.35, .6], [.85, .6], [1.0, -.1]], ease), head = kf(lt, [[0, .12], [.8, .32], [1.2, .18]], ease);
    const pose = { lean: .05, shF: .3, elF: .2, shB: -.05, elB: .2, head, face: 'worry', look, mouth: .08, blink: clamp(1 - Math.abs(lt - .52) * 12) };
    const J0 = probe(() => man(0, 0, s, pose, CAST.driller)), x = 820 - J0.head[0], y = 470 - J0.head[1];
    LIGHT = [.8, .55];
    seed('f12Driller'); const J = man(x, y, s, pose, CAST.driller);
    // the single drop: beads at the temple under the brim, swells, runs down the cheek, drops off the beard
    const q = seg(lt, .1, 1.15), c = J.head, d = [c[0] + .22 * s, c[1] - .28 * s];
    const P = [d, [c[0] + .26 * s, c[1] - .05 * s], [c[0] + .28 * s, c[1] + .25 * s], [c[0] + .38 * s, c[1] + .55 * s], [c[0] + .42 * s, c[1] + .75 * s]];
    const run = seg(q, .4, .85), fall = seg(q, .85, 1), pos = run < 1 ? through(P, 6)[Math.floor(run * (through(P, 6).length - 1))] : [P[4][0], P[4][1] + fall * fall * 260];
    const sz = lerp(.3, 1, seg(q, 0, .4));
    seed('f12Drop');
    if (run > 0 && run < 1) pline(partial(through(P, 6), run), 1.6, mixCol(AP.paperLt, AP.lamp, .2), { over: 0, passes: 1, alpha: .55 });
    pfill(ellPts(pos[0], pos[1], .045 * s * sz, .065 * s * sz * (fall > 0 ? 1.3 : 1), 8), mixCol(AP.paperLt, AP.waterLt, .3), { tone: .85, dens: .3, ink: AP.graphiteLt, sw: .7 });
    pglow(pos[0] - .01 * s, pos[1] - .02 * s, .06 * s * sz, AP.lamp, .8);
    // dust motes drifting up through the lamplight
    seed('f12Motes');
    for (let i = 0; i < 26; i++) { const k = frac(lt * (.12 + hash(i) * .1) + hash(i * 3)), mx = hash(i * 5.3) * W + Math.sin(k * 6 + i) * 20, my = lerp(900, 60, k); pfill(ellPts(mx, my, 3 + hash(i) * 3, 3 + hash(i) * 3, 6), mixCol(AP.dust, AP.paperLt, .6), { tone: (.35 + .6 * trem) * Math.sin(k * Math.PI), ink: null }); }
    riseDust(t, HUSH, [[300, 900], [1500, 900]], .6 * trem, 'b');
    camOff();
  }

  shots([[189.20, listen], [191.35, bedrock], [197.90, snap], [199.44, anvilShot], [201.58, splice], [203.42, wireShot],
    [207.68, wring], [211.23, crewWide], [214.05, crewClose], [216.98, diveF], [223.30, hush], [224.35, face]]);
})();
