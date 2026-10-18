# AETHER ATH Member Area and Presale-to-Staking Flow

## Scope in this branch

- Adds query-based page navigation for Home, Mining, Presale, Docs and member-area subpages.
- Moves staking, network/rank panels, and referral/leaderboard details behind the member-area UI gate.
- Adds package selection and staking-duration selection to the Presale form.
- Computes the estimated ATH amount from the live `ATHPresale.currentPriceUSD8()` quote using integer arithmetic.
- Keeps the transaction button disabled in staking-settlement mode until an audited atomic settlement contract is configured.
- Adds JavaScript syntax-check coverage for the new page router.

## Source package defaults (not a live-chain guarantee)

`ATHStaking.sol` now initializes three duration choices under one shared investment range of $10–$50,000: (1) 180 days at 0.35% daily (35 bps); (2) 365 days at 0.45% daily (45 bps); (3) 730 days at 0.55% daily (55 bps). The duration option is represented by the on-chain package ID. The contract caps the investment at $50,000 inclusive.

The Presale page mirrors these source defaults for preview and client-side validation only. Existing positions snapshot their rate and lock duration at creation; later package administration does not rewrite existing positions. On-chain package records can be changed by contract administration, so before activation the application must read `packageCount()` and `packages(packageId)` from the verified Staking contract and use those live values; UI data must never authorize or determine contract terms.

## Important contract mismatch

The current `ATHPresale.buyATH(athAmount,maxPaymentAmount)` transfers ATH from the Presale reserve to the buyer wallet. The current `ATHStaking.stake(packageId,amountUSDT,referrer)` requires the buyer to already hold ATH and approve the Staking contract. Therefore the current deployed interfaces do **not** provide atomic USDT payment + Presale purchase + staking.

The UI deliberately fails closed rather than sending a purchase that contradicts the requested flow. Do not enable real purchases from this flow until a reviewed contract design provides an atomic path, with explicit package and lock duration validation, trusted price calculation, USDT transfer handling, staking principal accounting, referral binding, replay/reentrancy protections, and tests for rollback on failure.

## Atomic integration design

The detailed design and security test matrix are maintained in [`atomic-presale-staking-integration-spec.md`](./atomic-presale-staking-integration-spec.md). It is a design specification only, not an implementation or approval to deploy.

## Remaining before production

1. Implement and review the atomic Presale-to-Staking contract interface and unit/integration tests.
2. Connect package duration to the actual staking contract's authoritative package configuration; do not accept an arbitrary UI-only duration.
3. Wire a wallet-authenticated member data view for each tab and a verified event source for reward history.
4. Run repository checks and security audit; review CI and deploy only after explicit production approval.
5. Verify mobile/desktop routes and ensure production transactions remain disabled until audited deployment and config validation.

## Access-control note

The member-area gate is client-side presentation only. It must not be treated as a security boundary or as proof of wallet ownership for privileged operations. Contract authorization and server-side checks remain authoritative.


## Duration-based single staking package

The source package model is now one shared amount range ($10–$50,000 inclusive) with three duration selections: 180 days / 0.35% daily, 365 days / 0.45% daily, and 730 days / 0.55% daily. The selected duration maps to the authoritative on-chain package ID. This is a source change only; the UI remains fail-closed until a verified, audited atomic settlement deployment is available.
