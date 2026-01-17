# CI Failure Analysis: pnpm Lockfile Mismatch

**Date:** 2026-01-17
**Status:** Root Cause Identified
**Severity:** High - Blocks CI/CD pipeline

---

## Executive Summary

**Issue:** CI frozen-lockfile install fails due to phantom dependency reference in `pnpm-lock.yaml`
**Root Cause:** Lockfile contains outdated self-referential tarball dependency `@walrus-kit/create-walrus-app` pointing to non-existent `.tgz` file
**Impact:** All CI builds fail, blocking deployments and PRs
**Fix Priority:** Immediate - regenerate lockfile

---

## Technical Analysis

### Error Breakdown

```
ERR_PNPM_OUTDATED_LOCKFILE Cannot install with "frozen-lockfile"
because pnpm-lock.yaml is not up to date with packages/cli/package.json
```

**Conflict:**
- **Lockfile specifiers include:** `"@walrus-kit/create-walrus-app":"file:D:/Sui/walrus-starter-kit/packages/cli/walrus-kit-create-walrus-app-0.1.0.tgz"`
- **package.json specifiers:** No such dependency listed
- **File existence:** `walrus-kit-create-walrus-app-0.1.0.tgz` does not exist

### Root Cause

**Phantom Dependency in Lockfile:**
```yaml
packages/cli:
  dependencies:
    '@walrus-kit/create-walrus-app':
      specifier: file:D:/Sui/walrus-starter-kit/packages/cli/walrus-kit-create-walrus-app-0.1.0.tgz
      version: file:packages/cli/walrus-kit-create-walrus-app-0.1.0.tgz
```

This entry exists in `pnpm-lock.yaml` but:
1. Not declared in `packages/cli/package.json` dependencies or devDependencies
2. References absolute Windows path (should be relative)
3. Points to non-existent tarball file
4. Appears to be self-referential (package depending on itself)

**Likely Origin:**
- Previous `pnpm pack` operation created tarball during testing/publishing
- Lockfile captured this temporary dependency
- Tarball was later removed but lockfile not regenerated
- Alternative: Malformed workspace protocol or circular dependency misconfiguration

---

## Affected Files

### Primary
- **`pnpm-lock.yaml`** - Contains stale dependency entry
- **`packages/cli/package.json`** - Clean, no issues

### Missing
- **`packages/cli/walrus-kit-create-walrus-app-0.1.0.tgz`** - Referenced but doesn't exist

---

## Recommended Fix

### Immediate Action (Production Fix)

```bash
# Remove lockfile and regenerate
rm pnpm-lock.yaml
pnpm install

# Verify clean state
pnpm install --frozen-lockfile
```

### Alternative (Safer for Monorepo)

```bash
# Update lockfile without major version bumps
pnpm install --no-frozen-lockfile

# Commit updated lockfile
git add pnpm-lock.yaml
git commit -m "fix(deps): regenerate pnpm-lock.yaml to remove phantom tarball dependency"
```

### Validation Steps

1. **Local verification:**
   ```bash
   pnpm install --frozen-lockfile
   pnpm run build
   pnpm test
   ```

2. **CI verification:**
   - Push fix to branch
   - Verify GitHub Actions pass
   - Check no new dependency changes introduced

---

## Preventive Measures

### Immediate
1. **Add `.gitignore` entry:**
   ```
   packages/cli/*.tgz
   ```

2. **Document pnpm workflow:**
   - Never commit tarball files
   - Always regenerate lockfile after `pnpm pack` testing
   - Use `pnpm publish --dry-run` instead of pack for testing

### Long-term
1. **Add pre-commit hook:**
   ```bash
   # Verify lockfile consistency
   pnpm install --frozen-lockfile || exit 1
   ```

2. **CI lockfile validation:**
   ```yaml
   - name: Validate lockfile
     run: |
       pnpm install --frozen-lockfile
       git diff --exit-code pnpm-lock.yaml
   ```

3. **Review workspace protocol usage:**
   - Ensure no circular dependencies
   - Use `workspace:*` protocol correctly for internal packages

---

## Next Steps

1. ✅ **Execute fix:** Regenerate `pnpm-lock.yaml`
2. ⏳ **Test locally:** Verify frozen-lockfile install works
3. ⏳ **Push & validate:** Confirm CI passes
4. ⏳ **Add safeguards:** Implement preventive measures

---

## Unresolved Questions

- **Q1:** Was `@walrus-kit/create-walrus-app` intended as separate published package or internal monorepo package?
- **Q2:** Should package name match directory name (`packages/cli` vs `create-walrus-app`)?
- **Q3:** Are there other workspace packages with similar phantom dependencies?
