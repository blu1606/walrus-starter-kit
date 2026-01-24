# Phase 09: E2E Testing

## Overview
- **Effort**: 4-6h | **Priority**: P1 | **Status**: pending
- End-to-end tests with real blockchain/Walrus

## E2E Scenarios

### Scenario 1: Gasless Upload (Enoki)
1. User logs in with Google OAuth
2. Uploads file via Enoki-sponsored transaction
3. Verifies blob stored on Walrus
4. Rate limit triggered after 20 uploads

### Scenario 2: Token-Gated Content (Seal)
1. User encrypts file for specific address
2. Uploads encrypted blob
3. Recipient decrypts and downloads
4. Unauthorized user denied access

### Scenario 3: Marketplace Trading (DeepBook)
1. User creates listing for blob-backed asset
2. Buyer places order
3. Order matched, blob ownership transferred
4. Funds released from escrow

## Tools
- Playwright for browser automation
- Sui testnet faucet for gas
- Mock OAuth provider for testing

## Success Criteria
- [ ] All 3 scenarios pass on testnet
- [ ] No manual intervention required
- [ ] Tests run in CI/CD pipeline
