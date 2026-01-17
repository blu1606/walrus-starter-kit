# Phase 04: Walrus Adapter Extension

## Context
[Phase 03 - Sponsored API](./phase-03-sponsored-transaction-api.md) | [WalrusStorageAdapter](../../templates/sdk-mysten/src/adapter.ts)

## Overview
- **Effort**: 3-4h | **Priority**: P1 | **Status**: pending
- Extend WalrusStorageAdapter to support sponsored uploads via /api/sponsor-tx

## Files to Create
- `templates/enoki/adapters/sponsored-storage.ts` (~150 lines)
- `templates/enoki/hooks/useSponsoredUpload.ts` (~80 lines)

## Implementation

### SponsoredWalrusAdapter
```typescript
import { WalrusStorageAdapter } from '../../sdk-mysten/adapter';
import { useSession } from '../hooks/useSession';

export class SponsoredWalrusAdapter extends WalrusStorageAdapter {
  async upload(file: File, options?: UploadOptions) {
    const { address, isUsingEnoki } = useSession();

    if (!isUsingEnoki || !address) {
      // Fallback to standard upload
      return super.upload(file, options);
    }

    // Build transaction bytes (no gas)
    const tx = this.buildUploadTransaction(file, options);
    tx.setSender(address);

    const txBytes = await tx.build({
      client: suiClient,
      onlyTransactionKind: true,
    });

    // Create sponsored transaction
    const { bytes, digest } = await fetch('/api/sponsor-tx', {
      method: 'POST',
      body: JSON.stringify({
        action: 'create',
        transactionKindBytes: toB64(txBytes),
        sender: address,
      }),
    }).then(r => r.json());

    // Sign with zkLogin keypair
    const keypair = await enokiFlow.getKeypair({ network });
    const { signature } = await keypair.signTransaction(fromB64(bytes));

    // Execute
    const result = await fetch('/api/sponsor-tx', {
      method: 'POST',
      body: JSON.stringify({ action: 'execute', digest, signature }),
    }).then(r => r.json());

    return { blobId: extractBlobId(result), digest };
  }
}
```

## Success Criteria
- [ ] Sponsored upload works for zkLogin users
- [ ] Fallback to standard upload for wallet users
- [ ] Rate limit errors shown to user
- [ ] Test both auth methods (zkLogin + wallet)
