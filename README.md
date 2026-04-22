# AKS Connector - Kubernetes Management Desktop Application

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Go Version](https://img.shields.io/badge/Go-1.21+-blue.svg)](https://golang.org)
[![Node Version](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org)
[![Electron](https://img.shields.io/badge/Electron-28+-purple.svg)](https://electronjs.org)

## Overview
A local desktop application for managing Azure Kubernetes Service (AKS) clusters with real-time monitoring and management capabilities. Built with Go, React, TypeScript, and Electron for a native desktop experience.

## ✨ Features
- 🏠 **Dashboard Overview**: Comprehensive cluster statistics and health monitoring
- 🔄 **Multi-Cluster Support**: Seamlessly switch between multiple AKS clusters via kubeconfig
- 📊 **Real-time Updates**: Live pod status, deployment changes via WebSocket
- 🚀 **Pod Management**: View, delete, exec into pods, stream logs in real-time
- 🚢 **Deployment Management**: View, scale up/down, delete deployments with instant feedback
- 🏷️ **Namespace Navigation**: Filter and organize resources by namespace
- 🔍 **Advanced Filtering**: Search and filter resources with multiple criteria
- 🎨 **Modern UI**: Clean, responsive interface built with Tailwind CSS
- 🔐 **Secure**: RBAC-aware, no credential storage, local-only deployment

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│             Electron App            │
│  ┌─────────────────────────────────┐ │
│  │      React Frontend (TS)       │ │
│  │  ┌─────────────────────────────┐│ │
│  │  │     Dashboard UI            ││ │
│  │  │     Pod Management          ││ │
│  │  │     Deployment Management   ││ │
│  │  └─────────────────────────────┘│ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
               ↕ HTTP/WebSocket
┌─────────────────────────────────────┐
│           Go Backend API            │
│  ┌─────────────────────────────────┐ │
│  │    REST API Handlers           │ │
│  │    WebSocket Manager           │ │
│  │    Kubernetes Client           │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
               ↕ client-go
┌─────────────────────────────────────┐
│         Kubernetes API Server      │
│            (AKS Cluster)           │
└─────────────────────────────────────┘
```

**Tech Stack:**
- **Backend**: Go with Kubernetes client-go library, Gin web framework
- **Frontend**: React 18, TypeScript, TanStack Query, Tailwind CSS
- **Desktop**: Electron 28 for cross-platform desktop deployment
- **Communication**: REST API + WebSocket for real-time updates
- **Build**: Vite for frontend bundling, Electron Builder for packaging

## 🚀 Quick Start

### Prerequisites
- **Go 1.21+** - [Download](https://golang.org/dl/)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **kubectl** configured with AKS clusters - [Install Guide](https://kubernetes.io/docs/tasks/tools/)
- Valid kubeconfig file at `~/.kube/config` or `$KUBECONFIG`

### 🛠️ Development Setup

#### Option 1: Automated Setup
```bash
# Clone the repository
git clone <repository-url>
cd aks-connector

# Windows
setup-dev.bat

# Linux/macOS
chmod +x setup-dev.sh
./setup-dev.sh

# Start all services
npm run dev
```

#### Option 2: Manual Setup
```bash
# Install dependencies
npm run install:all

# Terminal 1: Start backend
npm run dev:backend

# Terminal 2: Start frontend
npm run dev:frontend

# Terminal 3: Start Electron (after backend and frontend are running)
npm run dev:electron
```

### 📦 Production Build
```bash
# Build all components
npm run build:all

# Package desktop application
npm run package

# Platform-specific builds
npm run package:win    # Windows installer
npm run package:mac    # macOS DMG
npm run package:linux  # Linux AppImage/DEB
```

## 📖 Usage

### Initial Setup
1. **Configure kubectl**: Ensure your kubeconfig is properly set up
   ```bash
   kubectl config get-contexts
   ```

2. **Launch Application**: Start the desktop application or run in development mode

3. **Select Cluster**: Use the cluster selector to choose your AKS cluster

4. **Choose Namespace**: Select the namespace you want to manage

### Dashboard Features
- **Cluster Overview**: Real-time statistics for namespaces, pods, deployments, and services
- **Resource Health**: Visual indicators for running, failed, and pending pods
- **Quick Actions**: Direct links to detailed management pages

### Pod Management
- **List View**: Comprehensive pod information including status, readiness, restarts, and age
- **Real-time Updates**: Live status changes via WebSocket
- **Actions**: Delete pods, view logs, exec into containers
- **Filtering**: Search by name, filter by status
- **Details**: Expand rows to see labels, containers, and images

### Deployment Management
- **Scaling**: Interactive scaling with +/- controls
- **Status Monitoring**: Real-time replica status
- **Management**: Delete deployments with confirmation
- **Details**: View labels, selectors, strategy, and container images

## ⚙️ Configuration

### Environment Variables
Create `.env` files for custom configuration:

```bash
# Backend (.env in root)
PORT=8080
LOG_LEVEL=info
KUBECONFIG=/path/to/your/kubeconfig

# Frontend (frontend/.env.local)
VITE_API_URL=http://localhost:8080
```

### Kubeconfig Support
- Automatically reads from `~/.kube/config`
- Supports `KUBECONFIG` environment variable
- Handles multiple contexts and clusters
- Respects current-context settings

## 🔒 Security

### Authentication & Authorization
- **No Credential Storage**: Uses existing kubeconfig credentials
- **RBAC Compliance**: Respects Kubernetes RBAC policies
- **Namespace Scoped**: Shows only accessible resources
- **Service Account Support**: Works with service account tokens

### Network Security
- **Local Only**: Backend runs on localhost by default
- **CORS Configured**: Proper cross-origin resource sharing
- **WebSocket Security**: Origin validation and secure connections
- **Certificate Validation**: Validates Kubernetes API certificates

### Best Practices
- Never commits kubeconfig files to version control
- Uses least-privilege access patterns
- Implements proper error handling for unauthorized actions
- Provides clear feedback for permission issues

## 🧪 Testing

### Backend Tests
```bash
cd backend
go test ./...
go test -race ./...
go test -cover ./...
```

### Frontend Tests
```bash
cd frontend
npm test
npm run test:coverage
```

### E2E Testing
```bash
npm run test:e2e
```

## 📚 Development

See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed development guidelines, debugging tips, and contribution instructions.

### Project Structure
```
aks-connector/
├── backend/           # Go backend server
│   ├── main.go       # Main application entry
│   └── go.mod        # Go dependencies
├── frontend/         # React frontend
│   ├── src/          # Source code
│   ├── public/       # Static assets
│   └── package.json  # Frontend dependencies
├── electron/         # Electron main process
│   └── main.js       # Electron entry point
├── assets/           # Application assets (icons, etc.)
└── package.json      # Root package configuration
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📋 Requirements

### System Requirements
- **OS**: Windows 10+, macOS 10.15+, Ubuntu 18.04+
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 200MB for application, additional for logs
- **Network**: Internet access for initial setup and updates

### Kubernetes Requirements
- **API Version**: Supports Kubernetes 1.24+
- **Permissions**: Read access to pods, deployments, namespaces
- **Optional**: Write access for pod deletion, deployment scaling

## 🐛 Troubleshooting

### Common Issues

**Backend won't start:**
- Check if kubectl is installed and configured
- Verify kubeconfig file permissions
- Ensure port 8080 is available

**Cannot connect to cluster:**
- Validate kubeconfig with `kubectl cluster-info`
- Check network connectivity to cluster
- Verify authentication credentials

**Frontend build errors:**
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node.js version compatibility
- Verify all dependencies are installed

**Electron packaging fails:**
- Ensure all native dependencies are built
- Check electron-builder configuration
- Verify platform-specific requirements

### Getting Help
- Check existing [issues](https://github.com/your-org/aks-connector/issues)
- Create a new issue with detailed information
- Include logs and system information

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Kubernetes](https://kubernetes.io/) for the amazing orchestration platform
- [client-go](https://github.com/kubernetes/client-go) for the official Go client library
- [React](https://reactjs.org/) for the fantastic UI framework
- [Electron](https://electronjs.org/) for enabling cross-platform desktop development
- [Headlamp](https://github.com/kinvolk/headlamp) for architecture inspiration

---

**Built with ❤️ for the Kubernetes community**