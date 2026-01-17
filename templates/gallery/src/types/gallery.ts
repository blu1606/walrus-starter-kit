export interface GalleryItem {
  blobId: string;
  name: string;
  size: number;
  contentType: string;
  uploadedAt: number;
}

export interface GalleryIndex {
  version: '1.0';
  items: GalleryItem[];
  lastModified: number;
}
