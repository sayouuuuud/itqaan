#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting VPS Setup for Next.js + Puppeteer..."

# 1. Update System
echo "🔄 Updating system packages..."
sudo apt-get update && sudo apt-get upgrade -y

# 2. Setup Swap (CRITICAL for 1GB RAM VPS)
if [ $(swapon --show | wc -l) -eq 0 ]; then
    echo "💾 Creating 2GB Swap File..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "✅ Swap created successfully."
else
    echo "✅ Swap already exists."
fi

# 3. Install Docker & Docker Compose
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "✅ Docker installed."
else
    echo "✅ Docker already installed."
fi

# 4. Install Docker Compose (if not part of docker cli)
# Modern docker usually has 'docker compose' built-in, checking...
if ! docker compose version &> /dev/null; then
     echo "🐳 Installing Docker Compose Plugin..."
     sudo apt-get install -y docker-compose-plugin
fi

echo "🎉 Server Setup Complete!"
echo "----------------------------------------"
echo "To deploy your app:"
echo "1. Upload your project files to this server."
echo "2. Run: docker compose up -d --build"
echo "----------------------------------------"
