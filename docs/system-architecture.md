# System Architecture

**Walrus Starter Kit** uses a preset-based architecture for reliable, production-ready scaffolding. The project transitioned from a layer-based template system to pre-built presets for better maintainability and zero-error guarantees.

## 1. Monorepo Structure

The project is managed as a pnpm monorepo:

```
walrus-starter-kit/
├── packages/
│   ├── cli/                     # Scaffolder Engine (create-walrus-app)
│   │   └── src/                 # CLI source code
│   └── templates/               # Pre-built complete templates
│       ├── react-mysten-simple-upload/
│       ├── react-mysten-gallery/
│       └── react-mysten-simple-upload-enoki/
├── templates/                   # Reference layers (legacy documentation)
│   ├── base/                    # SDK-agnostic foundation
│   ├── sdk-mysten/              # @mysten/walrus SDK implementation
│   ├── enoki/                   # Enoki zkLogin layer
│   ├── react/                   # React framework layer
│   ├── simple-upload/           # Upload use case
│   └── gallery/                 # Gallery use case
├── tools/                       # Development tools
│   ├── test-apps/               # Test applications
│   └── validation/              # Template validation scripts
├── docs/                        # Technical Documentation
└── examples/                    # Generated test outputs
```

**Note:** The `templates/` directory contains legacy reference layers for documentation. Runtime generation uses pre-built presets from `packages/templates/`. Development tools are in `tools/`.

## 2. Scaffolding Engine (CLI)

The `packages/cli` engine implements a streamlined preset-based pipeline:

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
Validate Compatibility (matrix.ts) — Ensure valid preset exists
    ↓
Generate Project (generator/index.ts) — Copy preset + transform + .env setup
    ↓
