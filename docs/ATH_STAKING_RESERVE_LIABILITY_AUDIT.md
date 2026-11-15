# ATH Staking — Reserve Liability and Settlement Inventory

Status: source-level audit evidence only; no runtime changes.
Branch: `audit/ath-staking-rank-decision-lock`
Scope: `contracts/ATHStaking.sol` only. Mining remains out of scope.

## Executive result

The contract has two nominally separate reserves, but the current daily settlement path couples them: `_settleDailyReward` will not settle a holder's earned daily reward unless both the Reward Reserve and the Network/Marketing Reserve can cover the holder reward and all L1-L10 Lifestyle Bonus payouts in the same transaction.

This means Network Reserve exhaustion can block an otherwise fully funded holder reward. Conversely, the contract does not record a separate global accrued-reward liability that remains visible after principal withdrawal. The existing runway view therefore cannot be treated as a complete solvency measure.

No finding is marked fixed by this document.

## Reserve flow inventory

| Flow | Source reserve | Trigger / accounting | Audit observation |
|---|---|---|---|
| Holder daily staking reward | Reward Reserve (160M ATH cap) | `_settleDailyReward` computes pending USDT, converts at current oracle price, then debits `rewardReserveATH` | Settlement is gated by Network Reserve as well |
| Lifestyle Bonus / Matching Staking L1-L10 | Network/Marketing Reserve (50M ATH cap) | Same daily settlement; `_previewNetwork` applies 8%, 5%, 3%, 2%, 1%, then 0.5% for L6-L10 to rewardATH | Payout is bundled atomically with holder reward; no separate deferred claim/liability |
| Direct Referral | Network/Marketing Reserve | Paid immediately in `stake()` by `_payReferralAndRankPassUp`; unranked baseline 10%, ranked direct sponsor total rate from rank array | Stake can revert when reserve is insufficient |
| Rank Sponsor Differential / pass-up | Network/Marketing Reserve | Paid immediately in `stake()` as higher-rank differential while traversing upline | Traversal is bounded at 64; reserve debits occur in the same transaction as stake |
| Rank Salary | Network/Marketing Reserve | Due by weekly slots; `_rankSalaryDue` and `_settleRankSalary` debit network reserve | `rankSalaryRunwayWeeks()` includes only aggregate weekly salary, not other Network Reserve flows |

The 160M and 50M caps are enforced by `fundRewards` and `fundNetworkReserve`. The documented allocation split is therefore reflected in funding caps, but the settlement dependency described above crosses the two operational reserves.

## Accrued holder reward liability

Source facts:

1. `getPendingRewardUSDT(account, stakeId)` derives pending rewards from the position's scheduled available days minus `rewardDaysClaimed`.
2. `withdrawPrincipal` marks the principal withdrawn and reduces `activeDailyRewardRunRateUSDT`, but does not clear the position's unclaimed reward days or pending reward calculation.
3. Consequently, a fully matured position can have zero active daily run-rate contribution while still exposing pending daily rewards through `getPendingRewardUSDT`.
4. `rewardReserveRunwayDays()` converts Reward Reserve to USDT and divides only by `activeDailyRewardRunRateUSDT`. It does not subtract or add a separately tracked accrued-but-unpaid amount.
5. The contract has no global counter updated on reward accrual and settlement for all outstanding pending daily reward liabilities.

Implication: the runway view is an active-rate estimate, not a complete liability-adjusted runway. It can overstate the reserve available for future rewards if accrued rewards remain unpaid, including after principal withdrawal.

## Settlement coupling and atomicity

Current flow in `_settleDailyReward`:

- Compute holder `pendingUSDT` and `rewardATH`.
- Compute all available Lifestyle Bonus payouts using `_previewNetwork`.
- Require both `rewardReserveATH >= rewardATH` and `networkReserveATH >= networkTotal`.
- Only then advance `rewardDaysClaimed`, update `lastClaimTime` and `totalClaimedUSDT`, debit both reserves, and transfer holder reward plus uplines' matching payouts.

Because the transaction is atomic, there is no partial transfer if any later operation reverts. However, the combined reserve precondition means an insufficient Network Reserve prevents holder reward settlement even when Reward Reserve alone is sufficient. Batch processing also returns `false` for that position, leaving it unsettled.

The code does not currently create a separate deferred Lifestyle Bonus claim. A remediation must not simply pay the holder while silently dropping or creating an unfunded matching obligation. The product/business decision must explicitly choose and document one safe behavior, for example:
- keep the holder claim independent and record matching payouts as deferred liabilities payable only when funded; or
- keep both payouts atomic and disclose that holder reward availability is conditional on matching-reserve solvency.

Neither behavior is selected or implemented by this audit document.

## Network Reserve runway gap

`rankSalaryRunwayWeeks()` uses:
- current `networkReserveATH`, converted using the current oracle price; and
- `totalWeeklyRankSalaryUSDT` as its only denominator.

The Network Reserve also pays Direct Referral, Rank Sponsor Differential, and L1-L10 Lifestyle Bonus. These are activity-dependent flows, not captured by the weekly salary denominator. Therefore the function name can be misread as total Network Reserve runway when it is only a Rank Salary-only estimate.

A complete metric needs an explicit measurement model. Possible conservative approaches include:
- disclose separate trailing-period actual outflow rates for each Network Reserve category and combine them;
- publish per-category runway plus a clearly labelled aggregate estimate; or
- expose actual liabilities and a scenario-based forward run-rate, with assumptions visible.

Do not invent a future activity rate or silently reinterpret the existing getter.

## Required regression coverage

Before changing runtime code, add tests for:

1. Reward Reserve sufficient / Network Reserve insufficient: define expected holder settlement behavior and verify no lost or duplicated Lifestyle Bonus liability.
2. Reward Reserve insufficient / Network Reserve sufficient: verify no Network Reserve debit and no partial holder payout.
3. Both reserves sufficient: verify exact holder and L1-L10 payouts, reserve deltas and accounting totals.
4. Batch keeper behavior when only one reserve is insufficient.
5. Principal withdrawn with unclaimed matured reward: pending reward remains measurable and payable; liability metric still includes it.
6. Several positions across active, matured, partially claimed and principal-withdrawn states: aggregate outstanding liability equals the sum of per-position pending rewards.
7. Rank Salary runway with only salary outflow versus mixed referral, differential and Lifestyle Bonus activity; label and outputs must not imply complete reserve runway unless all categories are represented.
8. Price conversion changes: document whether liabilities are measured in USDT terms or ATH terms and test the chosen policy.

## Scope and status

- Documentation only; no Solidity, test, UI, keeper, workflow, or deployment files changed.
- No test suite or CI run is claimed by this document.
- No Mining changes.
- No deployment, Mainnet interaction, unpause, or listing activation.
- All related audit findings remain open pending implementation, regression tests and independent verification.
