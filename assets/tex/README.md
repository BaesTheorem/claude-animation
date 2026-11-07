# assets/tex (images not in git)

`*.png` and `*.jpg` here are gitignored. To get them back (run from the repo root):

```bash
for f in earth_lights_2048.png earth_atmos_2048.jpg; do
  curl -sL -A "exobrain-harness/1.0 (+https://github.com/BaesTheorem/exobrain-harness)" \
    -o assets/tex/$f "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/$f"
done
```

They come from the three.js examples (`examples/textures/planets`). They look like NASA's Blue Marble and
Earth at Night imagery, but the three.js repo records no source or licence for them (checked 2026-11-07).
Before anything is published, replace them with NASA's own Black Marble and Blue Marble files, which are
public domain. `src/uplift/ch5_space.js` loads them for the Earth in verse 4.
