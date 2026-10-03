# ATH v3.3 Reward Keeper Runbook

## Purpose

The reward keeper exists only to materialize the daily transparency events that the ATH contract already calculates deterministically from blockchain time and stored referral/booster history.

It does **not** decide reward amounts, edit holder balances, grant referrals, change Booster pricing, unlock vesting, or hold any admin permission.

The contract remains the source of truth.

## Daily UTC lifecycle

- 00:00:00 UTC: the previous reward day is mathematically expired if it was not claimed.
- 00:05:00 UTC: the new reward day becomes claimable.
- 00:05 UTC keeper run:
  1. read the on-chain paginated miner registry,
  2. materialize `RewardExpired` evidence for the previous day,
  3. materialize `RewardCalculated` evidence for the current day,
  4. emit batch summary events.
- 23:59:59 UTC: last valid second for the holder to call `claimDaily()`.

The keeper may run later than 00:05 without changing the deterministic reward formula. The contract evaluates referral and Booster state at the day's 00:05 UTC snapshot timestamp.

## Contract batch functions

`snapshotDailyRewards(address[] accounts)`
- Permissionless.
- Current UTC day only.
- Requires the 00:05 claim window to be open.
- Skips ineligible or already-recorded accounts.
- Emits one `RewardCalculated` per newly snapshotted holder.
- Emits `RewardBatchSnapshotted` summary.

`expireDailyRewards(address[] accounts, uint256 dayId)`
- Permissionless.
- Only after the target UTC day has ended.
- Skips claimed, already-expired, or ineligible accounts.
- Emits `RewardExpired` for each newly expired holder.
- Emits `RewardBatchExpired` summary.

`MAX_KEEPER_BATCH = 50`.

`getMiners(offset, limit)`
- Read-only on-chain miner registry.
- Every successful Power activation appends that wallet once.
- `MAX_MINER_PAGE = 200`.
- Eliminates daily historical log scans and external holder databases.

The batch/page caps limit gas and RPC exposure and prevent unbounded loops.

## Keeper wallet security model

Use a dedicated **gas-only Testnet keeper wallet for audit/testing only**. Production/Mainnet holder gas must not be subsidized by AETHER.

The keeper wallet must:
- not be the ATH owner,
- not be the treasury,
- not be the production multisig,
- not be the deployment key,
- hold only the small amount of tBNB required for keeper gas.

Compromise of the keeper key must not grant control over ATH, vesting, treasury, Booster prices, pause controls, or token ownership.

## Runtime fail-closed defaults

The runtime script is `scripts/reward-keeper.js`.

Required activation:
- `KEEPER_ENABLED=true`

Default behavior:
- if `KEEPER_ENABLED` is not true, the script exits without an RPC call or transaction,
- `KEEPER_DRY_RUN=true` by default,
- the script accepts only BSC Testnet chain ID 97,
- Mainnet is intentionally rejected in v3.3.

Required after Testnet deployment:
- `ATH_MINING_ADDRESS=<verified MiningAirdrop address>`
- `BSC_TESTNET_RPC=<RPC endpoint>`

For transaction mode:
- `KEEPER_DRY_RUN=false`
- `PRIVATE_KEY=<dedicated keeper key>`

Optional:
- `KEEPER_BATCH_SIZE=25` (must be <= 50)
- `KEEPER_PAGE_SIZE=200` (must be <= 200)
- `KEEPER_MIN_BNB=0.005`

## Activation sequence

1. Keep `KEEPER_ENABLED=false` before the MiningAirdrop address is verified.
2. Deploy ATH v3.3 on BSC Testnet through the gated one-shot deployment.
3. Record the MiningAirdrop deployment block for release evidence.
4. Verify the contract on BscScan.
5. Configure `ATH_MINING_ADDRESS`.
6. Set `KEEPER_ENABLED=true`, keep `KEEPER_DRY_RUN=true`.
7. Run `npm run keeper:reward` and inspect the JSON plan.
8. Confirm on-chain registered holder count, pagination and batch count.
9. Fund only the dedicated keeper wallet with small Testnet gas.
10. Set `KEEPER_DRY_RUN=false`.
11. Run once manually and verify:
   - `RewardCalculated`,
   - `RewardBatchSnapshotted`,
   - `RewardExpired`,
   - `RewardBatchExpired`.
12. Only after manual Testnet evidence is correct, schedule the keeper daily after 00:05 UTC.

## Failure behavior

If the keeper does not run:
- holder reward mathematics do not change,
- holder `claimDaily()` remains available during the valid claim window,
- expired rewards remain mathematically expired,
- missing evidence can be materialized later through the permissionless batch function.

The keeper is therefore an evidence/automation layer, not a custody or reward-authority layer.

## Mainnet policy

ATH v3.3 keeper runtime is Testnet-only. **Mainnet policy is no AETHER-funded keeper gas for holder operations.** Holders pay the network gas for their own state-changing transactions.

Do not enable an AETHER-funded Mainnet keeper for holder operations. Permissionless batch functions remain available as protocol transparency utilities, but AETHER does not fund or schedule them as a production gas subsidy.