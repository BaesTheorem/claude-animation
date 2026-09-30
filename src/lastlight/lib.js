// lib.js: shared pieces for "Last Light of September" (docs/lastlight/STORYBOARD.md). Owned by the orchestrator:
// chapters call these and never edit them. Every function is a pure function of its arguments (and t where it takes t).
//
// Timing   BAR(n): downbeat of bar n (1..45; 45 is the end of bar 44). AT(bar, beat): any beat, counted from 1, fractional
//          beats allowed: AT(4, 4.5) is the melody's first pickup. Both read PROJECT.beats (the performed tempo map).
// Colour   FALL.* is the film's palette. PAL.ink / PAL.paper / PAL.cream still apply.
// Sky      sky(mood, o) paints a full sky; skyBlend(a, b, k, o) crossfades two moods in RGB (no muddy pigment mixing).
//          Moods: gold, amber, storm, rain, sunset, dusk, night. o: {x0, y0, w, h, key, sun: [x, y], sunR, sunA}.
//          clouds(t, o) drifting cloud banks {y, n, col, op, speed, scale, key, x0, x1, seed}.
// Leaves   leaf(x, y, s, rot, col, o) one maple leaf; redLeaf(x, y, s, rot, o) THE red leaf (the film's motif, one design,
//          o.lit makes the sun shine through it); leafField(t, o) falling leaves; pile(x, y, w, h, o) a heap of leaves.
// Trees    maple(x, y, s, o) an autumn maple, (x, y) = the foot of the trunk, s ≈ Clawd's u. o: {cols, sway, seed, key}.
// Weather  rain(t, o) streaks {x0, y0, w, h, k: 0..1, wind, len, col, seed, key}; splashes(t, o) {x0, x1, y, k, key}.
// Cat      cat(x, y, s, o): the black cat, (x, y) = ground point under its middle, s ≈ Clawd's u. Faces right; o.flip faces
//          left. Poses (o.pose): sit (front view), walk, crouch, pounce (side views), loaf, curl (asleep).
//          o: walk (leg phase), tail (wag, -1..1), tailUp (0..1), ears (-1 flat .. 1 perked), look ([-1..1, -1..1]),
//             eyes ('open' | 'half' | 'closed' | 'wide'), pupil (0 slit .. 1 round), wet (0..1), dy/rot/sx/sy, boilKey.
//          catHead(x, y, s, o) returns the head's world position for a pose, for emotes and eye lines.
// Props    apple(x, y, r, o); basket(x, y, s, o) {apples, leaf, part: 'all' | 'back' | 'front'}; mug(x, y, s, o) a cocoa
//          mug, (x, y) = the base; steam(t, x, y, s, o) curls of steam rising from (x, y).
// Set      cottage(x, y, s, o): the cottage, (x, y) = ground at the middle of the door. o: {door: 0..1 open, lit: 0..1,
//          wet: 0..1, dusk: 0..1, key}.
// Clawd    bodyPt(x, G, u, o, lx, ly): body-local (front-view units, y up is negative) → world, like clawd() does.
//          armPt(x, G, u, o, which = 'R', along = 1): the world point at the tip of an arm ('L' or 'R'; side view has only
//          'L'), so a prop drawn there touches the hand. along < 1 gives a point part way down the arm.

const BAR = n => { const B = PROJECT.beats; return B[clamp((n - 1) * 4, 0, B.length - 1)]; };
function AT(bar, beat = 1) {
  const B = PROJECT.beats, x = clamp((bar - 1) * 4 + (beat - 1), 0, B.length - 1), i = Math.min(Math.floor(x), B.length - 2);
  return lerp(B[i], B[i + 1], x - i);
}

const FALL = {
  gold: '#F2B64C', amber: '#E0892E', rust: '#B9542C', maple: '#D9432F', crimson: '#A8323A', plum: '#6B3F5E',
  moss: '#7E8C3E', olive: '#9A9A4A', sage: '#9DB08A', grass: '#B9A95C', grassDk: '#8C7F42', path: '#D9C29A',
  bark: '#6E4A36', barkDk: '#4A3126',
  cloud: '#EDDCC8', storm: '#7D8798', stormDk: '#565E70', rainCol: '#C3CFDC',
  lamp: '#FFD27A', window: '#FFE3A0', star: '#FFF1C2',
  cocoa: '#6B3F2A', mug: '#5E7FA6', mugDk: '#3F5A7C', blanket: '#C9584A', blanketLt: '#E9A46A',
  cat: '#3A3442', catDk: '#27222F', catRim: '#8A819E', catEye: '#D6E35A', catNose: '#C98A94',
  apple: '#CE3A34', appleDk: '#8E2328', appleLt: '#F07A5A', stem: '#5A3A22', leafGreen: '#7FA04A',
  wicker: '#C99A5B', wickerDk: '#8E6536', wood: '#9C6B45', woodDk: '#6A452C', wall: '#E8D2A6', wallDk: '#C4A677',
  roof: '#7E4A3F', roofDk: '#5A322C', stone: '#A99A8A', pumpkin: '#E8872E', pumpkinDk: '#B45A1E',
};

