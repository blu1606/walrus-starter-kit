# Phase 3: GitHub Actions Workflow

## Context Links
- **Research**: `plans/reports/researcher-260117-1952-semantic-release-pnpm-monorepo.md`
- **Existing CI**: `.github/workflows/ci.yml`
- **CLI Package**: `packages/cli/package.json`
- **Release Config**: `packages/cli/.releaserc.json`

## Overview
**Priority**: P2
**Status**: Pending
**Effort**: 1.5 hours

Create GitHub Actions workflow for automated releases using semantic-release. Workflow uses manual trigger (workflow_dispatch) for controlled releases, runs after CI passes, and publishes to NPM with provenance attestation.

## Key Insights
- Manual trigger provides release control
- Requires NPM_TOKEN secret for publishing
- Provenance requires `id-token: write` permission
- Must run after CI succeeds (quality gate)
- Node 20 matches existing CI environment
- pnpm 9 for consistency with development

## Requirements

### Functional Requirements
- Manual workflow trigger via workflow_dispatch
- Run semantic-release from CLI package directory
- Publish to NPM with provenance enabled
- Create GitHub releases with notes
- Commit version bumps back to main branch
- Skip CI after release commit

### Non-Functional Requirements
- Use Node 20 (matches CI)
- Use pnpm 9 (matches development)
- Require CI to pass before release
- Use ubuntu-latest runner
- Set appropriate timeouts (10-15 minutes)
- Use GitHub Actions cache for pnpm

## Architecture

### Workflow Trigger Flow
```
Manual Trigger (workflow_dispatch)
  ↓
Check CI Status (optional protection)
  ↓
Checkout with token
  ↓
Setup pnpm + Node
  ↓
Install dependencies
  ↓
Build packages
  ↓
Run semantic-release
  ↓
Publish to NPM + GitHub Release
```

### Required Permissions
- `contents: write` → Push version commits, create releases
- `id-token: write` → Generate NPM provenance attestation
- `pull-requests: write` → Comment on PRs (optional)

### Required Secrets
- `NPM_TOKEN` → Authenticate with NPM registry
- `GITHUB_TOKEN` → Automatic (provided by Actions)

## Related Code Files

### Files to Create
- `.github/workflows/release.yml` (new workflow)

### Files to Modify
None

### Files to Delete
None

## Implementation Steps

1. **Create workflow file**
   ```bash
   cd d:\Sui\walrus-starter-kit\.github\workflows
   ```

2. **Define workflow name and trigger**
   - Name: "Release"
   - Trigger: `workflow_dispatch` (manual)
   - Optional: Add `branches: [main]` filter

3. **Set workflow permissions**
   - `contents: write` for git commits and releases
   - `id-token: write` for NPM provenance

4. **Configure job: release**
   - Runner: `ubuntu-latest`
   - Environment: production (optional protection)

5. **Add checkout step**
   - Use `actions/checkout@v4`
   - Set `fetch-depth: 0` for full git history
   - Use `persist-credentials: false` + token for push

6. **Setup pnpm**
   - Use `pnpm/action-setup@v2`
   - Version: 9

7. **Setup Node.js**
   - Use `actions/setup-node@v4`
   - Node version: 20
   - Registry: https://registry.npmjs.org
   - Cache: pnpm

8. **Install dependencies**
   ```bash
   pnpm install --frozen-lockfile
   ```

9. **Build packages**
   ```bash
   pnpm build
   ```

10. **Run semantic-release**
    ```bash
    cd packages/cli && npx semantic-release
    ```
    - Set NPM_TOKEN environment variable
    - Set GITHUB_TOKEN environment variable

11. **Add environment protection (optional)**
    - Require manual approval
    - Restrict to main branch

## Todo List

- [ ] Create `.github/workflows/release.yml` file
- [ ] Define workflow name and workflow_dispatch trigger
- [ ] Set permissions: contents write, id-token write
- [ ] Add checkout step with fetch-depth 0
- [ ] Setup pnpm action (version 9)
- [ ] Setup Node.js action (version 20, npm registry)
- [ ] Add install dependencies step
- [ ] Add build packages step
- [ ] Add semantic-release step with environment variables
- [ ] Configure NPM_TOKEN from secrets
- [ ] Test workflow with dry-run (Phase 5)
- [ ] Add environment protection in repo settings

## Success Criteria

- ✅ Workflow file exists at `.github/workflows/release.yml`
- ✅ Manual trigger (workflow_dispatch) configured
- ✅ Permissions set: contents write, id-token write
- ✅ Full git history fetched (fetch-depth: 0)
- ✅ pnpm and Node.js versions match CI
- ✅ Dependencies installed before release
- ✅ Packages built before release
- ✅ semantic-release runs from CLI package directory
- ✅ NPM_TOKEN and GITHUB_TOKEN available
- ✅ Workflow validates in GitHub Actions UI

## Risk Assessment

### Potential Issues
1. **NPM_TOKEN Not Set**: Workflow fails at publish step
   - **Mitigation**: Add NPM_TOKEN to GitHub Secrets before first run

2. **Insufficient Permissions**: Cannot push commits or create releases
   - **Mitigation**: Set permissions in workflow file

3. **Provenance Failure**: id-token permission missing
   - **Mitigation**: Add `id-token: write` to permissions

4. **Release Loop**: Release triggers CI which triggers release
   - **Mitigation**: `[skip ci]` in commit message (configured in Phase 2)

5. **Shallow Clone**: semantic-release needs full git history
   - **Mitigation**: Set `fetch-depth: 0` in checkout

### Edge Cases
- No releasable commits → semantic-release exits gracefully
- Multiple packages in monorepo → only CLI package released
- Protected branch rules → may need bypass or special token

## Security Considerations

### NPM Token Management
- **Type**: Use NPM Granular Access Token (not legacy token)
- **Scope**: Limit to `@walrus-kit` scope, publish-only permission
- **Rotation**: Rotate token every 90 days
- **Storage**: Store in GitHub Secrets (encrypted at rest)
- **Access**: Restrict to release workflow only

### GitHub Token
- **Type**: Automatic `GITHUB_TOKEN` provided by Actions
- **Permissions**: Limited to workflow-defined permissions
- **Scope**: Repository-scoped, expires after job
- **No Storage**: Automatically available as `secrets.GITHUB_TOKEN`

### Provenance Attestation
- **Requirement**: `id-token: write` permission
- **Provider**: GitHub Actions OIDC token
- **Signature**: Signed statement of package build origin
- **Verification**: NPM registry verifies signature
- **Visibility**: Public attestation visible on NPM package page

### Branch Protection
- **Recommendation**: Enable branch protection on main
- **Rules**: Require CI to pass before merge
- **Bypass**: Release workflow needs write access
- **Solution**: Use GitHub App token or bypass for release workflow

## Workflow File Template

```yaml
name: Release

on:
  workflow_dispatch:

permissions:
  contents: write
  id-token: write

jobs:
  release:
    name: Release to NPM
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          persist-credentials: false

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

      - name: Build packages
        run: pnpm build

      - name: Release
        working-directory: packages/cli
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: npx semantic-release
```

## Next Steps

1. Proceed to **Phase 4: Package.json Updates**
2. Add release script to root package.json
3. Verify publishConfig in CLI package.json
4. Ensure repository field is correct
