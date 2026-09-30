# ATH v3.3 Testnet Acceptance Checklist

## A. Zero-cost source gate — must pass before any tBNB is used

- [x] Fixed supply = 1,000,000,000 ATH.
- [x] No post-deployment mint function.
- [x] Mining reserve = 700,000,000 ATH.
- [x] Liquidity reserve = 200,000,000 ATH.
- [x] Team & Dev = 50,000,000 ATH with 365-day lock.
- [x] Marketing = 50,000,000 ATH.
- [x] Daily base reward = 1 ATH.
- [x] Daily claim window = 00:05:00–23:59:59 UTC.
- [x] Missed daily reward expires and does not accumulate.
- [x] Referral tiers = +10% through +50%.
- [x] Power Booster = 2x, 30 days, +100 Hash.
- [x] Double Power = 3x on top of active Power Booster and requires 5 referrals.
- [x] Booster prices owner-configurable.
- [x] Initial vesting = 10% / 5% / 5% / 80%.
- [x] 12 recurring cycles.
- [x] Cycle entry burn = 10%.
- [x] Cycle unlock = 10% +30d / 5% +60d / 5% +90d.
- [x] Cycle rollover = 70% at 180d.
- [x] Final settlement = 60% burn / 40% holder; no Cycle 13.
- [x] Explorer-friendly holder read functions.
- [x] RewardCalculated / RewardClaimed / RewardExpired evidence.
- [x] VestingCreated / VestingCycleEntered / ATHBurned / VestingFinalSettled evidence.
- [x] Permissionless reward snapshot/expiry batch functions.
- [x] Keeper batch cap = 50.
- [x] On-chain miner registry with paginated read access.
- [x] Miner registry page cap = 200.
- [x] Keeper runtime is fail-closed and Testnet-only.
- [x] Mainnet gates fail-closed.
- [x] Local full-tokenomics deployment rehearsal passes.
- [x] Local holder flow passes.
- [x] EIP-170 bytecode size gate passes.
- [x] Deterministic ABI/release package generation passes.

## B. External input required before BSC Testnet deployment

- [ ] Dedicated deployer balance >= 0.02 tBNB.

This is the only input required to start Step 25. Real BNB is not required.

## C. One-shot BSC Testnet deployment

- [ ] Rerun Testnet preflight.
- [ ] Confirm chain ID = 97.
- [ ] Confirm Testnet role mode/address policy.
- [ ] Temporarily set `TESTNET_DEPLOY_APPROVED=true`.
- [ ] Run the one-shot deployment exactly once.
- [ ] Capture ATH token address.
- [ ] Capture MiningAirdrop address.
- [ ] Capture TeamTokenLock address.
- [ ] Capture deployment block.
- [ ] Immediately return `TESTNET_DEPLOY_APPROVED=false`.
- [ ] Run post-deploy invariant checks.
- [ ] Confirm 700M ATH MiningAirdrop reserve.
- [ ] Confirm 200M liquidity allocation.
- [ ] Confirm 50M team lock.
- [ ] Confirm 50M marketing allocation.
- [ ] Confirm all v3.3 constants.
- [ ] Confirm Mainnet gates remain closed.

## D. BscScan verification

External input:
- [ ] `BSCSCAN_API_KEY`

Then:
- [ ] Verify ATHToken.
- [ ] Verify MiningAirdrop.
- [ ] Verify TeamTokenLock.
- [ ] Compare verified source with release commit.
- [ ] Publish ABI SHA-256 and deployed-bytecode SHA-256.
- [ ] Confirm contract read functions on explorer.

## E. Immediate real Testnet holder flow

- [ ] Buy Power.
- [ ] Confirm `PowerPurchased`.
- [ ] Add referral and confirm `ReferralAdded`.
- [ ] At/after 00:05 UTC inspect daily reward.
- [ ] Keeper dry-run discovers the holder.
- [ ] Keeper snapshot emits `RewardCalculated`.
- [ ] Holder claims same UTC day.
- [ ] Confirm `RewardClaimed` and `VestingCreated`.
- [ ] Read 30/60/90/180 amounts directly from explorer.
- [ ] Buy Power Booster and confirm 30-day expiry.
- [ ] Create 5-referral Testnet eligibility.
- [ ] Activate Double Power.
- [ ] Confirm reward formula uses referral x2 x3.
- [ ] Leave a Testnet reward unclaimed for one day.
- [ ] Confirm `RewardExpired` through keeper batch.

Long-duration 30/60/90/180-day behavior is validated with local Hardhat time travel; Testnet is used to verify real-chain addresses, events, signing, balances, and explorer visibility.

## F. Wallet integration gate

Only after Testnet contracts are verified:
- [ ] Freeze verified contract addresses.
- [ ] Freeze release ABI.
- [ ] Connect AETHER Wallet Mining module.
- [ ] Test connect/sign/send callbacks.
- [ ] Display daily reward status and UTC deadline.
- [ ] Display per-position vesting.
- [ ] Display Cycle 1–12 preview and burn.
- [ ] Display verified explorer links.

## G. Mainnet remains blocked

Mainnet must remain closed until all are complete:
- [ ] Independent smart-contract audit.
- [ ] Production multisig.
- [ ] Operational incident runbook.
- [ ] Liquidity provider/lock decision.
- [ ] ATH/USDT launch parameters.
- [ ] Final operator approval.