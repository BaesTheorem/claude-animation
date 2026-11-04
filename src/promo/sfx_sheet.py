#!/usr/bin/env python3
"""Write src/promo/promo.sfx.json, the promo's soundtrack: the music edit and every trailer hit, placed on the cut.

    python3 src/promo/sfx_sheet.py && bin/sfx-mix src/promo/promo.sfx.json --wav=out/check/mix.wav

Reads the downbeats from music.json (D[12] is the drop, D[23] the end card) and each sound's hit time ("land",
seconds into the file) from sounds.json, so a cue is written as "this sound hits on that downbeat". The music is
the track's intro up to the drop (muffled and faded over the bar before it), then the climax from music.json
"climax_from" to the end. Change the placement here, not in the JSON it writes.
"""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
M = json.loads((HERE / "music.json").read_text())
S = json.loads((HERE / "sounds.json").read_text())
LAND = {k: v["land"] for k, v in S["sfx"].items()}
# long rings trimmed so stacked hits stay accents (seconds kept, fade); the end card keeps them whole
TAIL = {"braam_long": (4.0, 1.5), "explosion": (3.5, 1.5), "bass_boom": (3.5, 1.2), "hit_hard": (4.0, 1.5), "braam": (4.5, 1.5),
        "bay_hit": (4.5, 1.5), "boom": (3.0, 1.0), "hit_dramatic": (3.0, 1.0)}
d, cues = M["D"], []


def c(key, at, gain, duck=None, rel=.6, tail=True, stop_early=None):
    """`key` hits at video time `at`. duck: dB the music dips under it. stop_early: end that many seconds before `at`."""
    t = at - LAND[key]
    q = {"t": round(max(0.0, t), 3), "src": f"{key}.mp3", "gain": gain}
    if t < 0: q["offset"] = round(-t, 3)                     # starts before the video does: skip into the file
    if tail and key in TAIL: q.update(dur=TAIL[key][0], fade=TAIL[key][1])
    if stop_early: q.update(dur=round(LAND[key] - stop_early, 3), fade=.04)
    if duck: q.update(duck=duck, duck_at=round(min(LAND[key], at), 3), duck_release=rel)
    cues.append(q)


c("reverse_cymbal", d[0], .5); c("hit_hard", d[0], .95, 4, .8); c("braam", d[0], .8); c("subdrop", d[0], .75)
c("hit_dramatic", d[1], .6, 3)
c("boom", d[2], .6, 3); c("whoosh_slide", d[2] + .25, .5)
c("whoosh", d[3] + .2, .45); c("bass_boom", d[3], .75, 4); c("braam_hit", d[3], .7)
c("whoosh", d[5] + .2, .45); c("hit_hard", d[5], .85, 4, .8); c("braam", d[5], .7)
c("hit_dramatic", d[7], .6, 3)
for i in range(6): c("chop", d[7] + .2 + i * .09, .22)       # the standings rows sliding in
c("boom", d[8], .4)
c("bay_hit", d[9], .6, 3)
c("hit_dramatic", d[10] + .1, .35)
c("riser_long", d[12], .32, stop_early=.18)                    # builds from the bye race and stops short: a breath before the drop
c("boom", d[11], .5)
step = (d[12] - d[11]) * .62 / 5
for k in range(5): c("chop", d[11] + .1 + k * step, .3)        # the five logo pairs
c("hit_dramatic", (d[11] + d[12]) / 2, .45)
c("reverse_bass", d[12], .7, stop_early=.18); c("riser_slam", d[12], .85)
c("hit_hard", d[12], 1.0, 6, .9); c("explosion", d[12], .55); c("subdrop", d[12], .9); c("braam_long", d[12], .7)
c("hit_dramatic", d[13], .55, 3)
for k in (14, 16):
    c("boom", d[k], .65, 3); c("whoosh_slide", d[k] + .25, .45)
for k in (15, 17, 19):
    c("hit_dramatic", d[k] + .25, .35)                         # the captions
c("whoosh", d[18] + .2, .45); c("hit_hard", d[18], .9, 5, .8); c("braam_hit", d[18], .7)
c("boom", d[20], .6, 3)
for i in range(9): c("chop", d[20] + .12 + i * .1, .18)       # the lineup rows
c("hit_dramatic", d[21] + .05, .45)
c("bass_boom", d[22], .6, 3)
c("reverse_cymbal", d[23], .5); c("hit_hard", d[23], 1.0, 4, 1.0, tail=False); c("braam", d[23], .9, tail=False); c("subdrop", d[23], .9)
c("explosion", d[23], .45, tail=False); c("braam_long", d[23], .6, tail=False)
c("hit_dramatic", d[23] + 1.3, .4)
cues.sort(key=lambda q: q["t"])

track = f"assets/promo/music/{S['music']['file']}"
sheet = {"music": [{"src": track, "from": 0, "to": round(d[12] - .03, 3), "at": 0, "fade_out": .08},
                   {"src": track, "from": round(M["climax_from"] - .02, 3), "at": round(d[12] - .02, 3), "fade_in": .005}],
         "automation": [{"type": "lowpass", "t0": d[11], "t1": round(d[12] - .03, 3), "f0": 14000, "f1": 220},
                        {"type": "gain", "t0": round(d[11] + .35, 3), "t1": round(d[12] - .03, 3), "db0": 0, "db1": -42}],
         "music_gain": 1.0, "sfx_gain": .5, "duration": M["dur"], "sfx_dir": "assets/promo/sfx", "seed": 9,
         "master": {"lufs": -13, "ceiling": -1.0}, "cues": cues}
(HERE / "promo.sfx.json").write_text(json.dumps(sheet, indent=1))
print(f"wrote promo.sfx.json: {len(cues)} cues, {M['dur']} s")
