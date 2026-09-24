// artesian/lib.js: the pencil engine for "Artesian Water". Coloured pencil and graphite on toned paper, drawn with
// Canvas2D into one layer (X) that is laid over the kit's paper once per frame. The kit still owns time, shots, the
// paper grain and the renderer; this file replaces its watercolour brushes with a pencil hand.
//
//   camOn(cx, cy, zoom, rot) … camOff()   camera for X (world point lands at screen centre)
//   seed(key)                              boil seed for one element (wraps the kit's boilSeed)
//   pfill(pts, col, o)                     coloured-pencil fill: burnished tone + short hatching + graphite contour
//   pshade(pts, col, dens, o)              hatching only: form shading, cast shadows, darks (o.cross for crosshatch)
//   plit(pts, dens, col)                   pale pencil highlight on the toned paper
//   pline(pts, w, col, o)                  graphite line: pressure taper, overshoot, gone over twice
//   ptone(pts, col, a)                     flat soft tone, no strokes (distant haze, big skies under hatching)
//   pglow(x, y, r, col, a)                 additive light (fire, lamps, sun, sparks), the one non-pencil mark
//   psmoke(x, y, r, col, a)                soft smudged graphite/pastel puff
//   lyricBand(t)                           the ballad, hand-lettered along the foot of the page (automatic)
//
// Every draw is a pure function of t. Use hash(i) for stable randomness, jit()/random() only for boil after seed(key).

// ---------- palette: drought (ochre, sienna) → night toil (teal, indigo) → water (cerulean, sap) ----------
const AP = {
  paper: '#E4D5B7', paperDk: '#CDB994', paperLt: '#F4ECDC',
  graphite: '#34302C', graphiteLt: '#6B6258',
  sienna: '#A0522D', rust: '#B5552B', ochre: '#D49A3A', straw: '#E6C675', bone: '#EFE4CC',
  sky: '#E8B872', skyHot: '#E9A15A', dust: '#C9A77A', earth: '#9C6B43', earthDk: '#6E4630', red: '#B8412B',
  teal: '#2F6B6E', tealDk: '#1E4A50', indigo: '#28335A', night: '#1C2438', lamp: '#F2C15E',
  denim: '#3E5C86', denimDk: '#2A3F60', skin: '#C88A5E', skinDk: '#8E5A3A', shirt: '#D8C49A', flannel: '#A8392C',
  water: '#4C8FB8', waterLt: '#9CCBE0', waterDk: '#2C5F86', sap: '#6F9A4A', leaf: '#4E7A3A', grass: '#9DB25A',
  iron: '#4A4744', ironLt: '#7C7770', brass: '#C4A04A', coal: '#2A2522', fire: '#E8702A', smoke: '#8A8580',
  timber: '#A57A4E', timberDk: '#6E4E30', pine: '#E2B652', wool: '#E9DFC6', hell: '#8E2A1E', ember: '#E0582A',
};
const HAND = -1.05;            // the artist's hatching direction (right-handed, ~60° from horizontal), used everywhere

// ---------- toned paper with visible tooth (replaces the kit's cream paper) ----------
makePaper = function () {
  const g = createGraphics(W, H); g.pixelDensity(1); const c = g.drawingContext, rnd = lcg(23);
  c.fillStyle = AP.paper; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 60; i++) { const x = rnd() * W, y = rnd() * H, r = 150 + rnd() * 420, gr = c.createRadialGradient(x, y, 0, x, y, r), a = .05 * rnd(); gr.addColorStop(0, `rgba(120,90,50,${a})`); gr.addColorStop(1, 'rgba(120,90,50,0)'); c.fillStyle = gr; c.fillRect(x - r, y - r, 2 * r, 2 * r); }
  for (let i = 0; i < 9000; i++) {
    const x = rnd() * W, y = rnd() * H, l = 2 + rnd() * 7, a = Math.PI / 2 + (rnd() - .5) * .5, dark = rnd() < .6;
    c.strokeStyle = dark ? `rgba(95,70,40,${.04 + rnd() * .06})` : `rgba(255,248,230,${.05 + rnd() * .08})`; c.lineWidth = 1;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke();
  }
  return g;
};
makeGrain = function () {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d'), rnd = lcg(9);
  const id = c.createImageData(W, H), d = id.data;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4, tooth = (Math.sin(x * 1.9 + Math.sin(y * .37) * 3) * .5 + .5) * (Math.sin(y * 2.3 + x * .11) * .5 + .5);
    const v = 255 - (rnd() < .5 ? rnd() * rnd() * 34 : 0) - tooth * 12;
    d[i] = v; d[i + 1] = v - 2; d[i + 2] = v - 6; d[i + 3] = 255;
  }
  c.putImageData(id, 0, 0);
  const g = c.createRadialGradient(W / 2, H / 2, H * .5, W / 2, H / 2, H * 1.1); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(110,80,50,.38)');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  return cv;
};

