// Chapter F (v2) · 188.97–222.73 s · Bedrock. Verse 6 (lyric lines 45–49) and chorus 6 (50–53).
// Storm-dark dusk: the sun low in the west (-x) under a lid of cloud, a bruised violet-grey sky drawn in 2D, gusts of
// dust off the plain, red effort and firelight. Ends with no wipe: chapter G cuts in on "Hark!" with the whistle's steam.
//   F1 188.97 driller kneels, palm on the rods, listening      F9  207.28 the mend driven; the tools stick fast
//   F2 192.33 section: the bit at 3,600 ft, the blue far below  F10 208.86 the crew on the capstan bars; it gives
//   F3 195.53 the bit bouncing on the iron band at 4,000 ft     F11 212.62 chorus: the plant at full stroke in the storm
//   F4 197.67 the string jumping at the surface                 F12 215.83 Bill drives gidgee into the firebox
//   F5 199.19 drawing up, a pole snaps                          F13 216.89 the driller's hands on the bar; whip down
//   F6 200.87 the dresser forges an iron strap                  F14 218.51 section: the band cracks, the string drops 7 ft,
//   F7 202.48 the splice bolted on the trestles                            blue water wells up the bore
//   F8 204.61 fencing wire bound round the split, twisted tight F15 221.17 the crew frozen round the bore, listening
(() => {
  const bt = n => OFF + n * BEAT;                                    // time of beat n (a blow lands on every even beat)
  const SUN = [-86, 17, 38];                                         // low west, under the cloud
  const WIND = [1, 0, -.28];                                         // the gale blows from the west, off the sun
  const PINE = '#D8B060', IRON = '#4A4744', IRON_LT = '#7C7770';
  const liftOf = st => st < .75 ? Math.sin(st / .75 * Math.PI / 2) : 1 - Math.pow((st - .75) / .25, 2);   // the rig's own curve
  const strokeFor = l => .75 * Math.asin(clamp(l)) / (Math.PI / 2);   // its inverse on the lifting side (for rebounds)
  const sinceBlow = t => frac(bpOf(t) / 2 + 1e-6) * 2 * BEAT;        // seconds since the last blow
  // the string rebounds off solid rock: a hop after each blow that dies away (in lift units)
  const rebound = (t, a = .22) => { const s = sinceBlow(t); return a * Math.exp(-s * 7) * Math.abs(Math.sin(s * 19)); };

  // ---------- 2D: the storm sky, dust, sparks ----------
  function horizonY(cam) {
    const f = new THREE.Vector3(); cam.getWorldDirection(f); const fh = Math.hypot(f.x, f.z) || 1, cp = cam.position;
    return P3.project(cam, [cp.x + f.x / fh * 6000, 0, cp.z + f.z / fh * 6000])[1];
  }
  function camYaw(cam) { const f = new THREE.Vector3(); cam.getWorldDirection(f); return Math.atan2(f.x, f.z); }
  // Bruised violet-grey over a hot red slit where the sun is sinking under the cloud. Cloud banks hang on the camera's
  // yaw so they pan with it, and drift east on the gale.
  function stormSky(cam, t, o = {}) {
    const hy = horizonY(cam), yaw = camYaw(cam), pxr = W / (2 * Math.atan(Math.tan(cam.fov * Math.PI / 360) * W / H));
    const top = o.top || '#262033', mid = o.mid || '#4E4460', low = o.low || '#8E4A44', slit = o.slit || '#E98A4C';
    const sd = new THREE.Vector3(...SUN).normalize(), cp = cam.position, [sx, , sdep] = P3.project(cam, [cp.x + sd.x * 5000, cp.y + sd.y * 5000, cp.z + sd.z * 5000]);
    const sunOn = sdep > 0 ? clamp(1.2 - Math.abs(sx - W / 2) / W) : 0;
    X.save();
    const g = X.createLinearGradient(0, hy - 1000, 0, hy + 30);
    g.addColorStop(0, top); g.addColorStop(.5, mid); g.addColorStop(.86, mixCol(mid, low, .8)); g.addColorStop(.95, mixCol(low, slit, .3 + sunOn * .5)); g.addColorStop(1, low);
    X.fillStyle = g; X.globalAlpha = .94; X.fillRect(-100, -100, W + 200, H + 200); X.restore();
    seed('Fsky');
    pshade(rectPts(-80, -80, W + 160, hy + 60), top, .6, { still: true });
    pshade(rectPts(-80, hy - 300, W + 160, 330), mixCol(low, top, .3), .45, { still: true, kind: 'v' });
    if (sdep > 0 && sunOn > 0) { pglow(sx, hy - 18, 900, '#C8502E', .55 * sunOn); pglow(sx, hy - 10, 320, slit, .5 * sunOn); }
    // cloud: ragged masses in banks, heavier and darker aloft, their bellies lit a dull red toward the horizon
    for (let b = 0; b < 4; b++) {
      seed('Fcl' + b);
      const by = hy - 60 - b * 140 - b * b * 30 - (o.lift || 0), n = 6, col = mixCol('#2A2336', mid, .12 + b * .1), rim = mixCol(low, slit, sunOn * .5);
      for (let i = 0; i < n; i++) {
        const a0 = (i + hash(b * 13 + i) * .8) / n * TAU - Math.PI;
        const x = W / 2 + ((a0 - yaw + Math.PI * 5) % TAU - Math.PI) * pxr + (t * (5 + b * 3)) % 500 - 250;
        const rx = (240 + hash(i * 3 + b) * 280) * (1 + b * .2), y = by + (hash(b * 5 + i) - .5) * 80;
        if (x < -rx * 1.5 || x > W + rx * 1.5 || y < -rx || y > H + 50) continue;
        // a mass of lumps: bigger toward the middle, a flat-ish belly
        const L = 5 + Math.floor(hash(i * 11 + b) * 4);
        for (let j = 0; j < L; j++) {
          const u = (j + .5) / L - .5, lx = x + u * rx * 1.9 + (hash(i * 7 + j) - .5) * rx * .2, lr = rx * (.26 + .22 * (1 - Math.abs(u) * 1.6) * (.7 + hash(j * 3 + i) * .6));
          const ly = y - lr * .35 * (1 - Math.abs(u)) + (hash(j + i * 5) - .5) * lr * .2;
          pfill(ellPts(lx, ly, lr, lr * .55, 14, lr * .04), col, { tone: .7 - b * .07, dens: .85, ink: null, still: true });
        }
        pline([[x - rx * .95, y + rx * .06], [x - rx * .3, y + rx * .1], [x + rx * .4, y + rx * .09], [x + rx * .95, y + rx * .04]], 1.3, rim, { curv: true, over: 0, passes: 1, alpha: .55 - b * .1 });
      }
    }
    return hy;
  }
  // Dust on the gale: puffs in the world, carried east by the wind, projected. With o.split (ft), draw only the puffs
  // nearer than split (o.near, after the 3D) or only the farther ones (before it, so solid geometry hides them).
  function dust(cam, t, o = {}) {
    const c = o.c || [0, 0, 0], R = o.r ?? 60, n = o.n ?? 26, k = o.k ?? 1, gust = .55 + .45 * Math.sin(t * .9 + 1.3) * Math.sin(t * .37);
    seed('Fdust' + (o.near ? 'n' : 'f'));
    for (let i = 0; i < n; i++) {
      const sp = 14 + hash(i * 7) * 12, ph = frac(hash(i * 3.3) + t * sp / (2 * R));
      const x = c[0] - R + ph * 2 * R, z = c[2] + (hash(i * 5.1) - .5) * 2 * R + WIND[2] * ph * R, y = c[1] + .5 + hash(i * 9.7) * (o.h ?? 6);
      const [px, py, d] = P3.project(cam, [x, y, z]); if (d < 2) continue;
      if (o.split != null && (d < o.split) !== !!o.near) continue;
      const fade = Math.sin(ph * Math.PI), r = (4 + hash(i) * 7) * 900 / d * (o.scale ?? 1);
      if (px < -r || px > W + r || py < -r || py > H + r) continue;
      psmoke(px, py, r, o.col || '#9A7A62', .22 * fade * gust * k);
    }
  }
  // sparks thrown from a screen point at a blow, tr seconds after it
  function sparks(px, py, tr, sc = 1, o = {}) {
    if (tr < 0 || tr > .45) return;
    seed('Fsp' + (o.key || ''));
    const n = o.n ?? 16, a0 = o.dir ?? -Math.PI / 2, spread = o.spread ?? 2.4, gv = 900 * sc;
    for (let i = 0; i < n; i++) {
      const a = a0 + (hash(i * 3.1 + (o.key2 || 0)) - .5) * spread, v = (220 + hash(i * 7.7) * 520) * sc, life = .18 + hash(i * 1.3) * .27;
      if (tr > life) continue;
      const at = k => [px + Math.cos(a) * v * k, py + Math.sin(a) * v * k + gv * k * k];
      pline([at(Math.max(0, tr - (o.tail ?? .035))), at(tr)], (o.w ?? 1.1) * sc + .4, o.col || '#FFD27A', { over: 0, passes: 1, alpha: 1 - tr / life, j: .3 });
    }
    if (o.glow !== false) pglow(px, py, 160 * sc, '#FF9A40', Math.exp(-tr * 14));
  }

  // ---------- the rod string, a real moving thing (the rig's own rod is a stretched stand-in) ----------
  // Group origin = the top of the string (the clamp under the temper screw, or the hoisting hook); it hangs down -y.
  // Pieces: upper coupling, pole A (down to the break), pole B (break down to the lower coupling), lower coupling,
  // pole C on down the hole. A split (splinters) shows at the break when it goes.
  const BRK = 3.2, CLO = 18.4;                                       // break and next joint, ft below the top (poles are 16-20 ft)
  function coupling(g, y, up) {
    const c = new THREE.Group(); c.position.y = y; g.add(c);
    c.add(P3.mesh(P3.cyl(.3, .3, .55, 12), IRON)); const pin = P3.mesh(P3.cyl(.22, .26, .4, 12), IRON_LT); pin.position.y = -.45; c.add(pin);
    for (const s of [-1, 1]) { const st = P3.mesh(P3.box(.07, 1.5, .26), IRON); st.position.set(s * .23, up * .95, 0); c.add(st); }
    for (const yy of [.5, 1.25]) { const b = P3.mesh(P3.cyl(.05, .05, .62, 6).rotateZ(Math.PI / 2), IRON_LT); b.position.set(0, up * yy, 0); c.add(b); }
    return c;
  }
  function rodString() {
    const g = new THREE.Group(), pole = (a, b) => { const m = P3.mesh(P3.cyl(.2, .2, a - b, 10), PINE); m.position.y = (a + b) / 2; g.add(m); return m; };
    const cUp = coupling(g, -.5, -1), A = pole(-.95, -BRK), B = pole(-BRK, -CLO + .45), cLo = coupling(g, -CLO, 1), C = pole(-CLO - .45, -52);
    const splA = new THREE.Group(), splB = new THREE.Group(); g.add(splA); g.add(splB);
    for (const [sg, dir] of [[splA, -1], [splB, 1]]) for (let i = 0; i < 8; i++) {
      const s = P3.mesh(new THREE.ConeGeometry(.05 + hash(i * 5 + dir) * .04, .45 + hash(i * 3 + dir) * .55, 4), '#E6C47A');
      const a = i / 8 * TAU + dir; s.position.set(Math.cos(a) * .12, dir * .2, Math.sin(a) * .12); if (dir > 0) s.rotation.x = Math.PI; s.userData.a = a; sg.add(s);
    }
    splA.visible = splB.visible = false;
    // the repair (hidden until F9): straps either side of the break, bolted, and the fencing-wire binding below them
    const rep = new THREE.Group(); rep.position.y = -BRK; g.add(rep);
    // three straps round the pole (they "partially encircle the rod"), each with bolt heads, so the mend reads from any side
    for (let i = 0; i < 3; i++) { const a = i / 3 * TAU, st = P3.mesh(P3.box(.1, 2.1, .3), '#2E2C2A'); st.position.set(Math.cos(a) * .24, 0, Math.sin(a) * .24); st.rotation.y = -a; rep.add(st);
      for (const yy of [-.7, 0, .7]) { const n = P3.mesh(P3.box(.1, .15, .15), IRON_LT); n.position.set(Math.cos(a) * .31, yy, Math.sin(a) * .31); n.rotation.y = -a; rep.add(n); } }
    for (let i = 0; i < 7; i++) { const w = P3.mesh(new THREE.TorusGeometry(.215, .03, 4, 16).rotateX(Math.PI / 2), '#B8B4AC', { cast: false }); w.position.y = -1.2 - i * .12; w.rotation.z = .1; rep.add(w); }
    const tw = P3.mesh(P3.cyl(.035, .025, .3, 5).rotateZ(Math.PI / 2), '#B8B4AC'); tw.position.set(.33, -1.55, 0); rep.add(tw);
    rep.visible = false;
    g.userData = { cUp, A, B, cLo, C, splA, splB, rep };
    return g;
  }
  // pose: top (world y), turn (about y), and o.snap: { gap (ft the lower part has dropped), tilt (rad of the upper
  // piece swinging on the hook), kink (bend at the break before it goes, rad) }
  function poseRods(g, top, o = {}) {
    const u = g.userData, sn = o.snap;
    g.position.set(o.x || 0, top, o.z || 0); g.rotation.set(0, o.turn || 0, 0);
    for (const k of ['cUp', 'A', 'B', 'cLo', 'C', 'splA', 'splB']) { u[k].rotation.set(0, 0, 0); }
    u.cUp.position.set(0, -.5, 0); u.A.position.set(0, (-.95 - BRK) / 2, 0);
    u.B.position.set(0, (-BRK - CLO + .45) / 2, 0); u.cLo.position.set(0, -CLO, 0); u.C.position.set(0, (-CLO - .45 - 52) / 2, 0);
    u.splA.visible = u.splB.visible = false; u.rep.visible = !!o.repaired;
    if (!sn) return;
    // the bend: the lower part leans from the break (it is the string below that bends under the pull)
    const kink = sn.kink || 0, gap = sn.gap || 0, tilt = sn.tilt || 0;
    const lower = [u.B, u.cLo, u.C, u.splB];
    for (const m of lower) { const p = m.position.clone(); p.y += BRK; p.applyAxisAngle(new THREE.Vector3(0, 0, 1), kink); p.y -= BRK + gap; m.position.copy(p); m.rotation.z = kink; }
    const upper = [u.A, u.cUp, u.splA];
    for (const m of upper) { const p = m.position.clone(); p.applyAxisAngle(new THREE.Vector3(0, 0, 1), tilt); m.position.copy(p); m.rotation.z = tilt; }
    u.splA.position.copy(new THREE.Vector3(0, -BRK, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), tilt));
    u.splB.position.set(0, -BRK - gap, 0);
    u.splA.visible = u.splB.visible = !!sn.broken;
    if (sn.broken) { const sp = sn.splay ?? 1; for (const sg of [u.splA, u.splB]) sg.children.forEach(s => { s.rotation.x = (s.rotation.x > 1 ? Math.PI : 0) + Math.cos(s.userData.a) * .45 * sp; s.rotation.z = -Math.sin(s.userData.a) * .45 * sp; }); }
  }

  // ---------- the site at storm dusk ----------
  const BX = -15, BZ = 15.5;                                         // the splice bench, just out of the forge shed toward the derrick
  const SHIRT = { dresser: '#CFC2A6', driller: '#7A6048', bill: '#96342A', boss: '#D8CCB2', hand: '#627080', lab: '#A67C4A' };
  const SITE = () => P3.cached('F-site', () => {
    const o = P3.scene({ sunDir: SUN, sun: 2.3, fill: .45, shadowSize: 80 });
    o.sun.color.set('#FF9860'); o.fill.color.set('#B4AEC4'); o.fill.groundColor.set('#5E4638');
    const st = WORLD.site({ board: 4000, col: '#B08868', dead: .75 }); o.scene.add(st.group);
    const R = st.rig, U = R.userData; U.rodM.visible = false; U.jointM.visible = false;
    const rods = rodString(); o.scene.add(rods);
    // the hoisting line: from the draw drum up over the crown sheave and down to the hook over the hole (shown when hoisting)
    const rope = (c = '#3A322A', r = .07) => { const m = P3.mesh(P3.cyl(r, r, 1, 6), c, { cast: false }); o.scene.add(m); return m; };
    const lineUp = rope(), lineDown = rope(), hook = new THREE.Group(); o.scene.add(hook);
    const hk = P3.mesh(new THREE.TorusGeometry(.32, .08, 6, 14, Math.PI * 1.4), IRON); hk.rotation.z = -.3; hk.position.y = .1; hook.add(hk);
    const blk = P3.mesh(P3.box(.5, .9, .35), IRON); blk.position.y = .8; hook.add(blk);
    const cast = {}; for (const n of ['driller', 'dresser', 'bill', 'hand', 'lab', 'boss']) { cast[n] = PEOPLE.make(n, { shirt: SHIRT[n] }); o.scene.add(cast[n].root); }
    const eyes = cast.driller.root.getObjectByName('Eyes');
    // lights: the firebox, the forge, and a hurricane lantern (hung on the derrick's front-right leg unless a shot stands it
    // on the planks; the same light doubles as the glow off hot iron at the anvil)
    const fire = P3.lamp(o, [46, 4, 11.5], '#FF7A2E', 700, 45), forge = P3.lamp(o, [-29, 4.4, 7.6], '#FF8A3A', 600, 40);
    const lant = PROPS.lantern(1); o.scene.add(lant); PROPS.at(lant, [6.9, 7.8, 6.7]);
    const lamp = P3.lamp(o, PROPS.glassAt(lant), '#FFB45A', 260, 30, true);
    // the forge work: sledge, smith's tongs, the strap iron (hot, then cold on the pole)
    const sledge = PROPS.sledge(); o.scene.add(sledge);
    const tongs = new THREE.Group(); o.scene.add(tongs);
    for (const sd of [-1, 1]) { const r = P3.beam([sd * .03, 0, 0], [sd * .07, 1.7, 0], .06, .06, IRON); tongs.add(r); const j = P3.beam([sd * .07, 1.7, 0], [sd * .02, 2.05, 0], .08, .1, IRON); tongs.add(j); }
    const strap = P3.mesh(P3.box(2.1, .1, .34), '#F4A44E', { style: .6 }); o.scene.add(strap);
    const hammer = PROPS.hammer(); o.scene.add(hammer);
    // the splice bench: the broken pole on two trestles outside the shed; straps, bolts, a split bound with fencing wire
    const bench = new THREE.Group(); bench.position.set(BX, 0, BZ); o.scene.add(bench);
    for (const x of [-3.2, 3.0]) {
      const tr = new THREE.Group(); tr.position.x = x; bench.add(tr);
      tr.add(P3.beam([0, 2.75, -.9], [0, 2.75, .9], .3, .3, '#7A5A40'));
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) tr.add(P3.beam([0, 2.7, sz * .6], [sx * .7, 0, sz * .9], .16, .16, '#6E5238'));
    }
    const pieceA = P3.mesh(P3.cyl(.2, .2, 4.4, 10).rotateZ(Math.PI / 2), PINE); pieceA.position.set(-2.2, 3.1, 0); bench.add(pieceA);
    const pieceB = P3.mesh(P3.cyl(.2, .2, 4.6, 10).rotateZ(Math.PI / 2), PINE); pieceB.position.set(2.3, 3.1, 0); bench.add(pieceB);
    for (let i = 0; i < 7; i++) { const sp = P3.mesh(new THREE.ConeGeometry(.04, .3 + hash(i) * .25, 4).rotateZ(-Math.PI / 2), '#E6C47A'); sp.position.set(.05, 3.1 + Math.sin(i * 2.1) * .12, Math.cos(i * 2.1) * .12); sp.rotation.x = i; bench.add(sp); }
    const strapT = P3.mesh(P3.box(2.1, .09, .3), IRON), strapB = P3.mesh(P3.box(2.1, .09, .3), IRON); strapT.position.set(0, 3.35, 0); strapB.position.set(0, 2.85, 0); bench.add(strapT); bench.add(strapB);
    const bolts = [-.7, 0, .7].map(x => { const b = new THREE.Group(); b.position.set(x, 3.4, 0); bench.add(b); const sh = P3.mesh(P3.cyl(.05, .05, .7, 6), IRON_LT); sh.position.y = -.3; b.add(sh); const hd = P3.mesh(P3.cyl(.1, .1, .07, 8), IRON); hd.position.y = .05; b.add(hd); return b; });
    const split = P3.mesh(P3.box(1.5, .02, .06), '#2A2016', { cast: false }); split.position.set(2.0, 3.3, .02); bench.add(split);
    const turns = []; for (let i = 0; i < 6; i++) { const w = P3.mesh(new THREE.TorusGeometry(.215, .022, 4, 16).rotateY(Math.PI / 2), '#8A8680', { cast: false }); w.position.set(1.45 + i * .16, 3.1, 0); w.rotation.x = .25; bench.add(w); turns.push(w); }
    const twist = P3.mesh(P3.cyl(.03, .02, .32, 5), '#8A8680'); twist.position.set(1.85, 3.43, 0); bench.add(twist);
    const coil = PROPS.wire(); coil.position.set(3.6, .12, 1.2); coil.rotation.set(0, .4, 0); bench.add(coil);
    const pliers = PROPS.pliers(); o.scene.add(pliers);
    const log = PROPS.log(3.0, .3); o.scene.add(log);                 // a split gidgee log for the firebox
    // the capstan: two long bars crossed through a clamp on the string, for turning it by main force
    const cap = new THREE.Group(); o.scene.add(cap);
    cap.add(P3.mesh(P3.box(1.1, .5, 1.1), IRON));
    for (const a of [0, Math.PI / 2]) { const b = P3.mesh(P3.box(9.4, .28, .28), '#8A6A48'); b.rotation.y = a; cap.add(b); }
    const benchP = { pieceA, pieceB, strapT, strapB, bolts, split, turns, twist, coil };
    return { o, st, R, U, rods, cast, eyes, fire, forge, lamp, lant, lineUp, lineDown, hook, sledge, tongs, strap, hammer, bench, benchP, pliers, cap, log, cam: P3.cam(30) };
  });
  // every frame: which of the crew are in this shot (the rest are hidden), and the lights' strengths
  function crew(S, on, props = []) {
    for (const [n, p] of Object.entries(S.cast)) p.root.visible = on.includes(n);
    eyesShut(S, 0);                                                  // eyes open unless the shot closes them after this
    for (const k of ['sledge', 'tongs', 'strap', 'hammer', 'pliers', 'bench', 'cap', 'log']) S[k].visible = props.includes(k);
  }
  function lights(S, o = {}) {
    const f = o.fire ?? 700, g = o.forge ?? 600;
    S.fire.position.set(...(o.firePos || [46, 4, 11.5]));
    S.fire.intensity = f; S.fire.visible = f > 0; S.fire.castShadow = !!o.fireShadow;
    S.forge.intensity = g; S.forge.visible = g > 0; S.forge.castShadow = !!o.forgeShadow;
    lantern(S, o.lant || [6.9, 6.75, 6.7], o.lamp ?? 0);
  }
  // the hurricane lantern: stood on the planks (or hung) at p = the point under its base; k = light
  function lantern(S, p, k = 300) { S.lant.visible = true; PROPS.at(S.lant, [p[0], p[1] + 1.05, p[2]]); const g = PROPS.glassAt(S.lant); S.lamp.position.set(g[0], g[1] + .1, g[2]); S.lamp.intensity = k; S.lamp.visible = k > 0; }
  // the same light used as the glow off hot iron (the lantern itself hidden)
  function ironGlow(S, p, k) { S.lant.visible = false; S.lamp.position.set(...p); S.lamp.intensity = k; S.lamp.visible = k > 0; }
  function eyesShut(S, k) { const m = S.eyes.material, c = mixCol('#2A2320', '#A8745A', k); m.color.set(c); m.userData.albedo.set(c); }
  // the plant drilling: poses the rig and the rod string for time t; returns { st, lift, top }
  function work(S, t, o = {}) {
    const st0 = RIG.strokeAt(t), amp = o.amp ?? 1, l = clamp(liftOf(st0) + (o.bounce ? rebound(t, o.bounce) : 0));
    const st = st0 < .75 ? strokeFor(l) : st0, turn = o.turn ?? Math.floor(bpOf(t) / 2) * .35;
    RIG.pose(S.R, { stroke: st, amp, fly: t * 6.2, bull: o.bull || 0, reel: o.reel || 0, turn });
    const U = S.U, top = U.temper.position.y - 5.6;
    U.tiller.position.y = top - (o.tiller ?? 3.0);
    poseRods(S.rods, top, { turn, snap: o.snap, repaired: o.repaired });
    return { st, lift: liftOf(st) * amp, top };
  }
  function span(m, a, b) {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), L = A.distanceTo(B);
    m.position.copy(A).add(B).multiplyScalar(.5); m.scale.set(1, L, 1); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.sub(A).normalize()); m.visible = true;
  }
  // the hoisting line from the draw drum over the crown to the hook at `hk` (null hides it)
  function hoist(S, hk) {
    const vis = !!hk; S.lineUp.visible = S.lineDown.visible = S.hook.visible = vis; if (!vis) return;
    const crown = [0, S.U.H + 1.6, 0];
    span(S.lineUp, [6, 5.6, -12], [.3, crown[1], -.2]); span(S.lineDown, [0, crown[1] - .3, 0], [hk[0], hk[1] + 1.25, hk[2]]);
    S.hook.position.set(...hk); S.hook.rotation.set(0, .4, 0);
  }
  function drawSite(S, t, o = {}) {
    P3.draw(S.o, S.cam, { fog: o.fog || [140, 1400], fogCol: o.fogCol || '#6A5664', lightTint: o.tint ?? .7, lineW: o.lineW ?? 1.5, near: o.near ?? .5, far: o.far ?? 6000, ink: '#2A2226', hatch: o.hatch, tone: o.tone });
  }
  function stackSmoke(S, t) {
    const U = S.U;
    for (let i = 0; i < 7; i++) {
      const k = frac(t * .55 + i / 7), p = [U.stackTop[0] + WIND[0] * k * 60, U.stackTop[1] + k * 14, U.stackTop[2] + WIND[2] * k * 60];
      const [sx, sy, d] = P3.project(S.cam, p); if (d < 1) continue;
      psmoke(sx, sy, (3 + k * 14) * 900 / d, '#3E3640', .55 * (1 - k));
    }
  }
  const glowAt = (S, p, r, col, a) => { const [x, y, d] = P3.project(S.cam, p); if (d > 0) pglow(x, y, r * 60 / Math.max(1, d), col, a); };

  // =====================================================================================================
  // F1 188.97 [45] "But it must be down beneath us": the driller kneels on the floor with her palm on the rods, eyes
  // closed, feeling each blow come up through the wood; she tips her head to listen harder. Low, in profile against the
  // red slit of the sunset; a slow push-in. Out through a hatching iris closing on her hand.
  function f1(t, lt, dur) {
    const S = SITE(), { driller } = S.cast, U = S.U;
    crew(S, ['driller']); lights(S, { fire: 0, forge: 0 }); hoist(S, null);
    const w = work(S, t, { amp: .55 });
    PEOPLE.at(driller, [-1.55, U.floorY, -.45], 2.83);
    PEOPLE.clip(driller, 'Fixing_Kneeling', 2.5 + Math.sin(t * .8) * .06);
    PEOPLE.turn(driller, 'spine_01', [-.22, 0, 0]); PEOPLE.turn(driller, 'spine_02', [-.22, 0, 0]); PEOPLE.turn(driller, 'spine_03', [-.12, .1, 0]);
    const cock = ease(seg(t, 190.7, 191.5));                        // she tips her head toward the string, listening harder
    PEOPLE.turn(driller, 'neck_01', [-.15 + .12 * cock, .15 + .12 * cock, .1 * cock]); PEOPLE.turn(driller, 'Head', [-.05 + .1 * cock, .1, .12 * cock]);
    const rodY = w.top - 4.1, kn = PEOPLE.bone(driller, 'calf_l'), kp = new THREE.Vector3(); kn.getWorldPosition(kp);
    PEOPLE.reach(driller, 'r', [-.34, rodY, -.05], [-.7, rodY - 1.5, -1.2]);
    lantern(S, [-.75, U.floorY, -2.3], 300);
    PEOPLE.reach(driller, 'l', [kp.x - .1, kp.y + .45, kp.z - .1], [kp.x - 1.2, kp.y + 1.2, kp.z + .3]);
    eyesShut(S, 1);
    const k = ease(seg(lt, 0, dur));
    P3.look(S.cam, [lerp(5.3, 4.5, k), lerp(3.3, 3.5, k), lerp(-4.6, -3.9, k)], [lerp(-1.0, -1.1, k), lerp(4.35, 4.55, k), lerp(-.3, -.3, k)]);
    S.cam.fov = lerp(38, 32, k); S.cam.updateProjectionMatrix();
    stormSky(S.cam, t);
    dust(S.cam, t, { c: [0, 2.2, 0], r: 70, split: 12 });
    drawSite(S, t, { near: .3 });
    glowAt(S, PROPS.glassAt(S.lant), 12, '#FFB45A', .7);
    dust(S.cam, t, { c: [0, 2.2, 0], r: 70, split: 12, near: true });
    const hit = Math.exp(-sinceBlow(t) * 10), [hx, hy] = P3.project(S.cam, [0, U.floorY + 1.7, 0]);
    if (hit > .05) psmoke(hx, hy, 40 + 90 * hit, '#8E7662', .45 * hit);
    if (lt < .35) scribbleWipe(.5 + lt / .7);
    if (lt > dur - .45) { const hp = PEOPLE.hand(driller, 'r'), [ix, iy] = P3.project(S.cam, [hp.x, hp.y, hp.z]); hatchIris((lt - (dur - .45)) / .9, ix, iy); }
  }
  // ---------- the section: the last of the hard rock, the iron band, and the water under it ----------
  // Chapter-local additions to WORLD.section: an ironstone band 4004–4020 ft (the last barrier: "desert sandstone lined
  // with iron bands"), the tool string's jars and sinker bar over the bit, a crack network under the bit that grows with
  // each blow and fills with blue when it breaks, and the water welling up the bore.
  const IRON_TOP = 4004, AQ = 4020;
  const SEC = () => P3.cached('F-sec', () => {
    const o = P3.scene({ sunDir: [-50, 70, 90], sun: 1.9, fill: .6, shadowSize: 60 });
    o.sun.target.position.set(0, -400, 0); o.sun.position.set(-50, -330, 90); o.fill.color.set('#D8D2C8'); o.fill.groundColor.set('#5A4A40');
    const S = WORLD.section({ bottom: 4400 }); o.scene.add(S); const y = S.userData.y;
    S.userData.slot.position.z = -.62;                             // the slot becomes the dark back wall of the bore, so the string shows in front of it
    const recol = (m, c) => { m.material.color.set(c); m.material.userData.albedo.set(c); };
    recol(S.userData.slot, '#2A2420'); recol(S.userData.casing, '#8A8680'); S.userData.bit.visible = false;
    const add = (m, p) => { m.position.set(...p); o.scene.add(m); return m; };
    // the ironstone band: rust bands in pale hard sandstone, proud of the grey rock face
    const ih = (AQ - IRON_TOP) * .1, band = add(P3.mesh(P3.box(160, ih, 50.2), '#8C6A50'), [0, y(IRON_TOP) - ih / 2, -25]);
    for (const [d, th, col] of [[4006, .35, '#6E3A26'], [4011, .5, '#7A4028'], [4016.5, .3, '#6E3A26']])
      for (let k = 0; k < 4; k++) add(P3.mesh(P3.box(41, th, .3), col, { cast: false }), [-60 + k * 40, y(d) + (hash(d + k) - .5) * .25, .12]);
    // jars and sinker bar above the bit (exaggerated in width like the rest of the diagram's bore)
    const tools = new THREE.Group(); o.scene.add(tools);
    // the chisel: a round shank, a flared flat blade, a bright dressed edge
    const shank = P3.mesh(P3.cyl(.42, .42, 1.9, 10), '#8E8C88'); shank.position.y = 2.25; tools.add(shank);
    const blade = P3.mesh(new THREE.CylinderGeometry(.62, 1.05, 1.3, 4, 1).rotateY(Math.PI / 4), '#A6A49E'); blade.scale.set(1, 1, .34); blade.position.y = .65 + .05; tools.add(blade);
    const edge = P3.mesh(P3.box(1.45, .12, .3), '#D8D6D0'); edge.position.y = .06; tools.add(edge);
    const sinker = P3.mesh(P3.cyl(.46, .46, 4.2, 12), '#8E8C88'); sinker.position.y = 2.1 + 3.2; tools.add(sinker);
    for (const yy of [3.3, 7.3]) { const col = P3.mesh(P3.cyl(.55, .55, .35, 12), '#6E6C68'); col.position.y = yy; tools.add(col); }
    for (const [yy, zz] of [[8.3, 0], [9.8, .01]]) { const link = P3.mesh(new THREE.TorusGeometry(.75, .17, 6, 18), '#7C7A76'); link.scale.set(.55, 1.4, .6); link.position.set(0, yy, zz); tools.add(link); }
    tools.position.z = .75;
    // the crack network in the iron band under the bit: segments { a, b (x units, depth ft below the impact), born 0..1 }.
    // Jagged runs out sideways through the band, with branches; a few go down to the sandstone (born late: the break).
    const cracks = [], rnd = i => hash(i * 7.31 + 3);
    const run = (x, d, dir, n, born, id, slope) => {
      for (let i = 0; i < n; i++) {
        const len = .35 + rnd(id * 13 + i) * .5, x2 = x + dir * len, d2 = clamp(d + (slope + (rnd(id * 7 + i) - .5) * 1.6) * len * 2.2, -1.2, 9);
        cracks.push({ a: [x, d], b: [x2, d2], born: born + i * .07, id });
        if (rnd(id * 3 + i) < .35) { const bx = x2 + dir * .3, bd = clamp(d2 + (rnd(id + i * 5) < .5 ? -1 : 1) * (1 + rnd(i) * 1.5), -1.2, 9); cracks.push({ a: [x2, d2], b: [bx, bd], born: born + i * .07 + .05, id: id + 100 }); }
        x = x2; d = d2;
      }
    };
    // they start at the bore walls (x = ±1.3), so none crosses the tools in the hole
    run(-1.3, .2, -1, 6, 0, 1, .15); run(1.3, .2, 1, 6, .04, 2, .1); run(-1.3, .6, -1, 4, .18, 3, .6); run(1.3, .5, 1, 5, .2, 4, .5);
    run(-1.3, 1.0, -1, 3, .5, 5, 1.6); run(1.3, 1.1, 1, 3, .52, 6, 1.7); run(-1.3, 2.2, -1, 4, .62, 8, .9); run(1.3, 2.0, 1, 4, .64, 9, 1.0);
    const crackG = new THREE.Group(), wetG = new THREE.Group(); o.scene.add(crackG); o.scene.add(wetG);
    for (const c of cracks) {
      const m = P3.mesh(P3.box(.17, 1, .06), '#120E0C', { cast: false }); c.m = m; crackG.add(m);
      const w = P3.mesh(P3.box(.09, 1, .05), '#8CD0F0', { cast: false, style: .6 }); c.w = w; wetG.add(w);
    }
    // water welling into the bore at the bottom, and a blue seep in the slot
    const pool = P3.mesh(P3.box(2.6, 1, .1), '#5C9CC4', { style: .5, cast: false }); pool.position.z = .07; o.scene.add(pool);
    return { o, S, y, tools, cracks, pool, cam: P3.cam(30) };
  });
  // pose the section: depth (ft) of the bit's cutting edge, stroke, amp; crack 0..1 (growth, measured from the bottom of
  // the bore at depth `at`), wet 0..1 (water in the cracks), well (units the water has risen above the bit's tip)
  function poseSec(Z, depth, st, o = {}) {
    const U = Z.S.userData, amp = o.amp ?? .6;
    U.set(depth, st, { amp, casing: Math.min(3900, depth - 40), flow: 0 });   // open hole below the casing shoe
    const bot = U.bit.position.y - 1.6;                           // the bit's cutting edge
    U.slot.scale.y = (depth + 4) / 4400; U.slot.position.y = -(depth + 4) * .05;      // the bore ends where the bit is
    U.rods.scale.y = 8.8 - (bot + 10.6); U.rods.position.y = (bot + 10.6 + 8.8) / 2;   // the rods end at the jars (world.js runs them through the bit)
    Z.tools.position.set(0, bot, .32); U.rods.position.z = .32;     // the string rides in the bore, just in front of the water
    const at = o.at ?? depth, cr = o.crack || 0, wet = o.wet || 0, y0 = Z.y(at);
    Z.crackState = { cr, wet, y0 };
    for (const c of Z.cracks) {
      const k = clamp((cr - c.born) / .22);
      c.m.visible = false; c.w.visible = false;
      if (!c.m.visible) continue;
      const ax = c.a[0], ay = y0 - c.a[1] * .1, bx = lerp(ax, c.b[0], k), by = lerp(ay, y0 - c.b[1] * .1, k), L = Math.hypot(bx - ax, by - ay) + .01;
      for (const [m, z, wmul] of [[c.m, .42, 1 + wet * 1.2], [c.w, .47, 1]]) {
        m.position.set((ax + bx) / 2, (ay + by) / 2, z); m.scale.set(wmul, L, 1); m.rotation.set(0, 0, Math.atan2(-(bx - ax), by - ay));
      }
    }
    const well = o.well || 0; Z.pool.visible = well > .02;
    if (well > .02) { const bot = Z.y(depth) - .45; Z.pool.scale.set(1, well, 1); Z.pool.position.y = bot + well / 2; }
  }
  // the cracks, drawn in pencil over the section face (projected): graphite runs that open, then a thread of blue in them
  function cracks2D(Z) {
    const { cr, wet, y0 } = Z.crackState || {}; if (!cr) return;
    seed('Fcrk');
    for (const c of Z.cracks) {
      const k = clamp((cr - c.born) / .22); if (k <= 0) continue;
      const P = d => P3.project(Z.cam, [d[0], y0 - d[1] * .1, .3]);
      const a = P(c.a), bEnd = [lerp(c.a[0], c.b[0], k), lerp(c.a[1], c.b[1], k)], b = P(bEnd), mid = P([(c.a[0] + bEnd[0]) / 2 + (hash(c.id + c.born * 9) - .5) * .12, (c.a[1] + bEnd[1]) / 2 + (hash(c.id * 3 + c.born) - .5) * .6]);
      const w = 2.2 + wet * 1.6 + (c.id < 100 ? 1 : 0);
      pline([[a[0], a[1]], [mid[0], mid[1]], [b[0], b[1]]], w, '#16100C', { over: 0, passes: 2, j: .5 });
      if (wet > c.born * .6) pline([[a[0], a[1]], [mid[0], mid[1]], [b[0], b[1]]], w * .32, '#4EAEE6', { over: 0, passes: 1, j: .3, alpha: clamp(wet * 1.5) });
    }
  }
  const drawSec = (Z, o = {}) => P3.draw(Z.o, Z.cam, { fog: o.fog || [60, 420], fogCol: '#3A302A', lightTint: .4, lineW: o.lineW ?? 1.7, near: 1, far: 3000, ink: '#241E1A', hatch: o.hatch ?? 1.1 });
  function underground() { X.save(); X.fillStyle = '#3A302A'; X.fillRect(0, 0, W, H); X.restore(); seed('Fund'); pshade(rectPts(-40, -40, W + 80, H + 80), '#1E1814', .6, { still: true }); }
  // the depth ruler on the face of the section: a staff with ticks every 5 ft and the depth lettered every 20 ft on
  // its left (screen-space pencil, so it stays legible at any distance); o.hi = a depth to letter large
  function ruler3(Z, x, d0, d1, o = {}) {
    seed('Fruler');
    const P = d => P3.project(Z.cam, [x, Z.y(d), .6]), step = o.step || 5, every = o.every || 20;
    const [ax, ay] = P(d0), [bx, by] = P(d1);
    pline([[ax, ay], [bx, by]], 2.2, '#1C1814', { over: 0, passes: 1, alpha: .8 }); pline([[ax - 2, ay], [bx - 2, by]], 1.4, '#EDE3CC', { over: 0, passes: 1 });
    for (let d = Math.ceil(d0 / step) * step; d <= d1; d += step) {
      const big = d % every === 0, [px, py] = P(d), [qx, qy] = P3.project(Z.cam, [x - (big ? 1.6 : .7), Z.y(d), .6]);
      if (py < -60 || py > H + 60) continue;
      pline([[px, py], [qx, qy]], big ? 1.8 : 1, '#EDE3CC', { over: 0, passes: 1 });
      if (big) { const sz = d === o.hi ? (o.size || 46) * 1.35 : (o.size || 46); label(`${d} FT`, qx - 12 + 2, qy + 2, sz, '#1C1814', { align: 'right', alpha: .75 }); label(`${d} FT`, qx - 12, qy, sz, '#F2EAD8', { align: 'right', alpha: .98 }); }
    }
  }
  // F2 192.33 [45] "so it's down we've got to go": the bit pounding the hard grey rock at 3,600 ft; the camera cranes
  // down the face of the section, past the ruler's hundreds, through four hundred feet of rock to the faint blue of the
  // water-bearing sandstone under the iron band. The crew can't see it; we can.
  function f2(t, lt, dur) {
    const Z = SEC(), st = RIG.strokeAt(t), dep = 3600;
    poseSec(Z, dep, st, { amp: .5 });
    const k = ease(seg(lt, .25, dur - .1)), yb = Z.y(dep), ya = Z.y(AQ);
    P3.look(Z.cam, [lerp(9, 15, k), lerp(yb + 3.2, ya + 9, k), lerp(11, 21, k)], [lerp(-.4, -1.2, k), lerp(yb + 1.8, ya - 4, k), .6]);
    Z.cam.fov = lerp(40, 46, k); Z.cam.updateProjectionMatrix();
    underground(); drawSec(Z);
    ruler3(Z, -7.5, 3560, 4080, { step: 20, every: 100, size: 42 });
    const [bx, by] = P3.project(Z.cam, [0, Z.S.userData.bit.position.y - 1.6, .8]), tr = sinceBlow(t);
    if (by > -40 && by < H + 40) { sparks(bx, by, tr, .5, { key: 'f2', n: 10 }); if (tr < .3) psmoke(bx, by, 40 + 80 * tr, '#6E6660', .5 * (1 - tr / .3)); }
    // the water below catches the light: a slow cold shimmer
    const [wx, wy] = P3.project(Z.cam, [0, Z.y(AQ + 50), 1]); pglow(wx, wy, 620, '#5AA0C8', (.18 + .06 * Math.sin(t * 2.2)) * k);
    if (lt < .45) hatchIris(.5 + lt / .9, bx, by);
  }
  // F3 195.533 [46] "bumping on the solid rock four thousand feet below": close on the bit at 4,004 ft on the iron band.
  // It strikes and bounces; sparks and chips; the ruler reads 4000.
  function f3(t, lt, dur) {
    const Z = SEC(), st0 = RIG.strokeAt(t), l = clamp(liftOf(st0) + rebound(t, .3)), st = st0 < .75 ? strokeFor(l) : st0, dep = IRON_TOP;
    poseSec(Z, dep, st, { amp: .45, crack: .05, at: dep });
    const k = ease(seg(lt, 0, dur)), yb = Z.y(dep);
    P3.look(Z.cam, [lerp(7.2, 6.2, k), lerp(yb - .6, yb - .9, k), lerp(9.5, 8.2, k)], [lerp(-.6, -.5, k), lerp(yb + 1.6, yb + 1.5, k), .6]);
    Z.cam.fov = 40; Z.cam.updateProjectionMatrix();
    underground(); drawSec(Z, { lineW: 2, fog: [30, 200] }); cracks2D(Z);
    ruler3(Z, -6.2, 3960, 4040, { hi: 4000 });
    const [bx, by] = P3.project(Z.cam, [0, Z.y(dep) + .1, .8]), tr = sinceBlow(t);
    sparks(bx, by, tr, 1.1, { key: 'f3', n: 22, spread: 2.8 });
    if (tr < .35) { psmoke(bx, by - 20, 60 + 180 * tr, '#8A827A', .55 * (1 - tr / .35)); }
  }
  // F4 197.669 [46] "four thousand feet below": cut on the blow to the surface, where the string jumps on the rock.
  // Low inside the derrick: the driller's hands on the turning bar, the string hopping after every blow, the lattice
  // and the storm behind.
  function f4(t, lt, dur) {
    const S = SITE(), { driller } = S.cast, U = S.U;
    crew(S, ['driller']); lights(S, { fire: 0, forge: 0, lamp: 240, lant: [-3.2, U.floorY, -2.4] }); hoist(S, null);
    work(S, t, { amp: 1, bounce: .5, tiller: 4.3 });
    const jolt = Math.exp(-sinceBlow(t) * 9);
    PEOPLE.at(driller, [2.2, U.floorY, 1.2], -2.05);
    PEOPLE.clip(driller, 'Idle_Loop', t * .7 + 1.1);
    PEOPLE.turn(driller, 'spine_02', [.12 + jolt * .06, 0, 0]); PEOPLE.turn(driller, 'Head', [.1 - jolt * .1, 0, 0]);
    const ty = U.tiller.position.y, rot = U.tiller.rotation.y, bar = s => [Math.cos(rot) * s, ty + .05, -Math.sin(rot) * s];
    PEOPLE.reach(driller, 'r', bar(1.5), [2.9, ty - 1.3, 2.4]); PEOPLE.reach(driller, 'l', bar(.62), [2.3, ty - 1.5, -.6]);
    const k = ease(seg(lt, 0, dur)), sh = shakeXY(t, jolt * .09);
    P3.look(S.cam, [lerp(.2, .4, k) + sh[0], lerp(3.5, 3.7, k) + sh[1], lerp(-7.4, -6.6, k)], [lerp(.7, .7, k), lerp(6.4, 6.5, k), lerp(.5, .5, k)]);
    S.cam.fov = lerp(52, 48, k); S.cam.updateProjectionMatrix();
    stormSky(S.cam, t);
    drawSite(S, t, { near: .3, lineW: 1.7 });
    const [hx, hy] = P3.project(S.cam, [0, U.floorY + 1.8, 0]);
    if (jolt > .05) psmoke(hx, hy, 50 + 120 * jolt, '#8E7662', .5 * jolt);
    dust(S.cam, t, { c: [0, 2.2, 0], r: 60, near: true, split: 10 });
  }
  // F5 199.19 [47] "So we'll hammer, splice, and bully every snapping rod": drawing up the string after the rock has
  // bent a rod; the bent pole comes out of the casing and snaps. The upper piece swings on the hook; the rest drops back
  // down the hole. Low at the bore mouth, looking up the rising string to the hoisting line.
  const SNAP = bt(372);                                             // 199.805: on the beat
  function f5(t, lt, dur) {
    const S = SITE(), { driller, lab } = S.cast, U = S.U;
    crew(S, ['driller', 'lab']); lights(S, { fire: 0, forge: 0, lamp: 240, lant: [-3.2, U.floorY, -2.4] });
    RIG.pose(S.R, { stroke: .08, amp: .4, fly: 1.3 + (t - 199) * .6, turn: 0 });   // beam unhooked and still; the engine idles
    const ts = t - SNAP, up = t < SNAP ? 8.1 + (t - 199.19) * 1.9 : 8.1 + (SNAP - 199.19) * 1.9 + (ts < .12 ? ts / .12 * .9 : .9 + spring(t, SNAP + .12, 3, 9) * .4);
    const kink = t < SNAP ? lerp(.08, .2, easeIn(seg(t, 199.19, SNAP))) : .2, broken = t >= SNAP;
    const gap = broken ? Math.min(12, 16 * ts * ts + (up - (8.1 + (SNAP - 199.19) * 1.9))) : 0;
    const tilt = broken ? .32 * spring(t, SNAP, 2.2, 5.5) + .12 * (1 - Math.exp(-ts * 3)) : 0;
    poseRods(S.rods, up, { snap: { kink: broken ? kink * Math.exp(-ts * 4) : kink, gap, tilt, broken, splay: broken ? 1 : 0 } });
    hoist(S, [0, up, 0]);
    U.tiller.visible = false; U.temper.visible = true;
    // the driller guides the rising pole, the labourer stands by; both flinch from the snap
    const fl = broken ? easeOut(clamp(ts / .25)) : 0;
    PEOPLE.at(driller, [-1.7 - fl * .5, U.floorY, 1.2 + fl * .3], 2.2);
    PEOPLE.clip(driller, 'Idle_Loop', t * .8 + 2);
    if (!broken) { PEOPLE.reach(driller, 'r', [-.2, 5.4, .35], [-1.2, 4.2, 2.2]); PEOPLE.reach(driller, 'l', [-.25, 6.3, .1], [-1.6, 5.6, 1.4]); }
    else { PEOPLE.turn(driller, 'spine_02', [-.25 * fl, 0, 0]); PEOPLE.reach(driller, 'r', [-1.1 - fl * .4, 6.4 + fl * .6, .6], [-2.2, 5.4, 2]); PEOPLE.reach(driller, 'l', [-1.5 - fl * .4, 6.8 + fl * .4, .1], [-2.4, 5.6, -.4]); }
    PEOPLE.at(lab, [2.6 + fl * .5, U.floorY, 2.6 + fl * .3], -2.3);
    PEOPLE.clip(lab, 'Idle_Loop', t * .9 + .3);
    PEOPLE.turn(lab, 'spine_02', [.2 - fl * .35, 0, 0]); PEOPLE.turn(lab, 'Head', [-.1 * fl, .2 * fl, 0]);
    PEOPLE.reach(lab, 'r', [1.9 + fl * .5, 4.6 + fl * 1.4, 1.4], [3.2, 3.8, 3.2]);
    const k = ease(seg(lt, 0, dur)), sh = broken ? shakeXY(t, .12 * Math.exp(-ts * 5)) : [0, 0];
    P3.look(S.cam, [lerp(3.4, 3.0, k) + sh[0], lerp(3.1, 3.0, k) + sh[1], lerp(-5.6, -5.0, k)], [lerp(0, 0, k), lerp(5.3, 5.8, k), .2]);
    S.cam.fov = 46; S.cam.updateProjectionMatrix();
    stormSky(S.cam, t);
    drawSite(S, t, { near: .25, lineW: 1.8 });
    const [bx, by] = P3.project(S.cam, [0, up - BRK, 0]);
    if (broken && ts < .5) sparks(bx, by, ts, .8, { key: 'snap', n: 18, spread: 6.2, dir: 0, col: '#EAD7A8', glow: false, w: 1.8, tail: .06 });
    const [hx, hy] = P3.project(S.cam, [0, U.floorY + 1.8, 0]);
    if (broken && gap > 2) { const q = seg(ts, .3, 1.1); psmoke(hx, hy - 20, 60 + 200 * q, '#8E7662', .55 * (1 - q)); }
    U.tiller.visible = true;
  }
  // F6 200.873 [47] "hammer, splice": at the forge the dresser draws out an iron strap for the splice, the hand holding
  // it on the anvil with the tongs; the sledge lands on the beat; sparks. Low, outside the shed, into the forge glow.
  function f6(t, lt, dur) {
    const S = SITE(), { dresser, hand } = S.cast, U = S.U, an = U.anvil;
    crew(S, ['dresser', 'hand'], ['sledge', 'tongs', 'strap']); lights(S, { fire: 0, forge: 900, forgeShadow: true }); hoist(S, null);
    work(S, t, { amp: 1 });
    const tgt = [an[0] - .05, an[1] + .12, an[2]], yaw = Math.PI;
    // the strap on the anvil face, glowing, its end in the tongs
    S.strap.position.set(an[0] - .2, an[1] + .05, an[2]); S.strap.rotation.set(0, .06, 0); S.strap.material.color.set('#F4A44E'); S.strap.material.userData.albedo.set('#F4A44E');
    PEOPLE.at(dresser, PROPS.swingStand(dresser, tgt, yaw), yaw);
    PEOPLE.clip(dresser, 'Idle_Loop', t * .6);
    PROPS.swing(dresser, S.sledge, frac(bpOf(t) / 2 + 1e-6), { target: tgt, lead: 'r' });
    // the hand: at the far side of the anvil, tongs on the strap's end, braced
    PEOPLE.at(hand, [an[0] - 3.2, 0, an[2] + .5], Math.PI / 2 + .12);
    PEOPLE.clip(hand, 'Idle_Loop', t * .8 + 1.4);
    PEOPLE.turn(hand, 'spine_02', [.3, 0, 0]); PEOPLE.turn(hand, 'Head', [.22, 0, 0]);
    const jaw = [an[0] - 1.0, an[1] + .08, an[2] + .02], grip = [an[0] - 2.35, an[1] + .55, an[2] + .35];
    PEOPLE.reach(hand, 'r', grip, [an[0] - 2.9, an[1] - .6, an[2] - .9]); PEOPLE.reach(hand, 'l', [grip[0] - .25, grip[1] - .02, grip[2] + .1], [an[0] - 3.2, an[1] - .6, an[2] + 1.6]);
    PROPS.place(S.tongs, PEOPLE.hand(hand, 'r'), jaw);
    const k = ease(seg(lt, 0, dur));
    P3.look(S.cam, [lerp(-20.9, -21.3, k), lerp(3.75, 3.5, k), lerp(3.7, 4.6, k)], [lerp(-24.4, -24.4, k), lerp(5.2, 5.0, k), lerp(11, 11, k)]);   // clear of the shed's front post (-20, 5)
    S.cam.fov = lerp(46, 42, k); S.cam.updateProjectionMatrix();
    ironGlow(S, [an[0] - .2, an[1] + .6, an[2] + .4], 160);
    stormSky(S.cam, t);
    glowAt(S, U.forge, 70, '#FF7A30', .8);
    drawSite(S, t, { near: .4, tint: .85 });
    glowAt(S, U.forge, 26, '#FFB060', .55 + .1 * Math.sin(t * 13));
    const [sx, sy] = P3.project(S.cam, tgt), tr = sinceBlow(t);
    sparks(sx, sy, tr, 1.6, { key: 'forge', n: 30, spread: 3.4, dir: -Math.PI / 2 });
    const [gx, gy] = P3.project(S.cam, [an[0] + .1, an[1] + .1, an[2]]); pglow(gx, gy, 90, '#FF9A40', .5);
    dust(S.cam, t, { c: [-24, 0, 9], r: 40, near: true, split: 9, k: .7 });
    if (lt > dur - .35) pageTurn((lt - (dur - .35)) / .7, 1);          // the strap is done: turn the page to the splice
  }
  // a one-handed hammer stroke onto `hit` (world), the arm working from `pivot` (a point behind and above the blow):
  // the head lands on the beat every two beats. Returns { hand, head, strike }.
  function hammerStroke(p, prop, t, hit, pivot, side = 'r', pole) {
    const k = frac(bpOf(t) / 2 + 1e-6), H = new THREE.Vector3(...hit), P0 = new THREE.Vector3(...pivot);
    const toHit = H.clone().sub(P0), L = toHit.length(), dS = toHit.clone().normalize();
    const up = new THREE.Vector3(0, 1, 0), axis = new THREE.Vector3().crossVectors(dS, up).normalize();
    const lift = k < .12 ? easeOut(k / .12) * .35 : k < .62 ? lerp(.35, 1.9, ease((k - .12) / .5)) : k < .8 ? 1.9 + .05 * Math.sin((k - .62) / .18 * Math.PI) : lerp(1.9, 0, easeIn((k - .8) / .2));
    const piv = P0.clone().add(new THREE.Vector3(0, .35 * lift / 1.9, 0)), d = dS.clone().applyAxisAngle(axis, lift);
    const head = piv.clone().add(d.clone().multiplyScalar(L)), grip = piv.clone().add(d.clone().multiplyScalar(L - 1.0));
    PEOPLE.reach(p, side, grip.toArray(), pole);
    PROPS.place(prop, PEOPLE.hand(p, side), head);
    return { head, strike: k > .97 || k < .03 };
  }
  // F7 202.48 [47] "every snapping rod and bend": the splice. The labourer holds the two halves of the pole end to end on
  // the trestles; the dresser drives the bolts through the new straps with a hand hammer, on the beat. High, over the
  // labourer's shoulder.
  function f7(t, lt, dur) {
    const S = SITE(), { dresser, lab } = S.cast, U = S.U, B = S.benchP;
    crew(S, ['dresser', 'lab'], ['hammer']); lights(S, { fire: 0, forge: 700 }); hoist(S, null);
    work(S, t, { amp: 0 }); S.bench.visible = true;
    B.strapT.material.color.set(IRON); B.strapT.material.userData.albedo.set(IRON);
    B.turns.forEach(w => w.visible = false); B.twist.visible = false; B.split.visible = true;
    // bolts: the first is home, the second goes in over two blows, the third waits
    const nb = Math.floor(bpOf(t) / 2 + 1e-6) - Math.floor(bpOf(202.48) / 2);
    B.bolts.forEach((b, i) => { const h = i === 0 ? 0 : i === 1 ? clamp(.5 - nb * .22, 0, .5) : .5; b.position.y = 3.4 + h; b.visible = i < 2 || nb >= 2; });
    const hit = [BX + 0, 3.46 + B.bolts[1].position.y - 3.4, BZ];
    PEOPLE.at(dresser, [BX + .6, 0, BZ + 2.35], Math.PI + .12);
    PEOPLE.clip(dresser, 'Idle_Loop', t * .5 + .8);
    PEOPLE.turn(dresser, 'spine_02', [.42, 0, 0]); PEOPLE.turn(dresser, 'spine_03', [.2, 0, 0]); PEOPLE.turn(dresser, 'Head', [.25, 0, 0]);
    hammerStroke(dresser, S.hammer, t, hit, [BX + .25, 4.35, BZ + 1.15], 'r', [BX + 1.6, 3.6, BZ + 2.4]);
    PEOPLE.reach(dresser, 'l', [BX - .55, 3.42, BZ + .1], [BX - 1.2, 3.8, BZ + 1.8]);
    PEOPLE.at(lab, [BX - .4, 0, BZ - 2.1], .12);
    PEOPLE.clip(lab, 'Idle_Loop', t * .7 + 2.2);
    PEOPLE.turn(lab, 'spine_02', [.45, 0, 0]); PEOPLE.turn(lab, 'spine_03', [.2, 0, 0]); PEOPLE.turn(lab, 'Head', [.3, 0, 0]);
    PEOPLE.reach(lab, 'l', [BX - 1.5, 3.25, BZ - .22], [BX - 1.4, 2.4, BZ - 1.8]); PEOPLE.reach(lab, 'r', [BX + 1.3, 3.25, BZ - .22], [BX + 1.0, 2.4, BZ - 1.8]);
    const k = ease(seg(lt, 0, dur)), wp = easeIn(seg(lt, dur - .18, dur)) * 3.2;
    P3.look(S.cam, [lerp(BX + 2.6, BX + 2.2, k) + wp * .4, lerp(8.2, 7.6, k), lerp(BZ - 4.2, BZ - 3.8, k)], [BX + .1 + wp, lerp(3.3, 3.4, k), BZ + .4]);
    S.cam.fov = lerp(40, 36, k); S.cam.updateProjectionMatrix();
    stormSky(S.cam, t);
    drawSite(S, t, { near: .3, lineW: 1.6 });
    const [hx, hy] = P3.project(S.cam, hit), tr = sinceBlow(t);
    sparks(hx, hy, tr, .7, { key: 'bolt', n: 9, spread: 2.6 });
    dust(S.cam, t, { c: [BX, 0, BZ], r: 30, near: true, split: 7, k: .6 });
    if (lt < .35) pageTurn(.5 + lt / .7, 1);
    if (lt > dur - .18) whipH((lt - (dur - .18)) / .18);                // whip pan along the pole to the split (F8)
  }
  // F8 204.61 [48] "We'll patch her up with fencing-wire": close on the driller's hands binding the split with fencing
  // wire, turn on turn, then twisting the ends tight with the pliers on the beat.
  function f8(t, lt, dur) {
    const S = SITE(), { driller } = S.cast, B = S.benchP;
    crew(S, ['driller'], ['pliers']); lights(S, { fire: 0, forge: 700 }); hoist(S, null);
    work(S, t, { amp: 0 }); S.bench.visible = true;
    B.bolts.forEach(b => { b.visible = true; b.position.y = 3.4; }); B.split.visible = true;
    const wrap = seg(t, 204.7, 205.9), nT = Math.floor(wrap * 6 + .001);
    B.turns.forEach((w, i) => w.visible = i < nT || wrap >= 1);
    const tw = seg(t, 206.0, 207.2), twA = -easeOut(frac(Math.max(0, t - 205.95) / BEAT)) * 1.6 - Math.floor(Math.max(0, t - 205.95) / BEAT) * 1.6;
    B.twist.visible = wrap >= 1; B.twist.scale.set(1, lerp(1, .55, tw), 1); B.twist.rotation.set(0, twA, 0);
    PEOPLE.at(driller, [BX + 1.7, 0, BZ - 2.2], -.2);
    PEOPLE.clip(driller, 'Idle_Loop', t * .6 + .4);
    PEOPLE.turn(driller, 'spine_02', [.5, 0, 0]); PEOPLE.turn(driller, 'spine_03', [.22, 0, 0]); PEOPLE.turn(driller, 'Head', [.05, 0, 0]);
    // left hand winds the wire round the pole (a circle round it), then steadies the pole; right hand takes the pliers
    const wx = BX + 1.45 + Math.min(5, nT) * .16;
    if (wrap < 1) { const a = frac(wrap * 6) * TAU; PEOPLE.reach(driller, 'l', [wx, 3.1 + Math.cos(a) * .38, BZ + Math.sin(a) * .38 - .05], [wx - 1, 2.5, BZ - 1.8]); PEOPLE.reach(driller, 'r', [BX + 2.6, 3.3, BZ - .25], [BX + 3.2, 2.6, BZ - 1.6]); }
    else { PEOPLE.reach(driller, 'l', [BX + 1.2, 3.3, BZ - .24], [BX + .6, 2.6, BZ - 1.8]); PEOPLE.reach(driller, 'r', [BX + 1.85 + Math.sin(twA) * .07, 3.72, BZ - .12 + Math.cos(twA) * .07], [BX + 2.6, 3.2, BZ - 1.5]); }
    S.pliers.visible = wrap >= 1;
    if (wrap >= 1) { const hp = PEOPLE.hand(driller, 'r'); PROPS.place(S.pliers, hp, [BX + 1.85, 3.45, BZ], twA); }
    const k = ease(seg(lt, 0, dur));
    P3.look(S.cam, [lerp(BX + 3.4, BX + 3.1, k), lerp(4.6, 4.5, k), lerp(BZ + 2.1, BZ + 1.8, k)], [lerp(BX + 1.65, BX + 1.75, k), lerp(3.45, 3.4, k), BZ - .35]);
    S.cam.fov = lerp(40, 34, k); S.cam.updateProjectionMatrix();
    stormSky(S.cam, t);
    drawSite(S, t, { near: .2, lineW: 1.7 });
    dust(S.cam, t, { c: [BX, 0, BZ], r: 30, near: true, split: 6, k: .5 });
    if (lt < .16) whipH(1 - lt / .16);
  }
  // F9 207.28 [48] "and drive her to the end": a graphic match on the binding (horizontal on the bench, now upright in
  // the string). The mended pole is back in the hole and the beam drives it on the beat; close on the mend, the camera
  // riding with it. On the second blow the tools stick fast: the beam can't lift the string, it shudders.
  function f9(t, lt, dur) {
    const S = SITE(), { driller } = S.cast, U = S.U;
    crew(S, ['driller']); lights(S, { fire: 0, forge: 0, lamp: 380, lant: [-1.6, U.floorY, -1.9] }); hoist(S, null);
    // she comes up to speed; then on the second blow (208.35) the tools stick fast in the rock: the beam can't lift
    // the string, it shudders (sets up F10, where the crew turn it free by main force)
    const on = seg(t, 207.3, 207.75), stuck = seg(t, bt(388) + .05, bt(388) + .25);
    const w = work(S, t, { amp: lerp(lerp(.25, 1.05, ease(on)), .06 + .05 * Math.sin(t * 70), stuck), repaired: true, bounce: .12 * (1 - stuck), tiller: 1.7 });
    const jolt = Math.exp(-sinceBlow(t) * 8) * (t > 208.3 ? 1 : .3) + stuck * .35;
    // she has stepped back from the string to watch the mend take the first blows
    PEOPLE.at(driller, [2.9, U.floorY, .9], -1.75);
    PEOPLE.clip(driller, 'Idle_Loop', t * .6 + 1.7);
    PEOPLE.turn(driller, 'spine_02', [.06, 0, 0]); PEOPLE.turn(driller, 'Head', [-.12 - jolt * .06, -.1, 0]);
    eyesShut(S, 0);
    // close on the mend (straps, bolts, the wire binding), the camera riding up and down with it
    const k = ease(seg(lt, 0, dur)), sh = shakeXY(t, jolt * .05), m = w.top - 3.8, d = lerp(1, .88, k);
    P3.look(S.cam, [3.0 * d + sh[0], m - .5 + sh[1], -4.0 * d], [-.35, m - .75, 0]);
    S.cam.fov = lerp(42, 38, k); S.cam.updateProjectionMatrix();
    stormSky(S.cam, t);
    drawSite(S, t, { near: .25, lineW: 1.8 });
    dust(S.cam, t, { c: [0, 2.2, 0], r: 50, near: true, split: 8 });
  }
  // F10 208.86 [49] "For we'll wring it from the bedrock": the tools are gripped fast; every hand is on the bars clamped
  // to the string, walking it round like a capstan, bodies laid into it; it stalls, then gives on "deeper down" and the
  // bars swing round. Low among the bars, a slow orbit.
  const CAP_R = 4.3;
  function capAngle(t) {
    // slow, straining, a stall, then it gives on "deeper down" and the bars swing round
    const u = t - 208.86;
    return u * .2 - .09 * (1 - Math.cos(Math.min(u, 2.2) * 2.6)) * .5 + (t > 211.55 ? easeOut(seg(t, 211.55, 212.4)) * .85 : 0);
  }
  function f10(t, lt, dur) {
    const S = SITE(), U = S.U, names = ['dresser', 'lab', 'hand', 'boss', 'driller'];
    crew(S, names, ['cap']); lights(S, { fire: 0, forge: 0, lamp: 260, lant: [6.5, U.floorY, 6.8] }); hoist(S, null);
    const th = capAngle(t), give = seg(t, 211.55, 211.9);
    RIG.pose(S.R, { stroke: .1, amp: .3, fly: 2 + t * .4, turn: th });
    const top = U.temper.position.y - 5.6; U.tiller.visible = false;
    poseRods(S.rods, top, { turn: th, repaired: true });
    S.cap.position.set(0, U.floorY + 3.3, 0); S.cap.rotation.set(0, th, 0);
    // bar ends at th + k·90°; people walk behind them (anticlockwise seen from above = increasing th)
    const slots = [[0, CAP_R + .2, 0], [1, CAP_R + .2, .4], [2, CAP_R + .2, .9], [3, CAP_R + .2, 1.3], [2, 2.6, .7]];
    names.forEach((n, i) => {
      const p = S.cast[n], [bk, r, ph] = slots[i], a = th + bk * Math.PI / 2;
      // the bar's direction and the walking direction (tangent)
      const bx = Math.cos(a), bz = -Math.sin(a), tx = -Math.sin(a), tz = -Math.cos(a);
      const pos = [bx * r - tx * 1.1, U.floorY, bz * r - tz * 1.1], yaw = Math.atan2(tx, tz);
      PEOPLE.at(p, pos, yaw);
      PEOPLE.clip(p, 'Push_Loop', (t - 208.86) * .55 + ph + (give > 0 ? give * .6 : 0));
      PEOPLE.turn(p, 'spine_02', [.18 + .1 * Math.sin(t * 3 + i), 0, 0]);
      const barY = U.floorY + 3.45, h1 = [bx * (r - .6), barY, bz * (r - .6)], h2 = [bx * (r + .15), barY, bz * (r + .15)];
      PEOPLE.reach(p, 'r', i % 2 ? h1 : h2, [pos[0] + bx * .3 - tx * .2, barY - 1.2, pos[2] + bz * .3 - tz * .2]);
      PEOPLE.reach(p, 'l', i % 2 ? h2 : h1, [pos[0] - bx * .3 - tx * .2, barY - 1.2, pos[2] - bz * .3 - tz * .2]);
    });
    const k = ease(seg(lt, 0, dur)), ca = .42 + k * .28, cr = lerp(11.2, 10.2, k), cy = lerp(3.3, 3.7, k);
    P3.look(S.cam, [Math.cos(ca) * cr, cy, Math.sin(ca) * cr], [-Math.cos(ca) * 2, U.floorY + lerp(2.9, 3.1, k), -Math.sin(ca) * 2]);
    S.cam.fov = lerp(52, 48, k); S.cam.updateProjectionMatrix();
    stormSky(S.cam, t);
    dust(S.cam, t, { c: [0, 2.2, 0], r: 60, split: 14 });
    drawSite(S, t, { near: .5, lineW: 1.6 });
    dust(S.cam, t, { c: [0, 2.2, 0], r: 60, near: true, split: 14 });
    U.tiller.visible = true;
  }
  // everyone at their station while the plant drills: the driller at the bar, Bill at the firebox, the dresser at the
  // anvil, the hand at the drum brake, the labourer carrying gidgee, the boss by the board
  function stations(S, t) {
    const U = S.U, c = S.cast, an = U.anvil;
    PEOPLE.at(c.driller, [2.2, U.floorY, 1.2], -2.05); PEOPLE.clip(c.driller, 'Idle_Loop', t * .7 + 1.1);
    const ty = U.tiller.position.y, rot = U.tiller.rotation.y, bar = s => [Math.cos(rot) * s, ty + .05, -Math.sin(rot) * s];
    PEOPLE.reach(c.driller, 'r', bar(1.5), [2.9, ty - 1.3, 2.4]); PEOPLE.reach(c.driller, 'l', bar(.62), [2.3, ty - 1.5, -.6]);
    PEOPLE.at(c.bill, [46.4, 0, 12.4], Math.PI - .15); PEOPLE.clip(c.bill, 'Idle_Loop', t * .9 + .5);
    PEOPLE.reach(c.bill, 'r', U.throttle, [48, 5, 12]);
    const tgt = [an[0] - .05, an[1] + .12, an[2]];
    PEOPLE.at(c.dresser, PROPS.swingStand(c.dresser, tgt, Math.PI), Math.PI); PEOPLE.clip(c.dresser, 'Idle_Loop', t * .6);
    PROPS.swing(c.dresser, S.sledge, frac(bpOf(t) / 2 + 1e-6), { target: tgt, lead: 'r' });
    PEOPLE.at(c.hand, [9.6, 0, -9.2], -2.2); PEOPLE.clip(c.hand, 'Idle_Loop', t * .8 + 2.4);
    PEOPLE.reach(c.hand, 'r', [8.1, 4.6, -9.6], [9.6, 3.2, -8]);
    const lw = frac(t / 9), lx = lerp(36, 47, lw);
    PEOPLE.at(c.lab, [lx, 0, 14.5], Math.PI / 2); PEOPLE.clip(c.lab, 'Walk_Carry_Loop', t);
    PEOPLE.at(c.boss, [-6.4, 0, 12.2], 2.6); PEOPLE.clip(c.boss, 'Idle_FoldArms_Loop', t * .8 + 1.2);
  }
  // F11 212.622 [50] "Sinking down, deeper down": the whole plant in the storm at full stroke, cut on the chorus
  // downbeat. A low crane rising past the forge shed (the dresser at the anvil) to the derrick against the storm.
  function f11(t, lt, dur) {
    const S = SITE(), U = S.U;
    crew(S, ['driller', 'bill', 'dresser', 'hand', 'lab', 'boss'], ['sledge']); lights(S, { fire: 900, forge: 700, lamp: 0 }); hoist(S, null);
    work(S, t, { amp: 1.1, repaired: true, bounce: .1 });
    stations(S, t);
    const k = ease(seg(lt, 0, dur));
    P3.look(S.cam, [lerp(-37, -33, k), lerp(3.0, 5.2, k), lerp(32, 29.5, k)], [lerp(-5, -3, k), lerp(18.5, 17.5, k), lerp(-2, -1.5, k)]);
    S.cam.fov = lerp(52, 49, k); S.cam.updateProjectionMatrix();
    stormSky(S.cam, t);
    dust(S.cam, t, { c: [10, 0, 0], r: 120, n: 34, split: 60, scale: 2.2 });
    drawSite(S, t, { fog: [160, 1300], lineW: 1.4 });
    stackSmoke(S, t);
    glowAt(S, U.firebox, 60, '#FF7A30', .7); glowAt(S, U.forge, 50, '#FF8A3A', .6);
    const [hx, hy, hd] = P3.project(S.cam, U.hole), hit = Math.exp(-sinceBlow(t) * 9);
    if (hit > .05) psmoke(hx, hy, (6 + 12 * hit) * 900 / hd, '#8E7662', .5 * hit);
    dust(S.cam, t, { c: [10, 0, 0], r: 120, n: 34, near: true, split: 60, scale: 2.2 });
  }
  // F12 215.826 [51] "Oh we'll sink it": Bill draws back a split gidgee log and drives it into the firebox on the
  // off-beat; the fire flares on him. Low, beside the engine.
  function f12(t, lt, dur) {
    const S = SITE(), U = S.U, { bill } = S.cast;
    crew(S, ['bill'], ['log']); hoist(S, null);
    work(S, t, { amp: 1.1, repaired: true });
    const tb = bt(403), flare = t > tb ? Math.exp(-(t - tb) * 3) : 0;   // on the off-beat, between the rig's blows
    const door = U.firebox;
    lights(S, { fire: 700 + 1100 * flare, forge: 0, lamp: 0, fireShadow: true, firePos: [door[0], door[1] + .4, door[2] + .6] });
    const yaw = Math.PI + .12;
    PEOPLE.at(bill, [door[0] + .45, 0, door[2] + 2.75], yaw); PEOPLE.clip(bill, 'Idle_Loop', 1.2 + (t - 215.6) * .6);
    // the log: drawn back (anticipation), driven into the door on the beat, and let go
    const back = ease(seg(t, bt(402), tb - .16)), fwd = easeIn(seg(t, tb - .16, tb)), after = easeOut(seg(t, tb, tb + .25));
    const push = -.45 * back + (1.35 + .45) * fwd + .8 * after;   // along -z, ft
    const lx = door[0] + .25, ly = 4.25 - .2 * fwd, lz = door[2] + 1.9 - push;
    PROPS.place(S.log, [lx, ly, lz + 1.5], [lx, ly - .15, lz - 2]);
    const held = t < tb + .1;
    PEOPLE.turn(bill, 'spine_02', [.2 + .25 * fwd - .15 * back, 0, 0]); PEOPLE.turn(bill, 'Head', [.05, 0, 0]);
    if (held) { PEOPLE.reach(bill, 'r', [lx + .22, ly, lz + 1.25], [lx + 1.3, ly - 1, lz + 2.2]); PEOPLE.reach(bill, 'l', [lx - .22, ly + .05, lz + .55], [lx - 1.3, ly - 1, lz + 1.6]); }
    else { const r = easeOut(seg(t, tb + .1, tb + .5)); PEOPLE.reach(bill, 'r', [lx + .3 + r * .5, ly - r * .8, lz + 1.4 + r * .8], [lx + 1.6, ly - 1.5, lz + 2.6]); PEOPLE.reach(bill, 'l', [lx - .3 - r * .4, ly - r * .7, lz + 1.1 + r * .8], [lx - 1.6, ly - 1.5, lz + 2.4]); }
    S.log.visible = t < tb + .3;
    const k = ease(seg(lt, 0, dur));
    P3.look(S.cam, [lerp(42.6, 43.2, k), lerp(3.7, 3.8, k), lerp(13.4, 13.1, k)], [lerp(46.3, 46.3, k), lerp(4.35, 4.45, k), lerp(11.3, 11.3, k)]);
    S.cam.fov = lerp(54, 48, k); S.cam.updateProjectionMatrix();
    stormSky(S.cam, t);
    drawSite(S, t, { near: .25, tint: .95 });
    // the open door: a mouth of fire, flaring as the log goes in on the beat; sparks up past his face
    const E = U.eng, c = (x, y, z) => P3.project(S.cam, E.localToWorld(new THREE.Vector3(x, y, z)).toArray());
    const q = [c(-9.62, 3.05, -.9), c(-9.62, 3.05, .9), c(-9.62, 4.55, .9), c(-9.62, 4.55, -.9)];
    const [dx, dy] = P3.project(S.cam, [door[0], door[1] + .3, door[2]]);
    if (q.every(p => p[2] > 0)) {
      const pts = q.map(p => [p[0], p[1]]), cx = pts.reduce((a, p) => a + p[0], 0) / 4, cy = pts.reduce((a, p) => a + p[1], 0) / 4;
      seed('Ffire'); X.save(); tracePath(pts); X.clip();
      const R = Math.hypot(pts[2][0] - pts[0][0], pts[2][1] - pts[0][1]) * .6, g = X.createRadialGradient(cx, cy + R * .3, 5, cx, cy, R * 1.2);
      g.addColorStop(0, '#FFE8A0'); g.addColorStop(.4, '#F8A040'); g.addColorStop(.85, '#B8481C'); g.addColorStop(1, '#4A1A0C');
      X.fillStyle = g; X.fillRect(cx - 2 * R, cy - 2 * R, 4 * R, 4 * R);
      pshade(rectPts(cx - 2 * R, cy - 2 * R, 4 * R, 4 * R), '#C8581E', .7, { kind: 'v' });
      // the burning logs on the grate, and flame tongues licking up (taller as the new log goes in)
      for (let i = 0; i < 6; i++) pfill(ellPts(cx + (hash(i * 3) - .5) * R * 1.4, cy + R * (.45 + hash(i * 5) * .3), R * (.25 + hash(i) * .15), R * .1, 8, 0, (hash(i * 7) - .5) * .5), '#3A160C', { tone: .85, dens: .9, ink: '#1A0C06', sw: .8 });
      for (let i = 0; i < 9; i++) { const x0 = cx + (hash(i * 7) - .5) * R * 1.5, h = R * (.4 + hash(i * 2) * .5 + .5 * flare); pline([[x0, cy + R * .5], [x0 + Math.sin(t * 13 + i) * R * .08, cy + R * .5 - h * .5], [x0 + Math.sin(t * 9 + i * 2) * R * .14, cy + R * .5 - h]], 2.4, '#FFE7A0', { curv: true, over: 0, passes: 1, alpha: .75 }); }
      X.restore();
      pline(pts, 2, '#1A1210', { closed: true });
    }
    pglow(dx, dy, 700 + 500 * flare, '#FF7A2A', .6 + .5 * flare);
    if (t > tb) sparks(dx + 40, dy - 40, t - tb, 1.8, { key: 'fire', n: 26, dir: -Math.PI / 2 + .35, spread: 1.3 });
  }
  // F13 216.894 [51] "sink it deeper down": cut on the blow to the driller's hands on the bar, over her shoulder. At the
  // top of the stroke she gives the string its small turn; on the next blow the camera drops with it, down the rods into
  // the casing head, and whips on down into the ground.
  function f13(t, lt, dur) {
    const S = SITE(), U = S.U, { driller } = S.cast;
    crew(S, ['driller']); lights(S, { fire: 0, forge: 0, lamp: 300, lant: [3.6, U.floorY, -1.6] }); hoist(S, null);
    const turn = Math.floor(bpOf(t) / 2) * .35 + .35 * ease(seg(frac(bpOf(t) / 2), .55, .75));
    work(S, t, { amp: .6, repaired: true, turn, bounce: .1, tiller: 4.3 });
    const jolt = Math.exp(-sinceBlow(t) * 9);
    PEOPLE.at(driller, [2.2, U.floorY, 1.2], -2.05); PEOPLE.clip(driller, 'Idle_Loop', t * .7 + 1.1);
    PEOPLE.turn(driller, 'spine_02', [.08 + jolt * .05, 0, 0]); PEOPLE.turn(driller, 'Head', [-.05 - jolt * .12, -.2, 0]);
    const ty = U.tiller.position.y, rot = U.tiller.rotation.y, bar = s => [Math.cos(rot) * s, ty + .05, -Math.sin(rot) * s];
    PEOPLE.reach(driller, 'r', bar(1.5), [2.9, ty - 1.3, 2.4]); PEOPLE.reach(driller, 'l', bar(.62), [2.3, ty - 1.5, -.6]);
    eyesShut(S, 0);
    const tb = bt(406), dn = easeIn(seg(t, tb - .05, tb + .38)), sh = shakeXY(t, jolt * .04), k = ease(seg(lt, 0, 1.1));
    P3.look(S.cam, [lerp(3.7, 3.4, k) - dn * 2.4 + sh[0], lerp(8.5, 8.2, k) - dn * 3.2 + sh[1], lerp(-.7, -.5, k) + dn * .2], [lerp(.6, .5, k) - dn * .5, lerp(5.1, 5.2, k) - dn * 2.8, .1]);
    S.cam.fov = lerp(42, 38, k) - dn * 6; S.cam.updateProjectionMatrix();
    stormSky(S.cam, t);
    drawSite(S, t, { near: .2, lineW: 1.8 });
    dust(S.cam, t, { c: [0, 2.2, 0], r: 40, near: true, split: 6 });
    const [hx, hy] = P3.project(S.cam, [0, U.floorY + 1.8, 0]), hit = t > tb ? Math.exp(-(t - tb) * 8) : 0;
    if (hit > .05) psmoke(hx, hy, 80 + 160 * hit, '#8E7662', .5 * hit);
    if (t > tb + .26) whip(seg(t, tb + .26, 218.51));
  }
  // F14 218.51 [52]–[53] "Sinking down, deeper down / Oh we'll sink it deeper down": down the bore to the iron band at
  // 4,012 ft. Two blows craze it; on the second (the last blow the rig strikes) it breaks, the string drops seven feet
  // into the sandstone, and blue water wells up into the hole round the tools.
  const BREAK = bt(410);                                            // 220.099
  function f14(t, lt, dur) {
    const Z = SEC(), tb = t - BREAK, broke = tb >= 0;
    // before the break the bit pounds the band (4012 → 4016); after it the string has dropped 7 ft and hangs still
    const dep0 = lerp(4012, 4016.5, seg(t, 218.9, 219.2)), st0 = RIG.strokeAt(t), l = clamp(liftOf(st0) + rebound(t, .22)), st = broke ? 0 : st0 < .75 ? strokeFor(l) : st0;
    const drop = broke ? 7 * easeIn(clamp(tb / .22)) : 0, dep = dep0 + drop;
    const crack = t < 219.03 ? 0 : !broke ? .25 + .25 * easeOut(seg(t, 219.03, 219.5)) : .5 + .5 * easeOut(clamp(tb / .5));
    const wet = broke ? easeOut(clamp(tb / .8)) : 0, well = broke ? .9 + 3.6 * easeOut(clamp((tb - .1) / 1.1)) : 0;
    poseSec(Z, dep, st, { amp: .5, crack, wet, well, at: 4016.5 });
    const k = ease(seg(lt, 0, 1.1)), yb = Z.y(4016);
    const sh = broke ? shakeXY(t, .35 * Math.exp(-tb * 4)) : shakeXY(t, .12 * Math.exp(-sinceBlow(t) * 10));
    // crane down to the bit on the band, hold while it pounds, then on the break push in on the cracks as the blue comes
    const k2 = broke ? easeOut(clamp(tb / .95)) : 0;
    P3.look(Z.cam, [lerp(6.5, 7.8, k) - 2.6 * k2 + sh[0], lerp(yb + 34, yb + .9, k) - 1.1 * k2 + sh[1], lerp(12, 10.8, k) - 3.4 * k2], [lerp(-.3, -.4, k) + .15 * k2, lerp(yb + 30, yb + .5, k) - .7 * k2, .6]);
    Z.cam.fov = lerp(48, 42, k) - 3 * k2; Z.cam.updateProjectionMatrix();
    underground(); drawSec(Z, { lineW: 1.9, fog: [30, 220] }); cracks2D(Z);
    if (lt > .9) ruler3(Z, -6.4, 3980, 4060, { hi: 4020, size: 40 });
    const [bx, by] = P3.project(Z.cam, [0, Z.y(dep) + .1, .8]);
    if (well > .02) {   // the rising water's surface in the bore, and bubbles coming up through it
      const wy = Z.y(dep) - .45 + well, [l1, l2] = [P3.project(Z.cam, [-1.3, wy, .13]), P3.project(Z.cam, [1.3, wy, .13])];
      seed('Fwsurf'); pline([[l1[0], l1[1]], [(l1[0] + l2[0]) / 2, l1[1] + 3 * Math.sin(t * 9)], [l2[0], l2[1]]], 2.2, '#CFEAF7', { over: 0, passes: 1, alpha: .9 });
      for (let i = 0; i < 10; i++) { const q = frac(hash(i * 3.3) + tb * (.8 + hash(i) * .6)), bx2 = (hash(i * 7) - .5) * 2.2 + Math.sin(t * 5 + i) * .08, by2 = Z.y(dep) - .3 + q * well; if (by2 > wy) continue; const [ux, uy] = P3.project(Z.cam, [bx2 * 1.1, by2, .14]); pline(ellPts(ux, uy, 4 + hash(i) * 5, 4 + hash(i) * 5, 8), 1, '#E8F6FC', { closed: true, passes: 1, alpha: .8 }); }
    }
    if (!broke) { const tr = sinceBlow(t); if (t > 218.9) sparks(bx, by, tr, 1, { key: 'f14', n: 20, spread: 2.8 }); }
    else {
      pglow(bx, by + 30, 420 * clamp(tb * 2), '#7FC4E8', .55 * clamp(tb * 1.5));
      pglow(bx, by, 900, '#B8E4F8', .9 * Math.exp(-tb * 5));
      X.save(); X.globalCompositeOperation = 'lighter'; X.globalAlpha = .32 * Math.exp(-tb * 9); X.fillStyle = '#9CCFEA'; X.fillRect(0, 0, W, H); X.restore();   // the flash of the break
      sparks(bx, by, tb, 1.3, { key: 'brk', n: 30, spread: 3.4, col: '#DDEFF6', glow: false });
      if (tb < .6) psmoke(bx, by - 30, 80 + 300 * tb, '#8A827A', .5 * (1 - tb / .6));
    }
    if (lt < .2) whip(1 - lt / .2);
  }
  // F15 221.167 [53] "...deeper down": at the surface they felt it go. The crew stand frozen round the bore, listening;
  // the driller's hand still on the string. Nothing moves but the dust. Held to the whistle (chapter G, "Hark!").
  function f15(t, lt, dur) {
    const S = SITE(), U = S.U, c = S.cast, fy = U.floorY;
    crew(S, ['driller', 'dresser', 'hand', 'lab', 'boss']); lights(S, { fire: 0, forge: 0, lamp: 300, lant: [-.35, fy, 1.5] }); hoist(S, null);
    RIG.pose(S.R, { stroke: 0, amp: 1.1, fly: 2.4, turn: 0 });
    const top = U.temper.position.y - 5.6 - .6; U.tiller.position.y = top - 1.7;
    poseRods(S.rods, top, { repaired: true });
    const br = Math.sin(t * 1.7) * .012, face = (x, z) => Math.atan2(-x, -z);   // yaw that looks at the bore from (x, z)
    // the driller at the string, palm on it, head down, eyes shut, listening; then her eyes open and her head comes up
    const wake = ease(seg(t, 221.95, 222.35));
    PEOPLE.at(c.driller, [1.3, fy, .25], face(1.3, .25) - .15); PEOPLE.clip(c.driller, 'Idle_Loop', 1.4);
    PEOPLE.turn(c.driller, 'spine_02', [.14 + br - .05 * wake, 0, 0]); PEOPLE.turn(c.driller, 'neck_01', [.1 - .06 * wake, 0, 0]); PEOPLE.turn(c.driller, 'Head', [.2 - .2 * wake, -.1 + .12 * wake, 0]);
    PEOPLE.reach(c.driller, 'r', [.24, 5.6, .14], [1.2, 4.6, 1.6]);
    eyesShut(S, 1 - ease(seg(t, 221.85, 222.05)));
    // behind her the others, stock-still round the bore: the dresser down on one knee, the hand with a hand up for
    // quiet, the labourer bent to the hole, the boss with his book forgotten at his side
    PEOPLE.at(c.dresser, [3.6, fy, -1.3], face(3.6, -1.3)); PEOPLE.clip(c.dresser, 'Crouch_Idle_Loop', .6);
    PEOPLE.turn(c.dresser, 'spine_02', [br, 0, 0]); PEOPLE.turn(c.dresser, 'Head', [.05, .15, 0]);
    PEOPLE.at(c.hand, [2.9, fy, 3.1], face(2.9, 3.1)); PEOPLE.clip(c.hand, 'Idle_Loop', 2.0);
    PEOPLE.turn(c.hand, 'spine_02', [.08 + br, 0, 0]); PEOPLE.turn(c.hand, 'Head', [.2, .1, 0]);
    PEOPLE.reach(c.hand, 'l', [2.55, 6.5, 2.25], [3.4, 5.4, 3.5]);
    PEOPLE.at(c.lab, [5.0, fy, 1.9], face(5.0, 1.9)); PEOPLE.clip(c.lab, 'Idle_Loop', 2.3);
    PEOPLE.turn(c.lab, 'spine_01', [.2, 0, 0]); PEOPLE.turn(c.lab, 'spine_02', [.24 + br, 0, 0]); PEOPLE.turn(c.lab, 'Head', [.12, 0, 0]);
    PEOPLE.reach(c.lab, 'r', [4.3, 4.6, 1.2], [4.9, 4.2, .4]); PEOPLE.reach(c.lab, 'l', [4.5, 4.6, 2.4], [5.2, 4.2, 3.2]);
    PEOPLE.at(c.boss, [6.2, fy, 4.9], face(6.2, 4.9)); PEOPLE.clip(c.boss, 'Idle_Loop', .9);
    PEOPLE.turn(c.boss, 'spine_02', [.05 + br, 0, 0]); PEOPLE.turn(c.boss, 'Head', [.22, 0, 0]);
    const k = ease(seg(lt, 0, dur + .4));
    P3.look(S.cam, [lerp(-2.3, -1.95, k), lerp(5.35, 5.55, k), lerp(1.75, 1.5, k)], [lerp(1.9, 1.85, k), lerp(7.0, 7.15, k), lerp(.75, .6, k)]);
    S.cam.fov = lerp(46, 42, k); S.cam.updateProjectionMatrix();
    stormSky(S.cam, t);
    dust(S.cam, t, { c: [0, 2.2, 0], r: 60, split: 9 });
    drawSite(S, t, { near: .2, lineW: 1.7 });
    dust(S.cam, t, { c: [0, 2.2, 0], r: 60, near: true, split: 9, k: 1.2 });
  }
  // hatching iris: dense graphite hatching closes in on (cx, cy) (p 0 → .5, fully covered at .5) and opens again
  // from the same point (p .5 → 1). Cut under full cover.
  function hatchIris(p, cx = W / 2, cy = H / 2) {
    if (p <= 0 || p >= 1) return;
    const k = p < .5 ? easeIn(p * 2) : 1 - easeOut((p - .5) * 2), r = lerp(1500, 0, k);
    seed('Firis');
    X.save(); X.beginPath(); X.rect(-60, -60, W + 120, H + 120);
    if (r > 1) { X.moveTo(cx + r, cy); X.ellipse(cx, cy, r, r * .92, 0, 0, TAU, true); }
    X.clip('evenodd');
    X.globalAlpha = .96; X.fillStyle = '#2A2420'; X.fillRect(-60, -60, W + 120, H + 120); X.restore();
    X.save(); X.beginPath(); X.rect(-60, -60, W + 120, H + 120); if (r > 1) { X.moveTo(cx + r, cy); X.ellipse(cx, cy, r, r * .92, 0, 0, TAU, true); } X.clip('evenodd');
    pshade(rectPts(-60, -60, W + 120, H + 120), '#141010', 1.4); X.restore();
    if (r > 1) pline(ellPts(cx, cy, r, r * .92, 40), 2.2, '#141010', { closed: true, passes: 2 });
  }
  // whipH: a horizontal whip pan's smear (k 0..1): the frame streaks sideways in long pencil strokes
  function whipH(k) {
    if (k <= 0) return;
    const f = Math.floor(T * 24); seed('FwhipH' + f);
    X.save(); X.globalAlpha = clamp(k) * .8; X.fillStyle = '#B8A488'; X.fillRect(0, 0, W, H); X.restore();
    for (let i = 0; i < 70; i++) { const y = hash(i * 3.7 + f) * H, w = 1 + hash(i * 5.3) * 4; pline([[-20, y], [W + 20, y + jit(10)]], w, i % 3 ? '#5A4A3C' : '#E8DCC4', { over: 0, passes: 1, alpha: .55 * clamp(k) }); }
  }
  // whip: a vertical whip tilt's smear (k 0..1): the frame streaks downward in long pencil strokes
  function whip(k) {
    if (k <= 0) return;
    seed('Fwhip' + Math.floor(T * 24));
    X.save(); X.globalAlpha = clamp(k) * .85; X.fillStyle = '#3A302A'; X.fillRect(0, 0, W, H); X.restore();
    for (let i = 0; i < 60; i++) { const x = hash(i * 3.7 + Math.floor(T * 24)) * W, w = 1 + hash(i * 5.3) * 3; pline([[x, -20], [x + jit(8), H + 20]], w, i % 3 ? '#1E1814' : '#8A7A6A', { over: 0, passes: 1, alpha: .6 * k }); }
  }

  // cuts land on the rig's blows where the action allows (a blow every 2 beats): bt(364) 195.533, bt(368) 197.669,
  // bt(374) 200.873, bt(396) 212.622 (the chorus downbeat), bt(404) 216.894, bt(412) 221.167 (the blow that doesn't come)
  shots([[188.97, f1], [192.33, f2], [bt(364), f3], [bt(368), f4], [199.19, f5], [bt(374), f6], [202.48, f7], [204.61, f8], [207.28, f9],
    [208.86, f10], [bt(396), f11], [bt(402), f12], [bt(404), f13], [218.51, f14], [bt(412), f15]]);

})();
