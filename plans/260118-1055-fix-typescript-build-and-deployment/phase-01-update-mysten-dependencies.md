# Phase 01: Update @mysten Dependencies

**Priority:** P1 (Critical Path)
**Status:** Pending
**Effort:** 1.5h

## Context Links

- **Diagnostic Report:** [TypeScript Build Errors](../../plans/reports/debugger-260118-1038-typescript-build-errors.md)
- **Related Code:** All package.json in presets/ and templates/

## Overview

Resolve @mysten/sui version conflicts blocking TypeScript compilation. Walrus SDK requires @mysten/sui@1.45.2, but dapp-kit dependencies pull in 1.24.0, creating nominal type incompatibilities.

## Key Insights

**Current State (Broken):**
```json
{
  "@mysten/sui": "^1.10.0",        // Too old
  "@mysten/dapp-kit": "^0.14.0",   // Requires sui@1.24.0
  "@mysten/walrus": "^0.9.0"       // Requires sui@1.45.2
}
```

**Version Conflict Impact:**
- Transaction types are nominal - different versions = incompatible types
- Users report: "Transaction nominal type errors due to multiple @mysten/sui versions"
- Multiple instances of @mysten/sui installed simultaneously

**Solution:** Upgrade @mysten/dapp-kit to version supporting @mysten/sui@1.45.2

## Requirements

### Functional
- All @mysten packages must use same @mysten/sui version
- Walrus SDK initialization must succeed
- dapp-kit hooks must function correctly

### Non-Functional
- Zero breaking changes for existing code
- Package installations complete without peer dependency warnings
- Version pinning prevents future drift

## Architecture

**Dependency Tree (Target):**
```
@mysten/sui@1.45.2 (single version)
├── @mysten/walrus@^0.9.0 ✓ (peer satisfied)
├── @mysten/dapp-kit@^0.20.0 ✓ (upgraded)
├── @mysten/wallet-standard@latest ✓ (compatible)
└── @mysten/enoki@^0.15.0 ✓ (compatible)
```

**Version Resolution Strategy:**
1. Pin exact @mysten/sui version (1.45.2)
2. Research latest @mysten/dapp-kit compatible version
3. Update all templates simultaneously
4. Verify peer dependencies align

## Related Code Files

### Files to Modify (8 package.json)

**CLI Presets:**
1. `d:\Sui\walrus-starter-kit\packages\cli\presets\react-mysten-gallery\package.json`
2. `d:\Sui\walrus-starter-kit\packages\cli\presets\react-mysten-simple-upload\package.json`
3. `d:\Sui\walrus-starter-kit\packages\cli\presets\react-mysten-simple-upload-enoki\package.json`

**CLI Templates:**
4. `d:\Sui\walrus-starter-kit\packages\cli\templates\react\package.json`
5. `d:\Sui\walrus-starter-kit\packages\cli\templates\sdk-mysten\package.json`

**Root Templates:**
6. `d:\Sui\walrus-starter-kit\templates\enoki\package.json`
7. `d:\Sui\walrus-starter-kit\templates\react\package.json`
8. `d:\Sui\walrus-starter-kit\templates\sdk-mysten\package.json`

## Implementation Steps

### Step 1: Research Latest Compatible Versions (15m)

**Check @mysten/dapp-kit compatibility:**
```bash
npm view @mysten/dapp-kit versions --json | tail -20
npm view @mysten/dapp-kit@latest peerDependencies
npm view @mysten/dapp-kit@0.20.0 peerDependencies  # If exists
```

**Verify Walrus SDK requirements:**
```bash
npm view @mysten/walrus@0.9.0 peerDependencies
```

**Document findings in:** `research/phase01-version-compatibility.md`

### Step 2: Update CLI Preset Package.json Files (30m)

**For each preset (react-mysten-gallery, react-mysten-simple-upload, react-mysten-simple-upload-enoki):**

```json
{
  "dependencies": {
    "@mysten/sui": "1.45.2",                    // EXACT VERSION
    "@mysten/dapp-kit": "^0.20.0",              // VERIFY COMPATIBLE
    "@mysten/walrus": "^0.9.0",
    "@mysten/enoki": "^0.15.0",                 // For enoki preset only
    "@mysten/wallet-standard": "^0.13.0"
  }
}
```

**Critical:** Remove `^` from @mysten/sui to prevent version drift

### Step 3: Update CLI Template Package.json Files (20m)

**Templates are source-of-truth for generation:**

