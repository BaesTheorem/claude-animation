# private/ (not in git)

Song data for the videos on this branch. Everything here except this file is gitignored: it holds a
copyrighted recording and its lyrics. Nothing in `src/` or `bin/` holds lyric text, and the scripts print
counts and times only. Run each command through `bin/lyricguard -- ...`.

To make `private/uplift/` again (run from the repo root):

1. Audio. Copy track 10 of Alex's "Brighter Than Today: A Secular Solstice" download (WAV) to
   `private/uplift/mix.wav`, and to `assets/uplift.wav` for the renderer.
2. Lyrics. Save the lyrics text from the track's Bandcamp page (humanistculture.bandcamp.com/track/uplift)
   to `private/uplift/lyrics_bandcamp.txt` and build `lyrics.json` (one entry per sung line, `t` = the
   vocal-stem phrase start minus 0.3 s; the song is not on LRCLIB).
3. Stems. `demucs -n htdemucs -d mps --shifts 0 --segment 7 -o private/uplift/stems private/uplift/mix.wav`
4. Beats. `uvx --python 3.12 --from beat-this --with soxr --with soundfile beat_this private/uplift/mix.wav -o private/uplift/mix.beats`
   (no `--dbn`: it needs madmom), then convert to `beat_this.json` (`{"beats": [...], "downbeats": [...]}`).
5. Features and words. `bin/audio-features private/uplift`, then `bin/lyrics-align private/uplift`.
6. Times for the page. `src/uplift/timing.js` holds the beats and the line start and end times (numbers only).
