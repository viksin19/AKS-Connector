# Development Configuration

## Environment Variables

### Backend Configuration
- `PORT`: Backend server port (default: 8080)
- `KUBECONFIG`: Path to kubeconfig file (default: ~/.kube/config)
- `LOG_LEVEL`: Log level (debug, info, warn, error)
- `CORS_ORIGIN`: CORS allowed origins (default: *)

### Frontend Configuration
- `VITE_API_URL`: Backend API URL (default: http://localhost:8080)
- `VITE_WS_URL`: WebSocket URL (default: ws://localhost:8080)

### Electron Configuration
- `NODE_ENV`: Environment (development, production)
- `ELECTRON_DEV`: Enable development mode (true, false)

## Development Ports
- Backend API: 8080
- Frontend Dev Server: 3000
- WebSocket: 8080/ws

## Build Configuration

### Go Build Flags
```bash
# Windows
go build -ldflags "-H windowsgui" -o aks-connector.exe main.go

# Linux
GOOS=linux GOARCH=amd64 go build -o aks-connector main.go

# macOS
GOOS=darwin GOARCH=amd64 go build -o aks-connector main.go
```

### Electron Build Targets
- Windows: NSIS installer (.exe), Portable (.exe)
- macOS: DMG (.dmg), ZIP (.zip)
- Linux: AppImage (.AppImage), DEB (.deb)

## Debugging

### Backend Debugging
1. Install Delve: `go install github.com/go-delve/delve/cmd/dlv@latest`
2. Run with debugger: `dlv debug main.go`
3. Set breakpoints and debug

### Frontend Debugging
1. Open Chrome DevTools (F12)
2. Use React Developer Tools extension
3. Use VS Code debugger with launch.json

### Electron Debugging
1. Enable DevTools in development mode
2. Use VS Code Electron debugger
3. Main process debugging with --inspect

## Performance Monitoring

### Backend Metrics
- Memory usage monitoring
- API response times
- WebSocket connection count
- Kubernetes API call latency

### Frontend Metrics
- Bundle size analysis with `npm run analyze`
- React component profiling
- WebSocket message frequency

## Testing

### Backend Testing
```bash
cd backend
go test ./...
go test -race ./...
go test -cover ./...
```

### Frontend Testing
```bash
cd frontend
npm test
npm run test:coverage
npm run test:e2e
```

## Security Notes

### Kubeconfig Security
- Never commit kubeconfig files
- Use RBAC to limit permissions
- Rotate service account tokens regularly
- Use namespace-scoped access when possible

### Electron Security
- Content Security Policy enabled
- Node integration disabled in renderer
- Context isolation enabled
- External link handling secured

### Network Security
- CORS configured properly
- WebSocket origin validation
- HTTPS in production
- Certificate validation