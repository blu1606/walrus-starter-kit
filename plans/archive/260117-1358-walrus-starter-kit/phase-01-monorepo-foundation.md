---
title: Phase 1 - Monorepo Foundation
description: Setup pnpm workspace, root configs, directory structure
status: completed
priority: High
effort: 4h
branch: main
tags: [monorepo, pnpm, typescript, eslint, prettier]
created: 2026-01-17
---

# Phase 1: Monorepo Foundation

## Context Links

- [Main Plan](./plan.md)
- [PRD](../../POC/PRD.md)
- [pnpm Monorepo Research](../reports/researcher-260117-1353-pnpm-monorepo.md)

## Overview

**Created:** 2026-01-17
**Priority:** High
**Status:** DONE
**Completed:** 2026-01-17
**Estimated Effort:** 4 hours
**Dependencies:** None (foundational)

## Key Insights

### From Research

1. **Templates are Data, Not Packages**: Exclude templates from workspace to prevent pnpm linking issues
2. **Strict Separation**: Tooling (`packages/cli`) vs Assets (`templates/`)
3. **Test Generated Output**: Lint the output, not template source
4. **Single Publish Point**: CLI package includes templates in distribution

### Critical Pattern

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  # Templates excluded - they're static assets
```

## Requirements

### Functional

- pnpm workspace with proper package isolation
- Root-level shared tooling (TypeScript, ESLint, Prettier)
- Git ignore patterns for generated files
- npm publish-ready structure

### Technical

- Node.js 18+ enforcement via `engines`
- pnpm 9+ requirement
- TypeScript 5.3+ with strict mode
- ESM-first architecture

### Dependencies

None (this is the foundation)

## Architecture

### Directory Structure

```
walrus-starter-kit/
├── .github/
│   └── workflows/
│       ├── ci.yml              # Lint + test
│       └── publish.yml         # npm publish automation
├── packages/
│   └── cli/                    # The scaffolder
│       ├── src/
│       │   └── index.ts        # Entry point (stub)
│       ├── package.json        # CLI package config
│       └── tsconfig.json       # CLI-specific TS config
├── templates/                  # Static assets (excluded from workspace)
│   └── .gitkeep                # Placeholder
├── examples/                   # Test output (included in workspace)
│   └── .gitkeep                # Placeholder
├── .gitignore
├── .npmrc                      # pnpm config
├── .prettierrc.json
├── .eslintrc.json
├── package.json                # Root package
├── pnpm-workspace.yaml
├── tsconfig.json               # Base TS config
└── README.md
```

### Root package.json Schema

```json
{
  "name": "walrus-starter-kit",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=9.0.0"
  },
  "scripts": {
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "lint": "eslint . --ext .ts,.tsx",
    "format": "prettier --write \"**/*.{ts,tsx,json,md}\""
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "eslint": "^8.56.0",
    "@typescript-eslint/parser": "^6.19.0",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "prettier": "^3.2.0"
  }
}
```

### CLI package.json Schema

```json
{
  "name": "create-walrus-app",
  "version": "0.1.0",
  "description": "Interactive CLI for scaffolding Walrus applications",
  "type": "module",
  "bin": {
    "create-walrus-app": "./dist/index.js"
  },
  "files": ["dist", "templates"],
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "echo \"Test placeholder\""
  },
  "keywords": ["walrus", "sui", "scaffold", "cli", "template"],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "commander": "^11.1.0",
    "prompts": "^2.4.2",
    "kleur": "^4.1.5",
    "fs-extra": "^11.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/prompts": "^2.4.9",
    "@types/fs-extra": "^11.0.4",
    "typescript": "^5.3.0"
  }
}
```

## Related Code Files

### To Create

1. `pnpm-workspace.yaml` - Workspace definition
2. `package.json` - Root package
3. `.gitignore` - Git exclusions
4. `.npmrc` - pnpm configuration
5. `tsconfig.json` - Base TypeScript config
6. `.prettierrc.json` - Code formatting
7. `.eslintrc.json` - Linting rules
8. `packages/cli/package.json` - CLI package
9. `packages/cli/tsconfig.json` - CLI TS config
10. `packages/cli/src/index.ts` - Entry stub
11. `README.md` - Project documentation

## Implementation Steps

### Step 1: Initialize pnpm Workspace (30 min)

1. Create root directory structure:

```bash
mkdir -p walrus-starter-kit/{packages/cli/src,templates,examples,.github/workflows}
cd walrus-starter-kit
```

2. Create `pnpm-workspace.yaml`:

```yaml
packages:
  - 'packages/*'
  - 'examples/*'
  # Templates excluded - static assets only
