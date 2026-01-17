# Phase 5: Documentation and Testing

## Context Links
- **Root README**: `README.md`
- **Release Config**: `packages/cli/.releaserc.json`
- **Workflow**: `.github/workflows/release.yml`
- **Research**: `plans/reports/researcher-260117-1952-semantic-release-pnpm-monorepo.md`

## Overview
**Priority**: P2
**Status**: Pending
**Effort**: 1.5 hours

Document the release process for maintainers and contributors. Create CONTRIBUTING.md with conventional commit guidelines. Test semantic-release in dry-run mode locally. Validate GitHub Actions workflow configuration.

## Key Insights
- Dry-run mode tests configuration without publishing
- Conventional commits must be documented for contributors
- README should explain release process for maintainers
- Local testing catches configuration errors before CI
- GitHub CLI can validate workflow syntax

## Requirements

### Functional Requirements
- Document release process in README.md
- Create CONTRIBUTING.md with commit conventions
- Test semantic-release dry-run locally
- Validate workflow YAML syntax
- Verify NPM package preparation

### Non-Functional Requirements
- Clear, concise documentation
- Examples of good/bad commit messages
- Step-by-step release instructions
- Troubleshooting guidance

## Architecture

### Documentation Structure
```
README.md
  └── Release Process section
      ├── Versioning strategy
      ├── Release workflow
      └── NPM publishing

CONTRIBUTING.md
  ├── Commit Message Format
  ├── Conventional Commits Examples
  ├── Commit Types
  ├── Breaking Changes
  └── Release Process
```

### Testing Flow
```
Local Dry-Run
  ↓
Verify version calculation
  ↓
Check changelog generation
  ↓
Validate NPM package
  ↓
Review release notes
```

## Related Code Files

### Files to Modify
- `README.md` (add Release section)

### Files to Create
- `CONTRIBUTING.md` (new contributor guide)
- `packages/cli/CHANGELOG.md` (will be auto-generated)

### Files to Delete
None

## Implementation Steps

### Part 1: Documentation

1. **Update README.md**
   - Add "Release Process" section after "Scripts"
   - Document versioning strategy (semantic versioning)
   - Explain workflow trigger (manual via GitHub Actions)
   - Link to CONTRIBUTING.md for commit conventions

2. **Create CONTRIBUTING.md**
   - Add "Commit Message Format" section
   - Explain conventional commits specification
   - Provide examples for each commit type:
     - `feat:` new features → minor version
     - `fix:` bug fixes → patch version
     - `BREAKING CHANGE:` breaking changes → major version
     - `chore:`, `docs:`, `refactor:` → no release
   - Add "Release Process" section for maintainers
   - Include troubleshooting common issues

3. **Document NPM publishing**
   - Explain provenance attestation
   - Document NPM_TOKEN setup for maintainers
   - List required GitHub secrets

### Part 2: Local Testing

4. **Run semantic-release dry-run**
   ```bash
   cd packages/cli
   npx semantic-release --dry-run
   ```
   - Verify commit analysis works
   - Check version bump calculation
   - Review release notes generation

5. **Verify package preparation**
   ```bash
   cd packages/cli
   pnpm pack --dry-run
   ```
   - Check files included in package
   - Verify dist/ directory contents
   - Ensure templates/ included

6. **Validate package.json fields**
   ```bash
   npm pkg get name version repository publishConfig
   ```
   - Verify all fields correct
   - Check repository.directory set

### Part 3: Workflow Validation

7. **Validate workflow syntax**
   ```bash
   gh workflow view release.yml
   ```
   - Check YAML syntax valid
   - Verify trigger configuration
   - Review job steps

8. **Check workflow permissions**
   - Verify `contents: write` set
   - Verify `id-token: write` set
   - Check environment variables

9. **Verify NPM_TOKEN secret**
   ```bash
   gh secret list
   ```
   - Ensure NPM_TOKEN exists
   - Check secret scope (repository)

## Todo List

### Documentation
- [ ] Add "Release Process" section to README.md
- [ ] Create CONTRIBUTING.md with commit conventions
- [ ] Document versioning strategy
- [ ] Document workflow trigger process
- [ ] Document NPM_TOKEN setup
- [ ] Add commit message examples
- [ ] Add troubleshooting section

