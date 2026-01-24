# Phase 6: Use Case Layers

## Context Links

- [Main Plan](./plan.md)
- [PRD](../../POC/PRD.md)
- [Phase 3: Template Base Layer](./phase-03-template-base-layer.md)
- [Phase 4: SDK Layer](./phase-04-sdk-layer.md)
- [Phase 5: Framework Layer](./phase-05-framework-layer.md)

## Overview

**Created:** 2026-01-17  
**Priority:** High  
**Status:** pending  
**Estimated Effort:** 8 hours  
**Dependencies:** Phase 3, 4, 5 complete

## Key Insights

### Use Case Strategy

1. **Simple Upload** - Single file upload/download (MVP priority)
2. **File Gallery** - Multiple file management with index

Each use case is a **complete working application** that combines:

- Base utilities
- SDK adapter
- Framework components
- Use case-specific UI and logic

## Requirements

### Functional

- Two complete use case templates
- File upload/download UI
- Gallery index management
- Loading/error states
- Success feedback

### Technical

- Reuse base/SDK/framework layers
- Add only use case-specific code
- Maintain adapter pattern compatibility
- Production-ready error handling

### Dependencies

- Phase 3: Utilities, types
- Phase 4: StorageAdapter
- Phase 5: React hooks, components

## Architecture

### Use Case Structure (Per Template)

```
templates/simple-upload/
├── src/
│   ├── components/
│   │   ├── UploadForm.tsx
│   │   ├── FilePreview.tsx
│   │   └── DownloadButton.tsx
│   ├── App.tsx              # Overrides base App.tsx
│   └── styles.css           # Use case-specific styles
├── package.json             # Additional dependencies
└── README.md                # Use case docs

templates/gallery/
├── src/
│   ├── components/
│   │   ├── GalleryGrid.tsx
│   │   ├── UploadModal.tsx
│   │   └── FileCard.tsx
│   ├── types/
│   │   └── gallery.ts       # Gallery index types
│   ├── utils/
│   │   └── index-manager.ts # Index CRUD
│   ├── App.tsx
│   └── styles.css
├── package.json
└── README.md
```

## Related Code Files

### Simple Upload (3 hours)

1. `templates/simple-upload/src/components/UploadForm.tsx`
2. `templates/simple-upload/src/components/FilePreview.tsx`
3. `templates/simple-upload/src/components/DownloadButton.tsx`
4. `templates/simple-upload/src/App.tsx`
5. `templates/simple-upload/src/styles.css`
6. `templates/simple-upload/package.json`
7. `templates/simple-upload/README.md`

### File Gallery (3 hours)

8. `templates/gallery/src/components/GalleryGrid.tsx`
9. `templates/gallery/src/components/UploadModal.tsx`
10. `templates/gallery/src/components/FileCard.tsx`
11. `templates/gallery/src/types/gallery.ts`
12. `templates/gallery/src/utils/index-manager.ts`
13. `templates/gallery/src/App.tsx`
14. `templates/gallery/src/styles.css`
15. `templates/gallery/package.json`
16. `templates/gallery/README.md`

## Implementation Steps

## USE CASE 1: Simple Upload (3 hours)

### Step 1.1: Upload Form Component (45 min)

1. Create `simple-upload/src/components/UploadForm.tsx`:

```typescript
import { useState } from 'react';
import { useUpload } from '../../../react/src/hooks/useStorage.js';

export function UploadForm() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const upload = useUpload();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    upload.mutate(
      { file: selectedFile, options: { epochs: 1 } },
      {
        onSuccess: (data) => {
          alert(`Upload successful! Blob ID: ${data.blobId}`);
        }
      }
    );
  };

  return (
    <div className="upload-form">
      <input
        type="file"
        onChange={handleFileChange}
        disabled={upload.isPending}
      />

      {selectedFile && (
        <div className="file-info">
          <p>Selected: {selectedFile.name}</p>
          <p>Size: {(selectedFile.size / 1024).toFixed(2)} KB</p>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!selectedFile || upload.isPending}
      >
        {upload.isPending ? 'Uploading...' : 'Upload to Walrus'}
      </button>

      {upload.isError && (
        <p className="error">Error: {upload.error.message}</p>
      )}
    </div>
  );
}
```

### Step 1.2: File Preview Component (30 min)

2. Create `simple-upload/src/components/FilePreview.tsx`:

