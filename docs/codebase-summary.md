# Codebase Summary

**Project:** Walrus Starter Kit
**Generated:** 2026-01-24 (Updated with Reorganization Analysis)
**Version:** 0.1.5
**Status:** Core MVP Ready + Enoki Beta Integration

## 1. Overview

Walrus Starter Kit is a monorepo containing `create-walrus-app`, an interactive CLI tool for scaffolding production-ready Walrus applications on Sui. It uses a preset-based architecture with pre-built templates for rapid scaffolding, supporting multiple SDKs, frameworks, and use cases.

## 1.5. Structural Issues & Reorganization Analysis

### Current Issues Identified

#### 1. **Mixed Responsibilities in CLI Package**

- CLI engine AND complete application templates coexist in `packages/cli/`
- Build artifacts (`dist/`) committed to version control
- Test applications (`my-test-app/`, `pkg-test/`) mixed with production code

#### 2. **Duplicate Template Systems**

- `templates/` (legacy reference layers) and `packages/cli/presets/` (production presets) both exist
- Architecture docs state templates are reference-only, but both systems maintained

#### 3. **Inconsistent Organization**

- Mix of kebab-case and camelCase naming
- Development artifacts scattered throughout source directories
- Large planning directory (260+ files) may overwhelm contributors

#### 4. **Maintenance Overhead**

- Build artifacts should be gitignored
- Test apps belong in development tools, not source code
- Empty `examples/` directory serves no purpose

### Proposed Reorganization

```
walrus-starter-kit/
├── packages/
│   ├── cli/                    # CLI engine only
│   │   ├── src/               # CLI source code
│   │   └── scripts/           # Template validation
│   └── templates/             # Pre-built presets (moved from cli/presets)
│       ├── react-mysten-simple-upload/
│       ├── react-mysten-gallery/
│       └── react-mysten-simple-upload-enoki/
├── templates/                 # Legacy reference layers (unchanged)
├── tools/                     # Development tools
│   ├── test-apps/             # Test applications (moved from cli/)
│   └── validation/            # Template validation scripts
├── docs/                      # Documentation (unchanged)
└── examples/                  # Generated outputs (populate or remove)
```

### Benefits

- **Clear Separation:** CLI logic separate from application templates
- **Logical Grouping:** Related functionality grouped together
- **Reduced Complexity:** Remove build artifacts and test apps from source
- **Better DX:** Cleaner directory structure for contributors

### Migration Impact

- Update all file references and import paths
- Modify build scripts and package configurations
- Update documentation and CI/CD pipelines
- Ensure backward compatibility for existing installations

## 2. Architecture Pattern

The project transitioned from a layer-based template system to a **preset-based architecture** for better reliability and maintainability. Each preset is a complete, pre-validated template combination.

### Current Architecture: Presets

- **Location**: `packages/cli/presets/`
- **Pattern**: Pre-built complete templates (no runtime merging)
- **Validation**: Each preset independently tested and validated
- **Available Presets**:
  - `react-mysten-simple-upload` - Simple file upload/download
  - `react-mysten-gallery` - Multi-file gallery with localStorage
  - `react-mysten-simple-upload-enoki` - Upload with zkLogin (Beta)

### Legacy Architecture: Templates (Reference)

- **Location**: `templates/` (maintained for documentation)
- **Pattern**: Modular layers (base + sdk + framework + use-case)
- **Status**: Superseded by presets but kept for reference

## 3. Directory Structure

### Current Structure (Issues Highlighted)

```
walrus-starter-kit/
├── packages/cli/               # ⚠️ MIXED: CLI engine + presets + test apps
│   ├── src/                    # ✅ CLI source code
│   ├── presets/                # ⚠️ Should be separate package
│   ├── my-test-app/            # ❌ Development artifact in source
│   ├── pkg-test/               # ❌ Development artifact in source
│   └── dist/                   # ❌ Build artifacts (should be gitignored)
├── templates/                  # ✅ Legacy reference layers
├── docs/                       # ✅ Documentation
├── examples/                   # ⚠️ Empty directory
└── plans/                      # ⚠️ 260+ files, may overwhelm
```

