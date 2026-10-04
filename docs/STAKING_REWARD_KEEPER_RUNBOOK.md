# ATH Staking Reward Keeper Runbook

## Purpose

The Staking Reward Keeper settles due holder rewards at the fixed **00:50 UTC daily slot**. It is permissionless automation only; it does not own ATHStaking and cannot edit package economics, referral rules, Rank thresholds or reserves.

When it settles a due reward:
- holder Daily Staking Reward is paid from the protected **160M Daily Reward Reserve**;
- L1–L10 Network Bonus is paid in the same transaction from the protected **50M Marketing / Network Reserve**.

Holder self-settlement remains available as a fallback.

## Runtime safety

Script:
- `scripts/staking-reward-keeper.js`

Fail-closed defaults:
- `STAKING_REWARD_KEEPER_ENABLED=false`
- `STAKING_REWARD_KEEPER_DRY_RUN=true`
- `STAKING_REWARD_KEEPER_SCHEDULE_GUARD=true`
- BSC Testnet chain ID 97 only.

The keeper requires:
- `ATH_STAKING_ADDRESS`
- `KEEPER_WALLET_ADDRESS`
- `BSC_TESTNET_RPC`

Transactional mode additionally requires:
- `PRIVATE_KEY`

The derived address from `PRIVATE_KEY` must exactly equal `KEEPER_WALLET_ADDRESS`, otherwise the process exits fail-closed.

## Schedule

Railway cron:
- **00:50 UTC daily**
- cron: `50 0 * * *`

With schedule guard enabled, transactional settlement outside the 00:50–00:59 UTC window is refused.

## Batch model

- Reads the on-chain Staking member registry.
- Reads each member's due positions.
- Uses bounded `processDailyRewardBatch`.
- Contract batch cap = 50.
- Registry page cap = 200.
- Batch processing skips invalid/not-due entries safely.

## Activation sequence

1. Keep keeper disabled before verified Testnet Staking address exists.
2. Deploy and verify ATHStaking on BSC Testnet.
3. Configure `ATH_STAKING_ADDRESS`.
4. Keep dry-run enabled.
5. Run one manual dry-run and inspect due positions/reserves.
6. Verify Keeper wallet expected-address gate.
7. Fund only the dedicated Keeper wallet with a small Testnet gas balance.
8. Run one manual transactional settlement at/after 00:50 UTC.
9. Confirm:
   - holder reward received,
   - RewardClaimed event,
   - L1–L10 NetworkRewardPaid events,
   - 160M reserve decreased only by holder reward,
   - 50M reserve decreased only by network payouts.
10. Only then leave the Railway 00:50 cron enabled for Testnet evidence.

## Failure behavior

If keeper is disabled or unavailable:
- reward accounting remains deterministic;
- due holder rewards remain claimable/settleable through the contract;
- no owner/admin privilege is lost;
- no principal is at risk.

## Mainnet policy

Do not enable Mainnet transactional keeper mode until independent audit, production multisig/operations policy and explicit operator approval are complete.
