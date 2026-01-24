# Phase 05: Documentation & Testing

**Priority:** P2
**Effort:** 2h
**Status:** pending

## Context Links

- [CLI Scaffolding Best Practices](../reports/researcher-260118-1255-cli-scaffolding-best-practices.md) - Testing recommendations
- All previous phase files - Changes require documentation

## Overview

Update documentation to reflect security improvements, add snapshot tests for preset validation, document security model, and create comprehensive testing guide.

## Key Insights

**Documentation Gaps:**
- Security model not documented (trusted vs untrusted presets)
- New features need user-facing docs (--verbose, etc.)
- Testing guide missing (how to add new presets)

**Testing Gaps:**
- No snapshot tests for generated projects
- No regression tests for package.json merging
- Missing test documentation

**Security Documentation:**
- Threat model not explicit
- Input validation approach unclear to contributors

## Requirements

### Functional
- Update README with new CLI flags
- Document security model and threat boundaries
- Add snapshot tests for all presets
- Create testing guide for contributors
- Update CHANGELOG with all improvements

### Non-Functional
- Documentation clear for non-technical users
- Snapshot tests don't slow down CI (<2 minutes)
- Security docs explain "why" not just "what"

## Architecture

**Component:** Snapshot Tests

**Pattern:** Vitest snapshots for generated file structure:
```typescript
it('generates correct structure', async () => {
  const result = await generateProject(context);
  const files = await getFileTree(projectPath);
  expect(files).toMatchSnapshot();
});
```

**Component:** Documentation Structure

```
README.md
├── Installation
├── Quick Start
├── CLI Flags (NEW: --verbose)
├── Security (NEW section)
└── Contributing

docs/
├── SECURITY.md (NEW)
├── TESTING.md (NEW)
└── ARCHITECTURE.md (update)
```

## Related Code Files

**To Create:**
- `docs/SECURITY.md` (security model)
- `docs/TESTING.md` (testing guide)
- `packages/cli/__tests__/snapshots/*.snap` (snapshot files)

**To Modify:**
- `README.md` (add --verbose, security section)
- `CHANGELOG.md` (document all phases)
- `docs/ARCHITECTURE.md` (update with new components)
- `packages/cli/package.json` (update description)

## Implementation Steps

### Step 1: Update README with New Features

**File:** `README.md`

Add CLI flags section:

```markdown
## CLI Flags

| Flag | Description | Example |
|------|-------------|---------|
| `--sdk` | SDK to use | `--sdk mysten` |
| `--framework` | Framework to use | `--framework react` |
| `--use-case` | Use case preset | `--use-case simple-upload` |
| `--package-manager` | Package manager (npm, pnpm, yarn, bun) | `--package-manager pnpm` |
| `--skip-install` | Skip dependency installation | `--skip-install` |
| `--verbose` | Enable debug logging | `--verbose` |

## Security

This CLI follows security best practices:

- **Path Traversal Protection:** Project names are validated to prevent directory traversal attacks
- **Command Injection Prevention:** All subprocess calls use safe argument arrays (no shell expansion)
- **Secrets Management:** .gitignore automatically added to prevent accidental commit of .env files
- **Dependency Security:** Regular audits with `pnpm audit`, zero known vulnerabilities

For security concerns, see [SECURITY.md](docs/SECURITY.md).
```

### Step 2: Create Security Documentation

**File:** `docs/SECURITY.md` (new)

```markdown
# Security Policy

## Threat Model

### Trusted Components
- Built-in presets in `packages/cli/presets/` (maintained by Mysten Labs)
- CLI code and dependencies (audited regularly)

### Untrusted Inputs
- Project name from user input (validated with strict regex)
- Package manager detection (validated for availability)

### Out of Scope
- Third-party/community presets (not yet supported)
- Runtime security of generated applications (user responsibility)

## Security Controls

### 1. Path Traversal Prevention

**File:** `src/validator.ts:29-60`

All project names validated to prevent directory traversal:

```typescript
// Blocks: ../../../etc/passwd, /tmp/malicious, my-app/../config
if (name.includes('..') || name.includes('/') || name.includes('\\')) {
  return 'Project name cannot contain path separators';
}

