# Phase 01: Enoki Provider Setup

## Context Links
- [Enoki zkLogin Research](./research/researcher-enoki-zklogin-report.md#1-enoki-sdk-architecture)
- [React Provider Pattern](../../docs/system-architecture.md#62-provider-composition-pattern)
- [Base Layer Adapter](../../docs/codebase-summary.md#4-template-base-layer)

## Overview
- **Priority**: P1 (Critical path for zkLogin)
- **Status**: pending
- **Effort**: 2-3 hours
- **Description**: Create `templates/enoki/` layer with providers, environment config, and TypeScript setup

## Key Insights

From Enoki research:
- Requires BOTH public (client) and secret (server) API keys
- Uses EnokiFlowProvider wrapping WalletProvider
- SessionStorage preferred over LocalStorage (tab-isolated sessions)
- Compatible with @mysten/sui ^1.10.0, React 18+, Node.js >= 18

MyLink production patterns:
- 'use client' directive mandatory for SSR frameworks
- Mount state check prevents hydration mismatches
- Dual wallet support requires unified session abstraction

## Requirements

### Functional
- EnokiFlowProvider wraps existing WalletProvider
- Environment validation for public/secret keys
- SessionStorage adapter for wallet persistence
- Compatibility with existing React layer

### Non-Functional
- Zero breaking changes to existing templates
- TypeScript strict mode compliance
- SSR-safe (Next.js compatible pattern)
- Follows existing provider composition style

## Architecture

### Provider Nesting Strategy
```tsx
QueryProvider (existing)
  ↓
EnokiFlowProvider (NEW)
  ↓
WalletProvider (modified - sessionStorage adapter)
  ↓
App (existing)
```

### File Structure
```
templates/enoki/
├── providers/
│   ├── EnokiProvider.tsx       # Main provider wrapper
│   └── index.ts                # Provider exports
├── lib/
│   ├── constants.ts            # Enoki config constants
│   └── storage-adapter.ts      # SessionStorage implementation
├── src/
│   └── index.ts                # Public exports
├── .env.example                # Environment variables template
├── package.json                # Dependencies (@mysten/enoki)
├── tsconfig.json               # TypeScript config (extends react layer)
└── README.md                   # Layer documentation
```

### Environment Variables
```env
# Client-side (public)
NEXT_PUBLIC_ENOKI_API_KEY=enoki_public_xxx
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
NEXT_PUBLIC_SUI_NETWORK=testnet

# Server-side (secret) - DO NOT expose to frontend
ENOKI_SECRET_KEY=enoki_secret_xxx
```

## Related Code Files

### Files to Create

| File Path | Purpose | Lines |
|-----------|---------|-------|
| `templates/enoki/providers/EnokiProvider.tsx` | Main provider wrapper with EnokiFlowProvider | ~80 |
| `templates/enoki/providers/index.ts` | Barrel exports | ~5 |
| `templates/enoki/lib/constants.ts` | Enoki configuration constants | ~15 |
| `templates/enoki/lib/storage-adapter.ts` | SessionStorage adapter implementation | ~25 |
| `templates/enoki/src/index.ts` | Public API exports | ~10 |
| `templates/enoki/.env.example` | Environment variables template | ~15 |
| `templates/enoki/package.json` | Layer dependencies | ~30 |
| `templates/enoki/tsconfig.json` | TypeScript config | ~20 |
| `templates/enoki/README.md` | Layer documentation | ~100 |

### Files to Modify

| File Path | Changes | Rationale |
|-----------|---------|-----------|
| `packages/cli/src/matrix.ts` | Add `enoki` to use-case options for mysten SDK | Enable Enoki in compatibility matrix |
| `templates/react/providers/WalletProvider.tsx` | Accept optional `storage` prop | Support sessionStorage injection |

### Files to Reference

- `templates/react/providers/QueryProvider.tsx` - Provider composition pattern
- `templates/react/providers/WalletProvider.tsx` - Existing wallet provider structure
- `templates/base/src/utils/env.ts` - Zod validation pattern

## Implementation Steps

### Step 1: Create Directory Structure (5 min)
```bash
mkdir -p templates/enoki/{providers,lib,src}
touch templates/enoki/{.env.example,package.json,tsconfig.json,README.md}
```

### Step 2: Implement SessionStorage Adapter (15 min)
```typescript
// templates/enoki/lib/storage-adapter.ts
export const sessionStorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(key, value);
  },
  async removeItem(key: string): Promise<void> {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(key);
  }
};
```

### Step 3: Create Constants File (10 min)
```typescript
// templates/enoki/lib/constants.ts
import { z } from 'zod';

const EnokiEnvSchema = z.object({
  NEXT_PUBLIC_ENOKI_API_KEY: z.string().startsWith('enoki_public_'),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().endsWith('.apps.googleusercontent.com'),
  NEXT_PUBLIC_SUI_NETWORK: z.enum(['testnet', 'mainnet']),
  ENOKI_SECRET_KEY: z.string().startsWith('enoki_secret_').optional(), // Server-side only
});

export const loadEnokiEnv = () => EnokiEnvSchema.parse(process.env);
```

### Step 4: Implement EnokiProvider (60 min)
```typescript
// templates/enoki/providers/EnokiProvider.tsx
'use client';

import { EnokiFlowProvider } from '@mysten/enoki/react';
import { WalletProvider } from '../../react/providers/WalletProvider';
import { sessionStorageAdapter } from '../lib/storage-adapter';
import { loadEnokiEnv } from '../lib/constants';
import { ReactNode, useEffect, useState } from 'react';

export function EnokiProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // Prevent hydration mismatch

  const { NEXT_PUBLIC_ENOKI_API_KEY } = loadEnokiEnv();

  return (
    <EnokiFlowProvider apiKey={NEXT_PUBLIC_ENOKI_API_KEY}>
      <WalletProvider storage={sessionStorageAdapter}>
        {children}
      </WalletProvider>
    </EnokiFlowProvider>
  );
}
```

### Step 5: Create package.json (15 min)
```json
{
  "name": "enoki-layer",
  "private": true,
  "dependencies": {
    "@mysten/enoki": "^0.15.0",
    "@mysten/sui": "^1.10.0",
    "zod": "^3.22.0"
  }
}
```

### Step 6: Update Compatibility Matrix (10 min)
```typescript
// packages/cli/src/matrix.ts
export const COMPATIBILITY_MATRIX = {
  mysten: {
    frameworks: ['react', 'vue', 'plain-ts'],
    useCases: ['simple-upload', 'gallery', 'defi-nft', 'enoki-auth'], // ADD enoki-auth
  },
  // ... rest unchanged
};

export const USE_CASE_METADATA = {
  // ... existing use cases
  'enoki-auth': {
    name: 'Enoki zkLogin Auth',
    description: 'Social login with gasless transactions',
    requires: ['@mysten/enoki'],
    docs: 'https://docs.enoki.mystenlabs.com',
  },
};
```

### Step 7: Write Layer Documentation (20 min)
```markdown
# Enoki zkLogin Template Layer

Provider setup for social authentication and sponsored transactions.

## Features
- Google OAuth login (zkLogin)
- Gasless transactions via Enoki sponsorship
- Dual wallet support (zkLogin + standard wallets)
- SessionStorage persistence (tab-isolated)

## Environment Setup
Copy `.env.example` and fill in:
- NEXT_PUBLIC_ENOKI_API_KEY (from Enoki Console)
- NEXT_PUBLIC_GOOGLE_CLIENT_ID (from Google Cloud Console)

## Usage
Replace `WalletProvider` with `EnokiProvider` in `main.tsx`:
\`\`\`tsx
import { EnokiProvider } from './providers/EnokiProvider';

<EnokiProvider>
  <App />
</EnokiProvider>
\`\`\`
```

### Step 8: Modify WalletProvider for Storage Injection (15 min)
```typescript
// templates/react/providers/WalletProvider.tsx
import { createNetworkConfig, SuiClientProvider, WalletProvider as SuiWalletProvider } from '@mysten/dapp-kit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface WalletProviderProps {
  children: ReactNode;
  storage?: any; // Optional storage adapter (default: localStorage)
}

export function WalletProvider({ children, storage }: WalletProviderProps) {
  // ... existing network config

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <SuiWalletProvider storage={storage}> {/* Inject storage */}
          {children}
        </SuiWalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
```

## Todo List

- [ ] Create `templates/enoki/` directory structure
- [ ] Implement `sessionStorageAdapter` with SSR guards
- [ ] Create `constants.ts` with Zod validation
- [ ] Implement `EnokiProvider.tsx` with mount state check
- [ ] Create `package.json` with @mysten/enoki dependency
- [ ] Create `.env.example` with all required variables
- [ ] Write layer README with setup instructions
- [ ] Update `matrix.ts` with `enoki-auth` use case
- [ ] Modify `WalletProvider.tsx` to accept storage prop
- [ ] Create barrel exports in `providers/index.ts`
- [ ] Create public API exports in `src/index.ts`
- [ ] Validate TypeScript strict mode compliance
- [ ] Test provider nesting with existing React layer
- [ ] Document Enoki Console setup requirements

## Success Criteria

### Validation Checks
- [ ] `pnpm tsc --noEmit` passes for enoki layer
- [ ] Environment validation rejects invalid keys
- [ ] Provider renders without hydration warnings
- [ ] SessionStorage adapter works in browser
- [ ] SSR guards prevent server-side storage access

### Integration Tests
- [ ] EnokiProvider can wrap existing App component
- [ ] WalletProvider accepts sessionStorage adapter
- [ ] No breaking changes to non-Enoki templates
- [ ] Layer merges cleanly with base + SDK + React

### Documentation Complete
- [ ] .env.example includes all variables with comments
- [ ] README explains Enoki Console setup
- [ ] Migration guide from standard WalletProvider

## Risk Assessment

### Low Risk
- SessionStorage adapter (simple wrapper, proven pattern)
- Provider nesting (extends existing pattern)
- Environment validation (Zod schema reuse)

### Medium Risk
- SSR hydration mismatch if mount state check fails
  - **Mitigation**: Test with Next.js App Router, add fallback UI
- Enoki SDK version compatibility with @mysten/sui
  - **Mitigation**: Pin versions in package.json, document peer dependencies

## Security Considerations

### API Key Exposure
- **Threat**: Secret key exposed to frontend
- **Prevention**:
  - Document ENOKI_SECRET_KEY as server-side only
  - Add validation to reject secret keys starting with 'enoki_secret_' in client code
  - Environment schema separates public/secret keys

### SessionStorage Security
- **Benefit**: Auto-cleanup on tab close (vs LocalStorage persistence)
- **Limitation**: Tab-isolated (user must re-auth per tab)
- **Trade-off**: Security > Convenience for zkLogin sessions

## Next Steps

After Phase 01 completion:
1. **Phase 02**: Implement zkLogin auth flow (OAuth callback handler)
2. **Testing**: Validate provider setup with mock Enoki API key
3. **Documentation**: Update main README with Enoki layer overview
