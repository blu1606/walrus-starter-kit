# Phase 07: Move Smart Contracts

## Context
[Access Control Patterns](./research/researcher-deepbook-seal-report.md#3-move-smart-contracts)

## Overview
- **Effort**: 6-10h | **Priority**: P2 | **Status**: pending
- Move contracts for marketplace and access control

## Contracts to Create
1. **BlobMarket.move** (marketplace escrow, ~200 lines)
2. **AccessControl.move** (capability patterns, ~150 lines)

## BlobMarket.move Structure
```move
struct Listing has key, store {
    id: UID,
    blob_id: vector<u8>,
    seller: address,
    price: u64,
}

public fun create_listing(
    blob_id: vector<u8>,
    price: u64,
    ctx: &mut TxContext
) { /* ... */ }

public fun purchase_listing(
    listing: &mut Listing,
    payment: Coin<SUI>,
    ctx: &mut TxContext
) { /* ... */ }
```

## Success Criteria
- [ ] Deploy contracts to testnet
- [ ] Create listing for blob
- [ ] Purchase listing (escrow + transfer)
- [ ] Grant access capability
- [ ] Security audit checklist passed