// ---------- skies ----------
const SKIES = {   // top → horizon
  gold:   ['#EFCB93', '#F4D6A2', '#F7DFB0', '#F6D59C'],
  amber:  ['#E3A77C', '#EDB887', '#F2C68E', '#F2B777'],
  storm:  ['#6F788A', '#7C8597', '#8C94A3', '#9AA0AC'],
  rain:   ['#5B6475', '#687182', '#768090', '#848B9A'],
  sunset: ['#7C6A9E', '#D57A8C', '#F09A62', '#F7C473'],
  dusk:   ['#2E396C', '#42508A', '#69699C', '#B28796'],
  night:  ['#1D2450', '#252D5C', '#2E386A', '#3B4478'],
};
function skyBands(anchors, o = {}) {
  const x0 = o.x0 ?? -400, y0 = o.y0 ?? -400, w = o.w ?? W + 800, h = o.h ?? H + 600, n = 11;
  // spread the anchor colours over n soft bands, each a bleeding watercolour fill over the one above it
  const cols = [...Array(n)].map((_, i) => {
    const x = i / (n - 1) * (anchors.length - 1), j = Math.min(Math.floor(x), anchors.length - 2);
    return mixCol(anchors[j], anchors[j + 1], x - j);
  });
  boilSeed(o.key || 'sky');
  paint(rectPts(x0, y0, w, h), { wash: cols[0], ink: null });
  for (let i = 1; i < n; i++) {
    const yy = y0 + h * i / n, soft = h / n * .6;
    paint(rectPts(x0 - 40, yy - soft, w + 80, y0 + h - yy + soft + 40), { fill: cols[i], fillOp: 235, bleed: .35, tex: .15, border: .25, ink: null });
  }
  if (o.sun) {
    const [sx, sy] = o.sun, r = o.sunR ?? 60, a = o.sunA ?? 1;
    glow(sx, sy, r * 7, o.sunGlow || '#FFC766', .9 * a);
    boilSeed((o.key || 'sky') + ' sun');
    paint(ellPts(sx, sy, r, r, 30, 1.5), { wash: o.sunCol || '#FFF1C2', washOp: 255 * a, ink: null });
  }
}
const sky = (mood, o = {}) => skyBands(SKIES[mood], o);
const skyBlend = (a, b, k, o = {}) => skyBands(SKIES[a].map((c, i) => mixCol(c, SKIES[b][i], clamp(k))), o);
function clouds(t, o = {}) {
  const n = o.n ?? 6, x0 = o.x0 ?? -500, x1 = o.x1 ?? W + 500, span = x1 - x0, sc = o.scale ?? 1, seed = o.seed ?? 3;
  for (let i = 0; i < n; i++) {
    const h = hash(seed * 97 + i), cx = x0 + ((h * span + t * (o.speed ?? 12) * (.6 + .8 * hash(i + seed))) % span + span) % span;
    const cy = (o.y ?? 200) + (hash(i * 7 + seed) - .5) * (o.spread ?? 120), cw = (160 + 200 * hash(i * 3 + seed)) * sc;
    boilSeed((o.key || 'cloud') + i);
    for (let k = 0; k < 4; k++) {
      const bx = cx + (k - 1.5) * cw * .32, by = cy - Math.sin((k + .5) / 4 * Math.PI) * cw * .16;
      paint(ellPts(bx, by, cw * (.22 + .1 * hash(i * 5 + k)), cw * (.14 + .05 * hash(i * 9 + k)), 20, 3),
        { wash: o.col || FALL.cloud, washOp: o.op ?? 230, fill: o.col2 || o.col || FALL.cloud, fillOp: 90, bleed: .25, tex: .3, ink: null });
    }
  }
}

// ---------- leaves ----------
const MAPLE = [[0, -1], [.18, -.55], [.62, -.72], [.45, -.25], [.98, -.18], [.55, .15], [.62, .42], [.12, .25], [0, .5],
  [-.12, .25], [-.62, .42], [-.55, .15], [-.98, -.18], [-.45, -.25], [-.62, -.72], [-.18, -.55]];
