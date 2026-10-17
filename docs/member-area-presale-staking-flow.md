# AETHER ATH Member Area and Presale-to-Staking Flow

## Scope in this branch

- Adds query-based page navigation for Home, Mining, Presale, Docs and member-area subpages.
- Moves staking, network/rank panels, and referral/leaderboard details behind the member-area UI gate.
- Adds package selection and staking-duration selection to the Presale form.
- Computes the estimated ATH amount from the live `ATHPresale.currentPriceUSD8()` quote using integer arithmetic.
- Keeps the transaction button disabled in staking-settlement mode until an audited atomic settlement contract is configured.
- Adds JavaScript syntax-check coverage for the new page router.

## Important contract mismatch

The current `ATHPresale.buyATH(athAmount,maxPaymentAmount)` transfers ATH from the Presale reserve to the buyer wallet. The current `ATHStaking.stake(packageId,amountUSDT,referrer)` requires the buyer to already hold ATH and approve the Staking contract. Therefore the current deployed interfaces do **not** provide atomic USDT payment + Presale purchase + staking.

The UI deliberately fails closed rather than sending a purchase that contradicts the requested flow. Do not enable real purchases from this flow until a reviewed contract design provides an atomic path, with explicit package and lock duration validation, trusted price calculation, USDT transfer handling, staking principal accounting, referral binding, replay/reentrancy protections, and tests for rollback on failure.

## Remaining before production

1. Implement and review the atomic Presale-to-Staking contract interface and unit/integration tests.
2. Connect package duration to the actual staking contract's authoritative package configuration; do not accept an arbitrary UI-only duration.
3. Wire a wallet-authenticated member data view for each tab and a verified event source for reward history.
4. Run repository checks and security audit; review CI and deploy only after explicit production approval.
5. Verify mobile/desktop routes and ensure production transactions remain disabled until audited deployment and config validation.

## Access-control note

The member-area gate is client-side presentation only. It must not be treated as a security boundary or as proof of wallet ownership for privileged operations. Contract authorization and server-side checks remain authoritative.
