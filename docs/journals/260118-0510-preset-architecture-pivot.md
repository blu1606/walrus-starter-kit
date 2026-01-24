# Preset Architecture Migration Rationale

**Date**: 2026-01-18 05:10
**Severity**: Medium
**Component**: CLI Generator Engine
**Status**: Superseded

## What Happened

Planned a major migration from "Runtime Layer Merging" (where the CLI merges files on the fly) to "Pre-built Presets" (where templates are static and just copied).

## The Brutal Truth

The runtime merging engine was a clever engineering feat, but a maintenance nightmare. It was "too smart for its own good." Every time we added a feature, we had to worry about how the deep-merge would handle edge cases in `package.json` or `vite.config.ts`. It made debugging generated code impossible because the "source of truth" didn't exist in the repo—it only existed in the memory of the CLI.

## Technical Details

- **Problem**: Complexity of `merge.ts` was growing exponentially. Users couldn't easily see what a "React + Enoki" project would look like without running the CLI.
- **Solution**: Switch to a "Migration Catalog" approach where presets are pre-generated and validated.

## What We Tried

- Building a script to pre-generate all combinations in the monorepo.
- Redesigning the `generator/index.ts` to be a simple copy operation.

## Root Cause Analysis

Over-engineering. We built a generic "layer compositor" when we only had about 10 meaningful combinations. The maintenance cost of the "generic" system was higher than just maintaining the static files.

## Lessons Learned

1. **Static > Dynamic**: For templates, predictability is king. Developers want to see the code they're going to get.
2. **KISS**: Don't build a complex merge engine until you have hundreds of combinations that make manual management impossible.

## Next Steps

- This plan was superseded by the `260124-0851-template-migration-catalog` which is currently being executed.
