#!/bin/bash
# Install CocoaPods with Ruby fix

echo "🔧 Installing CocoaPods..."

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "⚠️  Homebrew not found. Installing..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Install Ruby via Homebrew
echo "📦 Installing Ruby..."
brew install ruby

# Add Ruby to PATH
RUBY_PATH="/opt/homebrew/opt/ruby/bin"
if [[ ":$PATH:" != *":$RUBY_PATH:"* ]]; then
    echo "export PATH=\"$RUBY_PATH:\$PATH\"" >> ~/.zshrc
    export PATH="$RUBY_PATH:$PATH"
fi

# Verify Ruby version
echo "✅ Ruby version: $(ruby --version)"

# Install CocoaPods
echo "📦 Installing CocoaPods..."
gem install cocoapods

echo "✅ CocoaPods installed!"
echo ""
echo "Next steps:"
echo "  cd ios"
echo "  pod install"
echo "  cd .."
echo "  npm run build:ios"
