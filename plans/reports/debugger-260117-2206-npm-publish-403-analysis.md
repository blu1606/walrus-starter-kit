# NPM Publishing Error Analysis

**Report:** debugger-260117-2206-npm-publish-403-analysis
**Date:** 2026-01-17 22:06:18
**Workflow:** Release (ID: 21096310628)
**Status:** FAILED

## Executive Summary

GitHub Actions release workflow failing during semantic-release prepare step. NPM registry rejects token with "Access token expired or revoked" error, followed by internal npm error. Root cause: NPM_TOKEN lacks proper permissions or type for publishing scoped packages with provenance.

**Impact:** Cannot publish @blu1606/create-walrus-app to npm registry
**Severity:** HIGH - Blocks all releases
**Root Cause:** Invalid/expired NPM token or incorrect token type

## Error Timeline

**15:08:14** - Semantic-release starts, plugins loaded successfully
**15:08:16** - Commit analysis complete, determined major release (1.0.0)
**15:08:17** - CHANGELOG.md updated, version bumped to 1.0.0 in package.json
**15:09:25** - **First token rejection:** "Access token expired or revoked"
**15:10:34** - **npm crashes:** "Cannot read properties of null (reading 'edgesOut')"
**15:10:34** - Workflow fails with exit code 1

## Technical Analysis

### 1. Token Authentication Failures

```
npm notice Access token expired or revoked. Please try logging in again.
```

Occurred 3 times during `npm version` command execution. NPM registry rejected authentication.

### 2. NPM Internal Error

```
npm error Cannot read properties of null (reading 'edgesOut')
```

This is a known npm bug when:
- Token is invalid/malformed
- Workspace configuration conflicts with .npmrc
- Dependency graph corruption during authentication failure

### 3. Workflow Configuration Issues

**Warning in logs:**
```
npm warn config ignoring workspace config at /home/runner/work/walrus-starter-kit/walrus-starter-kit/packages/cli/.npmrc
```

**Analysis:**
- Root `.npmrc` exists (pnpm workspace config)
- Package-specific `.npmrc` exists at `packages/cli/.npmrc` with token reference
- npm is ignoring package .npmrc, potentially causing auth issues

### 4. Semantic-Release Configuration

**File:** `packages/cli/.releaserc.json`

```json
{
  "plugins": [
    ["@semantic-release/npm", {
      "npmPublish": true,
      "pkgRoot": ".",
      "tarballDir": "dist",
      "provenance": true  // ← REQUIRES AUTOMATION TOKEN
    }]
  ]
}
```

**Critical:** `provenance: true` requires:
- npm automation token (not classic token)
- OR classic token with 2FA bypass enabled
- Proper id-token permissions in workflow (already configured)

### 5. GitHub Secrets Status

```
NPM_TOKEN    2026-01-17T15:10:43Z
```

Token was updated 4 minutes after workflow started - suggests token was regenerated during debugging, but workflow still failed.

## Root Cause Identification

**Primary Cause:** NPM_TOKEN is either:
1. **Expired/Revoked** - Token no longer valid on npm registry
2. **Wrong Type** - Classic token without 2FA bypass, but provenance requires automation token
3. **Insufficient Permissions** - Token lacks publish permission for scoped packages

**Secondary Cause:** npm internal error due to workspace config conflict during auth failure recovery.

## Evidence Supporting Analysis

1. **Token rejection before npm crash** - Auth failed first, npm crashed second
2. **Provenance enabled** - Requires specific token type
3. **Scoped package** - `@blu1606/create-walrus-app` requires publish access
4. **Recent token update** - Suggests awareness of token issue
5. **No 403 in logs** - User-reported 403 likely from local/different attempt

## Recommended Solutions

### Immediate Fix (Choose One)

