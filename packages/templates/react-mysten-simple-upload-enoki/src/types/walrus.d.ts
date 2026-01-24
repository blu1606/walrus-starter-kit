/**
 * Type augmentation for Walrus-extended SuiClient
 *
 * This module augmentation ensures TypeScript recognizes the `.walrus` property
 * on SuiClient instances after calling `$extend(walrus(...))`.
 */

import type { WalrusClient } from '@mysten/walrus';

declare module '@mysten/sui/client' {
  interface SuiClient {
    /**
     * Walrus extension providing decentralized storage capabilities.
     *
     * Available after calling: `suiClient.$extend(walrus({...}))`
     *
     * @example
     * ```ts
     * const client = suiClient.$extend(walrus({ network: 'testnet' }));
     * const blobId = await client.walrus.store(data);
     * ```
     */
    walrus: WalrusClient;
  }
}
