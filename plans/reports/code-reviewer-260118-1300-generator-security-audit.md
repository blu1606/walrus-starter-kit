# Code Review: Generator Module Security & Quality Audit

**Date:** 2026-01-18
**Reviewer:** code-reviewer (a8f864f)
**Focus:** Security vulnerabilities, path traversal, template injection, file operations safety

## Scope

**Files Reviewed:**
- `packages/cli/src/generator/index.ts` (114 lines)
- `packages/cli/src/generator/layers.ts` (71 lines)
- `packages/cli/src/generator/transform.ts` (72 lines)
- `packages/cli/src/generator/file-ops.ts` (80 lines)
- `packages/cli/src/generator/types.ts` (30 lines)

**Review Focus:** Recent changes, security vulnerabilities, production readiness
**Test Coverage:** 95 passing tests across 11 test files
**Build Status:** TypeScript compilation successful

---

## Overall Assessment

**Security Posture:** GOOD with minor improvements needed
**Code Quality:** HIGH - well-structured, tested, maintainable
**Production Readiness:** READY with recommendations

Generator module demonstrates strong security awareness with path traversal protection and comprehensive testing. Code is clean, well-documented, and follows TypeScript best practices.

---

## Critical Issues

**None identified.** No security vulnerabilities or breaking issues found.

---

## High Priority Findings

### 1. **Path Traversal Protection - Needs Enhancement**
**Location:** `file-ops.ts:12-36` (copyDirectory), `transform.ts:42-71` (transformDirectory)

**Issue:** Recursive directory operations lack explicit path validation during traversal.

**Current Implementation:**
```typescript
// file-ops.ts:24-25
const srcPath = path.join(src, entry.name);
const destPath = path.join(dest, entry.name);
```

**Risk:** While `layers.ts:14-23` validates preset paths, symlink attacks or malicious preset content could escape target directory during recursive copy/transform.

**Impact:** Medium - mitigated by preset source control but vulnerable to supply chain attacks

**Recommendation:**
Add boundary validation in recursive functions:
```typescript
// In copyDirectory before line 24
const normalizedSrc = path.resolve(srcPath);
const normalizedDest = path.resolve(destPath);
const rootDest = path.resolve(dest);

if (!normalizedDest.startsWith(rootDest)) {
  throw new Error(`Path traversal detected: ${entry.name}`);
}
```

**Priority:** HIGH - implement before production release with untrusted presets

---

### 2. **Symlink Handling Not Specified**
**Location:** `file-ops.ts:27-29`, `transform.ts:63-64`

**Issue:** No explicit handling of symbolic links during file operations.

**Current Code:**
```typescript
// file-ops.ts:27-28
if (entry.isDirectory()) {
  await fs.ensureDir(destPath);
  filesCreated += await copyDirectory(srcPath, destPath, exclude);
}
```

**Risk:** Symlinks could:
- Point outside preset directory (information disclosure)
- Create infinite loops (DoS)
- Override critical files (privilege escalation)

**Recommendation:**
```typescript
if (entry.isSymbolicLink()) {
  logger.warn(`Skipping symlink: ${entry.name}`);
  continue; // or throw error for stricter security
}
```

**Priority:** HIGH - add before supporting external/community presets

---

### 3. **Template Variable Injection - SECURE**
**Location:** `transform.ts:27-36`

**Status:** ✅ **RESOLVED** - Input validation prevents injection attacks

**Current Implementation:**
```typescript
return content
  .replace(/\{\{projectName\}\}/g, vars.projectName)
  .replace(/\{\{sdkName\}\}/g, vars.sdkName)
  // ...
```

**Security Analysis:**
- **`projectName`:** Validated by `validator.ts:29-60` with strict regex `[a-z0-9-]+` - shell/path injection impossible
- **`sdkName`:** TypeScript enum `'mysten' | 'tusky' | 'hibernuts'` - type-safe, no user input
- **`framework`:** TypeScript enum `'react' | 'vue' | 'plain-ts'` - type-safe, no user input
- **`useCase`:** TypeScript enum `'simple-upload' | 'gallery' | 'defi-nft'` - type-safe, no user input

**Conclusion:** Template transformation is **SECURE** - all variables either type-safe enums or validated input

**Priority:** ✅ RESOLVED - No action needed

