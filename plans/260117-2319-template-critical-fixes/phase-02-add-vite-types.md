# Phase 2: Add Vite Types to TypeScript Configuration

## Context

- **Priority**: P1 (High - Affects all Vite-based frameworks)
- **Status**: ✅ COMPLETED
- **Effort**: 0.5 hours
- **Completed**: 2026-01-18T00:07:00+07:00
- **Dependencies**: None (independent change)

## Overview

All framework layers using Vite (React, Vue) need `"types": ["vite/client"]` in tsconfig.json to support `import.meta.env` type checking. Without this, TypeScript cannot resolve environment variable types.

## Key Insights

- Vite provides type definitions for `import.meta.env` via `vite/client`
- Missing types cause TypeScript errors when accessing env variables
- Affects all framework templates (react, vue, future plain-ts with Vite)
- Standard Vite best practice

## Requirements

### Functional
- Add Vite client types to tsconfig.json in all Vite-based templates
- Enable proper type checking for `import.meta.env`
- Support VITE_ prefixed environment variables

### Non-Functional
- Maintain strict TypeScript configuration
- Follow Vite documentation standards
- No impact on runtime behavior

## Architecture

### Current tsconfig.json (Missing Types)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "strict": true,
    "jsx": "preserve"
    // Missing: "types": ["vite/client"]
  }
}
```

### Updated tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "strict": true,
    "jsx": "preserve",
    "types": ["vite/client"]
  }
}
```

## Related Code Files

### Files to Modify
1. `packages/cli/templates/react/tsconfig.json`
2. `packages/cli/templates/vue/tsconfig.json` (if exists)
3. `packages/cli/templates/gallery/tsconfig.json` (if overrides react)
4. `packages/cli/templates/simple-upload/tsconfig.json` (if overrides react)

### Files to Verify (Context)
- `packages/cli/templates/react/src/utils/env.ts` - Uses `import.meta.env`
- `packages/cli/templates/react/src/providers/WalletProvider.tsx` - Loads env

## Implementation Steps

### Step 1: Identify All tsconfig.json Files
```bash
# Search for all tsconfig files in templates
find packages/cli/templates -name "tsconfig.json"
```

### Step 2: Update React Template
```json
// packages/cli/templates/react/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "preserve",
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "allowSyntheticDefaultImports": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vite/client"]  // ADD THIS LINE
  },
  "include": ["src"]
}
```

### Step 3: Update Vue Template (If Exists)
Apply same change to `packages/cli/templates/vue/tsconfig.json`

### Step 4: Check Use Case Templates
Verify if gallery/simple-upload have their own tsconfig.json that override React layer

### Step 5: Validate Generated Project
```bash
# Generate test project
pnpm create walrus-app test-vite-types --sdk mysten --framework react --use-case simple-upload

# Verify TypeScript compilation
cd test-vite-types
pnpm install
pnpm tsc --noEmit
```

## Todo List

- [x] List all tsconfig.json files in template directories
- [x] Read React template tsconfig.json
- [x] Add `"types": ["vite/client"]` to React template
- [x] Check if Vue template exists and has tsconfig.json
- [x] Update Vue template if exists
- [x] Verify use case templates don't override tsconfig
- [x] Generate test project
- [x] Run TypeScript compilation check
- [x] Verify `import.meta.env` has correct types in IDE

## Success Criteria

- [x] All Vite-based templates have `types: ["vite/client"]`
- [x] Generated project shows type hints for `import.meta.env.VITE_*`
- [x] No TypeScript errors related to import.meta
- [x] `pnpm tsc --noEmit` passes in generated project

## Implementation Summary

**Completed**: 2026-01-18T00:07:00+07:00
**Changes Made**:
- Added `"types": ["vite/client"]` to `packages/cli/templates/react/tsconfig.json`
- TypeScript compilation verified successful
- Code review score: 9/10 approved

**Verification**:
- ✅ TypeScript compilation passes (`pnpm tsc --noEmit`)
- ✅ Vite client types properly configured
- ✅ No conflicts with existing type definitions

## Risk Assessment

**Risks**:
- May conflict with other type definitions if present
- Could affect existing projects if they have custom types

**Mitigation**:
- Use array format for types (allows multiple type packages)
- Test with clean project generation
- Verify no conflicts with @types/* packages

## Security Considerations

- No security impact (type definitions only)
- Maintains type safety for environment variables

## Next Steps

After completion:
- Proceed to Phase 3 (Update SDK v0.9.0 API)
- Update documentation to mention Vite type support
- Consider adding env variable examples in README
