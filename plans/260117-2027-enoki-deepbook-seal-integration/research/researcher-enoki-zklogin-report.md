# Enoki zkLogin Integration Research Report

## 1. Enoki SDK Architecture (@mysten/enoki)

### Core Packages
- **@mysten/enoki** (Server): EnokiClient for sponsored txns, backend auth
- **@mysten/enoki/react** (Client): EnokiFlowProvider, useEnokiFlow, useZkLogin hooks

### Version Compatibility (2026)
- Latest stable with @mysten/sui ^1.10.0
- Compatible with Next.js 15+, React 18+
- Requires Node.js >= 18.0.0

## 2. zkLogin Authentication Flow

### Client-Side Flow
```tsx
// Step 1: Provider Setup (sui-provider.tsx pattern)
<EnokiFlowProvider apiKey={ENOKI_API_KEY}>
  <WalletProvider storage={sessionStorageAdapter}>
    {children}
  </WalletProvider>
</EnokiFlowProvider>
```

### Authentication Sequence
```typescript
// 1. Initiate Google OAuth
await enokiFlow.createAuthorizationURL({
  provider: 'google',
  network: 'testnet',
  clientId: GOOGLE_CLIENT_ID,
  redirectUrl: `${origin}/auth/callback`,
  extraParams: {
    prompt: 'select_account',
    scope: ['openid', 'email', 'profile']
  }
});

// 2. Handle callback (auth/callback/page.tsx pattern)
await enokiFlow.handleAuthCallback(); // Generates ZK proof (2-5s)

// 3. Access session
const { address } = useZkLogin();
```

### Session Management Pattern
```typescript
// Unified session hook (use-session.ts)
const { address, isLoggedIn, isUsingEnoki } = useSession();

// Checks BOTH:
// - enokiAddress (from useZkLogin)
// - walletAddress (from useCurrentAccount)
```

## 3. Sponsored Transactions Architecture

### Backend API Route (/api/sponsor-tx/route.ts)
```typescript
// Server-side with SECRET key
const enokiClient = new EnokiClient({
  apiKey: ENOKI_SECRET_KEY // NEVER expose to frontend
});

// Create sponsored tx
const sponsoredTx = await enokiClient.createSponsoredTransaction({
  network: 'testnet',
  transactionKindBytes, // from frontend
  sender,
  allowedMoveCallTargets: [], // Configure in Enoki Console
  allowedAddresses: [sender]
});

// Execute with user signature
const result = await enokiClient.executeSponsoredTransaction({
  digest,
  signature // from frontend signing
});
```

### Frontend Execution Hook (use-execute-transaction.ts)
```typescript
// Build tx bytes (without gas)
tx.setSender(address);
const txBytes = await tx.build({
  client: suiClient,
  onlyTransactionKind: true
});

// Create sponsored tx via API
const { bytes, digest } = await fetch('/api/sponsor-tx', {
  method: 'POST',
  body: JSON.stringify({ action: 'create', transactionKindBytes, sender })
});

// Sign client-side
const keypair = await enokiFlow.getKeypair({ network: 'testnet' });
const { signature } = await keypair.signTransaction(sponsoredBytes);

// Execute via API
await fetch('/api/sponsor-tx', {
  body: JSON.stringify({ action: 'execute', digest, signature })
});
```

## 4. WalrusClient Integration Pattern

### Storage Adapter with Sponsored Upload
```typescript
// Extend WalrusStorageAdapter for sponsored txns
class SponsoredWalrusAdapter implements StorageAdapter {
  async upload(file: File, options?: UploadOptions): Promise<UploadResult> {
    // Use executeTransaction hook instead of direct WalrusClient
    const { executeTransaction } = useExecuteTransaction();

    // Build Walrus upload transaction
    const tx = new Transaction();
    // ... add Walrus upload PTB commands

    // Execute with automatic sponsorship detection
    const { digest } = await executeTransaction(tx);
    return { blobId, digest };
  }
}
```

### Provider Pattern
```tsx
// templates/enoki/providers/EnokiProvider.tsx
export function EnokiProvider({ children }: { children: ReactNode }) {
  return (
    <EnokiFlowProvider apiKey={ENOKI_API_KEY}>
      <SponsoredStorageProvider>
        {children}
      </SponsoredStorageProvider>
    </EnokiFlowProvider>
  );
}
```

## 5. Security Best Practices

### API Key Management
- **Public Key** (NEXT_PUBLIC_ENOKI_API_KEY): For EnokiFlowProvider (client)
- **Secret Key** (ENOKI_SECRET_KEY): For EnokiClient (server only)
- Configure allowed targets in Enoki Console (whitelist Move functions)

### Rate Limiting Implementation
```typescript
// Per-address daily limit (20 tx/day pattern)
const rateLimit = checkRateLimit(sender);
if (!rateLimit.allowed) {
  throw new RateLimitError('Daily limit reached');
}
incrementRateLimit(sender); // After successful execute
```

