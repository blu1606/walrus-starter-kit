---
title: "Fix Integration Test Path Resolution Issues"
description: "Resolve CLI_PATH and CWD issues in integration.test.mjs to enable proper test execution"
status: completed
priority: P1
effort: 1h
branch: main
tags: [testing, bugfix, integration-tests, path-resolution]
created: 2026-01-17
---

# Fix Integration Test Path Resolution Issues

## Overview

Fix path resolution errors in `integration.test.mjs` that prevent integration tests from executing. Current implementation incorrectly resolves CLI entry point path and executes tests from wrong working directory.

**Priority:** P1 (High) - Blocks integration test execution
**Status:** Completed
**Effort:** 1h

## Problem Summary

**Root Cause:** Line 14 in `integration.test.mjs` uses incorrect path resolution:
- **Current:** `join(__dirname, 'src', 'index.ts')` → `tests/integration/src/index.ts` ❌
- **Expected:** `join(__dirname, '..', '..', 'src', 'index.ts')` → `packages/cli/src/index.ts` ✅

**Secondary Issue:** Line 30 sets `cwd: __dirname` (test directory) instead of package root, causing relative paths in test commands to fail.

**Impact:** All 7 integration tests fail immediately - cannot locate CLI entry point.

## Context

- **Debugger Report:** `plans/reports/debugger-260117-2012-integration-test-path-resolution.md`
- **Reference Implementation:** `cli.e2e.test.mjs:9` correctly uses `../../dist/index.js`
- **Directory Structure:**
  ```
  packages/cli/
  ├── src/
  │   └── index.ts          ← Target entry point
  └── tests/
      └── integration/
          └── integration.test.mjs  ← Test file
  ```

## Implementation Phases

### Phase 1: Fix CLI_PATH Resolution
**File:** `packages/cli/tests/integration/integration.test.mjs:14`

**Current Code:**
```javascript
const CLI_PATH = join(__dirname, 'src', 'index.ts');
```

**Fixed Code:**
```javascript
const CLI_PATH = join(__dirname, '..', '..', 'src', 'index.ts');
```

**Rationale:** Navigate up 2 levels from `tests/integration/` to `packages/cli/`, then into `src/index.ts`.

---

### Phase 2: Fix Working Directory (CWD)
**File:** `packages/cli/tests/integration/integration.test.mjs:30`

**Current Code:**
```javascript
const output = execSync(command, {
  cwd: __dirname,  // tests/integration/
  encoding: 'utf-8',
  // ...
});
```

**Fixed Code:**
```javascript
const output = execSync(command, {
  cwd: join(__dirname, '..', '..'),  // packages/cli/
  encoding: 'utf-8',
  // ...
});
```

**Rationale:** Execute tests from package root so relative paths like `src/index.ts` resolve correctly.

---

### Phase 3: Verification
**Commands:**
```bash
cd packages/cli
pnpm test:integration
```

**Success Criteria:**
- All 7 tests execute (not fail on path resolution)
- CLI help command test passes
- CLI version command test passes
- No "cannot find module" errors
- Cross-platform compatibility (Windows/Unix paths)

---

## Technical Details

### Path Resolution Analysis

| Method | Result | Status |
|--------|--------|--------|
| `join(__dirname, 'src', 'index.ts')` | `tests/integration/src/index.ts` | ❌ Wrong |
| `join(__dirname, '..', '..', 'src', 'index.ts')` | `packages/cli/src/index.ts` | ✅ Correct |

### Comparison with E2E Tests

**E2E Test (Correct Pattern):**
```javascript
// cli.e2e.test.mjs:9
const CLI_BIN = path.resolve(__dirname, '../../dist/index.js');
```
- Uses `../../` to navigate up directory tree
- Targets built binary for end-to-end testing

**Integration Test (After Fix):**
```javascript
// integration.test.mjs:14
const CLI_PATH = join(__dirname, '..', '..', 'src', 'index.ts');
```
- Uses `../../` to navigate up directory tree
- Targets source file for integration testing with tsx

### Why Not Use CLI_PATH Variable?

Current implementation defines `CLI_PATH` but never uses it. Test commands hardcode paths:
```javascript
// Line 90
'npx tsx src/index.ts --help'
```

**Decision:** Keep hardcoded relative paths, fix CWD instead.
**Rationale:**
- Simpler - one line change vs updating 7+ test commands
- Consistent with package execution context
- KISS principle

## Implementation Steps

**Step 1:** Update CLI_PATH declaration (Line 14)
```javascript
const CLI_PATH = join(__dirname, '..', '..', 'src', 'index.ts');
```

**Step 2:** Update test function CWD (Line 30)
```javascript
cwd: join(__dirname, '..', '..'),
```

**Step 3:** Verify file structure
```bash
ls packages/cli/src/index.ts  # Should exist
```

**Step 4:** Run integration tests
```bash
cd packages/cli
pnpm test:integration
```

**Step 5:** Validate output
- Check all 7 tests execute
- Verify no path resolution errors
- Confirm tests evaluate actual behavior

## Files Modified

**Single File:**
- `packages/cli/tests/integration/integration.test.mjs` (Lines 14, 30)

## Success Criteria

✅ **CLI_PATH** resolves to `packages/cli/src/index.ts`
✅ **Tests execute** from `packages/cli/` directory
✅ **All 7 tests run** without path errors
✅ **Cross-platform** compatible (Windows/Unix)
✅ **No breaking changes** to test logic

## Risk Assessment

**Low Risk:**
- Minimal code changes (2 lines)
- No test logic modification
- Path resolution is deterministic
- No external dependencies affected

**Potential Issues:**
- None identified - straightforward path fix

## Security Considerations

- No security implications
- Using `path.join()` prevents path traversal
- No user input in path construction

## Dependencies

**None** - Self-contained fix

## Follow-up Tasks

After successful fix:
1. Document path resolution pattern in test guidelines
2. Consider standardizing test working directory across test suites
3. Evaluate if `CLI_PATH` variable should be used or removed

## Unresolved Questions

1. Should integration tests use source (`src/index.ts` with tsx) or built binary (`dist/index.js` like e2e tests)?
   **Current Decision:** Keep source testing for faster dev iteration

2. Should `CLI_PATH` variable be used in test commands?
   **Current Decision:** No - keep relative paths with corrected CWD (KISS)

3. Why was `CLI_PATH` defined if never used?
   **Hypothesis:** Leftover from earlier implementation - can be removed if not needed
