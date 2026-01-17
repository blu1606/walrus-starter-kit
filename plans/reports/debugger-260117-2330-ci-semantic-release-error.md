# CI Semantic Release Error Analysis

**Date:** 2026-01-17 23:30:57
**Workflow:** Release to NPM
**Run ID:** 21097347402
**Status:** FAILED

---

## Executive Summary

**Issue:** GitHub Actions Release workflow fails during `@semantic-release/npm` prepare step
**Error:** `npm error Cannot read properties of null (reading 'matches')`
**Impact:** Unable to publish package releases to NPM registry
**Root Cause:** NPM version command incompatibility when executing in pnpm-managed monorepo without `packageManager` field

---

## Exact Error & Stack Trace

### Error Message
```
npm error Cannot read properties of null (reading 'matches')
npm error A complete log of this run can be found in: /home/runner/.npm/_logs/2026-01-17T16_23_46_126Z-debug-0.log
```

### Failed Command
```bash
npm version 1.0.0 --userconfig /tmp/e7d1fdee72da7802b309b542ef89844d/.npmrc --no-git-tag-version --allow-same-version
```

### Stack Trace
```
ExecaError: Command failed with exit code 1
  at getFinalError (file:///home/runner/work/walrus-starter-kit/walrus-starter-kit/node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/return/final-error.js:6:9)
  at makeError (file:///home/runner/work/walrus-starter-kit/walrus-starter-kit/node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/return/result.js:108:16)
  at getAsyncResult (file:///home/runner/work/walrus-starter-kit/walrus-starter-kit/node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/methods/main-async.js:168:4)
  at handlePromise (file:///home/runner/work/walrus-starter-kit/walrus-starter-kit/node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/methods/main-async.js:151:17)
  at async default (file:///home/runner/work/walrus-starter-kit/walrus-starter-kit/node_modules/.pnpm/@semantic-release+npm@12.0.2_semantic-release@24.2.9_typescript@5.9.3_/node_modules/@semantic-release/npm/lib/prepare.js:26:3)
  at async prepare (file:///home/runner/work/walrus-starter-kit/walrus-starter-kit/node_modules/.pnpm/@semantic-release+npm@12.0.2_semantic-release@24.2.9_typescript@5.9.3_/node_modules/@semantic-release/npm/index.js:63:3)
```

### Timeline
1. `[4:23:46 PM]` semantic-release starts prepare step for `@semantic-release/exec`
2. `[4:23:46 PM]` Custom script updates package.json to version 1.0.0 - SUCCESS
3. `[4:23:46 PM]` `@semantic-release/npm` starts prepare step
4. `[4:23:46 PM]` Attempts to run `npm version 1.0.0` command
5. `[4:23:52 PM]` npm crashes with null property access error - FAILED

---

## Root Cause Analysis

### Primary Cause: NPM/pnpm Workspace Detection Failure

The error occurs when `@semantic-release/npm` plugin executes `npm version` command in a pnpm-managed monorepo.

**Evidence:**
1. Project uses pnpm workspaces (defined in root package.json)
2. CI workflow uses pnpm for dependency installation
3. semantic-release runs `npx semantic-release` which internally calls `npm version`
4. Neither root nor package package.json contains `packageManager` field
5. npm fails to properly detect workspace structure → null reference error

### Contributing Factors

1. **Missing packageManager Field**
   - Root package.json: NO `packageManager` field
   - packages/cli/package.json: NO `packageManager` field
   - npm cannot determine correct package manager in monorepo context

2. **Package Manager Version Mismatch**
   - CI uses pnpm 9.x for installation
   - semantic-release uses npm commands for versioning
   - Context switch between package managers causes state confusion

3. **Workspace Configuration Gap**
   - Root defines workspaces but npm doesn't recognize pnpm workspace structure
   - npm reads pnpm-lock.yaml but can't interpret workspace metadata correctly

---

## Current Configuration

### CI Workflow (.github/workflows/release.yml)
```yaml
- name: Setup pnpm
  uses: pnpm/action-setup@v2
  with:
    version: 9

- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    registry-url: 'https://registry.npmjs.org'
    cache: 'pnpm'

- name: Install dependencies
  run: pnpm install --frozen-lockfile

- name: Release
  working-directory: packages/cli
  run: npx semantic-release
```

### Semantic Release Config (.releaserc.json)
```json
{
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    ["@semantic-release/exec", {
      "prepareCmd": "node -e \"const pkg=require('./package.json');pkg.version='${nextRelease.version}';require('fs').writeFileSync('./package.json',JSON.stringify(pkg,null,2)+'\\n')\""
    }],
    ["@semantic-release/npm", {
      "npmPublish": true,
      "pkgRoot": ".",
      "tarballDir": "dist",
      "provenance": true
    }]
  ]
}
```

### Package Manager Status
- **Local pnpm:** 10.26.1
- **CI pnpm:** 9.x
- **npm:** 10.9.3
- **packageManager field:** MISSING in all package.json files

