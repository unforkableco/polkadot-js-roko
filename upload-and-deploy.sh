#!/bin/bash

# Upload and Deploy Script for EC2 (Docker-based deployment)
# This script uploads the deployment script to EC2 and runs the Docker deployment

set -e

# Configuration
EC2_HOST="16.16.67.171"
EC2_USER="ubuntu"
EC2_KEY="/home/dev/temp/unforkable-official.pem"
DOMAIN="roko-explorer.ntfork.com"
RPC_ENDPOINT="ws://13.49.127.240:9944"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting deployment of feature/evm-interface branch to EC2...${NC}"

# Check if key file exists
if [ ! -f "$EC2_KEY" ]; then
    echo -e "${RED}❌ SSH key file not found: $EC2_KEY${NC}"
    exit 1
fi

# Test SSH connection
echo -e "${YELLOW}🔑 Testing SSH connection...${NC}"
if ! ssh -i $EC2_KEY -o StrictHostKeyChecking=no -o ConnectTimeout=10 $EC2_USER@$EC2_HOST "echo 'SSH connection successful'" > /dev/null 2>&1; then
    echo -e "${RED}❌ SSH connection failed. Please check your key and EC2 instance.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ SSH connection successful${NC}"

# Check and install Docker if needed
echo -e "${YELLOW}🐳 Checking Docker installation...${NC}"
if ! ssh -i $EC2_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_HOST "docker --version" > /dev/null 2>&1; then
    echo -e "${YELLOW}📦 Docker not found. Installing Docker...${NC}"
    ssh -i $EC2_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_HOST << 'EOF'
sudo apt update
sudo apt install -y docker.io
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu
EOF
    echo -e "${GREEN}✅ Docker installed successfully${NC}"
    echo -e "${YELLOW}⚠️  Note: You may need to log out and back in for Docker group changes to take effect${NC}"
else
    echo -e "${GREEN}✅ Docker is already installed${NC}"
fi

# Upload deployment script
echo -e "${YELLOW}📤 Uploading deployment script to EC2...${NC}"
scp -i $EC2_KEY -o StrictHostKeyChecking=no deploy.sh $EC2_USER@$EC2_HOST:~/

# Run deployment on EC2
echo -e "${YELLOW}🚀 Running Docker deployment on EC2...${NC}"
ssh -i $EC2_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_HOST << EOF
# Update deployment script configuration for production
sed -i 's/NETWORK_PORT=3000/NETWORK_PORT=80/' deploy.sh
sed -i 's/ws:\/\/localhost:9944/ws:\/\/13.49.127.240:9944/' deploy.sh

# Make executable and run
chmod +x deploy.sh
./deploy.sh
EOF

echo -e "${GREEN}✅ Docker deployment completed!${NC}"
echo ""
echo -e "${GREEN}🌐 Your Roko Explorer is now running on EC2${NC}"
echo -e "${YELLOW}📍 Access points:${NC}"
echo -e "${YELLOW}• Direct IP: http://$EC2_HOST${NC}"
echo -e "${YELLOW}• Domain (if DNS configured): http://$DOMAIN${NC}"
echo ""
echo -e "${YELLOW}📍 Next steps for HTTPS:${NC}"
echo -e "${YELLOW}1. Ensure DNS A record points $DOMAIN to $EC2_HOST${NC}"
echo -e "${YELLOW}2. SSH to server and setup reverse proxy with SSL${NC}"
echo -e "${YELLOW}3. Run: ssh -i $EC2_KEY $EC2_USER@$EC2_HOST${NC}"
echo ""
echo -e "${GREEN}🔧 Useful commands:${NC}"
echo -e "${YELLOW}• View logs: ssh -i $EC2_KEY $EC2_USER@$EC2_HOST 'docker logs -f roko-explorer-container'${NC}"
echo -e "${YELLOW}• Stop app: ssh -i $EC2_KEY $EC2_USER@$EC2_HOST 'docker stop roko-explorer-container'${NC}"
echo -e "${YELLOW}• SSH to server: ssh -i $EC2_KEY $EC2_USER@$EC2_HOST${NC}" 