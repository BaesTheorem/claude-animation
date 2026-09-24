// artesian/rig3d.js: the boring plant, in 3D, true to an 1890s percussion rig. Units: feet, y up. The bore is at the
// origin; the derrick stands over it, the walking beam runs out along +x to the band wheel and crank, and the
// portable steam engine sits beyond, belted to the band wheel. The forge and tool shed are off to -x.
//
//   const R = RIG.build(o)          a THREE.Group with named moving parts in R.userData (see below). Add R to a scene.
//   RIG.pose(R, s)                  set the machine's state for this frame. s:
//       stroke    0..1 through one drilling stroke: the well end of the beam lifts the rod string slowly (0 → .75),
//                 then drops it (.75 → 1) so the bit strikes on 1. Use RIG.strokeAt(t) for strokes locked to the beat.
//       amp       stroke length multiplier (0 = beam still, 1 = full ~3 ft at the well end)
//       fly       engine flywheel angle (radians); the band wheel turns with it through the belt
//       bull      bull wheel (hoisting drum) angle; rope       0..1 how much drilling cable is paid out
//       smokeK    stack smoke 0..1 (for 2D smoke you add yourself at R.userData.stackTop)
//   Anchors in R.userData (world points; call R.updateMatrixWorld first): hole, wellEnd, crank, bandWheel, fly,
//   firebox, stackTop, whistle, throttle, brake, forge, anvil, quench, tongsGrip, tiller (the driller's turning bar),
//   floorY (derrick floor height)
//   RIG.strokeAt(t, every)          stroke phase from the song: a blow lands on the beat every `every` beats (default 2)
const RIG = (() => {
  const T = () => THREE;
  const TIMBER = '#A07A52', TIMBER_DK = '#6E5238', IRON = '#4A4744', IRON_LT = '#7C7770', BRASS = '#B8963E', PINE = '#D8B060';
  function beamM(a, b, w, d, col) { return P3.beam(a, b, w, d, col); }
  function build(o = {}) {
    const THREE = T(), R = new THREE.Group(), U = R.userData;
    const H = o.derrick ?? 62, b0 = 8.5, b1 = 1.8, floorY = 2.2;
    const add = (m, p) => { if (p) m.position.set(...p); R.add(m); return m; };
    // ---- derrick: four battered legs, girts, diagonal braces, ladder, crown block ----
    const legs = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) => [[sx * b0, 0, sz * b0], [sx * b1, H, sz * b1]]);
    const at = (L, k) => L[0].map((v, i) => v + (L[1][i] - v) * k);
    for (const L of legs) add(beamM(L[0], L[1], 1.0, 1.0, TIMBER));
    const lv = [.1, .26, .42, .57, .71, .84, .95];
    for (let k = 0; k < lv.length; k++) for (let i = 0; i < 4; i++) {
      const A = legs[i], B = legs[(i + 1) % 4];
      add(beamM(at(A, lv[k]), at(B, lv[k]), .5, .5, TIMBER));
      if (k < lv.length - 1) add(beamM(at(A, lv[k]), at(B, lv[k + 1]), .32, .32, TIMBER_DK));
    }
    for (let k = 0; k < 28; k++) { const y = 3 + k * 2.1; const L = legs[2], s = y / H, p = at(L, s); add(beamM([p[0] - 1.2, y, p[2] + .2], [p[0] + .4, y, p[2] + .2], .18, .18, TIMBER_DK)); }
    add(P3.mesh(P3.box(5.5, 1.2, 5.5), TIMBER_DK), [0, H + .4, 0]);
    const sheave = add(P3.mesh(new THREE.CylinderGeometry(1.4, 1.4, .5, 20), IRON), [0, H + 1.6, 0]); sheave.rotation.x = Math.PI / 2;
    // derrick floor (planked), with the casing head at the hole
    add(P3.mesh(P3.box(2 * b0 + 6, .6, 2 * b0 + 6), PINE), [0, floorY - .3, 0]);
    for (let i = 0; i < 12; i++) add(P3.mesh(P3.box(.12, .62, 2 * b0 + 6), TIMBER_DK, { cast: false }), [-b0 - 3 + (i + .5) * (2 * b0 + 6) / 12, floorY - .29, 0]);
    add(P3.mesh(P3.cyl(.75, .75, 1.6, 20), IRON), [0, floorY + .8, 0]);                 // casing head
    add(P3.mesh(P3.cyl(.95, .95, .35, 20), IRON_LT), [0, floorY + 1.55, 0]);             // collar
    // ---- samson post and walking beam (pivot at x = 15) ----
    const pivot = [15, 15, 0];
    add(beamM([13.5, 0, 0], [15, 14.2, 0], 1.3, 1.3, TIMBER)); add(beamM([16.5, 0, 0], [15, 14.2, 0], 1.3, 1.3, TIMBER));
    add(P3.mesh(P3.box(2.2, 1.2, 1.8), TIMBER_DK), [15, 14.5, 0]);
    const beamG = new THREE.Group(); beamG.position.set(...pivot); R.add(beamG);
    const wb = P3.mesh(P3.box(26, 1.6, 1.2), TIMBER); wb.position.set(-2, 0, 0); beamG.add(wb);           // well end at x = -13 (over the hole)
    const horse = P3.mesh(P3.box(1.2, 2.2, 1.3), IRON); horse.position.set(-15, -.4, 0); beamG.add(horse);
    for (const x of [-10, -4, 4, 9]) { const strap = P3.mesh(P3.box(.25, 1.7, 1.3), IRON); strap.position.set(x, 0, 0); beamG.add(strap); }
    // temper screw hanging from the well end, carrying the rod string
    const temper = new THREE.Group(); R.add(temper);
    temper.add(P3.mesh(P3.cyl(.18, .18, 5.5, 10), IRON_LT)); temper.children[0].position.y = -2.75;
    const tclamp = P3.mesh(P3.box(1.6, .5, .6), IRON); tclamp.position.y = -5.4; temper.add(tclamp);
    // the rod string (wooden rods with iron joints) from the temper screw down through the casing head
    const rods = new THREE.Group(); R.add(rods);
    const rodM = P3.mesh(P3.cyl(.22, .22, 1, 10), PINE); rods.add(rodM);
    const jointM = P3.mesh(P3.cyl(.34, .34, .9, 10), IRON); rods.add(jointM);
    // the driller's tiller: a bar clamped across the rods for turning the string a little each stroke
    const tiller = P3.mesh(P3.box(4.2, .22, .22), IRON_LT); R.add(tiller);
    // ---- band wheel (on the crank shaft) and pitman ----
    const bandC = [31, 7.5, 0];
    add(P3.mesh(P3.box(1.6, 5, 7), TIMBER_DK), [bandC[0], 2.5, 3.2]); add(P3.mesh(P3.box(1.6, 5, 7), TIMBER_DK), [bandC[0], 2.5, -3.2]);
    const band = new THREE.Group(); band.position.set(...bandC); R.add(band);
    const rim = P3.mesh(new THREE.TorusGeometry(5.2, .45, 8, 48), TIMBER); band.add(rim);
    for (let i = 0; i < 8; i++) { const sp = P3.mesh(P3.box(.35, 10.2, .35), TIMBER); sp.rotation.z = i / 8 * Math.PI; band.add(sp); }
    band.add(P3.mesh(P3.cyl(.8, .8, 2.4, 14).rotateX(Math.PI / 2), IRON));
    const crankArm = P3.mesh(P3.box(.5, 2.8, .4), IRON); crankArm.position.set(0, 1.2, 1.6); band.add(crankArm);
    const pitman = P3.mesh(P3.box(.9, 1, .9), TIMBER); R.add(pitman);
    // ---- bull wheel (hoisting drum) beside the derrick, and the sand reel ----
    const bull = new THREE.Group(); bull.position.set(6, 4.5, -12); R.add(bull);
    for (const z of [-2.2, 2.2]) { const w = P3.mesh(new THREE.TorusGeometry(3.6, .3, 8, 40), TIMBER); w.position.z = z; bull.add(w); for (let i = 0; i < 6; i++) { const sp = P3.mesh(P3.box(.25, 7.2, .25), TIMBER_DK); sp.rotation.z = i / 6 * Math.PI; sp.position.z = z; bull.add(sp); } }
    const drum = P3.mesh(P3.cyl(1.1, 1.1, 4.4, 16).rotateX(Math.PI / 2), '#8C7A5E'); bull.add(drum);
    for (const z of [-2.2, 2.2]) add(P3.mesh(P3.box(1, 4.5, 1), TIMBER_DK), [6, 2.25, -12 + z * 1.25]);
    const reel = new THREE.Group(); reel.position.set(-9, 3.2, -11); R.add(reel);
    reel.add(P3.mesh(P3.cyl(.8, .8, 3, 12).rotateX(Math.PI / 2), '#8C7A5E'));
    for (const z of [-1.5, 1.5]) { const f = P3.mesh(new THREE.CylinderGeometry(1.8, 1.8, .2, 18).rotateX(Math.PI / 2), TIMBER); f.position.z = z; reel.add(f); }
    // ---- portable steam engine: boiler on wheels, smokebox and stack, cylinder and flywheel on top ----
    const eng = new THREE.Group(); eng.position.set(46, 0, 0); eng.rotation.y = Math.PI / 2; R.add(eng);
    const barrel = P3.mesh(P3.cyl(2.3, 2.3, 11, 28).rotateZ(Math.PI / 2), '#4E5A52'); barrel.position.set(0, 5.4, 0); eng.add(barrel);
    for (let i = 0; i < 4; i++) { const band2 = P3.mesh(P3.cyl(2.38, 2.38, .25, 28).rotateZ(Math.PI / 2), BRASS); band2.position.set(-4 + i * 2.6, 5.4, 0); eng.add(band2); }
    const firebox = P3.mesh(P3.box(4.2, 6.4, 5), '#3E4842'); firebox.position.set(-7.4, 4.6, 0); eng.add(firebox);
    const door = P3.mesh(P3.box(.2, 1.5, 1.8), '#1E1A18'); door.position.set(-9.55, 3.8, 0); eng.add(door);
    const smokebox = P3.mesh(P3.cyl(2.5, 2.5, 2.6, 28).rotateZ(Math.PI / 2), '#343C38'); smokebox.position.set(6.6, 5.4, 0); eng.add(smokebox);
    const stack = P3.mesh(P3.cyl(.75, .85, 9, 16), '#2E3432'); stack.position.set(6.6, 12, 0); eng.add(stack);
    const cap = P3.mesh(P3.cyl(1.05, .8, .8, 16), IRON); cap.position.set(6.6, 16.8, 0); eng.add(cap);
    const cylinder = P3.mesh(P3.cyl(.9, .9, 3.4, 16).rotateZ(Math.PI / 2), IRON); cylinder.position.set(2.2, 8.2, 0); eng.add(cylinder);
    const fly = new THREE.Group(); fly.position.set(-3.2, 9.2, 2.9); eng.add(fly);
    fly.add(P3.mesh(new THREE.TorusGeometry(3.1, .32, 8, 40), IRON));
    for (let i = 0; i < 6; i++) { const sp = P3.mesh(P3.box(.25, 6.1, .2), IRON); sp.rotation.z = i / 6 * Math.PI; fly.add(sp); }
    fly.add(P3.mesh(P3.cyl(.5, .5, .8, 12).rotateX(Math.PI / 2), BRASS));
    const whistle = P3.mesh(P3.cyl(.18, .24, 1.3, 10), BRASS); whistle.position.set(-6.3, 8.6, 0); eng.add(whistle);
    const gauge = P3.mesh(P3.cyl(.55, .55, .2, 16).rotateZ(Math.PI / 2), BRASS); gauge.position.set(-9.6, 6.8, -1.2); eng.add(gauge);
    for (const [x, r] of [[-5.5, 2.4], [5, 2]]) for (const z of [-2.9, 2.9]) { const wh = P3.mesh(new THREE.TorusGeometry(r, .22, 6, 32), IRON); wh.position.set(x, r, z); eng.add(wh); for (let i = 0; i < 6; i++) { const sp = P3.mesh(P3.box(.16, 2 * r, .14), IRON); sp.rotation.z = i / 6 * Math.PI; sp.position.set(x, r, z); eng.add(sp); } }
    const throttle = P3.mesh(P3.box(.2, 1.8, .2), IRON_LT); throttle.position.set(-9.8, 6, 1.4); eng.add(throttle);
    // drive belt from the flywheel to the band wheel (two straight runs)
    const beltA = P3.mesh(P3.box(1, .12, 1), '#3A2E24', { cast: false }), beltB = P3.mesh(P3.box(1, .12, 1), '#3A2E24', { cast: false }); R.add(beltA); R.add(beltB);
    // ---- forge and anvil under a bark-roofed shed (off to -x), with the quench tub ----
    const shed = new THREE.Group(); shed.position.set(-26, 0, 10); R.add(shed);
    for (const [x, z] of [[-6, -5], [6, -5], [-6, 5], [6, 5]]) { const p = P3.mesh(P3.box(.6, 9, .6), TIMBER_DK); p.position.set(x, 4.5, z); shed.add(p); }
    const roof = P3.mesh(P3.box(14, .5, 12), '#7A6A58'); roof.position.set(0, 9.2, 0); roof.rotation.x = .12; shed.add(roof);
    const forge = P3.mesh(P3.box(4, 3, 3.2), '#6E5E50'); forge.position.set(-3, 1.5, -2.5); shed.add(forge);
    const hearth = P3.mesh(P3.box(3, .3, 2.4), '#2A2220', { style: .6 }); hearth.position.set(-3, 3.05, -2.5); shed.add(hearth);
    const hood = P3.mesh(P3.cyl(.6, 1.6, 2, 12), IRON); hood.position.set(-3, 6.2, -2.8); shed.add(hood);
    const chim = P3.mesh(P3.cyl(.45, .45, 5, 10), IRON); chim.position.set(-3, 9.6, -2.8); shed.add(chim);
    const anvil = new THREE.Group(); anvil.position.set(2, 0, -1); shed.add(anvil);
    const stump = P3.mesh(P3.cyl(1, 1.1, 2.2, 14), TIMBER_DK); stump.position.y = 1.1; anvil.add(stump);
    const aw = P3.mesh(P3.box(2.6, .9, .9), IRON); aw.position.y = 2.65; anvil.add(aw);
    const horn = P3.mesh(P3.cyl(.05, .42, 1.2, 10).rotateZ(Math.PI / 2), IRON); horn.position.set(1.85, 2.8, 0); anvil.add(horn);
    const tub = P3.mesh(P3.cyl(1.3, 1.1, 1.8, 16), TIMBER_DK); tub.position.set(4.5, .9, 2); shed.add(tub);
    // ---- spare rods on a rack, gidgee woodpile by the engine, water barrels ----
    for (let i = 0; i < 9; i++) add(beamM([-20 + i * .55, 1.2, -22], [-20 + i * .55, 1.2, 6], .38, .38, PINE));
    for (const z of [-22, -8, 5]) add(P3.mesh(P3.box(6, .6, .6), TIMBER_DK), [-18, .5, z]);
    for (let i = 0; i < 26; i++) { const h1 = x => { const v = Math.sin(x * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); }; const lg = beamM([38 + h1(i) * 5, .6 + (i % 5) * .75, 9 + (i % 3) * .6], [38 + h1(i) * 5 + 6, .6 + (i % 5) * .75, 9 + h1(i + 7) * 2], .55, .55, '#7A5A40'); add(lg); }
    for (const [x, z] of [[40, -8], [42, -9]]) add(P3.mesh(P3.cyl(1.2, 1.2, 3.2, 14), TIMBER_DK), [x, 1.6, z]);
    Object.assign(U, { beamG, temper, rods, rodM, jointM, tiller, band, crankArm, pitman, bull, reel, fly, eng, beltA, beltB, shed, H, floorY, pivot, bandC });
    pose(R, { stroke: 0, amp: 0, fly: 0 });
    return R;
  }
  const _v = () => new (T().Vector3)();
  function pose(R, s = {}) {
    const THREE = T(), U = R.userData, amp = s.amp ?? 1, st = s.stroke ?? 0;
    // beam angle: the well end rises through the slow lift, then drops fast onto the blow at stroke = 1
    const lift = st < .75 ? Math.sin(st / .75 * Math.PI / 2) : 1 - Math.pow((st - .75) / .25, 2);
    const ang = lift * .12 * amp;                    // radians; well end is at -x, so positive z-rotation lifts it
    U.beamG.rotation.z = -ang;
    R.updateMatrixWorld(true);
    const well = new THREE.Vector3(-15, -.4, 0).applyMatrix4(U.beamG.matrixWorld);
    U.temper.position.copy(well);
    const top = well.y - 5.6, bottom = U.floorY + 1.7;
    const L = Math.max(.1, top - bottom);
    U.rodM.scale.set(1, L + 2, 1); U.rodM.position.set(0, (top + bottom) / 2 - 1, 0);
    U.jointM.position.set(0, top - .5, 0);
    U.tiller.position.set(0, bottom + 2.4 + (top - bottom) * .15, 0); U.tiller.rotation.y = s.turn ?? 0;
    // band wheel follows the flywheel through the belt; the crank drives the pitman up to the crank end of the beam
    const bandA = (s.fly ?? 0) * (6.2 / 10.4);
    U.band.rotation.z = s.bandAngle ?? bandA;
    U.fly.rotation.z = s.fly ?? 0;
    const crankEnd = new THREE.Vector3(10.5, -.4, 0).applyMatrix4(U.beamG.matrixWorld);
    const crankPin = new THREE.Vector3(...U.bandC).add(new THREE.Vector3(0, 2.4, 1.6));
    U.pitman.position.copy(crankEnd).add(crankPin).multiplyScalar(.5); U.pitman.scale.set(1, crankEnd.distanceTo(crankPin), 1);
    U.pitman.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), crankEnd.clone().sub(crankPin).normalize());
    U.bull.rotation.z = s.bull ?? 0; U.reel.rotation.z = s.reel ?? 0;
    // belt runs from the flywheel rim to the band wheel rim (top and bottom)
    R.updateMatrixWorld(true);
    const fc = _v(); U.fly.getWorldPosition(fc); const bc = new THREE.Vector3(...U.bandC);
    const run = (m, dy1, dy2) => { const a = fc.clone().add(new THREE.Vector3(0, dy1, 0)), b = bc.clone().add(new THREE.Vector3(0, dy2, 1.2)); m.position.copy(a).add(b).multiplyScalar(.5); m.scale.set(.9, 1, a.distanceTo(b)); m.lookAt(b); };
    run(U.beltA, 3.1, 5.2); run(U.beltB, -3.1, -5.2);
    // anchors for effects and hands
    const W = (o, p) => { const v = new THREE.Vector3(...p); return o.localToWorld(v); };
    U.hole = [0, U.floorY + 1.6, 0]; U.wellEnd = well.toArray(); U.tillerAt = U.tiller.position.toArray();
    U.stackTop = W(U.eng, [6.6, 17.4, 0]).toArray(); U.whistle = W(U.eng, [-6.3, 9.4, 0]).toArray(); U.firebox = W(U.eng, [-9.7, 3.8, 0]).toArray();
    U.throttle = W(U.eng, [-9.8, 6.9, 1.4]).toArray(); U.gauge = W(U.eng, [-9.7, 6.8, -1.2]).toArray(); U.flyC = fc.toArray();
    U.forge = W(U.shed, [-3, 3.3, -2.5]).toArray(); U.anvil = W(U.shed, [2, 3.1, -1]).toArray(); U.quench = W(U.shed, [4.5, 1.9, 2]).toArray();
    U.brake = [4.5, U.floorY + 3.2, -6.5];
  }
  // stroke phase locked to the song: a blow lands ON the beat every `every` beats (default 2 = 56 strokes a minute)
  function strokeAt(t, every = 2) { return frac(bpOf(t) / every + 1e-6); }
  return { build, pose, strokeAt };
})();
