# ATH Blueprint Decision Register

This register separates original blueprint requirements from later operator-approved ATH Mining v3.3 rules. The v3.3 rules below supersede conflicting v3.2 assumptions.

## Fixed token policy — Ecosystem Tokenomics v2

- Token: Aether (ATH), BEP-20.
- Fixed initial supply remains **1,000,000,000 ATH**. No post-deployment mint function exists.
- **Mining reserve remains locked at 700,000,000 ATH (70%)**. MiningAirdrop v3.3 rules, reward clock, boosters, referral tiers, vesting/burn, keeper and Mining UI are not modified by the Staking expansion.
- **Staking ecosystem allocation is 300,000,000 ATH (30%)**.
- Staking 300M breakdown:
  - Reward Pool: 160,000,000 ATH.
  - Presale: 30,000,000 ATH.
  - Marketing: 50,000,000 ATH.
  - Development Vesting: 30,000,000 ATH.
  - Liquidity: 20,000,000 ATH.
  - Ecosystem Reserve: 10,000,000 ATH.
- ATH Staking v1 pre-listing reference valuation is **1 ATH = $0.37**.
- Mining v3.3 reward/booster/vesting mechanics remain source-locked, while its compatibility price getter is now wired to the shared `ATHPriceRegistry`. Staking uses the same registry through its adapter.
- The Staking reference valuation is a protocol accounting value, not a guarantee of an external market price.

## Operator-approved Mining v3.3 rules

### 1. Daily reward clock

- Base reward is 10 ATH per eligible UTC mining day.
- Reward becomes claimable at 00:05:00 UTC.
- Claim deadline is 23:59:59 UTC.
- An unclaimed daily reward expires permanently at the next UTC day boundary.
- Missed rewards do not accumulate and cannot be recovered on a later day.
- Block timestamp is the source of truth; device timezone is not used.
- Referral and booster state for the daily reward is evaluated at the 00:05 UTC snapshot time.

### 2. Referral multiplier

Referral is applied before booster multiplication.

- 1-5 referrals: +10%
- 6-10: +15%
- 11-20: +20%
- 21-25: +25%
- 26-30: +30%
- 31-35: +35%
- 36-40: +40%
- 41-45: +45%
- 46+: +50%

Referral attribution becomes effective at a defined reward snapshot so a previously fixed daily reward cannot change later in the day.

### 3. Power Booster

- Requires Power.
- Adds 100 Hash.
- Multiplies the referral-adjusted reward by 2x.
- Valid for 30 days.
- Does not stack with another simultaneous Power Booster period.
- After expiry, reward returns to the referral-adjusted normal value.
- Price is stored on-chain and is owner-configurable through the Control Panel.
- Current source default is 0.001 BNB.

### 4. Double Power Booster

- Requires an active Power Booster.
- Requires at least 5 referrals.
- Multiplies the active Power-Booster reward by 3x.
- Effective formula is: Base Reward x Referral Multiplier x 2 x 3.
- Example at +50% referral: 1 x 1.5 x 2 x 3 = 9 ATH/day.
- Double Power has no independent expiry. It ends when the underlying Power Booster ends.
- It does not extend the Power Booster expiry.
- Price is stored on-chain and is owner-configurable through the Control Panel.
- Current source default is 0.001 BNB.

### 5. Initial vesting for each successful daily claim

Each successfully claimed daily reward creates a separate auditable vesting position:

- 10% unlocks after 30 days.
- 5% unlocks after 60 days.
- 5% unlocks after 90 days.
- The remaining 80% enters Vesting Cycle 1 after 180 days.

The 80% is no longer a direct 180-day final unlock.

### 6. Recurring vesting cycles

There are exactly 12 cycles.

At entry to every cycle:
- 10% of the incoming cycle principal is burned immediately.
- 10% unlocks 30 days after cycle start.
- 5% unlocks 60 days after cycle start.
- 5% unlocks 90 days after cycle start.
- 70% rolls forward at 180 days into the next cycle.

Burn occurs when the tranche enters the new cycle.

### 7. Final settlement after Cycle 12

There is no Cycle 13.

When the final 70% rollover completes its last 180-day period:
- the remaining principal is settled in full,
- 60% is burned,
- 40% is distributed to the holder,
- residual vesting balance becomes zero.

For a 1 ATH base claim, integer-wei accounting is tested so the original allocation is conserved between holder distribution and permanent burn.

### 8. On-chain transparency

The contract is the source of truth. The web interface only visualizes contract data.

Required public evidence includes:
- RewardCalculated
- RewardClaimed
- RewardExpired
- VestingCreated
- VestingCycleEntered
- ATHBurned
- VestingTrancheClaimed
- VestingFinalSettled

Public read functions expose:
- daily reward status and deadline,
- total allocated, claimed, burned and still vesting,
- each vesting position,
- each 12-cycle preview,
- current cycle,
- current claimable amount,
- final 60/40 settlement preview.

Admin cannot rewrite an already-created holder vesting position or restore an expired daily reward.

## Safety and deployment policy

- ATH remains fixed-supply; MiningAirdrop does not mint ATH.
- Vesting burn uses the token burn mechanism and reduces total supply.
- Outstanding vesting liability excludes already-burned ATH.
- Excess reserve recovery remains owner-only and pause-gated.
- Mainnet deployment remains fail-closed.
- v3.3 source must be compiled, tested, verified on BSC Testnet and audited before any Mainnet deployment.
- The current v3.3 source is not yet deployed on-chain.
- BSC Testnet deployment remains blocked until the dedicated deployer wallet has the required tBNB gas reserve.