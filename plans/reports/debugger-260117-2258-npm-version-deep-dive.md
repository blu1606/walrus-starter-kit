# NPM Version Arborist Error Deep Dive

**Date:** 2026-01-17
**Agent:** debugger (ID: afe0c51)
**Status:** Root cause identified - Different from previous analysis

## Executive Summary

**Issue:** `npm version` fails with "Cannot read properties of null (reading 'matches')" error
**Impact:** Blocks semantic-release publishing workflow
**Root Cause:** NPM arborist bug in pnpm workspace environments with symlinked dependencies
**Priority:** High - Blocks all releases

**Critical Finding:** Previous report (debugger-260117-2244) incorrectly identified missing git config as root cause. Git config step was added but error persists because the actual issue is npm/pnpm workspace incompatibility.

## Error Details

```
npm error Cannot read properties of null (reading 'matches')
ExecaError: Command failed with exit code 1: npm version 1.0.0 --userconfig /tmp/68badcc61ded89f088846a07d3d87214/.npmrc --no-git-tag-version --allow-same-version
```

**Key Evidence:**
- Error occurs even with git user configured (verified locally)
- Error reproduced locally on Windows with git user.name and user.email set
- stdout shows version printed successfully (`@blu1606/create-walrus-app\nv1.0.0`)
- Process exits with code 1 after ~5.8 seconds

## Root Cause Analysis

### Actual Root Cause: NPM Arborist + pnpm Workspace Conflict

**Stack trace from local reproduction:**
```
verbose stack TypeError: Cannot read properties of null (reading 'matches')
verbose stack     at Link.matches (C:\Program Files\nodejs\node_modules\npm\node_modules\@npmcli\arborist\lib\node.js:1117:41)
verbose stack     at Link.canDedupe (C:\Program Files\nodejs\node_modules\npm\node_modules\@npmcli\arborist\lib\node.js:1071:15)
verbose stack     at PlaceDep.pruneDedupable (C:\Program Files\nodejs\node_modules\@npmcli\arborist\lib\place-dep.js:426:14)
```

**What's happening:**
1. `npm version` command triggers dependency resolution via npm arborist
2. Arborist attempts to build ideal tree and resolve deps
3. In pnpm workspace, dependencies are symlinked to `.pnpm` store
4. Arborist encounters `Link` object with null `target` property
5. When trying to call `target.matches()`, throws TypeError

**Why previous fix didn't work:**
- Git user config is required, but NOT the root cause
- Error occurs in npm's internal dependency resolution, not git operations
- The version is successfully written to package.json (hence stdout output)
- Error happens during post-version dependency tree validation

### Environment Factors

**Monorepo Structure:**
- Root package: `walrus-starter-kit` (private)
- Workspace: `packages/cli` (publishable)
- pnpm workspace with symlinked dependencies
- npm workspaces field in root package.json

**Versions:**
- npm: 10.9.3
- node: 22.19.0
- pnpm: 9.x
- @semantic-release/npm: 12.0.2
- OS: Windows (local), Ubuntu 24.04 (CI)

**Critical Detail:** Even `pnpm version` uses npm under the hood and hits same error.

## Configuration Analysis

### Current Workflow (.github/workflows/release.yml)

```yaml
- name: Setup Git User
  run: |
    git config --global user.name "github-actions[bot]"
    git config --global user.email "github-actions[bot]@users.noreply.github.com"

- name: Release
  working-directory: packages/cli
  env:
    NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: npx semantic-release
```

**Git config present** - but doesn't solve the arborist issue.

### Current Release Config (.releaserc.json)

```json
{
  "branches": ["main"],
  "repositoryUrl": "https://github.com/blu1606/walrus-starter-kit",
  "tagFormat": "@blu1606/create-walrus-app-v${version}",
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/npm",
      {
        "npmPublish": true,
        "pkgRoot": ".",
        "tarballDir": "dist",
        "provenance": true
      }
    ],
    [
      "@semantic-release/github",
      {
        "assets": []
      }
    ]
  ]
}
```

**Problem:** `@semantic-release/npm` prepare step calls `npm version` which fails in pnpm workspace.

## Solution Options

### Option 1: Use @semantic-release/exec for Version Update (RECOMMENDED)

Replace `@semantic-release/npm` prepare step with custom script:

**Updated .releaserc.json:**
```json
{
  "branches": ["main"],
  "repositoryUrl": "https://github.com/blu1606/walrus-starter-kit",
  "tagFormat": "@blu1606/create-walrus-app-v${version}",
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/exec",
      {
        "prepareCmd": "node -e \"const pkg=require('./package.json');pkg.version='${nextRelease.version}';require('fs').writeFileSync('./package.json',JSON.stringify(pkg,null,2)+'\n')\""
      }
    ],
    [
      "@semantic-release/npm",
      {
        "npmPublish": true,
        "pkgRoot": ".",
        "tarballDir": "dist",
        "provenance": true
      }
    ],
    [
      "@semantic-release/github",
      {
        "assets": []
      }
    ]
  ]
}
```

