# Phase 8: Post-Install & Validation

## Context Links

- [Main Plan](./plan.md)
- [PRD](../../POC/PRD.md)
- [CLI Scaffolding Research](../reports/researcher-260117-1353-cli-scaffolding.md)
- [Phase 7: Generation Engine](./phase-07-generation-engine.md)

## Overview

**Created:** 2026-01-17  
**Priority:** Medium  
**Status:** completed  
**Completed:** 2026-01-17 18:55  
**Estimated Effort:** 7 hours  
**Dependencies:** Phase 7 complete

## Key Insights

### From Research

1. **Package Manager Detection**: Use `npm_config_user_agent` for accurate detection
2. **Automatic Install**: Run `npm install` automatically to minimize "Time to Hello World"
3. **Git Initialization**: Create `.git` and initial commit for version control
4. **Success Messaging**: Clear, actionable next steps with colored output
5. **Validation**: Verify generated project can build before declaring success

### Critical UX Pattern

```
npm create walrus-app@latest my-app
  → Prompts (30s)
  → Generation (5s)
  → npm install (45s)    ← Automated
  → git init (2s)        ← Automated
  → Success message
  → cd my-app && npm run dev ← User action
```

## Requirements

### Functional

- Detect package manager (npm/pnpm/yarn/bun)
- Install dependencies automatically
- Initialize git repository
- Create initial commit
- Validate generated project
- Display next steps

### Technical

- Cross-platform command execution
- Stream install output to user
- Handle install failures gracefully
- Verify package.json validity
- Check TypeScript compilation

### Dependencies

- Phase 7: Generated project directory

## Architecture

### Post-Install Flow

```
Project Generated
    ↓
Detect Package Manager
    ↓
Run Install Command (streaming output)
    ↓
Validate Installation (check node_modules)
    ↓
Initialize Git
    ↓
Create Initial Commit
    ↓
Validate Build (tsc --noEmit)
    ↓
Display Success Message
```

### Module Structure

```
packages/cli/src/
├── post-install/
│   ├── index.ts              # Main orchestrator
│   ├── package-manager.ts    # PM detection & install
│   ├── git.ts                # Git initialization
│   ├── validator.ts          # Project validation
│   └── messages.ts           # Success messages
```

### Package Manager Commands

```typescript
const PM_COMMANDS = {
  npm: { install: 'npm install', run: 'npm run' },
  pnpm: { install: 'pnpm install', run: 'pnpm' },
  yarn: { install: 'yarn', run: 'yarn' },
  bun: { install: 'bun install', run: 'bun run' },
};
```

## Related Code Files

### To Create

1. `packages/cli/src/post-install/index.ts` - Main orchestrator
2. `packages/cli/src/post-install/package-manager.ts` - Install logic
3. `packages/cli/src/post-install/git.ts` - Git initialization
4. `packages/cli/src/post-install/validator.ts` - Project validation
5. `packages/cli/src/post-install/messages.ts` - Success messages

### To Modify

- `packages/cli/src/index.ts` - Call post-install after generation
- `packages/cli/package.json` - Add `cross-spawn` dependency

## Implementation Steps

### Step 1: Package Manager Detection & Install (2 hours)

1. Add dependency to `packages/cli/package.json`:

```json
{
  "dependencies": {
    "cross-spawn": "^7.0.3"
  },
  "devDependencies": {
    "@types/cross-spawn": "^6.0.6"
  }
}
```

2. Create `post-install/package-manager.ts`:

