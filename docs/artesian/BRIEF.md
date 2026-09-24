# Chapter brief (v2): building one chapter of "Artesian Water"

You own ONE chapter file, `src/artesian/v2/ch<X>.js`, and nothing else. Read first, in order:
1. `docs/artesian/STORYBOARD.md`: the whole film, your chapter's beats, the seams. It is the plan; you are the director of your chapter within it.
2. `docs/artesian/RESEARCH.md`: how 1890s artesian bores were really drilled. The machinery and the work must be true to it. When the storyboard and the research disagree on a mechanical detail, the research wins; say so in your report.
3. The engine, by header comment: `src/artesian/p3d.js` (3D pencil renderer), `people.js` (cast, animals, clips, IK), `world.js` (land, trees, homestead, windmill, waterhole, geological section), `rig3d.js` (the boring plant), and `lib.js` (2D pencil helpers for skies, smoke, glows, sparks; the lyric strip). Skim `set.js` for 2D helpers you may still want (sky, sun, psmoke, pglow). `rig.js` (the v1 2D figures) is NOT used in v2.
4. `ANIMATION_GUIDE.md`: rules 3–7 and "Animation principles" (reads, timing, anticipation, holds, transitions). Ignore its Clawd and p5.brush API.
5. `src/lyrics.js`: exact line cue times. Cut to them.

## What Alex asked for (the bar)
- **Sophisticated, not childlike.** Compose like a 1940s illustrator: strong silhouettes, a clear focal point, depth (foreground framing, midground action, background), motivated light and cast shadows.
- **Vary the perspective.** No flat side-on rows of figures. Use low angles looking up at the derrick and the men, high angles and aerials over the plain, over-the-shoulder and point-of-view shots, close-ups of hands and faces, and camera moves (crane, dolly, push-in, slow orbit). Change angle at every cut.
- **Serious.** A performance of hard work and hope. No gags, no mugging, no cartoon physics.
- **True to life.** The walking beam lifts the rods and drops them; the bit strikes on the beat. The driller turns and feels the rods; the tool dresser dresses bits at the forge; the fireman fires the boiler. Nobody hammers the drill string.
- **Two women on the crew** (the driller and the hand): capable, central, never decorative.

## Hard rules
- **Only edit your chapter file.** Shared files belong to the orchestrator. Need a helper? Write it in your file. Think a shared helper is broken? Work around it locally and say so in your report with the fix you'd make.
- **Cover your time range exactly**: first shot at your chapter start, the next chapter's first shot at your end. `shots([[t0, fn], ...])` inside an IIFE, absolute video times.
- **Build once, pose per frame.** Build each set with `P3.cached('<X>-<name>', () => {...})` (scene, rig, people, props) and only pose/move things per frame. Frames must be pure functions of t: no state carried between frames, no Math.random (use `hash(i)`), and set EVERY moving thing's pose in every frame (a cached scene remembers the last frame's pose).
- **Draw order per frame:** 2D background first (`sky()`, `sun()`, far haze), then `P3.draw(scene, cam, {...})`, then 2D effects on projected 3D points (`P3.project(cam, [x,y,z])` → `psmoke`, `pglow`, spark `pline`s), then transitions. The lyric strip is drawn for you on every frame; keep important action above y ≈ 890 px.
- **Cast on model:** always `PEOPLE.make(name)` with the `CAST3` names. Scale is real (feet): people are ~6 ft; the derrick is 62 ft; the floor is 2.2 ft up.
- **Hands touch what they hold.** Use `PEOPLE.reach(p, 'l'|'r', point, pole)` after the clip so hands land on levers, tiller, tongs, ropes, logs, hammers. Put held props at the hand (`PEOPLE.hand(p, side)`), or the hand on the prop.
- **Text:** none except the lettering the storyboard names (the chalked depth board, the maker's plate). Use `label()` from set.js.
- **Frame budget:** under ~700 ms per frame for normal frames (the render log prints ms/frame; the first frame of a set costs more while it builds). Keep people per shot ≤ 7, trees reasonable, and don't build geometry per frame.
- **Seams:** open with the second half of `scribbleWipe` (p .5 → 1 in your first .35 s) and close with the first half (p 0 → .5 in your last .35 s), unless the storyboard's seam note says otherwise for your chapter. Inside your chapter, choose transitions that belong to the story: cut on action, match cut (the beam's drop, a turning wheel), camera moves that carry through, whip pans, `pageTurn`, hatching irises. Don't repeat one.

