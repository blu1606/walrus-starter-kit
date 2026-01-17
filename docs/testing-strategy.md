# Testing Strategy

## Overview

Walrus Starter Kit uses **Vitest** as the primary testing framework with comprehensive coverage across CLI logic, template generation, and validation. Current coverage: **91/91 tests passing** (97.5%).

## Test Categories

### Unit Tests (10 files, co-located with source)

Tests for individual functions/classes in isolation:

| File                                                 | Purpose                                   | LOC       |
| ---------------------------------------------------- | ----------------------------------------- | --------- |
| `packages/cli/src/generator/merge.test.ts`           | Template merge logic (deepMerge function) | 92        |
| `packages/cli/src/generator/index.test.ts`           | Full generator integration with file I/O  | 171       |
| `packages/cli/src/generator/layers.test.ts`          | Template layer resolution and priority    | 109       |
| `packages/cli/src/generator/transform.test.ts`       | Template variable transformations         | ~80       |
| `packages/cli/src/validator.test.ts`                 | Input validation (names, contexts)        | 116       |
| `packages/cli/src/utils/detect-pm.test.ts`           | Package manager detection                 | ~60       |
| `packages/cli/src/matrix.test.ts`                    | SDK/framework compatibility matrix        | ~70       |
| `packages/cli/src/types.test.ts`                     | Type validation                           | ~50       |
| `packages/cli/src/context.test.ts`                   | Context building from args/prompts        | ~77       |
| `packages/cli/src/post-install/post-install.test.ts` | Post-install & validation logic           | ~200      |
| **Total**                                            |                                           | **~1025** |

### Integration Tests (3 files, package root)

End-to-end CLI behavior validation:

| File                                | Purpose                                         | Type        |
| ----------------------------------- | ----------------------------------------------- | ----------- |
| `packages/cli/test-integration.mjs` | CLI flag combinations, non-interactive mode     | Integration |
| `packages/cli/test-validation.mjs`  | Manual validation test suite                    | Manual      |
| `packages/cli/test-manual.js`       | Core validation functions, compatibility matrix | Manual      |

### Utility Scripts (1 file)

| File                            | Purpose                                    |
| ------------------------------- | ------------------------------------------ |
| `packages/cli/src/test-base.ts` | Base template structure validation utility |

### Automated Template Validation (New)

| File                                     | Purpose                                               | Type      |
| ---------------------------------------- | ----------------------------------------------------- | --------- |
| `packages/cli/scripts/test-templates.sh` | Matrix testing for all SDK/Framework/UseCase combos   | Automated |
| `packages/cli/scripts/test-results.md`   | Detailed logs of template generation and compilation  | Report    |

## Current Organization Pattern

**Strategy:** Mixed co-located + centralized integration tests

```
walrus-starter-kit/
├── packages/cli/
│   ├── src/
│   │   ├── generator/
│   │   │   ├── merge.ts
│   │   │   ├── merge.test.ts ✓ (co-located)
│   │   │   ├── index.ts
│   │   │   ├── index.test.ts ✓ (co-located)
│   │   │   ├── layers.ts
│   │   │   ├── layers.test.ts ✓ (co-located)
│   │   │   └── transform.test.ts ✓
│   │   ├── validator.ts
│   │   ├── validator.test.ts ✓ (co-located)
│   │   ├── context.ts
│   │   ├── context.test.ts ✓
│   │   ├── types.test.ts ✓
│   │   ├── matrix.test.ts ✓
│   │   ├── post-install/
│   │   │   ├── git.ts
│   │   │   ├── index.ts
│   │   │   ├── package-manager.ts
│   │   │   ├── validator.ts
│   │   │   └── post-install.test.ts ✓ (co-located)
│   │   └── utils/
│   │       ├── detect-pm.ts
│   │       └── detect-pm.test.ts ✓ (co-located)
│   ├── test-integration.mjs ✓ (root-level integration)
│   ├── test-validation.mjs ✓
│   ├── test-manual.js ✓
│   ├── vitest.config.ts
│   └── package.json
└── templates/
    └── sdk-mysten/
        └── test/
            └── adapter.test.ts ✓ (centralized for templates)
```

## Test Framework Configuration