```typescript
import spawn from 'cross-spawn';
import { logger } from '../utils/logger.js';
import type { PackageManager } from '../types.js';

interface InstallResult {
  success: boolean;
  duration: number;
  error?: Error;
}

/**
 * Get install command for package manager
 */
function getInstallCommand(pm: PackageManager): string {
  const commands: Record<PackageManager, string> = {
    npm: 'npm install',
    pnpm: 'pnpm install',
    yarn: 'yarn',
    bun: 'bun install',
  };
  return commands[pm];
}

/**
 * Install dependencies using detected package manager
 */
export async function installDependencies(
  projectPath: string,
  packageManager: PackageManager
): Promise<InstallResult> {
  const startTime = Date.now();

  logger.info(`📦 Installing dependencies with ${packageManager}...`);

  return new Promise((resolve) => {
    const [cmd, ...args] = getInstallCommand(packageManager).split(' ');

    const child = spawn(cmd, args, {
      cwd: projectPath,
      stdio: 'inherit', // Stream output to user
      shell: true,
    });

    child.on('close', (code) => {
      const duration = Date.now() - startTime;

      if (code === 0) {
        logger.success(
          `✓ Dependencies installed (${(duration / 1000).toFixed(1)}s)`
        );
        resolve({ success: true, duration });
      } else {
        const error = new Error(`Install failed with exit code ${code}`);
        logger.error(`❌ Dependency installation failed`);
        resolve({ success: false, duration, error });
      }
    });

    child.on('error', (error) => {
      const duration = Date.now() - startTime;
      logger.error(`❌ Failed to run ${packageManager}: ${error.message}`);
      resolve({ success: false, duration, error });
    });
  });
}

/**
 * Get run command for package manager
 */
export function getRunCommand(pm: PackageManager, script: string): string {
  const runCommands: Record<PackageManager, string> = {
    npm: `npm run ${script}`,
    pnpm: `pnpm ${script}`,
    yarn: `yarn ${script}`,
    bun: `bun run ${script}`,
  };
  return runCommands[pm];
}
```

### Step 2: Git Initialization (1 hour)

3. Create `post-install/git.ts`:

```typescript
import spawn from 'cross-spawn';
import fs from 'fs-extra';
import path from 'node:path';
import { logger } from '../utils/logger.js';

interface GitResult {
  success: boolean;
  error?: Error;
}

/**
 * Check if git is available
 */
async function isGitAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn('git', ['--version'], { stdio: 'ignore' });
    child.on('close', (code) => resolve(code === 0));
    child.on('error', () => resolve(false));
  });
}

/**
 * Initialize git repository
 */
export async function initializeGit(projectPath: string): Promise<GitResult> {
  // Check if git is available
  if (!(await isGitAvailable())) {
    logger.warn('⚠️  Git not found, skipping initialization');
    return { success: false };
  }

  // Check if already a git repo
  if (await fs.pathExists(path.join(projectPath, '.git'))) {
    logger.info('📝 Git repository already exists');
    return { success: true };
  }

  logger.info('📝 Initializing git repository...');

  // Run git init
  return new Promise((resolve) => {
    const child = spawn('git', ['init'], {
      cwd: projectPath,
      stdio: 'ignore',
    });

    child.on('close', (code) => {
      if (code === 0) {
        logger.success('✓ Git repository initialized');
        resolve({ success: true });
      } else {
        resolve({
          success: false,
          error: new Error(`git init failed with code ${code}`),
        });
      }
    });

    child.on('error', (error) => {
      resolve({ success: false, error });
    });
  });
}

/**
 * Create initial commit
 */
export async function createInitialCommit(
  projectPath: string
): Promise<GitResult> {
  if (!(await fs.pathExists(path.join(projectPath, '.git')))) {
    return { success: false, error: new Error('Not a git repository') };
  }

  logger.info('📝 Creating initial commit...');

  // Stage all files
  return new Promise((resolve) => {
    const addChild = spawn('git', ['add', '.'], {
      cwd: projectPath,
      stdio: 'ignore',
    });

    addChild.on('close', (code) => {
      if (code !== 0) {
        resolve({ success: false, error: new Error('git add failed') });
        return;
      }

      // Create commit
      const commitChild = spawn(
        'git',
        ['commit', '-m', 'chore: initial commit from create-walrus-app'],
        {
          cwd: projectPath,
          stdio: 'ignore',
        }
      );

      commitChild.on('close', (commitCode) => {
        if (commitCode === 0) {
          logger.success('✓ Initial commit created');
          resolve({ success: true });
        } else {
          resolve({ success: false, error: new Error('git commit failed') });
        }
      });

      commitChild.on('error', (error) => {
        resolve({ success: false, error });
      });
    });

    addChild.on('error', (error) => {
      resolve({ success: false, error });
    });
  });
}
```

### Step 3: Project Validation (1.5 hours)

4. Create `post-install/validator.ts`:

