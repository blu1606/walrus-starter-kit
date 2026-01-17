# Contributing to Walrus Starter Kit

Thank you for contributing to the Walrus Starter Kit! This guide explains our development workflow and release process.

## Commit Message Convention

We use [Conventional Commits](https://www.conventionalcommits.org/) for automated versioning and changelog generation. All commit messages **must** follow this format:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Commit Types

- **feat**: A new feature (triggers **minor** version bump, e.g., 1.0.0 → 1.1.0)
- **fix**: A bug fix (triggers **patch** version bump, e.g., 1.0.0 → 1.0.1)
- **docs**: Documentation changes only
- **style**: Code style changes (formatting, missing semi-colons, etc.)
- **refactor**: Code changes that neither fix bugs nor add features
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Maintenance tasks, dependency updates, etc.

### Breaking Changes

To trigger a **major** version bump (e.g., 1.0.0 → 2.0.0), add `BREAKING CHANGE:` in the footer or use `!` after the type/scope:

```
feat!: remove deprecated API
```

or

```
feat: new authentication system

BREAKING CHANGE: old auth methods removed
```

### Examples

```bash
# Feature (minor bump)
feat(cli): add template selection prompt

# Bug fix (patch bump)
fix(cli): resolve path issues on Windows

# Breaking change (major bump)
feat(cli)!: migrate to ESM-only

BREAKING CHANGE: CommonJS support removed, use ESM imports
```

### Scopes

Common scopes for this project:
- `cli` - Changes to the CLI package
- `templates` - Template file changes
- `tests` - Test suite changes
- `docs` - Documentation updates
- `ci` - CI/CD workflow changes

## Development Workflow

### 1. Clone and Install

```bash
git clone https://github.com/blu1606/walrus-starter-kit.git
cd walrus-starter-kit
pnpm install
```

### 2. Make Changes

```bash
cd packages/cli
pnpm dev  # Watch mode for TypeScript compilation
```

### 3. Run Tests

```bash
pnpm test        # Unit tests
pnpm test:e2e    # E2E tests
pnpm build       # Build packages
```

### 4. Commit with Conventional Format

```bash
git add .
git commit -m "feat(cli): add new template option"
```

### 5. Push and Create PR

```bash
git push origin your-branch-name
```

Create a pull request to the `main` branch. CI will run tests and linting.

## Release Process

Releases are automated using [semantic-release](https://github.com/semantic-release/semantic-release) and triggered manually via GitHub Actions.

### How Releases Work

1. **Commits are analyzed**: semantic-release scans commit messages since the last release
2. **Version is determined**: Based on commit types (feat/fix/BREAKING CHANGE)
3. **Changelog is generated**: From commit messages and PR titles
4. **Package is published**: To NPM with provenance attestation
5. **GitHub release is created**: With auto-generated release notes
6. **Version is committed**: package.json and CHANGELOG.md are updated

### Triggering a Release

Only maintainers can trigger releases:

1. Go to **Actions** tab in GitHub
2. Select **Release** workflow
3. Click **Run workflow**
4. Confirm the workflow starts

### Release Notes

Release notes are auto-generated from commit messages. Write clear, descriptive commit messages to improve release notes quality.

### Version Bumps

- `fix:` commits → **Patch** release (1.0.0 → 1.0.1)
- `feat:` commits → **Minor** release (1.0.0 → 1.1.0)
- `BREAKING CHANGE:` or `!` → **Major** release (1.0.0 → 2.0.0)

## Testing Locally

You can test the release process locally without publishing:

```bash
pnpm release  # Runs semantic-release in dry-run mode
```

This simulates the release and shows what version would be published.

## Code Quality

- **Linting**: `pnpm lint`
- **Formatting**: `pnpm format`
- **Type checking**: `pnpm build` (TypeScript compilation)

All checks must pass before merging PRs.

## Questions?

Open an issue or discussion on GitHub if you have questions about the contribution process.
