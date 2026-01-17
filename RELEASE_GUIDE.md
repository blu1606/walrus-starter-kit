# Release Guide

Complete guide for releasing `@walrus-kit/create-walrus-app` to NPM using semantic-release.

## Prerequisites

Before triggering a release, ensure:

1. ✅ All CI checks pass (lint, tests, build)
2. ✅ `main` branch is up to date
3. ✅ Commits follow [Conventional Commits](https://www.conventionalcommits.org/) format
4. ✅ NPM_TOKEN is configured in GitHub repository secrets

## Setup NPM Token (One-time)

### 1. Generate NPM Granular Access Token

1. Log in to [npmjs.com](https://www.npmjs.com)
2. Go to **Account Settings** → **Access Tokens**
3. Click **Generate New Token** → **Granular Access Token**
4. Configure the token:
   - **Token Name**: `walrus-starter-kit-release`
   - **Expiration**: 90 days (recommended)
   - **Packages and scopes**: Select specific packages
     - Package: `@walrus-kit/create-walrus-app`
     - Permissions: **Read and write**
   - **Organizations**: Select `@walrus-kit` (if applicable)
5. Click **Generate Token**
6. **Copy the token immediately** (shown only once!)

### 2. Add Token to GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `NPM_TOKEN`
5. Value: Paste the token from step 1
6. Click **Add secret**

## Triggering a Release

### Via GitHub Actions UI (Recommended)

1. Go to repository on GitHub
2. Click **Actions** tab
3. Select **Release** workflow in the left sidebar
4. Click **Run workflow** button
5. Select branch: `main`
6. Click **Run workflow** to confirm

### Monitor the Release

1. Watch the workflow execution in the Actions tab
2. Workflow steps:
   - ✅ Checkout repository
   - ✅ Setup pnpm and Node.js
   - ✅ Install dependencies
   - ✅ Build packages
   - ✅ Run semantic-release
     - Analyze commits
     - Determine version bump
     - Generate CHANGELOG.md
     - Update package.json version
     - Publish to NPM with provenance
     - Create GitHub release
     - Commit version changes

### What Gets Published

- **NPM Package**: `@walrus-kit/create-walrus-app`
- **Package Contents**:
  - `dist/` - Compiled JavaScript
  - `templates/` - Project templates
  - `package.json`
  - `README.md`
  - `CHANGELOG.md`

## Version Bump Rules

semantic-release determines the version bump based on commit types since the last release:

| Commit Type | Example | Version Bump | Example |
|-------------|---------|--------------|---------|
| `fix:` | `fix(cli): resolve path issue` | **Patch** | 1.0.0 → 1.0.1 |
| `feat:` | `feat(cli): add new template` | **Minor** | 1.0.0 → 1.1.0 |
| `BREAKING CHANGE:` | `feat!: remove old API` | **Major** | 1.0.0 → 2.0.0 |

### No Release Scenarios

If there are **no releasable commits** since the last release (e.g., only `chore:`, `docs:`, `test:` commits), semantic-release will:
- ✅ Exit successfully
- ❌ **Not publish** a new version
- ℹ️ Log: "No commits found since last release"

## Commit Message Guidelines

### ✅ Good Examples

```bash
feat(cli): add TypeScript template option
fix(cli): resolve Windows path handling
perf(cli): improve template download speed
feat!: migrate to pure ESM

BREAKING CHANGE: CommonJS support removed
```

### ❌ Bad Examples

```bash
updated stuff
fix bug
new feature
WIP
```

**Why?** semantic-release cannot determine version bumps from non-conventional commits.

## Testing Before Release

### Local Dry-Run

Test the release process locally without publishing:

```bash
pnpm release
```

This runs semantic-release in `--dry-run` mode and shows:
- ✅ Next version number
- ✅ Changelog preview
- ✅ Files that would be committed
- ❌ **Does not publish** to NPM

### Verify Configuration

```bash
# Validate .releaserc.json syntax
node -e "require('./packages/cli/.releaserc.json'); console.log('Valid!')"

# Check package.json publishConfig
cat packages/cli/package.json | grep -A 2 publishConfig
```

## Verification After Release

### 1. Check NPM Package

```bash
npm view @walrus-kit/create-walrus-app

# Or visit: https://www.npmjs.com/package/@walrus-kit/create-walrus-app
```

Verify:
- ✅ New version published
- ✅ Provenance badge displayed (🛡️)
- ✅ Package contents include `dist/` and `templates/`

### 2. Check GitHub Release

1. Go to **Releases** tab on GitHub
2. Verify new release created with:
   - ✅ Tag: `@walrus-kit/create-walrus-app-vX.Y.Z`
   - ✅ Release notes auto-generated from commits
   - ✅ Changelog included

### 3. Check Repository Changes

```bash
git pull origin main
cat packages/cli/package.json | grep version
cat packages/cli/CHANGELOG.md
```

Verify:
- ✅ `package.json` version updated
- ✅ `CHANGELOG.md` contains new entries
- ✅ Commit message: `chore(release): X.Y.Z [skip ci]`

### 4. Test Installation

```bash
npx @walrus-kit/create-walrus-app@latest
# or
npm create walrus-app@latest
```

## Troubleshooting

### Error: "NPM_TOKEN not found"

**Solution**: Add NPM_TOKEN to GitHub Secrets (see Setup section above)

### Error: "Insufficient permissions to publish"

**Causes**:
1. NPM token expired (tokens expire after 90 days)
2. Token lacks write permissions for `@walrus-kit/create-walrus-app`
3. Package scope `@walrus-kit` ownership issues

**Solution**:
1. Generate new NPM token with correct permissions
2. Update `NPM_TOKEN` secret in GitHub
3. Verify you have publish rights to `@walrus-kit` organization

### Error: "No commits found since last release"

**This is not an error!** It means:
- No `feat:`, `fix:`, or `BREAKING CHANGE:` commits since last release
- Only non-release commits (docs, chore, test) present
- semantic-release correctly skips publishing

**Solution**: Wait until you have releasable commits before triggering the workflow.

### Error: "Provenance generation failed"

**Causes**:
1. Missing `id-token: write` permission in workflow
2. OIDC provider configuration issues

**Solution**:
1. Verify `.github/workflows/release.yml` has:
   ```yaml
   permissions:
     contents: write
     id-token: write
   ```
2. Use NPM_TOKEN as fallback (current setup)

### Error: "Cannot push to protected branch"

**Causes**:
Branch protection rules prevent push from GitHub Actions

**Solutions**:
1. Allow GitHub Actions to bypass branch protection:
   - Go to **Settings** → **Branches** → **main**
   - Enable "Allow force pushes" for "GitHub Actions"
2. Or use a Personal Access Token instead of `GITHUB_TOKEN`

### Workflow Doesn't Show "Run workflow" Button

**Causes**:
1. You're not on the default branch
2. Insufficient repository permissions

**Solutions**:
1. Ensure workflow_dispatch is on `main` branch
2. Verify you have "Write" or "Admin" access to the repository

## Best Practices

### 1. **Commit Message Hygiene**
- Write clear, descriptive commit messages
- Use correct conventional commit types
- Add scopes for better changelog organization
- Include issue numbers when applicable

### 2. **Pre-Release Checks**
- Run `pnpm release` locally to preview changes
- Ensure CI passes before triggering release
- Review commit history since last release
- Check for unintended breaking changes

### 3. **Token Security**
- Rotate NPM tokens every 90 days
- Use granular tokens (not legacy tokens)
- Limit token scope to specific packages
- Never commit tokens to repository

### 4. **Version Strategy**
- Use semantic versioning strictly
- Avoid manual version bumps in package.json
- Let semantic-release manage versions
- Document breaking changes clearly

## NPM Provenance

This project publishes packages with [NPM Provenance](https://docs.npmjs.com/generating-provenance-statements):

✅ **Benefits**:
- Verifiable package origin
- Signed build attestation
- Increased package trust score
- Visible provenance badge on NPM

🔒 **How it works**:
1. GitHub Actions generates OIDC token (`id-token: write`)
2. semantic-release passes token to `npm publish --provenance`
3. NPM generates signed attestation of build origin
4. Attestation is publicly visible on package page

## Future: OIDC/Trusted Publishing

Currently using `NPM_TOKEN` authentication. To upgrade to OIDC (Trusted Publishing):

1. Enable in NPM organization settings
2. Remove `NPM_TOKEN` secret
3. NPM will use GitHub Actions OIDC token automatically
4. More secure (no long-lived tokens)

Configuration already supports OIDC via `id-token: write` permission.

## Additional Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [semantic-release docs](https://semantic-release.gitbook.io/)
- [NPM Provenance](https://docs.npmjs.com/generating-provenance-statements)
- [GitHub Actions OIDC](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
