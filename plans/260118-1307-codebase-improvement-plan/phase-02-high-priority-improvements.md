# Phase 02: High Priority Improvements

**Priority:** P1
**Effort:** 4h
**Status:** pending

## Context Links

- [CLI Scaffolding Best Practices](../reports/researcher-260118-1255-cli-scaffolding-best-practices.md) - Health 7/10
- [CLI Core Review](../reports/code-reviewer-260118-1300-cli-core-review.md) - Missing progress indicators

## Overview

Enhance user experience with progress indicators, improve reliability with package manager validation, expand E2E test coverage, and implement custom error types for better error handling.

## Key Insights

**User Experience Gaps:**
- File operations are silent (no progress feedback)
- Long-running installs show raw output
- Package manager detection doesn't verify availability

**Testing Gaps:**
- Only 1 E2E test (cli.e2e.test.mjs)
- No snapshot tests for generated projects
- Missing CLI flag combination tests

**Error Handling:**
- Generic error messages hide useful context
- No error codes for programmatic handling
- Stack traces hidden from users in dev mode

## Requirements

### Functional
- Display progress indicators during file copy operations
- Validate detected package manager is installed before use
- Add 7+ E2E tests covering all presets and flag combinations
- Implement custom error types extending CommanderError
- Add symlink detection in file operations

### Non-Functional
- Progress indicators don't slow down generation
- PM validation fails gracefully with fallback
- E2E tests complete in <5 minutes
- Error types maintain backward compatibility

## Architecture

**Component:** Progress Indicators

**Pattern:** Use ora/kleur for spinners during:
- File copying (generator/file-ops.ts)
- Dependency installation (post-install/package-manager.ts)
- TypeScript validation (post-install/validator.ts)

**Component:** Package Manager Validation

**Pattern:** Extend detectPackageManager() to verify PM availability:
```typescript
async function detectPackageManager(): Promise<PackageManager> {
  const userAgent = process.env.npm_config_user_agent;
  const detected = userAgent?.includes('pnpm') ? 'pnpm' : 'npm';
  return validatePMAvailability(detected);
}
```

**Component:** Custom Error Types

**Pattern:** Extend Commander's InvalidArgumentError:
```typescript
class ValidationError extends InvalidArgumentError {
  code = 'VALIDATION_ERROR';
}

class GenerationError extends CommanderError {
  code = 'GENERATION_ERROR';
}
```

## Related Code Files

**To Modify:**
- `packages/cli/src/utils/detect-pm.ts` (add validation)
- `packages/cli/src/generator/file-ops.ts` (add progress, symlink check)
- `packages/cli/src/post-install/package-manager.ts` (add spinner)
- `packages/cli/src/index.ts` (use custom error types)

**To Create:**
- `packages/cli/src/utils/errors.ts` (custom error classes)
- `packages/cli/src/utils/spinner.ts` (progress indicator helper)
- `packages/cli/__tests__/e2e/presets.e2e.test.mjs` (preset tests)
- `packages/cli/__tests__/e2e/cli-flags.e2e.test.mjs` (flag tests)

## Implementation Steps

### Step 1: Create Custom Error Types

**File:** `packages/cli/src/utils/errors.ts` (new)

```typescript
import { CommanderError, InvalidArgumentError } from 'commander';

export class ValidationError extends InvalidArgumentError {
  code = 'VALIDATION_ERROR';

  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class GenerationError extends CommanderError {
  code = 'GENERATION_ERROR';
  exitCode = 1;

  constructor(message: string) {
    super(1, 'GENERATION_ERROR', message);
    this.name = 'GenerationError';
  }
}

export class PostInstallError extends CommanderError {
  code = 'POST_INSTALL_ERROR';
  exitCode = 1;

  constructor(message: string) {
    super(1, 'POST_INSTALL_ERROR', message);
    this.name = 'PostInstallError';
  }
}
```

### Step 2: Add Package Manager Validation

**File:** `packages/cli/src/utils/detect-pm.ts`

```typescript
import { execSync } from 'node:child_process';
import type { PackageManager } from '../types.js';
import logger from './logger.js';

export function detectPackageManager(): PackageManager {
  const userAgent = process.env.npm_config_user_agent;

  if (userAgent?.includes('pnpm')) return validatePM('pnpm');
  if (userAgent?.includes('yarn')) return validatePM('yarn');
  if (userAgent?.includes('bun')) return validatePM('bun');

  return validatePM('npm');
}

function validatePM(pm: PackageManager): PackageManager {
  try {
    execSync(`${pm} --version`, { stdio: 'ignore' });
    return pm;
  } catch {
    logger.warn(`⚠️  ${pm} not found, falling back to npm`);
    return 'npm';
  }
}
```

### Step 3: Add Progress Indicators

**File:** `packages/cli/src/utils/spinner.ts` (new)

```typescript
import kleur from 'kleur';

export class Spinner {
  private message: string;
  private interval?: NodeJS.Timeout;
  private frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private currentFrame = 0;

  constructor(message: string) {
    this.message = message;
  }

  start(): void {
    process.stdout.write('\n');
    this.interval = setInterval(() => {
      const frame = this.frames[this.currentFrame];
      process.stdout.write(`\r${kleur.cyan(frame)} ${this.message}`);
      this.currentFrame = (this.currentFrame + 1) % this.frames.length;
    }, 80);
  }

  succeed(message?: string): void {
    this.stop();
    console.log(`${kleur.green('✓')} ${message || this.message}`);
  }

  fail(message?: string): void {
    this.stop();
    console.log(`${kleur.red('✗')} ${message || this.message}`);
  }

  private stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      process.stdout.write('\r');
    }
  }
}
```

