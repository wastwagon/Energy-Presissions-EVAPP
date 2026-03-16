#!/bin/bash
# Complete Setup Commands - Run these in order

set -e

echo "🚀 Complete Mobile App Setup"
echo ""

# Step 1: Add Homebrew to PATH
echo "📦 Step 1: Setting up Homebrew..."
eval "$(/opt/homebrew/bin/brew shellenv)"
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
echo 'export PATH="/opt/homebrew/opt/ruby/bin:$PATH"' >> ~/.zprofile
source ~/.zprofile

# Step 2: Install Ruby
echo ""
echo "📦 Step 2: Installing Ruby..."
brew install ruby

# Step 3: Update PATH for Ruby
export PATH="/opt/homebrew/opt/ruby/bin:$PATH"
echo "✅ Ruby version: $(ruby --version)"

# Step 4: Install CocoaPods
echo ""
echo "📦 Step 4: Installing CocoaPods..."
gem install cocoapods

# Step 5: Install iOS dependencies
echo ""
echo "📦 Step 5: Installing iOS dependencies..."
cd "$(dirname "$0")"
cd ios
pod install
cd ..

echo ""
echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo "  iOS:    npm run build:ios"
echo "  Android: brew install openjdk@17 && npm run build:android"



