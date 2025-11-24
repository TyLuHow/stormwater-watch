#!/bin/bash

echo "🔐 Connecting to Supabase project..."
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
  echo "❌ Supabase CLI not found"
  echo "Please run ./scripts/install-supabase-cli.sh first"
  exit 1
fi

# Get Supabase access token from environment or prompt
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "⚠️  SUPABASE_ACCESS_TOKEN not set"
  echo ""
  echo "To get your access token:"
  echo "  1. Go to https://supabase.com/dashboard/account/tokens"
  echo "  2. Generate a new access token"
  echo "  3. Set it: export SUPABASE_ACCESS_TOKEN='your-token'"
  echo ""
  echo "For now, attempting to link with service role key..."
  echo ""
fi

# Link to project
echo "Linking to Stormwater Watch project (dhoyfkakvxjxzozlyksq)..."

# Use the project database password
supabase link --project-ref dhoyfkakvxjxzozlyksq --password "[Italy]March180"

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Failed to link to project"
  echo ""
  echo "Alternative: Login with access token"
  echo "  supabase login"
  echo "  (This will open browser to authenticate)"
  exit 1
fi

echo ""
echo "✅ Successfully connected to Stormwater Watch Supabase project!"
echo ""
echo "Available commands:"
echo "  supabase status         - Check local Supabase status"
echo "  supabase db pull        - Pull schema from remote database"
echo "  supabase db push        - Push local migrations to remote"
echo "  supabase db diff        - See schema differences"
echo "  supabase migration new  - Create a new migration"
echo "  supabase storage ls     - List storage buckets"
echo "  supabase functions list - List edge functions"
echo ""
