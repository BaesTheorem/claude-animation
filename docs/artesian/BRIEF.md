# Chapter brief: building one chapter of "Artesian Water"

You own ONE chapter file, `src/artesian/ch<X>.js`, and nothing else. Read, in order:
1. `docs/artesian/STORYBOARD.md` (the whole film; your chapter's beats; the seams).
2. `ANIMATION_GUIDE.md` sections **The rules** (3 Something happens, 4 Timing, 5 Alive, 6 Transitions, 7 One piece) and **Animation principles**. Its painting API (paint, inkLine, clawd, glow, brushWipe) does NOT apply here: this film has its own pencil engine.
3. `src/artesian/lib.js`, `rig.js`, `set.js`: the pencil engine, the people, the sets. Read the header comments fully.
4. `src/lyrics.js`: exact line cue times. Your shots are cut to them.

## Hard rules
- **Only edit your chapter file.** `lib.js`, `rig.js`, `set.js`, `studio.html`, `config.js`, `lyrics.js` are shared and owned by the orchestrator. If you need a new shared helper, write it inside your chapter file. If you think a shared helper is broken, say so in your final report (with the fix you'd make) instead of editing it.
- **Your shots must exactly cover your chapter's time range**: the first shot starts at your chapter's start time, and the next chapter's first shot starts at your end time. Register with `shots([[t0, fn], ...])` inside an IIFE, absolute video times.
- **Pencil only.** Draw with `pfill`, `pshade`, `plit`, `pline`, `ptone`, `pglow`, `psmoke`, and the helpers in rig/set. No p5 drawing calls, no kit `paint()`/`inkLine()`/`clawd()`, no `glow()` (use `pglow`), no raw `X.fillRect` except inside a helper that is clearly a pencil mark.
- **Camera:** `camOn(cx, cy, zoom, rot)` … `camOff()` (NOT the kit's camBegin). Full-frame transitions after `camOff()`.
- **Seeds:** call `seed('<unique key>')` before each separate element (background layer, each figure, each prop) so still things don't re-boil every frame when something moving is drawn before them. `man()` does NOT seed itself: seed before each `man()` call with a stable key.
- **Pure functions of t.** No state between frames, no Math.random(). `hash(i)` for stable randomness.
- **Keep story action above y ≈ 890.** The lyric strip covers y 900–1080 on every frame and is drawn for you. Never draw your own lyrics.
- **No other text**, except what the storyboard names (the depth ruler, the "20 H.P." plate). Use `label()` for it.
- **Frame budget:** under ~600 ms per frame (render logs ms/frame). The engine is fast; hundreds of fills are fine.
- **Keep the cast on model:** use `CAST.*` looks unchanged. Scale `s` ≈ 60–90 medium, 110+ close, 25–40 wide. The driller is the hero: give him the big poses.
- **Seams:** open your chapter with the second half of `scribbleWipe` (p .5 → 1 in the first .35 s) and close it with the first half (p 0 → .5 in the last .35 s), unless the storyboard's seam note says otherwise for your chapter. Between your own shots, choose transitions that belong to the story (match cuts on the beam's drop, cut on action, a whip-pan with speed lines, `pageTurn`, `paperFade`, iris of hatching…) and don't use the same one every time.
- **Choruses use `dive()`** for their down-the-bore half so all eight rhyme, decorated through its `extra` hook (fossils, the devil, cracks). The crew half is yours to stage, but every "down" should land a blow ON THE BEAT (`bpOf(t)`, `pulse(t)`, `beatN(t)`).

## Craft notes for this engine
- Poses: `kp(t, [[t0, pose], [t1, pose]], ease)` blends poses; `POSES.*` has hammer up/down, haul, heave, cheer, fist. A hammer cycle: wind up slowly (easeOut), strike fast (easeIn) landing exactly on the beat, hold the impact 2–3 frames, recoil. Use `sledge(J.handF, J.angF + .9 * J.dir, s)` in the `hold` hook; tune the angle offset per pose so the head lands where the blow lands.
- Faces act through `face`, `mouth`, `blink`, `look`, `head`. Change expression with a blink or a squint between, never a snap.
- Light: set `LIGHT = [x, y]` (direction FROM the light) per shot so form shading agrees with the sun or lantern. Reset it at the start of each shot.
- Depth: farther = smaller, lower `tone`, lighter `dens`, bluer/paler colour; nearer = bigger, darker, crosshatched.
- Big skies and grounds: pass `still: true` to fills that shouldn't boil their texture (huge areas boiling looks like static).
- Glows go down before what stands in front of the light.
- Motion lines and dust in pencil: short `pline` strokes, `psmoke`.

## Review loop (do the whole budget)
Render into `out/check/<X>_*.jpg` (prefix with your chapter letter so you never overwrite another chapter's checks):
```bash
node --check src/artesian/ch<X>.js
node render.mjs --sheet=<times> --cols=4 --w=480 --out=out/check/<X>_sheet.jpg      # shape of shots
node render.mjs --strip=<a>:<b> --cols=6 --w=320 --out=out/check/<X>_strip.jpg        # every frame of a move / seam
node render.mjs --sheet=<t> --crop=x,y,w,h --w=800 --out=out/check/<X>_crop.jpg       # faces, hands, contacts
```
Open every image with Read and look. At least: one sheet per shot, a strip for every key motion (each hammer blow type, each take) and every seam (including your two chapter seams), a crop of every face that carries a line. Check the reads against the lyric timing: the thing the line is about must be on screen and readable while that line is sung. Fix and look again. A sheet showing only paper and the lyric strip means your shot threw: check `node --check` and the render log for `[page error]`.

Several chapters render at once on an 8 GB machine: keep `--w` ≤ 480 for sheets, and never run `--frames`/`--clip` (the orchestrator renders the film).

## Report
When done, report: your shot list with times, which transitions you used, anything you defined that other chapters should reuse (globals), known weaknesses, and any shared-helper bugs you worked around. Don't paste code.

## Notes from the first wave (chapters A–D are built; read their headers)
- **Fixed in the shared files:** `beam()` now rises slowly and drops fast, landing at ph = 1 (use `ph = frac(bpOf(t))` to land every beat; `o.post` sets the post height). `POSES.hamUp` stores its arms past +π, so `kp(hamDown → hamUp)` swings over the head (don't subtract TAU any more). `dive()`'s bit lifts late in the beat and slams down on it; `dive()` has an `over` hook drawn after the shaft and rods. `pageTurn()` fully covers at p = .5. `engine()` takes `o.smokePh` to decouple smoke speed from the flywheel.
- **Known engine quirk:** `pline` widths scale with camera zoom (textures don't). At zoom ≥ 3 pass smaller widths.
- **Globals you can call** (defined by earlier chapters, documented at the top of their files):
  - chA: `homestead(x, y, s, o)` (veranda, `table`, `thermo: {level, burst}`, `tank`, `green`, hooks), `openingFrame(t, o)` (the film's opening composition; `o.wet` and its parts for the ending; `cam`, `draw`, `colour`).
  - chB: `devil(x, y, s, pose, hooks)`, `devilHall(x, y, s, o)` (incl. `wet`), `hallInDive(t, lt, dur, o, hallO)`, `HALL`, `teacup()`. After chapter B the devil's chair is crushed, the roof is holed and he wears the teacup on his horn.
- **Worth copying (local to their files, copy don't call):** chD `ik()`/`reach()`/`probe()` (arm IK so hands land on a handle or rope), `backMan()` (a figure from behind), `hatchIris`, `speedLines`, `jet` (steam jet); chC `horse()`, `dog()`, `kpe()` (pose keys with per-segment easing), `memoryGrade()`.
- The film so far: the look is set by A–D. Before you start, render a sheet of the chapter before yours and the one after (if built) to match palette, scale and staging, and check both seams.
