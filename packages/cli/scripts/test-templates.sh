#!/bin/bash
set -e

# Template Validation Test Script
# Tests all template combinations for compilation and basic requirements

TEST_DIR="../../examples/validation-tests"
RESULTS_FILE="test-results.md"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "Starting template validation tests..."
echo ""

# Initialize results file
echo "# Template Validation Test Results" > $RESULTS_FILE
echo "Date: $TIMESTAMP" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE
echo "## Test Summary" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# Create test directory
mkdir -p $TEST_DIR

# Test combinations (SDK:Framework:UseCase)
combinations=(
  "mysten:react:simple-upload"
  "mysten:react:gallery"
  "mysten:vue:simple-upload"
  "mysten:vue:gallery"
  "mysten:plain-ts:simple-upload"
)

TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Input validation function
validate_combo_part() {
  if [[ ! "$1" =~ ^[a-z0-9-]+$ ]]; then
    echo -e "${RED}✗${NC} Invalid combo part: $1"
    echo "Error: Invalid combo part '$1' - only lowercase letters, numbers, and hyphens allowed" >> $RESULTS_FILE
    exit 1
  fi
}

for combo in "${combinations[@]}"; do
  IFS=':' read -r sdk framework useCase <<< "$combo"

  # Validate each component for security
  validate_combo_part "$sdk"
  validate_combo_part "$framework"
  validate_combo_part "$useCase"

  projectName="test-${sdk}-${framework}-${useCase}"

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Testing: $projectName"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  echo "" >> $RESULTS_FILE
  echo "### $projectName" >> $RESULTS_FILE
  echo "" >> $RESULTS_FILE

  # Clean up if exists
  if [ -d "$TEST_DIR/$projectName" ]; then
    rm -rf "$TEST_DIR/$projectName"
  fi

  # Test 1: Project Generation
  echo -n "  [1/5] Generating project... "
  if pnpm create walrus-app "$TEST_DIR/$projectName" \
    --sdk "$sdk" \
    --framework "$framework" \
    --use-case "$useCase" \
    --skip-install > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
    echo "- ✅ Project generation: PASSED" >> $RESULTS_FILE
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo -e "${RED}✗${NC}"
    echo "- ❌ Project generation: FAILED" >> $RESULTS_FILE
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    FAILED_TESTS=$((FAILED_TESTS + 1))
    continue  # Skip remaining tests if generation failed
  fi

  cd "$TEST_DIR/$projectName"

  # Test 2: Install Dependencies
  echo -n "  [2/5] Installing dependencies... "
  if pnpm install > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
    echo "- ✅ Dependency installation: PASSED" >> $RESULTS_FILE
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo -e "${RED}✗${NC}"
    echo "- ❌ Dependency installation: FAILED" >> $RESULTS_FILE
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    FAILED_TESTS=$((FAILED_TESTS + 1))
    cd - > /dev/null
    continue
  fi

  # Test 3: TypeScript Compilation
  echo -n "  [3/5] Checking TypeScript compilation... "
  if pnpm tsc --noEmit > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
    echo "- ✅ TypeScript compilation: PASSED" >> $RESULTS_FILE
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo -e "${RED}✗${NC}"
    echo "- ❌ TypeScript compilation: FAILED" >> $RESULTS_FILE
    echo "  - Run 'pnpm tsc --noEmit' to see errors" >> $RESULTS_FILE
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi

  # Test 4: Critical Files Existence
  echo -n "  [4/5] Checking critical files... "
  FILES_OK=true

  if [ -f "README.md" ]; then
    echo "- ✅ README.md exists" >> $RESULTS_FILE
  else
    echo "- ❌ README.md missing" >> $RESULTS_FILE
    FILES_OK=false
  fi

  if [ -f ".env.example" ]; then
    echo "- ✅ .env.example exists" >> $RESULTS_FILE
  else
    echo "- ❌ .env.example missing" >> $RESULTS_FILE
    FILES_OK=false
  fi

  if [ -f "package.json" ]; then
    echo "- ✅ package.json exists" >> $RESULTS_FILE
  else
    echo "- ❌ package.json missing" >> $RESULTS_FILE
    FILES_OK=false
  fi

  if [ -f "tsconfig.json" ]; then
    echo "- ✅ tsconfig.json exists" >> $RESULTS_FILE
  else
    echo "- ❌ tsconfig.json missing" >> $RESULTS_FILE
    FILES_OK=false
  fi

  if $FILES_OK; then
    echo -e "${GREEN}✓${NC}"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo -e "${RED}✗${NC}"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi

  # Test 5: No Git Directory (Phase 6 validation)
  echo -n "  [5/5] Checking no git directory... "
  if [ ! -d ".git" ]; then
    echo -e "${GREEN}✓${NC}"
    echo "- ✅ No .git directory (Phase 6 fix verified)" >> $RESULTS_FILE
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo -e "${RED}✗${NC}"
    echo "- ❌ .git directory exists (Phase 6 fix NOT working)" >> $RESULTS_FILE
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi

  cd - > /dev/null
  echo ""
done

# Summary
echo "" >> $RESULTS_FILE
echo "## Overall Results" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE
echo "- **Total Tests**: $TOTAL_TESTS" >> $RESULTS_FILE
echo "- **Passed**: $PASSED_TESTS" >> $RESULTS_FILE
echo "- **Failed**: $FAILED_TESTS" >> $RESULTS_FILE
echo "- **Success Rate**: $(awk "BEGIN {printf \"%.1f\", ($PASSED_TESTS/$TOTAL_TESTS)*100}")%" >> $RESULTS_FILE

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test Results Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
echo ""
echo "Detailed results saved to: packages/cli/scripts/$RESULTS_FILE"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}All tests passed! ✓${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed. Check $RESULTS_FILE for details.${NC}"
  exit 1
fi