Post-Install & Verification (post-install/index.ts) — PM install, Validation
```

### 2.2 Core Responsibilities

- **Interaction:** Using `commander` and `prompts` for hybrid mode (interactive/CI-CD)
- **Validation:** Checking compatibility matrix to ensure preset exists
- **Context Building:** Merging CLI arguments and prompt results with runtime validation
- **Package Manager Detection:** Auto-detecting pnpm/yarn/bun/npm from environment
- **Preset Resolution:** Determining preset path from SDK + framework + use-case selection
- **Template Copying:** Direct copy of complete preset directory to target
- **Template Transformation:** Variable replacement within template files (`{{projectName}}`)
- **Automatic Environment Setup:** Auto-copying `.env.example` to `.env` with dry-run support
- **Post-Install Automation:** Automatic dependency installation using `cross-spawn`
- **Project Verification:** Post-generation checks for `node_modules` and TypeScript compilation
- **Atomic Operations:** Rollback support for partially generated directories on failure or SIGINT
- **Path Security:** Path traversal validation to ensure preset paths are within package root

### 2.3 Key Components

| Component          | File                              | Purpose                                           |
| ------------------ | --------------------------------- | ------------------------------------------------- |
| Entry Point        | `index.ts`                        | Commander setup, orchestration, SIGINT handling   |
| Interactive Wizard | `prompts.ts`                      | Multi-step prompts with dynamic choices           |
| Context Builder    | `context.ts`                      | Merge args/prompts, runtime validation            |
| Generator Engine   | `generator/index.ts`              | Orchestrates preset copying and transformation    |
| File Operations    | `generator/file-ops.ts`           | Directory copying, env setup, security checks     |
| Transformer        | `generator/transform.ts`          | Variable replacement in template files            |
| Matrix             | `matrix.ts`                       | SDK/framework/use-case compatibility data         |
| Types              | `types.ts`                        | TypeScript interfaces (Context, ValidationResult) |
| Logger             | `utils/logger.ts`                 | Colored console output (kleur)                    |
| PM Detection       | `utils/detect-pm.ts`              | Package manager auto-detection                    |
| Post-Install       | `post-install/index.ts`           | Orchestrates dependencies and validation          |
| PM Runner          | `post-install/package-manager.ts` | Executes package manager commands (install)       |
| Project Validator  | `post-install/validator.ts`       | Verifies project integrity and TS compilation     |
| Env Copier         | `generator/file-ops.ts`           | Auto-copy `.env.example` to `.env` if missing     |
| UI Messages        | `post-install/messages.ts`        | Success/Error screens with next steps             |
| Template Tester    | `scripts/test-templates.sh`       | Automated validation for preset combinations      |

### 2.4 Context Object

The `Context` interface is the single source of truth for user configuration:

```typescript
interface Context {
  projectName: string;
  projectPath: string; // Auto-resolved absolute path
  sdk: 'mysten' | 'tusky' | 'hibernuts';
  framework: 'react' | 'vue' | 'plain-ts';
  useCase: 'simple-upload' | 'gallery' | 'defi-nft';
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun';
}
```

**Note:** Analytics and Tailwind options were part of the original design but are not currently implemented in presets.

## 3. Preset Architecture

**Current System:** Pre-built, validated template combinations replace runtime layer merging.

### 3.1 Available Presets

Located in `packages/templates/`:

1. **react-mysten-simple-upload**
   - SDK: @mysten/walrus
   - Framework: React + Vite + TanStack Query
   - Use Case: Single file upload/download
   - Status: Production ready

2. **react-mysten-gallery**
   - SDK: @mysten/walrus
   - Framework: React + Vite + TanStack Query
   - Use Case: Multi-file gallery with localStorage indexing
   - Status: Production ready

3. **react-mysten-simple-upload-enoki**
   - SDK: @mysten/walrus + @mysten/enoki
   - Framework: React + Vite + TanStack Query
   - Use Case: Upload with zkLogin authentication
   - Status: Beta (scaffolding complete, logic pending)

### 3.2 Preset Structure

Each preset is a complete, standalone application:

```
preset-name/
├── src/
│   ├── lib/                   # SDK integrations
│   │   ├── walrus/            # Walrus client + adapter
│   │   └── enoki/             # Enoki auth (if applicable)
│   ├── providers/             # React context providers
│   ├── hooks/                 # Custom React hooks
│   ├── components/            # UI components
│   ├── utils/                 # Utility functions
│   ├── App.tsx                # Root component
│   └── main.tsx               # Entry point
├── scripts/                   # Deployment scripts
│   ├── run-portal.sh          # Local Walrus portal
│   └── setup-walrus-deploy.sh # Sites deployment
├── .env.example               # Environment template
├── package.json               # Dependencies
├── vite.config.ts             # Build configuration
├── tsconfig.json              # TypeScript config
└── README.md                  # Setup guide
```

### 3.3 Generation Process

```
User Selection (SDK + Framework + Use Case)
    ↓
Matrix Lookup → Preset Name Resolution
    ↓
Copy Preset Directory → Target Location
    ↓
Transform Variables ({{projectName}}, etc.)
    ↓
Auto-copy .env.example → .env
    ↓
Install Dependencies (optional)
    ↓
