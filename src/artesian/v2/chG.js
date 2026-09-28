// Chapter G (v2) · 222.73–259.90 s · The strike, THE FINALE (verse 7 [54–58], chorus 7 [59–62]).
// Dawn at the bore: Bill's whistle, the crew's joy, the water racing up the casing from 4,020 ft, the flow bursting
// over the derrick floor against the sunrise (hot, so it steams: RESEARCH Q4), the crew under the falling water; then
// the water spreads over the cracked plain, the squatter rides in and the cattle come to it.
// Compass: the sun is low in the EAST, toward -z and a little +x (roughly opposite chapter F's dusk sun), and stays
// there for the whole chapter. The first blue of the film arrives with the water.
//
//  shot  time           line   read                                        camera                               in
//  G1    222.73–225.97  [54]   Bill hauls the whistle cord, steam screams  low, sun blazing behind the whistle  steam burst (F seam)
//  G2    225.97–229.85  [54]   the plume flags the dawn; the camp runs in  low wide behind the tents, into sun  cut on the surge
//  G3    229.85–232.10  [55]   hats thrown high, boss and dresser embrace  inside the derrick, tilt after hats  cut on action
//  G4    232.10–234.17  [55]   the driller's hand on the rising rods       close, long lens, she lifts her eyes  cut in
//  G5    234.17–238.45  [56]   water races up the casing past the strata   the section, crane up with the head  hatching iris (hand)
//  G6    238.45–243.61  [57]   dome, then the jet, beam engulfed, crown    low into the sunrise, crane up/back  match cut on the burst
//  G7    243.61–247.61  [58]   the crew under the water, faces up, bow     reverse, sun behind us, rainbow      whip pan
//  G8    247.61–250.31  [59]   the flood spreading over the cracked plain  aerial, descending arc, then a dive  page turn
//  G9    250.31–252.55  [60]   the water front; the squatter canters in    on the ground at the water's edge    camera carries through
//  G10   252.55–255.61  [61]   he reins in, looks up, hat to his chest     medium close, long lens              cut on action
//  G11   255.61–259.90  [62]   the cattle come to the water                wide from beyond the herd            eyeline cut; out: scribble
(() => {
  const SUN = [28, 38, -150], SL = Math.hypot(...SUN), SUNN = SUN.map(v => v / SL);
  const GOLD = '#F2C47A', CREAM = '#EFDDBA';
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const focal = cam => (H / 2) / Math.tan(cam.fov * Math.PI / 360);
  // project a 3D point with a radius in feet → [sx, sy, depth, radius px]
  const proj = (cam, p, r = 0) => { const q = P3.project(cam, p); return [q[0], q[1], q[2], q[2] > .1 ? r * focal(cam) / q[2] : 0]; };
  // a unit cylinder along +y from the origin, stretched between two points each frame (cords, ropes, rods)
  function stick(r, col, o = {}) { const g = P3.cyl(r, r, 1, o.n ?? 6); g.translate(0, .5, 0); return P3.mesh(g, col, { cast: o.cast ?? false }); }
  function stretch(m, a, b) {
    const A = a.isVector3 ? a : V3(...a), B = b.isVector3 ? b : V3(...b), d = B.clone().sub(A), L = d.length();
    m.position.copy(A); m.scale.set(1, Math.max(.001, L), 1); m.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize()); m.updateMatrixWorld(true);
  }

  // ---------- geometry builders (once, inside the cached sets) ----------
  // A crazed dried-mud network, merged into ONE mesh (WORLD.cracks makes one mesh per crack).
  function crackField(cx, cz, r0, r1, cell, col, w, seedN = 0) {
    const geos = [], n = Math.ceil(2 * r1 / cell);
    const P = (i, j) => [cx - r1 + (i + (j % 2) * .5) * cell + (hash(i * 31.7 + j * 7.3 + seedN) - .5) * cell * .8, cz - r1 + j * cell + (hash(i * 13.1 + j * 29.9 + seedN) - .5) * cell * .7];
    for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
      const a = P(i, j);
      for (const b of [i < n ? P(i + 1, j) : null, j < n ? P(i + (j % 2), j + 1) : null]) {
        if (!b || hash(i * 5.1 + j * 11.3 + seedN + b[0]) > .9) continue;
        const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2, rr = Math.hypot(mx - cx, mz - cz);
        if (rr > r1 || rr < r0) continue;
        const L = Math.hypot(b[0] - a[0], b[1] - a[1]), g = new THREE.PlaneGeometry(w * (.6 + .8 * hash(i + j * 3.3)), L);
        g.rotateX(-Math.PI / 2); g.rotateY(Math.atan2(b[0] - a[0], b[1] - a[1])); g.translate(mx, .05, mz); geos.push(g);
      }
    }
    const m = P3.mesh(THREE.BufferGeometryUtils.mergeGeometries(geos), col, { cast: false }); m.receiveShadow = true; return m;
  }
  // the flood's outline: radius factor by angle (a = atan2(-z, x) in world terms)
  const LOBES = [[3, .15, .7], [5, .09, 2.1], [11, .045, 1.3], [17, .025, .4]];
  const lobeK = a => 1 + LOBES.reduce((s2, [f, amp, ph]) => s2 + amp * Math.sin(f * a + ph), 0);
  // A lobed flat disc (radius 1, scaled per frame): the flood spreading from the bore.
  function lobedDisc(seg, lobes, y) {
    const g = new THREE.CircleGeometry(1, seg), pos = g.attributes.position;
    for (let i = 1; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getY(i), a = Math.atan2(z, x);
      const k = 1 + lobes.reduce((s, [f, amp, ph]) => s + amp * Math.sin(f * a + ph), 0);
      pos.setX(i, x * k); pos.setY(i, z * k);
    }
    g.rotateX(-Math.PI / 2); g.translate(0, y, 0); return g;
  }
  // The flowing bore: first a glassy dome over the casing mouth, then a jet that meets the walking beam's head (it
  // hangs over the hole at ~14 ft), engulfs it and carries on up, broken, to a crown of white water (~35 ft).
  // Profile [radius, height] in feet above the casing collar (3.9 ft); the parts are posed per frame.
  function waterColumn() {
    const G = new THREE.Group(), V2 = (r, h) => new THREE.Vector2(r, h);
    const prof = [[.001, -.1], [.52, -.1], [.55, 1.5], [.72, 4.5], [.95, 7.2], [1.35, 9.2], [2.2, 9.9], [2.7, 10.9], [2.35, 12.1], [1.85, 13.3], [2.0, 16.5], [2.45, 20], [2.95, 24], [3.35, 27], [3.2, 29.2], [2.4, 30.6], [.001, 31.3]];
    const core = P3.mesh(new THREE.LatheGeometry(prof.map(([r, h]) => V2(r, h)), 30), '#F1F7F8', { cast: true }); core.receiveShadow = false; G.add(core);
    const dome = WORLD.water(new THREE.SphereGeometry(1, 28, 14, 0, TAU, 0, Math.PI / 2), { col: '#A9D2E6' }); G.add(dome);
    const lumps = [];
    for (let i = 0; i < 26; i++) {
      const ring = i < 16 ? 0 : 1, a = hash(i * 3.7) * TAU, r = ring === 0 ? 1.4 + hash(i * 5.3) * 2.3 : 1.6 + hash(i * 2.9) * 1.3;
      const sz = ring === 0 ? 1.2 + hash(i * 7.1) * 1.4 : .75 + hash(i * 1.3) * .6, y = ring === 0 ? 25 + hash(i * 9.1) * 6.5 : 9.6 + hash(i * 4.1) * 2.4;
      const m = P3.mesh(new THREE.IcosahedronGeometry(1, 1), i % 3 ? '#F3F8F9' : '#E6EFF2', { cast: false });
      m.userData.base = [Math.cos(a) * r * (ring ? 1.35 : 1), y, Math.sin(a) * r * (ring ? .7 : 1), sz]; G.add(m); lumps.push(m);
    }
    G.userData = { core, dome, lumps, prof };
    return G;
  }
  // ---------- the bore site at dawn (every ground shot) ----------
  const SITE = () => P3.cached('G-site', () => {
    const o = P3.scene({ sunDir: SUN, sun: 2.7, fill: .52, shadowSize: 115 });
    o.sun.color.set('#FFD7A2'); o.fill.color.set('#E6E4E2'); o.fill.groundColor.set('#8C6C4E');
    const site = WORLD.site({ board: 4020, dead: .75, trees: 60, col: '#CDAE82' }); o.scene.add(site.group);
    const R = site.rig, U = R.userData;
    RIG.pose(R, { stroke: 0, amp: 0, fly: 1.2 });
    // dried mud round the bore, and the flood that will cover it
    const mud = P3.mesh(new THREE.CircleGeometry(150, 72).rotateX(-Math.PI / 2), '#C6A67A', { style: .8, cast: false }); mud.position.y = .02; o.scene.add(mud);
    const cracks = crackField(0, 0, 28, 148, 6.2, '#8A6446', .32, 3); o.scene.add(cracks);
    const wetG = lobedDisc(120, LOBES, .07);
    const wet = P3.mesh(wetG, '#7A5A40', { style: .8, cast: false }); o.scene.add(wet);
    const flood = WORLD.water(lobedDisc(120, LOBES, .13), { col: '#5E9CC0' }); o.scene.add(flood);
    // the whistle lever on the firebox, and the cord Bill pulls
    const lever = stick(.07, AP.brass); o.scene.add(lever);
    const footboard = P3.mesh(P3.box(3.4, 1.7, 2.3), '#6E5238'); footboard.position.set(46.4, .85, 11.0); o.scene.add(footboard);
    const cord = stick(.035, '#D9CCAE'), cord2 = stick(.035, '#D9CCAE'); o.scene.add(cord); o.scene.add(cord2);
    // the rod string being drawn up by the bull wheel after the strike: rods (yellow-wood) with iron joints, a swivel
    // at the top, the hoisting line up to the crown sheave. Only the part above the casing head is ever shown.
    const hoist = { rod: P3.mesh(P3.cyl(.21, .21, 1, 10), '#D6AE5E'), joints: [0, 1, 2].map(() => P3.mesh(P3.cyl(.34, .34, .95, 12), AP.iron)),
      swivel: P3.mesh(P3.cyl(.32, .26, 1.2, 10), AP.iron), line: stick(.07, '#8A7A60') };
    for (const m of [hoist.rod, hoist.swivel, hoist.line, ...hoist.joints]) o.scene.add(m);
    // the column
    const col = waterColumn(); col.position.set(0, U.floorY + 1.72, 0); o.scene.add(col);
    // the cast
    const P = {}; for (const n of ['bill', 'driller', 'dresser', 'boss', 'hand', 'lab', 'squatter']) { P[n] = PEOPLE.make(n); o.scene.add(P[n].root); }
    // the squatter's horse and the station's cattle (the chorus)
    const horse = PEOPLE.beast('horse', '#6A4630', { scale: .55 }); o.scene.add(horse.root);
    const COWC = ['#8A4A2E', '#6E5A48', '#A0703E', '#5A4436', '#B08A5A', '#7A4A36'];
    const cows = COWC.map((c, i) => { const cw = PEOPLE.beast(i === 3 ? 'bull' : 'cow', c, { scale: .34 }); o.scene.add(cw.root); return cw; });
    // finer cracks where the camera sits on the ground at the water's edge (G9)
    const fine = crackField(-1, 116, 0, 16, 2.1, '#7E5A3E', .12, 9); fine.position.y = .02; o.scene.add(fine);
    // the reins: two leather lines from the rider's hand(s) to the bit rings
    const reins = [stick(.035, '#3A2A1E'), stick(.035, '#3A2A1E')]; for (const r of reins) o.scene.add(r);
    // the squatter's hat, in his hand when he takes it off
    const WIDE = [[.001, .15], [.08, .145], [.108, .1], [.114, .03], [.118, .01], [.25, 0], [.262, -.012], [.24, -.004], [.1, -.002]];
    const sqHat = P3.mesh(new THREE.LatheGeometry(WIDE.map(([r, h]) => new THREE.Vector2(r, h)), 32), CAST3.squatter.hatCol, { side: THREE.DoubleSide }); sqHat.visible = false; o.scene.add(sqHat);
    // loose hats for throwing (the worn ones hide when they leave the head)
    const hats = { boss: PROPS.hat('bowler', CAST3.boss.hatCol), lab: PROPS.hat('slouch', CAST3.lab.hatCol), hand: PROPS.hat('slouch', CAST3.hand.hatCol), dresser: PROPS.hat('slouch', CAST3.dresser.hatCol) };
    for (const h of Object.values(hats)) { h.visible = false; o.scene.add(h); }
    return { o, site, R, U, mud, cracks, wet, flood, lever, cord, cord2, col, P, hats, hoist, horse, cows, fine, sqHat, reins, cams: { a: P3.cam(50), b: P3.cam(38), c: P3.cam(26) } };
  });
  // visibility per shot: people listed are shown, the rest hidden
  function cast(S, names, o = {}) {
    for (const [n, p] of Object.entries(S.P)) { p.root.visible = names.includes(n); if (p.hat) p.hat.visible = true; }
    for (const h of Object.values(S.hats)) h.visible = false;
    S.horse.root.visible = !!o.horse; S.cows.forEach((c, i) => c.root.visible = i < (o.cows ?? 0)); S.fine.visible = !!o.fine; S.sqHat.visible = false;
    for (const r of S.reins) r.visible = !!o.horse;
    // the whistle's pull-rod at rest and no cords unless Bill is in the shot (billWhistle poses them)
    const billOn = names.includes('bill'); S.cord.visible = S.cord2.visible = billOn;
    if (!billOn) stretch(S.lever, WPIV, [WPIV[0] + .05, 9.5, 9.75]);
  }
  // the plant at rest after the strike: beam stopped, flywheel still, rods hanging (until they are drawn)
  // top of the rod string being hoisted (ft above ground): rising from the strike, a joint every 18 ft
  const T_HOIST = 229.85, rodTop = t => 10.4 + 2.4 * Math.max(0, t - T_HOIST);
  function restRig(S, o = {}, t = 0) {
    const U = S.U; RIG.pose(S.R, { stroke: 0, amp: 0, fly: 1.2, turn: .4 });
    // after the strike the temper screw is unhooked and swung aside; the string hangs on the hoisting line
    const hoisting = o.hoist && t >= 0, H0 = S.hoist;
    U.rods.visible = U.tiller.visible = !hoisting && o.rods !== false; U.temper.visible = !hoisting && o.rods !== false;
    for (const m of [H0.rod, H0.swivel, H0.line, ...H0.joints]) m.visible = !!hoisting;
    if (hoisting) {
      const top = rodTop(t), base = U.floorY + 1.7;
      stretch(H0.rod, [0, base, 0], [0, top, 0]); H0.swivel.position.set(0, top + .55, 0);
      stretch(H0.line, [0, top + 1.1, 0], [0, U.H + 1.6, 0]);
      [top - .7, top - 12, top - 30].forEach((y, i) => { const j = H0.joints[i]; j.position.set(0, y, 0); j.visible = y > base + .5; });
    }
    U.beltA.visible = U.beltB.visible = false;   // the belt is thrown off: the engine is stopped, steam kept up for the whistle
  }
  // flood extent (ft) and column height (0..1) as functions of absolute time
  const T_SPOUT = 238.45;
  // the flow at the casing head: dome (0..1) swelling first, then the jet climbing (0..1 of its height)
  const domeK = t => t < T_SPOUT ? 0 : easeOut(seg(t, T_SPOUT, T_SPOUT + .28));
  const jetK = t => t < T_SPOUT + .4 ? 0 : easeOut(seg(t, T_SPOUT + .4, T_SPOUT + 1.05));
  const floodR = t => t < T_SPOUT + .8 ? 0 : 12 + 128 * easeOut(seg(t, T_SPOUT + .8, 259.9)) * (.35 + .65 * seg(t, T_SPOUT + .8, 259.9));
  function setFlood(S, t) {
    const r = floodR(t); S.flood.visible = r > 1; S.wet.visible = r > 1;
    S.flood.scale.set(Math.max(.01, r), 1, Math.max(.01, r)); S.wet.scale.set(r * 1.05 + 2.5, 1, r * 1.05 + 2.5);
  }
  function setColumn(S, t) {
    const d = domeK(t), j = jetK(t), C = S.col, U = S.col.userData; C.visible = d > 0;
    if (!C.visible) return;
    // the dome surges (a glassy swell that rocks), and stays as the boiling foot of the jet
    const surge = 1 + .12 * Math.sin(t * 17) * (1 - j * .6);
    U.dome.scale.set(1.9 * d * surge, 1.5 * d * (1 + .2 * Math.sin(t * 11)), 1.9 * d * surge);
    U.core.visible = j > 0; U.core.scale.set(lerp(.6, 1, j), Math.max(.02, j), lerp(.6, 1, j));
    const top = 31 * j;
    for (const [i, m] of U.lumps.entries()) {
      const [x, y, z, sz] = m.userData.base, w = Math.sin(t * (2.4 + hash(i) * 2.2) + i * 1.7), q = Math.sin(t * (3.3 + hash(i * 3) * 2) + i);
      m.visible = y < top + 1;
      m.position.set(x * (1 + .14 * w), (y < 13 ? y : y * lerp(.8, 1, j)) + q * .5, z * (1 + .14 * q)); m.scale.setScalar(sz * (1 + .2 * w));
    }
  }

  // ---------- acting helpers (call after the clip; all pure functions of t) ----------
  const wp = o => { const v = new THREE.Vector3(); o.getWorldPosition(v); return v; };
  function frameOf(p) { const y = p.root.rotation.y; return { fwd: V3(Math.sin(y), 0, Math.cos(y)), right: V3(-Math.cos(y), 0, Math.sin(y)) }; }
  // Take the hat off and throw it high: the hand goes up to the brim (t0-.55 → t0-.3), sweeps it up and lets go at
  // t0 above the head; the hat then flies its own arc (v ft/s), tumbling (spin rad/s), and lies where it lands.
  function throwHat(S, name, t, t0, o = {}) {
    const p = S.P[name], hat = S.hats[name], side = o.side || 'r', sg = side === 'r' ? 1 : -1, F = frameOf(p);
    const sh = wp(p.bones['upperarm_' + side]), H0 = PEOPLE.hand(p, side);
    const grab = wp(p.hat).add(F.right.clone().multiplyScalar(.3 * sg)).add(V3(0, -.08, 0));
    const rel = sh.clone().add(V3(0, 2.2, 0)).add(F.fwd.clone().multiplyScalar(.5)).add(F.right.clone().multiplyScalar(.2 * sg));
    if (t >= t0 - .55) {
      let target;
      if (t < t0 - .3) target = H0.clone().lerp(grab, ease(seg(t, t0 - .55, t0 - .3)));
      else if (t < t0) target = grab.clone().lerp(rel, easeIn(seg(t, t0 - .3, t0)) * .8 + .2 * seg(t, t0 - .3, t0));
      else {
        const k = ease(seg(t, t0 + .45, t0 + 1.4)), fist = sh.clone().add(V3(0, 1.7, 0)).add(F.right.clone().multiplyScalar(.5 * sg)).add(F.fwd.clone().multiplyScalar(.3));
        target = rel.clone().add(V3(0, .12 * Math.sin((t - t0) * 9) * (1 - k), 0)).lerp(fist, k);
        target.y += .15 * Math.sin((t - t0) * 7.5) * k;
      }
      PEOPLE.reach(p, side, target.toArray(), sh.clone().add(F.right.clone().multiplyScalar(1.4 * sg)).add(V3(0, -1, 0)).add(F.fwd.clone().multiplyScalar(-.3)).toArray());
    }
    const inHand = t >= t0 - .3 && t < t0, flying = t >= t0;
    p.hat.visible = !(inHand || flying); hat.visible = inHand || flying;
    if (inHand) { const hp = PEOPLE.hand(p, side); hat.position.copy(hp).add(V3(0, .12, 0)); hat.rotation.set(-.3, p.root.rotation.y, .25 * sg); }
    else if (flying) {
      const v = o.v || [0, 30, 0], gy = 16, land = (v[1] + Math.sqrt(v[1] * v[1] + 4 * gy * Math.max(0, rel.y - (o.floor ?? 2.25)))) / (2 * gy), dt = Math.min(t - t0, land);
      hat.position.set(rel.x + v[0] * dt, rel.y + v[1] * dt - gy * dt * dt, rel.z + v[2] * dt);
      const sp = o.spin || [5, 2, 3], ds = t - t0 < land ? dt : land;
      hat.rotation.set(t - t0 < land ? sp[0] * ds : 0, p.root.rotation.y + sp[1] * ds, t - t0 < land ? sp[2] * ds : .05);
    }
  }
  // Put the PALM (not the wrist) on a contact point: solve, then pull the wrist back along the forearm by the palm's
  // length and solve again, so the fingers close on the handle, rod or cord instead of past it.
  function gripAt(p, side, contact, pole, palm = .27) {
    const C = V3(...contact); PEOPLE.reach(p, side, contact, pole);
    for (let i = 0; i < 2; i++) { const e = wp(p.bones['lowerarm_' + side]), h = PEOPLE.hand(p, side), d = h.sub(e).normalize(); PEOPLE.reach(p, side, C.clone().sub(d.multiplyScalar(palm)).toArray(), pole); }
  }
  // the other arm up in a fist from t0, pumping a little
  function cheerArm(p, side, t, t0, o = {}) {
    const k = ease(seg(t, t0, t0 + .35)); if (k <= 0) return;
    const F = frameOf(p), sg = side === 'r' ? 1 : -1, sh = wp(p.bones['upperarm_' + side]);
    const up = sh.clone().add(V3(0, 1.85 + .2 * Math.sin((t - t0) * (o.rate ?? 8)), 0)).add(F.right.clone().multiplyScalar(.45 * sg)).add(F.fwd.clone().multiplyScalar(.3));
    PEOPLE.reach(p, side, PEOPLE.hand(p, side).lerp(up, k).toArray(), sh.clone().add(F.right.clone().multiplyScalar(1.3 * sg)).add(V3(0, -.6, 0)).toArray());
  }
  // Two people who already face each other hold each other: lean in, heads past, arms round each other's backs,
  // B patting A's back. Positions, yaws and clips first. o.freeBL leaves B's left arm free (to throw a hat).
  function embrace(S, a, b, t, o = {}) {
    const A = S.P[a], B = S.P[b];
    for (const p of [A, B]) { PEOPLE.turn(p, 'spine_02', [.2, 0, 0]); PEOPLE.turn(p, 'spine_03', [.08, 0, 0]); PEOPLE.turn(p, 'neck_01', [0, .35, 0]); PEOPLE.turn(p, 'Head', [-.05, .3, .12]); }
    const FA = frameOf(A), FB = frameOf(B);
    const back = (p, F, up, side) => wp(p.bones.spine_03).add(F.fwd.clone().multiplyScalar(-.45)).add(F.right.clone().multiplyScalar(side)).add(V3(0, up, 0));
    const pat = .14 * Math.abs(Math.sin(t * 8.5));
    PEOPLE.reach(B, 'r', back(A, FA, .05, -.3).add(FA.fwd.clone().multiplyScalar(-pat)).toArray(), wp(B.bones.upperarm_r).add(FB.right.clone().multiplyScalar(1.2)).add(V3(0, .3, 0)).toArray());
    if (!o.freeBL) PEOPLE.reach(B, 'l', back(A, FA, -.6, .32).toArray(), wp(B.bones.upperarm_l).add(FB.right.clone().multiplyScalar(-1.2)).add(V3(0, -.7, 0)).toArray());
    PEOPLE.reach(A, 'r', back(B, FB, -.4, -.26).toArray(), wp(A.bones.upperarm_r).add(FA.right.clone().multiplyScalar(1.2)).add(V3(0, -.8, 0)).toArray());
    PEOPLE.reach(A, 'l', back(B, FB, -.15, .3).toArray(), wp(A.bones.upperarm_l).add(FA.right.clone().multiplyScalar(-1.2)).add(V3(0, -.4, 0)).toArray());
  }
  // The driller at the hole: beside the string facing east (-z), her right hand resting on the rods, listening.
  const DRILLER_AT = [-1.1, 0, 0.05];
  function drillerAtRods(S, t, o = {}) {
    const p = S.P.driller, U = S.U;
    PEOPLE.at(p, [DRILLER_AT[0], U.floorY, DRILLER_AT[2]], Math.PI - .12); PEOPLE.clip(p, 'Idle_Loop', t * .7 + .7);
    PEOPLE.turn(p, 'spine_02', [.06, -.1, 0]); PEOPLE.turn(p, 'neck_01', [.1, -.15, 0]); PEOPLE.turn(p, 'Head', [o.look ?? .2, -.12, 0]);
    const hy = U.floorY + (o.hy ?? 4.05), hoisting = t >= T_HOIST;
    // when a joint rides up to her hand she lets it pass under her loosened fingers
    const top = rodTop(t), jd = hoisting ? [top - .7, top - 12, top - 30].reduce((m, y) => Math.min(m, Math.abs(y - hy)), 9) : 9, lift = .16 * clamp(1 - jd / .75);
    const F = frameOf(p), sh = wp(p.bones.upperarm_r);
    gripAt(p, 'r', [-(.12 + lift * .4), hy, -(.21 + lift)], sh.clone().add(F.right.clone().multiplyScalar(.9)).add(V3(0, -1.3, 0)).add(F.fwd.clone().multiplyScalar(-.25)).toArray(), .24);
  }

  // ---------- 2D: sky, sun, steam, spray ----------
  // the dawn sky; k = 0..1 how far the first blue has arrived in the upper sky; west = looking away from the sun
  function dawnSky(k = 0, west = false) {
    const top = west ? mixCol('#D6CDC4', '#B9CDD5', k) : mixCol(CREAM, '#C3D5D8', k), bot = west ? mixCol('#EACDB2', '#EED2B0', k) : GOLD;
    sky(top, bot, { still: true, split: .72, hatch: .7 });
  }
  const sunScreen = cam => proj(cam, [cam.position.x + SUNN[0] * 3000, cam.position.y + SUNN[1] * 3000, cam.position.z + SUNN[2] * 3000]);
  function dawnSun(cam, k = 1) {
    const [x, y, d] = sunScreen(cam); if (d <= 0) return;
    seed('gsun');
    pglow(x, y, 520, '#F4B860', .55 * k); pglow(x, y, 190, '#FFE0A0', .8 * k);
    if (x > -80 && x < W + 80 && y > -80 && y < H + 80) pfill(ellPts(x, y, 46, 46, 30, 1.2), '#FFF1D2', { tone: .95, dens: .25, ink: '#E2A850', sw: 1 });
  }
  // a halo of sunlight wrapping silhouettes near the sun (drawn after the 3D)
  function sunFlare(cam, a = .35) { const [x, y, d] = sunScreen(cam); if (d > 0) pglow(x, y, 360, '#FFD690', a); }
  // One puff of steam in pencil: a soft warm-white body, a cool shade on the side away from the light, a light
  // hatch and (for big puffs) a billow contour on the lit side. lx, ly = screen direction toward the light.
  function steamPuff(x, y, r, a, o = {}) {
    if (!(a > .01) || !(r >= 2) || !isFinite(x + y)) return;
    const lx = o.lx ?? .6, ly = o.ly ?? -.5, c = o.col || [250, 245, 234];
    X.save();
    const g = X.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${c},${a})`); g.addColorStop(.62, `rgba(${c},${a * .72})`); g.addColorStop(1, `rgba(${c},0)`);
    X.fillStyle = g; X.beginPath(); X.arc(x, y, r, 0, TAU); X.fill();
    const sx = x - lx * r * .32, sy = y - ly * r * .32, g2 = X.createRadialGradient(sx, sy, 0, sx, sy, r * .72);
    g2.addColorStop(0, `rgba(132,128,140,${a * (o.shade ?? .38)})`); g2.addColorStop(1, 'rgba(132,128,140,0)');
    X.fillStyle = g2; X.beginPath(); X.arc(sx, sy, r * .72, 0, TAU); X.fill();
    X.restore();
    if (r > 14) {
      pshade(ellPts(x, y, r * .66, r * .56, 12, r * .05), '#FFFDF6', a * .55, { kind: 'x' });
      const hh = o.h ?? .5;
      if (r > 26 && a > .12 && hh < .55) { const span = 1.2 + 1.4 * hash(hh * 91), a0 = Math.atan2(ly, lx) - span / 2 + (hash(hh * 57) - .5) * 1.6, pts = []; for (let k = 0; k <= 8; k++) { const q = a0 + span * k / 8, rr = r * (.66 + .1 * Math.sin(k * 1.7 + hh * 20)); pts.push([x + Math.cos(q) * rr, y + Math.sin(q) * rr * .92]); } pline(pts, .7, '#8E857C', { alpha: Math.min(.6, a), passes: 1, over: 0, j: .8 }); }
    }
  }
  // Bill's whistle: a column of steam from the whistle top; inten(birthTime) 0..1
  function whistleSteam(cam, t, top, inten, o = {}) {
    const dt = o.dt ?? .02, L = o.life ?? 3.0, i1 = Math.floor(t / dt), i0 = i1 - Math.ceil(L / dt);
    for (let i = i0; i <= i1; i++) {
      const tb = i * dt, a = t - tb; if (a < 0 || a > L) continue;
      const w = inten(tb); if (w <= .02) continue;
      const h1 = hash(i * 1.37), h2 = hash(i * 2.91), h3 = hash(i * 4.13);
      const rise = (12 + 6 * w) * (1 - Math.exp(-a / .45)) + 6.5 * a, drift = 1.7 * a * a + .8 * a, sz = o.size ?? 1;
      const p = [top[0] - drift * .9 + (h1 - .5) * a * 4, top[1] + rise, top[2] + drift * .2 + (h2 - .5) * a * 4];
      const gr = o.grow ?? 1, [sx, sy, d, rp] = proj(cam, p, sz * (.6 + 4.2 * a * gr + 1.1 * a * a * gr * gr) * (.7 + .6 * h3) * (.55 + .5 * w));
      if (d <= .5 || rp < 2) continue;
      const al = .78 * Math.pow(1 - a / L, o.fade ?? 1.1) * Math.min(1, a / .05) * (.55 + .45 * w);
      seed('ws' + i);
      steamPuff(sx, sy, rp, al * (o.alpha ?? 1), { lx: o.lx, ly: o.ly, h: h3 });
    }
  }
  // the scream at the whistle's mouth: steam leaving the bell's gap sideways in bright short jets, and a white core
  function whistleMouth(cam, t, p, k) {
    const [x, y, d, r] = proj(cam, p, .9); if (d <= .3) return;
    seed('mouth');
    pglow(x, y, r * 2.2, '#FFF6E0', .5 * k);
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * TAU + hash(i + Math.floor(t * 24) * .37) * .3, L = r * (.7 + .9 * hash(i * 3.1 + Math.floor(t * 24))) * k, c = Math.cos(a), s2 = Math.sin(a) * .35;
      pline([[x + c * r * .25, y + s2 * r * .25 - r * .1], [x + c * (r * .25 + L), y + s2 * (r * .25 + L) - r * .1 - L * .25]], 1.3, '#FFFBF2', { alpha: .75 * k, passes: 1, over: 0 });
    }
    steamPuff(x, y - r * .35, r * .9, .85 * k, { lx: 0, ly: .9, shade: .15 });
  }
  // The F → G seam: the whistle's first blast erupts from its mouth (cx, cy on screen) and fills the frame in about
  // four frames, billows and churns upward, then clears from the bottom up as the column takes over. lt = shot time.
  function steamBurst(lt, cx, cy) {
    if (lt > 1.6) return;
    const R = 700 + 1900 * easeOut(seg(lt, 0, .15)), cover = clamp(1 - seg(lt, .3, 1.1));   // we cut in with the blast already bursting
    // under-tone: hides the scene while the puffs are dense
    const u = clamp(1 - seg(lt, .16, .55)) * clamp(R / 700);
    if (u > 0) { X.save(); X.globalAlpha = .92 * u; X.fillStyle = '#F4ECDC'; X.fillRect(-20, -20, W + 40, H + 40); X.restore(); }
    for (let i = 0; i < 46; i++) {
      const gx = (i % 8 + .5) / 8, gy = (Math.floor(i / 8) + .5) / 6;
      let x = gx * W + (hash(i * 3.3) - .5) * 260, y = gy * H + (hash(i * 5.7) - .5) * 200;
      const d = Math.hypot(x - cx, y - cy); if (d > R) continue;
      const age = lt - d / 2600 * .15, grow = easeOut(clamp(age / .35));
      y -= age * (120 + 140 * hash(i * 7.1)); x += Math.sin(age * 2.2 + i) * 30;
      const yn = clamp(y / H), clr = seg(lt, .2 + .5 * (1 - yn), .55 + .5 * (1 - yn));
      const a = .9 * (1 - clr) * grow; if (a <= .01) continue;
      seed('burst' + i);
      steamPuff(x, y, (190 + 170 * hash(i * 9.1)) * (.55 + .45 * grow) * (1 + .25 * age), a, { lx: .2, ly: -.9, shade: .55, h: hash(i * 2.3), col: [252, 238, 214] });
    }
    if (cover > 0 && lt < .3) pglow(cx, cy, 700 * easeOut(lt / .15), '#FFF8E8', .5 * (1 - lt / .3));
  }


  // ---------- the flow in 2D, over the 3D: curtains, beam splash, drops, mist, hot steam ----------
  const COLLAR = 3.9, BEAM_Y = 14.2;
  // A falling sheet drawn as streaks travelling down parabolic arcs from (r0, y0) outward at u ft/s.
  function arcPts(a, r0, y0, u, vy, n, floor = 2.3) {
    const land = (vy + Math.sqrt(vy * vy + 64 * Math.max(0, y0 - floor))) / 32, P = [];
    for (let k = 0; k <= n; k++) { const s2 = land * k / n; P.push([Math.cos(a) * (r0 + u * s2), y0 + vy * s2 - 16 * s2 * s2, Math.sin(a) * (r0 + u * s2)]); }
    return P;
  }
  const PROF = [[.52, 0], [.55, 1.5], [.72, 4.5], [.95, 7.2], [1.35, 9.2], [2.2, 9.9], [2.7, 10.9], [2.35, 12.1], [1.85, 13.3], [2.0, 16.5], [2.45, 20], [2.95, 24], [3.35, 27], [3.2, 29.2], [2.4, 30.6]];
  const profR = h => { for (let i = 1; i < PROF.length; i++) if (h <= PROF[i][1]) return lerp(PROF[i - 1][0], PROF[i][0], (h - PROF[i - 1][1]) / (PROF[i][1] - PROF[i - 1][1])); return 2; };
  function flowFX(cam, t, o = {}) {
    const j = jetK(t), dm = domeK(t); if (dm <= 0) return;
    const top = COLLAR + 31 * j, al = o.alpha ?? 1, P2 = p => { const q = P3.project(cam, p); return q[2] > .5 ? [q[0], q[1]] : null; };
    seed('flowfx');
    // mist boiling off the floor round the foot of the jet (behind everything else)
    for (let i = 0; i < 16; i++) {
      const a = hash(i * 2.3) * TAU + t * .15, r = 3 + hash(i * 4.7) * 11 * (.4 + .6 * j), q = frac(t * .35 + hash(i * 6.1)), p = [Math.cos(a) * r, 2.4 + q * 7, Math.sin(a) * r];
      const [x, y, d, rp] = proj(cam, p, 2.5 + q * 5); if (d > 1) steamPuff(x, y, rp, .38 * (o.mist ?? 1) * (.3 * dm + .7 * j) * al * Math.sin(q * Math.PI), { lx: 0, ly: -1, shade: .2 });
    }
    if (j > 0) {
      // the column's own rush: bright strokes racing up its face
      for (let i = 0; i < 34; i++) {
        const q = frac(t * 2.2 + hash(i * 1.3)), h0 = COLLAR + q * (top - COLLAR - 2), rr = profR(h0 - COLLAR) * lerp(.6, 1, j), a = (o.face ?? 0) + (hash(i * 4.9) - .5) * 2.2;
        const A = P2([Math.sin(a) * rr, h0, Math.cos(a) * rr]), B = P2([Math.sin(a) * rr * 1.02, h0 + 2.2 + 2 * hash(i), Math.cos(a) * rr * 1.02]);
        if (A && B) pline([A, B], 1.4, '#FFFFFF', { alpha: .7 * al * Math.sin(q * Math.PI), passes: 1, over: 0 });
      }
      // curtains falling from the crown (a wide umbrella), each a faint arc with bright streaks running down it
      const crownY = top - 2.5, N = 56;
      for (let i = 0; i < N; i++) {
        const a = i / N * TAU + hash(i) * .1, u = (4.5 + hash(i * 3.3) * 6.5) * j, arc = arcPts(a, 2.6 * j, crownY, u, 2 + hash(i * 5.5) * 5, 10);
        const S2 = arc.map(P2); if (S2.some(v => !v)) continue;
        pline(S2, .8, '#E6F2F6', { alpha: (o.curtain ?? .32) * al, passes: 1, over: 0, j: .6, curv: true });
        for (let k = 0; k < 2; k++) {
          const q = frac(t * 1.25 + hash(i * 7.1 + k * 3.7)), f = Math.floor(q * 9), g = q * 9 - f; if (f >= 9) continue;
          const A = S2[f], B = S2[f + 1], C2 = S2[Math.min(10, f + 2)], p0 = lerp2(A, B, g), p1 = g < .5 ? lerp2(A, B, g + .5) : lerp2(B, C2, g - .5);
          pline([p0, p1], 1.5, '#F4FAFC', { alpha: .8 * al, passes: 1, over: 0 });
        }
      }
      // where the jet meets the beam head the water fans out along the beam and pours off its sides
      if (top > BEAM_Y) for (let i = 0; i < 26; i++) {
        const side = i % 2 ? 1 : -1, a = side > 0 ? (hash(i) - .5) * .5 : Math.PI + (hash(i) - .5) * .5, arc = arcPts(a, 1.2, BEAM_Y - .6 + hash(i * 2.2) * .8, 5 + hash(i * 4.4) * 8, 1 + hash(i * 6.6) * 4, 8);
        const S2 = arc.map(P2); if (S2.some(v => !v)) continue;
        const q = frac(t * 1.6 + hash(i * 9.3)), f = Math.min(7, Math.floor(q * 8));
        pline([S2[f], S2[f + 1]], 1.3, '#F2F9FB', { alpha: .75 * al, passes: 1, over: 0 });
        pline(S2, .7, '#E3F0F5', { alpha: .22 * al, passes: 1, over: 0, curv: true });
      }
      // drops thrown out of the crown on their own arcs
      for (let i = 0; i < 70; i++) {
        const per = 1.3 + hash(i * 1.9) * .8, q = frac(t / per + hash(i * 2.7)), a = hash(i * 3.1) * TAU, u = 3 + hash(i * 4.3) * 5.5, vy = 4 + hash(i * 5.9) * 9, s2 = q * 1.5;
        const y = crownY + vy * s2 - 16 * s2 * s2; if (y < 2.3) continue;
        const p = [Math.cos(a) * (2.5 + u * s2), y, Math.sin(a) * (2.5 + u * s2)], pp = [p[0] - Math.cos(a) * u * .03, y - (vy - 32 * s2) * .03, p[2] - Math.sin(a) * u * .03];
        const A = P2(p), B = P2(pp); if (A && B) pline([B, A], 1.5 + hash(i) * 1.2, '#F6FBFC', { alpha: .85 * al, passes: 1, over: 0 });
      }
      // hot water: steam boils up off the crown and drifts away west with the breeze, lit gold on the sun side
      const dt = .06, L = 3.4, i1 = Math.floor(t / dt), i0 = i1 - Math.ceil(L / dt);
      for (let i = i0; i <= i1; i++) {
        const tb = i * dt, a = t - tb; if (a < 0 || a > L || tb < T_SPOUT + .5) continue;
        const h1 = hash(i * 1.37), h2 = hash(i * 2.91), rise = 6 * a + 1.2 * a * a, drift = 2.2 * a * a;
        const p = [(h1 - .5) * 6 - drift, crownY + 1 + rise + (h2 - .2) * 3, (h2 - .5) * 6];
        const [x, y, d, rp] = proj(cam, p, (2.2 + 3.2 * a) * (.7 + .6 * hash(i * 4.1)));
        if (d > 1) steamPuff(x, y, rp, .5 * Math.pow(1 - a / L, 1.1) * Math.min(1, a / .25) * al, { lx: o.lx ?? 0, ly: o.ly ?? .9, shade: .32 });
      }
      // looking into the sun: the spray lights up where the sun comes through it
      if (o.backlit) for (const [yy, rr, aa] of [[crownY + 1, 9, .42], [(crownY + BEAM_Y) / 2, 6, .22], [BEAM_Y, 5, .3]]) { if (yy > top) continue; const [x, y, d, rp] = proj(cam, [0, yy, 0], rr); if (d > 1) pglow(x, y, rp, '#FFE9BC', aa * o.backlit * al); }
      // the white burst at the crown and at the beam head
      for (const [yy, rr, aa] of [[crownY, 4.2, .6], [BEAM_Y, 2.8, .5]]) { if (yy > top) continue; const [x, y, d, rp] = proj(cam, [0, yy, 0], rr); if (d > 1) steamPuff(x, y, rp, aa * al, { lx: o.lx ?? 0, ly: o.ly ?? .9, shade: .2 }); }
    }
  }
  // after the throws the three who threw are bareheaded; the loose hats are gone (picked up, or in the flood)
  function bareheaded(S) { for (const n of ['lab', 'hand', 'dresser']) S.P[n].hat.visible = false; for (const h of Object.values(S.hats)) h.visible = false; }

  // ---------- the squatter on his horse ----------
  // Seat the rider on the horse's back each frame (after the horse's clip): the Driving_Loop sitting pose, pelvis on
  // the saddle over the horse's mid-back bone, feet in the stirrups by leg IK, hands low over the withers on the reins.
  function mountRider(horse, p, t, o = {}) {
    const mid = wp(horse.bones.Torso2), fore = wp(horse.bones.Torso3), back = wp(horse.bones.Torso);
    const fwd = fore.clone().sub(back).setY(0).normalize(), side = new THREE.Vector3().crossVectors(V3(0, 1, 0), fwd).normalize();
    const saddle = mid.clone().add(V3(0, o.seat ?? .72, 0)).add(fwd.clone().multiplyScalar(-.15));
    const yaw = Math.atan2(fwd.x, fwd.z);
    PEOPLE.at(p, [0, 0, 0], yaw); PEOPLE.clip(p, 'Driving_Loop', t * .6 + 1);
    const pv = wp(p.bones.pelvis); PEOPLE.at(p, saddle.clone().sub(pv).toArray(), yaw); PEOPLE.clip(p, 'Driving_Loop', t * .6 + 1);
    PEOPLE.turn(p, 'spine_02', [o.lean ?? .05, 0, 0]);
    for (const [sd, sg] of [['l', 1], ['r', -1]]) {
      const st = saddle.clone().add(side.clone().multiplyScalar(1.05 * sg)).add(V3(0, -2.35, 0)).add(fwd.clone().multiplyScalar(.25));
      PEOPLE.plant(p, sd, st.toArray(), saddle.clone().add(side.clone().multiplyScalar(1.5 * sg)).add(V3(0, -.9, 0)).add(fwd.clone().multiplyScalar(1.6)).toArray());
    }
    if (o.hands !== false) for (const [sd, sg] of [['l', 1], ['r', -1]]) {
      const h = saddle.clone().add(side.clone().multiplyScalar(.28 * sg)).add(V3(0, 1.15, 0)).add(fwd.clone().multiplyScalar(1.15));
      const sh = wp(p.bones['upperarm_' + sd]);
      PEOPLE.reach(p, sd, h.toArray(), sh.clone().add(side.clone().multiplyScalar(.9 * sg)).add(V3(0, -1.2, 0)).add(fwd.clone().multiplyScalar(-.5)).toArray());
    }
    return { saddle, fwd, side };
  }


  // ---------- chorus 7: the water spreads, the squatter rides in, the cattle come ----------
  // The squatter's ride, from the station side (+z, west) toward the bore: a canter easing to a stop at the water's
  // edge at 253.4. Returns { pos, yaw, speed }.
  const RIDE_A = [14, 0, 200], RIDE_B = [2.5, 0, 127.5], RIDE_L = Math.hypot(RIDE_B[0] - RIDE_A[0], RIDE_B[2] - RIDE_A[2]), RIDE_STOP = 253.4;
  function ride(t) {
    const v0 = 12, dec = 1.4, s0 = RIDE_L - v0 * dec / 2, t0 = RIDE_STOP - dec - s0 / v0;
    let sd, v;
    if (t < RIDE_STOP - dec) { sd = Math.max(0, (t - t0) * v0); v = t < t0 ? 0 : v0; }
    else if (t < RIDE_STOP) { const u = t - (RIDE_STOP - dec); sd = s0 + v0 * u - v0 / dec * u * u / 2; v = v0 * (1 - u / dec); }
    else { sd = RIDE_L; v = 0; }
    const k = sd / RIDE_L;
    return { pos: [lerp(RIDE_A[0], RIDE_B[0], k), 0, lerp(RIDE_A[2], RIDE_B[2], k)], yaw: Math.atan2(RIDE_B[0] - RIDE_A[0], RIDE_B[2] - RIDE_A[2]), v };
  }
  // the bit rings either side of the horse's mouth, from the head bone (offset in the bone's frame, model units)
  const BIT_LOCAL = [[.3, .35, .95], [-.3, .35, .95]];
  function bitRings(horse) { const hb = horse.bones.Head; hb.updateMatrixWorld(true); return BIT_LOCAL.map(l => hb.localToWorld(new THREE.Vector3(...l))); }
  // reins from the hands to the bit; oneHand: both reins in the left hand (the right is busy)
  function setReins(S, oneHand = false) {
    const sq = S.P.squatter, B = bitRings(S.horse), hl = PEOPLE.hand(sq, 'l'), hr = oneHand ? hl.clone().add(V3(0, .05, 0)) : PEOPLE.hand(sq, 'r');
    stretch(S.reins[0], hl, B[0]); stretch(S.reins[1], hr, B[1]);
  }
  function poseRide(S, t, o = {}) {
    const R0 = ride(t), H0 = S.horse, sq = S.P.squatter;
    PEOPLE.at(H0, R0.pos, R0.yaw + (o.turn || 0));
    // gaits crossfade with speed (a clip switch would pop the horse and the rider sitting on its back)
    const wWalk = clamp(R0.v / 1.6), wGal = clamp((R0.v - 5.5) / 3), dr = o.drink ? ease(seg(t, o.drink, o.drink + 1.2)) : 0;
    PEOPLE.clip(H0, 'Idle', t - RIDE_STOP);
    if (dr > 0) PEOPLE.clip(H0, 'Idle_Headlow', t - o.drink, { w: dr });
    if (wWalk > 0) PEOPLE.clip(H0, 'Walk', t * 1.1, { w: wWalk });
    if (wGal > 0) PEOPLE.clip(H0, 'Gallop', t * .8, { w: wGal });
    return mountRider(H0, sq, t, { lean: .05 + .06 * clamp(R0.v / 12) });
  }
  // The squatter's hat, off his head and to his chest. The loose hat is the same lathe as the worn one, so at the
  // swap (t = HAT_OFF) it takes the worn hat's exact world pose; then it lifts clear of his head (.3 s) and comes
  // forward and down to his chest, crown out (.65 s). His right hand stays on the brim's right edge throughout.
  const HAT_OFF = 254.0, HAT_GRIP = [-.23, 0, 0];
  function heldHat(S, t) {
    const sq = S.P.squatter, F = frameOf(sq), H0 = S.sqHat, q0 = new THREE.Quaternion(), ws = new THREE.Vector3(), p0 = wp(sq.hat);
    sq.hat.getWorldQuaternion(q0); sq.hat.getWorldScale(ws);
    const b1 = ease(seg(t, HAT_OFF, HAT_OFF + .35)), b2 = ease(seg(t, HAT_OFF + .3, HAT_OFF + .9)), bq = ease(seg(t, HAT_OFF + .15, HAT_OFF + .65));
    // up and out in front of him first (clear of his face), then down to his chest; the hat turns crown-out on the way
    const lifted = p0.clone().add(V3(0, .6 * b1, 0)).add(F.fwd.clone().multiplyScalar(.9 * b1));
    const chest = wp(sq.bones.spine_03).add(F.fwd.clone().multiplyScalar(.45)).add(V3(0, -.42, 0));
    const q1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(1.35, sq.root.rotation.y, 0, 'YXZ'));
    H0.position.copy(lifted.lerp(chest, b2)); H0.quaternion.copy(q0.slerp(q1, bq)); H0.scale.copy(ws); H0.updateMatrixWorld(true);
    return H0.localToWorld(V3(...HAT_GRIP));
  }
  // the cattle walk in from the west and south-west and stop to drink at the edge of the water (each its own timing)
  const HERD = [[-40, 190, -27, 146, 257.4], [-22, 196, -15, 151, 258.4], [26, 194, 15, 151, 257.9], [46, 182, 30, 144, 258.9], [-62, 172, -43, 138, 256.9], [8, 200, 4, 156, 259.2]];
  function poseHerd(S, t) {
    S.cows.forEach((c, i) => {
      const [x0, z0, x1, z1, tArr] = HERD[i], walk = 3.2, L = Math.hypot(x1 - x0, z1 - z0), tS = tArr - L / walk, k = clamp((t - tS) / (tArr - tS));
      const yaw = Math.atan2(x1 - x0, z1 - z0);
      PEOPLE.at(c, [lerp(x0, x1, k), 0, lerp(z0, z1, k)], yaw + (k >= 1 ? .25 * Math.sin(i * 2.1) : 0));
      PEOPLE.clip(c, k < 1 ? 'Walk' : (t - tArr > .6 ? 'Idle_Headlow' : 'Idle'), k < 1 ? t * 1.0 + i * .37 : t - tArr + i * .5);
    });
  }
  // G8 · 247.61 · [59] "Sinking down, deeper down": the aerial. High over the bore at sunrise: the column and its steam,
  // the flood pushing out over the cracked plain in lobes, the derrick's shadow long across it. A slow descending arc.
  // The camera carries through from G7's tilt up into the spray.
  function g8(t, lt, dur) {
    const S = SITE(), { U } = S, cam = S.cams.b;
    cast(S, ['driller', 'dresser', 'boss', 'hand', 'lab', 'squatter'], { horse: true }); bareheaded(S); restRig(S, { rods: false }); setFlood(S, t); setColumn(S, t);
    for (const [n, [x, z, yw]] of Object.entries(CREW7)) { const p = S.P[n]; PEOPLE.at(p, [x, 0, z], Math.PI + yw); PEOPLE.clip(p, 'Idle_Loop', t * .75 + n.length); }
    poseRide(S, t); setReins(S);
    const k = ease(seg(lt, 0, dur - .7)), a = lerp(2.05, 1.8, k), r = lerp(210, 175, k), dv = easeIn(seg(lt, dur - .9, dur));
    cam.fov = 44; cam.updateProjectionMatrix();
    const c0 = [Math.cos(a) * r * .55, lerp(215, 165, k), Math.sin(a) * r], t0 = [lerp(-2, 0, k), 0, lerp(24, 18, k)];
    // the last beat: a dive down toward the flood's western edge, where the next shot sits on the ground
    const c1 = [-4, 18, 158], t1 = [-2, 3, 60];
    P3.look(cam, c0.map((v, i) => lerp(v, c1[i], dv)), t0.map((v, i) => lerp(v, t1[i], dv)), 0);
    dawnSky(1, true);
    P3.draw(S.o, cam, { fog: [260, 1600], fogCol: '#E9D6BC', lightTint: .6, lineW: 1.4 });
    flowFX(cam, t, { lx: .2, ly: -.9, mist: .6 });
    if (lt < .35) pageTurn(.5 + lt / .7, 1);
  }
  // G9 · 250.31 · [60] "Oh we'll sink it deeper down": low on the water, looking west with the sun at our back: the
  // flood runs away from the lens over the cracked mud, darkening it before it arrives, and the squatter canters in
  // toward it out of the plain, front-lit and growing. The camera settles out of G8's dive.
  function g9(t, lt, dur) {
    const S = SITE(), cam = S.cams.c;
    cast(S, ['squatter'], { horse: true, fine: true }); bareheaded(S); restRig(S, { rods: false }); setFlood(S, t); setColumn(S, t);
    poseRide(S, t); setReins(S);
    const k = ease(seg(lt, 0, dur)), land = 1 - easeOut(seg(lt, 0, .5));
    cam.fov = 34; cam.updateProjectionMatrix();
    P3.look(cam, [lerp(-18, -17.2, k), lerp(2.0, 1.9, k) + 6 * land, lerp(100, 101, k) - 3 * land], [lerp(24, 22, k), lerp(3.2, 3.6, k) - 4 * land, 175], 0);
    dawnSky(1, true);
    P3.draw(S.o, cam, { fog: [140, 1400], fogCol: '#EDD3B4', lightTint: .64, lineW: 1.6, near: .2 });
    // the water's front: bright broken strokes along the edge, running on over the cracks
    const R = floodR(t); seed('g9edge');
    for (let i = 0; i < 60; i++) {
      const a = -1.95 + (i / 60) * .55, rr = R * lobeK(a), q0 = P3.project(cam, [Math.cos(a) * rr, .16, -Math.sin(a) * rr]);
      if (q0[2] > .5 && hash(i * 3.1 + Math.floor(t * 10)) > .4) { const L = 180 / q0[2]; pline([[q0[0] - L, q0[1]], [q0[0] + L, q0[1]]], 1.2, '#F2FAFC', { alpha: .85, passes: 1, over: 0 }); }
    }
    // dust kicked up behind the horse on the dry ground
    const RD = ride(t);
    if (RD.v > 1) for (let i = 0; i < 8; i++) { const q = frac(t * 1.4 + i / 8), p = [RD.pos[0] + (hash(i) - .5) * 3, .8 + q * 3, RD.pos[2] + 3 + q * 6]; const [x, y, d, r] = proj(cam, p, 1 + q * 3); if (d > 1) { seed('g9dust' + i); psmoke(x, y, r, '#D2B48C', .35 * (1 - q) * clamp(RD.v / 8)); } }
  }
  // G10 · 252.55 · [61] "Sinking down, deeper down": the squatter reins in at the water, low in front of him with the sun
  // at our back: he looks up at the column, takes off his hat and holds it to his chest; the horse drops its head to
  // the water. A slow push.
  function g10(t, lt, dur) {
    const S = SITE(), cam = S.cams.c, sq = S.P.squatter;
    cast(S, ['squatter'], { horse: true, cows: 6 }); bareheaded(S); restRig(S, { rods: false }); setFlood(S, t); setColumn(S, t);
    const M = poseRide(S, t, { drink: 254.5 });
    poseHerd(S, t);
    // looks up at the column; the hat comes off (254.0 → 254.6) and goes to his chest
    const look = ease(seg(lt, .5, 1.3));
    PEOPLE.turn(sq, 'neck_01', [-.18 * look, 0, 0]); PEOPLE.turn(sq, 'Head', [-.22 * look, 0, 0]);
    const tOff = HAT_OFF;
    if (t > tOff - .45) {
      const F = frameOf(sq), sh = wp(sq.bones.upperarm_r), pole = sh.clone().add(F.right.clone().multiplyScalar(1.1)).add(V3(0, -1.1, 0)).add(F.fwd.clone().multiplyScalar(-.3)).toArray();
      if (t < tOff) { const g = sq.hat.localToWorld(V3(...HAT_GRIP)); gripAt(sq, 'r', PEOPLE.hand(sq, 'r').lerp(g, ease(seg(t, tOff - .45, tOff))).toArray(), pole, .2); }
      else { sq.hat.visible = false; S.sqHat.visible = true; gripAt(sq, 'r', heldHat(S, t).toArray(), pole, .2); }
    }
    setReins(S, t > tOff - .45);
    const k = ease(seg(lt, 0, dur));
    cam.fov = 28; cam.updateProjectionMatrix();
    const sp = M.saddle, dd = lerp(1.12, .96, k);
    P3.look(cam, [sp.x + 4.44 * dd, sp.y + 1.42, sp.z - 5.78 * dd], [sp.x - .26, sp.y + lerp(1.85, 2.0, k), sp.z - .08], 0);
    dawnSky(1, true);
    P3.draw(S.o, cam, { fog: [150, 1500], fogCol: '#EDD3B4', lightTint: .64, lineW: 1.8, near: .3 });
  }
  // G11 · 255.61 · [62] "Oh we'll sink it deeper down": the cattle come to the water and drink along the edge of the
  // flood, the squatter watching from the saddle, the derrick and its steaming column beyond in the risen sun. The
  // camera cranes slowly up and back; the chapter closes on the first half of the scribble wipe.
  function g11(t, lt, dur) {
    const S = SITE(), cam = S.cams.b;
    cast(S, ['squatter'], { horse: true, cows: 6 }); bareheaded(S); restRig(S, { rods: false }); setFlood(S, t); setColumn(S, t);
    poseRide(S, t, { drink: 254.5 }); S.P.squatter.hat.visible = false; S.sqHat.visible = true;
    { const sq = S.P.squatter, F = frameOf(sq); gripAt(sq, 'r', heldHat(S, t).toArray(), wp(sq.bones.upperarm_r).add(F.right.clone().multiplyScalar(1.1)).add(V3(0, -1.1, 0)).toArray(), .2); setReins(S, true); }
    poseHerd(S, t);
    const k = ease(seg(lt, 0, dur));
    cam.fov = 44; cam.updateProjectionMatrix();
    P3.look(cam, [lerp(-20, -30, k), lerp(8, 13, k), lerp(205, 214, k)], [lerp(-2, -1, k), lerp(9, 10, k), 100], 0);
    dawnSky(1); dawnSun(cam);
    P3.draw(S.o, cam, { fog: [200, 1500], fogCol: GOLD, lightTint: .62, lineW: 1.5 });
    sunFlare(cam, .3);
    flowFX(cam, t, { lx: 0, ly: .9, alpha: .85, mist: .6 });
    if (lt > dur - .35) scribbleWipe((lt - (dur - .35)) / .7);
  }

  // ---------- shots ----------
  // Bill at the whistle: beside the firebox's rear corner, facing +x, both hands on the cord from the whistle lever.
  // p = how far the cord is pulled (1 = hard down). Shared by G1 and G2 so he is the same man in the same place.
  // Bill at the whistle: up on the footboard behind the firebox, facing it (-z), both hands on the cord from the
  // whistle lever. p = how far the cord is pulled (1 = hard down). Shared by G1 and G2: same man, same place.
  const BILL_AT = [46.55, 1.7, 11.15], WPIV = [46, 9.45, 6.3];
  function billWhistle(S, t, p) {
    // the whistle's pull-rod runs back along the firebox top; its end dips as the cord is pulled
    const bill = S.P.bill, E = [WPIV[0] + .05, lerp(9.5, 8.95, clamp(p)), 9.75];
    stretch(S.lever, WPIV, E);
    const h1 = [46.28, lerp(8.8, 8.2, p), 10.0], h2 = [46.22, h1[1] - .6, 10.12];
    stretch(S.cord, E, h1); stretch(S.cord2, h2, [46.2, h2[1] - 1.3, 10.25]);
    PEOPLE.at(bill, BILL_AT, Math.PI);
    PEOPLE.clip(bill, 'Idle_Loop', t * .8 + 1.1);
    PEOPLE.turn(bill, 'spine_02', [-.06 - .1 * p, 0, 0]); PEOPLE.turn(bill, 'spine_03', [-.05, 0, 0]);
    PEOPLE.turn(bill, 'neck_01', [-.18, 0, 0]); PEOPLE.turn(bill, 'Head', [-.3, 0, 0]);
    gripAt(bill, 'r', h1, [47.8, 6.4, 10.8], .22); gripAt(bill, 'l', h2, [45.3, 6.2, 10.9], .22);
    return E;
  }
  // G1 · 222.73 · [54] "Hark! the whistle's blowing": over the brass whistle, looking back at Bill on the footboard;
  // both hands on the cord, leaning back, his face up in the low gold sun; the whistle screams steam past the lens.
  // Opens inside the burst (the F → G seam), which clears as the steam rises and blows off.
  function g1(t, lt, dur) {
    const S = SITE(), { U, P } = S, cam = S.cams.a;
    cast(S, ['bill']); restRig(S); setFlood(S, 0); setColumn(S, 0);
    billWhistle(S, t, pullG1(lt));
    const k = ease(seg(lt, 0, dur));
    cam.fov = 50; cam.updateProjectionMatrix();
    cam.fov = 54; cam.updateProjectionMatrix();
    P3.look(cam, [lerp(44.55, 44.45, k), lerp(6.35, 6.2, k), lerp(14.2, 13.9, k)], [lerp(46.2, 46.1, k), lerp(10.2, 11.6, k), lerp(6.0, 5.6, k)], -.02);
    dawnSky(0); dawnSun(cam);
    // the steam goes behind Bill and the engine (they stand in front of it against the sky)
    whistleSteam(cam, t, [46, 9.45, 6.3], tb => tb < T0g - .6 ? 0 : clamp(.5 + .5 * pullG1(tb - T0g), 0, 1.1) * (1 + .8 * (1 - seg(tb, T0g - .1, T0g + .7))), { lx: 0, ly: .9, size: 1.25 });
    P3.draw(S.o, cam, { fog: [150, 1500], fogCol: GOLD, lineW: 1.9, lightTint: .62, near: .3 });
    sunFlare(cam, .42);
    whistleMouth(cam, t, [46, 9.3, 6.3], clamp(.55 + .45 * pullG1(lt)));
    { const q = P3.project(cam, [46, 9.3, 6.3]); steamBurst(lt, q[0], q[1]); }
  }
  const T0g = 222.73;
  const pullG1 = lt => kf(lt, [[0, .9], [2.72, .9], [2.9, .6], [3.05, 1.12], [3.6, 1.0]]);
  // G2 · 225.97 · [54] "…with a wild, exultant blast": low behind the camp, looking east into the sunrise: a tent in
  // the foreground, the camp running out to the rig, the derrick against the dawn and the whistle's steam flagging
  // the sky over the engine. Cut on the steam's second surge.
  function g2(t, lt, dur) {
    const S = SITE(), { U, P } = S, cam = S.cams.b;
    cast(S, ['bill', 'driller', 'dresser', 'boss', 'hand', 'lab']); restRig(S); setFlood(S, 0); setColumn(S, 0);
    billWhistle(S, t, .95);
    drillerAtRods(S, t);
    // the dresser at the front edge of the floor, calling them in, arm up
    PEOPLE.at(P.dresser, [-4.5, U.floorY, 9.5], -.7); PEOPLE.clip(P.dresser, 'Idle_Loop', t * .9 + 2.3);
    const wave = Math.sin(t * 7.5) * .5 + .5;
    PEOPLE.reach(P.dresser, 'r', [-6.2 + wave * .5, U.floorY + 7.2, 11.2], [-6.5, U.floorY + 4.2, 9.0]);
    // the camp wakes: three running out from the tents toward the derrick (each their own speed and stride phase)
    const runner = (p, a, b, t0, spd, ph) => { const L = Math.hypot(b[0] - a[0], b[2] - a[2]), k = clamp((t - t0) * spd / L); PEOPLE.at(p, [lerp(a[0], b[0], k), 0, lerp(a[2], b[2], k)], Math.atan2(b[0] - a[0], b[2] - a[2])); PEOPLE.clip(p, 'Sprint_Loop', t * (spd / 14) + ph); };
    runner(P.boss, [-38, 0, 58], [-10, 0, 14], 225.6, 12.5, .3);
    runner(P.hand, [-44, 0, 62], [-6, 0, 16], 225.3, 14.5, .7);
    runner(P.lab, [-50, 0, 50], [-14, 0, 10], 225.8, 14, .1);
    const k = ease(seg(lt, 0, dur));
    cam.fov = 48; cam.updateProjectionMatrix();
    P3.look(cam, [lerp(-48, -45, k), lerp(9.5, 9.0, k), lerp(88, 83, k)], [lerp(-6, -6, k), lerp(15, 14, k), lerp(-4, -4, k)]);
    dawnSky(0); dawnSun(cam);
    P3.draw(S.o, cam, { fog: [180, 1500], fogCol: GOLD, lightTint: .6 });
    sunFlare(cam, .22);
    whistleSteam(cam, t, [46, 9.5, 6.3], tb => 1, { life: 3.0, dt: .03, lx: -.7, ly: -.3, size: 1.2, grow: .5, fade: 1.8 });
    campSmoke(cam, t);
  }
  // the camp fire, banked overnight: a thin grey thread drifting with the breeze
  function campSmoke(cam, t) {
    for (let i = 0; i < 14; i++) { const q = frac(t * .22 + i / 14), p = [-36 + q * 6, .8 + q * 16, 38 - q * 2]; const [x, y, d, r] = proj(cam, p, .5 + q * 3.2); if (d > 1) { seed('camp' + i); psmoke(x, y, r, AP.smoke, .3 * (1 - q) * Math.min(1, q * 6)); } }
  }

  // G3 · 229.85 · [55] "And the boys are madly cheering": low on the ground off the floor's front corner, looking up
  // at the crew against the dawn: the lab and the hand throw their hats high, the boss and the dresser hold each
  // other, the driller keeps her hand on the string as the bull wheel starts drawing it up. The camera tilts after
  // the hats. Cut on action from the runners arriving.
  // the G3 blocking of the three hat-throwers (and the boss they embrace), shared so the hats fly the same arcs in
  // G4 (where the throwers are out of frame but their hats come down through it)
  function poseThrowers(S, t, show = true) {
    const { U, P } = S, fy = U.floorY;
    const EA = [1.95, fy, -5.6], EB = [2.8, fy, -4.8], ya = Math.atan2(EB[0] - EA[0], EB[2] - EA[2]), sway = .06 * Math.sin(t * 3.2);
    PEOPLE.at(P.boss, EA, ya + sway); PEOPLE.clip(P.boss, 'Idle_Loop', t * .9 + .4);
    PEOPLE.at(P.dresser, EB, ya + Math.PI + sway); PEOPLE.clip(P.dresser, 'Idle_Loop', t * .85 + 1.9);
    embrace(S, 'boss', 'dresser', t, { freeBL: true });
    throwHat(S, 'dresser', t, 230.78, { side: 'l', v: [2.0, 29.5, -1.6], spin: [4, -2.5, 5] });
    PEOPLE.at(P.lab, [-3.1, fy, -.3], .2); PEOPLE.clip(P.lab, 'Idle_Loop', t + 1.3);
    throwHat(S, 'lab', t, 230.05, { v: [.9, 31, -1.4], spin: [6, 3, 4] }); cheerArm(P.lab, 'l', t, 229.95);
    PEOPLE.at(P.hand, [4.7, fy, -1.3], -.45); PEOPLE.clip(P.hand, 'Idle_Loop', t * 1.1 + .6);
    throwHat(S, 'hand', t, 230.42, { side: 'l', v: [-1.2, 28.5, -1.0], spin: [-5, 2, -3.5] }); cheerArm(P.hand, 'r', t, 230.3);
    if (!show) for (const n of ['boss', 'dresser', 'lab', 'hand']) { P[n].root.visible = false; }
  }
  function g3(t, lt, dur) {
    const S = SITE(), { U, P } = S, cam = S.cams.a, fy = U.floorY;
    cast(S, ['driller', 'dresser', 'boss', 'hand', 'lab']); restRig(S, { hoist: true }, t); setFlood(S, 0); setColumn(S, 0);
    drillerAtRods(S, t);
    poseThrowers(S, t);
    const k = ease(seg(lt, .15, dur));
    cam.fov = 58; cam.updateProjectionMatrix();
    const ty = kf(lt, [[0, 10.2], [.45, 10.6], [1.35, 13.6], [2.25, 14.2]]);
    P3.look(cam, [lerp(-.8, -1.0, k), lerp(3.4, 3.7, k), lerp(6.8, 7.0, k)], [lerp(.6, .5, k), ty, -8], .02);
    dawnSky(0); dawnSun(cam);
    P3.draw(S.o, cam, { fog: [150, 1500], fogCol: GOLD, lineW: 1.7, lightTint: .62 });
    sunFlare(cam, .45);
  }

  // G4 · 232.10 · [55] "…for they've struck the flow at last": close on the driller, long lens. Her hand rests on
  // the string as it is drawn up; an iron joint rides up through her loosened fingers; she lifts her eyes from the
  // hole. Calm among the cheering. A hat drops back through the background.
  function g4(t, lt, dur) {
    const S = SITE(), { U, P } = S, cam = S.cams.c, fy = U.floorY;
    cast(S, ['driller']); restRig(S, { hoist: true }, t); setFlood(S, 0); setColumn(S, 0);
    drillerAtRods(S, t, { look: kf(lt, [[0, .04], [.85, .04], [1.8, -.24]]) });
    poseThrowers(S, t, false);
    const k = ease(seg(lt, 0, dur));
    cam.fov = 30; cam.updateProjectionMatrix();
    P3.look(cam, [lerp(-.1, -.3, k), lerp(5.75, 5.9, k), lerp(-5.9, -5.55, k)], [lerp(-.72, -.72, k), lerp(6.95, 7.15, k), 0], .01);
    dawnSky(0, true);
    P3.draw(S.o, cam, { fog: [40, 900], fogCol: '#E8CFB2', lineW: 2.1, lightTint: .62, near: .3 });
    if (lt > dur - .35) { const q = P3.project(cam, [-.1, U.floorY + 4.05, -.2]); hatchIris(q[0], q[1], lerp(1300, 0, easeOut((lt - (dur - .35)) / .35))); }
  }

  // ---------- the section (G5): the water racing up the casing from the sandstone ----------
  // WORLD.section's casing is a solid tube, which hides water inside it; here the tube is cut away down its front so
  // the column shows, and the tools are out of the hole (they were drawn up after the strike).
  const SECT = () => P3.cached('G-sect', () => {
    const o = P3.scene({ sunDir: [-45, 40, 80], sun: 3.2, fill: .9, shadowSize: 95 });
    o.sun.color.set('#F4E8D4'); o.fill.color.set('#D8D6D2'); o.fill.groundColor.set('#7A726A');
    const S = WORLD.section({ bottom: 4400, w: 160 }); o.scene.add(S);
    const U = S.userData, VS = U.VS;
    U.set(4020, 0, { casing: 3400 });
    U.rods.visible = U.bit.visible = U.water.visible = U.casing.visible = false;
    // the bore drawn wider still than the shared section's (a diagram: it has to read as a pipe full of water)
    const BR = 1.75; U.slot.scale.set(BR * 1.25 / 1.3 * 1.3 / 1.3 * 1.55, 4020 / 4400, 1); U.slot.position.y = -4020 * VS / 2;
    const CAS = 3400, cas = P3.mesh(new THREE.CylinderGeometry(BR, BR, CAS * VS, 26, 1, true, Math.PI / 2, Math.PI), '#6E6A64', { side: THREE.DoubleSide, cast: false });
    cas.position.set(0, -CAS * VS / 2, .9); S.add(cas);
    for (const sx of [-1, 1]) { const e = P3.mesh(P3.box(.24, CAS * VS, .3), '#4A4744', { cast: false }); e.position.set(sx * BR, -CAS * VS / 2, .92); S.add(e); }
    for (let d = 100; d < CAS; d += 100) { const ring = P3.mesh(new THREE.TorusGeometry(BR + .03, .09, 5, 24, Math.PI), '#4A4744', { cast: false }); ring.rotation.set(Math.PI / 2, 0, Math.PI); ring.position.set(0, -d * VS, .9); S.add(ring); }
    // the rising water (unit cylinder scaled per frame) and the churning white head
    const wat = WORLD.water(new THREE.CylinderGeometry(BR - .2, BR - .2, 1, 24), { col: '#4F97CC' }); wat.position.z = .9; S.add(wat);
    const head = new THREE.Group(); S.add(head);
    for (let i = 0; i < 9; i++) { const b = P3.mesh(new THREE.IcosahedronGeometry(.8 + hash(i * 3.1) * .55, 1), i % 2 ? '#EEF5F6' : '#DDEBF0', { style: .6, cast: false }); b.userData.o = [(hash(i * 5.3) - .5) * 2.2, hash(i * 7.7) * 1.6, .9 + (hash(i * 2.2) - .3) * 1.1]; head.add(b); }
    return { o, S, U, wat, head, cam: P3.cam(40) };
  });
  // depth of the water's head (ft) through G5: gathering at the bottom, then racing up, bursting out at the top
  const headFt = lt => kf(lt, [[0, 4050], [.45, 3985], [.9, 3650], [3.35, 260], [3.85, 0], [4.28, -35]], x => { x = clamp(x); return x * x * (3 - 2 * x); });
  // A whip pan's smear: horizontal pencil streaks over the frame, k 0..1 how fast the camera is moving
  function whipSmear(k, dir = 1) {
    if (k <= .02) return;
    seed('whip');
    X.save(); X.globalAlpha = .35 * k; X.fillStyle = '#E8D6B8'; X.fillRect(0, 0, W, H); X.restore();
    for (let i = 0; i < 70; i++) {
      const y = hash(i * 3.7) * H, x0 = (hash(i * 5.1) - .3) * W, L = (300 + hash(i * 7.3) * 900) * k;
      pline([[x0, y], [x0 + dir * L, y + (hash(i * 9.1) - .5) * 6]], .8 + hash(i) * 2.2, i % 3 ? AP.graphiteLt : AP.graphite, { alpha: .55 * k, passes: 1, over: 0, j: .4 });
    }
  }
  function hatchIris(cx, cy, r) {
    X.save(); X.beginPath(); X.rect(-60, -60, W + 120, H + 120); X.moveTo(cx + Math.max(0, r), cy); X.arc(cx, cy, Math.max(0, r), 0, TAU, true);
    X.globalAlpha = .78; X.fillStyle = AP.graphite; X.fill('evenodd');
    X.globalAlpha = 1; X.fillStyle = pat(AP.graphite, 'h'); X.fill('evenodd'); X.fillStyle = pat(AP.graphite, 'x'); X.fill('evenodd'); X.restore();
    if (r > 4) { seed('iris'); pline(ellPts(cx, cy, r, r, 44, 1.2), 2.2, AP.graphite, { closed: true }); }
  }
  // depth scale down the face (the brief's ruler, in perspective): ticks every 100 ft, lettered every 500
  function ruler3(cam, U, d0, d1, x = -12) {
    seed('Gruler');
    const a = P3.project(cam, [x, U.y(Math.max(0, d0)), .4]), b = P3.project(cam, [x, U.y(d1), .4]);
    pline([[a[0], a[1]], [b[0], b[1]]], 1.3, AP.bone, { over: 0, alpha: .9 });
    for (let d = Math.max(0, Math.ceil(d0 / 100) * 100); d <= d1; d += 100) {
      const big = d % 500 === 0, p = P3.project(cam, [x, U.y(d), .4]), q = P3.project(cam, [x + (big ? 2.2 : 1), U.y(d), .4]);
      pline([[p[0], p[1]], [q[0], q[1]]], big ? 1.4 : .8, AP.bone, { over: 0, passes: 1, alpha: .9 });
      if (big && d > 0) label(`${d} FT`, q[0] + 12, q[1], 34, AP.bone, { screen: true });
    }
  }
  // G5 · 234.17 · [56] "It's rushing up the tubing from four thousand feet below": the section, three-quarter on. The
  // water breaks in from the sandstone at 4,020 ft and races up the casing past every stratum; the camera rises with
  // the head, pulling back to show the height of it, and closes in as it reaches the surface. Iris in from G4.
  function g5(t, lt, dur) {
    const C = SECT(), { U, S, cam } = C, VS = U.VS, D = headFt(lt), yH = U.y(Math.max(-8, D)), yB = U.y(4020);
    // water column from the bottom of the hole to the head
    C.wat.scale.set(1, Math.max(.01, yH - yB), 1); C.wat.position.y = (yH + yB) / 2;
    C.head.position.set(0, yH, 0);
    C.head.children.forEach((b, i) => { const [x, y, z] = b.userData.o, w = Math.sin(t * (9 + i) + i * 2); b.position.set(x * (1 + .25 * w), y + .35 * Math.sin(t * 13 + i), z); b.scale.setScalar(1 + .22 * w); });
    // the aquifer's water lights up blue as it gives
    const dist = kf(lt, [[0, 40], [.9, 58], [2.0, 80], [3.2, 80], [3.9, 52], [4.28, 46]]), lead = kf(lt, [[0, 3], [1.2, 9], [3.4, 7], [4.28, 3]]);
    // the head rides in the upper-middle of the frame, the column below it; the camera a little below, looking up
    const ty = Math.min(yH, 1.5) - dist * .1, cy = ty - dist * .07;
    cam.fov = 40; cam.updateProjectionMatrix();
    P3.look(cam, [dist * .4, cy, dist * .9], [0, ty, 0], 0);
    o_sunFollow(C, cy);
    sky('#E6D4B4', '#E6D4B4', { still: true, hatch: .4 });
    P3.draw(C.o, cam, { fog: [120, 2400], fogCol: AP.paper, lineW: 1.5, lightTint: .3, far: 3000 });
    // rushing: streaks racing up inside the column, spray off the head
    const [hx, hy, hd, hr] = proj(cam, [0, yH, 1.6], 2.2);
    // the column glows a little against the dark bore, so the eye rides up with it
    for (let k = 0; k < 6; k++) { const yy = yH - k * 6; if (yy < yB) break; const [gx, gy, gd, gr] = proj(cam, [0, yy, 1.6], 4.5); if (gd > 0) pglow(gx, gy, gr, '#BFE2F2', .22); }
    seed('g5streaks');
    for (let i = 0; i < 26; i++) {
      const q = frac(t * 3.1 + hash(i * 1.7)), yy = yH - q * (dist * .9 + 20), yy2 = yy + 3 + 6 * (1 - q); if (yy < yB) continue;
      const p1 = P3.project(cam, [(hash(i * 3.3) - .5) * 2.4, yy, 2.3]), p2 = P3.project(cam, [(hash(i * 3.3) - .5) * 2.4, Math.min(yH, yy2), 2.3]);
      pline([[p1[0], p1[1]], [p2[0], p2[1]]], 1.2, '#EAF6FA', { over: 0, passes: 1, alpha: .85 });
    }
    if (hd > 0) { pglow(hx, hy, hr * 3, '#DDF0F8', .5); for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (hash(i * 2.1 + Math.floor(t * 12)) - .5) * 2.2, L = hr * (1.2 + hash(i * 4.4 + Math.floor(t * 12)) * 1.8); pline([[hx + Math.cos(a) * hr * .4, hy + Math.sin(a) * hr * .4], [hx + Math.cos(a) * L, hy + Math.sin(a) * L]], 1.2, '#F2FAFC', { over: 0, passes: 1, alpha: .8 }); } }
    // bursting out at the top: a fountain of spray over the casing mouth (the section's scale is 10:1, so it is drawn)
    const burst = seg(lt, 3.8, 4.28);
    if (burst > 0) { const [bx, by, bd, br] = proj(cam, [0, 0, 1.4], 2.2); if (bd > 0) {
      seed('g5burst'); const hgt = br * 5 * easeOut(burst);
      pglow(bx, by - hgt * .5, hgt * .9, '#E4F4FA', .55);
      for (let i = 0; i < 30; i++) { const a = -Math.PI / 2 + (hash(i * 1.9) - .5) * 1.5 * (.4 + .6 * burst), L = hgt * (.4 + .6 * hash(i * 3.7)), c = [bx + Math.cos(a) * L, by + Math.sin(a) * L]; pline([[bx + Math.cos(a) * br * .3, by], c], 1.6, '#F2FAFC', { over: 0, passes: 1, alpha: .85 }); }
      steamPuff(bx, by - hgt, br * 1.4 * (.5 + burst), .7, { lx: .3, ly: -.9 });
    } }
    // the water breaking in from the sandstone at the bottom
    if (lt < 1.6) for (let i = 0; i < 18; i++) {
      const side = i % 2 ? 1 : -1, q = frac(t * 1.6 + hash(i * 2.9)), x0 = side * (4 + hash(i * 5.1) * 16), yy = yB - 1 - hash(i * 6.3) * 12;
      const p1 = P3.project(cam, [lerp(x0, side * 1.2, q), lerp(yy, yB + .5, q), .5]), p2 = P3.project(cam, [lerp(x0, side * 1.2, q + .12), lerp(yy, yB + .5, q + .12), .5]);
      pline([[p1[0], p1[1]], [p2[0], p2[1]]], 1.3, '#D8EEF6', { over: 0, passes: 1, alpha: .9 * (1 - seg(lt, 1.1, 1.6)) });
    }
    ruler3(cam, U, D - dist * 5.5, D + dist * 5.5);
    if (lt < .35) hatchIris(...(() => { const q = P3.project(cam, [0, yB + 2, 1]); return [q[0], q[1]]; })(), lerp(0, 1300, easeIn(lt / .35)));
  }
  function o_sunFollow(C, cy) { C.o.sun.target.position.set(0, cy, 0); C.o.sun.position.set(-45, cy + 40, 80); C.o.sun.target.updateMatrixWorld(); }

  // G6 · 238.45 · [57] "Till it spouts above the casing in a million-gallon flow": low in front of the derrick, looking
  // east into the sunrise. A glassy dome swells over the casing mouth and the crew step back; the jet climbs, hits
  // the walking beam's head and engulfs it, and goes on up into a broken white crown with steam boiling off it,
  // the sun behind it all. The camera cranes up and back to hold the whole column. Match cut on the burst from G5.
  const CREW6 = { driller: [[-3.2, -.9], [-6.6, 1.6]], dresser: [[3.3, 1.2], [7.0, 3.2]], boss: [[-2.1, 3.3], [-4.6, 7.2]], hand: [[1.9, 3.7], [3.6, 7.8]], lab: [[4.2, -2.4], [8.2, -3.4]] };
  function crewAround(S, t, o = {}) {
    const U = S.U, back = easeOut(seg(t, T_SPOUT + .1, T_SPOUT + .75));
    for (const [n, [a, b]] of Object.entries(CREW6)) {
      const p = S.P[n], x = lerp(a[0], b[0], back), z = lerp(a[1], b[1], back), yaw = Math.atan2(-x, -z);
      PEOPLE.at(p, [x, U.floorY, z], yaw); PEOPLE.clip(p, back > 0 && back < 1 ? 'Walk_Loop' : 'Idle_Loop', t * (back < 1 ? -1.1 : .8) + hash(n.length) * 3);
      PEOPLE.turn(p, 'neck_01', [-.25 * back, 0, 0]); PEOPLE.turn(p, 'Head', [-.3 * back, 0, 0]);
    }
    const t1 = T_SPOUT + 1.0;
    cheerArm(S.P.dresser, 'r', t, t1 + .1); cheerArm(S.P.dresser, 'l', t, t1 + .25);
    cheerArm(S.P.lab, 'l', t, t1 + .35); cheerArm(S.P.hand, 'r', t, t1 + .2); cheerArm(S.P.hand, 'l', t, t1 + .5);
    cheerArm(S.P.boss, 'r', t, t1 + .6, { rate: 5 });
  }
  function g6(t, lt, dur) {
    const S = SITE(), { U, P } = S, cam = S.cams.a;
    cast(S, ['driller', 'dresser', 'boss', 'hand', 'lab', 'bill']); bareheaded(S); restRig(S, { rods: false }); setFlood(S, t); setColumn(S, t);
    crewAround(S, t);
    billWhistle(S, t, .3);
    // low and close on the dome, then a crane up and back to the whole column (held long at the end)
    const k = ease(seg(lt, .7, 3.6)), k1 = easeOut(seg(lt, .55, 1.5));
    cam.fov = 46; cam.updateProjectionMatrix();
    const cp = [lerp(-22, -44, k), lerp(3.4, 5.0, k), lerp(27, 54, k)], tg = [lerp(0, 1, k), lerp(8, 24, k * .8 + k1 * .2), 0];
    // the whip pan out: the camera swings hard right in the last .3 s
    const wk = easeIn(seg(lt, dur - .3, dur)) * .9, dx = tg[0] - cp[0], dz = tg[2] - cp[2], c = Math.cos(-wk), s2 = Math.sin(-wk);
    P3.look(cam, cp, [cp[0] + dx * c - dz * s2, tg[1], cp[2] + dx * s2 + dz * c], 0);
    dawnSky(seg(lt, .8, dur) * .8); dawnSun(cam);
    P3.draw(S.o, cam, { fog: [160, 1500], fogCol: GOLD, lineW: 1.7, lightTint: .62 });
    sunFlare(cam, .5);
    flowFX(cam, t, { lx: -.9, ly: .2, face: -.6, backlit: 1, curtain: .5 });
    // the sun through the spray
    const [sx, sy, sd] = sunScreen(cam); if (sd > 0) pglow(sx, sy, 420, '#FFD58A', .35 * jetK(t));
    whipSmear(easeIn(seg(lt, dur - .3, dur)), -1);
  }

  // The rainbow: the true 42° circle round the antisolar point (so it only appears with the sun behind the camera),
  // drawn as coloured pencil bands, and only where there is spray to hold it (mask round the column on screen).
  function rainbow(cam, k, mask) {
    if (k <= 0) return;
    const A = V3(-SUNN[0], -SUNN[1], -SUNN[2]), e1 = new THREE.Vector3().crossVectors(A, V3(0, 1, 0)).normalize(), e2 = new THREE.Vector3().crossVectors(e1, A).normalize();
    const bands = [[42.3, '#D2694C'], [41.95, '#DE9A4C'], [41.6, '#E2CC6A'], [41.25, '#8DBB78'], [40.9, '#6E9ECC'], [40.55, '#8878B6']];
    seed('rainbow');
    for (const [deg, col] of bands) {
      const r = deg * Math.PI / 180, pts = [];
      for (let i = 0; i <= 48; i++) {
        const ph = lerp(-.15, Math.PI + .15, i / 48), d = A.clone().multiplyScalar(Math.cos(r)).add(e1.clone().multiplyScalar(Math.cos(ph) * Math.sin(r))).add(e2.clone().multiplyScalar(Math.sin(ph) * Math.sin(r)));
        const q = P3.project(cam, cam.position.clone().add(d.multiplyScalar(2000)).toArray()); if (q[2] > 0) pts.push([q[0], q[1]]);
      }
      // draw in short runs so the alpha can follow the spray mask
      for (let i = 0; i + 1 < pts.length; i++) { const m = mask(pts[i][0], pts[i][1]) * k; if (m > .02) pline([pts[i], pts[i + 1]], 3.2, col, { alpha: m * .62, passes: 1, over: 0, j: .5 }); }
    }
  }
  // G7 · 243.61 · [58] "It's flowing, ever flowing": the reverse, from the east with the sun behind the camera. The crew
  // stand in the falling water, faces up in the low gold light, arms open; the rainbow hangs in the spray behind
  // them. The bull wheel frames the left. A whip pan out of G6.
  const CREW7 = { driller: [-1.0, -14.4, .05], dresser: [1.9, -13.8, -.12], hand: [-3.7, -14.0, .2], boss: [4.1, -15.1, -.25], lab: [-6.0, -15.3, .3] };
  function g7(t, lt, dur) {
    const S = SITE(), { U, P } = S, cam = S.cams.a, fy = U.floorY;
    cast(S, ['driller', 'dresser', 'boss', 'hand', 'lab']); bareheaded(S); restRig(S, { rods: false }); setFlood(S, t); setColumn(S, t);
    for (const [n, [x, z, yw]] of Object.entries(CREW7)) {
      const p = P[n]; PEOPLE.at(p, [x, 0, z], Math.PI + yw); PEOPLE.clip(p, 'Idle_Loop', t * .75 + hash(n.length * 3) * 4);
      const up = ease(seg(lt, .1 + hash(n.length) * .5, 1.2 + hash(n.length) * .5));
      PEOPLE.turn(p, 'spine_03', [-.12 * up, 0, 0]); PEOPLE.turn(p, 'neck_01', [-.32 * up, 0, 0]); PEOPLE.turn(p, 'Head', [-.42 * up, 0, 0]);
    }
    // hands clasped along the line and raised together (screen left to right: boss, dresser, driller, hand, lab);
    // each pair's hands meet between their shoulders, the outer hands open to the water
    const LINE = ['boss', 'dresser', 'driller', 'hand', 'lab'], rise = ease(seg(lt, .45, 1.5));
    for (let i = 0; i + 1 < LINE.length; i++) {
      const A = P[LINE[i]], B = P[LINE[i + 1]], sa = wp(A.bones.upperarm_l), sb = wp(B.bones.upperarm_r);
      const m = sa.clone().add(sb).multiplyScalar(.5).add(V3(0, lerp(-1.6, 1.25 + .1 * Math.sin(t * 2.2 + i), rise), -.35 * rise)), dir = sb.clone().sub(sa).normalize();
      gripAt(A, 'l', m.clone().sub(dir.clone().multiplyScalar(.07)).toArray(), sa.clone().add(V3(0, -1.2, .4)).add(dir.clone().multiplyScalar(-.6)).toArray(), .2);
      gripAt(B, 'r', m.clone().add(dir.clone().multiplyScalar(.07)).toArray(), sb.clone().add(V3(0, -1.2, .4)).add(dir.clone().multiplyScalar(.6)).toArray(), .2);
    }
    for (const [n, side] of [['boss', 'r'], ['lab', 'l']]) {
      const p = P[n], F = frameOf(p), sg = side === 'r' ? 1 : -1, sh = wp(p.bones['upperarm_' + side]);
      const up = sh.clone().add(F.right.clone().multiplyScalar(.9 * sg)).add(V3(0, 1.3 + .1 * Math.sin(t * 2.6), 0)).add(F.fwd.clone().multiplyScalar(.35));
      PEOPLE.reach(p, side, PEOPLE.hand(p, side).lerp(up, rise).toArray(), sh.clone().add(F.right.clone().multiplyScalar(1.1 * sg)).add(V3(0, -1, -.3)).toArray());
    }
    const k = ease(seg(lt, 0, dur));
    cam.fov = 46; cam.updateProjectionMatrix();
    // arriving out of the whip pan: the look swings in from the left and settles
    const wk = (1 - easeOut(seg(lt, 0, .32))) * .8, cp7 = [lerp(.6, .1, k), lerp(2.7, 3.0, k), lerp(-27.5, -26.0, k)], tg7 = [lerp(-.3, -.4, k), lerp(7.3, 7.9, k), -8];
    const dx7 = tg7[0] - cp7[0], dz7 = tg7[2] - cp7[2], c7 = Math.cos(wk), s7 = Math.sin(wk);
    P3.look(cam, cp7, [cp7[0] + dx7 * c7 - dz7 * s7, tg7[1], cp7[2] + dx7 * s7 + dz7 * c7], .01);
    dawnSky(.9, true);
    P3.draw(S.o, cam, { fog: [150, 1500], fogCol: '#EDD3B4', lineW: 1.8, lightTint: .66 });
    const [cx] = P3.project(cam, [0, 14, 0]), [, cyTop] = P3.project(cam, [0, 33, 0]), [, cyBot] = P3.project(cam, [0, 2, 0]);
    rainbow(cam, ease(seg(lt, .2, 1.4)), (x, y) => Math.exp(-Math.pow((x - cx) / 520, 2)) * clamp((cyBot - y) / 260) * clamp((y - cyTop + 200) / 300));
    flowFX(cam, t, { lx: .1, ly: -.95, face: Math.PI, mist: .35 });
    // the water coming down on them
    seed('g7rain');

    for (let i = 0; i < 90; i++) {
      const q = frac(t * 1.9 + hash(i * 1.3)), x = (hash(i * 2.7) - .5) * 16, z = -9 - hash(i * 3.9) * 6, y = lerp(20, .3, q);
      const A = P3.project(cam, [x, y, z]), B = P3.project(cam, [x - .05, y + 1.4, z]);
      if (A[2] > .5) pline([[B[0], B[1]], [A[0], A[1]]], 1.3, '#F4FAFC', { alpha: .7, passes: 1, over: 0 });
    }
    if (lt < .32) whipSmear(1 - easeOut(lt / .32), -1);
    if (lt > dur - .35) pageTurn((lt - (dur - .35)) / .7, 1);
  }

  shots([[222.73, g1], [225.97, g2], [229.85, g3], [232.1, g4], [234.17, g5], [238.45, g6], [243.61, g7], [247.61, g8], [250.31, g9], [252.55, g10], [255.61, g11]]);
})();