// ---------- the pencil layer ----------
let ARTG = null, X = null, ZOOM = 1, PCAM = null;
const seed = key => boilSeed(key);
function camOn(cx = W / 2, cy = H / 2, zoom = 1, rot = 0) {
  X.save(); X.translate(W / 2, H / 2); X.rotate(rot); X.scale(zoom, zoom); X.translate(-cx, -cy); ZOOM = zoom; PCAM = { cx, cy, zoom, rot };
}
function camOff() { X.restore(); ZOOM = 1; PCAM = null; }
function scr(x, y) {                                     // world → screen under the current camera
  if (!PCAM) return [x, y];
  const c = Math.cos(PCAM.rot), s = Math.sin(PCAM.rot), dx = (x - PCAM.cx) * PCAM.zoom, dy = (y - PCAM.cy) * PCAM.zoom;
  return [W / 2 + dx * c - dy * s, H / 2 + dx * s + dy * c];
}

// Stroke tiles: a tileable square of short pencil strokes in one colour, knocked back by paper tooth.
// kind 'h' = hatching in the hand direction, 'x' = the cross direction, 'v' = near-vertical, 's' = dense (for lines)
const TILE = 384, _tiles = {};
function strokeTile(col, kind) {
  const key = col + kind; if (_tiles[key]) return _tiles[key];
  const cv = document.createElement('canvas'); cv.width = cv.height = TILE; const c = cv.getContext('2d');
  let h = 7; for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) % 2147483646; const rnd = lcg(h + 1);
  c.strokeStyle = col; c.lineCap = 'round';
  if (kind === 's') {
    c.fillStyle = col; c.globalAlpha = .9; c.fillRect(0, 0, TILE, TILE);
  } else {
    const ang = kind === 'x' ? HAND + 1.3 : kind === 'v' ? -1.45 : HAND, n = 1300;
    for (let i = 0; i < n; i++) {
      const x = rnd() * TILE, y = rnd() * TILE, L = 12 + rnd() * 30, a = ang + (rnd() - .5) * .2, bow = (rnd() - .5) * 3;
      c.globalAlpha = .28 + rnd() * .55; c.lineWidth = .9 + rnd() * 1.6;
      const dx = Math.cos(a) * L / 2, dy = Math.sin(a) * L / 2;
      for (const ox of [-TILE, 0, TILE]) for (const oy of [-TILE, 0, TILE]) {
        const cx = x + ox, cy = y + oy; if (cx < -L || cx > TILE + L || cy < -L || cy > TILE + L) continue;
        c.beginPath(); c.moveTo(cx - dx, cy - dy); c.quadraticCurveTo(cx + bow, cy - bow, cx + dx, cy + dy); c.stroke();
      }
    }
  }
  c.globalAlpha = 1; c.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 5200; i++) { c.fillStyle = `rgba(0,0,0,${.3 + rnd() * .6})`; c.fillRect(rnd() * TILE, rnd() * TILE, 1 + rnd() * 2.2, 1 + rnd() * 1.4); }
  return (_tiles[key] = cv);
}
const _pats = {};
function pat(col, kind, still = false) {
  const key = col + kind; let p = _pats[key];
  if (!p) p = _pats[key] = X.createPattern(strokeTile(col, kind), 'repeat');
  // screen-constant stroke size under zoom; the texture shifts with the boil so the pencil "re-draws" 12x a second
  const b = still ? 0 : BOILN, s = 1 / ZOOM, ox = hash(b * 3.1 + key.length) * TILE, oy = hash(b * 5.7 + 1) * TILE;
  p.setTransform(new DOMMatrix([s, 0, 0, s, ox * s, oy * s]));
  return p;
}
function tracePath(pts, closed = true, curv = false) {
  const P = curv ? through(pts, 5) : pts; X.beginPath(); X.moveTo(P[0][0], P[0][1]);
  for (let i = 1; i < P.length; i++) X.lineTo(P[i][0], P[i][1]);
  if (closed) X.closePath();
}
// Coloured-pencil fill. o: tone (0..1 flat burnish, default .45), dens (0..1.6 hatch density, default .8),
// cross (0..1 crosshatch in o.dark), ink (contour colour, null = none), sw (contour weight), curv (smooth the outline),
// kind ('h' | 'v'), still (don't boil the texture: big backgrounds)
function pfill(pts, col, o = {}) {
  const tone = o.tone ?? .45, dens = o.dens ?? .8;
  tracePath(pts, true, o.curv);
  X.save();
  if (tone > 0) { X.globalAlpha = tone; X.fillStyle = col; X.fill(); }
  X.globalAlpha = Math.min(1, dens); X.fillStyle = pat(col, o.kind || 'h', o.still); X.fill();
  if (dens > 1) { X.globalAlpha = dens - 1; X.fillStyle = pat(col, 'x', o.still); X.fill(); }
  if (o.cross) { X.globalAlpha = o.cross; X.fillStyle = pat(o.dark || mixCol(col, AP.graphite, .5), 'x', o.still); X.fill(); }
  X.restore();
  if (o.ink !== null) pline(pts, o.sw ?? 1.6, o.ink || AP.graphite, { closed: true, curv: o.curv, j: o.j });
}
// Hatching only, no tone. dens 0..2 (over 1 adds the cross direction).
function pshade(pts, col = AP.graphite, dens = .7, o = {}) {
  tracePath(pts, true, o.curv); X.save();
  X.globalAlpha = Math.min(1, dens); X.fillStyle = pat(col, o.kind || 'h', o.still); X.fill();
  if (dens > 1) { X.globalAlpha = Math.min(1, dens - 1); X.fillStyle = pat(col, 'x', o.still); X.fill(); }
  X.restore();
}
const plit = (pts, dens = .7, col = AP.paperLt, o = {}) => pshade(pts, col, dens, o);
function ptone(pts, col, a = .5, o = {}) { tracePath(pts, true, o.curv); X.save(); X.globalAlpha = a; X.fillStyle = col; X.fill(); X.restore(); }
// Graphite line. o: closed, curv (smooth), j (boil jitter px, default 1.1), over (overshoot px on open lines),
// passes (1 or 2), taper (0..1: how thin the ends get), alpha
function pline(pts, w = 1.6, col = AP.graphite, o = {}) {
  if (!pts || pts.length < 2) return;
  const closed = !!o.closed, j = o.j ?? 1.1, passes = o.passes ?? (w >= 1 ? 2 : 1), taper = o.taper ?? .55;
  let P = o.curv ? through(pts, 4) : pts.slice();
  if (closed) P = P.concat([P[0]]);
  else if ((o.over ?? 5) > 0 && P.length >= 2) {           // overshoot the ends a little, like a quick hand
    const ov = o.over ?? 5, e = (a, b) => { const dx = a[0] - b[0], dy = a[1] - b[1], d = Math.hypot(dx, dy) || 1; return [a[0] + dx / d * ov, a[1] + dy / d * ov]; };
    P = [e(P[0], P[1]), ...P.slice(1, -1), e(P[P.length - 1], P[P.length - 2])];
    if (pts.length === 2) P = [P[0], P[P.length - 1]];
  }
  X.save(); X.lineCap = 'round'; X.lineJoin = 'round'; X.strokeStyle = pat(col, 's');
  for (let pass = 0; pass < passes; pass++) {
    const off = pass ? 1.4 + w * .8 : 0, Q = P.map(p => [p[0] + jit(j + off), p[1] + jit(j + off)]), n = Q.length - 1;
    X.globalAlpha = (o.alpha ?? 1) * (pass ? .42 : .92);
    for (let i = 0; i < n; i++) {
      const k = closed ? .5 : (i + .5) / n, pr = 1 - taper * Math.pow(Math.abs(2 * k - 1), 2);
      X.lineWidth = Math.max(.6, w * 2.1 * pr * (pass ? .6 : 1));
      X.beginPath(); X.moveTo(Q[i][0], Q[i][1]); X.lineTo(Q[i + 1][0], Q[i + 1][1]); X.stroke();
    }
  }
  X.restore();
}
// Additive light: fire, lamps, the sun's blaze, sparks. Draw it before whatever stands in front of the light.
function pglow(x, y, r, col = AP.lamp, a = 1) {
  if (a <= 0 || r < 1) return;
  const c = color(col), g = X.createRadialGradient(x, y, 0, x, y, r);
  const rgb = `${red(c)},${green(c)},${blue(c)}`;
  g.addColorStop(0, `rgba(${rgb},${.55 * a})`); g.addColorStop(.3, `rgba(${rgb},${.25 * a})`); g.addColorStop(1, `rgba(${rgb},0)`);
  X.save(); X.globalCompositeOperation = 'lighter'; X.fillStyle = g; X.fillRect(x - r, y - r, 2 * r, 2 * r); X.restore();
}
// Smudged puff (steam, smoke, dust): soft tone with a scribbled edge.
function psmoke(x, y, r, col = AP.smoke, a = .5) {
  if (a <= 0 || r < 2) return;
  const g = X.createRadialGradient(x, y, 0, x, y, r), c = color(col), rgb = `${red(c)},${green(c)},${blue(c)}`;
  g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(.65, `rgba(${rgb},${a * .55})`); g.addColorStop(1, `rgba(${rgb},0)`);
  X.save(); X.fillStyle = g; X.beginPath(); X.arc(x, y, r, 0, TAU); X.fill(); X.restore();
  pshade(ellPts(x, y, r * .8, r * .7, 14, r * .08), col, a * .9, { kind: 'x' });
}

