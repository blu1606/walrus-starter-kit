# Early Bug Fix Research & Critical Path Recovery

**Date**: 2026-01-17 23:19
**Severity**: Medium
**Component**: Template Reliability
**Status**: Resolved

## What Happened

After the initial MVP release, we hit a wave of template-level bugs: broken import paths in Vue templates, missing types in Vite configs, and outdated SDK API usage. Plans `260117-2305` and `260117-2319` were launched to scramble and fix these.

## The Brutal Truth

The "MVP" was a bit too "V" (viable) and not enough "P" (product). It's embarrassing to ship a "scaffolder" that generates code that won't even compile because of a relative import error. We were so focused on the CLI engine that we didn't give the actual templates enough love.

## Technical Details

- **SDK v0.9.0**: The shift from positional arguments to object-based parameters in `writeBlob` caught us off guard.
- **Import Errors**: Vue templates were using React-style paths for some shared assets.
- **Vite Types**: Missing `vite/client` in `tsconfig.json` meant developers saw red squiggles everywhere.

## What We Tried

- Manual audit of every framework + use-case combination.
- Patching the generation engine to inject missing types.

## Root Cause Analysis

Insufficient validation of the *generated* output. We were testing if the CLI ran, but not if the project it created was actually healthy.

## Lessons Learned

1. **Post-Generation CI**: We need a test that literally runs `pnpm install && pnpm build` on every possible CLI output.
2. **Template Parity**: Just because it works in React doesn't mean you can copy-paste the logic to Vue without checking the nuances of their build systems.

## Next Steps

- Integrated these fixes into the core template layers.
- Established a stricter "Definition of Done" for template changes.
