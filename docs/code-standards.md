# Code Standards & Structure

This document outlines the coding standards and structural conventions for the Walrus Starter Kit.

## 1. General Principles

- **TypeScript First:** All code must be written in TypeScript with strict type checking.
- **ES Modules (ESM):** The project uses ESM (`"type": "module"`) throughout.
- **KISS/DRY:** Keep it simple, but avoid unnecessary repetition in template layers.
- **Functional Patterns:** Prefer functional components and hooks in React templates.

## 2. Directory Conventions

- `src/`: Source code.
- `dist/`: Compiled output (git ignored).
- `tests/`: Unit and integration tests.
- `templates/`: Static assets and code fragments for the generator.

## 3. CLI Standards (packages/cli)

### 3.1 Command Handling & User Input

- **Argument Parsing:** Use `commander.js` for robust CLI argument handling.
- **Interactive Prompts:** Use `prompts` for wizard-style user input with dynamic choices.
- **Hybrid Mode:** Support both interactive mode (no flags) and CI/CD mode (all flags provided).
- **Terminal Output:** Use `kleur` for colored console messages (lightweight, zero dependencies).
- **File Operations:** Use `fs-extra` for cross-platform filesystem operations.

### 3.2 Error Handling

- **Try-Catch:** Always wrap async operations in try-catch blocks.
- **User-Friendly Errors:** Provide actionable error messages without stack traces.
- **Validation Errors:** Include suggestions for valid alternatives.
- **Error Sanitization:** Sanitize error messages before displaying to users.

Example:
```typescript
try {
  // operation
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error occurred';
  logger.error(`Failed: ${message}`);
  process.exit(1);
}
```

### 3.3 Validation

- **Input Validation:** Validate project names, SDK choices, framework compatibility before processing.
- **Runtime Type Checking:** Add runtime validation in addition to TypeScript types.
- **Matrix-Based Validation:** Use compatibility matrix to enforce valid SDK/framework/use-case combinations.

### 3.4 Security

- **Path Traversal Prevention:** Reject project names containing `..`, `/`, or `\`.
- **Absolute Path Rejection:** Prevent absolute paths in project names.
- **NPM Naming Rules:** Enforce lowercase, alphanumeric, and hyphens only (no leading/trailing hyphens).
- **Length Limits:** Enforce 214-character limit for project names (npm package limit).

Example validation:
```typescript
export function validateProjectName(name: string): boolean | string {
  if (!name || name.trim().length === 0) {
    return 'Project name cannot be empty';
  }
  if (name.length > 214) {
    return 'Project name must be 214 characters or less';
  }
  if (name.includes('..') || name.includes('/') || name.includes('\\')) {
    return 'Project name cannot contain path separators';
  }
  if (path.isAbsolute(name)) {
    return 'Project name cannot be an absolute path';
  }
  if (!/^[a-z0-9-]+$/.test(name)) {
    return 'Project name must contain only lowercase letters, numbers, and hyphens';
  }
  if (name.startsWith('-') || name.endsWith('-')) {
    return 'Project name cannot start or end with a hyphen';
  }
  return true;
}
```

## 4. Template Standards (templates/)

- **Modular package.json:** Template layers should only contain the dependencies specific to that layer.
- **Adapter Pattern:** SDK layers must implement the storage adapter interface (e.g., `StorageAdapter`) defined in the base layer.
- **Environment Variables:** Use `VITE_` prefix (e.g., `VITE_WALRUS_NETWORK`) for variables intended for the frontend.
- **Consistency:** Use camelCase for file names in templates unless framework conventions dictate otherwise (e.g., PascalCase for React components).

## 5. Formatting & Linting

- **Prettier:** Standard configuration enforced via `.prettierrc.json`.
- **ESLint:** Strict rules for TypeScript, enforced via `.eslintrc.json`.
- **Scripts:**
    - `pnpm lint`: Run ESLint across the workspace.
    - `pnpm format`: Run Prettier to fix formatting.

## 6. Versioning

- Follow [Semantic Versioning (SemVer)](https://semver.org/).
- Pin critical dependencies in templates to ensure stability (e.g., `"@mysten/walrus": "1.0.0"`).
```
