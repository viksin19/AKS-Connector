#!/bin/bash

# Development setup script for AKS Connector

echo "🚀 Setting up AKS Connector development environment..."

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Go
if ! command -v go &> /dev/null; then
    echo "❌ Go is not installed. Please install Go 1.21+ from https://golang.org/dl/"
    exit 1
fi
echo "✅ Go $(go version | cut -d' ' -f3) found"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi
echo "✅ Node.js $(node --version) found"

# Check kubectl
if ! command -v kubectl &> /dev/null; then
    echo "⚠️ kubectl is not installed. Please install kubectl to manage Kubernetes clusters."
else
    echo "✅ kubectl $(kubectl version --client --short 2>/dev/null | cut -d' ' -f3) found"
fi

# Install dependencies
echo "📦 Installing dependencies..."

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
go mod tidy
cd ..

echo "✅ All dependencies installed successfully!"

# Check kubeconfig
echo "🔍 Checking kubeconfig..."
if [ -f "$HOME/.kube/config" ]; then
    echo "✅ kubeconfig found at $HOME/.kube/config"
else
    echo "⚠️ No kubeconfig found at $HOME/.kube/config"
    echo "   Please ensure your Kubernetes configuration is set up correctly."
fi

echo ""
echo "🎉 Setup complete! You can now start development:"
echo ""
echo "  Development (all services):"
echo "    npm run dev"
echo ""
echo "  Individual services:"
echo "    npm run dev:backend    # Start Go backend server"
echo "    npm run dev:frontend   # Start React dev server"
echo "    npm run dev:electron   # Start Electron app"
echo ""
echo "  Build for production:"
echo "    npm run build:all      # Build backend and frontend"
echo "    npm run package        # Create desktop installer"
echo ""
echo "📝 Make sure your kubeconfig is properly configured before starting!"