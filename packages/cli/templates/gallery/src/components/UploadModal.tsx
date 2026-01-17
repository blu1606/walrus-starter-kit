import { useState } from 'react';
import { useUpload } from '../hooks/useStorage.js';
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
          addItem({
            blobId: data.blobId,
            name: file.name,
            size: file.size,
            contentType: file.type,
            uploadedAt: Date.now(),
          });
          setFile(null);
          onSuccess();
        },
      }
    );
  };

  return (
    <div className="upload-modal">
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button onClick={handleUpload} disabled={!file || upload.isPending}>
        {upload.isPending ? 'Uploading...' : 'Add to Gallery'}
      </button>
    </div>
  );
}
