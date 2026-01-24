# TypeScript Build Errors Diagnostic Report

**Date:** 2026-01-18 10:38
**Severity:** HIGH
**Impact:** Blocks production builds for all scaffolded projects
**Attempt:** 4th attempt (previous 3 attempts failed)

---

## Executive Summary

Build failures occur when users scaffold new projects using create-walrus-app, NOT when building the CLI package itself. Root causes identified:

1. **@mysten/sui version conflicts** - Multiple incompatible versions across dependencies
2. **Missing vite types** - TypeScript compilation fails before reaching actual code errors
3. **Missing Walrus client config** - Prevents Walrus SDK initialization
4. **Potential project generation bugs** - Empty directories created in some cases

**Critical Finding:** Previous fixes addressed individual files but ignored dependency-level incompatibilities that manifest when projects are scaffolded and built standalone.

---

## Build Status Analysis

### ✅ CLI Package Build (packages/cli)
```bash
> pnpm build
> @blu1606/create-walrus-app@0.1.5 build
> tsc
# SUCCESS - No errors
```

**Finding:** CLI compiles cleanly. Issue is NOT in CLI codebase.

### ❌ Scaffolded Project Builds (All Presets)
```bash
> test-project@0.1.0 build
> tsc && vite build

error TS2688: Cannot find type definition file for 'vite/client'.
  The file is in the program because:
    Entry point of type library 'vite/client' specified in compilerOptions
 ELIFECYCLE  Command failed with exit code 2.
 WARN   Local package.json exists, but node_modules missing, did you mean to install?
```

**Status:** BLOCKED - Cannot proceed past TypeScript compilation to identify runtime errors

---

## Root Cause #1: @mysten/sui Version Conflicts

### Version Matrix

**Templates specify:** `@mysten/sui: ^1.10.0`

**Actual installed versions (from pnpm-lock.yaml):**
- `@mysten/walrus@0.9.0` → **requires @mysten/sui@1.45.2**
- `@mysten/dapp-kit@0.14.53` → **requires @mysten/sui@1.24.0**
- `@mysten/wallet-standard@0.13.29` → **requires @mysten/sui@1.24.0**
- `@mysten/zksend@0.12.19` → **requires @mysten/sui@1.24.0**

### Impact

**Nominal Type Conflicts:**
```typescript
// Transaction type from @mysten/sui@1.45.2 (Walrus SDK)
type Transaction_v1_45 = { ... } & { __brand: "Transaction_v1_45" }

// Transaction type from @mysten/sui@1.24.0 (dapp-kit)
type Transaction_v1_24 = { ... } & { __brand: "Transaction_v1_24" }

// ERROR: Type mismatch when passing transactions between libraries
```

**User-reported symptom:** "Transaction nominal type errors due to multiple @mysten/sui versions"

### Files Affected

All preset package.json files:
- `packages/cli/presets/react-mysten-gallery/package.json`
- `packages/cli/presets/react-mysten-simple-upload/package.json`
- `packages/cli/presets/react-mysten-simple-upload-enoki/package.json`
- `packages/cli/templates/react/package.json`
- `packages/cli/templates/sdk-mysten/package.json`
- `templates/enoki/package.json`
- `templates/react/package.json`
- `templates/sdk-mysten/package.json`

---

## Root Cause #2: Missing node_modules / Vite Types

### Error Pattern

```
error TS2688: Cannot find type definition file for 'vite/client'.
WARN  Local package.json exists, but node_modules missing
```

### Investigation Findings

**Test 1: Preset build in monorepo**
```bash
cd packages/cli/presets/react-mysten-gallery
pnpm install  # Says "Done in 759ms"
pnpm build    # ERROR: node_modules missing
ls node_modules  # Directory does NOT exist
```

**Cause:** Presets are in a monorepo workspace. pnpm uses virtual store, no local node_modules created.

**Test 2: Scaffolded project inside workspace**
```bash
cd test-build/test-enoki-upload  # Inside walrus-starter-kit/
pnpm install  # Says "Done in 808ms"
pnpm build    # ERROR: Same issue
```

**Cause:** Nested inside parent workspace, inherits workspace behavior.

