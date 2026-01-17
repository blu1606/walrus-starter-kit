# Phase 02: zkLogin Auth Flow

## Context Links
- [Enoki Auth Sequence](./research/researcher-enoki-zklogin-report.md#2-zklogin-authentication-flow)
- [MyLink Session Management](./research/researcher-enoki-zklogin-report.md#8-key-learnings-from-mylink)
- [Phase 01 - Provider Setup](./phase-01-enoki-provider-setup.md)

## Overview
- **Priority**: P1 (Core authentication feature)
- **Status**: pending
- **Effort**: 3-4 hours
- **Description**: Implement Google OAuth flow, callback handler, session management hooks

## Key Insights

zkLogin flow sequence:
1. User clicks "Login with Google"
2. Redirect to Google OAuth (createAuthorizationURL)
3. Google redirects to /auth/callback with code
4. handleAuthCallback() generates ZK proof (2-5 seconds)
5. Session available via useZkLogin() hook

MyLink production patterns:
- Extract JWT from OAuth callback BEFORE Enoki processes
- Parse id_token for name/picture (prefill user profile)
- Store in sessionStorage for onboarding flow
- Unified session hook checks BOTH zkLogin and standard wallet

## Requirements

### Functional
- Login button triggers Google OAuth flow
- Callback route handles OAuth redirect and ZK proof generation
- Session hook provides unified API for zkLogin + standard wallets
- UserInfo extraction from JWT for profile prefill
- Logout clears BOTH zkLogin and wallet sessions

### Non-Functional
- OAuth flow completes in <10 seconds (incl ZK proof)
- Error handling for network failures during proof generation
- Callback route is SSR-safe (Next.js App Router compatible)
- Session persists in sessionStorage (tab-isolated)

## Architecture

### Authentication Flow
```
[Login Button]
  ↓ createAuthorizationURL()
[Google OAuth Screen]
  ↓ redirect with code
[/auth/callback]
  ↓ Extract JWT + handleAuthCallback()
[ZK Proof Generation (2-5s)]
  ↓ Session created
[Authenticated State]
```

### Hook Dependencies
```typescript
useEnokiFlow() // from @mysten/enoki/react
  ↓
useZkLogin() // zkLogin address
  ↓
useCurrentAccount() // standard wallet address
  ↓
useSession() // unified abstraction (OUR HOOK)
```

## Related Code Files

### Files to Create

| File Path | Purpose | Lines |
|-----------|---------|-------|
| `templates/enoki/components/LoginButton.tsx` | Google OAuth login trigger | ~60 |
| `templates/enoki/app/auth/callback/page.tsx` | OAuth callback handler (Next.js route) | ~80 |
| `templates/enoki/hooks/useEnokiLogin.ts` | Wrapper for createAuthorizationURL | ~40 |
| `templates/enoki/hooks/useSession.ts` | Unified session management | ~70 |
| `templates/enoki/lib/google-userinfo.ts` | Extract name/picture from JWT | ~50 |
| `templates/enoki/components/LogoutButton.tsx` | Clear both zkLogin and wallet sessions | ~40 |

### Files to Modify

| File Path | Changes | Rationale |
|-----------|---------|-----------|
| `templates/enoki/src/index.ts` | Export useSession, LoginButton, LogoutButton | Public API |

### Files to Reference

- `templates/react/hooks/useWallet.ts` - Hook pattern style
- `templates/react/components/WalletConnect.tsx` - Button component pattern

## Implementation Steps

### Step 1: Create Login Button Component (45 min)
```typescript
// templates/enoki/components/LoginButton.tsx
'use client';

import { useEnokiFlow } from '@mysten/enoki/react';
import { loadEnokiEnv } from '../lib/constants';
import { useCallback } from 'react';

export function LoginButton() {
  const enokiFlow = useEnokiFlow();
  const { NEXT_PUBLIC_GOOGLE_CLIENT_ID, NEXT_PUBLIC_SUI_NETWORK } = loadEnokiEnv();

  const handleLogin = useCallback(async () => {
    try {
      const url = await enokiFlow.createAuthorizationURL({
        provider: 'google',
        network: NEXT_PUBLIC_SUI_NETWORK,
        clientId: NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        redirectUrl: `${window.location.origin}/auth/callback`,
        extraParams: {
          prompt: 'select_account',
          scope: ['openid', 'email', 'profile'],
        },
      });

      window.location.href = url;
    } catch (error) {
      console.error('Login failed:', error);
      alert('Failed to start login flow. Please try again.');
    }
  }, [enokiFlow, NEXT_PUBLIC_GOOGLE_CLIENT_ID, NEXT_PUBLIC_SUI_NETWORK]);

  return (
    <button
      onClick={handleLogin}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      Login with Google
    </button>
  );
}
```

### Step 2: Create Google UserInfo Extractor (30 min)
```typescript
// templates/enoki/lib/google-userinfo.ts
import { jwtDecode } from 'jwt-decode';

interface GoogleJWT {
  name?: string;
  picture?: string;
  email?: string;
}

export function extractGoogleUserInfo(hashParams: string): GoogleJWT | null {
  try {
    const params = new URLSearchParams(hashParams);
    const idToken = params.get('id_token');

    if (!idToken) return null;

    const decoded = jwtDecode<GoogleJWT>(idToken);
    return {
      name: decoded.name,
      picture: decoded.picture,
      email: decoded.email,
    };
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

export function storeUserInfo(userInfo: GoogleJWT) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem('google_user_info', JSON.stringify(userInfo));
}

export function loadUserInfo(): GoogleJWT | null {
  if (typeof window === 'undefined') return null;
  const stored = sessionStorage.getItem('google_user_info');
  return stored ? JSON.parse(stored) : null;
}
```

### Step 3: Implement OAuth Callback Handler (60 min)
```typescript
// templates/enoki/app/auth/callback/page.tsx
'use client';

import { useEnokiFlow } from '@mysten/enoki/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { extractGoogleUserInfo, storeUserInfo } from '../../../lib/google-userinfo';

export default function AuthCallback() {
  const enokiFlow = useEnokiFlow();
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // CRITICAL: Extract JWT BEFORE Enoki processes the callback
        const hashParams = window.location.hash.substring(1);
        const userInfo = extractGoogleUserInfo(hashParams);

        if (userInfo) {
          storeUserInfo(userInfo);
        }

        // Generate ZK proof (takes 2-5 seconds)
        setStatus('processing');
        await enokiFlow.handleAuthCallback();

        setStatus('success');
        setTimeout(() => {
          router.push('/'); // Redirect to home
        }, 1000);
      } catch (error) {
        console.error('Auth callback failed:', error);
        setStatus('error');
      }
    };

    handleCallback();
  }, [enokiFlow, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      {status === 'processing' && (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Generating secure proof...</p>
          <p className="text-sm text-gray-500">This may take a few seconds</p>
        </div>
      )}
      {status === 'success' && (
        <div className="text-center text-green-600">
          <p className="text-xl">✓ Login successful!</p>
          <p className="text-sm">Redirecting...</p>
        </div>
      )}
      {status === 'error' && (
        <div className="text-center text-red-600">
          <p className="text-xl">✗ Login failed</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Return Home
          </button>
        </div>
      )}
    </div>
  );
}
```

### Step 4: Create Unified Session Hook (45 min)
```typescript
// templates/enoki/hooks/useSession.ts
'use client';

import { useZkLogin } from '@mysten/enoki/react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useMemo } from 'react';

export interface Session {
  address: string | null;
  isLoggedIn: boolean;
  isUsingEnoki: boolean;
  isUsingWallet: boolean;
}

export function useSession(): Session {
  const { address: enokiAddress } = useZkLogin();
  const walletAccount = useCurrentAccount();

  return useMemo(() => {
    const isUsingEnoki = !!enokiAddress;
    const isUsingWallet = !!walletAccount?.address;

    return {
      address: enokiAddress || walletAccount?.address || null,
      isLoggedIn: isUsingEnoki || isUsingWallet,
      isUsingEnoki,
      isUsingWallet,
    };
  }, [enokiAddress, walletAccount]);
}
```

### Step 5: Create Logout Button (30 min)
```typescript
// templates/enoki/components/LogoutButton.tsx
'use client';

import { useDisconnectWallet } from '@mysten/dapp-kit';
import { useCallback } from 'react';

export function LogoutButton() {
  const { mutate: disconnect } = useDisconnectWallet();

  const handleLogout = useCallback(() => {
    // Clear standard wallet session
    disconnect();

    // Clear zkLogin session (sessionStorage)
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
    }

    // Reload to reset state
    window.location.href = '/';
  }, [disconnect]);

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
    >
      Logout
    </button>
  );
}
```

### Step 6: Create useEnokiLogin Hook (20 min)
```typescript
// templates/enoki/hooks/useEnokiLogin.ts
'use client';

import { useEnokiFlow } from '@mysten/enoki/react';
import { loadEnokiEnv } from '../lib/constants';
import { useCallback } from 'react';

export function useEnokiLogin() {
  const enokiFlow = useEnokiFlow();
  const { NEXT_PUBLIC_GOOGLE_CLIENT_ID, NEXT_PUBLIC_SUI_NETWORK } = loadEnokiEnv();

  const login = useCallback(async () => {
    const url = await enokiFlow.createAuthorizationURL({
      provider: 'google',
      network: NEXT_PUBLIC_SUI_NETWORK,
      clientId: NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      redirectUrl: `${window.location.origin}/auth/callback`,
      extraParams: {
        prompt: 'select_account',
        scope: ['openid', 'email', 'profile'],
      },
    });

    window.location.href = url;
  }, [enokiFlow, NEXT_PUBLIC_GOOGLE_CLIENT_ID, NEXT_PUBLIC_SUI_NETWORK]);

  return { login };
}
```

### Step 7: Update Public Exports (10 min)
```typescript
// templates/enoki/src/index.ts
export { EnokiProvider } from '../providers/EnokiProvider';
export { LoginButton } from '../components/LoginButton';
export { LogoutButton } from '../components/LogoutButton';
export { useSession } from '../hooks/useSession';
export { useEnokiLogin } from '../hooks/useEnokiLogin';
export type { Session } from '../hooks/useSession';
```

### Step 8: Add jwt-decode Dependency (5 min)
```json
// templates/enoki/package.json (update dependencies)
{
  "dependencies": {
    "@mysten/enoki": "^0.15.0",
    "@mysten/sui": "^1.10.0",
    "jwt-decode": "^4.0.0",
    "zod": "^3.22.0"
  }
}
```

## Todo List

- [ ] Create `LoginButton.tsx` with OAuth trigger
- [ ] Implement `google-userinfo.ts` with JWT extraction
- [ ] Create `auth/callback/page.tsx` with ZK proof handling
- [ ] Implement `useSession.ts` with dual wallet support
- [ ] Create `LogoutButton.tsx` with session clearing
- [ ] Create `useEnokiLogin.ts` wrapper hook
- [ ] Update public exports in `src/index.ts`
- [ ] Add `jwt-decode` to package.json
- [ ] Test OAuth flow end-to-end (local dev server)
- [ ] Verify sessionStorage persistence across page reloads
- [ ] Test logout clears both zkLogin and wallet sessions
- [ ] Validate SSR compatibility (no hydration errors)
- [ ] Document Google OAuth credential setup

## Success Criteria

### Functional Tests
- [ ] Login button redirects to Google OAuth
- [ ] Callback extracts JWT and generates ZK proof
- [ ] useSession() returns correct address for zkLogin
- [ ] useSession() returns correct address for standard wallet
- [ ] UserInfo (name, picture) stored in sessionStorage
- [ ] Logout clears both sessions and redirects to home
- [ ] Multiple tabs have isolated sessions (sessionStorage)

### Error Handling
- [ ] Network failure during ZK proof shows user-friendly error
- [ ] Invalid JWT handled gracefully (no crash)
- [ ] OAuth callback without code shows error message
- [ ] Redirect to home on callback error

### Performance
- [ ] ZK proof generation completes in <10 seconds
- [ ] No visible UI jank during proof generation
- [ ] Callback spinner shows immediately (no blank screen)

## Risk Assessment

### Medium Risk
- **ZK Proof Generation Timeout**
  - Impact: User stuck on callback screen
  - Mitigation: Add 15-second timeout with retry button
  - Fallback: Show "Try again" button on timeout

- **OAuth Callback Race Condition**
  - Impact: JWT extraction may fail if Enoki processes first
  - Mitigation: Extract JWT synchronously before async handleAuthCallback()
  - Testing: Verify userInfo stored correctly in 100 consecutive logins

### Low Risk
- SessionStorage not available (old browsers)
  - Mitigation: Feature detection, graceful degradation to localStorage

## Security Considerations

### JWT Validation
- **Threat**: Malicious JWT injection via URL manipulation
- **Prevention**:
  - jwt-decode validates signature (throws on invalid)
  - Extract only from hash params (not query params)
  - Sanitize stored userInfo (escape XSS vectors)

### Session Hijacking
- **Threat**: SessionStorage accessible via XSS
- **Prevention**:
  - No sensitive data in sessionStorage (only address + userInfo)
  - Private keys managed by Enoki (never exposed)
  - Short-lived sessions (tab-scoped)

### Redirect URI Validation
- **Threat**: Open redirect attack via manipulated redirectUrl
- **Prevention**:
  - Always use `window.location.origin` (not user input)
  - Whitelist callback URL in Google Cloud Console

## Next Steps

After Phase 02 completion:
1. **Phase 03**: Implement sponsored transaction API (server-side)
2. **Testing**: E2E test for complete login flow (Playwright)
3. **Documentation**: Add OAuth setup guide to README
