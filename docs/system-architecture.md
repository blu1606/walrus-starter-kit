# System Architecture

**Walrus Starter Kit** uses a modular, layered architecture to provide a flexible and robust scaffolding experience.

## 1. Monorepo Structure

The project is managed as a pnpm monorepo:

```
walrus-starter-kit/
├── packages/
│   └── cli/                 # Scaffolder Engine (create-walrus-app)
├── templates/               # Modular Template Layers (Excluded from workspace)
│   ├── base/                # Layer 1: Core config & Adapter interface
│   ├── sdk-mysten/          # Layer 2: @mysten/walrus SDK implementation
│   ├── react/               # Layer 3: React 18 + Vite framework
│   ├── framework-*/         # Layer 3: Other UI Frameworks (Vue, Plain TS)
│   └── use-case-*/          # Layer 4: Feature-specific code
├── examples/                # Generated test outputs (Excluded from workspace)
└── docs/                    # Technical Documentation
```

## 2. Scaffolding Engine (CLI)

The `packages/cli` engine implements a pipeline architecture:

### 2.1 Pipeline Flow

```
Entry Point (index.ts)
    ↓
Parse Arguments (commander)
    ↓
Run Interactive Prompts (prompts.ts) ←→ Skip if flags provided
    ↓
Build Context (context.ts) — Merge args + prompts
    ↓
Validate Compatibility (validator.ts) — Matrix check
     ↓
Generate Project (generator/index.ts) — Layered composition
     ↓
Post-Install & Verification (post-install/index.ts) — PM install, Git init, Validation
```

### 2.2 Core Responsibilities

- **Interaction:** Using `commander` and `prompts` for hybrid mode (interactive/CI-CD).
- **Validation:** Checking the compatibility matrix (SDK vs Framework vs Use Case).
- **Context Building:** Merging CLI arguments and prompt results with runtime type validation.
- **Package Manager Detection:** Auto-detecting pnpm/yarn/bun/npm from environment.
- **Layered Composition:** Assembling the final project by merging multiple template layers (Base + SDK + Framework + Use Case).
- **Intelligent Merging:** Deep merging of `package.json` dependencies and scripts with automated sorting.
- **Template Transformation:** Variable replacement within template files using mustache-style syntax (`{{projectName}}`).
- **Post-Install Automation:** Automatic dependency installation using `cross-spawn`.
- **Git Initialization:** Automatic `git init` and initial commit for newly created projects.
- **Project Verification:** Post-generation checks for `node_modules` and TypeScript compilation integrity.
- **Atomic Operations:** Rollback support for partially generated directories on failure or SIGINT.
- **Path Security:** Path traversal validation to ensure all template layers are within the package root.

### 2.3 Key Components

| Component          | File                              | Purpose                                            |
| ------------------ | --------------------------------- | -------------------------------------------------- |
| Entry Point        | `index.ts`                        | Commander setup, orchestration, SIGINT handling    |
| Interactive Wizard | `prompts.ts`                      | 6-step prompts with dynamic choices                |
| Context Builder    | `context.ts`                      | Merge args/prompts, runtime validation             |
| Generator Engine   | `generator/index.ts`              | Orchestrates the layered generation flow           |
| Layer Resolver     | `generator/layers.ts`             | Determines and validates active template layers    |
| JSON Merger        | `generator/merge.ts`              | Merges package.json with dependency reconciliation |
| Transformer        | `generator/transform.ts`          | Variable replacement in template files             |
| Validator          | `validator.ts`                    | Compatibility checks, project name validation      |
| Matrix             | `matrix.ts`                       | SDK/framework/use-case compatibility data          |
| Types              | `types.ts`                        | TypeScript interfaces (Context, ValidationResult)  |
| Logger             | `utils/logger.ts`                 | Colored console output (kleur)                     |
| PM Detection       | `utils/detect-pm.ts`              | Package manager auto-detection                     |
| Post-Install       | `post-install/index.ts`           | Orchestrates dependencies, git, and validation     |
| Git Helper         | `post-install/git.ts`             | Git repository initialization and initial commit   |
| PM Runner          | `post-install/package-manager.ts` | Executes package manager commands (install)        |
| Project Validator  | `post-install/validator.ts`       | Verifies project integrity and TS compilation      |
| UI Messages        | `post-install/messages.ts`        | Success/Error screens with next steps              |

