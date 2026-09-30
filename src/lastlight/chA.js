// chA.js: chapter A of "Last Light of September", the park (0 → BAR(13)). See docs/lastlight/STORYBOARD.md.
//   A1  0 → BAR(5)       the frame blooms up from the sun, the camera cranes down from the canopy to the path, a gust
//                        (bar 3), the red leaf lets go (bar 4) and the camera follows it down; Clawd trots in on the
//                        melody's first note, AT(4, 4.5). Cut on action.
//   A2  BAR(5) → BAR(9)  medium tracking shot: Clawd trots right and kicks leaves (bars 5, 6), sees the red leaf, stops,
//                        shuffles under it and catches it on the raised arm (bar 8). Delight, then love.
//   A3  BAR(9) → BAR(13) the same camera move carries on: the leaf held up to the low sun glows on AT(9, 3); eyes blink
//                        under the bench (bar 10); the cat pushes out of the leaf heap (bar 11); a shy wave; the cat trots
//                        off (bar 12) and looks back; Clawd follows. Out: whip(), first half.
(() => {
  const tA2 = BAR(5), tA3 = BAR(9), tEnd = BAR(13);
  const tGust = BAR(3), tLet = BAR(4), tEnter = AT(4, 4.5);
  const DRIFT = [FALL.gold, FALL.amber, FALL.olive, '#E6A03A', '#C98A3A'];   // no maple red: the red leaf is the only red one
  const HAZE = '#F3D6A0';

  // ---------- helpers ----------
  // Multiplane camera: each depth layer gets its own camBegin. p = 1 is the action plane, p < 1 is farther (moves less),
  // p > 1 nearer. (C.rx, C.ry) is the world point where every layer lines up.
  const inLayer = (C, p, fn) => { camBegin(C.rx + (C.x - C.rx) * p, C.ry + (C.y - C.ry) * p, C.z); fn(); camEnd(); };
  const scr = (C, p, x, y) => [W / 2 + (x - C.rx - (C.x - C.rx) * p) * C.z, H / 2 + (y - C.ry - (C.y - C.ry) * p) * C.z];
  // ∫ of a piecewise-linear rate [[t, v], ...] from the first key to t: positions from eased speeds, in closed form
  function integ(t, K) {
    let s = 0;
    for (let i = 1; i < K.length; i++) {
      const [a, va] = K[i - 1], [b, vb] = K[i];
      if (t <= a) break;
      const e = Math.min(t, b), ve = lerp(va, vb, (e - a) / (b - a));
      s += (va + ve) / 2 * (e - a);
    }
    const [tl, vl] = K[K.length - 1];
    return t > tl ? s + vl * (t - tl) : s;
  }
  // a leaf held (or hanging) by its stem: the centre that puts the stem's end at P for rotation r
  const stemAt = (P, s, r) => [P[0] + .95 * s * Math.sin(r), P[1] - .95 * s * Math.cos(r)];
  const hazy = (cols, k) => cols.map(c => mixCol(c, HAZE, k));

  // grass tufts along a line, swaying; vis = [x0, x1] culls the ones off screen (each tuft has its own boil seed)
  function tufts(x0, x1, y, n, seed, col, t, wind = 0, h = 26, vis = null) {
    for (let i = 0; i < n; i++) {
      const x = lerp(x0, x1, (i + hash(i * 3.7 + seed)) / n); if (vis && (x < vis[0] || x > vis[1])) continue;
      const hh = h * lerp(.6, 1.2, hash(i + seed * 2)), sw = wob(t, .35, hash(i + seed)) * 4 + wind;
      boilSeed('tuft' + seed + '_' + i);   // three blades fanning from one root, in one stroke
      inkLine([[x - 11 + sw * .8, y - hh * .72], [x, y + 2], [x - 2 + sw, y - hh], [x + 1, y + 2], [x + 12 + sw * .9, y - hh * .78]], .7, col, 'inkfine', 0);
    }
  }
  const visX = (C, p, pad = 80) => { const c = C.rx + (C.x - C.rx) * p, h = W / 2 / C.z + pad; return [c - h, c + h]; };

  // ---------- Clawd's trot: one stride (4u of ground) per stride unit; the same clock on both sides of the A1/A2 cut ----------
  const tStop = BAR(7);
  const STRIDES = [[0, 1.12], [tStop - .75, 1.12], [tStop, 0]];
  const strides = t => integ(t, STRIDES);
  const W0 = .2 - frac(strides(tA2));                 // phase so the near front foot is swinging forward on BAR(5)
  // The happy trot is in the 3/4 view: the kit's side view keeps only one eye at the leading edge and hides the mouth
  // behind the near arm, and these shots introduce the character. The chapter ends in the side view (the seam needs it).
  function trotPose(t, k = 1) {
    const ph = strides(t) + W0;
    return { view: 'q', walk: ph, dy: -.34 * k * Math.abs(Math.cos(ph * TAU)), rot: -.03 * k };
  }

  // ======================================================================================================
  // A1: the crane down
  // ======================================================================================================
  const A1_SPEED = [[0, 0], [2.4, 0], [5.5, 40], [8.3, 58], [12.1, 62], [12.8, 60], [15, 58], [16.1, 0]];
  const A1_D = integ(16.1, A1_SPEED);
  const a1Cam = t => ({ x: 960 + 18 * Math.sin(t * .21), y: 540 - A1_D + integ(t, A1_SPEED), z: lerp(1.2, 1, ease(seg(t, 1.5, 16))), rx: 960, ry: 540 });
  const A1_SUN = [1000, 400];
  const TWIG = [[1430, 118], [1310, 66], [1196, 50]];     // out of the right maple's crown into the sky; the leaf hangs at the tip
  const A1_LEAF = 32, A1_U = 15, A1_G = 990;

  // the red leaf in A1: hanging and trembling, then (bar 4) it lets go and falls in a swinging, tumbling zigzag
  function a1Leaf(t, tip) {
    const s = A1_LEAF, gustK = seg(t, tGust + .3, tGust + .9) * Math.exp(-Math.max(0, t - tGust - 1.4) * .8);
    if (t < tLet) {
      const tug = seg(t, tLet - 1, tLet);                    // the stem strains just before it lets go
      const r = Math.PI + .16 * Math.sin(t * 2.3) + (.3 * gustK + .22 * tug) * Math.sin(t * 17) - .55 * gustK;
      const [x, y] = stemAt(tip, s, r);
      return { x, y, rot: r, spin: 1 };
    }
    const a = t - tLet, ph = a * 2.5 - .35;
    const y = tip[1] + .95 * s + 53 * (a - .25 * (1 - Math.exp(-a / .25))) + 50 * (1 - Math.exp(-a * 6)) - 22 * Math.sin(ph) ** 2;
    const x = tip[0] - 40 * a + 64 * (Math.sin(ph) - Math.sin(-.35));
    const r = lerp(Math.PI, .3 * Math.cos(ph), easeOut(seg(a, 0, 1.1))) + .25 * Math.sin(a * 1.3);
    return { x, y, rot: r, spin: Math.cos(Math.max(0, a - .9) * 1.35) };
  }

  // cheap scenery for the far layers (maple() is kept for the near trees)
  function farTree(x, y, s, cols, key, sway = 0) {
    boilSeed(key);
    paint(ribbon([[x, y], [x - s * .2, y - s * 7], [x + s * .3, y - s * 12]], s * 1.7, s * .8), { wash: cols[4], ink: null });
    [[-5, -14, 6, 4.6, 0], [5, -14.5, 6, 4.6, 1], [0, -20, 8.2, 6.2, 2], [-3.8, -25.5, 5.4, 3.8, 3], [3.8, -25.5, 5.4, 3.8, 0]].forEach(([bx, by, rx, ry, ci], i) =>
      paint(ellPts(x + (bx + sway * Math.sin(i * 1.3)) * s, y + by * s, rx * s, ry * s, 16, s * .35, i), { wash: cols[ci], ink: null }));
  }
  function midTree(x, y, s, cols, key, sway = 0) {
    boilSeed(key + ' trunk');
    paint(ribbon([[x, y], [x - s * .25, y - s * 7], [x + s * .3, y - s * 12]], s * 2, s * .9), { wash: cols[4], ink: null });
    [[-5, -14, 6, 4.6, 0], [5, -14.5, 6, 4.6, 1], [0, -20, 8.2, 6.2, 2], [-3.8, -25.5, 5.4, 3.8, 3], [3.8, -25.5, 5.4, 3.8, 0]].forEach(([bx, by, rx, ry, ci], i) => {
      boilSeed(key + ' crown' + i);
      const low = clamp((by + 27) / 13);
      paint(ellPts(x + (bx + sway * Math.sin(i * 1.3)) * s, y + by * s, rx * s, ry * s, 18, s * .35, i), { wash: mixCol(cols[ci], FALL.rust, .25 * low), ink: null });
    });
    boilSeed(key + ' shade');   // one watercolour pass shades the underside of the whole crown
    paint(ellPts(x + sway * .5 * s, y - 14.5 * s, 10.5 * s, 4.2 * s, 20, s * .4), { fill: mixCol(cols[0], FALL.crimson, .45), fillOp: 90, bleed: .12, tex: .75, border: .5, ink: null });
    boilSeed(key + ' dabs');
    for (let i = 0; i < 12; i++) {
      const a = hash(i * 3.1 + x) * TAU, r = Math.sqrt(hash(i * 5.7 + x)), dx = Math.cos(a) * r * 9, dy = -19.5 + Math.sin(a) * r * 8;
      paint(ellPts(x + (dx + sway * .6) * s, y + dy * s, s * .8, s * .55, 8, s * .1, a), { wash: mixCol(cols[i % 4], '#FFE2A0', .3 * (1 - r)), washOp: 225, ink: null });
    }
  }
  function treeline(x0, x1, y, amp, n, seed, col, fillCol, key) {
    const P = [[x1, y + 1000], [x0, y + 1000]];
    for (let i = 0; i <= n; i++) P.push([lerp(x0, x1, i / n), y - amp * (.35 + .65 * Math.abs(Math.sin(i * 1.9 + seed))) * (.7 + .3 * hash(i + seed))]);
    boilSeed(key);
    paint(P, { wash: col, fill: fillCol, fillOp: 45, bleed: .04, tex: .35, border: .1, ink: null, curv: .5 });
  }
  function dab(x, y, s, rot, col, sy = .42, ink = PAL.ink) {
    const c = Math.cos(rot), sn = Math.sin(rot);
    paint(MAPLE.map(([a, b]) => [x + (a * c - b * sn) * s, y + (a * sn + b * c) * s * sy]), { wash: col, ink, sw: .45 });
  }
  function pathDabs(x0, x1, y0, y1, n, seed, s0, s1) {
    for (let i = 0; i < n; i++) {
      const h = j => hash(seed * 71 + i * 13 + j);
      boilSeed('pd' + seed + '_' + i);
      dab(lerp(x0, x1, h(1)), lerp(y0, y1, h(2)), lerp(s0, s1, h(3)), h(4) * TAU, DRIFT[Math.floor(h(5) * DRIFT.length)]);
    }
  }

  function a1Back(C, t, sway) {
    inLayer(C, .1, () => {
      sky('gold', { key: 'A1sky', x0: -80, y0: -60, w: 2080, h: 900, sun: A1_SUN, sunR: 54 });
      clouds(t, { key: 'A1cl', y: 150, n: 3, x0: -300, x1: 2300, spread: 120, scale: .85, speed: 5, col: '#F8E6C6', op: 180, seed: 5 });
    });
    inLayer(C, .28, () => {
      treeline(-500, 2500, 540, 70, 22, 1, mixCol('#D8AE7A', HAZE, .45), mixCol(FALL.rust, HAZE, .6), 'A1tl1');
      treeline(-500, 2500, 575, 55, 17, 4, mixCol('#CFA164', HAZE, .3), mixCol(FALL.amber, HAZE, .5), 'A1tl2');
    });
    inLayer(C, .5, () => {
      boilSeed('A1meadow');
      paint(rectPts(-800, 610, 3600, 1600), { wash: mixCol(FALL.grass, HAZE, .3), fill: mixCol(FALL.grassDk, HAZE, .3), fillOp: 55, bleed: .02, tex: .5, border: .15, ink: null });
      const tc = (a, b, c, k) => [...hazy([a, b, c, a], k), mixCol(FALL.bark, HAZE, k)];
      farTree(300, 640, 7, tc(FALL.amber, FALL.gold, FALL.rust, .35), 'A1ft1', sway * .2);
      farTree(520, 630, 5.5, tc(FALL.gold, FALL.olive, FALL.amber, .45), 'A1ft2', sway * .2);
      farTree(1600, 628, 7.5, tc(FALL.gold, FALL.amber, '#D98A3A', .35), 'A1ft3', sway * .2);
      farTree(1420, 612, 5, tc(FALL.olive, FALL.gold, FALL.amber, .5), 'A1ft4', sway * .2);
      farTree(760, 606, 4.2, tc(FALL.amber, FALL.olive, FALL.gold, .55), 'A1ft5', sway * .2);
      farTree(1240, 604, 4, tc(FALL.gold, FALL.rust, FALL.amber, .55), 'A1ft6', sway * .2);
      boilSeed('A1pond');
      paint(ellPts(990, 672, 520, 62, 36, 2), { wash: '#AFB9A6', fill: '#8FA29A', fillOp: 90, bleed: .06, tex: .5, ink: PAL.ink, sw: .6 });
      paint(ellPts(990, 666, 490, 44, 30, 2), { wash: mixCol('#F6D59C', '#AFB9A6', .3), fill: '#F7DFB0', fillOp: 90, bleed: .2, tex: .3, ink: null });
      glow(A1_SUN[0], 668, 210, '#FFC766', .95);   // the pond catches the sun
      boilSeed('A1ripples');
      for (let i = 0; i < 7; i++) {
        const y = 652 + i * 6, w = 170 - i * 18 + 24 * Math.sin(t * 1.3 + i), x = 1000 + 14 * Math.sin(t * .9 + i * 1.7);
        inkLine([[x - w, y], [x + w, y]], .9, '#FFF1C2', 'inkfine', 0);
      }
    });
  }
  function a1Near(C, t, sway) {
    inLayer(C, 1, () => {
      boilSeed('A1ground');
      paint(rectPts(-800, 730, 3600, 1400), { wash: FALL.grass, fill: FALL.grassDk, fillOp: 70, bleed: .02, tex: .6, border: .15, ink: null });
      boilSeed('A1path');
      paint(ribbon([[-300, 1010], [400, 1000], [800, 968], [1020, 915], [1110, 858], [1116, 800], [1170, 752]], 200, 18), { wash: FALL.path, fill: mixCol(FALL.path, FALL.grassDk, .3), fillOp: 80, bleed: .06, tex: .6, ink: mixCol(FALL.grassDk, PAL.ink, .3), sw: .5 });
      pathDabs(-100, 1150, 915, 1060, 14, 3, 9, 14);
      tufts(-200, 2200, 1075, 24, 11, mixCol(FALL.grassDk, PAL.ink, .2), t, 5 * sway, 32, visX(C, 1));
      maple(250, 975, 31, { key: 'A1L', seed: 1, cols: [FALL.amber, FALL.gold, '#E07A2E', FALL.rust], sway });   // no maple red in the crowns
      maple(1700, 950, 29, { key: 'A1R', seed: 3, cols: [FALL.gold, FALL.amber, FALL.rust, '#E07A2E'], sway: sway * 1.2 });
    });
  }
  // the gust: a swirl of leaves whips across the frame left to right, with a few streaks of moving air (screen space)
  function a1Gust(t) {
    const a = t - tGust; if (a < -.1 || a > 3.2) return;
    for (let i = 0; i < 3; i++) {
      const k = seg(a, i * .22, 1.3 + i * .22); if (k <= 0 || k >= 1) continue;
      const y = 320 + i * 190, x1 = lerp(-200, W + 400, easeOut(k)), x0 = x1 - 700 * Math.sin(k * Math.PI);
      boilSeed('A1wind' + i);
      inkLine([[x0, y + 30], [lerp(x0, x1, .5), y - 20], [x1 - 60, y + 10], [x1, y - 30], [x1 - 50, y - 60]], .8 * Math.sin(k * Math.PI), mixCol('#FFF1C2', FALL.gold, .3), 'inkfine', .6);
    }
    for (let i = 0; i < 18; i++) {
      const h = j => hash(i * 17 + j + 400), dur = 2 + .7 * h(1), k = (a - .45 * h(2)) / dur; if (k <= 0 || k >= 1) continue;
      const w = 13 + 4 * h(3), ph = h(4) * TAU, r = 55 + 45 * h(5);
      const x = lerp(-140, W + 140, k) + r * Math.cos(w * k * dur + ph), y = 250 + 560 * h(6) - 160 * k + r * .8 * Math.sin(w * k * dur + ph) + 70 * Math.sin(k * 5 + ph);
      boilSeed('A1g' + i);
      leaf(x, y, 15 + 16 * h(7), ph + k * 9, DRIFT[i % DRIFT.length], { spin: Math.cos(k * 14 + ph) });
    }
  }
  // the canopy right in front of the lens at the start: a branch and leaf clusters across the top, which the crane leaves behind
  function a1Canopy(C, t) {
    if (C.y > 540 - A1_D + 330) return;
    inLayer(C, 1.5, () => {
      const top = 540 - 1.5 * A1_D, sw = 6 * Math.sin(t * .9);   // this layer's camera centre at the start; a slow sway
      boilSeed('A1bough');
      inkLine([[40, top - 470], [230, top - 300], [420, top - 250], [700, top - 330], [860, top - 420]], 12, FALL.barkDk, 'ink', .6);
      inkLine([[1900, top - 470], [1700, top - 330], [1480, top - 300], [1300, top - 380]], 10, FALL.barkDk, 'ink', .6);
      const M = [[150, -330, 190, 150], [300, -430, 230, 110], [600, -440, 180, 80], [140, -170, 120, 110], [820, -470, 150, 60],
        [1790, -340, 200, 160], [1600, -440, 220, 100], [1340, -460, 150, 70], [1810, -160, 110, 120], [420, -330, 110, 70], [1500, -330, 120, 70]];
      M.forEach(([x, y, rx, ry], i) => {
        const c = [FALL.rust, FALL.amber, '#B8612C', FALL.gold][i % 4];
        boilSeed('A1clump' + i);
        paint(ellPts(x + sw * (1 + (i % 3)), top + y, rx, ry, 20, 16, hash(i) * 3), { wash: mixCol(c, FALL.plum, .22), fill: mixCol(c, FALL.plum, .45), fillOp: 90, bleed: .18, tex: .7, ink: null });
      });
    });
  }

  function shotA1(t, lt, dur) {
    const C = a1Cam(t);
    const gust = seg(t, tGust, tGust + .6) * Math.exp(-Math.max(0, t - tGust - 1) * 1.1);
    const sway = .45 * Math.sin(t * 1.1) + 2.6 * gust * (.65 + .35 * Math.sin(t * 7));
    a1Back(C, t, sway);
    inLayer(C, .6, () => leafField(t, { key: 'A1lf0', n: 10, seed: 4, y0: -900, y1: 1300, size: [6, 9], fall: [35, 60], cols: hazy(DRIFT, .3), ink: null, k: lerp(1, .4, seg(t, tLet, tLet + 1.5)), gust: [tGust, tGust + 2.2, 520] }));
    a1Near(C, t, sway);
    inLayer(C, 1, () => {
      // the twig with the red leaf; it springs back up when the leaf lets go
      const kick = spring(t, tLet, 5, 16) * 12, tug = t < tLet ? 4 * seg(t, tLet - 1, tLet) : 0, bob = 3 * Math.sin(t * 1.7) + 6 * gust * Math.sin(t * 11);
      const tip = [TWIG[2][0], TWIG[2][1] + bob + tug - kick];
      boilSeed('A1twig');
      inkLine([TWIG[0], [TWIG[1][0], TWIG[1][1] + (bob + tug - kick) * .4], tip], 2.4, FALL.barkDk, 'ink', .5);
      const L = a1Leaf(t, tip);
      boilSeed('A1red');
      redLeaf(L.x, L.y, A1_LEAF, L.rot, { spin: L.spin });
      leafField(t, { key: 'A1lf1', n: 10, seed: 9, y0: -900, y1: 1300, size: [13, 19], fall: [55, 95], cols: DRIFT, k: lerp(1, .35, seg(t, tLet, tLet + 1.5)), gust: [tGust, tGust + 2.2, 700] });
      // Clawd trots in along the path: the front feet cross into frame on the melody's first note
      if (t > tEnter - .8) {
        const Ce = a1Cam(tEnter), x = Ce.x - W / 2 / Ce.z - 1.15 * A1_U + 4 * A1_U * (strides(t) - strides(tEnter));
        clawd(x, A1_G, A1_U, { ...feel('happy', t), ...trotPose(t), hat: 'beanie', boilKey: 'A1clawd' });
      }
    });
    a1Gust(t);
    a1Canopy(C, t);
    a1Bloom(t, C);
  }

  // The opening: the frame blooms up from paper. A warm wash spreads out from the sun, its wet edge darker with pigment,
  // and the painted park comes up through it.
  function a1Bloom(t, C) {
    if (t > 4.5) return;
    const [sx, sy] = scr(C, .1, ...A1_SUN);
    const k = seg(t, .05, 4.4), R = 1700 * (1 - Math.pow(1 - k, 1.25)) + 10;
    const n = 60, P = [];
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU, w = 1 + .1 * Math.sin(3 * a + 1.3 + t * .5) + .06 * Math.sin(7 * a + 4.1 - t * .4) + .035 * Math.sin(13 * a + 2.2 + t * .3);
      P.push([sx + Math.cos(a) * R * w, sy + Math.sin(a) * R * w * .86]);
    }
    boilSeed('A1bloom');
    paint(P, { fill: '#F2C274', fillOp: 150 * (1 - ease(seg(t, .6, 4.4))), bleed: .22, tex: .35, border: .95, ink: null });
    irisShape(P, PAL.paper);
    inkLine([...P, P[0], P[1]], .45, mixCol(FALL.amber, PAL.paper, .35), 'dry', .5);   // the tide-line where the pigment gathers
  }

  // ======================================================================================================
  // A2 + A3: one park set and one continuous camera (the move carries across the A2/A3 cut)
  // ======================================================================================================
  const U = 24, G = 880, LS = 34;                          // Clawd's size and ground line; the red leaf's size
  // acting times, all on the performed beat
  const tNotice = AT(6, 4.35), tTurnF = AT(7, 1.62), tWatch = AT(7, 2.1), tShuffle = AT(7, 2.9), tReach = AT(7, 4.55);
  const tCatch = BAR(8), tDelight = AT(8, 1.7), tLove = AT(8, 3.25);
  const tSunLook = AT(9, 1.75), tTurnQ = AT(9, 1.95), tLift = AT(9, 2.15), tPeak = AT(9, 3), tWonder = AT(9, 3.25);
  const tRustle = AT(9, 4.6), tEyes = BAR(10), tBlink = AT(10, 1.9), tSlowBlink = AT(10, 4.3), tSee = AT(10, 2.6), tStartle = AT(10, 3), tCurious = AT(10, 3.8);
  const tCat = BAR(11), tHop = AT(11, 1.75), tLand = AT(11, 2.15), tShy = AT(11, 2.4), tWave = AT(11, 3.1), tWaveEnd = AT(11, 4.3), tFlick = AT(11, 4.25);
  const tOff = BAR(12), tBack = AT(12, 2.2), tBackEnd = AT(12, 3.05), tPlay = AT(12, 2.75), tTurnS = AT(12, 3.15), tGo = AT(12, 3.4);

  const X2 = t => 640 + 4 * U * (strides(t) - strides(tA2));   // Clawd's trot along the path (world x)
  const XS = X2(tStop);                                           // where Clawd stops under the leaf
  const XB = XS + 580, YB = 826;                                  // the bench (centre, feet)
  // the camera: follows the trot with a lag; from the love beat one slow push-in toward the leaf carries across the A2/A3
  // cut to the lift; then it eases right to take in the bench, tracks the exit and whips right into chapter B
  function cam23(t) {
    const hold = X2(t - .35) + kf(t, [[tLove, 300], [tLift, 290], [tPeak, 262], [tEyes - .3, 268], [tCurious, 372], [tOff, 360]]);
    const follow = XS + X3go(t) + 360;
    const x = lerp(hold, follow, ease(seg(t, tGo - .2, tGo + .9))) + integ(t, [[tEnd - .38, 0], [tEnd, 1500]]) + 5 * Math.sin(t * .45);
    const y = 540 + kf(t, [[tLove, 0], [tLift, 6], [tPeak, -10], [tSee, -10], [tCat, 8]]) + 3 * Math.sin(t * .37);   // tilts up with the lift
    const z = kf(t, [[tA2, 1.07], [tShuffle, 1.07], [tCatch, 1.13], [tLove, 1.12], [tLift, 1.18], [tPeak, 1.42], [tEyes - .3, 1.44], [tCurious, 1.15], [tOff, 1.14], [tGo, 1.1]]);
    return { x, y, z, rx: 960, ry: 540 };
  }

  // ---------- the red leaf in A2: it drifts down from the top of frame in a swinging zigzag onto Clawd's raised hand ----------
  const tIn = AT(6, 1.05);
  const SW = 2 * Math.PI / 2.35;                                    // swing speed (rad/s)
  const swingPh = t => SW * (t - tCatch) + Math.PI / 2;            // the swing's right end falls exactly on the catch
  function leafFree(t) {
    const k = seg(t, tIn - .6, tCatch), cx = lerp(XS + 330, XS + 5.55 * U - 70, ease(k)), amp = 70;
    const ph = swingPh(t), y = lerp(-90, G - 7.9 * U - 1.05 * LS - 12, k) - 26 * Math.sin(ph) ** 2;   // ends just above the raised hand
    return { x: cx + amp * Math.sin(ph), y, rot: .5 * Math.cos(ph) + .15 * Math.sin(t * 1.9), spin: .78 + .22 * Math.cos(t * 1.3) };
  }

  // ---------- Clawd in A2 + A3: position, view, face and arms; also which hand holds the leaf ----------
  const EMO23 = [[0, 'happy'], [tNotice, 'neutral', { eyes: 'look', lookY: -1, lookX: .6 }], [tStop + .06, 'surprised', { lookY: -1, lookX: .4 }],
    [tWatch, 'hopeful', { lookY: -.95 }], [tDelight, 'excited', { mouth: 'grin', lookX: .6, lookY: -.5 }], [tLove, 'love'],
    [tSunLook, 'hopeful', { lookX: .8, lookY: -.7 }], [tWonder, 'hopeful', { eyes: 'shine', mouth: 'o', lookX: .45, lookY: -1 }],
    [tStartle, 'surprised', { lookX: .9, lookY: .55 }], [tCurious, 'neutral', { eyes: 'look', mouth: 'o', lookX: .9, lookY: .45 }],
    [tShy, 'shy', { lookX: .75, lookY: .3 }], [tPlay, 'playful']];
  const shuffleX = t => {
    const f = leafFree(t - .42).x - 5.5 * U, catchX = leafFree(tCatch).x - 5.55 * U;
    return lerp(lerp(XS, f, ease(seg(t, tShuffle - .4, tShuffle + .2))), catchX, ease(seg(t, tReach - .5, tReach)));
  };
  const X3go = t => 4 * U * integ(t, [[tGo, 0], [tGo + .35, 1.3], [tEnd + 1, 1.3]]);   // the trot after the cat (px)
  function pose23(t) {
    const cl = emotions(t, EMO23, { take: .8 });
    const o = { ...cl, hat: 'beanie', boilKey: 'A23clawd' };
    let x, hand = t >= tCatch ? 'R' : null;
    if (t < tStop + .02) {                                            // the trot, easing to a stop
      x = X2(t);
      const k = seg(t, tStop - .75, tStop), tp = trotPose(t, 1 - k);
      o.view = 'q'; o.walk = tp.walk;
      o.dy = tp.dy + (cl.dy || 0) * .25; o.rot = tp.rot + (cl.rot || 0) * .3 - .07 * ease(seg(t, tNotice, tNotice + .3));
      o.aL = lerp(.35 + .35 * Math.sin(tp.walk * TAU), cl.aL ?? .3, k);
    } else if (t < tTurnF + .25) {                                   // the take, then turn to face us
      x = XS; Object.assign(o, turn(t, tTurnF, tTurnF + .16, .125, 0)); o.rot = (cl.rot || 0) - .07 * (1 - ease(seg(t, tStop, tTurnF)));
    } else if (t < tTurnQ) {                                         // facing us: watch, shuffle, catch, delight, love
      x = shuffleX(t);
      const v = (shuffleX(t + .04) - shuffleX(t - .04)) / .08, mv = clamp(Math.abs(v) / 70);
      o.rot = (cl.rot || 0) + clamp(-v / 1100, -.1, .1);
      const reach = backOut(seg(t, tReach, tCatch)), hold = 1 - seg(t, tCatch + .3, tCatch + 1), dip = Math.sin(Math.PI * seg(t, tReach - .3, tReach));
      o.sq = (cl.sq || 0) + .12 * dip - .12 * reach * hold;
      o.dy = (cl.dy || 0) * (t > tDelight && t < tLove ? .45 : 1) - .45 * reach * hold - .35 * mv * Math.abs(Math.sin((x - XS) / (1.1 * U) * Math.PI));
      let aR = lerp(.25, .6, ease(seg(t, tWatch, tShuffle))) - .25 * dip * (1 - reach) + .85 * reach;
      aR -= .15 * spring(t, tCatch, 7, 16);                            // the leaf lands: a little give in the arm
      aR = lerp(aR, 1.55 + .06 * Math.sin(t * 9), ease(seg(t, tDelight, tDelight + .3)));
      aR = lerp(aR, .05 + .12 * Math.sin(t * 2), ease(seg(t, tLove, tLove + .7)));   // love: the prize comes down, held to the side
      o.aR = aR;
      if (t > tWatch && t < tCatch) o.lookX = clamp((leafFree(t).x - x) / 260, -1, 1);
      if (t >= tCatch - .1 && t < tDelight) { o.lookX = .75; o.lookY = -.8; }
    } else if (t < tTurnS) {                                          // 3/4 toward the sun: the lift, the wonder, the cat
      x = shuffleX(tTurnQ - .01);
      Object.assign(o, turn(t, tTurnQ, tTurnQ + .16, 0, .125));
      const up = seg(t, tLift, tPeak), dip = Math.sin(Math.PI * seg(t, tLift, tLift + .35));
      let aR = lerp(.05 + .12 * Math.sin(t * 2), -.25, dip * (1 - up));   // a small dip (anticipation), then up to the sun
      aR = lerp(aR, 1.5, easeOut(seg(t, tLift + .2, tPeak)));
      aR = lerp(aR, .55, ease(seg(t, tStartle - .1, tCurious)));
      aR = lerp(aR, -.25, ease(seg(t, tShy - .3, tShy + .25)));
      if (t > tWave) aR = lerp(aR, 1.05 + .5 * Math.sin((t - tWave) * TAU * 2.4 - 1.2), ease(seg(t, tWave, tWave + .22)) * (1 - ease(seg(t, tWaveEnd - .25, tWaveEnd))));
      aR = lerp(aR, .6, ease(seg(t, tPlay, tTurnS)));   // playful: the leaf comes up, ready to go
      o.aR = aR;
      const toe = easeOut(seg(t, tLift + .25, tPeak)) * (1 - ease(seg(t, tStartle - .2, tStartle + .3)));
      o.dy = (cl.dy || 0) * .5 - 1.1 * toe; o.sq = (cl.sq || 0) - .2 * toe + .12 * dip * (1 - up);
      if (t > tSee - .2 && t < tStartle) { const k = ease(seg(t, tSee - .2, tSee + .15)); o.lookX = lerp(.45, .9, k); o.lookY = lerp(-1, .55, k); }
      if (t > tWonder && t < tEyes + .8) { o.tint = '#F7B25A'; o.tintK = .5 * litA(t); delete o.col; delete o.dk; delete o.lt; }
    } else {                                                           // turn to the side and follow the cat
      x = shuffleX(tTurnQ - .01) + X3go(t);
      if (t < tGo) Object.assign(o, turn(t, tTurnS, tTurnS + .16, .125, .25));
      else {
        const ph = X3go(t) / (4 * U) + W0;
        Object.assign(o, { view: 'side', flip: false, smear: 0, walk: ph, dy: -.34 * Math.abs(Math.cos(ph * TAU)) + (cl.dy || 0) * .2, rot: -.04 + (cl.rot || 0) * .3 });
      }
      if (o.view === 'side') hand = 'L';
      o.aL = lerp(.95, .5 + .06 * Math.sin(t * 5), ease(seg(t, tGo - .1, tGo + .3))); o.aR = .5;   // the leaf carried forward, clear of the eye
    }
    return { x, o, hand };
  }
  // the lit moment: the leaf crosses the sun on AT(9, 3) and glows until the eyes in the dark take the attention
  const litA = t => ease(seg(t, tPeak - .1, tPeak + .35)) * (1 - ease(seg(t, tEyes - .5, tEyes + .7)));
  function sparkles(x, y, t, t0, key) {   // little stars of light popping out around the lit leaf
    for (let i = 0; i < 6; i++) {
      const k = seg(t, t0 + i * .09, t0 + .7 + i * .09); if (k <= 0 || k >= 1) continue;
      const a = -.75 + (i - 2.5) * .5 + .2 * hash(i), d = 46 + 80 * easeOut(k);
      boilSeed(key + i);
      paint(starPts(x + Math.cos(a) * d, y + Math.sin(a) * d, (9 + 5 * hash(i + 2)) * backOut(k) * (1 - k * .5), .28, 4, k * 2), { wash: PAL.cream, washOp: 255 * (1 - k * k), ink: null });
    }
  }
  // where the held leaf sits: its stem at the arm tip, the blade standing up and out
  function heldLeaf(x, P, t) {
    const [hx, hy] = armPt(x, G, U, P.o, P.hand);
    const r = (P.hand === 'L' ? .55 : .3) + .38 * spring(t, tCatch, 5, 13) + .05 * Math.sin(t * 2.3);
    const [cx, cy] = stemAt([hx, hy], LS, r);
    return { x: cx, y: cy, rot: r, hx, hy };
  }

  // ---------- the set ----------
  // A park bench, front view: (x, y) = the ground between the front feet, s ≈ Clawd's u. bench() is everything behind the
  // leaf heap (back legs, backrest, the shadow under the seat); benchFront() is the seat and the front legs.
  function bench(x, y, s, key) {
    const wood = FALL.wood, dk = FALL.woodDk, iron = mixCol(FALL.barkDk, PAL.ink, .45), sw = clamp(s / 20, .6, 1.4);
    boilSeed(key + ' shade');
    paint(ellPts(x - .6 * s, y - 1.2 * s, 9.2 * s, 3.2 * s, 26, s * .3), { fill: '#3B2B34', fillOp: 130, bleed: .25, tex: .5, border: .2, ink: null });
    paint([[x - 7.1 * s, y - 7.4 * s], [x + 7.1 * s, y - 7.4 * s], [x + 6.2 * s, y - 4.6 * s], [x + 2 * s, y - 3 * s], [x - 3 * s, y - 2.8 * s], [x - 6.6 * s, y - 4.2 * s]],
      { wash: '#30252E', washOp: 225, fill: '#1F1720', fillOp: 100, bleed: .12, tex: .4, border: .3, ink: null, curv: .4 });
    boilSeed(key + ' back');
    for (const d of [-1, 1]) inkLine([[x + d * 6.3 * s, y - .5 * s], [x + d * 6.4 * s, y - 7 * s], [x + d * 6.9 * s, y - 14.2 * s]], sw * 2.2, iron, 'ink', .4);
    for (const [yy, hh] of [[-14.4, 1.25], [-12.4, 1.25], [-10.4, 1.25]]) paint(rrPts(x - 8.1 * s, y + yy * s, 16.2 * s, hh * s, .3 * s), { wash: wood, ink: PAL.ink, sw });
    inkLine([[x - 7.6 * s, y - 13.5 * s], [x + 7.4 * s, y - 13.45 * s]], sw * .6, dk, 'dry', 0);   // a little grain
  }
  function benchFront(x, y, s, key) {
    const wood = FALL.wood, dk = FALL.woodDk, iron = mixCol(FALL.barkDk, PAL.ink, .45), sw = clamp(s / 20, .6, 1.4);
    boilSeed(key + ' seat');
    paint([[x - 8.3 * s, y - 8.6 * s], [x + 8.3 * s, y - 8.6 * s], [x + 8.7 * s, y - 7.5 * s], [x - 8.7 * s, y - 7.5 * s]], { wash: mixCol(wood, '#F2C274', .3), fill: dk, fillOp: 50, tex: .6, ink: PAL.ink, sw });
    paint(rrPts(x - 8.7 * s, y - 7.5 * s, 17.4 * s, .8 * s, .25 * s), { wash: dk, ink: PAL.ink, sw });
    boilSeed(key + ' legs');
    for (const d of [-1, 1]) {
      inkLine([[x + d * 7.3 * s, y - 6.8 * s], [x + d * 7.9 * s, y - 4 * s], [x + d * 7.2 * s, y - 1.6 * s], [x + d * 7.7 * s, y]], sw * 2.6, iron, 'ink', .6);
      inkLine([[x + d * 8 * s, y - 7.8 * s], [x + d * 8.7 * s, y - 9.6 * s], [x + d * 8.2 * s, y - 10.9 * s], [x + d * 7.5 * s, y - 10.4 * s]], sw * 1.8, iron, 'ink', .6);
    }
  }
  function set23(C, t) {
    inLayer(C, .08, () => {
      skyBlend('gold', 'amber', lerp(.2, .38, seg(t, tA2, tEnd)), { key: 'A23sky', x0: 0, y0: -10, w: 2060, h: 780 });
      const [sx, sy] = SUN23();
      const L = litA(t);
      boilSeed('A23sun');   // the halo goes down first, so the light lands on it
      paint(ellPts(sx, sy, 170, 160, 30, 6), { fill: '#F2B45A', fillOp: 60, bleed: .35, tex: .25, border: .2, ink: null });
      paint(ellPts(sx, sy, 88, 84, 28, 3), { fill: '#FBD58A', fillOp: 110, bleed: .25, tex: .2, border: .15, ink: null });
      glow(sx, sy, 420 + 160 * L, '#FFC766', .55 + .35 * L);
      if (L > .02) for (let i = 0; i < 11; i++) {   // rays break out from behind the leaf when it lights
        const a = i / 11 * TAU + .15 * t + .3 * hash(i), len = (460 + 380 * hash(i + 4)) * (.4 + .6 * L), w = 30 + 34 * hash(i + 8);
        boilSeed('A23ray' + i);
        paint([[sx + Math.cos(a) * 60, sy + Math.sin(a) * 60], [sx + Math.cos(a + w / len) * len, sy + Math.sin(a + w / len) * len], [sx + Math.cos(a - w / len) * len, sy + Math.sin(a - w / len) * len]],
          { wash: '#FFF6DC', washOp: 165 * L, ink: null });
      }
      boilSeed('A23disc');
      paint(ellPts(sx, sy, 50, 50, 30, 1), { wash: '#FFF7E0', ink: null });
      clouds(t, { key: 'A23cl', y: 170, n: 2, x0: -200, x1: 2400, spread: 120, scale: .9, speed: 6, col: '#F8E6C6', op: 170, seed: 8 });
    });
    inLayer(C, .25, () => {
      treeline(-800, 3400, 690, 60, 30, 2, mixCol('#D8AE7A', HAZE, .4), mixCol(FALL.rust, HAZE, .6), 'A23tl1');
      treeline(-800, 3400, 712, 42, 24, 5, mixCol('#CFA164', HAZE, .25), mixCol(FALL.amber, HAZE, .45), 'A23tl2');
    });
    inLayer(C, .4, () => {
      boilSeed('A23pond');
      paint(ellPts(1150, 740, 900, 30, 30, 2), { wash: mixCol('#F6D59C', '#AFB9A6', .3), fill: '#F7DFB0', fillOp: 60, bleed: .08, tex: .3, border: .1, ink: null });
      glow(SUN23()[0] + (C.x - C.rx) * (.4 - .08), 740, 150, '#FFC766', .8);
      boilSeed('A23meadow');
      paint(rectPts(-800, 752, 4600, 900), { wash: mixCol(FALL.grass, HAZE, .3), fill: mixCol(FALL.grassDk, HAZE, .3), fillOp: 55, bleed: .02, tex: .5, border: .15, ink: null });
    });
    inLayer(C, .66, () => {   // trunks behind: big trees along the far side of the meadow, crowns overhead
      const cx = C.rx + (C.x - C.rx) * .66, half = W / 2 / C.z + 520;
      [-420, 260, 850, 1820, 2460, 3120, 3760].forEach((x, i) => {
        if (Math.abs(x - cx) > half) return;
        const k = hash(i * 7 + 2), cols = [...hazy([[FALL.amber, FALL.gold, FALL.rust][i % 3], [FALL.gold, FALL.olive, FALL.amber][i % 3], [FALL.rust, FALL.amber, '#D98A3A'][i % 3], FALL.gold], .2), mixCol(FALL.bark, HAZE, .22)];
        midTree(x, 812 + 10 * k, 17 + 4 * k, cols, 'A23mt' + i, .12 * Math.sin(t * .8 + i));
      });
    });
    inLayer(C, 1, () => {
      boilSeed('A23ground');
      paint(rectPts(-800, 792, 5000, 700), { wash: FALL.grass, fill: FALL.grassDk, fillOp: 70, bleed: .02, tex: .6, border: .15, ink: null });
      boilSeed('A23path');
      paint(rectPts(-800, 836, 5000, 118, 4), { wash: FALL.path, fill: mixCol(FALL.path, FALL.grassDk, .3), fillOp: 70, bleed: .05, tex: .6, ink: null });
      inkLine([[-800, 838], [1200, 834], [3200, 839], [4200, 836]], .7, mixCol(FALL.grassDk, PAL.ink, .3), 'inkfine', .4);
      inkLine([[-800, 953], [1500, 957], [4200, 952]], .7, mixCol(FALL.grassDk, PAL.ink, .3), 'inkfine', .4);
      const cx = C.x, half = W / 2 / C.z + 60;
      for (let i = 0; i < 40; i++) {   // fallen leaves on the path
        const h = j => hash(i * 13 + j + 900), x = -200 + i * 105 + 60 * h(1); if (Math.abs(x - cx) > half) continue;
        boilSeed('A23pl' + i);
        dab(x, 850 + 95 * h(2), 13 + 7 * h(3), h(4) * TAU, DRIFT[Math.floor(h(5) * DRIFT.length)], .4, mixCol(PAL.ink, FALL.path, .45));
      }
      tufts(-400, 4400, 836, 60, 21, mixCol(FALL.grassDk, PAL.ink, .15), t, 0, 22, visX(C, 1));
    });
  }
  // the sun sits just behind the leaf as it is lifted on AT(9, 3): a constant, worked out once at load from that pose
  let SUN_A;
  const SUN23 = () => SUN_A;
  function sunFromLift() {
    const P = pose23(tPeak), L = heldLeaf(P.x, P, tPeak), C = cam23(tPeak), p = .08;
    const [sx, sy] = scr(C, 1, L.x + 34, L.y - 30);
    return [C.rx + (C.x - C.rx) * p + (sx - W / 2) / C.z, C.ry + (C.y - C.ry) * p + (sy - H / 2) / C.z];
  }

  // kicked-up leaves: a small puff from the front foot, arcing up and fluttering back down to the path
  function puff(t, t0, x0, key) {
    const a = t - t0; if (a < 0 || a > 1.8) return;
    for (let i = 0; i < 7; i++) {
      const h = j => hash(i * 11 + j + t0 * 7), dur = .8 + .45 * h(1), k = clamp(a / dur), q = Math.pow(k, .65);
      const x = x0 + (60 + 200 * h(2)) * easeOut(k) - 20, y = G + 6 - (60 + 100 * h(3)) * 4 * q * (1 - q) - 14 * h(4) * k;
      boilSeed(key + i);
      push(); translate(x, y); scale(1, lerp(1, .45, seg(a, dur - .05, dur)));
      leaf(0, 0, 13 + 6 * h(5), h(6) * TAU + a * (6 + 6 * h(7)) * (1 - k), DRIFT[i % DRIFT.length], { spin: k < 1 ? Math.cos(a * 9 + i) : .8 });
      pop();
    }
  }

  const HEAP = [XB - 2.2 * U, YB + 6, 7.8 * U, 4.3 * U], HEAPCOLS = [FALL.amber, FALL.rust, FALL.gold, '#E6A03A', FALL.olive];   // no maple red
  function benchSet(C, t) {   // the bench, the cat hidden in the heap under it, the heap, then whatever is in front
    if (Math.abs(XB - C.x) > W / 2 / C.z + 12 * U) return;
    bench(XB, YB, U * 1.08, 'A23bench');
    drawCat(C, t, false);
    pile(...HEAP, { key: 'A23heap', leaf: 13, n: 9, cols: HEAPCOLS });
    heapTop(t);
    benchFront(XB, YB, U * 1.08, 'A23bench');
    drawCat(C, t, true);
  }
  function shotA2(t, lt, dur) {
    const C = cam23(t);
    set23(C, t);
    inLayer(C, .85, () => leafField(t, { key: 'A2lf0', n: 6, seed: 21, y0: -200, y1: 900, x0: 400, x1: 3600, size: [10, 14], fall: [40, 70], cols: hazy(DRIFT, .15), wind: 14, ink: mixCol(FALL.bark, HAZE, .35) }));
    inLayer(C, 1, () => {
      benchSet(C, t);
      const P = pose23(t);
      clawd(P.x, G, U, P.o);
      puff(t, tA2, X2(tA2) + 4.6 * U, 'A2p1');
      puff(t, BAR(6), X2(BAR(6)) + 4.6 * U, 'A2p2');
      boilSeed('A2red');
      if (t < tCatch) {
        let L = leafFree(t);
        const Hd = heldLeaf(P.x, { ...P, hand: 'R' }, t), k = ease(seg(t, tCatch - .5, tCatch));
        if (k > 0) L = { x: lerp(L.x, Hd.x, k), y: lerp(L.y, Hd.y, k), rot: lerp(L.rot, Hd.rot, k), spin: lerp(L.spin, 1, k) };
        if (t > tIn - .8) redLeaf(L.x, L.y, LS, L.rot, { spin: L.spin });
      } else { const Hd = heldLeaf(P.x, P, t); redLeaf(Hd.x, Hd.y, LS, Hd.rot); }
    });
    inLayer(C, 1.3, () => {
      leafField(t, { key: 'A2lf1', n: 5, seed: 23, y0: -300, y1: 1300, x0: 0, x1: 5200, size: [15, 18], fall: [70, 110], cols: DRIFT, wind: 20 });
      tufts(-800, 5600, 1080, 70, 31, mixCol(FALL.grassDk, PAL.ink, .3), t, 0, 44, visX(C, 1.3));
    });
  }
  // ---------- the black cat in A3 ----------
  const CS = 20, CAT0 = [XB - 2.2 * U + 4, YB + 6];              // sitting hidden in the heap: only the head clears it
  const CATLAND = [CAT0[0] - 200, 912];
  const catRunX = t => CATLAND[0] + 100 * integ(t, [[tOff, 0], [tOff + .25, 1], [tBack - .15, 1], [tBack + .05, 0], [tBackEnd - .05, 0], [tBackEnd + .25, 1.15], [tEnd + 1, 1.15]]);
  function catA3(t) {   // → { x, y, o, front } (front: in front of the heap), or null
    if (t < tRustle - .1) return null;
    const blinkAt = (t0, d) => 1 - Math.sin(Math.PI * seg(t, t0, t0 + d)) * .95;
    if (t < tHop) {   // hidden in the heap under the bench, then pushing up out of it
      const open = seg(t, tEyes - .02, tEyes + .12) * blinkAt(tBlink, .16) * blinkAt(tSlowBlink, .55);
      const up = backOut(seg(t, tCat, tCat + .35));
      return { x: CAT0[0], y: CAT0[1], front: false, o: { pose: 'sit', dy: -.25 - 2.05 * up, blink: open, eyes: up > .5 ? 'wide' : 'open', pupil: .95,
        look: [lerp(-.35, -.8, seg(t, AT(10, 2.5), AT(10, 3.2))), .15], ears: lerp(lerp(-1, .1, ease(seg(t, tEyes + .15, tEyes + .6))), .8, up), boilKey: 'A3cat' } };
    }
    if (t < tLand) {  // the hop down out of the heap, toward Clawd
      const k = seg(t, tHop, tLand), p = arcPt([CAT0[0], CAT0[1] - 2.3 * CS], CATLAND, 45, k);
      return { x: p[0], y: p[1], front: k > .45, o: { pose: 'pounce', flip: true, rot: lerp(.25, -.2, k), pupil: .8, ears: .8, boilKey: 'A3cat', noShadow: true } };
    }
    // a squash just before each pose change (anticipation) and a stretch that settles just after it
    const squash = t0 => Math.sin(Math.PI * seg(t, t0 - .12, t0)) * .1, settle = t0 => spring(t, t0, 8, 20) * .9;
    if (t < tOff || (t >= tBack && t < tBackEnd)) {   // sitting in the light, face to face with Clawd; later, the look back
      const back = t >= tBack, a = back ? t - tBack : t - tLand;
      const land = back ? settle(tBack) * .8 : spring(t, tLand, 7, 18), pre = back ? squash(tBackEnd) : squash(tOff);
      const x = back ? catRunX(t) + 1.7 * CS : CATLAND[0];
      return { x, y: CATLAND[1], front: true, o: { pose: 'sit', sy: 1 - .12 * land - pre, sx: 1 + .08 * land + pre * .6, pupil: lerp(.95, .22, seg(a, .1, .8)),
        look: [back ? -1 : -.9, back ? .05 : -.05], ears: back ? 1 : .55 + .35 * Math.sin(Math.max(0, t - tWave) * 2.2), rot: back ? -.05 : .07 * Math.sin(Math.min(1, seg(t, tLand + .5, tLand + 1.2)) * Math.PI / 2),
        blink: back ? 1 : blinkAt(AT(11, 2.9), .5), tail: back ? .5 : 1.3 * spring(t, tFlick, 4, 13), tailUp: back ? 1 : 0, boilKey: 'A3cat' } };
    }
    // trotting off to the right, tail up
    const x = catRunX(t), st = t < tBack ? settle(tOff) : settle(tBackEnd), pre = t < tBack ? squash(tBack) : 0;
    return { x, y: CATLAND[1], front: true, o: { pose: 'walk', walk: (x - CATLAND[0]) / (2.9 * CS), tailUp: .85, tail: .3 * Math.sin(t * 4), pupil: .25, ears: .6,
      sx: 1 + .1 * st - pre * .3, sy: 1 - .06 * st - pre,
      dy: -.12 * Math.abs(Math.sin((x - CATLAND[0]) / (2.9 * CS) * TAU)), boilKey: 'A3cat' } };
  }
  function drawCat(C, t, front) {
    const c = catA3(t); if (!c || c.front !== front) return;
    cat(c.x, c.y, CS, c.o);
    if (!front && t > tEyes && t < tCat + .3) {   // eyeshine in the dark
      const k = (c.o.blink ?? 1) * (1 - seg(t, tCat, tCat + .3)), [hx, hy] = catHead(c.x, c.y, CS, c.o);
      for (const d of [-1, 1]) glow(hx + d * .72 * CS, hy - .15 * CS, 22, FALL.catEye, .85 * k);
    }
  }
  // loose leaves on top of the heap: two slide off when something stirs inside (the rustle), three fly when the cat pushes out
  function heapTop(t) {
    const [hx, hy, hw, hh] = HEAP;
    for (let i = 0; i < 5; i++) {
      const h = j => hash(i * 19 + j + 300), x0 = hx + (i - 2) * .16 * hw, y0 = hy - hh * (.92 - .1 * Math.abs(i - 2));
      let x = x0, y = y0, r = h(1) * TAU, sp = .8;
      if (i < 2) {   // the rustle: slide down the slope
        const k = ease(seg(t, tRustle + i * .12, tRustle + .6 + i * .12)), d = i ? 1 : -1;
        x = x0 + d * .38 * hw * k; y = y0 + .75 * hh * k * k; r += d * 2.2 * k;
      } else {       // the cat pushes out: fly up and flutter down
        const a = t - tCat - (i - 2) * .05, k = clamp(a / (.9 + .3 * h(2)));
        if (a > 0) { const q = Math.pow(k, .7); x = x0 + (i - 3) * 90 * easeOut(k) + (h(3) - .5) * 40; y = y0 - 95 * 4 * q * (1 - q) + (hy + 4 - y0) * k * k; r += a * 7 * (1 - k); sp = k < 1 ? Math.cos(a * 11 + i) : .6; }
      }
      boilSeed('A3loose' + i);
      leaf(x, y, 13 + 3 * h(4), r, [FALL.amber, FALL.gold, FALL.rust, '#E6A03A', FALL.olive][i], { spin: sp });
    }
  }
  function shotA3(t, lt, dur) {
    const C = cam23(t);
    set23(C, t);
    inLayer(C, .85, () => leafField(t, { key: 'A2lf0', n: 6, seed: 21, y0: -200, y1: 900, x0: 400, x1: 3600, size: [10, 14], fall: [40, 70], cols: hazy(DRIFT, .15), wind: 14, ink: mixCol(FALL.bark, HAZE, .35) }));
    inLayer(C, 1, () => {
      benchSet(C, t);
      const P = pose23(t);
      clawd(P.x, G, U, P.o);
      const Hd = heldLeaf(P.x, P, t);
      const lit = litA(t);
      boilSeed('A3red');
      redLeaf(Hd.x, Hd.y, LS, Hd.rot, { lit });
      sparkles(Hd.x, Hd.y, t, tPeak, 'A3spark');
    });
    inLayer(C, 1.3, () => {
      leafField(t, { key: 'A2lf1', n: 5, seed: 23, y0: -300, y1: 1300, x0: 0, x1: 5200, size: [15, 18], fall: [70, 110], cols: DRIFT, wind: 20 });
      tufts(-800, 5600, 1080, 70, 31, mixCol(FALL.grassDk, PAL.ink, .3), t, 0, 44, visX(C, 1.3));
    });
    if (t > tEnd - .35) whip(.5 * ease(seg(t, tEnd - .35, tEnd)));
  }

  SUN_A = sunFromLift();
  shots([[0, shotA1], [tA2, shotA2], [tA3, shotA3]]);
})();
