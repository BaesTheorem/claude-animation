# Descendendo ascendit: storyboard

Music: *Descendendo ascendit, for piano* (harness `mist-music/piano/descendendo_ascendit_piano.py`), 4:18.
Every performed note (862) comes from `--notes-json`, so each spark lands on the note it shows.

**Logline:** a staircase of pitch that rises for ever and still returns, shown as one object seen three ways:
a helix (pitch), a circle (pitch with the octaves identified), a torus (pitch class times the loop of time).

**World:** luminous geometry in a deep blue-black space (#05060d, never pure black). Each pitch class has
its own hue on the colour wheel, so a hue always means the same note. The rising voice is gold, the
falling voice is cyan, and where they meet the light goes white-violet. Bloom, a soft vignette and fine
grain; no text anywhere.

**Motif:** the gold point. It opens the film on the first G, climbs, turns cyan at the top, turns gold again
at the bottom, and closes the film on the same G.

**The one mapping.** A note of pitch p at time s sits at
`pos(p, s) = c(φ) + r(p)·(cos θ·e1(φ) + sin θ·e2) + λ·h(p)·ŷ`, with θ = the pitch class angle,
φ = τ·2π·(bar position in the 24-bar cycle), r(p) = R + (1 − λ)·spread(p).
λ = 1, τ = 0 is the helix. λ = 0, τ = 0 is the flat pitch spiral seen as a circle. λ = 0, τ = 1 is the torus.
Morphing λ and τ is the transition between the chapters, and it is the mathematics itself.

## Shots

```
A  0.0–86.5    (bars 1–24)   [in: black, the first G ignites at 0.59 s]
   HELIX. Every note sparks at its pitch on a rainbow helix (one turn per octave). The chord is three
   vertical columns of light at its pitch classes (a pitch class is every octave at once). At each
   chord change one column slides one or two steps counter-clockwise: the voice leading rises.
   The gold orb climbs the octatonic line and leaves its path lit. The camera rides a screw motion with
   the six-bar phrase (each phrase is the last one turned 90° and raised a minor third).
   reads: 0.6–6    a point of gold light in the dark (the first note)
          4–14     the helix unwinds from it; sparks answer the left hand far below
          14–43    the columns: one moves per bar, two hold (watch bars 5–12)
          43–82    the gold orb and its lit path rise with the camera, phrase after phrase

B  82.9–92     (bars 24–26)  [transition: the camera rises to the axis, the helix flattens, λ 1→0]
   The octaves fall onto each other. The gold path, one full turn of the helix, closes into a ring.
   At bar 25 the gold orb at the top turns cyan: the rising voice becomes the falling one.
   reads: 82.9–88  seen from the axis, the climb is a circle: up is also round
          86.5–90  gold turns cyan

C  88–164      (bars 25–48)  CIRCLE (the pitch spiral from above, tilted a little so it keeps depth)
   Seventh chords: quadrilaterals inscribed in the circle; each bar one vertex slides two steps
   clockwise, so now the voice leading falls. The cyan orb falls a whole tone every four bars. Each
   bar adds one link of the chain of thirds between successive roots, and the links build a star
   with four-fold symmetry that closes on bar 48. Faint dust from every note played so far rings the
   circle.
   reads: 90–110   the quadrilateral and its falling vertex
          110–164  the star grows, link by link, and closes

D  164–172     (bars 48–50)  [transition: the ring sweeps around a circle of time, τ 0→1]
   The circle of dust unrolls into a torus: every note already played finds its bar on the ring of time.
   At bar 49 the cyan orb (now at the bottom) turns gold, and a new cyan orb appears one octave up.
   reads: 164–170  the circle becomes a torus
          167.6–172 two orbs, gold below and cyan above

E  170–250     (bars 49–72)  TORUS. The playhead (a ring slice with the chord polygon) travels round the torus.
   Gold winds one way round the tube, cyan the other: the two curves are (1, 1) and (1, −1) torus knots.
   They close in, meet at D♭ on the far side at bars 59–61 (the unison, the loudest bars), flash
   white-violet, pass, and part. They return round the torus and close at G, where they began.
   reads: 170–200  two curves converging
          201–212  the meeting (the camera faces it, the bloom swells, a ring wave runs round the torus)
          212–246  they part; the camera follows them home
          246–251  the whole torus, both curves closed, crossing at two opposite points (G and D♭)

F  250.8–259   (bar 73, the final chord)  [out: the torus folds back to the circle, then to the point]
   The cyan orb at G turns gold. Everything contracts to one gold point, as at the start. It fades
   with the last note.
   reads: 250.8–254 the torus folds away
          254–259   one gold point, fading: the first frame again
```

Checks: an event in every shot (every note sparks, and each chapter has its turn); each read has
several seconds; every seam is a geometric morph; no text; the end is the opening frame.
