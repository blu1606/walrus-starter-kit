import { useState } from 'react';
import { useUpload } from '../hooks/useStorage.js';

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
        },
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

      {upload.isError && <p className="error">Error: {upload.error.message}</p>}
    </div>
  );
}
