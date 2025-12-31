#!/bin/bash

# Damshique Intelligence - AWS Auto-Setup Script
# Usage: sudo ./setup_aws.sh

echo "🚀 Starting Damshique Environment Setup..."

# 1. Update System
echo "📦 Updating system packages..."
sudo apt-get update && sudo apt-get upgrade -y

# 2. Install Docker
echo "🐳 Installing Docker..."
sudo apt-get install -y ca-certificates curl gnupg lsb-release
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 3. Install Docker Compose (Standalone)
echo "🐙 Installing Docker Compose..."
sudo curl -SL https://github.com/docker/compose/releases/download/v2.24.1/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. Enable Docker Services
sudo systemctl enable docker
sudo systemctl start docker

# 5. Add User to Docker Group (avoid sudo for docker commands)
sudo usermod -aG docker $USER

echo "✅ Environment Setup Complete!"
echo "👉 Please LOG OUT and LOG BACK IN for user permissions to take effect."
echo "   Then, navigate to the project folder and run: docker-compose up -d --build"
