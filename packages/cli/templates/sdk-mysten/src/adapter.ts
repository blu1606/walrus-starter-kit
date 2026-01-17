import type {
  StorageAdapter,
  BlobMetadata,
  UploadOptions,
  DownloadOptions,
} from '../adapters/storage.js';
import { getWalrusClient } from './client.js';

export class MystenStorageAdapter implements StorageAdapter {
  async upload(
    data: File | Uint8Array,
    options?: UploadOptions
  ): Promise<string> {
    const client = getWalrusClient();

    const bytes =
      data instanceof File ? new Uint8Array(await data.arrayBuffer()) : data;

    try {
      const result = await client.writeBlobToUploadRelay(bytes, {
        nEpochs: options?.epochs || 1,
      });

      const blobId = result.newlyCreated.blobObject.blobId;

      return blobId;
    } catch (error) {
      throw new Error(
        `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async download(
    blobId: string,
    options?: DownloadOptions
  ): Promise<Uint8Array> {
    const client = getWalrusClient();

    try {
      const data = await client.readBlob(blobId);

      return data;
    } catch (error) {
      throw new Error(
        `Download failed for blob ${blobId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getMetadata(blobId: string): Promise<BlobMetadata> {
    const client = getWalrusClient();

    try {
      const metadata = await client.getBlobMetadata(blobId);

      return {
        blobId,
        size: metadata.size,
        contentType: metadata.contentType,
        createdAt: metadata.createdAt || Date.now(),
      };
    } catch (error) {
      throw new Error(
        `Failed to get metadata for blob ${blobId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async exists(blobId: string): Promise<boolean> {
    try {
      await this.getMetadata(blobId);
      return true;
    } catch {
      return false;
    }
  }
}

export const storageAdapter = new MystenStorageAdapter();
