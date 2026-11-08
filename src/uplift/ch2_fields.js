// uplift/ch2_fields.js: verse 2, farming and cities (S07-S10). Gold: a warm blue zenith, a gold horizon, a low gold
// sun, ink silhouettes. The plough and the rain, the harvest and the mill, the time-lapse of cities, the work song.
(() => {
  const { THREE, kf, seg, smooth, ease, easeOut, lerp, clamp, hash, fbm2, B, LINE, sky, skyMix, terrain, water, streak,
    box, cyl, cone, sph, rod, setRod, cam, gcam, silMat, litMat, glow, puffTex, beatAt, hexMix } = UP;
  const P = PEOPLE, PI = Math.PI, TAU = PI * 2, D = PI / 180;
  const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const tv = (a) => new THREE.Vector3(...a);

  // ---------------------------------------------------------------- shared look
  const GOLD = { zen: '#12A0DA', hor: '#FFC46B', horK: .38, halo: '#FF9A3C', haloW: 2, haloH: .16, stars: 0, sunCol: '#FFD79A', sunGlow: 1.3,
    sunSize: .018, fogNear: 25, fogDen: .0035, cloud: 0, cloudCol: '#5A6C94', cloudLit: '#FFD08A', cloudScale: .4, wind: .6 };
  const sunV = (az, el) => [Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)];
  const EARTH = '#2C2013';

  // The ground: a heightfield (with an optional river channel along x at z = -10) and a flat plane to the horizon.
  const chan = z => -1.2 * (1 - smooth(clamp((Math.abs(z + 10) - 3.2) / 2.0)));
  function mkLand(G, o) {
    const edge = (x, z) => 1 - smooth(clamp((Math.max(Math.abs(x), Math.abs(z)) - o.size * .33) / (o.size * .13)));
    const L = terrain({ size: o.size, seg: o.seg, amp: 0, mat: { col: o.col || EARTH, fog: .5 },
      h: (x, z) => fbm2(x * .02, z * .02) * (o.amp ?? .25) * edge(x, z) + (o.river ? chan(z) : 0) });
    const far = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000).rotateX(-PI / 2), L.material); far.position.y = -.03;
    G.add(L, far); return L;
  }

  // arm IK with the elbow pushed outward
  function arm(p, s, target, out = .45, drop = .1) {
    const yaw = p.root.rotation.y, left = V(Math.cos(yaw), 0, -Math.sin(yaw));
    const sh = P.wpos(p.bones['upperarm_' + s]), pole = sh.clone().addScaledVector(left, (s === 'l' ? 1 : -1) * out).add(V(0, -drop, 0));
    P.reach(p, s, Array.isArray(target) ? target : target.toArray(), pole.toArray());
  }
  const bone = (p, n) => P.wpos(p.bones[n]);
  const WALKCYC = () => P.clipLen('Walk_Loop');

  // a puffy cloud of dark sprites (the rain cloud) centred at (x, z), base at y0, width w
  function rainCloud(x, z, y0, w) {
    const g = new THREE.Group();
    for (let i = 0; i < 30; i++) {
      const m = new THREE.SpriteMaterial({ map: puffTex, color: new THREE.Color(i % 6 === 0 ? '#4B5068' : '#2A2E40'), transparent: true, depthWrite: false, opacity: .96, fog: false });
      const s = new THREE.Sprite(m), u = hash(i * 3.1) * 2 - 1, vv = hash(i * 5.7);
      s.position.set(u * w * .5, y0 + 2 + (vv * 9 + (1 - Math.abs(u)) * 5) * (w / 40), hash(i * 7.3) * 8);
      const sc = (12 + hash(i * 9.1) * 12) * (w / 40); s.scale.set(sc * 1.6, sc, 1); g.add(s);
    }
    g.position.set(x, 0, z); return g;
  }
  // the rain veil: falling streaks in a curtain that hangs from the cloud base
  function rainVeil(w, h) {
    const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { uTime: { value: 0 }, uK: { value: 0 }, uReveal: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: `uniform float uTime, uK, uReveal; varying vec2 vUv;
        float hh(float n){ return fract(sin(n * 12.9898) * 43758.5453); }
        void main(){
          float col = floor(vUv.x * 110.), h = hh(col), fx = fract(vUv.x * 110.), thin = smoothstep(.15, .4, fx) * smoothstep(.85, .6, fx);
          float y = vUv.y + vUv.x * .35;
          float s = fract(y * (2.2 + h * 2.) + uTime * (2.4 + h * 1.4) + h * 9.);
          float dash = smoothstep(0., .08, s) * smoothstep(.62, .2, s) * thin;
          float on = step(.3, h);
          float edge = smoothstep(0., .12, vUv.x) * smoothstep(1., .88, vUv.x);
          float top = smoothstep(0., .12, 1. - vUv.y);
          float reveal = step(1. - uReveal, vUv.y);
          float veil = .26 * edge * (.6 + .4 * hh(floor(vUv.y * 40.) + col * .13));
          float a = (dash * on * .95 + veil) * edge * top * reveal * uK * smoothstep(0., .08, vUv.y);
          gl_FragColor = vec4(.25, .25, .30, a); }` });
    return new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
  }

  // ======================================================== S07 L5: the plough and the rain
  // Staging: the camera stands ahead of the team and to the right, so both oxen read in three-quarter view; the sun is
  // behind the team (az -70 deg), and the figure on the rise and the rain cloud stand beyond them to the right.
  const S7 = { v: .85, x0: .5, F: [-6.5, -8.5], CL: [-19, -35] };
  SHOT({ id: 'S07', t0: LINE(5)[0], t1: LINE(6)[0], out: { kind: 'cross', d: .5 },
    build(G) {
      const land = mkLand(G, { size: 300, seg: 150, amp: .22, col: EARTH });
      const oxen = [P.beast('bull', .32), P.beast('bull', .32)]; oxen.forEach(o => G.add(o.root));
      const yoke = rod(.06), pole = rod(.04), stock = rod(.05), grip = rod(.04), brace = rod(.03);
      const share = cone(.09, .42, silMat(), 8);
      G.add(yoke, pole, stock, grip, brace, share);
      const plowman = P.make('m1', { outfit: ['tunic'] }), sower = P.make('w2', { outfit: ['tunic', 'cloth'] }), prayer = P.make('m3', { outfit: ['robe', 'cloth'] });
      G.add(plowman.root, sower.root, prayer.root);
      const furrow = box(1, .05, .3); G.add(furrow);
      const old = [-2.1, -1.2, 1.4, 2.3, 3.2].map(z => { const b = box(120, .04, .22); b.position.set(-10, land.userData.height(-10, z) + .02, z); G.add(b); return b; });
      const seeds = new THREE.InstancedMesh(new THREE.SphereGeometry(.028, 5, 4), litMat('#FFE7B0', 1.4), 40); seeds.frustumCulled = false; G.add(seeds);
      const mound = sph(1.6); mound.scale.set(2.2, .6, 1.5); mound.position.set(S7.F[0], land.userData.height(...S7.F) - .35, S7.F[1]); G.add(mound);
      const cloud = rainCloud(S7.CL[0], S7.CL[1], 3.2, 26); G.add(cloud);
      const veil = rainVeil(17, 8); veil.position.set(S7.CL[0] - 1, 4.0, S7.CL[1] + 3); G.add(veil);
      return { land, oxen, yoke, pole, stock, grip, brace, share, plowman, sower, prayer, furrow, seeds, veil };
    },
    frame(s, lt, dur, t, { camera }) {
      sky({ ...GOLD, time: t, sunDir: sunV(-70 * D, .09), sunGlow: .35, sunSize: .008, halo: '#6A3A10', haloW: 4, fogNear: 30, fogDen: .0028, cloud: .0 });
      const h = s.land.userData.height, X = S7.x0 + S7.v * lt;
      // the team: two oxen side by side (z = +-.6) facing +x
      s.oxen.forEach((o, i) => { const z = i ? .95 : -.95, ox = X + (i ? .45 : -.1); P.at(o, [ox, h(ox, z), z], PI / 2); P.clip(o, 'Walk', t * 1.0 + i * .31); });
      const nA = bone(s.oxen[0], 'Neck2'), nB = bone(s.oxen[1], 'Neck2'), nd = nB.clone().sub(nA).normalize();
      const ya = nA.clone().addScaledVector(nd, -.4).add(V(0, .1, 0)), yb = nB.clone().addScaledVector(nd, .4).add(V(0, .1, 0));
      setRod(s.yoke, ya.toArray(), yb.toArray());
      const M = nA.clone().add(nB).multiplyScalar(.5).add(V(0, .08, 0)), g0 = h(X - 3, 0);
      // the ard: a crooked stock from the share tip (on the ground) up and back to the handle; the draught pole runs
      // from the yoke to the stock
      const Sx = X - 3.15, S = V(Sx, h(Sx, 0) - .05, 0), H = V(Sx - 1.0, h(Sx - 1, 0) + 1.08, 0);
      const Bp = S.clone().lerp(H, .32);
      setRod(s.stock, S.toArray(), H.toArray()); setRod(s.pole, M.toArray(), Bp.toArray());
      setRod(s.grip, [H.x, H.y, H.z - .26], [H.x, H.y, H.z + .26]);
      setRod(s.brace, Bp.toArray(), S.clone().add(V(-.7, .02, 0)).toArray());
      const sd = V(1, -.5, 0).normalize(); s.share.quaternion.setFromUnitVectors(V(0, 1, 0), sd); s.share.position.copy(S).addScaledVector(sd, -.17);
      // the ploughman walks behind with both hands on the handle
      const pm = s.plowman, px = H.x - .62;
      P.at(pm, [px, h(px, 0), 0], PI / 2); P.clip(pm, 'Walk_Loop', t * S7.v / .916);   // clip stride .916 m/s per metre of height (measured)
      arm(pm, 'l', [H.x, H.y, H.z - .2]); arm(pm, 'r', [H.x, H.y, H.z + .2]);
      // the furrow behind the share
      const fx0 = -30, fl = Sx - fx0; s.furrow.scale.set(fl, 1, 1); s.furrow.position.set(fx0 + fl / 2, h(Sx - 4, 0) + .02, 0);
      // the sower, further back, casts seed
      const sw = s.sower, sx = px - 2.7, sz = .85;
      P.at(sw, [sx, h(sx, sz), sz], PI / 2);
      P.blend(sw, 'Walk_Loop', t * S7.v / (.916 * .97), 'Farm_PlantSeed', t, .999, { b: { only: ['spine', 'neck', 'Head', 'clavicle', 'upperarm', 'lowerarm', 'hand'] } });
      const T = 1.15, N = 40, Mx = new THREE.Matrix4();
      for (let i = 0; i < N; i++) {
        const ph = t / T + i / N, c = Math.floor(ph), tl = (c - i / N) * T, tau = Math.min(t - tl, .58);
        const sxl = (S7.x0 + S7.v * (tl - LINE(5)[0])) - 3.15 - 1.0 - .62 - 2.7;
        const vx = S7.v + 1.5 + hash(i * 13 + c) * .8, vz = -.4 + (hash(i * 17 + c * 3) - .5) * 1.5;
        const y = Math.max(h(sxl, sz) + .03, h(sxl, sz) + 1.15 + 2.3 * tau - 4.9 * tau * tau);
        Mx.makeTranslation(sxl + .45 + vx * tau, y, sz + vz * tau); s.seeds.setMatrixAt(i, Mx);
      }
      s.seeds.instanceMatrix.needsUpdate = true;
      // the figure on the rise raises both arms to the cloud
      const pr = s.prayer, fy = h(...S7.F) + .55, yaw = Math.atan2(S7.CL[0] - S7.F[0], S7.CL[1] - S7.F[1]);
      P.at(pr, [S7.F[0], fy, S7.F[1]], yaw); P.clip(pr, 'Idle_Loop', t);
      const up = smooth(seg(lt, .3, 1.7)), hd = P.head(pr), lf = V(Math.cos(yaw), 0, -Math.sin(yaw)), fw = V(Math.sin(yaw), 0, Math.cos(yaw));
      for (const sd2 of ['l', 'r']) {
        const k = sd2 === 'l' ? 1 : -1, cur = P.hand(pr, sd2);
        const tg = hd.clone().addScaledVector(lf, k * .3).addScaledVector(fw, .12).add(V(0, .72 + .03 * Math.sin(t * 2.1 + k), 0));
        arm(pr, sd2, cur.lerp(tg, up), .5, .0);
      }
      // the rain answers the raised arms at about 54.5 s
      const u = s.veil.material.uniforms; u.uTime.value = t; u.uK.value = smooth(seg(t, 54.45, 55.3)); u.uReveal.value = easeOut(seg(t, 54.45, 55.9));
      // camera low, a little ahead of the team, looking back along it
      gcam(camera, s.land, [X + 7.0 + .3 * lt, .85, 4.9 - .1 * lt], [X - 1.0 - .2 * lt, h(X, 0) + 1.55, -.3], 44);
    },
  });

  // ---------------------------------------------------------------- the river and the mill (S08 and S09 share them)
  const WHUB = V(23, 1.65, -12), WR = 2.1, FLOW = 1.7, OMEGA = .55;
  function mkWheel() {
    const g = new THREE.Group();
    for (const z of [-.55, .55]) {
      const r = new THREE.Mesh(new THREE.TorusGeometry(WR, .07, 6, 36), silMat()); r.position.z = z; g.add(r);
      for (let k = 0; k < 4; k++) { const sp = box(WR * 2, .09, .09); sp.position.z = z; sp.rotation.z = k * PI / 4; g.add(sp); }
    }
    for (let k = 0; k < 14; k++) { const a = k / 14 * TAU, pd = box(.55, .1, 1.3); pd.position.set(Math.cos(a) * (WR - .12), Math.sin(a) * (WR - .12), 0); pd.rotation.z = a; g.add(pd); }
    const hub = cyl(.22, .22, 1.8, null, 10); hub.rotation.x = PI / 2; g.add(hub);
    g.position.copy(WHUB); return g;
  }
  function mkRiver(G, land) {
    const wat = water({ w: 3000, d: 14, x: 0, y: -.25, z: -10, dark: .5 }); G.add(wat);
    const wheel = mkWheel(); G.add(wheel);
    // the mill house on the far bank, a driveshaft from the wheel hub, one lit window
    const mill = new THREE.Group();
    const body = box(6.5, 4, 5); body.position.y = 2; const roof = cone(5.2, 2.8, null, 4); roof.rotation.y = PI / 4; roof.position.y = 5.4;
    const chim = box(.8, 2.4, .8); chim.position.set(1.8, 5, 0);
    const win = box(.9, 1.0, .1, litMat('#FFC46B', 2.2)); win.position.set(-1.2, 2.6, 2.53);
    mill.add(body, roof, chim, win); mill.position.set(34.5, -1.0, -15.5); G.add(mill);
    const shaft = rod(.14); setRod(shaft, WHUB.toArray(), [32.0, 2.4, -14.0]); G.add(shaft);
    // glints drifting on the water at the flow speed, so the current reads
    const glints = []; for (let i = 0; i < 34; i++) { const m = box(.55, .02, .07, litMat('#FFE9B8', 1.1)); G.add(m); glints.push(m); }
    return { wheel, glints };
  }
  function animRiver(r, t) {
    r.wheel.rotation.z = OMEGA * t;      // counter-clockwise from the camera: the wheel bottom moves +x, with the current
    r.glints.forEach((m, i) => { m.position.set(((hash(i * 1.7) * 90 + FLOW * t) % 90) - 25, -.2, -10 + (hash(i * 4.1) - .5) * 6.2); });
  }

  // grain: instanced stalks with ears that sway
  function grain(o) {
    const [x0, x1, z0, z1] = o.area, n = o.n, g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-.02, 0, 0, .02, 0, 0, 0, 1, 0,
      0, .8, 0, -.05, .9, 0, 0, 1.08, 0,   0, .8, 0, 0, 1.08, 0, .05, .9, 0], 3));
    const im = new THREE.InstancedMesh(g, silMat({ col: '#7A5C26', sway: o.sway ?? .5, side: THREE.DoubleSide }), n);
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler();
    for (let i = 0; i < n; i++) {
      const x = lerp(x0, x1, hash(i * 1.31 + 7)), z = lerp(z0, z1, hash(i * 2.17 + 3));
      const hh = o.h * (.82 + hash(i * 3.7) * .3) * o.hmap(x, z);
      E.set((hash(i * 5.1) - .5) * .14, hash(i * 4.3) * TAU, (hash(i * 6.7) - .5) * .14); Q.setFromEuler(E);
      M.compose(V(x, o.ground(x, z), z), Q, V(.8 + hash(i) * .6, Math.max(hh, 1e-4), 1)); im.setMatrixAt(i, M);
    }
    im.frustumCulled = false; return im;
  }

  // The pan and the start of the crane that S09 continues. base = the S08 camera; the crane lifts it from 61.2 s on.
  const CR0 = 61.2, CR1 = 68.25;
  const END = { pos: [18, 15, 62], look: [30, 13, -100], fov: 50 };   // low enough that the skyline rises against the sky
  function s8base(lt) {
    const p = .1 * seg(lt, 0, 2.6) + .9 * ease(seg(lt, 2.3, 5.1));
    return { pos: [lerp(1.0, 14, p), .85, lerp(3.2, 6, p)], look: [lerp(-.2, 26, p), lerp(1.35, 2.4, p), lerp(-1.0, -12, p)], fov: 42 };
  }
  function craneCam(camera, land, t, b) {
    const c = ease(seg(t, CR0, CR1)), gy = land.userData.height(b.pos[0], b.pos[2]);
    const pos = [lerp(b.pos[0], END.pos[0], c), lerp(gy + b.pos[1], END.pos[1], c), lerp(b.pos[2], END.pos[2], c)];
    const look = b.look.map((v, i) => lerp(v, END.look[i], c));
    cam(camera, pos, look, lerp(b.fov, END.fov, c));
  }

  // A real sheaf, origin at the binding: stalks are two straight segments (cut end to the tie, tie to the ear) that
  // pass through a tight bundle at y = 0 and fan out above; each ends in an ear (a thin cone); a cord ring ties it.
  function mkSheaf() {
    const g = new THREE.Group(), N = 46, segs = [], ears = [];
    for (let i = 0; i < N; i++) {
      const a = hash(i * 2.3) * TAU, r0 = .04 + hash(i * 3.7) * .06, rt = .02 + hash(i * 5.1) * .03, a2 = a + (hash(i * 7.7) - .5) * .5, rtop = .09 + hash(i * 9.1) * .17;
      const bot = V(Math.cos(a) * r0, -.4 - hash(i) * .05, Math.sin(a) * r0), tie = V(Math.cos(a) * rt, 0, Math.sin(a) * rt);
      const top = V(Math.cos(a2) * rtop, .62 + hash(i * 4.4) * .12, Math.sin(a2) * rtop);
      segs.push([bot, tie], [tie, top]); ears.push(top);
    }
    const sm = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, 4), silMat(), segs.length), M = new THREE.Matrix4(), Q = new THREE.Quaternion();
    segs.forEach(([p0, p1], i) => { const d = p1.clone().sub(p0), L = d.length(); Q.setFromUnitVectors(V(0, 1, 0), d.normalize());
      M.compose(p0.clone().add(p1).multiplyScalar(.5), Q, V(.0085, L, .0085)); sm.setMatrixAt(i, M); });
    const em = new THREE.InstancedMesh(new THREE.ConeGeometry(.012, .15, 5), silMat(), ears.length);
    ears.forEach((p1, i) => { const out = V(p1.x, .0, p1.z).normalize(); Q.setFromUnitVectors(V(0, 1, 0), V(out.x * .35, 1, out.z * .35).normalize());
      M.compose(p1.clone().add(V(out.x * .03, .07, out.z * .03)), Q, V(1, 1, 1)); em.setMatrixAt(i, M); });
    const cord = new THREE.Mesh(new THREE.TorusGeometry(.062, .012, 5, 14), silMat()); cord.rotation.x = PI / 2;
    sm.frustumCulled = em.frustumCulled = false; g.add(sm, em, cord); return g;
  }

  // ======================================================== S08 L6: the harvest and the mill
  SHOT({ id: 'S08', t0: LINE(6)[0], t1: LINE(7)[0], out: { kind: 'cut' },
    build(G) {
      const land = mkLand(G, { size: 480, seg: 480, amp: .22, col: EARTH, river: true });
      const hm = (x, z) => .18 + .82 * smooth(clamp((x - .6) / 1.0)) * smooth(clamp((-1.9 - z) / .8));
      G.add(grain({ area: [-14, 5.5, -6.4, 3], n: 18000, h: 1.05, ground: land.userData.height, hmap: hm }));
      const river = mkRiver(G, land);
      const reaper = P.make('m2', { outfit: ['tunic', 'cloth'] }); G.add(reaper.root);
      // the sickle, held in the right hand: a short handle and a curved blade
      const sk = new THREE.Group(), hnd = cyl(.022, .022, .17, null, 6); hnd.position.y = .08;
      const bl = new THREE.Mesh(new THREE.TorusGeometry(.22, .014, 5, 20, PI * .75), silMat()); bl.position.set(-.22, .17, 0);
      sk.add(hnd, bl); reaper.bones.hand_r.add(sk); sk.rotation.set(0, 0, 0);
      // the sheaf: ~44 stalks, cut ends close together, bound at the waist (origin), ears fanning out at the top
      const sheaf = mkSheaf();
      G.add(sheaf);
      const stooks = [-5.2, -3.6, -7.0].map((x, i) => { const c = cone(.45, 1.0, null, 8); c.position.set(x, land.userData.height(x, -2.4 + i * .8) + .5, -2.4 + i * .8); G.add(c); return c; });
      void stooks;
      return { land, river, reaper, sk, sheaf };
    },
    frame(s, lt, dur, t, { camera }) {
      sky({ ...GOLD, time: t, sunDir: sunV(-52 * D, .2), cloud: .22, cloudDrift: 0, wind: 1.0, fogNear: 30, fogDen: .003 });
      const h = s.land.userData.height; animRiver(s.river, t);
      const rp = s.reaper, rx = .15, rz = -1.0;
      P.at(rp, [rx, h(rx, rz), rz], PI / 2);
      P.clip(rp, 'Farm_Harvest', t * .8);
      // lt 1.0-1.5 gather the cut grain, 1.5-2.2 lift the sheaf overhead (59.5 s at lt 2.2)
      const grab = smooth(seg(lt, 1.0, 1.5)), lift = smooth(seg(lt, 1.5, 2.25)), g0 = h(rx, rz);
      const base = V(rx + .55, g0 + .55, rz), top = V(rx + .22, g0 + 2.1, rz);
      const mid = base.clone().lerp(top, lift);
      const sheafOn = lt > 1.0;
      s.sheaf.visible = sheafOn; s.sk.visible = lt < 1.2;
      s.sheaf.position.set(mid.x, mid.y, mid.z); s.sheaf.rotation.z = -.18 * lift; s.sheaf.rotation.y = .5 * lift;
      if (grab > 0) {
        const cl = P.hand(rp, 'l'), cr = P.hand(rp, 'r');
        arm(rp, 'l', cl.lerp(mid.clone().add(V(0, 0, -.2)), grab), .45, .1); arm(rp, 'r', cr.lerp(mid.clone().add(V(0, 0, .2)), grab), .45, .1);
      }
      craneCam(camera, s.land, t, s8base(lt));
    },
  });

  // ======================================================== S09 L7: villages, cities, empires
  // Four instanced shapes (unit box, cone, cylinder, dome), each building a list of pieces that grow from scale y = 0.
  function pop(geo, max) {
    const im = new THREE.InstancedMesh(geo, silMat(), max); im.frustumCulled = false; im.count = 0;
    const items = [], M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = V(), Pp = V();
    return { im, items,
      add(x, y, z, sx, sy, sz, t0, dur = .8, ry = 0) { items.push({ x, y, z, sx, sy, sz, t0, dur, ry }); im.count = items.length; },
      update(t) {
        items.forEach((o, i) => {
          const e = easeOut(seg(t, o.t0, o.t0 + o.dur));
          const w = e > 0 ? Math.min(1, e * 6) : 0; Q.setFromAxisAngle(V(0, 1, 0), o.ry); S.set(Math.max(o.sx * w, 1e-5), Math.max(o.sy * e, 1e-5), Math.max(o.sz * w, 1e-5)); Pp.set(o.x, o.y - .15, o.z);
          M.compose(Pp, Q, S); im.setMatrixAt(i, M);
        });
        im.instanceMatrix.needsUpdate = true;
      } };
  }
  const W0 = [23, -12], rnd0 = (i, k) => hash(i * 12.9898 + k * 78.233 + 5);
  SHOT({ id: 'S09', t0: LINE(7)[0], t1: LINE(8)[0], out: { kind: 'cross', d: 1.2 },
    build(G) {
      const land = mkLand(G, { size: 480, seg: 480, amp: .22, col: '#2C2014', river: true });
      const hm = (x, z) => .18 + .82 * smooth(clamp((x - .6) / 1.0)) * smooth(clamp((-1.9 - z) / .8));
      G.add(grain({ area: [-14, 5.5, -6.4, 3], n: 18000, h: 1.05, ground: land.userData.height, hmap: hm }));
      const river = mkRiver(G, land);
      // a patchwork of fields (tilled earth, stubble, green barley) so the plain is not one brown sheet; they
      // appear with the first wave of building, and an irrigation canal runs out from the river
      const fcol = ['#6A4F2A', '#7C6230', '#51562C', '#8A6B36', '#5D4627', '#4A5A2E'];
      for (let i = 0; i < 70; i++) {
        const x = lerp(-110, 150, rnd0(i, 1)), z = -lerp(20, 200, rnd0(i, 2)), w = 14 + rnd0(i, 3) * 26, d = 10 + rnd0(i, 4) * 22;
        const f = box(w, .04, d, silMat({ col: fcol[i % fcol.length], fog: .35 })); f.position.set(x, .03 + (i % 5) * .004, z); f.rotation.y = (rnd0(i, 5) - .5) * .3; G.add(f);
      }
      // crop rows in the near plain, seen in perspective as the camera cranes up and back
      for (let i = 0; i < 46; i++) {
        const f = box(3.4, .05, 58, silMat({ col: i % 2 ? '#745A2C' : '#634D28', fog: .3 })); f.position.set(-70 + i * 3.4 + (i > 22 ? 9 : 0), .05, 34); G.add(f);
      }
      for (let i = 0; i < 18; i++) { const f = box(3.4, .05, 40, silMat({ col: i % 2 ? '#56602F' : '#6E6A32', fog: .3 })); f.position.set(8 + i * 3.4, .06, -33 - 0); f.position.z = -52; G.add(f); }
      for (let k = 0; k < 3; k++) { const cn = box(260, .05, 1.2, silMat({ col: '#B8935A', fog: .5 })); cn.position.set(20, .08, -26 - k * 34); G.add(cn); }
      const gb = new THREE.BoxGeometry(1, 1, 1).translate(0, .5, 0), gc = new THREE.ConeGeometry(1, 1, 10).translate(0, .5, 0);
      const gy = new THREE.CylinderGeometry(1, 1, 1, 10).translate(0, .5, 0), gd = new THREE.SphereGeometry(1, 16, 8, 0, TAU, 0, PI / 2);
      const boxes = pop(gb, 900), cones = pop(gc, 160), cyls = pop(gy, 260), domes = pop(gd, 60);
      G.add(boxes.im, cones.im, cyls.im, domes.im);
      const dist = (x, z) => Math.hypot(x - W0[0], z - W0[1]);
      const ZIG = [20, -88];
      const nearZig = (x, z, r) => Math.hypot(x - ZIG[0], z - ZIG[1]) < r;
      const rnd = (i, k) => hash(i * 12.9898 + k * 78.233);
      // huts: a cylinder wall and a cone roof, the first wave, close to the river
      for (let i = 0, n = 0; n < 80 && i < 400; i++) {
        const x = lerp(-40, 90, rnd(i, 1)), z = -lerp(24, 100, rnd(i, 2)); if (nearZig(x, z, 22)) continue; n++;
        const t0 = .1 + dist(x, z) / 110 * 2.0, r = 1.3 + rnd(i, 3) * .5;
        cyls.add(x, 0, z, r, 1.2, r, t0, .5); cones.add(x, 1.2, z, r * 1.25, 1.7 + rnd(i, 4) * .5, r * 1.25, t0 + .3, .5);
      }
      // mud-brick houses
      for (let i = 0, n = 0; n < 250 && i < 900; i++) {
        const x = lerp(-80, 120, rnd(i, 5)), z = -lerp(22, 180, rnd(i, 6)); if (nearZig(x, z, 26)) continue; n++;
        boxes.add(x, 0, z, 3.4 + rnd(i, 7) * 3.4, 2.4 + rnd(i, 8) * 2.8, 3.4 + rnd(i, 9) * 3.4, .9 + dist(x, z) / 190 * 2.9, .8, (rnd(i, 10) - .5) * .5);
      }
      // the city wall around the ziggurat, with gate towers at the corners
      const HS = 54, wt = 2.4;
      [[0, -HS, 2 * HS + wt, wt], [0, HS, 2 * HS + wt, wt], [-HS, 0, wt, 2 * HS + wt], [HS, 0, wt, 2 * HS + wt]].forEach(([ox, oz, sx, sz], k) => {
        const x = ZIG[0] + ox, z = ZIG[1] + oz; boxes.add(x, 0, z, sx, 5.5, sz, 1.9 + dist(x, z) / 190 * 2.2 + k * .05, 1.1);
      });
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => {
        const x = ZIG[0] + a * HS, z = ZIG[1] + b * HS, t0 = 2.3 + dist(x, z) / 190 * 2.2;
        boxes.add(x, 0, z, 6, 11, 6, t0, 1.0); boxes.add(x, 11, z, 7.4, 1.4, 7.4, t0 + .95, .4);
      });
      // towers
      for (let i = 0, n = 0; n < 30 && i < 400; i++) {
        const x = lerp(-60, 110, rnd(i, 11)), z = -lerp(30, 175, rnd(i, 12)); if (nearZig(x, z, 30)) continue; n++;
        const hgt = 10 + rnd(i, 13) * 9, t0 = 2.0 + dist(x, z) / 190 * 2.6;
        boxes.add(x, 0, z, 3.2, hgt, 3.2, t0, 1.0); boxes.add(x, hgt, z, 4.4, 1.3, 4.4, t0 + .95, .4);
      }
      // domes
      for (let i = 0, n = 0; n < 24 && i < 400; i++) {
        const x = lerp(-60, 110, rnd(i, 14)), z = -lerp(34, 178, rnd(i, 15)); if (nearZig(x, z, 30)) continue; n++;
        const t0 = 2.4 + dist(x, z) / 190 * 2.4, r = 3 + rnd(i, 16) * 1.6;
        boxes.add(x, 0, z, r * 2, 4.5, r * 2, t0, .8); domes.add(x, 4.5, z, r, r * .95, r, t0 + .75, .6);
      }
      // colonnades: a slab, a row of columns, a beam across the tops
      for (let i = 0, n = 0; n < 9 && i < 200; i++) {
        const x = lerp(-50, 100, rnd(i, 17)), z = -lerp(30, 160, rnd(i, 18)); if (nearZig(x, z, 30)) continue; n++;
        const t0 = 2.6 + dist(x, z) / 190 * 2.2;
        boxes.add(x, 0, z, 15, .7, 5.4, t0, .5);
        for (let c = 0; c < 8; c++) cyls.add(x - 6.3 + c * 1.8, .7, z, .46, 5.5, .46, t0 + .3 + c * .03, .5);
        boxes.add(x, 6.2, z, 15.4, 1.2, 5.6, t0 + .75, .45);
      }
      // the ziggurat, tier by tier
      [[44, 6], [34, 5.5], [24, 5.5], [14, 5], [6, 4]].reduce((y, [w, hh], k) => { boxes.add(ZIG[0], y, ZIG[1], w, hh, w, 1.9 + k * .55, .7); return y + hh; }, 0);
      return { land, river, pops: [boxes, cones, cyls, domes] };
    },
    frame(s, lt, dur, t, { camera }) {
      animRiver(s.river, t);
      // the sun makes one fast arc, left to right; the sky stays warm blue and gold throughout
      const a = smooth(seg(lt, 0, dur)), az = lerp(-52, 74, a) * D, el = .13 + .17 * Math.sin(PI * Math.pow(a, .9)) - .12 * smooth(seg(a, .8, 1));
      sky({ ...GOLD, time: t, sunDir: sunV(az, el), cloud: lerp(.22, .6, smooth(seg(lt, 0, 1.5))), cloudDrift: Math.pow(lt, 1.7) * .06,
        fogNear: 60, fogDen: .0024, wind: 1.0 });
      s.land.material.color.set(hexMix('#2C2014', '#7A5A33', smooth(seg(lt, .2, 2.6))));
      s.pops.forEach(p => p.update(lt));
      craneCam(camera, s.land, t, s8base(5.6));
    },
  });

  // ======================================================== S10 L8: the monument and the work song
  const RAMP = x => 6 * clamp((x + 44) / 54), Z0 = -40, OB = [34, -82], CAMZ = -18, FOV10 = 38;
  const XB1 = 11.5, TARR = 74.5, NW = 10, STRIDE_M = .916 * 1.3333;   // metres of ground per walk cycle at height 1 (measured)
  // walk cycles from the beats (two beats per cycle): the crew steps on the beats, and the block moves one stride per cycle
  const cycAt = t => { const bi = Math.max(0, beatAt(t)), fr = (t - B[bi]) / (B[bi + 1] - B[bi]); return (bi + fr) / 2; };
  const CYC0 = () => cycAt(68.25), CYCE = () => cycAt(TARR);
  // the obelisk: tall enough that, from the final camera, its top sits at y = .15 and its base at y = .85
  function obeliskDims() {
    const c = 2, d = CAMZ - OB[1], T = Math.tan(FOV10 / 2 * D), a = Math.atan(.7 * T);
    const phi = a - Math.atan(c / d), h = c + d * Math.tan(phi + a);
    return { phi, h, d };
  }
  SHOT({ id: 'S10', t0: LINE(8)[0], t1: LINE(9)[0], out: { kind: 'cut' },
    build(G) {
      const land = mkLand(G, { size: 600, seg: 150, amp: .2, col: '#2A1D12' });
      // the earthen ramp and causeway (a profile extruded along z), the stepped monument, the obelisk
      const sh = new THREE.Shape([[-70, -2], [-44, 0], [10, 6], [28, 6], [28, -2]].map(([x, y]) => new THREE.Vector2(x, y)));
      const ramp = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 3.4, bevelEnabled: false }), silMat({ col: '#241810', fog: .5 }));
      ramp.position.z = Z0 - 1.7; G.add(ramp);
      for (let k = 0; k < 6; k++) {
        const x0 = 40 + 3 * k, x1 = 76 - 3 * k, z0 = -64 + 3 * k, z1 = -34 - 3 * k, b = box(x1 - x0, 4, z1 - z0);
        b.position.set((x0 + x1) / 2, 4 * k + 2, (z0 + z1) / 2); G.add(b);
      }
      const od = obeliskDims(), ob = new THREE.Group();
      const w0 = od.h / 11, w1 = w0 * .62, shaftH = od.h - w1 * 1.4;
      const shaft = cyl(w1 * .7071, w0 * .7071, shaftH, null, 4); shaft.rotation.y = PI / 4; shaft.position.y = shaftH / 2;
      const tip = cone(w1 * .7071, w1 * 1.4, null, 4); tip.rotation.y = PI / 4; tip.position.y = shaftH + w1 * .7;
      const plinth = box(w0 * 1.5, od.h * .03, w0 * 1.5); plinth.position.y = od.h * .015;
      ob.add(shaft, tip, plinth); ob.position.set(OB[0], 0, OB[1]); G.add(ob);
      // the sledge: runners, a deck and the great block
      const sled = new THREE.Group(), blk = box(3.2, 1.6, 1.9); blk.position.y = 1.15;
      const deck = box(3.8, .16, 2.4); deck.position.y = .26;
      for (const z of [-.8, .8]) { const r = box(4.2, .22, .26); r.position.set(.1, .11, z); sled.add(r); }
      sled.add(deck, blk); G.add(sled);
      const names = ['m1', 'm3', 'w1', 'm2', 'w2', 'm1', 'm3', 'w2', 'm2', 'w1'];
      const HAUL = [['tunic'], ['tunic', 'cloth'], ['skirt', 'cloth'], ['tunic', 'cloth'], ['tunic'], ['skirt', 'cloth'], ['tunic', 'cloth'], ['tunic'], ['skirt', 'cloth'], ['tunic', 'cloth']];
      const crew = names.map((n, i) => P.make(n, { outfit: HAUL[i] })), ropes = crew.map(() => rod(.028));
      crew.forEach(c => G.add(c.root)); ropes.forEach(r => G.add(r));
      const smoke = []; for (let i = 0; i < 14; i++) {
        const m = new THREE.SpriteMaterial({ map: puffTex, color: new THREE.Color('#14101A'), transparent: true, depthWrite: false, opacity: 0, fog: false });
        const sp = new THREE.Sprite(m); smoke.push(sp); G.add(sp);
      }
      return { land, od, sled, crew, ropes, smoke };
    },
    frame(s, lt, dur, t, { camera }) {
      const u = seg(lt, 0, dur - .5), g = smooth(Math.pow(u, 2.7)), cx = 11 + 23 * g, cz = lerp(-26, CAMZ, g), ph = s.od.phi;
      // high at first, so the crew's feet clear the ramp's near edge; it comes down to the final low frame
      const cy = kf(u, [[0, 9.5], [.5, 9], [.85, 4.5], [1, 2]]);
      const tr = Math.atan2(7.2 - cy, Math.hypot(14, 1)), pitch = lerp(tr, ph, smooth(seg(u, .45, 1)));
      // the sun sits behind the obelisk and sets
      // the sun starts to the right of the obelisk (so the shaft is not washed out) and slides behind it as it sets
      const az = Math.atan2(OB[0] - cx, cz - OB[1]) + .3 * (1 - smooth(seg(t, 72, 76.5))), el = kf(t, [[68.25, .24], [74.5, .2], [77.0, -.05], [78.1, -.08]]);
      const k = smooth(seg(t, 71, 78));
      sky({ ...skyMix(GOLD, { zen: '#2E3C72', hor: '#FF8A3D', halo: '#FF7A32', haloW: 1.6, haloH: .2, sunCol: '#FFC28A', fogNear: 40 }, k), time: t, sunDir: sunV(az, el), sunSize: .014, sunGlow: lerp(.3, .7, smooth(seg(t, 72, 76.5))), fogNear: 50, fogDen: .0022, cloud: .2, cloudCol: '#6A5A80', cloudLit: '#FFB070' });
      // the block climbs the ramp; the crew steps on the beats
      // the block climbs the ramp one stride per beat-locked walk cycle, so no foot slides; it stops at TARR
      const cyc = Math.min(cycAt(t), CYCE()) - CYC0(), xb = XB1 - STRIDE_M * (CYCE() - CYC0()) + STRIDE_M * cyc;
      const slope = 6 / 54, tilt = Math.atan(slope) * (1 - smooth(seg(xb, 9.2, 13)));
      s.sled.position.set(xb, RAMP(xb) + .02, Z0); s.sled.rotation.z = tilt;
      const done = smooth(seg(t, TARR, TARR + .6));
      const anchor = i => V(xb + 1.9 * Math.cos(tilt), RAMP(xb + 1.9) + .5, Z0 + (i % 2 ? .45 : -.45));
      s.crew.forEach((c, i) => {
        const x = xb + 3.6 + i * 1.12, z = Z0 + (i % 2 ? .85 : -.85), y = x > 10 ? 6 : RAMP(x);
        P.at(c, [x, y, z], PI / 2);
        const wt = (cyc + hash(i * 7) * .04) * P.clipLen('Walk_Loop');
        if (done > 0) P.blend(c, 'Walk_Loop', wt, 'Idle_Loop', t, done); else P.clip(c, 'Walk_Loop', wt);
        const lean = (1 - done * .8) * .42;
        P.turn(c, 'spine_01', [lean * .5, 0, 0]); P.turn(c, 'spine_02', [lean * .5, 0, 0]);
        const gp = V(x + .5, y + 1.0 + .03 * Math.sin(cyc * TAU + i), z), w = 1 - done;
        const cl = P.hand(c, 'l'), cr = P.hand(c, 'r');
        arm(c, 'l', cl.lerp(gp.clone().add(V(0, 0, -.1)), w), .4, .2); arm(c, 'r', cr.lerp(gp.clone().add(V(0, 0, .1)), w), .4, .2);
        const a = anchor(i), hp = P.hand(c, 'r').lerp(P.hand(c, 'l'), .5);
        setRod(s.ropes[i], hp.toArray(), a.toArray());
      });
      // smoke drifts across the frame from 77 to 78
      const so = smooth(seg(t, 76.7, 77.5)) * (1 - .55 * smooth(seg(t, 77.4, 78.08)));
      s.smoke.forEach((sp, i) => {
        const sx = cx + (hash(i * 3.3) - .5) * 70 + (t - 77) * 7, sy = 4 + hash(i * 5.1) * 16;
        sp.position.set(sx, sy, CAMZ - 30 - hash(i * 7.7) * 20); const sc = 14 + hash(i * 9.3) * 16; sp.scale.set(sc * 1.5, sc, 1);
        sp.material.opacity = so * (.55 + .4 * hash(i * 2.2)); sp.visible = so > .01;
      });
      // camera: tracks the block, then drifts to the obelisk and holds still for the last half second
      const gy = s.land.userData.height(cx, cz) + cy;
      cam(camera, [cx, gy, cz], [cx, gy + Math.tan(pitch) * 100, cz - 100], FOV10);
    },
  });
})();
