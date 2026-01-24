# Phase 1: Simple Upload Preset Comments

## Context

Target: `packages/cli/presets/react-mysten-simple-upload`

## Changes

1. **`src/lib/walrus/client.ts`**:
   - Explain Singleton pattern for client.
   - Explain Network config mapping.
   - Explain `suiClient.$extend(walrus(...))` pattern.

2. **`src/providers/WalletProvider.tsx`**:
   - Explain `createClient` factory in `SuiClientProvider`.
   - Explain why we extend the client here for the DApp Kit.

3. **`src/hooks/use-upload.ts`**:
   - Explain `useMutation` for async operations.
   - Explain the `signTransaction` wrapper promise.

## Files

- `packages/cli/presets/react-mysten-simple-upload/src/lib/walrus/client.ts`
- `packages/cli/presets/react-mysten-simple-upload/src/providers/WalletProvider.tsx`
- `packages/cli/presets/react-mysten-simple-upload/src/hooks/use-upload.ts`
