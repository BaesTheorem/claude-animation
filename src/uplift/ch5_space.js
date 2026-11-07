// uplift/ch5_space.js: verse 4 (S21-S25). The night Earth with the sunrise on its rim (the album cover), a light
// sail unfurling, keys and a launch, radio rings around the world, the ship leaving, the crossing to a new world.
// Earth textures: assets/tex/earth_lights_2048.png and earth_atmos_2048.jpg, from the three.js examples (no
// recorded source or licence; swap in NASA's Black Marble before publishing, see assets/tex/README.md).
// Units: the Earth's radius is 100.
(() => {
  const { THREE, kf, seg, smooth, ease, easeIn, easeOut, lerp, clamp, hash, noise, B, LINE, sky, silMat, litMat, glow, setGlow,
    box, cyl, sph, rod, setRod, cam, C, TOK, puffTex } = UP;
  const P = PEOPLE, PI = Math.PI, TAU = PI * 2;
  const v3 = a => new THREE.Vector3(...a);
  const RE = 100;
  const TEX = {};
  window.PRELOAD.push(loadTex('assets/tex/earth_lights_2048.png').then(t => { TEX.night = t; }));
  window.PRELOAD.push(loadTex('assets/tex/earth_atmos_2048.jpg').then(t => { TEX.day = t; }));

  // ---- the Earth: night lights, a lit crescent, faint moonlit land, radio rings; and an atmosphere shell
  const NR = 6;
  function earth() {
    const g = new THREE.Group();
    const u = { tNight: { value: TEX.night }, tDay: { value: TEX.day }, uSun: { value: v3([.5, .5, -.7]).normalize() }, uK: { value: 2.4 }, uLand: { value: .035 },
      uRingC: { value: Array.from({ length: NR }, () => new THREE.Vector3(0, 1, 0)) }, uRingR: { value: new Array(NR).fill(-1) }, uRingK: { value: 0 } };
    const m = new THREE.ShaderMaterial({ uniforms: u,
      vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vW; void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: `uniform sampler2D tNight, tDay; uniform vec3 uSun; uniform float uK, uLand, uRingK; uniform vec3 uRingC[${NR}]; uniform float uRingR[${NR}];
        varying vec2 vUv; varying vec3 vN; varying vec3 vW;
        void main(){
          vec3 N = normalize(vN), V = normalize(cameraPosition - vW);
          float ndl = dot(N, uSun);
          vec3 day = texture2D(tDay, vUv).rgb, night = texture2D(tNight, vUv).rgb;
          float lum = dot(night, vec3(.33));
          vec3 lights = vec3(1., .74, .38) * pow(lum, 1.7) * uK;
          vec3 c = day * smoothstep(.0, .45, ndl) * .9;
          c += lights * (1. - smoothstep(-.12, .06, ndl));
          c += day * vec3(.45, .6, 1.) * uLand * (1. - smoothstep(-.2, .1, ndl));
          float fr = pow(1. - max(dot(N, V), 0.), 2.6);
          float lit = smoothstep(-.35, .25, ndl);
          c += mix(vec3(.18, .38, 1.), vec3(1., .55, .28), smoothstep(.05, -.25, ndl) * lit) * fr * (.25 + 1.8 * lit);
          for (int i = 0; i < ${NR}; i++) { if (uRingR[i] < 0.) continue; float a = acos(clamp(dot(N, uRingC[i]), -1., 1.));
            c += vec3(.45, .8, 1.) * exp(-pow((a - uRingR[i]) / .009, 2.)) * uRingK * (1. - smoothstep(.4, 1.2, uRingR[i])) * 1.3; }
          gl_FragColor = vec4(c, 1.);
        }` });
    const body = new THREE.Mesh(new THREE.SphereGeometry(RE, 128, 64), m); g.add(body);
    const am = new THREE.ShaderMaterial({ uniforms: { uSun: u.uSun }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
      vertexShader: 'varying vec3 vN; varying vec3 vW; void main(){ vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: `uniform vec3 uSun; varying vec3 vN; varying vec3 vW;
        void main(){ vec3 N = normalize(vN), V = normalize(cameraPosition - vW); float f = pow(max(1. + dot(N, V) * 1.0, 0.), 1.0);
          float rim = pow(clamp(dot(-N, V), 0., 1.), 0.); float lit = smoothstep(-.4, .35, dot(N, uSun));
          float edge = pow(1. - abs(dot(N, V)), 7.);
          vec3 c = mix(vec3(.15, .35, 1.), vec3(1., .62, .32), smoothstep(.1, -.3, dot(N, uSun)) * lit) * edge * (.15 + 2.2 * lit);
          gl_FragColor = vec4(c, 1.); }` });
    const atmo = new THREE.Mesh(new THREE.SphereGeometry(RE * 1.035, 96, 48), am); g.add(atmo);
    g.userData = { u, body };
    return g;
  }
  // the point on the Earth's limb (as seen from the camera) nearest the sun: where the sunrise flares
  function limbPoint(camPos, sunDir) {
    const c = camPos.clone(), d = c.length(), r = RE * 1.01;
    const toS = sunDir.clone().sub(c.clone().normalize().multiplyScalar(sunDir.dot(c.clone().normalize()))).normalize();
    const back = c.clone().normalize().multiplyScalar(r * r / d), rad = r * Math.sqrt(1 - (r / d) * (r / d));
    return back.add(toS.multiplyScalar(rad));
  }
  // a square light sail: four triangles and two booms, unfurling from the hub (k 0..1); glint (0..1) lights it
  function sail(size = 1) {
    const g = new THREE.Group(), q = [];
    const dark = silMat({ side: THREE.DoubleSide, fog: 0 });
    for (let i = 0; i < 4; i++) {
      const tri = new THREE.BufferGeometry(); tri.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3));
      const m = new THREE.Mesh(tri, new THREE.MeshBasicMaterial({ color: C('#0C0E16'), side: THREE.DoubleSide })); m.rotation.z = i * PI / 2 + PI / 4 - PI / 4; q.push(m); g.add(m);
    }
    const b1 = rod(.012 * size, dark), b2 = rod(.012 * size, dark); g.add(b1, b2);
    const hub = glow('#FFF2D8', .5 * size, 0); g.add(hub);
    g.userData.set = (k, glint) => {
      q.forEach(m => { m.scale.setScalar(Math.max(1e-3, size * k * 1.42)); m.material.color.set('#0C0E16').lerp(C('#FFE6B0').multiplyScalar(1.0), glint); });
      const L = 1.42 * size * Math.max(k, 1e-3); setRod(b1, [-L, 0, 0], [L, 0, 0]); setRod(b2, [0, -L, 0], [0, L, 0]);
      setGlow(hub, 1.6 * glint, size * (.4 + 1.2 * glint));
    };
    return g;
  }

  // ======================================================== S21 L17: the lit Earth, the sail
  SHOT({ id: 'S21', t0: LINE(17)[0], t1: LINE(18)[0], out: { kind: 'cut' },
    build(G) {
      const e = earth(); G.add(e);
      const flare = glow('#FFE4B8', 60, 0), streakS = glow('#FFD7A0', 1, 0); G.add(flare, streakS);
      const sl = sail(1.2); G.add(sl);
      return { e, flare, streakS, sl };
    },
    frame(s, lt, dur, t, { camera }) {
      sky({ zen: '#000105', hor: '#000105', stars: .9, milky: .35, skyYaw: 2.1, time: t, sunDir: [.5, .45, -.75] });
      const sun = v3([.42, .36, -.83]).normalize();
      s.e.userData.u.uSun.value.copy(sun);
      s.e.rotation.y = -.25 + lt * .004; s.e.rotation.x = .12;
      const D = 168, el = .62, cp = v3([0, Math.sin(el) * D, Math.cos(el) * D]).applyAxisAngle(v3([0, 1, 0]), -.08 - lt * .01);
      const look = v3([12, 58, 0]);
      cam(camera, cp.toArray(), look.toArray(), 42);
      const lp = limbPoint(cp, sun), rise = smooth(seg(lt, .2, 2.5));
      s.flare.position.copy(lp); setGlow(s.flare, (.9 + .9 * rise) * (1 + .05 * noise(t * 3)), 18 + 22 * rise);
      s.streakS.position.copy(lp); setGlow(s.streakS, .9 * rise); s.streakS.scale.set(160 * (.6 + .4 * rise), 2.2, 1);
      // the sail: in the foreground, lower right, unfurls (1.0-3.0) and catches the sun (3.4-4.6)
      const fwd = look.clone().sub(cp).normalize(), right = fwd.clone().cross(v3([0, 1, 0])).normalize(), up = right.clone().cross(fwd).normalize();
      s.sl.position.copy(cp).addScaledVector(fwd, 9).addScaledVector(right, 2.6).addScaledVector(up, -1.2);
      s.sl.lookAt(cp); s.sl.rotateZ(.3 + lt * .05);
      const k = easeOut(seg(lt, 1.0, 3.0)), gl = smooth(seg(lt, 3.3, 3.9)) * (1 - .6 * smooth(seg(lt, 4.3, 5.1)));
      s.sl.userData.set(k, gl);
    },
  });

  // ======================================================== S22 L18: keys and a launch
  SHOT({ id: 'S22', t0: LINE(18)[0], t1: LINE(19)[0], out: { kind: 'cut' },
    build(G) {
      const m = silMat({ fog: 0 }), room = new THREE.Group();
      // the room: floor, back wall with a wide window (left), side wall, desk, chair, monitor
      const put = (o, x, y, z) => { o.position.set(x, y, z); room.add(o); return o; };
      put(box(12, .1, 12, m), 0, -.05, 0);
      put(box(1.6, 3.2, .2, m), -5.2, 1.6, -3);   put(box(5.2, .9, .2, m), -1.8, .45, -3);   put(box(5.2, .6, .2, m), -1.8, 2.9, -3);
      put(box(6, 3.2, .2, m), 3.8, 1.6, -3);      put(box(.08, 1.7, .08, m), -1.8, 1.75, -3);
      put(box(1.8, .06, .8, m), 1.6, .76, -1.2);  put(box(.06, .76, .06, m), .8, .38, -1.5); put(box(.06, .76, .06, m), 2.4, .38, -1.5);
      put(box(.62, .38, .03, litMat('#8FB4F0', 1.05)), 1.6, 1.12, -1.48); put(box(.66, .42, .04, m), 1.6, 1.12, -1.51); put(box(.06, .2, .06, m), 1.6, .88, -1.5);
      put(box(.45, .02, .16, m), 1.6, .8, -1.05);
      put(box(.5, .06, .5, m), 1.6, .46, -.35); put(box(.5, .6, .06, m), 1.6, .76, -.1);
      const screenGlow = glow('#9CC4FF', .9, .12); screenGlow.position.set(1.6, 1.12, -1.4); room.add(screenGlow);
      G.add(room);
      // outside: a city at night, a launch tower far out on the left, the rocket
      const city = new THREE.Group();
      for (let i = 0; i < 70; i++) { const x = -60 + hash(i) * 120, z = -40 - hash(i * 3) * 120, w = 3 + hash(i * 5) * 6, h = 4 + Math.pow(hash(i * 7), 2) * 34;
        const b = box(w, h, w, silMat()); b.position.set(x, h / 2 - 48, z); city.add(b);
        for (let j = 0; j < 4; j++) { const win = box(.5, .6, .05, litMat(TOK.gold, 2 + hash(i * 9 + j) * 2)); win.position.set(x + (hash(i * 11 + j) - .5) * w * .8, -48 + hash(i * 13 + j) * h * .9, z + w / 2 + .03); city.add(win); } }
      G.add(city);
      const tower = box(6, 50, 6, silMat()); tower.position.set(-1150, 17, -1500); G.add(tower);
      const rocket = new THREE.Group(); rocket.add(cyl(1.6, 1.8, 20, silMat()), Object.assign(new THREE.Mesh(new THREE.ConeGeometry(1.6, 5, 12), silMat()), {})); rocket.children[1].position.y = 12.5;
      const flame = glow('#FFD9A0', 30, 0); G.add(rocket, flame);
      const plume = []; for (let i = 0; i < 26; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, color: C('#A0705A'), transparent: true, depthWrite: false, opacity: 0, fog: false })); plume.push(sp); G.add(sp); }
      const p = P.make('w2'); G.add(p.root);
      return { p, rocket, flame, plume };
    },
    frame(s, lt, dur, t, { camera }) {
      sky({ zen: '#03050E', hor: '#16203C', horK: .5, halo: '#2A3A70', haloW: 2, haloH: .06, sunDir: [-.6, -.2, -1], stars: .5, time: t, fogNear: 60, fogDen: .002 });
      // the typist: seated, hands on the keys (IK with a little typing jitter), a click on the beat at lt ~1.9
      P.at(s.p, [1.6, 0, -.32], PI); P.clip(s.p, 'Sitting_Idle_Loop', t);
      const click = UP.pulse(t, 14) * (lt > 1.6 && lt < 2.4 ? 1 : 0);
      const ty = (k, i) => .02 * Math.max(0, noise(t * 9 + i)) * (lt < 1.6 ? 1 : 0);
      P.reach(s.p, 'l', [1.48, .82 + ty(0, 1), -1.03], [1.2, .9, -.5]);
      P.reach(s.p, 'r', [1.74, .82 + ty(0, 2) - .015 * click, -1.03], [2.0, .9, -.5]);
      const turn = smooth(seg(lt, 2.9, 3.6));
      P.turn(s.p, 'Head', [0, .9 * turn, 0]); P.turn(s.p, 'spine_03', [0, .25 * turn, 0]);
      // the launch: lifts off at lt 2.3, far out through the window
      const L = Math.max(0, lt - 2.3), ry = -8 + 4.9 * L * L * 1.4;
      const RX = -1150, RZ = -1500, ry2 = -8 + 4.9 * L * L * 6;
      s.rocket.position.set(RX, ry2 + 10, RZ); s.rocket.scale.setScalar(2.2); s.flame.position.set(RX, ry2 - 4, RZ); setGlow(s.flame, lt > 2.3 ? 2.6 * (.85 + .15 * noise(t * 20)) : 0, 60 + 30 * Math.min(1, L));
      s.plume.forEach((sp, i) => { const a = i / s.plume.length, tb = 2.3 + a * Math.max(.01, L), y = -8 + 4.9 * Math.pow(tb - 2.3, 2) * 6;
        sp.position.set(RX + noise(i * 1.3) * 8 * (L - (tb - 2.3)), y, RZ); sp.scale.setScalar(30 + 50 * (L - (tb - 2.3))); sp.material.opacity = lt > 2.3 ? .5 * (1 - a * .3) : 0; });
      const k = smooth(seg(lt, 0, 5.2));
      cam(camera, [lerp(3.4, 3.1, k), 1.25, lerp(1.6, 1.3, k)], [lerp(1.4, -.6, smooth(seg(lt, 2.2, 3.6))), lerp(1.05, 1.5, smooth(seg(lt, 2.2, 3.6))), -2.2], 46);
    },
  });

  // ======================================================== S23 L19: voices around the world
  const RING_AT = [[40.7, -74], [51.5, -.1], [35.7, 139.7], [19.4, -99.1], [-23.5, -46.6], [28.6, 77.2]];
  const ll = (lat, lon) => { const p = lat * PI / 180, l = lon * PI / 180; return v3([-Math.cos(p) * Math.cos(l + PI), Math.sin(p), Math.cos(p) * Math.sin(l + PI)]); };
  SHOT({ id: 'S23', t0: LINE(19)[0], t1: LINE(20)[0], out: { kind: 'cut' },
    build(G) {
      const e = earth(); G.add(e);
      const sats = [];
      for (let i = 0; i < 9; i++) { const g = new THREE.Group(); g.add(box(1.2, 1.2, 1.2, silMat({ fog: 0 })), Object.assign(box(4.5, .1, 1.4, silMat({ fog: 0 })), {})); const bl = glow('#BFE6FF', 3, 0); g.add(bl); g.userData.bl = bl; sats.push(g); G.add(g); }
      return { e, sats };
    },
    frame(s, lt, dur, t, { camera }) {
      sky({ zen: '#000105', hor: '#000105', stars: .9, milky: .35, skyYaw: 2.6, time: t });
      const sun = v3([-.7, .2, -.68]).normalize(); s.e.userData.u.uSun.value.copy(sun);
      s.e.rotation.y = .9 + lt * .01; s.e.updateMatrixWorld(true);
      const u = s.e.userData.u, R = new THREE.Matrix3().setFromMatrix4(s.e.matrixWorld);
      RING_AT.forEach(([la, lo], i) => { const c = ll(la, lo).applyMatrix3(R).normalize(); u.uRingC.value[i].copy(c); const t0 = .4 + i * .35; u.uRingR.value[i] = lt > t0 ? (lt - t0) * .42 : -1; });
      u.uRingK.value = 1;
      s.sats.forEach((g, i) => {
        const a = i / 9 * TAU + lt * .05, incl = .4 + hash(i) * .8, r = RE * (1.12 + hash(i * 3) * .1);
        const p = v3([Math.cos(a) * r, Math.sin(a) * Math.sin(incl) * r, Math.sin(a) * Math.cos(incl) * r]); g.position.copy(p); g.lookAt(0, 0, 0);
        // blink when a ring passes under the satellite
        let k = 0; const n = p.clone().normalize();
        RING_AT.forEach((_, j) => { const rr = u.uRingR.value[j]; if (rr < 0) return; const ang = Math.acos(clamp(n.dot(u.uRingC.value[j]), -1, 1)); k = Math.max(k, Math.exp(-Math.pow((ang - rr) / .05, 2))); });
        setGlow(g.userData.bl, 2.4 * k + .15, 6 + 8 * k);
      });
      const D = 245, cp = v3([0, 70, D]).applyAxisAngle(v3([0, 1, 0]), .1 - lt * .02);
      cam(camera, cp.toArray(), [0, 8, 0], 40);
    },
  });

  // ======================================================== S24 L20: the ship leaves
  SHOT({ id: 'S24', t0: LINE(20)[0], t1: 158.10, out: { kind: 'cut' },
    build(G) {
      const e = earth(); G.add(e);
      const ship = new THREE.Group(), hull = cyl(.25, .35, 2.2, silMat({ fog: 0 })); hull.rotation.z = PI / 2; ship.add(hull);
      const sl = sail(5); sl.rotation.y = PI / 2; sl.position.x = 1.8; ship.add(sl);
      const lines = []; for (let i = 0; i < 4; i++) { const r = rod(.015, silMat({ fog: 0 })); lines.push(r); ship.add(r); }
      G.add(ship);
      const star = glow('#FFF0D8', 14, 0); G.add(star);
      return { e, ship, sl, lines, star };
    },
    frame(s, lt, dur, t, { camera }) {
      sky({ zen: '#000105', hor: '#000105', stars: 1, milky: .5, skyYaw: 3.0, time: t });
      const sun = v3([.3, .25, .92]).normalize(); s.e.userData.u.uSun.value.copy(sun); s.e.rotation.y = 2.2;
      // the ship moves +x (screen right) away from the Earth on the left, accelerating
      const go = 3 * lt + 9 * lt * lt, dir = v3([.78, .06, -.62]).normalize();
      const sp = v3([118, 56, 372]).addScaledVector(dir, go); s.ship.position.copy(sp); s.ship.lookAt(sp.clone().add(dir)); s.ship.rotateY(-PI / 2);
      const x = sp.x;
      const fill = smooth(seg(lt, .6, 2.0));
      s.sl.userData.set(1, fill * .85);
      const sc = 5;
      [[0, sc], [0, -sc], [sc, 0], [-sc, 0]].forEach(([y, z], i) => setRod(s.lines[i], [-.9, 0, 0], [1.8, y, z]));
      s.star.position.set(1300, 150, -560); setGlow(s.star, 2 + 1.5 * smooth(seg(lt, 1, 5)), 26);
      cam(camera, [70 + lt * 4, 62, 418 + lt * 6], [lerp(70, 160, smooth(seg(lt, .5, 5))), 48, 250], 46);
    },
  });

  // ======================================================== S25 the crossing: stars stream past, a new world
  SHOT({ id: 'S25', t0: 158.10, t1: LINE(21)[0], out: { kind: 'flash', d: 1.4, col: '#CFE0FF' },
    build(G) {
      // streaking stars: segments whose length follows the speed
      const N = 1400, pos = new Float32Array(N * 6), g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const st = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: C('#D8E4FF').multiplyScalar(1.6), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
      st.frustumCulled = false; G.add(st);
      // the new world: violet and teal bands, a ring, two moons
      const pm = new THREE.ShaderMaterial({ uniforms: { uSun: { value: v3([.6, .3, .74]).normalize() }, uT: { value: 0 } },
        vertexShader: 'varying vec3 vN; varying vec3 vP; varying vec3 vW; void main(){ vN = normalize(mat3(modelMatrix) * normal); vP = position; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
        fragmentShader: UP.SKY_GLSL + `uniform vec3 uSun; uniform float uT; varying vec3 vN; varying vec3 vP; varying vec3 vW;
          void main(){ vec3 N = normalize(vN), V = normalize(cameraPosition - vW); vec3 p = normalize(vP);
            float band = ufbm(vec3(p.y * 9., p.x * .8 + uT * .02, p.z * .8)); vec3 base = mix(vec3(.22, .12, .42), vec3(.1, .48, .52), smoothstep(.35, .65, band));
            base = mix(base, vec3(.78, .72, .95), smoothstep(.62, .8, ufbm(p * 5. + 7.)) * .5);
            float ndl = max(dot(N, uSun), 0.); vec3 c = base * (.04 + 1.1 * ndl);
            c += vec3(.4, .7, 1.) * pow(1. - max(dot(N, V), 0.), 3.) * (.2 + 1.4 * ndl);
            gl_FragColor = vec4(c, 1.); }` });
      const planet = new THREE.Mesh(new THREE.SphereGeometry(30, 96, 48), pm); G.add(planet);
      const rg = new THREE.RingGeometry(38, 62, 128, 1), rm = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide,
        vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
        fragmentShader: 'varying vec3 vP; void main(){ float r = length(vP.xy); float b = .5 + .5 * sin(r * 1.7) * sin(r * .43); float a = smoothstep(38., 41., r) * smoothstep(62., 58., r) * (.35 + .5 * b); gl_FragColor = vec4(vec3(.82, .78, .95) * 1.2, a * .8); }' });
      const ring = new THREE.Mesh(rg, rm); ring.rotation.x = PI / 2 - .32; planet.add(ring);
      const moons = [sph(4, new THREE.MeshBasicMaterial({ color: C('#9A8CB8') })), sph(2.4, new THREE.MeshBasicMaterial({ color: C('#7FB0B8') }))]; moons.forEach(m => G.add(m));
      const newSun = glow('#E8F2FF', 30, 0); G.add(newSun);
      return { st, pos, planet, pm, moons, newSun };
    },
    frame(s, lt, dur, t, { camera, PX }) {
      sky({ zen: '#010208', hor: '#020312', stars: lerp(.3, 1, smooth(seg(lt, 0, 2))), milky: .3, skyYaw: 3.5 + lt * .08, time: t });
      // stars stream toward the camera fast at first, then slow as the new system nears
      const v = lerp(900, 40, smooth(seg(lt, 0, 2.6)));
      for (let i = 0; i < 1400; i++) {
        const x = (hash(i * 1.3) - .5) * 600, y = (hash(i * 2.7) - .5) * 400, L = 3000, z0 = -hash(i * 4.1) * L;
        const z = ((z0 + lt * v) % L + L) % L - L, len = Math.min(400, v * .06);
        s.pos.set([x, y, z, x, y, z - len], i * 6);
      }
      s.st.geometry.attributes.position.needsUpdate = true; s.st.material.opacity = 1 - smooth(seg(lt, 2.0, 3.0));
      // the new system grows ahead; the camera falls toward the planet
      const near = easeIn(seg(lt, 1.2, 5.13));
      const pd = lerp(1400, 70, near);
      s.planet.position.set(18, -6, -pd); s.pm.uniforms.uT.value = t;
      s.moons[0].position.set(18 + 90, 30, -pd - 60); s.moons[1].position.set(18 - 70, 18, -pd + 30);
      s.newSun.position.set(400, 260, -pd - 900); setGlow(s.newSun, 1.5 + 2.5 * smooth(seg(lt, .5, 2.2)), 60);
      cam(camera, [0, 0, 0], [lerp(0, 14, near), lerp(0, -10, near), -100], lerp(48, 56, near));
    },
  });
})();
