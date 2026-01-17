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
│   ├── sdk-*/               # Layer 2: SDK-specific implementations
│   ├── framework-*/         # Layer 3: UI Framework (React, Vue, etc.)
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
[Template Generation] (Phase 7 - future)
    ↓
Post-Install & Verification
```

### 2.2 Core Responsibilities

- **Interaction:** Using `commander` and `prompts` for hybrid mode (interactive/CI-CD).
- **Validation:** Checking the compatibility matrix (SDK vs Framework vs Use Case).
- **Context Building:** Merging CLI arguments and prompt results with runtime type validation.
- **Package Manager Detection:** Auto-detecting pnpm/yarn/bun/npm from environment.
- **Composition:** (Phase 7) Assembling the final project by merging template layers.
- **Deep Merging:** (Phase 7) Intelligent merging of `package.json` and JSON configs.
- **Post-Install:** (Phase 7) Handling package installation and initial sanity checks.

### 2.3 Key Components

| Component | File | Purpose |
|-----------|------|---------|
| Entry Point | `index.ts` | Commander setup, orchestration, error handling |
| Interactive Wizard | `prompts.ts` | 6-step prompts with dynamic choices |
| Context Builder | `context.ts` | Merge args/prompts, runtime validation |
| Validator | `validator.ts` | Compatibility checks, project name validation |
| Matrix | `matrix.ts` | SDK/framework/use-case compatibility data |
| Types | `types.ts` | TypeScript interfaces (Context, ValidationResult) |
| Logger | `utils/logger.ts` | Colored console output (kleur) |
| PM Detection | `utils/detect-pm.ts` | Package manager auto-detection |

### 2.4 Context Object

The `Context` interface is the single source of truth for user configuration:

```typescript
interface Context {
  projectName: string;
  projectPath: string;        // Auto-resolved absolute path
  sdk: 'mysten' | 'tusky' | 'hibernuts';
  framework: 'react' | 'vue' | 'plain-ts';
  useCase: 'simple-upload' | 'gallery' | 'defi-nft';
  analytics: boolean;         // Blockberry analytics integration
  tailwind: boolean;          // Tailwind CSS inclusion
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun';
}
```

## 3. Template Layering Pattern

We use a **Base + Layer + Adapter Pattern**:

1.  **Base Layer:** Contains common files (`.gitignore`, `.env.example`, `tsconfig.json`) and the **Storage Adapter Interface**.
2.  **SDK Layer:** Implements the Storage Adapter using the Mysten Labs TypeScript SDK (`@mysten/walrus`).
3.  **Framework Layer:** Sets up the UI environment (Vite, React, Tailwind).
4.  **Use Case Layer:** High-level features (Gallery, Upload UI) that consume the Storage Adapter.

## 4. Multi-SDK Integration

The project supports multiple Walrus SDKs with compatibility validation:

### 4.1 Supported SDKs

| SDK | Package | Frameworks | Use Cases | Status |
|-----|---------|------------|-----------|--------|
| Mysten | `@mysten/walrus` | React, Vue, Plain TS | All | Testnet stable |
| Tusky | `@tusky-io/ts-sdk` | React, Vue, Plain TS | Upload, Gallery | Community |
| Hibernuts | `@hibernuts/walrus-sdk` | React, Plain TS | Upload only | Alternative |

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

### 4.3 Storage Adapter

To ensure use cases are decoupled from the SDK implementation details, we define a standard interface in the base layer:

```typescript
// Example Interface
export interface StorageAdapter {
  upload(file: File): Promise<string>;
  download(blobId: string): Promise<Blob>;
}
```

The SDK layer provides the implementation of this interface using `@mysten/walrus`.

## 5. Technology Stack

- **Runtime:** Node.js (ESM)
- **Tooling:** pnpm, TypeScript (strict mode), ESLint, Prettier
- **CLI Libs:** `commander` (^11.1.0), `prompts` (^2.4.2), `kleur` (^4.1.5)
- **Testing:** `vitest` (55/55 tests, 96.42% coverage)
- **Build:** `tsc` (TypeScript Compiler)
```
