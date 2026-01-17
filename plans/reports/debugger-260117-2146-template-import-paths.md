# Template Import Paths Root Cause Analysis

**Date:** 2026-01-17
**Agent:** debugger (aa72b68)
**Issue:** Vite import resolution errors in CLI-generated projects

## Executive Summary

Template files contain relative cross-layer imports (`../../../react/src/...`) that are valid in the monorepo but break when templates are copied to standalone projects. Generated projects fail to build because these paths don't exist outside the monorepo structure.

**Root Cause:** Templates reference other template layers via relative paths instead of using local relative imports within the generated project structure.

**Impact:** All projects generated via `create-walrus-app` CLI fail to build with Vite import resolution errors.

## Template Architecture

The CLI uses a layered template system where layers are merged sequentially:

1. **base** - Core utilities, types, adapters (priority 1)
2. **sdk-{name}** - SDK-specific implementations (priority 2)
3. **{framework}** - Framework-specific code (priority 3)
4. **{use-case}** - Use case templates (priority 4)
5. **tailwind** - Optional Tailwind layer (priority 5)
6. **analytics** - Optional analytics layer (priority 6)

Layers are copied sequentially to target directory, with later layers overriding earlier ones.

## Affected Template Files

### Simple-Upload Template

**File:** `packages/cli/templates/simple-upload/src/components/FilePreview.tsx`
- **Line 2:** `import { useDownload } from '../../../react/src/hooks/useStorage.js';`
- **Should be:** `import { useDownload } from '../hooks/useStorage.js';`

**File:** `packages/cli/templates/simple-upload/src/components/UploadForm.tsx`
- **Line 2:** `import { useUpload } from '../../../react/src/hooks/useStorage.js';`
- **Should be:** `import { useUpload } from '../hooks/useStorage.js';`

### Gallery Template

**File:** `packages/cli/templates/gallery/src/components/FileCard.tsx`
- **Line 1:** `import { formatBytes, formatDate } from '../../../base/src/utils/format.js';`
- **Should be:** `import { formatBytes, formatDate } from '../utils/format.js';`

**File:** `packages/cli/templates/gallery/src/components/UploadModal.tsx`
- **Line 2:** `import { useUpload } from '../../../react/src/hooks/useStorage.js';`
- **Should be:** `import { useUpload } from '../hooks/useStorage.js';`

### React Template (Layer Files)

**File:** `packages/cli/templates/react/src/index.ts`
- **Line 2:** `export { storageAdapter } from '../../sdk-mysten/src/index.js';`
- **Line 10:** Re-exports from `'../../base/src/adapters/storage.js'`
- **Should export from:** Local merged files after layer merge

### SDK-Mysten Template

**File:** `packages/cli/templates/sdk-mysten/src/index.ts`
- **Line 11:** `} from '../../base/src/adapters/storage.js';`
- **Should be:** `} from './adapters/storage.js';` (after base layer is merged)

**File:** `packages/cli/templates/sdk-mysten/src/config.ts`
- **Line 1:** `import type { WalrusNetwork } from '../../base/src/types/walrus.js';`
- **Should be:** `import type { WalrusNetwork } from '../types/walrus.js';`

**File:** `packages/cli/templates/sdk-mysten/src/client.ts`
- **Line 3:** `import { loadEnv } from '../../base/src/utils/env.js';`
- **Line 5:** `import type { WalrusNetwork } from '../../base/src/types/walrus.js';`
- **Should be:** `import { loadEnv } from '../utils/env.js';`
- **Should be:** `import type { WalrusNetwork } from '../types/walrus.js';`

**File:** `packages/cli/templates/sdk-mysten/src/adapter.ts`
- **Line 6:** `} from '../../base/src/adapters/storage.js';`
- **Should be:** `} from '../adapters/storage.js';`

## Current vs Correct Import Patterns

### Pattern 1: React Hooks (simple-upload, gallery)

**Current (INCORRECT):**
```typescript
import { useUpload, useDownload } from '../../../react/src/hooks/useStorage.js';
```

**Correct:**
```typescript
import { useUpload, useDownload } from '../hooks/useStorage.js';
```

**Reason:** React layer merges `useStorage.ts` into `src/hooks/` directory in final project.

### Pattern 2: Base Utils (gallery FileCard)

**Current (INCORRECT):**
```typescript
import { formatBytes, formatDate } from '../../../base/src/utils/format.js';
```

**Correct:**
```typescript
import { formatBytes, formatDate } from '../utils/format.js';
```

**Reason:** Base layer merges `format.ts` into `src/utils/` directory in final project.

### Pattern 3: Cross-Layer SDK Imports

**Current (INCORRECT):**
```typescript
// In react/src/index.ts
export { storageAdapter } from '../../sdk-mysten/src/index.js';

// In sdk-mysten/src files
import { StorageAdapter } from '../../base/src/adapters/storage.js';
import type { WalrusNetwork } from '../../base/src/types/walrus.js';
```

