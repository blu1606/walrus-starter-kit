# Phase 4: SDK Layer (@mysten/walrus)

## Context Links

- [Main Plan](./plan.md)
- [PRD](../../POC/PRD.md)
- [Mysten Walrus SDK Research](../reports/researcher-260117-1353-mysten-walrus-sdk.md)
- [Phase 3: Template Base Layer](./phase-03-template-base-layer.md)

## Overview

**Created:** 2026-01-17  
**Priority:** High  
**Status:** completed | **Completed:** 2026-01-17 17:20  
**Estimated Effort:** 6 hours  
**Dependencies:** Phase 3 complete

## Key Insights

### From Research

1. **Relay Upload Pattern**: Use `writeBlobToUploadRelay()` for browser clients (avoids heavy encoding)
2. **Direct Download**: `readBlob(blobId)` returns `Uint8Array`
3. **Metadata Fetching**: `getBlobMetadata()` for size/encoding info
4. **Transaction Pattern**: Register blob requires signing (Build → Sign → Execute)
5. **HTTP Gateway**: Blobs accessible via `https://aggregator.../v1/{blobId}` for simple retrieval

### Critical API Pattern

```typescript
// Upload via relay (browser-friendly)
const result = await walrus.writeBlobToUploadRelay(dataUInt8Array, {
  nEpochs: 1,
});
const blobId = result.newlyCreated.blobObject.blobId;

// Download
const data = await walrus.readBlob(blobId);
```

## Requirements

### Functional

- Implement `StorageAdapter` interface from Phase 3
- Walrus client initialization
- Upload via relay (browser-optimized)
- Download blob data
- Metadata retrieval
- Error handling for network failures

### Technical

- `@mysten/walrus` v0.6.7+ integration
- `@mysten/sui` peer dependency
- TypeScript type safety
- Cross-network support (testnet/mainnet)

### Dependencies

- Phase 3: `StorageAdapter` interface

## Architecture

### SDK Layer Structure

```
templates/sdk-mysten/
├── src/
│   ├── client.ts               # WalrusClient singleton
│   ├── adapter.ts              # StorageAdapter implementation
│   ├── config.ts               # SDK configuration
│   └── types.ts                # Mysten-specific types
├── package.json                # @mysten/walrus dependencies
└── README.md                   # SDK-specific docs
```

### Client Initialization Pattern

```typescript
// templates/sdk-mysten/src/client.ts

import { WalrusClient } from '@mysten/walrus';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { loadEnv } from '../../base/src/utils/env.js';

let walrusClient: WalrusClient | null = null;

export function getWalrusClient(): WalrusClient {
  if (walrusClient) return walrusClient;

  const env = loadEnv();

  const suiClient = new SuiClient({
    url: env.suiRpc || getFullnodeUrl(env.suiNetwork as 'testnet' | 'mainnet'),
  });

  walrusClient = new WalrusClient({
    network: env.walrusNetwork as 'testnet' | 'mainnet',
    suiClient,
  });

  return walrusClient;
}
```

### Adapter Implementation

```typescript
// templates/sdk-mysten/src/adapter.ts

import type {
  StorageAdapter,
  BlobMetadata,
  UploadOptions,
} from '../../base/src/adapters/storage.js';
import { getWalrusClient } from './client.js';

export const mystenAdapter: StorageAdapter = {
  async upload(
    data: File | Uint8Array,
    options?: UploadOptions
  ): Promise<string> {
    const client = getWalrusClient();

    // Convert File to Uint8Array if needed
    const bytes =
      data instanceof File ? new Uint8Array(await data.arrayBuffer()) : data;

    // Use relay upload (browser-optimized)
    const result = await client.writeBlobToUploadRelay(bytes, {
      nEpochs: options?.epochs || 1,
    });

    return result.newlyCreated.blobObject.blobId;
  },

  async download(blobId: string): Promise<Uint8Array> {
    const client = getWalrusClient();
    return await client.readBlob(blobId);
  },

  async getMetadata(blobId: string): Promise<BlobMetadata> {
    const client = getWalrusClient();
    const metadata = await client.getBlobMetadata(blobId);

    return {
      blobId,
      size: metadata.size,
      contentType: metadata.contentType,
      createdAt: metadata.createdAt || Date.now(),
    };
  },

  async exists(blobId: string): Promise<boolean> {
    try {
      await this.getMetadata(blobId);
      return true;
    } catch {
      return false;
    }
  },
};
```

### Package Dependencies

