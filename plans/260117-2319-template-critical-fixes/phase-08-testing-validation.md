# Phase 8: Testing and Validation

## Context

- **Priority**: P0 (Critical - Ensures all fixes work)
- **Status**: Pending
- **Effort**: 2 hours
- **Dependencies**: All previous phases (1-7)

## Overview

Comprehensive testing and validation of all template fixes. Verify all template combinations work correctly, compile without errors, and provide good developer experience. Test critical paths: project generation, compilation, wallet integration, upload/download functionality.

## Key Insights

- Must test ALL template combinations (SDK × Framework × Use Case)
- Critical paths: generation, compilation, wallet connection, upload, download
- Automated tests for compilation, manual tests for runtime
- Documentation of test results required
- Regression testing for existing functionality

## Requirements

### Functional
- Test all 18+ template combinations
- Verify TypeScript compilation
- Test wallet integration flow
- Validate upload/download operations
- Check README and documentation quality

### Non-Functional
- Fast test execution (parallelize where possible)
- Clear test reports
- Reproducible test scenarios
- Automated where possible

## Architecture

### Testing Strategy

```
Level 1: Template Generation Tests
    ↓
Level 2: Compilation Tests (TypeScript)
    ↓
Level 3: Runtime Tests (Manual)
    ↓
Level 4: End-to-End Tests (Upload/Download)
    ↓
Level 5: Documentation Review
```

### Test Matrix

| SDK    | Framework | Use Case      | Priority | Status |
|--------|-----------|---------------|----------|--------|
| mysten | react     | simple-upload | P0       | ⬜     |
| mysten | react     | gallery       | P0       | ⬜     |
| mysten | vue       | simple-upload | P1       | ⬜     |
| mysten | vue       | gallery       | P1       | ⬜     |
| mysten | plain-ts  | simple-upload | P2       | ⬜     |

## Related Code Files

### Test Locations
- Generated projects: `examples/test-*`
- Test scripts: Create new test automation scripts
- Validation results: Document in completion report

### Files to Review
- All template files modified in Phases 1-7
- CLI generation logic
- Post-install scripts

## Implementation Steps

### Step 1: Create Test Automation Script

```bash
# packages/cli/scripts/test-templates.sh

#!/bin/bash
set -e

TEST_DIR="../../examples/validation-tests"
RESULTS_FILE="test-results.md"

echo "# Template Validation Test Results" > $RESULTS_FILE
echo "Date: $(date)" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# Test combinations
combinations=(
  "mysten:react:simple-upload"
  "mysten:react:gallery"
  "mysten:vue:simple-upload"
  "mysten:vue:gallery"
  "mysten:plain-ts:simple-upload"
)

for combo in "${combinations[@]}"; do
  IFS=':' read -r sdk framework useCase <<< "$combo"
  projectName="test-${sdk}-${framework}-${useCase}"

  echo "Testing: $projectName"
  echo "## $projectName" >> $RESULTS_FILE

  # Generate project
  pnpm create walrus-app "$TEST_DIR/$projectName" \
    --sdk "$sdk" \
    --framework "$framework" \
    --use-case "$useCase" \
    --skip-install

  # Install dependencies
  cd "$TEST_DIR/$projectName"
  pnpm install

  # Run TypeScript check
  if pnpm tsc --noEmit; then
    echo "✅ TypeScript compilation passed" >> $RESULTS_FILE
  else
    echo "❌ TypeScript compilation failed" >> $RESULTS_FILE
  fi

  # Check for critical files
  if [ -f "README.md" ]; then
    echo "✅ README.md exists" >> $RESULTS_FILE
  else
    echo "❌ README.md missing" >> $RESULTS_FILE
  fi

  if [ -f ".env.example" ]; then
    echo "✅ .env.example exists" >> $RESULTS_FILE
  else
    echo "❌ .env.example missing" >> $RESULTS_FILE
  fi

  cd -
  echo "" >> $RESULTS_FILE
done

echo "Test results saved to $RESULTS_FILE"
```

### Step 2: Run Automated Tests

```bash
# Make script executable
chmod +x packages/cli/scripts/test-templates.sh

# Run tests
cd packages/cli
./scripts/test-templates.sh
```

### Step 3: Manual Runtime Testing Checklist

For each P0 combination (mysten + react + simple-upload/gallery):

