# Uplift: storyboard

Song: "Uplift", written by Andrew Eigel, performed by Glen Raphael, on *Brighter Than Today: A Secular
Solstice* (Raymond Arnold, 2014). 3:00.7. Guitar and one voice. The lyrics are someone else's text: they
stay in `private/uplift/`, and this file names what each line pictures, never its words.

**Logline.** People want to rise, and the climb is long and hard, so every age adds its own light to the
dark, until people carry fire to another world and strike the first spark there.

**World.** Shadow and light. Every solid thing is a dark silhouette. The skies glow, and each age has its
own light source: campfire, sun on fields, furnace, electric lamp, screen, the city grid seen from orbit,
the sun on a light sail, and a new campfire. Distance fades silhouettes into the sky behind them.
Look and palette: [DESIGN.md](DESIGN.md).

**Motifs.**
- Hands at work, always entering from the right in a close-up: knapping (S03), hauling (S10), typing (S22),
  knapping again (S26).
- Feet walking left to right in a low tracking shot: S04 and S27.
- Fire becomes light: the film's one accent colour is ember orange, and it returns at the end.
- The camera rises across the film: ground level in the stone age, rooftops in the industrial age, the
  stratosphere in the instrumental, down to the mud for the bridge, orbit in verse 4, then down to a new
  world, where the last shot looks up.

**Arc.** Longest night, then first fire, dawn, golden day, red furnace dusk, electric night, the climb in
the dark, the dawn at the summit, space, an alien dawn. The ending rhymes with the opening: the film opens
looking down from the stars to a dark plain and closes looking up from a fire to the stars.

**Music.** Every line starts on a downbeat and lasts two bars. Cuts sit on those downbeats
(`src/uplift/timing.js`). The tempo drifts from ~81 to ~96 BPM, so nothing uses a fixed BPM.

| Section | Time | Energy |
|---|---|---|
| Intro | 0:00–0:24.5 | guitar alone, quiet |
| Verse 1, stone age (L1–4) | 0:24.5–0:47.8 | builds |
| Verse 2, farming and cities (L5–8) | 0:51.6–1:14.5 | |
| Verse 3, industry (L9–12) | 1:18.1–1:40.1 | |
| Instrumental | 1:40.1–1:54.2 | the loudest guitar |
| Bridge (L13–16) | 1:54.2–2:14.7 | slow, sober |
| Verse 4, information age and space (L17–20) | 2:17.6–2:38.3 | full |
| Outro, the opening again on a new world (L21–22) | 2:43.2–2:56.5 | quiet, as the intro |

## Shots

Times in seconds. `reads` are the timing sheet. Transitions are named at each seam.

### Intro: the longest night

**S01 0.00–12.50** [in: fade from black] Stars, the Milky Way. The camera tilts down from the zenith. A dark
plain rises into frame against a faint indigo afterglow, and a herd of aurochs walks along a far ridge.
- reads: 0.6–4 stars appear with the first notes · 4–9 the tilt, the Milky Way slides up · 9–12.5 the
  horizon and the herd on the ridge.

**S02 12.50–24.53** [cut, the descent continues] Ground level, cold blue night, wind in the grass. A small
band huddles together in the dark with no fire. The camera pushes in. One person stands, picks up two
stones and kneels.
- reads: 12.5–16.5 the band, cold and small · 16.5–20.5 one stands and takes the stones · 20.5–24.5 kneels,
  and the camera arrives at the hands.

### Verse 1: the stone age (firelight against blue night, then dawn)

**S03 L1 24.53–30.36** [cut on action] Close-up, hands strike flint on pyrite: sparks on the beats, tinder
smoulders, a breath, the flame catches and rises. Pull back: firelight finds the faces. The knapper holds
a sharp flake up against the flame.
- reads: 24.5–26.3 sparks · 26.3–27.8 the catch · 27.8–30.3 firelight and the tool.

**S04 L2 30.36–36.21** [crossfade through the fire glow to the horizon glow] Low tracking shot left to
right: walking legs, then the camera lifts to show the band with spears following a herd across the steppe
under a violet pre-dawn sky. The lead hunter points, and the band turns toward the herd.

**S05 L3 36.21–41.88** [cut] Wide, high: one small camp and one small fire on a vast dark plain. A snow squall
blows through, the fire gutters almost to nothing, a figure bends over it to shield it, and it flares back.

**S06 L4 41.88–51.60** [dissolve, night to dawn] A riverbank at dawn. People raise the poles of a hut. A
parent lifts a child onto their shoulders as the sun breaks the horizon (47.5, in the guitar gap after the
line). The sun's glare grows and fills the frame.
- reads: 41.9–45 the hut goes up · 45–47.5 the child is lifted · 47.5–50.2 sunrise · 50.2–51.6 glare.

### Verse 2: farming and cities (gold)

**S07 L5 51.60–57.30** [light flash out of the glare] Side view, backlit morning: two oxen pull an ard plough,
a sower behind scatters seed. On the right a rain cloud stands on the horizon and a figure raises both arms
to it. The rain veil falls from the cloud.

**S08 L6 57.30–62.87** [camera move carries: pan right] Tall grain in the afternoon wind. A reaper cuts
with a sickle and lifts the sheaf. The camera pans right to a waterwheel turning at the river.

**S09 L7 62.87–68.25** [crane up continues] The camera cranes up and back while days pass in seconds: the sun
arcs across the sky, huts multiply, mud-brick walls rise, then towers, a ziggurat, colonnades and domes,
in waves out to the horizon.

**S10 L8 68.25–78.08** [dissolve] Sunset. A line of workers hauls a great stone block on a sledge up a ramp,
stepping on the beats (a work song). A stepped monument and an obelisk stand behind. The block reaches the
top as the line ends (74.5). The sun sets behind the obelisk, smoke drifts across.

