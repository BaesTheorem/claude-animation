// descendendo/scene.js: the music video for "Descendendo ascendit, for piano".
//
// One mapping, three spaces. A note of pitch p at bar position s sits at
//   pos(p, s) = c(φ) + R·(cos θ·e1(φ) + sin θ·e2) + λ·(p − 67)·HS·ŷ
// with θ the pitch-class angle and φ = τ·2π·(s mod 24)/24.
//   λ = 1, τ = 0: the pitch helix (one turn per octave)
//   λ = 0, τ = 0: the circle of pitch classes (the octaves identified)
//   λ = 0, τ = 1: the torus of pitch class × the 24-bar loop of time
// The chapters morph λ and τ, so the transitions are the mathematics itself.
//
// Every frame is a pure function of t. Every spark is a performed note from SCORE, timed to the MP3.
(() => {
  const THREE = window.THREE, S = window.SCORE;
  const Q = new URLSearchParams(location.search), DBG = k => Q.get(k);   // review switches: nobloom, tm, only
  const W = 1920, H = 1080, DUR = 259.0;
  window.DUR = DUR;
  const BARS = S.bars;                                    // BARS[k]: start of bar k + 1 in seconds

  // ---------------------------------------------------------------- math
  const TAU = Math.PI * 2;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = k => { k = clamp(k); return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
  const smooth = k => { k = clamp(k); return k * k * (3 - 2 * k); };
  const seg = (x, a, b) => clamp((x - a) / (b - a));
  const kf = (x, keys, e = ease) => {
    if (x <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) if (x <= keys[i][0]) {
      const [x0, v0] = keys[i - 1], [x1, v1] = keys[i], k = e((x - x0) / (x1 - x0));
      return Array.isArray(v0) ? v0.map((v, j) => lerp(v, v1[j], k)) : lerp(v0, v1, k);
    }
    return keys[keys.length - 1][1];
  };
  const hash = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const cyc = B => ((B % 24) + 24) % 24;

  // ---------------------------------------------------------------- musical time
  function barPos(t) {                                    // fractional bar index, 0 at bar 1's downbeat
    const n = BARS.length - 1;
    if (t < BARS[0]) return (t - BARS[0]) / (BARS[1] - BARS[0]);
    if (t >= BARS[n]) return n + (t - BARS[n]) / (BARS[n] - BARS[n - 1]);
    let lo = 0, hi = n;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (BARS[m] <= t) lo = m; else hi = m; }
    return lo + (t - BARS[lo]) / (BARS[lo + 1] - BARS[lo]);
  }
  const PCN = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const CH = S.chords.map(sym => {
    const m = sym.split('@')[0].match(/^([A-G])([#b]?)(maj7|m7|m|)$/);
    const root = (PCN[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12) % 12;
    const iv = { '': [0, 4, 7], m: [0, 3, 7], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10] }[m[3]];
    return { root, pcs: iv.map(i => (root + i) % 12) };
  });
  const NBAR = CH.length;                                 // 73
  // The two structural lines (MIDI), per bar of the 24-bar cycle: every 3rd and every 4th link of the chain.
  const RISE = [67, 69, 69, 69, 70, 70, 70, 72, 72, 72, 73, 73, 73, 75, 75, 75, 76, 76, 76, 78, 78, 78, 79, 79];
  const FALL = [79, 77, 77, 77, 77, 75, 75, 75, 75, 73, 73, 73, 73, 71, 71, 71, 71, 69, 69, 69, 69, 67, 67, 67];
  const GL = .2;                                          // a step glides over the first 0.2 of its bar
  function linePitch(L, B) {
    const b = Math.floor(B), f = B - b, cb = cyc(b);
    if (cb === 0 || f >= GL || L[cb] === L[cb - 1]) return L[cb];
    return lerp(L[cb - 1], L[cb], ease(f / GL));
  }

  // ---------------------------------------------------------------- colour
  const hueCol = (pc, s = .72, l = .6) => new THREE.Color().setHSL(((pc * 30 + 20) % 360) / 360, s, l);
  const GOLD = new THREE.Color('#ffc75e'), CYAN = new THREE.Color('#5fe3ff'), MERGE = new THREE.Color('#f4eaff');
  const VIOLET = new THREE.Color('#a98bff'), BG = new THREE.Color('#05060d');
  const PCCOL = Array.from({ length: 12 }, (_, i) => hueCol(i));

  // ---------------------------------------------------------------- the mapping
  const R = 2.6, HS = .22, RB = 7.4, TH0 = -Math.PI / 2;  // D-flat faces the camera on the torus's front
  const M = { lam: 1, tau: 0 };
  const theta = p => TH0 + TAU * (p - 67) / 12;
  function pos(p, s, out = new THREE.Vector3()) {
    const th = theta(p), phi = M.tau * TAU * cyc(s) / 24;
    const cp = Math.cos(phi), sp = Math.sin(phi), ct = Math.cos(th), st = Math.sin(th);
    return out.set(-RB + RB * cp + R * ct * cp, RB * sp + R * ct * sp + M.lam * (p - 67) * HS, R * st);
  }
  const torusCentre = new THREE.Vector3(-RB, 0, 0);

  // ---------------------------------------------------------------- renderer
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const view = document.createElement('canvas');          // the preview in the studio page
  view.id = 'view'; view.width = W; view.height = H;
  document.getElementById('stage').appendChild(view);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  renderer.toneMapping = { aces: THREE.ACESFilmicToneMapping, agx: THREE.AgXToneMapping, none: THREE.NoToneMapping, neutral: THREE.NeutralToneMapping }[DBG('tm') || 'aces'];
  renderer.toneMappingExposure = +(DBG('exp') || 1.0);
  const scene = new THREE.Scene(); scene.background = BG.clone();
  const camera = new THREE.PerspectiveCamera(38, W / H, .05, 400);
  const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new THREE.EffectComposer(renderer, rt);
  composer.addPass(new THREE.RenderPass(scene, camera));
  const bloom = new THREE.UnrealBloomPass(new THREE.Vector2(W, H), 1.0, .55, .0);
  composer.addPass(bloom);
  if (DBG('nobloom')) bloom.enabled = false;
  const FINISH = new THREE.ShaderPass({
    uniforms: { tDiffuse: { value: null }, uFade: { value: 1 }, uSeed: { value: 0 }, uRes: { value: new THREE.Vector2(W, H) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      uniform sampler2D tDiffuse; uniform float uFade, uSeed; uniform vec2 uRes; varying vec2 vUv;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + uSeed) * 43758.5453); }
      void main(){
        vec3 c = texture2D(tDiffuse, vUv).rgb;
        vec2 q = vUv - .5; q.x *= uRes.x / uRes.y;
        float v = smoothstep(1.05, .25, length(q));          // vignette
        c *= mix(.55, 1.0, v);
        c += (h(gl_FragCoord.xy) - .5) * .018;               // fine grain, new each frame
        gl_FragColor = vec4(c * uFade, 1.0);
      }`
  });
  composer.addPass(FINISH);
  composer.addPass(new THREE.OutputPass());

  // depth: lines fade with scene fog, points with the same near/far (set per frame from the camera distance)
  scene.fog = new THREE.Fog(BG.clone(), 8, 20);
  const FOGU = { near: { value: 8 }, far: { value: 20 } };
  // ---------------------------------------------------------------- glow points (sparks, dust, orbs, rings)
  function pointsLayer(n, ring = false) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('size', new THREE.BufferAttribute(new Float32Array(n), 1));
    const mat = new THREE.ShaderMaterial({
      uniforms: { uScale: { value: H * .5 }, uNear: FOGU.near, uFar: FOGU.far },
      vertexShader: `attribute float size; attribute vec3 color; varying vec3 vC;
        uniform float uScale, uNear, uFar;
        void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vC = color * mix(1.0, .28, smoothstep(uNear, uFar, -mv.z));
          gl_PointSize = size * uScale / -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: ring
        ? `varying vec3 vC; void main(){ float r = length(gl_PointCoord - .5) * 2.0;
             float a = smoothstep(.72, .9, r) * smoothstep(1.0, .9, r); gl_FragColor = vec4(vC * a, 1.0); }`
        : `varying vec3 vC; void main(){ float r = length(gl_PointCoord - .5) * 2.0;
             float a = exp(-r * r * 5.0) + .6 * exp(-r * r * 40.0); gl_FragColor = vec4(vC * a * smoothstep(1.0, .8, r), 1.0); }`,
      blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, transparent: true
    });
    const pts = new THREE.Points(g, mat); pts.frustumCulled = false; scene.add(pts);
    let k = 0;
    return {
      begin() { k = 0; },
      add(v, col, bright, size) {
        if (k >= n || bright <= .003) return;
        const P = g.attributes.position.array, C = g.attributes.color.array, Z = g.attributes.size.array;
        P[3 * k] = v.x; P[3 * k + 1] = v.y; P[3 * k + 2] = v.z;
        C[3 * k] = col.r * bright; C[3 * k + 1] = col.g * bright; C[3 * k + 2] = col.b * bright;
        Z[k] = size; k++;
      },
      end() {
        g.setDrawRange(0, k);
        for (const a of ['position', 'color', 'size']) g.attributes[a].needsUpdate = true;
      }
    };
  }
  const NN = S.notes.length;
  const sparks = pointsLayer(NN + 64), rings = pointsLayer(96, true), orbs = pointsLayer(32), stars = pointsLayer(1400);

  // ---------------------------------------------------------------- fat lines
  function fatLine(width, opacity = 1) {
    const geom = new THREE.LineGeometry();
    const mat = new THREE.LineMaterial({ linewidth: width, vertexColors: true, transparent: true, opacity,
      blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, fog: true });
    mat.resolution.set(W, H);
    const line = new THREE.Line2(geom, mat); line.frustumCulled = false; scene.add(line);
    (window.__lines = window.__lines || []).push(line);
    return {
      set(pts, cols, width2) {
        if (pts.length < 6) { line.visible = false; return; }
        line.visible = true;
        const g = new THREE.LineGeometry(); g.setPositions(pts); g.setColors(cols);
        line.geometry.dispose(); line.geometry = g; line.computeLineDistances();
        if (width2 !== undefined) mat.linewidth = width2;
      },
      hide() { line.visible = false; }
    };
  }
  function thinLines() {
    const g = new THREE.BufferGeometry();
    const mat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, fog: true });
    const ls = new THREE.LineSegments(g, mat); ls.frustumCulled = false; scene.add(ls);
    return {
      set(P, C) {
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3));
        g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(C), 3));
        ls.visible = P.length > 0;
      }
    };
  }

  const guide = fatLine(1.6), grid = thinLines(), chain = fatLine(2.2), flashes = thinLines();
  const columns = [0, 1, 2, 3, 4].map(() => fatLine(3.2));
  const poly = fatLine(3.0);
  const polyFill = (() => {
    const g = new THREE.BufferGeometry(), mat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, side: THREE.DoubleSide });
    const m = new THREE.Mesh(g, mat); m.frustumCulled = false; scene.add(m);
    return { set(P, C) { g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3)); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(C), 3)); m.visible = P.length > 0; } };
  })();
  const trails = [0, 1, 2, 3].map(() => fatLine(3.4));

  // glass: a faint rim-lit surface that gives the helix its cylinder and the torus its tube
  function glass(col) {
    const mat = new THREE.ShaderMaterial({
      uniforms: { uCol: { value: col.clone() }, uK: { value: 0 } },
      vertexShader: `varying vec3 vN, vV; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform vec3 uCol; uniform float uK; varying vec3 vN, vV;
        void main(){ float f = 1.0 - abs(dot(normalize(vN), normalize(vV)));
          gl_FragColor = vec4(uCol * uK * pow(f, 5.0), 1.0); }`,
      blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, transparent: true, side: THREE.DoubleSide
    });
    const m = new THREE.Mesh(new THREE.BufferGeometry(), mat); m.frustumCulled = false; scene.add(m);
    return { m, mat };
  }
  const cylGlass = glass(new THREE.Color('#7f8cff')), torGlass = glass(new THREE.Color('#9b86ff'));
  let torArcBuilt = -1;

  // ---------------------------------------------------------------- per-note data
  const NOTES = S.notes.map((n, i) => ({ ...n, B: barPos(n.on), pc: ((n.p % 12) + 12) % 12, h: hash(i) }));
  const V = new THREE.Vector3(), V2 = new THREE.Vector3();
  const WHITE = new THREE.Color(1, 1, 1);
  const tmpC = new THREE.Color();

  // background dust: a fixed shell of faint points, far away
  const STAR = Array.from({ length: 1300 }, (_, i) => {
    const u = hash(i * 3.1) * 2 - 1, a = hash(i * 7.7) * TAU, r = 70 + 50 * hash(i * 1.3), s = Math.sqrt(1 - u * u);
    return { v: new THREE.Vector3(r * s * Math.cos(a), r * u * .6, r * s * Math.sin(a)), b: .08 + .22 * Math.pow(hash(i * 9.1), 3), tw: hash(i * 5.3) };
  });

  // ---------------------------------------------------------------- chapters: λ, τ and the voices
  function morph(B) {
    M.lam = kf(B, [[23.3, 1], [25.4, 0], [72.4, 0], [72.95, 1]]);
    M.tau = kf(B, [[47.3, 0], [49.6, 1], [71.95, 1], [72.4, 0]]);
  }
  // The first note (bar 1, G4) lights the gold point: nothing glows before it sounds.
  const T_FIRST = NOTES_FIRST(), IGNITE = () => smooth(seg(TNOW, T_FIRST - .01, T_FIRST + .16));
  function NOTES_FIRST() { return Math.min(...S.notes.map(n => n.on)); }
  let TNOW = 0;
  // Orbs: [{p, col, a, s}] for the structural voices at bar position B.
  function voices(B) {
    const out = [];
    if (B < 24) out.push({ p: linePitch(RISE, Math.max(0, B)), col: GOLD.clone(), a: IGNITE() });
    else if (B < 48) out.push({ p: linePitch(FALL, B), col: GOLD.clone().lerp(CYAN, smooth(seg(B, 24, 24.6))), a: 1 });
    else if (B < 72) {
      const pr = linePitch(RISE, B), pf = linePitch(FALL, B), m = clamp(1 - Math.abs(pr - pf) / 1.2);
      out.push({ p: pr, col: CYAN.clone().lerp(GOLD, smooth(seg(B, 48, 48.6))).lerp(MERGE, m * .8), a: 1 });
      out.push({ p: pf, col: CYAN.clone().lerp(MERGE, m * .8), a: smooth(seg(B, 48.05, 48.9)) });
    } else {
      out.push({ p: 67, col: CYAN.clone().lerp(GOLD, smooth(seg(B, 72, 72.6))), a: 1 });
      out.push({ p: 79, col: GOLD.clone(), a: 1 - smooth(seg(B, 72, 72.7)) });
    }
    return out;
  }
  // Trails: the path each voice has walked, as [line, from bar, to bar, colour].
  const TRAILS = [[RISE, 0, 24, GOLD], [FALL, 24, 48, CYAN], [RISE, 48, 72, GOLD], [FALL, 48, 72, CYAN]];

  // Chord pitch classes with smooth voice leading: the tone that changes glides the short way.
  function chordNow(B) {
    const k = clamp(Math.floor(B), 0, NBAR - 1), f = B - k;
    const cur = CH[k].pcs, prev = k > 0 ? CH[k - 1].pcs : cur, g = ease(clamp(f / .28));
    const stay = cur.filter(p => prev.includes(p)), come = cur.filter(p => !prev.includes(p)), go = prev.filter(p => !cur.includes(p));
    const out = stay.map(p => ({ p, a: 1 }));
    come.forEach((p, i) => {
      if (i < go.length) {
        let d = ((p - go[i] + 18) % 12) - 6;                 // the short way round
        out.push({ p: go[i] + d * g, a: 1, moving: true });
      } else out.push({ p, a: g });
    });
    go.slice(come.length).forEach(p => out.push({ p, a: 1 - g }));
    return { tones: out, root: CH[k].root };
  }

  // ---------------------------------------------------------------- camera
  // The camera's heading is continuous over the whole film and turns mostly clockwise. The circle chapter
  // turns it from where the helix left it to the torus's front view, so the torus grows without a swing.
  const AZ_H = B => Math.PI + .1 - (Math.PI / 2) / 6 * .8 * B, AZ0 = AZ_H(23.3), AZ_F = .25 - TAU;
  const AZ_C = B => lerp(AZ0, AZ_F, clamp((B - 23.3) / (47.1 - 23.3)));
  function cameraAt(t, B) {
    let tgt, az, el, dist, fov = 38;
    const g4 = pos(67, 0, new THREE.Vector3());
    // A: the helix, one view per six-bar phrase. The camera turns with the phrase (a screw motion: each phrase
    // is the last one turned 90 degrees and raised a minor third) and rides the climb.
    const climb = kf(B, [[0, 0], [23.3, 11.3]], k => k) * HS;
    const azA = Math.PI + .1 - (Math.PI / 2) / 6 * .8 * Math.max(0, B);
    if (B < 23.3) {
      const open = smooth(seg(t, .3, 11));
      const orb = pos(linePitch(RISE, Math.max(0, B)), B, new THREE.Vector3());
      const axisT = new THREE.Vector3(0, climb + .6, 0);
      const onOrb = kf(B, [[10.6, 0], [12.4, .75], [17.2, .75], [18.8, 0]]);       // phrase 3 tracks the gold light
      tgt = new THREE.Vector3().lerpVectors(new THREE.Vector3(g4.x, g4.y + .05, g4.z), axisT, open).lerp(orb, onOrb);
      az = azA + kf(B, [[10.6, 0], [12.4, -.55], [17.2, -.75], [18.8, -.2]]);
      el = kf(B, [[0, .05], [5, .16], [7, -.3], [11, -.22], [12.6, .04], [17.4, .08], [19.4, .42], [23.3, .5]]) + .03 * Math.sin(t * .21);
      dist = Math.min(lerp(1.6, 9.2, ease(seg(t, .3, 13))), kf(B, [[0, 99], [5.5, 9.2], [7.5, 7.4], [11, 7.8], [12.8, 5.2], [17.2, 5.6], [19.2, 8.6], [23.3, 9.4]]));
    } else if (B < 47.1) {
      // B, C: rise to the axis and look down on the circle, which turns the falling way (clockwise).
      const k = ease(seg(B, 23.3, 25.6));
      tgt = new THREE.Vector3(0, lerp(climb + .6, 0, k), 0);
      az = AZ_C(B);                                           // a steady clockwise turn, the falling way
      const elC = kf(B, [[25.6, 1.22], [29.5, 1.18], [31.5, .82], [35.5, .78], [37.5, 1.02], [41.5, 1.05], [43.5, 1.2]]);
      el = lerp(.5, elC, k) + .03 * Math.sin(B * .27);
      dist = lerp(9.4, kf(B, [[25.6, 9.1], [30, 9.1], [32, 9.3], [36, 9.3], [38, 8.7], [42, 8.7], [45.5, 9.9]]), k);
    } else if (B < 72.2) {
      // D, E: the torus. First the camera backs away to frame the whole ring while the circle sweeps it out,
      // then it follows the playhead round the ring from outside, a little ahead of it.
      const k = smooth(seg(B, 47.1, 49.3)), follow2 = ease(seg(B, 49.6, 51.2));
      const phi = TAU * cyc(Math.max(48, B)) / 24;
      const play = new THREE.Vector3(-RB + RB * Math.cos(phi), RB * Math.sin(phi), 0);
      const climax = smooth(seg(B, 57.4, 59.2)) * (1 - smooth(seg(B, 61.2, 62.6)));
      const hero = smooth(seg(B, 70.4, 71.9));
      const follow = new THREE.Vector3().lerpVectors(torusCentre, play, lerp(.45, .85, climax) * follow2);
      tgt = new THREE.Vector3().lerpVectors(new THREE.Vector3(0, 0, 0), follow, k).lerp(torusCentre, hero);
      const azT = AZ_F + follow2 * (.55 * Math.sin(phi) - .5 * climax);
      az = lerp(AZ_C(B), azT, k); az = lerp(az, AZ_F - .03, hero);
      el = lerp(1.15, lerp(.42, .38 + .1 * Math.cos(phi) - .1 * climax, follow2), k); el = lerp(el, .3, hero);
      dist = lerp(9.9, lerp(28, lerp(24, 12.5, climax), follow2), k); dist = lerp(dist, 31, hero);
    } else {
      // F: the torus folds back into the circle, the circle springs back into the helix,
      // and the camera returns to where the film began: close on the first G.
      const t0 = BARS[72], fold = ease(seg(t, t0 - .3, t0 + 2.0)), home = ease(seg(t, t0 + 1.7, t0 + 5.3));
      const g4t = new THREE.Vector3(g4.x, g4.y + .05, g4.z);
      tgt = new THREE.Vector3().lerpVectors(torusCentre, new THREE.Vector3(0, 0, 0), fold).lerp(g4t, home);
      az = lerp(lerp(AZ_F - .03, AZ_F - .6, fold), Math.PI + .1 - 2 * TAU, home);
      el = lerp(lerp(.3, 1.0, fold), .05, home);
      dist = lerp(lerp(31, 7.2, fold), 2.0, home);
    }
    return { tgt, az, el, dist, fov };
  }

  // ---------------------------------------------------------------- the frame
  function update(t) {
    TNOW = t;
    const B = barPos(t);
    morph(B);
    const cam = cameraAt(t, B);
    camera.fov = cam.fov; camera.updateProjectionMatrix();
    camera.position.set(cam.tgt.x + cam.dist * Math.cos(cam.el) * Math.sin(cam.az), cam.tgt.y + cam.dist * Math.sin(cam.el),
      cam.tgt.z + cam.dist * Math.cos(cam.el) * Math.cos(cam.az));
    camera.lookAt(cam.tgt);
    scene.fog.near = FOGU.near.value = Math.max(1, cam.dist - 3);
    scene.fog.far = FOGU.far.value = cam.dist + 9 + 6 * M.tau;
    // glass cylinder around the helix (only while there is height), glass torus once time is a circle
    {
      const hk = M.lam * smooth(seg(t, 2, 14));
      cylGlass.mat.uniforms.uK.value = .16 * hk;
      if (hk > .005) {
        const hgt = 14 * HS * 12 * M.lam / 12 * 6;
        if (!cylGlass.m.userData.h || Math.abs(cylGlass.m.userData.h - hgt) > .01) {
          cylGlass.m.geometry.dispose(); cylGlass.m.geometry = new THREE.CylinderGeometry(R, R, Math.max(.01, hgt), 96, 1, true);
          cylGlass.m.userData.h = hgt;
        }
        cylGlass.m.position.set(0, 0, 0); cylGlass.m.visible = true;
      } else cylGlass.m.visible = false;
      const tk = M.tau;
      torGlass.mat.uniforms.uK.value = .22 * tk * (1 - smooth(seg(B, 72.1, 72.45)));
      if (tk > .005) {
        const arc = Math.max(.02, TAU * tk);
        if (Math.abs(arc - torArcBuilt) > 1e-4) { torGlass.m.geometry.dispose(); torGlass.m.geometry = new THREE.TorusGeometry(RB, R, 48, 160, arc); torArcBuilt = arc; }
        torGlass.m.position.copy(torusCentre); torGlass.m.visible = true;
      } else torGlass.m.visible = false;
    }
    const Bnow = B;

    // intro and outro light
    const fadeIn = smooth(seg(t, .15, 1.4)), fadeOut = 1 - smooth(seg(t, DUR - 3.2, DUR - .4));
    FINISH.uniforms.uFade.value = Math.min(1, .0 + fadeIn) * fadeOut;
    FINISH.uniforms.uSeed.value = Math.floor(t * 30) % 997;
    const climaxK = smooth(seg(B, 57.8, 59.4)) * (1 - smooth(seg(B, 61, 62.8)));
    bloom.strength = .95 + .9 * climaxK;
    bloom.radius = .55 + .15 * climaxK;
    const reveal = smooth(seg(t, 1.2, 12));              // the world unwinds from the first note

    // stars
    stars.begin();
    const rot = t * .004;
    for (let i = 0; i < STAR.length; i++) {
      const s = STAR[i], c = Math.cos(rot), sn = Math.sin(rot);
      V.set(s.v.x * c - s.v.z * sn, s.v.y, s.v.x * sn + s.v.z * c);
      stars.add(V, WHITE, s.b * reveal * (.75 + .25 * Math.sin(t * .7 + s.tw * 30)), .45);
    }
    stars.end();

    // the helix / circle / playhead-slice guide, coloured by pitch class
    {
      const P = [], C = [], lo = 24, hi = 102, span = lerp(4, 39, reveal);
      for (let q = lo * 8; q <= hi * 8; q++) {
        const p = q / 8; if (Math.abs(p - 67) > span) continue;
        pos(p, B, V); P.push(V.x, V.y, V.z);
        const edge = clamp((span - Math.abs(p - 67)) / 3), b = (.2 + .15 * (1 - M.lam)) * edge;
        const cc = PCCOL[Math.round(p) % 12]; if (DBG('red')) C.push(1, 0, 0); else C.push(cc.r * b, cc.g * b, cc.b * b);
      }
      guide.set(P, C);
    }

    // torus grid: 24 bar slices and 12 pitch-class rings
    {
      const P = [], C = [], k = M.tau * (1 - smooth(seg(B, 72.2, 72.7))) * .5;
      if (k > .004) {
        const push = (a, b, col, s) => { P.push(a.x, a.y, a.z, b.x, b.y, b.z); C.push(col.r * s, col.g * s, col.b * s, col.r * s, col.g * s, col.b * s); };
        for (let bar = 0; bar < 24; bar++) for (let j = 0; j < 48; j++) {
          pos(67 + 12 * j / 48, bar, V); pos(67 + 12 * (j + 1) / 48, bar, V2); push(V, V2, VIOLET, .28 * k * (bar % 6 === 0 ? 1.8 : 1));
        }
        for (let pc = 0; pc < 12; pc++) for (let j = 0; j < 96; j++) {
          const p = 67 + ((pc - 7 + 12) % 12);
          pos(p, 24 * j / 96, V); pos(p, 24 * (j + 1) / 96, V2); push(V, V2, PCCOL[pc], .35 * k);
        }
      }
      grid.set(P, C);
    }

    // flashes: a bass or melody note lights its whole pitch class (every octave) for a moment,
    // and the meeting on D-flat sends a ring of light both ways round the torus
    {
      const P = [], C = [];
      const push = (a, b, col, k) => { P.push(a.x, a.y, a.z, b.x, b.y, b.z); C.push(col.r * k, col.g * k, col.b * k, col.r * k, col.g * k, col.b * k); };
      for (let i = 0; i < NN; i++) {
        const n = NOTES[i]; if (n.on > t) break;
        const age = t - n.on; if (age > 1.6 || !(n.role === 'bass' || (n.hand === 'rh' && n.role === 'top'))) continue;
        const k = Math.exp(-age * 2.6) * (n.v / 127) * (n.role === 'bass' ? 1.7 : 1.1) * M.lam * reveal;
        if (k < .01) continue;
        const col = PCCOL[n.pc];
        for (let o = 2; o < 8; o++) { pos(n.pc + 12 * o, n.B, V); pos(n.pc + 12 * (o + 1), n.B, V2); push(V, V2, col, k * clamp(1 - Math.abs(n.pc + 12 * o + 6 - 70) / 32)); }
      }
      const tm = BARS[58] + .02, age = t - tm;            // bar 59: the voices reach the same D-flat
      if (age > 0 && age < 9 && M.tau > .5) {
        const phiM = 10 + age * 1.6, fade = Math.exp(-age * .45);
        for (const sgn of [1, -1]) {
          const bpos = 10 + sgn * age * 1.6;
          for (let j = 0; j < 64; j++) { pos(67 + 12 * j / 64, bpos, V); pos(67 + 12 * (j + 1) / 64, bpos, V2); push(V, V2, MERGE, .9 * fade); }
        }
        void phiM;
      }
      flashes.set(P, C);
    }

    // the chord: Shepard columns on the helix, a polygon on the circle and on the torus slice
    {
      const ch = chordNow(Math.max(0, B)), colK = M.lam * smooth(seg(B, .1, 1.2)) * (1 - smooth(seg(B, 72.2, 72.6)));
      const polyK = (1 - M.lam) * (1 - smooth(seg(B, 72.2, 72.7)));
      for (let i = 0; i < columns.length; i++) {
        const tn = ch.tones[i];
        if (!tn || colK < .01) { columns[i].hide(); continue; }
        // a pitch class is every octave of it at once: on the helix that is one vertical line
        const P = [], C = [], cc = hueCol(((Math.round(tn.p) % 12) + 12) % 12, .8, .62), base = ((tn.p % 12) + 12) % 12;
        for (let o = 2; o < 8; o++) for (let f = 0; f < 1; f += .125) {
          pos(base + 12 * o, B, V); pos(base + 12 * (o + 1), B, V2); V.lerp(V2, f); P.push(V.x, V.y, V.z);
          const p = base + 12 * (o + f), b = colK * tn.a * (tn.moving ? 1.3 : 1) * .45 * Math.pow(clamp(1 - Math.abs(p - 70) / 30), 1.5);
          C.push(cc.r * b, cc.g * b, cc.b * b);
        }
        columns[i].set(P, C);
      }
      // polygon through the chord tones, in angle order
      const tones = ch.tones.filter(x => x.a > .02).map(x => ({ ...x, p: 67 + (((x.p - 67) % 12) + 12) % 12 })).sort((a, b) => a.p - b.p);
      if (polyK > .01 && tones.length >= 3) {
        const P = [], C = [], F = [], FC = [];
        const cen = new THREE.Vector3(); tones.forEach(x => cen.add(pos(x.p, B, V))); cen.multiplyScalar(1 / tones.length);
        tones.forEach((x, i) => {
          const a = pos(x.p, B, new THREE.Vector3()), b = pos(tones[(i + 1) % tones.length].p, B, new THREE.Vector3());
          const ca = hueCol(Math.round(x.p) % 12, .75, .62);
          P.push(a.x, a.y, a.z); C.push(ca.r * polyK * .9, ca.g * polyK * .9, ca.b * polyK * .9);
          F.push(cen.x, cen.y, cen.z, a.x, a.y, a.z, b.x, b.y, b.z);
          const rc = PCCOL[ch.root], s = .035 * polyK; FC.push(rc.r * s * .25, rc.g * s * .25, rc.b * s * .25, rc.r * s, rc.g * s, rc.b * s, rc.r * s, rc.g * s, rc.b * s);
        });
        P.push(P[0], P[1], P[2]); C.push(C[0], C[1], C[2]);
        poly.set(P, C); polyFill.set(F, FC);
      } else { poly.hide(); polyFill.set([], []); }
    }

    // the chain of thirds: one link per bar between successive roots, from bar 25 on (cycles 2 and 3)
    {
      const P = [], C = [], chainK = smooth(seg(B, 24.2, 25.2)) * (1 - smooth(seg(B, 72.1, 72.6)));
      if (chainK > .01) {
        const last = Math.min(Math.floor(B), 71);
        for (let k = 25; k <= last; k++) {
          const grow = k === last ? ease(clamp((B - k) / .45)) : 1;
          const r0 = CH[k - 1].root, r1 = CH[k].root;
          const p0 = 67 + ((r0 - 7 + 12) % 12), p1 = 67 + ((r1 - 7 + 12) % 12);
          const age = B - k, b = chainK * (k >= 48 ? .3 : .4) * (1 - .35 * M.tau) * (1 + 1.4 * Math.exp(-age * 1.5));
          const n = 10;
          for (let j = 0; j < n; j++) {
            const u0 = j / n * grow, u1 = (j + 1) / n * grow;
            // a straight chord across the circle in its own bar's slice
            pos(p0, k - 1 + u0, V); pos(p1, k - 1 + u0, V2); const ax = lerp(V.x, V2.x, u0), ay = lerp(V.y, V2.y, u0), az = lerp(V.z, V2.z, u0);
            pos(p0, k - 1 + u1, V); pos(p1, k - 1 + u1, V2); const bx = lerp(V.x, V2.x, u1), by = lerp(V.y, V2.y, u1), bz = lerp(V.z, V2.z, u1);
            if (j === 0) { P.push(ax, ay, az); C.push(VIOLET.r * b, VIOLET.g * b, VIOLET.b * b); }
            P.push(bx, by, bz); C.push(VIOLET.r * b, VIOLET.g * b, VIOLET.b * b);
          }
        }
      }
      chain.set(P, C);
    }

    // trails: the walked path of each voice
    TRAILS.forEach(([L, b0, b1, col], i) => {
      const end = Math.min(B, b1);
      if (end <= b0 + .01) { trails[i].hide(); return; }
      const current = B < b1 + .02, fade = current ? 1 : .32 + .1 * (i === 0 && B > 48 ? 1 : 0);
      const endFade = 1 - smooth(seg(B, 72.15, 72.7));
      const P = [], C = [], step = 1 / 16;
      for (let s = b0; s <= end + 1e-6; s += step) {
        const ss = Math.min(s, end);
        pos(linePitch(L, ss), ss, V); P.push(V.x, V.y, V.z);
        const head = Math.exp(-(end - ss) * .35), b = fade * endFade * (.3 + .7 * head) * (current ? 1 : .8);
        C.push(col.r * b, col.g * b, col.b * b);
      }
      trails[i].set(P, C, current ? 3.6 : 2.2);
    });

    // notes: a spark at each performed note, then faint dust where it sounded
    sparks.begin(); rings.begin();
    for (let i = 0; i < NN; i++) {
      const n = NOTES[i];
      if (n.on > t + .02) break;
      const age = t - n.on, vel = n.v / 127;
      const mel = n.hand === 'rh' && n.role === 'top', bass = n.role === 'bass';
      const tauD = mel ? 1.1 : bass ? 1.4 : .6, live = age < n.off - n.on + 2.5;
      const attack = clamp(age / .018);
      const spark = live ? attack * Math.exp(-Math.max(0, age) / tauD) * (mel ? 2.4 : bass ? 1.5 : 1.1) * (.35 + vel) : 0;
      const dust = (n.B >= 24 ? .09 : .07) * (.5 + vel) * (1 - smooth(seg(B, 72.2, 72.8)));
      const bright = (spark + dust) * reveal;
      pos(n.p, n.B, V);
      tmpC.copy(PCCOL[n.pc]).lerp(WHITE, mel ? .45 : .2);
      sparks.add(V, tmpC, bright, (mel ? .72 : bass ? .6 : .42) * (1 + .5 * Math.min(spark, 2)));
      if ((mel || bass) && age < 1.2 && age >= 0) {
        const k = age / 1.2;
        rings.add(V, tmpC, (1 - k) * (1 - k) * (mel ? .9 : .5) * reveal, (mel ? .6 : .5) + 2.2 * Math.sqrt(k));
      }
    }
    // chord-tone glows on the circle and the torus slice
    {
      const ch = chordNow(Math.max(0, B)), k = (1 - M.lam) * (1 - smooth(seg(B, 72.2, 72.7)));
      if (k > .01) ch.tones.forEach(x => {
        const p = 67 + (((x.p - 67) % 12) + 12) % 12; pos(p, B, V);
        sparks.add(V, hueCol(Math.round(p) % 12, .8, .66), .55 * k * x.a, .75);
      });
    }
    sparks.end(); rings.end();

    // the voices
    orbs.begin();
    const vs = voices(B);
    for (const o of vs) {
      if (o.a <= .005) continue;
      pos(o.p, B, V);
      const breath = 1 + .06 * Math.sin(t * 2.1);
      orbs.add(V, o.col, 1.25 * o.a, .9 * breath);
      orbs.add(V, WHITE, .55 * o.a, .26);
    }
    if (vs.length === 2 && B > 48 && B < 72) {                  // the meeting on D-flat: one white-violet light
      const m = clamp(1 - Math.abs(vs[0].p - vs[1].p) / 1.2);
      if (m > 0) { pos((vs[0].p + vs[1].p) / 2, B, V); orbs.add(V, MERGE, 1.6 * m, 1.6 + .25 * Math.sin(t * 3)); }
    }
    orbs.end();
  }

  // ---------------------------------------------------------------- kit interface (render.mjs)
  const out2d = view.getContext('2d');
  function frame(t) {
    update(t);
    if (DBG('only') === 'guide') scene.children.forEach(o => { if (o !== window.__lines[0]) o.visible = false; });
    composer.render(); out2d.drawImage(canvas, 0, 0);
  }
  window.renderAt = async (t, type = 'image/png', q = .92) => { frame(t); return canvas.toDataURL(type, q); };
  window.renderSheet = async (times, cols = 3, w = 640, crop = null) => {
    const [cx, cy, cw, chh] = crop || [0, 0, W, H], h = Math.round(w * chh / cw), rows = Math.ceil(times.length / cols);
    const sc = document.createElement('canvas'); sc.width = cols * w; sc.height = rows * h;
    const c = sc.getContext('2d'), ms = [];
    for (let i = 0; i < times.length; i++) {
      const t0 = performance.now(); frame(times[i]); ms.push(Math.round(performance.now() - t0));
      const x = (i % cols) * w, y = Math.floor(i / cols) * h;
      c.drawImage(canvas, cx, cy, cw, chh, x, y, w, h);
      c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(x, y, 84, 22); c.fillStyle = '#fff'; c.font = '14px sans-serif'; c.fillText(times[i].toFixed(2) + 's', x + 6, y + 16);
    }
    return { url: sc.toDataURL('image/jpeg', .9), ms };
  };
  window.gpuInfo = () => { const gl = renderer.getContext(), e = gl.getExtension('WEBGL_debug_renderer_info'); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER); };
  // studio scrubber
  const s = document.getElementById('scrub'), lab = document.getElementById('tt');
  if (s && !location.search.includes('render')) {
    s.max = DUR;
    const go = () => { const t0 = performance.now(); frame(+s.value); lab.textContent = `${(+s.value).toFixed(2)}s · bar ${(barPos(+s.value) + 1).toFixed(2)} · ${Math.round(performance.now() - t0)} ms`; };
    s.addEventListener('input', go); const q = new URLSearchParams(location.search).get('t'); if (q) s.value = q; go();
  }
  window.ready = true;
})();
