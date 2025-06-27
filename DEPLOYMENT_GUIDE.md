# Roko Explorer Deployment Guide (Docker-based)

This guide covers deploying the Roko Explorer (Polkadot-JS Apps with EVM integration) to EC2 using Docker containers.

## Prerequisites

- EC2 Ubuntu instance (16.16.67.171)
- SSH access with key file: `/home/dev/temp/unforkable-official.pem`
- Domain: `ntfork.com` hosted on Route53
- RPC node accessible at: `13.49.127.240:9944`
- Docker installed on EC2 instance

## Quick Deployment

### Step 1: Deploy to EC2 (Docker-based)

Run the automated deployment script:

```bash
chmod +x upload-and-deploy.sh
./upload-and-deploy.sh
```

This will:
- Upload the Docker deployment script to EC2
- Clone the latest feature/evm-interface branch
- Build a Docker image with all dependencies
- Run the containerized app on port 80
- Configure the correct RPC endpoint (13.49.127.240:9944)

### Step 2: Verify Docker Deployment

Check that the container is running:

```bash
ssh -i /home/dev/temp/unforkable-official.pem ubuntu@16.16.67.171
docker ps
```

You should see `roko-explorer-container` running.

### Step 3: Create DNS Record in Route53 (if using domain)

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

### Step 4: Setup SSL Certificate (Optional - for HTTPS)

For HTTPS access with your domain, you'll need to set up a reverse proxy:

```bash
ssh -i /home/dev/temp/unforkable-official.pem ubuntu@16.16.67.171

# Install nginx for reverse proxy
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

# Create nginx configuration for reverse proxy
sudo tee /etc/nginx/sites-available/roko-explorer.ntfork.com > /dev/null <<EOF
server {
    listen 80;
    server_name roko-explorer.ntfork.com;
    
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable the site
sudo ln -s /etc/nginx/sites-available/roko-explorer.ntfork.com /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d roko-explorer.ntfork.com
```

## Configuration Details

### Docker Container Configuration

- **Image**: Built from `docker/Dockerfile`
- **Container Name**: `roko-explorer-container`
- **Port Mapping**: 80:80 (host:container)
- **Restart Policy**: `unless-stopped`
- **RPC Endpoint**: `ws://13.49.127.240:9944`

### Branch and Features

- **Branch**: `feature/evm-interface`
- **Features**: 
  - EVM integration
  - Fixed token symbol display in staking interface
  - Custom Roko chain configuration

### Access Points

- **Direct IP**: http://16.16.67.171
- **Domain (if configured)**: https://roko-explorer.ntfork.com

## Management Commands

### View Application Logs
```bash
ssh -i /home/dev/temp/unforkable-official.pem ubuntu@16.16.67.171
docker logs -f roko-explorer-container
```

### Restart Application
```bash
ssh -i /home/dev/temp/unforkable-official.pem ubuntu@16.16.67.171
docker restart roko-explorer-container
```

### Stop Application
```bash
ssh -i /home/dev/temp/unforkable-official.pem ubuntu@16.16.67.171
docker stop roko-explorer-container
```

### Update to Latest Version
Simply run the deployment script again:
```bash
./upload-and-deploy.sh
```

This will:
- Pull latest changes from feature/evm-interface
- Rebuild the Docker image
- Replace the running container

## Manual Deployment (Alternative)

If you prefer manual deployment:

### 1. Copy deployment script to EC2
```bash
scp -i /home/dev/temp/unforkable-official.pem deploy.sh ubuntu@16.16.67.171:~/
```

### 2. SSH and run deployment
```bash
ssh -i /home/dev/temp/unforkable-official.pem ubuntu@16.16.67.171
chmod +x deploy.sh
./deploy.sh
```

## Troubleshooting

### Common Issues

1. **Container won't start**
   ```bash
   docker logs roko-explorer-container
   docker ps -a  # Check if container exists but stopped
   ```

2. **Port 80 already in use**
   ```bash
   sudo netstat -tulpn | grep :80
   # Stop conflicting service or change port in deploy.sh
   ```

3. **Docker not installed on EC2**
   ```bash
   ssh -i /home/dev/temp/unforkable-official.pem ubuntu@16.16.67.171
   sudo apt update
   sudo apt install -y docker.io
   sudo systemctl start docker
   sudo systemctl enable docker
   sudo usermod -aG docker ubuntu
   # Log out and back in
   ```

4. **Build failures due to memory**
   ```bash
   # Increase swap space on EC2
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

5. **RPC Connection Issues**
   ```bash
   # Test RPC endpoint
   curl -H "Content-Type: application/json" \
        -d '{"id":1, "jsonrpc":"2.0", "method": "system_chain", "params":[]}' \
        http://13.49.127.240:9944
   ```

### Container Management

```bash
# View all containers
docker ps -a

# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Complete cleanup
docker system prune -a
```

## Security Considerations

1. **Firewall Configuration**
   ```bash
   # Allow HTTP/HTTPS traffic
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw allow ssh
   sudo ufw enable
   ```

2. **Container Security**
   - Container runs as non-root user
   - Only necessary ports exposed
   - Automatic restart on failure

3. **Regular Updates**
   ```bash
   # Update Docker images regularly
   ./upload-and-deploy.sh
   
   # Update system packages
   sudo apt update && sudo apt upgrade
   ```

## Monitoring

### Health Checks
```bash
# Check if container is healthy
curl -f http://16.16.67.171 || echo "App is down"

# Check container status
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### Logs
- **Application logs**: `docker logs roko-explorer-container`
- **Nginx logs** (if using reverse proxy): `/var/log/nginx/`
- **System logs**: `journalctl -u docker` 