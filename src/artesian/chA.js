// Chapter A · 0.00–47.90 s · Drought. See docs/artesian/STORYBOARD.md and BRIEF.md.
//
// Globals defined here for other chapters:
//   openingFrame(t, o)       the skull-by-the-dry-waterhole composition (opens the film; chapter H rhymes it wet)
//   homestead(x, y, s, o)    the squatter's homestead veranda (chapters E and H)
// Both are documented at their definitions below.

// ---------- chapter-local drawing helpers (pencil marks only) ----------
const _chA = (() => {
  // Offscreen layers: draw into a spare canvas with the current transform, then composite it (alpha / mask).
  const slots = [];
  const slot = i => { if (!slots[i]) { const c = document.createElement('canvas'); c.width = W; c.height = H; slots[i] = c.getContext('2d'); } return slots[i]; };
  function inLayer(fn, o = {}) {
    const L = slot(o.slot || 0), keep = X, tr = X.getTransform(), z = ZOOM, pc = PCAM;
    L.setTransform(1, 0, 0, 1, 0, 0); L.globalAlpha = 1; L.globalCompositeOperation = 'source-over'; L.clearRect(0, 0, W, H);
    L.setTransform(tr); X = L;
    try { fn(); } finally { X = keep; ZOOM = z; PCAM = pc; }
    L.setTransform(1, 0, 0, 1, 0, 0);
    if (o.mask) {   // the mask is drawn on its own canvas, then applied once (destination-in per stroke would erase)
      const M = slot(9); M.setTransform(1, 0, 0, 1, 0, 0); M.globalAlpha = 1; M.globalCompositeOperation = 'source-over'; M.clearRect(0, 0, W, H);
      o.mask(M); L.save(); L.globalCompositeOperation = 'destination-in'; L.drawImage(M.canvas, 0, 0); L.restore();
    }
    X.save(); X.setTransform(1, 0, 0, 1, 0, 0); X.globalAlpha = o.alpha ?? 1; X.drawImage(L.canvas, 0, 0); X.restore();
  }
  // Measure a draw (e.g. the joints man() returns) without marking the page.
  let gc = null;
  function ghost(fn) {
    if (!gc) { const c = document.createElement('canvas'); c.width = c.height = 2; gc = c.getContext('2d'); }
    const keep = X, z = ZOOM, pc = PCAM; X = gc; X.setTransform(1, 0, 0, 1, 0, 0);
    try { return fn(); } finally { X = keep; ZOOM = z; PCAM = pc; }
  }
  // Colour "hatches in": a mask of fat strokes in the artist's hand direction, laid down in a sweep (k 0..1).
  // order(x, y) → 0..1 says when each part of the screen gets coloured.
  function hatchMask(c, k, order = (x, y) => x / W * .75 + y / H * .25) {
    if (k >= 1) { c.fillStyle = '#000'; c.fillRect(0, 0, W, H); return; }
    if (k <= 0) { c.clearRect(0, 0, W, H); return; }
    const ux = Math.cos(HAND), uy = Math.sin(HAND), vx = -uy, vy = ux, len = 150, lane = 22;
    c.lineCap = 'round'; c.strokeStyle = '#000'; c.lineWidth = 34;
    // project the screen corners onto (u, v) to know which lanes and positions to cover
    const cs = [[0, 0], [W, 0], [0, H], [W, H]], us = cs.map(p => p[0] * ux + p[1] * uy), vs = cs.map(p => p[0] * vx + p[1] * vy);
    const u0 = Math.min(...us) - len, u1 = Math.max(...us) + len, v0 = Math.min(...vs) - lane, v1 = Math.max(...vs) + lane;
    let li = 0;
    for (let v = v0; v <= v1; v += lane, li++) for (let u = u0 + (li % 3) * 40; u <= u1; u += len * .78) {
      const cx = u * ux + v * vx, cy = u * uy + v * vy, h = hash(li * 17.3 + u * .011);
      const thr = clamp(order(cx, cy)) * .78 + h * .12, f = clamp((k - thr) / .12);
      if (f <= 0) continue;
      const a = [cx - ux * len * .5, cy - uy * len * .5];
      c.globalAlpha = .55 + .45 * f;
      c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(a[0] + ux * len * f, a[1] + uy * len * f); c.stroke();
    }
    c.globalAlpha = 1;
  }
  // Heat shimmer: slide thin rows of the pencil layer sideways (screen space band y0..y1).
  let sc = null;
  function shimmer(t, y0, y1, amp) {
    if (amp <= .05) return;
    y0 = Math.max(0, Math.round(y0)); y1 = Math.min(H, Math.round(y1)); const h = y1 - y0; if (h < 8) return;
    if (!sc) { const c = document.createElement('canvas'); c.width = W; c.height = H; sc = c.getContext('2d'); }
    sc.setTransform(1, 0, 0, 1, 0, 0); sc.clearRect(0, 0, W, h); sc.drawImage(X.canvas, 0, y0, W, h, 0, 0, W, h);
    X.save(); X.setTransform(1, 0, 0, 1, 0, 0); X.clearRect(0, y0, W, h);
    for (let y = 0; y < h; y += 3) {
      const k = Math.sin(y / h * Math.PI), dx = amp * k * (Math.sin(t * 7.3 + y * .19) + .5 * Math.sin(t * 13.1 - y * .07));
      X.drawImage(sc.canvas, 0, y, W, 3, dx, y0 + y, W, 3);
    }
    X.restore();
  }
  // A big sky in two pencil bands, wide enough for pull-backs.
  function skyBand(top, bot, y0, y1, o = {}) {
    seed(o.key || 'skyA');
    const x0 = o.x0 ?? -2400, x1 = o.x1 ?? 4400;
    const g = X.createLinearGradient(0, o.g0 ?? y0, 0, y1); g.addColorStop(0, top); g.addColorStop(o.split ?? 1, bot); g.addColorStop(1, bot);
    X.save(); X.globalAlpha = o.tone ?? .7; X.fillStyle = g; X.fillRect(x0, y0, x1 - x0, y1 - y0 + 4); X.restore();
    pshade(rectPts(x0, y0, x1 - x0, (y1 - y0) * .6), top, (o.hatch ?? .6) * .75, { still: true });
    pshade(rectPts(x0, y0 + (y1 - y0) * .35, x1 - x0, (y1 - y0) * .65 + 4), bot, (o.hatch ?? .6) * .5, { still: true, kind: 'v' });
  }
  // Speed lines for whip pans (screen space). dir: [dx, dy] unit; k 0..1 strength.
  function speedLines(k, dir = [1, 0], col = AP.graphite, key = 'spd') {
    if (k <= .02) return;
    seed(key);
    const n = Math.round(46 * k), hor = Math.abs(dir[0]) > Math.abs(dir[1]);
    for (let i = 0; i < n; i++) {
      const a = hash(i * 3.7 + BOILN), b = hash(i * 5.1 + BOILN * .7), L = (220 + 700 * hash(i * 9.1)) * k;
      const p = hor ? [a * (W + 400) - 200, b * 900] : [a * W, b * (H + 400) - 200];
      pline([p, [p[0] + (hor ? L : 0), p[1] + (hor ? 0 : L)]], .8 + 1.6 * hash(i), col, { over: 0, passes: 1, alpha: .35 + .5 * k, taper: .9 });
    }
    pshade(rectPts(-40, -40, W + 80, H + 80), col, .35 * k, { kind: hor ? 'h' : 'v' });
  }
  // Iris of hatching: graphite crosshatch closes on (cx, cy) (screen space) leaving a hole of radius r.
  function hatchIris(cx, cy, r, k = 1) {
    if (k <= 0) return;
    seed('iris');
    X.save(); X.setTransform(1, 0, 0, 1, 0, 0);
    X.beginPath(); X.rect(-50, -50, W + 100, H + 100); X.moveTo(cx + Math.max(r, .1), cy); X.arc(cx, cy, Math.max(r, .1), 0, TAU, true); X.clip('evenodd');
    ptone(rectPts(-50, -50, W + 100, H + 100), AP.graphite, .55 * k);
    pshade(rectPts(-50, -50, W + 100, H + 100), AP.graphite, 1.7 * k);
    X.restore();
    if (r > 2) pline(ellPts(cx, cy, r, r, 40, r * .015), 2.2, AP.graphite, { closed: true });
  }
  // A walking pose for man(): ph = stride phase (1 per two steps), amt 0..1.
  function walkPose(ph, amt = 1, o = {}) {
    const s = Math.sin(ph * TAU), c = Math.cos(ph * TAU);
    return { hpF: .5 * s * amt, knF: (.15 + .45 * Math.max(0, -c)) * amt, hpB: -.5 * s * amt, knB: (.15 + .45 * Math.max(0, c)) * amt,
      shF: -.45 * s * amt + (o.shF || 0), elF: .35, shB: .45 * s * amt + (o.shB || 0), elB: .3, dy: .12 * Math.abs(Math.cos(ph * TAU * 2)) * amt, lean: .12 * amt + (o.lean || 0) };
  }
  // A wide-brimmed hat as a hand prop (the squatter's), centred at c, tilted by a.
  function hatProp(c, s, a = 0, col = CAST.squatter.hatCol) {
    seed('hatprop');
    const R = (u, v) => add2(c, rot2([u * s, v * s], a));
    pfill([R(-.5, -.05), R(-.45, -.6), R(0, -.72), R(.45, -.6), R(.5, -.05)], col, { tone: .7, dens: .9, sw: s / 55, curv: true });
    pline([R(-.5, -.12), R(.5, -.12)], s / 55 * 2.4, mixCol(col, AP.graphite, .5), { over: 0 });
    pfill([R(-1.25, .02), R(0, -.12), R(1.25, .02), R(1.1, .12), R(0, .05), R(-1.1, .12)], col, { tone: .75, dens: 1, sw: s / 55, curv: true });
  }
  return { inLayer, ghost, hatchMask, shimmer, skyBand, speedLines, hatchIris, walkPose, hatProp };
})();

