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
  const WALK_V = 1.15;           // m/s. The Walk_Loop clip covers .916 m/s per metre of body height (measured by the coordinator), so each walker's clip is sped to match
  const STRIDE = h => WALK_V / (.916 * h);

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
  // A slow tilt from the Milky Way (near the zenith) down to the dark land. The ridge is close and the lens long at
  // the end, so the herd reads against an afterglow. The camera also drifts a little, as if on a tripod in wind.
  SHOT({ id: 'S01', t0: 0, t1: 12.50, out: { kind: 'cut' },
    build(G) {
      const rz = -105;
      const land = terrain({ size: 3000, seg: 220, amp: 2.2, freq: .004, h: (x, z) => 21 * Math.exp(-Math.pow((z - rz) / 38, 2)) * (.85 + .3 * fbm2(x * .012, 2.1)) });
      G.add(land);
      G.add(grass({ area: [-30, 30, -30, 0], n: 1800, h: .45, ground: land.userData.height, clear: [[0, 0, 3]] }));
      const herd = [];
      for (let i = 0; i < 10; i++) { const b = P.beast(i % 3 ? 'bull' : 'cow', .7); herd.push(b); G.add(b.root); }
      return { land, herd, rz };
    },
    frame(s, lt, dur, t, { camera }) {
      const glow = smooth(seg(lt, 5, 11));
      sky({ ...NIGHT, time: t, skyYaw: .3 + t * .006, milky: 2.7, stars: 1.05, fogNear: 30, fogDen: .0024,
        hor: '#1E2B5C', halo: lerp(0, 1, glow) > .5 ? '#5B6CC6' : '#4658B4', haloW: 1.35, haloH: lerp(.07, .14, glow), sunDir: [-.1, -.2, -1], rimK: 1.2 });
      s.herd.forEach((b, i) => {
        const x = -38 + i * 6.2 + (hash(i) - .5) * 1.6 + 1.0 * t, z = s.rz + (hash(i * 3) - .5) * 2.4;
        const gaze = i % 4 === 3;
        P.at(b, [x, s.land.userData.height(x, z) - .1, z], PI / 2 + (hash(i + 5) - .5) * .12);
        P.clip(b, gaze ? 'Idle_Headlow' : 'Walk', t * (gaze ? 1 : .86) + hash(i) * 3);
      });
      const pitch = lerp(1.38, .21, ease(seg(lt, .6, 10.2)));
      const fov = lerp(60, 17, ease(seg(lt, 3.2, 12.4)));
      const y0 = s.land.userData.height(0, 0) + 1.6, yaw = .012 * Math.sin(t * .31) + .02 * (1 - ease(seg(lt, 0, 11)));
      const R = 100, cp = Math.cos(pitch), roll = .006 * Math.sin(t * .23);
      cam(camera, [0, y0, 0], [Math.sin(yaw) * cp * R, y0 + Math.sin(pitch) * R, -Math.cos(yaw) * cp * R], fov, roll);
    },
  });

  // ---- the band wears the stone age: the same five people in S02 and S03 (a different outfit each)
  const mkBand = G => {
    const o = i => ({ outfit: P.outfit('stone', i) });
    const band = { k: P.make('m1', o(2)), w1: P.make('w1', o(1)), c: P.make('child', { outfit: ['fur', 'hair'] }), m2: P.make('m2', o(0)), w2: P.make('w2', o(3)) };
    Object.values(band).forEach(p => G.add(p.root));
    return band;
  };
  // a cold shiver: a small fast tremor of the spine and shoulders, and a slow head turn toward `look` (yaw offset, rad)
  const shiver = (p, t, seed, amt = 1, look = 0) => {
    const f = 14 + hash(seed) * 6, w = .5 + .5 * Math.sin(t * .9 + seed * 3);
    P.turn(p, 'spine_02', [.012 * amt * Math.sin(t * f + seed), 0, .014 * amt * Math.sin(t * f * .83 + seed * 2)]);
    P.turn(p, 'Head', [.03 * Math.sin(t * .7 + seed), look * (.5 + .5 * w), 0]);
  };
  // a stone ring of n rocks around the origin of g (campfire) plus kindling sticks leaning to an apex
  const campfire = (G, r = .5, n = 10, seed = 1) => {
    const g = new THREE.Group();
    for (let i = 0; i < n; i++) {
      const a = i / n * PI * 2 + hash(i + seed) * .3, rk = UP.rock(.1 + hash(i * 3 + seed) * .06, i + seed, .7);
      rk.position.set(Math.cos(a) * r, .05, Math.sin(a) * r); rk.rotation.y = a; g.add(rk);
    }
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * PI * 2 + hash(i * 2 + seed) * .4, len = .5 + hash(i + seed * 5) * .12, st = rod(.014 + hash(i) * .008);
      setRod(st, [Math.cos(a) * r * .8, .03, Math.sin(a) * r * .8], [Math.cos(a) * .05, .3 + hash(i + seed) * .1, Math.sin(a) * .05]); g.add(st); void len;
    }
    for (const a of [.4, 2.1]) {      // two crossed logs under the sticks
      const lg = rod(.04); setRod(lg, [Math.cos(a) * r * .75, .07, Math.sin(a) * r * .75], [-Math.cos(a) * r * .75, .07, -Math.sin(a) * r * .75]); g.add(lg);
    }
    G.add(g); return g;
  };
  // a seated person's tunic is a rigid cone that would stand under them like a drum: squash it along the body's
  // up axis (k = 1 leaves it as made; .35 makes a short flap over the thighs). Only meshes on the pelvis are touched.
  const squashSkirt = (p, k) => {
    const pel = p.bones.pelvis, a = v3([0, 1, 0]).applyQuaternion(pel.getWorldQuaternion(new THREE.Quaternion()).invert()).normalize();
    pel.children.forEach(m => {
      if (!m.isMesh) return;
      if (!m.userData.m0) { m.updateMatrix(); m.userData.m0 = m.matrix.clone(); }
      const S = new THREE.Matrix4().set(
        1 - (1 - k) * a.x * a.x, -(1 - k) * a.x * a.y, -(1 - k) * a.x * a.z, 0,
        -(1 - k) * a.x * a.y, 1 - (1 - k) * a.y * a.y, -(1 - k) * a.y * a.z, 0,
        -(1 - k) * a.x * a.z, -(1 - k) * a.y * a.z, 1 - (1 - k) * a.z * a.z, 0, 0, 0, 0, 1);
      m.matrixAutoUpdate = false; m.matrix.copy(S).multiply(m.userData.m0); m.matrixWorldNeedsUpdate = true;
    });
  };
  // a seat rock under a world point
  const seatRock = (G, seed, r = .36) => { const k = UP.rock(r, seed, .74); G.add(k); return k; };

  // ======================================================== S02 huddled in the dark
  // The band is a huddle on a low knoll, so that it stands against the sky, with furs and long hair for outline.
  // Cold: a shiver, heads turn to the one who stands. The camera pushes in to the hands.
  const KNOLL = (x, z) => .6 * Math.exp(-(Math.pow(x + .4, 2) + Math.pow(z + 7.4, 2)) / 14);
  SHOT({ id: 'S02', t0: 12.50, t1: LINE(1)[0], out: { kind: 'cut' },
    build(G) {
      const land = terrain({ size: 2400, seg: 180, amp: 1.0, freq: .005, h: (x, z) => 16 * Math.exp(-Math.pow((z + 230) / 70, 2)) + KNOLL(x, z) });
      G.add(land, grass({ area: [-14, 14, -4.5, 5], n: 2400, h: .2, ground: land.userData.height, clear: [[2.1, 3.6, 2.6], [2.1, -.6, 2.4]] }),
        grass({ area: [-14, 14, -16, -4.5], n: 3600, h: .5, ground: land.userData.height, clear: [[1.8, -4.8, 2.1], [-.4, -7.2, 2.6], [2.0, -6.1, 1.3]] }));
      [[-6.2, -14.5, 1.3], [5.9, -16.4, 1.0], [8.5, -19, 1.6]].forEach(([x, z, r], i) => { const b = UP.rock(r, 4 + i, .55); b.position.set(x, land.userData.height(x, z) + r * .1, z); G.add(b); });
      const band = mkBand(G);
      const stones = [UP.rock(.05, 1, .6), UP.rock(.04, 2, .7)]; stones.forEach(x => G.add(x));
      const rock = seatRock(G, 11);
      // the seat rock sits under the knapper's pelvis in the final pose
      const h = land.userData.height, x1 = 2.45, kz = -6.4;
      P.at(band.k, [x1, h(x1, kz), kz], 3 * PI / 2); P.blend(band.k, 'Sitting_Enter', 2, 'Sitting_Idle_Loop', 1, 1, { a: { loop: false } });
      const pv = P.wpos(band.k.bones.pelvis); rock.position.set(pv.x, pv.y - .38, pv.z); rock.rotation.y = .8;
      const snow = streak({ n: 900, box: [40, 16, 30], dir: [4, -1.2, .5], size: 9, col: '#C8D6F2' }); snow.position.set(0, 3, -4); G.add(snow);
      return { land, band, stones, rock, snow, seat: pv };
    },
    frame(s, lt, dur, t, { camera, PX }) {
      sky({ ...COLD, time: t, skyYaw: .3 + t * .006, fogNear: 12, fogDen: .006, wind: .55, rimDir: [-.55, 0, -1], rimCol: '#9DB4EA', rimK: 2.4, rimP: 4 });
      const h = s.land.userData.height, b = s.band;
      const tx = [-.7, -.2, -1.45, .1].map((x, i) => x), look = (yw) => yw;
      // the huddle: each turns its head toward the knapper (who stands at lt 4-5 and walks off)
      P.at(b.w1, [-.75, h(-.75, -7.15), -7.15], PI * .45); P.clip(b.w1, 'Crouch_Idle_Loop', t); shiver(b.w1, t, 1, 1, -.5 * smooth(seg(lt, 3.6, 4.6)));
      P.at(b.c, [-.22, h(-.22, -7.55), -7.55], PI * .7); P.clip(b.c, 'Crouch_Idle_Loop', t + 1.3); shiver(b.c, t, 2, 1.4, .6 * smooth(seg(lt, 4, 5)));
      P.at(b.m2, [-1.4, h(-1.4, -6.75), -6.75], PI * .62); P.clip(b.m2, 'Crouch_Idle_Loop', t + .7); shiver(b.m2, t, 3, 1, -.4 * smooth(seg(lt, 3.8, 4.8)));
      P.at(b.w2, [.15, h(.15, -8.0), -8.0], PI * 1.05); P.clip(b.w2, 'Fixing_Kneeling', t + 2.1, { speed: .3 }); shiver(b.w2, t, 4, .8);
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
      if (lt < 4) shiver(b.k, t, 5, 1);
      squashSkirt(b.k, lerp(1, .35, smooth(seg(lt, 9.0, 10.2))));
      const pel = P.wpos(b.k.bones.pelvis);
      s.rock.visible = lt > 6.5;
      const hold = smooth(seg(lt, 10.4, 11.6)), kn = knap(b.k, t, [LINE(1)[0] + .07], hold);
      const got = lt > 6.2 ? 1 : 0;
      s.stones[0].position.copy(kn.core); s.stones[1].position.copy(kn.hammer); s.stones.forEach(x => { x.visible = !!got; });
      s.snow.userData.update(t, .35, PX);
      const hands = kn.core.clone().lerp(kn.hammer, .5);
      const k = ease(seg(lt, .3, 11.8));
      const look2 = v3([-.3, h(-.3, -7.3) + 1.0, -7.3]).lerp(hands.lerp(pel, .3), ease(seg(lt, 5.5, 11.8)));
      const sway = .02 * Math.sin(t * .4);
      gcam(camera, s.land, [lerp(1.8, 2.25, k) + sway, lerp(.2, .62, k), lerp(-.6, -3.3, k)], look2.toArray(), lerp(30, 30, k));
    },
  });

  // ======================================================== S03 L1: first light
  SHOT({ id: 'S03', t0: LINE(1)[0], t1: LINE(2)[0], out: { kind: 'cross', d: 1.0 },
    build(G) {
      const land = terrain({ size: 2000, seg: 120, amp: 1.0, freq: .006, h: (x, z) => 14 * Math.exp(-Math.pow((z + 260) / 80, 2)) });
      G.add(land, grass({ area: [-10, 10, -10, 6], n: 2600, h: .45, ground: land.userData.height, clear: [[0, 0, 2.3], [.3, 1.4, 1.4], [-1.6, 3.4, 2.6], [-1.0, 1.2, 2.4]] }));
      const band = mkBand(G);
      const seats = [[-1.75, -1.2], [-.5, -1.8], [.13, .05]].map(([x, z], i) => { const r = seatRock(G, 20 + i, .34); r.position.set(x, land.userData.height(x, z) + .16, z); r.rotation.y = i; return r; });
      const stones = [UP.rock(.05, 1, .6), UP.rock(.04, 2, .7)]; stones.forEach(x => G.add(x));
      const ring = campfire(G, .46, 10, 4);
      const f = fire({ scale: .88, seed: 3, pool: .7, embers: 60 }), f2 = fire({ scale: .6, seed: 9, light: false, embers: 20, pool: .3 }); G.add(f, f2);
      const sp = sparks(26, 2); G.add(sp);
      const flake = new THREE.Mesh(new THREE.ConeGeometry(.05, .24, 4), UP.silMat()); flake.scale.set(1, 1, .22); G.add(flake);
      const hits = B.filter(b => b > LINE(1)[0] - .05 && b < LINE(1)[0] + 1.95);
      return { land, band, seats, stones, f, f2, ring, sp, hits, flake };
    },
    frame(s, lt, dur, t, { camera, PX }) {
      const kFire = kf(lt, [[0, 0], [1.85, 0], [2.2, .05], [2.7, .09], [3.1, .45], [4.4, 1]]);
      sky({ ...COLD, time: t, stars: .65, moon1Col: '#000000', fogNear: 6, fogDen: .008, wind: .35, hor: '#1E2A52', sunDir: [-.25, -.2, -1], halo: '#30428C', rimDir: [-.4, 0, -1], rimCol: '#7C92D0', rimK: 1.6 });
      const h = s.land.userData.height, b = s.band;
      const KP = [.45, h(.45, .05), .05];
      P.at(b.k, KP, -PI / 2);
      // seated, striking; then (lt 2.0-2.8) leans down to blow the tinder into flame
      P.blend(b.k, 'Sitting_Idle_Loop', t, 'Fixing_Kneeling', t, smooth(seg(lt, 2.1, 2.9)) * .55, { b: { only: ['spine', 'neck', 'Head', 'clavicle', 'upperarm', 'lowerarm', 'hand'] } });
      squashSkirt(b.k, .35);
      const kn = knap(b.k, t, s.hits, 1 - smooth(seg(lt, 2.0, 2.7)));
      s.stones[0].position.copy(kn.core); s.stones[1].position.copy(kn.hammer);
      const pel = P.wpos(b.k.bones.pelvis);
      s.seats[2].position.set(pel.x - .02, pel.y - .36, pel.z);
      const TP = [pel.x - .8, h(pel.x - .8, KP[2]) + .02, KP[2]];
      s.ring.position.set(...TP);
      s.f.position.set(...TP); s.f.userData.update(t, kFire * .85, PX);
      s.f2.position.set(TP[0] + .05, TP[1], TP[2] - .04); s.f2.userData.update(t + 1.7, kFire * .6, PX);
      s.sp.position.copy(kn.strike); s.sp.userData.update(t, s.hits, PX, .6);
      // the band around the fire: firelight finds them. Across the fire sit two, one kneels near; the foreground woman
      // crouches and holds the new flake up against the flame (lt 3.3-5.8)
      P.at(b.w1, [-1.75, h(-1.75, -1.2) + .02, -1.2], PI * .35); P.clip(b.w1, 'Sitting_Idle_Loop', t); shiver(b.w1, t, 1, .3, .35 * smooth(seg(lt, 3, 4)));
      P.at(b.c, [-.5, h(-.5, -1.8) + .02, -1.8], PI * .05); P.clip(b.c, 'Sitting_Idle_Loop', t + 1.3); shiver(b.c, t, 2, .3, -.4 * smooth(seg(lt, 3.5, 4.5)));
      P.at(b.m2, [-1.75, h(-1.75, .1), .1], PI * .5); P.clip(b.m2, 'Crouch_Idle_Loop', t + .7); shiver(b.m2, t, 3, .3);
      const fx = TP[0], fz = TP[2], wx = fx - .92, wz = fz + .48, wyaw = Math.atan2(fx - wx, fz - wz);
      P.at(b.w2, [wx, h(wx, wz), wz], wyaw);
      P.clip(b.w2, 'Crouch_Idle_Loop', t);
      const up = smooth(seg(lt, 3.4, 4.5)), bob = .018 * Math.sin(t * 2.3);
      const flk = v3([fx - .22 + bob, TP[1] + .8 + .03 * Math.sin(t * 1.7), fz + .22]);
      const hr = P.hand(b.w2, 'r');
      P.reach(b.w2, 'r', hr.lerp(flk, up).toArray(), [wx - .5, h(wx, wz) + .8, wz - .3]);
      P.turn(b.w2, 'Head', [.05, 0, 0]);
      const hnd = P.hand(b.w2, 'r'); s.flake.position.copy(hnd).add(v3([.02, .1, 0])); s.flake.rotation.set(0, 0, -.25 + .1 * Math.sin(t * 1.3)); s.flake.visible = lt > 3.0;
      const pull = ease(seg(lt, 3.2, 5.8)), C = pel.clone().add(v3([-.36, .32, 0]));
      const look = C.clone().lerp(v3([fx - .25, TP[1] + .7, fz - .3]), pull);
      const cp = C.clone().add(v3([0, -.05, 2.6])).lerp(v3([fx - .1, TP[1] + .85, fz + 3.5]), pull);
      cam(camera, cp.toArray(), look.toArray(), lerp(19.5, 34, smooth(seg(lt, 3.2, 4.8))));
    },
  });

  // ======================================================== S04 L2: following the herd
  SHOT({ id: 'S04', t0: LINE(2)[0], t1: LINE(3)[0], out: { kind: 'cut' },
    build(G) {
      const land = terrain({ size: 3000, seg: 200, amp: 2.5, freq: .0035, fog: .4, h: (x, z) => 10 * Math.exp(-Math.pow((z + 420) / 120, 2)) });
      const clear = []; for (let x = -2; x <= 9; x += 1.5) clear.push([x, 1.2, 2.2]); for (let x = 2; x <= 10; x += 2) clear.push([x - 1.5, 4.5, 2.6]);
      G.add(land, grass({ area: [-6, 26, -3, 7], n: 2600, h: .22, ground: land.userData.height, clear }));
      G.add(grass({ area: [-6, 26, -16, -3], n: 6000, h: .5, ground: land.userData.height }));
      const band = ['m1', 'm3', 'w2', 'm2', 'w1'].map((n, i) => P.make(n, { outfit: P.outfit('stone', [2, 0, 3, 1, 2][i]) }));
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
        P.clip(p, 'Walk_Loop', (t + i * .37) * STRIDE(p.L.height ?? 1));
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
  // and back until the camp is one small light in a dark land. The squall is drawn as streaks along the wind, in gusts.
  const squall = (n, box, dir, len, seed = 1) => {
    const [bw, bh, bd] = box, pos = new Float32Array(n * 6), g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = new THREE.LineBasicMaterial({ color: '#D6E2FF', transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    const L = new THREE.LineSegments(g, m); L.frustumCulled = false;
    const dl = Math.hypot(...dir), du = dir.map(v => v / dl), w = (v, M) => ((v % M) + M) % M - M / 2;
    L.userData.update = (t, k, gust) => {
      L.visible = k > .01; m.opacity = Math.min(.8, .3 * k);
      const T = t + .5 * Math.sin(t * .8 + seed);          // gusts: the drift runs ahead and falls behind
      for (let i = 0; i < n; i++) {
        const sp = .75 + hash(i * 1.7 + seed) * .5, x = w(hash(i * 1.1 + seed) * bw + dir[0] * T * sp, bw), y = w(hash(i * 2.3 + seed) * bh + dir[1] * T * sp, bh), z = w(hash(i * 3.7 + seed) * bd + dir[2] * T * sp, bd);
        const ln = len * sp * (.4 + .9 * gust) * (.6 + .6 * hash(i * 5.1));
        pos.set([x, y, z, x - du[0] * ln, y - du[1] * ln, z - du[2] * ln], i * 6);
      }
      g.attributes.position.needsUpdate = true;
    };
    return L;
  };
  SHOT({ id: 'S05', t0: LINE(3)[0], t1: LINE(4)[0], out: { kind: 'cross', d: 1.6 },
    build(G) {
      const land = terrain({ size: 3000, seg: 200, amp: 1.2, freq: .003, fog: .45 });
      G.add(land, grass({ area: [-30, 30, -30, 30], n: 7000, h: .5, ground: land.userData.height, clear: [[0, 0, 3.2], [-6.5, 4.5, 3.5]] }));
      const band = mkBand(G);
      const ring = campfire(G, .5, 10, 6); ring.position.set(0, land.userData.height(0, 0), 0);
      const f = fire({ scale: .9, seed: 7, pool: 1.2 }), f2 = fire({ scale: .6, seed: 4, light: false, pool: .3 }); G.add(f, f2);
      const snow = streak({ n: 3200, box: [60, 24, 60], dir: [11, -2.6, 2.5], size: 90, max: 7, col: '#C8D6F2' }); snow.position.set(-4, 6, 4); G.add(snow);
      const lines = squall(1300, [40, 16, 40], [13, -2.2, 2.8], .5, 3); lines.position.set(-4, 6, 4); G.add(lines);
      const seat = UP.rock(.3, 9, .7); G.add(seat);
      return { land, band, f, f2, snow, lines, seat };
    },
    frame(s, lt, dur, t, { camera, PX }) {
      const storm = smooth(seg(lt, .0, 1.4)) * (1 - .55 * smooth(seg(lt, 4.0, 5.6)));
      sky({ ...COLD, time: t, sunDir: [.5, -.2, -1], halo: '#2A3A78', stars: .25 * (1 - storm), moon1Col: '#000000', cloud: .55 + .4 * storm, cloudCol: '#141A2B', cloudLit: '#1C2540', cloudScale: .5, fogNear: 30, fogDen: .004 + .004 * storm, wind: .6 + 1.4 * storm,
        rimDir: [.5, 0, -1], rimCol: '#7C92D0', rimK: 1.4 });
      const h = s.land.userData.height, b = s.band, y0 = h(0, 0);
      const kFire = kf(lt, [[0, 1], [1.0, .85], [2.2, .16], [3.2, .12], [3.9, .55], [4.7, 1]]);
      s.f.userData.lean = .55 * storm * (1 - smooth(seg(lt, 2.4, 3.0)) * .8); s.f2.userData.lean = s.f.userData.lean;
      s.f.position.set(0, y0, 0); s.f.userData.update(t, kFire, PX);
      s.f2.position.set(.04, y0, -.03); s.f2.userData.update(t + 1.3, kFire * .7, PX);
      const lean = s.f.userData.lean * (1 + .3 * UP.noise(t * 3));     // each figure also leans into the wind
      P.at(b.w1, [.95, h(.95, -.55), -.55], -PI * .35); P.clip(b.w1, 'Crouch_Idle_Loop', t); shiver(b.w1, t, 1, 1.4, -.4);
      P.at(b.c, [.55, h(.55, -1.05), -1.05], -PI * .15); P.clip(b.c, 'Crouch_Idle_Loop', t + 1.3); shiver(b.c, t, 2, 1.8, .3);
      P.at(b.w2, [-.35, h(-.35, -1.15), -1.15], PI * .1); P.clip(b.w2, 'Crouch_Idle_Loop', t + .4); shiver(b.w2, t, 3, 1.2, .5);
      P.at(b.m2, [1.55, h(1.55, .45), .45], -PI * .62); P.clip(b.m2, 'Crouch_Idle_Loop', t + .9); shiver(b.m2, t, 4, 1.2, -.3);
      // the knapper turns their back to the wind and bends over the flame (2.2-4.6)
      const sh = smooth(seg(lt, 2.0, 2.6)) * (1 - smooth(seg(lt, 4.6, 5.3)));
      P.at(b.k, [lerp(-1.25, -.75, sh), h(-1, .1), .1], PI / 2);
      P.blend(b.k, 'Crouch_Idle_Loop', t, 'Fixing_Kneeling', t, sh);
      P.turn(b.k, 'spine_02', [.05 * lean * 2, 0, .08 * lean]);
      s.snow.userData.update(t, .25 + .9 * storm, PX);
      s.lines.userData.update(t, (.2 + .9 * storm) * (1 - .55 * ease(seg(lt, 3.4, 5.67))), .4 + .6 * Math.max(0, UP.noise(t * 1.3 + 4)) + .4 * storm);
      s.lines.position.set(lerp(-4, -22, ease(seg(lt, 3.4, 5.67))), 6, 4);
      s.seat.visible = false;
      const up = ease(seg(lt, 3.4, 5.67));
      gcam(camera, s.land, [lerp(-1.2, -26, up), lerp(.62, 22, up), lerp(7.4, 30, up)], [0, y0 + lerp(.85, 4, up), lerp(-1, 0, up)], lerp(36, 42, up));
    },
  });

  // ======================================================== S06 L4: settling, dawn
  // The hut goes up on its poles. The parent kneels, takes the child by the waist, stands and swings the child up
  // onto their shoulders: legs over the shoulders and held at the shins, hands on the parent's head. Then the sun.
  SHOT({ id: 'S06', t0: LINE(4)[0], t1: LINE(5)[0], out: { kind: 'flash', d: 1.5, col: '#FFE2B0' },
    build(G) {
      const hf = (x, z) => z > -8 ? 0 : z > -42 ? -1.6 : -1.6 + (1 - Math.exp(-(-42 - z) / 30)) * 7 + Math.max(0, fbm2(x * .008, z * .008) + .3) * 16 * (1 - Math.exp(-(-42 - z) / 60));
      const land = terrain({ size: 2600, seg: 220, amp: .6, freq: .01, h: hf });
      G.add(land, water({ w: 3000, d: 34, z: -25, y: -.18, dark: .62 }));
      G.add(grass({ area: [-8, 12, -7.5, 4], n: 4200, h: .5, ground: land.userData.height, clear: [[4.8, 6.0, 2.4], [3.6, 2.8, 1.8], [1.3, -4.2, 1.4]] }));
      const hut = { c: [-3.2, 0, -3.4], poles: [], ring: [] };
      for (let i = 0; i < 9; i++) { const r = rod(.035); hut.poles.push(r); G.add(r); }
      for (let i = 0; i < 9; i++) { const r = rod(.02); hut.ring.push(r); G.add(r); }
      const o = i => ({ outfit: P.outfit('stone', i) });
      const band = { p: P.make('w1', { outfit: ['fur', 'hair'] }), c: P.make('child', { outfit: ['fur'] }), m2: P.make('m2', o(0)), w2: P.make('w2', o(3)), m3: P.make('m3', o(1)) };
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
      // a lashing ring binds the poles at 2.2 m, then hides go over the frame (a second ring of ties at 1.2 m)
      const lash = smooth(seg(lt, 3.6, 4.4));
      s.hut.ring.forEach((r, i) => {
        const a0 = i / 9 * PI * 2 + .3, a1 = (i + 1) / 9 * PI * 2 + .3, rr = 3.3 * .0 + lerp(.12, 1.7, 1 - 2.2 / 3.3) , zz = 2.2;
        void rr; const f = u => { const rad = lerp(1.7, .12, zz / 3.3); return [hx + Math.cos(u) * rad, zz, hz + Math.sin(u) * rad]; };
        setRod(r, f(a0), f(a1)); r.visible = lash > .5;
      });
      P.at(b.m2, [hx + 2.2, 0, hz + .6], -PI * .45); P.clip(b.m2, lt < 4.2 ? 'Push_Loop' : 'Idle_Loop', t); P.turn(b.m2, 'Head', [0, -.4 * smooth(seg(lt, 4.4, 5.4)), 0]);
      P.at(b.w2, [hx - 1.9, 0, hz + 1.2], PI * .6); P.clip(b.w2, lt < 3.6 ? 'PickUp_Table' : 'Idle_Loop', lt < 3.6 ? (lt % 1.8) : t, { loop: lt >= 3.6 });
      P.at(b.m3, [hx + .2, 0, hz + 2.4], PI); P.clip(b.m3, 'Idle_FoldArms_Loop', t);
      // ------------------------------------------------ the lift
      const par = b.p, ch = b.c, px = 1.3, pz = -4.2, PY = PI / 2 - .3;
      const fwv = yaw => v3([Math.sin(yaw), 0, Math.cos(yaw)]), sdv = yaw => v3([Math.cos(yaw), 0, -Math.sin(yaw)]);   // side = the model's left
      const kc = smooth(seg(lt, 2.8, 3.5)) * (1 - smooth(seg(lt, 4.3, 5.4)));      // kneels to the child, then rises with the child
      P.at(par, [px, 0, pz], PY); P.blend(par, 'Idle_Loop', t, 'Crouch_Idle_Loop', t, kc);
      const sL = ease(seg(lt, 3.7, 5.4));                                         // 0 on the ground, 1 on the shoulders
      const cyaw = lerp(PY + PI, PY + 2 * PI, ease(seg(sL, 0, .85)));
      const hd = P.head(par), shd = P.wpos(par.bones.spine_03), fwP = fwv(PY), sdP = sdv(PY);
      const standPel = v3([px, 0, pz]).addScaledVector(fwP, .62).add(v3([0, .31, 0]));
      const seatPel = hd.clone().addScaledVector(fwP, -.02).add(v3([0, -.21, 0]));
      const pelT = standPel.clone().lerp(seatPel, sL); pelT.y += Math.sin(sL * PI) * .16;
      pelT.addScaledVector(sdP, Math.sin(sL * PI) * .22);
      // the child's pose: standing, folding to a seat as it rises
      const poseChild = () => { P.blend(ch, 'Idle_Loop', t, 'Sitting_Idle_Loop', t, smooth(seg(sL, .1, .6))); };
      P.at(ch, [0, 0, 0], cyaw); poseChild();
      const pel0 = P.wpos(ch.bones.pelvis);
      P.at(ch, [pelT.x - pel0.x, pelT.y - pel0.y, pelT.z - pel0.z], cyaw); poseChild();
      const fwC = fwv(cyaw), sdC = sdv(cyaw), pelC = P.wpos(ch.bones.pelvis);
      // child's legs go over the shoulders; its hands go to the parent's head
      const wI = smooth(seg(sL, .55, .95)), shin = [];
      for (const sd of ['l', 'r']) {
        const sg = sd === 'l' ? 1 : -1, cur = P.wpos(ch.bones['foot_' + sd]);
        const tg = shd.clone().addScaledVector(sdP, sg * .21).addScaledVector(fwP, .14).add(v3([0, -.06, 0]));
        P.plant(ch, sd, cur.lerp(tg, wI).toArray(), pelC.clone().addScaledVector(fwP, .5).addScaledVector(sdP, sg * .25).add(v3([0, .12, 0])).toArray());
        shin.push(P.wpos(ch.bones['foot_' + sd]));
      }
      const wH = smooth(seg(sL, .55, .9));
      for (const sd of ['l', 'r']) {
        const sg = sd === 'l' ? 1 : -1, cur = P.hand(ch, sd);
        // both arms thrown up in a V once the child is seated: the clearest shape of 'lifted'
        const up2 = smooth(seg(lt, 5.1, 5.9));
        const tg = hd.clone().addScaledVector(sdP, sg * lerp(.1, .34, up2)).addScaledVector(fwP, lerp(.02, .05, up2)).add(v3([0, lerp(.1, .62, up2) + .03 * Math.sin(t * 2.3 + sg), 0]));
        P.reach(ch, sd, cur.lerp(tg, wH).toArray(), P.wpos(ch.bones['upperarm_' + sd]).addScaledVector(sdP, sg * .4).add(v3([0, .1, 0])).toArray());
      }
      // the parent's hands: at the child's waist while lifting, then holding the shins
      const g = smooth(seg(lt, 3.1, 3.7)), wA = smooth(seg(sL, .6, .92));
      for (const sd of ['l', 'r']) {
        const sg = sd === 'l' ? 1 : -1, cur = P.hand(par, sd);
        const waist = pelC.clone().addScaledVector(sdC, sg * .13).add(v3([0, .02, 0])), tg = waist.lerp(shin[sd === 'l' ? 0 : 1].clone().add(v3([0, .06, 0])), wA);
        P.reach(par, sd, cur.lerp(tg, g).toArray(), P.wpos(par.bones['upperarm_' + sd]).addScaledVector(sdP, sg * .45).add(v3([0, -.15, 0])).toArray());
      }
      P.turn(par, 'Head', [-.1 * smooth(seg(lt, 5, 6)), 0, 0]);
      const m = ease(seg(lt, .4, 3.9)), m2 = smooth(seg(lt, 3.9, 9.6));
      gcam(camera, s.land, [lerp(5.6, 2.7, m) - .25 * m2, lerp(1.6, .85, m) + .1 * m2, lerp(6.5, 1.5, m) - .25 * m2], [lerp(-1.4, 1.0, m), lerp(1.3, 1.5, m) + .25 * m2, lerp(-4, -4.3, m)], lerp(38, 36, m) - 3 * m2);
    },
  });
})();