```typescript
import fs from 'fs-extra';
import path from 'node:path';
import spawn from 'cross-spawn';
import { logger } from '../utils/logger.js';

interface ValidationResult {
  valid: boolean;
  checks: {
    packageJson: boolean;
    nodeModules: boolean;
    dependencies: boolean;
    typescript: boolean;
  };
  errors: string[];
}

/**
 * Validate generated project
 */
export async function validateProject(
  projectPath: string
): Promise<ValidationResult> {
  logger.info('🔍 Validating project...');

  const result: ValidationResult = {
    valid: true,
    checks: {
      packageJson: false,
      nodeModules: false,
      dependencies: false,
      typescript: false,
    },
    errors: [],
  };

  // Check 1: package.json exists and is valid
  try {
    const pkgPath = path.join(projectPath, 'package.json');
    const pkg = await fs.readJson(pkgPath);

    if (!pkg.name || !pkg.version) {
      result.errors.push('package.json missing required fields');
    } else {
      result.checks.packageJson = true;
    }
  } catch (error) {
    result.errors.push('Invalid or missing package.json');
  }

  // Check 2: node_modules exists
  const nodeModulesPath = path.join(projectPath, 'node_modules');
  if (await fs.pathExists(nodeModulesPath)) {
    result.checks.nodeModules = true;
  } else {
    result.errors.push('node_modules not found');
  }

  // Check 3: Dependencies installed
  try {
    const pkgPath = path.join(projectPath, 'package.json');
    const pkg = await fs.readJson(pkgPath);
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    let allInstalled = true;
    for (const dep in deps) {
      const depPath = path.join(nodeModulesPath, dep);
      if (!(await fs.pathExists(depPath))) {
        allInstalled = false;
        result.errors.push(`Dependency not installed: ${dep}`);
        break;
      }
    }

    result.checks.dependencies = allInstalled;
  } catch (error) {
    result.errors.push('Failed to verify dependencies');
  }

  // Check 4: TypeScript compilation (if tsconfig exists)
  const tsconfigPath = path.join(projectPath, 'tsconfig.json');
  if (await fs.pathExists(tsconfigPath)) {
    const tscResult = await checkTypeScript(projectPath);
    result.checks.typescript = tscResult.success;

    if (!tscResult.success) {
      result.errors.push(`TypeScript errors: ${tscResult.error}`);
    }
  } else {
    result.checks.typescript = true; // Not applicable
  }

  result.valid = Object.values(result.checks).every(Boolean);

  if (result.valid) {
    logger.success('✓ Project validation passed');
  } else {
    logger.warn('⚠️  Project validation failed:');
    result.errors.forEach((err) => logger.warn(`  - ${err}`));
  }

  return result;
}

/**
 * Check TypeScript compilation
 */
async function checkTypeScript(
  projectPath: string
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const child = spawn('npx', ['tsc', '--noEmit'], {
      cwd: projectPath,
      stdio: 'pipe',
    });

    let stderr = '';
    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true });
      } else {
        resolve({ success: false, error: stderr.split('\n')[0] });
      }
    });

    child.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });
  });
}
```

### Step 4: Success Messages (1 hour)

5. Create `post-install/messages.ts`:

```typescript
import kleur from 'kleur';
import { logger } from '../utils/logger.js';
import { getRunCommand } from './package-manager.js';
import type { Context } from '../types.js';

/**
 * Display success message with next steps
 */
export function displaySuccess(context: Context): void {
  const { projectName, packageManager, sdk, framework, useCase } = context;

  console.log('\n' + kleur.green('━'.repeat(60)));
  console.log(kleur.bold().green('  ✨ Project created successfully! ✨'));
  console.log(kleur.green('━'.repeat(60)));

  console.log('\n' + kleur.bold('📦 Project Details:'));
  console.log(`  Name: ${kleur.cyan(projectName)}`);
  console.log(`  SDK: ${kleur.cyan(sdk)}`);
  console.log(`  Framework: ${kleur.cyan(framework)}`);
  console.log(`  Use Case: ${kleur.cyan(useCase)}`);

  console.log('\n' + kleur.bold('🚀 Next Steps:'));
  console.log(`  ${kleur.gray('1.')} cd ${kleur.cyan(projectName)}`);
  console.log(
    `  ${kleur.gray('2.')} ${kleur.cyan(getRunCommand(packageManager, 'dev'))}`
  );

  console.log('\n' + kleur.bold('📚 Helpful Commands:'));
  console.log(
    `  ${kleur.cyan(getRunCommand(packageManager, 'dev'))}      - Start development server`
  );
  console.log(
    `  ${kleur.cyan(getRunCommand(packageManager, 'build'))}    - Build for production`
  );
  console.log(
    `  ${kleur.cyan(getRunCommand(packageManager, 'lint'))}     - Run linter`
  );

  console.log('\n' + kleur.bold('🔗 Resources:'));
  console.log(`  Walrus Docs:   ${kleur.cyan('https://docs.walrus.site')}`);
  console.log(`  Sui Docs:      ${kleur.cyan('https://docs.sui.io')}`);
  console.log(
    `  Sui Faucet:    ${kleur.cyan('https://faucet.testnet.sui.io')}`
  );

  console.log('\n' + kleur.bold('💡 Tips:'));
  console.log(
    `  - Copy ${kleur.cyan('.env.example')} to ${kleur.cyan('.env')}`
  );
  console.log(`  - Install Sui Wallet browser extension`);
  console.log(`  - Get testnet SUI from the faucet`);

  console.log('\n' + kleur.green('━'.repeat(60)) + '\n');
}

/**
 * Display error message with recovery steps
 */
export function displayError(error: Error, context: Context): void {
  console.log('\n' + kleur.red('━'.repeat(60)));
  console.log(kleur.bold().red('  ❌ Project creation failed'));
  console.log(kleur.red('━'.repeat(60)));

  console.log('\n' + kleur.bold('Error:'));
  console.log(`  ${kleur.red(error.message)}`);

  console.log('\n' + kleur.bold('Recovery Steps:'));
  console.log(`  ${kleur.gray('1.')} cd ${kleur.cyan(context.projectName)}`);
  console.log(
    `  ${kleur.gray('2.')} ${kleur.cyan(`${context.packageManager} install`)}`
  );
  console.log(
    `  ${kleur.gray('3.')} Try running ${kleur.cyan(getRunCommand(context.packageManager, 'dev'))}`
  );

  console.log('\n' + kleur.bold('Need Help?'));
  console.log(
    `  Report issues: ${kleur.cyan('https://github.com/your-org/walrus-starter-kit/issues')}`
  );

  console.log('\n' + kleur.red('━'.repeat(60)) + '\n');
}
```

### Step 5: Main Post-Install Orchestrator (1.5 hours)

6. Create `post-install/index.ts`:

```typescript
import { logger } from '../utils/logger.js';
import { installDependencies } from './package-manager.js';
import { initializeGit, createInitialCommit } from './git.js';
import { validateProject } from './validator.js';
import { displaySuccess, displayError } from './messages.js';
import type { Context } from '../types.js';

export interface PostInstallOptions {
  context: Context;
  projectPath: string;
  skipInstall?: boolean;
  skipGit?: boolean;
  skipValidation?: boolean;
}

export interface PostInstallResult {
  success: boolean;
  installed: boolean;
  gitInitialized: boolean;
  validated: boolean;
  error?: Error;
}

/**
 * Run post-install tasks
 */
export async function runPostInstall(
  options: PostInstallOptions
): Promise<PostInstallResult> {
  const {
    context,
    projectPath,
    skipInstall = false,
    skipGit = false,
    skipValidation = false,
  } = options;

  const result: PostInstallResult = {
    success: true,
    installed: false,
    gitInitialized: false,
    validated: false,
  };

  try {
    // Step 1: Install dependencies
    if (!skipInstall) {
      const installResult = await installDependencies(
        projectPath,
        context.packageManager
      );
      result.installed = installResult.success;

      if (!installResult.success) {
        logger.warn(
          '⚠️  Dependency installation failed, but project was created'
        );
        logger.info('💡 You can install manually by running:');
        logger.info(`   cd ${context.projectName}`);
        logger.info(`   ${context.packageManager} install`);
      }
    }

    // Step 2: Initialize git
    if (!skipGit) {
      const gitResult = await initializeGit(projectPath);
      result.gitInitialized = gitResult.success;

      if (gitResult.success) {
        const commitResult = await createInitialCommit(projectPath);
        if (!commitResult.success) {
          logger.warn('⚠️  Initial commit failed, but git repo was created');
        }
      }
    }

    // Step 3: Validate project
    if (!skipValidation && result.installed) {
      const validationResult = await validateProject(projectPath);
      result.validated = validationResult.valid;

      if (!validationResult.valid) {
        logger.warn('⚠️  Project validation failed:');
        validationResult.errors.forEach((err) => logger.warn(`   - ${err}`));
      }
    }

    // Display success message
    displaySuccess(context);

    return result;
  } catch (error) {
    result.success = false;
    result.error = error as Error;

    displayError(error as Error, context);

    return result;
  }
}
```