**Option A: Use npm Automation Token (RECOMMENDED)**
1. Go to https://www.npmjs.com/settings/blu1606/tokens
2. Generate new **Automation** token (not Classic)
3. Token type: Automation (allows provenance, bypasses 2FA automatically)
4. Permissions: Read and write
5. Update GitHub secret:
   ```bash
   gh secret set NPM_TOKEN
   # Paste the new automation token
   ```

**Option B: Use Classic Token with 2FA Bypass**
1. Generate Classic token at https://www.npmjs.com/settings/blu1606/tokens
2. Select "Automation" or enable "Bypass 2FA" option
3. Ensure permissions include publish access
4. Update GitHub secret (same as Option A)

**Option C: Disable Provenance (NOT RECOMMENDED)**
1. Edit `packages/cli/.releaserc.json`:
   ```json
   ["@semantic-release/npm", {
     "npmPublish": true,
     "pkgRoot": ".",
     "tarballDir": "dist",
     "provenance": false  // ← Changed from true
   }]
   ```
2. Can use regular classic token
3. Loses npm provenance benefits (supply chain security)

### Verification Steps

After updating token:

1. **Test token locally:**
   ```bash
   cd packages/cli
   echo "//registry.npmjs.org/:_authToken=YOUR_TOKEN" > .npmrc
   npm whoami
   # Should show: blu1606
   ```

2. **Verify token permissions:**
   ```bash
   npm token list
   # Check token type and permissions
   ```

3. **Test publish (dry-run):**
   ```bash
   npm publish --dry-run
   # Should succeed without errors
   ```

4. **Trigger workflow:**
   ```bash
   gh workflow run release.yml
   ```

### Long-term Improvements

1. **Fix workspace .npmrc conflict:**
   - Remove token reference from `packages/cli/.npmrc`
   - Use only workflow NODE_AUTH_TOKEN env var
   - Update `packages/cli/.npmrc`:
     ```
     # Remove this line:
     # //registry.npmjs.org/:_authToken="${NPM_TOKEN}"
     ```

2. **Add token validation step to workflow:**
   ```yaml
   - name: Verify NPM token
     run: npm whoami
     env:
       NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
   ```

3. **Monitor token expiration:**
   - npm automation tokens don't expire
   - Classic tokens may expire based on npm settings
   - Document token type in README

4. **Improve error handling:**
   - Add semantic-release debug logging:
     ```yaml
     env:
       DEBUG: semantic-release:*
     ```

## Configuration Files Analysis

### packages/cli/.npmrc
```
//registry.npmjs.org/:_authToken="${NPM_TOKEN}"
```
**Issue:** Workspace monorepo causing npm to ignore this file. Token should be set via NODE_AUTH_TOKEN env var instead.

### .github/workflows/release.yml
```yaml
env:
  NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
  NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```
**Status:** Correct - both env vars set

```yaml
permissions:
  contents: write
  id-token: write  # ← Required for provenance
```
**Status:** Correct - id-token permission present

### packages/cli/package.json
```json
"publishConfig": {
  "access": "public"
}
```
**Status:** Correct - scoped package set to public

## Next Steps

**Priority 1:**
- Generate new npm automation token
- Update NPM_TOKEN GitHub secret
- Re-run workflow

**Priority 2:**
- Remove `.npmrc` from `packages/cli/` (rely on NODE_AUTH_TOKEN)
- Add token verification step to workflow

**Priority 3:**
- Document token type requirement in project README
- Add monitoring for token validity

## Unresolved Questions

1. Was 403 error from local publish attempt or different workflow run?
2. Has package @blu1606/create-walrus-app been published before? (affects version strategy)
3. Is npm account blu1606 configured for 2FA? (affects token type requirements)
4. Are there any npm organization settings that might block publishing?

## References

- npm Automation Tokens: https://docs.npmjs.com/creating-and-viewing-access-tokens#creating-granular-access-tokens-on-the-website
- npm Provenance: https://docs.npmjs.com/generating-provenance-statements
- GitHub Actions permissions: https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/about-security-hardening-with-openid-connect
- Semantic-release npm plugin: https://github.com/semantic-release/npm#options
