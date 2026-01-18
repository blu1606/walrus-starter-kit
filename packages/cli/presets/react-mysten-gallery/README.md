# gallery-demo

This is a File Gallery Walrus application.

## Features

- Upload multiple files to Walrus
- Grid view of all uploaded files
- Persistent index (localStorage)
- Delete files from gallery
- File metadata display (name, size, upload date)

## Usage

1. Click "Choose File" and select a file
2. Click "Add to Gallery" to upload
3. Files appear in the grid below
4. Click "Delete" to remove files from gallery
5. Gallery index persists in localStorage

## Code Structure

- `GalleryGrid.tsx` - Grid layout for files
- `FileCard.tsx` - Individual file display
- `UploadModal.tsx` - Upload UI
- `index-manager.ts` - localStorage persistence
- `App.tsx` - Main app layout

## Gallery Index Format

The gallery maintains a local index in localStorage:

```json
{
  "version": "1.0",
  "items": [
    {
      "blobId": "abc123...",
      "name": "photo.jpg",
      "size": 102400,
      "contentType": "image/jpeg",
      "uploadedAt": 1705449600000
    }
  ],
  "lastModified": 1705449600000
}
```

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
