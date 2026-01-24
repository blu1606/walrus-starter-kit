import { walrus, WalrusClient } from '@mysten/walrus';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { loadEnv } from '../../utils/env.js';

// Types
export type WalrusNetwork = 'testnet' | 'mainnet';

export interface MystenWalrusConfig {
  network: WalrusNetwork;
  publisherUrl?: string;
  aggregatorUrl?: string;
  suiRpcUrl?: string;
}

type WalrusExtendedClient = SuiClient & { walrus: WalrusClient };

// Network Configurations
const NETWORK_CONFIGS: Record<WalrusNetwork, MystenWalrusConfig> = {
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
};

function getNetworkConfig(network: WalrusNetwork): MystenWalrusConfig {
  return NETWORK_CONFIGS[network];
}

// Client Management
// We use a singleton pattern here to ensure only one instance of the Walrus client
// is created and shared across the application. This prevents unnecessary connections
// and ensures consistent state.
let walrusClient: WalrusExtendedClient | null = null;

export function getWalrusClient(): WalrusExtendedClient {
  if (walrusClient) {
    return walrusClient;
  }

  const env = loadEnv();

  // Validate network value before casting
  const allowedNetworks: WalrusNetwork[] = ['testnet', 'mainnet'];
  if (!allowedNetworks.includes(env.walrusNetwork as WalrusNetwork)) {
    throw new Error(
      `Invalid WALRUS_NETWORK: ${env.walrusNetwork}. Must be one of: ${allowedNetworks.join(', ')}`
    );
  }
  const network = env.walrusNetwork as WalrusNetwork;
  const config = getNetworkConfig(network);

  // Initialize the base Sui Client
  // We use the official @mysten/sui/client to interact with the Sui blockchain.
  // This is required because Walrus operations often involve signing transactions on Sui.
  const suiClient = new SuiClient({
    url:
      env.suiRpc ||
      config.suiRpcUrl ||
      getFullnodeUrl(network === 'testnet' ? 'testnet' : 'mainnet'),
  });

  // Extend the client with Walrus capabilities
  // The .extend() pattern allows us to add Walrus-specific methods (like storage.upload)
  // directly to the Sui client instance. This creates a unified interface for both
  // blockchain interactions and storage operations.
  walrusClient = suiClient.$extend(
    walrus({
      network: network, // REQUIRED: Walrus SDK needs to know which network
      // Use CDN for WASM - more reliable than bundler resolution in some environments
      wasmUrl:
        'https://unpkg.com/@mysten/walrus-wasm@latest/web/walrus_wasm_bg.wasm',
      uploadRelay: {
        host:
          env.walrusPublisher ||
          config.publisherUrl ||
          `https://upload-relay.${network}.walrus.space`,
        sendTip: null, // Skip tip config fetch to avoid CORS issues in development
      },
      ...(env.walrusAggregator && { aggregatorUrl: env.walrusAggregator }),
    })
  );

  return walrusClient;
}

export function resetWalrusClient(): void {
  walrusClient = null;
}
