# AETHER ATH — BSC Testnet Acceptance Checklist

## A. Zero-cost source gate — must pass before any tBNB is used

### Tokenomics and ownership
- [x] Total supply = 1,000,000,000 ATH.
- [x] No post-deployment mint function.
- [x] Mining allocation = 700,000,000 ATH.
- [x] Staking ecosystem allocation = 300,000,000 ATH.
- [x] Staking breakdown = 160M Reward / 30M Presale / 50M Marketing-Network / 30M Development / 20M Liquidity / 10M Reserve.
- [x] Mining Admin, Staking Admin and Presale/Token Admin are separate owner roles.
- [x] Mining Treasury is a separate role from Mining Admin.
- [x] Keeper is separate from owner/treasury roles.
- [x] Mainnet release gates remain closed.

### Mining
- [x] Daily base reward = 10 ATH.
- [x] Daily claim window = 00:05:00–23:59:59 UTC.
- [x] Missed Mining reward expires.
- [x] Mining referral multiplier = +10% through +50%.
- [x] Power Booster = 2x, 30 days, +100 Hash.
- [x] Double Power = 3x on top of Power and requires 5 referrals.
- [x] Booster prices are owner-configurable.
- [x] 12 recurring vesting cycles.
- [x] Final settlement = 60% burn / 40% holder.
- [x] Miner registry + paginated reads.
- [x] Permissionless batch transparency functions.
- [x] Mining keeper fail-closed.

### Presale / price
- [x] Presale allocation = 30M ATH.
- [x] Opening price = $0.070.
- [x] Price step = +$0.001 per complete 100,000 ATH sold.
- [x] Sold-out reference = $0.370.
- [x] Presale deploys paused/fail-closed.
- [x] Buyer max-payment protection.
- [x] Mining and Staking read the same Presale-linked price registry.
- [x] Official market activation requires 15,000 holders + explicit activation.

### Staking
- [x] Package ladder and rate/lock snapshots.
- [x] Daily Staking reward slot = 00:50 UTC.
- [x] Principal liability isolated from reward/network reserves.
- [x] Daily Reward Reserve = 160M ATH.
- [x] Marketing / Network Reserve = 50M ATH.
- [x] Unified Direct Referral baseline = 10% total.
- [x] Ranked total Direct Referral rates = 13/16/19/22/25/28/31/35%.
- [x] Differential Rank uplift.
- [x] Full referral path hard-capped at 35%.
- [x] Same Rank = skip; higher Rank above it remains eligible.
- [x] L1–L10 Lifestyle Bonus / Matching Staking = 8/5/3/2/1/0.5/0.5/0.5/0.5/0.5%.
- [x] Lifestyle Bonus / Matching Staking settles in real time during Staking reward settlement.
- [x] Rank 1–8 small-leg thresholds and lifetime weekly salaries.
- [x] Rank Salary schedule = 00:30 UTC weekly after qualification delay.
- [x] Complete Rank Salary history + payout queue + direct-leg pagination.
- [x] Staking Reward Keeper fail-closed.
- [x] Rank Salary Keeper fail-closed.

### Web / Control Panel
- [x] Admin public surface exposes only Connect Wallet Mining / Staking / Presale.
- [x] Full admin requires nonce + signed wallet authentication.
- [x] Mining, Staking and Token/Presale workspaces are isolated.
- [x] Holder Mining and Staking workspaces are isolated.
- [x] Holder web explicitly distinguishes Mining reward/referral from Staking reward/referral.
- [x] Production web dependency audit = 0 vulnerabilities.
- [x] Multilingual QC passes.
- [x] Desktop/mobile layout gate passes.

### Release gates
- [x] Runtime high/critical dependency vulnerabilities = 0.
- [x] Non-BNB readiness PASS.
- [x] Source self-check PASS.
- [x] Syntax checks PASS.
- [x] Solidity compile PASS.
- [x] 70/70 automated tests PASS.
- [x] Deterministic ABI/release export PASS.
- [x] Local release rehearsal PASS.
- [x] EIP-170 bytecode checks PASS.

## B. External configuration required before Testnet deployment

The following must be supplied/approved before the one-shot deployment:
- [ ] `PRESALE_PAYMENT_TOKEN`
- [ ] `LIQUIDITY_WALLET`
- [ ] `STAKING_RESERVE_WALLET`
- [ ] `DEVELOPMENT_BENEFICIARY`
- [ ] Testnet deployer balance >= configured minimum tBNB.

The first four are operator/business inputs, not coding gaps.

## C. One-shot BSC Testnet deployment

