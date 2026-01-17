# Walrus Starter Kit

Interactive CLI for scaffolding Walrus applications on the Sui blockchain.

## Overview

This monorepo contains the `create-walrus-app` CLI tool that helps developers quickly scaffold Walrus applications with best practices and modern tooling.

## Project Structure

```
walrus-starter-kit/
├── packages/
│   └── cli/                 # The scaffolder CLI tool
├── templates/               # Static template assets (excluded from workspace)
├── examples/                # Generated test outputs
└── docs/                    # Project documentation
```

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 9.0.0

## Getting Started

### Installation

```bash
pnpm install
```

### Build

```bash
pnpm build
```

### Development

```bash
cd packages/cli
pnpm dev
```

## Scripts

- `pnpm build` - Build all packages
- `pnpm test` - Run tests across all packages
- `pnpm lint` - Lint all TypeScript files
- `pnpm format` - Format code with Prettier
- `pnpm release` - Test release process locally (dry-run)

## Contributing

We use [Conventional Commits](https://www.conventionalcommits.org/) for automated versioning and releases. See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## Releasing

Releases are automated using semantic-release. See [RELEASE_GUIDE.md](RELEASE_GUIDE.md) for the complete release process.

## Packages

### create-walrus-app

Interactive CLI for scaffolding Walrus applications. See [packages/cli](packages/cli) for details.

## License

MIT
