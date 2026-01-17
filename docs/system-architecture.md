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

The `packages/cli` engine is responsible for:
- **Interaction:** Using `commander` and `prompts` for the user wizard.
- **Validation:** Checking the compatibility matrix (SDK vs Framework).
- **Composition:** Assembling the final project by merging template layers.
- **Deep Merging:** Intelligent merging of `package.json` and JSON configs to prevent overrides.
- **Post-Install:** Handling `pnpm install` and initial sanity checks.

## 3. Template Layering Pattern

We use a **Base + Layer + Adapter Pattern**:

1.  **Base Layer:** Contains common files (`.gitignore`, `.env.example`, `tsconfig.json`) and the **Storage Adapter Interface**.
2.  **SDK Layer:** Implements the Storage Adapter using the Mysten Labs TypeScript SDK (`@mysten/walrus`).
3.  **Framework Layer:** Sets up the UI environment (Vite, React, Tailwind).
4.  **Use Case Layer:** High-level features (Gallery, Upload UI) that consume the Storage Adapter.

## 4. Mysten Labs SDK Integration

The project exclusively uses the Mysten Labs TypeScript SDK for interacting with the Walrus Protocol. This ensures:
- Native compatibility with Sui blockchain standards.
- Direct access to official Walrus storage features.
- Long-term support and alignment with Mysten Labs ecosystem updates.

### Storage Adapter

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
- **Tooling:** pnpm, TypeScript, ESLint, Prettier
- **CLI Libs:** `commander`, `prompts`, `kleur`, `fs-extra`
- **Build:** `tsc` (TypeScript Compiler)
```
