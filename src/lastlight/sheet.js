// sheet.js: model sheets for the shared pieces in lib.js. Not part of the film.
//   node render.mjs --loop=llcast --stills=0.5 --out=out/check/ll      the cat, every pose
//   node render.mjs --loop=llprops --stills=0.5 --out=out/check/ll     leaves, trees, weather, props, the cottage
//   node render.mjs --loop=llhands --stills=0.5 --out=out/check/ll     armPt() markers on Clawd's hands
(() => {
  LOOPS.llcast = t => {
    paint(rectPts(-50, -50, W + 100, H + 100), { wash: PAL.paper, ink: null });
    const row1 = 430, row2 = 900, s = 26;
    cat(200, row1, s, { pose: 'sit', boilKey: 1 });
    cat(520, row1, s, { pose: 'sit', eyes: 'wide', pupil: 1, look: [.8, 0], ears: 1, tailUp: 1, boilKey: 2 });
    cat(840, row1, s, { pose: 'sit', eyes: 'half', ears: -1, wet: 1, boilKey: 3 });
    cat(1250, row1, s, { pose: 'walk', walk: 0, boilKey: 4 });
    cat(1680, row1, s, { pose: 'walk', walk: .5, tailUp: 1, tail: .6, boilKey: 5 });
    cat(260, row2, s, { pose: 'crouch', tail: -.6, pupil: .9, boilKey: 6 });
    cat(700, row2 - 60, s, { pose: 'pounce', rot: -.25, boilKey: 7 });
    cat(1150, row2, s, { pose: 'loaf', eyes: 'half', boilKey: 8 });
    cat(1600, row2, s, { pose: 'curl', boilKey: 9 });
    cat(1820, row2, 12, { pose: 'sit', flip: true, boilKey: 10 });
  };
  LOOPS.llcast.len = 2;

  LOOPS.llprops = t => {
    sky('gold', { key: 'sheetsky', h: 360, y0: 0, x0: 0, w: 640, sun: [480, 110], sunR: 34 });
    skyBlend('gold', 'storm', .6, { key: 'sheetsky2', h: 360, y0: 0, x0: 640, w: 640 });
    sky('sunset', { key: 'sheetsky3', h: 360, y0: 0, x0: 1280, w: 640 });
    paint(rectPts(0, 360, W, H - 360), { wash: PAL.paper, ink: null });
    rain(t, { x0: 640, y0: 0, w: 640, h: 360, k: .7, key: 'sheetrain' });
    clouds(t, { y: 120, n: 3, x0: 0, x1: 640, key: 'sheetcloud', scale: .5 });
    maple(170, 1000, 16, { key: 'sheetmaple' });
    pile(470, 1000, 300, 120, { key: 'sheetpile' });
    redLeaf(720, 520, 60, .3, { key: 'red1' });
    redLeaf(900, 520, 60, -.2, { lit: 1, key: 'red2' });
    leafField(t, { x0: 640, x1: 1000, y0: 600, y1: 800, n: 8, key: 'sheetfield' });
    basket(820, 1010, 22, { apples: 5, leaf: true, key: 'sheetbasket' });
    apple(1010, 920, 30, { key: 'sheetapple' });
    mug(1110, 1010, 22, { key: 'sheetmug' });
    steam(t, 1110, 930, 22, { key: 'sheetsteam' });
    cottage(1560, 1040, 18, { lit: 1, door: .5, key: 'sheetcottage' });
  };
  LOOPS.llprops.len = 2;

  LOOPS.llhands = t => {
    paint(rectPts(-50, -50, W + 100, H + 100), { wash: PAL.paper, ink: null });
    const cases = [[260, { view: 'front', aL: .2, aR: .2 }], [660, { view: 'front', aL: 1.2, aR: -.6 }], [1060, { view: 'q', aR: .9, aL: -.3 }],
      [1460, { view: 'side', aL: 1.1 }], [1780, { view: 'side', aL: -.4, flip: true, sq: .15 }]];
    cases.forEach(([x, o], i) => {
      const u = 22, G = 700;
      clawd(x, G, u, { eyes: 'normal', ...o, boilKey: 'h' + i });
      for (const w of ['L', 'R']) {
        const [px, py] = armPt(x, G, u, o, w);
        boilSeed('mark' + i + w);
        paint(ellPts(px, py, 7, 7, 12), { wash: w === 'L' ? '#2E9C6A' : '#C23B6A', ink: PAL.ink, sw: .6 });
      }
    });
  };
  LOOPS.llhands.len = 2;
})();
