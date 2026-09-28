// Chapter B (v2) · 51.30–85.83 s · A thousand feet (verse 2 = lyric lines 9–13, chorus 2 = lines 14–17).
// See docs/artesian/STORYBOARD.md, RESEARCH.md and BRIEF.md.
//
// The "devil" verse played straight: deeper is hotter and harder, and the only hell on screen is the forge.
// Hazy afternoon at the rig, dusk at the forge; the section runs from a thousand feet to ~1,400.
//
//  shot  video s        line     what                                             camera                           out
//  S1    51.30–53.46    [9]      section: the bit plugging at 1,000 ft            3/4 from above, slow push        crane up the bore
//  S2    53.46–55.57    [9]      the 20-ft bailer comes up, dumps grey slurry     low by the sludge box, tilts up  steam lifts to the sky
//  S3a   55.57–57.50    [10]     the boss glares up at the empty sky              low, under his chin              cut on the look
//  S3b   57.50–59.91    [10]     he looks down the hole and grips the collar      over the shoulder, dives in      hatching iris
//  S4a   59.91–62.02    [11]     section: down the rods to the knocking bit       descending 3/4                   cut on the blow
//  S4b   62.02–65.13    [11]     the rock below darkens toward red, blow by blow  from below, looking up           match cut on the red glow
//  S5    65.13–66.60    [12]     dusk: the dresser draws a white-hot bit          across the coals, low            cut on action
//  S6    66.60–69.90    [12]     dressed on the anvil, sparks on the beat         low, sledge against the sunset   whip pan
//  S7    69.90–71.90    [13]     quenched: steam boils up under the shed roof     low side, tub in front           steam wipe
//  S8    71.90–73.77    [13]     he carries it back to the rig                    tracking behind him              cut on the downbeat
//  C1    73.77–75.76    [14]     the rig at dusk, the beam drops on the beat      under the beam, looking up       match cut on the drop
//  C2    75.76–78.04    [15]     the forge keeps time with the rig                high 3/4 over the anvil          cut on the blow
//  C3    78.04–80.18    [16]     the driller feels each blow come up the rods     down from the derrick            page turn
//  C4    80.18–85.83    [16–17]  section: down through the fossil beds to 1,400   descending 3/4, raking light     scribble wipe
//
// Research notes followed here (RESEARCH.md): the bailer is a 20-ft wrought-iron tube dumped by standing it on its
// valve stem (PROPS.bailer is lengthened to suit); the chisel bit is 3 ft 4 in (a local model, drawn from the forge,
// dressed with a two-handed sledge while the labourer holds it in blacksmith's tongs, then quenched at the edge).
(() => {
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const v3 = a => (a.isVector3 ? a.clone() : V(...a));
  const FY = 2.2;                                                   // derrick floor
  const since = t => frac(bpOf(t) / 2) * 2 * BEAT;                  // seconds since the last blow (blows land on even beats)
  const hitK = (t, k = 9) => Math.exp(-since(t) * k);              // 1 on each blow, decaying
  const blowAt = n => OFF + n * 2 * BEAT;                           // time of blow n
  const blowN = t => Math.floor(bpOf(t) / 2 + 1e-6);                // index of the last blow
  const WIND = [3.2, 0, 1.6];                                       // ft/s, carries smoke and steam
  const GRIME = { dresser: { shirt: '#CDC1A6' }, driller: { shirt: '#7A5F48' }, bill: { shirt: '#94362A' }, boss: { shirt: '#E0D4BC' }, hand: { shirt: '#62707C' }, lab: { shirt: '#A47A4A' } };
  const pxPerFt = (cam, d) => (H / 2) / (Math.max(.3, d) * Math.tan(cam.fov * Math.PI / 360));
  // a pool of light: the frame darkens (graphite tone and hatching) away from (x, y)
  function spot(x, y, r, a = .5, col = '#2A2420') {
    if (a <= 0) return;
    const g = X.createRadialGradient(x, y, r * .35, x, y, r * 1.6), c = color(col), rgb = `${red(c)},${green(c)},${blue(c)}`;
    g.addColorStop(0, `rgba(${rgb},0)`); g.addColorStop(1, `rgba(${rgb},${a})`);
    X.save(); X.fillStyle = g; X.fillRect(-40, -40, W + 80, H + 80); X.restore();
  }

  // ---------- light and sky ----------
  // One sun azimuth for the chapter (from -z); it drops from hazy afternoon to dusk between the section and the forge.
  const TOD = {
    aft: { dir: [-32, 56, -74], sun: 2.5, sunCol: '#FFF1D8', fill: .5, fillSky: '#FFFFFF', fillGnd: '#8A6A48', top: '#C9AE84', low: '#F0DEB6', away: '#E6DCC4', tint: .55 },
    dusk: { dir: [-24, 6.5, -95], sun: 1.25, sunCol: '#FF9458', fill: .26, fillSky: '#B8BCD6', fillGnd: '#46382E', top: '#4A4C6C', low: '#E4863F', away: '#9C7482', tint: .8, hatch: .55 },
  };
  function lightOn(o, L, tgt = [0, 0, 0], k = 1) {
    o.sun.target.position.set(...tgt); o.sun.target.updateMatrixWorld();
    o.sun.position.set(tgt[0] + L.dir[0], tgt[1] + L.dir[1], tgt[2] + L.dir[2]);
    o.sun.color.set(L.sunCol); o.sun.intensity = L.sun * k;
    o.fill.intensity = L.fill; o.fill.color.set(L.fillSky); o.fill.groundColor.set(L.fillGnd);
  }
  // Sky in two pencil bands that keep to the true horizon for this camera; warmer toward the sun. Returns the horizon
  // colour (use it for fog) and draws the sun (afternoon) or the afterglow (dusk).
  function skyFor(cam, L, o = {}) {
    const f = V(0, 0, 0); cam.getWorldDirection(f);
    const n = Math.hypot(f.x, f.z) || 1, fx = f.x / n, fz = f.z / n;
    const hy = P3.project(cam, [cam.position.x + fx * 4000, 0, cam.position.z + fz * 4000])[1];
    const sn = Math.hypot(L.dir[0], L.dir[2]), face = clamp((fx * L.dir[0] + fz * L.dir[2]) / sn * .5 + .5);
    const low = mixCol(L.away, L.low, Math.pow(face, 1.6));
    seed('Bsky');
    const span = o.span ?? 1150, g = X.createLinearGradient(0, hy - span, 0, hy + 30);
    g.addColorStop(0, L.top); g.addColorStop(.62, mixCol(L.top, low, .7)); g.addColorStop(1, low);
    X.save(); X.globalAlpha = .64; X.fillStyle = g; X.fillRect(-80, -80, W + 160, H + 160); X.restore();
    const hk = (o.hatch ?? 1) * (L.hatch ?? 1);
    for (let i = 0; i < 4; i++) pshade(rectPts(-80, -80, W + 160, Math.max(60, hy - span * (.62 - i * .12) + 80)), L.top, .16 * hk, { still: true });
    pshade(rectPts(-80, -80, W + 160, H + 160), low, .3 * hk, { still: true, kind: 'v' });
    const dn = Math.hypot(...L.dir), sp = [cam.position.x + L.dir[0] / dn * 3000, cam.position.y + L.dir[1] / dn * 3000, cam.position.z + L.dir[2] / dn * 3000];
    const [sx, sy, sd] = P3.project(cam, sp);
    if (sd > 0 && sx > -600 && sx < W + 600 && sy > -600 && sy < H + 400) {
      if (L === TOD.aft) sun(sx, sy, o.sunR ?? 46, o.heat ?? .55);
      else { seed('Bglow'); pglow(sx, Math.max(sy, hy - 10), 520, '#FF9A4A', .75); pglow(sx, Math.max(sy, hy - 10), 170, '#FFD08A', .6); }
    }
    return { hy, low, face };
  }
  // shadows only in the lit pass (P3.draw renders beauty, albedo and normals, and three.js would redo the maps each time)
  function draw3(o, cam, opt) {
    const R = P3.renderer(), sm = R && R.shadowMap;
    if (sm) { sm.autoUpdate = false; sm.needsUpdate = true; }
    P3.draw(o, cam, opt);
    if (sm) sm.autoUpdate = true;
  }
  const look = (cam, fov, p, tg, roll = 0) => { if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); } P3.look(cam, p, tg, roll); };

  // ---------- small helpers ----------
  function setBeam(m, a, b, w) {
    const A = v3(a), B2 = v3(b), L = Math.max(.01, A.distanceTo(B2));
    m.position.copy(A).add(B2).multiplyScalar(.5); m.scale.set(w, L, w);
    m.quaternion.setFromUnitVectors(V(0, 1, 0), B2.clone().sub(A).normalize()); m.updateMatrixWorld(true);
  }
  // place a prop so local +y runs along ydir and local +x as near xdir as it can
  function orient(obj, p, ydir, xdir) {
    const y = v3(ydir).normalize(), x = v3(xdir); x.sub(y.clone().multiplyScalar(x.dot(y))).normalize();
    const z = V(0, 0, 0).crossVectors(x, y);
    obj.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z)); obj.position.copy(v3(p)); obj.updateMatrixWorld(true);
  }
  function show(p, pos, yaw, clip, t, o = {}) { p.root.visible = true; PEOPLE.at(p, pos, yaw); PEOPLE.clip(p, clip, t, o); return p; }
  // curl the fingers toward the palm (a grip); the left hand's bones are mirrored, so it curls about -z
  function fist(p, s, k = 1) {
    if (k <= 0) return;
    const sg = s === 'l' ? -1 : 1;
    for (const f of ['index', 'middle', 'ring', 'pinky']) for (const j of ['01', '02', '03']) PEOPLE.turn(p, `${f}_${j}_${s}`, [0, 0, sg * 1.05 * k * (j === '01' ? .8 : 1)]);
    PEOPLE.turn(p, `thumb_02_${s}`, [0, 0, sg * .5 * k]);
  }
  const hand = (p, s) => PEOPLE.hand(p, s).toArray();
  const lerp3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
  const add3 = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
  const nrm = a => { const l = Math.hypot(...a) || 1; return a.map(v => v / l); };

  // heat ramp for iron: cold → dull red → orange → yellow → white
  const HEATC = [[0, '#4A4744'], [.2, '#6E2E1E'], [.4, '#B8401C'], [.6, '#EC7A2A'], [.8, '#FFC25A'], [1, '#FFF4DA']];
  function heatCol(h) { h = clamp(h); for (let i = 1; i < HEATC.length; i++) if (h <= HEATC[i][0]) { const [a, ca] = HEATC[i - 1], [b, cb] = HEATC[i]; return mixCol(ca, cb, (h - a) / (b - a)); } return HEATC[HEATC.length - 1][1]; }

  // ---------- local props ----------
  // The chisel: 3 ft 4 in of steel (Cox 1895: "3ft. 4in. long, weighing 140lb"): taper pin, collar, square shank and a
  // flared blade ground to an edge. Local +y runs from the pin (y 0) to the cutting edge (y 3.33); the blade is wide in x.
  function chiselBit() {
    const G = new THREE.Group(), iron = '#4E4A46', hot = P3.mat(iron, {});
    const pin = P3.mesh(P3.cyl(.2, .12, .45, 12), iron); pin.position.y = .225; G.add(pin);
    const col = P3.mesh(P3.cyl(.3, .3, .2, 14), iron); col.position.y = .55; G.add(col);
    const shank = P3.mesh(P3.box(.4, 1.3, .4), iron, { material: hot }); shank.position.y = 1.3; G.add(shank);
    const bg = P3.box(1, 1.38, 1), pos = bg.attributes.position;
    for (let i = 0; i < pos.count; i++) { const up = pos.getY(i) > 0; pos.setX(i, Math.sign(pos.getX(i)) * (up ? .36 : .2)); pos.setZ(i, Math.sign(pos.getZ(i)) * (up ? .035 : .2)); }
    bg.computeVertexNormals();
    const blade = P3.mesh(bg, iron, { material: hot }); blade.position.y = 2.64; G.add(blade);
    G.userData = { hot, len: 3.33 };
    return G;
  }
  function bitHeat(bit, h) {
    const m = bit.userData.hot; m.color.set(heatCol(h)); m.userData.albedo.copy(m.color);
    m.emissive = m.emissive || new THREE.Color(); m.emissive.set(heatCol(h)); m.emissiveIntensity = h > .15 ? .35 + h * .9 : 0;
    m.userData.style = h > .3 ? .6 : 1;
  }
  const bitPt = (bit, y) => bit.localToWorld(V(0, y, 0)).toArray();
  // Blacksmith's tongs, 2.25 ft: reins along +y from the grip (y 0) to the rivet, jaws beyond (y 2.25)
  function smithTongs() {
    const G = new THREE.Group(), iron = '#3C3936';
    for (const s of [-1, 1]) {
      G.add(P3.beam([s * .07, -.1, 0], [s * .03, 1.72, 0], .06, .05, iron));
      G.add(P3.beam([s * .03, 1.72, 0], [-s * .06, 2.28, 0], .085, .07, iron));
    }
    const rv = P3.mesh(P3.cyl(.055, .055, .14, 8).rotateX(Math.PI / 2), iron); rv.position.y = 1.72; G.add(rv);
    return G;
  }
  // hold the tongs: jaws at J, reins running back along u (unit) to the hands; both hands on the reins
  function holdTongs(p, tongs, J, u, o = {}) {
    const R = add3(J, u, 2.2), Lh = add3(J, u, 1.72);
    const side = nrm([u[2], 0, -u[0]]);
    PEOPLE.reach(p, o.lead || 'r', R, add3(add3(R, side, o.flip ? -1.2 : 1.2), [0, -1.4, 0]));
    PEOPLE.reach(p, o.lead === 'l' ? 'r' : 'l', Lh, add3(add3(Lh, side, o.flip ? 1.2 : -1.2), [0, -1.4, 0]));
    fist(p, 'r', .7); fist(p, 'l', .7);
    tongs.visible = true; PROPS.place(tongs, R, J);
  }

  // ---------- 2D effects on 3D points ----------
  function sparks(cam, p, age, key, o = {}) {
    const life0 = o.life ?? .62; if (age < 0 || age > life0) return;
    const n = o.n ?? 30, g = 30;
    X.save(); X.globalCompositeOperation = 'lighter'; X.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const h1 = hash(i * 7.13 + key), h2 = hash(i * 3.71 + key * 1.3), h3 = hash(i * 1.97 + key * .7);
      const life = life0 * (.4 + .6 * h3); if (age > life) continue;
      const a = h1 * TAU, sp = (o.speed ?? 15) * (.35 + .65 * h2), up = (o.up ?? .45) + h3 * .45;
      const vx = Math.cos(a) * sp * (1 - up * .6) + (o.bias ? o.bias[0] * sp : 0), vz = Math.sin(a) * sp * (1 - up * .6) + (o.bias ? o.bias[2] * sp : 0), vy = sp * up;
      const at = s => [p[0] + vx * s, p[1] + vy * s - g * .5 * s * s, p[2] + vz * s];
      const A = P3.project(cam, at(Math.max(0, age - .04))), B2 = P3.project(cam, at(age));
      if (A[2] <= .2 || B2[2] <= .2) continue;
      const k = age / life;
      X.strokeStyle = k < .3 ? '#FFF4CC' : k < .65 ? '#FFC45A' : '#F07A2A'; X.globalAlpha = (1 - k) * .95; X.lineWidth = (o.w ?? 2.6) * (1 - k * .5);
      X.beginPath(); X.moveTo(A[0], A[1]); X.lineTo(B2[0], B2[1]); X.stroke();
    }
    X.restore();
  }
  // a column of steam: puffs born over `age`, rising and spreading; o.ceil caps the rise (a roof) and spreads them
  function steam(cam, base, age, key, o = {}) {
    const n = o.n ?? 16, every = o.every ?? .07, life = o.life ?? 1.8;
    for (let i = n - 1; i >= 0; i--) {
      const a = age - i * every; if (a < 0 || a > life) continue;
      const k = a / life, h = hash(i * 5.3 + key), h2 = hash(i * 2.9 + key * 1.7);
      let y = base[1] + (o.rise ?? 6.5) * a - .8 * a * a, spread = (o.spread ?? .8) * a;
      if (o.ceil != null && y > o.ceil) { spread += (y - o.ceil) * 1.2; y = o.ceil + (y - o.ceil) * .15; }
      const p = [base[0] + (h - .5) * spread * 2 + WIND[0] * a * (o.wind ?? .4), y, base[2] + (h2 - .5) * spread * 2 + WIND[2] * a * (o.wind ?? .4)];
      const [sx, sy, d] = P3.project(cam, p); if (d <= .3) continue;
      const r = ((o.r0 ?? .5) + a * (o.grow ?? 1.6)) * pxPerFt(cam, d);
      seed('Bst' + key + '_' + i);
      psmoke(sx, sy, Math.min(r, 900), o.col || '#F2EEE6', (o.a ?? .55) * Math.min(1, a * 7) * (1 - k * k));
    }
  }
  function stackSmoke(S, cam, t, o = {}) {
    const [x0, y0, z0] = S.U.stackTop, n = 10;
    for (let i = 0; i < n; i++) {
      const age = frac(t * .3 + i / n) * 3.3, k = age / 3.3;
      const p = [x0 + WIND[0] * age * 1.4, y0 + 5.5 * age - .35 * age * age, z0 + WIND[2] * age * 1.4];
      const [sx, sy, d] = P3.project(cam, p); if (d <= .5) continue;
      seed('Bsmk' + i);
      psmoke(sx, sy, Math.min(700, (1.6 + age * 2.6) * pxPerFt(cam, d)), o.col || AP.smoke, (o.a ?? .45) * (1 - k) * Math.min(1, k * 6));
    }
  }
  // graphite motion smear for whips: k 0..1, dir 'v' | 'h'
  function streaks(k, dir, key) {
    if (k <= .02) return;
    seed('Bwhip' + key);
    // the smear: the frame washes toward paper, then long graphite and paper strokes run along the move
    ptone(rectPts(-40, -40, W + 80, H + 80), AP.paper, Math.pow(k, 1.5) * .7);
    X.save(); X.lineCap = 'round';
    for (let i = 0; i < 90; i++) {
      const a = hash(i * 3.3 + 1), b = hash(i * 7.1 + 2), L = (320 + 900 * hash(i * 1.7)) * k;
      X.strokeStyle = pat(i % 3 ? AP.graphite : AP.paperLt, 's'); X.globalAlpha = (.25 + .4 * hash(i)) * k; X.lineWidth = 3 + 12 * hash(i * 9.1);
      X.beginPath();
      if (dir === 'v') { const x = a * W, y = b * (H + L) - L; X.moveTo(x, y); X.lineTo(x + jit(3), y + L); }
      else { const y = b * 900, x = a * (W + L) - L; X.moveTo(x, y); X.lineTo(x + L, y + jit(3)); }
      X.stroke();
    }
    X.restore();
    pshade(rectPts(-40, -40, W + 80, H + 80), AP.graphite, k * .5, { kind: dir === 'v' ? 'v' : 'h' });
  }
  // hatched iris: closing (a dark disc of radius r grows over the frame) or opening (a dark field with a hole r)
  function hatchIris(cx, cy, r, open) {
    seed('Biris');
    const path = () => { X.beginPath(); if (open) { X.rect(-80, -80, W + 160, H + 160); X.moveTo(cx + r, cy); X.arc(cx, cy, r, 0, TAU, true); } else X.arc(cx, cy, Math.max(1, r), 0, TAU); };
    X.save(); path(); X.globalAlpha = .82; X.fillStyle = '#231F1C'; X.fill('evenodd');
    X.globalAlpha = 1; X.fillStyle = pat(AP.graphite, 'h'); X.fill('evenodd'); X.fillStyle = pat(AP.graphite, 'x'); X.globalAlpha = .9; X.fill('evenodd'); X.restore();
    if (r > 4 && r < 2400) pline(ellPts(cx, cy, r, r, 44, 2), 2.4, AP.graphite, { closed: true });
  }
  function steamWipe(k, key) {
    if (k <= 0) return;
    for (let i = 0; i < 24; i++) {
      const x = hash(i * 2.7 + 3) * (W + 200) - 100, y = hash(i * 5.9 + 1) * 1000 - 60, r = (220 + 300 * hash(i * 1.3)) * (.45 + .75 * k);
      seed('Bsw' + key + i); psmoke(x, y - k * 80 * hash(i), r, '#EEE8DE', .92 * k);
    }
    ptone(rectPts(-40, -40, W + 80, H + 80), '#ECE6DA', clamp((k - .5) / .5) * .95);
  }

  // =====================================================================================================
  // The site: the whole plant (WORLD.site), the crew, the bailing gear, the forge props and the lamps.
  // =====================================================================================================
  const SITE = () => P3.cached('B-site', () => {
    const o = P3.scene({ sunDir: TOD.aft.dir, sun: 2.5, fill: .5, shadowSize: 55 });
    const site = WORLD.site({ board: 1000, trees: 60, dead: .65 }); o.scene.add(site.group);
    const R = site.rig, U = R.userData, g = site.group, trees = g.children[g.children.length - 1];
    let roof = null; U.shed.children.forEach(c => { const pr = c.geometry && c.geometry.parameters; if (pr && pr.width === 14 && pr.depth === 12) roof = c; });
    const cast = {}; for (const n of Object.keys(GRIME)) { cast[n] = PEOPLE.make(n, GRIME[n]); o.scene.add(cast[n].root); }
    const add = m => { o.scene.add(m); return m; };
    // the open mouth of the casing, so the hole can be looked into
    const mouth = add(P3.mesh(new THREE.CircleGeometry(.62, 28).rotateX(-Math.PI / 2), '#141110', { cast: false })); mouth.position.set(0, FY + 1.735, 0);
    // the bailer, 20 ft of wrought iron with its foot valve and stem (Cox 1895), on the sand line from the reel
    const bailer = add(PROPS.bailer()), tube = bailer.children[0]; tube.scale.y = 20 / 9; tube.position.y = -10;
    const foot = P3.mesh(P3.cyl(.33, .31, .55, 14), '#5C5853'); foot.position.y = -19.7; bailer.add(foot);
    const stem = P3.mesh(P3.cyl(.05, .05, .75, 6), '#34312E'); stem.position.y = -20.35; bailer.add(stem);
    const rope = add(P3.mesh(P3.box(1, 1, 1), '#3E3934', { cast: false }));
    const sandLine = add(P3.mesh(P3.box(1, 1, 1), '#3E3934', { cast: false })); setBeam(sandLine, [-8.6, 5.0, -10.4], [-.7, 63.4, -.7], .06);
    // the sludge box on the floor beside the hole, and the slurry in it
    const box = new THREE.Group(); add(box); box.position.set(-2.5, FY, -2.0);
    for (const [w, h, d, x, y, z] of [[2.6, .12, 2.6, 0, .06, 0], [2.6, .5, .12, 0, .25, 1.24], [2.6, .5, .12, 0, .25, -1.24], [.12, .5, 2.4, 1.24, .25, 0], [.12, .5, 2.4, -1.24, .25, 0]]) { const m = P3.mesh(P3.box(w, h, d), '#7A5C40'); m.position.set(x, y, z); box.add(m); }
    const slurry = P3.mesh(P3.box(2.36, 1, 2.36), '#8E8A80', { style: .5, cast: false }); box.add(slurry);
    // the slurry heaving up out of the foot valve: a grey mound that spreads to the box's edges
    const heave = P3.mesh(new THREE.SphereGeometry(1, 18, 8, 0, TAU, 0, Math.PI / 2), '#8A867C', { style: .5, cast: false }); box.add(heave);
    // spoil from earlier bailings, beside the floor
    const spoil = add(P3.mesh(new THREE.SphereGeometry(3, 18, 8), '#86827A', { style: .5 })); spoil.scale.set(1.3, .22, 1); spoil.position.set(9.5, .1, 13.5);
    // the sand-reel brake lever by the reel
    const lever = add(P3.mesh(P3.box(1, 1, 1), '#7A5A40'));
    // forge and smith's gear
    const sledge = add(PROPS.sledge()), tongs = add(smithTongs()), bit = add(chiselBit());
    const coals = new THREE.Group(); add(coals);
    for (let i = 0; i < 22; i++) { const c = P3.mesh(new THREE.IcosahedronGeometry(.13 + hash(i * 3.1) * .12, 0), i % 3 ? '#D8541E' : '#F08A34', { style: .6, cast: false }); c.position.set(U.forge[0] + (hash(i * 1.7) - .5) * 2.4, U.forge[1] - .02 + hash(i * 5.3) * .12, U.forge[2] + (hash(i * 2.3) - .5) * 1.9); coals.add(c); }
    const tubWater = add(P3.mesh(new THREE.CircleGeometry(1.2, 24).rotateX(-Math.PI / 2), '#34505C', { style: .5, cast: false })); tubWater.position.set(U.quench[0], 1.82, U.quench[2]);
    const lantD = add(PROPS.lantern()); PROPS.at(lantD, [-7.05, 9.6, 7.05]);
    const lantF = add(PROPS.lantern()); PROPS.at(lantF, [-20.45, 7.9, 14.55]);
    // lamps: forge fire (the only one with shadows), the hot bit, two hurricane lanterns, the engine's firebox
    const forgeL = P3.lamp(o, [U.forge[0] + .4, U.forge[1] + .9, U.forge[2] + .9], '#FF7A30', 0, 42, true);
    const bitL = P3.lamp(o, [0, -50, 0], '#FFB468', 0, 14, false);
    const lantDL = P3.lamp(o, PROPS.glassAt(lantD), '#FFC47A', 0, 50, false);
    const lantFL = P3.lamp(o, PROPS.glassAt(lantF), '#FFC47A', 0, 36, false);
    const fireL = P3.lamp(o, [U.firebox[0], U.firebox[1] + .3, U.firebox[2] + 1.6], '#FF8038', 0, 22, false);
    return { o, site, R, U, g, trees, roof, cast, mouth, bailer, rope, sandLine, box, slurry, heave, spoil, lever, sledge, tongs, bit, coals, tubWater, lantD, lantF, forgeL, bitL, lantDL, lantFL, fireL, cam: P3.cam(40) };
  });
  // everything that any site shot moves, back to rest; every shot then sets what it uses
  function resetSite(S) {
    for (const p of Object.values(S.cast)) p.root.visible = false;
    for (const m of [S.bailer, S.rope, S.sledge, S.tongs, S.bit]) m.visible = false;
    S.trees.visible = true; if (S.roof) S.roof.visible = true;
    const U = S.U; U.rods.visible = U.tiller.visible = U.temper.visible = true;
    S.slurry.visible = S.heave.visible = false; S.slurry.material.userData.style = .5; S.forgeL.intensity = S.bitL.intensity = S.lantDL.intensity = S.lantFL.intensity = S.fireL.intensity = 0;
    setBeam(S.lever, [-7.7, FY, -9.3], [-7.1, FY + 4.1, -8.5], .22);
    S.site.board.userData.set(1000);
    bitHeat(S.bit, 0);
  }
  // the plant running: one blow every two beats, the band wheel once round per stroke, the flywheel ~5 times (Boyd)
  function rig(S, t, o = {}) {
    const st = RIG.strokeAt(t), band = (bpOf(t) / 2) * TAU, twist = Math.floor(bpOf(t) / 2) * .2 + ease(seg(st, .55, .74)) * .2;
    RIG.pose(S.R, { stroke: st, amp: o.amp ?? 1, fly: band * 5, bandAngle: band, bull: o.bull ?? 0, reel: o.reel ?? 0, turn: o.turn ?? twist });
    return st;
  }
  // dusk dressing: lanterns lit, firebox and forge glowing
  function duskLamps(S, t) {
    const fl = 1 + .08 * Math.sin(t * 17.3) + .06 * Math.sin(t * 29.1 + 1.3);
    S.forgeL.intensity = 1900 * fl; S.lantDL.intensity = 520; S.lantFL.intensity = 420; S.fireL.intensity = 650 * fl;
    return fl;
  }
  function forgeGlow(S, cam, t, k = 1) {
    const [x, y, d] = P3.project(cam, [S.U.forge[0], S.U.forge[1] + .25, S.U.forge[2]]); if (d <= .3) return;
    const s = pxPerFt(cam, d), fl = 1 + .1 * Math.sin(t * 17.3);
    seed('Bforge'); pglow(x, y, Math.min(520, s * 3.2 * fl), '#FF6A24', .6 * k); pglow(x, y, Math.min(220, s * 1.3), '#FFB050', .4 * k);
  }
  function lampGlows(S, cam, which) {
    for (const [l, on] of [[S.lantD, which.d], [S.lantF, which.f]]) { if (!on) continue; const [x, y, d] = P3.project(cam, PROPS.glassAt(l)); if (d <= .3) continue; seed('Blg' + x); const s = pxPerFt(cam, d); pglow(x, y, s * 5, '#FFC46A', .75); pglow(x, y, s * 1.1, '#FFF0C0', .7); }
    if (which.fire) { const [x, y, d] = P3.project(cam, S.U.firebox); if (d > .3) { const s = pxPerFt(cam, d); seed('Bfb'); pglow(x, y, s * 3.5, '#FF7A30', .8); } }
  }
  function hotGlow(cam, S, h, k = 1) {
    if (h < .12) return;
    seed('Bhot');
    for (const [y0, w] of [[2.0, .8], [2.7, 1], [3.2, .8]]) {   // along the blade, so the glow takes the bit's shape
      const [x, y, d] = P3.project(cam, bitPt(S.bit, y0)); if (d <= .3) continue;
      const s = pxPerFt(cam, d);
      pglow(x, y, Math.min(700, s * (1.1 + 1.8 * h)), heatCol(h * .8), (.22 + .45 * h) * k * w); pglow(x, y, Math.min(260, s * .45), heatCol(Math.min(1, h + .1)), .5 * h * k * w);
    }
  }

  // =====================================================================================================
  // The section (WORLD.section), with a heat wash over the face that darkens the deep rock toward red.
  // =====================================================================================================
  const HOTA = '#8A4A2E', HOTB = '#4E1C14';
  const heatMix = (base, k) => k < .5 ? mixCol(base, HOTA, k * 1.6) : mixCol(mixCol(base, HOTA, .8), HOTB, (k - .5) * 2);
  function heatPlane(SU, d0, d1) {
    const rows = []; for (let d = d0; d <= d1 + .1; d += 10) rows.push(d);
    for (const [a] of WORLD.STRATA) if (a > d0 && a < d1) rows.push(a - .05, a + .05);
    rows.sort((a, b) => a - b);
    const n = rows.length, pos = new Float32Array(n * 6), col = new Float32Array(n * 6), nor = new Float32Array(n * 6), idx = [];
    rows.forEach((d, i) => { for (let s = 0; s < 2; s++) { const j = (i * 2 + s) * 3; pos[j] = s ? 41.8 : -41.8; pos[j + 1] = SU.y(d); pos[j + 2] = .05; nor[j + 2] = 1; } });
    for (let i = 0; i < n - 1; i++) { const a = i * 2, b = a + 1, c = a + 2, e = a + 3; idx.push(a, c, b, b, c, e); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setIndex(idx);
    const m = P3.mesh(g, '#ffffff', { cast: false }); m.material.vertexColors = true;
    // beds within each stratum: bands 20-70 ft thick, alternately lighter and darker, so the face reads as laid-down rock
    const bed = d => { let a = 0, i = 0; while (a < d) { a += 20 + 50 * hash(i * 3.17 + 11); i++; } return i; };
    m.userData.rows = rows;
    m.userData.base = rows.map(d => { const c = (WORLD.STRATA.find(r => d >= r[0] && d < r[1]) || WORLD.STRATA[WORLD.STRATA.length - 1])[2], b = bed(d), h = hash(b * 7.7);
      return h < .34 ? mixCol(c, '#F4EAD4', .38 + .16 * hash(b)) : h < .62 ? mixCol(c, '#2C2620', .3 + .14 * hash(b + 1)) : h < .82 ? mixCol(c, '#A8683E', .3) : mixCol(c, '#6E7E86', .22); });
    return m;
  }
  const SECT = () => P3.cached('B-sect', () => {
    const o = P3.scene({ sunDir: [-45, 60, 80], sun: 2.2, fill: .5, shadowSize: 38 });
    const S = WORLD.section({ bottom: 1900, w: 84 }); o.scene.add(S);
    const SU = S.userData, bore = [SU.slot, SU.casing, SU.rods, SU.bit, SU.water, SU.surf], lams = [];
    S.children.forEach(m => { if (m.isMesh && !m.userData.stratum && !bore.includes(m)) lams.push({ m, base: '#' + m.material.color.getHexString(), d: -m.position.y / SU.VS }); });
    // the narrowed block: bring the fossils in toward the bore, where the camera passes them; paler bone so they read
    for (const f of SU.fossils.children) { if (Math.abs(f.position.x) > 30) f.position.x = Math.sign(f.position.x) * (Math.abs(f.position.x) > 38 ? 30 : 23); }
    SU.fossils.traverse(m => { if (m.isMesh) { m.material.color.set(mixCol('#' + m.material.color.getHexString(), '#FFF8E8', .45)); m.material.userData.albedo.copy(m.material.color); } });
    const heat = heatPlane(SU, 300, 1900); o.scene.add(heat);
    // the string, exaggerated like the bore: iron joints every pole length on the yellow rods, and under them the
    // jars (two long links) and the heavy sinker bar that give the chisel its weight (RESEARCH.md)
    const joints = new THREE.Group(); o.scene.add(joints);
    for (let i = 0; i < 60; i++) { const j = P3.mesh(P3.cyl(.42, .42, .5, 10), '#3A3632', { cast: false }); joints.add(j); }
    const sinker = P3.mesh(P3.cyl(.5, .5, 1, 12), '#4A4540'); o.scene.add(sinker);
    const jars = new THREE.Group(); o.scene.add(jars);
    for (const sx of [-.34, .34]) { const l = P3.mesh(P3.box(.14, 2.6, .5), '#3A3632'); l.position.x = sx; jars.add(l); }
    for (const yy of [-1.3, 1.3]) { const c = P3.mesh(P3.box(.9, .22, .5), '#3A3632'); c.position.y = yy; jars.add(c); }
    const bitL = P3.lamp(o, [0, -100, 3], '#FF5A28', 0, 12, false);
    const poolL = P3.lamp(o, [0, -120, 9], '#FFD9A0', 0, 30, false);
    SU.bit.material.color.set('#9A958C'); SU.bit.material.userData.albedo.copy(SU.bit.material.color);
    // the bore stands full of water from the upper springs (Cox 1895): a dark wet slot the rods and bit read against
    SU.slot.material.color.set('#4A565A'); SU.slot.material.userData.albedo.copy(SU.slot.material.color);
    return { o, S, SU, lams, heat, joints, sinker, jars, bitL, poolL, bitBase: '#9A958C', cam: P3.cam(36) };
  });
  function heatSet(C, H, top, span = 420) {
    const m = C.heat, key = Math.round(H * 300) + ':' + Math.round(top) + ':' + span; if (m.userData.key === key) return; m.userData.key = key;
    const rows = m.userData.rows, base = m.userData.base, col = m.geometry.attributes.color, c = new THREE.Color();
    const k = d => H * Math.pow(clamp((d - top) / span), .7);
    rows.forEach((d, i) => { c.set(heatMix(base[i], k(d))); col.setXYZ(i * 2, c.r, c.g, c.b); col.setXYZ(i * 2 + 1, c.r, c.g, c.b); });
    col.needsUpdate = true;
    for (const L of C.lams) { L.m.material.color.set(heatMix(L.base, k(L.d) * .85)); L.m.material.userData.albedo.copy(L.m.material.color); }
  }
  // the bore at depth d: rods lifted by the stroke, the rods shudder after each blow, the heat wash, the bit's flush
  function sectPose(C, t, d, o = {}) {
    const SU = C.SU, st = RIG.strokeAt(t);
    SU.set(d, st, { casing: o.casing ?? d * .86, amp: o.amp ?? 1 });
    // WORLD.section's slot is a 1.4-deep box standing 0.9 proud of the face, the full height of the block: from any
    // oblique camera it reads as a bar in front of the rock and hides the bit. Make it a flush groove that ends under
    // the bit, and seat the string in it (local workaround).
    const sl = (d + 4) * SU.VS; SU.slot.visible = true; SU.slot.scale.set(1, sl / (1900 * SU.VS), .03); SU.slot.position.set(0, -sl / 2, .3);
    SU.rods.position.z = SU.bit.position.z = .5; SU.casing.position.z = .45;
    const lift = st < .75 ? Math.sin(st / .75 * Math.PI / 2) : 1 - Math.pow((st - .75) / .25, 2), bot = SU.y(d) + lift * (o.amp ?? 1) * 1.6;
    // the jars' play: the rods land a moment after the bit (Cox 1895), so the string compresses a hair on the blow
    // Fig. 51: poles, jars, sinker, bit. The sinker rides the bit; the jars' play lets the poles land a moment later.
    const play = .3 * hitK(t, 12);
    SU.bit.scale.setScalar(1.25); SU.bit.position.y = bot + 2.0;
    C.sinker.position.set(0, bot + 5.8, .5); C.sinker.scale.y = 3.6;
    C.jars.position.set(0, bot + 8.9 - play, .5);
    const top = bot + 10.2 - play;
    SU.rods.scale.y = Math.max(.01, 8.8 - top); SU.rods.position.y = (8.8 + top) / 2;
    C.joints.children.forEach((j, i) => { const y = top + .25 + i * 2; j.visible = y < 4; j.position.set(0, y, .5); });
    const sc = since(t), sh = (o.shudder ?? .09) * Math.exp(-sc * 6) * Math.sin(sc * 62);
    SU.rods.position.x = sh; SU.rods.rotation.z = sh * .004;
    heatSet(C, o.heat ?? 0, o.heatTop ?? d, o.heatSpan);
    const hb = clamp((o.bitHeat ?? 0) * (.25 + .5 * hitK(t, 4)));
    SU.bit.material.color.set(mixCol(C.bitBase, '#B8401C', hb)); SU.bit.material.userData.albedo.copy(SU.bit.material.color);
    return st;
  }
  function sectLight(C, tgt, o = {}) {
    const s = C.o.sun, dir = o.dir || [-45, 60, 80];
    s.target.position.set(...tgt); s.target.updateMatrixWorld(); s.position.set(tgt[0] + dir[0], tgt[1] + dir[1], tgt[2] + dir[2]);
    s.intensity = o.sun ?? 2.2; s.color.set(o.col || '#FFF1DC'); C.o.fill.intensity = o.fill ?? .5; C.o.fill.color.set('#FFFFFF'); C.o.fill.groundColor.set('#6A5A48');
    C.bitL.intensity = o.bitL ?? 0; C.poolL.intensity = o.pool ?? 0;
  }
  // dust and chips at the bit on each blow
  function blowFx(C, cam, t, d, o = {}) {
    const SU = C.SU, h = hitK(t, 6.5), tip = [0, SU.y(d) + .2, 1.0], [x, y, dd] = P3.project(cam, tip); if (dd <= .3) return;
    const s = pxPerFt(cam, dd);
    if (o.glow) { seed('Bbg'); pglow(x, y, s * (2.6 + 3 * o.glow), o.glowCol || '#E0502A', Math.min(1, o.glow * (.45 + .55 * h))); }
    if (h > .05) {
      seed('Bdust'); psmoke(x, y - s * .9, s * (1.4 + (1 - h) * 2.4), o.dust || '#D6CCB8', .6 * h); psmoke(x + s * .8, y - s * 1.6, s * (.9 + (1 - h) * 1.8), o.dust || '#D6CCB8', .4 * h);
      const age = since(t);
      for (let i = 0; i < 9; i++) {
        const a = -Math.PI / 2 + (hash(i * 3.7 + blowN(t)) - .5) * 2.2, v = 5 + 7 * hash(i * 1.3 + blowN(t));
        const px = x + Math.cos(a) * v * age * s, py = y + Math.sin(a) * v * age * s + 14 * age * age * s;
        pline([[px, py], [px + Math.cos(a) * s * .25, py + Math.sin(a) * s * .25]], 1.4, '#3E3A34', { over: 0, passes: 1, alpha: h });
      }
    }
  }
  function ruler3(cam, SU, x, d0, d1, bitD, o = {}) {
    seed('Bruler');
    const P = d => P3.project(cam, [x, SU.y(d), .7]);
    pline([P(d0), P(d1)], 1.3, AP.graphite, { over: 0, passes: 1 });
    const st = o.step ?? 50;
    for (let d = Math.ceil(d0 / st) * st; d <= d1; d += st) {
      const big = o.step ? d % 500 === 0 || d === 1000 : d % 100 === 0, p = P(d), q = P3.project(cam, [x + (big ? 2.6 : 1.3), SU.y(d), .7]);
      pline([p, q], big ? 1.4 : .8, AP.graphite, { over: 0, passes: 1 });
      if (big && p[1] > 30 && p[1] < 870) label(`${d} FT`, q[0] + 12, q[1], o.size ?? 32, o.col || AP.graphite, { screen: true, alpha: .92 });
    }
    if (bitD != null) {
      const p = P(bitD), b = P3.project(cam, [-1.4, SU.y(bitD), .9]);
      for (let i = 0; i < 12; i++) { const a = i / 12, c = (i + .55) / 12; pline([[lerp(p[0], b[0], a), lerp(p[1], b[1], a)], [lerp(p[0], b[0], c), lerp(p[1], b[1], c)]], .9, AP.rust, { over: 0, passes: 1, alpha: .8 }); }
      pfill([[p[0] - 6, p[1]], [p[0] - 34, p[1] - 14], [p[0] - 34, p[1] + 14]], AP.rust, { tone: .9, sw: 1 });
    }
  }
  const sectBg = (col = '#5E564C', a = .55, dens = .5) => { seed('Bsbg'); ptone(rectPts(-40, -40, W + 80, H + 80), col, a); pshade(rectPts(-40, -40, W + 80, H + 80), AP.graphite, dens); };

  // =====================================================================================================
  // S1 · 51.30–53.46 · [9] the bit plugging downward at a thousand feet
  // =====================================================================================================
  function s1(t, lt, dur) {
    const C = SECT(), SU = C.SU, cam = C.cam, d = 1000;
    sectPose(C, t, d, { casing: 860, heat: .3, heatTop: 1015 });
    const k = ease(seg(lt, 0, dur - .3)), up = easeIn(seg(lt, dur - .34, dur)), ty = SU.y(d) + 2;
    const cy = up * up * 38;
    look(cam, 34, [lerp(-25, -22.5, k) + up * 3, ty + lerp(13, 5.5, k) + cy, lerp(30, 27, k)], [lerp(-1.8, -1.4, k), ty + lerp(4, -4.6, k) + cy * 1.08, 0]);
    sectLight(C, [0, ty, 0], { dir: [-40, 45, 70], sun: 3.4, fill: .6, pool: 0 });
    sectBg();
    draw3(C.o, cam, { fog: [60, 200], fogCol: '#B8AC96', near: 1, far: 900, lineW: 1.8, lightTint: .45 });
    { const [bx, by] = P3.project(cam, [0, SU.y(d) + 2, 1]); spot(bx, by, 560, .5); }
    blowFx(C, cam, t, d);
    ruler3(cam, SU, -9.5, 800, 1200, d);
    streaks(up, 'v', 's1');
    if (lt < .35) scribbleWipe(.5 + lt / .7);
  }

  // =====================================================================================================
  // S2 · 53.46–55.57 · [9] the bailer comes up and is dumped on its valve stem: grey slurry, steaming a little
  // =====================================================================================================
  const PULLEY = [-.7, 63.4, -.7], BOX = [-2.5, FY, -2.0];
  function hangBailer(S, B) {       // B = stem tip; the bailer hangs straight from the sand-line pulley
    const d = nrm([B[0] - PULLEY[0], B[1] - PULLEY[1], B[2] - PULLEY[2]]), T = add3(B, d, -20.72);
    S.bailer.visible = S.rope.visible = true;
    PROPS.place(S.bailer, T, add3(T, d, -1)); setBeam(S.rope, PULLEY, T, .07);
    return { d, T, at: h => { const k = (h - B[1]) / (T[1] - B[1]); return lerp3(B, T, k); } };
  }
  function s2(t, lt, dur) {
    const S = SITE(), U = S.U, cam = S.cam, L = TOD.aft;
    resetSite(S); lightOn(S.o, L, [-1, 0, -1]);
    rig(S, t, { amp: 0, reel: -(Math.min(lt, .55) * 9) });
    U.rods.visible = U.tiller.visible = false;
    // the stem tip: up out of the collar, walked over to the box, let down onto its stem
    const BX = [BOX[0] + .05, BOX[2] + .05];
    const B = kf(lt, [[0, [0, FY + .5, 0]], [.45, [0, FY + 3.3, 0]], [1.15, [BX[0], FY + 3.0, BX[1]]], [1.24, [BX[0], FY + 1.4, BX[1]]], [1.3, [BX[0], FY + .14, BX[1]]]], ease);
    const bl = hangBailer(S, B);
    const lev = .34 * easeOut(seg(lt, 1.3, 1.95)), hv = easeOut(seg(lt, 1.28, 1.6)) * (1 - ease(seg(lt, 1.5, 2.0)) * .75);
    S.slurry.visible = lev > .01; S.slurry.scale.y = Math.max(.01, lev); S.slurry.position.y = .12 + lev / 2;
    S.heave.visible = hv > .01; S.heave.scale.set(.35 + 1.0 * easeOut(seg(lt, 1.28, 1.9)), Math.max(.01, .55 * hv), .35 + 1.0 * easeOut(seg(lt, 1.28, 1.9))); S.heave.position.set(BX[0] - BOX[0], .12 + lev, BX[1] - BOX[2]);
    // the hand walks it over, pushing the tube ahead of her; she faces the sun
    const dirB = nrm([BX[0], 0, BX[1]]), hd = S.cast.hand, mv = ease(seg(lt, .42, 1.15)), grab = ease(seg(lt, .2, .42));
    const hp = [-dirB[0] * 1.75 + BX[0] * mv, FY, -dirB[2] * 1.75 + BX[1] * mv];
    show(hd, hp, Math.atan2(dirB[0], dirB[2]), 'Idle_Loop', t * .9 + 1.7);
    const wk = Math.sin(mv * Math.PI); if (wk > .02) PEOPLE.clip(hd, 'Walk_Loop', lt * 1.1 + .2, { w: wk * .9, skip: ['upperarm', 'lowerarm', 'hand', 'clavicle'] });
    PEOPLE.turn(hd, 'spine_02', [.16 * grab, 0, 0]);
    for (const [s2, hh, off] of [['l', FY + 4.25, .5], ['r', FY + 3.5, -.5]]) {
      const c = bl.at(hh), toHer = nrm([hp[0] - c[0], 0, hp[2] - c[2]]), side = [toHer[2] * off * .4, 0, -toHer[0] * off * .4], tg = add3(add3(c, toHer, .34), side), h0 = hand(hd, s2);
      PEOPLE.reach(hd, s2, lerp3(h0, tg, grab), add3(add3(tg, toHer, 1.2), [side[0] * 3, -1.3, side[2] * 3]));
      fist(hd, s2, .75 * grab);
    }
    show(S.cast.boss, [3.9, FY, 4.6], -2.45, 'Idle_FoldArms_Loop', t * .7 + 2);
    PEOPLE.turn(S.cast.boss, 'Head', [.3, 0, 0]);
    // camera: low on the planks, past the box to the collar; rises out of S1's crane, follows the tube over, then
    // lifts with the steam into the sky
    const settle = easeOut(seg(lt, 0, .45)), lift = ease(seg(lt, 1.62, dur));
    // then down with the tube to the box as it lands, and up again with the steam
    const tgt = kf(lt, [[0, [.2, 5.9, .3]], [.45, [.1, 5.8, .2]], [1.1, [-1.5, 4.6, -1.2]], [1.4, [-2.35, FY + .7, -1.95]], [1.62, [-2.4, FY + .9, -2.0]]], ease);
    const push = ease(seg(lt, 1.05, 1.5)), cp = [lerp(lerp(5.0, 4.6, lt / dur), 1.4, push * .55), lerp(lerp(2.9, 4.0, settle), 4.3, push) + lift * .8, lerp(lerp(-7.0, -6.7, lt / dur), -5.9, push * .55)];
    look(cam, 42, cp, [tgt[0], tgt[1] + lift * lift * 9 + (1 - settle) * 3, tgt[2]]);
    const sk = skyFor(cam, L, { sunR: 40 });
    draw3(S.o, cam, { fog: [140, 1300], fogCol: sk.low, near: .3, lineW: 1.8, lightTint: L.tint });
    // drips while it rises, the gush, the steam
    const bot = add3(B, bl.d, -.95), [bx, by, bd] = P3.project(cam, bot), s = pxPerFt(cam, bd);
    if (lt < 1.2 && bd > .3) for (let i = 0; i < 6; i++) { const a = frac(t * 2.1 + hash(i)); seed('Bdrip' + i); pline([[bx + (hash(i * 3) - .5) * s * .4, by + a * s * 2.2], [bx + (hash(i * 3) - .5) * s * .4, by + a * s * 2.2 + s * .22]], 1.3, '#5E5A52', { over: 0, passes: 1, alpha: 1 - a }); }
    // the gush: grey slurry boiling out round the foot valve, slopping up the tube and over the planks
    if (lt > 1.28 && lt < 2.05) {
      const k = seg(lt, 1.28, 2.05), [gx, gy, gd] = P3.project(cam, [B[0], FY + .2 + lev, B[2]]);
      if (gd > .3) { const gs = pxPerFt(cam, gd);
        for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (hash(i * 3.1) - .5) * 2.6, r = gs * (.3 + 1.1 * hash(i * 7.7)) * easeOut(k), h = gs * .5 * Math.sin(Math.min(1, k * 2.2) * Math.PI) * hash(i * 1.9);
          seed('Bgush' + i); pline([[gx + Math.cos(a) * gs * .15, gy], [gx + Math.cos(a) * r * .6, gy - h], [gx + Math.cos(a) * r, gy + gs * .08]], 2.4 + 2 * hash(i), '#5E5A52', { curv: true, over: 0, passes: 1, alpha: 1 - k * .8 }); } }
    }
    if (lt > 1.35) steam(cam, [BOX[0], FY + .3 + lev, BOX[2]], lt - 1.35, 21, { n: 10, every: .08, life: 1.9, rise: 3.4, grow: 1.5, a: .28, r0: .5, spread: 1.2, wind: .9 });
    streaks(1 - seg(lt, 0, .28), 'v', 's2');
  }

  // =====================================================================================================
  // S3a · 55.57–57.50 · [10] "If the Lord won't send us water": the boss glares up at the empty sky
  // S3b · 57.50–59.91 · [10] "...we'll get it from the devil": he looks down the hole and takes hold of it
  // =====================================================================================================
  const BOSS = [.4, FY, 1.55];
  function bailerRest(S) {             // standing in the box on its stem, as dumped
    hangBailer(S, [BOX[0] - .1, FY + .14, BOX[2] - .1]);
    S.slurry.visible = true; S.slurry.scale.y = .66; S.slurry.position.y = .12 + .33;
  }
  function bossPose(S, t, up, down, bend, grip) {
    const b = S.cast.boss;
    show(b, BOSS, Math.PI + .12, 'Idle_Loop', t * .8 + 3);
    if (bend > .01) PEOPLE.clip(b, 'Crouch_Idle_Loop', t * .8 + 3, { w: .55 * bend, only: ['pelvis', 'thigh', 'calf', 'foot', 'ball'] });
    PEOPLE.turn(b, 'spine_01', [.3 * bend, 0, 0]); PEOPLE.turn(b, 'spine_02', [.2 * bend, 0, 0]);
    PEOPLE.turn(b, 'spine_03', [-.1 * up, 0, 0]); PEOPLE.turn(b, 'neck_01', [-.26 * up + .14 * down * (1 - bend * .8), 0, 0]);
    PEOPLE.turn(b, 'Head', [-.46 * up + .3 * down * (1 - bend * .75) + Math.sin(t * 41) * .012 * up, 0, 0]);
    fist(b, 'l', 1); fist(b, 'r', 1 - grip * .5);
    return b;
  }
  function s3a(t, lt, dur) {
    const S = SITE(), U = S.U, cam = S.cam, L = TOD.aft;
    resetSite(S); lightOn(S.o, L, [0, 0, 0]);
    rig(S, t, { amp: 0 }); U.rods.visible = U.tiller.visible = false;
    bailerRest(S);
    // anger: he is already glaring up when we find him; a tremor of the jaw; then his eyes drop (cut on the look)
    const up = 1 - ease(seg(lt, 1.45, dur + .5));
    const b = bossPose(S, t, up, 0, 0, 0);
    PEOPLE.reach(b, 'r', add3(hand(b, 'r'), [-.08, .12, 0]), [BOSS[0] - 1, FY + 3, BOSS[2] + 1]);
    // camera: low in front of him, the empty sky above; a slow push in
    const k = ease(lt / dur), hd = PEOPLE.head(b);
    look(cam, 36, [lerp(-1.25, -1.0, k), FY + lerp(3.2, 3.35, k), lerp(-3.6, -2.9, k)], [hd.x + .1, hd.y + lerp(1.5, 1.2, k), hd.z + 1.1]);
    const sk = skyFor(cam, L, { sunR: 44, heat: .8 });
    draw3(S.o, cam, { fog: [140, 1300], fogCol: sk.low, near: .3, lineW: 2, lightTint: L.tint });
  }
  function s3b(t, lt, dur) {
    const S = SITE(), U = S.U, cam = S.cam, L = TOD.aft;
    resetSite(S); lightOn(S.o, L, [0, 0, 0]);
    rig(S, t, { amp: 0 }); U.rods.visible = U.tiller.visible = false;
    bailerRest(S); S.slurry.material.userData.style = 1;
    // his eyes come down to the hole; he bends and takes hold of the collar; a single slow nod: resolve
    const lower = ease(seg(lt, 0, .5)), bend = ease(seg(lt, .45, 1.05)), nod = Math.sin(seg(lt, 1.2, 1.75) * Math.PI) * .16;
    const b = bossPose(S, t, .42 * (1 - lower), lower + nod * 2.2, bend, ease(seg(lt, .8, 1.1)));
    const rim = [-.36, FY + 1.77, .72], h0 = hand(b, 'r');
    PEOPLE.reach(b, 'r', lerp3(h0, rim, ease(seg(lt, .5, 1.05))), [BOSS[0] - 1.7, FY + 3.2, BOSS[2] + .2]);
    fist(b, 'r', .5 + .4 * ease(seg(lt, .95, 1.15)));
    // camera: low across the collar, the dark mouth in front, his face above it; then it tips down into the hole
    const dive = ease(seg(lt, 1.6, dur)), hd = PEOPLE.head(b);
    const p0 = [lerp(3.0, 2.7, seg(lt, 0, 1.6)), FY + lerp(3.3, 2.9, seg(lt, 0, 1.6)), lerp(-3.1, -2.8, seg(lt, 0, 1.6))], p1 = [.1, FY + 3.4, -.2];
    const tg0 = [.1, FY + lerp(3.3, 2.7, bend), .5], tg1 = [0, FY + 1.7, 0];
    look(cam, lerp(50, 38, dive), lerp3(p0, p1, dive), lerp3(tg0, tg1, ease(seg(lt, 1.6, dur - .25))));
    const sk = skyFor(cam, L);
    draw3(S.o, cam, { fog: [140, 1300], fogCol: sk.low, near: .12, lineW: 1.9, lightTint: L.tint });
    // a breath of warm air off the hole
    steam(cam, [0, FY + 1.8, 0], lt + 1.2, 33, { n: 10, every: .22, life: 2.2, rise: 2.2, grow: .8, a: .16, r0: .3 });
    if (lt > dur - .38) { const [mx, my, md] = P3.project(cam, [0, FY + 1.74, 0]), r0 = .62 * pxPerFt(cam, md); hatchIris(mx, my, lerp(r0, 2300, easeIn(seg(lt, dur - .38, dur))), false); }
  }

  // =====================================================================================================
  // S4a · 59.91–62.02 · [11] "knocking on the roof": down the rods to the bit, the rods shuddering at each blow
  // S4b · 62.02–65.13 · [11] from below: the rock under the bit darkens toward red with every blow
  // =====================================================================================================
  function s4a(t, lt, dur) {
    const C = SECT(), SU = C.SU, cam = C.cam, d = 1082;
    sectPose(C, t, d, { casing: 900, heat: .5, heatTop: 1090, heatSpan: 160, shudder: .12 });
    // out of the dark mouth of the casing and down the rod string, past the beds, to the bit at work
    const k = ease(seg(lt, 0, 1.75)), dc = lerp(930, 1068, k), yc = SU.y(dc);
    look(cam, 40, [lerp(2.2, 7.5, k), yc + lerp(5, 3.2, k), lerp(4.5, 14, k)], [lerp(.2, .3, k), yc - lerp(9, .9, k), 0]);
    sectLight(C, [0, yc, 0], { dir: [60, 50, 62], sun: 3.2, fill: .55, bitL: 120 * hitK(t, 4) });
    C.bitL.position.set(0, SU.y(d) - .5, 2.2);
    sectBg();
    draw3(C.o, cam, { fog: [60, 200], fogCol: '#B0A48E', near: .3, far: 600, lineW: 1.8, lightTint: .6 });
    blowFx(C, cam, t, d, { glow: .25 });
    ruler3(cam, SU, -5.5, 900, 1200, d, { size: 30 });
    streaks(Math.sin(seg(lt, .1, 1.7) * Math.PI) * .45, 'v', 's4a');
    if (lt < .45) { const [cx, cy] = P3.project(cam, [0, SU.y(940), .8]); hatchIris(cx, cy, 2300 * easeIn(seg(lt, 0, .45)) + 2, true); }
  }
  function s4b(t, lt, dur) {
    const C = SECT(), SU = C.SU, cam = C.cam, d = 1088;
    // blow by blow the rock under the bit goes darker and redder: deeper is hotter
    const n = blowN(t) - blowN(62.03), H = clamp(.3 + .15 * n + .08 * hitK(t, 3));
    sectPose(C, t, d, { casing: 900, heat: H, heatTop: d - 2, heatSpan: lerp(90, 40, H), shudder: .14, bitHeat: H * .25 });
    SU.slot.visible = false;   // from below, lit by the glow at the bit, the flush groove reads as a pale sliver
    // camera: from under the roof: below the bit in the rock it is breaking, looking up the bore as it strikes down
    // toward us; at the end it pushes into the red under the bit (match cut to the forge's fire)
    const k = ease(seg(lt, 0, dur)), push = easeIn(seg(lt, dur - .9, dur)), by = SU.y(d);
    const sh = shakeXY(t, .12 * hitK(t, 10));
    look(cam, 50, [lerp(4.2, 3.2, k) - push * 2.4 + sh[0], by - lerp(9.5, 8.2, k) + push * 5.5 + sh[1], lerp(9.5, 8.4, k) - push * 5.5], [lerp(-.6, -.3, k), by + lerp(4, 3.4, k) - push * 3, 0]);
    sectLight(C, [0, by, 0], { dir: [-30, 60, 80], sun: lerp(2.4, 1.5, H), fill: lerp(.5, .32, H), bitL: 80 + 520 * H * (.5 + .5 * hitK(t, 4)) });
    C.bitL.position.set(0, by - 1.6, .9); C.bitL.distance = 12;
    sectBg(mixCol('#C8B89C', '#8A4A36', H), .45, .25);   // the far face up the bore fades to this
    draw3(C.o, cam, { fog: [40, 160], fogCol: mixCol('#8A7E6C', '#4A2A20', H), near: .3, far: 500, lineW: 1.8, lightTint: .7 });
    blowFx(C, cam, t, d, { glow: .35 + .9 * H + push * .8, glowCol: '#E4582A', dust: '#B89A80' });
    // each blow opens new cracks in the rock under the bit; they stay (the roof giving, blow by blow)
    const tipY = SU.y(d);
    for (let i = 0; i <= n; i++) {
      const grow = i < n ? 1 : easeOut(clamp(since(t) * 5));
      for (let j = 0; j < 3; j++) {
        const key = i * 7.3 + j * 2.1, a0 = (j / 3 + hash(key) * .3) * TAU, L = 1.4 + 2.4 * hash(key + 1);
        const pts = []; let x = Math.cos(a0) * .5, y = tipY - .15 + Math.sin(a0) * .3, a = a0;
        for (let q = 0; q <= 5; q++) { pts.push(P3.project(cam, [x, y, .12])); const st2 = L / 5 * grow; a += (hash(key + q * 3.1) - .5) * .9; x += Math.cos(a) * st2; y += Math.sin(a) * st2; }
        if (pts.every(p2 => p2[2] > .3)) { seed('Bcrk' + i + j); pline(pts.map(p2 => [p2[0], p2[1]]), 2.1, '#2A1A14', { over: 0, passes: 1, taper: .8 }); pline(pts.slice(0, 3).map(p2 => [p2[0], p2[1]]), .8, '#E0582A', { over: 0, passes: 1, alpha: .5 * H }); }
      }
    }
    if (push > 0) { seed('Bred'); ptone(rectPts(-40, -40, W + 80, H + 80), '#8E2A1E', push * .55); pglow(W / 2, H * .55, 900, '#FF6A2A', push * .7); }
  }

  // =====================================================================================================
  // S5 · 65.13–66.60 · [12] dusk, the forge: the dresser draws a white-hot bit out of the fire
  // S6 · 66.60–69.90 · [12] dressed on the anvil: the labourer holds it in the tongs, sledge on the beat, sparks
  // S7 · 69.90–71.90 · [13] quenched at the edge: a column of steam boils up under the shed roof
  // S8 · 71.90–73.77 · [13] the dresser carries it back to the rig
  // =====================================================================================================
  // the bit lying in the fire along z, pin end out toward the dresser; he pulls it out along +z with the tongs
  const FIRE_PIN = [-29.05, 3.42, 10.15];
  function s5(t, lt, dur) {
    const S = SITE(), U = S.U, cam = S.cam, L = TOD.dusk;
    resetSite(S); lightOn(S.o, L, [-26, 0, 9]); duskLamps(S, t);
    rig(S, t); S.trees.visible = false;
    const pull = ease(seg(lt, .28, 1.12)), turn = easeIn(seg(lt, 1.1, dur + .25));
    const pin = [FIRE_PIN[0] + turn * .9, FIRE_PIN[1] + turn * .35, FIRE_PIN[2] + pull * 2.4];
    const yd = nrm([turn * .55, 0, -1]);
    S.bit.visible = true; orient(S.bit, pin, yd, [1, 0, 0]); bitHeat(S.bit, .97);
    const J = bitPt(S.bit, 1.05), u = nrm([turn * .7, .5, 1]);
    const dz = S.cast.dresser, lean = ease(seg(lt, .2, .6)) * (1 - turn * .4);
    show(dz, [FIRE_PIN[0] - .1 + turn * .5, 0, 12.3 + pull * 1.5], Math.PI + turn * .5, 'Idle_Loop', t * .8 + .6);
    PEOPLE.turn(dz, 'spine_01', [-.16 * lean, 0, 0]); PEOPLE.turn(dz, 'spine_02', [.12, 0, 0]); PEOPLE.turn(dz, 'Head', [.25, 0, 0]);
    holdTongs(dz, S.tongs, J, u);
    S.bitL.position.set(...bitPt(S.bit, 2.5)); S.bitL.intensity = 700;
    // camera: at the side of the hearth, just above the coals: the bit comes out of the fire across the frame toward
    // him, and the fire lights his face from below
    const k = ease(lt / dur);
    look(cam, 44, [lerp(-34.6, -34.2, k), lerp(4.05, 4.15, k), lerp(6.4, 6.9, k)], [lerp(-28.6, -28.4, k), lerp(4.35, 4.55, k), lerp(9.4, 10.2, k)]);
    const sk = skyFor(cam, L);
    draw3(S.o, cam, { fog: [60, 700], fogCol: sk.low, near: .3, lineW: 2, lightTint: L.tint });
    forgeGlow(S, cam, t, 1.1); hotGlow(cam, S, .97, 1);
    if (lt > .3 && lt < 1.3) sparks(cam, bitPt(S.bit, 2.9), frac((lt - .3) / .5) * .5, 50 + Math.floor((lt - .3) / .5), { n: 10, speed: 5, up: .7, life: .5, w: 2 });
    // match cut out of the red under the bit (S4b): the red lifts off the fire
    if (lt < .35) { const q = 1 - easeOut(lt / .35), [fx, fy] = P3.project(cam, bitPt(S.bit, 2.4)); seed('Bred5'); ptone(rectPts(-40, -40, W + 80, H + 80), '#8E2A1E', q * .55); pglow(fx, fy, 900, '#FF6A2A', q * .7); }
  }
  // the anvil set-up: the bit across the face, edge to -x; the labourer at the pin end holding it in the tongs
  const AN = { pin: [-21.45, 3.3, 9.0], dir: [-1, 0, 0] };
  function anvilScene(S, t, o = {}) {
    const U = S.U;
    S.bit.visible = true; orient(S.bit, AN.pin, AN.dir, [0, 0, 1]);
    const h = o.heat ?? .9; bitHeat(S.bit, h);
    const lab = S.cast.lab; show(lab, [-18.95, 0, 9.35], -Math.PI / 2 - .08, 'Idle_Loop', t * .9 + 1.1);
    PEOPLE.turn(lab, 'spine_01', [.2, 0, 0]); PEOPLE.turn(lab, 'spine_02', [.12, 0, 0]); PEOPLE.turn(lab, 'Head', [.22, 0, 0]);
    const jolt = .04 * hitK(t, 12);
    holdTongs(lab, S.tongs, add3(bitPt(S.bit, 1.15), [0, jolt, 0]), nrm([1, .38, .08]));
    // the dresser: a true two-handed stroke landing on the blade on the beat
    const tgt = add3(bitPt(S.bit, 2.95), [0, .12, 0]), dz = S.cast.dresser, st = PROPS.swingStand(dz, tgt, 0);
    show(dz, st, 0, 'Idle_Loop', t * .8 + .3);
    S.sledge.visible = true;
    const k = o.k ?? frac(bpOf(t) / 2), sw = PROPS.swing(dz, S.sledge, k, { target: tgt, back: .5 });
    S.bitL.position.set(...add3(tgt, [0, .6, .4])); S.bitL.intensity = 500 * h + 400 * hitK(t, 8);
    return { tgt, sw, h };
  }
  function s6(t, lt, dur) {
    const S = SITE(), cam = S.cam, L = TOD.dusk;
    resetSite(S); lightOn(S.o, L, [-24, 0, 8]); duskLamps(S, t);
    rig(S, t); S.trees.visible = true;
    const h = lerp(.93, .7, seg(lt, 0, dur)) + .06 * hitK(t, 6);
    const A = anvilScene(S, t, { heat: h });
    // camera: over the labourer's left shoulder, down his tongs to the glowing bit, the dresser's stroke beyond against
    // the sunset; it whips right at the end (to the tub)
    const k = ease(seg(lt, 0, dur)), whip = easeIn(seg(lt, dur - .22, dur));
    const tg = [lerp(-24.3, -24.1, k) + whip * 5, lerp(4.7, 4.5, k) - whip * .5, lerp(6.0, 6.4, k) + whip * 3.5];
    look(cam, 42, [lerp(-20.9, -21.3, k), lerp(4.4, 4.2, k), lerp(14.5, 13.9, k)], tg);
    const sk = skyFor(cam, L);
    draw3(S.o, cam, { fog: [80, 900], fogCol: sk.low, near: .3, lineW: 1.9, lightTint: L.tint });
    forgeGlow(S, cam, t, .8); lampGlows(S, cam, { f: 1 }); hotGlow(cam, S, h);
    const age = since(t), n = blowN(t);
    if (blowAt(n) > 66.8) { sparks(cam, A.tgt, age, n * 3.1, { n: 34, speed: 17, up: .42, life: .6 }); const [x, y, d] = P3.project(cam, A.tgt); seed('Bflash'); if (d > .3) pglow(x, y, pxPerFt(cam, d) * 2.4 * hitK(t, 14), '#FFE2A0', hitK(t, 10)); }
    streaks(Math.min(1, whip * 1.15), 'h', 's6');
  }
  function s7(t, lt, dur) {
    const S = SITE(), cam = S.cam, L = TOD.dusk, U = S.U;
    resetSite(S); lightOn(S.o, L, [-22, 0, 11]); duskLamps(S, t);
    rig(S, t);
    // the edge goes into the water: tongs on the shank, the bit tipped down over the tub
    const dip = ease(seg(lt, .32, .55)), q = U.quench;
    const edge = [q[0] + .1, lerp(2.35, 1.2, dip), q[2] + .05], ydir = nrm([1, lerp(-.25, -.62, dip), .02]);
    const pin = add3(edge, ydir, -3.33);
    S.bit.visible = true; orient(S.bit, pin, ydir, [0, 0, 1]);
    const heat = lt < .5 ? .68 : lerp(.5, .16, easeOut(seg(lt, .5, 1.1))); bitHeat(S.bit, heat);
    const dz = S.cast.dresser, dpos = [pin[0] - 3.35, 0, pin[2] + .55];
    show(dz, dpos, Math.PI / 2 + .12, 'Idle_Loop', t * .8 + 2.2);
    PEOPLE.turn(dz, 'spine_01', [.22 + .12 * dip, 0, 0]); PEOPLE.turn(dz, 'spine_02', [.12, 0, 0]); PEOPLE.turn(dz, 'Head', [.2, -.35 * seg(lt, .6, 1), 0]);
    holdTongs(dz, S.tongs, bitPt(S.bit, 1.1), nrm([-1, .28 + .2 * dip, -.05]));
    S.bitL.position.set(...add3(pin, ydir, 2.6)); S.bitL.intensity = 520 * heat;
    // camera: outside the open side of the shed, a post framing the right; the bit crosses the frame into the tub, the
    // dusk beyond; the whip from S6 arrives from the left, and the steam fills the frame at the end
    const arrive = 1 - easeOut(seg(lt, 0, .24)), k = ease(seg(lt, 0, dur)), fill = easeIn(seg(lt, dur - .45, dur));
    look(cam, 44, [lerp(-24.0, -24.4, k), lerp(4.5, 4.7, k) + fill, lerp(21.8, 20.8, k)], [lerp(-23.9, -23.7, k) - arrive * 4, lerp(3.0, 3.6, k) + fill * 2, 12.0]);
    const sk = skyFor(cam, L);
    draw3(S.o, cam, { fog: [80, 900], fogCol: sk.low, near: .3, lineW: 1.9, lightTint: L.tint });
    forgeGlow(S, cam, t, .7); lampGlows(S, cam, { f: 1 }); hotGlow(cam, S, heat);
    if (lt > .5) {
      const a = lt - .5;
      steam(cam, [q[0], 1.9, q[2]], a, 71, { n: 34, every: .04, life: 2.2, rise: 8, grow: 2.7, a: .58, r0: .7, ceil: 8.0, spread: 1.6, wind: .55, col: '#F4E4D2' });
      steam(cam, [q[0], 1.95, q[2]], a * 1.4, 72, { n: 8, every: .03, life: .5, rise: 3, grow: 3.2, a: .5 * Math.exp(-a * 2), r0: .3, spread: 3, wind: 0, col: '#FFF4E6' });
      const [sx, sy, sd] = P3.project(cam, [q[0], 2.2, q[2]]); if (sd > .3) { seed('Bqf'); pglow(sx, sy, pxPerFt(cam, sd) * 3 * Math.exp(-a * 3), '#FFB060', .7 * Math.exp(-a * 2.5)); }
    }
    streaks(Math.min(1, arrive * 1.15), 'h', 's7');
    steamWipe(fill, 's7');
  }
  function s8(t, lt, dur) {
    const S = SITE(), cam = S.cam, L = TOD.dusk, U = S.U;
    resetSite(S); lightOn(S.o, L, [-14, 0, 10]); duskLamps(S, t);
    rig(S, t);
    // out of the steam: he walks from the shed toward the rig with the dressed bit, the forge glowing behind him
    const head = nrm([.93, 0, -.37]), yaw = Math.atan2(head[0], head[2]), p0 = [-21.2, 0, 13.5];
    const pos = add3(p0, head, lt * 3.6);
    const dz = S.cast.dresser; show(dz, pos, yaw, 'Walk_Carry_Loop', t * 1.05 + .4);
    // the bit across his forearms, where his hands are
    const hl = hand(dz, 'l'), hr = hand(dz, 'r'), mid = add3(lerp3(hl, hr, .5), [0, .18, 0]), across = nrm([hl[0] - hr[0], hl[1] - hr[1], hl[2] - hr[2]]);
    S.bit.visible = true; orient(S.bit, add3(mid, across, -1.55), across, [0, 1, 0]); bitHeat(S.bit, 0);
    fist(dz, 'l', .5); fist(dz, 'r', .5);
    // the labourer at the anvil behind him
    show(S.cast.lab, [-24.9, 0, 8.0], 1.2, 'Idle_Loop', t * .9 + 3.1);
    // camera: low by the derrick's back leg, looking back at the shed; he walks into a close shot
    const k = ease(lt / dur), hd = PEOPLE.head(dz);
    look(cam, 36, [lerp(-7.4, -7.8, k), lerp(2.6, 3.0, k), lerp(11.2, 10.8, k)], [lerp(-18, -16, k), lerp(4.2, hd.y - .6, k), lerp(12.8, 11.9, k)]);
    const sk = skyFor(cam, L);
    draw3(S.o, cam, { fog: [100, 1000], fogCol: sk.low, near: .3, lineW: 1.9, lightTint: L.tint });
    forgeGlow(S, cam, t, .9); lampGlows(S, cam, { f: 1 });
    steam(cam, [U.quench[0], 1.9, U.quench[2]], lt + 2.3, 71, { n: 34, every: .04, life: 2.2, rise: 8, grow: 2.7, a: .5, r0: .7, ceil: 8.0, spread: 1.6, wind: .55, col: '#F4E4D2' });
    steamWipe(1 - easeOut(seg(lt, 0, .5)), 's8');
  }

  // =====================================================================================================
  // C1 · 73.77–75.76 · [14] "Sinking down": the rig at dusk from under the walking beam
  // C2 · 75.76–78.04 · [15] the forge keeping time with the rig, from above
  // C3 · 78.04–80.18 · [16] the driller at the tiller, feeling each blow; the page turns to the section
  // =====================================================================================================
  function c1(t, lt, dur) {
    const S = SITE(), cam = S.cam, L = TOD.dusk, U = S.U;
    resetSite(S); lightOn(S.o, L, [14, 0, 0]); duskLamps(S, t);
    rig(S, t);
    const ty = U.tillerAt[1];
    show(S.cast.driller, [2.3, FY, 1.6], -Math.PI / 2 - .55, 'Idle_Loop', t + .7);
    PEOPLE.reach(S.cast.driller, 'r', [1.3, ty, .25], [3, ty - 1.5, 2.5]); PEOPLE.reach(S.cast.driller, 'l', [1.55, ty, -.35], [3, ty - 1.5, -1.5]);
    show(S.cast.bill, [U.firebox[0] - 1.4, 0, U.firebox[2] + 2.3], Math.PI - .5, 'Idle_Loop', t * .9 + 2.1);
    // the dresser arriving from the forge with the dressed bit on his shoulder
    // he walks up to the corner of the derrick floor and stops there with it (legs settle to a stand; arms keep the carry)
    const dz = S.cast.dresser, head = nrm([.93, 0, -.37]), dist = Math.min(5.4 + lt * 3.6, 9.2), stop = ease(seg(lt, .85, 1.35));
    const pos = add3([-21.2, 0, 13.5], head, dist), tw = t * 1.05 + .4, tStop = 73.4 + 1.05 * 1.05 + .4;
    show(dz, pos, Math.atan2(head[0], head[2]), 'Walk_Carry_Loop', lerp(tw, tStop, stop));
    if (stop > 0) PEOPLE.clip(dz, 'Idle_Loop', t * .8, { w: stop, skip: ['upperarm', 'lowerarm', 'hand', 'clavicle', 'index', 'middle', 'ring', 'pinky', 'thumb'] });
    const hl = hand(dz, 'l'), hr = hand(dz, 'r'), mid = add3(lerp3(hl, hr, .5), [0, .18, 0]), across = nrm([hl[0] - hr[0], hl[1] - hr[1], hl[2] - hr[2]]);
    S.bit.visible = true; orient(S.bit, add3(mid, across, -1.55), across, [0, 1, 0]);
    // camera: low, out on the plain in front of the plant, looking into the afterglow: the derrick, the walking beam
    // rocking on its samson post and the engine in silhouette; a slow crab to the right
    const k = ease(seg(lt, 0, dur));
    look(cam, 38, [lerp(-12, -8, k), 2.4, lerp(60, 58, k)], [lerp(13, 14.5, k), 16.5, -4]);
    const sk = skyFor(cam, L, { hatch: .8 });
    draw3(S.o, cam, { fog: [120, 1200], fogCol: sk.low, near: .3, lineW: 1.7, lightTint: L.tint });
    lampGlows(S, cam, { d: 1, fire: 1 }); stackSmoke(S, cam, t, { col: '#6E625E', a: .5 });
    const hit = hitK(t, 9), [hx, hy, hd] = P3.project(cam, U.hole); if (hit > .05 && hd > .3) { seed('Bc1d'); psmoke(hx, hy, pxPerFt(cam, hd) * (.8 + 1.2 * (1 - hit)), AP.dust, .5 * hit); }
  }
  // C2a-c: three shots, a stroke each, cut on the blows so every cut lands on an impact: the forge, the rig, the forge
  function forgeSet(S, t, L) {
    resetSite(S); lightOn(S.o, L, [-24, 0, 8]); duskLamps(S, t);
    rig(S, t);
    const h = .84 + .08 * hitK(t, 6);
    return { h, A: anvilScene(S, t, { heat: h }) };
  }
  function blowSparks(S, cam, t, A, h, o = {}) {
    forgeGlow(S, cam, t, o.forge ?? 1); lampGlows(S, cam, { f: 1 }); hotGlow(cam, S, h);
    const age = since(t), n = blowN(t);
    sparks(cam, A.tgt, age, n * 3.1 + 7, { n: o.n ?? 40, speed: 16, up: .45, life: .6, w: o.w ?? 2.4 });
    const [x, y, d] = P3.project(cam, A.tgt); seed('Bflash2'); if (d > .3) pglow(x, y, pxPerFt(cam, d) * 2.4 * hitK(t, 14), '#FFE2A0', hitK(t, 10));
  }
  function c2a(t, lt, dur) {
    const S = SITE(), cam = S.cam, L = TOD.dusk, { h, A } = forgeSet(S, t, L);
    // camera: low across the anvil face from the tub side; the dresser beyond it swinging toward us, the tongs from
    // the right, the forge glowing at the left
    const k = ease(seg(lt, 0, dur));
    look(cam, 42, [lerp(-27.7, -27.4, k), lerp(4.6, 4.7, k), lerp(14.6, 14.2, k)], [lerp(-24.3, -24.2, k), lerp(4.5, 4.6, k), lerp(8.0, 7.9, k)]);
    const sk = skyFor(cam, L);
    draw3(S.o, cam, { fog: [80, 900], fogCol: sk.low, near: .3, lineW: 2, lightTint: L.tint });
    blowSparks(S, cam, t, A, h, { n: 46, w: 3 });
  }
  function c2b(t, lt, dur) {
    const S = SITE(), cam = S.cam, L = TOD.dusk, U = S.U;
    resetSite(S); lightOn(S.o, L, [0, 8, 0]); duskLamps(S, t);
    rig(S, t);
    const ty = U.tillerAt[1], dr = S.cast.driller;
    show(dr, [2.3, FY, 1.6], -Math.PI / 2 - .55, 'Idle_Loop', t + .7);
    PEOPLE.reach(dr, 'r', [1.3, ty, .25], [3, ty - 1.5, 2.5]); PEOPLE.reach(dr, 'l', [1.55, ty, -.35], [3, ty - 1.5, -1.5]);
    fist(dr, 'r', .8); fist(dr, 'l', .8);
    // camera: low on the derrick floor, looking up the rod string to the temper screw and the well end of the walking
    // beam against the dusk; it rises with the lift and drops with the blow
    const st = RIG.strokeAt(t), lift = st < .75 ? Math.sin(st / .75 * Math.PI / 2) : 1 - Math.pow((st - .75) / .25, 2), sh = shakeXY(t, .05 * hitK(t, 12));
    look(cam, 50, [-2.9 + sh[0], FY + 1.3 + sh[1], 2.7], [.3, FY + 9 + lift * 1.2, -.4]);
    const sk = skyFor(cam, L);
    draw3(S.o, cam, { fog: [100, 1000], fogCol: sk.low, near: .3, lineW: 1.9, lightTint: L.tint });
    lampGlows(S, cam, { d: 1 });
    const hit = hitK(t, 9), [hx, hy, hd] = P3.project(cam, [0, FY + 1.8, 0]); if (hit > .05 && hd > .3) { seed('Bc2d'); psmoke(hx, hy, pxPerFt(cam, hd) * (.5 + .9 * (1 - hit)), AP.dust, .5 * hit); }
  }
  function c2c(t, lt, dur) {
    const S = SITE(), cam = S.cam, L = TOD.dusk, { h, A } = forgeSet(S, t, L);
    // camera: low at the dresser's right, looking up at him against the afterglow, the fire on his face; the sledge
    // goes up out of frame and comes down through it
    const dz = S.cast.dresser, hd = PEOPLE.head(dz), k = ease(seg(lt, 0, dur));
    look(cam, 40, [hd.x - lerp(1.8, 1.6, k), lerp(3.3, 3.4, k), hd.z + lerp(5.4, 5.0, k)], [hd.x + .1, hd.y - .6, hd.z]);
    const sk = skyFor(cam, L);
    draw3(S.o, cam, { fog: [80, 900], fogCol: sk.low, near: .3, lineW: 2, lightTint: L.tint });
    blowSparks(S, cam, t, A, h, { n: 30, forge: .7 });
  }
  function c3(t, lt, dur) {
    const S = SITE(), cam = S.cam, L = TOD.dusk, U = S.U;
    resetSite(S); lightOn(S.o, L, [0, 0, 0], 1.9); duskLamps(S, t);
    // the tiller clamped at her waist: it rides the rods up through the lift and drops with them on the blow; at the
    // top of each stroke, when the tools go light, she pushes the string round a little (Boyd 1894)
    const st = RIG.strokeAt(t), n = blowN(t) - blowN(79.12), tu = -.5 + .05 * (n + ease(seg(st, .55, .74)));
    rig(S, t, { turn: tu });
    const lift = st < .75 ? Math.sin(st / .75 * Math.PI / 2) : 1 - Math.pow((st - .75) / .25, 2), ty = FY + 3.25 + lift * .9;
    U.tiller.position.y = ty; U.tiller.updateMatrixWorld(true);
    const d = [Math.cos(tu), 0, -Math.sin(tu)], bar = s2 => [d[0] * s2, ty + .12, d[2] * s2];
    // she stands square to the bar, beside its end, facing into the dusk light
    const d0 = [Math.cos(-.5), 0, -Math.sin(-.5)], f = [d0[2], 0, -d0[0]], P = [d0[0] * 1.6 - f[0] * 1.05, FY, d0[2] * 1.6 - f[2] * 1.05];
    const dr = S.cast.driller;
    show(dr, P, Math.atan2(f[0], f[2]), 'Idle_Loop', t * .9 + .7);
    const feel = hitK(t, 7);
    PEOPLE.turn(dr, 'spine_02', [.16 + .05 * feel, 0, 0]); PEOPLE.turn(dr, 'Head', [.02 - .06 * feel, 0, .02 * feel]);
    const pole = (k2, back) => { const q = add3(add3(P, d0, k2), f, back); return [q[0], ty - 1.3, q[2]]; };
    PEOPLE.reach(dr, 'r', bar(2.05), pole(1.5, -.4)); PEOPLE.reach(dr, 'l', bar(1.2), pole(-1.3, -.4));
    fist(dr, 'r', .9); fist(dr, 'l', .9);
    // camera: in front of her, low, the rod string rising at the left of frame and the lantern on the leg behind her;
    // at the end it tilts down the rods to the hole
    const k = ease(seg(lt, 0, dur)), down = ease(seg(lt, 1.3, dur)), turn = easeIn(seg(lt, dur - .35, dur)), hd = PEOPLE.head(dr);
    const C = add3(add3(P, f, lerp(4.9, 4.4, k)), d0, -.45);
    const tg0 = [hd.x, lerp(hd.y - .95, hd.y - .8, k), hd.z], tg1 = [0, FY + 2.0, 0];
    look(cam, 44, [C[0], FY + lerp(3.75, 4.4, down), C[2]], lerp3(tg0, tg1, down));
    const sk = skyFor(cam, L);
    draw3(S.o, cam, { fog: [100, 1000], fogCol: sk.low, near: .3, lineW: 2, lightTint: L.tint });
    lampGlows(S, cam, { d: 1 });
    if (turn > 0) pageTurn(turn * .5, -1);
  }

  // =====================================================================================================
  // C4 · 80.18–85.83 · [16–17] the section: down through the fossil beds of the old inland sea to ~1,400 ft
  // =====================================================================================================
  function c4(t, lt, dur) {
    const C = SECT(), SU = C.SU, cam = C.cam;
    // the bit drills on down (time-lapse); the camera rides with it and eases to a hold on each fossil as the bore
    // passes it: an ammonite at 1,260 ft, another at 1,330, then the ichthyosaur at 1,380, right beside the bore
    const d = kf(t, [[81.9, 1190], [82.85, 1252], [83.95, 1318], [85.0, 1376], [85.7, 1400]], ease);
    sectPose(C, t, d, { casing: 1000, heat: .55, heatTop: d - 30, shudder: .1, bitHeat: .15 });
    const fx = kf(d, [[1185, -5], [1252, -13], [1318, 11], [1376, -8], [1400, -6]], ease);
    const ty = SU.y(d) + 1;
    look(cam, 36, [fx - 16, ty + 6, 35], [fx + 1, ty - 1.2, 0]);
    sectLight(C, [fx, ty, 0], { dir: [-95, 30, 30], sun: 3.3, fill: .5, pool: 220, bitL: 60 + 160 * hitK(t, 5) });
    C.poolL.position.set(fx - 4, ty + 4, 10); C.bitL.position.set(0, SU.y(d) - .8, 2.2); C.bitL.distance = 7;
    sectBg();
    draw3(C.o, cam, { fog: [60, 200], fogCol: '#9A8E7C', near: 1, far: 800, lineW: 1.8, lightTint: .6 });
    // each fossil lit as the bore passes it, like a lamp held up to the face of the cutting
    let sx = 0, sy = 0, sw = 0;
    for (const f of SU.fossils.children) {
      const fp = f.position, fd = -fp.y / SU.VS, near = ease(1 - clamp(Math.abs(fd - d) / 60)), [x, y, dd] = P3.project(cam, [fp.x, fp.y, 1]);
      if (near > .02 && dd > .3) { seed('Bfos' + fd); pglow(x, y, pxPerFt(cam, dd) * (f.children.length > 10 ? 12 : 5), '#FFE0A8', .7 * near); sx += x * near; sy += y * near; sw += near; }
    }
    // the light pools on whatever the bore is passing: the fossil, weighted with the bit
    const [bx2, by2] = P3.project(cam, [0, SU.y(d), 1]);
    spot((sx + bx2 * .6) / (sw + .6), (sy + by2 * .6) / (sw + .6), 520 + 160 * Math.min(1, sw), .55);
    blowFx(C, cam, t, d, { glow: .35 });
    ruler3(cam, SU, fx - 16, 1100, 1500, d);
    if (lt < .35) pageTurn(.5 + lt / .7, -1);
    if (lt > dur - .35) scribbleWipe((lt - (dur - .35)) / .7);
  }

  shots([[51.30, s1], [53.46, s2], [55.57, s3a], [57.50, s3b], [59.91, s4a], [62.02, s4b], [65.13, s5], [66.82, s6], [70.03, s7], [71.90, s8], [73.40, c1], [75.91, c2a], [76.975, c2b], [78.04, c2c], [79.11, c3], [81.90, c4]]);
})();
