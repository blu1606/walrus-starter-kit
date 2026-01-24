# Phase 01: Critical Security Fixes

**Priority:** P0
**Effort:** 4h
**Status:** pending

## Context Links

- [Post-Install Security Review](../reports/code-reviewer-260118-1300-post-install-security.md) - CRITICAL issues identified
- [CLI Security Analysis](../reports/researcher-260118-1255-cli-security-analysis.md) - Missing .gitignore risk

## Overview

Eliminate 3 critical security vulnerabilities that enable command injection, secrets exposure, and path traversal attacks.

## Key Insights

**Critical Vulnerabilities:**
1. **Command Injection** - `shell: true` in walrus-deploy.ts enables arbitrary code execution
2. **Secrets Exposure** - Missing .gitignore allows accidental commit of .env files
3. **Path Traversal** - No validation that script paths stay within project directory

**Impact:** HIGH - All three enable production security incidents

## Requirements

### Functional
- Remove command injection vector from bash script execution
- Add .gitignore to all template presets
- Validate script paths before execution
- Add supply chain integrity checks to setup script

### Non-Functional
- Zero breaking changes to existing functionality
- Maintain cross-platform compatibility
- Preserve user experience (no new prompts/warnings yet)

## Architecture

**Component:** `packages/cli/src/post-install/walrus-deploy.ts`

**Changes:**
1. Remove `shell: true` from spawn call (line 68)
2. Add path validation before script execution (line 46)
3. Add checksum verification to setup-walrus-deploy.sh (future enhancement)

**Component:** Template presets

**Changes:**
1. Add .gitignore to each preset: react-mysten-simple-upload, react-mysten-gallery, etc.
2. Include .env, .walrus/, node_modules, dist in ignore rules

## Related Code Files

**To Modify:**
- `packages/cli/src/post-install/walrus-deploy.ts` (lines 46-68)
- `packages/cli/presets/*/` (add .gitignore files)

**To Create:**
- `packages/cli/presets/react-mysten-simple-upload/.gitignore`
- `packages/cli/presets/react-mysten-gallery/.gitignore`
- `packages/cli/presets/vue-mysten-simple-upload/.gitignore`
- `packages/cli/presets/plain-ts-mysten-simple-upload/.gitignore`

**To Test:**
- `packages/cli/src/post-install/walrus-deploy.test.ts` (new file)
- `packages/cli/src/generator/file-ops.test.ts` (verify .gitignore copied)

## Implementation Steps

### Step 1: Fix Command Injection (walrus-deploy.ts:68)

**File:** `packages/cli/src/post-install/walrus-deploy.ts`

Remove `shell: true` from spawn call:

```typescript
// BEFORE (line 65-70)
const child = spawn('bash', [scriptPath, projectPath], {
  cwd: projectPath,
  stdio: 'inherit',
  shell: true,  // ❌ REMOVE THIS
});

// AFTER
const child = spawn('bash', [scriptPath, projectPath], {
  cwd: projectPath,
  stdio: 'inherit',
  // shell: true removed - not needed when spawning bash directly
});
```

**Rationale:** `shell: true` enables shell metacharacter expansion. Since we're already spawning bash directly, it's redundant and dangerous.

### Step 2: Add Path Traversal Protection (walrus-deploy.ts:46)

**File:** `packages/cli/src/post-install/walrus-deploy.ts`

Add validation after line 46:

```typescript
import { join, resolve } from 'node:path';

// Existing code (line 46)
const scriptPath = join(projectPath, 'scripts', 'setup-walrus-deploy.sh');

// NEW: Add path validation (insert after line 46)
const resolvedScript = resolve(scriptPath);
const resolvedProject = resolve(projectPath);

// Verify script is inside project directory
if (!resolvedScript.startsWith(resolvedProject)) {
  logger.error('❌ Invalid script path detected - possible path traversal attempt');
  return;
}

// Continue with existing existence check (line 48)
if (!existsSync(scriptPath)) {
  logger.warn('⚠️  setup-walrus-deploy.sh not found');
  return;
}
```

