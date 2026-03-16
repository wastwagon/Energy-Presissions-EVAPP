#!/bin/bash
# Setup Environment for Mobile App Development
# Source this file: source setup-env.sh

eval "$(/opt/homebrew/bin/brew shellenv)"
export PATH="/opt/homebrew/opt/ruby/bin:$PATH"

# Get gem installation directory and add to PATH
GEM_HOME=$(gem env 2>/dev/null | grep "USER INSTALLATION DIRECTORY" | awk '{print $4}')
if [ -n "$GEM_HOME" ]; then
    export PATH="$GEM_HOME/bin:$PATH"
fi

echo "✅ Environment configured"
echo "Ruby: $(ruby --version)"
echo "Pod: $(which pod 2>/dev/null || echo 'not found - run: gem install cocoapods --user-install')"



