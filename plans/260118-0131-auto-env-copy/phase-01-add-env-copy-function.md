# Phase 01: Add env copy function

## Context Links

- **File**: `d:\Sui\walrus-starter-kit\packages\cli\src\generator\file-ops.ts`
- **Scout Report**: `d:\Sui\walrus-starter-kit\plans\reports\`

## Overview

**Priority**: P2
**Status**: completed (2026-01-18 01:31:48)
**Effort**: 30min

Add `copyEnvFile` helper function to `file-ops.ts` to handle copying `.env.example` to `.env` with edge cases.

## Key Insights

- Existing file-ops use `fs-extra` package (already available)
- Pattern follows `copyDirectory` style (async, returns metadata)
- Need skip logic: existing `.env`, missing `.env.example`
- Logger available from `../utils/logger.js`

## Requirements

### Functional
- Copy `.env.example` to `.env` if source exists
- Skip if `.env` already exists (preserve user config)
- Return status: `{ created: boolean, reason?: string }`

### Non-functional
- Use existing `fs-extra` APIs
- Consistent error handling with other file-ops
- Log actions for visibility

## Architecture

```
copyEnvFile(targetDir: string): Promise<EnvCopyResult>
  ├─ Check .env.example exists
  │  └─ No → return { created: false, reason: 'no-source' }
  ├─ Check .env exists
  │  └─ Yes → return { created: false, reason: 'already-exists' }
  └─ Copy file → return { created: true }
```

## Related Code Files

**Modify**:
- `packages/cli/src/generator/file-ops.ts` (add function)

**Reference**:
- `packages/cli/src/utils/logger.ts` (import logger)

## Implementation Steps

1. Add type definition at top of `file-ops.ts`:
   ```typescript
   export interface EnvCopyResult {
     created: boolean;
     reason?: 'no-source' | 'already-exists';
   }
   ```

2. Add `copyEnvFile` function after `ensureDirectory`:
   ```typescript
   /**
    * Copy .env.example to .env if it doesn't exist
    */
   export async function copyEnvFile(targetDir: string): Promise<EnvCopyResult> {
     const envExamplePath = path.join(targetDir, '.env.example');
     const envPath = path.join(targetDir, '.env');

     // Check if .env.example exists
     const hasExample = await fs.pathExists(envExamplePath);
     if (!hasExample) {
       return { created: false, reason: 'no-source' };
     }

     // Check if .env already exists
     const hasEnv = await fs.pathExists(envPath);
     if (hasEnv) {
       return { created: false, reason: 'already-exists' };
     }

     // Copy file
     await fs.copy(envExamplePath, envPath);
     return { created: true };
   }
   ```

3. Update exports in `file-ops.ts` if using named exports

## Todo List

- [ ] Add `EnvCopyResult` type definition
- [ ] Implement `copyEnvFile` function
- [ ] Verify imports (path, fs-extra)
- [ ] Compile check: `npm run build` in packages/cli

## Success Criteria

- Function compiles without errors
- Type signature matches spec
- Returns correct result for all cases:
  - `.env.example` missing → `{ created: false, reason: 'no-source' }`
  - `.env` exists → `{ created: false, reason: 'already-exists' }`
  - Success → `{ created: true }`

## Risk Assessment

**Low Risk**:
- Simple file operation
- No breaking changes (new function)
- Uses stable fs-extra APIs

## Next Steps

Integrate function into generator flow (Phase 02)