// ---------- shapes & helpers for chapters ----------
const P2 = (x, y) => [x, y];
const rot2 = (p, a, o = [0, 0]) => { const c = Math.cos(a), s = Math.sin(a), dx = p[0] - o[0], dy = p[1] - o[1]; return [o[0] + dx * c - dy * s, o[1] + dx * s + dy * c]; };
const add2 = (a, b) => [a[0] + b[0], a[1] + b[1]];
const polar = (o, a, r) => [o[0] + Math.cos(a) * r, o[1] + Math.sin(a) * r];
const lerp2 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
// Outline around a path with a width per point (limbs, muscles, ropes that thicken): one closed shape.
function limb(P, ws, n = 4) {
  const C = through(P, n), m = C.length, L = [], R = [];
  const wAt = k => { const f = k * (ws.length - 1), i = Math.min(ws.length - 2, Math.floor(f)); return lerp(ws[i], ws[i + 1], f - i); };
  for (let i = 0; i < m; i++) {
    const a = C[Math.max(0, i - 1)], b = C[Math.min(m - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, w = wAt(i / (m - 1)) / 2;
    L.push([C[i][0] - dy / d * w, C[i][1] + dx / d * w]); R.push([C[i][0] + dy / d * w, C[i][1] - dx / d * w]);
  }
  return L.concat(R.reverse());
}
// Draw-on: the first k (0..1) of a polyline, for lines that sketch themselves in.
function partial(P, k) {
  if (k >= 1) return P; if (k <= 0) return [P[0], P[0]];
  let L = 0; const d = []; for (let i = 1; i < P.length; i++) { d.push(Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1])); L += d[i - 1]; }
  let want = L * k; const out = [P[0]];
  for (let i = 1; i < P.length; i++) { if (want > d[i - 1]) { out.push(P[i]); want -= d[i - 1]; } else { out.push(lerp2(P[i - 1], P[i], want / d[i - 1])); break; } }
  return out;
}

