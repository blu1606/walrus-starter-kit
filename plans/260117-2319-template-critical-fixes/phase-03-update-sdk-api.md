# Phase 3: Update Walrus SDK v0.9.0 API Calls

## Context

- **Priority**: P0 (Critical - API incompatibility)
- **Status**: COMPLETED (2026-01-18T00:17:00+07:00)
- **Effort**: 2 hours
- **Dependencies**: Phase 1 (import paths must be correct first)
- **Related Report**: [SDK v0.9.0 Analysis](research/researcher-sdk-wallet-integration.md)

## Overview

Walrus SDK v0.9.0 introduces breaking API changes. All SDK method calls must be updated from positional arguments to object-based parameters. Metadata structure changed from flat to versioned (V1).

## Key Insights

- SDK moved to object-based parameter pattern for extensibility
- `writeBlob` now requires `{ blob, epochs, deletable, signer }`
- `readBlob` and `getBlobMetadata` take object `{ blobId }`
- Metadata structure: `metadata.metadata.V1.unencoded_length` (nested)
- All methods use consistent object pattern

## Requirements

### Functional
- Update all `writeBlob`, `readBlob`, `getBlobMetadata` calls
- Handle new metadata structure (`V1` versioning)
- Prepare for signer injection (Phase 4 dependency)
- Maintain StorageAdapter interface compatibility

### Non-Functional
- Backwards compatible with base StorageAdapter interface
- No breaking changes to use case layers
- Type-safe SDK calls

## Architecture

### Old API (Pre-v0.9.0)
```typescript
// Positional arguments
const result = await client.writeBlob(data, epochs);
const blob = await client.readBlob(blobId);
const metadata = await client.getBlobMetadata(blobId);
const size = metadata.size; // Flat structure
```

### New API (v0.9.0)
```typescript
// Object parameters
const result = await client.writeBlob({
  blob: data,
  epochs: epochs,
  deletable: false,
  signer: signer, // Required for on-chain registration
});

const blob = await client.readBlob({ blobId });
const metadata = await client.getBlobMetadata({ blobId });
const size = metadata.metadata.V1.unencoded_length; // Nested versioned structure
```

## Related Code Files

### Files to Modify
1. `packages/cli/templates/sdk-mysten/src/adapter.ts` - Main adapter implementation
2. `packages/cli/templates/sdk-mysten/src/client.ts` - Client initialization (if needed)

### Files to Review (Context)
- `packages/cli/templates/base/src/adapters/storage.ts` - Interface definition
- `packages/cli/templates/base/src/types/walrus.ts` - Type definitions
- Research report: SDK v0.9.0 API documentation

## Implementation Steps

### Step 1: Read Current Adapter Implementation
```bash
# Review current adapter.ts to understand method signatures
Read packages/cli/templates/sdk-mysten/src/adapter.ts
```

### Step 2: Update writeBlob Implementation
```typescript
// BEFORE
async upload(file: File, options?: UploadOptions): Promise<UploadResult> {
  const arrayBuffer = await file.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);

  const result = await (client as any).writeBlob(data, options?.epochs || 5);

  return {
    blobId: result.blobId,
    size: file.size,
    epochs: options?.epochs || 5,
  };
}

// AFTER
async upload(file: File, options?: UploadOptions): Promise<UploadResult> {
  const arrayBuffer = await file.arrayBuffer();
  const blob = new Uint8Array(arrayBuffer);

  // Signer will be injected in Phase 4
  const signer = options?.signer; // TODO: Add signer to UploadOptions interface
  if (!signer) {
    throw new Error('Signer required for blob upload');
  }

  const result = await client.writeBlob({
    blob,
    epochs: options?.epochs || 5,
    deletable: options?.deletable || false,
    signer,
  });

  return {
    blobId: result.blobId,
    size: file.size,
    epochs: options?.epochs || 5,
  };
}
```

### Step 3: Update readBlob Implementation
```typescript
// BEFORE
async download(blobId: BlobId): Promise<Blob> {
  const data = await client.readBlob(blobId);
  return new Blob([data]);
}

// AFTER
async download(blobId: BlobId): Promise<Blob> {
  const data = await client.readBlob({ blobId });
  return new Blob([data as any]); // Cast to fix type mismatch (Phase 5)
}
```

