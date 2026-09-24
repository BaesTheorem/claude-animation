// Chapter B · 47.90–81.24 s · The devil's roof (verse 2 [9–13], chorus 2 [14–17]).
// See docs/artesian/STORYBOARD.md and BRIEF.md.
//
// GLOBALS defined here for other chapters (chapter G douses the devil when the water rushes up):
//
//   devil(x, y, s, pose, hooks) → J        the devil, side view, faces right (pose.flip faces left)
//     (x, y)  ground point under the hooves (like man()); seated (pose.sit = 1) the hooves still plant on y and the
//             hip sits DEV_SEAT * s above it, so a chair seat goes at y - DEV_SEAT * s.
//     s       head unit (he is ~6.3s tall standing, horns included; big head, pot belly, skinny shanks).
//     pose    DEV0 fields, all optional. Angles in radians, same conventions as man(): arms/legs 0 = hanging straight
//             down, + swings FORWARD; el/kn bend the elbow/knee; lean tilts the torso forward; head tilts the head
//             (+ chin down, - looks up).
//       face    'smug' | 'annoyed' | 'furious' | 'shock' | 'soaked'   (drives lids, brows, moustache, mouth)
//       look    -1..1 eyes back/forward     lookUp -1..1 eyes down/up     blink 0..1     mouth 0..1 opens further
//       sit     0 standing, 1 seated (thighs forward, shins down)
//       tail    -1..1 swish (lash it with a sin on the beat)     tailTip [f, u] optional: tail tip in s units from the
//               hip (f forward, u UP), e.g. [-1, 6] to rap on a ceiling
//       fistF / fistB   clench that hand      cup 0..1 teacup in the front hand (cupTilt radians, tea 0..1 level)
//       cupOnHorn 0..1  the teacup upside down on his near horn (wobble with cupWob)
//       dust 0..1  plaster dust on head and shoulders     soak 0..1  dripping wet (moustache droops, drips fall)
//       steam 0..1  steam from the ears (rage, or being doused)      shake 0..1 trembling      squash -1..1 (+ squat)
//       dx, dy  offset in s units (dy up: hops, leaps)
//     hooks   { behind(J), hold(J), front(J) } like man(): hold() is drawn between his body and the near arm.
//     J       { hip, neck, head, eye, nose, mouth, horn, hornFar, ear, handF, handB, elF, shF, tailTip, top, s, dir }
//
//   devilHall(x, y, s, o) → H              his parlour, a cavern in the 'hell' stratum of section()
//     (x, y)  the point on the cavern CEILING directly under the bore (the bit knocks here). The room runs 10.6s to
//             the left, 6.6s to the right and 5.2s down to the floor. In section() coordinates use
//             devilHall(960, HALL.y, HALL.s) (HALL below): ceiling ≈ 1018 ft, floor ≈ 1113 ft, inside 900–1150 ft.
//     o       devil: pose → draws him SEATED in his armchair (pose.sit is forced); leave it out to draw him yourself
//             (use H.ds as his s and H.floorY as his ground).    t: time for the fire flicker (default T)
//             lit 0..1 fire (default 1)    crack 0..1 cracks spreading from the bore point    hole 0..1 the roof
//             broken through at the bore    chair 'ok' | 'crushed'    lamp 0..1 swing of the lamp    wet 0..1 flood
//             water on the floor and steam (chapter G)    front(H) hook: drawn inside the room's clip, after the devil
//     H       { bore, floorY, ds, seat, chairX, devilAt, table, cupRest, fire, interior, clip() }
//             H.clip() clips to the room's interior (X.save() first, X.restore() after).
//
//   HALL = { x: 960, y, s }                where the hall sits under the bore in section() world coordinates
//   hallInDive(t, lt, dur, o, hallO)       dive() with the hall drawn through its extra hook AND patched back over the
//                                          shaft where the bore runs through the room (dive draws its shaft after
//                                          extra, which would otherwise slice a black slot through the parlour).
//                                          hallO(dCam) returns devilHall's o; hallO(..).after(H) draws on top.
//   teacup(x, y, s, o)                     bone china teacup; o.tilt (radians), o.tea 0..1, o.saucer
//
// Everything is a pure function of t.

// ------------------------------------------------------------------------------------------------------------------
// THE DEVIL
// ------------------------------------------------------------------------------------------------------------------
const DEV0 = { flip: false, sit: 0, lean: 0, head: 0, dx: 0, dy: 0,
  shF: .25, elF: .55, shB: -.12, elB: .35, hpF: .05, knF: .05, hpB: -.05, knB: .05,
  face: 'smug', look: 0, lookUp: 0, blink: 0, mouth: 0, tail: 0, tailTip: null,
  fistF: false, fistB: false, cup: 0, cupTilt: 0, tea: .8, cupOnHorn: 0, cupWob: 0,
  dust: 0, soak: 0, steam: 0, shake: 0, squash: 0 };
const DEVIL = { skin: '#C8321F', skinDk: '#7A1A10', skinLt: '#F08A60', vest: '#3B2436', vestDk: '#24141F', shirt: '#EDE2CB',
  pants: '#2E2830', hoof: '#221A1A', horn: '#E9DCBE', hornDk: '#9C8A68', hair: '#1D1517', eye: '#F6EAA8', tie: '#1D1517' };
const DEV_THIGH = 1.35, DEV_SHIN = 1.35, DEV_HOOF = .3, DEV_SEAT = DEV_SHIN + DEV_HOOF;
// per-face settings: lid (upper lid down 0..1), brow inner/outer (+ = lower, s units), stache curl, mouth open
const DEV_FACES = {
  smug:    { lid: .42, bi: .02, bo: -.14, arch: -.08, curl: 1, open: 0, pupil: 1 },
  annoyed: { lid: .5, bi: .12, bo: -.02, arch: 0, curl: .3, open: 0, pupil: 1 },
  furious: { lid: .08, bi: .2, bo: -.14, arch: .02, curl: -.4, open: .85, pupil: .7 },
  shock:   { lid: 0, bi: -.2, bo: -.2, arch: -.1, curl: -.8, open: .55, pupil: .55 },
  soaked:  { lid: .55, bi: -.04, bo: .1, arch: -.02, curl: -1, open: .05, pupil: 1 },
};

function teacup(x, y, s, o = {}) {
  // (x, y) = the cup's base; s = cup height. o.tilt rotates about the base, o.tea fill level, o.saucer draws one.
  const a = o.tilt || 0, R = (u, v) => add2([x, y], rot2([u * s, v * s], a)), sw = Math.max(.35, s / 16), j = s / 40;
  if (o.saucer) pfill([R(-.95, .02), R(.95, .02), R(.7, .16), R(-.7, .16)], '#F4EEE0', { tone: .85, dens: .5, sw, j, curv: true });
  const cup = [R(-.62, -1), R(.62, -1), R(.52, -.45), R(.3, -.05), R(-.3, -.05), R(-.52, -.45)];
  pfill(limb([R(.58, -.82), R(.98, -.72), R(.9, -.35), R(.5, -.33)], [.1 * s, .12 * s, .12 * s, .1 * s], 3), '#F4EEE0', { tone: .8, dens: .4, sw, j });
  pfill(cup, '#F6F0E2', { tone: .9, dens: .4, sw, j, curv: true });
  pline([R(-.6, -.9), R(.6, -.9)], sw * .8, AP.brass, { over: 0, j, passes: 1 });
  pfill(ellPts(...R(-.05, -.55), .13 * s, .11 * s, 8), '#B8412B', { tone: .8, dens: .8, ink: null });   // the little rose
  pline([R(-.12, -.45), R(.08, -.4)], sw * .6, AP.leaf, { over: 0, j, passes: 1 });
  if ((o.tea ?? .8) > 0 && Math.abs(a) < 1.2) pfill([R(-.6, -1 + .02), R(.6, -1 + .02), R(.55, -.95), R(-.55, -.95)], '#8A4A20', { tone: .9, dens: .6, ink: null });
}

