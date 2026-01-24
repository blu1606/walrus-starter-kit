---
title: "Fix TypeScript Build Errors and Deployment Issues"
description: "Resolve @mysten/sui version conflicts, project generator bugs, and TypeScript compilation failures in scaffolded projects"
status: pending
priority: P1
effort: 6h
branch: main
tags: [bugfix, typescript, dependencies, deployment, critical]
created: 2026-01-18
---

# Fix TypeScript Build Errors and Deployment Issues

## Context

Scaffolded projects fail to build due to multiple critical issues blocking production deployment.

**Diagnostic Reports:**
- [TypeScript Build Errors Analysis](../reports/debugger-260118-1038-typescript-build-errors.md)

**Critical Impact:**
- All presets fail TypeScript compilation
- Users cannot deploy scaffolded projects
- 4th attempt - previous fixes addressed symptoms not root causes

## Root Causes Identified

1. **@mysten/sui version conflicts** - Walrus SDK requires 1.45.2, dapp-kit uses 1.24.0
2. **Project generator bug** - Creates empty directories when scaffolding outside workspace
3. **Missing vite types** - TypeScript compilation blocked by missing type definitions
4. **Missing config files** - sites-config.yaml and Walrus client config templates

## Implementation Phases

### Phase 01: Update @mysten Dependencies ⏳ pending
**Effort:** 1.5h | **File:** [phase-01-update-mysten-dependencies.md](phase-01-update-mysten-dependencies.md)

Resolve version conflicts by upgrading @mysten/dapp-kit to support @mysten/sui@1.45.2

**Files:** 8 package.json templates

### Phase 02: Fix Project Generator File Copy Bug ⏳ pending
**Effort:** 2h | **File:** [phase-02-fix-project-generator-bug.md](phase-02-fix-project-generator-bug.md)

Fix empty directory creation when scaffolding outside monorepo workspace

**Files:** packages/cli/src/generator/file-ops.ts, index.ts

### Phase 03: Add Configuration File Templates ⏳ pending
**Effort:** 1h | **File:** [phase-03-add-configuration-templates.md](phase-03-add-configuration-templates.md)

Include sites-config.yaml and .env templates in scaffolded projects

**Files:** New templates, generator updates

### Phase 04: Fix TypeScript Type Issues ⏳ pending
**Effort:** 1h | **File:** [phase-04-fix-typescript-type-issues.md](phase-04-fix-typescript-type-issues.md)

Resolve Uint8Array/Blob types, hook return types, and extended client types

**Dependencies:** Phases 1-3 must complete first

### Phase 05: Testing Protocol ⏳ pending
**Effort:** 30m | **File:** [phase-05-testing-protocol.md](phase-05-testing-protocol.md)

Test each preset outside workspace with all package managers

**Test Matrix:** 3 presets × 2 package managers × 2 build commands

## Success Criteria

- ✅ All scaffolded projects build outside monorepo
- ✅ No @mysten/sui version conflicts
- ✅ TypeScript compilation passes
- ✅ Configuration files included
- ✅ Generator creates files correctly
- ✅ All presets tested successfully

## Dependencies

- pnpm@9.15.4
- Node.js ^20 || ^22 || >=24
- WSL for bash script testing (Windows)

## Risk Assessment

**High:** @mysten/sui version pinning may break with future updates
**Medium:** Generator bug may affect other file operations
**Low:** TypeScript type fixes may introduce new edge cases

**Mitigation:** Version compatibility matrix, CI tests per preset, cross-platform testing

## Timeline

- Phase 01: 1.5h (Critical path)
- Phase 02: 2h (Parallel with Phase 01)
- Phase 03: 1h
- Phase 04: 1h (Blocked by 1-3)
- Phase 05: 30m (Final validation)
- **Total:** ~6h sequential, ~4h with parallelization
