# Phase 02: Fix Project Generator File Copy Bug

**Priority:** P1 (Critical)
**Status:** Pending
**Effort:** 2h

## Context Links

- **Diagnostic Report:** [TypeScript Build Errors - Root Cause #2](../../plans/reports/debugger-260118-1038-typescript-build-errors.md#root-cause-2-missing-node_modules--vite-types)
- **Related Code:** packages/cli/src/generator/

## Overview

Critical bug in project generator creates empty directories when scaffolding projects outside monorepo workspace. Reports "Files created: 36" but produces empty directory.

**Symptom:**
```bash
cd ~/test-walrus-enoki
node .../cli/dist/index.js test-walrus-enoki --sdk mysten --skip-install
# Output: "✓ Project generated successfully! Files created: 36"
ls ~/test-walrus-enoki
# Result: Directory is EMPTY
```

## Key Insights

**Test Results Matrix:**

| Location | Install Result | Build Result | Diagnosis |
|----------|----------------|--------------|-----------|
| Preset in monorepo | Virtual store | ❌ Missing node_modules | Workspace behavior |
| Scaffolded inside workspace | Virtual store | ❌ Same issue | Inherits workspace |
| Scaffolded outside workspace | ❌ Empty directory | N/A | **GENERATOR BUG** |

**Critical Finding:** Generator counts files but doesn't actually write them when target path is outside workspace.

**Suspected Causes:**
1. Path resolution fails for absolute paths outside workspace
2. File copy operations silently fail (no error thrown)
3. Windows path handling differences (backslash vs forward slash)
4. Permission issues when writing outside workspace

## Requirements

### Functional
- Generator must create files in any valid directory
- File count must match actual files written
- Support absolute and relative paths
- Work on Windows (backslash) and Unix (forward slash)

### Non-Functional
- Clear error messages if file operations fail
- Validate target directory before copying
- Log actual file paths during generation
- Cross-platform compatibility

## Architecture

**Current File Generation Flow (Suspected):**
```
CLI Input → Path Resolution → Template Selection → File Copy → Success Report
                ↓ FAILS HERE?                         ↓ OR HERE?
```

**Investigation Focus Areas:**
1. **packages/cli/src/generator/file-ops.ts** - File copy utilities
2. **packages/cli/src/generator/index.ts** - Main generator orchestration
3. **packages/cli/src/cli.ts** - Path validation and setup

**Debugging Strategy:**
- Add verbose logging to file operations
- Test with absolute paths outside workspace
- Compare working vs failing path formats
- Check Windows vs Unix path handling

## Related Code Files

### Files to Investigate

**Generator Core:**
- `d:\Sui\walrus-starter-kit\packages\cli\src\generator\index.ts`
- `d:\Sui\walrus-starter-kit\packages\cli\src\generator\file-ops.ts`

**Path Utilities:**
- `d:\Sui\walrus-starter-kit\packages\cli\src\utils\path.ts` (if exists)

**CLI Entry:**
- `d:\Sui\walrus-starter-kit\packages\cli\src\cli.ts`
- `d:\Sui\walrus-starter-kit\packages\cli\src\index.ts`

### Files to Modify (After Investigation)

TBD based on root cause - likely file-ops.ts and index.ts

## Implementation Steps

### Step 1: Add Debug Logging to Generator (20m)

**Modify generator to log file operations:**

```typescript
// In file-ops.ts (example)
export async function copyFile(src: string, dest: string): Promise<boolean> {
  console.log(`[DEBUG] Copying: ${src} → ${dest}`);
  console.log(`[DEBUG] Src exists: ${fs.existsSync(src)}`);
  console.log(`[DEBUG] Dest dir exists: ${fs.existsSync(path.dirname(dest))}`);

  try {
    await fs.promises.copyFile(src, dest);
    console.log(`[DEBUG] Copy successful: ${dest}`);
    return true;
  } catch (error) {
    console.error(`[ERROR] Copy failed: ${error.message}`);
    return false;
  }
}
```

**Add to all file operation functions:**
- copyFile()
- copyDirectory()
- writeTemplate()
- createDirectory()

### Step 2: Reproduce Bug with Debug Logging (30m)

**Test outside workspace with logging:**
```bash
cd packages/cli
pnpm build

# Test 1: Outside workspace (Windows)
cd /d/temp
node d:/Sui/walrus-starter-kit/packages/cli/dist/index.js test-debug-win --preset react-mysten-simple-upload --skip-install

# Test 2: Outside workspace (WSL)
cd /tmp
node /mnt/d/Sui/walrus-starter-kit/packages/cli/dist/index.js test-debug-wsl --preset react-mysten-simple-upload --skip-install

# Test 3: Inside workspace (control)
cd d:/Sui/walrus-starter-kit/test-build
node ../packages/cli/dist/index.js test-debug-local --preset react-mysten-simple-upload --skip-install
```

**Capture logs to:** `research/phase02-generator-debug-logs.md`

### Step 3: Analyze Path Resolution (30m)

**Check path normalization:**
```typescript
// Add logging to path resolution
console.log(`[DEBUG] Input path: ${inputPath}`);
console.log(`[DEBUG] Resolved path: ${path.resolve(inputPath)}`);
console.log(`[DEBUG] Normalized path: ${path.normalize(inputPath)}`);
console.log(`[DEBUG] Is absolute: ${path.isAbsolute(inputPath)}`);
console.log(`[DEBUG] CWD: ${process.cwd()}`);
```

**Test path formats:**
- Windows absolute: `D:\temp\test-project`
- Unix absolute: `/tmp/test-project`
- Relative: `./test-project`
- Outside workspace: Any path not containing `walrus-starter-kit`

### Step 4: Identify Root Cause (20m)

**Common Issues to Check:**

**A. Silent Failure:**
```typescript
// Anti-pattern: Swallowing errors
try {
  await copyFile(src, dest);
} catch (error) {
  // No logging or re-throwing
}
```

**B. Path Resolution:**
```typescript
// May fail if templatePath is relative to workspace root
const templatePath = path.join(__dirname, '../../templates', templateName);
const targetPath = path.join(userInputPath, fileName);
// If userInputPath is absolute outside workspace, may resolve incorrectly
```

**C. Directory Creation:**
```typescript
// May fail if parent directories don't exist
await fs.promises.writeFile(targetPath, content);
// Should be:
await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
await fs.promises.writeFile(targetPath, content);
```

**D. Permission Checks:**
```typescript
// Missing validation before file operations
const targetDir = path.resolve(userInput);
if (!canWrite(targetDir)) {
  throw new Error(`Cannot write to ${targetDir}: Permission denied`);
}
```

### Step 5: Implement Fix (30m)

**Expected fixes (TBD based on root cause):**

**Fix A: Ensure Directory Creation:**
```typescript
async function ensureDir(dirPath: string): Promise<void> {
  await fs.promises.mkdir(dirPath, { recursive: true });
  console.log(`✓ Created directory: ${dirPath}`);
}

async function copyWithDirs(src: string, dest: string): Promise<void> {
  await ensureDir(path.dirname(dest));
  await fs.promises.copyFile(src, dest);
}
```

**Fix B: Normalize All Paths:**
```typescript
function normalizePath(inputPath: string): string {
  return path.resolve(path.normalize(inputPath));
}

const targetDir = normalizePath(userInput);
const templateDir = normalizePath(path.join(__dirname, '../../templates'));
```

**Fix C: Add Error Propagation:**
```typescript
async function copyFiles(files: string[]): Promise<void> {
  const results = await Promise.allSettled(
    files.map(file => copyFile(file.src, file.dest))
  );

  const failed = results.filter(r => r.status === 'rejected');
  if (failed.length > 0) {
    throw new Error(`Failed to copy ${failed.length} files`);
  }
}
```

**Fix D: Validate Target Directory:**
```typescript
async function validateTargetDir(dirPath: string): Promise<void> {
  const normalized = path.resolve(dirPath);

  // Check parent exists and is writable
  const parent = path.dirname(normalized);
  try {
    await fs.promises.access(parent, fs.constants.W_OK);
  } catch {
    throw new Error(`Cannot write to ${parent}: Directory not writable`);
  }
}
```

### Step 6: Test Fix Across Platforms (30m)

**Test matrix:**
```bash
# Windows (native)
cd /d/temp && test-generator.bat

# WSL
cd /tmp && bash test-generator.sh

# Linux (if available)
cd /tmp && bash test-generator.sh
```

**Test script template:**
```bash
#!/bin/bash
set -e

TEST_DIR=$(mktemp -d)
echo "Testing in: $TEST_DIR"

# Generate project
node /path/to/cli/dist/index.js "$TEST_DIR/test-walrus" --preset react-mysten-simple-upload --skip-install

# Verify files exist
if [ ! -f "$TEST_DIR/test-walrus/package.json" ]; then
  echo "❌ FAIL: package.json missing"
  exit 1
fi

echo "✓ PASS: Files created successfully"
ls -la "$TEST_DIR/test-walrus"
```

## Todo List

- [ ] Add debug logging to file-ops.ts
- [ ] Add debug logging to generator/index.ts
- [ ] Add path resolution logging to cli.ts
- [ ] Rebuild CLI with debug logging
- [ ] Test outside workspace on Windows
- [ ] Test outside workspace on WSL
- [ ] Test inside workspace (control)
- [ ] Document debug log findings
- [ ] Identify root cause (path/permission/error handling)
- [ ] Implement fix for identified root cause
- [ ] Add directory creation with recursive: true
- [ ] Add path normalization to all file ops
- [ ] Add error propagation (no silent failures)
- [ ] Add target directory validation
- [ ] Test fix on Windows native
- [ ] Test fix on WSL
- [ ] Test fix with relative paths
- [ ] Test fix with absolute paths
- [ ] Verify file count matches actual files
- [ ] Remove debug logging (or make opt-in)

## Success Criteria

### File Creation Validation
```bash
cd /tmp
node .../cli/dist/index.js test-success --preset react-mysten-simple-upload --skip-install
ls test-success/
# MUST: Show all expected files (package.json, src/, public/, etc.)
```

### File Count Validation
```bash
# Output should show accurate count
# "✓ Project generated successfully! Files created: 36"
find test-success -type f | wc -l
# MUST: Match reported count
```

### Cross-Platform Validation
```bash
# Test on Windows, WSL, Linux (if available)
# All must produce identical file structures
diff -r test-windows/ test-wsl/
# MUST: No differences (except line endings)
```

### Error Handling Validation
```bash
# Test invalid target directory
node .../cli/dist/index.js /root/forbidden --preset react-mysten-simple-upload
# MUST: Show clear error message, not silent failure
```

## Risk Assessment

**High Risk:**
- Fix may break working scenarios (inside workspace)
- **Mitigation:** Comprehensive test matrix before merging

**Medium Risk:**
- Windows-specific path handling edge cases
- **Mitigation:** Test on actual Windows (not just WSL)

**Low Risk:**
- Performance impact from additional path normalization
- **Mitigation:** Benchmark large project generation

## Security Considerations

**Path Traversal:**
- Validate user input doesn't escape intended directories
- Sanitize paths before file operations

**Permission Validation:**
- Check write permissions before starting generation
- Fail fast with clear error messages

**Example Security Check:**
```typescript
function validatePath(userPath: string, basePath: string): void {
  const normalized = path.resolve(userPath);
  const base = path.resolve(basePath);

  // Prevent writing outside allowed paths
  if (basePath && !normalized.startsWith(base)) {
    throw new Error(`Path ${userPath} is outside allowed directory`);
  }
}
```

## Next Steps

**Immediate:**
- Phase 01: Update dependencies (can run parallel)
- Phase 03: Add config templates (blocked until generator works)

**Follow-up:**
- Add integration tests for file generation
- Create test fixtures for different path scenarios
- Document supported path formats in CLI help

## Unresolved Questions

1. Why does generator count files correctly but not write them?
2. Are there other file operations affected by same bug?
3. Should we support generating into existing directories?
4. What is the correct behavior if target directory already exists?
5. Should we add --verbose flag for debugging file operations?
