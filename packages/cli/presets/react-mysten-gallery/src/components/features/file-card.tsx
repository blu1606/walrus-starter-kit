import { useState, useEffect } from 'react';
import { removeItem } from '../../utils/index-manager.js';
import type { GalleryItem } from '../../lib/walrus/types.js';
import {
  generatePreviewUrl,
  isImageType,
  revokePreviewUrl,
} from '../../utils/preview-generator.js';

interface FileCardProps {
  item: GalleryItem;
  onDelete: () => void;
}

export function FileCard({ item, onDelete }: FileCardProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    item.previewUrl || null
  );
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Load preview if it's an image and we don't have a preview URL yet
  useEffect(() => {
    if (!previewUrl && isImageType(item.contentType)) {
      setIsLoadingPreview(true);
      generatePreviewUrl(item.blobId, item.contentType)
        .then((url) => setPreviewUrl(url))
        .catch((error) => {
          console.error('Failed to load preview:', error);
        })
        .finally(() => setIsLoadingPreview(false));
    }

    // Cleanup: revoke object URL when component unmounts
    return () => {
      if (previewUrl) {
        revokePreviewUrl(previewUrl);
      }
    };
  }, [item.blobId, item.contentType, previewUrl]);

  const handleDelete = () => {
    if (confirm(`Delete ${item.name}?`)) {
      // Revoke preview URL before deleting
      if (previewUrl) {
        revokePreviewUrl(previewUrl);
      }
      removeItem(item.blobId);
      onDelete();
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="file-card">
      {/* Image Preview */}
      {isImageType(item.contentType) && (
        <div className="image-preview">
          {isLoadingPreview ? (
            <div className="loading-placeholder">Loading preview...</div>
          ) : previewUrl ? (
            <img src={previewUrl} alt={item.name} />
          ) : (
            <div className="error-placeholder">Preview not available</div>
          )}
        </div>
      )}

      {/* File Info */}
      <h4>{item.name}</h4>
      <p className="text-secondary">Size: {formatBytes(item.size)}</p>
      <p className="text-secondary">Uploaded: {formatDate(item.uploadedAt)}</p>
      <p className="blob-id text-accent">{item.blobId.slice(0, 16)}...</p>
      <button onClick={handleDelete} className="btn-danger">
        Delete
      </button>
    </div>
  );
}