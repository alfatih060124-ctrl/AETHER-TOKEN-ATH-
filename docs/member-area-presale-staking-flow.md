# AETHER ATH Member Area and Presale-to-Staking Flow

## Scope in this branch

- Adds query-based page navigation for Home, Mining, Presale, Docs and member-area subpages.
- Moves staking, network/rank panels, and referral/leaderboard details behind the member-area UI gate.
- Adds package selection and staking-duration selection to the Presale form.
- Computes the estimated ATH amount from the live `ATHPresale.currentPriceUSD8()` quote using integer arithmetic.
- Keeps the transaction button disabled in staking-settlement mode until an audited atomic settlement contract is configured.
- Adds JavaScript syntax-check coverage for the new page router.

## Source package defaults (not a live-chain guarantee)

`ATHStaking.sol` initializes six package defaults: (1) 10–99 USDT, 180 days; (2) 100–499 USDT, 180 days; (3) 500–1,999 USDT, 365 days; (4) 2,000–9,999 USDT, 365 days; (5) 10,000–49,999 USDT, 730 days; (6) 50,000 USDT and above, 730 days.

The Presale page mirrors these source defaults for preview and client-side validation only. On-chain package records can be changed by contract administration, so before activation the application must read `packageCount()` and `packages(packageId)` from the verified Staking contract and use those live values; UI data must never authorize or determine contract terms.

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
