# Phase 1: Dependencies Installation

## Context Links
- **Research**: `plans/reports/researcher-260117-1952-semantic-release-pnpm-monorepo.md`
- **Root Package**: `package.json`
- **CLI Package**: `packages/cli/package.json`
- **Workspace Config**: `pnpm-workspace.yaml`

## Overview
**Priority**: P2
**Status**: Pending
**Effort**: 30 minutes

Install semantic-release core package and required plugins for monorepo release automation. Plugins handle commit analysis, changelog generation, NPM publishing with provenance, GitHub releases, and git commits.

## Key Insights
- semantic-release v23+ supports native NPM provenance
- Monorepo requires `semantic-release-monorepo` for package-specific tagging
- All plugins installed as devDependencies at root level
- pnpm workspace protocol compatible with semantic-release

## Requirements

### Functional Requirements
- Install semantic-release core (v23+)
- Install 6 required plugins for full release workflow
- Optional: Install semantic-release-monorepo for better tagging

### Non-Functional Requirements
- Use pnpm for package management consistency
- Install in root package.json as devDependencies
- Pin major versions to prevent breaking changes
- Ensure compatibility with Node 20+

## Architecture

### Dependency Tree
```
semantic-release (core)
├── @semantic-release/commit-analyzer
├── @semantic-release/release-notes-generator
├── @semantic-release/changelog
├── @semantic-release/npm
├── @semantic-release/github
└── @semantic-release/git

Optional:
└── semantic-release-monorepo
```

### Installation Location
- **Root**: All semantic-release packages (shared tooling)
- **CLI Package**: No direct dependencies (inherits from root)

## Related Code Files

### Files to Modify
- `package.json` (root)

### Files to Create
None

### Files to Delete
None

## Implementation Steps

1. **Navigate to repository root**
   ```bash
   cd d:\Sui\walrus-starter-kit
   ```

2. **Install semantic-release core**
   ```bash
   pnpm add -D -w semantic-release
   ```

3. **Install required plugins**
   ```bash
   pnpm add -D -w @semantic-release/commit-analyzer @semantic-release/release-notes-generator @semantic-release/changelog @semantic-release/npm @semantic-release/github @semantic-release/git
   ```

4. **Install monorepo plugin (optional but recommended)**
   ```bash
   pnpm add -D -w semantic-release-monorepo
   ```

5. **Verify installation**
   ```bash
   pnpm list semantic-release --depth=0
   ```

6. **Check pnpm lockfile updated**
   ```bash
   git status pnpm-lock.yaml
   ```

## Todo List

- [ ] Install semantic-release core package
- [ ] Install @semantic-release/commit-analyzer
- [ ] Install @semantic-release/release-notes-generator
- [ ] Install @semantic-release/changelog
- [ ] Install @semantic-release/npm
- [ ] Install @semantic-release/github
- [ ] Install @semantic-release/git
- [ ] Install semantic-release-monorepo (optional)
- [ ] Verify all packages installed correctly
- [ ] Commit package.json and pnpm-lock.yaml changes

## Success Criteria

- ✅ semantic-release v23+ installed in devDependencies
- ✅ All 6 required plugins present in package.json
- ✅ pnpm-lock.yaml updated without errors
- ✅ `pnpm list semantic-release` shows all packages
- ✅ No peer dependency warnings or errors
- ✅ Compatible with existing TypeScript/ESLint tooling

## Risk Assessment

### Potential Issues
1. **Version Conflicts**: Peer dependency mismatches with existing tools
   - **Mitigation**: Use latest semantic-release v23+ which supports Node 20+

2. **Installation Failures**: Network issues or registry problems
   - **Mitigation**: Retry with `pnpm install --force` if needed

3. **Workspace Protocol Issues**: pnpm workspace:* dependencies
   - **Mitigation**: Install at root with -w flag

### Edge Cases
- Installing in workspace might require `-w` flag for root devDependencies
- Some plugins may have optional peer dependencies (ignore if not needed)

## Security Considerations

### Package Integrity
- Use pnpm's built-in checksum verification
- Review package.json for unexpected dependencies
- Check NPM audit after installation

### Token Management
- No tokens required for dependency installation
- NPM_TOKEN needed later for publishing (Phase 3)

## Next Steps

1. Proceed to **Phase 2: Configuration Setup**
2. Create `.releaserc.json` in `packages/cli/`
3. Configure plugins with monorepo-specific settings
4. Setup conventional commits parsing rules
