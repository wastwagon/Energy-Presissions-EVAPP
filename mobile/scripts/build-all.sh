#!/bin/bash

# Build script for both iOS and Android
# Usage: ./scripts/build-all.sh [ios|android|all]

set -e

PLATFORM=${1:-all}

echo "🚀 Building Mobile App for: $PLATFORM"

case $PLATFORM in
    ios)
        ./scripts/build-ios.sh
        ;;
    android)
        ./scripts/build-android.sh
        ;;
    all)
        echo "📱 Building for both platforms..."
        ./scripts/build-android.sh
        echo ""
        echo "⚠️  iOS build requires macOS and Xcode. Skipping..."
        # Uncomment the line below if you're on macOS
        # ./scripts/build-ios.sh
        ;;
    *)
        echo "Usage: ./scripts/build-all.sh [ios|android|all]"
        exit 1
        ;;
esac

echo "✅ Build process completed!"



