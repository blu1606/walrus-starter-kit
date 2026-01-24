# Code Review: Post-Install Security & Reliability

**Reviewer:** code-reviewer (a8c23a4)
**Date:** 2026-01-18 13:00
**Scope:** packages/cli/src/post-install/
**Files:** 7 modules (package-manager.ts, walrus-deploy.ts, messages.ts, index.ts, git.ts, validator.ts)

---

## Overall Assessment

**Security Rating:** MEDIUM RISK
**Code Quality:** GOOD
Build compiles successfully. No syntax errors. Moderate security concerns requiring attention.

---

## Critical Issues

### 1. Command Injection in walrus-deploy.ts:65
**Severity:** HIGH
**File:** walrus-deploy.ts:65

```typescript
const child = spawn('bash', [scriptPath, projectPath], {
  cwd: projectPath,
  stdio: 'inherit',
  shell: true,  // ⚠️ DANGEROUS with user-controlled paths
});
```

**Issue:** `shell: true` + user-controlled `projectPath` enables command injection
**Attack vector:** Project name with special chars: `my-app; rm -rf /`

**Impact:** Arbitrary command execution, file system destruction

**Fix:** Remove `shell: true` - not needed when spawning bash directly:
```typescript
const child = spawn('bash', [scriptPath, projectPath], {
  cwd: projectPath,
  stdio: 'inherit',
  // shell: true,  // ❌ REMOVE THIS
});
```

### 2. Missing Path Validation in walrus-deploy.ts:46
**Severity:** HIGH
**File:** walrus-deploy.ts:46-53

```typescript
const scriptPath = join(projectPath, 'scripts', 'setup-walrus-deploy.sh');

if (!existsSync(scriptPath)) {
  logger.warn('⚠️  setup-walrus-deploy.sh not found');
  return;
}
```

**Issue:** No validation that `scriptPath` stays within `projectPath`
**Attack vector:** `projectPath = "../../etc/"` → execute arbitrary scripts

**Fix:** Add path traversal protection:
```typescript
import { resolve } from 'node:path';

const scriptPath = join(projectPath, 'scripts', 'setup-walrus-deploy.sh');
const resolvedPath = resolve(scriptPath);
const resolvedProject = resolve(projectPath);

// Verify script is inside project directory
if (!resolvedPath.startsWith(resolvedProject)) {
  logger.error('❌ Invalid script path detected');
  return;
}
```

### 3. Bash Script Downloads/Executes External Code
**Severity:** CRITICAL
**File:** setup-walrus-deploy.sh:43, 46

```bash
powershell -c "irm bun.sh/install.ps1 | iex"  # Line 43
curl -fsSL https://bun.sh/install | bash      # Line 46
```

**Issue:** Executes remote scripts without integrity verification
**Impact:** Supply chain attack, malicious code execution

**Recommendations:**
- Add checksum verification for downloads
- Pin specific versions, not latest
- Document security assumptions
- Consider bundling dependencies

---

## High Priority Findings

### 4. Subprocess Error Handling Incomplete
**File:** package-manager.ts:58-62, validator.ts:135-138

Error handlers resolve promises instead of rejecting:
```typescript
child.on('error', (error: Error) => {
  logger.error(`❌ Failed to run ${packageManager}: ${error.message}`);
  resolve({ success: false, duration, error });  // Should reject
});
```

**Impact:** Silent failures, unclear error propagation

**Fix:** Maintain current pattern but document rationale, or use reject for fatal errors

### 5. TypeScript Check Timeout Not Cleared on Error
**File:** validator.ts:116-138

```typescript
child.on('error', (error: Error) => {
  clearTimeout(timeout);  // ✅ Good
  resolve({ success: false, error: error.message });
});
```

Actually **correctly implemented** - timeout cleared in all branches. No issue.

### 6. Missing Input Sanitization
**File:** package-manager.ts:36, walrus-deploy.ts:65

User-controlled inputs passed to spawn without validation:
- `projectPath` - never validated for special chars
- Package manager names assumed safe from enum

