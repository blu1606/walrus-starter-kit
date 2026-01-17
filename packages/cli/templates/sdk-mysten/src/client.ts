import { WalrusClient } from '@mysten/walrus';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { loadEnv } from './utils/env.js';
import { getNetworkConfig } from './config.js';
import type { WalrusNetwork } from './types/walrus.js';

let walrusClient: WalrusClient | null = null;

export function getWalrusClient(): WalrusClient {
  if (walrusClient) {
    return walrusClient;
  }

  const env = loadEnv();

  // Validate network value before casting
  const allowedNetworks: WalrusNetwork[] = ['testnet', 'mainnet', 'devnet'];
  if (!allowedNetworks.includes(env.walrusNetwork as WalrusNetwork)) {
    throw new Error(
      `Invalid WALRUS_NETWORK: ${env.walrusNetwork}. Must be one of: ${allowedNetworks.join(', ')}`
    );
  }
  const network = env.walrusNetwork as WalrusNetwork;
  const config = getNetworkConfig(network);

  const suiClient = new SuiClient({
    url:
      env.suiRpc ||
      config.suiRpcUrl ||
      getFullnodeUrl(network === 'testnet' ? 'testnet' : 'mainnet'),
  });

  walrusClient = new WalrusClient({
    network,
    suiClient,
    ...(env.walrusPublisher && { publisherUrl: env.walrusPublisher }),
    ...(env.walrusAggregator && { aggregatorUrl: env.walrusAggregator }),
  });

  return walrusClient;
}

export function resetWalrusClient(): void {
  walrusClient = null;
}
