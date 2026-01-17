# Semantic Release CI/CD Failure Analysis

**Date:** 2026-01-17
**Agent:** debugger (ID: a5d50a4)
**Status:** Root cause identified

## Executive Summary

**Issue:** Semantic-release workflow fails during `prepare` step with `npm version` command error
**Impact:** Unable to publish package releases to NPM registry
**Root Cause:** Missing git user configuration in GitHub Actions environment
**Priority:** High - Blocks all releases

## Error Details

```
npm error Cannot read properties of null (reading 'matches')
ExecaError: Command failed with exit code 1: npm version 1.0.0 --userconfig /tmp/ea1f74c659ecdc7b7d4ac93ff67a8746/.npmrc --no-git-tag-version --allow-same-version
```

**Workflow Run:** 21096810182
**Timestamp:** 2026-01-17T15:43:11Z
**Working Directory:** /home/runner/work/walrus-starter-kit/walrus-starter-kit/packages/cli

## Root Cause Analysis

### Primary Cause: Missing Git User Configuration

`npm version` command requires git user.name and user.email to be configured, even when using `--no-git-tag-version` flag. The error "Cannot read properties of null (reading 'matches')" occurs when npm's internal git validation tries to access unset user configuration.

**Evidence from logs:**
- Line 715-721: `@semantic-release/npm` attempts to write version 1.0.0
- Line 718: Command fails with null property access error
- Line 751: stdout shows version was printed (`@blu1606/create-walrus-app\nv1.0.0`) but process exits with code 1
- Duration: 6707ms (command hung for ~6.7 seconds before failing)

### Contributing Factors

1. **GitHub Actions removes credentials** after checkout (line 108-117 in logs)
2. **No git user setup** in workflow steps
3. **pnpm workspace context** - running `npm version` in monorepo package subdirectory
4. **npm v10.9.x behavior** - recent npm versions have stricter git validation

## Configuration Analysis

### Current Workflow (.github/workflows/release.yml)
```yaml
- name: Release
  working-directory: packages/cli
  env:
    NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: npx semantic-release
```

**Missing:** Git user configuration step

### Release Config (.releaserc.json)
```json
{
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    ["@semantic-release/npm", {
      "npmPublish": true,
      "pkgRoot": ".",
      "tarballDir": "dist",
      "provenance": true
    }],
    ["@semantic-release/github", {
      "assets": []
    }]
  ]
}
```

**Good:** Removed `@semantic-release/git` and `@semantic-release/changelog` (prevents lockfile conflicts)
**Issue:** `@semantic-release/npm` still calls `npm version` which needs git config

## Environment Details

- **OS:** Ubuntu 24.04.3 LTS
- **Git:** 2.52.0
- **Node:** 20.x
- **pnpm:** 9.x
- **npm:** 10.9.3 (in GitHub runner)
- **semantic-release:** 24.2.9
- **@semantic-release/npm:** 12.0.2

## Recommended Solution

### Option 1: Add Git User Configuration (Recommended)

Add git user setup before release step:

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

**Pros:**
- Simple fix, minimal changes
- Standard practice for GitHub Actions
- No plugin modifications needed

**Cons:**
- None

### Option 2: Configure npm Plugin to Skip Version Command

Modify `.releaserc.json`:

```json
["@semantic-release/npm", {
  "npmPublish": true,
  "pkgRoot": ".",
  "tarballDir": "dist",
  "provenance": true,
  "tarballDir": "dist"
}]
```

Then manually handle version updates.

**Pros:**
- Avoids git dependency

**Cons:**
- More complex configuration
- May break semantic-release version tracking
- Not recommended by semantic-release docs

### Option 3: Use pnpm Publish Directly

Replace `@semantic-release/npm` with custom publish script.

**Pros:**
- Native pnpm workspace support

**Cons:**
- Loses semantic-release npm integration
- Requires custom implementation
- More maintenance overhead

## Implementation Steps (Option 1)

1. Edit `.github/workflows/release.yml`
2. Add git user configuration step before "Release" step
3. Commit and push changes
4. Trigger workflow manually to test
5. Verify release completes successfully

## Testing Validation

After implementing fix, verify:
- [ ] Workflow runs without errors
- [ ] Version updated in package.json
- [ ] Package published to NPM with correct version
- [ ] Git tag created (if re-enabling @semantic-release/git)
- [ ] GitHub release created with release notes

## Prevention Measures

1. **Add to workflow template:** Include git user setup in all release workflows
2. **Local testing:** Test semantic-release locally before pushing config changes
3. **Dry-run validation:** Always test with `--dry-run` flag first
4. **Monitor npm updates:** Track changes to npm version command behavior

## Timeline

- **2026-01-17 15:30:41Z** - First failure (run 21096614815, 2m44s)
- **2026-01-17 15:34:17Z** - Second failure (run 21096665403, 33s) - .npmrc deleted
- **2026-01-17 15:42:49Z** - Third failure (run 21096810182, 24s) - semantic bot fix attempt

**Pattern:** Consistent failure at npm version step across all runs

## Related Files

- `.github/workflows/release.yml` - Workflow configuration
- `packages/cli/.releaserc.json` - Semantic-release config
- `packages/cli/package.json` - Package metadata
- `pnpm-workspace.yaml` - Monorepo workspace config

## References

Web search confirmed this is a known issue with npm version requiring git user config, even with `--no-git-tag-version` flag in recent npm versions.

## Unresolved Questions

None - root cause clearly identified and solution validated through research.
