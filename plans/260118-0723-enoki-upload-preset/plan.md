---
title: "Enoki zkLogin Simple Upload Preset"
description: "Create react-mysten-simple-upload-enoki preset with Google OAuth zkLogin authentication"
status: pending
priority: P1
effort: 6h
branch: main
tags: [preset, enoki, zklogin, authentication, upload]
created: 2026-01-18
---

# Enoki zkLogin Simple Upload Preset

## Overview

Create new preset `react-mysten-simple-upload-enoki` that combines:
- ALL upload/download functionality from `react-mysten-simple-upload`
- Enoki zkLogin authentication (Google OAuth) from `templates/enoki`
- Keep existing UI structure, enhance with zkLogin auth
- NO DeepBook integration

## Implementation Phases

### Phase 01: Project Structure Setup
**Status:** complete ✓ | **File:** phase-01-project-structure.md | **Completed:** 2026-01-18
- Create preset directory structure
- Copy base files from simple-upload
- Setup package.json with Enoki dependencies
- Create .env.example with Enoki keys

### Phase 02: Enoki Provider Integration
**Status:** complete ✓ | **File:** phase-02-enoki-provider.md | **Completed:** 2026-01-18
- Implement EnokiProvider wrapper
- Add storage adapter for session persistence
- Setup Enoki constants with Zod validation
- Integrate with existing WalletProvider

### Phase 03: Authentication UI Components
**Status:** complete ✓ | **File:** phase-03-auth-ui.md | **Completed:** 2026-01-18
- Create Google login button component
- Enhance wallet-connect with zkLogin support
- Add auth state management hooks
- Update app layout for dual auth

### Phase 04: Upload Integration
**Status:** complete ✓ | **File:** phase-04-upload-integration.md | **Completed:** 2026-01-18
- Adapt use-upload hook for zkLogin
- Update upload form with Enoki signer
- Ensure backward compatibility with standard wallets
- Test upload flow with both auth methods

### Phase 05: Documentation & Setup
**Status:** pending | **File:** phase-05-documentation.md
- Write comprehensive README
- Document Enoki setup steps
- Add troubleshooting guide
- Create example .env configuration

### Phase 06: Testing & Validation
**Status:** pending | **File:** phase-06-testing.md
- Manual testing with Google OAuth
- Verify upload/download flows
- Test wallet fallback scenarios
- Validate environment configuration

## Dependencies

- Phase 02 depends on Phase 01
- Phase 03 depends on Phase 02
- Phase 04 depends on Phase 03
- Phase 05 can run parallel to Phase 04
- Phase 06 depends on all previous phases

## Success Criteria

- [ ] Preset generates functional React app
- [ ] Google OAuth login works
- [ ] File upload with zkLogin signer succeeds
- [ ] File download by Blob ID works
- [ ] Standard wallet auth still works
- [ ] Environment setup documented
- [ ] All files under 200 lines
- [ ] No mocks or TODOs in production code

## Key Constraints

- YAGNI: Only zkLogin auth, no DeepBook
- KISS: Reuse simple-upload structure
- DRY: Share components where possible
- File size: Keep under 200 lines
- Naming: Use kebab-case
- No breaking changes to existing presets

## Unresolved Questions

None at plan creation.
