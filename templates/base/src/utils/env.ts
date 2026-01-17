export interface EnvConfig {
  walrusNetwork: string;
  walrusAggregator: string;
  walrusPublisher: string;
  suiNetwork: string;
  suiRpc: string;
  blockberryKey?: string;
}

export function loadEnv(): EnvConfig {
  const getEnv = (key: string, required = true): string => {
    const value = import.meta.env[key];
    if (required && !value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value || '';
  };

  return {
    walrusNetwork: getEnv('VITE_WALRUS_NETWORK'),
    walrusAggregator: getEnv('VITE_WALRUS_AGGREGATOR'),
    walrusPublisher: getEnv('VITE_WALRUS_PUBLISHER'),
    suiNetwork: getEnv('VITE_SUI_NETWORK'),
    suiRpc: getEnv('VITE_SUI_RPC'),
    blockberryKey: getEnv('VITE_BLOCKBERRY_KEY', false),
  };
}

export function validateEnv(config: EnvConfig): void {
  if (!['testnet', 'mainnet', 'devnet'].includes(config.walrusNetwork)) {
    throw new Error(`Invalid WALRUS_NETWORK: ${config.walrusNetwork}`);
  }

  if (!config.walrusAggregator.startsWith('http')) {
    throw new Error('WALRUS_AGGREGATOR must be a valid HTTP URL');
  }

  if (!config.walrusPublisher.startsWith('http')) {
    throw new Error('WALRUS_PUBLISHER must be a valid HTTP URL');
  }
}