if (path.isAbsolute(name)) {
  return 'Project name cannot be an absolute path';
}
```

### 2. Command Injection Prevention

**File:** `src/post-install/walrus-deploy.ts:65`

Subprocess calls use argument arrays (no shell expansion):

```typescript
// SAFE: Arguments passed as array, shell: false (default)
spawn('bash', [scriptPath, projectPath], { cwd: projectPath });

// UNSAFE (never used):
// spawn(`bash ${scriptPath} ${projectPath}`, { shell: true });  ❌
```

### 3. Secrets Management

**File:** `.gitignore` (in all presets)

Automatically excludes sensitive files:
- `.env`, `.env.local`, `.env.*.local`
- `.walrus/` (local config)
- API keys, credentials

### 4. Dependency Security

**Process:**
1. `pnpm audit` runs on every CI build
2. Dependabot alerts enabled
3. Caret ranges (`^11.1.0`) for automatic patch updates
4. Lockfile committed for reproducible builds

## Reporting Vulnerabilities

**DO NOT** open public issues for security vulnerabilities.

Email: security@mystenlabs.com

Include:
- Description of vulnerability
- Steps to reproduce
- Impact assessment
- Suggested fix (optional)

Response time: 48 hours for initial acknowledgment

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-18 | 1.1.0 | Added command injection prevention, .gitignore |
| 2025-12-01 | 1.0.0 | Initial release with path validation |
```

### Step 3: Create Testing Guide

**File:** `docs/TESTING.md` (new)

```markdown
# Testing Guide

## Test Structure

```
packages/cli/__tests__/
├── unit/               # Unit tests (11 files)
│   ├── validator.test.ts
│   ├── detect-pm.test.ts
│   └── ...
├── e2e/                # End-to-end tests
│   ├── cli.e2e.test.mjs
│   ├── presets.e2e.test.mjs
│   └── cli-flags.e2e.test.mjs
└── snapshots/          # Snapshot files
    └── presets.e2e.test.mjs.snap
```

## Running Tests

```bash
# All tests
pnpm test

# Unit tests only
pnpm test:unit

# E2E tests only
pnpm test:e2e

# Watch mode
pnpm test --watch

# Coverage
pnpm test:coverage
```

## Writing Tests

### Unit Tests

Use Vitest with TypeScript:

```typescript
import { describe, it, expect } from 'vitest';
import { validateProjectName } from '../src/validator';

