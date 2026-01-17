# GitHub Actions CI Failure Analysis

**Report Date**: 2026-01-18 06:41
**Analyzed Runs**: 21102654207, 21101497763
**Branch**: main
**Trigger**: push events

---

## Executive Summary

All CI pipeline failures stem from recent preset architecture refactoring (commit c5fd888). Three critical issues identified:

1. **Missing preset**: `vue-tusky-gallery` referenced but not created
2. **ESLint plugin missing**: `eslint-plugin-react` not found in preset directory
3. **Component path mismatch**: E2E tests expect Pascal-case filenames, presets use kebab-case

**Business Impact**: All merges to main blocked. Feature development halted.

---

## Root Cause Analysis

### Issue 1: Missing Vue-Tusky-Gallery Preset
**Severity**: Critical
**Affected**: Integration tests, E2E tests

**Evidence**:
```
Error: Preset not found: vue-tusky-gallery
Expected at: /home/runner/work/.../packages/cli/presets/vue-tusky-gallery
Available presets: Check packages/cli/presets/
```

**Timeline**:
- Test attempts to generate project: `--sdk tusky --framework vue --use-case gallery`
- Preset resolver looks for `vue-tusky-gallery` directory
- Only available presets: `react-mysten-gallery`, `react-mysten-simple-upload`

**Root Cause**: Integration test added for Vue+Tusky combination but preset never created. Tests reference combinations not supported by current preset architecture.

---

### Issue 2: ESLint Plugin Missing in Preset Directory
**Severity**: Critical
**Affected**: Lint job (all commits)

**Evidence**:
```
ESLint couldn't find the plugin "eslint-plugin-react".
(The package "eslint-plugin-react" was not found when loaded as a Node module
from the directory ".../packages/cli/presets/react-mysten-gallery".)
Referenced from: packages/cli/presets/react-mysten-gallery/.eslintrc.json
```

**Timeline**:
- Lint job runs `pnpm lint` → `eslint . --ext .ts,.tsx`
- ESLint discovers `.eslintrc.json` in `react-mysten-gallery` preset
- Config requires `eslint-plugin-react`, `eslint-plugin-react-hooks`
- Plugins not installed in preset directory's node_modules

**Root Cause**: Preset directories contain `.eslintrc.json` but no `package.json` or `node_modules`. ESLint scans entire codebase including presets. Presets are templates, not npm packages - shouldn't contain ESLint configs or will fail when linting from project root.

**Config Content**:
```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "plugins": ["@typescript-eslint", "react", "react-hooks"]
}
```

---

### Issue 3: Component Filename Case Mismatch
**Severity**: High
**Affected**: E2E tests

**Evidence**:
```
E2E Tests:
  ✗ Creates simple-upload use-case correctly
    UploadForm.tsx not found
  ✗ Creates gallery use-case correctly
    GalleryGrid.tsx not found
```

**Actual Preset Structure**:
```
packages/cli/presets/react-mysten-gallery/src/components/features/
  - gallery-grid.tsx (kebab-case)
  - upload-modal.tsx

packages/cli/presets/react-mysten-simple-upload/src/components/features/
  - upload-form.tsx (kebab-case)
```

**E2E Test Expectations** (cli.e2e.test.mjs):
```javascript
// Line 121-123: expects PascalCase
if (!fs.existsSync(path.join(projectPath, 'src/components/UploadForm.tsx'))) {
  throw new Error('UploadForm.tsx not found');
}

// Line 147-149: expects PascalCase
if (!fs.existsSync(path.join(projectPath, 'src/components/GalleryGrid.tsx'))) {
  throw new Error('GalleryGrid.tsx not found');
}
```

**Root Cause**: Preset refactoring migrated to features-based directory structure with kebab-case naming. E2E tests not updated to match new conventions.