function devil(x, y, s, pose = {}, hooks = {}) {
  const P = { ...DEV0, ...pose }, C = DEVIL, dir = P.flip ? -1 : 1, sq = P.squash || 0, F = DEV_FACES[P.face] || DEV_FACES.smug;
  const sw = Math.max(.25, s / 50), j = s / 60, ov = s / 14, wid = 1 + sq * .3;
  const fill = (pts, col, o = {}) => pfill(pts, col, { sw, j, ...o }), line = (pts, w, col, o = {}) => pline(pts, w, col, { j, over: ov, ...o });
  // ---- skeleton ----
  const sit = clamp(P.sit), hpF = lerp(P.hpF, 1.5, sit), knF = lerp(P.knF, 1.5, sit), hpB = lerp(P.hpB, 1.42, sit), knB = lerp(P.knB, 1.55, sit);
  const thigh = DEV_THIGH * s, shin = DEV_SHIN * s * (1 - sq * .15), up = 1.1 * s, fore = 1.05 * s, torsoL = 2.05 * s * (1 - sq * .22);
  const dv = (a, d) => [Math.sin(a) * d, Math.cos(a)];
  const legs = (hp, kn, side) => { const h0 = [dir * (side ? .18 : -.12) * s, 0], k = add2(h0, dv(hp, dir).map(v => v * thigh)), a = add2(k, dv(hp - kn, dir).map(v => v * shin)); return { h0, k, a }; };
  let LF = legs(hpF, knF, 1), LB = legs(hpB, knB, 0);
  const low = Math.max(LF.a[1], LB.a[1]) + DEV_HOOF * s, shk = P.shake ? shakeXY(T, P.shake * s * .07) : [0, 0];
  const ox = x + P.dx * s * dir + shk[0], oy = y - low - P.dy * s + shk[1], Tr = p => [p[0] + ox, p[1] + oy];
  LF = { h0: Tr(LF.h0), k: Tr(LF.k), a: Tr(LF.a) }; LB = { h0: Tr(LB.h0), k: Tr(LB.k), a: Tr(LB.a) };
  const hip = [ox, oy], lean = P.lean, uV = [Math.sin(lean) * dir, -Math.cos(lean)], fV = [Math.cos(lean) * dir, Math.sin(lean)];
  const at = (o, u, f) => [o[0] + uV[0] * u + fV[0] * f, o[1] + uV[1] * u + fV[1] * f];
  const neck = at(hip, torsoL, .1 * s);
  const shF = at(neck, -.38 * s, .12 * s), shB = at(neck, -.42 * s, -.28 * s);
  const arm = (sh, a1, e) => { const el = add2(sh, dv(a1, dir).map(v => v * up)), wr = add2(el, dv(a1 + e, dir).map(v => v * fore)), hand = add2(wr, dv(a1 + e, dir).map(v => v * .3 * s)); return { sh, el, wr, hand }; };
  const AF = arm(shF, P.shF, P.elF), AB = arm(shB, P.shB, P.elB);
  const ha = (P.lean * .35 + P.head) * dir, c = add2(neck, rot2([0, -.84 * s], ha));
  const R = (f, u) => add2(c, rot2([f * dir * s, u * s], ha));
  const J = { hip, neck, head: c, shF, shB, elF: AF.el, elB: AB.el, handF: AF.hand, handB: AB.hand, wrF: AF.wr, knF: LF.k, ankF: LF.a, s, dir,
    eye: R(.42, -.28), nose: R(1.1, .1), mouth: R(.62, .45), horn: R(.14, -1.7), hornFar: R(-.72, -1.6), ear: R(-.45, -.3), top: R(0, -1.7) };
  // ---- tail (behind everything) ----
  const tb = at(hip, .15 * s, -.75 * s * wid);
  let tip;
  if (P.tailTip) tip = add2(hip, [P.tailTip[0] * s * dir, -P.tailTip[1] * s]);
  else { const sweep = P.tail; tip = add2(tb, [(-1.5 - .25 * sweep) * dir * s * (1 - sit * .25), (-.5 - sweep * .75 + sit * .9) * s]); }
  const tmid = add2(lerp2(tb, tip, .5), [(-.35 * dir + P.tail * .3 * dir) * s, (.75 - Math.abs(P.tail) * .3) * s]);
  const tq = add2(lerp2(tmid, tip, .55), [-.25 * dir * s, -.3 * s]);
  J.tailTip = tip;
  if (hooks.behind) hooks.behind(J);
  seed('devtail' + x);
  const tailP = [tb, tmid, tq, tip];
  const tw = P.tailTip ? 1.5 : 1;
  fill(limb(tailP, [.2 * s * tw, .15 * s * tw, .11 * s * tw, .08 * s * tw], 5), C.skin, { tone: .7, dens: .8 });
  { // the spade
    const C2 = through(tailP, 5), a = C2[C2.length - 2], ang = Math.atan2(tip[1] - a[1], tip[0] - a[0]), Q = (u, v) => add2(tip, rot2([u * s, v * s], ang));
    fill([Q(-.05, 0), Q(.08, -.28), Q(.2, -.2), Q(.55, 0), Q(.2, .2), Q(.08, .28)], C.skin, { tone: .8, dens: 1, curv: false });
  }
  // ---- back arm, back leg ----
  seed('devbody' + x);
  const drawArm = (A, far, fist) => {
    const sc = far ? mixCol(C.shirt, AP.graphite, .3) : C.shirt;
    fill(limb([A.sh, lerp2(A.sh, A.el, .5), A.el, lerp2(A.el, A.wr, .6), A.wr], [.5, .46, .38, .36, .34].map(v => v * s)), sc, { tone: .75, dens: .6 });
    fill(limb([lerp2(A.el, A.wr, .72), A.wr], [.4 * s, .42 * s]), sc, { tone: .8, dens: .5 });                                   // cuff
    const hc = far ? mixCol(C.skin, AP.graphite, .3) : C.skin, fa = Math.atan2(A.hand[1] - A.wr[1], A.hand[0] - A.wr[0]), hs = .3 * s;
    if (fist) fill(ellPts(A.hand[0], A.hand[1], hs * 1.05, hs * .95, 10, 0, fa), hc, { tone: .8, dens: .8 });
    else {
      const hp = [[-.3, -.8], [.5, -.75], [1.2, -.4], [1.35, .05], [1.0, .3], [1.25, .6], [.5, .8], [-.2, .7]].map(([u, v]) => add2(A.hand, rot2([u * hs, v * hs * dir], fa)));
      fill(hp, hc, { tone: .8, dens: .8, curv: true });
    }
    // little black claws
    line([add2(A.hand, rot2([1.05 * hs, -.2 * hs * dir], fa)), add2(A.hand, rot2([1.35 * hs, -.05 * hs * dir], fa))], sw * .9, AP.graphite, { over: 0 });
  };
  const drawLeg = (G, far) => {
    const pc = far ? mixCol(C.pants, AP.graphite, .35) : C.pants;
    fill(limb([G.h0, lerp2(G.h0, G.k, .5), G.k, lerp2(G.k, G.a, .5), G.a], [.9, .6, .42, .3, .28].map(v => v * s)), pc, { tone: .8, dens: .9 });
    // pinstripes
    line([lerp2(G.h0, G.k, .15), lerp2(G.k, G.a, .9)], sw * .5, '#6A6070', { over: 0, passes: 1 });
    // cloven hoof, toe forward
    const a = G.a, hc = far ? '#120E0E' : C.hoof;
    fill([[a[0] - dir * .18 * s, a[1] - .08 * s], [a[0] + dir * .2 * s, a[1] - .08 * s], [a[0] + dir * .42 * s, a[1] + DEV_HOOF * s], [a[0] - dir * .24 * s, a[1] + DEV_HOOF * s]], hc, { tone: .9, dens: 1 });
    line([[a[0] + dir * .16 * s, a[1] + .05 * s], [a[0] + dir * .2 * s, a[1] + DEV_HOOF * s]], sw * .7, AP.paperLt, { over: 0, passes: 1 });
  };
  drawArm(AB, true, P.fistB);
  drawLeg(LB, true);
  // ---- torso: shirt, waistcoat, bow tie ----
  const bel = 1 + sq * .25;
  const body = [at(hip, -.3 * s, -.62 * s * wid), at(hip, .9 * s, -.78 * s * wid), at(neck, -.6 * s, -.55 * s * wid), at(neck, 0, -.3 * s), at(neck, .05 * s, .3 * s),
    at(neck, -.5 * s, .62 * s * wid), at(hip, 1.0 * s, 1.32 * s * bel * wid), at(hip, .3 * s, 1.18 * s * bel * wid), at(hip, -.3 * s, .6 * s * wid)];
  fill(body, C.shirt, { tone: .8, dens: .6, curv: true });
  const vest = [at(hip, -.38 * s, -.66 * s * wid), at(hip, .9 * s, -.8 * s * wid), at(neck, -.6 * s, -.57 * s * wid), at(neck, -.12 * s, -.28 * s), at(neck, -.3 * s, .12 * s),
    at(neck, -1.05 * s, .64 * s * wid), at(hip, .9 * s, 1.34 * s * bel * wid), at(hip, .25 * s, 1.2 * s * bel * wid), at(hip, -.38 * s, .62 * s * wid)];
  fill(vest, C.vest, { tone: .85, dens: 1, curv: true, cross: .3 });
  X.save(); tracePath(body, true, true); X.clip();
  pshade(body.map(p => [p[0] - LIGHT[0] * .45 * s, p[1] - LIGHT[1] * .3 * s]).map(p => [p[0] + LIGHT[0] * .9 * s, p[1] + LIGHT[1] * .6 * s]), AP.graphite, .5, { curv: true });
  X.restore();
  // brass buttons down the front edge, and a watch chain
  for (let i = 0; i < 3; i++) { const b = lerp2(at(neck, -1.1 * s, .7 * s * wid), at(hip, .5 * s, 1.3 * s * bel * wid), i / 2.4); fill(ellPts(b[0], b[1], .07 * s, .07 * s, 6), AP.brass, { tone: .95, dens: .5, sw: sw * .6 }); }
  line([at(hip, .8 * s, 1.25 * s * bel * wid), at(hip, .55 * s, .55 * s), at(hip, .6 * s, .15 * s)], sw * .7, AP.brass, { curv: true, over: 0, passes: 1 });
  // trouser waist
  fill([at(hip, .05 * s, -.66 * s * wid), at(hip, .05 * s, .62 * s * wid), at(hip, -.35 * s, .64 * s * wid), at(hip, -.35 * s, -.66 * s * wid)], C.pants, { tone: .85, dens: .9 });
  if (!sit) drawLeg(LF, false);
  else drawLeg(LF, false);
  // ---- head ----
  seed('devhead' + x);
  const ear = [R(-.18, -.22), R(-.78, -.72), R(-.5, -.18), R(-.35, .08)];
  const hornFar = [R(-.3, -.72), R(-.42, -1.12), R(-.62, -1.45), R(-.8, -1.58)];
  fill(limb(hornFar, [.26 * s, .2 * s, .12 * s, .02 * s], 4), C.hornDk, { tone: .8, dens: .8 });
  // neck and collar
  fill(limb([at(neck, -.3 * s, 0), lerp2(neck, c, .6)], [.78 * s, .7 * s]), C.skin, { tone: .75, dens: .8 });
  fill([at(neck, -.1 * s, -.32 * s), at(neck, .12 * s, .28 * s), at(neck, -.12 * s, .42 * s), at(neck, -.2 * s, -.3 * s)], C.shirt, { tone: .9, dens: .4 });
  { const bt = at(neck, -.12 * s, .3 * s); fill([add2(bt, [-.2 * s * dir, -.14 * s]), add2(bt, [.2 * s * dir, .12 * s]), add2(bt, [.22 * s * dir, -.14 * s]), add2(bt, [-.2 * s * dir, .12 * s])], C.tie, { tone: .95, dens: 1 }); }
  const hd = [R(-.8, -.05), R(-.74, -.52), R(-.38, -.84), R(.14, -.9), R(.55, -.7), R(.74, -.38), R(.8, -.1), R(.74, .16), R(.7, .42), R(.52, .62), R(.2, .7), R(-.2, .62), R(-.56, .42), R(-.78, .2)];
  fill(hd, C.skin, { tone: .78, dens: .8, curv: true });
  X.save(); tracePath(hd, true, true); X.clip();
  pshade(hd.map(p => [p[0] + LIGHT[0] * .42 * s, p[1] + LIGHT[1] * .3 * s]), C.skinDk, .55, { curv: true });
  plit(ellPts(...R(.3, -.55), .28 * s, .14 * s, 10, 0, -.3 * dir), .45, C.skinLt);
  X.restore();
  fill(ear, C.skin, { tone: .8, dens: .8, curv: true });
  line([R(-.3, -.2), R(-.62, -.58)], sw * .8, C.skinDk, { over: 0, passes: 1 });
  // slicked black hair with a widow's peak
  const soak = clamp(P.soak);
  fill([R(.52, -.68), R(.22, -.62 + soak * .1), R(.02, -.5), R(-.3, -.55), R(-.6, -.32), R(-.8, -.12), R(-.8, -.35), R(-.62, -.72), R(-.3, -.9), R(.15, -.94)], C.hair, { tone: .9, dens: 1.1, curv: true });
  plit([R(-.1, -.82), R(-.5, -.68), R(-.45, -.62), R(-.05, -.76)], .5 + soak * .4, '#8A8290');
  // nose: a great hooked beak
  fill([R(.66, -.24), R(1.12, .0), R(1.16, .2), R(.98, .3), R(.74, .2)], C.skin, { tone: .82, dens: .9, curv: true });
  pshade([R(.8, .12), R(1.12, .12), R(.98, .28), R(.76, .2)], C.skinDk, .6);
  // near horn
  const hornN = [R(.18, -.74), R(.44, -1.12), R(.36, -1.48), R(.14, -1.72)];
  fill(limb(hornN, [.3 * s, .22 * s, .13 * s, .02 * s], 4), C.horn, { tone: .85, dens: .6 });
  for (let i = 1; i < 4; i++) { const p = lerp2(hornN[0], hornN[2], i / 4.5); line([add2(p, [-.12 * s, 0]), add2(p, [.12 * s, -.04 * s])], sw * .6, C.hornDk, { over: 0, passes: 1 }); }
  // eye
  const lookU = P.lookUp, eyeScale = P.face === 'shock' ? 1.35 : P.face === 'furious' ? 1.12 : 1;
  const e = R(.44 + P.look * .03, -.28), ew = .17 * s * eyeScale, eh = .15 * s * eyeScale;
  const eyeP = ellPts(e[0], e[1], ew, eh, 14, 0, ha);
  fill(eyeP, C.eye, { tone: .95, dens: .4, sw: sw * .8 });
  const pr = .065 * s * F.pupil, pp = add2(e, rot2([(P.look * .07 + .03) * s * dir, (-lookU * .075) * s], ha));
  X.save(); tracePath(eyeP); X.clip();
  fill(ellPts(pp[0], pp[1], pr, pr * 1.15, 8), AP.graphite, { tone: .95, dens: 1, ink: null });
  const lid = clamp(Math.max(F.lid, P.blink));
  if (lid > .02) {   // the upper lid: skin coming down over the eye
    const ly = -eh + lid * 2 * eh, lp = [R(.2, -.28 - .3), R(.7, -.28 - .3), add2(e, rot2([.4 * s * dir, ly], ha)), add2(e, rot2([-.4 * s * dir, ly + (P.face === 'soaked' ? .04 * s : 0)], ha))];
    fill(lp, C.skin, { tone: .95, dens: .8, ink: null });
    line([add2(e, rot2([-.2 * s * dir, ly], ha)), add2(e, rot2([.2 * s * dir, ly - .01 * s], ha))], sw * 1.3, AP.graphite, { over: 0 });
  }
  X.restore();
  // brow: a thick black wedge; inner end toward the nose
  const bi = F.bi + (P.brow || 0), bo = F.bo;
  fill(limb([R(.14, -.5 + bo), R(.42, -.58 + F.arch + (bo + bi) / 2), R(.72, -.46 + bi)], [.07 * s, .15 * s, .1 * s], 3), C.hair, { tone: .95, dens: 1.2 });
  // mouth, goatee, moustache
  const open = clamp(F.open + P.mouth), jaw = open * .28;
  const mo = R(.62, .42);
  if (open > .15) {
    const mp = [R(.42, .38), R(.84, .36), R(.8, .42 + jaw), R(.56, .5 + jaw * 1.1), R(.44, .46 + jaw * .6)];
    fill(mp, '#3A1210', { tone: .95, dens: 1, sw: sw * .8 });
    fill([R(.72, .37), R(.8, .37), R(.76, .5)], '#F4EEE0', { tone: .95, dens: .3, sw: sw * .5 });    // a fang
    if (open > .45) fill(ellPts(...R(.64, .45 + jaw), .1 * s, .05 * s, 8), '#B8412B', { tone: .8, ink: null });   // tongue
  } else if (P.face === 'smug') line([R(.46, .47), R(.62, .48), R(.78, .42)], sw * 1.2, AP.graphite, { curv: true, over: 0 });
  else if (P.face === 'soaked') line([R(.46, .5), R(.56, .46), R(.66, .5), R(.78, .46)], sw * 1.1, AP.graphite, { curv: true, over: 0 });
  else line([R(.46, .47), R(.8, .46)], sw * 1.2, AP.graphite, { over: 0 });
  // goatee (drops with the jaw)
  fill([R(.4, .56 + jaw), R(.72, .52 + jaw), R(.66, .8 + jaw), R(.54, 1.12 + jaw - soak * .05), R(.46, .78 + jaw)], C.hair, { tone: .9, dens: 1.1, curv: true });
  // handlebar moustache: the ends curl up when smug, bristle when furious, droop when soaked
  const cu = F.curl - soak * .8;
  const st = [R(.98, .26), R(.72, .32), R(.48, .3 - Math.max(0, cu) * .05), R(.32 + (cu < 0 ? .05 : 0), .22 - cu * .22), R(.34 + (cu > 0 ? .1 : -.06), .08 - cu * .3 + (cu < 0 ? .5 : 0) * -cu)];
  fill(limb(st, [.12 * s, .15 * s, .1 * s, .06 * s, .02 * s], 4), C.hair, { tone: .95, dens: 1.1 });
  fill(limb([R(.95, .25), R(1.08, .3), R(1.14 + (cu < 0 ? -.02 : .04), .22 - cu * .12)], [.1 * s, .06 * s, .02 * s], 3), C.hair, { tone: .95, dens: 1 });   // far end
  if (P.face === 'smug') line([R(.3, .3), R(.36, .42)], sw * .7, C.skinDk, { over: 0, passes: 1 });
  // dust on the head
  if (P.dust > 0) {
    seed('devdust' + x);
    pshade([R(.5, -.72), R(.1, -.95), R(-.45, -.9), R(-.8, -.4), R(-.4, -.7), R(.1, -.78)], '#E6DCC6', P.dust * 1.3);
    for (let i = 0; i < 9; i++) if (hash(i * 5.3) < P.dust) fill(ellPts(...R(-.6 + hash(i * 3.1) * 1.1, -.9 + hash(i * 7.7) * .12), .06 * s, .04 * s, 6), '#EFE6D2', { tone: .9, ink: null });
    pshade([at(neck, -.45 * s, -.5 * s), at(neck, -.3 * s, .3 * s), at(neck, -.5 * s, .35 * s), at(neck, -.6 * s, -.5 * s)], '#E6DCC6', P.dust);
  }
  // teacup upside down on the horn
  if (P.cupOnHorn > 0) {
    const hb = lerp2(hornN[1], hornN[2], .7);
    teacup(hb[0], hb[1] - .38 * s, .6 * s, { tilt: Math.PI + .25 * dir + P.cupWob, tea: 0 });
  }
  if (hooks.hold) hooks.hold(J);
  // ---- front arm (and the cup) ----
  seed('devarm' + x);
  if (P.cup > 0) {
    const cpos = add2(AF.hand, [.18 * s * dir, -.05 * s]);
    teacup(cpos[0], cpos[1] + .2 * s, .62 * s, { tilt: P.cupTilt * dir, tea: P.tea });
  }
  drawArm(AF, false, P.fistF);
  if (hooks.front) hooks.front(J);
  // ---- effects ----
  if (soak > 0) {
    seed('devsoak' + x);
    plit([R(-.3, -.8), R(.1, -.86), R(.05, -.78), R(-.28, -.72)], soak * .8, '#DDEEF3');
    for (let i = 0; i < 7; i++) {
      const src = [R(.55, 1.1), R(1.1, .3), R(-.6, .4), AF.hand, at(hip, .7 * s, 1.05 * s), R(.2, .7), AB.hand][i], k = frac(T * 1.6 + hash(i * 3.3));
      const p = [src[0], src[1] + k * k * 1.6 * s];
      pline([p, [p[0], p[1] + .16 * s]], sw * 1.4, P.soakCol || AP.waterLt, { over: 0, passes: 1, alpha: soak * (1 - k) });
    }
  }
  if (P.steam > 0) {
    seed('devsteam' + x);
    for (let i = 0; i < 4; i++) { const k = frac(T * 1.8 + i / 4), q = R(-.62 - k * .5, -.35 - k * 1.4); psmoke(q[0] + Math.sin(k * 7 + i) * .1 * s, q[1], s * (.14 + k * .4), AP.paperLt, .7 * P.steam * (1 - k)); }
  }
  return J;
}