Validate TypeScript Compilation (optional)
```

**No Runtime Merging:** Unlike the original layer-based design, presets are complete templates that require no runtime composition.

## 4. Multi-SDK Integration

The project supports multiple Walrus SDKs with compatibility validation:

### 4.1 Supported SDKs

| SDK       | Package                 | Status                | Presets Available                                |
| --------- | ----------------------- | --------------------- | ------------------------------------------------ |
| Mysten    | `@mysten/walrus`        | Testnet stable        | react-mysten-simple-upload, react-mysten-gallery |
| Enoki     | `@mysten/enoki`         | Beta (scaffolding)    | react-mysten-simple-upload-enoki                 |
| Tusky     | `@tusky-io/ts-sdk`      | Planned (matrix only) | None                                             |
| Hibernuts | `@hibernuts/walrus-sdk` | Planned (matrix only) | None                                             |

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

**Note:** Matrix defines theoretical combinations. Only `mysten + react` combinations have implemented presets. Vue, Plain TS, Tusky, and Hibernuts are planned but not available.

### 4.3 Storage Adapter

Defined in reference `templates/base/` layer, implemented in each preset:

```typescript
// StorageAdapter interface (reference)
export interface StorageAdapter {
  upload(data: File | Uint8Array, options?: UploadOptions): Promise<string>;
  download(blobId: string): Promise<Uint8Array>;
  delete(blobId: string): Promise<void>;
  getMetadata(blobId: string): Promise<BlobMetadata>;
}
```

**Implemented in Presets:**

- Each preset contains `src/lib/walrus/adapter.ts` implementing this interface
- Uses singleton `WalrusClient` from `client.ts`
- Object-based SDK calls (`{ blob, nEpochs, signer }`)
- V1 metadata structure validation
- Signer required for uploads (injected from React hooks)

## 5. React Framework Architecture

**Implementation:** Each React preset contains complete framework setup.

**Location:** `presets/react-mysten-*/src/`

**Purpose:** Modern React 18 application with Vite, TanStack Query, and Sui wallet integration.

### 5.1 Project Structure

```
presets/react-mysten-*/
├── src/
│   ├── providers/           # Context providers
│   │   ├── QueryProvider.tsx   # TanStack Query setup
│   │   ├── WalletProvider.tsx  # Sui wallet + network config
│   │   └── EnokiProvider.tsx   # Enoki zkLogin (enoki preset only)
│   ├── hooks/               # Custom React hooks
│   │   ├── use-upload.ts       # Upload mutation
│   │   ├── use-download.ts     # Download query
│   │   ├── use-wallet.ts       # Wallet state access
│   │   └── use-enoki-auth.ts   # Enoki auth (enoki preset only)
│   ├── components/          # Reusable UI components
│   │   ├── features/           # Feature components
│   │   └── layout/             # Layout components
│   ├── lib/                 # SDK integrations
│   │   ├── walrus/             # Walrus client + adapter
│   │   └── enoki/              # Enoki integration (enoki preset only)
│   ├── utils/               # Utility functions
│   ├── App.tsx              # Root component
│   ├── main.tsx             # Entry point
│   ├── index.css            # Global styles
│   └── types/               # TypeScript declarations
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript config (strict mode)
├── .eslintrc.json           # ESLint with React rules
└── package.json             # Dependencies
```

### 5.2 Provider Composition Pattern

The framework uses a layered provider pattern for dependency injection:

```tsx
// main.tsx entry point
<QueryProvider>
  {' '}
  // TanStack Query (async state)
  <WalletProvider>
    {' '}
    // Sui wallet + network config
    <EnokiProvider>
      {' '}
      // Enoki zkLogin (enoki preset only)
      <App />
    </EnokiProvider>
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

**EnokiProvider (Enoki preset only):**

- zkLogin authentication flow
- SessionStorage for auth state
- Google OAuth integration
- Dual-auth mode (zkLogin + standard wallets)

### 5.3 Custom Hooks API

**Storage Hooks:**

```typescript
// Upload mutation (requires wallet connection)
const upload = useUpload();
upload.mutate({ file: File, options?: UploadOptions });

// Download query (no wallet required)
const { data: blob } = useDownload(blobId);
```

**Wallet Integration:**

- Uses `@mysten/dapp-kit` `useCurrentAccount()` to inject wallet as signer
- Upload operations require connected wallet
- Read operations (download, metadata) work without wallet
- All hooks use TanStack Query for caching and error handling

**Enoki Auth (Enoki preset only):**

```typescript
const { login, logout, user } = useEnokiAuth();
// zkLogin authentication with Google OAuth
```

### 5.4 Vite Configuration

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

### 5.5 TypeScript Configuration

**Strict Mode Enabled:**

- `strict: true` - All strict checks
- `noUnusedLocals`, `noUnusedParameters` - Enforce cleanup
- `noFallthroughCasesInSwitch` - Safety checks
- Target: ES2022 with ESNext module resolution
- JSX: preserve (handled by Vite)
- **Type Safety Status (verified 2026-01-18):** All SDK object-based parameters correctly typed

### 5.6 Dependencies

**Core:**

- `react@^18.2.0`, `react-dom@^18.2.0`
- `vite@^5.0.11`, `@vitejs/plugin-react@^4.2.1`

**Sui Integration:**

