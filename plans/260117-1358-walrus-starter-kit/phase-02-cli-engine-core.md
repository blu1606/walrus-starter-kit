# Phase 2: CLI Engine Core

## Context Links

- [Main Plan](./plan.md)
- [PRD](../../POC/PRD.md)
- [CLI Scaffolding Research](../reports/researcher-260117-1353-cli-scaffolding.md)
- [Phase 1: Monorepo Foundation](./phase-01-monorepo-foundation.md)

## Overview

**Created:** 2026-01-17  
**Priority:** High  
**Status:** pending  
**Estimated Effort:** 6 hours  
**Dependencies:** Phase 1 complete

## Key Insights

### From Research

1. **Pipeline Architecture**: Entry → Parse → Prompt → Validate → Execute
2. **Context Object**: Single source of truth for user choices
3. **Hybrid Mode**: Support both interactive and CI/CD (all flags)
4. **Validation First**: Check compatibility before file operations
5. **Graceful Exit**: Clean up on SIGTERM/SIGINT

### Critical Patterns

- Commander for arg parsing (robust, industry standard)
- Prompts for interactive flow (lightweight, type-safe)
- Kleur for colored output (zero dependencies)
- Context object passed through pipeline

## Requirements

### Functional

- Interactive 6-step wizard (project name, SDK, framework, use case, analytics, tailwind)
- Non-interactive mode with CLI flags (`--sdk`, `--framework`, etc.)
- Compatibility matrix validation
- Clear error messages with suggestions
- Abort handling (cleanup partial state)

### Technical

- TypeScript strict mode
- ESM module syntax
- Cross-platform (Windows/Linux/macOS)
- Zero-config for interactive mode
- Full-config for CI/CD mode

### Dependencies

- Phase 1: Build system, package.json

## Architecture

### CLI Flow Diagram

```
Entry (index.ts)
    ↓
Parse Args (commander)
    ↓
Interactive? ──No──→ Validate Args
    ↓ Yes              ↓
Run Prompts ──────→ Build Context
    ↓
Validate Matrix
    ↓
[Phase 7: Generate] (future)
```

### Component Design

**1. index.ts** (Entry Point)

```typescript
#!/usr/bin/env node
import { program } from 'commander';
import { runPrompts } from './prompts.js';
import { validateContext } from './validator.js';
import { buildContext } from './context.js';

program
  .name('create-walrus-app')
  .argument('[project-name]', 'Project directory name')
  .option('--sdk <sdk>', 'SDK to use')
  .option('--framework <framework>', 'Framework to use')
  .option('--use-case <use-case>', 'Use case template')
  .option('--analytics', 'Include Blockberry analytics', false)
  .option('--tailwind', 'Include Tailwind CSS', true)
  .parse();
```

**2. prompts.ts** (Interactive Flow)

```typescript
import prompts from 'prompts';
import { COMPATIBILITY_MATRIX } from './matrix.js';

export async function runPrompts(initialContext: Partial<Context>) {
  return await prompts([
    {
      type: 'text',
      name: 'projectName',
      message: 'Project name:',
      initial: 'my-walrus-app',
      validate: (name) => validateProjectName(name),
    },
    {
      type: 'select',
      name: 'sdk',
      message: 'Choose SDK:',
      choices: [
        { title: '@mysten/walrus', value: 'mysten' },
      ],
    },
    // ... more prompts
  ]);
}
```

**3. validator.ts** (Compatibility Check)

```typescript
export const COMPATIBILITY_MATRIX = {
  mysten: {
    frameworks: ['react', 'vue', 'plain-ts'],
    useCases: ['simple-upload', 'gallery', 'defi-nft'],
  },
  // ...
};

export function validateContext(context: Context): ValidationResult {
  const { sdk, framework, useCase } = context;

  if (!COMPATIBILITY_MATRIX[sdk].frameworks.includes(framework)) {
    return {
      valid: false,
      error: `${sdk} is incompatible with ${framework}`,
      suggestion: `Try: ${COMPATIBILITY_MATRIX[sdk].frameworks[0]}`,
    };
  }

  return { valid: true };
}
```

**4. context.ts** (State Management)

```typescript
export interface Context {
  projectName: string;
  projectPath: string;
  sdk: 'mysten';
  framework: 'react' | 'vue' | 'plain-ts';
  useCase: 'simple-upload' | 'gallery';
  analytics: boolean;
  tailwind: boolean;
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun';
}

export function buildContext(
  args: Record<string, unknown>,
  prompts: Record<string, unknown>
): Context {
  return {
    projectName: (args.projectName || prompts.projectName) as string,
    projectPath: path.resolve(process.cwd(), projectName),
    // ... merge args + prompts
    packageManager: detectPackageManager(),
  };
}
```

