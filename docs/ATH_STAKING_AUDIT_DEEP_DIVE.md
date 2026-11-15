# ATH Staking Audit — Deep-Dive Addendum

Baseline: `53a606fde30ba71836cc1278aeae86eb427a7e48`  
Audit branch: `audit/ath-staking-rank-decision-lock`

This addendum records further source-level findings discovered after the initial register. It does not modify Staking runtime code, Mining code or deployment configuration.

## STK-011 — Rank threshold / salary / referral bonus index conflict (Critical)

The approved Rank turnover decision defines only Rank 3–8 thresholds:
- R3 $100
- R4 $200
- R5 $500
- R6 $1,000
- R7 $2,000
- R8 $5,000

The baseline contract has eight threshold slots and eight weekly salary slots:
- R1 $25/week
- R2 $75/week
- R3 $200/week
- R4 $500/week
- R5 $1,000/week
- R6 $2,000/week
- R7 $5,000/week
- R8 $10,000/week

The rank sponsor bonus array is also indexed R1–R8 (13%, 16%, 19%, 22%, 25%, 28%, 31%, 35%).

The approved threshold sequence therefore cannot safely be inserted into the existing array without deciding what happens to R1 and R2 and confirming that the existing salary and sponsor-bonus amounts remain attached to the same Rank labels. The contract's salary maturity and payout logic also uses the rank index directly.

**Release blocker:** Do not edit Rank arrays or shift salary/referral indices until the operator confirms the mapping. Existing salary values should not be silently reinterpreted.

## STK-012 — UI and keeper expose obsolete Rank qualification data (High)

The Staking web client currently reads `rankSalaryPreview` fields named `smallLegTurnover` and `sponsors`, displays `0 / 5`, and separately renders the old small-leg statistic as a Rank-facing figure. The Rank salary keeper ABI also labels its turnover field as `smallLegTurnover`.

After the Rank formula change, the user interface and keeper evidence must show:
- personal cumulative staking turnover,
- full downline Group turnover,
- combined Rank qualifying turnover,
- separate direct sponsor count / sponsor gate,
- current Rank and next threshold.

The small-leg analytics can remain available as an optional network statistic, but must not be labelled or used as Rank qualifying volume.

## STK-013 — Package boundaries leave fractional-amount gaps (Medium)

Constructor package ranges are:
- $10–$99
- $100–$499
- $500–$1,999
- $2,000–$9,999
- $10,000–$49,999
- $50,000+

The contract accepts 18-decimal USDT accounting amounts and does not enforce whole-dollar inputs. Consequently values such as $99.50, $499.50, $1,999.50, $9,999.50 and $49,999.50 are outside every package range and cannot be staked. The UI should not imply continuous ranges if the contract intends integer-dollar steps.

**Decision required:** Either retain integer-dollar-only package policy and enforce/document it explicitly, or make ranges contiguous. Do not silently change package rates or boundaries.

## STK-014 — Official market oracle can be replaced after listing (High)

`ATHPriceRegistry.activateOfficialListing()` is one-way, but `setMarketPriceOracle()` remains callable by the owner after activation. A compromised or mistaken owner key could replace the price source after listing. The market reader checks only for nonzero price, without freshness, bounds or deviation controls.

Required: immutable/locked oracle after activation, or a separately governed timelocked update process with price validity safeguards. Any change must preserve the shared price source policy and be tested.

## STK-015 — Holder count is an owner assertion, not independently verified (Medium)

`recordHolderCount(uint256)` accepts any owner-supplied number. `listingReady()` trusts that value. The 15,000-holder condition is therefore an operational attestation, not an on-chain count of unique beneficial holders.

Required: define an evidence-backed holder-count process (including exclusions, duplicate handling and snapshot block) and make clear in UI/docs that this is an attested count unless independently proven.

## STK-016 — Network reserve runway omits two major outflow classes (High)

The 50M Network/Marketing reserve funds direct referral, L1–L10 Lifestyle Bonus / Matching Staking and Rank Salary. `rankSalaryRunwayWeeks()` divides the reserve by weekly Rank Salary only. It does not include direct referral or Lifestyle outflows, so it can overstate runway substantially.

Required: publish separate trailing and forward-looking outflow metrics for all three classes, outstanding payable liabilities, and a conservative reserve runway. Do not change reserve allocation caps as part of telemetry work.

## STK-017 — Reward reserve runway ignores accrued-but-unclaimed rewards (High)

`activeDailyRewardRunRateUSDT` decreases when principal is withdrawn. However, a withdrawn position may still have unpaid rewards that remain claimable. A runway metric based only on active daily run rate can therefore overstate available reward-reserve runway.

Required: expose accrued reward liabilities independently from future active accrual, and calculate reserve coverage against both.

## STK-018 — Rank qualification event reports old small-leg metric (Medium)

`RankAchieved` event and `rankSalaryPreview` expose small-leg turnover. Once combined turnover is the Rank source of truth, event payloads, ABI consumers, keeper logs and UI need explicit fields for personal, Group and combined turnover. Preserve historical event compatibility where practical; do not silently relabel an old event field with a new meaning.

## Updated closure conditions

- STK-011 must be resolved by explicit salary and referral-bonus index mapping approval before Rank code edits.
- STK-013 must be resolved by explicit package-boundary policy approval.
- STK-001/002/003 must be implemented with storage-safe, once-only turnover accounting and depth enforcement.
- STK-004/005/017 must have a liability-safe reward settlement and reserve accounting design.
- STK-006/014/015 must be hardened before listing readiness can be treated as trustworthy.
- STK-012/018 must be reconciled against the contract ABI and UI.
- All Staking tests and CI must pass; Mining files must remain unchanged in the proposed runtime diff.
- Independent audit is still required before any Mainnet consideration.

No runtime code, Mining code, deployment configuration or Mainnet state was changed by this addendum.
