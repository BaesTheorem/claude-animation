// artesian/set.js: the places and machines, shared by every chapter so they stay on model.
//
//   sky(top, bottom, o)                   full-frame sky in two bands of pencil (o.y0/o.y1 band limits, o.hatch)
//   sun(x, y, r, heat)                    the drought sun; heat 0..1 adds a blaze and shimmer rings
//   plain(yH, col, o)                     ground from horizon yH down; o.cracks draws dried-mud cracks
//   cracks(x0, y0, x1, y1, key, k)        crazed mud (k 0..1 how dry)
//   tree(x, y, s, o)                      gidgee/coolibah: o.dead, o.leaf 0..1, o.sway, o.col
//   sheep(x, y, s, o)                     o.flip, o.walk (phase), o.graze 0..1, o.thin 0..1, o.down (lying), o.drink
//   skull(x, y, s, o)                     cattle skull on the ground; o.grass 0..1 grows grass through it
//   crow(x, y, s, flap, o)
//   windmill(x, y, s, spin, o)            stock windmill; spin = blade angle (still in the drought)
//   derrick(x, y, h, o)                   timber tower; x,y = centre of the floor; returns { top, floor, hole }
//   beam(x, y, s, ph, o)                  walking beam on its samson post; ph = stroke phase (0..1 per blow)
//   rods(x, y0, y1, o)                    the yellow pine rod string (o.bend 0..1, o.sway)
//   engine(x, y, s, o)                    Glasgow portable steam engine; o.ph (flywheel phase), o.fire, o.gauge 0..1,
//                                         o.shake, o.whistle 0..1, o.smoke, o.strain; returns { stack, whistle, door, fly }
//   section(x, depthTop, depthBot, o)     cross-section of the earth under the bore at world x (FT px per foot)
//   ruler(x, depthTop, depthBot, depth)   depth scale down the side of a section, with the bit's depth marked
//   bit(x, y, s, o)                       the chisel bit at the end of the rods; o.hit 0..1 flashes an impact
//   spout(x, y, h, t, o)                  the artesian flow: a water column, spray and falling drops
//   stream(P, w, t, o)                    running water along a path (bore drain, channel)
//
// Depth in the section: world y = depth(ft) * FT. The surface is y = 0.