## Related Code Files

### To Create

1. `packages/cli/src/index.ts` - Entry point + commander setup
2. `packages/cli/src/prompts.ts` - Interactive wizard
3. `packages/cli/src/validator.ts` - Compatibility matrix
4. `packages/cli/src/context.ts` - Context builder
5. `packages/cli/src/matrix.ts` - SDK/framework compatibility data
6. `packages/cli/src/utils/detect-pm.ts` - Package manager detection
7. `packages/cli/src/utils/validate-name.ts` - Project name validation
8. `packages/cli/src/types.ts` - TypeScript interfaces

### To Modify

- `packages/cli/package.json` - Add dependencies (commander, prompts, kleur)

## Implementation Steps

### Step 1: Add Dependencies (15 min)

1. Update `packages/cli/package.json`:

```json
{
  "dependencies": {
    "commander": "^11.1.0",
    "prompts": "^2.4.2",
    "kleur": "^4.1.5",
    "fs-extra": "^11.2.0"
  },
  "devDependencies": {
    "@types/prompts": "^2.4.9",
    "@types/fs-extra": "^11.0.4"
  }
}
```

2. Install:

```bash
cd packages/cli && pnpm install
```

### Step 2: Type Definitions (30 min)

3. Create `src/types.ts`:

```typescript
export type SDK = 'mysten';
export type Framework = 'react' | 'vue' | 'plain-ts';
export type UseCase = 'simple-upload' | 'gallery';
export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun';

export interface Context {
  projectName: string;
  projectPath: string;
  sdk: SDK;
  framework: Framework;
  useCase: UseCase;
  analytics: boolean;
  tailwind: boolean;
  packageManager: PackageManager;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  suggestion?: string;
}
```

### Step 3: Compatibility Matrix (30 min)

4. Create `src/matrix.ts`:

```typescript
export const COMPATIBILITY_MATRIX = {
  mysten: {
    frameworks: ['react', 'vue', 'plain-ts'],
    useCases: ['simple-upload', 'gallery'],
  },
} as const;

export const SDK_METADATA = {
  mysten: {
    name: '@mysten/walrus',
    description: 'Official Mysten Labs SDK (Testnet stable)',
    docs: 'https://docs.walrus.site',
  },
} as const;
```

### Step 4: Validation Logic (45 min)

5. Create `src/validator.ts`:

```typescript
import { Context, ValidationResult } from './types.js';
import { COMPATIBILITY_MATRIX } from './matrix.js';

export function validateContext(context: Context): ValidationResult {
  const { sdk, framework, useCase } = context;

  // Check framework compatibility
  if (!COMPATIBILITY_MATRIX[sdk].frameworks.includes(framework)) {
    return {
      valid: false,
      error: `SDK "${sdk}" is incompatible with framework "${framework}"`,
      suggestion: `Compatible frameworks for ${sdk}: ${COMPATIBILITY_MATRIX[sdk].frameworks.join(', ')}`,
    };
  }

  // Check use case compatibility
  if (!COMPATIBILITY_MATRIX[sdk].useCases.includes(useCase)) {
    return {
      valid: false,
      error: `SDK "${sdk}" does not support use case "${useCase}"`,
      suggestion: `Supported use cases for ${sdk}: ${COMPATIBILITY_MATRIX[sdk].useCases.join(', ')}`,
    };
  }

  return { valid: true };
}

export function validateProjectName(name: string): boolean | string {
  // npm package naming rules
  if (!/^[a-z0-9-]+$/.test(name)) {
    return 'Project name must contain only lowercase letters, numbers, and hyphens';
  }

  if (name.startsWith('-') || name.endsWith('-')) {
    return 'Project name cannot start or end with a hyphen';
  }

  return true;
}
```

### Step 5: Utility Functions (45 min)

6. Create `src/utils/detect-pm.ts`:

```typescript
import { PackageManager } from '../types.js';

export function detectPackageManager(): PackageManager {
  const userAgent = process.env.npm_config_user_agent;

  if (userAgent?.includes('pnpm')) return 'pnpm';
  if (userAgent?.includes('yarn')) return 'yarn';
  if (userAgent?.includes('bun')) return 'bun';

  return 'npm';
}
```

7. Create `src/utils/logger.ts`:

