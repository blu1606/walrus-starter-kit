# Phase 04: Upload Integration with zkLogin

## Context Links

- Existing use-upload: `src/hooks/use-upload.ts`
- Walrus adapter: `src/lib/walrus/adapter.ts`
- Upload form: `src/components/features/upload-form.tsx`
- Enoki hooks: `@mysten/enoki/react`

## Overview

**Priority:** P1
**Status:** complete ✓
**Completed:** 2026-01-18
**Description:** Adapt upload hook to work with both zkLogin and standard wallet signers

## Key Insights

- Enoki provides zkLogin signer via `useZkLoginSession()`
- Upload requires `signAndExecuteTransaction` function
- Must support both auth methods without breaking changes
- zkLogin signer interface compatible with wallet signer
- Prioritize zkLogin if both available

## Requirements

### Functional
- Upload works with zkLogin signer
- Upload works with standard wallet signer
- Clear error when neither auth method available
- Automatic signer selection (prefer zkLogin)
- Backward compatible with existing upload flow

### Non-Functional
- Hook under 100 lines
- Type-safe signer selection
- Clear error messages
- No performance regression

## Architecture

```
Upload Flow Decision Tree:
1. Check zkLogin session exists
   ├─ YES → Use zkLogin signer
   └─ NO → Check standard wallet connected
       ├─ YES → Use wallet signer
       └─ NO → Throw error "No wallet connected"

Signer Interface (unified):
{
  address: string;
  signAndExecuteTransaction: (args) => Promise<{ digest: string }>;
}
```

**Data Flow:**
```
UploadForm
  └─ useUpload() hook
      ├─ useEnokiAuth() → zkLogin signer
      ├─ useWallet() → standard wallet signer
      └─ Select active signer
          └─ storageAdapter.upload(file, { signer })
```

## Related Code Files

### To Modify
- `src/hooks/use-upload.ts` - Add zkLogin signer support
- `src/hooks/use-wallet.ts` - Export unified signer interface

### To Reference
- `@mysten/enoki/react` - useZkLoginSession
- `src/lib/walrus/adapter.ts` - Upload implementation
- `src/lib/walrus/types.ts` - Signer type definitions

### No Changes Needed
- `src/components/features/upload-form.tsx` - Uses hook unchanged
- `src/lib/walrus/client.ts` - Upload logic unchanged

## Implementation Steps

1. Update `src/hooks/use-wallet.ts` to export signer
   ```ts
   import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';

   export function useWallet() {
     const currentAccount = useCurrentAccount();
     const { mutate: signAndExecute } = useSignAndExecuteTransaction();

     const getSigner = () => {
       if (!currentAccount) return null;

       const signTransaction = (args) => {
         return new Promise((resolve, reject) => {
           signAndExecute(
             { transaction: args.transaction },
             {
               onSuccess: (result) => resolve({ digest: result.digest }),
               onError: (error) => reject(error),
             }
           );
         });
       };

       return {
         address: currentAccount.address,
         signAndExecuteTransaction: signTransaction,
       };
     };

     return {
       isConnected: !!currentAccount,
       address: currentAccount?.address,
       getSigner,
     };
   }
   ```

2. Update `src/hooks/use-enoki-auth.ts` to export signer
   ```ts
   import { useZkLoginSession } from '@mysten/enoki/react';

   export function useEnokiAuth() {
     const { address, session } = useZkLoginSession();

     const getSigner = () => {
       if (!address || !session) return null;

       return {
         address,
         signAndExecuteTransaction: async (args) => {
           const result = await session.signAndExecuteTransaction({
             transaction: args.transaction,
           });
           return { digest: result.digest };
         },
       };
     };

     return {
       isEnokiConnected: !!address,
       enokiAddress: address,
       getSigner,
       // ... existing login/logout
     };
   }
   ```

3. Refactor `src/hooks/use-upload.ts` for dual auth
   ```ts
   import { useMutation } from '@tanstack/react-query';
   import { useSuiClient } from '@mysten/dapp-kit';
   import { storageAdapter } from '../lib/walrus/index.js';
   import { useEnokiAuth } from './use-enoki-auth.js';
   import { useWallet } from './use-wallet.js';

   export function useUpload() {
     const suiClient = useSuiClient();
     const { getSigner: getEnokiSigner } = useEnokiAuth();
     const { getSigner: getWalletSigner } = useWallet();

     return useMutation({
       mutationFn: async ({ file, options }) => {
         // Prioritize zkLogin, fallback to standard wallet
         const signer = getEnokiSigner() || getWalletSigner();

         if (!signer) {
           throw new Error(
             'No wallet connected. Please login with Google or connect a wallet.'
           );
         }

         const blobId = await storageAdapter.upload(file, {
           ...options,
           client: suiClient,
           signer,
         });

         return { blobId, file };
       },
     });
   }
   ```

4. Add type definitions for unified signer in `src/lib/walrus/types.ts`
   ```ts
   export interface UnifiedSigner {
     address: string;
     signAndExecuteTransaction: (args: {
       transaction: Transaction;
     }) => Promise<{ digest: string }>;
   }
   ```

5. Update upload form error handling
   - Clear error messages for auth failures
   - Distinguish between "not connected" and "upload failed"

6. Verify all imports use .js extensions

7. Test both auth flows
   - Upload with zkLogin
   - Upload with standard wallet
   - Error when neither connected

## Todo List

- [ ] Add getSigner() to use-wallet.ts
- [ ] Export wallet signer interface
- [ ] Add getSigner() to use-enoki-auth.ts
- [ ] Export zkLogin signer interface
- [ ] Define UnifiedSigner type in types.ts
- [ ] Refactor use-upload.ts for dual auth
- [ ] Implement signer priority (zkLogin first)
- [ ] Update error messages for clarity
- [ ] Verify TypeScript compilation
- [ ] Test upload with zkLogin
- [ ] Test upload with standard wallet
- [ ] Test error when no auth

## Success Criteria

- Upload succeeds with zkLogin signer
- Upload succeeds with wallet signer
- zkLogin prioritized when both available
- Clear error when no auth connected
- No breaking changes to upload UI
- TypeScript compilation succeeds
- use-upload.ts under 100 lines

## Risk Assessment

**Low Risk:**
- Signer interfaces already compatible
- Upload logic unchanged

**Mitigation:**
- Comprehensive error handling
- Test both auth paths
- Fallback to wallet if zkLogin fails

## Security Considerations

- Signer selection happens client-side
- Transaction signing uses secure Enoki SDK
- No private key exposure
- Session validation by Enoki backend

## Next Steps

→ Phase 05: Write comprehensive documentation and setup guide