const FT = 1.2;
// ---------- sky & land ----------
function sky(top, bottom, o = {}) {
  const y0 = o.y0 ?? -60, y1 = o.y1 ?? 960;
  seed('sky');
  const g = X.createLinearGradient(0, y0, 0, y1), a = o.tone ?? .6;
  g.addColorStop(0, top); g.addColorStop(o.split ?? .6, bottom); g.addColorStop(1, bottom);
  X.save(); X.globalAlpha = a; X.fillStyle = g; X.fillRect(-4000, y0, 8000 + W, y1 - y0 + 60); X.restore();
  pshade(rectPts(-80, y0, W + 160, (y1 - y0) * .6), top, (o.hatch ?? .8) * .7, { still: o.still });
  pshade(rectPts(-80, y0, W + 160, y1 - y0 + 60), bottom, (o.hatch ?? .8) * .4, { still: o.still, kind: 'v' });
}
function sun(x, y, r, heat = 0) {
  seed('sun');
  pglow(x, y, r * (3 + heat * 2), AP.lamp, .5 + heat * .5);
  pfill(ellPts(x, y, r, r, 30, r * .03), AP.bone, { tone: .85, dens: .5, ink: AP.ochre, sw: 1.2 });
  if (heat > 0) for (let i = 0; i < 3; i++) pline(ellPts(x, y, r * (1.35 + i * .35 + frac(T * .6 + i / 3) * .3), r * (1.35 + i * .35 + frac(T * .6 + i / 3) * .3), 26, r * .05), 1, AP.ochre, { closed: true, alpha: heat * (1 - frac(T * .6 + i / 3)), passes: 1 });
}
function plain(yH, col = AP.dust, o = {}) {
  seed('plain');
  const pts = []; for (let k = 0; k <= 16; k++) pts.push([lerp(-80, W + 80, k / 16), yH + 6 * Math.sin(k * 1.9 + (o.ph || 0)) + 4 * hash(k + (o.ph || 0))]);
  pts.push([W + 80, 1100], [-80, 1100]);
  pfill(pts, col, { tone: o.tone ?? .6, dens: o.dens ?? .8, ink: null, still: o.still });
  pshade(pts.map(p => [p[0], p[1] + 60]), o.dark || mixCol(col, AP.earthDk, .5), .55, { kind: 'x' });
  pline(pts.slice(0, 17), 1.1, AP.graphiteLt, { over: 0, passes: 1 });
  if (o.cracks) cracks(-80, yH + 40, W + 80, 900, 'plain', o.cracks);
}
function cracks(x0, y0, x1, y1, key, k = 1) {
  // a connected crazed network: jittered lattice (rows squeezed toward the horizon), edges drawn right and down
  seed('cr' + key);
  const rows = 8, cols = 16, pt = (r, c) => { const i = r * 97 + c * 13, v = Math.pow(r / rows, 1.5);
    return [lerp(x0, x1, (c + (r % 2) * .5) / cols) + (hash(i) - .5) * (x1 - x0) / cols * 1.1, lerp(y0, y1, v) + (hash(i + 5) - .5) * (y1 - y0) / rows * (.25 + v * .9)]; };
  for (let r = 0; r <= rows; r++) for (let c = 0; c <= cols; c++) {
    const p = pt(r, c), w = .6 + r / rows * 1.2, i = r * 31 + c;
    if (c < cols && hash(i * 3) < k * .85) pline([p, lerp2(p, pt(r, c + 1), .5).map((v, j) => v + (hash(i + j) - .5) * 8), pt(r, c + 1)], w, AP.earthDk, { passes: 1, over: 0, j: .6 });
    if (r < rows && hash(i * 7) < k * .9) pline([p, lerp2(p, pt(r + 1, c + (r % 2 ? 1 : 0)), .5).map((v, j) => v + (hash(i * 2 + j) - .5) * 14), pt(r + 1, c + (r % 2 ? 1 : 0))], w, AP.earthDk, { passes: 1, over: 0, j: .6 });
  }
}
function tree(x, y, s, o = {}) {
  seed('tree' + (o.key ?? x));
  const sw = o.sway ? Math.sin(T * 1.3 + x) * .03 * o.sway : 0, dead = o.dead, bark = o.col || (dead ? '#8C7A66' : AP.timberDk);
  const trunk = [[x - .3 * s, y], [x - .18 * s, y - 2 * s], [x - .35 * s, y - 3.4 * s], [x + .05 * s, y - 3.6 * s], [x + .25 * s, y - 2.2 * s], [x + .35 * s, y]];
  const br = (a, l, d, P) => { if (d > 3) return; const q = polar(P, a + sw, l); pline([P, q], Math.max(.6, 2.4 - d * .6) * s / 40, bark, { over: 0 }); br(a - .5 - hash(l) * .3, l * .66, d + 1, q); br(a + .4 + hash(l * 2) * .3, l * .62, d + 1, q); };
  if (!dead && (o.leaf ?? 1) > 0) for (let i = 0; i < 7; i++) {
    const cx = x + (hash(i * 3 + x) - .5) * 3.4 * s + sw * 60, cy = y - 3.8 * s - hash(i * 5 + x) * 1.6 * s, r = s * (.9 + hash(i + x) * .7) * (o.leaf ?? 1);
    pfill(ellPts(cx, cy, r * 1.3, r * .75, 12, r * .08), o.leafCol || AP.leaf, { tone: .5, dens: 1.1, sw: .8, ink: mixCol(o.leafCol || AP.leaf, AP.graphite, .5) });
  }
  pfill(trunk, bark, { tone: .6, dens: 1, sw: 1.1, curv: true });
  br(-1.9, s * 1.6, 1, [x - .2 * s, y - 3.4 * s]); br(-1.2, s * 1.5, 1, [x + .1 * s, y - 3.5 * s]);
}
function sheep(x, y, s, o = {}) {
  seed('sheep' + (o.key ?? x));
  const d = o.flip ? -1 : 1, th = o.thin || 0, wl = o.walk ?? 0, g = o.graze || 0;
  if (o.down) {   // lying, finished
    pfill(ellPts(x, y - .5 * s, 1.6 * s, .6 * s, 14, .08 * s), mixCol(AP.wool, AP.dust, .4), { tone: .5, sw: .9 });
    pline([[x + d * 1.3 * s, y - .3 * s], [x + d * 2.1 * s, y - .1 * s], [x + d * 2.4 * s, y]], 1.2, AP.graphite, { curv: true });
    for (const k of [-.6, .3]) pline([[x + k * s, y - .2 * s], [x + (k + .9) * s * d, y + .05 * s]], .9, AP.graphite);
    return;
  }
  for (const [lx, ph] of [[-.9, 0], [-.6, .5], [.8, .5], [1.05, 0]]) {
    const sw = Math.sin((wl + ph) * TAU) * .25 * s * (o.walk != null ? 1 : 0);
    pline([[x + d * lx * s, y - 1.1 * s], [x + d * (lx * s + sw), y]], 1.2, AP.graphite, { over: 0 });
  }
  const body = []; for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, r = 1 + .12 * Math.sin(i * 2.7) * (1 - th); body.push([x + Math.cos(a) * 1.5 * s * r * (1 - th * .25), y - 1.5 * s + Math.sin(a) * .75 * s * r * (1 - th * .3)]); }
  pfill(body, mixCol(AP.wool, AP.dust, th * .6), { tone: .55, dens: .7, sw: 1, curv: true, kind: 'x' });
  if (th > .3) for (let i = 0; i < 4; i++) pline([[x + (i - 1.5) * .35 * s, y - 2 * s], [x + (i - 1.5) * .35 * s - .1 * s, y - 1.2 * s]], .7, AP.graphiteLt);
  const hx = x + d * 1.7 * s, hy = y - (1.8 - g * 1.3) * s + (o.drink ? .6 * s : 0);
  pfill([[hx - d * .35 * s, hy - .35 * s], [hx + d * .35 * s, hy - .25 * s], [hx + d * .55 * s, hy + .2 * s], [hx + d * .2 * s, hy + .35 * s], [hx - d * .25 * s, hy + .15 * s]], '#3C3430', { tone: .8, dens: 1, sw: .9, curv: true });
  pline([[hx - d * .1 * s, hy - .25 * s], [hx - d * .45 * s, hy - .05 * s]], 1.4, '#3C3430');
}
function skull(x, y, s, o = {}) {
  seed('skull' + x);
  if (o.grass) for (let i = 0; i < 9; i++) { const gx = x + (i - 4) * .35 * s, h = s * (.6 + hash(i) * 1.4) * o.grass; pline([[gx, y], [gx + Math.sin(T * 1.5 + i) * .12 * s, y - h]], 1, AP.sap, { over: 0 }); }
  pfill([[x - .6 * s, y - .5 * s], [x + .6 * s, y - .5 * s], [x + .45 * s, y + .1 * s], [x + .2 * s, y + .25 * s], [x - .2 * s, y + .25 * s], [x - .45 * s, y + .1 * s]], AP.bone, { tone: .8, dens: .5, sw: 1, curv: true });
  for (const sd of [-1, 1]) {
    pfill(ellPts(x + sd * .25 * s, y - .25 * s, .12 * s, .1 * s, 8), AP.graphite, { tone: .9, ink: null });
    pfill(limb([[x + sd * .55 * s, y - .5 * s], [x + sd * 1.1 * s, y - .8 * s], [x + sd * 1.25 * s, y - 1.2 * s]], [.22 * s, .15 * s, .05 * s]), AP.bone, { tone: .8, sw: .9 });
  }
}
function crow(x, y, s, flap = 0, o = {}) {
  seed('crow' + (o.key ?? x));
  const d = o.flip ? -1 : 1, w = Math.sin(flap * TAU);
  pfill(ellPts(x, y, .9 * s, .38 * s, 10), AP.coal, { tone: .9, dens: 1, sw: .8 });
  pfill([[x + d * .8 * s, y - .25 * s], [x + d * 1.3 * s, y - .35 * s], [x + d * 1.45 * s, y - .2 * s], [x + d * 1.0 * s, y + .05 * s]], AP.coal, { tone: .9, sw: .8 });
  pline([[x + d * 1.45 * s, y - .22 * s], [x + d * 1.8 * s, y - .12 * s]], 1.2, AP.graphite);
  pfill([[x - d * .2 * s, y - .1 * s], [x - d * 1.1 * s, y - (.6 + w * .9) * s], [x - d * .4 * s, y - (.2 + w * .4) * s], [x + d * .3 * s, y - .05 * s]], AP.coal, { tone: .85, dens: 1, sw: .8 });
}
function windmill(x, y, s, spin = 0, o = {}) {
  seed('mill');
  for (const sd of [-1, 1]) pline([[x + sd * 1.2 * s, y], [x + sd * .15 * s, y - 7 * s]], 1.3, AP.iron);
  for (let k = 1; k < 6; k++) { const a = [x - 1.2 * s + k * .2 * s, y - k * 1.2 * s], b = [x + 1.2 * s - k * .2 * s, y - k * 1.2 * s]; pline([a, b], .7, AP.ironLt, { over: 2 }); }
  const hub = [x, y - 7.2 * s];
  for (let i = 0; i < 12; i++) { const a = spin + i / 12 * TAU; pfill([hub, polar(hub, a - .1, 2.4 * s), polar(hub, a + .12, 2.4 * s)], AP.ironLt, { tone: .5, dens: .6, sw: .7 }); }
  pfill([[x + .2 * s, y - 7.4 * s], [x + 2.6 * s, y - 7.6 * s], [x + 2.6 * s, y - 6.9 * s]], AP.iron, { tone: .6, sw: .8 });
  pfill(ellPts(...hub, .3 * s, .3 * s, 10), AP.iron, { tone: .9, sw: .8 });
}

