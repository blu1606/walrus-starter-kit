import type {
  StorageAdapter,
  BlobMetadata,
  UploadOptions,
  DownloadOptions,
} from './adapters/storage.js';
import { getWalrusClient } from './client.js';

export class MystenStorageAdapter implements StorageAdapter {
  async upload(
    data: File | Uint8Array,
    options?: UploadOptions
  ): Promise<string> {
    const client = getWalrusClient();

    const blob =
      data instanceof File ? new Uint8Array(await data.arrayBuffer()) : data;

    // Require signer for upload (SDK v0.9.0)
    if (!options?.signer) {
      throw new Error(
        'Signer required for blob upload. Please connect your wallet first.'
      );
    }

    try {
      // v0.9.0 API: Object-based parameters with signer
      const result = await client.writeBlobToUploadRelay({
        blob,
        nEpochs: options?.epochs || 1,
        signer: options.signer as any, // WalletAccount used as signer (dapp-kit compatibility)
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
      // v0.9.0 API: Object-based parameters
      const data = await client.readBlob({ blobId });

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
      // v0.9.0 API: Object-based parameters + V1 metadata structure
      const response = await client.getBlobMetadata({ blobId });

      // Validate V1 structure exists
      if (!response.metadata?.V1) {
        throw new Error('Invalid metadata structure: V1 format not found');
      }

      const metadata = response.metadata.V1;

      return {
        blobId,
        size: metadata.unencoded_length,
        contentType: metadata.contentType,
        createdAt: metadata.createdAt ?? 0,
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