### 2.4 Context Object

The `Context` interface is the single source of truth for user configuration:

```typescript
interface Context {
  projectName: string;
  projectPath: string; // Auto-resolved absolute path
  sdk: 'mysten' | 'tusky' | 'hibernuts';
  framework: 'react' | 'vue' | 'plain-ts';
  useCase: 'simple-upload' | 'gallery' | 'defi-nft';
  analytics: boolean; // Blockberry analytics integration
  tailwind: boolean; // Tailwind CSS inclusion
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun';
}
```

## 3. Template Layer System

Templates organized into composable layers merged during generation:

### 3.1 Layer Composition Flow

```
User Choices (Context)
    ↓
Layer Resolver (layers.ts)
    ↓
Active Layers Identified:
    ├── Base Layer (always)
    ├── SDK Layer (mysten/tusky/hibernuts)
    ├── Framework Layer (react/vue/plain-ts)
    ├── Use Case Layer (upload/gallery/defi-nft)
    └── Add-ons (tailwind, analytics)
    ↓
Generator Orchestrator (index.ts)
    ↓
For each layer:
    ├── Copy files → Target directory
    ├── Merge package.json → Deep merge dependencies
    ├── Transform variables → {{projectName}} replacement
    └── Validate paths → Security checks
    ↓
Final Project Structure
```

### 3.2 Base Layer Architecture

**Location:** `templates/base/`

**Purpose:** SDK-agnostic foundation with adapter pattern.

**Key Files:**

| File                      | Purpose                                       |
| ------------------------- | --------------------------------------------- |
| `src/adapters/storage.ts` | StorageAdapter interface (4 methods)          |
| `src/types/walrus.ts`     | Type definitions (BlobId, WalrusConfig, etc.) |
| `src/types/index.ts`      | Type barrel exports                           |
| `src/utils/env.ts`        | Zod schemas for env validation                |
| `src/utils/format.ts`     | Formatting utils (file size, truncate)        |
| `.env.example`            | Required env vars template                    |
| `tsconfig.json`           | Strict TS config (ES2022, ESM)                |
| `package.json`            | Base deps (zod)                               |

**StorageAdapter Interface:**

```typescript
export interface StorageAdapter {
  upload(file: File, options?: UploadOptions): Promise<UploadResult>;
  download(blobId: BlobId): Promise<Blob>;
  delete(blobId: BlobId): Promise<void>;
  getInfo(blobId: BlobId): Promise<BlobInfo>;
}
```

**Design Invariants:**

- Zero SDK dependencies at base
- Single source of truth for types
- SDK layers extend via concrete adapters
- Use cases consume via interface only

### 3.3 Layer Merging Strategy

**File Conflicts:**

- Later layers override earlier layers (Use Case > Framework > SDK > Base)
- Exception: `package.json` uses deep merge (dependencies combined)

**package.json Merge Rules:**

1. Dependencies: Combine all, later versions win
2. Scripts: Later layers override
3. Metadata (name, version): Use Case layer wins
4. Auto-sorted via `sort-package-json`

**Variable Transformation:**

- Mustache-style syntax: `{{variableName}}`
- Context variables: `projectName`, `sdk`, `framework`, etc.
- Applied to: `.ts`, `.tsx`, `.json`, `.md`, `.html`, `.env.example`

## 4. Template Layering Pattern (Legacy Overview)

We use a **Base + Layer + Adapter Pattern** (detailed in Section 3):

1.  **Base Layer:** Contains common files (`.gitignore`, `.env.example`, `tsconfig.json`) and the **Storage Adapter Interface**.
2.  **SDK Layer:** Implements the Storage Adapter using the Mysten Labs TypeScript SDK (`@mysten/walrus`). See `templates/sdk-mysten/` for singleton client and adapter implementation.
3.  **Framework Layer:** Sets up the UI environment (Vite, React, Tailwind).
4.  **Use Case Layer:** High-level features (Gallery, Upload UI) that consume the Storage Adapter.

## 5. Multi-SDK Integration

The project supports multiple Walrus SDKs with compatibility validation:

### 4.1 Supported SDKs

