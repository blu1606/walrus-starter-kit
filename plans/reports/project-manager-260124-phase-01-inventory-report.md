# Project Manager Report — 2026-01-24 — Template Catalog Phase 01

## Summary of Phase 01: Inventory & Mapping

We have successfully completed the audit of the current template architecture. This phase provides the factual foundation for migrating to a composable catalog structure.

### Key Achievements

- **Comprehensive Audit**: All three production-ready presets (`simple-upload`, `gallery-new`, `enoki`) and legacy layers in `templates/` have been inventoried.
- **Script Verification**: Confirmed that maintenance and deployment scripts are 100% identical across all presets. These will be unified into a single source of truth in the catalog.
- **Pattern Validation**: Verified that `react-mysten-gallery-new` correctly implements modern `@mysten/dapp-kit` patterns, ensuring our "Gallery" feature slice will be built on the latest standards.
- **Asset Mapping**: Completed the mapping of existing components, hooks, and configurations to the new slice taxonomy (Base, Framework, Capability, Feature, Addons).
- **Cleanup Identification**: Identified a broken symlink at `packages/templates/react-mysten-gallery` which will be removed during the migration.

### Strategic Confirmations

- **Unification Feasibility**: Confirmed that `base` and `framework/react` layers can be fully unified. This will significantly reduce maintenance overhead as we add more features.
- **Composable Readiness**: The current assets are sufficiently modular to be decoupled into the proposed slice structure without major refactoring.

## Plan for Phase 02: Target Catalog Layout

The primary objective for Phase 02 is to establish the physical structure of the `packages/templates/catalog` and define the metadata/naming conventions.

### Proposed Tasks for Phase 02

1. **Catalog Initialization**: Create `packages/templates/catalog` directory structure.
2. **Base Slice Setup**: Move shared non-framework assets (configs, scripts) to `catalog/base`.
3. **Framework Slice Setup**: Move React-specific scaffolding to `catalog/framework/react`.
4. **Capability Extraction**: Isolate `storage/walrus-mysten` and `auth/enoki-zklogin` as independent capability slices.
5. **Feature Extraction**: Isolate `simple-upload` and `gallery` as feature slices.
6. **Metadata Definition**: Define how each slice declares its compatibility and display names (e.g., `slice.json` or similar).

### Unresolved Questions

- Should we use a flat `catalog/` structure or nested categories as proposed? (Nested categories preferred for scalability).
- How will we handle `package.json` merging during composition? (Likely using the existing deep merge logic in the CLI).