// ------------------------------------------------------------------------------------------------------------------
// HIS PARLOUR
// ------------------------------------------------------------------------------------------------------------------
const HALL = { x: 960, y: 1222, s: 22 };     // ceiling under the bore at ~1018 ft; floor at y + 5.2s ≈ 1113 ft
const HALL_IN = [[-10.2, 5.2], [-10.7, 3.7], [-10.2, 2.1], [-8.7, .95], [-6.3, .3], [-3.5, .02], [-1.4, .04], [0, 0], [1.4, .08], [3.6, .5], [5.4, 1.4], [6.5, 3.1], [6.5, 5.2],
  [4.5, 5.32], [1.5, 5.26], [-2.5, 5.34], [-6.5, 5.26]];
function devilHall(x, y, s, o = {}) {
  const t = o.t ?? T, sw = Math.max(.3, s / 45), j = s / 90, ov = s / 12, lit = o.lit ?? 1;
  const fill = (pts, col, oo = {}) => pfill(pts, col, { sw, j, ...oo }), line = (pts, w, col, oo = {}) => pline(pts, w, col, { j, over: ov, ...oo });
  const Q = (u, v) => [x + u * s, y + v * s];
  const inner = HALL_IN.map(([u, v]) => Q(u, v)), floorY = y + 5.2 * s, ds = .75 * s;
  const chairX = x - .35 * s, seatY = floorY - DEV_SEAT * ds;
  const H = { bore: [x, y], floorY, ds, chairX, seat: [chairX, seatY], devilAt: [chairX, floorY], table: Q(2.3, 5.2), fire: Q(-7.6, 4.3), interior: inner,
    clip: () => { tracePath(inner, true, true); X.clip(); } };
  H.cupRest = Q(2.3, 3.72);
  seed('hall' + x);
  // the cavity: a warm dark back wall, lit by the hellfire on the left
  fill(inner, '#4E2018', { tone: .9, dens: 1, ink: null, curv: true, still: true });
  X.save(); H.clip();
  const fl = .85 + .15 * Math.sin(t * 13.7) * Math.sin(t * 7.3 + 1), fire = H.fire;
  pglow(fire[0], fire[1], s * 9 * fl * lit, AP.ember, .55 * lit);
  pglow(fire[0] + s, fire[1] - s, s * 16, '#B8412B', .35 * lit);
  // roughly hewn rock around the papered wall (the cave edges)
  pshade(inner, '#2A1210', .35, { still: true, curv: true });
  // striped wallpaper on the back wall, a dado rail and a skirting board
  const wp = [Q(-9.6, 1.05), Q(5.4, 1.05), Q(5.9, 4.9), Q(-9.9, 4.9)];
  fill(wp, '#7A2A26', { tone: .75, dens: .8, ink: null, still: true, kind: 'v' });
  for (let i = 0; i < 26; i++) { const u = -9.5 + i * .6; line([Q(u, 1.1), Q(u + .05, 4.85)], sw * .9, '#A8443A', { over: 0, passes: 1 }); }
  line([Q(-9.9, 3.55), Q(5.9, 3.55)], sw * 1.6, '#3A1A14', { over: 0 });
  fill([Q(-10, 4.9), Q(6, 4.9), Q(6, 5.3), Q(-10, 5.3)], '#3A1A14', { tone: .9, dens: 1, ink: null });
  // portrait of Mother (horns, a bonnet, a stern look) in an oval frame
  seed('hallpic' + x);
  const pc = Q(-4.4, 2.5), pt = o.tilt || 0;
  X.save(); X.translate(pc[0], pc[1] - 1.1 * s); X.rotate(pt); X.translate(-pc[0], -(pc[1] - 1.1 * s));
  line([Q(-4.4, 1.4), Q(-4.9, 1.75)], sw * .6, AP.brass, { over: 0, passes: 1 }); line([Q(-4.4, 1.4), Q(-3.9, 1.75)], sw * .6, AP.brass, { over: 0, passes: 1 });
  fill(ellPts(pc[0], pc[1], .75 * s, .95 * s, 16), AP.brass, { tone: .85, dens: .8 });
  fill(ellPts(pc[0], pc[1], .58 * s, .78 * s, 16), '#E4C9A0', { tone: .8, dens: .6 });
  fill(ellPts(pc[0], pc[1] + .05 * s, .25 * s, .3 * s, 10), '#B8412B', { tone: .85, dens: .8, sw: sw * .6 });
  for (const sd of [-1, 1]) fill([[pc[0] + sd * .15 * s, pc[1] - .2 * s], [pc[0] + sd * .32 * s, pc[1] - .55 * s], [pc[0] + sd * .22 * s, pc[1] - .18 * s]], AP.bone, { tone: .9, sw: sw * .5 });
  fill([[pc[0] - .4 * s, pc[1] + .75 * s], [pc[0] - .3 * s, pc[1] + .3 * s], [pc[0] + .3 * s, pc[1] + .3 * s], [pc[0] + .4 * s, pc[1] + .75 * s]], '#2A1E24', { tone: .9, sw: sw * .5 });
  X.restore();
  // a second little frame: crossed pitchforks
  const pf = Q(-1.6, 2.2);
  fill(rectPts(pf[0] - .5 * s, pf[1] - .4 * s, 1 * s, .8 * s), AP.brass, { tone: .85, dens: .8 });
  fill(rectPts(pf[0] - .38 * s, pf[1] - .28 * s, .76 * s, .56 * s), '#E4C9A0', { tone: .8 });
  for (const sd of [-1, 1]) line([[pf[0] - sd * .28 * s, pf[1] + .2 * s], [pf[0] + sd * .25 * s, pf[1] - .2 * s]], sw * .7, AP.graphite, { over: 0, passes: 1 });
  // the hearth: stone surround, the fire, a mantel with a clock and a skull
  seed('hallfire' + x);
  fill([Q(-9.2, 2.9), Q(-5.9, 2.9), Q(-5.9, 5.2), Q(-6.5, 5.2), Q(-6.5, 3.6), Q(-8.6, 3.6), Q(-8.6, 5.2), Q(-9.2, 5.2)], '#6E5E58', { tone: .8, dens: .9, cross: .25 });
  fill([Q(-8.6, 3.6), Q(-6.5, 3.6), Q(-6.5, 5.2), Q(-8.6, 5.2)], '#1A0C0A', { tone: .95, dens: 1, ink: null });
  for (let i = 0; i < 5; i++) {
    const fx = -8.25 + i * .42, h = (.9 + .5 * hash(i)) * (.8 + .3 * Math.sin(t * (9 + i * 2.3) + i * 2)) * lit, sway = .12 * Math.sin(t * 6 + i);
    fill([Q(fx - .28, 5.15), Q(fx + sway, 5.15 - h), Q(fx + .28, 5.15)], i % 2 ? AP.fire : AP.ember, { tone: .85, dens: .7, ink: null, curv: true });
    fill([Q(fx - .12, 5.15), Q(fx + sway * .6, 5.15 - h * .55), Q(fx + .12, 5.15)], AP.lamp, { tone: .9, dens: .4, ink: null });
  }
  pglow(...Q(-7.55, 4.7), s * 2.4 * fl, AP.lamp, .8 * lit);
  fill([Q(-9.5, 2.65), Q(-5.6, 2.65), Q(-5.6, 2.95), Q(-9.5, 2.95)], '#4A3A34', { tone: .9, dens: 1 });
  fill(rrPts(...Q(-8.2, 1.95), .6 * s, .72 * s, .15 * s), AP.timberDk, { tone: .85 });                                   // clock
  fill(ellPts(...Q(-7.9, 2.25), .2 * s, .2 * s, 10), AP.bone, { tone: .9, sw: sw * .6 });
  line([Q(-7.9, 2.25), Q(-7.9, 2.1)], sw * .6, AP.graphite, { over: 0, passes: 1 }); line([Q(-7.9, 2.25), Q(-7.78, 2.3)], sw * .6, AP.graphite, { over: 0, passes: 1 });
  fill([Q(-6.7, 2.65), Q(-6.75, 2.35), Q(-6.5, 2.2), Q(-6.25, 2.35), Q(-6.3, 2.65)], AP.bone, { tone: .85, sw: sw * .6, curv: true });   // skull
  fill(ellPts(...Q(-6.58, 2.4), .06 * s, .06 * s, 6), AP.graphite, { tone: .9, ink: null }); fill(ellPts(...Q(-6.42, 2.4), .06 * s, .06 * s, 6), AP.graphite, { tone: .9, ink: null });
  // rug on the floor (seen edge-on), with a fringe
  seed('hallrug' + x);
  fill([Q(-4.8, 5.12), Q(3.6, 5.12), Q(3.8, 5.26), Q(-5, 5.26)], '#8E3A2A', { tone: .9, dens: .9, sw: sw * .7 });
  for (let i = 0; i < 12; i++) line([Q(-4.8 + i * .75, 5.14), Q(-4.8 + i * .75 + .3, 5.14)], sw * .8, AP.ochre, { over: 0, passes: 1 });
  // pitchfork leaning in the right-hand corner
  seed('hallfork' + x);
  line([Q(5.5, 5.2), Q(4.85, 1.9)], sw * 1.6, AP.timberDk, { over: 0 });
  const fk = Q(4.8, 1.7);
  line([Q(4.55, 1.95), Q(5.1, 1.84)], sw * 1.3, AP.iron, { over: 0 });
  for (const u of [-.27, 0, .27]) line([add2(fk, [u * s - .04 * s, .15 * s]), add2(fk, [u * s - .1 * s, -.5 * s])], sw * 1.1, AP.iron, { over: 0 });
  // side table with teapot and a fringed lamp
  seed('halltable' + x);
  const tb = H.table;
  fill([Q(1.55, 3.82), Q(3.05, 3.82), Q(3.05, 3.98), Q(1.55, 3.98)], AP.timberDk, { tone: .9, dens: .9 });
  fill(limb([Q(2.3, 3.98), Q(2.25, 4.6), Q(2.3, 5.1)], [.18 * s, .12 * s, .2 * s]), AP.timberDk, { tone: .85 });
  fill([Q(1.9, 5.2), Q(2.7, 5.2), Q(2.3, 5.02)], AP.timberDk, { tone: .85 });
  // teapot
  fill(ellPts(...Q(2.75, 3.55), .32 * s, .26 * s, 12), '#F2ECDD', { tone: .9, dens: .4, sw: sw * .7 });
  fill(limb([Q(3.0, 3.6), Q(3.25, 3.45), Q(3.35, 3.25)], [.14 * s, .09 * s, .06 * s], 3), '#F2ECDD', { tone: .9, dens: .4, sw: sw * .7 });
  fill(ellPts(...Q(2.75, 3.28), .14 * s, .07 * s, 8), '#F2ECDD', { tone: .9, dens: .4, sw: sw * .7 });
  line([Q(2.45, 3.45), Q(2.3, 3.55), Q(2.45, 3.7)], sw * 1.1, '#F2ECDD', { over: 0, curv: true });
  // lamp
  const lampSw = (o.lamp || 0) * Math.sin(t * 5.2), lb = Q(1.85, 3.82), lt = add2(lb, rot2([0, -1.25 * s], lampSw * .15));
  line([lb, lt], sw * 1.2, AP.brass, { over: 0 });
  pglow(lt[0], lt[1] + .2 * s, s * 3.2, AP.lamp, .5 * lit);
  const shade = [[-.55, .1], [.55, .1], [.35, -.45], [-.35, -.45]].map(([u, v]) => add2(lt, rot2([u * s, v * s], lampSw * .15)));
  fill(shade, '#D86A3A', { tone: .8, dens: .7 });
  for (let i = 0; i < 6; i++) { const p = lerp2(shade[0], shade[1], i / 5); line([p, add2(p, [0, .16 * s])], sw * .6, AP.brass, { over: 0, passes: 1 }); }
  // the armchair: a mustard wingback facing right, the devil's own
  seed('hallchair' + x);
  const crushed = o.chair === 'crushed', cx = chairX, fy = floorY;
  const C = (u, v) => [cx + u * s, fy - v * s];
  if (!crushed) {
    fill([C(-1.25, 0), C(-1.05, .05), C(-.95, 2.9), C(-1.2, 3.35), C(-1.55, 3.3), C(-1.6, 2.8), C(-1.5, .1)], '#B8862E', { tone: .8, dens: 1, curv: true, cross: .2 });   // back
    fill([C(-1.25, .9), C(.9, .9), C(.95, 1.25), C(-1.2, 1.25)], '#C8963A', { tone: .8, dens: .9, curv: true });                                                    // seat
    for (const u of [-1.2, .75]) fill(rectPts(...C(u, .3), .18 * s, .3 * s), AP.timberDk, { tone: .9 });
    fill([C(-1.25, .3), C(.95, .3), C(.95, .9), C(-1.25, .9)], '#A87828', { tone: .85, dens: 1, cross: .2 });
  } else {
    fill([C(-1.4, 0), C(-1.1, .05), C(-1.25, 1.5), C(-1.9, 1.7), C(-2.1, 1.4), C(-1.7, .1)], '#B8862E', { tone: .8, dens: 1, curv: true, cross: .3 });                // back, flattened
    fill([C(-1.6, 0), C(1.2, 0), C(1.3, .5), C(-1.5, .6)], '#A87828', { tone: .85, dens: 1, cross: .3 });
    for (let i = 0; i < 4; i++) { const p = C(-1 + i * .65, .55); line([p, add2(p, [(i - 1.5) * .12 * s, -.45 * s]), add2(p, [(i - 1.5) * .2 * s, -.2 * s]), add2(p, [(i - 1.5) * .28 * s, -.6 * s])], sw * .9, AP.ironLt, { over: 0, curv: true }); }
  }
  if (o.devil && !crushed) {
    const LSave = LIGHT; LIGHT = [.8, .3];
    H.J = devil(H.devilAt[0], H.devilAt[1], ds, { ...o.devil, sit: 1 });
    LIGHT = LSave;
  }
  seed('hallarm' + x);
  if (!crushed) {
    fill([C(-1.35, 1.1), C(.55, 1.1), C(.7, 1.7), C(.55, 1.9), C(.3, 1.85), C(-1.3, 1.75)], '#C8963A', { tone: .85, dens: 1, curv: true });   // near arm, rolled
    fill(ellPts(...C(.5, 1.6), .22 * s, .3 * s, 10), '#B8862E', { tone: .85, dens: .9 });
    for (let i = 0; i < 6; i++) fill(ellPts(...C(-1.1 + i * .3, 1.15), .04 * s, .04 * s, 5), AP.brass, { tone: .95, ink: null });
  }
  if (o.front) o.front(H);
  // water on the floor, rising (chapter G)
  if (o.wet > 0) {
    seed('hallwet' + x);
    const wy = floorY - o.wet * 5.4 * s;
    fill([[x - 11 * s, wy + Math.sin(t * 3) * .1 * s], [x + 7 * s, wy - Math.sin(t * 3.4) * .1 * s], [x + 7 * s, floorY + s], [x - 11 * s, floorY + s]], AP.water, { tone: .55, dens: .9, kind: 'v', ink: null });
    line([[x - 11 * s, wy], [x + 7 * s, wy]], sw * 1.4, '#EAF6FA', { over: 0 });
  }
  X.restore();
  // stalactites along the ceiling
  seed('hallstal' + x);
  for (const [u, l] of [[-7.8, .7], [-6.9, .45], [-3.9, .55], [3.9, .6], [4.6, .4]]) {
    const top = u < 0 ? lerp(.95, .02, (u + 8.7) / 5.2) : lerp(.08, 1.4, (u - 1.4) / 4);
    fill([Q(u - .2, top - .1), Q(u + .22, top - .08), Q(u + .03, top + l)], '#5E2A20', { tone: .8, dens: .9 });
  }
  // cracks from the bore point, and the hole
  if (o.crack > 0) {
    seed('hallcrack' + x);
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * (.08 + .84 * hash(i * 3.7)), L = (.8 + 2.2 * hash(i * 1.3)) * s * clamp(o.crack * 1.3 - hash(i) * .3);
      if (L <= 0) continue;
      const P = [[x, y]]; let p = [x, y];
      for (let k = 1; k <= 4; k++) { p = add2(p, polar([0, 0], a + (hash(i * 9 + k) - .5) * .9, L / 4)); p[1] = Math.max(y - .05 * s, Math.min(p[1], y + .2 * s + Math.abs(p[0] - x) * .05)); P.push(p); }
      line(P, sw * 1.3, AP.graphite, { over: 0 });
    }
  }
  if (o.hole > 0) {
    seed('hallhole' + x);
    const r = .75 * s * o.hole;
    fill([[x - r, y + .15 * s], [x - r * .6, y - .9 * s], [x + r * .7, y - .9 * s], [x + r, y + .12 * s], [x + r * .3, y + .35 * s * o.hole], [x - r * .4, y + .3 * s * o.hole]], '#1A0C0A', { tone: .95, dens: 1, sw: sw * 1.2 });
  }
  line(inner, sw * 1.3, '#2A1210', { closed: true, curv: true });
  return H;
}