```typescript
import { useState } from 'react';
import { useDownload } from '../../../react/src/hooks/useStorage.js';

export function FilePreview() {
  const [blobId, setBlobId] = useState('');
  const { data, isLoading, error } = useDownload(blobId);

  const handleDownload = () => {
    if (!data) return;

    const blob = new Blob([data]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `walrus-${blobId.slice(0, 8)}.bin`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="file-preview">
      <input
        type="text"
        placeholder="Enter Blob ID"
        value={blobId}
        onChange={(e) => setBlobId(e.target.value)}
      />

      {isLoading && <p>Loading...</p>}
      {error && <p className="error">Error: {error.message}</p>}

      {data && (
        <div className="preview-content">
          <p>✓ Blob found ({data.byteLength} bytes)</p>
          <button onClick={handleDownload}>Download File</button>
        </div>
      )}
    </div>
  );
}
```

### Step 1.3: App Integration (30 min)

3. Create `simple-upload/src/App.tsx`:

```typescript
import { Layout } from '../../react/src/components/Layout.js';
import { UploadForm } from './components/UploadForm.js';
import { FilePreview } from './components/FilePreview.js';
import './styles.css';

function App() {
  return (
    <Layout>
      <div className="simple-upload-app">
        <h2>📤 Simple Upload</h2>
        <p>Upload a file to Walrus and download it by Blob ID</p>

        <section className="upload-section">
          <h3>Upload File</h3>
          <UploadForm />
        </section>

        <section className="download-section">
          <h3>Download File</h3>
          <FilePreview />
        </section>
      </div>
    </Layout>
  );
}

export default App;
```

4. Create `simple-upload/src/styles.css`:

```css
.simple-upload-app {
  max-width: 800px;
  margin: 0 auto;
}

section {
  margin: 2rem 0;
  padding: 1.5rem;
  border: 1px solid #333;
  border-radius: 8px;
}

.upload-form,
.file-preview {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.file-info {
  background: #1a1a1a;
  padding: 1rem;
  border-radius: 4px;
}

.error {
  color: #ff4444;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### Step 1.4: Documentation (30 min)

5. Create `simple-upload/package.json`:

```json
{
  "name": "walrus-simple-upload",
  "version": "0.1.0",
  "private": true,
  "dependencies": {}
}
```

6. Create `simple-upload/README.md`:

```markdown
# Simple Upload Use Case

Single file upload and download demo.

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
```

## USE CASE 2: File Gallery (3 hours)

### Step 2.1: Gallery Types (30 min)

7. Create `gallery/src/types/gallery.ts`:

```typescript
export interface GalleryItem {
  blobId: string;
  name: string;
  size: number;
  contentType: string;
  uploadedAt: number;
}

export interface GalleryIndex {
  version: '1.0';
  items: GalleryItem[];
  lastModified: number;
}
```

### Step 2.2: Index Manager (45 min)

8. Create `gallery/src/utils/index-manager.ts`:

```typescript
import { storageAdapter } from '../../../sdk-mysten/src/index.js';
import type { GalleryIndex, GalleryItem } from '../types/gallery.js';

const INDEX_KEY = 'gallery-index';

export async function loadIndex(): Promise<GalleryIndex> {
  const stored = localStorage.getItem(INDEX_KEY);
  if (!stored) {
    return { version: '1.0', items: [], lastModified: Date.now() };
  }
  return JSON.parse(stored);
}

export async function saveIndex(index: GalleryIndex): Promise<void> {
  index.lastModified = Date.now();
  localStorage.setItem(INDEX_KEY, JSON.stringify(index));
}

export async function addItem(item: GalleryItem): Promise<void> {
  const index = await loadIndex();
  index.items.push(item);
  await saveIndex(index);
}

export async function removeItem(blobId: string): Promise<void> {
  const index = await loadIndex();
  index.items = index.items.filter((item) => item.blobId !== blobId);
  await saveIndex(index);
}
```

### Step 2.3: Gallery Components (1.5 hours)

9. Create `gallery/src/components/GalleryGrid.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { FileCard } from './FileCard.js';
import { loadIndex } from '../utils/index-manager.js';
import type { GalleryItem } from '../types/gallery.js';

export function GalleryGrid() {
  const [items, setItems] = useState<GalleryItem[]>([]);

  useEffect(() => {
    loadIndex().then((index) => setItems(index.items));
  }, []);

  const refreshGallery = async () => {
    const index = await loadIndex();
    setItems(index.items);
  };

  return (
    <div className="gallery-grid">
      {items.length === 0 ? (
        <p>No files yet. Upload your first file!</p>
      ) : (
        items.map((item) => (
          <FileCard key={item.blobId} item={item} onDelete={refreshGallery} />
        ))
      )}
    </div>
  );
}
```

10. Create `gallery/src/components/FileCard.tsx`:

```typescript
import { formatBytes, formatDate } from '../../../base/src/utils/format.js';
import { removeItem } from '../utils/index-manager.js';
import type { GalleryItem } from '../types/gallery.js';

