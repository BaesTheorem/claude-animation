// uplift/main.js: renderer, post, shot timeline and transitions, and the render.mjs interface.
//
// Shots register themselves with SHOT({ id, t0, t1, build(G, ctx) -> state, frame(state, lt, dur, t, ctx), out })
// where out = { kind: 'cut' | 'cross' | 'dip' | 'flash', d: seconds, col: '#hex' } is the seam into the next shot.
// cross renders both shots and mixes them (HDR, before bloom); dip fades through a colour; flash adds light
// (it blooms into a glare). Query switches: ?w=1920 (width), ?label=1 (shot id + timecode, review only),
// ?nobloom=1, ?only=S05 (render one shot's set whatever the time, for sheets of a single shot).
(async () => {
  const THREE = window.THREE, T = window.TIMING;
  const Q = new URLSearchParams(location.search), DBG = k => Q.get(k);
  const W = +(DBG('w') || 1280), H = Math.round(W * 9 / 16), PX = H / 1080;
  // ?final=1 adds the credit card after the song (and the padded audio); ?mb=4 renders 4 sub-frames per frame
  const FINAL = !!DBG('final'), CARD = 5.0, MB = +(DBG('mb') || 1), SHUTTER = +(DBG('shutter') || 1 / 48);
  window.DUR = FINAL ? T.DUR + CARD : T.DUR;
  window.PROJECT = { audio: FINAL ? 'assets/uplift_final.wav' : 'assets/uplift.wav' };
  const SH = (window.SHOTS || []).slice().sort((a, b) => a.t0 - b.t0);

  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  const view = document.createElement('canvas'); view.id = 'view'; view.width = W; view.height = H;
  document.getElementById('stage').appendChild(view);
  const out2d = view.getContext('2d');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = +(DBG('exp') || 1);
  const scene = new THREE.Scene();
  scene.add(UP.skyGroup);
  const camera = new THREE.PerspectiveCamera(40, W / H, .05, 6000);
  const rtA = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new THREE.EffectComposer(renderer, new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 }));
  composer.addPass(new THREE.RenderPass(scene, camera));
  const MIX = new THREE.ShaderPass({
    uniforms: { tDiffuse: { value: null }, tPrev: { value: rtA.texture }, uMix: { value: 0 }, uFlash: { value: new THREE.Color(0, 0, 0) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse, tPrev; uniform float uMix; uniform vec3 uFlash; varying vec2 vUv;
      void main(){ vec4 a = texture2D(tDiffuse, vUv); vec3 c = mix(a.rgb, texture2D(tPrev, vUv).rgb, uMix);
        float r = length(vUv - .5); c += uFlash * (1.2 - r); gl_FragColor = vec4(c, 1.); }`,
  });
  MIX.uniforms.tPrev.value = rtA.texture;   // ShaderPass clones uniforms, and a render target texture does not survive the clone
  composer.addPass(MIX);
  const bloom = new THREE.UnrealBloomPass(new THREE.Vector2(W, H), .85, .55, .92);
  composer.addPass(bloom); if (DBG('nobloom')) bloom.enabled = false;
  composer.addPass(new THREE.OutputPass());
  const FIN = new THREE.ShaderPass({
    uniforms: { tDiffuse: { value: null }, uFade: { value: 0 }, uFadeCol: { value: new THREE.Color(0, 0, 0) }, uSeed: { value: 0 }, uRes: { value: new THREE.Vector2(W, H) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uFade, uSeed; uniform vec3 uFadeCol; uniform vec2 uRes; varying vec2 vUv;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + uSeed) * 43758.5453); }
      void main(){
        vec2 d = vUv - .5; float r2 = dot(d, d);
        vec2 off = d * r2 * .0045;                               // a faint lens fringe at the edges
        vec3 c = vec3(texture2D(tDiffuse, vUv + off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - off).b);
        vec2 q = d; q.x *= uRes.x / uRes.y;
        c *= 1. - .32 * smoothstep(.25, .95, length(q));          // vignette
        c += (h(vUv * uRes) - .5) * .028;                         // grain
        c = mix(c, uFadeCol, uFade);
        gl_FragColor = vec4(c, 1.); }`,
  });
  composer.addPass(FIN);

  // ---------------------------------------------------------------- build every shot's set
  await PEOPLE.ready;
  await Promise.all(window.PRELOAD || []);     // chapter files push texture loads here
  const ctx = { camera, scene, W, H, PX, renderer };
  for (const s of SH) {
    s.G = new THREE.Group(); s.G.visible = false; s.dur = s.t1 - s.t0;
    try { s.state = s.build ? s.build(s.G, ctx) || {} : {}; }
    catch (e) { console.error(`[${s.id}] build failed: ${e && e.stack || e}`); s.broken = true; s.state = {}; }
    scene.add(s.G);
  }
  const idx = t => { for (let i = 0; i < SH.length; i++) if (t < SH[i].t1) return i; return SH.length - 1; };
  function setShot(s, t) {
    for (const x of SH) x.G.visible = false;
    s.G.visible = true;
    UP.sky({ time: t });
    // a shot that throws draws a red sky, so one chapter's bug never stops the others from rendering
    try { if (s.broken) throw new Error('build failed'); s.frame(s.state, t - s.t0, s.dur, t, ctx); }
    catch (e) { if (!s.warned) { console.error(`[${s.id}] frame failed: ${e && e.stack || e}`); s.warned = true; } s.G.visible = false; UP.sky({ zen: '#5A0A0A', hor: '#A01818', time: t }); UP.cam(camera, [0, 0, 0], [0, 0, -1], 40); }
    UP.placeSky(camera, PX);
  }
  const BLACK = new THREE.Color(0, 0, 0);
  // the credit card after the song: the film's last star, then the credits (the song, its writer and singer)
  function card(t) {
    const k = t - T.DUR, a = Math.min(1, Math.max(0, (k - .5) / 1.0)) * Math.min(1, Math.max(0, (CARD - k - .2) / 1.0));
    out2d.fillStyle = '#05060B'; out2d.fillRect(0, 0, W, H);
    const u = H / 1080, cx = W / 2;
    const g = out2d.createRadialGradient(cx, H * .3, 0, cx, H * .3, 26 * u); g.addColorStop(0, `rgba(255,214,140,${.95 * a})`); g.addColorStop(.25, `rgba(255,196,107,${.35 * a})`); g.addColorStop(1, 'rgba(255,196,107,0)');
    out2d.fillStyle = g; out2d.fillRect(cx - 30 * u, H * .3 - 30 * u, 60 * u, 60 * u);
    out2d.textAlign = 'center'; out2d.textBaseline = 'alphabetic';
    const line = (txt, y, px, alpha, style = '') => { out2d.font = `${style} ${Math.round(px * u)}px Baskerville, "Baskerville Old Face", Georgia, serif`; out2d.fillStyle = `rgba(232,226,214,${alpha})`; out2d.fillText(txt, cx, y * u); };
    line('Uplift', 480, 72, a * .95);
    line('written by Andrew Eigel', 570, 34, a * .8, 'italic');
    line('performed by Glen Raphael', 618, 34, a * .8, 'italic');
    line('from Brighter Than Today: A Secular Solstice (Raymond Arnold, 2014)', 700, 24, a * .55);
  }
  function frame(t) {
    if (FINAL && t >= T.DUR) { card(t); return; }
    const only = DBG('only'), i = only ? SH.findIndex(s => s.id === only) : idx(t), S = SH[i], P = SH[i - 1], N = SH[i + 1];
    let other = null, w = 0, fade = 0, fadeCol = BLACK, flash = 0, flashCol = '#FFD9A0';
    const sm = UP.smooth;
    if (!only) {
      if (N && S.out && S.out.kind !== 'cut') {
        const { kind, d = 1, col } = S.out, tc = S.t1;
        if (t > tc - d / 2) {
          if (kind === 'cross') { other = N; w = sm((t - (tc - d / 2)) / d); }
          if (kind === 'dip') { fade = sm((t - (tc - d / 2)) / (d / 2)); fadeCol = new THREE.Color(col || '#000000'); }
          if (kind === 'flash') { flash = sm((t - (tc - d / 2)) / (d / 2)); flashCol = col || flashCol; }
        }
      }
      if (P && P.out && P.out.kind !== 'cut') {
        const { kind, d = 1, col } = P.out, tc = S.t0;
        if (t < tc + d / 2) {
          if (kind === 'cross') { other = P; w = 1 - sm((t - (tc - d / 2)) / d); }
          if (kind === 'dip') { fade = 1 - sm((t - tc) / (d / 2)); fadeCol = new THREE.Color(col || '#000000'); }
          if (kind === 'flash') { flash = 1 - sm((t - tc) / (d / 2)); flashCol = col || flashCol; }
        }
      }
      fade = Math.max(fade, 1 - sm(t / 2.2), sm((t - (T.DUR - 1.4)) / 1.2));   // open from black, close to black
    }
    if (other && w > .001) {
      setShot(other, t);
      renderer.setRenderTarget(rtA); renderer.clear(); renderer.render(scene, camera); renderer.setRenderTarget(null);
      MIX.uniforms.uMix.value = w;
    } else MIX.uniforms.uMix.value = 0;
    setShot(S, t);
    MIX.uniforms.uFlash.value.set(flashCol).multiplyScalar(flash * 1.7);   // a glare that blooms, not a blank white frame
    FIN.uniforms.uFade.value = fade; FIN.uniforms.uFadeCol.value.copy(fadeCol);
    FIN.uniforms.uSeed.value = Math.floor(t * 24) % 97;
    composer.render();
    const label = DBG('label') && MB <= 1;
    out2d.drawImage(canvas, 0, 0);
    if (label) {
      const mm = Math.floor(t / 60), ss = (t - mm * 60).toFixed(2).padStart(5, '0');
      out2d.font = `${Math.round(18 * W / 1280)}px ui-monospace, Menlo, monospace`;
      out2d.fillStyle = 'rgba(255,255,255,.55)'; out2d.fillText(`${S.id}  ${mm}:${ss}`, Math.round(16 * W / 1280), H - Math.round(16 * W / 1280));
    }
  }
  // motion blur: average MB sub-frames across a 180-degree shutter, clamped to the current shot so a hard cut never
  // blends two shots (dissolves blend anyway). The label is drawn once, on top.
  const acc = document.createElement('canvas'); acc.width = W; acc.height = H; const acc2d = acc.getContext('2d');
  function frameMB(t) {
    if (MB <= 1 || (FINAL && t >= T.DUR)) { frame(t); return; }
    const S = SH[idx(t)], lab = DBG('label');
    for (let k = 0; k < MB; k++) {
      let ts = t + ((k + .5) / MB - .5) * SHUTTER;
      if (!(S.out && S.out.kind !== 'cut')) ts = Math.min(ts, S.t1 - 1e-4);
      const P = SH[idx(t) - 1]; if (!(P && P.out && P.out.kind !== 'cut')) ts = Math.max(ts, S.t0);
      frame(Math.max(0, ts));
      acc2d.globalAlpha = 1 / (k + 1); acc2d.drawImage(view, 0, 0);
    }
    acc2d.globalAlpha = 1; out2d.drawImage(acc, 0, 0);
    if (lab) label(t);
  }
  function label(t) {
    const S = SH[idx(t)], mm = Math.floor(t / 60), ss = (t - mm * 60).toFixed(2).padStart(5, '0');
    out2d.font = `${Math.round(18 * W / 1280)}px ui-monospace, Menlo, monospace`;
    out2d.fillStyle = 'rgba(255,255,255,.55)'; out2d.fillText(`${S.id}  ${mm}:${ss}`, Math.round(16 * W / 1280), H - Math.round(16 * W / 1280));
  }
  window.renderAt = async (t, type = 'image/png', q = .92) => { frameMB(t); return view.toDataURL(type, q); };
  window.renderSheet = async (times, cols = 3, w = 640, crop = null) => {
    const [cx, cy, cw, chh] = crop || [0, 0, W, H], h = Math.round(w * chh / cw), rows = Math.ceil(times.length / cols);
    const sc = document.createElement('canvas'); sc.width = cols * w; sc.height = rows * h;
    const c = sc.getContext('2d'), ms = [];
    for (let i = 0; i < times.length; i++) {
      const t0 = performance.now(); frame(times[i]); ms.push(Math.round(performance.now() - t0));
      const x = (i % cols) * w, y = Math.floor(i / cols) * h;
      c.drawImage(view, cx, cy, cw, chh, x, y, w, h);
      c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(x, y, 120, 22); c.fillStyle = '#fff'; c.font = '14px sans-serif';
      c.fillText(`${SH[idx(times[i])].id} ${times[i].toFixed(2)}s`, x + 6, y + 16);
    }
    return { url: sc.toDataURL('image/jpeg', .9), ms };
  };
  window.gpuInfo = () => { const gl = renderer.getContext(), e = gl.getExtension('WEBGL_debug_renderer_info'); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER); };
  const s = document.getElementById('scrub'), lab = document.getElementById('tt');
  if (s && !location.search.includes('render')) {
    s.max = T.DUR;
    const go = () => { const t0 = performance.now(); frame(+s.value); lab.textContent = `${(+s.value).toFixed(2)}s · ${SH[idx(+s.value)].id} · ${Math.round(performance.now() - t0)} ms`; };
    s.addEventListener('input', go); const q = DBG('t'); if (q) s.value = q; go();
  }
  window.ready = true;
})().catch(e => { console.error('uplift main failed: ' + (e && e.stack || e)); });
