# E2E Test Compilation and Execution Report

**Date**: 2026-01-17
**Status**: 🔴 FAILED
**Suite**: `packages/cli/tests/integration/cli.e2e.test.mjs`

## Test Results Overview

| Metric | Value |
|--------|-------|
| Total Tests | 11 |
| Passed | 3 |
| Failed | 8 |
| Skipped | 0 |
| Compilation | ✅ SUCCESS |

## Compilation Status
- **Build Command**: `pnpm --filter @walrus-kit/create-walrus-app build`
- **Result**: Success. `tsc` completed without errors.
- **Output**: `packages/cli/dist` directory populated correctly.

## Test Results Summary

| Test Name | Status | Error |
|-----------|--------|-------|
| CLI binary exists | ✅ PASS | - |
| CLI shows help with --help flag | ✅ PASS | - |
| Fails for invalid SDK | ✅ PASS | - |
| Creates React project with all flags | ❌ FAIL | Project directory not created |
| Package.json has correct name | ❌ FAIL | ENOENT: package.json not found |
| Package.json includes React dependencies | ❌ FAIL | ENOENT: package.json not found |
| Creates simple-upload use-case correctly | ❌ FAIL | UploadForm.tsx not found |
| Creates gallery use-case correctly | ❌ FAIL | GalleryGrid.tsx not found |
| Includes required configuration files | ❌ FAIL | tsconfig.json not found |
| Replaces template variables correctly | ❌ FAIL | ENOENT: README.md not found |
| Fails for non-empty directory | ❌ FAIL | Should have failed for non-empty directory |

## Detailed Failure Analysis

### 1. Project Generation Failures (8 tests)
- **Symptom**: All tests involving project generation (`node dist/index.js <projectName> ...`) are failing.
- **Root Cause**: The CLI silently fails or crashes during the generation process, resulting in no files being created in the temporary directory.
- **Observed Behavior**:
  - `fs.existsSync(projectPath)` returns `false`.
  - Subsequent file reads throw `ENOENT`.
  - The "Fails for non-empty directory" test does NOT fail as expected, meaning the CLI didn't exit with a non-zero code or the error message didn't match.

### 2. Probable Cause: Path/Variable Mismatch in Templates
- **Evidence**:
  - `packages/cli/src/generator/transform.ts` uses `{{projectName}}` (camelCase key) for replacement.
  - `packages/cli/templates/base/package.json` uses `{{projectName}}`.
  - HOWEVER, `packages/cli/src/generator/transform.ts` might be encountering issues with path resolution or variable mapping on Windows.
  - `cli.e2e.test.mjs` uses `TEMP_DIR` which might have permission issues or path separator mismatches in the `execSync` command.

### 3. CLI Silencing Errors
- **Observation**: `packages/cli/src/index.ts` has a `try-catch` block that catches errors and calls `process.exit(1)`, but `execSync` in the test suite might not be capturing the output correctly if it's being piped or if the error happens before `commander` starts.

## Critical Issues
- **Generation Logic**: The core `generateProject` function appears to be failing without providing enough feedback to the test runner.
- **Cleanup Interference**: The `SIGINT` handler or `cleanup()` in the test suite might be deleting the directory before assertions are made, although `cleanup()` is called at the end.

## Recommendations
1. **Enable Debug Logging**: Update the E2E test to capture and print `stdout`/`stderr` from `execSync` when a test fails.
2. **Verify Template Paths**: Ensure `TEMPLATE_ROOT` in `packages/cli/src/generator/layers.ts` correctly resolves to the absolute path of the `templates` directory on Windows.
3. **Check Variable Keys**: Standardize on `{{projectName}}` vs `{{PROJECT_NAME}}`. The current implementation in `transform.ts` uses `{{projectName}}`.
4. **Fix "Non-empty directory" test**: Investigate why `isDirectoryEmpty` or the check in `index.ts` didn't trigger a failure that the test could catch.

## Next Steps
1. Modify `cli.e2e.test.mjs` to print CLI output on failure.
2. Manually run one of the failing commands to see the raw output.
3. Debug `generateProject` in `packages/cli/src/generator/index.ts`.

## Unresolved Questions
- Why is the CLI failing silently in the E2E environment but potentially working in manual runs (to be verified)?
- Are there hidden permission issues with `os.tmpdir()` on this Windows machine?
