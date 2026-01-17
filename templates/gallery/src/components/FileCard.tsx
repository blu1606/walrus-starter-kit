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