// dive() with the hall in it. dive() draws its shaft after the extra hook, so the parlour gets patched back on top
// where the bore runs through the room. Same arguments as dive(); hallO(dCam, bitD) → devilHall's o (plus o.after(H)).
function hallInDive(t, lt, dur, o, hallO) {
  const oo = { ...o, extra: (dCam, bitD) => { if (o.extra) o.extra(dCam, bitD); devilHall(HALL.x, HALL.y, HALL.s, { ...hallO(dCam, bitD), devil: null, after: null }); } };
  dive(t, lt, dur, oo);
  // replay dive()'s camera, then redraw the room over the shaft
  const k = o.k ?? ease(seg(lt, .2, dur - .3)), dCam = lerp(o.from ?? 0, o.to ?? 600, k), z = o.zoom ?? .55, bitD = o.bitDepth ?? (o.to ?? 600);
  const hit = o.hits === false ? 0 : pulse(t, 7), bob = o.hits === false ? 0 : -18 * Math.exp(-frac(bpOf(t)) * 9), cx = o.x ?? 960, sh = shakeXY(t, hit * 5);
  camOn(cx + sh[0], dCam * FT + (o.lead ?? 140) / z + sh[1], z);
  const ho = hallO(dCam, bitD), H = devilHall(HALL.x, HALL.y, HALL.s, ho);
  if (bitD * FT > HALL.y) {   // the rods run through the room
    X.save(); H.clip();
    seed('hallrods');
    const y1 = Math.min(bitD * FT - 50 + bob, H.floorY + 40);
    pfill(limb([[cx, HALL.y - 30], [cx, y1]], [14, 14]), AP.pine, { tone: .7, dens: .9, sw: .9 });
    X.restore();
    if (ho.hole) devilHallHoleRim(H, ho.hole);
  }
  if (ho.after) ho.after(H);
  camOff();
  return H;
}
function devilHallHoleRim(H, k) { seed('hallholerim'); const [x, y] = H.bore, s = HALL.s; pline([[x - .75 * s * k, y + .12 * s], [x - .3 * s * k, y + .3 * s * k], [x + .3 * s * k, y + .32 * s * k], [x + .75 * s * k, y + .1 * s]], .8, '#2A1210', { over: 0 }); }

