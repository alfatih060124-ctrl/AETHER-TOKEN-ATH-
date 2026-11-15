# ATH Staking Audit — Test Coverage and Source Verification

Audit branch: `audit/ath-staking-rank-decision-lock`
Base `main` HEAD: `53a606fde30ba71836cc1278aeae86eb427a7e48`
Audit branch HEAD before this note: `47fbad44e81efef136e1bfc2d94b8a626c5ecdbd`

## Scope and safety lock

- Review only ATH Staking and the directly coupled ATH price registry.
- Do not modify Mining contracts, tests, UI, keeper schedules, or deployment configuration.
- Do not deploy, submit transactions, unpause Staking, or activate Mainnet.
- This note is documentation-only. No runtime code or test behavior is changed.
- User-approved Rank qualification overrides the legacy small-leg rule: cumulative personal staking turnover plus total cumulative turnover of the full direct/indirect Group. The approved qualification thresholds are R3 $100, R4 $200, R5 $500, R6 $1,000, R7 $2,000, R8 $5,000. Rank sponsor-count gate, if retained, remains a separate condition and must not be mixed into turnover.

## Source facts reconfirmed

1. `getEligibleRank()` checks `directSponsorCount >= 5`, then qualifies exclusively against `getSmallLegTurnoverUSDT()`.
2. `_propagateLegTurnover()` propagates only the current stake amount up at most 64 referral edges; it does not maintain the user's own cumulative staking turnover as a distinct Rank metric.
3. `_createsReferralCycle()` returns false after the 64-edge scan without proving that the remaining chain is acyclic. Referral binding does not enforce a maximum depth, so a cycle longer than the scan bound is not ruled out by this check.
4. `_settleDailyReward()` computes the 10-level Lifestyle Matching liability and requires both Reward Reserve and Network Reserve before settling the holder's daily reward. A Network Reserve shortage can therefore block an otherwise fully funded holder reward.
5. `rewardReserveRunwayDays()` uses active daily run rate only. The contract allows principal withdrawal while a position's unclaimed daily rewards remain queryable/claimable; therefore the runway view can omit accrued unpaid liabilities after active principal leaves the active run-rate denominator.
6. `rankSalaryRunwayWeeks()` divides the Network Reserve by weekly Rank Salary only. It omits Direct Referral, Rank Sponsor differential and L1-L10 Lifestyle Matching outflows, all of which draw on the same reserve.
7. `ATHPriceRegistry` allows the owner to replace `marketPriceOracle` after `officialListingActivated`; `_readMarketPrice()` only rejects zero. There is no freshness, maximum-deviation, bounds, or circuit-breaker check in this registry.
8. Package boundaries are integer-dollar ranges while stake input is 18-decimal USDT. The contract accepts fractional USDT values, leaving fractional gaps between configured package ranges.

## Existing automated test coverage observed

The current `test/ATHStaking.test.js` contains tests for:
- six package configuration and package snapshot behavior;
- separation of principal, Reward Reserve, and Network/Marketing Reserve;
- direct referral funding from Network/Marketing Reserve;
- ordinary referral-cycle rejection;
- the legacy five-leg small-leg Rank example and five-direct-sponsor gate;
- legacy R1-R8 small-leg thresholds, weekly salaries and sponsor differential rates;
- Rank salary schedule, reserve debit, and lifetime salary after principal withdrawal;
- ATH conversion at the current reference price.

These tests currently assert the legacy small-leg Rank model and legacy R1-R8 threshold sequence. They are regression evidence for current source behavior, not evidence that the latest user-approved Rank decision has been implemented.

## High-priority missing regression tests before any runtime fix can be considered complete

- Personal-only staking turnover qualifies correctly at the approved Rank thresholds when combined Group turnover is zero.
- Full Group turnover includes direct and indirect descendants, without subtracting the largest leg.
- The personal + Group sum is counted exactly once; no double-counting across direct/indirect propagation.
- Direct sponsor count remains a separate qualification predicate, if confirmed, and cannot alter the turnover amount.
- Rank 3–8 qualification maps to the intended salary slots without accidental R1/R2 index shifting. Salary and referral-rate label mapping remains blocked on explicit policy confirmation.
- Referral depth at and beyond the configured limit is handled safely; cycles cannot be introduced beyond the scan limit and turnover/referral propagation cannot silently truncate.
- A holder's daily reward can settle when Reward Reserve is sufficient even if the Network Reserve cannot cover the optional matching payouts; matching behavior must fail independently and atomically according to an approved policy.
- Reserve runway includes every liability stream charged to each reserve, including already accrued/unpaid rewards and all Network Reserve payout classes.
- Fractional package boundary behavior is explicit and tested (either reject fractional stake amounts at the contract boundary or make package ranges contiguous).
- Post-listing oracle replacement is impossible or protected by an approved delay/guard, and market price freshness/deviation failures fail closed.
- Holder-count listing gate is evidence-based or clearly identified as an owner attestation rather than an independently verified on-chain unique-holder count.

## Current disposition

No findings are marked fixed by this note. No runtime code has been changed. CI, compile, tests, ABI export and security scans have not been run in this continuation. The audit remains open and Mainnet release remains blocked pending resolution, implementation, independent review and passing evidence.
