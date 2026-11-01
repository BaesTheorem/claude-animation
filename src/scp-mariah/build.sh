#!/bin/bash
# Build the Mariah Carey containment breach video: the hallway still with an SCP alert banner, over the
# audio from the r/SCPMemes post "Tis the season". Run from the repo root. Needs private/scp-mariah/ (see
# private/README.md). --mix also builds the alternate cut, scored by bin/sfx-mix from src/scp-mariah/breach.sfx.json.
set -euo pipefail
cd "$(dirname "$0")/../.."
mkdir -p out/scp-mariah
chrome="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
prof=$(mktemp -d /tmp/render-XXXXXX)
# --headless=old renders offscreen; --headless=new flashes the screen on macOS.
"$chrome" --headless=old --disable-gpu --no-first-run --user-data-dir="$prof" --hide-scrollbars \
  --force-device-scale-factor=1 --allow-file-access-from-files --window-size=1920,1080 \
  --screenshot=out/scp-mariah/still-alert.png "file://$PWD/src/scp-mariah/caption.html" 2>/dev/null
rm -rf "$prof"
audio=private/scp-mariah/tis-the-season-audio.mp4
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$audio")
ffmpeg -y -v error -loop 1 -framerate 30 -i out/scp-mariah/still-alert.png -i "$audio" -map 0:v -map 1:a \
  -vf format=yuv420p -c:v libx264 -tune stillimage -crf 20 -g 600 -c:a copy -t "$dur" -movflags +faststart \
  out/scp-mariah/mariah-containment-breach.mp4
echo "wrote out/scp-mariah/mariah-containment-breach.mp4 ($dur s)"
if [[ "${1:-}" == "--mix" ]]; then
  bin/sfx-mix src/scp-mariah/breach.sfx.json --still=out/scp-mariah/still-alert.png --out=out/scp-mariah/mariah-breach-mix.mp4
fi