```typescript
import kleur from 'kleur';

export const logger = {
  info: (msg: string) => console.log(kleur.blue('ℹ'), msg),
  success: (msg: string) => console.log(kleur.green('✓'), msg),
  error: (msg: string) => console.error(kleur.red('✗'), msg),
  warn: (msg: string) => console.warn(kleur.yellow('⚠'), msg),
};
```

### Step 6: Interactive Prompts (1.5 hours)

8. Create `src/prompts.ts`:

```typescript
import prompts from 'prompts';
import { Context } from './types.js';
import { COMPATIBILITY_MATRIX, SDK_METADATA } from './matrix.js';
import { validateProjectName } from './validator.js';

export async function runPrompts(
  initial: Partial<Context> = {}
): Promise<Partial<Context>> {
  const response = await prompts([
    {
      type: 'text',
      name: 'projectName',
      message: 'Project name:',
      initial: initial.projectName || 'my-walrus-app',
      validate: validateProjectName,
    },
    {
      type: 'select',
      name: 'sdk',
      message: 'Choose Walrus SDK:',
      choices: [
        {
          title: `${SDK_METADATA.mysten.name} - ${SDK_METADATA.mysten.description}`,
          value: 'mysten',
        },
      ],
      initial: 0,
    },
    {
      type: 'select',
      name: 'framework',
      message: 'Choose framework:',
      choices: (prev) => {
        const frameworks =
          COMPATIBILITY_MATRIX[prev as keyof typeof COMPATIBILITY_MATRIX]
            .frameworks;
        return frameworks.map((f) => ({
          title:
            f === 'react'
              ? 'React + Vite'
              : f === 'vue'
                ? 'Vue + Vite'
                : 'Plain TypeScript',
          value: f,
        }));
      },
    },
    {
      type: 'select',
      name: 'useCase',
      message: 'Choose use case:',
      choices: (prev, answers) => {
        const useCases =
          COMPATIBILITY_MATRIX[answers.sdk as keyof typeof COMPATIBILITY_MATRIX]
            .useCases;
        return useCases.map((uc) => ({
          title:
            uc === 'simple-upload'
              ? 'Simple Upload (Single file)'
              : uc === 'gallery'
                ? 'File Gallery (Multiple files)'
                : 'DeFi/NFT Metadata',
          value: uc,
        }));
      },
    },
    {
      type: 'confirm',
      name: 'analytics',
      message: 'Include Blockberry analytics?',
      initial: false,
    },
    {
      type: 'confirm',
      name: 'tailwind',
      message: 'Include Tailwind CSS?',
      initial: true,
    },
  ]);

  // Handle Ctrl+C
  if (!response.projectName) {
    console.log('\nOperation cancelled.');
    process.exit(0);
  }

  return response;
}
```

### Step 7: Context Builder (45 min)

9. Create `src/context.ts`:

```typescript
import path from 'node:path';
import { Context } from './types.js';
import { detectPackageManager } from './utils/detect-pm.js';

export function buildContext(
  args: Record<string, unknown>,
  promptResults: Record<string, unknown>
): Context {
  const merged = { ...promptResults, ...args }; // Args override prompts

  const projectName = merged.projectName as string;

  return {
    projectName,
    projectPath: path.resolve(process.cwd(), projectName),
    sdk: merged.sdk as Context['sdk'],
    framework: merged.framework as Context['framework'],
    useCase: merged.useCase as Context['useCase'],
    analytics: Boolean(merged.analytics),
    tailwind: Boolean(merged.tailwind),
    packageManager: detectPackageManager(),
  };
}
```

### Step 8: Main Entry Point (1 hour)

10. Update `src/index.ts`:

```typescript
#!/usr/bin/env node

import { program } from 'commander';
import { runPrompts } from './prompts.js';
import { buildContext } from './context.js';
import { validateContext } from './validator.js';
import { logger } from './utils/logger.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf-8')
);

program
  .name('create-walrus-app')
  .description('Interactive CLI for scaffolding Walrus applications')
  .version(packageJson.version)
  .argument('[project-name]', 'Project directory name')
  .option('--sdk <sdk>', 'SDK to use (mysten)')
  .option('--framework <framework>', 'Framework (react | vue | plain-ts)')
  .option(
    '--use-case <use-case>',
    'Use case (simple-upload | gallery)'
  )
  .option('--analytics', 'Include Blockberry analytics', false)
  .option('--no-tailwind', 'Exclude Tailwind CSS')
  .action(async (projectNameArg, options) => {
    try {
      logger.info('🚀 Welcome to Walrus Starter Kit!');

      // Build initial context from args
      const initialContext = {
        projectName: projectNameArg,
        ...options,
      };

      // Run interactive prompts (skips questions with provided args)
      const promptResults = await runPrompts(initialContext);

      // Build final context
      const context = buildContext(options, promptResults);

      // Validate compatibility
      const validation = validateContext(context);
      if (!validation.valid) {
        logger.error(validation.error!);
        if (validation.suggestion) {
          logger.info(`💡 ${validation.suggestion}`);
        }
        process.exit(1);
      }

      logger.success('✓ Configuration valid!');
      console.log('\nContext:', context);

      // TODO: Phase 7 - Generate template
      logger.info('🏗️  Template generation coming in Phase 7!');
    } catch (error) {
      logger.error(`Failed to create project: ${error}`);
      process.exit(1);
    }
  });

// Handle cleanup on abort
process.on('SIGINT', () => {
  logger.warn('\n\nOperation cancelled by user.');
  // TODO: Clean up partial state
  process.exit(0);
});

program.parse();
```

