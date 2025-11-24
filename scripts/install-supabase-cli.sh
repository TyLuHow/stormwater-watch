#!/bin/bash

echo "📦 Installing Supabase CLI for WSL/Ubuntu..."
echo ""

# Check if already installed
if command -v supabase &> /dev/null; then
  echo "✅ Supabase CLI is already installed:"
  supabase --version
  echo ""
  echo "To update, run: sudo apt-get update && sudo apt-get install supabase"
  exit 0
fi

# Download and install Supabase CLI
echo "Downloading Supabase CLI v1.137.2..."
wget -qO- https://github.com/supabase/cli/releases/download/v1.137.2/supabase_1.137.2_linux_amd64.deb -O /tmp/supabase.deb

if [ $? -ne 0 ]; then
  echo "❌ Download failed"
  exit 1
fi

echo "Installing Supabase CLI..."
sudo dpkg -i /tmp/supabase.deb

if [ $? -ne 0 ]; then
  echo "❌ Installation failed"
  rm /tmp/supabase.deb
  exit 1
fi

# Clean up
rm /tmp/supabase.deb

# Verify installation
echo ""
echo "✅ Supabase CLI installed successfully!"
echo ""
supabase --version
echo ""
echo "Next steps:"
echo "  1. Run ./scripts/supabase-login.sh to connect to your project"
echo "  2. Use 'supabase db pull' to sync schema from remote"
echo "  3. Use 'supabase db push' to push local changes"