function leaf(x, y, s, rot = 0, col = FALL.amber, o = {}) {
  const spin = o.spin ?? 1, sx = Math.sign(spin || 1) * Math.max(.18, Math.abs(spin)), sw = clamp(s / 16, .3, 1.4);
  push(); translate(x, y); rotate(rot); scale(sx, 1);
  const P = MAPLE.map(([a, b]) => [a * s, b * s]);
  paint(P, { wash: col, washOp: o.op ?? 255, fill: o.fill || mixCol(col, FALL.crimson, .35), fillOp: 90, bleed: .08, tex: .6, border: .5, ink: o.ink === undefined ? PAL.ink : o.ink, sw });
  if (s > 10) {
    inkLine([[0, .5 * s], [0, .95 * s]], sw * 1.1, FALL.barkDk, 'ink', 0);
    if (s > 18) for (const [a, b] of [[0, -.8], [.72, -.55], [.82, -.15], [-.72, -.55], [-.82, -.15]])
      inkLine([[0, .3 * s], [a * s * .8, b * s * .8]], sw * .5, mixCol(col, FALL.crimson, .6), 'inkfine', 0);
  }
  pop();
}
function redLeaf(x, y, s, rot = 0, o = {}) {
  if (o.lit) glow(x, y, s * 3.2, '#FFB35C', .8 * o.lit);
  leaf(x, y, s, rot, o.lit ? mixCol(FALL.maple, '#FF8A4A', .45 * o.lit) : FALL.maple, { ...o, fill: FALL.crimson });
}
// Falling leaves as a pure function of t. o: {n, x0, x1, y0, y1, seed, k (0..1 density), fall: [v0, v1] px/s,
// size: [s0, s1], sway, wind (px/s), cols, gust: [t0, t1, px], key, spin}
function leafField(t, o = {}) {
  const n = o.n ?? 24, x0 = o.x0 ?? -100, x1 = o.x1 ?? W + 100, y0 = o.y0 ?? -80, y1 = o.y1 ?? H + 80, span = x1 - x0, hgt = y1 - y0;
  const cols = o.cols || [FALL.gold, FALL.amber, FALL.rust, FALL.maple, FALL.olive], seed = o.seed ?? 1, k = o.k ?? 1;
  const [v0, v1] = o.fall || [45, 95], [s0, s1] = o.size || [9, 16];
  let gx = 0;
  if (o.gust) { const [g0, g1, amp] = o.gust; gx = amp * ease(seg(t, g0, g1)); }
  for (let i = 0; i < n; i++) {
    const h = j => hash(seed * 131 + i * 17 + j);
    if (h(0) > k) continue;
    const v = lerp(v0, v1, h(1)), yy = y0 + ((t * v + h(2) * hgt) % hgt + hgt) % hgt;
    const w = lerp(.9, 2, h(3)), ph = h(4) * TAU, sway = (o.sway ?? 40) * lerp(.5, 1.3, h(5));
    const xx = x0 + ((h(6) * span + t * (o.wind ?? 12) + gx * lerp(.6, 1.4, h(7)) + sway * Math.sin(t * w + ph)) % span + span) % span;
    boilSeed((o.key || 'leaves') + i);
    leaf(xx, yy, lerp(s0, s1, h(8)), ph + .7 * Math.sin(t * w * .8 + ph), cols[Math.floor(h(9) * cols.length)],
      { spin: o.spin === false ? 1 : Math.cos(t * lerp(1.5, 3.2, h(10)) + ph), ink: o.ink });
  }
}
function pile(x, y, w, h, o = {}) {
  const cols = o.cols || [FALL.amber, FALL.rust, FALL.gold, FALL.maple, FALL.crimson], key = o.key || 'pile';
  boilSeed(key + ' base');
  const P = [];
  for (let i = 0; i <= 16; i++) { const a = Math.PI * i / 16; P.push([x - Math.cos(a) * w / 2, y - Math.sin(a) * h * (1 + .08 * Math.sin(i * 2.3))]); }
  paint(P, { wash: FALL.rust, fill: FALL.amber, fillOp: 150, bleed: .15, tex: .7, ink: PAL.ink, sw: 1 });
  const n = o.n ?? Math.round(w / 14);
  for (let i = 0; i < n; i++) {
    const a = Math.PI * (.08 + .84 * hash(i * 3.3 + 1)), r = Math.sqrt(hash(i * 5.1 + 2));
    const lx = x - Math.cos(a) * w / 2 * r, ly = y - Math.sin(a) * h * r * .92;
    boilSeed(key + i);
    leaf(lx, ly, (o.leaf ?? 13) * lerp(.7, 1.2, hash(i + 9)), hash(i * 7) * TAU, cols[i % cols.length], { spin: lerp(.4, 1, hash(i * 11)) });
  }
}

// ---------- trees ----------
function maple(x, y, s, o = {}) {
  const key = o.key || 'maple', seed = o.seed ?? 1, cols = o.cols || [FALL.amber, FALL.gold, FALL.rust, FALL.maple];
  const sway = o.sway ?? 0;
  boilSeed(key + ' trunk');
  paint(ribbon([[x, y], [x - s * .3, y - s * 8], [x + s * .5, y - s * 15]], s * 2.4, s * 1.2), { wash: FALL.bark, fill: FALL.barkDk, fillOp: 90, tex: .7, bleed: .05, ink: PAL.ink, sw: clamp(s / 14, .5, 1.6) });
  for (const [bx, by, ex, ey] of [[0, -11, -6, -17], [.3, -13, 6, -19], [.2, -9, 5, -12]])
    inkLine([[x + bx * s, y + by * s], [x + (bx + ex) * .5 * s, y + (by + ey) * .5 * s - s], [x + ex * s, y + ey * s]], clamp(s / 8, .6, 3), FALL.barkDk, 'ink', .5);
  // the crown: soft watercolour masses, darkest underneath, with no outline, then a scatter of single-leaf dabs
  const blobs = [[-7, -15, 7, 5.5], [7, -15.5, 7, 5.5], [0, -14, 8.5, 5.5], [-8.5, -20, 6.5, 5.2], [8.5, -20.5, 6.5, 5.2], [0, -21, 9.5, 6.5],
    [-4.5, -26, 6.8, 4.8], [4.5, -26.5, 6.8, 4.8], [0, -29.5, 5.5, 3.6]];
  blobs.forEach(([bx, by, rx, ry], i) => {
    boilSeed(key + ' crown' + i);
    const sx = sway * Math.sin(i * 1.7 + seed) * s * .25, c = cols[(i + seed) % cols.length], low = clamp((by + 30) / 16);
    paint(ellPts(x + bx * s + sx, y + by * s, rx * s, ry * s, 26, s * .6, hash(i + seed) * 3),
      { wash: mixCol(c, FALL.crimson, .3 * low), washOp: 255, fill: mixCol(c, FALL.crimson, .55 * low), fillOp: 130, bleed: .2, tex: .85, border: .7, ink: null });
  });
  boilSeed(key + ' dabs');
  for (let i = 0; i < 46; i++) {
    const a = hash(i * 3.1 + seed) * TAU, r = Math.sqrt(hash(i * 5.7 + seed)), dx = Math.cos(a) * r * 12.5, dy = -20.5 + Math.sin(a) * r * 9.5;
    const sx = sway * Math.sin(i * .9 + seed) * s * .2, c = cols[i % cols.length];
    paint(ellPts(x + dx * s + sx, y + dy * s, s * .75, s * .5, 8, s * .1, a), { wash: mixCol(c, '#FFE2A0', .25 * (1 - r)), washOp: 235, ink: null });
  }
}

