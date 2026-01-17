# Phase 02: Integrate env copy into generator

## Context Links

- **File**: `d:\Sui\walrus-starter-kit\packages\cli\src\generator\index.ts`
- **Dependency**: Phase 01 (copyEnvFile function)

## Overview

**Priority**: P2
**Status**: pending
**Effort**: 30min

Integrate `copyEnvFile` into `generateProject` flow after template transformation.

## Key Insights

- Current flow: copy layers → merge package.json → transform variables
- Insert point: after line 68 (after transformDirectory)
- Need to import `copyEnvFile` and `EnvCopyResult` from file-ops
- Log action with logger (info for skip, success for create)
- Dry-run mode: skip actual copy but log intent

## Requirements

### Functional
- Call `copyEnvFile` after template transformation
- Log result based on outcome
- Skip in dry-run mode
- Don't fail generation if copy fails (non-critical)

### Non-functional
- Preserve existing error handling flow
- Consistent logging style with other steps
- No change to function signature/return type

## Architecture

```
generateProject flow:
  ...
  ├─ transformDirectory (line 67)
  ├─ [NEW] copyEnvFile
  │  ├─ if dryRun → log intent, skip
  │  ├─ call copyEnvFile(targetDir)
  │  ├─ if created → logger.success('✓ Created .env from .env.example')
  │  ├─ if already-exists → logger.info('.env already exists, skipped')
  │  └─ if no-source → (silent, normal for non-base templates)
  └─ return result
```

## Related Code Files

**Modify**:
- `packages/cli/src/generator/index.ts`

**Import from**:
- `./file-ops.js` (add copyEnvFile, EnvCopyResult to imports)

## Implementation Steps

1. Update imports (line 5-9):
   ```typescript
   import {
     copyDirectory,
     ensureDirectory,
     isDirectoryEmpty,
     copyEnvFile,  // ADD
     type EnvCopyResult,  // ADD
   } from './file-ops.js';
   ```

2. Add env copy step after line 68 (after transformDirectory):
   ```typescript
   // Copy .env.example to .env
   logger.info('🔐 Setting up environment file');
   if (!dryRun) {
     const envResult = await copyEnvFile(targetDir);
     if (envResult.created) {
       logger.success('✓ Created .env from .env.example');
     } else if (envResult.reason === 'already-exists') {
       logger.info('ℹ️  .env already exists, skipped');
     }
     // Silent if no-source (not all templates have .env.example)
   } else {
     logger.info('(dry-run) Would copy .env.example to .env');
   }
   ```

3. No changes to return values or error handling

## Todo List

- [ ] Add imports: `copyEnvFile`, `EnvCopyResult`
- [ ] Insert env copy block after transformDirectory
- [ ] Handle all three result cases (created, already-exists, no-source)
- [ ] Add dry-run logging
- [ ] Compile check: `npm run build`

## Success Criteria

- Build passes without TypeScript errors
- Logger messages follow existing style
- Dry-run mode skips actual copy
- Non-critical: generator succeeds even if env copy fails
- Flow order: copy layers → merge package.json → transform → **env copy** → success

## Risk Assessment

**Low Risk**:
- Non-breaking addition
- No error thrown (graceful handling)
- Existing flow unchanged

**Edge Case**:
- Template without `.env.example` → silent skip (correct)

## Next Steps

Update success message to reflect auto-copy (Phase 03)
