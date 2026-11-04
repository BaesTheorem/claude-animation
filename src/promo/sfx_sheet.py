#!/usr/bin/env python3
"""Write src/promo/promo.sfx.json, the promo's soundtrack: the music and every trailer hit, placed on the cut.

    python3 src/promo/sfx_sheet.py && bin/sfx-mix src/promo/promo.sfx.json --wav=out/check/mix.wav

Reads the downbeats and the shot plan (bars per shot) from music.json and each sound's hit time ("land", seconds
into the file) from sounds.json, so a cue is written as "this sound hits when that shot starts". The track plays
whole from music.json "lead"; its own drum build leads into the drop. Change the placement here, not in the JSON.
"""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
M = json.loads((HERE / "music.json").read_text())
S = json.loads((HERE / "sounds.json").read_text())
LAND = {k: v["land"] for k, v in S["sfx"].items()}
BAR = M["bar"]
ST, i = {}, M.get("first", 0)
for sh in M["shots"]:
    ST[sh["id"]] = M["D"][i]
    i += sh["bars"] or 0
# long rings trimmed so stacked hits stay accents (seconds kept, fade); the end card keeps them whole
TAIL = {"braam_long": (4.0, 1.5), "explosion": (3.5, 1.5), "bass_boom": (3.5, 1.2), "hit_hard": (4.0, 1.5), "braam": (4.5, 1.5),
        "bay_hit": (4.5, 1.5), "boom": (3.0, 1.0), "hit_dramatic": (3.0, 1.0)}
cues = []


def c(key, at, gain, duck=None, rel=.6, tail=True, stop_early=None):
    """`key` hits at video time `at`. duck: dB the music dips under it. stop_early: end that many seconds before `at`."""
    t = at - LAND[key]
    q = {"t": round(max(0.0, t), 3), "src": f"{key}.mp3", "gain": gain}
    if t < 0: q["offset"] = round(-t, 3)                     # starts before the video does: skip into the file
    if tail and key in TAIL: q.update(dur=TAIL[key][0], fade=TAIL[key][1])
    if stop_early: q.update(dur=round(LAND[key] - stop_early, 3), fade=.04)
    if duck: q.update(duck=duck, duck_at=round(min(LAND[key], at), 3), duck_release=rel)
    cues.append(q)


c("reverse_cymbal", ST["S1"], .55); c("hit_hard", ST["S1"], .95, 4, .8); c("braam", ST["S1"], .8); c("subdrop", ST["S1"], .75)
c("hit_dramatic", ST["S1"] + 2 * BAR, .6, 3)                  # #1 vs #2
c("boom", ST["S2"], .7, 3); c("whoosh_slide", ST["S2"] + .25, .5)
c("whoosh", ST["S3"] + .2, .45); c("bass_boom", ST["S3"], .75, 4); c("braam_hit", ST["S3"], .7)
c("hit_dramatic", ST["S3"] + BAR, .35)                        # the streak ribbon
c("whoosh", ST["S4"] + .2, .45); c("hit_hard", ST["S4"], .85, 4, .8); c("braam", ST["S4"], .7)
c("hit_dramatic", ST["S4"] + BAR, .35)
c("hit_dramatic", ST["S5"], .6, 3)
for k in range(6): c("chop", ST["S5"] + .2 + k * .16, .22)   # the standings rows sliding in
c("boom", ST["S5"] + 1.3, .45)                                 # the bye line
c("hit_dramatic", ST["S5"] + BAR * 1.5, .3)
c("bay_hit", ST["S6"], .6, 3)
c("hit_dramatic", ST["S6"] + BAR * 2 + .1, .4)                 # the swing slabs
drop, n = ST["S8"], 5
c("boom", ST["S7"], .55); c("hit_dramatic", ST["S7"] + BAR, .5)
first = BAR * 2; step = (drop - ST["S7"] - 1.1 - first) / n
for k in range(n): c("chop", ST["S7"] + first + k * step, .32)  # the five logo pairs
c("riser_long", drop, .35, stop_early=.18)                     # builds under the drum break and stops short: a breath
c("reverse_bass", drop, .7, stop_early=.18); c("riser_slam", drop, .85)
c("hit_hard", drop, 1.0, 6, .9); c("explosion", drop, .55); c("subdrop", drop, .9); c("braam_long", drop, .7)
c("hit_dramatic", ST["S8"] + BAR, .55, 3)                      # the center clip
for s in ("S9", "S10"):
    c("boom", ST[s], .65, 3); c("whoosh_slide", ST[s] + .25, .45)
for s in ("S9", "S10", "S11"):
    c("hit_dramatic", ST[s] + BAR + .25, .35)                  # the captions
c("whoosh", ST["S11"] + .2, .45); c("hit_hard", ST["S11"], .9, 5, .8); c("braam_hit", ST["S11"], .7)
c("boom", ST["S12"], .6, 3)
for k in range(9): c("chop", ST["S12"] + .15 + k * .14, .18)  # the lineup rows
c("hit_dramatic", ST["S12"] + BAR * 1.5, .45)
c("bass_boom", ST["S13"], .6, 3)
c("reverse_cymbal", ST["S14"], .5); c("hit_hard", ST["S14"], .95, 4, .9); c("braam", ST["S14"], .85); c("subdrop", ST["S14"], .85)
c("hit_dramatic", ST["S14"] + 1.3, .4)                         # the kickoff slab
end = M["song_end"]                                            # the track stops here: a last hit rings out under the end card
c("hit_hard", end, .8, tail=False); c("braam_long", end, .55, tail=False); c("explosion", end, .4, tail=False)
cues.sort(key=lambda q: q["t"])

track = f"assets/promo/music/{S['music']['file']}"
sheet = {"music": [{"src": track, "from": 0, "at": M["lead"], "fade_out": .12}],
         "automation": [{"type": "gain", "t0": round(drop - .5, 3), "t1": round(drop - .03, 3), "db0": 0, "db1": -16}],
         "music_gain": 1.0, "sfx_gain": .5, "duration": M["dur"], "sfx_dir": "assets/promo/sfx", "seed": 9,
         "master": {"lufs": -13, "ceiling": -1.0}, "cues": cues}
(HERE / "promo.sfx.json").write_text(json.dumps(sheet, indent=1))
print(f"wrote promo.sfx.json: {len(cues)} cues, {M['dur']} s; drop at {drop:.2f}, end card at {ST['S14']:.2f}")
