# assets/tex (images not in git)

`*.png` and `*.jpg` here are gitignored. All of them are NASA imagery in the public domain. To get them
back (run from the repo root):

```bash
UA="exobrain-harness/1.0 (+https://github.com/BaesTheorem/exobrain-harness)"
B=https://assets.science.nasa.gov/content/dam/science/esd/eo/images
curl -sL -A "$UA" -o assets/tex/BlackMarble_2016_3km.jpg "$B/imagerecords/144000/144898/BlackMarble_2016_3km.jpg"
sips -Z 8192 assets/tex/BlackMarble_2016_3km.jpg --out assets/tex/BlackMarble_2016_8k.jpg
curl -sL -A "$UA" -o assets/tex/bluemarble_200412_5400.jpg "$B/bmng/bmng-topography-bathymetry/december/world.topo.bathy.200412.3x5400x2700.jpg"
```

- `BlackMarble_2016_8k.jpg`: NASA Earth Observatory, "Earth at Night" 2016 (Black Marble), downsized to 8192 x 4096.
- `bluemarble_200412_5400.jpg`: NASA Blue Marble Next Generation with topography and bathymetry, December 2004.

`src/uplift/ch5_space.js` loads both for the Earth in verse 4. (The 2026-11-07 animatic used two textures
from the three.js examples instead; the three.js repo records no source or licence for them, so they are gone.)
