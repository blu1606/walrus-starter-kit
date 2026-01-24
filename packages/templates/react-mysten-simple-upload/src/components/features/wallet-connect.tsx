import { ConnectButton } from '@mysten/dapp-kit';
import { useWallet } from '../../hooks/use-wallet.js';

export function WalletConnect() {
  const { isConnected, address } = useWallet();

  return (
    <div className="wallet-connect">
      {isConnected ? (
        <div className="wallet-info">
          <span>
            Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
        </div>
      ) : (
        <p>Please connect your wallet</p>
      )}
      <ConnectButton />
    </div>
  );
}