### Local Testing
- [ ] Run semantic-release --dry-run
- [ ] Verify commit analysis output
- [ ] Check version calculation
- [ ] Review release notes generation
- [ ] Test pnpm pack --dry-run
- [ ] Verify package contents
- [ ] Validate package.json fields

### Workflow Validation
- [ ] Validate workflow YAML syntax
- [ ] Check workflow permissions
- [ ] Verify environment variables
- [ ] Confirm NPM_TOKEN secret exists
- [ ] Test workflow dispatch UI in GitHub

## Success Criteria

- ✅ README.md includes Release Process section
- ✅ CONTRIBUTING.md created with commit conventions
- ✅ Dry-run completes without errors
- ✅ Version bump calculated correctly
- ✅ Release notes generated properly
- ✅ Package preparation successful
- ✅ Workflow YAML valid
- ✅ Workflow appears in GitHub Actions UI
- ✅ NPM_TOKEN secret configured

## Risk Assessment

### Potential Issues
1. **Dry-run Fails**: Configuration errors in .releaserc.json
   - **Mitigation**: Fix configuration, retest

2. **No Releasable Commits**: No feat/fix commits since last release
   - **Mitigation**: Expected behavior, semantic-release exits cleanly

3. **Missing Git History**: Shallow clone breaks version calculation
   - **Mitigation**: Ensure fetch-depth: 0 in workflow

4. **NPM_TOKEN Missing**: Secret not configured in repository
   - **Mitigation**: Add before triggering workflow

### Edge Cases
- First release (no previous tags) → defaults to 1.0.0
- Multiple commits with different types → highest priority wins
- Breaking change in commit footer vs type → both work

## Security Considerations

### Dry-run Safety
- **No Publishing**: Dry-run never publishes to NPM
- **No Git Commits**: Dry-run never commits to repository
- **No GitHub Releases**: Dry-run never creates releases
- **Safe Testing**: Can run unlimited times locally

### Documentation Security
- **No Tokens in Docs**: Never document actual NPM_TOKEN value
- **Generic Examples**: Use placeholder secrets in examples
- **Public Repository**: CONTRIBUTING.md visible to all

### NPM Token Verification
- **Check Scope**: Token limited to @walrus-kit scope
- **Check Permissions**: Publish-only, no admin access
- **Check Expiry**: Set expiration date (90 days recommended)

## Documentation Templates

### README.md Addition
```markdown
## Release Process

This project uses automated versioning and publishing via [semantic-release](https://semantic-release.gitbook.io/).

### Versioning

- Follows [Semantic Versioning](https://semver.org/)
- Versions determined by conventional commits:
  - `feat:` → minor version bump
  - `fix:` → patch version bump
  - `BREAKING CHANGE:` → major version bump

### Publishing

Releases are triggered manually via GitHub Actions:

1. Ensure all tests pass on main branch
2. Go to Actions → Release workflow
3. Click "Run workflow"
4. Package automatically published to NPM with provenance

See [CONTRIBUTING.md](CONTRIBUTING.md) for commit message guidelines.
```

### CONTRIBUTING.md Template
```markdown
# Contributing to Walrus Starter Kit

## Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/) for automated versioning.

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature (minor version)
- `fix`: Bug fix (patch version)
- `docs`: Documentation changes
- `chore`: Maintenance tasks
- `refactor`: Code refactoring
- `test`: Test updates

### Examples

**New feature:**
```
feat(cli): add interactive template selection
```

**Bug fix:**
```
fix(cli): resolve package manager detection issue
```

**Breaking change:**
```
feat(cli): redesign configuration API

BREAKING CHANGE: Configuration format changed from JSON to YAML
```

## Release Process

Releases are automated via GitHub Actions:

1. Commit changes following conventional commits
2. Push to main branch
3. CI validates changes
4. Maintainer triggers release workflow
5. semantic-release publishes to NPM
```

## Next Steps

1. Proceed to **Phase 6: First Release Execution**
2. Trigger release workflow manually
3. Verify NPM package published with provenance
4. Verify GitHub release created
5. Verify CHANGELOG.md updated
