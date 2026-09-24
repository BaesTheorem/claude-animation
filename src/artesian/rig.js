// artesian/rig.js: the people. One jointed figure, drawn in pencil, in two drawn views (never projected):
//   'side'  profile, facing right (flip: true faces left). The working view: hauling, hammering, firing.
//   'front' facing the camera. Reactions, cheering, looking up at the sky.
//
//   const J = man(x, y, s, pose, look, hooks)
//     (x, y)  the ground point between the feet (the lower foot is planted on y unless pose.dy lifts it)
//     s       head unit in px: the figure is ~8s tall. Medium shot s ≈ 60–80, close ≈ 110+, wide ≈ 20–35.
//     pose    angles in radians (see POSE0). Arms/legs: 0 = hanging straight down; + swings FORWARD (side view)
//             or OUTWARD (front view). el/kn bend the elbow/knee. lean tilts the torso forward, head tilts the head
//             (+ = chin down). face: 'neutral' | 'grit' | 'shout' | 'smile' | 'laugh' | 'worry' | 'wince' | 'closed'.
//             mouth 0..1 opens the mouth further (singing, shouting). look -1..1 moves the eyes. blink 0..1.
//     look    costume and build: see CAST for the regulars. Keep every regular on model by using CAST.
//     hooks   { behind(J), mid(J), hold(J), front(J) }: draw props at the right depth. hold() is drawn between the
//             body and the near arm, so a tool gripped in both hands sits between the arms.
//   J returns the joints in world space: hip, neck, head, shF/shB (shoulders), elF/elB, wrF/wrB, handF/handB,
//   knF/knB, ankF/ankB, top (hat top), s, dir, angF/angB (forearm angles). Use J.handF/J.handB to place anything held,
//   e.g. sledge(J.handF, J.angF + .9 * J.dir, J.s) for a two-handed hammer.
//
// Light comes from LIGHT (unit vector pointing FROM the light), so form shading agrees with the scene's sun or lamp.
let LIGHT = [.6, .8];

const POSE0 = { view: 'side', flip: false, lean: 0, head: 0, dx: 0, dy: 0,
  shF: .1, elF: .25, shB: -.12, elB: .3, hpF: .06, knF: .05, hpB: -.06, knB: .05, footF: 0, footB: 0,
  face: 'neutral', mouth: 0, look: 0, blink: 0, squash: 0 };

const CAST = {
  // the driller: the John Henry of the crew. Huge, bald under the slouch hat, black beard, singlet, braces.
  driller: { skin: '#9A6440', skinDk: '#5E3A24', shirt: '#E8DDC4', sleeves: 'none', pants: AP.denim, braces: AP.earthDk, hat: 'slouch', hatCol: '#5B4A3A', beard: 'full', beardCol: '#2A2320', hair: '#2A2320', build: 1.3, boots: '#3A2A20' },
  // Canadian Bill: the fireman. Lanky, red flannel, red beard, knitted toque.
  bill: { skin: '#D39A72', skinDk: '#94613F', shirt: AP.flannel, check: '#5E1E18', sleeves: 'rolled', pants: '#5A5046', hat: 'toque', hatCol: '#2F4E6E', beard: 'full', beardCol: '#B0502A', hair: '#B0502A', build: .92, tall: 1.06, boots: '#3A2A20' },
  // the boss: the contractor. Stout, bowler, waistcoat, watch chain, walrus moustache.
  boss: { skin: '#D8A07A', skinDk: '#9C6644', shirt: '#EDE3CF', sleeves: 'long', vest: '#4A4038', pants: '#4E4A48', hat: 'bowler', hatCol: '#2E2A28', beard: 'mustache', beardCol: '#8A8078', hair: '#8A8078', build: 1.08, belly: .8, chain: AP.brass, boots: '#2A2220' },
  // the squatter: the station owner. Lean, grey beard, wide pale hat, white shirt.
  squatter: { skin: '#D3A07E', skinDk: '#94664A', shirt: '#F0E8D8', sleeves: 'long', vest: null, pants: '#8A7A5E', hat: 'wide', hatCol: '#C9B48A', beard: 'full', beardCol: '#B8B2A8', hair: '#B8B2A8', build: .95, boots: '#5A3E28' },
  // two more hands on the crew
  hand1: { skin: '#C48A60', skinDk: '#86573A', shirt: '#7E8F9E', sleeves: 'rolled', pants: '#6B5B47', hat: 'cap', hatCol: '#4A443E', beard: 'stubble', beardCol: '#4A3A2E', hair: '#4A3A2E', build: 1, boots: '#3A2A20' },
  hand2: { skin: '#DDA886', skinDk: '#9E6C4E', shirt: '#B98A52', sleeves: 'rolled', pants: AP.denimDk, hat: 'slouch', hatCol: '#8A6A44', beard: 'mustache', beardCol: '#6A4A30', hair: '#6A4A30', build: .95, boots: '#3A2A20' },
  // the canny Scot, in Glasgow (verse 3)
  scot: { skin: '#E3B090', skinDk: '#A87050', shirt: '#E8E0D0', sleeves: 'rolled', vest: '#3E4E3A', pants: '#4A5A48', hat: 'tam', hatCol: '#2E4A3A', beard: 'sideburns', beardCol: '#C0602E', hair: '#C0602E', build: .9, apron: '#6A5A48', boots: '#2A2220' },
};