// ---------- the rig ----------
function derrick(x, y, h, o = {}) {
  seed('derrick' + (o.key ?? ''));
  const wb = h * .3, wt = h * .07, top = [x, y - h], tc = o.col || AP.timber, tcd = mixCol(tc, AP.graphite, .35);
  const L = [[x - wb, y], [x - wt, y - h]], R = [[x + wb, y], [x + wt, y - h]], Lb = [[x - wb * .55, y - 8], [x - wt * .5, y - h]], Rb = [[x + wb * .55, y - 8], [x + wt * .5, y - h]];
  const at = (S, k) => lerp2(S[0], S[1], k);
  // far legs, then bracing, then near legs: flat 2D, depth by overlap and value
  for (const S of [Lb, Rb]) pfill(limb([S[0], S[1]], [h * .022, h * .016]), tcd, { tone: .6, dens: .8, sw: .8 });
  const n = o.bays ?? 7;
  for (let i = 0; i < n; i++) {
    const a = Math.pow(i / n, .9), b = Math.pow((i + 1) / n, .9);
    pline([at(L, a), at(R, a)], 1.3, tcd, { over: 3 });
    pline([at(L, a), at(R, b)], .9, tcd, { over: 2 }); pline([at(R, a), at(L, b)], .9, tcd, { over: 2 });
  }
  for (const S of [L, R]) pfill(limb([S[0], S[1]], [h * .03, h * .02]), tc, { tone: .65, dens: .9, sw: 1.1 });
  // crown block and sheave at the top, the floor at the base
  pfill(rectPts(x - wt * 1.8, y - h - h * .035, wt * 3.6, h * .045), tcd, { tone: .7, sw: 1 });
  pfill(ellPts(x, y - h - h * .012, h * .028, h * .028, 12), AP.iron, { tone: .8, sw: .9 });
  if (o.floor !== false) {
    pfill([[x - wb * 1.25, y - 4], [x + wb * 1.25, y - 4], [x + wb * 1.3, y + h * .035], [x - wb * 1.3, y + h * .035]], mixCol(tc, AP.straw, .2), { tone: .7, dens: .9, sw: 1.1 });
    for (let i = 1; i < 8; i++) pline([[x - wb * 1.25 + i * wb * 2.5 / 8, y - 3], [x - wb * 1.3 + i * wb * 2.6 / 8, y + h * .035]], .6, tcd, { over: 0, passes: 1 });
  }
  return { top, floor: [x, y], hole: [x, y], crown: [x, y - h - h * .012] };
}
function beam(x, y, s, ph = 0, o = {}) {
  // walking beam: pivot on the samson post at (x, y - 3s); the well end (left) rises then drops on the blow
  seed('beam');
  const lift = o.stuck ? .15 * Math.sin(ph * TAU * 3) : (ph < .7 ? easeOut(ph / .7) : 1 - easeIn((ph - .7) / .3)), ang = lerp(.16, -.16, lift) * (o.amp ?? 1);
  const pv = [x, y - 3 * s], wellEnd = polar(pv, Math.PI + ang, 4.2 * s), crankEnd = polar(pv, ang, 2.6 * s);
  pfill([[x - .5 * s, y], [x - .2 * s, y - 3 * s], [x + .2 * s, y - 3 * s], [x + .5 * s, y]], AP.timberDk, { tone: .7, sw: 1 });
  pfill(limb([wellEnd, pv, crankEnd], [.35 * s, .5 * s, .35 * s]), AP.timber, { tone: .7, dens: .9, sw: 1.2 });
  pfill(ellPts(...pv, .18 * s, .18 * s, 10), AP.iron, { tone: .9, sw: .8 });
  return { wellEnd, crankEnd, pivot: pv, lift };
}
function rods(x, y0, y1, o = {}) {
  seed('rods');
  const n = Math.max(3, Math.round((y1 - y0) / 40)), P = [];
  for (let i = 0; i <= n; i++) { const k = i / n, b = (o.bend || 0) * Math.sin(k * Math.PI * (o.waves || 2)) * 60 * Math.sin(T * 2); P.push([x + b + (o.sway || 0) * Math.sin(T * 3 + k * 6) * 4, lerp(y0, y1, k)]); }
  pfill(limb(P, P.map(() => o.w || 10)), o.col || AP.pine, { tone: .7, dens: .9, sw: .9 });
  for (let i = 1; i < n; i += 3) { const p = P[i]; pfill(rectPts(p[0] - (o.w || 10) * .9, p[1] - 4, (o.w || 10) * 1.8, 8), AP.iron, { tone: .9, sw: .6 }); }
  return P;
}
function engine(x, y, s, o = {}) {
  // x,y = ground under the middle of the boiler; faces right (stack right, firebox left). ~12s long, ~9s tall.
  seed('engine');
  const sh = o.shake ? shakeXY(T, o.shake * s * .12) : [0, 0], X0 = x + sh[0], Y0 = y + sh[1];
  const ph = o.ph || 0, bc = o.col || '#4F5A52', bcd = mixCol(bc, AP.graphite, .4);
  // wheels (behind)
  const wheel = (cx, r, far) => {
    pline(ellPts(cx, Y0 - r, r, r, 26), 1.4, far ? AP.ironLt : AP.iron, { closed: true });
    for (let i = 0; i < 8; i++) pline([[cx, Y0 - r], polar([cx, Y0 - r], ph * TAU * .3 + i / 8 * TAU, r)], .8, far ? AP.ironLt : AP.iron, { over: 0, passes: 1 });
    pfill(ellPts(cx, Y0 - r, r * .15, r * .15, 8), AP.iron, { tone: .9, sw: .6 });
  };
  wheel(X0 - 3.8 * s, 1.9 * s, false); wheel(X0 + 3.6 * s, 1.5 * s, false);
  // firebox (back), boiler barrel, smokebox (front)
  const by = Y0 - 4.2 * s;
  pfill(rectPts(X0 - 6 * s, by - 2.1 * s, 2.6 * s, 4.6 * s), bcd, { tone: .8, dens: 1, sw: 1.2 });
  pfill(rrPts(X0 - 3.6 * s, by - 1.5 * s, 8 * s, 3 * s, 1.2 * s), bc, { tone: .75, dens: .9, sw: 1.3 });
  for (let i = 0; i < 4; i++) pline([[X0 - 2.6 * s + i * 1.9 * s, by - 1.5 * s], [X0 - 2.6 * s + i * 1.9 * s, by + 1.5 * s]], 1, AP.brass, { over: 0, passes: 1 });
  plit([[X0 - 3.3 * s, by - 1.3 * s], [X0 + 4 * s, by - 1.3 * s], [X0 + 4 * s, by - .7 * s], [X0 - 3.3 * s, by - .7 * s]], .5);
  pfill(rectPts(X0 + 4.2 * s, by - 1.7 * s, 1.6 * s, 3.4 * s), bcd, { tone: .8, dens: 1, sw: 1.2 });
  // firebox door + fire
  const door = [X0 - 4.7 * s, by + .8 * s], fire = o.fire ?? .5;
  pfill(rectPts(door[0] - .6 * s, door[1] - .5 * s, 1.2 * s, 1 * s), AP.coal, { tone: .95, sw: 1 });
  if (fire > 0) { pglow(door[0], door[1], s * (1.5 + fire * 2.5), AP.fire, fire); pfill(rectPts(door[0] - .45 * s, door[1] - .35 * s, .9 * s, .7 * s), AP.ember, { tone: .5 + fire * .4, dens: .6, ink: null }); }
  // stack and smoke
  const stackTop = [X0 + 5 * s, by - 6.4 * s];
  pfill([[X0 + 4.6 * s, by - 1.7 * s], [X0 + 4.7 * s, stackTop[1]], [X0 + 5.3 * s, stackTop[1]], [X0 + 5.4 * s, by - 1.7 * s]], bcd, { tone: .85, sw: 1.1 });
  pfill(rectPts(X0 + 4.4 * s, stackTop[1] - .5 * s, 1.2 * s, .6 * s), AP.iron, { tone: .9, sw: 1 });
  // cylinder, piston rod, crank to flywheel (on top of the boiler)
  const fly = [X0 - 2 * s, by - 3.2 * s], fr = 2.3 * s, crank = polar(fly, ph * TAU, .7 * s);
  pfill(rectPts(X0 + .6 * s, by - 2.6 * s, 2.4 * s, 1.1 * s), AP.iron, { tone: .85, sw: 1 });
  pline([[X0 + .6 * s, by - 2.05 * s], crank], 1.8, AP.ironLt);
  pline(ellPts(...fly, fr, fr, 30), 2.4, AP.iron, { closed: true });
  pline(ellPts(...fly, fr * .88, fr * .88, 30), 1, AP.ironLt, { closed: true, passes: 1 });
  for (let i = 0; i < 6; i++) pline([fly, polar(fly, ph * TAU + i / 6 * TAU, fr * .9)], 1.1, AP.iron, { over: 0, passes: 1 });
  pfill(ellPts(...fly, .35 * s, .35 * s, 10), AP.brass, { tone: .9, sw: .8 });
  pline([[fly[0], fly[1]], [X0 - 1.6 * s, by - 1.4 * s], [X0 - 2.4 * s, by - 1.4 * s], fly], 1.2, AP.iron, { closed: true, passes: 1 });
  // gauge, whistle, safety valve on the firebox
  const gc = [X0 - 4.7 * s, by - 1.2 * s], ga = lerp(-2.4, .5, o.gauge ?? .4) + (o.shake ? Math.sin(T * 40) * .08 : 0);
  pfill(ellPts(...gc, .45 * s, .45 * s, 14), AP.bone, { tone: .9, sw: 1, ink: AP.brass });
  pshade([[gc[0], gc[1]], polar(gc, .2, .42 * s), polar(gc, .9, .42 * s)], AP.red, 1.2);
  pline([gc, polar(gc, ga, .38 * s)], 1.3, AP.graphite, { over: 0 });
  const wh = [X0 - 3.6 * s, by - 2.3 * s];
  pfill(rectPts(wh[0] - .15 * s, wh[1] - .9 * s, .3 * s, .9 * s), AP.brass, { tone: .9, sw: .8 });
  if (o.whistle) for (let i = 0; i < 6; i++) { const k = frac(T * 2.2 + i / 6); psmoke(wh[0] + (hash(i) - .5) * s * k, wh[1] - 1 * s - k * 7 * s * o.whistle, s * (.4 + k * 2.2) * o.whistle, AP.paperLt, .75 * (1 - k)); }
  if (o.smoke ?? 1) for (let i = 0; i < 5; i++) { const k = frac(ph * 2 + i / 5); psmoke(stackTop[0] - k * 3 * s + Math.sin(k * 5 + i) * s * .4, stackTop[1] - .6 * s - k * 5 * s, s * (.5 + k * 1.6), AP.smoke, .55 * (1 - k) * (o.smoke ?? 1)); }
  return { stack: stackTop, whistle: wh, door, fly, gauge: gc, boilerY: by };
}