### Step 4: Update getBlobMetadata Implementation
```typescript
// BEFORE
async getInfo(blobId: BlobId): Promise<BlobInfo> {
  const metadata = await client.getBlobMetadata(blobId);

  return {
    blobId,
    size: metadata.size,
    uploadedAt: new Date(metadata.timestamp),
    expiresAt: new Date(metadata.expiresAt),
  };
}

// AFTER
async getInfo(blobId: BlobId): Promise<BlobInfo> {
  const response = await client.getBlobMetadata({ blobId });

  // Access nested V1 structure
  const metadata = response.metadata.V1;

  return {
    blobId,
    size: metadata.unencoded_length, // Changed from 'size'
    uploadedAt: metadata.timestamp ? new Date(metadata.timestamp) : new Date(),
    expiresAt: metadata.expiresAt ? new Date(metadata.expiresAt) : new Date(),
  };
}
```

### Step 5: Update UploadOptions Interface (Prepare for Phase 4)
```typescript
// packages/cli/templates/base/src/adapters/storage.ts
export interface UploadOptions {
  epochs?: number;
  deletable?: boolean;
  signer?: any; // Will be typed properly in Phase 4
}
```

### Step 6: Verify Type Safety
```bash
# Check TypeScript compilation
cd packages/cli/templates/sdk-mysten
pnpm tsc --noEmit
```

## Todo List

- [x] Read current adapter.ts implementation
- [x] Update writeBlobToUploadRelay to use object parameters
- [x] Add signer field to UploadOptions (prepared for Phase 4)
- [x] Update readBlob to use object parameters
- [x] Update getBlobMetadata to use object parameters
- [x] Fix metadata.V1.unencoded_length access with validation
- [x] Update UploadOptions interface in base layer
- [x] Run TypeScript compilation check
- [x] Document API changes in completion report

## Success Criteria

- [x] All SDK method calls use v0.9.0 object parameter pattern
- [x] Metadata accessed via `metadata.V1.unencoded_length` with validation
- [x] UploadOptions interface includes signer field (any type, Phase 4 will type)
- [x] TypeScript compilation passes with no errors
- [x] Code prepared for wallet signer integration (Phase 4)
- [x] No breaking changes to StorageAdapter interface

## Risk Assessment

**Risks**:
- Signer parameter not yet properly integrated (Phase 4 dependency)
- Metadata structure may vary between SDK versions
- Type mismatches between SDK types and adapter types

**Mitigation**:
- Use `any` type temporarily for signer (Phase 4 will type properly)
- Add runtime checks for metadata structure
- Test with actual v0.9.0 SDK package
- Document breaking changes for users

## Security Considerations

- Signer handling critical for security (Phase 4 will address)
- Validate metadata structure before accessing nested fields
- Add error handling for missing signer
- Consider adding signer validation

## Implementation Summary

### Changes Made

**1. adapter.ts (sdk-mysten)**
- Line 22-25: Updated `writeBlobToUploadRelay` to object params `{ blob, nEpochs }`
- Line 21: Added inline comment for Phase 4 signer dependency
- Line 45: Updated `readBlob` to object param `{ blobId }`
- Line 60: Updated `getBlobMetadata` to object param `{ blobId }`
- Line 63-65: Added V1 structure validation before access
- Line 67: Access metadata via `response.metadata.V1`
- Line 71: Changed `size` to `metadata.unencoded_length`

**2. storage.ts (base adapter interface)**
- Line 22: Added `signer?: any` field to UploadOptions
- Line 22: Added TODO comment for Phase 4 typing

### Verification

- TypeScript compilation: Pass (verified `pnpm tsc --noEmit`)
- No breaking changes to StorageAdapter interface
- V1 metadata validation prevents runtime errors
- Signer interface prepared for wallet integration

## Next Steps

After completion:
- **CRITICAL**: Proceed to Phase 4 (Wallet Signer Integration)
- Update SDK version in package.json to v0.9.0
- Test upload flow end-to-end (requires Phase 4 signer)
- Document migration guide for existing users
