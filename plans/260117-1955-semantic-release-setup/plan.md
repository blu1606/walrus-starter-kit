---
title: "Semantic-Release Automation Setup"
description: "Automate versioning and NPM publishing for @walrus-kit/create-walrus-app"
status: pending
priority: P2
effort: 6h
branch: main
tags: [automation, ci-cd, semantic-release, npm, provenance]
created: 2026-01-17
---

# Semantic-Release Setup Implementation Plan

## Overview
Implement automated versioning and NPM publishing using semantic-release for the walrus-starter-kit monorepo. The setup will use conventional commits to determine version bumps and automatically publish to NPM with provenance support.

## Context
- **Research Report**: `plans/reports/researcher-260117-1952-semantic-release-pnpm-monorepo.md`
- **Current State**: Manual versioning, no automated releases
- **Target Package**: `@walrus-kit/create-walrus-app` in `packages/cli/`
- **Package Manager**: pnpm 9+
- **Node Version**: 20+ (CI uses Node 20)
- **CI Platform**: GitHub Actions

## Implementation Phases

### Phase 1: Dependencies Installation (30m)
**File**: `phase-01-install-dependencies.md`
- Install semantic-release core and plugins
- Configure pnpm workspace for release tooling
- **Status**: Pending

### Phase 2: Configuration Setup (1h)
**File**: `phase-02-configuration-setup.md`
- Create `.releaserc.json` in packages/cli/
- Configure conventional commits parsing
- Setup changelog, npm, github, and git plugins
- **Status**: Pending

### Phase 3: GitHub Actions Workflow (1.5h)
**File**: `phase-03-github-actions-workflow.md`
- Create `.github/workflows/release.yml`
- Configure manual trigger with workflow_dispatch
- Setup NPM provenance with id-token permissions
- Add environment protection (optional)
- **Status**: Pending

### Phase 4: Package.json Updates (30m)
**File**: `phase-04-package-updates.md`
- Add release script to root package.json
- Update CLI package.json for semantic-release compatibility
- Configure publishConfig and repository fields
- **Status**: Pending

### Phase 5: Documentation and Testing (1.5h)
**File**: `phase-05-documentation-testing.md`
- Document release process in README.md
- Create CONTRIBUTING.md with commit conventions
- Test dry-run release locally
- Validate workflow in CI
- **Status**: Pending

### Phase 6: First Release Execution (1h)
**File**: `phase-06-first-release.md`
- Execute first semantic-release
- Verify NPM package with provenance
- Create GitHub release
- Update CHANGELOG.md
- **Status**: Pending

## Success Criteria
- ✅ Automated version bumps based on conventional commits
- ✅ NPM package published with provenance attestation
- ✅ GitHub releases created automatically
- ✅ CHANGELOG.md updated with each release
- ✅ Version tags follow format: `@walrus-kit/create-walrus-app-vX.Y.Z`
- ✅ Manual trigger workflow with protection

## Dependencies
- NPM_TOKEN secret configured in GitHub repository
- Conventional commit messages in git history
- CI pipeline passing (lint, test, build)

## Risk Mitigation
- Start with dry-run mode to validate configuration
- Use manual workflow_dispatch trigger to control releases
- Enable branch protection on main to prevent accidental releases
- Test with prerelease versions first

## Next Steps
Begin with Phase 1: Install dependencies and configure workspace
