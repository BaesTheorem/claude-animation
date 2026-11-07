// uplift/ch3_industry.js: verse 3, industry (S11-S14). Furnace red dusk, then electric night.
// S11 coal and steam (chimney match cut, stoker, Watt beam engine), S12 the iron horse (flywheel -> driving wheel match cut),
// S13 banishing the night (knife switch, a wave of light), S14 reaching up (a crowd, a biplane takes off).
// Mechanisms are computed from one angle: the beam engine from the crank angle (beam angle solved so the connecting rod
// keeps its length, Watt's straight-line linkage for the piston rod), the locomotive from its position (slider-crank).
(() => {
  const { THREE, kf, seg, smooth, ease, easeIn, easeOut, lerp, clamp, hash, noise, B, LINE, sky, skyMix, litMat, silMat, glow, setGlow,
    sparks, terrain, ridge, grass, box, cyl, cone, sph, rod, setRod, gear, cam, gcam, puffTex, glowTex, beatAt } = UP;
  const P = PEOPLE, PI = Math.PI, TAU = PI * 2, ASP = 16 / 9;

  // ---------------------------------------------------------------- sky presets
  const FURNACE = { zen: '#2E1B17', hor: '#C8431B', horK: .5, halo: '#FF6A2A', haloW: 1.5, haloH: .18, stars: 0, sunDir: [.25, -.07, -1], fogNear: 25, fogDen: .0016 };
  const DUSK2 = { zen: '#2A1815', hor: '#B5361A', horK: .5, halo: '#FF5A22', haloW: 1.6, haloH: .17, stars: 0, sunDir: [.35, -.07, -1], fogNear: 12, fogDen: .0125 };
  const ELNIGHT = { zen: '#050920', hor: '#1B2E66', horK: .5, halo: '#26397F', haloW: 2, haloH: .1, stars: .5, sunDir: [0, -.3, -1], fogNear: 25, fogDen: .0012 };
  const TWILIGHT = { zen: '#101A47', hor: '#D9774F', horK: .42, halo: '#FF9A62', haloW: 2, haloH: .13, stars: .25, sunDir: [.45, -.09, -1], fogNear: 40, fogDen: .0012 };
  const SMOKE_COL = '#1A0F0D';

  // ---------------------------------------------------------------- helpers
  const dir3 = (a, b) => new THREE.Vector3(...b).sub(new THREE.Vector3(...a)).normalize();
  const addAt = (G, m, x, y, z) => { m.position.set(x, y, z); G.add(m); return m; };
  const sbox = (G, w, h, d, x, y, z) => addAt(G, box(w, h, d), x, y, z);
  // flat link between two 2D points at depth z (unit box scaled along x)
  const mkLink = (w = .1, th = .08) => box(1, w, th);
  const setLink = (m, ax, ay, bx, by, z) => { m.position.set((ax + bx) / 2, (ay + by) / 2, z); m.rotation.z = Math.atan2(by - ay, bx - ax); m.scale.x = Math.max(Math.hypot(bx - ax, by - ay), 1e-4); };
  const mkPin = (r = .12, th = .12) => { const p = cyl(r, r, th, null, 10); p.rotation.x = PI / 2; return p; };
  const prism = (pts, depth) => { const s = new THREE.Shape(); pts.forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y)); return new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false }), silMat()); };
  const lampRef = (v, a, b) => clamp((v - a) / (b - a));

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
      s.scale.setScalar((o.size ?? 3) * (.4 + a * 1.7)); s.material.opacity = k * (o.op ?? .85) * Math.min(1, a * 7) * (1 - a * a); s.material.rotation = i * 1.7 + a;
    });
    return g;
  }

  // meshing gears: gear B turned so that its teeth fall into the gaps of gear A (UP.gear: tooth centres at (k + 1/8) pitches)
  const meshAngle = (alpha, n1, psi, n2) => { const pa = (psi - alpha) / (TAU / n1) - .125; return psi + PI - (TAU / n2) * (.5 - pa + .125); };

  // ======================================================================== the beam engine (S11) and its numbers
  const EN = { Ox: .5, Oy: 7.4, Lb: 3.4, L2: 1.2, Cx: 3.9, Cy: 2.6, Rf: 2.2, Lr: 4.8 };
  EN.Rc = .45 * EN.Rf; EN.Fx = EN.Ox - 2 * EN.Lb; EN.Fy = EN.Oy - EN.L2;
  const T_START = 81.58, ACC = 1.5, OMEGA = TAU / 1.36, TH0 = 1.9;            // the flywheel starts on a beat, then one turn per two beats
  const crankAngle = t => { const tau = Math.max(0, t - T_START), s = tau < ACC ? tau * tau / (2 * ACC) : tau - ACC / 2; return TH0 - OMEGA * s; };   // clockwise on screen
  const TH_END = crankAngle(LINE(10)[0]);
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
      const doorQ = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.5), litMat('#FF6A2A', 2.4)); doorQ.rotation.y = PI / 2; doorQ.position.set(-6.48, 1.05, 0); int.add(doorQ);
      const doorG = glow('#FF7A33', 6, 1.4); doorG.position.set(-6.2, 1.1, 0); int.add(doorG);
      const doorG2 = glow('#FF5A22', 15, .55); doorG2.position.set(-6.3, 1.3, 0); int.add(doorG2);
      const pool = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTex, color: new THREE.Color('#FF5A22'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
      pool.rotation.x = -PI / 2; pool.position.set(-5.2, .03, .2); pool.renderOrder = 1; int.add(pool);
      const spk = sparks(30, 4); spk.position.set(-6.3, 1.1, 0); int.add(spk);
      const coalPile = sph(.7); coalPile.scale.set(1.5, .55, 1.1); coalPile.position.set(-5.35, .1, -1.35); int.add(coalPile);
      const stoker = P.make('m3'); int.add(stoker.root);
      const handle = rod(.024), blade = box(.34, .03, .4), load = box(.22, .11, .26); int.add(handle, blade, load);
      // engine: pillar, beam, cylinder, linkage, crank and flywheel
      const pil = prism([[-1.7, 0], [1.7, 0], [.62, 7.0], [-.62, 7.0]], .5); pil.position.set(EN.Ox, 0, -.9); int.add(pil);
      const cap2 = sbox(int, 1.7, .5, .9, EN.Ox, 7.1, -.7);
      const beam = new THREE.Group(); beam.position.set(EN.Ox, EN.Oy, 0); int.add(beam);
      const bs = new THREE.Shape(); bs.moveTo(-EN.Lb - .25, .13); bs.lineTo(0, .6); bs.lineTo(EN.Lb + .25, .13); bs.lineTo(EN.Lb + .25, -.13); bs.lineTo(0, -.5); bs.lineTo(-EN.Lb - .25, -.13); bs.closePath();
      const bm = new THREE.Mesh(new THREE.ExtrudeGeometry(bs, { depth: .26, bevelEnabled: false }), silMat()); bm.position.z = -.13; beam.add(bm);
      const axle = mkPin(.3, .9); axle.position.set(EN.Ox, EN.Oy, -.2); int.add(axle);
      const cylr = cyl(.62, .62, 3.2, null, 18); cylr.position.set(EN.Ox - EN.Lb, 3.3, 0); int.add(cylr);
      sbox(int, 1.7, .22, 1.7, EN.Ox - EN.Lb, 4.95, 0); sbox(int, 1.7, .22, 1.7, EN.Ox - EN.Lb, 1.6, 0); sbox(int, 2.2, 1.5, 2.2, EN.Ox - EN.Lb, .75, 0);
      sbox(int, .4, 3.8, .5, EN.Fx, 4.1, -.3);                               // the fixed post that carries the radius rod
      const pipe = rod(.16); setRod(pipe, [-6.8, 5.7, 0], [EN.Ox - EN.Lb, 5.7, 0]); int.add(pipe);
      const pipe2 = rod(.16); setRod(pipe2, [EN.Ox - EN.Lb, 5.7, 0], [EN.Ox - EN.Lb, 5.1, 0]); int.add(pipe2);
      const L = { rodP: mkLink(.18, .12), cpl: mkLink(.12, .08), radius: mkLink(.14, .08), conn: mkLink(.24, .14) };
      Object.values(L).forEach(m => int.add(m));
      const pins = []; for (let i = 0; i < 6; i++) { const p = mkPin(.14, .3); pins.push(p); int.add(p); }
      const pistonHead = box(1.0, .3, .9); int.add(pistonHead);
      const fly = wheel(EN.Rf, 6); fly.position.set(EN.Cx, EN.Cy, 0); int.add(fly);
      const crankPin = mkPin(.16, .4); int.add(crankPin);
      // a belt from the flywheel rim to a spoked pulley, and a train of gears on the pulley's shaft
      const PU = { x: 8.4, y: 5.4, r: 1.7 }, pitchK = .1;                    // radius per tooth, so every pair meshes
      const pulley = wheel(PU.r, 6, .01); pulley.position.set(PU.x, PU.y, 0); int.add(pulley);
      const dpc = Math.hypot(PU.x - EN.Cx, PU.y - EN.Cy), fi = Math.atan2(PU.y - EN.Cy, PU.x - EN.Cx), dl = Math.acos((EN.Rf - PU.r) / dpc), belts = [];
      for (const sg of [1, -1]) {
        const n = [Math.cos(fi + sg * dl), Math.sin(fi + sg * dl)], bt = mkLink(.1, .1); setLink(bt, EN.Cx + EN.Rf * n[0], EN.Cy + EN.Rf * n[1], PU.x + PU.r * n[0], PU.y + PU.r * n[1], .12); int.add(bt); belts.push(bt);
      }
      const gA = gear(10 * pitchK, 10, .3), gB = gear(16 * pitchK, 16, .3), gC = gear(10 * pitchK, 10, .3);
      gA.position.set(PU.x, PU.y, .2);
      const psiAB = 1.4, dAB = .93 * (1.0 + 1.6), psiBC = PI - .2, dBC = .93 * (1.6 + 1.0);
      gB.position.set(PU.x + dAB * Math.cos(psiAB), PU.y + dAB * Math.sin(psiAB), .2);
      gC.position.set(gB.position.x + dBC * Math.cos(psiBC), gB.position.y + dBC * Math.sin(psiBC), .2);
      int.add(gA, gB, gC);
      return { ext, int, smk, smk2, smk3, doorQ, doorG, doorG2, pool, spk, stoker, handle, blade, load, beam, L, pins, pistonHead, fly, crankPin, pulley, PU, gA, gB, gC, psiAB, psiBC, coalPile };
    },
    frame(s, lt, dur, t, { camera, PX }) {
      const inside = lt >= .74;
      s.ext.visible = !inside; s.int.visible = inside;
      if (!inside) {
        sky({ ...FURNACE, time: t });
        const em = () => [0, 40.2, 0];
        s.smk.userData.update(t, 1, em); s.smk2.userData.update(t + 3, 1, () => [-34, 26.2, -22]); s.smk3.userData.update(t + 5, 1, () => [30, 19.2, -26]);
        const push = ease(seg(lt, .22, .74));
        cam(camera, [0, CH.camY, lerp(CH.dist, CH.dist - 13, push)], [0, CH.camY, 0], lerp(40, 40, push));
        return;
      }
      // ---- the engine house
      const hit = t - swingLast(t), flare = Math.exp(-hit * 5);
      sky({ ...FURNACE, time: t, zen: '#2A1914', hor: '#D14A1C', horK: .6, fogDen: .0003 });
      setGlow(s.doorG, 1.0 + .5 * flare + .08 * noise(t * 9), 6 + 1.2 * flare); setGlow(s.doorG2, .5 + .25 * flare, 15 + 2 * flare);
      s.pool.material.color.set('#FF5A22').multiplyScalar(.55 + .35 * flare); s.pool.scale.setScalar(9 + 1.3 * flare);
      s.spk.userData.update(t, LAND, PX, .9);
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
      const th = crankAngle(t), e = engineAt(th), L = s.L, { Ox, Oy, Cx, Cy } = EN;
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
      s.gB.rotation.z = meshAngle(thp, 10, s.psiAB, 16); s.gC.rotation.z = meshAngle(s.gB.rotation.z, 16, s.psiBC + PI - PI, 10);
      // camera: wide on the stoker, push in, then tilt up to the engine and settle level for the match cut
      const A0 = [-2.0, 1.5, 8.5], A1 = [-3.1, 1.5, 6.0], LA0 = [-5.9, 1.25, 0], LA1 = [-6.0, 1.2, 0];
      const p1 = ease(seg(lt, .74, 2.8)), up = ease(seg(lt, 2.85, 3.75));
      const pos = A0.map((v, i) => lerp(lerp(v, A1[i], p1), [FL_CAM.x, FL_CAM.y, FL_CAM.z][i], up)), look = LA0.map((v, i) => lerp(lerp(v, LA1[i], p1), [FL_CAM.x, FL_CAM.y, 0][i], up));
      cam(camera, pos, look, lerp(lerp(38, 33, p1), FL_CAM.fov, up));
    },
  });
  function swingLast(t) { let k = LAND[0]; for (const l of LAND) if (t >= l) k = l; return k; }

  // ======================================================================== S12 the iron horse
  const TRK = { z: -4, rail: 3.6 }, WR = .95, A1 = -.2, A2 = -2.3, PIN_R = .45 * WR, LM = 2.45, V0 = 7, AC = 1;     // wheel radius, axles, crank, main rod, loco speed 7 + 2 lt
  const xLoco = lt => lt >= 0 ? V0 * lt + AC * lt * lt : V0 * lt;
  const HORSE = { z: 2.6, x0: 8.3, v: 8.5 };
  const xHorse = lt => HORSE.x0 + HORSE.v * lt;
  const CAM12 = (() => {                                                  // the camera at lt = 0 puts the driving wheel where the flywheel was
    const th = Math.tan(20 * PI / 180), d0 = WR / (flNdc.rho * th), wz = TRK.z + .75;
    return { d0, th, x: A1 - flNdc.u * d0 * th * ASP, y: TRK.rail + WR - flNdc.v * d0 * th, z: wz + d0 };
  })();
  SHOT({ id: 'S12', t0: LINE(10)[0], t1: LINE(11)[0], out: { kind: 'dip', d: .6, col: '#150D0C' },
    build(G) {
      const land = terrain({ size: 3000, seg: 30, amp: 0, fog: .8, mat: { col: '#3A150C', fog: .75 } }); G.add(land);
      // embankment: profile in (s = -z, y), extruded along x
      const eb = new THREE.Shape(); [[-1.4, 0], [1.6, TRK.rail - .15], [6.4, TRK.rail - .15], [11, 0]].forEach(([x, y], i) => i ? eb.lineTo(x, y) : eb.moveTo(x, y));
      const ebg = new THREE.ExtrudeGeometry(eb, { depth: 420, bevelEnabled: false }); ebg.rotateY(PI / 2); ebg.translate(-150, 0, 0);
      G.add(new THREE.Mesh(ebg, silMat({ col: '#3A150C', fog: .75 })));
      sbox(G, 420, .22, .16, 60, TRK.rail - .1, TRK.z + .72); sbox(G, 420, .22, .16, 60, TRK.rail - .1, TRK.z - .72);
      // the mill
      const mx0 = -60, mx1 = 200, mz = -33;
      sbox(G, mx1 - mx0, 30, 9, (mx0 + mx1) / 2, 15, mz);
      for (let i = 0; i < 28; i++) { const t = prism([[0, 0], [(mx1 - mx0) / 28, 0], [(mx1 - mx0) / 28, 3]], 9); t.position.set(mx0 + i * (mx1 - mx0) / 28, 30, mz - 4.5); G.add(t); }
      const chim = cyl(1.3, 2.2, 56, null, 12); chim.position.set(95, 28, mz - 6); G.add(chim);
      const gx = 45, gy = 19, panel = new THREE.Mesh(new THREE.PlaneGeometry(13, 11), litMat('#E8893A', 1.0)); panel.position.set(gx + 1.5, gy + .5, mz + 4.55); G.add(panel);
      const wins = []; for (let r of [4, 9.5, 15, 24.5, 28]) for (let c = 0; c < 56; c++) { const x = mx0 + 4 + c * 4.5; if (r > 12 && Math.abs(x - gx - 1.5) < 8.5) continue; wins.push([x, r]); }
      const wm = new THREE.InstancedMesh(new THREE.BoxGeometry(1.2, 2.3, .1), litMat('#FFB45A', 1.2), wins.length), M4 = new THREE.Matrix4();
      wins.forEach(([x, y], i) => { M4.makeTranslation(x, y, mz + 4.55); wm.setMatrixAt(i, M4); }); wm.frustumCulled = false; G.add(wm);
      const gA = gear(3.2, 20, .6), gB = gear(1.92, 12, .6); gA.position.set(gx, gy, mz + 4.7); gB.position.set(gx + 4.76 * Math.cos(.55), gy + 4.76 * Math.sin(.55), mz + 4.7); G.add(gA, gB);
      // the locomotive: local x forward, y up from the rail head, z toward the camera
      const loco = new THREE.Group(); G.add(loco);
      const bl = cyl(.85, .85, 5.2, null, 20); bl.rotation.z = PI / 2; bl.position.set(.7, 2.75, 0); loco.add(bl);
      const sb = cyl(.95, .95, .7, null, 20); sb.rotation.z = PI / 2; sb.position.set(3.55, 2.75, 0); loco.add(sb);
      sbox(loco, 9.2, .38, 1.9, -.4, 1.25, 0);                              // frame and footplate
      const stack = cyl(.62, .3, 1.5, null, 14); stack.position.set(3.6, 4.2, 0); loco.add(stack); addAt(loco, cyl(.7, .7, .12, null, 14), 3.6, 4.98, 0);
      const dome = sph(.45); dome.scale.y = .9; addAt(loco, dome, 1.3, 3.55, 0); const dome2 = sph(.3); addAt(loco, dome2, -.4, 3.5, 0);
      const sandd = cyl(.2, .2, .5, null, 8); addAt(loco, sandd, .4, 3.7, 0);
      sbox(loco, 3.1, 1.7, 2.1, -3.45, 2.15, 0); sbox(loco, 3.6, .22, 2.5, -3.45, 4.7, 0);     // cab: lower walls and roof
      for (const x of [-4.85, -3.45, -2.05]) sbox(loco, .16, 1.9, .2, x, 3.7, .95);
      const cabGlow = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 1.8), litMat('#FF8A3D', 1.5)); cabGlow.position.set(-3.45, 3.7, .1); loco.add(cabGlow);
      const cabG = glow('#FF7A33', 4, .7); cabG.position.set(-3.4, 3.6, 1.2); loco.add(cabG);
      const fbG = glow('#FF6A2A', 4, 1.4); fbG.position.set(-4.6, 1.1, 1.0); loco.add(fbG);
      sbox(loco, 4.9, 2.1, 2.1, -7.5, 2.2, 0); const coal = sph(1.2); coal.scale.set(2, .5, .8); addAt(loco, coal, -7.5, 3.35, 0);   // tender
      sbox(loco, .8, .12, .12, -5.4, 1.4, 0);
      const cc = prism([[3.9, 1.3], [3.9, .35], [5.15, .5]], 1.7); cc.position.z = -.85; loco.add(cc);
      const hl = box(.5, .5, .5); addAt(loco, hl, 3.95, 3.85, 0); const hlG = glow('#FFE2B0', 1.6, 1.6); hlG.position.set(4.25, 3.85, 0); loco.add(hlG);
      sbox(loco, 1.4, 1.1, .9, 3.5, .95, 1.05);                              // cylinder block
      for (const dy of [-.14, .14]) sbox(loco, 1.5, .06, .12, 2.3, .95 + dy, 1.05);   // crosshead guides
      const wheels = [], mk = (x, y, r, ns) => { const w = wheel(r, ns); w.position.set(x, y, .75); loco.add(w); wheels.push({ w, x, r }); };
      mk(A1, WR, WR, 6); mk(A2, WR, WR, 6); mk(1.9, .5, .5, 6); mk(3.0, .5, .5, 6); mk(-6.2, .55, .55, 6); mk(-8.6, .55, .55, 6);
      const links = { coup: mkLink(.2, .07), main: mkLink(.17, .07), pist: mkLink(.07, .07) }; Object.values(links).forEach(m => loco.add(m));
      const cross = box(.45, .34, .2); loco.add(cross);
      const pn = []; for (let i = 0; i < 3; i++) { const p = mkPin(.1, .3); pn.push(p); loco.add(p); }
      // the horse and rider
      const horse = P.beast('horse', .75), rider = P.make('m2', { height: 1.2 }); G.add(horse.root, rider.root);
      const smoke = plume({ n: 40, life: 4.2, size: 6.5, drift: [-2.2, 2.2, 0], spread: 1.5, op: 1, col: '#7E4A36' }); G.add(smoke);
      const stackFlash = glow('#FF8A3D', 1.4, 0); loco.add(stackFlash); stackFlash.position.set(3.6, 5.2, 0);
      return { loco, wheels, links, cross, pn, horse, rider, smoke, hlG, cabG, fbG };
    },
    frame(s, lt, dur, t, { camera }) {
      sky({ ...DUSK2, time: t });
      const xl = xLoco(lt), g = s.loco; g.position.set(xl, TRK.rail, TRK.z);
      const ang0 = TH_END;                                                   // pin angle: continuous with the flywheel at lt = 0, then rolls without slipping
      s.wheels.forEach(({ w, x, r }) => { w.rotation.z = (r === WR ? ang0 : 0) - xl / r; });
      const a = ang0 - xl / WR;
      const pin1 = [A1 + PIN_R * Math.cos(a), WR + PIN_R * Math.sin(a)], pin2 = [A2 + PIN_R * Math.cos(a), WR + PIN_R * Math.sin(a)];
      const xc = A1 + PIN_R * Math.cos(a) + Math.sqrt(LM * LM - Math.pow(PIN_R * Math.sin(a), 2));
      setLink(s.links.coup, pin1[0], pin1[1], pin2[0], pin2[1], 1.05);
      setLink(s.links.main, xc, WR, pin1[0], pin1[1], 1.14);
      setLink(s.links.pist, 3.0, WR, xc, WR, 1.05);
      s.cross.position.set(xc, WR, 1.1);
      [pin1, pin2, [xc, WR]].forEach((p, i) => s.pn[i].position.set(p[0], p[1], 1.2));
      const fl = .85 + .15 * noise(t * 11); setGlow(s.fbG, 1.4 * fl, 4); setGlow(s.cabG, .7 * fl, 4);
      const em = te => { const l = te - LINE(10)[0]; return [xLoco(l) + 3.6, TRK.rail + 5.1, TRK.z]; };
      s.smoke.userData.update(t, 1, em);
      // horse and rider, galloping left to right on the road
      const xh = xHorse(lt), hy = 0;
      P.at(s.horse, [xh, hy, HORSE.z], PI / 2); P.clip(s.horse, 'Gallop', t * 1.0);
      const sad = P.wpos(s.horse.bones.Back || s.horse.bones.Torso2);
      P.at(s.rider, [0, 0, 0], PI / 2); P.clip(s.rider, 'Driving_Loop', t);
      P.turn(s.rider, 'spine_02', [.35, 0, 0]);
      const pel = P.wpos(s.rider.bones.pelvis);
      P.at(s.rider, [sad.x - pel.x + .0, sad.y - pel.y + .12, sad.z - pel.z], PI / 2);
      // camera: starts on the matched wheel, pulls back and down to the low road-side view that follows the horse
      const k = ease(seg(lt, .3, 3.1)), kz = ease(seg(lt, .3, 2.6));
      const cx = lerp(xl + CAM12.x, xh + 3.2, k), cy = lerp(CAM12.y, 1.4, kz), cz = lerp(CAM12.z, 13, kz);
      const ly = lerp(CAM12.y, 4.9, kz);
      cam(camera, [cx, cy, cz], [lerp(cx, cx + 1.5, kz), ly, TRK.z], lerp(40, 52, kz));
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
  SHOT({ id: 'S13', t0: LINE(11)[0], t1: LINE(12)[0], out: { kind: 'cut' },
    build(G) {
      const st = new THREE.Group(); G.add(st);
      st.add(terrain({ size: 3000, seg: 12, amp: 0, fog: .6 }));
      const win = [];                                                        // windows: [x, y, z, sx, sy, sz, onTime]
      const addWin = (x, y, z, sx, sy, sz, jit) => win.push([x, y, z, sx, sy, sz, waveOn(x, z, jit)]);
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
      const wm = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), litMat('#FFC878', .75), win.length), M4 = new THREE.Matrix4(), Q = new THREE.Quaternion();
      win.forEach(([x, y, z, sx, sy, sz], i) => { M4.compose(new THREE.Vector3(x, y, z), Q, new THREE.Vector3(sx, sy, sz)); wm.setMatrixAt(i, M4); });
      wm.frustumCulled = false; st.add(wm);
      const base = Float32Array.from(wm.instanceMatrix.array);
      // lamps: gas first, electric on the wave
      const lamps = [];
      for (const side of [-1, 1]) for (let j = 0; j < 18; j++) {
        const x = side * 4.3, z = 2 - j * 13.5 - (side > 0 ? 6 : 0);
        const pole = rod(.07); setRod(pole, [x, 0, z], [x, 5.4, z]); st.add(pole);
        sbox(st, .7, .12, .12, x - side * .3, 5.45, z); sbox(st, .42, .55, .42, x - side * .6, 5.55, z);
        const gas = glow('#FF8A3D', 2.4, .9), el = glow('#CFE6FF', 3.2, 2.6), pl = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTex, color: new THREE.Color('#CFE6FF'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
        gas.position.set(x - side * .6, 5.55, z); el.position.copy(gas.position); pl.rotation.x = -PI / 2; pl.position.set(x - side * 2, .04, z); pl.scale.setScalar(9); pl.renderOrder = 1;
        st.add(gas, el, pl); lamps.push({ gas, el, pl, on: waveOn(x, z, hash(j + side * 9) * .06), isGas: j % 2 == 0 && j < 12 });
      }
      const horizon = glow('#8FB4FF', 520, 0); horizon.position.set(0, 30, -420); st.add(horizon); horizon.visible = false;
      const smk = []; for (let i = 0; i < 12; i++) { const m = new THREE.SpriteMaterial({ map: puffTex, color: new THREE.Color(SMOKE_COL), transparent: true, depthWrite: false, opacity: 1, fog: false }); const sp = new THREE.Sprite(m); smk.push(sp); st.add(sp); }
      // ---- the switch panel, far from the street
      const sw = new THREE.Group(); sw.position.set(2000, 0, 0); G.add(sw);
      const back = new THREE.Mesh(new THREE.PlaneGeometry(12, 8), litMat('#B07A4C', .85)); back.position.set(.5, 2, -1.6); sw.add(back);
      sbox(sw, .36, 3.6, 1.1, -.25, 1.9, -.2);                               // panel slab, edge-on
      const H = { x: .1, y: 3.0 }, Lbl = 1.65, Ljaw = 1.2, Lh = 1.5;
      sbox(sw, .32, .4, .5, H.x - .02, H.y + .05, -.1);                      // hinge block
      sbox(sw, .3, .55, .5, H.x, H.y - Ljaw - .05, -.1); sbox(sw, .1, .3, .5, H.x + .17, H.y - Ljaw + .02, -.1);       // jaws
      const bladeG = new THREE.Group(); bladeG.position.set(H.x + .12, H.y, .05); sw.add(bladeG);
      const bl = box(.09, Lbl, .05); bl.position.y = -Lbl / 2; bladeG.add(bl);
      const gr = box(.16, .55, .16); gr.position.y = -Lh - .05; bladeG.add(gr);
      const cross = box(.1, .1, .5); cross.position.y = -Lh - .05; bladeG.add(cross);
      const man = P.make('m3'); sw.add(man.root);
      const spk = sparks(36, 7); spk.position.set(H.x + .15, H.y - Ljaw, .1); sw.add(spk);
      const flash = glow('#CFE6FF', 2.4, 0); flash.position.set(H.x + .2, H.y - Ljaw, .2); sw.add(flash);
      const bulb = glow('#CFE6FF', 1.2, 0); bulb.position.set(.1, 4.3, 0); sw.add(bulb);
      return { st, wm, base, win, lamps, horizon, smk, sw, bladeG, H, Lh, Ljaw, man, spk, flash, bulb, back };
    },
    frame(s, lt, dur, t, { camera, PX }) {
      const wave = clamp((t - 90.5) / 3.3);
      const showSw = t >= 89.8 && t < CUT_BACK;
      s.st.visible = !showSw; s.sw.visible = showSw;
      if (showSw) {
        sky({ ...ELNIGHT, time: t });
        const open = 40 * PI / 180, th = t < 90.16 ? open - .015 * Math.sin(t * 40) * smooth(seg(t, 89.95, 90.1)) : open * (1 - easeIn(seg(t, 90.16, SW_T)));
        s.bladeG.rotation.z = th;                                            // swings down about the hinge: tip goes from out to the right to straight down
        const hx = s.H.x + .12 + Math.sin(th) * s.Lh, hy = s.H.y - Math.cos(th) * s.Lh;
        const enter = ease(seg(t, 89.8, 90.05));
        P.at(s.man, [hx + .55 + (1 - enter) * 2.2, 0, .05], -PI / 2); P.clip(s.man, 'Idle_Loop', t);
        P.turn(s.man, 'spine_02', [.1, 0, 0]);
        const tg = [hx, hy, .08];
        P.reach(s.man, 'r', tg, [hx + .6, hy - .5, .6]); P.reach(s.man, 'l', [hx, hy - .05, .0], [hx + .6, hy - .5, -.6]);
        s.spk.userData.update(t, [SW_T], PX, .9);
        const a = t - SW_T, fl = a < 0 ? 0 : Math.exp(-a * 14) * 4;
        setGlow(s.flash, fl, 1.6); setGlow(s.bulb, a < 0 ? 0 : 1.2, 1.2);
        s.back.material.color.set('#B07A4C').multiplyScalar(.85 + (a < 0 ? 0 : .35 * Math.exp(-a * 8)));
        cam(camera, [2000 + lerp(.95, .8, seg(t, 89.8, SW_T)), 1.95, 5.2], [2000.55, 1.95, 0], 25);
        return;
      }
      // ---- the street
      sky({ ...skyMix(ELNIGHT, { ...ELNIGHT, hor: '#2B4C93', halo: '#4B72C8', stars: .35 }, ease(wave)), time: t });
      const arr = s.wm.instanceMatrix.array, B0 = s.base;
      for (let i = 0; i < s.win.length; i++) {
        const on = t >= s.win[i][6], o = i * 16;
        if (on) for (let j = 0; j < 16; j++) arr[o + j] = B0[o + j]; else for (let j = 0; j < 16; j++) arr[o + j] = 0;
      }
      s.wm.instanceMatrix.needsUpdate = true;
      s.lamps.forEach(l => {
        const on = t >= l.on, a = t - l.on;
        l.gas.visible = !on && l.isGas; setGlow(l.gas, .9 + .15 * noise(t * 6 + l.on * 9), 2.4);
        l.el.visible = on; setGlow(l.el, 2.6 + (on && a < .25 ? 3 * Math.exp(-a * 12) : 0), 3.2);
        l.pl.visible = on; l.pl.material.color.set('#CFE6FF').multiplyScalar(.26 * (on ? Math.min(1, a * 6) : 0));
      });
      
      const k = t - LINE(11)[0], sm = clamp(1 - k / .8);
      s.smk.forEach((sp, i) => {                                             // the smoke of the last shot clears the frame
        sp.position.set(-12 + i * 2.2 + k * (3 + hash(i) * 3), 1 + hash(i * 4) * 9, 6 - hash(i * 2) * 2); sp.scale.setScalar(14 + 8 * hash(i * 3)); sp.material.opacity = sm * sm * .7; sp.visible = sm > .01;
      });
      const kk = ease(seg(lt, 0, dur));
      cam(camera, [0, 1.8, 12 - 4.5 * kk], [0, 1.8 + 7 + 3 * kk, -100], lerp(52, 46, kk));
    },
  });

  // ======================================================================== S14 reaching up
  const AIR = { x0: -12, z0: -11, a: .245, y0: 1.5, vTo: 17, tTo: 2.3 };
  function planeAt(lt) {                                                    // integrate the take-off roll and climb
    lt = Math.max(0, lt); let sd = 0, h = 0, pitch = 0;
    const spd = tau => tau < .3 ? 0 : tau < AIR.tTo ? AIR.vTo * (tau - .3) / (AIR.tTo - .3) : AIR.vTo + (tau - AIR.tTo) * .9;
    const pit = tau => kf(tau, [[0, 0], [AIR.tTo - .05, 0], [AIR.tTo + .7, .2], [4.6, .45], [6.7, .7]], x => x);
    for (let tau = 0; tau < lt; tau += .02) { const d = Math.min(.02, lt - tau), v = spd(tau), g = pit(tau); sd += v * Math.cos(g) * d; h += v * Math.sin(g) * d; }
    pitch = pit(lt);
    return { x: AIR.x0 + sd * Math.cos(AIR.a), y: AIR.y0 + h, z: AIR.z0 - sd * Math.sin(AIR.a), pitch, sd };
  }
  SHOT({ id: 'S14', t0: LINE(12)[0], t1: 101.08, out: { kind: 'cut' },
    build(G) {
      const land = terrain({ size: 2400, seg: 60, amp: 0, freq: .01 }); G.add(land);
      G.add(grass({ area: [-24, 12, -6, 6], n: 2400, h: .35, ground: () => 0, clear: [[-7, 9, 3]] }));
      G.add(ridge({ z: -420, h: 22, w: 1800, rough: 14, seed: 4, under: 100 }));
      const hang = new THREE.Group(); G.add(hang);                           // a hangar and a wind sock
      sbox(hang, 14, 6, 10, -27, 3, -16); const roof = prism([[0, 0], [14, 0], [7, 3]], 10); roof.position.set(-34, 6, -21); hang.add(roof);
      const pole = rod(.06); setRod(pole, [-18, 0, -8], [-18, 6, -8]); hang.add(pole); const sock = cone(.45, 2, null, 8); sock.rotation.z = -PI / 2; sock.position.set(-17, 5.8, -8); hang.add(sock);
      // the biplane: local +x forward, +y up, wings span along z
      const plane = new THREE.Group(), pl = new THREE.Group(); plane.add(pl); G.add(plane);
      const fus = cyl(.14, .44, 5.2, null, 12); fus.rotation.z = PI / 2; fus.position.set(-.4, 0, 0); pl.add(fus);
      addAt(pl, cyl(.46, .46, .7, null, 12), 2.4, 0, 0).rotation.z = PI / 2;
      sbox(pl, 1.5, .09, 9.6, .6, 1.05, 0); sbox(pl, 1.4, .09, 9.0, .4, -.45, 0);                // upper and lower wings
      for (const z of [-3.6, -1.9, 1.9, 3.6]) for (const x of [.1, 1.0]) { const r = rod(.03); setRod(r, [x, -.45, z], [x, 1.05, z]); pl.add(r); }
      for (const z of [-.5, .5]) { const r = rod(.04); setRod(r, [.3, .4, z * .5], [.8, 1.05, z * 3]); pl.add(r); }
      sbox(pl, .9, 1.0, .07, -2.5, .55, 0); sbox(pl, 1.0, .06, 2.6, -2.4, .12, 0);   // fin and tailplane
      const head = sph(.2); head.position.set(.7, .62, 0); pl.add(head);
      for (const z of [-.75, .75]) { const l = rod(.04); setRod(l, [.5, -.2, z * .3], [.8, -1.1, z]); pl.add(l); const w = cyl(.34, .34, .13, null, 14); w.rotation.x = PI / 2; w.position.set(.8, -1.1, z); pl.add(w); }
      const skid = rod(.03); setRod(skid, [-2.6, -.1, 0], [-2.8, -.6, 0]); pl.add(skid);
      const prop = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, .02, 24), silMat({ opacity: .3 })); prop.rotation.z = PI / 2; prop.position.set(2.8, 0, 0); pl.add(prop);
      const hub = sph(.1); hub.position.set(2.85, 0, 0); pl.add(hub);
      pl.scale.setScalar(1.1);
      const crowd = [['m1', -3.4, 1.0], ['w1', -2.2, -.4], ['child', -1.5, 1.5], ['m2', -.7, 0.2], ['w2', .4, 1.2], ['m3', 1.3, -.7], ['girl', 1.9, 1.4], ['m2', -1.1, -1.8], ['w1', .8, -2.0]].map(([n, x, z], i) => ({ p: P.make(n), x, z, i }));
      crowd.forEach(c => G.add(c.p.root));
      const hat = new THREE.Group(); hat.add(cyl(.2, .2, .17, null, 12)); const br = cyl(.33, .33, .03, null, 14); br.position.y = -.08; hat.add(br); G.add(hat);
      return { land, plane, pl, prop, crowd, hat };
    },
    frame(s, lt, dur, t, { camera }) {
      sky({ ...TWILIGHT, time: t, stars: .25 + .3 * smooth(seg(lt, 3, 6.6)) });
      const pa = planeAt(lt);
      s.plane.position.set(pa.x, pa.y, pa.z); s.plane.rotation.set(0, AIR.a, pa.pitch, 'YZX'); s.prop.rotation.x = t * 40;
      const roll = lt > AIR.tTo ? .06 * Math.sin((lt - AIR.tTo) * 1.2) : 0; s.pl.rotation.x = roll;
      // the crowd turns to the plane and tips their heads back
      s.crowd.forEach((c, i) => {
        const dx = pa.x - c.x, dz = pa.z - c.z, az = Math.atan2(dx, dz), dist = Math.hypot(dx, dz), el = Math.atan2(pa.y - 1.6, dist);
        P.at(c.p, [c.x, 0, c.z], az + (hash(i * 4.1) - .5) * .7); P.clip(c.p, 'Idle_Loop', t + i * .43);
        const tilt = clamp(el * 1.1 + .15, 0, 1.1);
        P.turn(c.p, 'neck_01', [-tilt * .45, 0, 0]); P.turn(c.p, 'Head', [-tilt * .5, 0, 0]);
        if (i === 3 || i === 5) {                                           // two of them point at the plane
          const sh = P.wpos(c.p.bones.upperarm_r), d = new THREE.Vector3(dx, pa.y - sh.y, dz).normalize(), tg = sh.clone().addScaledVector(d, .62);
          P.reach(c.p, 'r', tg.toArray(), [sh.x + .3, sh.y - .5, sh.z]);
        }
        if (i === 1) {                                                      // one waves a hat overhead
          const hd = P.head(c.p), w = Math.sin(t * 6 + 1) * .12, tg = [hd.x + w, hd.y + .5, hd.z];
          P.reach(c.p, 'r', tg, [hd.x + .5, hd.y + .1, hd.z]); const hh = P.hand(c.p, 'r'); s.hat.position.set(hh.x, hh.y + .12, hh.z); s.hat.rotation.z = w;
        }
      });
      // camera: low among the crowd, pans and tilts after the plane (it trails by a beat, so the move is still going at the end)
      const lag = planeAt(lt - 1.0), w = smooth(seg(lt, .4, 2.6));
      const look = [lerp(-5.5, lag.x, w), lerp(2.0, lag.y, w), lerp(-24, lag.z, w)];
      cam(camera, [-3.4, 1.2, 5.8], look, lerp(46, 40, w));
    },
  });
})();
