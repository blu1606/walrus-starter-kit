# Phase 6: Remove Git Automation from Post-Install

## Context

- **Priority**: P2 (Medium - User experience improvement)
- **Status**: Pending
- **Effort**: 0.5 hours
- **Dependencies**: None (independent change)

## Overview

Remove automatic `git init` and initial commit from post-install scripts. Users should control when/how to initialize git repositories. Auto-initialization can interfere with existing workflows or cause issues in monorepos.

## Key Insights

- Current behavior: CLI automatically runs `git init` and creates initial commit
- Problem: Assumes users want git, interferes with existing repos/monorepos
- Best practice: Let users control version control initialization
- Precedent: create-react-app, create-next-app don't auto-initialize git
- Keep `--skip-git` flag for backwards compatibility (becomes no-op)

## Requirements

### Functional
- Remove automatic git initialization
- Remove automatic initial commit creation
- Keep git-related flags for backwards compatibility
- Update success messages to remove git instructions

### Non-Functional
- Maintain clean post-install flow
- Preserve skip flags for future features
- Update documentation and help text

## Architecture

### Current Post-Install Flow
```
Generate Project
    ↓
Install Dependencies
    ↓
Initialize Git Repository ← REMOVE THIS
    ↓
Create Initial Commit ← REMOVE THIS
    ↓
Validate Project
    ↓
Show Success Message
```

### New Post-Install Flow
```
Generate Project
    ↓
Install Dependencies
    ↓
Validate Project
    ↓
Show Success Message (updated)
```

## Related Code Files

### Files to Modify
1. `packages/cli/src/post-install/index.ts` - Main orchestrator
2. `packages/cli/src/post-install/git.ts` - Git helper (mark as deprecated or remove)
3. `packages/cli/src/post-install/messages.ts` - Success message
4. `packages/cli/src/index.ts` - CLI flags (keep for compatibility)

### Files to Review
- `packages/cli/src/types.ts` - Context interface
- CLI help text and documentation

## Implementation Steps

### Step 1: Read Post-Install Orchestrator
```bash
# Review current post-install flow
Read packages/cli/src/post-install/index.ts
```

### Step 2: Remove Git Initialization Call
```typescript
// packages/cli/src/post-install/index.ts

export async function runPostInstall(context: Context): Promise<void> {
  const projectPath = context.projectPath;

  logger.info('Running post-install tasks...');

  // Install dependencies
  if (!context.skipInstall) {
    await installDependencies(context);
  }

  // REMOVE THIS SECTION:
  // // Initialize git repository
  // if (!context.skipGit) {
  //   await initializeGit(context);
  // }

  // Validate project
  if (!context.skipValidation) {
    await validateProject(context);
  }

  // Show success message
  showSuccessMessage(context);
}
```

### Step 3: Update Success Message
```typescript
// packages/cli/src/post-install/messages.ts

export function showSuccessMessage(context: Context): void {
  const { projectName, projectPath, packageManager } = context;

  console.log(kleur.green().bold('\n✓ Project created successfully!\n'));

  console.log('Next steps:');
  console.log(kleur.cyan(`  cd ${projectName}`));
  console.log(kleur.cyan(`  ${packageManager} dev`));

  // REMOVE git instructions:
  // console.log('\nGit repository initialized with initial commit.');

  console.log('\nUseful resources:');
  console.log('  Documentation: https://docs.walrus.site');
  console.log('  Examples: https://github.com/MystenLabs/walrus-docs');

  console.log(kleur.gray('\nHappy coding! 🚀\n'));
}
```

### Step 4: Mark Git Helper as Deprecated
```typescript
// packages/cli/src/post-install/git.ts

/**
 * @deprecated Git initialization removed from post-install flow.
 * Users should manually initialize git if needed.
 *
 * This file kept for backwards compatibility but is no longer used.
 */
export async function initializeGit(context: Context): Promise<void> {
  logger.warn('Git initialization has been removed from create-walrus-app.');
  logger.info('To initialize git manually, run: git init && git add . && git commit -m "Initial commit"');
}
```

### Step 5: Keep CLI Flags for Compatibility
```typescript
// packages/cli/src/index.ts

program
  .option('--skip-git', 'Skip git initialization (deprecated, git no longer auto-initialized)')
  .option('--skip-install', 'Skip dependency installation')
  .option('--skip-validation', 'Skip project validation');
```

### Step 6: Update Help Text
```typescript
// packages/cli/src/index.ts

program
  .description('Create a new Walrus application')
  .addHelpText('after', `
Example:
  $ create-walrus-app my-app
  $ create-walrus-app my-app --sdk mysten --framework react --use-case gallery
  $ create-walrus-app my-app --skip-install

Note:
  Git initialization has been removed. Initialize git manually if needed:
  $ cd my-app && git init
  `);
```

### Step 7: Update Documentation
Update README and docs to reflect git behavior change:
- Remove references to automatic git initialization
- Add instructions for manual git setup if desired
- Update CI/CD examples

### Step 8: Test Post-Install Flow
```bash
# Test without git
pnpm create walrus-app test-no-git --sdk mysten --framework react --use-case simple-upload

# Verify:
# - No .git directory created
# - No initial commit
# - Success message doesn't mention git
# - Dependencies installed correctly
# - Validation runs successfully
```

## Todo List

- [ ] Read current post-install/index.ts
- [ ] Remove git initialization call from runPostInstall
- [ ] Read post-install/messages.ts
- [ ] Update success message (remove git instructions)
- [ ] Add deprecation notice to git.ts
- [ ] Update CLI help text
- [ ] Update --skip-git flag description
- [ ] Test project generation without git
- [ ] Verify no .git directory created
- [ ] Update README and documentation
- [ ] Document breaking change in changelog

## Success Criteria

- [ ] No automatic git initialization
- [ ] No .git directory in generated projects
- [ ] Success message doesn't mention git
- [ ] CLI flags preserved for backwards compatibility
- [ ] Documentation updated
- [ ] Post-install flow completes successfully
- [ ] No references to git in output

## Risk Assessment

**Risks**:
- Breaking change for users expecting automatic git setup
- CI/CD scripts may rely on automatic git initialization
- Documentation may still reference git behavior

**Mitigation**:
- Document as breaking change in changelog
- Provide clear instructions for manual git setup
- Keep deprecated flags to avoid CLI errors
- Update all documentation and examples
- Consider adding migration guide

## Security Considerations

- Reduced risk: No automatic git operations
- Users have full control over repository initialization
- No risk of git conflicts in existing repos

## Next Steps

After completion:
- Proceed to Phase 7 (Add README Templates)
- Update project changelog with breaking change
- Create migration guide for existing users
- Update CI/CD examples and documentation
- Consider adding optional git template for users who want it
