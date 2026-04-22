# Assets Directory

This directory contains application icons and assets for the AKS Connector desktop application.

## Required Icons

For proper packaging with Electron Builder, provide the following icon files:

### Windows
- `icon.ico` - Windows icon (256x256 recommended)

### macOS  
- `icon.icns` - macOS icon bundle (multiple sizes)

### Linux
- `icon.png` - PNG icon (512x512 recommended)

## Icon Requirements

- **Minimum Size**: 256x256 pixels
- **Recommended Size**: 512x512 pixels  
- **Formats**: ICO (Windows), ICNS (macOS), PNG (Linux)
- **Background**: Transparent or solid color
- **Style**: Modern, clean design representing Kubernetes/containerization

## Generating Icons

You can use tools like:
- [electron-icon-builder](https://www.npmjs.com/package/electron-icon-builder)
- [Image2icon](http://www.img2icnsapp.com/) (macOS)
- [IcoFX](https://icofx.ro/) (Windows)
- [GIMP](https://www.gimp.org/) (Cross-platform)

## Usage

These icons are automatically picked up by Electron Builder during the packaging process based on the configuration in `package.json`.