interface FileCardProps {
  item: GalleryItem;
  onDelete: () => void;
}

export function FileCard({ item, onDelete }: FileCardProps) {
  const handleDelete = async () => {
    if (confirm(`Delete ${item.name}?`)) {
      await removeItem(item.blobId);
      onDelete();
    }
  };

  return (
    <div className="file-card">
      <h4>{item.name}</h4>
      <p>Size: {formatBytes(item.size)}</p>
      <p>Uploaded: {formatDate(item.uploadedAt)}</p>
      <p className="blob-id">Blob ID: {item.blobId.slice(0, 12)}...</p>
      <button onClick={handleDelete}>Delete</button>
    </div>
  );
}
```

11. Create `gallery/src/components/UploadModal.tsx`:

```typescript
import { useState } from 'react';
import { useUpload } from '../../../react/src/hooks/useStorage.js';
import { addItem } from '../utils/index-manager.js';

interface UploadModalProps {
  onSuccess: () => void;
}

export function UploadModal({ onSuccess }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const upload = useUpload();

  const handleUpload = async () => {
    if (!file) return;

    upload.mutate(
      { file, options: { epochs: 1 } },
      {
        onSuccess: async (data) => {
          await addItem({
            blobId: data.blobId,
            name: file.name,
            size: file.size,
            contentType: file.type,
            uploadedAt: Date.now()
          });
          setFile(null);
          onSuccess();
        }
      }
    );
  };

  return (
    <div className="upload-modal">
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <button onClick={handleUpload} disabled={!file || upload.isPending}>
        {upload.isPending ? 'Uploading...' : 'Add to Gallery'}
      </button>
    </div>
  );
}
```

12. Create `gallery/src/App.tsx`:

```typescript
import { useState } from 'react';
import { Layout } from '../../react/src/components/Layout.js';
import { GalleryGrid } from './components/GalleryGrid.js';
import { UploadModal } from './components/UploadModal.js';
import './styles.css';

function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <Layout>
      <div className="gallery-app">
        <h2>🖼️ File Gallery</h2>
        <UploadModal onSuccess={() => setRefreshKey((k) => k + 1)} />
        <GalleryGrid key={refreshKey} />
      </div>
    </Layout>
  );
}

export default App;
```

### Step 2.4: Documentation (30 min)

13. Create `gallery/README.md`:

````markdown
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
````

````

## USE CASE 3: DeFi/NFT Metadata (2 hours)

### Step 3.1: Metadata Types & Validation (45 min)

14. Create `defi-nft/src/types/metadata.ts`:
```typescript
export interface NFTMetadata {
  name: string;
  description: string;
  image: string; // Blob ID of image
  external_url?: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
}
````

15. Create `defi-nft/src/utils/validator.ts`:

```typescript
import type { NFTMetadata } from '../types/metadata.js';

export function validateMetadata(metadata: Partial<NFTMetadata>): string[] {
  const errors: string[] = [];

  if (!metadata.name || metadata.name.trim().length === 0) {
    errors.push('Name is required');
  }

  if (!metadata.description || metadata.description.trim().length === 0) {
    errors.push('Description is required');
  }

  if (!metadata.image || !/^[a-f0-9]{64}$/.test(metadata.image)) {
    errors.push('Valid image Blob ID is required');
  }

  return errors;
}
```

### Step 3.2: Metadata Components (1 hour)

16. Create `defi-nft/src/components/MetadataForm.tsx`:

```typescript
import { useState } from 'react';
import { validateMetadata } from '../utils/validator.js';
import type { NFTMetadata } from '../types/metadata.js';

interface MetadataFormProps {
  onSubmit: (metadata: NFTMetadata) => void;
}

export function MetadataForm({ onSubmit }: MetadataFormProps) {
  const [metadata, setMetadata] = useState<Partial<NFTMetadata>>({
    attributes: []
  });
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = () => {
    const validationErrors = validateMetadata(metadata);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    onSubmit(metadata as NFTMetadata);
  };

  return (
    <form className="metadata-form">
      <input
        placeholder="NFT Name"
        value={metadata.name || ''}
        onChange={(e) => setMetadata({ ...metadata, name: e.target.value })}
      />
      <textarea
        placeholder="Description"
        value={metadata.description || ''}
        onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
      />
      <input
        placeholder="Image Blob ID"
        value={metadata.image || ''}
        onChange={(e) => setMetadata({ ...metadata, image: e.target.value })}
      />

      {errors.length > 0 && (
        <div className="errors">
          {errors.map((err, i) => <p key={i}>{err}</p>)}
        </div>
      )}

      <button type="button" onClick={handleSubmit}>
        Upload Metadata
      </button>
    </form>
  );
}
```

