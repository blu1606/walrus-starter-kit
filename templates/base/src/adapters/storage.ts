/**
 * Universal storage adapter interface for Walrus
 *
 * This interface abstracts SDK-specific implementations,
 * allowing use case layers to work with any Walrus SDK.
 */

export interface BlobMetadata {
  blobId: string;
  size: number;
  contentType?: string;
  createdAt: number;
  expiresAt?: number;
}

export interface UploadOptions {
  /** Number of epochs to store (Walrus-specific) */
  epochs?: number;
  /** MIME type of the content */
  contentType?: string;
}

export interface DownloadOptions {
  /** Byte range (for large files) */
  range?: { start: number; end: number };
}

export interface StorageAdapter {
  /**
   * Upload data to Walrus storage
   * @param data - File or raw bytes to upload
   * @param options - Upload configuration
   * @returns Blob ID (permanent reference)
   */
  upload(data: File | Uint8Array, options?: UploadOptions): Promise<string>;

  /**
   * Download blob data by ID
   * @param blobId - Unique blob identifier
   * @param options - Download configuration
   * @returns Raw blob data
   */
  download(blobId: string, options?: DownloadOptions): Promise<Uint8Array>;

  /**
   * Get blob metadata without downloading content
   * @param blobId - Unique blob identifier
   * @returns Metadata object
   */
  getMetadata(blobId: string): Promise<BlobMetadata>;

  /**
   * Check if blob exists
   * @param blobId - Unique blob identifier
   * @returns True if blob is accessible
   */
  exists(blobId: string): Promise<boolean>;
}
