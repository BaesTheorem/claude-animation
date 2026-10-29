# Spark: Soul Sleeve (design lock)

Kinetic typography lyric video for "Spark" (Fitz and The Tantrums, 2013), branch `video/spark`.
Direction B, picked by Alex on 2026-10-29: a 1960s soul record sleeve in motion. Flat color
fields switch on the strong beats, giant type runs off the edges, and each word gets bolder
as the voice gets louder. Reference: [Dominique Sire on Awwwards](https://www.awwwards.com/inspiration/color-and-typography-design-inspiration).

The page is `spark.html` with code in `src/spark/`. The song data (lyrics, timings, stems) is
in the gitignored `private/spark/` folder. See `private/README.md` for how to make it again.

## Type

| Role | Font | Settings |
| --- | --- | --- |
| Content words | Archivo (variable, OFL) | Uppercase. Weight 620 to 900 from the vocal level (the hero word of a line: 820 to 900). Width steps: extra-condensed to semi-expanded. Tracking -1%. |
| Function words, backing vocals | Fraunces Italic (variable, OFL) | Lowercase. Weight 300 to 650. Set inline at 46% of the font size of its row. |
| Credits | Archivo | Weight 600, normal width, uppercase, tracking +8%. |

Function words are articles, prepositions, conjunctions and forms of "to be" (the list is
`FUNCTION` in `bin/lyrics-align`). The fonts are in `src/spark/fonts/` with their licenses.

## Palette

Five tokens. No other flat color appears in a frame (the two print textures below blend them).

| Token | Hex |
| --- | --- |
| `ink` | `#121212` |
| `chalk` | `#F2F3F5` |
| `signal` | `#FF3B2F` |
| `blush` | `#F7B2BD` |
| `pine` | `#1E4D3B` |

Text only goes on a field where the WCAG contrast is 4.5:1 or more. These are the permitted
pairs (type on field), measured on 2026-10-29:

| Field | Type colors |
| --- | --- |
| `chalk` | `ink` (16.9), `pine` (8.7) |
| `ink` | `chalk` (16.9), `blush` (10.8), `signal` (5.3) |
| `signal` | `ink` (5.3) |
| `blush` | `ink` (10.8), `pine` (5.5) |
| `pine` | `chalk` (8.7), `blush` (5.5) |

## Space and shape

- Margins and fixed offsets use an 8 px scale at 1920x1080: 8, 16, 24, 32, 48, 64, 96, 128. Type boxes
  are then inset by the largest camera zoom (3.5%), so their edges are not on the scale.
- The safe area is 96 px from the left and right edges and 64 px from the top and bottom.
  All text stays inside it at the largest camera zoom. `window.audit()` in the page checks
  this for every word (0 of 395 outside on the real layout, 2026-10-29).
- Border radius: 0. Rectangles are sharp. The only other shapes are the record disc and the
  starburst.
- No gradients or shadows. Two print textures are permitted: a static grain at 4% opacity,
  and a copy of a starburst 3 px down and right at 35% opacity (misregistration).

## Motion

- A word comes on 30 ms before its sung onset, with a 140 ms expo-out entrance. There are no fades
  and no crossfades. Compositions change with a hard cut or a flat field wipe.
- Field shifts (the split in `CC`, the disc pulse in `CB`, the camera punch) land on downbeats
  (beat_this downbeats, phase 0 of the grid). Starbursts tick on backbeats. A line holds until
  its last word has had 0.22 s, so a cut can come up to 0.7 s after the next line's onset.
- The weight of the word that is sung follows the vocal stem level. After the word ends, it
  keeps the weight of its loudest moment.
- Each word has a fixed box from the layout. A weight change scales the glyphs inside that
  box, so a row never reflows.
- The chorus motif is a flat 12-point starburst in `signal` that ticks a half point on each
  backbeat. The hook (the most repeated line) always gets it, large, behind the type. The
  title word is not in the lyrics, so the title has the intro and end cards.
- Long held chorus lines alternate between a scrolling column (`CT`) and word cards (`CG`):
  one giant word per card, cut on its sung onset, a new field color per card.
- A new section comes in with a flat wipe in a color that the old ground does not have.
- Verse grounds are `chalk` and `blush` (with `pine` and `ink` bands), choruses use `signal`
  and `ink`, the bridge uses `pine`.