// ---------- transitions (screen space, after camOff) ----------
// Graphite scribble that covers the frame (p 0 → .5) and is rubbed away (p .5 → 1). Cut under full cover.
//   end of shot A:   if (lt > dur - .35) scribbleWipe((lt - (dur - .35)) / .7);
//   start of shot B: if (lt < .35) scribbleWipe(.5 + lt / .7);
function scribbleWipe(p, col = AP.graphite) {
  if (p <= 0 || p >= 1) return;
  seed('wipe');
  const cover = p < .5 ? easeOut(p * 2) : 1 - ease((p - .5) * 2), n = 26;
  X.save(); X.lineCap = 'round'; X.strokeStyle = pat(col, 's');
  for (let i = 0; i < n; i++) {
    const y = -60 + (H + 120) * i / (n - 1), dir = i % 2 ? -1 : 1, reach = clamp(cover * 1.35 - hash(i * 7) * .35);
    if (reach <= 0) continue;
    const x0 = dir > 0 ? -80 : W + 80, x1 = lerp(x0, W + 80 - x0 + (dir > 0 ? 0 : -80), reach);
    X.globalAlpha = .9; X.lineWidth = 70 + 30 * hash(i);
    X.beginPath(); X.moveTo(x0, y + jit(6)); X.quadraticCurveTo((x0 + x1) / 2, y + 30 * Math.sin(i * 1.3) + jit(8), x1, y + jit(6)); X.stroke();
  }
  X.restore();
  pshade(rectPts(-40, -40, W + 80, H + 80), AP.graphite, cover * 1.2);
}
// Paper wipe: a sheet of blank paper slides across (like turning a sketchbook page). dir +1 = left→right.
function pageTurn(p, dir = 1) {
  if (p <= 0 || p >= 1) return;
  // the sheet slides in until it covers the whole frame at p = .5 (cut there), then carries on out the far side
  const x = p < .5 ? (dir > 0 ? lerp(-W - 60, -20, easeIn(p * 2)) : lerp(W + 60, -20, easeIn(p * 2))) : (dir > 0 ? lerp(-20, W + 60, easeOut((p - .5) * 2)) : lerp(-20, -W - 100, easeOut((p - .5) * 2)));
  const edge = (dir > 0) === (p < .5) ? x + W + 40 : x;
  X.save(); X.fillStyle = AP.paper; X.fillRect(x, -20, W + 40, H + 40);
  X.globalAlpha = .9; X.drawImage(paperG.elt, 0, 0, W, H, x, 0, W + 40, H); X.restore();
  pline([[edge, -20], [edge + 8, H / 2], [edge, H + 20]], 1.2, AP.graphiteLt);
}
// Fade to/from blank paper (pencil lines "lifting" off the page).
function paperFade(k) { if (k <= 0) return; X.save(); X.globalAlpha = clamp(k); X.drawImage(paperG.elt, 0, 0); X.restore(); }