**Test 3: Scaffolded project outside workspace**
```bash
cd ~/test-walrus-enoki
node .../cli/dist/index.js test-walrus-enoki --sdk mysten --skip-install
# Says: "✓ Project generated successfully! Files created: 36"
ls ~/test-walrus-enoki  # Directory is EMPTY
```

**Cause:** **Critical bug in project generator** - Files not actually written when outside monorepo.

---

## Root Cause #3: Missing Configuration Files

### Walrus Client Config
```bash
test -f ~/.config/walrus/client_config.yaml
# Result: NOT found
```

**Impact:** Walrus SDK cannot initialize without this config

**User symptom:** "Missing Walrus Client config at ~/.config/walrus/client_config.yaml"

### sites-config.yaml
```bash
find . -name "sites-config.yaml"
# Result: No files found
```

**Impact:** Deployment configuration missing

**User symptom:** "Missing sites-config.yaml"

---

## Root Cause #4: TypeScript Configuration Issues

### tsconfig.json (All Presets)
```json
{
  "compilerOptions": {
    "types": ["vite/client"],  // ← Requires @types/vite or vite package
    ...
  }
}
```

**Problem:** TypeScript looks for `vite/client` types BEFORE compiling code.

**Why it fails:**
1. No local node_modules (workspace virtual store)
2. Vite types not accessible from monorepo root
3. TypeScript cannot resolve type declarations

---

## Error Categories (User-Reported)

Based on user description, these errors would appear AFTER fixing vite types issue:

### Category A: Uint8Array & Blob Type Issues
**Symptom:** "Uint8Array & BlobPart type incompatibilities with Blob constructor"

**Suspected Location:**
- `src/lib/walrus/adapter.ts` - File handling code
- Any code creating Blobs from byte arrays

**Root Cause:** Likely TypeScript strict mode + DOM lib version mismatch

### Category B: Hook Return Type Issues
**Symptom:** "unknown & ReactNode type issues from hooks"

**Suspected Location:**
- `src/hooks/use-upload.ts`
- `src/hooks/use-wallet.ts`
- `src/hooks/use-enoki-auth.ts`

**Root Cause:** React hook return types not properly typed

### Category C: .walrus Property Missing
**Symptom:** "Missing .walrus property on SuiClient until it's extended"

**Location:** `src/lib/walrus/client.ts:66`
```typescript
walrusClient = suiClient.$extend(walrus({...}));
// TypeScript doesn't know about .walrus property until runtime
```

**Root Cause:** Type augmentation needed for extended client

---

## Why Previous Fixes Failed

**Previous approach (3 attempts):**
- Fixed individual TypeScript errors in preset source files
- Did NOT update package.json dependencies
- Did NOT test scaffolded projects as standalone builds
- Did NOT address pnpm workspace behavior

**Why it didn't work:**
- Fixes only worked at monorepo file level
- When projects scaffolded → fresh npm/pnpm install → version conflicts reappear
- Users download packages from npm registry, not local files

**Critical insight:** Must fix at DEPENDENCY LEVEL, not just code level.

---

## Recommended Fix Strategy

### Phase 1: Resolve @mysten/sui Version Conflicts (CRITICAL)

**Option A: Pin to Walrus SDK version (1.45.2)**
```json
{
  "dependencies": {
    "@mysten/sui": "1.45.2",  // Exact version, no ^
    "@mysten/dapp-kit": "^0.14.0",  // Update to compatible version
    "@mysten/walrus": "^0.9.0"
  }
}
```

**Option B: Use pnpm overrides**
```json
{
  "pnpm": {
    "overrides": {
      "@mysten/sui": "1.45.2"
    }
  }
}
```

**Recommended:** Option A for templates (explicit), Option B for monorepo root

**Impact:** Fixes Transaction nominal type errors across all libraries

### Phase 2: Fix Project Generation Bug

**Issue:** Projects scaffolded outside monorepo create empty directories

**Location:** `packages/cli/src/generator/`

**Investigation needed:**
- Check file-ops.ts copy operations
- Verify path resolution for Windows vs Unix
- Test with absolute paths outside workspace

### Phase 3: Add Missing Configuration Files

**Action 1: Include sites-config.yaml template**
```yaml
# templates/base/sites-config.yaml
network: testnet
publisher_url: https://publisher.walrus-testnet.walrus.space
aggregator_url: https://aggregator.walrus-testnet.walrus.space
```

