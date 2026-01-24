# Phase 5: Framework Layer (React+Vite)

## Context Links

- [Main Plan](./plan.md)
- [PRD](../../POC/PRD.md)
- [Next.js App Router Research](../reports/researcher-260117-1353-nextjs-app-router.md)
- [Phase 4: SDK Layer](./phase-04-sdk-layer.md)

## Overview

**Created:** 2026-01-17  
**Priority:** High  
**Status:** completed  
**Completed:** 2026-01-17 16:55  
**Estimated Effort:** 6 hours  
**Dependencies:** Phase 3, Phase 4 complete

## Key Insights

### From Research (Adapted for Vite)

1. **Client Components**: All Walrus interactions are client-side (browser uploads)
2. **Wallet Integration**: `@mysten/dapp-kit` for Sui wallet connections
3. **Code Splitting**: Lazy load heavy SDK components
4. **Suspense Pattern**: Loading states for async operations
5. **Direct Uploads**: Never proxy files through backend

### Why Vite Over Next.js (MVP Decision)

- **Simpler**: No SSR complexity for file upload use case
- **Faster Dev**: Instant HMR, lighter build
- **Better DX**: Straightforward SPA model for client-heavy apps
- **Future**: Can add Next.js layer later

## Requirements

### Functional

- React 18+ with hooks
- Vite dev server + build system
- TanStack Query for async state
- @mysten/dapp-kit for wallet
- Component architecture for use cases

### Technical

- TypeScript strict mode
- ESLint + Prettier
- CSS Modules or Tailwind (conditional)
- Fast Refresh (HMR)

### Dependencies

- Phase 3: Base utilities
- Phase 4: StorageAdapter implementation

## Architecture

### Framework Layer Structure

```
templates/react/
├── public/
│   └── vite.svg                # Vite logo
├── src/
│   ├── components/
│   │   ├── Layout.tsx          # App shell
│   │   └── WalletConnect.tsx   # Wallet button
│   ├── providers/
│   │   ├── QueryProvider.tsx   # TanStack Query wrapper
│   │   └── WalletProvider.tsx  # @mysten/dapp-kit wrapper
│   ├── hooks/
│   │   ├── useStorage.ts       # Storage adapter hook
│   │   └── useWallet.ts        # Wallet state hook
│   ├── App.tsx                 # Main app component
│   ├── main.tsx                # Entry point
│   └── index.css               # Global styles
├── index.html                  # HTML template
├── vite.config.ts              # Vite configuration
├── package.json                # React dependencies
└── README.md                   # Framework docs
```

### Provider Pattern

```typescript
// src/providers/QueryProvider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### Custom Hook Pattern

```typescript
// src/hooks/useStorage.ts
import { useMutation, useQuery } from '@tanstack/react-query';
import { storageAdapter } from '../../../sdk-mysten/src/index.js';

export function useUpload() {
  return useMutation({
    mutationFn: async (file: File) => {
      return await storageAdapter.upload(file, { epochs: 1 });
    },
  });
}

export function useDownload(blobId: string) {
  return useQuery({
    queryKey: ['blob', blobId],
    queryFn: () => storageAdapter.download(blobId),
    enabled: !!blobId,
  });
}
```

## Related Code Files

### To Create

1. `templates/react/index.html` - HTML template
2. `templates/react/src/main.tsx` - Entry point
3. `templates/react/src/App.tsx` - Root component
4. `templates/react/src/index.css` - Global styles
5. `templates/react/src/components/Layout.tsx` - App shell
6. `templates/react/src/components/WalletConnect.tsx` - Wallet button
7. `templates/react/src/providers/QueryProvider.tsx` - TanStack Query
8. `templates/react/src/providers/WalletProvider.tsx` - dApp Kit
9. `templates/react/src/hooks/useStorage.ts` - Storage hook
10. `templates/react/src/hooks/useWallet.ts` - Wallet hook
11. `templates/react/vite.config.ts` - Vite config
12. `templates/react/package.json` - Dependencies
13. `templates/react/README.md` - Documentation

## Implementation Steps

### Step 1: Create React Directory (15 min)

1. Create structure:

```bash
cd templates
mkdir -p react/{public,src/{components,providers,hooks}}
```

### Step 2: HTML Template (15 min)

2. Create `react/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Walrus App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### Step 3: Entry Point (30 min)