// ------------------------------------------------------------------------------------------------------------------
// model sheet (review): node render.mjs --loop=devilB --sheet=0,1,2,3 ...
// ------------------------------------------------------------------------------------------------------------------
LOOPS.devilB = t => {
  sky('#6E2A20', '#4A1A14', { still: true });
  const faces = ['smug', 'annoyed', 'furious', 'shock', 'soaked'];
  faces.forEach((f, i) => {
    seed('ms' + i); LIGHT = [.7, .5];
    devil(220 + i * 370, 560, 62, { face: f, cup: i === 0 ? 1 : 0, shF: i === 0 ? .9 : i === 2 ? 2.6 + .15 * Math.sin(t * 20) : .3, elF: i === 0 ? 1.6 : i === 2 ? .6 : .5,
      fistF: i === 2, soak: f === 'soaked' ? 1 : 0, steam: f === 'furious' ? 1 : 0, dust: f === 'annoyed' ? 1 : 0, cupOnHorn: f === 'soaked' ? 1 : 0,
      tail: Math.sin(t * 3 + i), lean: f === 'furious' ? -.15 : 0, head: f === 'furious' ? -.3 : 0, lookUp: f === 'annoyed' ? 1 : f === 'furious' ? .6 : 0 });
  });
  camOn(960, 1300, 2.2);
  devilHall(960, 1222, 22, { devil: { face: 'smug', cup: 1, shF: 1.2, elF: 1.9, tail: Math.sin(t * 2) }, crack: .6, t });
  camOff();
};
LOOPS.devilB.len = 4;

