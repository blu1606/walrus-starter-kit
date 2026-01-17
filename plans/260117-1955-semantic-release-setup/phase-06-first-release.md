# Phase 6: First Release Execution

## Context Links
- **Release Workflow**: `.github/workflows/release.yml`
- **Release Config**: `packages/cli/.releaserc.json`
- **CLI Package**: `packages/cli/package.json`
- **Contributing Guide**: `CONTRIBUTING.md`

## Overview
**Priority**: P2
**Status**: Pending
**Effort**: 1 hour

Execute the first production release using semantic-release. Trigger GitHub Actions workflow manually, verify NPM package published with provenance attestation, confirm GitHub release created, and validate CHANGELOG.md updated correctly.

## Key Insights
- First release defaults to 1.0.0 (no previous tags)
- Manual trigger provides control over release timing
- Provenance requires successful OIDC token generation
- GitHub release includes auto-generated notes
- CHANGELOG.md committed back to repository

## Requirements

### Functional Requirements
- Trigger release workflow via workflow_dispatch
- Semantic-release analyzes commits and determines version
- NPM package published to registry with provenance
- GitHub release created with release notes
- CHANGELOG.md updated and committed to main branch
- Git tag created: `@walrus-kit/create-walrus-app-v1.0.0`

### Non-Functional Requirements
- Release completes within 5-10 minutes
- All CI checks pass before release
- Provenance attestation visible on NPM
- Release notes accurate and complete

## Architecture

### Release Execution Flow
```
Manual Trigger (GitHub UI)
  ↓
Checkout + Setup (pnpm, Node)
  ↓
Install Dependencies
  ↓
Build Packages
  ↓
Semantic-Release Analyzes Commits
  ↓
Calculate Version (1.0.0)
  ↓
Generate Changelog
  ↓
Update package.json
  ↓
Publish to NPM (with provenance)
  ↓
Create GitHub Release
  ↓
Commit Changes [skip ci]
  ↓
Push to main
```

### Verification Points
1. **NPM Package**: Check package page for provenance badge
2. **GitHub Release**: Verify release notes and assets
3. **Git Tag**: Confirm tag created and pushed
4. **CHANGELOG.md**: Review entries for accuracy
5. **Version Commit**: Check commit message format

## Related Code Files

### Files Modified (by semantic-release)
- `packages/cli/package.json` (version updated)
- `packages/cli/CHANGELOG.md` (created/updated)

### Files Created
- Git tag: `@walrus-kit/create-walrus-app-v1.0.0`
- GitHub release
- NPM package with provenance

### Files to Monitor
- `.github/workflows/release.yml` (workflow execution)
- GitHub Actions logs

## Implementation Steps

### Part 1: Pre-Release Verification

1. **Verify CI status**
   ```bash
   gh run list --workflow=ci.yml --branch=main --limit=1
   ```
   - Ensure latest CI run passed
   - All jobs (lint, test, build, type-check) successful

2. **Check commit history**
   ```bash
   git log --oneline --no-merges origin/main ^@walrus-kit/create-walrus-app-v0.1.0
   ```
   - Verify releasable commits exist (feat/fix)
   - Confirm conventional commit format

3. **Verify NPM_TOKEN secret**
   ```bash
   gh secret list
   ```
   - Ensure NPM_TOKEN configured
   - Check last updated date (should be recent)

4. **Check branch protection**
   ```bash
   gh api repos/:owner/:repo/branches/main/protection
   ```
   - Note any rules that might block release
   - Ensure release workflow has bypass permissions

### Part 2: Trigger Release

5. **Trigger release workflow**
   - Go to: https://github.com/blu1606/walrus-starter-kit/actions/workflows/release.yml
   - Click "Run workflow" button
   - Select branch: main
   - Click "Run workflow" confirm

6. **Monitor workflow execution**
   ```bash
   gh run watch
   ```
   - Follow progress in real-time
   - Check for errors in each step

7. **Review workflow logs**
   - Semantic-release analysis output
   - Version calculation
   - Changelog generation
   - NPM publish result
   - GitHub release creation

### Part 3: Verification

8. **Verify NPM package published**
   - Visit: https://www.npmjs.com/package/@walrus-kit/create-walrus-app
   - Check version is 1.0.0 (or calculated version)
   - Verify provenance badge displayed
   - Review package files included

9. **Verify provenance attestation**
   - On NPM package page, click "Provenance" tab
   - Verify GitHub Actions workflow link
   - Check signature verification status

10. **Verify GitHub release**
    ```bash
    gh release view @walrus-kit/create-walrus-app-v1.0.0
    ```
    - Check release notes accuracy
    - Verify tag created
    - Review commit references

11. **Verify CHANGELOG.md**
    ```bash
    git pull origin main
    cat packages/cli/CHANGELOG.md
    ```
    - Check entries formatted correctly
    - Verify version header
    - Review commit groupings (features, fixes)

12. **Verify version commit**
    ```bash
    git log --oneline -1
    ```
    - Check commit message: `chore(release): 1.0.0 [skip ci]`
    - Verify files changed: package.json, CHANGELOG.md

### Part 4: Post-Release

13. **Test package installation**
    ```bash
    npx @walrus-kit/create-walrus-app@latest --help
    ```
    - Verify package downloads from NPM
    - Check CLI executes correctly