// ---------- lyric band: the ballad hand-lettered along the foot of the page ----------
const BAND_TOP = 902, BAND_Y = 968;   // keep story action above ~y 890
let TEXT_TOOTH = null, TXT = null;
function lyricAt(t) { let i = -1; for (let k = 0; k < LYRICS.length; k++) if (t >= LYRICS[k].start - .35) i = k; return i; }
function lyricBand(t) {
  if (window.NO_BAND) return;
  X.setTransform(1, 0, 0, 1, 0, 0); ZOOM = 1;
  seed('band');
  const pts = []; for (let k = 0; k <= 30; k++) pts.push([lerp(-40, W + 40, k / 30), BAND_TOP + 9 * Math.sin(k * 1.7) + 7 * hash(k * 3.1)]);
  // the strip: clean paper torn along the top edge, with a faint shadow under the tear
  tracePath(pts.concat([[W + 40, H + 40], [-40, H + 40]])); X.save(); X.clip();
  X.drawImage(paperG.elt, 0, 0); X.globalAlpha = .55; X.fillStyle = AP.paperLt; X.fillRect(0, BAND_TOP - 30, W, H); X.restore();
  pline(pts.map(p => [p[0], p[1] + 1]), .8, AP.graphiteLt, { over: 0, passes: 1, j: .6 });
  const c = TXT.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H);
  const draw = (txt, k, alpha, y, size, col, font) => {
    if (k <= 0 || alpha <= 0) return;
    c.save(); c.font = `${size}px ${font}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    let s = size; while (c.measureText(txt).width > 1760 && s > 30) { s -= 2; c.font = `${s}px ${font}`; }
    const tw = c.measureText(txt).width, x0 = W / 2 - tw / 2;
    c.beginPath(); c.rect(x0 - 30, y - s, (tw + 60) * k, s * 2); c.clip();
    const bx = (hash(BOILN * 1.3) - .5) * 1.6, by = (hash(BOILN * 2.1 + 4) - .5) * 1.6;
    c.globalAlpha = alpha; c.fillStyle = col; c.fillText(txt, W / 2 + bx, y + by);
    c.globalAlpha = alpha * .35; c.fillText(txt, W / 2 + bx + 1, y + by - .8);
    c.restore();
  };
  const i = lyricAt(t);
  if (i < 0) draw('ARTESIAN  WATER', easeOut(seg(t, .5, 3)), 1, BAND_Y, 80, AP.graphite, '"Cabin Sketch", serif');
  else {
    const L = LYRICS[i], sungEnd = Math.min(L.end, L.start + Math.max(1.4, (L.end - L.start) * .78));
    // the old line lifts and fades just before the new one starts writing, so the two never overlap
    const k = easeOut(seg(t, L.start - .08, sungEnd)), fin = i >= 54 && i <= 58, chorus = /^(Sinking|Oh we'll sink)/.test(L.text);
    if (i > 0 && t < L.start - .05) { const P0 = LYRICS[i - 1], q = seg(t, L.start - .35, L.start - .05), f0 = i - 1 >= 54 && i - 1 <= 58, c0 = /^(Sinking|Oh we'll sink)/.test(P0.text);
      draw(P0.text, 1, 1 - q, BAND_Y - 26 * q, f0 ? 68 : c0 ? 64 : 58, f0 ? AP.rust : c0 ? AP.earthDk : AP.graphite, f0 || c0 ? '"Kalam Bold", cursive' : '"Kalam", cursive'); }
    draw(L.text, k, 1, BAND_Y, fin ? 68 : chorus ? 64 : 58, fin ? AP.rust : chorus ? AP.earthDk : AP.graphite, fin || chorus ? '"Kalam Bold", cursive' : '"Kalam", cursive');
  }
  c.save(); c.globalCompositeOperation = 'destination-out'; c.drawImage(TEXT_TOOTH, 0, 0); c.restore();
  X.drawImage(TXT, 0, 0);
}
function makeTextTooth() {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d'), rnd = lcg(31);
  for (let i = 0; i < 30000; i++) { c.fillStyle = `rgba(0,0,0,${.25 + rnd() * .5})`; c.fillRect(rnd() * W, 880 + rnd() * 200, 1 + rnd() * 2, 1 + rnd() * 1.5); }
  return cv;
}

// ---------- hook into the kit ----------
const _setup = setup;
setup = async function () {
  await _setup();
  window.ready = false;
  ARTG = createGraphics(W, H); ARTG.pixelDensity(1); X = ARTG.drawingContext;
  TXT = document.createElement('canvas'); TXT.width = W; TXT.height = H; TEXT_TOOTH = makeTextTooth();
  const faces = [['Kalam', 'Kalam-Regular.ttf'], ['Kalam Bold', 'Kalam-Bold.ttf'], ['Cabin Sketch', 'CabinSketch-Bold.ttf']];
  await Promise.all(faces.map(async ([n, f]) => { const ff = new FontFace(n, `url(assets/fonts/${f})`); await ff.load(); document.fonts.add(ff); }));
  window.ready = true;
};
drawWorld = function (t) {
  X.setTransform(1, 0, 0, 1, 0, 0); X.clearRect(0, 0, W, H); X.globalAlpha = 1; X.globalCompositeOperation = 'source-over'; ZOOM = 1; PCAM = null;
  if (window.LOOP) window.LOOP(t);
  else {
    let i = 0; while (i + 1 < SHOTS.length && t >= SHOTS[i + 1][0]) i++;
    if (SHOTS.length) { const t0 = SHOTS[i][0], end = i + 1 < SHOTS.length ? SHOTS[i + 1][0] : DUR; SHOTS[i][1](t, t - t0, end - t0); }
  }
  X.setTransform(1, 0, 0, 1, 0, 0); ZOOM = 1; PCAM = null;
  if (!window.LOOP || window.LOOP.lyrics) lyricBand(t);
  push(); resetMatrix(); translate(-W / 2, -H / 2); image(ARTG, 0, 0); pop();
};
