# Release Deployment Analysis Report

**Date:** 2026-01-17 21:35
**Analyst:** debugger agent
**Scope:** GitHub Actions CI/CD pipeline failures

---

## Executive Summary

**Issue:** CI workflow consistently failing on lint step; Release workflow never executed.
**Root Cause:** Untracked `debug-test` directory with ESLint config requiring React plugins not installed at monorepo root.
**Business Impact:** Blocks all CI/CD operations, prevents package releases to npm.
**Priority:** HIGH - CI completely broken, no successful builds since multiple commits.

---

## Technical Analysis

### Timeline of Events

**All Recent CI Runs (Last 10):** Failed
- Latest: Run #21095813068 (2026-01-17 14:31:59 UTC)
- Pattern: All failures at lint step with identical error
- No release workflow runs found (workflow exists but never triggered)

### Evidence from Logs

**Primary Failure Pattern:**
```
ESLint couldn't find the plugin "eslint-plugin-react".
The package "eslint-plugin-react" was not found when loaded as a Node module
from the directory "/home/runner/work/walrus-starter-kit/walrus-starter-kit/debug-test".

The plugin "eslint-plugin-react" was referenced from the config file in "debug-test/.eslintrc.json".
```

**Secondary Issue:**
```
WARN  Issue while reading "/.../walrus-starter-kit/.npmrc".
Failed to replace env in config: ${NPM_TOKEN}
```

### System Behavior Analysis

**Directory Structure Issue:**
```
walrus-starter-kit/
├── .eslintrc.json          # Root config (TypeScript only, no React plugins)
├── debug-test/             # UNTRACKED test directory
│   ├── .eslintrc.json      # Requires React plugins
│   └── package.json        # Has React deps as devDeps
└── packages/
    └── cli/
        └── templates/
            └── react/
                └── .eslintrc.json  # React config (valid)
```

**Root ESLint Config:** TypeScript-focused, no React plugins
**Debug-test ESLint Config:** Requires `eslint-plugin-react` and `eslint-plugin-react-hooks`

**Problem:** When `pnpm lint` runs at root, ESLint discovers `debug-test/.eslintrc.json` but cannot find React plugins because:
1. They're not in root `package.json` devDependencies
2. `debug-test` appears to be a standalone test project (not in workspaces)
3. pnpm workspace hoisting doesn't link debug-test deps to root

### Database Query Analysis
N/A - No database involved

### Performance Metrics
- Build time: ~2 minutes to failure
- Failure point: Always at lint step (first job)
- No builds reaching test/build/integration phases

---

## Root Cause Identification

**Primary Cause:** Untracked `debug-test` directory with conflicting ESLint configuration

**Contributing Factors:**
1. `debug-test` not added to `.gitignore`
2. `debug-test` not in workspace configuration
3. Root ESLint config doesn't exclude debug/test directories
4. No pre-commit hooks to catch untracked test directories

**Validation Evidence:**
- git status shows `debug-test` untracked but present in working tree
- ESLint error specifically references `debug-test/.eslintrc.json`
- Package.json workspaces array doesn't include debug-test
- All other eslint configs (templates/react) are in proper locations

---

## Release Workflow Analysis

### Configuration Review

**Release Workflow (`.github/workflows/release.yml`):**
```yaml
Trigger: workflow_dispatch (manual only)
Registry: registry.npmjs.org
Secrets Used: NPM_TOKEN, GITHUB_TOKEN
Permissions: contents:write, id-token:write
Working Dir: packages/cli
```

**Semantic Release Config (`packages/cli/.releaserc.json`):**
```json
{
  "branches": ["main"],
  "tagFormat": "@walrus-kit/create-walrus-app-v${version}",
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@semantic-release/npm" (with provenance),
    "@semantic-release/github",
    "@semantic-release/git"
  ]
}
```

**Package Config (`packages/cli/package.json`):**
```json
{
  "name": "@blu1606/create-walrus-app",
  "version": "0.1.0",
  "publishConfig": {
    "access": "public"
  }
}
```

**NPM Registry Config (`.npmrc`):**
```
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
```

### Issues Identified

1. **Release Never Triggered:** No runs in workflow history
   - Manual trigger only (workflow_dispatch)
   - Never executed since creation

2. **NPM Token Warning:** `.npmrc` attempts to read `${NPM_TOKEN}` during install
   - Variable not set in non-release jobs
   - Causes warnings but doesn't block (install succeeds)

3. **Tag Format Mismatch:**
   - Config uses: `@walrus-kit/create-walrus-app-v${version}`
   - Package name: `@blu1606/create-walrus-app`
   - Scope mismatch (`@walrus-kit` vs `@blu1606`)

4. **Provenance Enabled:** `"provenance": true` requires `id-token:write` permission
   - Correctly configured in workflow
   - But untested since never run

---

## Actionable Recommendations

### IMMEDIATE (Critical - Unblock CI)

**1. Remove debug-test directory**
```bash
# Option A: Delete entirely
rm -rf debug-test

# Option B: Add to .gitignore
echo "debug-test/" >> .gitignore
git rm -r --cached debug-test
```

**2. Verify lint passes**
```bash
pnpm lint
```