```json
{
  "dependencies": {
    "@mysten/walrus": "^1.0.0",
    "@mysten/sui": "^1.10.0"
  }
}
```

## Related Code Files

### To Create

1. `templates/sdk-mysten/src/client.ts` - WalrusClient singleton
2. `templates/sdk-mysten/src/adapter.ts` - StorageAdapter implementation
3. `templates/sdk-mysten/src/config.ts` - Configuration helpers
4. `templates/sdk-mysten/src/types.ts` - Mysten-specific types
5. `templates/sdk-mysten/src/index.ts` - Public exports
6. `templates/sdk-mysten/package.json` - Dependencies
7. `templates/sdk-mysten/README.md` - Documentation

## Implementation Steps

### Step 1: Create SDK Directory (15 min)

1. Create structure:

```bash
cd templates
mkdir -p sdk-mysten/src
```

### Step 2: Configuration Layer (45 min)

2. Create `sdk-mysten/src/config.ts`:

```typescript
import type { WalrusNetwork } from '../../base/src/types/walrus.js';

export interface MystenWalrusConfig {
  network: WalrusNetwork;
  publisherUrl?: string;
  aggregatorUrl?: string;
  suiRpcUrl?: string;
}

export const NETWORK_CONFIGS: Record<WalrusNetwork, MystenWalrusConfig> = {
  testnet: {
    network: 'testnet',
    publisherUrl: 'https://publisher.walrus-testnet.walrus.space',
    aggregatorUrl: 'https://aggregator.walrus-testnet.walrus.space',
    suiRpcUrl: 'https://fullnode.testnet.sui.io:443',
  },
  mainnet: {
    network: 'mainnet',
    publisherUrl: 'https://publisher.walrus.space',
    aggregatorUrl: 'https://aggregator.walrus.space',
    suiRpcUrl: 'https://fullnode.mainnet.sui.io:443',
  },
  devnet: {
    network: 'devnet',
    publisherUrl: 'http://localhost:8080',
    aggregatorUrl: 'http://localhost:8081',
    suiRpcUrl: 'http://localhost:9000',
  },
};

export function getNetworkConfig(network: WalrusNetwork): MystenWalrusConfig {
  return NETWORK_CONFIGS[network];
}
```

3. Create `sdk-mysten/src/types.ts`:

```typescript
/**
 * Mysten-specific type extensions
 */

export interface MystenUploadResult {
  newlyCreated: {
    blobObject: {
      blobId: string;
      size: number;
    };
  };
}

export interface MystenBlobMetadata {
  size: number;
  encodingType: string;
  contentType?: string;
  createdAt?: number;
}
```

### Step 3: Client Singleton (1 hour)

4. Create `sdk-mysten/src/client.ts`:

```typescript
import { WalrusClient } from '@mysten/walrus';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { loadEnv } from '../../base/src/utils/env.js';
import { getNetworkConfig } from './config.js';
import type { WalrusNetwork } from '../../base/src/types/walrus.js';

/**
 * Global WalrusClient singleton
 * Initialized lazily on first use
 */
let walrusClient: WalrusClient | null = null;

/**
 * Get or create WalrusClient instance
 */
export function getWalrusClient(): WalrusClient {
  if (walrusClient) {
    return walrusClient;
  }

  const env = loadEnv();
  const network = env.walrusNetwork as WalrusNetwork;
  const config = getNetworkConfig(network);

  // Initialize Sui client
  const suiClient = new SuiClient({
    url:
      env.suiRpc ||
      config.suiRpcUrl ||
      getFullnodeUrl(network === 'testnet' ? 'testnet' : 'mainnet'),
  });

  // Initialize Walrus client
  walrusClient = new WalrusClient({
    network: network === 'testnet' ? 'testnet' : 'mainnet',
    suiClient,
    // Optional custom endpoints
    ...(env.walrusPublisher && { publisherUrl: env.walrusPublisher }),
    ...(env.walrusAggregator && { aggregatorUrl: env.walrusAggregator }),
  });

  return walrusClient;
}

/**
 * Reset client (useful for testing or network switching)
 */
export function resetWalrusClient(): void {
  walrusClient = null;
}
```

### Step 4: Adapter Implementation (1.5 hours)

5. Create `sdk-mysten/src/adapter.ts`:

```typescript
import type {
  StorageAdapter,
  BlobMetadata,
  UploadOptions,
  DownloadOptions,
} from '../../base/src/adapters/storage.js';
import { getWalrusClient } from './client.js';

/**
 * Mysten Walrus SDK implementation of StorageAdapter
 */
export class MystenStorageAdapter implements StorageAdapter {
  async upload(
    data: File | Uint8Array,
    options?: UploadOptions
  ): Promise<string> {
    const client = getWalrusClient();

    // Convert File to Uint8Array
    const bytes =
      data instanceof File ? new Uint8Array(await data.arrayBuffer()) : data;

    try {
      // Use relay upload for browser optimization
      // Relay handles erasure encoding/encryption
      const result = await client.writeBlobToUploadRelay(bytes, {
        nEpochs: options?.epochs || 1,
      });

      // Extract blob ID from response
      const blobId = result.newlyCreated.blobObject.blobId;

      return blobId;
    } catch (error) {
      throw new Error(
        `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async download(
    blobId: string,
    options?: DownloadOptions
  ): Promise<Uint8Array> {
    const client = getWalrusClient();

    try {
      // Range download not supported by SDK yet
      // Future: implement range requests via HTTP gateway
      const data = await client.readBlob(blobId);

      return data;
    } catch (error) {
      throw new Error(
        `Download failed for blob ${blobId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getMetadata(blobId: string): Promise<BlobMetadata> {
    const client = getWalrusClient();

    try {
      const metadata = await client.getBlobMetadata(blobId);

      return {
        blobId,
        size: metadata.size,
        contentType: metadata.contentType,
        createdAt: metadata.createdAt || Date.now(),
      };
    } catch (error) {
      throw new Error(
        `Failed to get metadata for blob ${blobId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async exists(blobId: string): Promise<boolean> {
    try {
      await this.getMetadata(blobId);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Singleton adapter instance
 */
export const storageAdapter = new MystenStorageAdapter();
```

### Step 5: Public Exports (30 min)

6. Create `sdk-mysten/src/index.ts`:

```typescript
/**
 * @mysten/walrus SDK Layer
 *
 * Implements the StorageAdapter interface using Mysten's official SDK
 */

export { getWalrusClient, resetWalrusClient } from './client.js';
export { MystenStorageAdapter, storageAdapter } from './adapter.js';
export { getNetworkConfig, NETWORK_CONFIGS } from './config.js';
export type { MystenUploadResult, MystenBlobMetadata } from './types.js';

// Re-export base types for convenience
export type {
  StorageAdapter,
  BlobMetadata,
  UploadOptions,
  DownloadOptions,
} from '../../base/src/adapters/storage.js';
```

### Step 6: Package Configuration (30 min)

7. Create `sdk-mysten/package.json`:

```json
{
  "name": "walrus-app-sdk-mysten",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "description": "Mysten Walrus SDK layer for walrus-starter-kit",
  "dependencies": {
    "@mysten/walrus": "^1.0.0",
    "@mysten/sui": "^1.10.0"
  },
  "peerDependencies": {
    "typescript": "^5.3.0"
  }
}
```

### Step 7: Documentation (45 min)

8. Create `sdk-mysten/README.md`:

````markdown
# Mysten Walrus SDK Layer

Official [Mysten Labs](https://mystenlabs.com/) SDK implementation for Walrus storage.

## Features

✅ **Relay Upload** - Browser-optimized uploads via relay nodes  
✅ **Direct Download** - Fast blob retrieval  
✅ **Metadata Queries** - Size, type, creation date  
✅ **Network Support** - Testnet, Mainnet, Devnet  
✅ **Type Safety** - Full TypeScript support

## Usage

```typescript
import { storageAdapter } from './sdk-mysten';

// Upload file
const blobId = await storageAdapter.upload(fileData, { epochs: 1 });

// Download file
const data = await storageAdapter.download(blobId);

// Get metadata
const metadata = await storageAdapter.getMetadata(blobId);
console.log(`Blob size: ${metadata.size} bytes`);
```
````

## Configuration

Set environment variables:

```bash
VITE_WALRUS_NETWORK=testnet
VITE_WALRUS_PUBLISHER=https://publisher.walrus-testnet.walrus.space
VITE_WALRUS_AGGREGATOR=https://aggregator.walrus-testnet.walrus.space
VITE_SUI_RPC=https://fullnode.testnet.sui.io:443
```

## API Reference

### `storageAdapter`

Singleton instance implementing `StorageAdapter` interface.

### `getWalrusClient()`

Get WalrusClient singleton (lazy initialization).

### `getNetworkConfig(network)`

Get network-specific configuration.

## Network Defaults

| Network | Publisher                                       | Aggregator                                       |
| ------- | ----------------------------------------------- | ------------------------------------------------ |
| testnet | `https://publisher.walrus-testnet.walrus.space` | `https://aggregator.walrus-testnet.walrus.space` |
| mainnet | `https://publisher.walrus.space`                | `https://aggregator.walrus.space`                |

## Resources

- [Walrus SDK Docs](https://sdk.mystenlabs.com/walrus)
- [Walrus Documentation](https://docs.walrus.site)
- [npm: @mysten/walrus](https://www.npmjs.com/package/@mysten/walrus)

````

### Step 8: Testing (1 hour)

9. Create test file `sdk-mysten/test/adapter.test.ts` (for validation):
```typescript
import { describe, it, expect } from 'vitest';
import { MystenStorageAdapter } from '../src/adapter.js';

describe('MystenStorageAdapter', () => {
  it('should implement StorageAdapter interface', () => {
    const adapter = new MystenStorageAdapter();

    expect(adapter).toHaveProperty('upload');
    expect(adapter).toHaveProperty('download');
    expect(adapter).toHaveProperty('getMetadata');
    expect(adapter).toHaveProperty('exists');
  });

  it('should handle upload errors gracefully', async () => {
    const adapter = new MystenStorageAdapter();
    const invalidData = new Uint8Array(0);

    await expect(
      adapter.upload(invalidData)
    ).rejects.toThrow('Upload failed');
  });
});
````

## Todo List

- [ ] Create `templates/sdk-mysten/src/` directory
- [ ] Write `config.ts` with network presets
- [ ] Write `types.ts` with Mysten-specific types
- [ ] Write `client.ts` with singleton pattern
- [ ] Write `adapter.ts` implementing StorageAdapter
- [ ] Write `index.ts` with public exports
- [ ] Write `package.json` with dependencies
- [ ] Write `README.md` documentation
- [ ] Create test file for validation
- [ ] Test adapter methods manually

## Success Criteria

### Functional Tests

- [ ] Upload returns valid blob ID (64-char hex)
- [ ] Download retrieves correct data
- [ ] Metadata returns size/type
- [ ] Exists check works for valid/invalid IDs
- [ ] Errors throw with clear messages

### Integration Tests

```typescript
// Test full upload-download cycle
const testData = new TextEncoder().encode('Hello Walrus');
const blobId = await storageAdapter.upload(testData);
const retrieved = await storageAdapter.download(blobId);

expect(new TextDecoder().decode(retrieved)).toBe('Hello Walrus');
```

### Type Safety Tests

- [ ] TypeScript compilation passes strict mode
- [ ] All imports resolve correctly
- [ ] Adapter implements full `StorageAdapter` interface

## Risk Assessment

### Potential Blockers

1. **@mysten/walrus API changes**: SDK updates break implementation
   - **Mitigation**: Pin exact version, monitor releases
2. **Network timeouts**: Relay uploads fail
   - **Mitigation**: Implement retry logic with exponential backoff
3. **Blob ID format changes**: Different encoding
   - **Mitigation**: Type validation on blob ID

### Contingency Plans

- If relay fails: Add fallback to direct upload (heavier but works)
- If metadata unavailable: Use HTTP gateway for size checks

## Security Considerations

### Phase-Specific Concerns

1. **Blob ID validation**: Prevent injection attacks
   - **Hardening**: Validate blob ID format (hex string)
2. **Large file uploads**: DoS via huge files
   - **Hardening**: Add size limits (e.g., 10MB for browser)
3. **Network configuration**: Malicious publisher URL
   - **Hardening**: Validate URLs (HTTPS only)

### Hardening Measures

```typescript
function validateBlobId(blobId: string): void {
  if (!/^[a-f0-9]{64}$/.test(blobId)) {
    throw new Error('Invalid blob ID format');
  }
}

function validateFileSize(data: Uint8Array, maxSize = 10 * 1024 * 1024): void {
  if (data.byteLength > maxSize) {
    throw new Error(
      `File too large: ${data.byteLength} bytes (max: ${maxSize})`
    );
  }
}
```

## Next Steps

After Phase 4 completion:

1. **Phase 5**: Create React framework layer (uses this adapter)
2. **Phase 6**: Build use case templates (consume adapter)
3. **Future**: Support additional community SDKs (using same interface)

### Dependencies for Next Phase

Phase 5 requires:

- Working `storageAdapter` ✅
- `getWalrusClient()` for advanced features ✅
- Type definitions ✅

### Open Questions

- Should we support direct upload as fallback? (Decision: Yes, add option)
- Add retry logic for network failures? (Decision: Yes, exponential backoff)
- Support streaming downloads? (Decision: Future feature)