Update `packages/cli/templates/react/package.json` and `packages/cli/templates/sdk-mysten/package.json` with same versions as Step 2.

### Step 4: Update Root Template Package.json Files (20m)

**Sync root templates (reference copies):**

Update `templates/enoki/package.json`, `templates/react/package.json`, `templates/sdk-mysten/package.json`

### Step 5: Verify No Hardcoded Versions in Generator (10m)

**Check generator code for version references:**
```bash
grep -r "@mysten/sui" packages/cli/src/generator/
grep -r "1.10.0" packages/cli/src/
```

**If found:** Update to use package.json as source-of-truth

### Step 6: Test Dependency Installation (20m)

**Test matrix:**
```bash
# Test 1: Fresh install in preset directory (should fail - workspace)
cd packages/cli/presets/react-mysten-gallery
rm -rf node_modules pnpm-lock.yaml
pnpm install
# Expect: Virtual store, no errors

# Test 2: Scaffold outside workspace
cd /tmp
node d:/Sui/walrus-starter-kit/packages/cli/dist/index.js test-deps --preset react-mysten-simple-upload --skip-install
cd test-deps
pnpm install
# Expect: Real node_modules, no peer dependency warnings

# Test 3: Verify single @mysten/sui version
pnpm list @mysten/sui
# Expect: Only 1.45.2 shown
```

## Todo List

- [ ] Research @mysten/dapp-kit@latest peer dependencies
- [ ] Verify @mysten/dapp-kit@0.20.0 supports @mysten/sui@1.45.2
- [ ] Document version compatibility matrix
- [ ] Update react-mysten-gallery package.json
- [ ] Update react-mysten-simple-upload package.json
- [ ] Update react-mysten-simple-upload-enoki package.json
- [ ] Update packages/cli/templates/react/package.json
- [ ] Update packages/cli/templates/sdk-mysten/package.json
- [ ] Update templates/enoki/package.json
- [ ] Update templates/react/package.json
- [ ] Update templates/sdk-mysten/package.json
- [ ] Verify no hardcoded versions in generator
- [ ] Test fresh scaffold outside workspace
- [ ] Verify pnpm list shows single @mysten/sui version
- [ ] Test pnpm install completes without warnings

## Success Criteria

### Build Validation
```bash
cd /tmp/test-deps
pnpm build
# MUST: Exit code 0 (or fail with actual TS errors, not missing types)
```

### Version Validation
```bash
pnpm list @mysten/sui
# MUST: Show only "1.45.2" once
```

### Peer Dependency Validation
```bash
pnpm install 2>&1 | grep -i "peer"
# MUST: No unmet peer dependency warnings
```

### Type Compatibility Validation
```typescript
// In scaffolded project, this should compile:
import { Transaction } from '@mysten/sui/transactions';
import { walrus } from '@mysten/walrus';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';

const tx = new Transaction();
// Should accept tx without type errors
```

## Risk Assessment

**High Risk:**
- @mysten/dapp-kit may not have version supporting @mysten/sui@1.45.2 yet
- **Mitigation:** Research npm registry first, consider using @mysten/dapp-kit@canary if needed

**Medium Risk:**
- Breaking API changes between dapp-kit versions
- **Mitigation:** Review dapp-kit CHANGELOG, test all hooks used in presets

**Low Risk:**
- Version pinning prevents automatic security updates
- **Mitigation:** Add CI workflow to check for @mysten package updates weekly

## Security Considerations

**Dependency Trust:**
- All @mysten packages from verified npm publisher
- Pin exact versions to prevent supply chain attacks
- Document version upgrade process

**Update Protocol:**
- Monitor @mysten/walrus releases for new @mysten/sui requirements
- Test compatibility before updating dependencies
- Maintain version compatibility matrix in docs/

## Next Steps

**Immediate (After Phase 01):**
- Phase 02: Fix generator file copy bug (can run parallel)
- Phase 04: Fix TypeScript type issues (blocked until deps stable)

**Follow-up:**
- Add CI job testing scaffolded project builds
- Create dependency update automation
- Document version compatibility in README

## Unresolved Questions

1. Does @mysten/dapp-kit@0.20.0 exist and support @mysten/sui@1.45.2?
2. Are there any breaking changes in @mysten/dapp-kit 0.14 → 0.20?
3. Should we use pnpm overrides in monorepo root for development?
4. What is Walrus SDK's @mysten/sui version upgrade roadmap?
5. Should we document version pinning strategy in CONTRIBUTING.md?
