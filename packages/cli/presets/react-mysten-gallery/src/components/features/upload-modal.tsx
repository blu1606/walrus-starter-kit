import { useState } from 'react';
import { useUpload } from '../../hooks/use-upload.js';
import { addItem } from '../../utils/index-manager.js';
import { generatePreviewUrl, isImageType } from '../../utils/preview-generator.js';

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
          // Generate preview URL for images
          let previewUrl: string | undefined;
          if (isImageType(file.type)) {
            try {
              previewUrl = await generatePreviewUrl(data.blobId, file.type);
              console.log('Preview URL generated:', previewUrl);
            } catch (error) {
              console.error('Failed to generate preview URL:', error);
              // Continue without preview - FileCard will try to load it later
            }
          }

          // Add item to gallery with preview URL
          addItem({
            blobId: data.blobId,
            name: file.name,
            size: file.size,
            contentType: file.type,
            uploadedAt: Date.now(),
            previewUrl,
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
        className="file-input"
      />
      <button
        onClick={handleUpload}
        disabled={!file || upload.isPending}
        className="btn-primary"
      >
        {upload.isPending ? 'Uploading...' : 'Add to Gallery'}
      </button>
      {upload.error && (
        <p className="text-error">Error: {upload.error.message}</p>
      )}
    </div>
  );
}