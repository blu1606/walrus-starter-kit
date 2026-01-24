# User Experience Polish: PM Selection & Env Handling

**Date**: 2026-01-18 01:31
**Severity**: Low
**Component**: CLI Prompts
**Status**: Resolved

## What Happened

Implemented two key quality-of-life features: explicit Package Manager (PM) selection and automatic `.env.example` to `.env` copying.

## The Brutal Truth

These are the kind of things you forget when you're focusing on "Big Tech" like Walrus protocol, but they are exactly what makes a CLI feel amateur if missing. It's annoying when a CLI assumes you use `npm` when you're a `bun` person, or when you have to manually copy `.env` files just to get the thing to run. These small friction points add up.

## Technical Details

- **PM Prompt**: Added a dedicated step in `prompts.ts` that defaults to auto-detected PM but allows override.
- **Env Copy**: Added logic to the post-generation phase to check for `.env.example` and create a local `.env` copy if one doesn't exist.

## What We Tried

- Auto-detection only (failed for users with multiple PMs).
- Hardcoded PMs in templates (too rigid).

## Root Cause Analysis

Initial focus was on the "Happy Path" for the developer (me), who uses `pnpm` for everything. We ignored the diversity of the JS ecosystem.

## Lessons Learned

1. **Don't Assume**: Just because you can detect something doesn't mean the user wants you to use it.
2. **First-Run Friction**: The first 30 seconds after `npm create` are the most critical. Anything that requires a manual command (like `cp .env.example .env`) is a failure.

## Next Steps

- Monitor feedback on the prompt ordering.
- Consider adding more "Post-Install" automations like initializing a git repo.
