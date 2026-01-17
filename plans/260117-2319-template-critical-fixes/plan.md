---
title: "Fix Critical Template Bugs in Walrus Starter Kit"
description: "Fix import paths, SDK v0.9.0 compatibility, wallet integration, and improve template quality"
status: in-progress
priority: P0
effort: 12h
branch: main
tags: [templates, sdk-upgrade, wallet-integration, breaking-fix]
created: 2026-01-17
updated: 2026-01-18T00:17:00+07:00
---

# Implementation Plan: Template Critical Fixes

## Overview

This plan addresses **critical bugs** preventing generated projects from working. Issues include import path errors, SDK v0.9.0 breaking changes, missing wallet signer integration, and type mismatches.

## Context

- **Work Directory**: `d:\Sui\walrus-starter-kit`
- **Template Locations**: `packages/cli/templates/*`
- **Affected Layers**: `base`, `sdk-mysten`, `react`, `gallery`, `simple-upload`
- **SDK Version**: Upgrading to v0.9.0 (breaking API changes)

## Critical Issues Summary

1. **Import Path Errors** (P0) - Breaks all generated projects
2. **SDK v0.9.0 Breaking Changes** (P0) - API incompatibility
3. **Wallet Signer Integration** (P0) - Upload fails at runtime
4. **TypeScript Vite Config** (P1) - Missing type definitions
5. **Type Mismatches** (P1) - Compilation errors
6. **Git Automation** (P2) - Unwanted behavior
7. **Missing README Templates** (P2) - Poor DX

## Phases

### Status Legend
- ⬜ Pending
- 🔄 In Progress
- ✅ Completed

| Phase | Description | Status | Effort | Completed |
|-------|-------------|--------|--------|-----------|
| [Phase 1](phase-01-fix-import-paths.md) | Fix import paths in sdk-mysten | ✅ | 1h | 2026-01-17T23:54 |
| [Phase 2](phase-02-add-vite-types.md) | Add Vite types to tsconfig | ✅ | 0.5h | 2026-01-18T00:07 |
| [Phase 3](phase-03-update-sdk-api.md) | Update SDK v0.9.0 API calls | ✅ | 2h | 2026-01-18T00:17 |
| [Phase 4](phase-04-wallet-signer-integration.md) | Implement wallet signer integration | ⬜ | 3h | - |
| [Phase 5](phase-05-fix-type-mismatches.md) | Fix type mismatches | ⬜ | 1h | - |
| [Phase 6](phase-06-remove-git-automation.md) | Remove git automation | ⬜ | 0.5h | - |
| [Phase 7](phase-07-add-readme-templates.md) | Add README templates | ⬜ | 2h | - |
| [Phase 8](phase-08-testing-validation.md) | Testing and validation | ⬜ | 2h | - |

**Total Estimated Effort**: 12 hours

## Dependencies

- Phase 3 depends on Phase 1 (import paths must be fixed first)
- Phase 4 depends on Phase 3 (SDK API must be updated first)
- Phase 8 depends on all previous phases

## Success Criteria

- [ ] All generated projects compile without errors
- [ ] Upload functionality works with wallet integration
- [ ] All template combinations tested and validated
- [ ] No TypeScript errors in generated code
- [ ] Comprehensive README files in all templates

## Risk Assessment

**High Risk Areas**:
- Wallet signer integration (new architecture pattern)
- SDK v0.9.0 compatibility (breaking changes)

**Mitigation**:
- Test each phase incrementally
- Create backup of templates before changes
- Validate against all template combinations

## Next Steps

1. Start with Phase 1 (import paths) - highest priority blocker
2. Continue sequentially through phases
3. Run validation after each phase
4. Update project documentation after completion
