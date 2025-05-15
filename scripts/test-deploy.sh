#!/bin/bash
set -e

# Configuration
TEST_VERSION="v1.0.0-test"
TEST_WS_RPC="wss://rpc.polkadot.io"
CONTAINER_NAME="polkadotjs-test"

echo "🔨 Testing deployment process..."

# Create a mock build artifact for testing if it doesn't exist
if [ ! -f "packages/polkadotjs-ui.tar.gz" ]; then
    echo "📦 Creating mock build artifact..."
    mkdir -p packages/polkadotjs-ui
    cat > packages/polkadotjs-ui/index.html << EOL
<!DOCTYPE html>
<html>
<head>
    <title>Polkadot/Substrate Portal</title>
    <script src="env-config.js"></script>
</head>
<body>
    <h1>Polkadot/Substrate Portal</h1>
    <p>Mock test page</p>
</body>
</html>
EOL
    cd packages/polkadotjs-ui
    tar -czf ../polkadotjs-ui.tar.gz .
    cd ../..
fi

# Clean up any existing container
docker rm -f $CONTAINER_NAME 2>/dev/null || true

# Create a temporary directory for testing
TEST_DIR=$(mktemp -d)
cp packages/polkadotjs-ui.tar.gz $TEST_DIR/
cp scripts/setup_polkadotjs.sh $TEST_DIR/

# Create test Docker environment
cat > $TEST_DIR/Dockerfile << EOL
FROM ubuntu:22.04

# Install required packages
RUN apt-get update && apt-get install -y nginx curl unzip python3 python3-pip

# Install AWS CLI
RUN pip3 install awscli

# Create required directories
RUN mkdir -p /var/www/polkadotjs /run/nginx /etc/nginx/sites-available /etc/nginx/sites-enabled

# Setup mock EC2 metadata service
RUN echo '#!/bin/bash' > /usr/local/bin/mock-metadata && \
    echo 'echo "i-test123"' >> /usr/local/bin/mock-metadata && \
    chmod +x /usr/local/bin/mock-metadata

# Copy files
COPY polkadotjs-ui.tar.gz /tmp/
COPY setup_polkadotjs.sh /tmp/

# Mock AWS CLI for tags
RUN echo '#!/bin/bash' > /usr/local/bin/aws && \
    echo 'if [[ "\$*" == *"describe-tags"* ]]; then' >> /usr/local/bin/aws && \
    echo '  if [[ "\$*" == *"Version"* ]]; then' >> /usr/local/bin/aws && \
    echo "    echo \"$TEST_VERSION\"" >> /usr/local/bin/aws && \
    echo '  elif [[ "\$*" == *"Repository"* ]]; then' >> /usr/local/bin/aws && \
    echo "    echo \"$GITHUB_REPOSITORY\"" >> /usr/local/bin/aws && \
    echo '  fi' >> /usr/local/bin/aws && \
    echo 'fi' >> /usr/local/bin/aws && \
    chmod +x /usr/local/bin/aws

# Set environment variables
ENV WS_RPC_URL=$TEST_WS_RPC
ENV DOCKER_BUILD=1

# Make setup script executable and run it
RUN chmod +x /tmp/setup_polkadotjs.sh && \
    /tmp/setup_polkadotjs.sh

# Ensure proper permissions
RUN chown -R www-data:www-data /var/www/polkadotjs

EXPOSE 80

# Create startup script
RUN echo '#!/bin/bash' > /start.sh && \
    echo 'nginx -t && nginx -g "daemon off;"' >> /start.sh && \
    chmod +x /start.sh

CMD ["/start.sh"]
EOL

# Build and run the test container
echo "🐳 Building test container..."
docker build -t polkadotjs-test $TEST_DIR

echo "🚀 Running test container..."
docker run -d --name $CONTAINER_NAME -p 8080:80 polkadotjs-test

echo "⏳ Waiting for nginx to start..."
sleep 3

# Test the deployment
RESPONSE=$(curl -s http://localhost:8080)
if echo "$RESPONSE" | grep -iE "polkadot|substrate" > /dev/null; then
    echo "✅ Deployment test successful!"
    echo "🌍 Test app is running at http://localhost:8080"
    echo "🔌 Using WS_RPC_URL: $TEST_WS_RPC"
    echo "📄 Response contains expected content"
else
    echo "❌ Deployment test failed!"
    echo "Container logs:"
    docker logs $CONTAINER_NAME
    echo "Nginx configuration test:"
    docker exec $CONTAINER_NAME nginx -t
    echo "Nginx error log:"
    docker exec $CONTAINER_NAME cat /var/log/nginx/error.log
    echo "Response content:"
    echo "$RESPONSE" | head -n 20
fi

# Cleanup
rm -rf $TEST_DIR 