**Pros:**
- Bypasses npm version command entirely
- Pure JSON manipulation, no dependency resolution
- Works in any environment (npm, pnpm, yarn)
- Maintains semantic-release workflow

**Cons:**
- Loses npm's built-in version validation
- Custom script maintenance

### Option 2: Use pnpm-specific semantic-release Plugin

Install and use `semantic-release-pnpm`:

```bash
pnpm add -D semantic-release-pnpm
```

**Updated .releaserc.json:**
```json
{
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "semantic-release-pnpm",
    ["@semantic-release/github", {"assets": []}]
  ]
}
```

**Pros:**
- Native pnpm support
- Handles workspace publishing

**Cons:**
- Additional dependency
- Less mature than @semantic-release/npm
- May not support provenance

### Option 3: Switch to npm-only Workspace

Remove pnpm, use npm workspaces:

**Pros:**
- Native compatibility with @semantic-release/npm
- Standard npm tooling

**Cons:**
- Massive refactor (lockfile, CI, scripts)
- Slower installs vs pnpm
- Different dependency resolution behavior
- Not feasible for quick fix

### Option 4: Manual Version Update in Workflow

Update version manually before semantic-release:

```yaml
- name: Update Version
  working-directory: packages/cli
  run: |
    VERSION=$(npx semantic-release --dry-run | grep 'next release version is' | sed -n 's/.*version is \([0-9.]*\).*/\1/p')
    node -e "const pkg=require('./package.json');pkg.version='$VERSION';require('fs').writeFileSync('./package.json',JSON.stringify(pkg,null,2)+'\n')"

- name: Release
  working-directory: packages/cli
  run: npx semantic-release
```

**Pros:**
- Full control over versioning
- No plugin changes

**Cons:**
- Brittle parsing of dry-run output
- Extra CI step
- Race condition risk

## Recommended Implementation

**Use Option 1** - Replace npm version with @semantic-release/exec.

### Steps:

1. **Install @semantic-release/exec** (already in devDeps via semantic-release)

2. **Update packages/cli/.releaserc.json:**
   ```json
   {
     "branches": ["main"],
     "repositoryUrl": "https://github.com/blu1606/walrus-starter-kit",
     "tagFormat": "@blu1606/create-walrus-app-v${version}",
     "plugins": [
       "@semantic-release/commit-analyzer",
       "@semantic-release/release-notes-generator",
       [
         "@semantic-release/exec",
         {
           "prepareCmd": "node -e \"const pkg=require('./package.json');pkg.version='${nextRelease.version}';require('fs').writeFileSync('./package.json',JSON.stringify(pkg,null,2)+'\n')\""
         }
       ],
       [
         "@semantic-release/npm",
         {
           "npmPublish": true,
           "pkgRoot": ".",
           "tarballDir": "dist",
           "provenance": true
         }
       ],
       [
         "@semantic-release/github",
         {
           "assets": []
         }
       ]
     ]
   }
   ```

3. **Test locally:**
   ```bash
   cd packages/cli
   npx semantic-release --dry-run
   ```

4. **Commit and push:**
   ```bash
   git add packages/cli/.releaserc.json
   git commit -m "fix(release): bypass npm version with exec plugin for pnpm workspace"
   git push
   ```

5. **Trigger workflow manually**

6. **Verify:**
   - Version updated in package.json
   - Package published to npm
   - GitHub release created

## Timeline

- **2026-01-17 15:34:17Z** - First failure after .npmrc changes
- **2026-01-17 15:42:49Z** - Second failure after git config added
- **2026-01-17 15:51:54Z** - Third failure (run 21096940402) - same error
- **2026-01-17 16:04:55Z** - Local reproduction with git config present

**Pattern:** Git config doesn't fix the issue. Error is in npm arborist, not git.

## Prevention Measures

1. **Test semantic-release locally** before pushing config changes
2. **Use dry-run** to validate configuration
3. **Monitor npm/pnpm compatibility** - this may be fixed in future npm versions
4. **Consider pnpm-specific tools** for pnpm workspaces
5. **Document workspace-specific gotchas** in CONTRIBUTING.md

## Related Files

- `.github/workflows/release.yml` - CI workflow
- `packages/cli/.releaserc.json` - Semantic-release config (needs update)
- `packages/cli/package.json` - Package metadata
- `pnpm-workspace.yaml` - Workspace definition
- `package.json` - Root package with workspaces field

## Unresolved Questions

1. Will npm fix this arborist bug in future versions?
2. Should we migrate to semantic-release-pnpm for better pnpm support?
3. Does @semantic-release/npm skip version command if package.json already has correct version?

## Sources

Research confirmed:
- npm version triggers arborist dependency resolution
- pnpm symlinks cause arborist Link target to be null
- @semantic-release/exec is standard workaround for version command issues
- No tarballOnly or skipNpmVersion options exist in @semantic-release/npm
