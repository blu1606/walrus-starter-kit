# Phase 03: Sponsored Transaction API

## Context Links
- [Enoki Sponsored Txns](./research/researcher-enoki-zklogin-report.md#3-sponsored-transactions-architecture)
- [MyLink API Pattern](./research/researcher-enoki-zklogin-report.md#7-code-examples-from-mylink-production)
- [Security Best Practices](./research/researcher-enoki-zklogin-report.md#5-security-best-practices)

## Overview
- **Priority**: P1 (Enables gasless uploads)
- **Status**: pending
- **Effort**: 4-6 hours
- **Description**: Server-side API route for creating and executing sponsored transactions with rate limiting

## Key Insights

Sponsored transaction lifecycle:
1. Frontend builds transaction bytes (no gas coin)
2. POST /api/sponsor-tx (action: create) → returns bytes + digest
3. Frontend signs with zkLogin keypair
4. POST /api/sponsor-tx (action: execute, signature) → executes on-chain
5. Server enforces rate limits (20 tx/day per address)

MyLink production patterns:
- EnokiClient ONLY on server (ENOKI_SECRET_KEY never exposed)
- allowedMoveCallTargets configured in Enoki Console
- Rate limit stored in-memory Map (production uses Redis)
- Sanitize error messages (no stack traces to frontend)

## Requirements

### Functional
- `/api/sponsor-tx` API route with create + execute actions
- Server-side EnokiClient with secret key
- Rate limiting (20 tx/day per address)
- Support for arbitrary transaction bytes
- Error handling with user-friendly messages

### Non-Functional
- Response time <2 seconds (excluding blockchain confirmation)
- Thread-safe rate limit storage (in-memory Map + daily cleanup)
- CORS headers for frontend access
- Input validation (Zod schemas)
- No secret key exposure in errors or logs

## Architecture

### Request Flow
```
[Frontend]
  ↓ POST /api/sponsor-tx { action: 'create', transactionKindBytes, sender }
[Server] EnokiClient.createSponsoredTransaction()
  ↓ Returns { bytes, digest }
[Frontend] Signs bytes with zkLogin keypair
  ↓ POST /api/sponsor-tx { action: 'execute', digest, signature }
[Server] EnokiClient.executeSponsoredTransaction()
  ↓ Returns { effects, digest }
[Blockchain] Transaction confirmed
```

### Rate Limiting Strategy
```typescript
// In-memory rate limit store
Map<address, { count: number, resetAt: number }>

// Check:
if (count >= 20 && Date.now() < resetAt) throw RateLimitError

// Increment:
count++ after successful execute

// Cleanup:
setInterval(() => clearExpiredEntries(), 1 hour)
```

## Related Code Files

### Files to Create

| File Path | Purpose | Lines |
|-----------|---------|-------|
| `templates/enoki/app/api/sponsor-tx/route.ts` | Next.js API route for sponsored txns | ~200 |
| `templates/enoki/lib/rate-limit.ts` | In-memory rate limiting logic | ~80 |
| `templates/enoki/lib/enoki-server.ts` | Server-side EnokiClient singleton | ~40 |
| `templates/enoki/lib/api-schemas.ts` | Zod schemas for API validation | ~50 |

### Files to Modify

| File Path | Changes | Rationale |
|-----------|---------|-----------|
| `templates/enoki/.env.example` | Add ENOKI_SECRET_KEY comment | Document server-side env var |
| `templates/enoki/README.md` | Add API route documentation | Usage guide |

## Implementation Steps

### Step 1: Create Server-Side EnokiClient Singleton (30 min)
```typescript
// templates/enoki/lib/enoki-server.ts
import { EnokiClient } from '@mysten/enoki';
import { loadEnokiEnv } from './constants';

let enokiClient: EnokiClient | null = null;

export function getEnokiClient(): EnokiClient {
  if (!enokiClient) {
    const { ENOKI_SECRET_KEY } = loadEnokiEnv();

    if (!ENOKI_SECRET_KEY) {
      throw new Error('ENOKI_SECRET_KEY not set (server-side only)');
    }

    enokiClient = new EnokiClient({
      apiKey: ENOKI_SECRET_KEY,
    });
  }

  return enokiClient;
}
```

### Step 2: Implement Rate Limiting (60 min)
```typescript
// templates/enoki/lib/rate-limit.ts
interface RateLimitEntry {
  count: number;
  resetAt: number; // Unix timestamp
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const DAILY_LIMIT = 20;
const RESET_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

export class RateLimitError extends Error {
  constructor(public resetAt: number) {
    super('Daily transaction limit reached');
    this.name = 'RateLimitError';
  }
}

export function checkRateLimit(address: string): { allowed: boolean; resetAt: number } {
  const entry = rateLimitStore.get(address);

  if (!entry) {
    return { allowed: true, resetAt: Date.now() + RESET_INTERVAL_MS };
  }

  const now = Date.now();

  // Reset if expired
  if (now >= entry.resetAt) {
    rateLimitStore.delete(address);
    return { allowed: true, resetAt: now + RESET_INTERVAL_MS };
  }

  // Check limit
  if (entry.count >= DAILY_LIMIT) {
    return { allowed: false, resetAt: entry.resetAt };
  }

  return { allowed: true, resetAt: entry.resetAt };
}

export function incrementRateLimit(address: string) {
  const entry = rateLimitStore.get(address);

  if (!entry) {
    rateLimitStore.set(address, {
      count: 1,
      resetAt: Date.now() + RESET_INTERVAL_MS,
    });
  } else {
    entry.count++;
  }
}

// Cleanup expired entries (run every hour)
setInterval(() => {
  const now = Date.now();
  for (const [address, entry] of rateLimitStore.entries()) {
    if (now >= entry.resetAt) {
      rateLimitStore.delete(address);
    }
  }
}, 60 * 60 * 1000);
```

### Step 3: Create API Request Schemas (20 min)
```typescript
// templates/enoki/lib/api-schemas.ts
import { z } from 'zod';

export const CreateSponsoredTxSchema = z.object({
  action: z.literal('create'),
  transactionKindBytes: z.string(), // base64
  sender: z.string().regex(/^0x[a-f0-9]{64}$/), // Sui address
});

export const ExecuteSponsoredTxSchema = z.object({
  action: z.literal('execute'),
  digest: z.string(),
  signature: z.string(), // base64
});

export const SponsorTxRequestSchema = z.discriminatedUnion('action', [
  CreateSponsoredTxSchema,
  ExecuteSponsoredTxSchema,
]);

export type SponsorTxRequest = z.infer<typeof SponsorTxRequestSchema>;
```

### Step 4: Implement API Route (120 min)
```typescript
// templates/enoki/app/api/sponsor-tx/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getEnokiClient } from '../../../lib/enoki-server';
import { checkRateLimit, incrementRateLimit, RateLimitError } from '../../../lib/rate-limit';
import { SponsorTxRequestSchema } from '../../../lib/api-schemas';
import { loadEnokiEnv } from '../../../lib/constants';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = SponsorTxRequestSchema.parse(body);

    const enokiClient = getEnokiClient();
    const { NEXT_PUBLIC_SUI_NETWORK } = loadEnokiEnv();

    if (parsed.action === 'create') {
      // Check rate limit BEFORE creating transaction
      const { allowed, resetAt } = checkRateLimit(parsed.sender);

      if (!allowed) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: 'Daily transaction limit (20) reached',
            resetAt,
          },
          { status: 429 }
        );
      }

      // Create sponsored transaction
      const sponsoredTx = await enokiClient.createSponsoredTransaction({
        network: NEXT_PUBLIC_SUI_NETWORK,
        transactionKindBytes: parsed.transactionKindBytes,
        sender: parsed.sender,
        allowedAddresses: [parsed.sender],
        // allowedMoveCallTargets configured in Enoki Console
      });

      return NextResponse.json({
        bytes: sponsoredTx.bytes,
        digest: sponsoredTx.digest,
      });
    }

    if (parsed.action === 'execute') {
      // Execute sponsored transaction
      const result = await enokiClient.executeSponsoredTransaction({
        digest: parsed.digest,
        signature: parsed.signature,
      });

      // Increment rate limit ONLY on successful execution
      // Extract sender from result (or pass in request body)
      if (result.effects?.status?.status === 'success') {
        // TODO: Extract sender from transaction effects
        // For now, this requires passing sender in execute request too
        // incrementRateLimit(sender);
      }

      return NextResponse.json({
        digest: result.digest,
        effects: result.effects,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Sponsor transaction error:', error);

    if (error instanceof RateLimitError) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: error.message,
          resetAt: error.resetAt,
        },
        { status: 429 }
      );
    }

    // Sanitize error message (no stack traces)
    const message = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Sponsor transaction failed',
        message: message.replace(/ENOKI_SECRET_KEY|apiKey/gi, '[REDACTED]'),
      },
      { status: 500 }
    );
  }
}

// CORS headers for frontend access
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
```

### Step 5: Update Environment Example (10 min)
```env
# templates/enoki/.env.example (add comment)

# Server-side (CRITICAL: Never expose to frontend)
ENOKI_SECRET_KEY=enoki_secret_xxx  # From Enoki Console > API Keys
```

### Step 6: Document API Usage in README (30 min)
````markdown
## API Routes

### POST /api/sponsor-tx

Sponsor transactions via Enoki for gasless execution.

**Create Transaction:**
```json
{
  "action": "create",
  "transactionKindBytes": "base64-encoded-bytes",
  "sender": "0x..."
}
```

**Response:**
```json
{
  "bytes": "base64-sponsored-bytes",
  "digest": "tx-digest"
}
```

**Execute Transaction:**
```json
{
  "action": "execute",
  "digest": "tx-digest",
  "signature": "base64-signature"
}
```

**Rate Limiting:**
- 20 transactions per address per 24 hours
- Returns 429 status with `resetAt` timestamp when exceeded
````

### Step 7: Add TypeScript Strict Mode Validation (10 min)
```bash
# Validate API route compiles
cd templates/enoki
npx tsc --noEmit
```

## Todo List

- [ ] Create `enoki-server.ts` with EnokiClient singleton
- [ ] Implement `rate-limit.ts` with Map-based storage
- [ ] Create `api-schemas.ts` with Zod validation
- [ ] Implement `/api/sponsor-tx/route.ts` with create + execute
- [ ] Add CORS headers to API route (OPTIONS handler)
- [ ] Update `.env.example` with ENOKI_SECRET_KEY comment
- [ ] Document API usage in README
- [ ] Add cleanup interval for expired rate limit entries
- [ ] Test rate limit enforcement (mock 21 requests)
- [ ] Test error handling (invalid tx bytes, network failures)
- [ ] Validate TypeScript strict mode compliance
- [ ] Test CORS headers with frontend fetch()

## Success Criteria

### Functional Tests
- [ ] Create action returns bytes + digest
- [ ] Execute action submits transaction to blockchain
- [ ] Rate limit blocks 21st request in 24 hours
- [ ] Rate limit resets after 24 hours
- [ ] Invalid request body returns 400 with Zod errors
- [ ] Network failure returns 500 with sanitized message
- [ ] ENOKI_SECRET_KEY never appears in error responses

### Performance
- [ ] Create action responds in <1 second
- [ ] Execute action responds in <2 seconds (excl blockchain)
- [ ] Rate limit check adds <10ms latency

### Security
- [ ] Secret key only loaded on server (not bundled to frontend)
- [ ] Error messages sanitized (no stack traces)
- [ ] CORS allows only trusted origins (or * for public API)
- [ ] Rate limit prevents DoS (20 tx/day limit enforced)

## Risk Assessment

### High Risk
- **ENOKI_SECRET_KEY Exposure**
  - Impact: Unlimited sponsored transactions (cost attack)
  - Mitigation:
    - Server-side only (never in client bundle)
    - Sanitize error messages
    - Add .env.example warning comment
    - Audit Webpack/Vite bundle for leaks

### Medium Risk
- **Rate Limit Bypass (Sybil Attack)**
  - Impact: Attacker creates multiple addresses for unlimited txns
  - Mitigation:
    - Add IP-based rate limiting (production)
    - Require CAPTCHA for first transaction
    - Monitor Enoki credit usage

- **In-Memory Rate Limit Loss (Server Restart)**
  - Impact: Rate limits reset on deployment
  - Mitigation:
    - Document limitation in README
    - Upgrade to Redis/DB in production
    - Add persistence layer in Phase 08 (optional)

### Low Risk
- API route not found (deployment config)
  - Mitigation: Test deployment on Vercel/Netlify, document Next.js App Router requirements

## Security Considerations

### Server-Side Only Validation
```typescript
// Prevent client bundling by checking environment
if (typeof window !== 'undefined') {
  throw new Error('EnokiClient must only run on server');
}
```

### Allowlist Configuration
- Configure `allowedMoveCallTargets` in Enoki Console
- Restrict to Walrus upload function IDs only
- Document required Move function IDs in README

### Rate Limit Storage
- **Development**: In-memory Map (acceptable)
- **Production**: Redis or database (persist across restarts)
- **Security**: Never trust client-side rate limit checks

## Next Steps

After Phase 03 completion:
1. **Phase 04**: Extend WalrusStorageAdapter to use sponsored API
2. **Testing**: Integration test for complete sponsored upload flow
3. **Enoki Console**: Configure allowedMoveCallTargets for Walrus