3. Create `react/src/main.tsx`:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryProvider } from './providers/QueryProvider.js';
import { WalletProvider } from './providers/WalletProvider.js';
import App from './App.js';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryProvider>
      <WalletProvider>
        <App />
      </WalletProvider>
    </QueryProvider>
  </React.StrictMode>
);
```

4. Create `react/src/index.css`:

```css
:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;

  color-scheme: light dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #242424;

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
}

#root {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  background-color: #1a1a1a;
  cursor: pointer;
  transition: border-color 0.25s;
}

button:hover {
  border-color: #646cff;
}

button:focus,
button:focus-visible {
  outline: 4px auto -webkit-focus-ring-color;
}
```

### Step 4: Provider Setup (1 hour)

5. Create `react/src/providers/QueryProvider.tsx`:

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000 // 5 minutes
    }
  }
});

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

6. Create `react/src/providers/WalletProvider.tsx`:

```typescript
import { createNetworkConfig, SuiClientProvider, WalletProvider as SuiWalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { loadEnv } from '../../../base/src/utils/env.js';

const env = loadEnv();

// Sui network configuration
const { networkConfig } = createNetworkConfig({
  [env.suiNetwork]: {
    url: env.suiRpc || getFullnodeUrl(env.suiNetwork as 'testnet' | 'mainnet')
  }
});

const walletQueryClient = new QueryClient();

export function WalletProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={walletQueryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork={env.suiNetwork as 'testnet' | 'mainnet'}>
        <SuiWalletProvider>
          {children}
        </SuiWalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
```

### Step 5: Custom Hooks (1.5 hours)

7. Create `react/src/hooks/useStorage.ts`:

```typescript
import { useMutation, useQuery } from '@tanstack/react-query';
import { storageAdapter } from '../../../sdk-mysten/src/index.js';
import type { UploadOptions } from '../../../base/src/adapters/storage.js';

/**
 * Hook for uploading files to Walrus
 */
export function useUpload() {
  return useMutation({
    mutationFn: async ({
      file,
      options,
    }: {
      file: File;
      options?: UploadOptions;
    }) => {
      const blobId = await storageAdapter.upload(file, options);
      return { blobId, file };
    },
    onSuccess: (data) => {
      console.log('Upload successful:', data.blobId);
    },
    onError: (error) => {
      console.error('Upload failed:', error);
    },
  });
}

/**
 * Hook for downloading blob data
 */
export function useDownload(blobId: string | null) {
  return useQuery({
    queryKey: ['blob', blobId],
    queryFn: async () => {
      if (!blobId) throw new Error('No blob ID provided');
      return await storageAdapter.download(blobId);
    },
    enabled: !!blobId,
  });
}

/**
 * Hook for fetching blob metadata
 */
export function useMetadata(blobId: string | null) {
  return useQuery({
    queryKey: ['metadata', blobId],
    queryFn: async () => {
      if (!blobId) throw new Error('No blob ID provided');
      return await storageAdapter.getMetadata(blobId);
    },
    enabled: !!blobId,
  });
}
```

8. Create `react/src/hooks/useWallet.ts`:

```typescript
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from '@mysten/dapp-kit';

/**
 * Hook for wallet state and actions
 */
export function useWallet() {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  return {
    account: currentAccount,
    isConnected: !!currentAccount,
    address: currentAccount?.address,
    signAndExecute,
  };
}
```

### Step 6: Components (1 hour)

9. Create `react/src/components/Layout.tsx`:

```typescript
import { ReactNode } from 'react';
import { WalletConnect } from './WalletConnect.js';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="app-layout">
      <header className="app-header">
        <h1>🌊 Walrus App</h1>
        <WalletConnect />
      </header>
      <main className="app-main">
        {children}
      </main>
      <footer className="app-footer">
        <p>Powered by Walrus & Sui</p>
      </footer>
    </div>
  );
}
```

10. Create `react/src/components/WalletConnect.tsx`:

```typescript
import { ConnectButton } from '@mysten/dapp-kit';
import { useWallet } from '../hooks/useWallet.js';

