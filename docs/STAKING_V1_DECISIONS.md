# ATH Staking v1 — Final Decision Register

## Scope lock

This register records the final operator-approved Staking / Network policy.

- ATH remains one fixed-supply BEP-20 token with **1,000,000,000 ATH** total supply.
- **700,000,000 ATH** remains the locked Mining allocation.
- **300,000,000 ATH** is the Staking ecosystem allocation.
- Mining reward, booster, referral, vesting, claim-window and keeper mechanics are not changed by this Staking revision.
- Mining and Staking use the same ATH reference price source: **ATH Presale**.

## Final ATH price policy — Presale-linked

Before official listing, ATH price is not fixed at $0.10 or $0.37.

- Opening Presale price: **$0.070 / ATH**.
- Every complete **100,000 ATH sold** advances the price by **$0.001**.
- Presale allocation: **30,000,000 ATH**.
- There are 300 complete 100,000-ATH steps.
- The sold-out reference is **$0.370 / ATH**.
- ATHPresale.currentPriceUSD8() is the pre-listing price source.
- ATHPriceRegistry reads the Presale price and exposes it to both Mining and Staking.
- ATHStakingPriceOracle reads the same registry.
- Mining's compatibility price getter reads the same registry without changing Mining reward mechanics.
- A DEX market price may be displayed separately before official listing.
- The switch to official market-price mode remains one-way and gated by the holder target plus explicit owner activation.

The reference price is protocol accounting/display data, not a guaranteed redemption price or investment return.

## Staking ecosystem allocation — 300,000,000 ATH

| Allocation | ATH | Share |
| --- | ---: | ---: |
| Reward Pool | 160,000,000 | 53.33% |
| Presale | 30,000,000 | 10.00% |
| Marketing | 50,000,000 | 16.67% |
| Development Vesting | 30,000,000 | 10.00% |
| Liquidity | 20,000,000 | 6.67% |
| Ecosystem Reserve | 10,000,000 | 3.33% |
| **Total** | **300,000,000** | **100%** |

## Staking packages

| Package | Stake Value | Daily Rate | Lock |
| --- | ---: | ---: | ---: |
| Starter | $10–$99 | 0.35% | 180 days |
| Basic | $100–$499 | 0.45% | 180 days |
| Silver | $500–$1,999 | 0.55% | 365 days |
| Gold | $2,000–$9,999 | 0.65% | 365 days |
| Platinum | $10,000–$49,999 | 0.75% | 730 days |
| Diamond | $50,000+ | 0.85% | 730 days |

Package terms are snapshotted into each position. Later admin edits cannot rewrite an existing position's rate or lock period.

## Principal and reward-reserve protection

- Holder ATH principal increases principalLiabilityATH.
- The 160M reward allocation is separately funded to rewardReserveATH.
- Daily rewards, direct referral, network rewards and Rank salaries are paid from the reward reserve.
- Principal is not consumed to fund rewards.
- Owner excess recovery is pause-gated and can recover only ATH above protected principal + reward reserve.

## Direct referral and 10-level network

- First valid referrer is bound on-chain.
- Self-referral and referral cycles are rejected.
- Direct referral reward: **10%** of ATH principal, paid from reward reserve.
- Daily network rates: Level 1 8%, Level 2 5%, Level 3 3%, Level 4 2%, Level 5 1%, Levels 6–10 0.5% each.

## Final Network Rank salary policy

A direct sponsor creates one direct network leg.

The **big leg** is whichever direct leg currently has the largest cumulative USDT turnover. It is dynamic and can move to another leg when that leg becomes larger.

**Small-leg turnover = total turnover of all direct legs − turnover of the single largest direct leg.**

Rank qualification also requires at least **5 direct sponsors**.

| Rank | Small-leg Turnover | Weekly Salary |
| --- | ---: | ---: |
| Rank 1 | $1,000 | $25 |
| Rank 2 | $5,000 | $75 |
| Rank 3 | $15,000 | $200 |
| Rank 4 | $50,000 | $500 |
| Rank 5 | $100,000 | $1,000 |
| Rank 6 | $250,000 | $2,000 |
| Rank 7 | $500,000 | $5,000 |
| Rank 8 | $1,000,000 | $10,000 |

Rank 8 uses **$1,000,000 small-leg turnover** as the implementation of the final rank sequence.

Example:
- Leg 1 = $900
- Leg 2 = $899
- Leg 3 = $890
- Leg 4 = $880
- Leg 5 = $870
- Total turnover = $4,439
- Dynamic big leg = $900
- Small-leg turnover = **$3,539**
- Direct sponsors = 5
- Result: **Rank 1 qualifies; Rank 2 does not yet qualify**.

## Rank salary schedule

- Rank salary amount is denominated in USD/USDT accounting value.
- First payout is scheduled at the first **00:30 UTC** slot occurring after at least **7 full days** from qualification.
- Thereafter the schedule advances in 7-day periods.
- When a higher rank is newly achieved, it must mature for its own 7-day qualification delay before that higher salary applies to a payout slot.
- Salary is converted to ATH using the **current Presale-linked ATH price at payout time**.
- Payout is on-chain and may be called by the holder or by a permissionless keeper.
- The Rank keeper is fail-closed by default, Testnet-first, and reads the on-chain Rank member registry.
- A payout can execute only while the protected reward reserve contains enough ATH. If not sufficiently funded, principal remains protected and the payout transaction does not consume principal.

## Development vesting — 30M ATH

- Allocation: 30,000,000 ATH.
- Cliff: 2 months.
- Active vesting: 33 months.
- 3% releases in each active month.
- The final active month releases the remaining residual so exactly 100% of the 30M allocation completes vesting.

## Security and release policy

- Testnet-first.
- Mainnet remains fail-closed.
- Presale deploys PAUSED.
- Full source self-check, syntax gate, compile, automated tests, ABI export and local rehearsal must pass before Testnet deployment.
- Independent security review remains required before Mainnet.
