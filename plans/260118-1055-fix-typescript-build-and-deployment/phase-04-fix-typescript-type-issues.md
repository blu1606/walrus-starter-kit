# Phase 04: Fix TypeScript Type Issues

**Priority:** P2
**Status:** Pending (Blocked by Phases 1-3)
**Effort:** 1h

## Context Links

- **Diagnostic Report:** [Error Categories](../../plans/reports/debugger-260118-1038-typescript-build-errors.md#error-categories-user-reported)
- **Dependency Fix:** [Phase 01 - Update Dependencies](phase-01-update-mysten-dependencies.md)

## Overview

Fix remaining TypeScript type errors after dependency conflicts resolved. These errors are currently masked by missing vite types and version conflicts.

**User-Reported Error Categories:**
1. Uint8Array & BlobPart type incompatibilities with Blob constructor
2. unknown & ReactNode type issues from hooks
3. Missing .walrus property on SuiClient until extended

**Why Blocked:** Cannot see actual TS errors until vite types available and @mysten/sui versions aligned.

## Key Insights

**Category A: Uint8Array/Blob Issues**
```typescript
// Suspected error pattern:
const fileData = new Uint8Array(buffer);
const blob = new Blob([fileData], { type: 'application/octet-stream' });
// Error: Type 'Uint8Array' is not assignable to type 'BlobPart'
```

**Root Cause:** TypeScript strict mode + DOM lib version mismatch
**Location:** File handling code in walrus adapters

**Category B: Hook Return Types**
```typescript
// Suspected error pattern:
export function useUpload() {
  const [data, setData] = useState();  // Type: unknown
  return { data };  // Error: Type 'unknown' not assignable to expected type
}
```

**Root Cause:** Missing explicit return type annotations
**Location:** Custom React hooks

**Category C: Extended Client Types**
```typescript
// Suspected error pattern:
const client = suiClient.$extend(walrus({...}));
client.walrus.store(data);  // Error: Property 'walrus' does not exist
```

**Root Cause:** Type augmentation needed for runtime extension
**Location:** Walrus client initialization

## Requirements

### Functional
- All TypeScript errors must be resolved
- Type safety preserved (no `any` escape hatches)
- IntelliSense works correctly for Walrus SDK
- Hook return types properly inferred

### Non-Functional
- Maintain strict TypeScript settings
- Add type tests to prevent regressions
- Document type patterns for future developers
- Performance: Zero runtime overhead from type fixes

## Architecture

**Type Definition Strategy:**

```
Base Types (@mysten/sui, @mysten/walrus)
  ↓
Extended Types (module augmentation)
  ↓
Application Types (hooks, utilities)
  ↓
Component Props (React components)
```

**Files Requiring Type Fixes:**
1. Extended client types (global.d.ts or walrus.d.ts)
2. Hook return types (use-upload.ts, use-wallet.ts, use-enoki-auth.ts)
3. File handling utilities (walrus/adapter.ts)

## Related Code Files

### Files to Investigate (After Dependencies Fixed)

**Walrus SDK Integration:**
- `packages/cli/presets/*/src/lib/walrus/client.ts`
- `packages/cli/presets/*/src/lib/walrus/adapter.ts`

**React Hooks:**
- `packages/cli/presets/*/src/hooks/use-upload.ts`
- `packages/cli/presets/*/src/hooks/use-wallet.ts`
- `packages/cli/presets/react-mysten-simple-upload-enoki/src/hooks/use-enoki-auth.ts`

### Files to Create

**Type Declarations:**
- `packages/cli/templates/react/src/types/walrus.d.ts`
- `packages/cli/templates/react/src/types/global.d.ts`

## Implementation Steps

### Step 1: Complete Dependencies and Run Build (10m)

**Prerequisites check:**
```bash
# Ensure Phase 01 complete
cd /tmp/test-deps
pnpm install
pnpm list @mysten/sui
# MUST: Show single version 1.45.2

# Run build to see actual TypeScript errors
pnpm build 2>&1 | tee typescript-errors.log
```

**Capture errors to:** `research/phase04-typescript-errors-after-deps-fix.md`

### Step 2: Fix Extended Client Types (15m)

**Create type declaration file:**

**File:** `src/types/walrus.d.ts`

```typescript
/**
 * Type augmentation for Walrus-extended SuiClient
 */

import type { SuiClient } from '@mysten/sui/client';
import type { WalrusClient } from '@mysten/walrus';

declare module '@mysten/sui/client' {
  interface SuiClient {
    /**
     * Walrus extension providing decentralized storage capabilities
     *
     * Available after calling: suiClient.$extend(walrus({...}))
     *
     * @example
     * const client = suiClient.$extend(walrus({ config }));
     * const blobId = await client.walrus.store(data);
     */
    walrus: WalrusClient;
  }
}
```

**Add to tsconfig.json:**
```json
{
  "compilerOptions": {
    "types": ["vite/client"],
    "typeRoots": ["./src/types", "./node_modules/@types"]
  }
}
```

### Step 3: Fix Uint8Array/Blob Type Issues (15m)

**Identify affected code:**
```bash
grep -r "new Blob" packages/cli/presets/*/src/
grep -r "Uint8Array" packages/cli/presets/*/src/
```

**Fix pattern A: Explicit BlobPart typing**
```typescript
// Before (error)
const fileData = new Uint8Array(buffer);
const blob = new Blob([fileData], { type: 'application/octet-stream' });

// After (fixed)
const fileData = new Uint8Array(buffer);
const blob = new Blob([fileData as BlobPart], { type: 'application/octet-stream' });

// OR (better - update lib in tsconfig.json)
// tsconfig.json: "lib": ["ES2020", "DOM", "DOM.Iterable"]
```

**Fix pattern B: Use type guard**
```typescript
function isBlobPart(value: unknown): value is BlobPart {
  return value instanceof Blob
    || value instanceof ArrayBuffer
    || value instanceof Uint8Array
    || typeof value === 'string';
}

const parts: BlobPart[] = data.filter(isBlobPart);
const blob = new Blob(parts, { type: 'application/octet-stream' });
```

### Step 4: Fix Hook Return Types (15m)

**Pattern A: Explicit return type annotation**
```typescript
// Before (error - implicit unknown)
export function useUpload() {
  const [data, setData] = useState();
  const [error, setError] = useState();
  return { data, error, upload };
}

// After (fixed)
interface UseUploadReturn {
  data: UploadResult | null;
  error: Error | null;
  upload: (file: File) => Promise<void>;
  isUploading: boolean;
}

export function useUpload(): UseUploadReturn {
  const [data, setData] = useState<UploadResult | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function upload(file: File): Promise<void> {
    // ... implementation
  }

  return { data, error, upload, isUploading };
}
```

**Pattern B: Generic hooks**
```typescript
export function useFetch<T>(url: string): {
  data: T | null;
  error: Error | null;
  loading: boolean;
} {
  const [data, setData] = useState<T | null>(null);
  // ...
  return { data, error, loading };
}
```

**Files to update:**
- `src/hooks/use-upload.ts` → Add `UseUploadReturn` interface
- `src/hooks/use-wallet.ts` → Add `UseWalletReturn` interface
- `src/hooks/use-enoki-auth.ts` → Add `UseEnokiAuthReturn` interface

### Step 5: Fix ReactNode Type Issues (10m)

**Pattern: Component return types**
```typescript
// Before (error in some cases)
export function Component({ children }) {
  return <div>{children}</div>;
}

// After (fixed)
import { ReactNode } from 'react';

interface ComponentProps {
  children?: ReactNode;
}

export function Component({ children }: ComponentProps): ReactNode {
  return <div>{children}</div>;
}
```

**Check components with children props:**
```bash
grep -r "children" packages/cli/presets/*/src/components/
```

### Step 6: Add Type Tests (10m)

**Create type test file:**

**File:** `src/types/__tests__/walrus-types.test-d.ts`

```typescript
/**
 * Type tests - compile-time only, never executed
 * Uses expectType pattern from tsd or vitest
 */

import { expectType } from 'vitest';
import type { SuiClient } from '@mysten/sui/client';
import { walrus } from '@mysten/walrus';

// Test: Extended client has walrus property
const client = {} as SuiClient;
const extended = client.$extend(walrus({ /* config */ }));
expectType<WalrusClient>(extended.walrus);

// Test: Hook return types
import { useUpload } from '../hooks/use-upload';
const uploadResult = useUpload();
expectType<UploadResult | null>(uploadResult.data);
expectType<Error | null>(uploadResult.error);
expectType<(file: File) => Promise<void>>(uploadResult.upload);
```

**Add to package.json:**
```json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "test:types": "tsc --noEmit && vitest typecheck"
  }
}
```

## Todo List

- [ ] Verify Phase 01 dependencies complete
- [ ] Scaffold fresh project outside workspace
- [ ] Run build and capture TypeScript errors
- [ ] Document actual errors in research/phase04-typescript-errors-after-deps-fix.md
- [ ] Create src/types/walrus.d.ts
- [ ] Add SuiClient module augmentation
- [ ] Update tsconfig.json typeRoots
- [ ] Find all "new Blob" usages
- [ ] Fix Uint8Array → BlobPart type issues
- [ ] Update tsconfig.json lib settings if needed
- [ ] Add explicit return types to use-upload.ts
- [ ] Add explicit return types to use-wallet.ts
- [ ] Add explicit return types to use-enoki-auth.ts
- [ ] Fix ReactNode type issues in components
- [ ] Create type test file
- [ ] Add type-check script to package.json
- [ ] Run pnpm type-check (must pass)
- [ ] Run pnpm build (must pass)
- [ ] Copy type fixes to all preset templates
- [ ] Test type fixes in development mode

## Success Criteria

### TypeScript Compilation
```bash
cd /tmp/test-types
pnpm build
# MUST: Exit code 0, no TypeScript errors
```

### Type Checking
```bash
pnpm type-check
# MUST: "Found 0 errors"
```

### IntelliSense Verification
```typescript
// In IDE, type this:
const client = suiClient.$extend(walrus({...}));
client.walrus.  // <-- IntelliSense MUST show WalrusClient methods
```

### Hook Type Inference
```typescript
// In IDE, hover over result:
const result = useUpload();
// MUST show: { data: UploadResult | null; error: Error | null; ... }
// NOT: { data: unknown; error: unknown; ... }
```

### No 'any' Escape Hatches
```bash
# Should return zero matches (or only intentional any)
grep -r ": any" src/
grep -r "as any" src/
# MUST: No unintended 'any' usage
```

## Risk Assessment

**Low Risk:**
- Type assertions may hide subtle bugs
- **Mitigation:** Use type guards instead of assertions where possible

**Low Risk:**
- Type definitions may not match runtime behavior
- **Mitigation:** Add runtime validation + type tests

**Low Risk:**
- Future SDK updates may break type definitions
- **Mitigation:** Version type definitions with SDK version, add CI type checks

## Security Considerations

**Type Safety:**
- Avoid `as any` casts (security bypass)
- Use type guards for runtime validation
- Validate external data with Zod/Yup schemas

**Example secure pattern:**
```typescript
import { z } from 'zod';

const UploadResultSchema = z.object({
  blobId: z.string(),
  size: z.number(),
  url: z.string().url()
});

type UploadResult = z.infer<typeof UploadResultSchema>;

function parseUploadResult(data: unknown): UploadResult {
  return UploadResultSchema.parse(data);  // Throws if invalid
}
```

## Next Steps

**Immediate:**
- Phase 05: Testing protocol (final validation)

**Follow-up:**
- Add runtime type validation with Zod
- Create type documentation for developers
- Add type coverage reporting

## Unresolved Questions

1. Should we use strict mode or allow some flexibility?
2. What is the minimum TypeScript version supported?
3. Should we use `@ts-expect-error` for known SDK issues?
4. How do we handle type changes in @mysten/walrus updates?
5. Should we publish shared type definitions as separate package?
