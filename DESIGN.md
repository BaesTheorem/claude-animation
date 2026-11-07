# Uplift: design

Direction A, "Shadow and light", chosen by Alex on 2026-11-07. Reference: Lotte Reiniger, *The Adventures
of Prince Achmed* (1926), for the cut-paper silhouette, moved into a real 3D camera.

## Palette: five tokens

| Token | Hex | Use |
|---|---|---|
| `ink` | `#07080D` | every solid thing: people, animals, land, machines. Never pure black |
| `night` | `#0B1030` | the dark that frames the film: night skies, space |
| `ember` | `#FF8A3D` | fire. The one accent colour. It opens and closes the film |
| `gold` | `#FFC46B` | sun on fields, sodium lamps, city lights from orbit |
| `frost` | `#CFE6FF` | electric light, screens, starlight, the cold sun of the new world |

Each age's sky is a gradient built from these tokens and their mixes (the colour script):

| Age | Zenith | Horizon | Light |
|---|---|---|---|
| Intro, longest night | night | night mixed with frost, faint | stars |
| Stone age | deep violet | rose dawn | ember fire |
| Farming and cities | warm blue | gold | gold sun |
| Industry | smoke brown | furnace red | ember furnace, then frost lamps |
| Instrumental | night | gold city glow | gold and frost lights |
| Bridge | slate | mud brown, a cyan-gold dawn line | lanterns (ember) |
| Space | black | none | gold city lights, white sun |
| New world | violet | teal | cold sun (frost), ember fire |

## Rules

- **Silhouettes only.** Solids are `ink`. Detail lives in the outline, so poses must read as shapes:
  profile and three-quarter views, limbs clear of the body.
- **Depth is sky fog.** A silhouette fades toward the exact sky colour behind it with distance
  (`skyBase()` in the silhouette shader). No grey haze, no flat fog colour.
- **Light is the only colour.** Bloom touches HDR light sources only (sun, fire, lamps, screens); the
  sky stays below the bloom threshold.
- **Gradients are allowed in skies, glows and fog only.** No drop shadows. Rim light on silhouettes is
  the one planned addition for the full version.
- **Film finish:** fine grain, a soft vignette, a slight colour fringe toward the frame edges.
- **No text.** The animatic burns in a shot number and timecode for review (`?label=1`); the final has none.
- **Screen direction:** humanity moves left to right. Hands enter close-ups from the right.
- **Motion:** people move with the CC0 Quaternius rigs and the Universal Animation Library clips
  (`assets/cast`, `assets/anim`, `assets/animals`), sampled as pure functions of time.
