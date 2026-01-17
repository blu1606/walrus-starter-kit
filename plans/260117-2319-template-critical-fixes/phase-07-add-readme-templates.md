# Phase 7: Add README Templates to All Layers

## Context

- **Priority**: P2 (Medium - Developer experience improvement)
- **Status**: Pending
- **Effort**: 2 hours
- **Dependencies**: None (independent change)

## Overview

Add comprehensive README.md files to each template layer (base, sdk-mysten, react, gallery, simple-upload). READMEs should provide setup instructions, environment variables, development commands, and architecture overview for generated projects.

## Key Insights

- Current state: Templates lack comprehensive documentation
- Impact: Poor developer experience for generated projects
- Best practice: Every project should have clear README
- Template variable support: Use `{{projectName}}` for customization
- Layer-specific content: Each layer contributes to final README

## Requirements

### Functional
- Create README.md for each template layer
- Include setup instructions (install, env vars, dev commands)
- Document architecture and project structure
- Explain Walrus-specific features
- Support template variables ({{projectName}}, etc.)

### Non-Functional
- Clear, concise writing
- Beginner-friendly language
- Code examples where helpful
- Links to external resources
- Markdown formatting best practices

## Architecture

### Template Layer Merging
```
Base README (common setup)
    ↓
SDK README (sdk-specific features)
    ↓
Framework README (React/Vue/etc setup)
    ↓
Use Case README (feature-specific docs)
    ↓
Final README in generated project
```

**Note**: Later layers override earlier layers, so use case README will be the final one.
Solution: Create comprehensive README in use case layer that references all layers.

## Related Code Files

### Files to Create
1. `packages/cli/templates/base/README.md` - Core project info
2. `packages/cli/templates/sdk-mysten/README.md` - SDK usage
3. `packages/cli/templates/react/README.md` - React setup
4. `packages/cli/templates/gallery/README.md` - Gallery app docs
5. `packages/cli/templates/simple-upload/README.md` - Upload app docs

### Template Variables Available
- `{{projectName}}` - User's project name
- `{{sdk}}` - SDK choice (mysten, tusky, hibernuts)
- `{{framework}}` - Framework choice (react, vue, plain-ts)
- `{{useCase}}` - Use case choice (simple-upload, gallery, defi-nft)

## Implementation Steps

### Step 1: Create Use Case README Template
Since use case layer is merged last, create comprehensive README there:

```markdown
<!-- packages/cli/templates/simple-upload/README.md -->

# {{projectName}}

A Walrus storage application built with **create-walrus-app**.

## Features

- 📤 Upload files to Walrus decentralized storage
- 🔗 Get permanent blob IDs for uploaded content
- 🔐 Wallet integration with Sui blockchain
- ⚡ Built with React 18 and Vite

## Tech Stack

- **Storage SDK**: @mysten/walrus (v0.9.0)
- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **State Management**: TanStack Query
- **Wallet**: @mysten/dapp-kit

## Getting Started

### Prerequisites

- Node.js 20+ or compatible runtime
- pnpm, npm, yarn, or bun
- A Sui wallet (Sui Wallet, Ethos, etc.)

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Update .env with your configuration
```

### Environment Variables

Create a `.env` file with the following variables:

```env
VITE_WALRUS_NETWORK=testnet
VITE_WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space
VITE_WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space
VITE_SUI_NETWORK=testnet
```

### Development

```bash
# Start dev server (http://localhost:3000)
pnpm dev

# Type checking
pnpm tsc

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Project Structure

```
{{projectName}}/
├── src/
│   ├── adapters/       # Storage adapter interface
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions (env validation, formatting)
│   ├── providers/      # React context providers (Wallet, Query)
│   ├── hooks/          # Custom React hooks (useStorage, useWallet)
│   ├── components/     # UI components
│   ├── App.tsx         # Main application component
│   └── main.tsx        # Application entry point
├── .env.example        # Environment variable template
├── vite.config.ts      # Vite configuration
└── tsconfig.json       # TypeScript configuration
```

## Architecture

This project uses a **layered adapter pattern**:

### Base Layer
- **Storage Adapter Interface**: SDK-agnostic abstraction
- **Type Definitions**: Shared types (BlobId, WalrusConfig, etc.)
- **Environment Validation**: Zod schemas for runtime safety

### SDK Layer (@mysten/walrus)
- **WalrusStorageAdapter**: Concrete implementation
- **Singleton Client**: Shared WalrusClient instance
- **API Integration**: v0.9.0 object-based parameter pattern

### React Layer
- **Provider Composition**: QueryProvider → WalletProvider → App
- **Custom Hooks**: useStorage, useWallet, useStorageAdapter
- **Wallet Integration**: Automatic signer injection for uploads

## Usage

### Upload a File

```typescript
import { useUpload } from './hooks/useStorage';
import { useWallet } from './hooks/useWallet';

function UploadComponent() {
  const upload = useUpload();
  const { isConnected } = useWallet();

  const handleUpload = async (file: File) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    const result = await upload.mutateAsync({
      file,
      options: { epochs: 5 }
    });

    console.log('Blob ID:', result.blobId);
  };

  return (
    <input type="file" onChange={(e) => {
      const file = e.target.files?.[0];
      if (file) handleUpload(file);
    }} />
  );
}
```

### Download a File

```typescript
import { useDownload } from './hooks/useStorage';

