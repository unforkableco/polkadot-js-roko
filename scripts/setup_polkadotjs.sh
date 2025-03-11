#!/bin/bash
set -e

# Update system and install dependencies
apt-get update
apt-get install -y nginx curl unzip

# Create directory for the app
mkdir -p /var/www/polkadotjs

# For local testing, use the artifact directly if it exists
if [ -f "/tmp/polkadotjs-ui.tar.gz" ]; then
    echo "Using local artifact..."
    cd /tmp
    tar xzf polkadotjs-ui.tar.gz -C /var/www/polkadotjs
else
    # Get instance tags (only in AWS environment)
    if [ -f "/usr/local/bin/mock-metadata" ]; then
        INSTANCE_ID=$(mock-metadata)
    else
        INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
        REGION=$(curl -s http://169.254.169.254/latest/meta-data/placement/region)
    fi
    
    TAG_VALUE=$(aws ec2 describe-tags --filters "Name=resource-id,Values=$INSTANCE_ID" "Name=key,Values=Version" --region ${REGION:-us-east-1} --query "Tags[0].Value" --output text)
    REPO=$(aws ec2 describe-tags --filters "Name=resource-id,Values=$INSTANCE_ID" "Name=key,Values=Repository" --region ${REGION:-us-east-1} --query "Tags[0].Value" --output text)

    # Download and extract the release
    cd /tmp
    curl -L -o release.tar.gz "https://github.com/${REPO}/releases/download/${TAG_VALUE}/polkadotjs-ui.tar.gz"
    tar xzf release.tar.gz -C /var/www/polkadotjs
fi

# Configure environment
cat > /var/www/polkadotjs/env-config.js << EOL
window.process_env = {
  WS_URL: "${WS_RPC_URL:-wss://rpc.polkadot.io}"
};
EOL

# Configure Nginx
cat > /etc/nginx/sites-available/polkadotjs << EOL
server {
    listen 80;
    server_name _;
    root /var/www/polkadotjs;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }

    location /env-config.js {
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }
}
EOL

# Enable the site and remove default
mkdir -p /etc/nginx/sites-enabled
ln -sf /etc/nginx/sites-available/polkadotjs /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx config only if not in Docker build
if [ -z "$DOCKER_BUILD" ]; then
    nginx -t
fi

# Note: Don't start nginx here - it will be started by the container's CMD
