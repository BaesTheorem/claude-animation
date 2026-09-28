// Chapter H (v2) · 259.90–301.16 s · The land again. Verse 8 [63–67] and the final chorus [68–72].
// See docs/artesian/STORYBOARD.md and BRIEF.md. (work in progress)
(() => {
  // ---------------------------------------------------------------- light and colour
  // Late afternoon into sunset. The sun sits low toward +z (down the bore drain) and a little -x; it sinks through the chapter.
  const AZ = [-.3, .954];
  const sunDir = el => { const e = el * Math.PI / 180; return [AZ[0] * Math.cos(e) * 100, Math.sin(e) * 100, AZ[1] * Math.cos(e) * 100]; };
  const GROUND = '#CDAE7E', BANK = '#94683F', BED = '#6A4A32', WATER = '#3F8DBF', VERGE = '#86A650', VERGE2 = '#6F9A4A';
  const LEAF = '#6E8A4A', LEAF2 = '#7D9452', BARK = '#5E4A3A', DEADBARK = '#9C9286';

  // the plain beyond the terrain's edge: a flat ring out to the haze, so high cameras never see the ground stop
  function skirt(col, r0 = 1960, r1 = 16000) {
    const m = P3.mesh(new THREE.RingGeometry(r0, r1, 72, 1).rotateX(-Math.PI / 2), col, { style: .8, cast: false }); m.position.y = -.6; return m;
  }
  // a sky tied to the camera's horizon (so tilts up into the sky and down out of it read); span = px from horizon to zenith colour
  function skyCam(cam, top, bot, o = {}) {
    const f = new THREE.Vector3(); cam.getWorldDirection(f); f.y = 0; if (f.lengthSq() < 1e-6) f.set(0, 0, 1); f.normalize();
    const yh = P3.project(cam, [cam.position.x + f.x * 30000, cam.position.y, cam.position.z + f.z * 30000])[1], span = o.span ?? 1100;
    seed('Hsky');
    const g = X.createLinearGradient(0, yh - span, 0, yh); g.addColorStop(0, top); g.addColorStop(o.split ?? .55, mixCol(top, bot, .55)); g.addColorStop(1, bot);
    X.save(); X.globalAlpha = o.tone ?? .62; X.fillStyle = g; X.fillRect(-100, -100, W + 200, H + 200); X.restore();
    const hk = o.hatch ?? .6;
    for (let i = 0; i < 5; i++) {            // the top colour's strokes thin out toward the horizon in steps
      const y1 = yh - span * (.95 - i * .15);
      if (y1 > -80) pshade(rectPts(-80, -80, W + 160, clamp(y1 + 80, 0, H + 160)), top, hk * .2, { still: true });
    }
    for (let i = 0; i < 3; i++) pshade(rectPts(-80, yh - span * (.25 + i * .15), W + 160, span * (.25 + i * .15) + 200), bot, hk * .16, { still: true, kind: 'v' });
    return yh;
  }
  // aim the sun's shadow camera at the part of the set the shot looks at (ft); size = half-width of the shadow box
  function aimSun(o, focus, size, el, k = 2.4, col = '#FFE2B8') {
    const d = new THREE.Vector3(...sunDir(el)).normalize(), dist = size * 2 + 600;
    o.sun.position.set(focus[0] + d.x * dist, focus[1] + d.y * dist, focus[2] + d.z * dist);
    o.sun.target.position.set(...focus); o.sun.target.updateMatrixWorld();
    const c = o.sun.shadow.camera; c.left = -size; c.right = size; c.top = size; c.bottom = -size; c.near = 1; c.far = dist * 2 + size * 2; c.updateProjectionMatrix();
    o.sun.intensity = k; o.sun.color.set(col);
  }
  // where the sun's disc sits on screen for this camera (a far point along the sun direction)
  function sunScreen(cam, el) { const d = sunDir(el), p = cam.position; return P3.project(cam, [p.x + d[0] * 40, p.y + d[1] * 40, p.z + d[2] * 40]); }

  // ---------------------------------------------------------------- ground height on the terrain mesh itself
  function groundAt(mesh) {
    const g = mesh.geometry, P = g.parameters, pos = g.attributes.position, n = P.widthSegments, size = P.width, st = size / n;
    const Y = (i, j) => pos.getY(j * (n + 1) + i);
    return (x, z) => {
      const fx = (x + size / 2) / st, fz = (z + size / 2) / st, i = clamp(Math.floor(fx), 0, n - 1), j = clamp(Math.floor(fz), 0, n - 1), u = fx - i, v = fz - j;
      if (u + v <= 1) return Y(i, j) + (Y(i + 1, j) - Y(i, j)) * u + (Y(i, j + 1) - Y(i, j)) * v;
      return Y(i + 1, j + 1) + (Y(i, j + 1) - Y(i + 1, j + 1)) * (1 - u) + (Y(i + 1, j) - Y(i + 1, j + 1)) * (1 - v);
    };
  }
  // ---------------------------------------------------------------- the bore drain's line
  // Catmull-Rom through control points [x, z], resampled every `step` ft. Returns samples { x, z, y, tx, tz, nx, nz, s }
  // (t = downstream tangent, n = the flow's right-hand side).
  function pathThrough(C, step, gy) {
    const dense = [];
    for (let i = 0; i < C.length - 1; i++) {
      const p0 = C[Math.max(0, i - 1)], p1 = C[i], p2 = C[i + 1], p3 = C[Math.min(C.length - 1, i + 2)];
      for (let k = 0; k < 32; k++) {
        const t = k / 32, t2 = t * t, t3 = t2 * t;
        dense.push([0, 1].map(j => .5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
      }
    }
    dense.push(C[C.length - 1].slice());
    const pts = [dense[0]]; let acc = 0, want = 0;
    for (let i = 1; i < dense.length; i++) {
      const a = dense[i - 1], b = dense[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]);
      while (acc + d >= want + step) { want += step; const k = (want + 0 - acc) / d; pts.push([lerp(a[0], b[0], k), lerp(a[1], b[1], k)]); }
      acc += d;
    }
    return pts.map((p, i) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, tx = (b[0] - a[0]) / L, tz = (b[1] - a[1]) / L;
      return { x: p[0], z: p[1], y: gy(p[0], p[1]), tx, tz, nx: -tz, nz: tx, s: i * step };
    });
  }
  // a point on the path at arc length s, offset `off` ft to the flow's right and `dy` above the ground
  function onPath(P, s, off = 0, dy = 0) {
    const st = P[1].s - P[0].s, f = clamp(s / st, 0, P.length - 1.001), i = Math.floor(f), k = f - i, a = P[i], b = P[i + 1];
    const x = lerp(a.x, b.x, k), z = lerp(a.z, b.z, k), nx = lerp(a.nx, b.nx, k), nz = lerp(a.nz, b.nz, k), y = lerp(a.y, b.y, k);
    return [x + nx * off, y + dy, z + nz * off];
  }
  const tanAt = (P, s) => { const a = onPath(P, s - 1), b = onPath(P, s + 1), L = Math.hypot(b[0] - a[0], b[2] - a[2]) || 1; return [(b[0] - a[0]) / L, (b[2] - a[2]) / L]; };
  // sweep a cross-section profile [[offset, dy], ...] along path samples i0..i1 → indexed grid geometry
  function sweep(P, prof, gy, i0 = 0, i1 = P.length - 1, o = {}) {
    const pos = [], idx = [], nC = prof.length;
    for (let i = i0; i <= i1; i++) {
      const p = P[i];
      for (let c = 0; c < nC; c++) {
        const [off, dy] = prof[c], ow = o.off ? o.off(p.s, c) : 1, hw = o.h ? o.h(p.s, c) : 1, x = p.x + p.nx * off * ow, z = p.z + p.nz * off * ow;
        pos.push(x, gy(x, z) + dy * hw, z);
      }
    }
    for (let i = 0; i < i1 - i0; i++) for (let c = 0; c < nC - 1; c++) {
      const a = i * nC + c, b = (i + 1) * nC + c;
      idx.push(a, a + 1, b, a + 1, b + 1, b);        // wound so the faces look up
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    return g;
  }
  // merge many small meshes (trees, tufts) into one mesh per colour: a few draw calls instead of thousands
  function mergeByColour(group, root) {
    root.updateMatrixWorld(true);
    const buckets = new Map();
    group.updateMatrixWorld(true);
    group.traverse(m => {
      if (!m.isMesh) return;
      const col = '#' + m.material.userData.albedo.getHexString(), style = m.material.userData.style ?? 1, key = col + '|' + style;
      let g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
      g.applyMatrix4(m.matrixWorld);
      for (const a of Object.keys(g.attributes)) if (a !== 'position' && a !== 'normal') g.deleteAttribute(a);
      if (!buckets.has(key)) buckets.set(key, { col, style, gs: [] });
      buckets.get(key).gs.push(g);
    });
    const out = new THREE.Group();
    for (const { col, style, gs } of buckets.values()) out.add(P3.mesh(THREE.BufferGeometryUtils.mergeGeometries(gs), col, { style }));
    group.traverse(m => { if (m.isMesh) { m.geometry.dispose(); m.material.dispose(); } });
    return out;
  }

  // a cheap tree for distant belts: a trunk and a few low-poly crowns
  function lowTree(x, z, h, y, i, leaf) {
    const g = new THREE.Group(), tr = P3.mesh(P3.cyl(h * .03, h * .045, h * .55, 6), BARK); tr.position.set(x, y + h * .27, z); g.add(tr);
    for (let k = 0; k < 4; k++) {
      const r = h * (.16 + .08 * hash(i * 7 + k)), a = hash(i * 3 + k * 1.9) * TAU, d = h * .14 * hash(i * 5 + k);
      const c = P3.mesh(new THREE.IcosahedronGeometry(r, 1), leaf); c.scale.set(1.25, .7, 1.2); c.position.set(x + Math.cos(a) * d, y + h * (.62 + .18 * hash(i * 11 + k)), z + Math.sin(a) * d); g.add(c);
    }
    return g;
  }
  // ---------------------------------------------------------------- THE LAND: the bore site, its drain, the plain
  // The drain leaves the derrick floor at its front edge (+z) and winds away down the plain toward the evening sun.
  const CTRL = [[2.5, 13], [9, 27], [18, 45], [26, 68], [29, 100], [22, 150], [6, 210], [-10, 270], [-17, 335], [-8, 400], [12, 465], [27, 540], [22, 625], [2, 710],
    [-22, 800], [-40, 900], [-44, 1000], [-70, 1100], [-104, 1210], [-122, 1330], [-160, 1450], [-196, 1570], [-218, 1690], [-262, 1810], [-300, 1950]];
  // The drain, as the research gives it: about 4 ft wide and 9 in deep between low earth banks (stock water at it).
  const W0 = 2.0;                               // half-width of the channel bed (ft)
  const WL = .55;                               // water surface above the ground
  const WE = W0 + .42;                          // half-width of the water surface (where it meets the banks' inner slopes)
  const S_LOG = 27;                             // arc length of the log across the new drain (H1)
  const LOGCUT = -1.5;                          // where along the log the axe cuts it (ft from the channel's centre, along n)
  const SPOUT = [.9, 4.8, 12.4];                 // the mouth of the bore's outlet pipe (the flow leaves it toward +z)
  const LAND = () => P3.cached('H-land', () => {
    const o = P3.scene({ sunDir: sunDir(13), sun: 2.4, fill: .5, shadowSize: 120 });
    o.sun.shadow.bias = -.0004;
    const site = WORLD.site({ col: GROUND, dead: .3, board: 4020 });
    o.scene.add(site.group);
    const R = site.rig, U = R.userData;
    const sk = skirt(GROUND); o.scene.add(sk);
    U.rods.visible = false; U.tiller.visible = false;            // the tools are out of the hole: the bore is flowing
    const gy = groundAt(site.ground);
    // level the ground where the stock water (the pool) before anything is laid on it
    { const P0 = pathThrough(CTRL, 2.5, () => 0), c = P0[Math.round(POOL[0] / 2.5)], y0 = gy(c.x, c.z), pos = site.ground.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) { const d = Math.hypot(pos.getX(i) - c.x, pos.getZ(i) - c.z); if (d < 90) pos.setY(i, lerp(y0, pos.getY(i), smoothstep(40, 90, d))); }
      pos.needsUpdate = true; site.ground.geometry.computeVertexNormals(); }
    const P = pathThrough(CTRL, 2.5, gy), END = P[P.length - 1].s;
    const noise = s => WORLD.noise2(s / 23, 3.7);
    // banks of spoil either side, the wet bed between, and the water surface
    // the banks: a little irregular (hand-dug), and trampled flat where the stock water at the pool (H4)
    const flat = s => 1 - smoothstep(POOL[0] - 26, POOL[0] - 16, s) * (1 - smoothstep(POOL[0] + 16, POOL[0] + 26, s));
    const bankOpt = inner => ({ off: (s, c) => c === inner ? 1 : .92 + .16 * noise(s + c * 40), h: (s, c) => (.85 + .3 * noise(s * 1.3 + c * 17)) * flat(s) });
    const bankL = [[-(W0 + 3.6), -.12], [-(W0 + 2.5), .75], [-(W0 + 1.5), 1.0], [-(W0 + .7), .9], [-W0, .03]];
    const bankR = bankL.map(([a, b]) => [-a, b]).reverse();
    const drain = new THREE.Group(); o.scene.add(drain);
    const banks = new THREE.Group(); drain.add(banks);
    banks.add(P3.mesh(sweep(P, bankL, gy, 0, P.length - 1, bankOpt(4)), BANK, { style: .8 }));
    banks.add(P3.mesh(sweep(P, bankR, gy, 0, P.length - 1, bankOpt(0)), BANK, { style: .8 }));
    const bed = P3.mesh(sweep(P, [[-W0 - .05, .03], [0, .02], [W0 + .05, .03]], gy), BED, { style: .8 }); bed.castShadow = false; drain.add(bed);
    const water = WORLD.water(sweep(P, [[-WE, WL], [0, WL], [WE, WL]], gy)); drain.add(water);
    // the surge: a finer ribbon below the log, revealed as the released water runs down the dry channel (H1)
    const Pf = pathThrough(CTRL.slice(0, 6), .25, gy), i0 = Math.round(S_LOG / .25), i1 = Math.round((S_LOG + 34) / .25);
    const surge = WORLD.water(sweep(Pf, [[-WE, WL], [0, WL], [WE, WL]], gy, i0, i1)); drain.add(surge);
    // the stock's watering place: the banks trampled down and the water spread in a shallow pool, mud round its edge
    const pc = onPath(P, POOL[0]), [ptx, ptz] = tanAt(P, POOL[0]), pyaw = Math.atan2(ptx, ptz);
    const poolMud = P3.mesh(new THREE.CircleGeometry(1, 40).rotateX(-Math.PI / 2), '#7A5A3E', { style: .8 }); poolMud.scale.set(POOL[2] + 5, 1, POOL[1] + 6); poolMud.position.set(pc[0], pc[1] + .05, pc[2]); poolMud.rotation.y = pyaw; poolMud.castShadow = false; drain.add(poolMud);
    const poolW = WORLD.water(new THREE.CircleGeometry(1, 40).rotateX(-Math.PI / 2)); poolW.scale.set(POOL[2], 1, POOL[1]); poolW.position.set(pc[0], pc[1] + WL - .04, pc[2]); poolW.rotation.y = pyaw; drain.add(poolW);
    // green verges: the land along the water comes back (not near the rig yet)
    const vg = s => clamp((s - 70) / 120) * (3 + 11 * noise(s * .6 + 90));
    const verge = new THREE.Group(); drain.add(verge);
    for (const sd of [-1, 1]) {
      const cols = [W0 + 4.1, W0 + 7.1, W0 + 10.1].map(v => v * sd), pr = (sd < 0 ? cols.slice().reverse() : cols).map(v => [v, .07]);   // offsets increasing, so the faces look up
      const g = sweep(P, pr, gy, 0, P.length - 1); const pos = g.attributes.position;
      for (let i = 0; i < P.length; i++) for (let c = 0; c < 3; c++) {        // the outer edge widens with vg(s); all back on the ground
        const ci = sd < 0 ? 2 - c : c, p = P[i], off = sd * (W0 + 4.1 + (ci === 0 ? 0 : ci === 1 ? .5 : 1) * vg(p.s) + .01), x = p.x + p.nx * off, z = p.z + p.nz * off;
        pos.setXYZ(i * 3 + c, x, gy(x, z) + .07, z);
      }
      g.computeVertexNormals();
      const m = P3.mesh(g, sd < 0 ? VERGE : VERGE2, { style: .8 }); m.castShadow = false; verge.add(m);
    }
    // the flowing bore, fitted as they were once the drain was cut: a tee on the casing head and a pipe out over the front
    // of the floor; the flow falls from its mouth in a thick rope into a pool at the head of the drain
    const bore = new THREE.Group(); o.scene.add(bore);
    const fy = U.floorY, IRONP = '#55524D';
    bore.add(P3.beam([0, fy + 1.6, 0], [0, fy + 2.9, 0], .62, .62, IRONP));
    const tee = P3.mesh(P3.cyl(.42, .42, 1.1, 14).rotateX(Math.PI / 2), IRONP); tee.position.set(0, fy + 2.9, .1); bore.add(tee);
    bore.add(P3.beam([0, fy + 2.9, .5], [.9, fy + 2.6, SPOUT[2] - .2], .5, .5, IRONP));
    for (const zz of [3.5, 7.5]) bore.add(P3.beam([.3 * zz / 12, fy, zz], [.3 * zz / 12, fy + 2.75, zz], .3, .3, '#6E5238'));   // timber props under the pipe
    const mouth = P3.mesh(P3.cyl(.36, .3, .4, 14).rotateX(Math.PI / 2), IRONP); mouth.position.set(.9, fy + 2.6, SPOUT[2]); bore.add(mouth);
    const arcPts = []; for (let i = 0; i <= 14; i++) { const k = i / 14; arcPts.push(new THREE.Vector3(.9 + k * .3, fy + 2.6 - 4.9 * k * k - .15 * k, SPOUT[2] + .2 + k * 3.1)); }
    const spout = WORLD.water(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arcPts), 28, .3, 10, false)); bore.add(spout);
    const pool = WORLD.water(new THREE.CircleGeometry(4.6, 30).rotateX(-Math.PI / 2)); pool.position.set(1.6, WL - .05, 15.4); bore.add(pool);
    const poolRim = P3.mesh(new THREE.RingGeometry(4.5, 6.2, 30, 1).rotateX(-Math.PI / 2), '#7E5E42', { style: .8, cast: false }); poolRim.position.set(1.6, .04, 15.4); bore.add(poolRim);
    // cleared scrub along the new drain: stumps and a heap of cut brush
    const scrub = new THREE.Group(); o.scene.add(scrub);
    for (let i = 0; i < 9; i++) {
      const s = 18 + i * 11, off = (i % 2 ? 1 : -1) * (W0 + 6 + hash(i * 3.1) * 5), p = onPath(P, s, off);
      const st = P3.mesh(P3.cyl(.45 + hash(i) * .3, .55 + hash(i) * .3, .9 + hash(i * 2) * .8, 9), '#7A5E44'); st.position.set(p[0], p[1] + .4, p[2]); scrub.add(st);
    }
    for (let i = 0; i < 16; i++) {
      const p = onPath(P, 50 + hash(i * 7) * 14, -(W0 + 9 + hash(i * 5) * 5), .3 + hash(i * 3) * 1.4);
      const br = P3.beam(p, [p[0] + (hash(i * 9) - .5) * 9, p[1] + hash(i * 4) * 1.5, p[2] + (hash(i * 11) - .5) * 9], .2 + hash(i) * .25, .2 + hash(i) * .25, i % 3 ? '#6E5238' : '#8A7058');
      scrub.add(br);
    }
    // the log that dams the new drain until the dresser cuts it: two lengths that part where his axe bites (LOGCUT ft
    // along n from the channel's centre line), each swinging downstream about its end on the bank
    const logs = [];
    { const c = onPath(P, S_LOG, 0, .7), i = Math.round(S_LOG / 2.5), n = [P[i].nx, P[i].nz], t = [P[i].tx, P[i].tz];
      for (const sd of [-1, 1]) {
        const len = 6.6 - sd * LOGCUT;
        const piv = new THREE.Group(); piv.position.set(c[0] + n[0] * sd * 6.6, c[1] + .15, c[2] + n[1] * sd * 6.6); o.scene.add(piv);
        const g = P3.cyl(.64, .7, len, 14).rotateZ(-Math.PI / 2).translate(len / 2, 0, 0), m = P3.mesh(g, '#6E5840'); piv.add(m);
        const face = P3.mesh(new THREE.CircleGeometry(.6, 14).rotateY(Math.PI / 2).translate(len + .02, 0, 0), '#D8B886', { cast: false }); piv.add(face);
        const dx = -sd * n[0], dz = -sd * n[1], base = Math.atan2(-dz, dx), sgn = Math.sign(-Math.sin(base) * t[0] - Math.cos(base) * t[1]) || 1;
        piv.rotation.y = base; logs.push({ piv, base, sgn, len });
      } }
    // timber belts: bands of coolibah and gidgee across the plain, merged per colour
    const belts = new THREE.Group();
    // near belts in full detail (WORLD.tree); the far belts, seen from the air, as low-poly crowns (cheap in bulk)
    const BELTS = [
      { a: [-420, 318], b: [420, 452], w: 78, n: 90, full: true },     // the belt the drain runs under (H2, H3)
      { a: [120, 150], b: [520, 820], w: 60, n: 26, full: true },
      { a: [-140, 520], b: [-620, 900], w: 70, n: 30 },
      { a: [-1000, 930], b: [900, 1090], w: 110, n: 150 },
      { a: [-1300, 1520], b: [1200, 1720], w: 150, n: 150 },
      { a: [700, 1180], b: [1400, 1900], w: 120, n: 50 },
    ];
    let ti = 0;
    for (const B of BELTS) for (let i = 0; i < B.n; i++, ti++) {
      const k = hash(ti * 3.7 + 1), off = (hash(ti * 5.3 + 2) - .5) * B.w * (.6 + .4 * hash(ti * 1.3)), dx = B.b[0] - B.a[0], dz = B.b[1] - B.a[1], L = Math.hypot(dx, dz);
      const x = B.a[0] + dx * k - dz / L * off, z = B.a[1] + dz * k + dx / L * off;
      let near = 1e9; for (let j = 0; j < P.length; j += 4) near = Math.min(near, Math.hypot(P[j].x - x, P[j].z - z));
      if (near < (B.full ? W0 + 9 : 34)) continue;        // keep the drain line clear (the timber was cleared for it)
      const dead = hash(ti * 9.1) < .1, h = lerp(20, 38, hash(ti * 2.3)), y = gy(x, z) - .3, leaf = hash(ti * 4.4) < .5 ? LEAF : LEAF2;
      belts.add(B.full ? WORLD.tree(x, z, { dead, h, seed: ti * 13 + 5, leaf, bark: dead ? DEADBARK : BARK, y }) : lowTree(x, z, h, y, ti, leaf));
    }
    const beltsM = mergeByColour(belts, o.scene); o.scene.add(beltsM);
    // H2's shade trees: coolibahs flanking the drain ahead of the camera; their leaf masses are kept (centre, radius) so
    // the shade they throw on the moving water can be drawn to match
    const shade = new THREE.Group(), clumps = [];
    for (const [i, [s, off, h]] of SHADE.entries()) {
      const b = onPath(P, s, off), x = b[0], z = b[2], tr = WORLD.tree(x, z, { h, seed: 300 + i * 7, leaf: i % 2 ? LEAF2 : LEAF, bark: BARK, y: gy(x, z) - .3 });
      tr.traverse(m => { if (m.isMesh && m.geometry.type === 'IcosahedronGeometry') clumps.push({ c: m.position.toArray(), r: m.geometry.parameters.radius * 1.1 }); });
      shade.add(tr);
    }
    const shadeM = mergeByColour(shade, o.scene); o.scene.add(shadeM);
    // a gum-leaf sprig that rides the current (H2)
    const sprig = new THREE.Group(); o.scene.add(sprig);
    sprig.add(P3.beam([-.8, 0, 0], [.9, .03, .07], .05, .05, '#8A6A48'));
    for (let k = 0; k < 7; k++) { const lf = P3.mesh(new THREE.SphereGeometry(.5, 10, 6), k % 2 ? '#C8BC72' : '#A9B868', { style: .6 }); lf.scale.set(.26, .04, .7); lf.position.set(-.62 + k * .22, .03, (k % 2 ? 1 : -1) * .3); lf.rotation.y = (k % 2 ? 1 : -1) * .6; sprig.add(lf); }
    // tools and people are added by the shots' needs (all kept here, posed per frame)
    const cast = {};
    for (const n of ['dresser', 'driller', 'bill', 'boss', 'hand', 'lab', 'squatter']) {
      const p = cast[n] = PEOPLE.make(n, SHIRT[n] ? { shirt: SHIRT[n] } : {}); o.scene.add(p.root);
      p.mats = []; p.root.traverse(m => { if (m.isMesh) p.mats.push([m.material, m.material.color.clone()]); });
    }
    const block = new THREE.Group(), blockM = P3.mesh(P3.cyl(.95, 1.05, 1.66, 14), '#6E5840'); blockM.position.y = .83; block.add(blockM);
    const props = { block, log: PROPS.log(4.2, .42), axe: PROPS.axe(), shovel: PROPS.shovel(), shovel2: PROPS.shovel(), sledge: PROPS.sledge(), hatS: PROPS.hat('wide', CAST3.squatter.hatCol), hatD: PROPS.hat('slouch', CAST3.driller.hatCol), hatB: PROPS.hat('bowler', CAST3.boss.hatCol) };
    for (const p of Object.values(props)) o.scene.add(p);
    const cows = COWS.map(([c]) => { const b = PEOPLE.beast('cow', c, { scale: .34 }); o.scene.add(b.root); return b; });
    const brush = new THREE.Group(); o.scene.add(brush);        // an armful of cut brush (sticks with a few leafy ends)
    for (let i = 0; i < 6; i++) { const a = [-.2 + hash(i) * .4, (hash(i * 3) - .5) * .5, -1.2 - hash(i * 5) * 1.5], b = [(hash(i * 7) - .5) * 1.6, .3 + (hash(i * 9) - .5) * .8, 2.4 + hash(i * 11) * 2.2];
      brush.add(P3.beam(a, b, .09 + hash(i) * .06, .09 + hash(i) * .06, '#6E5238'));
      if (i % 2 === 0) { const lf = P3.mesh(new THREE.IcosahedronGeometry(.55 + hash(i) * .3, 0), LEAF2); lf.scale.set(1.4, .6, 1.2); lf.position.set(...b); brush.add(lf); } }
    return { o, site, sk, R, U, gy, P, END, drain, banks, bed, water, surge, verge, bore, spout, pool, scrub, logs, brush, belts: beltsM, shade: shadeM, clumps, sprig, cast, props, cows, cam: P3.cam(40) };
  });
  // H2 rides the water where the drain runs straight at the evening sun (so its banks don't shade it): two coolibahs flank
  // the drain ahead and their long dappled shadows reach back up the water; beyond the shadows the water lies in the sun
  const POOL = [742, 17, 11];                               // the watering pool: [s, half-length, half-width]
  const S2 = 205;
  const SHADE = [[263, 7.5, 27], [267, -8.5, 25], [282, 14, 26]];   // [s, off (+ = the flow's right), h]
  const SHIRT = { dresser: '#D2C6AC', driller: '#7C624A', bill: '#98372B', boss: '#E0D5BF', hand: '#62727F', lab: '#A87E4C' };
  const COWS = [['#8A4A2E'], ['#6E5A48'], ['#A0703E'], ['#E2D6C0'], ['#5A3E30'], ['#9A5A36']];

  // the drain's water seen from far off holds the bright sky: a pale colour, few dark strokes (reset() restores it)
  function waterLook(S, col, style) {
    for (const m of [S.water, S.surge]) { m.material.color.set(col); m.material.userData.albedo.set(col); m.material.userData.style = style; }
  }
  // dusk on the plain: the ground takes the evening's colour (k 0..1; reset() restores it)
  function dusk(S, k) {
    const c = mixCol(GROUND, '#9C7A62', k);
    for (const m of [S.site.ground, S.sk]) { m.material.color.set(c); m.material.userData.albedo.set(c); }
  }
  // against a low sun the crew read as silhouettes: darken their local colour toward warm black (k 0..1)
  function silhouette(p, k) {
    for (const [m, c0] of p.mats) { m.color.copy(c0).lerp(new THREE.Color('#2B231E'), k); m.userData.albedo.copy(m.color); }
  }
  // everything optional hidden, the machine at rest; each shot then shows and poses what it needs (a cached set remembers)
  function reset(S) {
    for (const p of Object.values(S.cast)) { p.root.visible = false; if (p.hat) p.hat.visible = true; silhouette(p, 0); }
    for (const p of Object.values(S.props)) p.visible = false;
    for (const c of S.cows) c.root.visible = false;
    S.water.visible = true; S.water.geometry.setDrawRange(0, Infinity); S.water.position.y = 0; waterLook(S, AP.water, .5); dusk(S, 0);
    S.surge.visible = false; S.verge.visible = true; S.scrub.visible = true; S.brush.visible = false; S.sprig.visible = false;
    RIG.pose(S.R, { stroke: 0, amp: 0, fly: 0 });
    S.o.fill.intensity = .32;
  }

  // height of whatever solid is under (x, z): the drain banks, the bed or the plain
  const _ray = new THREE.Raycaster(), _dn = new THREE.Vector3(0, -1, 0);
  function surfY(S, x, z) {
    _ray.set(new THREE.Vector3(x, 60, z), _dn); _ray.far = 200;
    const hit = _ray.intersectObjects([S.banks, S.bed, S.site.ground], true)[0];
    return hit ? hit.point.y : S.gy(x, z);
  }
  const beatT = n => OFF + n * BEAT;
  const smoothstep = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };

  // ---------------------------------------------------------------- 2D: skies, the low sun, water light
  function skyH(top, bot, o = {}) { sky(top, bot, { still: true, hatch: o.hatch ?? .7, split: o.split ?? .62, tone: o.tone ?? .6 }); }
  function lowSun(x, y, r, a = 1, col = '#F6D9A0') {
    seed('Hsun');
    pglow(x, y, r * 7, '#F4B36A', .55 * a); pglow(x, y, r * 3, '#FBE3B0', .7 * a);
    pfill(ellPts(x, y, r, r, 30, r * .03), col, { tone: .9 * a, dens: .45 * a, ink: null });
  }
  // sparkle on water: short level strokes (glimmers) and, where the sun catches, four-point flashes
  function glint(x, y, s, a, flash = 0) {
    if (a <= .02) return;
    pline([[x - s * 1.4, y], [x + s * 1.4, y]], .9, '#F8F4E6', { over: 0, passes: 1, alpha: a, taper: .9 });
    if (flash > .02) {
      pglow(x, y, s * 7 * flash, '#FFF1C8', .7 * flash);
      pline([[x - s * 4 * flash, y], [x + s * 4 * flash, y]], 1.1, '#FFFBEE', { over: 0, passes: 1, alpha: flash, taper: .95 });
      pline([[x, y - s * 2.6 * flash], [x, y + s * 2.6 * flash]], .9, '#FFFBEE', { over: 0, passes: 1, alpha: flash * .8, taper: .95 });
    }
  }
  // foam at a moving water front: pale puffs and streaks across the channel at arc length s
  function foam(S, cam, s, k, key, len = 1.6) {
    if (k <= .02) return;
    seed(key);
    for (let i = 0; i < 11; i++) {
      const off = (i / 10 - .5) * 2 * (W0 + .2), s0 = s - hash(i * 3.3) * len, a = P3.project(cam, onPath(S.P, s0, off, WL + .06)), b = P3.project(cam, onPath(S.P, s0 - .9 - hash(i * 5) * 1.2, off * .9, WL + .04));
      if (a[2] < .5 || b[2] < .5) continue;
      pline([a, b], .9 + hash(i) * .8, '#F6F2E6', { over: 0, passes: 1, alpha: .9 * k, taper: .7 });
      if (i % 3 === 0) psmoke(a[0], a[1], (.35 + hash(i * 7) * .3) * 900 / Math.max(2, a[2]), '#F3EEE0', .35 * k);
    }
  }

  // ---------------------------------------------------------------- H1 · 259.90 [63] clear away the timber, let the water run
  // Low in the new-cut drain, looking back up it at the rig. The dresser, on the bank, chops through the log that dams it:
  // two strokes on the beat; on the second the log parts and the pent water runs down the dry channel at the lens.
  const CUT = beatT(488);                               // 261.754: the stroke that parts the log
  function H1(t, lt, dur) {
    const S = LAND(); reset(S);
    const { P, cast, props } = S, D = cast.dresser;
    S.verge.visible = false;
    // the water: pooled behind the log (level up), then released down the fine ribbon below it
    const rel = seg(t, CUT + .06, CUT + .9), front = S_LOG + (t < CUT + .06 ? 0 : 12.5 * (t - CUT - .06) - 2.5 * Math.exp(-(t - CUT - .06) * 6) + 2.5);
    S.water.geometry.setDrawRange(0, 12 * Math.round(S_LOG / 2.5 + .5)); S.water.position.y = .22 * (1 - ease(rel));
    S.surge.visible = t > CUT + .06; S.surge.geometry.setDrawRange(0, 12 * Math.max(0, Math.round((front - S_LOG) / .25)));
    // the log halves: still, then swung downstream by the water at the cut
    const sw = t < CUT + .04 ? 0 : .42 * easeOut(seg(t, CUT + .04, CUT + .7));
    for (const L of S.logs) L.piv.rotation.y = L.base + L.sgn * sw * (L.sgn > 0 ? 1 : .8);
    // the dresser on the left bank (screen right), chopping the log at the channel's near side
    D.root.visible = true; props.axe.visible = true;
    // he stands on the left bank just upstream of the log (not on it), and chops down into its near side
    const cutP = onPath(P, S_LOG - .05, LOGCUT + .3, 1.0), st = onPath(P, S_LOG - 2.6, -(W0 + 2.1)); st[1] = surfY(S, st[0], st[2]);
    const yaw = Math.atan2(cutP[0] - st[0], cutP[2] - st[2]) + .25;
    const back = seg(t, CUT + .25, CUT + .9), [ttx, ttz] = tanAt(P, S_LOG);
    PEOPLE.at(D, [st[0] - ttx * ease(back) * .6, st[1], st[2] - ttz * ease(back) * .6], yaw + ease(back) * .3);
    PEOPLE.clip(D, 'Idle_Loop', t + .4);
    if (t < CUT) PROPS.swing(D, props.axe, frac(bpOf(t) / 2 + 1e-6), { target: cutP });
    else {
      // held in the cut, then the axe comes out and down to his side while he watches the water go
      const b = ease(seg(t, CUT + .15, CUT + .75));
      const r1 = PROPS.swing(D, null, 1, { target: cutP }), hr1 = PEOPLE.hand(D, 'r'), hl1 = PEOPLE.hand(D, 'l');
      PEOPLE.clip(D, 'Idle_Loop', t + .4);
      PEOPLE.turn(D, 'spine_02', [.21 * (1 - b), 0, 0]); PEOPLE.turn(D, 'spine_03', [.17 * (1 - b), 0, 0]);
      const hr0 = PEOPLE.hand(D, 'r'), hl0 = PEOPLE.hand(D, 'l');
      const rest = hr0.clone().add(new THREE.Vector3(.15, .35, .25));
      PEOPLE.reach(D, 'l', hl1.clone().lerp(hl0, b).toArray(), [st[0] + 1, st[1] + 3, st[2] - 1.5]);
      PEOPLE.reach(D, 'r', hr1.clone().lerp(rest, b).toArray(), [st[0] + 1.5, st[1] + 3, st[2] + 1]);
      PEOPLE.turn(D, 'neck_01', [.25 * b, -.35 * b, 0]);
      const hd = r1.head.clone().lerp(new THREE.Vector3(st[0] - .6, st[1] + .1, st[2] + 1.4), b);
      PROPS.place(props.axe, PEOPLE.hand(D, 'r'), hd);
    }
    // the hand up by the drain head, trimming the bank with her shovel (drive, lever, lift, throw: one dig every two
    // beats, off the dresser's strokes); the labourer carries cut brush off the line
    const Hd = cast.hand, Lb = cast.lab; Hd.root.visible = Lb.root.visible = true; props.shovel.visible = true;
    const hp = onPath(P, 8, -(W0 + 3.6)); hp[1] = surfY(S, hp[0], hp[2]);
    const hyaw = Math.atan2(P[3].nx, P[3].nz) - .35;     // facing the channel, a little downstream
    PEOPLE.at(Hd, hp, hyaw); PEOPLE.clip(Hd, 'Idle_Loop', t * .9 + 1.3);
    const fwH = [Math.sin(hyaw), Math.cos(hyaw)], rtH = [-Math.cos(hyaw), Math.sin(hyaw)];
    const dg = frac(bpOf(t) / 2 + .5);                  // 0..1 through one dig
    // the blade's tip: driven into the bank (0-.3), levered (.3-.5), lifted and swung to the side (.5-.8), back (.8-1)
    const tipF = kf(dg, [[0, 1.9], [.3, 1.75], [.5, 1.6], [.8, 1.2], [1, 1.9]]), tipY = kf(dg, [[0, .9], [.3, -.1], [.5, .1], [.8, 1.6], [1, .9]]);
    const tipR = kf(dg, [[0, .2], [.5, .2], [.8, -1.4], [1, .2]]);
    const tip = [hp[0] + fwH[0] * tipF + rtH[0] * tipR, hp[1] + tipY, hp[2] + fwH[1] * tipF + rtH[1] * tipR];
    const lean = kf(dg, [[0, .25], [.3, .45], [.5, .35], [.8, .05], [1, .25]]);
    PEOPLE.turn(Hd, 'spine_02', [lean * .6, 0, 0]); PEOPLE.turn(Hd, 'spine_03', [lean * .4, 0, 0]);
    const gripHi = [hp[0] + fwH[0] * .35 + rtH[0] * .15, hp[1] + kf(dg, [[0, 3.4], [.3, 3.2], [.5, 2.6], [.8, 3.3], [1, 3.4]]), hp[2] + fwH[1] * .35 + rtH[1] * .15];
    const dir = new THREE.Vector3(...tip).sub(new THREE.Vector3(...gripHi)).normalize();
    const gripLo = new THREE.Vector3(...gripHi).addScaledVector(dir, 1.3).toArray();
    PEOPLE.reach(Hd, 'r', gripHi, [hp[0] + rtH[0] * 1.6, hp[1] + 3, hp[2] + rtH[1] * 1.6]);
    PEOPLE.reach(Hd, 'l', gripLo, [hp[0] - rtH[0] * 1.6, hp[1] + 2.5, hp[2] - rtH[1] * 1.6]);
    PROPS.place(props.shovel, new THREE.Vector3(...gripHi).addScaledVector(dir, -.25), tip);
    const lk = seg(t, 259.9, 263.1), lx = lerp(-13, -19.5, lk), lz = lerp(24, 27, lk);
    PEOPLE.at(Lb, [lx, S.gy(lx, lz), lz], -Math.PI / 2 - .45); PEOPLE.clip(Lb, 'Walk_Carry_Loop', t * .95);
    { const a = PEOPLE.hand(Lb, 'l'), b = PEOPLE.hand(Lb, 'r'); S.brush.visible = true; S.brush.position.copy(a).add(b).multiplyScalar(.5); S.brush.rotation.set(0, -Math.PI / 2 - .45, 0); }   // an armful of cut brush
    // camera: standing in the dry channel below the log, looking up the drain to the rig; it rises and backs off as the water comes
    const cam = S.cam; cam.fov = 48; cam.updateProjectionMatrix();
    const k = ease(seg(t, 259.9, CUT)), q = ease(seg(t, CUT + .25, 263.05));
    const cp = onPath(P, S_LOG + lerp(16.5, 15, k) + q * 2.5, lerp(1.3, 1.1, k), lerp(5.6, 5.4, k) + q * 2);
    const tg = onPath(P, S_LOG - lerp(4, 4.5, k) + q * 9, lerp(-1.5, -1.7, k) + q * 1.3, lerp(2.9, 2.8, k) - q * 2.2);
    aimSun(S.o, [8, 4, 30], 60, 18, 2.6, '#FFE4BC');
    skyH('#86AFC8', '#F2DDB0');
    P3.look(cam, cp, tg);
    P3.draw(S.o, cam, { fog: [160, 1700], fogCol: '#EFDDB4', lineW: 1.8, lightTint: .6 });
    // chips off the cut on each stroke; spray and foam where the water breaks through and at its running front
    const [cx, cy, cd] = P3.project(cam, cutP);
    for (const tb of [beatT(486), CUT]) {
      const a = t - tb; if (a < 0 || a > .45) continue;
      seed('Hchip' + tb);
      for (let i = 0; i < 9; i++) {
        const ang = -Math.PI / 2 + (hash(i * 3 + tb) - .5) * 2.6, v = (380 + hash(i * 5 + tb) * 520) * 9 / cd, px = cx + Math.cos(ang) * v * a, py = cy + Math.sin(ang) * v * a + 1500 * a * a;
        pline([[px, py], [px + Math.cos(ang + 1.2) * 7, py + Math.sin(ang + 1.2) * 7]], 1.3, '#E3C48E', { over: 0, passes: 1, alpha: 1 - a / .45 });
      }
    }
    if (t > CUT) {
      foam(S, cam, S_LOG + .8, (1 - seg(t, CUT + .2, CUT + 1.2)) * .9, 'Hbreak');
      foam(S, cam, front, seg(t, CUT + .1, CUT + .3), 'Hfront');
    }
    if (lt < .35) scribbleWipe(.5 + lt / .7);
  }


  // ---------------------------------------------------------------- H2 · 263.05 [64] glimmers in the shadow, flashes in the sun
  // Down in the channel with the water, riding along behind a gum-leaf sprig: dappled shade under the coolibahs (soft
  // glimmers), then out into the low sun (hard flashes). One flash flares to white: the cut to the aerial.
  const FLOW = 3.4;                                        // ft/s
  let WSTYLE = .8;
  const inShade = (S, p, el) => {                          // does the ray from p toward the sun pass through a leaf clump?
    const d = sunDir(el), L = Math.hypot(...d), u = d.map(v => v / L);
    for (const { c, r } of S.clumps) {
      const w = [c[0] - p[0], c[1] - p[1], c[2] - p[2]], along = w[0] * u[0] + w[1] * u[1] + w[2] * u[2];
      if (along < 0) continue;
      const q = [w[0] - u[0] * along, w[1] - u[1] * along, w[2] - u[2] * along];
      if (q[0] * q[0] + q[1] * q[1] + q[2] * q[2] < r * r) return true;
    }
    return false;
  };
  // the leaf shadows on the moving water, drawn in pencil: each leaf clump's shadow on the water plane is an ellipse
  // (r across the light, r / sin(elevation) along it), clipped to the channel; this matches the 3D shadows on the banks
  function waterShade(S, cam, s0, s1, el, col, a, o = {}) {
    const edge = sd => { const out = []; for (let s = s0; s <= s1; s += .8) { const q = P3.project(cam, onPath(S.P, s, sd * WE, WL + .01)); if (q[2] > .35) out.push(q); } return out; };
    const L = edge(-1), R = edge(1); if (L.length < 2 || R.length < 2) return;
    const d = sunDir(el), dl = Math.hypot(...d), u = d.map(v => v / dl), hl = Math.hypot(u[0], u[2]), uh = [u[0] / hl, u[2] / hl], sE = u[1];
    const a0 = onPath(S.P, s0), a1 = onPath(S.P, s1), yw = (a0[1] + a1[1]) / 2 + WL;
    X.save(); X.beginPath(); X.moveTo(L[0][0], L[0][1]); for (const q of L) X.lineTo(q[0], q[1]); for (const q of R.reverse()) X.lineTo(q[0], q[1]); X.closePath(); X.clip();
    if (o.sheen) {      // the sunlit water throws back the bright low sky: a warm pale sheen, strongest toward the sun
      const [sx, sy] = o.sun, g = X.createRadialGradient(sx, sy, 0, sx, sy, 1500);
      g.addColorStop(0, 'rgba(255,238,200,.75)'); g.addColorStop(.5, 'rgba(250,236,210,.35)'); g.addColorStop(1, 'rgba(240,236,224,.12)');
      X.globalAlpha = o.sheen; X.fillStyle = g; X.fillRect(0, 0, W, H);
      X.globalAlpha = .5 * o.sheen; X.fillStyle = pat('#FFF6E0', 'h'); X.fillRect(0, 0, W, H); X.globalAlpha = 1;
    }
    X.beginPath();
    for (const { c, r } of S.clumps) {
      const k = (c[1] - yw) / sE, cx = c[0] - u[0] * k, cz = c[2] - u[2] * k;
      let first = true;
      for (let j = 0; j <= 14; j++) {
        const an = j / 14 * TAU, ca = Math.cos(an) * r, sa = Math.sin(an) * r / sE;
        const q = P3.project(cam, [cx - uh[1] * ca + uh[0] * sa, yw, cz + uh[0] * ca + uh[1] * sa]);
        if (q[2] < .35) { first = true; continue; }
        if (first) { X.moveTo(q[0], q[1]); first = false; } else X.lineTo(q[0], q[1]);
      }
      X.closePath();
    }
    X.globalAlpha = .45 * a; X.fillStyle = col; X.fill();
    X.globalAlpha = .85 * a; X.fillStyle = pat(mixCol(col, AP.graphite, .3), 'h'); X.fill();
    // sun flecks: light through the gaps in the leaves, stretched along the low sun; fixed on the ground, not on the water
    X.beginPath();
    for (let i = 0; i < 420; i++) {
      const sf = Math.floor(s0) + hash(i * 2.9) * (s1 - s0), of = (hash(i * 4.1) - .5) * 2 * W0, p = onPath(S.P, sf, of, WL + .01);
      if (!inShade(S, p, el)) continue;
      const rr = .04 + hash(i * 6.7) * .1, ln = rr / sE * .6;
      let first = true;
      for (let j = 0; j <= 10; j++) {
        const an = j / 10 * TAU, ca = Math.cos(an) * rr, sa = Math.sin(an) * ln, q = P3.project(cam, [p[0] - uh[1] * ca + uh[0] * sa, p[1], p[2] + uh[0] * ca + uh[1] * sa]);
        if (q[2] < .35) { first = true; continue; }
        if (first) { X.moveTo(q[0], q[1]); first = false; } else X.lineTo(q[0], q[1]);
      }
      X.closePath();
    }
    X.globalAlpha = .45 * a; X.fillStyle = '#DCEBF0'; X.fill();
    X.globalAlpha = .9 * a; X.fillStyle = pat('#F4F1E4', 'h'); X.fill();
    X.restore();
  }
  function H2(t, lt, dur) {
    const S = LAND(); reset(S);
    const { P } = S, EL = 14;
    const ss = S2 + 3 + FLOW * lt, off = .35 * Math.sin(lt * .8), sp = onPath(P, ss, off, WL + .02 + .02 * Math.sin(lt * 5));
    S.water.material.userData.style = WSTYLE;         // flat-lit water here, so the dappled shade reads; the light is drawn on top
    S.sprig.visible = true; S.sprig.position.set(...sp); const [tx, tz] = tanAt(P, ss); S.sprig.rotation.set(0, Math.atan2(-tz, tx) + .5 + lt * .22, .03 * Math.sin(lt * 4));
    const cam = S.cam; cam.fov = 42; cam.updateProjectionMatrix();
    // looking down on the sprig in the shaded water; then the camera sinks to the water and lifts its eyes up the reach
    // to the sun, low under the coolibahs
    const up = ease(seg(lt, 2.2, 4.6)), k = ease(seg(lt, 0, dur));
    const cp = onPath(P, ss - lerp(3.4, 4.6, up), lerp(-.7, -.4, up), lerp(4.2, 2.6, up) + k * .1);
    const tg = onPath(P, ss + lerp(.9, 16, up), lerp(.4, .2, up), lerp(.15, .9, up));
    aimSun(S.o, onPath(P, ss + 30, 0, 8), 60, EL, 2.6, '#FFD9A6');
    skyH('#8DB3CA', '#F3DCAA');
    P3.look(cam, cp, tg);
    const [sx, sy] = sunScreen(cam, EL);
    lowSun(sx, sy, 30, 1);
    P3.draw(S.o, cam, { fog: [140, 1500], fogCol: '#F2DCAE', lineW: 1.6, lightTint: .62, near: .3 });
    seed('Hshade'); waterShade(S, cam, ss - 8, ss + 70, EL, '#2E4E66', 1, { sheen: .55, sun: [sx, sy] });
    // light on the water: the glints ride the current. In shade they glimmer (the bright sky); in the sun they flash where
    // the water throws the sun back at the lens (a glitter path under the sun)
    seed('Hglint');
    const u = sunDir(EL), ul = Math.hypot(...u), c = cam.position;
    for (let i = 0; i < 150; i++) {
      const s0 = S2 + ((hash(i * 3.1) * 44 + FLOW * lt) % 44), o = (hash(i * 7.7) - .5) * 2 * W0, p = onPath(P, s0, o, WL + .01);
      const [x, y, d] = P3.project(cam, p); if (d < .8 || x < -20 || x > W + 20 || y > 890 || y < 0) continue;
      const shaded = inShade(S, p, EL), ph = hash(i * 5.3), rate = .6 + hash(i * 9.1) * 1.1;
      const v = [p[0] - c.x, -(p[1] - c.y), p[2] - c.z], vl = Math.hypot(...v), spec = (v[0] * u[0] + v[1] * u[1] + v[2] * u[2]) / (vl * ul);
      const sz = clamp(70 / d, 1.4, 10);
      if (shaded) { const tw = Math.pow(Math.max(0, Math.sin((lt * rate + ph) * TAU)), 2); glint(x, y, sz * 1.1, .8 * tw); }
      else { const tw = Math.pow(Math.max(0, Math.sin((lt * rate * 1.6 + ph) * TAU)), 5), g = smoothstep(.55, .98, spec); glint(x, y, sz * (1.2 + g), clamp(.5 + g) * tw, (.55 + .45 * g) * tw); }
    }
    // the sun behind the crowns bleeds through the leaves
    pglow(sx, sy, 420, '#FFE9B8', .55 * ease(seg(lt, 2.4, 4.4)));
    // the flare: one flash in the sun grows until it whites out the frame
    const fk = seg(lt, dur - .45, dur);
    if (fk > 0) {
      const fp = P3.project(cam, onPath(P, ss + 7, -.6, WL + .01));
      pglow(fp[0], fp[1], 60 + 2400 * easeIn(fk), '#FFF6DC', .6 + fk);
      X.save(); X.globalAlpha = easeIn(fk); X.fillStyle = AP.paperLt; X.fillRect(0, 0, W, H); X.restore();
    }
  }


  // ---------------------------------------------------------------- H3 · 269.05 [65] by the silent belts of timber, the miles of blazing plain
  // Out of the flash, an aerial: low over a belt of timber along the drain, then lifting as the plain opens ahead with
  // the drain's green thread winding across it into the haze.
  function H3(t, lt, dur) {
    const S = LAND(); reset(S);
    const { P } = S, EL = 11;
    // low over the belt of timber the drain runs under, the crowns sliding by below; then up and out over the plain, the
    // drain's thread winding away across it toward the next belts and the low sun
    const k = seg(lt, 0, dur), up = ease(seg(lt, .3, dur));
    const sc = lerp(318, 520, k * .7 + .3 * ease(k));
    const cam = S.cam; cam.fov = 50; cam.updateProjectionMatrix();
    const cp = onPath(P, sc, lerp(34, 10, up), lerp(52, 128, up));
    const tg = onPath(P, sc + lerp(70, 420, up), lerp(-8, -30, up), lerp(0, 58, up));
    aimSun(S.o, onPath(P, sc + 200, 0, 0), 380, EL, 3, '#FFD7A0');
    waterLook(S, '#5A9AC2', .5);                       // from the air the water holds the sky
    P3.look(cam, cp, tg, .05 * Math.sin(lt * .9) - .03);
    skyCam(cam, '#8FB0C6', '#F6D7A0', { span: 900 });
    const [sx, sy] = sunScreen(cam, EL); lowSun(sx, sy, 36, 1);
    P3.draw(S.o, cam, { fog: [240, 2600], fogCol: '#F4D8A6', lineW: 1.4, lightTint: .7 });
    // out of the white
    if (lt < .45) { X.save(); X.globalAlpha = 1 - easeOut(lt / .45); X.fillStyle = AP.paperLt; X.fillRect(0, 0, W, H); X.restore(); }
  }

  // ---------------------------------------------------------------- H4 · 272.10 [66] bringing hope and comfort to the thirsty land
  // The watering place: cattle drinking round the pool where the drain spreads, the banks green, and the squatter
  // kneeling at the edge: he dips his hands, lifts the water, holds it, then raises his eyes down the drain.
  // cattle round the pool, in pool coordinates [along the drain, to its right, clip, turn]; the squatter kneels at the head
  const COWSPOTS = [[-1, -12.5, 'Idle_Headlow', .15], [9, -9.5, 'Idle_Headlow', -.2], [14, 7.5, 'Idle_Headlow', .3], [21, -1.5, 'Idle_Headlow', 0], [4, 13.5, 'Idle', -.6], [44, 2, 'Walk', 0]];
  function H4(t, lt, dur) {
    const S = LAND(); reset(S);
    const { P, cast, cows, props } = S, EL = 9.5, Q = cast.squatter;
    const pc = onPath(P, POOL[0]), [ptx, ptz] = tanAt(P, POOL[0]), loc = (a, b) => [pc[0] + ptx * a - ptz * b, pc[2] + ptz * a + ptx * b];
    // cattle round the water, each on its own phase; one more comes up the drain toward the pool
    COWSPOTS.forEach(([a, b, clip, tw], i) => {
      const c = cows[i]; c.root.visible = true;
      const walk = clip === 'Walk' ? (t - 272.1) * 2.3 : 0, [x, z] = loc(a - walk, b);
      const yaw = clip === 'Walk' ? Math.atan2(-ptx, -ptz) : Math.atan2(pc[0] - x, pc[2] - z) + tw;
      PEOPLE.at(c, [x, S.gy(x, z) + .05, z], yaw);
      PEOPLE.clip(c, clip, t * (.9 + hash(i) * .2) + hash(i * 3) * 3);
    });
    // the squatter kneels bare-headed at the head of the pool, facing down it into the low sun (his hat on the ground)
    const [kx, kz] = loc(-15.5, 3.2), face = Math.atan2(ptx, ptz) - .42, gq = S.gy(kx, kz), kp = [kx, gq, kz];
    const fw = [Math.sin(face), Math.cos(face)], rs = [-Math.cos(face), Math.sin(face)];     // his facing, his right-hand side
    Q.root.visible = true; if (Q.hat) Q.hat.visible = false;
    props.hatS.visible = true; PROPS.at(props.hatS, [kx - rs[0] * 1.7 - fw[0] * .6, gq + .02, kz - rs[1] * 1.7 - fw[1] * .6], [0, face + 1, 0]);
    PEOPLE.at(Q, [kx, gq + .05, kz], face);
    PEOPLE.clip(Q, 'Fixing_Kneeling', .9 + lt * .04);
    // hands: in the water, lifted cupped to his chest, held; then he raises his eyes down the drain
    const lift = ease(seg(t, 273.15, 274.55)), look = ease(seg(t, 275.9, 276.9));
    PEOPLE.turn(Q, 'spine_02', [-.3 * lift, 0, 0]); PEOPLE.turn(Q, 'spine_03', [-.14 * lift - .1 * look, 0, 0]);
    const wy = gq + .34, cupY = lerp(wy + .05, gq + 2.3, lift), cupF = lerp(1.95, 1.3, lift);
    const cup = [kx + fw[0] * cupF, cupY + .06 * Math.sin(lt * 1.7) * lift, kz + fw[1] * cupF];
    for (const [sd, side] of [[-1, 'l'], [1, 'r']]) {
      const hp = [cup[0] + rs[0] * sd * lerp(.32, .19, lift), cup[1], cup[2] + rs[1] * sd * lerp(.32, .19, lift)];
      PEOPLE.reach(Q, side, hp, [kx + rs[0] * sd * 1.6, cup[1] - .6, kz + rs[1] * sd * 1.6]);
    }
    PEOPLE.turn(Q, 'neck_01', [lerp(.42, -.22, look) - .12 * lift, 0, 0]); PEOPLE.turn(Q, 'Head', [-.3 * look, .12 * look, 0]);
    // camera: from behind his right shoulder, over him to the cattle at the pool and the low sun; it swings round to his
    // right and in, until his lit face and the water in his hands fill the right of the frame
    const cam = S.cam; cam.fov = 40; cam.updateProjectionMatrix();
    const arc = ease(seg(lt, .4, dur - .2)), ang = lerp(2.05, .95, arc), rad = lerp(8.5, 5.4, arc);
    const cp = [kx + (fw[0] * Math.cos(ang) + rs[0] * Math.sin(ang)) * rad, gq + lerp(5.6, 3.1, arc), kz + (fw[1] * Math.cos(ang) + rs[1] * Math.sin(ang)) * rad];
    const tgA = [pc[0] - ptx * 3, gq + .6, pc[2] - ptz * 3], tgB = [cup[0] - rs[0] * 1.3 + fw[0] * .5, gq + 2.8, cup[2] - rs[1] * 1.3 + fw[1] * .5];
    const tg = tgA.map((v, i) => lerp(v, tgB[i], ease(seg(lt, .5, dur - .5))));
    aimSun(S.o, onPath(P, POOL[0], 0, 3), 60, EL, 3, '#FFCF94');
    skyH('#8FAEC4', '#F5D3A0', { split: .7 });
    P3.look(cam, cp, tg);
    const [sx, sy] = sunScreen(cam, EL); lowSun(sx, sy, 34, 1);
    P3.draw(S.o, cam, { fog: [160, 1600], fogCol: '#F3D6A4', lineW: 1.7, lightTint: .7, near: .3 });
    // the water in his hands: a small bright pool catching the sky and the sun, running from his fingers once he lifts it
    const [cx, cy, cd] = P3.project(cam, [cup[0], cup[1] + .1, cup[2]]);
    if (lift > .05) {
      seed('Hcup');
      const rx = 290 / cd, ry = 95 / cd;
      pglow(cx, cy, 5 * rx, '#FFE9C0', .45 * lift);
      pfill(ellPts(cx, cy, rx, ry, 16), '#A9D4E6', { tone: .85 * lift, dens: .6 * lift, ink: null });
      plit(ellPts(cx - rx * .25, cy - ry * .2, rx * .45, ry * .35, 10), .9 * lift, '#F4FAFC');
      glint(cx - rx * .3, cy - ry * .25, 5, lift, lift * (.6 + .4 * Math.sin(lt * 5)));
      for (let i = 0; i < 6; i++) {      // drips from the edge of his hands
        const ph = frac(lt * (.9 + hash(i) * .7) + hash(i * 7)), dx = (hash(i * 3) - .5) * 2 * rx, fall = ph * ph * 2600 / cd;
        pline([[cx + dx, cy + ry + fall], [cx + dx, cy + ry + fall + 70 / cd]], 1.2, '#EAF6FA', { over: 0, passes: 1, alpha: lift * (1 - ph) });
      }
    }
    // before he lifts it: rings on the water where his hands go in
    if (lift < 1) {
      seed('Hrings');
      for (let i = 0; i < 3; i++) {
        const q = frac(lt * .7 + i / 3), [x, y, d] = P3.project(cam, [kx + fw[0] * 1.95, gq + WL - .02, kz + fw[1] * 1.95]), r = (1 + q * 5) * 180 / d;
        pline(ellPts(x, y, r, r * .3, 20), 1, '#EAF6FA', { closed: true, passes: 1, alpha: .7 * (1 - q) * (1 - lift) });
      }
    }
  }

  // ---------------------------------------------------------------- H5 · 277.19 [67] flowing, ever flowing, further down
  // His eyeline: down the drain into the sunset. The camera rises from the water's edge until the drain is a bright thread
  // winding away to the horizon under the sun; at the end it lifts to the evening sky (the bridge to the rig).
  const SUNSET_TOP = '#6F8FB2', SUNSET_BOT = '#F2B77E';
  function H5(t, lt, dur) {
    const S = LAND(); reset(S);
    const { P } = S, EL = 7;
    const k = easeOut(seg(lt, 0, 2.4)) * .85 + .15 * seg(lt, 0, dur), up = easeIn(seg(lt, dur - .9, dur)) * .7 + .3 * ease(seg(lt, dur - .9, dur));
    const cam = S.cam; cam.fov = 44; cam.updateProjectionMatrix();
    const cp = onPath(P, lerp(770, 810, k), lerp(-3, 6, k), lerp(8, 92, k));
    const tg0 = onPath(P, lerp(1500, 1500, k), lerp(-20, -14, k), lerp(40, -20, k));
    const tg = [tg0[0], tg0[1] + up * 1150, tg0[2]];
    aimSun(S.o, onPath(P, 1000, 0, 0), 900, EL, 3.2, '#FFB57A');
    S.o.fill.intensity = .28;
    waterLook(S, '#8FBCD2', .5);                       // the drain holds the evening sky
    dusk(S, .8);
    P3.look(cam, cp, tg);
    skyCam(cam, SUNSET_TOP, SUNSET_BOT);
    const [sx, sy] = sunScreen(cam, EL);
    pglow(sx, sy + 40, 1100, '#F6A860', .45);
    lowSun(sx, sy, 50, 1, '#FBE0A8');
    P3.draw(S.o, cam, { fog: [300, 3200], fogCol: '#EFC697', lineW: 1.35, lightTint: .85 });
    // glitter where the drain runs under the sun (points on the water, so they sit on the thread)
    seed('Hglit5');
    for (let i = 0; i < 40; i++) {
      const sq = lerp(900, S.END, hash(i * 4.3)), q = P3.project(cam, onPath(P, sq, (hash(i * 2.1) - .5) * 3, WL + .05)); if (q[2] < 1 || q[1] > 890) continue;
      const toward = clamp(1 - Math.abs(q[0] - sx) / 380), tw = Math.pow(Math.max(0, Math.sin((lt * (.8 + hash(i) * .8) + hash(i * 3)) * TAU)), 5);
      if (toward > .05) glint(q[0], q[1], 2.5, tw * toward, tw * toward);
    }
  }

  // ---------------------------------------------------------------- H6 · 281.10 [68–69] final chorus: the crew at the rig, the plant still
  // Down out of the evening sky onto the derrick against the sun. The plant is still at last; the bore runs from its pipe
  // into the pool, steaming in the cool air. The crew in silhouette, long shadows toward us: the dresser grounds his
  // sledge and leans on it; the boss takes off his hat. At the end the page is turned back to the beginning.
  const EL6 = 5.5;
  let H6F = [30, 360];
  const H6D = { p: [-5.9, 0, -30.8], yaw: .55 };
  function H6(t, lt, dur) {
    const S = LAND(); reset(S);
    const { P, cast, props, U } = S, fy = U.floorY;
    S.o.fill.intensity = .2;
    // the crew behind the still derrick, the low sun beyond it: silhouettes, their long shadows reaching back to us
    const D = cast.dresser, Dr = cast.driller, B = cast.boss, Bi = cast.bill, Hd = cast.hand;
    for (const p of [D, Dr, B, Bi, Hd]) { p.root.visible = true; silhouette(p, .85); }
    // the driller at the foot of the derrick, a hand on its back leg, looking up through it
    PEOPLE.at(Dr, [-6.6, 0, -10.4], Math.PI * .75); PEOPLE.clip(Dr, 'Idle_Loop', t * .8 + 1.1);
    PEOPLE.reach(Dr, 'r', [-7.75, 4.4, -8.6], [-6.2, 3.4, -9.4]); PEOPLE.turn(Dr, 'neck_01', [-.4, 0, 0]);
    // the hand sits on a chopping block by the band wheel; Bill stands by her, arms folded
    props.block.visible = true; PROPS.at(props.block, [18.8, 0, -11.2]);
    PEOPLE.at(Hd, [18.8, 0, -10.5], Math.PI + .35); PEOPLE.clip(Hd, 'Sitting_Idle_Loop', t * .7 + .4);
    PEOPLE.at(Bi, [22.5, 0, -8.5], -Math.PI * .85); PEOPLE.clip(Bi, 'Idle_FoldArms_Loop', t * .9 + 2);
    // the dresser leans on his sledge: head down on the ground, both hands stacked on the end of the handle
    const dp = H6D.p, dyaw = H6D.yaw;
    PEOPLE.at(D, dp, dyaw); PEOPLE.clip(D, 'Idle_Loop', t * .6 + .3);
    const fwD = [Math.sin(dyaw), Math.cos(dyaw)], rtD = [-Math.cos(dyaw), Math.sin(dyaw)];
    props.sledge.visible = true;
    const headP = [dp[0] + fwD[0] * 1.35 + rtD[0] * .25, .22, dp[2] + fwD[1] * 1.35 + rtD[1] * .25];
    const endP = [dp[0] + fwD[0] * 1.05 + rtD[0] * .15, 3.35 + .03 * Math.sin(t * 1.4), dp[2] + fwD[1] * 1.05 + rtD[1] * .15];
    PROPS.place(props.sledge, endP, headP);           // grip at the top of the handle, the head down on the ground
    PEOPLE.turn(D, 'spine_02', [.1, 0, 0]);
    PEOPLE.reach(D, 'r', [endP[0], endP[1] + .05, endP[2]], [dp[0] + rtD[0] * 1.6, 3.2, dp[2] + rtD[1] * 1.6]);
    PEOPLE.reach(D, 'l', [endP[0], endP[1] + .22, endP[2]], [dp[0] - rtD[0] * 1.6, 3.2, dp[2] - rtD[1] * 1.6]);
    PEOPLE.turn(D, 'neck_01', [.08, 0, 0]);
    // the boss, facing the derrick, takes off his hat and holds it at his chest
    const bp = [-4, 0, -44], byaw = 1.35, hk = ease(seg(t, 284.2, 285.2));
    PEOPLE.at(B, bp, byaw); PEOPLE.clip(B, 'Idle_Loop', t * .75 + 1.7);
    const bh = PEOPLE.head(B), fwB = [Math.sin(byaw), Math.cos(byaw)];
    if (B.hat) B.hat.visible = t < 284.45;
    props.hatB.visible = t >= 284.45;
    const onHead = [bh.x, bh.y + .45, bh.z], atChest = [bh.x + fwB[0] * .75, bh.y - 1.5, bh.z + fwB[1] * .75];
    const hatP = kf(t, [[284.2, onHead], [284.6, [bh.x + fwB[0] * .3, bh.y + .75, bh.z + fwB[1] * .3]], [285.25, atChest]]);
    if (t > 284.1) PEOPLE.reach(B, 'r', [hatP[0], hatP[1] - .1, hatP[2]], [bp[0] - 1.3, bh.y - .8, bp[2] + .4]);
    if (props.hatB.visible) PROPS.at(props.hatB, hatP, [lerp(0, -1.2, hk), byaw, 0]);
    // camera: down out of the evening sky onto the still derrick, low behind it; the sun low through its lower bracing
    const cam = S.cam; cam.fov = 40; cam.updateProjectionMatrix();
    const tilt = ease(seg(lt, .08, 1.3)), k = ease(seg(lt, .5, dur));
    const cp = [lerp(3.4, 2.6, k), lerp(2.3, 2.2, k), lerp(-57, -55.5, k)];
    const pitch = lerp(1.08, .175, tilt) - .01 * k, tgz = 0, dz = tgz - cp[2];
    const tg = [lerp(-1.6, -2.4, k), cp[1] + Math.tan(pitch) * dz, tgz];
    aimSun(S.o, [4, 4, -30], 60, EL6, 3.4, '#FFA866');
    waterLook(S, '#E8CFA8', .5); dusk(S, .9);
    P3.look(cam, cp, tg);
    skyCam(cam, SUNSET_TOP, SUNSET_BOT);
    const [sx, sy] = sunScreen(cam, EL6);
    pglow(sx, sy + 30, 1300, '#F6A25A', .5);
    lowSun(sx, sy, 44, 1, '#FCE2A8');
    P3.draw(S.o, cam, { fog: H6F, fogCol: '#EFC393', lineW: 1.6, lightTint: .9, ink: '#2A2622' });
    pglow(sx, sy, 200, '#FFE3AE', .4);                   // the sun bleeds round the timbers
    // the hot bore water steams in the cooling air: wisps rising off the pool and the drain beyond the floor, lit from behind
    seed('Hsteam');
    for (let i = 0; i < 14; i++) {
      const q0 = frac(lt * .16 + hash(i * 3.3)), src = i < 6 ? [1.6 + (hash(i * 7) - .5) * 6, .6, 15.4 + (hash(i * 9) - .5) * 6] : onPath(P, 18 + hash(i) * 40, (hash(i * 5) - .5) * 3, WL);
      const at = q => [src[0] + Math.sin(q * 6 + i) * 1.4 + q * 2, src[1] + 1.5 + q * 16, src[2] - q * 2];
      const pts = []; for (let j = 0; j < 8; j++) { const pp = P3.project(cam, at(q0 * .7 + j * .05)); if (pp[2] > 1) pts.push([pp[0], pp[1]]); }
      const fade = Math.sin(q0 * Math.PI);
      const [x, y, d] = P3.project(cam, at(q0)); if (d > 1) psmoke(x, y, (2.5 + q0 * 6) * 900 / d, '#FBE3C0', .22 * fade);
      if (pts.length > 2) pline(pts, 1.3, '#FFF0D8', { over: 0, passes: 1, alpha: .6 * fade, curv: true, taper: .9 });
    }
    if (lt > dur - .35) pageTurn((lt - (dur - .35)) / .7, 1);
  }


  // ---------------------------------------------------------------- H7 · 286.52 [70–72] THE RHYME, and the drawing lifts off the page
  // The page turned back to the first: the station, framed exactly as the film's opening settles (chapter A's descent
  // lands at [9, 6.2, 44] looking at [-8, 6, -10], 40°), now green and full: the waterhole brimming, the coolibah in
  // leaf, the windmill turning, cattle drinking, a bore drain running in. The sun sets behind us, in the west. Then the
  // camera pulls back up A's descent, reversed, and the drawing lifts off the page the way it came on: colour first,
  // then the graphite, from the edges in to the waterhole last, until only the paper and the strip remain.
  const STATION_H = () => P3.cached('H-station', () => {
    const o = P3.scene({ sunDir: sunDir(3), sun: 3, fill: .5, shadowSize: 200 });
    o.sun.color.set('#FFC690'); o.fill.color.set('#D4DAE8'); o.fill.groundColor.set('#8A7250');
    const st = WORLD.stationSet({ col: '#DCC296' }); o.scene.add(st);
    st.userData.ground.scale.y = .3;                       // as in chapter A: a flatter plain
    st.userData.setWet(1);
    { const sh = st.userData.shoots, m = mergeByColour(sh, o.scene); sh.clear(); sh.add(m); }
    const gcol = mixCol('#DCC296', '#9DAA66', .75);
    o.scene.add(skirt(gcol, 1960));
    const tg = new THREE.Group(); WORLD.trees(tg, 46, { r0: 190, r1: 1500, dead: .15, seed: 7 }); o.scene.add(mergeByColour(tg, o.scene));
    // a bore drain comes in from the west and runs into the waterhole
    const gy = (x, z) => 0;
    const DP = pathThrough([[5, 13], [8, 40], [4, 80], [12, 140], [30, 220], [22, 320], [-6, 430], [-20, 560], [4, 700], [30, 900]], 2.5, gy);
    const drain = new THREE.Group(); o.scene.add(drain);
    const bl = [[-(W0 + 2.6), -.1], [-(W0 + 1.8), .38], [-(W0 + 1.1), .5], [-(W0 + .5), .45], [-W0, .03]], br = bl.map(([a, b]) => [-a, b]).reverse();
    drain.add(P3.mesh(sweep(DP, bl, gy, 1), '#8E7048', { style: .8 }), P3.mesh(sweep(DP, br, gy, 1), '#8E7048', { style: .8 }));
    const dbed = P3.mesh(sweep(DP, [[-W0 - .05, .02], [0, .01], [W0 + .05, .02]], gy), '#5E4A34', { style: .8 }); dbed.castShadow = false; drain.add(dbed);
    drain.add(WORLD.water(sweep(DP, [[-(W0 + .35), .45], [0, .45], [W0 + .35, .45]], gy)));
    // cattle at the brimming water: one where the dying cow stood in chapter A (in profile, now drinking), more round the
    // far bank, a calf
    const COWS_H = [['#A77A52', .31], ['#8A4A2E', .33], ['#6E5A48', .32], ['#E2D6C0', .31], ['#A0703E', .2]];
    const cattle = COWS_H.map(([c, sc]) => { const b = PEOPLE.beast('cow', c, { scale: sc }); o.scene.add(b.root); return b; });
    return { o, st, cattle, DP, cam: P3.cam(40) };
  });
  // chapter A's descent (camera, target), which the pull back runs in reverse
  const A_POS = [[9, 6.2, 44], [10, 18, 64], [-10, 80, 130], [-90, 210, 230], [-160, 340, 330]];
  const A_TGT = [[-8, 6, -10], [-8, 5, -14], [-8, 2, -30], [-8, 0, -50], [-10, 0, -70]];
  function cr(P, k) {
    const n = P.length - 1, f = clamp(k) * n, i = Math.min(n - 1, Math.floor(f)), u = f - i;
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(n, i + 2)];
    return p1.map((_, j) => { const a = p0[j], b = p1[j], c = p2[j], d = p3[j]; return .5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u); });
  }
  // the evening sky in the east, away from the sunset: dusky blue above a pink band, the earth's shadow at the horizon
  function skyEast(cam, a = 1) {
    const f = new THREE.Vector3(); cam.getWorldDirection(f); f.y = 0; f.normalize();
    const yh = P3.project(cam, [cam.position.x + f.x * 30000, cam.position.y, cam.position.z + f.z * 30000])[1], span = 900;
    seed('HskyE');
    const g = X.createLinearGradient(0, yh - span, 0, yh + 40);
    g.addColorStop(0, '#7E90B6'); g.addColorStop(.55, '#A9A6C0'); g.addColorStop(.8, '#E6B9A9'); g.addColorStop(.93, '#D9B7AE'); g.addColorStop(1, '#AEB2C6');
    X.save(); X.globalAlpha = .62 * a; X.fillStyle = g; X.fillRect(-100, -100, W + 200, H + 200); X.restore();
    pshade(rectPts(-80, -80, W + 160, clamp(yh - span * .4 + 80, 0, H + 160)), '#7E90B6', .5 * a, { still: true });
    pshade(rectPts(-80, yh - span * .3, W + 160, span * .3 + 60), '#E6B9A9', .3 * a, { still: true, kind: 'v' });
    return yh;
  }
  // offscreen layers: run a draw with the pencil layer X redirected into a spare canvas (as chapter A's opening does)
  const LAY = [];
  function lay(i) { if (!LAY[i]) { const c = document.createElement('canvas'); c.width = W; c.height = H; LAY[i] = c.getContext('2d'); } return LAY[i]; }
  function into(i, fn) {
    const L = lay(i), keep = X;
    L.setTransform(1, 0, 0, 1, 0, 0); L.globalAlpha = 1; L.globalCompositeOperation = 'source-over'; L.clearRect(0, 0, W, H);
    X = L; try { fn(); } finally { X = keep; ZOOM = 1; PCAM = null; }
    return L;
  }
  // a mask of pencil strokes laid in the hand direction; order(x, y) → 0..1 says when each spot is reached (k: 0 bare, 1 full)
  function strokeMask(M, k, order, o = {}) {
    M.setTransform(1, 0, 0, 1, 0, 0); M.globalCompositeOperation = 'source-over'; M.globalAlpha = 1; M.clearRect(0, 0, W, H);
    if (k <= 0) return;
    if (k >= 1) { M.fillStyle = '#000'; M.fillRect(0, 0, W, H); return; }
    const a = o.ang ?? HAND, ux = Math.cos(a), uy = Math.sin(a), vx = -uy, vy = ux, len = o.len ?? 170, lane = o.lane ?? 18, soft = o.soft ?? .16;
    M.lineCap = 'round'; M.strokeStyle = '#000'; M.lineWidth = o.w ?? 30;
    const cs = [[0, 0], [W, 0], [0, H], [W, H]], us = cs.map(p => p[0] * ux + p[1] * uy), vs = cs.map(p => p[0] * vx + p[1] * vy);
    const u0 = Math.min(...us) - len, u1 = Math.max(...us) + len, v0 = Math.min(...vs) - lane, v1 = Math.max(...vs) + lane;
    let li = 0;
    for (let v = v0; v <= v1; v += lane, li++) for (let u = u0 + (li % 3) * len * .3; u <= u1; u += len * .78) {
      const cx = u * ux + v * vx + ux * len * .5, cy = u * uy + v * vy + uy * len * .5;
      const thr = clamp(order(cx, cy)) * (1 - soft) + hash(li * 17.3 + Math.round(u) * .013) * soft * .6;
      const f = clamp((k - thr) / soft); if (f <= 0) continue;
      M.globalAlpha = .55 + .45 * f;
      const ax = cx - ux * len * .5, ay = cy - uy * len * .5;
      M.beginPath(); M.moveTo(ax, ay); M.lineTo(ax + ux * len * f, ay + uy * len * f); M.stroke();
    }
    M.globalAlpha = 1;
  }
  function masked(L, M) { L.save(); L.setTransform(1, 0, 0, 1, 0, 0); L.globalCompositeOperation = 'destination-in'; L.drawImage(M.canvas, 0, 0); L.restore(); }
  function stamp(L, a = 1) { X.save(); X.setTransform(1, 0, 0, 1, 0, 0); X.globalAlpha = a; X.drawImage(L.canvas, 0, 0); X.restore(); }
  // the graphite underdrawing: every surface white and the sky light raised, so contours and cast shadows carry it
  function drawSketch(o, cam, opts) {
    const stash = new Map(), f0 = o.fill.intensity;
    o.scene.traverse(m => {
      if (!m.isMesh) return;
      for (const mt of (Array.isArray(m.material) ? m.material : [m.material])) {
        if (!mt || !mt.color || stash.has(mt)) continue;
        stash.set(mt, [mt.color.clone(), mt.userData.albedo ? mt.userData.albedo.clone() : null]);
        mt.color.set('#FBF6EA'); if (mt.userData.albedo) mt.userData.albedo.set('#FBF6EA');
      }
    });
    o.fill.intensity = f0 * 2.2;
    try { P3.draw(o, cam, opts); } finally { o.fill.intensity = f0; for (const [mt, [c, a]] of stash) { mt.color.copy(c); if (a) mt.userData.albedo.copy(a); } }
  }
  // [x, y, z, yaw, phase]: the first stands knee-deep where chapter A's cow went down, in the same profile, drinking
  const CATTLE_AT = [[-3, -1.1, -2, -Math.PI / 2 - .1, 0], [2.5, 0, -20.2, .08, 1.3], [-8.5, 0, -19.4, .38, 2.2], [-15.8, 0, -13.6, .85, .6], [5.6, 0, -21.6, -.1, 3.1]];
  const LIFT_C = [294.4, 297.6], LIFT_L = [296.5, 299.9];     // colour lifts, then the lines
  function H7(t, lt, dur) {
    const S = STATION_H(), { o, st, cattle, cam } = S;
    st.userData.setWet(1); st.userData.shoots.visible = false; st.userData.setSpin(.35 + (t - 286.52) * 1.9);
    S.cattle.forEach((c, i) => {
      const [x, y, z, yaw, ph] = CATTLE_AT[i]; c.root.visible = true;
      PEOPLE.at(c, [x, y, z], yaw); PEOPLE.clip(c, 'Idle_Headlow', t * (.85 + .1 * i) + ph);
    });
    // the pull back: held on the rhyme frame through [70–71], then up A's descent in reverse
    const k = .82 * ease(seg(t, 291.6, 300.6)), push = ease(seg(t, 286.6, 291.8)) * (1 - ease(seg(t, 291.6, 293.4)));
    const pos = cr(A_POS, k), tgt = cr(A_TGT, k);
    pos[0] -= 1.2 * push; pos[1] -= .5 * push; pos[2] -= 3.2 * push;   // a slow push toward the water while the rhyme lands
    cam.fov = 40; cam.updateProjectionMatrix();
    P3.look(cam, pos, tgt);
    aimSun(o, [lerp(0, -20, k), 0, lerp(0, -40, k)], lerp(90, 560, k), 3, 3, '#FFC690');
    const opts = { fog: [260, 2400], fogCol: '#E9D3C2', lightTint: .75, lineW: 1.4 };
    const [fx, fy] = P3.project(cam, [0, 0, -4]);
    const ord = (x, y) => Math.hypot(x - fx, (y - fy) * 1.3) / 1500;
    const kc = 1 - ease(seg(t, LIFT_C[0], LIFT_C[1])), kl = 1 - ease(seg(t, LIFT_L[0], LIFT_L[1]));
    if (kc >= 1) {                                          // the full drawing
      skyEast(cam); P3.draw(o, cam, opts);
    } else {
      if (kl > 0) {                                          // the graphite underdrawing, lifting last
        const A = into(0, () => drawSketch(o, cam, { ...opts, tone: 0, lineW: 1.7, fogCol: AP.paper }));
        if (kl < 1) { strokeMask(lay(2), kl, ord, { len: 150, soft: .2 }); masked(A, lay(2)); }
        stamp(A);
      }
      if (kc > 0) {                                          // the colour, lifting first
        const B = into(1, () => { skyEast(cam); P3.draw(o, cam, opts); });
        strokeMask(lay(3), kc, (x, y) => ord(x, y) * .75 + (1 - y / H) * .25, { len: 190, soft: .22, lane: 16 }); masked(B, lay(3));
        stamp(B);
      }
    }
    if (lt < .35) pageTurn(.5 + lt / .7, 1);
  }

  // ---------------------------------------------------------------- dev: the layout from above
  LOOPS.Hdev = t => {
    const S = LAND(); reset(S);
    const v = Math.floor(t);
    sky('#8FB4C8', '#F1D8A8', { still: true });
    const views = [[[0, 900, -200], [0, 0, 700], 50], [[-120, 60, -60], [10, 10, 120], 45], [[60, 140, 300], [0, 0, 700], 45], [[20, 30, 90], [2, 2, 20], 40]];
    const [p, tg, fov] = views[v % views.length];
    S.cam.fov = fov; S.cam.updateProjectionMatrix();
    aimSun(S.o, tg, 400, 13);
    P3.look(S.cam, p, tg);
    P3.draw(S.o, S.cam, { fog: [400, 3000], fogCol: '#F1D8A8' });
  };
  LOOPS.Hdev.len = 4;
  LOOPS.H6t = t => { H6(283.2 + Math.floor(t) * .9, 2.1 + Math.floor(t) * .9, 5.42); };
  LOOPS.H6t.len = 4;
  LOOPS.Hpool = t => {
    const S = LAND(); H4(274.6, 2.5, 5.09); const cam = S.cam, pc = onPath(S.P, POOL[0]);
    cam.fov = 50; cam.updateProjectionMatrix();
    X.setTransform(1, 0, 0, 1, 0, 0); X.clearRect(0, 0, W, H);
    skyH('#8DB3CA', '#F3DCAA');
    P3.look(cam, [pc[0] + 30, 70, pc[2] - 20], [pc[0], 0, pc[2]]);
    P3.draw(S.o, cam, { fog: [400, 3000], fogCol: '#F2DCAE' });
  };
  LOOPS.Hpool.len = 1;
  LOOPS.Hsh = t => {
    const S = LAND(); reset(S); const el = [14, 22, 30][Math.floor(t) % 3];
    const f = onPath(S.P, 235), cam = S.cam; cam.fov = 50; cam.updateProjectionMatrix();
    aimSun(S.o, onPath(S.P, 240, 0, 8), 60, el, 2.6);
    skyH('#8DB3CA', '#F3DCAA'); P3.look(cam, [f[0] - 60, 70, f[2] - 10], [f[0], 0, f[2] + 5]);
    P3.draw(S.o, cam, { fog: [400, 3000], fogCol: '#F2DCAE' });
    seed('Hshade'); waterShade(S, cam, 180, 290, el, '#FF0000', 1);
  };
  LOOPS.Hsh.len = 3;
  LOOPS.Hpose = t => {
    const S = P3.cached('H-posetest', () => {
      const o = P3.scene({ sunDir: [-40, 50, 60], shadowSize: 30 });
      const g = P3.mesh(new THREE.PlaneGeometry(200, 200), AP.dust, { style: .8 }); g.rotation.x = -Math.PI / 2; o.scene.add(g);
      const ps = [0, 1, 2, 3, 4].map(() => { const p = PEOPLE.make('squatter'); o.scene.add(p.root); return p; });
      const cow = PEOPLE.beast('cow', '#8A4A2E', { scale: .34 }); o.scene.add(cow.root);
      return { o, ps, cow, cam: P3.cam(30) };
    });
    const CL = ['Crouch_Idle_Loop', 'Farm_PlantSeed', 'Fixing_Kneeling', 'Farm_Harvest', 'Consume'];
    S.ps.forEach((p, i) => { PEOPLE.at(p, [(i - 2) * 4.5, 0, 0], i < 3 ? 1.57 : .9); PEOPLE.clip(p, i < 3 ? 'Sitting_Idle_Loop' : 'Idle_Loop', t * .5 + i); });
    { const p = S.ps[0], h = new THREE.Vector3(); p.bones.pelvis.getWorldPosition(h); const f = new THREE.Vector3(); p.bones.foot_l.getWorldPosition(f); console.log('sit pelvis', h.toArray().map(v => v.toFixed(2)).join(','), 'foot', f.toArray().map(v => v.toFixed(2)).join(',')); }
    PEOPLE.at(S.cow, [4, 0, -12], -1.2); PEOPLE.clip(S.cow, 'Idle_Headlow', t * 3.33 / 4);
    sky('#9FB8C8', '#E9D2A6', { still: true });
    P3.look(S.cam, [2, 5, 30], [0, 2.4, -2]);
    P3.draw(S.o, S.cam, { fog: [60, 300], fogCol: '#E9D2A6' });
  };
  LOOPS.Hpose.len = 4;
  LOOPS.Hw = t => { WSTYLE = [.8, 1, .5][Math.floor(t) % 3]; H2(263.05 + (t < 3 ? 1 : 4.6), t < 3 ? 1 : 4.6, 6); };
  LOOPS.Hw.len = 6;

  function todo(t, lt, dur) { sky('#E4D5B7', '#E4D5B7'); }
  const dbg = f => (t, lt, dur) => { try { f(t, lt, dur); } catch (e) { console.error('H shot error', e.message, e.stack.split('\n').slice(0, 4).join(' | ')); } };
  shots([[259.9, dbg(H1)], [263.05, dbg(H2)], [269.05, dbg(H3)], [272.1, dbg(H4)], [277.19, dbg(H5)], [281.1, dbg(H6)], [286.52, dbg(H7)]]);
})();
