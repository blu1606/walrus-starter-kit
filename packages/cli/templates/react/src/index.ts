// Re-export storage adapter from SDK layer for use case templates
export { storageAdapter } from './adapters/storage.js';

// Re-export base adapter types
export type {
  StorageAdapter,
  BlobMetadata,
  UploadOptions,
  DownloadOptions,
} from './adapters/storage.js';