- [ ] Rerun read-only preflight.
- [ ] Confirm chain ID = 97.
- [ ] Recheck deployer tBNB balance.
- [ ] Confirm separate wallet-role mapping.
- [ ] Temporarily open only the Testnet approval gate.
- [ ] Run deployment exactly once.
- [ ] Capture ATHToken address.
- [ ] Capture ATHPresale address.
- [ ] Capture ATHPriceRegistry address.
- [ ] Capture MiningAirdrop address.
- [ ] Capture ATHStakingPriceOracle address.
- [ ] Capture ATHStaking address.
- [ ] Capture ATHDevelopmentVesting address.
- [ ] Capture deployment block / manifest.
- [ ] Immediately close the Testnet approval gate again.
- [ ] Run post-deploy invariant checker.
- [ ] Confirm each contract owner matches its dedicated wallet.
- [ ] Confirm Mining Treasury and Presale Treasury mapping.
- [ ] Confirm 700M + 300M supply conservation.
- [ ] Confirm 160M Daily Reward Reserve and 50M Marketing/Network Reserve funding.
- [ ] Confirm Presale is paused until explicit opening.
- [ ] Confirm Mainnet gates remain closed.

## D. Explorer verification

External input:
- [ ] `BSCSCAN_API_KEY`

Then:
- [ ] Verify ATHToken.
- [ ] Verify ATHPresale.
- [ ] Verify ATHPriceRegistry.
- [ ] Verify MiningAirdrop.
- [ ] Verify ATHStakingPriceOracle.
- [ ] Verify ATHStaking.
- [ ] Verify ATHDevelopmentVesting.
- [ ] Compare verified source with release commit.
- [ ] Publish ABI SHA-256 and deployed-bytecode SHA-256.

## E. Real Testnet Mining flow

- [ ] Activate Power.
- [ ] Confirm PowerPurchased.
- [ ] Confirm Mining referral behavior.
- [ ] At/after 00:05 UTC inspect Mining reward.
- [ ] Run Mining keeper in dry-run.
- [ ] Confirm RewardCalculated.
- [ ] Holder claims same UTC day.
- [ ] Confirm RewardClaimed + VestingCreated.
- [ ] Verify 30/60/90/180 vesting values.
- [ ] Activate Power Booster.
- [ ] Create 5-referral eligibility.
- [ ] Activate Double Power.
- [ ] Confirm referral × Power × Double formula.
- [ ] Leave one reward unclaimed and confirm RewardExpired.

## F. Real Testnet Presale flow

- [ ] Keep Presale paused until owner intentionally opens it.
- [ ] Fund buyer Testnet payment token.
- [ ] Approve payment token.
- [ ] Purchase ATH through buyATH.
- [ ] Verify treasury receives payment token.
- [ ] Verify buyer receives ATH.
- [ ] Verify price quote and max-payment protection.
- [ ] Verify price step behavior at the 100,000 ATH boundary.

## G. Real Testnet Staking flow

- [ ] Fund Staking Daily Reward Reserve.
- [ ] Fund Marketing / Network Reserve.
- [ ] Create stake position.
- [ ] Verify principal liability.
- [ ] At 00:50 UTC settle daily reward.
- [ ] Confirm holder reward uses only 160M reserve.
- [ ] Confirm Direct Referral settles immediately at stake creation.
- [ ] Confirm unranked direct sponsor receives 10% total.
- [ ] Confirm ranked direct sponsor receives its 13–35% total rate.
- [ ] Confirm Same Rank is skipped while higher Rank remains eligible.
- [ ] Confirm L1–L10 Lifestyle Bonus / Matching Staking settles in the same reward transaction.
- [ ] Confirm Rank qualification from small-leg turnover.
- [ ] Confirm Rank Salary first maturity and 00:30 weekly schedule.
- [ ] Confirm Rank Salary history record.
- [ ] Confirm principal withdrawal after lock preserves exact principal amount.

## H. Keeper activation sequence

### Mining keeper
- [ ] Configure verified Mining address.
- [ ] Dry-run first.
- [ ] Verify registered miners and batch plan.
- [ ] Fund dedicated Keeper wallet with small Testnet gas.
- [ ] Enable transactional mode only after manual evidence is correct.

### Staking Reward Keeper
- [ ] Configure verified Staking address.
- [ ] Confirm 00:50 cron.
- [ ] Dry-run first.
- [ ] Verify due positions.
- [ ] Confirm Keeper wallet address/private-key match gate.
- [ ] Enable transaction mode only after manual 00:50 settlement succeeds.

### Rank Salary Keeper
- [ ] Configure verified Staking address.
- [ ] Confirm 00:30 cron.
- [ ] Dry-run first.
- [ ] Verify due Rank accounts.
- [ ] Confirm Keeper wallet address/private-key match gate.
- [ ] Enable transaction mode only after manual Rank Salary settlement succeeds.

## I. AETHER Wallet integration

Only after verified Testnet addresses are frozen:
- [ ] Freeze verified addresses + ABI.
- [ ] Bind Mining, Presale and Staking modules.
- [ ] Test connect/sign/send callbacks.
- [ ] Show Mining reward deadline/vesting.
- [ ] Show Staking reward, referral, Lifestyle Bonus / Matching Staking and Rank state.
- [ ] Show explorer links for all user transactions.

## J. Mainnet remains blocked

Mainnet remains closed until:
- [ ] Independent smart-contract audit.
- [ ] Production multisig decision and migration plan.
- [ ] Operational incident runbook.
- [ ] Liquidity provider/lock decision.
- [ ] ATH/USDT launch parameters.
- [ ] Final operator approval.