| SDK       | Package                 | Frameworks           | Use Cases       | Status         |
| --------- | ----------------------- | -------------------- | --------------- | -------------- |
| Mysten    | `@mysten/walrus`        | React, Vue, Plain TS | All             | Testnet stable |
| Enoki     | `@mysten/enoki`         | React                | Simple Upload   | WIP            |
| Tusky     | `@tusky-io/ts-sdk`      | React, Vue, Plain TS | Upload, Gallery | Planned        |
| Hibernuts | `@hibernuts/walrus-sdk` | React, Plain TS      | Upload only     | Planned        |

### 4.2 Compatibility Matrix

The CLI enforces compatibility via `matrix.ts`:

```typescript
const COMPATIBILITY_MATRIX = {
  mysten: {
    frameworks: ['react', 'vue', 'plain-ts'],
    useCases: ['simple-upload', 'gallery', 'defi-nft'],
  },
  tusky: {
    frameworks: ['react', 'vue', 'plain-ts'],
    useCases: ['simple-upload', 'gallery'],
  },
  hibernuts: {
    frameworks: ['react', 'plain-ts'],
    useCases: ['simple-upload'],
  },
};
```

### 5.3 Storage Adapter

Defined in Section 3.2 (Base Layer Architecture). SDK layers implement concrete adapters:

```typescript
// Base Layer Interface (templates/base/src/adapters/storage.ts)
export interface StorageAdapter {
  upload(file: File, options?: UploadOptions): Promise<UploadResult>;
  download(blobId: BlobId): Promise<Blob>;
  delete(blobId: BlobId): Promise<void>;
  getInfo(blobId: BlobId): Promise<BlobInfo>;
}
```

**Implemented Adapters:**

- **sdk-mysten** (`templates/sdk-mysten/src/adapter.ts`):
  - MystenStorageAdapter using @mysten/walrus SDK v0.9.0
  - Singleton client pattern via `getWalrusClient()`
  - Object-based API parameters (`{ blob, nEpochs, signer }`)
  - V1 metadata structure with validation
  - **Signer Required:** Upload throws error if `options.signer` not provided
  - Accepts `WalletAccount` from `@mysten/dapp-kit` as signer (cast to `any` for compatibility)

## 6. React Framework Layer Architecture

**Location:** `templates/react/`

**Purpose:** Modern React 18 application with Vite, TanStack Query, and Sui wallet integration.

### 6.1 Project Structure

```
templates/react/
├── src/
│   ├── providers/           # Context providers
│   │   ├── QueryProvider.tsx   # TanStack Query setup
│   │   └── WalletProvider.tsx  # Sui wallet + network config
│   ├── hooks/               # Custom React hooks
│   │   ├── useStorage.ts       # Storage operations
│   │   └── useWallet.ts        # Wallet state access
│   ├── components/          # Reusable UI components
│   │   ├── Layout.tsx
│   │   └── WalletConnect.tsx
│   ├── App.tsx              # Root component
│   ├── main.tsx             # Entry point
│   ├── index.css            # Global styles
│   └── dapp-kit.css         # Wallet UI styles
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript config (strict mode)
├── .eslintrc.json           # ESLint with React rules
└── package.json             # Dependencies
```

### 6.2 Provider Composition Pattern

The framework uses a layered provider pattern for dependency injection:

```tsx
// main.tsx entry point
<QueryProvider>
  {' '}
  // TanStack Query (async state)
  <WalletProvider>
    {' '}
    // Sui wallet + network config
    <App />
  </WalletProvider>
</QueryProvider>
```

**QueryProvider:**

- Configures TanStack Query client
- Defaults: refetchOnWindowFocus=false, retry=1, staleTime=5min
- Centralized async state management

**WalletProvider:**

- Wraps @mysten/dapp-kit components
- Network config from env (testnet/mainnet)
- Nested QueryClient for wallet-specific queries
- Auto-connects to Sui RPC (custom or default)

### 6.3 Custom Hooks API

**Storage Adapter Hook (`useStorageAdapter.ts`):**

HOC hook that injects wallet signer into storage operations. Upload requires connected wallet; read operations work without wallet.

```typescript
const adapter = useStorageAdapter();
// Returns adapter with currentAccount auto-injected as signer
```

