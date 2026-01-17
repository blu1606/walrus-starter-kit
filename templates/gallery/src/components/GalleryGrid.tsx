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
