# Planner Report: Codebase Improvement Plan

**Date:** 2026-01-18 13:07
**Agent:** planner (acf6376)
**Work Context:** d:\Sui\walrus-starter-kit

---

## Executive Summary

Created comprehensive improvement plan addressing **19 findings** from security audits and code reviews. Plan structured in **5 phases** (16 hours total effort) prioritizing critical security fixes first, then UX improvements, and finally documentation.

**Key Deliverables:**
- Eliminate 3 critical security vulnerabilities (command injection, secrets exposure, path traversal)
- Expand E2E test coverage from 1 to 10+ tests
- Add progress indicators for silent file operations
- Implement custom error types with error codes
- Comprehensive security and testing documentation

---

## Plan Overview

**Location:** `d:\Sui\walrus-starter-kit\plans\260118-1307-codebase-improvement-plan\`

**Structure:**
```
260118-1307-codebase-improvement-plan/
├── plan.md                                    # Overview (80 lines)
├── phase-01-critical-security-fixes.md        # P0 - 4h
├── phase-02-high-priority-improvements.md     # P1 - 4h
├── phase-03-medium-priority-enhancements.md   # P2 - 4h
├── phase-04-low-priority-polish.md            # P3 - 2h
└── phase-05-documentation-testing.md          # P2 - 2h
```

---

## Findings Summary

### Input Reports Analyzed

1. **researcher-260118-1255-cli-scaffolding-best-practices.md** (Health: 7/10)
   - Missing progress indicators
   - Limited E2E test coverage (1 test)
   - No custom error types
   - Package manager validation gaps

2. **researcher-260118-1255-cli-security-analysis.md** (Grade: B+)
   - CRITICAL: Missing .gitignore in templates (secrets exposure)
   - HIGH: No PM availability validation
   - MEDIUM: No lockfile detection
   - Path traversal prevention already strong

3. **code-reviewer-260118-1300-cli-core-review.md** (Quality: A-, Security: 9.5/10)
   - Missing debug mode
   - Redundant cancel check in prompts
   - TODO comments need tracking
   - Overall excellent type safety

4. **code-reviewer-260118-1300-generator-security-audit.md** (Good security, HIGH quality)
   - HIGH: Path validation needs enhancement
   - HIGH: Symlink handling not specified
   - Template injection secured by input validation
   - File size limits recommended

5. **code-reviewer-260118-1300-post-install-security.md** (MEDIUM RISK - 3 critical)
   - CRITICAL: Command injection (shell: true)
   - CRITICAL: Path traversal in script execution
   - CRITICAL: Supply chain risk (bash script downloads)
   - Deprecated git.ts cleanup needed

---

## Priority Breakdown

### P0 - Critical (Phase 01: 4h)
1. **Command Injection** - walrus-deploy.ts:65 uses `shell: true`
2. **Secrets Exposure** - No .gitignore in templates
3. **Path Traversal** - Script paths not validated

**Impact:** Security incidents in production deployments

### P1 - High (Phase 02: 4h)
4. **Progress Indicators** - File copy operations silent
5. **PM Validation** - No check if detected PM installed
6. **E2E Tests** - Only 1 test, needs 10+ coverage
7. **Custom Errors** - Generic errors hide context
8. **Symlink Handling** - Not explicitly handled

**Impact:** Poor UX, debugging difficulty, test gaps

### P2 - Medium (Phase 03: 4h + Phase 05: 2h)
9. **Debug Mode** - No --verbose flag for troubleshooting
10. **Lockfile Detection** - PM detection misses lockfiles
11. **File Size Limits** - No DoS protection (50MB limit)
12. **Context Escaping** - Template vars not escaped for JSON/HTML
13. **Deprecated Code** - git.ts needs removal
14. **Error Sanitization** - Internal paths exposed
15. **Documentation** - Security model undocumented

**Impact:** Developer experience, minor security gaps

### P3 - Low (Phase 04: 2h)
16. **Performance** - Sequential file processing (parallelize)
17. **Template Conditionals** - Needed for future features
18. **PM Versions** - No validation (pnpm >= 9.0.0)
19. **Enhanced Dry Run** - Shows limited manifest

**Impact:** Performance, future-proofing

---

## Phase Summaries

### Phase 01: Critical Security Fixes (P0 - 4h)

**Goals:**
- Remove command injection vector
- Add .gitignore to all templates
- Validate script paths before execution

**Files Modified:** 2
**Files Created:** 5 (.gitignore for each preset + tests)

**Success Criteria:**
- Zero critical vulnerabilities
- .gitignore in all generated projects
- Path validation prevents traversal

---

### Phase 02: High Priority Improvements (P1 - 4h)

**Goals:**
- Progress indicators (spinners)
- PM validation (check availability)
- 10+ E2E tests (presets + flags)
- Custom error types with codes
- Symlink detection

**Files Modified:** 4
**Files Created:** 4 (errors.ts, spinner.ts, 2 E2E test files)

**Success Criteria:**
- Spinners show during copy/install
- PM fallback if not installed
- 10+ E2E tests pass
- Error codes for programmatic handling

---

### Phase 03: Medium Priority Enhancements (P2 - 4h)

**Goals:**
- --verbose debug mode
- Lockfile detection (pnpm-lock.yaml, etc.)
- 50MB file size limit
- Binary file exclusions
- Context-aware escaping
- Cleanup deprecated code

**Files Modified:** 6
**Files Deleted:** 1 (git.ts)

**Success Criteria:**
- Debug output with --verbose
- Lockfiles detected before npm fallback
- Files >50MB skipped
- Error messages use relative paths

---

### Phase 04: Low Priority Polish (P3 - 2h)

**Goals:**
- Parallel file processing (2x speedup)
- Template conditionals (optional)
- PM version validation
- Enhanced dry-run manifest

**Files Modified:** 4

**Success Criteria:**
- 50-100% faster generation
- PM version warnings
- Dry-run shows full manifest

---

### Phase 05: Documentation & Testing (P2 - 2h)

**Goals:**
- SECURITY.md (threat model)
- TESTING.md (contributor guide)
- Snapshot tests (2+ presets)
- Update README, CHANGELOG
- Architecture docs

**Files Created:** 3 (SECURITY.md, TESTING.md, snapshots)
**Files Modified:** 3 (README, CHANGELOG, ARCHITECTURE)

**Success Criteria:**
- Security model documented
- Snapshot tests pass
- CHANGELOG complete
- All docs reviewed

---

## Risk Assessment

**Overall Risk:** LOW - Incremental, non-breaking changes

**Mitigations:**
- Comprehensive test suite validates each phase
- Security fixes improve production readiness
- Feature flags for optional enhancements
- Backward compatibility maintained

**Dependencies:**
- Phase 02 depends on Phase 01 (security baseline)
- Phase 05 depends on all (comprehensive docs)

---

## Implementation Strategy

**Sequential Approach:**
1. Start with Phase 01 (critical security)
2. Verify zero vulnerabilities before Phase 02
3. Each phase: implement → test → commit
4. Run full test suite after each phase
5. Proceed only if all tests green

**Testing Protocol:**
- Unit tests (existing 95 + new)
- E2E tests (1 existing + 10 new)
- Snapshot tests (2+ presets)
- Manual testing on Windows/macOS/Linux

**Rollback Plan:**
- Each phase in separate commit
- Git revert if tests fail
- Feature flags for UX changes

---

## Metrics & Success Criteria

**Before Plan:**
- Critical vulnerabilities: 3
- E2E tests: 1
- Test coverage: 95 tests
- Security grade: B+
- UX score: 7/10

**After Plan (Target):**
- Critical vulnerabilities: 0
- E2E tests: 11+
- Test coverage: 115+ tests
- Security grade: A
- UX score: 9/10

**Deliverables:**
- ✅ Zero critical security issues
- ✅ Comprehensive test coverage
- ✅ Progress indicators for all long operations
- ✅ Full documentation (security + testing)
- ✅ 50-100% performance improvement

---

## Unresolved Questions

1. **Supply Chain Security:** Should setup-walrus-deploy.sh downloads use checksums? (Phase 01 deferred to Phase 03)

2. **Template Conditionals:** Re-enable analytics/Tailwind layers? (Phase 04 optional - only if needed)

3. **Community Presets:** Support third-party templates? (Out of scope - requires preset signing)

4. **Telemetry:** Track installation failures for diagnostics? (Phase 03 optional)

5. **Performance Targets:** What's acceptable generation time for large presets? (Phase 04 benchmarks needed)

---

## Next Steps

1. **Review Plan:** Stakeholder approval of priorities
2. **Start Phase 01:** Critical security fixes (4h)
3. **Verify Security:** Run security audit after Phase 01
4. **Continue Sequentially:** Phases 02 → 03 → 04 → 05
5. **Final Review:** Complete testing + documentation
6. **Release:** Version 1.1.0 with security improvements

---

## Report Metadata

**Plan Path:** `d:\Sui\walrus-starter-kit\plans\260118-1307-codebase-improvement-plan\`
**Total Effort:** 16 hours (4h + 4h + 4h + 2h + 2h)
**Priority:** P0 (critical security fixes included)
**Status:** Ready for implementation
**Dependencies:** None (all external deps already installed)

**Files Created:**
- plan.md (overview)
- 5 phase files (detailed implementation steps)

**Reports Referenced:**
- 2 researcher reports
- 3 code reviewer reports

---

**Ready for approval and implementation.**
