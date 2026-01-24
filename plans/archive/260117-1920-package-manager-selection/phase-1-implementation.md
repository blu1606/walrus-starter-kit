# Phase 1: Implementation of Package Manager Selection

## Tasks

- [ ] Update `packages/cli/src/prompts.ts`
- [ ] Update `packages/cli/src/context.ts`
- [ ] Update `packages/cli/src/index.ts`
- [ ] Verify with `lsp_diagnostics`

## Details

### `packages/cli/src/prompts.ts`

Add:

```typescript
{
  type: initial.packageManager ? null : 'select',
  name: 'packageManager',
  message: 'Choose package manager:',
  choices: [
    { title: 'npm', value: 'npm' },
    { title: 'pnpm', value: 'pnpm' },
    { title: 'yarn', value: 'yarn' },
    { title: 'bun', value: 'bun' },
  ],
  initial: () => {
    const detected = detectPackageManager();
    const index = ['npm', 'pnpm', 'yarn', 'bun'].indexOf(detected);
    return index !== -1 ? index : 0;
  },
}
```

### `packages/cli/src/context.ts`

Change `packageManager: detectPackageManager()` to `packageManager: merged.packageManager || detectPackageManager()`.
Add validation:

```typescript
const packageManager = merged.packageManager || detectPackageManager();
if (
  packageManager !== 'npm' &&
  packageManager !== 'pnpm' &&
  packageManager !== 'yarn' &&
  packageManager !== 'bun'
) {
  throw new Error(
    `Invalid package manager: ${packageManager}. Must be one of: npm, pnpm, yarn, bun`
  );
}
```

### `packages/cli/src/index.ts`

Add:

```typescript
.option('-p, --package-manager <pm>', 'Package manager to use (npm | pnpm | yarn | bun)')
```

And pass `packageManager: options.packageManager` to `initialContext`.
