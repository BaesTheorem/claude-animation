// artesian/props.js: hand tools and small things, in 3D, for the pencil renderer. Units feet. Each builder returns a
// THREE.Group whose HANDLE runs along local +y from the grip at the origin (so a tool can be aimed from the hand).
//
//   const s = PROPS.sledge()         add to the scene once (in the cached set), then per frame:
//   PROPS.place(s, grip, toward)     grip point (e.g. PEOPLE.hand(p,'r')) and a point the handle points toward
//                                    (two-handed tools: the other hand, or where the head should go)
//   PROPS.at(s, [x,y,z], [rx,ry,rz]) plain placement (Euler radians) for props at rest
//
// Builders: sledge, hammer (hand hammer), axe, shovel, tongs (pipe tongs), wrench (pipe wrench), lantern(lit),
// bailer, log, pliers, wire (coil of fencing wire), bucket, watch, letter, book, bitIron (a drill bit being dressed),
// hat(kind, col) (a loose hat for throwing). PROPS.glassAt(lantern) is the point to glow (pglow / P3.lamp).
//   PROPS.swing(person, sledge, k, { target })   a true two-handed sledge stroke landing on target at k = 1 (see below)
//   PROPS.swingStand(person, target, yaw)        where to stand for that stroke
const PROPS = (() => {
  const T = () => THREE;
  const IRON = '#4A4744', IRON_LT = '#7C7770', ASH = '#C8A46A', TIMBER = '#8A6A48';
  const g = () => new (T().Group)();
  const m = (geo, col, o) => P3.mesh(geo, col, o);
  const cyl = (r0, r1, h, n = 10) => new (T().CylinderGeometry)(r1, r0, h, n);
  function handle(len, r = .09, col = ASH) { const h = m(cyl(r, r * .9, len), col); h.position.y = len / 2 - .15; return h; }
  function sledge() { const G = g(); G.add(handle(3.1)); const hd = m(P3.box(.42, .42, 1.05), IRON); hd.position.y = 2.95; G.add(hd); return G; }
  function hammer() { const G = g(); G.add(handle(1.15, .06)); const hd = m(P3.box(.22, .22, .5), IRON); hd.position.y = 1.0; G.add(hd); return G; }
  function axe() { const G = g(); G.add(handle(2.8, .07)); const bl = m(P3.box(.12, .38, .75), IRON_LT); bl.position.set(0, 2.62, .3); G.add(bl); return G; }
  function shovel() { const G = g(); G.add(handle(3.6, .07)); const bl = m(P3.box(.9, 1.1, .06), IRON); bl.position.set(0, 4.0, .05); bl.rotation.x = .15; G.add(bl); return G; }
  function tongs() { const G = g(); G.add(handle(4.2, .1, IRON)); const jaw = m(new (T().TorusGeometry)(.45, .1, 6, 16, Math.PI * 1.3), IRON); jaw.position.set(0, 4.25, 0); jaw.rotation.x = Math.PI / 2; G.add(jaw); return G; }
  function wrench() { const G = g(); G.add(handle(2.4, .07, IRON)); const jw = m(P3.box(.5, .35, .2), IRON); jw.position.set(.12, 2.35, 0); G.add(jw); return G; }
  function lantern(lit = 1) {
    const G = g(), glass = m(cyl(.22, .22, .55, 12), '#F2C15E', { style: .6, cast: false }); glass.position.y = -.55; G.add(glass);
    const base = m(cyl(.28, .3, .15, 12), IRON); base.position.y = -.9; G.add(base);
    const top = m(cyl(.18, .3, .2, 12), IRON); top.position.y = -.2; G.add(top);
    const bail = m(new (T().TorusGeometry)(.25, .02, 4, 12, Math.PI), IRON); bail.position.y = -.05; G.add(bail);
    G.userData.glassLocal = [0, -.55, 0]; G.userData.lit = lit; return G;
  }
  function bailer() { const G = g(); const tube = m(cyl(.28, .28, 9, 12), IRON_LT); tube.position.y = -4.5; G.add(tube); const bail = m(new (T().TorusGeometry)(.3, .04, 4, 12, Math.PI), IRON); G.add(bail); return G; }
  function log(len = 3.2, r = .28) { const G = g(); const l = m(cyl(r, r * .85, len, 8), '#7A5A40'); l.position.y = len / 2; G.add(l); return G; }
  function pliers() { const G = g(); for (const s of [-1, 1]) { const a = m(P3.box(.04, .7, .05), IRON); a.position.set(s * .04, .35, 0); a.rotation.z = s * .08; G.add(a); } return G; }
  function wire() { const G = g(); for (let i = 0; i < 5; i++) { const t = m(new (T().TorusGeometry)(.7, .018, 4, 24), '#6E6A64', { cast: false }); t.rotation.set(Math.PI / 2 + i * .05, 0, i * .3); G.add(t); } return G; }
  function bucket() { const G = g(); const b = m(cyl(.45, .55, .9, 14), TIMBER); b.position.y = .45; G.add(b); return G; }
  function watch() { const G = g(); const c = m(cyl(.13, .13, .05, 16), '#C4A04A'); c.rotation.x = Math.PI / 2; G.add(c); return G; }
  function letter() { const G = g(); const p = m(P3.box(.62, .85, .01), '#EFE8D8', { cast: false }); p.position.y = .42; G.add(p); return G; }
  function book() { const G = g(); const b = m(P3.box(.7, .95, .12), '#5A3A2A'); b.position.y = .47; G.add(b); return G; }
  function bitIron() { const G = g(); const s = m(cyl(.22, .22, 4, 8), IRON); s.position.y = 2; G.add(s); const c = m(P3.box(.6, .6, .12), IRON); c.position.y = 4.2; G.add(c); return G; }
  function hat(kind = 'slouch', col = '#5B4A3A') {
    const G = g(), V = (x, y) => new (T().Vector2)(x, y);
    const P = kind === 'bowler' ? [V(.001, .5), V(.2, .48), V(.33, .36), V(.36, .04), V(.52, .03), V(.5, 0), V(.33, -.01)] : [V(.001, .54), V(.23, .52), V(.35, .42), V(.37, .04), V(.68, .01), V(.7, -.07), V(.62, -.02), V(.33, -.01)];
    const h = m(new (T().LatheGeometry)(P, 28), col, { side: T().DoubleSide }); G.add(h); return G;
  }
  const _up = () => new (T().Vector3)(0, 1, 0);
  function place(prop, grip, toward, roll = 0) {
    const THREE = T(), A = grip.isVector3 ? grip.clone() : new THREE.Vector3(...grip), B = toward.isVector3 ? toward.clone() : new THREE.Vector3(...toward);
    prop.position.copy(A);
    const dir = B.sub(A); if (dir.lengthSq() < 1e-8) return prop;
    prop.quaternion.setFromUnitVectors(_up(), dir.normalize());
    if (roll) prop.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(_up(), roll));
    prop.updateMatrixWorld(true); return prop;
  }
  function at(prop, p, e = [0, 0, 0]) { prop.position.set(...p); prop.rotation.set(...e); prop.updateMatrixWorld(true); return prop; }
  // world point of a lantern's glass (for pglow / P3.lamp)
  function glassAt(l) { l.updateMatrixWorld(true); return l.localToWorld(new (T().Vector3)(...l.userData.glassLocal)).toArray(); }
  // A two-handed sledge (or axe) stroke that lands on a target. Call after placing and clipping the person
  // (an idle-ish clip), every frame. k = 0..1 through one stroke; the head strikes the target exactly at k = 1
  // (use k = frac(bpOf(t) / 2) to strike on the beat every two beats). Phases: recover and lift (0 → .5),
  // hang at the top (.5 → .6), strike, accelerating (.6 → 1). Both hands stay on the handle (IK); the torso
  // leans into the blow. o: target [x,y,z] (required), lead 'r'|'l' (the hand nearer the head), back (radians the
  // head goes past vertical behind, default .7), reach (ft from shoulders to the butt hand, default 1.7), lean (1).
  // Returns { head (Vector3), strike (0..1 how hard it is landing right now), a (handle angle) }.
  // swingStand(person, target, yaw) → where to stand [x, 0, z] so the stroke reaches the target from that facing.
  function swing(p, prop, k, o) {
    const THREE = T(), wp = b => { const v = new THREE.Vector3(); b.getWorldPosition(v); return v; };
    const lean = o.lean ?? 1, ks = clamp(k);
    // lean first (spine flexes forward on the strike, back on the lift), then solve the arms from the new shoulders
    const bend = ks < .5 ? lerp(.35, -.15, ease(ks / .5)) : ks < .6 ? -.18 : lerp(-.18, .42, easeIn((ks - .6) / .4));
    PEOPLE.turn(p, 'spine_02', [bend * .5 * lean, 0, 0]); PEOPLE.turn(p, 'spine_03', [bend * .4 * lean, 0, 0]);
    const S = wp(p.bones.upperarm_l).add(wp(p.bones.upperarm_r)).multiplyScalar(.5);
    const Tg = new THREE.Vector3(...o.target), toT = Tg.clone().sub(S), up = new THREE.Vector3(0, 1, 0);
    const horiz = new THREE.Vector3(toT.x, 0, toT.z); if (horiz.lengthSq() < 1e-6) horiz.set(0, 0, 1); horiz.normalize();
    const aT = Math.atan2(horiz.dot(toT), up.dot(toT)), aB = -(o.back ?? .7);
    const a = ks < .5 ? lerp(aT, aB, ease(ks / .5)) : ks < .6 ? aB - .06 * Math.sin((ks - .5) / .1 * Math.PI) : lerp(aB, aT, easeIn((ks - .6) / .4));
    const u = up.clone().multiplyScalar(Math.cos(a)).add(horiz.clone().multiplyScalar(Math.sin(a)));
    const len = 2.95, reach = o.reach ?? clamp(toT.length() - len - .15, .8, 2.4);   // arms extend or bend so the head lands on the target
    // the butt hand rides the arc; the head is pinned to land on the target at k = 1 (hands slide on the handle)
    const G1 = S.clone().add(u.clone().multiplyScalar(reach));
    const slide = ks < .5 ? lerp(1.0, .3, ease(ks / .5)) : ks < .6 ? .3 : lerp(.3, 1.0, easeIn((ks - .6) / .4));
    const G2 = G1.clone().add(u.clone().multiplyScalar(slide));
    const lead = o.lead || 'r', back = lead === 'r' ? 'l' : 'r';
    const side = new THREE.Vector3().crossVectors(up, horiz).normalize();
    PEOPLE.reach(p, back, G1.toArray(), S.clone().add(side.clone().multiplyScalar(lead === 'r' ? 1.5 : -1.5)).add(new THREE.Vector3(0, -1.5, 0)).toArray());
    PEOPLE.reach(p, lead, G2.toArray(), S.clone().add(side.clone().multiplyScalar(lead === 'r' ? -1.5 : 1.5)).add(new THREE.Vector3(0, -1.5, 0)).toArray());
    const butt = G1.clone().sub(u.clone().multiplyScalar(.15));
    if (prop) place(prop, butt, G1.clone().add(u));
    const head = butt.clone().add(u.clone().multiplyScalar(len + .15));
    return { head, strike: ks > .92 ? (ks - .92) / .08 : 0, a };
  }
  function swingStand(p, target, yaw, o = {}) {
    // shoulders ~ .78 of height; the head reaches (reach + 3.1) ft from the shoulders at the strike angle
    const h = 5.9 * (p.L.height || 1), sy = h * .8, R = (o.reach ?? 1.7) + 3.1, dy = sy - target[1], dh = Math.sqrt(Math.max(.5, R * R - dy * dy)) * .92;
    return [target[0] - Math.sin(yaw) * dh, 0, target[2] - Math.cos(yaw) * dh];
  }
  return { sledge, hammer, axe, shovel, tongs, wrench, lantern, bailer, log, pliers, wire, bucket, watch, letter, book, bitIron, hat, place, at, glassAt, swing, swingStand };
})();
