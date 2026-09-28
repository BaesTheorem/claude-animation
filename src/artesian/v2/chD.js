// Chapter D (v2) · 118.73–153.79 s · Night trouble. Verse 4 (lyric lines 27–31) and chorus 4 (32–35).
// See docs/artesian/STORYBOARD.md, BRIEF.md and RESEARCH.md. (work in progress)
(() => {
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const FY = 2.2;                                   // derrick floor (RIG floorY)
  const BT = n => OFF + n * BEAT;                   // time of beat n; a blow lands on every even beat
  const MOON = [-40, 26, -60];                      // moonlight from behind the derrick, low: the same all chapter
  const SKY_TOP = '#11203A', SKY_LOW = '#2E6A6C', FOGC = '#2B565C', INK = '#1B1917', LAMPC = '#FF9E48', FIREC = '#FF7424';
  const FINGERS = ['index_', 'middle_', 'ring_', 'pinky_', 'thumb_'];
  const flick = (t, k = 0) => 1 + .07 * Math.sin(t * 13.1 + k) + .05 * Math.sin(t * 23.7 + k * 2) + .03 * Math.sin(t * 41 + k);
  const mod = a => ((a % TAU) + TAU) % TAU;

  // ---------- the night sky: teal, hatched, stars on the dome, a thin moon ----------
  const STARS = Array.from({ length: 150 }, (_, i) => {
    const az = hash(i * 3.7 + 1) * TAU, el = Math.asin(.03 + .97 * Math.pow(hash(i * 5.3 + 2), 1.3));
    return { d: [Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)], r: .7 + 2.1 * Math.pow(hash(i * 7.1), 3), ph: hash(i * 9.3) * TAU, f: 1.2 + hash(i * 2.9) * 3 };
  });
  const POLE = (() => { const el = .45, az = 2.6; return [Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)]; })();
  function rotAxis(d, k, a) {
    const c = Math.cos(a), s = Math.sin(a), dot = d[0] * k[0] + d[1] * k[1] + d[2] * k[2];
    const cr = [k[1] * d[2] - k[2] * d[1], k[2] * d[0] - k[0] * d[2], k[0] * d[1] - k[1] * d[0]];
    return [0, 1, 2].map(i => d[i] * c + cr[i] * s + k[i] * dot * (1 - c));
  }
  function skyPt(cam, d) { const c = cam.position; return P3.project(cam, [c.x + d[0] * 4000, c.y + d[1] * 4000, c.z + d[2] * 4000]); }
  function moon(cam) {
    const n = Math.hypot(...MOON), [x, y, z] = skyPt(cam, MOON.map(v => v / n));
    if (z <= 0 || x < -150 || x > W + 150 || y < -150 || y > 880) return;
    const r = 19;
    pglow(x, y, r * 10, '#BFD6E2', .28); pglow(x, y, r * 2.8, '#EAF2F2', .42);
    // a thin crescent: the disc less a disc pushed up and left (its lit limb faces the sun, long set)
    const ox = -.44 * r, oy = -.4 * r, q = r * .97, dd = Math.hypot(ox, oy), phi = Math.atan2(oy, ox);
    const c = Math.acos(clamp((r * r + dd * dd - q * q) / (2 * r * dd), -1, 1)), P = [];
    for (let k = 0; k <= 18; k++) { const a = phi + c + (TAU - 2 * c) * k / 18; P.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); }
    const b1 = Math.atan2(Math.sin(phi + c) * r - oy, Math.cos(phi + c) * r - ox), b2 = Math.atan2(Math.sin(phi - c) * r - oy, Math.cos(phi - c) * r - ox);
    let sp = mod(b1 - b2); if (mod(phi + Math.PI - b2) > sp) sp -= TAU;          // round the side facing away from the offset
    for (let k = 1; k < 18; k++) { const a = b2 + sp * k / 18; P.push([x + ox + Math.cos(a) * q, y + oy + Math.sin(a) * q]); }
    seed('Dmoon'); pfill(P, '#F4F0DE', { tone: .92, dens: .25, ink: '#A9BCC4', sw: .7 });
  }
  function nightSky(cam, t, o = {}) {
    sky(SKY_TOP, SKY_LOW, { tone: .92, split: o.split ?? .72, hatch: .85, still: true });
    seed('DskyX'); pshade(rectPts(-80, -60, W + 160, 1020), AP.tealDk, .36, { kind: 'x', still: true });
    for (let i = 0; i < 30; i++) {                   // loose patches of long strokes, the painting's sky
      const x = hash(i * 3.31) * (W + 200) - 100, y = hash(i * 5.17) * 640, a = HAND + 1.3 + (hash(i * 7.7) - .5) * .25;
      seed('Dsk' + i);
      for (let j = 0; j < 4; j++) { const L = 34 + hash(i * 1.9 + j) * 46; pline([[x + j * 9, y + j * 5], [x + j * 9 + Math.cos(a) * L, y + j * 5 + Math.sin(a) * L]], .8, '#16353C', { passes: 1, over: 0, alpha: .55, j: .5 }); }
    }
    X.save();
    for (let i = 0; i < STARS.length; i++) {         // stars on the dome, so they pan with the camera; o.spin turns the dome (hours pass)
      const s = STARS[i], d = o.spin ? rotAxis(s.d, POLE, o.spin) : s.d;
      if (d[1] < .02) continue;
      const [x, y, z] = skyPt(cam, d); if (z <= 0 || x < -30 || x > W + 30 || y < -30 || y > 900) continue;
      const tw = .55 + .45 * Math.sin(t * s.f + s.ph);
      pglow(x, y, s.r * 7, '#D8E6EE', .12 + .16 * tw);
      X.globalAlpha = .5 + .42 * tw; X.fillStyle = '#F2EEDC'; X.beginPath(); X.arc(x, y, s.r * .8, 0, TAU); X.fill();
    }
    X.restore();
    if (o.moon !== false) moon(cam);
  }

  // ---------- small builders ----------
  // merge meshes into one (far rigs, the chain): one draw call instead of dozens
  function merged(meshes, col, o = {}) {
    const gs = meshes.map(m => { m.updateMatrix(); const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone(); g.applyMatrix4(m.matrix); for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k); return g; });
    return P3.mesh(THREE.BufferGeometryUtils.mergeGeometries(gs), col, o);
  }
  // a neighbouring bore's rig on the horizon: derrick, beam and stack, one mesh
  function farRig(h) {
    const ms = [], b0 = h * .135, b1 = h * .03, B = (a, b, w) => ms.push(P3.beam(a, b, w, w));
    const legs = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) => [[sx * b0, 0, sz * b0], [sx * b1, h, sz * b1]]);
    const at = (L, k) => L[0].map((v, i) => v + (L[1][i] - v) * k), lv = [.14, .34, .54, .72, .88];
    for (const L of legs) B(L[0], L[1], 1.2);
    for (let k = 0; k < lv.length; k++) for (let i = 0; i < 4; i++) { B(at(legs[i], lv[k]), at(legs[(i + 1) % 4], lv[k]), .7); if (k + 1 < lv.length) B(at(legs[i], lv[k]), at(legs[(i + 1) % 4], lv[k + 1]), .45); }
    B([-2.5, h, 0], [2.5, h, 0], 2.2); B([0, 14, 0], [26, 14, 0], 1.7); B([15, 0, 0], [15, 14, 0], 1.5); B([41, 0, 0], [41, 18, 0], 1.7); B([36, 4, 0], [46, 4, 0], 4.5);
    const m = merged(ms, '#3E3A35', { cast: false }); m.receiveShadow = false; return m;
  }
  const FAR = [[-140, -250, 60, .6], [-250, -300, 56, 2.0], [-270, -430, 58, .4], [70, -560, 64, 1.1], [300, -520, 60, 2.6], [460, -300, 60, 2.2], [-560, 140, 62, 2.9], [330, 470, 56, .8], [-360, 540, 60, 1.7]];
  // Pipe tongs for turning casing. PROPS.tongs() is not used: its jaw ring lies across the handle's own axis, so it cannot
  // close round a pipe that crosses the handle (see the report). Local frame: the pipe runs up local y through the origin;
  // the jaw is a C of iron round it, hinged on the handle side; the lever runs out along +x to the grip end.
  function tongsD(len, r = .33) {
    const G = new THREE.Group(), IR = '#3C3936';
    const jg = new THREE.TorusGeometry(r + .08, .075, 6, 22, 1.3 * Math.PI); jg.rotateZ(.35 * Math.PI); jg.rotateX(Math.PI / 2);
    G.add(P3.mesh(jg, IR));
    const kn = P3.mesh(P3.box(.22, .2, (r + .08) * 1.9), IR); kn.position.set((r + .08) * .5 + .08, 0, 0); G.add(kn);    // the knuckle across the gap
    const pin = P3.mesh(P3.cyl(.06, .06, .34, 8), '#5A5652'); pin.position.set((r + .08) * .5 + .08, 0, (r + .08) * .85); G.add(pin);
    G.add(P3.beam([r + .2, 0, 0], [r + len, 0, 0], .19, .12, IR));                                                    // the lever, a flat bar on edge
    const grip = P3.mesh(P3.cyl(.085, .085, 1.2, 8).rotateZ(Math.PI / 2), '#2E2C2A'); grip.position.set(r + len - .6, 0, 0); G.add(grip);
    G.rotation.order = 'YXZ'; G.userData = { len, r };
    return G;
  }
  function placeTong(tg, y, yaw, tilt = 0) { tg.position.set(0, y, 0); tg.rotation.set(0, yaw, tilt); tg.updateMatrixWorld(true); }
  const tongPt = (tg, d) => tg.localToWorld(V3(tg.userData.r + d, 0, 0)).toArray();
  // stretch a unit cylinder (height 1 along y) from a to b
  const _up = V3(0, 1, 0);
  function span(m, a, b) { const A = V3(...a), B = V3(...b), d = B.clone().sub(A), L = d.length(); m.position.copy(A).add(B).multiplyScalar(.5); m.quaternion.setFromUnitVectors(_up, d.normalize()); m.scale.set(1, Math.max(.001, L), 1); }
  // a chain lying on the planks along a path of [x, z] points: oval links, alternately flat and on edge
  function chainOn(pts, y) {
    const ms = [];
    for (let i = 0, n = 0; i < pts.length - 1; i++) {
      const [x0, z0] = pts[i], [x1, z1] = pts[i + 1], L = Math.hypot(x1 - x0, z1 - z0), a = Math.atan2(x1 - x0, z1 - z0);
      for (let s = 0; s < L; s += .2, n++) {
        const k = s / L, m = P3.mesh(new THREE.TorusGeometry(.085, .026, 4, 10), '#4A4642');
        m.scale.set(1, 1.55, 1); m.rotation.order = 'YXZ';
        if (n % 2) { m.rotation.set(0, a - Math.PI / 2, Math.PI / 2); m.position.set(lerp(x0, x1, k), y + .09, lerp(z0, z1, k)); }  // on edge
        else { m.rotation.set(-Math.PI / 2, a, 0); m.position.set(lerp(x0, x1, k), y + .03, lerp(z0, z1, k)); }                 // flat
        ms.push(m);
      }
    }
    return merged(ms, '#4A4642');
  }

  // P3.cached, made safe. The shared cache disposes the least recently used set with dispose(o.scene || o); a set returned as
  // { o, ... } has no .scene, so evicting it throws (every chapter returns that shape; see the report). This chapter's sets
  // carry .scene so they dispose cleanly, and if evicting someone else's set throws, the set just built is still returned.
  const STASH = {};
  function cachedD(key, build) {
    try { return P3.cached(key, () => (STASH[key] = build())); }
    catch (e) { if (STASH[key]) return STASH[key]; throw e; }
  }

  // ---------- the bore site at night ----------
  const SHIRTS = { dresser: '#D3C8AE', boss: '#DCD1BA', lab: '#A98050' };
  const SITE = () => cachedD('D-site', () => {
    const o = P3.scene({ sunDir: MOON, sun: .6, fill: .26, shadowSize: 60 });
    o.sun.color.set('#A8BDD4'); o.fill.color.set('#A9B0B8'); o.fill.groundColor.set('#3A3630');
    const st = WORLD.site({ col: '#564C40', board: 2150, trees: 55, dead: .65 }); o.scene.add(st.group);
    const R = st.rig, U = R.userData;
    // shared-layout workaround: WORLD.site nails the depth board through the front-left leg (the leg's corner splits the
    // chalked number); stand it off along its own normal so it sits on the leg's face
    st.board.position.set(-7.43, 7.4, 8.51);
    // shared-layout workaround: the woodpile sits against the firebox door; stack it behind where the fireman stands
    for (const m of R.children) if (m.isMesh && m.position.x > 39.5 && m.position.x < 47.5 && m.position.z > 8.5 && m.position.z < 12 && m.position.y < 4.2) m.position.z += 4.6;
    for (const [x, z, h, yaw] of FAR) { const f = farRig(h); f.position.set(x, 0, z); f.rotation.y = yaw; o.scene.add(f); }
    // the lowest girt and brace on the camp (+z) face: hidden in the close floor shots, as if that side were the open one
    const doorway = R.children.filter(m => m.isMesh && Math.abs(m.position.x) < .6 && ((Math.abs(m.position.y - 6.2) < .3 && Math.abs(m.position.z - 7.83) < .3) || (Math.abs(m.position.y - 11.15) < .4 && Math.abs(m.position.z - 7.3) < .4)));
    // the casing string being worked down: tube, swelled couplings, clamp, links, hook, the running block (moves as one)
    const casG = new THREE.Group(); o.scene.add(casG);
    const tube = P3.mesh(P3.cyl(.33, .33, 8.9, 18), '#5E5A55'); tube.position.y = 8.05; casG.add(tube);
    for (const y of [4.75, 11.25]) { const cp = P3.mesh(P3.cyl(.42, .42, .55, 18), '#55514C'); cp.position.y = y; casG.add(cp); }
    const chalk = P3.mesh(P3.box(.05, .5, .05), '#F0EADA', { cast: false }); chalk.position.set(-.08, 6.6, .32); casG.add(chalk);   // a chalk mark: does it turn?
    const clamp = new THREE.Group(); clamp.position.y = 10.7; casG.add(clamp);
    clamp.add(P3.mesh(P3.cyl(.5, .5, .42, 18), '#34312E'));
    for (const s of [-1, 1]) { const ear = P3.mesh(P3.box(.8, .3, .3), '#34312E'); ear.position.set(s * .85, 0, 0); clamp.add(ear); }
    const hookY = 13.5;
    for (const s of [-1, 1]) casG.add(P3.beam([s * 1.1, 10.8, 0], [s * .16, hookY - .25, 0], .1, .1, '#4A4744'));
    const hook = P3.mesh(new THREE.TorusGeometry(.26, .07, 6, 14, Math.PI * 1.5), '#4A4744'); hook.position.set(0, hookY, 0); hook.rotation.z = -Math.PI * .25; casG.add(hook);
    const blk = new THREE.Group(); blk.position.y = hookY + 1.35; casG.add(blk);
    blk.add(P3.mesh(P3.box(.95, 1.6, .5), '#6A5A48'));
    for (const s of [-1, 1]) { const pl = P3.mesh(P3.box(1.05, 1.75, .06), '#3E3B38'); pl.position.z = s * .28; blk.add(pl); }
    const shank = P3.mesh(P3.cyl(.08, .08, .6, 8), '#4A4744'); shank.position.y = -1.05; blk.add(shank);
    const ropeM = () => { const r = P3.mesh(P3.cyl(.13, .13, 1, 6), '#D2BC8C', { cast: false }); o.scene.add(r); return r; };
    const ropes = [-.28, 0, .28].map(ropeM), fast = Array.from({ length: 14 }, ropeM);
    const tA = tongsD(5.2), tB = tongsD(6.3); o.scene.add(tA); o.scene.add(tB);
    // lanterns (hurricane lamps) and the engine-room lamp with its reflector
    const lan = { F: PROPS.lantern(), L: PROPS.lantern(), B: PROPS.lantern(), E: PROPS.lantern() };
    for (const l of Object.values(lan)) o.scene.add(l);
    const refl = P3.mesh(new THREE.SphereGeometry(.62, 16, 6, 0, TAU, 0, Math.PI * .36).rotateX(-Math.PI / 2), '#B39A5C', { side: THREE.DoubleSide, cast: false }); lan.E.add(refl); refl.position.set(0, -.55, 0);
    const L = { F: P3.lamp(o, [0, 5, 0], LAMPC, 240, 45, true), L: P3.lamp(o, [0, 5, 0], LAMPC, 300, 60, false), E: P3.lamp(o, [0, 5, 0], '#FFB060', 220, 40, false),
      fire: P3.lamp(o, U.firebox, FIREC, 220, 40, false), forge: P3.lamp(o, U.forge, FIREC, 320, 50, false) };
    // the engine: a throttle lever that moves (the rig's is a fixed bar), a gauge with a face, a lever safety valve, fire in the door
    const thr0 = U.eng.children.find(m => m.geometry && m.geometry.parameters && m.geometry.parameters.height === 1.8 && m.geometry.parameters.width === .2); if (thr0) thr0.visible = false;
    const thr = new THREE.Group(); thr.position.set(47.5, 4.4, 9.64); o.scene.add(thr);
    thr.add(P3.mesh(P3.box(.12, 1.6, .12).translate(0, .8, 0), '#8A857C'));
    const knob = P3.mesh(P3.cyl(.09, .09, .45, 8).rotateZ(Math.PI / 2), '#2E2A26'); knob.position.y = 1.6; thr.add(knob);
    const quad = P3.mesh(new THREE.TorusGeometry(1.25, .05, 5, 20, 1.1), '#5A5652', { cast: false }); quad.rotation.set(0, Math.PI / 2, .05); quad.position.set(47.62, 4.4, 9.64); o.scene.add(quad);   // the notched quadrant
    const rail = P3.beam([44.3, 5.6, 9.62], [45.7, 5.6, 9.62], .09, .09, '#6A665E'); o.scene.add(rail);                                                    // a grab rail on the firebox
    const dial = (() => {
      const cv = document.createElement('canvas'); cv.width = cv.height = 256; const c = cv.getContext('2d');
      c.fillStyle = '#A8843A'; c.fillRect(0, 0, 256, 256); c.fillStyle = '#EFE6CE'; c.beginPath(); c.arc(128, 128, 112, 0, TAU); c.fill();
      c.strokeStyle = '#B23A26'; c.lineWidth = 18; c.beginPath(); c.arc(128, 128, 84, 1.82 * Math.PI, 2.25 * Math.PI); c.stroke();
      c.strokeStyle = '#2A2622'; for (let i = 0; i <= 20; i++) { const a = .75 * Math.PI + i * 1.5 * Math.PI / 20, Lk = i % 5 ? 12 : 24; c.lineWidth = i % 5 ? 2.5 : 5; c.beginPath(); c.moveTo(128 + Math.cos(a) * 102, 128 + Math.sin(a) * 102); c.lineTo(128 + Math.cos(a) * (102 - Lk), 128 + Math.sin(a) * (102 - Lk)); c.stroke(); }
      c.fillStyle = '#2A2622'; c.beginPath(); c.arc(128, 128, 12, 0, TAU); c.fill();
      const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
      const m = P3.mesh(new THREE.CircleGeometry(.52, 32), '#ffffff', { cast: false }); m.material.map = tex; m.material.emissive = new THREE.Color('#9A8C78'); m.material.emissiveMap = tex; m.material.needsUpdate = true; return m;
    })();
    dial.position.set(44.8, 6.8, 9.76); o.scene.add(dial);
    const bez = P3.mesh(new THREE.TorusGeometry(.54, .05, 6, 28), '#8C6A2A', { cast: false }); bez.position.copy(dial.position); o.scene.add(bez);
    const needle = P3.mesh(P3.box(.035, .44, .02).translate(0, .17, 0), '#1E1A18', { cast: false }); needle.position.set(44.8, 6.8, 9.79); o.scene.add(needle);
    const valve = new THREE.Group(); valve.position.set(45.3, 7.8, 8.3); o.scene.add(valve);
    const vcol = P3.mesh(P3.cyl(.14, .16, .7, 10), '#B8963E'); vcol.position.y = .35; valve.add(vcol);
    const vhead = P3.mesh(P3.cyl(.22, .2, .16, 10), '#B8963E'); vhead.position.y = .78; valve.add(vhead);
    const varm = new THREE.Group(); varm.position.set(0, .9, 0); valve.add(varm);
    varm.add(P3.mesh(P3.box(2.1, .09, .09).translate(-1.0, 0, 0), '#4A4744'));
    const wt = P3.mesh(new THREE.SphereGeometry(.2, 10, 8), '#34312E'); wt.position.set(-1.95, -.05, 0); varm.add(wt);
    const fire = P3.mesh(P3.box(1.5, 1.25, .04), '#B8481E', { style: .6, cast: false }); fire.position.set(46, 3.8, 9.7); o.scene.add(fire);
    // the floor's clutter in the painting: a bucket and a chain on the planks
    const bucket = PROPS.bucket(); bucket.position.set(...L3([-3.9, FY, 2.4])); bucket.rotation.z = .06; o.scene.add(bucket);
    const chain = chainOn([[-2.0, 2.6], [-1.5, 2.2], [-.9, 2.3], [-.5, 1.8], [-.8, 1.3], [-1.4, 1.2], [-1.7, 1.6], [-1.3, 2.0], [-.6, 2.4], [.1, 2.2], [.5, 1.5]].map(W2), FY);
    o.scene.add(chain);
    const sledge = PROPS.sledge(); o.scene.add(sledge); const bitI = PROPS.bitIron(); o.scene.add(bitI);
    const chalkS = P3.mesh(P3.box(.05, .3, .05).translate(0, .15, 0), '#F2EEE2', { cast: false }); o.scene.add(chalkS);
    const logB = PROPS.book(); o.scene.add(logB);
    const P = {}; for (const n of ['driller', 'dresser', 'lab', 'bill', 'boss', 'hand']) { P[n] = PEOPLE.make(n, SHIRTS[n] ? { shirt: SHIRTS[n] } : {}); o.scene.add(P[n].root); }
    return { o, scene: o.scene, st, R, U, doorway, sledge, bitI, chalkS, logB, casG, blk, ropes, fast, tA, tB, lan, L, thr, needle, valve, varm, vhead, fire, bucket, chain, chalk, P, board: st.board, cam: P3.cam(46), hookY };
  });
  // Per frame: what the plant is doing. 'drill' = beam working, rods in the hole; 'casing' = beam off, tools out, the
  // casing string hanging in the tackle. Everything that moves or shows is set here, every frame.
  function rigMode(S, mode, t, o = {}) {
    const U = S.U, drill = mode === 'drill';
    S.R.position.set(0, 0, 0); S.R.updateMatrixWorld(true);
    S.o.sun.intensity = o.moon ?? .6; S.o.fill.intensity = o.sky ?? .26;          // moonlight and sky fill (a shot may dim them)
    const st = drill ? RIG.strokeAt(t) : 0;
    S.turn = o.turn ?? (-.6 + .06 * Math.sin(Math.PI * clamp(st / .75)));     // the driller eases the tiller round as each stroke rises
    RIG.pose(S.R, { stroke: st, amp: drill ? (o.amp ?? 1) : 0, fly: o.fly ?? t * 6.5, turn: S.turn, bull: o.bull ?? 0 });
    // the tiller is a clamp on the rod: it rides the stroke with the string, at the driller's chest (see the report)
    U.tiller.position.y = U.jointM.position.y - 3.3; U.tillerAt = U.tiller.position.toArray();
    U.temper.visible = U.rods.visible = U.tiller.visible = drill;
    S.casG.visible = !drill; for (const r of S.ropes) r.visible = !drill; for (const r of S.fast) r.visible = !drill;
    S.tA.visible = S.tB.visible = !drill && o.tongs !== false;
    S.thr.rotation.set(o.throttle ?? .15, 0, 0);
    S.needle.rotation.z = -(.75 * Math.PI + (o.gauge ?? .45) * 1.5 * Math.PI) - Math.PI / 2;
    S.varm.rotation.z = o.valve ?? 0; S.vhead.position.y = .78 + (o.valve ?? 0) * .6;
    S.fire.visible = o.fire !== false;
    S.sledge.visible = S.bitI.visible = !!o.forge; S.chalkS.visible = S.logB.visible = false;
    S.board.userData.set(2150); S.board.visible = o.board !== false;   // the board as it stands tonight (D8 re-chalks it after this)
    for (const m of S.doorway) m.visible = !o.open;
    return st;
  }
  // the tackle: running block on the casing, three parts up to the crown, the fast line down to the draw drum
  function tackle(S, lift = 0, slack = 1, hum = 0) {
    S.casG.position.y = lift;
    const top = S.U.H + .3, by = S.hookY + 1.35 + .8 + lift, T0 = BOILN * .37;
    S.ropes.forEach((r, i) => { const w = hum * .09 * Math.sin(T0 * 7.1 + i * 2.1); span(r, [(i - 1) * .28 + w, by, w * .5], [(i - 1) * .5 - w * .3, top, 0]); });
    const a = [.9, top, 0], b = [6, 5.6, -12.9], n = S.fast.length;
    const p = k => { const s = Math.sin(k * Math.PI) * slack * 3.2; return [lerp(a[0], b[0], k) + s * .5, lerp(a[1], b[1], k) - s * .3, lerp(a[2], b[2], k) + s * .7]; };
    for (let i = 0; i < n; i++) span(S.fast[i], p(i / n), p((i + 1) / n));
  }
  // the chapter's night pencil: heavier burnish than the day chapters so the ground goes dark and lantern light pools on it
  const TONE = 1.1;
  function drawNight(S, cam, o = {}) { P3.draw(S.o, cam, { fog: [160, 1100], fogCol: FOGC, ink: INK, lightTint: .85, lineW: 1.6, tone: TONE, ...o }); }
  function show(S, names) { for (const [k, p] of Object.entries(S.P)) p.root.visible = names.includes(k); }
  function lamps(S, o) {                              // place lanterns and their lights; unused lights go dark (no recompile)
    const hang = (l, p) => { if (!p) { l.visible = false; return null; } l.visible = true; PROPS.at(l, p); return PROPS.glassAt(l); };
    const gF = hang(S.lan.F, o.F), gL = hang(S.lan.L, o.L), gB = hang(S.lan.B, o.B), gE = hang(S.lan.E, o.E), t = o.t || 0;
    S.L.F.position.set(...(gF || gB || [0, -50, 0])); S.L.F.intensity = (gF || gB) ? (o.kF ?? 240) * flick(t) : 0;
    S.L.L.position.set(...(gL || [0, -50, 0])); S.L.L.intensity = gL ? (o.kL ?? 300) * flick(t, 1.3) : 0;
    S.L.E.position.set(...(gE || [0, -50, 0])); S.L.E.intensity = gE ? (o.kE ?? 220) * flick(t + 3, 2) : 0;
    S.L.fire.intensity = (o.kFire ?? 220) * flick(t * 1.3, 5); S.L.forge.intensity = (o.kForge ?? 320) * flick(t * .9, 7);
    return { F: gF, L: gL, B: gB, E: gE };
  }
  // 2D light after the 3D: warm halos on the lantern glass, the far rigs' lamps
  function glows(S, cam, g, t) {
    for (const [k, p] of Object.entries(g)) {
      if (!p) continue;
      const [x, y, d] = P3.project(cam, p); if (d <= 0) continue;
      const s = clamp(14 / d, .15, 3), fl = flick(t, k.charCodeAt(0));
      pglow(x, y, 420 * s * fl, AP.rust, .32); pglow(x, y, 170 * s * fl, LAMPC, .6); pglow(x, y, 40 * s, '#FFE6B0', .8);
    }
    for (const [x0, z0] of FAR) {
      const [x, y, d] = P3.project(cam, [x0 + 3, 7, z0 + 3]); if (d <= 0 || x < -50 || x > W + 50) continue;
      pglow(x, y, 16 + 6 * Math.sin(t * 5 + x0), LAMPC, .55);
    }
  }
  // Heaving on a tong: the body behind the bar, driving it toward `push` ([x, z] unit), both hands on the lever (IK),
  // effort rising and easing in a slow cycle of its own (nobody heaves in unison), a tremor at the peak.
  function effort(t, per, ph) { const c = frac(t / per + ph); return .4 + .6 * (c < .38 ? ease(c / .38) : c < .62 ? 1 : 1 - ease((c - .62) / .38)); }
  const smoothTr = e => clamp((e - .7) / .3);
  const wp = b => { const v = new THREE.Vector3(); b.getWorldPosition(v); return v; };
  const armLen = (p, s) => wp(p.bones['upperarm_' + s]).distanceTo(wp(p.bones['lowerarm_' + s])) + wp(p.bones['lowerarm_' + s]).distanceTo(wp(p.bones['hand_' + s]));
  // turn a bone (world space) so its child's direction points along dir
  function aimTo(p, bn, child, dir) {
    const h = p.bones[bn], from = wp(p.bones[child]).sub(wp(h)).normalize(), to = V3(...dir).normalize();
    const qd = new THREE.Quaternion().setFromUnitVectors(from, to), hw = new THREE.Quaternion(), pw = new THREE.Quaternion();
    h.getWorldQuaternion(hw); h.parent.getWorldQuaternion(pw);
    h.quaternion.copy(pw.invert().multiply(qd.multiply(hw))); p.root.updateMatrixWorld(true);
  }
  // a fist closed on a bar: the wrist a hand's length short of the bar along the reach, then a straight wrist rolling the
  // knuckles over the top (wrap: how far the hand turns down round the bar)
  function grip(p, s, bar, pole, wrap = .45) {
    const sh = wp(p.bones['upperarm_' + s]), B = V3(...bar), f = B.clone().sub(sh).normalize();
    const L = wp(p.bones['middle_02_' + s]).distanceTo(wp(p.bones['hand_' + s]));
    PEOPLE.reach(p, s, B.clone().sub(f.clone().multiplyScalar(L * .92)).add(V3(0, .05, 0)).toArray(), pole);
    const fa = wp(p.bones['hand_' + s]).sub(wp(p.bones['lowerarm_' + s])).normalize();
    aimTo(p, 'hand_' + s, 'middle_01_' + s, fa.add(V3(0, -wrap, 0)).normalize().toArray());
  }
  function heave(p, tg, dIn, dOut, push, e, t, o = {}) {
    const yaw = Math.atan2(push[0], push[1]), hi = tongPt(tg, dIn), ho = tongPt(tg, dOut), mid = hi.map((v, i) => (v + ho[i]) / 2);
    PEOPLE.at(p, [mid[0] - push[0] * 2.3, FY, mid[2] - push[1] * 2.3], yaw);
    PEOPLE.clip(p, 'Push_Loop', o.frame ?? .2);
    PEOPLE.clip(p, 'Idle_Loop', 0, { keep: true, only: FINGERS });
    const f = Math.floor(t * 24), tr = k => (hash(f * 1.37 + k * 5.1 + (o.seed || 0)) - .5) * .028 * smoothTr(e);
    PEOPLE.turn(p, 'spine_01', [(o.lean ?? 0) + .07 * e + tr(1), tr(2), 0]);
    PEOPLE.turn(p, 'spine_03', [.04 * e + tr(3), tr(4) + (o.twist || 0), tr(5)]);
    PEOPLE.turn(p, 'Head', [(o.head ?? 0) + (o.hk ?? .22) * e + tr(6), o.look || 0, 0]);
    // slide the whole body so the shoulders sit a set fraction of the arm's length behind the bar: the hands always land
    const S = wp(p.bones.upperarm_l).add(wp(p.bones.upperarm_r)).multiplyScalar(.5), aL = armLen(p, 'l');
    const dy = S.y - mid[1], rh = Math.sqrt(Math.max(.05, Math.pow((o.reach ?? .84) * aL, 2) - dy * dy));
    p.root.position.x += mid[0] - push[0] * rh - S.x; p.root.position.z += mid[2] - push[1] * rh - S.z; p.root.updateMatrixWorld(true);
    // which hand takes the outer end: the one on the lever's outboard side
    const left = [Math.cos(yaw), 0, -Math.sin(yaw)], dir = ho.map((v, i) => v - hi[i]), lOut = left[0] * dir[0] + left[2] * dir[2] > 0;
    const pole = (s, sd) => { const v = wp(p.bones['upperarm_' + s]); return [v.x + left[0] * sd * 1.3 - push[0] * .6, v.y - 1.2, v.z + left[2] * sd * 1.3 - push[1] * .6]; };
    const gl = lOut ? ho : hi, gr = lOut ? hi : ho;
    grip(p, 'l', gl, pole('l', 1), o.wrap); grip(p, 'r', gr, pole('r', -1), o.wrap);
  }

  // ---------- D4 · 129.57 · [29] "tubes are always jamming": the reference painting ----------
  // Laid out in a local frame (camera looking down local -z at the casing) turned PSI off the derrick's axes, so the
  // corner legs clear the frame and the back legs rise behind the crew.
  const PSI = .35, W2 = ([x, z]) => [x * Math.cos(PSI) + z * Math.sin(PSI), -x * Math.sin(PSI) + z * Math.cos(PSI)];
  const L3 = ([x, y, z]) => { const [a, b] = W2([x, z]); return [a, y, b]; };
  const yawOf = d => Math.atan2(-d[1], d[0]);
  const TA_DIR = W2([-.45, -.89]), TB_DIR = W2([.45, .89]);      // one lever toward the camera, one away, in line through the pipe
  const PUSH_A = W2([.89, -.45]), PUSH_B = W2([-.89, .45]);       // a couple: both turn the string clockwise from above
  // each of the three heaves on a slow cycle of their own (2.5, 2.15, 2.8 s); phases chosen so all three are driving hard
  // at the cut into the close shot (133.25)
  const EFF = { lab: t => effort(t, 2.5, .15), driller: t => effort(t, 2.15, .323), dresser: t => effort(t, 2.8, .811) };
  function tongCrew(S, t, slip = 0) {
    placeTong(S.tA, FY + 3.05, yawOf(TA_DIR), .03); placeTong(S.tB, FY + 3.25, yawOf(TB_DIR) - slip, -.03);
    heave(S.P.lab, S.tA, 3.9, 4.65, PUSH_A, EFF.lab(t), t, { frame: 1.55, seed: 1, head: -.05 });
    heave(S.P.driller, S.tB, 2.9, 3.6, PUSH_B, EFF.driller(t), t, { frame: .2, seed: 2, head: -.35, hk: .08, look: -.35 });
    heave(S.P.dresser, S.tB, 5.15, 6.0, PUSH_B, EFF.dresser(t), t, { frame: 1.3, seed: 3, head: -.1, look: -.15 });
  }
  function d4Painting(t, lt, dur) {
    const S = SITE(), cam = S.cam;
    rigMode(S, 'casing', t, { open: true }); tackle(S, 0, 1);
    show(S, ['lab', 'driller', 'dresser']); tongCrew(S, t);
    const g = lamps(S, { t, F: L3([-1.1, FY + .98, 2.6]), L: [-7.3, 8.6, -7.6], kF: 210, kL: 220, kFire: 0, kForge: 150 });
    const k = ease(lt / dur);
    cam.fov = 40; cam.updateProjectionMatrix();
    P3.look(cam, L3([lerp(1.2, 1.0, k), lerp(4.35, 4.45, k), lerp(13.8, 12.8, k)]), L3([lerp(.9, .8, k), lerp(5.0, 5.1, k), 0]));
    nightSky(cam, t);
    drawNight(S, cam);
    glows(S, cam, g, t);
    if (lt < .27) pageTurn(.5 + lt / .54, 1);
  }

  // ---------- the engine's speed: steady, then opened wide for the lift, then eased back (flywheel angle, closed form) ----------
  const FLYK = [[0, 6.5], [135.45, 6.5], [136.3, 17], [138.4, 17], [139.5, 6.5], [400, 6.5]];
  function flyAngle(t) {
    let a = 0;
    for (let i = 1; i < FLYK.length; i++) { const [t0, w0] = FLYK[i - 1], [t1, w1] = FLYK[i]; if (t <= t0) break; const u = Math.min(t, t1) - t0; a += w0 * u + .5 * (w1 - w0) / (t1 - t0) * u * u; }
    return a;
  }
  // the driller at the temper screw: both hands on the tiller like a boat's (it points at her), easing the string round as
  // each stroke rises; head down over the hole, feeling the blows come up through the pole
  function drillerAt(S, t, o = {}) {
    const p = S.P.driller, U = S.U, ty = U.tillerAt[1] - .06, tn = S.turn, at = r => [Math.cos(tn) * r, ty, -Math.sin(tn) * r];
    PEOPLE.at(p, [2.35, FY, 1.65], -Math.PI / 2 - .6);
    PEOPLE.clip(p, 'Idle_Loop', t * .8 + 1.1);
    PEOPLE.turn(p, 'spine_02', [o.lean ?? .1, o.twist ?? 0, 0]);
    PEOPLE.turn(p, 'Head', [o.head ?? .22, o.look ?? 0, o.tilt ?? 0]);
    grip(p, 'r', at(1.5), [3.4, ty - 1.2, 3.1], .5);
    grip(p, 'l', at(1.02), [2.6, ty - 1.1, .2], .5);
  }

  // ---------- transitions ----------
  function hatchIris(cx, cy, r) {                    // everything outside a circle hatched dark; the circle closes to a point
    if (r > 2300) return;
    X.save(); X.beginPath(); X.rect(-60, -60, W + 120, H + 120); X.arc(cx, cy, Math.max(r, .5), 0, TAU, true); X.clip();
    X.globalAlpha = .9; X.fillStyle = '#1D1B19'; X.fillRect(-60, -60, W + 120, H + 120); X.globalAlpha = 1;
    seed('Diris'); pshade(rectPts(-60, -60, W + 120, H + 120), AP.graphite, 1.7, { kind: 'x' });
    X.restore();
    if (r > 2) { seed('DirisL'); pline(ellPts(cx, cy, r, r, 56, 2), 2.4, AP.graphite, { closed: true }); }
  }
  function whip(k, dir = 1) {                         // a whip pan's smear: the frame dragged sideways, and speed strokes
    if (k <= .01) return;
    X.save(); X.setTransform(1, 0, 0, 1, 0, 0);
    for (let i = 1; i <= 7; i++) { X.globalAlpha = .2 * k; X.drawImage(X.canvas, -dir * i * 46 * k, 0); }
    X.restore();
    seed('Dwhip');
    for (let i = 0; i < 26; i++) { const y = hash(i * 3.3) * 880, x = hash(i * 7.1) * W, L = (180 + hash(i) * 420) * k; pline([[x, y], [x + dir * L, y + (hash(i * 2) - .5) * 6]], .9 + hash(i * 5) * 1.6, AP.graphite, { alpha: .5 * k, over: 0, passes: 1 }); }
  }
  function whipV(k, dir = 1) {                        // a whip tilt: the frame smeared up or down (dir +1 = image moving down)
    if (k <= .01) return;
    X.save(); X.setTransform(1, 0, 0, 1, 0, 0);
    for (let i = 1; i <= 7; i++) { X.globalAlpha = .2 * k; X.drawImage(X.canvas, 0, dir * i * 40 * k); }
    X.restore();
    seed('DwhipV');
    for (let i = 0; i < 30; i++) { const x = hash(i * 3.3) * W, y = hash(i * 7.1) * 880, L = (160 + hash(i) * 380) * k; pline([[x, y], [x + (hash(i * 2) - .5) * 6, y + dir * L]], .9 + hash(i * 5) * 1.6, AP.graphite, { alpha: .5 * k, over: 0, passes: 1 }); }
  }
  function steamCover(p, cx, cy) {                    // safety-valve steam blooming over the frame (p .5 = covered)
    if (p <= 0 || p >= 1) return;
    const c = p < .5 ? easeOut(p * 2) : 1 - ease((p - .5) * 2);
    for (let i = 0; i < 26; i++) {
      const a = hash(i * 2.7) * TAU, d = hash(i * 4.1) * 900 * c, r = (120 + hash(i * 6.3) * 260) * (.35 + c);
      psmoke(cx + Math.cos(a) * d, cy + Math.sin(a) * d * .7 - 120 * c, r, i % 3 ? '#E8ECEC' : '#D6DCDC', .75 * c);
    }
    X.save(); X.globalAlpha = clamp(c * 1.25 - .2); X.fillStyle = '#E6EAEA'; X.fillRect(-10, -10, W + 20, H + 20); X.restore();
    seed('Dsteam'); pshade(rectPts(-40, -40, W + 80, H + 80), '#B8C4C6', .5 * c, { kind: 'v' });
  }
  function puff(x, y, r, col, a) { if (a > .02 && r > 2) psmoke(x, y, r, col, a); }
  // the fire seen through the open firebox door (a quad on the door face): dull red at the edges, white-orange core, licks
  function fireMouth(cam, t, k = 1) {
    const Q = [[45.25, 3.2, 9.73], [46.75, 3.2, 9.73], [46.75, 4.4, 9.73], [45.25, 4.4, 9.73]].map(p => P3.project(cam, p));
    if (Q.some(q => q[2] <= 0)) return;
    const P = Q.map(q => q.slice(0, 2)), cx = (P[0][0] + P[2][0]) / 2, cy = (P[0][1] + P[2][1]) / 2, w = Math.hypot(P[1][0] - P[0][0], P[1][1] - P[0][1]);
    X.save(); tracePath(P); X.clip();
    X.fillStyle = '#6E1E10'; X.globalAlpha = .95; X.fillRect(cx - w * 2, cy - w * 2, w * 4, w * 4); X.globalAlpha = 1;
    const fl = flick(t * 1.4, 4) * k;
    pglow(cx, cy + w * .15, w * .9 * fl, '#FF8A2A', 1); pglow(cx, cy + w * .2, w * .45 * fl, '#FFD27A', 1);
    seed('Dflame');
    for (let i = 0; i < 7; i++) {
      const x0 = cx + (i / 6 - .5) * w * .8, h = w * (.22 + .28 * hash(i * 2.3)) * (1 + .35 * Math.sin(t * (9 + i) + i * 2)) * k, sw = Math.sin(t * 7 + i) * w * .06, b = cy + w * .38;
      pfill([[x0 - w * .08, b], [x0 - w * .06 + sw * .3, b - h * .45], [x0 + sw, b - h], [x0 + w * .05 + sw * .4, b - h * .5], [x0 + w * .08, b]], i % 2 ? '#F7A548' : '#E86A2A', { tone: .6, dens: .5, ink: null, curv: true });
    }
    X.restore();
  }

  // ---------- the section, with the caving bed (D1) and the chorus dive (D9) ----------
  const SAND = '#DCCBA0', MUD = '#8E8A7E';
  function shapeMesh(pts, col, z) {
    const sh = new THREE.Shape(); sh.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) sh.lineTo(pts[i][0], pts[i][1]); sh.closePath();
    const m = P3.mesh(new THREE.ShapeGeometry(sh), col, { cast: false }); m.position.z = z; return m;
  }
  function buildSec() {
    const o = P3.scene({ sunDir: [-45, 40, 80], sun: 3.4, fill: .95, shadowSize: 70 });
    o.sun.color.set('#E2E8EE'); o.fill.color.set('#D2D6DA'); o.fill.groundColor.set('#7A726A');
    o.sun.position.set(-45, -195, 80); o.sun.target.position.set(0, -235, 0);
    const S = WORLD.section({ bottom: 3200 }); o.scene.add(S);
    const U = S.userData, y = U.y;
    U.bit.material.color.set('#9A968C'); U.bit.material.userData.albedo.set('#9A968C');     // steel that reads against the dark bore
    // a bed of loose sand drift in the mudstone, 2105–2175 ft: the ground that caves
    const lens = new THREE.Group(); S.add(lens);
    const bed = P3.mesh(P3.box(160, 7, .5), SAND); bed.position.set(0, y(2140), -.05); lens.add(bed);
    for (let i = 0; i < 3; i++) for (let k = 0; k < 3; k++) { const l = P3.mesh(P3.box(160 / 3 + 2, .16, .3), mixCol(SAND, AP.graphite, .3), { cast: false }); l.position.set(-160 / 3 + k * 160 / 3, y(2112 + i * 22) + (hash(i * 3 + k) - .5) * 1.1, .28); lens.add(l); }
    for (let i = 0; i < 30; i++) { const st = P3.mesh(new THREE.IcosahedronGeometry(.18 + hash(i * 1.7) * .3, 0), mixCol(SAND, AP.graphite, .35)); st.position.set((hash(i * 5.1) - .5) * 150, y(2108) - hash(i * 3.9) * 6.4, .3); st.scale.z = .5; if (Math.abs(st.position.x) < 6) st.position.x += 8; lens.add(st); }
    // the caved hollow round the hole, and the heap of slumped sand round the bit
    // a ragged hollow: narrow at the casing shoe, bellied out through the loose bed, the heap at its foot
    const HOLLOW = [];
    for (let i = 0; i <= 40; i++) {
      const q = i / 40, a = Math.PI / 2 + q * TAU, ft = lerp(2104, 2154, (1 - Math.sin(a)) / 2);
      const belly = Math.sin(Math.PI * clamp((ft - 2100) / 56)), w = 1.3 + 4.1 * Math.pow(belly, .8) * (ft > 2146 ? lerp(1, .6, (ft - 2146) / 8) : 1);
      HOLLOW.push([Math.cos(a) * w * (1 + (hash(i * 3.7) - .5) * .22), y(ft) + (hash(i * 5.9) - .5) * .5]);
    }
    // the hollow and the heap of slumped sand in its bottom grow together (one group, scaled per frame about the shoe)
    const cave = new THREE.Group(); cave.position.y = y(2104); S.add(cave);
    const hollow = shapeMesh(HOLLOW.map(([x, yy]) => [x, yy - y(2104)]), '#1C1815', .95); cave.add(hollow);
    const lvl = y(2139), bottom = HOLLOW.filter(([, yy]) => yy < lvl).map(([x, yy]) => [x, yy - y(2104)]);
    const xs = bottom.map(p => p[0]), xl = Math.min(...xs), xr = Math.max(...xs), HP = [];
    for (let i = 0; i <= 12; i++) { const q = i / 12, x = lerp(xl, xr, q); HP.push([x, lvl - y(2104) + 1.6 * Math.sin(Math.PI * q) + (hash(i * 7.3) - .5) * .25]); }
    const heapPts = [...HP, ...bottom.filter(([x]) => true).sort((a, b) => b[0] - a[0])];
    const heapG = new THREE.Group(); heapG.position.y = y(2156) - y(2104); cave.add(heapG);
    const heap = shapeMesh(heapPts.map(([x, yy]) => [x, yy - (y(2156) - y(2104))]), SAND, 1.0); heapG.add(heap);
    const heapDk = new THREE.Group();
    const chunks = Array.from({ length: 18 }, (_, i) => { const c = P3.mesh(new THREE.DodecahedronGeometry(.12 + hash(i * 2.3) * .24, 0), i % 3 ? mixCol(SAND, AP.graphite, .15) : MUD); c.scale.set(1 + hash(i) * .6, .7 + hash(i * 3) * .4, .5); S.add(c); return c; });
    return { o, S, U, lens, cave, hollow, HOLLOW, heapG, heap, heapDk, chunks, cam: P3.cam(36) };
  }
  // the wall of loose sand letting go: chunks break from the hollow's sides and fall to the heap round the bit
  const CHUNK = Array.from({ length: 18 }, (_, i) => {
    const side = i % 2 ? 1 : -1, y0 = 2108 + hash(i * 3.1) * 34;
    return { t0: .55 + hash(i * 1.9) * 2.6, d: .38 + hash(i * 4.4) * .2, x0: side * (2.1 + hash(i * 6.2) * 2.6), y0, x1: side * (.4 + hash(i * 7.7) * 2.4), spin: (hash(i * 8.8) - .5) * 9 };
  });
  function caving(C, lt, dur, grow) {
    const y = C.U.y, sx = lerp(.32, 1, grow), sy = lerp(.55, 1, grow), h = lerp(.05, 1, grow), y04 = y(2104);
    C.cave.visible = C.lens.visible = true;
    C.cave.scale.set(sx, sy, 1); C.heapG.scale.set(1, h, 1);
    const toW = local => y04 + local * sy;                                      // cave-local height → section y
    CHUNK.forEach((c, i) => {
      const m = C.chunks[i], k = (lt - c.t0) / c.d;
      m.visible = true;
      const mound = 1.2 * Math.max(0, 1 - Math.pow(c.x1 / 3.2, 2)), land = toW((y(2156) - y04) + (y(2139) - y(2156) + mound) * h) + .25;
      const x0 = c.x0 * sx, y0 = toW(y(c.y0) - y04);
      if (k < 0) m.position.set(x0, y0, 1.2);
      else { const q = easeIn(clamp(k)); m.position.set(lerp(x0, c.x1 * sx, q), lerp(y0, land, q), 1.2 + q * .3); }
      m.rotation.set(0, 0, c.spin * clamp(k));
    });
  }
  // Set the section for this frame. Workarounds for WORLD.section (see the report): the slot is drawn the whole depth of the
  // block, so end it at the bit (the hole is only as deep as it's drilled); and the rods run through the bit to its point
  // and poke out of the narrow end, so stop them at the bit's shoulder.
  function setSec(C, depth, st, o) {
    const U = C.U; U.set(depth, st, o);
    const sl = U.slot; sl.scale.y = depth / 3200; sl.position.y = -depth * U.VS / 2;
    const top = U.rods.position.y + U.rods.scale.y / 2, shoulder = U.bit.position.y + 1.2;
    U.rods.scale.y = Math.max(.01, top - shoulder); U.rods.position.y = (top + shoulder) / 2;
  }
  function hideCaving(C) { C.cave.visible = false; for (const m of C.chunks) m.visible = false; }
  // depth scale down the section's face: ticks every 50 ft, lettered every 100 (the brief's `ruler`, in perspective)
  function ruler3(cam, U, d0, d1, x = -11, bitD = null) {
    seed('Druler');
    if (bitD != null) { const [px, py] = P3.project(cam, [x, U.y(bitD), .4]); pfill([[px - 5, py], [px - 30, py - 13], [px - 30, py + 13]], AP.rust, { tone: .9, sw: 1 }); }
    const a = P3.project(cam, [x, U.y(d0), .4]), b = P3.project(cam, [x, U.y(d1), .4]);
    pline([[a[0], a[1]], [b[0], b[1]]], 1.3, AP.bone, { over: 0, alpha: .9 });
    for (let d = Math.ceil(d0 / 50) * 50; d <= d1; d += 50) {
      const big = d % 100 === 0, p = P3.project(cam, [x, U.y(d), .4]), q = P3.project(cam, [x + (big ? 1.6 : .8), U.y(d), .4]);
      pline([[p[0], p[1]], [q[0], q[1]]], big ? 1.3 : .8, AP.bone, { over: 0, passes: 1, alpha: .9 });
      if (big) label(`${d} FT`, q[0] + 12, q[1], 30, AP.bone, { screen: true });
    }
  }

  // ---------- D1 · 118.73 · [27] "the shaft has started caving": the section at the casing shoe ----------
  function d1Caving(t, lt, dur) {
    const C = SEC(), U = C.U, cam = C.cam, st = RIG.strokeAt(t);
    const depth = 2150 + 1.5 * seg(lt, 0, dur);
    setSec(C, depth, st, { casing: 2080 });
    caving(C, lt, dur, ease(seg(lt, .45, dur - .3)));
    const k = ease(seg(lt, 0, dur));
    cam.fov = 36; cam.updateProjectionMatrix();
    P3.look(cam, [lerp(9, 7.5, k), lerp(U.y(2088), U.y(2128), k), lerp(21, 18.5, k)], [lerp(.4, .2, k), lerp(U.y(2106), U.y(2144), k), 0]);
    sky('#15263A', '#1E3A44', { tone: .9, still: true });
    P3.draw(C.o, cam, { fog: [120, 600], fogCol: '#2B3E44', ink: INK, lineW: 1.5, near: 1, far: 800 });
    ruler3(cam, U, 2050, 2200);
    // the broken lips of the hollow, and sand running in off them in strings
    const gr = ease(seg(lt, .45, dur - .3)), sx = lerp(.32, 1, gr), sy = lerp(.55, 1, gr), y04 = U.y(2104);
    const lip = C.HOLLOW.map(([x, yy]) => P3.project(cam, [x * sx, y04 + (yy - y04) * sy, 1.0]).slice(0, 2));
    seed('Dlip'); pline(lip, 1.6, SAND, { closed: true, j: 1.8, alpha: .8 });
    seed('Dstream');
    for (const sd of [-1, 1]) for (let j = 0; j < 3; j++) {
      const x0 = sd * (1.4 + j * 1.1) * sx, y0 = y04 + (U.y(2109 + j * 7) - y04) * sy, a = clamp(seg(lt, .7 + j * .45, 1.2 + j * .45));
      if (a <= 0) continue;
      const top = P3.project(cam, [x0, y0, 1.25]), bot = P3.project(cam, [x0 * .6, U.y(2150), 1.25]);
      for (let i = 0; i < 22; i++) {
        const q = frac(i / 22 + t * (1.1 + j * .2)), x = lerp(top[0], bot[0], q) + Math.sin(i * 2.1 + t * 7) * 2, y = lerp(top[1], bot[1], q * q);
        X.fillStyle = i % 3 ? SAND : '#F0E4C4'; X.globalAlpha = .9 * a; X.fillRect(x - 1.5, y, 3, 4);
      }
    }
    X.globalAlpha = 1;
    // a puff where each chunk lands
    CHUNK.forEach((c, i) => { const q = lt - c.t0 - c.d; if (q > 0 && q < .5) { const [x, yy] = P3.project(cam, C.chunks[i].position.toArray()); puff(x, yy, 24 + q * 70, SAND, .55 * (1 - q / .5)); } });
    const hit = Math.exp(-st * 9), [bx, by] = P3.project(cam, [0, U.y(depth), 1.5]);
    puff(bx, by - 8, 70 * hit + 20, SAND, .55 * hit * clamp(lt / .6));
    if (lt < .35) scribbleWipe(.5 + lt / .7);
  }

  // ---------- D2 · 122.90 (a blow) · [27] "and the sinking's very slow": the driller feels the blows land in mud ----------
  function d2Driller(t, lt, dur) {
    const S = SITE(), U = S.U, cam = S.cam;
    const st = rigMode(S, 'drill', t);
    show(S, ['driller']);
    const down = ease(seg(lt, 1.55, 2.2));
    drillerAt(S, t, { head: lerp(.12, .55, down), look: lerp(-.1, .15, down), lean: lerp(.08, .2, down) });
    const g = lamps(S, { t, F: [1.0, FY + .98, -.6], L: [-7.3, 8.6, -7.6], E: [44.3, 8.72, 9.15], kF: 150, kL: 200, kE: 200, kFire: 200, kForge: 260 });
    // her profile at the rods, at her own height; when she looks down the hole the camera follows her eye down to the mouth
    const k = ease(seg(lt, 0, dur)), tilt = ease(seg(lt, 2.0, dur - .12)), perp = [.564, -.826], D = lerp(7.4, 6.6, k);
    cam.fov = 40; cam.updateProjectionMatrix();
    P3.look(cam, [2.35 + perp[0] * D - .5, lerp(6.5, 6.4, k) - tilt * .5, 1.65 + perp[1] * D], [lerp(1.5, 1.4, k) - tilt * 1.25, lerp(6.45, 6.35, k) - tilt * 2.2, lerp(1.0, .9, k) - tilt * .8]);
    nightSky(cam, t);
    drawNight(S, cam);
    glows(S, cam, g, t);
    // muddy water slops over the casing head with each blow
    const hit = Math.exp(-st * 7), [mx, my, md] = P3.project(cam, [0, FY + 1.75, 0]);
    if (md > 0) for (let i = 0; i < 5; i++) puff(mx + (hash(i) - .5) * 90 * (1.3 - hit), my - 20 * hit - hash(i * 3) * 30, (18 + 30 * hit) * 6 / md, '#6E5E48', .5 * hit);
    const [cx, cy] = P3.project(cam, [0, FY + 1.8, 0]);
    if (lt > dur - .38) hatchIris(cx, cy, 1500 * Math.pow(1 - seg(lt, dur - .38, dur), 2));
  }

  // ---------- D3 · 125.41 · [28] "the yellow rods are bending in the water down below": close on the caved hollow, flooded ----------
  // A cutaway of the same hollow as D1, close: the cut face with the hollow's outline taken out of it, the hollow's back wall
  // curving away, full of water. The pole string hangs from the casing shoe above to the jars, sinker bar and bit in the sand
  // heap below, and whips sideways on every blow (true scale for the poles; the hole is widened, as the section widens it).
  const CAV = Array.from({ length: 25 }, (_, i) => { const q = i / 24, yy = lerp(11.5, -11.5, q); return [.9 + 4.4 * Math.pow(Math.sin(Math.PI * q), .75) * (1 + (hash(i * 3.1) - .5) * .28), yy]; });
  const cavR = yy => { const q = clamp((11.5 - yy) / 23); const f = q * 24, i = Math.min(23, Math.floor(f)); return lerp(CAV[i][0], CAV[i + 1][0], f - i); };
  const ROCK = '#7C7A74', NSEG = 30, RTOP = 12, RBOT = -9.5;
  function buildBore() {
    const o = P3.scene({ sunDir: [-35, 30, 70], sun: 3.4, fill: 1.0, shadowSize: 30 });
    o.sun.color.set('#E2E8EE'); o.fill.color.set('#D0D5DA'); o.fill.groundColor.set('#6A625A');
    // the cut face, with the hollow taken out of it; the bore above (casing) and below (to the heap) runs on at pole width
    const face = new THREE.Shape(); face.moveTo(-45, -32); face.lineTo(45, -32); face.lineTo(45, 32); face.lineTo(-45, 32); face.closePath();
    const hole = new THREE.Path(); hole.moveTo(.9, 32);
    for (const [r, yy] of CAV) hole.lineTo(r, yy);
    hole.lineTo(1.1, -32); hole.lineTo(-1.1, -32);
    for (let i = CAV.length - 1; i >= 0; i--) hole.lineTo(-CAV[i][0] * (1 + (hash(i * 9.1) - .5) * .12), CAV[i][1]);
    hole.lineTo(-.9, 32); face.holes.push(hole);
    o.scene.add(P3.mesh(new THREE.ShapeGeometry(face), ROCK, { cast: false }));
    const wall = new THREE.LatheGeometry([[.9, 32], ...CAV, [1.1, -32]].map(([r, yy]) => new THREE.Vector2(r, yy)), 30, Math.PI / 2, Math.PI);
    o.scene.add(P3.mesh(wall, mixCol(ROCK, AP.graphite, .35), { side: THREE.DoubleSide }));
    // bedding on the face, broken where the hollow is; a few stones
    for (let i = 0; i < 16; i++) {
      const yy = -30 + (i + .5) * 60 / 16 + (hash(i * 2.1) - .5) * 1.6, r = Math.abs(yy) < 11.5 ? cavR(yy) + .3 : 1.3;
      for (const sd of [-1, 1]) { const L = 44 - r, l = P3.mesh(P3.box(L, .12, .1), mixCol(ROCK, AP.graphite, .45), { cast: false }); l.position.set(sd * (r + L / 2), yy + sd * (hash(i) - .5) * .4, .05); l.rotation.z = (hash(i * 3.3 + sd) - .5) * .04; o.scene.add(l); }
    }
    for (let i = 0; i < 30; i++) { const yy = (hash(i * 6.1) - .5) * 56, x = (hash(i * 4.7) > .5 ? 1 : -1) * ((Math.abs(yy) < 11.5 ? cavR(yy) : 1.2) + 1 + hash(i * 2.9) * 18); const st = P3.mesh(new THREE.DodecahedronGeometry(.15 + hash(i * 1.3) * .25, 0), mixCol(ROCK, AP.graphite, .3)); st.position.set(x, yy, .12); st.scale.z = .5; o.scene.add(st); }
    // the casing coming down to its shoe at the top of the hollow
    const cas = P3.mesh(P3.cyl(.62, .62, 22, 18), '#5E5A55'); cas.position.set(0, 11.2 + 11, -.35); o.scene.add(cas);
    const shoe = P3.mesh(P3.cyl(.7, .66, .6, 18), '#46423E'); shoe.position.set(0, 11.5, -.35); o.scene.add(shoe);
    // the heap of slumped sand in the bottom of the hollow
    const heap = P3.mesh(new THREE.LatheGeometry([[0, 2.6], [1.2, 2.2], [2.6, 1.2], [3.8, .3], [4.6, -.4]].map(([r, yy]) => new THREE.Vector2(r, yy)), 24, Math.PI / 2, Math.PI), SAND, { side: THREE.DoubleSide });
    heap.position.set(0, -11.4, -.3); o.scene.add(heap);
    // the string: poles (unit segments stretched along the bow each frame), iron joints, then jars, sinker bar and the bit
    const segs = Array.from({ length: NSEG }, () => { const m = P3.mesh(P3.cyl(.2, .2, 1, 8), '#E6BE5E'); o.scene.add(m); return m; });
    const joints = Array.from({ length: 3 }, () => { const m = P3.mesh(P3.cyl(.28, .28, 1.0, 8), '#34312E'); o.scene.add(m); return m; });
    const tools = new THREE.Group(); o.scene.add(tools);
    for (const sd of [-1, 1]) { const lk = P3.mesh(P3.box(.12, 3.4, .34), '#3E3B38'); lk.position.set(sd * .17, -1.7, 0); tools.add(lk); }          // jars
    const sinker = P3.mesh(P3.cyl(.24, .24, 5, 10), '#4A4744'); sinker.position.y = -3.4 - 2.5; tools.add(sinker);
    const bitB = P3.mesh(P3.box(.62, 2.2, .2), '#6A665E'); bitB.position.y = -8.4 - 1.1; tools.add(bitB);
    return { o, segs, joints, tools, cam: P3.cam(40) };
  }
  // the pole string's sideways whip: kicked by each blow (the string keeps coming after the bit stops), ringing down
  function bowAt(t) {
    const b = bpOf(t) / 2, since = frac(b) * 2 * BEAT, side = Math.floor(b) % 2 ? 1 : -1;
    return side * (1 - Math.exp(-since * 20)) * Math.exp(-since * 2.0) * Math.cos(since * 8.5 - .35) + .08 * Math.sin(t * 1.9);
  }
  function d3Rods(t, lt, dur) {
    const B = BORE(), cam = B.cam, st = RIG.strokeAt(t);
    const lift = st < .75 ? Math.sin(st / .75 * Math.PI / 2) : 1 - Math.pow((st - .75) / .25, 2), off = lift * 1.8;
    const A = bowAt(t) * 3.6, shape = q => Math.sin(q * Math.PI) + .45 * Math.sin(q * TAU + .4) * Math.sin(q * Math.PI);
    // the poles run from inside the casing (above the frame) down to the top of the jars, which ride the stroke
    const top = RTOP + 12, jarTop = RBOT + off, pts = [];
    for (let i = 0; i <= NSEG; i++) {
      const yy = lerp(jarTop, top, i / NSEG), q = clamp((11.3 - yy) / (11.3 - jarTop)), lim = yy > 11.3 ? .35 : Math.max(.3, cavR(yy) - .45);
      pts.push([clamp(A * shape(q), -lim, lim), yy, -.3]);
    }
    B.segs.forEach((m, i) => span(m, pts[i], pts[i + 1]));
    B.joints.forEach((m, j) => {
      const yy = jarTop + 3 + j * 17.5, i = Math.min(NSEG, Math.round((yy - jarTop) / (top - jarTop) * NSEG));
      m.position.set(pts[i][0], yy, -.3); m.visible = yy < top;
    });
    B.tools.position.set(0, jarTop, -.3);
    const k = ease(seg(lt, 0, dur));
    cam.fov = 40; cam.updateProjectionMatrix();
    P3.look(cam, [lerp(9.5, 8, k), lerp(1.5, -.5, k), lerp(30.5, 28, k)], [lerp(-.2, -.4, k), lerp(-1.4, -2.4, k), -.3], -.42);
    sky('#15263A', '#1E3A44', { tone: .9, still: true });
    P3.draw(B.o, cam, { fog: [80, 300], fogCol: '#2B3E44', ink: INK, lineW: 1.5, near: .5, far: 400 });
    // the loose sand bed the hollow was cut from, pale across the face (the same bed as the section's)
    const band = [[-45, -6.5], [45, -5.5], [45, 6.2], [-45, 5.4]].map(([x, yy]) => P3.project(cam, [x, yy, 0]).slice(0, 2));
    X.save(); tracePath(band); X.clip(); X.globalAlpha = 1; seed('Dband'); ptone(band, SAND, .42); pshade(band, mixCol(SAND, AP.graphite, .3), .35); X.restore();
    // the water filling the hollow: murky green-grey, level strokes, silt that swirls when the string whips
    const outline = []; for (const [r, yy] of CAV) outline.push(P3.project(cam, [r, yy, 0]).slice(0, 2));
    for (let i = CAV.length - 1; i >= 0; i--) outline.push(P3.project(cam, [-CAV[i][0], CAV[i][1], 0]).slice(0, 2));
    ptone(outline, '#2E5660', .5); seed('Dwater'); pshade(outline, '#1F4048', .6);
    X.save(); tracePath(outline); X.clip();
    for (let i = 0; i < 90; i++) {
      const yy = lerp(-11, 11, hash(i * 3.7)) - frac(t * .04 + hash(i)) * 2, r = cavR(yy), xx = (hash(i * 5.3) - .5) * 2 * r * .9 + Math.sin(t * 2.2 + i * 1.3) * .25 * Math.abs(A);
      const [sx, sy] = P3.project(cam, [xx, yy, .2]); X.fillStyle = i % 4 ? '#A9B9B4' : '#D6DED8'; X.globalAlpha = .6; X.fillRect(sx, sy, 2 + (i % 3), 2);
    }
    // the poles glimpsed yellow through the murk (a glaze over the water), joints dark
    const pp = pts.filter(p => p[1] < 11.6).map(p => P3.project(cam, p).slice(0, 2));
    B.joints.forEach(m => { if (!m.visible || m.position.y > 11.3) return; const a = P3.project(cam, [m.position.x, m.position.y - .5, -.3]), b = P3.project(cam, [m.position.x, m.position.y + .5, -.3]); seed('Djt'); pline([a.slice(0, 2), b.slice(0, 2)], 5.5, '#2A2724', { over: 0, passes: 1, alpha: .85 }); });
    if (pp.length > 1) { seed('Dpole'); pline(pp, 3.4, '#E8C262', { over: 0, passes: 1, alpha: .6, j: .3 }); pline(pp.map(([x, y]) => [x - 2, y - 1]), 1.2, '#F8E6A8', { over: 0, passes: 1, alpha: .55, j: .3 }); }
    X.restore(); X.globalAlpha = 1;
    // where the whip carries the poles to the wall they strike it and silt clouds off; sand puffs where the bit lands
    for (let i = 3; i < NSEG - 3; i += 2) { const p = pts[i]; if (p[1] > 11 || Math.abs(p[0]) < cavR(p[1]) - .5) continue; const [sx, sy] = P3.project(cam, [p[0] + Math.sign(p[0]) * .4, p[1], .1]); puff(sx, sy, 40, '#9AA8A2', .45); }
    const hit = Math.exp(-st * 8), [bx, by] = P3.project(cam, [0, -10.8, .5]); puff(bx, by, 60 * hit + 20, SAND, .5 * hit);
    if (lt < .38) { const [cx, cy] = P3.project(cam, [0, 11.5, 0]); hatchIris(cx, cy, 1500 * Math.pow(seg(lt, 0, .38), 2)); }
    if (lt > dur - .27) pageTurn(seg(lt, dur - .27, dur) * .5, 1);
  }
  // both underground sets live under one cache key (P3.cached keeps only three sets alive across the whole film);
  // `scene` lets the cache's dispose() walk both
  const UNDER = () => cachedD('D-under', () => { const sec = buildSec(), bore = buildBore(); return { sec, bore, scene: { traverse: f => { sec.o.scene.traverse(f); bore.o.scene.traverse(f); } } }; });
  const SEC = () => UNDER().sec, BORE = () => UNDER().bore;
  // ---------- D4b · 133.25 · "and they can't be made to shift": hands on the lever, the jaw on the pipe ----------
  function d4bHands(t, lt, dur) {
    const S = SITE(), cam = S.cam;
    rigMode(S, 'casing', t, { open: true }); tackle(S, 0, 1);
    show(S, ['lab', 'driller', 'dresser']);
    // the jaw slips a hair round the pipe at the top of a heave, bites again; the chalk mark on the pipe never moves
    const slip = .045 * easeOut(seg(t, 133.92, 134.0)) + .004 * spring(t, 134.0, 9, 40);
    tongCrew(S, t, slip);
    const g = lamps(S, { t, F: L3([-1.1, FY + .98, 2.6]), L: [-7.3, 8.6, -7.6], kF: 210, kL: 220, kFire: 0, kForge: 150 });
    const k = ease(seg(lt, 0, dur)), wk = easeIn(seg(lt, dur - .2, dur));
    cam.fov = 34; cam.updateProjectionMatrix();
    const at = L3([lerp(1.25, 1.15, k) + wk * 3, FY + 3.45, lerp(1.2, 1.1, k)]);
    P3.look(cam, L3([lerp(-1.5, -1.25, k), FY + 2.55, lerp(6.9, 6.3, k)]), at);
    nightSky(cam, t);
    drawNight(S, cam, { lineW: 1.9, near: .2 });
    glows(S, cam, g, t);
    // the bite: a fresh bright scrape on the pipe where the jaw slid
    if (t > 133.95) { const a = P3.project(cam, [0.05, FY + 3.35, .36]), b = P3.project(cam, [.25, FY + 3.3, .28]); seed('Dscrape'); pline([[a[0], a[1]], [b[0], b[1]]], 1.4, '#E8E2D2', { over: 0, passes: 1, alpha: .85 }); }
    whip(wk, 1);
  }

  // ---------- D5a · 134.99 · [30] "till we nearly burst the engine": Bill hauls the throttle wide ----------
  // the throttle: a hand on it, a small push forward (anticipation), then hauled right back to the stop, and a shake there
  const THR = [[134.99, .12], [135.2, .12], [135.36, .02], [135.7, 1.08], [135.78, 1.02], [136.2, 1.04]];
  const BILL_AT = [46.75, 0, 12.15];
  function billAt(S, t, th) {
    const p = S.P.bill, knob = [47.5, 4.4 + 1.6 * Math.cos(th), 9.64 + 1.6 * Math.sin(th)];
    PEOPLE.at(p, BILL_AT, Math.PI + .12);
    PEOPLE.clip(p, 'Idle_Loop', t * .9 + 2.1);
    const haul = clamp((th - .12) / .9), pre = clamp((.12 - th) / .1), strain = haul * (.7 + .3 * Math.sin(t * 31) * Math.sin(t * 17));
    PEOPLE.turn(p, 'spine_01', [.2 + pre * .12 - haul * .5, 0, 0]); PEOPLE.turn(p, 'spine_03', [.1 - haul * .12 + strain * .01, -.1 * haul, 0]);
    PEOPLE.turn(p, 'Head', [-.1 - .12 * haul, .12, 0]);
    // both hands on the lever, the right at the knob and the left lower down the shaft
    const mid = [47.5, 4.4 + 1.05 * Math.cos(th), 9.64 + 1.05 * Math.sin(th)];
    grip(p, 'r', knob, [48.8, 4.0, 12.4], .4);
    grip(p, 'l', [mid[0] - .08, mid[1], mid[2]], [45.4, 4.0, 12.2], .45);
  }
  function d5aBill(t, lt, dur) {
    const S = SITE(), cam = S.cam, th = kf(t, THR);
    rigMode(S, 'casing', t, { throttle: th, fly: flyAngle(t), gauge: .5 + .1 * seg(t, 135.7, 136.45), tongs: false });
    tackle(S, 0, .3); show(S, ['bill']); billAt(S, t, th);
    const g = lamps(S, { t, L: [-7.3, 8.6, -7.6], E: [44.3, 8.72, 9.15], kL: 200, kE: 230, kFire: 260, kForge: 260 });
    // low from the far side of the fire door: Bill in profile, the fire on his face, the lever swung back past us to the stop
    const wk = 1 - easeOut(seg(lt, 0, .22)), k = ease(seg(lt, 0, dur));
    cam.fov = 44; cam.updateProjectionMatrix();
    P3.look(cam, [lerp(41.4, 41.9, k), lerp(4.5, 4.6, k), lerp(14.6, 14.1, k)], [lerp(46.6, 46.7, k) - wk * 6, lerp(4.75, 4.85, k), lerp(11.0, 11.1, k) + wk * 2]);
    nightSky(cam, t);
    drawNight(S, cam);
    glows(S, cam, g, t);
    fireMouth(cam, t, 1 + .3 * seg(t, 135.5, 136));
    const [fx, fy, fd] = P3.project(cam, [46, 3.8, 9.8]); if (fd > 0) { const fl = flick(t * 1.4, 4); pglow(fx, fy, 3000 / fd * fl, FIREC, .5); }
    stack(S, cam, t, 1);
    whip(wk, 1);
  }
  // smoke and sparks from the stack, driven harder when the engine is opened up
  function stack(S, cam, t, hard = 0) {
    const [sx, sy, d] = P3.project(cam, S.U.stackTop); if (d <= 0) return;
    const sc = clamp(40 / d, .2, 3);
    for (let i = 0; i < 7; i++) { const q = frac(t * (.45 + hard * .5) + i / 7); puff(sx - q * 260 * sc, sy - q * 320 * sc, (16 + q * 90) * sc, '#6E6A66', .5 * (1 - q)); }
    if (hard > 0) for (let i = 0; i < 10; i++) { const q = frac(t * 1.6 + hash(i)), x = sx + (hash(i * 3) - .5) * 60 * sc - q * 90 * sc, y = sy - q * 260 * sc; X.fillStyle = '#FFB060'; X.globalAlpha = (1 - q) * hard; X.fillRect(x, y, 3, 3); }
    X.globalAlpha = 1;
  }

  // ---------- D5b · 136.20 · the gauge climbs into the red; the safety valve lifts and feathers ----------
  function d5bGauge(t, lt, dur) {
    const S = SITE(), cam = S.cam;
    const gz = lerp(.58, .93, easeOut(seg(t, 136.3, 137.0))) + .012 * Math.sin(t * 47) + .008 * Math.sin(t * 31);
    const vl = clamp((gz - .8) / .1) * (.09 + .02 * Math.sin(t * 38));
    rigMode(S, 'casing', t, { throttle: 1.02, fly: flyAngle(t), gauge: gz, valve: vl, tongs: false });
    tackle(S, 0, .2); show(S, []);
    const g = lamps(S, { t, E: [44.3, 8.72, 9.15], kE: 230, kFire: 260, kForge: 0 });
    const sh = shakeXY(t, 1.2);
    // up at the dial from below-left, the safety valve on the firebox top behind it against the sky
    cam.fov = 40; cam.updateProjectionMatrix();
    const kk = ease(seg(lt, 0, dur));
    P3.look(cam, [lerp(43.75, 43.85, kk) + sh[0] * .004, lerp(5.95, 6.05, kk) + sh[1] * .004, lerp(12.0, 11.7, kk)], [lerp(45.0, 45.0, kk), lerp(7.55, 7.6, kk), 9.0]);
    nightSky(cam, t);
    drawNight(S, cam, { lineW: 1.9, near: .2 });
    glows(S, cam, g, t);
    // steam feathering off the valve head, harder as the needle climbs
    const [vx, vy, vd] = P3.project(cam, [45.3, 8.75, 8.3]), sa = clamp((gz - .76) / .1);
    if (vd > 0) for (let i = 0; i < 18; i++) { const q = frac(t * 2.6 + i / 18); puff(vx + (hash(i) - .5) * 60 * (.3 + q) + q * 190, vy - q * 330 - 10 + (hash(i * 5) - .5) * 60 * q, (14 + q * 170), '#EEF1F0', .7 * (1 - q) * sa); }
    if (vd > 0 && sa > 0) { seed('Dfeather'); for (let i = 0; i < 4; i++) { const a = -1.75 + i * .14 + Math.sin(t * 30 + i) * .06; pline([[vx, vy - 4], [vx + Math.cos(a) * 60 * sa, vy - 4 + Math.sin(a) * 60 * sa]], 1.1, '#F4F6F4', { alpha: .6 * sa, over: 0, passes: 1 }); } }
    if (lt > dur - .3) steamCover(seg(lt, dur - .3, dur) * .5, vx, vy);
  }

  const FREE = BT(257);                                  // 138.39: the casing lets go on the beat

  // ---------- D5d · 137.20 · the line taut, the derrick creaking, and the casing breaks free ----------
  // Low among the crew on the tongs, looking up the casing and the three falls of the tackle to the crown. The engine is
  // pulling: the falls hum and shiver, dust sifts out of the girts. On the beat it lets go: the block leaps, the levers run
  // round a quarter turn and the three lurch after them, and muddy water wells out of the casing mouth.
  function d5dFree(t, lt, dur) {
    const S = SITE(), U = S.U, cam = S.cam;
    const strain = seg(t, 137.2, FREE), after = t - FREE, go = after > 0 ? easeOut(clamp(after / .35)) : 0;
    const lift = after < 0 ? .015 * Math.sin(t * 60) * strain : 1.3 * easeOut(clamp(after / .25)) + .1 * spring(t, FREE + .25, 5, 22) + .35 * clamp((after - .25) / 1.2);
    rigMode(S, 'casing', t, { throttle: 1.02, fly: flyAngle(t), gauge: .9, valve: .08, open: true, board: false, bull: after < 0 ? 0 : after * 1.2 });
    tackle(S, lift, 0, after < 0 ? strain : Math.exp(-after * 6));
    const creak = after < 0 ? strain * (.012 * Math.sin(t * 47) + .008 * Math.sin(t * 83)) : .03 * spring(t, FREE, 7, 30);
    S.R.position.set(creak, 0, creak * .6); S.R.updateMatrixWorld(true);
    // the tongs ride up with the pipe and run round when it frees; the crew stay on them, lurching after the levers
    const phi = -.42 * go - .03 * spring(t, FREE + .35, 6, 14);
    placeTong(S.tA, FY + 3.05 + lift * .8, yawOf(TA_DIR) + phi, .03); placeTong(S.tB, FY + 3.25 + lift * .8, yawOf(TB_DIR) + phi, -.03);
    const rot = d => { const c = Math.cos(phi), s2 = Math.sin(phi); return [d[0] * c + d[1] * s2, -d[0] * s2 + d[1] * c]; };
    const eA = after < 0 ? Math.max(.9, EFF.lab(t)) : lerp(1, .55, go), eB = after < 0 ? Math.max(.92, EFF.driller(t)) : lerp(1, .5, go);
    const step = go * .55, lurch = .3 * Math.sin(Math.PI * clamp(after / .5)) * (after > 0 ? 1 : 0);
    heave(S.P.lab, S.tA, 3.9, 4.65, rot(PUSH_A), eA, t, { frame: 1.55 + step, seed: 1, head: -.05 - go * .3, lean: lurch });
    heave(S.P.driller, S.tB, 2.9, 3.6, rot(PUSH_B), eB, t, { frame: .2 + step, seed: 2, head: -.35 - go * .25, hk: .08, look: -.35, lean: lurch });
    heave(S.P.dresser, S.tB, 5.15, 6.0, rot(PUSH_B), eB, t, { frame: 1.3 + step * .9, seed: 3, head: -.1 - go * .3, look: -.15, lean: lurch * .8 });
    show(S, ['lab', 'driller', 'dresser']);
    const g = lamps(S, { t, F: L3([-1.1, FY + .98, 2.6]), L: [-7.3, 8.6, -7.6], kF: 250, kL: 260, kFire: 0, kForge: 150 });
    const sh = shakeXY(t, after < 0 ? .3 + 1.0 * strain : 3 * Math.exp(-after * 5)), k = ease(seg(lt, 0, dur)), up = easeIn(seg(lt, dur - .22, dur));
    cam.fov = 60; cam.updateProjectionMatrix();
    P3.look(cam, L3([lerp(-.6, -.9, k) + sh[0] * .02, FY + .5 + sh[1] * .02, lerp(15.4, 14.6, k)]), L3([lerp(.6, .5, k), lerp(9, 9.6, k) + up * 30, 0]), sh[0] * .003);
    nightSky(cam, t);
    drawNight(S, cam);
    glows(S, cam, g, t);
    // dust shaken out of the girts under the strain, sifting down through the lantern light
    if (after < .6) for (let i = 0; i < 40; i++) {
      const q = frac(t * .8 + hash(i * 2.2)), wpt = L3([(hash(i * 3.1) - .5) * 10, 40 - q * 34, (hash(i * 4.3) - .5) * 9]);
      const [x, y, d] = P3.project(cam, wpt); if (d <= 0) continue; X.fillStyle = '#E8DCC0'; X.globalAlpha = .7 * clamp(strain * 1.4) * (1 - q) * (after < 0 ? 1 : 1 - after / .6); X.fillRect(x, y, 2.5, 2.5);
    }
    X.globalAlpha = 1;
    // it lets go: a crack of rust off the clamp, then muddy water welling out of the mouth over the planks
    if (after > 0) {
      const [kx, ky, kd] = P3.project(cam, [0, FY + 10.7 + lift, 0]), a0 = Math.exp(-after * 5); if (kd > 0) puff(kx, ky, 40 + 120 * (1 - a0), '#BFB098', .55 * a0);
      const a = clamp(after * 3) * Math.exp(-Math.max(0, after - .4) * .8), [mx, my, md] = P3.project(cam, [0, FY + 1.75, 0]);
      if (md > 0) for (let i = 0; i < 14; i++) { const q = clamp(after * 1.4 + hash(i) * .25), ang = hash(i * 3) * TAU, r = q * (40 + 90 * hash(i * 7)); puff(mx + Math.cos(ang) * r * 12 / md, my + Math.sin(ang) * r * .5 * 12 / md - 10 * (1 - q), (20 + 36 * q) * 12 / md, i % 2 ? '#5E503E' : '#7E6E56', .75 * a); }
    }
    if (lt < .32) steamCover(.5 + lt / .64, W / 2, H / 2);
    if (lt > dur - .22) whipV(up, 1);
  }

  // ---------- D6 · 139.23 · [31] "while the stubborn drill is ramming": the beam slams back into its rhythm ----------
  // The walking beam rising slow and dropping hard on every other beat, the first strokes short and building.
  function d6Beam(t, lt, dur) {
    const S = SITE(), U = S.U, cam = S.cam;
    const amp = ease(seg(t, 139.23, 140.1)), st = rigMode(S, 'drill', t, { amp, fly: flyAngle(t) });
    show(S, ['driller']); drillerAt(S, t, { head: .3 });
    const g = lamps(S, { t, F: [-1.5, FY + .98, -.9], L: [-7.3, 8.6, -7.6], E: [44.3, 8.72, 9.15], kF: 260, kL: 240, kE: 200, kFire: 220, kForge: 260 });
    const hit = amp * Math.exp(-st * 10) * (st < .5 ? 1 : 0), sh = shakeXY(t, 4 * hit);
    const k = ease(seg(lt, 0, dur)), wk = 1 - easeOut(seg(lt, 0, .25));
    // low beside the pitman, the beam in profile over us against the night, the moon behind the samson post; the driller in
    // lantern light at the rods beyond, small under the machine
    cam.fov = 50; cam.updateProjectionMatrix();
    P3.look(cam, [lerp(27.5, 26, k) + sh[0] * .01, lerp(3.0, 3.4, k) + sh[1] * .01, lerp(18.5, 17.2, k)], [lerp(10.5, 10, k), lerp(11.5, 11.8, k) + wk * 12, 0]);
    nightSky(cam, t);
    drawNight(S, cam);
    glows(S, cam, g, t);
    // dust jumps off the samson post's saddle and the rods' joint on every blow
    const [px, py, pd] = P3.project(cam, [15, 14.6, 0]); if (pd > 0) puff(px, py, 70 * hit + 10, '#B9A88A', .55 * hit);
    const [wx, wy, wd] = P3.project(cam, U.wellEnd); if (wd > 0) puff(wx, wy + 20, 60 * hit + 10, '#B9A88A', .45 * hit);
    stack(S, cam, t, 0);
    whipV(wk, 1);
  }

  // ---------- D7 · 143.05 · [32] "Sinking down, deeper down": the whole plant at work in the night, by lantern ----------
  // A slow crane down and round the plant: lantern pools on the floor, the fire door, the forge where the dresser strikes on
  // the beat, the camp fire far off, stack sparks against the stars. Every light is a place where someone is working.
  function d7Wide(t, lt, dur) {
    const S = SITE(), U = S.U, cam = S.cam;
    const st = rigMode(S, 'drill', t, { fly: flyAngle(t), forge: true, moon: .4, sky: .2 });
    show(S, ['driller', 'bill', 'dresser', 'hand']); drillerAt(S, t, { head: .3 });
    PEOPLE.at(S.P.bill, BILL_AT, Math.PI + .3); PEOPLE.clip(S.P.bill, 'Idle_Loop', t * .9 + 2.1);
    // the dresser at the anvil: a two-handed sledge stroke landing on the bit on the beat (every two beats)
    const an = U.anvil, tgt = [an[0] - .1, an[1] + .35, an[2] + .1], yaw = -Math.PI / 2 - .1, sp = PROPS.swingStand(S.P.dresser, tgt, yaw);
    PEOPLE.at(S.P.dresser, sp, yaw); PEOPLE.clip(S.P.dresser, 'Idle_Loop', t);
    PROPS.swing(S.P.dresser, S.sledge, frac(bpOf(t) / 2 + 1e-6), { target: tgt });
    PROPS.at(S.bitI, [an[0] - .2, an[1] + .15, an[2] + .1], [0, 0, -Math.PI / 2]);
    // the hand by the band wheel with a lantern held up to the belt
    PEOPLE.at(S.P.hand, [27.2, 0, 6.2], Math.PI * .85); PEOPLE.clip(S.P.hand, 'Idle_Lantern_Loop', t * .8 + .4);
    const hh = PEOPLE.hand(S.P.hand, 'r');
    const g = lamps(S, { t, F: [-1.5, FY + .98, -.9], L: [hh.x, hh.y - .05, hh.z], E: [44.3, 8.72, 9.15], B: [-7.05, 9.95, 8.35], kF: 220, kL: 200, kE: 240, kFire: 260, kForge: 420 });
    const k = ease(seg(lt, 0, dur)), a = lerp(.8, 1.1, k), R = lerp(86, 70, k);
    cam.fov = 44; cam.updateProjectionMatrix();
    P3.look(cam, [10 + Math.cos(a) * R, lerp(24, 12, k), Math.sin(a) * R], [lerp(9, 7, k), lerp(13, 12, k), 2]);
    nightSky(cam, t, { spin: lt * .04 });
    drawNight(S, cam, { fog: [180, 1300], lineW: 1.4 });
    glows(S, cam, g, t);
    const [fx, fy, fd] = P3.project(cam, U.forge); if (fd > 0) { pglow(fx, fy, 2600 / fd * flick(t, 9), FIREC, .6); }
    const [ax, ay, ad] = P3.project(cam, an); const spark = Math.exp(-frac(bpOf(t) / 2 + 1e-6) * 14);
    if (ad > 0 && spark > .05) { pglow(ax, ay, 900 / ad * spark, '#FFC070', spark); seed('Dspark'); for (let i = 0; i < 8; i++) { const q = 1 - spark, ang = -Math.PI / 2 + (hash(i * 3.1) - .5) * 2.4; pline([[ax, ay], [ax + Math.cos(ang) * (8 + 60 * q) * 40 / ad, ay + Math.sin(ang) * (8 + 60 * q) * 40 / ad + q * q * 20]], 1.2, '#FFC878', { alpha: spark, over: 0, passes: 1 }); } }
    const [ex, ey, ed] = P3.project(cam, [46, 3.8, 9.8]); if (ed > 0) pglow(ex, ey, 2200 / ed, FIREC, .55);
    const [cx, cy, cd] = P3.project(cam, [-36, 1, 38]); if (cd > 0) pglow(cx, cy, 3200 / cd * flick(t * .7, 3), FIREC, .6);
    stack(S, cam, t, .4);
  }

  // ---------- D8 · 146.39 (a blow) · [33] "Oh we'll sink it deeper down": over the boss's shoulder, a new depth chalked ----------
  // The board re-chalked: only the figure that changes is rubbed out and written again (2150 → 2450: the 1 becomes a 4).
  let GLYPH = null;                                      // where that digit sits on the board, in board feet (measured once)
  function glyph() {
    if (GLYPH) return GLYPH;
    const c = document.createElement('canvas').getContext('2d'), h = 256; c.font = `${Math.round(h * .55)}px "Cabin Sketch", serif`;
    const full = c.measureText('2150 FT').width, x0 = 256 - full / 2, a = x0 + c.measureText('2').width, b = x0 + c.measureText('21').width;
    return (GLYPH = { a, b, u: ((a + b) / 2 / 512 - .5) * 3.2, v: (.5 - .54) * 1.6 });
  }
  function boardPaint(S, wipe, reveal) {
    const G = glyph(), key = `rechalk|${Math.round(wipe * 20)}|${Math.round(reveal * 40)}`;
    S.board.userData.paint((c, w, h) => {
      c.strokeStyle = 'rgba(230,225,210,.25)'; c.lineWidth = 3; for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(0, h * (i + .5) / 9); c.lineTo(w, h * (i + .5) / 9 + (i % 3) - 1); c.stroke(); }
      c.fillStyle = '#EDE6D6'; c.font = `${Math.round(h * .55)}px "Cabin Sketch", serif`; c.textAlign = 'left'; c.textBaseline = 'middle';
      const full = c.measureText('2150 FT').width, x0 = w / 2 - full / 2, y = h * .54;
      const put = (txt, x, al) => { c.globalAlpha = .92 * al; c.fillText(txt, x, y); c.globalAlpha = .3 * al; c.fillText(txt, x + 3, y - 2); };
      put('2', x0, 1); put('50 FT', x0 + c.measureText('21').width, 1);
      if (wipe < 1) put('1', x0 + c.measureText('2').width, 1 - wipe);
      if (wipe > 0) { c.globalAlpha = .13 * (1 - .4 * reveal); c.fillRect(G.a - 12, h * .22, G.b - G.a + 24, h * .62); }        // the smudge of the palm
      if (reveal > 0) {                                                                                                    // the new figure, squeezed into the old one's slot, written top to bottom
        const cx = (G.a + G.b) / 2, sq = (G.b - G.a + 10) / c.measureText('4').width;
        c.save(); c.beginPath(); c.rect(G.a - 30, 0, G.b - G.a + 60, h * (.18 + .7 * reveal)); c.clip();
        c.translate(cx, 0); c.scale(sq, 1); c.textAlign = 'center'; put('4', 0, 1); c.restore();
      }
    }, key);
  }
  function d8Board(t, lt, dur) {
    const S = SITE(), U = S.U, cam = S.cam;
    rigMode(S, 'drill', t, { fly: flyAngle(t) });
    show(S, ['boss', 'driller']); drillerAt(S, t, { head: .3 });
    const wipe = ease(seg(lt, .06, .42)), rev = seg(lt, .5, 1.25), G = glyph();
    boardPaint(S, wipe, rev);
    // the boss at the board: a palm across the old figure, then the chalk writing the new one
    const p = S.P.boss, bp = S.board.position, bn = [Math.sin(.5), 0, Math.cos(.5)], bt = [Math.cos(.5), 0, -Math.sin(.5)];
    PEOPLE.at(p, [bp.x + bn[0] * 1.45 + bt[0] * .45, FY, bp.z + bn[2] * 1.45 + bt[2] * .45], .5 + Math.PI - .2);
    PEOPLE.clip(p, 'Idle_Loop', t * .8 + .6);
    PEOPLE.turn(p, 'spine_02', [.06, .12, 0]); PEOPLE.turn(p, 'Head', [.08, .15, 0]);
    const writing = lt > .46, zz = Math.sin(lt * 38);
    const u = G.u + (!writing ? .08 * Math.sin(lt * 26) : .07 * zz * (rev < 1 ? 1 : 0)), v = G.v + (!writing ? .05 * Math.cos(lt * 26) : lerp(.28, -.26, rev));
    const pen = [bp.x + bt[0] * u + bn[0] * (writing ? .2 : .12), bp.y + v, bp.z + bt[2] * u + bn[2] * (writing ? .2 : .12)];
    grip(p, 'r', pen, [bp.x + bn[0] * 1.2 + bt[0] * 1.6, bp.y - 1.4, bp.z + bn[2] * 1.2 + bt[2] * 1.6], writing ? .25 : .05);
    // the chalk in his fingers, its tip on the board while he writes; the log book under his left arm
    S.chalkS.visible = writing; if (writing) { const hh = PEOPLE.hand(p, 'r'); PROPS.place(S.chalkS, hh, [pen[0] - bn[0] * .05, pen[1], pen[2] - bn[2] * .05]); }
    S.logB.visible = true; const hl = PEOPLE.hand(p, 'l'); PROPS.at(S.logB, [hl.x, hl.y - .1, hl.z], [0, .5 + Math.PI, 0]);
    const g = lamps(S, { t, B: [-6.2, 9.4, 9.1], L: [-7.3, 8.6, -7.6], E: [44.3, 8.72, 9.15], kF: 200, kL: 200, kE: 200, kFire: 200, kForge: 240 });
    // over his left shoulder to the figure; at the end a quick pan down and across to the casing mouth, and into the hole
    const k = ease(seg(lt, 0, dur)), dn = easeIn(seg(lt, dur - .32, dur));
    cam.fov = 34; cam.updateProjectionMatrix();
    const from = [bp.x + bn[0] * lerp(4.4, 4.0, k) - bt[0] * 1.5, bp.y + .25, bp.z + bn[2] * lerp(4.4, 4.0, k) - bt[2] * 1.5];
    const at0 = [bp.x + bt[0] * (G.u + .15), bp.y - .05, bp.z + bt[2] * (G.u + .15)];
    P3.look(cam, from, [lerp(at0[0], 0, dn), lerp(at0[1], FY + 1.4, dn), lerp(at0[2], 0, dn)]);
    nightSky(cam, t);
    drawNight(S, cam, { lineW: 1.7, near: .2 });
    glows(S, cam, g, t);
    if (dn > 0) whip(dn, -1);
  }

  // ---------- D9 · 148.43 · [34–35] the section: down through the mudstone into the sandy shale, to 2,700 ft ----------
  function d9Dive(t, lt, dur) {
    const C = SEC(), U = C.U, cam = C.cam, st = RIG.strokeAt(t);
    const depth = lerp(2450, 2700, ease(seg(t, 148.9, BT(284) - .05)));
    setSec(C, depth, st, { casing: depth - 60 });
    hideCaving(C); C.lens.visible = true;
    // carried on from the tilt down at the board: a plunge down the bore from the surface through the strata, easing onto
    // the bit at 2,450 ft; then the slow way down with it, three-quarter on to the cut face, to 2,700
    const pl = easeOut(seg(lt, 0, .55)), camD = lerp(0, depth, pl), yb = U.y(camD);
    const k = ease(seg(lt, .55, dur)), hit = Math.exp(-st * 9) * clamp((lt - .5) * 3), sh = shakeXY(t, 2.5 * hit);
    cam.fov = 40; cam.updateProjectionMatrix();
    P3.look(cam, [lerp(-9, 11, k) + sh[0] * .01, yb + lerp(6, 3.5, k), lerp(23, 20, k)], [0, yb + lerp(2.2, 1.4, k) + sh[1] * .01, 0]);
    sky('#15263A', '#1E3A44', { tone: .9, still: true });
    P3.draw(C.o, cam, { fog: [120, 600], fogCol: '#2B3E44', ink: INK, lineW: 1.6, near: 1, far: 800 });
    ruler3(cam, U, camD - 120, camD + 60, -10, pl >= 1 ? depth : null);
    // each blow: a flash at the bit face, chips and dust kicked up the hole
    const [bx, by] = P3.project(cam, [0, U.y(depth), 1.5]);
    if (hit > .03) { pglow(bx, by, 160 * hit, '#FFE0A0', .7 * hit); seed('Dchip'); for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (hash(i * 3.7) - .5) * 1.6, r = 14 + (1 - hit) * 70; pline([[bx + Math.cos(a) * 8, by + Math.sin(a) * 8], [bx + Math.cos(a) * r, by + Math.sin(a) * r]], 1.3, '#E8DCC0', { alpha: hit, over: 0, passes: 1 }); } }
    puff(bx, by - 10, 70 * hit + 18, '#B7A88C', .55 * hit);
    if (lt < .6) whipV(clamp(1.3 * (1 - pl)), -1);
    if (lt > dur - .35) scribbleWipe((lt - (dur - .35)) / .7);
  }

  shots([[118.73, d1Caving], [BT(228), d2Driller], [125.41, d3Rods], [129.57, d4Painting], [133.25, d4bHands], [134.99, d5aBill],
    [136.2, d5bGauge], [137.2, d5dFree], [139.23, d6Beam], [143.05, d7Wide], [BT(272), d8Board], [148.43, d9Dive]]);
})();