```markdown
# Manual Test Protocol

## Test: mysten-react-simple-upload

### 1. Project Generation
- [ ] Project created without errors
- [ ] All template files present
- [ ] package.json has correct dependencies
- [ ] No git directory created (Phase 6)

### 2. Installation
- [ ] `pnpm install` completes successfully
- [ ] node_modules directory created
- [ ] No installation warnings/errors

### 3. Compilation
- [ ] `pnpm tsc --noEmit` passes
- [ ] No module resolution errors
- [ ] No type errors

### 4. Development Server
- [ ] `pnpm dev` starts successfully
- [ ] Server running on http://localhost:3000
- [ ] No console errors in terminal
- [ ] No console errors in browser

### 5. Wallet Integration (Phase 4)
- [ ] Wallet connect button visible
- [ ] Can connect Sui Wallet
- [ ] Wallet address displayed
- [ ] No connection errors

### 6. Upload Functionality (Phase 3 + 4)
- [ ] File input visible
- [ ] Can select file
- [ ] Upload triggers wallet signature request
- [ ] Upload completes successfully
- [ ] Blob ID returned
- [ ] No runtime errors

### 7. Download Functionality (Phase 5)
- [ ] Can download uploaded blob
- [ ] Blob data correct (matches uploaded file)
- [ ] No type errors in console
- [ ] File downloads correctly

### 8. Documentation (Phase 7)
- [ ] README.md comprehensive
- [ ] Getting started instructions clear
- [ ] Environment variables documented
- [ ] Usage examples present
- [ ] Template variables replaced (project name)

### 9. Import Paths (Phase 1)
- [ ] No "../" import errors
- [ ] All relative imports work
- [ ] Module resolution correct

### 10. Vite Types (Phase 2)
- [ ] `import.meta.env` has type hints
- [ ] No TypeScript errors for env access
- [ ] Vite types loaded correctly
```

### Step 4: Specific Fix Validation

#### Phase 1 Validation: Import Paths
```bash
# Generate project
pnpm create walrus-app test-imports --sdk mysten --framework react --use-case simple-upload

cd test-imports

# Check for import errors
grep -r "from '\.\.\/" src/
# Should return no results (all imports should use ./)

# Verify compilation
pnpm tsc --noEmit
# Should pass without module resolution errors
```

#### Phase 2 Validation: Vite Types
```bash
# Check tsconfig.json
cat tsconfig.json | grep "vite/client"
# Should show: "types": ["vite/client"]

# Verify in IDE
# Open src/utils/env.ts
# Hover over import.meta.env
# Should show Vite type hints
```

#### Phase 3 Validation: SDK v0.9.0 API
```bash
# Check adapter implementation
grep -A5 "writeBlob(" src/adapter.ts
# Should show object parameter pattern: { blob, epochs, signer }

grep -A5 "readBlob(" src/adapter.ts
# Should show object parameter: { blobId }

grep "metadata.V1" src/adapter.ts
# Should show V1 metadata access
```

#### Phase 4 Validation: Wallet Signer
```bash
# Check useStorageAdapter hook exists
ls src/hooks/useStorageAdapter.ts
# Should exist

# Check signer injection
grep "signer:" src/hooks/useStorageAdapter.ts
# Should show signer injection from useWallet

# Manual test: Upload with wallet connected
# Should succeed without "signer required" error
```

#### Phase 5 Validation: Type Mismatches
```bash
# Check Blob constructor cast
grep "new Blob.*as any" src/adapter.ts
# Should show type cast for Uint8Array

# Run strict TypeScript check
pnpm tsc --noEmit --strict
# Should pass
```

#### Phase 6 Validation: No Git Automation
```bash
# Check for .git directory
ls -la | grep .git
# Should NOT exist

# Check post-install output
pnpm create walrus-app test-nogit --sdk mysten --framework react --use-case simple-upload
# Output should NOT mention git initialization
```

#### Phase 7 Validation: README Templates
```bash
# Check README exists
cat README.md
# Should be comprehensive

# Verify template variables replaced
cat README.md | grep "{{projectName}}"
# Should return no results (all replaced)

cat README.md | grep "test-nogit"
# Should show actual project name
```

### Step 5: Regression Testing

Test that existing functionality still works:

