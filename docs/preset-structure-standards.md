# Preset Structure Standards

Based on 2025/2026 industry best practices and Walrus ecosystem requirements.

## Research Summary

**Key Findings:**
- Modern React: Atomic Design + Feature-based organization
- Next.js 14/15: App Router with clear Server/Client separation
- Web3 Apps: Centralized providers, lib/ for SDK clients
- DX Priority: Minimal nesting, self-documenting structure

## Recommended Preset Structures

### 1. React + Vite (Simple Upload Preset)

**Target:** Single-page upload experience, minimal complexity

```
react-mysten-simple-upload/
├── public/
│   └── walrus-icon.svg
├── src/
│   ├── components/
│   │   ├── ui/                  # Primitive components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Input.tsx
│   │   ├── layout/              # Layout components
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   └── features/            # Feature components
│   │       └── FileUploader.tsx # Upload logic + UI
│   ├── hooks/
│   │   ├── useWallet.ts         # Wallet state
│   │   └── useWalrusUpload.ts   # Upload logic
│   ├── lib/
│   │   └── walrus/
│   │       ├── client.ts        # Walrus SDK client
│   │       ├── config.ts        # Config (aggregator, etc.)
│   │       └── types.ts         # Walrus-specific types
│   ├── providers/
│   │   ├── Web3Provider.tsx     # Sui + Wallet providers
│   │   └── QueryProvider.tsx    # React Query setup
│   ├── utils/
│   │   ├── format.ts            # Formatting helpers
│   │   └── validation.ts        # Input validation
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

**Rationale:**
- ✅ Flat `components/` with 3 categories (ui, layout, features)
- ✅ `lib/walrus/` centralizes SDK logic
- ✅ `providers/` clearly separates context providers
- ✅ Minimal depth (max 3 levels in src/)
- ✅ Self-documenting folder names

---

### 2. React + Vite (Gallery Preset)

**Target:** Multi-feature app (upload + browse + manage)

```
react-mysten-gallery/
├── public/
│   ├── walrus-icon.svg
│   └── placeholder.png
├── src/
│   ├── components/
│   │   ├── ui/                  # Shared primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── ImageGrid.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Tabs.tsx
│   │   └── layout/
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       └── Footer.tsx
│   ├── features/                # Feature-based organization
│   │   ├── upload/
│   │   │   ├── UploadForm.tsx
│   │   │   ├── UploadProgress.tsx
│   │   │   └── useUpload.ts
│   │   ├── gallery/
│   │   │   ├── GalleryGrid.tsx
│   │   │   ├── ImageCard.tsx
│   │   │   ├── ImageModal.tsx
│   │   │   └── useGallery.ts
│   │   └── manage/
│   │       ├── ImageManager.tsx
│   │       ├── DeleteConfirm.tsx
│   │       └── useManage.ts
│   ├── hooks/
│   │   ├── useWallet.ts
│   │   └── useWalrusStorage.ts  # Shared storage hook
│   ├── lib/
│   │   └── walrus/
│   │       ├── client.ts
│   │       ├── config.ts
│   │       ├── upload.ts        # Upload utilities
│   │       ├── fetch.ts         # Fetch utilities
│   │       └── types.ts
│   ├── providers/
│   │   ├── Web3Provider.tsx
│   │   └── QueryProvider.tsx
│   ├── utils/
│   │   ├── format.ts
│   │   ├── validation.ts
│   │   └── image.ts             # Image processing
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

**Rationale:**
- ✅ `features/` folder for complex multi-feature apps
- ✅ Each feature contains components + hooks
- ✅ Shared `components/ui` for reusable primitives
- ✅ Scales better than flat structure
- ✅ Follows Bulletproof React pattern

---

### 3. Next.js App Router (Future - If Needed)

**Target:** SSG/SSR with Walrus integration

```
nextjs-mysten-gallery/
├── app/
│   ├── (routes)/               # Route groups
│   │   ├── gallery/
│   │   │   └── page.tsx        # /gallery route
│   │   ├── upload/
│   │   │   └── page.tsx        # /upload route
│   │   └── page.tsx            # / (home)
│   ├── api/                    # API routes (if needed)
│   │   └── walrus/
│   │       └── upload/
│   │           └── route.ts
│   ├── layout.tsx              # Root layout
│   ├── providers.tsx           # Client providers wrapper
│   └── globals.css
├── components/
│   ├── ui/                     # Shared UI components
│   │   ├── Button.tsx
│   │   └── Card.tsx
│   └── features/
│       ├── upload/
│       │   └── UploadForm.tsx
│       └── gallery/
│           └── GalleryGrid.tsx
├── lib/
│   └── walrus/
│       ├── client.ts           # Server-side client
│       ├── client-browser.ts   # Client-side client
│       ├── config.ts
│       └── types.ts
├── actions/                    # Server Actions
│   ├── upload.ts
│   └── fetch-images.ts
├── hooks/                      # Client-side hooks
│   └── useWallet.ts
├── public/
│   └── walrus-icon.svg
├── .env.local
├── .gitignore
├── next.config.mjs
├── package.json
└── tsconfig.json
```

**Rationale:**
- ✅ App Router file-system routing
- ✅ Clear Server/Client separation
- ✅ `components/` outside `app/` (avoid deep nesting)
- ✅ `actions/` for Server Actions
- ✅ Dual Walrus clients (server vs browser)

