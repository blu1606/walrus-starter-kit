# Phase 2: Configuration Setup

## Context Links
- **Research**: `plans/reports/researcher-260117-1952-semantic-release-pnpm-monorepo.md`
- **CLI Package**: `packages/cli/package.json`
- **GitHub Repo**: https://github.com/blu1606/walrus-starter-kit
- **Semantic-Release Docs**: https://semantic-release.gitbook.io/semantic-release/usage/configuration

## Overview
**Priority**: P2
**Status**: Pending
**Effort**: 1 hour

Create `.releaserc.json` configuration file for semantic-release in the CLI package directory. Configuration defines commit parsing rules, changelog generation, NPM publishing with provenance, GitHub releases, and git commits.

## Key Insights
- Configuration placed in `packages/cli/` for package-specific releases
- Use JSON format for clarity and validation
- Enable NPM provenance for package trust scores
- Tag format: `@walrus-kit/create-walrus-app-vX.Y.Z`
- Changelog written to CLI package root
- Commit version bumps back to repository

## Requirements

### Functional Requirements
- Parse conventional commits (feat, fix, BREAKING CHANGE)
- Generate release notes and CHANGELOG.md
- Publish to NPM with provenance enabled
- Create GitHub releases with notes
- Commit package.json and CHANGELOG.md updates
- Use package-specific git tags

### Non-Functional Requirements
- Configuration format: JSON
- Support dry-run mode for testing
- Compatible with CI environment variables
- Respect pnpm workspace protocol

## Architecture

### Plugin Execution Order
1. **commit-analyzer**: Parse commits → determine version bump
2. **release-notes-generator**: Generate release notes
3. **changelog**: Write CHANGELOG.md
4. **npm**: Update version, publish with provenance
5. **github**: Create GitHub release
6. **git**: Commit and push changes

### Configuration Structure
```json
{
  "branches": ["main"],
  "repositoryUrl": "git repo URL",
  "tagFormat": "@walrus-kit/create-walrus-app-v${version}",
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    ["@semantic-release/npm", { "provenance": true }],
    "@semantic-release/github",
    ["@semantic-release/git", { "assets": [...] }]
  ]
}
```

## Related Code Files

### Files to Create
- `packages/cli/.releaserc.json` (new configuration file)

### Files to Modify
None (configuration is standalone)

### Files to Delete
None

## Implementation Steps

1. **Create .releaserc.json in CLI package**
   ```bash
   cd d:\Sui\walrus-starter-kit\packages\cli
   ```

2. **Define base configuration**
   - Set branches to `["main"]`
   - Set repositoryUrl to GitHub repo
   - Define custom tagFormat for scoped package

3. **Configure commit-analyzer plugin**
   - Use default conventional commits preset
   - Parse feat → minor, fix → patch, BREAKING CHANGE → major

4. **Configure release-notes-generator plugin**
   - Use default preset for markdown generation

5. **Configure changelog plugin**
   - Write to `CHANGELOG.md` in CLI package root
   - Include commit types: feat, fix, perf, refactor

6. **Configure npm plugin with provenance**
   - Enable provenance: true
   - Respect publishConfig in package.json
   - Use pnpm as package manager

7. **Configure github plugin**
   - Create releases with generated notes
   - Attach assets if needed (none for now)

8. **Configure git plugin**
   - Commit package.json and CHANGELOG.md
   - Use message: "chore(release): ${nextRelease.version} [skip ci]"
   - Skip CI to prevent release loop

9. **Validate JSON syntax**
   ```bash
   node -e "require('./packages/cli/.releaserc.json')"
   ```

## Todo List

- [ ] Create `packages/cli/.releaserc.json` file
- [ ] Configure branches and repositoryUrl
- [ ] Set custom tagFormat for scoped package
- [ ] Add commit-analyzer plugin
- [ ] Add release-notes-generator plugin
- [ ] Add changelog plugin with changelogFile option
- [ ] Add npm plugin with provenance enabled
- [ ] Add github plugin
- [ ] Add git plugin with assets and message
- [ ] Validate JSON syntax
- [ ] Test with dry-run mode (in Phase 5)

## Success Criteria

- ✅ `.releaserc.json` exists in `packages/cli/`
- ✅ Valid JSON syntax (no parsing errors)
- ✅ All 6 plugins configured in correct order
- ✅ Provenance enabled in npm plugin
- ✅ Custom tagFormat matches package scope
- ✅ Git plugin configured to skip CI
- ✅ Changelog written to CLI package root

## Risk Assessment

### Potential Issues
1. **JSON Syntax Errors**: Invalid configuration breaks release
   - **Mitigation**: Validate with Node.js JSON parser

2. **Wrong Tag Format**: Tags don't match package name
   - **Mitigation**: Use `@walrus-kit/create-walrus-app-v${version}`

3. **Provenance Failures**: NPM publish without id-token permission
   - **Mitigation**: Configure in Phase 3 (GitHub Actions)

4. **Release Loop**: Release triggers CI which triggers release
   - **Mitigation**: Add `[skip ci]` to git commit message

### Edge Cases
- Multiple commits with different types (choose highest priority)
- No releasable commits (semantic-release exits cleanly)
- Breaking changes in commit footer vs commit type

## Security Considerations

### NPM Provenance
- Requires `id-token: write` permission in GitHub Actions
- Generates signed attestation of package origin
- Increases package trust score on NPM registry
- **Critical**: Must be enabled for production releases

### Git Commits
- Use `[skip ci]` to prevent infinite loop
- Commits made by GitHub Actions bot
- Requires `contents: write` permission

### GitHub Releases
- Requires `contents: write` permission
- Release notes generated from commit messages
- No sensitive data in commit messages

## Configuration File Template

```json
{
  "branches": ["main"],
  "repositoryUrl": "https://github.com/blu1606/walrus-starter-kit",
  "tagFormat": "@walrus-kit/create-walrus-app-v${version}",
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/changelog",
      {
        "changelogFile": "CHANGELOG.md"
      }
    ],
    [
      "@semantic-release/npm",
      {
        "npmPublish": true,
        "pkgRoot": ".",
        "tarballDir": "dist",
        "provenance": true
      }
    ],
    [
      "@semantic-release/github",
      {
        "assets": []
      }
    ],
    [
      "@semantic-release/git",
      {
        "assets": ["package.json", "CHANGELOG.md"],
        "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
      }
    ]
  ]
}
```

## Next Steps

1. Proceed to **Phase 3: GitHub Actions Workflow**
2. Create `.github/workflows/release.yml`
3. Configure workflow_dispatch for manual triggers
4. Setup NPM_TOKEN and provenance permissions