```bash
# Test package manager detection
pnpm create walrus-app test-pm-npm --sdk mysten --framework react --use-case simple-upload --pm npm
# Should detect npm

# Test skip flags
pnpm create walrus-app test-skip --sdk mysten --framework react --use-case simple-upload --skip-install
# Should skip installation

# Test validation
pnpm create walrus-app test-validation --sdk mysten --framework react --use-case simple-upload
# Should run validation checks
```

### Step 6: Performance Testing

```bash
# Test generation speed
time pnpm create walrus-app test-perf --sdk mysten --framework react --use-case gallery
# Should complete in < 60 seconds (including install)

# Test compilation speed
cd test-perf
time pnpm tsc --noEmit
# Should complete in < 30 seconds
```

### Step 7: Document Test Results

Create comprehensive test report:

```markdown
# Template Validation Test Report
Date: 2026-01-17
Tester: [Name]
Phases Tested: 1-7

## Summary
- Total Combinations Tested: 5
- Passed: X
- Failed: Y
- Skipped: Z

## Detailed Results

### mysten-react-simple-upload ✅
- Generation: ✅ Pass
- Compilation: ✅ Pass
- Runtime: ✅ Pass
- Wallet: ✅ Pass
- Upload: ✅ Pass
- Download: ✅ Pass
- Documentation: ✅ Pass

**Issues**: None

### mysten-react-gallery ✅
[... similar structure ...]

## Phase-Specific Validations

### Phase 1: Import Paths ✅
- No "../" imports in generated code
- All modules resolve correctly
- Compilation passes

### Phase 2: Vite Types ✅
- tsconfig includes vite/client
- import.meta.env has type hints
- No TypeScript errors

[... etc ...]

## Regression Testing ✅
- Package manager detection: ✅
- Skip flags: ✅
- Validation: ✅
- Performance: ✅

## Recommendations
1. [Any improvements needed]
2. [Additional testing suggested]

## Sign-off
All critical template combinations validated and working correctly.
Ready for production release.
```

## Todo List

### Automated Testing
- [ ] Create test automation script
- [ ] Run automated tests for all combinations
- [ ] Generate test results report
- [ ] Review automated test results

### Manual Testing (P0 Combinations)
- [ ] Test mysten-react-simple-upload (full protocol)
- [ ] Test mysten-react-gallery (full protocol)
- [ ] Test wallet connection flow
- [ ] Test upload functionality
- [ ] Test download functionality

### Phase-Specific Validation
- [ ] Validate Phase 1 (import paths)
- [ ] Validate Phase 2 (Vite types)
- [ ] Validate Phase 3 (SDK API)
- [ ] Validate Phase 4 (wallet signer)
- [ ] Validate Phase 5 (type fixes)
- [ ] Validate Phase 6 (no git)
- [ ] Validate Phase 7 (READMEs)

### Regression Testing
- [ ] Test package manager detection
- [ ] Test skip flags functionality
- [ ] Test validation checks
- [ ] Test CLI help and options

### Performance Testing
- [ ] Measure generation time
- [ ] Measure compilation time
- [ ] Measure development server startup

### Documentation
- [ ] Create comprehensive test report
- [ ] Document any issues found
- [ ] Document workarounds if needed
- [ ] Sign off on test completion

## Success Criteria

- [ ] All P0 combinations pass all tests
- [ ] TypeScript compilation passes for all combinations
- [ ] Wallet integration works in manual tests
- [ ] Upload/download functionality verified
- [ ] READMEs comprehensive and accurate
- [ ] No import path errors
- [ ] No type mismatches
- [ ] No git directories in generated projects
- [ ] Test report completed and reviewed
- [ ] All phases validated successfully

## Risk Assessment

**Risks**:
- Some combinations may reveal unexpected issues
- Runtime testing requires manual effort
- Network dependencies (testnet availability)
- Wallet availability for testing

**Mitigation**:
- Test incrementally, fix issues immediately
- Automate as much as possible
- Use local mocks for network testing if needed
- Document known issues and workarounds
- Have fallback plans for each critical path

## Security Considerations

- Test that signer is never exposed in logs
- Verify no secrets in generated .env files
- Ensure wallet disconnection works properly
- Validate error messages don't leak sensitive data

## Next Steps

After completion:
- Update project documentation with test results
- Create release notes summarizing all fixes
- Update changelog with breaking changes
- Prepare deployment to npm
- Notify community of fixes and improvements
- Consider creating video tutorial showing new features
