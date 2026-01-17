# Code Standards & Structure

This document outlines the coding standards and structural conventions for the Walrus Starter Kit.

## 1. General Principles

- **TypeScript First:** All code must be written in TypeScript with strict type checking.
- **ES Modules (ESM):** The project uses ESM (`"type": "module"`) throughout.
- **KISS/DRY:** Keep it simple, but avoid unnecessary repetition in template layers.
- **Functional Patterns:** Prefer functional components and hooks in React templates.

## 2. Directory Conventions

- `src/`: Source code.
- `dist/`: Compiled output (git ignored).
- `tests/`: Unit and integration tests.
- `templates/`: Static assets and code fragments for the generator.

## 3. CLI Standards (packages/cli)

### 3.1 Command Handling & User Input

- **Argument Parsing:** Use `commander.js` for robust CLI argument handling.
- **Interactive Prompts:** Use `prompts` for wizard-style user input with dynamic choices.
- **Hybrid Mode:** Support both interactive mode (no flags) and CI/CD mode (all flags provided).
- **Terminal Output:** Use `kleur` for colored console messages (lightweight, zero dependencies).
- **File Operations:** Use `fs-extra` for cross-platform filesystem operations.
- **Subprocesses:** Use `cross-spawn` for running external commands (npm, git) to ensure compatibility across platforms (Windows/Linux/macOS).

### 3.2 Error Handling

- **Try-Catch:** Always wrap async operations in try-catch blocks.
- **User-Friendly Errors:** Provide actionable error messages without stack traces.
- **Validation Errors:** Include suggestions for valid alternatives.
- **Error Sanitization:** Sanitize error messages before displaying to users.

Example:

```typescript
try {
  // operation
} catch (error) {
  const message =
    error instanceof Error ? error.message : 'Unknown error occurred';
  logger.error(`Failed: ${message}`);
  process.exit(1);
}
```

### 3.3 Validation

- **Input Validation:** Validate project names, SDK choices, framework compatibility before processing.
- **Runtime Type Checking:** Add runtime validation in addition to TypeScript types.
- **Matrix-Based Validation:** Use compatibility matrix to enforce valid SDK/framework/use-case combinations.

### 3.4 Security

- **Path Traversal Prevention:** Reject project names containing `..`, `/`, or `\`.
- **Absolute Path Rejection:** Prevent absolute paths in project names.
- **NPM Naming Rules:** Enforce lowercase, alphanumeric, and hyphens only (no leading/trailing hyphens).
- **Length Limits:** Enforce 214-character limit for project names (npm package limit).

Example validation:

```typescript
export function validateProjectName(name: string): boolean | string {
  if (!name || name.trim().length === 0) {
    return 'Project name cannot be empty';
  }
  if (name.length > 214) {
    return 'Project name must be 214 characters or less';
  }
  if (name.includes('..') || name.includes('/') || name.includes('\\')) {
    return 'Project name cannot contain path separators';
  }
  if (path.isAbsolute(name)) {
    return 'Project name cannot be an absolute path';
  }
  if (!/^[a-z0-9-]+$/.test(name)) {
    return 'Project name must contain only lowercase letters, numbers, and hyphens';
  }
  if (name.startsWith('-') || name.endsWith('-')) {
    return 'Project name cannot start or end with a hyphen';
  }
  return true;
}
```

### 3.5 Post-Install Process

- **Orchestration:** Use a dedicated orchestrator (`runPostInstall`) to manage the sequence of post-generation tasks.
- **Dependency Installation:** Auto-detect the user's preferred package manager (pnpm, npm, yarn, bun) and run `install`.
- **Git Initialization:** Initialize a git repository and create an initial commit if git is available on the system.
- **Validation:** Run automated checks after generation, including `package.json` integrity and TypeScript compilation via `npx tsc --noEmit`.
- **Skip Flags:** Always provide flags (e.g., `--skip-install`, `--skip-git`, `--skip-validation`) to allow users to opt-out of automatic tasks.
- **Silent Failures:** Post-install warnings (like git failure) should not exit the process with an error code if the project was successfully generated.

## 4. Template Standards (templates/)

### 4.1 General Template Guidelines

- **Modular package.json:** Template layers should only contain the dependencies specific to that layer.
- **Adapter Pattern:** SDK layers must implement the storage adapter interface (e.g., `StorageAdapter`) defined in the base layer.
- **Environment Variables:** Use `VITE_` prefix (e.g., `VITE_WALRUS_NETWORK`) for variables intended for the frontend.
- **Consistency:** Use camelCase for file names in templates unless framework conventions dictate otherwise (e.g., PascalCase for React components).
- **Import Paths:** Use `./` for same-directory references in templates (base layer provides subdirectories, SDK layers overlay files at same level after generation).

### 4.2 React Framework Standards (templates/react/)

**File Structure:**

- `src/providers/` - Context providers (QueryProvider, WalletProvider)
- `src/hooks/` - Custom React hooks (useStorage, useWallet)
- `src/components/` - Reusable UI components (Layout, WalletConnect)
- `src/App.tsx` - Root component
- `src/main.tsx` - Entry point with provider composition

**Component Guidelines:**

- Use functional components exclusively
- Prefer TypeScript interfaces for prop types
- Export components as named exports (not default)
- Place types/interfaces above the component definition

**Hook Patterns:**

- Wrap storage adapter methods with TanStack Query hooks
- Use `useMutation` for write operations (upload, delete)
- Use `useQuery` for read operations (download, getMetadata)
- Enable queries conditionally when required params are present
- **HOC Pattern:** `useStorageAdapter` injects wallet signer into operations
- All storage hooks consume wallet-aware adapter via `useStorageAdapter()`

**SDK Integration (v0.9.0):**

All Walrus SDK calls use object-based parameters:

```typescript
// Upload with object params
await client.writeBlobToUploadRelay({ blob, nEpochs });

