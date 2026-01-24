# Phase 3: Template Base Layer

## Context Links

- [Main Plan](./plan.md)
- [PRD](../../POC/PRD.md)
- [Mysten Walrus SDK Research](../reports/researcher-260117-1353-mysten-walrus-sdk.md)
- [Next.js App Router Research](../reports/researcher-260117-1353-nextjs-app-router.md)
- [Phase 2: CLI Engine Core](./phase-02-cli-engine-core.md)

## Overview

**Created:** 2026-01-17  
**Priority:** High  
**Status:** pending  
**Estimated Effort:** 5 hours  
**Dependencies:** Phase 2 complete

## Key Insights

### From Research

1. **Adapter Pattern Critical**: SDK-agnostic use case layers require unified interface
2. **Base = Skeleton**: Minimal working structure (TypeScript, env config, base deps)
3. **Layer Composition**: Base + SDK + Framework + UseCase = Full app
4. **Environment Variables**: Standardized `.env.example` for all templates

### Adapter Pattern (From SDK Research)

```typescript
// Universal interface - works with ALL SDKs
interface StorageAdapter {
  upload(file: File | Uint8Array): Promise<string>; // Returns Blob ID
  download(blobId: string): Promise<Uint8Array>;
  getMetadata(blobId: string): Promise<BlobMetadata>;
}
```

This decouples use case code from SDK implementation details.

## Requirements

### Functional

- TypeScript project foundation
- Adapter interface definition
- Base environment configuration
- Common utility functions
- Base package.json structure

### Technical

- TypeScript 5.3+ strict mode
- ESM module system
- Cross-platform compatibility
- Zero framework assumptions (pure TS)

### Dependencies

- Phase 2: CLI context structure

## Architecture

### Base Template Structure

```
templates/base/
├── src/
│   ├── adapters/
│   │   └── storage.ts          # StorageAdapter interface
│   ├── types/
│   │   ├── index.ts            # Common types
│   │   └── walrus.ts           # Walrus-specific types
│   └── utils/
│       ├── env.ts              # Environment validation
│       └── format.ts           # Formatting helpers
├── .env.example                # Template env vars
├── .gitignore
├── package.json                # Base dependencies
├── tsconfig.json               # TypeScript config
└── README.md                   # Base documentation
```

### Adapter Interface Design

```typescript
// templates/base/src/adapters/storage.ts

export interface BlobMetadata {
  blobId: string;
  size: number;
  contentType?: string;
  createdAt: number;
}

export interface UploadOptions {
  epochs?: number;
  contentType?: string;
}

export interface StorageAdapter {
  /**
   * Upload data to Walrus and return Blob ID
   */
  upload(data: File | Uint8Array, options?: UploadOptions): Promise<string>;

  /**
   * Download blob data by ID
   */
  download(blobId: string): Promise<Uint8Array>;

  /**
   * Get blob metadata
   */
  getMetadata(blobId: string): Promise<BlobMetadata>;

  /**
   * Check if blob exists
   */
  exists(blobId: string): Promise<boolean>;
}
```

### Base Types

```typescript
// templates/base/src/types/walrus.ts

export type WalrusNetwork = 'testnet' | 'mainnet';

export interface WalrusConfig {
  network: WalrusNetwork;
  publisherUrl: string;
  aggregatorUrl: string;
  suiRpcUrl: string;
}

export interface BlobInfo {
  blobId: string;
  name: string;
  size: number;
  uploadedAt: number;
}
```

### Environment Configuration

```bash
# templates/base/.env.example

## REQUIRED - Walrus Network
VITE_WALRUS_NETWORK=testnet
VITE_WALRUS_AGGREGATOR=https://aggregator.walrus-testnet.walrus.space
VITE_WALRUS_PUBLISHER=https://publisher.walrus-testnet.walrus.space

## REQUIRED - Sui Network
VITE_SUI_NETWORK=testnet
VITE_SUI_RPC=https://fullnode.testnet.sui.io:443

## OPTIONAL - Analytics
VITE_BLOCKBERRY_KEY=
```

### Base package.json

