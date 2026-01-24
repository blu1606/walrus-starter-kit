# Walrus Starter Kit

Interactive CLI for scaffolding Walrus applications on the Sui blockchain.

## Overview

This monorepo provides `create-walrus-app`, an interactive CLI tool that helps developers quickly scaffold production-ready Walrus applications with best practices, modern tooling, and multiple SDK/framework options.

## Quick Start

```bash
# Using npm
npm create walrus-app@latest

# Using pnpm
pnpm create walrus-app@latest

# Using yarn
yarn create walrus-app

# Using bun
bun create walrus-app@latest
```

## Available Presets

### Production Ready (Stable)
- **react-mysten-simple-upload** - Single file upload/download with React + @mysten/walrus
- **react-mysten-gallery** - Multi-file gallery with localStorage indexing
- **react-mysten-simple-upload-enoki** - Simple upload with zkLogin via Enoki (Beta)

### Planned
- Vue.js framework support
- Plain TypeScript templates
- Tusky SDK integration
- Hibernuts SDK integration

## Technology Stack

### Core Technologies
- **Node.js**: ^20.0.0 || ^22.0.0 || >=24.0.0
- **Package Manager**: pnpm >= 9.0.0
- **Language**: TypeScript (strict mode)

### SDKs
- **@mysten/walrus** (Stable) - Official Mysten Labs SDK for Testnet
- **@mysten/enoki** (Beta) - zkLogin integration for social authentication
- **@tusky-io/ts-sdk** (Planned) - Community TypeScript SDK
- **@hibernuts/walrus-sdk** (Planned) - Alternative Walrus SDK

### Frameworks
- **React 18** (Stable) - With Vite, TanStack Query, @mysten/dapp-kit
- **Vue 3** (Planned) - With Vite and Composition API
- **Plain TypeScript** (Planned) - Vanilla JS/TS setup

## Project Structure

```
walrus-starter-kit/
├── packages/cli/            # Scaffolder CLI tool
│   ├── src/                 # CLI engine source
│   ├── presets/             # Pre-built preset templates
│   └── scripts/             # Template validation scripts
├── templates/               # Modular template layers
│   ├── base/                # SDK-agnostic foundation
│   ├── sdk-mysten/          # @mysten/walrus SDK layer
│   ├── enoki/               # Enoki zkLogin layer
│   ├── react/               # React framework layer
│   ├── simple-upload/       # Simple upload use case
│   └── gallery/             # Gallery use case
├── docs/                    # Technical documentation
└── examples/                # Generated test outputs
```

## Development

### Prerequisites
- Node.js ^20.0.0 || ^22.0.0 || >=24.0.0
- pnpm >= 9.0.0

### Installation

```bash
pnpm install
```

### Build

```bash
pnpm build
```

### Local Development

```bash
cd packages/cli
pnpm dev
```

### Testing

```bash
# Run all tests
pnpm test

# Test template generation
cd packages/cli
bash scripts/test-templates.sh
```

## Scripts

- `pnpm build` - Build all packages
- `pnpm test` - Run tests across all packages (Vitest)
- `pnpm lint` - Lint all TypeScript files
- `pnpm format` - Format code with Prettier
- `pnpm release` - Test release process locally (dry-run)

## Documentation

- [Project Overview & PDR](./docs/project-overview-pdr.md)
- [System Architecture](./docs/system-architecture.md)
- [Code Standards](./docs/code-standards.md)
- [Development Roadmap](./docs/project-roadmap.md)
- [Codebase Summary](./docs/codebase-summary.md)
- [Design Guidelines](./docs/design-guidelines.md)

## Contributing

We use [Conventional Commits](https://www.conventionalcommits.org/) for automated versioning and releases. See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## Releasing

Releases are automated using semantic-release. See [RELEASE_GUIDE.md](RELEASE_GUIDE.md) for the complete release process.

## Packages

### create-walrus-app

Interactive CLI for scaffolding Walrus applications. See [packages/cli](packages/cli) for details.

## License

MIT