// ---------- the homestead veranda (global: chapters A, E, H) ----------
// homestead(x, y, s, o) draws the squatter's slab homestead from the side-front: corrugated-iron roof over a deep
// veranda, bush-pole posts, board floor raised on stumps, slab wall with a door and a shuttered window, a dry
// corrugated rain tank at the end.
//   (x, y)  ground point under the FRONT-LEFT corner of the veranda floor. The house extends to the right.
//   s       the head unit of the people who stand on it (same s you give man()); posts are ~10s tall, the veranda
//           is o.w (default 26) s wide and 4.2s deep (drawn as a shallow floor band).
//   o.w     veranda width in s (default 26)
//   o.flip  mirror (house extends to the LEFT of x)
//   o.mid(G)   hook: draw people on the veranda (between the wall and the front posts/roof edge)
//   o.front(G) hook: draw things in front of the posts
//   o.tank  0..1 how full the rain tank is (0 = dry and rust-streaked; default 0); false = no tank
//   o.table true: a slab table and a chair on the veranda (E's bank-letter scene)
//   o.thermo { level 0..1, burst 0..1 }: a thermometer nailed to the second post; level = mercury height,
//            burst blows the top of the glass off with a spurt of red
//   o.green 0..1 greens the garden bed and the vine on the posts (H); default 0 (dead garden)
//   o.tone  0..1 overall pencil weight (1 = foreground, .5 = distant); default 1
// Returns G = { floor: y of the veranda floor top, x0, x1 (floor ends), posts: [[x, yTop], ...], step: [x, y],
//              door: [x, y], table: [x, y] (table top centre, if o.table), tank: [x, top y], s }
window.homestead = function (x, y, s, o = {}) {
  const d = o.flip ? -1 : 1, w = (o.w ?? 26) * s, tone = o.tone ?? 1, green = o.green ?? 0;
  const X0 = x, X1 = x + d * w, fl = y - .9 * s, eave = fl - 9.6 * s, ridge = eave - 5.2 * s, back = fl - 3.2 * s;
  const px = k => lerp(X0, X1, k), sw = Math.max(.8, s / 50) * (.6 + .4 * tone);
  const timber = mixCol(AP.timber, AP.paper, 1 - tone), timberDk = mixCol(AP.timberDk, AP.paper, (1 - tone) * .7);
  const iron = mixCol('#8E8A82', AP.paper, (1 - tone) * .6), ironDk = mixCol('#5E5A54', AP.paper, (1 - tone) * .6);
  const G = { floor: fl, x0: X0, x1: X1, posts: [], s, step: [px(.62), y], door: [px(.42), fl] };
  seed('home-roof-back' + (o.key ?? ''));
  // main roof (behind): a big pitched iron roof over the house, seen above the veranda roof
  pfill([[px(-.02), eave - 2.6 * s], [px(.2), ridge], [px(.95), ridge], [px(1.04), eave - 2.6 * s]], iron, { tone: .55 * tone, dens: .7, sw, kind: 'v' });
  for (let i = 0; i < 26; i++) pline([[lerp(px(.2), px(.95), i / 25), ridge], [lerp(px(-.02), px(1.04), i / 25), eave - 2.6 * s]], .6, ironDk, { over: 0, passes: 1, alpha: .5 * tone });
  // chimney
  pfill(rectPts(px(.84) - .9 * s * d, ridge - 3 * s, 1.8 * s, 3.4 * s), mixCol('#9A6A4A', AP.paper, 1 - tone), { tone: .6 * tone, sw });
  // back wall of the house under the veranda: vertical slabs
  seed('home-wall' + (o.key ?? ''));
  const wall = [[px(0), eave], [px(1), eave], [px(1), fl], [px(0), fl]];
  pfill(wall, mixCol('#A88A66', AP.paper, 1 - tone), { tone: .6 * tone, dens: .8, sw, kind: 'v', still: true });
  for (let i = 1; i < 22; i++) pline([[px(i / 22), eave + .2 * s], [px(i / 22) + (hash(i) - .5) * 3, fl]], .7, timberDk, { over: 0, passes: 1, alpha: .6 * tone });
  // shade under the veranda roof: the wall is in deep shadow
  pshade([[px(0), eave], [px(1), eave], [px(1), eave + 3.5 * s], [px(0), eave + 5.5 * s]], AP.graphite, .8 * tone, { still: true });
  pshade(wall, AP.earthDk, .35 * tone, { still: true });
  // door and window
  const dx = px(.42);
  pfill(rectPts(dx - 1.3 * s, fl - 7.4 * s, 2.6 * s, 7.4 * s), mixCol('#5E4432', AP.paper, 1 - tone), { tone: .8 * tone, dens: 1, sw });
  pshade(rectPts(dx - 1.1 * s, fl - 7.1 * s, 2.2 * s, 7 * s), AP.coal, .6 * tone);
  const wx = px(.18);
  pfill(rectPts(wx - 1.8 * s, fl - 6.4 * s, 3.6 * s, 3 * s), AP.coal, { tone: .7 * tone, sw });
  for (const sd of [-1, 1]) pfill(rectPts(wx + sd * 1.8 * s - (sd > 0 ? 0 : 1.6 * s), fl - 6.6 * s, 1.6 * s, 3.4 * s), mixCol('#7A6A4E', AP.paper, 1 - tone), { tone: .75 * tone, sw, kind: 'v' });
  // floor: boards in a shallow band, on stumps
  seed('home-floor' + (o.key ?? ''));
  const floorP = [[px(-.01), fl], [px(1.01), fl], [px(1.01), fl + .5 * s], [px(-.01), fl + .5 * s]];
  pfill(floorP, timber, { tone: .7 * tone, dens: .9, sw });
  pshade([[px(0), fl + .5 * s], [px(1), fl + .5 * s], [px(1), y], [px(0), y]], AP.coal, .9 * tone);
  for (let i = 0; i <= 8; i++) pfill(rectPts(px(i / 8) - .25 * s, fl + .4 * s, .5 * s, y - fl - .4 * s), timberDk, { tone: .7 * tone, sw: sw * .8 });
  // steps down at the front
  const stx = px(.62);
  for (let i = 0; i < 2; i++) pfill(rectPts(stx - 1.5 * s, fl + (i + 1) * .45 * s - .45 * s + .5 * s, 3 * s, .3 * s), timber, { tone: .7 * tone, sw: sw * .8 });
  // table and chair
  if (o.table) {
    seed('home-table' + (o.key ?? ''));
    const tx = px(.27), ty = fl - 3 * s; G.table = [tx, ty];
    pfill(rectPts(tx - 2.6 * s, ty - .3 * s, 5.2 * s, .5 * s), timber, { tone: .75 * tone, sw });
    for (const sd of [-1, 1]) pfill(rectPts(tx + sd * 2.2 * s - .2 * s, ty + .2 * s, .4 * s, 2.8 * s), timberDk, { tone: .75 * tone, sw: sw * .8 });
    const cx2 = tx - d * 3.6 * s;
    pfill(rectPts(cx2 - 1 * s, fl - 2.2 * s, 2 * s, .35 * s), timber, { tone: .7 * tone, sw: sw * .8 });
    pline([[cx2 - d * 1 * s, fl], [cx2 - d * 1 * s, fl - 5 * s]], sw * 2, timberDk);
    pline([[cx2 + d * .9 * s, fl], [cx2 + d * .9 * s, fl - 2.2 * s]], sw * 2, timberDk);
  }
  if (o.mid) o.mid(G);
  // posts, rail, veranda roof (front)
  seed('home-posts' + (o.key ?? ''));
  const posts = [0, .25, .5, .75, 1];
  for (const k of posts) {
    const p = px(k) + (k === 0 ? .3 : k === 1 ? -.3 : 0) * s * d;
    pfill(limb([[p, fl + .1 * s], [p + (hash(k * 9) - .5) * .2 * s, eave - .3 * s]], [.62 * s, .5 * s]), timber, { tone: .7 * tone, dens: .9, sw });
    pshade(limb([[p + .12 * s * d, fl], [p + .12 * s * d, eave]], [.3 * s, .25 * s]), AP.graphite, .5 * tone);
    G.posts.push([p, eave]);
  }
  // rail between the posts, left of the steps and right of it
  for (const [a, b] of [[0, .5], [.75, 1]]) {
    pline([[px(a), fl - 3.2 * s], [px(b), fl - 3.2 * s]], sw * 1.6, timberDk, { over: 2 });
    for (let i = 1; i < 8; i++) pline([[lerp(px(a), px(b), i / 8), fl - 3.2 * s], [lerp(px(a), px(b), i / 8), fl]], sw * .7, timberDk, { over: 0, passes: 1, alpha: .8 });
  }
  // vine on the first post: dead twigs, greening with o.green
  seed('home-vine' + (o.key ?? ''));
  for (let i = 0; i < 7; i++) {
    const p0 = [px(0) + .3 * s * d, fl - (1 + i * 1.2) * s], p1 = add2(p0, [(hash(i) - .3) * 1.4 * s * d, -(.4 + hash(i + 3)) * s]);
    pline([p0, p1], sw * .8, mixCol('#7A6048', AP.sap, green), { over: 0 });
    if (green > .05) pfill(ellPts(p1[0], p1[1], .45 * s * green, .3 * s * green, 8), AP.leaf, { tone: .6, sw: sw * .6 });
  }
  // veranda roof: a lean-to of corrugated iron, seen as a sloping band with a dark underside
  seed('home-roof' + (o.key ?? ''));
  const r0 = px(-.03), r1 = px(1.03);
  pfill([[r0, eave - 2.6 * s], [r1, eave - 2.6 * s], [r1, eave + .2 * s], [r0, eave + .2 * s]], iron, { tone: .7 * tone, dens: .9, sw, kind: 'v' });
  for (let i = 0; i < 40; i++) { const xx = lerp(r0, r1, i / 39); pline([[xx, eave - 2.6 * s], [xx, eave + .2 * s]], .7, ironDk, { over: 0, passes: 1, alpha: .6 * tone }); }
  plit([[r0, eave - 2.6 * s], [r1, eave - 2.6 * s], [r1, eave - 2.2 * s], [r0, eave - 2.2 * s]], .6 * tone);
  pline([[r0, eave + .2 * s], [r1, eave + .2 * s]], sw * 2, timberDk, { over: 3 });
  // rain tank at the far end: corrugated drum on a stand, rusty, dry
  seed('home-tank' + (o.key ?? ''));
  const tk = px(1) + d * 3 * s, tb = y - 2 * s, tw = 2 * s, th = 4.8 * s, full = o.tank || 0;
  if (o.tank !== false) {
  pfill(rectPts(tk - tw - .2 * s, tb, 2 * tw + .4 * s, 2.4 * s), timberDk, { tone: .5 * tone, sw: sw * .8 });
  pfill(rrPts(tk - tw, tb - th, 2 * tw, th, .4 * s), iron, { tone: .7 * tone, dens: .9, sw });
  for (let i = 1; i < 9; i++) pline([[tk - tw, tb - th * i / 9], [tk + tw, tb - th * i / 9]], .8, ironDk, { over: 0, passes: 1, alpha: .7 * tone });
  if (full < .5) for (let i = 0; i < 4; i++) pshade(rectPts(tk - tw + (hash(i) * 1.6 + .2) * tw, tb - th * .9, .35 * s, th * (.5 + hash(i + 2) * .4)), AP.rust, .8 * tone * (1 - full * 2), { kind: 'v' });
  pline([[tk - tw * .2, tb], [tk - tw * .2, tb + .6 * s]], sw * 1.4, AP.iron);          // the tap
  if (full > .1) { pline([[tk - tw * .2, tb + .7 * s], [tk - tw * .2 + jit(1), tb + 1.4 * s]], sw * 1.2, AP.water, { over: 0 }); }
  }
  G.tank = [tk, tb - th];
  // garden bed out front: dead stalks (green with o.green)
  seed('home-garden' + (o.key ?? ''));
  for (let i = 0; i < 14; i++) {
    const gx = px(.05 + i / 14 * .5) + (hash(i) - .5) * s, gy = y + .4 * s + hash(i + 7) * .6 * s, h = (1 + hash(i + 2) * 1.6) * s * (.5 + green * .7);
    pline([[gx, gy], [gx + (hash(i + 4) - .5) * s * (1 - green), gy - h]], sw * .8, mixCol('#8A7050', AP.sap, green), { over: 0, passes: 1 });
  }
  // thermometer on the second post
  if (o.thermo) {
    seed('home-thermo' + (o.key ?? ''));
    const [tx, te] = G.posts[1], ty = fl - 6.5 * s, lv = clamp(o.thermo.level ?? .5), b = clamp(o.thermo.burst ?? 0);
    pfill(rrPts(tx - .45 * s, ty - 2.2 * s, .9 * s, 2.8 * s, .2 * s), AP.bone, { tone: .85, sw });
    pline([[tx, ty + .1 * s], [tx, ty - 1.9 * s]], sw * .9, AP.graphiteLt, { over: 0, passes: 1 });
    pfill(ellPts(tx, ty + .2 * s, .2 * s, .2 * s, 8), AP.red, { tone: .9, sw: sw * .7 });
    pline([[tx, ty + .1 * s], [tx, ty + .1 * s - lv * 2 * s * (1 - b * .3)]], sw * 1.6, AP.red, { over: 0 });
    for (let i = 0; i < 6; i++) pline([[tx + .1 * s, ty - i * .35 * s], [tx + .3 * s, ty - i * .35 * s]], .6, AP.graphite, { over: 0, passes: 1 });
    if (b > 0) {
      for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (hash(i) - .5) * 2.2, r = (.3 + b * 1.8 * hash(i + 3)) * s; pfill(ellPts(tx + Math.cos(a) * r, ty - 2 * s + Math.sin(a) * r - b * s * hash(i + 5), .07 * s, .07 * s, 6), AP.red, { tone: .9, ink: null }); }
      for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (hash(i * 3) - .5) * 2.6, r = (.2 + b * 1.4) * s; pline([[tx + Math.cos(a) * r * .5, ty - 2 * s + Math.sin(a) * r * .5], [tx + Math.cos(a) * r, ty - 2 * s + Math.sin(a) * r]], .9, AP.bone, { over: 0 }); }
    }
  }
  if (o.front) o.front(G);
  return G;
};