---

## Comparison Table

| Aspect | Simple Upload | Gallery | Next.js (Future) |
|--------|---------------|---------|------------------|
| **Complexity** | Low | Medium | High |
| **Max Depth** | 3 levels | 3 levels | 4 levels |
| **Features Folder** | ❌ (use components/features) | ✅ Top-level | ✅ Top-level |
| **Routing** | React Router (optional) | React Router | App Router |
| **SSR/SSG** | ❌ (SPA only) | ❌ (SPA only) | ✅ Built-in |
| **Best For** | MVPs, demos | Production SPAs | SEO-critical apps |

---

## Common Patterns Across All Presets

### ✅ Standard Files (All Presets)

```
.env.example              # Environment template
.gitignore                # Standard ignores
README.md                 # Getting started guide
package.json              # Dependencies
tsconfig.json             # TypeScript config
```

### ✅ Walrus Integration Structure

```
src/lib/walrus/
├── client.ts             # SDK initialization
├── config.ts             # Aggregator URLs, defaults
├── types.ts              # Walrus-specific types
└── [upload|fetch].ts     # Feature-specific utilities
```

### ✅ Provider Pattern

```typescript
// src/providers/Web3Provider.tsx
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { walrusConfig } from '@/lib/walrus/config';

export function Web3Provider({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={walrusConfig.networks}>
        <WalletProvider>
          {children}
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
```

---

## Anti-patterns to Avoid

### ❌ Don't: Overly Nested Structures

```
src/
  components/
    features/
      upload/
        components/         # Too deep!
          form/
            fields/
```

### ❌ Don't: Generic Naming

```
src/
  lib/
    utils.ts              # Too vague
    helpers.ts            # What helpers?
    common.ts             # Common what?
```

### ✅ Do: Self-documenting Names

```
src/
  lib/
    walrus/
      upload-helpers.ts   # Clear purpose
      format-blob-id.ts   # Specific function
```

### ❌ Don't: Config File Pollution

```
Root/
├── .eslintrc.json
├── .eslintrc.js          # Duplicate!
├── .prettierrc
├── .prettierrc.json      # Pick one!
├── tsconfig.json
├── tsconfig.build.json
└── tsconfig.test.json    # Only if needed
```

---

## Web3-Specific Considerations

### Wallet Connection Best Practices

```typescript
// ✅ Centralized wallet logic
// src/hooks/useWallet.ts
export function useWallet() {
  const wallet = useCurrentWallet();
  const account = useCurrentAccount();

  return {
    isConnected: wallet.isConnected,
    address: account?.address,
    connect: wallet.connect,
    disconnect: wallet.disconnect,
  };
}
```

### SDK Client Initialization

```typescript
// ✅ Singleton pattern
// src/lib/walrus/client.ts
import { WalrusClient } from '@mysten/walrus';
import { config } from './config';

let client: WalrusClient | null = null;

export function getWalrusClient() {
  if (!client) {
    client = new WalrusClient(config.aggregatorUrl);
  }
  return client;
}
```

---

## Preset-Specific Recommendations

### Simple Upload Preset

**Focus:** Developer speed, minimal learning curve

- Keep components flat (no features/ folder)
- Single `App.tsx` with inline layout
- Minimal abstractions
- Direct SDK usage in components (acceptable for simple case)

**Target Users:** Beginners, hackathon participants

---

### Gallery Preset

**Focus:** Production-ready patterns, scalability

- Feature-based organization
- Separation of concerns
- Custom hooks for data fetching
- Reusable UI components

**Target Users:** Production apps, experienced developers

---

### Next.js Preset (Future)

**Focus:** SEO, performance, advanced use cases

- Server-side blob fetching
- Static generation of gallery pages
- Edge caching for Walrus content
- API routes for server-side uploads

**Target Users:** Public-facing Walrus sites, content platforms

---

## Migration from Current Layers

### Current Layer Mapping → Presets

| Current Layer | → | New Preset Location |
|---------------|---|---------------------|
| `base/src/adapters/` | → | `src/lib/walrus/adapters/` |
| `base/src/utils/` | → | `src/utils/` |
| `base/src/types/` | → | `src/lib/walrus/types.ts` |
| `react/src/components/` | → | `src/components/layout/` |
| `react/src/providers/` | → | `src/providers/` |
| `simple-upload/src/components/` | → | `src/components/features/` |
| `gallery/src/components/` | → | `src/features/gallery/` |

---

## Unresolved Questions

1. **Next.js SSG vs SSR:** Should Next.js presets default to static generation (better for Walrus sites) or SSR?

2. **Vue Presets:** Follow Nuxt pattern or clean Vite + Vue 3? (Nuxt adds complexity)

3. **Shared Components:** Should we create a shared `@walrus/ui` package for common components across presets?

4. **TypeScript Strictness:** How strict should `tsconfig.json` be in generated presets?

5. **Testing Setup:** Should presets include Vitest setup by default, or opt-in?

---

## Next Steps

1. Create preset generator script based on these structures
2. Refactor current templates to align with standards
3. Generate all preset combinations
4. Validate with actual Walrus SDK integration
5. User testing with Sui community developers
