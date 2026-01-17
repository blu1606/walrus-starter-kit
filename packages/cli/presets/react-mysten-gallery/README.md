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
