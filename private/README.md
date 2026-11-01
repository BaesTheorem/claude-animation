# private/ (not in git)

Third-party audio for the containment breach video. Everything here except this file is
gitignored, because it holds copyrighted music.

To make `private/scp-mariah/` again (run from the repo root):

1. The audio of the primary cut. It comes from the r/SCPMemes post "Tis the season"
   (https://www.reddit.com/r/SCPMemes/comments/17o3w6f/tis_the_season/), which is a
   v.redd.it video with the id `cr6jyag5egyb1`. yt-dlp asks for a Reddit login for this post,
   but the media files on v.redd.it do not:
   `curl -L -A "Mozilla/5.0" -o private/scp-mariah/tis-the-season-audio.mp4 https://v.redd.it/cr6jyag5egyb1/DASH_AUDIO_128.mp4`
2. The song for the alternate cut.
   `"$HOME/Documents/Exobrain harness/mist-music/bin/unmix" fetch "mariah carey all i want for christmas is you"`,
   then copy `src/source.m4a` from its work folder to `private/scp-mariah/song.m4a`.
