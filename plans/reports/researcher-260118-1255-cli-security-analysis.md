# CLI Scaffolding Security Analysis

**Date:** 2026-01-18
**Project:** Walrus Starter Kit
**Subagent:** researcher (a43aa5d)
**Focus:** Security best practices for CLI scaffolding tools

## Executive Summary

Analyzed Walrus Starter Kit CLI against 6 security domains. **Overall assessment: STRONG foundation with minor gaps.** Project follows industry best practices for path traversal prevention, input validation, and dependency security. Key recommendations: add command injection safeguards, implement secrets detection, enhance template transformation security.

---

## 1. Path Traversal Prevention

### Current Implementation ✅

**File:** `src/validator.ts` (lines 29-60)

Strong multi-layer defense:
- Blocks relative paths (`..`)
- Blocks path separators (`/`, `\\`)
- Rejects absolute paths via `path.isAbsolute()`
- Enforces npm naming rules (`^[a-z0-9-]+$`)
- Enforces 214-char limit (npm package spec)
- Prevents leading/trailing hyphens

```typescript
// GOOD: Comprehensive validation
if (name.includes('..') || name.includes('/') || name.includes('\\\\')) {
  return 'Project name cannot contain path separators';
}
if (path.isAbsolute(name)) {
  return 'Project name cannot be an absolute path';
}
```

### Standards Alignment
- **OWASP:** Matches "Input Validation" and "Path Traversal Prevention" guidelines
- **npm Security:** Adheres to package naming spec (RFC 6068-style)
- **Industry Practice:** Similar to `create-react-app`, `create-next-app`, `degit`

**Status:** ✅ **No action needed**

---

## 2. Template Injection Vulnerabilities

### Current Implementation ⚠️

**File:** `src/generator/transform.ts` (lines 27-36)

Simple regex replacement for variables:
```typescript
return content
  .replace(/\{\{projectName\}\}/g, vars.projectName)
  .replace(/\{\{sdkName\}\}/g, vars.sdkName)
  .replace(/\{\{framework\}\}/g, vars.framework)
  .replace(/\{\{useCase\}\}/g, vars.useCase);
```

**Risk Assessment:**
- **Low-Medium risk:** Variables already validated (projectName via `validateProjectName()`, others from fixed enum choices)
- **Attack surface:** Limited to 4 predefined variables with controlled input
- **No eval/exec:** Safe string replacement, no code execution

### Potential Issues
1. **Missing HTML/JSON escaping:** If projectName used in JSON without escaping, could break syntax
2. **No context-aware encoding:** Treats all file types (.md, .json, .html, .ts) identically
3. **Regex DoS:** Simple patterns, unlikely but consider anchored replacements for performance

### Recommendations
```typescript
// IMPROVEMENT: Add context-aware escaping
function escapeForContext(value: string, fileExt: string): string {
  if (fileExt === '.json') return JSON.stringify(value).slice(1, -1); // Remove quotes
  if (fileExt === '.html') return escapeHtml(value);
  return value; // Safe for code files (already validated)
}
```

**Status:** ⚠️ **Low priority enhancement**

---

## 3. Dependency Security & Supply Chain

### Current State ✅

**Audit Results (2026-01-18):**
```json
{
  "vulnerabilities": {
    "critical": 0, "high": 0, "moderate": 0, "low": 0, "info": 0
  },
  "dependencies": 541
}
```

### Dependency Analysis

**Direct Dependencies (package.json):**
- `commander@^11.1.0` - Mature, 18K+ dependents, security track record
- `cross-spawn@^7.0.3` - Standard for subprocess spawning, well-maintained
- `fs-extra@^11.2.0` - Stable FS wrapper, widely used
- `kleur@^4.1.5` - Zero-dependency coloring library
- `prompts@^2.4.2` - Minimal attack surface, focused utility
- `sort-package-json@^2.10.1` - JSON manipulation, isolated scope

**Security Practices:**
1. ✅ Uses caret ranges (`^`) for automatic patch updates
2. ✅ Pinned to specific minor versions (no wildcards like `*` or `x`)
3. ✅ `packageManager` field enforces pnpm@9.15.4 for lockfile integrity
4. ✅ No known vulnerabilities per pnpm audit
5. ✅ Minimal dependency tree (avoids bloat)

