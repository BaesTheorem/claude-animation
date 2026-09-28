// Chapter E (v2) · 153.79–188.97 s · Ruin. Verse 5 [36–40], chorus 5 [41–44]. See docs/artesian/STORYBOARD.md and BRIEF.md.
// Bleached noon: one high sun per set, pale sky, heat shimmer and a mirage drawn in 2D over the 3D.
//
//   E1  153.79 [36] over the squatter's shoulder onto the bank's letter; crane up and back over the dead hole (crows)
//   E2  160.51 [37] a cow skull on the bank; tilt up the shimmering plain (mirage, willy-willy, dust) into the sun
//   E3  164.59 [38] from the glare: the 20 ft bailer is set down on its valve stem in the sludge box: thick grey slurry
//   E4  166.55      the driller's face under her hat brim; she lifts her eyes to the board
//   E5  167.95      over the boss's shoulder: he chalks 3000 FT (the figures drawn in perspective over the board)
//   E6  169.79 [39] long lens: the boss on a crate under the board, reading the contract, then head in his hands
//   E7  173.93 [40] low two-shot: the dresser's hand lands on his shoulder; the boss looks up at him
//   E7b 175.80      over the boss's shoulder: the dresser strides back to the anvil; the hand and the labourer follow
//   E8  177.67 [41] JOHN HENRY, low and side-on: the dresser and the hand strike the hot bit in turn, a blow on every
//                   beat (dresser on the even beats with the rig, the hand on the odd from beat 331), the labourer on the tongs
//   E9  180.89 [42] close at the anvil: the white-hot blade, the tongs, the sledges landing; sparks
//   E10 183.05 [43] heroic low angle on the dresser against the derrick; the last blow is the biggest, then down into the earth
//   E11 186.15 [44] the section: poles, jars, sinker and chisel breaking into the hard grey rock, 3386 → 3500 ft
//
// Transitions: scribble in; dust gust (E1→E2); sun glare (E2→E3); cut on the slump (E3→E4); eyeline (E4→E5);
// page turn, time passes (E5→E6); cut on the hand landing (E6→E7); cut on the turn (E7→E7b); cut into the swing
// (E7b→E8); cut into the downswing (E8→E9); whip pan (E9→E10); tilt down into the ground (E10→E11); scribble out.
// The anvil is moved out from under the forge shed's roof (two sledges swinging overhead would hit it): see AW.
(() => {
  // ---------- noon: one sun for the whole chapter, high and a little to the north-east of the rig ----------
  const SUN = [20, 100, -32];            // the station (elevation ~70°)
  const SUN_SITE = [22, 100, 30];        // the bore site: same noon elevation, over the front of the rig so the stage in front of the derrick is in sun
  const NOON = { top: '#ECE3CB', bot: '#FAF5E8', fog: '#F6EFDF', ground: '#DDC89E', ink: '#3A342E' };
  const bt = n => OFF + n * BEAT;
  const V3 = a => new THREE.Vector3(...a);
  const seamIn = lt => { if (lt < .35) scribbleWipe(.5 + lt / .7); };
  const seamOut = (lt, dur) => { if (lt > dur - .35) scribbleWipe((lt - (dur - .35)) / .7); };
  const grime = n => ({ shirt: mixCol(CAST3[n].shirt, '#6A5640', .14) });

  // ---------- people helpers ----------
  const Q0 = () => new THREE.Quaternion();
  function frameOf(p) { const y = p.root.rotation.y, D = new THREE.Vector3(Math.sin(y), 0, Math.cos(y)), Up = new THREE.Vector3(0, 1, 0); return { D, R: D.clone().cross(Up).normalize(), Up }; }
  function learn(p) {           // the face's forward axis in the head and neck bones' own frames (for aim)
    PEOPLE.at(p, [0, 0, 0], 0); PEOPLE.clip(p, 'Idle_Loop', 0);
    const q = Q0(); p.bones.Head.getWorldQuaternion(q); p.fwdH = new THREE.Vector3(0, 0, 1).applyQuaternion(q.invert());
    const q2 = Q0(); p.bones.neck_01.getWorldQuaternion(q2); p.fwdN = new THREE.Vector3(0, 0, 1).applyQuaternion(q2.invert());
    return p;
  }
  function rotW(b, q) { const bw = Q0(); b.getWorldQuaternion(bw); const pw = Q0(); b.parent.getWorldQuaternion(pw); b.quaternion.copy(pw.invert().multiply(q.clone().multiply(bw))); b.updateMatrixWorld(true); }
  // turn the neck and head so the face points at a world point (w 0..1)
  function aim(p, target, w = 1) {
    if (w <= 0) return;
    for (const [bn, fw, share] of [['neck_01', p.fwdN, .45], ['Head', p.fwdH, 1]]) {
      p.root.updateMatrixWorld(true);
      const b = p.bones[bn], bq = Q0(); b.getWorldQuaternion(bq);
      const cur = fw.clone().applyQuaternion(bq).normalize(), want = V3(target).sub(PEOPLE.head(p)).normalize();
      rotW(b, Q0().slerp(new THREE.Quaternion().setFromUnitVectors(cur, want), share * w));
    }
    p.root.updateMatrixWorld(true);
  }
  // bend a bone forward (+) or back (-) about the person's right axis, in world space
  function bend(p, bn, a) { if (!a) return; const { R } = frameOf(p); rotW(p.bones[bn], new THREE.Quaternion().setFromAxisAngle(R, -a)); p.root.updateMatrixWorld(true); }
  const WALKV = p => 3.03 * (p.L.height || 1);    // ft/s of Walk_Loop at speed 1 (measured from the planted foot)
  // walk from a to b over [t0, t1] (eased), feet planted: the clip advances with distance; blends to Idle at the ends
  function walk(p, a, b, t0, t1, t, o = {}) {
    const k = (o.ease || ease)(seg(t, t0, t1)), L = Math.hypot(b[0] - a[0], b[2] - a[2]), d = k * L;
    const pos = [lerp(a[0], b[0], k), 0, lerp(a[2], b[2], k)], yaw = o.yaw ?? Math.atan2(b[0] - a[0], b[2] - a[2]);
    PEOPLE.at(p, pos, yaw);
    PEOPLE.clip(p, 'Idle_Loop', t * .9 + (o.ph || 0));
    const moving = clamp(Math.min(seg(t, t0 - .15, t0 + .25), 1 - seg(t, t1 - .3, t1 + .1)));
    if (moving > 0) PEOPLE.clip(p, 'Walk_Loop', d / WALKV(p) + (o.ph || 0), { w: moving });
    return { pos, yaw, moving };
  }
  function openHand(p, side, k = .8) {
    for (const [bn, b] of Object.entries(p.bones)) if (/^(index|middle|ring|pinky|thumb)_0[123]_/.test(bn) && bn.endsWith('_' + side)) b.quaternion.slerp(p.rest[bn].q, k);
    p.root.updateMatrixWorld(true);
  }
  function hideAll(list, keep) { for (const p of list) p.root.visible = keep.includes(p); }

  // ---------- 2D: bleached sky, the sun where the 3D light says it is, glare, heat shimmer, dust ----------
  function noonSky() { sky(NOON.top, NOON.bot, { still: true, hatch: .3, tone: .5 }); }
  function sunAt(cam) { const d = V3(SUN).normalize().multiplyScalar(4000).add(cam.position); return P3.project(cam, d.toArray()); }
  function sunDisc(cam, heat = .6, r = 70) {
    const [x, y, z] = sunAt(cam); if (z <= 0) return null;
    seed('Esun'); pglow(x, y, r * 7, '#FFF4D8', .9); pglow(x, y, r * 3.2, '#FFFBEF', 1); sun(x, y, r, heat);
    return [x, y];
  }
  function glare(k, col = '#FFFBF1') { if (k <= 0) return; X.save(); X.setTransform(1, 0, 0, 1, 0, 0); X.globalAlpha = clamp(k); X.fillStyle = col; X.fillRect(0, 0, W, H); X.restore(); }
  function horizonY(cam) {         // screen y of the far horizon straight ahead
    const f = new THREE.Vector3(); cam.getWorldDirection(f); f.y = 0; f.normalize();
    return P3.project(cam, cam.position.clone().add(f.multiplyScalar(5000)).setY(0).toArray())[1];
  }
  let SHIM = null;
  // heat shimmer: re-draw the pencil layer in thin horizontal strips, each nudged sideways (strongest mid-band)
  function shimmer(y0, y1, amp, t, band = 3) {
    if (amp <= 0 || y1 <= y0) return;
    if (!SHIM) { SHIM = document.createElement('canvas'); SHIM.width = W; SHIM.height = H; }
    const c = SHIM.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H); c.drawImage(X.canvas, 0, 0);
    X.save(); X.setTransform(1, 0, 0, 1, 0, 0);
    const a0 = Math.max(0, Math.floor(y0)), a1 = Math.min(H, Math.ceil(y1)), A = Math.ceil(amp) + 2;
    for (let y = a0; y < a1; y += band) {
      const e = Math.sin(Math.PI * (y - y0) / (y1 - y0)), dx = amp * e * (Math.sin(y * .083 + t * 6.1) * .6 + Math.sin(y * .31 - t * 9.7) * .4);
      X.clearRect(0, y, W, band); X.drawImage(SHIM, 0, y, W, band, dx - A, y, W + 2 * A, band);
    }
    X.restore();
  }
  // a mirage: the far band above the horizon, flipped, pale and shimmering below it (the only water on the plain)
  function mirage(yh, h, t, a = .5) {
    if (!SHIM) { SHIM = document.createElement('canvas'); SHIM.width = W; SHIM.height = H; }
    const c = SHIM.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H); c.drawImage(X.canvas, 0, 0);
    X.save(); X.setTransform(1, 0, 0, 1, 0, 0);
    for (let i = 0; i < h; i += 2) {
      const k = i / h, dx = 6 * Math.sin(i * .5 + t * 8) * (1 - k);
      X.globalAlpha = a * (1 - k) * (.6 + .4 * Math.sin(i * .9 + t * 5));
      X.drawImage(SHIM, 0, yh - i - 2, W, 2, dx, yh + i, W, 2);
    }
    X.globalAlpha = a * .5; X.fillStyle = '#EEF1EC'; X.fillRect(0, yh, W, h * .5);
    X.restore();
  }
  // dust lifting off the plain: low puffs drifting with a hot wind, rising and thinning
  function liftDust(cam, t, n, o = {}) {
    seed('Edust' + (o.key || ''));
    const c = o.c || [0, 0], r = o.r || 120;
    for (let i = 0; i < n; i++) {
      const k = frac(t * (o.speed ?? .22) + hash(i * 3.3)), x = c[0] + (hash(i * 7.1) - .5) * 2 * r + k * 40, z = c[1] + (hash(i * 5.3) - .5) * 2 * r;
      const [sx, sy, d] = P3.project(cam, [x, k * (o.rise ?? 5), z]); if (d <= 1) continue;
      psmoke(sx, sy, (o.size ?? 6) * (1 + k * 2) * 900 / d, o.col || '#D9C49C', (o.a ?? .32) * Math.sin(Math.PI * k));
    }
  }
  // a gust of dust across the frame: covers (p 0 → .5, cut under it) and blows off (.5 → 1)
  function dustWipe(p) {
    if (p <= 0 || p >= 1) return;
    X.save(); X.setTransform(1, 0, 0, 1, 0, 0); seed('Egust');
    const c = lerp(W * 1.9, -W * .9, p), hw = W * .66, x0 = c - hw, x1 = c + hw;
    const g = X.createLinearGradient(x0 - 200, 0, x1 + 200, 0);
    g.addColorStop(0, 'rgba(214,194,154,0)'); g.addColorStop(.18, 'rgba(210,189,148,.97)'); g.addColorStop(.82, 'rgba(206,184,142,.97)'); g.addColorStop(1, 'rgba(214,194,154,0)');
    X.fillStyle = g; X.fillRect(x0 - 200, 0, x1 - x0 + 400, H);
    for (let i = 0; i < 70; i++) {
      const y = hash(i * 3.1) * (H + 240) - 120, x = lerp(x0 - 150, x1 + 150, hash(i * 1.7)) + Math.sin(p * 9 + i) * 40, r = 120 + hash(i * 9.1) * 240;
      psmoke(x, y, r, i % 3 ? '#CDB48A' : '#BFA47A', .5);
    }
    X.restore();
  }
  // ---------- the bank's letter, the contract, the account book (lettered plates, no legible words) ----------
  function script(c, w, h, x0, x1, y0, y1, n, sd, col = '#2E2A30') {
    c.strokeStyle = col; c.lineWidth = 3.2; const rnd = lcg(sd);
    for (let i = 0; i < n; i++) {
      const y = lerp(y0, y1, i / Math.max(1, n - 1)), xa = w * (i % 5 === 0 ? x0 + .06 : x0), xb = w * (i === n - 1 ? (x0 + x1) / 2 : x1 - rnd() * .1);
      c.beginPath(); c.moveTo(xa, h * y);
      for (let x = xa; x < xb; x += 6) c.lineTo(x, h * y + Math.sin(x * .45 + i) * 3 - (rnd() < .12 ? 6 : 0));
      c.stroke();
    }
  }
  function paperProp(w, h, paint) { const L = new THREE.Group(); const back = P3.mesh(P3.box(w, h, .01), '#EFE8D8', { cast: false }); back.position.y = h / 2; L.add(back); const f = P3.plate(w * .98, h * .98, '#F1EADA', paint); f.position.set(0, h / 2, .007); L.add(f); return L; }
  const letterProp = () => paperProp(.62, .85, (c, w, h) => {
    c.strokeStyle = '#4A4038'; c.lineWidth = 3; c.beginPath(); c.ellipse(w / 2, h * .09, w * .09, h * .045, 0, 0, TAU); c.stroke();
    c.lineWidth = 2; c.beginPath(); c.moveTo(w * .12, h * .16); c.lineTo(w * .88, h * .16); c.stroke();
    script(c, w, h, .1, .88, .25, .83, 14, 41);
    c.strokeStyle = '#A8322A'; c.lineWidth = 4; c.beginPath(); c.arc(w * .2, h * .9, w * .075, 0, TAU); c.stroke(); c.lineWidth = 2; c.beginPath(); c.arc(w * .2, h * .9, w * .05, 0, TAU); c.stroke();
  });
  const contractProp = () => paperProp(.7, 1.1, (c, w, h) => {
    c.strokeStyle = '#3A3430'; c.lineWidth = 3; c.strokeRect(w * .06, h * .04, w * .88, h * .92);
    c.lineWidth = 5; c.beginPath(); c.moveTo(w * .25, h * .1); c.lineTo(w * .75, h * .1); c.stroke();
    script(c, w, h, .12, .88, .18, .78, 18, 77);
    c.fillStyle = '#B0302A'; c.beginPath(); c.arc(w * .78, h * .87, w * .07, 0, TAU); c.fill();
    c.strokeStyle = '#B0302A'; c.lineWidth = 6; c.beginPath(); c.moveTo(w * .74, h * .9); c.lineTo(w * .7, h * .99); c.moveTo(w * .8, h * .92); c.lineTo(w * .84, h * .99); c.stroke();
  });
  function ledgerProp() {       // an open account book: two ruled pages in a V, a leather cover under them
    const G = new THREE.Group(), pw = .62, ph = .9;
    const cover = P3.mesh(P3.box(pw * 2 + .06, .04, ph + .06), '#5A3A2A'); cover.position.y = -.03; G.add(cover);
    for (const sd of [-1, 1]) {
      const pg = P3.plate(pw, ph, '#EDE5D0', (c, w, h) => {
        c.strokeStyle = 'rgba(80,110,150,.55)'; c.lineWidth = 1.5; for (let i = 1; i < 22; i++) { c.beginPath(); c.moveTo(0, h * i / 22); c.lineTo(w, h * i / 22); c.stroke(); }
        c.strokeStyle = 'rgba(170,50,40,.6)'; c.lineWidth = 2; for (const x of [.14, .7, .84]) { c.beginPath(); c.moveTo(w * x, 0); c.lineTo(w * x, h); c.stroke(); }
        const rnd = lcg(sd > 0 ? 5 : 9); c.strokeStyle = '#2E2A30'; c.lineWidth = 2;
        for (let i = 2; i < 21; i++) { const y = h * (i + .6) / 22; if (rnd() < .2) continue;
          c.beginPath(); c.moveTo(w * .17, y); for (let x = w * .17; x < w * (.3 + rnd() * .35); x += 5) c.lineTo(x, y - Math.abs(Math.sin(x * .6)) * 5); c.stroke();
          c.beginPath(); c.moveTo(w * .72, y); for (let x = w * .72; x < w * .83; x += 4) c.lineTo(x, y - Math.abs(Math.sin(x * .9 + i)) * 5); c.stroke(); }
        if (sd > 0) { c.lineWidth = 2.5; c.beginPath(); c.moveTo(w * .7, h * .93); c.lineTo(w * .84, h * .93); c.moveTo(w * .7, h * .945); c.lineTo(w * .84, h * .945); c.stroke(); }
      });
      pg.rotation.x = -Math.PI / 2; const hinge = new THREE.Group(); hinge.rotation.z = sd * .12; pg.position.set(sd * pw / 2, 0, 0); hinge.add(pg); G.add(hinge);
    }
    return G;
  }
  // orient a flat prop: its local +y along `up`, local +z (the face) toward `face`; the group's origin goes to `at`
  function orient(obj, at, up, face) {
    const Y = V3(up).normalize(), Zr = V3(face).normalize(), Xa = Y.clone().cross(Zr).normalize(), Z = Xa.clone().cross(Y).normalize();
    obj.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(Xa, Y, Z)); obj.position.copy(at.isVector3 ? at : V3(at)); obj.updateMatrixWorld(true);
  }
  // hold a sheet in front of a person's chest, facing their eyes; returns grip points for the hands
  function holdSheet(L, p, h, down, out, tilt, spread = .29) {
    const { D, R } = frameOf(p), hd = PEOPLE.head(p), Up = new THREE.Vector3(0, 1, 0);
    const C = hd.clone().add(D.clone().multiplyScalar(out)).add(new THREE.Vector3(0, -down, 0));
    const Y = Up.clone().multiplyScalar(Math.cos(tilt)).add(D.clone().multiplyScalar(Math.sin(tilt))).normalize(), Z = R.clone().cross(Y).normalize();
    L.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(R, Y, Z)); L.position.copy(C).add(Y.clone().multiplyScalar(-h / 2)); L.updateMatrixWorld(true);
    const grip = (sx, sy) => C.clone().add(R.clone().multiplyScalar(sx)).add(Y.clone().multiplyScalar(sy)).toArray();
    return { l: grip(-spread, -h * .2), r: grip(spread, -h * .26), C, R, D };
  }

  // ---------- the station at noon: dry hole, carcasses, the squatter with the bank's letter ----------
  // a tapered tube along a curve (horn cores, bones): radius r0 at the start to r1 at the end
  function taperTube(pts, r0, r1, col, seg = 10) {
    const curve = new THREE.CatmullRomCurve3(pts.map(V3)), g = new THREE.TubeGeometry(curve, seg, 1, 7, false), P = g.attributes.position;
    for (let i = 0; i <= seg; i++) { const c = curve.getPointAt(i / seg), r = lerp(r0, r1, i / seg); for (let j = 0; j <= 7; j++) { const k = i * 8 + j, v = new THREE.Vector3().fromBufferAttribute(P, k).sub(c).multiplyScalar(r).add(c); P.setXYZ(k, v.x, v.y, v.z); } }
    g.computeVertexNormals(); return P3.mesh(g, col);
  }
  // a bleached cow skeleton, fallen on its side: skull (horn cores, orbits, long face), jaw apart, spine, a sprung rib cage,
  // pelvis and scattered leg bones. Local x runs from the tail (-) to the skull (+), z toward the belly side.
  function skeleton() {
    const G = new THREE.Group(), bone = '#EFE8D6', dark = '#3A3028', add = (m, p, r) => { m.position.set(...p); if (r) m.rotation.set(...r); G.add(m); return m; };
    const sk = new THREE.Group(); sk.position.set(1.7, .02, .6); sk.rotation.set(.22, .575, -.12); G.add(sk); G.userData.skull = sk;
    const cr = P3.mesh(new THREE.SphereGeometry(.5, 16, 12), bone); cr.scale.set(.85, .75, 1.05); cr.position.set(0, .45, 0); sk.add(cr);
    const poll = P3.mesh(P3.box(.34, .26, 1.3), bone); poll.position.set(-.18, .7, 0); sk.add(poll);
    const face = P3.mesh(P3.cyl(.2, .43, 1.55, 6).rotateZ(-Math.PI / 2), bone); face.scale.set(1, .72, 1.08); face.position.set(.98, .34, 0); sk.add(face);
    const muz = P3.mesh(new THREE.SphereGeometry(.2, 10, 8), bone); muz.scale.set(.9, .7, 1.2); muz.position.set(1.74, .26, 0); sk.add(muz);
    const nas = P3.mesh(P3.box(.12, .16, .2), dark); nas.position.set(1.9, .3, 0); sk.add(nas);
    for (const sd of [-1, 1]) {
      const ring = P3.mesh(new THREE.TorusGeometry(.19, .06, 6, 16), bone); ring.position.set(.28, .5, sd * .46); sk.add(ring);
      const hole = P3.mesh(new THREE.SphereGeometry(.15, 10, 8), dark); hole.position.set(.28, .5, sd * .43); sk.add(hole);
      sk.add(taperTube([[-.2, .72, sd * .55], [-.12, .86, sd * 1.05], [.12, 1.08, sd * 1.4], [.38, 1.42, sd * 1.52]], .15, .05, bone));
    }
    const jaw = new THREE.Group(); jaw.position.set(3.3, .06, 1.9); jaw.rotation.set(0, .9, 0); G.add(jaw);
    for (const sd of [-1, 1]) { const h = P3.mesh(P3.box(1.5, .1, .16), bone); h.position.set(0, .05, sd * .16); h.rotation.y = sd * .12; jaw.add(h); const ram = P3.mesh(P3.box(.16, .5, .12), bone); ram.position.set(-.72, .22, sd * .26); ram.rotation.z = .5; jaw.add(ram); }
    // spine from the neck to the pelvis, lying on the ground with a gentle curve
    const sp = x => [x, .3, .15 * Math.sin(x * .45)];
    for (let i = 0; i < 17; i++) { const x = .5 - i * .42, [px, py, pz] = sp(x); add(P3.mesh(P3.cyl(.14, .14, .26, 8).rotateZ(Math.PI / 2), bone), [px, py - .05, pz], [0, .1 * Math.sin(i), 0]); const pro = add(P3.mesh(P3.box(.07, .5, .09), bone), [px - .05, py + .35, pz - .08], [.35, 0, -.4]); pro.visible = i > 2; }
    // ribs: the upper side still sprung in a row of arches from the spine over toward the belly, some broken short
    for (let i = 0; i < 12; i++) {
      const x = -.55 - i * .36, L = 1.9 + 1.0 * Math.sin((i + 1) / 13 * Math.PI), broken = i === 3 || i === 8 ? .45 : 1, lean = (hash(i * 3.3) - .5) * .35;
      const z0 = .15 * Math.sin(x * .45), pts = [];
      for (let k = 0; k <= 5; k++) { const a = k / 5 * Math.PI * .95 * broken; pts.push([x - Math.sin(a) * .25 + lean * Math.sin(a), .38 + Math.sin(a) * L * .55, z0 + (1 - Math.cos(a)) * L * .5]); }
      G.add(taperTube(pts, .07, .04, bone, 12));
      if (i % 3 === 1) G.add(taperTube([[x + .2, .05, z0 - .3], [x + .6, .05, z0 - 1.2], [x + .5, .05, z0 - 2.0]], .05, .035, bone, 6));   // fallen lower-side ribs
    }
    const pel = new THREE.Group(); pel.position.set(-6.8, .35, .1); pel.rotation.set(.3, .1, 0); G.add(pel);
    for (const sd of [-1, 1]) { const w = P3.mesh(P3.box(1.3, .12, .55), bone); w.position.set(0, 0, sd * .42); w.rotation.set(sd * .5, sd * .3, 0); pel.add(w); }
    const bn = (a, b, r) => { G.add(taperTube([a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + .05, (a[2] + b[2]) / 2], b], r, r * .8, bone, 4)); for (const q of [a, b]) add(P3.mesh(new THREE.SphereGeometry(r * 1.7, 8, 6), bone), q); };
    bn([-7.4, .12, 1.2], [-8.6, .12, 2.6], .1); bn([-6.2, .12, 1.9], [-5.6, .12, 3.6], .1); bn([-1.2, .1, 2.8], [-.2, .1, 3.9], .09); bn([.6, .1, -1.4], [1.9, .1, -2.4], .09);
    return G;
  }
  // crows circling over the dead hole (2D birds on projected 3D points)
  function crows(cam, t, c, n = 4, o = {}) {
    for (let i = 0; i < n; i++) {
      const a = t * (.35 + hash(i) * .2) + i * 1.9, r = 12 + hash(i * 3) * 10, p = [c[0] + Math.cos(a) * r, (o.h ?? 20) + hash(i * 5) * 10 + Math.sin(t + i) * 2, c[1] + Math.sin(a) * r * .8];
      const [x, y, d] = P3.project(cam, p), [x2] = P3.project(cam, [p[0] + 1, p[1], p[2]]); if (d <= 1) continue;
      const s = Math.max(2.5, Math.min(26, Math.abs(x2 - x) * .9 + 900 / d));
      crow(x, y, s, frac(t * 1.6 + hash(i)), { key: 'Ecrow' + i, flip: Math.sin(a) > 0 });
    }
  }
  // a willy-willy: a dust devil wandering across the far plain
  function willy(cam, p, t, h = 70) {
    seed('Ewilly');
    for (let i = 0; i < 16; i++) {
      const k = i / 15, a = t * 4.2 + k * 7, rr = lerp(1.5, 12, Math.pow(k, 1.4)), q = [p[0] + Math.cos(a) * rr * .6 + k * k * 8, k * h, p[2] + Math.sin(a) * rr * .4];
      const [x, y, d] = P3.project(cam, q); if (d <= 1) continue;
      psmoke(x, y, (rr * 1.3 + 3) * 900 / d, '#D6BF94', .34 * (1 - k * .5));
    }
  }
  const STATION = () => P3.cached('E-station', () => {
    const o = P3.scene({ sunDir: SUN, sun: 2.9, fill: .6, shadowSize: 70 });
    const st = WORLD.stationSet({ col: NOON.ground }); o.scene.add(st);
    WORLD.trees(o.scene, 34, { r0: 160, r1: 1300, dead: .85, seed: 5 });
    // carcasses in and around the dry hole: cattle that came to drink and never got up (beasts are built ~3x life: .31 is
    // life size, as chapter A)
    const cows = [['#7A5A42', [-5, 0, 3], 2.2], ['#9A7A58', [7.5, 0, -6], -.8], ['#6A5446', [12.5, 0, 8.5], .9], ['#B09070', [-11, 0, -9], 1.9]].map(([col, pos, yaw]) => {
      const c = PEOPLE.beast('cow', col, { scale: .31 }); PEOPLE.at(c, pos, yaw); PEOPLE.clip(c, 'Death', .999, { loop: false }); o.scene.add(c.root); return c;
    });
    const bones = skeleton(); bones.position.set(...SK.pos); bones.rotation.y = SK.yaw; o.scene.add(bones);
    const sq = learn(PEOPLE.make('squatter')); o.scene.add(sq.root);
    const letter = letterProp(); o.scene.add(letter);
    return { scene: o.scene, o, st, cows, bones, sq, letter, cam: P3.cam(34) };
  });

  const SQ = { pos: [5, 0, 19.5], yaw: Math.PI + .22 };
  // the squatter with the letter: reading (low 0) → letter lowered, looking out over the hole (low 1)
  function squatterPose(S, t, low) {
    const { sq, letter } = S;
    PEOPLE.at(sq, SQ.pos, SQ.yaw); PEOPLE.clip(sq, 'Idle_Loop', t * .8 + 1.1);
    const g = holdSheet(letter, sq, .85, lerp(1.45, 2.3, low), lerp(1.1, .7, low), lerp(1.0, .1, low));
    const { R } = frameOf(sq), below = new THREE.Vector3(0, -1.3, 0);
    PEOPLE.reach(sq, 'r', g.r, g.C.clone().add(R.clone().multiplyScalar(1.3)).add(below).toArray());
    if (low < .45) PEOPLE.reach(sq, 'l', g.l, g.C.clone().add(R.clone().multiplyScalar(-1.3)).add(below).toArray());
    aim(sq, [lerp(g.C.x, -4, low), lerp(g.C.y, 1.2, low), lerp(g.C.z, 3, low)], lerp(.7, .9, low));
    return g;
  }
  // E1 [36] ruin to the squatter: over his shoulder onto the bank's letter, then crane up and back over the dead hole
  function e1(t, lt, dur) {
    const S = STATION(), { sq } = S;
    const low = ease(seg(lt, 2.7, 4.3)), g = squatterPose(S, t, low);
    const { R, D } = frameOf(sq), hd = PEOPLE.head(sq);
    noonSky();
    // the crane, in his frame: swing out to his right first (clear of the hat brim), pull back steadily, rise late
    const k = ease(seg(lt, 2.4, dur - .25)), dr = seg(lt, 0, 2.4) * .25;
    const cp = hd.clone().add(R.clone().multiplyScalar(lerp(.95, 5.3, easeOut(k)))).add(D.clone().multiplyScalar(-lerp(.95 - dr, 26.8, k)))
      .add(new THREE.Vector3(0, lerp(1.3, 9.9, easeIn(k) * .6 + k * .4), 0));
    const tg = g.C.clone().lerp(new THREE.Vector3(-3, 1.5, -5), ease(seg(lt, 2.4, dur - .7)));
    S.cam.fov = lerp(30, 38, k); S.cam.updateProjectionMatrix();
    P3.look(S.cam, cp.toArray(), tg.toArray());
    sunDisc(S.cam, .7);
    P3.draw(S.o, S.cam, { fog: [180, 1400], fogCol: NOON.fog, ink: NOON.ink, near: .2, lineW: lerp(1.9, 1.4, k) });
    const yh = horizonY(S.cam); if (yh > 0 && yh < H) shimmer(yh - 34, yh + 46, 3.5 * k, t);
    if (k > .2) crows(S.cam, t, [-2, -3], 4, { h: 11 });
    seamIn(lt);
    if (lt > dur - .5) dustWipe((lt - (dur - .5)) / 1.0);
  }
  // E2 [37] the weather's growing hotter: down among the bones, then a tilt up the shimmering plain into the sun
  const SK = { pos: [-14.1, 0, 16.55], yaw: -2.13 };  // on the hole's far bank: skull toward the camera, ribs toward the sun and the windmill
  function e2(t, lt, dur) {
    const S = STATION();
    squatterPose(S, t, 1);
    noonSky();
    const toSun = V3(SUN).setY(0).normalize(), side = new THREE.Vector3(-toSun.z, 0, toSun.x);
    const skull = new THREE.Vector3(); S.bones.updateMatrixWorld(true); S.bones.userData.skull.localToWorld(skull.set(.7, .45, 0));
    const k = ease(seg(lt, .95, dur - .35)), kp = easeIn(seg(lt, .95, dur - .35)) * .5 + k * .5;
    const cp = skull.clone().add(toSun.clone().multiplyScalar(lerp(-3.4, -4.6, k))).add(side.clone().multiplyScalar(lerp(1.3, .3, k))).setY(lerp(1.0, 1.7, k));
    const pitch = lerp(-.2, 1.08, kp), yawOff = lerp(-.28, 0, k);
    const fwd = toSun.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), yawOff);
    const tg = k < .001 ? skull.clone().add(toSun.clone().multiplyScalar(.6)) : cp.clone().add(fwd.multiplyScalar(Math.cos(pitch) * 10)).add(new THREE.Vector3(0, Math.sin(pitch) * 10, 0));
    const t0 = skull.clone().add(toSun.clone().multiplyScalar(.6)), tt = t0.lerp(tg, clamp(k * 4));
    S.cam.fov = lerp(40, 54, k); S.cam.updateProjectionMatrix();
    P3.look(S.cam, cp.toArray(), (k < .25 ? tt : tg).toArray());
    const sp = sunDisc(S.cam, .6 + .4 * k, 64 + 70 * k);
    P3.draw(S.o, S.cam, { fog: [150, 1200], fogCol: NOON.fog, ink: NOON.ink, near: .2, lineW: lerp(1.8, 1.4, k) });
    const yh = horizonY(S.cam);
    if (yh > -80 && yh < H + 80) { mirage(yh, 24, t, .5); shimmer(yh - 80, yh + 70, 5 + 4 * k, t); }
    willy(S.cam, [90 + lt * 5, 0, -190], t, 80);
    liftDust(S.cam, t, 18, { c: [40, -80], r: 70, key: 'e2' });
    crows(S.cam, t, [4, -14], 3, { h: 30 });
    if (sp) glare(easeIn(seg(lt, dur - 1.1, dur)) * .96);
    if (lt < .5) dustWipe(.5 + lt / 1.0);
  }

  // ---------- the bore site at noon ----------
  const AW = [-14, 0, 21];                // the anvil, moved out from under the forge shed's roof so two sledges can swing
  const CR = [-7.4, 0, 12.85];           // the boss's crate, just in front of the leg that carries the depth board
  function smithTongs() {                 // blacksmith's tongs: two reins to a rivet, short jaws (grip at the origin, jaws along +y)
    const G = new THREE.Group(), iron = '#3E3B38';
    for (const sd of [-1, 1]) { const r = P3.beam([sd * .06, 0, 0], [sd * .03, 2.2, 0], .07, .05, iron); G.add(r); const j = P3.beam([sd * .03, 2.2, 0], [sd * .09, 2.6, 0], .08, .06, iron); G.add(j); }
    const rv = P3.mesh(P3.cyl(.06, .06, .16, 8).rotateX(Math.PI / 2), iron); rv.position.y = 2.2; G.add(rv);
    return G;
  }
  function hotBit() {                     // a chisel bit (Cox: 3 ft 4 in): iron shank and collar, the blade end hot from the forge
    const G = new THREE.Group();
    const sh = P3.mesh(P3.cyl(.2, .2, 2.5, 12).rotateZ(Math.PI / 2), '#4A4744'); sh.position.x = -1.45; G.add(sh);
    const col = P3.mesh(P3.cyl(.27, .27, .3, 12).rotateZ(Math.PI / 2), '#3E3B38'); col.position.x = -2.7; G.add(col);
    const pin = P3.mesh(P3.cyl(.14, .16, .45, 10).rotateZ(Math.PI / 2), '#3E3B38'); pin.position.x = -3.05; G.add(pin);
    const neck = P3.mesh(P3.cyl(.2, .22, .45, 12).rotateZ(Math.PI / 2), '#A0502C', { emit: '#7A2A10', emitK: .5 }); neck.position.x = -.02; G.add(neck);
    const bg = P3.box(.62, .42, .52), bp = bg.attributes.position;          // the chisel: full thickness at the neck, a thin edge at the tip
    for (let i = 0; i < bp.count; i++) if (bp.getX(i) > 0) bp.setY(i, bp.getY(i) * .1);
    bg.computeVertexNormals();
    const blade = P3.mesh(bg, '#E8792E', { style: .6, emit: '#E0601E', emitK: 1 }); blade.position.x = .5; G.add(blade);
    return G;
  }
  function bailer20() {          // origin at the tip of the valve stem; the tube runs 20 ft up +y to the bail
    const G = new THREE.Group();
    const tube = P3.mesh(P3.cyl(.24, .24, 19.3, 14), '#707068'); tube.position.y = .7 + 9.65; G.add(tube);
    const shoe = P3.mesh(P3.cyl(.28, .28, .45, 14), '#4A4744'); shoe.position.y = .8; G.add(shoe);
    const stem = P3.mesh(P3.cyl(.05, .05, .7, 8), '#3E3B38'); stem.position.y = .35; G.add(stem);
    const bail = P3.mesh(new THREE.TorusGeometry(.3, .05, 5, 14, Math.PI), '#3E3B38'); bail.position.y = 20; G.add(bail);
    for (let i = 0; i < 7; i++) { const L = .8 + hash(i * 3) * 2.2, a = i / 7 * TAU, st = P3.mesh(P3.box(.07, L, .03), '#5E5C56', { cast: false }); st.position.set(Math.cos(a) * .245, 1.1 + L / 2 + hash(i) * .6, Math.sin(a) * .245); st.rotation.y = -a + Math.PI / 2; G.add(st); }
    return G;
  }
  const SITE = () => P3.cached('E-site', () => {
    const o = P3.scene({ sunDir: SUN_SITE, sun: 2.9, fill: .6, shadowSize: 75 });
    const site = WORLD.site({ col: NOON.ground, board: 2900, dead: .8, trees: 60 }); o.scene.add(site.group);
    const R = site.rig, U = R.userData;
    const anvil = U.shed.children.find(c => c.isGroup); anvil.position.set(AW[0] - U.shed.position.x, 0, AW[2] - U.shed.position.z); anvil.rotation.y = Math.PI / 4;   // horn toward the rig
    const P = {}; for (const n of ['driller', 'boss', 'dresser', 'hand', 'lab', 'bill']) { P[n] = learn(PEOPLE.make(n, grime(n))); o.scene.add(P[n].root); }
    const bailer = bailer20(); o.scene.add(bailer);
    const line = P3.mesh(P3.cyl(.05, .05, 1, 6), '#5A5048', { cast: false }); o.scene.add(line);
    const tray = new THREE.Group(); o.scene.add(tray);        // the sludge box on the derrick floor
    { const tb = '#B09068'; const b = P3.mesh(P3.box(2.4, .1, 1.6), tb); b.position.y = .05; tray.add(b);
      for (const [w, d, x, z] of [[2.4, .12, 0, .74], [2.4, .12, 0, -.74], [.12, 1.6, 1.14, 0], [.12, 1.6, -1.14, 0]]) { const s = P3.mesh(P3.box(w, .5, d), tb); s.position.set(x, .25, z); tray.add(s); } }
    const sludge = P3.mesh(new THREE.SphereGeometry(1, 18, 10, 0, TAU, 0, Math.PI / 2), '#9A968C'); o.scene.add(sludge);
    const clods = []; for (let i = 0; i < 7; i++) { const c = P3.mesh(new THREE.IcosahedronGeometry(.16 + hash(i) * .12, 0), '#7E7B74'); o.scene.add(c); clods.push(c); }
    const crate = P3.mesh(P3.box(1.9, 1.5, 1.5), '#8A6A48'); crate.position.set(CR[0], .75, CR[2]); o.scene.add(crate);
    const ledger = ledgerProp(); o.scene.add(ledger);
    const contract = contractProp(); o.scene.add(contract);
    const chalk = P3.mesh(P3.box(.07, .07, .26), '#F4F0E4'); o.scene.add(chalk);
    const sl1 = PROPS.sledge(), sl2 = PROPS.sledge(); o.scene.add(sl1); o.scene.add(sl2);
    const tongs = smithTongs(); o.scene.add(tongs);
    const bit = hotBit(); o.scene.add(bit);
    const people = Object.values(P);
    // The section is built into this same cached set (lazily, see SECT) so the chapter holds only two cache entries.
    // P3.cached keeps three; a set from another chapter already in the cache (chapter A's T=0 draw) has no .scene, and
    // evicting it throws in P3's dispose. The proxy lets P3 dispose both scenes when this set is evicted.
    const E = { o, site, R, U, P, people, bailer, line, tray, sludge, clods, crate, ledger, contract, chalk, sl1, sl2, tongs, bit, board: site.board, cam: P3.cam(34), sect: null };
    E.scene = { traverse: f => { o.scene.traverse(f); if (E.sect) E.sect.o.scene.traverse(f); } };
    return E;
  });
  // the rig for a shot: drilling (beam on the beat) or stopped with the tools out of the hole (bailing)
  function rigState(S, t, drilling) {
    const { R, U } = S;
    RIG.pose(R, drilling ? { stroke: RIG.strokeAt(t), amp: 1, fly: t * 6.2, turn: Math.floor(bpOf(t) / 2) * .3 } : { stroke: 0, amp: 0, fly: 2.1 });
    U.rods.visible = drilling; U.tiller.visible = drilling;
  }
  // the board face without figures (lines of old rubbed chalk, and the smear of the figure just rubbed out)
  function blankBoard(board, smear) {
    board.userData.paint((c, w, h) => {
      c.strokeStyle = 'rgba(230,225,210,.25)'; c.lineWidth = 3; for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(0, h * (i + .5) / 9); c.lineTo(w, h * (i + .5) / 9 + (i % 3) - 1); c.stroke(); }
      c.globalAlpha = .2 * smear; c.fillStyle = '#EDE6D6'; c.fillRect(w * .08, h * .22, w * .84, h * .62);
    }, 'Eblank' + Math.round(smear * 20));
  }
  function boardPt(board, u, v, off = 0) {   // a point on the board face: u, v in -1..1 across and up
    board.updateMatrixWorld(true); return board.localToWorld(new THREE.Vector3(u * 1.6, v * .8, off));
  }

  // P3.draw only the given roots (lights stay on): lets a figure pass in front of a 2D overlay drawn on the scene
  function drawOnly(S, roots, o) {
    const ch = S.o.scene.children, vis = ch.map(c => c.visible);
    ch.forEach(c => { if (!c.isLight) c.visible = roots.includes(c) && c.visible; });
    siteDraw(S, o); ch.forEach((c, i) => c.visible = vis[i]);
  }
  // chalk figures on the depth board, drawn in 2D over the render in true perspective (the board is in shade at noon
  // and the pencil hatching eats the plate's own lettering): piecewise-affine over a 4x2 grid of the board face
  function chalkOverlay(cam, board, txt, reveal, alpha = 1) {
    if (alpha <= 0) return;
    const cw = 512, chh = 256; board.updateMatrixWorld(true);
    const toS = (cx, cy) => P3.project(cam, board.localToWorld(new THREE.Vector3(cx / cw * 3.2 - 1.6, .8 - cy / chh * 1.6, .01)).toArray());
    X.save();
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
      const x0 = cw * i / 4, x1 = cw * (i + 1) / 4, y0 = chh * j / 2, y1 = chh * (j + 1) / 2;
      const A = toS(x0, y0), B = toS(x1, y0), C = toS(x0, y1), D = toS(x1, y1);
      X.save(); X.setTransform(1, 0, 0, 1, 0, 0);
      X.beginPath(); X.moveTo(A[0], A[1]); X.lineTo(B[0], B[1]); X.lineTo(D[0], D[1]); X.lineTo(C[0], C[1]); X.closePath(); X.clip();
      const a = (B[0] - A[0]) / (x1 - x0), b = (B[1] - A[1]) / (x1 - x0), c = (C[0] - A[0]) / (y1 - y0), d = (C[1] - A[1]) / (y1 - y0);
      X.setTransform(a, b, c, d, A[0] - a * x0 - c * y0, A[1] - b * x0 - d * y0);
      X.beginPath(); X.rect(0, 0, cw * lerp(.08, .93, reveal), chh); X.clip();
      X.font = `${Math.round(chh * .55)}px "Cabin Sketch", serif`; X.textAlign = 'center'; X.textBaseline = 'middle';
      X.fillStyle = '#F3EEE2'; X.globalAlpha = .93 * alpha; X.fillText(txt, cw / 2, chh * .54);
      X.globalAlpha = .3 * alpha; X.fillText(txt, cw / 2 + 3, chh * .54 - 2);
      X.restore();
    }
    X.restore();
  }
  function standBy(S, keep) { hideAll(S.people, keep); for (const k of ['bailer', 'line', 'tray', 'sludge', 'ledger', 'contract', 'chalk', 'sl1', 'sl2', 'tongs', 'bit']) S[k].visible = false; S.clods.forEach(c => c.visible = false); }
  function siteDraw(S, o = {}) { P3.draw(S.o, S.cam, { fog: [160, 1300], fogCol: NOON.fog, ink: NOON.ink, near: o.near ?? .3, lineW: o.lineW ?? 1.5, lightTint: .4 }); }
  function stackSmoke(S, t) {
    const [sx, sy, d] = P3.project(S.cam, S.U.stackTop); if (d <= 0) return;
    for (let i = 0; i < 5; i++) { const q = frac(t * .45 + i / 5); psmoke(sx + q * 160, sy - q * 260, (16 + q * 70) * 60 / d, '#9C968E', .38 * (1 - q)); }
  }

  // E3 [38] no artesian water: the 20 ft bailer is set down on its valve stem in the sludge box and dumps grey slurry
  const TR = [2.6, 0, 3.4];
  function bailScene(S, t, lt) {
    const { U, P, bailer, line, tray, sludge, clods } = S, fy = U.floorY;
    tray.visible = true; tray.position.set(TR[0], fy, TR[2]); tray.rotation.y = .25;
    const down = ease(seg(lt, .3, .8)), lift = ease(seg(lt, 1.5, 1.95));
    const sway = Math.sin(lt * 5.2 + .6) * .1 * (1 - seg(lt, 0, .8));
    const bb = [TR[0] + sway, fy + .1 + lerp(1.2, 0, down) + lift * .35, TR[2] + sway * .3];
    bailer.visible = line.visible = true; PROPS.at(bailer, bb, [0, 0, 0]);
    const top = V3([bb[0], bb[1] + 20, bb[2]]), crown = V3([.9, U.H + 1.4, -.9]);
    line.position.copy(top).add(crown).multiplyScalar(.5); line.scale.set(1, top.distanceTo(crown), 1); line.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), crown.clone().sub(top).normalize());
    const flow = easeOut(seg(lt, .78, 1.6));
    sludge.visible = flow > .01; sludge.position.set(TR[0] + .12, fy + .1, TR[2] + .06); sludge.rotation.y = .25; sludge.scale.set(1.15 * flow + .01, .38 * flow + .01, .72 * flow + .01);
    clods.forEach((c, i) => { const k = seg(lt, .82 + i * .07, 1.25 + i * .07), a = i * 2.4 + .5; c.visible = k > 0; c.position.set(TR[0] + Math.cos(a) * (.25 + .5 * k), fy + .16 + .5 * Math.sin(k * Math.PI) * (1 - k), TR[2] + Math.sin(a) * (.2 + .35 * k)); });
    const hand = P.hand; PEOPLE.at(hand, [TR[0] + 1.75, fy, TR[2] + .45], -Math.PI / 2 - .2); PEOPLE.clip(hand, 'Idle_Loop', t + .6);
    PEOPLE.reach(hand, 'r', [bb[0] + .2, fy + 4.3, bb[2] + .12], [TR[0] + 2.6, fy + 3.2, TR[2] - .8]);
    PEOPLE.reach(hand, 'l', [bb[0] + .18, fy + 3.55, bb[2] + .2], [TR[0] + 2.2, fy + 2.6, TR[2] + 1.4]);
    bend(hand, 'spine_02', .08); aim(hand, [TR[0], fy + .3, TR[2]], .9);
    const dr = P.driller; PEOPLE.at(dr, [.2, fy, -.9], .1); PEOPLE.clip(dr, 'Idle_Loop', t + 1.9);
    return { bb, flow };
  }
  function e3(t, lt, dur) {
    const S = SITE(), { U, P } = S, fy = U.floorY;
    standBy(S, [P.hand, P.driller, P.bill]); rigState(S, t, false); S.board.userData.set(2900);
    const B = bailScene(S, t, lt); aim(P.driller, [TR[0], fy, TR[2]], .9);
    const bi = P.bill; PEOPLE.at(bi, [36.8, 0, 4.4], Math.PI * .92); PEOPLE.clip(bi, 'Idle_Loop', t * .9 + 2.1);
    noonSky();
    const k = ease(seg(lt, 0, dur));
    P3.look(S.cam, [TR[0] - .9 + k * .3, fy + lerp(2.4, 2.0, k), lerp(11.6, 9.6, ease(seg(lt, .6, dur)))], [TR[0] + .2, fy + lerp(3.0, .9, ease(seg(lt, .05, 1.1))), TR[2]]);
    S.cam.fov = 48; S.cam.updateProjectionMatrix();
    siteDraw(S, { near: .2, lineW: 1.7 });
    glare(1 - easeOut(seg(lt, 0, .55)));
  }
  // E4 the driller's face: she looks down at the slurry, then lifts her eyes to the boss at the board
  function e4(t, lt, dur) {
    const S = SITE(), { U, P } = S, fy = U.floorY;
    standBy(S, [P.hand, P.driller]); rigState(S, t, false); S.board.userData.set(2900);
    bailScene(S, t, 1.95 + lt * .2);
    const dr = P.driller, look = ease(seg(lt, .45, 1.0));
    const at = [lerp(TR[0], -6.8, look), lerp(fy + 1.6, fy + 5.2, look), lerp(TR[2], 9.7, look)];
    aim(dr, at, 1);
    const hd = PEOPLE.head(dr), { D, R } = frameOf(dr);
    noonSky();
    P3.look(S.cam, hd.clone().add(D.clone().multiplyScalar(3.0)).add(R.clone().multiplyScalar(.9)).add(new THREE.Vector3(0, -1.5, 0)).toArray(), hd.clone().add(new THREE.Vector3(0, .05, 0)).add(R.clone().multiplyScalar(.1)).toArray());
    S.cam.fov = 26; S.cam.updateProjectionMatrix();
    siteDraw(S, { near: .2, lineW: 1.9 });
  }
  // E5 the boss chalks 3000 on the board; the camera pushes in over his shoulder; a page turns (time passes)
  const BN = [Math.sin(.5), 0, Math.cos(.5)], BX = [Math.cos(.5), 0, -Math.sin(.5)], BP = [-7.6, 7.4, 8.2];
  function e5(t, lt, dur) {
    const S = SITE(), { U, P, board, chalk } = S, fy = U.floorY;
    standBy(S, [P.boss, P.driller, P.hand]); rigState(S, t, false);
    bailScene(S, t, 1.95);
    const boss = P.boss; PEOPLE.at(boss, [BP[0] + BN[0] * 1.7 - BX[0] * .25, fy, BP[2] + BN[2] * 1.7 - BX[2] * .25], Math.atan2(-BN[0], -BN[2])); PEOPLE.clip(boss, 'Idle_Loop', t + .4);
    const k = lerp(.25, 1, seg(lt, .05, 1.0)), wipe = 1; blankBoard(board, 1 - clamp((k - .25) / .5));
    const wr = clamp((k - .25) / .75), u = k < .25 ? -.1 + Math.sin(k / .25 * Math.PI * 3) * .45 : lerp(-.78, .8, wr), v = k < .25 ? -.05 + Math.cos(k / .25 * Math.PI * 3) * .12 : -.06 + Math.sin(wr * 38) * .07;
    const drop = ease(seg(lt, 1.0, 1.3)), { D, R } = frameOf(boss);
    const hp = boardPt(board, u, v, .1).lerp(PEOPLE.head(boss).add(new THREE.Vector3(0, -2.5, 0)).add(R.clone().multiplyScalar(.5)), drop);
    PEOPLE.reach(boss, 'r', hp.toArray(), hp.clone().add(R.clone().multiplyScalar(1.3)).add(new THREE.Vector3(0, -1.5, 0)).add(D.clone().multiplyScalar(-.8)).toArray());
    chalk.visible = true; const hr = PEOPLE.hand(boss, 'r'), cpt = boardPt(board, u, v, 0).lerp(hr.clone().add(new THREE.Vector3(0, -.3, 0)), drop);
    PROPS.place(chalk, hr, cpt); chalk.position.copy(hr.clone().lerp(cpt, .55));
    aim(boss, boardPt(board, lerp(0, .3, drop), lerp(0, -.6, drop), 0).toArray(), .8);
    bend(boss, 'spine_03', .12 * drop);
    noonSky();
    const push = ease(seg(lt, 0, 1.2)), hb = PEOPLE.head(boss);
    const c = hb.clone().add(D.clone().multiplyScalar(-lerp(5.4, 2.9, push))).add(R.clone().multiplyScalar(lerp(1.6, 1.0, push))).add(new THREE.Vector3(0, lerp(2.9, 2.2, push), 0));
    P3.look(S.cam, c.toArray(), boardPt(board, lerp(-.1, .42, push), lerp(-1.3, -.6, push), 0).toArray());
    S.cam.fov = lerp(42, 40, push); S.cam.updateProjectionMatrix();
    siteDraw(S, { near: .2, lineW: 1.8 });
    chalkOverlay(S.cam, board, '3000 FT', clamp((k - .25) / .75));
    drawOnly(S, [boss.root, chalk], { near: .2, lineW: 1.8 });
    if (lt > dur - .45) pageTurn((lt - (dur - .45)) / .9, -1);
  }
  // E6 [39] the boss alone with the contract and the account book, head in his hands
  const BOSS_YAW = .15;
  function bossSeat(S, t) { const boss = S.P.boss, D = [Math.sin(BOSS_YAW), 0, Math.cos(BOSS_YAW)]; PEOPLE.at(boss, [CR[0] + D[0] * 1.05, 0, CR[2] + D[2] * 1.05], BOSS_YAW); PEOPLE.clip(boss, 'Sitting_Idle_Loop', t * .7); return boss; }
  // despair 0: reading the contract, the book on his knees; 1: elbows on knees, head in his hands. look: aim point (overrides)
  function bossPose(S, t, despair, o = {}) {
    const { ledger, contract } = S, boss = bossSeat(S, t), { D, R } = frameOf(boss);
    bend(boss, 'spine_02', .22 * despair); bend(boss, 'spine_03', .14 * despair + .04 * Math.sin(t * 1.3) * despair);
    const kl = new THREE.Vector3(), kr = new THREE.Vector3(), th = new THREE.Vector3();
    boss.bones.calf_l.getWorldPosition(kl); boss.bones.calf_r.getWorldPosition(kr); boss.bones.thigh_l.getWorldPosition(th);
    const lap = kl.clone().add(kr).multiplyScalar(.5).lerp(th.setY(kl.y), .3).add(new THREE.Vector3(0, .18, 0));
    ledger.visible = contract.visible = true;
    const lu = new THREE.Vector3(0, 1, 0).add(D.clone().multiplyScalar(-.5)).normalize();
    ledger.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(R, lu, R.clone().cross(lu)));
    ledger.position.copy(lap); ledger.updateMatrixWorld(true);
    const brow = PEOPLE.head(boss).add(D.clone().multiplyScalar(.32)).add(new THREE.Vector3(0, .12, 0));
    const read = o.read ?? 0;   // 1: the contract held up before his eyes in the right hand
    const lh = lap.clone().add(R.clone().multiplyScalar(-.5)).add(D.clone().multiplyScalar(.1)).lerp(brow.clone().add(R.clone().multiplyScalar(-.2)), despair);
    const rUp = PEOPLE.head(boss).add(D.clone().multiplyScalar(1.1)).add(new THREE.Vector3(0, -.9, 0)).add(R.clone().multiplyScalar(.25));
    const rh = lap.clone().add(R.clone().multiplyScalar(.5)).add(D.clone().multiplyScalar(.1)).lerp(rUp, read).lerp(brow.clone().add(R.clone().multiplyScalar(.2)), despair);
    PEOPLE.reach(boss, 'l', lh.toArray(), lh.clone().add(R.clone().multiplyScalar(-1)).add(new THREE.Vector3(0, -1.1, 0)).add(D.clone().multiplyScalar(.5)).toArray());
    PEOPLE.reach(boss, 'r', rh.toArray(), rh.clone().add(R.clone().multiplyScalar(1)).add(new THREE.Vector3(0, -1.1, 0)).add(D.clone().multiplyScalar(.5)).toArray());
    const hr = PEOPLE.hand(boss, 'r');
    if (read > .02 && despair < .3) orient(contract, hr.clone().add(new THREE.Vector3(0, -.12, 0)), new THREE.Vector3(0, 1, 0).add(D.clone().multiplyScalar(.5)).toArray(), D.clone().multiplyScalar(-1).add(new THREE.Vector3(0, .6, 0)).toArray());
    else orient(contract, lap.clone().add(D.clone().multiplyScalar(-.3)).add(R.clone().multiplyScalar(.12)).add(new THREE.Vector3(0, .05, 0)), D.toArray(), [0, 1, 0]);
    if (o.look) aim(boss, o.look, o.lookW ?? 1);
    else if (read > .02 && despair < .3) aim(boss, hr.toArray(), .8);
    else if (despair < .5) aim(boss, lap.toArray(), .8);
    else bend(boss, 'Head', .5 * despair);
    return boss;
  }
  function e6(t, lt, dur) {
    const S = SITE(), { U, P } = S;
    standBy(S, [P.boss, P.driller, P.bill]); rigState(S, t, true); S.crate.visible = true; S.board.userData.set(3000);
    const dr = P.driller; PEOPLE.at(dr, [2.3, U.floorY, 1.6], -Math.PI / 2 - .55); PEOPLE.clip(dr, 'Idle_Loop', t + .7); PEOPLE.reach(dr, 'r', [1.3, U.tillerAt[1], .25], [3, U.tillerAt[1] - 1.5, 2.5]);
    const bi = P.bill; PEOPLE.at(bi, [36.8, 0, 4.4], Math.PI * .92); PEOPLE.clip(bi, 'Idle_Loop', t * .9 + 2.1); PEOPLE.reach(bi, 'r', U.throttle, [37.5, 5, 6]);
    const read = ease(seg(lt, .35, .9)) * (1 - ease(seg(lt, 1.7, 2.1))), despair = ease(seg(lt, 2.0, 2.9));
    bossPose(S, t, despair, { read });
    noonSky();
    // high and long: the boss slumped on his crate under the chalked board, the number over his head
    const k = ease(seg(lt, 0, dur + .5));
    P3.look(S.cam, [lerp(-4.8, -5.3, k), 6.0, lerp(39.5, 36.5, k)], [-7.2, lerp(4.0, 4.1, k), 14]);
    S.cam.fov = 20; S.cam.updateProjectionMatrix();
    siteDraw(S, { lineW: 1.6 });
    chalkOverlay(S.cam, S.board, '3000 FT', 1);
    drawOnly(S, [S.P.boss.root, S.ledger, S.contract], { lineW: 1.6 });
    stackSmoke(S, t);
    if (lt < .45) pageTurn(.5 + lt / .9, -1);
  }
  // E7 [40] the dresser's hand lands on his shoulder; the boss looks up; the dresser turns back to the work; the crew follow
  // the dresser's place by the boss, and where the three of them go back to (their stands at the anvil)
  function e7Block(S, t) {
    const { U, P } = S;
    const dr = P.driller; PEOPLE.at(dr, [2.3, U.floorY, 1.6], -Math.PI / 2 - .55); PEOPLE.clip(dr, 'Idle_Loop', t + .7); PEOPLE.reach(dr, 'r', [1.3, U.tillerAt[1], .25], [3, U.tillerAt[1] - 1.5, 2.5]);
    const boss0 = bossSeat(S, t), uar = new THREE.Vector3(); boss0.bones.upperarm_r.getWorldPosition(uar);
    const { D: Db, R: Rb } = frameOf(boss0);
    const dStand = uar.clone().add(Rb.clone().multiplyScalar(1.35)).add(Db.clone().multiplyScalar(-.35)).setY(0);
    return { Db, Rb, uar, dStand, go: onA(.3, -4.3) };
  }
  const TURN = 175.72;       // the dresser takes his hand away and turns back to the work
  function e7(t, lt, dur) {
    const S = SITE(), { P } = S;
    standBy(S, [P.boss, P.dresser, P.driller]); rigState(S, t, true); S.crate.visible = true; S.board.userData.set(3000);
    const { Db, Rb, uar, dStand, go } = e7Block(S, t), dz = P.dresser;
    let dh;
    if (t < TURN) { PEOPLE.at(dz, dStand.toArray(), Math.atan2(uar.x - dStand.x, uar.z - dStand.z) - .15); PEOPLE.clip(dz, 'Idle_Loop', t + 2.3); dh = PEOPLE.head(dz); }
    else { walk(dz, dStand.toArray(), go, TURN, TURN + 3.2, t, { ph: .3 }); dh = PEOPLE.head(dz); }
    const lifted = ease(seg(lt, .65, 1.35));
    bossPose(S, t, 1 - lifted, { look: lifted > .02 ? dh.toArray() : null, lookW: lifted * .6 });
    const sp = new THREE.Vector3(); P.boss.bones.upperarm_r.getWorldPosition(sp); sp.add(new THREE.Vector3(0, .26, 0)).add(Rb.clone().multiplyScalar(.2)).add(Db.clone().multiplyScalar(-.08));
    if (t < TURN) {
      const on = easeOut(seg(lt, 0, .45)) * (1 - ease(seg(t, TURN - .3, TURN))), from = PEOPLE.hand(dz, 'r'), tgt = from.clone().lerp(sp, on);
      const { R: Rd } = frameOf(dz);
      if (on > 0) { PEOPLE.reach(dz, 'r', tgt.toArray(), tgt.clone().add(new THREE.Vector3(0, -1.0, 0)).add(Rd.clone().multiplyScalar(.9)).toArray()); openHand(dz, 'r', .85 * on); }
      aim(dz, PEOPLE.head(P.boss).toArray(), .85);
      bend(dz, 'Head', .2 * Math.sin(Math.PI * seg(lt, 1.05, 1.5)));
    }
    noonSky();
    const hb = PEOPLE.head(P.boss), mid = hb.clone().lerp(dh, .5), k = ease(seg(lt, 0, dur));
    const c0 = mid.clone().add(Db.clone().multiplyScalar(lerp(5.6, 5.0, k))).add(Rb.clone().multiplyScalar(.5)).add(new THREE.Vector3(0, -1.9, 0));
    P3.look(S.cam, c0.toArray(), mid.clone().add(new THREE.Vector3(0, -.35, 0)).toArray());
    S.cam.fov = 42; S.cam.updateProjectionMatrix();
    siteDraw(S, { near: .2 });
  }
  // E7b the crew follow: from behind the seated boss, the dresser strides back to the anvil and the other two come off
  // the rig floor after him (cut on the dresser's turn)
  function e7b(t, lt, dur) {
    const S = SITE(), { P } = S;
    standBy(S, [P.boss, P.dresser, P.hand, P.lab, P.driller]); rigState(S, t, true); S.crate.visible = true; S.board.userData.set(3000);
    const { Db, Rb, dStand, go } = e7Block(S, t), dz = P.dresser;
    walk(dz, dStand.toArray(), go, TURN, TURN + 3.2, t, { ph: .3 });
    walk(P.hand, [-2.6, 0, 13.4], onA(.2, 4.4), t - lt - .5, t - lt + 3.4, t, { ph: .9 });
    walk(P.lab, [-1.4, 0, 12.0], onA(-4.4, 1.25), t - lt + .1, t - lt + 3.6, t, { ph: 1.4 });
    bossPose(S, t, 0, { look: PEOPLE.head(dz).toArray(), lookW: .75 });
    // waiting at the anvil: the hot bit on the face, the two sledges leaning on the stump, the tongs across the heel
    const { sl1, sl2, bit, tongs } = S; bit.visible = sl1.visible = sl2.visible = tongs.visible = true;
    bit.position.set(...onA(-.2, 0, ANV[1] + .14)); bit.rotation.set(0, Math.atan2(-UA[2], UA[0]), -.04); bit.updateMatrixWorld(true);
    PROPS.place(sl1, onA(.1, -1.05, .05), onA(.25, -.7, 2.9), .6); PROPS.place(sl2, onA(-.3, 1.05, .05), onA(-.35, .72, 2.9), -.4);
    PROPS.place(tongs, onA(-2.2, .5, .2), onA(-.9, .15, 3.25));
    noonSky();
    const hb = PEOPLE.head(P.boss), k = ease(seg(lt, 0, dur + .3));
    const cam = hb.clone().add(Db.clone().multiplyScalar(-2.3)).add(Rb.clone().multiplyScalar(-4.1)).add(new THREE.Vector3(0, lerp(.2, .45, k), 0));
    P3.look(S.cam, cam.toArray(), V3(onA(-.2, -1.2, 3.2)).lerp(V3(onA(-.2, -1.8, 3.4)), k).toArray());
    S.cam.fov = 54; S.cam.updateProjectionMatrix();
    siteDraw(S, { near: .2 });
    anvilGlow(S, S.cam, t);
    stackSmoke(S, t);
  }

  // ---------- the anvil: two strikers, a blow on every beat ----------
  // The team, around the anvil: UA points from the anvil toward the camp (-x,+z), away from the rig; VA across it (+x,+z).
  // The bit lies along UA, blade on the face toward the camp, shank over the horn to the labourer (at -UA, the rig side,
  // facing the camp). The dresser (at -VA) and the hand (at +VA) face each other across the anvil and strike in turn.
  // From the camp side the strikers are in profile with the labourer between them and the derrick behind.
  const ANV = [AW[0], 3.1, AW[2]], UA = [-Math.SQRT1_2, 0, Math.SQRT1_2], VA = [Math.SQRT1_2, 0, Math.SQRT1_2];
  const onA = (u, v, y = 0) => [AW[0] + UA[0] * u + VA[0] * v, y, AW[2] + UA[2] * u + VA[2] * v];
  const yawTo = (from, to) => Math.atan2(to[0] - from[0], to[2] - from[2]);
  function anvilWork(S, t) {
    const { P, sl1, sl2, tongs, bit } = S;
    const bp = bpOf(t), BC = onA(-.2, 0, ANV[1] + .14);
    bit.visible = true; bit.position.set(...BC); bit.rotation.set(0, Math.atan2(-UA[2], UA[0]), -.04); bit.updateMatrixWorld(true);
    const blade = bit.localToWorld(new THREE.Vector3(.5, 0, 0)).toArray();
    // each stroke lands a little along the blade; the dresser's bar blows are the biggest, the hand's lighter
    const tgt = (n, sd) => { const w = (hash(n * 3.7) - .5) * .18; return [blade[0] + UA[0] * w + VA[0] * sd * .06, blade[1] + .06, blade[2] + UA[2] * w + VA[2] * sd * .06]; };
    const dz = P.dresser, hd = P.hand, toHand = yawTo(onA(0, -1), onA(0, 1)), toDz = yawTo(onA(0, 1), onA(0, -1));
    const kd = frac(bp / 2), nd = 2 * Math.floor(bp / 2) + 2;       // the dresser's next blow lands on even beat nd (with the rig)
    const Td = V3(tgt(nd - 2, -1)).lerp(V3(tgt(nd, -1)), ease(clamp(kd / .5))).toArray();
    const stD = PROPS.swingStand(dz, Td, toHand, { reach: 1.7 });
    PEOPLE.at(dz, stD, toHand); PEOPLE.clip(dz, 'Idle_Loop', t * .6 + .3);
    sl1.visible = true;
    const backD = nd === 346 ? 1.12 : nd % 4 === 0 ? .98 : .62 + .26 * hash(nd);     // bar blows are the biggest, and the last before the dive biggest of all
    const rd = PROPS.swing(dz, sl1, kd, { target: Td, lead: 'r', back: backD, lean: 1.2 });
    const started = bp >= 331 - .02, kh = started ? frac((bp - 1) / 2) : 0, nh = 2 * Math.floor((bp - 1) / 2) + 3;
    const Th = V3(tgt(nh - 2, 1)).lerp(V3(tgt(nh, 1)), ease(clamp(kh / .5))).toArray();
    const stH = PROPS.swingStand(hd, Th, toDz, { reach: 1.6 });
    PEOPLE.at(hd, stH, toDz); PEOPLE.clip(hd, 'Idle_Loop', t * .55 + 1.7);
    sl2.visible = true;
    const rh = PROPS.swing(hd, sl2, kh, { target: Th, lead: 'l', back: .45 + .25 * hash(nh * 1.3), lean: .95 });
    // the labourer holds the bit's shank in the tongs beyond the horn, on the rig side, facing the camp
    const lb = P.lab, lpos = onA(-4.4, 1.25), recoil = .05 * Math.exp(-frac(bp) * 8);   // the blows jar up the tongs into his arms
    PEOPLE.at(lb, lpos, yawTo(lpos, onA(0, .2))); PEOPLE.clip(lb, 'Idle_Loop', t * .7 + 2.9);
    bend(lb, 'spine_02', .2 + recoil);
    const jaw = bit.localToWorld(new THREE.Vector3(-2.1, 0, 0)), grip = onA(-3.15, .75, 3.72 + recoil);
    tongs.visible = true; PROPS.place(tongs, grip, jaw);
    PEOPLE.reach(lb, 'r', onA(-3.2, .55, 3.7 + recoil), onA(-4.1, -.6, 2.6));
    PEOPLE.reach(lb, 'l', onA(-3.5, 1.0, 3.66 + recoil), onA(-4.2, 2.3, 2.6));
    aim(lb, blade, .7);
    return { rd, rh, blade, nd, nh, stD };
  }
  // sparks: a burst in 3D from the strike point, projected and drawn as short hot streaks
  function sparks(cam, t, o) {
    const bp = bpOf(t), last = Math.floor(bp + 1e-4);
    for (const n of [last, last - 1]) {
      if (!o.who(n)) continue;
      const a = t - bt(n); if (a < 0 || a > .5) continue;
      const P = o.at(n), N = 14 + Math.floor(hash(n * 1.3) * 12);
      seed('Espark' + n);
      const [hx, hy, hd] = P3.project(cam, P); if (hd <= .3) continue;
      const fl = Math.exp(-a * 16);
      pglow(hx, hy, 40 * 22 / hd * (1 + fl), '#FFC870', .7 * fl + .15 * Math.exp(-a * 5));
      for (let i = 0; i < N; i++) {
        const s = n * 31 + i, life = .18 + hash(s) * .3; if (a > life) continue;
        const th = hash(s * 1.7) * TAU, up = .15 + hash(s * 2.3) * .8, sp = 9 + hash(s * 3.1) * 16;
        const v = [Math.cos(th) * sp, up * sp * .8, Math.sin(th) * sp * .7];
        const at = aa => [P[0] + v[0] * aa, P[1] + v[1] * aa - 14 * aa * aa, P[2] + v[2] * aa];
        const [x1, y1] = P3.project(cam, at(a)), [x0, y0] = P3.project(cam, at(Math.max(0, a - .04)));
        const fade = 1 - a / life;
        pline([[x0, y0], [x1, y1]], 1.5 * fade + .4, '#E0661E', { over: 0, passes: 1, j: .3, alpha: .9 });
        pline([[lerp(x0, x1, .4), lerp(y0, y1, .4)], [x1, y1]], .8 * fade + .3, '#FFF3C8', { over: 0, passes: 1, j: .2 });
      }
    }
  }
  function anvilGlow(S, cam, t) {
    const tip = S.bit.localToWorld(new THREE.Vector3(.35, 0, 0)).toArray(), [x, y, d] = P3.project(cam, tip);
    if (d > 0) pglow(x, y, 26 * 30 / d, '#FF8A3A', .55);
    const [fx, fy, fd] = P3.project(cam, S.U.forge); if (fd > 0) pglow(fx, fy, 60 * 30 / fd, '#FF7A30', .6);
    return [x, y, d];
  }
  function chorusBlock(S, t, keep) {
    const { U, P } = S; standBy(S, keep); rigState(S, t, true); S.board.userData.set(3000);
    const dr = P.driller; PEOPLE.at(dr, [2.3, U.floorY, 1.6], -Math.PI / 2 - .55); PEOPLE.clip(dr, 'Idle_Loop', t + .7); PEOPLE.reach(dr, 'r', [1.3, U.tillerAt[1], .25], [3, U.tillerAt[1] - 1.5, 2.5]);
    const bi = P.bill; PEOPLE.at(bi, [36.8, 0, 4.4], Math.PI * .92); PEOPLE.clip(bi, 'Idle_Loop', t * .9 + 2.1); PEOPLE.reach(bi, 'r', U.throttle, [37.5, 5, 6]);
    const boss = P.boss; if (keep.includes(boss)) { bossSeat(S, t); aim(boss, ANV, .8); }
    return anvilWork(S, t);
  }
  const whoStrikes = n => n % 2 === 0 ? true : n >= 333;
  function sparkAt(A) { return () => [A.blade[0], A.blade[1] + .18, A.blade[2]]; }
  // E8 [41] John Henry: side on to the anvil, the two strikers in profile, a blow on every beat; the hand joins on 333
  function e8(t, lt, dur) {
    const S = SITE(), { P } = S, A = chorusBlock(S, t, [P.dresser, P.hand, P.lab, P.driller, P.bill]);
    noonSky();
    const k = ease(seg(lt, 0, dur + .4));
    P3.look(S.cam, onA(lerp(9.6, 8.2, k), lerp(-4.2, -3.2, k), lerp(1.7, 1.4, k)), onA(-.8, lerp(-.3, -.1, k), lerp(4.2, 4.4, k)));
    S.cam.fov = 54; S.cam.updateProjectionMatrix();
    siteDraw(S, { lineW: 1.6 });
    anvilGlow(S, S.cam, t);
    sparks(S.cam, t, { who: whoStrikes, at: sparkAt(A) });
    heatOver(S, t);
  }
  // E9 [42] close on the anvil: the white-hot blade, the tongs, the sledges landing in turn; whip pan out
  function e9(t, lt, dur) {
    const S = SITE(), { P } = S, A = chorusBlock(S, t, [P.dresser, P.hand, P.lab]);
    noonSky();
    const k = ease(seg(lt, 0, dur)), whip = easeIn(seg(lt, dur - .2, dur));
    const tg = V3(onA(.2, 0, 3.4)).lerp(V3(onA(-3, 6, 4.4)), whip);
    P3.look(S.cam, onA(lerp(3.5, 3.0, k), lerp(.5, .3, k), lerp(3.9, 4.0, k)), tg.toArray());
    S.cam.fov = 44; S.cam.updateProjectionMatrix();
    siteDraw(S, { lineW: 1.8, near: .2 });
    anvilGlow(S, S.cam, t);
    sparks(S.cam, t, { who: whoStrikes, at: sparkAt(A) });
    if (whip > 0) smear(whip, 1);
  }
  function smear(k, dir = 1) {
    if (!SHIM) { SHIM = document.createElement('canvas'); SHIM.width = W; SHIM.height = H; }
    const c = SHIM.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H); c.drawImage(X.canvas, 0, 0);
    X.save(); X.setTransform(1, 0, 0, 1, 0, 0);
    for (let i = 1; i <= 8; i++) { X.globalAlpha = .2 * k; X.drawImage(SHIM, -dir * i * 70 * k, 0); }
    X.restore();
    seed('Esmear'); for (let i = 0; i < 26; i++) { const y = hash(i * 3.3) * 880, x = hash(i) * W; pline([[x, y], [x + dir * 420 * k, y]], 1.2, AP.graphiteLt, { over: 0, passes: 1, alpha: .5 * k }); }
  }
  // E10 [43] heroic low angle: past the anvil to the dresser, the derrick at his back and the beam dropping with his blows;
  // on the last bar blow the camera tilts down into the ground and carries on into the earth (E11)
  function e10(t, lt, dur) {
    const S = SITE(), { P } = S, A = chorusBlock(S, t, [P.dresser, P.hand, P.lab, P.driller, P.bill, P.boss]);
    S.crate.visible = true;
    noonSky();
    const wh = 1 - easeOut(seg(lt, 0, .22)), k = ease(seg(lt, 0, dur)), down = easeIn(seg(t, bt(346) + .04, t - lt + dur));
    const cam = V3(onA(lerp(6.8, 6.0, k), lerp(-5.0, -4.7, k), lerp(2.9, 2.6, k)));
    const tg = V3(onA(-.3, -3.3, lerp(5.5, 5.8, k))).add(V3(onA(0, 1, 0)).sub(V3(onA(0, 0, 0))).multiplyScalar(-wh * 7)).lerp(V3(onA(-1, -3, -2)), down);
    P3.look(S.cam, cam.toArray(), tg.toArray());
    S.cam.fov = 58; S.cam.updateProjectionMatrix();
    siteDraw(S, { lineW: 1.6 });
    anvilGlow(S, S.cam, t);
    sparks(S.cam, t, { who: whoStrikes, at: sparkAt(A) });
    stackSmoke(S, t);
    heatOver(S, t);
    if (wh > 0) smear(wh, -1);
  }
  // heat over the forge and the white-hot blade: the air shimmers above them
  function heatOver(S, t) {
    const [x, y, d] = P3.project(S.cam, V3(S.bit.localToWorld(new THREE.Vector3(.5, 0, 0))).add(new THREE.Vector3(0, 1.2, 0)).toArray());
    if (d > 0 && y > 0 && y < 880) shimmer(y - 120 * 12 / d, y + 20, 3.5 * 12 / Math.max(6, d), t, 2);
  }

  // ---------- E11 [44] the section: down through the sandy shale into the hard grey rock, to 3500 ft ----------
  // The string as in Thompson's Fig. 51 (RESEARCH.md): yellow poles with an iron joint every 20 ft, the jars, the heavy
  // sinker bar and the chisel. The bore stands full of water from the upper springs.
  const SECT = () => { const S = SITE(); return S.sect || (S.sect = buildSect()); };
  const buildSect = () => {
    const o = P3.scene({ sunDir: [45, 70, 80], sun: 2.6, fill: .55, shadowSize: 40 });
    const S = WORLD.section({ bottom: 4400, w: 84 }); o.scene.add(S);
    const SU = S.userData;
    SU.slot.material.color.set('#4A565A'); SU.slot.material.userData.albedo.copy(SU.slot.material.color);
    SU.bit.material.color.set('#9A958C'); SU.bit.material.userData.albedo.copy(SU.bit.material.color);
    const joints = new THREE.Group(); o.scene.add(joints);
    for (let i = 0; i < 60; i++) joints.add(P3.mesh(P3.cyl(.42, .42, .5, 10), '#3A3632', { cast: false }));
    const sinker = P3.mesh(P3.cyl(.5, .5, 1, 12), '#4A4540'); o.scene.add(sinker);
    const jars = new THREE.Group(); o.scene.add(jars);
    for (const sx of [-.34, .34]) { const l = P3.mesh(P3.box(.14, 2.6, .5), '#3A3632'); l.position.x = sx; jars.add(l); }
    for (const yy of [-1.3, 1.3]) { const c = P3.mesh(P3.box(.9, .22, .5), '#3A3632'); c.position.y = yy; jars.add(c); }
    // the hard grey rock is harder: a denser, bluer grey with a few quartz veins
    const veins = new THREE.Group(); S.add(veins);
    for (let i = 0; i < 14; i++) { const v = P3.mesh(P3.box(4 + hash(i) * 9, .18, .2), '#D8D6CE', { cast: false }); v.position.set((hash(i * 3) - .5) * 76, SU.y(3405 + hash(i * 7) * 580), .25); v.rotation.z = (hash(i * 5) - .5) * .6; if (Math.abs(v.position.x) < 4) v.position.x += 8; veins.add(v); }
    return { o, S, SU, joints, sinker, jars, cam: P3.cam(36) };
  };
  function sectPose(E, t, d) {
    const SU = E.SU, st = RIG.strokeAt(t);
    SU.set(d, st, { casing: 2860 });
    const lift = st < .75 ? Math.sin(st / .75 * Math.PI / 2) : 1 - Math.pow((st - .75) / .25, 2), bot = SU.y(d) + lift * 1.6;
    const since = frac(bpOf(t) / 2) * 2 * BEAT, play = .3 * Math.exp(-since * 12);   // the jars' play: the poles land a moment after the bit
    SU.bit.scale.setScalar(1.25); SU.bit.position.y = bot + 2.0;
    E.sinker.position.set(0, bot + 5.8, .75); E.sinker.scale.y = 3.6;
    E.jars.position.set(0, bot + 8.9 - play, .75);
    const top = bot + 10.2 - play;
    SU.rods.scale.y = Math.max(.01, 8.8 - top); SU.rods.position.y = (8.8 + top) / 2;
    E.joints.children.forEach((j, i) => { const y = top + .25 + i * 2; j.visible = y < 4; j.position.set(0, y, .75); });
    const sh = .08 * Math.exp(-since * 6) * Math.sin(since * 62); SU.rods.position.x = sh;
    return { st, since };
  }
  function e11(t, lt, dur) {
    const E = SECT(), SU = E.SU, cam = E.cam, bp = bpOf(t);
    // the bit walks down through the last of the sandy shale and into the hard grey rock: each blow gains less
    const n = Math.floor(bp / 2), blows = clamp((bp / 2 - 173) / 5.3);
    const depth = lerp(3386, 3500, 1 - Math.pow(1 - blows, 1.6));
    const { since } = sectPose(E, t, depth);
    const ty = SU.y(depth) + 2, k = ease(seg(lt, 0, dur)), drop = 1 - easeOut(seg(lt, 0, .5));
    P3.look(cam, [lerp(11, 9, k), ty + lerp(4.5, 2.5, k) + drop * 18, lerp(17, 15, k)], [lerp(-.6, -1.0, k), ty + lerp(-.4, -1.6, k) + drop * 19, 0]);
    cam.fov = 38; cam.updateProjectionMatrix();
    const s = E.o.sun; s.target.position.set(0, ty, 0); s.target.updateMatrixWorld(); s.position.set(45, ty + 70, 80); s.color.set('#FFF6E6');
    seed('Esbg'); ptone(rectPts(-40, -40, W + 80, H + 80), '#5E564C', .55); pshade(rectPts(-40, -40, W + 80, H + 80), AP.graphite, .5);
    P3.draw(E.o, cam, { fog: [60, 200], fogCol: '#B8AC96', near: 1, far: 900, lineW: 1.8, lightTint: .45 });
    // the depth read: a ruler down the face left of the bore, the bit's depth marked with a rust arrow
    seed('Eruler');
    const P = d => P3.project(cam, [-6.5, SU.y(d), .7]);
    pline([P(3250), P(3650)], 1.3, AP.graphite, { over: 0, passes: 1 });
    for (let d = 3250; d <= 3650; d += 50) { const big = d % 100 === 0, p = P(d), q = P3.project(cam, [-9.5 + (big ? 2.6 : 1.3), SU.y(d), .7]); pline([p, q], big ? 1.4 : .8, AP.graphite, { over: 0, passes: 1 }); if (big && p[1] > 30 && p[1] < 870) label(`${d} FT`, q[0] + 12, q[1], 32, AP.graphite, { screen: true, alpha: .92 }); }
    { const p = P(depth), b = P3.project(cam, [-1.4, SU.y(depth), .9]); for (let i = 0; i < 12; i++) { const a = i / 12, c = (i + .55) / 12; pline([[lerp(p[0], b[0], a), lerp(p[1], b[1], a)], [lerp(p[0], b[0], c), lerp(p[1], b[1], c)]], .9, AP.rust, { over: 0, passes: 1, alpha: .8 }); } pfill([[p[0] - 6, p[1]], [p[0] - 34, p[1] - 14], [p[0] - 34, p[1] + 14]], AP.rust, { tone: .9, sw: 1 }); }
    // each blow: grey rock chips and dust at the bit, a ring of light off the hard rock
    const hit = Math.exp(-since * 6.5), [bx, by, bd] = P3.project(cam, [0, SU.y(depth) + .2, 1.0]);
    if (hit > .05 && bd > .3) {
      const sc = 900 / bd;
      seed('Edust'); psmoke(bx, by - sc * .9, sc * (1.4 + (1 - hit) * 2.4) / 1, '#CFC8BA', .6 * hit); pglow(bx, by, sc * 3.5, '#FFF0CC', .4 * hit * clamp((depth - 3395) / 10));
      for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (hash(i * 3.7 + n) - .5) * 2.2, v = 5 + 7 * hash(i * 1.3 + n), px = bx + Math.cos(a) * v * since * sc, py = by + Math.sin(a) * v * since * sc + 14 * since * since * sc;
        pline([[px, py], [px + Math.cos(a) * sc * .25, py + Math.sin(a) * sc * .25]], 1.4, '#6A6660', { over: 0, passes: 1, alpha: hit }); }
    }
    if (lt < .3) { X.save(); X.globalAlpha = 1 - ease(lt / .3); X.fillStyle = '#8E7452'; X.fillRect(0, 0, W, H); X.restore(); }
    seamOut(lt, dur);
  }

  shots([[153.79, e1], [160.51, e2], [164.59, e3], [166.55, e4], [167.95, e5], [169.79, e6], [173.93, e7], [175.8, e7b], [177.67, e8], [180.89, e9], [183.05, e10], [186.15, e11]]);
})();
