// Chapter C (v2) · 85.83–118.73 s · The Glasgow engine: verse 3 [18–22] and chorus 3 [23–26]. See docs/artesian/STORYBOARD.md.
//
// In through the flywheel, out through the plate: the engine's spinning wheel in the outback whirls into a grey memory of
// the same wheel on the test bed in a Glasgow erecting shop, where a careful engineer listens to her and polishes her
// maker's plate ("20 N.H.P."); the plate dissolves into the same plate, dusty, on the working engine. Bill fires her with
// split gidgee; horses and kelpies gallop, cut on the blows against the flywheel, crank and beam at full power; the camera
// cranes up over the whole plant in the gold light; sunset; the dive down the section to 2,100 ft.
(() => {
  const C0 = 85.83;                                    // to 118.73, where chapter D's first shot starts
  const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const A = v => v.isVector3 ? v.toArray() : v;
  const mix3 = (a, b, k) => a.map((v, i) => lerp(v, b[i], k));
  const bump = (x, a, b, c, d) => seg(x, a, b) * (1 - seg(x, c, d));
  // the afternoon's drilling: 1400 ft at the chapter's start, 2100 ft at its end (faster through the chorus)
  const depthAt = t => t < 108.67 ? lerp(1400, 1790, seg(t, C0, 108.67)) : lerp(1790, 2100, ease(seg(t, 108.67, 118.2)));

  // ---------- light: late-afternoon gold, then sunset, the sun low in the west (-x, a little toward +z) ----------
  const sunVec = (alt, az) => [-Math.cos(az) * Math.cos(alt), Math.sin(alt), Math.sin(az) * Math.cos(alt)];
  const GOLD = { dir: sunVec(.23, .63), sun: '#FFD49A', k: 2.5, sky: '#DCCBB0', gnd: '#8A6A4A', fill: .55, tint: .6, top: '#E4B06A', bot: '#F4DDB0', fog: '#F0D8AA' };
  const DUSK = { dir: sunVec(.075, .6), sun: '#FF9656', k: 2.3, sky: '#C0A09A', gnd: '#5A4034', fill: .48, tint: .8, top: '#B8684A', bot: '#F2BC84', fog: '#E9B482' };
  function light(o, L, target = [20, 0, 0], dist = 420) {
    const d = V(...L.dir).normalize();
    o.sun.target.position.set(...target); o.sun.position.copy(V(...target).add(d.multiplyScalar(dist)));
    o.sun.color.set(L.sun); o.sun.intensity = L.k; o.fill.color.set(L.sky); o.fill.groundColor.set(L.gnd); o.fill.intensity = L.fill;
    o.sun.target.updateMatrixWorld(); o.sun.updateMatrixWorld();
  }
  function lowSun(x, y, r) {   // a red evening sun on the horizon, its glow first
    seed('lowsun'); pglow(x, y, r * 5, '#FF9A50', .55); pglow(x, y, r * 2.2, '#FFD8A0', .5);
    pfill(ellPts(x, y, r, r, 30, r * .02), '#F8D8A6', { tone: .9, dens: .35, ink: '#D8804A', sw: 1 });
  }
  function sunOnScreen(cam, L) { const p = cam.position.clone().add(V(...L.dir).normalize().multiplyScalar(3000)); const [x, y, d] = P3.project(cam, A(p)); return d > 0 ? [x, y] : null; }
  const focal = cam => H / 2 / Math.tan(cam.fov * Math.PI / 360);
  function lens(cam, fov) { if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); } }

  // ---------- stroke, beam and flywheel timing ----------
  // The blow lands on the beat every two beats (RIG.strokeAt). The band wheel turns once a stroke (its crank pin is at the
  // top at the blow); the belt ties the flywheel to it at the ratio of their rims (5.2 / 3.1), so the flywheel makes
  // 1.68 turns a stroke (about 94 rpm): no speed-up when Bill fires her, which would need the belt to slip. Her extra
  // work shows in the smoke, the steam at the valve and the governor balls riding high.
  const strokes = t => bpOf(t) / 2;
  const flyTurns = t => strokes(t) * 5.2 / 3.1;
  const workK = t => seg(t, 97.4, 100.4);                              // how hard she is being driven after the firing
  const CRANK_R = .65;
  const blowK = (t, k = 9) => Math.exp(-frac(strokes(t)) * k);      // 1 on each blow, decaying
  // The driller turns the string a little at the top of each stroke, when the tools hang weightless (Boyd 1894): the
  // tiller bar steps round .06 rad a stroke, centred on her side of the rods mid-chapter so her hand stays on its end.
  const DR_DIR = Math.atan2(-.61, .79);
  const tillerAt = t => { const s = strokes(t); return DR_DIR + .06 * (Math.floor(s) + ease(seg(frac(s), .64, .8)) - 94.4); };

  // ---------- the portable engine, dressed locally ----------
  // The shared engine is built crosswise (firebox to +z, flywheel square to the band wheel). Chapter A turns it to face
  // the derrick and stands it at x = 52, in line beyond the band wheel (storyboard continuity); this chapter matches A.
  const ENG_X = 52, ENG_Z = 0;
  const EW = (x, y, z) => [ENG_X + x, y, ENG_Z + z];                  // engine-local → world (the engine is not rotated)
  const PLATE = [2.5, 4.6, 2.19], PLATE_TILT = .357;                   // the maker's plate: on the barrel, flywheel side
  function paintPlate(c, w, h, dust, polish = 1) {
    const brass = dust ? '#C09A58' : '#E6D296', brassDk = dust ? '#5E4A2C' : '#5E5648';
    c.fillStyle = brass; c.fillRect(0, 0, w, h);
    c.fillStyle = dust ? '#4A3A2E' : '#3A3A40'; c.fillRect(w * .05, h * .08, w * .9, h * .84);
    c.strokeStyle = brass; c.lineWidth = w * .012; c.strokeRect(w * .08, h * .135, w * .84, h * .73);
    for (const [x, y] of [[.028, .05], [.972, .05], [.028, .95], [.972, .95]]) { c.fillStyle = brassDk; c.beginPath(); c.arc(w * x, h * y, w * .02, 0, TAU); c.fill(); }
    const txt = (s, y, px, sp = 0) => {
      c.font = `bold ${px}px "Times New Roman", Times, serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
      const chars = [...s], wid = chars.reduce((a, ch) => a + c.measureText(ch).width + sp, -sp); let x = w / 2 - wid / 2;
      for (const ch of chars) { const cw = c.measureText(ch).width; c.fillStyle = brassDk; c.fillText(ch, x + cw / 2 + 2, y + 2); c.fillStyle = brass; c.fillText(ch, x + cw / 2, y); x += cw + sp; }
    };
    txt('D. McCRAE & SONS', h * .29, h * .125, 2);
    txt('20  N.H.P.', h * .535, h * .26, 6);
    txt('ENGINEERS  GLASGOW', h * .765, h * .095, 4);
    if (polish < 1) {   // a dull film over the brass, wiped away left to right by the engineer's rag
      const x0 = w * polish, g = c.createLinearGradient(x0 - w * .06, 0, x0 + w * .06, 0);
      g.addColorStop(0, 'rgba(150,152,156,0)'); g.addColorStop(1, 'rgba(150,152,156,.6)'); c.fillStyle = g; c.fillRect(x0 - w * .06, 0, w, h);
    }
    if (dust) {   // red dust caked into the recesses and over the face, a thumb-wipe across the figures
      const rnd = lcg(41);
      for (let i = 0; i < 900; i++) { const x = rnd() * w, y = rnd() * h, r = 1 + rnd() * 5, mid = Math.abs(y - h * .535) < h * .13 && x > w * .18 && x < w * .82; c.fillStyle = `rgba(${150 + rnd() * 40},${95 + rnd() * 30},${55 + rnd() * 20},${(mid ? .1 : .32) * rnd()})`; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
      const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(160,110,60,.4)'); g.addColorStop(.35, 'rgba(160,110,60,.05)'); g.addColorStop(.7, 'rgba(160,110,60,.08)'); g.addColorStop(1, 'rgba(150,100,55,.45)'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    }
  }
  // flyball governor, crankshaft, crank, connecting rod and crosshead, steam dome, a fire behind a hinged firedoor, the plate
  function dressEngine(eng, fly, o = {}) {
    const IRON = '#4A4744', IRON_LT = '#7C7770', BR = '#B8963E';
    const add = (m, p, par = eng) => { if (p) m.position.set(...p); par.add(m); return m; };
    const U = { fly };
    add(P3.mesh(P3.cyl(.22, .22, 3.4, 12).rotateX(Math.PI / 2), IRON), [-3.2, 9.2, 1.2]);
    for (const z of [-.35, 2.2]) add(P3.mesh(P3.box(.7, 1.3, .5), IRON_LT), [-3.2, 8.45, z]);
    U.crank = add(new THREE.Group(), [-3.2, 9.2, .45]);
    const web = P3.mesh(P3.box(.5, 1.1, .22), IRON); web.position.y = .38; U.crank.add(web);
    const pin = P3.mesh(P3.cyl(.12, .12, .5, 10).rotateX(Math.PI / 2), IRON_LT); pin.position.set(0, .7, .2); U.crank.add(pin);
    U.rod = add(P3.mesh(P3.box(.28, 1, .22), IRON_LT), [0, 0, .65]);
    U.prod = add(P3.mesh(P3.cyl(.08, .08, 1, 8).rotateZ(Math.PI / 2), IRON_LT), [0, 8.2, .65]);
    U.xhead = add(P3.mesh(P3.box(.5, .42, .4), IRON), [0, 8.2, .65]);
    for (const dy of [-.32, .32]) add(P3.mesh(P3.box(2.6, .1, .12), IRON), [-.6, 8.2 + dy, .65]);
    U.gov = add(new THREE.Group(), [-.9, 8.3, -1.2]);
    const col = P3.mesh(P3.cyl(.12, .16, 1.4, 10), IRON); col.position.y = .7; U.gov.add(col);
    U.govSpin = new THREE.Group(); U.govSpin.position.y = 1.5; U.gov.add(U.govSpin);
    U.govArms = [];
    for (const sd of [-1, 1]) {
      const arm = new THREE.Group(); arm.position.set(0, .35, 0); arm.rotation.y = sd > 0 ? 0 : Math.PI; U.govSpin.add(arm);
      const hinge = new THREE.Group(); arm.add(hinge);
      const bar = P3.mesh(P3.box(.06, .9, .06), IRON_LT); bar.position.y = -.45; hinge.add(bar);
      const ball = P3.mesh(new THREE.SphereGeometry(.2, 12, 8), BR); ball.position.y = -.9; hinge.add(ball);
      U.govArms.push(hinge);
    }
    const cap = P3.mesh(P3.cyl(.07, .12, .3, 8), BR); cap.position.y = .45; U.govSpin.add(cap);
    add(P3.mesh(P3.cyl(.75, .85, 1.3, 16), IRON), [-1.8, 8.0, -.2]);
    add(P3.mesh(P3.cyl(.9, .9, .15, 16), BR), [-1.8, 8.7, -.2]);
    U.valve = add(P3.mesh(P3.cyl(.12, .16, .8, 8), BR), [-5.9, 8.2, -1.1]);
    let door = null; eng.traverse(ob => { if (ob.isMesh && ob.geometry.parameters && ob.geometry.parameters.width === .2 && ob.geometry.parameters.height === 1.5) door = ob; });
    U.fire = add(P3.mesh(P3.box(.04, 1.35, 1.65), '#F2A040', { style: .6, cast: false, receive: false }), [-9.52, 3.8, 0]);
    U.hinge = add(new THREE.Group(), [-9.55, 3.8, .9]);
    if (door) { eng.remove(door); door.position.set(-.06, 0, -.9); U.hinge.add(door); }
    const handle = P3.mesh(P3.box(.12, .14, .5), BR); handle.position.set(-.18, 0, -1.5); U.hinge.add(handle);
    U.plate = P3.plate(1.05, .62, '#3A3A3E', (c, w, h) => paintPlate(c, w, h, !!o.dusty)); U.plate.position.set(...PLATE); U.plate.rotation.x = PLATE_TILT; eng.add(U.plate);
    for (const [x, y] of [[-.495, .28], [.495, .28], [-.495, -.28], [.495, -.28]]) add(P3.mesh(new THREE.SphereGeometry(.03, 8, 6), BR), [x, y, .02], U.plate);
    U.spokes = fly.children.filter(ch => ch.geometry && ch.geometry.type === 'BoxGeometry');
    U.blur = P3.mesh(new THREE.RingGeometry(.55, 2.95, 40, 1), '#7A766E', { cast: false, side: THREE.DoubleSide }); fly.add(U.blur);
    eng.userData.dress = U;
    return U;
  }
  // pose the engine's motion from the flywheel angle (radians); doorOpen 0..1 swings the firedoor
  function runEngine(eng, ang, doorOpen = 0, o = {}) {
    const U = eng.userData.dress;
    U.fly.rotation.z = ang; U.crank.rotation.z = ang;
    const pinL = V(-3.2 - Math.sin(ang) * .7, 9.2 + Math.cos(ang) * .7, .65);
    const xh = V(pinL.x + Math.sqrt(Math.max(.1, 3.1 * 3.1 - Math.pow(pinL.y - 8.2, 2))), 8.2, .65);
    U.xhead.position.copy(xh);
    U.rod.position.copy(pinL).add(xh).multiplyScalar(.5); U.rod.scale.y = pinL.distanceTo(xh);
    U.rod.quaternion.setFromUnitVectors(V(0, 1, 0), xh.clone().sub(pinL).normalize());
    U.prod.position.set((xh.x + .5) / 2, 8.2, .65); U.prod.scale.set(Math.max(.05, .5 - xh.x), 1, 1);
    U.govSpin.rotation.y = ang * 1.3;
    for (const h of U.govArms) h.rotation.z = -(o.gov ?? .55);
    U.hinge.rotation.y = doorOpen * 1.9;
    U.fire.visible = doorOpen > .02;
    for (const s of U.spokes) s.visible = !o.blur;
    U.blur.visible = !!o.blur;
    eng.updateMatrixWorld(true);
  }
  // A fast wheel the way an illustrator draws one: runEngine's blur swaps the spokes for a toned disc (U.blur, in 3D so
  // it sits behind whatever is in front of it), and this adds pale speed streaks over it in 2D.
  function wheelFrame(obj) { obj.updateMatrixWorld(true); const c = V(); obj.getWorldPosition(c); const q = new THREE.Quaternion(); obj.getWorldQuaternion(q); return { c, u: V(1, 0, 0).applyQuaternion(q), v: V(0, 1, 0).applyQuaternion(q) }; }
  function flyBlur(cam, obj, r, t, k = 1) {
    const f = wheelFrame(obj);
    const at = (rr, a) => { const p = f.c.clone().add(f.u.clone().multiplyScalar(Math.cos(a) * rr)).add(f.v.clone().multiplyScalar(Math.sin(a) * rr)); const q = P3.project(cam, A(p)); return [q[0], q[1]]; };
    const ring = (rr, a0, a1, m = 16) => { const P = []; for (let i = 0; i <= m; i++) P.push(at(rr, lerp(a0, a1, i / m))); return P; };
    seed('flyblur' + r);
    // pale streaks where the rim and spokes smear past; they re-draw with the pencil's boil, not with the true angle
    for (let i = 0; i < 9; i++) { const h = hash(i * 7.3 + BOILN * 1.7), a0 = h * TAU, rr = r * (.32 + .07 * i), len = .9 + hash(i * 3.1 + BOILN) * 1.1; pline(ring(rr, a0, a0 + len), 1.3 + .3 * (i % 3), '#EFE4CE', { alpha: .6 * k, passes: 1, over: 0 }); }
    pline(ring(r * .96, hash(BOILN * .7) * TAU, hash(BOILN * .7) * TAU + 2.2, 24), 1.4, '#F4ECDA', { alpha: .5 * k, passes: 1, over: 0 });
  }

  // ---------- small builders ----------
  // split gidgee: a wedge of dark red-black wood with paler red end grain
  function splitLog(len = 2.6, r = .32, sd = 1) {
    const s = new THREE.Shape(), a0 = -.55 - hash(sd) * .3, a1 = .55 + hash(sd + 1) * .3;
    s.moveTo(0, 0); for (let i = 0; i <= 8; i++) { const a = lerp(a0, a1, i / 8); s.lineTo(Math.sin(a) * r, Math.cos(a) * r); } s.lineTo(0, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false }); g.translate(0, -r * .45, -len / 2);
    return P3.mesh(g, '#4A2A22', { material: [P3.mat('#A2603E'), P3.mat('#4A2822')] });
  }
  // hand-held things
  function rag() {
    const g = new THREE.PlaneGeometry(.72, .56, 7, 6), pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i); pos.setZ(i, .06 * Math.sin(x * 19 + y * 7) + .05 * Math.cos(y * 23 - x * 5) - .9 * (x * x + y * y) * .5); }
    g.computeVertexNormals(); return P3.mesh(g, '#E6E4DE', { side: THREE.DoubleSide });
  }
  // a person's head turns toward a point (split between neck and head), after the clip
  function look(p, target, k = 1) {
    const hd = PEOPLE.head(p), yaw = p.root.rotation.y, d = V(...target).sub(hd);
    const fx = Math.sin(yaw), fz = Math.cos(yaw), lx = Math.cos(yaw), lz = -Math.sin(yaw);
    const f = d.x * fx + d.z * fz, s = d.x * lx + d.z * lz, yr = Math.atan2(s, f), pr = -Math.atan2(d.y, Math.hypot(f, s));
    const cy = clamp(yr, -1.1, 1.1) * k, cp = clamp(pr + .12, -.7, .8) * k;
    PEOPLE.turn(p, 'neck_01', [cp * .45, cy * .45, 0]); PEOPLE.turn(p, 'Head', [cp * .55, cy * .55, 0]);
  }
  // ---------- dissolves (two whole frames mixed through a soft circle) and the memory's paper vignette ----------
  let CV = null, VIG = null;
  const canv = i => { CV = CV || [0, 1].map(() => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; }); return CV[i]; };
  function grab(i) { const c = canv(i), g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'copy'; g.drawImage(X.canvas, 0, 0); g.globalCompositeOperation = 'source-over'; return c; }
  function clearX() { X.setTransform(1, 0, 0, 1, 0, 0); X.globalAlpha = 1; X.globalCompositeOperation = 'source-over'; X.clearRect(0, 0, W, H); ZOOM = 1; PCAM = null; }
  function dissolve(drawA, drawB, k, cx = W / 2, cy = H / 2, soft = .5) {
    if (k <= 0) { drawA(); return; } if (k >= 1) { drawB(); return; }
    drawA(); const ca = grab(0); clearX(); drawB(); const cb = grab(1); clearX();
    const Rm = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)), F = Rm * soft, rOut = lerp(0, Rm + F, k);
    const mask = g => { const gr = g.createRadialGradient(cx, cy, 0, cx, cy, Math.max(1, rOut)); const a0 = clamp(rOut / F), inner = clamp((rOut - F) / rOut); gr.addColorStop(0, `rgba(0,0,0,${a0})`); if (inner > 0) gr.addColorStop(inner, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); return gr; };
    const ga = ca.getContext('2d'), gb = cb.getContext('2d');
    ga.globalCompositeOperation = 'destination-out'; ga.fillStyle = mask(ga); ga.fillRect(0, 0, W, H); ga.globalCompositeOperation = 'source-over';
    gb.globalCompositeOperation = 'destination-in'; gb.fillStyle = mask(gb); gb.fillRect(0, 0, W, H); gb.globalCompositeOperation = 'source-over';
    X.drawImage(ca, 0, 0); X.globalCompositeOperation = 'lighter'; X.drawImage(cb, 0, 0); X.globalCompositeOperation = 'source-over';
  }
  // the memory's frame: the drawing fades into bare paper toward the edges, like a sketch left unfinished
  function memoryEdge(k = 1) {
    if (k <= 0) return;
    if (!VIG) {
      VIG = document.createElement('canvas'); VIG.width = W; VIG.height = H; const g = VIG.getContext('2d');
      g.drawImage(paperG.elt, 0, 0, W, H); g.globalCompositeOperation = 'destination-in';
      g.save(); g.translate(W / 2, H * .44); g.scale(1.3, 1); const gr = g.createRadialGradient(0, 0, H * .3, 0, 0, H * .74);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.5, 'rgba(0,0,0,.45)'); gr.addColorStop(1, 'rgba(0,0,0,1)'); g.fillStyle = gr; g.fillRect(-W, -H, 2 * W, 2 * H); g.restore();
      g.globalCompositeOperation = 'source-over';
    }
    X.save(); X.setTransform(1, 0, 0, 1, 0, 0); X.globalAlpha = clamp(k); X.drawImage(VIG, 0, 0); X.restore();
    seed('memedge');   // loose graphite strokes where the drawing stops
    for (let i = 0; i < 22; i++) { const a = i / 22 * TAU + hash(i) * .2, rx = W * .47 + hash(i * 3) * 40, ry = H * .43 + hash(i * 5) * 30, cx = W / 2 + Math.cos(a) * rx, cy = H * .44 + Math.sin(a) * ry; pline([[cx, cy], [cx + Math.cos(a + 1.6) * 60, cy + Math.sin(a + 1.6) * 60]], .8, '#5A5E66', { alpha: .35 * k, passes: 1 }); }
  }
  // A whirl of pale strokes round a point: the spinning flywheel carries us into the memory (p 0 → .5 covers, .5 → 1 clears)
  function whirl(p, cx, cy, col = '#D9DCDD') {
    if (p <= 0 || p >= 1) return;
    seed('whirl');
    const cover = p < .5 ? easeOut(p * 2) : 1 - ease((p - .5) * 2), spin = p * 5;
    X.save(); X.lineCap = 'round'; X.strokeStyle = pat(col, 's');
    for (let i = 0; i < 30; i++) {
      const r = 30 + i * 48, reach = clamp(cover * 1.4 - hash(i * 7) * .4) * TAU * .95, a0 = spin * (1 + hash(i) * .6) + hash(i * 3) * TAU;
      if (reach <= .05) continue;
      X.globalAlpha = .88; X.lineWidth = 40 + 24 * hash(i * 11);
      X.beginPath(); for (let k = 0; k <= 24; k++) { const a = a0 + reach * k / 24, rr = r + jit(4); k ? X.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * .92) : X.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * .92); } X.stroke();
    }
    X.restore();
    pshade(rectPts(-40, -40, W + 80, H + 80), '#8C949C', cover * .8);
  }

  // =====================================================================================================================
  // SET 1: the bore site, gold afternoon to sunset. Shared site; engine turned and dressed; Bill's split gidgee; the crew;
  // the station's horse mob and the kelpies (true size: the animal models come in two to three times too big).
  function buildSite() {
    const o = P3.scene({ sunDir: GOLD.dir.map(v => v * 300), sun: GOLD.k, fill: GOLD.fill, shadowSize: 150 });
    o.sun.shadow.camera.far = 1400; o.sun.shadow.camera.updateProjectionMatrix();
    const st = WORLD.site({ board: 1400, trees: 70, dead: .6 }); o.scene.add(st.group);
    const R = st.rig, U = R.userData;
    U.eng.rotation.y = 0; U.eng.position.set(ENG_X, 0, ENG_Z);
    U.tiller.scale.x = .62;                                  // a hand tiller, short enough for her to stand in to the rods
    const E = dressEngine(U.eng, U.fly, { dusty: true });
    // gidgee in the woodpile (dark red-black), and a ready stack of split wood at the fireman's left
    R.children.forEach(ch => {
      if (!ch.isMesh) return; const hx = ch.material.userData.albedo && ch.material.userData.albedo.getHexString();
      if (hx === '7a5a40') { ch.material.color.set('#4A2822'); ch.material.userData.albedo.set('#4A2822'); }
    });
    const stack = new THREE.Group(); o.scene.add(stack);
    for (let i = 0; i < 18; i++) { const lg = splitLog(2.4 + hash(i) * .6, .3 + hash(i + 3) * .08, i), row = Math.floor(i / 5), k = i % 5; lg.position.set(...EW(-11.9 + (hash(i * 7) - .5) * .5, .3 + row * .5, -2.7 - k * .56 - (row % 2) * .28)); lg.rotation.set((hash(i * 5) - .5) * .9, Math.PI / 2 + (hash(i * 3) - .5) * .3, 0); stack.add(lg); }
    const log = splitLog(2.7, .33, 99); o.scene.add(log);
    const fireLamp = P3.lamp(o, EW(-10.4, 3.9, 0), '#FF8A3A', 0, 36);
    const forgeLamp = P3.lamp(o, [-29, 4.2, 7.5], '#FF8A3A', 0, 30, false);
    const people = {}; for (const n of ['bill', 'driller', 'dresser', 'hand', 'boss']) { people[n] = PEOPLE.make(n, n === 'bill' ? { shirt: '#943428' } : {}); o.scene.add(people[n].root); }
    const sledge = PROPS.sledge(), bit = PROPS.bitIron(), book = PROPS.book(); o.scene.add(sledge); o.scene.add(bit); o.scene.add(book);
    // the horse mob and the dogs
    const herd = new THREE.Group(); o.scene.add(herd);
    const HC = [['#6E3E22', '#1E1A18'], ['#8A4A26', '#7A4020'], ['#2A2624', '#161412'], ['#8E8A84', '#5A5856'], ['#4E3426', '#1E1A18'], ['#A48058', '#3A2A20'], ['#6A4A3A', '#241E1A'], ['#7A5236', '#2A201A']];
    const horses = [];
    for (let i = 0; i < 30; i++) {
      const [body, mane] = HC[i % HC.length], grey = i % 7 === 3, b = PEOPLE.beast(grey ? 'horse2' : 'horse', body, { scale: .52 + hash(i * 3.7) * .06 });
      const cols = grey ? ['#A6A39C', '#6A6864', '#2A2420', '#7A7874', '#5A5450', '#D0CCC4', '#0E0C0C'] : [body, mixCol(body, '#1A1614', .5), mixCol(body, '#E8D8C0', .2), '#2A2420', mane, mixCol(body, '#1A1614', .3), '#CFC8BC', '#0E0C0C'];
      let k = 0; b.root.traverse(ob => { if (ob.isMesh) { ob.material = P3.mat(cols[k] || body); k++; } });
      b.i = i; herd.add(b.root); horses.push(b);
    }
    const dogs = [];
    for (let i = 0; i < 16; i++) {
      const red = i % 4 === 3, b = PEOPLE.beast('dog', '#2A2420', { scale: .28 + hash(i * 5.1) * .03 });
      const cols = red ? ['#6E3820', '#1A1614', '#B87A44', '#0E0C0C', '#D8CCB8'] : ['#241F1C', '#141210', '#B0703A', '#0E0C0C', '#D8CCB8'];
      let k = 0; b.root.traverse(ob => { if (ob.isMesh) { ob.material = P3.mat(cols[k] || '#241F1C'); k++; } });
      b.i = i; herd.add(b.root); dogs.push(b);
    }
    return { o, st, R, U, E, log, fireLamp, forgeLamp, people, sledge, bit, book, herd, horses, dogs, cam: P3.cam(40) };
  }
  // everything the site shots share, set in every frame (a cached scene remembers the last frame)
  function siteFrame(S, t, o = {}) {
    const L = o.L || GOLD, U = S.U;
    light(S.o, L, o.target || [20, 0, 0]);
    const s = RIG.strokeAt(t), band = -TAU * strokes(t), fly = -TAU * flyTurns(t);
    RIG.pose(S.R, { stroke: s, amp: 1, fly, bandAngle: band, turn: tillerAt(t) });
    U.tiller.position.y -= .95; U.tillerAt = U.tiller.position.toArray();   // clamped lower on the rods, at her chest
    U.crankArm.scale.y = (CRANK_R + .45) / 2.8; U.crankArm.position.y = CRANK_R / 2 - .1;
    S.R.updateMatrixWorld(true);
    const pin = U.band.localToWorld(V(0, CRANK_R, 1.6)), end = U.beamG.localToWorld(V(10.5, -.4, 0));
    U.pitman.position.copy(pin).add(end).multiplyScalar(.5); U.pitman.scale.set(1, pin.distanceTo(end), 1);
    U.pitman.quaternion.setFromUnitVectors(V(0, 1, 0), end.clone().sub(pin).normalize());
    runEngine(U.eng, fly, o.door ?? 0, { blur: o.blur, gov: o.gov ?? lerp(.55, .95, workK(t)) });
    S.st.board.userData.set(Math.round(depthAt(t) / 10) * 10);
    S.log.visible = false; S.sledge.visible = false; S.bit.visible = false; S.book.visible = false;
    for (const p of Object.values(S.people)) p.root.visible = false;
    S.herd.visible = false;
    S.fireLamp.intensity = 0; S.forgeLamp.intensity = 0;
    return { s, band, fly };
  }
  const pose = (S, n, pos, yaw, clip, t, o = {}) => { const p = S.people[n]; p.root.visible = true; PEOPLE.at(p, pos, yaw); PEOPLE.clip(p, clip, t, o); return p; };
  // the crew at their stations while she drills (used in the wide shots)
  function crewAtWork(S, t, who = ['driller', 'bill', 'dresser', 'hand', 'boss']) {
    const U = S.U;
    if (who.includes('driller')) drillerAtRods(S, t);
    if (who.includes('bill')) { const b = pose(S, 'bill', EW(-11.6, 0, -.2), Math.PI / 2 + .15, 'Idle_Loop', t * .9 + 2.1); look(b, EW(-9.6, 6.8, -1.2), .6); }
    if (who.includes('dresser')) {   // at the anvil, dressing a bit with the sledge on the beat
      const an = U.anvil, tgt = [an[0] - .1, an[1] + .35, an[2] + .1], yaw = -Math.PI / 2 - .1, sp = PROPS.swingStand(S.people.dresser, tgt, yaw);
      const d = pose(S, 'dresser', sp, yaw, 'Idle_Loop', t + .4); S.sledge.visible = true; PROPS.swing(d, S.sledge, frac(strokes(t) + .5), { target: tgt });
      S.bit.visible = true; PROPS.at(S.bit, [an[0] - .2, an[1] + .15, an[2] + .1], [0, 0, -Math.PI / 2]);
      S.forgeLamp.intensity = 600 + 120 * Math.sin(t * 13) * Math.sin(t * 7.3);
    }
    if (who.includes('hand')) { const h = pose(S, 'hand', [4.6, U.floorY, -4.6], Math.PI, 'Idle_Loop', t * 1.1 + 1.3); PEOPLE.reach(h, 'r', U.brake, [5.6, 3.4, -4]); }
    if (who.includes('boss')) { const b = pose(S, 'boss', [-5.2, 0, 12.4], Math.PI + .6, 'Idle_Loop', t * .8 + .7); S.book.visible = true; const hd = PEOPLE.hand(b, 'r'); PROPS.place(S.book, hd, [hd.x - .3, hd.y + 1, hd.z - .4]); look(b, [-7.6, 7.4, 8.2], .7); }
  }
  // the driller at the temper screw: right hand on the tiller, left hand on the rods, feeling the blow come up the wood
  function drillerAtRods(S, t, o = {}) {
    const U = S.U, ty = U.tillerAt[1];
    const d = pose(S, 'driller', [1.58, U.floorY, 1.22], -Math.PI / 2 - .66, 'Idle_Loop', t * .7 + .3);
    PEOPLE.turn(d, 'spine_02', [.12 + .05 * blowK(t, 6), 0, 0]);
    const th = tillerAt(t), dir = [Math.cos(th), -Math.sin(th)], sg = dir[0] * .79 + dir[1] * .61 > 0 ? 1 : -1;   // the bar's end on her side
    PEOPLE.reach(d, 'r', [sg * dir[0] * 1.15, ty + .05, sg * dir[1] * 1.15], [2.3, ty - 1.2, 2.2]);
    PEOPLE.reach(d, 'l', [.25, ty + .75, .17], [1.2, ty - .4, -1.0]);
    look(d, o.lookAt || [0, ty + .3, 0], .8);
    PEOPLE.turn(d, 'Head', [.07 * blowK(t, 7), 0, 0]);      // the blow comes up the wood: a small dip of the head on each one
    return d;
  }
  // 2D atmosphere for the site: stack smoke drifting west over the beam, a steam feather, a dust puff at the casing head
  function siteAir(cam, S, t, L, o = {}) {
    const U = S.U, f = focal(cam), wind = V(-8.5, 0, 4.2), top = V(...U.stackTop), col = L === DUSK ? '#6E5A58' : '#7E7670';
    // a thin steady stream, and a denser puff thrown up with each stroke, drifting west over the beam
    for (let i = 0; i < 8; i++) {
      const q = frac(t * .2 + i / 8), p = top.clone().add(wind.clone().multiplyScalar(q * 3)).add(V(0, q * 17 + q * q * 8, 0));
      const [sx, sy, d] = P3.project(cam, A(p)); if (d < 2) continue;
      seed('smk' + i); psmoke(sx, sy, (2 + q * 10) * f / d, col, .32 * (1 - q) * (o.smoke ?? 1) * (1 + .35 * workK(t)));
    }
    const n = Math.floor(strokes(t));
    for (let j = 0; j < 6; j++) {
      const age = (strokes(t) - (n - j)) * 2 * BEAT, q = age / (6 * 2 * BEAT), sw = hash(n - j);
      const p = top.clone().add(wind.clone().multiplyScalar(q * 2.6)).add(V((sw - .5) * 2, 1 + easeOut(clamp(age / .5)) * 3 + q * 15 + q * q * 6, (sw - .5) * 2));
      const [sx, sy, d] = P3.project(cam, A(p)); if (d < 2) continue;
      seed('puff' + ((n - j) % 97)); psmoke(sx, sy, (1.8 + 2.2 * easeOut(clamp(age / .6)) + q * 9) * (1 + .25 * workK(t)) * f / d, col, .55 * (1 - q) * (o.smoke ?? 1) * (1 + .3 * workK(t)));
    }
    const vp = U.eng.localToWorld(V(-5.9, 8.8, -1.1));
    for (let i = 0; i < 4; i++) { const q = frac(t * .9 + i / 4), p = vp.clone().add(V(-q * 3, q * 5, q * 1.5)), [sx, sy, d] = P3.project(cam, A(p)); if (d > 2) { seed('stm' + i); psmoke(sx, sy, (.6 + q * 2.5) * f / d, AP.paperLt, .55 * (1 - q)); } }
    const hit = blowK(t, 10); if (hit > .06 && o.puff !== false) { const [hx, hy, d] = P3.project(cam, U.hole); if (d > 2) { seed('puff'); psmoke(hx, hy, (1 + 2 * (1 - hit)) * f / d, AP.dust, .5 * hit); } }
  }
  // the station's horse mob on the gallop east across the plain, the dogs at their heels (a pure function of t)
  const HV = 22, HT = 100.8, HZ = 104;
  function herdAt(S, t, o = {}) {
    S.herd.visible = true;
    for (const b of S.horses) {
      const i = b.i, dx = -hash(i * 1.7) * 64 - (i % 3) * 1.5, dz = (hash(i * 2.9) - .5) * 2 * (7 + 7 * -dx / 64), v = HV * (1 + (hash(i * 4.1) - .5) * .05);
      const x = 20 + dx + v * (t - HT), z = HZ + dz + 1.8 * Math.sin(t * .8 + i * 1.3);
      PEOPLE.at(b, [x, 0, z], Math.PI / 2 + .06 * Math.cos(t * .8 + i * 1.3)); PEOPLE.clip(b, 'Gallop', t * 1.3 + hash(i * 6.3) * .6);
      b.pos = [x, 0, z];
    }
    for (const b of S.dogs) {
      // at the heels of the mob and out on its near flank, weaving a little as they work it
      const i = b.i, dx = -58 - hash(i * 3.1) * 26, dz = -4 + hash(i * 1.3) * 22, wv = Math.sin(t * 1.7 + i * 2.1);
      const x = 20 + dx + HV * (t - HT) + 3 * wv, z = HZ + dz + 2.2 * Math.sin(t * 1.1 + i);
      PEOPLE.at(b, [x, 0, z], Math.PI / 2 - .08 * wv * (i % 2 ? 1 : -1)); PEOPLE.clip(b, 'Gallop', t * 2.1 + hash(i * 8.1) * .5);
      for (const [n, a] of [['Tail1', -.9], ['Tail2', -.35], ['Tail3', -.2]]) if (b.bones[n]) PEOPLE.turn(b, n, [a, 0, 0]);
      b.pos = [x, 0, z];
    }
  }
  function herdDust(cam, S, t, k = 1, o = {}) {   // dust kicked up behind the hooves and paws, low to the ground
    const f = focal(cam), list = (o.horses === false ? [] : S.horses.filter(b => b.i % 2 === 0)).concat(o.dogs === false ? [] : S.dogs);
    for (const b of list) {
      const big = b.kind !== 'dog';
      for (let j = 0; j < 2; j++) {
        const q = frac(t * 1.5 + hash(b.i * 3 + j + (big ? 0 : 50))), p = [b.pos[0] - (big ? 4 : 1.5) - q * (big ? 14 : 6), (big ? .3 : .15) + q * (big ? 2.4 : 1), b.pos[2] + (hash(b.i + j) - .5) * (big ? 3 : 1.5)];
        const [sx, sy, d] = P3.project(cam, p); if (d < 2) continue;
        seed('dust' + b.i + j + (big ? 'h' : 'd')); psmoke(sx, sy, (big ? 1.6 : .6) * (1 + q * 2) * f / d, '#D6B284', (big ? .24 : .2) * (1 - q) * k);
      }
    }
  }


  // =====================================================================================================================
  // SET 2: the erecting shop in Glasgow (memory): brick walls with tall arched windows, iron roof trusses, a travelling
  // crane, a countershaft belted down to the new engine on its test bed. Cool greys; the brass plate the one warm note.
  const SHOP_L = [.25, .34, .9], BED = .4;
  function brickTex() {
    const cv = document.createElement('canvas'); cv.width = cv.height = 512; const c = cv.getContext('2d'), rnd = lcg(5);
    c.fillStyle = '#B4B2AE'; c.fillRect(0, 0, 512, 512);
    for (let r = 0; r < 32; r++) for (let i = -1; i < 12; i++) { const x = i * 48 + (r % 2) * 24, v = rnd(); c.fillStyle = mixCol('#8E8A88', '#7C7E84', v); c.fillRect(x + 1.5, r * 16 + 1.5, 45, 13); }
    for (let i = 0; i < 40; i++) { const x = rnd() * 512, g = c.createLinearGradient(x, 0, x + 30, 0); g.addColorStop(0, 'rgba(40,40,46,0)'); g.addColorStop(.5, `rgba(40,40,46,${.12 * rnd()})`); g.addColorStop(1, 'rgba(40,40,46,0)'); c.fillStyle = g; c.fillRect(x, 0, 30, 512); }
    const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / 8, 1 / 8); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function archWall(len, hgt, thick, wins) {
    const s = new THREE.Shape(); s.moveTo(-len / 2, 0); s.lineTo(len / 2, 0); s.lineTo(len / 2, hgt); s.lineTo(-len / 2, hgt); s.lineTo(-len / 2, 0);
    for (const [cx, y0, y1, r] of wins) { const h = new THREE.Path(); h.moveTo(cx - r, y0); h.lineTo(cx + r, y0); h.lineTo(cx + r, y1); h.absarc(cx, y1, r, 0, Math.PI, false); h.lineTo(cx - r, y0); s.holes.push(h); }
    return new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: false, curveSegments: 12 });
  }
  function greyify(obj, sat = .15, lit = 1) {
    const hsl = {}; obj.traverse(ob => { if (!ob.isMesh) return; for (const m of (Array.isArray(ob.material) ? ob.material : [ob.material])) { if (m.map) continue; const c = m.color.clone(); c.getHSL(hsl); c.setHSL(lerp(hsl.h, .6, .6), hsl.s * sat, Math.min(.8, hsl.l * lit)); m.color.copy(c); if (m.userData.albedo) m.userData.albedo.copy(c); } });
  }
  function buildShop() {
    const o = P3.scene({ sunDir: SHOP_L.map(v => v * 300), sun: 2.6, fill: .8, shadowSize: 80 });
    o.sun.color.set('#E4EAF0'); o.fill.color.set('#C6CCD4'); o.fill.groundColor.set('#4E5258');
    o.sun.shadow.camera.far = 1400; o.sun.shadow.camera.updateProjectionMatrix();
    const g = new THREE.Group(); o.scene.add(g);
    const add = (m, p, par = g) => { if (p) m.position.set(...p); par.add(m); return m; };
    const IRON = '#3C4046', STONE = '#7A7A7C';
    // floor of stone flags
    const floor = add(P3.mesh(new THREE.PlaneGeometry(200, 90).rotateX(-Math.PI / 2), STONE, { style: .8 })); floor.castShadow = false;
    for (let i = 0; i < 20; i++) { const j = add(P3.mesh(P3.box(200, .02, .08), '#5E5E62', { cast: false }), [0, .02, -28 + i * 3]); }
    // long walls with tall arched windows (glazing bars in iron), and the end walls
    const bt = brickTex(), brick = P3.mat('#ffffff'); brick.map = bt;
    const wins = []; for (let k = -8; k <= 6; k++) wins.push([10.8 + 12 * k, 4.5, 16, 3.3]);
    for (const [z0, sd] of [[-32, -1], [30, 1]]) {
      const w = add(P3.mesh(archWall(172, 30, 2, wins), '#ffffff', { material: brick }), [0, 0, z0]);
      for (const [cx, y0, y1, r] of wins) {
        const zz = z0 + 1;
        for (const dx of [-1.1, 1.1]) add(P3.mesh(P3.box(.16, y1 - y0 + r * .9, .16), IRON), [cx + dx, (y0 + y1 + r * .9) / 2, zz]);
        for (const yy of [y0 + (y1 - y0) / 3, y0 + (y1 - y0) * 2 / 3, y1]) add(P3.mesh(P3.box(2 * r, .16, .16), IRON), [cx, yy, zz]);
      }
    }
    for (const x of [-86, 86]) { const e = add(P3.mesh(archWall(64, 30, 2, x < 0 ? [[0, 0, 13, 7]] : []), '#ffffff', { material: brick }), [x + (x < 0 ? -1 : 1), 0, 0]); e.rotation.y = Math.PI / 2; }
    // roof: iron trusses, purlins, dark cladding with a glazed ridge
    const rafterY = z => 30 + 14 * (1 - Math.abs(z) / 30);
    for (let k = -7; k <= 6; k++) {
      const x = -3.2 + 12 * k;
      add(P3.beam([x, 30, -30], [x, 30, 30], .45, .45, IRON));
      for (const sd of [-1, 1]) {
        add(P3.beam([x, 30, sd * 30], [x, 44, 0], .6, .6, IRON));
        for (const zz of [10, 20]) add(P3.beam([x, 30, sd * zz], [x, rafterY(zz), sd * zz], .22, .22, IRON));
        add(P3.beam([x, 30, 0], [x, rafterY(10), sd * 10], .2, .2, IRON)); add(P3.beam([x, 30, sd * 10], [x, rafterY(20), sd * 20], .2, .2, IRON));
      }
      add(P3.beam([x, 30, 0], [x, 44, 0], .28, .28, IRON));
    }
    for (const zz of [-26, -18, -10, -4, 4, 10, 18, 26]) add(P3.beam([-86, rafterY(zz) + .5, zz], [86, rafterY(zz) + .5, zz], .5, .7, IRON));
    for (const sd of [-1, 1]) { const r = add(P3.mesh(P3.box(176, .4, 29), '#46484C'), [0, 38, sd * 17.5]); r.rotation.x = sd * Math.atan2(14, 30); }
    // travelling crane on runways along the walls, its hook hanging near the engine
    for (const z of [-28, 28]) add(P3.mesh(P3.box(172, 1.4, 1), IRON), [0, 23, z]);
    const cx = -17;
    for (const dx of [-1.5, 1.5]) add(P3.mesh(P3.box(1, 2.4, 56), '#4A4E54'), [cx + dx, 24.6, 0]);
    for (const z of [-27.5, 27.5]) add(P3.mesh(P3.box(5, 1.4, 1.8), IRON), [cx, 24.2, z]);
    add(P3.mesh(P3.box(4.2, 1.6, 3.4), IRON), [cx, 26.4, 4]);
    for (const dx of [-.35, .35]) add(P3.beam([cx + dx, 25.6, 4], [cx + dx * .4, 13.4, 4], .12, .12, '#2E3034'));
    add(P3.mesh(P3.box(1, 1.3, .7), IRON), [cx, 12.8, 4]);
    const hook = add(P3.mesh(new THREE.TorusGeometry(.45, .12, 6, 14, Math.PI * 1.4), IRON), [cx, 11.7, 4]); hook.rotation.z = -.6;
    // the new engine on its test bed, belted up to the countershaft
    const R2 = RIG.build(), eng = R2.userData.eng, fly = R2.userData.fly; R2.remove(eng); eng.rotation.y = 0; eng.position.set(0, BED, 0); g.add(eng);
    const E = dressEngine(eng, fly, { dusty: false });
    greyify(eng, .22, 1.35);
    for (const x of [-5.5, 5]) add(P3.mesh(P3.box(1.6, BED, 8), '#5E5A56'), [x, BED / 2, 0]);
    add(P3.mesh(P3.box(22, .2, 10), '#5A5A5C'), [0, .1, 0]);
    const shaftY = 27, pul = [-3.2, shaftY, 2.9];
    add(P3.mesh(P3.cyl(.2, .2, 56, 10).rotateX(Math.PI / 2), IRON), [-3.2, shaftY, 0]);
    for (const zz of [-20, -10, 10, 20]) add(P3.mesh(P3.box(.18, 3, .18), IRON), [-3.2, shaftY + 1.5, zz]);
    const pulley = add(new THREE.Group(), pul); pulley.add(P3.mesh(new THREE.TorusGeometry(2.2, .2, 8, 32), IRON)); for (let i = 0; i < 6; i++) { const sp = P3.mesh(P3.box(.16, 4.4, .12), IRON); sp.rotation.z = i / 6 * Math.PI; pulley.add(sp); }
    const flyC = [-3.2, 9.2 + BED, 2.9];
    for (const sd of [-1, 1]) add(P3.beam([flyC[0] + sd * 3.1, flyC[1], 3.05], [pul[0] + sd * 2.2, pul[1], 3.05], .08, .8, '#2C2A28'));
    // the rest of the shop: a boiler shell on trestles, spare flywheels against the wall, a bench, wheels, plates
    const shell = add(P3.mesh(P3.cyl(2.4, 2.4, 11, 24).rotateZ(Math.PI / 2), '#5C636C'), [27, 4.3, -13]);
    for (const x of [23, 31]) for (const sd of [-1, 1]) add(P3.beam([x, 0, -13 + sd * 1.8], [x, 2.2, -13], .3, .3, '#5A5652'));
    for (const [x, lean] of [[-31, .12], [-25.5, -.1]]) { const fw = add(new THREE.Group(), [x, 3.3, -29.4]); fw.rotation.x = lean; fw.add(P3.mesh(new THREE.TorusGeometry(3.1, .32, 8, 36), IRON)); for (let i = 0; i < 6; i++) { const sp = P3.mesh(P3.box(.25, 6.1, .2), IRON); sp.rotation.z = i / 6 * Math.PI; fw.add(sp); } }
    add(P3.mesh(P3.box(16, .5, 3), '#5E5A56'), [-46, 3.2, -28]); for (const x of [-53, -39]) add(P3.mesh(P3.box(.5, 3, 2.4), '#4E4A48'), [x, 1.5, -28]);
    add(P3.mesh(P3.box(.8, 1, .8), IRON), [-44, 4, -28]);
    for (let i = 0; i < 5; i++) { const wh = add(P3.mesh(new THREE.TorusGeometry(2.3, .24, 6, 28), IRON), [36 + i * .5, .3 + i * .5, 16]); wh.rotation.x = Math.PI / 2; }
    for (let i = 0; i < 6; i++) add(P3.mesh(P3.box(7, .3, 4.5), '#5A5E64'), [44, .15 + i * .3, -6 + (hash(i) - .5) * .4]);
    // the engineer (a Glasgow fitter: grey shirt, dark leather apron, cap) and an apprentice at the bench
    // (built from the squatter's entry for the man_beard model, then fully re-dressed: dark whiskers, cap, apron)
    const eg = PEOPLE.make('squatter', { model: 'man_beard', skin: '#BCA79C', shirt: '#D4D6D8', trousers: '#44484E', boots: '#2A2A2E', hair: '#3E3A38', beard: '#3E3A38', brows: '#34302E', hat: 'cap', hatCol: '#3A3E44', build: 1.02, height: 1.05 });
    eg.root.updateMatrixWorld(true);
    const apron = P3.mesh(P3.box(1.3, 2.2, .05), '#34363A'); apron.position.set(0, 2.55, .47); g.add(apron); eg.bones.pelvis.attach(apron);
    o.scene.add(eg.root);
    const ap = PEOPLE.make('lab', { skin: '#AEA096', shirt: '#9EA2A8', trousers: '#4A4E54', hatCol: '#5A5E64', hat: 'cap' }); o.scene.add(ap.root);
    const watch = PROPS.watch(); o.scene.add(watch); const cloth = rag(); o.scene.add(cloth);
    return { o, g, eng, E, eg, ap, watch, cloth, flyC, pulley, cam: P3.cam(40) };
  }
  const SHOP_SKY = ['#8E98A2', '#CDD1D4'], SHOP_FOG = '#BCC2C8', SHOP_INK = '#2E3238';
  function shopFrame(S, t, o = {}) {
    const fly = -TAU * flyTurns(t) * .8;
    runEngine(S.eng, fly, 0, { gov: .7 });
    S.pulley.rotation.z = fly * 3.1 / 2.2;                  // the countershaft pulley, belted up from her flywheel
    if (!o.keepPlate) S.E.plate.userData.paint((c, w, h) => paintPlate(c, w, h, false, -.1), 0);
    S.watch.visible = false; S.cloth.visible = false;
    S.ap.root.visible = true; PEOPLE.at(S.ap, [-45, 0, -25.8], Math.PI); PEOPLE.clip(S.ap, 'Interact', t * .7 + 1);
    return fly;
  }
  // the engineer beside the barrel, facing along her to the flywheel: right palm flat on the boiler (a rag under it),
  // his watch in the left hand
  const ENG_AT = [4.15, 0, 4.25];
  function engineerListening(S, t, o = {}) {
    const p = S.eg; PEOPLE.at(p, o.pos || ENG_AT, -Math.PI / 2 + (o.yaw ?? .12)); PEOPLE.clip(p, 'Idle_Loop', t * .6 + 3);
    PEOPLE.turn(p, 'spine_02', [.08, .1, 0]);
    const palm = mix3([3.5, 4.55, 2.05], [2.25, 5.0, 2.36], ease(o.palmTo ?? 0));
    PEOPLE.reach(p, 'r', palm, [4.6, 3.4, 2.9]);
    const w = ease(o.watch ?? 1), wp = mix3([3.95, 3.1, 4.55], [3.45, 3.97, 4.85], w);
    PEOPLE.reach(p, 'l', wp, [4.9, 3.0, 5.6]);
    S.watch.visible = true; const hl = PEOPLE.hand(p, 'l'); PROPS.at(S.watch, [hl.x - .05, hl.y + .1, hl.z + .05], [-.5, .2, 0]);
    S.cloth.visible = true; const hr = PEOPLE.hand(p, 'r'); PROPS.at(S.cloth, [hr.x - .02, hr.y - .06, hr.z - .1], [.2, .3, .1]);
    return p;
  }
  // 2D: shafts of window light through the dust, and motes turning in them
  function shopAir(cam, t, k = 1) {
    const L = V(...SHOP_L).normalize();
    for (let w = -1; w <= 1; w++) {
      const cx = 10.8 + 12 * w, corners = [[cx - 3.3, 4.5], [cx + 3.3, 4.5], [cx + 3.3, 19], [cx - 3.3, 19]].map(([x, y]) => V(x, y, 30));
      const pts = []; for (const c of corners) { const F = c.clone().sub(L.clone().multiplyScalar(c.y / L.y)); pts.push(F);
        for (const s of [.9, .75, .6, .45, .3, .15]) { const q = F.clone().lerp(c, s); if (P3.project(cam, A(q))[2] > 2) { pts.push(q); break; } } }
      const P = pts.map(p => P3.project(cam, A(p))); if (P.some(q => q[2] < 1) || P.length < 5) continue;
      const hull = convexHull(P.map(q => [q[0], q[1]]));
      seed('shaft' + w); ptone(hull, '#EEF2F4', .06 * k); plit(hull, .07 * k, '#F4F6F6', { kind: 'v' });
    }
    for (let i = 0; i < 70; i++) {
      const x = -30 + hash(i * 3.1) * 50, y = 2 + hash(i * 5.3) * 16, z = -6 + hash(i * 7.7) * 26;
      const p = [x + Math.sin(t * .3 + i) * .8, y + ((t * .15 + hash(i)) % 1) * 1.5, z + Math.cos(t * .23 + i) * .8], [sx, sy, d] = P3.project(cam, p);
      if (d < 1 || d > 60) continue; const r = Math.max(1.2, 4.5 / d * 10); seed('mote' + i); pglow(sx, sy, r * 2.2, '#F4F4EE', .25 * k * (hash(i * 9) > .5 ? 1 : .6));
    }
  }
  function convexHull(P) {
    const pts = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = []; for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  const shopDraw = (S, cam, o = {}) => { sky(...SHOP_SKY, { still: true, hatch: .5 }); P3.draw(S.o, cam, { fog: o.fog || [70, 240], fogCol: SHOP_FOG, ink: SHOP_INK, lightTint: .3, near: o.near ?? .3, lineW: o.lineW ?? 1.5 }); };

  // =====================================================================================================================
  // SET 3: the section (chorus): 1 unit = 10 ft; the bore at x = 0, the front face at z = 0.
  function buildSect() {
    const o = P3.scene({ sunDir: [-120, 60, 125], sun: 2.5, fill: .55, shadowSize: 320 });
    o.sun.color.set('#FFD6A8'); o.fill.color.set('#DCD4CC'); o.sun.shadow.camera.far = 1600; o.sun.shadow.camera.updateProjectionMatrix();
    const S = WORLD.section({ bottom: 4400, w: 160 }); o.scene.add(S);
    const bit = S.userData.bit; bit.material.color.set('#D4D0C6'); bit.material.userData.albedo.set('#D4D0C6'); bit.scale.set(1.45, 1.3, 1.45);
    // the old sea's bones, a little larger and paler than the rock so they read as the camera drifts past
    for (const f of S.userData.fossils.children) {
      f.scale.multiplyScalar(f.children.length > 20 ? 1.35 : 1.6); f.position.z += .25;
      f.traverse(m => { if (m.isMesh) { m.material.color.set('#F0E8D4'); m.material.userData.albedo.set('#F0E8D4'); } });
    }
    return { o, S, cam: P3.cam(36) };
  }
  // All three sets live under one cache key, each built on first use, so this chapter takes one of the three slots
  // P3.cached keeps; H.scene walks all of them, so P3's dispose() can free the entry when it is evicted.
  // Workaround: dispose() throws when it evicts an entry with no .scene (several chapters return { o, ... }). It throws
  // after this entry is stored, so keep a handle on what was built and carry on (the shared fix is in the report).
  let SETS_LAST = null;
  const SETS = () => {
    const build = () => { const H = { parts: {}, get(n, b) { return this.parts[n] || (this.parts[n] = b()); } };
      H.scene = { traverse: f => { for (const q of Object.values(H.parts)) q.o.scene.traverse(f); } }; return (SETS_LAST = H); };
    try { return P3.cached('C-sets', build); } catch (e) { return SETS_LAST || build(); }
  };
  const SITE = () => SETS().get('site', buildSite), SHOP = () => SETS().get('shop', buildShop), SECT = () => SETS().get('sect', buildSect);

  // =====================================================================================================================
  // SHOTS. Each is a pure function of video time t (so a dissolve can draw its neighbour); shots() gets thin wrappers.

  // 1 · 85.83 [18] "Now, our engine's…": her flywheel turning in the late gold light, pushing in to the hub.
  const T1 = C0, T2 = 87.40;
  const FLY_SITE = V(...EW(-3.2, 9.2, 2.9)), FLY_SHOP = V(-3.2, 9.2 + BED, 2.9);
  const flyCam = (F, k) => [F.clone().add(V(lerp(-2.6, -.7, k), lerp(-3.3, -.5, k), lerp(14.5, 6.8, k))), F.clone().add(V(lerp(3.6, .1, k), lerp(1.8, 0, k), lerp(-1.5, 0, k))), lerp(40, 34, k)];
  function drawS1(t) {
    const S = SITE(); siteFrame(S, t, {});
    const k = ease(seg(t, T1, T2 + .35)), [cp, ct, fov] = flyCam(FLY_SITE, k);
    lens(S.cam, fov); P3.look(S.cam, A(cp), A(ct), -.04);
    sky(GOLD.top, GOLD.bot, { still: true });
    P3.draw(S.o, S.cam, { fog: [220, 1600], fogCol: GOLD.fog, lightTint: GOLD.tint, near: .3, lineW: 1.8 });
    flyBlur(S.cam, S.U.fly, 3.1, t, .5);
    siteAir(S.cam, S, t, GOLD, { puff: false });
  }
  function s1(t, lt) {
    drawS1(t);
    if (lt < .35) scribbleWipe(.5 + lt / .7);
    const [hx, hy] = P3.project(SITE().cam, A(FLY_SITE)); if (t > T2 - .35) whirl((t - (T2 - .35)) / .7, hx, hy);
  }

  // 2 · 87.40 [18] "…built in Glasgow": the whirl clears on the same wheel, grey, on a test bed; crane back and up to reveal
  // the erecting shop, the engine running on the bed, the engineer beside her with his palm on the boiler; he lifts his
  // watch as the move settles (the cut lands on it).
  const T3 = 89.35;
  function drawS2(t) {
    const S = SHOP(); shopFrame(S, t); engineerListening(S, t, { watch: seg(t, T3 - .6, T3 - .05) });
    const k = ease(seg(t, T2 - .35, T3 - .1)), [cp, ct, fov] = flyCam(FLY_SHOP, 1);
    const end = [V(-7.5, 11.5, 21.5), V(2.6, 5.8, 0), 44];
    const cam = cp.clone().lerp(end[0], k), tg = ct.clone().lerp(end[1], ease(seg(t, T2, T3 - .4)));
    cam.y += Math.sin(k * Math.PI) * 5;
    lens(S.cam, lerp(fov, end[2], k)); P3.look(S.cam, A(cam), A(tg), lerp(-.04, .02, k));
    shopDraw(S, S.cam);
    shopAir(S.cam, t, seg(t, T2 + .2, T2 + 1.2));
    memoryEdge(seg(t, T2, T2 + .6));
  }
  function s2(t) {
    drawS2(t);
    const [hx, hy] = P3.project(SHOP().cam, A(FLY_SHOP)); if (t < T2 + .35) whirl(.5 + (t - T2) / .7, hx, hy);
  }

  // 3 · 89.35 [18] "…a very canny Scot": close on the engineer, low and three-quarter; watch in hand, palm on the boiler,
  // he listens to her, lifts his eyes to the flywheel, gives one small nod, and reaches for the plate (cut on the reach).
  const T4 = 90.55;
  function drawS3(t) {
    const S = SHOP(); shopFrame(S, t);
    const u = t - T3, p = engineerListening(S, t, { watch: 1, palmTo: seg(u, .92, 1.25) });
    const up = ease(seg(u, .35, .75)), nod = Math.sin(clamp((u - .7) / .35) * Math.PI) * .18;
    look(p, up > 0 ? mix3([3.45, 3.95, 4.85], [-3.2, 9.8, 2.9], up) : [3.45, 3.95, 4.85], 1);
    PEOPLE.turn(p, 'Head', [nod, 0, 0]);
    const hd = PEOPLE.head(p), k = ease(seg(t, T3, T4));
    lens(S.cam, 27); P3.look(S.cam, [lerp(.5, .1, k), lerp(4.4, 4.6, k), lerp(8.3, 7.9, k)], [hd.x - .2, hd.y - .2, hd.z - .3], .015);
    shopDraw(S, S.cam, { near: .2, lineW: 1.7 });
    shopAir(S.cam, t, .8); memoryEdge(1);
  }

  // 4 · 90.55 [19] "And he marked it twenty horse-power": the maker's plate close; his rag wipes it bright left to right.
  const T5 = 92.60;
  const PN = V(0, -Math.sin(PLATE_TILT), Math.cos(PLATE_TILT));
  const PLATE_SHOP = V(PLATE[0], PLATE[1] + BED, PLATE[2]), PLATE_SITE = V(...EW(...PLATE));
  const kPlate = t => ease(seg(t, T4, T5 + .75));
  const plateCam = (P, k) => [P.clone().add(PN.clone().multiplyScalar(lerp(3.7, 3.35, k))).add(V(lerp(-.45, -.3, k), .05, 0)), P.clone().add(V(0, -.1, -.03)), 18];
  function drawS4(t) {
    const S = SHOP(); shopFrame(S, t, { keepPlate: true });
    const u = t - T4, pol = ease(seg(u, .2, 1.35));
    S.E.plate.userData.paint((c, w, h) => paintPlate(c, w, h, false, lerp(-.1, 1.12, pol)), Math.round(pol * 36));
    const p = S.eg; PEOPLE.at(p, [4.25, 0, 3.4], -Math.PI / 2 - .15); PEOPLE.clip(p, 'Idle_Loop', t * .6 + 3);
    PEOPLE.turn(p, 'spine_02', [.22, .18, 0]);
    const out = ease(seg(u, 1.4, 1.9)), inn = 1 - ease(seg(u, 0, .25));
    const rx = lerp(-.62, .58, pol) + .04 * Math.sin(u * 17), ry = .05 * Math.sin(u * 23) + lerp(.06, -.04, pol);
    const cp = PLATE_SHOP.clone().add(V(rx, ry, 0).applyAxisAngle(V(1, 0, 0), PLATE_TILT)).add(PN.clone().multiplyScalar(.05))
      .add(V(1.6, -.6, .5).multiplyScalar(Math.max(out, inn)));
    PEOPLE.reach(p, 'r', A(cp.clone().add(PN.clone().multiplyScalar(.12)).add(V(.1, .02, 0))), [4.6, 3.8, 2.2]);
    PEOPLE.reach(p, 'l', [4.1, 3.0, 4.0], [4.8, 3.4, 4.5]);
    S.cloth.visible = true; S.cloth.position.copy(cp); S.cloth.quaternion.setFromUnitVectors(V(0, 0, 1), PN); S.cloth.rotateZ(.4 * Math.sin(u * 9)); S.cloth.updateMatrixWorld(true);
    look(p, A(PLATE_SHOP), .9);
    const [c0, tg] = plateCam(PLATE_SHOP, kPlate(t));
    lens(S.cam, 18); P3.look(S.cam, A(c0), A(tg), .02);
    shopDraw(S, S.cam, { near: .3, lineW: 1.6, fog: [40, 200] });
    memoryEdge(1);
  }

  // 5 · 92.60 [19] "…but he didn't know what's what": the plate dissolves into itself, dusty, on the working engine; the
  // camera draws back to find her running flat out, governor balls flying, smoke, and Bill at the firebox.
  const T6 = 95.11;
  function drawS5(t) {
    const S = SITE(); siteFrame(S, t, { door: 1, blur: t > T5 + 1.2 });
    billFeeds(S, t, t - T6 + .4); S.fireLamp.intensity = 700 * fireK(t);
    const k = ease(seg(t, T5 + .75, T6 + .1)), [c0, tg0] = plateCam(PLATE_SITE, kPlate(t));
    const c1 = V(...EW(11.5, 8.2, 19.4)), t1 = V(...EW(-5.8, 6.4, -.1));
    const cam = c0.clone().lerp(c1, k); cam.y += Math.sin(k * Math.PI) * 2.2;
    lens(S.cam, lerp(18, 44, ease(seg(t, T5 + .75, T6 - .3)))); P3.look(S.cam, A(cam), A(tg0.clone().lerp(t1, ease(seg(t, T5 + 1.45, T6 + .1)))), lerp(.02, -.02, k));
    sky(GOLD.top, GOLD.bot, { still: true });
    P3.draw(S.o, S.cam, { fog: [220, 1600], fogCol: GOLD.fog, lightTint: GOLD.tint, near: .12, lineW: lerp(1.6, 1.5, k) });
    if (t > T5 + 1.2) flyBlur(S.cam, S.U.fly, 3.1, t, seg(t, T5 + 1.2, T5 + 1.6));
    siteAir(S.cam, S, t, GOLD, { puff: false });
  }
  function s5(t) {
    const [px, py] = (() => { const S = SHOP(), [c0, tg] = plateCam(PLATE_SHOP, 1); lens(S.cam, 18); P3.look(S.cam, A(c0), A(tg), .02); return P3.project(S.cam, A(PLATE_SHOP)); })();
    dissolve(() => drawS4(t), () => drawS5(t), ease(seg(t, T5, T5 + .75)), px, py, .6);
  }

  // 6 · 95.11 [20] "When Canadian Bill is firing with the sun-dried gidgee logs": low, from beside the wood stack; Bill
  // takes a split log, swings it round and drives it into the firebox; the fire jumps.
  const T7 = 97.55;
  function billFeeds(S, t, u) {   // u = seconds into the action
    const b = pose(S, 'bill', EW(-11.65, 0, -.35), Math.PI / 2, 'Idle_Loop', t * .9 + 1.1);
    const pick = ease(seg(u, .15, .7)), lift = ease(seg(u, .75, 1.25)), push = ease(seg(u, 1.25, 1.8)), back = ease(seg(u, 1.8, 2.25));
    const twist = .75 * pick * (1 - lift), bend = .55 * pick * (1 - lift) + .18 * push * (1 - back);
    PEOPLE.turn(b, 'spine_01', [bend * .45, twist * .5, 0]); PEOPLE.turn(b, 'spine_02', [bend * .55, twist * .5, 0]);
    // the log: on the stack → at the waist, aimed at the door → driven in
    const pile = V(...EW(-11.7, 2.25, -3.1)), waist = V(...EW(-11.1, 3.6, -1.0)), mouth = V(...EW(-9.8, 3.75, -.1)), deep = V(...EW(-7.7, 3.8, 0));
    let c = pile.clone(), dir = V(1, 0, 0);
    if (u > .75) { c = pile.clone().lerp(waist, lift); dir = V(1, 0, 0).lerp(mouth.clone().sub(waist).normalize(), lift).normalize(); }
    if (u > 1.25) { c = waist.clone().lerp(mouth, ease(seg(u, 1.25, 1.5))).lerp(deep, ease(seg(u, 1.5, 1.8))); dir = mouth.clone().sub(waist).normalize(); }
    S.log.visible = u < 2.0; S.log.position.copy(c); S.log.quaternion.setFromUnitVectors(V(0, 0, 1), dir); S.log.updateMatrixWorld(true);
    const back1 = c.clone().sub(dir.clone().multiplyScalar(1.1)), mid = c.clone().sub(dir.clone().multiplyScalar(.2));
    const hold = u < 1.8 ? 1 : 1 - back;
    const rest = { l: V(...EW(-11.7, 3.3, -.9)), r: V(...EW(-11.4, 3.3, .2)) };
    const lT = u < .15 ? rest.l : V().lerpVectors(rest.l, mid.clone().add(V(0, .2, 0)), clamp(pick / .8) * hold);
    const rT = u < .15 ? rest.r : V().lerpVectors(rest.r, back1.clone().add(V(0, .1, 0)), clamp(pick / .8) * hold);
    PEOPLE.reach(b, 'l', A(lT), EW(-12.4, 2.6, -2.3)); PEOPLE.reach(b, 'r', A(rT), EW(-12.2, 2.5, 1.5));
    look(b, u < .7 ? A(pile) : u < 1.9 ? A(mouth) : EW(-9.6, 4.2, 0), .9);
    return b;
  }
  function fireK(t) { return 1 + .18 * Math.sin(t * 23) * Math.sin(t * 7.7) + .1 * Math.sin(t * 41 + 1); }
  function drawS6(t) {
    const S = SITE(); siteFrame(S, t, { door: 1 });
    const u = t - T6 + .4; billFeeds(S, t, u);
    const flare = bump(u, 1.6, 1.9, 2.2, 3.2);
    S.fireLamp.intensity = (700 + 900 * flare) * fireK(t);
    const k = ease(seg(t, T6, T7));
    lens(S.cam, 46); P3.look(S.cam, EW(lerp(-13.1, -12.6, k), lerp(2.9, 3.1, k), lerp(-7.3, -6.6, k)), EW(-10.3, lerp(3.9, 4.2, k), -.2), .03);
    sky(GOLD.top, GOLD.bot, { still: true });
    const sp = sunOnScreen(S.cam, GOLD); if (sp) sun(sp[0], sp[1], 42, .15);
    P3.draw(S.o, S.cam, { fog: [220, 1600], fogCol: GOLD.fog, lightTint: .75, near: .3, lineW: 1.7 });
    fireGlow(S, t, 1 + flare, u > 1.6 ? (u - 1.6) : -1);
    siteAir(S.cam, S, t, GOLD, { puff: false });
  }
  // the firebox mouth glowing, heat, and sparks when a log goes in (age of the sparks in s, <0 none)
  function fireGlow(S, t, k, age = -1) {
    const cam = S.cam, m = S.U.eng.localToWorld(V(-9.7, 3.8, 0)), [mx, my, d] = P3.project(cam, A(m)); if (d < .5) return;
    const f = focal(cam), r = 2.4 * f / d;
    seed('fire'); pglow(mx, my, r * 2.2 * k * fireK(t), '#FF9A40', .9); pglow(mx, my, r * .9, '#FFE0A0', .7 * k);
    if (age >= 0 && age < 1.4) for (let i = 0; i < 16; i++) {
      const a = age * (1.1 + hash(i) * .8), p = m.clone().add(V(-a * (1.2 + hash(i * 3) * 2), a * (2 + hash(i * 5) * 5) - a * a * 1.5, (hash(i * 7) - .5) * a * 3));
      const [sx, sy, dd] = P3.project(cam, A(p)); if (dd < .5) continue;
      const [qx, qy] = P3.project(cam, A(p.clone().add(V(.18, -.3, 0)))); seed('spk' + i);
      pline([[sx, sy], [qx, qy]], 1.2, '#FFD27A', { alpha: (1 - age / 1.4) * .9, passes: 1, over: 0 }); pglow(sx, sy, 7, '#FFB050', .6 * (1 - age / 1.4));
    }
  }

  // 7 · 97.55 [20] "…gidgee logs": close on Bill's face in the firelight. He watches the fire take, glances up at the
  // gauge, then swings the door shut (the clang cuts to the horses).
  const T8 = 100.05;
  function drawS7(t) {
    const S = SITE(), u = t - T7, shut = ease(seg(u, 2.2, 2.44)), dark = seg(u, 2.38, 2.44);
    siteFrame(S, t, { door: 1 - shut });
    const b = pose(S, 'bill', EW(-11.55, 0, -.4), Math.PI / 2 + .1, 'Idle_Loop', t * .9 + 1.1);
    PEOPLE.turn(b, 'spine_02', [.08, 0, 0]);
    const gz = ease(seg(u, .9, 1.25)) * (1 - ease(seg(u, 1.75, 2.0)));
    look(b, mix3(EW(-9.5, 3.9, 0), EW(-9.6, 6.9, -1.2), gz), 1);
    const reachK = ease(seg(u, 1.85, 2.2));
    const handle = S.U.eng.userData.dress.hinge.localToWorld(V(-.18, 0, -1.5));
    PEOPLE.reach(b, 'r', A(V(...EW(-11.1, 3.3, .4)).lerp(handle, reachK)), EW(-11.8, 2.9, 1.7));
    PEOPLE.reach(b, 'l', EW(-11.8, 3.2, -1.0), EW(-12.4, 2.6, -1.7));
    S.fireLamp.intensity = lerp(1150 * fireK(t), 40, dark);
    const hd = PEOPLE.head(b), k = ease(seg(t, T7, T8));
    lens(S.cam, 23); P3.look(S.cam, EW(lerp(-8.6, -9.0, k), lerp(4.9, 5.05, k), lerp(-4.0, -3.5, k)), [hd.x + .15, hd.y + .1, hd.z + .1], .02);
    sky(GOLD.top, GOLD.bot, { still: true });
    P3.draw(S.o, S.cam, { fog: [220, 1600], fogCol: GOLD.fog, lightTint: .85, near: .3, lineW: 1.8 });
    if (dark < 1) { fireGlow(S, t, 1 - dark, -1);
      const [fx, fy, fd] = P3.project(S.cam, [hd.x + .35, hd.y - .25, hd.z]); if (fd > .3) { seed('faceglow'); pglow(fx, fy, 3.2 * focal(S.cam) / fd, '#FF8A3A', .32 * (1 - dark) * fireK(t * 1.3)); } }
  }

  // 8 · 100.05 [21] "She can equal thirty horses…": the mob thundering across the plain, low and long, the rig beyond.
  const T9 = 101.54;
  function drawS8(t) {
    const S = SITE(); siteFrame(S, t, { blur: true }); crewAtWork(S, t, ['driller', 'bill']); herdAt(S, t);
    const k = ease(seg(t, T8, T9));
    lens(S.cam, 19); P3.look(S.cam, [lerp(-6, 14, k), 2.6, 178], [lerp(-2, 24, k), 10.5, 58], .01);
    sky(GOLD.top, GOLD.bot, { still: true });
    P3.draw(S.o, S.cam, { fog: [260, 1500], fogCol: GOLD.fog, lightTint: GOLD.tint, lineW: 1.6 });
    herdDust(S.cam, S, t, 1); siteAir(S.cam, S, t, GOLD);
  }

  // 9 · 101.54 [21] (cut on the blow) the engine at full power, low and close from the sunny side: the flywheel a blur
  // throwing the belt, the governor balls flung out, smoke pouring from the stack against the sky.
  const T10 = 102.61;
  function drawS9(t) {
    const S = SITE(); siteFrame(S, t, { blur: true, gov: 1.05 });
    const k = ease(seg(t, T9, T10));
    lens(S.cam, 52); P3.look(S.cam, EW(lerp(1.3, .5, k), lerp(2.0, 2.3, k), lerp(11.4, 11.2, k)), EW(lerp(-1.6, -1.0, k), lerp(10.4, 10.9, k), 1.1), -.07);
    sky(GOLD.top, GOLD.bot, { still: true });
    P3.draw(S.o, S.cam, { fog: [220, 1600], fogCol: GOLD.fog, lightTint: GOLD.tint, near: .3, lineW: 1.9 });
    flyBlur(S.cam, S.U.fly, 3.1, t, 1);
    siteAir(S.cam, S, t, GOLD, { puff: false, smoke: 1.3 });
  }

  // 10 · 102.61 [21] "…and a score or so of dogs": kelpies at the heels of the mob, at their own height, into the sun.
  const T11 = 103.68;
  function drawS10(t) {
    const S = SITE(); siteFrame(S, t, {}); herdAt(S, t);
    const c = [20 - 70 + HV * (t - HT), 0, HZ + 7], k = ease(seg(t, T10, T11));
    lens(S.cam, 38); P3.look(S.cam, [c[0] + lerp(-3, 2, k), 1.1, c[2] + 20], [c[0] + lerp(1, 5, k), 2.4, c[2] - 6], -.03);
    light(S.o, GOLD, [c[0], 0, c[2]], 300);
    sky(GOLD.top, GOLD.bot, { still: true });
    P3.draw(S.o, S.cam, { fog: [200, 1300], fogCol: GOLD.fog, lightTint: .7, near: .3, lineW: 1.6 });
    herdDust(S.cam, S, t, 1, { horses: false });
  }

  // 11 · 103.68 [21]→[22] "So we're bound to get the water deeper down": under the walking beam as the blow lands, then a
  // long crane up and back over the whole plant working in the gold light, crew at their stations, the mob's dust far off.
  const T12 = 108.67;
  function drawS11(t) {
    const S = SITE(); siteFrame(S, t, { blur: true }); crewAtWork(S, t); herdAt(S, t);
    const k = ease(seg(t, T11 + .55, T12 - .2)), k2 = ease(seg(t, T11 + .3, T12 - .6));
    const cam = [V(19.5, 2.2, 7.5), V(40, 24, 50), V(62, 31, 78)], tgt = [V(11, 15.5, -.5), V(15, 13, -2), V(17, 10.5, -3)];
    const cp = k < .5 ? cam[0].clone().lerp(cam[1], k * 2) : cam[1].clone().lerp(cam[2], (k - .5) * 2);
    const tp = k2 < .5 ? tgt[0].clone().lerp(tgt[1], k2 * 2) : tgt[1].clone().lerp(tgt[2], (k2 - .5) * 2);
    lens(S.cam, lerp(52, 38, k)); P3.look(S.cam, A(cp), A(tp), lerp(.05, 0, k));
    sky(GOLD.top, GOLD.bot, { still: true });
    const sp = sunOnScreen(S.cam, GOLD); if (sp) sun(sp[0], sp[1], 55, .25);
    P3.draw(S.o, S.cam, { fog: [240, 1700], fogCol: GOLD.fog, lightTint: GOLD.tint, near: .4, lineW: lerp(1.8, 1.4, k) });
    flyBlur(S.cam, S.U.fly, 3.1, t, lerp(.6, .8, k));
    siteAir(S.cam, S, t, GOLD); herdDust(S.cam, S, t, .8);
  }

  // 12 · 108.67 [23] "Sinking down, deeper down": the day goes; sunset behind the derrick, the beam rocking in silhouette.
  const T13 = 111.07;
  function drawS12(t) {
    const S = SITE(); siteFrame(S, t, { L: DUSK, blur: true }); crewAtWork(S, t, ['driller', 'bill']);
    const k = ease(seg(t, T12 - .5, T13));
    lens(S.cam, 46); P3.look(S.cam, [lerp(63.5, 60.5, k), lerp(2.6, 3.4, k), lerp(-41.5, -39.5, k)], [lerp(-1, 1, k), lerp(20, 21.5, k), 3], .015);
    sky(DUSK.top, DUSK.bot, { still: true });
    const sp = sunOnScreen(S.cam, DUSK); if (sp) lowSun(sp[0], sp[1], 62);
    P3.draw(S.o, S.cam, { fog: [200, 1400], fogCol: DUSK.fog, lightTint: DUSK.tint, lineW: 1.6, ink: '#2A2226' });
    if (sp) { seed('sunglow'); pglow(sp[0], sp[1], 330, '#FFB070', .35); }
    siteAir(S.cam, S, t, DUSK);
  }
  function s12(t) { dissolve(() => drawS11(t), () => drawS12(t), ease(seg(t, T12 - .5, T12 + .35)), W * .5, H * .45, .9); }

  // 13 · 111.07 [24] "Oh we'll sink it deeper down" (cut just ahead of a blow, so it lands in the new shot): the driller's
  // hands on the tiller and the rods in the last light, feeling each blow come up the wood; the camera sinks down the rods
  // to the casing head, and the next shot carries on down the bore.
  const T14 = 113.47;
  function drawS13(t) {
    const S = SITE(); siteFrame(S, t, { L: DUSK, blur: true });
    const d = drillerAtRods(S, t, { lookAt: [0, 7.3, 0] }), hd = PEOPLE.head(d);
    // from the sunny side of the rods, her face and hands in the last light; then down the rods to the casing head
    const k = ease(seg(t, T13 + 1.15, T14 + .05)), fy = S.U.floorY;
    const c0 = V(-3.9, 6.8, .9), c1 = V(-1.7, fy + 3.4, .35), t0 = V(hd.x - .5, hd.y - .45, hd.z - .45), t1 = V(0, fy + 1.0, 0);
    lens(S.cam, lerp(28, 36, k)); P3.look(S.cam, A(c0.lerp(c1, k)), A(t0.lerp(t1, k)), .01);
    sky(DUSK.top, DUSK.bot, { still: true });
    const sp = sunOnScreen(S.cam, DUSK); if (sp) lowSun(sp[0], sp[1], 62);
    P3.draw(S.o, S.cam, { fog: [200, 1400], fogCol: DUSK.fog, lightTint: DUSK.tint, near: .2, lineW: 1.8, ink: '#2A2226' });
  }

  // 14 · 113.47 [25–26] the section: straight down the bore past the red soil, the clays, the grey mudstone and the fossil
  // beds to the bit in the blue-grey mudstone, striking on the beat at 2,100 ft.
  function drawS14(t, lt, dur) {
    const Q = SECT(), sec = Q.S.userData, y = sec.y, depth = depthAt(t);
    sec.set(depth, RIG.strokeAt(t), { casing: 1340 });
    sec.slot.scale.y = (depth + 20) / 4400; sec.slot.position.y = -(depth + 20) * sec.VS / 2;   // the bore ends at the bit (the shared slot runs the full 4,400 ft)
    // out over the cut block, down through the clays and mudstones, in close past the old sea's bones (the ichthyosaur and
    // the ammonites), back out and down through the blue-grey mudstone to the bit, and hold on its blows
    // keys: [t, camera depth (ft), azimuth, distance (units), look x]
    const KS = [[114.3, 150, .85, 200, -6], [115.15, 1170, .72, 150, -6], [115.55, 1285, .5, 64, -12], [116.3, 1440, .4, 60, -2],
      [116.65, 1600, .5, 115, 0], [117.25, depth - 8, .48, 46, 1.5], [118.73, depth, .46, 42, 1.5]];
    const at = i => KS.map(r => [r[0], r[i]]);
    const dC = kf(t, at(1)), az = kf(t, at(2)), dist = kf(t, at(3)), lx = kf(t, at(4)), yc = y(dC), k = seg(t, 114.3, 117.25);
    const dPos = V(Math.sin(az) * dist, yc + lerp(60, 12, k) * dist / 200, Math.cos(az) * dist), dTgt = V(lx, yc - 3, 0);
    // it opens where the last shot left off: straight down the rods at the bore's mouth, then swings out to the cut face
    const w = ease(seg(t, T14, T14 + 1.0)), top = [V(4, 30, 14), V(0, 1, 0)];
    const jolt = blowK(t, 14) * seg(t, 117.3, 117.45), sh = shakeXY(t, .35 * jolt);
    lens(Q.cam, lerp(40, 32, w)); P3.look(Q.cam, A(top[0].clone().lerp(dPos, w)), A(top[1].clone().lerp(dTgt, w).add(V(sh[0], sh[1], 0))), .015);
    sky('#D9A06A', '#EBCB9C', { still: true, hatch: .4 });
    P3.draw(Q.o, Q.cam, { fog: [320, 2600], fogCol: '#E4D5B7', near: 1, far: 5000, lineW: 1.7, hatch: 1.6 });
    // the depth scale beside the bore, chalked at every 500 ft; the bit's depth marked
    const pr = ft => P3.project(Q.cam, [5.5, y(ft), .5]);
    seed('ruler');
    const lo = Math.max(0, Math.floor((dC - 700) / 100) * 100), hi = Math.ceil((dC + 700) / 100) * 100;
    const a0 = pr(lo), a1 = pr(hi); pline([[a0[0], a0[1]], [a1[0], a1[1]]], 1.3, '#EDE6D6', { over: 0, alpha: .8 });
    for (let d = lo; d <= hi; d += 100) { const [x, yy, dd] = pr(d); if (dd < 1 || yy < -40 || yy > 880) continue; const big = d % 500 === 0; pline([[x, yy], [x + (big ? 30 : 14), yy]], big ? 1.4 : .8, '#EDE6D6', { over: 0, passes: 1, alpha: .9 }); if (big && d > 0) label(`${d} FT`, x + 40, yy, 46, '#FBF6EA', { screen: true }); }
    const [bx, by] = P3.project(Q.cam, [0, y(depth) + .2, 1]), [ax, ay] = pr(depth);
    if (ay < 880) pfill([[ax + 6, ay], [ax + 32, ay - 14], [ax + 32, ay + 14]], AP.rust, { tone: .9, sw: 1 });
    const hit = blowK(t, 7), sc = focal(Q.cam) / Q.cam.position.distanceTo(V(0, y(depth), 0)); if (hit > .05 && by < 880) {
      seed('bithit'); pglow(bx, by, (3 + 4 * hit) * sc, '#FFE8C0', .8 * hit); psmoke(bx, by + .4 * sc, (1.4 + 2.6 * (1 - hit)) * sc, '#E6DDCC', .6 * hit);
      for (let i = 0; i < 9; i++) { const a = -Math.PI * (i + .5) / 9, r = (1.2 + 3.6 * (1 - hit)) * sc * (.7 + .5 * hash(i)); pline([[bx + Math.cos(a) * .6 * sc, by + Math.sin(a) * .4 * sc], [bx + Math.cos(a) * r, by + Math.sin(a) * r * .55]], 1.4, '#3E3A34', { alpha: hit, over: 0, passes: 1 }); }
      for (let i = 0; i < 7; i++) { const a = -Math.PI * (.12 + .76 * hash(i * 3.3)), r0 = (.6 + 2.8 * (1 - hit)) * sc, r1 = r0 + .9 * sc; pline([[bx + Math.cos(a) * r0, by + Math.sin(a) * r0 * .6], [bx + Math.cos(a) * r1, by + Math.sin(a) * r1 * .6]], 1.6, '#FFF2D0', { alpha: hit * .9, over: 0, passes: 1 }); } }
    if (lt > dur - .35) scribbleWipe((lt - (dur - .35)) / .7);
  }

  shots([
    [T1, s1], [T2, s2], [T3, t => drawS3(t)], [T4, t => drawS4(t)], [T5, s5], [T6, t => drawS6(t)], [T7, t => drawS7(t)],
    [T8, t => drawS8(t)], [T9, t => drawS9(t)], [T10, t => drawS10(t)], [T11, t => drawS11(t)], [T12 - .5, s12],
    [T13, t => drawS13(t)], [T14, drawS14],
  ]);
})();