```

3. Create `.npmrc`:

```
shamefully-hoist=true
strict-peer-dependencies=false
```

### Step 2: Root Configuration (45 min)

4. Create root `package.json` (use schema above)

5. Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "outDir": "./dist"
  },
  "exclude": ["node_modules", "dist", "templates"]
}
```

6. Create `.prettierrc.json`:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

7. Create `.eslintrc.json`:

```json
{
  "parser": "@typescript-eslint/parser",
  "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  "plugins": ["@typescript-eslint"],
  "env": {
    "node": true,
    "es2022": true
  },
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-function-return-type": "off"
  }
}
```

### Step 3: CLI Package Setup (1 hour)

8. Create `packages/cli/package.json` (use schema above)

9. Create `packages/cli/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

10. Create `packages/cli/src/index.ts`:

```typescript
#!/usr/bin/env node

console.log('🚀 Walrus Starter Kit - Coming Soon!');
process.exit(0);
```

### Step 4: Git Configuration (30 min)

11. Create `.gitignore`:

```
# Dependencies
node_modules/
.pnpm-debug.log

# Build outputs
dist/
*.tsbuildinfo

# Environment
.env
.env.local

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Test outputs
examples/test-*
```

12. Initialize git:

```bash
git init
git add .
git commit -m "chore: initialize monorepo foundation"
```

### Step 5: Dependency Installation (30 min)

13. Install root dependencies:

```bash
pnpm install
```

14. Install CLI dependencies:

```bash
cd packages/cli
pnpm install
cd ../..
```

### Step 6: Build Validation (45 min)

15. Test TypeScript compilation:

```bash
cd packages/cli
pnpm build
```

16. Verify executable:

```bash
chmod +x dist/index.js
node dist/index.js
# Should output: 🚀 Walrus Starter Kit - Coming Soon!
```

17. Test local linking:

```bash
pnpm link --global
create-walrus-app
# Should output: 🚀 Walrus Starter Kit - Coming Soon!
```

## Todo List

- [ ] Create directory structure
- [ ] Write `pnpm-workspace.yaml`
- [ ] Write `.npmrc`
- [ ] Write root `package.json`
- [ ] Write `tsconfig.json`
- [ ] Write `.prettierrc.json`
- [ ] Write `.eslintrc.json`
- [ ] Write `packages/cli/package.json`
- [ ] Write `packages/cli/tsconfig.json`
- [ ] Write `packages/cli/src/index.ts`
- [ ] Write `.gitignore`
- [ ] Initialize git repository
- [ ] Install root dependencies
- [ ] Install CLI dependencies
- [ ] Build CLI package
- [ ] Test CLI executable
- [ ] Verify global linking
- [ ] Create placeholder README.md

## Success Criteria

### Functional Tests

- [ ] `pnpm install` completes without errors
- [ ] `pnpm -r build` compiles CLI successfully
- [ ] `create-walrus-app` runs after global link
- [ ] TypeScript strict mode passes
- [ ] ESLint passes on all `.ts` files
- [ ] Prettier check passes

### Structure Validation

- [ ] Templates excluded from workspace packages
- [ ] CLI package has correct `bin` entry
- [ ] `files` array includes `templates` for publish
- [ ] Node/pnpm versions enforced

### Documentation

- [ ] README explains monorepo structure
- [ ] Package purposes documented

## Risk Assessment

### Potential Blockers

1. **pnpm version mismatch**: User has older pnpm
   - **Mitigation**: Clear error message + docs
2. **Template exclusion issues**: pnpm tries to link templates
   - **Mitigation**: Test workspace.yaml carefully
3. **Cross-platform path issues**: Windows vs Unix
   - **Mitigation**: Use `path.join()` everywhere

### Contingency Plans

- If pnpm workspace fails: Fall back to npm workspaces (less ideal)
- If linking breaks: Provide manual test script

## Security Considerations

### Phase-Specific Concerns

1. **Dependency Pinning**: Pin major versions for stability
2. **Engine Enforcement**: Prevent running on unsupported Node versions
3. **Git Secrets**: Ensure `.env` patterns in gitignore
4. **npm Publish**: Validate `files` array doesn't leak secrets

### Hardening Measures

- Use `engines.strict = true` in `.npmrc`
- Review all dependencies for known vulnerabilities
- Add `prepublishOnly` script to prevent accidental publish

## Next Steps

After Phase 1 completion:

1. **Phase 2**: Build CLI Engine Core (prompts + validation)
2. **Phase 3**: Create Template Base Layer (adapter interface)
3. **Parallel**: Start template development while CLI engine builds

### Dependencies for Next Phase

Phase 2 requires:

- Working CLI package build system ✅
- pnpm workspace for testing ✅
- TypeScript compilation ✅

### Open Questions

- Should we use Turborepo for caching? (Decision: No for MVP, monorepo is simple)
- Versioning strategy: Lock-step or independent? (Decision: Lock-step for MVP)
