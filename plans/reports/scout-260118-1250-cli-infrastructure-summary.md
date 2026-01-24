# CLI Infrastructure Scout Report

## Main Entry Point & Workflow
The CLI entry point is located at `packages/cli/src/index.ts`. It uses `commander` for CLI management.

**Workflow:**
1. **Argument Parsing:** Uses `commander` to handle `project-name` and options (`--sdk`, `--framework`, `--use-case`, etc.).
2. **Initial Context:** Merges CLI arguments into an `initialContext`.
3. **Interactive Prompts:** Calls `runPrompts(initialContext)` to fill missing configuration.
4. **Context Building:** `buildContext` merges CLI options and prompt results, performing runtime validation.
5. **Context Validation:** `validateContext` checks compatibility between SDK, framework, and use-case using a compatibility matrix.
6. **Project Generation:** `generateProject` handles directory creation, preset copying, and template variable transformation.
7. **Post-Install:** `runPostInstall` handles dependency installation, project validation, and Walrus deployment setup.

## Prompt & Interaction Patterns
- **Library:** Uses `prompts`.
- **Logic:** Located in `packages/cli/src/prompts.ts`.
- **Dynamic Choices:** SDK, Framework, and Use Case choices are dynamic based on the `COMPATIBILITY_MATRIX`.
- **Conditional Prompts:** Some prompts (like `useZkLogin`) only appear for specific SDK/Use Case combinations.
- **Abort Handling:** `SIGINT` is handled to clean up partially generated projects.

## Generator Architecture
- **Location:** `packages/cli/src/generator/`
- **Presets:** Templates are stored in `packages/cli/presets/` (resolved via `layers.ts`).
- **Preset Naming:** Follows `{framework}-{sdk}-{useCase}[-features]` pattern.
- **Transformation:** `transform.ts` performs variable substitution (e.g., `{{projectName}}`) in generated files.
- **File Ops:** `file-ops.ts` provides utility functions for directory copying and `.env` setup.

## Configuration & Build Setup
- **Build Tool:** `tsc` (TypeScript compiler).
- **Test Framework:** `vitest`.
- **Package Manager:** `pnpm` (workspace-aware).
- **Entry Points:** `bin` points to `./dist/index.js` in `package.json`.
- **Workspaces:** Defined in `pnpm-workspace.yaml`.

## Key Types & Interfaces
Defined in `packages/cli/src/types.ts`:
- `Context`: Core state containing project name, path, SDK, framework, use-case, etc.
- `SDK`, `Framework`, `UseCase`, `PackageManager`: String literal types for valid options.
- `ValidationResult`: Boolean `valid` flag with optional `error` and `suggestion`.

## Notable Patterns & Conventions
- **Compatibility Matrix:** Centralized logic in `matrix.ts` for what SDKs support what frameworks/use-cases.
- **Layered Generation:** Uses presets as base layers, followed by transformation.
- **Post-Install Hooks:** Decoupled post-generation tasks (git, deps, validation).
- **Security:** `validatePresetPath` prevents path traversal when resolving templates.
- **Cleanup:** Explicit handling of `SIGINT` and rollback on failure to ensure a clean state.

## Unresolved Questions
- None.
