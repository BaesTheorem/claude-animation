// Chapter E · 151.94–189.20 s · Ruin. Verse 5 (lines 36–40) and chorus 5 (lines 41–44).
// See docs/artesian/STORYBOARD.md and BRIEF.md. Palette: blistering white-hot noon, ochres bleaching toward white.
//
//   E1 151.94  ruin        the squatter at his veranda table breaks the bank's seal, reads, sinks; a ewe folds behind him
//   E2 158.38  hotter      (the same camera carries on) the sun swells white, the thermometer on the post climbs and bursts
//   E3 162.74  3000 ft     match cut down the tube to the bore at 3000 ft: the empty bailer is hauled off the bottom, whips up
//   E4 164.60  dust        it shoots out of the casing; the driller knocks its valve over the tub: a dribble of dust. Hold.
//   E5 167.98  the boss    the dust clears on the boss on a crate: the bill unrolls to the ground, two coins, an empty palm;
//                          the driller's shadow; his hand on the shoulder (172.2, on the beat); he shoulders the sledge (line 40)
//   E6 175.96  John Henry  the driller alone, low angle, against the white sun: seven blows on the odd beats, roundhouse and
//                          chop in turn, each different; the crew get up out of the heat and rally in behind him one by one
//   E7 184.16  dive        out of the last blow's white flare, down through the granite to 3500 ft
//
// Transitions: scribble in; camera carries E1→E2; match cut thermometer tube → bore; whip up the hole (cut on action);
// dust cloud E4→E5; cut on the stride E5→E6; white spark flare E6→E7; scribble out.
// Chapter-local helpers: probe/ik/reach (arm IK, elbow always flexes forward), keyed (pose keys with per-key easing),
// maul (the driller's double jack), heat shimmer, sweat, glare, dustWipe, speed lines, a broken thermometer.
(() => {
  const bt = n => OFF + n * BEAT;
  const seamIn = lt => { if (lt < .35) scribbleWipe(.5 + lt / .7); };
  const seamOut = (lt, dur) => { if (lt > dur - .35) scribbleWipe((lt - (dur - .35)) / .7); };
  const HOT = { skyTop: '#E8CF9C', skyBot: '#FBF5E6', white: '#FFFAEE', ground: '#E6CD98', groundDk: '#C9A46A', far: '#E3C996' };

  // ---------- figures ----------
  const _pc = document.createElement('canvas'); _pc.width = _pc.height = 8; const _px = _pc.getContext('2d');
  function probe(fn) { const keep = X, z = ZOOM, pc = PCAM; X = _px; try { return fn(); } finally { X = keep; ZOOM = z; PCAM = pc; } }
  // two-bone arm IK in the rig's convention (0 = down, + = forward for side d); the elbow always flexes forward
  function ik(sh, tg, s, look, d) {
    const tall = look.tall || 1, up = 1.5 * s * tall, fl = 1.4 * s * tall + .32 * s;
    const vx = tg[0] - sh[0], vy = tg[1] - sh[1], D = clamp(Math.hypot(vx, vy), Math.abs(up - fl) + 1, up + fl - .5);
    const ang = Math.atan2(vx * d, vy), al = Math.acos(clamp((up * up + D * D - fl * fl) / (2 * up * D), -1, 1));
    const a1 = ang - al, el = [sh[0] + Math.sin(a1) * d * up, sh[1] + Math.cos(a1) * up];
    let e = Math.atan2((tg[0] - el[0]) * d, tg[1] - el[1]) - a1;
    while (e > Math.PI) e -= TAU; while (e < -Math.PI) e += TAU;
    return [a1, e];
  }
  function solveArms(x, y, s, P, look, tgt) {
    const d = P.flip ? -1 : 1, J0 = probe(() => man(x, y, s, P, look));
    if (tgt.F) [P.shF, P.elF] = ik(J0.shF, tgt.F, s, look, d);
    if (tgt.B) [P.shB, P.elB] = ik(J0.shB, tgt.B, s, look, d);
    return J0;
  }
  function reach(key, x, y, s, pose, look, tgt, hooks = {}) {
    const P = { ...pose }; if (tgt) solveArms(x, y, s, P, look, tgt);
    seed(key); return man(x, y, s, P, look, hooks);
  }
  // pose keys with per-key easing: [[t, pose, easeIntoThisKey], ...]; numbers blend, strings switch half way
  function keyed(t, keys) {
    if (t <= keys[0][0]) return { ...keys[0][1] };
    for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) {
      const [a, A] = keys[i - 1], [b, B, e] = keys[i], k = (e || ease)((t - a) / (b - a)), o = { ...A };
      for (const f in B) o[f] = typeof B[f] === 'number' && typeof A[f] === 'number' ? lerp(A[f], B[f], k) : (k < .5 ? (A[f] ?? B[f]) : B[f]);
      return o;
    }
    return { ...keys[keys.length - 1][1] };
  }
  const lin = x => clamp(x);
  // sweat: drops bead at p, run and fall, each on its own clock
  function sweat(p, s, t, k, n = 2) {
    for (let i = 0; i < n; i++) {
      const per = 1.1 + hash(k * 7 + i) * .9, q = frac(t / per + hash(k * 3 + i)), dx = (hash(k + i * 5) - .5) * .5 * s;
      const y = p[1] + (q < .45 ? 0 : Math.pow((q - .45) / .55, 2) * 2.4 * s), a = q < .9 ? 1 : (1 - q) * 10;
      seed('eSw' + k + i);
      pfill(ellPts(p[0] + dx, y, .07 * s, .1 * s * (q < .45 ? .7 + q : 1.2), 7), mixCol(AP.paperLt, AP.waterLt, .35), { tone: .8 * a, dens: .3, ink: mixCol(AP.graphiteLt, AP.waterLt, .4), sw: .5 });
      if (a > .3) pglow(p[0] + dx - .02 * s, y - .03 * s, .14 * s, '#FFFFFF', .5 * a);
    }
  }
  // the driller's double jack: grip = front hand, the handle along phi (screen radians). Returns { head, face, butt }.
  const HL = 1.05, HW = .52, ML = 3.1;
  function maul(grip, phi, s, o = {}) {
    seed('eMaul' + (o.key || ''));
    const u = [Math.cos(phi), Math.sin(phi)], n = [-u[1], u[0]];
    const butt = [grip[0] - u[0] * .95 * s, grip[1] - u[1] * .95 * s], hd = [grip[0] + u[0] * ML * s, grip[1] + u[1] * ML * s];
    pfill(limb([butt, hd], [.25 * s, .3 * s]), AP.pine, { tone: .72, sw: Math.max(.8, s / 60) });
    pline([lerp2(butt, hd, .05), lerp2(butt, hd, .9)], Math.max(.6, s / 90), mixCol(AP.pine, AP.paperLt, .5), { over: 0, passes: 1, alpha: .7 });
    const q = (x, y) => [hd[0] + n[0] * x + u[0] * y, hd[1] + n[1] * x + u[1] * y];
    pfill([q(-HL * s, -HW * s), q(HL * s, -HW * s), q(HL * s * 1.04, HW * s), q(-HL * s * 1.04, HW * s)], AP.iron, { tone: .92, dens: 1.1, sw: Math.max(.9, s / 55) });
    plit([q(-HL * .85 * s, -HW * .75 * s), q(HL * .85 * s, -HW * .75 * s), q(HL * .85 * s, -HW * .3 * s), q(-HL * .85 * s, -HW * .3 * s)], .7);
    pfill([q(HL * s, -HW * s), q(HL * 1.1 * s, -HW * .8 * s), q(HL * 1.1 * s, HW * .8 * s), q(HL * s * 1.04, HW * s)], AP.ironLt, { tone: .9, sw: Math.max(.8, s / 60) });
    return { head: hd, face: q(HL * 1.1 * s, 0), butt };
  }

  // ---------- light, heat, full-frame marks ----------
  function glare(k, col = HOT.white) { if (k > 0) ptone(rectPts(-60, -60, W + 120, H + 120), col, clamp(k)); }
  let _sc = null;
  function shimmer(t, y0, y1, amp) {           // slide thin rows of the page sideways (screen space band y0..y1)
    if (amp <= .05) return;
    y0 = Math.max(0, Math.round(y0)); y1 = Math.min(H, Math.round(y1)); const h = y1 - y0; if (h < 8) return;
    if (!_sc) { const c = document.createElement('canvas'); c.width = W; c.height = H; _sc = c.getContext('2d'); }
    _sc.setTransform(1, 0, 0, 1, 0, 0); _sc.clearRect(0, 0, W, h); _sc.drawImage(X.canvas, 0, y0, W, h, 0, 0, W, h);
    X.save(); X.setTransform(1, 0, 0, 1, 0, 0); X.clearRect(0, y0, W, h);
    for (let y = 0; y < h; y += 3) {
      const k = Math.sin(y / h * Math.PI), dx = amp * k * (Math.sin(t * 7.3 + y * .19) + .5 * Math.sin(t * 13.1 - y * .07));
      X.drawImage(_sc.canvas, 0, y, W, 3, dx, y0 + y, W, 3);
    }
    X.restore();
  }
  function speedLines(k, vert, key, col = AP.graphite) {
    if (k <= .02) return;
    seed('eSpd' + key);
    ptone(rectPts(-40, -40, W + 80, H + 80), AP.paper, .6 * k);
    for (let i = 0; i < 54; i++) {
      const a = hash(i * 3.7 + key.length + BOILN * .31), b = hash(i * 9.1 + BOILN * .17), L = 200 + hash(i * 5.3) * 600, w = .7 + hash(i * 2.1) * 1.6;
      if (vert) { const x = a * W, y = b * (H + L) - L; pline([[x, y], [x, y + L]], w, col, { alpha: k * .85, passes: 1, over: 0 }); }
      else { const y = a * 890, x = b * (W + L) - L; pline([[x, y], [x + L, y]], w, col, { alpha: k * .85, passes: 1, over: 0 }); }
    }
  }
  // dry dust billows up to fill the frame (p 0 → .5) and blows off to the right (.5 → 1)
  function dustWipe(p) {
    if (p <= 0 || p >= 1) return;
    const cover = p < .5 ? easeOut(p * 2) : 1 - ease((p - .5) * 2), drift = p > .5 ? (p - .5) * 2 : 0;
    seed('eDustW');
    for (let i = 0; i < 18; i++) {
      const x = hash(i * 4.1) * W + drift * 900 * (.6 + hash(i)), y = lerp(1000, hash(i * 2.7) * 900, cover), r = 170 + hash(i * 1.3) * 280;
      psmoke(x, y, r * (.4 + cover), mixCol(HOT.ground, HOT.white, .2 + hash(i) * .5), .95 * cover);
    }
    ptone(rectPts(-40, -40, W + 80, H + 80), mixCol(HOT.ground, HOT.white, .35), clamp(cover * 1.05));
    pshade(rectPts(-40, -40, W + 80, H + 80), HOT.groundDk, cover * .7, { kind: 'x' });
  }
  // the noon world: a bleached sky over a white-hot plain (world coords; hz = horizon)
  function noon(hz, o = {}) {
    const x0 = o.x0 ?? -1600, x1 = o.x1 ?? 3600, y0 = o.y0 ?? -1600, y1 = o.y1 ?? 2400;
    seed('eSky' + (o.key || ''));
    const g = X.createLinearGradient(0, o.g0 ?? hz - 900, 0, hz); g.addColorStop(0, HOT.skyTop); g.addColorStop(1, HOT.skyBot);
    X.save(); X.globalAlpha = .78; X.fillStyle = g; X.fillRect(x0, y0, x1 - x0, hz - y0 + 4); X.restore();
    pshade(rectPts(x0, y0, x1 - x0, hz - y0), HOT.skyTop, .38, { still: true });
    pshade(rectPts(x0, hz - 500, x1 - x0, 500), '#F4E4C0', .3, { still: true, kind: 'v' });
    seed('eGround' + (o.key || ''));
    const gp = [[x0, hz], [x1, hz], [x1, y1], [x0, y1]], gg = X.createLinearGradient(0, hz, 0, hz + (o.gd ?? 420));
    gg.addColorStop(0, '#F1E2BD'); gg.addColorStop(1, HOT.ground);
    X.save(); X.globalAlpha = .82; X.fillStyle = gg; tracePath(gp); X.fill(); X.restore();
    pshade(gp, HOT.groundDk, .42, { still: true });
    pline([[x0, hz], [x1, hz]], .9, AP.graphiteLt, { over: 0, passes: 1, alpha: .7 });
    ptone(rectPts(x0, hz - 46, x1 - x0, 60), HOT.white, .5);                 // heat haze on the horizon
  }
  function bigSun(x, y, r, k = 1) {                 // the swollen white noon sun; k = how blinding
    pglow(x, y, r * (5 + 3 * k), '#FFEFC8', .5 + .2 * k);
    pglow(x, y, r * 2.6, '#FFFFFF', .45 + .35 * k);
    sun(x, y, r, 1);
    seed('eSunCore'); ptone(ellPts(x, y, r * .95, r * .95, 30), '#FFFDF6', .55 + .35 * k);
    pglow(x, y, r * 1.4, '#FFFFFF', .35 + .4 * k);
  }

  // ======================================================================================================
  // E1 + E2 · 151.94–162.74 · the veranda: the bank's letter; the sun swells and the thermometer bursts
  // ======================================================================================================
  const V = { GY: 860, s: 62, HX: 1250, w: 22 };
  const SEAL = bt(286), BURST = bt(303);                 // 152.97: the seal snaps · 162.05: the glass goes ("hotter")
  const SQ_POSE = { view: 'side', flip: true, lean: .12, head: .2, hpF: 1.5, knF: 1.5, hpB: 1.38, knB: 1.45, face: 'neutral' };
  function envelope(c, a, s, open, flat = 0) {      // small envelope with the bank's red seal (open 0..1 snaps it)
    seed('eEnv');
    const R = (u, v) => add2(c, rot2([u * s, v * s * (1 - .7 * flat)], a));
    pfill([R(-.75, -.45), R(.75, -.45), R(.75, .45), R(-.75, .45)], '#F2EAD8', { tone: .85, dens: .4, sw: s / 55 });
    pline([R(-.75, -.45), R(0, .1), R(.75, -.45)], s / 70, AP.graphiteLt, { over: 0, passes: 1 });
    if (open < 1) pfill(ellPts(...R(0, .08), .16 * s, .16 * s, 9), AP.red, { tone: .9, sw: s / 70 });
    else for (const sd of [-1, 1]) pfill(ellPts(...R(sd * .12, .1 + .05 * sd), .09 * s, .12 * s, 7), AP.red, { tone: .9, sw: s / 80 });
  }
  function letter(c, a, s, unfold, flat = 0) {      // the bank's letter: a letterhead, figures, a red stamp, the signature
    seed('eLetter');                                // flat 0..1 lays it down on the table (seen edge-on from the side)
    const h = lerp(.55, 2.1, unfold), R = (u, v) => add2(c, rot2([u * s, (v * (1 - .88 * flat)) * s], a));
    pfill([R(-.72, -h / 2), R(.72, -h / 2), R(.74, h / 2), R(-.7, h / 2)], '#F6F0E2', { tone: .92, dens: .35, sw: s / 55 });
    if (unfold > .6) {
      const k = seg(unfold, .6, 1);
      pline([R(-.5, -h / 2 + .2), R(.45, -h / 2 + .2)], s / 40, mixCol(AP.graphite, AP.denim, .4), { over: 0, passes: 1, alpha: k });   // letterhead
      for (let i = 0; i < 7; i++) { const y = -h / 2 + .5 + i * .18, L = i === 6 ? .5 : .9 + hash(i) * .25;
        pline([R(-.55, y), R(-.55 + L * .5, y + .01 * Math.sin(i * 3)), R(-.55 + L, y)], s / 85, AP.graphiteLt, { over: 0, passes: 1, alpha: k, curv: true }); }
      pline(ellPts(...R(.35, h / 2 - .35), .22 * s, .14 * s, 12, 0, -.3), s / 60, AP.red, { closed: true, alpha: k, passes: 1 });   // the bank's stamp
      pline([R(.18, h / 2 - .35), R(.5, h / 2 - .35)], s / 60, AP.red, { over: 0, passes: 1, alpha: k });
    }
  }
  function brokenThermo(G, t, s) {                  // homestead()'s thermometer, after its top has blown off
    seed('eThermoB');
    const [tx] = G.posts[1], ty = G.floor - 6.5 * s, sw = Math.max(.8, s / 50), dt = t - BURST, top = ty - 1.55 * s;
    const jag = [[tx + .45 * s, top + .1 * s], [tx + .28 * s, top - .12 * s], [tx + .12 * s, top + .06 * s], [tx - .05 * s, top - .2 * s], [tx - .2 * s, top + .02 * s], [tx - .45 * s, top - .08 * s]];
    pfill([[tx - .45 * s, ty + .4 * s], [tx - .25 * s, ty + .6 * s], [tx + .25 * s, ty + .6 * s], [tx + .45 * s, ty + .4 * s], ...jag], AP.bone, { tone: .85, sw });
    pline([[tx, ty + .1 * s], [tx, top + .05 * s]], sw * .9, AP.graphiteLt, { over: 0, passes: 1 });
    pfill(ellPts(tx, ty + .2 * s, .2 * s, .2 * s, 8), AP.red, { tone: .9, sw: sw * .7 });
    for (let i = 0; i < 4; i++) pline([[tx + .1 * s, ty - i * .35 * s], [tx + .3 * s, ty - i * .35 * s]], .6, AP.graphite, { over: 0, passes: 1 });
    // the mercury: a red jet out of the break, then it sinks back and bleeds down the plate
    const jet = dt < .35 ? (1 - dt / .35) : 0, lv = lerp(1.55, .9, ease(seg(dt, .15, .6)));
    pline([[tx, ty + .1 * s], [tx, ty + .1 * s - lv * s]], sw * 1.6, AP.red, { over: 0 });
    if (jet > 0) pline([[tx, top], [tx + jit(1), top - (.2 + 1.6 * easeOut(1 - jet)) * s * jet * 1.4]], sw * 2.2 * jet, AP.red, { over: 0 });
    // drops: thrown up and out, falling under gravity; a few splash onto the plate and the post and run
    for (let i = 0; i < 11; i++) {
      const a = -Math.PI / 2 + (hash(i * 3.3) - .5) * 1.9, v = (3 + hash(i * 1.7) * 4.5) * s, g = 26 * s, tt = Math.max(0, dt - hash(i) * .05);
      const p = [tx + Math.cos(a) * v * tt, top + Math.sin(a) * v * tt + .5 * g * tt * tt];
      if (p[1] > ty + 4 * s || tt <= 0) continue;
      pfill(ellPts(p[0], p[1], .09 * s, .11 * s + Math.min(.12 * s, tt * .6 * s), 7), AP.red, { tone: .92, ink: null });
    }
    for (let i = 0; i < 3; i++) {                  // runs down the plate
      const x = tx + (i - 1) * .22 * s, k = ease(seg(dt, .2 + i * .15, 2.2 + i * .3)), y0 = top + .15 * s;
      if (k > 0) pline([[x, y0], [x + (hash(i) - .5) * .06 * s, y0 + k * (1.1 + hash(i + 4)) * s]], sw * (1.1 - i * .2), AP.red, { over: 0, passes: 1, taper: .3 });
    }
    // glass: shards spinning away, a few burst strokes
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (hash(i * 5.1) - .5) * 2.4, v = (4 + hash(i * 2.9) * 4) * s, g = 30 * s, p = [tx + Math.cos(a) * v * dt, top + Math.sin(a) * v * dt + .5 * g * dt * dt], r = .12 * s, sp = dt * (8 + i * 3);
      if (p[1] < ty + 6 * s) pfill([polar(p, sp, r), polar(p, sp + 2.2, r * .7), polar(p, sp + 3.9, r * .9)], '#FBF8F0', { tone: .8, sw: sw * .6, ink: AP.graphiteLt });
    }
    if (dt < .3) { const k = dt / .3;
      pglow(tx, top, s * (1 + 3 * k), '#FFFFFF', 1 - k);
      for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * .33, r0 = (.35 + k * 1.2) * s, r1 = r0 + (.5 + .6 * (1 - k)) * s; pline([polar([tx, top], a, r0), polar([tx, top], a, r1)], sw * 1.2, AP.graphite, { over: 0, passes: 1, alpha: 1 - k }); }
    }
  }
  function thinEwe(x, y, s, key, fold = 0) {     // the set's sheep, folding down (legs give, then she's down)
    if (fold >= 1) { sheep(x, y, s, { down: true, key }); return; }
    X.save(); X.translate(x, y); X.scale(1, 1 - fold * .45); X.translate(-x, -y);
    sheep(x, y, s, { thin: .85, graze: .15 + fold * .6, key });
    X.restore();
  }
  function veranda(t, lt, dur) {
    LIGHT = [-.55, .85];
    const { GY, s, HX, w } = V, fl = GY - .9 * s;
    // camera: on the squatter; drifts to take in the sun and the thermometer; pushes onto the glass; snaps at the burst
    const cam = kf(t, [[151.94, [1060, 520, 1.3]], [157.3, [1045, 515, 1.34]], [159.3, [1235, 350, 1.45]], [160.3, [1225, 350, 1.5]], [161.7, [940, 350, 2.3]], [162.05, [915, 345, 2.45]], [162.74, [909, 350, 2.55]]], ease);
    const hit = t > BURST ? Math.exp(-(t - BURST) * 9) : 0, sh = shakeXY(t, hit * 7 + (t > 161.4 && t < BURST ? 1.5 : 0));
    const zoomPunch = t > BURST ? .12 * hit : 0;
    camOn(cam[0] + sh[0], cam[1] + sh[1], cam[2] + zoomPunch);
    const HZ = GY - 3.4 * s;
    noon(HZ, { key: 'v', gd: 300 });
    // the sun over the paddock, swelling white on line 37
    const swell = ease(seg(t, 158.5, 161.2)), sunR = lerp(46, 118, swell);
    bigSun(HX + 5.2 * s, fl - 9.2 * s + swell * 20, sunR, .3 + .7 * swell);
    // the paddock behind him: fence, a dead tree, the last thin mob; a ewe goes down at 157.2
    seed('eFence'); for (let i = 0; i < 7; i++) { const fx = HX + 150 + i * 150; pline([[fx, HZ + 70 + i * 3], [fx + 2, HZ + 22 + i * 3]], 1.3, AP.timberDk, { over: 0 }); if (i < 6) pline([[fx, HZ + 34 + i * 3], [fx + 150, HZ + 37 + i * 3]], .7, AP.graphiteLt, { over: 0, passes: 1 }); }
    tree(HX + 1020, HZ + 30, 26, { dead: true, key: 'eTree' });
    crow(HX + 1030, HZ - 76, 9, .02, { key: 'eCrow1', flip: true });
    const fold = ease(seg(t, 157.15, 157.9));
    [[HX + 200, HZ + 116, 26, .0], [HX + 370, HZ + 92, 21, .5], [HX + 620, HZ + 84, 18, .2], [HX + 540, HZ + 124, 27, .7]].forEach(([x, y, ss, ph], i) =>
      sheep(x, y, ss, { thin: .8, graze: .2 + .2 * Math.sin(t * .8 + ph * 6), key: 'eMob' + i, flip: i % 2 === 1 }));
    thinEwe(HX + 330, HZ + 138, 28, 'eEwe', fold);
    if (fold > 0 && fold < 1) for (let i = 0; i < 4; i++) psmoke(HX + 330 + (hash(i) - .5) * 90, HZ + 128 - fold * 14, 16 + fold * 22, AP.dust, .45 * fold);
    // the homestead: the squatter at the table (mid hook); the thermometer on the post, intact until it bursts
    const lvl = lerp(.72, 1.0, ease(seg(t, 159.6, 161.9))) + (t > 161.2 && t < BURST ? .012 * Math.sin(t * 60) : 0);
    homestead(HX, GY, s, { flip: true, w, table: true, key: 'e', tank: false, thermo: t < BURST ? { level: lvl, burst: 0 } : null,
      mid: G => squatterAtTable(t, G, s),
      front: G => {
        if (t >= BURST) brokenThermo(G, t, s);
        else if (t > 161.35) {                   // the glass crazes before it goes
          seed('eCraze'); const [tx] = G.posts[1], top = G.floor - 8.7 * s, k = seg(t, 161.35, BURST);
          for (let i = 0; i < 4; i++) pline(partial([[tx + (i - 1.5) * .15 * s, top + .05 * s], [tx + (i - 1.5) * .2 * s + .05 * s, top + .35 * s], [tx + (i - 1.5) * .12 * s, top + .6 * s]], clamp(k * 1.6 - i * .2)), .7, AP.graphite, { over: 0, passes: 1 });
        }
      } });
    camOff();
    // the heat: the page shimmers over the paddock, then everything bleaches toward white
    shimmer(t, 200, 560, 1.2 + 3 * swell);
    glare(.1 + .22 * swell - .12 * seg(t, 161.5, 162.4) + .5 * hit);
    seamIn(lt);
  }
  function squatterAtTable(t, G, s) {
    const hipX = G.table[0] + 3.6 * s - 2, fl = G.floor, look = CAST.squatter;
    // acting: the envelope (seal snaps on the beat), unfold, read, the head goes down, hand to the brow; breathing
    const read = t > 153.55 && t < 155.3 ? Math.sin((t - 153.55) * 5.4) : 0;
    const P = keyed(t, [
      [151.94, { ...SQ_POSE, head: .28, lean: .14 }],
      [152.8, { ...SQ_POSE, head: .32, lean: .16 }],
      [153.5, { ...SQ_POSE, head: .3, lean: .08, face: 'neutral' }],
      [155.3, { ...SQ_POSE, head: .36, lean: .1, face: 'neutral' }],
      [155.6, { ...SQ_POSE, head: .3, lean: .12, face: 'worry' }],
      [156.4, { ...SQ_POSE, head: .3, lean: .34, face: 'worry' }],
      [157.1, { ...SQ_POSE, head: .36, lean: .44, face: 'closed' }, easeOut],
      [162.74, { ...SQ_POSE, head: .4, lean: .47, face: 'closed' }]]);
    P.look = read * .7 - (t > 155.3 && t < 156.4 ? .3 : 0);
    P.blink = t > 155.38 && t < 155.5 ? 1 : 0;
    P.mouth = t > 153.7 && t < 155.2 ? .12 * Math.abs(Math.sin(t * 11)) : 0;
    P.lean += .015 * Math.sin(t * 2.2);                                         // he breathes
    // where the hands go: the envelope/letter in both hands, then the letter down, then the near hand to his brow
    const J0 = probe(() => man(hipX, fl, s, P, look));
    const chest = [J0.neck[0] - 1.7 * s, J0.neck[1] + 1.3 * s];
    const unfold = ease(seg(t, 153.0, 153.5)), down = ease(seg(t, 155.7, 156.4)), brow = ease(seg(t, 156.4, 157.05));
    const tableTop = [G.table[0] + .6 * s, G.table[1] - .45 * s];
    let lc = lerp2(chest, add2(tableTop, [0, -.1 * s]), down), la = lerp(-.1, 0, down);
    if (t < 153.0) lc = add2(chest, [0, .4 * s * (1 - ease(seg(t, 151.94, 152.5)))]);
    const lw = t < 153.0 ? .75 : lerp(.75, .72, unfold);
    let F = add2(lc, rot2([-lw * s, .1 * s], la)), B = add2(lc, rot2([lw * s, .15 * s], la));
    if (t >= 153.0 && t < 153.5) F = add2(lc, rot2([-lw * s, (.1 - .6 * Math.sin(unfold * Math.PI)) * s], la));
    if (down > .9) { const brP = add2(J0.head, [-.45 * s, -.1 * s]); F = lerp2(add2(tableTop, [-.6 * s, -.3 * s]), brP, brow); B = add2(tableTop, [.7 * s, -.2 * s]); }
    if (t > SEAL - .12 && t < SEAL) { F = add2(F, [.15 * s, -.1 * s]); B = add2(B, [-.1 * s, -.1 * s]); }
    const Pp = { ...P }; solveArms(hipX, fl, s, Pp, look, { F, B });
    seed('eSquatter');
    man(hipX, fl, s, Pp, look, { hold: J => {
      if (t < 153.0) { envelope(lc, -.08 + .05 * Math.sin(t * 3), s, t >= SEAL ? 1 : 0);
        if (t > SEAL && t < SEAL + .3) { const k = (t - SEAL) / .3; for (let i = 0; i < 5; i++) pfill(ellPts(lc[0] + (hash(i) - .5) * s * k * 1.2, lc[1] + .1 * s + k * k * s * (1 + hash(i)), .04 * s, .04 * s, 5), AP.red, { tone: .9, ink: null }); } }
      else {
        if (t < 153.45) { const k = ease(seg(t, 153.0, 153.45)), p = arcPt(lc, add2(tableTop, [-1.6 * s, .12 * s]), .6 * s, k); envelope(p, lerp(-.08, .04, k), s * .9, 1, k); }
        letter(lc, la, s, unfold, down);
      }
    } });
    if (t >= 153.45) envelope(add2(tableTop, [-1.6 * s, .12 * s]), .04, s * .9, 1, 1);
    if (t > 156.6) sweat([J0.head[0] + .1 * s, J0.head[1] - .4 * s], s, t, 3, 1);
  }

  // ======================================================================================================
  // E3 · 162.74–164.60 · 3000 ft: the bailer comes off the bottom, empty, and is hauled up the hole
  // ======================================================================================================
  const BX = 960, BOT = 3030;
  function bailerCut(x, yb, s, dust) {             // the bailer down the hole: a pale iron tube on the sand line
    seed('eBailC');
    const w = 1.1 * s, h = 8 * s, top = yb - h;
    pfill(rectPts(x - w / 2, top, w, h), AP.ironLt, { tone: .9, dens: .9, sw: 1.2 });
    pshade(rectPts(x + w * .1, top, w * .4, h), AP.graphite, .7);
    plit(rectPts(x - w / 2 + .1 * s, top + .2 * s, .18 * s, h - .4 * s), .9, '#FFFFFF');
    for (const k of [.08, .5, .92]) pline([[x - w / 2 - 2, top + h * k], [x + w / 2 + 2, top + h * k]], 1.4, AP.iron, { over: 0, passes: 1 });
    pfill([[x - w / 2, yb], [x + w / 2, yb], [x + w * .3, yb + .4 * s], [x - w * .3, yb + .4 * s]], AP.iron, { tone: .9, sw: 1 });   // the valve shoe
    pline([[x - w / 2, top], [x, top - 1.1 * s], [x + w / 2, top]], 1.6, AP.ironLt, { curv: true, over: 0 });            // the bail
    return top - 1.1 * s;
  }
  function boreUp(t, lt, dur) {
    LIGHT = [-.5, .85];
    const tight = seg(t, 163.0, 163.25), lift = Math.max(0, t - 163.34), rise = 170 * lift * lift + 480 * Math.pow(lift, 4);
    const yb = BOT * FT - rise, s = 26, z = 1.15;
    const camY = 2992 * FT - Math.max(0, rise * .86 - 10);
    const sh = shakeXY(t, t > 163.3 && t < 163.5 ? 3 : 0);
    camOn(BX + sh[0], camY + sh[1], z);
    const dTop = camY / FT - 520, dBot = camY / FT + 520;
    section(BX, dTop, dBot, { halfW: 1300 });
    seed('eHeatTint'); ptone(rectPts(BX - 1400, camY - 900, 2800, 1800), HOT.far, .14);
    // dry: a few hairline cracks in the rock round the bottom of the hole
    seed('eDryCr'); for (let i = 0; i < 6; i++) { const y = (2992 + i * 7) * FT, sd = i % 2 ? 1 : -1, P = [[BX + sd * 28, y]]; for (let j = 1; j <= 4; j++) P.push([BX + sd * (28 + j * (22 + hash(i * 7) * 22)), y + (hash(i * 11 + j) - .4) * 14 * j]); pline(P, .7, AP.graphite, { over: 0, passes: 1, taper: .9 }); }
    shaft(BX, BOT, { w: 56 });
    // the sand line: slack, then it snaps taut
    const bail = bailerCut(BX, yb, s, 1), slack = (1 - tight) * 26, wob = t > 163.25 ? spring(t, 163.25, 6, 40) * 9 : 0;
    seed('eLine'); const L = []; for (let i = 0; i <= 12; i++) { const k = i / 12; L.push([BX + Math.sin(k * 9) * slack * (1 - k) + wob * Math.sin(k * Math.PI), lerp(camY - 800, bail, k)]); }
    pline(L, 1.3, AP.ironLt, { curv: true, over: 0 });
    // what dribbles out of the valve as she comes up: dust, not water
    seed('eTrickle'); if (lift > 0) for (let i = 0; i < 18; i++) { const k = frac(hash(i) + t * 2.4), y = yb + .45 * s + k * 420; pline([[BX + (hash(i * 3) - .5) * 10, y], [BX + (hash(i * 3) - .5) * 10, y + 9]], 1.1, '#D8B77E', { over: 0, passes: 1, alpha: 1 - k }); }
    if (t > 163.3 && t < 163.8) for (let i = 0; i < 4; i++) psmoke(BX + (hash(i) - .5) * 40, BOT * FT - 8 - seg(t, 163.34, 163.8) * 24, 12 + 14 * seg(t, 163.3, 163.8), '#D8B77E', .55 * (1 - seg(t, 163.34, 163.8)));
    ruler(BX - 200, dTop, dBot, BOT, { step: 50 });
    camOff();
    // arrive: the thermometer's glare carries across the match cut; leave: whip up the hole
    if (lt < .2) glare(.5 * (1 - lt / .2));
    speedLines(easeIn(seg(lt, dur - .55, dur)), true, 'e3');
  }

  // ======================================================================================================
  // E4 · 164.60–167.98 · the bailer out of the casing; the valve knocked; dust. Hold.
  // ======================================================================================================
  const KNOCK = bt(310);                                // 165.80
  function bailerFull(x, yb, s, ang, valve) {        // the bailer at the surface (an iron tube, bail at top, valve lever at the foot)
    seed('eBail');
    const h = 4.4 * s, w = .7 * s, R = (u, v) => add2([x, yb], rot2([u, v], ang));
    pfill([R(-w / 2, 0), R(w / 2, 0), R(w / 2, -h), R(-w / 2, -h)], AP.iron, { tone: .88, dens: 1, sw: 1.4 });
    plit([R(-w / 2 + .08 * s, -.2 * s), R(-w / 2 + .2 * s, -.2 * s), R(-w / 2 + .2 * s, -h + .2 * s), R(-w / 2 + .08 * s, -h + .2 * s)], .8, '#FFFFFF');
    for (const k of [.1, .5, .9]) pline([R(-w / 2 - 2, -h * k), R(w / 2 + 2, -h * k)], 1.6, AP.ironLt, { over: 0, passes: 1 });
    pline([R(-w / 2, -h), R(0, -h - .8 * s), R(w / 2, -h)], 2, AP.iron, { curv: true, over: 0 });
    pfill([R(-w / 2, 0), R(w / 2, 0), R(w * .32, .3 * s), R(-w * .32, .3 * s)], AP.iron, { tone: .9, sw: 1.2 });
    const lv = R(0, .3 * s), le = add2(lv, rot2([.75 * s, .1 * s - valve * .55 * s], ang));
    pline([lv, le], 2.4, AP.ironLt, { over: 0 });
    return { bail: R(0, -h - .8 * s), mid: R(w / 2, -h * .55), top: R(w / 2, -h * .88), valve: lv, lever: le };
  }
  const stepPose = k => { const a = Math.sin(k * Math.PI); return { hpF: .45 + .35 * a, knF: .4 + .5 * a, hpB: -.25 - .2 * a, dy: .1 * a }; };
  function bailOut(t, lt, dur) {
    LIGHT = [-.6, .8];
    const GY = 800, s = 70, casX = 900, sb = 52, tubX = 740, tubY = GY - 2, rim = tubY - 118;
    const cam = kf(t, [[164.6, [880, 470, 1.2]], [165.3, [870, 480, 1.24]], [166.0, [810, 500, 1.5]], [167.98, [790, 520, 1.68]]], ease);
    const kh = t > KNOCK ? Math.exp(-(t - KNOCK) * 12) : 0, sh = shakeXY(t, kh * 4);
    camOn(cam[0] + sh[0], cam[1] + sh[1], cam[2]);
    noon(600, { key: 'b', gd: 300 });
    bigSun(1330, 120, 70, .8);
    // derrick legs and floor
    seed('eBDer'); const legC = mixCol(AP.timber, HOT.white, .15);
    pfill(limb([[180, GY], [700, -600]], [46, 30]), legC, { tone: .75, dens: .9, sw: 1.2 });
    pfill(limb([[1600, GY], [1150, -600]], [46, 30]), legC, { tone: .75, dens: .9, sw: 1.2 });
    pline([[330, 330], [1440, 330]], 2.4, mixCol(AP.timberDk, HOT.white, .2), { over: 4 });
    seed('eBFloor'); pfill([[-300, GY - 10], [2200, GY - 10], [2200, 1100], [-300, 1100]], mixCol(AP.timber, HOT.white, .28), { tone: .75, dens: .85, sw: 1.1, still: true });
    for (let i = 0; i < 26; i++) pline([[-280 + i * 96, GY - 8], [-300 + i * 100, 1000]], .6, AP.timberDk, { over: 0, passes: 1, alpha: .6 });
    // the casing stub and its collar
    seed('eCasing'); pfill(rectPts(casX - 34, GY - 60, 68, 70), AP.iron, { tone: .85, sw: 1.2 }); pfill(rectPts(casX - 46, GY - 72, 92, 22), AP.ironLt, { tone: .85, sw: 1.1 });
    pfill(ellPts(casX, GY - 72, 32, 7, 12), AP.coal, { tone: .9, ink: null });
    // the bailer: shoots up out of the casing, overshoots and hangs; the driller hauls it over the tub
    const up = t < 164.95 ? easeOut(seg(t, 164.56, 164.95)) : 1 + spring(t, 164.95, 5, 15) * .05;
    const yb = lerp(GY + 40, 548, up), over = ease(seg(t, 165.05, 165.5)), bx = lerp(casX, tubX, over);
    const swingA = -.07 * over + spring(t, 165.5, 4, 9) * .05 + (1 - over) * spring(t, 164.95, 3, 7) * .05;
    // hand1: kneels by the tub, holding the rim, hopeful; then the face falls and he sits back on his heels
    const hope = seg(t, 165.3, 165.8), fall = ease(seg(t, 166.15, 166.7)), sit = ease(seg(t, 166.9, 167.5));
    const kneel = { view: 'side', lean: lerp(.3, .05, sit), hpF: 1.35, knF: 2.3, hpB: .2, knB: 2.1, head: lerp(-.1 - .4 * hope, .5, fall), face: fall > .4 ? 'worry' : 'neutral', blink: t > 166.1 && t < 166.22 ? 1 : 0, look: -.4 * hope * (1 - fall), dy: -.2 - .25 * sit };
    reach('eH1', 545, GY, 60, kneel, CAST.hand1, { F: [tubX - 88, rim + 8 + 6 * fall], B: [tubX - 80, rim + 16] });
    // the tub (dark inside, so the dust shows)
    seed('eTub');
    pfill([[tubX - 100, rim], [tubX + 100, rim], [tubX + 84, tubY], [tubX - 84, tubY]], mixCol(AP.timberDk, AP.iron, .25), { tone: .8, dens: 1, sw: 1.2 });
    for (const k of [.2, .75]) pline([[tubX - lerp(100, 84, k), rim + 118 * k], [tubX + lerp(100, 84, k), rim + 118 * k]], 1.6, AP.iron, { over: 0 });
    pfill(ellPts(tubX, rim, 100, 17, 16), AP.coal, { tone: .9, sw: 1.1 });
    const heap = ease(seg(t, KNOCK + .05, 167.5));
    if (heap > 0) pfill([[tubX - 30 - 34 * heap, rim + 2], [tubX, rim - 3 - 12 * heap], [tubX + 30 + 34 * heap, rim + 2], [tubX, rim + 8]], '#D8B77E', { tone: .9, ink: null, curv: true });
    // the cable from the crown
    const valveNow = t < KNOCK ? 0 : 1, Bn = probe(() => bailerFull(bx, yb, sb, swingA, valveNow));
    seed('eBLine'); pline([[casX + 30, -700], Bn.bail], 1.6, AP.iron, { over: 0 });
    // the driller: steadies the tube (back hand), flicks the valve lever with the near hand on the beat; then his head goes down
    const flick = t < KNOCK ? ease(seg(t, 165.55, KNOCK - .05)) : 1, after = ease(seg(t, 166.3, 167.1));
    const dP = { view: 'side', flip: true, lean: .38 + .08 * flick + .1 * after, hpF: .45, knF: .4, hpB: -.25, knB: .2, head: lerp(.25, .35, flick) + .3 * after, face: after > .5 ? 'worry' : 'grit', blink: t > 166.35 && t < 166.47 ? 1 : 0, look: -.2 };
    const reachT = t > 165.05 ? 1 : ease(seg(t, 164.8, 165.05));
    const step = ease(seg(t, 165.0, 165.45)), dxD = lerp(1110, 960, step), rest = [dxD + 70, 600];
    const tgtB = lerp2(rest, Bn.top, reachT);
    let tgtF = lerp2([dxD + 90, 640], Bn.mid, reachT);
    if (t > 165.5) tgtF = lerp2(Bn.mid, add2(Bn.lever, [10, t < KNOCK ? 20 * (1 - flick) : -6]), ease(seg(t, 165.5, 165.68)));
    if (t > 166.3) tgtF = lerp2(tgtF, [dxD + 60, 660], after);
    const DJ = reach('eBDriller', dxD, GY, s, step > 0 && step < 1 ? { ...dP, ...stepPose(step) } : dP, CAST.driller, { F: tgtF, B: tgtB });
    bailerFull(bx, yb, sb, swingA, valveNow);
    // the pour: a cough of grit and two pebbles, a thin stream, a trickle, single grains, nothing
    if (t > KNOCK) {
      const dt = t - KNOCK, vx = Bn.valve[0], vy = Bn.valve[1] + 4, floorY = rim - 4 - 12 * heap;
      const flow = dt < .12 ? dt / .12 : Math.max(0, 1 - Math.pow((dt - .12) / 1.6, .75));
      seed('eStream');
      const dcol = '#B98E52';
      if (flow > .02) {
        const wS = 4 + 12 * flow;
        pfill([[vx - wS / 2, vy], [vx + wS / 2, vy], [vx + wS * .35, floorY], [vx - wS * .35, floorY]], dcol, { tone: .45 + .4 * flow, dens: .9, kind: 'v', ink: null });
        for (let i = 0; i < 30; i++) { const k = frac(hash(i) + dt * 2.2), y = lerp(vy, floorY, k); pline([[vx + (hash(i * 3) - .5) * wS * 1.3, y], [vx + (hash(i * 3) - .5) * wS * 1.3, y + 11]], 1.2, mixCol(dcol, AP.graphite, .35), { over: 0, passes: 1, alpha: flow }); }
      }
      for (let i = 0; i < 7; i++) { const t0 = i < 3 ? .03 + i * .07 : 1.3 + (i - 3) * .28, k = seg(dt, t0, t0 + .3); if (k > 0 && k < 1) pfill(ellPts(vx + (hash(i) - .5) * 10, lerp(vy, floorY, k * k), i < 2 ? 6 : 2.5, i < 2 ? 5 : 2.2, 6), i < 2 ? AP.earthDk : dcol, { tone: .9, sw: .6 }); }
      for (let i = 0; i < 8; i++) { const k = seg(dt, i * .2, i * .2 + 1.6); if (k > 0 && k < 1) psmoke(vx + (hash(i) - .5) * 130 * k, floorY - 18 - 110 * k, 26 + 70 * k, mixCol('#D8B77E', HOT.white, .2), .62 * (1 - k)); }
      if (dt < .12) { seed('eKnock'); for (let i = 0; i < 5; i++) pline([polar(Bn.lever, -Math.PI / 2 + (i - 2) * .5, 16), polar(Bn.lever, -Math.PI / 2 + (i - 2) * .5, 34)], 1.3, AP.graphite, { over: 0, passes: 1 }); }
    }
    sweat([DJ.head[0] + .12 * s, DJ.head[1] - .38 * s], s, t, 5, 1);
    camOff();
    shimmer(t, 60, 420, 2.2);
    glare(.1);
    if (lt < .25) speedLines(1 - easeOut(lt / .25), true, 'e4in');
    if (lt > dur - .32) dustWipe((lt - (dur - .32)) / .64);
  }

  // ======================================================================================================
  // E5 · 167.98–175.96 · the boss nearly beat; the driller's hand on his shoulder; he takes up the sledge
  // ======================================================================================================
  const HAND_ON = bt(322);                                 // 172.20
  const BS = { GY: 850, s: 76, x: 1150, crate: [1065, 681, 170, 169] };
  const BOSS_SIT = { view: 'side', lean: .3, head: .35, hpF: 1.5, knF: 1.55, hpB: 1.35, knB: 1.45, face: 'worry' };
  const COINS = [169.95, 170.6];                           // two coins go down on the bill; then the palm is empty
  function coin(p, s, a = 0) { seed('eCoin' + Math.round(p[0])); pfill(ellPts(p[0], p[1], .2 * s, .08 * s + .1 * s * Math.abs(Math.cos(a)), 10), AP.brass, { tone: .92, sw: .8 }); pglow(p[0] - .05 * s, p[1] - .02 * s, .26 * s, '#FFFFFF', .55); }
  function bill(t, hipP, kneeP, s) {                     // the contract: figures on his knee; it unrolls to the ground and away
    seed('eBill');
    const un = ease(seg(t, 168.35, 169.4)), roll = ease(seg(t, 168.85, 169.75));
    const a = lerp2(hipP, kneeP, .2), b = lerp2(hipP, kneeP, 1.05), up = [0, -.12 * s];
    const drop = [b[0] + .25 * s, b[1] + (.4 + 2.2 * un) * s];
    const P = [add2(a, up), add2(b, up), lerp2(add2(b, up), drop, un)];
    if (roll > 0) P.push([drop[0] + .5 * s + roll * 3.6 * s, BS.GY - .12 * s]);
    const out = limb(P, P.map((_, i) => .62 * s));
    pfill(out, '#F6F0E2', { tone: .92, dens: .35, sw: s / 60 });
    const C = through(P, 10);
    for (let i = 1; i < C.length - 1; i++) {
      const p = C[i], q = C[i + 1], dx = q[0] - p[0], dy = q[1] - p[1], d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d;
      pline([[p[0] + nx * -.2 * s, p[1] + ny * -.2 * s], [p[0] + nx * (.05 + .12 * hash(i)) * s, p[1] + ny * (.05 + .12 * hash(i)) * s]], s / 100, AP.graphiteLt, { over: 0, passes: 1 });
    }
    if (roll > 0) { const e = P[P.length - 1]; pfill(ellPts(e[0], e[1] - .22 * s, .24 * s, .24 * s, 10), '#EFE6D2', { tone: .9, sw: s / 60 }); pline(ellPts(e[0], e[1] - .22 * s, .1 * s, .1 * s, 8), s / 90, AP.graphiteLt, { closed: true, passes: 1 }); }
    const tot = lerp2(P[1], P[2], .1);
    pline([[tot[0] - .28 * s, tot[1] - .05 * s], [tot[0] + .28 * s, tot[1] - .05 * s]], s / 45, AP.red, { over: 0, passes: 1 });   // the total, in red
    return lerp2(a, b, .55);
  }
  function bossScene(t, lt, dur) {
    LIGHT = [.6, .75];
    const { GY, s } = BS, dS = 76, [cx, cy, cw, ch] = BS.crate;
    // camera: the bill; in on his hands for the coins; back out as the hand lands; low on the driller as he takes up the sledge
    const cam = kf(t, [[167.98, [1250, 600, 1.35]], [169.5, [1250, 590, 1.4]], [170.0, [1190, 540, 1.8]], [171.85, [1170, 530, 1.84]], [172.75, [1010, 520, 1.02]], [173.95, [990, 520, 1.0]], [174.75, [890, 430, 1.55]], [175.96, [940, 440, 1.62]]], ease);
    camOn(cam[0], cam[1], cam[2], lerp(0, -.03, ease(seg(t, 173.95, 174.75))));
    noon(640, { key: 'bs', gd: 260 });
    bigSun(470, 100, 88, 1);
    seed('eBsFar'); derrick(1640, 640, 520, { key: 'bsd', col: mixCol(AP.timber, HOT.white, .45), floor: false, bays: 6 });
    // the crate in the thin shade of a derrick leg
    seed('eCrate');
    pshade([[cx - 280, GY], [cx + 420, GY], [cx + 390, GY + 40], [cx - 310, GY + 40]], AP.graphite, .5);
    pfill(rectPts(cx, cy, cw, ch), mixCol(AP.timber, HOT.white, .1), { tone: .75, dens: .9, sw: 1.2 });
    for (let i = 1; i < 4; i++) pline([[cx + 4, cy + i * ch / 4], [cx + cw - 4, cy + i * ch / 4]], .8, AP.timberDk, { over: 0, passes: 1 });
    pline([[cx + 6, cy + 6], [cx + cw - 6, cy + ch - 6]], 1.4, AP.timberDk, { over: 0 });
    // ---- the driller: walks in behind him (his shadow first), hand on the shoulder, takes up the sledge ----
    const walkIn = ease(seg(t, 171.15, 172.0)), stepOut = seg(t, 175.45, 175.96);
    const dxD = lerp(420, 870, walkIn) + stepOut * 150;
    const lift = seg(t, 173.55, 174.25), grabbed = t > 173.5, land = t > 174.25 ? Math.exp(-(t - 174.25) * 7) : 0;
    const defy = ease(seg(t, 174.4, 174.9)), nod = spring(t, 172.9, 5, 12) * .25;
    let Pd = { view: 'side', lean: .16 - .14 * defy + .15 * lift * (1 - lift) * 4 * .5, hpF: .12, knF: .1 + .25 * land, hpB: -.1, knB: .1 + .15 * land,
      head: lerp(.3, .15, ease(seg(t, 172.5, 172.9))) + nod - .45 * defy + .15 * (t > 173.2 && t < 173.6 ? 1 : 0),
      face: defy > .3 ? 'grit' : 'neutral', squash: .1 * land - .06 * defy,
      blink: (t > 173.1 && t < 173.22) || (t > 174.32 && t < 174.44) ? 1 : 0, look: .3 };
    if (t < 172.0) Pd = { ...Pd, ...walkPose((dxD - 420) / (dS * 3.3), 1 - ease(seg(t, 171.75, 172.0))) };
    if (stepOut > 0) Pd = { ...Pd, ...walkPose(stepOut * .7, ease(seg(t, 175.45, 175.6))), head: Pd.head * .6, face: 'grit', lean: .15 };
    const Jd0 = probe(() => man(dxD, GY, dS, Pd, CAST.driller));
    // the sledge leans on the crate until he takes it; then it swings back, up and over onto his shoulder
    const H0 = [cx - 85, GY - .55 * dS], phi0 = 1.88, u0 = [Math.cos(phi0), Math.sin(phi0)], grip0 = [H0[0] - u0[0] * ML * dS * .95, H0[1] - u0[1] * ML * dS * .95];
    const carry = add2(Jd0.hip, [.9 * dS, -.55 * dS]), lk = backOut(lift);
    const grip = grabbed ? lerp2(grip0, carry, ease(lift)) : grip0;
    const phi = grabbed ? lerp(phi0, TAU - 2.3, lk) + spring(t, 174.25, 6, 16) * .1 : phi0;
    // the boss: counts, slumps; looks round at the hand; takes heart
    const up = ease(seg(t, 172.3, 172.7)), hearten = ease(seg(t, 174.6, 175.3));
    const coinK = COINS.map(c => seg(t, c - .32, c));
    const slump = ease(seg(t, 171.05, 171.6));
    const billLook = ease(seg(t, 168.4, 168.8)) * (1 - ease(seg(t, 169.6, 169.9)));
    const Pb = { ...BOSS_SIT, lean: .3 + .14 * slump - .16 * up - .12 * hearten + .012 * Math.sin(t * 2.1),
      head: .35 + .3 * billLook + .15 * slump - .7 * up + .2 * ease(seg(t, 173.6, 174.0)) * (1 - ease(seg(t, 174.1, 174.5))) - .1 * hearten,
      face: up > .5 && hearten > .5 ? 'neutral' : 'worry', blink: (t > 172.1 && t < 172.22) || (t > 174.5 && t < 174.6) ? 1 : 0,
      look: -.9 * up * (1 - hearten * .6), mouth: hearten > .5 ? 0 : .1 * slump };
    const Jb0 = probe(() => man(BS.x, GY, s, Pb, CAST.boss));
    const pile = lerp2(Jb0.hip, Jb0.knF, .55), palm = add2(Jb0.hip, [1.3 * s, -.75 * s]);
    let pick = add2(palm, [.1 * s, -.4 * s]);
    COINS.forEach((c, i) => { const k = coinK[i]; if (k > 0 && k < 1) pick = arcPt(add2(palm, [0, -.25 * s]), add2(pile, [(i - .5) * .3 * s, -.35 * s]), .5 * s, ease(k)); });
    if (t > 170.9) pick = lerp2(pick, add2(palm, [.25 * s, -.55 * s]), ease(seg(t, 170.9, 171.2)));
    const tgtB = lerp2(palm, add2(Jb0.hip, [1.1 * s, -1.2 * s]), hearten), tgtF = lerp2(pick, add2(Jb0.hip, [1.3 * s, -.35 * s]), up);
    // the driller's shadow falls over him before the hand does
    const shadowK = seg(t, 171.45, 172.0);
    // draw: the sledge (if it's behind him), the driller, the boss, the bill; driller's hand over the boss's shoulder
    const handT = t < 172.2 ? lerp2(add2(Jd0.shF, [1.4 * dS, 1.5 * dS]), add2(Jb0.shB, [-.1 * s, .05 * s]), ease(seg(t, 171.85, 172.2))) : add2(Jb0.shB, [-.1 * s, .05 * s]);
    let tF = null, tB = null;
    if (t >= 172.0 && t < 172.95) tF = handT;
    else if (t >= 172.95 && t < 173.5) tF = lerp2(handT, grip0, ease(seg(t, 173.05, 173.5)));
    else if (t >= 173.5) tF = grip;
    if (t >= 172.0) tB = t < 173.4 ? add2(Jd0.hip, [.25 * dS, 1.2 * dS]) : lerp2(add2(Jd0.hip, [.25 * dS, 1.2 * dS]), add2(grip, [-.2 * dS, .3 * dS]), ease(seg(t, 173.4, 173.9)));
    const hd = [grip[0] + Math.cos(phi) * ML * dS * .95, grip[1] + Math.sin(phi) * ML * dS * .95], behind = grabbed && hd[0] < Jd0.neck[0] - .1 * dS;
    if (!grabbed) maul(grip0, phi0, dS * .95, { key: 'bsG' });
    const sledgeHook = J => maul(J.handF, phi, dS * .95, { key: 'bsG' });
    const sPd = { ...Pd };
    const Jb = reach('eBoss', BS.x, GY, s, Pb, CAST.boss, { F: tgtF, B: tgtB }, { front: J => {
      if (t < 171.0) { const n = COINS.filter(c => t < c - .32).length; for (let i = 0; i < n; i++) coin(add2(J.handB, [(i - .5) * .25 * s, -.14 * s]), s); }
      COINS.forEach((c, i) => { const k = coinK[i]; if (k > 0 && k < 1) coin(J.handF, s, k * 6); });
    } });
    const pl = bill(t, Jb.hip, Jb.knF, s);
    COINS.forEach((c, i) => { const p = add2(pl, [(i - .5) * .3 * s, -.2 * s - i * .05 * s]); if (t >= c) coin(p, s); if (t >= c && t < c + .25) pglow(p[0], p[1], .8 * s * (1 - (t - c) / .25), '#FFFFFF', .8); });
    if (shadowK > 0) {                                    // his shadow: along the ground, then up over the boss
      seed('eShadow'); const a = Math.min(1, shadowK * 1.6), reachX = lerp(dxD + 60, cx + cw + 40, easeOut(shadowK));
      const gs = [[dxD - .6 * dS, GY + 4], [dxD + .8 * dS, GY - 6], [reachX, GY - 12], [reachX + 20, GY + 26], [dxD - .4 * dS, GY + 30]];
      ptone(gs, AP.graphite, .18 * a); pshade(gs, AP.graphite, .6 * a);
      const over = easeOut(seg(t, 171.75, 172.1));
      if (over > 0) { X.save(); tracePath(limb([Jb.hip, Jb.neck, Jb.head, Jb.top], [1.45 * s, 1.55 * s, 1.05 * s, .8 * s])); X.clip();
        const top = lerp(GY, Jb.top[1] - s, over); pshade([[cx - 300, top], [cx + 400, top + 60], [cx + 400, GY], [cx - 300, GY]], AP.graphite, .75 * a); ptone([[cx - 300, top], [cx + 400, top + 60], [cx + 400, GY], [cx - 300, GY]], AP.graphite, .12 * a); X.restore(); }
    }
    const Jd = reach('eBsDriller', dxD, GY, dS, sPd, CAST.driller, tF ? { F: tF, B: tB } : null, grabbed ? (behind ? { behind: sledgeHook } : { hold: sledgeHook }) : {});
    sweat([Jb.head[0] - .05 * s, Jb.head[1] - .4 * s], s, t, 7, 2);
    if (t > 174.1) sweat([Jd.head[0] - .05 * dS, Jd.head[1] - .4 * dS], dS, t, 9, 1);
    camOff();
    shimmer(t, 60, 380, 2);
    glare(.1 + .08 * defy);
    if (lt < .36) dustWipe(.5 + lt / .72);
  }
  function walkPose(ph, amt = 1) {
    const sn = Math.sin(ph * TAU), c = Math.cos(ph * TAU);
    return { hpF: .5 * sn * amt, knF: (.15 + .45 * Math.max(0, -c)) * amt, hpB: -.5 * sn * amt, knB: (.15 + .45 * Math.max(0, c)) * amt,
      shF: -.45 * sn * amt, elF: .35, shB: .45 * sn * amt, elB: .3, dy: .12 * Math.abs(Math.cos(ph * TAU * 2)) * amt, lean: .12 * amt };
  }

  // ======================================================================================================
  // E6 · 175.96–184.16 · JOHN HENRY
  // ======================================================================================================
  // The swing is authored as the hammer's handle angle phi, the hands' angle psi and reach R about the mid-shoulder
  // point C, plus body keys. Arms are solved by IK so both hands stay on the handle; at every impact the hands are
  // solved backwards from the drive clamp, so the face lands on it exactly on the beat whatever the body is doing.
  const JH = { s: 68, GY: 856, Sx: 1140 };
  const STR = [331, 333, 335, 337, 339, 341, 343].map(bt);
  // per blow: type, lean/knees/squash at impact, hold (s), shout, top hang (phi), stretch and toe-rise at the top
  const BLW = [
    { type: 'round', lean: .55, kn: .75, sq: .2, hold: .12, mouth: .7, top: 3.9, st: -.1, dy: .06, face: 'shout', flash: 1 },
    { type: 'chop', lean: .5, kn: .6, sq: .12, hold: .08, mouth: .4, top: -2.62, st: -.05, dy: 0, face: 'grit' },
    { type: 'round', lean: .6, kn: .8, sq: .22, hold: .1, mouth: .85, top: 3.95, st: -.12, dy: .1, face: 'shout', flash: 1 },
    { type: 'chop', lean: .54, kn: .68, sq: .15, hold: .09, mouth: .55, top: -2.7, st: -.08, dy: .04, face: 'shout', hitch: true },
    { type: 'round', lean: .58, kn: .82, sq: .22, hold: .11, mouth: .9, top: 3.85, st: -.12, dy: .14, face: 'shout', flash: 1 },
    { type: 'chop', lean: .48, kn: .6, sq: .1, hold: .07, mouth: .3, top: -2.3, st: -.03, dy: 0, face: 'grit', quick: true },
    { type: 'round', lean: .68, kn: .98, sq: .3, hold: .22, mouth: 1, top: 4.0, st: -.16, dy: .18, face: 'shout', flash: 2, big: true },
  ];
  const BODY = { view: 'side', hpB: -.3, knB: .3, face: 'grit', mouth: 0 };
  const impactBody = b => ({ ...BODY, lean: b.lean, hpF: .45 + b.kn * .25, knF: b.kn, hpB: -.4, knB: .55, head: .32, face: b.face, mouth: b.mouth, squash: b.sq, blink: .5 });
  let _jhGeo = null;
  function jhGeo() {                                  // where the driller stands so the canonical blow lands on the clamp
    if (_jhGeo) return _jhGeo;
    const { s, GY, Sx } = JH, P = impactBody(BLW[0]), J = probe(() => man(0, GY, s, P, CAST.driller));
    const C = lerp2(J.shF, J.shB, .5), psi = .82, R = 2.5 * s, phi = .1, u = [Math.cos(phi), Math.sin(phi)], n = [-u[1], u[0]];
    const grip = add2(C, [Math.cos(psi) * R, Math.sin(psi) * R]), face = add2(grip, [u[0] * ML * s + n[0] * HL * 1.1 * s, u[1] * ML * s + n[1] * HL * 1.1 * s]);
    return (_jhGeo = { DX: Sx - face[0], S: [Sx, face[1]] });
  }
  function solveHit(P) {                              // hands' (psi, R) that put the face of the maul on the clamp
    const { s, GY } = JH, G = jhGeo(), J = probe(() => man(G.DX, GY, s, P, CAST.driller)), C = lerp2(J.shF, J.shB, .5);
    const phi = .1, u = [Math.cos(phi), Math.sin(phi)], n = [-u[1], u[0]];
    const grip = [G.S[0] - u[0] * ML * s - n[0] * HL * 1.1 * s, G.S[1] - u[1] * ML * s - n[1] * HL * 1.1 * s];
    return { psi: Math.atan2(grip[1] - C[1], grip[0] - C[0]), R: Math.hypot(grip[0] - C[0], grip[1] - C[1]) / s };
  }
  const _hits = [];
  const hitOf = i => _hits[i] || (_hits[i] = solveHit(impactBody(BLW[i])));
  const CARRY = { P: { ...BODY, lean: .05, hpF: .15, knF: .15, hpB: -.15, knB: .12, head: .05, face: 'grit' }, phi: -2.88, psi: .55, R: 1.3 };
  // keys for the stretch between blow i-1 (or the carry at the shot start) and blow i
  function cycleKeys(i) {
    const b = BLW[i], tb = STR[i], H = hitOf(i), round = b.type === 'round', w = round ? TAU : 0;
    const IMP = { P: impactBody(b), phi: .1 + w, psi: H.psi + w, R: H.R };
    const TOP = { P: { ...BODY, lean: -.22, hpF: .22, knF: .12, hpB: -.18, knB: .1, head: .12, face: 'grit', squash: b.st, dy: b.dy }, phi: b.top, psi: round ? 4.15 : -2.1, R: 2.2 };
    const HANG = { ...TOP, P: { ...TOP.P, lean: -.25, squash: b.st * 1.15 }, phi: b.top + (round ? .08 : -.08), psi: TOP.psi + (round ? .05 : -.05) };
    const DOWN = { P: { ...BODY, lean: .32, hpF: .35, knF: .45, head: .3, face: 'shout', mouth: .35, squash: -.05 }, phi: round ? 5.55 : -1.0, psi: round ? 6.1 : -.15, R: 2.5 };
    if (i === 0) {                                       // from the shoulder carry: dip, heave it up overhead, hang, strike
      const t0 = 175.96;
      return [[t0, CARRY], [176.2, CARRY, lin], [176.4, { P: { ...CARRY.P, lean: .22, hpF: .5, knF: .65, squash: .12, head: .2 }, phi: -3.3, psi: 1.1, R: 2.0 }, ease],
        [176.76, { ...TOP, phi: TOP.phi - TAU, psi: -2.15 }, ease], [176.9, { ...HANG, phi: HANG.phi - TAU, psi: -2.1 }, lin],
        [tb - .05, { ...DOWN, phi: DOWN.phi - TAU, psi: DOWN.psi - TAU }, easeIn], [tb, { ...IMP, phi: .1, psi: H.psi }, lin]];
    }
    const pb = BLW[i - 1], tp = STR[i - 1], HP = hitOf(i - 1), Lc = tb - tp;
    const PREV = { P: impactBody(pb), phi: .1, psi: HP.psi, R: HP.R };
    const FOLLOW = { P: { ...PREV.P, lean: pb.lean + .06, knF: pb.kn + .12, hpF: .5 + pb.kn * .3, squash: pb.sq + .05, head: .38 }, phi: .02, psi: HP.psi - .04, R: HP.R - .1 };
    const topT = b.big ? tb - .36 : b.quick ? tb - .15 : tb - .2, hangT = b.big ? tb - .1 : b.quick ? tb - .08 : tb - .11;
    if (round) {
      const REC = { P: { ...BODY, lean: .25, hpF: .3, knF: .3, head: .15, face: 'grit' }, phi: 1.0, psi: 1.05, R: 2.15 };
      const UNDER = { P: { ...BODY, lean: .02, hpF: .15, knF: .15, head: .05, face: 'grit' }, phi: 2.2, psi: 1.75, R: 2.35 };
      const BACK = { P: { ...BODY, lean: -.12, hpF: .18, knF: .12, head: .1 }, phi: 3.4, psi: 2.7, R: 2.4 };
      return [[tp, PREV], [tp + pb.hold, PREV, lin], [tp + pb.hold + .07, FOLLOW, easeOut], [tp + Lc * .36, REC, ease], [tp + Lc * .52, UNDER, lin],
        [tp + Lc * .66, BACK, lin], [topT, TOP, easeOut], [hangT, HANG, lin], [tb - .05, DOWN, easeIn], [tb, IMP, lin]];
    }
    const REB = { P: { ...BODY, lean: .3, hpF: .35, knF: .4, head: .25 }, phi: -.4, psi: .75, R: 2.4 };
    const LIFT = { P: { ...BODY, lean: .05, hpF: .2, knF: .2, head: .2 }, phi: -1.5, psi: .1, R: 1.85 };
    if (b.hitch) {                                       // a hitch at the top: up past it, a small drop, up again, then down
      const OVER = { ...TOP, phi: b.top - .35, psi: TOP.psi - .15, P: { ...TOP.P, squash: b.st * 1.3, dy: b.dy + .06 } };
      const DIP = { ...TOP, phi: b.top + .3, psi: TOP.psi + .12, P: { ...TOP.P, knF: .3, squash: .04, dy: 0 } };
      return [[tp, PREV], [tp + pb.hold, PREV, lin], [tp + pb.hold + .06, FOLLOW, easeOut], [tp + pb.hold + .2, REB, easeOut], [tp + Lc * .42, LIFT, ease],
        [tb - .36, OVER, easeOut], [tb - .24, DIP, ease], [tb - .13, TOP, easeOut], [tb - .08, HANG, lin], [tb - .04, DOWN, easeIn], [tb, IMP, lin]];
    }
    return [[tp, PREV], [tp + pb.hold, PREV, lin], [tp + pb.hold + .06, FOLLOW, easeOut], [tp + pb.hold + .22, REB, easeOut], [tp + Lc * (b.quick ? .55 : .5), LIFT, ease],
      [topT, TOP, easeOut], [hangT, HANG, lin], [tb - .045, DOWN, easeIn], [tb, IMP, lin]];
  }
  function swingAt(t) {
    let i = STR.findIndex(x => t < x); if (i < 0) i = STR.length;   // i = the blow we're heading for
    if (i >= STR.length) {                               // after the last blow: a long hold, then he sinks
      const b = BLW[STR.length - 1], H = hitOf(STR.length - 1), k = ease(seg(t, STR[STR.length - 1] + b.hold, STR[STR.length - 1] + b.hold + .4));
      const P = impactBody(b); P.knF += .15 * k; P.lean += .06 * k; P.squash += .04 * k; P.head += .1 * k;
      return { P, phi: .1 - .05 * k, psi: H.psi - .03 * k, R: H.R - .08 * k, i: STR.length - 1, since: t - STR[STR.length - 1] };
    }
    const keys = cycleKeys(i), num = f => keys.map(([tt, K, e]) => [tt, K[f], e]);
    const P = keyed(t, keys.map(([tt, K, e]) => [tt, K.P, e]));
    const val = f => { const K = num(f); if (t <= K[0][0]) return K[0][1]; for (let j = 1; j < K.length; j++) if (t < K[j][0]) return lerp(K[j - 1][1], K[j][1], (K[j][2] || ease)((t - K[j - 1][0]) / (K[j][0] - K[j - 1][0]))); return K[K.length - 1][1]; };
    return { P, phi: val('phi'), psi: val('psi'), R: val('R'), i, since: i > 0 ? t - STR[i - 1] : 99 };
  }
  // hands, head and draw layer for the driller at time t (no drawing)
  function jhRig(t) {
    const { s, GY } = JH, G = jhGeo(), W0 = swingAt(t), P = { ...W0.P };
    const ip = STR.filter(x => t >= x).length - 1;
    if (ip >= 0) { const hb = STR[ip] + BLW[ip].hold; P.head += spring(t, hb, 6, 16) * .18; P.lean += spring(t, hb, 7, 14) * .05; }
    const J0 = probe(() => man(G.DX, GY, s, P, CAST.driller)), C = lerp2(J0.shF, J0.shB, .5);
    const grip = add2(C, [Math.cos(W0.psi) * W0.R * s, Math.sin(W0.psi) * W0.R * s]), u = [Math.cos(W0.phi), Math.sin(W0.phi)];
    const tgt = { F: grip, B: add2(grip, [-u[0] * .8 * s, -u[1] * .8 * s]) };
    [P.shF, P.elF] = ik(J0.shF, tgt.F, s, CAST.driller, 1); [P.shB, P.elB] = ik(J0.shB, tgt.B, s, CAST.driller, 1);
    const head = add2(grip, [u[0] * ML * s, u[1] * ML * s]);
    const behind = head[0] < J0.neck[0] - .2 * s && head[1] > J0.head[1] - 1.5 * s;
    return { P, W: W0, grip, head, behind };
  }
  // the hero's face must read at the top of the swing: when the near arm is raised across his head, draw him into a
  // layer, cut the face/hat region out and redraw it from a pass with that arm lowered (the arm then passes behind it)
  let _hl = null;
  function headClip(J, s) { const c = J.head; return [[-.2, -1.2], [.7, -1.05], [1.2, -.55], [.8, .2], [.62, .95], [-.05, .95], [-.22, .25], [-.3, -.45]].map(([u, v]) => [c[0] + u * s, c[1] + v * s]); }
  function drawDriller(t, R) {
    const { s, GY } = JH, G = jhGeo();
    const mk = J => maul(J.handF, R.W.phi, s, { key: 'jh' });
    const smear = () => {                                   // pencil speed strokes along the head's path on the strike
      const W0 = R.W, b = BLW[W0.i]; if (W0.i >= STR.length || !b) return;
      const tb = STR[W0.i], dt = tb - t; if (dt > .15 || dt < -.01) return;
      const pts = [.12, .09, .06, .04, .02, 0].map(d => jhRig(Math.min(t, tb) - d).head);
      seed('eSmear');
      for (let k = -3; k <= 3; k++) pline(pts.map(p => [p[0] + k * .12 * s, p[1] - k * .05 * s]), 1.3, AP.graphite, { over: 0, passes: 1, curv: true, alpha: .55 - Math.abs(k) * .12, taper: .95 });
    };
    const hooks = R.behind ? { behind: J => { smear(); mk(J); } } : { hold: J => { smear(); mk(J); } };
    const J0 = probe(() => man(G.DX, GY, s, R.P, CAST.driller));
    const covered = J0.elF[1] < J0.head[1] + .5 * s || J0.wrF[1] < J0.head[1];
    if (!covered) { seed('eJH'); return man(G.DX, GY, s, R.P, CAST.driller, hooks); }
    if (!_hl) { const c = document.createElement('canvas'); c.width = W; c.height = H; _hl = c.getContext('2d'); }
    const L = _hl, keep = X, tr = X.getTransform(), z = ZOOM, pc = PCAM;
    L.setTransform(1, 0, 0, 1, 0, 0); L.globalAlpha = 1; L.globalCompositeOperation = 'source-over'; L.clearRect(0, 0, W, H); L.setTransform(tr); X = L;
    let J;
    try {
      seed('eJH'); J = man(G.DX, GY, s, R.P, CAST.driller, hooks);
      X.save(); tracePath(headClip(J, s)); X.clip();
      X.save(); X.setTransform(1, 0, 0, 1, 0, 0); X.clearRect(0, 0, W, H); X.restore();
      seed('eJH'); man(G.DX, GY, s, { ...R.P, shF: .2, elF: .3 }, CAST.driller);
      X.restore();
    } finally { X = keep; ZOOM = z; PCAM = pc; }
    X.save(); X.setTransform(1, 0, 0, 1, 0, 0); X.drawImage(L.canvas, 0, 0); X.restore();
    return J;
  }
  // offscreen layer for the impact frame: draw, then flatten to a graphite silhouette
  let _lay = null;
  function silhouette(fn, col) {
    if (!_lay) { const c = document.createElement('canvas'); c.width = W; c.height = H; _lay = c.getContext('2d'); }
    const L = _lay, keep = X, tr = X.getTransform(), z = ZOOM, pc = PCAM;
    L.setTransform(1, 0, 0, 1, 0, 0); L.globalAlpha = 1; L.globalCompositeOperation = 'source-over'; L.clearRect(0, 0, W, H); L.setTransform(tr); X = L;
    try { fn(); } finally { X = keep; ZOOM = z; PCAM = pc; }
    L.setTransform(1, 0, 0, 1, 0, 0); L.globalCompositeOperation = 'source-in'; L.fillStyle = col; L.fillRect(0, 0, W, H); L.globalCompositeOperation = 'source-over';
    X.save(); X.setTransform(1, 0, 0, 1, 0, 0); X.drawImage(L.canvas, 0, 0); X.restore();
  }
  // ---- the crew: slumped in the heat on the rod pile, they get up one by one and join the rhythm ----
  const RISE = [bt(332) - .15, bt(334) - .1, bt(336) - .1, bt(338) - .05];     // Bill, hand1, hand2, the boss
  const SIT = { view: 'side', lean: .45, head: .55, hpF: 1.55, knF: 1.9, hpB: 1.45, knB: 1.95, shF: .6, elF: 1.2, shB: .5, elB: 1.3, face: 'closed', dy: -.55 };
  function lastHit(t) { let l = -99; for (const x of STR) if (t >= x) l = x; return t - l; }
  function crew(t) {
    const Y = 792, s = 44, since = lastHit(t), hk = Math.exp(-since * 6);
    const risePose = (k, flip, stand) => {
      if (k <= 0) return { ...SIT, flip };
      if (k < .35) return kp(k / .35, [[0, { ...SIT, flip }], [1, { ...SIT, flip, lean: .75, head: .2, face: 'neutral', dy: -.5 }]]);
      return kp((k - .35) / .65, [[0, { ...SIT, flip, lean: .75, head: .2, face: 'neutral', dy: -.5 }], [1, { ...stand, flip }]], backOut);
    };
    // Bill: on his feet, a fist up on every blow
    const kB = seg(t, RISE[0], RISE[0] + .55), billUp = { view: 'side', lean: -.08 - .12 * hk, shF: 1.3 + 1.6 * hk, elF: 1.1 - .7 * hk, shB: .2, elB: .5, hpF: .1, knF: .1, head: -.1 - .2 * hk, face: hk > .35 ? 'shout' : 'grit', mouth: .5 * hk };
    seed('eBill'); man(250, Y, s * 1.02, kB < 1 ? risePose(kB, false, billUp) : billUp, CAST.bill);
    // the boss: last up; the bowler, a fist pumping on the blows, shouting
    const kS = seg(t, RISE[3], RISE[3] + .6), bossUp = { view: 'side', lean: -.12 - .1 * hk, shF: 1.2 + 1.7 * hk, elF: 1.3 - .9 * hk, shB: .3, elB: .9, head: -.15 - .15 * hk, face: 'shout', mouth: .25 + .5 * hk };
    seed('eBoss6'); man(430, Y + 4, s, kS < 1 ? risePose(kS, false, bossUp) : bossUp, CAST.boss);
    // hands 1 and 2: up and on the bull rope, hauling down on each blow (hand2 a hair late)
    const haul = lag => { const k = Math.exp(-Math.max(0, lastHit(t - lag)) * 5); return { view: 'side', flip: true, lean: -.1 - .35 * k, shF: 2.4 - 1.1 * k, elF: .2 + .2 * k, shB: 2.2 - 1.0 * k, elB: .25, hpF: .35, knF: .2 + .15 * k, hpB: -.3, knB: .25, head: -.2 + .25 * k, face: k > .4 ? 'shout' : 'grit', mouth: .35 * k }; };
    const k1 = seg(t, RISE[1], RISE[1] + .55), k2 = seg(t, RISE[2], RISE[2] + .55);
    const rope = [];
    const J1 = (seed('eH1c'), man(1500, Y, s * .98, k1 < 1 ? risePose(k1, true, haul(0)) : haul(0), CAST.hand1));
    const J2 = (seed('eH2c'), man(1660, Y + 3, s * .96, k2 < 1 ? risePose(k2, true, haul(.05)) : haul(.05), CAST.hand2));
    seed('eRope');
    if (k1 >= 1 || k2 >= 1) { const P = [[1330, -400]]; if (k1 >= 1) P.push(J1.handF, J1.handB); if (k2 >= 1) P.push(J2.handF, J2.handB); P.push([1760, Y - 20], [1820, Y + 6]); pline(P, 2.4, '#B89A68', { curv: true, over: 0 }); }
    else pline([[1330, -400], [1340, Y - 40], [1380, Y + 6], [1700, Y + 10]], 2.2, '#B89A68', { curv: true, over: 0 });
  }
  function johnHenry(t, lt, dur) {
    LIGHT = [.55, .8];
    const { s, GY } = JH, G = jhGeo(), S = G.S;
    const since = lastHit(t), hk = Math.exp(-since * 9), iLast = STR.filter(x => t >= x).length - 1, bLast = BLW[Math.max(0, iLast)];
    const imp = iLast >= 0 && since < 1 / 24 && bLast.flash;                  // the impact frame
    const big = iLast === STR.length - 1 && since >= 0;
    const sh = shakeXY(t, hk * (bLast && bLast.big ? 16 : 8));
    const cam = kf(t, [[175.96, [940, 505, 1.06]], [179.2, [935, 500, 1.1]], [182.9, [945, 495, 1.15]], [184.16, [1100, 600, 1.55]]], ease);
    const punch = big ? .1 * Math.exp(-since * 5) : 0;
    camOn(cam[0] + sh[0], cam[1] + sh[1], cam[2] + punch, -.025);
    // sky and the swollen sun, placed where the hammer tops out, so he raises it against the sun
    noon(770, { key: 'jh', gd: 200 });
    bigSun(560, 175, 96, 1);
    // the far plain and a derrick on the horizon; this derrick's legs rising past the frame
    seed('eJHfar'); derrick(1780, 772, 230, { key: 'jhfar', col: mixCol(AP.timber, HOT.white, .55), floor: false, bays: 5 });
    seed('eJHlegs'); const legC = mixCol(AP.timber, HOT.white, .3);
    pfill(limb([[90, 800], [700, -700]], [40, 26]), legC, { tone: .7, dens: .85, sw: 1.1 });
    pfill(limb([[1820, 800], [1260, -700]], [40, 26]), legC, { tone: .7, dens: .85, sw: 1.1 });
    for (const y of [300, -120]) { const a = lerp(90, 700, (800 - y) / 1500), b = lerp(1820, 1260, (800 - y) / 1500); pline([[a, y], [b, y]], 2.2, mixCol(AP.timberDk, HOT.white, .3), { over: 4 }); }
    // the rod pile the crew sat on, the floor
    seed('eJHpile'); for (let i = 0; i < 5; i++) pfill(limb([[140 + i * 4, 782 - i * 11], [620 + i * 4, 786 - i * 11]], [11, 11]), AP.pine, { tone: .7, sw: .8 });
    seed('eJHpile2'); for (let i = 0; i < 5; i++) pfill(limb([[1380 + i * 4, 784 - i * 11], [1820 + i * 4, 780 - i * 11]], [11, 11]), AP.pine, { tone: .7, sw: .8 });
    seed('eJHfloor');
    pfill([[-400, 786], [2400, 786], [2400, 1100], [-400, 1100]], mixCol(AP.timber, HOT.white, .3), { tone: .75, dens: .85, sw: 1.1, still: true });
    for (let i = 0; i < 30; i++) pline([[-400 + i * 100, 788], [-520 + i * 112, 1000]], .6, AP.timberDk, { over: 0, passes: 1, alpha: .55 });
    crew(t);
    // the pipe and the drive clamp: it jumps down a little on every blow
    const kick = hk * 6;
    seed('eJHpipe');
    pfill(rectPts(S[0] - .32 * s, S[1] + .8 * s, .64 * s, GY - S[1] + 60), AP.iron, { tone: .85, dens: 1, sw: 1.2 });
    plit(rectPts(S[0] - .22 * s, S[1] + 1 * s, .12 * s, GY - S[1] - 20), .6, '#FFFFFF', { kind: 'v' });
    pfill(rrPts(S[0] - .85 * s, S[1] + kick, 1.7 * s, .9 * s, .12 * s), AP.iron, { tone: .9, dens: 1.1, sw: 1.4 });
    plit(rectPts(S[0] - .7 * s, S[1] + .1 * s + kick, 1.4 * s, .16 * s), .75, '#FFFFFF');
    pshade(ellPts(S[0], GY + 6, 1.4 * s, .2 * s, 12), AP.graphite, .8);
    // the driller
    const R = jhRig(t);
    pshade(ellPts(G.DX + .3 * s, GY + 4, 2.4 * s, .28 * s, 14), AP.graphite, .9);           // his noon shadow, pooled under him
    if (imp) {                                           // one frame: white-hot, and the man a black shape
      glare(.9, '#FFFBF0');
      silhouette(() => drawDriller(t, R), '#221C18');
      seed('eImp'); for (let i = 0; i < 22; i++) { const a = -Math.PI + (i + .5) / 22 * Math.PI + (hash(i) - .5) * .1, r0 = .4 * s, r1 = (3 + 4 * hash(i * 3)) * s * (bLast.big ? 1.5 : 1); pline([polar(S, a, r0), polar(S, a, r1)], 2.4, '#221C18', { over: 0, passes: 1, taper: .9 }); }
    } else {
      const DJ = drawDriller(t, R);
      // sparks off the clamp: a flare, then a fan of streaks that arc and fall
      if (iLast >= 0 && since < .6) {
        const e = since, big2 = bLast.big ? 1.6 : bLast.type === 'round' ? 1.15 : .8;
        seed('eSpk' + iLast);
        pglow(S[0], S[1], s * 3.5 * big2 * (1 - e / .6), '#FFFFFF', 1 - e / .6);
        pglow(S[0], S[1], s * 1.6 * big2, AP.lamp, (1 - e / .6) * .9);
        const n = Math.round(16 * big2);
        for (let i = 0; i < n; i++) {
          const a = -Math.PI * (.08 + .84 * hash(i * 3.3 + iLast)), v = (7 + 9 * hash(i + iLast * 5)) * s * big2, g = 30 * s;
          const p = [S[0] + Math.cos(a) * v * e, S[1] + Math.sin(a) * v * e + .5 * g * e * e], q = [S[0] + Math.cos(a) * v * (e - .035), S[1] + Math.sin(a) * v * (e - .035) + .5 * g * (e - .035) * (e - .035)];
          if (p[1] < GY) pline([q, p], 1.8, i % 3 ? AP.lamp : '#FFFFFF', { over: 0, passes: 1, alpha: 1 - e / .6 });
        }
        if (e < .08) for (let i = 0; i < 12; i++) { const a = -Math.PI + (i + .5) / 12 * Math.PI; pline([polar(S, a, .5 * s), polar(S, a, (1.6 + 1.4 * hash(i)) * s)], 1.6, AP.graphite, { over: 0, passes: 1, alpha: 1 - e / .08 }); }
        for (let i = 0; i < 4; i++) psmoke(S[0] + (hash(i + iLast) - .5) * 3 * s * (e + .3), S[1] - e * 2 * s * hash(i + 2), s * (.5 + e * 2), mixCol(HOT.ground, HOT.white, .3), .45 * (1 - e / .6));
      }
      if (since < .5) sweat([DJ.head[0] - .05 * s, DJ.head[1] - .42 * s], s, t, 11, 2);
    }
    camOff();
    shimmer(t, 20, 330, 2.4);
    glare(.08);
    // the last blow's flare swells white over the frame: the dive comes out of it
    if (big) glare(ease(seg(t, STR[STR.length - 1] + .18, 184.16)) * 1.02, '#FFFBF0');
  }

  // ======================================================================================================
  // E7 · 184.16–189.20 · the dive through the granite to 3500 ft
  // ======================================================================================================
  const DX7 = 960;
  function diveE(t, lt, dur) {
    LIGHT = [-.5, .85];
    const nB = Math.max(0, beatN(t) - beatN(184.16));           // blows landed since the dive began
    dive(t, lt, dur, { from: 2960, to: 3500, x: DX7, lead: -60,
      extra: dCam => {
        const cy = dCam * FT, hk = pulse(t, 5);
        seed('eDvHeat'); ptone(rectPts(DX7 - 2600, cy - 2400, 5200, 4800), HOT.far, .1);
        // the granite: quartz and feldspar grains; the ones near the bit flash as each blow lands
        seed('eDvQuartz');
        for (let i = 0; i < 90; i++) {
          const x = DX7 + (hash(i * 3.7) - .5) * 3000, y = (3110 + hash(i * 5.3) * 700) * FT; if (Math.abs(x - DX7) < 50) continue;
          const r = 9 + hash(i) * 14, a = hash(i * 9) * Math.PI, pink = hash(i * 2) < .4;
          pfill([polar([x, y], a, r), polar([x, y], a + 1.9, r * .6), polar([x, y], a + Math.PI, r), polar([x, y], a + 1.9 + Math.PI, r * .6)], pink ? '#D9A08A' : '#F4F1EA', { tone: .85, sw: .8 });
          const near = Math.hypot(x - DX7, y - 3500 * FT) < 700;
          if (!pink && near && hk > .15) pglow(x, y, r * 4 * hk, '#FFFFFF', hk);
        }
        // cracks run out of the rock round the bit, a little further on every blow
        seed('eDvCr');
        const bY = 3500 * FT;
        for (let i = 0; i < 9; i++) {
          const a = Math.PI / 2 + (i - 4) * .36 + (hash(i) - .5) * .2, L = 60 + hash(i * 3) * 110 + nB * 22, P = [[DX7, bY]];
          for (let j = 1; j <= 5; j++) P.push(polar([DX7, bY], a + (hash(i * 5 + j) - .5) * .35, L * j / 5));
          pline(P, 1.2 - (i % 2) * .4, AP.graphite, { over: 0, taper: .95 });
        }
      },
      over: (dCam, bitD) => {
        // each blow from up top runs down the rods as a flash, arriving at the bit on the beat
        const fb = frac(bpOf(t)); if (fb < .7) return;
        const k = (fb - .7) / .3, y0 = dCam * FT - 1000, y = lerp(y0, bitD * FT - 60, easeIn(k));
        pglow(DX7, y, 80, '#FFFFFF', .9); pglow(DX7, y, 30, AP.lamp, 1);
        seed('eDvPulse'); for (const sd of [-1, 1]) pline([[DX7 + sd * 16, y - 40], [DX7 + sd * 16, y + 40]], 1.6, '#FFFFFF', { over: 0, passes: 1 });
      } });
    if (lt < .5) glare(1 - easeOut(lt / .5), '#FFFBF0');
    seamOut(lt, dur);
  }

  shots([[151.94, veranda], [162.74, boreUp], [164.6, bailOut], [167.98, bossScene], [175.96, johnHenry], [184.16, diveE]]);
})();