// Download with object params
await client.readBlob({ blobId });

// Metadata with object params + V1 structure
const response = await client.getBlobMetadata({ blobId });
const size = response.metadata.V1.unencoded_length;
```

**StorageAdapter Interface:**

SDK layers implement base adapter interface. Signer injected at React layer via HOC hook:

```typescript
// Base interface (base/src/adapters/storage.ts)
interface UploadOptions {
  epochs?: number;
  contentType?: string;
  signer?: any; // Injected by useStorageAdapter hook from @mysten/dapp-kit currentAccount
}

// SDK implementation (sdk-mysten/src/adapter.ts)
class MystenStorageAdapter {
  async upload(data: File | Uint8Array, options?: UploadOptions): Promise<string> {
    if (!options?.signer) throw new Error('Signer required');
    return client.writeBlobToUploadRelay({ blob, nEpochs, signer: options.signer });
  }
}

// React HOC hook (react/src/hooks/useStorageAdapter.ts)
export function useStorageAdapter() {
  const currentAccount = useCurrentAccount(); // From @mysten/dapp-kit
  return useMemo(() => ({
    upload: (file, options) => storageAdapter.upload(file, { ...options, signer: currentAccount })
  }), [currentAccount]);
}
```

**Provider Composition:**

```tsx
<QueryProvider>
  {' '}
  // TanStack Query
  <WalletProvider>
    {' '}
    // Sui wallet + network
    <App />
  </WalletProvider>
</QueryProvider>
```

**TypeScript Configuration:**

- Enable strict mode: `"strict": true`
- Target ES2022 or later
- JSX preservation for Vite processing
- Enable `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
- **Type Safety Status (verified 2026-01-18):** All SDK object-based parameters correctly typed, no mismatches detected

**Vite Configuration:**

- Default port: 3000
- Path alias: `@` → `/src`
- Build target: `esnext`
- Enable auto-open in dev mode

**Dependencies:**

- Pin major versions for stability
- React 18.2+ (Hooks, Suspense)
- Vite 5.0+ (fast HMR)
- TanStack Query 5.17+ (async state)
- @mysten/dapp-kit 0.14+ (Sui wallet)
- TypeScript 5.3+ (strict mode)

## 5. Formatting & Linting

- **Prettier:** Standard configuration enforced via `.prettierrc.json`.
- **ESLint:** Strict rules for TypeScript, enforced via `.eslintrc.json`.
- **Scripts:**
  - `pnpm lint`: Run ESLint across the workspace.
  - `pnpm format`: Run Prettier to fix formatting.

## 6. Versioning

- Follow [Semantic Versioning (SemVer)](https://semver.org/).
- Pin critical dependencies in templates to ensure stability (e.g., `"@mysten/walrus": "1.0.0"`).

```

```