// ---------- the opening frame (global: chapter H rhymes it) ----------
// openingFrame(t, o) draws the whole opening composition, sky to foreground, with its own camera: a bleached cattle
// skull on curled plates of cracked mud in the foreground with a rib cage half sunk behind it, the dry waterhole (a
// cracked pan with a last black puddle of mud) across the middle distance, a dead gidgee at left, the stock windmill
// (still) with its dry tank and trough at right, the white sun.
//   t          video time (heat shimmer, blades, glints, grass sway)
//   o.cam      [cx, cy, zoom] (default [960, 540, 1]); the world is built wide enough to pull back to zoom ~.55
//   o.draw     0..1 graphite contours drawing themselves on (default 1 = done)
//   o.colour   0..1 colour hatching in over the contours (default 1 = done); < 1 reveals it stroke by stroke.
//              (Run both backwards, or use paperFade, to lift the drawing off the page.)
//   o.wet      0..1 the ending (H): the master for all of the below; each can be set on its own too
//     o.water    0..1 waterhole filling and glinting (default wet)
//     o.grass    0..1 grass through the skull, green over the mud, the cracks closing (default wet)
//     o.spin     windmill blade angle (default: still in the drought; turning ~1.8 rad/s × wet when wet)
//     o.sheep    0..1 three sheep walk in from the right and drink at the waterhole (default wet; 1 = drinking)
//     o.derrick  0..1 the rig small on the horizon at left (default wet)
//     o.leaf     0..1 the dead gidgee leafing out (default wet)
//   o.heat     0..1 sun blaze, shimmer rings and heat shimmer over the horizon (default 1 - wet)
//   o.crow     null, or { x, y, s, flap, flip, legs } for a crow (world coords); the intro lands one on the skull
//   o.shimmer  false to skip the heat-shimmer pass
// Returns world anchor points: { skull (top of the cranium), pan: [cx, cy, rx, ry], hub, horizon }.
const _openGeo = (() => {
  const SK = [575, 690], sc = .92;   // skull: forehead centre, scale
  const S = (x, y) => { const a = -.2, c = Math.cos(a), s = Math.sin(a); return [SK[0] + (x * c - y * s) * sc, SK[1] + (x * s + y * c) * sc]; };
  const skullOut = [[-68, -72], [0, -80], [68, -72], [100, -40], [108, -8], [82, 36], [58, 92], [44, 150], [30, 196], [0, 206], [-30, 196], [-44, 150], [-58, 92], [-82, 36], [-108, -8], [-100, -40]].map(p => S(...p));
  const hornL = [[-70, -58], [-135, -70], [-180, -100], [-196, -142], [-184, -176]].map(p => S(...p));
  const hornR = [[70, -58], [138, -72], [180, -96], [196, -120]].map(p => S(...p));        // snapped off short
  const eyes = [[-58, -4], [58, -4]].map(p => S(...p)), nose = S(0, 168), poll = S(0, -84);
  const cracksSk = [[[-20, -70], [-10, -40], [-24, -10]], [[30, 40], [18, 80], [26, 120]], [[60, -60], [40, -30]]].map(P => P.map(p => S(...p)));
  // rib cage half sunk in the mud to the right of the skull
  const spine = [[770, 842], [860, 824], [960, 816], [1060, 820], [1150, 836]];
  const ribs = []; for (let i = 0; i < 8; i++) { const bx = 790 + i * 46 + (hash(i + 7) - .5) * 18, h = (120 + 90 * Math.sin((i + .7) / 8.5 * Math.PI)) * (.75 + .4 * hash(i)), broken = i === 2 || i === 6;
    const b0 = [bx, 830 - i * 1.5], lean = -30 - 34 * hash(i + 2) - i * 3;
    const P = [b0, [bx + 26, 830 - h * .45], [bx + 20, 830 - h * .85], [bx + lean * .4, 830 - h], [bx + lean, 830 - h * .86]]; ribs.push(broken ? P.slice(0, 3) : P); }
  // the dead gidgee
  const tree = [
    [[[330, 618], [336, 560], [326, 505], [342, 445]], [30, 24, 21, 18]],
    [[[340, 450], [300, 392], [254, 342], [236, 280], [240, 236]], [16, 12, 9, 5, 2]],
    [[[342, 448], [372, 380], [420, 326], [446, 262]], [15, 11, 7, 3]],
    [[[334, 480], [388, 462], [446, 452], [494, 420], [520, 402]], [10, 8, 6, 3, 1.5]],
    [[[254, 342], [206, 318], [176, 282]], [6, 4, 1.5]], [[[420, 326], [468, 316], [500, 290]], [5, 3.5, 1.5]],
    [[[300, 392], [262, 398], [226, 384]], [5, 3.5, 1.2]], [[[372, 380], [352, 330], [360, 292]], [5, 3, 1.2]],
    [[[236, 280], [212, 250]], [3, 1]], [[[446, 262], [474, 232]], [3, 1]], [[[446, 452], [470, 486]], [4, 1.5]],
  ];
  return { SK, sc, S, skullOut, hornL, hornR, eyes, nose, poll, cracksSk, spine, ribs, tree };
})();
// Curled plates of dried mud on the ground plane, in perspective (horizon hz, vanishing x vx), between screen rows
// yTop and yBot: an irregular jittered lattice of plates, shrunk apart so the dark cracks show, each with a thickness.
function _mudPlates(x0, x1, yTop, yBot, key, o = {}) {
  const col = o.col || '#C29563', dark = o.dark || '#4E3222', gapK = o.gap ?? 1, hz = o.hz ?? 500, vx = o.vx ?? 960;
  const F = yBot - hz, dNear = 1, dFar = F / (yTop - hz), du = o.du ?? .52, dd = o.dd ?? .24;
  const proj = (U, d) => [vx + U * F / d, hz + F / d];
  seed('plates' + key);
  ptone([[x0, yTop], [x1, yTop], [x1, yBot + 40], [x0, yBot + 40]], dark, .6 * gapK);
  pshade([[x0, yTop], [x1, yTop], [x1, yBot + 40], [x0, yBot + 40]], dark, 1 * gapK, { still: true });
  const nj = Math.ceil((dFar - dNear) / dd) + 1, Umax = Math.max(Math.abs(x0 - vx), Math.abs(x1 - vx)) / F * dFar + 1, ni = Math.ceil(2 * Umax / du) + 2;
  const kh = key.length * 13.7;
  const LP = (i, j) => { const h = i * 71.3 + j * 13.1 + kh; return [-Umax + (i + (j % 2) * .5 + (hash(h) - .5) * .55) * du, dNear - dd * .5 + (j + (hash(h + 3) - .5) * .5) * dd]; };
  const plates = [];
  for (let j = nj - 1; j >= 0; j--) for (let i = 0; i < ni; i++) {    // far rows first
    const q = [LP(i, j), LP(i + 1, j), LP(i + 1, j + 1), LP(i, j + 1)], h = hash(i * 3.3 + j * 7.9 + kh);
    const polys = h < .35 ? [[q[0], q[1], q[2]], [q[0], q[2], q[3]]] : h < .55 ? [[q[0], q[1], q[3]], [q[1], q[2], q[3]]] : [q];
    for (const P of polys) plates.push([P, i * 17 + j * 131 + polys.length]);
  }
  for (const [P, id] of plates) {
    const c = P.reduce((a, p) => [a[0] + p[0] / P.length, a[1] + p[1] / P.length], [0, 0]), g = .08 * gapK + .02;
    const shr = P.map(p => [lerp(p[0], c[0], g / du * 1.6), lerp(p[1], c[1], g / dd * .9)]);
    // round the plate a little: add edge midpoints pulled in (curl)
    const pl = []; shr.forEach((p, k) => { const nx = shr[(k + 1) % shr.length]; pl.push(p, [lerp(p[0], nx[0], .5) + (hash(id + k) - .5) * du * .12, lerp(p[1], nx[1], .5) + (hash(id + k + 9) - .5) * dd * .12]); });
    const S = pl.map(p => proj(p[0], p[1]));
    const sc = F / c[1] * dd; if (S.every(p => p[0] < x0 - 50) || S.every(p => p[0] > x1 + 50) || S.every(p => p[1] < yTop - 30)) continue;
    const SS = S.map(p => scr(p[0], p[1])); if (SS.every(p => p[0] < -60) || SS.every(p => p[0] > W + 60) || SS.every(p => p[1] > 905)) continue;   // off the page or under the lyric strip
    const th = sc * (.12 + .14 * hash(id + 14)), shade = hash(id + 15);
    const side = S.map(p => [p[0], p[1] + th]);
    pfill(side, mixCol(col, dark, .6), { tone: .85, dens: .7, ink: null, still: true });
    pfill(S, mixCol(col, shade < .5 ? AP.paperLt : AP.earth, .1 + .18 * Math.abs(shade - .5) * 2), { tone: .64, dens: .55, ink: null, still: true });
    tracePath(S); X.save(); X.lineJoin = 'round'; X.strokeStyle = pat(mixCol(dark, AP.graphite, .4), 's'); X.globalAlpha = .75; X.lineWidth = .6 + sc / 90; X.stroke(); X.restore();
    if (sc > 40) { const top = S.filter(p => p[1] < lerp(Math.min(...S.map(q => q[1])), Math.max(...S.map(q => q[1])), .3)); if (top.length > 1) pline(top.sort((a, b) => a[0] - b[0]), .8 + sc / 120, AP.paperLt, { over: 0, passes: 1, alpha: .6 }); }
    if (o.grass > .05 && hash(id + 16) < o.grass) for (let k = 0; k < 4; k++) { const b = S[Math.floor(hash(id + k * 3) * S.length)], h = sc * (.3 + hash(id + k) * .7) * o.grass;
      pline([[b[0], b[1] + th * .5], [b[0] + Math.sin(T * 1.3 + id + k) * sc * .05, b[1] - h]], .9 + sc / 90, AP.sap, { over: 0, passes: 1 }); }
  }
}
window.openingFrame = function (t, o = {}) {
  const wet = clamp(o.wet ?? 0), water = clamp(o.water ?? wet), grass = clamp(o.grass ?? wet), heat = clamp(o.heat ?? 1 - wet);
  const sheepK = clamp(o.sheep ?? wet), rig = clamp(o.derrick ?? wet), leaf = clamp(o.leaf ?? wet);
  const spin = o.spin ?? (.35 + t * 1.8 * wet), [cx, cy, z] = o.cam || [960, 540, 1];
  const draw = clamp(o.draw ?? 1), colour = clamp(o.colour ?? 1), Gg = _openGeo;
  const HZ = 500, PAN = [1010, 628, 470, 74], MILL = [1560, 560, 34], SUN = [1330, 150, 64];
  const out = { skull: Gg.poll, pan: PAN, hub: [MILL[0], MILL[1] - 7.2 * MILL[2]], horizon: HZ };
  const L0 = LIGHT; LIGHT = [-.7, .7];
  const bone = mixCol(AP.bone, '#FFF8EA', .3), boneDk = mixCol(AP.bone, AP.earthDk, .45);
  const scene = () => {
    camOn(cx, cy, z);
    // sky: hot ochre overhead bleaching to white haze at the horizon and round the sun; blue when wet
    _chA.skyBand(mixCol('#D98A45', '#8FBBD6', wet), mixCol('#F3DDB0', '#E3E6CF', wet), -1500, HZ + 30, { key: 'openSky', hatch: .6, tone: .75, g0: -100 });
    if (heat > 0) { pglow(SUN[0], SUN[1], SUN[2] * 7, '#FFF6E0', .4 * heat); pglow(SUN[0], SUN[1], SUN[2] * 2.6, '#FFFFFF', .45 * heat); }
    sun(SUN[0], SUN[1], SUN[2], heat);
    // far ridge, haze and scrub on the horizon
    seed('openFar');
    const ridge = []; for (let k = 0; k <= 34; k++) ridge.push([lerp(-2400, 4400, k / 34), HZ - 10 - 18 * Math.max(0, Math.sin(k * .7 + 1)) * hash(k) - 6 * hash(k + 3)]);
    ptone(ridge.concat([[4400, HZ + 10], [-2400, HZ + 10]]), mixCol('#C99A6A', '#8FA87A', wet), .4);
    ptone(rectPts(-2400, HZ - 60, 6800, 70), mixCol('#FFF1D6', '#EAF2F0', wet), .35 * (1 - wet * .5));
    pline(ridge.slice(9, 26), .8, AP.graphiteLt, { over: 0, passes: 1, alpha: .45 });
    for (let i = 0; i < 46; i++) { const sx = lerp(-900, 2900, hash(i * 3.3)), sh = 3 + 9 * hash(i); pline([[sx, HZ + 1], [sx + (hash(i + 1) - .5) * 4, HZ + 1 - sh]], .7, mixCol(AP.graphiteLt, AP.leaf, wet), { over: 0, passes: 1, alpha: .55 }); }
    if (rig > 0) { seed('openRig'); X.save(); X.globalAlpha = rig; derrick(150, HZ + 5, 118, { key: 'far', col: mixCol(AP.timber, AP.dust, .35), bays: 5 }); X.restore(); }
    // the plain: pale and bleached far off, darker toward us
    seed('openPlain');
    const gnd = [[-2400, HZ], [4400, HZ], [4400, 2200], [-2400, 2200]];
    const g = X.createLinearGradient(0, HZ, 0, 900); g.addColorStop(0, mixCol('#E2C999', '#B9C27E', grass * .8)); g.addColorStop(1, mixCol('#B98A56', '#7E9A4A', grass * .8));
    X.save(); X.globalAlpha = .8; X.fillStyle = g; tracePath(gnd); X.fill(); X.restore();
    pshade(gnd, mixCol(AP.dust, AP.sap, grass), .55, { still: true });
    pshade([[-2400, HZ + 120], [4400, HZ + 120], [4400, 2200], [-2400, 2200]], mixCol(AP.earth, AP.leaf, grass * .6), .35, { still: true, kind: 'x' });
    pline([[-2400, HZ], [4400, HZ]], .9, AP.graphiteLt, { over: 0, passes: 1 });
    // the dead gidgee, leafing out when wet
    seed('openTree');
    pshade(ellPts(420, 620, 170, 12, 14), AP.earthDk, .8);
    const wood = mixCol('#8C8276', AP.timberDk, leaf * .5);
    if (leaf > 0) for (let i = 0; i < 9; i++) { const p = [lerp(190, 520, hash(i * 2.2)), lerp(250, 400, hash(i * 3.9))], r = (26 + 22 * hash(i)) * leaf;
      pfill(ellPts(p[0], p[1], r * 1.4, r * .8, 12, r * .08), AP.leaf, { tone: .5, dens: 1.1, sw: .8, ink: mixCol(AP.leaf, AP.graphite, .5) }); }
    for (const [P, ws] of Gg.tree) {
      const sh = limb(P, ws); pfill(sh, wood, { tone: .65, dens: .9, sw: 1.1, still: true });
      X.save(); tracePath(sh); X.clip(); pshade(limb(P.map(p => [p[0] - 4, p[1] + 2]), ws.map(w => w * .55)), AP.graphite, .8); X.restore();
    }
    // windmill, trough and tank at right; a carcass by the trough
    seed('openTank');
    const [mx, my, ms] = MILL;
    pshade([[mx - 60, my], [mx + 230, my], [mx + 120, my + 18], [mx - 220, my + 18]], AP.earthDk, .7);
    pfill(rectPts(mx + 76, my - 132, 140, 124), '#8E8A82', { tone: .62, dens: .85, sw: 1.1, kind: 'v' });
    for (let i = 1; i < 7; i++) pline([[mx + 76, my - 132 + i * 18], [mx + 216, my - 132 + i * 18]], .7, '#5E5A54', { over: 0, passes: 1 });
    pshade(rectPts(mx + 76, my - 132, 50, 124), AP.graphite, .6);
    for (let i = 0; i < 4; i++) pshade(rectPts(mx + 96 + i * 30, my - 124, 9, 60 + 40 * hash(i)), AP.rust, 1 * (1 - water), { kind: 'v' });
    pfill(rectPts(mx + 68, my - 10, 156, 12), AP.timberDk, { tone: .6, sw: .8 });
    pfill([[mx - 230, my - 2], [mx - 24, my - 2], [mx - 30, my + 18], [mx - 224, my + 18]], '#7C7770', { tone: .65, sw: 1 });
    if (water > .2) { ptone([[mx - 224, my], [mx - 30, my], [mx - 32, my + 5], [mx - 222, my + 5]], AP.water, .8 * water); pline([[mx - 190, my + 1], [mx - 150, my + 1]], 1.2, '#EAF6FA', { over: 0, passes: 1, alpha: water }); }
    if (wet < .5) { seed('openCarcass'); pfill([[mx - 320, my + 22], [mx - 300, my + 4], [mx - 250, my], [mx - 225, my + 10], [mx - 232, my + 24]], mixCol(AP.earthDk, AP.dust, .3), { tone: .7, sw: .8 });
      for (let i = 0; i < 3; i++) pline([[mx - 300 + i * 18, my + 8], [mx - 292 + i * 18, my - 6]], .9, AP.bone, { over: 0 }); }
    windmill(mx, my, ms, spin);
    // the waterhole: a cracked pan with a last black puddle (dry) that fills (wet)
    seed('openPan');
    const [px, py, prx, pry] = PAN, pan = ellPts(px, py, prx, pry, 44), bank = ellPts(px, py - 4, prx + 44, pry + 20, 44);
    pfill(bank, mixCol('#A6784C', AP.sap, grass * .5), { tone: .5, dens: .7, ink: null, still: true });
    plit(ellPts(px, py + pry * .9, prx * .9, 10, 30), .6, AP.paperLt, { still: true });
    X.save(); tracePath(pan); X.clip();
    _mudPlates(px - prx - 20, px + prx + 20, py - pry - 10, py + pry + 10, 'pan', { hz: HZ, vx: px, col: '#A98058', dark: '#3E2A1E', gap: 1 - water, du: .9, dd: .5 });
    pshade(ellPts(px, py - pry * .75, prx * 1.05, pry * .6, 30), AP.earthDk, .9, { still: true });      // the far bank's shadow
    const pud = ellPts(px + 40, py + 18, 120 * (1 - water) + 2, 18 * (1 - water) + 1, 20, 3);
    if (water < .9) { pfill(pud, '#3A2A22', { tone: .85, dens: 1, ink: AP.graphite, sw: 1, still: true }); plit(ellPts(px + 10, py + 12, 50, 4, 10), .5 * (1 - water)); }
    if (water > 0) {
      const wr = prx * (.4 + .62 * water), wry = pry * (.4 + .62 * water), wp = ellPts(px, py + pry * .15 * (1 - water), wr, wry, 40);
      pfill(wp, mixCol(AP.water, '#A9CBE0', .2), { tone: .75, dens: .8, ink: AP.waterDk, sw: 1, still: true });
      plit(ellPts(px + wr * .1, py - wry * .35, wr * .75, wry * .22, 20), .7, '#EAF6FA', { still: true });
      seed('openGlint');
      for (let i = 0; i < 20; i++) { const k = frac(t * .35 + hash(i)), gx = px + (hash(i * 3) - .5) * wr * 1.5, gy = py + (hash(i * 7) - .5) * wry * 1.2; pline([[gx, gy], [gx + 24, gy]], 1.4, '#F4FBFD', { over: 0, passes: 1, alpha: water * Math.sin(k * Math.PI) }); }
      if (water > .5) pglow(px + 140, py - 8, 100, '#FFFFFF', .3 * (water - .5) * 2 * (.6 + .4 * Math.sin(t * 3)));
    }
    X.restore();
    pline(ellPts(px, py, prx, pry, 44).slice(22, 44).concat([[px + prx, py]]), 1.1, AP.earthDk, { over: 0 });   // far rim
    pline(ellPts(px, py, prx, pry, 44).slice(0, 23), 1.8, AP.graphite, { over: 0 });                               // near rim
    seed('openHoof');
    for (let i = 0; i < 30; i++) { const a = hash(i * 2.1) * Math.PI, r = 1.03 + hash(i * 4) * .12, hx = px + Math.cos(a) * prx * r, hy = py + Math.sin(a) * pry * r + 8;
      if (water < .5) pfill(ellPts(hx, hy, 6, 3.5, 6), AP.earthDk, { tone: .7, ink: null }); }
    if (grass > .05) for (let i = 0; i < 34; i++) { const a = Math.PI * (hash(i * 5.1) * .9 + .05), rx = px + Math.cos(a) * (prx + 24), ry = py + Math.sin(a) * (pry + 10), h = (12 + 28 * hash(i)) * grass;
      pline([[rx, ry], [rx + Math.sin(t * 1.4 + i) * 3, ry - h]], 1, AP.leaf, { over: 0, passes: 1 }); }
    // sheep coming to drink (wet)
    if (sheepK > .02) {
      // drinking at the rims, facing the water; each walks in from behind itself
      const spots = [[585, 652, 22, 0, false], [1432, 646, 20, .15, true], [1290, 716, 26, .3, true]];
      spots.forEach(([sx, sy, ss, lag, fl], i) => {
        const k = clamp((sheepK - lag) / (1 - lag * .9)), xx = lerp(sx + (fl ? 800 : -800), sx, ease(k));
        sheep(xx, sy, ss, { flip: fl, walk: k < .98 ? t * 1.6 + i * .3 : null, drink: k >= .98, graze: k >= .98 ? 1 : 0, key: 'openSheep' + i });
      });
    }
    // foreground: curled plates of cracked mud
    _mudPlates(-900, 2800, 716, 1060, 'fg', { hz: HZ, col: mixCol('#C39664', '#9DAE5E', grass * .6), dark: mixCol('#4A2E1E', '#4E6A32', grass * .5), gap: 1 - grass * .7, grass });
    // the rib cage half sunk to the right of the skull (back ribs, spine, front ribs)
    seed('openRibs');
    pshade(ellPts(990, 846, 250, 22, 18), AP.graphite, 1.1);
    Gg.ribs.forEach((P, i) => { if (i % 2) return; const sh = limb(P, [12, 11, 9, 7, 5].slice(0, P.length)); pfill(sh, mixCol(bone, AP.dust, .35), { tone: .75, dens: .6, sw: .9 }); });
    pfill(limb(Gg.spine, [22, 26, 24, 22, 16]), bone, { tone: .8, dens: .5, sw: 1.3, curv: true });
    for (let i = 0; i < 9; i++) { const p = lerp2(Gg.spine[0], Gg.spine[4], i / 8); pline([[p[0], p[1] - 10], [p[0] + 4, p[1] + 10]], 1, boneDk, { over: 0, passes: 1 }); }
    Gg.ribs.forEach((P, i) => { if (!(i % 2)) return; const sh = limb(P, [14, 13, 11, 8, 5].slice(0, P.length));
      pfill(sh, bone, { tone: .8, dens: .5, sw: 1.1 }); X.save(); tracePath(sh); X.clip(); pshade(limb(P.map(p => [p[0] - 5, p[1] + 3]), [8, 7, 6, 5, 3].slice(0, P.length)), AP.graphite, .7); X.restore(); });
    // the skull: foreground, strong cast shadow away from the sun
    seed('openSkull');
    const shd = Gg.skullOut.map(p => [p[0] - 70 - (p[1] - 690) * .1, 896 - (896 - p[1]) * .12]);
    pshade(shd, AP.graphite, 1.5); ptone(shd, AP.earthDk, .35);
    pshade(ellPts(Gg.nose[0] - 20, Gg.nose[1] + 30, 90, 14, 14), AP.graphite, 1.3);
    for (const [H0, ws] of [[Gg.hornL, [34, 28, 20, 12, 4]], [Gg.hornR, [34, 28, 24, 20]]]) {
      const sh = limb(H0, ws); pfill(sh, mixCol(bone, AP.straw, .35), { tone: .8, dens: .6, sw: 1.6 });
      X.save(); tracePath(sh); X.clip(); pshade(limb(H0.map(p => [p[0] + 3, p[1] + 8]), ws.map(w => w * .5)), AP.earthDk, .8); X.restore();
    }
    const hr = Gg.hornR[3]; pfill(ellPts(hr[0], hr[1], 9, 11, 8, 1, -.9), boneDk, { tone: .8, sw: 1 });   // the snapped horn's end
    pfill(Gg.skullOut, bone, { tone: .88, dens: .45, sw: 2.2, curv: true });
    X.save(); tracePath(Gg.skullOut, true, true); X.clip();
    pshade(Gg.skullOut.map(p => [p[0] - 34, p[1] + 10]).map((p, i) => i > 3 && i < 13 ? p : [p[0] - 60, p[1]]), boneDk, .7);
    pshade([Gg.S(-110, -40), Gg.S(-40, 40), Gg.S(-30, 210), Gg.S(-120, 210)], AP.earthDk, .6);
    plit([Gg.S(10, -70), Gg.S(80, -60), Gg.S(70, 20), Gg.S(20, 80)], .8);
    X.restore();
    for (const e of Gg.eyes) { pfill(ellPts(e[0], e[1], 27 * Gg.sc, 23 * Gg.sc, 12, 1.5, -.2), AP.coal, { tone: .95, dens: 1.2, sw: 1.6, cross: .6 }); }
    pfill(ellPts(Gg.nose[0] - 9, Gg.nose[1], 10, 24, 10, 1, -.2), AP.coal, { tone: .95, dens: 1.2, sw: 1.2 });
    pfill(ellPts(Gg.nose[0] + 11, Gg.nose[1] - 3, 10, 24, 10, 1, -.2), AP.coal, { tone: .95, dens: 1.2, sw: 1.2 });
    for (const P of Gg.cracksSk) pline(P, 1, AP.graphite, { over: 0, passes: 1 });
    if (grass > .02) { seed('openSkullGrass'); for (let i = 0; i < 16; i++) { const b = lerp2(Gg.S(-90, 180), Gg.S(90, 170), hash(i * 3.1)), h = (40 + 90 * hash(i)) * grass;
      pline([[b[0], b[1] + 20], [b[0] + (hash(i + 1) - .5) * 30 + Math.sin(t * 1.3 + i) * 5, b[1] + 20 - h]], 1.6, i % 3 ? AP.sap : AP.leaf, { over: 0, taper: .8 }); }
      for (const e of Gg.eyes) for (let i = 0; i < 5; i++) pline([[e[0] + (i - 2) * 6, e[1] + 14], [e[0] + (i - 2) * 9 + Math.sin(t * 1.2 + i) * 4, e[1] + 14 - (30 + 25 * hash(i)) * grass]], 1.3, AP.sap, { over: 0, taper: .8 }); }
    if (o.crow) { const c = o.crow; if (c.legs) for (const dx of [-7, 8]) pline([[c.x + dx, c.y + 8], [c.x + dx + 3, c.y + 30]], 1.6, AP.graphite, { over: 0 });
      crow(c.x, c.y, c.s ?? 38, c.flap ?? 0, { flip: c.flip, key: 'openCrow' }); }
    camOff();
  };
  if (colour >= 1) scene();
  else if (colour > 0) _chA.inLayer(scene, { mask: c => _chA.hatchMask(c, colour, (x, y) => { const hy = 540 + (HZ - cy) * z; return y < hy ? .02 + x / W * .3 + y / H * .2 : .32 + x / W * .38 + (y - hy) / H * .5; }) });
  // graphite contours drawing themselves on (and fading as the colour arrives)
  if (draw > 0 && colour < 1) {
    camOn(cx, cy, z); seed('openContours');
    const a = clamp(1.1 - colour * 1.15), P = (pts, k0, k1, w = 1.4, closed = false) => {
      const k = ease(seg(draw, k0, k1)); if (k <= 0) return;
      pline(partial(closed ? pts.concat([pts[0]]) : pts, k), w, AP.graphite, { over: 0, alpha: a, taper: .4 });
    };
    P([[-300, HZ], [700, HZ + 2], [1300, HZ - 1], [2200, HZ]], 0, .2, 1.2);
    P(ellPts(SUN[0], SUN[1], SUN[2], SUN[2], 30), .1, .26, 1.2, true);
    P(ellPts(PAN[0], PAN[1], PAN[2], PAN[3], 44), .2, .42, 1.5, true);
    const [mx, my, ms] = MILL, hub = [mx, my - 7.2 * ms];
    P([[mx - 1.2 * ms, my], [mx - .15 * ms, my - 7 * ms]], .28, .4, 1.3); P([[mx + 1.2 * ms, my], [mx + .15 * ms, my - 7 * ms]], .31, .43, 1.3);
    for (let i = 0; i < 12; i++) P([hub, polar(hub, spin + i / 12 * TAU, 2.4 * ms)], .4 + i * .01, .46 + i * .01, 1);
    P(rectPts(mx + 76, my - 132, 140, 124), .44, .56, 1.1, true);
    Gg.tree.forEach(([Q], i) => P(Q, .26 + i * .02, .4 + i * .025, i ? 1.1 : 1.8));
    P(Gg.skullOut, .48, .66, 2.2, true); P(Gg.hornL, .6, .72, 2); P(Gg.hornR, .62, .72, 2);
    Gg.eyes.forEach((e, i) => P(ellPts(e[0], e[1], 25, 21, 14), .66 + i * .03, .74 + i * .03, 1.6, true));
    P(Gg.spine, .7, .8, 1.6); Gg.ribs.forEach((Q, i) => P(Q, .72 + i * .015, .82 + i * .015, 1.4));
    for (let i = 0; i < 12; i++) { const x0 = -100 + i * 200 + 60 * hash(i), y0 = 740 + 120 * hash(i + 4); P([[x0, y0], [x0 + 90, y0 + 16 * (hash(i + 1) - .5)], [x0 + 170, y0 + 24 * (hash(i + 2) - .5)], [x0 + 200, y0 + 40]], .74 + i * .012, .88 + i * .01, 1); }
    camOff();
  }
  if (heat > .05 && o.shimmer !== false) { const sy = 540 + (HZ - cy) * z; _chA.shimmer(t, sy - 80 * z, sy + 70 * z, 3.4 * heat * Math.min(colour * 1.4, 1)); }
  LIGHT = L0;
  return out;
};

