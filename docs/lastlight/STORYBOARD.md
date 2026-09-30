# Last Light of September: storyboard

Music: "Last Light of September", solo piano in D-flat major, just-intonation render (`assets/last-light.mp3`,
176.64 s). Composed and performed with pianokit (harness `mist-music/piano/`). It is played with rubato, so the beat
clock follows `PROJECT.beats`: use `BAR(n)` and `AT(bar, beat)` from `src/lastlight/lib.js` for every musical time.
Never hard-code a time that the music defines.

**Logline:** Clawd wants to spend the last golden afternoon of September outdoors, but a rainstorm rolls in, so Clawd
hurries home with a stray black cat, and they watch the last light of the day from a warm window and a pile of leaves.

**World:** one small autumn valley: a park with maples, an apple orchard on a slope, and a stone-and-plaster cottage
with a red roof. Palette `FALL.*`. Colour arc across the film: honey-gold afternoon (A) → deeper amber as the sun
drops and clouds gather (B1–B2) → blue-grey rain (B3, C1) → a gold and rose sunset breaking under the clouds, with a
rainbow (D) → deep blue night with warm lamplight and a jack-o'-lantern (C2).

**Motifs:**
- The red maple leaf (`redLeaf()`, one design). It falls in the first shot, and Clawd catches it and holds it up to
  the sun. Clawd tucks it in the apple basket. In the rain it sits on the cat's head like a tiny umbrella. It dries
  on the windowsill, and in the last shot Clawd presses it into a book.
- The black cat (`cat()`), a stranger that becomes a friend. It watches from under a bench, follows Clawd to the
  orchard, rides home in the basket, paws at raindrops on the glass, jumps into the leaf pile, and falls asleep on
  Clawd's lap.

**Rhyme:** the film opens on a single leaf falling in golden light, with the camera tilting down from the treetops.
It ends in the dark, with a last leaf drifting past the window and the first star, and the camera easing up toward
the star.

**Clawd's arc:** happy → curious → love (the catch) → wonder (the leaf in the light) → shy and happy (the cat) →
determined → proud (the high apple) → surprised → nervous (rain) → relieved and cosy → hopeful (the light breaks) →
starstruck (the valley) → mischief → laugh (the leaf pile) → content → sleepy.

**Look:** Clawd wears the `beanie` hat in every shot. Medium shots use u 22–26, wide shots u 11–14, the interior
shots u 26–30, and the last close-up up to 36. Travel runs left to right across the whole film: the walk, the
cat's exit, the run home.

## Shots

Times are video seconds. Reads are what the viewer must understand, in order.

### Chapter A: the park (0 → BAR(13) = 44.87)

**A1** 0–16.00 [in: the frame blooms up from paper: a warm wash floods outward from the sun]
Wide park at late afternoon: a winding path, maples, a pond catching the low sun, leaves drifting. The camera
starts in the canopy and drifts down to the path. EVENT: a gust swirls leaves across the frame (bar 3). Then one red
leaf lets go of a branch near the camera (bar 4) and spins down. The camera follows it, and Clawd's feet trot in
along the path on the melody's first note, `AT(4, 4.5)` = 15.49.
- 0–4.5 the frame blooms up; a golden park
- 4.5–8.3 light through the leaves, leaves drifting (the eye settles)
- 8.3–12.1 the gust: a sweep of leaves crosses the frame (the eye follows the motion)
- 12.1–15.5 the one red leaf lets go and falls (the only red leaf on screen; the others thin out)
- 15.5–16 Clawd trots in underneath: cut on action

**A2** 16.00–30.32 [in: cut on action, the trot continues]
Medium tracking shot (u ≈ 24), side view, trotting right along the path. Parallax: trunks behind, leaves drifting
in front. Clawd kicks a small puff of leaves on the downbeats of bars 5 and 6. EVENT: the red leaf spirals down
ahead. Clawd notices it (the eyes lead), stops, and sways under it as it zigzags. On bar 8 it lands on Clawd's
raised arm: love, hearts.
- 16–19.6 Clawd strolling happily through the park (introduce the character)
- 19.6–23.2 the red leaf enters from the top and swirls (the eye goes to it)
- 23.2–25 Clawd stops and looks up (show the thought)
- 25–27.5 the leaf zigzags, Clawd shuffles under it and catches it
- 27.5–30.3 delight: hold up the prize, then love

**A3** 30.32–44.87 [in: the camera keeps drifting (one move carries over from A2)]
Clawd lifts the red leaf to the low sun, and it glows (`redLeaf({lit})`, a warm tint on Clawd) on the melody's peak,
`AT(9, 3)` = 32.13. A moment of wonder. EVENT: two yellow-green eyes blink in the dark under a park bench (bar 10).
The black cat's head pushes out of a heap of leaves (bar 11). They look at each other: hold. Clawd waves shyly. The
cat flicks its tail, trots off to the right (bar 12), and glances back once as an invitation. Clawd follows,
curious and then playful.
- 30.3–34 the leaf glows in the sun, wonder
- 34–37.5 the eyes in the dark under the bench (small, so give them time)
- 37.5–41 the cat emerges; eye contact; a wave
- 41–44.9 the cat trots off right and looks back; Clawd follows
[out: a whip pan right with speed smear, `whip()`, first half]

