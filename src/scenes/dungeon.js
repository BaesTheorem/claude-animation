// dungeon.js: "The Dungeon", 31.5 s, to Kevin MacLeod's "Sneaky Adventure" (107 BPM). See STORYBOARD.md.
//   A (0–7.05):     a stuck door, opened with magic. Light floods the frame.
//   B (7.05–11.54): a trap door; Clawd hangs in mid-air, then drops down the shaft.
//   C (11.54–31.5): the lower room: a gelatinous cube swallows Clawd, who blows it apart from inside and leaves
//                   through a second magic door. Iris out.
(() => {
  const STONE = '#56607A', STONE_DK = '#3A4257', FLOOR = '#474C5E', WOOD = '#8A5A3A', WOOD_DK = '#5A3822', IRON = '#34343E';
  const MAGIC = '#7FE6DA', MAGIC2 = '#B79CFF', LIGHT = '#FFEDC4', GOO = '#9FE06E', GOO_DK = '#4E8F3A';
  const beat = n => .325 + n * .5607;

  // ---------- helpers ----------
  const add = (a, b, k) => (a[k] || 0) + (b[k] || 0);
  function bodyPt(x, G, u, o, lx, ly) {   // body-local (front-view units) → world, matching clawd()'s transform
    const sq = (o.sq || 0) + (o.take || 0), f = o.flip ? -1 : 1;
    const px = lx * u * f * (1 + sq * .6), py = ly * u * (1 - sq), r = o.rot || 0;
    return [x + (o.dx || 0) * u + px * Math.cos(r) - py * Math.sin(r), G + (o.dy || 0) * u + px * Math.sin(r) + py * Math.cos(r)];
  }
  // The wand: held in the arm hook (+x runs out along the arm), a crystal at the tip.
  const WAND = 2.1;
  const wand = (u, sw) => {
    inkLine([[0, 0], [WAND * u, 0]], sw * 2, WOOD_DK, 'ink', 0);
    paint(starPts(WAND * u + .2 * u, 0, .6 * u, .45, 4), { wash: MAGIC, ink: PAL.ink, sw: sw * .5 });
  };
  // Clawd's options with the wand in the right hand for the view (side view has one arm, 'L').
  const wiz = o => ({ hat: 'wizard', ...o, ...(o.view === 'side' ? { armL: wand } : { armR: wand }) });
  // World position of the wand tip for a pose (front, q or side view).
  function tipPt(x, G, u, o) {
    let px, py, ang, len;
    if (o.view === 'side') { px = 1.6; py = -4.2; ang = .7 - (o.aL ?? .2); len = 2.1 + WAND + .2; }
    else { const a = o.aR ?? .2; px = (o.view === 'q' ? 5 : 4.9) + .55 * clamp((Math.abs(a) - .7) / .9); py = -4.5; ang = -a; len = 2.2 + WAND + .2; }
    return bodyPt(x, G, u, o, px + len * Math.cos(ang), py + len * Math.sin(ang));
  }
  const sparkle = (x, y, r, k, col = LIGHT) => { if (k > 0 && k < 1) paint(starPts(x, y, r * backOut(k) * (1 - k * .6), .25, 4, k * 2), { wash: col, washOp: 255 * (1 - k * k), ink: null }); };
  function smoke(x, y, age, key) {
    if (age < 0 || age > .9) return;
    boilSeed('smoke' + key);
    const k = age / .9;
    for (let i = 0; i < 4; i++) paint(ellPts(x + (hash(i + key) - .5) * 60 * k, y - 80 * easeOut(k) - i * 14, 14 + 26 * k, 12 + 20 * k, 12), { fill: '#8C8C99', fillOp: 170 * (1 - k), bleed: .2, tex: .3, ink: null });
  }

  // ---------- set pieces ----------
  function wall(x0, x1, y0, y1, key, tone = 0) {
    boilSeed('wall' + key);
    const c = mixCol(STONE, PAL.night, tone);
    paint(rectPts(x0, y0, x1 - x0, y1 - y0), { wash: c, ink: null });
    for (let i = 0; i < 5; i++) paint(ellPts(lerp(x0, x1, hash(i + 3)), lerp(y0, y1, hash(i + 7)), 260, 140, 18, 10), { fill: mixCol(c, PAL.night, .4), fillOp: 55, bleed: .3, tex: .6, ink: null });
    const BH = 64, BW = 128, mortar = mixCol(STONE_DK, PAL.night, tone);
    for (let r = Math.floor(y0 / BH); r <= Math.ceil(y1 / BH); r++) {
      const y = r * BH;
      boilSeed('row' + key + r);
      inkLine([[x0, y + 3 * hash(r)], [x1, y - 3 * hash(r + 1)]], .7, mortar, 'inkfine', 0);
      for (let k = Math.floor(x0 / BW) - 1; k <= Math.ceil(x1 / BW); k++) {
        const xx = k * BW + (r % 2) * BW / 2 + 10 * (hash(k * 7 + r) - .5);
        if (hash(k * 13 + r * 5) > .25) inkLine([[xx, y], [xx + 3, y + BH]], .6, mortar, 'inkfine', 0);
      }
    }
  }
  function floorBand(x0, x1, G, key, depth = 900) {
    boilSeed('floor' + key);
    paint(rectPts(x0, G - 6, x1 - x0, depth), { wash: FLOOR, fill: mixCol(FLOOR, PAL.night, .4), fillOp: 70, bleed: .05, tex: .6, ink: null });
    inkLine([[x0, G - 6], [x1, G - 8]], 1.2, PAL.ink, 'ink', 0);
    for (let k = Math.floor(x0 / 170); k <= x1 / 170; k++) inkLine([[k * 170 + 30 * hash(k), G - 6], [k * 170 - 40 + 30 * hash(k), G + 90]], .6, PAL.night, 'inkfine', 0);
    inkLine([[x0, G + 45], [x1, G + 42]], .6, PAL.night, 'inkfine', 0);
  }
  function torch(x, y, t, key) {
    boilSeed('torch' + key);
    glow(x, y - 50, 330, '#FFB65C', .55 + .12 * Math.sin(t * 13 + key));
    paint(rectPts(x - 7, y - 8, 14, 70), { wash: WOOD_DK, ink: PAL.ink, sw: .7 });
    paint(rectPts(x - 17, y - 20, 34, 16, 1), { wash: IRON, ink: PAL.ink, sw: .7 });
    const f = 1 + .14 * Math.sin(t * 17 + key * 3), s = 5 * Math.sin(t * 9 + key);
    paint([[x - 16, y - 20], [x - 13, y - 52 * f], [x + s, y - 84 * f], [x + 13, y - 50 * f], [x + 16, y - 20]], { wash: '#FF9E3D', ink: PAL.ink, sw: .5, curv: .6 });
    paint([[x - 8, y - 22], [x - 6, y - 44 * f], [x + s * .6, y - 62 * f], [x + 7, y - 42 * f], [x + 8, y - 22]], { wash: '#FFE08A', ink: null, curv: .6 });
  }
  // An arched wooden door. open 0..1 swings the panel onto its left hinge; rune 0..1 spins up a ring of marks.
  const archPts = (x, G, w, h) => {
    const P = [[x - w / 2, G], [x - w / 2, G - h + w / 2]];
    for (let i = 1; i < 12; i++) { const a = Math.PI + i / 12 * Math.PI; P.push([x + Math.cos(a) * w / 2, G - h + w / 2 + Math.sin(a) * w / 2]); }
    P.push([x + w / 2, G - h + w / 2], [x + w / 2, G]); return P;
  };
  function door(x, G, t, o = {}) {
    const w = 250, h = 400, open = o.open || 0, rune = o.rune || 0;
    boilSeed('doorframe' + x);
    paint(archPts(x, G, w + 70, h + 35), { wash: STONE_DK, ink: PAL.ink, sw: 1.2 });
    paint(archPts(x, G, w, h), { wash: open > 0 ? LIGHT : PAL.night, ink: PAL.ink, sw: 1 });
    if (open > 0) glow(x, G - h * .45, 380 * open, '#FFD58A', .9 * open);
    boilSeed('door' + x);
    const hinge = x - w / 2, k = 1 - .82 * clamp(open);
    const sq = P => P.map(([px, py]) => [hinge + (px - hinge) * k, py + (open > 0 ? -.04 * (px - hinge) * (1 - k) : 0)]);
    const rattle = o.rattle || 0;
    push(); translate(rattle, 0);
    paint(sq(archPts(x, G, w - 14, h - 10)), { wash: open > .5 ? mixCol(WOOD, WOOD_DK, .5) : WOOD, fill: WOOD_DK, fillOp: 60, tex: .6, ink: PAL.ink, sw: 1.1 });
    for (const px of [-60, 0, 60]) inkLine(sq([[x + px, G - 4], [x + px, G - h + 40 + Math.abs(px) * .4]]), .8, WOOD_DK, 'ink', 0);
    for (const py of [G - 90, G - h + 110]) paint(sq([[x - w / 2 + 8, py], [x + w / 2 - 8, py], [x + w / 2 - 8, py + 20], [x - w / 2 + 8, py + 20]]), { wash: IRON, ink: PAL.ink, sw: .6 });
    const ring = sq([[x + 70, G - 200]])[0];
    paint(ellPts(ring[0], ring[1], 16 * k + 4, 16, 12), { ink: IRON, sw: 2.2 });
    pop();
    if (rune > 0 && open < .6) {   // a ring of runes (painted marks, not letters) spinning up on the door
      boilSeed('rune' + x);
      const cx = x, cy = G - h * .5, R = 95 * backOut(clamp(rune)), spin = t * 2.2;
      glow(cx, cy, 200 * rune, MAGIC, .7 * rune);
      paint(ellPts(cx, cy, R, R, 36), { ink: MAGIC, sw: 1.6 });
      paint(ellPts(cx, cy, R * .72, R * .72, 30), { ink: MAGIC2, sw: 1 });
      for (let i = 0; i < 8; i++) { const a = spin + i / 8 * TAU; paint(starPts(cx + Math.cos(a) * R * .86, cy + Math.sin(a) * R * .86, 11 * rune, .3, i % 2 ? 4 : 3, a), { wash: i % 2 ? MAGIC : MAGIC2, ink: null }); }
      paint(starPts(cx, cy, 30 * rune, .35, 6, -spin), { wash: MAGIC, ink: PAL.ink, sw: .5 });
    }
  }
  // a stream of sparkles from the wand tip to a target, k = 0..1 strength
  function stream(from, to, t, k, key) {
    if (k <= 0) return;
    boilSeed('stream' + key);
    glow(from[0], from[1], 90 * k, MAGIC, .8 * k);
    for (let i = 0; i < 9; i++) {
      const q = frac(t * 1.6 + i / 9), p = arcPt(from, to, 60 + 40 * hash(i), q);
      paint(starPts(p[0] + 10 * Math.sin(t * 7 + i), p[1], (7 + 6 * hash(i)) * k * (1 - q * .5), .3, 4), { wash: i % 2 ? MAGIC : MAGIC2, ink: null });
    }
  }

  // ---------- shot A: the stuck door ----------
  const GA = 860, uA = 26, DX = 1350;
  function shotDoor(t, lt, dur) {
    camBegin(kf(t, [[0, 760], [2, 930], [5.4, 980], [7.05, 1200]], ease), kf(t, [[0, 560], [5, 560], [7.05, 590]]), kf(t, [[0, 1.08], [4.8, 1.14], [7.05, 1.45]], ease));
    wall(-300, 2300, -100, GA, 'A');
    floorBand(-300, 2300, GA, 'A');
    torch(420, 470, t, 1); torch(1880, 470, t, 2);
    const trot = stroll(t, .2, 2.0, 180, 1082, uA), back = stroll(t, 2.6, 2.95, 1082, 990, uA), go = stroll(t, 6.15, 7.1, 990, 1330, uA);
    const x = t < 2.6 ? trot.x : t < 6.15 ? back.x : go.x;
    const mood = emotions(t, [[0, 'determined'], [2.0, 'determined', { emote: 'sweat' }], [2.75, 'thinking'], [3.2, 'idea'], [3.6, 'determined'], [5.4, 'proud'], [6.15, 'happy']]);
    let pose;
    if (t < 2.0) pose = { view: 'side', walk: trot.walk, dy: trot.dy };
    else if (t < 2.6) { const sh = Math.sin(t * 55) * .06; pose = { view: 'side', rot: .16, dx: sh, aL: -.1, sq: .06 }; }
    else if (t < 2.95) pose = { view: 'side', walk: back.walk, dy: back.dy, rot: .16 * (1 - seg(t, 2.6, 2.8)) };
    else if (t < 3.5) pose = turn(t, 2.95, 3.1, .25, 0);   // turns to us to think: the idea has to be seen
    else if (t < 3.62) pose = turn(t, 3.5, 3.62, 0, .25);
    else if (t < 5.3) { const up = backOut(seg(t, 3.62, 3.85)), jab = pulse(t, 6) * seg(t, 3.8, 4.8); pose = { view: 'side', aL: lerp(.2, 1.25, up) + .15 * jab, sq: .04 * jab }; }
    else if (t < 6.15) pose = turn(t, 5.3, 5.45, .25, 0);
    else pose = { ...turn(t, 6.15, 6.28, 0, .25), ...(t > 6.28 ? { view: 'side', walk: go.walk, dy: go.dy } : {}) };
    const cl = wiz({ ...mood, ...pose, dy: add(mood, pose, 'dy') * (t < 2.0 || t > 6.3 ? .3 : 1) + (t < 2.0 || t > 6.3 ? (pose.dy || 0) * .7 : 0), sq: add(mood, pose, 'sq'), rot: add(mood, pose, 'rot') });
    if (t > 5.45 && t < 6.15) { cl.aL = -.5; cl.aR = -.5; }   // hands on hips
    const open = backOut(seg(t, beat(8), beat(8) + .5)), rune = seg(t, 3.8, 4.5) * (1 - seg(t, beat(8), beat(8) + .3));
    door(DX, GA, t, { open, rune, rattle: t > 2.05 && t < 2.6 ? 4 * Math.sin(t * 70) : 0 });
    clawd(x, GA, uA, cl);
    if (t > 3.8 && t < beat(8) + .1) stream(tipPt(x, GA, uA, cl), [DX, GA - 200], t, seg(t, 3.8, 4.0) * (1 - seg(t, beat(8) - .1, beat(8) + .1)), 'A');
    if (t > beat(8)) for (let i = 0; i < 6; i++) sparkle(DX + Math.cos(i) * 150, GA - 200 + Math.sin(i * 2) * 170, 26, seg(t, beat(8) + i * .04, beat(8) + .5 + i * .04));
    const eye = toScreen(x, GA - 4 * uA);
    camEnd();
    if (lt < .6) iris(...eye, lerp(0, 1500, easeIn(lt / .6)));
    flash(easeIn(seg(t, 6.4, 7.05)), LIGHT);
  }

  // ---------- shot B: the trap door ----------
  const GB = 860, uB = 26, TX0 = 830, TX1 = 1110, tClick = 8.35, tOpen = 8.55, tDrop = 9.6;
  const fallY = t => t < tDrop ? GB : GB + 1300 * (t - tDrop) ** 2;
  function shotTrap(t, lt, dur) {
    const y = fallY(t);
    const cy = t < tDrop + .15 ? 540 : Math.max(540, y - 150) - 900 * seg(t, 10.95, 11.54) ** 2;   // the camera lags so Clawd drops out of the bottom
    const cx = kf(t, [[7.05, 780], [8.4, 970]], ease), zoom = 1.12, top = cy - 540 / zoom - 60, bot = cy + 540 / zoom + 60;
    camBegin(cx, cy, zoom);
    if (top < GB) { wall(cx - 1100, cx + 1100, Math.max(-100, top), GB, 'B'); torch(300, 470, t, 3); torch(1640, 470, t, 7); }
    if (bot > GB) {   // below the floor: solid stone, with the shaft cut through it
      wall(cx - 1100, cx + 1100, Math.max(GB, top), bot, 'shaft', .35);
      boilSeed('shaftin');
      if (t > tOpen) paint(rectPts(TX0 + 10, Math.max(GB, top), TX1 - TX0 - 20, bot - Math.max(GB, top)), { wash: mixCol(PAL.night, STONE_DK, .35), fill: PAL.night, fillOp: 90, bleed: .1, tex: .5, ink: null });
      if (t > tOpen) for (const sx of [TX0 + 10, TX1 - 10]) inkLine([[sx, Math.max(GB, top)], [sx, bot]], 1.2, PAL.ink, 'ink', 0);
    }
    if (top < GB + 400) {
      if (t < tOpen) floorBand(cx - 1100, cx + 1100, GB, 'B0', 180); else { floorBand(cx - 1100, TX0, GB, 'B1', 180); floorBand(TX1, cx + 1100, GB, 'B2', 180); }
      boilSeed('trap');
      const flap = t < tOpen ? 0 : 1.45 * backOut(seg(t, tOpen, tOpen + .3)), sink = t > tClick ? 6 : 0;
      if (flap === 0) {
        paint(rectPts(TX0, GB - 6 + sink, TX1 - TX0, 50), { wash: mixCol(FLOOR, STONE, .2), ink: PAL.ink, sw: .8 });
        inkLine([[TX0 + 60, GB + sink], [TX0 + 110, GB + 20 + sink], [TX0 + 150, GB + 8 + sink]], .7, PAL.ink, 'inkfine', .3);   // the crack that gives it away
      } else {
        paint(rectPts(TX0, GB - 6, TX1 - TX0, 60), { wash: PAL.night, ink: null });
        const L = (TX1 - TX0) / 2;
        for (const [hx, s] of [[TX0, 1], [TX1, -1]]) paint([[hx, GB - 6], [hx + s * L * Math.cos(flap), GB - 6 + L * Math.sin(flap)], [hx + s * L * Math.cos(flap) + 12 * Math.sin(flap) * s, GB + 8 + L * Math.sin(flap)], [hx, GB + 10]], { wash: mixCol(FLOOR, STONE, .2), ink: PAL.ink, sw: .8 });
      }
    }
    const walk = stroll(t, 7.05, tClick, 250, (TX0 + TX1) / 2, uB);
    const x = walk.x;
    const mood = emotions(t, [[7.05, 'happy', { emote: 'music' }], [tClick + .03, 'surprised'], [8.85, 'nervous', { lookY: 1 }], [9.2, 'nervous', { lookX: 0, lookY: 0 }], [tDrop, 'scared']]);
    let pose;
    if (t < tClick) pose = { view: 'side', walk: walk.walk, dy: walk.dy * .7 };
    else if (t < 8.75) pose = turn(t, 8.6, 8.75, .25, 0);
    else if (t < tDrop) pose = { lookY: t < 9.2 ? 1 : 0, aL: .1, aR: t > 9.25 ? 1.1 + .4 * Math.sin((t - 9.25) * 14) : .1 };   // looks down, looks at us, tiny wave
    else { const a = t - tDrop; pose = { rot: a * 4.5, aL: 1.3, aR: 1.5, noShadow: true, sq: -.12 }; }
    const cl = wiz({ ...mood, ...pose, dy: (mood.dy || 0) * (t < tClick ? .3 : 1) + (pose.dy || 0), sq: add(mood, pose, 'sq'), rot: pose.rot ?? mood.rot });
    if (t > tOpen) cl.noShadow = true;
    clawd(x, y, uB, cl);
    camEnd();
    boilSeed('transition');
    flash(1 - easeOut(seg(lt, 0, .5)), LIGHT);
  }

  // ---------- shot C: the cube ----------
  const GC = 880, uC = 30, CXL = 620, DX2 = 1700, CW = 580, CH = 620;
  const tLand = 11.97, tCube0 = 13.2, tBolt = beat(28), tFizz = 17.55, tLunge = beat(32), tGulp = tLunge + .45, tHeat = 20.75, tPop = beat(40), tDoor2 = beat(48);
  const cubeX = t => t < tLunge ? kf(t, [[tCube0, 2400], [14.6, 1420], [16.3, 1330], [16.9, 1200]], ease) : lerp(1200, CXL + 10, backOut(seg(t, tLunge, tGulp)));
  const heat = t => seg(t, tHeat, tPop - .1);
  function cube(x, G, t) {
    const hits = [0, 1, 2].map(i => tBolt + .33 + i * .09);
    const j = .09 * ring(t, [...hits, tGulp], 5, 20) + (t < 14.6 || (t > tLunge && t < tGulp) ? .03 * Math.sin(t * 11) : .012 * Math.sin(t * 4));
    const sw = .14 * easeIn(heat(t)) + (t > tPop - .6 ? .025 * Math.sin(t * 80) : 0), hk = heat(t);
    const w = CW * (1 + j + sw), h = CH * (1 - j + sw * .8);
    boilSeed('cube');
    const col = mixCol(GOO, '#F2A553', hk * .55);
    glow(x, G - h / 2, 300 + 150 * hk, hk > 0 ? '#FFC36A' : GOO, .25 + .5 * hk);
    paint(rrPts(x - w / 2, G - h, w, h, 70, 3), { wash: col, washOp: 120, fill: mixCol(col, GOO_DK, .3), fillOp: 45, bleed: .1, tex: .4, ink: GOO_DK, sw: 1.6 });
    inkLine([[x - w / 2 + 40, G - h + 30], [x - w / 2 + 25, G - h + 150]], 3, '#EFFFE0', 'ink', .4);   // shine
    inkLine([[x - w / 2 + 70, G - h + 22], [x - w / 2 + 150, G - h + 16]], 3, '#EFFFE0', 'ink', .4);
    for (let i = 0; i < 9; i++) {   // bubbles rise, faster as it heats
      const bx = x - w / 2 + 50 + hash(i + 60) * (w - 100), period = h - 60, by = G - 30 - ((t * (40 + 260 * hk) + hash(i + 61) * period) % period);
      paint(ellPts(bx + 6 * Math.sin(t * 3 + i), by, 6 + 7 * hash(i), 6 + 7 * hash(i), 10), { ink: '#EFFFE0', sw: .9 });
    }
  }
  function junk(x, G, t) {   // things the cube already ate, floating inside (drawn before the jelly so they sit in it)
    boilSeed('junk');
    const bob = k => 8 * Math.sin(t * 1.3 + k);
    paint(ellPts(x + 150, G - 330 + bob(1), 34, 30, 14), { wash: PAL.cream, ink: PAL.ink, sw: .8 });
    for (const s of [-1, 1]) paint(ellPts(x + 150 + s * 12, G - 334 + bob(1), 8, 9, 8), { wash: PAL.ink, ink: null });
    paint(rectPts(x + 138, G - 306 + bob(1), 24, 14), { wash: PAL.cream, ink: PAL.ink, sw: .6 });
    for (let i = 0; i < 3; i++) paint(ellPts(x - 170 + i * 26, G - 80 - i * 18 + bob(i + 3), 14, 9, 10), { wash: PAL.ochre, ink: PAL.ink, sw: .6 });
    push(); translate(x + 90, G - 120 + bob(5)); rotate(-.6 + .1 * Math.sin(t));
    inkLine([[-90, 0], [70, 0]], 5, '#B8C0CC', 'ink', 0); paint(rectPts(-100, -16, 12, 32), { wash: PAL.ochre, ink: PAL.ink, sw: .6 });
    pop();
  }
  function blobs(c, G, t) {   // the cube bursts: each blob flies on a ballistic arc and splats where it lands
    if (t < tPop) return;
    const a0 = t - tPop, g = 2600;
    for (let i = 0; i < 18; i++) {
      boilSeed('blob' + i);
      const ang = -Math.PI * (.08 + .84 * hash(i + 70)), v = 700 + 900 * hash(i + 71), vx = Math.cos(ang) * v * 1.4, vy = Math.sin(ang) * v;
      const y0 = c[1] + (hash(i + 72) - .5) * 200, floorY = G + 10 + 50 * hash(i + 73);
      const tl = (-vy + Math.sqrt(vy * vy + 2 * g * (floorY - y0))) / g, r = 16 + 22 * hash(i + 74);
      if (a0 < tl) {
        const px = c[0] + vx * a0, py = y0 + vy * a0 + .5 * g * a0 * a0, sp = Math.atan2(vy + g * a0, vx);
        paint(ellPts(px, py, r * 1.35, r * .8, 14, 1, sp), { wash: GOO, washOp: 230, ink: GOO_DK, sw: .8 });
      } else paint(ellPts(c[0] + vx * tl, floorY, r * 1.7 * (1 + .15 * spring(t, tPop + tl, 8, 25)), r * .45, 14, 2), { wash: GOO, washOp: 210, ink: GOO_DK, sw: .7 });
    }
  }
  function shotCube(t, lt, dur) {
    const shk = shakeXY(t, 9 * Math.exp(-(t - tLand) * 8) * (t > tLand) + 16 * Math.exp(-(t - tPop) * 6) * (t > tPop));
    const cx = kf(t, [[11.54, 960], [13.2, 960], [14.6, 1030], [18.3, 930], [20.2, 700], [tPop, 690], [tPop + .7, 900], [25.6, 960], [27.4, 1200], [29.3, 1480]], ease);
    const cy = kf(t, [[11.54, 540], [18.3, 560], [20.2, 650], [tPop, 650], [tPop + .7, 560], [29.3, 580]], ease);
    const zoom = kf(t, [[11.54, 1], [18.3, 1.05], [20.2, 1.5], [tPop, 1.62], [tPop + .5, 1.12], [26, 1.1], [29.3, 1.25]], ease);
    camBegin(cx + shk[0], cy + shk[1], zoom);
    wall(-400, 2500, -200, GC, 'C', .12);
    boilSeed('hole');
    paint(ellPts(CXL, -20, 190, 70, 20, 4), { wash: PAL.night, ink: PAL.ink, sw: 1.2 });   // the hole Clawd fell through
    floorBand(-400, 2500, GC, 'C');
    torch(230, 500, t, 4); torch(1180, 500, t, 5); torch(2150, 500, t, 6);
    const dOpen = backOut(seg(t, tDoor2, tDoor2 + .5)), dRune = seg(t, 26.2, 27.0) * (1 - seg(t, tDoor2, tDoor2 + .3));
    door(DX2, GC, t, { open: dOpen, rune: dRune });
    // bones on the floor
    boilSeed('bones');
    for (let i = 0; i < 3; i++) { const bx = 900 + i * 140; inkLine([[bx, GC + 60], [bx + 60, GC + 50]], 6, PAL.cream, 'ink', 0); paint(ellPts(bx, GC + 60, 9, 9, 8), { wash: PAL.cream, ink: PAL.ink, sw: .5 }); }

    // Clawd
    const walk = stroll(t, 27.3, 29.0, CXL, DX2, uC);
    const x = t < 27.3 ? CXL : walk.x;
    const inside = t > tLunge + .2 && t < tPop;
    const mood = emotions(t, [[11.54, 'scared'], [tLand + .02, 'dizzy'], [13.78, 'surprised', { lookX: 1 }], [14.25, 'scared', { lookX: 1 }], [14.75, 'determined'],
      [tFizz + .3, 'nervous'], [tGulp, 'scared'], [19.7, 'thinking'], [20.25, 'idea'], [tHeat, 'determined'], [tPop + .45, 'disgusted'], [beat(44), 'proud'], [25.7, 'happy'], [29.0, 'happy']]);
    let pose = {}, gy = GC;
    if (t < tLand) { gy = lerp(-180, GC, easeIn(seg(t, 11.54, tLand))); pose = { rot: 2.6 + (t - 11.54) * 4, aL: 1.3, aR: 1.5, noShadow: true, sq: -.15 }; }
    else if (t < 13.1) { const a = t - tLand; pose = { sq: .45 * Math.exp(-a * 2.2) + .1 * Math.exp(-a * 9) * Math.cos(a * 30) }; }
    else if (t < 13.9) pose = {};
    else if (t < tLunge) {
      pose = turn(t, 13.9, 14.08, 0, .25);
      if (t > 14.08) {
        pose = { view: 'side', aL: .2 };
        if (t > 15.3 && t < 16.9) pose.aL = t < tBolt ? lerp(.2, -.5, ease(seg(t, 15.3, tBolt))) : lerp(-.5, 1.0, backOut(seg(t, tBolt, tBolt + .15)));   // wind up, then fire
        else if (t >= 16.9) pose.aL = t < tFizz ? lerp(.2, 1.2, backOut(seg(t, 16.95, 17.3))) : lerp(1.2, -.5, ease(seg(t, tFizz + .2, tFizz + .6)));   // again … fizzle, droop
      }
    } else if (inside) { const a = t - tLunge; pose = { dy: -1.6 * ease(seg(a, .1, .6)) + .3 * Math.sin(t * 1.8), rot: .12 * Math.sin(t * 1.3), aL: .6 + .3 * Math.sin(t * 2), aR: t > tHeat - .3 ? 1.35 : .4 + .3 * Math.sin(t * 2.3 + 1), mouth: t < 20.25 ? 'pout' : undefined }; }
    else if (t < 24.0) { const a = t - tPop; pose = { dy: -1.6 * (1 - easeIn(seg(a, 0, .3))), sq: a > .3 ? .3 * Math.exp(-(a - .3) * 7) : 0 }; }
    else if (t < 24.9) pose = { dx: .5 * Math.sin(t * 42), rot: .1 * Math.sin(t * 42), sq: .05 };   // shake off the goo
    else if (t < 25.9) pose = {};
    else if (t < 27.3) { pose = turn(t, 25.9, 26.05, 0, .25); if (t > 26.05) pose = { view: 'side', aL: lerp(.2, 1.25, backOut(seg(t, 26.1, 26.4))) }; }
    else if (t < 29.0) pose = { view: 'side', walk: walk.walk, dy: walk.dy };
    else pose = { ...turn(t, 29.0, 29.15, .25, 0), aR: t > 29.15 ? 1.2 + .5 * Math.sin((t - 29.15) * 13) : .2 };
    const cl = wiz({ ...mood, ...pose, dy: (pose.dy || 0) + (inside ? 0 : (mood.dy || 0) * (t > 27.3 && t < 29 ? .3 : 1)), sq: add(mood, pose, 'sq'), rot: add(mood, pose, 'rot') });
    if (pose.mouth) cl.mouth = pose.mouth;
    if (t > tPop) { cl.tint = GOO; cl.tintK = .8 * (1 - seg(t, 24.0, 24.9)); }
    if (inside || (t > tLunge && t < tPop)) cl.noShadow = true;

    const showCube = t > tCube0 && t < tPop, cX = cubeX(t);
    if (showCube) junk(cX, GC, t);
    clawd(x, gy, uC, cl);
    const tip = tipPt(x, gy, uC, cl);
    if (showCube) cube(cX, GC, t);
    // magic missile: three bolts arc from the wand into the cube and fizz out inside it
    for (let i = 0; i < 3; i++) {
      const t0 = tBolt + .04 + i * .09, k = seg(t, t0, t0 + .3);
      if (k > 0 && k < 1) {
        boilSeed('bolt' + i);
        const to = [cubeX(t0 + .3) - 60 + i * 40, GC - 250 + i * 50], p = arcPt(tip, to, 90 - i * 60, easeIn(k)), q = arcPt(tip, to, 90 - i * 60, easeIn(Math.max(0, k - .12)));
        glow(p[0], p[1], 130, MAGIC, 1);
        paint(ribbon([q, arcPt(tip, to, 90 - i * 60, easeIn(Math.max(0, k - .06))), p], 3, 26), { wash: MAGIC2, washOp: 220, ink: null });
        paint(starPts(p[0], p[1], 30, .4, 4, t * 20), { wash: MAGIC, ink: PAL.ink, sw: .5 });
      }
      if (k >= 1) sparkle(cubeX(t0 + .3) - 60 + i * 40, GC - 250 + i * 50, 40, seg(t, t0 + .3, t0 + .7), MAGIC);
    }
    if (t > tBolt - .5 && t < tBolt + .05) glow(tip[0], tip[1], 120 * seg(t, tBolt - .5, tBolt), MAGIC, 1);
    if (t > 17.0 && t < tFizz) glow(tip[0], tip[1], 90 * seg(t, 17.0, tFizz), MAGIC, .8 * (1 - .6 * Math.abs(Math.sin(t * 30))));
    smoke(tip[0], tip[1], t - tFizz, 1);
    if (t > tFizz && t < tFizz + .25) sparkle(tip[0], tip[1], 30, seg(t, tFizz, tFizz + .25), '#C9C9D2');
    if (t > tHeat - .3 && t < tPop) glow(tip[0], tip[1], 80 + 420 * easeIn(heat(t)), '#FFE3A0', .5 + .5 * heat(t));   // charging inside the cube
    if (t > 26.1 && t < tDoor2 + .1) stream(tip, [DX2, GC - 200], t, seg(t, 26.1, 26.3) * (1 - seg(t, tDoor2 - .1, tDoor2 + .1)), 'C');
    blobs([CXL + 10, GC - 300], GC, t);
    if (t > tPop + .3 && t < 24.9) for (let i = 0; i < 5; i++) {   // drips and flicked goo
      boilSeed('drip' + i);
      const t0 = (t < 24.0 ? tPop + .35 : 24.0) + i * .13, a = t - t0;
      if (a > 0 && a < .6) { const s = i % 2 ? 1 : -1, p = t < 24.0 ? [x + (i - 2) * 50, GC - 180 + 1200 * a * a] : arcPt([x + s * 120, GC - 200], [x + s * (380 + 60 * i), GC + 20], 120, a / .6); paint(ellPts(p[0], p[1], 9, 12, 10), { wash: GOO, ink: GOO_DK, sw: .5 }); }
    }
    const eye = toScreen(x, gy - 6.2 * uC);
    camEnd();
    flash(Math.exp(-(t - tPop) * 7) * (t > tPop), '#F4FFE6');
    if (t > 29.48) {
      const r = t < 30.3 ? lerp(1600, 300, ease(seg(t, 29.48, 30.3))) : t < 31.0 ? lerp(300, 280, seg(t, 30.3, 31.0)) : lerp(280, 0, easeIn(seg(t, 31.0, 31.35)));
      iris(...eye, r, PAL.night);
    }
  }

  shots([[0, shotDoor], [7.05, shotTrap], [11.54, shotCube]]);
})();
