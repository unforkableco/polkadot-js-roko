#!/bin/bash

# Polkadot-JS Apps Deployment Script
# This script deploys the app to EC2 with nginx and SSL configuration

set -e

# Configuration
DOMAIN="roko-explorer.ntfork.com"
RPC_ENDPOINT="ws://13.49.127.240:9944"
APP_DIR="/var/www/polkadot-apps"
NGINX_CONFIG_DIR="/etc/nginx/sites-available"
NGINX_ENABLED_DIR="/etc/nginx/sites-enabled"

echo "🚀 Starting Polkadot-JS Apps deployment..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js (using NodeSource)
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Yarn
echo "📦 Installing Yarn..."
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt update && sudo apt install -y yarn

# Install nginx
echo "📦 Installing Nginx..."
sudo apt install -y nginx

# Install certbot for SSL
echo "📦 Installing Certbot for SSL..."
sudo apt install -y certbot python3-certbot-nginx

# Create app directory
echo "📁 Creating application directory..."
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# Clone or copy the app (if running from local directory)
if [ -d ".git" ]; then
    echo "📋 Copying local app files..."
    rsync -av --exclude 'node_modules' --exclude '.git' --exclude 'build' . $APP_DIR/
else
    echo "📥 Cloning from repository..."
    git clone https://github.com/polkadot-js/apps.git $APP_DIR
fi

# Navigate to app directory
cd $APP_DIR

# Install dependencies
echo "📦 Installing dependencies..."
yarn install --frozen-lockfile

# Build the application with custom WS_URL
echo "🔨 Building application..."
export WS_URL="$RPC_ENDPOINT"
yarn build:www

# Create nginx configuration
echo "⚙️  Creating Nginx configuration..."
sudo tee $NGINX_CONFIG_DIR/$DOMAIN > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    # Temporary redirect to HTTPS (will be updated by certbot)
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;
    
    # SSL configuration will be added by certbot
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss application/atom+xml image/svg+xml;
    
    # Document root
    root $APP_DIR/packages/apps/build;
    index index.html;
    
    # Handle client-side routing
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # WebSocket proxy for RPC connections
    location /ws {
        proxy_pass $RPC_ENDPOINT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable the site
echo "🔗 Enabling Nginx site..."
sudo ln -sf $NGINX_CONFIG_DIR/$DOMAIN $NGINX_ENABLED_DIR/
sudo rm -f $NGINX_ENABLED_DIR/default

# Test nginx configuration
echo "🧪 Testing Nginx configuration..."
sudo nginx -t

# Start nginx
echo "🚀 Starting Nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

echo "✅ Basic deployment completed!"
echo ""
echo "🔒 To complete SSL setup, run:"
echo "sudo certbot --nginx -d $DOMAIN"
echo ""
echo "📋 Next steps:"
echo "1. Create DNS A record for $DOMAIN pointing to this server's IP"
echo "2. Run the SSL certificate command above"
echo "3. Your app will be available at https://$DOMAIN"
echo ""
echo "🌐 RPC endpoint configured: $RPC_ENDPOINT" 