---

## Medium Priority Improvements

### 4. **Error Messages Expose Internal Paths**
**Location:** `index.ts:26`, `layers.ts:20`, `index.ts:42`

**Issue:** Error messages reveal absolute filesystem paths.

```typescript
// index.ts:26
throw new Error(`Directory ${targetDir} is not empty...`);

// layers.ts:19-21
throw new Error(
  `Invalid preset path: ${presetPath} is outside presets root`
);
```

**Risk:** Information disclosure for reconnaissance attacks (Low severity - CLI tool)

**Recommendation:** Use relative paths or sanitize error messages for production builds

**Priority:** MEDIUM - acceptable for CLI tool, improve for web-based generator

---

### 5. **Race Condition in Directory Empty Check**
**Location:** `index.ts:23-29`

**Issue:** TOCTOU (Time-of-check-time-of-use) gap between empty check and directory creation.

```typescript
const isEmpty = await isDirectoryEmpty(targetDir); // Check
if (!isEmpty) throw new Error(...);
await ensureDirectory(targetDir); // Use
```

**Risk:** Concurrent operations could create files between check/use

**Impact:** Low - CLI tool single-user context, unlikely race condition

**Recommendation:** Use atomic operations or add file locking for concurrent usage

**Priority:** MEDIUM - document as known limitation for now

---

### 6. **Rollback Error Swallowing**
**Location:** `index.ts:94-104`

**Issue:** Rollback errors logged but not re-thrown, partial cleanup state unclear.

```typescript
try {
  await fs.remove(targetDir);
} catch (rollbackError) {
  logger.error(`Failed to rollback: ${rollbackError}`);
  // Error not re-thrown
}
```

**Recommendation:** Return rollback status in GeneratorResult for caller handling

**Priority:** MEDIUM - improve error recovery UX

---

### 7. **File Extension Allowlist Hardcoded**
**Location:** `transform.ts:45-56`

**Issue:** Transformation extensions hardcoded, no configuration option.

```typescript
extensions: string[] = [
  '.md', '.json', '.html', '.ts', '.tsx', '.js', '.jsx', '.css', '.scss', '.vue',
]
```

**Risk:** Binary files accidentally included could corrupt if transformed

**Recommendation:**
- Add `.gitignore` style exclusions (`.png`, `.jpg`, `.woff`, `.ttf`, `.ico`)
- Make extensions configurable per preset

**Priority:** MEDIUM - prevent edge-case corruption

---

## Low Priority Suggestions

### 8. **Performance: Parallel File Processing**
**Location:** `transform.ts:60-70`, `file-ops.ts:21-34`

Sequential file processing in `transformDirectory` and `copyDirectory`.

**Optimization:**
```typescript
const transformPromises = entries
  .filter(entry => extensions.some(ext => entry.name.endsWith(ext)))
  .map(entry => transformFile(entry));
await Promise.all(transformPromises);
```

**Priority:** LOW - current performance adequate for typical project sizes

---

### 9. **Missing File Size Validation**
**Location:** `transform.ts:66`

No check for excessively large files before reading into memory.

**Risk:** OOM on malicious/corrupted preset with multi-GB text file

**Recommendation:**
```typescript
const stats = await fs.stat(fullPath);
if (stats.size > 10_000_000) { // 10MB limit
  logger.warn(`Skipping large file: ${entry.name}`);
  continue;
}
```

**Priority:** LOW - presets are trusted sources

---

### 10. **Dry Run Mode Incomplete**
**Location:** `index.ts:77-79`

Dry run only logs env copy, doesn't show file list or template diff.

**Enhancement:** Return full manifest of planned operations for user review

**Priority:** LOW - nice-to-have feature

---

## Positive Observations

**Excellent Security Practices:**
1. ✅ Path traversal validation in `layers.ts:14-23` with `path.resolve()` and `startsWith()` check
2. ✅ Comprehensive test coverage (95 tests) including security test at `layers.test.ts:133-151`
3. ✅ TypeScript strict types prevent many injection attacks via enum constraints
4. ✅ Rollback mechanism on generation failure (`index.ts:94-104`)
5. ✅ Preset path validation before fs operations (`index.ts:38-45`)

