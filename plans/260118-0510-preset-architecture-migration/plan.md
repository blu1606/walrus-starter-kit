# Preset Architecture Migration Plan

Migrate from runtime layer merging to pre-built presets.

## Context

**Current Issues:**
- Runtime merge complexity
- Unpredictable overrides
- Difficult debugging for users
- Package.json pollution

**Solution:**
- Pre-build all preset combinations
- Ship complete templates
- Simple copy operation at runtime

## Status: Planning

**Created:** 2026-01-18 05:10
**Updated:** 2026-01-18 05:11
**Priority:** High

## Phases

### Phase 01: Preset Structure Design ✅ COMPLETE
- [x] Research React/Next.js standards
- [x] Document recommended structures
- [x] Define preset matrix

**Deliverables:**
- [docs/preset-structure-standards.md](../../docs/preset-structure-standards.md)

---

### Phase 02: Preset Generator Script
- [ ] Create build script to generate presets
- [ ] Implement layer merging logic
- [ ] Add validation checks
- [ ] Test all combinations

**Files:**
- `packages/cli/scripts/build-presets.ts` (new)
- `packages/cli/scripts/validate-preset.ts` (new)

---

### Phase 03: Refactor CLI Generator
- [ ] Simplify generator to use presets
- [ ] Remove runtime merge logic
- [ ] Update file copy operations
- [ ] Add preset validation

**Files to modify:**
- `packages/cli/src/generator/index.ts`
- `packages/cli/src/generator/layers.ts`
- Remove: `packages/cli/src/generator/merge.ts`

---

### Phase 04: Package Configuration
- [ ] Update package.json files field
- [ ] Configure build scripts
- [ ] Update .gitignore
- [ ] Add prebuild hooks

**Files:**
- `packages/cli/package.json`
- `packages/cli/.gitignore`

---

### Phase 05: Testing & Validation
- [ ] Test preset generation
- [ ] Validate all combinations
- [ ] Integration testing
- [ ] E2E testing

**Files:**
- `packages/cli/tests/presets.test.ts` (new)
- Update existing integration tests

---

### Phase 06: Documentation
- [ ] Update README
- [ ] Add architecture docs
- [ ] Update contributing guide
- [ ] Create migration guide

---

## Success Criteria

- ✅ All preset combinations generate successfully
- ✅ Generated presets follow structure standards
- ✅ Generation time < 0.5s per preset
- ✅ No runtime merge logic
- ✅ All tests pass
- ✅ Package size < 3MB

## Links

- [Structure Standards](../../docs/preset-structure-standards.md)
- [Reports](../../plans/reports/)
