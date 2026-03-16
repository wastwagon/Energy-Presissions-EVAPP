#!/bin/bash
# Install Prerequisites Script

echo "🔧 Installing Prerequisites for Mobile App Builds"
echo ""

# Check CocoaPods
if command -v pod &> /dev/null; then
    echo "✅ CocoaPods already installed: $(pod --version)"
else
    echo "⏳ Installing CocoaPods..."
    echo "   Run: sudo gem install cocoapods"
    echo "   (You'll need to enter your password)"
fi

# Check Java
if command -v java &> /dev/null && java -version 2>&1 | grep -q "version"; then
    echo "✅ Java already installed: $(java -version 2>&1 | head -1)"
else
    echo "⏳ Java JDK needed"
    echo "   Option 1: brew install openjdk@17"
    echo "   Option 2: Download from https://www.oracle.com/java/technologies/downloads/"
fi

echo ""
echo "After installing prerequisites, run:"
echo "  cd ios && pod install && cd .."
echo "  npm run build:ios    # For iOS"
echo "  npm run build:android # For Android"