// ---------- underground ----------
// Strata by depth (ft): [top, bottom, colour, pattern]. Pattern: 'soil' | 'clay' | 'sand' | 'shale' | 'coal' | 'rock' | 'granite' | 'aquifer'
const STRATA = [
  [0, 60, '#9C4A2E', 'soil'], [60, 420, '#C8924E', 'clay'], [420, 900, '#D9BF8A', 'sand'], [900, 1150, '#7A3A2A', 'hell'],
  [1150, 1800, '#6E7478', 'shale'], [1800, 2300, '#4A4440', 'coal'], [2300, 3100, '#7C6450', 'rock'], [3100, 4050, '#8A8A86', 'granite'],
  [4050, 5200, '#5C8FAE', 'aquifer'],
];
function section(x, d0, d1, o = {}) {
  const halfW = o.halfW ?? 2600;
  for (const [a, b, col, kind] of STRATA) {
    if (b < d0 || a > d1) continue;
    const y0 = a * FT, y1 = b * FT; seed('st' + a);
    const edge = k => [[x - halfW, y0 + 10 * Math.sin(k) + 8 * hash(a)], [x - halfW / 2, y0 - 6 + 12 * hash(a + 1)], [x, y0 + 8 * Math.sin(a)], [x + halfW / 2, y0 + 10 * hash(a + 2)], [x + halfW, y0 - 5]];
    const pts = [...edge(a), [x + halfW, y1 + 20], [x - halfW, y1 + 20]];
    const dimmed = o.water && kind === 'aquifer' ? AP.water : col;
    pfill(pts, dimmed, { tone: .62, dens: 1, ink: null, still: true, kind: kind === 'shale' ? 'x' : 'h', cross: kind === 'granite' || kind === 'rock' ? .5 : 0 });
    pline(edge(a), 1.2, AP.graphite, { over: 0 });
    // per-layer marks (stable: hash-placed)
    const cnt = Math.min(160, Math.round((y1 - y0) * halfW / 9000));
    for (let i = 0; i < cnt; i++) {
      const px = x - halfW + hash(i * 3.1 + a) * halfW * 2, py = y0 + 20 + hash(i * 7.3 + a) * (y1 - y0 - 30);
      if (Math.abs(px - x) < 40) continue;
      if (kind === 'sand' || kind === 'soil') pfill(ellPts(px, py, 3 + hash(i) * 4, 2 + hash(i) * 3, 6), mixCol(col, AP.graphite, .3), { tone: .7, ink: null });
      else if (kind === 'clay') pline([[px, py], [px + 40 + hash(i) * 60, py + (hash(i + 1) - .5) * 6]], .7, mixCol(col, AP.earthDk, .6), { passes: 1 });
      else if (kind === 'shale') pline([[px - 60, py], [px + 60, py + (hash(i + 1) - .5) * 4]], .8, '#3E4448', { passes: 1 });
      else if (kind === 'coal') pfill(ellPts(px, py, 20 + hash(i) * 30, 5 + hash(i) * 6, 8), AP.coal, { tone: .9, ink: null });
      else if (kind === 'rock' || kind === 'granite') pline([[px, py], [px + (hash(i) - .5) * 50, py + 20 + hash(i + 2) * 20], [px + (hash(i + 3) - .5) * 60, py + 40]], .8, '#3A3632', { passes: 1 });
      else if (kind === 'aquifer') { pfill(ellPts(px, py, 3 + hash(i) * 3, 3, 6), '#DDEEF3', { tone: .8, ink: null }); }
    }
  }
}
// The bore shaft through the section: a dark slot with the casing tube, from the surface to depth.
function shaft(x, depth, o = {}) {
  seed('shaft');
  const y1 = depth * FT, w = o.w ?? 34;
  pfill([[x - w / 2, -10], [x + w / 2, -10], [x + w / 2, y1], [x - w / 2, y1]], AP.coal, { tone: .85, dens: 1, ink: null });
  pline([[x - w / 2, -10], [x - w / 2 + jit(1), y1]], 1.4, AP.ironLt, { over: 0 }); pline([[x + w / 2, -10], [x + w / 2 + jit(1), y1]], 1.4, AP.ironLt, { over: 0 });
}
function ruler(x, d0, d1, depth = null, o = {}) {
  seed('ruler');
  const step = o.step ?? 100;
  pline([[x, Math.max(0, d0) * FT], [x, d1 * FT]], 1.4, AP.graphite, { over: 0 });
  for (let d = Math.max(0, Math.ceil(d0 / step) * step); d <= d1; d += step) {
    const big = d % 500 === 0, y = d * FT;
    pline([[x, y], [x + (big ? 34 : 16) / ZOOM, y]], big ? 1.4 : .8, AP.graphite, { over: 0, passes: 1 });
    if (big && d > 0) label(`${d} FT`, x + 44 / ZOOM, y, 34, AP.graphite, { screen: true });
  }
  if (depth != null) { const y = depth * FT; const z = 1 / ZOOM; pfill([[x - 6 * z, y], [x - 34 * z, y - 16 * z], [x - 34 * z, y + 16 * z]], AP.rust, { tone: .9, sw: 1 }); }
}
// Hand-lettered label in world space (used sparingly: the depth scale, a maker's plate).
function label(txt, x, y, size, col = AP.graphite, o = {}) {
  const [sx, sy] = scr(x, y), sz = o.screen ? size : size * ZOOM;
  X.save(); X.setTransform(1, 0, 0, 1, 0, 0); X.font = `${sz}px ${o.font || '"Cabin Sketch", serif'}`; X.textAlign = o.align || 'left'; X.textBaseline = 'middle';
  X.globalAlpha = o.alpha ?? .9; X.fillStyle = col; X.translate(sx, sy); X.rotate(o.rot || 0); X.fillText(txt, 0, 0); X.restore();
}
function bit(x, y, s, o = {}) {
  seed('bit');
  pfill([[x - .5 * s, y - 2.2 * s], [x + .5 * s, y - 2.2 * s], [x + .45 * s, y - .5 * s], [x, y], [x - .45 * s, y - .5 * s]], AP.iron, { tone: .85, dens: 1, sw: 1.1 });
  plit([[x - .3 * s, y - 2 * s], [x - .1 * s, y - 2 * s], [x - .15 * s, y - .6 * s]], .6);
  const h = o.hit || 0;
  if (h > 0) {
    pglow(x, y, s * 4 * h, AP.lamp, h);
    for (let i = 0; i < 9; i++) { const a = -Math.PI + (i / 8) * Math.PI, r = s * (1 + (1 - h) * 3); pline([[x + Math.cos(a) * s * .6, y + Math.sin(a) * -s * .2], [x + Math.cos(a) * r, y - Math.abs(Math.sin(a)) * r * .6]], 1.2, AP.lamp, { alpha: h, over: 0 }); }
    for (let i = 0; i < 6; i++) psmoke(x + (hash(i) - .5) * s * 3 * (1 - h + .3), y - s * (1 - h) * 2 * hash(i + 3), s * (.6 + (1 - h)), AP.dust, .6 * h);
  }
}
function spout(x, y, h, t, o = {}) {
  seed('spout');
  const w = o.w ?? 70, top = y - h, sway = Math.sin(t * 2.3) * 14, fl = o.flare ?? 2.2;
  // falling curtains either side first (behind the column)
  for (const sd of [-1, 1]) {
    const C = [[x + sway, top + 30], [x + sway + sd * w * 2.2, top - 10], [x + sd * w * 4.5, top + h * .35], [x + sd * w * 5.8, y + 20], [x + sd * w * 3.6, y + 20], [x + sd * w * 2.2, top + h * .5], [x + sway + sd * w * .6, top + 60]];
    pfill(C, AP.waterLt, { tone: .32, dens: .7, kind: 'v', ink: null, curv: true });
    for (let i = 0; i < 9; i++) { const k = frac(t * 1.1 + i / 9), px = x + sd * w * lerp(2, 5.4, hash(i * 3 + sd)), py = lerp(top + h * .2, y, k); pline([[px, py - 40], [px + sd * 4, py]], 1.1, '#EAF6FA', { over: 0, passes: 1, alpha: .8 }); }
  }
  const P = [[x - w / 2, y], [x - w * .55 + sway * .4, lerp(y, top, .55)], [x - w * fl / 2 + sway, top + 20], [x + sway - w * .2, top - 20], [x + sway + w * .3, top - 16], [x + w * fl / 2 + sway, top + 20], [x + w * .55 + sway * .4, lerp(y, top, .55)], [x + w / 2, y]];
  pfill(P, AP.water, { tone: .6, dens: 1, sw: 1.2, kind: 'v', curv: true });
  plit([[x - w * .18, y], [x - w * .12 + sway * .5, top + 40], [x + w * .05 + sway * .5, top + 40], [x, y]], .9, '#EAF6FA', { kind: 'v' });
  pglow(x + sway, top + h * .2, w * 3, '#CFEAF5', .35);
  for (let i = 0; i < (o.drops ?? 70); i++) {
    const k = frac(t * .7 + hash(i)), dir = hash(i * 3) < .5 ? -1 : 1, spread = (80 + hash(i * 5) * (o.spread ?? 420)) * dir;
    const p = arcPt([x + sway, top], [x + sway + spread, y + 40], -(100 + hash(i * 7) * 200), k);
    pline([p, [p[0] - dir * 4, p[1] - 16]], 1.4 + hash(i) * 1.6, k < .25 ? '#F2FAFC' : AP.waterLt, { over: 0, passes: 1 });
  }
  for (let i = 0; i < 9; i++) psmoke(x + sway + (hash(i) - .5) * w * 4, top - 20 + hash(i + 2) * 50 + Math.sin(t * 3 + i) * 8, w * (.8 + hash(i) * 1.1), '#E4F2F7', .5);
}
function stream(P, w, t, o = {}) {
  seed('stream' + (o.key ?? ''));
  const out = limb(P, P.map((_, i) => w * (o.taper ? lerp(1, o.taper, i / (P.length - 1)) : 1)));
  pfill(out, AP.water, { tone: .6, dens: .9, sw: 1, curv: true });
  const C = through(P, 6);
  for (let i = 0; i < (o.glints ?? 24); i++) {
    const k = frac(hash(i) + t * (o.speed ?? .15)), j = Math.floor(k * (C.length - 2)), p = C[j], q = C[j + 1], dx = q[0] - p[0], dy = q[1] - p[1], d = Math.hypot(dx, dy) || 1;
    const off = (hash(i * 3) - .5) * w * .6, cx = p[0] - dy / d * off, cy = p[1] + dx / d * off;
    pline([[cx, cy], [cx + dx / d * 18, cy + dy / d * 18]], 1.4, '#EAF6FA', { over: 0, passes: 1, alpha: Math.sin(k * Math.PI) });
  }
}