### Supply Chain Hardening

**Missing Protections:**
- ❌ No `package-lock.json` or `pnpm-lock.yaml` committed (likely in .gitignore)
- ❌ No `integrity` field verification in package.json
- ❌ No Dependabot/Renovate automation for updates
- ❌ No SBOM (Software Bill of Materials) generation

### Recommendations
1. **Commit lockfile:** Ensure `pnpm-lock.yaml` is version-controlled for reproducible builds
2. **CI/CD checks:** Add GitHub Actions workflow for `pnpm audit` on PRs
3. **Automated updates:** Configure Dependabot for weekly dependency updates
4. **Subresource Integrity:** Consider `npm install --ignore-scripts` to prevent postinstall attacks

**Status:** ✅ **Strong baseline, add CI automation**

---

## 4. Input Validation & Sanitization

### Current Implementation ✅

**Validation Layers:**

1. **Project Name** (`src/validator.ts`):
   - Empty check, length limit, path safety, regex pattern
   - Used in `src/prompts.ts` (line 23): `validate: validateProjectName`

2. **SDK/Framework/UseCase** (`src/validator.ts`, `src/matrix.ts`):
   - Compatibility matrix enforces valid combinations
   - Enum-based choices prevent arbitrary input
   ```typescript
   if (!(COMPATIBILITY_MATRIX[sdk].frameworks as readonly string[]).includes(framework)) {
     return { valid: false, error: `...` };
   }
   ```

3. **Package Manager** (`src/prompts.ts`):
   - Limited to `['npm', 'pnpm', 'yarn', 'bun']` via select menu
   - Auto-detection with fallback

### Command Injection Risk 🔴

**File:** `src/post-install/package-manager.ts` (lines 36-42)

```typescript
const [cmd, ...args] = getInstallCommand(packageManager).split(' ');
const child = spawn(cmd, args, {
  cwd: projectPath,  // ⚠️ User-controlled via projectName
  stdio: 'inherit',
});
```

**Risk:** `projectPath` derived from `validateProjectName()` → **mitigated by strict validation**
**BUT:** If validation bypassed or modified, could enable command injection via special chars in CWD

**Similar Pattern in:**
- `src/post-install/git.ts` (git init, git add)
- `src/post-install/validator.ts` (npx tsc --noEmit)

### Recommendation
```typescript
// DEFENSE IN DEPTH: Re-validate before spawning
const safePath = path.resolve(projectPath); // Normalize
if (!fs.existsSync(safePath) || !fs.statSync(safePath).isDirectory()) {
  throw new Error('Invalid project directory');
}
```

**Status:** ⚠️ **Add defensive checks before spawning**

---

## 5. Secure File Operations

### Current Implementation ✅

**File:** `src/generator/file-ops.ts`

**Safe Patterns:**
1. **Directory Copying** (lines 12-37):
   - Excludes sensitive dirs: `['node_modules', '.git', 'dist']`
   - Uses `path.join()` to prevent traversal
   - Recursive with controlled depth

2. **Environment File Handling** (lines 60-79):
   - Checks existence before copying `.env.example` → `.env`
   - Respects existing `.env` (no overwrite)
   - Returns structured result (`{ created, reason }`)

3. **Path Operations:**
   - Uses `fs-extra` for cross-platform safety
   - `ensureDir()` creates parents without race conditions
   - `pathExists()` before operations (TOCTOU-safe via fs-extra)

### Security Strengths
- ✅ No symlink following vulnerabilities (fs-extra handles safely)
- ✅ No hardcoded credentials in templates (uses `.env.example` pattern)
- ✅ Atomic operations via fs-extra (no partial writes)

### Missing Protection
- ❌ No file size limits before copying (DoS risk if template has huge files)
- ❌ No MIME type validation (could copy executables without warning)

### Recommendation
```typescript
// ADD: File size limits
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const stats = await fs.stat(srcPath);
if (stats.size > MAX_FILE_SIZE) {
  logger.warn(`Skipping large file: ${entry.name} (${stats.size} bytes)`);
  continue;
}
```

