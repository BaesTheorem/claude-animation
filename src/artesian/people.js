// artesian/people.js: the cast in 3D. Rigged CC0 humans (Quaternius Universal Base Characters + outfits, built into
// assets/cast/*.glb by tools/build_cast.py) animated with CC0 motion clips (Universal Animation Library 1 + 2), all
// sampled as pure functions of time, plus two-bone IK so hands land on handles, levers and ropes.
//
//   await PEOPLE.ready                         resolves once models and clips are loaded (setup waits for it)
//   const p = PEOPLE.make('driller')           a new instance of a cast member (see CAST3); add p.root to a scene
//   PEOPLE.at(p, [x, y, z], yaw)               place feet on the ground at (x, y, z) feet, facing yaw radians (0 = +z)
//   PEOPLE.clip(p, 'Idle_Loop', t, o)          pose from a clip at time t (s); o.w (weight, for layering a second clip),
//                                              o.loop (default true), o.speed; call clip() first with w = 1, then others
//   PEOPLE.bone(p, 'spine_02')                 THREE.Bone by name (for small hand-keyed offsets after the clip)
//   PEOPLE.turn(p, 'spine_02', [rx, ry, rz])   add a local rotation (radians) to a bone, after the clip
//   PEOPLE.reach(p, 'l'|'r', [x, y, z], pole)  two-bone arm IK: put the hand at a world point; pole = elbow hint point
//   PEOPLE.plant(p, 'l'|'r', [x, y, z], pole)  two-bone leg IK for the foot
//   PEOPLE.hand(p, 'l'|'r') / PEOPLE.head(p)   world positions (THREE.Vector3) after posing
//   PEOPLE.clips()                             list of clip names
//   const cow = PEOPLE.beast('cow', '#8A4A2E')  an animal (cow | bull | horse | horse2 | dog); PEOPLE.at / PEOPLE.clip work on it
//                                              (clips: Walk, Gallop, Idle, Idle_Headlow, Eating, Death ...)
// All positions are in FEET (the models are metres, scaled 3.28 on the root).
const PEOPLE = (() => {
  const FILES = { man: 'assets/cast/man.glb', man_beard: 'assets/cast/man_beard.glb', man_ranger: 'assets/cast/man_ranger.glb',
    woman: 'assets/cast/woman.glb', woman_trousers: 'assets/cast/woman_trousers.glb' };
  const ANIMS = ['assets/anim/UAL1_Standard.glb', 'assets/anim/UAL2_Standard.glb'];
  const M2FT = 3.28084;
  const MODELS = {}, CLIPS = {};
  const xhr = url => new Promise((ok, bad) => { const r = new XMLHttpRequest(); r.open('GET', url); r.responseType = 'arraybuffer'; r.onload = () => (r.status === 0 || r.status === 200) ? ok(r.response) : bad(new Error(url + ' ' + r.status)); r.onerror = () => bad(new Error('xhr ' + url)); r.send(); });
  const parse = buf => new Promise((ok, bad) => new (THREE.GLTFLoader)().parse(buf, '', ok, bad));
  const BEAST_FILES = { cow: 'assets/animals/Cow.glb', bull: 'assets/animals/Bull.glb', horse: 'assets/animals/Horse.glb', horse2: 'assets/animals/Horse_White.glb', dog: 'assets/animals/Husky.glb' };
  const BEASTS = {};
  const ready = (async () => {
    await new Promise(r => { const w = () => window.THREE ? r() : setTimeout(w, 20); w(); });
    for (const [k, f] of Object.entries(FILES)) MODELS[k] = await parse(await xhr(f));
    for (const f of ANIMS) { const g = await parse(await xhr(f)); for (const c of g.animations) CLIPS[c.name] = c; }
    for (const [k, f] of Object.entries(BEAST_FILES)) BEASTS[k] = await parse(await xhr(f));
  })();
  // Animals: cow | bull | horse | horse2 | dog. Clips: Walk, Gallop, Idle, Idle_2, Idle_Headlow (drinking), Eating,
  // Death (collapse; play with loop:false), Attack_Kick ... (see PEOPLE.beastClips(kind)).
  function beast(kind, col, o = {}) {
    const src = BEASTS[kind], root = THREE.SkeletonUtils.clone(src.scene), bones = {};
    root.traverse(ob => { if (ob.isBone) bones[ob.name] = ob; if (ob.isMesh) { ob.frustumCulled = false; ob.castShadow = ob.receiveShadow = true; ob.material = P3.mat(col, {}); } });
    const rest = {}; for (const [k, b] of Object.entries(bones)) rest[k] = { q: b.quaternion.clone(), p: b.position.clone(), s: b.scale.clone() };
    root.scale.setScalar(M2FT * (o.scale ?? 1));
    return { root, bones, rest, kind, beast: true, clipsSrc: src.animations };
  }

  // ---------- hats (lathe profiles: [radius, height] from the brim edge up), in metres ----------
  function hatGeom(kind) {
    const T = THREE, V = (x, y) => new T.Vector2(x, y);
    const P = {
      slouch: [V(.001, .165), V(.07, .16), V(.105, .13), V(.112, .06), V(.116, .012), V(.2, .004), V(.215, -.02), V(.19, -.006), V(.12, -.002), V(.1, .0)],
      wide:   [V(.001, .15), V(.08, .145), V(.108, .1), V(.114, .03), V(.118, .01), V(.25, 0), V(.262, -.012), V(.24, -.004), V(.1, -.002)],
      bowler: [V(.001, .15), V(.06, .145), V(.1, .11), V(.108, .04), V(.11, .012), V(.15, .01), V(.162, .03), V(.155, .0), V(.1, -.002)],
      cap:    [V(.001, .08), V(.07, .075), V(.105, .05), V(.112, .01), V(.1, -.002)],
    }[kind];
    const g = new T.LatheGeometry(P, 32);
    if (kind === 'cap') { const peak = new T.CylinderGeometry(.09, .09, .008, 20, 1, false, -Math.PI / 2 - .9, 1.8); peak.translate(0, .004, .07); return THREE.BufferGeometryUtils.mergeGeometries([g.toNonIndexed(), peak.toNonIndexed()]); }
    return g;
  }
  function attachHat(root, kind, col, tilt = 0) {
    const head = root.getObjectByName('Head'); if (!head || !kind) return null;
    root.updateMatrixWorld(true);
    const hat = new THREE.Mesh(hatGeom(kind), P3.mat(col, { side: THREE.DoubleSide }));
    hat.castShadow = hat.receiveShadow = true;
    // rest pose: the crown sits on the skull, level, a little back
    const hw = new THREE.Vector3(); head.getWorldPosition(hw);
    const fem = /woman/.test(root.userData.model || ''), lift = (kind === 'wide' ? .148 : .122) + (fem ? .035 : 0), sc = (kind === 'wide' ? 1.08 : 1.04) * (fem ? 1.16 : 1);
    const want = new THREE.Matrix4().compose(new THREE.Vector3(hw.x, hw.y + lift, hw.z - .012), new THREE.Quaternion().setFromEuler(new THREE.Euler(-.1 + tilt, 0, 0)), new THREE.Vector3(sc, sc, sc));
    const inv = head.matrixWorld.clone().invert(); hat.applyMatrix4(inv.multiply(want));
    head.add(hat); return hat;
  }

  // ---------- the cast ----------
  function make(name, over = {}) {
    const L = { ...CAST3[name], ...over }, src = MODELS[L.model];
    const root = THREE.SkeletonUtils.clone(src.scene);
    const bones = {};
    root.traverse(o => {
      if (o.isBone) bones[o.name] = o;
      if (o.isMesh) {
        o.frustumCulled = false; o.castShadow = true; o.receiveShadow = true;
        const role = (o.material && o.material.name) || 'cloth', col = L[role] || L.cloth || '#888888';
        o.material = P3.mat(col, { style: role === 'skin' ? .9 : role === 'eyes' ? .7 : 1 });
      }
    });
    root.userData.model = L.model;
    // build: broaden or narrow the frame on the rest pose (clips only rotate bones, so this survives animation)
    const bw = L.build ?? 1;
    if (bw !== 1 && bones.spine_02) bones.spine_02.scale.set(bw, 1, bw);      // everything above inherits it (chest, arms)
    if (bw !== 1 && bones.neck_01) bones.neck_01.scale.set(1 / bw, 1, 1 / bw);
    const p = { root, bones, rest: null, L, name, hat: null };
    p.rest = {}; for (const [k, b] of Object.entries(bones)) p.rest[k] = { q: b.quaternion.clone(), p: b.position.clone(), s: b.scale.clone() };
    if (L.hat) p.hat = attachHat(root, L.hat, L.hatCol || '#5B4A3A', L.hatTilt || 0);
    root.scale.setScalar(M2FT * (L.height || 1));
    return p;
  }
  function resetPose(p) { for (const [k, b] of Object.entries(p.bones)) { const r = p.rest[k]; b.quaternion.copy(r.q); b.position.copy(r.p); b.scale.copy(r.s); } }
  function at(p, pos, yaw = 0) { p.root.position.set(...pos); p.root.rotation.set(0, yaw, 0); p.root.updateMatrixWorld(true); }
  function clip(p, name, t, o = {}) {
    const c = p.beast ? p.clipsSrc.find(a => a.name === name) : CLIPS[name]; if (!c) throw new Error('no clip ' + name);
    const w = o.w ?? 1, loop = o.loop ?? true;
    let tt = t * (o.speed ?? 1); tt = loop ? ((tt % c.duration) + c.duration) % c.duration : Math.max(0, Math.min(c.duration - 1e-4, tt));
    if (w >= 1 && !o.keep) resetPose(p);
    const q = new THREE.Quaternion(), v = new THREE.Vector3();
    for (const tr of c.tracks) {
      const [bn, prop] = tr.name.split('.'), b = p.bones[bn]; if (!b) continue;
      if (o.only && !o.only.some(s => bn.startsWith(s))) continue;
      if (o.skip && o.skip.some(s => bn.startsWith(s))) continue;
      const it = tr.createInterpolant(), val = it.evaluate(tt);
      if (prop === 'quaternion') { q.fromArray(val); if (w >= 1) b.quaternion.copy(q); else b.quaternion.slerp(q, w); }
      else if (prop === 'position') { if (bn === 'root') continue; v.fromArray(val); if (w >= 1) b.position.copy(v); else b.position.lerp(v, w); }
    }
    p.root.updateMatrixWorld(true);
  }
  const bone = (p, n) => p.bones[n];
  function turn(p, n, e) { const b = p.bones[n]; b.quaternion.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...e))); p.root.updateMatrixWorld(true); }
  const wpos = o => { const v = new THREE.Vector3(); o.getWorldPosition(v); return v; };
  function hand(p, s) { return wpos(p.bones['hand_' + s]); }
  function head(p) { return wpos(p.bones.Head); }
  // rotate bone b (world space) so that its child's direction a→ goes toward target direction
  function aimBone(b, from, to) {
    const qd = new THREE.Quaternion().setFromUnitVectors(from.clone().normalize(), to.clone().normalize());
    const bw = new THREE.Quaternion(); b.getWorldQuaternion(bw);
    const pw = new THREE.Quaternion(); b.parent.getWorldQuaternion(pw);
    b.quaternion.copy(pw.invert().multiply(qd.multiply(bw)));
    b.updateMatrixWorld(true);
  }
  function twoBone(p, n1, n2, n3, target, pole) {
    const b1 = p.bones[n1], b2 = p.bones[n2], b3 = p.bones[n3];
    p.root.updateMatrixWorld(true);
    const A = wpos(b1), B = wpos(b2), C = wpos(b3), T = new THREE.Vector3(...target);
    const la = A.distanceTo(B), lb = B.distanceTo(C), d = Math.min(A.distanceTo(T), (la + lb) * .999), dir = T.clone().sub(A).normalize();
    // elbow / knee position in the plane of (A, T, pole)
    const P = pole ? new THREE.Vector3(...pole) : B.clone();
    const side = P.clone().sub(A); side.sub(dir.clone().multiplyScalar(side.dot(dir))); if (side.lengthSq() < 1e-8) side.set(0, 1, 0); side.normalize();
    const x = (la * la - lb * lb + d * d) / (2 * d), h = Math.sqrt(Math.max(0, la * la - x * x));
    const E = A.clone().add(dir.clone().multiplyScalar(x)).add(side.multiplyScalar(h));
    aimBone(b1, B.clone().sub(A), E.clone().sub(A));
    const B2 = wpos(b2), C2 = wpos(b3), Tn = A.clone().add(dir.multiplyScalar(d));
    aimBone(b2, C2.clone().sub(B2), Tn.clone().sub(B2));
    p.root.updateMatrixWorld(true);
  }
  const reach = (p, s, target, pole) => twoBone(p, 'upperarm_' + s, 'lowerarm_' + s, 'hand_' + s, target, pole);
  const plant = (p, s, target, pole) => twoBone(p, 'thigh_' + s, 'calf_' + s, 'foot_' + s, target, pole);
  return { ready, make, beast, at, clip, bone, turn, reach, plant, hand, head, clips: () => Object.keys(CLIPS), beastClips: k => BEASTS[k].animations.map(a => a.name), resetPose };
})();

