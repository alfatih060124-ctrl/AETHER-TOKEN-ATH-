# ATH Rank Salary Keeper Runbook

## Purpose

The Rank Salary Keeper processes **lifetime weekly Rank Salary** for qualified accounts. It is permissionless automation only and holds no ATHStaking owner privilege.

Rank Salary uses only the protected **50M Marketing / Lifestyle Matching Reserve**.

## Schedule

- Salary calendar: weekly after the qualification delay.
- Settlement slot: **00:30 UTC**.
- Railway cron may run daily at 00:30; the contract pays only accounts whose weekly slot is actually due.
- Schedule guard accepts the 00:30–00:59 UTC window.

## Runtime safety

Script:
- `scripts/rank-salary-keeper.js`

Fail-closed defaults:
- `RANK_KEEPER_ENABLED=false`
- `RANK_KEEPER_DRY_RUN=true`
- `RANK_KEEPER_SCHEDULE_GUARD=true`
- BSC Testnet chain ID 97 only.

Required:
- `ATH_STAKING_ADDRESS`
- `KEEPER_WALLET_ADDRESS`
- `BSC_TESTNET_RPC`

Transactional mode additionally requires:
- `PRIVATE_KEY`

The private key derived wallet must exactly equal the configured Keeper wallet.

## Discovery and batching

- Reads the on-chain Rank member registry.
- Previews salary due state for registered Rank members.
- Processes only accounts with matured due periods.
- Uses bounded batch processing.
- An insufficient reserve never consumes principal.

## Activation sequence

1. Keep Rank Keeper disabled before verified Testnet Staking deployment.
2. Verify Rank member registry and Rank qualification using manual Testnet stakes.
3. Configure verified `ATH_STAKING_ADDRESS`.
4. Keep dry-run enabled.
5. Run a dry-run at 00:30 UTC and inspect due accounts.
6. Verify Keeper wallet expected-address gate.
7. Fund dedicated Keeper with small Testnet gas.
8. Execute one manual due Rank Salary settlement.
9. Confirm:
   - salary USD entitlement,
   - ATH conversion at current Presale-linked price,
   - RankSalaryPaid event,
   - persistent RankSalaryPayment history entry,
   - 50M Marketing / Lifestyle Matching Reserve reduction,
   - principal and 160M Daily Reward Reserve unchanged.
10. Only after evidence is correct, leave the Railway cron enabled for Testnet.

## Lifetime rule

Once a Rank is achieved, the Rank Salary entitlement does not expire. If reserve is temporarily insufficient, unpaid periods remain due; the payout schedule is not silently advanced past unpaid salary.

## Mainnet policy

Keep transactional mode disabled on Mainnet until independent audit, production operations approval and explicit operator approval.