### Chapter B: the orchard and the rain (BAR(13) = 44.87 → BAR(25) = 88.18)

**B1** 44.87–59.14 [in: the second half of the whip pan lands in the orchard]
An apple orchard on a slope, later afternoon (amber sky, lower sun). Apple trees heavy with red apples; a wicker
basket at the foot of a tree. The cat sits on the basket's rim. EVENT: Clawd picks up the basket and tucks the red
leaf into it (bar 13). Clawd tugs at an apple, pulls twice, and it pops free (anticipation) into the basket (bars
14–15). The cat bats a fallen apple and it rolls; Clawd laughs (bar 15). Then Clawd notices one perfect apple very
high up: the eyes go up (bar 16).
- 44.9–48.5 the orchard, the basket, the cat on the rim
- 48.5–52 the tug-tug-pop into the basket
- 52–55.5 the cat and the rolling apple (secondary fun)
- 55.5–59.1 Clawd spots the high apple (the eyes lead up; set up B2)

**B2** 59.14–73.75 [in: cut to a low angle looking up the tree]
The melody climbs by step, one bar at a time, and Clawd's three tries follow it:
- bar 17 (59.14): tiptoe stretch, not enough
- bar 18 (62.61): a hop, the fingertips brush it
- bar 19: a deep crouch, a big jump, and the grab at the top of the melody, `AT(19, 3)` = 67.72

