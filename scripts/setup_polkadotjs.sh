#!/bin/bash

set -e  # Exit immediately if any command fails
export DEBIAN_FRONTEND=noninteractive

# Variables
GITHUB_REPO="unforkableco/polkadot-js"
APP_DIR="/opt/polkadotjs"
IMAGE_NAME="polkadotjs-app"
# WS_URL passed by GitHub Action

# Ensure RPC URL is provided
if [ -z "$WS_URL" ]; then
  echo "❌ ERROR: RPC URL is required!"
  exit 1
fi

echo "🚀 Starting Polkadot.js Apps Setup..."
echo "🔗 Using RPC URL: $WS_URL"

# Update system packages
echo "🔄 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install dependencies
echo "📦 Installing dependencies..."
sudo apt install -y docker.io git curl

# Ensure Docker service is running
echo "🐳 Ensuring Docker is running..."
sudo systemctl enable --now docker

# ⚡ Fix Memory Issues: Add Swap Space (1GB)
echo "🛠 Adding Swap Space..."
SWAPFILE="/swapfile"
if [ ! -f "$SWAPFILE" ]; then
  sudo fallocate -l 1G $SWAPFILE
  sudo chmod 600 $SWAPFILE
  sudo mkswap $SWAPFILE
  sudo swapon $SWAPFILE
  echo "$SWAPFILE none swap sw 0 0" | sudo tee -a /etc/fstab
  echo "✅ Swap Space Added."
else
  echo "✅ Swap Space already exists."
fi

# Clone Polkadot.js Apps repository
echo "⬇️ Cloning Polkadot.js Apps repository..."
sudo mkdir -p $APP_DIR
sudo chown -R ubuntu:ubuntu $APP_DIR

if [ ! -d "$APP_DIR/.git" ]; then
  git clone --depth 1 https://github.com/$GITHUB_REPO.git $APP_DIR
else
  cd $APP_DIR && git pull
fi

# Move to project directory
cd $APP_DIR

# 🛠 Fix Memory Issues: Limit Node.js Memory Usage
export NODE_OPTIONS="--max-old-space-size=512"

# Build the Docker image
echo "🐳 Building the Docker image..."
sudo docker build --memory=1g -t $IMAGE_NAME -f docker/Dockerfile .

# Stop and remove old container (if exists)
echo "🛑 Stopping old container (if exists)..."
sudo docker stop $IMAGE_NAME || true
sudo docker rm $IMAGE_NAME || true

# Run Polkadot.js container with the RPC URL
echo "🚀 Running Polkadot.js container..."
sudo docker run -d -p 80:80 --memory=1g --name $IMAGE_NAME -e WS_URL="$WS_URL" $IMAGE_NAME

echo "✅ Polkadot.js Apps setup complete!"
