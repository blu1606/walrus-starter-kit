# Preset Combinations Matrix

Analysis of all possible preset combinations for Walrus Starter Kit.

## Current Templates (Layers)

### Frameworks
- `react` - React 18 + Vite
- ~~`vue`~~ (not yet implemented)
- ~~`plain-ts`~~ (not yet implemented)

### SDKs
- `sdk-mysten` - @mysten/walrus + @mysten/sui
- ~~`sdk-tusky`~~ (not yet implemented)
- ~~`sdk-hibernuts`~~ (not yet implemented)

### Use Cases
- `simple-upload` - Single file upload demo
- `gallery` - Image gallery with upload/browse
- ~~`defi-nft`~~ (not yet implemented)

### Optional Layers
- ~~`enoki`~~ - Enoki authentication (experimental)
- ~~`tailwind`~~ (not yet implemented)
- ~~`analytics`~~ (not yet implemented)

## Preset Matrix (MVP)

Current valid combinations:

| Preset Name | Framework | SDK | Use Case | Priority |
|-------------|-----------|-----|----------|----------|
| `react-mysten-simple-upload` | react | mysten | simple-upload | 🔥 High |
| `react-mysten-gallery` | react | mysten | gallery | 🔥 High |

**Total:** 2 presets (MVP)

## Future Presets

When additional templates are added:

### Phase 2
| Preset Name | Framework | SDK | Use Case | Status |
|-------------|-----------|-----|----------|--------|
| `react-mysten-simple-upload-enoki` | react | mysten | simple-upload + enoki | 🚧 Experimental |
| `react-mysten-gallery-enoki` | react | mysten | gallery + enoki | 🚧 Experimental |

### Phase 3
| Preset Name | Framework | SDK | Use Case | Status |
|-------------|-----------|-----|----------|--------|
| `vue-mysten-simple-upload` | vue | mysten | simple-upload | 📋 Planned |
| `vue-mysten-gallery` | vue | mysten | gallery | 📋 Planned |

### Phase 4
| Preset Name | Framework | SDK | Use Case | Status |
|-------------|-----------|-----|----------|--------|
| `nextjs-mysten-gallery` | nextjs | mysten | gallery | 📋 Planned |
| `nextjs-mysten-simple-upload` | nextjs | mysten | simple-upload | 📋 Planned |

## Layer Dependencies

### Base Layer
**Required by:** All presets
**Contains:**
- TypeScript config
- ESLint config
- Base types
- Utility functions

### Framework Layers
**Required by:** All presets
**Options:**
- `react` → Vite + React 18
- `vue` → Vite + Vue 3
- `nextjs` → Next.js 14/15

### SDK Layers
**Required by:** All presets
**Options:**
- `sdk-mysten` → @mysten/walrus
- `sdk-tusky` → tusky/walrus (future)

### Use Case Layers
**Required by:** All presets
**Options:**
- `simple-upload` → Minimal upload UI
- `gallery` → Full gallery features

### Optional Layers
**Optional modifiers:**
- `enoki` → Adds Enoki auth
- `tailwind` → Adds Tailwind CSS
- `analytics` → Adds Blockberry analytics

## Preset Generation Logic

### Layer Merge Priority

```
1. base           (foundation)
2. sdk-{name}     (SDK integration)
3. {framework}    (UI framework)
4. {use-case}     (feature logic)
5. tailwind       (optional styling)
6. analytics      (optional tracking)
7. enoki          (optional auth)
```

Later layers override earlier layers.

### File Merge Strategy

**package.json:**
- Deep merge dependencies
- Override scripts from use-case layer
- Keep name from template variable

**Source files:**
- Later layers completely override
- No file-level merging

**Config files:**
- Use from latest layer
- No merging (ESLint, TypeScript, etc.)

## Preset Size Estimates

Based on current templates:

| Preset | Estimated Size | Files |
|--------|---------------|-------|
| `react-mysten-simple-upload` | ~150KB | ~25 |
| `react-mysten-gallery` | ~200KB | ~35 |

**Total package size:** ~2.5MB (including CLI code, all presets, node_modules)

**Acceptable:** npm packages commonly 1-5MB

## Validation Matrix

Each preset must pass:

✅ **Build checks:**
- `pnpm install` succeeds
- `pnpm build` succeeds
- `pnpm type-check` succeeds
- `pnpm lint` succeeds

✅ **Runtime checks:**
- `pnpm dev` starts dev server
- No console errors on load
- Wallet connection works

✅ **File structure:**
- All required config files present
- package.json valid
- TypeScript paths resolve

## Preset Naming Convention

**Format:** `{framework}-{sdk}-{use-case}[-optional-features]`

**Examples:**
- `react-mysten-simple-upload`
- `react-mysten-gallery-enoki`
- `vue-mysten-gallery-tailwind`
- `nextjs-mysten-simple-upload-enoki-analytics`

**Rules:**
- Lowercase, kebab-case
- Framework first (most important)
- SDK second (critical dependency)
- Use-case third (feature set)
- Optional features last (alphabetical)

## Current vs. Future

### MVP (Now)
```
presets/
├── react-mysten-simple-upload/
└── react-mysten-gallery/
```

### Full Vision (Future)
```
presets/
├── react-mysten-simple-upload/
├── react-mysten-simple-upload-enoki/
├── react-mysten-gallery/
├── react-mysten-gallery-enoki/
├── react-mysten-gallery-tailwind/
├── vue-mysten-simple-upload/
├── vue-mysten-gallery/
├── nextjs-mysten-simple-upload/
└── nextjs-mysten-gallery/
```

**Estimated:** 10-15 presets total

## Implementation Priority

### Tier 1: MVP (Critical Path)
1. `react-mysten-simple-upload` ← Most common use case
2. `react-mysten-gallery` ← Production-ready pattern

### Tier 2: Enoki Integration
3. `react-mysten-simple-upload-enoki`
4. `react-mysten-gallery-enoki`

### Tier 3: Framework Expansion
5. `vue-mysten-simple-upload`
6. `vue-mysten-gallery`

### Tier 4: Advanced Patterns
7. `nextjs-mysten-gallery`
8. `nextjs-mysten-simple-upload`

## Decision Points

### ❓ Should we generate all combinations?

**Option A:** Pre-generate all valid combinations
- ✅ Fast user experience
- ✅ Fully tested
- ❌ Large package size
- ❌ More CI/CD time

**Option B:** Generate on-demand (keep current approach)
- ✅ Smaller package
- ❌ Slower generation
- ❌ Merge complexity

**Recommendation:** Option A (pre-generate)
- Package size acceptable (<3MB)
- User experience priority
- Easier testing

### ❓ How to handle Enoki layer?

**Option A:** Separate presets (with/without Enoki)
- ✅ Clear separation
- ✅ Easy to test
- ❌ Double the presets

**Option B:** Optional flag (add Enoki at runtime)
- ✅ Fewer presets
- ❌ Back to runtime merging
- ❌ Complexity

**Recommendation:** Option A (separate presets)
- Maintains simplicity
- Clear user choice
- Acceptable preset count

## Next Steps

1. Implement preset generator for MVP (2 presets)
2. Validate generation process
3. Test user workflows
4. Expand to Tier 2 (Enoki)
5. Gather feedback before Tier 3/4