### Vitest Config (`packages/cli/vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/*.spec.js',
      '**/*.test.js',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'dist/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        'node_modules/**',
        'vitest.config.ts',
      ],
    },
  },
});
```

**Key features:**

- Globals enabled (`describe`, `it`, `expect` without imports)
- Node environment
- V8 coverage provider
- Multiple coverage formats (text, JSON, HTML)
- Excludes build artifacts and test files from coverage

## Running Tests

### Package-level (from `packages/cli/`)

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# UI mode (browser-based)
pnpm test:ui

# Coverage report
pnpm test:coverage
```

### Root-level (from repository root)

```bash
# Run all tests across packages
pnpm test

# Run specific package tests
pnpm --filter create-walrus-app test
```

### Manual/Integration Tests

```bash
# Integration tests (CLI flag combinations)
node packages/cli/test-integration.mjs

# Validation tests
node packages/cli/test-validation.mjs

# Manual test suite
node packages/cli/test-manual.js
```

## Best Practices from Research

### 1. Co-location Strategy (Recommended for Unit Tests)

**Advantages:**

- Ease of navigation (test file is always `*.test.ts` next to source)
- Shorter imports (relative paths `./module` instead of `../../src/module`)
- Easier maintenance (update source + test together)
- No decision fatigue (naming/location is automatic)
- Natural discoverability

**Our implementation:** ✅ Already using for unit tests in `src/`

### 2. Centralized Integration Tests (Recommended)

**Rationale:**

- Integration tests span multiple modules
- Don't belong to a single source file
- Need special setup/teardown (CLI execution, file I/O)
- Easier to run separately for CI optimization

**Our implementation:** ✅ Already using (`test-*.mjs` at package root)

### 3. Monorepo Testing Patterns

From Vitest docs and industry practices:

- **Shared test utilities:** Place in `packages/cli/src/__tests__/helpers/` (if needed)
- **Template tests:** Keep separate in `templates/{template}/test/` for isolation
- **Cross-package tests:** Avoid; test at package boundaries via exports

### 4. Test Naming Conventions

**Current standard (maintain):**

- Unit tests: `*.test.ts` (TypeScript)
- Integration tests: `test-*.mjs` (ES modules for Node execution)
- Manual tests: `test-*.js` (plain JS for compatibility)

### 5. Test Organization Within Files

**Pattern observed in codebase:**

```typescript
describe('FunctionName', () => {
  it('should handle normal case', () => {
    /* ... */
  });
  it('should handle edge case', () => {
    /* ... */
  });
  it('should throw on invalid input', () => {
    /* ... */
  });
});
```

**Best practices:**

- Group related tests in `describe` blocks
- Use clear, descriptive test names ("should...")
- Test happy path + edge cases + error conditions
- Use `beforeEach`/`afterEach` for setup/teardown (see `index.test.ts`)

## Test Coverage Targets

**Current:** 97.5% (91/91 tests passing)

**Recommended targets:**

- Unit tests: 80%+ coverage for core logic
- Integration tests: All critical user flows
- Template tests: Interface compliance for all SDK adapters

**Excluded from coverage:**

- Build artifacts (`dist/**`)
- Test files themselves
- Configuration files
- Node modules

## Testing CLI Applications

### Strategies Used in This Project

1. **Non-interactive mode testing** (`test-integration.mjs`):
   - Pipe input via `echo "" |`
   - Pass flags explicitly (`--sdk mysten --framework react`)
   - Capture stdout/stderr for assertion

2. **Dry-run mode** (`generator/index.test.ts`):
   - Tests logic without filesystem side effects
   - Validates output without creating files

3. **Temporary output directories** (`generator/index.test.ts`):
   - Create test output in `test-output/`
   - Clean up in `beforeEach`/`afterEach`

4. **Environment variable mocking**:
   ```typescript
   const originalAgent = process.env.npm_config_user_agent;
   process.env.npm_config_user_agent = 'pnpm/8.0.0';
   // ... run test ...
   process.env.npm_config_user_agent = originalAgent;
   ```

## Migration Recommendations

### Current State: ✅ Well-organized

**No major restructuring needed.** Current organization follows best practices:

- Co-located unit tests for maintainability
- Centralized integration tests for clarity
- Clear separation of concerns

### Minor Improvements (Optional)

1. **Consolidate manual test scripts:**

   ```
   packages/cli/
   ├── src/
   ├── tests/              # New centralized test directory
   │   ├── integration/
   │   │   ├── cli-flags.test.mjs
   │   │   └── validation.test.mjs
   │   └── manual/
   │       └── compatibility-matrix.test.js
   └── vitest.config.ts
   ```

2. **Add shared test utilities:**

   ```
   packages/cli/src/__tests__/
   ├── helpers/
   │   ├── context-factory.ts
   │   ├── mock-fs.ts
   │   └── cli-runner.ts
   ```

3. **Template test standardization:**
   - Ensure all SDK templates (`sdk-mysten`, `sdk-tusky`, `sdk-hibernuts`) have adapter tests
   - Create shared test suite in `templates/__tests__/adapter-compliance.test.ts`

## CI/CD Integration

### Recommended GitHub Actions Workflow

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: pnpm

      - run: pnpm install
      - run: pnpm test # Unit tests (fast)
      - run: pnpm test:coverage # Coverage report

      # Integration tests (can run in parallel job)
      - run: node packages/cli/test-integration.mjs
      - run: node packages/cli/test-validation.mjs
```

### Optimization Strategies

1. **Parallel execution:** Vitest runs tests in parallel by default
2. **Selective testing:** Only test changed packages in monorepo
3. **Cache coverage reports:** Upload to Codecov/Coveralls
4. **Separate integration tests:** Run in different CI job to parallelize

## Writing New Tests

### Unit Test Template

```typescript
import { describe, it, expect } from 'vitest';
import { functionToTest } from './module.js';

describe('functionToTest', () => {
  it('should handle normal case', () => {
    const result = functionToTest('input');
    expect(result).toBe('expected');
  });

  it('should throw on invalid input', () => {
    expect(() => functionToTest(null)).toThrow('Error message');
  });
});
```

### Integration Test Template

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'node:path';

describe('feature integration', () => {
  const testDir = path.join(__dirname, 'test-output');

  beforeEach(async () => {
    await fs.remove(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it('should complete full workflow', async () => {
    // Test implementation
  });
});
```

## Debugging Tests

### VS Code Configuration

Add to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Vitest Tests",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["test:watch"],
      "console": "integratedTerminal"
    }
  ]
}
```

### Vitest UI Mode

```bash
pnpm test:ui
```

Opens browser-based test runner with:

- Visual test tree
- Real-time watch mode
- Coverage visualization
- Test re-run on save

## Common Testing Patterns

### 1. Context Factory Pattern

```typescript
const createContext = (overrides: Partial<Context> = {}): Context => ({
  projectName: 'test-app',
  projectPath: '/path/to/test-app',
  sdk: 'mysten',
  framework: 'react',
  useCase: 'simple-upload',
  analytics: false,
  tailwind: true,
  packageManager: 'pnpm',
  ...overrides,
});
```

Used in: `validator.test.ts`, `test-manual.js`

### 2. File System Isolation

```typescript
beforeEach(async () => {
  await fs.remove(testOutputDir);
});

afterEach(async () => {
  await fs.remove(testOutputDir);
});
```

Used in: `generator/index.test.ts`

### 3. Environment Mocking

```typescript
const originalAgent = process.env.npm_config_user_agent;
process.env.npm_config_user_agent = 'pnpm/8.0.0';
try {
  // Test with mocked env
} finally {
  process.env.npm_config_user_agent = originalAgent;
}
```

Used in: `test-validation.mjs`, `test-manual.js`

## Resources

### Documentation

- [Vitest Documentation](https://vitest.dev/)
- [Vitest Monorepo Guide](https://vitest.dev/guide/projects)
- [Testing Node.js Applications](https://nodejs.org/en/docs/guides/testing/)

### Tools

- **Vitest**: Test runner and coverage
- **fs-extra**: File system testing utilities
- **tsx**: TypeScript execution for tests

### Further Reading

- [Co-locating Unit Tests](https://www.yockyard.com/post/co-locate-unit-tests/)
- [Testing Strategies for Monorepos](https://graphite.dev/guides/testing-strategies-for-monorepos)
- [Tao of Node - Testing](https://alexkondov.com/tao-of-node/)

## Unresolved Questions

- Should we migrate manual test scripts (`test-*.mjs/js`) to Vitest format?
- Do we need shared test utilities across packages?
- Should template tests use a shared compliance suite?
- CI/CD configuration: separate jobs for unit vs integration tests?