### Proposed Structure (Post-Reorganization)

```
walrus-starter-kit/
├── packages/
│   ├── cli/                    # ✅ CLI engine only
│   │   ├── src/               # CLI source code
│   │   └── scripts/           # Template validation
│   └── templates/             # ✅ Pre-built presets (moved)
│       ├── react-mysten-simple-upload/
│       ├── react-mysten-gallery/
│       └── react-mysten-simple-upload-enoki/
├── templates/                 # ✅ Legacy reference layers (unchanged)
├── tools/                     # ✅ Development tools (new)
│   ├── test-apps/             # Test applications (moved)
│   └── validation/            # Template validation scripts
├── docs/                      # ✅ Documentation (unchanged)
└── examples/                  # ⚠️ Generated outputs (populate/remove)
```

### CLI Engine Components (Current)

```
packages/cli/src/
├── index.ts                    # Entry point with Commander
├── context.ts                  # Context builder (args + prompts)
├── matrix.ts                   # SDK/framework compatibility
├── generator/                  # Project generation engine
│   ├── index.ts               # Generation orchestrator
│   ├── file-ops.ts            # File operations + env setup
│   └── transform.ts           # Variable replacement
└── post-install/              # Post-generation automation
    ├── index.ts               # Orchestrator
    ├── package-manager.ts     # PM detection/install
    ├── validator.ts           # Project validation
    └── messages.ts            # Success/error UI
```

walrus-starter-kit/
├── packages/cli/ # CLI engine and presets
│ ├── src/ # CLI source code
│ │ ├── index.ts # Entry point with Commander
│ │ ├── context.ts # Context builder (args + prompts)
│ │ ├── matrix.ts # SDK/framework compatibility
│ │ ├── generator/ # Project generation engine
│ │ │ ├── index.ts # Generation orchestrator
│ │ │ ├── file-ops.ts # File operations + env setup
│ │ │ └── transform.ts # Variable replacement
│ │ └── post-install/ # Post-generation automation
│ │ ├── index.ts # Orchestrator
│ │ ├── package-manager.ts # PM detection/install
│ │ ├── validator.ts # Project validation
│ │ └── messages.ts # Success/error UI
│ ├── presets/ # Pre-built templates
│ │ ├── react-mysten-simple-upload/
│ │ ├── react-mysten-gallery/
│ │ └── react-mysten-simple-upload-enoki/
│ └── scripts/
│ └── test-templates.sh # Automated validation
├── templates/ # Reference template layers
│ ├── base/ # Core config + StorageAdapter
│ ├── sdk-mysten/ # @mysten/walrus adapter
│ ├── enoki/ # Enoki zkLogin layer
│ ├── react/ # React framework
│ ├── simple-upload/ # Upload use case
│ └── gallery/ # Gallery use case
├── docs/ # Project documentation
├── examples/ # Generated test outputs
└── plans/ # Implementation plans + reports

````

## 4. CLI Engine Components

### Entry Point (`src/index.ts`)

- Commander.js setup for argument parsing
- SIGINT handling for cleanup on Ctrl+C
- Hybrid mode: interactive wizard or CI/CD flags
- Interrupt-safe project generation

### Context Builder (`src/context.ts`)

- Merges CLI arguments and prompt responses
- Runtime validation with detailed error messages
- Auto-resolves project absolute path
- Default values for optional fields

### Compatibility Matrix (`src/matrix.ts`)

- Defines SDK/framework/use-case combinations
- Enforces valid preset selections
- Metadata for SDK descriptions and docs

**Matrix Contents:**

