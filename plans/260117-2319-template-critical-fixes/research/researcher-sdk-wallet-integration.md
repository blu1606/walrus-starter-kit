# Research Report: Walrus SDK v0.9.0 & Wallet Integration Architecture

## 1. Walrus SDK v0.9.0 API Changes

### `writeBlob` Signature
In v0.9.0, the SDK shifts from positional arguments to an object-based parameter pattern for improved extensibility.
- **Old (pre-0.9.0)**: Often used `writeBlobToUploadRelay(data, options)` or positional `writeBlob(data, epochs)`.
- **New (0.9.0)**: Unified `writeBlob` call using an object:
  ```typescript
  await client.writeBlob({
    blob: Uint8Array | ReadableStream,
    epochs: number,
    signer: Signer, // Required for on-chain registration
  });
  ```

### `readBlob` and `getBlobMetadata`
- `readBlob(blobId)` remains largely consistent but returns a `Uint8Array`.
- `getBlobMetadata(blobId)` now returns a versioned structure.

### Metadata Structure Changes
The metadata response is now wrapped in a versioning layer (e.g., `V1`) to support future protocol upgrades.
- **Field Name Change**: `size` is often replaced or supplemented by `unencoded_length` (the actual size of the data before erasure coding).
- **Structure Example**:
  ```json
  {
    "metadata": {
      "V1": {
        "blobId": "...",
        "unencoded_length": 1024,
        "epochs": 5,
        "contentType": "image/png"
      }
    }
  }
  ```

### Signer Requirements
Write operations that involve registering the blob on the Sui blockchain (to ensure availability) now strictly require a `Signer`. Previously, some "relay" patterns might have obfuscated this requirement, but 0.9.0 emphasizes the need for the caller's signature.

---

## 2. Current Wallet Integration Analysis

### Implementation Status
- **Location**: `packages/cli/templates/react/src/hooks/useWallet.ts`
- **Mechanism**: Wraps `@mysten/dapp-kit`'s `useCurrentAccount()` and `useSignAndExecuteTransaction()`.
- **Context**: Exists purely in the React layer.

### The "Adapter Gap"
The `MystenStorageAdapter` is currently a singleton exported from `adapter.ts`. It retrieves a `WalrusClient` via `getWalrusClient()`, which is initialized once without knowledge of the user's wallet/signer.

**Current Conflict**:
- SDK `upload` needs a `Signer`.
- `useWallet` (React) has the `Signer`.
- `MystenStorageAdapter` (Vanilla TS) performs the upload but has no access to React hooks.

---

## 3. Proposed Architecture Patterns

### Pattern A: Dependency Injection via Method Options (Recommended)
Update the `StorageAdapter` interface to allow an optional `signer` or `provider` in `UploadOptions`.

**Pros**: Clean separation; adapter remains stateless.
**Cons**: Leaks Sui-specific types into the base `StorageAdapter` interface unless abstracted.

### Pattern B: Provider/Signer Registry
The adapter holds a mutable `signer` reference that is set/cleared by the `useWallet` hook during connection changes.

**Pros**: `useUpload` hook stays simple.
**Cons**: Introduces global state; risk of race conditions or stale signers.

### Pattern C: Higher-Order Adapter Hook
Create a `useStorageAdapter` hook that merges the base adapter with the current wallet context.

```typescript
export function useStorageAdapter() {
  const { signer } = useWallet();
  return {
    upload: (data) => storageAdapter.upload(data, { signer }),
    // ...
  };
}
```

---

## 4. Security & Architectural Trade-offs

| Aspect | Method Injection | Registry Pattern | HOC Hook |
| :--- | :--- | :--- | :--- |
| **Separation** | Excellent | Poor (Global state) | Good |
| **Type Safety** | High | Medium | High |
| **Ease of Use** | Moderate | Easy | Easy |
| **Security** | High (Caller controlled) | Risky (Stale state) | High |

**Recommendation**: Use **Pattern C**. It maintains the "Vanilla TS" nature of the adapter while using React's lifecycle to inject the necessary credentials at the point of use.

---

## 5. Unresolved Questions
1. Does `writeBlobToUploadRelay` still exist in 0.9.0, or is it fully deprecated in favor of `writeBlob` with a specific `publisherUrl`?
2. How should the `StorageAdapter` interface handle the `unencoded_length` vs `size` ambiguity to stay "Universal"?
3. Is `Signer` from `@mysten/sui` compatible with the `signer` object returned by all Walrus-compatible wallets?
