// Chapter C · 81.24–116.30 s · The Glasgow engine. See docs/artesian/STORYBOARD.md and BRIEF.md.
(() => {
  // ---------- periodic keys: smooth cyclic interpolation (gait cycles) ----------
  // keys [[p, v], ...] with p in [0, 1), wrapping round. Catmull-Rom through them, so the cycle never stops on a key.
  function cyc(p, keys) {
    p = frac(p); const n = keys.length;
    let i = n - 1; for (let k = 0; k < n; k++) if (p >= keys[k][0]) i = k;
    const P = j => keys[((j % n) + n) % n], p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const span = frac(p2[0] - p1[0]) || 1, u = frac(p - p1[0]) / span, u2 = u * u, u3 = u2 * u;
    return .5 * (2 * p1[1] + (p2[1] - p0[1]) * u + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 + (3 * p1[1] - p0[1] - 3 * p2[1] + p3[1]) * u3);
  }
  const dv = a => [Math.sin(a), Math.cos(a)];                         // 0 = straight down, + = forward
  // a limb filled, inked along its two long sides only (no cap line where it joins the body)
  function limbC(P, ws, col, o = {}) {
    const out = limb(P, ws, 3), h = out.length / 2;
    pfill(out, col, { ...o, ink: null });
    if (o.ink) for (const side of [out.slice(0, h), out.slice(h)]) pline(side, o.sw ?? 1, o.ink, { over: 0, passes: 1, alpha: o.alpha ?? 1, j: .7 });
  }

  // ---------- the smoke horse: a transverse gallop, one stride per p 0..1 ----------
  // (x, y) = middle of the barrel, u = unit (the horse is ~8u nose to tail), o.dir -1 faces left,
  // o.form 0..1 condenses it out of the smoke, o.col the smoke colour, o.key a seed.
  const H_FORE_A = [[0, .55], [.3, -.6], [.45, -.5], [.65, .05], [.85, .75], [.95, .62]];
  const H_FORE_F = [[0, .05], [.3, .15], [.45, 1.3], [.6, 1.9], [.8, .45], [.9, 0]];
  const H_HIND_A = [[0, .5], [.3, -.85], [.42, -.9], [.65, -.1], [.85, .7], [.95, .6]];
  const H_HIND_F = [[0, 0], [.3, .1], [.45, .9], [.6, 1.35], [.8, .45], [.95, 0]];
  function horse(x, y, u, p, o = {}) {
    const d = o.dir ?? -1, form = o.form ?? 1, col = o.col || '#B9B2A8', dk = mixCol(col, AP.graphite, .45);
    const F = (pts, c, q) => { pfill(pts, c, { ...q, ink: null }); if (q.ink) pline(pts, q.sw ?? 1.6, q.ink, { closed: true, curv: q.curv, alpha: form }); };
    const pitch = .07 * Math.sin(TAU * (p - .55)), bob = -.28 * u * Math.cos(TAU * (p - .85));
    const Wp = q => { const r = rot2(q, pitch); return [x + d * r[0] * u, y + bob + r[1] * u]; };
    const leg = (root, ph, fore, far) => {
      const q = frac(p - ph), a = cyc(q, fore ? H_FORE_A : H_HIND_A), f = cyc(q, fore ? H_FORE_F : H_HIND_F);
      const up = fore ? a : a - .45, lo = fore ? a - f : a - .45 + .45 + f;
      const L1 = fore ? 1.25 : 1.3, L2 = fore ? 1.15 : 1.2;
      const k = add2(root, dv(up).map(v => v * L1)), a2 = add2(k, dv(lo).map(v => v * L2)), hoof = add2(a2, dv(lo + (fore ? .35 : .25)).map(v => v * .32));
      const P = [root, lerp2(root, k, .5), k, lerp2(k, a2, .5), a2, hoof].map(Wp);
      const ws = (fore ? [.62, .45, .3, .22, .2, .26] : [.8, .55, .32, .22, .2, .26]).map(w => w * u);
      limbC(P, ws, far ? dk : col, { tone: .5 * form, dens: .7 * form, sw: 1, ink: far ? null : mixCol(AP.graphite, col, .35), alpha: form });
      if (!far && form > .3) pline([P[4], P[5]], 1.4, AP.graphite, { over: 0, alpha: form * .8 });
    };
    // legs first (the translucent body smokes over their roots), then tail, neck, body, head, mane
    leg([1.5, .5], .3, true, true); leg([-1.45, .4], 0, false, true);
    leg([-1.45, .4], .1, false, false); leg([1.5, .5], .4, true, false);
    const tw = Math.sin(TAU * (p + .2)) * .35;
    const tail = [[-2.1, -.45], [-2.9, -.55 + tw * .3], [-3.7, -.35 + tw * .7], [-4.4, -.05 + tw]].map(Wp);
    F(limb(tail, [.45, .6, .5, .1].map(w => w * u), 4), col, { tone: .4 * form, dens: .7 * form, ink: null });
    for (let i = 0; i < 4; i++) pline(tail.map((q, j) => [q[0], q[1] + (i - 1.5) * .12 * u * j]), .9, dk, { curv: true, over: 0, passes: 1, alpha: form * .7 });
    const nr = .14 * Math.sin(TAU * (p - .1));                             // the neck pumps with the stride
    const NB = [1.3, -.2], poll = add2(NB, rot2([1.75, -1.25], nr)), muz = add2(poll, rot2([1.1, .75], nr * .6));
    limbC([NB, lerp2(NB, poll, .5), poll].map(Wp), [1.6, .95, .6].map(w => w * u), col, { tone: .5 * form, dens: .75 * form, sw: 1.1, ink: mixCol(AP.graphite, col, .3), alpha: form });
    const body = [[2.05, -.15], [2.25, .3], [1.85, .8], [.6, 1.0], [-.7, .95], [-1.7, .72], [-2.25, .15], [-2.2, -.45], [-1.6, -.72], [-.6, -.58], [.5, -.6], [1.3, -.82]].map(Wp);
    F(body, col, { tone: .5 * form, dens: .75 * form, curv: true, sw: 1.1, ink: mixCol(AP.graphite, col, .3) });
    pshade([[-1.9, .3], [1.8, .45], [1.7, .8], [.6, 1.0], [-.7, .95], [-1.7, .7]].map(Wp), dk, .7 * form, { curv: true });
    F(limb([poll, lerp2(poll, muz, .55), muz].map(Wp), [.66, .52, .38].map(w => w * u), 3), col, { tone: .55 * form, dens: .8 * form, sw: 1, ink: mixCol(AP.graphite, col, .3) });
    F([add2(poll, [-.2, -.05]), add2(poll, rot2([-.5, -.45], nr)), add2(poll, [.1, -.25])].map(Wp), col, { tone: .6 * form, sw: .8, ink: mixCol(AP.graphite, col, .3) });
    if (form > .5) { const e = Wp(lerp2(poll, muz, .3)); F(ellPts(e[0], e[1] - .08 * u, .07 * u, .06 * u, 7), AP.graphite, { tone: .9 * form, ink: null }); }
    for (let i = 0; i < 6; i++) {                                           // mane streaming back off the crest
      const b = lerp2(add2(NB, [.1, -.7]), add2(poll, [-.15, -.15]), i / 5), fl = Math.sin(TAU * p * 2 + i) * .15;
      pline([b, add2(b, [-.7 - .1 * i, -.3 + fl]), add2(b, [-1.1 - .1 * i, -.05 + fl])].map(Wp), 1.1, dk, { curv: true, over: 0, passes: 1, alpha: form * .8 });
    }
    return { head: Wp(muz), tail: Wp(tail[3]), back: Wp([-.5, -.6]) };
  }

  // ---------- the smoke dog: a kelpie at the double-suspension gallop ----------
  const D_FORE_A = [[0, .6], [.22, -.75], [.4, -.35], [.7, 1.2], [.9, 1.0]];
  const D_FORE_F = [[0, .05], [.22, .25], [.36, 1.9], [.55, 1.1], [.72, .05]];
  const D_HIND_A = [[0, .9], [.25, -.4], [.5, -1.25], [.68, -.2], [.85, .8]];
  const D_HIND_F = [[0, .5], [.25, .4], [.5, .2], [.65, 1.9], [.85, .9]];
  function dog(x, y, u, p, o = {}) {
    const d = o.dir ?? -1, form = o.form ?? 1, col = o.col || '#B9B2A8', dk = mixCol(col, AP.graphite, .45), ink = mixCol(AP.graphite, col, .3);
    const F = (pts, c, q) => { pfill(pts, c, { ...q, ink: null }); if (q.ink) pline(pts, q.sw ?? 1.6, q.ink, { closed: true, curv: q.curv, alpha: form }); };
    const f = Math.cos(TAU * (p - .35)), bob = -.18 * u * Math.cos(TAU * (p - .35) * 2);   // f: +1 gathered, -1 stretched out
    const Wp = q => [x + d * q[0] * u, y + bob + q[1] * u];
    const S = [1.15 * (1 - .06 * f), 0], Hh = [-1.15 * (1 - .12 * f), -.05];
    const leg = (root, ph, fore, far) => {
      const q = frac(p - ph), a = cyc(q, fore ? D_FORE_A : D_HIND_A), fl = cyc(q, fore ? D_FORE_F : D_HIND_F);
      const up = fore ? a : a - .3, lo = fore ? a - fl : a - .3 + fl;
      const k = add2(root, dv(up).map(v => v * (fore ? .85 : 1.0))), a2 = add2(k, dv(lo).map(v => v * (fore ? .8 : .95))), paw = add2(a2, dv(lo + (fore ? 1.1 : .9)).map(v => v * .28));
      const P = [root, k, a2, paw].map(Wp), ws = (fore ? [.42, .22, .16, .2] : [.62, .26, .16, .2]).map(w => w * u);
      limbC(P, ws, far ? dk : col, { tone: .5 * form, dens: .7 * form, sw: .9, ink: far ? null : ink, alpha: form });
    };
    leg([S[0], .35], .06, true, true); leg([Hh[0], .3], .5, false, true);
    leg([Hh[0], .3], .55, false, false); leg([S[0], .35], 0, true, false);
    const tw = Math.sin(TAU * p) * .25, tr = [Hh[0] - .35, -.3];
    F(limb([tr, [tr[0] - .7, tr[1] + .05 + tw * .4], [tr[0] - 1.45, tr[1] + .25 + tw]].map(Wp), [.3, .5, .12].map(w => w * u), 4), col, { tone: .45 * form, dens: .8 * form, sw: .8, ink });
    const arch = .28 * f;
    const body = [[S[0] + .55, .15], [S[0] + .25, .7], [S[0] - .5, .72], [0, .42 - arch * .3], [Hh[0] + .3, .45], [Hh[0] - .35, .15], [Hh[0] - .3, -.4], [0, -.5 - arch], [S[0] - .2, -.55]].map(Wp);
    F(body, col, { tone: .5 * form, dens: .75 * form, curv: true, sw: 1, ink });
    pshade([[S[0] + .2, .4], [S[0] - .5, .7], [0, .42 - arch * .3], [Hh[0] + .3, .42], [0, .1]].map(Wp), dk, .6 * form, { curv: true });
    const hr = -.12 * f, nk = add2(S, [.3, -.3]), sk = add2(nk, rot2([.8, -.45], hr)), nose = add2(sk, rot2([.95, .28], hr));
    limbC([nk, sk].map(Wp), [.85, .6].map(w => w * u), col, { tone: .5 * form, dens: .75 * form, sw: .9, ink, alpha: form });
    F([add2(sk, rot2([-.3, -.3], hr)), add2(sk, rot2([.3, -.25], hr)), add2(nose, [0, -.06]), add2(nose, [-.05, .14]), add2(sk, rot2([.1, .36], hr)), add2(sk, rot2([-.3, .25], hr))].map(Wp), col, { tone: .55 * form, dens: .8 * form, curv: true, sw: .9, ink });
    for (const [ex, lean] of [[-.15, -.1], [.08, 0]]) F([add2(sk, rot2([ex - .12, -.2], hr)), add2(sk, rot2([ex - .2 + lean, -.72], hr)), add2(sk, rot2([ex + .1, -.22], hr))].map(Wp), col, { tone: .6 * form, sw: .8, ink });
    if (form > .5) { const e = Wp(add2(sk, rot2([.22, -.05], hr))); F(ellPts(e[0], e[1], .06 * u, .05 * u, 6), AP.graphite, { tone: .9 * form, ink: null }); }
    return { head: Wp(nose), tail: Wp([tr[0] - 1.45, tr[1] + .25]) };
  }

  // ---------- time, layout ----------
  const bt = n => OFF + n * BEAT;                                        // time of beat n
  const GY = 800, EX = 1250, ES = 46, EBY = GY - 4.2 * ES;              // the engine: ground, x, scale, boiler centre y
  const PLATE = [EX + .25 * ES, EBY + .35 * ES];                         // the maker's plate on the boiler barrel
  const DER = 260, DH = 720, BMX = 503, BSC = 58;                        // derrick, walking beam post
  const BAND = [640, 330], BANDR = 55;                                   // band wheel on its A-frame
  const FLY = [EX - 2 * ES, EBY - 3.2 * ES], FLYR = 2.3 * ES;            // engine flywheel (from set.js engine())
  const STACK = [EX + 5 * ES, EBY - 6.4 * ES];
  const DOOR = [EX - 4.7 * ES, EBY + .8 * ES];
  const BILLX = 790, MS = 34, PILE = [724, GY];
  const SCOTX = 1150;
  const TL = [bt(176), bt(180)];                                         // Bill's logs land in the fire on these beats
  const STRIKES = [bt(165), bt(166), bt(167)];                           // the Scot's three punch blows
  const STAMP = ['20', '20 H.', '20 H.P.'];
  const HAM_UP = { ...POSES.hamUp, shF: POSES.hamUp.shF + TAU, shB: POSES.hamUp.shB + TAU };   // wound up, reached over the top
  const kpe = (t, keys) => {                                             // pose keys with a per-segment ease: [t, pose, ease]
    if (t <= keys[0][0]) return { ...keys[0][1] };
    for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) return kp(t, [[keys[i - 1][0], keys[i - 1][1]], [keys[i][0], keys[i][1]]], keys[i][2] || ease);
    return { ...keys[keys.length - 1][1] };
  };
  const toScr = (c, p) => [W / 2 + (p[0] - c[0]) * c[2], H / 2 + (p[1] - c[1]) * c[2]];
  const camSpeed = (keys, t) => { const a = kf(t, keys), b = kf(t - 1 / 24, keys); return Math.hypot((a[0] - b[0]) * a[2], (a[1] - b[1]) * a[2]) * 24 + Math.abs(a[2] - b[2]) * 24 * 600; };
  // whip-pan speed lines along the move (screen space)
  function speedLines(k, vertical = true, n = 34) {
    if (k <= .02) return;
    seed('C_speed');
    for (let i = 0; i < n; i++) {
      const a = hash(i * 3.3) * (vertical ? W : H), L = 200 + hash(i * 1.7) * 500, b = hash(i * 5.1 + BOILN) * ((vertical ? H : W) + L) - L;
      pline(vertical ? [[a, b], [a + 4, b + L]] : [[b, a], [b + L, a + 3]], .8 + hash(i) * 1.6, AP.graphite, { over: 0, passes: 1, alpha: clamp(k) * (.3 + .5 * hash(i * 9)) });
    }
  }

  // ---------- the colour grade that makes a memory: grey-sepia, like an old engraving ----------
  let GRADE = null;
  function memoryGrade() {
    if (!GRADE) { GRADE = document.createElement('canvas'); GRADE.width = W; GRADE.height = H; }
    const g = GRADE.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
    g.filter = 'grayscale(1) sepia(.42) contrast(1.12) brightness(.98)'; g.drawImage(X.canvas, 0, 0); g.filter = 'none';
    X.save(); X.setTransform(1, 0, 0, 1, 0, 0); X.clearRect(0, 0, W, H); X.drawImage(GRADE, 0, 0); X.restore();
  }
  // hatched vignette round the edge of the page, darker at the corners (the memory's frame)
  function vignette(k = 1, col = '#4A4038') {
    seed('C_vig');
    const cx = W / 2, cy = H / 2 - 40, rx = W * .56, ry = H * .6, E = [];
    for (let i = 0; i <= 40; i++) { const a = Math.PI - i / 40 * TAU; E.push([cx + Math.cos(a) * rx * (1 + .03 * Math.sin(i * 2.3)), cy + Math.sin(a) * ry]); }
    const pts = [[-40, -40], [W + 40, -40], [W + 40, H + 40], [-40, H + 40], [-40, cy], ...E, [-40, cy]];
    pshade(pts, col, .75 * k); pshade(pts.map(p => p), col, .45 * k, { kind: 'x' });
  }
  // the time-shift iris: a ragged pencil ring
  function irisRing(c, r) {
    seed('C_iris');
    const P = []; for (let i = 0; i < 48; i++) { const a = i / 48 * TAU; P.push([c[0] + Math.cos(a) * r * (1 + .025 * Math.sin(i * 5.1 + BOILN)), c[1] + Math.sin(a) * r * (1 + .025 * Math.cos(i * 3.7))]); }
    pline(P, 2.6, AP.graphite, { closed: true });
    pline(P.map(p => [c[0] + (p[0] - c[0]) * 1.03, c[1] + (p[1] - c[1]) * 1.03]), 1, AP.graphiteLt, { closed: true, passes: 1 });
  }
  const clipCircle = (c, r, inside) => { X.beginPath(); if (!inside) X.rect(-20, -20, W + 40, H + 40); X.moveTo(c[0] + r, c[1]); X.arc(c[0], c[1], r, 0, TAU); X.clip('evenodd'); };

  // ---------- props ----------
  const BRASS_DK = mixCol(AP.brass, AP.graphite, .55);
  function plate(stamped, sh = [0, 0], flash = 0) {
    seed('C_plate');
    const px = PLATE[0] + sh[0], py = PLATE[1] + sh[1], w = 1.5 * ES, h = .72 * ES;
    pfill(rrPts(px - w / 2, py - h / 2, w, h, .1 * ES), AP.brass, { tone: .85, dens: .8, sw: 1.1, ink: BRASS_DK });
    plit([[px - w * .44, py - h * .4], [px + w * .44, py - h * .4], [px + w * .4, py - h * .28], [px - w * .44, py - h * .28]], .7);
    pline(rrPts(px - w * .43, py - h * .36, w * .86, h * .72, .05 * ES), .6, BRASS_DK, { closed: true, passes: 1 });
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) pfill(ellPts(px + sx * w * .455, py + sy * h * .37, .045 * ES, .045 * ES, 6), BRASS_DK, { tone: .9, ink: null });
    if (stamped > 0) {
      const fs = .36 * ES, full = STAMP[2];
      X.save(); X.font = `${fs}px "Cabin Sketch", serif`; const fw = X.measureText(full).width; X.restore();
      const x0 = px - fw / 2, txt = STAMP[Math.min(3, stamped) - 1];
      label(txt, x0 + .7, py + 1.9, fs, AP.paperLt, { alpha: .75 });
      label(txt, x0, py + 1.2, fs, '#3A2A18', { alpha: .95 });
    }
    if (flash > 0) pglow(px, py, ES * 1.2, AP.lamp, flash * .8);
  }
  // letter spots on the plate for the punch (centre of each group), in world space
  function stampSpots() {
    const fs = .36 * ES; X.save(); X.font = `${fs}px "Cabin Sketch", serif`;
    const fw = X.measureText(STAMP[2]).width, w0 = X.measureText('20').width, w1 = X.measureText('20 H.').width; X.restore();
    const x0 = PLATE[0] - fw / 2;
    return [[x0 + w0 / 2, PLATE[1]], [x0 + (w0 + w1) / 2 + fs * .12, PLATE[1]], [x0 + (w1 + fw) / 2 + fs * .06, PLATE[1]]];
  }
  function gLog(c, ang, L, w, key) {                                     // a sun-dried gidgee log
    seed('C_log' + key);
    const u = [Math.cos(ang), Math.sin(ang)], n = [-u[1], u[0]], a = add2(c, u.map(v => -v * L / 2)), b = add2(c, u.map(v => v * L / 2));
    const m = add2(lerp2(a, b, .5), n.map(v => v * w * .3 * (hash(key * 3.1) - .5)));
    pfill(limb([a, m, b], [w, w * 1.08, w * .9], 3), '#857260', { tone: .8, dens: 1, sw: 1.1 });
    plit(limb([a, m, b].map(p => add2(p, n.map(v => -v * w * .25))), [w * .3, w * .35, w * .25], 3), .5);
    pline([lerp2(a, m, .3), m, lerp2(m, b, .6)].map(p => add2(p, n.map(v => v * w * .12))), .6, '#5E4A3A', { passes: 1, over: 0 });
    pfill(ellPts(b[0], b[1], w * .2, w * .48, 8, 0, ang), '#7A3A22', { tone: .9, sw: .7 });
  }
  function pile(n) {                                                     // the woodheap: n logs left
    const L = [[0, -8, .05], [34, -8, -.04], [-30, -8, .1], [16, -24, .08], [-14, -24, -.06], [2, -40, .03], [22, -40, -.1]];
    for (let i = 0; i < Math.min(n, L.length); i++) gLog([PILE[0] + L[i][0], PILE[1] + L[i][1]], L[i][2], 56, 15, i + 1);
  }
  // small hammer (the Scot's): a scaled sledge
  const smallHammer = (grip, ang, s) => sledge(grip, ang, s * .42, { len: 2.5, key: 'scot' });

  // ---------- the rig: derrick, band wheel, walking beam, belt ----------
  // lift 1 = well end up (tools raised), 0 = dropped on the blow. The blow is the fast part and lands on the beat.
  const liftAt = (t, per = 1, off = 0) => { const u = frac((bpOf(t) - off) / per); return u < .72 ? ease(u / .72) : 1 - easeIn((u - .72) / .28); };
  function rig(t, lift, o = {}) {
    derrick(DER, GY, DH, { key: 'C' });
    seed('C_band');
    const bw = o.wheel ?? 0;
    for (const lx of [596, 684]) pfill(limb([[lx, GY], BAND], [12, 8]), AP.timberDk, { tone: .7, sw: 1 });
    pline([[606, GY - 150], [674, GY - 150]], 2, AP.timberDk, { over: 3 });
    pline(ellPts(BAND[0], BAND[1], BANDR, BANDR, 24), 2.2, AP.iron, { closed: true });
    for (let i = 0; i < 6; i++) pline([BAND, polar(BAND, bw * TAU + i / 6 * TAU, BANDR * .92)], 1, AP.iron, { over: 0, passes: 1 });
    seed('C_beam');
    const s = BSC, ang = lerp(-.12, .15, lift), pv = [BMX, GY - 3 * s], well = polar(pv, Math.PI + ang, 4.2 * s), crank = polar(pv, ang, 2.6 * s);
    const pin = polar(BAND, bw * TAU + 1.2, BANDR * .65);
    pline([pin, crank], 2.4, AP.timberDk, { over: 0 });
    pfill([[BMX - .5 * s, GY], [BMX - .2 * s, GY - 3 * s], [BMX + .2 * s, GY - 3 * s], [BMX + .5 * s, GY]], AP.timberDk, { tone: .7, sw: 1 });
    pfill(limb([well, pv, crank], [.35 * s, .5 * s, .35 * s]), AP.timber, { tone: .7, dens: .9, sw: 1.2 });
    pfill(ellPts(...pv, .18 * s, .18 * s, 10), AP.iron, { tone: .9, sw: .8 });
    pfill(ellPts(...pin, 5, 5, 8), AP.iron, { tone: .9, sw: .6 });
    // temper screw and rope down to the rods in the hole
    const clamp_ = [DER, lerp(GY - 40, GY - 90, lift)];
    pline([well, clamp_], 2, AP.iron, { over: 0 });
    pfill(rectPts(DER - 9, clamp_[1] - 6, 18, 14), AP.iron, { tone: .9, sw: .8 });
    rods(DER, clamp_[1] + 8, GY + 8, { w: 9 });
    return { well, crank, clamp: clamp_ };
  }
  function belt(t, sh = [0, 0]) {
    seed('C_belt');
    const f = add2(FLY, sh);
    pline([[BAND[0], BAND[1] - BANDR], [f[0], f[1] - FLYR]], 1.8, '#4A3A2A', { over: 0 });
    pline([[BAND[0], BAND[1] + BANDR], [f[0], f[1] + FLYR]], 1.8, '#4A3A2A', { over: 0 });
  }
  function flyBlur(sh, k) {                                              // the flywheel spinning too fast to see
    if (k <= 0) return;
    seed('C_fly');
    const f = add2(FLY, sh);
    ptone(ellPts(f[0], f[1], FLYR * .95, FLYR * .95, 26), AP.iron, .18 * k);
    for (let i = 0; i < 5; i++) {
      const a0 = T * 40 + i * 1.3, r = FLYR * (.35 + i * .14), P = [];
      for (let j = 0; j <= 10; j++) P.push(polar(f, a0 + j * .16, r));
      pline(P, 1.2, AP.graphite, { over: 0, passes: 1, alpha: .6 * k, curv: true });
    }
    for (let i = 0; i < 3; i++) { const a = -2.2 + i * .35 + Math.sin(T * 30 + i) * .05; pline([polar(f, a, FLYR * 1.08), polar(f, a + .5, FLYR * 1.1)], 1, AP.graphite, { over: 0, passes: 1, alpha: .5 * k }); }
  }
  const engShake = amt => amt ? shakeXY(T, amt * ES * .12) : [0, 0];
  function stackSmoke(t, amt, sh = [0, 0], extra = []) {                // a chuff each beat, drifting left and up
    seed('C_smoke');
    const b = bpOf(t), st = add2(STACK, sh);
    for (let i = 0; i < 9; i++) {
      const n = Math.floor(b) - i, age = (b - n) * BEAT, k = age / (9 * BEAT), big = extra.some(e => Math.abs(bt(n) - e) < BEAT * .6) ? 1.8 : 1;
      const p = [st[0] - age * 110 - age * age * 12 + Math.sin(n * 1.7) * 10, st[1] - 20 - age * 95 + age * age * 6];
      psmoke(p[0], p[1], (14 + age * 38) * big, mixCol(AP.smoke, AP.graphite, .15 * (1 - k)), .6 * amt * (1 - k));
    }
  }
  function fireAt(t, extra = 0) {                                        // flare after each log lands
    let f = 0; for (const e of TL) if (t >= e) f = Math.max(f, Math.exp(-(t - e) * 2.2));
    return f + extra;
  }
  function flames(t, k) {                                                // tongues of fire out of the firebox door
    if (k <= .05) return;
    seed('C_flame');
    const d = DOOR;
    pglow(d[0], d[1], ES * (2 + k * 4), AP.fire, .6 * k);
    for (let i = 0; i < 5; i++) {
      const x = d[0] + (i - 2) * .22 * ES, hgt = ES * (.4 + k * 1.3) * (.6 + .5 * hash(i + BOILN * .37)), sw = Math.sin(T * 9 + i) * .15 * ES;
      pfill([[x - .15 * ES, d[1] - .3 * ES], [x + sw * .5, d[1] - .3 * ES - hgt * .6], [x + sw, d[1] - .3 * ES - hgt], [x + .15 * ES, d[1] - .3 * ES]], i % 2 ? AP.lamp : AP.fire, { tone: .6, dens: .6, ink: null, curv: true });
    }
  }
  function sparks(t, t0, from, n = 14, spread = 1) {                     // sparks thrown out by an impact or a log
    const a = t - t0; if (a < 0 || a > .9) return;
    seed('C_sp' + t0);
    for (let i = 0; i < n; i++) {
      const ang = -Math.PI / 2 + (hash(i * 3 + t0) - .5) * 2.4 * spread, v = 160 + hash(i * 7 + t0) * 260, p = [from[0] + Math.cos(ang) * v * a, from[1] + Math.sin(ang) * v * a + 300 * a * a];
      const q = [p[0] - Math.cos(ang) * 12, p[1] - Math.sin(ang) * 12 - 600 * a * .02];
      pline([q, p], 1.2, i % 3 ? AP.lamp : AP.ember, { over: 0, passes: 1, alpha: 1 - a / .9 });
    }
  }

  // ---------- the outback: sky, sun, land ----------
  const TOD = {
    gold: { top: '#E9A15A', bot: '#EAC07E', sun: [150, 190], sunR: 55, sunCol: AP.lamp, land: mixCol(AP.dust, AP.ochre, .25), light: [.85, .35] },
    sunset: { top: '#8E4A52', bot: '#E48A48', sun: [470, 640], sunR: 120, sunCol: '#F2A05A', land: '#8A6040', light: [.55, .6] },
  };
  function outbackSky(tod) {
    const D = TOD[tod];
    sky(D.top, D.bot, { still: true, split: .7 });
  }
  function outbackLand(t, tod) {
    const D = TOD[tod];
    seed('C_sun');
    pglow(D.sun[0], D.sun[1], D.sunR * 4.5, D.sunCol, tod === 'sunset' ? .9 : .7);
    pfill(ellPts(D.sun[0], D.sun[1], D.sunR, D.sunR, 30), tod === 'sunset' ? '#F4B870' : AP.bone, { tone: .85, dens: .5, ink: AP.ochre, sw: 1.1 });
    seed('C_land');
    const pts = []; for (let k = 0; k <= 24; k++) pts.push([lerp(-1500, 3400, k / 24), 700 + 5 * Math.sin(k * 1.7) + 4 * hash(k)]);
    pfill(pts.concat([[3400, 1600], [-1500, 1600]]), D.land, { tone: .62, dens: .85, ink: null, still: true });
    pshade(pts.map(p => [p[0], p[1] + 130]).concat([[3400, 1600], [-1500, 1600]]), mixCol(D.land, AP.earthDk, .5), .5, { still: true, kind: 'x' });
    pline(pts, 1.1, AP.graphiteLt, { over: 0, passes: 1 });
    for (let i = 0; i < 24; i++) { const x = -1400 + i * 200 + hash(i) * 120, h = 8 + hash(i + 3) * 16; pfill(ellPts(x, 702 - h * .4, 18 + hash(i) * 26, h, 8), mixCol(AP.leaf, D.land, .55), { tone: .4, dens: .5, ink: null, still: true }); }
    tree(-260, 712, 26, { dead: true, key: 'C1' }); tree(1780, 706, 20, { dead: true, key: 'C2' });
    seed('C_tracks');
    for (let i = 0; i < 14; i++) { const x = 300 + i * 90 + hash(i) * 40, y = 830 + hash(i * 3) * 60; pline([[x, y], [x + 30 + hash(i) * 20, y + 2]], .8, mixCol(D.land, AP.earthDk, .6), { over: 0, passes: 1 }); }
  }

  // ---------- the people ----------
  // Bill firing: pick a log off the heap, wind back, underhand it into the firebox (landing on the beat), follow through,
  // reel back from the flare grinning.
  const B_STAND = { shF: .15, elF: .35, shB: -.1, elB: .4, face: 'neutral' };
  const B_PICK = { lean: .9, head: .15, shF: -.45, elF: .1, shB: -.3, elB: .1, hpF: .7, knF: 1.05, hpB: -.1, knB: .8, face: 'grit' };
  const B_WIND = { lean: .12, head: -.1, shF: -1.3, elF: .35, shB: -1.1, elB: .45, hpF: .35, knF: .6, hpB: -.35, knB: .3, face: 'grit' };
  const B_TOSS = { lean: .42, head: .05, shF: 1.0, elF: -.05, shB: .85, elB: 0, hpF: .6, knF: .35, hpB: -.55, knB: .1, face: 'shout', mouth: .25 };
  const B_FOLLOW = { lean: .55, head: .1, shF: 1.65, elF: -.2, shB: 1.45, elB: -.1, hpF: .65, knF: .4, hpB: -.65, knB: .4, face: 'shout', mouth: .5 };
  const B_HEAT = { lean: -.2, head: -.2, shF: .95, elF: 1.55, shB: .15, elB: .6, hpF: .2, knF: .1, hpB: -.28, knB: .15, face: 'smile', mouth: .15 };
  const billKeys = [];
  for (const L of TL) billKeys.push([L - 1.55, B_STAND], [L - 1.2, B_PICK], [L - 1.0, B_PICK], [L - .62, B_WIND, easeOut], [L - .42, { ...B_WIND, shF: -1.45, shB: -1.25, lean: .05 }], [L - .2, B_TOSS, easeIn], [L + .1, B_FOLLOW, easeOut], [L + .5, B_HEAT], [L + .95, B_HEAT], [L + 1.2, B_STAND]);
  billKeys.sort((a, b) => a[0] - b[0]);
  const REL = [BILLX + 95, GY - 140];                                     // where the log leaves his hands
  function bill(t, o = {}) {
    let P = o.pose || kpe(t, billKeys);
    const blink = Math.max(0, 1 - Math.abs(t - (TL[0] + .42)) * 12, 1 - Math.abs(t - 95.9) * 12);
    P = { ...P, blink };
    const picks = TL.filter(L => t > L - 1.05).length;                    // logs taken from the heap so far
    if (o.pile !== false) pile(5 - picks);
    const holding = TL.find(L => t > L - 1.05 && t < L - .2);
    seed('C_bill');
    const J = man(o.x ?? BILLX, GY, o.s ?? MS, P, CAST.bill, { hold: J => { if (holding) gLog(lerp2(J.handF, J.handB, .5), -.15 + (J.angF - Math.PI / 2) * .3, 62, 17, 9); } });
    for (const L of TL) if (t > L - .2 && t < L) {                         // the log in flight into the firebox
      const k = seg(t, L - .2, L), p = arcPt(REL, add2(DOOR, [0, 4]), 26, easeIn(k * .8 + .2 * k));
      gLog(p, -.15 + k * 2.2, 62 * (1 - k * .3), 17 * (1 - k * .25), 9);
    }
    return J;
  }
  // the canny Scot: taps the boiler (listening), admires it, raises the punch
  const S_TAPU = { lean: .12, head: .35, shF: 1.05, elF: 1.25, shB: .25, elB: .6, face: 'neutral', look: .6 };
  const S_TAPD = { lean: .15, head: .38, shF: 1.35, elF: .55, shB: .25, elB: .6, face: 'neutral', look: .6 };
  const S_ADMIRE = { lean: -.14, head: -.12, shF: .25, elF: .45, shB: -.35, elB: 1.9, face: 'smile', look: .4 };
  const S_READY = { lean: .1, head: .15, shF: 1.9, elF: .9, shB: 1.25, elB: .5, face: 'grit', look: .6 };
  const TAPS = [bt(156), bt(157), bt(158), bt(159)];
  function scotSide(t) {
    let P;
    if (t < TAPS[3] + .25) {
      let last = -9, next = 9; for (const e of TAPS) { if (e <= t) last = e; else { next = Math.min(next, e); } }
      const up = next - .3, a = t - last;
      P = a < .07 ? S_TAPD : t < up ? kp(t, [[last + .07, S_TAPD], [up, S_TAPU]], easeOut) : kp(t, [[up, S_TAPU], [next, S_TAPD]], easeIn);
    } else if (t < 86.95) {
      P = kp(t, [[TAPS[3] + .25, S_TAPD], [TAPS[3] + .75, S_ADMIRE]], ease);
      P = { ...P, head: P.head + .09 * pulse(t, 5) * (t > 85.9 ? 1 : 0) };   // pleased little nods on the beat
    } else P = kp(t, [[86.95, S_ADMIRE], [87.55, S_READY]], ease);
    const blink = Math.max(0, 1 - Math.abs(t - (TAPS[3] + .5)) * 10, 1 - Math.abs(t - 87.1) * 12);
    seed('C_scot');
    return man(SCOTX, GY, MS, { ...P, blink }, CAST.scot, { hold: J => {
      const h = smallHammer(J.handF, J.angF - 1.35 * J.dir, J.s);
      if (t < TAPS[3] + .2) for (const e of TAPS) if (t >= e && t < e + .16) {           // a ring off the boiler plate
        const k = (t - e) / .16; seed('C_tink' + e);
        for (let i = 0; i < 5; i++) { const a = -2.2 + i * .45; pline([polar(h.strike, a, 6 + k * 10), polar(h.strike, a, 12 + k * 16)], .9, AP.graphite, { over: 0, passes: 1, alpha: 1 - k }); }
      }
      if (t > 86.95) {                                                     // the letter punch in the other hand
        const g = J.handB; pfill(limb([add2(g, [-3, 10]), add2(g, [6, -18])], [4, 3.2]), AP.ironLt, { tone: .85, sw: .7 });
      }
    } });
  }
  function scotFront(t) {
    const nose = { view: 'front', shF: -1.0, elF: -2.41, shB: .3, elB: .2, face: 'smile' };
    const P = kpe(t, [[89.9, { view: 'front', shF: .3, elF: .4, shB: .35, elB: .5, face: 'smile', head: 0 }], [90.2, { view: 'front', shF: .3, elF: .4, shB: .35, elB: .5, face: 'smile' }],
      [90.55, nose, backOut], [91.9, nose], [92.2, { ...nose, shF: .3, elF: .4 }]]);
    const lean = spring(t, 90.55, 7, 16) * .04;
    seed('C_scotF');
    const J = man(SCOTX - 20, GY, MS, { ...P, head: lean }, CAST.scot, { hold: J => smallHammer(J.handB, Math.PI * .5 - .12, J.s) });
    const wk = seg(t, 90.72, 90.84) * (1 - seg(t, 91.45, 91.6));
    wink(J, -1, wk);
    return J;
  }
  function wink(J, side, k) {                                             // front view: close one eye
    if (k <= 0) return;
    const s = J.s, c = J.head, e = [c[0] + side * .2 * s, c[1] - .08 * s], sw = Math.max(.7, s / 55);
    seed('C_wink');
    pfill(ellPts(e[0], e[1] - .01 * s, .12 * s, .1 * s, 10), CAST.scot.skin, { tone: .97, dens: .6, ink: null });
    pline([[e[0] - .1 * s, e[1] - .01 * s], [e[0], e[1] + .04 * s], [e[0] + .1 * s, e[1] - .01 * s]], sw * 1.2, AP.graphite, { curv: true, over: 0 });
    pline([[e[0] - .12 * s, e[1] - .16 * s], [e[0] + .12 * s, e[1] - .11 * s]], sw * 1.3, CAST.scot.beardCol, { over: 0 });
    pline([[e[0] - .06 * s, e[1] + .12 * s], [e[0] + .08 * s, e[1] + .1 * s]], sw * .8, CAST.scot.skinDk, { over: 0 });
  }

  // ---------- Glasgow ----------
  function glasgowSet(t) {
    seed('C_gsky');
    ptone(rectPts(-400, -400, 2800, 800), '#7E7C7A', .55); pshade(rectPts(-400, -400, 2800, 800), '#5A5856', .8, { still: true });
    // chimneys and a Clyde crane beyond the wall
    for (const [x, w, h] of [[720, 44, 330], [1640, 38, 290], [470, 30, 250]]) {
      seed('C_chim' + x);
      pfill([[x - w / 2, 380], [x - w * .4, 380 - h], [x + w * .4, 380 - h], [x + w / 2, 380]], '#6E5E54', { tone: .7, dens: 1, sw: 1 });
      for (let i = 0; i < 4; i++) psmoke(x - i * 40 - frac(t * .3 + i * .25) * 60, 380 - h - 20 - i * 30, 28 + i * 16, '#5E5C5A', .5 - i * .1);
    }
    seed('C_crane');
    pline([[1830, 380], [1830, 150]], 3, '#4A4644', { over: 0 }); pline([[1880, 380], [1880, 150]], 3, '#4A4644', { over: 0 });
    pfill(rectPts(1700, 128, 360, 22), '#4A4644', { tone: .8, sw: 1 });
    for (let i = 0; i < 9; i++) pline([[1700 + i * 40, 128], [1720 + i * 40, 150]], .8, '#4A4644', { over: 0, passes: 1 });
    pline([[1990, 150], [1990, 260]], .9, '#4A4644', { over: 0, passes: 1 });
    // the foundry wall, brick, with tall arched windows lit by the furnace
    seed('C_wall');
    const wall = [[-400, 360], [2400, 360], [2400, 820], [-400, 820]];
    pfill(wall, '#8A6A58', { tone: .7, dens: .9, ink: null, still: true });
    for (let i = 0; i < 21; i++) pline([[-400, 372 + i * 21], [2400, 374 + i * 21]], .7, '#5A4438', { over: 0, passes: 1, j: .4 });
    for (let i = 0; i < 160; i++) { const r = Math.floor(hash(i * 3.7) * 21), x = -300 + hash(i * 1.3) * 2600, y = 372 + r * 21; pline([[x, y], [x, y + 21]], .6, '#5A4438', { over: 0, passes: 1 }); }
    pline([[-400, 360], [2400, 360]], 2, AP.graphite, { over: 0 });
    for (const wx of [400, 660, 1640]) {
      seed('C_win' + wx);
      const w = 150, top = 430, bot = 700, arch = [];
      for (let i = 0; i <= 12; i++) { const a = Math.PI + i / 12 * Math.PI; arch.push([wx + Math.cos(a) * w / 2, top + Math.sin(a) * w / 2]); }
      const pts = [[wx - w / 2, bot], ...arch, [wx + w / 2, bot]];
      pglow(wx, (top + bot) / 2, 220, '#F0B060', .55);
      pfill(pts, '#C8A070', { tone: .6, dens: .6, sw: 1.4 });
      for (let i = 1; i < 4; i++) pline([[wx - w / 2 + i * w / 4, top - w / 2 * Math.sin(Math.acos(Math.abs(i / 2 - 1)))], [wx - w / 2 + i * w / 4, bot]], 1.1, AP.graphite, { over: 0, passes: 1 });
      for (let j = 1; j < 5; j++) pline([[wx - w / 2, top + j * (bot - top) / 5], [wx + w / 2, top + j * (bot - top) / 5]], 1, AP.graphite, { over: 0, passes: 1 });
      pshade(pts, '#6A5A4A', .35, { kind: 'v' });
      pfill(rectPts(wx - w / 2 - 12, bot, w + 24, 14), '#9A8A7A', { tone: .8, sw: 1 });
    }
    // gantry over the new engine, chain and hook still swinging from lowering her on
    seed('C_gantry');
    for (const gx of [800, 1780]) pfill(rectPts(gx - 10, 230, 20, 570), '#4E4A46', { tone: .8, dens: .9, sw: 1 });
    pfill(rectPts(780, 214, 1020, 24), '#4E4A46', { tone: .85, sw: 1.1 });
    for (let i = 0; i < 24; i++) pline([[790 + i * 42, 238], [810 + i * 42, 214]], .7, AP.graphite, { over: 0, passes: 1 });
    const sw = Math.sin(t * 2.1) * 6, hook = [1330 + sw, 395];
    pline([[1330, 238], hook], 1.6, '#3A3634', { over: 0 });
    for (let i = 0; i < 12; i++) { const p = lerp2([1330, 240], hook, i / 12); pline(ellPts(p[0], p[1] + 6, 3, 6, 8), .6, '#3A3634', { closed: true, passes: 1 }); }
    pline([hook, add2(hook, [0, 16]), add2(hook, [10, 22]), add2(hook, [14, 12])], 2, '#3A3634', { curv: true, over: 0 });
    // wet cobbles
    seed('C_cobble');
    pfill([[-400, 790], [2400, 790], [2400, 1400], [-400, 1400]], '#6E6660', { tone: .7, dens: .9, ink: null, still: true });
    for (let i = 0; i < 90; i++) { const r = Math.floor(i / 15), x = 520 + (i % 15) * 88 + (r % 2) * 44 + hash(i) * 10, y = 806 + r * 22; pline(ellPts(x, y, 34 + r * 3, 7 + r * 1.5, 10), .6, '#3E3834', { closed: true, passes: 1 }); }
    for (const wx of [400, 660, 1640]) for (let i = 0; i < 6; i++) pline([[wx - 50 + i * 20, 812 + hash(i + wx) * 10], [wx - 52 + i * 20, 860 + hash(i * 2 + wx) * 40]], 1.4, '#D8B888', { over: 0, passes: 1, alpha: .5 });
    // a second boiler shell on trestles, and wheels leaning at the wall
    seed('C_shell');
    pfill(rrPts(560, 640, 260, 100, 45), '#5A5652', { tone: .75, dens: .9, sw: 1.2 });
    for (let i = 1; i < 5; i++) pline([[560 + i * 52, 642], [560 + i * 52, 738]], .8, AP.graphite, { over: 0, passes: 1 });
    for (const x of [590, 790]) pfill([[x - 20, GY], [x, 735], [x + 20, GY]], AP.timberDk, { tone: .7, sw: 1 });
    for (const x of [1860, 1930]) { seed('C_wh' + x); pline(ellPts(x, 740, 58, 58, 22), 2, '#4A4644', { closed: true }); for (let i = 0; i < 8; i++) pline([[x, 740], polar([x, 740], i / 8 * TAU, 54)], .8, '#4A4644', { over: 0, passes: 1 }); }
  }
  function rain(t, n = 160, a = .75) {
    seed('C_rain');
    for (let i = 0; i < n; i++) {
      const sp = .9 + hash(i * 3) * .5, y = frac(hash(i * 7) + t * sp) * (H + 200) - 100, x = hash(i) * (W + 300) - 50 - (y + 100) * .2, L = 40 + hash(i) * 36, pale = i % 3 !== 0;
      pline([[x, y], [x - 9, y + L]], pale ? 1.1 + hash(i * 11) * .6 : .7, pale ? '#EEEAE2' : '#3E3E3E', { over: 0, passes: 1, alpha: a * (.4 + hash(i * 5) * .6) });
    }
  }
  function splashes(t) {
    seed('C_splash');
    for (let i = 0; i < 26; i++) {
      const per = .45 + hash(i) * .3, n = Math.floor(t / per + hash(i * 3)), age = frac(t / per + hash(i * 3)), x = 500 + hash(i * 13 + n * 7) * 1400, y = 805 + hash(i * 17 + n * 3) * 90;
      pline(ellPts(x, y, 4 + age * 16, 1.5 + age * 4, 10), .7, '#D8D0C8', { closed: true, passes: 1, alpha: 1 - age });
    }
  }
  // the whole Glasgow frame at time t through camera c (the Scot's figure is given by who)
  function glasgowFrame(t, c, who, stamped, flash = 0) {
    seed('C_gwash');
    ptone(rectPts(-40, -40, W + 80, H + 80), '#8A8680', .55);
    camOn(c[0], c[1], c[2]);
    glasgowSet(t);
    engine(EX, GY, ES, { ph: 0, fire: 0, gauge: 0, smoke: 0, col: '#5E6A62' });
    plate(stamped, [0, 0], flash);
    seed('C_rivet');
    for (let i = 0; i < 4; i++) for (let j = 0; j < 6; j++) { const x = EX - 2.6 * ES + i * 1.9 * ES, y = EBY - 1.3 * ES + j * .5 * ES; pfill(ellPts(x, y, 1.6, 1.6, 5), AP.graphite, { tone: .7, ink: null }); }
    splashes(t);
    if (who) who(t);
    camOff();
    rain(t, 190, .85);
    memoryGrade();
    vignette(1);
  }

  // ---------- the outback frame ----------
  function outbackFrame(t, c, tod, parts) {
    LIGHT = TOD[tod].light.slice();
    outbackSky(tod);
    camOn(c[0], c[1], c[2]);
    outbackLand(t, tod);
    const sh = engShake(parts.shake ?? .15), lift = parts.lift ?? liftAt(t, 1);
    rig(t, lift, { wheel: parts.wheel ?? frac(bpOf(t)) });
    if (parts.dust) parts.dust(lift);
    const fire = parts.fire ?? .5;
    const E = engine(EX, GY, ES, { ph: parts.ph ?? t * 1.4, fire, gauge: parts.gauge ?? .45, shake: parts.shake ?? .15, smoke: 0 });
    flames(t, parts.flames ?? 0);
    plate(3, sh);
    belt(t, sh);
    flyBlur(sh, parts.blur ?? 0);
    if (parts.back) parts.back(t);
    stackSmoke(t, parts.smoke ?? .8, sh, parts.bigPuffs || []);
    if (parts.front) parts.front(t);
    camOff();
    return E;
  }

  // ================= SHOT 1 · 81.24–92.04 · the plate, and Glasgow, back then =================
  const CAM_G = [[81.24, [PLATE[0], PLATE[1], 5.2]], [82.9, [PLATE[0] - 4, PLATE[1] - 2, 5.6]], [85.0, [1175, 545, 1.55]], [86.9, [1185, 555, 1.62]], [87.68, [1215, 600, 2.4]]];
  const CAM_I = [[87.68, [PLATE[0] - 20, PLATE[1] - 12, 7.6]], [89.9, [PLATE[0] - 14, PLATE[1] - 8, 8.0]]];
  const CAM_F = [[89.9, [1190, 588, 3.1]], [91.2, [1196, 590, 3.25]], [92.04, [PLATE[0], PLATE[1], 5.2]]];
  const IRIS_IN = [82.45, 83.45], IRIS_OUT = [91.5, 92.04];
  function stampInsert(t) {                                               // the insert: punch and hammer on the plate
    const spots = stampSpots(), ci = STRIKES.findIndex(e => t < e + .08), cur = ci < 0 ? 2 : ci;
    const slide = i => i <= 0 ? spots[0] : lerp2(spots[i - 1], spots[i], ease(seg(t, STRIKES[i - 1] + .1, STRIKES[i - 1] + .3)));
    const away = ease(seg(t, STRIKES[2] + .35, STRIKES[2] + .8));
    const tip = add2(slide(cur), [-away * 60, 2 + away * 50]);
    const last = [87.0, ...STRIKES].filter(e => e <= t).pop(), next = STRIKES.find(e => e > t);
    let raise;                                                             // hammer 0 = on the punch, 1 = wound up
    if (!next) raise = easeOut(seg(t, last + .06, last + .5)) * .35;
    else if (t >= next - .3) raise = 1 - easeIn(seg(t, next - .3, next));
    else raise = t < STRIKES[0] ? easeOut(seg(t, 87.68, STRIKES[0] - .3)) : easeOut(seg(t, last + .06, next - .3));
    const skin = CAST.scot.skin, skDk = CAST.scot.skinDk, shirt = CAST.scot.shirt, lw = .32;
    seed('C_punch');
    const top = add2(tip, [-4, -24]), fist = add2(lerp2(tip, top, .62), [-1, 0]), el = add2(fist, [-34, 24]);
    pfill(limb([add2(el, [-4, 3]), fist], [8, 6.5]), skin, { tone: .62, sw: lw });
    pfill(limb([add2(el, [-30, 18]), add2(el, [2, -1])], [10.5, 9.5]), shirt, { tone: .68, sw: lw });
    pfill(limb([tip, top], [2.6, 3.4]), AP.ironLt, { tone: .85, sw: lw });
    pfill(rectPts(top[0] - 2.4, top[1] - 2.5, 4.8, 3), AP.iron, { tone: .9, sw: lw });
    pfill(ellPts(fist[0], fist[1], 5.4, 4.6, 12, 0, -.5), skin, { tone: .72, sw: lw });
    for (let i = 0; i < 3; i++) pline([add2(fist, [1 + i * 1.6, -3.6]), add2(fist, [2 + i * 1.6, -1.2])], .18, skDk, { over: 0, passes: 1 });
    seed('C_hamarm');
    const hc0 = add2(top, [0, -6.5]), wr0 = add2(hc0, [-24, 0]), wr = add2(wr0, [-2 * raise, -9 * raise]), ang = -1.15 * raise;
    const u = [Math.cos(ang), Math.sin(ang)], n = [-u[1], u[0]], hd = add2(wr, u.map(v => v * 24));
    pfill(limb([add2(wr, [-30, -15]), wr], [8.5, 6.5]), skin, { tone: .62, sw: lw });
    pfill(limb([add2(wr, [-56, -27]), add2(wr, [-27, -13])], [11, 9.5]), shirt, { tone: .68, sw: lw });
    pfill(limb([add2(wr, u.map(v => -3)), hd], [2.2, 2.6]), AP.pine, { tone: .75, sw: lw });
    const q = (a, b) => add2(hd, add2(n.map(v => v * a), u.map(v => v * b)));
    pfill([q(-6, -2.6), q(6, -2.6), q(6, 2.6), q(-6, 2.6)], AP.iron, { tone: .9, sw: lw });
    plit([q(-5, -2), q(5, -2), q(5, -.8), q(-5, -.8)], .6);
    pfill(ellPts(wr[0], wr[1], 5.2, 4.8, 12, 0, .4), skin, { tone: .72, sw: lw });
    for (const e of STRIKES) if (t >= e && t < e + .3) {
      const k = (t - e) / .3; seed('C_ting' + e);
      for (let i = 0; i < 8; i++) { const a = -Math.PI * .95 + i / 7 * Math.PI * .9; pline([polar(top, a, 4 + k * 5), polar(top, a, 7 + k * 9)], .2, AP.graphite, { over: 0, passes: 1, alpha: 1 - k }); }
      psmoke(tip[0], tip[1], 4 + k * 6, AP.paperLt, .6 * (1 - k));
    }
  }
  function glasgowShot(t, lt, dur) {
    // which camera and which Scot
    let c, who, stamped = 0, flash = 0;
    if (t < 87.68) { c = kf(t, CAM_G); who = scotSide; }
    else if (t < 89.9) {
      c = kf(t, CAM_I); stamped = STRIKES.filter(e => t >= e).length;
      flash = Math.max(0, ...STRIKES.map(e => t >= e ? Math.exp(-(t - e) * 12) : 0));
      const sh = shakeXY(t, flash * 1.2); c = [c[0] + sh[0], c[1] + sh[1], c[2]];
      who = tt => stampInsert(tt);
    } else { c = kf(t, CAM_F, easeIn); stamped = 3; who = scotFront; }
    if (t >= 89.9) c = kf(t, CAM_F, t < 91.2 ? ease : easeIn);
    const outback = oc => outbackFrame(t, oc, 'gold', { shake: .15, fire: .55, ph: t * 1.4, smoke: .6 });
    const ps = toScr(c, PLATE);
    if (t < IRIS_IN[0]) outback(c);
    else if (t < IRIS_IN[1] || t > IRIS_OUT[0]) {
      // time shift through the plate: Glasgow graded underneath, the outback clipped round it
      const going = t < IRIS_IN[1], k = going ? easeIn(seg(t, ...IRIS_IN)) : easeIn(seg(t, ...IRIS_OUT)), r = 10 + k * 1500;
      glasgowFrame(t, c, who, stamped, flash);
      X.save(); X.setTransform(1, 0, 0, 1, 0, 0); clipCircle(ps, r, !going); X.drawImage(paperG.elt, 0, 0); outback(c); X.restore();
      irisRing(ps, r);
    } else glasgowFrame(t, c, who, stamped, flash);
    if (lt < .35) scribbleWipe(.5 + lt / .7);
  }

  // ================= SHOT 2 · 92.04–101.6 · Bill fires her; thirty horses and a score of dogs =================
  const CAM_B = [[92.04, [PLATE[0], PLATE[1], 5.2]], [93.1, [900, 640, 1.9]], [96.95, [890, 628, 2.0]], [97.62, [860, 240, 1.0]], [101.6, [720, 230, 1.0]]];
  // herd: [birth, altitude, unit, speed, stride phase, kind]
  const HERD = [
    [97.72, 130, 44, 420, 0, 'h'], [98.02, 30, 34, 450, .37, 'h'], [98.32, 205, 52, 400, .71, 'h'], [98.66, -40, 28, 470, .2, 'h'], [98.98, 110, 40, 440, .55, 'h'],
    [98.2, -90, 15, 380, .3, 'h'], [98.5, -130, 13, 400, .8, 'h'], [98.85, -70, 12, 390, .1, 'h'], [99.2, -10, 16, 410, .6, 'h'],
    [99.3, 300, 28, 520, .1, 'd'], [99.48, 268, 24, 540, .6, 'd'], [99.66, 330, 30, 505, .3, 'd'], [99.84, 282, 25, 530, .85, 'd'], [100.02, 318, 28, 515, .45, 'd'], [100.2, 262, 24, 545, .7, 'd']];
  function herd(t) {
    const origin = [STACK[0] - 20, STACK[1] - 30];
    HERD.forEach(([b, alt, u, v, ph, kind], i) => {
      const a = t - b; if (a < 0) return;
      const x = origin[0] - v * (a - .3 * (1 - Math.exp(-a * 3.3))) - (kind === 'd' ? 40 : 60), y = lerp(origin[1], alt, easeOut(clamp(a / 1.1))) + Math.sin(a * 3 + i) * 6;
      if (x < -500) return;
      const form = ease(seg(a, .12, .7)) * (1 - ease(seg(t, 100.95, 101.35))), far = u < 17 && kind === 'h';
      const col = far ? '#C9C0B4' : '#B4ACA2';
      seed('C_herdpuff' + i);                                               // the smoke it condenses out of, and trails
      for (let j = 0; j < 5; j++) { const q = frac(a * 1.6 + j / 5); psmoke(x + (kind === 'd' ? 2.2 : 3.2) * u + q * u * 4 * (j % 2 ? 1 : .6), y - u * .3 + (hash(j + i) - .5) * u * 1.5, u * (.7 + q * 1.3) * (1.4 - form * .6), AP.smoke, .35 * (1 - q) * (1 - form * .4)); }
      if (form < .05) return;
      seed('C_herd' + i);
      if (kind === 'h') horse(x, y, u, frac(a / BEAT + ph), { dir: -1, form: form * (far ? .75 : 1), col });
      else dog(x, y, u, frac(a / .3 + ph), { dir: -1, form, col });
    });
  }
  function smokeWave(t) {                                                 // the lead horse brings a wall of smoke across the frame
    const k = seg(t, 100.95, 102.25); if (k <= 0 || k >= 1) return;
    const xf = W + 240 - k * 1.2 * (W * 2 + 900);
    seed('C_wave');
    ptone([[xf + 220, -60], [xf + W + 1320, -60], [xf + W + 1340, H / 2], [xf + W + 1320, H + 60], [xf + 200, H + 60], [xf + 140, H / 2]], '#B7AFA4', .97);
    for (let i = 0; i < 26; i++) { const y = -60 + i / 25 * (H + 120), r = 150 + hash(i) * 110; psmoke(xf + 160 + hash(i * 3) * 120, y, r, '#B7AFA4', .9); psmoke(xf + W + 1300 + hash(i * 5) * 150, y, r, '#B7AFA4', .9); }
    const hk = seg(t, 100.95, 101.62);
    if (hk < 1) { seed('C_lead'); horse(xf + 120, 470 + Math.sin(t * 9) * 10, 88, frac((t - 100.95) / BEAT), { dir: -1, form: 1 - ease(seg(hk, .7, 1)), col: '#A8A096' }); }
  }
  function fireShot(t, lt, dur) {
    const c = kf(t, CAM_B), fl = fireAt(t);
    const whip = clamp(camSpeed(CAM_B, t) / 2600);
    const beat = pulse(t, 5), full = seg(t, 96.8, 97.8);
    outbackFrame(t, c, 'gold', {
      shake: .15 + .3 * full, fire: .5 + fl * .9, flames: fl, ph: t * lerp(1.4, 5, full), gauge: .4 + .15 * TL.filter(L => t > L).length + .1 * full, smoke: .7 + .3 * full,
      bigPuffs: TL.map(L => L + .4), blur: full,
      back: tt => { const J = bill(tt); for (const L of TL) sparks(tt, L, add2(DOOR, [0, -8]), 12, .8);
        if (fl > .05) { seed('C_facelit'); pglow(J.head[0] + MS * .4, J.head[1], MS * 3, AP.fire, .7 * fl); } },
      front: tt => { if (tt > 97.3) herd(tt); },
    });
    speedLines(whip, true);
    smokeWave(t);
  }

  // ================= SHOT 3 · 101.6–105.01 · full chuff, beam pounding, the crew cheers =================
  const CAM_W = [[101.6, [470, 500, 1.3]], [102.2, [500, 505, 1.3]], [103.15, [960, 530, 1.18]], [105.01, [990, 540, 1.24]]];
  const GF = 930, CS = 54;                                                 // the crew stand nearer the camera
  function crewCheer(t) {
    const cheer = (t0, x, look = 0) => {
      const k = t - t0, base = { view: 'front', shF: .15, elF: .3, shB: .15, elB: .3, face: 'neutral', look };
      const up = { ...POSES.cheer, mouth: .5 + .3 * pulse(t, 4) };
      let P = k < -.3 ? base : k < 0 ? kp(k, [[-.3, base], [0, { ...base, shF: -.1, elF: .8, shB: -.1, elB: .8, face: 'grit', dy: -.25 }]], easeOut) : kp(k, [[0, { ...base, face: 'grit' }], [.22, up]], backOut);
      if (k > .3) P = { ...P, shF: P.shF - .35 * pulse(t, 4), shB: P.shB - .3 * pulse(t - .06, 4), dy: .15 * pulse(t, 5) };
      return P;
    };
    seed('C_boss');
    man(640, GF, CS, { ...cheer(bt(193) - .02, 640), blink: seg(t, 102.3, 102.36) * (1 - seg(t, 102.4, 102.46)) }, CAST.boss);
    seed('C_hand1');
    man(1250, GF, CS * .97, cheer(bt(193) + .1, 1250), CAST.hand1);
    // hand2 punches the air side-on
    const k2 = t - (bt(193) - .1), H2a = { lean: 0, shF: .1, elF: .3, shB: -.1, elB: .3, face: 'neutral', flip: true };
    seed('C_hand2');
    man(1490, GF, CS * .95, k2 < 0 ? H2a : { ...kp(k2, [[0, H2a], [.25, { ...POSES.fist, flip: true }]], backOut), shF: 2.4 - .4 * pulse(t, 4), mouth: .6 }, CAST.hand2);
    // the driller: leans on his sledge, then hoists it high and roars (the swing carries into the next shot)
    const D0 = { flip: true, lean: .1, shF: .75, elF: -.1, shB: .6, elB: .15, face: 'smile', look: -.2 };
    const DP = kpe(t, [[101.6, D0], [bt(192) + .2, D0], [bt(193) + .1, { ...HAM_UP, flip: true, face: 'shout', mouth: .7 }, backOut], [104.4, { ...HAM_UP, flip: true, face: 'shout', mouth: .5 }], [105.01, { ...HAM_UP, flip: true, face: 'grit', lean: -.18 }]]);
    const rest = t < bt(192) + .2;
    seed('C_driller');
    man(990, GF, CS * 1.08, DP, CAST.driller, { hold: J => rest ? sledge(J.handF, 1.95, J.s) : sledge(J.handF, J.angF + .9 * J.dir, J.s) });
  }
  function rigShot(t, lt, dur) {
    const c = kf(t, CAM_W), lift = liftAt(t, 1);
    outbackFrame(t, c, 'gold', {
      shake: .45, fire: 1.1, flames: .5 + .3 * pulse(t, 4), ph: t * 5, gauge: .85, smoke: 1, blur: 1, lift,
      dust: l => { const p = pulse(t, 5); seed('C_dust'); for (let i = 0; i < 4; i++) psmoke(DER + (i - 1.5) * 30 * (1 + (1 - p)), GY - 10 - (1 - p) * 30, 20 + (1 - p) * 30, AP.dust, .6 * p); },
      back: tt => { const bp = { ...POSES.fist, lean: -.1, face: 'shout', mouth: .5, shF: 2.3 - .3 * pulse(tt, 4) }; bill(tt, { pose: tt > bt(193) + .15 ? bp : B_STAND, pile: true }); },
      front: tt => crewCheer(tt),
    });
    smokeWave(t);
  }

  // ================= SHOT 4 · 105.01–110.87 · chorus under the setting sun =================
  const CAM_C = [[105.01, [300, 540, 1.3]], [110.35, [330, 560, 1.36]], [110.87, [DER, 900, 2.8]]];
  const DRIL = [395, 812], DS = 46;
  const blowsC = [197, 199, 201, 203, 205, 207].map(bt);
  function drillerHammer(t, x, y, s, look = CAST.driller) {                // one blow every two beats, landing on the odd beats
    const u = frac((bpOf(t) - 1) / 2), UP = { ...HAM_UP, flip: true }, DN = { ...POSES.hamDown, flip: true };
    const REC = { ...kp(.35, [[0, DN], [1, UP]]), flip: true, face: 'grit' };
    const P = u < .07 ? DN : u < .3 ? kp(u, [[.07, DN], [.3, REC]], easeOut) : u < .78 ? kp(u, [[.3, REC], [.78, UP]], easeOut) : kp(u, [[.78, UP], [1, DN]], easeIn);
    seed('C_drillC');
    return man(x, y, s, P, look, { hold: J => sledge(J.handF, J.angF + .9 * J.dir, J.s) });
  }
  function chorusCrew(t) {
    // two hands haul the bull rope on the off-beats
    const rope = [DER, GY - DH], H = [];
    for (const [x, key, look, ph] of [[-60, 'C_h1c', CAST.hand1, 0], [-230, 'C_h2c', CAST.hand2, .12]]) {
      const pu = pulse(t - BEAT - ph, 4), P = kp(pu, [[0, { ...POSES.haul, lean: -.15, shF: 1.35, shB: 1.5 }], [1, { ...POSES.haul, lean: -.45 }]]);
      seed(key); H.push(man(x - pu * 12, GY, 40, P, look));
    }
    seed('C_rope'); pline([rope, H[0].handF, H[1].handF, add2(H[1].handB, [-80, 60]), [-460, GY - 6]], 2.4, '#8A7050', { over: 0 });
    // the boss keeps time with his watch-chain arm
    const bp = pulse(t, 4);
    seed('C_bossC');
    man(600, GY, 38, { view: 'front', shF: 1.9 - bp * .9, elF: .9, shB: .2, elB: 1.4, face: 'laugh', mouth: .4 * bp, head: -.1 }, CAST.boss);
    // Bill stokes on the bar
    const bk = pulse(t - BEAT * 3, 3);
    bill(t, { pose: kp(bk, [[0, B_STAND], [1, B_FOLLOW]]), pile: true });
  }
  function chorusShot(t, lt, dur) {
    const c0 = kf(t, CAM_C, t > 110.3 ? easeIn : ease), hit = Math.max(...blowsC.map(e => t >= e ? Math.exp(-(t - e) * 14) : 0));
    const sh = shakeXY(t, hit * 7), c = [c0[0] + sh[0], c0[1] + sh[1], c0[2]];
    const lift = liftAt(t, 2, 1);
    outbackFrame(t, c, 'sunset', {
      shake: .3, fire: .9, flames: .3 + .3 * pulse(t, 4), ph: t * 4, gauge: .8, smoke: .9, blur: .8, lift,
      back: tt => chorusCrew(tt),
      front: tt => {
        const J = drillerHammer(tt, DRIL[0], DRIL[1], DS);
        for (const e of blowsC) { sparks(tt, e, [DER + 14, GY - 44], 16, 1); if (tt >= e && tt < e + .5) { const k = (tt - e) / .5; seed('C_cd' + e); for (let i = 0; i < 4; i++) psmoke(DER + (i - 1.5) * 26 * (1 + k), GY - 8 - k * 40, 18 + k * 34, AP.dust, .55 * (1 - k)); pglow(DER + 14, GY - 44, 90, AP.lamp, (1 - k) * .8); } }
      },
    });
    speedLines(clamp(camSpeed(CAM_C, t) / 2500), true, 80);
  }

  // ================= SHOT 5 · 110.87–116.30 · the dive: shale, coal and the fish-lizard, to 2100 ft =================
  function ichthyosaur(x, y, sc, ang) {
    // a fossil ichthyosaur lying on its side: long toothy snout, huge eye ring, ribs, paddles, the down-bent tail fluke
    seed('C_ichthy');
    const Q = p => { const r = rot2([p[0] * sc, p[1] * sc], ang); return [x + r[0], y + r[1]]; }, bone = '#E6DCC4', ink = '#2E2A26';
    // the body's dark impression in the rock
    pshade([[180, -40], [320, -62], [470, -40], [580, 10], [640, 60], [560, 50], [440, 50], [300, 55], [190, 40]].map(Q), AP.graphite, .55, { curv: true });
    // snout and skull
    pfill([[0, -2], [100, -12], [170, -32], [205, -12], [200, 18], [160, 26], [100, 6], [0, 3]].map(Q), bone, { tone: .75, dens: .6, sw: 1, ink, curv: true });
    for (let i = 0; i < 14; i++) pline([Q([8 + i * 7, 3]), Q([9 + i * 7, 9])], 1.1, ink, { over: 0, passes: 1 });
    const eye = Q([158, -6]); pline(ellPts(eye[0], eye[1], 17 * sc, 16 * sc, 16), 1.4, ink, { closed: true });
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; pline([polar(eye, a, 10 * sc), polar(eye, a, 16 * sc)], .7, ink, { over: 0, passes: 1 }); }
    // backbone: a string of vertebrae curving to the tail bend
    const SP = through([[200, -6], [270, -18], [350, -20], [430, -12], [510, 4], [570, 22], [600, 40], [650, 64]], 6);
    SP.forEach((p, i) => { if (i % 1 === 0) { const q = Q(p); pfill(ellPts(q[0], q[1], 4.2 * sc * (1 - i / SP.length * .5), 5.2 * sc * (1 - i / SP.length * .5), 7), bone, { tone: .85, ink: null }); } });
    pline(SP.map(Q), .6, ink, { over: 0, passes: 1, curv: true });
    // ribs
    for (let i = 0; i < 16; i++) { const b = 225 + i * 15, bb = SP.find(p => p[0] >= b) || SP[0], L = 34 + Math.sin(i / 15 * Math.PI) * 26; pline([bb, [bb[0] - 6, bb[1] + L * .5], [bb[0] - 2, bb[1] + L]].map(Q), 2.2, bone, { curv: true, over: 0, passes: 1 }); }
    // paddles (flippers) made of little finger bones
    for (const [px, py, s2, a2] of [[235, 30, 1, .6], [450, 26, .7, .7]]) {
      const P = [[0, 0], [30, 12], [52, 30], [58, 52], [40, 50], [16, 30], [-4, 10]].map(p => [px + rot2(p, a2 - .6)[0] * s2, py + rot2(p, a2 - .6)[1] * s2]);
      pfill(P.map(Q), bone, { tone: .45, dens: .4, sw: .7, ink, curv: true });
      for (let i = 0; i < 12; i++) { const k = hash(i * 3.3 + px), p = lerp2(P[0], P[3], .15 + k * .75), o = (hash(i * 7.7 + px) - .5) * 18 * s2; pfill(ellPts(...Q([p[0] + o * .6, p[1] - o]), 2.4 * sc, 2.4 * sc, 5), bone, { tone: .9, ink: null }); }
    }
    // tail fluke: the lower lobe carries the spine, the upper is a soft impression
    pline([[600, 40], [640, 0], [676, -20], [664, 20], [650, 64]].map(Q), 1.8, '#B8AE98', { curv: true, over: 0 });
    pline([[650, 64], [690, 96], [672, 60]].map(Q), 1.8, '#B8AE98', { curv: true, over: 0 });
  }
  function ammonite(x, y, r, key) {
    seed('C_amm' + key);
    const P = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * TAU * 2.6, rr = r * Math.exp(-a * .17); P.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
    pfill(ellPts(x, y, r * 1.02, r * 1.02, 16), '#C8C0B0', { tone: .5, dens: .5, ink: null });
    pline(P, 1, '#2E2A26', { over: 0, passes: 1, curv: true });
    for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; pline([polar([x, y], a, r * .55), polar([x, y], a, r)], .6, '#2E2A26', { over: 0, passes: 1 }); }
  }
  function fern(x, y, L, ang, key) {
    seed('C_fern' + key);
    const u = [Math.cos(ang), Math.sin(ang)], n = [-u[1], u[0]];
    pline([[x, y], add2([x, y], u.map(v => v * L))], 1, '#8A8478', { over: 0, passes: 1 });
    for (let i = 1; i < 14; i++) { const b = add2([x, y], u.map(v => v * L * i / 14)), l = L * .22 * (1 - i / 16); for (const sd of [-1, 1]) pline([b, add2(b, add2(n.map(v => v * l * sd), u.map(v => v * l * .4)))], .8, '#8A8478', { over: 0, passes: 1 }); }
  }
  const DIVE_D = [[0, 0], [1.3, 1050], [2.9, 1800], [4.3, 2060], [5.43, 2100]];
  function diveShot(t, lt, dur) {
    // fast through the ground we already know, slowing as the bit comes to the coal and the fossil beside it
    const d = kf(lt, DIVE_D, x => 1 - Math.pow(1 - x, 1.6));
    dive(t, lt, dur, { from: 0, to: 2100, k: d / 2100, skyCol: '#C8704A', extra: () => {
      for (const [dd, x, r, k] of [[1260, 330, 70, 1], [1420, 1350, 52, 2], [1580, 560, 86, 3], [1720, 1560, 60, 4], [1350, 1780, 44, 5]]) ammonite(x, dd * FT, r, k);
      fern(420, 1960 * FT, 260, -.4, 1); fern(1900, 2230 * FT, 220, -2.6, 2); fern(200, 2250 * FT, 200, -.9, 3);
      ichthyosaur(990, 2080 * FT, 2.4, -.07);
    } });
    speedLines(1 - seg(lt, 0, .5), true, 80);
    if (lt > dur - .35) scribbleWipe((lt - (dur - .35)) / .7);
  }

  shots([[81.24, glasgowShot], [92.04, fireShot], [101.6, rigShot], [105.01, chorusShot], [110.87, diveShot]]);
})();