// ---------- weather ----------
function rain(t, o = {}) {
  const k = clamp(o.k ?? 1); if (k <= 0) return;
  const n = Math.round((o.n ?? 170) * k), x0 = o.x0 ?? -200, y0 = o.y0 ?? -200, w = o.w ?? W + 400, h = o.h ?? H + 400;
  const len = o.len ?? 46, wind = o.wind ?? .18, sp = o.speed ?? 1100, seed = o.seed ?? 7;
  boilSeed(o.key || 'rain');
  for (let i = 0; i < n; i++) {
    const hy = ((t * sp * lerp(.85, 1.15, hash(i * 3 + seed)) + hash(i * 7 + seed) * h) % h + h) % h;
    const hx = ((hash(i * 11 + seed) * w - hy * wind) % w + w) % w;
    const px = x0 + hx, py = y0 + hy;
    inkLine([[px, py], [px - wind * len, py + len]], lerp(.35, .8, hash(i * 13 + seed)), o.col || FALL.rainCol, 'inkfine', 0);
  }
}
function splashes(t, o = {}) {
  const k = clamp(o.k ?? 1); if (k <= 0) return;
  const n = Math.round((o.n ?? 16) * k), x0 = o.x0 ?? 0, x1 = o.x1 ?? W, y = o.y ?? 900;
  boilSeed(o.key || 'splash');
  for (let i = 0; i < n; i++) {
    const per = lerp(.5, .9, hash(i * 5 + 1)), a = ((t + hash(i * 9 + 2) * per) % per) / per;
    const cx = lerp(x0, x1, hash(i * 7 + Math.floor((t + hash(i * 9 + 2) * per) / per) * .37));
    paint(ellPts(cx, y + (hash(i) - .5) * (o.depth ?? 40), 4 + 22 * a, (4 + 22 * a) * .28, 16), { ink: FALL.rainCol, sw: .7 * (1 - a) + .2, br: 'inkfine' });
  }
}

