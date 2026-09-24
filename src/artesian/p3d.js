// artesian/p3d.js: the 3D pencil renderer. Real geometry, perspective cameras, lights and cast shadows, drawn on
// the toned paper as coloured pencil: a post-shader turns light and local colour into hatching that follows the
// form, adds graphite contours from depth and normal breaks, and fades distance into the paper (atmosphere).
//
//   P3.scene()                         a fresh THREE.Scene with the standard lights (sun + sky fill); returns { scene, sun, fill }
//   P3.cam(fov)                        a THREE.PerspectiveCamera (aspect fixed at 16:9)
//   P3.look(cam, [x,y,z], [tx,ty,tz], roll)   place a camera (world units = feet; y is up)
//   P3.mat(col, o)                     a Lambert material for P3.mesh; o.style: 1 default, .8 ground (horizon strokes),
//                                      .6 glowing (fire, lamp glass: little dark hatching), .9 skin (finer, lighter);
//                                      o.emit/o.emitK
//   P3.mesh(geom, col, o)              a mesh with pencil material; o.cast/o.receive shadows (default true)
//   P3.draw(scene, cam, o)             render into the pencil layer X over whatever 2D is already drawn there
//                                      o.fog = [near, far] (ft), o.fogCol, o.ink (line colour), o.lineW, o.hatch (scale),
//                                      o.tone (burnish), o.alpha, o.lightTint (0..1: how much light colour tints surfaces),
//                                      o.clear (default true: solid geometry clears the 2D behind it to paper)
//   P3.box / P3.cyl / P3.beam(a, b, w, d)  geometry helpers (beam: a timber between two points)
//   P3.project(cam, [x,y,z]) → [sx, sy, depth]   put 2D effects (psmoke, pglow, sparks) on a 3D point
//   P3.lamp(sc, [x,y,z], col, k, dist)     warm point light with shadows (lantern, firebox, forge)
//   P3.cached(key, () => build())          build a scene once per page and keep the 3 most recent (use one key per chapter set)
//   P3.plate(wFt, hFt, bg, paint)          a lettered/painted plate in perspective (depth board, maker's plate); .userData.paint(fn, key)
//
// The 2D pencil engine (lib.js) still draws skies, glows, smoke, water sparkle and the lyric strip; P3 is for
// anything solid that the camera should see in perspective.
const P3 = (() => {
  let R = null, RT_A = null, RT_B = null, RT_N = null, POST = null, POSTSCENE = null, POSTCAM = null, TAM = null, TAM2 = null, TOOTH = null;
  const T3 = () => window.THREE;
  const albedoCache = new WeakMap();
  const size = [W, H];

  function tamTexture(seed, n, len0, len1) {
    // Tonal art map in one texture: short strokes, each with a rank (R) and pressure (G). The shader draws a stroke
    // where rank < wanted density, so one texture gives every tone from bare paper to solid hatching.
    const S = 512, cv = document.createElement('canvas'); cv.width = cv.height = S; const c = cv.getContext('2d'), rnd = lcg(seed);
    const strokes = [];
    for (let i = 0; i < n; i++) strokes.push({ x: rnd() * S, y: rnd() * S, l: len0 + rnd() * (len1 - len0), a: (rnd() - .5) * .16, w: 1.1 + rnd() * 1.9, r: rnd(), p: .55 + rnd() * .45, bow: (rnd() - .5) * 2.5 });
    strokes.sort((a, b) => b.r - a.r);            // high ranks first, so low-rank strokes (drawn in even the lightest tones) sit on top
    c.lineCap = 'round';
    for (const s of strokes) {
      c.strokeStyle = `rgb(${Math.round(s.r * 255)},${Math.round(s.p * 255)},0)`; c.lineWidth = s.w;
      const dx = Math.cos(s.a) * s.l / 2, dy = Math.sin(s.a) * s.l / 2;
      for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
        const x = s.x + ox, y = s.y + oy; if (x < -s.l || x > S + s.l || y < -20 || y > S + 20) continue;
        c.beginPath(); c.moveTo(x - dx, y - dy); c.quadraticCurveTo(x + s.bow, y + s.bow, x + dx, y + dy); c.stroke();
      }
    }
    const t = new (T3().CanvasTexture)(cv); t.wrapS = t.wrapT = T3().RepeatWrapping; t.minFilter = T3().LinearFilter; t.magFilter = T3().LinearFilter; t.generateMipmaps = false;
    t.colorSpace = T3().NoColorSpace;
    return t;
  }
  function toothTexture() {
    const S = 512, cv = document.createElement('canvas'); cv.width = cv.height = S; const c = cv.getContext('2d'), rnd = lcg(77);
    const id = c.createImageData(S, S), d = id.data;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4, v = .55 + .45 * Math.sin(x * .9 + Math.sin(y * .21) * 2.1) * Math.sin(y * 1.13 + x * .07) + (rnd() - .5) * .5;
      d[i] = d[i + 1] = d[i + 2] = Math.max(0, Math.min(255, v * 200)); d[i + 3] = 255;
    }
    c.putImageData(id, 0, 0);
    const t = new (T3().CanvasTexture)(cv); t.wrapS = t.wrapT = T3().RepeatWrapping; t.colorSpace = T3().NoColorSpace; return t;
  }

  const VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
  const FRAG = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D tBeauty, tAlbedo, tNormal, tDepth, tTam, tTam2, tTooth;
    uniform vec2 uRes; uniform float uBoil, uHand, uNear, uFar, uFogN, uFogF, uLineW, uHatch, uTone, uAlpha, uInkOn, uWarm, uMask;
    uniform vec3 uFogCol, uInk, uPaperLt;
    float luma(vec3 c){ return dot(c, vec3(.299,.587,.114)); }
    float lin(float z){ float n = z * 2.0 - 1.0; return 2.0 * uNear * uFar / (uFar + uNear - n * (uFar - uNear)); }
    float h1(float n){ return fract(sin(n * 127.1) * 43758.5453); }
    vec2 rot(vec2 p, float a){ float c = cos(a), s = sin(a); return vec2(c*p.x - s*p.y, s*p.x + c*p.y); }
    // coverage of a hatching layer at density d along angle a (screen px), with this boil frame's offset
    float hatch(sampler2D tam, vec2 px, float a, float d, float sc, float k){
      if (d <= 0.001) return 0.0;
      vec2 q = rot(px, -a) / (512.0 * sc) + vec2(h1(uBoil + k), h1(uBoil * 1.7 + k + 3.0));
      vec4 s = texture2D(tam, q);
      float on = s.a > 0.5 ? step(s.r, d * 1.02) : 0.0;
      return on * (0.55 + 0.45 * s.g);
    }
    void main(){
      vec2 px = gl_FragCoord.xy;
      vec4 A = texture2D(tAlbedo, vUv);
      // wobble: the contour sampling point drifts a pixel or two with each boil drawing
      vec2 wob = (vec2(h1(floor(px.y / 23.0) + uBoil * 3.1), h1(floor(px.x / 19.0) + uBoil * 5.3)) - 0.5) * 2.2 / uRes;
      float d0 = texture2D(tDepth, vUv).r;
      float geo = A.a;
      // ---- contours from depth and normal breaks (drawn even at the silhouette where geo is 0 on one side) ----
      float lw = uLineW;
      float e = 0.0;
      if (uInkOn > 0.5) {
        vec2 o = lw / uRes;
        float dc = lin(texture2D(tDepth, vUv + wob).r);
        vec3 nc = texture2D(tNormal, vUv + wob).xyz * 2.0 - 1.0;
        for (int i = 0; i < 4; i++) {
          vec2 dd = i == 0 ? vec2(o.x, 0.0) : i == 1 ? vec2(-o.x, 0.0) : i == 2 ? vec2(0.0, o.y) : vec2(0.0, -o.y);
          float dz = lin(texture2D(tDepth, vUv + wob + dd).r);
          vec3 nn = texture2D(tNormal, vUv + wob + dd).xyz * 2.0 - 1.0;
          e = max(e, smoothstep(0.035, 0.09, abs(dz - dc) / max(dc, 1.0)));
          e = max(e, smoothstep(0.35, 0.65, 1.0 - dot(nc, nn)) * step(texture2D(tAlbedo, vUv + wob + dd).a, 2.0));
        }
      }
      float dist = lin(d0);
      float fog = geo > 0.0 ? smoothstep(uFogN, uFogF, dist) : 1.0;
      // mask pass: solid geometry clears what's behind it (sky, sun) to bare paper, except where atmosphere fades it
      if (uMask > 0.5) { gl_FragColor = vec4(1.0, 1.0, 1.0, geo > 0.0 ? (1.0 - fog) * uAlpha : 0.0); return; }
      float tooth = texture2D(tTooth, px / 512.0).r;
      vec4 outc = vec4(0.0);
      if (geo > 0.0) {
        vec3 al = A.rgb, bl = texture2D(tBeauty, vUv).rgb;
        float s = clamp(luma(bl) / max(luma(al), 0.004), 0.0, 1.8);   // light factor, from linear buffers
        vec3 a = pow(al, vec3(1.0 / 2.2));                              // local colour back in display space
        // light colour: the hue the lights put on the surface (warm lantern, orange sunset), luminance-normalised
        vec3 tint = bl / max(al, vec3(0.004)); tint /= max(luma(tint), 0.02); tint = clamp(tint, 0.0, 2.2);
        a = mix(a, clamp(a * pow(tint, vec3(0.75)), 0.0, 1.0), clamp(s * 0.9, 0.0, 1.0) * uWarm);
        float T = clamp(1.0 - s * 0.85, 0.0, 1.0), L = 1.0 - luma(a);
        vec3 n = texture2D(tNormal, vUv).xyz * 2.0 - 1.0;
        // style id rides in the albedo alpha: 1 = default, .8 = ground (strokes follow the horizon), .6 = glowing/no dark
        float style = A.a;
        float turn = clamp(length(n.xy) * 1.2 - 0.35, 0.0, 1.0);
        float formA = atan(n.y, n.x) + 1.5708;
        // ground: patches of near-horizontal hatching, each patch at its own slight angle (a hand working across the page)
        vec2 cell = floor((px + 40.0 * vec2(h1(floor(px.y / 70.0)), h1(floor(px.x / 90.0) + 7.0))) / vec2(150.0, 60.0));
        float a1 = (style > 0.75 && style < 0.85) ? -0.06 + 0.22 * (h1(cell.x * 13.1 + cell.y * 71.7) - 0.5) : mix(uHand, formA, turn * 0.35);
        bool ground = style > 0.75 && style < 0.85, skin = style > 0.85 && style < 0.95, wat = style > 0.45 && style < 0.55;
        if (style > 0.55 && style < 0.65) { T *= 0.2; L *= 0.4; }
        if (skin) { L *= 0.55; }
        float sc = uHatch * (ground ? 0.5 : skin ? 0.4 : 0.6);
        vec3 shadowCol = mix(a * 0.5, vec3(0.16, 0.17, 0.3), 0.35);
        // burnished tone of the local colour, then the pencil layers over it
        vec3 col = a; float cov = uTone * (0.35 + 0.65 * L) * (0.7 + 0.3 * tooth);
        float c1 = hatch(tTam, px, a1, clamp(0.12 + 0.5 * L + 0.4 * T, 0.0, 0.95), sc, 1.0);
        col = mix(col, a * 0.9, c1); cov = max(cov, c1 * (0.7 + 0.3 * tooth));
        float c2 = hatch(tTam2, px, a1 + 1.1, smoothstep(0.35, 0.95, T) * 0.9, sc, 2.0);
        col = mix(col, shadowCol, c2 * 0.85); cov = max(cov, c2 * 0.85);
        float c3 = hatch(tTam, px, a1 - 0.5, smoothstep(0.72, 1.0, T + L * 0.25) * (skin ? 0.35 : 0.7), sc * 0.85, 3.0);
        col = mix(col, uInk, c3 * 0.8); cov = max(cov, c3 * 0.8);
        float c4 = hatch(tTam2, px, a1 + 0.25, smoothstep(0.95, 1.4, s) * 0.5, sc, 4.0);
        col = mix(col, uPaperLt, c4 * 0.85); cov = max(cov, c4 * 0.55);
        if (wat) {   // water: long level strokes, and broken glints that flicker with the boil where it catches the light
          float g1 = hatch(tTam2, px * vec2(0.5, 1.6), -0.02, 0.35 + 0.3 * T, sc * 1.2, 5.0);
          col = mix(col, mix(a, vec3(0.1, 0.22, 0.34), 0.45), g1 * 0.8); cov = max(cov, g1 * 0.8);
          vec2 gc = floor(px / vec2(9.0, 4.0));
          float gl = step(0.93 - 0.08 * smoothstep(0.6, 1.4, s), h1(gc.x * 17.3 + gc.y * 61.1 + uBoil * 3.7));
          col = mix(col, vec3(0.97, 0.98, 0.96), gl * 0.9); cov = max(cov, gl * 0.9);
        }
        cov *= mix(1.0, 0.2, fog); col = mix(col, uFogCol, fog * 0.65);
        outc = vec4(col, cov);
      }
      float ink = e * (0.6 + 0.4 * tooth) * mix(1.0, 0.2, fog);
      outc.rgb = mix(outc.rgb, uInk, ink); outc.a = max(outc.a, ink);
      gl_FragColor = vec4(outc.rgb, clamp(outc.a * uAlpha, 0.0, 1.0));
    }`;

  function init() {
    if (R) return;
    const THREE = T3(), cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    R = new THREE.WebGLRenderer({ canvas: cv, antialias: false, alpha: true, premultipliedAlpha: false, preserveDrawingBuffer: true });
    R.setPixelRatio(1); R.setSize(W, H, false); R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFShadowMap;
    R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.NoToneMapping;
    const mk = depth => { const t = new THREE.WebGLRenderTarget(W, H, { type: THREE.UnsignedByteType }); if (depth) { t.depthTexture = new THREE.DepthTexture(W, H); t.depthTexture.type = THREE.UnsignedIntType; } return t; };
    RT_A = mk(false); RT_B = mk(false); RT_N = mk(true);
    TAM = tamTexture(11, 5200, 10, 34); TAM2 = tamTexture(29, 4600, 12, 30); TOOTH = toothTexture();
    POST = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthTest: false, depthWrite: false,
      uniforms: { tBeauty: { value: RT_B.texture }, tAlbedo: { value: RT_A.texture }, tNormal: { value: RT_N.texture }, tDepth: { value: RT_N.depthTexture },
        tTam: { value: TAM }, tTam2: { value: TAM2 }, tTooth: { value: TOOTH }, uRes: { value: new THREE.Vector2(W, H) }, uBoil: { value: 0 }, uHand: { value: -1.05 },
        uNear: { value: .5 }, uFar: { value: 5000 }, uFogN: { value: 300 }, uFogF: { value: 3000 }, uLineW: { value: 1.5 }, uHatch: { value: 1 }, uTone: { value: .4 },
        uAlpha: { value: 1 }, uInkOn: { value: 1 }, uWarm: { value: 1 }, uMask: { value: 0 }, uFogCol: { value: new THREE.Color(AP.paper) }, uInk: { value: new THREE.Color(AP.graphite) }, uPaperLt: { value: new THREE.Color(AP.paperLt) } } });
    POSTSCENE = new THREE.Scene(); POSTCAM = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    POSTSCENE.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), POST));
  }
  function scene(o = {}) {
    init();
    const THREE = T3(), sc = new THREE.Scene();
    const sun = new THREE.DirectionalLight(0xffffff, o.sun ?? 2.4); sun.position.set(...(o.sunDir || [-60, 90, 40])); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048); const sh = o.shadowSize ?? 80; Object.assign(sun.shadow.camera, { left: -sh, right: sh, top: sh, bottom: -sh, near: 1, far: 800 });
    sun.shadow.bias = -.0006; sun.shadow.normalBias = .04; sc.add(sun); sc.add(sun.target);
    const fill = new THREE.HemisphereLight(0xffffff, 0x886644, o.fill ?? .55); sc.add(fill);
    return { scene: sc, sun, fill };
  }
  function cam(fov = 40) { const c = new (T3().PerspectiveCamera)(fov, W / H, .5, 6000); return c; }
  function look(c, p, t, roll = 0) { c.position.set(...p); c.up.set(Math.sin(roll), Math.cos(roll), 0); c.lookAt(...t); c.updateMatrixWorld(); return c; }
  function mat(col, o = {}) {
    const THREE = T3(), m = new THREE.MeshLambertMaterial({ color: new THREE.Color(col), side: o.side ?? THREE.FrontSide });
    if (o.emit) { m.emissive = new THREE.Color(o.emit); m.emissiveIntensity = o.emitK ?? 1; }
    m.userData.albedo = new THREE.Color(col); m.userData.style = o.style ?? 1; return m;
  }
  function mesh(g, col, o = {}) {
    const THREE = T3(), m = new THREE.Mesh(g, o.material || mat(col, o));
    m.castShadow = o.cast ?? true; m.receiveShadow = o.receive ?? true; return m;
  }
  // albedo twin: same colour, no light, for the local-colour pass
  function twin(m) {
    let t = albedoCache.get(m);
    if (t) { if (!m.map && m.userData.albedo) t.color.copy(m.userData.albedo); t.opacity = m.userData.style ?? 1; return t; }   // follow colour changes
    const THREE = T3(), src = m.userData.albedo || m.color || new THREE.Color(1, 1, 1);
    t = new THREE.MeshBasicMaterial({ color: m.map ? new THREE.Color(1, 1, 1) : (src.clone ? src.clone() : new THREE.Color(src)), side: m.side, map: m.map || null, vertexColors: !!m.vertexColors,
      transparent: true, opacity: m.userData.style ?? 1, blending: THREE.NoBlending });
    albedoCache.set(m, t); return t;
  }
  let NORMAL_MAT = null;
  function draw(sc, c, o = {}) {
    init();
    const THREE = T3(), s = sc.scene || sc;
    c.near = o.near ?? c.near; c.far = o.far ?? c.far; c.updateProjectionMatrix();
    R.setClearColor(0x000000, 0);
    // beauty (lit)
    R.setRenderTarget(RT_B); R.clear(); R.render(s, c);
    // albedo (unlit local colour)
    const swaps = [];
    s.traverse(obj => { if (obj.isMesh || obj.isSkinnedMesh) { swaps.push([obj, obj.material]); obj.material = Array.isArray(obj.material) ? obj.material.map(twin) : twin(obj.material); } });
    R.setRenderTarget(RT_A); R.clear(); R.render(s, c);
    for (const [obj, m] of swaps) obj.material = m;
    // normals + depth
    NORMAL_MAT = NORMAL_MAT || new THREE.MeshNormalMaterial();
    const prev = s.overrideMaterial; s.overrideMaterial = NORMAL_MAT;
    R.setRenderTarget(RT_N); R.clear(); R.render(s, c); s.overrideMaterial = prev;
    // pencil post
    const U = POST.uniforms;
    U.uBoil.value = BOILN % 997; U.uNear.value = c.near; U.uFar.value = c.far;
    U.uFogN.value = (o.fog || [250, 2500])[0]; U.uFogF.value = (o.fog || [250, 2500])[1];
    U.uFogCol.value.set(o.fogCol || AP.paper); U.uInk.value.set(o.ink || AP.graphite); U.uLineW.value = o.lineW ?? 1.5;
    U.uHatch.value = o.hatch ?? 1; U.uTone.value = o.tone ?? .4; U.uAlpha.value = o.alpha ?? 1; U.uInkOn.value = o.lines === false ? 0 : 1; U.uWarm.value = o.lightTint ?? .55; U.uHand.value = o.hand ?? -1.05;
    X.save(); X.setTransform(1, 0, 0, 1, 0, 0); X.globalAlpha = 1;
    if (o.clear !== false) {
      U.uMask.value = 1; R.setRenderTarget(null); R.setClearColor(0x000000, 0); R.clear(); R.render(POSTSCENE, POSTCAM);
      X.globalCompositeOperation = 'destination-out'; X.drawImage(R.domElement, 0, 0); X.globalCompositeOperation = 'source-over';
      U.uMask.value = 0;
    }
    R.setRenderTarget(null); R.setClearColor(0x000000, 0); R.clear(); R.render(POSTSCENE, POSTCAM);
    X.drawImage(R.domElement, 0, 0); X.restore();
  }
  // ---------- geometry helpers ----------
  function box(w, h, d) { return new (T3().BoxGeometry)(w, h, d); }
  function cyl(r0, r1, h, n = 20) { return new (T3().CylinderGeometry)(r0, r1, h, n, 1); }
  // a timber of section w×d running from a to b (world points)
  function beam(a, b, w = .7, d = w, col = AP.timber, o = {}) {
    const THREE = T3(), A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), L = A.distanceTo(B);
    const m = mesh(box(w, L, d), col, o); m.position.copy(A).add(B).multiplyScalar(.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()); return m;
  }
  // world → screen px (and view depth, ft) for placing 2D pencil effects (smoke, sparks, glows) on 3D points
  function project(c, p) { const v = new (T3().Vector3)(...p); c.updateMatrixWorld(); const d = v.clone().applyMatrix4(c.matrixWorldInverse).z; v.project(c); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H, -d]; }
  // a warm point light (lantern, firebox, forge) that casts shadows
  function lamp(sc, p, col = AP.lamp, k = 30, dist = 60, shadow = true) {
    const l = new (T3().PointLight)(col, k, dist, 1.6); l.position.set(...p); l.castShadow = shadow; l.shadow.mapSize.set(512, 512); l.shadow.bias = -.002; (sc.scene || sc).add(l); return l;
  }
  // Scene cache: build a chapter's scene once (lazily, on its first frame) and keep the few most recently used.
  // Render workers walk the film in time order, so older chapters are disposed instead of piling up in memory.
  const CACHE = new Map(); let TICK = 0; const MAXC = 3;
  function dispose(o) {
    const s = o.scene || o;
    s.traverse(ob => {
      if (ob.isMesh && !ob.isSkinnedMesh && ob.geometry && !ob.userData.shared) ob.geometry.dispose();
      if (ob.material) (Array.isArray(ob.material) ? ob.material : [ob.material]).forEach(m => { const tw = albedoCache.get(m); if (tw) tw.dispose(); m.dispose(); });
      if (ob.isLight && ob.shadow && ob.shadow.map) ob.shadow.map.dispose();
    });
  }
  function cached(key, build) {
    let e = CACHE.get(key);
    if (!e) { init(); e = { o: build() }; CACHE.set(key, e); }
    e.used = ++TICK;
    while (CACHE.size > MAXC) {
      let old = null; for (const [k, v] of CACHE) if (k !== key && (!old || v.used < old[1].used)) old = [k, v];
      if (!old) break; dispose(old[1].o); CACHE.delete(old[0]);
    }
    return e.o;
  }
  // A flat plate whose face is a canvas you letter or paint (depth board, maker's plate, a letter in a hand). It sits in
  // the scene in true perspective. plate.userData.paint(fn) repaints: fn(ctx, w, h) on a 512-wide canvas.
  function plate(wFt, hFt, col = '#2E2A26', fn = null) {
    const THREE = T3(), cw = 512, ch = Math.max(16, Math.round(512 * hFt / wFt)), cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const m = mesh(new THREE.PlaneGeometry(wFt, hFt), '#ffffff', { cast: false });
    m.material.map = tex; m.material.needsUpdate = true;
    let last = null;
    m.userData.paint = (f, key) => { if (key !== undefined && key === last) return; last = key; const c = cv.getContext('2d'); c.fillStyle = col; c.fillRect(0, 0, cw, ch); f && f(c, cw, ch); tex.needsUpdate = true; const tw = albedoCache.get(m.material); if (tw) { tw.map = tex; tw.needsUpdate = true; } };
    m.userData.paint(fn, 'init');
    return m;
  }
  return { init, scene, cam, look, mat, mesh, draw, box, cyl, beam, project, lamp, cached, plate, renderer: () => R };
})();