### SessionStorage vs LocalStorage
```typescript
// Use sessionStorage for wallet persistence (MyLink pattern)
const sessionStorageAdapter = {
  getItem: async (key) => sessionStorage.getItem(key),
  setItem: async (key, value) => sessionStorage.setItem(key, value),
  removeItem: async (key) => sessionStorage.removeItem(key)
};

// Benefits:
// - Tab-isolated sessions
// - Auto-cleanup on tab close
// - Better security (no cross-restart persistence)
```

## 6. Integration Complexity Assessment

### Implementation Effort
- **Enoki Setup**: 2-3 hours (provider, auth flow, callback)
- **Sponsored Txns**: 4-6 hours (API route, execution hook, error handling)
- **Walrus Integration**: 3-4 hours (adapter extension, testing)
- **Rate Limiting**: 2-3 hours (server-side storage, cleanup logic)
- **Total**: 11-16 hours for complete integration

### Complexity Level: MEDIUM
- Requires both client/server code
- OAuth callback flow needs careful testing
- Sponsored tx error handling (network failures, rate limits)
- Multi-wallet support (Enoki + regular wallets)

## 7. Code Examples from MyLink Production

### File Structure
```
app/src/
├── components/
│   ├── providers/
│   │   └── sui-provider.tsx          # EnokiFlowProvider setup
│   └── auth/
│       └── login-button.tsx          # Google OAuth trigger
├── app/
│   ├── auth/callback/page.tsx        # OAuth callback handler
│   └── api/sponsor-tx/route.ts       # Sponsored tx API
├── hooks/
│   ├── use-session.ts                # Unified session management
│   └── use-execute-transaction.ts    # Sponsored tx execution
└── lib/
    ├── constants.ts                  # Enoki config
    └── google-userinfo.ts            # Extract user profile from JWT
```

### Environment Variables
```env
# Client-side (public)
NEXT_PUBLIC_ENOKI_API_KEY=enoki_public_xxx
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
NEXT_PUBLIC_SUI_NETWORK=testnet

# Server-side (secret)
ENOKI_SECRET_KEY=enoki_secret_xxx
```

## 8. Key Learnings from MyLink

### Pattern 1: Dual Wallet Support
- Check BOTH useZkLogin() and useCurrentAccount()
- Provide consistent API via useSession() wrapper
- Handle logout for both methods

### Pattern 2: Google UserInfo Extraction
- Extract JWT from OAuth callback BEFORE Enoki processes
- Parse id_token for name/picture (prefill onboarding)
- Store in sessionStorage for later use

### Pattern 3: Error Handling
- Wrap sponsor-tx API with try/catch
- Provide user-friendly messages (avoid stack traces)
- Handle rate limits gracefully (show reset time)

### Pattern 4: SSR Compatibility
- Use 'use client' directive for Enoki hooks
- Check `mounted` state before rendering providers
- Avoid hydration mismatches with sessionStorage

## 9. Recommended Implementation for Walrus Kit

### Template Structure
```
templates/enoki/
├── providers/
│   ├── EnokiProvider.tsx           # Wrap EnokiFlowProvider + storage
│   └── SponsoredStorageProvider.tsx # Extend base storage with sponsorship
├── hooks/
│   ├── useEnokiLogin.ts            # Wrap createAuthorizationURL
│   └── useSponsoredUpload.ts       # Wrap Walrus upload with sponsorship
├── adapters/
│   └── sponsored-storage.ts        # SponsoredWalrusAdapter
└── app/
    ├── auth/callback/page.tsx      # OAuth callback handler
    └── api/sponsor-tx/route.ts     # Backend API route
```

### Adapter Integration
```typescript
// Extend base adapter pattern
import { WalrusStorageAdapter } from '../../sdk-mysten/adapter';

export class SponsoredWalrusAdapter extends WalrusStorageAdapter {
  constructor(private executeTransaction: ExecuteTransactionFn) {
    super();
  }

  async upload(file: File, options?: UploadOptions) {
    // Use sponsored execution instead of direct client
    const tx = this.buildUploadTransaction(file, options);
    const { digest } = await this.executeTransaction(tx);
    return { blobId: await this.extractBlobId(digest), digest };
  }
}
```

## 10. Links & Resources

- [Enoki Docs](https://docs.enoki.mystenlabs.com/)
- [zkLogin Technical Spec](https://docs.sui.io/concepts/cryptography/zklogin)
- [Sponsored Transactions Guide](https://docs.enoki.mystenlabs.com/ts-sdk/sponsored-transactions)
- [MyLink Production Example](https://github.com/your-org/mylink) (Reference implementation)

## Unresolved Questions

1. Enoki Console configuration for Walrus upload allowedMoveCallTargets?
2. Cost structure for sponsored transactions (Enoki credit system)?
3. Testnet vs mainnet migration path for zkLogin sessions?
4. Handling expired zkLogin sessions (auto-refresh vs re-auth)?