// ---------- the chorus dive (shared, so all eight choruses rhyme) ----------
// A camera fall down the bore through the strata to the bit, which strikes on every beat. Call from a shot:
//   dive(t, lt, dur, { from: 0, to: 600, hits: true, extra: (depthNow) => { ... world-space extras ... } })
// from/to are depths in ft for the camera over the shot (eased, with a small bounce each beat as the bit lands);
// bitDepth defaults to o.to. zoom (default .55). o.up: true reverses (water rushing up: see chapter G).
function dive(t, lt, dur, o = {}) {
  const k = o.k ?? ease(seg(lt, .2, dur - .3)), dCam = lerp(o.from ?? 0, o.to ?? 600, k), z = o.zoom ?? .55;
  const bitD = o.bitDepth ?? (o.to ?? 600), hit = o.hits === false ? 0 : pulse(t, 7);
  const bob = o.hits === false ? 0 : -18 * Math.exp(-frac(bpOf(t)) * 9);   // rods kick up and drop onto the rock each beat
  const cx = o.x ?? 960, sh = shakeXY(t, hit * 5);
  camOn(cx + sh[0], dCam * FT + (o.lead ?? 140) / z + sh[1], z);
  if (dCam * FT - 900 / z < 0) {   // near the surface: sky and the derrick silhouette above ground
    ptone(rectPts(cx - 2800, -3000, 5600, 3000), o.skyCol || AP.sky, .5); pshade(rectPts(cx - 2800, -3000, 5600, 3000), o.skyCol || AP.sky, .5, { still: true });
    derrick(cx, 0, 900, { floor: true, key: 'dive' });
  }
  section(cx, dCam - 1100 / z * .9 / FT, dCam + 1100 / z * .9 / FT, { water: o.water });
  if (o.extra) o.extra(dCam, bitD);
  shaft(cx, bitD);
  rods(cx, -40, bitD * FT - 50 + bob, { w: 14, bend: o.bend || 0, col: AP.pine });
  bit(cx, bitD * FT + bob, 34, { hit: o.hits === false ? 0 : hit });
  ruler(cx - 520, dCam - 1100 / z / FT, dCam + 1100 / z / FT, bitD);
  camOff();
}