```json
{
  "name": "walrus-app-base",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "echo 'Framework layer will override this'",
    "build": "echo 'Framework layer will override this'",
    "lint": "eslint . --ext .ts,.tsx"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "eslint": "^8.56.0",
    "@typescript-eslint/parser": "^6.19.0",
    "@typescript-eslint/eslint-plugin": "^6.19.0"
  }
}
```

## Related Code Files

### To Create

1. `templates/base/src/adapters/storage.ts` - Adapter interface
2. `templates/base/src/types/index.ts` - Common types
3. `templates/base/src/types/walrus.ts` - Walrus types
4. `templates/base/src/utils/env.ts` - Environment validation
5. `templates/base/src/utils/format.ts` - Formatting helpers
6. `templates/base/.env.example` - Environment template
7. `templates/base/.gitignore` - Git exclusions
8. `templates/base/package.json` - Base dependencies
9. `templates/base/tsconfig.json` - TypeScript config
10. `templates/base/README.md` - Documentation

## Implementation Steps

### Step 1: Create Base Directory (15 min)

1. Create structure:

```bash
cd templates
mkdir -p base/{src/{adapters,types,utils},.vscode}
```

### Step 2: Adapter Interface (45 min)

2. Create `base/src/adapters/storage.ts`:

```typescript
/**
 * Universal storage adapter interface for Walrus
 *
 * This interface abstracts SDK-specific implementations,
 * allowing use case layers to work with any Walrus SDK.
 */

export interface BlobMetadata {
  blobId: string;
  size: number;
  contentType?: string;
  createdAt: number;
  expiresAt?: number;
}

export interface UploadOptions {
  /** Number of epochs to store (Walrus-specific) */
  epochs?: number;
  /** MIME type of the content */
  contentType?: string;
}

export interface DownloadOptions {
  /** Byte range (for large files) */
  range?: { start: number; end: number };
}

export interface StorageAdapter {
  /**
   * Upload data to Walrus storage
   * @param data - File or raw bytes to upload
   * @param options - Upload configuration
   * @returns Blob ID (permanent reference)
   */
  upload(data: File | Uint8Array, options?: UploadOptions): Promise<string>;

  /**
   * Download blob data by ID
   * @param blobId - Unique blob identifier
   * @param options - Download configuration
   * @returns Raw blob data
   */
  download(blobId: string, options?: DownloadOptions): Promise<Uint8Array>;

  /**
   * Get blob metadata without downloading content
   * @param blobId - Unique blob identifier
   * @returns Metadata object
   */
  getMetadata(blobId: string): Promise<BlobMetadata>;

  /**
   * Check if blob exists
   * @param blobId - Unique blob identifier
   * @returns True if blob is accessible
   */
  exists(blobId: string): Promise<boolean>;
}
```

### Step 3: Type Definitions (30 min)

3. Create `base/src/types/walrus.ts`:

```typescript
export type WalrusNetwork = 'testnet' | 'mainnet' | 'devnet';

export interface WalrusConfig {
  network: WalrusNetwork;
  publisherUrl: string;
  aggregatorUrl: string;
  suiRpcUrl: string;
}

export interface BlobInfo {
  blobId: string;
  name?: string;
  size: number;
  contentType?: string;
  uploadedAt: number;
}

export interface StorageStats {
  totalBlobs: number;
  totalSize: number;
  usedEpochs: number;
}
```

4. Create `base/src/types/index.ts`:

```typescript
export * from './walrus.js';

export interface Result<T, E = Error> {
  success: boolean;
  data?: T;
  error?: E;
}

export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;
```

### Step 4: Utility Functions (45 min)

5. Create `base/src/utils/env.ts`:

```typescript
export interface EnvConfig {
  walrusNetwork: string;
  walrusAggregator: string;
  walrusPublisher: string;
  suiNetwork: string;
  suiRpc: string;
  blockberryKey?: string;
}

export function loadEnv(): EnvConfig {
  const getEnv = (key: string, required = true): string => {
    const value = import.meta.env[key];
    if (required && !value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value || '';
  };

  return {
    walrusNetwork: getEnv('VITE_WALRUS_NETWORK'),
    walrusAggregator: getEnv('VITE_WALRUS_AGGREGATOR'),
    walrusPublisher: getEnv('VITE_WALRUS_PUBLISHER'),
    suiNetwork: getEnv('VITE_SUI_NETWORK'),
    suiRpc: getEnv('VITE_SUI_RPC'),
    blockberryKey: getEnv('VITE_BLOCKBERRY_KEY', false),
  };
}

export function validateEnv(config: EnvConfig): void {
  if (!['testnet', 'mainnet', 'devnet'].includes(config.walrusNetwork)) {
    throw new Error(`Invalid WALRUS_NETWORK: ${config.walrusNetwork}`);
  }

  if (!config.walrusAggregator.startsWith('http')) {
    throw new Error('WALRUS_AGGREGATOR must be a valid HTTP URL');
  }

  if (!config.walrusPublisher.startsWith('http')) {
    throw new Error('WALRUS_PUBLISHER must be a valid HTTP URL');
  }
}
```

6. Create `base/src/utils/format.ts`:

```typescript
/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format blob ID for display (truncate middle)
 */
export function formatBlobId(blobId: string, length = 12): string {
  if (blobId.length <= length) return blobId;

  const part = Math.floor((length - 3) / 2);
  return `${blobId.slice(0, part)}...${blobId.slice(-part)}`;
}

/**
 * Format timestamp to locale string
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}
```

### Step 5: Configuration Files (1 hour)

7. Create `base/.env.example`:

```bash
## ==============================================
## Walrus Application - Environment Configuration
## ==============================================

## WALRUS NETWORK SETTINGS
## Network: testnet | mainnet | devnet
VITE_WALRUS_NETWORK=testnet

## Walrus Aggregator URL (for downloads)
VITE_WALRUS_AGGREGATOR=https://aggregator.walrus-testnet.walrus.space

## Walrus Publisher URL (for uploads)
VITE_WALRUS_PUBLISHER=https://publisher.walrus-testnet.walrus.space

## SUI BLOCKCHAIN SETTINGS
## Sui Network: testnet | mainnet | devnet
VITE_SUI_NETWORK=testnet

## Sui RPC URL (for wallet interactions)
VITE_SUI_RPC=https://fullnode.testnet.sui.io:443

## OPTIONAL FEATURES
## Blockberry Analytics API Key (leave empty to disable)
VITE_BLOCKBERRY_KEY=

## ==============================================
## PREREQUISITES
## ==============================================
## 1. Install Sui Wallet browser extension
## 2. Get testnet SUI from faucet: https://faucet.testnet.sui.io/
## 3. Copy this file to .env and fill in any optional values
```

8. Create `base/.gitignore`:

```
# Dependencies
node_modules/
.pnpm-debug.log

# Environment
.env
.env.local
.env.*.local

# Build outputs
dist/
build/
*.tsbuildinfo

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Test
coverage/
```

9. Create `base/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["vite/client"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

10. Create `base/package.json`:

```json
{
  "name": "walrus-app-base",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "echo 'Override by framework layer'",
    "build": "echo 'Override by framework layer'",
    "preview": "echo 'Override by framework layer'",
    "lint": "eslint . --ext .ts,.tsx",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "eslint": "^8.56.0",
    "@typescript-eslint/parser": "^6.19.1",
    "@typescript-eslint/eslint-plugin": "^6.19.1"
  }
}
```

### Step 6: Documentation (45 min)

11. Create `base/README.md`:

```markdown
# Walrus Application Base Layer

This is the **foundation layer** for all Walrus applications generated by `create-walrus-app`.

## What's Included

### Adapter Interface

- `src/adapters/storage.ts` - Universal SDK-agnostic interface
- Allows use case code to work with any Walrus SDK

### Type Definitions

- `src/types/walrus.ts` - Walrus-specific types
- `src/types/index.ts` - Common utility types

### Utilities

- `src/utils/env.ts` - Environment validation
- `src/utils/format.ts` - Formatting helpers

### Configuration

- `.env.example` - Environment template
- `tsconfig.json` - TypeScript strict mode config
- `package.json` - Base dependencies

## Layer Composition

This base layer is **always included** and combined with:

1. **SDK Layer** (e.g., `sdk-mysten/`) - Implements `StorageAdapter`
2. **Framework Layer** (e.g., `react/`) - UI framework setup
3. **Use Case Layer** (e.g., `simple-upload/`) - Application logic
```

Base + SDK + Framework + UseCase = Your App

```

