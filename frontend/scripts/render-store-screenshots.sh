#!/usr/bin/env bash
# Renders Google Play store screenshots at required 9:16 sizes (PNG).
# Phone:  1080×1920  (≥1080px for promo eligibility, within 320–3840)
# 7" tab: 1440×2560 (within 3840 max side)
# 10" tab: 1920×3413 (≥1080 min for 10" slot, within 7680 max)
#
# Usage: ./render-store-screenshots.sh [output_dir]
# Default output: ~/Downloads/clean-motion-store-assets
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HTML_DIR="${SCRIPT_DIR}/store-screenshots"
BASE_URL="file://${HTML_DIR}/store-screenshots.html"
OUT_ROOT="${1:-${HOME}/Downloads/clean-motion-store-assets}"

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
  echo "No Chrome/Chromium found." >&2
  exit 1
fi

# screen: id|filename_slug
SCREENS=(
  "1|01-find-chargers"
  "2|02-live-stations"
  "3|03-wallet-paystack"
  "4|04-active-session"
  "5|05-session-history"
  "6|06-profile-trust"
)

render_device() {
  local name="$1" w="$2" h="$3" subdir="$4"
  local dir="${OUT_ROOT}/${subdir}"
  mkdir -p "$dir"

  for entry in "${SCREENS[@]}"; do
    IFS='|' read -r sid slug <<< "$entry"
    local url="${BASE_URL}?device=${name}&screen=${sid}"
    local tmp="${dir}/.${slug}.tmp.png"
    local final="${dir}/${slug}.png"

    "$CHROME" \
      --headless=new \
      --disable-gpu \
      --hide-scrollbars \
      --force-device-scale-factor=2 \
      --window-size="${w},${h}" \
      --screenshot="$tmp" \
      "$url"

    if command -v sips >/dev/null 2>&1; then
      sips -z "$h" "$w" "$tmp" >/dev/null
    fi
    mv "$tmp" "$final"
    echo "Wrote ${final} (${w}×${h})"
  done
}

mkdir -p "$OUT_ROOT"

echo "=== Phone (1080×1920, 9:16) ==="
render_device "phone" 1080 1920 "phone"

echo "=== 7-inch tablet (1440×2560, 9:16) ==="
render_device "tab7" 1440 2560 "tablet-7in"

echo "=== 10-inch tablet (1920×3413, 9:16) ==="
render_device "tab10" 1920 3413 "tablet-10in"

echo ""
echo "Done. Upload PNGs from: $OUT_ROOT"
echo "Aspect ratio 9:16, PNG, under 8 MB — meets Play Console phone & tablet screenshot rules."