function DownloadComponent({ blobId }: { blobId: string }) {
  const { data: blob, isLoading } = useDownload(blobId);

  if (isLoading) return <div>Loading...</div>;
  if (!blob) return <div>Not found</div>;

  const url = URL.createObjectURL(blob);
  return <a href={url} download>Download</a>;
}
```

## Walrus Storage Concepts

### Blob ID
A unique identifier for content stored on Walrus. Use this to retrieve your data.

### Epochs
Storage duration measured in epochs (~24 hours each). Longer epochs = higher cost.

### Signer
Your wallet's cryptographic signer, required for upload operations to register blobs on-chain.

## Wallet Integration

This app requires a connected Sui wallet for upload operations:

1. **Install a Wallet**: Sui Wallet, Ethos, or other compatible wallets
2. **Connect**: Click "Connect Wallet" in the app
3. **Upload**: Select a file and upload
4. **Sign**: Approve the transaction in your wallet

**Note**: Download and read operations work without wallet connection.

## Resources

- [Walrus Documentation](https://docs.walrus.site)
- [Walrus SDK (@mysten/walrus)](https://www.npmjs.com/package/@mysten/walrus)
- [Sui Documentation](https://docs.sui.io)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)

## Troubleshooting

### "Signer required for blob upload"
→ Connect your wallet before uploading

### "Module not found" errors
→ Run `pnpm install` and ensure all dependencies are installed

### Environment variable errors
→ Check `.env` file exists and all required variables are set

### TypeScript errors in IDE
→ Restart TypeScript server or run `pnpm tsc --noEmit`

## License

MIT

---

Built with [create-walrus-app](https://github.com/MystenLabs/walrus-starter-kit)
```

### Step 2: Create Gallery README
Similar structure but with gallery-specific features:

```markdown
<!-- packages/cli/templates/gallery/README.md -->

# {{projectName}}

A Walrus storage gallery application for browsing and managing decentralized content.

## Features

- 🖼️ Browse uploaded files in a gallery view
- 📤 Upload new files to Walrus storage
- 🔍 Search and filter by blob ID
- 📊 View blob metadata (size, epochs, upload date)
- 🔐 Wallet integration with Sui blockchain

[... similar structure to simple-upload, but with gallery-specific usage examples ...]

## Usage

### Gallery View

```typescript
import { useMetadata } from './hooks/useStorage';

function GalleryItem({ blobId }: { blobId: string }) {
  const { data: metadata } = useMetadata(blobId);

  return (
    <div>
      <img src={`/api/blob/${blobId}`} />
      <p>Size: {formatFileSize(metadata?.size)}</p>
      <p>Expires: {metadata?.expiresAt.toLocaleDateString()}</p>
    </div>
  );
}
```

[... rest of README ...]
```

### Step 3: Create Layer-Specific READMEs (Optional)
For reference, create minimal READMEs in base/sdk/framework layers:

```markdown
<!-- packages/cli/templates/base/README.md -->

# Walrus Storage Base Layer

This layer provides SDK-agnostic abstractions for Walrus storage.

See the main project README for complete documentation.
```

### Step 4: Add Template Variable Transformation Test
```bash
# Verify template variables work
pnpm create walrus-app test-readme-vars --sdk mysten --framework react --use-case simple-upload

cd test-readme-vars
cat README.md | grep "test-readme-vars"  # Should show project name replaced
```

### Step 5: Add Code Examples Section
Include practical code examples for common tasks:
- Connecting wallet
- Uploading files
- Downloading files
- Error handling
- Type safety examples

### Step 6: Add Troubleshooting Section
Document common issues and solutions:
- Wallet connection problems
- Environment variable errors
- Module resolution issues
- TypeScript errors
- Network configuration

## Todo List

- [ ] Create simple-upload README template
- [ ] Add features section
- [ ] Add tech stack section
- [ ] Add getting started guide
- [ ] Add environment variables documentation
- [ ] Add development commands
- [ ] Add project structure diagram
- [ ] Add architecture explanation
- [ ] Add usage examples (upload, download)
- [ ] Add Walrus concepts section
- [ ] Add wallet integration guide
- [ ] Add resources and links
- [ ] Add troubleshooting section
- [ ] Create gallery README template
- [ ] Test template variable replacement
- [ ] Generate test project and verify README
- [ ] Review README for clarity and completeness

## Success Criteria

- [ ] All use case templates have comprehensive READMEs
- [ ] Template variables properly replaced in generated projects
- [ ] Getting started section covers all setup steps
- [ ] Usage examples are clear and functional
- [ ] Troubleshooting section addresses common issues
- [ ] External resource links are valid
- [ ] Markdown formatting renders correctly
- [ ] Beginner-friendly language throughout

## Risk Assessment

**Risks**:
- README content becomes outdated with SDK updates
- Template variables not properly replaced
- Examples don't match actual code structure
- Documentation becomes too verbose

**Mitigation**:
- Link to external docs for detailed API reference
- Test template variable replacement
- Keep examples minimal and focused
- Use versioned SDK documentation links
- Review READMEs with each template update

## Security Considerations

- No security risks (documentation only)
- Ensure no secrets or keys in example .env
- Remind users to never commit .env files

## Next Steps

After completion:
- Proceed to Phase 8 (Testing and Validation)
- Consider adding video tutorials or GIFs
- Create CONTRIBUTING.md for project contributors
- Add badges for build status, version, license
- Link to community resources (Discord, forum)
