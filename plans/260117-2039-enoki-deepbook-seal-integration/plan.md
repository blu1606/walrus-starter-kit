---
title: "Advanced Features Integration: Enoki zkLogin, DeepBook DeFi & Seal Encryption"
description: "Premium template layers: zkLogin auth with gasless uploads, DeFi trading marketplace, token-gated content encryption"
status: pending
priority: P1
effort: 50h
branch: main
tags: [enoki, zklogin, deepbook, seal, encryption, defi, sponsored-transactions]
created: 2026-01-17
---

# Advanced Features Integration Plan

## Context

Extension of Walrus Starter Kit with 3 premium template layers targeting enterprise/DeFi use cases. Builds on existing layered architecture (base → SDK → framework → use-case) with new advanced layers.

**Target ROI:**
- **Enoki zkLogin**: 🔥🔥🔥 10x user adoption (social login + gasless txns)
- **DeepBook DeFi**: 🔥🔥 Opens DeFi/marketplace positioning
- **Seal Encryption**: 🔥🔥🔥 Enterprise privacy + token-gating use cases

## Goals

1. **Enoki Template Layer** (Priority: P1)
   - Social login via zkLogin (Google OAuth)
   - Sponsored transactions for gasless uploads
   - Dual wallet support (zkLogin + standard wallets)
   - Server-side API for transaction sponsorship
   - Rate limiting (20 tx/day per address)

2. **DeepBook Template Layer** (Priority: P2)
   - CLOB trading UI (order book, charts, order forms)
   - Blob-backed asset marketplace
   - Move contracts for escrow + price discovery
   - Integration with Walrus metadata

3. **Seal Encryption Layer** (Priority: P1)
   - Identity-based encryption utilities
   - Token-gated content access
   - Move contracts for capability patterns
   - Encrypted upload/download flows

## Architecture Decisions

### Layer Composition Strategy
```
Base Layer (existing)
  ↓
SDK Layer (sdk-mysten, existing)
  ↓
Framework Layer (react, existing)
  ↓
Advanced Layers (NEW):
  ├── enoki/ (zkLogin + sponsored txns)
  ├── defi-deepbook/ (CLOB trading)
  └── metadata-seal/ (encryption + access control)
```

### Adapter Pattern Extensions
- **SponsoredWalrusAdapter**: Extends WalrusStorageAdapter with sponsored execution
- **EncryptedWalrusAdapter**: Wraps upload/download with Seal encryption
- **MarketplaceAdapter**: Combines Walrus + DeepBook for asset trading

### Multi-Wallet Architecture
```typescript
// Unified session management
const { address, isLoggedIn, isUsingEnoki } = useSession();
// Checks BOTH: useZkLogin() and useCurrentAccount()
```

## Implementation Phases

| Phase | Name | Effort | Priority | Status |
|-------|------|--------|----------|--------|
| 01 | Enoki Provider Setup | 2-3h | P1 | pending |
| 02 | zkLogin Auth Flow | 3-4h | P1 | pending |
| 03 | Sponsored Transaction API | 4-6h | P1 | pending |
| 04 | Walrus Adapter Extension | 3-4h | P1 | pending |
| 05 | DeepBook Integration | 8-12h | P2 | pending |
| 06 | Seal Encryption Utils | 4-6h | P1 | pending |
| 07 | Move Contracts | 6-10h | P2 | pending |
| 08 | Integration Testing | 4-6h | P1 | pending |
| 09 | E2E Testing | 4-6h | P1 | pending |
| 10 | Documentation | 2-3h | P1 | pending |

**Total Effort**: 40-60 hours (~1-2 months for solo developer)

## Timeline

- **Week 1-2**: Enoki zkLogin (Phases 1-4) - Core authentication
- **Week 3-4**: Seal Encryption (Phase 6) - Privacy features
- **Week 5-7**: DeepBook DeFi (Phase 5, 7) - Trading marketplace
- **Week 8**: Testing + Documentation (Phases 8-10)

## Success Criteria

### Functional Requirements
- [ ] Social login (Google) working end-to-end
- [ ] Gasless Walrus uploads via sponsored txns
- [ ] Rate limiting prevents abuse (20 tx/day)
- [ ] Encrypted blobs with address-based access control
- [ ] DeepBook order placement for blob-backed assets
- [ ] Complete E2E tests for all flows

