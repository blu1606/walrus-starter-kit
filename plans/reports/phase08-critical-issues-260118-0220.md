# Phase 08: Post-Testing Critical Issues

## Issue 1: Template TypeScript Compilation Failures (P0)

**Discovered During**: Phase 08 Testing and Validation
**Affects**: All generated projects
**Severity**: Critical (Blocks Development)

### Symptoms

Generated projects fail TypeScript compilation with 8 errors:

```typescript
src/adapter.ts(30,9): error TS2353: Object literal may only specify known properties, and 'nEpochs' does not exist in type 'WriteBlobToUploadRelayOptions'.
src/adapter.ts(34,29): error TS2339: Property 'newlyCreated' does not exist on type '{ blobId: string; certificate: ProtocolMessageCertificate; }'.
src/adapter.ts(46,5): error TS6133: 'options' is declared but its value is never read.
src/adapter.ts(78,9): error TS2322: Type 'string' is not assignable to type 'number'.
src/adapter.ts(79,31): error TS2339: Property 'contentType' does not exist
src/adapter.ts(80,29): error TS2339: Property 'createdAt' does not exist
src/client.ts(34,5): error TS2322: Type 'WalrusNetwork' is not assignable to type '"testnet" | "mainnet" | undefined'. Type '"devnet"' is not assignable
src/index.ts(2,10): error TS2724: '"./adapters/storage.js"' has no exported member named 'storageAdapter'. Did you mean 'StorageAdapter'?
```

### Root Cause Analysis

The template code in Phases 3, 4, and 5 was written to match the v0.9.0 SDK API based on specifications/assumptions, but:
1. The actual @mysten/walrus v0.9.0 package API differs from the implemented code
2. Parameter names don't match (e.g., `nEpochs` vs `epochs`)
3. Response structure differs (missing `newlyCreated`, `contentType`, `createdAt` properties)
4. Type definitions don't match actual SDK types

### Impact

- **Immediate**: Users cannot develop with generated projects
- **Workaround**: None - blocks all development
- **Severity**: P0 - Must fix before release

### Recommended Fix

**Option 1: Update Templates to Match Real SDK (Recommended)**
1. Install @mysten/walrus v0.9.0 package
2. Read actual type definitions from node_modules
3. Update templates/sdk-mysten/src/* to match real API
4. Test against real package
5. Re-run Phase 08 validation

**Estimate**: 3-4 hours

**Option 2: Downgrade to SDK v0.8.0**
1. Revert Phases 3-5 changes
2. Use older working SDK version
3. Update templates to v0.8.0 API

**Estimate**: 1-2 hours

**Option 3: Add Runtime Polyfill**
1. Add adapter layer to translate between template code and real SDK
2. Handle mismatched types at runtime

**Estimate**: 2-3 hours

### Next Steps

1. **Immediate**: Document issue in Phase 08 report
2. **Short-term**: Create Phase 09 to fix template SDK integration
3. **Before Release**: Must be resolved - cannot ship with failing templates

### Test Case to Verify Fix

```bash
# Generate project
pnpm create walrus-app test-fix --sdk mysten --framework react --use-case simple-upload

# Verify compilation
cd test-fix
pnpm install
pnpm tsc --noEmit

# Expected: 0 errors
# Actual (current): 8 errors
```

---

## Issue 2: Test Script Security (P1) - FIXED

**Status**: ✅ RESOLVED
**Fix Applied**: Added input validation to packages/cli/scripts/test-templates.sh
**Validation**: Sanitizes sdk, framework, and useCase variables before use

---

## Issue 3: Missing Vite Dependency (P2) - FALSE POSITIVE

**Status**: ✅ NOT AN ISSUE
**Finding**: Template package.json already includes vite@^5.0.11 in devDependencies
**Root Cause**: Test project `my-test-app` was generated before templates were fixed
**Action**: None required - templates correct

---

## Recommendations for Phase 09

**Title**: "SDK Integration Fix"
**Priority**: P0 (Critical)
**Scope**: Fix all template TypeScript errors
**Dependencies**: Access to @mysten/walrus v0.9.0 package
**Success Criteria**: `pnpm tsc --noEmit` passes for all generated projects

**Tasks**:
1. Research actual v0.9.0 SDK API
2. Update adapter.ts parameter names
3. Update response type handling
4. Update client.ts network types
5. Fix export paths
6. Re-test all 5 template combinations
7. Update Phase 08 test report

---

## Sign-Off

Phase 08 testing successfully identified critical issues before release. Template type errors are P0 blockers that must be resolved in Phase 09.

**Documented**: 2026-01-18 02:20
**Next Phase**: Phase 09 - SDK Integration Fix (Required)