**Code Quality Highlights:**
1. ✅ Clean separation of concerns (orchestration, path resolution, transformation, file ops)
2. ✅ Proper error handling with informative messages
3. ✅ Well-documented functions with JSDoc comments
4. ✅ Consistent coding style and naming conventions
5. ✅ No `any` types - full TypeScript coverage post-refactor (`cf8c3c0`)

**Recent Improvements:**
- Fixed TypeScript types (`cf8c3c0`)
- Added zkLogin/Enoki support with proper enum handling
- Automatic `.env` file creation with safety checks
- Comprehensive test suite for file operations

---

## Recommended Actions

### Immediate (Before Next Release)
1. ~~**Verify CLI Input Sanitization**~~ ✅ **COMPLETE** - `validator.ts` implements comprehensive validation
2. **Add Symlink Detection** - Skip or error on symlinks in `copyDirectory` and `transformDirectory`
3. **Enhance Path Validation** - Add recursive boundary checks in file operations
4. **Document Security Model** - Clarify trusted vs untrusted preset sources

### Short-term (Next Sprint)
5. **Improve Error Messages** - Sanitize internal paths in production
6. **Add Binary File Protection** - Exclude binary extensions from transformation
7. **Return Rollback Status** - Include cleanup state in GeneratorResult

### Long-term (Future Enhancements)
8. **Performance Optimization** - Parallel file processing for large presets
9. **Enhanced Dry Run** - Full operation manifest with file diffs
10. **Preset Signing** - Verify preset integrity for community contributions

---

## Security Considerations

**Threat Model:**
- **Trusted Presets:** Built-in presets in `packages/cli/presets/` (LOW risk)
- **User Input:** `projectName` from CLI prompts (MEDIUM risk - verify sanitization)
- **Supply Chain:** Future community presets (HIGH risk - needs signing/vetting)

**Current Posture:** SECURE for trusted presets, needs hardening for untrusted sources

**Key Controls:**
1. Path traversal prevention ✅
2. Input validation ✅ (`validator.ts:29-60`)
3. Symlink protection ❌ (add)
4. File size limits ❌ (optional)
5. Preset integrity ❌ (future)

---

## Metrics

**Type Coverage:** 100% (no `any` types)
**Test Coverage:** 95 tests passing, 11 test files
**Linting Issues:** 0 (build successful)
**Security Tests:** 1 explicit path traversal test
**Documentation:** Good (JSDoc on key functions)

---

## Input Validation Analysis (RESOLVED)

**Location:** `validator.ts:29-60` (validateProjectName)

✅ **EXCELLENT** - Comprehensive input sanitization implemented:

```typescript
// Line 41-43: Path traversal prevention
if (name.includes('..') || name.includes('/') || name.includes('\\')) {
  return 'Project name cannot contain path separators';
}

// Line 46-48: Absolute path prevention
if (path.isAbsolute(name)) {
  return 'Project name cannot be an absolute path';
}

// Line 51-53: Shell-safe character allowlist
if (!/^[a-z0-9-]+$/.test(name)) {
  return 'Project name must contain only lowercase letters, numbers, and hyphens';
}
```

**Security Controls Verified:**
1. ✅ Path traversal blocked (`..`, `/`, `\`)
2. ✅ Absolute paths rejected (`path.isAbsolute()`)
3. ✅ Shell injection prevented (strict regex `[a-z0-9-]+`)
4. ✅ Null byte protection (implicit via regex)
5. ✅ Length limit enforced (214 chars - npm standard)
6. ✅ Leading/trailing hyphen validation (line 55-57)

**Prompt Integration:** `prompts.ts:23` calls `validate: validateProjectName` before reaching generator

**Conclusion:** Template injection via `projectName` is **NOT POSSIBLE** - input fully sanitized

---

## Unresolved Questions

1. **Preset Trust Model:** Will future versions support external/community presets? If yes, implement preset signing and sandboxed execution.

2. **Concurrent Usage:** Should generator support parallel invocations? If yes, implement file locking and atomic operations.

3. **Windows Path Handling:** Are Windows UNC paths (`\\?\`) and drive letters handled correctly in path validation? (Test on Windows)

4. **Template Injection Scope:** Are there any preset files that execute transformed content (e.g., shell scripts, npm scripts)? Review preset templates for eval/exec patterns.
