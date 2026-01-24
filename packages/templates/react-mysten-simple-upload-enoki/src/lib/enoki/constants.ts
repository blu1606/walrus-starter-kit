import { z } from 'zod';

/**
 * Enoki configuration constants with Zod validation
 */

// Environment variable schema
export const enokiConfigSchema = z.object({
  VITE_ENOKI_API_KEY: z.string().min(1, 'Enoki API key is required'),
  VITE_GOOGLE_CLIENT_ID: z.string().min(1, 'Google Client ID is required'),
  VITE_SUI_NETWORK: z.enum(['mainnet', 'testnet', 'devnet', 'localnet']).default('testnet'),
  VITE_SUI_RPC: z.string().url().optional(),
});

export type EnokiConfig = z.infer<typeof enokiConfigSchema>;

// Validate and export config
export const enokiConfig: EnokiConfig = enokiConfigSchema.parse({
  VITE_ENOKI_API_KEY: import.meta.env.VITE_ENOKI_API_KEY,
  VITE_GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  VITE_SUI_NETWORK: import.meta.env.VITE_SUI_NETWORK || 'testnet',
  VITE_SUI_RPC: import.meta.env.VITE_SUI_RPC,
});