// ---------- hand props (place with the joints man() returns) ----------
// Sledgehammer gripped at `grip` (the front hand), the handle running along angle `ang` (radians, screen space).
// The butt sits ~.9s behind the grip (where the back hand holds), the head ~3s ahead. Returns { head, butt }.
function sledge(grip, ang, s, o = {}) {
  seed('sledge' + (o.key ?? ''));
  const u = [Math.cos(ang), Math.sin(ang)], n = [-u[1], u[0]];
  const butt = [grip[0] - u[0] * .9 * s, grip[1] - u[1] * .9 * s], hd = [grip[0] + u[0] * (o.len ?? 3) * s, grip[1] + u[1] * (o.len ?? 3) * s];
  pfill(limb([butt, hd], [.24 * s, .28 * s]), AP.pine, { tone: .7, sw: .9 });
  const hw = .5 * s, hl = 1.0 * s, c = hd, q = (x, y) => [c[0] + n[0] * x + u[0] * y, c[1] + n[1] * x + u[1] * y];
  pfill([q(-hl, -hw), q(hl, -hw), q(hl, hw), q(-hl, hw)], AP.iron, { tone: .9, dens: 1, sw: 1.1 });
  plit([q(-hl * .8, -hw * .8), q(hl * .8, -hw * .8), q(hl * .8, -hw * .3), q(-hl * .8, -hw * .3)], .6);
  return { head: c, butt, strike: q(o.face ?? hl, 0) };
}
function lantern(x, y, s, lit = 1) {
  seed('lantern' + x);
  if (lit > 0) pglow(x, y, s * 9 * lit, AP.lamp, lit);
  pline([[x - .5 * s, y - 1.4 * s], [x, y - 2 * s], [x + .5 * s, y - 1.4 * s]], .9, AP.iron, { curv: true, over: 0 });
  pfill(rrPts(x - .55 * s, y - 1.2 * s, 1.1 * s, 1.9 * s, .3 * s), AP.lamp, { tone: .45 + lit * .4, dens: .4, sw: 1, ink: AP.iron });
  pfill(rectPts(x - .7 * s, y + .6 * s, 1.4 * s, .3 * s), AP.iron, { tone: .9, sw: .8 });
  pfill(rectPts(x - .5 * s, y - 1.45 * s, 1 * s, .3 * s), AP.iron, { tone: .9, sw: .8 });
}
// Pipe tongs: a long iron lever clamped to a pipe at c, the handle running out to h.
function tongs(c, h, s) {
  seed('tongs' + c[0]);
  pfill(limb([c, h], [.4 * s, .28 * s]), AP.iron, { tone: .85, dens: 1, sw: 1 });
  pfill(ellPts(c[0], c[1], .55 * s, .45 * s, 10), AP.ironLt, { tone: .8, sw: 1 });
}
