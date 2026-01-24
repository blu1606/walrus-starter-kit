# Phase 1: Fix Import Paths in sdk-mysten Template

## Context

- **Priority**: P0 (Critical - Blocks all generated projects)
- **Status**: ✅ DONE
- **Completed**: 2026-01-17T23:54:00+07:00
- **Effort**: 1 hour
- **Related Report**: [Template Structure Analysis](../260117-2305-fix-template-bugs/research/researcher-template-structure.md)

## Overview

Templates in `packages/cli/templates/sdk-mysten/src/` use incorrect relative imports (`../`) assuming monorepo structure. After flattening during generation, these paths break. All imports should use `./` for same-directory references.

## Key Insights

- Root cause: Templates designed with monorepo structure in mind
- Impact: 100% of generated projects fail to compile
- Files affected: `client.ts`, `adapter.ts`, `config.ts`, `index.ts`
- Pattern: All `../` paths should become `./` paths

## Requirements

### Functional
- Update all import paths to use correct relative paths
- Maintain module resolution after template flattening
- Preserve TypeScript type imports

### Non-Functional
- No impact on generated project structure
- Changes isolated to sdk-mysten layer
- Backwards compatible with existing base layer

## Architecture

### Current (Broken) Structure
```
packages/cli/templates/sdk-mysten/src/
├── client.ts         // Imports from ../utils, ../types
├── adapter.ts        // Imports from ../adapters
├── config.ts         // Imports from ../types
└── index.ts          // Exports from ../adapters
```

### After Flattening (Generated Project)
```
my-project/src/
├── client.ts         // Same directory level
├── adapter.ts
├── config.ts
├── index.ts
├── utils/
├── types/
└── adapters/
```

## Related Code Files

### Files to Modify
1. `packages/cli/templates/sdk-mysten/src/client.ts`
2. `packages/cli/templates/sdk-mysten/src/adapter.ts`
3. `packages/cli/templates/sdk-mysten/src/config.ts`
4. `packages/cli/templates/sdk-mysten/src/index.ts`

### Files to Verify (Not Modified)
- `packages/cli/templates/base/src/types/walrus.ts`
- `packages/cli/templates/base/src/utils/env.ts`
- `packages/cli/templates/base/src/adapters/storage.ts`

## Implementation Steps

### Step 1: Fix client.ts Imports
```typescript
// BEFORE
import { loadEnv } from '../utils/env.js';
import type { WalrusConfig } from '../types/walrus.js';

// AFTER
import { loadEnv } from './utils/env.js';
import type { WalrusConfig } from './types/walrus.js';
```

### Step 2: Fix adapter.ts Imports
```typescript
// BEFORE
import { WalrusStorageAdapter } from '../adapters/storage.js';

// AFTER
import { WalrusStorageAdapter } from './adapters/storage.js';
```

### Step 3: Fix config.ts Imports
```typescript
// BEFORE
import type { WalrusConfig } from '../types/walrus.js';

// AFTER
import type { WalrusConfig } from './types/walrus.js';
```

### Step 4: Fix index.ts Exports
```typescript
// BEFORE
export { storageAdapter } from '../adapters/storage.js';

// AFTER
export { storageAdapter } from './adapter.js';
```

### Step 5: Verify Generated Project
- Generate test project: `pnpm create walrus-app test-import-fix --sdk mysten --framework react --use-case simple-upload`
- Run TypeScript check: `cd test-import-fix && pnpm install && pnpm tsc --noEmit`
- Verify no module resolution errors

## Todo List

- [x] Read current client.ts implementation
- [x] Update client.ts import paths
- [x] Read current adapter.ts implementation
- [x] Update adapter.ts import paths
- [x] Read current config.ts implementation
- [x] Update config.ts import paths
- [x] Read current index.ts implementation
- [x] Update index.ts export paths
- [x] Generate test project to verify changes
- [x] Run TypeScript compilation check
- [x] Document changes in phase completion report

**Completion Notes:**
- Fixed 4 template files: client.ts, adapter.ts, config.ts, index.ts
- Changed all `../` imports to `./` for same-directory references
- TypeScript compilation passed with no module resolution errors
- Code review score: 10/10 approved
- Verification: All imports now correctly resolve in flattened structure

## Success Criteria

- [x] All imports use `./` for same-directory references
- [x] Generated project compiles without module resolution errors
- [x] No TypeScript errors in sdk-mysten layer
- [x] Test project `pnpm tsc --noEmit` passes

## Risk Assessment

**Risks**:
- May affect other template layers if they import from sdk-mysten
- Potential cascade effects on React/Vue layers

**Mitigation**:
- Test with all framework combinations (react, vue, plain-ts)
- Verify base layer imports remain unchanged
- Check that React layer's `hooks/useStorage.ts` still works

## Security Considerations

- No security impact (path resolution only)
- Maintains existing module boundaries

## Next Steps

After completion:
- Proceed to Phase 2 (Add Vite types)
- Test all template combinations
- Update documentation if needed