**Storage Hooks (`useStorage.ts`):**

```typescript
// Upload mutation (requires wallet connection)
const upload = useUpload();
upload.mutate({ file: File, options?: UploadOptions });

// Download query (no wallet required)
const { data: blob } = useDownload(blobId);

// Metadata query (no wallet required)
const { data: metadata } = useMetadata(blobId);
```

**Wallet Integration:**

Uses `@mysten/dapp-kit` `useCurrentAccount()` to inject wallet as signer. All storage hooks internally use `useStorageAdapter` to ensure authenticated uploads.

All hooks use TanStack Query for caching, deduplication, and error handling.

### 6.4 Vite Configuration

```typescript
// vite.config.ts
{
  plugins: [react()],
  server: { port: 3000, open: true },
  build: { target: 'esnext', outDir: 'dist' },
  resolve: { alias: { '@': '/src' } }
}
```

**Features:**

- Fast Refresh for instant HMR
- Path alias (`@/`) for cleaner imports
- ESNext target for modern browsers
- Auto-open browser on `npm run dev`

### 6.5 TypeScript Configuration

**Strict Mode Enabled:**

- `strict: true` - All strict checks
- `noUnusedLocals`, `noUnusedParameters` - Enforce cleanup
- `noFallthroughCasesInSwitch` - Safety checks
- Target: ES2022 with ESNext module resolution
- JSX: preserve (handled by Vite)

### 6.6 Dependencies

**Core:**

- `react@^18.2.0`, `react-dom@^18.2.0`
- `vite@^5.0.11`, `@vitejs/plugin-react@^4.2.1`

**Sui Integration:**

- `@mysten/dapp-kit@^0.14.0` - Wallet components
- `@mysten/sui@^1.10.0` - Client library

**State Management:**

- `@tanstack/react-query@^5.17.0` - Async queries

**Dev Tools:**

- `typescript@^5.3.3`
- `eslint` + React plugins
- Type definitions for React

### 6.7 Integration with Base/SDK Layers

The React layer imports from base/SDK layers:

```typescript
// hooks/useStorageAdapter.ts
import { storageAdapter } from '../index.js'; // From SDK layer
import type { UploadOptions } from '../adapters/storage.js'; // From base layer
import { useCurrentAccount } from '@mysten/dapp-kit'; // Wallet integration

// hooks/useStorage.ts
import { useStorageAdapter } from './useStorageAdapter.js'; // HOC hook

// providers/WalletProvider.tsx
import { loadEnv } from '../utils/env.js'; // From base layer
```

**Wallet-Aware Adapter Pattern (HOC Hook):**

```
React Layer (useCurrentAccount) → currentAccount
    ↓
React Layer (useStorageAdapter) → Inject currentAccount as signer
    ↓
React Layer (useStorage hooks) → Use wallet-aware adapter
    ↓
SDK Layer (adapter.ts) → Receive signer via options
    ↓
Walrus SDK (writeBlob) → Use signer for on-chain transaction
```

Hooks wrap wallet-aware `storageAdapter` in TanStack Query primitives:

- `useUpload()` → `useMutation` → `useStorageAdapter().upload()` (wallet required)
- `useDownload()` → `useQuery` → `useStorageAdapter().download()` (no wallet)
- `useMetadata()` → `useQuery` → `useStorageAdapter().getMetadata()` (no wallet)

## 7. Technology Stack

**CLI:**

- **Runtime:** Node.js (ESM)
- **Tooling:** pnpm, TypeScript (strict mode), ESLint, Prettier
- **CLI Libs:** `commander` (^11.1.0), `prompts` (^2.4.2), `kleur` (^4.1.5)
- **Testing:** `vitest` (91/91 tests, 97.5% coverage)
- **Build:** `tsc` (TypeScript Compiler)

**React Framework:**

- **UI Library:** React 18.2.0 (Hooks, Suspense, Concurrent)
- **Build Tool:** Vite 5.0.11 (HMR, Fast Refresh)
- **State Management:** TanStack Query 5.17.0
- **Sui Integration:** @mysten/dapp-kit 0.14.0, @mysten/sui 1.10.0
- **Language:** TypeScript 5.3.3 (strict mode, ES2022)
- **Linting:** ESLint 8.56 + React plugins

```

```
