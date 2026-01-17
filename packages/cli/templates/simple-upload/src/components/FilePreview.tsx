import { useState } from 'react';
import { useDownload } from '../hooks/useStorage.js';

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