// ---------- the black cat ----------
function catHead(x, y, s, o = {}) {
  const f = o.flip ? -1 : 1, pose = o.pose || 'sit';
  const L = { sit: [0, -5.2], walk: [3.2, -4.9], crouch: [3.3, -3.2], pounce: [3.9, -4.4], loaf: [1.9, -2.1], curl: [1.9, -1.9] }[pose];
  return [x + L[0] * s * f * (o.sx ?? 1), y + ((o.dy || 0) + L[1]) * s * (o.sy ?? 1)];
}
function cat(x, y, s, o = {}) {
  const key = 'cat ' + (o.boilKey ?? 'a'), rs = p => boilSeed(key + ' ' + p);
  const pose = o.pose || 'sit', f = o.flip ? -1 : 1, sw = clamp(s / 22, .35, 1.4), wet = clamp(o.wet || 0);
  const body = mixCol(FALL.cat, '#4E5670', .3 * wet), dk = FALL.catDk, rimC = FALL.catRim;
  const S = (P) => P.map(([a, b]) => [a * s, b * s]);
  const fur = { wash: body, washOp: 255, fill: dk, fillOp: 70, bleed: .06, tex: .6, border: .5, ink: PAL.ink, sw };
  const look = o.look || [0, 0], ears = o.ears ?? 0, tail = o.tail ?? 0, tailUp = o.tailUp ?? 0;
  if (!o.noShadow) {
    rs('shadow');
    const sh = pose === 'sit' ? 2.6 : pose === 'curl' || pose === 'loaf' ? 3.4 : 4;
    paint(ellPts(x + (pose === 'sit' ? 0 : -.3 * s * f), y + s * .12, s * sh, s * .6, 18), { fill: PAL.ink, fillOp: 80, bleed: .25, tex: .3, border: .1, ink: null });
  }
  push(); translate(x, y + (o.dy || 0) * s); if (o.rot) rotate(o.rot); scale(f * (o.sx ?? 1), o.sy ?? 1);

  const earPair = (hx, hy, r, spread, side) => {   // side: which ears to draw ([-1, 1] front, [1] profile)
    for (const d of side) {
      rs('ear' + d);
      const tilt = d * (.35 - .5 * Math.min(0, ears)) - .12 * ears * d, bx = hx + d * spread * r;
      push(); translate(bx * s, (hy - .55 * r) * s); rotate(tilt);
      const hgt = r * (1.05 + .15 * ears - .35 * Math.max(0, -ears));
      paint(S([[-.55 * r, .25 * r], [0, -hgt], [.55 * r, .25 * r]]), { ...fur, curv: .15 });
      paint(S([[-.3 * r, .12 * r], [0, -hgt * .65], [.3 * r, .12 * r]]), { wash: FALL.catNose, washOp: 210, ink: null });
      pop();
    }
  };
  const eye = (ex, ey, r, open) => {
    const e = o.eyes || 'open';
    if (e === 'closed' || open <= .05) { inkLine(S([[ex - r, ey - r * .1], [ex, ey + r * .35], [ex + r, ey - r * .1]]), sw * .9, PAL.ink, 'ink', .6); return; }
    const hr = r * (e === 'wide' ? 1.25 : 1) * (e === 'half' ? .55 : 1) * open;
    paint(S([[ex - r, ey], [ex - r * .45, ey - hr * .9], [ex + r * .45, ey - hr * .9], [ex + r, ey], [ex + r * .45, ey + hr * .9], [ex - r * .45, ey + hr * .9]]),
      { wash: FALL.catEye, fill: '#AFC23E', fillOp: 90, bleed: .05, tex: .4, ink: PAL.ink, sw: sw * .8, curv: .6 });
    const pw = lerp(.16, .55, clamp(o.pupil ?? .2)) * r, px = ex + look[0] * r * .35, py = ey + look[1] * hr * .25;
    paint(ellPts(px * s, py * s, pw * s, Math.min(hr * .82, r * .82) * s, 14), { wash: PAL.ink, ink: null });
    paint(ellPts((px + pw * .5) * s, (py - hr * .3) * s, r * .14 * s, r * .14 * s, 8), { wash: PAL.cream, ink: null });
    if (e === 'half') inkLine(S([[ex - r, ey - hr * .8], [ex + r, ey - hr * .8]]), sw * 1.2, PAL.ink, 'ink', 0);
  };
  const blinkK = o.blink ?? 1;
  const whiskers = (wx, wy, dir, spread) => {
    rs('whisk' + dir);
    for (const k of [-1, 0, 1]) inkLine(S([[wx, wy + k * .12], [wx + dir * spread * .55, wy + k * .2 - .05], [wx + dir * spread, wy + k * .38 + .1]]), sw * .45, PAL.cream, 'inkfine', .5);
  };
  const tailPath = (bx, by, k) => {   // a curling tail from the rump; k scales its reach
    const up = tailUp, wg = tail;
    return S([[bx, by], [bx - .9 * k, by - .6 - 1.2 * up], [bx - 1.5 * k + .5 * wg, by - 1.8 - 1.6 * up], [bx - 1.1 * k + 1.1 * wg, by - 3 - 1.7 * up]]);
  };
  const rim = (P) => inkLine(S(P), sw * .8, rimC, 'inkfine', .6);

  if (pose === 'sit') {
    if (tailUp > .3) { rs('tail'); paint(ribbon(tailPath(1.6, -.8, 1.4).map(([a, b]) => [-a, b]), .9 * s, .55 * s), fur); }
    rs('body');
    paint(through(S([[-2.1, 0], [-2.35, -1.3], [-1.9, -2.9], [-1.25, -3.9], [0, -4.25], [1.25, -3.9], [1.9, -2.9], [2.35, -1.3], [2.1, 0]]), 6), fur);
    rim([[1.9, -2.9], [2.3, -1.4], [2.05, -.3]]);
    rs('paws');
    for (const d of [-1, 1]) {
      paint(rrPts((d * .9 - .38) * s, -2.5 * s, .76 * s, 2.3 * s, .3 * s), { ...fur, sw: sw * .7 });
      paint(ellPts(d * .95 * s, -.28 * s, .58 * s, .36 * s, 14), { ...fur, sw: sw * .7 });
    }
    if (tailUp <= .3) { rs('tail'); paint(ribbon(S([[1.9, -.2], [1.2, .15 + .1 * tail], [-.4, .25], [-1.7, .05 + .15 * Math.sin(tail * 2)], [-2.4, -.5 - .3 * tail]]), .7 * s, .34 * s), fur); }
    earPair(0, -5.6, 1.15, .8, [-1, 1]);
    rs('head');
    paint(ellPts(0, -5.25 * s, 1.85 * s, 1.5 * s, 24, s * .04), fur);
    rim([[1.2, -6.4], [1.8, -5.5], [1.5, -4.4]]);
    rs('face');
    eye(-.72, -5.4, .58, blinkK); eye(.72, -5.4, .58, blinkK);
    paint(S([[-.16, -4.88], [.16, -4.88], [0, -4.68]]), { wash: FALL.catNose, ink: PAL.ink, sw: sw * .5 });
    inkLine(S([[-.28, -4.45], [-.1, -4.4], [0, -4.6], [.1, -4.4], [.28, -4.45]]), sw * .6, PAL.ink, 'inkfine', .5);
    whiskers(-.45, -4.7, -1, 2.1); whiskers(.45, -4.7, 1, 2.1);
  } else if (pose === 'loaf' || pose === 'curl') {
    const curl = pose === 'curl';
    rs('body');
    paint(through(S([[-3.1, 0], [-3.3, -1.3], [-2.4, -2.5], [-.3, -2.85], [1.8, -2.4], [2.9, -1.3], [2.9, 0]]), 6), fur);
    rim([[-2.6, -2.3], [-.4, -2.8], [1.4, -2.5]]);
    rs('tail');
    paint(ribbon(S([[-3, -.4], [-2.2, .2], [0, .35], [1.8, .25 + .05 * tail], [2.9, -.2]]), .7 * s, .38 * s), fur);
    earPair(1.9, -2.5, .95, .72, [-1, 1]);
    rs('head');
    paint(ellPts(1.9 * s, -2.1 * s, 1.5 * s, 1.2 * s, 22, s * .04), fur);
    rs('face');
    if (curl) { eye(1.35, -2.2, .38, 0); eye(2.45, -2.2, .38, 0); }
    else { eye(1.35, -2.2, .4, blinkK); eye(2.45, -2.2, .4, blinkK); }
    paint(S([[1.78, -1.78], [2.02, -1.78], [1.9, -1.62]]), { wash: FALL.catNose, ink: PAL.ink, sw: sw * .5 });
    if (!curl) { whiskers(1.55, -1.7, -1, 1.5); whiskers(2.25, -1.7, 1, 1.5); }
  } else {   // side views: walk, crouch, pounce
    const cr = pose === 'crouch' ? 1 : 0, po = pose === 'pounce' ? 1 : 0, ph = (o.walk ?? 0) * TAU;
    const lift = cr * 1.3, bodyY = -4.4 + lift, hipY = -3 + lift * .6;
    const legs = [[1.7, 0], [-2.2, .5], [1.4, .5], [-2.5, 0]];   // [hip x, phase]; the first two are far legs
    const leg = (hx, p, far) => {
      let fx = hx + (po ? (hx > 0 ? 1.6 : -1.8) : Math.sin(ph + p * TAU) * .7), fy = po ? -1 : -Math.max(0, Math.cos(ph + p * TAU)) * .6;
      if (cr) fx = hx + (hx > 0 ? .8 : -.2);
      paint(ribbon(S([[hx, hipY + (hx > 0 ? 0 : -.2)], [lerp(hx, fx, .5) + (hx > 0 ? -.15 : .2), lerp(hipY, fy, .55)], [fx, fy]]), .75 * s, .55 * s),
        { ...fur, wash: far ? dk : body });
    };
    legs.slice(0, 2).forEach(([hx, p], i) => { rs('legF' + i); leg(hx, p, true); });
    rs('tail');
    paint(ribbon(S([[-3.1, bodyY + .6], [-4.2, bodyY - .2 - tailUp], [-4.9 + .6 * tail, bodyY - 1.6 - tailUp * .8], [-4.3 + 1.1 * tail, bodyY - 2.8 - tailUp * .5]]), .72 * s, .3 * s), fur);
    rs('body');
    const back = po ? .3 : 0;
    paint(through(S([[-3.3, bodyY + 1.2], [-3.1, bodyY - .1 - cr * .6], [-1.2, bodyY - .2 - back], [1.2, bodyY + .05 - back], [2.5, bodyY + .5], [2.4, bodyY + 1.6], [.9, bodyY + 1.9], [-1.5, bodyY + 1.85], [-3, bodyY + 1.7]]), 6), fur);
    rim([[-2.9, bodyY - .1 - cr * .6], [-1, bodyY - .15 - back], [1, bodyY - back]]);
    legs.slice(2).forEach(([hx, p], i) => { rs('legN' + i); leg(hx, p, false); });
    const [hx, hy] = { walk: [3.2, -4.9], crouch: [3.3, -3.2], pounce: [3.9, -4.4] }[pose];
    earPair(hx - .3, hy - .45, 1, .45, [1, -1]);
    rs('head');
    paint(through(S([[hx - 1.35, hy + .2], [hx - 1, hy - 1.05], [hx + .2, hy - 1.25], [hx + 1.1, hy - .6], [hx + 1.45, hy + .15], [hx + 1.1, hy + .75], [hx - .2, hy + 1.05], [hx - 1.2, hy + .8]]), 5), fur);
    rs('face');
    eye(hx + .55, hy - .25, .42, blinkK);
    paint(S([[hx + 1.3, hy + .1], [hx + 1.5, hy + .1], [hx + 1.45, hy + .3]]), { wash: FALL.catNose, ink: PAL.ink, sw: sw * .5 });
    whiskers(hx + 1.1, hy + .35, 1, 1.7);
  }
  pop();
}

