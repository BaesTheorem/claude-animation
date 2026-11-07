// uplift/ch6_again.js: the outro (S26-S28). On the new world the opening happens again: hands strike a spark (as
// S03), a seed goes in, the band walks with its cattle (as S04) while a shelter rises (as S06); then the camera
// rises from the fire to the stars, where one small yellow star is home (as S01, reversed).
(() => {
  const { THREE, kf, seg, smooth, ease, easeIn, easeOut, lerp, hash, noise, fbm2, B, LINE, sky, skyMix, silMat, litMat, glow, setGlow,
    fire, sparks, terrain, grass, streak, box, cyl, cone, sph, rod, setRod, cam, gcam, TOK } = UP;
  const P = PEOPLE, PI = Math.PI;
  const v3 = a => new THREE.Vector3(...a);
  const WALK_V = 1.22;

  // the new world's sky: violet above, teal at the horizon, a small cold sun, two moons
  const ALIEN = { zen: '#2A1F55', hor: '#3FA3A0', horK: .42, halo: '#9AF0E0', haloW: 2.2, haloH: .1, sunCol: '#DDEBFF', sunGlow: 1.0, sunSize: .011,
    stars: .35, moon1Dir: [-.1, .1, -1], moon1Col: '#C9B8F0', moon1Size: .028, moon1Phase: .35, moon2Dir: [.25, .2, -1], moon2Col: '#9FE0D8', moon2Size: .013, moon2Phase: .6 };
  const ALIEN_NIGHT = { zen: '#0A0820', hor: '#1C2A48', horK: .5, halo: '#2C4A6A', haloW: 2, haloH: .08, stars: 1, milky: .9, sunDir: [.4, -.3, -1],
    moon1Dir: [-.5, .35, -1], moon1Col: '#B8A8E8', moon1Size: .028, moon1Phase: .55, moon2Dir: [.3, .55, -1], moon2Col: '#8FD8D0', moon2Size: .013, moon2Phase: .2 };

  // alien plants: tall stalks with a bulb and fronds, as silhouettes
  function plants(G, land, n, area, seed = 1, clear = []) {
    const [x0, x1, z0, z1] = area, h = land.userData.height;
    for (let i = 0; i < n; i++) {
      const x = lerp(x0, x1, hash(i * 1.7 + seed)), z = lerp(z0, z1, hash(i * 2.3 + seed));
      if (clear.some(([cx, cz, r]) => Math.hypot(x - cx, z - cz) < r)) continue;
      const H = 1.5 + hash(i * 3.1 + seed) * 4.5, g = new THREE.Group();
      const st = cyl(.04, .09, H); st.position.y = H / 2; g.add(st);
      const bulb = sph(.18 + hash(i * 5.3) * .35); bulb.scale.y = 1.6; bulb.position.y = H + .2; g.add(bulb);
      for (let j = 0; j < 4; j++) { const f = cone(.05, 1.2 + hash(i * 7 + j) * 1.2); f.position.set(0, H * (.35 + j * .12), 0); f.rotation.z = (j % 2 ? 1 : -1) * (.9 + hash(i + j) * .5); f.rotation.y = j * 1.3; g.add(f); }
      g.position.set(x, h(x, z), z); g.rotation.y = hash(i) * 6; G.add(g);
    }
  }
  // a planetary ring seen from the ground: a huge faint arc across the sky
  function ringArc(G) {
    const m = new THREE.MeshBasicMaterial({ color: new THREE.Color('#B8B0E0').multiplyScalar(.35), transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const r = new THREE.Mesh(new THREE.RingGeometry(2600, 2900, 128, 1, 0, PI), m);
    r.rotation.set(-.35, .2, .12); r.position.set(0, -900, -3000); G.add(r); return r;
  }
  // the knapper's strike (same as ch1's knap(): left hand holds the core, right hand strikes on the beats)
  function knap(p, t, hits, w = 1) {
    const root = p.root.position, yaw = p.root.rotation.y;
    const fw = v3([Math.sin(yaw), 0, Math.cos(yaw)]), side = v3([Math.cos(yaw), 0, -Math.sin(yaw)]);
    const pel = P.wpos(p.bones.pelvis), C = pel.clone().addScaledVector(fw, .36); C.y = pel.y + .2;
    let u = 1; for (let i = 0; i < hits.length; i++) if (t >= hits[i]) u = Math.min(1, (t - hits[i]) / ((hits[i + 1] ?? hits[i] + .7) - hits[i]));
    const lift = t < hits[0] ? smooth(seg(t, hits[0] - .6, hits[0] - .35)) * (1 - easeIn(seg(t, hits[0] - .3, hits[0]))) : u < .55 ? easeOut(seg(u, .05, .55)) : 1 - easeIn(seg(u, .72, 1));
    const strike = C.clone().addScaledVector(side, -.03); strike.y += .05;
    const raised = C.clone().addScaledVector(side, -.13).addScaledVector(fw, -.06); raised.y += .34;
    const hr = strike.clone().lerp(raised, t > hits[hits.length - 1] + .7 ? 1 : lift), hl = C.clone().addScaledVector(side, .05);
    P.reach(p, 'l', P.hand(p, 'l').lerp(hl, w).toArray(), root.clone().addScaledVector(side, .5).add(v3([0, .4, 0])).toArray());
    P.reach(p, 'r', P.hand(p, 'r').lerp(hr, w).toArray(), root.clone().addScaledVector(side, -.5).add(v3([0, .4, 0])).toArray());
    return { core: P.hand(p, 'l'), hammer: P.hand(p, 'r'), strike };
  }

  // ======================================================== S26 L21: again, the spark
  SHOT({ id: 'S26', t0: LINE(21)[0], t1: LINE(22)[0], out: { kind: 'cut' },
    build(G) {
      const land = terrain({ size: 3000, seg: 160, amp: 2.5, freq: .004, fog: .45, h: (x, z) => 30 * Math.exp(-Math.pow((z + 380) / 120, 2)) * (.7 + .5 * fbm2(x * .004, 1.3)) });
      G.add(land, grass({ area: [-10, 10, -10, 6], n: 1800, h: .35, ground: land.userData.height, clear: [[0, 0, 2.6], [-1.6, 3.4, 2.6], [.6, 2.6, 1.6]] }));
      plants(G, land, 60, [-60, 60, -80, -6], 3, [[0, 0, 9], [-1, 4, 8]]);
      ringArc(G);
      const band = { k: P.make('m2'), s1: P.make('w1'), s2: P.make('m3'), s3: P.make('girl'), sower: P.make('w2') };
      Object.values(band).forEach(p => G.add(p.root));
      const rock = sph(.34); rock.scale.set(1.25, .75, 1.05); rock.position.set(.13, land.userData.height(.13, .05) + .2, .05); G.add(rock);
      const stones = [sph(.045), sph(.035)]; stones.forEach(x => G.add(x));
      const f = fire({ scale: .75, seed: 5 }); G.add(f);
      const sp = sparks(26, 4); G.add(sp);
      const seed = sph(.02); G.add(seed);
      const hits = B.filter(b => b > LINE(21)[0] - .05 && b < LINE(21)[0] + 2.4);
      return { land, band, stones, f, sp, hits, seed };
    },
    frame(s, lt, dur, t, { camera, PX }) {
      sky({ ...ALIEN, time: t, sunDir: [.55, .02, -1], fogNear: 12, fogDen: .004, wind: .3 });
      const h = s.land.userData.height, b = s.band, KP = [.45, h(.45, .05), .05];
      P.at(b.k, KP, -PI / 2); P.clip(b.k, 'Sitting_Idle_Loop', t);
      const kn = knap(b.k, t, s.hits, 1 - smooth(seg(lt, 2.6, 3.3)));
      s.stones[0].position.copy(kn.core); s.stones[1].position.copy(kn.hammer);
      const pel = P.wpos(b.k.bones.pelvis), TP = [pel.x - .8, h(pel.x - .8, KP[2]) + .02, KP[2]];
      const kFire = kf(lt, [[0, 0], [2.3, 0], [2.7, .06], [3.1, .1], [3.5, .5], [4.8, 1]]);
      s.f.position.set(...TP); s.f.userData.update(t, kFire * .8, PX);
      s.sp.position.copy(kn.strike); s.sp.userData.update(t, s.hits, PX, .6);
      P.at(b.s1, [-1.4, h(-1.4, -1.0), -1.0], PI * .28); P.clip(b.s1, 'Crouch_Idle_Loop', t);
      P.at(b.s2, [-1.9, h(-1.9, .25), .25], PI * .5); P.clip(b.s2, 'Idle_FoldArms_Loop', t + .5);
      P.at(b.s3, [-.8, h(-.8, -1.6), -1.6], PI * .15); P.clip(b.s3, 'Idle_Loop', t + 1.1);
      // the sower presses a seed into the soil in the foreground (lt 5.0-7.0)
      const sx = -2.2, sz = 2.2; P.at(b.sower, [sx, h(sx, sz), sz], -PI * .35);
      P.clip(b.sower, lt > 4.6 ? 'Farm_PlantSeed' : 'Idle_Loop', lt > 4.6 ? lt - 4.6 : t, { loop: lt <= 4.6 });
      const hs = P.hand(b.sower, 'r'); s.seed.position.copy(hs); s.seed.visible = lt > 4.6;
      const pull = ease(seg(lt, 3.6, 6.0)), C = pel.clone().add(v3([-.36, .22, 0]));
      const look = C.clone().lerp(v3([-1.2, h(-1.2, .6) + .7, .6]), pull);
      const cp = C.clone().add(v3([0, -.05, 2.6])).lerp(v3([-.8, h(-.8, 5.4) + 1.15, 5.4]), pull);
      cam(camera, cp.toArray(), look.toArray(), lerp(15, 40, smooth(seg(lt, 3.6, 4.8))));
    },
  });

  // ======================================================== S27 L22: again, the walk; a shelter rises
  SHOT({ id: 'S27', t0: LINE(22)[0], t1: 176.51, out: { kind: 'cut' },
    build(G) {
      const land = terrain({ size: 3000, seg: 200, amp: 2.0, freq: .0035, fog: .4, h: (x, z) => 18 * Math.exp(-Math.pow((z + 420) / 120, 2)) });
      const clear = []; for (let x = -2; x <= 9; x += 1.5) clear.push([x, 1.2, 2.2]); for (let x = 2; x <= 10; x += 2) clear.push([x - 1.5, 4.5, 2.6]);
      G.add(land, grass({ area: [-6, 26, -3, 7], n: 2000, h: .2, ground: land.userData.height, clear }));
      plants(G, land, 50, [-20, 60, -70, -9], 7);
      ringArc(G);
      const band = ['m1', 'w2', 'm3', 'girl', 'w1'].map(n => P.make(n)); band.forEach(p => G.add(p.root));
      const herd = [P.beast('cow', 1.15), P.beast('bull', 1.2), P.beast('cow', 1.1)]; herd.forEach(b => G.add(b.root));
      const poles = []; for (let i = 0; i < 8; i++) { const r = rod(.04); poles.push(r); G.add(r); }
      const builders = [P.make('m2'), P.make('w1')]; builders.forEach(p => G.add(p.root));
      return { land, band, herd, poles, builders };
    },
    frame(s, lt, dur, t, { camera }) {
      const el = kf(lt, [[0, -.02], [2.5, .015], [6.3, .05]], x => x);
      sky({ ...ALIEN, time: t, sunDir: [.6, el, -1], sunSize: el > -.01 ? .011 : 0, fogNear: 20, fogDen: .004 });
      const h = s.land.userData.height;
      const X = [0, 1.4, -1.5, -2.6, -3.9], Z = [-3.4, -4.6, -4.0, -3.7, -5.1];
      s.band.forEach((p, i) => { const x = X[i] + WALK_V * lt, z = Z[i]; P.at(p, [x, h(x, z), z], PI / 2); P.clip(p, 'Walk_Loop', t + i * .37); });
      s.herd.forEach((b, i) => { const x = -3.5 - i * 2.6 + WALK_V * lt, z = -9.5 - i * 1.1; P.at(b, [x, h(x, z), z], PI / 2); P.clip(b, 'Walk', t + i * .5, { speed: .9 }); });
      // the shelter: a frame of poles rising on a low rise behind the walkers (as S06's hut)
      const [hx, hz] = [9, -16];
      s.poles.forEach((r, i) => {
        const a = i / 8 * PI * 2 + .2, bx = hx + Math.cos(a) * 2.2, bz = hz + Math.sin(a) * 2.2, up = easeOut(seg(lt, .4 + i * .32, 1.6 + i * .32));
        setRod(r, [bx, h(bx, bz), bz], [lerp(bx + Math.cos(a) * 4, hx + Math.cos(a) * .15, up), h(hx, hz) + lerp(.1, 4.2, up), lerp(bz + Math.sin(a) * 4, hz + Math.sin(a) * .15, up)]);
      });
      s.builders.forEach((p, i) => { const x = hx + (i ? -2.8 : 2.8), z = hz + 1.2; P.at(p, [x, h(x, z), z], i ? PI * .6 : -PI * .5); P.clip(p, 'Push_Loop', t + i * .4); });
      const xl = WALK_V * lt, up = ease(seg(lt, 1.8, 4.0));
      const lx = lerp(xl + .1, xl + 6, up), lz = lerp(-3.5, -30, up);
      gcam(camera, s.land, [lerp(xl - .9, xl - 1.8, up), lerp(.32, 1.6, up), lerp(.9, 6.2, up)], [lx, h(lx, lz) + lerp(.45, 2.6, up), lz], lerp(30, 38, up));
    },
  });

  // ======================================================== S28 look up: home is a small yellow star
  SHOT({ id: 'S28', t0: 176.51, t1: 181.0, out: { kind: 'cut' },
    build(G) {
      const land = terrain({ size: 3000, seg: 160, amp: 2.0, freq: .004, fog: .45, h: (x, z) => 22 * Math.exp(-Math.pow((z + 300) / 110, 2)) });
      G.add(land, grass({ area: [-12, 12, -12, 6], n: 2000, h: .35, ground: land.userData.height, clear: [[0, 0, 2.4], [0, 4, 2.6]] }));
      plants(G, land, 40, [-40, 40, -60, -8], 11);
      ringArc(G);
      const f = fire({ scale: .9, seed: 9 }); G.add(f);
      const shelter = []; for (let i = 0; i < 8; i++) { const r = rod(.04); shelter.push(r); G.add(r); }
      const ppl = [P.make('w1'), P.make('m1'), P.make('girl')]; ppl.forEach(p => G.add(p.root));
      const home = glow('#FFE08A', 4, 0); G.add(home);
      return { land, f, shelter, ppl, home };
    },
    frame(s, lt, dur, t, { camera, PX }) {
      sky({ ...ALIEN_NIGHT, time: t, skyYaw: 1.2 + t * .004, fogNear: 12, fogDen: .004 });
      const h = s.land.userData.height, y0 = h(0, 0);
      s.f.position.set(0, y0, 0); s.f.userData.update(t, 1, PX);
      const [hx, hz] = [-7, -11];
      s.shelter.forEach((r, i) => { const a = i / 8 * PI * 2 + .2, bx = hx + Math.cos(a) * 2.2, bz = hz + Math.sin(a) * 2.2; setRod(r, [bx, h(bx, bz), bz], [hx + Math.cos(a) * .15, h(hx, hz) + 4.2, hz + Math.sin(a) * .15]); });
      [[1.3, -.6, -PI * .4], [-1.2, -.9, PI * .35], [.4, -1.5, PI * .05]].forEach(([x, z, yaw], i) => { P.at(s.ppl[i], [x, h(x, z), z], yaw); P.clip(s.ppl[i], 'Crouch_Idle_Loop', t + i); });
      // the camera rises and tilts up from the fire to the stars; the home star sits high in the final frame
      const k = ease(seg(lt, 0, 3.6)), pitch = lerp(.02, 1.05, k);
      const cpos = v3([0, y0 + lerp(1.2, 3.4, k), lerp(4.6, 3.2, k)]);
      cam(camera, cpos.toArray(), [0, cpos.y + Math.sin(pitch) * 50 - (1 - k) * 1.2, cpos.z - Math.cos(pitch) * 50], 40);
      const hd = v3([.08, Math.sin(1.05 + .1), -Math.cos(1.05 + .1)]).normalize();
      s.home.position.copy(cpos).addScaledVector(hd, 800);
      setGlow(s.home, smooth(seg(lt, 1.2, 2.2)) * (2.2 + .5 * Math.sin(t * 5.3) * Math.sin(t * 2.1)), 9);
    },
  });
})();
