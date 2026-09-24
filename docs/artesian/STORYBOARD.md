# Artesian Water (v2): storyboard

**What changed from v1.** A serious performance, not a cartoon: no devil, no gags. Real perspective and staging in 3D (low angles, high angles, over-the-shoulder, cranes, dollies, aerials), drawn as coloured pencil and graphite on toned paper by the P3 renderer. The machinery is a true 1890s percussion boring plant (see `RESEARCH.md`): the walking beam lifts the rod string and drops it so the bit strikes the rock; nobody hammers the drill. The crew includes two women.

**Logline.** The drought is killing the stock, so a bore crew stops praying and sinks a bore: through clay and the old sea-bed, through caving ground, bent rods, jammed casing and a contractor going broke, until at four thousand feet the rock gives and the water comes up.

**Look.** A 1940s working-man's illustration (Mead Schaeffer's derrick men, Harvey Dunn, Benton's drawings) rendered in coloured pencil: form-following hatching, graphite contours, cast shadows, atmosphere fading into the paper. The ballad is hand-lettered along a torn strip at the foot of the page, on screen the whole time.

**The crew** (`CAST3` in `people.js`; always make them with `PEOPLE.make(name)`):
- **The driller** (`driller`): a woman, in charge of the hole. Stands at the temper screw with her hand on the rods between blows, feeling the bit on the rock, turning the string a little each stroke with the tiller; runs the brake when tools come up. Calm, exact, the crew's judgment.
- **The tool dresser** (`dresser`): the John Henry figure. The rig's blacksmith and mechanic: dresses the bits at the forge with a sledge, straightens and splices broken rods, keeps the machinery alive. Big, patient, relentless.
- **Canadian Bill** (`bill`): engine driver and fireman. Feeds gidgee into the firebox, minds the gauge, the throttle and the whistle.
- **The boss** (`boss`): the contractor, paid by the foot. Carries the contract, the depth log and the cost.
- **The hand** (`hand`): the second woman. Runs the bull wheel and the bailer, hauls casing, works the tongs.
- **The labourer** (`lab`): tongs, casing, rods, wood.
- **The squatter** (`squatter`): the station owner whose stock is dying.

**Motif.** *The section.* Every chorus goes down into the cutaway of the earth (`WORLD.section`) as the bit strikes on the beat, and every chorus reaches deeper: red soil and clay, the grey marine mudstones, the fossil beds of the old inland sea (ammonites, an ichthyosaur), blue-grey mudstone, sandy shale, the hard grey rock, and finally the water-bearing sandstone. After the strike the section runs the other way: water racing up the casing. A chalked depth board at the rig is the running score.

**Colour and light arc.** A: white-hot drought ochre, low dawn sun then noon glare. B: hazy afternoon, the forge's red. C: grey Glasgow memory; gold late afternoon in the outback. D: teal night, lanterns and firebox (the reference painting). E: bleached, blistering noon. F: bruised storm dusk, red effort. G: dawn gold, and the first blue of the film with the water (steam: deep bore water comes up hot). H: cerulean water, sap green, long evening light.

**Rhyme.** The first frame and the last frame are the same place: the dry waterhole by the dead coolibah with the still windmill and the homestead beyond. At the end the waterhole is full, the windmill turns, cattle drink, and the drawing lifts off the page to blank paper.

**Tempo.** 112.35 BPM (beat 0.534 s, bar 2.136 s), bar downbeats from 1.14 s. The rig strikes every 2 beats (56 strokes a minute) with `RIG.strokeAt(t)`: the blow lands on the beat. Verse lines ~4.3 s; chorus lines ~2.9 s.

## Chapters

Times are video seconds; lyric line numbers are `src/lyrics.js` indices.

### A · 0.00–51.30 · Drought (intro, verse 1 [0–4], chorus 1 [5–8], instrumental)
- Intro 0–11.95: the page draws itself: a slow aerial descent over the white plain at dawn to the dry waterhole, cracked mud, the dead coolibah, the still windmill, the homestead. The title is lettered in the strip.
- [0] stock dying: a starving cow by the dry waterhole sinks to its knees and goes down (the `Death` clip), crows wait in the dead tree. Low angle against the sun. Held, quiet, brutal.
- [1] sick of prayers: the squatter on the homestead veranda, hat in his hands, looks at the empty sky; nothing comes; he puts his hat on and walks out toward the rig. His decision is the shot.
- [2] derricks above, earth below: a crane up the timber derrick from the planks to the crown block against the sky, then down its legs and through the ground into the section.
- [3] waiting at the lever: close shots, one read at a time: Bill's hand on the throttle; the driller's hand on the rods; the boss with his watch; the dresser at the brake. Held tension on the beat.
- [4] let her go: the boss nods; Bill opens the throttle; the flywheel turns, the belt takes up, the band wheel and crank lift the beam, and the first blow lands.
- Chorus 1: the machine finds its rhythm (strikes on the beat) seen from three angles; the driller feeling each blow; then the section, down to ~600 ft.
- Instrumental 45.19–51.30: days pass (time-lapse sky and shadows, stars and lanterns, the rod rack emptying, the depth board chalked higher).