- `@mysten/dapp-kit@^0.14.0` - Wallet components
- `@mysten/sui@^1.10.0` - Client library
- `@mysten/walrus@^0.9.0` - Walrus SDK

**Enoki (Enoki preset only):**

- `@mysten/enoki@latest` - zkLogin SDK

**State Management:**

- `@tanstack/react-query@^5.17.0` - Async queries

**Dev Tools:**

- `typescript@^5.3.3`
- `eslint` + React plugins
- Type definitions for React

### 5.7 Integration Pattern

React presets import from their own `lib/` directory:

```typescript
// hooks/use-upload.ts
import { walrusClient } from '../lib/walrus/client';
import { useCurrentAccount } from '@mysten/dapp-kit';

// providers/WalletProvider.tsx
import { loadEnv } from '../utils/env';
```

**Signer Injection:**

```
React Layer (useCurrentAccount) → currentAccount
    ↓
React Layer (useUpload hook) → Inject currentAccount as signer
    ↓
Lib Layer (adapter.ts) → Receive signer via options
    ↓
Walrus SDK (writeBlob) → Use signer for on-chain transaction
```

## 6. Technology Stack

**CLI:**

- **Runtime:** Node.js (ESM)
- **Tooling:** pnpm, TypeScript (strict mode), ESLint, Prettier
- **CLI Libs:** commander ^11.1.0, prompts ^2.4.2, kleur ^4.1.5
- **Testing:** Vitest (91/91 tests, 97.5% coverage)
- **Build:** tsc (TypeScript Compiler)

**React Presets:**

- **UI Library:** React 18.2.0 (Hooks, Suspense, Concurrent)
- **Build Tool:** Vite 5.0.11 (HMR, Fast Refresh)
- **State Management:** TanStack Query 5.17.0
- **Sui Integration:** @mysten/dapp-kit 0.14.0, @mysten/sui 1.10.0, @mysten/walrus 0.9.0
- **Enoki Integration:** @mysten/enoki (latest) - Enoki preset only
- **Language:** TypeScript 5.3.3 (strict mode, ES2022)
- **Linting:** ESLint 8.56 + React plugins

## 7. Legacy Template System (Reference)

The `templates/` directory contains modular layers from the original design:

```
templates/
├── base/                # SDK-agnostic foundation
├── sdk-mysten/          # @mysten/walrus adapter
├── enoki/               # Enoki zkLogin layer
├── react/               # React framework
├── simple-upload/       # Upload use case
└── gallery/             # Gallery use case
```

**Status:** Maintained for reference and documentation purposes only. Runtime generation uses presets from `packages/templates/`.

**Historical Context:** Originally designed for runtime layer merging with deep package.json merging and file composition. Migrated to preset-based system for better reliability and zero-error guarantees.

## 8. Key Architectural Decisions

### 8.1 Preset-Based vs Layer-Based

**Original Design:** Runtime composition of multiple template layers
**Current Design:** Pre-built, validated presets
**Reason:** Eliminates runtime merging complexity, guarantees working templates

### 8.2 Git Automation Removal

**Deprecated:** v0.1.3
**Reason:** Reduced complexity, avoided permission issues, user-controlled git management

### 8.3 Environment Auto-Setup

**Added:** v0.1.3
**Feature:** Auto-copy `.env.example` → `.env` with non-critical error handling
**Benefit:** Improved DX, reduced manual setup steps

### 8.4 TypeScript Strict Mode

**Enforced:** All presets and CLI engine
**Coverage:** 97.5% test coverage on CLI
**Validation:** Automated TypeScript compilation checks in post-install

## 9. Security Measures

- Path traversal prevention in project names
- NPM naming rules enforcement
- Absolute path rejection
- 214-character limit (npm package limit)
- Command injection hardening in spawn operations
- Path security validation for preset resolution

## 10. Future Architecture Plans

- **Vue Framework:** Add Vue preset templates
- **Plain TypeScript:** Add vanilla TS presets
- **Tusky SDK:** Integrate community SDK
- **Hibernuts SDK:** Integrate alternative SDK
- **Walrus Sites:** Automated deployment integration
- **Seal Integration:** Private blob access control
