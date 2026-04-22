@echo off
echo 🚀 Setting up AKS Connector development environment...

echo 📋 Checking prerequisites...

:: Check Go
where go >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Go is not installed. Please install Go 1.21+ from https://golang.org/dl/
    pause
    exit /b 1
)
for /f "tokens=3" %%i in ('go version 2^>nul') do set GO_VERSION=%%i
echo ✅ Go %GO_VERSION% found

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)
for /f %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION% found

:: Check kubectl
where kubectl >nul 2>nul
if %errorlevel% neq 0 (
    echo ⚠️ kubectl is not installed. Please install kubectl to manage Kubernetes clusters.
) else (
    echo ✅ kubectl found
)

:: Install dependencies
echo 📦 Installing dependencies...

:: Install root dependencies
echo Installing root dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install root dependencies
    pause
    exit /b 1
)

:: Install frontend dependencies
echo Installing frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)
cd ..

:: Install backend dependencies
echo Installing backend dependencies...
cd backend
go mod tidy
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)
cd ..

echo ✅ All dependencies installed successfully!

:: Check kubeconfig
echo 🔍 Checking kubeconfig...
if exist "%USERPROFILE%\.kube\config" (
    echo ✅ kubeconfig found at %USERPROFILE%\.kube\config
) else (
    echo ⚠️ No kubeconfig found at %USERPROFILE%\.kube\config
    echo    Please ensure your Kubernetes configuration is set up correctly.
)

echo.
echo 🎉 Setup complete! You can now start development:
echo.
echo   Development (all services):
echo     npm run dev
echo.
echo   Individual services:
echo     npm run dev:backend    # Start Go backend server
echo     npm run dev:frontend   # Start React dev server  
echo     npm run dev:electron   # Start Electron app
echo.
echo   Build for production:
echo     npm run build:all      # Build backend and frontend
echo     npm run package        # Create desktop installer
echo.
echo 📝 Make sure your kubeconfig is properly configured before starting!
echo.
pause