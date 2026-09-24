(() => {
  LOOPS.ham = t => {
    sky(AP.tealDk, AP.teal); plain(800, AP.earth);
    const k = frac(t / 1.07), P = k < .6 ? kp(k, [[0, POSES.hamDown], [.6, POSES.hamUp]], easeOut) : kp(k, [[.6, POSES.hamUp], [.82, POSES.hamDown]], easeIn);
    seed('m'); man(900, 840, 80, P, CAST.driller, { hold: J => sledge(J.handF, J.angF + .9 * J.dir, 80) });
  };
  LOOPS.ham.len = 1.07;
})();
