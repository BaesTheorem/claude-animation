// uplift/people.js: the cast as silhouettes. Rigged CC0 humans (Quaternius Universal Base Characters + outfits,
// built into assets/cast/*.glb by tools/build_cast.py on video/artesian-v2) and animals, posed with the CC0
// Universal Animation Library 1 + 2 clips, all sampled as pure functions of time. Adapted from artesian/people.js.
//
//   await PEOPLE.ready
//   const p = PEOPLE.make('m1')                a cast member (see CAST); add p.root to a set. Units are metres.
//   PEOPLE.at(p, [x, y, z], yaw)               feet at (x, y, z), facing yaw (0 = +z, PI/2 = +x)
//   PEOPLE.clip(p, 'Walk_Loop', t, o)          pose from a clip at time t; o.w < 1 blends over the last pose,
//                                              o.loop (default true), o.speed, o.only / o.skip (bone name prefixes)
//   PEOPLE.turn(p, bone, [rx, ry, rz])          add a local rotation after the clip
//   PEOPLE.reach / plant (two-bone IK), hand(p, 'l'|'r'), head(p)
//   PEOPLE.beast('bull', scale)                 cow | bull | horse | horse2 | dog, clips Walk, Gallop, Idle, Eating ...
//   PEOPLE.make('m1', { outfit: P.outfit('stone', i) })   era costume: stone | ancient | industry | pilgrim | settler
//                                              (or a list: tunic fur robe skirt cape furcape cloak hair hood cloth cap
//                                              bowler wide slouch top apron pack); pieces ride their bones
window.PEOPLE = (() => {
  const THREE = window.THREE;
  const FILES = { man: 'assets/cast/man.glb', man_beard: 'assets/cast/man_beard.glb', man_ranger: 'assets/cast/man_ranger.glb',
    woman: 'assets/cast/woman.glb', woman_trousers: 'assets/cast/woman_trousers.glb' };
  const ANIMS = ['assets/anim/UAL1_Standard.glb', 'assets/anim/UAL2_Standard.glb'];
  const BEAST_FILES = { cow: 'assets/animals/Cow.glb', bull: 'assets/animals/Bull.glb', horse: 'assets/animals/Horse.glb', horse2: 'assets/animals/Horse_White.glb', dog: 'assets/animals/Husky.glb' };
  const MODELS = {}, CLIPS = {}, BEASTS = {};
  const xhr = url => new Promise((ok, bad) => { const r = new XMLHttpRequest(); r.open('GET', url); r.responseType = 'arraybuffer'; r.onload = () => (r.status === 0 || r.status === 200) ? ok(r.response) : bad(new Error(url + ' ' + r.status)); r.onerror = () => bad(new Error('xhr ' + url)); r.send(); });
  const parse = buf => new Promise((ok, bad) => new (THREE.GLTFLoader)().parse(buf, '', ok, bad));
  const ready = (async () => {
    for (const [k, f] of Object.entries(FILES)) MODELS[k] = await parse(await xhr(f));
    for (const f of ANIMS) { const g = await parse(await xhr(f)); for (const c of g.animations) CLIPS[c.name] = c; }
    for (const [k, f] of Object.entries(BEAST_FILES)) BEASTS[k] = await parse(await xhr(f));
  })();
  // Silhouettes: only the outline matters, so the cast is chosen by build and height.
  const CAST = {
    m1: { model: 'man_beard', height: 1.0, build: 1.08 },
    m2: { model: 'man', height: .97 },
    m3: { model: 'man_ranger', height: 1.03, build: .95 },
    w1: { model: 'woman', height: .95 },
    w2: { model: 'woman_trousers', height: .97 },
    child: { model: 'man', height: .58, build: .9 },
    girl: { model: 'woman', height: .62 },
  };
  function make(name, over = {}) {
    const L = { ...CAST[name], ...over }, src = MODELS[L.model];
    const root = THREE.SkeletonUtils.clone(src.scene), bones = {};
    root.traverse(o => {
      if (o.isBone) bones[o.name] = o;
      if (o.isMesh) { o.frustumCulled = false; o.material = UP.silMat(L.mat || {}); }
    });
    const bw = L.build ?? 1;
    if (bw !== 1 && bones.spine_02) bones.spine_02.scale.set(bw, 1, bw);
    if (bw !== 1 && bones.neck_01) bones.neck_01.scale.set(1 / bw, 1, 1 / bw);
    const p = { root, bones, rest: {}, L, name };
    for (const [k, b] of Object.entries(bones)) p.rest[k] = { q: b.quaternion.clone(), p: b.position.clone(), s: b.scale.clone() };
    root.scale.setScalar(L.height ?? 1);
    if (L.outfit) dress(p, L.outfit, L.seed ?? (name.length * 7.3));
    return p;
  }

  // ---------------------------------------------------------------- outfits
  // Rigid pieces attached to bones at the rest pose, so each age has its own outline. Items:
  //   tunic, fur (a tunic with a ragged hem), robe, skirt, cape, furcape, cloak, hair, cap, bowler, wide, slouch, top,
  //   cloth (a head cloth with a tail), hood, apron, pack
  // Use P.make('m1', { outfit: ['fur', 'furcape', 'hair'] }) or the era presets in OUTFIT.
  const OUTFIT = {
    stone: [['fur', 'furcape'], ['fur', 'hair'], ['fur', 'furcape', 'hair'], ['fur']],
    ancient: [['tunic'], ['robe', 'cloth'], ['tunic', 'cloth'], ['robe'], ['skirt', 'cloth']],
    industry: [['cap'], ['bowler'], ['cap', 'apron'], ['skirt', 'slouch'], ['wide'], ['top']],
    pilgrim: [['cloak', 'hood', 'pack'], ['cloak', 'hood'], ['cloak', 'pack']],
    settler: [['pack', 'hood'], ['pack'], ['cloak', 'pack'], ['pack', 'cap']],
  };
  const hh = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  function attach(p, bone, mesh, wpos, wquat) {
    p.root.updateMatrixWorld(true);
    const b = p.bones[bone]; if (!b) return null;
    const want = new THREE.Matrix4().compose(wpos, wquat || new THREE.Quaternion(), V3(1, 1, 1));
    mesh.applyMatrix4(b.matrixWorld.clone().invert().multiply(want));
    mesh.frustumCulled = false; b.add(mesh); return mesh;
  }
  // an open cone from the waist down; a ragged hem when rag > 0
  function skirtGeo(r0, r1, h, rag, seed) {
    const g = new THREE.CylinderGeometry(r0, r1, h, 22, 2, true), pp = g.attributes.position;
    for (let i = 0; i < pp.count; i++) if (pp.getY(i) < -h / 2 + 1e-4) pp.setY(i, pp.getY(i) - rag * hh(i * 3.1 + seed));
    g.translate(0, -h / 2, 0); g.computeVertexNormals(); return g;
  }
  // a flat garment hanging from the shoulders down the back; ragged bottom when rag > 0
  function capeGeo(w0, w1, h, rag, seed) {
    const sh = new THREE.Shape(); sh.moveTo(-w0 / 2, 0); sh.lineTo(w0 / 2, 0);
    const n = 9; for (let i = 0; i <= n; i++) { const u = i / n; sh.lineTo(lerp(w1 / 2, -w1 / 2, u), -h - (rag ? rag * hh(i * 5.7 + seed) : 0)); }
    sh.closePath(); const g = new THREE.ShapeGeometry(sh); g.computeVertexNormals(); return g;
  }
  const lerp = (a, b, k) => a + (b - a) * k;
  // a cape as a curved shell that wraps the back (an arc of a cone), so it reads from any side; top at y = 0
  function shellGeo(w0, w1, h, rag, seed) {
    const th = 2.4, g = new THREE.CylinderGeometry(w0 * .62, w1 * .62, h, 18, 3, true, Math.PI - th / 2, th), pp = g.attributes.position;
    for (let i = 0; i < pp.count; i++) if (pp.getY(i) < -h / 2 + 1e-4) pp.setY(i, pp.getY(i) - rag * hh(i * 5.7 + seed));
    g.translate(0, -h / 2, w0 * .3); g.computeVertexNormals(); return g;
  }
  const hatProfile = kind => {
    const P2 = (x, y) => new THREE.Vector2(x, y);
    return { slouch: [P2(.001, .165), P2(.07, .16), P2(.105, .13), P2(.112, .06), P2(.116, .012), P2(.2, .004), P2(.215, -.02), P2(.19, -.006), P2(.12, -.002), P2(.1, 0)],
      wide: [P2(.001, .15), P2(.08, .145), P2(.108, .1), P2(.114, .03), P2(.118, .01), P2(.25, 0), P2(.262, -.012), P2(.24, -.004), P2(.1, -.002)],
      bowler: [P2(.001, .15), P2(.06, .145), P2(.1, .11), P2(.108, .04), P2(.11, .012), P2(.15, .01), P2(.162, .03), P2(.155, 0), P2(.1, -.002)],
      cap: [P2(.001, .08), P2(.07, .075), P2(.105, .05), P2(.112, .01), P2(.1, -.002)],
      top: [P2(.001, .24), P2(.1, .24), P2(.095, .03), P2(.1, .012), P2(.17, .006), P2(.175, -.008), P2(.1, -.004)] }[kind];
  };
  function dress(p, items, seed = 1) {
    const m = UP.silMat({ side: THREE.DoubleSide }); p.root.updateMatrixWorld(true);
    const W = n => { const v = V3(0, 0, 0); p.bones[n].getWorldPosition(v); return v; };
    const pel = W('pelvis'), sp3 = W('spine_03'), head = W('Head');
    const fem = /woman/.test(p.L.model || ''), back = -1;   // the cast faces +z at rest, so the back is -z
    for (const it of items) {
      if (it === 'tunic' || it === 'fur' || it === 'robe' || it === 'skirt') {
        const [r0, r1, h, rag] = { tunic: [.2, .31, .44, 0], fur: [.21, .33, .4, .09], robe: [.21, .4, .82, 0], skirt: [.2, .38, .7, 0] }[it];
        attach(p, 'pelvis', new THREE.Mesh(skirtGeo(r0, r1, h, rag, seed), m), V3(pel.x, pel.y + .1, pel.z));
      } else if (it === 'cape' || it === 'furcape' || it === 'cloak') {
        // a cape hangs: it is a child of the root (so it turns with the body) and drape() moves it to the shoulders
        // each frame and tilts it with only part of the spine's lean, the way cloth falls
        const [w0, w1, h, rag] = { cape: [.42, .56, .8, 0], furcape: [.5, .6, .42, .1], cloak: [.44, .62, 1.05, .04] }[it];
        const mesh = new THREE.Mesh(shellGeo(w0, w1, h, rag, seed), m); mesh.frustumCulled = false;
        const sc = 1 / (p.L.height ?? 1); mesh.scale.setScalar(sc); p.root.add(mesh);
        (p.drapes = p.drapes || []).push({ mesh, up: .17, back: .02 });
      } else if (it === 'hair') {
        const g = new THREE.SphereGeometry(.13, 14, 10); g.scale(1, 1.7, .75);
        attach(p, 'Head', new THREE.Mesh(g, m), V3(head.x, head.y - .02 + (fem ? .02 : 0), head.z + back * .09));
      } else if (it === 'hood') {
        const g = new THREE.SphereGeometry(.125, 16, 12); g.scale(.98, 1.08, 1.12);
        attach(p, 'Head', new THREE.Mesh(g, m), V3(head.x, head.y + .08 + (fem ? .03 : 0), head.z + back * .035));
        const tip = new THREE.ConeGeometry(.07, .2, 10); tip.rotateX(-2.3);
        attach(p, 'Head', new THREE.Mesh(tip, m), V3(head.x, head.y + .1 + (fem ? .03 : 0), head.z + back * .15));
      } else if (it === 'cloth') {
        const g = new THREE.SphereGeometry(.135, 16, 8, 0, Math.PI * 2, 0, Math.PI * .55);
        attach(p, 'Head', new THREE.Mesh(g, m), V3(head.x, head.y + .085 + (fem ? .03 : 0), head.z - .01));
        const tail = new THREE.Mesh(capeGeo(.2, .26, .32, 0, seed), m);
        attach(p, 'Head', tail, V3(head.x, head.y + .1 + (fem ? .03 : 0), head.z + back * .11), new THREE.Quaternion().setFromEuler(new THREE.Euler(.18, 0, 0)));
      } else if (['cap', 'bowler', 'wide', 'slouch', 'top'].includes(it)) {
        const g = new THREE.LatheGeometry(hatProfile(it), 28); g.computeVertexNormals();
        const lift = (it === 'wide' ? .148 : .122) + (fem ? .035 : 0), sc = (it === 'wide' ? 1.08 : 1.04) * (fem ? 1.12 : 1);
        g.scale(sc, sc, sc);
        if (it === 'cap') { const peak = new THREE.CylinderGeometry(.09 * sc, .09 * sc, .008, 20, 1, false, -Math.PI / 2 - .9, 1.8); peak.translate(0, .004, .07 * sc); attach(p, 'Head', new THREE.Mesh(peak, m), V3(head.x, head.y + lift, head.z - .012)); }
        attach(p, 'Head', new THREE.Mesh(g, m), V3(head.x, head.y + lift, head.z - .012), new THREE.Quaternion().setFromEuler(new THREE.Euler(-.08, 0, 0)));
      } else if (it === 'apron') {
        attach(p, 'pelvis', new THREE.Mesh(new THREE.BoxGeometry(.34, .58, .012), m), V3(pel.x, pel.y - .18, pel.z + .15));
      } else if (it === 'pack') {
        const g = new THREE.BoxGeometry(.34, .44, .2); attach(p, 'spine_03', new THREE.Mesh(g, m), V3(sp3.x, sp3.y - .02, sp3.z + back * .2));
        const roll = new THREE.CylinderGeometry(.07, .07, .42, 12); roll.rotateZ(Math.PI / 2);
        attach(p, 'spine_03', new THREE.Mesh(roll, m), V3(sp3.x, sp3.y + .26, sp3.z + back * .2));
      }
    }
  }
  function beast(kind, scale = 1, mat) {
    const src = BEASTS[kind], root = THREE.SkeletonUtils.clone(src.scene), bones = {};
    root.traverse(o => { if (o.isBone) bones[o.name] = o; if (o.isMesh) { o.frustumCulled = false; o.material = UP.silMat(mat || {}); } });
    const p = { root, bones, rest: {}, kind, beast: true, clipsSrc: src.animations };
    for (const [k, b] of Object.entries(bones)) p.rest[k] = { q: b.quaternion.clone(), p: b.position.clone(), s: b.scale.clone() };
    root.scale.setScalar(scale);
    return p;
  }
  function resetPose(p) { for (const [k, b] of Object.entries(p.bones)) { const r = p.rest[k]; b.quaternion.copy(r.q); b.position.copy(r.p); b.scale.copy(r.s); } }
  function at(p, pos, yaw = 0) { p.root.position.set(...pos); p.root.rotation.set(0, yaw, 0); p.root.updateMatrixWorld(true); if (p.drapes) drape(p); }
  const _q = new THREE.Quaternion(), _v = new THREE.Vector3();
  function clip(p, name, t, o = {}) {
    const c = p.beast ? p.clipsSrc.find(a => a.name === name) : CLIPS[name]; if (!c) throw new Error('no clip ' + name);
    const w = o.w ?? 1, loop = o.loop ?? true;
    let tt = t * (o.speed ?? 1); tt = loop ? ((tt % c.duration) + c.duration) % c.duration : Math.max(0, Math.min(c.duration - 1e-4, tt));
    if (w >= 1 && !o.keep) resetPose(p);
    if (!c.userData) c.userData = {};
    if (!c.userData.its) c.userData.its = c.tracks.map(tr => tr.createInterpolant());
    c.tracks.forEach((tr, i) => {
      const dot = tr.name.lastIndexOf('.'), bn = tr.name.slice(0, dot), prop = tr.name.slice(dot + 1), b = p.bones[bn]; if (!b) return;
      if (o.only && !o.only.some(s => bn.startsWith(s))) return;
      if (o.skip && o.skip.some(s => bn.startsWith(s))) return;
      const val = c.userData.its[i].evaluate(tt);
      if (prop === 'quaternion') { _q.fromArray(val); if (w >= 1) b.quaternion.copy(_q); else b.quaternion.slerp(_q, w); }
      else if (prop === 'position') { if (bn === 'root') return; _v.fromArray(val); if (w >= 1) b.position.copy(_v); else b.position.lerp(_v, w); }
    });
    p.root.updateMatrixWorld(true);
    if (p.drapes) drape(p);
  }
  // capes: hang from the shoulders, lean with a part of the back's tilt, sway a little
  const _s = new THREE.Vector3(), _u = new THREE.Vector3();
  function drape(p) {
    const b = p.bones.spine_03; if (!b) return;
    b.getWorldPosition(_s); p.root.worldToLocal(_s);
    p.bones.pelvis.getWorldPosition(_u); p.root.worldToLocal(_u);
    const lean = Math.atan2(_s.z - _u.z, _s.y - _u.y);   // forward lean of the back (pelvis to upper back), body frame
    for (const d of p.drapes) {
      const sc = d.mesh.scale.x, hgt = p.L.height ?? 1;
      d.mesh.position.set(_s.x, _s.y + d.up / hgt, _s.z - d.back / hgt);
      d.mesh.rotation.set(Math.min(.3, .05 + Math.max(0, lean) * .25) + .03 * Math.sin(p.root.position.x * 3 + _s.y * 9), 0, 0);
    }
    p.root.updateMatrixWorld(true);
  }
  // pose from clip a, cross-fading to clip b by k (each with its own time)
  function blend(p, a, ta, b, tb, k, o = {}) { clip(p, a, ta, o.a || {}); if (k > 0) clip(p, b, tb, { ...(o.b || {}), w: Math.min(k, .999), keep: true }); if (k >= 1) clip(p, b, tb, o.b || {}); }
  function turn(p, n, e) { const b = p.bones[n]; if (!b) return; b.quaternion.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...e))); p.root.updateMatrixWorld(true); }
  const wpos = o => { const v = new THREE.Vector3(); o.getWorldPosition(v); return v; };
  const hand = (p, s) => wpos(p.bones['hand_' + s]);
  const head = p => wpos(p.bones.Head);
  function aimBone(b, from, to) {
    const qd = new THREE.Quaternion().setFromUnitVectors(from.clone().normalize(), to.clone().normalize());
    const bw = new THREE.Quaternion(); b.getWorldQuaternion(bw);
    const pw = new THREE.Quaternion(); b.parent.getWorldQuaternion(pw);
    b.quaternion.copy(pw.invert().multiply(qd.multiply(bw))); b.updateMatrixWorld(true);
  }
  function twoBone(p, n1, n2, n3, target, pole) {
    const b1 = p.bones[n1], b2 = p.bones[n2], b3 = p.bones[n3];
    p.root.updateMatrixWorld(true);
    const A = wpos(b1), Bp = wpos(b2), Cp = wpos(b3), Tt = new THREE.Vector3(...target);
    const la = A.distanceTo(Bp), lb = Bp.distanceTo(Cp), d = Math.min(A.distanceTo(Tt), (la + lb) * .999), dir = Tt.clone().sub(A).normalize();
    const P = pole ? new THREE.Vector3(...pole) : Bp.clone();
    const side = P.clone().sub(A); side.sub(dir.clone().multiplyScalar(side.dot(dir))); if (side.lengthSq() < 1e-8) side.set(0, 1, 0); side.normalize();
    const x = (la * la - lb * lb + d * d) / (2 * d), h = Math.sqrt(Math.max(0, la * la - x * x));
    const E = A.clone().add(dir.clone().multiplyScalar(x)).add(side.multiplyScalar(h));
    aimBone(b1, Bp.clone().sub(A), E.clone().sub(A));
    const B2 = wpos(b2), C2 = wpos(b3), Tn = A.clone().add(dir.multiplyScalar(d));
    aimBone(b2, C2.clone().sub(B2), Tn.clone().sub(B2));
    p.root.updateMatrixWorld(true);
  }
  const reach = (p, s, target, pole) => twoBone(p, 'upperarm_' + s, 'lowerarm_' + s, 'hand_' + s, target, pole);
  const plant = (p, s, target, pole) => twoBone(p, 'thigh_' + s, 'calf_' + s, 'foot_' + s, target, pole);
  // an era outfit for cast member i: P.outfit('stone', i)
  const outfit = (era, i = 0) => OUTFIT[era][((i % OUTFIT[era].length) + OUTFIT[era].length) % OUTFIT[era].length];
  return { ready, make, beast, at, clip, blend, turn, reach, plant, hand, head, wpos, CAST, dress, outfit, OUTFIT, clips: () => Object.keys(CLIPS), clipLen: n => CLIPS[n] && CLIPS[n].duration };
})();
