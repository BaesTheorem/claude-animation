// uplift/lib.js: the shared look for "Uplift". Silhouettes against luminous skies (see DESIGN.md).
//
//   UP.sky({...})            set the sky for this frame (merged over SKY_DEFAULTS); UP.skyMix(a, b, k) blends presets
//   UP.silMat(o)             the ink material: solid silhouette that fades into the exact sky behind it with distance
//   UP.litMat(hex, k)        an emissive light (windows, lamps, screens): HDR colour k, so bloom picks it up
//   UP.glow(hex, size, k)    an additive light sprite;  UP.fire(o) a flickering fire with embers
//   UP.terrain(o) / UP.ridge(o) / UP.grass(o) / UP.water(o)   land, far ridges, wind-blown grass, sky-reflecting water
//   UP.kf(t, keys, ease)     keyframes (numbers or arrays); UP.seg / ease / smooth / lerp / clamp / hash / noise
//   UP.pulse(t, k)           1 on each tracked beat, decaying;  UP.beatAt(t) index of the last beat at or before t
//
// Everything is a pure function of time. Distances are metres.
window.SHOTS = window.SHOTS || [];               // shot files call SHOT({...}) at load; main.js (loaded last) reads them
window.SHOT = def => window.SHOTS.push(def);
window.PRELOAD = window.PRELOAD || [];         // promises main.js awaits before building sets
// load an image file into a THREE.Texture (XHR + createImageBitmap: works from file:// in the renderer)
window.loadTex = (url, o = {}) => new Promise((ok, bad) => {
  const r = new XMLHttpRequest(); r.open('GET', url); r.responseType = 'blob';
  r.onload = async () => { try { const bm = await createImageBitmap(r.response, { imageOrientation: 'flipY' }); const t = new THREE.Texture(bm);
    t.colorSpace = o.srgb === false ? THREE.NoColorSpace : THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true; ok(t); } catch (e) { bad(e); } };
  r.onerror = () => bad(new Error('xhr ' + url)); r.send();
});
window.UP = (() => {
  const THREE = window.THREE, T = window.TIMING;
  // ---------------------------------------------------------------- math
  const TAU = Math.PI * 2;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const seg = (x, a, b) => clamp((x - a) / (b - a));
  const smooth = k => { k = clamp(k); return k * k * (3 - 2 * k); };
  const ease = k => { k = clamp(k); return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
  const easeOut = k => 1 - Math.pow(1 - clamp(k), 3);
  const easeIn = k => Math.pow(clamp(k), 3);
  const mixv = (a, b, k) => Array.isArray(a) ? a.map((v, i) => lerp(v, b[i], k)) : lerp(a, b, k);
  const kf = (x, keys, e = ease) => {
    if (x <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) if (x <= keys[i][0]) {
      const [x0, v0] = keys[i - 1], [x1, v1] = keys[i];
      return mixv(v0, v1, e((x - x0) / (x1 - x0)));
    }
    return keys[keys.length - 1][1];
  };
  const hash = i => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const noise = x => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u) * 2 - 1; };
  const fbm = (x, o = 4) => { let a = .5, s = 0; for (let i = 0; i < o; i++) { s += a * noise(x + i * 17.3); x *= 2.03; a *= .5; } return s; };
  const n2 = (x, z) => { // 2D value noise, -1..1
    const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi, u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
    const h = (a, b) => hash(a * 57.31 + b * 113.17);
    return lerp(lerp(h(xi, zi), h(xi + 1, zi), u), lerp(h(xi, zi + 1), h(xi + 1, zi + 1), u), v) * 2 - 1;
  };
  const fbm2 = (x, z, o = 5) => { let a = .5, s = 0; for (let i = 0; i < o; i++) { s += a * n2(x + i * 7.1, z - i * 3.7); x *= 2.03; z *= 2.03; a *= .5; } return s; };

  // ---------------------------------------------------------------- music
  const B = T.BEATS;
  const beatAt = t => { let lo = 0, hi = B.length - 1; if (t < B[0]) return -1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (B[m] <= t) lo = m; else hi = m - 1; } return lo; };
  const pulse = (t, k = 6) => { const i = beatAt(t); return i < 0 ? 0 : Math.exp(-(t - B[i]) * k); };
  const LINE = n => T.LINES[n - 1];   // [start, end] of sung line n (1..22)

  // ---------------------------------------------------------------- colour
  const C = h => new THREE.Color(h);
  const TOK = { ink: '#07080D', night: '#0B1030', ember: '#FF8A3D', gold: '#FFC46B', frost: '#CFE6FF' };
  const hexMix = (a, b, k) => '#' + C(a).lerp(C(b), k).getHexString();   // mixes in linear space

  // ---------------------------------------------------------------- sky
  // One set of uniforms, shared by the sky dome, the stars and every silhouette material (for sky fog).
  const SKY_DEFAULTS = {
    zen: '#05071A', hor: '#1A2140', gnd: '#05060C', horK: .45,         // gradient: horizon -> zenith by elevation^horK
    sunDir: [0, -.2, -1], sunCol: '#FFD9A0', sunSize: 0, sunGlow: 0,   // sunSize in radians (0 = no disc)
    halo: '#000000', haloW: 2, haloH: .12,                             // warm band near the horizon toward the sun
    stars: 0, milky: 0, skyYaw: 0,
    moon1Dir: [0, .3, -1], moon1Col: '#000000', moon1Size: .012, moon1Phase: 0,
    moon2Dir: [0, .3, -1], moon2Col: '#000000', moon2Size: .008, moon2Phase: 0,
    cloud: 0, cloudScale: .35, cloudCol: '#20283A', cloudLit: '#FFB27A', cloudDrift: 0,
    expo: 1,
    fogNear: 8, fogDen: .004, fogMax: .97, fogK: 1,                    // silhouette fade toward the sky behind it
    wind: .5, time: 0,
  };
  const U = {};
  const toU = (k, v) => (typeof v === 'string') ? C(v) : Array.isArray(v) ? new THREE.Vector3(...v).normalize() : v;
  for (const [k, v] of Object.entries(SKY_DEFAULTS)) U['u' + k[0].toUpperCase() + k.slice(1)] = { value: toU(k, v) };
  const cur = { ...SKY_DEFAULTS };
  function sky(o) {
    Object.assign(cur, SKY_DEFAULTS, o);
    for (const [k, v] of Object.entries(cur)) {
      const u = U['u' + k[0].toUpperCase() + k.slice(1)]; if (!u) continue;
      if (typeof v === 'string') u.value.set(v);
      else if (Array.isArray(v)) u.value.set(...v).normalize();
      else u.value = v;
    }
    starMat.uniforms.uK.value = cur.stars; starMat.uniforms.uTime.value = cur.time; starMat.uniforms.uYaw.value = cur.skyYaw;
  }
  // blend two sky presets (strings are colours, arrays directions, numbers numbers)
  function skyMix(a, b, k) {
    const out = {}, keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const key of keys) {
      const va = a[key] ?? SKY_DEFAULTS[key], vb = b[key] ?? SKY_DEFAULTS[key];
      out[key] = typeof va === 'string' ? hexMix(va, vb, k) : Array.isArray(va) ? va.map((x, i) => lerp(x, vb[i], k)) : lerp(va, vb, k);
    }
    return out;
  }
  const SKY_GLSL = `
    uniform vec3 uZen, uHor, uGnd, uSunDir, uSunCol, uHalo, uMoon1Dir, uMoon1Col, uMoon2Dir, uMoon2Col, uCloudCol, uCloudLit;
    uniform float uHorK, uSunSize, uSunGlow, uHaloW, uHaloH, uMilky, uSkyYaw, uMoon1Size, uMoon1Phase, uMoon2Size, uMoon2Phase;
    uniform float uCloud, uCloudScale, uCloudDrift, uExpo, uFogNear, uFogDen, uFogMax, uFogK, uTime, uWind;
    float uh31(vec3 p){ p = fract(p * .1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
    float un3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
      return mix(mix(mix(uh31(i), uh31(i + vec3(1,0,0)), f.x), mix(uh31(i + vec3(0,1,0)), uh31(i + vec3(1,1,0)), f.x), f.y),
                 mix(mix(uh31(i + vec3(0,0,1)), uh31(i + vec3(1,0,1)), f.x), mix(uh31(i + vec3(0,1,1)), uh31(i + vec3(1,1,1)), f.x), f.y), f.z); }
    float ufbm(vec3 p){ float a = .5, s = 0.; for (int i = 0; i < 5; i++){ s += a * un3(p); p *= 2.03; a *= .5; } return s; }
    vec3 skyBase(vec3 d){
      float h = d.y;
      vec3 c = mix(uHor, uZen, pow(clamp(h, 0., 1.), uHorK));
      c = mix(c, uGnd, smoothstep(0., -.12, h));
      vec3 s = uSunDir;
      vec2 dz = normalize(d.xz + 1e-5), sz = normalize(s.xz + 1e-5);
      float az = max(dot(dz, sz), 0.);
      float band = exp(-abs(h - max(s.y, -.05) * .4) / max(uHaloH, 1e-3));
      c += uHalo * pow(az, uHaloW) * band;
      float cs = max(dot(d, s), 0.);
      c += uSunCol * (pow(cs, 6.) * .10 + pow(cs, 60.) * .35 + pow(cs, 600.) * .8) * uSunGlow;
      return c * uExpo;
    }
    float moonDisc(vec3 d, vec3 m, float sz, float ph){
      float a = acos(clamp(dot(d, m), -1., 1.));
      float disc = smoothstep(sz, sz * .85, a);
      vec3 side = normalize(cross(m, vec3(0., 1., 0.)) + 1e-5);
      vec3 m2 = normalize(m + side * sz * ph * 1.6);
      float a2 = acos(clamp(dot(d, m2), -1., 1.));
      return disc * (1. - smoothstep(sz, sz * .85, a2) * step(.001, ph));
    }
    vec3 skyFull(vec3 d){
      vec3 c = skyBase(d);
      float cs = dot(d, uSunDir);
      float ang = acos(clamp(cs, -1., 1.));
      if (uSunSize > 0.) c += uSunCol * smoothstep(uSunSize, uSunSize * .7, ang) * 24. * uExpo;
      float yc = cos(uSkyYaw), ys = sin(uSkyYaw);
      vec3 r = vec3(yc * d.x + ys * d.z, d.y, -ys * d.x + yc * d.z);
      if (uMilky > 0.) {
        vec3 mwN = normalize(vec3(.42, .3, .86));
        float mb = exp(-pow(dot(r, mwN) / .22, 2.));
        float mn = ufbm(r * 5.5), dark = ufbm(r * 11. + 3.);
        c += uMilky * mb * pow(mn, 3.) * smoothstep(.3, .7, dark + .15) * vec3(.30, .36, .62) * .55 * uExpo;
      }
      c += uMoon1Col * moonDisc(d, uMoon1Dir, uMoon1Size, uMoon1Phase) * 3. * uExpo;
      c += uMoon1Col * pow(max(dot(d, uMoon1Dir), 0.), 400.) * .25 * uExpo;
      c += uMoon2Col * moonDisc(d, uMoon2Dir, uMoon2Size, uMoon2Phase) * 3. * uExpo;
      c += uMoon2Col * pow(max(dot(d, uMoon2Dir), 0.), 600.) * .2 * uExpo;
      if (uCloud > 0. && d.y > .005) {
        vec2 uv = d.xz / (d.y + .06) * uCloudScale + vec2(uTime * .012 + uCloudDrift, uTime * .004);
        float n = ufbm(vec3(uv, uTime * .015));
        float cov = smoothstep(.62 - uCloud * .38, .62 - uCloud * .38 + .28, n);
        float lit = pow(max(dot(d, uSunDir), 0.), 5.) * smoothstep(.75, .45, n);
        vec3 cc = mix(uCloudCol, uCloudLit, clamp(lit * 1.6, 0., 1.)) * uExpo;
        c = mix(c, cc, cov * smoothstep(.0, .12, d.y));
      }
      return c;
    }`;
  // the sky dome: follows the camera, drawn first
  const skyMat = new THREE.ShaderMaterial({
    uniforms: U, side: THREE.BackSide, depthWrite: false, depthTest: false,
    vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: SKY_GLSL + `varying vec3 vD;
      float dith(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453) - .5; }
      void main(){ vec3 c = skyFull(normalize(vD)); gl_FragColor = vec4(c + dith(gl_FragCoord.xy) / 255., 1.); }`,
  });
  const skyDome = new THREE.Mesh(new THREE.SphereGeometry(1000, 48, 24), skyMat);
  skyDome.renderOrder = -10; skyDome.frustumCulled = false;
  // stars: real points, crisp at any resolution
  const NSTAR = 5200, sp = new Float32Array(NSTAR * 3), sa = new Float32Array(NSTAR * 2);
  for (let i = 0; i < NSTAR; i++) {
    // more stars near the Milky Way band
    let x, y, z, tries = 0;
    do {
      const u = hash(i * 3.1 + tries) * 2 - 1, th = hash(i * 7.7 + tries * 1.3) * TAU, r = Math.sqrt(1 - u * u);
      x = r * Math.cos(th); y = u; z = r * Math.sin(th); tries++;
      const band = Math.exp(-Math.pow((x * .42 + y * .3 + z * .86) / .25, 2));
      if (hash(i * 13.3 + tries) < .45 + .55 * band) break;
    } while (tries < 6);
    sp.set([x * 900, y * 900, z * 900], i * 3);
    const m = hash(i * 5.3);
    sa.set([Math.pow(m, 6) * 3.2 + .35, hash(i * 9.1) * TAU], i * 2);
  }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); sg.setAttribute('a', new THREE.BufferAttribute(sa, 2));
  const starMat = new THREE.ShaderMaterial({
    uniforms: { uK: { value: 0 }, uTime: { value: 0 }, uYaw: { value: 0 }, uPx: { value: 1 } },
    // drawn in the opaque pass right after the sky dome (renderOrder -9), so every silhouette covers them
    transparent: false, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute vec2 a; uniform float uK, uTime, uYaw, uPx; varying float vB; varying float vW;
      void main(){ float c = cos(uYaw), s = sin(uYaw); vec3 p = vec3(c * position.x - s * position.z, position.y, s * position.x + c * position.z);
        vB = (a.x * 1.4 + .25) * uK * (.72 + .28 * sin(uTime * (1.3 + fract(a.y) * 3.) + a.y * 7.)); vW = fract(a.y * 3.17);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.); gl_PointSize = max(1.5, (2.2 + a.x * 1.3) * uPx); }`,
    fragmentShader: `varying float vB; varying float vW;
      void main(){ vec2 q = gl_PointCoord - .5; float d = length(q); float f = exp(-d * d * 22.);
        vec3 col = mix(vec3(1., .86, .72), vec3(.78, .88, 1.), vW); gl_FragColor = vec4(col * vB * f * 1.6, 1.); }`,
  });
  const stars = new THREE.Points(sg, starMat); stars.renderOrder = -9; stars.frustumCulled = false;
  const skyGroup = new THREE.Group(); skyGroup.add(skyDome, stars);
  function placeSky(camera, px = 1) { skyGroup.position.copy(camera.position); starMat.uniforms.uPx.value = px; }

  // ---------------------------------------------------------------- materials
  const VERT_WPOS = `#include <skinning_vertex>
    vec4 uwp = vec4(transformed, 1.0);
    #ifdef USE_INSTANCING
      uwp = instanceMatrix * uwp;
    #endif
    vWPos = (modelMatrix * uwp).xyz;`;
  const FOG_FRAG = (scale) => `{ vec3 dv = vWPos - cameraPosition; float dd = length(dv); vec3 vd = dv / max(dd, 1e-4);
      float ff = 1.0 - exp(-max(dd - uFogNear, 0.0) * uFogDen);
      gl_FragColor.rgb = mix(gl_FragColor.rgb, skyBase(vd) * uFogK, clamp(ff * ${scale}, 0.0, uFogMax)); }`;
  const matCache = {};
  // o.col (default ink), o.sway (grass), o.side, o.fog (0..1 how much sky fog), o.opacity
  function silMat(o = {}) {
    const key = JSON.stringify(o); if (matCache[key]) return matCache[key];
    const m = new THREE.MeshBasicMaterial({ color: o.col || TOK.ink, side: o.side ?? THREE.FrontSide, transparent: o.opacity != null, opacity: o.opacity ?? 1, depthWrite: o.opacity == null });
    if (o.k) m.color.multiplyScalar(o.k);
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, U);
      let v = 'varying vec3 vWPos;\nuniform float uTime, uWind;\n' + sh.vertexShader.replace('#include <skinning_vertex>', VERT_WPOS);
      if (o.sway) v = v.replace('#include <begin_vertex>', `#include <begin_vertex>
        { vec3 ip = vec3(0.);
          #ifdef USE_INSTANCING
            ip = instanceMatrix[3].xyz;
          #endif
          float hy = max(transformed.y, 0.);
          float sw = sin(uTime * 1.7 + ip.x * .35 + ip.z * .21) * .6 + sin(uTime * 3.1 + ip.z * .55) * .3 + sin(uTime * .6 + ip.x * .05) * .5;
          transformed.x += sw * uWind * hy * hy * ${(o.sway * 1).toFixed(3)}; }`);
      sh.vertexShader = v;
      sh.fragmentShader = 'varying vec3 vWPos;\n' + SKY_GLSL + sh.fragmentShader.replace('#include <fog_fragment>', FOG_FRAG((o.fog ?? 1).toFixed(3)));
    };
    m.customProgramCacheKey = () => 'sil' + key;
    return (matCache[key] = m);
  }
  // emissive light: HDR colour (k > 1 blooms); fog at a third, because light carries through haze
  const litMat = (hex, k = 3, o = {}) => silMat({ ...o, col: hex, k, fog: o.fog ?? .35 });
  // water: reflects the sky with a slight ripple, darker than the sky
  function waterMat(o = {}) {
    const m = new THREE.ShaderMaterial({
      uniforms: { ...U, uDark: { value: o.dark ?? .55 } },
      vertexShader: 'varying vec3 vWPos; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vWPos = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: SKY_GLSL + `uniform float uDark; varying vec3 vWPos;
        void main(){ vec3 v = normalize(vWPos - cameraPosition);
          float rip = (un3(vec3(vWPos.xz * .9, uTime * .6)) - .5) * .06 + (un3(vec3(vWPos.xz * 3.1, uTime * 1.1)) - .5) * .03;
          vec3 r = reflect(v, normalize(vec3(rip, 1., rip * .7)));
          vec3 c = skyFull(r) * uDark;
          float dd = length(vWPos - cameraPosition), ff = 1. - exp(-max(dd - uFogNear, 0.) * uFogDen);
          c = mix(c, skyBase(v) * uFogK, clamp(ff, 0., uFogMax));
          gl_FragColor = vec4(c, 1.); }`,
    });
    return m;
  }

  // ---------------------------------------------------------------- textures
  function canvasTex(n, draw) { const c = document.createElement('canvas'); c.width = c.height = n; draw(c.getContext('2d'), n); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; return t; }
  const glowTex = canvasTex(256, (g, n) => {
    const d = g.createImageData(n, n);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const r = Math.hypot(x - n / 2 + .5, y - n / 2 + .5) / (n / 2), v = Math.max(0, Math.exp(-r * r * 9) * .75 + Math.exp(-r * 3.2) * .25 - .02 * r) * (r < 1 ? 1 : 0);
      const i = (y * n + x) * 4; d.data[i] = d.data[i + 1] = d.data[i + 2] = 255; d.data[i + 3] = Math.round(255 * Math.min(1, v));
    }
    g.putImageData(d, 0, 0);
  });
  const flameTex = canvasTex(128, (g, n) => {
    const d = g.createImageData(n, n);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const u = (x + .5) / n * 2 - 1, v = 1 - (y + .5) / n;              // v: 0 at the base, 1 at the tip
      const w = .55 * Math.pow(Math.max(0, 1 - v), .7) * Math.min(1, v * 6 + .25);
      const a = Math.max(0, 1 - Math.abs(u) / Math.max(w, 1e-3)); const k = Math.pow(a, 1.6) * Math.min(1, (1 - v) * 1.6);
      const i = (y * n + x) * 4; d.data[i] = d.data[i + 1] = d.data[i + 2] = 255; d.data[i + 3] = Math.round(255 * k);
    }
    g.putImageData(d, 0, 0);
  });
  const puffTex = canvasTex(128, (g, n) => {   // a soft smoke or cloud puff
    const d = g.createImageData(n, n);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const r = Math.hypot(x - n / 2, y - n / 2) / (n / 2), nn = fbm2(x * .06, y * .06) * .5 + .5;
      const k = Math.max(0, 1 - r) * (.5 + nn * .8);
      const i = (y * n + x) * 4; d.data[i] = d.data[i + 1] = d.data[i + 2] = 255; d.data[i + 3] = Math.round(255 * Math.min(1, k * k * 1.4));
    }
    g.putImageData(d, 0, 0);
  });

  // ---------------------------------------------------------------- light
  function glow(hex, size = 1, k = 2, tex = glowTex) {
    const m = new THREE.SpriteMaterial({ map: tex, color: C(hex).multiplyScalar(k), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false });
    const s = new THREE.Sprite(m); s.scale.setScalar(size); s.userData.base = { hex, k, size }; return s;
  }
  function setGlow(s, k, size) { s.material.color.set(s.userData.base.hex).multiplyScalar(k); if (size != null) s.scale.setScalar(size); }
  // A fire: core glow, licking flames, rising embers. f.update(t, k) with k = size and strength (0 = out).
  function fire(o = {}) {
    const g = new THREE.Group(), seed = o.seed ?? 1, sc = o.scale ?? 1, NF = 12, NE = o.embers ?? 36;
    const halo = glow(TOK.ember, 6 * sc, 1.2); halo.position.y = .5 * sc;
    const core = glow('#FFB25A', 1.6 * sc, 3); core.position.y = .12 * sc;
    // light thrown on the ground: figures near the fire read as silhouettes against it
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTex, color: C(TOK.ember), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    pool.rotation.x = -Math.PI / 2; pool.position.y = .03; pool.renderOrder = 1;
    g.add(pool, halo, core);
    const flames = [];
    for (let i = 0; i < NF; i++) {
      const m = new THREE.SpriteMaterial({ map: flameTex, color: C(i < 3 ? '#FFD08A' : TOK.ember).multiplyScalar(i < 3 ? 4 : 2.6), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false });
      const s = new THREE.Sprite(m); s.center.set(.5, 0); flames.push(s); g.add(s);
    }
    const ep = new Float32Array(NE * 3), eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.BufferAttribute(ep, 3));
    const ea = new Float32Array(NE); eg.setAttribute('b', new THREE.BufferAttribute(ea, 1));
    const em = new THREE.ShaderMaterial({ uniforms: { uPx: { value: 1 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'attribute float b; varying float vB; uniform float uPx; void main(){ vB = b; vec4 mv = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv; gl_PointSize = clamp(60. / -mv.z, 1., 6.) * uPx; }',
      fragmentShader: 'varying float vB; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(vec3(1., .55, .2) * vB * 4. * exp(-d * d * 18.), 1.); }' });
    const embers = new THREE.Points(eg, em); embers.frustumCulled = false; g.add(embers);
    g.userData.update = (t, k = 1, px = 1) => {
      const fl = .82 + .18 * noise(t * 7 + seed) + .08 * noise(t * 19 + seed * 3);
      g.visible = k > .002;
      const kk = Math.min(1, k), ks = Math.pow(kk, 1.4);
      setGlow(halo, 1.0 * kk * fl, (.8 + 5.2 * ks) * sc); setGlow(core, 2.6 * kk * fl, (.25 + 1.5 * ks) * sc);
      pool.material.color.set(TOK.ember).multiplyScalar(.55 * kk * fl * (o.pool ?? 1)); pool.scale.setScalar((2 + 9 * ks) * sc);
      flames.forEach((s, i) => {
        const ph = hash(i + seed * 10), h = (.45 + .75 * ph) * ks * sc * (.75 + .35 * noise(t * (5 + ph * 4) + i * 3)) * (i >= Math.ceil(NF * (.3 + .7 * kk)) ? 0 : 1);
        s.position.set((ph - .5) * .26 * sc * Math.sqrt(kk), 0, (hash(i * 3 + seed) - .5) * .22 * sc);
        s.scale.set(h * (.38 + .25 * hash(i * 9 + seed)), h, 1); s.material.rotation = noise(t * 3 + i) * .18 + (ph - .5) * .25 - (g.userData.lean || 0) * (.7 + .5 * ph);
      });
      for (let i = 0; i < NE; i++) {
        const ph = hash(i * 1.37 + seed), life = 1.4 + ph * 1.4, a = ((t + ph * 9) / life) % 1, id = Math.floor((t + ph * 9) / life);
        const sx = (hash(id * 3.1 + i) - .5) * .5, sz = (hash(id * 5.7 + i) - .5) * .5;
        ep.set([(sx + noise(t * 1.3 + i) * .35 * a) * sc, (a * (2.2 + ph * 2)) * sc * Math.sqrt(k + .01), (sz + noise(t * 1.1 + i * 2) * .3 * a) * sc], i * 3);
        ea[i] = k * (1 - a) * (a > .03 ? 1 : 0) * (hash(id * 7.3 + i) > .25 ? 1 : 0);
      }
      eg.attributes.position.needsUpdate = eg.attributes.b.needsUpdate = true; em.uniforms.uPx.value = px;
    };
    return g;
  }
  // a burst of sparks from a point at time t0 (all deterministic)
  function sparks(n = 24, seed = 1) {
    const p = new Float32Array(n * 3), b = new Float32Array(n), g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('b', new THREE.BufferAttribute(b, 1));
    const m = new THREE.ShaderMaterial({ uniforms: { uPx: { value: 1 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'attribute float b; varying float vB; uniform float uPx; void main(){ vB = b; vec4 mv = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv; gl_PointSize = clamp(14. / -mv.z, 1.5, 7.) * uPx; }',
      fragmentShader: 'varying float vB; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(vec3(1., .78, .45) * vB * 6. * exp(-d * d * 16.), 1.); }' });
    const pts = new THREE.Points(g, m); pts.frustumCulled = false;
    // hits: list of times; each hit throws all sparks for .35 s
    pts.userData.update = (t, hits, px = 1, scale = 1) => {
      let last = -1; for (const h of hits) if (h <= t) last = h;
      const a = last < 0 ? 9 : t - last;
      for (let i = 0; i < n; i++) {
        const s = hash(i * 1.9 + seed + last * 3.3), th = hash(i * 7.1 + last) * TAU, up = .3 + hash(i * 2.3 + last * 1.1) * 1.4, sp = (1.2 + s * 2.4) * scale;
        const k = Math.min(a, .6);
        p.set([Math.cos(th) * sp * k, (up * sp * k - 4.9 * k * k * .5) * .9, Math.sin(th) * sp * k * .6], i * 3);
        b[i] = a < .5 ? Math.pow(1 - a / .5, 1.5) * (.4 + s) : 0;
      }
      g.attributes.position.needsUpdate = g.attributes.b.needsUpdate = true; m.uniforms.uPx.value = px;
    };
    return pts;
  }

  // ---------------------------------------------------------------- land
  // heightfield terrain centred at (cx, cz); h(x, z) adds to the noise hills
  function terrain(o = {}) {
    const size = o.size ?? 2000, seg = o.seg ?? 160, amp = o.amp ?? 6, fr = o.freq ?? .004, seed = o.seed ?? 0;
    const g = new THREE.PlaneGeometry(size, size, seg, seg); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i) + (o.cx ?? 0), z = p.getZ(i) + (o.cz ?? 0);
      let y = fbm2(x * fr + seed, z * fr - seed) * amp + (o.h ? o.h(x, z) : 0);
      p.setY(i, y + (o.y ?? 0));
    }
    g.translate(o.cx ?? 0, 0, o.cz ?? 0);
    const m = new THREE.Mesh(g, silMat(o.mat || { fog: o.fog ?? .55 })); m.userData.height = (x, z) => fbm2(x * fr + seed, z * fr - seed) * amp + (o.h ? o.h(x, z) : 0) + (o.y ?? 0);
    return m;
  }
  // a far silhouette ridge: a vertical card whose top edge is noise. o: z (distance, negative = ahead), w, h, rough, seed, x
  function ridge(o = {}) {
    const w = o.w ?? 3000, n = o.n ?? 220, sh = new THREE.Shape();
    sh.moveTo(-w / 2, -(o.under ?? 400));
    for (let i = 0; i <= n; i++) {
      const u = i / n, x = -w / 2 + u * w;
      const y = (o.base ?? 0) + (fbm(u * (o.rough ?? 9) + (o.seed ?? 0)) * .5 + .5) * (o.h ?? 60) + (o.shape ? o.shape(u, x) : 0);
      sh.lineTo(x, y);
    }
    sh.lineTo(w / 2, -(o.under ?? 400)); sh.closePath();
    const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), silMat({ side: THREE.DoubleSide }));
    m.position.set(o.x ?? 0, o.y ?? 0, o.z ?? -800); if (o.yaw) m.rotation.y = o.yaw;
    return m;
  }
  // grass: thin blades that sway with the wind. o: area [x0, x1, z0, z1], n, h (height), ground(x, z)
  function grass(o = {}) {
    const [x0, x1, z0, z1] = o.area ?? [-20, 20, -10, 5], n = o.n ?? 3000, h = o.h ?? .7, clear = o.clear ?? [];
    const bg = new THREE.BufferGeometry();
    bg.setAttribute('position', new THREE.Float32BufferAttribute([-.012, 0, 0, .012, 0, 0, 0, 1, 0], 3));
    const im = new THREE.InstancedMesh(bg, silMat({ sway: o.sway ?? .35, side: THREE.DoubleSide }), n);
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler();
    for (let i = 0; i < n; i++) {
      const x = lerp(x0, x1, hash(i * 1.31 + 7)), z = lerp(z0, z1, hash(i * 2.17 + 3));
      let hh = h * (.35 + hash(i * 3.7) * .9) * (o.hmap ? o.hmap(x, z) : 1);
      for (const [cx, cz, r] of clear) { const d = Math.hypot(x - cx, z - cz); if (d < r) hh *= Math.max(0, (d - r * .55) / (r * .45)); }
      E.set((hash(i * 5.1) - .5) * .22, hash(i * 4.3) * TAU, (hash(i * 6.7) - .5) * .22); Q.setFromEuler(E);
      M.compose(new THREE.Vector3(x, o.ground ? o.ground(x, z) : 0, z), Q, new THREE.Vector3(.7 + hash(i) * .7, Math.max(hh, 1e-4), 1));
      im.setMatrixAt(i, M);
    }
    im.frustumCulled = false; return im;
  }
  function water(o = {}) {
    const g = new THREE.PlaneGeometry(o.w ?? 400, o.d ?? 60, 1, 1); g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, waterMat(o)); m.position.set(o.x ?? 0, o.y ?? 0, o.z ?? 0); return m;
  }
  // particles that stream with the wind (snow, rain, dust). o: n, box [w, h, d], dir [x, y, z] m/s, size, col, k
  function streak(o = {}) {
    const n = o.n ?? 1500, [bw, bh, bd] = o.box ?? [40, 20, 30], p = new Float32Array(n * 3), g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    const m = new THREE.ShaderMaterial({ uniforms: { uK: { value: 1 }, uPx: { value: 1 }, uCol: { value: C(o.col ?? '#DDE8FF') } }, transparent: true, depthWrite: false, blending: o.additive === false ? THREE.NormalBlending : THREE.AdditiveBlending,
      vertexShader: `uniform float uPx; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv; gl_PointSize = clamp(${(o.size ?? 9).toFixed(1)} / -mv.z, 1., ${(o.max ?? 5).toFixed(1)}) * uPx; }`,
      fragmentShader: 'uniform float uK; uniform vec3 uCol; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(uCol * uK * exp(-d * d * 14.), 1.); }' });
    const pts = new THREE.Points(g, m); pts.frustumCulled = false;
    const [dx, dy, dz] = o.dir ?? [6, -2, 0];
    pts.userData.update = (t, k = 1, px = 1) => {
      for (let i = 0; i < n; i++) {
        const w = (v, L) => ((v % L) + L) % L - L / 2;
        p.set([w(hash(i * 1.1) * bw + dx * t + noise(t * .7 + i) * .6, bw), w(hash(i * 2.3) * bh + dy * t * (.8 + hash(i) * .4), bh), w(hash(i * 3.7) * bd + dz * t, bd)], i * 3);
      }
      g.attributes.position.needsUpdate = true; m.uniforms.uK.value = k; m.uniforms.uPx.value = px; pts.visible = k > .001;
    };
    return pts;
  }
  // smoke puffs (dark, normal blending) rising from a point. o: n, rise, spread, col, size
  function smoke(o = {}) {
    const g = new THREE.Group(), n = o.n ?? 14, puffs = [];
    for (let i = 0; i < n; i++) {
      const m = new THREE.SpriteMaterial({ map: puffTex, color: C(o.col ?? '#151014'), transparent: true, depthWrite: false, opacity: .8, fog: false });
      const s = new THREE.Sprite(m); puffs.push(s); g.add(s);
    }
    g.userData.update = (t, k = 1) => puffs.forEach((s, i) => {
      const life = o.life ?? 6, a = ((t / life + i / n) % 1), id = Math.floor(t / life + i / n);
      const [wx, wz] = o.wind ?? [3, 0];
      s.position.set(wx * a * life + noise(id + i) * (o.spread ?? 1), a * (o.rise ?? 12), wz * a * life);
      s.scale.setScalar((o.size ?? 3) * (.4 + a * 1.6)); s.material.opacity = k * (o.op ?? .85) * Math.min(1, a * 6) * (1 - a); s.material.rotation = i + a;
    });
    return g;
  }

  // ---------------------------------------------------------------- geometry helpers (all ink unless a material is given)
  const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m || silMat());
  const cyl = (r0, r1, h, m, n = 12) => new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, n), m || silMat());
  const cone = (r, h, m, n = 12) => new THREE.Mesh(new THREE.ConeGeometry(r, h, n), m || silMat());
  const sph = (r, m, n = 16) => new THREE.Mesh(new THREE.SphereGeometry(r, n, Math.max(6, n >> 1)), m || silMat());
  // a rod between two points (spears, poles, ropes, rails)
  function rod(r = .02, m) { const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 6), m || silMat()); c.userData.rod = true; return c; }
  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0), _q = new THREE.Quaternion();
  function setRod(c, a, b) {
    _a.set(...a); _b.set(...b); const d = _b.clone().sub(_a), L = d.length();
    c.position.copy(_a).add(_b).multiplyScalar(.5); c.scale.set(1, Math.max(L, 1e-4), 1);
    c.quaternion.copy(_q.setFromUnitVectors(_up, d.normalize()));
  }
  // a gear outline extruded: teeth, radius, thickness
  function gear(r = 1, teeth = 16, th = .2, m) {
    const s = new THREE.Shape(), n = teeth * 4;
    for (let i = 0; i <= n; i++) { const a = i / n * TAU, rr = (i % 4 < 2) ? r : r * .86; const x = Math.cos(a) * rr, y = Math.sin(a) * rr; i ? s.lineTo(x, y) : s.moveTo(x, y); }
    const hole = new THREE.Path(); hole.absarc(0, 0, r * .25, 0, TAU, true); s.holes.push(hole);
    return new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: th, bevelEnabled: false }), m || silMat());
  }
  // a camera helper: position, look-at point, vertical fov, roll (radians)
  function cam(camera, pos, look, fov = 40, roll = 0) {
    camera.position.set(...pos); camera.up.set(Math.sin(roll), Math.cos(roll), 0); camera.lookAt(...look);
    if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
  }

  // camera with heights above the ground: pos = [x, height above land, z]
  function gcam(camera, land, pos, look, fov = 40, roll = 0) {
    const h = land.userData.height, [x, dy, z] = pos;
    cam(camera, [x, h(x, z) + dy, z], look, fov, roll);
  }
  return { gcam, THREE, T, TAU, clamp, lerp, seg, smooth, ease, easeOut, easeIn, kf, mixv, hash, noise, fbm, n2, fbm2, beatAt, pulse, LINE, B,
    C, TOK, hexMix, sky, skyMix, SKY_DEFAULTS, U, skyGroup, placeSky, SKY_GLSL, silMat, litMat, waterMat, glow, setGlow, fire, sparks,
    terrain, ridge, grass, water, streak, smoke, box, cyl, cone, sph, rod, setRod, gear, cam, glowTex, flameTex, puffTex };
})();
