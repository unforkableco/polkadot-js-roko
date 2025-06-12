#!/bin/bash

# Upload and Deploy Script for EC2
# This script uploads the app to EC2 and runs the deployment

set -e

# Configuration
EC2_HOST="16.16.67.171"
EC2_USER="ubuntu"
EC2_KEY="/home/dev/temp/unforkable-official.pem"
REMOTE_DIR="/home/ubuntu/polkadot-apps"

echo "🚀 Starting upload and deployment to EC2..."

# Create a temporary directory for upload
TEMP_DIR=$(mktemp -d)
echo "📁 Created temporary directory: $TEMP_DIR"

# Copy app files to temp directory (excluding node_modules and build)
echo "📋 Preparing files for upload..."
rsync -av --exclude 'node_modules' --exclude '.git' --exclude 'build' --exclude 'packages/*/build' . $TEMP_DIR/

# Copy deployment script
cp deploy.sh $TEMP_DIR/

# Upload files to EC2
echo "📤 Uploading files to EC2..."
rsync -avz -e "ssh -i $EC2_KEY -o StrictHostKeyChecking=no" $TEMP_DIR/ $EC2_USER@$EC2_HOST:$REMOTE_DIR/

# Make deployment script executable and run it
echo "🚀 Running deployment on EC2..."
ssh -i $EC2_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_HOST << 'EOF'
cd /home/ubuntu/polkadot-apps
chmod +x deploy.sh
./deploy.sh
EOF

# Clean up temp directory
rm -rf $TEMP_DIR

echo "✅ Upload and deployment completed!"
echo ""
echo "🌐 Your Polkadot-JS Apps should now be deploying on EC2"
echo "📍 Next steps:"
echo "1. Create DNS A record (see instructions below)"
echo "2. SSH to your server and run: sudo certbot --nginx -d roko-explorer.ntfork.com"
echo "3. Access your app at: https://roko-explorer.ntfork.com" 