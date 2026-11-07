"""Repair line boundaries where forced alignment let two lines claim the same sung words.

    "$HOME/Documents/Exobrain harness/mist-vid/.venv/bin/python" bin/lyrics-repair.py private/spark

Runs in mist-vid's virtualenv (torch, torchaudio). bin/lyrics-align calls it after the aligner.
It always starts from words_final.before_repair.json (saved on the first run), so it never
compounds its own edits.

A boundary is bad when the next line's first word starts less than 0.12 s after the previous
line's last word. Which side is wrong is decided by the LRC time of the next line (human taps,
which lead the voice by about 0.25 s on this song):
    - the next line starts more than 0.1 s before its LRC time: its first words caught the
      previous line's tail, so the next line is aligned again with its window opened just
      after the previous line's last onset;
    - otherwise the previous line ran long, so it is aligned again with its window closed
      just before the next line's first onset.
A new row is kept only if every word got a time and the row's first word stays within
[LRC - 0.2, LRC + 0.7] s. The LRC is then not an independent judge for the repaired lines;
bin/lyrics-align reports them apart.

Prints row ids, times and scores only (no word text).
"""
import copy
import json
import shutil
import sys
from pathlib import Path

MIST_VID = Path.home() / "Documents" / "Exobrain harness" / "mist-vid"
sys.path.insert(0, str(MIST_VID))


def main() -> None:
    import numpy as np
    import soundfile as sf
    import torch
    import torchaudio
    from mist_vid import align as AL
    from torchaudio.pipelines import MMS_FA as bundle

    d = Path(sys.argv[1])
    work = d / "mv" / "work"
    wf = work / "words_final.json"
    backup = work / "words_final.before_repair.json"
    if not backup.exists():
        shutil.copy(wf, backup)
    doc = json.loads(backup.read_text())
    words = doc["words"]
    rows = json.loads((work / "lyrics_rows.json").read_text())["rows"]
    y, sr = sf.read(str(d / "stems" / "htdemucs" / "mix" / "vocals.wav"), dtype="float32")
    y = y.mean(1) if y.ndim == 2 else y
    wav = torchaudio.functional.resample(torch.from_numpy(y)[None], sr, AL.SR)
    model = bundle.get_model(with_star=True)
    model.eval()
    labels = {c: i for i, c in enumerate(bundle.get_labels(star="*"))}
    align_rows = AL._align_rows  # noqa: SLF001 -- mist-vid's per-row aligner, reused as is

    by: dict[int, list] = {}
    for w in words:
        by.setdefault(w["row"], []).append(w)
    order = sorted(by)
    repaired = []
    for a, b in zip(order, order[1:], strict=False):
        last, first, lrc = max(w["t0"] for w in by[a]), by[b][0]["t0"], rows[b]["t"]
        if first >= last + 0.12:
            continue
        if first < lrc - 0.1:
            side, r = "next", b
            got = align_rows(rows, wav, model, labels, only={b}, starts={b: last + 0.2}, pre=0.12)
            band = (lrc - 0.2, lrc + 0.7)
        else:
            side, r = "prev", a
            rr = copy.deepcopy(rows)
            rr[a + 1]["t"] = first - 0.02 - 0.25   # _align_rows closes the window at the next row's t + 0.25
            got = align_rows(rr, wav, model, labels, only={a})
            band = (rows[a]["t"] - 0.2, rows[a]["t"] + 0.7)
        got = [w for w in got if w["row"] == r]
        ok = bool(got) and all(w["t0"] is not None for w in got) and band[0] <= got[0]["t0"] <= band[1]
        if side == "prev" and ok:
            ok = max(w["t0"] for w in got) < first - 0.05
        so = float(np.mean([w["score"] for w in by[r]]))
        sn = float(np.mean([w["score"] for w in got])) if got else 0.0
        print(f"r{a:02d}|r{b:02d} overlap {first - last:+.2f}s, fix {side} r{r:02d}: first {by[r][0]['t0']:.2f} -> "
              f"{got[0]['t0'] if got and got[0]['t0'] is not None else float('nan'):.2f}, score {so:.3f} -> {sn:.3f}: "
              f"{'kept' if ok else 'rejected'}")
        if ok:
            for w in by[r]:
                src = next(x for x in got if x["w"] == w["w"])
                w.update({k: src[k] for k in ("t0", "t1", "score", "chars", "parts")})
                w["repaired"] = True
            repaired.append(r)
    for ws in by.values():
        for a_, b_ in zip(ws, ws[1:], strict=False):
            if b_["t0"] <= a_["t0"]:
                b_["t0"] = round(a_["t0"] + 0.04, 3)
            if a_["t1"] > b_["t0"]:
                a_["t1"] = b_["t0"]
    doc["repaired_rows"] = repaired
    wf.write_text(json.dumps(doc, indent=0))
    print(f"repaired rows: {repaired}")


if __name__ == "__main__":
    main()
