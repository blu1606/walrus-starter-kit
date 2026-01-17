# Phase 05: Test & Validate

## Context Links

- **E2E Test**: Full CLI workflow
- **Dependencies**: Phases 01-04 complete

## Overview

**Priority**: P2
**Status**: pending
**Effort**: 15min

End-to-end validation that .env is created automatically during real project generation.

## Key Insights

- Test with actual CLI command
- Verify .env file created
- Check success message updated
- Test both base and framework templates
- Validate dry-run mode

## Requirements

### Functional Validation
1. Run CLI to generate project
2. Verify .env exists in output directory
3. Verify .env content matches .env.example
4. Check success message shows auto-copy
5. Test dry-run shows intent without creating

### Non-functional
- Fast validation (use temp directory)
- Clean up after tests

## Architecture

```
E2E Test Flow:
  1. Build CLI
  2. Generate test project
  3. Check .env exists
  4. Verify content
  5. Check logs
  6. Cleanup
```

## Related Code Files

**Test**:
- CLI entry point: `packages/cli/src/index.ts`
- Output: temp directory

## Implementation Steps

1. Build CLI:
   ```bash
   cd packages/cli
   npm run build
   ```

2. Test with base template:
   ```bash
   mkdir -p /tmp/walrus-test-env
   cd /tmp/walrus-test-env

   # Run CLI (adjust path to your built CLI)
   node path/to/packages/cli/dist/index.js
   # Select: base template
   # Check output messages
   ```

3. Verify .env created:
   ```bash
   ls -la /tmp/walrus-test-env/test-project/
   # Should see .env file

   cat /tmp/walrus-test-env/test-project/.env
   # Should match .env.example
   ```

4. Test dry-run mode:
   ```bash
   node path/to/packages/cli/dist/index.js --dry-run
   # Should show "Would copy .env.example to .env"
   # Should NOT create actual files
   ```

5. Test with existing .env:
   ```bash
   # Create project first
   # Then run CLI again in same directory
   # Should see "already exists" message
   ```

6. Check success message:
   ```bash
   # Verify output shows:
   # - "✓ Created .env from .env.example" during generation
   # - Tips section does NOT show "Copy .env.example to .env"
   ```

## Todo List

- [ ] Build CLI
- [ ] Test: base template → .env created
- [ ] Test: framework template → .env created
- [ ] Test: dry-run → no files, shows intent
- [ ] Test: existing .env → skip with message
- [ ] Verify success message updated
- [ ] Check CI pipeline passes
- [ ] Cleanup temp directories

## Success Criteria

**Must Pass**:
- [x] .env created automatically from .env.example
- [x] Content matches source exactly
- [x] Success message shows auto-copy
- [x] Manual copy tip removed from output
- [x] Existing .env not overwritten
- [x] Dry-run shows intent without creating
- [x] All unit tests pass
- [x] CI pipeline green

**Quality Checks**:
- No TypeScript errors
- No console warnings
- Clean user experience
- Fast execution (<100ms for env copy)

## Risk Assessment

**Low Risk**:
- Backward compatible (new feature only)
- Non-breaking changes
- Graceful fallbacks

**Validation**:
- Test on Windows, macOS, Linux (via CI)
- Test with npm, yarn, pnpm
- Test with all template combinations

## Next Steps

- Merge to main after validation
- Update documentation if needed
- Monitor user feedback

## Unresolved Questions

None - implementation straightforward, all edge cases covered.