// ------------------------------------------------------------------------------------------------------------------
// SHOTS
// ------------------------------------------------------------------------------------------------------------------
(() => {
  const bt = n => OFF + n * BEAT;                      // time of beat n
  const TEA = '#94562A';
  // ---------- shared bits ----------
  // vertical whip: graphite streaks over a paper wash; amt 0..1 (1 hides a cut), drift moves the streaks (+ down)
  function streaks(amt, drift = 0) {
    if (amt <= 0) return;
    seed('streaks');
    ptone(rectPts(-20, -20, W + 40, H + 40), AP.paperDk, .85 * easeIn(amt));
    for (let i = 0; i < 90; i++) {
      const x = hash(i * 3.3) * W, L = 180 + hash(i * 1.7) * 520, y = frac(hash(i * 7.1) + drift) * (H + L) - L;
      pline([[x, y], [x + jit(3), y + L]], 1 + hash(i) * 5, i % 3 ? AP.graphite : AP.earthDk, { over: 0, passes: 1, alpha: amt * (.35 + .5 * hash(i * 9)) });
    }
  }
  function surface(t, o = {}) {
    sky(o.skyTop || AP.sky, AP.dust, { still: true, y0: -900 });
    sun(o.sunX ?? 1580, o.sunY ?? 220, 52, .3);
    seed('bdist');
    ptone([[-80, 640], [300, 610], [700, 628], [1200, 606], [1700, 624], [2000, 612], [2000, 660], [-80, 660]], '#B89A76', .5);
    tree(210, 648, 12, { dead: true, key: 'bt1' }); tree(1760, 640, 10, { dead: true, key: 'bt2' });
    plain(o.hy ?? 650, AP.dust, { cracks: .4, still: true });
    seed('bunder'); pfill(rectPts(-200, 1060, W + 400, 1600), AP.earthDk, { tone: .7, dens: 1, ink: null, still: true });
    pfill(rectPts(-200, 1500, W + 400, 1200), '#C8924E', { tone: .7, dens: 1, ink: null, still: true });
  }
  function casing(x, y, s) {
    seed('casing' + x);
    pfill([[x - .55 * s, y], [x - .5 * s, y - 1.3 * s], [x + .5 * s, y - 1.3 * s], [x + .55 * s, y]], AP.iron, { tone: .85, dens: 1, sw: 1.1 });
    pfill(rectPts(x - .75 * s, y - 1.55 * s, 1.5 * s, .4 * s), AP.ironLt, { tone: .85, sw: 1 });
    plit([[x - .35 * s, y - 1.2 * s], [x - .2 * s, y - 1.2 * s], [x - .25 * s, y - .1 * s], [x - .4 * s, y - .1 * s]], .6);
    return [x, y - 1.55 * s];
  }
  const finger = (J, col) => { const u = [Math.cos(J.angF), Math.sin(J.angF)], s = J.s, h = J.handF;
    pfill(limb([add2(h, [u[0] * .25 * s, u[1] * .25 * s]), add2(h, [u[0] * .8 * s, u[1] * .8 * s])], [.2 * s, .13 * s]), col, { tone: .65, sw: s / 55 }); };
  // laughing bounce on the beat, offset per man so nobody twins
  const guffaw = (t, ph) => Math.abs(Math.sin((bpOf(t) + ph) * Math.PI));

  // ================================================================================================
  // S1 · 47.90–52.16 · [9] "plugging downward at a thousand feet": down the bore to the bit at 1000 ft
  // ================================================================================================
  function s1(t, lt, dur) {
    const out = easeIn(seg(lt, dur - .32, dur));
    const k = easeOut(seg(lt, 0, 2.8)) - out * 2.6, z = lerp(.7, 1.45, ease(seg(lt, .4, 3.4)));
    const bitD = 988 + 12 * ease(seg(lt, .5, 3.6));
    dive(t, lt, dur, { from: 620, to: 1000, k, zoom: z, lead: lerp(60, -190, ease(seg(lt, .3, 3))), bitDepth: bitD,
      extra: (dCam) => {   // the tease: something warm and red under the rock, glowing harder with every blow
        const g = seg(lt, 1.6, 3.4);
        if (g <= 0) return;
        seed('tease');
        pglow(960, 1262, 90 + 30 * pulse(t, 5), AP.ember, g * (.25 + .35 * pulse(t, 5)));
        for (let i = 0; i < 5; i++) { const a = .3 + i * .6, L = 20 + 26 * hash(i * 3); pline([[960 + (i - 2) * 6, 1206], [960 + (i - 2) * 6 + Math.cos(a) * L * (i < 2 ? -1 : 1), 1214 + 8 * hash(i)]], .9, AP.ember, { over: 0, passes: 1, alpha: g }); }
      } });
    streaks(out, -lt * 3);
    if (lt < .35) scribbleWipe(.5 + lt / .7);
  }

  // ================================================================================================
  // S2 · 52.16–56.52 · [10] fist at the empty sky, then the grin, and the finger points DOWN
  // ================================================================================================
  function s2(t, lt, dur) {
    const inK = 1 - easeOut(seg(lt, 0, .45)), outK = easeIn(seg(lt, dur - .42, dur));
    camOn(960, 540 - 520 * inK + 1100 * outK, 1);
    LIGHT = [-.6, .8];
    surface(t);
    // the rig: derrick, walking beam pounding on the beat, the casing the driller will point at
    derrick(1100, 830, 980, { key: 'b2' });
    const B = beam(1460, 846, 62, frac(bpOf(t)));
    const top = casing(1100, 836, 30);
    seed('b2rope'); pline([B.wellEnd, [1100, top[1]]], 1.4, AP.graphite, { over: 0 });
    // boss, watching: follows the driller's look up, then laughs at the joke
    seed('b2boss');
    const bl = seg(t, 55.35, 55.6);
    man(1560, 880, 64, { ...kp(t, [[52.3, { head: .05, face: 'neutral', shF: .1, shB: -.1 }], [52.8, { head: -.35, face: 'worry', shF: .1 }], [54.3, { head: -.2, face: 'worry' }],
      [54.7, { head: .1, face: 'neutral' }], [55.4, { head: -.1, face: 'smile', lean: 0 }], [55.7, { head: -.25, face: 'laugh', lean: -.2, shF: 1.2, elF: 1.4, shB: .4 }]]),
      flip: true, dy: bl * .06 * guffaw(t, .3) }, CAST.boss);
    // the driller
    seed('b2drill');
    const shake = seg(t, 53.0, 53.2) * (1 - seg(t, 54.0, 54.25));
    let P = kp(t, [
      [52.16, { ...POSES.stand, head: .15, face: 'grit', look: 0 }],
      [52.5, { ...POSES.stand, head: .1, face: 'grit', look: .6 }],
      [52.85, { ...POSES.stand, lean: -.12, head: -.5, face: 'grit', look: .4 }],
      [53.0, { lean: -.15, shF: 1.6, elF: 1.9, shB: -.2, elB: .4, head: -.5, face: 'grit' }],
      [bt(99), { ...POSES.fist, head: -.55 }],
      [54.05, { ...POSES.fist, head: -.55 }],
      [54.4, { ...POSES.stand, shF: .35, elF: .5, lean: 0, head: -.15, face: 'neutral', mouth: 0 }],
      [54.7, { ...POSES.stand, shF: .3, elF: .45, head: .3, face: 'smile', look: .6 }],
      [55.0, { lean: -.08, shF: -.7, elF: 1.6, shB: -.2, elB: .3, head: .2, face: 'smile', mouth: .35 }],
      [bt(103), { lean: .38, shF: .72, elF: -.05, shB: -.35, elB: .5, hpF: .3, knF: .3, head: .45, face: 'smile', mouth: .5, look: .6 }],
      [56.52, { lean: .36, shF: .7, elF: -.05, shB: -.35, elB: .5, hpF: .3, knF: .3, head: .4, face: 'smile', mouth: .45, look: .6 }],
    ], ease);
    P.shF += shake * (.14 * Math.sin(t * TAU * 5.2) + .25 * pulse(t, 7)); P.elF += shake * .12 * Math.sin(t * TAU * 5.2 + 1);
    if (t > bt(103)) P.shF += .18 * pulse(t, 8);
    P.blink = Math.exp(-Math.pow((t - 54.52) / .05, 2));
    man(800, 884, 90, P, CAST.driller, { front: J => { if (t > 55.0) finger(J, CAST.driller.skin); } });
    camOff();
    streaks(Math.max(inK * .9, outK), (lt - dur) * 2.4);
  }

  // ================================================================================================
  // THE PARLOUR, CLOSE: S3/S4 (56.52–66.08) and the first half of S5. World = section() coordinates.
  // ================================================================================================
  const KN = [[bt(107), .5], [bt(109), .6], [bt(111), .75], [bt(112), .75], [bt(116), 1.1], [bt(117), 1.1], [bt(118), 1.2], [bt(119), 1.35], [bt(120), 1.6]];
  const T_BREAK = bt(120), T_LAND = T_BREAK + .36, T_PEB = 59.42, JUMP0 = T_BREAK + .07, JUMP1 = T_BREAK + .4, CUPHORN = T_BREAK + .66;
  const POUND = [bt(121), bt(122), bt(123), bt(124), bt(125), bt(126), bt(127), bt(128), bt(129), bt(130)];
  const SIP = { shF: 1.25, elF: 1.95, cupTilt: -.55 }, REST = { shF: .55, elF: 1.3, cupTilt: 0 };
  const knockAmt = t => KN.reduce((a, [k, s]) => a + (t >= k ? s * Math.exp(-(t - k) * 10) : 0), 0);
  // bit height above its rest: winds up before each knock (ease out), slams down exactly on it (ease in)
  function bitLift(t, list, h) {
    let y = 0;
    for (const k of list) {
      if (t > k - .42 && t < k) { const u = t - (k - .42); y = Math.min(y, u < .3 ? -h * easeOut(u / .3) : -h * (1 - easeIn((u - .3) / .12))); }
      if (t >= k && t < k + .1) y = Math.min(y, -2 * Math.sin((t - k) / .1 * Math.PI));
    }
    return y;
  }
  function seatedPose(t) {
    const tl = T_PEB;
    const P = kp(t, [
      [56.52, { ...SIP, face: 'smug', lookUp: 0, head: .05 }], [57.2, { ...SIP, face: 'smug', head: .05 }], [57.5, { ...REST, face: 'smug', head: 0 }],
      [57.65, { ...REST, face: 'smug' }], [57.9, { ...SIP, face: 'smug' }],
      [58.25, { ...SIP, face: 'smug', lookUp: 0 }], [58.42, { ...SIP, face: 'smug', lookUp: 1, look: -.3 }], [58.75, { ...SIP, face: 'smug', lookUp: 1, look: -.3 }],
      [58.95, { ...SIP, face: 'smug', lookUp: 0 }], [tl - .02, { ...SIP, face: 'smug' }],
      [tl + .08, { ...SIP, face: 'shock', cupTilt: -.2, head: -.1, lean: -.1 }], [tl + .3, { ...SIP, face: 'shock', cupTilt: 0, head: -.05 }],
      [59.85, { ...REST, face: 'annoyed', head: .38, lookUp: -.9 }], [bt(111) + .05, { ...REST, face: 'annoyed', head: .38, lookUp: -.9 }],
      [60.35, { ...REST, face: 'annoyed', head: -.22, lookUp: 1 }], [60.95, { ...REST, face: 'annoyed', head: -.25, lookUp: 1, mouth: .1 }],
      [61.7, { ...REST, face: 'annoyed', head: -.25, lookUp: 1 }], [61.9, { ...REST, face: 'smug', head: 0, lookUp: 0 }], [62.12, { ...SIP, face: 'smug' }],
      [bt(116) + .06, { ...SIP, face: 'shock', cupTilt: .3, lookUp: 1, head: -.2, lean: -.1 }], [62.55, { ...REST, face: 'annoyed', lookUp: 1, head: -.25 }],
      [63.3, { ...REST, face: 'annoyed', lookUp: 1, head: -.3, brow: .06 }], [bt(119) + .08, { ...REST, face: 'shock', lookUp: 1, head: -.4, lean: -.12 }],
      [64.4, { ...REST, face: 'shock', lookUp: 1, head: -.4, lean: -.12 }],
    ], ease);
    // the tail: a lazy swish, frozen by the first knock, then snaking up to rap back on the ceiling (61.12, 61.39, 61.66)
    const lazy = Math.sin(t * 2.3) * .6 * (t < bt(107) || (t > 61.95 && t < bt(116)) ? 1 : .15);
    P.tail = lazy;
    const up = seg(t, 60.85, 61.08) * (1 - seg(t, 61.72, 61.95));
    if (up > 0) {
      const raps = [bt(114), bt(114) + BEAT / 2, bt(115)], r = raps.reduce((a, k) => a + Math.exp(-Math.pow((t - k) / .06, 2)), 0);
      P.tailTip = lerp2([-1.9, .3], [-1.3, 6.2 + .75 * r], ease(up));
    }
    // jolts
    P.dy = .22 * Math.max(0, spring(t, bt(116), 9, 22)) + .1 * Math.max(0, spring(t, bt(119), 9, 22));
    P.squash = -.08 * Math.exp(-Math.max(0, t - bt(116)) * 8) * (t > bt(116) ? 1 : 0);
    P.cupTilt += .12 * knockAmt(t) * Math.sin(t * 60);
    P.dust = clamp(KN.reduce((a, [k, s]) => a + s * .28 * seg(t, k + .25, k + .55), 0));
    P.blink = Math.max(Math.exp(-Math.pow((t - 59.72) / .05, 2)), Math.exp(-Math.pow((t - 61.8) / .05, 2)), Math.exp(-Math.pow((t - 63.55) / .05, 2)));
    P.cup = 1; P.tea = .8;
    return P;
  }
  // the devil after the ceiling falls: a backward leap out of the chair, dripping tea, then fury
  function standingDevil(t, H) {
    const x0 = H.chairX, x1 = HALL.x - 4.4 * HALL.s, k = seg(t, JUMP0, JUMP1);
    const pos = t < JUMP1 ? arcPt([x0, H.floorY], [x1, H.floorY], 12, easeOut(k) * .5 + k * .5) : [x1, H.floorY];
    const land = t - JUMP1;
    let P;
    if (t < JUMP1) P = { sit: 1 - easeOut(k * 1.6), face: 'shock', shF: 2.7, elF: .3, shB: 2.4, elB: .5, hpF: .9, knF: 1.5, hpB: .4, knB: 1.3, lean: -.15, head: -.2, lookUp: .6, tail: .8 };
    else P = kp(t, [
      [JUMP1, { face: 'shock', shF: .4, elF: .3, shB: .2, elB: .3, hpF: .5, knF: 1.0, hpB: -.3, knB: .6, lean: .25, head: .1 }],
      [JUMP1 + .25, { face: 'soaked', shF: .1, elF: .15, shB: -.1, elB: .2, hpF: .05, knF: .05, hpB: -.05, knB: .05, lean: 0, head: .05 }],
      [65.3, { face: 'soaked', shF: .1, elF: .15, shB: -.1, elB: .2, head: .08 }],
      [65.5, { face: 'furious', shF: .5, elF: 1.2, shB: .3, elB: 1.1, lean: -.05, head: -.1, lookUp: .5 }],
      [65.85, { face: 'furious', shF: .7, elF: 1.4, shB: .3, elB: 1.1, lean: -.1, head: -.25, lookUp: .8 }],
      [66.08, { face: 'furious', shF: 1.7, elF: 1.3, shB: .3, elB: 1.1, lean: -.18, head: -.4, lookUp: 1 }],
      [66.25, { face: 'furious', shF: 1.95, elF: 1.15, shB: .3, elB: -1.1, lean: -.3, head: -.35, lookUp: 1 }],
    ], ease);
    P.squash = t > JUMP1 ? .3 * Math.exp(-land * 9) * Math.cos(land * 14) : 0;
    P.soak = t > T_BREAK + .45 ? .75 : 0; P.soakCol = TEA; P.dust = .7;
    P.cupOnHorn = t > CUPHORN ? 1 : 0; P.cupWob = .35 * spring(t, CUPHORN, 5, 16) + (t > 66.08 ? .12 * Math.sin(t * 17) : 0);
    P.blink = Math.exp(-Math.pow((t - 65.34) / .05, 2));
    if (t > 65.4) { P.steam = seg(t, 65.4, 65.7); P.fistF = P.fistB = true; P.shake = .25; P.tail = Math.sin(t * 11) * .9; P.squash += -.1 * seg(t, 65.4, 65.6); }
    if (t > 66.08) { P.shF += .12 * Math.sin(t * TAU * 4.3); P.elF += .3 * Math.sin(t * TAU * 4.3 + .8); P.mouth = .2 + .5 * pulse(t, 5); P.fistB = false; P.shB = .6; P.elB = -1.4; }
    P.flip = false;
    return { pos, P };
  }
  function parlour(t, cam) {
    const sh = shakeXY(t, knockAmt(t) * 2.2 + (t > T_LAND && t < T_LAND + .5 ? 3 * Math.exp(-(t - T_LAND) * 6) : 0));
    camOn(cam[0] + sh[0], cam[1] + sh[1], cam[2]);
    LIGHT = [.8, .3];
    section(960, 925, 1175);
    const broke = t >= T_BREAK, hole = easeOut(seg(t, T_BREAK, T_BREAK + .08));
    const crack = clamp(KN.slice(4).reduce((a, [k]) => a + (t > k ? .25 * easeOut(seg(t, k, k + .12)) : 0), 0));
    const seated = t < JUMP0 + .03;
    const H = devilHall(HALL.x, HALL.y, HALL.s, { t, crack, hole, chair: t >= T_LAND ? 'crushed' : 'ok', lamp: seg(t, bt(118), bt(118) + .3), tilt: KN.reduce((a, [k, st]) => a + (t > k ? st * .07 * (1 + .6 * spring(t, k, 4, 14)) : 0), 0),
      devil: seated ? seatedPose(t) : null,
      front: H => {
        // the lump of roof: falls, crushes the chair, settles
        if (broke) {
          seed('lump');
          const fall = t - T_BREAK, y = t < T_LAND ? 1212 + .5 * 1400 * fall * fall : 1313 - 4 * Math.max(0, spring(t, T_LAND, 7, 20)), x = lerp(960, 948, seg(t, T_BREAK, T_LAND)), a = t < T_LAND ? fall * 1.4 : .5;
          pfill([[-20, -10], [4, -13], [19, -8], [21, 5], [9, 12], [-13, 11], [-22, 3]].map(p => add2([x, y], rot2(p, a))), STRATA[3][2], { tone: .85, dens: 1, sw: .45, j: .2, cross: .3 });
          pshade([[-6, -2], [18, -4], [19, 6], [6, 11]].map(p => add2([x, y], rot2(p, a))), AP.graphite, .5);
        }
      } });
    // the bore: shaft, rods and bit above the roof; after the break the bit pokes through and keeps pounding
    seed('borecu');
    const rest = broke ? lerp(1200, 1236, easeIn(seg(t, T_BREAK, T_BREAK + .1))) : 1200;
    const lift = broke ? bitLift(t, POUND, 16) : bitLift(t, KN.map(k => k[0]), 14), tip = rest + lift;
    pfill([[943, 700], [977, 700], [977, 1203], [943, 1203]], AP.coal, { tone: .85, dens: 1, ink: null });
    pline([[943, 700], [943, 1203]], .35, AP.ironLt, { over: 0, j: .2 }); pline([[977, 700], [977, 1203]], .35, AP.ironLt, { over: 0, j: .2 });
    pfill(limb([[960, 700], [960, tip - 74]], [14, 14]), AP.pine, { tone: .7, dens: .9, sw: .3, j: .15 });
    pfill(rectPts(947, tip - 100, 26, 6), AP.iron, { tone: .9, sw: .25, j: .15 });
    const bs = 34;
    pfill([[960 - .5 * bs, tip - 2.2 * bs], [960 + .5 * bs, tip - 2.2 * bs], [960 + .45 * bs, tip - .5 * bs], [960, tip], [960 - .45 * bs, tip - .5 * bs]], AP.iron, { tone: .85, dens: 1, sw: .35, j: .15 });
    plit([[960 - .3 * bs, tip - 2 * bs], [960 - .1 * bs, tip - 2 * bs], [960 - .15 * bs, tip - .6 * bs]], .6);
    const hitK = broke ? POUND.reduce((a, k) => a + (t >= k ? Math.exp(-(t - k) * 14) : 0), 0) : knockAmt(t) * .8;
    if (hitK > .05) { pglow(960, tip, 16 * hitK, AP.lamp, clamp(hitK)); for (let i = 0; i < 6; i++) { const a = -Math.PI * (.15 + .7 * hash(i * 2.2)), r = 6 + 10 * (1 - clamp(hitK)); pline([[960 + Math.cos(a) * 3, tip + Math.sin(a) * 2], [960 + Math.cos(a) * r, tip + Math.sin(a) * r * .5]], .35, AP.lamp, { over: 0, passes: 1, alpha: clamp(hitK), j: .1 }); } }
    // dust from each knock: sifts off the ceiling and lands on him
    seed('dustcu');
    const headY = HALL.y + 1.75 * HALL.s;
    for (const [k, st] of KN) {
      if (t < k || t > k + 1.4) continue;
      psmoke(960 + jit(1), HALL.y + 3, 6 + 10 * seg(t, k, k + .6), '#D8C8B0', .5 * st * (1 - seg(t, k, k + 1.2)));
      const n = Math.round(10 + st * 12);
      for (let i = 0; i < n; i++) {
        const r = k + .03 + hash(i * 3.1 + k) * .35, dt = t - r; if (dt < 0) continue;
        const x = 960 + (hash(i * 7.7 + k) - .5) * 22 + dt * (hash(i) - .5) * 10, y = HALL.y + 2 + .5 * 420 * dt * dt;
        const land = seated && Math.abs(x - (H.chairX + 4)) < 11 ? headY : H.floorY;
        if (y > land) continue;
        pfill(ellPts(x, y, .5 + hash(i) * .7, .5 + hash(i * 2) * .6, 5), '#E4D6BE', { tone: .9, ink: null });
      }
    }
    // his tail rapping back on the ceiling: little impact ticks and a puff on each rap
    if (seated && H.J && t > 61.0 && t < 61.95) {
      seed('rap');
      const tp = H.J.tailTip;
      for (const k of [bt(114), bt(114) + BEAT / 2, bt(115)]) {
        const a = seg(t, k, k + .2); if (a <= 0 || a >= 1) continue;
        for (let i = 0; i < 5; i++) { const an = Math.PI * (.15 + .7 * i / 4); pline([[tp[0] + Math.cos(an) * 3, HALL.y + 1 + Math.sin(an) * 3], [tp[0] + Math.cos(an) * (5 + 5 * a), HALL.y + 1 + Math.sin(an) * (5 + 5 * a)]], .3, AP.paperLt, { over: 0, passes: 1, alpha: 1 - a, j: .1 }); }
        psmoke(tp[0], HALL.y + 2, 3 + 5 * a, '#D8C8B0', .5 * (1 - a));
      }
    }
    // crumbs off the ceiling on the big knocks
    for (const [k, st] of KN.slice(4)) for (let i = 0; i < 3; i++) {
      const r = k + .05 + hash(i + k) * .1, dt = t - r; if (dt < 0) continue;
      const y = HALL.y + .5 * 900 * dt * dt; if (y > H.floorY - 1) continue;
      pfill(ellPts(960 + (hash(i * 4 + k) - .5) * 60, y, 1.6, 1.3, 6), STRATA[3][2], { tone: .9, sw: .2, j: .1 });
    }
    // the pebble that plinks into his tea (lands at T_PEB), and the splash in his face
    if (seated && H.J && t > 59.0 && t < T_PEB + .5) {
      seed('pebble');
      const cupP = add2(H.J.handF, [.18 * H.ds, -.45 * H.ds]), r = 59.02, g = 2 * (cupP[1] - HALL.y) / Math.pow(T_PEB - r, 2);
      if (t < T_PEB) { const dt = t - r; pfill(ellPts(lerp(961, cupP[0], seg(t, r, T_PEB)), HALL.y + .5 * g * dt * dt, 1.2, 1, 6), STRATA[3][2], { tone: .95, sw: .2, j: .08 }); }
      else for (let i = 0; i < 7; i++) {
        const dt = t - T_PEB, vx = (hash(i * 5.1) - .7) * 40, vy = -30 - 25 * hash(i * 2.3);
        const p = [cupP[0] + vx * dt, cupP[1] + vy * dt + .5 * 500 * dt * dt];
        pline([p, [p[0] - vx * .012, p[1] - vy * .012]], .35, TEA, { over: 0, passes: 1, j: .05, alpha: 1 - seg(dt, .25, .45) });
      }
    }
    // after the break: the leap, the flying teacup, tea everywhere, dust cloud off the crushed chair
    let J = null;
    if (!seated) {
      seed('devilcu');
      const { pos, P } = standingDevil(t, H);
      if (t < JUMP1) { P.cup = 0; }
      J = devil(pos[0], pos[1], H.ds, P);
      // teacup: flies from his hand, spinning, and lands upside down on his horn
      if (t < CUPHORN) {
        seed('cupfly');
        const c0 = [H.chairX + 1.3 * H.ds, H.seat[1] - 2.3 * H.ds], c1 = add2(J.horn, [0, .1 * H.ds]), k = easeOut(seg(t, T_BREAK + .05, CUPHORN));
        const p = arcPt(c0, c1, 34, k);
        teacup(p[0], p[1], .62 * H.ds, { tilt: k * TAU * 1.5, tea: 1 - k });
      }
      // tea: a spray of drops from the cup's flight, falling to the floor
      seed('teadrops');
      for (let i = 0; i < 28; i++) {
        const e = T_BREAK + .06 + hash(i * 1.9) * .3, dt = t - e; if (dt < 0) continue;
        const c0 = [H.chairX + 1.3 * H.ds, H.seat[1] - 2.3 * H.ds], p0 = arcPt(c0, [HALL.x - 4.4 * HALL.s, H.floorY - 80], 34, seg(e, T_BREAK + .05, CUPHORN));
        const vx = (hash(i * 3.7) - .6) * 70, vy = -40 * hash(i * 5.3), y = p0[1] + vy * dt + .5 * 700 * dt * dt;
        if (y > H.floorY) { if (dt < 2.5) pfill(ellPts(p0[0] + vx * dt * .7, H.floorY - .3, 1.8, .45, 6), TEA, { tone: .8, ink: null }); continue; }
        const x = p0[0] + vx * dt;
        pline([[x, y], [x - vx * .01, y - (vy + 700 * dt) * .012]], .45, TEA, { over: 0, passes: 1, j: .05 });
      }
      if (t > T_LAND) for (let i = 0; i < 6; i++) { const k = seg(t, T_LAND, T_LAND + 1.1); psmoke(950 + (i - 2.5) * 9 * (1 + k), 1308 - k * 16 * hash(i), 8 + 14 * k, '#D8C8B0', .6 * (1 - k)); }
    }
    camOff();
    return { H, J };
  }
  // S3/S4 · 56.52–66.08 · [11] knocking on the roof of Satan's dwelling · [12] cave the roof of hell in
  function s34(t, lt, dur) {
    const inK = 1 - easeOut(seg(lt, 0, .5));
    const cam = kf(t, [[56.52, [955, 1272, 6.0]], [57.3, [953, 1273, 6.2]], [59.3, [952, 1274, 6.5]], [60.4, [950, 1272, 7.4]], [60.9, [945, 1272, 6.2]], [61.8, [946, 1272, 6.2]],
      [62.1, [950, 1273, 6.0]], [63.9, [952, 1270, 6.8]], [T_BREAK, [952, 1270, 6.8]], [T_BREAK + .25, [925, 1276, 4.4]], [65.2, [890, 1274, 5.4]], [66.08, [893, 1272, 6.2]]]);
    parlour(t, [cam[0], cam[1] - 90 * inK, cam[2]]);
    streaks(inK * .9, lt * 2.4);
  }
  // S5 · 66.08–69.70 · [13] the devil shakes his fist up the hole; whip up the shaft; the crew laugh
  const T_UP = 67.62;
  function s5(t, lt, dur) {
    if (t < T_UP) {
      const up = easeIn(seg(t, T_UP - .3, T_UP));
      parlour(t, [lerp(880, 888, seg(t, 66.08, 67.3)), 1256 - 160 * up, lerp(7.2, 6.9, seg(t, 66.08, 67.3))]);
      streaks(up, -lt * 3);
      return;
    }
    const inK = 1 - easeOut(seg(t, T_UP, T_UP + .4));
    camOn(960, 540 - 600 * inK, 1);
    LIGHT = [-.6, .8];
    surface(t);
    derrick(960, 830, 1000, { key: 'b5' });
    const top = casing(960, 836, 22);
    // a sulphurous puff coughs up out of the casing: the devil's opinion
    seed('b5puff');
    for (let i = 0; i < 5; i++) { const k = seg(t, 68.25 + i * .07, 69.4 + i * .07); if (k > 0 && k < 1) psmoke(top[0] + Math.sin(k * 6 + i) * 12, top[1] - 20 - k * 260, 18 + k * 60, i % 2 ? '#A0522D' : '#8A8580', .6 * (1 - k)); }
    // Bill and the boss laugh; the driller roars, pointing down the hole
    const L1 = seg(t, T_UP + .2, T_UP + .5);
    seed('b5bill');
    man(1560, 880, 66, { view: 'side', flip: true, lean: -.25, shF: 1.0, elF: 1.6, shB: .7, elB: 1.7, head: -.3, face: L1 > .5 ? 'laugh' : 'smile', dy: .06 * guffaw(t, .6) * L1 }, CAST.bill);
    seed('b5boss');
    const slap = pulse(t, 7);
    man(1270, 880, 64, { flip: true, lean: .45 - .1 * slap, shF: .7 + .25 * (1 - slap), elF: .1, shB: .9, elB: 1.5, hpF: .45, knF: .6, head: -.35, face: 'laugh', dy: .04 * guffaw(t, .2) }, CAST.boss);
    seed('b5drill');
    man(690, 884, 90, { lean: -.32 + .06 * guffaw(t, 0), shF: .95, elF: .1, shB: .9, elB: 1.9, head: -.45, face: L1 > .3 ? 'laugh' : 'smile', mouth: .4, hpF: .3, knF: .15, dy: .04 * guffaw(t, 0) },
      CAST.driller, { front: J => finger(J, CAST.driller.skin) });
    camOff();
    streaks(inK * .9, lt * 2);
    if (t > dur + (t - lt) - .25) pageTurn(seg(t, dur + (t - lt) - .25, dur + (t - lt)) * .5);
  }

  // ================================================================================================
  // C1 · 69.70–75.60 · chorus 2, crew in rhythm: beam on every beat, the sledge on every other
  // ================================================================================================
  function c1(t, lt, dur) {
    const z = lerp(1, 1.16, ease(seg(lt, 0, dur))), cam = [lerp(960, 870, ease(seg(lt, 0, dur))), lerp(540, 575, ease(seg(lt, 0, dur)))];
    const hitK = pulse(t, 9);
    const sh = shakeXY(t, 2.5 * pulse(t, 10) * (beatN(t) % 2 ? 1 : .4));
    camOn(cam[0] + sh[0], cam[1] + sh[1], z);
    LIGHT = [-.7, .7];
    surface(t, { sunX: 1640, sunY: 260 });
    derrick(820, 830, 800, { key: 'c1' });
    const B = beam(1100, 846, 60, frac(bpOf(t)));
    const top = casing(820, 836, 22);
    seed('c1rope'); pline([B.wellEnd, [820, top[1] - 4]], 1.4, AP.graphite, { over: 0 });
    // engine and Bill, firing on every other beat
    engine(1600, 846, 24, { ph: bpOf(t) * .5, fire: .6 + .3 * pulse(t, 4) });
    seed('c1bill');
    const bk = frac(bpOf(t) / 2), bw = bk < .5 ? easeOut(bk * 2) : 1 - easeIn((bk - .5) * 2);
    man(1420, 880, 54, { ...kp(bw, [[0, { lean: .35, shF: 1.5, elF: .2, shB: 1.3, elB: .3, face: 'grit' }], [1, { lean: -.15, shF: -.9, elF: 1.3, shB: -.7, elB: 1.2, face: 'grit' }]]) }, CAST.bill,
      { hold: J => { if (bw > .15) { seed('c1log'); pfill(limb([J.handF, add2(J.handF, [-30, -12])], [11, 10]), AP.timber, { tone: .8, sw: .8 }); } } });
    // hand1 on the bull rope, the boss beating time with his bowler
    seed('c1hand');
    const hb = frac(bpOf(t));
    man(1070, 884, 62, { ...kp(hb, [[0, POSES.haul], [.5, { ...POSES.haul, lean: -.1, shF: 1.5 }], [1, POSES.haul]]), flip: true, face: 'grit' }, CAST.hand1,
      { hold: J => { seed('c1r'); pline([J.handF, [980, 690]], 1.2, AP.earthDk, { over: 0 }); } });
    seed('c1boss');
    man(1215, 862, 50, { flip: true, shF: 2.2 + .5 * pulse(t, 6), elF: .6, shB: .2, head: -.1, face: 'shout', mouth: .3 * pulse(t, 5), dy: .05 * pulse(t, 8) }, CAST.boss);
    // the driller on the drive block: wind up slow, strike fast, landing on every other beat
    seed('c1drill');
    const k = frac((bpOf(t) - 131) / 2);
    // POSES.hamDown's arm angles wound a full turn back, so the blow goes OVER the head (not underarm through the legs)
    const DN = { ...POSES.hamDown };   // POSES.hamUp now stores its arms past +π, so this swings over the top
    const P = k < .06 ? { ...DN } : k < .62 ? kp(k, [[.06, DN], [.62, POSES.hamUp]], easeOut) : kp(k, [[.62, POSES.hamUp], [1, DN]], easeIn);
    let head = null;
    man(560, 884, 80, P, CAST.driller, { hold: J => { head = sledge(J.handF, J.angF + .9 * J.dir, 80).head; } });
    const strike = k < .15 ? Math.exp(-k * 2 * 12) : 0;
    if (strike > .05 && head) { pglow(head[0] + 30, head[1] + 20, 90 * strike, AP.lamp, strike); for (let i = 0; i < 8; i++) { const a = -Math.PI * hash(i * 3.3), r = 20 + 60 * (1 - strike); pline([[head[0] + 30, head[1] + 20], [head[0] + 30 + Math.cos(a) * r, head[1] + 20 + Math.sin(a) * r]], 1.2, AP.lamp, { over: 0, passes: 1, alpha: strike }); } }
    camOff();
    if (lt < .25) pageTurn(.5 + lt / .5);
  }

  // ================================================================================================
  // C2 · 75.60–81.24 · the dive, past the devil's hall (he glares as the rods go by), to 1300 ft
  // ================================================================================================
  function c2(t, lt, dur) {
    const depth = kf(lt, [[0, 0], [1.5, 820], [2.3, 1045], [3.9, 1062], [4.7, 1300], [dur, 1300]], ease);
    const z = kf(lt, [[0, .55], [1.3, .8], [2.3, 3.2], [3.9, 3.35], [4.7, .8], [dur, .8]], ease);
    hallInDive(t, lt, dur, { from: 0, to: 1300, k: depth / 1300, bitDepth: 1300, zoom: z }, () => ({ t, hole: 1, chair: 'crushed', crack: 1,
      front: () => { seed('lumpdive'); pfill([[-20, -10], [4, -13], [19, -8], [21, 5], [9, 12], [-13, 11], [-22, 3]].map(p => add2([948, 1313], rot2(p, .5))), STRATA[3][2], { tone: .85, dens: 1, sw: .45, j: .2, cross: .3 }); },
      after: H => {
        seed('devdive'); LIGHT = [.8, .3];
        const headD = (H.floorY - 5 * H.ds) / FT, glare = clamp((headD - depth) / 60 + .3, -1, 1), wince = pulse(t, 8);
        devil(HALL.x - 4.4 * HALL.s, H.floorY, H.ds, { face: 'annoyed', shF: 1.0, elF: 2.2, shB: .8, elB: 2.1, lean: -.05, head: -.15 * glare, lookUp: glare, look: .6,
          brow: .08, blink: wince * .5, tail: Math.sin(t * 7) * .9, cupOnHorn: 1, cupWob: .1 * Math.sin(t * 9), soak: .4, soakCol: TEA, dust: .6, dx: 0, squash: .05 * wince });
      } }));
    if (lt > dur - .35) scribbleWipe((lt - (dur - .35)) / .7);
  }

  shots([[47.9, s1], [52.16, s2], [56.52, s34], [66.08, s5], [69.7, c1], [75.6, c2]]);
})();
