# Phase 05: Testing Protocol

**Priority:** P1 (Validation)
**Status:** Pending (Blocked by Phases 1-4)
**Effort:** 30m

## Context Links

- **Diagnostic Report:** [Testing Protocol](../../plans/reports/debugger-260118-1038-typescript-build-errors.md#phase-5-testing-protocol)
- **Success Criteria:** All phases must pass this validation

## Overview

Comprehensive testing matrix to validate all fixes work correctly across platforms, package managers, and presets. Must test outside monorepo workspace to simulate real user experience.

**Test Matrix:**
- 3 presets (gallery, simple-upload, simple-upload-enoki)
- 2 package managers (npm, pnpm)
- 2 build modes (development, production)
- 2 platforms (Windows native, WSL)

**Total Test Cases:** 3 × 2 × 2 × 2 = 24 tests

## Key Insights

**Previous Testing Gaps:**
1. ❌ Only tested presets inside monorepo
2. ❌ Didn't test with fresh npm/pnpm install
3. ❌ Didn't verify generated projects build standalone
4. ❌ No cross-platform validation

**This Protocol Addresses:**
1. ✅ Test outside workspace (real user scenario)
2. ✅ Fresh dependency installation
3. ✅ Both package managers
4. ✅ Cross-platform compatibility

## Requirements

### Functional
- All presets must scaffold successfully
- All scaffolded projects must build successfully
- Development mode must start without errors
- Production builds must complete

### Non-Functional
- Tests run on clean system state
- No monorepo interference
- Automated test execution
- Clear pass/fail reporting

## Architecture

**Test Execution Flow:**
```
Clean Test Directory
  ↓
Scaffold Project (CLI)
  ↓
Install Dependencies (npm/pnpm)
  ↓
Verify File Structure
  ↓
Run Type Check
  ↓
Run Build (dev + prod)
  ↓
Verify Outputs
  ↓
Report Results
```

**Test Isolation:**
- Each test in separate temp directory
- No shared dependencies
- Fresh install each time
- Clean state between tests

## Related Code Files

### Files to Create

**Test Scripts:**
1. `d:\Sui\walrus-starter-kit\scripts\test-scaffolding.sh` - Main test script
2. `d:\Sui\walrus-starter-kit\scripts\test-preset.sh` - Single preset test
3. `d:\Sui\walrus-starter-kit\scripts\test-matrix.sh` - Full matrix runner

**Test Reports:**
1. `research/phase05-test-results.md` - Test execution report
2. `research/phase05-test-failures.md` - Failure analysis (if any)

### Files to Run

**CLI Build:**
- `d:\Sui\walrus-starter-kit\packages\cli\dist\index.js` - Generated CLI

## Implementation Steps

### Step 1: Create Single Preset Test Script (10m)

**File:** `scripts/test-preset.sh`

```bash
#!/bin/bash
set -e

# Test single preset scaffold + build
# Usage: ./test-preset.sh <preset-name> <package-manager>

PRESET=$1
PKG_MGR=$2
TEST_DIR=$(mktemp -d)
CLI_PATH="$(pwd)/packages/cli/dist/index.js"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Testing: $PRESET with $PKG_MGR"
echo "Test directory: $TEST_DIR"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Step 1: Scaffold project
echo "📦 Scaffolding project..."
cd "$TEST_DIR"
node "$CLI_PATH" test-project --preset "$PRESET" --skip-install

# Step 2: Verify files created
echo "✓ Verifying file structure..."
cd test-project

if [ ! -f "package.json" ]; then
  echo "❌ FAIL: package.json missing"
  exit 1
fi

if [ ! -f "sites-config.yaml" ]; then
  echo "❌ FAIL: sites-config.yaml missing"
  exit 1
fi

if [ ! -f ".env.example" ]; then
  echo "❌ FAIL: .env.example missing"
  exit 1
fi

FILE_COUNT=$(find . -type f | wc -l)
echo "✓ Files created: $FILE_COUNT"

# Step 3: Install dependencies
echo "📥 Installing dependencies with $PKG_MGR..."
if [ "$PKG_MGR" = "npm" ]; then
  npm install --silent
else
  pnpm install --silent
fi

# Step 4: Verify single @mysten/sui version
echo "✓ Verifying dependency versions..."
if [ "$PKG_MGR" = "npm" ]; then
  SUI_VERSIONS=$(npm list @mysten/sui --depth=0 2>/dev/null | grep -c "@mysten/sui" || true)
else
  SUI_VERSIONS=$(pnpm list @mysten/sui --depth=0 2>/dev/null | grep -c "@mysten/sui" || true)
fi

if [ "$SUI_VERSIONS" -ne 1 ]; then
  echo "❌ FAIL: Multiple @mysten/sui versions detected"
  if [ "$PKG_MGR" = "npm" ]; then
    npm list @mysten/sui
  else
    pnpm list @mysten/sui
  fi
  exit 1
fi
echo "✓ Single @mysten/sui version confirmed"

# Step 5: Type check
echo "🔍 Running type check..."
if [ "$PKG_MGR" = "npm" ]; then
  npm run type-check || {
    echo "❌ FAIL: Type check failed"
    exit 1
  }
else
  pnpm type-check || {
    echo "❌ FAIL: Type check failed"
    exit 1
  }
fi

# Step 6: Production build
echo "🏗️  Running production build..."
if [ "$PKG_MGR" = "npm" ]; then
  npm run build || {
    echo "❌ FAIL: Build failed"
    exit 1
  }
else
  pnpm build || {
    echo "❌ FAIL: Build failed"
    exit 1
  }
fi

# Step 7: Verify build output
if [ ! -d "dist" ]; then
  echo "❌ FAIL: dist directory not created"
  exit 1
fi

DIST_FILES=$(find dist -type f | wc -l)
if [ "$DIST_FILES" -eq 0 ]; then
  echo "❌ FAIL: dist directory is empty"
  exit 1
fi
echo "✓ Build output: $DIST_FILES files"

# Cleanup
cd /
rm -rf "$TEST_DIR"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ PASS: $PRESET with $PKG_MGR"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
```

**Make executable:**
```bash
chmod +x scripts/test-preset.sh
```

### Step 2: Create Full Test Matrix Script (5m)

**File:** `scripts/test-matrix.sh`

```bash
#!/bin/bash
set -e

# Run full test matrix
# Presets × Package Managers

PRESETS=(
  "react-mysten-gallery"
  "react-mysten-simple-upload"
  "react-mysten-simple-upload-enoki"
)

PKG_MANAGERS=("npm" "pnpm")

PASSED=0
FAILED=0
RESULTS=()

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Running Full Test Matrix"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for preset in "${PRESETS[@]}"; do
  for pkg_mgr in "${PKG_MANAGERS[@]}"; do
    echo ""
    if ./scripts/test-preset.sh "$preset" "$pkg_mgr"; then
      PASSED=$((PASSED + 1))
      RESULTS+=("✅ $preset + $pkg_mgr")
    else
      FAILED=$((FAILED + 1))
      RESULTS+=("❌ $preset + $pkg_mgr")
    fi
  done
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test Results Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
for result in "${RESULTS[@]}"; do
  echo "$result"
done
echo ""
echo "Total: $((PASSED + FAILED)) tests"
echo "Passed: $PASSED"
echo "Failed: $FAILED"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $FAILED -gt 0 ]; then
  exit 1
fi
```

**Make executable:**
```bash
chmod +x scripts/test-matrix.sh
```

### Step 3: Build CLI (5m)

```bash
cd packages/cli
pnpm build
```

**Verify CLI works:**
```bash
node dist/index.js --help
# MUST: Show help text without errors
```

### Step 4: Run Test Matrix (10m)

```bash
cd d:/Sui/walrus-starter-kit
./scripts/test-matrix.sh 2>&1 | tee research/phase05-test-results.md
```

**Expected output:**
```
✅ react-mysten-gallery + npm
✅ react-mysten-gallery + pnpm
✅ react-mysten-simple-upload + npm
✅ react-mysten-simple-upload + pnpm
✅ react-mysten-simple-upload-enoki + npm
✅ react-mysten-simple-upload-enoki + pnpm

Total: 6 tests
Passed: 6
Failed: 0
```

## Todo List

- [ ] Create scripts/test-preset.sh
- [ ] Create scripts/test-matrix.sh
- [ ] Make scripts executable (chmod +x)
- [ ] Build CLI package (pnpm build)
- [ ] Test CLI help command
- [ ] Run test matrix on Windows native
- [ ] Run test matrix on WSL
- [ ] Capture test results to research/phase05-test-results.md
- [ ] Analyze any failures
- [ ] Document failure root causes
- [ ] Fix any discovered issues
- [ ] Re-run tests until all pass
- [ ] Verify build outputs are correct
- [ ] Check bundle sizes are reasonable
- [ ] Validate no console errors in dev mode

## Success Criteria

### All Tests Pass
```bash
./scripts/test-matrix.sh
# MUST: Exit code 0
# MUST: "Failed: 0"
```

### Cross-Platform Consistency
```bash
# Run on Windows native
./scripts/test-matrix.sh > windows-results.txt

# Run on WSL
./scripts/test-matrix.sh > wsl-results.txt

diff windows-results.txt wsl-results.txt
# MUST: No differences in test outcomes
```

### Dependency Verification
```bash
# For each test
pnpm list @mysten/sui
# MUST: Show only version 1.45.2
```

### Build Output Verification
```bash
# After successful build
ls -lh dist/
# MUST: Contain index.html, assets/, etc.
# MUST: No empty directories
```

### No Console Errors (Manual)
```bash
# Start dev server
pnpm dev
# Open browser to http://localhost:5173
# MUST: No red errors in console
# MUST: App renders correctly
```

## Risk Assessment

**Low Risk:**
- Test scripts may have platform-specific issues
- **Mitigation:** Test on both Windows and WSL, use POSIX-compatible bash

**Low Risk:**
- Temp directory cleanup may fail
- **Mitigation:** Add trap for cleanup on script exit

**Low Risk:**
- Network issues during dependency installation
- **Mitigation:** Add retry logic, use --silent flag to reduce noise

## Security Considerations

**Temp Directory Safety:**
```bash
# Use secure temp directory creation
TEST_DIR=$(mktemp -d)
# Verify it's actually a temp directory
if [[ ! "$TEST_DIR" =~ ^/tmp/ ]]; then
  echo "Error: Invalid temp directory"
  exit 1
fi
```

**Cleanup:**
```bash
# Ensure cleanup on exit
trap 'rm -rf "$TEST_DIR"' EXIT
```

## Next Steps

**Immediate:**
- If all tests pass → Plan complete ✅
- If tests fail → Fix issues and re-run

**Follow-up:**
- Add test matrix to CI/CD pipeline
- Create GitHub Actions workflow
- Add performance benchmarks
- Monitor bundle sizes

## Unresolved Questions

1. Should we test with Yarn package manager too?
2. What are acceptable build times for each preset?
3. Should we add E2E tests for actual Walrus uploads?
4. How do we test Enoki authentication without real API keys?
5. Should tests run on every commit or just pre-release?
