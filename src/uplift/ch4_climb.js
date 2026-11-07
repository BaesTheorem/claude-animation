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

  // ======================================================== S15 instrumental: up through the clouds
  SHOT({ id: 'S15', t0: T15, t1: T16, out: { kind: 'cross', d: 1.0 },
    build(G) {
      const plane = biplane(); G.add(plane);
      const below = cloudSlab({ n: 70, box: [-200, 700, 335, 360, -220, 140], col: '#6A4A5E', op: .8, size: 110, seed: 1 });
      const layer = cloudSlab({ n: 130, box: [-150, 600, 360, 395, -160, 110], col: '#8A6070', op: .9, size: 90, seed: 2 });
      const tops = cloudSlab({ n: 110, box: [-100, 900, 390, 405, -400, 200], col: '#3A3050', op: .95, size: 170, seed: 3 });
      G.add(below, layer, tops);
      return { plane, layer, tops };
    },
    frame(s, lt, dur, t, { camera }) {
      const k = smooth(seg(lt, 2.4, 5.0));
      const DUSK = { zen: '#1E1C40', hor: '#C46A3E', horK: .35, halo: '#E07040', haloW: 3, haloH: .07, sunDir: [1, -.05, -.25], sunCol: '#FFB070', sunGlow: .8, stars: .1 };
      const NIGHT = { zen: '#05081A', hor: '#3A2C4E', horK: .45, halo: '#9A4A3A', haloW: 4, haloH: .035, sunDir: [1, -.1, -.25], sunGlow: .2, stars: .9, milky: .4 };
      sky({ ...skyMix(DUSK, NIGHT, k), time: t, fogNear: 400, fogDen: .0004 });
      const ang = lerp(.42, .12, smooth(seg(lt, 3.6, 5.3))), sp = 46;
      const x = sp * lt * Math.cos(.38), y = 300 + sp * lt * Math.sin(.38) * lerp(1, .55, smooth(seg(lt, 3.6, 5.3)));
      s.plane.position.set(x, y, 0); s.plane.rotation.set(0, 0, ang); s.plane.children[s.plane.children.length - 5].rotation.x = t * 40;
      // camera: below and behind, looking up at the plane; rises with it through the layer
      const off = v3([lerp(-26, -30, k), lerp(-12, -3, k), lerp(14, 16, k)]);
      cam(camera, [x + off.x, y + off.y, off.z], [x + 6, y + lerp(4, 0, k), 0], lerp(40, 46, k));
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
      const NC = 110, cities = [];
      for (let i = 0; i < NC; i++) cities.push({ x: (hash(i * 1.3) - .5) * 700, z: -hash(i * 2.1) * 620 + 60, r: 2.5 + Math.pow(hash(i * 3.7), 3) * 16, o: hash(i * 5.9) });
      const pos = [], on = [], col = [];
      const add = (x, z, t0, warm) => { pos.push(x, curve(x, z) + .02, z); on.push(t0); col.push(warm); };
      cities.forEach((c, i) => {
        const n = Math.round(c.r * c.r * 9 + 40);
        for (let j = 0; j < n; j++) {
          const a = hash(i * 31 + j * 1.1) * TAU, d = Math.pow(hash(i * 17 + j * 2.3), 1.6) * c.r;
          add(c.x + Math.cos(a) * d, c.z + Math.sin(a) * d, c.o * 3.2 + d / c.r * 2.2 + hash(j) * .5, hash(j * 3.3) < .8 ? 1 : 0);
        }
      });
      for (let i = 0; i < NC; i++) {
        const a = cities[i]; let best = -1, bd = 1e9;
        for (let j = 0; j < NC; j++) { if (j === i) continue; const d = Math.hypot(a.x - cities[j].x, a.z - cities[j].z); if (d < bd) { bd = d; best = j; } }
        const b2 = cities[best], n = Math.round(bd / .7);
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
      sky({ zen: '#02030A', hor: '#0C1328', horK: .55, halo: '#142044', haloW: 1.5, haloH: .03, sunDir: [0, -.2, -1], stars: 1, milky: .6, skyYaw: .8 + t * .01, time: t, fogNear: 40, fogDen: .0015, fogMax: .8 });
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
      G.add(grass({ area: [-30, 30, -40, 4], n: 6000, h: 1.2, ground: land.userData.height, clear: [[0, -3.5, 3.2], [-1.5, 3.8, 2.5]] }));
      const p = P.make('m1'); G.add(p.root);
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
      const hf = (x, z) => x > 0 ? Math.pow(x, 1.2) * .3 + .6 * fbm2(x * .2, z * .2) : -Math.pow(-x, 1.2) * .38 + .3 * fbm2(x * .05, z * .05);
      const land = terrain({ size: 2400, seg: 240, amp: .5, freq: .03, fog: .45, h: hf });
      G.add(land);
      for (let i = 0; i < 30; i++) { const x = 1.5 + hash(i) * 26, z = -8 + hash(i * 3) * 10, r = sph(.4 + hash(i * 7) * 1.1); r.scale.set(1.3, .85, 1); r.position.set(x, hf(x, z) - .05, z); G.add(r); }
      const valley = new THREE.Group();
      for (let i = 0; i < 90; i++) { const x = -22 - hash(i) * 70, z = -18 - hash(i * 2) * 70, y = hf(x, z); const b = box(.9, .7, .2, litMat(TOK.gold, 2 + hash(i * 5) * 2.5)); b.position.set(x, y + .8 + hash(i * 3) * 2.5, z); valley.add(b); }
      for (let i = 0; i < 7; i++) { const x = -30 - hash(i) * 50, z = -30 - hash(i * 4) * 50, g = glow('#FFB060', 30 + 20 * hash(i), .45); g.position.set(x, hf(x, z) + 5, z); valley.add(g); }
      for (let i = 0; i < 14; i++) { const u = i / 13, x = lerp(-1.5, -30, u), z = lerp(-1, -24, u * u), g = glow('#FFC070', .7, 1.5); g.position.set(x, hf(x, z) + .8, z); valley.add(g); }
      G.add(valley);
      const p = P.make('m3'); G.add(p.root);
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
      gcam(camera, s.land, [fx, 1.0, 10.5], [fx, h(Math.max(fx, 0), 0) + lerp(-.6, 1.5, smooth(seg(lt, 2.2, 5.2))), 0], 50);
    },
  });

  // ======================================================== S20 L16: the summit at sunrise
  SHOT({ id: 'S20', t0: LINE(16)[0], t1: LINE(17)[0], out: { kind: 'cross', d: 1.0 },
    build(G) {
      const hf = (x, z) => x < 0 ? Math.max(-6, 1.1 * x) : -.1 * x + .4 * fbm2(x * .3, z * .3);   // a ledge at x = 0, the summit to the right
      const land = terrain({ size: 6000, seg: 260, amp: .4, freq: .05, fog: .5, h: (x, z) => hf(x, z) - 1400 * (1 - Math.exp(-Math.max(0, Math.hypot(x, z) - 40) / 900)) });
      G.add(land);
      const p = P.make('m3'); G.add(p.root);
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
      P.at(s.p, [cx, h(cx, 0) + (lt < 2.0 ? lerp(-1.0, 0, smooth(seg(lt, .2, 1.9))) : 0), 0], PI / 2);
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
