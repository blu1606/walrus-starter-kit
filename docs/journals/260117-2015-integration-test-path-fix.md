# Integration Test Path Resolution Failure

**Date**: 2026-01-17 20:15
**Severity**: High
**Component**: Testing Infrastructure
**Status**: Resolved

## What Happened

All integration tests were failing because the test runner couldn't locate the CLI entry point. The tests were looking for `src/index.ts` inside the `tests/integration/` folder instead of the package root.

## The Brutal Truth

This was a classic "it works on my machine" failure that happened because the developer (me) probably ran the tests from a different directory than the CI or the standard `pnpm test` command. It's incredibly frustrating to have 100% test failure not because the code is broken, but because the test *setup* is wrong. It makes the whole testing suite look like a joke until it's fixed.

## Technical Details

- **Error**: `Error: Cannot find module 'd:\Sui\walrus-starter-kit\packages\cli\tests\integration\src\index.ts'`
- **Fix**: Adjusted `join(__dirname, '..', '..', 'src', 'index.ts')` to correctly back out of the test directory.
- **CWD**: Had to force `cwd: join(__dirname, '..', '..')` in `execSync` to ensure relative paths in the CLI commands worked as expected.

## What We Tried

- Updated the `CLI_PATH` variable (which was ironically defined but unused).
- Fixed the `cwd` in the execution helper.

## Root Cause Analysis

Poor directory traversal logic. The test was assuming a flat structure or that it was being executed from the package root without explicitly setting that context.

## Lessons Learned

1. **Explicit CWD**: Never trust the current working directory in tests. Always set it explicitly using `path.join(__dirname, ...)`.
2. **Verify Variable Usage**: Don't define variables like `CLI_PATH` and then forget to use them in the actual test execution calls. It leads to confusing debug sessions.

## Next Steps

- Audit other test suites for similar fragile path assumptions.
- Standardize a `test-utils` helper for path resolution.