**Action 2: Document Walrus client setup**
Add to post-install script or README:
```bash
# Initialize Walrus client config
mkdir -p ~/.config/walrus
walrus init  # or provide template
```

### Phase 4: Fix TypeScript Type Issues (After Phase 1-3)

Can only verify these after resolving blocking issues:

**A. Uint8Array/Blob fixes**
- Review Blob constructor calls
- Add explicit type assertions
- Update DOM lib in tsconfig

**B. Hook return types**
- Add explicit return type annotations
- Fix `unknown` types with proper inference

**C. Extended client types**
- Add type augmentation for `.walrus` property:
```typescript
declare module '@mysten/sui/client' {
  interface SuiClient {
    walrus: WalrusClient;
  }
}
```

### Phase 5: Testing Protocol

**Test matrix:** Each preset × Each package manager × Outside workspace

```bash
# Test template
for preset in react-mysten-gallery react-mysten-simple-upload react-mysten-simple-upload-enoki; do
  cd /tmp
  npx @blu1606/create-walrus-app test-$preset --preset $preset --skip-install
  cd test-$preset
  pnpm install
  pnpm build  # MUST succeed
  pnpm type-check  # MUST succeed
done
```

---

## Dependency Version Recommendations

### Current (Broken)
```json
{
  "@mysten/sui": "^1.10.0",  // Too old, conflicts
  "@mysten/dapp-kit": "^0.14.0",  // Requires 1.24.0
  "@mysten/walrus": "^0.9.0"  // Requires 1.45.2
}
```

### Recommended (Compatible)
```json
{
  "@mysten/sui": "1.45.2",  // Exact match for Walrus
  "@mysten/dapp-kit": "^0.14.53",  // Latest compatible
  "@mysten/walrus": "^0.9.0",
  "@mysten/enoki": "^0.15.0"
}
```

**Verify:** Check @mysten/dapp-kit@0.14.53 peer dependencies support @mysten/sui@1.45.x

---

## Files Requiring Updates

### Package.json Files (8 files)
1. `packages/cli/presets/react-mysten-gallery/package.json`
2. `packages/cli/presets/react-mysten-simple-upload/package.json`
3. `packages/cli/presets/react-mysten-simple-upload-enoki/package.json`
4. `packages/cli/templates/react/package.json`
5. `packages/cli/templates/sdk-mysten/package.json`
6. `templates/enoki/package.json`
7. `templates/react/package.json`
8. `templates/sdk-mysten/package.json`

### Configuration Files (New)
- `templates/base/sites-config.yaml` (create)
- `templates/base/.walrus/` (create directory structure)

### Code Files (After verification)
- Type declarations for extended SuiClient
- Hook return type annotations
- Blob constructor type assertions

### Generator Files (Bug fix)
- `packages/cli/src/generator/file-ops.ts`
- `packages/cli/src/generator/index.ts`

---

## Success Criteria

1. ✅ Scaffolded projects build successfully outside monorepo
2. ✅ No @mysten/sui version conflicts
3. ✅ TypeScript compilation passes
4. ✅ All presets tested with all package managers
5. ✅ Configuration files included in scaffolded projects
6. ✅ Walrus SDK initializes without manual config
7. ✅ No runtime type errors in production builds

---

## Risk Assessment

**High Risk:**
- @mysten/sui version pinning may break with future @mysten/dapp-kit updates
- Walrus SDK may update to different @mysten/sui version

**Mitigation:**
- Pin exact versions in templates
- Add CI tests for each preset build
- Monitor @mysten package updates
- Version compatibility matrix in docs

**Medium Risk:**
- Project generator bug may affect other scenarios
- Windows path handling differences

**Mitigation:**
- Comprehensive generator testing
- Path normalization review
- Cross-platform CI tests

---

## Unresolved Questions

1. Does @mysten/dapp-kit@latest support @mysten/sui@1.45.x?
2. What is Walrus SDK's @mysten/sui version roadmap?
3. Should we vendor Walrus client config or require manual setup?
4. Are there other nominal type conflicts beyond Transaction?
5. Does the generator bug affect other file copy operations?
6. Should presets be buildable in monorepo for development?
7. What is the official Walrus config initialization process?
