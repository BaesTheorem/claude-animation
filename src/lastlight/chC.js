// chC.js: chapter C of "Last Light of September", inside the cottage (docs/lastlight/STORYBOARD.md).
//   C1  BAR(25) → BAR(29)   rainy afternoon, cocoa by the window. In: brushWipe second half. Clawd sips (bar 25), a raindrop
//                           races down the glass and the cat paws at it (bar 26), the rain swells (bars 26-27), then thins and a
//                           ray of gold breaks through (bar 28). Out: flash(k, '#FFE7A8') to full cover at BAR(29).
//   C2  BAR(39) → 176.64    the same room at night. In: a match cut from D's sun to the lamp's globe at screen (1180, 330),
//                           radius 150, eased back into the room. The cat climbs onto the lap and curls up (bars 39-41), the
//                           red leaf is pressed into a book (bar 42), a last leaf drifts past (bar 43), the first star
//                           (bar 44), Clawd sleeps, the camera eases up and an ink iris closes on the star by 176.4.
// One room-set helper, room(t, o), serves both: o.rain / o.gold / o.dusk choose the time of day.
(() => {
  const T25 = BAR(25), T26 = BAR(26), T27 = BAR(27), T28 = BAR(28), T29 = BAR(29);
  const T39 = BAR(39), T42 = BAR(42), T43 = BAR(43), T44 = BAR(44);

  // ---------- the set (world = screen at zoom 1) ----------
  const CX = 800, SEAT = 826, U = 28, FLOORY = 880;                       // Clawd's seat: x of the middle, y of the cushion, body unit
  const WIN = { x0: 1090, y0: 140, x1: 1790, y1: 650 }, FR = 28, MH = 395;   // the glass and the frame; MH = the cross bar
  const PW = (WIN.x1 - WIN.x0 - 32) / 3, MV = [WIN.x0 + PW + 8, WIN.x0 + 2 * PW + 24];   // pane width, the two mullion centres
  const LAMP = { x: 430, y: 410, r: 66 };                                   // the floor lamp's globe
  const STAR = [WIN.x0 + PW / 2, 255];                                      // the first star, high in the left pane
  const CAT_X = 1215, SILL = 650;                                           // the cat's spot on the sill
  const BOOK = [CX + 235, 676];                                             // the book's spine, on the chair's right arm
  const LEAF = { x: 1075, y: 618, s: 40, r: .35 };                          // where the red leaf dries, leaning on the glass

  // time of day for tn(): how grey (rain), how golden, how dark (dusk) the colours read
  let ENV = { dusk: 0, wet: 0, gold: 0 };
  const tn = c => {
    let r = c;
    if (ENV.wet) r = mixCol(r, '#7C86A0', .5 * ENV.wet);
    if (ENV.gold) r = mixCol(r, '#FFD98A', .22 * ENV.gold);
    if (ENV.dusk) r = mixCol(r, '#232B75', .85 * ENV.dusk);
    return r;
  };
  // a colour for the view outside: rain grey, golden break, or night
  const mc = (a, b, c, o) => mixCol(mixCol(a, b, o.gold || 0), c, o.night || 0);
  const sm = (t, a, b) => ease(seg(t, a, b));

  // ======================================================================================================
  // outside: the view through the glass
  // ======================================================================================================
  function skyLite(a, b, k, box) {   // the library's sky(), in four soft bands instead of eleven: same colours, a third of the paint
    const A = SKIES[a].map((c, i) => mixCol(c, SKIES[b][i], clamp(k)));
    boilSeed(box.key); paint(rectPts(box.x0, box.y0, box.w, box.h), { wash: A[0], ink: null });
    for (let i = 1; i < 4; i++) {
      const yy = box.y0 + box.h * i / 4, soft = box.h / 8;
      boilSeed(box.key + i); paint(rectPts(box.x0 - 40, yy - soft, box.w + 80, box.y0 + box.h - yy + soft + 40), { fill: A[i], fillOp: 235, bleed: .35, tex: .15, border: .25, ink: null });
    }
  }
  function ridge(y, amp, seed, key, col) {
    const x0 = WIN.x0 - 40, x1 = WIN.x1 + 40, n = 9, P = [[x1, y + 400], [x0, y + 400]];
    for (let i = 0; i <= n; i++) P.push([lerp(x0, x1, i / n), y - amp * (.35 + .65 * Math.abs(Math.sin(i * 1.7 + seed)))]);
    boilSeed(key);
    paint(P, { wash: col, fill: col, fillOp: 40, bleed: .05, tex: .35, border: .15, ink: null, curv: .5 });
  }
  function orchard(o) {
    const gx = WIN.x0, gw = WIN.x1 - WIN.x0;
    const crown = [mc('#8A9890', '#C2A04C', '#1B2252', o), mc('#7C8A84', '#B08A3E', '#161C48', o)], trunk = mc('#59606A', '#6B4A30', '#141A40', o);
    [[455, 14, 8], [500, 20, 6], [560, 29, 4]].forEach(([y, s, n], ri) => {
      for (let i = 0; i < n; i++) {
        const x = gx + (i + .2 + .6 * hash(i * 3.1 + ri * 17)) * gw / n, ss = s * lerp(.85, 1.15, hash(i + ri * 5));
        boilSeed('Cor' + ri + '_' + i);
        inkLine([[x, y], [x + 1, y - ss * 1.3]], .3 + ss * .012, trunk, 'inkfine', 0);
        paint(ellPts(x - ss * .25, y - ss * 1.8, ss * 1.05, ss * .85, 12, ss * .04), { wash: crown[ri % 2], ink: null });
        if (ri > 1) paint(ellPts(x + ss * .5, y - ss * 1.5, ss * .8, ss * .7, 12, ss * .04), { wash: crown[(ri + 1) % 2], ink: null });
      }
    });
  }
  // a ray of gold through a gap in the cloud: soft wedges and a glow at the break
  function rays(t, g) {
    if (g <= 0) return;
    const S = [WIN.x0 + 190, WIN.y0 - 30], by = WIN.y1;
    glow(S[0], S[1] + 40, 330, '#FFE3A0', .95 * g);
    for (let i = 0; i < 3; i++) {
      const sway = 18 * Math.sin(t * .5 + i * 2);
      boilSeed('Cray' + i);
      paint([[S[0] - 24 + 20 * i, S[1]], [S[0] + 34 + 20 * i, S[1]], [S[0] + 330 + 170 * i + sway, by], [S[0] + 90 + 170 * i + sway, by]], { fill: '#FFF0B8', fillOp: 150 * g, bleed: .3, tex: .2, border: .1, ink: null });
    }
    glow(WIN.x0 + 420, 470, 260, '#FFD98A', .5 * g);   // the orchard catches it
  }
  function starAt(t, k) {
    if (k <= 0) return;
    const [x, y] = STAR, p = backOut(k), tw = 1 + .22 * Math.sin(t * 6.3) + .1 * Math.sin(t * 11.1 + 1), r = 16 * p * tw;
    glow(x, y, 150 * p, '#BFD0FF', .75 * k);
    glow(x, y, 60 * p * tw, '#FFF1C2', .9 * k);
    boilSeed('Cstar');
    paint(starPts(x, y, r * 1.5, .2, 4, -Math.PI / 2 + .05 * Math.sin(t * 2)), { wash: FALL.star, ink: null });
    paint(ellPts(x, y, r * .45, r * .45, 10), { wash: '#FFFFFF', ink: null });
    // a long twinkle across the star, now and then
    const tk = Math.max(0, Math.sin(t * 2.1) ** 6), L = r * (2.6 + 2.2 * tk);
    inkLine([[x - L, y], [x + L, y]], .9, FALL.star, 'inkfine', 0);
    inkLine([[x, y - L], [x, y + L]], .9, FALL.star, 'inkfine', 0);
  }
  function outside(t, o) {
    const gx = WIN.x0, gy = WIN.y0, gw = WIN.x1 - WIN.x0, gh = WIN.y1 - WIN.y0, g = o.gold || 0;
    const box = { x0: gx, y0: gy, w: gw, h: gh, key: 'Csky' };
    if (o.dusk != null) skyLite('dusk', 'night', o.dusk, box);
    else {
      skyLite('rain', 'gold', g * .85, box);
      clouds(t, { key: 'Ccl', y: gy + 70, n: 3, x0: gx, x1: gx + gw, spread: 70, scale: .8, speed: 6, col: mixCol('#6E7787', '#F2D9A0', g), op: 150, seed: 6 });
    }
    ridge(430, 38, 1, 'Cr1', mc('#8F99AA', '#D9B476', '#222A5A', o));
    ridge(478, 30, 3, 'Cr2', mc('#7C8896', '#C5A060', '#1B2250', o));
    orchard(o);
    boilSeed('Cgrass');
    paint([[gx - 40, gy + gh + 40], [gx - 40, 586], [gx + gw * .3, 574], [gx + gw * .7, 592], [gx + gw + 40, 580], [gx + gw + 40, gy + gh + 40]], { wash: mc('#6C7A6E', '#9C8A44', '#121838', o), fill: mc('#5C6A60', '#7C6C34', '#0E1330', o), fillOp: 60, bleed: .05, tex: .5, ink: null, curv: .3 });
    rays(t, g);
    if (o.rain > 0) rain(t, { key: 'Cwrain', x0: gx, y0: gy - 60, w: gw, h: gh + 120, n: 130, k: o.rain, len: 44, wind: .12, speed: 850, col: mixCol('#B9C6D6', '#F2E2B0', g * .6), seed: 41 });
    if (o.leaf) o.leaf();
    if (o.star > 0) starAt(t, o.star);
  }

  // ---------- rain on the glass: drops that sit, then slide, as pure functions of t ----------
  function glassDrop(x, y0, y1, p, r, key, trail = .6) {   // one drop part-way (p 0..1) along its run
    const y = lerp(y0, y1, p);
    boilSeed(key);
    if (y - y0 > 3) inkLine([[x, y0], [x + 2.5 * Math.sin(y * .05), (y0 + y) / 2], [x, y - r]], trail, '#DCE6F2', 'inkfine', .5);
    paint(ellPts(x, y, r * .78, r * 1.15, 10), { wash: '#C8D4E2', washOp: 150, ink: '#F2F6FA', sw: .55 });
    if (r > 4.5) paint(ellPts(x - r * .25, y - r * .35, r * .22, r * .3, 6), { wash: '#FFFFFF', ink: null });
  }
  function glassRain(t, k) {
    const n = Math.round(22 * clamp(k)), gx0 = WIN.x0 + 14, gw = WIN.x1 - WIN.x0 - 28, gy0 = WIN.y0 + 10, gh = WIN.y1 - WIN.y0 - 30;
    for (let i = 0; i < n; i++) {
      const per = lerp(3.4, 7.5, hash(i * 3 + 1)) / (.55 + .6 * clamp(k)), t0 = t + hash(i * 5 + 2) * per, cyc = Math.floor(t0 / per), a = frac(t0 / per);
      const h = j => hash(i * 17 + cyc * 3.1 + j);
      const x = gx0 + h(1) * gw, y0 = gy0 + h(2) * gh * .6, run = 70 + 170 * h(3), r = 3 + 3.2 * h(4), a0 = .3 + .25 * h(5), a1 = a0 + .3;
      const p = easeOut(seg(a, a0, a1)) * .7 + .3 * ease(seg(a, a0, a1)), fade = seg(a, 0, .08) * (1 - seg(a, .9, 1));
      if (fade < .5) continue;
      glassDrop(x, y0, y0 + run, p, r, 'Cgd' + i);
    }
  }
  // the two racers of bar 26: [x, top, bottom, start, end, radius]
  const RACERS = [[1248, 175, 545, T26 + .25, T26 + 1.75, 8.5], [1212, 200, 548, T26 + .5, T26 + 2.0, 6]];   // the first ends under the cat's paw
  const racerP = (t, [, , , s, e]) => { const q = clamp((t - s) / (e - s)); return clamp(q * q * (2.2 - 1.2 * q) + .03 * Math.sin(q * 25) * (1 - q)); };
  const racerPos = (t, R) => [R[0] + 7 * Math.sin(racerP(t, R) * 9), lerp(R[1], R[2], racerP(t, R))];
  function racers(t) {
    RACERS.forEach((R, i) => {
      if (t < R[3] - .05 || t > R[4] + .5) return;
      const p = racerP(t, R), swat = i === 0 && t > R[4] + .05;
      if (!swat) glassDrop(racerPos(t, R)[0], R[1], R[2], p, R[5], 'Crace' + i, 1);
    });
    // the swat: the first drop bursts into a few beads that skitter down the pane
    const R = RACERS[0], th = R[4] + .05, k = t - th;
    if (k > 0 && k < .45) {
      const [x0, y0] = racerPos(R[4], R);
      for (let i = 0; i < 4; i++) {
        const a = -Math.PI * (.1 + .8 * hash(i * 3 + 5)), v = 90 + 120 * hash(i * 7 + 2);
        boilSeed('Csplat' + i);
        const px = x0 + Math.cos(a) * v * k, py = y0 + Math.sin(a) * v * k + 520 * k * k;
        paint(ellPts(px, py, 3.2 * (1 - k), 4.2 * (1 - k), 8), { wash: '#C8D4E2', washOp: 170, ink: '#F2F6FA', sw: .4 });
      }
    }
  }

  // ======================================================================================================
  // the room
  // ======================================================================================================
  function wall() {
    const x0 = -900, x1 = 2800, y0 = -1300, ax = WIN.x0 - FR, bx = WIN.x1 + FR, ay = WIN.y0 - FR, by = WIN.y1;
    const wc = tn(FALL.wall), wd = tn(FALL.wallDk);
    const piece = (key, x, y, w, h) => { boilSeed(key); paint(rectPts(x, y, w, h), { wash: wc, fill: wd, fillOp: 75, bleed: .06, tex: .55, border: .2, ink: null }); };
    piece('Cwt', x0, y0, x1 - x0, ay - y0); piece('Cwl', x0, ay, ax - x0, FLOORY - ay);
    piece('Cwr', bx, ay, x1 - bx, FLOORY - ay); piece('Cwb', ax, by, bx - ax, FLOORY - by);
    // wainscot and baseboard
    boilSeed('Cwain');
    paint(rectPts(x0, 700, x1 - x0, FLOORY - 700), { wash: tn(FALL.wood), fill: tn(FALL.woodDk), fillOp: 60, bleed: .04, tex: .6, border: .2, ink: null });
    boilSeed('Cwrail'); inkLine([[x0, 700], [x1, 700]], 2.4, tn(FALL.woodDk), 'ink', 0);
    boilSeed('Cwgroove');
    for (let x = 100; x < 2000; x += 170) inkLine([[x, 722], [x, FLOORY - 24]], .8, tn(FALL.woodDk), 'dry', 0);
    boilSeed('Cbase'); paint(rectPts(x0, FLOORY - 22, x1 - x0, 22), { wash: tn(FALL.woodDk), ink: PAL.ink, sw: 1.2 });
  }
  function floor() {
    boilSeed('Cfloor');
    paint(rectPts(-900, FLOORY, 3700, 700), { wash: tn(mixCol(FALL.wood, FALL.woodDk, .35)), fill: tn(FALL.woodDk), fillOp: 70, bleed: .04, tex: .6, border: .2, ink: null });
    [[925, 0], [972, 1]].forEach(([y, r]) => {
      boilSeed('Cplank' + r);
      inkLine([[-100, y], [2100, y]], 1.1, tn(FALL.barkDk), 'dry', 0);
      for (let x = 260 + 230 * ((r * .37) % 1); x < 1850; x += 300) inkLine([[x, y], [x + 4, y + 52 + r * 8]], .8, tn(FALL.barkDk), 'dry', 0);
    });
    boilSeed('Crug');   // a round rug under the chair
    const rx = CX + 120, ry = 985;
    paint(ellPts(rx, ry, 800, 86, 40, 2), { wash: tn(FALL.rust), fill: tn(FALL.crimson), fillOp: 70, bleed: .06, tex: .6, ink: PAL.ink, sw: 1.2 });
    paint(ellPts(rx, ry, 740, 74, 40, 2), { wash: tn(FALL.amber), fill: tn(FALL.gold), fillOp: 60, bleed: .06, tex: .5, ink: tn(FALL.rust), sw: 1 });
    paint(ellPts(rx, ry, 660, 62, 40, 2), { wash: tn(FALL.rust), ink: tn(FALL.crimson), sw: .9 });
  }
  // the framed little painting on the left wall: an autumn tree
  function picture() {
    const x = 610, y = 175, w = 150, h = 190;
    boilSeed('Cpic');
    paint(rectPts(x, y, w, h, 1), { wash: tn(FALL.woodDk), ink: PAL.ink, sw: 1.2 });
    paint(rectPts(x + 12, y + 12, w - 24, h - 24), { wash: tn('#E6CF9A'), fill: tn('#F0DBA8'), fillOp: 80, ink: PAL.ink, sw: .6 });
    paint(through([[x + 12, y + h - 52], [x + 70, y + h - 70], [x + w - 12, y + h - 50], [x + w - 12, y + h - 12], [x + 12, y + h - 12]], 4), { wash: tn(FALL.olive), ink: null });
    inkLine([[x + 78, y + h - 40], [x + 76, y + h - 96]], 4, tn(FALL.barkDk), 'ink', 0);
    paint(ellPts(x + 76, y + h - 112, 30, 26, 14, 1.5), { wash: tn(FALL.maple), ink: null });
    paint(ellPts(x + 60, y + h - 100, 18, 15, 12, 1), { wash: tn(FALL.amber), ink: null });
  }
  function lamp(t, on, pool) {   // a floor lamp with a round paper globe. Glows first, so the disc sits on its own light.
    const { x, y, r } = LAMP, fl = 1 + .015 * Math.sin(t * 2.3);
    boilSeed('Clamp base'); paint(ellPts(x, FLOORY - 4, 56, 12, 20, 1), { wash: tn(FALL.woodDk), ink: PAL.ink, sw: 1 });
    boilSeed('Clamp pole'); paint(ribbon([[x, FLOORY - 8], [x + 3, FLOORY - 230], [x, y + r]], 11, 8), { wash: tn('#8A6A3A'), ink: PAL.ink, sw: .9 });
    boilSeed('Clamp halo');
    paint(ellPts(x, y, r * 3.2, r * 3, 30, r * .08), { fill: '#F4A052', fillOp: 70 * on, bleed: .35, tex: .25, border: .2, ink: null });
    glow(x, y, r * (7 + 4 * pool) * fl, '#FF9A4E', .8 * pool); glow(x, y, r * 4.5, '#FFB066', .5 * pool); glow(x, y, r * 2.4, '#FFD49A', .55 * on);
    boilSeed('Clamp collar'); paint(rrPts(x - 20, y + r - 8, 40, 16, 5), { wash: '#B08A4A', ink: PAL.ink, sw: .9 });
    boilSeed('Clamp globe');
    paint(ellPts(x, y, r * 1.05, r * 1.05, 44, r * .012), { wash: mixCol('#C8A878', '#FFCF7E', on), ink: null });
    paint(ellPts(x, y, r, r, 44, r * .012), { wash: mixCol('#D8C8A8', '#FFF3D4', on), ink: null });
    boilSeed('Clamp cap'); paint(rrPts(x - 14, y - r - 7, 28, 12, 4), { wash: '#B08A4A', ink: PAL.ink, sw: .9 });
  }

  // the armchair: back, seat, arms. Drawn before Clawd, so his arms rest on top of the rolls.
  function chair() {
    const c = tn(FALL.moss), cd = tn(mixCol(FALL.moss, FALL.barkDk, .45)), cl = tn(FALL.sage);
    boilSeed('Cch back');
    paint(rrPts(CX - 255, 430, 510, 420, 100), { wash: c, fill: cd, fillOp: 80, bleed: .06, tex: .7, border: .3, ink: PAL.ink, sw: 1.5 });
    paint(rrPts(CX - 195, 480, 390, 340, 70), { wash: tn(mixCol(FALL.moss, FALL.olive, .4)), fill: cd, fillOp: 55, bleed: .05, tex: .6, border: .3, ink: cd, sw: .8 });
    boilSeed('Cch buttons');
    for (const [bx, by] of [[-110, 560], [0, 540], [110, 560], [-60, 640], [60, 640]]) paint(ellPts(CX + bx, by, 7, 6, 8), { wash: cd, ink: PAL.ink, sw: .6 });
    boilSeed('Cch feet');   // wooden feet
    for (const fx of [-220, 200]) paint(rectPts(CX + fx, 872, 26, 48), { wash: tn(FALL.woodDk), ink: PAL.ink, sw: 1 });
    boilSeed('Cch seat'); paint(rrPts(CX - 250, SEAT - 6, 500, 76, 30), { wash: tn(mixCol(FALL.moss, FALL.amber, .25)), fill: cd, fillOp: 70, bleed: .05, tex: .6, ink: PAL.ink, sw: 1.5 });
    inkLine([[CX - 230, SEAT + 52], [CX + 230, SEAT + 52]], 1, cd, 'dry', 0);
    for (const [sx, k] of [[-1, 'L'], [1, 'R']]) {   // arm rolls
      boilSeed('Cch arm' + k);
      paint(rrPts(sx < 0 ? CX - 300 : CX + 190, 692, 110, 178, 46), { wash: c, fill: cd, fillOp: 80, bleed: .06, tex: .7, border: .3, ink: PAL.ink, sw: 1.5 });
      paint(ellPts(sx < 0 ? CX - 245 : CX + 245, 700, 52, 14, 16), { wash: cl, ink: PAL.ink, sw: .8 });
    }
  }
  // an open book standing on the chair's right arm; fold 0 = open, 1 = shut over whatever lies on the left page
  function book(t, fold, leafOn) {
    const [bx, by] = BOOK, cover = tn(FALL.plum), page = mixCol(tn('#F1E4C6'), '#F1E4C6', .4), pd = mixCol(tn('#D9C79E'), '#D9C79E', .4);
    const sp = Math.sin(fold * Math.PI), w = Math.cos(fold * Math.PI), x1 = lerp(bx + 62, bx + 2, ease(fold));
    boilSeed('Cbook cover'); paint([[bx - 62, by - 36], [x1, by - 36], [x1 + 3, by + 34], [bx - 65, by + 34]], { wash: cover, ink: PAL.ink, sw: .9 });
    boilSeed('Cbook L'); paint([[bx - 58, by - 31], [bx, by - 35], [bx, by + 27], [bx - 58, by + 29]], { wash: page, fill: pd, fillOp: 60, tex: .4, ink: PAL.ink, sw: .6 });
    if (leafOn) { boilSeed('Cbookleaf'); redLeaf(bx - 28, by - 2, 32, .3, {}); }
    const px = bx + 58 * w;   // the right page, hinged at the spine: past the half-way point it lies on the left page as a cover
    boilSeed('Cbook R');
    paint([[bx, by - 35], [px, by - 31 - 3 * sp], [px, by + 29 - 5 * sp], [bx, by + 27]], { wash: w >= 0 ? page : cover, fill: w >= 0 ? pd : tn(FALL.plum), fillOp: 55, tex: .4, ink: PAL.ink, sw: .6 });
    boilSeed('Cbook spine'); inkLine([[bx, by - 35], [bx, by + 27]], 1.3, PAL.ink, 'ink', 0);
    if (fold > .9) { boilSeed('Cbook tip'); paint([[bx - 44, by + 34], [bx - 30, by + 34], [bx - 37, by + 45]], { wash: FALL.maple, ink: PAL.ink, sw: .5 }); }   // the leaf's tip pokes out
  }
  function basketOnFloor() { basket(1170, 946, 22, { apples: 5, key: 'Cbasket' }); }

  // the sill, the frame and the mullions
  function windowFrame() {
    const fc = tn('#EBDDBE'), fd = tn('#C9B48A'), ink = mixCol(PAL.ink, '#8A7660', .45);
    const bar = (key, x, y, w, h) => { boilSeed(key); paint(rectPts(x, y, w, h), { wash: fc, fill: fd, fillOp: 70, bleed: .04, tex: .5, ink, sw: .75 }); };
    bar('Cfr t', WIN.x0 - FR, WIN.y0 - FR, WIN.x1 - WIN.x0 + 2 * FR, FR);
    bar('Cfr l', WIN.x0 - FR, WIN.y0 - FR, FR, WIN.y1 - WIN.y0 + FR); bar('Cfr r', WIN.x1, WIN.y0 - FR, FR, WIN.y1 - WIN.y0 + FR);
    for (let i = 0; i < 2; i++) bar('Cmv' + i, MV[i] - 8, WIN.y0, 16, WIN.y1 - WIN.y0);
    bar('Cmh', WIN.x0, MH - 8, WIN.x1 - WIN.x0, 16);
    boilSeed('Csill top'); paint([[WIN.x0 - 44, SILL - 2], [WIN.x1 + 44, SILL - 2], [WIN.x1 + 56, SILL + 24], [WIN.x0 - 56, SILL + 24]], { wash: tn(mixCol(FALL.wood, '#E8C9A0', .35)), fill: tn(FALL.woodDk), fillOp: 45, bleed: .04, tex: .5, ink: PAL.ink, sw: 1.2 });
    boilSeed('Csill lip'); paint(rectPts(WIN.x0 - 56, SILL + 24, WIN.x1 - WIN.x0 + 112, 26), { wash: tn(FALL.wood), fill: tn(FALL.woodDk), fillOp: 70, tex: .6, ink: PAL.ink, sw: 1.2 });
  }
  function towel() {   // the folded towel the cat sits on
    boilSeed('Ctowel');
    paint(rrPts(CAT_X - 104, SILL - 20, 208, 24, 8), { wash: tn('#EFE3C6'), fill: tn('#D2C39B'), fillOp: 60, tex: .6, ink: PAL.ink, sw: .8 });
    boilSeed('Ctowel stripes');
    for (const dy of [-14, -7]) inkLine([[CAT_X - 98, SILL + dy], [CAT_X + 98, SILL + dy]], 1.2, tn(FALL.blanket), 'inkfine', 0);
  }
  function pumpkin(t) {   // a jack-o'-lantern whose candle flickers
    const px = WIN.x1 - PW / 2 - 10, py = SILL - 2, fl = .75 + .25 * Math.sin(t * 13) * Math.sin(t * 5.3) + .12 * Math.sin(t * 29 + 1);
    const lit = clamp(fl, .35, 1);
    glow(px, py - 52, 240, '#FF9A3E', .8 * lit);
    boilSeed('Cpump stem'); paint(rectPts(px - 7, py - 118, 14, 24), { wash: tn(FALL.stem), ink: PAL.ink, sw: .9 });
    boilSeed('Cpump body');
    paint(ellPts(px, py - 52, 78, 60, 26, 1.5), { wash: tn(FALL.pumpkin), fill: tn(FALL.pumpkinDk), fillOp: 90, bleed: .08, tex: .6, ink: PAL.ink, sw: 1.4 });
    boilSeed('Cpump ribs');
    for (const dx of [-44, -18, 18, 44]) inkLine([[px + dx * .8, py - 105], [px + dx * 1.1, py - 52], [px + dx * .8, py + 1]], 1, tn(FALL.pumpkinDk), 'inkfine', .6);
    boilSeed('Cpump face');
    const gc = mixCol('#FF9A3E', '#FFE08A', lit);
    paint([[px - 44, py - 70], [px - 22, py - 70], [px - 33, py - 92]], { wash: gc, ink: PAL.ink, sw: .9 });
    paint([[px + 22, py - 70], [px + 44, py - 70], [px + 33, py - 92]], { wash: gc, ink: PAL.ink, sw: .9 });
    paint([[px - 8, py - 62], [px + 8, py - 62], [px, py - 74]], { wash: gc, ink: PAL.ink, sw: .8 });
    paint([[px - 46, py - 46], [px - 28, py - 52], [px - 14, py - 42], [px, py - 52], [px + 14, py - 42], [px + 28, py - 52], [px + 46, py - 46], [px + 34, py - 24], [px + 12, py - 30], [px, py - 20], [px - 12, py - 30], [px - 34, py - 24]], { wash: gc, ink: PAL.ink, sw: .9 });
  }

  // ------------------------------------------------------------------------------------------------------
  // room(t, o): the whole set, back to front, up to (not including) the people. o: {rain (streaks outside), glassRain (drops on
  // the pane), races, gold (the break in the clouds), dusk (0 dusk .. 1 night, switches the view to evening), lamp, flood (window
  // light), cool (daylight spill), star, leaf (a callback for something drifting outside), env: {wet, gold, dusk} (room tones)}
  // ------------------------------------------------------------------------------------------------------
  function room(t, o) {
    ENV = { dusk: o.env?.dusk || 0, wet: o.env?.wet || 0, gold: o.env?.gold || 0 };
    outside(t, o);
    if (o.glassRain > 0) glassRain(t, o.glassRain);
    if (o.races) racers(t);
    wall();
    windowFrame();
    if (o.cool > 0) glow(WIN.x0 + 330, 420, 760, '#8FA6D0', o.cool);   // cool daylight (rain) or moonlight (night) spilling in
    if (o.flood > 0) glow(WIN.x0 + 330, 400, 900, '#FFD98A', o.flood); // the gold of the break
    floor();
    picture();
    if (o.gold > 0) {   // the gold falls across the floor in front of the window
      boilSeed('Cpatch');
      paint([[WIN.x0 + 20, SILL + 56], [WIN.x0 + 270, SILL + 56], [WIN.x0 + 90, FLOORY + 120], [WIN.x0 - 230, FLOORY + 120]], { fill: '#FFEBB0', fillOp: 110 * o.gold, bleed: .3, tex: .2, border: .1, ink: null });
    }
    lamp(t, o.lamp, o.pool ?? o.lamp);
    basketOnFloor();
    chair();
  }

  // ======================================================================================================
  // the people
  // ======================================================================================================
  function withClawd(x, G, u, o, fn) {   // run fn in clawd()'s own transform, so a drape moves with him
    push(); translate(x + (o.dx || 0) * u, G + (o.dy || 0) * u); if (o.rot) rotate(o.rot);
    const sq = o.sq || 0; scale(1 + sq * .6, 1 - sq); fn(); pop();
  }
  const bl = () => tn(FALL.blanket), blLt = () => tn(FALL.blanketLt);
  function blanketBack(x, G, u, o) {   // the shawl behind him, so he reads as wrapped
    withClawd(x, G, u, o, () => {
      boilSeed('Cblb');
      const P = [[-6.1, .4], [-6.4, -3], [-6, -6], [-4.7, -7.5], [-2.5, -7.6], [2.5, -7.6], [4.7, -7.5], [6, -6], [6.4, -3], [6.1, .4]];
      paint(through(P.map(([a, b]) => [a * u, b * u]), 5), { wash: mixCol(bl(), PAL.ink, .12), fill: tn(FALL.crimson), fillOp: 90, bleed: .05, tex: .6, ink: PAL.ink, sw: 1.2 });
    });
  }
  function blanketFront(t, u, sw) {   // body-local: the front wrap, with stripes and a fringe
    const br = .04 * Math.sin(t * 1.9);
    boilSeed('Cblf');
    const P = [[-5.8, .8], [-6.1, -1.6], [-5.7, -3.4], [-4.3, -4.0 + br], [-2.4, -3.5], [-.3, -3.95 + br], [2.2, -3.45], [4.1, -4.0], [5.7, -3.4], [6.1, -1.5], [5.8, .8]];
    paint(through(P.map(([a, b]) => [a * u, b * u]), 5), { wash: bl(), fill: tn(FALL.crimson), fillOp: 80, bleed: .05, tex: .65, ink: PAL.ink, sw: sw * 1.1 });
    boilSeed('Cblf stripes');
    for (const [y, c] of [[-.2, blLt()], [-1.0, tn(PAL.cream)]]) paint(rectPts(-5.7 * u, y * u, 11.4 * u, .5 * u, 0), { wash: c, washOp: 235, ink: null });
    boilSeed('Cblf fringe');
    for (let i = 0; i < 13; i++) inkLine([[(-5.4 + i * .9) * u, .8 * u], [(-5.4 + i * .9 + .05) * u, 1.25 * u]], sw * .6, blLt(), 'inkfine', 0);
    boilSeed('Cblf fold'); inkLine([[-4.8 * u, -3.3 * u], [-2 * u, -1.9 * u], [1.5 * u, -1.6 * u]], sw * .6, tn(FALL.crimson), 'dry', .6);
  }
  function mugRig(t, u, sip, steamK = 1) {   // the cocoa mug in the lap, or lifted to the mouth (sip 0..1); the blanket wraps the hands
    const s = u * .95, bx = lerp(4.7, 1.45, sip) * u, by = lerp(-.7, -1.7, sip) * u, tilt = -.42 * sip;
    push(); translate(bx, by); rotate(tilt);
    mug(0, 0, s, { key: 'Cmug' });
    boilSeed('Cmug cuffs');
    for (const dx of [-1.55, 1.15]) paint(ellPts(dx * s, -.75 * s, .62 * s, .78 * s, 12, s * .03), { wash: bl(), fill: tn(FALL.crimson), fillOp: 70, ink: PAL.ink, sw: .9 });
    pop();
    steam(t, bx + 3.4 * s * Math.sin(tilt), by - 3.4 * s * Math.cos(tilt), u * .9, { k: steamK * (1 - sip), key: 'Csteam' });   // upright, from the rim, and gone while he drinks
  }
  // Clawd in the armchair. B: { sip, steam, armR (a hook for something held in the right hand) }
  function clawdSeated(t, o, B = {}) {
    const op = { ...o, hat: 'beanie', boilKey: 'C', draw: (u, sw) => { blanketFront(t, u, sw); mugRig(t, u, B.sip || 0, B.steam ?? 1); }, armR: B.armR };
    blanketBack(CX, SEAT, U, op);
    clawd(CX, SEAT, U, op);
  }

  // ======================================================================================================
  // C1: rainy afternoon
  // ======================================================================================================
  const c1Rain = t => lerp(.3, .55, sm(t, T25, T26)) + .45 * sm(t, T26, T27 + 1) - .85 * sm(t, T28 + .1, T28 + 2.6);   // swells through bars 26-27, thins in 28
  const c1Gold = t => sm(t, T28 + .1, T28 + 2.8);
  const cam1 = t => {
    const k = sm(t, T25, T28), k2 = sm(t, T28 - .15, T29 - .25);
    return { x: lerp(lerp(1050, 1070, k), 1150, k2), y: lerp(lerp(525, 515, k), 470, k2), z: lerp(lerp(1.26, 1.32, k), 1.5, k2) };
  };
  const sipC1 = t => kf(t, [[AT(25, 2.39), 0], [AT(25, 3.19), 1], [AT(25, 4.12), 1], [AT(25, 4.82), 0], [AT(27, 2.27), 0], [AT(27, 2.97), .8], [AT(27, 3.67), .8], [AT(27, 4.36), 0]], ease);

  function moodC1(t) {
    return emotions(t, [
      [T25 - 1, 'nervous', { emote: null, lookX: .4, lookY: .2 }],        // still shivering from the rain
      [AT(25, 2.33), 'relieved', { emote: null, blush: .75 }],                    // the first sip: eyes close
      [AT(25, 4.47), 'happy', { blush: .7, emote: null }],                         // warm, blushing
      [T26 + 1.95, 'laugh', { blush: .6 }],                                // a take after the cat's swat
      [T27 + .15, 'happy', { blush: .5, emote: null }],
      [AT(27, 2.15), 'relieved', { blush: .6, emote: null }],                      // a second, smaller sip while the rain drums
      [AT(27, 4.36), 'happy', { blush: .5, emote: null }],
      [T28 + .5, 'hopeful', { blush: .4 }]                                 // the light breaks
    ]);
  }
  function poseC1(t) {
    const m = moodC1(t), sip = sipC1(t);
    const look = t > T28 + .4 ? { lookX: .35, lookY: -.9 } : t > T26 + .4 && t < T26 + 1.9 ? { lookX: .8, lookY: -.05 } : t > AT(27, 4.36) && t < T28 + .4 ? { lookX: .6, lookY: -.2 } : {};
    return { o: { ...m, ...look, aL: lerp(m.aL ?? .2, .7, sip), aR: lerp(m.aR ?? .2, .7, sip), dx: (m.dx || 0) + sip * .15 }, sip };
  }

  // the cat on the sill in C1 (side view, facing right): doze, wake to the race, wind up, rear up and paw at the glass, flop back
  function catC1(t) {
    const s = 27, x = CAT_X, y = SILL - 2, tw = .5 * Math.sin(t * 1.6) * Math.sin(t * .7);
    const tCr = T26 + .9, tR = T26 + 1.45, tRise = tR + .24, tDn = T26 + 2.15, tUp = T26 + 2.5, fluff = { sx: 1.06, sy: 1.05, boilKey: 'c1' };
    if (t < tCr) {   // dozing loaf: half-lidded, a slow tail flick; the race wakes it
      const wake = sm(t, T26 + .2, T26 + .6);
      return { x, y, s, o: { pose: 'loaf', eyes: wake > .5 ? 'wide' : 'half', pupil: .2 + .7 * wake, tail: tw, ears: wake, look: [.9 * wake, lerp(-.8, .6, sm(t, T26 + .3, T26 + 1.6))], ...fluff } };
    }
    if (t < tR) return { x, y, s, o: { pose: 'crouch', eyes: 'wide', pupil: 1, ears: 1, tail: .7 * Math.sin((t - T26) * 22), look: [.9, .5], rot: .03 * Math.sin((t - T26) * 26), ...fluff } };   // the wind-up, butt wiggle
    if (t < tDn) {   // up on the hind legs, paddling at the glass
      const k = t - tR, up = backOut(seg(t, tR, tRise));
      return { x: x + 8 * up, y, s, o: { pose: 'walk', walk: k * 2.4, rot: -1.05 * up + .07 * Math.sin(k * 15) * seg(t, tRise, tRise + .1), dy: -2.1 * up, eyes: 'wide', pupil: 1, ears: 1, tail: .5 * Math.sin(k * 11), look: [1, -.3], ...fluff } };
    }
    if (t < tUp) {   // drops back down
      const k = ease(seg(t, tDn, tUp));
      return { x: x + 8 * (1 - k), y, s, o: { pose: 'crouch', rot: -1.05 * (1 - k), dy: -2.1 * (1 - k), eyes: 'wide', pupil: .8, ears: .6, tail: .4, look: [1 - k, 0], ...fluff } };
    }
    const flop = Math.exp(-(t - tUp) * 9), up = t > T28 + .45;   // flops into a loaf, tail up and pleased, then (bar 28) stands to look at the light
    return { x, y, s, o: { pose: up ? 'walk' : 'loaf', walk: 0, eyes: up ? 'wide' : t < T28 ? (t > T27 ? 'half' : 'open') : 'open', pupil: up ? .9 : .35, ears: up ? 1 : t > T26 + 4 && t < T28 ? -.35 : .2, tail: tw, tailUp: up ? 1 : 0,
      look: up ? [.55, -1] : [0, 0], sx: 1.06, sy: 1.05 - (up ? 0 : .22 * flop * Math.cos((t - tUp) * 20)), boilKey: 'c1' } };
  }

  function shotC1(t, lt) {
    const C = cam1(t), g = c1Gold(t), rk = clamp(c1Rain(t));
    camBegin(C.x, C.y, C.z);
    room(t, { rain: rk, glassRain: .35 + .65 * rk, races: true, gold: g, lamp: .85, pool: .3, flood: .8 * g, cool: .3 * (1 - g), env: { wet: 1 - .8 * g, gold: g } });
    towel();   // on the sill: the towel, and the red leaf drying
    boilSeed('Cleafshadow'); paint(ellPts(LEAF.x + 4, SILL + 4, 26, 5, 12), { fill: PAL.ink, fillOp: 70, bleed: .2, ink: null });
    boilSeed('Csillleaf'); redLeaf(LEAF.x, LEAF.y, LEAF.s, LEAF.r, {});
    book(t, 0, false);
    const c = catC1(t);
    cat(c.x, c.y, c.s, c.o);
    const P = poseC1(t);
    clawdSeated(t, P.o, { sip: P.sip });
    camEnd();
    if (lt < .3) brushWipe(.5 + .5 * ease(lt / .3), [FALL.woodDk, FALL.wood]);
    if (t > T29 - .7) flash(ease(seg(t, T29 - .7, T29)), '#FFE7A8');
  }

  // ======================================================================================================
  // C2: the same room, at night
  // ======================================================================================================
  const LAMPZ = 150 / LAMP.r, LAMPC = [LAMP.x - 220 / LAMPZ, LAMP.y + 210 / LAMPZ];   // camera that puts the globe at screen (1180, 330), radius 150
  const cam2 = t => {
    const e = sm(t, T39, T39 + 4.6), d = seg(t, T39 + 4.6, T44), up = sm(t, T44 + .2, 176.4);
    const z0 = Math.exp(lerp(Math.log(LAMPZ), Math.log(1.28), e)), x0 = lerp(LAMPC[0], 1050, e), y0 = lerp(LAMPC[1], 525, e);
    return { x: lerp(x0 + 20 * d, 1110, up), y: lerp(y0 - 10 * d, 410, up), z: lerp(z0 * (1 + .05 * d), 1.42, up) };
  };
  const nightK = t => lerp(.15, 1, sm(t, T39, T44));

  // ---- the leaf business of bar 42: Clawd's right hand takes the red leaf from the sill, holds it up, lays it on the book ----
  const stemOf = (c, s, r) => [c[0] - .95 * s * Math.sin(r), c[1] + .95 * s * Math.cos(r)];   // where a leaf's stem ends, held by the stem
  function solveHand(target) {   // the lean (dx, in u) and arm angle that put the right hand's tip on a world point
    let best = null;
    for (let dx = -1.5; dx <= 4; dx += .05) for (let a = -.6; a <= 1.55; a += .025) {
      const p = armPt(CX, SEAT, U, { dx, aR: a }, 'R'), d = Math.hypot(p[0] - target[0], p[1] - target[1]);
      if (!best || d < best.d) best = { dx, aR: a, d };
    }
    return best;
  }
  const PAGE = [BOOK[0] - 28, BOOK[1] - 2];
  const REST = { dx: 0, aR: .2 }, HOLD = { dx: .5, aR: 1.2 };
  const REACH = solveHand(stemOf([LEAF.x, LEAF.y], LEAF.s, LEAF.r)), PLACE = solveHand(stemOf(PAGE, 32, .3));
  const tG = T42, tH = T42 + 1.0, tL = T42 + 2.6, tP = T42 + 3.5, tF = T42 + 3.75, tR = T42 + 4.3;   // grab, held up, lowered, laid down, page flips, hand home
  const mixP = (A, B, k) => ({ dx: lerp(A.dx, B.dx, k), aR: lerp(A.aR, B.aR, k) });
  function hand(t) {
    const w = sm(t, T42 - .8, T42 - .5) * (1 - sm(t, tR, tR + .5)), calm = 1 - seg(t, tL - .4, tL);   // w: how much the leaf business owns the arm
    let p;
    if (t < tG) p = mixP(REST, REACH, ease(seg(t, T42 - .6, tG)));
    else if (t < tH) p = mixP(REACH, HOLD, ease(seg(t, tG, tH)));
    else if (t < tL) p = { dx: HOLD.dx + .1 * calm * Math.sin((t - tH) * 2.2), aR: HOLD.aR + .06 * calm * Math.sin((t - tH) * 3.1) };
    else if (t < tP) p = mixP(HOLD, PLACE, ease(seg(t, tL, tP)));
    else p = mixP(PLACE, REST, ease(seg(t, tP + .1, tR)));
    return { ...p, w };
  }
  const leafRot = t => t < tG ? LEAF.r : t < tH ? lerp(LEAF.r, -.12, ease(seg(t, tG, tH))) : t < tL ? -.12 + .09 * Math.sin((t - tH) * 2.6) * (1 - seg(t, tL - .4, tL)) : lerp(-.12, .3, ease(seg(t, tL, tP)));
  const leafSize = t => t < tL ? LEAF.s : lerp(LEAF.s, 32, ease(seg(t, tL, tP)));
  function leafHook(o, t) {   // the leaf, drawn in the arm's own frame by its stem, so it touches the hand at any lean
    return () => {
      const th = (o.rot || 0) - o.aR, s = leafSize(t), lit = .6 * sm(t, tG + .3, tH) * (1 - sm(t, tL + .3, tP));
      push(); rotate(leafRot(t) - th);
      boilSeed('Chandleaf'); redLeaf(0, -.95 * s, s, 0, { lit });
      pop();
    };
  }

  function lookC2(t) {   // where his eyes go, between the acted changes
    if (t < AT(39, 4.6)) return {};
    if (t < AT(40, 2.35)) return { lookX: .3, lookY: -.1 };
    return { lookX: kf(t, [[AT(40, 2.35), .8], [AT(40, 3), .8], [AT(40, 3.54), 0], [AT(41, 1.53), 0], [AT(41, 3.31), .6], [T42 - .6, .6]]), lookY: kf(t, [[AT(40, 2.35), -.1], [AT(40, 3.54), .8], [AT(41, 1.53), .8], [AT(41, 2.25), -.15]]) };
  }
  function moodC2(t) {
    return emotions(t, [
      [T39 - 1, 'relieved', { emote: null, blush: .5 }],                       // settled in, eyes closed in the lamplight
      [AT(39, 4.32), 'happy', { emote: null, blush: .5 }],                            // the sip
      [AT(40, 2.22), 'hopeful', { emote: null, blush: .5 }],                         // eyes open on the cat crouching on the sill
      [AT(40, 3.41), 'love', { blush: .7 }],                                         // the cat lands in his lap: hearts
      [AT(41, 1.8), 'hopeful', { emote: null, blush: .4 }],                          // a held breath, watching the window
      [T42 - .55, 'thinking', { emote: null, lookX: .9, lookY: .1 }],         // the eyes find the leaf before the arm moves
      [T42 + .7, 'hopeful', { emote: null, lookX: .9, lookY: -.2, blush: .5 }],
      [T42 + 2.7, 'happy', { emote: null, blush: .6 }],
      [T42 + 4.5, 'relieved', { emote: null, blush: .5 }],
      [T43 + .6, 'sleepy', { emote: null, blush: .4 }],                         // the eyelids droop
      [T44 + .25, 'hopeful', { emote: null, lookX: .8, lookY: -.85, blush: .5 }],   // the star
      [T44 + 1.9, 'relieved', { emote: 'zzz', blush: .5 }]                      // a last smile, asleep
    ]);
  }
  const sipC2 = t => kf(t, [[AT(39, 4.87), 0], [AT(40, 1.43), 1], [AT(40, 2.08), 1], [AT(40, 2.49), 0]], ease);

  function poseC2(t) {
    const m = moodC2(t), sip = sipC2(t), h = hand(t), look = lookC2(t);
    const droop = lerp(0, .5, sm(t, T43 + .3, T44 - .2)) * (1 - sm(t, T44, T44 + .3)) + .12 * Math.max(0, Math.sin(t * .9)) * sm(t, T43, T44);
    const aR = lerp(lerp(m.aR ?? .2, .7, sip * 0), h.aR, h.w), dx = lerp(m.dx || 0, h.dx, h.w) + sip * .12;
    const o = { ...m, ...look, squint: Math.max(m.squint || 0, droop), aL: lerp(m.aL ?? .2, .7, sip), aR, dx, tint: m.tint || '#6A6FB8', tintK: m.tint ? m.tintK : .16 };
    return { o, sip, h };
  }

  // the cat: on the sill, hops across to the lap, kneads, curls up
  const LAP = [CX + 6, SEAT - 12];
  function catC2(t) {
    const s = 26, sx = CAT_X, sy = SILL - 2, tc = AT(40, 2.54), tl = AT(40, 3.36), tk = AT(41, 1.18), tz = AT(41, 2.6);
    if (t < tc - .5) return { x: sx, y: sy, s, o: { pose: 'loaf', eyes: 'half', tail: .4 * Math.sin(t * 1.3), sx: 1.06, sy: 1.05, boilKey: 'c2' } };
    if (t < tc) return { x: sx, y: sy, s, o: { pose: 'crouch', flip: true, eyes: 'wide', pupil: .8, ears: 1, tail: .7 * Math.sin(t * 20), rot: .03 * Math.sin(t * 24), sx: 1.06, sy: 1.05, boilKey: 'c2' } };
    if (t < tl) {   // the hop, over the chair arm to the lap
      const k = (t - tc) / (tl - tc), p = arcPt([sx, sy], [LAP[0] + 70, LAP[1]], 48, k);
      return { x: p[0], y: p[1], s, o: { pose: 'pounce', flip: true, rot: .25 * (1 - 2 * k), eyes: 'wide', pupil: 1, ears: 1, tailUp: .5, noShadow: true, boilKey: 'c2' } };
    }
    if (t < tk) { const k = t - tl; return { x: LAP[0] + 70 - 70 * ease(seg(k, 0, .8)), y: LAP[1], s, o: { pose: 'walk', flip: true, walk: k * 1.1, eyes: 'open', ears: .3, tail: .4 * Math.sin(k * 6), noShadow: true, sy: 1 - .04 * Math.abs(Math.sin(k * 7)), boilKey: 'c2' } }; }
    if (t < tz) return { x: LAP[0], y: LAP[1], s, o: { pose: 'loaf', eyes: 'half', ears: -.2, tail: .3 * Math.sin(t * 1.1), noShadow: true, boilKey: 'c2' } };
    return { x: LAP[0], y: LAP[1], s, o: { pose: 'curl', noShadow: true, sy: 1 + .022 * Math.sin(t * 1.4), boilKey: 'c2' } };
  }

  // the last leaf, outside the glass: drifts down and to the left in a lazy zigzag (bar 43)
  function lastLeaf(t) {
    const a = seg(t, T43 + .3, T44 - .5); if (a <= 0 || a >= 1) return;
    const x = lerp(WIN.x1 - 20, WIN.x0 + 40, a) + 40 * Math.sin(a * 9), y = lerp(190, 560, a) + 30 * Math.sin(a * 5 + 1);
    boilSeed('Clast'); glow(x, y, 70, '#FFB35C', .5); leaf(x, y, 36, .6 * Math.sin(a * 7), FALL.amber, { spin: Math.cos(a * 13) });
  }

  function shotC2(t) {
    const C = cam2(t), nk = nightK(t), starK = seg(t, T44, T44 + .7);
    camBegin(C.x, C.y, C.z);
    room(t, { dusk: nk, night: nk, lamp: 1, cool: .22, star: starK, leaf: () => lastLeaf(t), env: { dusk: lerp(.62, .94, nk) } });
    towel();   // on the sill: the towel, the red leaf (until Clawd takes it), the pumpkin
    pumpkin(t);
    if (t < tG) { boilSeed('Cleafshadow'); paint(ellPts(LEAF.x + 4, SILL + 4, 26, 5, 12), { fill: PAL.ink, fillOp: 70, bleed: .2, ink: null }); boilSeed('Csillleaf'); redLeaf(LEAF.x, LEAF.y, LEAF.s, LEAF.r, {}); }
    const fold = sm(t, tF, tF + .55);
    book(t, fold, t >= tP && fold < .5);
    const c = catC2(t), air = t >= AT(40, 2.54) - .02;
    if (!air) cat(c.x, c.y, c.s, c.o);
    const P = poseC2(t);
    clawdSeated(t, P.o, { sip: P.sip, armR: t >= tG && t < tP ? leafHook(P.o, t) : null });
    if (air) cat(c.x, c.y, c.s, c.o);
    const S = toScreen(STAR[0], STAR[1]);
    camEnd();
    // the iris closes on the star: ink, fully shut by 176.4 and still shut at the last frame
    const ik = ease(seg(t, AT(44, 4.06), 176.4));
    if (ik > 0) iris(S[0], S[1], ik >= 1 ? 0 : 1500 * Math.pow(1 - ik, 1.5), PAL.ink);
  }

  shots([[T25, shotC1], [T39, shotC2]]);
})();
