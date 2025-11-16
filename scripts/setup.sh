#!/bin/bash

echo "Setting up Stormwater Watch platform..."

# Install dependencies
echo "Installing dependencies..."
pnpm install

# Run migrations
echo "Running database migrations..."
pnpm exec prisma migrate deploy

# Seed database
echo "Seeding database..."
pnpm exec prisma db seed

# Build
echo "Building application..."
pnpm build

echo "✓ Setup complete! Run 'pnpm dev' to start development server."
