#!/bin/bash
set -e

# Simulate GitHub Actions environment
export NODE_ENV=production
export GITHUB_WORKSPACE=$(pwd)
export GITHUB_SHA=$(git rev-parse HEAD)
export GITHUB_REPOSITORY="your-org/your-repo"

echo "🔨 Testing build process..."

# Install dependencies
yarn install --frozen-lockfile

# Build the UI
yarn build:www

# Create release artifact
cd packages/apps/build
tar -czf ../../polkadotjs-ui.tar.gz .
cd ../../..

echo "✅ Build completed! Artifact created at packages/polkadotjs-ui.tar.gz" 