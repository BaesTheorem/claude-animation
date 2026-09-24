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
//   WORLD.strata(o)                   the cutaway block of the earth under the bore for the dive shots (depth in ft)
//   WORLD.STRATA                      [top ft, bottom ft, colour, name] of the section, surface to the aquifer
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
  function strata(o = {}) {
    // a block W wide, D deep (front face at z = 0) from the surface down to o.bottom ft; the bore runs down the front face
    const THREE = T(), g = new THREE.Group(), Wd = o.w ?? 260, Dp = o.d ?? 160, bottom = o.bottom ?? 4400;
    for (const [a, b, col, name] of STRATA) {
      if (a >= bottom) continue;
      const hh = Math.min(b, bottom) - a, m = P3.mesh(P3.box(Wd, hh, Dp), col, { style: name.includes('water') ? .5 : 1 });
      m.position.set(0, -a - hh / 2, -Dp / 2); m.userData.stratum = name; g.add(m);
      for (let i = 0; i < Math.min(40, hh / 30); i++) {   // boulders and nodules proud of the face
        const s = P3.mesh(new THREE.IcosahedronGeometry(1.2 + H1(a + i) * 3.5, 1), mixCol(col, AP.graphite, .25));
        s.position.set((H1(i * 3 + a) - .5) * (Wd - 20), -a - H1(i * 7 + a) * hh, .2); s.scale.z = .5; g.add(s);
      }
    }
    // the bore: a dark groove cut into the front face
    const shaft = P3.mesh(P3.box(o.bore ?? 3, bottom, 3), '#221E1C', { cast: false }); shaft.position.set(0, -bottom / 2, -.9); g.add(shaft);
    return g;
  }
  return { terrain, heightAt, tree, trees, homestead, windmill, cracks, water, waterhole, strata, STRATA, noise2 };
})();