**Fix:** Add input validation helper:
```typescript
function sanitizePath(path: string): string {
  // Remove shell metacharacters
  return path.replace(/[;&|`$(){}[\]]/g, '');
}
```

---

## Medium Priority Improvements

### 7. No Rollback on Partial Failures
**File:** index.ts:39-86

Post-install continues after failures:
```typescript
if (!installResult.success) {
  logger.warn('⚠️  Dependency installation failed, but project was created');
  // Continues to validation, Walrus setup
}
```

**Issue:** Leaves project in inconsistent state
**Recommendation:** Add rollback option or fail-fast mode

### 8. Deprecated Code Not Removed
**File:** git.ts:1-128

Entire file marked deprecated but still present:
```typescript
/**
 * @deprecated Git initialization has been removed from create-walrus-app.
 * This file is kept for backwards compatibility but is no longer used.
 */
```

**Impact:** Dead code bloat, confusion
**Fix:** Remove file if truly unused, or remove deprecation notice if still needed

### 9. Hard-coded GitHub Issue URL
**File:** messages.ts:75

```typescript
console.log(`Report issues: ${kleur.cyan('https://github.com/your-org/walrus-starter-kit/issues')}`);
```

**Issue:** Placeholder URL never replaced
**Fix:** Update to actual repo or make configurable

### 10. Chmod Error Silently Ignored
**File:** walrus-deploy.ts:56-60

```typescript
try {
  chmodSync(scriptPath, 0o755);
} catch (error) {
  // Ignore on Windows
}
```

**Issue:** All chmod errors ignored, not just Windows
**Fix:** Check platform before chmod or log non-Windows errors

---

## Low Priority Suggestions

### 11. Inconsistent Error Messaging
Different error styles across modules:
- `logger.error('❌ ...')`
- `logger.warn('⚠️ ...')`
- `console.log(kleur.red(...))`

**Recommendation:** Standardize on logger methods

### 12. Magic Numbers
**File:** validator.ts:119
```typescript
}, 60000); // 60s timeout
```

**Fix:** Extract to named constant:
```typescript
const TYPESCRIPT_CHECK_TIMEOUT_MS = 60_000;
```

### 13. No Telemetry/Error Reporting
Installation failures not tracked. Consider adding opt-in telemetry for diagnosing user issues.

---

## Positive Observations

✅ Uses `cross-spawn` for cross-platform compatibility
✅ Proper stdio handling (`inherit` for user visibility)
✅ Non-fatal error handling preserves user experience
✅ Interactive mode detection (TTY check)
✅ Comprehensive validation checks
✅ TypeScript strict mode passes
✅ Good separation of concerns

---

## Recommended Actions

**Immediate (Security):**
1. Remove `shell: true` from walrus-deploy.ts:68
2. Add path traversal validation in walrus-deploy.ts:46
3. Document security model for bash script execution
4. Add integrity checks to setup-walrus-deploy.sh downloads

**Short-term (Reliability):**
5. Fix chmod error handling in walrus-deploy.ts:56
6. Update GitHub URL in messages.ts:75
7. Remove git.ts if truly deprecated
8. Add input sanitization helpers

**Long-term (Quality):**
9. Implement rollback mechanism for failed installs
10. Add telemetry for failure diagnosis
11. Standardize error messaging patterns
12. Extract magic numbers to constants

---

## Metrics

- **Files Reviewed:** 7
- **Lines of Code:** ~550
- **Critical Issues:** 3 (command injection, path traversal, supply chain)
- **High Priority:** 3 (error handling, input validation)
- **Medium Priority:** 4 (rollback, deprecated code, hardcoded URLs)
- **Low Priority:** 3 (consistency, magic numbers, telemetry)
- **Type Coverage:** 100% (TypeScript strict mode)
- **Build Status:** ✅ PASS

---

## Unresolved Questions

1. Is git.ts actually unused? If so, remove it entirely
2. Should post-install failures block project creation or just warn?
3. What's the threat model - do we trust preset contents or validate everything?
4. Should Walrus deploy setup require explicit user consent for each download?
5. Are there plans to migrate from bash scripts to pure TypeScript for better security?
