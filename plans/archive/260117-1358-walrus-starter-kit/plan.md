---
title: 'Walrus Starter Kit Implementation'
description: 'Production-ready interactive CLI scaffolder for Walrus applications'
status: completed
priority: P1
effort: 48h
branch: main
tags: [cli, scaffolding, monorepo, walrus, sui]
created: 2026-01-17
---

# Walrus Starter Kit - Implementation Plan

**Target:** `npm create walrus-app@latest` - Production-ready CLI scaffolder
**Timeline:** 8 days (48 hours dev time)
**Budget:** $1,500
**Architecture:** Monorepo + Base/Layer + Adapter Pattern

## MVP Scope

**1 SDK × 3 Frameworks × 2 Use Cases** (6 template combinations)

- **Primary SDK:** @mysten/walrus (testnet stable)
- **Frameworks:** React + Vite, Vue + Vite, Plain TypeScript
- **Use Cases:** Simple Upload, File Gallery

## Critical Success Factors

✅ **Adapter Pattern** - SDK-agnostic use case layers
✅ **Deep JSON Merge** - Zero package.json conflicts
✅ **Compatibility Matrix** - Runtime validation
✅ **Post-Install Checks** - Zero broken templates
✅ **Progressive Enhancement** - Add SDKs/frameworks modularly

## Implementation Phases

### Phase 1: Monorepo Foundation ⏱️ 4h

**Status:** completed | **Priority:** High
Setup pnpm workspace, root configs, directory structure
📄 [Detailed Plan](./phase-01-monorepo-foundation.md)

### Phase 2: CLI Engine Core ⏱️ 6h

**Status:** completed | **Priority:** High | **Completed:** 2026-01-17 15:59
Commander + prompts, context object, validation system
📄 [Detailed Plan](./phase-02-cli-engine-core.md)

### Phase 3: Template Base Layer ⏱️ 5h

**Status:** completed | **Priority:** High | **Completed:** 2026-01-17 16:56
Adapter interface, base directory structure, core configs
📄 [Detailed Plan](./phase-03-template-base-layer.md)

### Phase 4: SDK Layer (@mysten/walrus) ⏱️ 6h

**Status:** completed | **Completed:** 2026-01-17 17:20 | **Priority:** High  
Walrus client, upload/download adapters, type definitions  
📄 [Detailed Plan](./phase-04-sdk-layer.md)

### Phase 5: Framework Layer (React+Vite) ⏱️ 6h

**Status:** completed | **Completed:** 2026-01-17 16:55 | **Priority:** High  
React template, Vite config, component architecture  
📄 [Detailed Plan](./phase-05-framework-layer.md)

### Phase 6: Use Case Layers ⏱️ 8h

**Status:** completed | **Completed:** 2026-01-17 18:16 | **Priority:** High  
Simple Upload, File Gallery, DeFi/NFT templates  
📄 [Detailed Plan](./phase-06-use-case-layers.md)

### Phase 7: Template Generation Engine ⏱️ 6h

**Status:** completed | **Priority:** High | **Completed:** 2026-01-17 16:22
Deep merge, file copying, layer composition
📄 [Detailed Plan](./phase-07-generation-engine.md)

### Phase 8: Post-Install & Validation ⏱️ 7h

**Status:** completed | **Completed:** 2026-01-17 18:55 | **Priority:** Medium  
Package manager detection, dependency install, validation  
📄 [Detailed Plan](./phase-08-post-install.md)

## Critical Path

```
Phase 1 → Phase 2 → Phase 7 (parallel with 3-6)
         ↓
Phase 3 → Phase 4 → Phase 5 → Phase 6
         ↓                      ↓
         └──────────────────────→ Phase 8
```

**Parallel Opportunities:**

- Phases 3-6 can be developed simultaneously after Phase 2
- Phase 7 implementation can start alongside template development

## Risk Mitigation

| Risk                  | Mitigation                           |
| --------------------- | ------------------------------------ |
| SDK API changes       | Pin versions, mock interfaces        |
| Template conflicts    | Deep merge testing, validation suite |
| CLI complexity        | Progressive prompts, defaults        |
| Cross-platform issues | Test on Linux/macOS/Windows          |

## Success Criteria

- [x] `npm create walrus-app@latest` works end-to-end
- [x] All 3 use case templates generate successfully
- [x] Post-install validation passes for all templates
- [x] Templates run `npm run dev` without errors
- [ ] Documentation complete (README + CONTRIBUTING)
- [ ] E2E tests cover happy path + error cases

## Research Context

This plan synthesizes findings from:

- [Next.js App Router Research](../reports/researcher-260117-1353-nextjs-app-router.md)
- [CLI Scaffolding Research](../reports/researcher-260117-1353-cli-scaffolding.md)
- [pnpm Monorepo Research](../reports/researcher-260117-1353-pnpm-monorepo.md)
- [Mysten Walrus SDK Research](../reports/researcher-260117-1353-mysten-walrus-sdk.md)
- [Product Requirements Document](../../POC/PRD.md)

## Validation Summary

**Validated:** 2026-01-17
**Questions asked:** 8

### Confirmed Decisions

1. **SDK Strategy**: @mysten/walrus only for MVP
   - Focus on official SDK with stable testnet/mainnet support
   - Other SDKs (@tusky, @hibernuts) deferred to post-MVP
   - Adapter pattern allows future SDK additions

2. **Deep Merge Strategy**: Custom algorithm with array replacement
   - Objects merge recursively, arrays/primitives replace
   - Matches create-next-app pattern, simpler to understand
   - Already implemented in Phase 7 design

3. **Blob Epochs Default**: 1 epoch (~2 weeks mainnet)
   - Low cost for demos/testing
   - Users can override via options parameter
   - Suitable for cache/short-lived use cases

4. **State Management**: Include Zustand for upload queue
   - Outperforms Context API for non-render-blocking updates
   - Better DX for file galleries with persistent queue state
   - 45KB gzipped acceptable for improved performance

5. **Tailwind CSS**: Opt-out (default: true)
   - Matches modern template expectations
   - CLI provides --no-tailwind flag for opt-out
   - Users expect styled examples in generated templates

6. **Upload Pattern**: Relay-only (no fallback)
   - Simpler implementation, fewer failure modes
   - Research shows relay handles erasure encoding efficiently
   - Lighter for browsers, relies on public relay infrastructure

7. **Bundle Size Target**: Relaxed to <300KB total
   - More realistic given Walrus SDK includes WASM
   - Still uses tree-shaking + dynamic imports for optimization
   - Vite plugin warns on oversized chunks, bundlewatch monitors diffs

8. **Windows Path Handling**: Use path module only (<260 chars)
   - path.join/resolve handle cross-platform correctly
   - Most project paths stay under limit
   - Simpler implementation, avoids \\\\?\\ prefix complexity

### Action Items

- [ ] Update Phase 7 bundle size warnings from 200KB → 300KB
- [ ] Document bundle size relaxation rationale in vite.config.ts comments
- [ ] Ensure Zustand dependency is added to React framework layer package.json
- [ ] Verify 1 epoch default is configurable via adapter UploadOptions

### Notes

All recommended approaches were confirmed. Plan is ready for implementation with no major changes required. Bundle size relaxation is the only deviation from original targets—reflects realistic SDK weight constraints while maintaining optimization discipline.

## Next Steps

1. Review each phase file for detailed implementation steps
2. Set up development environment (Node 18+, pnpm 9+)
3. Start with Phase 1: Monorepo Foundation
4. Track progress using phase status updates