## Craft notes for the 3D pencil engine
- **Cameras:** `const cam = P3.cam(fov)`; each frame `P3.look(cam, [x,y,z], [tx,ty,tz], roll)`. Long lens (20–30°) for faces and compression; wide (45–60°) low and close for scale and drama. Move cameras with `kf()`/`ease` over the shot; small drift even in held shots. Avoid putting the horizon dead centre.
- **Light:** `P3.scene({ sunDir, sun, fill, shadowSize })`. Set the sun direction to the time of day and keep it consistent within a scene; shadows are the strongest depth cue. Night: dim bluish sun and fill, plus `P3.lamp()` lanterns (intensity in the hundreds to low thousands; check it on the figures) and `pglow` halos drawn after `P3.draw` at projected lamp points. Forge and firebox light: `P3.lamp` + `pglow`.
- **P3.draw options:** `fog: [near, far]` in feet and `fogCol` (usually the sky colour near the horizon) for atmosphere; `lightTint` (0..1, default .55) lets the lights' colour tint surfaces (warm lanterns, orange sunsets); a saturated fill light tints everything it touches, so keep fills near-neutral and put colour in the key lights; `ink` (line colour), `lineW` (1–2.5; heavier for close-ups), `hatch` (stroke scale), `tone` (flat colour under the hatching, .3–.5), `near`/`far` clip for close-ups and the section.
- **Materials:** `P3.mesh(geom, colour, { style })`: style `.8` ground, `.5` water (level strokes + glints), `.6` glowing (hearth, lamp glass), `.9` skin (people set this themselves).
- **People:** `PEOPLE.clip(p, 'Clip_Name', t)` then IK and small `PEOPLE.turn()` adjustments. Useful clips (UAL1/2): Idle_Loop, Walk_Loop, Jog_Fwd_Loop, Sprint_Loop, Push_Loop, Interact, PickUp_Table, Fixing_Kneeling, Crouch_Idle_Loop, Sitting_Idle_Loop, Idle_FoldArms_Loop, Idle_Lantern_Loop, Idle_Torch_Loop, TreeChopping_Loop (a two-handed overhead swing: axes, sledges), Walk_Carry_Loop, OverhandThrow, Farm_Watering, Farm_Harvest, Farm_PlantSeed, Consume (drinking), Yes, Idle_No, Idle_Rail_Loop, Idle_Rail_Call, Idle_Talking_Loop, LayToIdle, ClimbUp_1m, Chest_Open, Driving_Loop (seated). `PEOPLE.clips()` lists them all. Time-shift and speed each person differently so the crew is never in unison. Layer: base clip, then `PEOPLE.clip(p, other, t, { w: .5, only: ['upperarm', 'lowerarm', 'hand'] })` for upper-body overrides.
- **The rig:** `RIG.build()` once, `RIG.pose(R, { stroke: RIG.strokeAt(t), amp, fly, bull, turn })` every frame. Strokes land on the beat every 2 beats. Anchors in `R.userData` after posing (tiller, throttle, whistle, firebox, stackTop, forge, anvil, quench, brake, wellEnd, hole) place people and effects. Stack smoke: `psmoke` on projected `stackTop`, drifting with the wind, puffing with the strokes.
- **The section:** `WORLD.section()` once; `S.userData.set(depthFt, stroke, { casing, flow })` per frame; `S.userData.y(ft)` for camera heights. 1 unit = 10 ft. Frame it three-quarter on (camera off to one side) so it reads as a solid block cut open, with the bore and the bit in focus. The depth board and `ruler` are 2D helpers you may use for the depth read.
- **Animals:** `PEOPLE.beast('cow'|'bull'|'horse'|'horse2'|'dog', colour)`; clips Walk, Gallop, Idle, Idle_Headlow, Eating, Death (use `{ loop: false }` and a start time).
- **Depth cues:** foreground framing elements (a derrick leg, a wheel spoke, a post) in dark near-silhouette; atmosphere via fog; overlap.
- **Timing:** one read at a time, held long enough to land. The line being sung names the read; show that thing while it is sung.

## Review loop (do the whole budget)
Render into `out/check/<X>_*.jpg` (prefix with your chapter letter):
```bash
node --check src/artesian/v2/ch<X>.js
node render.mjs --sheet=<times> --cols=4 --w=480 --out=out/check/<X>_sheet.jpg      # shape of shots
node render.mjs --strip=<a>:<b> --cols=6 --w=320 --out=out/check/<X>_strip.jpg        # every frame of a move / seam
node render.mjs --sheet=<t> --crop=x,y,w,h --w=800 --out=out/check/<X>_crop.jpg       # faces, hands, contacts
```
Open every image with Read and look. At least: a sheet per shot, a strip for every key motion and every seam (both chapter seams too), a crop of every face that carries a line and every hand contact that carries a read. Check the reads against the lyric timing. A sheet showing only paper and the strip means your shot threw: `node --check` and look for `[page error]` in the log. Several chapters render at once on an 8 GB machine: keep `--w` ≤ 480 for sheets, and never run `--frames`/`--clip`.

## Report
When done, report: your shot list with times, camera angles and transitions used, any helpers worth sharing, known weaknesses, and any shared-helper bugs you worked around (with the fix). Don't paste code. Don't commit; the orchestrator commits.
