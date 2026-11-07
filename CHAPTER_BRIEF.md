# Uplift: brief for a chapter builder

You build some shots of the "Uplift" animatic: a three.js page of dark silhouettes against luminous
skies, cut to a 3-minute song. Read these first, in this order:

1. `STORYBOARD.md`: the whole film, and your shots in it.
2. `DESIGN.md`: the look, the palette and the colour script.
3. `src/uplift/lib.js` (the API comment at the top), `src/uplift/people.js` (the same),
   and `src/uplift/main.js` (the `SHOT` contract and the transitions).
4. `src/uplift/ch1_stone.js`: a finished chapter. Copy its patterns.

## Your scope

- Write only your chapter file (`src/uplift/chN_*.js`; a stub exists and `uplift.html` already loads
  it). Do not edit any other file. If you need a helper the library does not have, write it inside
  your chapter file.
- Never open anything in `private/`: it holds copyrighted lyrics. The storyboard says what each
  line pictures, and that is all you need.
- Do not run git. The orchestrator commits.
- This Mac has 8 GB of RAM. Run one render at a time.

## The contract

```js
SHOT({ id: 'S07', t0: LINE(5)[0], t1: LINE(6)[0], out: { kind: 'cross', d: 1.2 },
  build(G, ctx) { /* make the set once: add meshes and people to group G; return a state object */ },
  frame(s, lt, dur, t, { camera, PX }) { /* pose everything for time t (lt = t - t0); call UP.sky() and set the camera */ },
});
```

- `LINE(n)` is `[start, end]` of sung line n in seconds. `UP.B` is the list of beat times,
  `UP.pulse(t)` is 1 on a beat and decays, `UP.beatAt(t)` is the index of the last beat.
- `out` is the seam into the next shot: `cut`, `cross` (dissolve, `d` seconds centred on the cut),
  `dip` (through `col`) or `flash` (a glare of `col`). A shot can be asked to draw slightly before
  `t0` or after `t1` during a dissolve, so poses must not break there.
- Frames render in parallel and out of order. Everything is a pure function of `t`: no state kept
  between frames, no `Math.random()` (use `UP.hash(i)`, `UP.noise(x)`).

## Lessons from chapter 1 (each one cost a render)

1. **Camera heights are above the ground.** Use `gcam(camera, land, [x, heightAboveGround, z], look, fov)`.
   With absolute heights on rolling terrain the camera ends up under the ground, and the sky
   shows through it as a pale band.
2. **A silhouette reads only against the sky or a light.** Keep the camera low (0.3 to 1.7 m) so
   that people and machines stand above the horizon line. Dark figures on dark ground disappear.
   A fire's light pool on the ground (`UP.fire`) also gives figures something to read against.
3. **Grass near the camera looks like giant sticks.** Give `grass()` a `clear: [[x, z, r], ...]`
   circle at every camera position, and use short grass (h 0.2) between the camera and the subject.
4. **Distant land must stay darker than the sky.** `terrain({ fog })` scales the sky fog on land
   (default 0.55). Use 0.35 to 0.45 for low cameras, or the far plain turns into a pale lake.
5. **`Sitting_Idle_Loop` is sitting on a chair.** Use it only with a seat (a rock, a log, a bench)
   under the pelvis (`P.wpos(p.bones.pelvis)`).
6. **Close-ups: long lens from a distance** (fov 14 to 24, 2 to 3 m away), the subject against the
   sky. A wide lens up close gives a wall of black.
7. **Stock clips put hands in the wrong place for a task.** Pose the hands with IK
   (`P.reach(p, 'l'|'r', target, pole)`) on top of a clip, as `knap()` does in ch1. Blend IK in by
   lerping the target from the clip's own hand position (`P.hand(p, side)`).
8. **Separate the subject.** Keep the person or object that carries the read clear of others in
   the frame, or the silhouettes merge into one blob.
9. **Fire:** `const f = UP.fire({ scale, seed, pool })`, then `f.userData.update(t, k, PX)` each frame,
   k from 0 (out) to 1. `f.userData.lean` bends it in the wind.
10. **Light:** solids use `UP.silMat()` (ink). Anything that shines uses `UP.litMat(hex, k)` (k > 1
    blooms) or `UP.glow(hex, size, k)`. The sky never blooms, only lights do.

## People and animals

- `const p = P.make('m1' | 'm2' | 'm3' | 'w1' | 'w2' | 'child' | 'girl')`, then `G.add(p.root)`.
  Each frame: `P.at(p, [x, y, z], yaw)` (yaw 0 faces +z, PI/2 faces +x), then `P.clip(p, name, t)`.
  `P.blend(p, a, ta, b, tb, k)` cross-fades two clips. Units are metres.
- Human clips: A_TPose, Crouch_Fwd_Loop, Crouch_Idle_Loop, Dance_Loop, Death01, Driving_Loop,
  Fixing_Kneeling, Hit_Chest, Hit_Head, Idle_Loop, Idle_Talking_Loop, Idle_Torch_Loop, Interact,
  Jog_Fwd_Loop, Jump_Land, Jump_Loop, Jump_Start, PickUp_Table, Pistol_Aim_Down, Pistol_Aim_Neutral,
  Pistol_Aim_Up, Pistol_Idle_Loop, Push_Loop, Roll, Sitting_Enter, Sitting_Exit, Sitting_Idle_Loop,
  Sitting_Talking_Loop, Spell_Simple_Enter, Spell_Simple_Idle_Loop, Spell_Simple_Shoot, Sprint_Loop,
  Swim_Fwd_Loop, Walk_Formal_Loop, Walk_Loop; Chest_Open, ClimbUp_1m, Consume, Farm_Harvest,
  Farm_PlantSeed, Farm_Watering, Idle_FoldArms_Loop, Idle_Lantern_Loop, Idle_No_Loop, Idle_Rail_Call,
  Idle_Rail_Loop, Idle_TalkingPhone_Loop, LayToIdle, OverhandThrow, TreeChopping_Loop,
  Walk_Carry_Loop, Yes. Clips are in place: move the root yourself at the walk speed (about 1.2 m/s).
- Animals: `P.beast('bull' | 'cow' | 'horse' | 'horse2' | 'dog', scale)`, clips Walk, Gallop, Idle,
  Idle_2, Idle_Headlow, Eating, Attack_Kick, Death. They face +z at yaw 0.
- Machines and props: build them from `UP.box/cyl/cone/sph/rod/setRod/gear` or your own
  geometry with `UP.silMat()`. **Mechanisms must work the way the real ones do** (a slider-crank
  computed from the crank angle, a beam that rocks about its pivot): Alex checks this.

## Review loop

```bash
cd ~/Documents/claude-animation-uplift
node render.mjs --page=uplift.html --sheet=52,53,54.5,56 --cols=4 --w=400 --out=out/check/ch2_a.jpg
node render.mjs --page=uplift.html --query=only=S07 --sheet=52,54 --cols=2 --w=640 --out=out/check/ch2_s07.jpg
node render.mjs --page=uplift.html --sheet=54 --cols=1 --w=1280 --out=out/check/ch2_full.jpg
```

Read every image you render. `--query=only=S07` draws that shot whatever the time and skips the
transitions. A sheet takes about 10 seconds. Budget: one sheet per shot at its read times, a
full-size frame for each key moment, and a sheet across your chapter's seams. If the page throws,
the sheet comes out black or the render prints `[page error]`: run `node --check` on your file.

## Report

When your chapter reads, reply with: what each shot shows at its key times, the transition at
each seam, anything you could not make work, and any screen position the neighbouring chapter
must match.
