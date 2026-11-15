# ATH Price Registry Verification — 2026-11-16

## Scope
Read-only source inspection of `contracts/ATHPriceRegistry.sol` on production `main` at `53a606fde30ba71836cc1278aeae86eb427a7e48`. This note is committed only to `audit/ath-staking-rank-decision-lock`. No source/runtime changes, deployment, or Mainnet calls.

## Confirmed findings

### ORA-001 — Market oracle has no on-chain freshness or sanity checks (High)
`_readMarketPrice()` checks only that an oracle address exists and that `getPrice()` is greater than zero. It does not validate update timestamp/freshness, confidence, decimal scale, maximum deviation, TWAP, or a bounded price range. Because Staking uses this price for principal/reward/salary conversion, a stale or manipulated oracle value can affect token amounts and liabilities. The exact safeguards must be selected for the oracle implementation and market design; a simple nonzero check is insufficient.

### ORA-002 — Owner can replace market oracle after official listing (High)
`activateOfficialListing()` is one-way, but `setMarketPriceOracle()` remains callable by the owner without checking `officialListingActivated`. Therefore the oracle can still be replaced after the listing flag is activated. Listing activation is not equivalent to locking oracle governance. Remediation options include immutable oracle selection before activation, a post-activation prohibition, or a timelocked governed update with explicit emergency controls and monitoring. Do not select one without governance approval.

### ORA-003 — Holder target is an owner assertion (Medium)
`recordHolderCount(newCount)` accepts an arbitrary owner-supplied number, and `listingReady()` trusts that number. The contract does not derive unique holders or verify a snapshot/proof. The UI or public disclosure must not present this as an independently on-chain verified holder count. A controlled attestation/snapshot process and audit trail are needed if this mechanism remains.

### ORA-004 — Holder count remains mutable after listing (Medium)
`recordHolderCount()` has no `officialListingActivated` guard. Even after activation, the recorded count can be changed. It does not alter the market price path directly, but it weakens the meaning of the recorded listing gate and historical evidence. Freeze the field after activation or define an explicit post-listing reporting model.

## Required tests before closure
- Oracle returns zero, stale timestamp, invalid decimals, extreme deviation, and reverting response.
- Oracle address replacement before activation and attempted replacement after activation.
- Listing activation with holder count below and at target.
- Holder count mutation after activation.
- Price conversion effects on stake, reward claim, rank salary, and reserve runway under oracle edge cases.

## Status
All four are open findings. No remediation or test execution is claimed.