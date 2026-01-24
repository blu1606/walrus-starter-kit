# Phase 04: Low Priority Polish

**Priority:** P3
**Effort:** 2h
**Status:** pending

## Context Links

- [CLI Scaffolding Best Practices](../reports/researcher-260118-1255-cli-scaffolding-best-practices.md) - Template conditionals, performance optimization

## Overview

Optional enhancements for performance optimization, template conditionals (future-proofing), PM version checking, and enhanced dry-run mode.

## Key Insights

**Performance Opportunities:**
- Sequential file processing (could parallelize)
- Large presets take 5-10s to copy

**Template Engine:**
- Current regex replacement sufficient for 4 variables
- Conditionals only needed if re-enabling Tailwind/Analytics

**Package Manager:**
- No version validation (e.g., pnpm >= 9.0.0)
- Documented in README but not enforced

**Dry Run:**
- Only logs env copy, doesn't show full manifest

## Requirements

### Functional
- Parallelize file copy/transform for 2x speedup
- Add template conditional support (Handlebars or custom)
- Validate PM versions against minimum requirements
- Enhance dry-run to show full operation manifest

### Non-Functional
- Performance improvements don't add complexity
- Template conditionals optional (only if needed)
- Version checks don't block valid PMs
- Dry-run remains fast (<1s)

## Architecture

**Component:** Parallel File Processing

**Pattern:** Promise.all for independent operations:
```typescript
const transformPromises = entries.map(entry => transformFile(entry));
await Promise.all(transformPromises);
```

**Component:** Template Conditionals

**Pattern:** Custom syntax (avoid Handlebars dependency):
```typescript
// {{#if useZkLogin}}
import { ZkLoginProvider } from '@mysten/zklogin';
// {{/if}}
```

**Component:** PM Version Validation

**Pattern:** Semver check after detection:
```typescript
const MIN_VERSIONS = { pnpm: '9.0.0', yarn: '1.22.0' };
```

## Related Code Files

**To Modify:**
- `packages/cli/src/generator/file-ops.ts` (parallelize)
- `packages/cli/src/generator/transform.ts` (conditionals)
- `packages/cli/src/utils/detect-pm.ts` (version check)
- `packages/cli/src/generator/index.ts` (enhanced dry-run)

**To Create:**
- `packages/cli/src/utils/version.ts` (semver comparison helper)

## Implementation Steps

### Step 1: Parallelize File Operations

**File:** `packages/cli/src/generator/file-ops.ts`

```typescript
export async function copyDirectory(
  src: string,
  dest: string,
  exclude: string[] = defaultExclude,
): Promise<number> {
  await fs.ensureDir(dest);
  const entries = await fs.readdir(src, { withFileTypes: true });

  // NEW: Parallel processing
  const copyPromises = entries
    .filter(entry => !exclude.includes(entry.name))
    .filter(entry => !entry.isSymbolicLink())
    .map(async entry => {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        return copyDirectory(srcPath, destPath, exclude);
      }

      const stats = await fs.stat(srcPath);
      if (stats.size > MAX_FILE_SIZE) {
        logger.warn(`Skipping large file: ${entry.name}`);
        return 0;
      }

      await fs.copy(srcPath, destPath);
      return 1;
    });

  const results = await Promise.all(copyPromises);
  return results.reduce((sum, count) => sum + count, 0);
}
```

**File:** `packages/cli/src/generator/transform.ts`

```typescript
export async function transformDirectory(
  src: string,
  vars: TemplateVariables,
  extensions: string[] = defaultExtensions,
): Promise<number> {
  let filesTransformed = 0;
  const entries = await fs.readdir(src, { withFileTypes: true });

  // NEW: Parallel transformation
  const transformPromises = entries
    .filter(entry => entry.isFile())
    .filter(entry => extensions.some(ext => entry.name.endsWith(ext)))
    .map(async entry => {
      const fullPath = path.join(src, entry.name);
      const content = await fs.readFile(fullPath, 'utf-8');
      const transformed = transformFileContent(content, vars, fullPath);
      await fs.writeFile(fullPath, transformed, 'utf-8');
      return 1;
    });

  // Process subdirectories recursively (sequential)
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const subPath = path.join(src, entry.name);
      filesTransformed += await transformDirectory(subPath, vars, extensions);
    }
  }

  const results = await Promise.all(transformPromises);
  filesTransformed += results.reduce((sum, count) => sum + count, 0);

  return filesTransformed;
}
```

### Step 2: Add Template Conditional Support (Optional)

**File:** `packages/cli/src/generator/transform.ts`

Custom conditional parser:

```typescript
function processConditionals(
  content: string,
  vars: TemplateVariables,
): string {
  // Simple if/endif syntax: {{#if varName}} ... {{/if}}
  const ifRegex = /\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;

  return content.replace(ifRegex, (match, condition, body) => {
    // Check if condition variable is truthy
    const value = vars[condition as keyof TemplateVariables];
    return value ? body : '';
  });
}

export function transformFileContent(
  content: string,
  vars: TemplateVariables,
  filePath: string,
): string {
  const ext = extname(filePath);

  // Process conditionals first
  content = processConditionals(content, vars);

  // Then variable substitution
  return content
    .replace(/\{\{projectName\}\}/g, escapeForContext(vars.projectName, ext))
    .replace(/\{\{sdkName\}\}/g, escapeForContext(vars.sdkName, ext))
    .replace(/\{\{framework\}\}/g, escapeForContext(vars.framework, ext))
    .replace(/\{\{useCase\}\}/g, escapeForContext(vars.useCase, ext));
}
```

**Note:** Only implement if analytics/Tailwind layers are re-enabled.

### Step 3: Add PM Version Validation

**File:** `packages/cli/src/utils/version.ts` (new)

```typescript
export function compareVersions(version: string, minimum: string): boolean {
  const v = version.split('.').map(Number);
  const m = minimum.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    if (v[i] > m[i]) return true;
    if (v[i] < m[i]) return false;
  }

  return true; // Equal
}
```

**File:** `packages/cli/src/utils/detect-pm.ts`

```typescript
import { compareVersions } from './version.js';

const MIN_VERSIONS: Record<PackageManager, string> = {
  npm: '7.0.0',
  pnpm: '9.0.0',
  yarn: '1.22.0',
  bun: '1.0.0',
};

function validatePM(pm: PackageManager): PackageManager {
  try {
    const version = execSync(`${pm} --version`, { encoding: 'utf-8' }).trim();
    const minVersion = MIN_VERSIONS[pm];

    if (!compareVersions(version, minVersion)) {
      logger.warn(
        `⚠️  ${pm} version ${version} is below minimum ${minVersion}`
      );
      logger.warn(`   Upgrade with: npm install -g ${pm}@latest`);
      // Don't block, just warn
    }

    logger.debug(`${pm} version ${version} validated`);
    return pm;
  } catch {
    logger.warn(`⚠️  ${pm} not found, falling back to npm`);
    return pm === 'npm' ? 'npm' : validatePM('npm');
  }
}
```

### Step 4: Enhanced Dry Run Mode

**File:** `packages/cli/src/generator/index.ts`

Add manifest generation:

```typescript
interface DryRunManifest {
  targetDir: string;
  preset: string;
  files: {
    copy: string[];
    transform: string[];
    create: string[];
  };
  operations: {
    copyEnv: boolean;
    installDeps: boolean;
    runValidation: boolean;
  };
}

async function generateManifest(
  context: ProjectContext,
): Promise<DryRunManifest> {
  const presetPath = resolvePresetPath(context);
  const allFiles = await getAllFiles(presetPath);

  const transformExtensions = ['.md', '.json', '.html', '.ts', '.tsx', '.js', '.jsx'];
  const filesToTransform = allFiles.filter(f =>
    transformExtensions.some(ext => f.endsWith(ext))
  );
  const filesToCopy = allFiles.filter(f => !filesToTransform.includes(f));

  return {
    targetDir: context.projectPath,
    preset: `${context.framework}-${context.sdk}-${context.useCase}`,
    files: {
      copy: filesToCopy,
      transform: filesToTransform,
      create: ['.env', '.gitignore'],
    },
    operations: {
      copyEnv: true,
      installDeps: !context.skipInstall,
      runValidation: !context.skipInstall,
    },
  };
}

// Usage in generateProject()
if (context.dryRun) {
  const manifest = await generateManifest(context);
  console.log('\n📋 Dry Run Manifest:\n');
  console.log(JSON.stringify(manifest, null, 2));
  return { success: true, filesCreated: 0 };
}
```

## Todo List

- [ ] Parallelize copyDirectory operations
- [ ] Parallelize transformDirectory operations
- [ ] Add version comparison utility
- [ ] Implement PM version validation
- [ ] Add conditional template support (optional)
- [ ] Implement enhanced dry-run manifest
- [ ] Benchmark performance improvements
- [ ] Test on large presets (100+ files)
- [ ] Verify parallel operations don't break on Windows
- [ ] Update README with minimum PM versions

## Success Criteria

- ✅ File copy 50-100% faster on large presets
- ✅ PM version warnings display for outdated versions
- ✅ Template conditionals work (if implemented)
- ✅ Dry-run shows complete operation manifest
- ✅ No race conditions in parallel operations
- ✅ All tests pass

## Risk Assessment

**Risks:**
- **Low:** Parallel operations cause file handle exhaustion
- **Low:** Version parsing breaks on pre-release versions (1.0.0-beta)
- **Low:** Conditional syntax conflicts with existing templates

**Mitigations:**
- Limit concurrency to 10 parallel operations
- Use robust semver library if needed (node-semver)
- Test conditionals with all existing presets
- Make all features optional (feature flags)

## Next Steps

1. Implement parallelization (biggest impact)
2. Add PM version validation
3. Benchmark before/after performance
4. Consider template conditionals only if needed
5. Test on Windows/macOS/Linux
6. Commit: "perf: parallelize file operations, add PM version checks"
7. Proceed to Phase 05
