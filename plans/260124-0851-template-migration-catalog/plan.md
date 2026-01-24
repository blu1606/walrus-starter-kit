---
title: Template Catalog Migration Plan
description: Migrate from preset-only scaffolding to a composable catalog of slices (base/framework/capabilities/features/providers/addons).
status: in-progress
priority: high
effort: medium
branch: feat/template-catalog
tags: [cli, templates, architecture, migration]
created: 2026-01-24
---

# Template Catalog Migration Plan (Walrus Starter Kit)

## Objective

- Migrate from preset-only scaffolding to a catalog of composable slices (base/framework/capabilities/features/providers/addons/examples) inspired by create-better-t-stack.
- Keep generator thin; emit only selected slices; enforce compatibility before generation.

## Current State (constraints)

- Presets live in `packages/templates/` (`react-mysten-simple-upload`, `react-mysten-gallery`, `react-mysten-simple-upload-enoki`); `packages/cli/presets/` is empty.
- Legacy reference layers in `templates/` (base, sdk-mysten, enoki, react, simple-upload, gallery) with READMEs.
- CLI pipeline today: args → prompts → context → matrix validation → copy preset → transform → post-install. Compatibility matrix exists but only Mysten+React presets are implemented.

## Target Approach

- Catalog slices: base → framework → capability/_ (storage/auth/liquidity/policy) → providers → feature/_ → addons/examples → deploy.
- Compatibility gating: enforce allowed SDK/framework/capability combos up front (mysten/enoki/tusky/hibernuts × react/vue/plain-ts; opt-in examples/addons) similar to better-t-stack `compatibility-rules`.
- Generation: virtual FS-style composition before write; apply templating only once; output minimal files for selected options.
- Documentation: keep plan/docs in `plans/260124-0851-template-migration-catalog` and `docs/` as needed.

## Deliverables

- Phase specs (below) with exit criteria.
- Mapping of current presets/layers to new catalog slices.
- Draft compatibility matrix + gating rules.
- Target catalog layout proposal.
- Migration steps for CLI and templates packages.

## Validation Summary

**Validated:** 2026-01-24
**Questions asked:** 4

### Confirmed Decisions

- **Catalog Path**: `packages/templates/catalog` - Kept within the templates package for cohesive logic.
- **Templating Engine**: `Handlebars` - Confirmed for its flexibility and logic support.
- **Planned Features UX**: `Hide completely` - CLI will only show currently working options (Mysten, React) to avoid confusion.
- **VFS Implementation**: `Lightweight custom version` - Will implement a focused in-memory tree for composition without external bloat.

### Action Items

- [x] Implement `isCompatible` logic to hide planned options in `phase-03-compat-matrix.md`. (DONE)
- [x] Define custom `VirtualFS` interfaces in `phase-04-generator-approach.md`. (DONE)

## Phases

1. [x] [phase-01-inventory.md](./phase-01-inventory.md) — Inventory presets/templates, map assets to slices. (DONE)
2. [x] [phase-02-target-layout.md](./phase-02-target-layout.md) — Define catalog directory/naming and slice taxonomy. (DONE)
3. [x] [phase-03-compat-matrix.md](./phase-03-compat-matrix.md) — Draft compatibility rules and validation flow. (DONE)
4. [x] [phase-04-generator-approach.md](./phase-04-generator-approach.md) — Choose generation/composition mechanics and integration points. (DONE)
5. [phase-05-migration-plan.md](./phase-05-migration-plan.md) — Stepwise migration from presets to catalog.
6. [phase-06-validation.md](./phase-06-validation.md) — Validation questions (3–8) and acceptance criteria.

## Assumptions / Risks

- Enoki remains beta; Tusky/Hibernuts planned but not implemented—rules must allow gating without code.
- Broken symlink observed at `packages/templates/react-mysten-gallery` (note for cleanup in migration phase).
- No code changes yet; plan only.