// ---------- props ----------
function apple(x, y, r, o = {}) {
  boilSeed(o.key || 'apple' + Math.round(x) + '_' + Math.round(y));
  const c = o.col || FALL.apple, sw = clamp(r / 10, .4, 1.4);
  push(); translate(x, y); if (o.rot) rotate(o.rot);
  paint(through([[-r, 0], [-r * .9, -r * .7], [-r * .3, -r * .95], [0, -r * .75], [r * .3, -r * .95], [r * .9, -r * .7], [r, 0], [r * .7, r * .8], [0, r * .95], [-r * .7, r * .8], [-r, 0]], 5),
    { wash: c, fill: FALL.appleDk, fillOp: 90, bleed: .08, tex: .5, ink: PAL.ink, sw });
  paint(ellPts(-r * .4, -r * .35, r * .22, r * .14, 10, 0, -.6), { wash: FALL.appleLt, washOp: 200, ink: null });
  inkLine([[0, -r * .75], [r * .08, -r * 1.25]], sw * 1.4, FALL.stem, 'ink', 0);
  if (!o.noLeaf) paint(ellPts(r * .42, -r * 1.12, r * .38, r * .16, 12, 0, -.45), { wash: FALL.leafGreen, ink: PAL.ink, sw: sw * .7 });
  pop();
}
function basket(x, y, s, o = {}) {
  const part = o.part || 'all', key = o.key || 'basket', sw = clamp(s / 14, .5, 1.8), n = o.apples ?? 5;
  const rimY = y - 4.2 * s;
  if (part !== 'front') {   // handle, the back rim, then the apples that sit in it
    boilSeed(key + ' handle');
    paint(ribbon([[x - 3.6 * s, rimY], [x - 3 * s, rimY - 4 * s], [x, rimY - 5.4 * s], [x + 3 * s, rimY - 4 * s], [x + 3.6 * s, rimY]], .7 * s), { wash: FALL.wicker, fill: FALL.wickerDk, fillOp: 90, tex: .6, ink: PAL.ink, sw });
    boilSeed(key + ' back');
    paint(ellPts(x, rimY, 4.3 * s, 1 * s, 20), { wash: FALL.wickerDk, ink: PAL.ink, sw });
    for (let i = 0; i < n; i++) apple(x + (i - (n - 1) / 2) * 1.55 * s + (hash(i + 3) - .5) * .4 * s, rimY - (.3 + .5 * hash(i * 5)) * s, 1.05 * s, { key: key + ' apple' + i, rot: (hash(i) - .5) * .8, noLeaf: i % 2 === 0 });
    if (o.leaf) redLeaf(x + 2.2 * s, rimY - 1.3 * s, 1.6 * s, .5, { key: key + ' leaf' });
  }
  if (part !== 'back') {
    boilSeed(key + ' front');
    paint([[x - 4.4 * s, rimY], [x + 4.4 * s, rimY], [x + 3.4 * s, y], [x - 3.4 * s, y]],
      { wash: FALL.wicker, fill: FALL.wickerDk, fillOp: 70, tex: .7, bleed: .05, ink: PAL.ink, sw, hatch: { d: Math.max(4, .8 * s), a: .5, o: { rand: .2 }, b: 'HB', c: FALL.wickerDk, w: .8 } });
    inkLine([[x - 4.4 * s, rimY], [x + 4.4 * s, rimY]], sw * 2.2, FALL.wickerDk, 'ink', 0);
  }
}
function mug(x, y, s, o = {}) {
  boilSeed(o.key || 'mug');
  const sw = clamp(s / 14, .5, 1.6);
  paint(ribbon([[x + 1.4 * s, y - 2.6 * s], [x + 2.5 * s, y - 2.2 * s], [x + 2.5 * s, y - 1.1 * s], [x + 1.4 * s, y - .8 * s]], .5 * s), { wash: o.col || FALL.mug, ink: PAL.ink, sw });
  paint(rrPts(x - 1.6 * s, y - 3.3 * s, 3.2 * s, 3.3 * s, .5 * s), { wash: o.col || FALL.mug, fill: FALL.mugDk, fillOp: 80, tex: .5, ink: PAL.ink, sw });
  paint(ellPts(x, y - 3.2 * s, 1.45 * s, .35 * s, 16), { wash: FALL.cocoa, ink: PAL.ink, sw: sw * .7 });
}
function steam(t, x, y, s, o = {}) {
  const k = clamp(o.k ?? 1); if (k <= 0) return;
  boilSeed(o.key || 'steam');
  for (let i = 0; i < 3; i++) {
    const a = frac(t * .45 + i / 3), yy = y - a * 5 * s, xx = x + (i - 1) * .7 * s + Math.sin(t * 2.2 + i * 2) * .5 * s;
    if (a > .8) continue;
    inkLine([[xx, yy], [xx + .6 * s * Math.sin(t * 3 + i), yy - 1 * s], [xx - .3 * s, yy - 2 * s]], .9 * clamp(s / 10, .5, 1.6) * (1 - a), mixCol(PAL.cream, '#FFFFFF', .3), 'dry', .7);
  }
}

