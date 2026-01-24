# Project Overview & PDR (Product Development Requirements)

**Project Name:** Walrus Starter Kit
**CLI Tool:** `create-walrus-app`
**Version:** 0.1.5
**Status:** Production Ready (Enoki Beta Integration)

## 1. Executive Summary

Walrus Starter Kit is a production-grade interactive CLI tool designed to simplify the development of applications on the Walrus Protocol (Sui blockchain). It provides a preset-based scaffolding system with pre-built, validated templates for rapid application development. The CLI offers multiple SDKs, frameworks, and use cases with full TypeScript support and automated post-install workflows.

## 2. Product Vision

The goal is to provide the "create-next-app" experience for the Walrus ecosystem.

- **Interactive Wizard:** Multi-step CLI flow with intelligent defaults
- **Preset Architecture:** Pre-built, validated template combinations for reliability
- **SDK Support:** Multiple Walrus SDKs (Mysten stable, Enoki beta, others planned)
- **Framework Options:** React (stable), Vue (planned), Plain TypeScript (planned)
- **Production Ready:** Best practices for TypeScript, linting, testing, and deployment
- **zkLogin Support:** Enoki integration for social authentication (beta)
- **Automated Setup:** Environment configuration, dependency install, validation

## 3. Target Audience

- **Frontend DApp Developers:** Primarily React/TS developers building Walrus storage applications
- **Full-Stack Developers:** Building dashboards and backends that interact with Walrus
- **Protocol Explorers:** Developers prototyping with different Walrus SDKs
- **zkLogin Adopters:** Teams implementing social authentication for Web3 apps

## 4. Key Requirements (PDR)

### 4.1 Functional Requirements

**Interactive CLI:**
1. Project name input with validation (NPM naming rules)
2. Preset selection from available options
3. Automated environment setup (.env.example → .env)
4. Package manager detection (npm, pnpm, yarn, bun)
5. Optional dependency installation with --skip-install flag
6. Optional validation with --skip-validation flag

**Available Presets:**
- **react-mysten-simple-upload:** Single file upload/download with React + @mysten/walrus
- **react-mysten-gallery:** Multi-file gallery with localStorage indexing
- **react-mysten-simple-upload-enoki:** Upload with zkLogin via Enoki (Beta)

**Template Generation:**
- Copy preset template to target directory
- Transform variables ({{projectName}}, {{sdk}}, etc.)
- Auto-copy .env.example → .env with non-critical error handling
- Atomic rollback on errors or SIGINT (Ctrl+C)
- Path traversal security validation

**Post-Install Automation:**
- Automatic dependency installation (detecting pnpm, npm, yarn, bun)
- TypeScript compilation validation (tsc --noEmit)
- package.json integrity check
- node_modules verification
- Clear success UI with next steps
- Error recovery instructions

**SDK Support:**
- **Mysten** (@mysten/walrus v0.9.0) - Testnet stable
- **Enoki** (@mysten/enoki) - Beta (scaffolding complete, logic pending)
- **Tusky** (@tusky-io/ts-sdk) - Planned
- **Hibernuts** (@hibernuts/walrus-sdk) - Planned

**Framework Support:**
- **React** - Production ready with Vite + TanStack Query + @mysten/dapp-kit
- **Vue** - Planned
- **Plain TypeScript** - Planned

### 4.2 Non-Functional Requirements

- **Performance:** CLI execution under 3 seconds (excluding network operations)
- **Reliability:** Zero broken presets - all templates validated via automated tests
- **Extensibility:** Easy to add new presets via copy-paste-modify workflow
- **UX/UI:** Arctic Shipyard design language for CLI, Deep Ocean Glass for templates
- **Security:** Path traversal prevention, NPM naming compliance, length limits
- **Testability:** 97.5% test coverage on CLI engine, integration tests for all presets

## 5. Technical Constraints

