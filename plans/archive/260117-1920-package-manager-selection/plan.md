# Plan: Package Manager Selection Prompt

## Problem Statement

The CLI currently detects the package manager based on the user agent, but doesn't allow the user to choose a different one during the interactive prompts. This is inefficient for users with multiple package managers installed.

## Proposed Solution

Add an explicit step in the interactive prompts to allow users to select their preferred package manager, defaulting to the detected one.

## Proposed Changes

### 1. `packages/cli/src/prompts.ts`

- Add a new prompt for `packageManager`.
- Use `detectPackageManager()` as the default value.
- Ensure it's skipped if `initial.packageManager` is provided.

### 2. `packages/cli/src/context.ts`

- Update `buildContext` to accept `packageManager` from the merged results (prompts + args).
- Add runtime validation for the `packageManager` value.

### 3. `packages/cli/src/index.ts`

- Add a `--package-manager` (or `-p`) option to the CLI.

### 4. `packages/cli/src/utils/detect-pm.ts`

- No changes needed, but ensure it's imported correctly in `prompts.ts`.

## Implementation Tasks

### Phase 1: Core Implementation

- [ ] Modify `packages/cli/src/prompts.ts` to add the package manager selection prompt.
- [ ] Modify `packages/cli/src/context.ts` to support the selected package manager and add validation.
- [ ] Modify `packages/cli/src/index.ts` to add the `--package-manager` CLI option.

### Phase 2: Verification & Testing

- [ ] Build the CLI: `cd packages/cli && pnpm build`
- [ ] Run existing tests: `cd packages/cli && pnpm test`
- [ ] Add new test cases for package manager selection if needed (check `packages/cli/src/context.test.ts` and `packages/cli/src/validator.test.ts`).
- [ ] Manual verification of the prompt.

## Risks & Considerations

- Ensure the default detection still works as a sensible initial value.
- Validate that all supported package managers (npm, pnpm, yarn, bun) are handled correctly in post-install steps.
