#!/bin/bash
set -e
set -x  # Add debug output

# Add function for logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

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
for pkg in curl nginx software-properties-common python3-certbot-nginx; do
    log "Installing $pkg..."
    if ! apt-get install -y $pkg; then
        log "ERROR: Failed to install $pkg"
        exit 1
    fi
done

# Create directory for the app
log "Creating web root directory..."
mkdir -p /var/www/polkadotjs

# Extract the application files
log "Extracting application files..."
if [ -f "/tmp/polkadotjs-ui.tar.gz" ]; then
    log "Using provided artifact..."
    cd /tmp
    if ! tar xzf polkadotjs-ui.tar.gz -C /var/www/polkadotjs; then
        log "ERROR: Failed to extract artifact"
        exit 1
    fi
else
    log "ERROR: Application artifact not found at /tmp/polkadotjs-ui.tar.gz"
    exit 1
fi

# Configure environment
log "Creating environment configuration..."
cat > /var/www/polkadotjs/env-config.js << EOL
window.process_env = {
  WS_URL: "${WS_RPC_URL:-wss://rpc.polkadot.io}"
};
EOL

# Stop nginx before configuration changes
log "Stopping nginx..."
systemctl stop nginx || true

# Configure Nginx
log "Configuring nginx..."
cat > /etc/nginx/sites-available/polkadotjs << EOL
server {
    listen 80;
    server_name ${DOMAIN_NAME};
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
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/polkadotjs /etc/nginx/sites-enabled/

# Set proper permissions
log "Setting file permissions..."
chown -R www-data:www-data /var/www/polkadotjs

# Verify installation
log "Verifying installation..."
if ! verify_installation; then
    log "ERROR: Installation verification failed"
    exit 1
fi

# Start nginx
log "Starting nginx..."
systemctl enable nginx
systemctl restart nginx

# Obtain SSL certificate
if [ -n "${DOMAIN_NAME}" ]; then
    log "Setting up HTTPS with Certbot..."
    certbot --nginx --non-interactive --agree-tos --email ${ADMIN_EMAIL} -d ${DOMAIN_NAME} --redirect
    
    # Set up auto-renewal
    log "Setting up automatic certificate renewal..."
    systemctl enable certbot.timer
    systemctl start certbot.timer
fi

# Check health
log "Checking application health..."
if ! check_health; then
    log "ERROR: Health check failed"
    # Show nginx error log for debugging
    log "Nginx error log:"
    cat /var/log/nginx/error.log
    exit 1
fi

log "Setup completed successfully!"
