// engine.js: a broadcast-graphics stage for promo.html. three.js, frames as pure functions of time.
//
// The world is measured in pixels: at z = 0 the camera sees exactly 1920 x 1080 units, centred on the origin
// (x right, y up). Everything on screen is a Card (a textured plane with a grading shader: opacity, tint,
// saturation, contrast, a skewed wipe-on and a light sheen), plus four shared layers that every shot sets:
// the backdrop (gradient, haze, optional split), god rays, a turf field in fog, and drifting particles.
// Post: bloom, then a grade (chromatic edges, vignette, grain, white flash, fade).
//
// Purity: reset() hides every card and puts the shared layers back to neutral before each frame, and shots
// set everything they show from t. Caches hold assets only, never state.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export { THREE };
export const W = 1920, H = 1080, FOV = 30;
export const CAMZ = (H / 2) / Math.tan(FOV / 2 * Math.PI / 180);

// ---------- math ----------
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
export const easeIn = t => Math.pow(clamp(t), 3);
export const ease = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const expoOut = t => (t = clamp(t)) >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
export const expoIn = t => (t = clamp(t)) <= 0 ? 0 : Math.pow(2, 10 * t - 10);
export const backOut = (t, s = 1.7) => { t = clamp(t) - 1; return t * t * ((s + 1) * t + s) + 1; };
export const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
export const noise1 = x => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u) * 2 - 1; };
// a decaying pulse after each time in hits: 1 at the hit, about 0 after `len` seconds
export const pulse = (t, hits, len = .35) => hits.reduce((m, h) => t >= h ? Math.max(m, Math.exp(-(t - h) / (len / 4))) : m, 0);

// ---------- renderer ----------
export const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
const ANISO = renderer.capabilities.getMaxAnisotropy();
export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.FogExp2(0x05070d, 0.00022);
export const camera = new THREE.PerspectiveCamera(FOV, W / H, 10, 40000);
scene.add(camera);

