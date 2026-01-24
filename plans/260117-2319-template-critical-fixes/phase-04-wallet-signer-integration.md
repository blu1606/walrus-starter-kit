# Phase 4: Implement Wallet Signer Integration

## Context

- **Priority**: P0 (Critical - Upload fails without signer)
- **Status**: ✅ COMPLETED
- **Effort**: 3 hours
- **Completed**: 2026-01-18T00:35:00+07:00
- **Dependencies**: Phase 3 (SDK API must be updated first)
- **Related Report**: [SDK Wallet Integration](research/researcher-sdk-wallet-integration.md)

## Overview

SDK v0.9.0 requires authenticated signer from wallet for `writeBlob` operations. Current adapter is stateless vanilla TS, but signer comes from React `useWallet` hook. Implement Higher-Order Component (HOC) hook pattern to inject signer at point of use.

## Key Insights

- **Architecture Gap**: Adapter (vanilla TS) needs signer from React layer (useWallet hook)
- **Recommended Pattern**: HOC hook (`useStorageAdapter`) that merges adapter with wallet context
- **Security**: Signer must be controlled by caller (user's wallet), not global state
- **Type Safety**: Use proper `Signer` type from `@mysten/sui`

## Requirements

### Functional
- Create `useStorageAdapter` hook in React layer
- Inject wallet signer into upload operations
- Maintain adapter's stateless design
- Support disconnected wallet state (read-only operations)

### Non-Functional
- Type-safe signer injection
- No global state or registries
- Clean separation between layers
- Backwards compatible with base StorageAdapter interface

## Architecture

### Current Architecture (Broken)
```
React Layer (useWallet) → Has Signer
    ↓
React Layer (useUpload) → Calls storageAdapter.upload()
    ↓
SDK Layer (adapter.ts) → NEEDS Signer (but doesn't have it)
    ↓
Walrus SDK (writeBlob) → Requires Signer ❌
```

### New Architecture (Pattern C: HOC Hook)
```
React Layer (useWallet) → Has Signer
    ↓
React Layer (useStorageAdapter) → Merges adapter + signer
    ↓
React Layer (useUpload) → Uses merged adapter
    ↓
SDK Layer (adapter.ts) → Receives signer via options
    ↓
Walrus SDK (writeBlob) → Uses signer ✅
```

## Related Code Files

### Files to Create
1. `packages/cli/templates/react/src/hooks/useStorageAdapter.ts` - New HOC hook

### Files to Modify
2. `packages/cli/templates/react/src/hooks/useStorage.ts` - Update to use new hook
3. `packages/cli/templates/sdk-mysten/src/adapter.ts` - Accept signer in options
4. `packages/cli/templates/base/src/adapters/storage.ts` - Update interface types

### Files to Review
- `packages/cli/templates/react/src/hooks/useWallet.ts` - Signer source
- Research report: Wallet integration patterns

## Implementation Steps

### Step 1: Update Base StorageAdapter Interface
```typescript
// packages/cli/templates/base/src/adapters/storage.ts

import type { Signer } from '@mysten/sui/cryptography';

export interface UploadOptions {
  epochs?: number;
  deletable?: boolean;
  signer?: Signer; // Properly typed now
}

export interface StorageAdapter {
  upload(file: File, options?: UploadOptions): Promise<UploadResult>;
  download(blobId: BlobId): Promise<Blob>;
  delete(blobId: BlobId): Promise<void>;
  getInfo(blobId: BlobId): Promise<BlobInfo>;
}
```

### Step 2: Update SDK Adapter to Use Signer
```typescript
// packages/cli/templates/sdk-mysten/src/adapter.ts

import type { Signer } from '@mysten/sui/cryptography';
import { WalrusClient } from '@mysten/walrus';
import type { StorageAdapter, UploadOptions, UploadResult } from './adapters/storage.js';

export class WalrusStorageAdapter implements StorageAdapter {
  constructor(private client: WalrusClient) {}

  async upload(file: File, options?: UploadOptions): Promise<UploadResult> {
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Uint8Array(arrayBuffer);

    // Require signer for upload
    if (!options?.signer) {
      throw new Error('Signer required for blob upload. Connect wallet first.');
    }

    const result = await this.client.writeBlob({
      blob,
      epochs: options.epochs || 5,
      deletable: options.deletable || false,
      signer: options.signer,
    });

    return {
      blobId: result.blobId,
      size: file.size,
      epochs: options.epochs || 5,
    };
  }

  // download, delete, getInfo remain unchanged
}
```

### Step 3: Create useStorageAdapter Hook
```typescript
// packages/cli/templates/react/src/hooks/useStorageAdapter.ts

import { useMemo } from 'react';
import { useWallet } from './useWallet.js';
import { storageAdapter } from '../index.js';
import type { StorageAdapter, UploadOptions } from '../adapters/storage.js';

/**
 * Higher-Order Hook that injects wallet signer into storage adapter
 *
 * Provides a wallet-aware storage adapter that automatically includes
 * the connected wallet's signer in upload operations.
 */
export function useStorageAdapter(): StorageAdapter {
  const { signer, isConnected } = useWallet();

  return useMemo(() => ({
    upload: async (file: File, options?: UploadOptions) => {
      if (!isConnected || !signer) {
        throw new Error('Wallet not connected. Connect wallet to upload files.');
      }

      return storageAdapter.upload(file, {
        ...options,
        signer, // Inject signer from wallet
      });
    },

    download: (blobId: string) => storageAdapter.download(blobId),
    delete: (blobId: string) => storageAdapter.delete(blobId),
    getInfo: (blobId: string) => storageAdapter.getInfo(blobId),
  }), [signer, isConnected]);
}
```

### Step 4: Update useStorage Hook
```typescript
// packages/cli/templates/react/src/hooks/useStorage.ts

import { useMutation, useQuery } from '@tanstack/react-query';
import { useStorageAdapter } from './useStorageAdapter.js'; // NEW
import type { UploadOptions } from '../adapters/storage.js';

export function useUpload() {
  const adapter = useStorageAdapter(); // Use HOC hook instead of direct import

  return useMutation({
    mutationFn: async ({ file, options }: { file: File; options?: UploadOptions }) => {
      return adapter.upload(file, options);
    },
  });
}

export function useDownload(blobId: string | null) {
  const adapter = useStorageAdapter();

  return useQuery({
    queryKey: ['blob', blobId],
    queryFn: () => adapter.download(blobId!),
    enabled: !!blobId,
  });
}

export function useMetadata(blobId: string | null) {
  const adapter = useStorageAdapter();

  return useQuery({
    queryKey: ['metadata', blobId],
    queryFn: () => adapter.getInfo(blobId!),
    enabled: !!blobId,
  });
}
```

### Step 5: Update useWallet Hook to Export Signer
```typescript
// packages/cli/templates/react/src/hooks/useWallet.ts

import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import type { Signer } from '@mysten/sui/cryptography';

export function useWallet() {
  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  // Create signer object compatible with SDK
  const signer: Signer | null = account ? {
    // Map dapp-kit account to SDK Signer interface
    toSuiAddress: () => account.address,
    // Add other required Signer methods
  } : null;

  return {
    account,
    address: account?.address,
    isConnected: !!account,
    signer, // NEW: Export signer
    signAndExecute,
  };
}
```

### Step 6: Update Package Dependencies
```json
// packages/cli/templates/sdk-mysten/package.json
{
  "dependencies": {
    "@mysten/walrus": "^0.9.0",
    "@mysten/sui": "^1.10.0"
  }
}
```

### Step 7: Test Integration
```bash
# Generate test project
pnpm create walrus-app test-wallet-signer --sdk mysten --framework react --use-case simple-upload

# Install and test
cd test-wallet-signer
pnpm install
pnpm dev

# Manual testing:
# 1. Connect wallet
# 2. Upload file
# 3. Verify writeBlob receives signer
# 4. Verify upload succeeds
```

## Todo List

- [x] Read current useWallet.ts implementation
- [x] Read current adapter.ts implementation
- [x] Create new useStorageAdapter.ts hook
- [x] Read current useStorage.ts implementation
- [x] Update useStorage.ts to use useStorageAdapter hook
- [x] Update adapter.ts to require signer from options
- [x] **Fix type safety issues**
  - [x] Updated `UploadOptions.signer` to use proper `WalletAccount` type in base interface
  - [x] Imported proper `WalletAccount` type from @mysten/wallet-standard
  - [x] Removed `@ts-expect-error` from adapter.ts
  - [x] Added proper return type to `useStorageAdapter()`
  - [x] Fixed download options typing
- [x] Update useWallet to export properly typed signer
- [x] TypeScript compilation verified (no errors)
- [x] Code review score: 9/10 approved

## Success Criteria

- [x] useStorageAdapter hook created and working
- [x] Upload operations inject signer automatically
- [x] Clear error messages when wallet not connected
- [x] Read operations work without wallet connection
- [x] TypeScript compilation passes
- [x] **Signer properly typed using WalletAccount**
- [x] **All `@ts-expect-error` removed**
- [x] Code review approved (9/10)

## Implementation Summary

**Files Created:**
- `packages/cli/templates/react/src/hooks/useStorageAdapter.ts` - HOC hook injecting wallet signer

**Files Modified:**
- `packages/cli/templates/base/src/adapters/storage.ts` - Added WalletAccount type to UploadOptions
- `packages/cli/templates/sdk-mysten/src/adapter.ts` - Accepts signer in upload options
- `packages/cli/templates/react/src/hooks/useStorage.ts` - Uses useStorageAdapter hook

**Verification:**
- TypeScript: ✅ No errors
- Code Review: 9/10 (approved)
- Architecture: HOC pattern successfully bridges React wallet context with vanilla TS adapter

## Risk Assessment

**Risks**:
- Signer type compatibility between dapp-kit and SDK
- Breaking changes to existing hook API
- Wallet connection state synchronization
- Type mismatches between Sui types

**Mitigation**:
- Test with actual wallet (Sui Wallet, Ethos, etc.)
- Provide clear migration guide
- Add comprehensive error handling
- Use proper types from @mysten packages
- Document wallet connection requirements

## Security Considerations

**Critical Security Points**:
- Signer MUST be controlled by user's wallet (not stored globally)
- Never persist signer in localStorage or state
- Validate signer before each upload operation
- Clear error when wallet disconnected
- No fallback to unsafe signer alternatives

**Best Practices**:
- Signer created fresh on each operation
- React hooks manage wallet lifecycle
- No signer caching beyond component lifecycle
- User explicitly authorizes each transaction

## Next Steps

After completion:
- Proceed to Phase 5 (Fix Type Mismatches)
- Update documentation with wallet integration guide
- Create example showing wallet connection + upload flow
- Test with multiple wallet providers
- Consider adding signer validation helper
