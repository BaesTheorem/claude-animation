// uplift/ch1_stone.js: intro and verse 1 (S01-S06). The longest night, the first fire, the herd, the narrow
// margin, the first huts at dawn. See STORYBOARD.md for the reads.
(() => {
  const { THREE, kf, seg, smooth, ease, easeIn, easeOut, lerp, hash, fbm2, B, LINE, sky, skyMix, fire, sparks,
    terrain, grass, water, streak, sph, rod, setRod, cam, gcam } = UP;
  const P = PEOPLE, PI = Math.PI;
  const v3 = a => new THREE.Vector3(...a);

  // ---- sky presets (DESIGN.md colour script)
  const NIGHT = { zen: '#03050F', hor: '#1B2550', horK: .5, halo: '#33459A', haloW: 2.5, haloH: .1, stars: 1, milky: .8, sunDir: [-.35, -.22, -1] };
  const COLD = { zen: '#04070F', hor: '#18213F', horK: .5, halo: '#22305E', haloW: 2.5, haloH: .1, stars: .75, milky: .5, sunDir: [.3, -.25, -1],
    moon1Dir: [-.55, .1, -1], moon1Col: '#6E7894', moon1Size: .010, moon1Phase: .62 };
  const PREDAWN = { zen: '#1B1540', hor: '#7E4467', horK: .32, halo: '#B85A6E', haloW: 2.2, haloH: .09, stars: .22, sunDir: [.55, -.09, -1] };
  const DAWN = { zen: '#34467A', hor: '#FFB06A', horK: .38, halo: '#FF8A40', haloW: 2.5, haloH: .12, stars: 0, sunCol: '#FFD9A8', sunGlow: 1.6, sunSize: .018 };
  const WALK_V = 1.22;

  // The knapper's strike: the left hand holds the core in front of the chest, the right hand brings the hammerstone
  // down onto it on each beat in `hits`, and rises between beats. w (0..1) fades the IK in over the clip's own hands.
  function knap(p, t, hits, w = 1) {
    const root = p.root.position, yaw = p.root.rotation.y;
    const fw = v3([Math.sin(yaw), 0, Math.cos(yaw)]), side = v3([Math.cos(yaw), 0, -Math.sin(yaw)]);   // side = the model's +x
    const pel = P.wpos(p.bones.pelvis), C = pel.clone().addScaledVector(fw, .36); C.y = pel.y + .2;
    let u = 1;                                   // phase in the current beat interval: 0 = impact
    for (let i = 0; i < hits.length; i++) if (t >= hits[i]) u = Math.min(1, (t - hits[i]) / ((hits[i + 1] ?? hits[i] + .7) - hits[i]));
    const lift = t < hits[0] ? smooth(seg(t, hits[0] - .6, hits[0] - .35)) * (1 - easeIn(seg(t, hits[0] - .3, hits[0])))
      : u < .55 ? easeOut(seg(u, .05, .55)) : 1 - easeIn(seg(u, .72, 1));
    const strike = C.clone().addScaledVector(side, -.03); strike.y += .05;
    const raised = C.clone().addScaledVector(side, -.13).addScaledVector(fw, -.06); raised.y += .34;
    const hr = strike.clone().lerp(raised, t > hits[hits.length - 1] + .7 ? 1 : lift);
    const hl = C.clone().addScaledVector(side, .05);
    const nl = P.hand(p, 'l'), nr = P.hand(p, 'r');
    P.reach(p, 'l', nl.lerp(hl, w).toArray(), root.clone().addScaledVector(side, .5).add(v3([0, .4, 0])).toArray());
    P.reach(p, 'r', nr.lerp(hr, w).toArray(), root.clone().addScaledVector(side, -.5).add(v3([0, .4, 0])).toArray());
    return { core: P.hand(p, 'l'), hammer: P.hand(p, 'r'), strike };
  }

  // ======================================================== S01 the longest night
  SHOT({ id: 'S01', t0: 0, t1: 12.50, out: { kind: 'cut' },
    build(G) {
      const rz = -190;
      const land = terrain({ size: 3000, seg: 220, amp: 2.5, freq: .004, h: (x, z) => 21 * Math.exp(-Math.pow((z - rz) / 60, 2)) * (.85 + .3 * fbm2(x * .006, 2.1)) });
      G.add(land);
      const herd = [];
      for (let i = 0; i < 9; i++) { const b = P.beast(i % 3 ? 'bull' : 'cow', 1.25); herd.push(b); G.add(b.root); }
      return { land, herd, rz };
    },
    frame(s, lt, dur, t, { camera }) {
      sky({ ...NIGHT, time: t, skyYaw: .3 + t * .006, fogNear: 30, fogDen: .0022 });
      s.herd.forEach((b, i) => {
        const x = -62 + i * 8.5 + (hash(i) - .5) * 4 + 1.1 * t, z = s.rz + (hash(i * 3) - .5) * 5;
        P.at(b, [x, s.land.userData.height(x, z) - .1, z], PI / 2);
        P.clip(b, i % 4 === 3 ? 'Idle_Headlow' : 'Walk', t + hash(i) * 3);
      });
      const pitch = lerp(1.22, Math.atan2(12, 190), ease(seg(lt, 1.0, 10.4)));
      const fov = lerp(58, 30, ease(seg(lt, 2.5, 11.2))), y0 = s.land.userData.height(0, 0) + 1.7;
      cam(camera, [0, y0, 0], [0, y0 + Math.sin(pitch) * 100, -Math.cos(pitch) * 100], fov);
    },
  });

  // ======================================================== S02 huddled in the dark
  SHOT({ id: 'S02', t0: 12.50, t1: LINE(1)[0], out: { kind: 'cut' },
    build(G) {
      const land = terrain({ size: 2400, seg: 180, amp: 1.2, freq: .005, h: (x, z) => 16 * Math.exp(-Math.pow((z + 230) / 70, 2)) });
      G.add(land, grass({ area: [-14, 14, -16, 5], n: 5200, h: .6, ground: land.userData.height, clear: [[2.4, 3.6, 2.6], [2.1, -.6, 2.4], [1.8, -4.8, 2.1], [-.4, -7.2, 2.4], [2.0, -6.1, 1.2]] }));
      [[-6.2, -14.5, 1.3], [5.9, -16.4, 1.0], [8.5, -19, 1.6]].forEach(([x, z, r]) => { const b = sph(r); b.scale.set(1.3, .7, 1); b.position.set(x, land.userData.height(x, z), z); G.add(b); });
      const band = { k: P.make('m1'), w1: P.make('w1'), c: P.make('child'), m2: P.make('m2'), w2: P.make('w2') };
      Object.values(band).forEach(p => G.add(p.root));
      const stones = [sph(.045), sph(.035)]; stones.forEach(x => G.add(x));
      const rock = sph(.34); rock.scale.set(1.25, .75, 1.05); G.add(rock);
      const snow = streak({ n: 900, box: [40, 16, 30], dir: [4, -1.2, .5], size: 9, col: '#C8D6F2' }); snow.position.set(0, 3, -4); G.add(snow);
      return { land, band, stones, rock, snow };
    },
    frame(s, lt, dur, t, { camera, PX }) {
      sky({ ...COLD, time: t, skyYaw: .3 + t * .006, fogNear: 12, fogDen: .006, wind: .55 });
      const h = s.land.userData.height, b = s.band;
      P.at(b.w1, [-.7, h(-.7, -7.2), -7.2], PI * .45); P.clip(b.w1, 'Crouch_Idle_Loop', t);
      P.at(b.c, [-.2, h(-.2, -7.6), -7.6], PI * .7); P.clip(b.c, 'Crouch_Idle_Loop', t + 1.3);
      P.at(b.m2, [-1.45, h(-1.45, -6.6), -6.6], PI * .62); P.clip(b.m2, 'Crouch_Idle_Loop', t + .7);
      P.at(b.w2, [.1, h(.1, -8.1), -8.1], PI * 1.05); P.clip(b.w2, 'Fixing_Kneeling', t + 2.1, { speed: .3 });
      // the knapper: crouched at the edge of the group, stands (4-5), takes the stones (5-6.8), walks to a rock
      // (6.8-8.6), turns, sits (9-10.4) and lifts the stones into the strike pose (as S03 opens)
      const x0 = 1.0, x1 = 2.45, kz = -6.4, wk = ease(seg(lt, 6.8, 8.6)), kx = lerp(x0, x1, wk);
      const yaw = lt < 8.5 ? (lt < 6.8 ? -PI / 2 : PI / 2) : lerp(PI / 2, 3 * PI / 2, smooth(seg(lt, 8.5, 9.1)));
      P.at(b.k, [kx, h(kx, kz), kz], yaw);
      if (lt < 4) P.clip(b.k, 'Crouch_Idle_Loop', t);
      else if (lt < 5.0) P.blend(b.k, 'Crouch_Idle_Loop', t, 'Idle_Loop', lt, smooth(seg(lt, 4, 4.9)));
      else if (lt < 6.8) P.blend(b.k, 'Idle_Loop', lt, 'PickUp_Table', lt - 5.0, smooth(seg(lt, 5.0, 5.3)) * (1 - smooth(seg(lt, 6.4, 6.8))), { b: { loop: false } });
      else if (lt < 9.0) P.blend(b.k, 'Idle_Loop', lt, 'Walk_Loop', lt, smooth(seg(lt, 6.8, 7.1)) * (1 - smooth(seg(lt, 8.4, 8.9))));
      else if (lt < 10.4) P.clip(b.k, 'Sitting_Enter', lt - 9.0, { loop: false });
      else P.blend(b.k, 'Sitting_Enter', 2, 'Sitting_Idle_Loop', t, smooth(seg(lt, 10.4, 10.8)), { a: { loop: false } });
      const pel = P.wpos(b.k.bones.pelvis);
      s.rock.position.set(x1 - .32, h(x1, kz) + .2, kz);
      const hold = smooth(seg(lt, 10.4, 11.6)), kn = knap(b.k, t, [LINE(1)[0] + .07], hold);
      const got = lt > 6.2 ? 1 : 0;
      s.stones[0].position.copy(kn.core); s.stones[1].position.copy(kn.hammer); s.stones.forEach(x => { x.visible = !!got; });
      s.snow.userData.update(t, .35, PX);
      const hands = kn.core.clone().lerp(kn.hammer, .5);
      const k = ease(seg(lt, .3, 11.8));
      const look = v3([.3, h(.3, -7.2) + .95, -7.2]).lerp(hands.lerp(pel, .3), ease(seg(lt, 5.5, 11.8)));
      gcam(camera, s.land, [lerp(2.0, 2.25, k), lerp(.42, .62, k), lerp(1.4, -3.3, k)], look.toArray(), lerp(36, 30, k));
    },
  });

  // ======================================================== S03 L1: first light
  SHOT({ id: 'S03', t0: LINE(1)[0], t1: LINE(2)[0], out: { kind: 'cross', d: 1.0 },
    build(G) {
      const land = terrain({ size: 2000, seg: 120, amp: 1.0, freq: .006, h: (x, z) => 14 * Math.exp(-Math.pow((z + 260) / 80, 2)) });
      G.add(land, grass({ area: [-10, 10, -10, 6], n: 2600, h: .5, ground: land.userData.height, clear: [[0, 0, 2.3], [.3, 1.4, 1.4], [-1.6, 3.4, 2.6]] }));
      const band = { k: P.make('m1'), w1: P.make('w1'), c: P.make('child'), m2: P.make('m2'), w2: P.make('w2') };
      Object.values(band).forEach(p => G.add(p.root));
      [[-1.3, -.9], [-.55, -1.45], [.13, .05]].forEach(([x, z]) => { const r = sph(.34); r.scale.set(1.25, .75, 1.05); r.position.set(x, land.userData.height(x, z) + .2, z); G.add(r); });
      const stones = [sph(.045), sph(.035)]; stones.forEach(x => G.add(x));
      const f = fire({ scale: .75, seed: 3 }); G.add(f);
      const sp = sparks(26, 2); G.add(sp);
      const hits = B.filter(b => b > LINE(1)[0] - .05 && b < LINE(1)[0] + 1.95);
      return { land, band, stones, f, sp, hits };
    },
    frame(s, lt, dur, t, { camera, PX }) {
      const kFire = kf(lt, [[0, 0], [1.85, 0], [2.2, .05], [2.7, .09], [3.1, .45], [4.4, 1]]);
      sky({ ...COLD, time: t, stars: .65, moon1Col: '#000000', fogNear: 6, fogDen: .008, wind: .35, hor: '#1E2A52', sunDir: [-.25, -.2, -1], halo: '#30428C' });
      const h = s.land.userData.height, b = s.band;
      const KP = [.45, h(.45, .05), .05];
      P.at(b.k, KP, -PI / 2);
      // seated, striking; then (lt 2.0-2.8) leans down to blow the tinder into flame
      P.blend(b.k, 'Sitting_Idle_Loop', t, 'Fixing_Kneeling', t, smooth(seg(lt, 2.1, 2.9)) * .55, { b: { only: ['spine', 'neck', 'Head', 'clavicle', 'upperarm', 'lowerarm', 'hand'] } });
      const kn = knap(b.k, t, s.hits, 1 - smooth(seg(lt, 2.0, 2.7)));
      s.stones[0].position.copy(kn.core); s.stones[1].position.copy(kn.hammer);
      const pel = P.wpos(b.k.bones.pelvis);
      const TP = [pel.x - .8, h(pel.x - .8, KP[2]) + .02, KP[2]];
      s.f.position.set(...TP); s.f.userData.update(t, kFire * .8, PX);
      s.sp.position.copy(kn.strike); s.sp.userData.update(t, s.hits, PX, .6);
      // the band around the fire, behind it from the camera
      P.at(b.w1, [-1.3, h(-1.3, -.9) + .02, -.9], PI * .28); P.clip(b.w1, 'Sitting_Idle_Loop', t);
      P.at(b.c, [-.55, h(-.55, -1.45) + .02, -1.45], PI * .1); P.clip(b.c, 'Sitting_Idle_Loop', t + 1.3);
      P.at(b.m2, [-1.75, h(-1.75, .2), .2], PI * .5); P.clip(b.m2, 'Crouch_Idle_Loop', t + .7);
      P.at(b.w2, [-1.0, h(-1.0, -2.1), -2.1], PI * .15); P.clip(b.w2, 'Idle_Loop', t);
      const up = smooth(seg(lt, 3.9, 4.7));                       // w2 holds a new flake up to the flame
      if (up > 0) { const hr = P.hand(b.w2, 'r'); P.reach(b.w2, 'r', hr.lerp(v3([-.85, h(-.85, -1.9) + 2.0, -1.9]), up).toArray(), [-1.4, 1.4, -2.6]); }
      const pull = ease(seg(lt, 3.2, 5.8)), C = pel.clone().add(v3([-.36, .22, 0]));
      const look = C.clone().lerp(v3([-.6, h(-.6, -.6) + .75, -.6]), pull);
      const cp = C.clone().add(v3([0, -.05, 2.6])).lerp(v3([-2.9, h(-2.9, 3.4) + 1.15, 3.4]), pull);
      cam(camera, cp.toArray(), look.toArray(), lerp(15, 38, smooth(seg(lt, 3.2, 4.4))));
    },
  });

  // ======================================================== S04 L2: following the herd
  SHOT({ id: 'S04', t0: LINE(2)[0], t1: LINE(3)[0], out: { kind: 'cut' },
    build(G) {
      const land = terrain({ size: 3000, seg: 200, amp: 2.5, freq: .0035, fog: .4, h: (x, z) => 10 * Math.exp(-Math.pow((z + 420) / 120, 2)) });
      const clear = []; for (let x = -2; x <= 9; x += 1.5) clear.push([x, 1.2, 2.2]); for (let x = 2; x <= 10; x += 2) clear.push([x - 1.5, 4.5, 2.6]);
      G.add(land, grass({ area: [-6, 26, -3, 7], n: 2600, h: .22, ground: land.userData.height, clear }));
      G.add(grass({ area: [-6, 26, -16, -3], n: 6000, h: .5, ground: land.userData.height }));
      const band = ['m1', 'm3', 'w2', 'm2', 'w1'].map(n => P.make(n));
      band.forEach(p => G.add(p.root));
      const spears = band.map(() => rod(.016)); spears.forEach(r => G.add(r));
      const herd = [];
      for (let i = 0; i < 12; i++) { const b = P.beast(i % 4 ? 'bull' : 'cow', 1.2); herd.push(b); G.add(b.root); }
      return { land, band, spears, herd };
    },
    frame(s, lt, dur, t, { camera }) {
      sky({ ...PREDAWN, time: t, fogNear: 20, fogDen: .0045 });
      const h = s.land.userData.height;
      const turn = smooth(seg(lt, 3.9, 5.3)) * .22;
      const X = [0, 1.3, -1.6, -2.9, -4.1], Z = [-3.4, -4.6, -4.1, -5.2, -3.9];
      s.band.forEach((p, i) => {
        const x = X[i] + WALK_V * lt, z = Z[i] - Math.max(0, lt - 4.4) * WALK_V * Math.sin(turn), y = h(x, z);
        P.at(p, [x, y, z], PI / 2 + turn);
        P.clip(p, 'Walk_Loop', t + i * .37);
        if (i === 0) {
          const pt = smooth(seg(lt, 3.1, 3.6)) * (1 - smooth(seg(lt, 5.0, 5.6)));
          if (pt > 0) { const hr = P.hand(p, 'r'); P.reach(p, 'r', hr.lerp(v3([x + .75, y + 1.6, z - .55]), pt).toArray(), [x - .2, y + 1.2, z + .6]); }
        }
        const hand = P.hand(p, i === 0 ? 'l' : 'r'), a = .42, dir = v3([Math.cos(a) * Math.sin(PI / 2 + turn), Math.sin(a), Math.cos(a) * Math.cos(PI / 2 + turn)]);
        setRod(s.spears[i], hand.clone().addScaledVector(dir, -1.0).toArray(), hand.clone().addScaledVector(dir, 1.25).toArray());
      });
      s.herd.forEach((b, i) => {
        const x = 8 + i * 4.6 + (hash(i) - .5) * 3 + 1.0 * lt, z = -70 - hash(i * 7) * 30;
        P.at(b, [x, h(x, z), z], PI / 2 + .08); P.clip(b, i % 5 === 2 ? 'Eating' : 'Walk', t + hash(i) * 2);
      });
      const xl = WALK_V * lt, up = ease(seg(lt, 2.0, 4.1));
      const lx = lerp(xl + .1, xl + 7, up), lz = lerp(-3.5, -40, up);
      gcam(camera, s.land, [lerp(xl - .9, xl - 1.5, up), lerp(.32, 1.65, up), lerp(.9, 5.6, up)], [lx, h(lx, lz) + lerp(.45, 2.2, up), lz], lerp(30, 36, up));
    },
  });

  // ======================================================== S05 L3: a narrow margin
  // Low and close: the wind bends the fire nearly out, a body shields it, it recovers; then the camera cranes up
  // and back until the camp is one small light in a dark land.
  SHOT({ id: 'S05', t0: LINE(3)[0], t1: LINE(4)[0], out: { kind: 'cross', d: 1.6 },
    build(G) {
      const land = terrain({ size: 3000, seg: 200, amp: 1.2, freq: .003, fog: .45 });
      G.add(land, grass({ area: [-30, 30, -30, 30], n: 7000, h: .5, ground: land.userData.height, clear: [[0, 0, 3.2], [-6.5, 4.5, 3.5]] }));
      const band = { k: P.make('m1'), w1: P.make('w1'), c: P.make('child'), w2: P.make('w2') };
      Object.values(band).forEach(p => G.add(p.root));
      const f = fire({ scale: .9, seed: 7, pool: 1.6 }); G.add(f);
      const snow = streak({ n: 4000, box: [60, 24, 60], dir: [11, -2.6, 2.5], size: 90, max: 9, col: '#C8D6F2' }); snow.position.set(-4, 6, 4); G.add(snow);
      return { land, band, f, snow };
    },
    frame(s, lt, dur, t, { camera, PX }) {
      const storm = smooth(seg(lt, .0, 1.4)) * (1 - .55 * smooth(seg(lt, 4.0, 5.6)));
      sky({ ...COLD, time: t, sunDir: [.5, -.2, -1], halo: '#2A3A78', stars: .25 * (1 - storm), moon1Col: '#000000', cloud: .55 + .4 * storm, cloudCol: '#141A2B', cloudLit: '#1C2540', cloudScale: .5, fogNear: 30, fogDen: .004 + .004 * storm, wind: .6 + 1.4 * storm });
      const h = s.land.userData.height, b = s.band, y0 = h(0, 0);
      const kFire = kf(lt, [[0, 1], [1.0, .85], [2.2, .16], [3.2, .12], [3.9, .55], [4.7, 1]]);
      s.f.userData.lean = .55 * storm * (1 - smooth(seg(lt, 2.4, 3.0)) * .8);
      s.f.position.set(0, y0, 0); s.f.userData.update(t, kFire, PX);
      P.at(b.w1, [.95, h(.95, -.55), -.55], -PI * .35); P.clip(b.w1, 'Crouch_Idle_Loop', t);
      P.at(b.c, [.55, h(.55, -1.05), -1.05], -PI * .15); P.clip(b.c, 'Crouch_Idle_Loop', t + 1.3);
      P.at(b.w2, [-.35, h(-.35, -1.15), -1.15], PI * .1); P.clip(b.w2, 'Crouch_Idle_Loop', t + .4);
      // the knapper turns their back to the wind and bends over the flame (2.2-4.6)
      const sh = smooth(seg(lt, 2.0, 2.6)) * (1 - smooth(seg(lt, 4.6, 5.3)));
      P.at(b.k, [lerp(-1.25, -.75, sh), h(-1, .1), .1], PI / 2);
      P.blend(b.k, 'Crouch_Idle_Loop', t, 'Fixing_Kneeling', t, sh);
      s.snow.userData.update(t, .25 + .9 * storm, PX);
      const up = ease(seg(lt, 3.4, 5.67));
      gcam(camera, s.land, [lerp(-1.2, -26, up), lerp(.62, 22, up), lerp(7.4, 30, up)], [0, y0 + lerp(.85, 4, up), lerp(-1, 0, up)], lerp(36, 42, up));
    },
  });

  // ======================================================== S06 L4: settling, dawn
  SHOT({ id: 'S06', t0: LINE(4)[0], t1: LINE(5)[0], out: { kind: 'flash', d: 2.6, col: '#FFE2B0' },
    build(G) {
      const hf = (x, z) => z > -8 ? 0 : z > -42 ? -1.6 : -1.6 + (1 - Math.exp(-(-42 - z) / 30)) * 7 + Math.max(0, fbm2(x * .008, z * .008) + .3) * 16 * (1 - Math.exp(-(-42 - z) / 60));
      const land = terrain({ size: 2600, seg: 220, amp: .6, freq: .01, h: hf });
      G.add(land, water({ w: 3000, d: 34, z: -25, y: -.18, dark: .62 }));
      G.add(grass({ area: [-8, 12, -7.5, 4], n: 4200, h: .6, ground: land.userData.height, clear: [[4.8, 6.0, 2.4], [3.6, 2.8, 1.8]] }));
      const hut = { c: [-3.2, 0, -3.4], poles: [] };
      for (let i = 0; i < 9; i++) { const r = rod(.035); hut.poles.push(r); G.add(r); }
      const band = { p: P.make('w1'), c: P.make('child'), m2: P.make('m2'), w2: P.make('w2'), m3: P.make('m3') };
      Object.values(band).forEach(p => G.add(p.root));
      return { land, hut, band };
    },
    frame(s, lt, dur, t, { camera }) {
      const k = smooth(seg(lt, 0, 8.3)), el = kf(lt, [[0, -.07], [5.6, 0], [8.6, .05]], x => x);
      sky({ ...skyMix(PREDAWN, DAWN, k), time: t, sunDir: [-.22, el, -1], sunSize: el > -.02 ? .016 : 0, fogNear: 15, fogDen: .004 });
      const b = s.band, [hx, , hz] = s.hut.c;
      s.hut.poles.forEach((r, i) => {
        const a = i / 9 * PI * 2 + .3, bx = hx + Math.cos(a) * 1.7, bz = hz + Math.sin(a) * 1.7;
        const up = easeOut(seg(lt, .2 + i * .35, 1.4 + i * .35));
        setRod(r, [bx, 0, bz], [lerp(bx + Math.cos(a) * 3.3, hx + Math.cos(a) * .12, up), lerp(.08, 3.3, up), lerp(bz + Math.sin(a) * 3.3, hz + Math.sin(a) * .12, up)]);
      });
      P.at(b.m2, [hx + 2.2, 0, hz + .6], -PI * .45); P.clip(b.m2, lt < 4.2 ? 'Push_Loop' : 'Idle_Loop', t);
      P.at(b.w2, [hx - 1.9, 0, hz + 1.2], PI * .6); P.clip(b.w2, lt < 3.6 ? 'PickUp_Table' : 'Idle_Loop', lt < 3.6 ? (lt % 1.8) : t, { loop: lt >= 3.6 });
      P.at(b.m3, [hx + .2, 0, hz + 2.4], PI); P.clip(b.m3, 'Idle_FoldArms_Loop', t);
      const px = 1.3, pz = -4.2; P.at(b.p, [px, 0, pz], PI); P.clip(b.p, 'Idle_Loop', t);
      const lift = ease(seg(lt, 3.3, 5.4)), hd = P.head(b.p);
      const cpos = v3([px + .55, 0, pz + .1]).lerp(v3([hd.x, hd.y - .38, hd.z + .02]), lift);
      cpos.y += Math.sin(lift * PI) * .35;
      P.at(b.c, cpos.toArray(), PI); P.blend(b.c, 'Idle_Loop', t, 'Sitting_Idle_Loop', t, smooth(seg(lt, 4.2, 5.4)));
      if (lift > .02) {
        const hl = P.hand(b.p, 'l'), hr = P.hand(b.p, 'r'), g = smooth(seg(lt, 3.1, 3.6));
        P.reach(b.p, 'l', hl.lerp(v3([cpos.x + .2, cpos.y + .2, cpos.z - .12]), g).toArray(), [px + .5, 1.4, pz + .4]);
        P.reach(b.p, 'r', hr.lerp(v3([cpos.x - .2, cpos.y + .2, cpos.z - .12]), g).toArray(), [px - .5, 1.4, pz + .4]);
      }
      const m = ease(seg(lt, 0, 6.2));
      gcam(camera, s.land, [lerp(5.6, 3.1, m), lerp(1.6, .82, m), lerp(6.5, 2.4, m)], [lerp(-1.4, .55, m), lerp(1.3, 2.0, m), lerp(-4, -5, m)], lerp(38, 33, m));
    },
  });
})();
