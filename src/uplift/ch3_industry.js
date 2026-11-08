// uplift/ch3_industry.js: verse 3, industry (S11-S14). Furnace red dusk, then electric night.
// S11 coal and steam: the chimney (a match cut from the obelisk), a stoker at the firebox, a Watt beam engine starts.
// S12 the cogs spin wool: the flywheel cuts to the driving pulley of a self-acting mule in a wool mill at sunset. The
//     carriage draws out while the spindles twist the yarn, backs off, and winds the yarn on as it runs in. On the line's
//     middle downbeat, the steel horses: early motor cars overtake a horse and gig on the road below the mill at dusk.
// S13 banishing the night (knife switch, a wave of light), S14 reaching up (a crowd, a biplane takes off).
// Every mechanism is computed from one driving value: the beam engine from the crank angle (the beam angle is solved so
// the connecting rod keeps its length; Watt's parallel motion guides the piston rod); the mule from the pulley angle (belt
// and gear ratios) and the carriage position (threads, faller, quadrant, carriage wheels); every wheel from the distance
// it has rolled; the horse's hooves stay planted on the road while it trots (two-bone IK on a two-beat diagonal gait).
(() => {
  const { THREE, kf, seg, smooth, ease, easeIn, easeOut, lerp, clamp, hash, noise, B, LINE, sky, skyMix, litMat, silMat, glow, setGlow,
    sparks, terrain, ridge, grass, box, cyl, cone, sph, rod, setRod, gear, cam, puffTex, glowTex, beatAt, rock } = UP;
  const P = PEOPLE, PI = Math.PI, TAU = PI * 2, ASP = 16 / 9;
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const WALK = h => 1.15 / (.916 * h);          // Walk_Loop clip speed for 1.15 m/s at body height h (the clip covers .916 m/s per metre)

  // ---------------------------------------------------------------- sky presets
  const FURNACE = { zen: '#2E1B17', hor: '#C8431B', horK: .5, halo: '#FF6A2A', haloW: 1.5, haloH: .18, stars: 0, sunDir: [.25, -.07, -1], fogNear: 25, fogDen: .0016 };
  const MILL = { zen: '#381E27', hor: '#E9733F', horK: .55, halo: '#FF9450', haloW: 2.2, haloH: .16, sunDir: [-.6, .17, .78], sunCol: '#FFD7A2', sunSize: .016,
    sunGlow: .9, stars: 0, fogNear: 6, fogDen: .006, fogMax: .3, fogK: .4, rimK: 2.8, rimP: 5 };
  const ROAD = { zen: '#1E1931', hor: '#CC5631', horK: .5, halo: '#FF7442', haloW: 1.8, haloH: .15, sunDir: [.3, -.05, -1], sunCol: '#FFC08A', sunGlow: .45,
    stars: .06, fogNear: 12, fogDen: .011, fogMax: .9, rimK: 2.6 };
  const TWI13 = { zen: '#13205A', hor: '#6476B8', horK: .45, halo: '#D08A78', haloW: 2.4, haloH: .09, stars: .35, sunDir: [0, -.08, -1], fogNear: 25, fogDen: .0016 };
  const ELNIGHT = { zen: '#050920', hor: '#1B2E66', horK: .5, halo: '#26397F', haloW: 2, haloH: .1, stars: .5, sunDir: [0, -.3, -1], fogNear: 25, fogDen: .0012 };
  const TWILIGHT = { zen: '#101A47', hor: '#D9774F', horK: .42, halo: '#FF9A62', haloW: 2, haloH: .13, stars: .25, sunDir: [.45, -.09, -1], fogNear: 40, fogDen: .0012 };
  const SMOKE_COL = '#1A0F0D';

  // ---------------------------------------------------------------- helpers
  const addAt = (G, m, x, y, z) => { m.position.set(x, y, z); G.add(m); return m; };
  const sbox = (G, w, h, d, x, y, z) => addAt(G, box(w, h, d), x, y, z);
  // flat link between two 2D points at depth z (unit box scaled along x)
  const mkLink = (w = .1, th = .08) => box(1, w, th);
  const setLink = (m, ax, ay, bx, by, z) => { m.position.set((ax + bx) / 2, (ay + by) / 2, z); m.rotation.z = Math.atan2(by - ay, bx - ax); m.scale.x = Math.max(Math.hypot(bx - ax, by - ay), 1e-4); };
  const mkPin = (r = .12, th = .12) => { const p = cyl(r, r, th, null, 10); p.rotation.x = PI / 2; return p; };
  const prism = (pts, depth, m) => { const s = new THREE.Shape(); pts.forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y)); return new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false }), m || silMat()); };
  const rodAt = (G, a, b, r = .02) => { const m = rod(r); setRod(m, a, b); G.add(m); return m; };
  // wrap an object built in the XY plane (axis +z) so it faces +x: its local x then runs to world -z (screen right for a
  // camera that looks along -x) and its spin (rotation.z of the inner object) turns about world x
  const faceX = (inner, x, y, z) => { const o = new THREE.Group(); o.rotation.y = PI / 2; o.position.set(x, y, z); o.add(inner); return o; };

  // A spoked wheel in the XY plane (axis z). Angle 0 puts the crank pin on +x; spin it with group.rotation.z.
  function wheel(R, ns, pinK = .45) {
    const g = new THREE.Group(), rw = R * .1, rp = R * pinK;
    g.add(new THREE.Mesh(new THREE.TorusGeometry(R - rw / 2, rw / 2, 6, 56), silMat()));
    for (let i = 0; i < ns; i++) {
      const h = new THREE.Group(), s = box(R - rw, R * .075, R * .06); s.position.x = (R - rw) / 2; h.add(s); h.rotation.z = i / ns * TAU; g.add(h);
    }
    const hub = cyl(R * .14, R * .14, R * .16, null, 14); hub.rotation.x = PI / 2; g.add(hub);
    const web = box(rp, R * .13, R * .05); web.position.set(rp / 2, 0, R * .07); g.add(web);
    const boss = cyl(R * .085, R * .085, R * .06, null, 10); boss.rotation.x = PI / 2; boss.position.set(rp, 0, R * .09); g.add(boss);
    const a0 = PI - .6, a1 = PI + .6, r0 = R * .25, r1 = R * .8, sh = new THREE.Shape();
    sh.moveTo(r0 * Math.cos(a0), r0 * Math.sin(a0)); sh.absarc(0, 0, r1, a0, a1, false); sh.lineTo(r0 * Math.cos(a1), r0 * Math.sin(a1)); sh.absarc(0, 0, r0, a1, a0, true);
    const cw = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: R * .05, bevelEnabled: false }), silMat()); cw.position.z = R * .045; g.add(cw);
    return g;
  }
  // a plain spoked wheel or pulley in the XY plane (axis z): the same proportions as wheel() without the crank.
  // o: rim (rim thickness / R), spoke (spoke width / R), hub, hubL, tyre (a round tyre of this tube radius, metres), face (pulley face width)
  function spoked(R, ns, o = {}) {
    const g = new THREE.Group(), rw = R * (o.rim ?? .1), sw = R * (o.spoke ?? .075), m = silMat();
    g.add(new THREE.Mesh(new THREE.TorusGeometry(R - rw / 2, rw / 2, 6, 56), m));
    if (o.tyre) g.add(new THREE.Mesh(new THREE.TorusGeometry(R + o.tyre * .6, o.tyre, 8, 56), m));
    if (o.face) { const f = new THREE.Mesh(new THREE.CylinderGeometry(R, R, o.face, 48, 1, true), silMat({ side: THREE.DoubleSide })); f.rotation.x = PI / 2; g.add(f); }
    const r0 = R * (o.hub ?? .14);
    for (let i = 0; i < ns; i++) {
      const h = new THREE.Group(), L = R - rw / 2 - r0 * .7, s = new THREE.Mesh(new THREE.BoxGeometry(L, sw, sw * .8), m);
      s.position.x = r0 * .7 + L / 2; h.add(s); h.rotation.z = i / ns * TAU; g.add(h);
    }
    const hub = cyl(r0, r0, R * (o.hubL ?? .16), null, 14); hub.rotation.x = PI / 2; g.add(hub);
    return g;
  }

  // smoke that is released from a (moving) point and then stays in the air. emit(te) -> [x, y, z] at release time te.
  function plume(o) {
    const g = new THREE.Group(), n = o.n ?? 18, ps = [];
    for (let i = 0; i < n; i++) {
      const m = new THREE.SpriteMaterial({ map: puffTex, color: new THREE.Color(o.col ?? SMOKE_COL), transparent: true, depthWrite: false, opacity: .8, fog: false });
      const s = new THREE.Sprite(m); ps.push(s); g.add(s);
    }
    g.userData.update = (t, k, emit) => ps.forEach((s, i) => {
      const life = o.life ?? 6, ph = t / life + i / n, id = Math.floor(ph), a = ph - id, te = t - a * life, e = emit(te), [wx, wy, wz] = o.drift ?? [3, 2, 0];
      s.position.set(e[0] + wx * a * life + noise(id * 3.1 + i) * (o.spread ?? 1) * a, e[1] + wy * a * life, e[2] + wz * a * life);
      s.scale.setScalar((o.size ?? 3) * ((o.s0 ?? .4) + a * (o.grow ?? 1.7))); s.material.opacity = k * (o.op ?? .85) * Math.min(1, a * 7) * (1 - a * a); s.material.rotation = i * 1.7 + a;
      s.visible = e[3] !== false;
    });
    return g;
  }

  // meshing gears: gear B turned so that its teeth fall into the gaps of gear A (UP.gear: tooth centres at (k + 1/8) pitches)
  const meshAngle = (alpha, n1, psi, n2) => { const pa = (psi - alpha) / (TAU / n1) - .125; return psi + PI - (TAU / n2) * (.5 - pa + .125); };

  // two-bone IK on any rig: aim b1 and b2 so that the origin of b3 (a bone or any child object) reaches the target.
  // The middle joint bends the way it already bends (the current pose is the pole), as in PEOPLE.reach.
  const wpos = o => o.getWorldPosition(new THREE.Vector3());
  function aimB(b, from, to) {
    const qd = new THREE.Quaternion().setFromUnitVectors(from.clone().normalize(), to.clone().normalize()), bw = new THREE.Quaternion(); b.getWorldQuaternion(bw);
    const pw = new THREE.Quaternion(); b.parent.getWorldQuaternion(pw); b.quaternion.copy(pw.invert().multiply(qd.multiply(bw))); b.updateMatrixWorld(true);
  }
  function ik2(root, b1, b2, b3, target, pole) {
    root.updateMatrixWorld(true);
    const A = wpos(b1), Bp = wpos(b2), Cp = wpos(b3), Tt = V3(...target);
    const la = A.distanceTo(Bp), lb = Bp.distanceTo(Cp), d = Math.min(A.distanceTo(Tt), (la + lb) * .999), dir = Tt.clone().sub(A).normalize();
    const side = (pole ? V3(...pole) : Bp.clone()).sub(A); side.sub(dir.clone().multiplyScalar(side.dot(dir))); if (side.lengthSq() < 1e-8) side.set(0, 1, 0); side.normalize();
    const x = (la * la - lb * lb + d * d) / (2 * d), h = Math.sqrt(Math.max(0, la * la - x * x));
    const E = A.clone().add(dir.clone().multiplyScalar(x)).add(side.multiplyScalar(h));
    aimB(b1, Bp.clone().sub(A), E.clone().sub(A));
    const B2 = wpos(b2), C2 = wpos(b3), Tn = A.clone().add(dir.multiplyScalar(d));
    aimB(b2, C2.clone().sub(B2), Tn.clone().sub(B2));
    root.updateMatrixWorld(true);
  }
  // seat a person: pose first, then move the root so the pelvis lands on the seat point (world)
  function seat(p, at, yaw, clipName, ct) {
    P.at(p, [0, 0, 0], yaw); P.clip(p, clipName, ct);
    const pel = P.wpos(p.bones.pelvis);
    P.at(p, [at.x - pel.x, at.y - pel.y, at.z - pel.z], yaw);
  }
  // reach with a hand, fading the IK in over the clip's own hand position (k 0..1)
  function reachK(p, side, target, pole, k) {
    if (k <= 0) return; const h = P.hand(p, side), tg = h.clone().lerp(V3(...target), clamp(k));
    P.reach(p, side, tg.toArray(), pole);
  }

  // ======================================================================== the beam engine (S11) and its numbers
  const EN = { Ox: .5, Oy: 7.4, Lb: 3.4, L2: 1.2, Cx: 3.9, Cy: 2.6, Rf: 2.2, Lr: 4.8 };
  EN.Rc = .45 * EN.Rf; EN.Fx = EN.Ox - 2 * EN.Lb; EN.Fy = EN.Oy - EN.L2;
  const T_START = 81.58, ACC = 1.5, OMEGA = TAU / 1.36, TH0 = 1.9;            // the flywheel starts on a beat, then one turn per two beats
  const crankAngle = t => { const tau = Math.max(0, t - T_START), s = tau < ACC ? tau * tau / (2 * ACC) : tau - ACC / 2; return TH0 - OMEGA * s; };   // clockwise on screen
  function circleHit(a, ra, b, rb) {
    const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy), x = (ra * ra - rb * rb + d * d) / (2 * d), h = Math.sqrt(Math.max(0, ra * ra - x * x)), ux = dx / d, uy = dy / d;
    return [[a[0] + ux * x - uy * h, a[1] + uy * x + ux * h], [a[0] + ux * x + uy * h, a[1] + uy * x - ux * h]];
  }
  function engineAt(th) {
    const { Ox, Oy, Lb, L2, Cx, Cy, Rc, Lr, Fx, Fy } = EN, pin = [Cx + Rc * Math.cos(th), Cy + Rc * Math.sin(th)];
    let lo = -.7, hi = .7;
    for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2, f = Math.hypot(Ox + Lb * Math.cos(m) - pin[0], Oy + Lb * Math.sin(m) - pin[1]) - Lr; if (f > 0) hi = m; else lo = m; }
    const phi = (lo + hi) / 2, E = [Ox + Lb * Math.cos(phi), Oy + Lb * Math.sin(phi)], Bp = [Ox - Lb * Math.cos(phi), Oy - Lb * Math.sin(phi)];
    const D = circleHit(Bp, L2, [Fx, Fy], Lb).sort((p, q) => q[0] - p[0]).filter(p => p[1] < Bp[1] + .5)[0];
    return { phi, E, B: Bp, D, M: [(Bp[0] + D[0]) / 2, (Bp[1] + D[1]) / 2], pin };
  }
  // the flywheel as seen at the end of S11, for the match cut
  const FL_CAM = { x: 2.2, y: 4.6, z: 14, fov: 40 };
  const flNdc = (() => { const k = FL_CAM.z * Math.tan(FL_CAM.fov * PI / 360); return { u: (EN.Cx - FL_CAM.x) / (k * ASP), v: (EN.Cy - FL_CAM.y) / k, rho: EN.Rf / k }; })();

  // the stoker's shovel: keyframes of the blade tip (world), shaft direction, root shift and body twist over one swing (u = 0 at impact)
  const SW = [
    [0, [[-6.62, 1.05, 0], [-1, .04, 0], 0, 0]],
    [.07, [[-6.62, 1.05, 0], [-1, .04, 0], 0, 0]],
    [.17, [[-6.05, 1.0, -.1], [-1, -.05, -.05], .3, .1]],
    [.33, [[-5.7, .55, -.9], [-.4, -.55, -.8], .35, .75]],
    [.5, [[-5.4, .32, -1.25], [-.15, -.35, -.92], .35, .85]],
    [.66, [[-5.45, .75, -1.0], [-.25, .12, -.95], .3, .6]],
    [.84, [[-6.0, 1.15, -.2], [-.95, .15, -.2], .1, .15]],
    [1, [[-6.62, 1.05, 0], [-1, .04, 0], 0, 0]],
  ];
  const LAND = (() => { const i0 = beatAt(LINE(9)[0] + .12), a = []; for (let j = -1; j < 5; j++) a.push(B[i0 + 2 * j]); return a; })();
  function swing(t) {
    let k = 0; for (let i = 0; i < LAND.length - 1; i++) if (t >= LAND[i]) k = i;
    const u = clamp((t - LAND[k]) / (LAND[k + 1] - LAND[k]));
    const tip = kf(u, SW.map(([a, b]) => [a, b[0]]), x => x), d = kf(u, SW.map(([a, b]) => [a, b[1]]), x => x), dx = kf(u, SW.map(([a, b]) => [a, b[2]]), x => x), tw = kf(u, SW.map(([a, b]) => [a, b[3]]), x => x);
    const dd = new THREE.Vector3(...d).normalize();
    return { u, tip: new THREE.Vector3(...tip), d: dd, dx, tw, last: LAND[k] };
  }
  function swingLast(t) { let k = LAND[0]; for (const l of LAND) if (t >= l) k = l; return k; }

  // ======================================================================== S11
  const CH = { h: 40, camY: 20, dist: 78.5 };      // the chimney matches the obelisk: top at 0.15 and base at 0.85 of the frame height
  SHOT({ id: 'S11', t0: LINE(9)[0], t1: LINE(10)[0], out: { kind: 'cut' },
    build(G) {
      // ---- the chimney exterior
      const ext = new THREE.Group(); G.add(ext);
      ext.add(terrain({ size: 3000, seg: 24, amp: 0, fog: .5 }));
      const shaft = cyl(1.55, 2.7, 38.8, null, 16); shaft.position.y = 19.4; ext.add(shaft);
      const cap = cyl(2.05, 1.6, 1.3, null, 16); cap.position.y = 39.4; ext.add(cap);
      const lip = cyl(2.1, 2.1, .25, null, 16); lip.position.y = 39.95; ext.add(lip);
      for (const y of [8, 16, 24, 31]) { const b = cyl(lerp(2.7, 1.55, y / 38.8) + .12, lerp(2.7, 1.55, y / 38.8) + .12, .35, null, 16); b.position.y = y; ext.add(b); }
      for (let i = 0; i < 16; i++) {                                       // the mill sheds, sawtooth roofs, beside and behind the chimney
        const side = i % 2 ? 1 : -1, x = side * (14 + Math.floor(i / 2) * 11 + hash(i) * 5), z = -10 - hash(i * 3) * 34, w = 9 + hash(i * 5) * 7, h = 6 + hash(i * 7) * 5;
        sbox(ext, w, h, 11, x, h / 2, z);
        for (let j = 0; j < 3; j++) { const t = prism([[0, 0], [w / 3, 0], [w / 3, 2.4]], 11); t.position.set(x - w / 2 + j * w / 3, h, z - 5.5); ext.add(t); }
        if (i % 3 == 0) addAt(ext, box(1.2, 1.4, .1, litMat('#FF5A22', 1.6)), x, 2.2, z + 5.6);
      }
      const c2 = cyl(.9, 1.4, 26, null, 12); c2.position.set(-34, 13, -22); ext.add(c2);
      const c3 = cyl(.7, 1.1, 19, null, 12); c3.position.set(30, 9.5, -26); ext.add(c3);
      for (let i = 0; i < 3; i++) { const r = ridge({ z: -650 - i * 80, h: 40 + i * 25, w: 3200, rough: 10 + i * 3, seed: i * 5 + 1, under: 200 }); ext.add(r); }
      const smk = plume({ n: 44, life: 10, size: 16, drift: [3.8, 1.6, 0], spread: 3, op: .95 }); ext.add(smk);
      const smk2 = plume({ n: 18, life: 8, size: 8, drift: [3.2, 1.6, 0], spread: 1.5, op: .8 }); ext.add(smk2);
      const smk3 = plume({ n: 16, life: 8, size: 6.5, drift: [3.2, 1.6, 0], spread: 1.5, op: .8 }); ext.add(smk3);
      // ---- the engine house
      const int = new THREE.Group(); G.add(int);
      sbox(int, 80, .3, 30, 0, -.15, 0);
      sbox(int, 30, 1.2, .6, 0, .6, -3.2);                                   // sill under the big window
      sbox(int, 6, 15, .8, 14, 7.5, -3.2);                                   // right pier
      sbox(int, 8, 15, .8, -9, 7.5, -3.2);                                   // left wall above the boiler
      sbox(int, 30, 1.0, .8, 2, 13.8, -3.2);                                 // lintel
      sbox(int, 8.5, 3.6, 5.4, -10.75, 1.8, -.3);                            // boiler brickwork
      sbox(int, 1.2, 4.4, 1.2, -6.8, 5.8, .1);                               // steam riser
      // the boiler's round front plate: a riveted ring around the firebox door, a steam gauge above it
      const ringF = new THREE.Mesh(new THREE.TorusGeometry(1.3, .08, 6, 40), silMat()); ringF.rotation.y = PI / 2; ringF.position.set(-6.44, 1.45, -.15); int.add(ringF);
      for (let i = 0; i < 18; i++) { const a = i / 18 * TAU, rv = sph(.05, null, 6); rv.position.set(-6.4, 1.45 + Math.sin(a) * 1.13, -.15 + Math.cos(a) * 1.13); int.add(rv); }
      const gauge = new THREE.Mesh(new THREE.CircleGeometry(.2, 20), litMat('#FFB070', .9)); gauge.rotation.y = PI / 2 - .8; gauge.position.set(-6.3, 3.05, .55); int.add(gauge);
      const gRim = new THREE.Mesh(new THREE.TorusGeometry(.21, .025, 5, 20), silMat()); gRim.rotation.y = PI / 2 - .8; gRim.position.set(-6.3, 3.05, .55); int.add(gRim); rodAt(int, [-6.45, 2.6, .5], [-6.3, 2.85, .55], .025);
      const needle = box(.02, .15, .015); needle.rotation.y = PI / 2 - .8; needle.position.set(-6.28, 3.05, .57); int.add(needle);
      const doorQ = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.5), litMat('#FF6A2A', 2.4)); doorQ.rotation.y = PI / 2; doorQ.position.set(-6.48, 1.05, 0); int.add(doorQ);
      const doorLeaf = box(.06, 1.45, .95); doorLeaf.rotation.y = .35; doorLeaf.position.set(-6.0, 1.05, -1.05); int.add(doorLeaf);   // the firebox door, swung open on its hinge at the far edge
      const doorG = glow('#FF7A33', 6, 1.4); doorG.position.set(-6.2, 1.1, 0); int.add(doorG);
      const doorG2 = glow('#FF5A22', 15, .55); doorG2.position.set(-6.3, 1.3, 0); int.add(doorG2);
      const pool = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTex, color: new THREE.Color('#FF5A22'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
      pool.rotation.x = -PI / 2; pool.position.set(-5.2, .03, .2); pool.renderOrder = 1; int.add(pool);
      const spk = sparks(30, 4); spk.position.set(-6.3, 1.1, 0); int.add(spk);
      for (let i = 0; i < 9; i++) { const c = rock(.24 + hash(i * 3.3) * .22, i + 2, .55); c.position.set(-5.05 - hash(i) * .8, .06 + hash(i * 7) * .12, -1.05 - hash(i * 5) * .75); int.add(c); }   // the coal heap
      const stoker = P.make('m3', { outfit: ['cap', 'apron'] }); int.add(stoker.root);
      const handle = rod(.024), blade = box(.34, .03, .4), load = box(.22, .11, .26); int.add(handle, blade, load);
      // engine: pillar, beam, cylinder, linkage, crank and flywheel
      const pil = prism([[-1.7, 0], [1.7, 0], [.62, 7.0], [-.62, 7.0]], .5); pil.position.set(EN.Ox, 0, -.9); int.add(pil);
      sbox(int, 1.7, .5, .9, EN.Ox, 7.1, -.7);
      const beam = new THREE.Group(); beam.position.set(EN.Ox, EN.Oy, 0); int.add(beam);
      const bs = new THREE.Shape(); bs.moveTo(-EN.Lb - .25, .13); bs.lineTo(0, .6); bs.lineTo(EN.Lb + .25, .13); bs.lineTo(EN.Lb + .25, -.13); bs.lineTo(0, -.5); bs.lineTo(-EN.Lb - .25, -.13); bs.closePath();
      for (const k of [-1, 1]) { const hole = new THREE.Path(); hole.absellipse(k * EN.Lb * .5, 0, EN.Lb * .27, .14, 0, TAU, true); bs.holes.push(hole); }   // the cast beam's pierced web
      const bm = new THREE.Mesh(new THREE.ExtrudeGeometry(bs, { depth: .26, bevelEnabled: false }), silMat()); bm.position.z = -.13; beam.add(bm);
      const axle = mkPin(.3, .9); axle.position.set(EN.Ox, EN.Oy, -.2); int.add(axle);
      const cylr = cyl(.62, .62, 3.2, null, 18); cylr.position.set(EN.Ox - EN.Lb, 3.3, 0); int.add(cylr);
      sbox(int, 1.7, .22, 1.7, EN.Ox - EN.Lb, 4.95, 0); sbox(int, 1.7, .22, 1.7, EN.Ox - EN.Lb, 1.6, 0); sbox(int, 2.2, 1.5, 2.2, EN.Ox - EN.Lb, .75, 0);
      sbox(int, .4, 3.8, .5, EN.Fx, 4.1, -.3);                               // the fixed post that carries the radius rod
      const pipe = rod(.16); setRod(pipe, [-6.8, 5.7, 0], [EN.Ox - EN.Lb, 5.7, 0]); int.add(pipe);
      const pipe2 = rod(.16); setRod(pipe2, [EN.Ox - EN.Lb, 5.7, 0], [EN.Ox - EN.Lb, 5.1, 0]); int.add(pipe2);
      const vw = new THREE.Mesh(new THREE.TorusGeometry(.32, .04, 6, 20), silMat()); vw.position.set(-4.4, 6.25, .1); int.add(vw); rodAt(int, [-4.4, 5.7, .1], [-4.4, 6.25, .1], .04);   // stop valve hand wheel
      const L = { rodP: mkLink(.18, .12), cpl: mkLink(.12, .08), radius: mkLink(.14, .08), conn: mkLink(.24, .14) };
      Object.values(L).forEach(m => int.add(m));
      const pins = []; for (let i = 0; i < 6; i++) { const p = mkPin(.14, .3); pins.push(p); int.add(p); }
      const pistonHead = box(1.0, .3, .9); int.add(pistonHead);
      const fly = wheel(EN.Rf, 6); fly.position.set(EN.Cx, EN.Cy, 0); int.add(fly);
      const crankPin = mkPin(.16, .4); int.add(crankPin);
      // a belt from the flywheel rim to a spoked pulley, and a train of gears on the pulley's shaft
      const PU = { x: 8.4, y: 5.4, r: 1.7 }, pitchK = .1;                    // radius per tooth, so every pair meshes
      const pulley = wheel(PU.r, 6, .01); pulley.position.set(PU.x, PU.y, 0); int.add(pulley);
      const dpc = Math.hypot(PU.x - EN.Cx, PU.y - EN.Cy), fi = Math.atan2(PU.y - EN.Cy, PU.x - EN.Cx), dl = Math.acos((EN.Rf - PU.r) / dpc);
      for (const sg of [1, -1]) {
        const n = [Math.cos(fi + sg * dl), Math.sin(fi + sg * dl)], bt = mkLink(.1, .1); setLink(bt, EN.Cx + EN.Rf * n[0], EN.Cy + EN.Rf * n[1], PU.x + PU.r * n[0], PU.y + PU.r * n[1], .12); int.add(bt);
      }
      const gA = gear(10 * pitchK, 10, .3), gB = gear(16 * pitchK, 16, .3), gC = gear(10 * pitchK, 10, .3);
      gA.position.set(PU.x, PU.y, .2);
      const psiAB = 1.4, dAB = .93 * (1.0 + 1.6), psiBC = PI - .2, dBC = .93 * (1.6 + 1.0);
      gB.position.set(PU.x + dAB * Math.cos(psiAB), PU.y + dAB * Math.sin(psiAB), .2);
      gC.position.set(gB.position.x + dBC * Math.cos(psiBC), gB.position.y + dBC * Math.sin(psiBC), .2);
      int.add(gA, gB, gC);
      return { ext, int, smk, smk2, smk3, doorQ, doorG, doorG2, pool, spk, stoker, handle, blade, load, beam, L, pins, pistonHead, fly, crankPin, pulley, PU, gA, gB, gC, psiAB, psiBC, needle };
    },
    frame(s, lt, dur, t, { camera, PX }) {
      const inside = lt >= .74;
      s.ext.visible = !inside; s.int.visible = inside;
      if (!inside) {
        sky({ ...FURNACE, time: t });
        const em = () => [0, 40.2, 0];
        s.smk.userData.update(t, 1, em); s.smk2.userData.update(t + 3, 1, () => [-34, 26.2, -22]); s.smk3.userData.update(t + 5, 1, () => [30, 19.2, -26]);
        const push = ease(seg(lt, .22, .74));
        cam(camera, [0, CH.camY, lerp(CH.dist, CH.dist - 13, push)], [0, CH.camY, 0], 40);
        return;
      }
      // ---- the engine house. The key light is the firebox: it rims the stoker; the window behind rims the engine
      const hit = t - swingLast(t), flare = Math.exp(-hit * 5), fl = .9 + .1 * noise(t * 9);
      sky({ ...FURNACE, time: t, zen: '#2A1914', hor: '#D14A1C', horK: .6, fogDen: .0003,
        ptPos: [-6.0, 1.15, .3], ptCol: '#FF7A33', ptK: (1.7 + 1.8 * flare) * fl, ptR: 2.4, rimCol: '#FF8A4A', rimK: 2.2 });
      setGlow(s.doorG, 1.0 + .5 * flare + .08 * noise(t * 9), 6 + 1.2 * flare); setGlow(s.doorG2, .5 + .25 * flare, 15 + 2 * flare);
      s.pool.material.color.set('#FF5A22').multiplyScalar(.55 + .35 * flare); s.pool.scale.setScalar(9 + 1.3 * flare);
      s.spk.userData.update(t, LAND, PX, .9);
      s.needle.rotation.x = -.6 + .9 * smooth(seg(t, 79.2, 81.6)) + .03 * noise(t * 13);   // the steam gauge climbs as the fire takes
      // stoker
      const sw = swing(t), rootX = -5.55 + sw.dx, yaw = -PI / 2 - sw.tw * .62;
      P.at(s.stoker, [rootX, 0, sw.tw * -.12], yaw); P.clip(s.stoker, 'Idle_Loop', t);
      P.turn(s.stoker, 'spine_02', [.3 * clamp(1 - (sw.tip.y - .3) / .9) + .12, 0, 0]);
      const rh = sw.tip.clone().addScaledVector(sw.d, -1.25), lh = sw.tip.clone().addScaledVector(sw.d, -.65), bk = sw.tip.clone().addScaledVector(sw.d, -1.45);
      P.reach(s.stoker, 'r', rh.toArray(), [rh.x + .1, rh.y - .6, rh.z + .5]); P.reach(s.stoker, 'l', lh.toArray(), [lh.x + .1, lh.y - .6, lh.z - .4]);
      setRod(s.handle, bk.toArray(), sw.tip.toArray());
      const bc = sw.tip.clone().addScaledVector(sw.d, -.12); s.blade.position.copy(bc); s.blade.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), sw.d);
      const loaded = sw.u > .52 || sw.u < .035;
      s.load.visible = loaded; s.load.position.copy(bc).add(new THREE.Vector3(0, .09, 0)); s.load.quaternion.copy(s.blade.quaternion);
      // beam engine
      const th = crankAngle(t), e = engineAt(th), L = s.L;
      s.beam.rotation.z = e.phi;
      setLink(L.conn, e.E[0], e.E[1], e.pin[0], e.pin[1], .32);
      setLink(L.cpl, e.B[0], e.B[1], e.D[0], e.D[1], .3);
      setLink(L.radius, EN.Fx, EN.Fy, e.D[0], e.D[1], .26);
      setLink(L.rodP, e.M[0], e.M[1], e.M[0], e.M[1] - 3.1, .1);
      s.pistonHead.position.set(e.M[0], e.M[1] - 3.1, 0);
      [[EN.Fx, EN.Fy], e.D, e.B, e.M, e.E, e.pin].forEach((p, i) => s.pins[i].position.set(p[0], p[1], .38));
      s.crankPin.position.set(e.pin[0], e.pin[1], .3);
      s.fly.rotation.z = th;
      const thp = th * EN.Rf / s.PU.r; s.pulley.rotation.z = thp; s.gA.rotation.z = thp;
      s.gB.rotation.z = meshAngle(thp, 10, s.psiAB, 16); s.gC.rotation.z = meshAngle(s.gB.rotation.z, 16, s.psiBC, 10);
      // camera: wide on the stoker, push in, tilt up to the engine, then a slow push that lands on the match frame at the cut
      const A0 = [-2.0, 1.5, 8.5], A1 = [-3.1, 1.5, 6.0], LA0 = [-5.9, 1.25, 0], LA1 = [-6.0, 1.2, 0];
      const FLb = [FL_CAM.x - .3, FL_CAM.y + .35, FL_CAM.z + 2.2], FLE = [FL_CAM.x, FL_CAM.y, FL_CAM.z];
      const p1 = ease(seg(lt, .74, 2.8)), up = ease(seg(lt, 2.85, 3.75)), push = smooth(seg(lt, 3.3, dur));
      const pos = A0.map((v, i) => lerp(lerp(lerp(v, A1[i], p1), FLb[i], up), FLE[i], push));
      const look = LA0.map((v, i) => lerp(lerp(lerp(v, LA1[i], p1), [FL_CAM.x - .3, FL_CAM.y + .35, 0][i], up), [FL_CAM.x, FL_CAM.y, 0][i], push));
      cam(camera, pos, look, lerp(lerp(38, 33, p1), FL_CAM.fov, up));
    },
  });

  // ======================================================================== S12 the cogs spin wool, then the steel horses
  const T12 = LINE(10)[0], T12E = LINE(11)[0];
  const T12M = (() => { let i = beatAt(T12); if (Math.abs(B[i + 1] - T12) < Math.abs(B[i] - T12)) i++; return B[i + 4]; })();   // 86.40: the line's middle downbeat

  // ---- the self-acting mule. The spindles stand in a row along -x; the carriage runs out toward -z (screen right for a
  // camera that looks down the mule). c is the distance from the front roller nip to the spindle line: the spindle base is
  // at (y .47, z -c), its tip leans toward the rollers at (y .86, z -c + .11), level with the nip, so the yarn runs flat.
  const MU = { N: 212, SP: .064, X0: -.12, Y_NIP: .86, Y_BASE: .47, LEAN: .11, IN: .42, OUT: 1.92 };   // a woollen mule's 2.5 inch gauge
  const MX = i => MU.X0 - i * MU.SP, MXE = MX(MU.N - 1);
  // one cycle: draw out (the rollers deliver roving, the spindles twist), twist at the head, back off (the faller wire comes
  // down onto the yarn), then wind in (the faller guides the yarn onto the cops). The draw ends on a beat.
  const CYC = { o0: 83.35, o1: 85.2, bo: 85.26, i0: 85.42, i1: 86.27 };
  function mule(t) {
    const { IN, OUT } = MU; let c = IN, yF = .95;
    if (t >= CYC.o0 && t < CYC.o1) c = IN + (OUT - IN) * (1 - Math.cos(PI * seg(t, CYC.o0, CYC.o1))) / 2;
    else if (t >= CYC.o1 && t < CYC.i0) { c = OUT; yF = lerp(.95, .74, smooth(seg(t, CYC.bo, CYC.i0))); }
    else if (t >= CYC.i0 && t < CYC.i1) { const u = seg(t, CYC.i0, CYC.i1); c = OUT - (OUT - IN) * ease(u); yF = kf(u, [[0, .74], [.55, .625], [1, .72]], smooth); }
    else if (t >= CYC.i1) yF = lerp(.72, .95, smooth(seg(t, CYC.i1, CYC.i1 + .14)));
    // the twist runs up the yarn while the spindles spin (the glints travel along the threads); back a little while backing off
    const tw = 30 * (clamp(t, CYC.o0, CYC.bo) - CYC.o0) - 8 * (clamp(t, CYC.bo, CYC.i0) - CYC.bo) + 6 * (clamp(t, CYC.i0, CYC.i1) - CYC.i0);
    return { c, yF, tw, k: (c - IN) / (OUT - IN) };
  }
  // the drive: the fast pulley on the headstock's rim shaft (the wheel the flywheel cuts to), an open belt up to the line shaft,
  // and a train of four gears on the headstock's near frame. a = -z (screen right), b = y, in the plane of the near frame.
  const HS = { zr: -1.1, yr: 1.15, xn: 1.25, xf: .12, xp: 1.62, Rp: .36, Rl: .5, yl: 4.5 };
  const GT = { n1: 12, n2: 36, n3: 14, n4: 30, k: .01, psi12: 150 * PI / 180, psi34: 172 * PI / 180 };
  const GP = (() => { const a1 = -HS.zr, b1 = HS.yr, d12 = .93 * (GT.n1 + GT.n2) * GT.k, a2 = a1 + d12 * Math.cos(GT.psi12), b2 = b1 + d12 * Math.sin(GT.psi12), d34 = .93 * (GT.n3 + GT.n4) * GT.k;
    return { a1, b1, a2, b2, a4: a2 + d34 * Math.cos(GT.psi34), b4: b2 + d34 * Math.sin(GT.psi34) }; })();
  const QP = { a: 1.98, b: .26, x: 1.36, n: 24, np: 10, psi: 205 * PI / 180 };                 // the winding quadrant
  // the camera at the cut: the fast pulley exactly where the flywheel was (screen position, size and angle), 10 degrees of tilt up
  const MATCH = (() => {
    const p = 10 * PI / 180, th = Math.tan(20 * PI / 180), Z = HS.Rp / (flNdc.rho * th), X = flNdc.u * Z * th * ASP, Y = flNdc.v * Z * th;
    const f = V3(-Math.cos(p), Math.sin(p), 0), r = V3(0, 0, -1), u = V3(Math.sin(p), Math.cos(p), 0);
    const C = V3(HS.xp, HS.yr, HS.zr).addScaledVector(f, -Z).addScaledVector(r, -X).addScaledVector(u, -Y);
    return { C, L: C.clone().addScaledVector(f, 8) };
  })();
  const ROOM = { SILL: .85, SPRING: 4.0, WW: 1.7, ZL: 4.5, ZR: -7.0, XF: -21, XN: 9 };
  const WIN_L = []; for (let x = 7.5; x >= -19.5; x -= 3) WIN_L.push(x);
  const WIN_F = [-4.2, -1.2, 1.8];
  const LD = V3(...MILL.sunDir).normalize().negate();                        // the sunlight's direction of travel into the room

  // a wall slab of length L along local x, height H, thickness D (extruded along +z), with arched window holes [centre u, width]
  function archWall(L, H, D, wins, sill, spring) {
    const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(L, 0); s.lineTo(L, H); s.lineTo(0, H); s.closePath();
    for (const [u, w] of wins) {
      const h = new THREE.Path(); h.moveTo(u - w / 2, sill); h.lineTo(u + w / 2, sill); h.lineTo(u + w / 2, spring);
      h.absarc(u, spring, w / 2, 0, PI, false); h.lineTo(u - w / 2, sill); s.holes.push(h);
    }
    return new THREE.ExtrudeGeometry(s, { depth: D, bevelEnabled: false, curveSegments: 14 });
  }
  // glazing bars for those windows, as [x, y, w, h] boxes in the wall's own coordinates
  function glazing(wins, sill, spring, nc = 4, rowH = .44, bar = .035) {
    const out = [];
    for (const [u, w] of wins) {
      const r = w / 2, top = spring + r;
      for (let k = 1; k < nc; k++) { const x = u - r + w * k / nc, dx = x - u, ht = spring + Math.sqrt(Math.max(0, r * r - dx * dx)); out.push([x, (sill + ht) / 2, bar, ht - sill]); }
      for (let y = sill + rowH; y < top - .06; y += rowH) { const hw = y <= spring ? r : Math.sqrt(Math.max(0, r * r - (y - spring) ** 2)); out.push([u, y, hw * 2, bar]); }
    }
    return out;
  }
  // yarn: lines that glow where the low sun comes through them (forward scatter toward the camera), with glints that run
  // along each thread as the twist runs up it
  // the sun-shaft test of inBeam(), for the left wall, in GLSL: 0..1 with soft sides
  const BEAM_GLSL = `uniform vec3 uLD; uniform float uWX[${WIN_L.length}];
    float beamL(vec3 p){ float s1 = (p.z - ${ROOM.ZL.toFixed(2)}) / uLD.z; vec3 q = p - uLD * s1; float k = 0.;
      if (s1 > 0. && q.y > ${ROOM.SILL.toFixed(2)} && q.y < ${(ROOM.SPRING + .4).toFixed(2)}) for (int i = 0; i < ${WIN_L.length}; i++) k = max(k, smoothstep(${(ROOM.WW / 2).toFixed(3)}, ${(ROOM.WW / 2 - .3).toFixed(3)}, abs(q.x - uWX[i])));
      return k * exp(-s1 / 9.); }`;
  const beamUniforms = () => ({ uLD: { value: LD.clone() }, uWX: { value: WIN_L.slice() } });
  function threadMat(col, k, fade = 9) {
    return new THREE.ShaderMaterial({
      uniforms: { uCol: { value: new THREE.Color(col) }, uK: { value: k }, uTw: { value: 0 }, uL: { value: V3(0, 0, -1) }, uFade: { value: fade }, ...beamUniforms() },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'attribute float s; attribute float ph; varying float vS, vP; varying vec3 vW; void main(){ vS = s; vP = ph; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: BEAM_GLSL + `uniform vec3 uCol, uL; uniform float uK, uTw, uFade; varying float vS, vP; varying vec3 vW;
        void main(){ vec3 v = vW - cameraPosition; float d = length(v); v /= d;
          float fw = .5 + 1.2 * pow(max(dot(v, uL), 0.), 3.);
          float gl = .8 + 1.4 * pow(max(sin(vS * 9. + uTw + vP * 6.283), 0.), 14.);
          float fade = (1. - .88 * smoothstep(6.5, 12., d)) / (1. + d * d / (uFade * uFade));
          gl_FragColor = vec4(uCol * uK * (.3 + 1.7 * beamL(vW)) * fw * gl * fade, 1.); }`,
    });
  }
  // far away the yarn is too fine to draw as lines (they alias): a soft sheet of light on the same plane takes over
  function sheetMat(col, k) {
    return new THREE.ShaderMaterial({
      uniforms: { uCol: { value: new THREE.Color(col) }, uK: { value: k }, uL: { value: V3(0, 0, -1) }, ...beamUniforms() },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: 'attribute vec2 st; varying vec2 vST; varying vec3 vW; void main(){ vST = st; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: BEAM_GLSL + `uniform vec3 uCol, uL; uniform float uK; varying vec2 vST; varying vec3 vW;
        void main(){ vec3 v = vW - cameraPosition; float d = length(v); v /= d;
          float fw = .5 + 1.2 * pow(max(dot(v, uL), 0.), 3.), edge = smoothstep(0., .08, vST.y) * smoothstep(1., .9, vST.y) * smoothstep(0., .01, vST.x);
          gl_FragColor = vec4(uCol * uK * (.3 + 1.7 * beamL(vW)) * fw * edge * smoothstep(5.5, 12., d) / (1. + d * d / 260.), 1.); }`,
    });
  }
  // a shaft of sunlight through a window: the parallelepiped O + a e1 + b e2 + c e3 (a, b, c in 0..1), integrated along the
  // view ray (soft at the sides, fading with the distance travelled into the room, brighter looking toward the sun)
  function shaftMat() {
    return new THREE.ShaderMaterial({
      uniforms: { uO: { value: V3(0, 0, 0) }, uInv: { value: new THREE.Matrix3() }, uCol: { value: new THREE.Color('#FF9A52') }, uK: { value: .5 }, uSun: { value: V3(0, 0, -1) } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: `uniform vec3 uO, uCol, uSun; uniform mat3 uInv; uniform float uK; varying vec3 vW;
        void main(){ vec3 dw = normalize(vW - cameraPosition), ro = uInv * (cameraPosition - uO), rd = uInv * dw;
          rd += sign(rd) * 1e-6 + vec3(1e-7);
          vec3 a = -ro / rd, b = (1. - ro) / rd, lo = min(a, b), hi = max(a, b);
          float tn = max(max(lo.x, lo.y), max(lo.z, 0.)), tf = min(min(hi.x, hi.y), hi.z);
          if (tf <= tn) discard;
          float acc = 0.;
          for (int i = 0; i < 10; i++) { vec3 p = ro + rd * mix(tn, tf, (float(i) + .5) / 10.);
            acc += smoothstep(0., .28, p.x) * smoothstep(1., .72, p.x) * smoothstep(0., .14, p.y) * smoothstep(1., .82, p.y) * exp(-p.z * 2.4) * smoothstep(0., .03, p.z); }
          float fw = .45 + .95 * pow(max(dot(dw, uSun), 0.), 4.);
          gl_FragColor = vec4(uCol * uK * fw * acc / 10. * (tf - tn), 1.); }`,
    });
  }
  // is a point in a beam of sunlight? 0..1, by tracing it back along the light to the window walls
  function inBeam(x, y, z) {
    const { SILL, SPRING, WW, ZL, XF } = ROOM; let k = 0;
    const s1 = (z - ZL) / LD.z;
    if (s1 > 0) { const wx = x - LD.x * s1, wy = y - LD.y * s1; if (wy > SILL && wy < SPRING + .5) for (const c of WIN_L) if (Math.abs(wx - c) < WW / 2) k = Math.max(k, Math.exp(-s1 / 5)); }
    const s2 = (x - XF) / LD.x;
    if (s2 > 0) { const wz = z - LD.z * s2, wy = y - LD.y * s2; if (wy > SILL && wy < SPRING + .5) for (const c of WIN_F) if (Math.abs(wz - c) < WW / 2) k = Math.max(k, Math.exp(-s2 / 5)); }
    return k;
  }

  function buildMill(G) {
    const g = new THREE.Group(); G.add(g); const M = { g }, { SILL, SPRING, WW, ZL, ZR, XF, XN } = ROOM, M4 = new THREE.Matrix4();
    // ---- the room: floor, ceiling and its cast-iron beams, two rows of columns, three walls of tall arched windows
    const flat = silMat({ rim: 0 });                                         // big flat surfaces take no rim light (it would light them at grazing angles)
    addAt(g, box(XN - XF + 2, .2, ZL - ZR + 2, flat), (XN + XF) / 2, -.1, (ZL + ZR) / 2);
    addAt(g, box(XN - XF + 2, .3, ZL - ZR + 2, flat), (XN + XF) / 2, 5.75, (ZL + ZR) / 2);
    for (let x = 6; x >= -18; x -= 3) sbox(g, .26, .42, ZL - ZR, x, 5.39, (ZL + ZR) / 2);
    for (let x = 4.5; x >= -19.5; x -= 3) for (const z of [2.7, -4.9]) { addAt(g, cyl(.085, .1, 5.2, null, 10), x, 2.6, z); sbox(g, .32, .2, .32, x, 5.1, z); sbox(g, .26, .12, .26, x, .06, z); }
    const walls = [
      [archWall(XN - XF, 5.6, .45, WIN_L.map(x => [x - XF, WW]), SILL, SPRING), [XF, 0, ZL], 0, WIN_L.map(x => [x - XF, WW])],
      [archWall(ZL - ZR, 5.6, .45, WIN_F.map(z => [z - ZR, WW]), SILL, SPRING), [XF, 0, ZR], -PI / 2, WIN_F.map(z => [z - ZR, WW])],
      [archWall(XN - XF, 5.6, .45, WIN_L.map(x => [XN - x, WW]), SILL, SPRING), [XN, 0, ZR], PI, WIN_L.map(x => [XN - x, WW])],
    ];
    for (const [geo, pos, ry, wins] of walls) {
      const w = new THREE.Group(); w.position.set(...pos); w.rotation.y = ry; g.add(w);
      w.add(new THREE.Mesh(geo, flat));
      const L = glazing(wins, SILL, SPRING), im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), silMat(), L.length);
      L.forEach(([x, y, bw, bh], i) => { M4.makeScale(bw, bh, .05); M4.setPosition(x, y, .22); im.setMatrixAt(i, M4); }); im.frustumCulled = false; w.add(im);
    }
    // the town outside the windows: low hills, roofs and chimneys, pale in the haze
    g.add(ridge({ z: 340, h: 26, w: 2400, rough: 16, seed: 3, under: 60 }));
    g.add(ridge({ x: -360, z: 0, yaw: PI / 2, h: 24, w: 2400, rough: 13, seed: 8, under: 60 }));
    M.chims = [];
    for (const [x, z, h] of [[-70, 150, 34], [-170, 70, 40], [30, 210, 28], [-260, -60, 44]]) {
      addAt(g, cyl(1.2, 2.0, h, null, 8), x, h / 2, z);
      const pl = plume({ n: 10, life: 9, size: 14, drift: [2.5, 1.5, -.8], spread: 3, op: .55, col: '#5A3A36' }); g.add(pl); M.chims.push({ pl, e: [x, h + 1, z] });
    }
    // ---- the mule: roller beam, rollers, stands
    const RL = MXE - .15, RR = .25, RC = (RR + RL) / 2;
    sbox(g, RR - RL, .12, .26, RC, .76, .1);
    for (const [z, y, r] of [[.02, .855, .014], [.08, .855, .014], [.14, .858, .016], [.03, .885, .016], [.09, .885, .016]]) { const c = cyl(r, r, RR - RL, null, 8); c.rotation.z = PI / 2; c.position.set(RC, y, z); g.add(c); }
    for (let x = .1; x > RL; x -= 1.5) { sbox(g, .07, .7, .2, x, .35, .12); sbox(g, .3, .05, .34, x, .025, .12); }
    // the creel: posts, rails and two tiers of roving bobbins (one per spindle)
    for (let x = .05; x > RL; x -= 1.5) for (const z of [.3, .74]) sbox(g, .05, 1.78, .05, x, .89, z);
    sbox(g, RR - RL, .04, .14, RC, 1.08, .42); sbox(g, RR - RL, .04, .14, RC, 1.39, .64); sbox(g, RR - RL, .05, .52, RC, 1.79, .52);
    const bobPos = i => (i % 2 ? [MX(i), 1.53, .64] : [MX(i), 1.22, .42]);
    const bob = new THREE.InstancedMesh(new THREE.CylinderGeometry(.037, .037, .22, 8), silMat(), MU.N);
    for (let i = 0; i < MU.N; i++) { M4.makeTranslation(...bobPos(i)); bob.setMatrixAt(i, M4); } bob.frustumCulled = false; g.add(bob);
    // roving: from each bobbin down to the back roller (static); yarn: from the front roller nip to each spindle (moves)
    const mkLines = (n, verts, k, fade) => {
      const pos = new Float32Array(n * verts * 3), s = new Float32Array(n * verts), ph = new Float32Array(n * verts), geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('s', new THREE.BufferAttribute(s, 1)); geo.setAttribute('ph', new THREE.BufferAttribute(ph, 1));
      const mat = threadMat('#FFE4BE', k, fade), mesh = new THREE.LineSegments(geo, mat); mesh.frustumCulled = false; g.add(mesh);
      return { pos, s, ph, geo, mat };
    };
    M.rov = mkLines(MU.N, 2, .55, 7);
    for (let i = 0; i < MU.N; i++) { const [bx, by, bz] = bobPos(i); M.rov.pos.set([bx, by - .11, bz - .02, MX(i), .875, .15], i * 6); M.rov.ph.fill(hash(i * 1.9), i * 2, i * 2 + 2); M.rov.s.set([0, .3], i * 2); }
    M.thr = mkLines(MU.N, 4, 1.1, 6.5);
    M.sheet = (() => { const geo = new THREE.BufferGeometry(), pos = new Float32Array(12); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('st', new THREE.BufferAttribute(new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), 2)); geo.setIndex([0, 1, 2, 0, 2, 3]);
      const mat = sheetMat('#FFE4BE', .5), mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; g.add(mesh); return { pos, geo, mat }; })();
    for (let i = 0; i < MU.N; i++) { M.thr.s.set([0, 1, 1, 1.15], i * 4); M.thr.ph.fill(hash(i * 3.7 + 1), i * 4, i * 4 + 4); }
    // ---- the carriage (a group that moves along z): beam, spindles and cops, faller wire and its arms, wheels on rails
    const car = new THREE.Group(); g.add(car); M.car = car;
    const CL = MU.X0 + .1, CR = MXE - .1, CC = (CL + CR) / 2;
    sbox(car, CL - CR, .14, .36, CC, .40, -.15); sbox(car, CL - CR, .15, .3, CC, .255, -.16); sbox(car, CL - CR, .03, .08, CC, .485, .0);
    const ang = Math.atan2(MU.LEAN, MU.Y_NIP - MU.Y_BASE), Ls = Math.hypot(MU.LEAN, MU.Y_NIP - MU.Y_BASE), Q = new THREE.Quaternion().setFromEuler(new THREE.Euler(ang, 0, 0));
    const ax = V3(0, MU.Y_NIP - MU.Y_BASE, MU.LEAN).normalize(), S1 = V3(1, 1, 1);
    const sp = new THREE.InstancedMesh(new THREE.CylinderGeometry(.0045, .0045, Ls, 5), silMat(), MU.N);
    const copG = new THREE.LatheGeometry([[0, 0], [.011, 0], [.02, .03], [.021, .1], [.012, .15], [.005, .17], [0, .176]].map(([r, y]) => new THREE.Vector2(r, y)), 10);
    const cp = new THREE.InstancedMesh(copG, silMat(), MU.N);
    for (let i = 0; i < MU.N; i++) {
      M4.compose(V3(MX(i), MU.Y_BASE, 0).addScaledVector(ax, Ls / 2), Q, S1); sp.setMatrixAt(i, M4);
      M4.compose(V3(MX(i), MU.Y_BASE, 0).addScaledVector(ax, .035), Q, S1); cp.setMatrixAt(i, M4);
    }
    sp.frustumCulled = cp.frustumCulled = false; car.add(sp, cp);
    M.faller = rod(.006); car.add(M.faller); M.CL = CL; M.CR = CR;
    M.arms = []; for (let x = CL - .25; x > CR; x -= 1.5) { const a = rod(.009); car.add(a); M.arms.push({ a, x }); }
    M.cw = []; for (let x = CL - .5; x > CR; x -= 2.4) { const w = spoked(.12, 6, { rim: .16, spoke: .1, hub: .22, hubL: .6 }); car.add(faceX(w, x, .12, -.17)); M.cw.push(w); sbox(g, .05, .05, 2.6, x, .025, -1.25); }
    const drum = cyl(.1, .1, .14, null, 12); drum.rotation.z = PI / 2; drum.position.set(CL + .08, .42, -.26); car.add(drum);   // the winding drum the quadrant chain pulls
    // ---- the headstock: two skeletal side frames, the rim shaft with the fast pulley, four gears, the winding quadrant
    const plate = (() => { const s = new THREE.Shape(); [[-.3, 0], [2.3, 0], [2.3, .62], [2.05, .75], [-.05, .75], [-.3, .62]].forEach(([a, b], i) => i ? s.lineTo(a, b) : s.moveTo(a, b));
      for (const [a, w] of [[.3, .5], [1.1, .6], [1.85, .42]]) { const h = new THREE.Path(); h.absellipse(a, .36, w / 2, .22, 0, TAU, true); s.holes.push(h); }
      return new THREE.ExtrudeGeometry(s, { depth: .045, bevelEnabled: false, curveSegments: 10 }); })();
    for (const x of [HS.xf, HS.xn]) {
      const pm = new THREE.Mesh(plate, silMat()); pm.rotation.y = PI / 2; pm.position.set(x, 0, 0); g.add(pm);
      const ped = prism([[-.13, .74], [.13, .74], [.06, 1.08], [-.06, 1.08]], .1); ped.rotation.y = PI / 2; ped.position.set(x - .05, 0, HS.zr); g.add(ped);
      sbox(g, .14, .15, .22, x, HS.yr, HS.zr);
    }
    for (const [z, y] of [[.25, .7], [-2.25, .7], [.25, .06], [-2.25, .06]]) rodAt(g, [HS.xf, y, z], [HS.xn, y, z], .03);
    for (const [a, b] of [[GP.a2, GP.b2], [GP.a4, GP.b4]]) { const br = prism([[a - .05, .74], [a + .05, .74], [a + .025, b], [a - .025, b]], .04); br.rotation.y = PI / 2; br.position.set(1.27, 0, 0); g.add(br); }
    rodAt(g, [-.02, HS.yr, HS.zr], [HS.xp + .09, HS.yr, HS.zr], .035);
    M.fp = spoked(HS.Rp, 6, { face: .12 }); g.add(faceX(M.fp, HS.xp, HS.yr, HS.zr));
    const mkG = (n, x, a, b) => { const gm = gear(n * GT.k, n, .05); g.add(faceX(gm, x, b, -a)); return gm; };
    M.g1 = mkG(GT.n1, 1.33, GP.a1, GP.b1); M.g2 = mkG(GT.n2, 1.31, GP.a2, GP.b2); M.g3 = mkG(GT.n3, 1.37, GP.a2, GP.b2); M.g4 = mkG(GT.n4, 1.37, GP.a4, GP.b4);
    for (const [a, b] of [[GP.a2, GP.b2], [GP.a4, GP.b4]]) rodAt(g, [HS.xf, b, -a], [1.45, b, -a], .03);
    M.q = new THREE.Group(); g.add(faceX(M.q, QP.x, QP.b, -QP.a));
    const qa = box(.07, 1.05, .05); qa.position.y = .52; M.q.add(qa);
    const qg = gear(QP.n * GT.k * .85, QP.n, .05); qg.position.z = -.025; M.q.add(qg);
    const nut = box(.11, .08, .08); nut.position.y = .74; M.q.add(nut);
    const qd = .93 * (QP.n * .85 + QP.np) * GT.k;
    M.qp = gear(QP.np * GT.k, QP.np, .05); g.add(faceX(M.qp, QP.x, QP.b + qd * Math.sin(QP.psi), -(QP.a + qd * Math.cos(QP.psi))));
    sbox(g, .12, .3, .16, QP.x - .06, .15, -QP.a);
    M.chain = rod(.008); g.add(M.chain);
    // ---- the line shaft overhead: hangers on every ceiling beam, the pulley that drives the mule, more pulleys whose belts rise
    // through the floor above
    rodAt(g, [XN, HS.yl, HS.zr], [XF + .5, HS.yl, HS.zr], .04);
    for (let x = 6; x >= -18; x -= 3) { rodAt(g, [x, 5.18, HS.zr], [x, HS.yl, HS.zr], .03); sbox(g, .16, .14, .24, x, HS.yl, HS.zr); }
    M.lp = [];
    const lsp = (x, R) => { const w = spoked(R, 6, { face: .14 }); g.add(faceX(w, x, HS.yl, HS.zr)); M.lp.push(w); return w; };
    lsp(HS.xp, HS.Rl);
    for (const x of [-4.4, -10.4, -16.4]) { lsp(x, .42); for (const s of [-1, 1]) rodAt(g, [x, HS.yl, HS.zr + s * .42], [x, 5.6, HS.zr + s * .42], .012); }
    // the belt to the mule: two strands on the outer tangents of the two pulleys, and the lacing that rides around with it
    M.belt = (() => {
      const c1 = [-HS.zr, HS.yr], c2 = [-HS.zr, HS.yl], R1 = HS.Rp + .01, R2 = HS.Rl + .01, d = Math.hypot(c2[0] - c1[0], c2[1] - c1[1]);
      const fi = Math.atan2(c2[1] - c1[1], c2[0] - c1[0]), dl = Math.acos((R1 - R2) / d), bg = new THREE.Group(); bg.rotation.y = PI / 2; bg.position.x = HS.xp; g.add(bg);
      const tp = sg => { const n = [Math.cos(fi + sg * dl), Math.sin(fi + sg * dl)]; return [[c1[0] + R1 * n[0], c1[1] + R1 * n[1]], [c2[0] + R2 * n[0], c2[1] + R2 * n[1]], Math.atan2(n[1], n[0])]; };
      const right = tp(-1), left = tp(1);
      for (const [p, q] of [right, left]) { const m = mkLink(.014, .11); setLink(m, p[0], p[1], q[0], q[1], 0); bg.add(m); }
      const Ls1 = Math.hypot(right[1][0] - right[0][0], right[1][1] - right[0][1]), arc2 = R2 * ((left[2] - right[2] + TAU) % TAU);
      const lace = box(.09, .03, .13); bg.add(lace);
      return { c1, c2, R1, R2, right, left, Ls1, arc1: R1 * ((right[2] - left[2] + TAU) % TAU), arc2, lace };
    })();
    // ---- gas lamps over the mule gate (lit, a little flicker) and the people who work the mule
    M.lamps = [];
    for (const x of [5.2, -1.6, -7.6, -13.6]) { rodAt(g, [x, 5.6, -3.7], [x, 3.25, -3.7], .02); sbox(g, .14, .1, .14, x, 3.2, -3.7); const gl = glow('#FFC27A', 1.1, 1.4); gl.position.set(x, 3.06, -3.7); g.add(gl); M.lamps.push(gl); }
    M.minder = P.make('m2', { outfit: ['cap'] }); g.add(M.minder.root);
    M.piecer = P.make('child', { height: .74, outfit: ['cap'] }); g.add(M.piecer.root);
    // ---- light: sun shafts through the windows of the left and far walls, and dust that sparkles in them
    M.shafts = [];
    const addShaft = (O, e1, e2, len) => {
      const e3 = LD.clone().multiplyScalar(len), m = shaftMat(), B4 = new THREE.Matrix4().makeBasis(e1, e2, e3).setPosition(O);
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1).translate(.5, .5, .5), m); mesh.matrixAutoUpdate = false; mesh.matrix.copy(B4); mesh.frustumCulled = false;
      m.uniforms.uO.value.copy(O); m.uniforms.uInv.value.setFromMatrix4(B4).invert(); m.uniforms.uSun.value.copy(LD).negate(); g.add(mesh); M.shafts.push(m);
    };
    WIN_L.forEach(x => addShaft(V3(x - WW / 2, SILL, ZL), V3(WW, 0, 0), V3(0, SPRING - SILL + .55, 0), 11));
    WIN_F.forEach(z => addShaft(V3(XF, SILL, z + WW / 2), V3(0, 0, -WW), V3(0, SPRING - SILL + .55, 0), 11));
    const ND = 900, dp = new Float32Array(ND * 3), db = new Float32Array(ND), dg = new THREE.BufferGeometry();
    dg.setAttribute('position', new THREE.BufferAttribute(dp, 3)); dg.setAttribute('b', new THREE.BufferAttribute(db, 1));
    const dm = new THREE.ShaderMaterial({ uniforms: { uPx: { value: 1 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'attribute float b; varying float vB; uniform float uPx; void main(){ vB = b; vec4 mv = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv; gl_PointSize = clamp(10. / -mv.z, 1., 4.) * uPx; }',
      fragmentShader: 'varying float vB; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(vec3(1., .8, .52) * vB * exp(-d * d * 14.), 1.); }' });
    const dust = new THREE.Points(dg, dm); dust.frustumCulled = false; g.add(dust); M.dust = { dp, db, dg, dm, ND };
    return M;
  }

  // the belt's lacing: a point that rides around the loop (down the right strand, under the fast pulley, up the left, over the top)
  function beltAt(bt, s) {
    const L = 2 * bt.Ls1 + bt.arc1 + bt.arc2; s = ((s % L) + L) % L;
    const { right, left } = bt, lin = (p, q, u) => [lerp(p[0], q[0], u), lerp(p[1], q[1], u), Math.atan2(q[1] - p[1], q[0] - p[0])];
    if (s < bt.Ls1) return lin(right[1], right[0], s / bt.Ls1);
    s -= bt.Ls1;
    if (s < bt.arc1) { const a = right[2] - s / bt.R1; return [bt.c1[0] + bt.R1 * Math.cos(a), bt.c1[1] + bt.R1 * Math.sin(a), a - PI / 2]; }
    s -= bt.arc1;
    if (s < bt.Ls1) return lin(left[0], left[1], s / bt.Ls1);
    s -= bt.Ls1; const a = left[2] - s / bt.R2; return [bt.c2[0] + bt.R2 * Math.cos(a), bt.c2[1] + bt.R2 * Math.sin(a), a - PI / 2];
  }

  function millFrame(M, t, lt, camera, PX) {
    const m = mule(t), zc = -m.c;
    sky({ ...MILL, time: t, ptPos: [-1.6, 3.06, -3.7], ptCol: '#FFB86A', ptK: 1.0, ptR: 2.6 });
    // drive: pulley, line shaft (belt ratio), gears (mesh ratios), quadrant (from the carriage), belt lacing
    const th = crankAngle(t), thl = th * HS.Rp / HS.Rl;
    M.fp.rotation.z = th; M.lp.forEach(w => w.rotation.z = thl);
    M.g1.rotation.z = th; M.g2.rotation.z = meshAngle(th, GT.n1, GT.psi12, GT.n2); M.g3.rotation.z = M.g2.rotation.z; M.g4.rotation.z = meshAngle(M.g3.rotation.z, GT.n3, GT.psi34, GT.n4);
    const q = lerp(.6, -.6, m.k); M.q.rotation.z = q; M.qp.rotation.z = meshAngle(q, QP.n, QP.psi, QP.np);
    const [la, lb, lr] = beltAt(M.belt, (crankAngle(80) - th) * M.belt.R1); M.belt.lace.position.set(la, lb, 0); M.belt.lace.rotation.z = lr;
    // carriage, wheels, faller
    M.car.position.z = zc;
    M.cw.forEach(w => w.rotation.z = -(m.c - MU.IN) / .12);
    setRod(M.faller, [M.CL, m.yF, .075], [M.CR, m.yF, .075]);
    M.arms.forEach(({ a, x }) => setRod(a, [x, .5, -.1], [x, m.yF, .075]));
    M.q.parent.updateMatrixWorld(true); const nutW = M.q.localToWorld(V3(0, .74, .03));
    setRod(M.chain, nutW.toArray(), [M.CL + .08, .42, zc - .26 - .1]);
    // the yarn: nip -> spindle tip while the yarn is drawn; nip -> faller wire -> cop while it winds
    const tp = M.thr.pos;
    for (let i = 0; i < MU.N; i++) {
      const x = MX(i), o = i * 12; tp[o] = x; tp[o + 1] = MU.Y_NIP; tp[o + 2] = 0;
      if (m.yF < MU.Y_NIP - .005) {
        const yF = m.yF, zF = zc + .075, yW = yF - .035, zW = zc + MU.LEAN * (yW - MU.Y_BASE) / (MU.Y_NIP - MU.Y_BASE);
        tp[o + 3] = x; tp[o + 4] = yF; tp[o + 5] = zF; tp[o + 6] = x; tp[o + 7] = yF; tp[o + 8] = zF; tp[o + 9] = x; tp[o + 10] = yW; tp[o + 11] = zW;
      } else { const zt = zc + MU.LEAN; tp[o + 3] = x; tp[o + 4] = MU.Y_NIP; tp[o + 5] = zt; tp[o + 6] = x; tp[o + 7] = MU.Y_NIP; tp[o + 8] = zt; tp[o + 9] = x; tp[o + 10] = MU.Y_NIP - .05; tp[o + 11] = zt - .014; }
    }
    M.thr.geo.attributes.position.needsUpdate = true;
    const sun = V3(...MILL.sunDir).normalize();
    M.thr.mat.uniforms.uTw.value = m.tw; M.thr.mat.uniforms.uL.value.copy(sun); M.rov.mat.uniforms.uL.value.copy(sun); M.sheet.mat.uniforms.uL.value.copy(sun);
    const y2 = tp[4], z2 = tp[5];                                             // the sheet spans nip -> first bend, along the whole mule
    M.sheet.pos.set([MX(0), MU.Y_NIP, 0, MXE, MU.Y_NIP, 0, MXE, y2, z2, MX(0), y2, z2]); M.sheet.geo.attributes.position.needsUpdate = true;
    // light: the shafts breathe as thin cloud passes the sun; the gas lamps flicker; dust drifts and sparkles in the beams
    const cloud = .82 + .18 * noise(t * .9 + 3);
    M.shafts.forEach((sm, i) => sm.uniforms.uK.value = .17 * cloud * (.9 + .1 * noise(t * 1.3 + i * 7)));
    M.lamps.forEach((l, i) => setGlow(l, 1.4 * (.9 + .1 * noise(t * 9 + i * 5)), 1.1));
    M.chims.forEach(({ pl, e }, i) => pl.userData.update(t + i * 3, 1, () => e));
    const { dp, db, dg, dm, ND } = M.dust;
    for (let i = 0; i < ND; i++) {
      const x = lerp(-15, 7, hash(i * 1.3)) + noise(t * .21 + i) * .4 + t * .05, y = lerp(.3, 4.8, hash(i * 2.9)) + noise(t * .17 + i * 3) * .3 - ((t * .03 + hash(i)) % 1) * .2, z = lerp(-3.6, 4.3, hash(i * 4.7)) + noise(t * .19 + i * 5) * .4;
      dp[i * 3] = x; dp[i * 3 + 1] = y; dp[i * 3 + 2] = z;
      db[i] = inBeam(x, y, z) * (.55 + .45 * Math.sin(t * (2 + hash(i * 7) * 3) + i)) * 1.6 * cloud + .015;
    }
    dg.attributes.position.needsUpdate = dg.attributes.b.needsUpdate = true; dm.uniforms.uPx.value = PX;
    // the minder watches the yarn and reaches in to piece a broken end at the head of the draw; the piecer follows the carriage
    P.at(M.minder, [-3.3, 0, -2.95], .2); P.clip(M.minder, 'Idle_Loop', t + .7);
    P.turn(M.minder, 'neck_01', [.18, -.12 * m.k, 0]); P.turn(M.minder, 'Head', [.22, -.15 * m.k, 0]);
    const kr = smooth(seg(t, 84.62, 84.95)) * (1 - smooth(seg(t, 85.32, 85.62)));
    reachK(M.minder, 'r', [-3.47, .86, zc + .3], [-3.05, .6, -2.6], kr);
    P.at(M.piecer, [-8.6, 0, -2.75], -.15); P.clip(M.piecer, 'Idle_Loop', t + 1.9);
    P.turn(M.piecer, 'Head', [.15, .25 * (m.k - .5), 0]);
    // camera: from the match frame, pull back and rise, turning down the length of the mule toward the windows
    const kA = ease(seg(lt, .06, 1.52)), kB = smooth(seg(lt, 1.52, T12M - T12));
    const F1 = { C: V3(2.6, 2.4, -4.15), L: V3(-5.5, .85, 1.0), fov: 39 }, F2 = { C: V3(2.2, 2.45, -3.95), L: V3(-5.6, .9, 1.1), fov: 38 };
    const C = MATCH.C.clone().lerp(F1.C, kA).lerp(F2.C, kB), Lk = MATCH.L.clone().lerp(F1.L, kA).lerp(F2.L, kB);
    cam(camera, C.toArray(), Lk.toArray(), lerp(lerp(40, F1.fov, kA), F2.fov, kB));
  }

  // ---- the road at dusk: a horse and gig trot on the far lane, two motor cars overtake on the near lane (they keep left)
  const RY = .45, LANE_H = -1.45, LANE_C = 1.4;                              // road surface height (a causeway), lane centres
  const V_H = 3.2, V_C = 9.5, HSC = .46;                                     // horse trot, cars (m/s), horse scale
  const xHorse = l => 2.0 + V_H * l;                                         // horse's root (l = t - T12M)
  const xCar1 = l => -4.4 + V_C * l, xCar2 = l => -9.6 + V_C * l;           // car roots (the middle of each car)
  const CAMX0 = 1.0, CA = .5, CB = 1.75;                                     // the camera rides with the horse, then speeds up to the cars
  const camX = l => { if (l < CA) return CAMX0 + V_H * l; const s = Math.min(1, (l - CA) / (CB - CA)), extra = (V_C - V_H) * (CB - CA) * (s * s * s - s * s * s * s / 2);
    return CAMX0 + V_H * l + extra + (l > CB ? (V_C - V_H) * (l - CB) : 0); };
  // a two-beat diagonal trot: each hoof is planted for `duty` of the cycle at the point under its neutral position at
  // mid-stance, then swings to the next one in an arc. The walk clip moves the rest of the body at the trot's cadence.
  const TROT = { T: .6, duty: .4, legs: [
    { up: 'FrontUpperLegL', lo: 'FrontLowerLegL', ph: 0, z0: 1.42, lift: .5, len: 1.04 },
    { up: 'FrontUpperLegR', lo: 'FrontLowerLegR', ph: .5, z0: 1.42, lift: .5, len: 1.04 },
    { up: 'BackUpperLegL', lo: 'BackLowerLegL', ph: .52, z0: -1.37, lift: .34, len: 1.16 },
    { up: 'BackUpperLegR', lo: 'BackLowerLegR', ph: .02, z0: -1.37, lift: .34, len: 1.16 }] };
  const HIND = ['BackShoulder', 'BackLeg', 'BackUpperLeg', 'BackLowerLeg'];
  function trot(h, l, X, z) {
    const u0 = l / TROT.T, bounce = -.022 * Math.cos(4 * PI * (u0 - TROT.duty / 2));
    P.at(h, [X(l), RY + bounce, z], PI / 2);
    P.clip(h, 'Walk', u0 * 1.1667, { skip: HIND }); P.clip(h, 'Walk', (u0 + .5) * 1.1667, { only: HIND, keep: true });
    for (const L of TROT.legs) {
      const p = u0 + L.ph, n = Math.floor(p), u = p - n, H = k => X((k - L.ph + TROT.duty / 2) * TROT.T) + L.z0 * HSC;
      let hx = H(n), hy = 0;
      if (u >= TROT.duty) { const s = (u - TROT.duty) / (1 - TROT.duty); hx = lerp(H(n), H(n + 1), smooth(s)); hy = L.lift * HSC * Math.pow(Math.sin(PI * Math.pow(s, .8)), 1.3); }
      const f = wpos(L.hoof), kn = wpos(h.bones[L.lo]), fwd = L.z0 > 0 ? 1 : -1;   // front knees bend forward, hind hocks back
      ik2(h.root, h.bones[L.up], h.bones[L.lo], L.hoof, [hx, RY + .14 * HSC + hy, f.z], [kn.x + fwd * .8, kn.y, kn.z]);
    }
  }
  // the gig: two tall wheels, a seat over the axle, a dash, shafts to the horse; the body pitches about the axle so the shafts
  // meet the horse's tugs
  function buildGig() {
    const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    const RG = .7, W = [];
    for (const z of [.8, -.8]) { const w = spoked(RG, 14, { rim: .07, spoke: .05, hub: .12, hubL: .34 }); w.position.z = z; g.add(w); W.push(w); }
    rodAt(g, [0, 0, -.85], [0, 0, .85], .03);
    sbox(body, .62, .34, 1.1, -.05, .52, 0); sbox(body, .68, .08, 1.14, -.05, .73, 0);
    for (const z of [.55, -.55]) rodAt(body, [-.34, .76, z], [-.4, 1.06, z], .018);
    rodAt(body, [-.4, 1.06, -.56], [-.4, 1.06, .56], .022);
    sbox(body, .72, .04, .92, .55, .22, 0);
    const dash = box(.035, .58, .94); dash.position.set(.94, .46, 0); dash.rotation.z = -.28; body.add(dash);
    for (const z of [.42, -.42]) { rodAt(body, [.1, .3, z], [1.5, .44, z], .022); rodAt(body, [1.5, .44, z], [2.6, .42, z], .02); rodAt(body, [2.6, .42, z], [3.02, .36, z], .018); }
    for (const z of [.5, -.5]) { const sp = new THREE.Mesh(new THREE.TorusGeometry(.2, .02, 5, 16, PI), silMat()); sp.scale.y = .35; sp.position.set(0, .3, z); body.add(sp); }
    const lamps = [];
    for (const z of [.5, -.5]) { sbox(body, .1, .15, .1, .9, .66, z); const l = glow('#FFC67E', .55, 1.4); l.position.set(.97, .66, z + Math.sign(z) * .04); body.add(l); lamps.push(l); }
    rodAt(body, [.86, .52, .45], [.32, 2.25, .5], .011);                    // the whip in its socket, its lash curling forward
    const lash = [[.32, 2.25], [.7, 2.42], [1.08, 2.36], [1.32, 2.12], [1.42, 1.86]];
    for (let i = 0; i < lash.length - 1; i++) rodAt(body, [lash[i][0], lash[i][1], .5], [lash[i + 1][0], lash[i + 1][1], .5], .006);
    return { g, body, W, RG, tug: V3(2.2, .42, 0), seat: V3(-.08, .78, .22), lamps };
  }
  // an early motor car (about 1910): tall body, spoked wooden wheels, upright windscreen, brass lamps. Local x forward, z to
  // the car's right (the camera side when it drives left to right), origin on the road under the car's middle.
  function carWheel(R) {
    const w = new THREE.Group(), m = silMat();
    w.add(new THREE.Mesh(new THREE.TorusGeometry(R - .045, .045, 8, 48), m));
    w.add(new THREE.Mesh(new THREE.TorusGeometry(R - .1, .018, 5, 40), m));
    for (let i = 0; i < 12; i++) { const h = new THREE.Group(), s = box(R - .17, .034, .03); s.position.x = .06 + (R - .17) / 2; h.add(s); h.rotation.z = i / 12 * TAU; w.add(h); }
    const hub = cyl(.065, .065, .16, null, 12); hub.rotation.x = PI / 2; w.add(hub);
    const capH = cyl(.04, .04, .24, null, 10); capH.rotation.x = PI / 2; w.add(capH);
    return w;
  }
  function motorCar(o) {
    const g = new THREE.Group(), b = new THREE.Group(); g.add(b);
    const R = o.R, fa = o.fa, ra = o.ra, W = [];
    for (const [x, z] of [[fa, .72], [fa, -.72], [ra, .72], [ra, -.72]]) { const w = carWheel(R); w.position.set(x, R, z); g.add(w); W.push(w); }
    const fx = fa + .45;                                                       // the radiator's x
    sbox(b, fx - ra + .45, .12, .84, (fx + ra - .45) / 2, .52, 0);            // chassis
    sbox(b, .1, .6, .64, fx, .9, 0); addAt(b, cyl(.04, .04, .06, null, 8), fx, 1.23, 0);
    sbox(b, fx - .62, .44, .68, (fx + .62) / 2 - .05, .89, 0);               // bonnet
    const sc = prism([[.38, .62], [.62, .62], [.62, 1.11], [.38, 1.25]], 1.34); sc.position.z = -.67; b.add(sc);   // scuttle
    sbox(b, 2.23 + (o.tub ?? 0), .52, 1.32, -.735 - (o.tub ?? 0) / 2, .88, 0);  // the body tub
    sbox(b, .14, .42, 1.24, -.3, 1.32, 0); const r1 = cyl(.07, .07, 1.24, null, 10); r1.rotation.x = PI / 2; r1.position.set(-.3, 1.53, 0); b.add(r1);
    const xr = -1.72 - (o.tub ?? 0);
    sbox(b, .16, .5, 1.3, xr, 1.38, 0); const r2 = cyl(.075, .075, 1.3, null, 10); r2.rotation.x = PI / 2; r2.position.set(xr, 1.63, 0); b.add(r2);
    for (const z of [.62, -.62]) { rodAt(b, [.4, 1.18, z], [.42, 1.92, z], .018); }
    rodAt(b, [.42, 1.92, -.62], [.42, 1.92, .62], .018); rodAt(b, [.41, 1.56, -.62], [.41, 1.56, .62], .012);
    // mudguards over the wheels and the running board between them
    const guard = (x, z) => { const s = new THREE.Shape(); s.absarc(0, 0, R + .1, .2, PI - .25, false); s.absarc(0, 0, R + .055, PI - .25, .2, true);
      const m = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: .24, bevelEnabled: false, curveSegments: 16 }), silMat()); m.position.set(x, R, z - .12); b.add(m); };
    for (const z of [.74, -.74]) { guard(fa, z); guard(ra, z); sbox(b, (fa - R - .05) - (ra + R + .05), .035, .26, (fa + ra) / 2, .57, z * 1.05); }
    // lamps: two big headlamps (acetylene: warm white, with a beam in the dusty air), two side lamps
    const lamps = [], beams = [];
    for (const z of [.48, -.48]) {
      const d = cyl(.1, .085, .2, null, 14); d.rotation.z = PI / 2; d.position.set(fx + .14, .98, z); b.add(d); rodAt(b, [fx - .02, .8, z], [fx + .1, .92, z], .015);
      const lens = new THREE.Mesh(new THREE.CircleGeometry(.085, 16), litMat('#FFF1D2', 3.4)); lens.rotation.y = PI / 2; lens.position.set(fx + .245, .98, z); b.add(lens);
      const gl = glow('#FFE6B8', .62, 2.2); gl.position.set(fx + .3, .98, z); b.add(gl); lamps.push(gl);
      const bm = new THREE.Mesh(new THREE.ConeGeometry(.5, 3.6, 20, 1, true), new THREE.MeshBasicMaterial({ map: beamTex, color: new THREE.Color('#FFE2B0').multiplyScalar(.03), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
      bm.rotation.z = PI / 2; bm.position.set(fx + .3 + 1.8, .92, z); b.add(bm); beams.push(bm);
    }
    for (const z of [.7, -.7]) { sbox(b, .09, .12, .09, .4, 1.2, z); const gl = glow('#FFC67E', .3, 1.4); gl.position.set(.46, 1.2, z); b.add(gl); lamps.push(gl); }
    // the bulb horn on the driver's side, the steering column and wheel, the tail pipe
    rodAt(b, [.44, 1.3, .74], [.62, 1.24, .76], .012); rodAt(b, [.62, 1.24, .76], [.74, 1.27, .76], .012);
    const bell = cone(.055, .1, null, 12); bell.rotation.z = PI / 2; bell.position.set(.79, 1.27, .76); b.add(bell);   // the bulb horn: the bell flares forward
    addAt(b, sph(.05, null, 8), .41, 1.31, .74);
    rodAt(b, [.62, .72, .32], [.13, 1.36, .32], .02);
    const sw = new THREE.Group(), ring = new THREE.Mesh(new THREE.TorusGeometry(.19, .014, 6, 24), silMat()); ring.rotation.x = PI / 2; sw.add(ring); sw.rotation.z = .65; sw.position.set(.13, 1.36, .32); b.add(sw);
    rodAt(b, [ra - .1, .42, -.3], [ra - .7 - (o.tub ?? 0), .38, -.3], .022);
    if (o.top) {                                                               // the hood raised: a roof, a closed rear quarter, bows
      sbox(b, 2.35 + (o.tub ?? 0), .04, 1.38, -.75 - (o.tub ?? 0) / 2, 1.96, 0);
      const q = prism([[0, 1.16], [0, 1.74], [.18, 1.9], [.42, 1.96], [.6, 1.96], [.6, 1.16]], 1.38); q.position.set(xr - .14, 0, -.69); b.add(q);
      for (const z of [.68, -.68]) rodAt(b, [-.62, 1.15, z], [-.66, 1.95, z], .016);
    } else {                                                                   // the hood folded down behind the rear seat
      const f = cyl(.13, .13, 1.32, null, 10); f.rotation.x = PI / 2; f.position.set(xr - .2, 1.62, 0); b.add(f);
      for (const z of [.66, -.66]) rodAt(b, [xr + .1, 1.14, z], [xr - .22, 1.62, z], .016);
    }
    return { g, b, W, R, lamps, beams, drv: V3(-.06, .98, .32), pas: V3(xr + .42, 1.02, .32), tail: V3(ra - .72 - (o.tub ?? 0), .38, -.3), rearX: ra };
  }
  const beamTex = (() => { const c = document.createElement('canvas'); c.width = 8; c.height = 128; const x = c.getContext('2d'), gr = x.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 8, 128);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; return t; })();

  function buildRoad(G) {
    const g = new THREE.Group(); G.add(g); const R = { g }, M4 = new THREE.Matrix4();
    g.add(terrain({ size: 3000, seg: 20, amp: 0, fog: .7 }));
    // the causeway: a profile in (-z, y) extruded along x
    const eb = new THREE.Shape(); [[-6.2, 0], [-3.3, RY], [3.3, RY], [5.6, 0]].forEach(([x, y], i) => i ? eb.lineTo(x, y) : eb.moveTo(x, y));
    const ebg = new THREE.ExtrudeGeometry(eb, { depth: 500, bevelEnabled: false }); ebg.rotateY(PI / 2); ebg.translate(-200, 0, 0);
    g.add(new THREE.Mesh(ebg, silMat()));
    // the mill across the fields: five storeys of lit windows, a roof, a stair tower, the chimney; a weaving shed; houses
    const MZ = -74;
    sbox(g, 220, 21, 14, 40, 10.5, MZ - 7);
    const roof = prism([[-7, 0], [7, 0], [0, 4.2]], 220); roof.rotation.y = PI / 2; roof.position.set(-70, 21, MZ - 7); g.add(roof);
    sbox(g, 7, 31, 7, 18, 15.5, MZ + 1); const tc = cone(5.4, 5, null, 4); tc.rotation.y = PI / 4; tc.position.set(18, 33.5, MZ + 1); g.add(tc);
    const ch = cyl(1.5, 2.6, 60, null, 4); ch.rotation.y = PI / 4; ch.position.set(40, 30, MZ - 12); g.add(ch); addAt(g, box(4.6, 1.4, 4.6), 40, 60.4, MZ - 12);
    sbox(g, 80, 7, 30, -112, 3.5, MZ + 10);
    for (let i = 0; i < 16; i++) { const t = prism([[0, 0], [5, 0], [5, 3]], 30); t.position.set(-152 + i * 5, 7, MZ - 5); g.add(t); }
    const wins = [];
    for (let r = 0; r < 5; r++) for (let x = -66; x < 148; x += 3.3) { if (Math.abs(x - 18) < 4.5 || hash(x * 3.1 + r * 17) < .1) continue; wins.push([x, 2.8 + r * 4.1, MZ + .05, 1.35, 2.5, hash(x + r * 7)]); }
    for (let i = 0; i < 15; i++) wins.push([-149.5 + i * 5.2, 3.6, MZ + 25.05, 3.2, 2.2, .5]);
    for (const [k, col] of [[.0, '#FFB458'], [.5, '#FFC878']]) {
      const sel = wins.filter(w => (w[5] < .5) === (k === 0)), im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, .1), litMat(col, 1.35), sel.length);
      sel.forEach(([x, y, z, w, h], i) => { M4.makeScale(w, h, 1); M4.setPosition(x, y, z); im.setMatrixAt(i, M4); }); im.frustumCulled = false; g.add(im);
    }
    for (let i = 0; i < 18; i++) { const x = -40 + i * 9 + hash(i) * 3, h = 5 + hash(i * 3) * 2.5; sbox(g, 8, h, 6, x, h / 2, -40); const rf = prism([[-4, 0], [4, 0], [0, 2.4]], 6); rf.position.set(x, h, -43); g.add(rf);
      addAt(g, box(.6, 1.6, .6), x + 2, h + 1.6, -40); if (hash(i * 5) > .5) addAt(g, box(.9, 1.2, .1, litMat('#FFB458', 1.1)), x - 1.5, 2, -36.95); }
    g.add(ridge({ z: -520, h: 46, w: 3000, rough: 9, seed: 12, under: 120 }));
    R.smk = plume({ n: 26, life: 9, size: 18, drift: [3.6, 1.8, 0], spread: 3, op: .9 }); g.add(R.smk);
    // telegraph poles with sagging wires, and gas lamps along the far verge
    const wm = new THREE.LineBasicMaterial({ color: '#07080D' }), wpts = [];
    for (let x = -48; x <= 102; x += 30) {
      rodAt(g, [x, 0, -4.4], [x, 7.6, -4.4], .1); sbox(g, .1, .1, 1.5, x, 7.15, -4.4);
      for (const z of [-.6, -.2, .2, .6]) addAt(g, cyl(.035, .045, .14, null, 6), x, 7.27, -4.4 + z);
      if (x < 90) for (const z of [-.6, -.2, .2, .6]) for (let k = 0; k < 12; k++) { const u0 = k / 12, u1 = (k + 1) / 12, sag = u => -.55 * 4 * u * (1 - u); wpts.push(V3(x + 30 * u0, 7.33 + sag(u0), -4.4 + z), V3(x + 30 * u1, 7.33 + sag(u1), -4.4 + z)); }
    }
    g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(wpts), wm));
    R.lamps = [];
    for (const x of [7, 37]) { rodAt(g, [x, RY, -3.9], [x, RY + 3.5, -3.9], .05); sbox(g, .3, .42, .3, x, RY + 3.7, -3.9); addAt(g, cone(.24, .22, null, 4), x, RY + 4.02, -3.9).rotation.y = PI / 4;
      const gl = glow('#FFC67E', 1.6, 1.5); gl.position.set(x, RY + 3.68, -3.75); g.add(gl); R.lamps.push(gl); }
    // the horse, with hoof markers on its lower legs for the IK
    R.horse = P.beast('horse', HSC); g.add(R.horse.root);
    for (const L of TROT.legs) { L.hoof = new THREE.Object3D(); L.hoof.position.set(0, L.len, 0); R.horse.bones[L.lo].add(L.hoof); }
    R.gig = buildGig(); g.add(R.gig.g);
    R.gd = P.make('m1', { outfit: ['bowler'] }); g.add(R.gd.root);
    R.reins = [rod(.007), rod(.007)]; R.reins.forEach(r => g.add(r));
    R.car1 = motorCar({ R: .4, fa: 1.22, ra: -1.4 }); g.add(R.car1.g);
    R.car2 = motorCar({ R: .42, fa: 1.32, ra: -1.5, top: true, tub: .1 }); g.add(R.car2.g);
    R.d1 = P.make('m2', { outfit: ['cap'] }); R.p1 = P.make('w1', { outfit: ['wide'] }); R.d2 = P.make('m3', { outfit: ['cap'] }); R.p2 = P.make('m1', { outfit: ['top'] });
    [R.d1, R.p1, R.d2, R.p2].forEach(p => g.add(p.root));
    // exhaust puffs, the dust the cars raise, and the pall of mill smoke over the road that ends the shot
    R.ex = [0, 1].map(() => { const pl = plume({ n: 18, life: 1.5, size: .6, s0: .35, grow: 2.4, drift: [-.4, .55, .3], spread: .25, op: .7, col: '#B4A6AC' }); g.add(pl); return pl; });
    R.du = [0, 1].map(() => { const pl = plume({ n: 20, life: 2.6, size: 2.4, s0: .3, grow: 1.5, drift: [-.5, .45, 1.0], spread: .7, op: .34, col: '#E09868' }); g.add(pl); return pl; });
    R.pall = []; for (let i = 0; i < 16; i++) { const m = new THREE.SpriteMaterial({ map: puffTex, color: new THREE.Color(SMOKE_COL), transparent: true, depthWrite: false, opacity: 0, fog: false }); const s = new THREE.Sprite(m); R.pall.push(s); g.add(s); }
    return R;
  }

  function placeCar(C, x, l, t, drv, pas, seed) {
    C.g.position.set(x, RY, LANE_C);
    C.b.position.y = .006 * noise(t * 31 + seed) + .004 * Math.sin(t * 52 + seed);      // the chassis shakes a little at idle beat
    C.W.forEach(w => w.rotation.z = -x / C.R);
    C.lamps.forEach((gl, i) => setGlow(gl, gl.userData.base.k * (.94 + .06 * noise(t * 17 + i + seed)), gl.userData.base.size));
    C.g.updateMatrixWorld(true);
    seat(drv, C.g.localToWorld(C.drv.clone()), PI / 2, 'Driving_Loop', t * .5 + seed);
    const wl = C.g.localToWorld(V3(.17, 1.44, .2)), wr = C.g.localToWorld(V3(.17, 1.44, .46));
    P.reach(drv, 'l', wl.toArray(), [wl.x - .3, wl.y - .4, wl.z - .3]); P.reach(drv, 'r', wr.toArray(), [wr.x - .3, wr.y - .4, wr.z + .3]);
    seat(pas, C.g.localToWorld(C.pas.clone()), PI / 2, 'Sitting_Idle_Loop', t + seed);
    return C;
  }

  function roadFrame(R, t, camera, PX) {
    const l = t - T12M;
    // horse and gig
    trot(R.horse, l, xHorse, LANE_H);
    const tug = wpos(R.horse.bones.Torso2); tug.y -= .26;
    const G = R.gig, Lt = G.tug.length(), bt = Math.atan2(G.tug.y, G.tug.x), sa = clamp((tug.y - RY - G.RG) / Lt, -1, 1);
    const al = Math.asin(sa) - bt, xa = tug.x - Lt * Math.cos(al + bt);
    G.g.position.set(xa, RY + G.RG, LANE_H); G.body.rotation.z = al; G.W.forEach(w => w.rotation.z = -xa / G.RG);
    G.lamps.forEach((gl, i) => setGlow(gl, 1.4 * (.9 + .1 * noise(t * 11 + i)), .55));
    G.g.updateMatrixWorld(true);
    seat(R.gd, G.body.localToWorld(G.seat.clone()), PI / 2, 'Driving_Loop', t * .6);
    // the driver turns his head to watch the motor cars go by
    const near = Math.min(Math.abs(xCar1(l) - xa), Math.abs(xCar2(l) - xa)), look = smooth(1 - clamp((near - 1) / 6));
    P.turn(R.gd, 'Head', [0, -.7 * look, 0]);
    const bit = wpos(R.horse.bones.Head); bit.x += .32; bit.y -= .12;
    for (const [i, s] of [[0, 'l'], [1, 'r']]) { const hd = P.hand(R.gd, s); setRod(R.reins[i], hd.toArray(), [bit.x, bit.y, bit.z + (i ? .1 : -.1)]); }
    // the cars
    const c1 = xCar1(l), c2 = xCar2(l);
    placeCar(R.car1, c1, l, t, R.d1, R.p1, 1.3); placeCar(R.car2, c2, l, t, R.d2, R.p2, 4.1);
    P.turn(R.p1, 'Head', [0, .5 * smooth(1 - clamp(Math.abs(c1 - xa - 1) / 4)), 0]);   // the passenger looks at the horse as they pass
    // exhaust (released from the tail pipes) and dust (from the rear wheels)
    [[R.car1, xCar1], [R.car2, xCar2]].forEach(([C, X], i) => {
      const o1 = i * .37, o2 = i * .61;                                       // decorrelate the two cars' puffs (the emitters undo the offset)
      R.ex[i].userData.update(t + o1, 1, te => { const tt = te - o1, x = X(tt - T12M); return [x + C.tail.x, RY + C.tail.y, LANE_C + C.tail.z, tt > T12M - .3]; });
      R.du[i].userData.update(t + o2, 1, te => { const tt = te - o2, x = X(tt - T12M); return [x + C.rearX, RY + .45, LANE_C + .6, tt > T12M - .6]; });
    });
    // the mill chimney smoke, and the pall of smoke the road runs into at the end of the shot
    R.smk.userData.update(t, 1, () => [40, 61, -86]);
    const pk = smooth(seg(t, T12E - .75, T12E - .05));
    R.pall.forEach((s, i) => { s.position.set(19 + hash(i * 2.3) * 14 + noise(t * .4 + i) * 1.2 + t * .8 - 70, .6 + hash(i * 4.1) * 5.5, -1 + hash(i * 6.7) * 8); s.scale.setScalar(6 + hash(i * 3.3) * 6); s.material.opacity = pk * .92; s.material.rotation = i + t * .05; s.visible = pk > .002; });
    // light: the dusk sky behind the mill rims everything; car 1's headlamps light the horse's quarters as it comes up
    const hl = R.car1.g.localToWorld(V3(1.9, .98, .48));
    sky({ ...ROAD, time: t, ptPos: hl.toArray(), ptCol: '#FFE6B8', ptK: .8, ptR: 2.2 });
    R.lamps.forEach((gl, i) => setGlow(gl, 1.5 * (.9 + .1 * noise(t * 7 + i * 3)), 1.6));
    // camera: low in the ditch below the road, riding with the horse, then speeding up with the cars as the horse falls behind
    const X = camX(l), lead = .3 + .7 * smooth(seg(l, 1.0, 2.4));
    cam(camera, [X, .3, 9.0], [X + lead, 2.2, 0], 38);
  }

  SHOT({ id: 'S12', t0: T12, t1: T12E, out: { kind: 'dip', d: .6, col: '#150D0C' },
    build(G) { return { M: buildMill(G), R: buildRoad(G) }; },
    frame(s, lt, dur, t, { camera, PX }) {
      const mill = t < T12M; s.M.g.visible = mill; s.R.g.visible = !mill;
      if (mill) millFrame(s.M, t, lt, camera, PX); else roadFrame(s.R, t, camera, PX);
    },
  });

  // ======================================================================== S13 banishing the night
  const SW_T = 90.46;                                                       // contact of the knife switch, on a beat
  const WAVE_BEATS = [90.46, 91.14, 91.80, 92.46, 93.14, 93.80];
  const CUT_BACK = SW_T + .1;
  const waveOn = (x, z, jit = 0) => {                                       // when the light reaches (x, z): near to far, snapped to the beats
    const D = Math.hypot(x, 12 - z), raw = 90.5 + 3.1 * Math.pow(D / 340, .8);
    let best = WAVE_BEATS[0], bd = 9; for (const b of WAVE_BEATS) if (Math.abs(b - raw) < bd) { bd = Math.abs(b - raw); best = b; }
    return (bd < .4 ? best : raw) + jit;
  };
  const COUPLE = { x: 2.9, z0: -5.2, v: 1.15 };                             // a couple walks toward the camera on the right pavement
  const LAMPLIGHTER = { x: -3.15, z: 2.45, lamp: [-3.7, 5.55, 2] };
  SHOT({ id: 'S13', t0: LINE(11)[0], t1: LINE(12)[0], out: { kind: 'cut' },
    build(G) {
      const st = new THREE.Group(); G.add(st);
      st.add(terrain({ size: 3000, seg: 12, amp: 0, fog: .6 }));
      const win = [];                                                        // windows: [x, y, z, sx, sy, sz, onTime, gaslit]
      const addWin = (x, y, z, sx, sy, sz, jit) => win.push([x, y, z, sx, sy, sz, waveOn(x, z, jit), hash(x * 1.7 + y * 3.1 + z * .37) < .34]);
      function bld(x0, x1, z0, z1, h, seed, faceX, faceZ, rows = true) {
        const w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
        sbox(st, w, h, d, cx, h / 2, cz);
        sbox(st, w + .9, .7, d + .9, cx, h + .15, cz); sbox(st, w + .5, .35, d + .5, cx, h - .6, cz);          // cornice
        if (hash(seed * 7) > .45) sbox(st, w * .5, 1.3, d * .5, cx, h + 1.2, cz);                                // parapet block
        const nch = 1 + Math.floor(hash(seed * 3) * 3);
        for (let c = 0; c < nch; c++) sbox(st, .9, 1.8 + hash(seed + c) * 1.8, .9, x0 + w * (.15 + .7 * hash(seed * 5 + c)), h + 1.6, z0 + d * (.15 + .7 * hash(seed * 11 + c)));
        if (!rows) return;
        if (faceX) for (let y = 3.2; y < h - 1.8; y += 3.3) for (let z = z0 + 1.4; z < z1 - .9; z += 2.7) addWin(faceX, y, z, .08, 1.7, 1.0, hash(y * 3 + z * 7 + seed) * .22);
        if (faceZ) for (let y = 3.2; y < h - 1.8; y += 3.4) for (let x = x0 + 1.4; x < x1 - .9; x += 3.0) addWin(x, y, faceZ, 1.1, 1.7, .08, hash(y * 5 + x * 3 + seed) * .22);
      }
      let seed = 1;
      for (const side of [-1, 1]) {
        for (let z = 16; z > -280; ) {                                       // the street's two rows, then the rows behind them
          const d = 8 + hash(seed * 3.3) * 8, h = 12 + hash(seed * 5.1) * 16, xin = side * 5.4, xout = side * (5.4 + 10 + hash(seed * 2.2) * 6);
          bld(Math.min(xin, xout), Math.max(xin, xout), z - d, z, h, seed, xin - side * .04, 0); seed++; z -= d + .6 * hash(seed);
        }
        for (let z = 10; z > -300; ) {
          const d = 12 + hash(seed * 3.7) * 10, h = 20 + hash(seed * 4.1) * 26, xin = side * 17, xout = side * (17 + 14 + hash(seed) * 10);
          bld(Math.min(xin, xout), Math.max(xin, xout), z - d, z, h, seed, xin - side * .04, 0); seed++; z -= d + 2;
        }
      }
      for (let i = 0; i < 70; i++) {                                         // the far city, facing the camera
        const x = (hash(i * 2.3) - .5) * 520, z = -120 - hash(i * 7.9) * 300, w = 14 + hash(i * 3.1) * 22, h = 14 + hash(i * 5.9) * 46;
        if (Math.abs(x) < 24 + w / 2 && z > -310) continue;
        bld(x - w / 2, x + w / 2, z - 14, z, h, 100 + i, 0, z + .04);
      }
      // electric windows (on in the wave) and gaslit windows (a warm few, lit from the start; they turn electric in the wave)
      const mkWin = (col, k) => { const m = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), litMat(col, k), win.length); m.frustumCulled = false; st.add(m); return m; };
      const wm = mkWin('#FFC878', .75), wg = mkWin('#FFA04C', .85), M4 = new THREE.Matrix4(), Q = new THREE.Quaternion();
      win.forEach(([x, y, z, sx, sy, sz], i) => { M4.compose(new THREE.Vector3(x, y, z), Q, new THREE.Vector3(sx, sy, sz)); wm.setMatrixAt(i, M4); wg.setMatrixAt(i, M4); });
      const base = Float32Array.from(wm.instanceMatrix.array);
      // lamps: gas first, electric on the wave
      const lamps = [];
      for (const side of [-1, 1]) for (let j = 0; j < 18; j++) {
        const x = side * 4.3, z = 2 - j * 13.5 - (side > 0 ? 6 : 0);
        const pole = rod(.07); setRod(pole, [x, 0, z], [x, 5.4, z]); st.add(pole);
        sbox(st, .7, .12, .12, x - side * .3, 5.45, z); sbox(st, .42, .55, .42, x - side * .6, 5.55, z);
        const mkPool = col => { const pl = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTex, color: new THREE.Color(col), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); pl.rotation.x = -PI / 2; pl.position.set(x - side * 1.6, .04, z); pl.renderOrder = 1; st.add(pl); return pl; };
        const gas = glow('#FF8A3D', 3.6, 1.5), el = glow('#CFE6FF', 3.2, 2.6), pl = mkPool('#CFE6FF'), gp = mkPool('#FF8A3D');
        gas.position.set(x - side * .6, 5.55, z); el.position.copy(gas.position); pl.scale.setScalar(9); gp.scale.setScalar(9);
        st.add(gas, el); lamps.push({ gas, el, pl, gp, x, z, pos: gas.position.clone(), on: waveOn(x, z, hash(j + side * 9) * .06), isGas: j % 2 == 0 && j < 12 });
      }
      const smk = []; for (let i = 0; i < 12; i++) { const m = new THREE.SpriteMaterial({ map: puffTex, color: new THREE.Color(SMOKE_COL), transparent: true, depthWrite: false, opacity: 1, fog: false }); const sp = new THREE.Sprite(m); smk.push(sp); st.add(sp); }
      // people in the street: a lamplighter at the first gas lamp, a couple on the right pavement
      const lighter = P.make('m1', { outfit: ['cap'] }), lpole = rod(.016), man = P.make('m2', { outfit: ['bowler'] }), wom = P.make('w1', { outfit: ['skirt', 'slouch'] });
      st.add(lighter.root, lpole, man.root, wom.root);
      // ---- the switch panel, far from the street
      const sw = new THREE.Group(); sw.position.set(2000, 0, 0); G.add(sw);
      const back = new THREE.Mesh(new THREE.PlaneGeometry(12, 8), litMat('#B07A4C', .85)); back.position.set(.5, 2, -1.6); sw.add(back);
      sbox(sw, .36, 3.6, 1.1, -.25, 1.9, -.2);                               // panel slab, edge-on
      const H = { x: .1, y: 3.0 }, Lbl = 1.65, Ljaw = 1.2, Lh = 1.5;
      sbox(sw, .32, .4, .5, H.x - .02, H.y + .05, -.1);                      // hinge block
      sbox(sw, .3, .55, .5, H.x, H.y - Ljaw - .05, -.1); sbox(sw, .1, .3, .5, H.x + .17, H.y - Ljaw + .02, -.1);       // jaws
      for (const y of [H.y + .32, H.y - Ljaw - .4]) { const ins = cyl(.09, .12, .22, null, 10); ins.rotation.z = PI / 2; ins.position.set(-.02, y, -.1); sw.add(ins); }   // porcelain insulators
      const bladeG = new THREE.Group(); bladeG.position.set(H.x + .12, H.y, .05); sw.add(bladeG);
      const bl = box(.09, Lbl, .05); bl.position.y = -Lbl / 2; bladeG.add(bl);
      const gr = box(.16, .55, .16); gr.position.y = -Lh - .05; bladeG.add(gr);
      const cross = box(.1, .1, .5); cross.position.y = -Lh - .05; bladeG.add(cross);
      // an ammeter on the panel: its needle jumps when the circuit closes
      const dial = new THREE.Mesh(new THREE.CircleGeometry(.32, 28), litMat('#F4D9A8', 1.05)); dial.position.set(-1.05, 2.95, -1.55); sw.add(dial);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(.33, .035, 6, 28), silMat()); rim.position.copy(dial.position); sw.add(rim);
      const needle = new THREE.Group(); needle.position.set(-1.05, 2.82, -1.52); const nb = box(.02, .33, .01); nb.position.y = .16; needle.add(nb); sw.add(needle);
      rodAt(sw, [-.3, H.y + .32, -.4], [-.8, 2.95, -1.5], .025);
      const man2 = P.make('m3', { outfit: ['cap'] }); sw.add(man2.root);
      const spk = sparks(36, 7); spk.position.set(H.x + .15, H.y - Ljaw, .1); sw.add(spk);
      const flash = glow('#CFE6FF', 2.4, 0); flash.position.set(H.x + .2, H.y - Ljaw, .2); sw.add(flash);
      const bulb = glow('#CFE6FF', 1.2, 0); bulb.position.set(.1, 4.3, 0); sw.add(bulb);
      return { st, wm, wg, base, win, lamps, smk, sw, bladeG, H, Lh, Ljaw, man: man2, spk, flash, bulb, back, needle, lighter, lpole, cpl: [man, wom] };
    },
    frame(s, lt, dur, t, { camera, PX }) {
      const wave = clamp((t - 90.5) / 3.3);
      const showSw = t >= 89.8 && t < CUT_BACK;
      s.st.visible = !showSw; s.sw.visible = showSw;
      if (showSw) {
        const a = t - SW_T, fl = a < 0 ? 0 : Math.exp(-a * 14) * 4;
        // the arc at the jaws is the key light at the contact; before it, the lit wall behind rims the man
        sky({ ...ELNIGHT, time: t, ptPos: [2000 + s.H.x + .2, s.H.y - s.Ljaw, .3], ptCol: '#CFE6FF', ptK: 2.5 * fl, ptR: 1.6, rimDir: [-1, .3, -.6], rimCol: '#E8B88A', rimK: 1.8 });
        const open = 40 * PI / 180, th = t < 90.16 ? open - .015 * Math.sin(t * 40) * smooth(seg(t, 89.95, 90.1)) : open * (1 - easeIn(seg(t, 90.16, SW_T)));
        s.bladeG.rotation.z = th;                                            // swings down about the hinge: tip goes from out to the right to straight down
        const hx = s.H.x + .12 + Math.sin(th) * s.Lh, hy = s.H.y - Math.cos(th) * s.Lh;
        const enter = ease(seg(t, 89.8, 90.05));
        P.at(s.man, [hx + .55 + (1 - enter) * 2.2, 0, .05], -PI / 2); P.clip(s.man, 'Idle_Loop', t);
        P.turn(s.man, 'spine_02', [.1, 0, 0]);
        const tg = [hx, hy, .08];
        P.reach(s.man, 'r', tg, [hx + .6, hy - .5, .6]); P.reach(s.man, 'l', [hx, hy - .05, .0], [hx + .6, hy - .5, -.6]);
        s.spk.userData.update(t, [SW_T], PX, .9);
        setGlow(s.flash, fl, 1.6); setGlow(s.bulb, a < 0 ? 0 : 1.2, 1.2);
        s.back.material.color.set('#B07A4C').multiplyScalar(.85 + (a < 0 ? 0 : .35 * Math.exp(-a * 8)));
        s.needle.rotation.z = a < 0 ? .9 : .9 - 1.5 * (1 - Math.exp(-a * 9) * Math.cos(a * 30));   // swings over and settles
        cam(camera, [2000 + lerp(.95, .8, seg(t, 89.8, SW_T)), 1.95, 5.2], [2000.55, 1.95, 0], 25);
        return;
      }
      // ---- the street: twilight and gas before the switch, then the electric wave rolls from near to far
      const wk = ease(wave), pre = TWI13, post = { ...ELNIGHT, hor: '#2B4C93', halo: '#4B72C8', stars: .35 };
      const arr = s.wm.instanceMatrix.array, arg = s.wg.instanceMatrix.array, B0 = s.base;
      for (let i = 0; i < s.win.length; i++) {
        const on = t >= s.win[i][6], gas = s.win[i][7] && !on, o = i * 16;
        for (let j = 0; j < 16; j++) { arr[o + j] = on ? B0[o + j] : 0; arg[o + j] = gas ? B0[o + j] : 0; }
      }
      s.wm.instanceMatrix.needsUpdate = s.wg.instanceMatrix.needsUpdate = true;
      let near = null, nd = 1e9;
      const cpz = COUPLE.z0 + COUPLE.v * (t - LINE(11)[0]);
      s.lamps.forEach(l => {
        const on = t >= l.on, a = t - l.on;
        l.gas.visible = !on && l.isGas; setGlow(l.gas, 1.5 * (.88 + .12 * noise(t * 6 + l.on * 9)), 3.6);
        l.gp.visible = !on && l.isGas; l.gp.material.color.set('#FF8A3D').multiplyScalar(.48 * (.9 + .1 * noise(t * 6 + l.on * 9)));
        l.el.visible = on; setGlow(l.el, 2.6 + (on && a < .25 ? 3 * Math.exp(-a * 12) : 0), 3.2);
        l.pl.visible = on; l.pl.material.color.set('#CFE6FF').multiplyScalar(.26 * (on ? Math.min(1, a * 6) : 0));
        const d = Math.hypot(l.x - COUPLE.x, l.z - cpz); if ((on || l.isGas) && d < nd) { nd = d; near = l; }
      });
      const elec = near && t >= near.on;
      sky({ ...skyMix(pre, post, wk), time: t, ptPos: near ? near.pos.toArray() : [0, -999, 0], ptCol: elec ? '#CFE6FF' : '#FF8A3D', ptK: elec ? 2.2 : 1.4, ptR: 3.4,
        rimDir: [0, .35, -1], rimCol: elec ? '#9DB8F0' : '#E09A70', rimK: lerp(1.6, 2.2, wk) });
      const k = t - LINE(11)[0], sm = clamp(1 - k / .62);
      s.smk.forEach((sp, i) => {                                             // the smoke of the last shot clears the frame
        sp.position.set(-12 + i * 2.2 + k * (3 + hash(i) * 3), 1 + hash(i * 4) * 9, 6 - hash(i * 2) * 2); sp.scale.setScalar(14 + 8 * hash(i * 3)); sp.material.opacity = sm * sm * .55; sp.visible = sm > .01;
      });
      // the lamplighter holds his pole to the first gas lamp; when the electric light comes on above him he looks up and lowers it
      const L0 = s.lamps[0], lon = smooth(seg(t, L0.on, L0.on + .7));
      P.at(s.lighter, [LAMPLIGHTER.x, 0, LAMPLIGHTER.z], -PI / 2 - .35); P.clip(s.lighter, 'Idle_Loop', t + .3);
      const top = V3(...LAMPLIGHTER.lamp).lerp(V3(-1.2, 2.5, 3.9), lon), sh = P.wpos(s.lighter.bones.spine_03), dir = top.clone().sub(sh).normalize();
      const hr = sh.clone().addScaledVector(dir, .55), hl2 = sh.clone().addScaledVector(dir, .25); hl2.y -= .1;
      P.reach(s.lighter, 'r', hr.toArray(), [hr.x + .3, hr.y - .4, hr.z + .4]); P.reach(s.lighter, 'l', hl2.toArray(), [hl2.x + .3, hl2.y - .5, hl2.z - .3]);
      P.turn(s.lighter, 'Head', [-.35 - .25 * lon, 0, 0]);
      setRod(s.lpole, P.hand(s.lighter, 'l').toArray(), top.toArray());
      // the couple walks toward the camera; they look up as the light passes over them
      s.cpl.forEach((p, i) => {
        const z = cpz + (i ? .25 : 0), x = COUPLE.x + (i ? -.55 : 0), up = smooth(seg(t, waveOn(x, z) - .1, waveOn(x, z) + .5));
        P.at(p, [x, 0, z], .12); P.clip(p, 'Walk_Loop', (t - LINE(11)[0]) * WALK(p.L.height ?? 1) + i * .6);
        P.turn(p, 'neck_01', [-.25 * up, 0, 0]); P.turn(p, 'Head', [-.35 * up, (i ? .2 : -.2) * up, 0]);
      });
      // camera: a slow push up the street as the dark is pushed back (a little lift at the start, out of the smoke)
      const kk = ease(seg(lt, 0, dur)), lift = 1 - easeOut(seg(lt, 0, 1.2));
      cam(camera, [0, 1.8 + .5 * lift, 12 - 4.5 * kk], [0, 1.8 + 7 + 3 * kk - 1.5 * lift, -100], lerp(52, 46, kk));
    },
  });

  // ======================================================================== S14 reaching up
  // the biplane rolls along +x on the far side of the field, lifts off and climbs away to the upper right. Its path is
  // integrated from the speed and the climb angle; the wheels turn with the ground speed until it leaves the ground.
  const AIR = { x0: -7, z0: -32, y0: 1.5, vTo: 17, tTo: 2.3 };
  const planePit = tau => kf(tau, [[0, 0], [AIR.tTo - .05, 0], [AIR.tTo + .6, .26], [4.2, .54], [6.7, .72]], x => x);
  function planeAt(lt) {
    lt = Math.max(0, lt); let sd = 0, h = 0;
    const spd = tau => tau < .3 ? 0 : tau < AIR.tTo ? AIR.vTo * (tau - .3) / (AIR.tTo - .3) : AIR.vTo + (tau - AIR.tTo) * 1.2;
    for (let tau = 0; tau < lt; tau += .02) { const d = Math.min(.02, lt - tau), v = spd(tau), g = planePit(tau); sd += v * Math.cos(g) * d; h += v * Math.sin(g) * d; }
    return { x: AIR.x0 + sd, y: AIR.y0 + h, z: AIR.z0, pitch: planePit(lt), sd, roll: h < .05 ? sd : null };
  }
  const S14_CAM = [0, 1.0, 7.0], S14_L0 = [0, 6.5, -30], S14_END = [.535, .41];                  // the S15 hand-off: the biplane at this frame position
  SHOT({ id: 'S14', t0: LINE(12)[0], t1: 101.08, out: { kind: 'cut' },
    build(G) {
      const land = terrain({ size: 2400, seg: 60, amp: 0, freq: .01 }); G.add(land);
      G.add(grass({ area: [-14, 14, -6, 6], n: 2400, h: .32, ground: () => 0, clear: [[0, 7, 2.6]] }));
      G.add(ridge({ z: -420, h: 22, w: 1800, rough: 14, seed: 4, under: 100 }));
      const hang = new THREE.Group(); G.add(hang);                           // a hangar and a wind sock
      sbox(hang, 14, 6, 10, -28, 3, -44); const roof = prism([[0, 0], [14, 0], [7, 3]], 10); roof.position.set(-35, 6, -49); hang.add(roof);
      const pole = rod(.06); setRod(pole, [-15, 0, -36], [-15, 6, -36]); hang.add(pole); const sock = cone(.45, 2, null, 8); sock.rotation.z = -PI / 2; sock.position.set(-14, 5.8, -36); hang.add(sock);
      // the biplane: local +x forward, +y up, wings span along z
      const plane = new THREE.Group(), pl = new THREE.Group(); plane.add(pl); G.add(plane);
      const fus = cyl(.14, .44, 5.2, null, 12); fus.rotation.z = PI / 2; fus.position.set(-.4, 0, 0); pl.add(fus);
      addAt(pl, cyl(.46, .46, .7, null, 12), 2.4, 0, 0).rotation.z = PI / 2;
      sbox(pl, 1.5, .09, 9.6, .6, 1.05, 0); sbox(pl, 1.4, .09, 9.0, .4, -.45, 0);                // upper and lower wings
      for (const z of [-3.6, -1.9, 1.9, 3.6]) for (const x of [.1, 1.0]) { const r = rod(.03); setRod(r, [x, -.45, z], [x, 1.05, z]); pl.add(r); }
      for (const z of [-.5, .5]) { const r = rod(.04); setRod(r, [.3, .4, z * .5], [.8, 1.05, z * 3]); pl.add(r); }
      sbox(pl, .9, 1.0, .07, -2.5, .55, 0); sbox(pl, 1.0, .06, 2.6, -2.4, .12, 0);   // fin and tailplane
      const head = sph(.2); head.position.set(.7, .62, 0); pl.add(head); const capP = sph(.21, null, 10); capP.scale.y = .55; capP.position.set(.68, .72, 0); pl.add(capP);   // the pilot in a leather cap
      const pw = [];
      for (const z of [-.75, .75]) { const l = rod(.04); setRod(l, [.5, -.2, z * .3], [.8, -1.1, z]); pl.add(l); const w = spoked(.34, 8, { rim: .2, spoke: .12, hub: .25 }); w.position.set(.8, -1.1, z); pl.add(w); pw.push(w); }
      const skid = rod(.03); setRod(skid, [-2.6, -.1, 0], [-2.8, -.6, 0]); pl.add(skid);
      const prop = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, .02, 24), silMat({ opacity: .3 })); prop.rotation.z = PI / 2; prop.position.set(2.8, 0, 0); pl.add(prop);
      const hub = sph(.1); hub.position.set(2.85, 0, 0); pl.add(hub);
      pl.scale.setScalar(1.1);
      // the crowd in their Sunday best: caps, bowlers, slouch and wide hats, two top hats; one waves a bowler
      // one group on the left of the field; a second group stands far right, out of the opening frame, so the camera only finds
      // them once the plane has climbed above their hats (1 waves, 3 and 5 point)
      const crowd = [['m1', -4.4, 1.5, ['top']], ['w1', -2.1, .9, ['skirt']], ['child', -2.8, 2.4, ['cap']], ['m2', -2.6, -.3, ['bowler']], ['w2', -3.5, .2, ['skirt', 'slouch']], ['m3', 6.8, .6, ['cap']],
        ['girl', 7.4, 2.1, ['skirt', 'wide']], ['m2', 8.1, .2, ['top']], ['w1', 8.7, 1.2, ['skirt', 'wide']], ['m1', -5.4, 2.2, ['slouch']]].map(([n, x, z, o], i) => ({ p: P.make(n, { outfit: o }), x, z, i }));
      crowd.forEach(c => G.add(c.p.root));
      const hat = new THREE.Mesh(new THREE.LatheGeometry([[0, .15], [.06, .145], [.1, .11], [.108, .04], [.11, .012], [.15, .01], [.162, .03], [.155, 0], [.1, -.002]].map(([r, y]) => new THREE.Vector2(r, y)), 20), silMat({ side: THREE.DoubleSide })); G.add(hat);
      return { land, plane, pl, prop, crowd, hat, pw };
    },
    frame(s, lt, dur, t, { camera }) {
      sky({ ...TWILIGHT, time: t, stars: .25 + .3 * smooth(seg(lt, 3, 6.6)), rimK: 2.4 });
      const pa = planeAt(lt);
      s.plane.position.set(pa.x, pa.y, pa.z); s.plane.rotation.set(0, 0, pa.pitch); s.prop.rotation.x = t * 40;
      s.pw.forEach(w => w.rotation.z = -Math.min(pa.sd, planeAt(AIR.tTo + .1).sd) / (.34 * 1.1));
      const roll = lt > AIR.tTo ? .07 * Math.sin((lt - AIR.tTo) * 1.2) : 0; s.pl.rotation.x = roll;
      // the crowd turns to the plane and tips their heads back
      s.crowd.forEach((c, i) => {
        const dx = pa.x - c.x, dz = pa.z - c.z, az = Math.atan2(dx, dz), dist = Math.hypot(dx, dz), el = Math.atan2(pa.y - 1.6, dist);
        P.at(c.p, [c.x, 0, c.z], az + (hash(i * 4.1) - .5) * .7); P.clip(c.p, i === 9 ? 'Idle_FoldArms_Loop' : 'Idle_Loop', t + i * .43);
        const tilt = clamp(el * 1.1 + .15, 0, 1.1);
        P.turn(c.p, 'neck_01', [-tilt * .45, 0, 0]); P.turn(c.p, 'Head', [-tilt * .5, 0, 0]);
        if (i === 3 || i === 5) {                                           // two of them point at the plane
          const sh = P.wpos(c.p.bones.upperarm_r), d = new THREE.Vector3(dx, pa.y - sh.y, dz).normalize(), tg = sh.clone().addScaledVector(d, .62);
          P.reach(c.p, 'r', tg.toArray(), [sh.x + .3, sh.y - .5, sh.z]);
        }
        if (i === 1) {                                                      // one waves a bowler overhead
          const hd = P.head(c.p), w = Math.sin(t * 6 + 1) * .12, tg = [hd.x + w, hd.y + .5, hd.z];
          P.reach(c.p, 'r', tg, [hd.x + .5, hd.y + .1, hd.z]); const hh = P.hand(c.p, 'r'); s.hat.position.set(hh.x, hh.y + .06, hh.z); s.hat.rotation.z = w * 1.5;
        }
      });
      // camera: low among the crowd; it pans and tilts after the plane, a beat behind, so the move is still going at the end.
      // Over the last seconds the lag is offset so the biplane lands where S15 picks it up.
      // it follows the plane across the field at the opening tilt, then tilts up with the climb
      const lag = planeAt(lt - 1.0), w = smooth(seg(lt, .6, 2.6)), up = 4.5 * (1 - smooth(seg(lt, 2.3, 4.6)));
      const base = [lerp(S14_L0[0], lag.x, w), lerp(S14_L0[1], lag.y + up, w), lerp(S14_L0[2], lag.z, w)];
      const off = endOffset(), k = smooth(seg(lt, dur - 2.6, dur));
      const look = base.map((v, i) => v + off[i] * k), fov = lerp(46, 40, smooth(seg(lt, 2.0, 5.0)));
      cam(camera, S14_CAM, look, fov);
    },
  });
  // the look offset that puts the biplane at S14_END on the last frame (solved once, a few Newton steps on the frame position)
  let END_OFF = null;
  function endOffset() {
    if (END_OFF) return END_OFF;
    const dur = 101.08 - LINE(12)[0], pa = planeAt(dur), lag = planeAt(dur - 1.0), cm = new THREE.PerspectiveCamera(40, ASP, .05, 6000);
    const P0 = V3(pa.x, pa.y, pa.z), base = V3(lag.x, lag.y, lag.z), off = V3(0, 0, 0);
    for (let it = 0; it < 12; it++) {
      cm.position.set(...S14_CAM); cm.lookAt(base.clone().add(off)); cm.updateMatrixWorld(true);
      const nd = P0.clone().project(cm), want = [S14_END[0] * 2 - 1, 1 - S14_END[1] * 2];
      const dist = P0.distanceTo(cm.position), r = V3(1, 0, 0).applyQuaternion(cm.quaternion), u = V3(0, 1, 0).applyQuaternion(cm.quaternion), th = Math.tan(20 * PI / 180);
      off.addScaledVector(r, (nd.x - want[0]) * th * ASP * dist).addScaledVector(u, (nd.y - want[1]) * th * dist);
    }
    return (END_OFF = off.toArray());
  }
})();
