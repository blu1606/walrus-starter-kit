# Phase 4: Package.json Updates

## Context Links
- **Root Package**: `package.json`
- **CLI Package**: `packages/cli/package.json`
- **Release Config**: `packages/cli/.releaserc.json`
- **Workflow**: `.github/workflows/release.yml`

## Overview
**Priority**: P2
**Status**: Pending
**Effort**: 30 minutes

Update package.json files to support semantic-release workflow. Add release script for manual testing, verify publishConfig, ensure repository field is correct, and clean up any issues in CLI package.json.

## Key Insights
- Release script useful for local dry-run testing
- publishConfig already set to public access
- Repository URL must match GitHub repository
- Remove self-referencing dependency in CLI package.json
- Package name `@walrus-kit/create-walrus-app` already scoped

## Requirements

### Functional Requirements
- Add release script to root package.json
- Verify publishConfig.access = "public" in CLI package
- Ensure repository field matches GitHub URL
- Remove invalid self-dependency in CLI package
- Maintain existing scripts and dependencies

### Non-Functional Requirements
- Use conventional script naming
- Preserve existing package metadata
- Ensure semantic-release compatibility
- Support dry-run mode for testing

## Architecture

### Script Hierarchy
```
Root package.json
  └── release (optional) → dry-run testing

CLI package.json
  └── prepublishOnly → pnpm build
  └── publishConfig → access: public
  └── repository → GitHub URL
```

### Package Dependencies
- **Root**: semantic-release + plugins (devDependencies)
- **CLI**: No semantic-release dependencies (uses npx)

## Related Code Files

### Files to Modify
- `package.json` (root) - Add release script
- `packages/cli/package.json` - Remove self-dependency, verify fields

### Files to Create
None

### Files to Delete
None

## Implementation Steps

1. **Update root package.json**
   - Add release script for dry-run testing:
     ```json
     "release": "cd packages/cli && npx semantic-release --dry-run"
     ```
   - Allows local validation before GitHub Actions run

2. **Fix CLI package.json self-dependency**
   - Remove line 41:
     ```json
     "@walrus-kit/create-walrus-app": "file:D:/Sui/walrus-starter-kit/packages/cli/walrus-kit-create-walrus-app-0.1.0.tgz"
     ```
   - This is invalid and breaks publish

3. **Verify CLI package.json repository field**
   - Current:
     ```json
     "repository": {
       "type": "git",
       "url": "https://github.com/blu1606/walrus-starter-kit.git"
     }
     ```
   - Add directory field for monorepo:
     ```json
     "repository": {
       "type": "git",
       "url": "https://github.com/blu1606/walrus-starter-kit.git",
       "directory": "packages/cli"
     }
     ```

4. **Verify CLI publishConfig**
   - Already correct:
     ```json
     "publishConfig": {
       "access": "public"
     }
     ```
   - No changes needed

5. **Verify CLI package metadata**
   - Check name: `@walrus-kit/create-walrus-app` ✓
   - Check version: `0.1.0` (will be managed by semantic-release)
   - Check files: `["dist", "templates"]` ✓
   - Check bin: `{"create-walrus-app": "./dist/index.js"}` ✓

6. **Verify prepublishOnly script**
   - Already correct:
     ```json
     "prepublishOnly": "pnpm build"
     ```
   - Ensures TypeScript compiled before publish

7. **Run pnpm install**
   - Update lockfile after removing self-dependency
   ```bash
   pnpm install
   ```

## Todo List

- [ ] Add release script to root package.json
- [ ] Remove self-dependency from CLI package.json (line 41)
- [ ] Add directory field to CLI repository config
- [ ] Verify publishConfig.access = "public"
- [ ] Verify package name is scoped correctly
- [ ] Verify files array includes dist and templates
- [ ] Verify bin points to dist/index.js
- [ ] Verify prepublishOnly script exists
- [ ] Run pnpm install to update lockfile
- [ ] Validate package.json with npm pkg get

## Success Criteria

- ✅ Root package.json has release script
- ✅ CLI package.json has no self-dependency
- ✅ Repository field includes directory for monorepo
- ✅ publishConfig.access set to "public"
- ✅ Package name scoped: `@walrus-kit/create-walrus-app`
- ✅ Files array includes dist and templates
- ✅ Bin points to dist/index.js
- ✅ prepublishOnly builds before publish
- ✅ pnpm-lock.yaml updated without errors

## Risk Assessment

### Potential Issues
1. **Self-Dependency Breaks Publish**: Invalid tarball reference
   - **Mitigation**: Remove line 41 in CLI package.json

2. **Missing Repository Directory**: NPM warning in monorepo
   - **Mitigation**: Add directory field to repository object

3. **Private Package**: publishConfig missing or wrong
   - **Mitigation**: Verify access: "public" is set

4. **Build Not Run**: Package published without compiled code
   - **Mitigation**: prepublishOnly script ensures build

### Edge Cases
- Version field updated by semantic-release (don't manually change)
- Scoped packages require publishConfig.access = "public"
- bin path must point to compiled JS in dist/, not TypeScript src/

## Security Considerations

### Package Access
- **Public Access**: Required for scoped packages on free tier
- **publishConfig**: Ensures NPM doesn't reject publish
- **Scope**: `@walrus-kit` namespace (must be owned on NPM)

### Repository Field
- **URL**: Public GitHub repository
- **Directory**: Indicates package location in monorepo
- **Transparency**: Links NPM package to source code

### prepublishOnly Hook
- **Purpose**: Compile TypeScript before publish
- **Timing**: Runs before `npm publish` (and semantic-release)
- **Safety**: Prevents publishing source-only packages

## Package.json Diffs

### Root package.json
```diff
{
  "scripts": {
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "lint": "eslint . --ext .ts,.tsx",
-   "format": "prettier --write \"**/*.{ts,tsx,json,md}\""
+   "format": "prettier --write \"**/*.{ts,tsx,json,md}\"",
+   "release": "cd packages/cli && npx semantic-release --dry-run"
  }
}
```

### CLI package.json
```diff
{
  "repository": {
    "type": "git",
-   "url": "https://github.com/blu1606/walrus-starter-kit.git"
+   "url": "https://github.com/blu1606/walrus-starter-kit.git",
+   "directory": "packages/cli"
  },
  "dependencies": {
-   "@walrus-kit/create-walrus-app": "file:D:/Sui/walrus-starter-kit/packages/cli/walrus-kit-create-walrus-app-0.1.0.tgz",
    "commander": "^11.1.0",
    ...
  }
}
```

## Next Steps

1. Proceed to **Phase 5: Documentation and Testing**
2. Document release process in README.md
3. Create CONTRIBUTING.md with commit conventions
4. Test dry-run release locally
5. Validate workflow in GitHub Actions
