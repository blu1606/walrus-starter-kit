import type {
  StorageAdapter,
  BlobMetadata,
  UploadOptions,
  DownloadOptions,
} from './types.js';
import { getWalrusClient, resetWalrusClient } from './client.js';
import { WalrusFile, RetryableWalrusClientError } from '@mysten/walrus';
import { getContentType } from '../../utils/mime-type.js';

export class MystenStorageAdapter implements StorageAdapter {
  async upload(
    data: File | Uint8Array,
    options?: UploadOptions
  ): Promise<string> {
    const bytes =
      data instanceof File ? new Uint8Array(await data.arrayBuffer()) : data;
    const fileName = data instanceof File ? data.name : 'upload.bin';

    try {
      // Check if signer and client are provided
      if (!options?.signer) {
        throw new Error('Wallet signer is required for upload. Please connect your wallet.');
      }
      if (!options?.client) {
        throw new Error('Sui client is required for upload.');
      }

      const client = options.client;

      console.log('[Upload] Starting upload flow...');

      // Detect content type with fallback logic
      const contentType = getContentType(
        data,
        options?.contentType
      );

      console.log(`[Upload] Detected content-type: ${contentType} for file: ${fileName}`);

      // Create upload flow with full metadata (identifier + tags)
      const flow = client.walrus.writeFilesFlow({
        files: [
          WalrusFile.from({
            contents: bytes,
            identifier: fileName, // Original filename with extension
            tags: {
              'content-type': contentType,
              'original-name': fileName,
            },
          }),
        ],
      });

      // Step 1: Encode the file
      console.log('[Upload] Step 1: Encoding file...');
      await flow.encode();
      console.log('[Upload] Step 1: Encode complete');

      // Step 2: Register the blob on-chain (requires wallet signature)
      console.log('[Upload] Step 2: Creating register transaction...');
      const registerTx = flow.register({
        epochs: options?.epochs || 1,
        owner: options.signer.address,
        deletable: true,
      });

      // Sign and execute the register transaction (dapp-kit will handle wrapping)
      console.log('[Upload] Step 2: Signing register transaction...');
      const registerResult = await options.signer.signAndExecuteTransaction({
        transaction: registerTx,
      });
      console.log('[Upload] Step 2: Register complete, digest:', registerResult.digest);

      // Step 3: Upload the data to storage nodes
      console.log('[Upload] Step 3: Uploading to storage nodes...');
      await flow.upload({ digest: registerResult.digest });
      console.log('[Upload] Step 3: Upload complete');

      // Step 4: Certify the blob (requires wallet signature)
      console.log('[Upload] Step 4: Creating certify transaction...');
      const certifyTx = flow.certify();

      // Sign and execute the certify transaction (dapp-kit will handle wrapping)
      console.log('[Upload] Step 4: Signing certify transaction...');
      await options.signer.signAndExecuteTransaction({
        transaction: certifyTx,
      });
      console.log('[Upload] Step 4: Certify complete');

      // Step 5: Get the uploaded files
      console.log('[Upload] Step 5: Getting file list...');
      const files = await flow.listFiles();

      if (!files || files.length === 0) {
        throw new Error('Upload completed but no files were returned');
      }

      const blobId = files[0].blobId;
      console.log('[Upload] Success! Blob ID:', blobId);
      return blobId;
    } catch (error) {
      console.error('[Upload] Error details:', error);
      throw new Error(
        `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async download(
    blobId: string,
    options?: DownloadOptions
  ): Promise<Uint8Array | string | unknown> {
    const client = getWalrusClient();

    try {
      // Use getFiles for better API - supports future batch downloads
      const [file] = await client.walrus.getFiles({ ids: [blobId] });

      // Handle different output formats
      switch (options?.format) {
        case 'text':
          return await file.text();
        case 'json':
          return await file.json();
        default:
          return await file.bytes();
      }
    } catch (error) {
      // Handle retryable errors by resetting client and retrying once
      if (error instanceof RetryableWalrusClientError) {
        console.warn(`[Download] Retryable error detected, resetting client and retrying...`);
        resetWalrusClient();

        try {
          const retryClient = getWalrusClient();
          const [file] = await retryClient.walrus.getFiles({ ids: [blobId] });

          switch (options?.format) {
            case 'text':
              return await file.text();
            case 'json':
              return await file.json();
            default:
              return await file.bytes();
          }
        } catch (retryError) {
          throw new Error(
            `Download retry failed for blob ${blobId}: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`
          );
        }
      }

      throw new Error(
        `Download failed for blob ${blobId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getMetadata(blobId: string): Promise<BlobMetadata> {
    const client = getWalrusClient();

    try {
      // Get metadata from Walrus
      const metadata = await client.walrus.getBlobMetadata({ blobId });

      // Get WalrusFile to extract identifier and tags
      const [file] = await client.walrus.getFiles({ ids: [blobId] });
      const identifier = await file.getIdentifier();
      const tags = await file.getTags();

      return {
        blobId,
        size: Number(metadata.metadata.V1.unencoded_length),
        contentType: tags['content-type'] || 'application/octet-stream',
        fileName: tags['original-name'] || identifier || `blob-${blobId.slice(0, 8)}`,
        tags,
        createdAt: (metadata as unknown as { createdAt?: number }).createdAt || Date.now(),
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
