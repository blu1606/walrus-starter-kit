import { useMutation } from '@tanstack/react-query';
import { useSuiClient } from '@mysten/dapp-kit';
import { storageAdapter } from '../lib/walrus/index.js';
import type { UploadOptions } from '../lib/walrus/types.js';
import { useEnokiAuth } from './use-enoki-auth.js';
import { useWallet } from './use-wallet.js';

/**
 * Upload hook with dual auth support
 *
 * Supports both zkLogin (Enoki) and standard wallet authentication
 * Prioritizes zkLogin if both are available
 */
export function useUpload() {
  const suiClient = useSuiClient();
  const { getSigner: getEnokiSigner } = useEnokiAuth();
  const { getSigner: getWalletSigner } = useWallet();

  return useMutation({
    mutationFn: async ({
      file,
      options,
    }: {
      file: File;
      options?: UploadOptions;
    }) => {
      // Prioritize zkLogin, fallback to standard wallet
      const signer = getEnokiSigner() || getWalletSigner();

      if (!signer) {
        throw new Error(
          'No wallet connected. Please login with Google or connect a wallet.'
        );
      }

      const blobId = await storageAdapter.upload(file, {
        ...options,
        client: suiClient,
        signer,
      });

      return { blobId, file };
    },
  });
}
