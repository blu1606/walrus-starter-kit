import { useState } from 'react';
import { useUpload } from '../../hooks/use-upload.js';
import { useWallet } from '../../hooks/use-wallet.js';

export function UploadForm() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const upload = useUpload();
  const { isConnected } = useWallet();

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
          <p className="text-secondary">Selected: <span className="text-accent">{selectedFile.name}</span></p>
          <p className="text-secondary">Size: <span className="text-accent">{(selectedFile.size / 1024).toFixed(2)} KB</span></p>
        </div>
      )}

      {!isConnected && (
        <p className="warning">⚠️ Please connect your wallet to upload files</p>
      )}

      <button
        onClick={handleUpload}
        disabled={!selectedFile || !isConnected || upload.isPending}
      >
        {!isConnected
          ? 'Connect Wallet First'
          : upload.isPending
            ? 'Uploading...'
            : 'Upload to Walrus'}
      </button>

      {upload.isError && <p className="error">Error: {upload.error.message}</p>}
    </div>
  );
}
