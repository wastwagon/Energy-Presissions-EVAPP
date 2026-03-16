#!/bin/bash
# Copy splash.gif from project root to WebViewGold XcodeSourceCode
# Run from project root: ./scripts/apply-splash.sh
# Place splash.gif in the project root before running

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SPLASH="$PROJECT_ROOT/splash.gif"

# WebViewGold XcodeSourceCode (sibling folder Energy-Presissions-EVAPP-main)
XCODE_SOURCE="$PROJECT_ROOT/../Energy-Presissions-EVAPP-main/XcodeSourceCode"

if [ ! -f "$SPLASH" ]; then
  echo "Error: splash.gif not found in project root ($PROJECT_ROOT)"
  echo "Please add splash.gif to the project root and run again."
  exit 1
fi

if [ ! -d "$XCODE_SOURCE" ]; then
  echo "Error: XcodeSourceCode not found at $XCODE_SOURCE"
  exit 1
fi

cp "$SPLASH" "$XCODE_SOURCE/splash.gif"
echo "Copied splash.gif -> $XCODE_SOURCE/splash.gif"
echo "Done. WebViewGold will use this splash."
