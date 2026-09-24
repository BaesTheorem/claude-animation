(() => {
  let S = null;
  function build() {
    const o = P3.scene({ sunDir: [-40, 60, 50], shadowSize: 30 });
    const g = P3.mesh(new THREE.PlaneGeometry(400, 400), AP.dust, { style: .8 }); g.rotation.x = -Math.PI / 2; o.scene.add(g);
    const names = ['dresser', 'driller', 'bill', 'boss', 'hand', 'lab', 'squatter'], people = names.map(n => PEOPLE.make(n));
    people.forEach((p, i) => { PEOPLE.at(p, [(i - 3) * 5, 0, 0], .35); o.scene.add(p.root); });
    S = { o, people, cam: P3.cam(30) };
  }
  const CL = ['Idle_Loop', 'Idle_Lantern_Loop', 'TreeChopping_Loop', 'Idle_FoldArms_Loop', 'Push_Loop', 'Walk_Carry_Loop', 'Idle_Talking_Loop'];
  LOOPS.cast3 = t => {
    if (!S) build();
    sky(AP.sky, '#F0D8A8', { still: true });
    S.people.forEach((p, i) => PEOPLE.clip(p, CL[i], t + i * .3));
    P3.look(S.cam, [6, 5.5, 34], [0, 3.2, 0]);
    P3.draw(S.o, S.cam, { fog: [60, 300], fogCol: '#F0D8A8' });
  };
  LOOPS.cast3.len = 3;
})();
(() => {
  let S = null;
  LOOPS.close3 = t => {
    if (!S) {
      const o = P3.scene({ sunDir: [-30, 40, 40], shadowSize: 20 });
      const g = P3.mesh(new THREE.PlaneGeometry(400, 400), AP.dust, { style: .8 }); g.rotation.x = -Math.PI / 2; o.scene.add(g);
      const a = PEOPLE.make('dresser'), b = PEOPLE.make('driller');
      PEOPLE.at(a, [0, 0, 0], -.4); PEOPLE.at(b, [4, 0, -3], -.9); o.scene.add(a.root); o.scene.add(b.root);
      S = { o, a, b, cam: P3.cam(28) };
    }
    sky('#9FB8C8', '#E9D2A6', { still: true });
    PEOPLE.clip(S.a, 'Idle_Loop', t); PEOPLE.clip(S.b, 'Idle_FoldArms_Loop', t);
    const hd = PEOPLE.head(S.a);
    P3.look(S.cam, [hd.x - 2.2, hd.y - .6, hd.z + 5.5], [hd.x + .3, hd.y - .9, hd.z]);
    P3.draw(S.o, S.cam, { fog: [60, 300], fogCol: '#E9D2A6', near: .2 });
  };
  LOOPS.close3.len = 3;
})();
(() => {
  let S = null;
  LOOPS.ik3 = t => {
    if (!S) {
      const o = P3.scene({ sunDir: [-30, 50, 40], shadowSize: 20 });
      const g = P3.mesh(new THREE.PlaneGeometry(400, 400), AP.dust, { style: .8 }); g.rotation.x = -Math.PI / 2; o.scene.add(g);
      const a = PEOPLE.make('dresser'), b = PEOPLE.make('driller');
      o.scene.add(a.root); o.scene.add(b.root);
      const bar = P3.beam([-3, 4, 2], [3, 4, 2], .18, .18, AP.iron); o.scene.add(bar);
      const rod = P3.beam([5, 0, 0], [5, 9, 0], .35, .35, AP.pine); o.scene.add(rod);
      S = { o, a, b, bar, cam: P3.cam(32) };
    }
    const y = 4 + Math.sin(t * 2) * .8;
    S.bar.position.y = y;
    PEOPLE.at(S.a, [0, 0, 0], 0); PEOPLE.clip(S.a, 'Idle_Loop', t);
    PEOPLE.reach(S.a, 'l', [1.1, y, 2], [2.5, y - 1, -1]); PEOPLE.reach(S.a, 'r', [-1.1, y, 2], [-2.5, y - 1, -1]);
    PEOPLE.at(S.b, [5, 0, 1.8], Math.PI); PEOPLE.clip(S.b, 'Idle_Loop', t);
    PEOPLE.reach(S.b, 'r', [5.05, 4.6 + Math.sin(t * 3) * .3, .3], [6, 3.5, 2.5]);
    sky(AP.sky, '#F0D8A8', { still: true });
    P3.look(S.cam, [3, 6, 16], [2, 4, 0]);
    P3.draw(S.o, S.cam, { fog: [60, 300], fogCol: '#F0D8A8', near: .2 });
    const hl = PEOPLE.hand(S.a, 'l'), [sx, sy] = P3.project(S.cam, [hl.x, hl.y, hl.z]); pglow(sx, sy, 10, '#FF0000', 1);
  };
  LOOPS.ik3.len = 3.2;
})();
(() => {
  let S = null;
  LOOPS.world3 = t => {
    if (!S) {
      const o = P3.scene({ sunDir: [-80, 50, 20], shadowSize: 140 });
      o.scene.add(WORLD.terrain({ col: '#C9A77A' }));
      WORLD.trees(o.scene, 60, { r0: 90, r1: 1200, dead: .7 });
      const hs = WORLD.homestead({ pos: [-70, 0, -60], yaw: .5 }); o.scene.add(hs);
      const wm = WORLD.windmill({ pos: [-20, 0, -30] }); o.scene.add(wm);
      o.scene.add(WORLD.waterhole(10, 20, 22, { fill: 0 }));
      const cows = [0, 1, 2].map(i => { const c = PEOPLE.beast(i ? 'cow' : 'bull', ['#8A4A2E', '#6E5A48', '#A0703E'][i]); PEOPLE.at(c, [18 + i * 9, 0, 34 - i * 6], -1.2 + i * .7); o.scene.add(c.root); return c; });
      S = { o, cows, wm, cam: P3.cam(34) };
    }
    S.cows.forEach((c, i) => PEOPLE.clip(c, i === 1 ? 'Idle_Headlow' : 'Walk', t + i));
    sky('#E9C27E', '#F3DDB0', { still: true }); sun(1500, 160, 70, .6);
    P3.look(S.cam, [40, 9, 90], [0, 6, 0]);
    P3.draw(S.o, S.cam, { fog: [150, 1400], fogCol: '#F0D7A8' });
  };
  LOOPS.world3.len = 3;
})();
(() => {
  let S = null;
  LOOPS.rig3 = t => {
    if (!S) {
      const o = P3.scene({ sunDir: [-70, 60, 50], shadowSize: 90 });
      o.scene.add(WORLD.terrain({ col: '#C9A77A' }));
      WORLD.trees(o.scene, 40, { r0: 120, r1: 1200, dead: .6 });
      const R = RIG.build(); o.scene.add(R);
      const dr = PEOPLE.make('driller'), bi = PEOPLE.make('bill'), dz = PEOPLE.make('dresser'), bo = PEOPLE.make('boss');
      for (const p of [dr, bi, dz, bo]) o.scene.add(p.root);
      S = { o, R, dr, bi, dz, bo, cam: P3.cam(40) };
    }
    const { R, dr, bi, dz, bo } = S, st = RIG.strokeAt(t);
    RIG.pose(R, { stroke: st, amp: 1, fly: t * 2.1 * TAU / 2 });
    const U = R.userData, ty = U.tillerAt[1];
    PEOPLE.at(dr, [2.6, U.floorY, 1.5], -Math.PI / 2 - .3); PEOPLE.clip(dr, 'Idle_Loop', t); PEOPLE.reach(dr, 'r', [0.9, ty, .3], [3, ty - 1.5, 3]); PEOPLE.reach(dr, 'l', [1.6, ty, -.1], [3, ty - 1.5, -2]);
    PEOPLE.at(bi, [37.5, 0, 5.2], Math.PI * .9); PEOPLE.clip(bi, 'Idle_Loop', t + 1); PEOPLE.reach(bi, 'r', U.throttle, [38, 5, 6]);
    PEOPLE.at(dz, [-22, 0, 8], Math.PI / 2); PEOPLE.clip(dz, 'TreeChopping_Loop', t);
    PEOPLE.at(bo, [9, 0, 14], -2.4); PEOPLE.clip(bo, 'Idle_FoldArms_Loop', t);
    sky('#E7B870', '#F2D9A8', { still: true }); sun(300, 150, 60, .5);
    const a = .9 + t * .05;
    P3.look(S.cam, [Math.cos(a) * 55, 7, Math.sin(a) * 55 + 10], [8, 18, 0]);
    P3.draw(S.o, S.cam, { fog: [150, 1400], fogCol: '#F2D9A8' });
    const [sx, sy, d] = P3.project(S.cam, U.stackTop); for (let i = 0; i < 5; i++) { const k = frac(t * .6 + i / 5); psmoke(sx - k * 180, sy - k * 220, (20 + k * 90) * 40 / d, AP.smoke, .5 * (1 - k)); }
  };
  LOOPS.rig3.len = 4;
})();