### Step 3: Create .gitignore Template

**File:** `packages/cli/presets/base/.gitignore` (new file)

Create comprehensive ignore rules:

```gitignore
# Environment files
.env
.env.local
.env.*.local

# Walrus configuration
.walrus/
walrus.json

# Dependencies
node_modules/
.pnpm-store/
.yarn/
.cache/

# Build outputs
dist/
build/
.next/
.nuxt/
.output/

# IDE files
.vscode/
.idea/
*.swp
*.swo
.DS_Store

# Logs
*.log
npm-debug.log*
pnpm-debug.log*
yarn-debug.log*
yarn-error.log*

# Testing
coverage/
.nyc_output/

# TypeScript
*.tsbuildinfo
```

### Step 4: Copy .gitignore to All Presets

**Files:**
- `packages/cli/presets/react-mysten-simple-upload/.gitignore`
- `packages/cli/presets/react-mysten-gallery/.gitignore`
- `packages/cli/presets/vue-mysten-simple-upload/.gitignore`
- `packages/cli/presets/plain-ts-mysten-simple-upload/.gitignore`

Copy base .gitignore to each preset directory.

### Step 5: Verify .gitignore Copied During Generation

**File:** `packages/cli/src/generator/file-ops.ts`

Ensure .gitignore is not excluded by default (verify line 15):

```typescript
// Existing exclude list (line 15)
const defaultExclude = ['node_modules', '.git', 'dist'];

// Ensure .gitignore is NOT in exclude list
// (already correct - no change needed)
```

### Step 6: Add Security Warning (Post-Install)

**File:** `packages/cli/src/post-install/messages.ts`

Add warning about secrets (after line 30):

```typescript
console.log('\n🔒 Security Reminder:');
console.log(`${kleur.yellow('⚠️')}  Never commit .env files to version control`);
console.log(`${kleur.green('✓')}  .gitignore configured to exclude sensitive files`);
```

## Todo List

- [ ] Remove `shell: true` from walrus-deploy.ts:68
- [ ] Add path validation in walrus-deploy.ts after line 46
- [ ] Create base .gitignore template
- [ ] Copy .gitignore to all 4 preset directories
- [ ] Verify .gitignore not excluded by file-ops.ts
- [ ] Add security warning to post-install messages
- [ ] Create unit test for path validation logic
- [ ] Run full test suite to verify no regressions
- [ ] Test project generation with all presets
- [ ] Verify .gitignore present in generated projects

## Success Criteria

- ✅ `shell: true` removed from all spawn calls
- ✅ Path validation prevents traversal outside project directory
- ✅ .gitignore present in all 4 presets
- ✅ Generated projects include .gitignore
- ✅ Security warning displayed during post-install
- ✅ All existing tests pass
- ✅ New tests for path validation pass
- ✅ Manual testing confirms .env not committable

## Risk Assessment

**Risks:**
- **Low:** Bash spawn behavior changes on Windows
- **Low:** Path validation logic breaks legitimate use cases

**Mitigations:**
- Test on Windows, macOS, Linux before merge
- Unit tests verify path validation edge cases
- Fallback to warning if validation fails (don't block generation)

## Security Considerations

**Threat Model Changes:**
- **Before:** User-controlled paths enable command injection
- **After:** All paths validated, shell expansion disabled

**Attack Surface Reduction:**
- Command injection: ELIMINATED
- Secrets exposure: MITIGATED (still requires user discipline)
- Path traversal: PREVENTED

**Remaining Risks:**
- Supply chain attacks via setup-walrus-deploy.sh (address in Phase 03)
- Malicious template content (trusted presets only)

## Next Steps

1. Implement all 6 code changes
2. Run `pnpm test` to verify no regressions
3. Test project generation with each preset
4. Verify .gitignore present and functional
5. Commit changes with message: "fix(security): eliminate command injection and add .gitignore to templates"
6. Proceed to Phase 02
