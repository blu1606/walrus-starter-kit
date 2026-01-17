# Phase 04: Write tests

## Context Links

- **File**: `packages/cli/src/generator/file-ops.ts`
- **Test Pattern**: Check existing test files in `packages/cli/src/**/*.test.ts`

## Overview

**Priority**: P2
**Status**: pending
**Effort**: 30min

Write unit tests for `copyEnvFile` function covering all edge cases.

## Key Insights

- Test framework: Likely vitest or jest (check package.json)
- Need temp directory for isolated tests
- Test all three result cases
- Mock file system or use real temp files

## Requirements

### Functional Tests
1. Creates .env when .env.example exists
2. Skips when .env already exists
3. Skips when .env.example missing
4. File content matches source

### Non-functional
- Isolated tests (no side effects)
- Fast execution
- Clear test names

## Architecture

```
Test Suite: copyEnvFile
  ├─ should create .env from .env.example
  ├─ should skip if .env exists
  ├─ should skip if .env.example missing
  └─ should copy exact file content
```

## Related Code Files

**Create**:
- `packages/cli/src/generator/file-ops.test.ts` (new)

**Reference**:
- `packages/cli/package.json` (check test command)
- Existing test files for pattern

## Implementation Steps

1. Check test framework:
   ```bash
   grep -E "vitest|jest" packages/cli/package.json
   ```

2. Create test file `file-ops.test.ts`:
   ```typescript
   import { describe, it, expect, beforeEach, afterEach } from 'vitest';
   import fs from 'fs-extra';
   import path from 'node:path';
   import os from 'node:os';
   import { copyEnvFile } from './file-ops.js';

   describe('copyEnvFile', () => {
     let tempDir: string;

     beforeEach(async () => {
       tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'env-test-'));
     });

     afterEach(async () => {
       await fs.remove(tempDir);
     });

     it('should create .env from .env.example', async () => {
       // Setup
       const envExample = path.join(tempDir, '.env.example');
       await fs.writeFile(envExample, 'FOO=bar\n');

       // Execute
       const result = await copyEnvFile(tempDir);

       // Assert
       expect(result.created).toBe(true);
       expect(result.reason).toBeUndefined();
       const envExists = await fs.pathExists(path.join(tempDir, '.env'));
       expect(envExists).toBe(true);
     });

     it('should skip if .env already exists', async () => {
       // Setup
       await fs.writeFile(path.join(tempDir, '.env.example'), 'FOO=bar\n');
       await fs.writeFile(path.join(tempDir, '.env'), 'EXISTING=true\n');

       // Execute
       const result = await copyEnvFile(tempDir);

       // Assert
       expect(result.created).toBe(false);
       expect(result.reason).toBe('already-exists');
     });

     it('should skip if .env.example missing', async () => {
       // Execute
       const result = await copyEnvFile(tempDir);

       // Assert
       expect(result.created).toBe(false);
       expect(result.reason).toBe('no-source');
     });

     it('should copy exact file content', async () => {
       // Setup
       const content = 'VITE_API_KEY=test123\nNODE_ENV=development\n';
       await fs.writeFile(path.join(tempDir, '.env.example'), content);

       // Execute
       await copyEnvFile(tempDir);

       // Assert
       const envContent = await fs.readFile(path.join(tempDir, '.env'), 'utf8');
       expect(envContent).toBe(content);
     });
   });
   ```

3. Run tests:
   ```bash
   cd packages/cli
   npm test -- file-ops.test.ts
   ```

## Todo List

- [ ] Check test framework (vitest/jest)
- [ ] Create `file-ops.test.ts`
- [ ] Implement 4 test cases
- [ ] Run tests locally
- [ ] Verify 100% coverage for copyEnvFile
- [ ] Verify tests pass in CI

## Success Criteria

- All 4 tests pass
- No flaky tests (run 3x to confirm)
- Coverage ≥90% for copyEnvFile function
- Tests run in <1s
- CI pipeline green

## Risk Assessment

**Low Risk**:
- Isolated unit tests
- No external dependencies
- Temp directory cleanup

## Next Steps

E2E validation with real project generation (Phase 05)