### Step 4: Update File Operations with Progress

**File:** `packages/cli/src/generator/file-ops.ts`

Add spinner during directory copy:

```typescript
import { Spinner } from '../utils/spinner.js';

export async function copyDirectory(
  src: string,
  dest: string,
  exclude: string[] = defaultExclude,
): Promise<number> {
  let filesCreated = 0;
  const spinner = new Spinner('Copying template files...');
  spinner.start();

  try {
    await fs.ensureDir(dest);
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      // Check for symlinks
      if (entry.isSymbolicLink()) {
        logger.warn(`Skipping symlink: ${entry.name}`);
        continue;
      }

      // Existing copy logic...
      filesCreated++;
    }

    spinner.succeed(`Copied ${filesCreated} files`);
    return filesCreated;
  } catch (error) {
    spinner.fail('Failed to copy files');
    throw error;
  }
}
```

### Step 5: Expand E2E Test Coverage

**File:** `packages/cli/__tests__/e2e/presets.e2e.test.mjs` (new)

```javascript
import { execSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { describe, it, afterEach } from 'vitest';

const PRESETS = [
  { sdk: 'mysten', framework: 'react', useCase: 'simple-upload' },
  { sdk: 'mysten', framework: 'react', useCase: 'gallery' },
  { sdk: 'mysten', framework: 'vue', useCase: 'simple-upload' },
  { sdk: 'mysten', framework: 'plain-ts', useCase: 'simple-upload' },
];

describe('E2E: Preset Generation', () => {
  const testProjects = [];

  afterEach(() => {
    testProjects.forEach(dir => {
      if (existsSync(dir)) rmSync(dir, { recursive: true });
    });
    testProjects.length = 0;
  });

  PRESETS.forEach(({ sdk, framework, useCase }) => {
    it(`generates ${framework}-${sdk}-${useCase} preset`, () => {
      const projectName = `test-${framework}-${useCase}`;
      testProjects.push(projectName);

      execSync(
        `node dist/index.js ${projectName} --sdk ${sdk} --framework ${framework} --use-case ${useCase} --package-manager npm`,
        { stdio: 'inherit' }
      );

      // Verify project structure
      expect(existsSync(`${projectName}/package.json`)).toBe(true);
      expect(existsSync(`${projectName}/.gitignore`)).toBe(true);
      expect(existsSync(`${projectName}/.env`)).toBe(true);
      expect(existsSync(`${projectName}/src`)).toBe(true);
    });
  });
});
```

**File:** `packages/cli/__tests__/e2e/cli-flags.e2e.test.mjs` (new)

```javascript
describe('E2E: CLI Flags', () => {
  it('handles --skip-install flag', () => {
    const projectName = 'test-skip-install';

    execSync(
      `node dist/index.js ${projectName} --skip-install`,
      { stdio: 'inherit' }
    );

    expect(existsSync(`${projectName}/node_modules`)).toBe(false);
  });

  it('handles --package-manager flag', () => {
    const projectName = 'test-pm-flag';

    execSync(
      `node dist/index.js ${projectName} --package-manager pnpm`,
      { stdio: 'inherit' }
    );

    const pkg = JSON.parse(
      readFileSync(`${projectName}/package.json`, 'utf-8')
    );

    expect(pkg.packageManager).toContain('pnpm');
  });

  it('handles non-interactive mode (all flags)', () => {
    const projectName = 'test-non-interactive';

    execSync(
      `node dist/index.js ${projectName} --sdk mysten --framework react --use-case simple-upload --package-manager npm --skip-install`,
      { stdio: 'inherit' }
    );

    expect(existsSync(`${projectName}/package.json`)).toBe(true);
  });
});
```

### Step 6: Add Symlink Detection

**File:** `packages/cli/src/generator/file-ops.ts`

Already added in Step 4 - verify implementation includes:

```typescript
if (entry.isSymbolicLink()) {
  logger.warn(`Skipping symlink: ${entry.name}`);
  continue;
}
```

## Todo List

- [ ] Create custom error classes (errors.ts)
- [ ] Update detect-pm.ts with validation logic
- [ ] Create spinner utility (spinner.ts)
- [ ] Add progress indicators to file-ops.ts
- [ ] Add symlink detection to file-ops.ts
- [ ] Create presets E2E tests (7 test cases)
- [ ] Create CLI flags E2E tests (3 test cases)
- [ ] Update index.ts to use custom error types
- [ ] Run full test suite (target: 105+ tests passing)
- [ ] Verify spinners work on Windows/macOS/Linux

## Success Criteria

- ✅ Progress indicators display during file copy (50+ files)
- ✅ Package manager validation prevents runtime errors
- ✅ 10+ E2E tests covering all presets and flags
- ✅ Custom error types provide error codes
- ✅ Symlinks skipped with warning message
- ✅ Test suite completes in <5 minutes
- ✅ No regressions in existing functionality

## Risk Assessment

**Risks:**
- **Medium:** Spinner conflicts with TTY detection in CI
- **Low:** PM validation slows down startup
- **Low:** E2E tests flaky on slow systems

**Mitigations:**
- Disable spinners in non-TTY environments
- Cache PM validation result
- Increase E2E test timeouts to 60s
- Run E2E tests in parallel with vitest

## Next Steps

1. Implement custom error types and spinner utility
2. Update PM detection with validation
3. Add progress indicators to file operations
4. Create comprehensive E2E test suite
5. Run tests, verify 105+ passing
6. Commit: "feat(ux): add progress indicators and expand test coverage"
7. Proceed to Phase 03
