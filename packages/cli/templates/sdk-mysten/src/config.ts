import type { WalrusNetwork } from './types/walrus.js';

export interface MystenWalrusConfig {
  network: WalrusNetwork;
  publisherUrl?: string;
  aggregatorUrl?: string;
  suiRpcUrl?: string;
}

export const NETWORK_CONFIGS: Record<WalrusNetwork, MystenWalrusConfig> = {
  testnet: {
    network: 'testnet',
    publisherUrl: 'https://publisher.walrus-testnet.walrus.space',
    aggregatorUrl: 'https://aggregator.walrus-testnet.walrus.space',
    suiRpcUrl: 'https://fullnode.testnet.sui.io:443',
  },
  mainnet: {
    network: 'mainnet',
    publisherUrl: 'https://publisher.walrus.space',
    aggregatorUrl: 'https://aggregator.walrus.space',
    suiRpcUrl: 'https://fullnode.mainnet.sui.io:443',
  },
  devnet: {
    network: 'devnet',
    publisherUrl: 'http://localhost:8080',
    aggregatorUrl: 'http://localhost:8081',
    suiRpcUrl: 'http://localhost:9000',
  },
};

export function getNetworkConfig(network: WalrusNetwork): MystenWalrusConfig {
  return NETWORK_CONFIGS[network];
}