**Status:** ✅ **Solid foundation, add size limits**

---

## 6. Secrets Management in Templates

### Current Implementation ⚠️

**Template Files:**
- ✅ `.env.example` committed (d:\Sui\walrus-starter-kit\packages\cli\presets\react-mysten-simple-upload\.env.example)
- ✅ Contains placeholders only (no actual secrets)
- ✅ Instructions direct users to copy to `.env` (line 31)

**Example Content:**
```bash
VITE_WALRUS_NETWORK=testnet
VITE_WALRUS_AGGREGATOR=https://aggregator.walrus-testnet.walrus.space
VITE_BLOCKBERRY_KEY=  # Empty placeholder
```

### Gaps
1. **No .gitignore in templates:**
   - Searched for `.gitignore` in templates directory: **0 files found**
   - Generated projects don't auto-exclude `.env` from git
   - **HIGH RISK:** Users may accidentally commit secrets

2. **No secrets detection:**
   - No pre-commit hooks (e.g., `husky` + `git-secrets`)
   - No GitHub secret scanning configuration
   - No warnings during `git add .env`

3. **Documentation:**
   - `WALRUS_SETUP.md` mentions copying `.env.example` (line 52)
   - No explicit warnings about not committing `.env`

### Industry Best Practices
- **create-react-app:** Includes `.gitignore` with `.env.local` entry
- **Next.js:** Auto-generates `.gitignore` with comprehensive env exclusions
- **Vite:** Warns about `VITE_*` prefix exposure in client bundles

### Recommendations
```bash
# ADD: templates/base/.gitignore
# Environment files
.env
.env.local
.env.*.local

# Walrus config
.walrus/

# OS files
.DS_Store
Thumbs.db
```

```typescript
// ADD: Post-install warning
logger.warn('⚠️  SECURITY: Never commit .env files to version control');
logger.info('✓ Added .env to .gitignore');
```

**Status:** 🔴 **CRITICAL: Add .gitignore to templates**

---

## Risk Summary

| Domain | Status | Priority | Impact |
|--------|--------|----------|--------|
| Path Traversal Prevention | ✅ Strong | - | Low |
| Template Injection | ⚠️ Low risk | P3 | Low |
| Dependency Security | ✅ Clean | P2 (CI) | Low |
| Input Validation | ⚠️ Good | P2 | Medium |
| File Operations | ✅ Solid | P3 | Low |
| Secrets Management | 🔴 Gap | **P0** | **High** |

---

## Recommendations (Prioritized)

### P0 - Critical (Implement Immediately)
1. **Add `.gitignore` to all template presets** with `.env` exclusion
2. **Display security warning** post-generation about env files
3. **Verify .gitignore copied** in post-install validator

### P1 - High (Next Sprint)
4. **Add command injection safeguards** in spawn calls (path.resolve + existence check)
5. **Commit lockfile** (`pnpm-lock.yaml`) to repository

### P2 - Medium (Backlog)
6. **Add CI/CD security checks** (pnpm audit, Dependabot)
7. **Implement file size limits** in copyDirectory (50MB cap)
8. **Add context-aware escaping** in template transformations

### P3 - Low (Nice to Have)
9. **Generate SBOM** for dependency transparency
10. **Add pre-commit hooks** (husky + lint-staged) to templates

---

## Unresolved Questions

1. **Deployment targets:** Are generated apps deployed to public infrastructure? (Affects secrets exposure risk)
2. **User base:** Enterprise vs hobbyist? (Determines acceptable security baseline)
3. **Release cadence:** How often are dependencies updated? (Informs automation priority)
4. **Lockfile policy:** Why is lockfile not committed? (Version control best practice)

---

## Conclusion

Walrus Starter Kit demonstrates **mature security practices** for path validation and dependency management. Critical gap: **missing .gitignore in templates** creates high risk of accidental secrets exposure. Recommended immediate action: add comprehensive .gitignore to all presets and post-generation warnings.

**Overall Grade:** B+ (would be A with .gitignore fix)

---

**Report Path:** `d:\Sui\walrus-starter-kit\plans\reports\researcher-260118-1255-cli-security-analysis.md`