### B · 51.30–85.83 · A thousand feet (verse 2 [9–13], chorus 2 [14–17])
Serious reading of the "devil" verse: deeper means hotter and harder; defiance, not comedy.
- [9] a thousand feet: the section at 1000 ft; above, the bailer comes up and dumps grey slurry, steaming slightly.
- [10] if the Lord won't send us water: the boss looks at the empty sky, then down the hole. Anger turning to resolve.
- [11] knocking on the roof: the deep rock in the section darkens toward red; each blow on the beat; the rods shudder.
- [12] cave the roof of hell in: the forge at dusk: the dresser draws a white-hot bit from the fire and dresses it on the anvil in the red light, sparks on the beat (the "hell" we see is the forge).
- [13] from the devil: the bit plunged into the quench tub, a column of steam; the dresser carries it back to the rig.
- Chorus 2: rig rhythm with the forge; the section down through the fossil beds to ~1400 ft.

### C · 85.83–118.73 · The Glasgow engine (verse 3 [18–22], chorus 3 [23–26])
- [18] built in Glasgow: a cool grey memory: the engine works, the engine on the test bed, a Scottish engineer (a worker in `man` or `man_beard`, dark apron) checking it with care.
- [19] marked it twenty horse-power: the brass maker's plate close up ("20 N.H.P." and a Glasgow maker; the one lettering here), then the same plate, dusty, on the working engine in the outback.
- [20] Canadian Bill firing: Bill feeds split gidgee into the firebox, the fire roaring on his face.
- [21] thirty horses and a score or so of dogs: a mob of horses galloping across the plain with kelpies running at their heels, intercut with the flywheel, crank and beam at full power.
- [22] bound to get the water: the whole plant working in the gold light.
- Chorus 3: sunset; the section to ~2100 ft.

### D · 118.73–153.79 · Night trouble (verse 4 [27–31], chorus 4 [32–35])
- [27] shaft caving: the section: the uncased wall slumps, sand and mud fill round the bit.
- [28] yellow rods bending: in the flooded hole the long pine rods flex and bow with each stroke.
- [29] tubes always jamming: THE REFERENCE PAINTING: teal night, lanterns, three of the crew (dresser, driller, labourer) heaving on tongs clamped to the casing on the derrick floor, other derricks' silhouettes behind. Nothing moves but strain.
- [30] forty horse-power lift: Bill opens the engine wide, the gauge climbs, steam feathers at the safety valve, the hoisting line goes taut, the derrick creaks, and the casing breaks free.
- [31] stubborn drill ramming: the beam slams back into rhythm.
- Chorus 4: night rhythm by lantern; section to ~2700 ft.

### E · 153.79–188.97 · Ruin (verse 5 [36–40], chorus 5 [41–44])
- [36] ruin to the squatter: the squatter at the dry waterhole among the carcasses, the bank letter in his hand.
- [37] weather growing hotter: blinding noon, heat shimmer, dust lifting off the plain.
- [38] past three thousand feet: the bailer comes up and dumps dry grey sludge; the driller's face; the boss chalks 3000 on the depth board.
- [39] boss nearly beat: the boss alone with the contract and the account book, head in his hands.
- [40] bound to get the water: the dresser's hand on his shoulder; the dresser turns back to the rig; the crew follow.
- Chorus 5: the dresser at the anvil with the hand as striker, dressing the bit in rhythm with the rig (sledge on the beat), sparks: the John Henry moment, made true; the section to ~3500 ft.

### F · 188.97–222.73 · Bedrock (verse 6 [45–49], chorus 6 [50–53])
- [45] must be down beneath us: the driller kneels with her hand on the rods, eyes closed, listening; the section below shows the faint blue of water far under the rock.
- [46] bumping on the solid rock: the bit bounces off the hard rock at 4000 ft; the rods jump.
- [47] hammer, splice and bully: a rod snaps; the dresser forges an iron strap, the crew splice the rod and bolt it.
- [48] patch her up with fencing-wire: binding a split with fencing wire, twisting it tight with pliers.
- [49] wring it from the bedrock: the whole crew on the bull wheel / tongs, bodies in effort.
- Chorus 6: storm dusk, maximum effort; the section reaches 4020 ft, and on the last blow the rock cracks and blue water wells into the hole.

### G · 222.73–259.90 · The strike, FINALE (verse 7 [54–58], chorus 7 [59–62])
- [54] Hark! the whistle: Bill pulls the whistle cord; a column of steam at dawn.
- [55] madly cheering: hats thrown high, the crew embracing, the driller's hand still on the rods as they lift.
- [56] rushing up the tubing: the section: water racing up the casing past every stratum to the surface.
- [57] spouts above the casing: the flow bursts above the derrick floor in a roaring, steaming column against the sunrise; spray and a rainbow. Big, wide, held.
- [58] flowing, ever flowing: the crew under the falling water, faces up.
- Chorus 7: the water spreads over the cracked plain; the squatter rides in; cattle come to it.

### H · 259.90–301.16 · The land again (verse 8 [63–67], final chorus [68–72])
- [63] clear away the timber: the crew clearing scrub with axes and cutting the bore drain; the water runs into it.
- [64] glimmers in the shadow: close on the running water, dappled shade, then glints in the sun.
- [65] belts of timber, miles of blazing plain: an aerial tracking shot along the drain across the plain.
- [66] hope and comfort: cattle drinking; green shoots; the squatter kneeling with water in his hands.
- [67] flowing further down: the drain winding to the horizon at sunset.
- Final chorus: the crew at the rig at sunset, the plant still at last over the flowing bore; then the opening frame again, green and full, and a slow pull back as the drawing lifts to blank paper. The last line holds on the strip to the end.

## Seams
Chapter boundaries are `scribbleWipe` (outgoing chapter p 0 → .5 in its last .35 s, incoming p .5 → 1 in its first .35 s), except F → G (the whistle's steam fills the frame on "Hark!") and the end of H (the drawing lifts off the page).
