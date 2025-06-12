# Polkadot-JS Apps Deployment Guide

This guide covers deploying the Polkadot-JS Apps to EC2 with HTTPS and custom domain configuration.

## Prerequisites

- EC2 Ubuntu instance (16.16.67.171)
- SSH access with key file: `/home/dev/temp/unforkable-official.pem`
- Domain: `ntfork.com` hosted on Route53
- RPC node accessible at: `13.49.127.240:9944`

## Quick Deployment

### Step 1: Deploy to EC2

Run the automated deployment script:

```bash
chmod +x upload-and-deploy.sh
./upload-and-deploy.sh
```

This will:
- Upload the app files to EC2
- Install all dependencies (Node.js, Yarn, Nginx, Certbot)
- Build the app with the correct RPC endpoint
- Configure Nginx with SSL-ready setup

### Step 2: Create DNS Record in Route53

1. **Access AWS Route53 Console**
   - Go to AWS Console → Route53 → Hosted Zones
   - Click on your `ntfork.com` domain

2. **Create A Record**
   - Click "Create Record"
   - **Record name**: `roko-explorer`
   - **Record type**: `A - Routes traffic to an IPv4 address`
   - **Value**: `16.16.67.171` (your EC2 instance IP)
   - **TTL**: `300` (5 minutes)
   - **Routing policy**: Simple routing
   - Click "Create records"

3. **Verify DNS Propagation**
   ```bash
   # Test DNS resolution
   nslookup roko-explorer.ntfork.com
   
   # Should return: 16.16.67.171
   ```

### Step 3: Setup SSL Certificate

SSH to your EC2 instance and run:

```bash
ssh -i /home/dev/temp/unforkable-official.pem ubuntu@16.16.67.171

# Once connected, run:
sudo certbot --nginx -d roko-explorer.ntfork.com
```

Follow the prompts:
- Enter email address for certificate notifications
- Agree to terms
- Choose whether to share email with EFF
- Certbot will automatically configure nginx with SSL

### Step 4: Verify Deployment

1. **Check HTTP redirect** (should redirect to HTTPS):
   ```bash
   curl -I http://roko-explorer.ntfork.com
   ```

2. **Check HTTPS access**:
   ```bash
   curl -I https://roko-explorer.ntfork.com
   ```

3. **Access your app**: https://roko-explorer.ntfork.com

## Configuration Details

### RPC Endpoint Configuration

The app is configured to connect to: `ws://13.49.127.240:9944`

This is set via the `WS_URL` environment variable during build time in the deployment script.

### Nginx Configuration

The nginx configuration includes:
- HTTP to HTTPS redirect
- SSL/TLS termination
- Security headers
- Gzip compression
- Static asset caching
- Client-side routing support
- WebSocket proxy for RPC connections

### Directory Structure on EC2

```
/var/www/polkadot-apps/          # Main app directory
├── packages/apps/build/         # Built app files (served by nginx)
├── node_modules/               # Dependencies
└── ...                        # Source files

/etc/nginx/sites-available/     # Nginx configuration
└── roko-explorer.ntfork.com

/etc/nginx/sites-enabled/       # Enabled sites
└── roko-explorer.ntfork.com -> ../sites-available/roko-explorer.ntfork.com
```

## Manual Deployment (Alternative)

If you prefer manual deployment:

### 1. Upload Files

```bash
rsync -avz -e "ssh -i /home/dev/temp/unforkable-official.pem" \
  --exclude 'node_modules' --exclude '.git' --exclude 'build' \
  . ubuntu@16.16.67.171:/home/ubuntu/polkadot-apps/
```

### 2. SSH and Deploy

```bash
ssh -i /home/dev/temp/unforkable-official.pem ubuntu@16.16.67.171
cd /home/ubuntu/polkadot-apps
chmod +x deploy.sh
./deploy.sh
```

## Troubleshooting

### Common Issues

1. **Build Fails - Out of Memory**
   ```bash
   # Increase swap space
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

2. **Nginx Permission Denied**
   ```bash
   # Check file permissions
   sudo chown -R www-data:www-data /var/www/polkadot-apps/packages/apps/build/
   sudo chmod -R 755 /var/www/polkadot-apps/packages/apps/build/
   ```

3. **SSL Certificate Issues**
   ```bash
   # Check nginx configuration
   sudo nginx -t
   
   # Restart nginx
   sudo systemctl restart nginx
   
   # Check certificate status
   sudo certbot certificates
   ```

4. **RPC Connection Issues**
   ```bash
   # Test RPC endpoint
   curl -H "Content-Type: application/json" \
        -d '{"id":1, "jsonrpc":"2.0", "method": "system_chain", "params":[]}' \
        http://13.49.127.240:9944
   ```

### Logs

- **Nginx logs**: `/var/log/nginx/error.log`
- **Certbot logs**: `/var/log/letsencrypt/letsencrypt.log`
- **App build logs**: Check terminal output during deployment

## Security Considerations

1. **Firewall Configuration**
   ```bash
   # Allow HTTP/HTTPS traffic
   sudo ufw allow 'Nginx Full'
   sudo ufw allow ssh
   sudo ufw enable
   ```

2. **Regular Updates**
   ```bash
   # Update SSL certificates (automatic via cron)
   sudo certbot renew --dry-run
   
   # Update system packages
   sudo apt update && sudo apt upgrade
   ```

3. **Nginx Security Headers**
   - The configuration includes security headers for XSS protection
   - Content Security Policy (CSP) configured
   - HSTS headers will be added by Certbot

## Monitoring

### Check App Status

```bash
# Check nginx status
sudo systemctl status nginx

# Check certificate expiry
sudo certbot certificates

# Check disk usage
df -h

# Check memory usage
free -h
```

### Performance Monitoring

```bash
# Check nginx access logs
sudo tail -f /var/log/nginx/access.log

# Monitor server resources
htop
```

## Updating the App

To update the app with new changes:

```bash
# Re-run the deployment script
./upload-and-deploy.sh

# Or manually:
# 1. Upload new files
# 2. SSH to server
# 3. cd /home/ubuntu/polkadot-apps && ./deploy.sh
```

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review nginx and application logs
3. Verify DNS and SSL certificate status
4. Test RPC endpoint connectivity 