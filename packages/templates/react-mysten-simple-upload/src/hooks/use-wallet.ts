import { useCurrentAccount } from '@mysten/dapp-kit';

export function useWallet() {
  const currentAccount = useCurrentAccount();

  return {
    isConnected: !!currentAccount,
    address: currentAccount?.address,
    account: currentAccount,
  };
}
