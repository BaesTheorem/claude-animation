# private/ (not in git)

Song data for the lyric videos on this branch. Everything here except this file is
gitignored, because it holds copyrighted lyrics and audio. Nothing in `src/` or `bin/` holds
lyric text, and the scripts print counts and times only.

To make `private/spark/` again (run from the repo root):

1. Audio. `"$HOME/Documents/Exobrain harness/mist-music/bin/unmix" fetch "fitz and the tantrums spark"`,
   then copy `mix.wav` and `src/source.m4a` from its work folder to `private/spark/`.
2. Stems. `demucs -n htdemucs -d mps --shifts 0 --segment 7 -o private/spark/stems private/spark/mix.wav`
3. Lyrics. `bin/lyrics-fetch spark "Fitz and the Tantrums" "Spark" --duration 198.99`
4. Beats. Run beat_this on `mix.wav` to `beat_this.json` (`{"beats": [...], "downbeats": [...]}`), then
   `bin/audio-features private/spark`.
5. Second opinion (optional). `whisper-cli -m ggml-large-v3.bin -f vocals16k.wav -l en -nfa -dtw large.v3 -ojf -np -of private/spark/whisper_vocals_dtw`
   (`-nfa` matters: with flash attention on, whisper-cli writes no DTW times).
6. Words. `bin/lyrics-align private/spark` (runs mist-vid's forced aligner and bin/lyrics-repair.py).
7. Render. `node render.mjs --page=spark.html --query=real=1 --frames --fps=60 --workers=3`

Run any of these through `bin/lyricguard -- ...` so that a lyric phrase in the output is masked.
