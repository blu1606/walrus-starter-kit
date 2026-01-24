# Phase 03: Medium Priority Enhancements

**Priority:** P2
**Effort:** 4h
**Status:** pending

## Context Links

- [CLI Scaffolding Best Practices](../reports/researcher-260118-1255-cli-scaffolding-best-practices.md) - Recommendations for debug mode, lockfile detection
- [Generator Security Audit](../reports/code-reviewer-260118-1300-generator-security-audit.md) - File size limits needed

## Overview

Add debug mode for troubleshooting, enhance PM detection with lockfile support, implement file size limits to prevent DoS, improve error messaging, and clean up deprecated code.

## Key Insights

**Debugging Gaps:**
- No verbose mode for stack traces
- Template resolution paths hidden
- Merge operation details not logged

**Package Manager Detection:**
- Lockfile detection missing (pnpm-lock.yaml, yarn.lock, bun.lockb)
- No warning if lockfile/detected PM mismatch

**File Operations:**
- No size limits (risk: huge files cause OOM)
- Binary files could corrupt if transformed

**Code Quality:**
- Deprecated git.ts file still present
- Hardcoded URLs need updating
- Inconsistent error message formats

## Requirements

### Functional
- Add `--verbose` flag for debug logging
- Detect lockfiles to determine PM preference
- Implement 50MB file size limit during copy
- Add binary file exclusion list
- Remove deprecated git.ts file
- Add context-aware template escaping for JSON/HTML

### Non-Functional
- Debug mode doesn't affect performance when disabled
- Lockfile detection <10ms overhead
- File size checks don't slow down small projects
- Maintain backward compatibility

## Architecture

**Component:** Debug Mode

**Pattern:** Environment variable + CLI flag:
```typescript
const DEBUG = program.opts().verbose || process.env.DEBUG;
if (DEBUG) {
  logger.debug('Template resolved to:', presetPath);
}
```

**Component:** Lockfile Detection

**Pattern:** Multi-tier detection (priority order):
1. CLI flag `--package-manager`
2. npm_config_user_agent
3. Lockfile detection
4. PM availability check
5. Default to npm

**Component:** File Size Limits

**Pattern:** Check size before read:
```typescript
const stats = await fs.stat(srcPath);
if (stats.size > MAX_FILE_SIZE) {
  logger.warn(`Skipping large file: ${entry.name}`);
  continue;
}
```

## Related Code Files

**To Modify:**
- `packages/cli/src/index.ts` (add --verbose flag)
- `packages/cli/src/utils/detect-pm.ts` (add lockfile detection)
- `packages/cli/src/utils/logger.ts` (add debug method)
- `packages/cli/src/generator/file-ops.ts` (add size limits)
- `packages/cli/src/generator/transform.ts` (add context-aware escaping)
- `packages/cli/src/post-install/messages.ts` (fix hardcoded URLs)

**To Delete:**
- `packages/cli/src/post-install/git.ts` (deprecated)

## Implementation Steps

### Step 1: Add Debug Mode

**File:** `packages/cli/src/index.ts`

Add --verbose flag:

```typescript
program
  .version(packageJson.version)
  .argument('[project-name]', 'Name of the project')
  .option('--sdk <sdk>', 'SDK to use')
  .option('--framework <framework>', 'Framework to use')
  .option('--use-case <use-case>', 'Use case preset')
  .option('--package-manager <pm>', 'Package manager')
  .option('--skip-install', 'Skip dependency installation')
  .option('--verbose', 'Enable verbose debug logging')  // NEW
  .parse();
```

**File:** `packages/cli/src/utils/logger.ts`

Add debug method:

```typescript
import kleur from 'kleur';

const DEBUG = process.env.DEBUG || process.argv.includes('--verbose');

export default {
  info: (message: string) => console.log(kleur.cyan(message)),
  success: (message: string) => console.log(kleur.green(message)),
  warn: (message: string) => console.log(kleur.yellow(message)),
  error: (message: string) => console.log(kleur.red(message)),
  debug: (message: string, ...args: any[]) => {
    if (DEBUG) {
      console.log(kleur.gray(`[DEBUG] ${message}`), ...args);
    }
  },
};
```

### Step 2: Enhance PM Detection with Lockfiles

**File:** `packages/cli/src/utils/detect-pm.ts`

```typescript
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { PackageManager } from '../types.js';
import logger from './logger.js';

export function detectPackageManager(cwd: string = process.cwd()): PackageManager {
  // 1. Check user agent (existing logic)
  const userAgent = process.env.npm_config_user_agent;
  if (userAgent?.includes('pnpm')) return validatePM('pnpm');
  if (userAgent?.includes('yarn')) return validatePM('yarn');
  if (userAgent?.includes('bun')) return validatePM('bun');

  // 2. Check for lockfiles (NEW)
  logger.debug('User agent not found, checking lockfiles...');

  if (existsSync(join(cwd, 'pnpm-lock.yaml'))) {
    logger.debug('Found pnpm-lock.yaml');
    return validatePM('pnpm');
  }

  if (existsSync(join(cwd, 'yarn.lock'))) {
    logger.debug('Found yarn.lock');
    return validatePM('yarn');
  }

  if (existsSync(join(cwd, 'bun.lockb'))) {
    logger.debug('Found bun.lockb');
    return validatePM('bun');
  }

  // 3. Default to npm
  logger.debug('No lockfile found, defaulting to npm');
  return validatePM('npm');
}

function validatePM(pm: PackageManager): PackageManager {
  try {
    execSync(`${pm} --version`, { stdio: 'ignore' });
    logger.debug(`${pm} validated successfully`);
    return pm;
  } catch {
    logger.warn(`⚠️  ${pm} not found, falling back to npm`);
    return pm === 'npm' ? 'npm' : validatePM('npm');
  }
}
```

