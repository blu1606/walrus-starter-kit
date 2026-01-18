import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';

/**
 * Standard Sui wallet hook
 *
 * Provides wallet connection state and unified signer interface
 */
export function useWallet() {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const getSigner = () => {
    if (!currentAccount) return null;

    return {
      address: currentAccount.address,
      signAndExecuteTransaction: async (args: any) => {
        const result = await signAndExecute({
          transaction: args.transaction,
        });
        return { digest: result.digest };
      },
    };
  };

  return {
    isConnected: !!currentAccount,
    address: currentAccount?.address,
    account: currentAccount,
    getSigner,
  };
}