// ---------- the cottage ----------
function cottage(x, y, s, o = {}) {
  const key = o.key || 'cottage', sw = clamp(s / 12, .6, 2), wet = clamp(o.wet || 0), dusk = clamp(o.dusk || 0), lit = clamp(o.lit || 0);
  const tone = c => mixCol(mixCol(c, '#5D6680', .35 * wet), '#3A3F66', .4 * dusk);
  boilSeed(key + ' chimney');
  paint(rectPts(x + 9 * s, y - 31 * s, 3.5 * s, 9 * s), { wash: tone(FALL.stone), fill: tone('#7E7064'), fillOp: 80, tex: .7, ink: PAL.ink, sw });
  boilSeed(key + ' roof');
  paint([[x - 19 * s, y - 17.5 * s], [x - 3 * s, y - 30 * s], [x + 3 * s, y - 30 * s], [x + 19 * s, y - 17.5 * s]], { wash: tone(FALL.roof), fill: tone(FALL.roofDk), fillOp: 110, bleed: .05, tex: .8, ink: PAL.ink, sw, hatch: { d: 1.4 * s, a: 0, o: { rand: .25 }, b: 'HB', c: tone(FALL.roofDk), w: .9 } });
  boilSeed(key + ' wall');
  paint(rectPts(x - 16 * s, y - 18 * s, 32 * s, 18 * s, s * .15), { wash: tone(FALL.wall), fill: tone(FALL.wallDk), fillOp: 100, bleed: .08, tex: .7, ink: PAL.ink, sw });
  // window, left of the door
  const wx = x - 11 * s, wy = y - 13 * s;
  if (lit > 0) glow(wx, wy + 1.5 * s, 14 * s, FALL.lamp, .75 * lit);
  boilSeed(key + ' window');
  paint(rectPts(wx - 4 * s, wy - 3.5 * s, 8 * s, 7.5 * s), { wash: mixCol(tone('#3E4560'), FALL.window, lit), fill: mixCol('#2E3450', '#FFC766', lit), fillOp: 80, tex: .4, ink: PAL.ink, sw });
  inkLine([[wx, wy - 3.5 * s], [wx, wy + 4 * s]], sw * 1.6, tone(FALL.woodDk), 'ink', 0);
  inkLine([[wx - 4 * s, wy + .2 * s], [wx + 4 * s, wy + .2 * s]], sw * 1.6, tone(FALL.woodDk), 'ink', 0);
  paint(rectPts(wx - 4.8 * s, wy + 4 * s, 9.6 * s, 1.1 * s), { wash: tone(FALL.wood), ink: PAL.ink, sw });
  // the door: an arched opening; open, it shows the warm room and the leaf folds toward its hinge
  const dw = 3.6 * s, dTop = y - 11 * s, arch = [];
  for (let i = 0; i <= 10; i++) { const a = Math.PI * i / 10; arch.push([x - Math.cos(a) * dw, dTop - Math.sin(a) * 2.6 * s]); }
  const opening = [[x - dw, y], ...arch.map(([a, b]) => [a, b + 2.6 * s * 0]), [x + dw, y]];
  const door = clamp(o.door || 0);
  if (door > 0 || lit > 0) glow(x, y - 7 * s, 16 * s * (door + .2), FALL.lamp, .9 * Math.max(door, lit * .25));
  boilSeed(key + ' opening');
  paint(opening, { wash: door > 0 ? mixCol('#6A4A3A', FALL.window, .75) : tone(FALL.woodDk), ink: PAL.ink, sw });
  if (door < 1) {
    const hinge = x - dw, wdt = 2 * dw * (1 - ease(door) * .82);
    boilSeed(key + ' door');
    const leafPts = [[hinge, y], ...arch.map(([a, b]) => [hinge + (a - hinge) * wdt / (2 * dw), b]), [hinge + wdt, y]];
    paint(leafPts, { wash: tone(FALL.wood), fill: tone(FALL.woodDk), fillOp: 90, tex: .7, bleed: .05, ink: PAL.ink, sw });
    for (let i = 1; i < 4; i++) inkLine([[hinge + wdt * i / 4, y - .3 * s], [hinge + wdt * i / 4, dTop - 1.8 * s]], sw * .7, tone(FALL.woodDk), 'dry', 0);
    paint(ellPts(hinge + wdt * .85, y - 5.5 * s, .4 * s, .4 * s, 10), { wash: '#C9A45A', ink: PAL.ink, sw: sw * .7 });
  }
  boilSeed(key + ' step');
  paint(rectPts(x - 5.2 * s, y - .4 * s, 10.4 * s, 1.4 * s, s * .1), { wash: tone(FALL.stone), fill: tone('#7E7064'), fillOp: 90, tex: .7, ink: PAL.ink, sw });
  // the lantern by the door
  const lx = x + 5.4 * s, ly = y - 11.5 * s;
  if (lit > 0) glow(lx, ly, 5 * s, FALL.lamp, lit);
  boilSeed(key + ' lantern');
  inkLine([[lx - 1.2 * s, ly - 2.6 * s], [lx, ly - 2.6 * s], [lx, ly - 1.4 * s]], sw * 1.2, PAL.ink, 'ink', 0);
  paint(rrPts(lx - .8 * s, ly - 1.4 * s, 1.6 * s, 2.4 * s, .3 * s), { wash: mixCol('#5E5048', FALL.lamp, lit), ink: PAL.ink, sw: sw * .8 });
}

