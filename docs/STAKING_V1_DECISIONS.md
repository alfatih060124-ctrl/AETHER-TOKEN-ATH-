# ATH Staking v1 — Decision Register

## Scope lock

ATH Staking v1 is a new module beside ATH Mining.

- MiningAirdrop v3.3 remains source-locked.
- No Mining reward, referral, booster, vesting, keeper, claim-window, or Mining UI rule is changed by Staking v1.
- ATH remains one fixed-supply BEP-20 token with 1,000,000,000 ATH total supply.
- Tokenomics v2: 700,000,000 ATH Mining + 300,000,000 ATH Staking ecosystem.

## Staking ecosystem allocation — 300,000,000 ATH

| Allocation | ATH | Share of Staking Allocation |
| --- | ---: | ---: |
| Reward Pool | 160,000,000 | 53.33% |
| Presale | 30,000,000 | 10.00% | Opens $0.070; +$0.001 / 100,000 ATH sold; sold-out reference $0.370 |
| Marketing | 50,000,000 | 16.67% |
| Development Vesting | 30,000,000 | 10.00% |
| Liquidity | 20,000,000 | 6.67% |
| Ecosystem Reserve | 10,000,000 | 3.33% |
| **Total** | **300,000,000** | **100%** |

## Staking valuation

- Unified official pre-listing price is **1 ATH = $0.37**.
- Mining no longer changes the official price from mined volume; it reads the shared **ATHPriceRegistry**.
- Registry/oracle representation uses 8 decimals; the $0.37 pre-listing price is 37,000,000.
- ATHStakingPriceOracle has an immutable Mining price-source address and no owner price setter.
- Staking accounting reads the same live protocol price as Mining; this is not a guarantee of public-market price.

## Packages

| Package | Stake Value | Daily Rate | Lock |
| --- | ---: | ---: | ---: |
| Starter | $10–$99 | 0.35% | 180 days |
| Basic | $100–$499 | 0.45% | 180 days |
| Silver | $500–$1,999 | 0.55% | 365 days |
| Gold | $2,000–$9,999 | 0.65% | 365 days |
| Platinum | $10,000–$49,999 | 0.75% | 730 days |
| Diamond | $50,000+ | 0.85% | 730 days |

Package terms are snapshotted into each position. A later admin package update cannot rewrite the daily rate or lock period of an existing stake.

## Principal protection

Staking principal and reward reserve are separate accounting liabilities.

- ATH principal deposited by holders increases `principalLiabilityATH`.
- The 160M ATH Reward Pool is funded separately into `rewardReserveATH`.
- Direct referral and network rewards are paid only from the reward reserve.
- Principal is never silently consumed to fund rewards.
- Owner excess recovery is allowed only while paused and only for ATH above protected principal + reward reserve.

## Referral and network

- First valid direct referrer is bound on-chain.
- Self-referral is rejected.
- Referral-cycle creation is rejected.
- Direct referral reward: 10% of the ATH principal amount, paid from the reward reserve.
- Network daily-reward rates:
  - Level 1: 8%
  - Level 2: 5%
  - Level 3: 3%
  - Level 4: 2%
  - Level 5: 1%
  - Levels 6–10: 0.5% each
- Network reward is calculated from the holder's claimed daily ATH reward and paid from reward reserve.

## Daily reward accounting

- Reward is based on the USDT-denominated stake value and the package daily rate.
- Only completed 24-hour periods are claimable.
- Partial-day elapsed time is preserved for the next claim rather than discarded.
- Reward accrual stops at the position lock-end timestamp.
- Principal withdrawal after maturity does not erase already-accrued unclaimed reward.
- ATH conversion uses the shared $0.37 pre-listing registry price until official listing.

## Development vesting — 30M ATH

- Development allocation: 30,000,000 ATH.
- Cliff: 2 months.
- Active vesting: 33 months.
- 3% unlock per active month.
- On the final active month the contract releases the remaining balance so exactly 100% of the 30M allocation vests; no 1% residual is stranded.

## Contracts

- `ATHToken.sol`: existing fixed 1B ATH token; unchanged.
- `MiningAirdrop.sol`: Mining v3.3; source-locked and unchanged.
- `ATHStakingPriceOracle.sol`: compatibility adapter bound to `ATHPriceRegistry`; it follows the registry's fixed pre-listing price and later official market mode.
- `ATHStaking.sol`: packages, principal, reward reserve, direct referral and 10-level network reward.
- `ATHDevelopmentVesting.sol`: 30M development vesting.

## Security / release policy

- Staking v1 is Testnet-first.
- Mainnet remains fail-closed.
- Full local and automated tests must pass before Testnet deployment.
- BSC Testnet deployment remains a separate explicit operator action.
- Contract verification requires BscScan configuration after deployment.
- Independent security review is required before Mainnet.
