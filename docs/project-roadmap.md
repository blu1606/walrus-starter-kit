# Project Roadmap - Walrus Starter Kit

## Project Overview
**Target:** `npm create walrus-app@latest` - Production-ready CLI scaffolder
**Architecture:** Monorepo + Base/Layer + Adapter Pattern
**Timeline:** 8 days (Jan 18-25, 2026)
**MVP Scope:** 1 SDK × 1 Framework × 3 Use Cases

---

## 🗺️ Implementation Phases

### Phase 1: Monorepo Foundation (DONE)
- [x] pnpm workspace setup
- [x] Root configuration (TypeScript, ESLint, Prettier)
- [x] Directory structure creation
- [x] Git initialization and configuration
- [x] CLI package skeleton
- [x] Build and test validation

### Phase 2: CLI Engine Core (IN PROGRESS)
- [ ] Commander.js setup
- [ ] Interactive prompts (prompts)
- [ ] Project context object
- [ ] Runtime validation matrix
- [ ] Basic project generation logic

### Phase 3: Template Base Layer (PENDING)
- [ ] Adapter interface definitions
- [ ] Core directory structure
- [ ] Shared configuration files

### Phase 4: SDK Layer (PENDING)
- [ ] @mysten/walrus implementation
- [ ] SDK-specific dependencies

### Phase 5: Framework Layer (PENDING)
- [ ] React + Vite template
- [ ] Vue + Vite template
- [ ] Plain TypeScript template

### Phase 6: Use Case Layers (PENDING)
- [ ] Simple Upload implementation
- [ ] File Gallery implementation
- [ ] DeFi/NFT Metadata implementation

### Phase 7: Template Generation Engine (PENDING)
- [ ] Deep JSON merge logic
- [ ] File composition system
- [ ] Path resolution and copying

### Phase 8: Post-Install & Validation (PENDING)
- [ ] Package manager detection
- [ ] Dependency installation automation
- [ ] Generated project validation

---

## 📈 Progress Summary
- **Overall Completion:** 12.5% (1/8 Phases)
- **Current Milestone:** CLI Engine Core
- **Last Update:** 2026-01-17

---

## 📝 Changelog

### [0.1.0] - 2026-01-17
#### Added
- Initial monorepo structure with pnpm workspaces
- Root-level shared tooling (TypeScript, ESLint, Prettier)
- `packages/cli` package skeleton with build system
- Project implementation plans and PRD documentation
- Project roadmap and changelog tracking
