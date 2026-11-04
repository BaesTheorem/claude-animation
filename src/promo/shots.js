// shots.js: the matchup promo, cut to the downbeats of the track in music.json.
// build(data, assets) makes every card once and returns the shot list. Each shot is fn(t, lt, dur): t = video time,
// lt = time since the shot started. It sets everything it shows from t (engine.reset() clears the frame first).
import {
  Card, ClipCard, CLIPS, W, H, CAMZ, FONT, clamp, lerp, seg, easeOut, easeIn, ease, expoOut, backOut, noise1, pulse,
  textTex, slabTex, glowTex, texOf, backdrop, rays, field, particles, cam, grade, bloom, camera,
} from './engine.js';

// The cut follows src/promo/music.json: D lists the track's downbeats on the video clock, "shots" gives each shot's
// length in bars (S8 starts on the drop, S14 is the end card), BAR is one bar and DUR the length. build() sets them,
// so a new track or a new pace needs only a new music.json. Shots hold their text for at least a bar after it lands.
export let D = [], BEAT = .5, BAR = 2, DUR = 59;
let BIG = [], CUTS = [], ST = {};

const ME = { c: '#c9b07a', dk: '#241b10', hi: '#f1e3b8', bg: '#4a3a20', glow: '#e8c67a' };   // legion bronze
const OP = { c: '#17a454', dk: '#05230f', hi: '#f2cf3a', bg: '#0c4a27', glow: '#3ee07f' };   // rocket green, gold
const RED = '#e3262f', INK = '#05070d', GRAY = '#9aa4b4';

const up = s => String(s).toUpperCase();
const pct = x => Math.round(x * 100);
const fmt1 = x => (Math.round(x * 10) / 10).toFixed(1);