17. Create `defi-nft/src/App.tsx`:

```typescript
import { Layout } from '../../react/src/components/Layout.js';
import { MetadataForm } from './components/MetadataForm.js';
import { useUpload } from '../../react/src/hooks/useStorage.js';
import type { NFTMetadata } from './types/metadata.js';
import './styles.css';

function App() {
  const upload = useUpload();

  const handleMetadataSubmit = async (metadata: NFTMetadata) => {
    const json = JSON.stringify(metadata, null, 2);
    const blob = new TextEncoder().encode(json);

    upload.mutate(
      { file: blob, options: { epochs: 5 } },
      {
        onSuccess: (data) => {
          alert(`Metadata uploaded! Blob ID: ${data.blobId}`);
        }
      }
    );
  };

  return (
    <Layout>
      <div className="defi-nft-app">
        <h2>💎 NFT Metadata Creator</h2>
        <MetadataForm onSubmit={handleMetadataSubmit} />
        {upload.isPending && <p>Uploading metadata...</p>}
      </div>
    </Layout>
  );
}

export default App;
```

### Step 3.3: Documentation (15 min)

18. Create `defi-nft/README.md`:

````markdown
# DeFi/NFT Metadata Use Case

Create and upload NFT metadata JSON to Walrus.

## Features

- NFT metadata form
- JSON schema validation
- Upload to Walrus
- OpenSea-compatible format

## Metadata Schema

Follows OpenSea metadata standard:

```json
{
  "name": "My NFT",
  "description": "Cool NFT",
  "image": "<blob-id>",
  "attributes": [{ "trait_type": "Rarity", "value": "Legendary" }]
}
```
````

```

## Todo List

### Simple Upload
- [ ] Create `simple-upload/src/components/UploadForm.tsx`
- [ ] Create `simple-upload/src/components/FilePreview.tsx`
- [ ] Create `simple-upload/src/App.tsx`
- [ ] Create `simple-upload/src/styles.css`
- [ ] Create `simple-upload/package.json`
- [ ] Create `simple-upload/README.md`
- [ ] Test upload flow
- [ ] Test download flow

### Gallery
- [ ] Create `gallery/src/types/gallery.ts`
- [ ] Create `gallery/src/utils/index-manager.ts`
- [ ] Create `gallery/src/components/GalleryGrid.tsx`
- [ ] Create `gallery/src/components/FileCard.tsx`
- [ ] Create `gallery/src/components/UploadModal.tsx`
- [ ] Create `gallery/src/App.tsx`
- [ ] Create `gallery/src/styles.css`
- [ ] Create `gallery/README.md`
- [ ] Test multi-file upload
- [ ] Test index persistence

## Success Criteria

- [ ] All 2 use cases have complete file structures
- [ ] Each use case has working App.tsx
- [ ] Simple Upload: Upload + download works
- [ ] Gallery: Multi-file management works
- [ ] All use cases documented in README
- [ ] Code quality: TypeScript strict, ESLint passes

## Risk Assessment

### Potential Blockers
1. **localStorage limits**: Gallery index too large
   - **Mitigation**: Upload index to Walrus (future feature)
2. **File type restrictions**: Binary files not supported
   - **Mitigation**: All file types work as Uint8Array
3. **Metadata schema changes**: OpenSea updates standard
   - **Mitigation**: Validator is extensible

## Security Considerations

1. **File upload size**: DoS via huge files
   - **Hardening**: Add size limits (10MB browser, configurable)
2. **XSS via file names**: Malicious file names in gallery
   - **Hardening**: Sanitize display names
3. **Metadata injection**: Script tags in JSON
   - **Hardening**: Validate JSON schema strictly

## Next Steps

After Phase 6:
1. **Phase 7**: Template generation engine (composes all layers)
2. **Phase 8**: Post-install validation
3. **Testing**: E2E tests for each use case

### Open Questions
- Add image preview for gallery? (Decision: Yes, use Blob URLs)
- Support drag-and-drop upload? (Decision: Future enhancement)
```