const _dirv = (a, dir) => [Math.sin(a) * dir, Math.cos(a)];          // 0 = straight down, + = forward
const _shadeCol = c => mixCol(c, AP.graphite, .28);

function man(x, y, s, pose = {}, look = CAST.driller, hooks = {}) {
  const P = { ...POSE0, ...pose }, L = look, b = L.build || 1, tall = L.tall || 1, front = P.view === 'front';
  const dir = P.flip ? -1 : 1, sq = P.squash || 0;
  // ---- skeleton (built at hip = origin, then planted) ----
  const thigh = 2.0 * s * tall, shin = 2.0 * s * tall, up = 1.5 * s * tall, fore = 1.4 * s * tall, torsoL = 2.85 * s * tall * (1 - sq * .25);
  const lean = P.lean * (front ? 0 : 1), uV = [Math.sin(lean) * dir, -Math.cos(lean)], fV = [Math.cos(lean) * dir, Math.sin(lean)];
  const at = (o, u, f) => [o[0] + uV[0] * u + fV[0] * f, o[1] + uV[1] * u + fV[1] * f];
  let hip = [0, 0];
  const legs = side => {
    const hp = side ? P.hpF : P.hpB, kn = side ? P.knF : P.knB;
    let h0, d = dir;
    if (front) { h0 = [(side ? 1 : -1) * .55 * s * b, 0]; d = side ? 1 : -1; } else h0 = [dir * (side ? .12 : -.12) * s, 0];
    const k = add2(h0, _dirv(hp, d).map(v => v * thigh)), a = add2(k, _dirv(hp - kn, d).map(v => v * shin));
    return { h0, k, a, d };
  };
  let LF = legs(1), LB = legs(0);
  const boot = .32 * s;
  const low = Math.max(LF.a[1], LB.a[1]) + boot;
  const ox = x + P.dx * s, oy = y - low - P.dy * s;
  const T = p => [p[0] + ox, p[1] + oy];
  hip = T(hip); LF = { k: T(LF.k), a: T(LF.a), h0: T(LF.h0), d: LF.d }; LB = { k: T(LB.k), a: T(LB.a), h0: T(LB.h0), d: LB.d };
  const neck = at(hip, torsoL, 0);
  const shW = front ? 1.25 * s * b : 0;
  const shF = front ? [neck[0] + shW, neck[1] + .35 * s] : at(neck, -.4 * s, .12 * s * b), shB = front ? [neck[0] - shW, neck[1] + .35 * s] : at(neck, -.45 * s, -.3 * s * b);
  const arm = side => {
    const sh = side ? shF : shB, a1 = side ? P.shF : P.shB, e = side ? P.elF : P.elB, d = front ? (side ? 1 : -1) : dir;
    const el = add2(sh, _dirv(a1, d).map(v => v * up)), wr = add2(el, _dirv(a1 + e, d).map(v => v * fore)), hand = add2(wr, _dirv(a1 + e, d).map(v => v * .32 * s));
    return { sh, el, wr, hand, d };
  };
  const AF = arm(1), AB = arm(0);
  const ha = front ? 0 : (P.lean * .5 + P.head) * dir, headC = add2(neck, rot2([0, -.78 * s], front ? 0 : ha));
  const J = { hip, neck, head: headC, shF: AF.sh, shB: AB.sh, elF: AF.el, elB: AB.el, wrF: AF.wr, wrB: AB.wr, handF: AF.hand, handB: AB.hand,
    knF: LF.k, knB: LB.k, ankF: LF.a, ankB: LB.a, s, dir, view: P.view, top: add2(headC, [0, -.9 * s]),
    angF: Math.atan2(AF.hand[1] - AF.el[1], AF.hand[0] - AF.el[0]), angB: Math.atan2(AB.hand[1] - AB.el[1], AB.hand[0] - AB.el[0]) };

  // ---- drawing ----
  const skin = L.skin, skinDk = L.skinDk, sw = Math.max(.7, s / 55);
  const limbFill = (pts, ws, col, far, o = {}) => {
    const c = far ? _shadeCol(col) : col, out = limb(pts, ws);
    pfill(out, c, { tone: .55, dens: .75, sw, ...o });
    // form shading: a narrower copy pushed away from the light
    const sh = limb(pts.map(p => [p[0] + LIGHT[0] * ws[1] * .3, p[1] + LIGHT[1] * ws[1] * .3]), ws.map(w => w * .6));
    X.save(); tracePath(out); X.clip();
    pshade(sh, mixCol(c, AP.graphite, .55), .6);
    if (o.lit) plit(limb(pts.map(p => [p[0] - LIGHT[0] * ws[1] * .22, p[1] - LIGHT[1] * ws[1] * .22]), ws.map(w => w * .3)), .5);
    X.restore();
  };
  const drawArm = (A, far) => {
    const bb = b * (L.sleeves === 'none' ? 1.1 : 1);
    const P5 = [A.sh, lerp2(A.sh, A.el, .45), A.el, lerp2(A.el, A.wr, .4), A.wr], W5 = [.66, .74, .56, .66, .44].map(w => w * s * bb);
    const base = L.sleeves === 'long' ? L.shirt : skin;
    limbFill(P5, W5, base, far, { lit: base === skin });
    if (L.sleeves === 'rolled' || L.sleeves === 'none') {
      const cuff = L.sleeves === 'rolled' ? [A.sh, lerp2(A.sh, A.el, .5), A.el, lerp2(A.el, A.wr, .14)] : [A.sh, lerp2(A.sh, A.el, .22)];
      pfill(limb(cuff, (L.sleeves === 'rolled' ? [.76, .8, .72, .7] : [.8, .7]).map(w => w * s * bb)), far ? _shadeCol(L.shirt) : L.shirt, { tone: .62, sw });
      if (L.check) pshade(limb(cuff, [.7, .7, .7, .7].slice(0, cuff.length).map(w => w * s * bb)), L.check, .5, { kind: 'v' });
    } else if (L.check) pshade(limb(P5, W5), L.check, .5, { kind: 'v' });
    // hand: a mitten with a thumb, turned along the forearm
    const hc = far ? _shadeCol(skin) : skin, fa = Math.atan2(A.hand[1] - A.wr[1], A.hand[0] - A.wr[0]), hs = .36 * s * bb;
    const hp = [[-.2, -.9], [.6, -.8], [1.05, -.3], [1.1, .35], [.6, .85], [-.1, .8], [-.3, .3]].map(([u, v]) => add2(A.hand, rot2([u * hs, v * hs * A.d * (front ? 1 : 1)], fa)));
    pfill(hp, hc, { tone: .65, sw, curv: true });
    pline([add2(A.hand, rot2([.1 * hs, -.75 * hs], fa)), add2(A.hand, rot2([.55 * hs, -1.05 * hs], fa))], sw * 1.1, _shadeCol(skinDk), { over: 0 });
  };
  const drawLeg = (G, far) => {
    const c = far ? _shadeCol(L.pants) : L.pants;
    limbFill([G.h0, lerp2(G.h0, G.k, .5), G.k, lerp2(G.k, G.a, .5), G.a], [.95, .82, .66, .58, .5].map(w => w * s * b), c, false);
    // boot: planted flat, toe forward
    const fwd = front ? 0 : G.d, bc = far ? _shadeCol(L.boots || AP.coal) : (L.boots || AP.coal), a = G.a;
    const bp = front ? [[a[0] - .28 * s, a[1] - .1 * s], [a[0] + .28 * s, a[1] - .1 * s], [a[0] + .34 * s, a[1] + boot], [a[0] - .34 * s, a[1] + boot]]
      : [[a[0] - fwd * .25 * s, a[1] - .15 * s], [a[0] + fwd * .2 * s, a[1] - .12 * s], [a[0] + fwd * .75 * s, a[1] + .1 * s], [a[0] + fwd * .8 * s, a[1] + boot], [a[0] - fwd * .32 * s, a[1] + boot]];
    pfill(bp, bc, { tone: .8, dens: 1, sw });
  };
  const drawTorso = () => {
    const bl = L.belly || 0, pts = front
      ? [[neck[0] - .55 * s, neck[1] + .05 * s], [shB[0] - .1 * s, shB[1] - .12 * s], [shB[0] + .05 * s * b, shB[1] + .9 * s], [hip[0] - (.85 + bl * .2) * s * b, hip[1] - .9 * s], [hip[0] - .8 * s * b, hip[1] + .35 * s],
         [hip[0] + .8 * s * b, hip[1] + .35 * s], [hip[0] + (.85 + bl * .2) * s * b, hip[1] - .9 * s], [shF[0] - .05 * s * b, shF[1] + .9 * s], [shF[0] + .1 * s, shF[1] - .12 * s], [neck[0] + .55 * s, neck[1] + .05 * s]]
      : [at(neck, -.05 * s, -.35 * s * b), at(neck, -.55 * s, -.72 * s * b), at(hip, 1.3 * s, -.62 * s * b), at(hip, 0, -.75 * s * b), at(hip, -.35 * s, -.5 * s * b), at(hip, -.35 * s, .55 * s * b),
         at(hip, .5 * s, (.62 + bl * .5) * s * b), at(hip, 1.3 * s, (.72 + bl * .45) * s * b), at(neck, -.75 * s, .85 * s * b), at(neck, -.25 * s, .55 * s * b), at(neck, 0, .25 * s)];
    const tc = L.vest || L.shirt;
    if (L.sleeves === 'none') {  // singlet: skin shows at the shoulders and chest
      pfill(pts, skin, { tone: .55, dens: .7, sw, curv: true });
      const sg = front ? [[neck[0] - .35 * s, neck[1] + .5 * s], [shB[0] + .35 * s, shB[1] + .1 * s], ...pts.slice(2, 8), [shF[0] - .35 * s, shF[1] + .1 * s], [neck[0] + .35 * s, neck[1] + .5 * s]]
        : [at(neck, -.3 * s, -.5 * s * b), at(neck, -.55 * s, -.7 * s * b), ...pts.slice(2, 8), at(neck, -.85 * s, .8 * s * b), at(neck, -.45 * s, .35 * s * b)];
      pfill(sg, L.shirt, { tone: .65, dens: .6, sw, curv: true });
    } else pfill(pts, tc === L.vest ? L.shirt : tc, { tone: .6, dens: .75, sw, curv: true });
    if (L.check) pshade(pts, L.check, .55, { kind: 'v', curv: true });
    if (L.vest) {
      const vp = front ? [[neck[0] - .3 * s, neck[1] + .4 * s], ...pts.slice(2, 8), [neck[0] + .3 * s, neck[1] + .4 * s], [neck[0], neck[1] + 1.4 * s]]
        : [at(neck, -.4 * s, -.62 * s * b), ...pts.slice(2, 8), at(neck, -.9 * s, .8 * s * b), at(neck, -.5 * s, .3 * s * b)];
      pfill(vp, L.vest, { tone: .7, dens: .9, sw, curv: true });
    }
    if (L.apron) pfill(front ? [[hip[0] - .7 * s, hip[1] - 1.2 * s], [hip[0] + .7 * s, hip[1] - 1.2 * s], [hip[0] + .8 * s, hip[1] + 1.8 * s], [hip[0] - .8 * s, hip[1] + 1.8 * s]]
      : [at(hip, 1.3 * s, .3 * s), at(hip, 1.4 * s, .75 * s), at(hip, -1.8 * s, .95 * s), at(hip, -1.8 * s, .4 * s)], L.apron, { tone: .6, sw });
    // form shade on the side away from the light
    const shp = pts.map(p => [p[0] + LIGHT[0] * .35 * s, p[1] + LIGHT[1] * .2 * s]);
    X.save(); tracePath(pts, true, true); X.clip(); pshade(shp, AP.graphite, .35, { curv: true }); X.restore();
    if (L.braces) {
      if (front) { for (const sd of [-1, 1]) pline([[neck[0] + sd * .7 * s, neck[1] + .3 * s], [hip[0] + sd * .5 * s * b, hip[1] - .2 * s]], sw * 1.6, L.braces, { over: 0 }); }
      else { pline([at(neck, -.35 * s, .35 * s * b), at(hip, .2 * s, .45 * s * b)], sw * 1.6, L.braces, { over: 0 }); pline([at(neck, -.4 * s, -.3 * s * b), at(hip, .2 * s, -.45 * s * b)], sw * 1.4, _shadeCol(L.braces), { over: 0 }); }
    }
    if (L.chain) pline(front ? [[hip[0] - .5 * s, hip[1] - .8 * s], [hip[0], hip[1] - .55 * s], [hip[0] + .5 * s, hip[1] - .8 * s]] : [at(hip, .8 * s, .7 * s * b), at(hip, .6 * s, .95 * s * b), at(hip, .9 * s, 1.0 * s * b)], sw, L.chain, { curv: true, over: 0 });
    // belt
    pline(front ? [[hip[0] - .85 * s * b, hip[1] - .05 * s], [hip[0] + .85 * s * b, hip[1] - .05 * s]] : [at(hip, 0, -.72 * s * b), at(hip, 0, (.6 + (L.belly || 0) * .4) * s * b)], sw * 2.2, AP.earthDk, { over: 0 });
  };
  const drawHead = () => {
    const c = headC, R = (u, f) => { const p = front ? [f, u] : [f * dir, u]; return add2(c, rot2(p, front ? P.head * .15 : ha)); };
    // neck
    pfill(limb([neck, lerp2(neck, c, .6)], [.72 * s * b, .6 * s * Math.min(1.2, b)]), skin, { tone: .6, sw });
    let hp;
    if (front) hp = ellPts(c[0], c[1] + .05 * s, .5 * s, .62 * s, 22);
    else hp = [R(-.62 * s, -.2 * s), R(-.52 * s, .28 * s), R(-.25 * s, .5 * s), R(-.12 * s, .5 * s), R(.1 * s, .72 * s), R(.2 * s, .52 * s), R(.32 * s, .56 * s), R(.52 * s, .5 * s), R(.66 * s, .28 * s), R(.62 * s, -.15 * s), R(.3 * s, -.5 * s), R(-.25 * s, -.55 * s)];
    pfill(hp, skin, { tone: .6, dens: .7, sw, curv: !front });
    pshade(front ? ellPts(c[0] + LIGHT[0] * .18 * s, c[1] + .1 * s, .36 * s, .5 * s, 14) : [R(-.3 * s, -.45 * s), R(.5 * s, -.3 * s), R(.5 * s, -.1 * s), R(-.2 * s, -.2 * s)], skinDk, .5);
    // beard / moustache
    const bc = L.beardCol;
    if (L.beard === 'full') pfill(front ? [[c[0] - .5 * s, c[1]], [c[0] - .42 * s, c[1] + .5 * s], [c[0], c[1] + .8 * s], [c[0] + .42 * s, c[1] + .5 * s], [c[0] + .5 * s, c[1]], [c[0] + .25 * s, c[1] + .3 * s], [c[0] - .25 * s, c[1] + .3 * s]]
      : [R(.05 * s, -.18 * s), R(.28 * s, .35 * s), R(.35 * s, .52 * s), R(.6 * s, .45 * s), R(.8 * s, .2 * s), R(.55 * s, -.25 * s)], bc, { tone: .7, dens: 1.2, sw: sw * .8, curv: true });
    if (L.beard === 'sideburns') pfill(front ? [[c[0] - .5 * s, c[1] - .2 * s], [c[0] - .38 * s, c[1] + .35 * s], [c[0] - .3 * s, c[1] + .1 * s]] : [R(-.25 * s, -.1 * s), R(.25 * s, .05 * s), R(.3 * s, .15 * s), R(-.1 * s, .12 * s)], bc, { tone: .7, dens: 1, sw: sw * .7 });
    if (L.beard === 'stubble') pshade(front ? ellPts(c[0], c[1] + .38 * s, .4 * s, .25 * s, 12) : [R(.1 * s, .05 * s), R(.3 * s, .45 * s), R(.55 * s, .45 * s), R(.55 * s, 0)], bc, .6);
    if (L.beard === 'mustache' || L.beard === 'full') pfill(front ? [[c[0] - .3 * s, c[1] + .25 * s], [c[0], c[1] + .17 * s], [c[0] + .3 * s, c[1] + .25 * s], [c[0] + .2 * s, c[1] + .33 * s], [c[0], c[1] + .27 * s], [c[0] - .2 * s, c[1] + .33 * s]]
      : [R(.15 * s, .3 * s), R(.18 * s, .52 * s), R(.35 * s, .5 * s), R(.38 * s, .3 * s)], bc, { tone: .8, dens: 1.2, sw: sw * .7 });
    // face
    const f = P.face, open = clamp(P.mouth + ({ shout: .9, laugh: .7, grit: .15, wince: .1 }[f] || 0)), lk = P.look * .08 * s;
    const eyeY = -.08 * s, blink = Math.max(P.blink, f === 'closed' || f === 'laugh' ? 1 : 0);
    const eye = e => { if (blink > .6) pline([[e[0] - .08 * s, e[1]], [e[0] + .08 * s, e[1] + .02 * s]], sw * 1.1, AP.graphite, { over: 0 }); else pfill(ellPts(e[0], e[1], .06 * s, .07 * s * (1 - blink), 8), AP.graphite, { tone: .9, dens: 1, ink: null }); };
    const browA = { grit: .35, shout: .3, worry: -.35, wince: .3, smile: -.08, laugh: -.1 }[f] || 0;
    if (front) {
      for (const sd of [-1, 1]) { const e = [c[0] + sd * .2 * s + lk, c[1] + eyeY]; eye(e); pline([[e[0] - .13 * s, e[1] - .14 * s + sd * browA * .06 * s * -1], [e[0] + .13 * s, e[1] - .14 * s + sd * browA * .06 * s]], sw * 1.3, bc || AP.graphite, { over: 0 }); }
      pline([[c[0] - .02 * s, c[1] - .02 * s], [c[0] + .05 * s, c[1] + .14 * s], [c[0] - .04 * s, c[1] + .16 * s]], sw * .8, skinDk, { over: 0 });
      const my = c[1] + .38 * s, mw = f === 'smile' || f === 'laugh' ? .2 * s : .14 * s;
      if (open > .12) pfill(ellPts(c[0], my + open * .05 * s, mw * (1 + open * .3), .06 * s + open * .16 * s, 12), '#4A2420', { tone: .9, dens: 1, sw: sw * .8 });
      else pline(f === 'smile' ? [[c[0] - mw, my - .04 * s], [c[0], my + .04 * s], [c[0] + mw, my - .04 * s]] : f === 'worry' ? [[c[0] - mw, my + .03 * s], [c[0], my - .02 * s], [c[0] + mw, my + .03 * s]] : [[c[0] - mw, my], [c[0] + mw, my]], sw, AP.graphite, { curv: true, over: 0 });
    } else {
      const e = R(eyeY, .3 * s + lk); eye(e);
      pline([R(eyeY - .15 * s - browA * .05 * s, .2 * s), R(eyeY - .13 * s + browA * .07 * s, .42 * s)], sw * 1.4, bc || AP.graphite, { over: 0 });
      pline([R(-.08 * s, -.08 * s), R(.02 * s, -.02 * s), R(.12 * s, -.08 * s)], sw * .8, skinDk, { curv: true, over: 0 });   // ear
      if (open > .12) pfill([R(.3 * s, .32 * s), R(.3 * s + open * .2 * s, .5 * s), R(.36 * s + open * .22 * s, .38 * s)], '#4A2420', { tone: .9, dens: 1, sw: sw * .8 });
      else pline([R(.34 * s, .3 * s), R(.36 * s + (f === 'smile' ? -.04 : f === 'worry' ? .04 : 0) * s, .46 * s)], sw, AP.graphite, { over: 0 });
    }
    // hair at the back if no hat hides it; hat
    const hc = L.hatCol, top = front ? [c[0], c[1] - .55 * s] : R(-.55 * s, 0);
    J.top = front ? [c[0], c[1] - 1.1 * s] : R(-1.1 * s, 0);
    if (L.hat === 'slouch' || L.hat === 'wide') {
      const bw = (L.hat === 'wide' ? 1.25 : 1.05) * s;
      const brim = front ? [[c[0] - bw, c[1] - .38 * s], [c[0], c[1] - .5 * s], [c[0] + bw, c[1] - .38 * s], [c[0] + bw * .9, c[1] - .3 * s], [c[0], c[1] - .36 * s], [c[0] - bw * .9, c[1] - .3 * s]]
        : [R(-.42 * s, -bw * .85), R(-.55 * s, 0), R(-.45 * s, bw), R(-.37 * s, bw * .95), R(-.45 * s, 0), R(-.33 * s, -bw * .8)];
      const crown = front ? [[c[0] - .5 * s, c[1] - .42 * s], [c[0] - .45 * s, c[1] - .95 * s], [c[0], c[1] - 1.05 * s], [c[0] + .45 * s, c[1] - .95 * s], [c[0] + .5 * s, c[1] - .42 * s]]
        : [R(-.45 * s, -.5 * s), R(-.98 * s, -.4 * s), R(-1.05 * s, .05 * s), R(-.95 * s, .45 * s), R(-.45 * s, .52 * s)];
      pfill(crown, hc, { tone: .7, dens: .9, sw, curv: true });
      pline(front ? [[c[0] - .5 * s, c[1] - .52 * s], [c[0] + .5 * s, c[1] - .52 * s]] : [R(-.55 * s, -.48 * s), R(-.58 * s, .5 * s)], sw * 2.4, mixCol(hc, AP.graphite, .5), { over: 0 });
      pfill(brim, hc, { tone: .75, dens: 1, sw, curv: true });
    } else if (L.hat === 'bowler') {
      pfill(front ? [[c[0] - .5 * s, c[1] - .45 * s], [c[0] - .48 * s, c[1] - .9 * s], [c[0], c[1] - 1.1 * s], [c[0] + .48 * s, c[1] - .9 * s], [c[0] + .5 * s, c[1] - .45 * s]]
        : [R(-.45 * s, -.5 * s), R(-.9 * s, -.45 * s), R(-1.1 * s, 0), R(-.9 * s, .45 * s), R(-.45 * s, .5 * s)], hc, { tone: .85, dens: 1.1, sw, curv: true });
      pfill(front ? [[c[0] - .7 * s, c[1] - .42 * s], [c[0], c[1] - .5 * s], [c[0] + .7 * s, c[1] - .42 * s], [c[0], c[1] - .36 * s]]
        : [R(-.38 * s, -.72 * s), R(-.5 * s, 0), R(-.4 * s, .7 * s), R(-.44 * s, 0)], hc, { tone: .9, dens: 1, sw, curv: true });
      plit(front ? [[c[0] - .3 * s, c[1] - .95 * s], [c[0] - .1 * s, c[1] - 1.02 * s], [c[0] - .2 * s, c[1] - .7 * s]] : [R(-.95 * s, -.3 * s), R(-1.02 * s, .05 * s), R(-.8 * s, 0)], .5);
    } else if (L.hat === 'cap') {
      pfill(front ? [[c[0] - .55 * s, c[1] - .4 * s], [c[0] - .5 * s, c[1] - .78 * s], [c[0] + .5 * s, c[1] - .78 * s], [c[0] + .55 * s, c[1] - .4 * s]]
        : [R(-.4 * s, -.5 * s), R(-.8 * s, -.4 * s), R(-.8 * s, .5 * s), R(-.55 * s, .78 * s), R(-.45 * s, .45 * s)], hc, { tone: .8, dens: 1, sw, curv: true });
    } else if (L.hat === 'toque') {
      pfill(front ? [[c[0] - .52 * s, c[1] - .35 * s], [c[0] - .45 * s, c[1] - .95 * s], [c[0], c[1] - 1.12 * s], [c[0] + .45 * s, c[1] - .95 * s], [c[0] + .52 * s, c[1] - .35 * s]]
        : [R(-.35 * s, -.52 * s), R(-.95 * s, -.45 * s), R(-1.15 * s, -.05 * s), R(-.95 * s, .4 * s), R(-.4 * s, .5 * s)], hc, { tone: .8, dens: 1.2, sw, curv: true, kind: 'v' });
      pline(front ? [[c[0] - .52 * s, c[1] - .48 * s], [c[0] + .52 * s, c[1] - .48 * s]] : [R(-.48 * s, -.52 * s), R(-.52 * s, .5 * s)], sw * 3, mixCol(hc, AP.paperLt, .35), { over: 0 });
    } else if (L.hat === 'tam') {
      pfill(front ? ellPts(c[0], c[1] - .62 * s, .72 * s, .28 * s, 16) : ellPts(...R(-.62 * s, 0), .72 * s, .26 * s, 16, 0, ha - .15 * dir), hc, { tone: .8, dens: 1, sw });
      pfill(ellPts(...(front ? [c[0], c[1] - .95 * s] : R(-.92 * s, -.1 * s)), .14 * s, .14 * s, 10), AP.red, { tone: .9, sw });
    } else pfill(front ? ellPts(c[0], c[1] - .35 * s, .5 * s, .3 * s, 14) : [R(-.35 * s, -.52 * s), R(-.62 * s, -.2 * s), R(-.6 * s, .25 * s), R(-.4 * s, .45 * s)], L.hair, { tone: .7, dens: 1, sw });
  };

  if (hooks.behind) hooks.behind(J);
  drawArm(AB, !front); drawLeg(LB, !front);
  if (front) drawLeg(LF, false);
  drawTorso();
  if (!front) drawLeg(LF, false);
  if (hooks.mid) hooks.mid(J);
  drawHead();
  if (hooks.hold) hooks.hold(J);
  drawArm(AF, false);
  if (hooks.front) hooks.front(J);
  return J;
}
// Pose blending: kp(t, [[t0, poseA], [t1, poseB], ...], ease) interpolates every numeric field; strings switch at the key.
function kp(t, keys, e = ease) {
  if (t <= keys[0][0]) return { ...keys[0][1] };
  for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) {
    const [a, A] = keys[i - 1], [b, B] = keys[i], k = e((t - a) / (b - a)), o = { ...A };
    for (const f in B) o[f] = typeof B[f] === 'number' && typeof A[f] === 'number' ? lerp(A[f], B[f], k) : (k < .5 ? (A[f] ?? B[f]) : B[f]);
    return o;
  }
  return { ...keys[keys.length - 1][1] };
}
// Common working poses (side view). Mix with kp() and the beat.
const POSES = {
  stand:   { shF: .08, elF: .2, shB: -.1, elB: .25 },
  // sledgehammer: raise (wind-up high over the back shoulder) → strike (driven down in front). hamUp's arm angles are
  // stored past +π so kp(hamDown → hamUp) swings forward and OVER the head, never under.
  hamUp:   { lean: -.12, shF: TAU - 2.6, elF: .5, shB: TAU - 2.4, elB: .35, hpF: .25, knF: .15, hpB: -.2, knB: .1, head: -.25, face: 'grit' },
  hamDown: { lean: .45, shF: .9, elF: -.1, shB: .75, elB: .05, hpF: .45, knF: .55, hpB: -.25, knB: .35, head: .2, face: 'shout', mouth: .4 },
  // hauling on a rope or a lever, leaning back
  haul:    { lean: -.35, shF: 1.2, elF: .3, shB: 1.35, elB: .15, hpF: .45, knF: .2, hpB: -.35, knB: .25, face: 'grit' },
  // heaving on the pipe tongs, pushing forward
  heave:   { lean: .6, shF: 1.35, elF: .4, shB: 1.5, elB: .2, hpF: .7, knF: 1.0, hpB: -.45, knB: .15, face: 'grit' },
  cheer:   { view: 'front', shF: 2.7, elF: -.25, shB: 2.6, elB: -.3, face: 'shout', mouth: .6, head: -.3 },
  fist:    { lean: -.15, shF: 2.4, elF: .9, shB: -.15, elB: .3, face: 'shout', head: -.45 },
};