**Mismatch Details**:
- Old path: `src/components/UploadForm.tsx`
- New path: `src/components/features/upload-form.tsx`
- Old path: `src/components/GalleryGrid.tsx`
- New path: `src/components/features/gallery-grid.tsx`

---

## Test Failure Summary

### Run #21102654207 (Latest - feat/gallery)
- **Lint Job**: ❌ ESLint plugin not found (exit code 2)
- **E2E Tests**: ❌ 2/12 tests failed (component paths)
- **Integration Tests**: ❌ 1 test failed (vue-tusky-gallery missing)
- **Unit Tests**: ✅ All passed
- **Coverage Upload**: ⚠️ Coverage file not found (side effect of lint failure)

### Run #21101497763 (Previous - feat/cli)
- Same failure pattern
- Confirms issue introduced in earlier commit, persisted

---

## Recommended Solutions

### Priority 1: Remove ESLint Configs from Presets (Immediate Fix)
**Action**: Delete `.eslintrc.json` from all preset directories
**Rationale**: Presets are templates for scaffolding, not npm packages. Linting should only occur on generated projects, not preset sources.

**Files to Remove**:
```bash
packages/cli/presets/react-mysten-gallery/.eslintrc.json
packages/cli/presets/react-mysten-simple-upload/.eslintrc.json
```

**Alternative**: Add preset directories to `.eslintignore`:
```
packages/cli/presets/*/
```

**Impact**: Fixes lint job immediately. Allows builds to proceed.

---

### Priority 2: Update E2E Tests (Immediate Fix)
**Action**: Update test expectations to match new preset structure

**Changes Required** in `packages/cli/tests/integration/cli.e2e.test.mjs`:

```javascript
// Line 120-124: Update upload-form path
if (!fs.existsSync(
  path.join(projectPath, 'src/components/features/upload-form.tsx')
)) {
  throw new Error('upload-form.tsx not found');
}

// Line 146-149: Update gallery-grid path
if (!fs.existsSync(
  path.join(projectPath, 'src/components/features/gallery-grid.tsx')
)) {
  throw new Error('gallery-grid.tsx not found');
}
```

**Impact**: Fixes 2 E2E test failures. Aligns tests with current architecture.

---

### Priority 3: Remove Invalid Integration Test (Short-term)
**Action**: Remove or skip test for unsupported Vue+Tusky combination

**Files**: `packages/cli/tests/integration/integration.test.mjs`

**Change** (Line 117-125):
```javascript
// OPTION A: Skip test
test.skip(
  'Valid CLI flags - Tusky + Vue + Gallery',
  'echo "" | npx tsx src/index.ts my-app --sdk tusky --framework vue --use-case gallery',
  { hasWelcome: /Welcome/, hasValid: /valid/ }
);

// OPTION B: Remove test entirely (lines 117-125)
```

**Rationale**: Test validates unsupported combination. Should only test actually supported presets.

**Impact**: Fixes integration test failure. Removes false positive.

---

### Priority 4: Add Vue+Tusky Preset (Long-term, Optional)
**Action**: Create `vue-tusky-gallery` preset if combination should be supported

**Only if**: Product requirements dictate Vue support for Tusky SDK

**Structure**:
```
packages/cli/presets/vue-tusky-gallery/
  ├── package.json
  ├── vite.config.ts
  ├── tsconfig.json
  ├── src/
  │   ├── App.vue
  │   ├── components/
  │   │   └── features/
  │   │       └── gallery-grid.vue
  └── ...
```

**Impact**: Enables Vue+Tusky combination. Requires significant development effort.

---

## Preventive Measures

### 1. Add Preset Validation Script
Create script to verify all test-referenced presets exist:
```javascript
// scripts/validate-presets.js
const presets = fs.readdirSync('packages/cli/presets');
const testRefs = extractPresetsFromTests(); // Parse test files
const missing = testRefs.filter(p => !presets.includes(p));
if (missing.length) throw new Error(`Missing presets: ${missing}`);
```