// The cast. model = which GLB; colours by role (skin, shirt, trousers, boots, hair, beard, brows, eyes, belt);
// hat = slouch | wide | bowler | cap. Keep everyone on model by always making them through PEOPLE.make(name).
const CAST3 = {
  // the tool dresser: the crew's mechanic and blacksmith, the John Henry of the piece
  dresser: { model: 'man_beard', skin: '#8A5A3C', shirt: '#E4DAC4', trousers: '#3E5C86', boots: '#3A2A20', hair: '#241E1A', beard: '#241E1A', brows: '#241E1A', eyes: '#2A2320', hat: 'slouch', hatCol: '#4E4034', height: 1.04, build: 1.12 },
  // the driller: in charge of the hole, hand on the rods; a woman
  driller: { model: 'woman_trousers', skin: '#C99272', shirt: '#8A6E52', belt: '#4A3626', trousers: '#5A5046', boots: '#3A2A20', hair: '#3A2A20', brows: '#3A2A20', eyes: '#2A2320', hat: 'wide', hatCol: '#7A6448', height: .96 },
  // Canadian Bill: engine driver and fireman
  bill: { model: 'man_ranger', skin: '#D39A72', shirt: '#A8392C', belt: '#3A2A20', trousers: '#4E473F', boots: '#3A2A20', hair: '#9A4A26', beard: '#9A4A26', brows: '#9A4A26', eyes: '#2A2320', hat: 'cap', hatCol: '#2F3E52', height: 1.05, build: .93 },
  // the boss: the contractor
  boss: { model: 'man', skin: '#D8A07A', shirt: '#EDE3CF', trousers: '#4E4A48', boots: '#2A2220', hair: '#8A8078', brows: '#8A8078', eyes: '#2A2320', hat: 'bowler', hatCol: '#2E2A28', build: 1.1, height: .97 },
  // the crew's second woman: labourer on the bull wheel and the bailer
  hand: { model: 'woman', skin: '#B97E58', shirt: '#6E7E8C', trousers: '#4A4238', boots: '#3A2A20', hair: '#2A221C', brows: '#2A221C', eyes: '#2A2320', hat: 'slouch', hatCol: '#6A5A44', height: .95 },
  // a labourer
  lab: { model: 'man', skin: '#C48A60', shirt: '#B98A52', trousers: '#3A4A5E', boots: '#3A2A20', hair: '#4A3A2E', brows: '#4A3A2E', eyes: '#2A2320', hat: 'slouch', hatCol: '#8A6A44' },
  // the squatter: the station owner
  squatter: { model: 'man_beard', skin: '#D3A07E', shirt: '#F0E8D8', trousers: '#7A6A52', boots: '#5A3E28', hair: '#B8B2A8', beard: '#B8B2A8', brows: '#B8B2A8', eyes: '#2A2320', hat: 'wide', hatCol: '#C9B48A', build: .92, height: 1.01 },
};
