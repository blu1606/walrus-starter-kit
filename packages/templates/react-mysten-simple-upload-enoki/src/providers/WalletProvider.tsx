import {
  createNetworkConfig,
  SuiClientProvider,
  WalletProvider as SuiWalletProvider,
} from '@mysten/dapp-kit';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { walrus } from '@mysten/walrus';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { loadEnv } from '../utils/env.js';

const env = loadEnv();

const validatedNetwork =
  env.suiNetwork === 'mainnet' || env.suiNetwork === 'testnet'
    ? env.suiNetwork
    : 'testnet';

const { networkConfig } = createNetworkConfig({
  [validatedNetwork]: {
    url: env.suiRpc || getFullnodeUrl(validatedNetwork),
  },
});

const walletQueryClient = new QueryClient();

export function WalletProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={walletQueryClient}>
      <SuiClientProvider
        networks={networkConfig}
        defaultNetwork={validatedNetwork}
        createClient={(network: string | number, config: { readonly url: string }) => {
          // Create SuiClient with Walrus extension
          const client = new SuiClient({
            url: config.url,
          }).$extend(
            walrus({
              network: network as 'testnet' | 'mainnet',
              wasmUrl: 'https://unpkg.com/@mysten/walrus-wasm@latest/web/walrus_wasm_bg.wasm',
              // No uploadRelay - upload directly to storage nodes
              // This avoids tip payment requirements but uses ~2200 requests
            })
          );
          return client;
        }}
      >
        <SuiWalletProvider>{children}</SuiWalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