**Add to CI**: Run before tests

---

### 2. Update ESLint Configuration
Root `.eslintignore`:
```
packages/cli/presets/
```

Or update lint script in `package.json`:
```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx --ignore-pattern 'packages/cli/presets/**'"
  }
}
```

---

### 3. Document Preset Architecture
Create `packages/cli/presets/README.md`:
- Naming conventions (kebab-case vs PascalCase)
- Directory structure standards
- What configs belong in presets vs templates
- How to add new presets
- Test update checklist

---

### 4. Add E2E Test Generator
Script to auto-generate E2E tests from available presets:
```javascript
// Scan packages/cli/presets/*
// Generate test cases dynamically
// Ensures tests match actual preset availability
```

---

## Implementation Priority

1. **Immediate (< 1 hour)**:
   - Delete `.eslintrc.json` from presets OR add to `.eslintignore`
   - Update E2E test component paths
   - Skip/remove vue-tusky-gallery integration test

2. **Short-term (< 1 day)**:
   - Add preset validation script to CI
   - Document preset architecture
   - Review all tests for hardcoded preset references

3. **Long-term (if needed)**:
   - Create vue-tusky-gallery preset (if required by product)
   - Implement dynamic E2E test generation

---

## Supporting Evidence

### Test Results Breakdown

**E2E Tests** (10 passed, 2 failed):
- ✓ CLI binary exists
- ✓ Shows help with --help
- ✓ Creates React project with all flags
- ✓ Package.json has correct name
- ✓ Package.json includes React dependencies
- ✗ Creates simple-upload use-case correctly (UploadForm.tsx not found)
- ✗ Creates gallery use-case correctly (GalleryGrid.tsx not found)
- ✓ Includes required configuration files
- ✓ Replaces template variables correctly
- ✓ Fails for invalid SDK
- ✓ Fails for non-empty directory
- ✓ Creates .env file from .env.example

**Integration Tests** (6 passed, 1 failed):
- ✓ CLI help command
- ✓ CLI version command
- ✓ Valid CLI flags - Mysten + React + Simple Upload
- ✗ Valid CLI flags - Tusky + Vue + Gallery (preset not found)
- ✓ Invalid combination - Hibernuts + Vue should fail
- ✓ Invalid combination - Tusky + DeFi/NFT should fail
- ✓ Package manager detection

**Coverage Upload**: Failed - `coverage-final.json` not found (cascading failure from lint)

---

## Available Presets (Current State)

```
packages/cli/presets/
├── react-mysten-gallery/
│   ├── .eslintrc.json ❌ (causing lint failure)
│   ├── src/components/features/
│   │   ├── gallery-grid.tsx (kebab-case)
│   │   ├── upload-modal.tsx
│   │   └── ...
└── react-mysten-simple-upload/
    ├── .eslintrc.json ❌ (causing lint failure)
    ├── src/components/features/
    │   ├── upload-form.tsx (kebab-case)
    │   └── ...
```

**Missing Presets Referenced by Tests**:
- `vue-tusky-gallery`

---

## Risk Assessment

### If Not Fixed
- **Immediate**: All PRs blocked, CI fails
- **Short-term**: Developer productivity halted, feature velocity zero
- **Long-term**: Accumulating technical debt, test suite loses trust

### Fix Risks
- **Low Risk**: Removing ESLint configs from presets (no functionality impact)
- **Low Risk**: Updating E2E paths (matches actual structure)
- **Low Risk**: Skipping invalid test (removes false failure)

---

## Security Considerations

None. All issues are development/testing infrastructure.

---

## Unresolved Questions

1. Should Vue+Tusky combination be supported long-term? (Product decision)
2. Should presets use kebab-case or PascalCase for component files? (Architecture decision - currently kebab-case)
3. Should presets have their own linting, or only generated projects? (Current answer: only generated projects)
4. Are there other hardcoded preset references in codebase? (Needs full codebase search)
