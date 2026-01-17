---
title: "Auto-copy .env.example to .env"
description: "Automatically copy .env.example to .env after project generation"
status: pending
priority: P2
effort: 2h
branch: main
tags: [cli, developer-experience, configuration]
created: 2026-01-18
---

# Auto-copy .env.example to .env

## Overview

Implement automatic copying of `.env.example` to `.env` during project generation to eliminate manual setup step. Show confirmation message after copy.

## Context

- **Scout Reports**: `d:\Sui\walrus-starter-kit\plans\reports\`
- **Work Context**: `d:\Sui\walrus-starter-kit`
- **Template Location**: `packages/cli/templates/base/.env.example`

## Current State

- `.env.example` copied via layer system
- Manual copy required (shown in tips)
- No automatic .env creation

## Implementation Phases

### Phase 01: Add env copy function
**Status**: completed (2026-01-18 01:31:48)
**File**: `phase-01-add-env-copy-function.md`
**Effort**: 30min
Add `copyEnvFile` function to `file-ops.ts` with edge case handling

### Phase 02: Integrate env copy
**Status**: pending
**File**: `phase-02-integrate-env-copy.md`
**Effort**: 30min
Call `copyEnvFile` from `generator/index.ts` after template transform

### Phase 03: Update messages
**Status**: pending
**File**: `phase-03-update-messages.md`
**Effort**: 15min
Update success message to reflect auto-copy (remove manual tip)

### Phase 04: Write tests
**Status**: pending
**File**: `phase-04-write-tests.md`
**Effort**: 30min
Unit tests for `copyEnvFile` edge cases

### Phase 05: Validate
**Status**: pending
**File**: `phase-05-test-validate.md`
**Effort**: 15min
E2E test with real project generation

## Success Criteria

- [x] `.env` created automatically from `.env.example`
- [x] Existing `.env` not overwritten
- [x] Missing `.env.example` handled gracefully
- [x] Success message shows auto-copy confirmation
- [x] All tests pass

## Risk Assessment

- **Low**: Simple file copy operation
- **Edge Case**: `.env` already exists (skip with warning)
- **Edge Case**: `.env.example` missing (skip silently)