describe('validateProjectName', () => {
  it('accepts valid names', () => {
    expect(validateProjectName('my-app')).toBeUndefined();
  });

  it('rejects path traversal', () => {
    expect(validateProjectName('../etc')).toBe(
      'Project name cannot contain path separators'
    );
  });
});
```

### E2E Tests

Test full project generation:

```javascript
import { execSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';

it('generates react-mysten-simple-upload', () => {
  const projectName = 'test-react-simple';

  execSync(
    `node dist/index.js ${projectName} --sdk mysten --framework react --use-case simple-upload --skip-install`,
    { stdio: 'inherit' }
  );

  expect(existsSync(`${projectName}/package.json`)).toBe(true);
  expect(existsSync(`${projectName}/.gitignore`)).toBe(true);

  // Cleanup
  rmSync(projectName, { recursive: true });
});
```

### Snapshot Tests

Verify generated file structure:

```typescript
it('matches preset snapshot', async () => {
  const files = await getFileTree(projectPath);
  expect(files).toMatchSnapshot();
});
```

Update snapshots: `pnpm test -- -u`

## Adding New Presets

1. Create preset directory: `packages/cli/presets/framework-sdk-usecase/`
2. Add .gitignore, package.json, src/
3. Add E2E test in `__tests__/e2e/presets.e2e.test.mjs`
4. Update COMPATIBILITY_MATRIX in `src/matrix.ts`
5. Run tests, verify snapshot
6. Update README with new preset

## CI/CD

GitHub Actions runs:
- Unit tests (required)
- E2E tests (required)
- Type checking (required)
- pnpm audit (warning only)

All must pass before merge.
```

### Step 4: Add Snapshot Tests

**File:** `packages/cli/__tests__/e2e/snapshots.e2e.test.mjs` (new)

```javascript
import { execSync } from 'node:child_process';
import { readdirSync, statSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect, afterEach } from 'vitest';

function getFileTree(dir, prefix = '') {
  const entries = readdirSync(dir);
  const tree = [];

  for (const entry of entries) {
    if (entry === 'node_modules' || entry === '.git') continue;

    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      tree.push(`${prefix}${entry}/`);
      tree.push(...getFileTree(fullPath, `${prefix}  `));
    } else {
      tree.push(`${prefix}${entry}`);
    }
  }

  return tree.sort();
}

describe('Snapshot Tests', () => {
  const testProjects = [];

  afterEach(() => {
    testProjects.forEach(dir => rmSync(dir, { recursive: true, force: true }));
    testProjects.length = 0;
  });

  it('react-mysten-simple-upload structure', () => {
    const projectName = 'test-react-simple-snapshot';
    testProjects.push(projectName);

    execSync(
      `node dist/index.js ${projectName} --sdk mysten --framework react --use-case simple-upload --skip-install`,
      { stdio: 'ignore' }
    );

    const tree = getFileTree(projectName);
    expect(tree).toMatchSnapshot();
  });

  it('vue-mysten-simple-upload structure', () => {
    const projectName = 'test-vue-simple-snapshot';
    testProjects.push(projectName);

    execSync(
      `node dist/index.js ${projectName} --sdk mysten --framework vue --use-case simple-upload --skip-install`,
      { stdio: 'ignore' }
    );

    const tree = getFileTree(projectName);
    expect(tree).toMatchSnapshot();
  });
});
```

### Step 5: Update CHANGELOG

**File:** `CHANGELOG.md`

```markdown
# Changelog

## [1.1.0] - 2026-01-18

### Security
- **CRITICAL:** Fixed command injection vulnerability in walrus-deploy.ts (removed shell: true)
- **CRITICAL:** Added path traversal protection for script execution
- **HIGH:** Added .gitignore to all template presets to prevent secrets exposure
- Added security documentation (docs/SECURITY.md)

### Features
- Added `--verbose` flag for debug logging
- Implemented progress indicators for file operations (spinners)
- Added package manager validation (checks if PM is installed)
- Implemented lockfile detection for PM selection
- Added file size limits (50MB) to prevent DoS
- Custom error types with error codes
- Symlink detection and skipping

### Improvements
- Expanded E2E test coverage from 1 to 10+ tests
- Added snapshot tests for preset structure validation
- Parallelized file operations (50-100% faster)
- Context-aware template escaping (JSON/HTML)
- Package manager version validation with warnings

### Documentation
- Added SECURITY.md with threat model
- Added TESTING.md with contributor guide
- Updated README with CLI flags and security section
- Improved error messages (relative paths)

### Removed
- Deprecated git.ts file (git init no longer supported)

### Fixed
- Hardcoded GitHub URL updated to correct repo
- Chmod errors properly handled on Windows
- Error message sanitization (no internal path leaks)

## [1.0.0] - 2025-12-01

Initial release
```

### Step 6: Update Architecture Docs

**File:** `docs/ARCHITECTURE.md`

Add sections for:
- Progress indicator system (spinner.ts)
- Custom error types (errors.ts)
- PM detection flow (with lockfile priority)
- Security controls diagram

## Todo List

- [ ] Update README with --verbose flag
- [ ] Add Security section to README
- [ ] Create docs/SECURITY.md
- [ ] Create docs/TESTING.md
- [ ] Add snapshot tests (2+ presets)
- [ ] Update CHANGELOG.md
- [ ] Update docs/ARCHITECTURE.md
- [ ] Verify all links in documentation work
- [ ] Run documentation linter (markdownlint)
- [ ] Review docs for clarity and completeness

## Success Criteria

- ✅ README includes all new CLI flags
- ✅ SECURITY.md documents threat model and controls
- ✅ TESTING.md provides clear contributor guide
- ✅ Snapshot tests pass for all presets
- ✅ CHANGELOG lists all changes from Phases 01-05
- ✅ Documentation reviewed and approved
- ✅ All tests pass (unit + E2E + snapshots)

## Risk Assessment

**Risks:**
- **Low:** Documentation becomes outdated as code evolves
- **Low:** Snapshot tests fragile (break on minor changes)

**Mitigations:**
- Add docs review to PR checklist
- Update snapshots in CI with `pnpm test -- -u` when intentional
- Link docs to specific file:line references for accuracy

## Next Steps

1. Create all documentation files
2. Add snapshot tests
3. Update CHANGELOG
4. Review all docs for accuracy
5. Run full test suite (115+ tests)
6. Commit: "docs: comprehensive security and testing documentation"
7. Plan complete - ready for implementation!
