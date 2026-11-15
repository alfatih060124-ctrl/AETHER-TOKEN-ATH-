# ATH Staking Rank Decision Lock — Audit Branch

Status: decision reconciliation / implementation specification  
Baseline: `main` at `53a606fde30ba71836cc1278aeae86eb427a7e48`  
Scope: ATH Staking only. Mining source, tests, deployment artifacts and operational rules are out of scope and must remain unchanged.

## 1. Controlling operator-approved Rank qualification rule

The operator's previously approved rule supersedes the older small-leg Rank formula:

**Rank volume = the member's own cumulative Staking turnover + the cumulative Staking turnover of the entire downline Group/network.**

- Count the member's own successful staking principal turnover.
- Count all successful staking turnover from direct and indirect members throughout the member's referral Group.
- Do not limit volume to direct sponsors.
- Do not subtract the largest/big leg.
- Do not use small-leg turnover as the Rank qualification basis.
- Principal withdrawal does not erase historical turnover already generated.
- A stake is counted once, after the Staking transaction succeeds; failed/reverted stakes count zero.
- Referral attribution follows the on-chain bound referral tree and must not be reassigned retroactively.

Any minimum direct-sponsor count remains a separate eligibility gate, not a volume multiplier or a substitute for turnover. Preserve the existing five-direct-sponsor gate unless a later explicit operator decision changes it.

## 2. Approved Rank volume thresholds

Rank qualification begins at Rank 3. R1 and R2 are not qualification targets under this decision.

| Rank | Required cumulative turnover |
|---|---:|
| Rank 3 | $100 |
| Rank 4 | $200 |
| Rank 5 | $500 |
| Rank 6 | $1,000 |
| Rank 7 | $2,000 |
| Rank 8 | $5,000 |

These values are USD/USDT accounting turnover, not ATH quantities. Conversion of a staking amount to ATH is governed by the existing approved price registry and must not change the USD turnover recorded.

## 3. Rank salary compatibility

This decision changes Rank qualification volume only. It does not independently authorize changing the weekly Rank Salary amounts, payout cadence, first qualification delay, payout currency accounting, reserve source, or lifetime status.

The currently documented salary policy and 00:30 UTC weekly payout schedule must be preserved during this audit unless a separate approved decision explicitly changes them. Any mapping conflict caused by removing R1/R2 qualification must be surfaced for operator confirmation before modifying salary values or rank indices.

## 4. Required implementation invariants

1. Add an auditable per-account cumulative personal staking turnover counter.
2. Maintain cumulative downline Group turnover independently of personal turnover.
3. Rank volume view must return personal turnover, Group turnover and combined qualifying turnover.
4. Every successful stake increments the staker's personal turnover exactly once.
5. Every successful stake propagates Group turnover exactly once to every eligible upline in the referral tree.
6. A withdrawal must not decrement turnover.
7. Rank upgrades are monotonic unless a separately approved policy says otherwise.
8. The referral tree must reject cycles and must not silently truncate qualifying turnover due to a traversal-depth cap.
9. Direct-sponsor count, if retained, is checked independently from combined turnover.
10. The Rank Salary keeper registry and UI must enumerate all accounts eligible for salary under the revised Rank scheme.
11. Daily Mining rules, Mining contracts, Mining tests, Mining keepers and Mining UI must not be modified.

## 5. Known baseline mismatches to resolve

- `ATHStaking.sol` currently qualifies Rank using `smallLegTurnover` (total direct-leg turnover less the largest direct leg).
- Current thresholds are R1 $1,000, R2 $5,000, R3 $15,000, R4 $50,000, R5 $100,000, R6 $250,000, R7 $500,000, R8 $1,000,000.
- Current contract has a five-direct-sponsor minimum.
- Current tests explicitly assert the old small-leg thresholds and must be replaced/extended for the approved combined-turnover policy.
- Existing salary amounts are stored in an eight-entry Rank array. Their index mapping must be reconciled before changing Rank numbering; do not silently shift or rewrite salary amounts.

## 6. Acceptance tests required before marking this finding resolved

- Personal-only turnover reaches each threshold (subject to the separate sponsor gate).
- Group-only turnover from multiple generations reaches each threshold.
- Combined personal + Group turnover reaches a threshold even when neither component alone does.
- The largest leg is not subtracted and cannot reduce Rank turnover.
- A direct sponsor and a deep indirect member both contribute.
- Stake increments personal and every upline Group counter exactly once.
- Failed stake, duplicate event processing and withdrawal do not inflate or reduce turnover.
- Referral cycle and depth-boundary tests prove no eligible ancestor is silently omitted.
- Rank 3–8 qualification, Rank upgrade timestamps, salary maturity and keeper enumeration are consistent.
- Mining source/test tree is byte-for-byte unchanged in the proposed Staking implementation diff.

## 7. Audit release gates

No deployment, no Mainnet interaction, no Staking opening and no Mining changes are authorized by this document. Merge to `main` is not authorized until compilation, complete automated tests, CI evidence, source diff review and independent security review requirements are satisfied.
