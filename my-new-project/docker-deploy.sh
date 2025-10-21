#!/bin/bash
# Quick Docker deployment script

set -e

echo "🐶 Route Analysis Dashboard - Docker Deployment"
echo "=========================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed!"
    echo "Please install Docker first: https://www.docker.com/get-started"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found!"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "✅ Please edit .env with your Tableau credentials"
    echo "Then run this script again."
    exit 1
fi

echo "🔨 Building Docker image..."
docker build -t route-analysis:latest .

echo ""
echo "✅ Build complete!"
echo ""
echo "🚀 Starting container..."

# Stop existing container if running
docker stop route-analysis 2>/dev/null || true
docker rm route-analysis 2>/dev/null || true

# Run new container
docker run -d \
  --name route-analysis \
  -p 3000:3000 \
  --env-file .env \
  --restart unless-stopped \
  route-analysis:latest

echo ""
echo "✅ Container started successfully!"
echo ""
echo "🎉 Your app is now running!"
echo ""
echo "🌐 Local access: http://localhost:3000"
echo ""

# Get local IP for sharing
if command -v ipconfig &> /dev/null; then
    # macOS
    LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || echo "<your-ip>")
    echo "👥 Share with team: http://$LOCAL_IP:3000"
elif command -v ip &> /dev/null; then
    # Linux
    LOCAL_IP=$(ip route get 1 | awk '{print $7; exit}' 2>/dev/null || echo "<your-ip>")
    echo "👥 Share with team: http://$LOCAL_IP:3000"
else
    echo "👥 Share with team: http://<your-ip>:3000"
fi

echo ""
echo "🔍 View logs: docker logs -f route-analysis"
echo "🛑 Stop app: docker stop route-analysis"
echo ""
