// A worked example of a v2 shot (loaded only as a standalone loop: studio.html?loop=example, or
// `node render.mjs --loop=example --sheet=...`). Copy the PATTERN, not the content.
(() => {
  // 1. Build the set once. Everything that moves is kept in the returned object and posed every frame.
  const SET = () => P3.cached('example-rig', () => {
    const o = P3.scene({ sunDir: [-70, 45, 60], sun: 2.6, fill: .5, shadowSize: 70 });
    o.scene.add(WORLD.terrain({ col: '#C9A77A' }));
    WORLD.trees(o.scene, 30, { r0: 140, r1: 1100, dead: .7, seed: 3 });
    const R = RIG.build(); o.scene.add(R);
    const board = WORLD.depthBoard({ ft: 620 }); board.position.set(-8.3, 7, 8.9); board.rotation.y = .25; o.scene.add(board);
    const driller = PEOPLE.make('driller'), bill = PEOPLE.make('bill');
    o.scene.add(driller.root); o.scene.add(bill.root);
    return { o, R, board, driller, bill, cam: P3.cam(34) };
  });
  // 2. The shot: a pure function of (t, lt, dur).
  function shot(t, lt, dur) {
    const S = SET(), { R, driller, bill } = S, U = R.userData;
    const st = RIG.strokeAt(t);                                  // the blow lands on the beat, every 2 beats
    RIG.pose(R, { stroke: st, amp: 1, fly: t * 6.5, turn: Math.floor(bpOf(t) / 2) * .35 });
    // the driller at the temper screw: hand on the tiller between blows (IK after the clip)
    PEOPLE.at(driller, [2.3, U.floorY, 1.6], -Math.PI / 2 - .55);
    PEOPLE.clip(driller, 'Idle_Loop', t + .7);
    PEOPLE.reach(driller, 'r', [1.3, U.tillerAt[1], .25], [3, U.tillerAt[1] - 1.5, 2.5]);
    // Bill at the throttle, a different clip phase so nobody moves in unison
    PEOPLE.at(bill, [36.8, 0, 4.4], Math.PI * .92); PEOPLE.clip(bill, 'Idle_Loop', t * .9 + 2.1);
    PEOPLE.reach(bill, 'r', U.throttle, [37.5, 5, 6]);
    // background in 2D, then the 3D, then 2D effects on projected points
    sky('#E7B870', '#F2D9A8', { still: true }); sun(1500, 180, 60, .4);
    const k = ease(seg(lt, 0, dur));                             // a slow low-angle push toward the floor
    P3.look(S.cam, [lerp(13, 10.5, k), 3.4, lerp(17, 13.5, k)], [1.2, lerp(5.2, 5.6, k), 1]);               // low three-quarter, outside the legs: her full figure above the lyric strip, the tower rising behind
    P3.draw(S.o, S.cam, { fog: [150, 1300], fogCol: '#F2D9A8' });
    const [sx, sy, d] = P3.project(S.cam, U.stackTop);
    for (let i = 0; i < 5; i++) { const q = frac(t * .5 + i / 5); psmoke(sx - q * 200, sy - q * 240, (18 + q * 80) * 45 / d, AP.smoke, .45 * (1 - q)); }
    const hit = Math.exp(-frac(bpOf(t) / 2) * 12);                // dust puff at the casing head on each blow
    const [hx, hy] = P3.project(S.cam, U.hole); if (hit > .05) psmoke(hx, hy, 60 * hit + 20, AP.dust, .5 * hit);
    // 3. Transitions in screen space, last.
    if (lt < .35) scribbleWipe(.5 + lt / .7);
    if (lt > dur - .35) scribbleWipe((lt - (dur - .35)) / .7);
  }
  LOOPS.example = t => shot(t + 30, t, 4); LOOPS.example.len = 4; LOOPS.example.lyrics = true;
})();