Clawd lands proud (gold tint) with the apple. Clouds have been sliding over the sun since bar 17, so the light is
going. EVENT 2: on the half cadence (bar 20, 69.46) a raindrop hits Clawd's nose. Clawd blinks, surprised, and looks
up: grey sky. Hold on the look.
- 59.1–67.7 the three tries (each one a separate read, one per bar)
- 67.7–69.5 the grab and the proud landing
- 69.5–71.5 the raindrop and the blink
- 71.5–73.75 looking up at the grey sky (the camera tilts up with Clawd's look)
[out: the camera tilts up into grey cloud]

**B3** 73.75–88.18 [in: tilt down out of grey cloud, the same move]
Rain, in the minor key. The colours drain to blue-grey (`skyBlend(... 'rain')`, `rain()`, `splashes()`). EVENT:
the cat hates it: ears flat, fur spiky (`wet`). Clawd scoops the cat into the apple basket. The red leaf ends up
over the cat's head like an umbrella: kindness. They run right along a lane with puddles splashing. The cottage
appears ahead with a warm lit window: the goal. At bar 24 (84.58) they reach the door, which opens onto warm light,
and duck inside, and the door closes.
- 73.75–77.4 the rain arrives in earnest, the world goes grey
- 77.4–81 the soaked cat; into the basket; the leaf umbrella
- 81–84.6 running through the rain, the lit cottage ahead
- 84.6–88.2 in at the door; it shuts
[out: `brushWipe` in door wood, `[FALL.woodDk, FALL.wood]`, first half]

### Chapter C: inside (BAR(25) = 88.18 → BAR(29) = 103.12, and BAR(39) = 144.14 → 176.64)

**C1** 88.18–103.12 [in: the second half of the wood brushWipe]
Inside the cottage: a big window with rain running down the glass, the orchard grey beyond, and a window seat with
cushions. Clawd sits wrapped in the red blanket with a mug of cocoa (`mug()`, `steam()`). The towel-fluffed cat is on
the sill, the red leaf drying beside it, and the apple basket on the floor. EVENT: Clawd sips and warms up
(relieved, blush). A raindrop races down the glass; the cat tracks it and paws at the pane (bar 26); Clawd laughs.
The rain grows heavier with the crescendo (bars 26–27). On bar 28 (98.46) the rain thins and a ray of gold light
breaks through the clouds outside. The window starts to glow, Clawd and the cat look up (hopeful), and the gold
floods the frame.
- 88.2–91.7 the cosy room, rain on the glass, Clawd with cocoa (a held establishing read)
- 91.7–95 sip, warmth, blush
- 95–98.5 the cat and the raindrop; the rain gets heavier
- 98.5–102.4 the rain thins and light breaks through (the eye goes to the window); both look up
- 102.4–103.1 gold floods the frame
[out: `flash(k, '#FFE7A8')` up to full cover at 103.12]

**C2** 144.14–176.64 [in: match cut on the sun: D2 ends on the setting sun's disc, and C2 opens on the lamp's glow at
the same screen position and size (see the seams). Then the camera eases back into the room.]
The same room at evening. Blue dusk outside turns to night. The lamp is warm, and a jack-o'-lantern on the sill
flickers. The rain is gone. Clawd is in the armchair with the blanket and fresh cocoa. EVENTS:
- bars 39–41: Clawd settles in and sips; the cat climbs onto Clawd's lap, kneads the blanket, and curls up (`curl`).
- bar 42 (157.36, the borrowed chord): Clawd picks up the red leaf from the sill, looks at it, and presses it into a
  book on the arm of the chair.
- bar 43: a last leaf drifts past outside the window, and Clawd's eyes grow heavy.
- bar 44 (167.82, the last high note): the first star appears in the window (a glow and a twinkle). Clawd smiles
  and falls asleep (zzz). The camera eases up toward the star, and an iris closes on it.

Reads:
- 144.1–148.4 the lamp glow widens into the evening room (a change of time)
- 148.4–152.8 the sip; the cat climbs up and curls
- 152.8–157.4 a held breath: the pumpkin flickers, the night deepens
- 157.4–162.5 the leaf, looked at and pressed into the book (the motif pays off)
- 162.5–167.8 a last leaf drifts past; the eyelids droop
- 167.8–172 the first star, a last smile, asleep
- 172–176.6 hold; the iris closes on the star (fully closed at 176.4)

### Chapter D: the last light (BAR(29) = 103.12 → BAR(39) = 144.14)

**D1** 103.12–118.29 [in: out of the gold flash: outside, the cottage door swings open]
The cottage door bursts open onto the porch (`cottage({door, lit})`, wet walls drying, dusk 0). Clawd steps out, and
the cat follows (bars 29–30). The camera pulls back and up to reveal the rain-washed valley: gold and rose light
under the lifting clouds, wet leaves sparkling, the orchard. On bar 31 (110.71) a rainbow blooms over the orchard.
Clawd is starstruck. On the climax's surge (bar 32) Clawd throws up both arms in joy.
- 103.1–107 the door opens; they step into the light
- 107–110.7 the reveal: the glowing valley (the eye travels across)
- 110.7–114.4 the rainbow blooms (a bright new element)
- 114.4–118.3 Clawd's reaction: starstruck, then arms up

**D2** 118.29–144.14 [in: cut on action: Clawd bounds down off the porch]
The yard below the porch: a big raked pile of leaves (`pile()`) beside a maple (`maple()`). EVENT: Clawd sees the
pile (idea, mischief) and backs up for a run-up. Clawd runs and leaps, and lands in the pile on the A-flat peak,
`AT(34, 1)` = 122.20. Leaves explode upward and hang, then drift down through bars 34–36. The cat pounces in after
(bar 35). Clawd pops out laughing, with leaves on the beanie (bar 36). The cat pops out with a leaf on its head (bar
37). On bar 38 (138.73, home) they lie back in the leaves and look up at the sunset sky, while leaves drift down
onto them. The sun touches the hills. The camera tilts up to the setting sun, and its disc fills the right place for
the match cut.
- 118.3–121 sees the pile (the eyes lead), mischief
- 121–122.2 the run-up and the leap (fast, anticipated)
- 122.2–126.2 the crash: leaves burst up and hang (the big payoff; hold on the drift)
- 126.2–130.2 the cat pounces in
- 130.2–134.3 Clawd pops out laughing
- 134.3–138.7 the cat pops out wearing a leaf (a small comic beat)
- 138.7–142.5 both lie back; the sun sets
- 142.5–144.1 tilt up to the sun's disc
[out: match cut into C2]

## Seams

| seam | time | outgoing (last frames) | incoming (first frames) |
|---|---|---|---|
| open | 0 | none | A1 blooms up from paper |
| A→B | 44.87 | A3: `whip(p)` with p 0→.5 over the last .35 s | B1: `whip(p)` with p .5→1 over the first .35 s |
| B→C | 88.18 | B3: `brushWipe(p, [FALL.woodDk, FALL.wood])` p 0→.5 over the last .3 s | C1: the same, p .5→1 over the first .3 s |
| C→D | 103.12 | C1: `flash(k, '#FFE7A8')`, k eases 0→1 over the last .7 s | D1: `flash(1 - k, '#FFE7A8')` over the first .7 s |
| D→C | 144.14 | D2: the sun's disc at screen (1180, 330), radius 150, on a glowing sky | C2: the lamp's glow at screen (1180, 330), radius about 150, eased back into the room |
| end | 176.64 | C2: iris closes on the star by 176.4, `PAL.ink` | none |

## Sound (added after the picture)

Soft foley under the piano, never louder than it: leaves crunching (A2, D2), a gust (A1), apple thunks (B1, B2), a
raindrop plip (B2), a rain bed (B3, C1), a door (B3), a cocoa sip (C1, C2), a cat's chirp and purr (A3, C2), and a
lamp click (C2). Cues come from the scene constants.