```typescript
{
  mysten: {
    frameworks: ['react', 'vue', 'plain-ts'],
    useCases: ['simple-upload', 'gallery', 'defi-nft']
  },
  tusky: { frameworks: ['react', 'vue', 'plain-ts'], useCases: ['simple-upload', 'gallery'] },
  hibernuts: { frameworks: ['react', 'plain-ts'], useCases: ['simple-upload'] }
}
````

### Generator Engine (`src/generator/`)

**Orchestrator (`index.ts`):**

- Resolves preset path from context
- Copies preset template to target directory
- Transforms variables in template files
- Auto-copies `.env.example` → `.env`
- Atomic rollback on errors or SIGINT

**File Operations (`file-ops.ts`):**

- Cross-platform directory copying
- Environment file setup with dry-run support
- Path traversal security checks
- Non-critical error handling for env setup

**Transformation (`transform.ts`):**

- Mustache-style variable replacement (`{{projectName}}`)
- Applies to `.ts`, `.tsx`, `.json`, `.md`, `.html`, `.env.example`
- Context variables: `projectName`, `sdk`, `framework`, etc.

### Post-Install (`src/post-install/`)

**Orchestrator (`index.ts`):**

- Manages dependency installation
- Runs project validation
- Displays success/error messages
- Skip flags: `--skip-install`, `--skip-validation`

**Package Manager (`package-manager.ts`):**

- Auto-detects npm/pnpm/yarn/bun
- Executes install with streaming output
- Command injection hardening

**Validator (`validator.ts`):**

- Checks `package.json` integrity
- Verifies `node_modules` existence
- Runs TypeScript compilation (`tsc --noEmit`)
- Multi-step validation reporting

**Messages (`messages.ts`):**

- Success UI with next steps
- Error recovery instructions
- Colored console output (kleur)

## 5. Preset Structure

Each preset is a complete, standalone template with:

```
react-mysten-simple-upload/
├── src/
│   ├── lib/walrus/          # Walrus SDK integration
│   │   ├── client.ts        # Singleton WalrusClient
│   │   ├── adapter.ts       # StorageAdapter implementation
│   │   └── types.ts         # Type definitions
│   ├── providers/           # React context providers
│   │   ├── QueryProvider.tsx
│   │   └── WalletProvider.tsx
│   ├── hooks/               # TanStack Query hooks
│   │   ├── use-upload.ts
│   │   ├── use-download.ts
│   │   └── use-wallet.ts
│   ├── components/          # UI components
│   │   ├── features/        # Feature components
│   │   └── layout/          # Layout components
│   ├── utils/               # Utilities
│   │   ├── env.ts           # Zod env validation
│   │   └── mime-type.ts     # MIME detection
│   ├── App.tsx              # Root component
│   └── main.tsx             # Entry point
├── scripts/
│   ├── run-portal.sh        # Local Walrus portal
│   └── setup-walrus-deploy.sh  # Sites deployment
├── .env.example             # Environment template
├── package.json             # Dependencies
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript config
└── README.md                # Setup instructions
```

## 6. SDK Integration

### Mysten SDK (`@mysten/walrus` v0.9.0)

**Status:** Testnet Stable
**Implementation:** `src/lib/walrus/adapter.ts` in each preset
**API Pattern:** Object-based parameters

```typescript
// Upload
await client.writeBlobToUploadRelay({ blob, nEpochs, signer });

// Download
await client.readBlob({ blobId });

// Metadata (V1 structure)
const response = await client.getBlobMetadata({ blobId });
const size = response.metadata.V1.unencoded_length;
```

**Signer Integration:**

- Upload requires connected wallet
- Signer injected from `@mysten/dapp-kit` `useCurrentAccount()`
- Read operations work without wallet

### Enoki SDK (`@mysten/enoki`)

**Status:** Beta (Scaffolding Complete, Logic Pending)
**Implementation:** `src/lib/enoki/` + `src/providers/EnokiProvider.tsx`
**Features:**

- zkLogin via Google OAuth
- SessionStorage adapter with SSR guards
- Dual-auth flow (zkLogin + standard wallets)

**Pending Implementation:**

- Constants & Zod validation (Phase 02)
- EnokiProvider & Auth flow (Phase 03)
- CLI matrix integration (Phase 04)

### Planned SDKs

- **Tusky** (`@tusky-io/ts-sdk`) - Community SDK
- **Hibernuts** (`@hibernuts/walrus-sdk`) - Alternative SDK

## 7. React Framework Architecture

### Provider Composition

```tsx
<QueryProvider>
  {' '}
  // TanStack Query
  <WalletProvider>
    {' '}
    // Sui wallet + network
    <EnokiProvider>
      {' '}
      // zkLogin (Enoki presets only)
      <App />
    </EnokiProvider>
  </WalletProvider>
