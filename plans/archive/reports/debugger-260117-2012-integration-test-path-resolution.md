# Integration Test Path Resolution Error - Root Cause Analysis

**Date:** 2026-01-17
**Investigator:** debugger (ac1b01f)
**Status:** Complete
**Severity:** High - Blocks integration test execution

## Executive Summary

Integration test file `integration.test.mjs` has incorrect path resolution for CLI entry point. Currently resolves to non-existent `tests/integration/src/index.ts` instead of correct `packages/cli/src/index.ts`. Root cause: incorrect use of `__dirname` without navigating up directory tree.

**Impact:** Integration tests fail immediately - cannot locate CLI entry point to execute test commands.

## Root Cause Identification

### Primary Issue - Line 14

**File:** `packages/cli/tests/integration/integration.test.mjs`

```javascript
const CLI_PATH = join(__dirname, 'src', 'index.ts');
```

**Current Resolution:**
- `__dirname` = `D:\Sui\walrus-starter-kit\packages\cli\tests\integration`
- `CLI_PATH` = `D:\Sui\walrus-starter-kit\packages\cli\tests\integration\src\index.ts` ❌

**Expected Resolution:**
- `CLI_PATH` = `D:\Sui\walrus-starter-kit\packages\cli\src\index.ts` ✅

### Verified Context

**CLI Entry Point Exists:**
```bash
d:\Sui\walrus-starter-kit\packages\cli\src\index.ts ✓ (confirmed)
```

**Directory Structure:**
```
packages/cli/
├── src/
│   ├── index.ts          ← Target file
│   ├── context.ts
│   ├── prompts.ts
│   └── ...
└── tests/
    └── integration/
        ├── integration.test.mjs  ← Test file location
        ├── cli.e2e.test.mjs
        └── validation.test.mjs
```

### Comparative Analysis

**E2E Test (Correct Implementation)** - `cli.e2e.test.mjs:9`:
```javascript
const CLI_BIN = path.resolve(__dirname, '../../dist/index.js');
```
- Uses `../../` to navigate up from `tests/integration/` to `packages/cli/`
- Targets built artifact `dist/index.js`

**Integration Test (Incorrect)** - `integration.test.mjs:14`:
```javascript
const CLI_PATH = join(__dirname, 'src', 'index.ts');
```
- Missing directory navigation
- Targets source file `src/index.ts` (correct for dev testing with tsx)

## Secondary Issues

### Issue 1: Unused Variable (Line 14)
`CLI_PATH` defined but never referenced in test commands. All tests use hardcoded `src/index.ts`:

```javascript
// Line 90: test command
'npx tsx src/index.ts --help'
```

Tests run from `cwd: __dirname` (line 30), relying on relative path resolution from test directory - incorrect.

### Issue 2: Inconsistent Test Execution Strategy
- E2E tests: Use built binary `dist/index.js` with absolute paths
- Integration tests: Attempt to use source `src/index.ts` with tsx, but path logic broken
- Validation tests: No CLI invocation (pure unit tests)

## Technical Analysis

### Path Resolution Comparison

| Method | Current Result | Correct Result |
|--------|---------------|----------------|
| `join(__dirname, 'src', 'index.ts')` | `tests/integration/src/index.ts` ❌ | N/A |
| `join(__dirname, '../../src/index.ts')` | `packages/cli/src/index.ts` ✅ | ✅ |
| `resolve(__dirname, '../../src/index.ts')` | `packages/cli/src/index.ts` ✅ | ✅ |

### CWD Impact Analysis

Test function sets `cwd: __dirname` (line 30), making test commands execute from `tests/integration/`:

```javascript
execSync(command, {
  cwd: __dirname,  // tests/integration/
  // ...
});
```

Commands like `npx tsx src/index.ts --help` resolve to `tests/integration/src/index.ts` - non-existent path.

## Recommended Fixes

### Fix 1: Update CLI_PATH Resolution (Preferred)

**Line 14 - Replace:**
```javascript
const CLI_PATH = join(__dirname, 'src', 'index.ts');
```

**With:**
```javascript
const CLI_PATH = join(__dirname, '..', '..', 'src', 'index.ts');
// OR
const CLI_PATH = path.resolve(__dirname, '../../src/index.ts');
```

**Rationale:** Maintains source file testing with tsx (faster dev iteration than building dist)

### Fix 2: Update CWD to Package Root

**Line 30 - Replace:**
```javascript
cwd: __dirname,
```

**With:**
```javascript
cwd: join(__dirname, '..', '..'),
```

**Rationale:** Execute from `packages/cli/`, allowing relative `src/index.ts` paths to work. Simpler than fixing all test commands.

### Fix 3: Use CLI_PATH in Commands (Complete Solution)

**Lines 90, 101, 110, etc. - Replace hardcoded paths:**
```javascript
// Before
'npx tsx src/index.ts --help'

// After
`npx tsx "${CLI_PATH}" --help`
```

**Rationale:** Ensures consistent path usage, makes variable meaningful.

## Recommended Implementation Strategy

**Priority Order:**

1. **Fix CLI_PATH declaration** (Line 14) - Fixes root cause
2. **Update test commands** (Lines 90+) - Use `CLI_PATH` variable
3. **Verify CWD strategy** - Consider package root vs test dir

**Minimal Fix:**
```javascript
// Line 14
const CLI_PATH = path.resolve(__dirname, '../../src/index.ts');

// Line 30 - Change CWD to package root
const output = execSync(command, {
  cwd: path.join(__dirname, '..', '..'),  // packages/cli/
  encoding: 'utf-8',
  timeout: 10000,
  env: { ...process.env, npm_config_user_agent: 'pnpm/8.0.0' }
});

// Line 90 - Use relative path (now correct from package root)
test(
  'CLI help command',
  'npx tsx src/index.ts --help',
  { /* ... */ }
);
```

## Verification Steps

1. Apply fixes to `integration.test.mjs`
2. Run test suite: `pnpm test:integration`
3. Verify all 7 tests execute (not just fail on path resolution)
4. Check test output matches expectations
5. Ensure consistent behavior across Windows/Unix paths

## Supporting Evidence

**File Existence Verification:**
```
✓ d:\Sui\walrus-starter-kit\packages\cli\src\index.ts exists
✗ d:\Sui\walrus-starter-kit\packages\cli\tests\integration\src\index.ts does NOT exist
```

**Path Resolution Demonstration:**
```
__dirname: D:\Sui\walrus-starter-kit\packages\cli\tests\integration
Incorrect: D:\Sui\walrus-starter-kit\packages\cli\tests\integration\src\index.ts
Correct:   D:\Sui\walrus-starter-kit\packages\cli\src\index.ts
```

**Similar Pattern in Codebase:**
- `cli.e2e.test.mjs:9` correctly uses `../../dist/index.js`
- `validation.test.mjs` doesn't invoke CLI (no path issue)

## Related Files

**Modified:**
- `packages/cli/tests/integration/integration.test.mjs`

**Reference:**
- `packages/cli/tests/integration/cli.e2e.test.mjs` (correct pattern)
- `packages/cli/src/index.ts` (target entry point)
- `packages/cli/package.json` (test scripts)

## Security Considerations

No security implications. Path traversal prevented by using `path.join()`/`path.resolve()` instead of string concatenation.

## Performance Impact

None. Path resolution happens once at test initialization.

## Unresolved Questions

1. Should integration tests use source (`src/index.ts` with tsx) or built binary (`dist/index.js` like e2e tests)?
2. Should `CLI_PATH` variable be used in all test commands or keep relative paths with corrected CWD?
3. Why was `CLI_PATH` defined if never used in original implementation?
