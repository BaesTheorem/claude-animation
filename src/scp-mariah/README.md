# Containment breach

A still of an SCP Foundation corridor with an SCP alert banner, over the opening of
"All I Want for Christmas Is You" as heard from deep inside the facility.

    src/scp-mariah/build.sh          the still and the primary cut
    src/scp-mariah/build.sh --mix    also the alternate cut

Output goes to `out/scp-mariah/`. The audio is in `private/` (see `private/README.md`).

## The two cuts

- `mariah-containment-breach.mp4` (24 s) uses the audio of the r/SCPMemes post "Tis the
  season" without change (the AAC stream is copied).
- `mariah-breach-mix.mp4` (82.5 s) is scored by `bin/sfx-mix` from `breach.sfx.json`. The
  song plays in a concrete cell, passes through a closed door (a 6 dB/octave low-pass, as
  for one partition under the mass law), then goes down a bunker corridor (a measured
  impulse response). Screams and gunfire are dry recordings put in the same corridor at
  different distances. The breach starts with the groove (song 49.8 s); the gunfire starts
  with the bass and drums (54.8 s, 152 BPM); a blast door shuts 8 bars later, and the
  Nine-Tailed Fox announcement plays on the near side of the door.

## Checks on the alternate cut

- Shazam identifies the clean song (positive control) and the muffled intro of the mix.
  Under the gunfire it does not identify the song at any level that was tried, also with
  the effects 9 dB lower. Thus that test cannot tell those mixes apart.
- Loudness is -17.3 LUFS integrated, true peak -3.1 dBTP (ffmpeg ebur128).
