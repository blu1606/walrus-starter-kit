# Advanced Features Scope Creep and Supersession

**Date**: 2026-01-17 20:39
**Severity**: Medium
**Component**: Roadmap / Planning
**Status**: Superseded

## What Happened

Planned a massive expansion into Enoki (zkLogin), DeepBook (DeFi), and Seal (Encryption). This was an ambitious attempt to move beyond simple storage into a full "Walrus Operating System" set of templates.

## The Brutal Truth

This plan was a classic example of "developer optimism." We wanted to build everything at once. While the research was solid, the implementation plan was way too heavy for the current stage of the CLI. We ended up getting blocked by build failures in the Enoki provider integration almost immediately, which forced a reality check. The plan was eventually sliced up into smaller, more manageable presets.

## Technical Details

- **Initial Scope**: 50+ hours of work covering 3 distinct advanced protocols.
- **Failures**: Blocked on Phase 02 due to configuration complexity between `@mysten/enoki` and the existing template structure.
- **Pivot**: Decided to focus only on Enoki (zkLogin) first and defer DeepBook/Seal.

## What We Tried

- Layering Enoki on top of existing templates.
- Building a "SponsoredWalrusAdapter" to handle gasless transactions.

## Root Cause Analysis

Trying to integrate three complex external SDKs (Enoki, DeepBook, Seal) into a dynamic template generation engine all at once. The combinatorial explosion of testing requirements was underestimated.

## Lessons Learned

1. **Slice Thinly**: Don't plan a 50-hour "Advanced Features" block. Plan "Enoki Auth" and "Sponsored Uploads" as separate, deliverable units.
2. **Research != Implementation**: Having a research report doesn't mean the integration will be easy. SDK version mismatches and Peer Dependency hell are real.

## Next Steps

- The Enoki work was salvaged and moved into a specific `enoki-upload-preset` plan.
- DeepBook and Seal remain in the backlog until the core preset architecture is stabilized.
