#!/usr/bin/env bash
# Renders play-feature-graphic.html to a 1024×500 PNG via Chrome headless.
# Uses the same logo and design tokens as the React app (see HTML comments).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HTML="file://${SCRIPT_DIR}/play-feature-graphic.html"
OUT="${1:-${HOME}/Downloads/clean-motion-play-feature-graphic.png}"

CHROME=""
for c in \
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  "/Applications/Chromium.app/Contents/MacOS/Chromium" \
  "/usr/bin/google-chrome" \
  "/usr/bin/chromium" \
  "/usr/bin/chromium-browser"
do
  if [[ -x "$c" ]]; then
    CHROME="$c"
    break
  fi
done

if [[ -z "$CHROME" ]]; then
  echo "No Chrome/Chromium found. Install Google Chrome or set CHROME path." >&2
  exit 1
fi

mkdir -p "$(dirname "$OUT")"

# --window-size: viewport; screenshot matches viewport for file:// single page
"$CHROME" \
  --headless=new \
  --disable-gpu \
  --hide-scrollbars \
  --force-device-scale-factor=2 \
  --window-size=1024,500 \
  --screenshot="$OUT" \
  "$HTML"

echo "Wrote $OUT (1024×500 logical; @2x device scale for sharper PNG — resize if Play requires exact pixels)"
# Play wants 1024x500 file dimensions — Chrome saves at 2x = 2048×1000. Resize down with sips on macOS:
if command -v sips >/dev/null 2>&1; then
  sips -z 500 1024 "$OUT" >/dev/null
  echo "Resized to exactly 1024×500 with sips for Google Play."
fi