**3. Commit and push**
```bash
git add .gitignore
git commit -m "fix(ci): remove debug-test directory blocking eslint"
git push
```

**Expected Result:** CI should pass on next push

---

### SHORT-TERM (Fix Release Configuration)

**4. Fix semantic-release tag format**

Edit `packages/cli/.releaserc.json`:
```json
{
  "tagFormat": "@blu1606/create-walrus-app-v${version}"
}
```

**5. Conditional .npmrc to prevent warnings**

Edit `.npmrc`:
```
shamefully-hoist=true
strict-peer-dependencies=false
engine-strict=true
```

Create `packages/cli/.npmrc`:
```
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
```

**6. Verify NPM_TOKEN secret**
```bash
gh secret list
# Should show: NPM_TOKEN
```

**7. Test release dry-run**
```bash
cd packages/cli
npx semantic-release --dry-run
```

**Expected Result:** Dry-run shows what would be released without errors

---

### LONG-TERM (Prevent Recurrence)

**8. Add ESLint ignore patterns**

Edit `.eslintrc.json`:
```json
{
  "ignorePatterns": ["debug-test", "**/*.test.js", "tmp", "temp"]
}
```

**9. Enhance .gitignore**
```
# Test/Debug directories
debug-test/
temp/
tmp/
*.local/

# Build artifacts
dist/
coverage/
*.tgz

# Environment files
.env.local
.env.*.local
```

**10. Add pre-commit hooks**

Create `.husky/pre-commit`:
```bash
#!/bin/sh
pnpm lint
pnpm test
```

**11. Setup automated releases**

Option A - CI trigger:
```yaml
# .github/workflows/release.yml
on:
  push:
    branches: [main]
```

Option B - Keep manual but document:
```markdown
# README.md
## Releasing
1. Ensure all tests pass
2. Go to Actions > Release
3. Click "Run workflow"
```

**12. Add release validation job to CI**

Add to `.github/workflows/ci.yml`:
```yaml
semantic-release-dry-run:
  name: Test Release Process
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Setup pnpm
      uses: pnpm/action-setup@v2
      with:
        version: 9
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
    - name: Install dependencies
      run: pnpm install --frozen-lockfile
    - name: Build packages
      run: pnpm build
    - name: Test semantic-release
      working-directory: packages/cli
      run: npx semantic-release --dry-run
```

---

## Supporting Evidence

### Log Excerpts

**Lint Failure (Run #21095813068):**
```
Lint  Run linter  2026-01-17T14:32:12.2645001Z ESLint couldn't find the plugin "eslint-plugin-react".
Lint  Run linter  2026-01-17T14:32:12.2646743Z (The package "eslint-plugin-react" was not found...)
Lint  Run linter  2026-01-17T14:32:12.2650910Z The plugin "eslint-plugin-react" was referenced from "debug-test/.eslintrc.json".
Lint  Run linter  2026-01-17T14:32:12.2801328Z  ELIFECYCLE  Command failed with exit code 2.
```

**NPM Token Warning (Non-blocking):**
```
Lint  Run linter  2026-01-17T14:32:11.4593609Z  WARN  Issue while reading ".npmrc". Failed to replace env in config: ${NPM_TOKEN}
```

### Query Results

**Git Status:**
```
Untracked files:
  debug-test/
```

**Workflow Runs:**
```json
{
  "ci_runs": 9,
  "ci_failures": 9,
  "ci_success": 0,
  "release_runs": 0
}
```

**Repository Secrets:**
```
NPM_TOKEN (configured)
GITHUB_TOKEN (automatic)
```

### Test Results

N/A - Cannot reach test phase due to lint failure

---

## Risk Assessment

**High Risk:**
- Complete CI blockage prevents any PRs from merging safely
- No releases possible until CI fixed
- Potential to accumulate more untracked debris

**Medium Risk:**
- Tag format mismatch could cause release confusion
- Missing .gitignore entries risk committing test artifacts
- Manual release process prone to human error

**Low Risk:**
- NPM token warning cosmetic (doesn't block)
- Provenance setup appears correct
- Semantic-release config mostly valid

---

## Mitigation Strategies

**Immediate CI Fix:**
1. Remove debug-test directory
2. Verify with local `pnpm lint`
3. Commit and monitor next CI run

**Release Process:**
1. Fix tag format before first release
2. Test with `--dry-run` flag
3. Document manual release steps
4. Consider automation after first successful release

**Preventive Measures:**
1. Update .gitignore comprehensively
2. Add ESLint ignore patterns
3. Implement pre-commit hooks
4. Add release dry-run to CI

**Monitoring:**
1. Watch next 3 CI runs for stability
2. Monitor semantic-release dry-run in CI
3. Track first real release execution
4. Review npm package page after publish

---

## Unresolved Questions

1. Purpose of `debug-test` directory? Safe to delete or should preserve?
2. Should release workflow be automated (on push to main) or stay manual?
3. Any need for GitHub Packages publishing alongside npm?
4. Should monorepo use individual package versioning or synchronized versions?
5. Need for CHANGELOG.md in root alongside packages/cli/CHANGELOG.md?
6. Strategy for handling breaking changes across template versions?