## Todo List

- [ ] Add commander, prompts, kleur dependencies
- [ ] Create `types.ts` with interfaces
- [ ] Create `matrix.ts` with compatibility data
- [ ] Create `validator.ts` with validation logic
- [ ] Create `utils/detect-pm.ts`
- [ ] Create `utils/logger.ts`
- [ ] Create `prompts.ts` with 6-step wizard
- [ ] Create `context.ts` with builder function
- [ ] Update `index.ts` with full CLI flow
- [ ] Add abort handler (SIGINT)
- [ ] Test interactive mode
- [ ] Test CLI flag mode
- [ ] Test validation errors
- [ ] Test package manager detection

## Success Criteria

### Functional Tests

- [ ] Interactive mode completes all 6 prompts
- [ ] CLI flags skip corresponding prompts
- [ ] Invalid combinations show clear errors
- [ ] Ctrl+C exits gracefully
- [ ] Package manager detected correctly
- [ ] Project name validation works

### Integration Tests

```bash
# Interactive mode
create-walrus-app

# Non-interactive mode
create-walrus-app my-app --sdk mysten --framework react --use-case simple-upload

# Partial flags (interactive for rest)
create-walrus-app my-app --sdk mysten

# Invalid combination
create-walrus-app test --sdk hibernuts --framework vue --use-case defi-nft
# Should error: hibernuts doesn't support vue
```

### Code Quality

- [ ] TypeScript strict mode passes
- [ ] ESLint passes
- [ ] All imports use `.js` extension (ESM)
- [ ] Prompts handle Ctrl+C gracefully

## Risk Assessment

### Potential Blockers

1. **Prompt dependency issues**: `prompts` doesn't work on certain terminals
   - **Mitigation**: Fall back to CLI-only mode, clear docs
2. **Cross-platform paths**: Windows vs Unix path handling
   - **Mitigation**: Use `node:path` everywhere
3. **Package manager detection fails**: Edge case environments
   - **Mitigation**: Default to `npm`, allow override flag

### Contingency Plans

- If prompts fail: Provide clear CLI flag examples
- If validation is too strict: Add `--force` flag (warn only)

## Security Considerations

### Phase-Specific Concerns

1. **Project name injection**: Malicious project names
   - **Hardening**: Strict regex validation
2. **Path traversal**: `../../../etc/passwd` as project name
   - **Hardening**: Reject `..` and absolute paths
3. **Command injection**: Project name used in shell commands
   - **Hardening**: Use programmatic APIs, not shell exec

### Hardening Measures

```typescript
export function validateProjectName(name: string): boolean | string {
  // Prevent path traversal
  if (name.includes('..') || name.includes('/') || name.includes('\\')) {
    return 'Project name cannot contain path separators';
  }

  // Prevent absolute paths
  if (path.isAbsolute(name)) {
    return 'Project name cannot be an absolute path';
  }

  // npm naming rules
  if (!/^[a-z0-9-]+$/.test(name)) {
    return 'Project name must contain only lowercase letters, numbers, and hyphens';
  }

  return true;
}
```

## Next Steps

After Phase 2 completion:

1. **Phase 3**: Create Template Base Layer (adapter interface)
2. **Phase 4-6**: Build template layers (SDK, framework, use cases)
3. **Phase 7**: Implement template generation engine (consumes this context)

### Dependencies for Next Phase

Phase 3 requires:

- Context object structure ✅
- SDK compatibility matrix ✅
- Framework choices ✅

### Open Questions

- Should we support yarn PnP? (Decision: No for MVP, too complex)
- Add telemetry for usage analytics? (Decision: No for MVP, privacy first)
- Support custom template URLs? (Decision: Future feature)