const composer = new EffectComposer(renderer);
composer.setPixelRatio(1);
composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
// threshold 1: only light that stacks past white (glows, rays, flares) blooms; white type stays crisp
export const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), .5, .45, 1.0);
composer.addPass(bloom);
export const grade = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, time: { value: 0 }, flash: { value: 0 }, fade: { value: 0 }, grain: { value: .014 },
    vig: { value: .55 }, ca: { value: .004 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float time, flash, fade, grain, vig, ca; varying vec2 vUv;
    float rnd(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + time * 7.13) * 43758.5453); }
    void main(){
      vec2 d = vUv - .5; float r = length(d); vec2 o = d * ca * (1. + 3. * flash);
      vec3 c = vec3(texture2D(tDiffuse, vUv + o).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - o).b);
      c *= mix(1., smoothstep(.95, .2, r), vig);
      c += (rnd(floor(vUv * vec2(960., 540.))) - .5) * grain;
      c = mix(c, vec3(1.), clamp(flash, 0., 1.));
      gl_FragColor = vec4(c * (1. - fade), 1.);
    }`,
});
composer.addPass(grade);
composer.addPass(new OutputPass());

// ---------- assets ----------
const imgCache = new Map();
export function loadImage(src) {
  if (!imgCache.has(src)) imgCache.set(src, new Promise((ok, bad) => {
    const im = new Image(); im.onload = () => im.decode().then(() => ok(im), () => ok(im)); im.onerror = () => bad(new Error('image ' + src)); im.src = src;
  }));
  return imgCache.get(src);
}
export function texOf(source, mip = true) {
  const t = source instanceof HTMLCanvasElement ? new THREE.CanvasTexture(source) : new THREE.Texture(source);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = ANISO; t.generateMipmaps = mip;
  t.minFilter = mip ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter; t.needsUpdate = true;
  return t;
}
// an SVG (or any image) drawn into a square canvas of `size` px, so a vector logo stays sharp
export async function rasterize(src, size = 1024) {
  const im = await loadImage(src), c = document.createElement('canvas'); c.width = c.height = size;
  const iw = im.naturalWidth || size, ih = im.naturalHeight || size, k = size / Math.max(iw, ih), w = iw * k, h = ih * k;
  c.getContext('2d').drawImage(im, (size - w) / 2, (size - h) / 2, w, h);
  return c;
}

// clip frames: assets/promo/clips/<key>/f0001.jpg ... with meta.json {fps, n, w, h}
export const CLIPS = {};
export async function loadClipMeta(key) {
  CLIPS[key] = await (await fetch(`assets/promo/clips/${key}/meta.json`)).json();
  return CLIPS[key];
}
const frameLRU = new Map();
function clipFrame(key, i) {
  const src = `assets/promo/clips/${key}/f${String(i + 1).padStart(4, '0')}.jpg`;
  if (frameLRU.has(src)) { const p = frameLRU.get(src); frameLRU.delete(src); frameLRU.set(src, p); return p; }
  const p = new Promise((ok, bad) => { const im = new Image(); im.onload = () => im.decode().then(() => ok(im), () => ok(im)); im.onerror = () => bad(new Error(src)); im.src = src; });
  frameLRU.set(src, p);
  while (frameLRU.size > 160) frameLRU.delete(frameLRU.keys().next().value);
  return p;
}

// ---------- cards ----------
const CARD_VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }';
const CARD_FS = `
  uniform sampler2D map; uniform float opacity, sheen, sheenAmt, wipe, wipeDir, sat, contrast, bright, skew; uniform vec3 tint;
  uniform vec4 crop; varying vec2 vUv;
  void main(){
    vec2 uv = crop.xy + vUv * crop.zw;
    vec4 c = texture2D(map, uv);
    float e = (wipeDir > 0. ? vUv.x : 1. - vUv.x) + (vUv.y - .5) * skew;
    float rev = 1. - smoothstep(wipe - .03, wipe, e);
    float l = dot(c.rgb, vec3(.2126, .7152, .0722));
    c.rgb = mix(vec3(l), c.rgb, sat);
    c.rgb = max((c.rgb - .18) * contrast + .18, 0.);
    c.rgb *= tint * bright;
    c.rgb = min(c.rgb + exp(-pow((e - sheen) / .045, 2.)) * sheenAmt * c.a, vec3(1.06));   // a glint, capped so it never blooms over a word
    gl_FragColor = vec4(c.rgb, c.a * opacity * rev);
  }`;
const ALL = [];
const GEO = new THREE.PlaneGeometry(1, 1);
export class Card {
  constructor(tex, w, h, { add = false, parent = scene } = {}) {
    this.tex = tex; this.w = w; this.h = h;
    this.u = { map: { value: tex }, opacity: { value: 1 }, sheen: { value: -1 }, sheenAmt: { value: 0 }, wipe: { value: 2 }, wipeDir: { value: 1 },
      sat: { value: 1 }, contrast: { value: 1 }, bright: { value: 1 }, tint: { value: new THREE.Color(1, 1, 1) }, skew: { value: .18 },
      crop: { value: new THREE.Vector4(0, 0, 1, 1) } };
    this.mat = new THREE.ShaderMaterial({ uniforms: this.u, vertexShader: CARD_VS, fragmentShader: CARD_FS, transparent: true,
      depthWrite: false, depthTest: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending });
    this.mesh = new THREE.Mesh(GEO, this.mat); this.mesh.visible = false; this.mesh.frustumCulled = false;
    parent.add(this.mesh); ALL.push(this);
  }
  // place and grade the card for this frame; every option has a neutral default
  show({ x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1, sx = 1, sy = 1, o = 1, wipe = 2, dir = 1, sheen = -1, sheenAmt = 0,
    tint = null, sat = 1, contrast = 1, bright = 1, order = 10, crop = null, w = null, h = null } = {}) {
    if (o <= 0.001) return this;
    const m = this.mesh; m.visible = true;
    m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
    m.scale.set((w ?? this.w) * s * sx, (h ?? this.h) * s * sy, 1); m.renderOrder = order;
    const u = this.u; u.opacity.value = o; u.wipe.value = wipe; u.wipeDir.value = dir; u.sheen.value = sheen; u.sheenAmt.value = sheenAmt;
    u.sat.value = sat; u.contrast.value = contrast; u.bright.value = bright;
    if (tint) u.tint.value.set(tint); else u.tint.value.setRGB(1, 1, 1);
    if (crop) u.crop.value.set(...crop); else u.crop.value.set(0, 0, 1, 1);
    return this;
  }
}

// a card that plays a clip's frames: setClip queues the frame, frame() awaits every queued load
const pending = [];
export class ClipCard extends Card {
  constructor(key, h) {
    const meta = CLIPS[key], tex = texOf(document.createElement('canvas'), false);
    super(tex, h * meta.w / meta.h, h); this.key = key; this.meta = meta; this.shown = -1;
  }
  // time in the clip (seconds) -> frame; loops by default, or ping-pongs, or holds the last frame
  at(time, { mode = 'loop', speed = 1 } = {}) {
    const n = this.meta.n; let i = Math.floor(Math.max(0, time) * speed * this.meta.fps);
    if (mode === 'loop') i %= n; else if (mode === 'pingpong') { i %= 2 * n - 2; if (i >= n) i = 2 * n - 2 - i; } else i = Math.min(i, n - 1);
    if (i !== this.shown) pending.push(clipFrame(this.key, i).then(im => { this.tex.image = im; this.tex.needsUpdate = true; this.shown = i; }));
    return this;
  }
}

// ---------- 2D drawing into textures ----------
export function canvas(w, h) { const c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h); return c; }
export const FONT = { black: 'BC-BlackItalic', xbold: 'BC-ExtraBoldItalic', boldi: 'BC-BoldItalic', bold: 'BC-Bold', semi: 'BC-SemiBold', med: 'BC-Medium' };
export async function loadFonts() {
  const files = { 'BC-BlackItalic': 'BlackItalic', 'BC-ExtraBoldItalic': 'ExtraBoldItalic', 'BC-BoldItalic': 'BoldItalic',
    'BC-Bold': 'Bold', 'BC-SemiBold': 'SemiBold', 'BC-Medium': 'Medium' };
  for (const [fam, f] of Object.entries(files)) {
    const ff = new FontFace(fam, `url(assets/promo/fonts/BarlowCondensed-${f}.ttf)`); await ff.load(); document.fonts.add(ff);
  }
}
// text -> {tex, w, h} in world px. fill: a colour, or 'chrome' for the metallic broadcast gradient.
// SS = 2 renders the canvas at twice the world size so close-ups stay sharp.
export function textTex(text, { font = FONT.black, size = 120, fill = '#fff', track = 0, stroke = null, strokeW = 0, glow = null, pad = null } = {}) {
  const SS = size >= 150 ? 1.3 : size >= 90 ? 1.6 : 2;
  const probe = canvas(4, 4).getContext('2d'); probe.font = `${size}px "${font}"`; probe.letterSpacing = `${track}px`;
  const m = probe.measureText(text), p = pad ?? size * .28;
  const w = m.width + p * 2, h = size * 1.25 + p * .6;
  const c = canvas(w * SS, h * SS), g = c.getContext('2d');
  g.scale(SS, SS); g.font = `${size}px "${font}"`; g.letterSpacing = `${track}px`; g.textBaseline = 'middle';
  const y = h / 2 + size * .04;
  if (glow) { g.shadowColor = glow; g.shadowBlur = size * .35; }
  if (fill === 'chrome') {
    const gr = g.createLinearGradient(0, y - size * .5, 0, y + size * .5);
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(.48, '#e9edf3'); gr.addColorStop(.52, '#9aa4b4'); gr.addColorStop(1, '#f4f6fa');
    g.fillStyle = gr;
  } else g.fillStyle = fill;
  if (stroke) { g.lineWidth = strokeW; g.strokeStyle = stroke; g.lineJoin = 'round'; g.strokeText(text, p, y); }
  g.fillText(text, p, y);
  return { tex: texOf(c), w, h, text };
}
// a skewed slab (parallelogram) with a soft top highlight
export function slabTex(w, h, color, { skew = .22, hi = .18, edge = null } = {}) {
  const SS = 1.5, c = canvas(w * SS, h * SS), g = c.getContext('2d'); g.scale(SS, SS);
  const k = h * skew;
  g.beginPath(); g.moveTo(k, 0); g.lineTo(w, 0); g.lineTo(w - k, h); g.lineTo(0, h); g.closePath();
  g.fillStyle = color; g.fill();
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, `rgba(255,255,255,${hi})`); gr.addColorStop(.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,.25)');
  g.fillStyle = gr; g.fill();
  if (edge) { g.strokeStyle = edge; g.lineWidth = 3; g.stroke(); }
  return { tex: texOf(c), w, h };
}
// soft radial glow / streak sprites for additive light
export function glowTex(size = 256, { streak = false } = {}) {
  const c = canvas(streak ? size * 4 : size, size), g = c.getContext('2d');
  if (streak) {
    const gr = g.createLinearGradient(0, 0, c.width, 0);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    const gv = g.createLinearGradient(0, 0, 0, size); gv.addColorStop(0, 'rgba(0,0,0,1)'); gv.addColorStop(.5, 'rgba(0,0,0,0)'); gv.addColorStop(1, 'rgba(0,0,0,1)');
    g.fillStyle = gr; g.fillRect(0, 0, c.width, size); g.globalCompositeOperation = 'destination-out'; g.fillStyle = gv; g.fillRect(0, 0, c.width, size);
  } else {
    const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, size, size);
  }
  return texOf(c);
}

// ---------- shared layers ----------
// backdrop: a camera-locked plane far away. Radial gradient a -> b, fbm haze, optional diagonal split L | R.
const BG_FS = `
  uniform vec3 a, b, L, R; uniform vec2 center; uniform float time, haze, split, seam, bright; varying vec2 vUv;
  float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
  float fbm(vec2 p){ float s = 0., k = .5; for (int i = 0; i < 5; i++) { s += k * n(p); p *= 2.03; k *= .5; } return s; }
  void main(){
    vec2 p = (vUv - .5) * vec2(1.7778, 1.);
    float r = length(p - center);
    vec3 c = mix(a, b, smoothstep(0., 1.05, r));
    if (split > 0.) {
      float side = smoothstep(-.004, .004, p.x - (-p.y * .22));
      vec3 lr = mix(L, R, side) * (1.1 - .6 * smoothstep(.0, 1.1, abs(p.x)));
      c = mix(c, lr, split);
      c += seam * exp(-pow((p.x + p.y * .22) / .006, 2.)) * vec3(1.);
      c += seam * .35 * exp(-pow((p.x + p.y * .22) / .05, 2.)) * vec3(1.);
    }
    float f = fbm(p * 2.2 + vec2(time * .05, -time * .02)) * fbm(p * 4.1 - vec2(time * .03, 0.));
    c += haze * f * (b + a + .15);
    gl_FragColor = vec4(c * bright, 1.);
  }`;
const bgU = { a: { value: new THREE.Color() }, b: { value: new THREE.Color() }, L: { value: new THREE.Color() }, R: { value: new THREE.Color() },
  center: { value: new THREE.Vector2() }, time: { value: 0 }, haze: { value: .3 }, split: { value: 0 }, seam: { value: 0 }, bright: { value: 1 } };
const bgMesh = new THREE.Mesh(GEO, new THREE.ShaderMaterial({ uniforms: bgU, vertexShader: CARD_VS, fragmentShader: BG_FS, depthWrite: false, depthTest: false, fog: false }));
bgMesh.position.z = -30000; bgMesh.scale.set(2 * 30000 * Math.tan(FOV / 2 * Math.PI / 180) * W / H * 1.02, 2 * 30000 * Math.tan(FOV / 2 * Math.PI / 180) * 1.02, 1);
bgMesh.renderOrder = -100; bgMesh.frustumCulled = false; camera.add(bgMesh);
export function backdrop({ a = '#0b1530', b = '#020308', center = [0, 0], haze = .3, split = 0, L = '#000', R = '#000', seam = 0, bright = 1, time = 0 } = {}) {
  bgU.a.value.set(a); bgU.b.value.set(b); bgU.center.value.set(...center); bgU.haze.value = haze; bgU.split.value = split;
  bgU.L.value.set(L); bgU.R.value.set(R); bgU.seam.value = seam; bgU.bright.value = bright; bgU.time.value = time;
}

// god rays: a camera-locked additive plane, procedural rays fanning from an origin in screen space
const RAY_FS = `
  uniform vec3 color; uniform vec2 origin; uniform float rot, count, power, amt; varying vec2 vUv;
  void main(){
    vec2 p = (vUv - .5) * vec2(1.7778, 1.) - origin;
    float a = atan(p.y, p.x) + rot, r = length(p);
    float ray = pow(abs(sin(a * count)), power) * .7 + pow(abs(sin(a * count * .5 + 1.3)), power * 3.) * .5;
    float fall = exp(-r * 1.4) * smoothstep(0., .08, r);
    gl_FragColor = vec4(color * ray * fall * amt, 1.);
  }`;
const rayU = { color: { value: new THREE.Color() }, origin: { value: new THREE.Vector2() }, rot: { value: 0 }, count: { value: 9 }, power: { value: 12 }, amt: { value: 0 } };
const rayMesh = new THREE.Mesh(GEO, new THREE.ShaderMaterial({ uniforms: rayU, vertexShader: CARD_VS, fragmentShader: RAY_FS, transparent: true,
  blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, fog: false }));
rayMesh.position.z = -29000; rayMesh.scale.copy(bgMesh.scale).multiplyScalar(29000 / 30000); rayMesh.renderOrder = -90; rayMesh.frustumCulled = false; camera.add(rayMesh);
export function rays({ color = '#ffffff', origin = [0, .62], rot = 0, count = 9, power = 12, amt = 0 } = {}) {
  rayU.color.value.set(color); rayU.origin.value.set(...origin); rayU.rot.value = rot; rayU.count.value = count; rayU.power.value = power; rayU.amt.value = amt;
  rayMesh.visible = amt > 0;
}

// the turf: a floor below the frame, yard lines every 5 yards, numbers every 10, fading into fog
function turfCanvas() {
  const c = canvas(2048, 4096), g = c.getContext('2d');
  g.fillStyle = '#0d1a12'; g.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 20; i++) { g.fillStyle = i % 2 ? 'rgba(255,255,255,.018)' : 'rgba(0,0,0,.08)'; g.fillRect(0, i * c.height / 20, c.width, c.height / 20); }
  g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 10;
  for (let i = 0; i <= 20; i++) { const y = i * c.height / 20; g.beginPath(); g.moveTo(0, y); g.lineTo(c.width, y); g.stroke(); }
  g.lineWidth = 6;
  for (let i = 0; i < 100; i++) { const y = i * c.height / 100; for (const x of [700, 1348]) { g.beginPath(); g.moveTo(x - 18, y); g.lineTo(x + 18, y); g.stroke(); } }
  g.fillStyle = 'rgba(255,255,255,.5)'; g.font = '700 150px "BC-Bold"'; g.textAlign = 'center'; g.textBaseline = 'middle';
  const nums = [10, 20, 30, 40, 50, 40, 30, 20, 10];
  nums.forEach((nm, k) => { const y = (k * 2 + 2) * c.height / 20; for (const x of [260, 1788]) { g.save(); g.translate(x, y); g.rotate(x < 1024 ? Math.PI / 2 : -Math.PI / 2); g.fillText(String(nm), 0, 0); g.restore(); } });
  return c;
}
let fieldMesh = null;
export function makeField() {
  const t = texOf(turfCanvas()); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  fieldMesh = new THREE.Mesh(new THREE.PlaneGeometry(9000, 18000), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 1, fog: true, depthWrite: false }));
  fieldMesh.rotation.x = -Math.PI / 2; fieldMesh.renderOrder = -50; fieldMesh.visible = false; scene.add(fieldMesh);
}
export function field({ y = -700, z = -6000, o = 1, tint = '#ffffff', shift = 0 } = {}) {
  if (!fieldMesh || o <= 0) return;
  fieldMesh.visible = true; fieldMesh.position.set(0, y, z); fieldMesh.material.opacity = o; fieldMesh.material.color.set(tint);
  fieldMesh.material.map.offset.y = shift;
}

// drifting particles (dust in stadium light), positions a pure function of t
const NP = 420, pPos = new Float32Array(NP * 3), pGeo = new THREE.BufferGeometry();
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
const pU = { color: { value: new THREE.Color() }, amt: { value: 0 }, size: { value: 9 } };
const pMesh = new THREE.Points(pGeo, new THREE.ShaderMaterial({ uniforms: pU, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
  vertexShader: 'uniform float size; varying float vA; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.); gl_PointSize = size * 2200. / -mv.z; vA = clamp(2200. / -mv.z, .2, 1.); gl_Position = projectionMatrix * mv; }',
  fragmentShader: 'uniform vec3 color; uniform float amt; varying float vA; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(color * smoothstep(.5, 0., d) * amt * vA, 1.); }' }));
pMesh.frustumCulled = false; pMesh.renderOrder = -40; scene.add(pMesh);
export function particles(t, { color = '#ffffff', amt = 0, speed = 1, size = 9 } = {}) {
  pMesh.visible = amt > 0; if (!pMesh.visible) return;
  pU.color.value.set(color); pU.amt.value = amt; pU.size.value = size;
  for (let i = 0; i < NP; i++) {
    const z = -200 - hash(i * 3.1) * 5000, sp = (.3 + hash(i * 7.7)) * 60 * speed;
    pPos[i * 3] = (hash(i * 1.3) - .5) * 5200 + noise1(t * .3 + i) * 80;
    pPos[i * 3 + 1] = ((hash(i * 2.9) * 3600 + t * sp) % 3600) - 1800;
    pPos[i * 3 + 2] = z;
  }
  pGeo.attributes.position.needsUpdate = true;
}

// ---------- camera ----------
export function cam({ x = 0, y = 0, z = CAMZ, tx = null, ty = null, tz = 0, roll = 0, fov = FOV, shake = 0, t = 0 } = {}) {
  const sx = noise1(t * 23 + 1) * shake * 14, sy = noise1(t * 21 + 7) * shake * 10;
  camera.position.set(x + sx, y + sy, z);
  if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
  camera.lookAt(tx ?? x + sx * .5, ty ?? y + sy * .5, tz);
  camera.rotation.z += roll;
}

// ---------- frame ----------
export function reset() {
  for (const c of ALL) c.mesh.visible = false;
  backdrop(); rays(); particles(0); if (fieldMesh) fieldMesh.visible = false;
  grade.uniforms.flash.value = 0; grade.uniforms.fade.value = 0; bloom.strength = .5;
  cam();
}
export async function frame(t) {
  grade.uniforms.time.value = t;
  if (pending.length) { const p = pending.splice(0); await Promise.all(p); }
  composer.render();
  return renderer.domElement;
}
