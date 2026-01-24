import { useMutation } from '@tanstack/react-query';
import { storageAdapter } from '../lib/walrus/index.js';
import type {
  UploadOptions,
  SignAndExecuteTransactionArgs,
} from '../lib/walrus/types.js';
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from '@mysten/dapp-kit';

export function useUpload() {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();

  return useMutation({
    mutationFn: async ({
      file,
      options,
    }: {
      file: File;
      options?: UploadOptions;
    }) => {
      if (!currentAccount) {
        throw new Error(
          'Wallet not connected. Please connect your wallet to upload files.'
        );
      }

      // Promise Wrapper Pattern:
      // The `signAndExecute` function uses callbacks (onSuccess/onError), but `storageAdapter.upload`
      // requires a Promise-returning signer. We wrap the callback-based API in a Promise
      // to bridge this gap.
      const signTransaction = (args: SignAndExecuteTransactionArgs) => {
        return new Promise<{ digest: string }>((resolve, reject) => {
          signAndExecute(
            {
              transaction: args.transaction,
            },
            {
              onSuccess: (result) => resolve({ digest: result.digest }),
              onError: (error) => reject(error),
            }
          );
        });
      };

      const blobId = await storageAdapter.upload(file, {
        ...options,
        client: suiClient,
        signer: {
          address: currentAccount.address,
          signAndExecuteTransaction: signTransaction,
        },
      });
      return { blobId, file };
    },
  });
}
