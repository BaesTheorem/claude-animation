// artesian/world.js: the land and its furniture in 3D, for the pencil renderer (P3). Units are feet, y is up.
// Everything is built once (in a shot's lazy init) and then posed per frame; builders are deterministic (hash-seeded).
//
//   WORLD.terrain(o)                  the plain: o.size, o.col, o.flat (radius kept level round the rig), o.amp; returns mesh
//   WORLD.tree(x, z, o)               gidgee / coolibah: o.dead, o.h (height ft), o.leaf (colour), o.seed; returns group
//   WORLD.trees(sc, n, o)             scatter n trees in a ring o.r0..o.r1 round o.c ([x,z]), o.dead fraction
//   WORLD.homestead(o)                slab hut, iron gable roof, veranda on posts, rain tank; returns group (+ .parts)
//   WORLD.windmill(o)                 stock windmill; returns group; set group.userData.wheel.rotation.z to spin it
//   WORLD.cracks(cx, cz, r, o)        a crazed dried-mud network as flat dark strokes on the ground
//   WORLD.waterhole(cx, cz, r, o)     a hollow in the ground; o.fill 0..1 raises a water surface (group.userData.water)
//   WORLD.water(geom, o)              a water surface mesh (pencil style id .5: cool hatching and glints)
//   WORLD.section(o)                  the cutaway diagram of the earth under the bore (1 unit = 10 ft); see below
//   WORLD.STRATA                      [top ft, bottom ft, colour, name] of the section, surface to the aquifer
//   WORLD.depthBoard(o)               the chalked depth board (a lettered plate); board.userData.set(ft) re-chalks it
//   WORLD.site(o)                     the bore site, same layout in every chapter: { group, rig, board, ground, at }
//   WORLD.stationSet(o)               THE opening/closing place (waterhole, coolibah, windmill, homestead, fence, bones);
//                                     .userData.setWet(0..1), .setSpin(angle), .at anchors. Chapters A and H share it.
const WORLD = (() => {
  const T = () => THREE;
  const H1 = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const noise2 = (x, z) => {   // smooth value noise, deterministic
    const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi, s = t => t * t * (3 - 2 * t);
    const v = (a, b) => H1(a * 57.3 + b * 131.7);
    return lerp(lerp(v(xi, zi), v(xi + 1, zi), s(xf)), lerp(v(xi, zi + 1), v(xi + 1, zi + 1), s(xf)), s(zf));
  };
  function terrain(o = {}) {
    const size = o.size ?? 4000, seg = o.seg ?? 160, g = new (T().PlaneGeometry)(size, size, seg, seg);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position, flat = o.flat ?? 120, amp = o.amp ?? 7;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i), r = Math.hypot(x - (o.cx ?? 0), z - (o.cz ?? 0));
      const h = (noise2(x / 260, z / 260) - .5) * amp * 2 + (noise2(x / 70, z / 70) - .5) * amp * .35;
      pos.setY(i, h * clamp((r - flat) / (flat * 2)));
    }
    g.computeVertexNormals();
    const m = P3.mesh(g, o.col || AP.dust, { style: .8 }); m.castShadow = false; return m;
  }
  function heightAt(x, z, o = {}) {
    const flat = o.flat ?? 120, amp = o.amp ?? 7, r = Math.hypot(x - (o.cx ?? 0), z - (o.cz ?? 0));
    return ((noise2(x / 260, z / 260) - .5) * amp * 2 + (noise2(x / 70, z / 70) - .5) * amp * .35) * clamp((r - flat) / (flat * 2));
  }
  function limbMesh(a, b, r0, r1, col) {
    const THREE = T(), A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), L = A.distanceTo(B);
    const m = P3.mesh(new THREE.CylinderGeometry(r1, r0, L, 7, 1), col); m.position.copy(A).add(B).multiplyScalar(.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()); return m;
  }
  function tree(x, z, o = {}) {
    const THREE = T(), g = new THREE.Group(), sd = o.seed ?? (x * 7.3 + z * 1.9), h = o.h ?? 26, dead = !!o.dead;
    const bark = o.bark || (dead ? '#9C9286' : '#5E4A3A'), y0 = o.y ?? 0;
    const lean = (H1(sd) - .5) * .25, top = [x + Math.sin(lean) * h * .45, y0 + h * .45, z + (H1(sd + 1) - .5) * 2];
    g.add(limbMesh([x, y0, z], top, h * .045, h * .032, bark));
    const tips = [];
    const grow = (p, dir, len, r, depth) => {
      const q = [p[0] + dir[0] * len, p[1] + dir[1] * len, p[2] + dir[2] * len];
      g.add(limbMesh(p, q, r, r * .62, bark)); tips.push(q);
      if (depth >= (dead ? 3 : 2)) return;
      for (let k = 0; k < 2; k++) {
        const s = sd + depth * 13 + k * 7 + len, a = (H1(s) - .5) * 1.6 + (k ? .5 : -.5), b = (H1(s + 3) - .5) * 1.2;
        const nd = [dir[0] + Math.sin(a) * .7, Math.max(.25, dir[1] - .1 + H1(s + 5) * .3), dir[2] + Math.sin(b) * .7], n = Math.hypot(...nd);
        grow(q, nd.map(v => v / n), len * .66, r * .6, depth + 1);
      }
    };
    for (let k = 0; k < 3; k++) { const a = sd + k * 2.1, d = [Math.cos(a) * .6, .8, Math.sin(a) * .6], n = Math.hypot(...d); grow(top, d.map(v => v / n), h * .28, h * .028, 1); }
    if (!dead) {
      const leaf = o.leaf || '#6E7A4A';
      for (const [i, p] of tips.entries()) {
        if (i % 2 && H1(sd + i) < .5) continue;
        const r = h * (.12 + .08 * H1(sd + i * 3)), s = P3.mesh(new THREE.IcosahedronGeometry(r, 2), leaf);
        s.scale.set(1.3, .7, 1.2); s.position.set(p[0], p[1] + r * .2, p[2]); g.add(s);
      }
    }
    return g;
  }
  function trees(sc, n, o = {}) {
    const g = new (T().Group)(), [cx, cz] = o.c || [0, 0];
    for (let i = 0; i < n; i++) {
      const a = H1(i * 3.3 + (o.seed || 0)) * TAU, r = lerp(o.r0 ?? 200, o.r1 ?? 1400, Math.sqrt(H1(i * 7.1 + (o.seed || 0))));
      const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
      g.add(tree(x, z, { dead: H1(i * 5.7) < (o.dead ?? .5), h: lerp(16, 34, H1(i * 9.1)), seed: i * 17 + (o.seed || 0), leaf: o.leaf, y: o.ground ? heightAt(x, z, o.ground) : 0 }));
    }
    (sc.scene || sc).add(g); return g;
  }
  function homestead(o = {}) {
    const THREE = T(), g = new THREE.Group(), w = o.w ?? 30, d = o.d ?? 18, hw = o.h ?? 9, wall = o.wall || '#B8A386', iron = o.iron || '#9AA0A0';
    const add = (m, p) => { m.position.set(...p); g.add(m); return m; };
    add(P3.mesh(P3.box(w, hw, d), wall), [0, hw / 2, 0]);
    for (let i = 0; i < 14; i++) add(P3.mesh(P3.box(.25, hw, .3), mixCol(wall, AP.graphite, .25)), [-w / 2 + (i + .5) * w / 14, hw / 2, d / 2 + .05]);  // slabs
    const rise = 6, slope = Math.atan2(rise, d / 2), rl = Math.hypot(rise, d / 2) + 1;
    for (const sd of [-1, 1]) { const r = add(P3.mesh(P3.box(w + 2, .35, rl), iron), [0, hw + rise / 2, sd * d / 4]); r.rotation.x = sd * slope; }
    // veranda: skillion roof on posts along the front
    const vd = o.veranda ?? 9;
    const vr = add(P3.mesh(P3.box(w + 2, .3, vd + 1), iron), [0, hw - .6, d / 2 + vd / 2]); vr.rotation.x = .12;
    for (let i = 0; i <= 5; i++) add(P3.mesh(P3.box(.5, hw - 1.2, .5), AP.timber), [-w / 2 + i * w / 5, (hw - 1.2) / 2, d / 2 + vd]);
    add(P3.mesh(P3.box(w, .6, vd), AP.timber), [0, .3, d / 2 + vd / 2]);
    add(P3.mesh(P3.box(3.4, 7, .3), AP.timberDk), [-3, 3.5, d / 2 + .2]);
    for (const x of [-9, 6]) add(P3.mesh(P3.box(3.5, 3, .3), '#2E2A28'), [x, 5.2, d / 2 + .2]);
    add(P3.mesh(P3.box(3, hw + 7, 3), '#8A7E70'), [w / 2 - 2, (hw + 7) / 2, -d / 4]);
    // corrugated iron rain tank on a timber stand
    const tank = new THREE.Group(); tank.position.set(w / 2 + 6, 0, d / 2 - 2); g.add(tank);
    const stand = P3.mesh(P3.box(9, 4, 9), AP.timberDk); stand.position.y = 2; tank.add(stand);
    const tk = P3.mesh(P3.cyl(4, 4, 8, 20), iron); tk.position.y = 8; tank.add(tk);
    g.userData.parts = { tank, verandaFront: d / 2 + vd, floorY: .6 };
    if (o.pos) g.position.set(...o.pos); if (o.yaw) g.rotation.y = o.yaw;
    return g;
  }
  function windmill(o = {}) {
    const THREE = T(), g = new THREE.Group(), h = o.h ?? 30, b = o.base ?? 5;
    const legs = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) => [[sx * b, 0, sz * b], [sx * .7, h, sz * .7]]);
    const at = (L, k) => L[0].map((v, i) => v + (L[1][i] - v) * k);
    for (const L of legs) g.add(P3.beam(L[0], L[1], .35, .35, AP.iron));
    for (let k = 1; k <= 5; k++) for (let i = 0; i < 4; i++) { const A = legs[i], B = legs[(i + 1) % 4]; g.add(P3.beam(at(A, k / 5.5), at(B, k / 5.5), .15, .15, AP.ironLt)); }
    const wheel = new THREE.Group(); wheel.position.set(0, h + 1.5, 1.2); g.add(wheel);
    for (let i = 0; i < 18; i++) { const bl = P3.mesh(P3.box(1.2, 5.5, .08), AP.ironLt); const a = i / 18 * TAU; bl.position.set(Math.sin(a) * 4, Math.cos(a) * 4, 0); bl.rotation.set(0, .45, -a); wheel.add(bl); }
    wheel.add(P3.mesh(P3.cyl(.6, .6, .8, 12), AP.iron));
    const vane = P3.mesh(P3.box(.1, 3, 6), AP.ironLt); vane.position.set(0, h + 1.5, -5); g.add(vane);
    g.userData.wheel = wheel;
    if (o.pos) g.position.set(...o.pos); if (o.yaw) g.rotation.y = o.yaw;
    return g;
  }
  function cracks(cx, cz, r, o = {}) {
    // jittered lattice → connected crack network, drawn as thin dark strips lying on the ground
    const THREE = T(), g = new THREE.Group(), n = o.n ?? 14, cell = 2 * r / n, col = o.col || AP.earthDk, y = o.y ?? .05;
    const P = (i, j) => [cx - r + (i + (j % 2) * .5) * cell + (H1(i * 31 + j * 7) - .5) * cell * .8, cz - r + j * cell + (H1(i * 13 + j * 29) - .5) * cell * .7];
    for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
      const a = P(i, j);
      for (const b of [i < n ? P(i + 1, j) : null, j < n ? P(i + (j % 2), j + 1) : null]) {
        if (!b || H1(i * 5 + j * 11 + (b === null)) > (o.k ?? .9)) continue;
        const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2; if (Math.hypot(mx - cx, mz - cz) > r) continue;
        const L = Math.hypot(b[0] - a[0], b[1] - a[1]), s = P3.mesh(P3.box(o.w ?? .18, .02, L), col, { cast: false });
        s.position.set(mx, y, mz); s.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1]); g.add(s);
      }
    }
    return g;
  }
  function water(geom, o = {}) { const m = P3.mesh(geom, o.col || AP.water, { style: .5 }); m.castShadow = false; return m; }
  function waterhole(cx, cz, r, o = {}) {
    const THREE = T(), g = new THREE.Group();
    const bowl = P3.mesh(new THREE.CircleGeometry(r, 48).rotateX(-Math.PI / 2), o.mud || '#8E6A48', { style: .8 }); bowl.position.set(cx, .03, cz); bowl.castShadow = false; g.add(bowl);
    g.add(cracks(cx, cz, r * .85, { col: '#5A3E2A', n: 10 }));
    const wat = water(new THREE.CircleGeometry(r * .95, 48).rotateX(-Math.PI / 2)); wat.position.set(cx, .08, cz); wat.visible = (o.fill ?? 0) > 0; wat.scale.setScalar(Math.max(.01, o.fill ?? 0)); g.add(wat);
    g.userData.water = wat; return g;
  }
  // The section: surface soil, the Rolling Downs marine mudstones (fossils), harder beds, then the aquifer sandstone.
  const STRATA = [[0, 40, '#9C4A2E', 'red soil'], [40, 380, '#C89A5E', 'clay and gravel'], [380, 1150, '#8E8A7E', 'grey marine mudstone'], [1150, 1500, '#6E6458', 'dark shale (fossil beds)'],
    [1500, 2600, '#7C7A74', 'blue-grey mudstone'], [2600, 3400, '#8C7458', 'sandy shale'], [3400, 4020, '#9A948A', 'hard grey rock'], [4020, 4400, '#5C8FAE', 'water-bearing sandstone']];
  // The cutaway diagram of the earth under the bore, drawn like a period geological section: 1 world unit = 10 ft
  // (VS = .1), so the whole 4,400 ft column is 440 units tall and a camera 120 units off sees ~1,000 ft of it at once.
  // The bore, rods and bit are exaggerated in width so they read. Front face at z = 0; the bore runs down x = 0.
  //   const S = WORLD.section({ bottom: 4400, w: 160 })       add S to a scene
  //   S.userData.set(depthFt, stroke, o)   bit at depthFt, rods lifted by the stroke (RIG.strokeAt); o.casing (ft of casing),
  //                                        o.flow 0..1 water rising up the tube from the aquifer (chapter G), o.cave 0..1
  //   S.userData.y(ft) → world y of a depth;  S.userData.fossils / .aquifer → groups to show, hide or light
  const VS = .1;
  function section(o = {}) {
    const THREE = T(), g = new THREE.Group(), Wd = o.w ?? 160, Dp = o.d ?? 50, bottom = o.bottom ?? 4400, y = ft => -ft * VS;
    const add = (m, p) => { if (p) m.position.set(...p); g.add(m); return m; };
    for (const [a, b, col, name] of STRATA) {
      if (a >= bottom) continue;
      const hh = (Math.min(b, bottom) - a) * VS, wet = name.includes('water');
      const m = add(P3.mesh(P3.box(Wd, hh, Dp), col, { style: wet ? .5 : 1 }), [0, y(a) - hh / 2, -Dp / 2]);
      m.userData.stratum = name;
      // bedding: thin darker laminations proud of the face, a little wavy (two offset boxes per line)
      const nl = Math.max(1, Math.round(hh / 7));
      for (let i = 0; i < nl; i++) {
        const yy = y(a) - hh * (i + .5 + (H1(a + i) - .5) * .5) / nl;
        for (let k = 0; k < 3; k++) add(P3.mesh(P3.box(Wd / 3 + 2, .22, .3), mixCol(col, AP.graphite, .35), { cast: false }), [-Wd / 3 + k * Wd / 3, yy + (H1(a + i * 3 + k) - .5) * 1.2, .1]);
      }
      // stones and nodules
      for (let i = 0; i < Math.min(26, hh * 1.2); i++) {
        const st = add(P3.mesh(new THREE.IcosahedronGeometry(.3 + H1(a + i) * (name.includes('clay') ? .9 : .6), 1), mixCol(col, AP.graphite, .3)),
          [(H1(i * 3 + a) - .5) * (Wd - 6), y(a) - H1(i * 7 + a) * hh, .15]);
        st.scale.z = .45; if (Math.abs(st.position.x) < 2.5) st.position.x += 5;
      }
    }
    // fossils in the dark shale: ammonites and an ichthyosaur, the Cretaceous sea that laid down these beds
    const fossils = new THREE.Group(); g.add(fossils);
    const ammonite = (x, yy, r) => { const a = new THREE.Group(); for (let k = 0; k < 4; k++) { const tr = P3.mesh(new THREE.TorusGeometry(r * (1 - k * .24), r * .09, 6, 28), '#CFC3A8'); a.add(tr); } a.position.set(x, yy, .35); fossils.add(a); };
    ammonite(-28, y(1260), 2.2); ammonite(34, y(1330), 1.6); ammonite(-52, y(1420), 1.3); ammonite(18, y(1450), 1.1);
    const ich = new THREE.Group(); ich.position.set(-12, y(1380), .35); ich.rotation.z = -.08; fossils.add(ich);
    for (let i = 0; i < 26; i++) { const v = P3.mesh(P3.box(.55, .8 - Math.abs(i - 9) * .02, .3), '#D8CCB0'); v.position.set(i * .7 - 6, Math.sin(i * .3) * .5, 0); ich.add(v); }
    const skull = P3.mesh(new THREE.ConeGeometry(1.1, 5.5, 8).rotateZ(Math.PI / 2), '#D8CCB0'); skull.position.set(-9.2, .1, 0); ich.add(skull);
    for (const [x, yy, r] of [[-3, -1.6, -.6], [4, -1.5, -.4]]) { const fl = P3.mesh(P3.box(2.6, .5, .25), '#D8CCB0'); fl.position.set(x, yy, 0); fl.rotation.z = r; ich.add(fl); }
    for (let i = 0; i < 14; i++) { const rb = P3.mesh(P3.box(.16, 1.8, .16), '#CFC3A8'); rb.position.set(i * .7 - 5, -1, 0); rb.rotation.z = .25; ich.add(rb); }
    // the aquifer: glints in the pores
    const aquifer = new THREE.Group(); g.add(aquifer);
    for (let i = 0; i < 60; i++) { const d = P3.mesh(new THREE.SphereGeometry(.18, 6, 4), '#DCEFF5', { cast: false, style: .6 }); d.position.set((H1(i * 5) - .5) * (Wd - 4), y(4040) - H1(i * 9) * 30, .3); aquifer.add(d); }
    // the bore: a dark slot cut into the face, the iron casing tube, the yellow rods and the bit
    const slot = add(P3.mesh(P3.box(2.6, bottom * VS, 1.4), '#1C1917', { cast: false }), [0, -bottom * VS / 2, .2]);
    const casing = add(P3.mesh(P3.cyl(1.05, 1.05, 1, 16), '#6E6A64'), [0, 0, .6]);
    const rods = add(P3.mesh(P3.cyl(.32, .32, 1, 10), '#E0B85A'), [0, 0, .75]);
    const bit = add(P3.mesh(new THREE.ConeGeometry(.9, 3.2, 4).rotateX(Math.PI), '#4A4744'), [0, 0, .75]);
    const water = add(P3.mesh(P3.cyl(.8, .8, 1, 12), AP.water, { style: .5, cast: false }), [0, 0, .7]); water.visible = false;
    const surf = add(P3.mesh(P3.box(Wd, .6, Dp), '#9C7A50', { style: .8 }), [0, .3, -Dp / 2]);
    g.userData = { y, fossils, aquifer, slot, casing, rods, bit, water, surf, VS,
      set(depth, stroke = 0, oo = {}) {
        const lift = stroke < .75 ? Math.sin(stroke / .75 * Math.PI / 2) : 1 - Math.pow((stroke - .75) / .25, 2), up = lift * (oo.amp ?? 1) * 1.6;
        const bot = y(depth) + up, cas = Math.min(depth, oo.casing ?? depth * .8);
        casing.scale.y = Math.max(.01, cas * VS); casing.position.y = -cas * VS / 2;
        rods.scale.y = Math.max(.01, -bot + 2.8 + 6); rods.position.y = (bot + 2.8 + 6) / 2;
        bit.position.y = bot + 1.6;
        const f = oo.flow ?? 0; water.visible = f > 0;
        if (f > 0) { const top = lerp(y(depth), 2, f); water.scale.y = Math.max(.01, top - y(depth)); water.position.y = (top + y(depth)) / 2; }
      } };
    return g;
  }
  // The depth board: a plank nailed to a derrick leg, the day's depth chalked on it. board.userData.set(ft)
  function depthBoard(o = {}) {
    const b = P3.plate(o.w ?? 3.2, o.h ?? 1.6, '#3A332C');
    b.userData.set = ft => b.userData.paint((c, w, h) => {
      c.strokeStyle = 'rgba(230,225,210,.25)'; c.lineWidth = 3; for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(0, h * (i + .5) / 9); c.lineTo(w, h * (i + .5) / 9 + (i % 3) - 1); c.stroke(); }
      c.fillStyle = '#EDE6D6'; c.font = `${Math.round(h * .55)}px "Cabin Sketch", serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.globalAlpha = .92; c.fillText(`${Math.round(ft)} FT`, w / 2, h * .54); c.globalAlpha = .3; c.fillText(`${Math.round(ft)} FT`, w / 2 + 3, h * .54 - 2);
    }, Math.round(ft));
    b.userData.set(o.ft ?? 0); return b;
  }
  // The station paddock: the film's first and last frame. The dry waterhole below the dead coolibah, the stock
  // windmill, the homestead beyond, a fence line and a cattle skeleton. o.wet 0..1 fills the waterhole, greens the
  // ground and leafs the coolibah; set per frame with st.userData.setWet(k) and st.userData.setSpin(angle).
  // Anchors (st.userData.at): hole [x,z] (waterhole centre), tree, mill, house, skull. Chapters A and H share it.
  function stationSet(o = {}) {
    const THREE = T(), g = new THREE.Group(), at = { hole: [0, 0], tree: [-19, -6], mill: [16, -34], house: [-52, -120], skull: [21, 11] };
    const ground = terrain({ col: o.col || '#CDAE80', flat: 40, amp: 5 }); g.add(ground);
    const wh = waterhole(at.hole[0], at.hole[1], 16, { fill: 0 }); g.add(wh);
    const dead = tree(at.tree[0], at.tree[1], { dead: true, h: 30, seed: 5 }); g.add(dead);
    const live = tree(at.tree[0], at.tree[1], { dead: false, h: 30, seed: 5, leaf: '#6E8A4A' }); live.visible = false; g.add(live);
    const mill = windmill({ pos: [at.mill[0], 0, at.mill[1]], yaw: -.4 }); g.add(mill);
    const house = homestead({ pos: [at.house[0], 0, at.house[1]], yaw: .35 }); g.add(house);
    // fence: posts and three wires running off toward the house
    for (let i = 0; i < 16; i++) { const x = 30 - i * 6.5, z = 18 - i * 9; const post = P3.mesh(P3.box(.35, 4.2, .35), '#6E5A44'); post.position.set(x, 2.1, z); post.rotation.z = (H1(i) - .5) * .12; g.add(post); }
    for (const yy of [1.4, 2.5, 3.6]) { const wire = P3.beam([30, yy, 18], [30 - 15 * 6.5, yy, 18 - 15 * 9], .05, .05, '#5A5650'); wire.castShadow = false; g.add(wire); }
    // a cattle skeleton: skull, curve of ribs, scattered long bones
    const bone = '#E8DFC8', sk = new THREE.Group(); sk.position.set(at.skull[0], 0, at.skull[1]); sk.rotation.y = .6; g.add(sk);
    const cr = P3.mesh(new THREE.SphereGeometry(.9, 12, 8), bone); cr.scale.set(1, .7, 1.5); cr.position.set(0, .45, 0); sk.add(cr);
    for (const sd of [-1, 1]) { const hn = P3.mesh(P3.cyl(.05, .2, 1.6, 8), bone); hn.position.set(sd * .9, .7, -.3); hn.rotation.z = -sd * 1.1; sk.add(hn); }
    for (let i = 0; i < 9; i++) { const rb = P3.mesh(new THREE.TorusGeometry(1.6 - Math.abs(i - 4) * .12, .07, 5, 12, Math.PI), bone); rb.position.set(-3 - i * .55, .02, .5); rb.rotation.set(-Math.PI / 2 + .35, .25, 0); sk.add(rb); }
    for (let i = 0; i < 4; i++) { const lb = P3.mesh(P3.cyl(.1, .12, 2.4, 6), bone); lb.position.set(-2 + i * 1.8, .1, 2 + (H1(i) - .5) * 2); lb.rotation.set(Math.PI / 2, 0, H1(i * 3) * 3); sk.add(lb); }
    // green shoots that come up with the water (hidden while dry)
    const shoots = new THREE.Group(); g.add(shoots);
    for (let i = 0; i < 220; i++) {   // tufts: a few blades fanned from one root
      const a = H1(i * 3.7) * TAU, r = 17.5 + H1(i * 5.1) * 70, tuft = new THREE.Group(); tuft.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      for (let k = 0; k < 4; k++) { const bl = P3.mesh(new THREE.ConeGeometry(.12, .9 + H1(i + k) * 1.1, 3), k % 2 ? '#8FB25A' : '#A6C06A', { cast: false }); bl.position.y = .5; bl.rotation.set((H1(i * 7 + k) - .5) * .9, k * 1.6, (H1(i * 11 + k) - .5) * .9); tuft.add(bl); }
      shoots.add(tuft);
    }
    g.userData = { at, ground, wh, dead, live, mill, house, shoots,
      setWet(k) {
        k = clamp(k); const w = wh.userData.water; w.visible = k > .01; w.scale.setScalar(Math.max(.01, k));
        dead.visible = k < .5; live.visible = k >= .5; shoots.visible = k > .3; shoots.scale.set(1, clamp((k - .3) / .7), 1);
        ground.material.color.set(mixCol(o.col || '#CDAE80', '#9DAA66', k * .75)); ground.material.userData.albedo.copy(ground.material.color);
      },
      setSpin(a) { mill.userData.wheel.rotation.z = a; } };
    g.userData.setWet(o.wet ?? 0);
    return g;
  }
  // The bore site, laid out the same in every chapter: the plant (RIG) at the origin with the beam and engine along +x
  // and the forge shed to -x, the crew's camp (tents, fire, cart, barrels) out along +z/-x, the depth board on the
  // derrick's front-left leg, scrub around. Returns { group, rig, board, at } where at holds anchors: camp, fire,
  // cart, tents[], boardPos. o.col (ground colour), o.dead (fraction of dead trees), o.trees (count), o.board (ft).
  function site(o = {}) {
    const THREE = T(), g = new THREE.Group();
    const ground = terrain({ col: o.col || '#C9A77A', flat: 150 }); g.add(ground);
    const rig = RIG.build(); g.add(rig);
    const at = { camp: [-42, 0, 46], fire: [-36, 0, 38], cart: [-58, 0, 30], tents: [[-50, 0, 52], [-38, 0, 60], [-60, 0, 44]] };
    for (const [x, y, z] of at.tents) {   // A-frame canvas tents: ridge pole, two sloped flies, an open end
      const t = new THREE.Group(); t.position.set(x, 0, z); t.rotation.y = H1(x) * 1.2; g.add(t);
      for (const sd of [-1, 1]) { const fl = P3.mesh(P3.box(.1, 6.4, 10), '#DCCFB4', { side: THREE.DoubleSide }); fl.position.set(sd * 2.1, 2.5, 0); fl.rotation.z = sd * .72; t.add(fl); }
      const ridge = P3.mesh(P3.cyl(.08, .08, 11, 6).rotateX(Math.PI / 2), '#6E5238'); ridge.position.y = 5.1; t.add(ridge);
      for (const zz of [-5.3, 5.3]) { const pole = P3.mesh(P3.cyl(.07, .07, 5.2, 6), '#6E5238'); pole.position.set(0, 2.6, zz); t.add(pole); }
    }
    const ring = new THREE.Group(); ring.position.set(...at.fire); g.add(ring);
    for (let i = 0; i < 9; i++) { const st = P3.mesh(new THREE.IcosahedronGeometry(.45, 0), '#8A8074'); const a = i / 9 * TAU; st.position.set(Math.cos(a) * 1.6, .25, Math.sin(a) * 1.6); ring.add(st); }
    const billy = P3.mesh(P3.cyl(.35, .35, .7, 10), '#6E6A64'); billy.position.set(at.fire[0] + .3, 1.1, at.fire[2]); g.add(billy);
    g.add(P3.beam([at.fire[0] - 1.5, 1.8, at.fire[2]], [at.fire[0] + 1.8, 1.8, at.fire[2]], .12, .12, '#4A4744'));
    const cart = new THREE.Group(); cart.position.set(...at.cart); cart.rotation.y = .8; g.add(cart);
    const bed = P3.mesh(P3.box(6, .5, 11), '#8A6A48'); bed.position.y = 3.2; cart.add(bed);
    for (const sd of [-1, 1]) { const side = P3.mesh(P3.box(.3, 1.4, 11), '#7A5A40'); side.position.set(sd * 3, 4.1, 0); cart.add(side);
      const wh = P3.mesh(new THREE.TorusGeometry(2.4, .2, 6, 28), '#5A4636'); wh.position.set(sd * 3.4, 2.4, 1); wh.rotation.y = Math.PI / 2; cart.add(wh);
      for (let k = 0; k < 6; k++) { const sp = P3.mesh(P3.box(.12, 4.8, .12), '#5A4636'); sp.position.set(sd * 3.4, 2.4, 1); sp.rotation.x = k / 6 * Math.PI; cart.add(sp); } }
    const shafts = P3.beam([-1.2, 3.2, -5.5], [-1.4, .4, -13], .3, .3, '#7A5A40'); cart.add(shafts); const shafts2 = P3.beam([1.2, 3.2, -5.5], [1.4, .4, -13], .3, .3, '#7A5A40'); cart.add(shafts2);
    for (const [x, z] of [[-30, 50], [-28.5, 51.5], [-31, 52.8]]) { const br = P3.mesh(P3.cyl(1.1, 1.1, 3, 14), '#6E5238'); br.position.set(x, 1.5, z); g.add(br); }
    // depth board on the derrick's front-left leg, facing the camp
    const board = depthBoard({ ft: o.board ?? 0 }); board.position.set(-7.6, 7.4, 8.2); board.rotation.y = .5; g.add(board); at.boardPos = [-7.6, 7.4, 8.2];
    trees(g, o.trees ?? 70, { r0: 110, r1: 1300, dead: o.dead ?? .6, seed: 11 });
    return { group: g, rig, board, ground, at };
  }
  return { site, stationSet, depthBoard, terrain, heightAt, tree, trees, homestead, windmill, cracks, water, waterhole, section, STRATA, VS, noise2 };
})();
