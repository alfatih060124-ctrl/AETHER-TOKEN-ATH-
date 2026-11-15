# ATH Staking Audit Findings Register

Baseline: `53a606fde30ba71836cc1278aeae86eb427a7e48`  
Audit branch: `audit/ath-staking-rank-decision-lock`  
Decision reference: `docs/ATH_STAKING_RANK_DECISION_LOCK.md`  
Scope exclusion: Mining is immutable and out of scope. No deployment or Mainnet activity is authorized.

## Finding register

| ID | Severity | Finding | Evidence in baseline | Required disposition |
|---|---|---|---|---|
| STK-001 | Critical | Rank formula conflicts with approved decision | `getEligibleRank` uses small-leg turnover (total direct-leg volume minus largest leg) | Replace with own lifetime staking turnover + full downline Group turnover; thresholds Rank 3–8 from decision lock |
| STK-002 | High | Personal staking turnover is not tracked for Rank | `stake` updates active balance and propagates volume only to uplines; no lifetime personal turnover mapping | Add personal lifetime turnover counter; do not decrement on withdrawal |
| STK-003 | High | Referral depth silently truncates Rank Group volume | `_propagateLegTurnover` stops at `MAX_REFERRAL_DEPTH_CHECK=64`; referral-cycle traversal is also bounded | Enforce maximum referral depth at binding (or use a proven unbounded-safe design); reject deeper tree joins instead of silently omitting ancestors |
| STK-004 | High | Daily Reward and Lifestyle Bonus are transaction-coupled | `_settleDailyReward` requires both reward reserve and network reserve, then reverts/returns false if either is insufficient | Separate reward claim settlement from network bonus settlement, with explicit holder-facing claim state and no double payment; preserve protected reserve accounting |
| STK-005 | High | Reserve runway is incomplete | `rankSalaryRunwayWeeks` considers only weekly Rank salary; `rewardReserveRunwayDays` considers daily holder reward run rate only | Add Network Reserve liability/runway metrics for referral + L1–L10 Lifestyle + Rank Salary; report assumptions and conservative bounds |
| STK-006 | High | Price registry lacks market-data freshness / deviation controls | `ATHPriceRegistry._readMarketPrice` checks only nonzero price; owner can replace oracle | Require an oracle adapter with freshness, validity and deviation protections; emit/audit oracle replacement; fail closed on stale/invalid prices |
| STK-007 | Medium | Holder target is owner-reported, not independently derived | `recordHolderCount` is owner-only and `listingReady` trusts this stored number | Keep listing disabled until count evidence and independent verification process are defined; do not treat the count as on-chain proof |
| STK-008 | High | Rank salary index mapping requires explicit compatibility tests | Existing salary array is eight entries; approved qualification starts at Rank 3 | Preserve existing R3–R8 salary amounts and Rank IDs unless separately approved; test qualification maturity and keeper enumeration for R3–R8 |
| STK-009 | Medium | CI evidence is insufficient for release | Baseline combined commit status returned no statuses; latest scheduled CodeQL run reported startup_failure | Restore CI and attach passing compile, unit, integration, security/static-analysis and Mining immutability evidence |
| STK-010 | Medium | Documentation conflicts on Rank Salary funding source | `STAKING_V1_DECISIONS.md` says 50M Network/Marketing Reserve; `BLUEPRINT_DECISIONS.md` contains an older conflicting Reward Reserve statement | Canonicalize to the implemented and approved 50M Network/Marketing Reserve for Referral, Lifestyle and Rank Salary; correct stale document only |

## Confirmed protected decisions

- Mining allocation: 700M ATH; no Mining code, tests, keepers, UI, deployment scripts or configuration changes.
- Staking allocation: 300M ATH.
- Reward reserve cap: 160M ATH.
- Network/Marketing reserve cap: 50M ATH.
- Lifestyle Bonus / Matching Staking: L1–L10 = 8%, 5%, 3%, 2%, 1%, 0.5%, 0.5%, 0.5%, 0.5%, 0.5%.
- Rank volume rule and Rank 3–8 thresholds: see the decision lock.
- Existing package snapshots, pause/fail-closed behavior, principal protection and price-registry source of truth remain protected.

## Work status

This register is a source-based audit record, not a claim that the findings are fixed. The baseline source has not been edited by this audit. The decision-lock document is committed only to the isolated audit branch.

## Required verification before closure

1. Implement STK-001/002 with migration-safe storage and no retroactive fabricated turnover.
2. Implement and test STK-003 depth policy.
3. Resolve STK-004 without making principal or reward reserve available to unrelated liabilities.
4. Implement STK-005 read-only metrics and reconciliation invariants.
5. Implement STK-006 with tests for stale, zero, reverting, manipulated and replaced oracle sources.
6. Document the operational evidence required for STK-007.
7. Verify R3–R8 salary mapping and keeper behavior for STK-008.
8. Restore passing CI and run all Staking tests plus Mining byte-for-byte scope guard for STK-009.
9. Reconcile STK-010 documentation.
10. Independent smart-contract review is still mandatory before any Mainnet consideration.

No merge, deployment, contract interaction, Staking unpause or Mainnet action is part of this audit branch.
