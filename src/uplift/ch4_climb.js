// uplift/ch4_climb.js: the instrumental (S15-S16) and the bridge (S17-S20). Up through the clouds into the night,
// city lights spreading below, a storm; then a marsh before dawn, the long climb with lanterns,
// the fork in the trail, and the summit at sunrise. See STORYBOARD.md.
(() => {
  const { THREE, kf, seg, smooth, ease, easeIn, easeOut, lerp, clamp, hash, noise, fbm2, B, LINE, sky, skyMix, silMat, litMat, glow, setGlow,
    terrain, grass, water, streak, box, cyl, sph, rod, setRod, cam, gcam, puffTex, glowTex, C, TOK } = UP;
  const P = PEOPLE, PI = Math.PI, TAU = PI * 2;
  const v3 = a => new THREE.Vector3(...a);
  const T15 = 101.08, T16 = 106.44;

  // ---- an early biplane, nose along +x, about 7 m long
  const put = (o, x, y, z) => { o.position.set(x, y, z); return o; };
  function biplane() {
    const g = new THREE.Group(), m = silMat();
    const fus = new THREE.Mesh(new THREE.CylinderGeometry(.42, .16, 6.4, 10), m); fus.rotation.z = PI / 2; g.add(fus);
    g.add(put(box(1.4, .12, 9.6, m), .6, 1.05, 0), put(box(1.3, .1, 9.0, m), .5, -.35, 0));
    for (const z of [-3.2, -1.2, 1.2, 3.2]) { const r = rod(.03, m); setRod(r, [.6, -.3, z], [.6, 1.0, z]); g.add(r); }
    g.add(put(box(1.0, .08, 3.2, m), -3.0, .15, 0), put(box(.9, 1.1, .08, m), -3.1, .6, 0));
    const prop = new THREE.Mesh(new THREE.CircleGeometry(1.15, 24), silMat({ opacity: .35, side: THREE.DoubleSide })); prop.rotation.y = PI / 2; prop.position.x = 3.25; g.add(prop);
    for (const z of [-.7, .7]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.32, .32, .12, 12), m); w.rotation.x = PI / 2; w.position.set(1.0, -1.15, z); g.add(w); const r = rod(.03, m); setRod(r, [1.0, -1.1, z], [.7, -.35, z * .5]); g.add(r); }
    return g;
  }
  // a cloud slab of puff sprites (normal blending): o.n, box [x0, x1, y0, y1, z0, z1], col, op, size
  function cloudSlab(o) {
    const g = new THREE.Group(), [x0, x1, y0, y1, z0, z1] = o.box;
    for (let i = 0; i < o.n; i++) {
      const m = new THREE.SpriteMaterial({ map: puffTex, color: C(o.col), transparent: true, depthWrite: false, opacity: o.op ?? .85, fog: false });
      const s = new THREE.Sprite(m);
      s.position.set(lerp(x0, x1, hash(i * 1.7 + o.seed)), lerp(y0, y1, hash(i * 2.9 + o.seed)), lerp(z0, z1, hash(i * 4.3 + o.seed)));
      s.scale.setScalar(o.size * (.6 + hash(i * 5.1) * .9)); s.material.rotation = hash(i * 7.7) * TAU; s.userData.p0 = s.position.clone();
      g.add(s);
    }
    return g;
  }

  // ======================================================== S15 instrumental: up through the clouds, a century of flight
  // The biplane climbs into the clouds and comes out of each cloud bank as the next age's aircraft: a 1930s twin-engine
  // propeller airliner, a 1950s four-engine swept-wing jet, a modern twin-engine widebody. Each change happens on a beat,
  // hidden inside a cloud bank; the chase camera falls back as the aircraft grow. The last one leaves contrails above
  // the cloud sea with its navigation lights on. All aircraft face +x, nose forward, in metres from real proportions.
  const SWAP = [102.44, 103.80, 105.14];             // beats in the loudest bars of the instrumental
  const ERA_LEN = [7, 19.7, 46, 57], ERA_V = [44, 72, 120, 140];
  function fus(g, m, x0, x1, r, nose, tail, tailUp = 0) {          // a fuselage along x with a nose and an upswept tail cone
    const body = cyl(r, r, x1 - x0, m, 18); body.rotation.z = PI / 2; body.position.x = (x0 + x1) / 2; g.add(body);
    const n = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 12, 0, TAU, 0, PI / 2), m); n.scale.set(1, nose / r, 1); n.rotation.z = -PI / 2; n.position.x = x1; g.add(n);
    const tc = new THREE.Mesh(new THREE.CylinderGeometry(r * .18, r, tail, 16), m); tc.rotation.z = PI / 2 - tailUp; tc.position.set(x0 - tail / 2 * Math.cos(tailUp), tail / 2 * Math.sin(tailUp), 0); g.add(tc);
  }
  function wingPair(g, m, xLE, span, cRoot, cTip, sweep, th, y = 0, rake = 0) {   // a planform in x (chord) and z (span)
    const h = span / 2, sh = new THREE.Shape();
    sh.moveTo(0, 0); sh.lineTo(-sweep, h - rake); sh.lineTo(-sweep - rake * .9, h); sh.lineTo(-sweep - cTip, h); sh.lineTo(-cRoot, 0);
    sh.lineTo(-sweep - cTip, -h); sh.lineTo(-sweep - rake * .9, -h); sh.lineTo(-sweep, -h + rake); sh.closePath();
    const geo = new THREE.ExtrudeGeometry(sh, { depth: th, bevelEnabled: false }); geo.rotateX(PI / 2); geo.translate(xLE, y + th / 2, 0); geo.computeVertexNormals();
    const w = new THREE.Mesh(geo, m); g.add(w); return w;
  }
  function finV(g, m, x, h, c0, c1, sweep, th) {
    const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(-sweep, h); sh.lineTo(-sweep - c1, h); sh.lineTo(-c0, 0); sh.closePath();
    const geo = new THREE.ExtrudeGeometry(sh, { depth: th, bevelEnabled: false }); geo.translate(x, 0, -th / 2); geo.computeVertexNormals(); g.add(new THREE.Mesh(geo, m));
  }
  function pod(g, m, x0, x1, r, y, z, prop = 0) {
    const e = cyl(r * .9, r, x1 - x0, m, 14); e.rotation.z = PI / 2; e.position.set((x0 + x1) / 2, y, z); g.add(e);
    if (prop) { const d = new THREE.Mesh(new THREE.CircleGeometry(prop, 28), silMat({ opacity: .28, side: THREE.DoubleSide })); d.rotation.y = PI / 2; d.position.set(x1 + .15, y, z); g.add(d); }
  }
  function dc3() {
    const g = new THREE.Group(), m = silMat();
    fus(g, m, -8.5, 7.5, 1.15, 1.6, 4.5, .12);
    wingPair(g, m, 2.6, 29, 4.4, 1.6, 1.6, .45, -.8);
    pod(g, m, -.6, 3.8, .78, -.55, 5.6, 1.75); pod(g, m, -.6, 3.8, .78, -.55, -5.6, 1.75);
    wingPair(g, m, -10.6, 8.7, 2.4, 1.0, .8, .2, .35);
    finV(g, m, -10.4, 3.4, 3.2, 1.3, 1.6, .25);
    return g;
  }
  function jet707() {
    const g = new THREE.Group(), m = silMat();
    fus(g, m, -18, 17, 1.85, 4.5, 7.5, .1);
    wingPair(g, m, 5, 44, 10, 2.6, 12.5, .7, -1.0);
    for (const z of [-15.5, -9.3, 9.3, 15.5]) { const xo = 4.6 - Math.abs(z) * .55; pod(g, m, xo - 4.6, xo + .4, .85, -2.4, z); const py = box(2.2, 1.3, .2, m); py.position.set(xo - 1.6, -1.6, z); g.add(py); }
    wingPair(g, m, -19, 14, 4.2, 1.5, 3.4, .25, .9);
    finV(g, m, -19.5, 10, 6.5, 2.2, 7.5, .4);
    return g;
  }
  function widebody() {
    const g = new THREE.Group(), m = silMat();
    fus(g, m, -22, 21, 2.9, 5.5, 9.5, .09);
    const w = wingPair(g, m, 6.5, 60, 12.5, 2.3, 16, .9, -1.4, 3.2);
    for (const z of [-10.8, 10.8]) { pod(g, m, -2.4, 6.0, 1.65, -3.0, z); const py = box(3.4, 1.8, .3, m); py.position.set(1.4, -2.0, z); g.add(py); }
    wingPair(g, m, -24.5, 19.5, 6.0, 2.0, 5.5, .35, 1.0);
    finV(g, m, -24, 12.5, 8.5, 3.0, 9, .5);
    // navigation lights: port red, starboard green, white strobes at the tips and tail, a red beacon on top
    const L = { red: glow('#FF3A2A', 2.2, 0), green: glow('#3AFF6A', 2.2, 0), s1: glow('#F0F4FF', 3, 0), s2: glow('#F0F4FF', 3, 0), tail: glow('#F0F4FF', 3, 0), bea: glow('#FF2A1A', 2.6, 0) };
    L.red.position.set(-17.5, -1, -30); L.green.position.set(-17.5, -1, 30); L.s1.position.set(-18, -1, -30.3); L.s2.position.set(-18, -1, 30.3);
    L.tail.position.set(-31, 1.6, 0); L.bea.position.set(-2, 3.2, 0);
    Object.values(L).forEach(o => g.add(o)); g.userData.lights = L;
    return g;
  }
  // the climb: speed eases between the ages; position is integrated in closed form steps (deterministic)
  const GAMMA = .40, DIR = v3([Math.cos(GAMMA), Math.sin(GAMMA), -.28]).normalize();
  const eraAt = t => SWAP.filter(x => t >= x).length;
  const speedAt = t => { let v = ERA_V[0]; SWAP.forEach((x, i) => { v = lerp(v, ERA_V[i + 1], smooth(seg(t, x - .2, x + .6))); }); return v; };
  const sAt = t => { const n = 80, a = T15 - .5, h = (t - a) / n; let s = 0; for (let i = 0; i < n; i++) s += speedAt(a + (i + .5) * h) * h; return s; };
  const P0 = v3([0, 240, 0]);
  const planeAt = t => P0.clone().addScaledVector(DIR, sAt(t));
  const lenAt = t => { let L = ERA_LEN[0]; SWAP.forEach((x, i) => { L = lerp(L, ERA_LEN[i + 1], smooth(seg(t, x - .15, x + .35))); }); return L; };
  SHOT({ id: 'S15', t0: T15, t1: T16, out: { kind: 'cross', d: 1.0 },
    build(G) {
      const planes = [biplane(), dc3(), jet707(), widebody()]; planes.forEach(pl => G.add(pl));
      // a cloud bank around the aircraft at each change, so it flies into cloud and out as the next age
      const banks = SWAP.map((ts, i) => { const c = planeAt(ts), L = ERA_LEN[i + 1];
        return cloudSlab({ n: 12, box: [c.x - .5 * L, c.x + .6 * L, c.y - .35 * L, c.y + .35 * L, c.z - .5 * L, c.z + .5 * L], col: '#B07C84', op: .96, size: .75 * L + 8, seed: 11 + i }); });
      banks.forEach(b => G.add(b));
      const wisps = cloudSlab({ n: 18, box: [-100, 900, 330, 520, -400, -60], col: '#7A5468', op: .45, size: 70, seed: 2 }); G.add(wisps);
      // the cloud sea below the final altitude, lit toward the sunset
      const top = planeAt(SWAP[2]).y - 35;
      const seaM = new THREE.ShaderMaterial({ uniforms: { ...UP.U }, transparent: true, depthWrite: false,
        vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
        fragmentShader: UP.SKY_GLSL + `varying vec3 vW;
          void main(){ vec2 p = vW.xz * .004; float n = ufbm(vec3(p, uTime * .01)), n2 = ufbm(vec3(p * 3.1 + 4., 1.));
            float cov = smoothstep(.36, .62, n * .8 + n2 * .35);
            vec3 v = normalize(vW - cameraPosition); float toward = pow(max(dot(normalize(vec3(v.x, 0., v.z)), normalize(vec3(uSunDir.x, 0., uSunDir.z))), 0.), 3.);
            vec3 lit = mix(vec3(.08, .06, .15), vec3(.62, .3, .2), toward * (.35 + .65 * n2));
            vec3 c = mix(skyBase(v) * .7, lit, cov);
            float dd = length(vW - cameraPosition); c = mix(c, skyBase(v), clamp(1. - exp(-dd * .00025), 0., .85));
            gl_FragColor = vec4(c, smoothstep(.0, .2, cov) * .97); }` });
      const sea = new THREE.Mesh(new THREE.PlaneGeometry(30000, 30000, 1, 1), seaM); sea.rotation.x = -PI / 2; sea.position.y = top; G.add(sea);
      // contrails: soft additive puffs along the widebody's own past path, behind its two engines
      const trail = []; for (let i = 0; i < 2 * 150; i++) { const g = glow('#FFE2D0', 4, 0); trail.push(g); G.add(g); }
      return { planes, trail };
    },
    frame(s, lt, dur, t, { camera }) {
      const k = smooth(seg(lt, 1.4, 5.0));
      const DUSK = { zen: '#1E1C40', hor: '#C46A3E', horK: .35, halo: '#E07040', haloW: 3, haloH: .07, sunDir: [1, -.05, -.25], sunCol: '#FFB070', sunGlow: .8, stars: .1 };
      const NIGHT = { zen: '#05081A', hor: '#3A2C4E', horK: .45, halo: '#9A4A3A', haloW: 4, haloH: .035, sunDir: [1, -.1, -.25], sunGlow: .2, stars: .9, milky: .4 };
      sky({ ...skyMix(DUSK, NIGHT, k), time: t, fogNear: 400, fogDen: .00025, rimK: 3, rimCol: '#FFB080' });
      const era = eraAt(t), pos = planeAt(t), L = lenAt(t);
      s.planes.forEach((pl, i) => {
        pl.visible = i === era;
        if (!pl.visible) return;
        pl.position.copy(pos); pl.rotation.set(0, Math.atan2(-DIR.z, DIR.x) * .0 + .28, GAMMA * (i < 2 ? 1 : .85));
        pl.rotation.order = 'YXZ'; pl.rotation.x = -.06 + .04 * Math.sin(t * 1.3 + i);    // a slight bank that breathes
        pl.children.forEach(c => { if (c.geometry && c.geometry.type === 'CircleGeometry') c.rotation.x = t * 40; });
      });
      // the widebody's lights blink (strobes twice a second, beacon once a second); contrails behind its engines
      const wb = s.planes[3], Lt = wb.userData.lights, on = era === 3;
      const strobe = (Math.floor(t * 2) % 2 === 0 && (t * 2 % 1) < .12) ? 3 : 0, beacon = ((t * 1.1) % 1) < .18 ? 2.6 : .2;
      setGlow(Lt.red, on ? 2.2 : 0); setGlow(Lt.green, on ? 2.2 : 0); setGlow(Lt.s1, on ? strobe : 0); setGlow(Lt.s2, on ? strobe : 0); setGlow(Lt.tail, on ? strobe : 0); setGlow(Lt.bea, on ? beacon : 0);
      s.trail.forEach((g, i) => {
        const e = i % 2, j = Math.floor(i / 2), tau = .03 + j * .013, past = planeAt(t - tau);
        const off = v3([-2, -3, e ? 10.8 : -10.8]).applyEuler(wb.rotation);
        g.position.copy(past).add(off);
        const age = Math.max(0, t - SWAP[2] - .25 - tau), vis = on && age > 0 ? Math.min(1, age * 3) : 0;
        setGlow(g, vis * .2 * Math.pow(1 - j / 150, 1.4), 3.6 + j * .1);
      });
      // chase camera: behind, below and to the side; it falls back as the aircraft grow
      const D = 1.55 * L + 6, look = pos.clone().addScaledVector(DIR, .1 * L);
      const cp = pos.clone().addScaledVector(DIR, -.55 * D).add(v3([.1 * D, -.55 * D * (1 - .6 * k), 1.05 * D]));
      cam(camera, cp.toArray(), look.toArray(), lerp(42, 48, k));
    },
  });

  // ======================================================== S16 instrumental: the lights of the world, then a storm
  // Units here are kilometres. The ground curves away (radius 6371 km); lights switch on city by city, then along roads.
  SHOT({ id: 'S16', t0: T16, t1: LINE(13)[0], out: { kind: 'dip', d: 1.2, col: '#05060A' },
    build(G) {
      const R = 6371, curve = (x, z) => -(x * x + z * z) / (2 * R);
      const ground = new THREE.Mesh((() => { const g = new THREE.PlaneGeometry(2400, 2400, 120, 120); g.rotateX(-PI / 2); const p = g.attributes.position;
        for (let i = 0; i < p.count; i++) p.setY(i, curve(p.getX(i), p.getZ(i))); return g; })(), silMat({ col: '#06070C', fog: .3 }));
      G.add(ground);
      // cities: centres with sizes and founding order; roads between neighbours
      const NC = 170, cities = [];
      for (let i = 0; i < NC; i++) cities.push({ x: (hash(i * 1.3) - .5) * 640, z: 70 - Math.pow(hash(i * 2.1), 1.5) * 640, r: 2 + Math.pow(hash(i * 3.7), 3) * 15, o: hash(i * 5.9) });
      const pos = [], on = [], col = [];
      const add = (x, z, t0, warm) => { pos.push(x, curve(x, z) + .02, z); on.push(t0); col.push(warm); };
      cities.forEach((c, i) => {
        const n = Math.round(c.r * c.r * 14 + 60);
        for (let j = 0; j < n; j++) {
          const a = hash(i * 31 + j * 1.1) * TAU, d = Math.pow(hash(i * 17 + j * 2.3), 1.6) * c.r;
          add(c.x + Math.cos(a) * d, c.z + Math.sin(a) * d, c.o * 3.2 + d / c.r * 2.2 + hash(j) * .5, hash(j * 3.3) < .8 ? 1 : 0);
        }
      });
      for (let i = 0; i < NC; i++) {
        const a = cities[i]; let best = -1, bd = 1e9;
        for (let j = 0; j < NC; j++) { if (j === i) continue; const d = Math.hypot(a.x - cities[j].x, a.z - cities[j].z); if (d < bd) { bd = d; best = j; } }
        const b2 = cities[best], n = Math.round(bd / .45);
        for (let k = 0; k < n; k++) { const u = k / n; add(lerp(a.x, b2.x, u) + noise(u * 6 + i) * 6, lerp(a.z, b2.z, u) + noise(u * 5 + i * 2) * 6, 3.4 + Math.max(a.o, b2.o) * 2 + u * 1.2 + hash(k * 1.9 + i), 1); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('on', new THREE.Float32BufferAttribute(on, 1)); g.setAttribute('warm', new THREE.Float32BufferAttribute(col, 1));
      const m = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uPx: { value: 1 }, uDim: { value: 1 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: `attribute float on; attribute float warm; uniform float uT, uPx; varying float vK; varying float vW;
          void main(){ vK = smoothstep(on, on + .35, uT); vW = warm; vec4 mv = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv; gl_PointSize = clamp(90. / -mv.z, 1.0, 3.) * uPx; }`,
        fragmentShader: `uniform float uDim; varying float vK; varying float vW; void main(){ float d = length(gl_PointCoord - .5); vec3 c = mix(vec3(.75, .85, 1.), vec3(1., .72, .35), vW);
          gl_FragColor = vec4(c * vK * uDim * 2.2 * exp(-d * d * 10.), 1.); }` });
      const lights = new THREE.Points(g, m); lights.frustumCulled = false; G.add(lights);
      const storm = cloudSlab({ n: 140, box: [-600, 600, 8, 16, -500, 120], col: '#0B0C14', op: .95, size: 160, seed: 9 }); G.add(storm);
      const bolts = [0, 1, 2].map(i => { const gl = glow('#B8C8FF', 120, 0); G.add(gl); return gl; });
      return { lights, storm, bolts };
    },
    frame(s, lt, dur, t, { camera, PX }) {
      sky({ zen: '#02030A', hor: '#0C1328', horK: .55, halo: '#1C4A3C', haloW: 0, haloH: .018, sunDir: [0, -.2, -1], stars: 1, milky: .6, skyYaw: .8 + t * .01, time: t, fogNear: 40, fogDen: .0015, fogMax: .8 });
      s.lights.material.uniforms.uT.value = lt * 1.15; s.lights.material.uniforms.uPx.value = PX;
      const st = smooth(seg(lt, 5.0, 7.4));
      s.lights.material.uniforms.uDim.value = 1 - .8 * st;
      s.storm.children.forEach((c, i) => { c.position.x = c.userData.p0.x - 900 * (1 - st) + lt * 8; c.material.opacity = .95 * st; });
      const fl = [6.1, 6.7, 7.2];
      s.bolts.forEach((b, i) => { const a = lt - fl[i]; setGlow(b, a > 0 && a < .18 ? 2.5 * (1 - a / .18) : 0); b.position.set(-200 + i * 180, 12, -120 - i * 60); });
      const d = lt / dur;
      cam(camera, [lerp(-40, 30, d), 14, lerp(90, 50, d)], [lerp(-10, 40, d), -30, -260], 50);
    },
  });

  // ======================================================== S17 L13: rising from the marsh
  const SLATE = { zen: '#121924', hor: '#3A3A42', horK: .45, halo: '#5C6670', haloW: 2, haloH: .05, sunDir: [-.3, -.12, -1], stars: .05, cloud: .5, cloudCol: '#1A1F2A', cloudLit: '#3A3E48', cloudScale: .45 };
  SHOT({ id: 'S17', t0: LINE(13)[0], t1: LINE(14)[0], out: { kind: 'cut' },
    build(G) {
      const land = terrain({ size: 2000, seg: 160, amp: .5, freq: .02, fog: .45, h: (x, z) => .25 * fbm2(x * .2, z * .2) + 30 * Math.max(0, -z - 300) / 700 });
      G.add(land, water({ w: 2000, d: 2000, y: .02, dark: .5 }));
      G.add(grass({ area: [-30, 30, -40, 4], n: 6000, h: 1.2, ground: land.userData.height, clear: [[0, -3.5, 3.2], [-1.0, 2.6, 3.6]] }));
      const p = P.make('m1', { outfit: ['tunic', 'hood'] }); G.add(p.root);
      const rain = streak({ n: 2500, box: [30, 16, 30], dir: [1.5, -14, 0], size: 40, max: 4, col: '#9AA8C0' }); rain.position.set(0, 6, -4); G.add(rain);
      return { land, p, rain };
    },
    frame(s, lt, dur, t, { camera, PX }) {
      const dawn = smooth(seg(lt, 0, 5.3));
      sky({ ...SLATE, time: t, halo: UP.hexMix('#5C6670', '#8AA0A0', dawn), fogNear: 15, fogDen: .006 });
      const h = s.land.userData.height, x = 0, z = -3.5;
      P.at(s.p, [x, h(x, z) + .02, z], PI / 2);
      if (lt < .7) P.clip(s.p, 'LayToIdle', 0, { loop: false });
      else if (lt < 4.2) P.clip(s.p, 'LayToIdle', (lt - .7) * .9, { loop: false });
      else P.blend(s.p, 'LayToIdle', 9, 'Idle_Loop', lt, smooth(seg(lt, 4.2, 4.8)), { a: { loop: false } });
      s.rain.userData.update(t, .9 * (1 - smooth(seg(lt, .5, 3.2))), PX);
      gcam(camera, s.land, [-1.3 + lt * .1, .2, 2.4], [0, h(0, -3.5) + lerp(.25, .95, smooth(seg(lt, 1.5, 4.5))), -3.6], 30);
    },
  });

  // ======================================================== S18 L14: the chain of lanterns
  const MZ = -2600, peakH = (x, z) => 1100 * Math.exp(-((x * x) / (2 * 900 * 900) + ((z - MZ) * (z - MZ)) / (2 * 650 * 650)));
  // a switchback trail up the face of the mountain that looks at the camera (+z side)
  function trail(land, n = 9) {
    const pts = [], h = land.userData.height;
    for (let i = 0; i <= n * 20; i++) {
      const u = i / (n * 20), leg = Math.floor(u * n), f = u * n - leg, dir = leg % 2 ? -1 : 1;
      const z = lerp(MZ + 900, MZ + 80, u), w = lerp(380, 60, u), x = dir * (f - .5) * w * 2 * (f < .9 ? 1 : 1);
      pts.push(v3([x, h(x, z) + 1.5, z]));
    }
    return new THREE.CatmullRomCurve3(pts);
  }
  SHOT({ id: 'S18', t0: LINE(14)[0], t1: LINE(15)[0], out: { kind: 'cross', d: 1.1 },
    build(G) {
      const land = terrain({ size: 9000, seg: 260, amp: 140, freq: .0016, fog: .45, h: (x, z) => peakH(x, z) + 380 * Math.exp(-((x + 1600) * (x + 1600) / (2 * 700 * 700) + (z - MZ - 500) * (z - MZ - 500) / (2 * 600 * 600))) });
      G.add(land);
      const path = trail(land);
      const lamps = []; for (let i = 0; i < 46; i++) { const l = glow(TOK.ember, 28, 0); lamps.push(l); G.add(l); }
      return { land, path, lamps };
    },
    frame(s, lt, dur, t, { camera }) {
      const dawn = smooth(seg(lt, 0, 4.8)) * .4 + .2;
      sky({ ...SLATE, cloud: .2, time: t, sunDir: [.35, -.1, -1], halo: UP.hexMix('#3A4650', '#9AB0A8', dawn), haloH: .04, stars: .35, fogNear: 300, fogDen: .00035 });
      const L = s.path;
      s.lamps.forEach((l, i) => {
        const u = ((lt * .022 + .62 - i * .0135) % 1 + 1) % 1, k = smooth(seg(u, 0, .03)) * (1 - smooth(seg(u, .97, 1)));
        l.position.copy(L.getPointAt(u)); setGlow(l, 1.8 * k * (.85 + .15 * noise(t * 3 + i)), 22 + 10 * hash(i));
      });
      cam(camera, [-420 + lt * 6, 160, 1500], [0, 420, MZ + 300], 34);
    },
  });

  // ======================================================== S19 L15: the fork in the trail
  // Side view looking -z. Left: the land falls to a warm valley, a road of lamps leads down to it. Right: a steep,
  // rocky slope climbs into the wind. The climber stands at the fork in the centre, looks down at the valley,
  // then turns and climbs to the right.
  SHOT({ id: 'S19', t0: LINE(15)[0], t1: LINE(16)[0], out: { kind: 'cut' },
    build(G) {
      // the fork sits on a crest that runs along x: it climbs to the right, falls to the left toward the valley,
      // and the ground drops away in front of and behind the crest, so the climber stands against the sky
      const crest = x => x > 0 ? Math.pow(x, 1.2) * .3 : -Math.pow(-x, 1.2) * .38;
      const hf = (x, z) => crest(x) - .07 * z * z / (1 + z * z / 400) + .5 * fbm2(x * .15, z * .15);
      const land = terrain({ size: 2400, seg: 240, amp: .5, freq: .03, fog: .45, rim: .12, h: hf });
      G.add(land);
      for (let i = 0; i < 30; i++) { const x = 1.5 + hash(i) * 26, z = -8 + hash(i * 3) * 10, r = UP.rock(.5 + hash(i * 7) * 1.2, i, .75); r.position.set(x, hf(x, z) - .1, z); G.add(r); }
      const valley = new THREE.Group();
      for (let i = 0; i < 90; i++) { const x = -12 - hash(i) * 46, z = -22 - hash(i * 2) * 60, y = hf(x, z); const b = box(.9, .7, .2, litMat(TOK.gold, 2 + hash(i * 5) * 2.5)); b.position.set(x, y + .8 + hash(i * 3) * 2.5, z); valley.add(b); }
      for (let i = 0; i < 7; i++) { const x = -18 - hash(i) * 34, z = -32 - hash(i * 4) * 40, g = glow('#FFB060', 26 + 16 * hash(i), .5); g.position.set(x, hf(x, z) + 5, z); valley.add(g); }
      for (let i = 0; i < 14; i++) { const u = i / 13, x = lerp(-1.5, -30, u), z = lerp(-1, -24, u * u), g = glow('#FFC070', .7, 1.5); g.position.set(x, hf(x, z) + .8, z); valley.add(g); }
      G.add(valley);
      const p = P.make('m3', { outfit: ['cloak', 'hood', 'pack'] }); G.add(p.root);
      const lamp = glow(TOK.ember, .7, 1.7); G.add(lamp);
      const snow = streak({ n: 1600, box: [26, 14, 20], dir: [-9, -1.5, 1], size: 50, max: 6, col: '#C8D4EA' }); snow.position.set(10, 7, -2); G.add(snow);
      return { land, p, lamp, snow };
    },
    frame(s, lt, dur, t, { camera, PX }) {
      sky({ ...SLATE, cloud: .4, time: t, sunDir: [.5, -.08, -1], halo: '#8AA0A0', haloH: .05, stars: .15, fogNear: 25, fogDen: .004, wind: 1.2 });
      const h = s.land.userData.height;
      const climb = Math.max(0, lt - 2.6) * .8, x = climb, z = 0;
      const yaw = lerp(-PI / 2, PI / 2, smooth(seg(lt, 1.7, 2.6)));
      P.at(s.p, [x, h(x, z), z], yaw);
      if (lt < 2.6) { P.clip(s.p, 'Idle_Lantern_Loop', t); if (lt < 2.0) P.turn(s.p, 'Head', [.4 * smooth(seg(lt, .2, .8)), 0, 0]); }
      else P.blend(s.p, 'Idle_Lantern_Loop', t, 'Walk_Loop', t, smooth(seg(lt, 2.6, 3.0)), { b: { skip: ['clavicle_r', 'upperarm_r', 'lowerarm_r', 'hand_r'] } });
      s.lamp.position.copy(P.hand(s.p, 'r')).add(v3([0, -.15, 0]));
      s.snow.userData.update(t, .55, PX);
      const fx = lerp(-2.5, 1.8, smooth(seg(lt, 2.2, 5.2)));
      const cy = h(x, 0);                                  // heights from the climber's ground, not the camera's
      cam(camera, [fx - .8, cy - .9, 6.2], [x * .8 + fx * .2, cy + 1.35, 0], 46);
    },
  });

  // ======================================================== S20 L16: the summit at sunrise
  SHOT({ id: 'S20', t0: LINE(16)[0], t1: LINE(17)[0], out: { kind: 'cross', d: 1.0 },
    build(G) {
      const hf = (x, z) => x < 0 ? Math.max(-6, 1.1 * x) : -.1 * x + .4 * fbm2(x * .3, z * .3);   // a ledge at x = 0, the summit to the right
      const land = terrain({ size: 6000, seg: 260, amp: .4, freq: .05, fog: .5, h: (x, z) => hf(x, z) - 1400 * (1 - Math.exp(-Math.max(0, Math.hypot(x, z) - 40) / 900)) });
      G.add(land);
      const p = P.make('m3', { outfit: ['cloak', 'hood'] }); G.add(p.root);
      return { land, p };
    },
    frame(s, lt, dur, t, { camera }) {
      const k = smooth(seg(lt, 0, 5)), el = kf(lt, [[0, -.04], [3.6, 0], [8.1, .06]], x => x);
      const DAWN = { zen: '#22305A', hor: '#F2B070', horK: .4, halo: '#FF9050', haloW: 2.5, haloH: .1, sunCol: '#FFE0B0', sunGlow: 1.4 };
      const HIGH = { zen: '#060A1E', hor: '#E8A070', horK: .25, halo: '#FF9050', haloW: 3, haloH: .06, sunCol: '#FFF0D0', sunGlow: 1.6, stars: .5 };
      const up = ease(seg(lt, 4.0, 8.14));
      sky({ ...skyMix(skyMix(SLATE, DAWN, k), HIGH, up), cloud: .2 * (1 - k), time: t, sunDir: [1, el, -.35], sunSize: el > -.02 ? .016 : 0, fogNear: 40, fogDen: .002 });
      const h = s.land.userData.height;
      // climbs over the ledge (0-2.2) then stands on the summit facing the sunrise
      const cx = lerp(-.45, .55, smooth(seg(lt, .3, 2.0)));
      P.at(s.p, [cx, h(cx, 0) - 1.0 + smooth(seg(lt, 2.1, 2.8)) * 1.0, 0], PI / 2);
      if (lt < 2.2) P.clip(s.p, 'ClimbUp_1m', lt * .9, { loop: false }); else P.blend(s.p, 'ClimbUp_1m', 9, 'Idle_Loop', lt, smooth(seg(lt, 2.2, 2.8)), { a: { loop: false } });
      const hand = P.hand(s.p, 'r');
      const near = 1 - smooth(seg(lt, 1.6, 3.4));
      const pos = v3([-2.8, h(0, 0) + .1, 2.4]).lerp(v3([-4.5, h(0, 0) + 1.2, 6.5]), 1 - near);
      pos.y += 260 * easeIn(up); pos.x -= 40 * up; pos.z += 60 * up;
      const look = hand.clone().lerp(v3([1.5, h(0, 0) + 1.4, -2]), 1 - near);
      look.y += 420 * up;
      cam(camera, pos.toArray(), look.toArray(), lerp(26, 44, 1 - near));
    },
  });
})();
