# Phase 05: DeepBook DeFi Integration

## Context
[DeepBook Research](./research/researcher-deepbook-seal-report.md#1-deepbook-v3-integration)

## Overview
- **Effort**: 8-12h | **Priority**: P2 | **Status**: pending
- CLOB trading UI for blob-backed assets

## Files to Create
- `templates/defi-deepbook/hooks/useDeepBook.ts` (~150 lines)
- `templates/defi-deepbook/components/TradingUI.tsx` (~200 lines)
- `templates/defi-deepbook/components/OrderBook.tsx` (~120 lines)
- `templates/defi-deepbook/lib/deepbook-client.ts` (~80 lines)

## Key Components
1. Order placement (limit/market)
2. Order book display (bids/asks)
3. Price chart integration
4. Blob metadata linking

## Success Criteria
- [ ] Place limit order for blob-backed asset
- [ ] Display order book real-time
- [ ] Cancel orders
- [ ] Link BlobId to DeepBook PoolId
