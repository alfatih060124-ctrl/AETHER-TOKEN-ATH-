# ATH Blueprint Decision Register

This file separates requirements explicitly stated in the supplied AETHER (ATH) Mining System v3.1 blueprint from implementation choices that the blueprint does not fully define.

## Explicit blueprint requirements already encoded

- Token: Aether (ATH), BEP-20.
- Fixed total supply: 1,000,000,000 ATH.
- Mining Pool: 70% / 700,000,000 ATH.
- Liquidity: 20% / 200,000,000 ATH for ATH/USDT.
- Team & Dev: 5% / 50,000,000 ATH, locked 12-18 months.
- Marketing: 5% / 50,000,000 ATH.
- Base reward: 1 ATH/day and the user must claim daily.
- Missed daily reward is lost.
- Power activation: 0.001 BNB.
- Booster: 0.001 BNB = 100 Hash and Reward x2.
- Referral tiers: +10% through +50% according to active referrals.
- Vesting: 10% @30d, 5% @60d, 5% @90d, 80% @180d.
- Display price begins at $3.00 and adds $0.001 per 10,000 ATH mined.
- Required app functions include Power, Booster, daily claim, vesting claim, user info and current price.

## Implementation choices currently used in v3.2

### 1. Booster stacking
The blueprint states Reward x2 but does not say repeated boosters create x4/x8/etc. v3.2 therefore caps the reward multiplier at 2x while every Booster purchase still adds 100 Hash.

**Status:** implementation assumption; safe against uncontrolled reward inflation.

### 2. Referral permanence
The blueprint says a friend counts active after buying Power. It does not specify later expiry/removal. v3.2 counts that referral once after successful Power purchase and keeps it in the referrer's tier count.

**Status:** implementation assumption.

### 3. Vesting start point
The blueprint gives 30/60/90/180-day vesting tranches but does not explicitly define whether all rewards share one global schedule or whether each mined reward has its own vesting clock. v3.2 creates a vesting position for each successful daily claim and starts that position's vesting clock at allocation time.

**Status:** implementation assumption; preserves an auditable one-to-one history between daily reward allocation and vesting.

### 4. Meaning of "ATH mined" in the display-price formula
The blueprint does not distinguish allocated mining rewards from already-unlocked/withdrawn rewards. v3.2 uses total ATH allocated by successful daily claims.

**Status:** implementation assumption.

### 5. Exact Team & Dev lock duration
The blueprint supplies only a 12-18 month range. v3.2 refuses deployment outside 365-550 days, but does not select the production duration automatically.

**Status:** operator decision required before mainnet.

### 6. Liquidity lock provider and duration
The blueprint requires ATH/USDT liquidity locking but does not name a provider, duration or LP ownership model.

**Status:** operator decision + security review required before mainnet.

## Mainnet policy

None of the implementation assumptions above should be silently changed during deployment. Any change must be committed, re-tested and re-audited before production deployment.