14. **Update documentation**
    - Add version badge to README.md
    - Document first release in project log
    - Update any version references

15. **Announce release**
    - Create announcement (optional)
    - Share release notes
    - Notify stakeholders

## Todo List

### Pre-Release
- [ ] Verify CI status (all checks passing)
- [ ] Check commit history for releasable commits
- [ ] Verify NPM_TOKEN secret configured
- [ ] Review branch protection rules
- [ ] Ensure all tests pass

### Release Execution
- [ ] Trigger release workflow via GitHub UI
- [ ] Monitor workflow execution
- [ ] Review semantic-release logs
- [ ] Check version calculation
- [ ] Verify no errors in workflow

### Verification
- [ ] Verify NPM package published
- [ ] Check provenance attestation on NPM
- [ ] Verify GitHub release created
- [ ] Check CHANGELOG.md updated
- [ ] Verify version commit pushed to main
- [ ] Verify git tag created
- [ ] Test package installation with npx

### Post-Release
- [ ] Update README.md with version badge
- [ ] Document release in project log
- [ ] Announce release (if applicable)
- [ ] Monitor for issues

## Success Criteria

- ✅ Workflow completes successfully (green checkmark)
- ✅ NPM package version updated to 1.0.0 (or calculated)
- ✅ Provenance badge visible on NPM package page
- ✅ GitHub release created with notes
- ✅ CHANGELOG.md contains new version entry
- ✅ Git tag `@walrus-kit/create-walrus-app-v1.0.0` created
- ✅ Version commit pushed to main with [skip ci]
- ✅ Package installable via `npx @walrus-kit/create-walrus-app@latest`
- ✅ No errors in workflow logs

## Risk Assessment

### Potential Issues

1. **NPM Token Expired/Invalid**
   - **Symptom**: 401 Unauthorized error during publish
   - **Mitigation**: Regenerate NPM_TOKEN, update secret

2. **Provenance Generation Fails**
   - **Symptom**: Package published but no provenance
   - **Mitigation**: Check `id-token: write` permission set

3. **No Releasable Commits**
   - **Symptom**: Semantic-release exits without release
   - **Mitigation**: Expected behavior, add feat/fix commits

4. **Git Push Fails**
   - **Symptom**: Version commit not pushed to main
   - **Mitigation**: Check branch protection, verify token permissions

5. **Package Name Conflict**
   - **Symptom**: 403 Forbidden (scope not owned)
   - **Mitigation**: Verify @walrus-kit scope owned on NPM

### Edge Cases
- First release → version defaults to 1.0.0
- Major version bump → requires BREAKING CHANGE in commits
- Multiple releases same day → subsequent releases increment correctly

## Security Considerations

### NPM Provenance
- **Verification**: Public can verify package built by GitHub Actions
- **Trust Score**: Increases package trust rating on NPM
- **Transparency**: Links package to source code and build process

### GitHub Token Security
- **Scope**: Token limited to repository
- **Expiry**: Token expires after workflow completes
- **Permissions**: Limited to contents and id-token write

### Release Verification
- **Checksum**: NPM provides package integrity checksums
- **Signature**: Provenance includes cryptographic signature
- **Audit Trail**: GitHub Actions logs retained for 90 days

### Post-Release Monitoring
- Monitor NPM download stats for unusual activity
- Watch for reported security vulnerabilities
- Review GitHub security advisories

## Troubleshooting Guide

### Workflow Fails at Install
- Check pnpm version compatibility
- Verify pnpm-lock.yaml committed
- Try `pnpm install --frozen-lockfile` locally

### Workflow Fails at Build
- Check TypeScript compilation errors
- Verify all dependencies installed
- Test `pnpm build` locally

### Workflow Fails at Semantic-Release
- Review semantic-release logs for errors
- Check .releaserc.json syntax
- Verify commit message format

### NPM Publish Fails
- Check NPM_TOKEN valid and not expired
- Verify scope @walrus-kit owned on NPM
- Check publishConfig.access = "public"

### Provenance Not Generated
- Verify `id-token: write` permission set
- Check Node.js and npm versions compatible
- Review GitHub Actions OIDC token generation

### Git Push Fails
- Check GITHUB_TOKEN permissions
- Verify branch protection allows workflow commits
- Check [skip ci] in commit message

## Verification Commands

```bash
# Check NPM package
npm view @walrus-kit/create-walrus-app version
npm view @walrus-kit/create-walrus-app dist.attestations

# Check GitHub release
gh release view @walrus-kit/create-walrus-app-v1.0.0

# Check git tag
git fetch --tags
git tag -l "@walrus-kit/create-walrus-app-v*"

# Check workflow run
gh run list --workflow=release.yml --limit=1

# Test package
npx @walrus-kit/create-walrus-app@latest --version
```

## Next Steps

After successful first release:

1. **Monitor Package**
   - Watch NPM download stats
   - Review user feedback
   - Monitor for security issues

2. **Refine Process**
   - Adjust release workflow if needed
   - Update documentation based on learnings
   - Consider automated releases on main push

3. **Future Releases**
   - Continue using conventional commits
   - Trigger workflow for each release
   - Review changelog before publishing

4. **Expand Automation**
   - Consider automated releases (remove workflow_dispatch)
   - Add release candidate workflow
   - Implement prerelease versions
