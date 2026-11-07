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
    return p;
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
  function at(p, pos, yaw = 0) { p.root.position.set(...pos); p.root.rotation.set(0, yaw, 0); p.root.updateMatrixWorld(true); }
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
  return { ready, make, beast, at, clip, blend, turn, reach, plant, hand, head, wpos, CAST, clips: () => Object.keys(CLIPS), clipLen: n => CLIPS[n] && CLIPS[n].duration };
})();
