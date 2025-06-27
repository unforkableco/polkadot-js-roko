#!/bin/bash

# Deployment script for feature/evm-interface branch
# Run this script on your EC2 instance

set -e

# Configuration variables
REPO_URL="https://github.com/unforkableco/polkadot-js-roko.git"
BRANCH="feature/evm-interface"
APP_NAME="roko-explorer"
CONTAINER_NAME="roko-explorer-container"
PORT=80
NETWORK_PORT=3000

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting deployment of ${BRANCH} branch${NC}"

# Step 1: Stop and remove existing container
echo -e "${YELLOW}📦 Stopping existing container...${NC}"
if docker ps -a --format 'table {{.Names}}' | grep -q ${CONTAINER_NAME}; then
    docker stop ${CONTAINER_NAME} || true
    docker rm ${CONTAINER_NAME} || true
    echo -e "${GREEN}✅ Existing container stopped and removed${NC}"
else
    echo -e "${YELLOW}ℹ️  No existing container found${NC}"
fi

# Step 2: Clean up old images
echo -e "${YELLOW}🧹 Cleaning up old images...${NC}"
docker image prune -f

# Step 3: Clone or update repository
if [ -d "polkadot-js-roko" ]; then
    echo -e "${YELLOW}📂 Updating existing repository...${NC}"
    cd polkadot-js-roko
    git fetch origin
    git checkout ${BRANCH}
    git pull origin ${BRANCH}
else
    echo -e "${YELLOW}📂 Cloning repository...${NC}"
    git clone ${REPO_URL}
    cd polkadot-js-roko
    git checkout ${BRANCH}
fi

# Step 4: Build Docker image
echo -e "${YELLOW}🏗️  Building Docker image...${NC}"
docker build -t ${APP_NAME}:latest -f docker/Dockerfile .

# Step 5: Run the container
echo -e "${YELLOW}🎯 Starting new container...${NC}"
docker run -d \
    --name ${CONTAINER_NAME} \
    -p ${NETWORK_PORT}:${PORT} \
    --restart unless-stopped \
    -e WS_URL="ws://localhost:9944" \
    ${APP_NAME}:latest

# Step 6: Verify deployment
echo -e "${YELLOW}🔍 Verifying deployment...${NC}"
sleep 5

if docker ps --format 'table {{.Names}}\t{{.Status}}' | grep -q ${CONTAINER_NAME}; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo -e "${GREEN}🌐 Application is running on http://localhost:${NETWORK_PORT}${NC}"
    echo -e "${GREEN}📊 Container status:${NC}"
    docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep ${CONTAINER_NAME}
else
    echo -e "${RED}❌ Deployment failed!${NC}"
    echo -e "${RED}📋 Container logs:${NC}"
    docker logs ${CONTAINER_NAME}
    exit 1
fi

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${YELLOW}📝 To view logs: docker logs -f ${CONTAINER_NAME}${NC}"
echo -e "${YELLOW}📝 To stop: docker stop ${CONTAINER_NAME}${NC}" 