### Verse 3: industry (furnace red, then electric night)

**S11 L9 78.08–83.59** [match cut: the obelisk becomes a factory chimney of the same shape] The camera pushes
into a dark engine house. A stoker shovels coal into a firebox that blooms red. Tilt up: the piston drives
the beam, and the flywheel makes its first turn.

**S12 L10 83.59–89.05** [match cut: the flywheel becomes the mill's drive wheel] Changed after Alex's review
of the animatic: the line pictures cogs that spin wool, and steel horses that are automobiles. First bar:
inside a wool mill at dusk, a spinning mule driven by belts from the line shaft; the carriage runs out while
the spindles twist the threads, then runs back while the yarn winds on. Second bar (cut on the middle
downbeat): early automobiles pass a horse-drawn carriage on a road at dusk, and the horse is left behind.

**S13 L11 89.05–94.44** [smoke wipe] Night falls on a city street. A hand throws a knife switch, and a spark
jumps. Streetlights and windows switch on in a wave from near to far, and the dark is pushed to the horizon.

**S14 L12 94.44–101.08** [cut on the beat] A crowd on a field at dusk looks up as an early aircraft takes off
and climbs. The camera tilts up to follow it: the age reaches upward and gets there. (This is MIST's reading
of the line. Change it in review if the line says something else.)

### Instrumental: the loudest guitar

**S15 101.08–106.44** [camera move carries] The camera follows the aircraft up through the clouds. At each
cloud bank it passes through (on the beats at 102.44, 103.80 and 105.14) it comes out as the next age's
aircraft: a 1930s twin-engine propeller airliner, a 1950s four-engine swept-wing jet, then a modern
twin-engine widebody, which climbs above the cloud sea into the night with its navigation lights on and
contrails behind it. (Added at Alex's request.)

**S16 106.44–114.19** [cloud wipe] The stratosphere at night. The lights of cities, roads and rails spread
across the dark continent. At the end a storm rolls in under the camera and the lights go dim.

### Bridge: the climb (cold slate and mud, a dawn line that grows)

**S17 L13 114.19–119.48** [dip to dark through the storm] A marsh before dawn, the rain stops. In the mud in
the foreground, a figure lying face down pushes up and stands.

**S18 L14 119.48–124.24** [cut] A vast dark mountain. A long chain of lanterns winds up its switchbacks,
slow and continuous.

**S19 L15 124.24–129.41** [dissolve, follow one lantern] A fork in the trail. An easy path drops to a warm,
lit valley. The steep path climbs into the wind. The climber looks down at the valley, then turns uphill.

**S20 L16 129.41–137.55** [cut on action] A hand grips a ledge. The climber hauls up onto the summit as dawn
breaks behind the peak, and the camera keeps rising past them into the sky.

### Verse 4: computers, radio, space (black, gold city lights, white sun)

**S21 L17 137.55–142.71** [camera move carries: the sky deepens to space] Orbit. The night Earth with its city
lights and the sunrise on its rim (the album cover). A light sail in the foreground unfurls and catches the
sun.

**S22 L18 142.71–147.97** [match cut: city lights from orbit become city lights through a window] A dark room
at night. Hands on a keyboard, lit blue by a screen (light only, no text). A click. Through the window a
rocket lifts off from the horizon, and the person turns to watch.

**S23 L19 147.97–152.89** [cut on action, follow the rocket up] The night Earth. Rings of faint light ripple
out from the cities around the globe and reach the satellites, which blink in turn.

**S24 L20 152.89–158.10** [cut on the beat] Behind a ship with a great light sail. The sail fills with
sunlight, the ship accelerates toward a bright star, and the Earth shrinks behind it.

**S25 158.10–163.23** [continuous] Stars stream past. A new star brightens, a violet planet with rings and
two moons grows, and the camera drops into its atmosphere in a wash of light (the held chord at 160).

### Outro: again (an alien dawn: violet and teal sky, two moons, a cold sun; the ember returns)

**S26 L21 163.23–170.24** [light dip out of the atmosphere] The same close-up as S03: hands strike stones on
new ground, sparks, the fire catches. Pull back: settlers around the fire. A hand presses a seed into the
soil.

**S27 L22 170.24–176.51** [cut on the beat, as S03 to S04] The same low tracking shot as S04: feet walking
left to right, then the band with the cattle they brought, and a shelter frame raised behind them under the
cold sun and two moons.

**S28 176.51–180.70** [camera move carries] The camera rises and tilts up from the new fire to a sky full of
stars. One small yellow star is home.
- reads: 176.5–178.5 the tilt up · 178.5–179.6 the yellow star · 179.6–180.7 fade to black on the last ring.

[out: fade to black, then a 5-second credit card: the song, its writer, its singer and the album]

## Checks

- An event in every shot: yes (each shot names its change).
- Reads timed: the long-line shots hold one event per two bars. S09 and S16 are time-lapses, so the read is
  the growth itself.
- A transition at every seam: named above. Hard cuts are on downbeats or on action.
- No text anywhere. The animatic burns in a small shot number and timecode for review only.
- The ending rhymes with the opening: S28 against S01, S26 against S03, S27 against S04.

## Final version (2026-11-07 evening)

- Rim light on every silhouette, from each shot's key light; fires light the edges near them.
- Era costumes: furs in the stone age, tunics, robes and head cloths in the ancient world, caps, bowlers and
  aprons in the industrial age, hooded cloaks for the climb, packs and hoods for the settlers.
- Motion blur (four sub-frames per frame, never across a hard cut), 1920 x 1080 at 24 fps.
- The Earth uses NASA's Black Marble 2016 and Blue Marble images.