(() => {
  const { inLayer, ghost, speedLines, hatchIris, walkPose, hatProp, skyBand } = _chA;
  const L_DEFAULT = LIGHT;

  // ---------------- shot 1 · 0.00–7.40 · the opening frame sketches itself in; a crow lands on the skull ----------------
  function s1Crow(t) {
    // flies in from the upper right, lands on the skull's brow 5.55, pecks, lifts off 6.85 and flies out right
    const land = [_openGeo.poll[0] + 4, _openGeo.poll[1] - 22];
    if (t < 4.3) return null;
    if (t < 5.55) { const k = easeOut(seg(t, 4.3, 5.55)), p = arcPt([2150, 120], land, -140, k); return { x: p[0], y: p[1], flap: t * 3.2 * (1 - k * .5), flip: true }; }
    if (t < 6.85) { const k = t - 5.55, bob = spring(t, 5.55, 7, 20) * 6, peck = Math.max(0, Math.sin(seg(t, 6.05, 6.45) * Math.PI)) * 10;
      return { x: land[0], y: land[1] + bob + peck, flap: k < .3 ? .25 + k : .02, flip: true, legs: true }; }
    const k = easeIn(seg(t, 6.85, 7.4)), p = arcPt(land, [2200, 260], 160, k);
    return { x: p[0], y: p[1], flap: t * 3.6, flip: false };
  }
  function shot1(t, lt, dur) {
    const z = lerp(1, 1.045, ease(seg(t, 0, 7.4))), cx = lerp(960, 930, ease(seg(t, 0, 7.4)));
    openingFrame(t, { cam: [cx, 540, z], draw: seg(t, .35, 3.5), colour: ease(seg(t, 2.3, 5.4)), crow: s1Crow(t) });
  }

  // ---------- shared props for this chapter ----------
  // The dead gidgee from the opening frame, re-drawn at (x, y) (base of the trunk) and scale k. Returns a mapper
  // from opening-frame coordinates so perches can be placed on its limbs.
  function gidgee(x, y, k, key = 'gid', o = {}) {
    seed(key);
    const M = p => [x + (p[0] - 330) * k * (o.flip ? -1 : 1), y + (p[1] - 618) * k], wood = o.col || '#8C8276';
    for (const [P, ws] of _openGeo.tree) {
      const Q = P.map(M), wk = ws.map(w => w * k), sh = limb(Q, wk);
      pfill(sh, wood, { tone: .68, dens: .9, sw: 1.1 * Math.min(1.6, k), still: true });
      X.save(); tracePath(sh); X.clip(); pshade(limb(Q.map(p => [p[0] - LIGHT[0] * 4 * k, p[1] + 2 * k]), wk.map(w => w * .55)), AP.graphite, .85); X.restore();
      if (k > 1.2) for (let i = 0; i < Q.length - 1; i += 1) pline([lerp2(Q[i], Q[i + 1], .2), lerp2(Q[i], Q[i + 1], .7)].map(p => [p[0] + wk[i] * .15, p[1]]), .7, AP.graphite, { over: 0, passes: 1, alpha: .6 });
    }
    return M;
  }
  // A starving sheep that can stagger and fold down to die. (x, y) ground under the middle, s ≈ half the body height.
  //   o.walk (stride phase or null), o.fold 0..1 (front knees buckle by .5, hind by 1), o.head 0..1 (droops to the
  //   ground), o.eye 0..1 (closes), o.flip (faces left), o.shake (tremble px)
  function thinSheep(x, y, s, o = {}) {
    seed('thinSheep' + (o.key || ''));
    const d = o.flip ? -1 : 1, fold = o.fold || 0, f1 = easeIn(clamp(fold * 2)), f2 = easeIn(clamp(fold * 2 - 1)), walking = o.walk != null, ph = o.walk || 0;
    const legH = 1.3 * s, ry = .72 * s, bl = 1.12 * s, sh0 = o.shake ? [jit(o.shake), jit(o.shake * .5)] : [0, 0];
    const bob = walking ? .06 * s * Math.abs(Math.sin(ph * TAU * 2)) : 0;
    const hipX = x - d * bl * .78 + sh0[0], shX = x + d * bl * .78 + sh0[0];
    const hipY = y - legH * (1 - f2 * .74) - ry * .3 - bob + sh0[1], shY = y - legH * (1 - f1 * .74) - ry * .3 - bob * .6 + sh0[1];
    const midY = lerp(hipY, shY, .5), hd = clamp(o.head || 0);
    // shadow
    pshade(ellPts(x + LIGHT[0] * s * .8, y + .08 * s, bl * 1.35, .18 * s, 14), AP.graphite, 1.1);
    const leg = (top, foot, bend, far) => {
      const L = legH * .56, dx = foot[0] - top[0], dy = foot[1] - top[1], dist = Math.max(1, Math.hypot(dx, dy)), h = Math.sqrt(Math.max(0, L * L - dist * dist / 4)), m = lerp2(top, foot, .5);
      const knee = [m[0] - dy / dist * h * bend, Math.min(m[1] + dx / dist * h * bend, y - .06 * s)];
      pline([top, knee, foot], far ? 1.6 : 2.2, far ? '#5A4E46' : AP.graphite, { over: 0, taper: .3 });
      pfill(ellPts(knee[0], knee[1], .07 * s, .07 * s, 6), far ? '#5A4E46' : AP.graphite, { tone: .9, ink: null });
      pfill([[foot[0] - .06 * s, foot[1] - .12 * s], [foot[0] + d * .1 * s, foot[1] - .1 * s], [foot[0] + d * .12 * s, foot[1]], [foot[0] - .08 * s, foot[1]]], AP.coal, { tone: .9, ink: null });
    };
    const sw = k => walking ? Math.sin((ph + k) * TAU) * .32 * s : 0;
    const fFoot = (off, k) => [lerp(shX + d * off * s + sw(k), shX - d * .25 * s, f1), y - Math.max(0, walking ? Math.cos((ph + k) * TAU) : 0) * .1 * s];
    const hFoot = (off, k) => [lerp(hipX + d * off * s + sw(k), hipX + d * .5 * s, f2), y - Math.max(0, walking ? Math.cos((ph + k) * TAU) : 0) * .1 * s];
    leg([hipX + d * .05 * s, hipY + ry * .2], hFoot(-.15, .5), d, true); leg([shX - d * .1 * s, shY + ry * .3], fFoot(.12, 0), -d, true);
    // body: a woolly barrel gone thin and dirty, hip bones and shoulder blades pushing up, belly tucked
    const Hc = [hipX, hipY], Sc = [shX, shY];
    const BP = (u, v) => { const k = u / (bl * 1.56) + .5; return [lerp(Hc[0], Sc[0], k), lerp(Hc[1], Sc[1], k) + v]; };   // u along hip→shoulder, v down
    const body = [];
    for (let i = 0; i < 28; i++) {
      const a = i / 28 * TAU, top = Math.sin(a) < 0, uu = Math.cos(a) * bl * 1.12;
      let v = Math.sin(a) * ry * 1.05;
      if (top) { const hump = Math.exp(-Math.pow((uu + bl * .72) / (.28 * s), 2)) + .8 * Math.exp(-Math.pow((uu - bl * .7) / (.3 * s), 2)); v -= hump * .16 * s - .1 * s * (1 - Math.abs(Math.cos(a))); }
      else v *= 1 - .3 * Math.exp(-Math.pow(uu / (.6 * s), 2));                  // belly tucked up
      v *= 1 + .07 * Math.sin(i * 2.9 + 1.3);                                           // wool lumps
      body.push(BP(uu, v));
    }
    pfill(body, mixCol(AP.wool, AP.dust, .5), { tone: .62, dens: .8, sw: 1.3, curv: true, kind: 'x' });
    X.save(); tracePath(body, true, true); X.clip();
    pshade(body.map(p => [p[0] + LIGHT[0] * .3 * s, p[1] + .45 * s]), AP.earthDk, .85, { curv: true });
    for (let i = 0; i < 6; i++) { const u = lerp(-.1, .55, i / 5) * bl * 1.56, c = BP(u, 0);
      pline([[c[0] - d * .04 * s, c[1] - ry * .55], [c[0] + d * .1 * s, c[1] - ry * .05], [c[0] + d * .04 * s, c[1] + ry * .45]], 1.2, '#6A5646', { curv: true, over: 0, passes: 1 }); }
    for (let i = 0; i < 16; i++) { const c = BP((hash(i) - .5) * bl * 2, (hash(i + 5) - .6) * ry * 1.4); pline([[c[0], c[1]], [c[0] + d * 5 + jit(1), c[1] + 3]], .8, '#8A7458', { curv: true, over: 0, passes: 1, alpha: .7 }); }
    X.restore();
    const hipB = BP(-bl * .72, -ry * .95), shB2 = BP(bl * .7, -ry * .9);
    pfill(ellPts(hipB[0], hipB[1] + .06 * s, .17 * s, .1 * s, 8), AP.bone, { tone: .75, sw: .9 });     // hip bone through the fleece
    pline([hipB, BP(0, -ry * .8), shB2], 1.3, '#5A4838', { curv: true, over: 0, passes: 1 });     // spine
    const tl = BP(-bl * 1.1, -ry * .1); pline([tl, [tl[0] - d * .12 * s + jit(1), tl[1] + .5 * s]], 2, '#6A5646', { over: 0 });   // tail
    leg([hipX + d * .15 * s, hipY + ry * .25], hFoot(.15, 0), d, false); leg([shX + d * .05 * s, shY + ry * .35], fFoot(-.1, .5), -d, false);
    // neck and head: drooping low
    const nk = [shX + d * .35 * s, shY - ry * .45];
    const hUp = [shX + d * .95 * s, shY - ry * .9], hDown = [shX + d * .9 * s, shY + ry * 1.05], hGround = [shX + d * 1.05 * s, y - .28 * s];
    const hc = f1 > .5 ? lerp2(lerp2(hUp, hDown, hd), hGround, clamp((f1 - .5) * 2) * hd) : lerp2(hUp, hDown, hd), ha = lerp(lerp(-.2, 1.1, hd), .45, clamp((f1 - .5) * 2) * hd) * d;
    pfill(limb([nk, lerp2(nk, hc, .55), hc], [.55 * s, .42 * s, .32 * s]), mixCol(AP.wool, AP.dust, .6), { tone: .6, sw: 1.1 });
    const R = (u, v) => add2(hc, rot2([u * s * d, v * s], ha));
    pfill([R(-.25, -.2), R(.25, -.24), R(.55, .02), R(.58, .18), R(.3, .25), R(-.2, .2)], '#3C3430', { tone: .85, dens: 1, sw: 1.1, curv: true });
    pfill([R(-.18, -.12), R(-.42, .05), R(-.5, .32), R(-.3, .12)], '#3C3430', { tone: .85, sw: .9 });       // ear, hanging
    const eo = clamp(o.eye ?? 0), e = R(.12, -.06);
    if (eo > .6) pline([[e[0] - .05 * s, e[1]], [e[0] + .05 * s, e[1] + .01 * s]], 1, AP.bone, { over: 0 }); else pfill(ellPts(e[0], e[1], .045 * s, .04 * s * (1 - eo), 6), AP.bone, { tone: .9, ink: null });
  }

  // ---------------- shot 2 · 7.40–12.22 · the stock dying: a thin ewe staggers and folds; crows wait in a dead gidgee ----------------
  function shot2(t, lt, dur) {
    LIGHT = [.7, .7];
    const z = lerp(1, 1.1, ease(seg(t, 7.4, 12.2))), cx = lerp(930, 860, ease(seg(t, 7.4, 12.2))), cy = lerp(520, 545, ease(seg(t, 7.4, 12.2)));
    camOn(cx, cy, z);
    const HZ = 470;
    skyBand('#DB8E4A', '#F1D8A8', -600, HZ + 30, { key: 's2sky', tone: .75, g0: -40 });
    pglow(-200, -100, 900, '#FFF4DC', .45);
    seed('s2far'); ptone([[-400, HZ - 12], [700, HZ - 26], [1500, HZ - 10], [2400, HZ - 18], [2400, HZ + 10], [-400, HZ + 10]], '#C99A6A', .4);
    ptone(rectPts(-400, HZ - 50, 2800, 60), '#FFF1D6', .3);
    seed('s2plain'); const gnd = [[-400, HZ], [2400, HZ], [2400, 1200], [-400, 1200]];
    const g = X.createLinearGradient(0, HZ, 0, 900); g.addColorStop(0, '#E0C595'); g.addColorStop(1, '#B98A56');
    X.save(); X.globalAlpha = .8; X.fillStyle = g; tracePath(gnd); X.fill(); X.restore(); pshade(gnd, AP.dust, .55, { still: true });
    pline([[-400, HZ], [2400, HZ]], .9, AP.graphiteLt, { over: 0, passes: 1 });
    // the ones already down: a far carcass, one closer with the crows' work done
    seed('s2dead'); sheep(1080, 520, 11, { down: true, key: 's2d1', flip: true }); sheep(380, 600, 24, { down: true, key: 's2d2' });
    pshade(ellPts(420, 606, 70, 7, 10), AP.graphite, .8);
    _mudPlates(-400, 2400, 620, 1000, 's2', { hz: HZ, vx: 800, col: '#C39664', dark: '#4A2E1E', du: .6, dd: .26 });
    // the dead gidgee, crows waiting
    const M = gidgee(1480, 850, 2.05, 's2tree');
    pshade(ellPts(1560, 856, 320, 20, 14), AP.graphite, 1);
    const perch = [M([395, 460]), M([452, 450]), M([492, 422]), M([270, 396])];
    const fall = seg(t, 11.15, 11.3), hop = spring(t, 11.2, 6, 16);
    [[perch[1], 0, 26], [perch[2], .3, 24], [perch[3], .6, 25]].forEach(([p, ph], i) => {
      const cock = Math.sin(t * 2 + ph * 9) > .7 ? 1 : 0;
      crow(p[0] + (i === 0 ? hop * 4 : 0), p[1] - 15 - (i === 0 ? Math.abs(hop) * 10 : 0) + cock * 2, 33, i === 0 && t > 11.2 && t < 11.5 ? .3 : .02, { flip: true, key: 's2c' + i });
      for (const dx of [-6, 6]) pline([[p[0] + dx, p[1] - 6], [p[0] + dx + 2, p[1] + 3]], 1.3, AP.graphite, { over: 0, passes: 1 });
    });
    // the crow from the skull flies in and takes its place on the branch
    if (t < 8.55) { const k = easeOut(seg(t, 7.4, 8.55)), p = arcPt([cx - 1100, 180], [perch[0][0], perch[0][1] - 15], -120, k); crow(p[0], p[1], 33, t * 3.4 * (1 - k * .6), { key: 's2in' }); }
    else { const p = perch[0], b = spring(t, 8.55, 7, 20) * 5; crow(p[0], p[1] - 15 + b, 33, t < 8.8 ? .25 : .02, { flip: true, key: 's2in' }); for (const dx of [-5, 5]) pline([[p[0] + dx, p[1] - 6], [p[0] + dx + 2, p[1] + 2]], 1.2, AP.graphite, { over: 0, passes: 1 }); }
    // the ewe: staggers in, stops, trembles, the front knees go, then the rest of her, then the head
    const wk = easeOut(seg(t, 7.4, 9.9)), sx = lerp(300, 820, wk) + Math.sin(t * 2.3) * 10 * (1 - seg(t, 9.6, 10)), sy = 820 + Math.sin(t * 1.7) * 6 * (1 - seg(t, 9.6, 10));
    const fold = kf(t, [[10.1, 0], [10.5, .5], [10.78, .5], [11.2, 1]], ease), head = kf(t, [[7.4, .35], [9.6, .45], [10.0, .6], [11.25, .7], [11.9, 1]]);
    thinSheep(sx, sy, 88, { walk: t < 9.9 ? (sx - 300) / 190 : null, fold, head, eye: seg(t, 11.95, 12.1), shake: t > 9.75 && t < 10.15 ? 2.5 : t > 10.5 && t < 10.8 ? 1.5 : 0, key: 'ewe' });
    for (const [t0, px2] of [[10.5, sx + 70], [11.2, sx]]) { const k = seg(t, t0, t0 + .9); if (k > 0 && k < 1) for (let i = 0; i < 5; i++) psmoke(px2 + (hash(i) - .5) * 160 * (k + .3), sy - 10 - k * 40 * hash(i + 3), 20 + 40 * k, AP.dust, .55 * (1 - k)); }
    camOff();
    _chA.shimmer(t, 380, 560, 3);
    if (lt > dur - .3) pageTurn((lt - (dur - .3)) / .6, 1);
  }

  // ---------------- shot 3 · 12.22–16.46 · the squatter prays at the empty sky; disgust; he jams his hat on and strides off ----------------
  const SQ_BARE = { ...CAST.squatter, hat: 'none' };
  function shot3(t, lt, dur) {
    LIGHT = [-.6, .8];
    const s = 70, gy = 850, sqx0 = 770;
    // the whip at the end: camera slews right as he strides out of frame
    const whip = easeIn(seg(lt, dur - .28, dur)), cxw = lerp(0, 1500, whip);
    const cx = kf(t, [[12.22, 900], [14.9, 920], [16.1, 1150]]) + cxw, cy = kf(t, [[12.22, 420], [14.9, 430], [16.1, 500]]), z = kf(t, [[12.22, 1.45], [14.9, 1.32], [16.1, 1.0]]);
    camOn(cx, cy, z);
    skyBand('#D98A45', '#F2DAAA', -700, gy - 250, { key: 's3sky', tone: .75, g0: -200 });
    sun(1780, 90, 56, 1); pglow(1780, 90, 380, '#FFF6E0', .4);
    // the hope: a wisp of cloud gathers over the plain and burns off
    const wisp = Math.sin(clamp(seg(t, 12.45, 13.95)) * Math.PI) * (1 - seg(t, 13.5, 13.95) * .3);
    if (wisp > .02) { seed('s3wisp'); for (let i = 0; i < 6; i++) psmoke(1330 + i * 42 + Math.sin(t + i) * 6, 190 + Math.sin(i * 1.7) * 10, (40 + 18 * hash(i)) * (.6 + wisp * .5), '#FFF8EC', .55 * wisp); }
    seed('s3plain'); const HZ = gy - 250;
    ptone([[-400, HZ - 10], [800, HZ - 22], [2600, HZ - 12], [2600, HZ + 10], [-400, HZ + 10]], '#C99A6A', .4);
    const gnd = [[-400, HZ], [2600, HZ], [2600, 1300], [-400, 1300]];
    pfill(gnd, '#CFAE7C', { tone: .7, dens: .8, ink: null, still: true });
    pshade([[-400, gy - 40], [2600, gy - 40], [2600, 1300], [-400, 1300]], AP.earth, .5, { still: true, kind: 'x' });
    pline([[-400, HZ], [2600, HZ]], .9, AP.graphiteLt, { over: 0, passes: 1 });
    for (let i = 0; i < 5; i++) { const fx = 1250 + i * 260; pline([[fx, HZ + 20 + i * 4], [fx + 3, HZ - 30 + i * 4]], 1.4, AP.timberDk, { over: 0 }); if (i < 4) pline([[fx, HZ - 20 + i * 4], [fx + 260, HZ - 16 + i * 4]], .7, AP.graphiteLt, { over: 0, passes: 1 }); }
    // the homestead
    const HS = homestead(-520, gy, s, { w: 20, key: 's3', tank: false }), fl = HS.floor;
    // the squatter
    let P, look = SQ_BARE, x = sqx0, hatAt = null;
    const pray = { view: 'side', lean: -.08, head: -.6, shF: .6, elF: 1.8, shB: .5, elB: 1.9, face: 'worry', mouth: 0, hpF: .08, hpB: -.06 };
    if (t < 14.05) {
      P = { ...pray, lean: kf(t, [[12.22, -.08], [13.2, .02], [13.7, .04]]), head: kf(t, [[12.22, -.55], [13.2, -.68], [13.8, -.62]]), mouth: t < 13.2 ? .08 + .1 * Math.abs(Math.sin(t * 9)) : 0 };
      P.blink = t > 12.9 && t < 13.0 ? 1 : 0;
      if (t > 13.9) P.blink = seg(t, 13.9, 13.98);
    } else if (t < 14.62) {
      // the wisp is gone: blink, the head comes down, disgust
      const k = seg(t, 14.05, 14.45);
      P = kp(t, [[14.05, { ...pray, blink: 1, head: -.6 }], [14.3, { ...pray, head: .05, lean: -.12, shF: .45, elF: .9, shB: .3, elB: .6, face: 'wince', blink: 0 }], [14.62, { ...pray, head: .12, lean: -.1, shF: .35, elF: .7, shB: .15, elB: .45, face: 'grit', mouth: .1 }]]);
      if (k < .5) P.face = 'closed';
    } else if (t < 15.0) {
      // resolve: the hat goes up and is jammed down on his head
      P = kp(t, [[14.62, { head: .12, lean: -.1, shB: .4, elB: .7, shF: .15, elF: .45, face: 'grit' }], [14.85, { head: .05, lean: -.04, shB: 2.95, elB: .9, shF: .1, elF: .4, face: 'grit' }], [15.0, { head: .3, lean: .06, shB: 2.7, elB: 1.2, shF: .1, elF: .4, face: 'grit', squash: .12 }]]);
    } else {
      look = CAST.squatter;
      const wk = seg(t, 15.12, 16.46), dist = easeIn(clamp(wk * 1.2)) * 520 + wk * 480;
      x = sqx0 + dist;
      const W0 = walkPose(dist / (s * 3.4), clamp(seg(t, 15.1, 15.35)), { lean: .1 });
      P = kp(t, [[15.0, { head: .3, lean: .06, shB: 2.7, elB: 1.2, shF: .1, elF: .4, face: 'grit', squash: .12 }], [15.25, { ...W0, head: .1, face: 'grit' }]]);
      if (t >= 15.25) P = { ...W0, head: .1, face: 'grit', lean: .22 };
    }
    P.view = 'side';
    seed('squatter');
    const hold = J => {
      if (t < 14.62) { const c = lerp2(J.handF, J.handB, .5); hatProp([c[0] + 6, c[1] - .2 * s], s * .85, t < 14.05 ? -.25 : lerp(-.25, .5, seg(t, 14.05, 14.4))); }
      else if (t < 15.0) { const k = ease(seg(t, 14.84, 14.98)), top = add2(J.head, [.05 * s, -.62 * s]), c = lerp2(add2(J.handB, [0, -.2 * s]), top, k); hatProp(c, s * .85, lerp(.5, .15, k)); }
    };
    const yAt = xx => lerp(fl, gy, ease(seg(xx, 890, 960)));
    man(x, yAt(x), s, P, look, { hold });
    // his dust as he strides off
    seed('s3dust');
    if (t > 15.2) for (let i = 0; i < 6; i++) { const t0 = 15.25 + i * .19, k = seg(t, t0, t0 + .7); if (k > 0 && k < 1) psmoke(sqx0 + (easeIn(clamp(seg(t0, 15.12, 16.46) * 1.2)) * 520 + seg(t0, 15.12, 16.46) * 480) - 40, gy - 8 - k * 30, 16 + 30 * k, AP.dust, .5 * (1 - k)); }
    camOff();
    _chA.shimmer(t, 200, 400, 2.2);
    if (lt < .3) pageTurn(.5 + lt / .6, 1);
    speedLines(whip, [1, 0], AP.graphite, 's3whip');
  }

  // ---------------- shot 4 · 16.46–21.78 · tilt up the derrick against the white sky, then down its legs into the earth ----------------
  function shot4(t, lt, dur) {
    LIGHT = [-.45, .9];
    const GY = 900, arrive = 1 - easeOut(seg(lt, 0, .45));
    const cy = kf(t, [[16.46, 640], [16.9, 640], [18.75, -330], [19.45, -345], [21.25, 1150], [21.78, 1165]], ease);
    const z = kf(t, [[16.46, .92], [18.75, .86], [19.45, .88], [21.78, .9]]), cx = 960 - arrive * 900 + Math.sin(t * .7) * 8;
    camOn(cx, cy, z);
    skyBand('#D4843F', '#F2DDB0', -1500, GY, { key: 's4sky', tone: .78, g0: -900 });
    const sunP = [1210, -560]; pglow(sunP[0], sunP[1], 640, '#FFF4DC', .6); sun(sunP[0], sunP[1], 70, 1); pglow(sunP[0], sunP[1], 220, '#FFFFFF', .5);
    // two crows circling high over the rig
    for (let i = 0; i < 2; i++) { const a = t * .7 + i * 2.6, p = [960 + Math.cos(a) * 380, -820 + Math.sin(a) * 90 + i * 60]; crow(p[0], p[1], 16, t * 1.3 + i, { flip: Math.sin(a) > 0, key: 's4c' + i }); }
    // the far plain, low on the horizon
    seed('s4far'); const HZ = GY - 40;
    ptone([[-1400, HZ - 8], [300, HZ - 20], [1500, HZ - 6], [3400, HZ - 14], [3400, GY], [-1400, GY]], '#C99A6A', .5);
    pfill([[-1400, HZ], [3400, HZ], [3400, GY + 4], [-1400, GY + 4]], '#D2B282', { tone: .7, dens: .8, ink: null, still: true });
    pline([[-1400, HZ], [3400, HZ]], .9, AP.graphiteLt, { over: 0, passes: 1 });
    // the earth below the rig: the strata in section, with the starter hole
    X.save(); X.translate(0, GY); section(960, 0, 700, { halfW: 2400 }); X.restore();
    pline([[-1400, GY], [3400, GY]], 2, AP.graphite, { over: 0 });
    X.save(); X.translate(0, GY); shaft(960, 50, { w: 30 }); X.restore();
    // the derrick, the cable from the crown to the floor
    const D = derrick(960, GY, 1500, { key: 's4' });
    seed('s4cable'); pline([D.crown, [960, GY - 150]], 1.6, AP.iron, { over: 0 });
    pfill(rectPts(945, GY - 150, 30, 40), AP.iron, { tone: .9, sw: 1 });
    pfill(rectPts(940, GY - 70, 40, 70), AP.iron, { tone: .85, sw: 1.2 });   // the casing head
    // a hand up at the crown, working the sheave, a silhouette against the sun
    seed('s4top');
    const topP = kp(t, [[16.46, { view: 'side', flip: true, lean: .2, shF: 2.2, elF: .8, shB: 1.4, elB: 1 }], [18.9, { view: 'side', flip: true, lean: .1, shF: 2.4, elF: .5, shB: 1.2, elB: 1.2 }], [19.3, { view: 'side', flip: true, lean: -.05, shF: 2.9, elF: .1, shB: .2, elB: .3, head: -.3, face: 'shout', mouth: .5 }]]);
    topP.shF += Math.sin(t * 9) * .15 * (t < 19 ? 1 : 0);
    pfill(rectPts(900, -540, 130, 14), AP.timberDk, { tone: .8, sw: 1 });
    man(1000, -540, 26, topP, CAST.hand2);
    // down at the floor: the driller watching the crown, a hand with a pine rod on his shoulder, the squatter arriving
    seed('s4driller');
    man(1120, GY - 6, 50, { view: 'front', shF: -.35, elF: -1.9, shB: -.35, elB: -1.9, head: -.2, face: 'neutral', blink: frac(t / 3.1) < .04 ? 1 : 0 }, CAST.driller);
    const sx = lerp(-200, 560, seg(t, 16.46, 18.8)); seed('s4sq');
    man(sx, GY - 4, 46, { ...walkPose((sx + 200) / 160, 1 - seg(t, 18.4, 18.8), { lean: .15 }), face: 'grit', head: .05 }, CAST.squatter);
    camOff();
    // iris of hatching closes on the bore hole
    if (lt > dur - .45) { const [hx2, hy2] = [W / 2 + (960 - cx) * z, H / 2 + (GY - 20 - cy) * z]; const k = seg(lt, dur - .45, dur); hatchIris(hx2, hy2, lerp(1200, 0, easeIn(k)), clamp(k * 3)); }
    speedLines(arrive, [1, 0], AP.graphite, 's4whip');
  }

  // ---------------- the rig: one set for shots 5–7 ----------------
  const RG = { G: 840, dx: 620, dh: 900, bx: 1190, post: 520, armL: 570, armR: 330, ex: 1760, es: 30, lever: [900, 840] };
  // Walking beam on a full-height samson post (above the crew's heads). ph 0..1 per stroke: the well end rises slowly
  // (easeOut) and drops fast (easeIn), landing the blow at ph = 1.
  function walkingBeam(x, G, ph) {
    seed('wbeam');
    const lift = ph < .7 ? easeOut(ph / .7) : 1 - easeIn((ph - .7) / .3), ang = lerp(-.1, .12, lift);
    const pv = [x, G - RG.post], wellEnd = polar(pv, Math.PI - ang, RG.armL), crankEnd = polar(pv, -ang, RG.armR);
    pfill([[x - 38, G], [x - 16, pv[1] + 10], [x + 16, pv[1] + 10], [x + 38, G]], AP.timberDk, { tone: .75, dens: .9, sw: 1.2 });
    pshade([[x + 2, G], [x + 4, pv[1] + 10], [x + 16, pv[1] + 10], [x + 38, G]], AP.graphite, .6);
    pfill(limb([[x + 150, G], [x + 10, pv[1] + 140]], [18, 14]), AP.timberDk, { tone: .7, sw: 1 });            // brace
    pfill(rectPts(x - 60, G - 16, 120, 18), AP.timberDk, { tone: .8, sw: 1 });                                  // sill
    const bm = limb([wellEnd, lerp2(wellEnd, pv, .5), pv, crankEnd], [34, 44, 54, 38]);
    pfill(bm, AP.timber, { tone: .72, dens: .9, sw: 1.3 });
    X.save(); tracePath(bm); X.clip(); pshade(limb([wellEnd, pv, crankEnd].map(p => [p[0], p[1] + 14]), [18, 26, 20]), AP.graphite, .55); X.restore();
    pline([lerp2(wellEnd, pv, .05), lerp2(wellEnd, pv, .7)].map(p => [p[0], p[1] - 8]), 1, AP.paperLt, { over: 0, passes: 1, alpha: .6 });
    for (const k of [.04, .1]) { const c = lerp2(wellEnd, pv, k); pfill(rectPts(c[0] - 6, c[1] - 22, 12, 44), AP.iron, { tone: .9, sw: .8 }); }   // iron straps
    pfill(ellPts(pv[0], pv[1], 14, 14, 10), AP.iron, { tone: .9, sw: .9 });
    return { wellEnd, crankEnd, pivot: pv, lift };
  }
  // Beam phase for a blow landing on every odd beat from t0 on (the first stroke starts at `start`).
  function beamPh(t, start = 26.62, first = 27.476) {
    if (t < start) return 0;
    if (t < first) return seg(t, start, first);
    return frac((bpOf(t) - 1) / 2);
  }
  // o: ph (beam), eng (flywheel phase), fire, smoke, shake, lever (0 back → 1 thrown) or leverHand [x, y], clamp (drive
  // clamp on the casing), dust (0..1 impact dust at the casing)
  function rigScene(t, o = {}) {
    const { G, dx, dh, ex, es } = RG;
    skyBand('#D98C4A', '#F1D8A8', -900, G - 250, { key: 'rigSky', tone: .76, g0: -300 });
    pglow(1500, -150, 700, '#FFF4DC', .4);
    seed('rigFar'); const HZ = G - 250;
    ptone([[-900, HZ - 12], [500, HZ - 24], [1400, HZ - 8], [2900, HZ - 16], [2900, HZ + 10], [-900, HZ + 10]], '#C99A6A', .45);
    const gnd = [[-900, HZ], [2900, HZ], [2900, 1400], [-900, 1400]];
    pfill(gnd, '#D0B080', { tone: .7, dens: .8, ink: null, still: true });
    pshade([[-900, G - 60], [2900, G - 60], [2900, 1400], [-900, 1400]], AP.earth, .5, { still: true, kind: 'x' });
    pline([[-900, HZ], [2900, HZ]], .9, AP.graphiteLt, { over: 0, passes: 1 });
    if (o.plunge) { X.save(); X.translate(0, G + 30); section(dx, 0, 900, { halfW: 2400 }); X.restore(); pline([[-900, G + 30], [2900, G + 30]], 2, AP.graphite, { over: 0 }); }
    windmill(1850, HZ + 18, 9, .35); tree(120, HZ + 20, 16, { dead: true, key: 'rigFarTree' });
    // cast shadows (sun high, a little right): the derrick's lattice falls left
    seed('rigShadow'); pshade([[dx - 300, G + 6], [dx + 300, G + 6], [dx - 200, G + 40], [dx - 700, G + 40]], AP.graphite, .7);
    pshade([[RG.bx - 60, G + 4], [RG.bx + 60, G + 4], [RG.bx - 40, G + 30], [RG.bx - 200, G + 30]], AP.graphite, .7);
    const D = derrick(dx, G, dh, { key: 'rig' });
    const B = walkingBeam(RG.bx, G, o.ph || 0);
    const E = engine(ex, G, es, { ph: o.eng || 0, fire: o.fire ?? .6, smoke: o.smoke ?? .6, shake: o.shake || 0, gauge: o.gauge ?? .45 });
    // pitman: beam crank end to the flywheel pin
    seed('rigPitman'); const pin = polar(E.fly, (o.eng || 0) * TAU, 2.3 * es * .75);
    pfill(limb([B.crankEnd, pin], [14, 12]), AP.timber, { tone: .75, sw: 1 }); pfill(ellPts(pin[0], pin[1], 7, 7, 8), AP.iron, { tone: .9, sw: .8 });
    // the cable from the beam's well end down to the casing; the casing head and drive clamp
    seed('rigCable');
    const top = [dx, G - 64], clampY = o.clampY ?? G - 96;
    pline([B.wellEnd, [dx, clampY - 30]], 2.2, AP.iron, { over: 0 });
    pfill(rectPts(dx - 12, clampY - 30, 24, 26), AP.brass, { tone: .8, sw: 1 });           // temper screw
    pfill(rectPts(dx - 22, G - 70, 44, 72), AP.iron, { tone: .85, dens: 1, sw: 1.3 });     // casing head
    plit(rectPts(dx - 16, G - 66, 8, 60), .5);
    if (o.clamp !== false) { pfill(rectPts(dx - 40, clampY - 4, 80, G - 70 - clampY + 6), AP.ironLt, { tone: .85, dens: 1, sw: 1.3 }); pline([[dx - 40, clampY + 4], [dx + 40, clampY + 4]], 1, AP.graphite, { over: 0, passes: 1 }); }
    // the brake lever by the samson post
    seed('rigLever'); const piv = RG.lever;
    const hand = o.leverHand || polar(piv, lerp(-1.95, -1.2, o.lever || 0), 300);
    const ang = Math.atan2(hand[1] - piv[1], hand[0] - piv[0]), tip = polar(piv, ang, Math.hypot(hand[0] - piv[0], hand[1] - piv[1]) + 30);
    pfill(limb([piv, tip], [18, 12]), AP.timberDk, { tone: .8, sw: 1.1 });
    pfill(rectPts(piv[0] - 26, G - 22, 52, 24), AP.iron, { tone: .9, sw: 1 });
    // pine rods waiting on trestles, left foreground
    seed('rigRods');
    for (let i = 0; i < (o.rods ?? 9); i++) pfill(limb([[-260 + i * 3, G - 60 - i * 9], [300 + i * 3, G - 64 - i * 9]], [9, 9]), AP.pine, { tone: .75, sw: .8 });
    for (const x of [-200, 240]) pfill([[x - 30, G - 20], [x - 6, G - 64], [x + 6, G - 64], [x + 30, G - 20]], AP.timberDk, { tone: .7, sw: 1 });
    // impact dust at the casing
    if (o.dust > 0) { seed('rigDust'); const k = 1 - o.dust; for (let i = 0; i < 8; i++) psmoke(dx + (hash(i) - .5) * 260 * (k + .25), G - 12 - k * 70 * hash(i + 3), 20 + 60 * k, AP.dust, .7 * o.dust);
      for (let i = 0; i < 10; i++) { const a = -Math.PI * (hash(i * 3) * .8 + .1), r = 40 + 140 * k; pline([[dx + Math.cos(a) * r * .5, G - 20 + Math.sin(a) * r * .5], [dx + Math.cos(a) * r, G - 20 + Math.sin(a) * r]], 1.2, AP.earthDk, { over: 0, passes: 1, alpha: o.dust }); } }
    return { D, B, E, top, clampY };
  }
  const PH = { // poses for the rig shots
    grip:   { view: 'side', lean: -.05, shF: 1.55, elF: .55, shB: 1.35, elB: .7, hpF: .35, knF: .3, hpB: -.3, knB: .2, head: .05, face: 'grit' },
    throw_: { view: 'side', lean: .55, shF: 1.35, elF: .15, shB: 1.25, elB: .2, hpF: .8, knF: 1.0, hpB: -.5, knB: .1, head: -.1, face: 'shout', mouth: .5 },
  };

  // pocket watch in the boss's hand
  function watch(p, s, t) {
    seed('watch');
    pfill(ellPts(p[0], p[1], .32 * s, .32 * s, 14), AP.brass, { tone: .9, sw: 1 });
    pfill(ellPts(p[0], p[1], .24 * s, .24 * s, 14), AP.bone, { tone: .9, sw: .7 });
    const a = -Math.PI / 2 + beatN(t) * TAU / 60 * 4;   // the second hand ticks on the beat
    pline([p, polar(p, a, .21 * s)], 1.1, AP.red, { over: 0, passes: 1 }); pline([p, polar(p, -2.1, .15 * s)], 1.3, AP.graphite, { over: 0, passes: 1 });
  }
  // the bull rope from the crown down through the hands' grip to a coil on the ground
  function bullRope(crown, hands, G) {
    seed('bullrope');
    const P = [crown, ...hands, [hands[hands.length - 1][0] - 60, hands[hands.length - 1][1] + 120], [hands[hands.length - 1][0] - 90, G]];
    pline(P, 2.2, '#8A6A44', { over: 0, curv: true });
    pline(ellPts(P[P.length - 1][0] - 30, G - 6, 40, 9, 14), 2, '#8A6A44', { closed: true, passes: 1 });
  }

  // ---------------- shot 5 · 21.78–26.30 · waiting at the lever: the driller's hand, the boss's watch, the crew poised ----------------
  function shot5(t, lt, dur) {
    LIGHT = [-.5, .85];
    const G = RG.G, s = 58, bt = pulse(t, 5), dx0 = 800;
    const dP = { ...PH.grip, elF: PH.grip.elF - .06 * bt, elB: PH.grip.elB - .05 * bt, look: .6, blink: frac((t - 22.5) / 2.3) < .05 ? 1 : 0 };
    seed('driller'); const Jg = ghost(() => man(dx0, G, s, dP, CAST.driller));
    const hand = Jg.handF;
    const cam = kf(t, [[21.78, [hand[0] - 40, hand[1] - 70, 2.6]], [23.15, [hand[0] - 40, hand[1] - 80, 2.45]], [23.75, [1320, 440, 2.0]], [24.55, [1310, 435, 1.9]], [25.25, [940, 470, 1.0]], [26.3, [930, 470, 1.04]]], ease);
    camOn(cam[0], cam[1], cam[2]);
    const R = rigScene(t, { ph: 0, eng: .12, fire: .45 + .35 * bt, smoke: .25, leverHand: hand, gauge: .55 + .05 * bt });
    // the hands on the bull rope, poised
    const hP = i => ({ view: 'side', lean: -.12 - .04 * pulse(t + i * .1, 5), shF: 1.35, elF: .35, shB: 1.5, elB: .25, hpF: .35, knF: .25, hpB: -.3, knB: .2, head: -.05, face: 'grit', look: .5 });
    seed('hand1'); const H1 = man(150, G, 52, hP(0), CAST.hand1);
    seed('hand2'); const H2 = man(290, G, 50, hP(1), CAST.hand2);
    bullRope(R.D.crown, [H2.handB, H2.handF, H1.handB, H1.handF], G);
    // Bill at the firebox with a gidgee log, waiting
    seed('bill');
    man(1560, G, 55, { view: 'side', flip: true, lean: -.05, shF: .9, elF: 1.3, shB: .8, elB: 1.4, face: 'grit', head: -.05 + .03 * bt, look: .4 }, CAST.bill, { hold: J => { seed('billLog'); const c = lerp2(J.handF, J.handB, .5); pfill(limb([add2(c, [-80, 14]), add2(c, [80, -14])], [22, 20]), '#7A5A3E', { tone: .8, sw: 1 }); } });
    // the boss: watch in one hand, the other arm up, ready to drop
    const up = seg(t, 25.75, 26.1), look = seg(t, 24.9, 25.2);
    const bP = { view: 'front', shB: 2.55 + .3 * up, elB: -.15 - .1 * up, shF: .25, elF: -1.9, head: lerp(.4, 0, look), look: lerp(.3, -.9, look), face: look > .5 ? 'grit' : 'neutral', dy: .08 * up, blink: t > 24.95 && t < 25.05 ? 1 : 0 };
    seed('boss'); man(1330, G, 60, bP, CAST.boss, { front: J => watch(add2(J.handF, [-6, -4]), 60, t) });
    // the driller at the lever, drawn last (nearest)
    seed('driller'); man(dx0, G, s, dP, CAST.driller);
    camOff();
    if (lt < .45) { const k = seg(lt, 0, .45), [sx, sy] = [W / 2 + (hand[0] - cam[0]) * cam[2], H / 2 + (hand[1] - cam[1]) * cam[2]]; hatchIris(sx, sy, lerp(0, 1300, easeOut(k)), clamp((1 - k) * 3)); }
  }

  // ---------------- shot 6 · 26.30–29.54 · let her go: the arm drops, the lever's thrown, the beam drops, first blow ----------------
  const BLOWS = [27.476, 28.544, 29.612, 30.681, 31.749, 32.817, 33.885, 34.953, 36.021];
  const lastBlow = t => { let b = -9; for (const x of BLOWS) if (t >= x) b = x; return b; };
  function shot6(t, lt, dur) {
    LIGHT = [-.5, .85];
    const G = RG.G, s = 58, dx0 = 800, lb = lastBlow(t), sinceBlow = t - lb, dust = 1 - seg(sinceBlow, 0, 1);
    const shake = shakeXY(t, 14 * Math.exp(-sinceBlow * 9) * (lb > 0 ? 1 : 0));
    const z = kf(t, [[26.3, 1.75], [26.48, 1.6], [27.2, 1.0], [28.6, 1.06], [29.54, 1.3]], ease), cx = kf(t, [[26.3, 1230], [26.48, 1150], [27.2, 950], [29.54, 760]], ease), cy = kf(t, [[26.3, 420], [26.48, 430], [27.2, 460], [29.54, 540]], ease);
    camOn(cx + shake[0], cy + shake[1], z);
    const ph = beamPh(t), eng = ph, lurch = seg(t, 26.6, 26.75) * (1 - seg(t, 26.9, 27.3));
    // the driller throws the lever
    const dP = kp(t, [[26.36, { ...PH.grip, look: .6 }], [26.48, { ...PH.grip, lean: -.2, elF: .75, face: 'grit' }], [26.62, { ...PH.throw_ }], [27.3, { ...PH.throw_ }], [27.65, { ...PH.throw_, lean: .3, face: 'smile', mouth: 0, head: -.2 }]], easeIn);
    seed('driller'); const Jg = ghost(() => man(dx0, G, s, dP, CAST.driller));
    const R = rigScene(t, { ph, eng, fire: .7 + .3 * pulse(t, 4), smoke: .4 + lurch * 1.5, shake: lurch * 1.2 + .15, leverHand: Jg.handF, gauge: .6 + .1 * pulse(t, 4), dust: lb > 0 ? dust : 0 });
    if (lurch > 0) { seed('lurch'); for (let i = 0; i < 4; i++) psmoke(RG.ex + 5 * RG.es + (hash(i) - .5) * 60, G - 4.2 * RG.es - 7 * RG.es - i * 50 * lurch, 50 + 40 * i * lurch, AP.smoke, .6 * lurch); }
    // the crew: flinch at the first blow, then a whoop
    const cheer = seg(t, 27.62, 27.9) * (1 - seg(t, 28.9, 29.3)), fl = Math.exp(-Math.max(0, t - 27.476) * 6) * (t > 27.476 ? 1 : 0);
    const hP = (i, fist) => kp(t, [[26.3, { view: 'side', lean: -.15, shF: 1.35, elF: .35, shB: 1.5, elB: .25, hpF: .35, knF: .25, hpB: -.3, knB: .2, face: 'grit', look: .5 }],
      [26.9, { view: 'side', lean: -.3, shF: 1.25, elF: .3, shB: 1.4, elB: .2, hpF: .45, knF: .2, hpB: -.35, knB: .25, face: 'grit' }],
      [27.7, fist ? { view: 'side', lean: -.2, shF: 1.25, elF: .3, shB: 2.9, elB: .3, hpF: .45, knF: .2, hpB: -.35, knB: .25, face: 'shout', mouth: .6, head: -.3 } : { view: 'side', lean: -.3, shF: 1.25, elF: .3, shB: 1.4, elB: .2, hpF: .45, knF: .2, hpB: -.35, knB: .25, face: 'laugh', head: -.2 }],
      [29.2, { view: 'side', lean: -.3, shF: 1.25, elF: .3, shB: 1.4, elB: .2, hpF: .45, knF: .2, hpB: -.35, knB: .25, face: 'grit' }]]);
    seed('hand1'); const H1 = man(150, G, 52, { ...hP(0, true), dy: fl * .15 }, CAST.hand1);
    seed('hand2'); const H2 = man(290, G, 50, { ...hP(1, false), dy: fl * .12 }, CAST.hand2);
    bullRope(R.D.crown, [H2.handB, H2.handF, H1.handB, H1.handF], G);
    seed('bill');
    const billP = kp(t, [[26.3, { view: 'side', flip: true, lean: -.05, shF: .9, elF: 1.3, shB: .8, elB: 1.4, face: 'grit' }], [26.6, { view: 'side', flip: false, lean: .3, shF: 1.6, elF: .3, shB: 1.4, elB: .4, hpF: .4, knF: .3, face: 'grit' }], [26.85, { view: 'side', flip: false, lean: .4, shF: 1.9, elF: .1, shB: 1.7, elB: .2, hpF: .5, knF: .4, face: 'shout', mouth: .4 }], [27.4, { view: 'side', flip: false, lean: .1, shF: .6, elF: .4, shB: .4, elB: .3, face: 'grit' }], [27.8, { view: 'side', flip: true, lean: -.1, shF: 2.8, elF: .4, shB: .3, elB: .3, face: 'shout', mouth: .5, head: -.3 }], [29.0, { view: 'side', flip: true, lean: 0, shF: .3, elF: .3, shB: .2, elB: .3, face: 'smile' }]]);
    const logIn = seg(t, 26.6, 26.85);
    man(1560, G, 55, billP, CAST.bill, { hold: J => { if (logIn < 1) { seed('billLog'); const a = add2(J.handB, [60, -10]), b = add2(J.handF, [-70, 6]), c = lerp2(lerp2(a, b, .5), [RG.ex - 4.7 * RG.es, G - 3.4 * RG.es * 1.1], easeIn(logIn)); pfill(limb([add2(c, [-66, 8]), add2(c, [66, -8])], [22, 20]), '#7A5A3E', { tone: .8, sw: 1 }); } } });
    // the boss drops his arm (already moving at the cut), then pumps a fist at the first blow
    const bP = kp(t, [[26.3, { view: 'front', shB: 2.2, elB: -.2, shF: .25, elF: -1.9, look: -.9, face: 'shout', mouth: .5, dy: .05 }], [26.41, { view: 'front', shB: .95, elB: -.05, shF: .25, elF: -1.9, look: -1, head: .15, face: 'shout', mouth: .7 }],
      [26.9, { view: 'front', shB: .8, elB: 0, shF: .25, elF: -1.9, look: -.8, face: 'grit' }], [27.62, { view: 'front', shB: 2.6, elB: -.6, shF: .25, elF: -1.9, look: -.5, head: -.2, face: 'laugh' }], [28.5, { view: 'front', shB: 2.3, elB: -.8, shF: .25, elF: -1.9, look: -.4, face: 'smile' }]], easeOut);
    seed('boss'); man(1330, G, 60, bP, CAST.boss, { front: J => watch(add2(J.handF, [-6, -4]), 60, t) });
    if (t < 26.5) { seed('bossSwish'); const a = seg(t, 26.3, 26.5); for (let i = 0; i < 5; i++) { const r = 150 + i * 16, a0 = -1.7 + a * .6, a1 = -.9 + a * .7; pline([0, 1, 2, 3, 4].map(k => polar([1340, 400], lerp(a0, a1, k / 4) + Math.PI * .95, r)), 1.3, AP.graphite, { over: 0, passes: 1, alpha: (1 - a) * .8, curv: true }); } }
    seed('driller'); man(dx0, G, s, dP, CAST.driller);
    camOff();
  }

  // ---------------- shot 7 · 29.54–35.63 · chorus 1: the crew at the rig in rhythm, every blow on the beat ----------------
  // the driller's sledge cycle: strike on each odd beat, hold the impact, recoil, slow wind-up, fast strike
  const DOWN = { view: 'side', lean: .5, shF: .95, elF: -.05, shB: .8, elB: .05, hpF: .5, knF: .6, hpB: -.3, knB: .35, head: .25, face: 'shout', mouth: .45 };
  // arm angles past vertical are written as +2π equivalents so kp() blends the swing OVER the top (POSES.hamUp's
  // negative angles would blend the arms down and under)
  const UP = { view: 'side', lean: -.15, shF: TAU - 2.5, elF: .55, shB: TAU - 2.35, elB: .4, hpF: .25, knF: .15, hpB: -.2, knB: .1, head: -.3, face: 'grit', mouth: 0 };
  const MID = { view: 'side', lean: .25, shF: .5, elF: .3, shB: .35, elB: .35, hpF: .35, knF: .35, hpB: -.25, knB: .2, head: .05, face: 'grit', mouth: .1 };
  function hammerPose(t) {
    const q = frac((bpOf(t) - 1) / 2);
    if (q < .06) return { P: { ...DOWN, squash: .06 }, off: .35, q };
    if (q < .3) { const k = easeOut(seg(q, .06, .3)); return { P: kp(k, [[0, DOWN], [1, MID]]), off: lerp(.35, .1, k), q }; }
    if (q < .84) { const k = seg(q, .3, .84); return { P: kp(k, [[0, MID], [1, UP]], easeOut), off: lerp(.1, .75, easeOut(k)), q }; }
    const k = seg(q, .84, 1); return { P: kp(k, [[0, UP], [1, DOWN]], easeIn), off: lerp(.75, .35, easeIn(k)), q };
  }
  function strikeOf(J, off, s) { const a = J.angF + off * J.dir, u = [Math.cos(a), Math.sin(a)], hd = add2(J.handF, [u[0] * 3 * s, u[1] * 3 * s]), n = [-u[1], u[0]], p1 = add2(hd, [n[0] * .5 * s, n[1] * .5 * s]), p2 = add2(hd, [-n[0] * .5 * s, -n[1] * .5 * s]); return p1[1] > p2[1] ? p1 : p2; }
  // motion smear behind the sledge head on the fast strike (drawn under it)
  function headAt(t, x, G, s) { const H = hammerPose(t), J = ghost(() => man(x, G, s, { ...H.P, flip: true }, CAST.driller)), a = J.angF + H.off * J.dir; return add2(J.handF, [Math.cos(a) * 3 * s, Math.sin(a) * 3 * s]); }
  function sledgeSmear(t, x, G, s, H) {
    if (H.q < .88 && H.q > .02) return;
    seed('smear'); const P = [.1, .075, .05, .025, 0].map(d => headAt(t - d, x, G, s));
    for (let i = -2; i <= 2; i++) pline(P.map(p => [p[0] + i * 7, p[1] - i * 3]), 1.2, AP.graphite, { over: 0, passes: 1, curv: true, alpha: .5 - Math.abs(i) * .12, taper: .9 });
  }
  function shot7(t, lt, dur) {
    LIGHT = [-.5, .85];
    const G = RG.G, s = 58, lb = lastBlow(t), sinceBlow = t - lb, dust = 1 - seg(sinceBlow, 0, 1);
    // place the driller so the sledge lands on the drive clamp
    seed('driller'); const Ji = ghost(() => man(0, G, s, { ...DOWN, flip: true }, CAST.driller)), hitP = strikeOf(Ji, .35, s), dxD = RG.dx - hitP[0], clampY = hitP[1];
    const H = hammerPose(t);
    const shake = shakeXY(t, 10 * Math.exp(-sinceBlow * 10));
    const push = seg(t, 35.05, 35.63);
    const cam = kf(t, [[29.54, [720, 470, 1.24]], [33.35, [710, 468, 1.2]], [34.15, [960, 470, .98]], [35.05, [950, 480, 1.0]], [35.63, [RG.dx, G + 260, 1.8]]], ease);
    camOn(cam[0] + shake[0], cam[1] + shake[1] + easeIn(push) * 160, cam[2]);
    const ph = beamPh(t);
    const R = rigScene(t, { ph, eng: ph, fire: .7 + .3 * pulse(t, 4), smoke: .6, shake: .2, lever: 1, gauge: .65 + .1 * pulse(t, 4), dust: dust * .9, clampY, plunge: push > 0 });
    // the hands haul on the rope, leaning back on every beat
    const hb = i => { const k = Math.exp(-frac(bpOf(t) - .12 * i) * 5); return { view: 'side', lean: -.15 - .3 * k, shF: 1.2 + .15 * k, elF: .35 - .2 * k, shB: 1.4 + .1 * k, elB: .2, hpF: .4 + .1 * k, knF: .25, hpB: -.3 - .1 * k, knB: .25, face: k > .5 ? 'shout' : 'grit', mouth: .3 * k }; };
    seed('hand1'); const H1 = man(150, G, 52, hb(0), CAST.hand1);
    seed('hand2'); const H2 = man(290, G, 50, hb(1), CAST.hand2);
    bullRope(R.D.crown, [H2.handB, H2.handF, H1.handB, H1.handF], G);
    // Bill stokes: a log into the firebox on every even beat
    const bq = frac(bpOf(t) / 2), toss = bq < .25 ? seg(bq, 0, .25) : 0;
    const billP = bq < .25 ? kp(bq, [[0, { view: 'side', lean: .45, shF: 1.8, elF: .1, shB: 1.6, elB: .2, hpF: .5, knF: .4, face: 'shout', mouth: .4 }], [.25, { view: 'side', lean: .2, shF: .7, elF: .3, shB: .5, elB: .4, face: 'grit' }]])
      : kp(bq, [[.25, { view: 'side', lean: .2, shF: .7, elF: .3, shB: .5, elB: .4, face: 'grit' }], [.6, { view: 'side', lean: .1, shF: .2, elF: .8, shB: .1, elB: .9, hpF: .2, knF: .5, face: 'grit' }], [1, { view: 'side', lean: -.1, shF: 2.3, elF: 1.1, shB: 2.1, elB: 1.2, face: 'grit' }]], ease);
    seed('bill'); man(1560, G, 55, billP, CAST.bill, { hold: J => { if (bq > .45 || bq < .15) { seed('billLog'); const c = lerp2(J.handF, J.handB, .5), k = bq < .15 ? easeIn(bq / .15) : 0, d0 = lerp2(c, [RG.ex - 4.7 * RG.es, G - 3.4 * RG.es * 1.1], k); pfill(limb([add2(d0, [-60, 8]), add2(d0, [60, -8])], [20, 18]), '#7A5A3E', { tone: .8, sw: 1 }); } } });
    // the boss pumps his fist on every blow
    const bk = Math.exp(-frac((bpOf(t) - 1) / 2) * 5);
    seed('boss'); man(1330, G, 60, { view: 'side', flip: true, lean: -.1 * bk, shB: 1.6 + 1.2 * bk, elB: 1.5 - .6 * bk, shF: 1.0, elF: 1.7, head: -.2 * bk, face: bk > .4 ? 'shout' : 'grit', mouth: .5 * bk }, CAST.boss, { front: J => watch(add2(J.handF, [-6, -4]), 60, t) });
    // the driller: the John Henry of the crew
    seed('driller');
    man(dxD, G, s, { ...H.P, flip: true }, CAST.driller, { hold: J => { sledgeSmear(t, dxD, G, s, H); sledge(J.handF, J.angF + H.off * J.dir, s, { key: 'dr' }); } });
    if (H.q < .1) { seed('sparks'); const p = [RG.dx, clampY], k = seg(H.q, 0, .1); pglow(p[0], p[1], 160 * (1 - k * .5), AP.lamp, 1 - k); for (let i = 0; i < 14; i++) { const a = -Math.PI * (.05 + .9 * hash(i * 3.3)), r = 40 + 110 * hash(i) * (.4 + k); pline([polar(p, a, r * (.3 + k * .5)), polar(p, a, r)], 1.8, i % 3 ? AP.lamp : '#FFF4DC', { over: 0, passes: 1, alpha: 1 - k * .7 }); } }
    camOff();
    if (push > 0) speedLines(easeIn(push), [0, 1], AP.graphite, 's7whip');
  }

  // ---------------- shot 8 · 35.63–41.50 · the dive, 0 → 600 ft ----------------
  // what the first dive passes: the squatter's old dug well (dry, a bucket at the bottom), dead roots reaching for
  // water that isn't there, a buried beast, desiccation cracks running down into the clay
  const DIVE_X = 960;
  function diveExtraA() {
    seed('dxWell');
    const wx = DIVE_X - 430, wb = 84 * FT;
    pfill([[wx - 26, 0], [wx + 26, 0], [wx + 22, wb], [wx - 22, wb]], AP.coal, { tone: .75, dens: .9, ink: null });
    for (let i = 0; i < 14; i++) { const y = i * wb / 14; for (const sd of [-1, 1]) pfill(rectPts(wx + sd * 26 - (sd > 0 ? 0 : 10), y, 10, wb / 14 - 2), '#9A5A3A', { tone: .8, sw: .6 }); }
    pfill([[wx - 12, wb - 22], [wx + 12, wb - 22], [wx + 9, wb - 4], [wx - 9, wb - 4]], AP.rust, { tone: .85, sw: .9 });   // the bucket, dry
    pline([[wx, -8], [wx + 2, wb - 24]], .8, '#8A6A44', { over: 0, passes: 1 });
    seed('dxRoots');
    for (let r = 0; r < 3; r++) { const x0 = DIVE_X + 360 + r * 170; let p = [x0, 0]; const P = [p];
      for (let i = 0; i < 7; i++) { p = [p[0] + (hash(r * 9 + i) - .5) * 60, p[1] + 22 + hash(r * 5 + i) * 26]; P.push(p); }
      pline(P, 2.6 - r * .4, '#6E5440', { curv: true, over: 0, taper: .9 });
      for (let i = 2; i < 7; i += 2) pline([P[i], [P[i][0] + (hash(r + i) - .5) * 80, P[i][1] + 40]], 1.1, '#6E5440', { curv: true, over: 0, taper: .9 }); }
    seed('dxBones');
    const bx = DIVE_X - 820, by = 36 * FT;
    pfill(ellPts(bx, by, 34, 20, 10, 1, -.3), AP.bone, { tone: .75, sw: .9 });
    for (let i = 0; i < 6; i++) pline([[bx + 40 + i * 20, by + 4], [bx + 30 + i * 22, by - 26], [bx + 18 + i * 22, by - 34]], 2.4, AP.bone, { curv: true, over: 0, taper: .8 });
    pline([[bx + 30, by + 6], [bx + 170, by + 2]], 3, AP.bone, { over: 0 });
    seed('dxCracks');
    for (let i = 0; i < 9; i++) { const x0 = DIVE_X - 1200 + i * 290 + hash(i) * 80; if (Math.abs(x0 - DIVE_X) < 90) continue; let p = [x0, 0]; const P = [p];
      for (let k = 0; k < 5; k++) { p = [p[0] + (hash(i * 7 + k) - .5) * 30, p[1] + 20 + 30 * hash(i * 3 + k)]; P.push(p); }
      pline(P, 2.2, AP.earthDk, { over: 0, taper: .95 }); }
  }
  function shot8(t, lt, dur) {
    LIGHT = [-.5, .85];
    dive(t, lt, dur, { from: 0, to: 600, x: DIVE_X, extra: () => diveExtraA() });
    if (lt < .3) speedLines(1 - easeOut(lt / .3), [0, 1], AP.graphite, 's8whip');
  }

  // ---------------- shot 9 · 41.50–47.90 · instrumental: days pass on the rig; the bore goes down toward 900 ft ----------------
  const DAY0 = 42.1, DAYL = 1.8;   // three days and nights
  function skyAt(f) {    // f 0..1 through one day: dawn, noon, dusk, night
    const K = [[0, '#E7B389', '#F3D6B0'], [.2, '#E3A060', '#F2DDB0'], [.45, '#EBC58C', '#F6E6C4'], [.7, '#D98A45', '#F0C890'], [.8, '#B4502C', '#E08A4A'], [.88, '#3A3558', '#6A4A58'], [.97, '#1E2440', '#2E3450'], [1, '#6A5A70', '#C98E6A']];
    let i = 0; while (i + 1 < K.length - 1 && f >= K[i + 1][0]) i++;
    const k = seg(f, K[i][0], K[i + 1][0]); return [mixCol(K[i][1], K[i + 1][1], k), mixCol(K[i][2], K[i + 1][2], k)];
  }
  function shot9(t, lt, dur) {
    const z0 = .55, cy0 = 600 * FT + 140 / z0;
    const k = ease(seg(t, 41.5, 42.9)), z = lerp(z0, .37, k), cy = lerp(cy0, 300, k), cx = DIVE_X;
    const dayT = Math.max(0, t - DAY0) / DAYL, f = t < DAY0 ? .42 + (t - 41.5) / DAYL * .3 : frac(dayT + .52), night = clamp(seg(f, .8, .88)) * (1 - seg(f, .97, 1));
    const depth = lerp(600, 885, ease(seg(t, 41.9, 47.5))), bob = -18 * Math.exp(-frac(bpOf(t)) * 9), hit = pulse(t, 7);
    const sh = shakeXY(t, hit * 2);
    camOn(cx + sh[0], cy + sh[1], z);
    // sky: the day turning over and over
    const [top, bot] = skyAt(f);
    X.save(); const g = X.createLinearGradient(0, -2200, 0, 0); g.addColorStop(0, top); g.addColorStop(1, bot); X.globalAlpha = .82; X.fillStyle = g; X.fillRect(-3000, -2400, 7000, 2400); X.restore();
    seed('s9sky'); pshade(rectPts(-3000, -2400, 7000, 2400), top, .5, { still: true });
    // the sun on its arc, then the stars
    const sa = Math.PI * (1 - clamp(f / .82)), sp = [cx + Math.cos(sa) * 2100, -120 - Math.sin(sa) * 880];
    if (f < .84) { pglow(sp[0], sp[1], 900, f > .7 ? AP.fire : '#FFF4DC', .5); sun(sp[0], sp[1], 110, f > .25 && f < .65 ? 1 : .3); }
    if (night > 0) { seed('s9stars'); for (let i = 0; i < 70; i++) { const p = [cx + (hash(i * 3.1) - .5) * 6000, -2300 + hash(i * 7.7) * 2000], tw = .5 + .5 * Math.sin(t * 5 + i); pline([p, [p[0] + 6, p[1]]], 2.4, '#F4ECDC', { over: 0, passes: 1, alpha: night * tw }); } }
    // the plain behind the rig (a strip of ground plane), with the derrick's shadow swinging across it
    seed('s9ground');
    const gc = mixCol('#D2B282', '#3A3A4A', night * .8);
    pfill([[-3000, -170], [7000, -170], [7000, 4], [-3000, 4]], gc, { tone: .75, dens: .8, ink: null, still: true });
    pline([[-3000, -170], [7000, -170]], 1.4, AP.graphiteLt, { over: 0, passes: 1 });
    if (f < .84) { const elev = Math.max(.12, Math.sin(sa)), len = Math.min(2600, 320 / elev), dir = -Math.cos(sa);
      pshade([[cx - 260, -4], [cx + 260, -4], [cx + dir * len + 40, -150], [cx + dir * len - 40, -150]], AP.graphite, .9 * (1 - night)); }
    // the earth in section, the old well and the roots, the shaft, the rods and the bit
    section(cx, -100, 2600, { halfW: 3600 });
    diveExtraA();
    shaft(cx, depth);
    rods(cx, -40, depth * FT - 50 + bob, { w: lerp(14, 22, k), col: AP.pine });
    bit(cx, depth * FT + bob, lerp(34, 44, k), { hit });
    ruler(cx - 520, 0, 1600, depth);
    // the rig on the surface: derrick, the walking beam and the engine working, lanterns at night
    derrick(cx, 0, 900, { floor: true, key: 'dive' });
    X.save(); X.translate(cx - RG.dx, -RG.G);
    const ph = frac((bpOf(t) - 1) / 2), B = walkingBeam(RG.bx, RG.G, ph), E = engine(RG.ex, RG.G, RG.es, { ph, fire: .7, smoke: .7 });
    seed('rigPitman'); const pin = polar(E.fly, ph * TAU, 2.3 * RG.es * .75); pfill(limb([B.crankEnd, pin], [14, 12]), AP.timber, { tone: .75, sw: 1 });
    seed('rigCable'); pline([B.wellEnd, [RG.dx, RG.G - 60]], 2.2, AP.iron, { over: 0 });
    // the crew at their stations, working on the beat
    const H = hammerPose(t);
    seed('s9driller'); const Ji = ghost(() => man(0, RG.G, 58, { ...DOWN, flip: true }, CAST.driller)), hp = strikeOf(Ji, .35, 58);
    man(RG.dx - hp[0], RG.G, 58, { ...H.P, flip: true }, CAST.driller, { hold: J => sledge(J.handF, J.angF + H.off * J.dir, 58, { key: 's9' }) });
    const hb = i => { const kk = Math.exp(-frac(bpOf(t) - .12 * i) * 5); return { view: 'side', lean: -.15 - .3 * kk, shF: 1.2 + .15 * kk, elF: .35 - .2 * kk, shB: 1.4 + .1 * kk, elB: .2, hpF: .4, knF: .25, hpB: -.3, knB: .25, face: 'grit' }; };
    seed('s9h1'); man(150, RG.G, 52, hb(0), CAST.hand1); seed('s9h2'); man(290, RG.G, 50, hb(1), CAST.hand2);
    seed('s9boss'); man(1330, RG.G, 60, { view: 'side', flip: true, shF: 1.0, elF: 1.75, shB: .2, elB: .3, head: .25 }, CAST.boss, { front: J => watch(add2(J.handF, [-6, -4]), 60, t) });
    seed('s9bill'); man(1540, RG.G, 55, { view: 'side', lean: .3, shF: 1.5 + .3 * pulse(t, 4), elF: .3, shB: 1.3, elB: .4, face: 'grit' }, CAST.bill);
    // rods waiting on the ground: fewer every day as they go down the hole
    seed('s9rods'); const left = Math.max(1, Math.round(12 - (depth - 600) / 285 * 10));
    for (let i = 0; i < left; i++) pfill(limb([[-300 + i * 3, RG.G - 20 - i * 12], [320 + i * 3, RG.G - 24 - i * 12]], [10, 10]), AP.pine, { tone: .75, sw: .8 });
    if (night > .05) { for (const p of [[RG.dx + 260, RG.G - 300], [RG.bx - 60, RG.G - 280], [RG.ex - 200, RG.G - 260]]) lantern(p[0], p[1], 28, night); }
    X.restore();
    // night falls over the land, not the ground in section
    if (night > 0) { ptone([[-3000, -2400], [7000, -2400], [7000, 0], [-3000, 0]], AP.night, .45 * night); }
    camOff();
    if (lt > dur - .35) scribbleWipe((lt - (dur - .35)) / .7);
  }

  shots([
    [0, shot1],
    [7.4, shot2], [12.22, shot3], [16.46, shot4], [21.78, shot5], [26.3, shot6], [29.54, shot7], [35.63, shot8], [41.5, shot9],
  ]);
})();
