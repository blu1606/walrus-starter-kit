# Walrus Starter Kit Core MVP Implementation

**Date**: 2026-01-17 19:00
**Severity**: High
**Component**: Monorepo CLI Core & Templates
**Status**: Resolved

## What Happened

Successfully implemented the foundational MVP for the Walrus Starter Kit. This included setting up the pnpm monorepo, building the CLI engine core using Commander and Prompts, and establishing the "Base/Layer/Adapter" architecture. We delivered 6 template combinations (React, Vue, Plain TS) with "Simple Upload" and "File Gallery" use cases.

## The Brutal Truth

Starting a monorepo from scratch is always a grind. The initial struggle with `pnpm workspace` configurations and making sure the CLI could actually locate its own template files across different environments was a predictable but annoying hurdle. We almost tripped over our own feet trying to support too many SDKs initially before realizing we had to focus exclusively on `@mysten/walrus` to hit the deadline. The "universal" dream is hard when the underlying APIs are shifting underneath you.

## Technical Details

- **Architecture**: Monorepo with `packages/cli` and `packages/sdk`.
- **Generation Engine**: Implemented a custom deep-merge algorithm for `package.json` and config files to avoid the "template hell" of maintaining dozens of static files.
- **SDK**: Successfully integrated `@mysten/walrus` v0.9.0 with WASM support.
- **Bundle Size**: Had to relax the initial 200KB target to 300KB because the Walrus SDK WASM is just heavy.

## What We Tried

- **Layered Composition**: Used a runtime merging strategy where the CLI picks a base framework and overlays use-case specific files.
- **Adapter Pattern**: Created a `WalrusStorageAdapter` interface to hide SDK-specific logic from the UI components.

## Root Cause Analysis

Initial complexity was driven by trying to be too "generic." We spent too much time thinking about Supporting `@tusky` and `@hibernuts` before even getting the official Mysten SDK working smoothly.

## Lessons Learned

1. **Focus on the Official Path**: For an MVP, stick to the official SDK. Don't let "future-proofing" kill your velocity.
2. **Path Resolution is Pain**: `__dirname` and relative paths in a monorepo are a minefield, especially when the CLI is meant to be run globally.
3. **WASM Weight**: Don't underestimate the impact of WASM-heavy SDKs on bundle size and Vite configuration.

## Next Steps

- Move from runtime merging to pre-built presets to improve reliability.
- Add E2E tests for the generated projects.
- Implement better error handling for network-related upload failures.