// ---------- Clawd helpers ----------
function bodyPt(x, G, u, o, lx, ly) {
  const sq = (o.sq || 0) + (o.take || 0), f = (o.flip ? -1 : 1) * (o.sx ?? 1), r = o.rot || 0;
  const px = lx * u * f * (1 + sq * .6), py = ly * u * (1 - sq) * (o.sy ?? 1);
  return [x + (o.dx || 0) * u + px * Math.cos(r) - py * Math.sin(r), G + (o.dy || 0) * u + px * Math.sin(r) + py * Math.cos(r)];
}
function armPt(x, G, u, o, which = 'R', along = 1) {
  const V = VIEWS[o.view] || VIEWS.front, A = V.arms.find(a => a[2] === which) || V.arms[0];
  const [px, dir, w] = A, a = w === 'L' ? (o.aL ?? .2) : (o.aR ?? .2);
  let lx, ly;
  if (dir === 0) { const th = .7 - a; lx = px + Math.cos(th) * 2.1 * along; ly = -4.2 + Math.sin(th) * 2.1 * along; }
  else { const rx = px + dir * .55 * clamp((Math.abs(a) - .7) / .9), ph = dir < 0 ? a : -a; lx = rx + dir * 2.2 * along * Math.cos(ph); ly = -4.5 + dir * 2.2 * along * Math.sin(ph); }
  return bodyPt(x, G, u, o, lx, ly);
}

// ---------- transitions ----------
// A whip pan: horizontal speed streaks cover the frame (p 0 → .5) and clear (p .5 → 1). Call it in both shots, in screen
// space after camEnd(), and cut under full cover at p = .5 (like brushWipe). dir 1 streaks toward the right.
function whip(p, cols = [FALL.gold, FALL.amber, '#F3D29A', FALL.rust], dir = 1) {
  if (p <= 0 || p >= 1) return;
  const n = 14, bh = H / n + 22;
  for (let i = 0; i < n; i++) {
    boilSeed('whip' + i);
    const y = i * H / n - 11, d = hash(i * 7.1) * .3;
    const q = p < .5 ? easeIn(clamp((p * 2 - d) / (1 - d))) * 1.02 : ease(clamp(((p - .5) * 2 - d) / (1 - d)));
    let x0 = p < .5 ? -300 : lerp(-300, W + 300, q), x1 = p < .5 ? lerp(-300, W + 300, q) : W + 300;
    if (dir < 0) [x0, x1] = [W - x1, W - x0];
    if (x1 - x0 < 20) continue;
    const c = cols[i % cols.length];
    paint(rectPts(x0, y, x1 - x0, bh), { wash: c, washOp: 255, fill: mixCol(c, PAL.cream, .3), fillOp: 90, bleed: .03, tex: .6, border: .3, ink: null });
    inkLine([[x0 + 60, y + bh * (.3 + .4 * hash(i))], [x1 - 60, y + bh * (.3 + .4 * hash(i + 5))]], 1.3, mixCol(c, PAL.ink, .35), 'dry', 0);
  }
}
