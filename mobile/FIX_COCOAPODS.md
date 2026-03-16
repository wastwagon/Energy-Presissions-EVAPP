# Fix CocoaPods Installation - Ruby Version Issue

## Problem
Your system Ruby is version 2.6.10, but CocoaPods requires Ruby >= 3.1.0.

## Solution Options

### Option 1: Install Ruby via Homebrew (Recommended)

```bash
# Install Homebrew if not installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Ruby
brew install ruby

# Add to PATH (add to ~/.zshrc)
echo 'export PATH="/opt/homebrew/opt/ruby/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Install CocoaPods
gem install cocoapods
```

### Option 2: Use rbenv (Ruby Version Manager)

```bash
# Install rbenv
brew install rbenv ruby-build

# Install Ruby 3.1+
rbenv install 3.1.0
rbenv global 3.1.0

# Add to shell config
echo 'eval "$(rbenv init - zsh)"' >> ~/.zshrc
source ~/.zshrc

# Install CocoaPods
gem install cocoapods
```

### Option 3: Use System Ruby with Older CocoaPods

```bash
# Install older compatible version
sudo gem install cocoapods -v 1.11.3
```

### Option 4: Skip CocoaPods - Use Xcode Directly

Since you have Xcode installed, you can build iOS without CocoaPods:

1. Open Xcode
2. File → Open → Navigate to `mobile/ios/EVChargingTemp.xcworkspace`
3. If workspace doesn't exist, open `EVChargingTemp.xcodeproj`
4. Xcode will handle dependencies automatically
5. Product → Archive to build

## Quick Fix (Try This First)

```bash
# Install Homebrew Ruby
brew install ruby

# Update PATH
export PATH="/opt/homebrew/opt/ruby/bin:$PATH"

# Verify Ruby version
ruby --version  # Should show 3.x.x

# Install CocoaPods
gem install cocoapods

# Install iOS dependencies
cd /Users/OceanCyber/Downloads/EnergyPresissionsEVAP/mobile/ios
pod install
```

## After Fixing

Once CocoaPods is installed:

```bash
cd /Users/OceanCyber/Downloads/EnergyPresissionsEVAP/mobile/ios
pod install
cd ..
npm run build:ios
```