### Non-Functional Requirements
- [ ] No breaking changes to existing templates
- [ ] Backward compatible adapter pattern
- [ ] Zero config for basic use (sensible defaults)
- [ ] Production-ready error handling
- [ ] Security audit checklist passed
- [ ] Documentation includes migration guides

### Quality Gates
- [ ] TypeScript strict mode with no errors
- [ ] 90%+ test coverage for new code
- [ ] ESLint + Prettier compliance
- [ ] All E2E scenarios green
- [ ] Rate limiting tested under load
- [ ] Security review for Move contracts

## Risk Assessment

### High Risk
1. **Move Contract Audit**
   - Impact: Critical (financial loss potential)
   - Mitigation: Budget $10k-$25k for audit, use proven patterns
   - Timeline: 2-3 weeks for external review

2. **Enoki Console Configuration**
   - Impact: High (sponsored txns may fail)
   - Mitigation: Document allowedMoveCallTargets, test against testnet
   - Dependency: Enoki team support

3. **zkLogin Session Expiry**
   - Impact: Medium (poor UX if auto-refresh fails)
   - Mitigation: Implement graceful re-auth flow, session warnings

### Medium Risk
1. **DeepBook Liquidity**
   - Impact: Medium (trades may fail if no liquidity)
   - Mitigation: Document liquidity requirements, provide testnet faucet guide

2. **Seal Decryption Performance**
   - Impact: Low-Medium (latency for large blobs)
   - Mitigation: Benchmark, document performance characteristics

3. **Multi-SDK Compatibility**
   - Impact: Low (Enoki/Seal may not work with tusky/hibernuts SDKs)
   - Mitigation: Limit advanced layers to mysten SDK only

## Security Considerations

### API Key Management
- Public keys: `NEXT_PUBLIC_ENOKI_API_KEY` (client-side)
- Secret keys: `ENOKI_SECRET_KEY` (server-side only, never exposed)
- Environment validation with Zod schemas

### Rate Limiting
- Per-address daily limits (20 tx/day default)
- Server-side enforcement (not client-side)
- Cleanup logic for expired rate limit entries

### Access Control
- Capability-based patterns in Move (AccessPolicy struct)
- Address whitelisting for encrypted blob access
- JWT validation for OAuth callbacks

### Audit Checklist
- [ ] Path traversal prevention in template paths
- [ ] Input validation for all API routes
- [ ] Move contract reentrancy guards
- [ ] Encrypted storage of sensitive data (Seal)
- [ ] CORS configuration for sponsor-tx API
- [ ] Secret rotation procedures documented

## Dependencies

### External Dependencies
- `@mysten/enoki` (latest stable)
- `@mysten/deepbook-v3-sdk` (v3.x)
- `@mysten/walrus-seal-sdk` (experimental)
- `@mysten/sui` ^1.10.0 (peer dependency)

### Development Dependencies
- Sui CLI for Move contract compilation
- Enoki Console account (free tier for testing)
- Google OAuth credentials (testnet + production)

### Team Dependencies
- Move contract audit firm (external)
- Enoki support team (for allowedMoveCallTargets config)
- UX review for social login flows

## Next Steps

1. **Phase 01**: Create `templates/enoki/` directory structure
2. **Research**: Confirm Enoki Console setup for Walrus upload targets
3. **Tooling**: Set up Move contract build pipeline
4. **Security**: Draft Move contract audit scope document

## File References

- **Research Reports**:
  - [Enoki zkLogin Research](./research/researcher-enoki-zklogin-report.md)
  - [DeepBook + Seal Research](./research/researcher-deepbook-seal-report.md)
- **Context Docs**:
  - [Codebase Summary](../../docs/codebase-summary.md)
  - [System Architecture](../../docs/system-architecture.md)
  - [Code Standards](../../docs/code-standards.md)

## Unresolved Questions

1. Enoki Console allowedMoveCallTargets for Walrus upload - need list of Move function IDs
2. Cost structure for sponsored txns (Enoki credit system) - confirm budget
3. Testnet vs mainnet migration for zkLogin sessions - session portability?
4. DeepBook V3 liquidity provider rewards for blob-backed assets - incentive structure?
5. Seal decryption latency benchmarks for high-frequency trading scenarios
6. Audit firm selection and timeline (2-3 weeks feasible?)
