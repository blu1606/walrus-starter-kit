import { useMemo } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { storageAdapter } from '../index.js';
import type { UploadOptions } from '../adapters/storage.js';

/**
 * Higher-Order Hook: Wallet-Aware Storage Adapter
 *
 * Injects wallet signer into storage operations automatically.
 * Upload requires connected wallet, download/metadata work without wallet.
 */
export function useStorageAdapter() {
  const currentAccount = useCurrentAccount();

  return useMemo(
    () => ({
      upload: async (file: File | Uint8Array, options?: UploadOptions) => {
        if (!currentAccount) {
          throw new Error(
            'Wallet not connected. Please connect your wallet to upload files.'
          );
        }

        return storageAdapter.upload(file, {
          ...options,
          signer: currentAccount, // Inject currentAccount as signer
        });
      },

      download: (blobId: string) => storageAdapter.download(blobId),

      getMetadata: (blobId: string) => storageAdapter.getMetadata(blobId),

      exists: (blobId: string) => storageAdapter.exists(blobId),
    }),
    [currentAccount]
  );
}
