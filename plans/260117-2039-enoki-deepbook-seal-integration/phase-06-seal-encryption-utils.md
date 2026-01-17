# Phase 06: Seal Encryption Utilities

## Context
[Seal Research](./research/researcher-deepbook-seal-report.md#2-walrus-seal-encryption-ibe)

## Overview
- **Effort**: 4-6h | **Priority**: P1 | **Status**: pending
- Identity-based encryption for token-gated blob access

## Files to Create
- `templates/metadata-seal/lib/seal-encryption.ts` (~120 lines)
- `templates/metadata-seal/hooks/useEncryptedUpload.ts` (~100 lines)
- `templates/metadata-seal/hooks/useDecrypt.ts` (~80 lines)
- `templates/metadata-seal/components/EncryptedUpload.tsx` (~150 lines)

## Implementation

### Encryption Utility
```typescript
import { SealClient } from '@mysten/walrus-seal-sdk';

export async function encryptForRecipient(
  data: Uint8Array,
  recipientAddress: string
): Promise<{ ciphertext: Uint8Array; meta: EncryptionMeta }> {
  const seal = new SealClient();
  return await seal.encrypt(data, recipientAddress);
}

export async function decryptBlob(
  ciphertext: Uint8Array,
  meta: EncryptionMeta,
  privateKey: Uint8Array
): Promise<Uint8Array> {
  const seal = new SealClient();
  return await seal.decrypt(ciphertext, meta, privateKey);
}
```

### React Hook
```typescript
export function useEncryptedUpload() {
  const { address } = useSession();

  return useMutation({
    mutationFn: async ({ file, recipientAddress }) => {
      const data = new Uint8Array(await file.arrayBuffer());
      const { ciphertext, meta } = await encryptForRecipient(data, recipientAddress);

      // Upload encrypted blob
      const blob = new Blob([ciphertext]);
      const { blobId } = await storageAdapter.upload(blob);

      // Store metadata on-chain (via Move contract)
      await storeEncryptionMeta(blobId, meta, recipientAddress);

      return { blobId, meta };
    },
  });
}
```

## Success Criteria
- [ ] Encrypt blob for specific Sui address
- [ ] Upload encrypted blob to Walrus
- [ ] Decrypt blob with correct private key
- [ ] Access denied for unauthorized addresses
