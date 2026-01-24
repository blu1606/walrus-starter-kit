# Phase 7: Template Generation Engine

## Context Links

- [Main Plan](./plan.md)
- [PRD](../../POC/PRD.md)
- [CLI Scaffolding Research](../reports/researcher-260117-1353-cli-scaffolding.md)
- [Phase 2: CLI Engine Core](./phase-02-cli-engine-core.md)
- [Phase 3-6: Template Layers](./phase-03-template-base-layer.md)

## Overview

**Created:** 2026-01-17  
**Priority:** High  
**Status:** completed
**Completed:** 2026-01-17 16:22
**Estimated Effort:** 6 hours  
**Dependencies:** Phase 2-6 complete

## Key Insights

### From Research

1. **Base + Layer Pattern**: Avoid N×M template explosion
2. **Deep Merge**: Intelligent JSON merging for package.json
3. **File Overlaying**: Later layers override earlier ones
4. **Transform Strategy**: EJS for dynamic placeholders
5. **Atomic Operations**: All-or-nothing file generation

### Critical Pattern

```
Base (skeleton)
  + SDK Layer (adapter impl)
  + Framework Layer (React/Vue)
  + Use Case Layer (app logic)
  = Generated Project
```

## Requirements

### Functional

- Copy files from multiple template layers
- Deep merge package.json from all layers
- Transform files with project name placeholders
- Handle file conflicts (later layers win)
- Atomic generation (rollback on error)

### Technical

- Recursive directory copying
- JSON deep merge algorithm
- Template variable substitution
- Path normalization (cross-platform)
- Error recovery

### Dependencies

- Phase 2: Context object
- Phase 3-6: Template layers

## Architecture

### Generation Flow

```
Context (from Phase 2)
    ↓
Select Layers (base + sdk + framework + useCase)
    ↓
Pre-Flight Checks (dir exists? writable?)
    ↓
Copy Base Layer
    ↓
Overlay SDK Layer
    ↓
Overlay Framework Layer
    ↓
Overlay Use Case Layer
    ↓
Merge package.json (deep)
    ↓
Sort & Format JSON
    ↓
Transform Variables
    ↓
Write Files (atomic)
```

### Generator Module Structure

```
packages/cli/src/
├── generator/
│   ├── index.ts               # Main generator
│   ├── file-ops.ts            # File operations
│   ├── merge.ts               # Deep merge logic
│   ├── transform.ts           # Variable substitution
│   └── layers.ts              # Layer resolution
```

### Deep Merge Algorithm

```typescript
function deepMerge(base: any, overlay: any): any {
  if (Array.isArray(overlay)) {
    return overlay; // Arrays replace, don't merge
  }

  if (typeof overlay === 'object' && overlay !== null) {
    const result = { ...base };
    for (const key in overlay) {
      result[key] =
        key in base && typeof base[key] === 'object'
          ? deepMerge(base[key], overlay[key])
          : overlay[key];
    }
    return result;
  }

  return overlay; // Primitives replace
}
```

### File Overlay Logic

```typescript
// Later layers override earlier layers
const layers = [
  'templates/base',
  `templates/sdk-${context.sdk}`,
  `templates/${context.framework}`,
  `templates/${context.useCase}`,
];

for (const layer of layers) {
  await copyLayer(layer, targetDir);
}
```

## Related Code Files

### To Create

1. `packages/cli/src/generator/index.ts` - Main generator
2. `packages/cli/src/generator/file-ops.ts` - File operations
3. `packages/cli/src/generator/merge.ts` - Deep merge
4. `packages/cli/src/generator/transform.ts` - Variable substitution
5. `packages/cli/src/generator/layers.ts` - Layer resolution
6. `packages/cli/src/generator/types.ts` - Generator types

### To Modify

- `packages/cli/src/index.ts` - Call generator after validation

## Implementation Steps

### Step 1: Generator Types (30 min)

1. Create `packages/cli/src/generator/types.ts`:

```typescript
import type { Context } from '../types.js';

export interface Layer {
  name: string;
  path: string;
  priority: number; // Higher priority overwrites
}

export interface GeneratorOptions {
  context: Context;
  templateDir: string;
  targetDir: string;
  dryRun?: boolean;
}

export interface GeneratorResult {
  success: boolean;
  projectPath: string;
  filesCreated: number;
  error?: Error;
}
```

### Step 2: Layer Resolution (45 min)