export function build(M, A, MU) {
  D = MU.D; BEAT = MU.beat; BAR = MU.bar; DUR = MU.dur;
  ST = {}; let bi = MU.first || 0; for (const sh of MU.shots) { ST[sh.id] = D[bi]; bi += sh.bars || 0; }
  BIG = ['S1', 'S3', 'S4', 'S8', 'S11', 'S14'].map(k => ST[k]);
  CUTS = ['S2', 'S5', 'S6', 'S7', 'S9', 'S10', 'S12', 'S13'].map(k => ST[k]).concat([ST.S1 + 2 * BAR]);
  // ---------- card factories ----------
  const txt = (s, o = {}) => { const t = textTex(s, o); return new Card(t.tex, t.w, t.h); };
  const slab = (w, h, color, o = {}) => { const t = slabTex(w, h, color, o); return new Card(t.tex, w, h); };
  const pic = (im, w, o = {}) => new Card(texOf(im), w, w * (im.height || im.width) / im.width, o);
  const glow = (size, o = {}) => new Card(glowTex(256), size, size, { add: true, ...o });
  const streak = (w, h) => new Card(glowTex(256, { streak: true }), w, h, { add: true });
  const clip = (key, h) => new ClipCard(key, h);
  // HUD cards ride on the camera at z = -CAMZ, where 1 unit is 1 screen pixel: no push-in, no shake
  const hudTxt = (s, o = {}) => { const t = textTex(s, o); return new Card(t.tex, t.w, t.h, { parent: camera }); };
  const hudSlab = (w, h, color, o = {}) => { const t = slabTex(w, h, color, o); return new Card(t.tex, w, h, { parent: camera }); };

  const me = M.me, op = M.opp;
  const ROW = side => Object.fromEntries((side === 'me' ? me : op).lineup.map(r => [r.name, r]));
  const meRow = ROW('me'), opRow = ROW('opp');
  const kick = iso => { const d = new Date(iso); return d.toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'America/Chicago' }).toUpperCase().replace(',', '') + ' CT'; };
  const NET = { 'NFL Net': 'NFL NETWORK', 'Prime Video': 'PRIME VIDEO', Fox: 'FOX', CBS: 'CBS', NBC: 'NBC', ESPN: 'ESPN' };
  const game = abbr => M.nfl[abbr];
  const gameLine = (abbr, sep = ' @ ') => { const g = game(abbr); return `${g.away}${sep}${g.home} · ${up(g.venue)} · ${kick(g.date)} · ${NET[g.network] || up(g.network)}`; };

  // ---------- shared pieces ----------
  const flareH = streak(2600, 70), flareGlow = glow(700);
  const bugSlab = hudSlab(150, 46, RED), bugWeek = hudTxt(`WEEK ${M.week}`, { font: FONT.black, size: 30 }), bugLeague = hudTxt(up(M.league), { font: FONT.semi, size: 24, track: 4, fill: '#d7dce4' });
  const labL = txt(up(me.name), { font: FONT.xbold, size: 34, track: 3, fill: ME.c }), labR = txt(up(op.name), { font: FONT.xbold, size: 34, track: 3, fill: OP.c });
  const sideGlowL = glow(1400), sideGlowR = glow(1400);

  function bug(t) {
    if (t < ST.S1 || t >= ST.S8) return;   // the matchup shots carry their own team labels, and their captions reach the corner
    const o = seg(t, ST.S1 + .4, ST.S1 + .8);
    bugSlab.show({ x: 790, y: -490, z: -CAMZ, o: o * .95, order: 90 });
    bugWeek.show({ x: 790, y: -490, z: -CAMZ, o, order: 91 });
    bugLeague.show({ x: 790 - 75 - bugLeague.w / 2 - 6, y: -490, z: -CAMZ, o: o * .8, order: 91 });
  }
  function flash(t) { grade.uniforms.flash.value = Math.max(pulse(t, BIG, .5) * .85, pulse(t, CUTS, .22) * .35); }
  function shake(t) { return pulse(t, BIG, .9) * 1.2 + pulse(t, CUTS, .4) * .4; }
  const sheen = (lt, t0, d = .7) => { const p = seg(lt, t0, t0 + d); return p > 0 && p < 1 ? { sheen: lerp(-.25, 1.35, p), sheenAmt: .45 } : {}; };
  const wipeIn = (lt, t0, d = .3) => lerp(-.1, 1.2, easeOut(seg(lt, t0, t0 + d)));
  // the last `d` seconds of a shot: everything pushes toward the lens and brightens into the cut
  const exitK = (lt, dur, d = .14) => easeIn(seg(lt, dur - d, dur));
  // a slow push over the whole shot, so a long hold still moves; capped so nothing leaves the frame
  const drift = (lt, dur, amt = 100) => amt * ease(clamp(lt / dur));

  // ================= S0: cold open =================
  const s0League = txt(up(M.league), { font: FONT.semi, size: 40, track: 16, fill: '#dfe5ee' });
  const s0Pres = txt('PRESENTS', { font: FONT.med, size: 26, track: 12, fill: GRAY });
  function S0(t, lt, dur) {
    const p = lt / dur, rush = easeIn(seg(lt, 1.1, dur));
    backdrop({ a: '#0b1838', b: '#000000', haze: .22, bright: easeOut(seg(lt, 0, .9)), time: t });
    field({ y: -640, z: -5200, shift: t * .015, o: .55 * easeOut(seg(lt, .2, 1.2)) });
    particles(t, { color: '#9fc3ff', amt: .35 * seg(lt, .2, 1), speed: .6 });
    const g = easeOut(seg(lt, .15, 1.0));
    flareH.show({ y: 0, z: 200, sx: .05 + 1.2 * g + 2 * rush, sy: .5 + rush * 1.5, o: .9 * g, tint: '#9cc4ff', order: 5 });
    flareGlow.show({ y: 0, z: 200, sx: .6 + g * 1.8 + rush * 3, sy: .16 + g * .22 + rush * .9, o: .45 * g, tint: '#bcd6ff', order: 4 });
    s0League.show({ y: -95, z: 300, o: seg(lt, .45, .9) * (1 - rush), s: 1 + p * .04, order: 20 });
    s0Pres.show({ y: -150, z: 300, o: seg(lt, .7, 1.1) * (1 - rush) * .9, order: 20 });
    cam({ y: 30, z: CAMZ + 500 - p * 350 - rush * 900, t });
    bloom.strength = .6 + rush * 1.2;
    grade.uniforms.flash.value = Math.max(grade.uniforms.flash.value, rush * .6);
  }

  // ================= S1: game of the week, #1 vs #2 =================
  const gotw = txt('GAME OF THE WEEK', { fill: 'chrome', size: 200 });
  const gotwSlab = slab(820, 86, RED), gotwSub = txt(`WEEK ${M.week} · ${up(M.league)}`, { font: FONT.xbold, size: 50, track: 2 });
  const n1 = txt('#1', { fill: 'chrome', size: 300 }), n2 = txt('#2', { fill: 'chrome', size: 300 }), vs1 = txt('VS', { font: FONT.black, size: 120, fill: RED });
  const first = op.seed === 1 ? op : me, second = first === op ? me : op;
  const firstC = first === op ? OP : ME, secondC = second === op ? OP : ME;
  const n1lab = txt(up(first.name), { font: FONT.xbold, size: 46, track: 3, fill: firstC.c });
  const n2lab = txt(up(second.name), { font: FONT.xbold, size: 46, track: 3, fill: secondC.c });
  const topTwo = txt('THE TOP TWO SEEDS IN THE LEAGUE', { font: FONT.semi, size: 40, track: 10, fill: '#dfe5ee' });
  const n1glow = glow(900), n2glow = glow(900);
  function S1(t, lt, dur) {
    const b2 = 2 * BAR;
    backdrop({ a: '#13285a', b: '#010207', center: [0, .15], haze: .32, time: t });
    rays({ color: '#8fb6ff', origin: [0, .78], rot: t * .04, amt: .55 - .25 * seg(lt, 0, 2) + .4 * pulse(t, [ST.S1 + b2], .8), count: 11 });
    field({ y: -640, z: -5200, shift: t * .015, o: .5 });
    particles(t, { color: '#cfe0ff', amt: .4 });
    const ex = exitK(lt, dur);
    if (lt < b2) {
      const p = expoOut(seg(lt, 0, .22));
      gotw.show({ y: 70, z: 0, s: lerp(1.55, 1, p) * (1 + lt * .02), o: clamp(lt * 12), ...sheen(lt, .25, .8), order: 30 });
      gotwSlab.show({ y: -78, wipe: wipeIn(lt, .1, .3), order: 28 });
      gotwSub.show({ y: -78, wipe: wipeIn(lt, .18, .3), order: 29 });
      cam({ z: CAMZ - drift(lt, b2, 90), t, shake: shake(t) });
    } else {
      const l = lt - b2, p = expoOut(seg(l, 0, .2)), q = expoOut(seg(l, .18, .38));
      n1.show({ x: -360, y: 70, s: lerp(1.7, 1, p) * (1 + ex * .4), o: clamp(l * 12) * (1 - ex), ...sheen(l, .3, .7), order: 30 });
      n2.show({ x: 360, y: 70, s: lerp(1.7, 1, q) * (1 + ex * .4), o: clamp((l - .18) * 12) * (1 - ex), ...sheen(l, .5, .7), order: 30 });
      vs1.show({ y: 60, s: lerp(2, 1, expoOut(seg(l, .4, .6))), o: seg(l, .4, .5) * (1 - ex), order: 31 });
      n1glow.show({ x: -360, y: 60, z: -50, o: .22 * seg(l, 0, .2), tint: firstC.glow, order: 2 });
      n2glow.show({ x: 360, y: 60, z: -50, o: .22 * seg(l, .18, .4), tint: secondC.glow, order: 2 });
      n1lab.show({ x: -360, y: -120, wipe: wipeIn(l, .25, .3), order: 30 });
      n2lab.show({ x: 360, y: -120, wipe: wipeIn(l, .45, .3), order: 30 });
      topTwo.show({ y: -260, o: seg(l, .9, 1.3) * (1 - ex), order: 30 });
      cam({ z: CAMZ - 60 - drift(l, dur - b2, 110) - ex * 600, t, shake: shake(t) });
    }
  }

  // ================= S2: they meet once =================
  const weeks = [];
  for (let w = 1; w <= M.regular_season_weeks; w++) {
    const hit = M.meetings.includes(w);
    weeks.push({ w, hit, slab: slab(230, 120, hit ? RED : '#1a2232', { edge: hit ? null : 'rgba(255,255,255,.12)' }),
      lab: txt(hit ? `WEEK ${w}` : `WK ${w}`, { font: hit ? FONT.black : FONT.bold, size: hit ? 56 : 44, fill: hit ? '#fff' : '#5d6880' }) });
  }
  const once = txt(M.meetings.length === 1 ? 'ONE MEETING.' : `${M.meetings.length} MEETINGS.`, { fill: 'chrome', size: 170 });
  const noRematch = txt('NO REMATCH IN THE REGULAR SEASON', { font: FONT.semi, size: 40, track: 10, fill: '#dfe5ee' });
  const wkGlow = glow(700);
  function S2(t, lt, dur) {
    const mw = M.meetings[0] || M.week, sp = 270, xOf = w => (w - mw) * sp;
    const pan = ease(seg(lt, 0, .55)), ex = exitK(lt, dur);
    backdrop({ a: '#101c3c', b: '#010207', haze: .3, time: t });
    rays({ color: '#ff6b6b', origin: [0, .1], rot: -t * .05, amt: .45 * seg(lt, .55, .8), count: 13 });
    particles(t, { color: '#ffd0d0', amt: .3 });
    for (const k of weeks) {
      const lit = k.hit ? seg(lt, .55, .75) : 0, s = 1 + lit * .18;
      k.slab.show({ x: xOf(k.w), y: 0, s, bright: k.hit ? .55 + .45 * lit : 1.35, order: 20 });
      k.lab.show({ x: xOf(k.w), y: 0, s, o: k.hit ? .6 + .4 * lit : 1, order: 21 });
    }
    wkGlow.show({ y: 0, z: -20, o: .7 * seg(lt, .55, .8), tint: RED, order: 3 });
    once.show({ y: 230, s: lerp(1.4, 1, expoOut(seg(lt, .6, .8))), o: seg(lt, .6, .68) * (1 - ex), ...sheen(lt, .85, .7), order: 30 });
    noRematch.show({ y: -190, wipe: wipeIn(lt, .8, .35), o: 1 - ex, order: 30 });
    const cx = lerp(xOf(Math.max(1, mw - 6)) - 200, 0, pan);
    cam({ x: cx, y: 40, z: CAMZ * lerp(.78, .95, pan) - ex * 500, tx: cx + lerp(500, 0, pan), ty: 0, roll: lerp(-.06, 0, pan), t, shake: shake(t) });
  }

  // ================= S3 / S4: team intros =================
  function intro(team, C, logoIm, side, extra) {
    // side = +1: logo on the right, name on the left (and the reverse for -1)
    const words = up(team.name).split(/[\s]+/);
    const l1 = words.length > 1 ? words.slice(0, Math.ceil(words.length / 2)).join(' ') : words[0];
    const l2 = words.length > 1 ? words.slice(Math.ceil(words.length / 2)).join(' ') : '';
    const card = {
      logo: pic(logoIm, 560), halo: glow(1300), l1: txt(l1, { fill: 'chrome', size: 190 }), l2: l2 ? txt(l2, { fill: 'chrome', size: 190 }) : null,
      bar: slab(980, 10, C.c, { skew: 2, hi: 0 }),
      stats: extra.stats.map(([big, small]) => ({ slab: slab(290, 150, C.dk, { edge: C.c }), big: txt(big, { font: FONT.black, size: 96, fill: '#fff' }),
        small: txt(small, { font: FONT.semi, size: 22, track: 3, fill: C.hi }) })),
      ribbon: slab(760, 70, C.c), ribbonT: txt(extra.ribbon, { font: FONT.black, size: 46, fill: INK }),
      tag: txt(extra.tag, { font: FONT.semi, size: 30, track: 10, fill: C.hi }),
    };
    return (t, lt, dur) => {
      const ex = exitK(lt, dur);
      backdrop({ a: C.bg, b: '#010101', center: [side * .45, .05], haze: .42, time: t });
      rays({ color: C.glow, origin: [side * .5, .05], rot: t * .05 * side, amt: .5 + .3 * pulse(t, [ST.S3, ST.S4], .8), count: 10, power: 10 });
      particles(t, { color: C.hi, amt: .55, speed: 1.2 });
      const lp = expoOut(seg(lt, 0, .5)), lx = side * 470;
      card.halo.show({ x: lx, y: 20, z: -300, o: .55 * lp, tint: C.glow, order: 2 });
      card.logo.show({ x: lerp(side * 1500, lx, lp), y: 20 + Math.sin(lt * 2.2) * 6, z: lerp(-2200, 0, lp), ry: lerp(-side * 1.1, -side * .16, lp) + Math.sin(lt * .9) * .04,
        s: 1 + ex * .3, o: clamp(lt * 6) * (1 - ex), order: 10 });
      const nx = -side * 360, ny = l2 ? 205 : 140;
      card.tag.show({ x: nx, y: ny + 135, wipe: wipeIn(lt, .1, .35), dir: -side, o: 1 - ex, order: 30 });
      card.l1.show({ x: lerp(nx - side * 300, nx, expoOut(seg(lt, .08, .4))), y: ny, o: seg(lt, .08, .2) * (1 - ex), ...sheen(lt, .45, .8), order: 30 });
      if (card.l2) card.l2.show({ x: lerp(nx - side * 300, nx, expoOut(seg(lt, .16, .48))), y: ny - 165, o: seg(lt, .16, .28) * (1 - ex), ...sheen(lt, .55, .8), order: 30 });
      card.bar.show({ x: nx, y: (l2 ? ny - 165 : ny) - 118, wipe: wipeIn(lt, .3, .4), dir: -side, o: 1 - ex, order: 29 });
      card.stats.forEach((st, k) => {
        const t0 = .5 + k * .45, p = backOut(seg(lt, t0, t0 + .25)), x = nx + (k - (card.stats.length - 1) / 2) * 310, y = -260;
        const o = seg(lt, t0, t0 + .08) * (1 - ex);
        st.slab.show({ x, y, s: lerp(.6, 1, p), o, order: 31 });
        st.big.show({ x, y: y + 18, s: lerp(.6, 1, p), o, order: 32 });
        st.small.show({ x, y: y - 50, o: o * seg(lt, t0 + .1, t0 + .3), order: 32 });
      });
      const r0 = BAR + .05, rp = seg(lt, r0, r0 + .3);
      card.ribbon.show({ x: lx, y: -330, wipe: wipeIn(lt, r0, .3), dir: side, o: 1 - ex, order: 33 });
      card.ribbonT.show({ x: lx, y: -330, wipe: wipeIn(lt, r0 + .08, .3), dir: side, o: (1 - ex) * rp, order: 34 });
      cam({ z: CAMZ - drift(lt, dur, 100) - ex * 700, t, shake: shake(t) });
    };
  }
  const opStreak = op.streak.type === 'WIN' ? `${op.streak.len}-GAME WIN STREAK` : `${op.wins}-${op.losses}`;
  const meStreak = me.streak.type === 'WIN' ? `${me.streak.len} STRAIGHT WINS` : `${me.wins}-${me.losses}`;
  const S3 = intro(op, OP, A.logoOpp, +1, {
    tag: op.seed === 1 ? 'THE #1 SEED' : `SEED #${op.seed}`,
    stats: [[`${op.wins}-${op.losses}`, 'RECORD'], [`#${op.seed}`, 'SEED'], [fmt1(op.pf), op.pf_rank === 1 ? 'PTS · MOST IN LEAGUE' : `PTS · #${op.pf_rank} IN LEAGUE`]],
    ribbon: opStreak,
  });
  const S4 = intro(me, ME, A.logoMe, -1, {
    tag: me.seed === 2 ? 'THE #2 SEED' : `SEED #${me.seed}`,
    stats: [[`${me.wins}-${me.losses}`, 'RECORD'], [`#${me.seed}`, 'SEED'], [`W${me.streak.len}`, 'WIN STREAK']],
    ribbon: `PROJECTED ${fmt1(me.projected)} THIS WEEK`,
  });

  // ================= S5: the bye race =================
  const byeHead = txt('ONLY TWO TEAMS GET A BYE', { fill: 'chrome', size: 130 });
  const ladder = M.standings.slice(0, 6).map(s => {
    const mine = s.name === me.name, theirs = s.name === op.name, C = mine ? ME : theirs ? OP : null;
    return { s, C, slab: slab(1180, 92, C ? C.dk : '#121a2a', { edge: C ? C.c : 'rgba(255,255,255,.10)', skew: .12 }),
      seed: txt(String(s.seed), { font: FONT.black, size: 70, fill: C ? C.c : '#5d6880' }),
      name: txt(up(s.name), { font: FONT.xbold, size: 56, fill: C ? '#fff' : '#aab3c4' }),
      rec: txt(`${s.wins}-${s.losses}`, { font: FONT.black, size: 62, fill: C ? C.hi : '#aab3c4' }) };
  });
  const byeLine = slab(1300, 8, RED, { skew: 0, hi: .4 }), byeLab = txt('BYE LINE', { font: FONT.black, size: 34, fill: RED, track: 6 });
  const packN = M.standings.filter(s => s.seed >= 3 && s.wins === (M.standings[2] || {}).wins && s.losses === (M.standings[2] || {}).losses).length;
  const pack = txt(`${packN} TEAMS AT ${M.standings[2].wins}-${M.standings[2].losses} · ONE LOSS BEHIND`, { font: FONT.black, size: 44, fill: RED, track: 2 });
  const byeGlow = glow(1600);
  function S5(t, lt, dur) {
    const ex = exitK(lt, dur);
    backdrop({ a: '#141c33', b: '#010207', center: [0, -.1], haze: .3, time: t });
    rays({ color: '#ff4a4a', origin: [0, -.05], rot: t * .03, amt: .25 + .25 * seg(lt, .9, 1.4), count: 8 });
    particles(t, { color: '#ffd6d6', amt: .25 });
    byeHead.show({ y: 392, s: lerp(1.3, 1, expoOut(seg(lt, 0, .25))), o: seg(lt, 0, .1) * (1 - ex), ...sheen(lt, .35, .8), order: 30 });
    const y0 = 215, rh = 108;
    ladder.forEach((r, i) => {
      const t0 = .15 + i * .16, p = expoOut(seg(lt, t0, t0 + .35)), y = y0 - i * rh - (i >= 2 ? 40 : 0), x = lerp(1600, 0, p);
      const o = seg(lt, t0, t0 + .1) * (1 - ex);
      r.slab.show({ x, y, o, order: 20 });
      r.seed.show({ x: x - 520, y, o, order: 21 });
      r.name.show({ x: x - 450 + r.name.w / 2, y, o, order: 21 });
      r.rec.show({ x: x + 480, y, o, order: 21 });
    });
    const ly = y0 - 1.5 * rh - 20, lp = seg(lt, 1.3, 1.65);
    byeLine.show({ y: ly, wipe: wipeIn(lt, 1.3, .3), o: 1 - ex, bright: 1 + pulse(t, [ST.S5 + BAR], .6) * 2, order: 25 });
    byeLab.show({ x: -650 - byeLab.w / 2 - 10, y: ly, o: lp * (1 - ex), order: 26 });
    byeGlow.show({ y: ly, z: -40, sy: .18, o: .5 * lp, tint: RED, order: 3 });
    pack.show({ y: y0 - 5 * rh - 40 - 92, wipe: wipeIn(lt, BAR * 1.5, .35), o: 1 - ex, order: 30 });
    cam({ y: lerp(30, -15, ease(seg(lt, 0, dur))), z: CAMZ - 20 - drift(lt, dur, 90) - ex * 600, tx: 0, ty: lerp(25, -25, ease(seg(lt, 0, dur))), t, shake: shake(t) });
  }

  // ================= S6: what the game is worth =================
  const worth = txt('WHAT THIS GAME IS WORTH', { fill: 'chrome', size: 120 });
  const worthSub = txt(`BYE ODDS AFTER WEEK ${M.week}`, { font: FONT.semi, size: 40, track: 12, fill: '#dfe5ee' });
  const foot = txt('SEASON SIMULATION · 4,000 RUNS PER RESULT', { font: FONT.med, size: 26, track: 6, fill: GRAY });
  const swingPanel = (team, C) => ({
    team, C, name: txt(up(team.name), { font: FONT.black, size: 64, fill: '#fff' }), under: slab(720, 8, C.c, { skew: 1, hi: 0 }),
    rows: [['WIN', team.bye_odds.win], ['LOSS', team.bye_odds.loss]].map(([k, v]) => ({ k: txt(k, { font: FONT.black, size: 50, fill: k === 'WIN' ? C.hi : '#ff8b8b' }), v,
      track: slab(470, 54, '#0d1320', { skew: .25, edge: 'rgba(255,255,255,.12)' }), fill: slab(470, 54, k === 'WIN' ? C.c : '#c4373d', { skew: .25 }) })),
    swing: txt(`A ${pct(team.bye_odds.win) - pct(team.bye_odds.loss)}-POINT SWING`, { font: FONT.black, size: 44, fill: INK }), swingSlab: slab(460, 64, C.hi),
  });
  const panels = [swingPanel(me, ME), swingPanel(op, OP)];
  const numCache = new Map();
  const num = (key, s, o) => { const k = key + '|' + s; if (!numCache.has(k)) numCache.set(k, txt(s, o)); return numCache.get(k); };
  function S6(t, lt, dur) {
    const ex = exitK(lt, dur);
    backdrop({ split: 1, L: ME.bg, R: OP.bg, a: '#0b1530', b: '#010207', seam: .5, haze: .3, time: t });
    rays({ color: '#ffffff', origin: [0, .7], rot: t * .03, amt: .22, count: 12 });
    particles(t, { color: '#ffffff', amt: .25 });
    worth.show({ y: 420, s: lerp(1.3, 1, expoOut(seg(lt, 0, .25))), o: seg(lt, 0, .1) * (1 - ex), ...sheen(lt, .3, .8), order: 30 });
    worthSub.show({ y: 330, wipe: wipeIn(lt, .15, .35), o: 1 - ex, order: 30 });
    panels.forEach((pn, k) => {
      const side = k ? 1 : -1, cx = side * 470, pin = expoOut(seg(lt, .1 + k * .1, .5 + k * .1)), x0 = lerp(side * 1300, cx, pin);
      pn.name.show({ x: x0, y: 200, o: 1 - ex, order: 30 });
      pn.under.show({ x: x0, y: 150, wipe: wipeIn(lt, .3, .3), o: 1 - ex, order: 30 });
      pn.rows.forEach((r, j) => {
        const y = 60 - j * 120, t0 = .6 + j * BAR * .8, f = easeOut(seg(lt, t0, t0 + .8)), val = r.v * f;
        r.k.show({ x: x0 - 290, y, o: seg(lt, t0 - .2, t0) * (1 - ex), order: 31 });
        r.track.show({ x: x0 + 10, y, o: seg(lt, t0 - .2, t0) * (1 - ex), order: 30 });
        r.fill.show({ x: x0 + 10, y, wipe: lerp(-.05, 1.05, clamp(val)), o: (1 - ex) * seg(lt, t0, t0 + .05), bright: 1 + .6 * pulse(lt, [t0 + .7], .5), order: 31 });
        const n = num(`pct-${k}-${j}`, `${Math.round(val * 100)}%`, { font: FONT.black, size: 60, fill: '#fff' });
        n.show({ x: x0 + 330, y, o: seg(lt, t0, t0 + .05) * (1 - ex), order: 32 });
      });
      const s0 = BAR * 2 + .1, sp = backOut(seg(lt, s0, s0 + .3));
      pn.swingSlab.show({ x: x0, y: -230, s: lerp(.5, 1, sp), o: seg(lt, s0, s0 + .06) * (1 - ex), order: 31 });
      pn.swing.show({ x: x0, y: -230, s: lerp(.5, 1, sp), o: seg(lt, s0, s0 + .06) * (1 - ex), order: 32 });
    });
    foot.show({ y: -400, o: seg(lt, 1, 1.4) * .9 * (1 - ex), order: 30 });
    cam({ z: CAMZ - drift(lt, dur, 90) - ex * 600, t, shake: shake(t) });
  }

  // ================= S7: same games, opposite sides =================
  const five = txt(`${M.shared_games.length === 5 ? 'FIVE' : M.shared_games.length} NFL GAMES.`, { fill: 'chrome', size: 170 });
  const both = txt('BOTH ROSTERS.', { font: FONT.black, size: 170, fill: '#fff' }), bothSlab = slab(1250, 190, RED);
  const pairs = M.shared_games.map(g => ({ a: pic(A.nfl[g.away], 150), b: pic(A.nfl[g.home], 150), at: txt('@', { font: FONT.black, size: 50, fill: GRAY }) }));
  function S7(t, lt, dur) {
    const rush = easeIn(seg(lt, dur - 1.1, dur)), build = seg(lt, BAR, dur);
    backdrop({ a: '#1a0b10', b: '#000000', haze: .35, time: t, bright: 1 + rush });
    rays({ color: '#ff5a5a', origin: [0, 0], rot: t * (.08 + .3 * build), amt: .25 + .3 * build + rush * 1.2, count: 14, power: 14 });
    particles(t, { color: '#ffffff', amt: .4 + rush, speed: 1 + build * 2 + rush * 8 });
    five.show({ y: 250, s: lerp(1.5, 1, expoOut(seg(lt, 0, .2))) * (1 + rush * .3), o: seg(lt, 0, .06), ...sheen(lt, .2, .6), order: 30 });
    if (lt >= BAR) {
      const l = lt - BAR;
      bothSlab.show({ y: 40, s: lerp(1.3, 1, expoOut(seg(l, 0, .15))) * (1 + rush * .3), order: 29 });
      both.show({ y: 40, s: lerp(1.6, 1, expoOut(seg(l, 0, .15))) * (1 + rush * .3), order: 30 });
    }
    const n = pairs.length, first = BAR * 2, step = (dur - 1.1 - first) / n;
    pairs.forEach((pr, k) => {
      const t0 = first + k * step, on = seg(lt, t0, t0 + .06), x = (k - (n - 1) / 2) * 360, y = -300;
      const pop = 1 + .25 * pulse(lt, [t0], .3);
      pr.a.show({ x: x - 90, y, s: pop, o: on, order: 20 });
      pr.b.show({ x: x + 90, y, s: pop, o: on, order: 20 });
      pr.at.show({ x, y: y - 5, o: on * .8, order: 20 });
    });
    cam({ z: CAMZ - rush * 1100, t, shake: .3 + rush * 1.5 });
    bloom.strength = .6 + rush * 1.3;
  }

  // ================= S8 to S11: same game, opposite sides =================
  const plate = (r, C, w = 620) => ({
    slab: slab(w, 82, C.c), name: txt(up(r.name), { font: FONT.black, size: Math.min(60, (w - 70) / (up(r.name).length * .5)), fill: INK }),
    sub: slab(w - 60, 52, C.dk, { edge: C.c }),
    line: txt(`${r.pos} · ${r.team} · PROJ ${fmt1(r.proj)}`, { font: FONT.semi, size: 32, track: 4, fill: C.hi }),
    q: r.status === 'Q' ? { slab: slab(260, 50, RED), t: txt('QUESTIONABLE', { font: FONT.black, size: 34, fill: '#fff', track: 2 }) } : null,
  });
  // one player on a side: a clip (or a logo card for a D/ST) and the nameplate under it
  const fighter = (r, C, key, h, im = null, mode = 'loop') => {
    const media = key ? clip(key, h) : pic(im, h * (im.width / im.height));
    const frame = key ? slab(media.w + 16, media.h + 16, C.c, { skew: 0, hi: .1 }) : slab(media.w + 16, media.h + 16, C.dk, { skew: 0, hi: .25, edge: C.c });
    return { r, C, media, frame, plate: plate(r, C, clamp(media.w + 30, 380, 640)), halo: glow(1100), key, mode };
  };
  function showFighter(f, lt, { x, y, side, t0 = 0, scale = 1, z = 0, ex = 0, dim = 1, plateOn = 1 }) {
    const p = expoOut(seg(lt, t0, t0 + .38)), xx = lerp(side * 1700, x, p), ry = lerp(-side * .7, -side * .12, p) + Math.sin(lt * .8) * .02;
    const o = seg(lt, t0, t0 + .08) * (1 - ex);
    f.halo.show({ x: xx, y, z: z - 200, o: .35 * o * dim, tint: f.C.glow, order: 3 });
    f.frame.show({ x: xx, y, z: z - 1, ry, s: scale, o, bright: 1 + pulse(lt, [t0 + .38], .4), order: 14 });
    if (f.key) f.media.at(lt - t0, { mode: f.mode });
    f.media.show({ x: xx, y, z, ry, s: scale, o, contrast: 1.12, sat: 1.05, bright: dim, order: 15 });
    const py = y - (f.media.h * scale) / 2 - 62, po = o * plateOn;
    f.plate.slab.show({ x: xx, y: py, wipe: wipeIn(lt, t0 + .2, .3), dir: -side, o: po, order: 20 });
    f.plate.name.show({ x: xx, y: py, wipe: wipeIn(lt, t0 + .28, .3), dir: -side, o: po, order: 21 });
    f.plate.sub.show({ x: xx, y: py - 70, wipe: wipeIn(lt, t0 + .34, .3), dir: -side, o: po, order: 20 });
    f.plate.line.show({ x: xx, y: py - 70, o: po * seg(lt, t0 + .45, t0 + .6), order: 21 });
    if (f.plate.q) {
      const qp = backOut(seg(lt, t0 + .7, t0 + .95));
      f.plate.q.slab.show({ x: xx + side * -(f.media.w * scale / 2 - 100), y: y + (f.media.h * scale) / 2 + 10, s: qp, rz: .05 * side, o: po, order: 22 });
      f.plate.q.t.show({ x: xx + side * -(f.media.w * scale / 2 - 100), y: y + (f.media.h * scale) / 2 + 10, s: qp, rz: .05 * side, o: po * (Math.sin(lt * 12) > -.6 ? 1 : .55), order: 23 });
    }
  }
  function battle(spec) {
    const title = txt(spec.title, { fill: 'chrome', size: 112 });
    const info = txt(spec.info, { font: FONT.semi, size: 32, track: 5, fill: '#fff' }), infoSlab = slab(Math.max(info.w + 80, 900), 56, RED);
    const tag = spec.tag ? txt(spec.tag, { font: FONT.black, size: 58, fill: '#fff' }) : null, tagSlab = spec.tag ? slab(tag.w + 70, 92, INK, { edge: '#ffffff' }) : null;
    const L = spec.left.map(([r, key, h, im, mode]) => fighter(r, ME, key, h, im, mode)), R = spec.right.map(([r, key, h, im, mode]) => fighter(r, OP, key, h, im, mode));
    const center = spec.center ? clip(spec.center.key, spec.center.h) : null, cframe = center ? slab(center.w + 18, center.h + 18, '#ffffff', { skew: 0, hi: 0 }) : null;
    const nfl = spec.logos ? spec.logos.map(im => pic(im, 220)) : [];
    return (t, lt, dur) => {
      const ex = exitK(lt, dur), b2 = BAR, second = lt >= b2;
      backdrop({ split: 1, L: ME.bg, R: OP.bg, a: '#0b1530', b: '#010207', seam: .55 + pulse(t, [ST.S8, ST.S11], .6) * 2, haze: .35, time: t });
      rays({ color: '#ffffff', origin: [0, .62], rot: t * .05, amt: .16 + .3 * pulse(t, BIG, .9), count: 12 });
      particles(t, { color: '#ffffff', amt: .3, speed: 1.4 });
      nfl.forEach((n, k) => n.show({ x: (k ? 1 : -1) * 600, y: 40, z: -900, o: .16 * (1 - ex), s: 2.4, order: 1, sat: 0 }));
      labL.show({ x: -900 + labL.w / 2, y: 452, wipe: wipeIn(lt, .1, .3), o: 1 - ex, order: 40 });
      labR.show({ x: 900 - labR.w / 2, y: 452, wipe: wipeIn(lt, .1, .3), dir: -1, o: 1 - ex, order: 40 });
      title.show({ y: 405, s: lerp(1.45, 1, expoOut(seg(lt, 0, .22))), o: seg(lt, 0, .08) * (1 - ex), ...sheen(lt, .3, .8), order: 40 });
      infoSlab.show({ y: 318, wipe: wipeIn(lt, .12, .35), o: 1 - ex, order: 39 });
      info.show({ y: 318, wipe: wipeIn(lt, .2, .35), o: 1 - ex, order: 40 });
      const push = center && second ? expoOut(seg(lt, b2, b2 + .35)) : 0;
      // one player sits at x = +-470; several pack outward from the seam, 30 px apart
      const layout = (arr, side) => arr.forEach((f, k) => {
        const slot = g => Math.max(g.media.w, g.plate.slab.w), n = arr.length, inner = 40 + arr.slice(0, k).reduce((a, g) => a + slot(g) + 30, 0);
        const x = side * (n > 1 ? inner + slot(f) / 2 : 470), y = n > 1 ? 10 : 30;
        showFighter(f, lt, { x: lerp(x, x + side * 160, push), y, side, t0: .05 + k * .14 + (side > 0 ? .1 : 0), scale: lerp(1, .78, push),
          z: -push * 300, ex, dim: lerp(1, .55, push), plateOn: 1 - push });
      });
      layout(L, -1); layout(R, 1);
      if (center && second) {
        const l = lt - b2, p = expoOut(seg(l, 0, .3));
        cframe.show({ y: 20, z: 200, s: lerp(1.6, 1, p), o: seg(l, 0, .06) * (1 - ex), order: 44 });
        center.at(l, { mode: 'loop' }).show({ y: 20, z: 200, s: lerp(1.6, 1, p), o: seg(l, 0, .06) * (1 - ex), contrast: 1.1, order: 45 });
      }
      if (tag && second) {
        const l = lt - b2, ty = center ? -305 : -440;
        tagSlab.show({ y: ty, s: lerp(1.3, 1, expoOut(seg(l, .25, .45))), o: seg(l, .25, .3) * (1 - ex), order: 46 });
        tag.show({ y: ty, s: lerp(1.3, 1, expoOut(seg(l, .25, .45))), o: seg(l, .25, .3) * (1 - ex), ...sheen(l, .5, .7), order: 47 });
      }
      cam({ z: CAMZ - drift(lt, dur, 90) - ex * 650, t, shake: shake(t) });
    };
  }
  const R_ = (side, name) => (side === 'me' ? meRow : opRow)[name];
  const mPlayers = M.shared_games.map(g => ({ g, me: g.me.map(n => meRow[n]), opp: g.opp.map(n => opRow[n]) }));
  const findGame = name => mPlayers.find(x => x.me.some(r => r.name === name) || x.opp.some(r => r.name === name));
  const venueTitle = g => (g.country && g.country !== 'USA' ? `LIVE FROM ${up(g.city)}` : null);
  // the copy is a neutral broadcaster's: teams by name, never "we" or "our"
  const poss = n => (n.endsWith('S') ? `${n}'` : `${n}'S`);

  const gCin = findGame("Ja'Marr Chase"), gKC = findGame('Kenneth Walker III'), gMia = findGame('Jahmyr Gibbs'), gGB = findGame('Christian Watson');
  const S8 = battle({
    title: venueTitle(gCin.g) || 'THE BENGALS, SPLIT', info: gameLine(gCin.g.home, ' vs '), logos: [A.nfl[gCin.g.away], A.nfl[gCin.g.home]],
    left: [[R_('me', "Ja'Marr Chase"), 'chase_dance', 460]], right: [[R_('opp', 'Joe Burrow'), 'burrow_point', 400]],
    center: { key: 'chase_burrow', h: 400 }, tag: 'BURROW THROWS. CHASE CATCHES. BOTH TEAMS SCORE.',
  });
  const S9 = battle({
    title: 'TWO DOLPHINS. ONE LION.', info: gameLine(gMia.g.home), logos: [A.nfl[gMia.g.home], A.nfl[gMia.g.away]],
    left: [[R_('me', 'Ollie Gordon II'), 'gordon_fire', 250, null, 'hold'], [R_('me', 'Malik Washington'), 'washington_fire', 250, null, 'hold']],
    right: [[R_('opp', 'Jahmyr Gibbs'), 'gibbs_td', 420]],
    tag: `GIBBS: ${fmt1(R_('opp', 'Jahmyr Gibbs').proj)} PROJECTED · THE MATCHUP'S HIGHEST`,
  });
  const S10 = battle({
    title: 'ARROWHEAD, SPLIT', info: gameLine(gKC.g.home), logos: [A.nfl[gKC.g.home], A.nfl[gKC.g.away]],
    left: [[R_('me', 'Kenneth Walker III'), null, 400, A.heads[R_('me', 'Kenneth Walker III').id]]], right: [[R_('opp', 'Rashee Rice'), 'rice_celebrate', 400]],
    tag: 'ONE CHIEFS OFFENSE. TWO SIDES.',
  });
  const S11 = battle({
    title: 'FOXBOROUGH', info: gameLine(gGB.g.home), logos: [A.nfl[gGB.g.away], A.nfl[gGB.g.home]],
    left: [[R_('me', 'Christian Watson'), 'watson_td', 420]],
    right: [[R_('opp', 'Tucker Kraft'), 'kraft_leap', 225], [R_('opp', 'Patriots D/ST'), null, 200, A.nfl.NE]],
    tag: `${poss(up(op.name))} DEFENSE VS. ${poss(up(me.name))} RECEIVER`,
  });

  // ================= S12: the lineups =================
  const lineHead = txt('THE LINEUPS', { fill: 'chrome', size: 120 });
  const slots = ['QB', 'RB', 'RB', 'WR', 'WR', 'TE', 'FLEX', 'D/ST', 'K'];
  const starters = side => (side === 'me' ? me : op).lineup.filter(r => r.slot !== 'BE' && r.slot !== 'IR');
  const rowCards = (side, C) => starters(side).map(r => {
    const dst = r.pos === 'D/ST', im = dst ? A.nfl[r.team] : A.heads[r.id];
    return { r, slab: slab(820, 74, C.dk, { skew: .1, edge: 'rgba(255,255,255,.10)' }), slot: txt(r.slot, { font: FONT.black, size: 34, fill: C.c }),
      face: im ? pic(im, dst ? 64 : 98) : null, name: txt(up(r.name), { font: FONT.xbold, size: 40, fill: '#fff' }),
      team: txt(`${r.team} ${r.opp}`, { font: FONT.semi, size: 26, track: 2, fill: GRAY }), proj: txt(fmt1(r.proj), { font: FONT.black, size: 46, fill: C.hi }) };
  });
  const rowsMe = rowCards('me', ME), rowsOp = rowCards('opp', OP);
  const totMe = txt(fmt1(me.projected), { font: FONT.black, size: 120, fill: ME.c }), totOp = txt(fmt1(op.projected), { font: FONT.black, size: 120, fill: OP.c });
  const projLab = txt('PROJECTED', { font: FONT.semi, size: 32, track: 12, fill: '#dfe5ee' });
  function S12(t, lt, dur) {
    const ex = exitK(lt, dur);
    backdrop({ split: 1, L: ME.bg, R: OP.bg, a: '#0b1530', b: '#010207', seam: .4, haze: .25, time: t, bright: .8 });
    particles(t, { color: '#ffffff', amt: .2 });
    lineHead.show({ y: 470, s: lerp(1.3, 1, expoOut(seg(lt, 0, .2))), o: seg(lt, 0, .08) * (1 - ex), ...sheen(lt, .25, .7), order: 40 });
    labL.show({ x: -470, y: 395, o: seg(lt, .1, .3) * (1 - ex), order: 40 });
    labR.show({ x: 470, y: 395, o: seg(lt, .1, .3) * (1 - ex), order: 40 });
    const rh = 80, y0 = 325;
    [[rowsMe, -1], [rowsOp, 1]].forEach(([rows, side]) => rows.forEach((c, i) => {
      const t0 = .15 + i * .14 + (side > 0 ? .07 : 0), p = expoOut(seg(lt, t0, t0 + .32)), cx = side * 470, x = lerp(side * 1500, cx, p), y = y0 - i * rh;
      const o = seg(lt, t0, t0 + .06) * (1 - ex);
      c.slab.show({ x, y, o, order: 20 });
      c.slot.show({ x: x - 360, y, o, order: 21 });
      if (c.face) c.face.show({ x: x - 270, y: y + (c.r.pos === 'D/ST' ? 0 : 6), o, order: 22, crop: c.r.pos === 'D/ST' ? null : [0.18, 0.28, 0.64, 0.72], h: c.r.pos === 'D/ST' ? 64 : 70, w: c.r.pos === 'D/ST' ? 64 : 70 * (0.64 * 1200) / (0.72 * 873) });
      c.name.show({ x: x - 205 + c.name.w / 2, y: y + 9, o, order: 21 });
      c.team.show({ x: x - 205 + c.team.w / 2, y: y - 23, o: o * .9, order: 21 });
      c.proj.show({ x: x + 345, y, o, order: 21 });
    }));
    const t1 = BAR * 1.5, tp = expoOut(seg(lt, t1, t1 + .3));
    totMe.show({ x: -470, y: -440, s: lerp(1.6, 1, tp), o: seg(lt, t1, t1 + .06) * (1 - ex), ...sheen(lt, t1 + .3, .6), order: 40 });
    totOp.show({ x: 470, y: -440, s: lerp(1.6, 1, tp), o: seg(lt, t1, t1 + .06) * (1 - ex), ...sheen(lt, t1 + .4, .6), order: 40 });
    projLab.show({ y: -440, o: seg(lt, t1 + .1, t1 + .3) * (1 - ex), order: 40 });
    cam({ z: CAMZ + 60 - drift(lt, dur, 80) - ex * 600, t, shake: shake(t) * .5 });
  }

  // ================= S13: win probability =================
  const wpHead = txt('WIN PROBABILITY', { fill: 'chrome', size: 130 });
  const wpMe = pct(M.win.me), wpOp = 100 - wpMe;
  const barMe = slab(1500, 110, ME.c, { skew: 0 }), barOp = slab(1500, 110, OP.c, { skew: 0 }), barEdge = slab(14, 150, '#ffffff', { skew: 0, hi: 0 });
  const wpNameMe = txt(up(me.name), { font: FONT.black, size: 56, fill: ME.c }), wpNameOp = txt(up(op.name), { font: FONT.black, size: 56, fill: OP.c });
  const wpFoot = txt('LINEUP MODEL · ESPN PROJECTIONS BLENDED WITH THE BETTING MARKET', { font: FONT.med, size: 26, track: 5, fill: GRAY });
  function S13(t, lt, dur) {
    const ex = exitK(lt, dur, .1), f = easeOut(seg(lt, .2, 1.5)), split = lerp(.5, wpMe / 100, f);
    backdrop({ split: 1, L: ME.bg, R: OP.bg, a: '#0b1530', b: '#010207', seam: .4, haze: .3, time: t });
    rays({ color: '#ffffff', origin: [0, .65], rot: t * .04, amt: .3, count: 12 });
    particles(t, { color: '#ffffff', amt: .3 });
    wpHead.show({ y: 330, s: lerp(1.35, 1, expoOut(seg(lt, 0, .2))), o: seg(lt, 0, .08) * (1 - ex), ...sheen(lt, .3, .7), order: 40 });
    const bx = -750, bw = 1500, sx = bx + split * bw;
    barMe.show({ x: bx + split * bw / 2, y: -40, w: split * bw, o: 1 - ex, order: 20, crop: [0, 0, split, 1] });
    barOp.show({ x: sx + (1 - split) * bw / 2, y: -40, w: (1 - split) * bw, o: 1 - ex, order: 20, crop: [split, 0, 1 - split, 1] });
    barEdge.show({ x: sx, y: -40, o: 1 - ex, bright: 1.5, order: 21 });
    const nm = num('wp', `${Math.round(lerp(50, wpMe, f))}%`, { font: FONT.black, size: 190, fill: ME.c }), no = num('wpo', `${Math.round(lerp(50, wpOp, f))}%`, { font: FONT.black, size: 190, fill: OP.c });
    nm.show({ x: -520, y: 140, o: 1 - ex, order: 30 }); no.show({ x: 520, y: 140, o: 1 - ex, order: 30 });
    wpNameMe.show({ x: -750 + wpNameMe.w / 2 - 20, y: -150, wipe: wipeIn(lt, .2, .3), o: 1 - ex, order: 30 });
    wpNameOp.show({ x: 750 - wpNameOp.w / 2 + 20, y: -150, wipe: wipeIn(lt, .25, .3), dir: -1, o: 1 - ex, order: 30 });
    wpFoot.show({ y: -330, o: seg(lt, .6, 1) * .9 * (1 - ex), order: 30 });
    cam({ z: CAMZ - drift(lt, dur, 80) - ex * 500, t, shake: shake(t) });
  }

  // ================= S14: the lockup =================
  const endLogoMe = pic(A.logoMe, 430), endLogoOp = pic(A.logoOpp, 470), endHaloMe = glow(1300), endHaloOp = glow(1300);
  const endVs = txt('VS', { fill: 'chrome', size: 170 });
  const endNameMe = txt(up(me.name), { font: FONT.black, size: 66, fill: '#fff' }), endNameOp = txt(up(op.name), { font: FONT.black, size: 66, fill: '#fff' });
  const endRecMe = txt(`${me.wins}-${me.losses} · SEED #${me.seed}`, { font: FONT.semi, size: 36, track: 6, fill: ME.c }), endRecOp = txt(`${op.wins}-${op.losses} · SEED #${op.seed}`, { font: FONT.semi, size: 36, track: 6, fill: OP.c });
  const endWeek = txt(`WEEK ${M.week}`, { fill: 'chrome', size: 150 }), endLeague = txt(up(M.league), { font: FONT.semi, size: 34, track: 16, fill: '#dfe5ee' });
  const fk = M.first_kickoff, fkDate = new Date(fk.kickoff);
  const fkDay = fkDate.toLocaleString('en-US', { weekday: 'long', timeZone: 'America/Chicago' }).toUpperCase();
  const fkTime = fkDate.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Chicago' }).toUpperCase();
  const kickT = txt(`KICKOFF ${fkDay} ${fkTime} CT`, { font: FONT.black, size: 64, fill: '#fff' }), kickSlab = slab(kickT.w + 90, 100, RED);
  const kickSub = txt(`${up(fk.name)} ${fk.opp.startsWith('@') ? '@ ' + fk.opp.slice(1) : 'vs ' + fk.opp} · ${up(fk.network || '')}`, { font: FONT.semi, size: 32, track: 6, fill: '#dfe5ee' });
  const credit1 = hudTxt(`Music: ${A.credit}`, { font: FONT.med, size: 26, fill: GRAY });
  const credit2 = hudTxt('Sound effects: freesound.org (CC0)', { font: FONT.med, size: 22, fill: '#6d7789' });
  function S14(t, lt, dur) {
    const p = expoOut(seg(lt, 0, .55)), fade = seg(lt, dur - 2.4, dur - .3);
    backdrop({ split: .8, L: ME.bg, R: OP.bg, a: '#0b1530', b: '#010207', seam: .35, haze: .4, time: t });
    rays({ color: '#ffffff', origin: [0, .78], rot: t * .03, amt: .45 - .2 * seg(lt, 0, 4), count: 11 });
    field({ y: -640, z: -5200, shift: t * .01, o: .45 });
    particles(t, { color: '#ffe9c0', amt: .5, speed: .8 });
    const dx = 0;
    endHaloMe.show({ x: -520, y: 120, z: -300, o: .5 * p, tint: ME.glow, order: 2 });
    endHaloOp.show({ x: 520, y: 120, z: -300, o: .5 * p, tint: OP.glow, order: 2 });
    endLogoMe.show({ x: lerp(-1500, -520 - dx, p), y: 120, z: lerp(-1500, 0, p), ry: lerp(1, .12, p), order: 10 });
    endLogoOp.show({ x: lerp(1500, 520 + dx, p), y: 120, z: lerp(-1500, 0, p), ry: lerp(-1, -.12, p), order: 10 });
    endVs.show({ y: 120, s: lerp(2.2, 1, expoOut(seg(lt, .25, .5))), o: seg(lt, .25, .32), ...sheen(lt, .7, .8), order: 30 });
    endNameMe.show({ x: -520 - dx, y: -172, wipe: wipeIn(lt, .4, .35), order: 30 });
    endNameOp.show({ x: 520 + dx, y: -172, wipe: wipeIn(lt, .45, .35), dir: -1, order: 30 });
    endRecMe.show({ x: -520 - dx, y: -229, o: seg(lt, .6, .9), order: 30 });
    endRecOp.show({ x: 520 + dx, y: -229, o: seg(lt, .65, .95), order: 30 });
    endLeague.show({ y: 470, o: seg(lt, .3, .7), order: 30 });
    endWeek.show({ y: 385, s: lerp(1.4, 1, expoOut(seg(lt, .15, .4))), o: seg(lt, .15, .22), ...sheen(lt, 1.2, .9), order: 30 });
    const k0 = 1.3, kp = expoOut(seg(lt, k0, k0 + .35));
    kickSlab.show({ y: -325, wipe: wipeIn(lt, k0, .35), order: 31 });
    kickT.show({ y: -325, s: lerp(1.15, 1, kp), o: seg(lt, k0 + .1, k0 + .2), ...sheen(lt, k0 + .5, .8), order: 32 });
    kickSub.show({ y: -400, o: seg(lt, k0 + .4, k0 + .8), order: 32 });
    credit1.show({ y: -497, z: -CAMZ, o: seg(lt, 3.6, 4.2) * .9, order: 92 });
    credit2.show({ y: -522, z: -CAMZ, o: seg(lt, 3.6, 4.2) * .8, order: 92 });
    cam({ z: CAMZ - 40 - drift(lt, dur, 130), y: 10, t, shake: shake(t) * .6 });
    grade.uniforms.fade.value = fade;
  }

  // ---------- the cut ----------
  const FN = { S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14 };
  const SHOTS = [[0, S0], ...MU.shots.map(sh => [ST[sh.id], FN[sh.id]])];
  return (t) => {
    let i = 0; while (i + 1 < SHOTS.length && t >= SHOTS[i + 1][0]) i++;
    const t0 = SHOTS[i][0], end = i + 1 < SHOTS.length ? SHOTS[i + 1][0] : DUR;
    flash(t);
    SHOTS[i][1](t, t - t0, end - t0);
    bug(t);
  };
}
