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
