# Chapter brief: building one chapter of "Last Light of September"

You own ONE chapter file, `src/lastlight/ch<X>.js`, and nothing else. It is a stub now; replace it. Read, in order:
1. `docs/lastlight/STORYBOARD.md`: the whole film, your shots and their reads, the seams table.
2. `ANIMATION_GUIDE.md`: the WHOLE file. The rules, the animation principles, the engine and the Clawd API all apply.
3. `src/lastlight/lib.js`: read the header fully. It has the timing (`BAR`, `AT`), the palette (`FALL`), skies, leaves,
   trees, rain, the black cat, props, the cottage, `armPt()`/`bodyPt()` and the `whip()` transition.
4. The model sheets, already rendered: `out/check/llcast/t0_50.png` (the cat in every pose), `out/check/llprops/t0_50.png`
   (skies, leaves, maple, pile, basket, apple, mug, steam, cottage), `out/check/llhands/t0_50.png` (armPt markers).
   Open them with Read before you draw anything.

## Hard rules
- **Only edit your chapter file.** `lib.js`, `sheet.js`, `config.js`, `studio.html`, the docs and the other chapters are
  owned by the orchestrator or by other agents working at the same time. If you need a helper, write it inside your
  file. If a shared helper is broken or missing something, work around it locally and say so in your report, with the
  fix you'd make.
- **Cover your time range exactly**: register `shots([[t0, fn], ...])` inside an IIFE, with absolute times written as
  `BAR(n)` / `AT(bar, beat)`, never as raw numbers. Your first shot starts at your chapter's start; the next chapter
  starts at your end.
- **The music has rubato.** `bpOf`, `pulse`, `beatN` and every Clawd idle already follow the performance. Put hits,
  cuts and takes on `BAR()` / `AT()` times.
- **Keep the cast on model.** Clawd wears `hat: 'beanie'` in every shot. The cat is always `cat()` from lib.js: never
  draw your own cat. The motif leaf is always `redLeaf()`. Props held by Clawd sit exactly at `armPt()`; check the
  contact with a crop.
- **Paint only with the kit:** `paint`, `inkLine`, `glow`, `clawd`, `emote`, and the lib helpers. No plain p5 shapes,
  no gradients, no 3D, no text of any kind.
- **Pure functions of t.** No state between frames, no `Math.random()`. Use `hash(i)` for stable randomness and
  `boilSeed(key)` before each separate element. `clawd()` and `cat()` seed themselves; pass a unique `boilKey` when a
  shot has more than one of either.
- **Frame budget:** ≤ 1.2 s per frame (the render prints ms/frame). Keep leaf fields at n ≤ 40 per layer and rain at
  n ≤ 220.
- **Seams:** do your half of each seam exactly as the storyboard's seams table says, with the named helper and
  parameters, so the two halves meet under full cover. Between your own shots, pick transitions that fit the story,
  and don't use the same one twice in a row.

## Craft notes for this film
- It's a cosy piece to a slow piano ballad: unhurried, warm and gentle. Every shot still needs an event, and nothing
  is ever still (leaves drift, the camera drifts or pushes, steam curls, rain falls). Use the rubato: moves can
  breathe with the phrase, and big hits land on the storyboard's beats.
- Clawd acts through `emotions()` (anticipation, a take, overshoot) and `turn()`. The eyes lead every new action. Push
  the poses. Put a take after each cause, never on top of it.
- The cat is a character, not a prop: give it its own timing (a tail flick, an ear turn, a slow blink), offset from
  Clawd. `cat()` options: pose, walk, tail, tailUp, ears, look, eyes, pupil, wet, dy/rot/sx/sy. Head position for
  emotes or eye lines: `catHead()`.
- Depth from overlap, scale and colour: far things smaller, paler and bluer. Parallax layers under one camera: scale
  the horizontal offset per layer (far layers move less).
- `glow()` goes down before whatever stands in front of the light. It barely shows on pale grounds, which is correct.
- Weather and leaves are layered: some leaves or rain behind the characters, some in front.

## Review loop (do the whole budget)
Write checks to `out/check/<X>_*.jpg`, prefixed with your chapter letter so you never overwrite another chapter's.
```bash
node --check src/lastlight/ch<X>.js
node render.mjs --sheet=<times> --cols=4 --w=480 --out=out/check/<X>_sheet.jpg     # key poses, the shape of a shot
node render.mjs --strip=<a>:<b> --cols=6 --w=320 --out=out/check/<X>_strip.jpg       # EVERY frame of a move or seam
node render.mjs --sheet=<t> --crop=x,y,w,h --w=800 --out=out/check/<X>_crop.jpg      # faces, hands, contacts
```
Open every image with Read and look at it. The minimum:
- a sheet per shot at a fixed step, read in order like a viewer (where is the eye, has the read landed?)
- a strip for every key motion (the catch, each jump, each take, each pounce) and for every seam, including your
  chapter's outer seams (render across the boundary time)
- a crop of every face that carries a read, and of every hand-held prop

Fix what you find and look again. A sheet showing a blank sky with a neutral Clawd means your shot threw (the stub is
gone): check `node --check` and the render log for `[page error]`. Several chapters render at the same time on an 8 GB
machine, so keep `--w` ≤ 480 for sheets and never run `--frames` or `--clip`. The orchestrator renders the film.

## Report
When you're done, report:
- your shot list with times and the transitions you used
- the continuity state at your chapter's end (where Clawd, the cat, the red leaf and the basket are, with poses)
- known weaknesses
- any shared-helper bugs you worked around

Don't paste code.
