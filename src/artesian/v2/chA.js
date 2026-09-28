// Chapter A (v2) · 0.00–51.30 s · Drought. See docs/artesian/STORYBOARD.md and BRIEF.md.
// Workaround: lib.js waits on `window.PEOPLE`, but PEOPLE is a top-level const (not a window property), so setup can
// finish before the cast, clips and animals have loaded. Wait for them here too.
if (typeof setup === 'function' && !window.__A_waitPeople) {
  window.__A_waitPeople = true;
  const _setupA = setup;
  setup = async function () { await _setupA(); if (typeof PEOPLE !== 'undefined') { window.ready = false; await PEOPLE.ready; window.ready = true; } };
}
(() => {
  // ================================================================ helpers (chapter-local)
  const nrm = a => { const l = Math.hypot(...a) || 1; return a.map(v => v / l); };
  const lerp3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
  const v2a = v => [v.x, v.y, v.z];
  // Catmull-Rom through points (arrays), k 0..1 over the whole path
  function path(P, k) {
    const n = P.length - 1, f = clamp(k) * n, i = Math.min(n - 1, Math.floor(f)), u = f - i;
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(n, i + 2)];
    return p1.map((_, j) => { const a = p0[j], b = p1[j], c = p2[j], d = p3[j]; return .5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u); });
  }
  // aim the sun (a directional light) at a target, with a shadow box of half-size `size`
  function aimSun(o, dir, target, size, dist = 300) {
    const d = nrm(dir), s = o.sun;
    s.position.set(target[0] + d[0] * dist, target[1] + d[1] * dist, target[2] + d[2] * dist);
    s.target.position.set(...target); s.target.updateMatrixWorld();
    const c = s.shadow.camera; c.left = -size; c.right = size; c.top = size; c.bottom = -size; c.near = 1; c.far = dist * 2 + size; c.updateProjectionMatrix();
  }
  // the sun's disc on screen, from the light direction (null when behind the camera)
  function sunScreen(cam, dir) { const p = cam.position, d = nrm(dir); const [x, y, z] = P3.project(cam, [p.x + d[0] * 4000, p.y + d[1] * 4000, p.z + d[2] * 4000]); return z > 0 ? [x, y] : null; }
  function lens(cam, fov) { if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); } }
  // a hand to a point, blended from wherever the clip put it (w 0..1)
  function reachW(p, s, target, pole, w = 1) {
    if (w <= 0) return; const h = PEOPLE.hand(p, s);
    PEOPLE.reach(p, s, w >= 1 ? target : [lerp(h.x, target[0], w), lerp(h.y, target[1], w), lerp(h.z, target[2], w)], pole);
  }

  // rotate a bone about a world-space axis (after the clip and IK)
  function rotW(p, name, axis, a) {
    const b = p.bones[name], qw = new THREE.Quaternion(), qp = new THREE.Quaternion();
    b.getWorldQuaternion(qw); b.parent.getWorldQuaternion(qp);
    const r = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(...axis).normalize(), a);
    b.quaternion.copy(qp.invert().multiply(r.multiply(qw))); p.root.updateMatrixWorld(true);
  }
  // open a hand flat (fingers back to the bind pose)
  function openHand(p, s) { for (const [k, b] of Object.entries(p.bones)) if (/^(index|middle|ring|pinky|thumb)_0[123]_/.test(k) && k.endsWith('_' + s)) b.quaternion.copy(p.rest[k].q); p.root.updateMatrixWorld(true); }
  // ---- offscreen layers: run a draw with the pencil layer X redirected into a spare canvas ----
  const LAY = [];
  function lay(i) { if (!LAY[i]) { const c = document.createElement('canvas'); c.width = W; c.height = H; LAY[i] = c.getContext('2d'); } return LAY[i]; }
  function into(i, fn) {
    const L = lay(i), keep = X;
    L.setTransform(1, 0, 0, 1, 0, 0); L.globalAlpha = 1; L.globalCompositeOperation = 'source-over'; L.clearRect(0, 0, W, H);
    X = L; try { fn(); } finally { X = keep; ZOOM = 1; PCAM = null; }
    return L;
  }
  // a reveal mask of pencil strokes laid in the hand direction; order(x, y) → 0..1 says when each spot is reached
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
  function maskedOut(L, M) { L.save(); L.setTransform(1, 0, 0, 1, 0, 0); L.globalCompositeOperation = 'destination-out'; L.drawImage(M.canvas, 0, 0); L.restore(); }
  function masked(L, M) { L.save(); L.setTransform(1, 0, 0, 1, 0, 0); L.globalCompositeOperation = 'destination-in'; L.drawImage(M.canvas, 0, 0); L.restore(); }
  function stamp(L, a = 1) { X.save(); X.setTransform(1, 0, 0, 1, 0, 0); X.globalAlpha = a; X.drawImage(L.canvas, 0, 0); X.restore(); }
  // a whole shot drawn into a layer (for dissolves and redraws between shots)
  const shotInto = (i, fn, t, t0, dur) => into(i, () => fn(t, t - t0, dur));
  // vertical motion smear: the layer laid down several times along dy (a whip tilt)
  function smear(L, dy, a = 1) {
    const n = Math.max(1, Math.min(9, Math.round(Math.abs(dy) / 14)));
    X.save(); X.setTransform(1, 0, 0, 1, 0, 0);
    for (let i = 0; i < n; i++) { X.globalAlpha = a * (i ? .5 / n + .1 : 1) ; X.drawImage(L.canvas, 0, dy * i / n); }
    X.restore();
  }
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

  // ---- a perched crow in 3D (faces +z; feet at the origin) ----
  function crow3() {
    const g = new THREE.Group(), C = '#2A2522';
    const put = (par, geo, p, r = [0, 0, 0], s = [1, 1, 1]) => { const x = P3.mesh(geo, C); x.position.set(...p); x.rotation.set(...r); x.scale.set(...s); par.add(x); return x; };
    const body = new THREE.Group(); body.position.set(0, .34, 0); body.rotation.x = -.45; g.add(body);
    put(body, new THREE.IcosahedronGeometry(.3, 1), [0, 0, 0], [0, 0, 0], [.72, .7, 1.25]);
    for (const sd of [-1, 1]) put(body, P3.box(.08, .26, .72), [sd * .19, .04, -.12], [.05, sd * .06, 0]);
    put(body, P3.box(.2, .04, .55), [0, -.02, -.6], [-.25, 0, 0]);
    const head = new THREE.Group(); head.position.set(0, .62, .2); g.add(head);
    put(head, new THREE.IcosahedronGeometry(.15, 1), [0, 0, 0], [0, 0, 0], [.9, .95, 1.1]);
    put(head, new THREE.ConeGeometry(.055, .26, 6), [0, -.02, .22], [Math.PI / 2, 0, 0]);
    for (const sd of [-1, 1]) put(g, P3.cyl(.015, .015, .3, 4), [sd * .06, .1, 0]);
    g.userData.head = head; g.userData.body = body; g.scale.setScalar(1.8);
    return g;
  }

  // ================================================================ the station (the film opens here; chapter H rhymes it)
  // Station compass: the dawn sun is low in the east, toward -z (a little +x) of the waterhole.
  const SUN_ST = [.32, .25, -1];
  const HOUSE = { pos: [-52, 0, -120], yaw: .35 };
  const COW_AT = [-3, 0, -2], COW_YAW = -Math.PI / 2 - .1, COW_CAM = [[-10.4, .55, 20.9], [-8.6, 7.7, -10.1], [-9.7, .5, 18.9], [-8.2, 7.5, -10.1]];
  const hq = (x, y, z) => { const c = Math.cos(HOUSE.yaw), s = Math.sin(HOUSE.yaw); return [HOUSE.pos[0] + x * c + z * s, y, HOUSE.pos[2] - x * s + z * c]; };
  const STATION = () => P3.cached('A-station', () => {
    const o = P3.scene({ sunDir: [96, 60, -300], sun: 5.2, fill: 1.25, shadowSize: 160 });
    o.sun.color.set('#FFE6BE'); o.fill.color.set('#FFF3DC'); o.fill.groundColor.set('#A88A60');
    const st = WORLD.stationSet({ col: '#DCC296' }); o.scene.add(st);
    st.userData.ground.scale.y = .3;                               // a flatter plain: long low light rakes it without mottling
    WORLD.trees(o.scene, 46, { r0: 190, r1: 1500, dead: .8, seed: 7 });
    // the starving cow: model is built large, so scale it to a real beast; gaunt through the barrel and flank
    const cow = PEOPLE.beast('cow', '#A77A52', { scale: .31 });
    const cols = { Cube: '#9C7250', Cube_1: '#D6C6A8', Cube_2: '#3A302A', Cube_3: '#B58878', Cube_4: '#2A2320', Cube_5: '#2A2320', Cube_6: '#E2D6BC' };
    cow.root.traverse(ob => { if (ob.isMesh && cols[ob.name]) ob.material = P3.mat(cols[ob.name]); });
    for (const [b, sx, sz] of [['Torso', .76, .8], ['Back', .82, .84]]) { cow.bones[b].scale.set(sx, 1, sz); cow.rest[b].s.set(sx, 1, sz); }
    cow.bones.Neck1.scale.set(1 / .76 * .85, 1, 1 / .8 * .85); cow.rest.Neck1.s.set(1 / .76 * .85, 1, 1 / .8 * .85);
    o.scene.add(cow.root);
    // perches: along the dead coolibah's limbs, chosen so that in the low shot against the sun ([0]) each bird stands
    // against the sky, clear of the trunk and of each other
    const cand = [];
    st.userData.dead.traverse(ob => {
      if (!ob.isMesh || !ob.geometry.parameters) return;
      const L = ob.geometry.parameters.height, d = new THREE.Vector3(0, 1, 0).applyQuaternion(ob.quaternion), c = ob.position;
      if (Math.abs(d.y) > .9 || ob.geometry.parameters.radiusBottom < .06) return;
      for (const f of [-.3, -.1, .1, .3]) { const p = c.clone().add(d.clone().multiplyScalar(L * f)); cand.push([p.x, p.y + ob.geometry.parameters.radiusTop * 1.1, p.z]); }
    });
    const pc = P3.cam(54); P3.look(pc, COW_CAM[0], COW_CAM[1], -.012);
    const tr = P3.project(pc, [st.userData.at.tree[0], 10, st.userData.at.tree[1]]);
    const scored = cand.map(p => { const [x, y, z] = P3.project(pc, p); return { p, x, y, ok: z > 0 && y > 70 && y < 430 && x > 120 && x < 1800 && Math.abs(x - tr[0]) > 130 }; }).filter(q => q.ok).sort((a, b) => a.y - b.y);
    const pick = [];
    for (const q of scored) { if (pick.every(r => Math.hypot(r.x - q.x, r.y - q.y) > 150)) pick.push(q); if (pick.length === 3) break; }
    while (pick.length < 3 && cand.length) pick.push({ p: cand[pick.length * 7 % cand.length] });
    const crows = [0, 1, 2].map(() => { const c = crow3(); o.scene.add(c); return c; });
    const sq = PEOPLE.make('squatter'); o.scene.add(sq.root);
    const hat = sq.hat.clone(); hat.matrixAutoUpdate = true; o.scene.add(hat);          // the same hat, loose in his hands
    const bounce = P3.lamp(o, [0, 5, 0], '#FFE0B0', 0, 30, false);                      // sunlit yard bouncing up under the veranda
    const fence = st.children.filter(m => m.isMesh && m.geometry.parameters && (m.geometry.parameters.height === 4.2 || m.geometry.parameters.width === .05));
    return { o, st, cow, crows, perches: pick.map(q => q.p), sq, hat, bounce, fence, cam: P3.cam(40) };
  });
  function stationReset(S) { S.o.fill.intensity = 1.25; S.fence.forEach(m => m.visible = true); S.cow.root.visible = false; S.crows.forEach(c => c.visible = false); S.sq.root.visible = false; S.hat.visible = false; S.sq.hat.visible = true; S.bounce.intensity = 0; S.st.userData.setWet(0); S.st.userData.setSpin(.35); }
  function poseCrows(S, t, o = {}) {
    const pick = [0, 1, 2];
    S.crows.forEach((c, i) => {
      const p = S.perches[pick[i]]; if (!p) { c.visible = false; return; }
      c.visible = true; c.position.set(...p); c.rotation.set(0, [1.3, -2.0, 2.4][i], 0);
      // heads move in quick jerks and hold, like birds do
      const q = t * 1.1 + i * .37, n = Math.floor(q), f = clamp((q - n) / .09), a0 = (hash(n * 3.1 + i) - .5) * 1.5, a1 = (hash((n + 1) * 3.1 + i) - .5) * 1.5;
      let yaw = lerp(a0, a1, f); if (o.look && o.look[i] != null) yaw = lerp(yaw, o.look[i], o.lookK ?? 1);
      c.userData.head.rotation.set((hash(n + i * 5) - .5) * .3 + (o.look && o.look[i] != null ? .35 * (o.lookK ?? 1) : 0), yaw, 0);
      c.userData.body.rotation.x = -.45 + Math.sin(t * 2.1 + i) * .02;
      c.updateMatrixWorld(true);
    });
  }
  const skyDawn = (o = {}) => sky(o.top || '#E3B97E', o.bot || '#F5E4BF', { still: true, split: o.split ?? .55, hatch: o.hatch ?? .7, tone: o.tone ?? .6 });

  // ---- 0.00 · the page draws itself: aerial descent over the white plain to the dry waterhole ----
  function intro(t, lt, dur) {
    const S = STATION(), { o, cam } = S; stationReset(S); lens(cam, 40);
    const ck = ease(seg(lt, .2, dur));
    const pos = path([[-160, 340, 330], [-90, 210, 230], [-10, 80, 130], [10, 18, 64], [9, 6.2, 44]], ck);
    const tgt = path([[-10, 0, -70], [-8, 0, -50], [-8, 2, -30], [-8, 5, -14], [-8, 6, -10]], ck);
    P3.look(cam, pos, tgt, lerp(.04, 0, ck));
    aimSun(o, SUN_ST, [-10, 0, -30], 170, 400);
    // the cow in the dry bowl, head down to the cracked mud
    S.cow.root.visible = true; PEOPLE.at(S.cow, COW_AT, COW_YAW); PEOPLE.clip(S.cow, 'Idle_Headlow', lt * .5 + 1.2);
    poseCrows(S, t);
    const opts = { fog: [260, 2400], fogCol: '#F4E4C2', lightTint: .6, lineW: 1.4, hatch: lerp(1.5, 1, ck) };
    // the drawing: graphite underdrawing first, worked out from the waterhole, then colour laid over it
    const [fx, fy] = P3.project(cam, [0, 0, -4]);
    const ord = (x, y) => Math.hypot(x - fx, (y - fy) * 1.3) / 1500;
    const k1 = ease(seg(lt, .35, 3.4)), k2 = ease(seg(lt, 2.2, 6.4));
    if (k2 < 1) {
      const A = into(0, () => drawSketch(o, cam, { ...opts, tone: 0, lineW: 1.7, fogCol: AP.paper }));
      strokeMask(lay(2), k1, ord, { len: 150, soft: .2 }); masked(A, lay(2)); stamp(A);
    }
    if (k2 > 0) {
      const B = into(1, () => {
        skyDawn();
        const sp = sunScreen(cam, SUN_ST); if (sp) sun(sp[0], sp[1], 46, .5);
        P3.draw(o, cam, opts);
      });
      if (k2 < 1) { strokeMask(lay(3), k2, (x, y) => ord(x, y) * .75 + (1 - y / H) * .25, { len: 190, soft: .22, lane: 16 }); masked(B, lay(3)); }
      stamp(B);
    }
  }

  // ---- 11.95 · [0] the stock dying: low against the sun; she goes down; the crows wait ----
  function cowDies(t, lt, dur) {
    const S = STATION(), { o, cam } = S; stationReset(S); lens(cam, 54);
    const D0 = 1.15, u = lt - D0;                                 // the collapse: a slow sink, a quicker fall, then still
    const dk = u < 1.2 ? lerp(.06, .25, ease(u / 1.2)) : u < 1.65 ? lerp(.25, .58, seg(u, 1.2, 1.65)) : lerp(.58, .98, easeOut(seg(u, 1.65, 2.5)));
    S.cow.root.visible = true; PEOPLE.at(S.cow, COW_AT, COW_YAW);
    if (lt < D0) PEOPLE.clip(S.cow, 'Idle_Headlow', lt * .45 + 6.1);
    else {
      PEOPLE.clip(S.cow, 'Death', dk, { loop: false });
      const bl = 1 - ease(seg(lt, D0, D0 + .45)); if (bl > 0) PEOPLE.clip(S.cow, 'Idle_Headlow', D0 * .45 + 6.1, { w: bl });
      // keep the head low and heavy: no throw of the head, she has nothing left
      const hw = 1 - ease(seg(dk, .5, .62)); if (hw > 0) PEOPLE.clip(S.cow, 'Idle_Headlow', D0 * .45 + 6.1, { w: hw, keep: true, only: ['Neck', 'Head'] });
    }
    // legs trembling before she goes
    if (lt < D0 + .3) { const tr = seg(lt, .2, D0) * (1 - seg(lt, D0, D0 + .3)); PEOPLE.turn(S.cow, 'Body', [0, 0, Math.sin(lt * 23) * .012 * tr]); }
    const landK = seg(dk, .52, .62);
    poseCrows(S, t, { look: [.2, null, -.5], lookK: ease(seg(lt, D0 + 1.9, D0 + 2.0)) });
    const ck = ease(seg(lt, 0, dur));
    S.fence.forEach(m => m.visible = false);      // lost in the glare
    o.fill.intensity = .7;                         // against the sun: let her go to silhouette
    const cp = lerp3(COW_CAM[0], COW_CAM[2], ck), ct = lerp3(COW_CAM[1], COW_CAM[3], ck);
    P3.look(cam, cp, ct, -.012);
    aimSun(o, SUN_ST, [-4, 0, -4], 50, 300);
    skyDawn({ top: '#E0AE6E', bot: '#F7E7C2', split: .62 });
    const sp = sunScreen(cam, SUN_ST); if (sp) sun(sp[0], sp[1], 58, .9);
    P3.draw(o, cam, { fog: [120, 1800], fogCol: '#F4DFB6', lightTint: .65, lineW: 1.6 });
    // dust where she lands, drifting and settling
    if (landK > 0) {
      const q = clamp((lt - (D0 + 1.55)) / 1.6);
      for (let i = 0; i < 7; i++) {
        const [dx, dy, dd] = P3.project(cam, [COW_AT[0] + (hash(i) - .5) * 6, .5 + q * 2 * hash(i + 2), COW_AT[2] + (hash(i + 5) - .5) * 2]);
        psmoke(dx + q * 40, dy, (900 + 1400 * q) / dd, AP.dust, .42 * (1 - q) * Math.min(1, landK * 3));
      }
    }
  }

  // ---- 16.27 · [1] sick of prayers: the squatter on the veranda looks at the empty sky; nothing; hat on; he walks out ----
  // Two set-ups: his face against the dark slab wall while he looks and decides, then from behind in the veranda's shade
  // as the hat goes on and he steps out into the light (cut on the hat's rise).
  function squatter(t, lt, dur) {
    if (lt < .6) {                                // dissolve from the dead cow
      const A = shotInto(4, cowDies, t, 11.95, 16.27 - 11.95), B = shotInto(5, squatterShot, t, 16.27, dur);
      stamp(A); stamp(B, ease(lt / .6)); return;
    }
    squatterShot(t, lt, dur);
    if (lt > dur - .32) pageTurn((lt - (dur - .32)) / .64, 1);
  }
  function squatterShot(t, lt, dur) {
    const S = STATION(), { o, cam, sq, hat } = S; stationReset(S); o.fill.intensity = .6;   // the veranda is in the shade
    sq.root.visible = true;
    const T_DOWN = 1.1, T_HAT = 1.85, T_ON = 2.4, T_WALK = 2.7, CUT = 2.1;
    const walkK = Math.max(0, lt - T_WALK), z0 = 15.6, lz = z0 + walkK * 3.5 * ease(seg(lt, T_WALK, T_WALK + .45));
    const dropY = .6 * (1 - ease(seg(lz, 17.8, 18.6)));
    PEOPLE.at(sq, hq(0, dropY, lz), HOUSE.yaw);
    PEOPLE.clip(sq, 'Idle_Loop', lt * .7 + 3.3);
    const wk = ease(seg(lt, T_WALK - .1, T_WALK + .3)); if (wk > 0) PEOPLE.clip(sq, 'Walk_Loop', walkK * 1.0 + .2, { w: wk });
    // looking up at the sky, searching it; nothing comes; the head comes down and the jaw sets
    const up = ease(seg(lt, .05, .45)) * (1 - ease(seg(lt, T_DOWN, T_DOWN + .4)));
    const search = Math.sin(seg(lt, .45, T_DOWN) * Math.PI * 1.4) * .14 * up, set = ease(seg(lt, T_DOWN + .35, T_DOWN + .6));
    PEOPLE.turn(sq, 'neck_01', [-.3 * up, search * .6, 0]); PEOPLE.turn(sq, 'Head', [-.28 * up, search, 0]);
    PEOPLE.turn(sq, 'spine_03', [.02 - .05 * up + .06 * ease(seg(lt, T_DOWN, T_DOWN + .35)) * (1 - wk) - .05 * set * (1 - wk), 0, 0]);
    // the decision: a breath out, the chin comes up a little, the eyes go to the road
    PEOPLE.turn(sq, 'Head', [-.08 * set * (1 - wk), .18 * set * (1 - wk), 0]);
    // the hat: held by the brim at his belt, then lifted and set on his head
    sq.root.updateMatrixWorld(true);
    const hp = new THREE.Vector3(), hq4 = new THREE.Quaternion(), hs = new THREE.Vector3(); sq.hat.matrixWorld.decompose(hp, hq4, hs);
    const yawQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, HOUSE.yaw, 0)), fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(yawQ);
    const pel = new THREE.Vector3(); sq.bones.pelvis.getWorldPosition(pel);
    const fid = Math.sin(lt * 1.9) * .22 * (1 - seg(lt, T_HAT - .2, T_HAT));
    const heldQ = yawQ.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(1.45, .3 + fid, 0)));
    const heldP = pel.clone().add(fwd.clone().multiplyScalar(.75)).add(new THREE.Vector3(0, .55, 0));
    const hk = ease(seg(lt, T_HAT, T_ON)), arc = Math.sin(hk * Math.PI) * .8, tug = .05 * Math.sin(seg(lt, T_ON - .12, T_ON) * Math.PI);
    const onTop = lt > T_ON;
    sq.hat.visible = onTop; hat.visible = !onTop;
    if (!onTop) {
      hat.position.copy(heldP.clone().lerp(hp, hk)).add(fwd.clone().multiplyScalar(arc * .45)).add(new THREE.Vector3(0, arc * .5 - tug, 0));
      hat.quaternion.copy(heldQ.clone().slerp(hq4, hk)); hat.scale.copy(hs); hat.updateMatrixWorld(true);
    }
    const gw = 1 - ease(seg(lt, T_ON, T_ON + .3));
    if (gw > 0) {
      const src = onTop ? sq.hat : hat; src.updateMatrixWorld(true);
      const bl = new THREE.Vector3(.2, .005, .07).applyMatrix4(src.matrixWorld), br = new THREE.Vector3(-.2, .005, .07).applyMatrix4(src.matrixWorld);
      const side = new THREE.Vector3(1, 0, 0).applyQuaternion(yawQ);
      reachW(sq, 'l', v2a(bl), v2a(pel.clone().add(side.clone().multiplyScalar(2)).add(new THREE.Vector3(0, .8, 0))), gw);
      reachW(sq, 'r', v2a(br), v2a(pel.clone().add(side.clone().multiplyScalar(-2)).add(new THREE.Vector3(0, .8, 0))), gw);
    }
    const hd = PEOPLE.head(sq);
    if (lt < CUT) {   // his face, lit by the glare off the yard, the dark slabs behind him
      lens(cam, 30); const k = ease(seg(lt, 0, CUT));
      const face = hq(0, hd.y - .8, lz);
      P3.look(cam, hq(2.9 - .2 * k, 5.3, 21.6 - .9 * k), face);
      S.bounce.position.set(...hq(.5, 1.5, 21)); S.bounce.intensity = 70;
    } else {          // behind him in the shade: the hat goes on; he walks out into the light
      lens(cam, 38); const k = ease(seg(lt, CUT, dur));
      P3.look(cam, hq(-1.6 + .3 * k, 5.4 + .1 * k, 11.4 + 1.2 * k), hq(.6, 4.4, 42));
      S.bounce.position.set(...hq(0, 2, 20)); S.bounce.intensity = 25;
    }
    aimSun(o, SUN_ST, hq(0, 0, 18), 45, 250);
    skyDawn({ top: '#E7C590', bot: '#F8ECCF', split: .7, hatch: .55 });
    P3.draw(o, cam, { near: .2, fog: [150, 1500], fogCol: '#F6E6C4', lightTint: .6, lineW: 1.6 });
  }

  // ================================================================ the bore site
  // Site compass: east lies toward -x and a little -z of the derrick; north is +z (the camp side); the sun arcs
  // through the north (Queensland). Chapter A's morning sun comes low from the east.
  const EAST = nrm([-.894, 0, -.447]), NORTH = nrm([-.447, 0, .894]);
  const sunEl = el => nrm([EAST[0] * Math.cos(el), Math.sin(el), EAST[2] * Math.cos(el)]);
  const sunDay = d => {   // d 0 (sunrise) .. 1 (sunset): azimuth east → north → west, elevation up to ~62°
    const a = Math.PI * d, el = Math.max(-.2, Math.sin(Math.PI * d) * 1.08 - .04), h = [EAST[0] * Math.cos(a) + NORTH[0] * Math.sin(a), EAST[2] * Math.cos(a) + NORTH[2] * Math.sin(a)];
    return nrm([h[0] * Math.cos(el), Math.sin(el), h[1] * Math.cos(el)]);
  };
  const T_START = 31.2, T_BLOW1 = 33.183;       // the throttle opens; the first blow lands on beat 60 (a bar downbeat)
  const ENG_X = 52;
  const SITE = () => P3.cached('A-site', () => {
    const o = P3.scene({ sunDir: [-100, 40, -50], sun: 2.6, fill: .55, shadowSize: 90 });
    o.sun.color.set('#FFE8C4'); o.fill.color.set('#FFF3DC'); o.fill.groundColor.set('#9A7A54');
    const s = WORLD.site({ col: '#D4B68A', board: 0, dead: .7 }); o.scene.add(s.group);
    const R = s.rig, U = R.userData;
    // FIX (shared site): the depth board sits inside the battered leg it is nailed to; bring it out onto the leg's face
    s.board.position.set(-7.6 + .48 * .55, 7.4, 8.2 + .88 * .55); s.at.boardPos = s.board.position.toArray();
    // FIX (shared rig): the engine stands in line beyond the band wheel, firebox toward the derrick, its flywheel in the
    // band wheel's plane so the belt runs true (RESEARCH Q2; storyboard continuity). Moved out to leave the driver room.
    U.eng.rotation.y = 0; U.eng.position.x = ENG_X;
    let thr = null; U.eng.children.forEach(m => { if (m.isMesh && Math.abs(m.position.x + 9.8) < .01 && Math.abs(m.position.y - 6) < .01) thr = m; });
    const foot = P3.mesh(P3.box(3.2, .7, 3.4), '#7A5A40'); foot.position.set(ENG_X - 11.7, .35, 1.2); R.add(foot);    // driver's plank step
    // FIX (shared rig): a real crank. The pitman runs from a wrist pin on a short crank to the beam, at a fixed length.
    U.crankArm.visible = false;
    const crank = P3.mesh(P3.box(.55, 1, .35), AP.iron); U.band.add(crank);
    const wrist = P3.mesh(P3.cyl(.2, .2, .9, 10).rotateX(Math.PI / 2), AP.ironLt); U.band.add(wrist);
    const hub = new THREE.Vector3(...U.bandC), cEnd = () => new THREE.Vector3(10.5, -.4, 0).applyMatrix4(U.beamG.matrixWorld);
    RIG.pose(R, { stroke: 0, amp: 1 }); const E0 = cEnd(); RIG.pose(R, { stroke: .75, amp: 1 }); const E1 = cEnd();
    const d0 = Math.hypot(E0.x - hub.x, E0.y - hub.y), d1 = Math.hypot(E1.x - hub.x, E1.y - hub.y), cr = (d0 - d1) / 2, L0 = d0 - cr;
    const phi0 = Math.atan2(-(E0.x - hub.x), E0.y - hub.y);
    crank.scale.y = cr + .5; crank.position.set(0, cr / 2, 1.6); wrist.position.set(0, cr, 1.85);
    // FIX (shared rig): the pole string moves as one rigid piece (the rig stretches it). Pale yellow-wood poles with
    // black iron joints (RESEARCH Q2); the lower length hangs down inside the casing.
    U.rodM.visible = false; U.jointM.visible = false;
    const rod = P3.mesh(P3.cyl(.15, .15, 40, 12), '#E2BE68'); R.add(rod);
    const joints = [0, 1].map(() => { const j = P3.mesh(P3.cyl(.23, .23, .7, 12), AP.iron); R.add(j); return j; });
    // the steam gauge gets a face and a needle
    const gface = P3.mesh(new THREE.CircleGeometry(.46, 24).rotateY(-Math.PI / 2), '#EEE6D2', { cast: false }); gface.position.set(-9.72, 6.8, -1.2); U.eng.add(gface);
    const needle = P3.mesh(P3.box(.03, .38, .05), '#2A2320', { cast: false }); U.eng.add(needle);
    for (let i = 0; i < 9; i++) { const a = -2.2 + i * .55, tk = P3.mesh(P3.box(.02, .08, .03), '#2A2320', { cast: false }); tk.position.set(-9.74, 6.8 + Math.cos(a) * .36, -1.2 - Math.sin(a) * .36); tk.rotation.x = a; U.eng.add(tk); }
    // the band wheel turns once a stroke: 16 spokes strobe backward on film at that speed, so keep 8 of them
    let sp = 0; U.band.children.forEach(m => { if (m.isMesh && m.geometry.parameters && m.geometry.parameters.height === 10.2) { if (sp++ % 2) m.visible = false; } });
    // the draw drum's brake lever, standing on the back of the floor
    const brake = new THREE.Group(); R.add(brake);
    const lev = P3.beam([4.7, 2.2, -8.6], [4.4, 6.4, -6.9], .32, .26, '#7A5A40'); brake.add(lev);
    const shoe = P3.beam([4.7, 2.3, -8.7], [5.6, 3.2, -10.2], .18, .18, AP.iron); brake.add(shoe);
    const band2 = P3.mesh(new THREE.TorusGeometry(1.2, .08, 5, 20, Math.PI * 1.2), AP.iron); band2.position.set(6, 4.5, -10.4); band2.rotation.set(0, 0, 2.2); brake.add(band2);
    const brakeGrip = [4.43, 6.0, -7.05];
    // spare rods on the rack (they go into the hole in the montage)
    const rack = []; R.children.forEach(m => { if (m.isMesh && Math.abs(m.position.y - 1.2) < .02 && Math.abs(m.position.z + 8) < .02 && m.position.x > -20.3 && m.position.x < -15) rack.push(m); });
    rack.sort((a, b) => b.position.x - a.position.x);
    // the cutaway earth under the bore (shown only when the camera goes below ground)
    const sec = WORLD.section({ bottom: 4400 }); sec.position.y = -.08; sec.userData.surf.visible = false; sec.visible = false; o.scene.add(sec);
    // FIX (shared section): the bore slot sat in front of the rods and the opaque casing hid them. Recess the slot and draw
    // the casing as its two cut walls, so the string and the bit read in the cutaway.
    sec.userData.slot.position.z = -.5; sec.userData.casing.visible = false;
    const HH = i => { const v = Math.sin(i * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
    for (let i = 0; i < 90; i++) { const r = .25 + HH(i * 3) * .55, st = P3.mesh(new THREE.IcosahedronGeometry(r, 1), mixCol('#C89A5E', AP.graphite, .25 + HH(i) * .25)); st.scale.z = .5; st.position.set((HH(i * 7) - .5) * 120, -(45 + HH(i * 11) * 320) * .1, .1); if (Math.abs(st.position.x) < 3) st.position.x += 6; sec.add(st); }
    for (let i = 0; i < 26; i++) { const sh = P3.mesh(new THREE.TorusGeometry(.35 + HH(i * 5) * .3, .09, 5, 14, Math.PI * (1.2 + HH(i) * .6)), '#D8CCB0'); sh.position.set((HH(i * 13) - .5) * 110, -(420 + HH(i * 17) * 330) * .1, .2); sh.rotation.z = HH(i * 19) * 6; if (Math.abs(sh.position.x) < 3) sh.position.x -= 7; sec.add(sh); }
    const cwall = [-1, 1].map(sd => { const w = P3.mesh(P3.box(.28, 1, .5), '#7C7872'); w.position.set(sd * 1.02, 0, .55); sec.add(w); return w; });
    const secLight = new THREE.DirectionalLight(0xfff4e0, 0); secLight.position.set(-80, 60, 260); o.scene.add(secLight); o.scene.add(secLight.target);
    // the crew
    const P = {}; for (const n of ['driller', 'bill', 'boss', 'dresser', 'hand', 'lab']) { P[n] = PEOPLE.make(n); o.scene.add(P[n].root); }
    // the boss's pocket watch: gold case, white face, hands (the second hand ticks on the beat)
    const watch = new THREE.Group(); o.scene.add(watch);
    const wcase = P3.mesh(P3.cyl(.12, .12, .05, 20), '#C8A24A'); watch.add(wcase);
    const wface = P3.mesh(new THREE.CircleGeometry(.1, 24).rotateX(-Math.PI / 2), '#F2EBDA', { cast: false }); wface.position.y = .026; watch.add(wface);
    const wh = [.06, .045, .07].map((l, i) => { const g = new THREE.Group(); g.position.y = .027 + i * .002; const m = P3.mesh(P3.box(.008 + (i < 2 ? .006 : 0), .004, l), i === 2 ? '#9A3A2A' : '#2A2320', { cast: false }); m.position.z = l / 2 - .01; g.add(m); watch.add(g); return g; });
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, tk = P3.mesh(P3.box(.008, .003, i % 3 ? .014 : .024), '#2A2320', { cast: false }); tk.position.set(Math.sin(a) * .085, .027, Math.cos(a) * .085); tk.rotation.y = a; watch.add(tk); }
    const bow = P3.mesh(new THREE.TorusGeometry(.028, .008, 5, 12), '#C8A24A'); bow.position.set(0, 0, -.115); bow.rotation.x = Math.PI / 2; watch.add(bow);
    watch.userData.hands = wh;
    const log = PROPS.log(3.4, .3); o.scene.add(log);
    const pole = P3.mesh(P3.cyl(.2, .2, 19, 10), '#E2BE68'); o.scene.add(pole);
    const poleJ = [0, 1].map(() => { const j = P3.mesh(P3.cyl(.27, .27, .6, 10), AP.iron); o.scene.add(j); return j; });
    const lant = [PROPS.lantern(1), PROPS.lantern(1)]; lant.forEach(l => o.scene.add(l));
    const lamps = [P3.lamp(o, [6.4, 10.3, 6.4], '#FFB45A', 0, 80), P3.lamp(o, [ENG_X - 11, 8, 3], '#FFA04A', 0, 60)];
    return { o, s, R, U, thr, crank, wrist, hub, cEnd, cr, L0, phi0, rod, joints, needle, brake, brakeGrip, rack, sec, secLight, cwall, pole, poleJ, P, watch, log, lant, lamps, cam: P3.cam(40) };
  });
  function setSection(S, depth, st, casingFt) {
    S.sec.userData.set(depth, st, { casing: casingFt });
    const c = Math.max(.1, casingFt) * .1; S.cwall.forEach(w => { w.scale.y = c; w.position.y = -c / 2; });
  }
  // the stroke through the start-up: stopped until the throttle opens, one slow first lift, then locked to the beat
  function strokeOf(t) {
    if (t < T_START) return 0;
    if (t < T_BLOW1 - .267) return .75 * Math.pow(seg(t, T_START, T_BLOW1 - .267), 1.7);
    return RIG.strokeAt(t);
  }
  // pose the plant for time t (o.stroke overrides), with the crank and pitman solved at a fixed length
  function runRig(S, t, o = {}) {
    const { R, U } = S, st = o.stroke ?? strokeOf(t), running = t >= T_START || o.stroke != null;
    const n = running ? Math.max(0, Math.floor(bpOf(t) / 2 - bpOf(T_BLOW1) / 2 + 1)) : 0;
    const twist = .02 * n + .09 * ease(seg(st, .55, .72)) * (1 - ease(seg(st, .8, 1)));
    RIG.pose(R, { stroke: st, amp: o.amp ?? 1, fly: 0, turn: .2 + twist });
    const E = S.cEnd(), hub = S.hub, r = S.cr;
    const dist = ph => Math.hypot(E.x - (hub.x - r * Math.sin(ph)), E.y - (hub.y + r * Math.cos(ph)));
    const lifting = st < .75, a0 = S.phi0 + (lifting ? 0 : Math.PI);
    let lo = a0, hi = a0 + Math.PI;
    for (let i = 0; i < 22; i++) { const mid = (lo + hi) / 2, f = dist(mid) - S.L0; if ((f < 0) === lifting) lo = mid; else hi = mid; }
    const phi = (lo + hi) / 2 + (o.phiOff ?? 0);
    U.band.rotation.z = phi; U.fly.rotation.z = phi * 5 + (o.flyOff ?? 0);
    const P = new THREE.Vector3(hub.x - r * Math.sin(phi), hub.y + r * Math.cos(phi), 1.15), E2 = E.clone(); E2.z = .85;
    U.pitman.position.copy(P).add(E2).multiplyScalar(.5); U.pitman.scale.set(1, P.distanceTo(E2), 1);
    U.pitman.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), E2.clone().sub(P).normalize());
    // the rigid string hangs from the temper screw; the tiller is clamped to it
    const top = U.wellEnd[1] - 5.6, lift = top - 9.0;
    S.rod.position.set(0, top - 20, 0); S.joints[0].position.set(0, top - .35, 0); S.joints[1].position.set(0, top - 4.25, 0);
    const ta = U.tiller.rotation.y; U.tiller.scale.x = .55; U.tiller.position.set(Math.cos(ta) * 1.1, top - 4.4, -Math.sin(ta) * 1.1); U.tillerAt = [0, top - 4.4, 0];
    // the gauge needle: steady before the start, climbing and trembling as she works
    const g = .35 + .25 * ease(seg(t, T_START, T_START + 3)) + (t > T_START ? Math.sin(t * 37) * .015 : Math.sin(t * 5) * .006);
    S.needle.position.set(-9.75, 6.8 + Math.cos(lerp(-2.2, 2.2, g)) * .15, -1.2 - Math.sin(lerp(-2.2, 2.2, g)) * .15); S.needle.rotation.x = lerp(-2.2, 2.2, g);
    // the throttle lever: shut (upright) until Bill pulls it open toward him
    const a = o.throttle ?? (t < 30.9 ? 0 : .62 * easeOut(seg(t, 30.9, T_START + .1)));
    if (S.thr) { S.thr.rotation.z = a; S.thr.position.set(-9.8 - .9 * Math.sin(a), 5.1 + .9 * Math.cos(a), 1.4); }
    R.updateMatrixWorld(true);
    return { st, phi, n, lift, throttleTop: v2a(new THREE.Vector3(-9.8 - 1.75 * Math.sin(a), 5.1 + 1.75 * Math.cos(a), 1.4).applyMatrix4(U.eng.matrixWorld)) };
  }
  function siteReset(S, t, o = {}) {
    for (const p of Object.values(S.P)) p.root.visible = false;
    S.watch.visible = false; S.log.visible = false; S.pole.visible = false; S.poleJ.forEach(j => j.visible = false); S.lant.forEach(l => l.visible = false); S.lamps.forEach(l => l.intensity = 0);
    S.sec.visible = !!o.section; S.secLight.intensity = o.section ? 1.0 : 0; S.s.board.userData.set(o.board ?? 0);
    S.rack.forEach((m, i) => m.visible = i >= (o.rackGone ?? 0));
    o2sun(S, o);
  }
  function o2sun(S, o) { S.o.sun.intensity = o.sunK ?? 4.4; S.o.fill.intensity = o.fillK ?? .95; S.o.sun.color.set(o.sunCol || '#FFE8C4'); S.o.fill.color.set(o.fillCol || '#FFF3DC'); S.o.fill.groundColor.set(o.gndCol || '#9A7A54'); }
  const show = p => { p.root.visible = true; return p; };
  // the crew at their stations
  const DR_AT = [1.95, 2.2, 1.35], DR_YAW = -2.1 - .35;
  function poseDriller(S, t, o = {}) {
    const p = show(S.P.driller), U = S.U, y = U.tillerAt[1], tr = U.tiller.rotation.y;
    PEOPLE.at(p, DR_AT, DR_YAW);
    PEOPLE.clip(p, 'Idle_Loop', t * .8 + 1.3);
    PEOPLE.turn(p, 'spine_02', [.12 + (o.lean ?? 0), 0, 0]);
    if (o.look != null) PEOPLE.turn(p, 'neck_01', [o.look, 0, 0]);
    const tip = [Math.cos(tr) * 2.0, y + .02, -Math.sin(tr) * 2.0];
    PEOPLE.reach(p, 'r', tip, [2.6, y - .9, -.6]);
    const ry = U.floorY + 3.75 + (o.handY ?? 0);          // her palm rests on the pole; it slides under her hand
    PEOPLE.reach(p, 'l', [.2, ry, .16], [1.3, ry - 1.2, 2.3]);
    return p;
  }
  function poseBill(S, t, rr, o = {}) {
    const p = show(S.P.bill);
    PEOPLE.at(p, [ENG_X - 11.4, .7, 1.2], Math.PI / 2 + (o.yaw ?? 0));
    PEOPLE.clip(p, 'Idle_Loop', t * .9 + 2.1);
    if (o.back) { PEOPLE.turn(p, 'spine_02', [0, o.back * .35, 0]); PEOPLE.turn(p, 'spine_03', [0, o.back * .3, 0]); PEOPLE.turn(p, 'neck_01', [0, o.back * .7, 0]); PEOPLE.turn(p, 'Head', [.08 * o.back, o.back * .45, 0]); }
    if (o.look) PEOPLE.turn(p, 'neck_01', [0, o.look, 0]);
    if (o.lean) PEOPLE.turn(p, 'spine_02', [o.lean, 0, 0]);
    reachW(p, 'r', rr.throttleTop, [ENG_X - 11.3, 4.6, 3.2], o.hand ?? 1);
    return p;
  }
  const BOSS_AT = [-4.6, 0, 12.4], BOSS_YAW = .45; const WATCH_ROLL = Math.PI / 2;
  function poseBoss(S, t, o = {}) {
    const p = show(S.P.boss);
    PEOPLE.at(p, o.at || BOSS_AT, o.yaw ?? BOSS_YAW);
    PEOPLE.clip(p, 'Idle_Loop', t * .75 + .4);
    if (o.nod) PEOPLE.clip(p, 'Yes', o.nod, { w: .85, loop: false, only: ['neck', 'Head', 'spine_03'] });
    if (o.headDown) { PEOPLE.turn(p, 'neck_01', [o.headDown * .9, 0, 0]); PEOPLE.turn(p, 'Head', [o.headDown * .5, 0, 0]); }
    if (o.turnHead) { PEOPLE.turn(p, 'neck_01', [0, o.turnHead * .55, 0]); PEOPLE.turn(p, 'Head', [0, o.turnHead * .45, 0]); }
    // the watch in his left palm, face up, held where he can read it
    const sp = new THREE.Vector3(); p.bones.spine_03.getWorldPosition(sp);
    const f = new THREE.Vector3(Math.sin(p.root.rotation.y), 0, Math.cos(p.root.rotation.y)), sd = new THREE.Vector3(f.z, 0, -f.x);
    const wp = sp.clone().add(f.clone().multiplyScalar(.95)).add(sd.clone().multiplyScalar(-.18)).add(new THREE.Vector3(0, (o.watchY ?? .05), 0));
    const ww = o.watchW ?? 1;
    if (ww > 0) {
      reachW(p, 'l', v2a(wp.clone().add(new THREE.Vector3(0, -.06, 0))), v2a(sp.clone().add(sd.clone().multiplyScalar(-1.6)).add(new THREE.Vector3(0, -1.4, 0))), ww);
      const hl = PEOPLE.hand(p, 'l'), fa = new THREE.Vector3(); p.bones.lowerarm_l.getWorldPosition(fa); const dir = hl.clone().sub(fa).normalize();
      openHand(p, 'l'); rotW(p, 'hand_l', v2a(dir), o.palm ?? WATCH_ROLL);
      S.watch.visible = true; S.watch.position.copy(hl).add(dir.multiplyScalar(.3)).add(new THREE.Vector3(0, .1, 0));
      S.watch.rotation.set(o.watchTilt ?? 0, p.root.rotation.y + Math.PI + .6, 0);
      const sec = Math.floor(bpOf(t)) * TAU / 60; S.watch.userData.hands[2].rotation.y = -sec; S.watch.userData.hands[1].rotation.y = -1.1; S.watch.userData.hands[0].rotation.y = -3.4;
      S.watch.updateMatrixWorld(true);
    }
    return p;
  }
  function poseDresser(S, t, o = {}) {
    const p = show(S.P.dresser), U = S.U;
    PEOPLE.at(p, [5.25, U.floorY, -5.5], o.yaw ?? -2.5);
    PEOPLE.clip(p, 'Idle_Loop', t * .7 + 5.2);
    if (o.look != null) PEOPLE.turn(p, 'neck_01', [0, o.look, 0]);
    const g = S.brakeGrip;
    PEOPLE.reach(p, 'r', [g[0] + .06, g[1] + .1, g[2] + .02], [6.6, g[1] - 1.4, -4.4]);
    if (o.both) PEOPLE.reach(p, 'l', [g[0] + .03, g[1] - .55, g[2] - .2], [3.8, g[1] - 1.6, -4.6]);
    return p;
  }
  function poseHand(S, t) { const p = show(S.P.hand); PEOPLE.at(p, [8.8, 0, -8.4], -2.4); PEOPLE.clip(p, 'Idle_FoldArms_Loop', t * .8 + 3.7); return p; }
  function poseLab(S, t) {
    const p = show(S.P.lab), k = frac((t - 20) / 9), x = lerp(ENG_X - 8, ENG_X - 18, k), z = lerp(12, 6.5, k);
    PEOPLE.at(p, [x, 0, z], -2.2); PEOPLE.clip(p, 'Walk_Carry_Loop', t);
    const l = PEOPLE.hand(p, 'l'), r = PEOPLE.hand(p, 'r'); S.log.visible = true; PROPS.place(S.log, [(l.x + r.x) / 2 - 1.4, (l.y + r.y) / 2 + .15, (l.z + r.z) / 2], [(l.x + r.x) / 2 + 1.4, (l.y + r.y) / 2 + .15, (l.z + r.z) / 2]);
    return p;
  }
  function crewAll(S, t, rr) { poseDriller(S, t); poseBill(S, t, rr, { hand: t < T_START + 1 ? 1 : 0, back: 1.1 * (1 - ease(seg(t, 30.98, 31.16))) }); poseBoss(S, t, { watchW: t < 30.4 ? 1 : 0 }); poseDresser(S, t); poseHand(S, t); poseLab(S, t); }
  // stack smoke streaming downwind (toward +x/+z), pulsing with the engine
  function stackSmoke(S, cam, t, k = 1) {
    if (k <= 0) return; const [, , d] = P3.project(cam, S.U.stackTop); if (d <= 0) return;
    const sc = 60 / Math.max(8, d);
    for (let i = 0; i < 7; i++) { const q = frac(t * .45 + i / 7); const [px, py] = P3.project(cam, [S.U.stackTop[0] + q * 30, S.U.stackTop[1] + 1 + q * 16, S.U.stackTop[2] + q * 14]); psmoke(px, py, (12 + q * 70) * sc, AP.smoke, .42 * (1 - q) * k); }
  }
  function blowDust(S, cam, t) {
    const since = t >= T_BLOW1 ? frac(bpOf(t) / 2 + 1e-6) * 2 * BEAT : 99; if (since > .6) return;
    const q = since / .6, [hx, hy, d] = P3.project(cam, [0, S.U.floorY + 1.8, 0]); if (d <= 0) return;
    for (let i = 0; i < 6; i++) psmoke(hx + (hash(i) - .5) * 1600 / d * (.4 + q), hy - q * 700 / d * hash(i + 3) + 60 / d, (500 + 1300 * q) / d, '#D8C4A0', .5 * (1 - q));
  }
  const skyMorning = (o = {}) => sky(o.top || '#E9BE7E', o.bot || '#F6E6C2', { still: true, split: o.split ?? .6, hatch: o.hatch ?? .65 });
  const DRAW = (S, cam, o = {}) => P3.draw(S.o, cam, { fog: [180, 1700], fogCol: '#F4E2BE', lightTint: .6, lineW: 1.5, ...o });

  // ---- 20.49 · [2] derricks above, earth below: crane up the derrick to the crown, down its legs into the ground ----
  function crane(t, lt, dur) {
    const S = SITE(), { o, cam } = S; siteReset(S, t, { section: true }); lens(cam, 42);
    const rr = runRig(S, t); crewAll(S, t, rr); setSection(S, 8, 0, 8);
    // one continuous move outside the derrick's front face: up from the planks to the crown block against the sky, a held
    // beat there, then down the front of the tower (legs converging above) and on down through the ground to the cutaway
    const T1 = 2.3, T2 = 2.62, H = 4 / 9;
    const u = lt < T1 ? H * ease(lt / T1) : lt < T2 ? H : H + (1 - H) * ease(seg(lt, T2, dur));
    const pos = path([[2.0, 3.4, 11.2], [1.6, 10, 10.6], [1.2, 24, 8.8], [1.0, 40, 6.6], [1.0, 47, 5.6], [2, 44, 15], [6, 28, 24], [8, 10, 29], [9, -5, 40], [15, -9, 98]], u);
    const tgt = path([[.2, 4.6, 0], [0, 14, 0], [0, 40, 0], [0, 60, 0], [0, 64, 0], [0, 50, 3], [0, 28, 4], [0, 8, 3], [2, -8, 0], [5, -12, 0]], u);
    P3.look(cam, pos, tgt, 0);
    aimSun(o, sunEl(0.42), [0, 20, 0], 60, 320);
    skyMorning();
    DRAW(S, cam, { near: .3, far: 5000, fog: [260, 2600] });
    if (lt < .32) pageTurn(.5 + lt / .64, 1);
  }

  // ---- 25.65 · [3] waiting at the lever: one read at a time, each held two beats ----
  function waitThrottle(t, lt, dur) {     // Bill's hand on the throttle, the gauge, steam at the valve
    const S = SITE(), { o, cam } = S; siteReset(S, t); lens(cam, 36);
    const rr = runRig(S, t); poseBill(S, t, rr, { back: 1.1 }); poseDriller(S, t);
    const tp = rr.throttleTop, k = ease(seg(lt, 0, dur));
    P3.look(cam, [ENG_X - 15.8 + .3 * k, 5.5, 2.9 - .2 * k], [ENG_X - 10.6, 6.3, .3]);
    aimSun(o, sunEl(0.44), [tp[0], 5, tp[2]], 14, 200);
    skyMorning({ top: '#EDC48A', bot: '#F6E4BE' });
    DRAW(S, cam, { near: .2, lineW: 1.9, fog: [60, 900] });
    const [gx, gy, gd] = P3.project(cam, [ENG_X - 9.6, 8.4, -.2]); if (gd > 0) for (let i = 0; i < 4; i++) { const q = frac(t * .9 + i / 4); psmoke(gx + q * 60, gy - q * 180, (8 + q * 30) * 20 / gd, AP.paperLt, .5 * (1 - q)); }
  }
  function waitRods(t, lt, dur) {         // the driller's hand resting on the yellow rod
    const S = SITE(), { o, cam, U } = S; siteReset(S, t); lens(cam, 36);
    runRig(S, t); poseDriller(S, t, { look: .25 });
    const y = U.tillerAt[1] + 1.05, k = ease(seg(lt, 0, dur));
    const h = PEOPLE.hand(S.P.driller, 'l'), hd = PEOPLE.head(S.P.driller); P3.look(cam, [-2.6 + .15 * k, 6.55, 3.0 - .12 * k], [lerp(h.x, hd.x, .45) - .15, lerp(h.y, hd.y, .45) - .1, lerp(h.z, hd.z, .45)]); void y;
    aimSun(o, sunEl(0.45), [0, 6, 0], 12, 200);
    skyMorning();
    DRAW(S, cam, { near: .2, lineW: 1.9, fog: [60, 900] });
  }
  function waitWatch(t, lt, dur) {        // insert: the boss's watch in his palm, the second hand going round
    const S = SITE(), { o, cam } = S; siteReset(S, t); lens(cam, 34);
    runRig(S, t); poseBoss(S, t, { headDown: .5, watchY: .1 }); poseDriller(S, t); poseDresser(S, t);
    const w = S.watch.position, k = ease(seg(lt, 0, dur)), hd = PEOPLE.head(S.P.boss);
    const fw = [Math.sin(BOSS_YAW), Math.cos(BOSS_YAW)]; void hd;
    P3.look(cam, [w.x + fw[0] * (1.05 - .1 * k) + .25, w.y + 1.3 - .08 * k, w.z + fw[1] * (1.05 - .1 * k) - .2], [w.x - fw[0] * .12, w.y, w.z - fw[1] * .12]);
    aimSun(o, sunEl(0.46), [w.x, 4, w.z], 16, 200);
    skyMorning();
    DRAW(S, cam, { near: .1, lineW: 1.9, fog: [60, 900] });
  }
  function waitBrake(t, lt, dur) {        // the tool dresser's hand on the brake lever
    const S = SITE(), { o, cam } = S; siteReset(S, t); lens(cam, 38);
    runRig(S, t); poseDresser(S, t, { look: .2, both: true }); poseDriller(S, t);
    const g = S.brakeGrip, k = ease(seg(lt, 0, dur));
    P3.look(cam, [2.2 + .12 * k, 5.6, -3.4 - .12 * k], [4.8, 6.75, -6.6]); void g;
    aimSun(o, sunEl(0.46), [g[0], 4, g[2]], 14, 200);
    skyMorning();
    DRAW(S, cam, { near: .2, lineW: 1.9, fog: [60, 900] });
  }

  // ---- 29.93 · [4] let her go: the boss nods, Bill opens her up, the belt takes up, the beam lifts: the first blow ----
  function letNod(t, lt, dur) {
    const S = SITE(), { o, cam } = S; siteReset(S, t); lens(cam, 34);
    const rr = runRig(S, t); crewAll(S, t, rr);
    const snap = ease(seg(lt, .1, .35));
    const nod = Math.sin(seg(lt, .5, .92) * Math.PI) * (1 - .35 * seg(lt, .7, .92));
    poseBoss(S, t, { headDown: .35 * (1 - ease(seg(lt, .05, .3))) + .42 * nod, watchW: 1 - snap, turnHead: .75 * ease(seg(lt, .05, .35)) });
    const hd = PEOPLE.head(S.P.boss), k = ease(seg(lt, 0, dur));
    P3.look(cam, [hd.x + 1.2 - .1 * k, hd.y - 1.0, hd.z + 4.8 - .4 * k], [hd.x + .1, hd.y + .05, hd.z]);
    aimSun(o, sunEl(0.47), [hd.x, 3, hd.z], 20, 200);
    skyMorning();
    DRAW(S, cam, { near: .2, lineW: 1.8, fog: [80, 1200] });
  }
  function letThrottle(t, lt, dur) {
    const S = SITE(), { o, cam } = S; siteReset(S, t); lens(cam, 38);
    const rr = runRig(S, t);
    poseBill(S, t, rr, { back: 1.1 * (1 - ease(seg(t, 30.98, 31.16))), lean: -.08 * ease(seg(t, 31.05, 31.3)) });
    const tp = rr.throttleTop, k = ease(seg(lt, 0, dur));
    P3.look(cam, [ENG_X - 11.9 - .2 * k, 6.1, 8.2 - .4 * k], [ENG_X - 10.6, 6.3, 1.2]); void tp;
    aimSun(o, sunEl(0.48), [tp[0], 5, tp[2]], 18, 200);
    skyMorning();
    DRAW(S, cam, { near: .2, lineW: 1.8, fog: [80, 1200] });
    // steam hisses from the cylinder cocks as she takes steam, then the exhaust starts to beat
    const on = seg(t, 30.95, 31.2);
    if (on > 0) { const [cx, cy, cd] = P3.project(cam, [ENG_X + 2.2, 7.4, 1.2]); for (let i = 0; i < 6; i++) { const q = frac(t * 1.6 + i / 6); psmoke(cx + (q * 260 + i * 10) * (i % 2 ? 1 : -.5), cy + q * 40, (10 + q * 60) * 25 / cd, AP.paperLt, .6 * (1 - q) * on); } }
    stackSmoke(S, cam, t, on);
  }
  function letBelt(t, lt, dur) {           // the flywheel turns, the belt takes up, the band wheel and crank begin to lift the beam
    const S = SITE(), { o, cam } = S; siteReset(S, t); lens(cam, 34);
    const rr = runRig(S, t); crewAll(S, t, rr);
    const k = ease(seg(lt, 0, dur)), tg = path([[48.5, 9.4, 2.4], [40, 8.6, 1.6], [31.5, 8.6, .8], [27.5, 11.5, .5]], k);
    P3.look(cam, [lerp(44, 34, k), lerp(6.5, 6, k), 23], tg);
    aimSun(o, sunEl(0.48), [36, 6, 0], 30, 250);
    skyMorning();
    DRAW(S, cam, { near: .3, lineW: 1.7 });
    stackSmoke(S, cam, t);
  }
  function letBlow(t, lt, dur) {           // the string hangs at the top of the first lift... and drops: the first blow, on the bar
    const S = SITE(), { o, cam } = S; siteReset(S, t); lens(cam, 48);
    const rr = runRig(S, t); crewAll(S, t, rr);
    const hit = t >= T_BLOW1 ? Math.exp(-(t - T_BLOW1) * 9) : 0, sh = shakeXY(t, hit * .07);
    const k = ease(seg(lt, 0, dur));
    const pk = ease(seg(t, 32.42, T_BLOW1)); P3.look(cam, [lerp(1.5, 1.2, pk) + sh[0], lerp(3.6, 3.45, pk) + sh[1], lerp(-6.2, -5.4, pk)], [.8, 5.0, .5]);
    aimSun(o, sunEl(0.49), [0, 8, 0], 24, 250);
    skyMorning();
    DRAW(S, cam, { near: .3, lineW: 1.8 });
    blowDust(S, cam, t);
  }

  // ---- 33.57 · chorus 1: the machine finds its rhythm, from three angles; the driller feels each blow; then the section ----
  function chLow(t, lt, dur) {             // low under the beam: the whole plant rocking against the sky
    const S = SITE(), { o, cam } = S; siteReset(S, t); lens(cam, 44);
    const rr = runRig(S, t); crewAll(S, t, rr);
    const k = ease(seg(lt, 0, dur));
    P3.look(cam, [lerp(36, 32, k), .9, lerp(24, 23, k)], [lerp(12, 10, k), 15.5, -1]);
    aimSun(o, sunEl(0.52), [15, 8, 0], 40, 250);
    skyMorning({ split: .7 });
    DRAW(S, cam, { near: .3 });
    blowDust(S, cam, t); stackSmoke(S, cam, t);
  }
  function chHigh(t, lt, dur) {            // high in the derrick, looking down: the beam's head, the string, the driller at the hole
    const S = SITE(), { o, cam } = S; siteReset(S, t); lens(cam, 44);
    const rr = runRig(S, t); crewAll(S, t, rr);
    const k = ease(seg(lt, 0, dur));
    P3.look(cam, [lerp(-3.2, -2.8, k), lerp(31, 29, k), lerp(4.2, 3.8, k)], [.9, 3.6, .5], 0);
    aimSun(o, sunEl(0.54), [0, 6, 0], 30, 250);
    skyMorning();
    DRAW(S, cam, { near: .3 });
    blowDust(S, cam, t);
  }
  function chEngine(t, lt, dur) {          // from beyond the engine along the belt: flywheel blurring, the beam slow and heavy
    const S = SITE(), { o, cam } = S; siteReset(S, t); lens(cam, 40);
    const rr = runRig(S, t); crewAll(S, t, rr);
    const k = ease(seg(lt, 0, dur));
    P3.look(cam, [lerp(66, 63, k), lerp(4.5, 4, k), lerp(15, 13, k)], [lerp(34, 32, k), 11.5, -1]);
    aimSun(o, sunEl(0.54), [30, 8, 0], 45, 250);
    skyMorning();
    DRAW(S, cam, { near: .3 });
    stackSmoke(S, cam, t); blowDust(S, cam, t);
  }
  function chDriller(t, lt, dur) {         // close on her: the hand on the rod takes each blow; her face under the brim, listening
    const S = SITE(), { o, cam } = S; siteReset(S, t); lens(cam, 36);
    const rr = runRig(S, t); crewAll(S, t, rr);
    const p = S.P.driller, since = frac(bpOf(t) / 2 + 1e-6) * 2 * BEAT, hit = Math.exp(-since * 11);
    // she listens: head a little down and cocked; it gives with each blow and comes back
    PEOPLE.turn(p, 'neck_01', [.16 + .05 * hit, 0, .08]); PEOPLE.turn(p, 'Head', [.1 + .04 * hit, -.12, .05]);
    const hd = PEOPLE.head(p), hl = PEOPLE.hand(p, 'l'), k2 = ease(seg(lt, 0, dur)), sh = shakeXY(t, hit * .025);
    // past the rod and her hand on it, to her face (a slow push in); at the end the camera whips down the rod
    const wk = easeIn(seg(lt, dur - .24, dur)), tg = [lerp(hl.x, hd.x, .44), lerp(hl.y, hd.y, .5), lerp(hl.z, hd.z, .44)];
    P3.look(cam, [lerp(-1.75, -1.55, k2) + sh[0], 6.45 + sh[1], lerp(1.05, .98, k2)], [lerp(tg[0], .2, wk), lerp(tg[1], -2.5, wk), lerp(tg[2], .1, wk)]);
    aimSun(o, sunEl(0.55), [1, 6, 1], 12, 200);
    if (wk > 0) { const L = into(4, () => { skyMorning(); DRAW(S, cam, { near: .2, lineW: 1.9, fog: [60, 900] }); }); smear(L, -wk * 260); return; }
    skyMorning();
    DRAW(S, cam, { near: .2, lineW: 1.9, fog: [60, 900] });
  }
  function chSection(t, lt, dur) {         // the cutaway: the bit strikes on the beat and goes down through the clay to ~600 ft
    const S = SITE(), { o, cam } = S; siteReset(S, t, { section: true }); lens(cam, 42);
    const rr = runRig(S, t); crewAll(S, t, rr);
    const dk = easeOut(seg(lt, .1, dur - .15)), depth = lerp(30, 600, dk), st = rr.st;
    setSection(S, depth, st, Math.min(depth, 60 + depth * .55));
    const yb = S.sec.userData.y(depth), sh = shakeXY(t, Math.exp(-frac(bpOf(t) / 2 + 1e-6) * 12) * .6);
    const wk = 1 - easeOut(seg(lt, 0, .3));                      // the end of the whip tilt from the driller
    const pk = ease(seg(lt, .2, dur - .2)); P3.look(cam, [lerp(18, 15, pk) + sh[0], lerp(-8, -43, pk) + sh[1], lerp(95, 100, pk)], [lerp(5, 2, pk), lerp(-12, -45, pk) + wk * 30, 0]);
    aimSun(o, sunEl(0.57), [0, yb, 0], 120, 400);
    if (wk > 0) { const L = into(4, () => { skyMorning(); DRAW(S, cam, { near: 1, far: 5000, fog: [600, 4000] }); }); smear(L, -wk * 200); }
    else { skyMorning(); DRAW(S, cam, { near: 1, far: 5000, fog: [600, 4000] }); }
    // the depth scale down the left of the cut
    const x0 = -34;
    for (let d = 0; d <= 800; d += 100) {
      const [ax, ay, ad] = P3.project(cam, [x0, -d * .1, .4]), [bx, by] = P3.project(cam, [x0 + (d % 500 === 0 ? 4 : 2), -d * .1, .4]);
      if (ad <= 0 || ay < -40 || ay > 900) continue;
      pline([[ax, ay], [bx, by]], d % 200 === 0 ? 1.3 : .8, AP.graphite, { over: 0, passes: 1 });
      if (d % 200 === 0 && d > 0) label(`${d} FT`, bx + 10, by, 30, AP.graphite, { screen: true });
    }
    const [r0x, r0y] = P3.project(cam, [x0, 0, .4]), [r1x, r1y] = P3.project(cam, [x0, -80, .4]);
    pline([[r0x, Math.max(-20, r0y)], [r1x, Math.min(900, r1y)]], 1.3, AP.graphite, { over: 0 });
    const [bx, by] = P3.project(cam, [x0 - 1, yb, .4]); pfill([[bx - 4, by], [bx - 26, by - 13], [bx - 26, by + 13]], AP.rust, { tone: .9, sw: 1 });
    // the blow at the bottom of the hole: chips fly, rock dust
    const since = frac(bpOf(t) / 2 + 1e-6) * 2 * BEAT;
    if (since < .35) { const q = since / .35, [tx, ty, td] = P3.project(cam, [0, yb - .1, 1]); seed('chips');
      for (let i = 0; i < 9; i++) { const a = Math.PI + (i + .5) / 9 * Math.PI, r0 = 20 * 30 / td, r1 = r0 + (90 + 60 * hash(i)) * q * 30 / td; pline([[tx + Math.cos(a) * r0, ty + Math.sin(a) * r0 * .5], [tx + Math.cos(a) * r1, ty + Math.sin(a) * r1 * .5]], 1.1, AP.graphite, { alpha: 1 - q, over: 0, passes: 1 }); }
      psmoke(tx, ty - 10, (40 + 90 * q) * 30 / td, AP.dust, .55 * (1 - q)); pglow(tx, ty, 900 / td * (1 + q), AP.lamp, .9 * (1 - q)); }
  }

  // ---- 45.19 · instrumental: days pass at the bore (a day to a bar: sunrise on each downbeat) ----
  const BAR = 4 * BEAT, DAY0 = 44.932;                            // dawns on beats 82, 86, 90, 94
  const dayOf = t => (t - DAY0) / BAR;                             // days since the montage began (fractional)
  // light for a phase 0..1 of the day: 0 sunrise, .5 sunset, .5..1 night
  function daylight(ph) {
    const up = ph < .5, d = up ? ph / .5 : 0, el = up ? Math.sin(d * Math.PI) * .48 + .02 : -.2;
    const a = Math.PI * (up ? d : 1), h = [EAST[0] * Math.cos(a) + NORTH[0] * Math.sin(a), EAST[2] * Math.cos(a) + NORTH[2] * Math.sin(a)];
    const dir = nrm([h[0] * Math.cos(el), Math.max(.08, Math.sin(el)), h[1] * Math.cos(el)]);
    const dusk = Math.exp(-Math.pow((ph - .5) / .045, 2)), dawn = Math.exp(-Math.pow(Math.min(ph, 1 - ph) / .035, 2));
    const night = ph > .5 ? clamp(Math.min((ph - .52) / .06, (.985 - ph) / .05)) : 0;
    const warm = clamp(dusk + dawn * .8);
    const K = [['#E9BE7E', '#F6E6C2'], ['#B8583E', '#EFA25E'], ['#1B3340', '#2C5660']];
    const top = mixCol(mixCol(K[0][0], K[1][0], warm), K[2][0], night), bot = mixCol(mixCol(K[0][1], K[1][1], warm), K[2][1], night);
    return { dir, night, warm, top, bot, fog: night > .5 ? '#2C5660' : mixCol('#F4E2BE', '#F0B27A', warm),
      sunK: lerp(lerp(4.4, 2.4, warm), .5, night), fillK: lerp(.95, .28, night), sunCol: night > .5 ? '#9AB4C8' : mixCol('#FFE8C4', '#FF9A58', warm),
      fillCol: night > .5 ? '#5A7E8C' : '#FFF3DC', gnd: night > .5 ? '#1E2A30' : '#9A7A54', ink: night > .6 ? '#1C1A18' : AP.graphite };
  }
  // the sky for a phase of the day; stars at night (the 3D clears them where it stands in front)
  function skyDay(L, t) { sky(L.top, L.bot, { still: true, split: .6, hatch: .6 }); void t; }
  // stars, drawn after the night wash: above the horizon and clear of the derrick's silhouette
  function stars(L, t, cam) {
    if (L.night <= .2) return;
    const hz = P3.project(cam, [cam.position.x + 3000 * Math.sin(Math.atan2(cam.matrixWorld.elements[8], cam.matrixWorld.elements[10]) + Math.PI), 0, cam.position.z + 3000 * Math.cos(Math.atan2(cam.matrixWorld.elements[8], cam.matrixWorld.elements[10]) + Math.PI)])[1];
    const q = [[-8.5, 0, 0], [-1.8, 62, 0], [1.8, 62, 0], [8.5, 0, 0]].map(p => P3.project(cam, p)), xs = q.map(p => p[0]);
    const inDerrick = (x, y) => { const k = clamp((y - q[1][1]) / Math.max(1, q[0][1] - q[1][1])); return y > q[1][1] - 20 && x > lerp(Math.min(xs[1], xs[2]), Math.min(xs[0], xs[3]), k) - 14 && x < lerp(Math.max(xs[1], xs[2]), Math.max(xs[0], xs[3]), k) + 14; };
    for (let i = 0; i < 110; i++) {
      const sx = hash(i * 3.3) * W, sy = hash(i * 7.7) * (hz - 40); if (inDerrick(sx, sy)) continue;
      const a = (L.night - .2) * 1.25 * (.6 + .4 * Math.sin(t * 6 + i * 1.7)), r = 1.2 + hash(i * 5) * 1.8;
      pglow(sx, sy, 9 + r * 4, '#DDE8FF', a * .7); X.save(); X.globalAlpha = clamp(a); X.fillStyle = '#F4F6FF'; X.beginPath(); X.arc(sx, sy, r, 0, TAU); X.fill(); X.restore();
    }
  }
  function nightLamps(S, L) {
    const lit = clamp(L.night * 1.6 + L.warm * .4 * (L.night > 0 ? 1 : 0));
    S.lamps[0].intensity = 1500 * lit; S.lamps[1].intensity = 900 * lit; S.lamps[1].position.set(ENG_X - 11, 8, 3);
    if (lit > 0) { S.lant[0].visible = true; PROPS.at(S.lant[0], [6.4, 11.2, 6.4]); S.lant[1].visible = true; PROPS.at(S.lant[1], [ENG_X - 11, 8.9, 3]); }
    return lit;
  }
  // night: the whole drawing goes down into blue-grey (the lantern glows go on top, after this)
  function nightWash(k) { if (k <= 0) return; X.save(); X.setTransform(1, 0, 0, 1, 0, 0); X.globalCompositeOperation = 'multiply'; X.globalAlpha = clamp(k) * .62; X.fillStyle = '#4E6E78'; X.fillRect(0, 0, W, H); X.restore(); }
  const lampGlow = (S, cam, lit, r = 2600) => { if (lit > 0) for (const L of S.lamps) { const [lx, ly, ld] = P3.project(cam, v2a(L.position)); if (ld > 0) pglow(lx, ly, r / ld, '#FFB45A', lit); } };
  // time-lapse ghosts: a figure is caught at one of a few spots for a few frames, then gone
  function ghost(S, t, name, spots, rate, pose) {
    const n = Math.floor(t * rate), k = hash(n * 7.3 + name.length * 3.1);
    if (k < .3) return null;
    const sp = spots[Math.floor(hash(n * 5.1 + name.length) * spots.length)], p = show(S.P[name]);
    PEOPLE.at(p, sp[0], sp[1]); PEOPLE.clip(p, sp[2] || 'Idle_Loop', t + n * .37); if (pose) pose(p, sp);
    return p;
  }
  const depthAt = t => t < 49.204 ? lerp(600, 760, seg(t, 45.19, 49.204)) : 760 + 60 * Math.min(3, Math.floor((t - 49.204) / BEAT + .15));   // chalked up a beat at a time
  function daysWide(t, lt, dur) {
    if (lt < .7) {
      const A = shotInto(4, chSection, t, 42.2, 45.19 - 42.2), B = shotInto(5, daysWideShot, t, 45.19, dur);
      strokeMask(lay(3), ease(lt / .7), (x, y) => .15 + .7 * (x / W * .6 + (1 - y / H) * .4), { len: 220, soft: .25, lane: 20, w: 34 });
      maskedOut(A, lay(3)); masked(B, lay(3)); stamp(A); stamp(B); return;
    }
    daysWideShot(t, lt, dur);
  }
  function daysWideShot(t, lt, dur) {
    const S = SITE(), { o, cam } = S, day = dayOf(t), L = daylight(frac(day));
    const gone = Math.min(4, Math.floor(seg(t, 45.45, 47.3) * 5));
    siteReset(S, t, { board: depthAt(t), rackGone: gone, sunK: L.sunK, fillK: L.fillK, sunCol: L.sunCol, fillCol: L.fillCol, gndCol: L.gnd });
    lens(cam, 52);
    runRig(S, t, { stroke: frac(bpOf(t) * 2 + 1e-6) });
    const lit = nightLamps(S, L);
    poseDriller(S, t);
    ghost(S, t, 'lab', [[[-17, 0, -4], 1.2, 'Walk_Carry_Loop'], [[-11, 0, -1], 1.4, 'Walk_Carry_Loop'], [[-18.5, 0, 2], .2, 'PickUp_Table']], 7);
    ghost(S, t, 'hand', [[[7.8, 0, -8.2], -2.4], [[6.8, 0, -9.6], -2.1, 'Push_Loop'], [[-8, 0, -9], 2.6, 'Idle_Loop']], 5);
    ghost(S, t, 'dresser', [[[-23, 0, 8], Math.PI / 2, 'TreeChopping_Loop'], [[-24, 0, 5], .4], [[-4, 2.2, 3], 2]], 6);
    const k = ease(seg(lt, 0, dur));
    P3.look(cam, [lerp(-44, -40, k), 18, lerp(-116, -108, k)], [-8, 31, 10]);
    aimSun(o, L.dir, [-10, 10, -20], 130, 420);
    skyDay(L, t);
    const sp = sunScreen(cam, L.dir); if (sp && L.night < .3) sun(sp[0], sp[1], 42, .35 + L.warm * .3);
    DRAW(S, cam, { fog: [220, 1700], fogCol: L.fog, ink: L.ink, lightTint: .7 });
    nightWash(L.night); stars(L, t, cam);
    lampGlow(S, cam, lit, 7000);
    if (L.night < .6) stackSmoke(S, cam, t * 2.2, 1 - L.night);
  }
  // two of the crew carry a pole from the rack to the derrick on their shoulders (front and back), path k 0..1
  function poleCarry(S, t, k) {
    const A = [-16.5, 0, -12], B = [-5.5, 0, -2.5], d = nrm([B[0] - A[0], 0, B[2] - A[2]]), yaw = Math.atan2(d[0], d[2]);
    const front = [lerp(A[0], B[0], k) + d[0] * 5.5, 0, lerp(A[2], B[2], k) + d[2] * 5.5], back = [front[0] - d[0] * 11, 0, front[2] - d[2] * 11];
    const f = show(S.P.lab), b = show(S.P.hand);
    PEOPLE.at(f, front, yaw); PEOPLE.clip(f, 'Walk_Loop', t * 1.1);
    PEOPLE.at(b, back, yaw); PEOPLE.clip(b, 'Walk_Loop', t * 1.1 + .45);
    const side = [d[2], 0, -d[0]];   // to the carriers' right
    const sh = p => { const v = new THREE.Vector3(); p.bones.upperarm_r.getWorldPosition(v); return [v.x + side[0] * .05, v.y + .42, v.z + side[2] * .05]; };
    const pf = sh(f), pb = sh(b), mid = lerp3(pf, pb, .5), dir = nrm([pf[0] - pb[0], pf[1] - pb[1], pf[2] - pb[2]]);
    S.pole.visible = true; S.pole.position.set(...lerp3(pf, pb, .5).map((v, i) => v + dir[i] * 2.5)); S.pole.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...dir));
    S.poleJ.forEach((j, i) => { j.visible = true; j.position.set(...mid.map((v, n) => v + dir[n] * (i ? 12 : -7))); j.quaternion.copy(S.pole.quaternion); });
    for (const [p, q] of [[f, pf], [b, pb]]) PEOPLE.reach(p, 'r', [q[0] + dir[0] * .6, q[1] + .05, q[2] + dir[2] * .6], [q[0] + side[0] * 1.2, q[1] - 1.4, q[2] + side[2] * 1.2]);
  }
  function daysRods(t, lt, dur) {                 // from above: the rack empties, pole after pole carried to the derrick, day and night
    const S = SITE(), { o, cam } = S, day = dayOf(t), L = daylight(frac(day));
    const trips = 4, u = seg(lt, .05, dur - .1) * trips, n = Math.floor(u), q = u - n;
    siteReset(S, t, { board: depthAt(t), rackGone: Math.min(8, 4 + n + (q > .15 ? 1 : 0)), sunK: L.sunK, fillK: L.fillK, sunCol: L.sunCol, fillCol: L.fillCol, gndCol: L.gnd });
    lens(cam, 44);
    runRig(S, t, { stroke: frac(bpOf(t) * 2 + 1e-6) });
    const lit = nightLamps(S, L);
    poseDriller(S, t);
    // time-lapse: each trip is caught in three snapshots along the way
    const snap = Math.floor(q * 3.2), vis = hash(n * 11 + snap * 3) > .15 && q > .12;
    if (vis) poleCarry(S, t, clamp(snap / 2.4 + .08));
    const k = ease(seg(lt, 0, dur));
    P3.look(cam, [lerp(-3, -4.5, k), lerp(33, 31, k), lerp(-31, -29, k)], [-12.5, 1, -7]);
    aimSun(o, L.dir, [-10, 5, -10], 45, 300);
    skyDay(L, t);
    DRAW(S, cam, { near: .3, fog: [150, 1400], fogCol: L.fog, ink: L.ink, lightTint: .8 });
    nightWash(L.night);
    lampGlow(S, cam, lit, 4200);
  }
  function daysBoard(t, lt, dur) {                // the depth board chalked higher, day after day
    const S = SITE(), { o, cam } = S, day = dayOf(t), L = daylight(frac(day));
    const ft = depthAt(t);
    siteReset(S, t, { board: ft, rackGone: 8, sunK: L.sunK, fillK: L.fillK, sunCol: L.sunCol, fillCol: L.fillCol, gndCol: L.gnd });
    lens(cam, 30);
    runRig(S, t, { stroke: frac(bpOf(t) * 2 + 1e-6) });
    const lit = nightLamps(S, L);
    // at night a lantern hangs on a nail beside the board
    const bp = S.s.at.boardPos, lp = [bp[0] + 1.75 * .88, bp[1] + 1.4, bp[2] - 1.75 * .48 + .3];
    if (lit > 0) { PROPS.at(S.lant[1], lp); S.lamps[1].position.set(lp[0] + .3, lp[1] - .55, lp[2] + .4); S.lamps[1].intensity = 260 * lit; }
    // the boss at the board, caught mid-chalk now and then
    ghost(S, t, 'boss', [[[-9.6, 0, 11.4], 2.6], [[-10.4, 0, 10.2], 2.3]], 5, p => { const b = S.s.at.boardPos; PEOPLE.reach(p, 'r', [b[0] + .3, b[1] + .1, b[2] + .35], [b[0] - 1.8, b[1] - 1.5, b[2] + 2]); });
    const b = S.s.at.boardPos, k = ease(seg(lt, 0, dur));
    P3.look(cam, [b[0] + lerp(3.4, 2.7, k), b[1] + lerp(.2, 0, k), b[2] + lerp(6.6, 5.2, k)], [b[0] + .15, b[1] - .1, b[2]]);
    aimSun(o, L.dir, [b[0], b[1], b[2]], 30, 250);
    skyDay(L, t);
    DRAW(S, cam, { near: .3, fog: [120, 1400], fogCol: L.fog, ink: L.ink, lightTint: .8 });
    nightWash(L.night);
    if (lit > 0) { const [lx, ly, ld] = P3.project(cam, PROPS.glassAt(S.lant[1])); if (ld > 0) pglow(lx, ly, 900 / ld, '#FFB45A', lit); }
    if (lt > dur - .35) scribbleWipe((lt - (dur - .35)) / .7);
  }

  shots([
    [0, intro], [11.95, cowDies], [16.27, squatter], [20.49, crane],
    [25.65, waitThrottle], [26.774, waitRods], [27.842, waitWatch], [28.91, waitBrake],
    [29.93, letNod], [30.9, letThrottle], [31.5, letBelt], [32.42, letBlow],
    [33.57, chLow], [35.319, chHigh], [37.21, chEngine], [39.29, chDriller], [42.2, chSection],
    [45.19, daysWide], [47.068, daysRods], [49.204, daysBoard],
  ]);
})();
