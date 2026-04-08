#!/bin/bash
# Copy newlog.png from project root to frontend, mobile, and Android/iOS assets
# Run from project root: ./scripts/apply-newlog.sh
# Place newlog.png in the project root before running

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOGO="$PROJECT_ROOT/newlog.png"

if [ ! -f "$LOGO" ]; then
  echo "Error: newlog.png not found in project root ($PROJECT_ROOT)"
  echo "Please add newlog.png to the project root and run again."
  exit 1
fi

echo "Applying newlog.png..."

# Frontend (web)
cp "$LOGO" "$PROJECT_ROOT/frontend/public/newlog.png"
echo "  -> frontend/public/newlog.png"

# Mobile assets
cp "$LOGO" "$PROJECT_ROOT/mobile/src/assets/newlog.png"
echo "  -> mobile/src/assets/newlog.png"

# Android splash (resize for each density)
for density in mdpi hdpi xhdpi xxhdpi xxxhdpi; do
  size=48
  [ "$density" = "hdpi" ] && size=72
  [ "$density" = "xhdpi" ] && size=96
  [ "$density" = "xxhdpi" ] && size=144
  [ "$density" = "xxxhdpi" ] && size=192
  dir="$PROJECT_ROOT/mobile/android/app/src/main/res/drawable-$density"
  if [ -d "$dir" ]; then
    sips -s format png -z $size $size "$LOGO" --out "$dir/splashscreen_logo.png" 2>/dev/null
    echo "  -> $dir/splashscreen_logo.png"
  fi
done

# iOS splash
SPLASH="$PROJECT_ROOT/mobile/ios/EVChargingTemp/Images.xcassets/SplashScreenLegacy.imageset/SplashScreenLegacy.png"
if [ -d "$(dirname "$SPLASH")" ]; then
  sips -s format png -z 1024 1024 "$LOGO" --out "$SPLASH" 2>/dev/null
  echo "  -> $SPLASH"
fi

# WebViewGold assets
mkdir -p "$PROJECT_ROOT/EnergyPresissionsEVAPP/assets"
cp "$LOGO" "$PROJECT_ROOT/EnergyPresissionsEVAPP/assets/newlog.png"
echo "  -> EnergyPresissionsEVAPP/assets/newlog.png"

echo "Done. newlog.png applied to all targets."