- **Node.js:** ^20.0.0 || ^22.0.0 || >=24.0.0
- **Package Manager:** pnpm >= 9.0.0 (for monorepo management)
- **Language:** TypeScript (strict mode) for all components and templates
- **Build Tool:** Vite 5+ for React presets
- **Testing:** Vitest for unit tests, bash scripts for integration tests

## 6. Success Metrics

- Successful scaffolding of all 3 available presets
- TypeScript compilation success rate: 100%
- Post-install automation success rate: >95%
- Test coverage: >95% for CLI engine
- Community adoption metrics (npm downloads, GitHub stars)
- Positive developer experience feedback

## 7. Architecture Overview

**Preset-Based System:**
- Pre-built, validated template combinations in `packages/cli/presets/`
- No runtime layer merging (migrated from original layer design)
- Each preset is independently tested and deployable

**CLI Flow:**
```
Entry → Parse Args → Prompts → Context → Validation → Generate → Post-Install
```

**Generation Process:**
1. Resolve preset path from context (SDK + framework + use-case)
2. Copy preset directory to target location
3. Transform variables in template files
4. Auto-copy .env.example → .env
5. Install dependencies (optional)
6. Validate project (optional)

**Post-Install Workflow:**
1. Detect package manager (npm_config_user_agent)
2. Run install command with streaming output
3. Validate package.json, node_modules, TypeScript compilation
4. Display success message with next steps

## 8. Compatibility Matrix

The CLI enforces valid combinations via `src/matrix.ts`:

| SDK | Frameworks | Use Cases | Status |
|-----|------------|-----------|--------|
| mysten | react, vue, plain-ts | simple-upload, gallery, defi-nft | React stable |
| enoki | react | simple-upload | Beta (scaffolding ready) |
| tusky | react, vue, plain-ts | simple-upload, gallery | Planned |
| hibernuts | react, plain-ts | simple-upload | Planned |

**Current Presets:**
- mysten + react + simple-upload ✅
- mysten + react + gallery ✅
- mysten + react + simple-upload + enoki ✅ (beta)

## 9. Design Language References

- **CLI Design:** [Arctic Shipyard](./design-guidelines.md#arctic-shipyard)
- **Template Design:** [Deep Ocean Glass](./design-guidelines.md#deep-ocean-glass)
- **Enoki Integration:** [Dual-Auth Flow](./design-guidelines.md#enoki-dual-auth)

## 10. Enoki Integration Status (Phase 10)

**Completed:**
- ✅ Phase 01: Scaffolding (folder structure, config, README)
- ✅ Phase 05: Documentation (Enoki setup guide, Google OAuth guide)

**Pending:**
- ⏳ Phase 02: Constants & Zod validation
- ⏳ Phase 03: EnokiProvider & Auth flow implementation
- ⏳ Phase 04: CLI matrix integration & testing

**Features:**
- zkLogin via Google OAuth
- SessionStorage adapter for Enoki
- Dual-auth flow (zkLogin + standard wallets)
- Production deployment guides for Walrus Sites

## 11. Known Issues & Limitations

- **Framework Support:** Only React is stable; Vue and Plain TS are planned but not implemented
- **SDK Coverage:** Mysten is stable, Enoki is beta (scaffolding only), Tusky/Hibernuts are planned
- **Git Automation:** Deprecated in v0.1.3 (users manage git manually)
- **Compatibility Matrix:** Matrix defines combinations not yet implemented (vue, plain-ts, tusky, hibernuts)

## 12. Future Roadmap

**Phase 11 (Planned):**
- Walrus Sites deployment integration (automatic build & publish)
- Seal integration for private blobs (access control)

**Phase 12 (Planned):**
- Vue.js framework templates
- Plain TypeScript templates

**Phase 13 (Planned):**
- Tusky SDK integration
- Hibernuts SDK integration
- Additional use cases (DeFi/NFT metadata)

## 13. References

- [Codebase Summary](./codebase-summary.md)
- [System Architecture](./system-architecture.md)
- [Code Standards](./code-standards.md)
- [Development Roadmap](./project-roadmap.md)
- [Design Guidelines](./design-guidelines.md)
