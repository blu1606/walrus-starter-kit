/**
 * Universal storage adapter interface for Walrus
 *
 * This interface abstracts SDK-specific implementations,
 * allowing use case layers to work with any Walrus SDK.
 */

import type { SuiClient } from '@mysten/sui/client';
import type { Transaction } from '@mysten/sui/transactions';

export interface BlobMetadata {
  blobId: string;
  size: number;
  contentType?: string;
  createdAt: number;
  expiresAt?: number;
  /** Original filename with extension */
  fileName?: string;
  /** All tags from WalrusFile */
  tags?: Record<string, string>;
}

export interface SignAndExecuteTransactionArgs {
  transaction: Transaction;
}

export interface SignAndExecuteTransactionResult {
  digest: string;
  effects?: unknown;
}

/**
 * Unified signer interface
 *
 * Compatible with both zkLogin (Enoki) and standard Sui wallets
 */
export interface UnifiedSigner {
  address: string;
  signAndExecuteTransaction: (
    args: SignAndExecuteTransactionArgs
  ) => Promise<SignAndExecuteTransactionResult>;
}

export interface UploadOptions {
  /** Number of epochs to store (Walrus-specific) */
  epochs?: number;
  /** MIME type of the content */
  contentType?: string;
  /** Sui client with Walrus extension (from useSuiClient hook) */
  client?: SuiClient;
  /** Wallet signer for authenticated uploads */
  signer?: UnifiedSigner;
}

export interface DownloadOptions {
  /** Byte range (for large files) */
  range?: { start: number; end: number };
  /** Output format - auto-detects if not specified */
  format?: 'bytes' | 'text' | 'json';
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
   * @returns Blob data in requested format (Uint8Array, string, or JSON)
   */
  download(blobId: string, options?: DownloadOptions): Promise<Uint8Array | string | unknown>;

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