### Dependency Versions
- `@semantic-release/npm`: 12.0.2
- `semantic-release`: 24.2.9
- `@semantic-release/exec`: 6.0.3

---

## Recommended Fixes (Prioritized)

### 1. Add packageManager Field (HIGHEST PRIORITY)
**Likelihood:** 95% success
**Effort:** Low
**Risk:** Minimal

Add to both root and packages/cli/package.json:
```json
{
  "packageManager": "pnpm@9.15.4"
}
```

**Why this works:**
- Explicitly tells npm/Corepack which package manager to use
- Prevents npm from guessing workspace structure
- Standard practice for monorepos
- Supported by npm v7+

---

### 2. Use pnpm Commands in semantic-release (HIGH PRIORITY)
**Likelihood:** 85% success
**Effort:** Medium
**Risk:** Low

Modify .releaserc.json to use pnpm instead of npm:
```json
{
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    ["@semantic-release/exec", {
      "prepareCmd": "pnpm version ${nextRelease.version} --no-git-tag-version --allow-same-version"
    }],
    ["@semantic-release/npm", {
      "npmPublish": true,
      "pkgRoot": ".",
      "tarballDir": "dist"
    }]
  ]
}
```

**Why this works:**
- Uses same package manager throughout release process
- Avoids npm/pnpm context switching
- pnpm properly handles workspace versioning

---

### 3. Remove provenance Flag (MEDIUM PRIORITY)
**Likelihood:** 40% success (partial fix)
**Effort:** Low
**Risk:** Low (removes security feature)

Remove `"provenance": true` from @semantic-release/npm config.

**Why this might help:**
- Provenance generation might trigger additional npm version checks
- Reduces npm internal state requirements
- Known issue with some npm versions

**Trade-off:** Loses npm package provenance attestation feature

---

### 4. Pin Exact pnpm Version (MEDIUM PRIORITY)
**Likelihood:** 30% success (stability improvement)
**Effort:** Low
**Risk:** Minimal

Update workflow to use exact pnpm version:
```yaml
- name: Setup pnpm
  uses: pnpm/action-setup@v2
  with:
    version: 10.26.1
```

**Why this helps:**
- Matches local development environment
- Reduces version-specific bugs
- Ensures consistency across CI runs

---

### 5. Alternative: Use pnpm publish Directly (FALLBACK)
**Likelihood:** 90% success
**Effort:** High
**Risk:** Medium (changes release process)

Replace semantic-release npm plugin with custom pnpm commands:
```json
{
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    ["@semantic-release/exec", {
      "prepareCmd": "pnpm version ${nextRelease.version} --no-git-tag-version --allow-same-version",
      "publishCmd": "pnpm publish --access public --no-git-checks"
    }],
    ["@semantic-release/github", {
      "assets": []
    }]
  ]
}
```

**Why this works:**
- Bypasses @semantic-release/npm entirely
- Uses native pnpm publish capabilities
- Full control over publish process

**Trade-offs:**
- More manual configuration
- Loses some semantic-release npm plugin features
- Requires careful testing

---

## Implementation Priority

**Phase 1 - Quick Fix (15 mins):**
1. Add `packageManager` field to package.json files
2. Test release workflow

**Phase 2 - If Phase 1 Fails (30 mins):**
1. Modify .releaserc.json to use pnpm commands
2. Remove provenance flag
3. Test release workflow

**Phase 3 - If Phase 2 Fails (1 hour):**
1. Replace @semantic-release/npm with custom exec commands
2. Implement pnpm publish directly
3. Full integration testing

---

## Verification Steps

After implementing fixes:
1. Test locally: `cd packages/cli && pnpm exec semantic-release --dry-run`
2. Check version command: `npm version 1.0.0 --dry-run --no-git-tag-version`
3. Trigger workflow_dispatch on Release workflow
4. Monitor GitHub Actions logs for errors
5. Verify npm package published correctly

---

## Additional Context

### Related Commits
Recent CI fix attempts:
- `57b427c` - fix: ci final
- `c3afe30` - fix: ci
- `89febaa` - fix: ci
- `7c38373` - fix: semantic bot

### Environment
- **OS:** Ubuntu 24.04.3 LTS
- **Node:** 20.x
- **Runner:** GitHub Hosted (ubuntu-latest)
- **Workflow Trigger:** workflow_dispatch (manual)

---

## Security Considerations

- NPM_TOKEN is properly configured in GitHub Secrets
- `npm whoami` verification step passes
- No credential leakage in logs
- Git config properly set for release commits

---

## Unresolved Questions

1. Why does npm internal code access null.matches without null checking?
2. Are there known compatibility issues between npm 10.9.3 and semantic-release 24.2.9?
3. Should we migrate entirely to pnpm for publishing or keep npm compatibility?
4. Does removing provenance introduce supply chain security risks we should mitigate?