### Step 6: Integration with Main CLI (45 min)

7. Update `packages/cli/src/index.ts`:

```typescript
// ... existing imports ...
import { runPostInstall } from './post-install/index.js';

// ... inside .action() handler, after generateProject ...

// Post-install tasks
const postInstallResult = await runPostInstall({
  context,
  projectPath: context.projectPath,
  skipInstall: options.skipInstall, // Allow skip via flag
  skipGit: options.skipGit,
  skipValidation: options.skipValidation,
});

if (!postInstallResult.success) {
  logger.warn('⚠️  Post-install tasks completed with warnings');
}
```

8. Add CLI flags for skipping steps:

```typescript
program
  // ... existing options ...
  .option('--skip-install', 'Skip npm install', false)
  .option('--skip-git', 'Skip git initialization', false)
  .option('--skip-validation', 'Skip project validation', false);
```

## Todo List

- [x] Add `cross-spawn` dependency
- [x] Create `post-install/package-manager.ts`
- [x] Create `post-install/git.ts`
- [x] Create `post-install/validator.ts`
- [x] Create `post-install/messages.ts`
- [x] Create `post-install/index.ts`
- [x] Update `src/index.ts` to call post-install
- [x] Add skip flags to CLI
- [x] Test install with all package managers
- [x] Test git initialization
- [x] Test validation checks
- [x] Test success/error messages
- [x] Test skip flags

## Success Criteria

### Functional Tests

- [x] Dependencies install successfully with npm/pnpm/yarn/bun
- [x] Git repository initializes
- [x] Initial commit created
- [x] Validation catches missing dependencies
- [x] Validation checks TypeScript compilation
- [x] Success message shows correct commands
- [x] Skip flags work correctly

### Integration Tests

```bash
# Full flow
create-walrus-app test-app --sdk mysten --framework react --use-case simple-upload

# Should:
# 1. Generate project
# 2. Install dependencies
# 3. Initialize git
# 4. Create commit
# 5. Validate project
# 6. Show success message

cd test-app
npm run dev  # Should work immediately
```

### Edge Cases

- [ ] Install fails → Show manual steps
- [ ] Git not installed → Skip gracefully
- [ ] TypeScript errors → Warn but don't fail
- [ ] Skip install flag → Only generate files

## Risk Assessment

### Potential Blockers

1. **Package manager not found**: User has different PM than detected
   - **Mitigation**: Default to npm, allow override flag
2. **Install hangs**: Network issues
   - **Mitigation**: Add timeout, allow skip
3. **Git commit fails**: No git user configured
   - **Mitigation**: Warn user, provide instructions

### Contingency Plans

- If install fails: Provide manual install command
- If validation fails: Warn but don't block
- If git fails: Project still usable

## Security Considerations

### Phase-Specific Concerns

1. **Command injection**: Malicious project names in spawn
   - **Hardening**: Use array args, not shell string
2. **Path traversal**: Project path outside CWD
   - **Mitigation**: Validate project path
3. **Arbitrary code execution**: Malicious package.json scripts
   - **Mitigation**: Templates are trusted (bundled)

### Hardening Measures

```typescript
// Always use array args, never shell concatenation
spawn('npm', ['install'], { cwd: projectPath }); // ✅ Safe
// NOT: spawn(`cd ${projectPath} && npm install`); // ❌ Unsafe
```

## Next Steps

After Phase 8 completion:

1. **Testing**: E2E tests for all flows
2. **Documentation**: Update README with usage
3. **Publishing**: Publish to npm registry
4. **Monitoring**: Track usage analytics

### Open Questions

- Add telemetry for install success rate? (Decision: Future feature, privacy first)
- Support offline mode? (Decision: Future feature)
- Parallel install and git init? (Decision: No, sequential for clarity)