2. Create `packages/cli/src/generator/layers.ts`:

```typescript
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Context } from '../types.js';
import type { Layer } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Templates are in packages/cli/templates (published with package)
const TEMPLATE_ROOT = path.join(__dirname, '../../templates');

export function resolveLayers(context: Context): Layer[] {
  const layers: Layer[] = [
    {
      name: 'base',
      path: path.join(TEMPLATE_ROOT, 'base'),
      priority: 1,
    },
    {
      name: `sdk-${context.sdk}`,
      path: path.join(TEMPLATE_ROOT, `sdk-${context.sdk}`),
      priority: 2,
    },
    {
      name: context.framework,
      path: path.join(TEMPLATE_ROOT, context.framework),
      priority: 3,
    },
    {
      name: context.useCase,
      path: path.join(TEMPLATE_ROOT, context.useCase),
      priority: 4,
    },
  ];

  // Optional: Tailwind layer
  if (context.tailwind) {
    layers.push({
      name: 'tailwind',
      path: path.join(TEMPLATE_ROOT, 'tailwind'),
      priority: 5,
    });
  }

  // Optional: Analytics layer
  if (context.analytics) {
    layers.push({
      name: 'analytics',
      path: path.join(TEMPLATE_ROOT, 'analytics'),
      priority: 6,
    });
  }

  return layers;
}
```

### Step 3: File Operations (1.5 hours)

3. Create `packages/cli/src/generator/file-ops.ts`:

```typescript
import fs from 'fs-extra';
import path from 'node:path';

/**
 * Recursively copy directory, excluding certain files
 */
export async function copyDirectory(
  src: string,
  dest: string,
  exclude: string[] = ['node_modules', '.git', 'dist']
): Promise<number> {
  let filesCreated = 0;

  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    if (exclude.includes(entry.name)) continue;

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await fs.ensureDir(destPath);
      filesCreated += await copyDirectory(srcPath, destPath, exclude);
    } else {
      await fs.copy(srcPath, destPath, { overwrite: true });
      filesCreated++;
    }
  }

  return filesCreated;
}

/**
 * Check if directory is empty
 */
export async function isDirectoryEmpty(dir: string): Promise<boolean> {
  const exists = await fs.pathExists(dir);
  if (!exists) return true;

  const entries = await fs.readdir(dir);
  return entries.length === 0;
}

/**
 * Create directory if it doesn't exist
 */
export async function ensureDirectory(dir: string): Promise<void> {
  await fs.ensureDir(dir);
}
```

### Step 4: Deep Merge Logic (1 hour)

4. Create `packages/cli/src/generator/merge.ts`:

```typescript
import fs from 'fs-extra';
import path from 'node:path';
import sortPackageJson from 'sort-package-json';

/**
 * Deep merge two objects
 */
export function deepMerge<T = any>(target: T, source: T): T {
  // Handle null/undefined
  if (source === null || source === undefined) {
    return target;
  }

  // Arrays: Replace entirely (don't merge)
  if (Array.isArray(source)) {
    return source as T;
  }

  // Objects: Merge recursively
  if (typeof source === 'object' && typeof target === 'object') {
    const result = { ...target } as any;

    for (const key in source) {
      const sourceValue = (source as any)[key];
      const targetValue = result[key];

      if (
        targetValue &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue) &&
        sourceValue &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue)
      ) {
        result[key] = deepMerge(targetValue, sourceValue);
      } else {
        result[key] = sourceValue;
      }
    }

    return result as T;
  }

  // Primitives: Replace
  return source;
}

/**
 * Merge multiple package.json files from layers
 */
export async function mergePackageJsonFiles(
  layers: string[],
  outputPath: string
): Promise<void> {
  let merged: any = {};

  for (const layerPath of layers) {
    const pkgPath = path.join(layerPath, 'package.json');

    if (await fs.pathExists(pkgPath)) {
      const pkgJson = await fs.readJson(pkgPath);
      merged = deepMerge(merged, pkgJson);
    }
  }

  // Sort keys for consistency
  const sorted = sortPackageJson(merged);

  await fs.writeJson(outputPath, sorted, { spaces: 2 });
}
```

### Step 5: Variable Transformation (45 min)

5. Create `packages/cli/src/generator/transform.ts`:

```typescript
import fs from 'fs-extra';
import path from 'node:path';
import type { Context } from '../types.js';

interface TransformVariables {
  projectName: string;
  sdkName: string;
  framework: string;
  useCase: string;
}

/**
 * Build transformation variables from context
 */
export function buildVariables(context: Context): TransformVariables {
  return {
    projectName: context.projectName,
    sdkName: context.sdk,
    framework: context.framework,
    useCase: context.useCase,
  };
}

/**
 * Transform string with variable substitution
 */
export function transformString(
  content: string,
  vars: TransformVariables
): string {
  return content
    .replace(/\{\{projectName\}\}/g, vars.projectName)
    .replace(/\{\{sdkName\}\}/g, vars.sdkName)
    .replace(/\{\{framework\}\}/g, vars.framework)
    .replace(/\{\{useCase\}\}/g, vars.useCase);
}

/**
 * Transform all text files in directory
 */
export async function transformDirectory(
  dir: string,
  vars: TransformVariables,
  extensions: string[] = ['.md', '.json', '.html']
): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await transformDirectory(fullPath, vars, extensions);
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      const content = await fs.readFile(fullPath, 'utf-8');
      const transformed = transformString(content, vars);
      await fs.writeFile(fullPath, transformed, 'utf-8');
    }
  }
}
```

### Step 6: Main Generator (1.5 hours)

6. Create `packages/cli/src/generator/index.ts`:

```typescript
import path from 'node:path';
import fs from 'fs-extra';
import { logger } from '../utils/logger.js';
import { resolveLayers } from './layers.js';
import {
  copyDirectory,
  ensureDirectory,
  isDirectoryEmpty,
} from './file-ops.js';
import { mergePackageJsonFiles } from './merge.js';
import { buildVariables, transformDirectory } from './transform.js';
import type { GeneratorOptions, GeneratorResult } from './types.js';

export async function generateProject(
  options: GeneratorOptions
): Promise<GeneratorResult> {
  const { context, targetDir, dryRun = false } = options;

  try {
    logger.info(`🏗️  Generating project: ${context.projectName}`);

    // Pre-flight checks
    if (!dryRun) {
      const isEmpty = await isDirectoryEmpty(targetDir);
      if (!isEmpty) {
        throw new Error(
          `Directory ${targetDir} is not empty. Please use an empty directory.`
        );
      }
      await ensureDirectory(targetDir);
    }

    // Resolve layers
    const layers = resolveLayers(context);
    logger.info(`📦 Layers: ${layers.map((l) => l.name).join(' + ')}`);

    let filesCreated = 0;

    // Copy layers sequentially (later layers override)
    for (const layer of layers) {
      if (!(await fs.pathExists(layer.path))) {
        logger.warn(`⚠️  Layer not found: ${layer.path} (skipping)`);
        continue;
      }

      logger.info(`📁 Copying layer: ${layer.name}`);

      if (!dryRun) {
        const count = await copyDirectory(layer.path, targetDir);
        filesCreated += count;
      }
    }

    // Merge package.json from all layers
    logger.info('🔗 Merging package.json files');
    if (!dryRun) {
      await mergePackageJsonFiles(
        layers.map((l) => l.path),
        path.join(targetDir, 'package.json')
      );
    }

    // Transform template variables
    logger.info('✏️  Transforming template variables');
    if (!dryRun) {
      const vars = buildVariables(context);
      await transformDirectory(targetDir, vars);
    }

    logger.success(`✓ Project generated successfully!`);
    logger.info(`📂 Files created: ${filesCreated}`);

    return {
      success: true,
      projectPath: targetDir,
      filesCreated,
    };
  } catch (error) {
    logger.error(`Failed to generate project: ${error}`);

    // Rollback: Remove partially created directory
    if (!dryRun && (await fs.pathExists(targetDir))) {
      logger.warn('🧹 Rolling back partial changes...');
      await fs.remove(targetDir);
    }

    return {
      success: false,
      projectPath: targetDir,
      filesCreated: 0,
      error: error as Error,
    };
  }
}
```

### Step 7: Integrate with CLI (45 min)

7. Update `packages/cli/src/index.ts`:

```typescript
// ... existing imports ...
import { generateProject } from './generator/index.js';

// ... existing program setup ...

.action(async (projectNameArg, options) => {
  try {
    logger.info('🚀 Welcome to Walrus Starter Kit!');

    // ... existing validation code ...

    // Generate project
    logger.info('\n🏗️  Generating your Walrus application...\n');

    const result = await generateProject({
      context,
      templateDir: path.join(__dirname, '../templates'),
      targetDir: context.projectPath
    });

    if (!result.success) {
      logger.error('❌ Project generation failed');
      process.exit(1);
    }

    // Success message
    logger.success('\n✨ Project created successfully!\n');
    logger.info('Next steps:');
    logger.info(`  cd ${context.projectName}`);
    logger.info(`  ${context.packageManager} install`);
    logger.info(`  ${context.packageManager} run dev`);

  } catch (error) {
    logger.error(`Failed to create project: ${error}`);
    process.exit(1);
  }
});
```

### Step 8: Testing (1 hour)

8. Create test script `packages/cli/src/test-generator.ts`:

```typescript
import { generateProject } from './generator/index.js';
import type { Context } from './types.js';
import path from 'node:path';

const testContext: Context = {
  projectName: 'test-walrus-app',
  projectPath: path.resolve('/tmp/test-walrus-app'),
  sdk: 'mysten',
  framework: 'react',
  useCase: 'simple-upload',
  analytics: false,
  tailwind: true,
  packageManager: 'pnpm',
};

async function test() {
  console.log('Testing generator...');

  const result = await generateProject({
    context: testContext,
    templateDir: path.join(__dirname, '../templates'),
    targetDir: testContext.projectPath,
    dryRun: false,
  });

  console.log('Result:', result);
}

test().catch(console.error);
```

## Todo List

- [x] Create `generator/types.ts` with interfaces
- [x] Create `generator/layers.ts` with resolution logic
- [x] Create `generator/file-ops.ts` with copy functions
- [x] Create `generator/merge.ts` with deep merge
- [x] Create `generator/transform.ts` with variable substitution
- [x] Create `generator/index.ts` with main generator
- [x] Update `src/index.ts` to call generator
- [x] Add `sort-package-json` dependency
- [x] Create test script
- [x] Test generation with all combinations
- [x] Test dry-run mode
- [x] Test error rollback

## Success Criteria

### Functional Tests

- [x] Base + SDK + Framework + UseCase layers combine correctly
- [x] package.json merges all dependencies
- [x] Variables transform in README/package.json
- [x] Later layers override earlier files
- [x] Empty directory check works
- [x] Rollback works on error

### Integration Tests

```bash
# Test full generation
cd packages/cli
npm run build
node dist/index.js test-app --sdk mysten --framework react --use-case simple-upload

# Verify output
cd test-app
cat package.json  # Should have merged deps
cat README.md     # Should have project name
npm install       # Should succeed
npm run dev       # Should start
```

### Edge Cases

- [ ] Non-empty directory error
- [ ] Missing layer graceful skip
- [ ] Invalid JSON merge recovery
- [ ] Cross-platform path handling

## Risk Assessment

### Potential Blockers

1. **File permission errors**: Can't write to target directory
   - **Mitigation**: Check write permissions before starting
2. **Layer conflicts**: Two layers have incompatible files
   - **Mitigation**: Clear layer priority, test all combinations
3. **package.json corruption**: Invalid merge result
   - **Mitigation**: Validate JSON after merge, rollback on error

### Contingency Plans

- If deep merge fails: Fall back to simple overlay (later wins)
- If rollback fails: Log error, provide manual cleanup instructions

## Security Considerations

### Phase-Specific Concerns

1. **Path traversal**: Malicious layer paths
   - **Hardening**: Validate layer paths are within template root
2. **Symbolic link attacks**: Malicious symlinks in templates
   - **Hardening**: Use `fs.copy` with `dereference: true`
3. **Code injection**: Malicious template code
   - **Hardening**: Templates are bundled with CLI (trusted)

### Hardening Measures

```typescript
function validateLayerPath(layerPath: string, root: string): void {
  const normalized = path.normalize(layerPath);
  if (!normalized.startsWith(root)) {
    throw new Error('Invalid layer path: outside template root');
  }
}
```

## Next Steps

After Phase 7 completion:

1. **Phase 8**: Post-install automation (npm install, git init)
2. **Testing**: E2E tests for all template combinations
3. **Publishing**: Prepare npm package

### Dependencies for Next Phase

Phase 8 requires:

- Generated project directory ✅
- Context object with packageManager ✅

### Open Questions

- Should we validate generated package.json? (Decision: Yes, in Phase 8)
- Support custom template URLs? (Decision: Future feature)
- Add template caching? (Decision: Not needed for MVP)