export function WalletConnect() {
  const { isConnected, address } = useWallet();

  return (
    <div className="wallet-connect">
      {isConnected ? (
        <div className="wallet-info">
          <span>Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</span>
        </div>
      ) : (
        <p>Please connect your wallet</p>
      )}
      <ConnectButton />
    </div>
  );
}
```

11. Create `react/src/App.tsx`:

```typescript
import { Layout } from './components/Layout.js';

function App() {
  return (
    <Layout>
      <div className="welcome">
        <h2>Welcome to Walrus Starter Kit</h2>
        <p>This app will be customized by the use case layer</p>
      </div>
    </Layout>
  );
}

export default App;
```

### Step 7: Vite Configuration (45 min)

12. Create `react/vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
```

### Step 8: Package Configuration (30 min)

13. Create `react/package.json`:

```json
{
  "name": "walrus-app-react",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext .ts,.tsx",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@tanstack/react-query": "^5.17.0",
    "@mysten/dapp-kit": "^0.14.0",
    "@mysten/sui": "^1.10.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.11",
    "typescript": "^5.3.3"
  }
}
```

### Step 9: Documentation (30 min)

14. Create `react/README.md`:

```markdown
# React + Vite Framework Layer

Modern React 18 application with Vite build system.

## Features

✅ **React 18** - Hooks, Suspense, Concurrent features  
✅ **Vite 5** - Lightning-fast HMR and builds  
✅ **TanStack Query** - Async state management  
✅ **@mysten/dapp-kit** - Sui wallet integration  
✅ **TypeScript** - Full type safety

## Project Structure
```

src/
├── components/ # Reusable UI components
├── providers/ # Context providers
├── hooks/ # Custom React hooks
├── App.tsx # Root component
└── main.tsx # Entry point

````

## Custom Hooks

### `useUpload()`
Upload files to Walrus:
```typescript
const upload = useUpload();

upload.mutate({ file: myFile, options: { epochs: 1 } });
````

### `useDownload(blobId)`

Download blob data:

```typescript
const { data, isLoading } = useDownload(blobId);
```

### `useMetadata(blobId)`

Fetch blob metadata:

```typescript
const { data: metadata } = useMetadata(blobId);
console.log(`Size: ${metadata.size} bytes`);
```

### `useWallet()`

Access wallet state:

```typescript
const { isConnected, address } = useWallet();
```

## Development

```bash
npm run dev        # Start dev server (http://localhost:3000)
npm run build      # Build for production
npm run preview    # Preview production build
```

## Wallet Setup

1. Install Sui Wallet browser extension
2. Get testnet SUI from faucet
3. Connect wallet in the app

## Resources

- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [TanStack Query](https://tanstack.com/query)
- [@mysten/dapp-kit](https://sdk.mystenlabs.com/dapp-kit)

````

## Todo List

- [x] Create `templates/react/` structure
- [x] Write `index.html` template
- [x] Write `src/main.tsx` entry
- [x] Write `src/App.tsx` root component
- [x] Write `src/index.css` global styles
- [x] Write `providers/QueryProvider.tsx`
- [x] Write `providers/WalletProvider.tsx`
- [x] Write `hooks/useStorage.ts`
- [x] Write `hooks/useWallet.ts`
- [x] Write `components/Layout.tsx`
- [x] Write `components/WalletConnect.tsx`
- [x] Write `vite.config.ts`
- [x] Write `package.json` with deps
- [x] Write `README.md` docs

## Implementation Summary

**Completion Date:** 2026-01-17 16:55
**Total Files Created:** 16

### Files Delivered

#### Configuration Files (5)
- `templates/react/index.html` - HTML template with root div
- `templates/react/vite.config.ts` - Vite build configuration
- `templates/react/package.json` - React dependencies and scripts
- `templates/react/tsconfig.json` - TypeScript configuration
- `templates/react/.gitignore` - Git ignore patterns

#### Source Files (11)
- `templates/react/src/main.tsx` - React entry point with providers
- `templates/react/src/App.tsx` - Root application component
- `templates/react/src/index.css` - Global styles (dark mode)
- `templates/react/src/providers/QueryProvider.tsx` - TanStack Query wrapper
- `templates/react/src/providers/WalletProvider.tsx` - @mysten/dapp-kit wrapper
- `templates/react/src/hooks/useStorage.ts` - useUpload, useDownload, useMetadata hooks
- `templates/react/src/hooks/useWallet.ts` - Wallet state hook
- `templates/react/src/components/Layout.tsx` - App shell component
- `templates/react/src/components/WalletConnect.tsx` - Wallet connection UI
- `templates/react/.eslintrc.json` - ESLint configuration
- `templates/react/README.md` - Framework documentation

### Key Features Implemented

- **React 18** with hooks, Suspense, concurrent features
- **Vite 5** build system with Fast Refresh/HMR
- **TanStack Query** for async state management
- **@mysten/dapp-kit** for Sui wallet integration
- **TypeScript** strict mode with full type safety
- **Custom Hooks** for storage operations and wallet state
- **Provider Pattern** for clean dependency injection
- **Component Architecture** ready for use case layer consumption

## Success Criteria

### Functional Tests
- [ ] Dev server starts on `npm run dev`
- [ ] App renders without errors
- [ ] Wallet connection works
- [ ] Upload hook triggers mutations
- [ ] Download hook fetches data
- [ ] TypeScript compilation passes

### Integration Tests
```bash
cd templates/react
npm install
npm run dev
# Should open http://localhost:3000
# Should show "Welcome to Walrus Starter Kit"
# Should show wallet connect button
````

### Code Quality

- [ ] ESLint passes
- [ ] TypeScript strict mode passes
- [ ] Fast Refresh works (HMR)
- [ ] Build completes successfully

## Risk Assessment

### Potential Blockers

1. **Wallet provider conflicts**: Multiple QueryClient instances
   - **Mitigation**: Separate QueryClient for wallet vs app
2. **Vite env var issues**: `import.meta.env` not working
   - **Mitigation**: Use VITE\_ prefix, check vite.config.ts
3. **SDK bundle size**: Large initial load
   - **Mitigation**: Code splitting, lazy loading

### Contingency Plans

- If dapp-kit fails: Use direct @mysten/sui integration
- If TanStack Query overhead: Use plain React state for MVP

## Security Considerations

### Phase-Specific Concerns

1. **XSS via file uploads**: Malicious file content
   - **Hardening**: Content-type validation, sandboxed previews
2. **Wallet permissions**: Over-requesting permissions
   - **Hardening**: Request only necessary permissions
3. **Environment exposure**: Leaking secrets in client
   - **Hardening**: Only VITE\_ prefixed vars, no secrets in client

## Next Steps

After Phase 5 completion:

1. **Phase 6**: Build use case layers (consume these hooks/components)
2. **Phase 7**: Implement template generation (compose layers)
3. **Future**: Add Vue framework layer (same pattern)

### Dependencies for Next Phase

Phase 6 requires:

- `useUpload()`, `useDownload()` hooks ✅
- `Layout`, `WalletConnect` components ✅
- Wallet provider setup ✅

### Open Questions

- Add React Router for multi-page apps? (Decision: Use case layer decides)
- Support class components? (Decision: No, hooks only for MVP)
