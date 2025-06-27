# EC2 Deployment Guide for Roko Explorer (feature/evm-interface)

## Prerequisites

### On EC2 Instance:
1. **Docker must be installed**
   ```bash
   # Install Docker if not already installed
   sudo apt update
   sudo apt install -y docker.io
   sudo systemctl start docker
   sudo systemctl enable docker
   sudo usermod -aG docker $USER
   # Log out and back in for group changes to take effect
   ```

2. **Git must be installed**
   ```bash
   sudo apt install -y git
   ```

## Deployment Steps

### Step 1: Copy deployment script to EC2
Copy the `deploy.sh` script to your EC2 instance:
```bash
scp -i your-key.pem deploy.sh ubuntu@your-ec2-ip:~/
```

### Step 2: SSH into EC2 and run deployment
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
chmod +x deploy.sh
./deploy.sh
```

## What the script does:

✅ **Automated Deployment Process:**
1. Stops and removes any existing container
2. Cleans up old Docker images
3. Clones/updates the repository to feature/evm-interface branch
4. Builds a new Docker image
5. Runs the container on port 3000
6. Verifies the deployment

## Configuration Details:

- **Repository**: `https://github.com/unforkableco/polkadot-js-roko.git`
- **Branch**: `feature/evm-interface`
- **Container Name**: `roko-explorer-container`
- **Internal Port**: 80 (nginx)
- **External Port**: 3000
- **Default RPC**: `ws://localhost:9944`

## Post-Deployment:

After successful deployment:
- App runs on: `http://your-ec2-ip:3000`
- View logs: `docker logs -f roko-explorer-container`
- Stop container: `docker stop roko-explorer-container`

## Customization:

To modify the RPC endpoint or port, edit the `deploy.sh` script:
```bash
# Change these variables as needed:
NETWORK_PORT=3000          # External port
WS_URL="ws://localhost:9944"  # RPC endpoint
```

## Troubleshooting:

### Container won't start:
```bash
docker logs roko-explorer-container
```

### Port conflicts:
```bash
# Check what's using port 3000
sudo netstat -tulpn | grep :3000
# Change NETWORK_PORT in deploy.sh if needed
```

### Build failures:
```bash
# Clean up everything and retry
docker system prune -a
./deploy.sh
```

## Security Notes:

- The container restarts automatically (`--restart unless-stopped`)
- Consider setting up a reverse proxy (nginx) for SSL termination
- Configure firewall rules for port 3000
- Use environment variables for sensitive configuration

## Manual Docker Commands (if needed):

```bash
# Build manually
docker build -t roko-explorer:latest -f docker/Dockerfile .

# Run manually
docker run -d \
    --name roko-explorer-container \
    -p 3000:80 \
    --restart unless-stopped \
    -e WS_URL="ws://your-rpc-endpoint:9944" \
    roko-explorer:latest

# View running containers
docker ps

# Stop and remove
docker stop roko-explorer-container
docker rm roko-explorer-container
``` 