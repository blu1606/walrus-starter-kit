# File Gallery Use Case

Manage multiple files with a persistent index.

## Features

- Upload multiple files
- Grid view of all files
- Local index (localStorage)
- Delete files from gallery
- File metadata display

## Index Format

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

## Usage

1. Click "Choose File" to select a file
2. Click "Add to Gallery" to upload
3. Files appear in the grid below
4. Click "Delete" to remove files from gallery

## Code Structure

- `GalleryGrid.tsx` - Grid layout for files
- `FileCard.tsx` - Individual file display
- `UploadModal.tsx` - Upload UI
- `index-manager.ts` - localStorage persistence
- `gallery.ts` - Type definitions
