# Phase 5: Fix Type Mismatches

## Context

- **Priority**: P1 (High - Compilation errors)
- **Status**: ✅ Completed (No changes needed)
- **Effort**: 1 hour (Verification only)
- **Dependencies**: Phase 3 (SDK API update), Phase 4 (Wallet integration)
- **Completed**: 2026-01-18T00:58:00+07:00

## Completion Note

Phase 05 is COMPLETE without requiring implementation. The `StorageAdapter` interface was intentionally designed to return `Uint8Array`, NOT `Blob`. TypeScript compiles cleanly with zero type errors. The phase plan was based on incorrect assumptions about type mismatches between SDK and interface.

**Key Finding**: Interface specifies `download(): Promise<Uint8Array>` (storage.ts:45). Adapter correctly returns `Uint8Array` from SDK (adapter.ts:54). No type cast needed. Browser applications can convert to Blob via `new Blob([uint8Array])` when needed.

## Overview

Fix TypeScript type mismatches between SDK types and application code. Primary issue: `Uint8Array` vs `Blob` constructor incompatibility. Also address any type conflicts from SDK v0.9.0 migration.

## Key Insights

- SDK `readBlob` returns `Uint8Array`
- JavaScript `Blob` constructor expects `BlobPart[]` type
- TypeScript strict mode rejects `Uint8Array` → `Blob` without cast
- Solution: Cast as `new Blob([data as any])`
- May need similar casts for other SDK type mismatches

## Requirements

### Functional
- Fix Uint8Array to Blob conversion
- Resolve any metadata type mismatches
- Ensure strict TypeScript compliance
- Maintain runtime correctness

### Non-Functional
- Minimal use of `any` type (only where necessary)
- Document type cast rationale
- Preserve type safety where possible

## Architecture

### Current Type Mismatch
```typescript
// adapter.ts - download method
async download(blobId: BlobId): Promise<Blob> {
  const data = await client.readBlob({ blobId }); // Returns Uint8Array
  return new Blob([data]); // ❌ TypeScript error
  // Type 'Uint8Array' is not assignable to type 'BlobPart'
}
```

### Fixed Implementation
```typescript
async download(blobId: BlobId): Promise<Blob> {
  const data = await client.readBlob({ blobId });
  return new Blob([data as any]); // ✅ Explicit cast with comment
}
```

## Related Code Files

### Files to Modify
1. `packages/cli/templates/sdk-mysten/src/adapter.ts` - Blob constructor cast
2. `packages/cli/templates/base/src/types/walrus.ts` - Type definitions (if needed)

### Files to Review
- `packages/cli/templates/react/src/hooks/useStorage.ts` - Type usage
- SDK type definitions from `@mysten/walrus`

## Implementation Steps

### Step 1: Fix Blob Constructor in adapter.ts
```typescript
// packages/cli/templates/sdk-mysten/src/adapter.ts

async download(blobId: BlobId): Promise<Blob> {
  const data = await client.readBlob({ blobId });

  // Cast required: SDK returns Uint8Array, Blob expects BlobPart[]
  // This is safe as Uint8Array is a valid Blob part at runtime
  return new Blob([data as any]);
}
```

### Step 2: Review Metadata Type Handling
```typescript
// Check if metadata types need adjustment
async getInfo(blobId: BlobId): Promise<BlobInfo> {
  const response = await client.getBlobMetadata({ blobId });

  // Ensure V1 structure access is type-safe
  const metadata = response.metadata.V1;

  return {
    blobId,
    size: metadata.unencoded_length,
    uploadedAt: metadata.timestamp ? new Date(metadata.timestamp) : new Date(),
    expiresAt: metadata.expiresAt ? new Date(metadata.expiresAt) : new Date(),
  };
}
```

### Step 3: Add Type Documentation
```typescript
// Add JSDoc comments explaining type casts

/**
 * Downloads a blob from Walrus storage
 *
 * @param blobId - The unique identifier for the blob
 * @returns Blob object for browser use
 *
 * @note SDK returns Uint8Array which requires casting for Blob constructor.
 *       This is safe as Uint8Array is a valid BlobPart at runtime.
 */
async download(blobId: BlobId): Promise<Blob> {
  const data = await client.readBlob({ blobId });
  return new Blob([data as any]);
}
```

### Step 4: Check React Layer Type Compatibility
```typescript
// Verify useStorage hooks handle types correctly
export function useDownload(blobId: string | null) {
  const adapter = useStorageAdapter();

  return useQuery({
    queryKey: ['blob', blobId],
    queryFn: async () => {
      const blob = await adapter.download(blobId!);
      // Verify blob is typed as Blob, not any
      return blob;
    },
    enabled: !!blobId,
  });
}
```

### Step 5: Add Type Assertions for File Input
```typescript
// If React components have type issues with File → Uint8Array conversion
async upload(file: File, options?: UploadOptions): Promise<UploadResult> {
  const arrayBuffer = await file.arrayBuffer();
  const blob = new Uint8Array(arrayBuffer); // Already type-safe

  // ... rest of upload logic
}
```

### Step 6: Run TypeScript Strict Check
```bash
# Verify no type errors in strict mode
cd packages/cli/templates/sdk-mysten
pnpm tsc --noEmit --strict

cd ../react
pnpm tsc --noEmit --strict
```

### Step 7: Generate and Test Project
```bash
# Generate test project
pnpm create walrus-app test-type-fixes --sdk mysten --framework react --use-case simple-upload

cd test-type-fixes
pnpm install

# Run TypeScript check
pnpm tsc --noEmit

# Verify no type errors
```

## Todo List

- [ ] Read current adapter.ts download method
- [ ] Add type cast to Blob constructor
- [ ] Add JSDoc comment explaining cast rationale
- [ ] Review metadata type handling
- [ ] Check React hooks for type compatibility
- [ ] Run TypeScript strict check on sdk-mysten
- [ ] Run TypeScript strict check on react template
- [ ] Generate test project
- [ ] Verify compilation with no type errors
- [ ] Test runtime behavior (ensure Blob works correctly)
- [ ] Document type casting decisions

## Success Criteria

- [ ] No TypeScript compilation errors in strict mode
- [ ] Blob constructor accepts Uint8Array with explicit cast
- [ ] All type casts documented with JSDoc comments
- [ ] Generated project compiles cleanly
- [ ] Runtime behavior correct (Blob usable in browser)
- [ ] Minimal use of `any` type (only where necessary)

## Risk Assessment

**Risks**:
- Excessive use of `any` type reduces type safety
- Type casts may hide real type incompatibilities
- Future SDK updates may change return types

**Mitigation**:
- Document every use of `any` with justification
- Add runtime checks where types are uncertain
- Keep casts minimal and localized
- Add tests to verify runtime correctness
- Monitor SDK type definition updates

## Security Considerations

- No security impact (type system only)
- Ensure type casts don't bypass important validation
- Verify Blob handling doesn't introduce XSS risks

## Next Steps

After completion:
- Proceed to Phase 6 (Remove Git Automation)
- Consider contributing type improvements to SDK
- Update documentation with type handling notes
- Monitor for SDK type definition updates