### Step 3: Add File Size Limits

**File:** `packages/cli/src/generator/file-ops.ts`

```typescript
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Add binary file extensions to skip during transformation
const BINARY_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.mp4', '.webm', '.mp3', '.wav',
  '.zip', '.tar', '.gz', '.pdf',
];

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
      if (exclude.includes(entry.name)) continue;
      if (entry.isSymbolicLink()) {
        logger.warn(`Skipping symlink: ${entry.name}`);
        continue;
      }

      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await fs.ensureDir(destPath);
        filesCreated += await copyDirectory(srcPath, destPath, exclude);
      } else {
        // NEW: Check file size before copying
        const stats = await fs.stat(srcPath);
        if (stats.size > MAX_FILE_SIZE) {
          logger.warn(`Skipping large file (${(stats.size / 1024 / 1024).toFixed(2)}MB): ${entry.name}`);
          continue;
        }

        await fs.copy(srcPath, destPath);
        filesCreated++;
      }
    }

    spinner.succeed(`Copied ${filesCreated} files`);
    return filesCreated;
  } catch (error) {
    spinner.fail('Failed to copy files');
    throw error;
  }
}
```

### Step 4: Add Context-Aware Template Escaping

**File:** `packages/cli/src/generator/transform.ts`

```typescript
import { extname } from 'node:path';

function escapeForContext(value: string, fileExt: string): string {
  switch (fileExt) {
    case '.json':
      // Escape for JSON string values (remove outer quotes from JSON.stringify)
      return JSON.stringify(value).slice(1, -1);

    case '.html':
    case '.vue':
      // Escape HTML entities
      return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    default:
      // Code files (.ts, .js, .css) - already validated, no escaping needed
      return value;
  }
}

export function transformFileContent(
  content: string,
  vars: TemplateVariables,
  filePath: string,
): string {
  const ext = extname(filePath);

  return content
    .replace(/\{\{projectName\}\}/g, escapeForContext(vars.projectName, ext))
    .replace(/\{\{sdkName\}\}/g, escapeForContext(vars.sdkName, ext))
    .replace(/\{\{framework\}\}/g, escapeForContext(vars.framework, ext))
    .replace(/\{\{useCase\}\}/g, escapeForContext(vars.useCase, ext));
}
```

### Step 5: Clean Up Deprecated Code

**Delete:** `packages/cli/src/post-install/git.ts`

Remove file entirely (marked deprecated, no longer used).

**Update:** `packages/cli/src/post-install/index.ts`

Remove git.ts import if present:

```typescript
// Remove this line (if exists)
// import { initGit } from './git.js';  ❌ DELETE
```

### Step 6: Fix Hardcoded URLs

**File:** `packages/cli/src/post-install/messages.ts`

Update placeholder URL (line 75):

```typescript
// BEFORE
console.log(`Report issues: ${kleur.cyan('https://github.com/your-org/walrus-starter-kit/issues')}`);

// AFTER
console.log(`Report issues: ${kleur.cyan('https://github.com/MystenLabs/walrus-starter-kit/issues')}`);
```

### Step 7: Improve Error Message Sanitization

**File:** `packages/cli/src/generator/index.ts`

Sanitize internal paths in production:

```typescript
import { relative } from 'node:path';

// When logging errors (line 26)
const relativePath = relative(process.cwd(), targetDir);
throw new Error(`Directory ${relativePath} is not empty...`);

// Instead of:
throw new Error(`Directory ${targetDir} is not empty...`);  // ❌ Exposes absolute path
```

## Todo List

- [ ] Add --verbose flag to CLI
- [ ] Implement logger.debug() method
- [ ] Add lockfile detection to detect-pm.ts
- [ ] Implement file size limits (50MB)
- [ ] Add binary file extension exclusions
- [ ] Implement context-aware escaping in transform.ts
- [ ] Delete deprecated git.ts file
- [ ] Fix hardcoded GitHub URL
- [ ] Sanitize error messages (use relative paths)
- [ ] Add debug logging to key operations
- [ ] Test debug mode on all platforms
- [ ] Verify lockfile detection priority order

## Success Criteria

- ✅ --verbose flag shows debug output
- ✅ Lockfiles detected before defaulting to npm
- ✅ Files >50MB skipped with warning
- ✅ Binary files excluded from transformation
- ✅ git.ts removed from codebase
- ✅ GitHub URL points to correct repo
- ✅ Error messages use relative paths
- ✅ Debug logs disabled by default (no performance impact)
- ✅ All tests pass

## Risk Assessment

**Risks:**
- **Low:** Lockfile detection false positives (e.g., yarn.lock in npm project)
- **Low:** File size limit breaks legitimate use cases (rare)
- **Low:** Context escaping breaks existing templates

**Mitigations:**
- Log warnings when lockfile/detected PM mismatch
- Make MAX_FILE_SIZE configurable via env var
- Test escaping with existing presets before merge
- Keep escaping minimal (only JSON/HTML)

## Next Steps

1. Implement debug mode and lockfile detection
2. Add file size limits and binary exclusions
3. Clean up deprecated code and URLs
4. Test verbose output on sample project
5. Verify lockfile detection with all PMs
6. Run full test suite
7. Commit: "feat(dx): add debug mode, lockfile detection, and file size limits"
8. Proceed to Phase 04
