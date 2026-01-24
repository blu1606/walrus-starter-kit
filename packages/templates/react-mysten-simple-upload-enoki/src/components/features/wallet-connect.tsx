import { ConnectButton } from '@mysten/dapp-kit';
import { useWallet } from '../../hooks/use-wallet.js';
import { useEnokiAuth } from '../../hooks/use-enoki-auth.js';
import { EnokiAuthButton } from './enoki-auth-button.js';

/**
 * Dual authentication component
 *
 * Supports both zkLogin (Google OAuth) and standard Sui wallets
 */
export function WalletConnect() {
  const { isConnected, address } = useWallet();
  const { isEnokiConnected } = useEnokiAuth();

  return (
    <div className="wallet-connect">
      <EnokiAuthButton />

      {!isEnokiConnected && (
        <>
          <div className="auth-divider">
            <span>OR</span>
          </div>
          {isConnected ? (
            <div className="wallet-info">
              <span>
                Wallet: {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
            </div>
          ) : (
            <p>Connect standard wallet</p>
          )}
          <ConnectButton />
        </>
      )}
    </div>
  );
}