**Correct:**
```typescript
// In react/src/index.ts
export { storageAdapter } from '../adapters/storage.js';

// In sdk-mysten/src files
import { StorageAdapter } from '../adapters/storage.js';
import type { WalrusNetwork } from '../types/walrus.js';
```

**Reason:** After layer merge, all base files exist in `src/` directory structure.

### Pattern 4: Layout Component (simple-upload, gallery)

**Current (CORRECT):**
```typescript
import { Layout } from './components/Layout.js';
```

**Status:** ✓ Already correct - imports from local components folder after react layer merge.

## File Structure After Layer Merge

When layers are merged for a `react` + `simple-upload` project:

```
generated-project/
├── src/
│   ├── adapters/
│   │   └── storage.ts           (from base layer)
│   ├── components/
│   │   ├── Layout.tsx           (from react layer)
│   │   ├── WalletConnect.tsx    (from react layer)
│   │   ├── FilePreview.tsx      (from simple-upload layer)
│   │   └── UploadForm.tsx       (from simple-upload layer)
│   ├── hooks/
│   │   ├── useStorage.ts        (from react layer)
│   │   └── useWallet.ts         (from react layer)
│   ├── providers/
│   │   ├── QueryProvider.tsx    (from react layer)
│   │   └── WalletProvider.tsx   (from react layer)
│   ├── types/
│   │   ├── index.ts             (from base layer)
│   │   └── walrus.ts            (from base layer)
│   ├── utils/
│   │   ├── env.ts               (from base layer)
│   │   └── format.ts            (from base layer)
│   ├── App.tsx                  (from simple-upload layer)
│   ├── main.tsx                 (from react layer)
│   └── index.ts                 (from react layer)
└── package.json                 (merged from all layers)
```

All imports must reference this final merged structure, not the monorepo template structure.

## Configuration Files Analysis

### Package.json Files

**simple-upload/package.json:**
- Nearly empty (only name/version placeholders)
- Dependencies merged from other layers

**gallery/package.json:**
- Nearly empty (only name/version placeholders)
- Dependencies merged from other layers

**react/package.json:**
- Contains main dependencies (react, @tanstack/react-query, @mysten/dapp-kit)
- Has build scripts (vite, tsc)
- **Status:** ✓ No changes needed

**base/package.json:**
- Contains devDependencies (typescript, eslint)
- **Status:** ✓ No changes needed

**sdk-mysten/package.json:**
- Contains SDK dependencies (@mysten/walrus, @mysten/sui)
- **Status:** ✓ No changes needed

### TypeScript Configuration

No tsconfig changes needed - imports are resolved via relative paths, not path aliases.

## Summary of Required Fixes

### Files Requiring Import Path Updates

1. `packages/cli/templates/simple-upload/src/components/FilePreview.tsx` (1 import)
2. `packages/cli/templates/simple-upload/src/components/UploadForm.tsx` (1 import)
3. `packages/cli/templates/gallery/src/components/FileCard.tsx` (1 import)
4. `packages/cli/templates/gallery/src/components/UploadModal.tsx` (1 import)
5. `packages/cli/templates/react/src/index.ts` (2 imports)
6. `packages/cli/templates/sdk-mysten/src/index.ts` (1 import)
7. `packages/cli/templates/sdk-mysten/src/config.ts` (1 import)
8. `packages/cli/templates/sdk-mysten/src/client.ts` (2 imports)
9. `packages/cli/templates/sdk-mysten/src/adapter.ts` (1 import)

**Total:** 9 files, 11 import statements

### Import Pattern Corrections

| Current Pattern | Correct Pattern | Reason |
|----------------|-----------------|--------|
| `../../../react/src/hooks/useStorage.js` | `../hooks/useStorage.js` | React layer merges hooks to src/hooks |
| `../../../base/src/utils/format.js` | `../utils/format.js` | Base layer merges utils to src/utils |
| `../../sdk-mysten/src/index.js` | `./index.js` or local equivalent | SDK layer content merged locally |
| `../../base/src/adapters/storage.js` | `../adapters/storage.js` | Base layer merges to src/adapters |
| `../../base/src/types/walrus.js` | `../types/walrus.js` | Base layer merges to src/types |
| `../../base/src/utils/env.js` | `../utils/env.js` | Base layer merges to src/utils |

## Prevention Strategy

### Root Cause
Templates were written with monorepo-relative imports instead of considering the final merged project structure.

### Prevention Measures
1. Add E2E test that builds generated projects (not just generates them)
2. Add import path validation in template linter
3. Document layer merge behavior for template authors
4. Add pre-publish validation that checks for cross-layer imports

## Unresolved Questions

1. Are there other SDK templates (tusky, hibernuts)? Only `sdk-mysten` found.
2. Should `react/src/index.ts` re-exports be removed entirely if files are merged?
3. Do any templates use path aliases in tsconfig that also need adjustment?
4. Are there use-case templates beyond simple-upload and gallery with similar issues?
