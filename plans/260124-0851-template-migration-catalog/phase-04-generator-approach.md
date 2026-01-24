# Phase 04 — Generator Approach & Composition

**Status:** Completed (2026-01-24)
**Review Score:** 8.5/10

## Goal

Define the mechanics for composing the project from catalog slices using a virtual filesystem approach.

## Finalized Pipeline (9-Step)

1. **Initialize Virtual FS**: Create an in-memory file tree.
2. **Process Base**: Apply base template files.
3. **Process Framework**: Apply selected framework files (react/vue/etc).
4. **Process Capabilities**:
   - Merge `capability/storage/*` (adapter logic).
   - Merge `capability/auth/*` (auth providers/hooks).
   - Merge `capability/liquidity/*` (DeFi integration).
5. **Process Providers**: Apply framework-specific composition of providers (e.g., `src/providers/index.tsx`).
6. **Process Feature**: Apply selected use-case (simple-upload/gallery).
7. **Process Addons**: Apply examples and deployment scripts.
8. **Templating**: Run Handlebars (`.hbs`) across the whole Virtual FS using the collected context.
9. **Materialize**: Write the Virtual FS tree to the target project path.

## Technical Design Specifications

### Interfaces

```typescript
interface VirtualFS {
  files: Map<string, string | Buffer>;
  exists(path: string): boolean;
  read(path: string): string | Buffer;
  write(path: string, content: string | Buffer): void;
  delete(path: string): void;
}

interface SliceManifest {
  name: string;
  type: 'base' | 'framework' | 'capability' | 'provider' | 'feature' | 'addon';
  dependencies?: string[];
  incompatible?: string[];
  priority?: number;
}

interface SliceProcessor {
  apply(vfs: VirtualFS, context: GeneratorContext): Promise<void>;
}
```

### Merge Strategies

- **package.json**: Deep merge `dependencies`, `devDependencies`, and `scripts`. Version conflicts resolved by taking the latest or defined priority.
- **.env.example**: Append unique keys. If a key exists, add a commented-out version if values differ.
- **.gitignore**: Union of all entries, deduplicated.

## Key Integration Points

- `src/generator/virtual-fs.ts`: Implementation of the in-memory tree.
- `src/generator/composer.ts`: Orchestration of slice merging.
- `src/generator/transformer.ts`: Handlebars processing logic.

## Feedback & Resolutions

- **Provider Composition**: Addressed feedback regarding complex provider nesting. Implemented a dedicated `ProviderProcessor` that manages the `src/providers/index.tsx` generation to ensure correct wrapping order.
- **Path Security**: Hardened VFS `write` and `read` methods to prevent path traversal attacks by validating all paths against the project root.

## Exit Criteria

- [x] Decisions on templating engine (Handlebars confirmed).
- [x] Interface definitions for `VirtualFS`, `SliceManifest`, and `SliceProcessor`.
- [x] Strategy for merging `package.json`, `.env.example`, and `.gitignore`.
