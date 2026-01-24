# Test Report: Phase 01 Dependency Updates

**Date**: 2026-01-18
**Author**: Claude (Tester Agent)
**Scope**: Dependency updates for `@mysten/sui@1.45.2` and `@mysten/dapp-kit@^0.20.0` in CLI presets and templates.

## Test Results Overview
- **CLI Package Build**: ✅ PASS
- **Project Scaffolding**: ✅ PASS
- **Dependency Installation**: ✅ PASS
- **Dependency Version Verification**: ✅ PASS
- **TypeScript Type-Check**: ❌ FAIL (Actual TS errors found, not environment issues)

## Detailed Results

### 1. CLI Package Build
- **Command**: `cd packages/cli && pnpm build`
- **Status**: ✅ PASS
- **Output**: CLI builds successfully using `tsc`.

### 2. Project Scaffolding
- **Command**: `node packages/cli/dist/index.js test-app --sdk mysten --framework react --use-case simple-upload --package-manager pnpm --skip-install`
- **Status**: ✅ PASS
- **Metrics**: 30 files created. `package.json` correctly populated with:
  - `@mysten/sui`: `1.45.2`
  - `@mysten/dapp-kit`: `^0.20.0`

### 3. Dependency Installation & Peer Dependencies
- **Command**: `pnpm install` in scaffolded project.
- **Status**: ✅ PASS
- **Observations**:
  - No peer dependency warnings related to `@mysten/sui` or `@mysten/dapp-kit`.
  - Only standard deprecation warnings for `eslint@8` and subdependencies.

### 4. Dependency Version Verification
- **Command**: `pnpm list @mysten/sui`
- **Status**: ✅ PASS
- **Result**: Only `1.45.2` is installed in the dependency tree.

### 5. TypeScript Type-Check
- **Command**: `pnpm type-check`
- **Status**: ❌ FAIL
- **Errors**:
  - `src/components/features/file-preview.tsx(31,28)`: `Uint8Array` to `BlobPart` assignment error (SharedArrayBuffer incompatibility).
  - `src/components/features/file-preview.tsx(58,7)`: `unknown` not assignable to `ReactNode`.
  - `src/components/features/file-preview.tsx(60,92)`: Property `byteLength` does not exist on type `{}`.
  - `src/lib/walrus/adapter.ts(42,27)`: Property `walrus` does not exist on type `SuiJsonRpcClient` (This is likely due to how `$extend` works with type inference in newer versions or missing type augmentation).

## Critical Issues
1. **TypeScript Incompatibility**: The updated dependencies introduced type mismatches in the template code. Specifically:
   - `SuiClient` extension for Walrus doesn't seem to be correctly typed or inferred in `adapter.ts`.
   - `Blob` constructor and `ReactNode` usage in `file-preview.tsx` have strict type errors.

## Recommendations
1. **Update Templates**: Fix the type errors in the CLI presets to match the new version of `@mysten/sui` and `@mysten/walrus`.
2. **Review Walrus Type Augmentation**: Ensure the `$extend` call in `src/lib/walrus/client.ts` correctly propagates the `walrus` property to the returned client type.

## Unresolved Questions
1. Does `@mysten/walrus@^0.9.0` fully support `@mysten/sui@1.45.2` type definitions? The `Property 'walrus' does not exist` error suggests a potential mismatch or need for explicit casting.