</QueryProvider>
```

### Custom Hooks Pattern

**Storage Hooks (`use-upload.ts`, `use-download.ts`):**

- Wrap `StorageAdapter` methods in TanStack Query
- `useMutation` for writes (upload)
- `useQuery` for reads (download, metadata)
- Auto-inject wallet signer for uploads

**Wallet Hook (`use-wallet.ts`):**

- Access current account from `@mysten/dapp-kit`
- Network configuration
- Connection state

### StorageAdapter Interface

**Base Interface:**

```typescript
interface StorageAdapter {
  upload(data: File | Uint8Array, options?: UploadOptions): Promise<string>;
  download(blobId: string): Promise<Uint8Array>;
  delete(blobId: string): Promise<void>;
  getMetadata(blobId: string): Promise<BlobMetadata>;
}
```

**Mysten Implementation:**

- Uses singleton `WalrusClient` from `client.ts`
- Object-based SDK calls
- V1 metadata structure validation
- Signer required for uploads

## 8. Technology Stack

### CLI

- **Runtime:** Node.js (ESM)
- **Build:** TypeScript Compiler (strict mode)
- **Testing:** Vitest (91/91 tests, 97.5% coverage)
- **CLI Libs:** commander ^11.1.0, prompts ^2.4.2, kleur ^4.1.5
- **File Ops:** fs-extra ^11.2.0, cross-spawn ^7.0.6

### React Presets

- **UI:** React 18.2.0 (Hooks, Suspense)
- **Build:** Vite 5.0.11 (HMR, Fast Refresh)
- **State:** TanStack Query 5.17.0
- **Sui:** @mysten/dapp-kit 0.14.0, @mysten/sui 1.10.0
- **Language:** TypeScript 5.3.3 (strict mode, ES2022)
- **Linting:** ESLint 8.56 + React plugins

## 9. Key Features

### Automated Environment Setup

- Auto-copies `.env.example` → `.env` after generation
- Non-critical error handling (warns but doesn't fail)
- Dry-run support for testing

### Post-Install Automation

- Package manager auto-detection
- Automatic dependency installation
- TypeScript compilation validation
- Success/error messaging with next steps

### Template Validation

- Automated testing via `scripts/test-templates.sh`
- Validates all preset combinations
- Checks generation, install, compilation
- Security hardening against command injection

### Security Features

- Path traversal prevention in project names
- NPM naming compliance validation
- Length limits (214 chars)
- Absolute path rejection

## 10. Current Progress (v0.1.5)

**Completed:**

- ✅ CLI Engine MVP (Phases 1-9)
- ✅ React + Mysten SDK presets (simple-upload, gallery)
- ✅ Automated testing infrastructure
- ✅ Post-install automation + validation
- ✅ Enoki scaffolding + documentation (Phase 10.01, 10.05)
- ✅ TypeScript build fixes for all presets

**In Progress:**

- 🚧 Enoki provider implementation (Phase 10.02-10.04)

**Planned:**

- ⏳ Vue.js framework support
- ⏳ Plain TypeScript templates
- ⏳ Tusky/Hibernuts SDK integration
- ⏳ Walrus Sites deployment integration

## 11. Testing Strategy

**Unit Tests:**

- Co-located with source files (`*.test.ts`)
- Vitest test runner
- 97.5% coverage across CLI engine

**Integration Tests:**

- `packages/cli/scripts/test-templates.sh`
- End-to-end preset generation
- Dependency install + TypeScript compilation
- Validates 5+ template combinations

**CI/CD:**

- GitHub Actions workflows
- Automated release via semantic-release
- Conventional commits enforcement

## 12. Documentation Structure

```
docs/
├── project-overview-pdr.md      # Product requirements
├── system-architecture.md       # Technical architecture
├── code-standards.md            # Coding conventions
├── project-roadmap.md           # Implementation phases
├── codebase-summary.md          # This file
├── design-guidelines.md         # UI/UX standards
└── wireframes/                  # Design mockups
```

## 13. Known Limitations

- **Framework Support:** Only React is production-ready; Vue and Plain TS are planned
- **SDK Support:** Only Mysten SDK is fully stable; Enoki is beta, others are planned
- **Preset Expansion:** Limited to 3 presets; more combinations coming
- **Git Automation:** Removed to reduce complexity (users manage manually)

## 14. Key Differences from Original Design

**Layer-Based → Preset-Based:**

- Originally designed as runtime layer merging
- Migrated to pre-built presets for reliability
- Templates maintained for reference and documentation

**Git Initialization:**

- Originally auto-initialized git repos
- Deprecated in v0.1.3 to reduce post-install complexity

**Enoki Integration:**

- Added in v0.1.4 as new authentication method
- Scaffolding complete, logic implementation pending

## 15. Reorganization Recommendations

### Immediate Actions (High Priority)

#### 1. **Clean Build Artifacts**

```bash
# Remove committed dist directories
rm -rf packages/cli/dist/
# Update .gitignore (already includes dist/)
```

#### 2. **Move Test Applications**

```bash
# Relocate development test apps
mkdir -p tools/test-apps/
mv packages/cli/my-test-app/ tools/test-apps/
mv packages/cli/pkg-test/ tools/test-apps/
```

#### 3. **Separate Templates Package**

```bash
# Create separate templates package
mkdir -p packages/templates/
mv packages/cli/presets/* packages/templates/
# Update pnpm-workspace.yaml and package references
```

### Medium Priority Actions

#### 4. **Consolidate Validation Scripts**

```bash
# Move validation scripts to tools/
mkdir -p tools/validation/
mv packages/cli/scripts/test-templates.sh tools/validation/
```

#### 5. **Archive Planning Documents**

```bash
# Move old plans to archive (keep recent active plans)
mkdir -p plans/archive/
# Move plans older than 30 days to archive
```

### Long-term Considerations

#### 6. **Populate or Remove Examples Directory**

- Either populate with real examples or remove empty directory
- Consider integrating with CI/CD to generate fresh examples

#### 7. **Standardize Naming Conventions**

- Audit and standardize kebab-case vs camelCase usage
- Update all references consistently

### Migration Checklist

#### Pre-Migration

- [ ] Run full test suite (`pnpm test`)
- [ ] Verify all presets generate correctly
- [ ] Backup current working state
- [ ] Update all import paths and references

#### Migration Steps

- [ ] Clean build artifacts
- [ ] Move test applications to `tools/test-apps/`
- [ ] Create `packages/templates/` and move presets
- [ ] Update `packages/cli/src/generator/layers.ts` preset paths
- [ ] Update `pnpm-workspace.yaml`
- [ ] Move validation scripts to `tools/validation/`

#### Post-Migration

- [ ] Run full test suite
- [ ] Test preset generation with all combinations
- [ ] Update CI/CD pipelines
- [ ] Update documentation references
- [ ] Verify npm package still builds correctly

### Benefits of Reorganization

- **Maintainability:** Clear separation of concerns
- **Developer Experience:** Logical file placement
- **CI/CD Efficiency:** No build artifacts in version control
- **Package Size:** Smaller CLI package (engine only)
- **Scalability:** Easy to add new templates without bloating CLI

### Risk Mitigation

- **Backward Compatibility:** Ensure existing installations continue working
- **Path Updates:** Comprehensive search/replace for all file references
- **Testing:** Full integration testing before/after migration
- **Documentation:** Update all docs and README files

## 16. Repository Metrics

- **Total Files:** 502 files
- **Total Tokens:** 503,349 tokens
- **Planning Documents:** 260+ files (~100K tokens)
- **CLI Tests:** 91/91 passing (97.5% coverage)
- **Security:** No sensitive data detected
- **Build Status:** All presets compile successfully
