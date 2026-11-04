// main.js: loads the matchup data and every asset, builds the shots, and exposes the render.mjs contract
// (window.ready, renderAt, renderSheet, gpuInfo, DUR, PROJECT). Open promo.html?t=12.5 in Chrome to look at one time.
import { renderer, reset, frame, loadFonts, loadImage, rasterize, loadClipMeta, makeField, W, H } from './engine.js';
import { build } from './shots.js';

const get = async p => { const r = await fetch(p); if (!r.ok) throw new Error(p + ' ' + r.status); return r.json(); };
const M = await get('src/promo/data/matchup.json'), C = await get('src/promo/data/clips.json');
const MU = await get('src/promo/music.json'), SND = await get('src/promo/sounds.json');
await loadFonts();
makeField();
await Promise.all(Object.keys(C.clips).map(loadClipMeta));
const A = { logoMe: await loadImage('assets/promo/logos/logo_me.png'), logoOpp: await rasterize('assets/promo/logos/logo_opp.svg', 1024), nfl: {}, heads: {},
  credit: SND.music.credit };
const jobs = [];
for (const side of ['me', 'opp']) for (const r of M[side].lineup) {
  for (const t of [r.team, r.opp.replace('@', '')]) if (!A.nfl[t]) { A.nfl[t] = true; jobs.push(loadImage(`assets/promo/nfl/${t}.png`).then(im => { A.nfl[t] = im; })); }
  if (r.id > 0) jobs.push(loadImage(`assets/promo/headshots/${r.id}.png`).then(im => { A.heads[r.id] = im; }, () => {}));
}
await Promise.all(jobs);
const draw = build(M, A, MU);

window.DUR = MU.dur;
window.PROJECT = { audio: `assets/promo/music/${SND.music.file}`, duration: MU.dur };
window.renderAt = async (t, type = 'image/png', q = .92) => { reset(); draw(t); const c = await frame(t); return c.toDataURL(type, q); };
window.renderSheet = async (times, cols = 3, w = 640, crop = null) => {
  const h = Math.round(w * (crop ? crop[3] / crop[2] : H / W)), rows = Math.ceil(times.length / cols);
  const sheet = document.createElement('canvas'); sheet.width = cols * w; sheet.height = rows * (h + 22);
  const g = sheet.getContext('2d'); g.fillStyle = '#111'; g.fillRect(0, 0, sheet.width, sheet.height);
  const ms = [];
  for (let i = 0; i < times.length; i++) {
    const t0 = performance.now(); reset(); draw(times[i]); const c = await frame(times[i]); ms.push(Math.round(performance.now() - t0));
    const x = (i % cols) * w, y = Math.floor(i / cols) * (h + 22);
    if (crop) g.drawImage(c, crop[0], crop[1], crop[2], crop[3], x, y, w, h); else g.drawImage(c, x, y, w, h);
    g.fillStyle = '#ff0'; g.font = '16px sans-serif'; g.fillText(times[i].toFixed(2) + 's', x + 6, y + h + 16);
  }
  return { url: sheet.toDataURL('image/jpeg', .85), ms };
};
window.gpuInfo = () => { const gl = renderer.getContext(), e = gl.getExtension('WEBGL_debug_renderer_info'); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER); };
const q = new URLSearchParams(location.search);
if (!q.has('render')) { document.body.appendChild(renderer.domElement); reset(); draw(+(q.get('t') || 0)); await frame(+(q.get('t') || 0)); }
window.ready = true;