## Environment Setup

1. Copy `.env.example` to `.env`
2. Fill in required values:
   - Walrus network URLs
   - Sui RPC endpoint
3. Optional: Add Blockberry API key

## Next Steps

This base layer is completed by:
- **Phase 4**: SDK implementation
- **Phase 5**: Framework setup
- **Phase 6**: Use case logic
```

### Step 7: Validation (30 min)

12. Create test script to validate base layer:

```bash
# In packages/cli/src/test-base.ts (temporary)
import fs from 'fs-extra';
import path from 'node:path';

const basePath = path.join(process.cwd(), '../../templates/base');

// Check all required files exist
const requiredFiles = [
  'src/adapters/storage.ts',
  'src/types/walrus.ts',
  'src/types/index.ts',
  'src/utils/env.ts',
  'src/utils/format.ts',
  '.env.example',
  '.gitignore',
  'package.json',
  'tsconfig.json',
  'README.md'
];

for (const file of requiredFiles) {
  const fullPath = path.join(basePath, file);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required file: ${file}`);
  }
}

console.log('✓ Base layer validation passed!');
```

## Todo List

- [ ] Create `templates/base/` directory structure
- [ ] Write `src/adapters/storage.ts` interface
- [ ] Write `src/types/walrus.ts` types
- [ ] Write `src/types/index.ts` exports
- [ ] Write `src/utils/env.ts` validation
- [ ] Write `src/utils/format.ts` helpers
- [ ] Write `.env.example` template
- [ ] Write `.gitignore` rules
- [ ] Write `tsconfig.json` config
- [ ] Write `package.json` base deps
- [ ] Write `README.md` documentation
- [ ] Create validation test script
- [ ] Run validation tests

## Success Criteria

### Structural Tests

- [ ] All 10 required files exist
- [ ] Directory structure matches spec
- [ ] TypeScript files have valid syntax
- [ ] JSON files parse correctly

### Interface Tests

- [ ] `StorageAdapter` has all required methods
- [ ] Type exports work correctly
- [ ] Utility functions are importable

### Documentation Tests

- [ ] `.env.example` has all required variables
- [ ] README explains layer composition
- [ ] Comments explain adapter pattern

### Integration Tests

```typescript
// Test that adapter can be imported
import type { StorageAdapter } from './templates/base/src/adapters/storage.js';

// Test that types work
import type { WalrusConfig } from './templates/base/src/types/walrus.js';

// Test utilities
import { formatBytes, loadEnv } from './templates/base/src/utils';
```

## Risk Assessment

### Potential Blockers

1. **Interface too rigid**: Doesn't accommodate all SDKs
   - **Mitigation**: Design based on common denominator of 3 SDKs
2. **Type conflicts**: SDK types don't match base types
   - **Mitigation**: Use adapter pattern to translate
3. **Environment validation fails**: Different SDK requirements
   - **Mitigation**: Make validation overridable per SDK

### Contingency Plans

- If adapter interface insufficient: Add optional methods
- If env validation conflicts: Move to SDK layer

## Security Considerations

### Phase-Specific Concerns

1. **Environment variable exposure**: Secrets in `.env`
   - **Hardening**: Clear docs on VITE\_ prefix (public vars)
2. **Type validation**: Runtime type safety
   - **Hardening**: Use Zod or similar for runtime validation (future)

### Best Practices

- Never commit `.env` files
- Use `VITE_` prefix for public vars (Vite convention)
- Validate all environment variables at startup
- Provide clear error messages for missing config

## Next Steps

After Phase 3 completion:

1. **Phase 4**: Implement @mysten/walrus SDK layer (implements `StorageAdapter`)
2. **Phase 5**: Create React framework layer
3. **Phase 6**: Build use case templates (consume adapter)

### Dependencies for Next Phase

Phase 4 requires:

- `StorageAdapter` interface ✅
- Walrus types ✅
- Environment structure ✅

### Open Questions

- Should we add logger interface to base? (Decision: Yes, add in Phase 4)
- Support for custom adapters? (Decision: Yes, document pattern)
