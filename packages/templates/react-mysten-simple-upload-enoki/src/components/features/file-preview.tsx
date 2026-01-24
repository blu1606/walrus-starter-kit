import { useState } from 'react';
import { useDownload, useMetadata } from '../../hooks/use-download.js';

export function FilePreview() {
  const [blobId, setBlobId] = useState('');
  const { data, isLoading, error } = useDownload(blobId);
  const { data: metadata } = useMetadata(blobId);

  const handleDownload = () => {
    if (!data) return;

    // Use original filename from metadata if available
    let filename = metadata?.fileName || `walrus-${blobId.slice(0, 8)}`;

    // If metadata doesn't have filename, auto-detect from content type
    if (!metadata?.fileName) {
      const contentType = metadata?.contentType || 'application/octet-stream';

      if (contentType.startsWith('image/')) {
        filename += `.${contentType.split('/')[1]}`;
      } else if (contentType.startsWith('text/')) {
        filename += '.txt';
      } else if (contentType.includes('json')) {
        filename += '.json';
      } else {
        filename += '.bin';
      }
    }

    const contentType = metadata?.contentType || 'application/octet-stream';
    const blob = new Blob([data as BlobPart], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Auto-detect if data is text or JSON for preview
  const canPreview = data && (typeof data === 'string' || data instanceof Uint8Array);
  const preview = canPreview && typeof data === 'string'
    ? data.slice(0, 200) // Show first 200 chars for text
    : null;

  return (
    <div className="file-preview">
      <input
        type="text"
        placeholder="Enter Blob ID"
        value={blobId}
        onChange={(e) => setBlobId(e.target.value)}
      />

      {isLoading && <p className="text-secondary">Loading...</p>}
      {error && <p className="error">Error: {error.message}</p>}

      {data && (
        <div className="preview-content icon-list">
          <p className="text-success">✓ Blob found <span className="text-secondary">({(data as Uint8Array).byteLength || (data as string).length} bytes)</span></p>
          {metadata?.fileName && <p className="text-secondary">File: <span className="text-accent">{metadata.fileName}</span></p>}
          {metadata?.contentType && <p className="text-secondary">Type: <span className="text-accent">{metadata.contentType}</span></p>}
          {preview && (
            <pre>
              {preview}...
            </pre>
          )}
          <button onClick={handleDownload}>Download File</button>
        </div>
      )}
    </div>
  );
}
