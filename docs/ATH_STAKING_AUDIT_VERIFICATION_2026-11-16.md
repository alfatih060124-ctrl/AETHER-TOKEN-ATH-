# ATH Staking Source Verification — 2026-11-16

## Scope and safety lock

- Repository: `alfatih060124-ctrl/AETHER-TOKEN-ATH-`
- Production baseline: `main` at `53a606fde30ba71836cc1278aeae86eb427a7e48`
- Audit branch: `audit/ath-staking-rank-decision-lock`
- This verification is read-only against production source. No contract, Mining, UI, keeper, configuration, deployment, or Mainnet action was performed.
- No finding in this document is marked fixed.

## Direct source evidence confirmed on main

### VFY-001 — Daily claim is coupled to Network Reserve (High)

`_settleDailyReward(account, stakeId, strict)` calculates the holder's reward from the Reward Reserve, calculates L1–L10 Lifestyle payouts from the Network Reserve, and rejects the entire settlement if either reserve is insufficient. Therefore a shortage in the separate Network/Marketing reserve can prevent a holder from claiming a daily reward even when the Reward Reserve alone can cover that holder's reward. This confirms STK-004. Required remediation should separate claimability from optional/network payout policy without bypassing reserve protection or changing approved Lifestyle rates.

### VFY-002 — Rank qualification still uses Small-Leg turnover (Critical)

`getEligibleRank` first checks `MIN_DIRECT_SPONSORS_FOR_RANK = 5`, then qualifies using `getSmallLegTurnoverUSDT`. `_refreshRank` and `RankAchieved` also publish the small-leg metric. This directly conflicts with the approved Rank basis: own cumulative staking turnover plus total cumulative Group/downline turnover. The sponsor-count condition is a separate gate and must remain separate unless explicitly changed.

### VFY-003 — Personal cumulative staking turnover is not represented in Rank state (High)

The current `UserInfo` stores `activeStakedUSDT`, not a cumulative personal staking turnover field. Active balance decreases on principal withdrawal, so it cannot substitute for lifetime/personal cumulative staking turnover. A correct implementation needs a distinct cumulative field updated for every successful stake and an explicit Group cumulative field/derivation. Do not infer personal turnover from current active balance.

### VFY-004 — Referral traversal is silently bounded at 64 (High)

`_propagateLegTurnover`, `_createsReferralCycle`, referral pass-up previews and payout traversal use `MAX_REFERRAL_DEPTH_CHECK = 64`. Turnover and pass-up stop after the bound; cycle detection returns false if it reaches the bound without finding the candidate. The current code does not enforce a maximum referral depth when binding. Remediation must either enforce a hard depth limit at binding with an explicit user-approved rule, or provide a provably safe complete traversal strategy. Simply increasing 64 is not a proof.

### VFY-005 — Package validation permits fractional-dollar holes (Medium)

The constructor defines adjacent whole-dollar package endpoints (10–99, 100–499, 500–1,999, 2,000–9,999, 10,000–49,999, and 50,000+), while `stake` accepts arbitrary token precision and checks inclusive min/max values. Thus fractional amounts between endpoints (for example 99.50) fit no default package. `_validatePackage` validates each package in isolation and does not enforce contiguity or non-overlap across packages. Product policy must decide whether to enforce whole-dollar amounts or define contiguous fractional boundaries; no silent range change is authorized.

### VFY-006 — Reward runway is a current-rate estimate, not full liability runway (High)

`rewardReserveRunwayDays` divides the Reward Reserve's USDT-equivalent value by `activeDailyRewardRunRateUSDT`. Principal withdrawal reduces the active daily run rate, but accrued unpaid rewards remain claimable under the position's reward schedule. The reported runway therefore does not explicitly include accrued-but-unclaimed reward liabilities. A safer runway view needs a separately computed payable-accrual liability and a clearly stated estimate methodology.

### VFY-007 — Network runway omits non-salary reserve outflows (High)

`rankSalaryRunwayWeeks` divides the Network Reserve's USDT-equivalent value only by `totalWeeklyRankSalaryUSDT`. The same Network Reserve also pays direct referral and L1–L10 Lifestyle Bonus / Matching Staking. The function name and output therefore overstate runway if consumers interpret it as the runway of the entire Network Reserve. Either rename/document it as salary-only runway and add a complete network reserve forecast, or calculate all material outflows.

### VFY-008 — Salary qualification and payout are tied to the current Rank index arrays (High)

`_refreshRank` changes `totalWeeklyRankSalaryUSDT` using `rankWeeklySalaryUSDT[rank - 1]`; `_rankSalaryDue` and `_settleRankSalary` use the same Rank-indexed salary array. Approved qualification thresholds begin at Rank 3, while the current eight salary slots are R1–R8. No index shift is safe until the treatment of R1/R2 and the salary amounts attached to R3–R8 are explicitly approved. Existing values must not be silently shifted.

### VFY-009 — Oracle/price conversion is a critical dependency for liabilities (High)

The staking contract uses `priceOracle.getPrice()` for principal conversion, reward conversion, salary conversion and runway estimates. This source inspection confirms the contract consumes a single oracle price; freshness, deviation bounds and post-listing oracle governance must be audited in the oracle contract and its tests before release. Do not change oracle governance from this staking-only audit without reviewing the separate registry implementation.

## Decisions still blocked

1. Rank labels R1/R2: whether to disable qualification and how historical Rank state should be treated.
2. Salary mapping: confirm whether existing salary values remain attached to the same Rank labels, specifically R3=$200/week, R4=$500/week, R5=$1,000/week, R6=$2,000/week, R7=$5,000/week, R8=$10,000/week.
3. Referral bonus mapping: confirm whether existing total rates R1–R8 (13%, 16%, 19%, 22%, 25%, 28%, 31%, 35%) remain attached to the same labels when Rank qualification changes.
4. Package precision: whole-dollar-only input versus contiguous fractional boundaries.
5. Referral depth: whether to enforce a hard maximum of 64 levels or specify another complete traversal model.

## Next implementation sequence (not executed)

1. Freeze the business-rule decisions above.
2. Write a migration/compatibility design for Rank state, events, UI, keeper and historical records.
3. Add isolated unit/property tests for cumulative personal + Group turnover, separate sponsor gate, Rank 3–8 thresholds, rank index compatibility and deep referral boundaries.
4. Separate daily reward settlement from network payout dependency while preserving reserve solvency and explicit payout semantics.
5. Add full reserve-liability accounting and runway tests.
6. Close package boundary policy and oracle security review.
7. Run full CI and independent security review on an isolated feature branch; only then prepare a draft PR. No production merge or deployment is authorized by this audit continuation.
