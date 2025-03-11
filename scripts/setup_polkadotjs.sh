#!/bin/bash
set -e
set -x  # Add debug output

# Add function for logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Add error handling function
handle_error() {
    local exit_code=$?
    log "ERROR: Command failed with exit code $exit_code"
    if [ -f "/var/log/nginx/error.log" ]; then
        log "Nginx error log:"
        cat /var/log/nginx/error.log
    fi
    exit $exit_code
}

# Set up error handling
trap 'handle_error' ERR

# Add health check function
check_health() {
    for i in {1..30}; do
        if curl -s http://localhost > /dev/null; then
            log "Application is up and running"
            return 0
        fi
        log "Waiting for application to start... (attempt $i/30)"
        sleep 2
    done
    log "Failed to verify application health"
    return 1
}

# Add verification steps
verify_installation() {
    # Check nginx installation
    if ! command -v nginx &> /dev/null; then
        log "ERROR: nginx not installed"
        return 1
    fi
    log "✓ Nginx is installed"

    # Check directories
    if [ ! -d "/var/www/polkadotjs" ]; then
        log "ERROR: Web root directory not created"
        return 1
    fi
    log "✓ Web root directory exists"

    # Check nginx config
    if ! nginx -t &> /dev/null; then
        log "ERROR: Invalid nginx configuration"
        nginx -t  # Run again to show the actual error
        return 1
    fi
    log "✓ Nginx configuration is valid"

    # Check file permissions
    if ! [ -r "/var/www/polkadotjs/index.html" ]; then
        log "ERROR: Cannot read index.html"
        return 1
    fi
    log "✓ File permissions are correct"

    return 0
}

log "Starting Polkadot.js setup..."

# Update system and install dependencies
log "Installing dependencies..."
if ! apt-get update; then
    log "ERROR: Failed to update package list"
    exit 1
fi

# Install packages one by one to better handle failures
for pkg in curl unzip nginx; do
    log "Installing $pkg..."
    if ! apt-get install -y $pkg; then
        log "ERROR: Failed to install $pkg"
        exit 1
    fi
done

# Install AWS CLI
log "Installing AWS CLI..."
cd /tmp
if ! curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"; then
    log "ERROR: Failed to download AWS CLI"
    exit 1
fi

if ! unzip -q awscliv2.zip; then
    log "ERROR: Failed to unzip AWS CLI"
    exit 1
fi

if ! ./aws/install; then
    log "ERROR: Failed to install AWS CLI"
    exit 1
fi

rm -rf aws awscliv2.zip

# Create directory for the app
log "Creating web root directory..."
mkdir -p /var/www/polkadotjs

# For local testing, use the artifact directly if it exists
if [ -f "/tmp/polkadotjs-ui.tar.gz" ]; then
    log "Using local artifact..."
    cd /tmp
    tar xzf polkadotjs-ui.tar.gz -C /var/www/polkadotjs
else
    # Get instance tags (only in AWS environment)
    log "Getting instance metadata..."
    if [ -f "/usr/local/bin/mock-metadata" ]; then
        INSTANCE_ID=$(mock-metadata)
        log "Using mock metadata: $INSTANCE_ID"
    else
        INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
        REGION=$(curl -s http://169.254.169.254/latest/meta-data/placement/region)
        log "Instance ID: $INSTANCE_ID, Region: $REGION"
    fi
    
    log "Getting instance tags..."
    TAG_VALUE=$(aws ec2 describe-tags --filters "Name=resource-id,Values=$INSTANCE_ID" "Name=key,Values=Version" --region ${REGION:-us-east-1} --query "Tags[0].Value" --output text)
    REPO=$(aws ec2 describe-tags --filters "Name=resource-id,Values=$INSTANCE_ID" "Name=key,Values=Repository" --region ${REGION:-us-east-1} --query "Tags[0].Value" --output text)
    
    if [ "$TAG_VALUE" = "None" ] || [ "$REPO" = "None" ]; then
        log "ERROR: Required tags not found"
        exit 1
    fi
    
    log "Version: $TAG_VALUE, Repository: $REPO"

    # Download and extract the release
    log "Downloading release artifact..."
    cd /tmp
    ARTIFACT_URL="https://github.com/${REPO}/releases/download/${TAG_VALUE}/polkadotjs-ui.tar.gz"
    log "Downloading from: $ARTIFACT_URL"
    if ! curl -L -o release.tar.gz "$ARTIFACT_URL"; then
        log "ERROR: Failed to download release artifact"
        exit 1
    fi
    
    log "Extracting artifact..."
    if ! tar xzf release.tar.gz -C /var/www/polkadotjs; then
        log "ERROR: Failed to extract artifact"
        exit 1
    fi
fi

# Configure environment
log "Creating environment configuration..."
cat > /var/www/polkadotjs/env-config.js << EOL
window.process_env = {
  WS_URL: "${WS_RPC_URL:-wss://rpc.polkadot.io}"
};
EOL

# Configure Nginx
log "Configuring nginx..."
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
log "Enabling nginx site..."
mkdir -p /etc/nginx/sites-enabled
ln -sf /etc/nginx/sites-available/polkadotjs /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Set proper permissions
log "Setting file permissions..."
chown -R www-data:www-data /var/www/polkadotjs

# Verify installation
log "Verifying installation..."
if ! verify_installation; then
    log "ERROR: Installation verification failed"
    exit 1
fi

# Start nginx if not in Docker
if [ -z "$DOCKER_BUILD" ]; then
    log "Starting nginx..."
    systemctl enable nginx
    systemctl start nginx
    
    # Check health
    log "Checking application health..."
    if ! check_health; then
        log "ERROR: Health check failed"
        exit 1
    fi
fi

log "Setup completed successfully!"
