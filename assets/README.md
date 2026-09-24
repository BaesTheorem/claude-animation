# assets

Large or third-party files are not in git. Rebuild them:

| path | what | how |
|---|---|---|
| `assets/*.mp3` | the song | copy the track here (see `src/config.js` for the name) |
| `assets/quaternius/` | CC0 Quaternius packs: Universal Base Characters, Universal Animation Library 1 + 2, Modular Character Outfits - Fantasy, Ultimate Animated Animals | `bin/itch-dl https://quaternius.itch.io/<pack> -o assets/quaternius` for the first four (then unzip), and `uvx gdown --folder <Drive link on quaternius.com/packs/ultimateanimatedanimals.html> -O assets/quaternius/animals` |
| `assets/cast/*.glb` | the Artesian Water cast (outfit bodies + base heads + hair, flat role materials) | `blender -b --factory-startup -P tools/build_cast.py -- assets/quaternius assets/cast` |
| `assets/anim/UAL*_Standard.glb` | motion clips | copy `Unreal-Godot/UAL1_Standard.glb` and `UAL2_Standard.glb` out of the two animation packs |
| `assets/animals/*.glb` | cow, bull, horses, dog (smooth-shaded) | `blender -b --factory-startup -P tools/build_animals.py -- assets/quaternius/animals/glTF assets/animals Cow Bull Horse Horse_White Husky` |
| `assets/fonts/` | Kalam, Cabin Sketch (OFL) | in git |

All Quaternius assets are CC0 1.0 (public domain dedication).
