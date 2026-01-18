# {{projectName}}

This is a Simple Upload Walrus application.

## Features

- Upload any file to Walrus
- Get Blob ID after upload
- Download file by Blob ID
- File size display

## Usage

1. Click "Choose File" and select a file
2. Click "Upload to Walrus"
3. Copy the Blob ID from the success message
4. Paste Blob ID in the download section
5. Click "Download File"

## Code Structure

- `UploadForm.tsx` - File upload UI
- `FilePreview.tsx` - Download UI
- `App.tsx` - Main app layout

## Deploy to Walrus Sites

### First-time Setup

```bash
pnpm setup-walrus-deploy
```

This will automatically:
- Install Bun (if not already installed)
- Download site-builder binary for your OS
- Clone Walrus Sites portal to `~/.walrus/portal`
- Add deployment scripts to package.json

### Configure SUI Private Key

Edit the portal configuration:

**Linux/macOS:**
```bash
nano ~/.walrus/portal/.env
```

**Windows:**
```bash
notepad %USERPROFILE%\.walrus\portal\.env
```

Add your private key:
```env
SUI_PRIVATE_KEY=0x...
WALRUS_NETWORK=testnet
```

### Build & Deploy

```bash
# Build production bundle
pnpm build

# Deploy to Walrus Sites (testnet, 10 epochs)
pnpm deploy:walrus
```

### Preview Locally

```bash
pnpm walrus:portal
```

This starts the local portal server to preview your deployed site.

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm setup-walrus-deploy` - One-time deployment setup
- `pnpm deploy:walrus` - Deploy to Walrus Sites
- `pnpm walrus:portal` - Start local portal preview
