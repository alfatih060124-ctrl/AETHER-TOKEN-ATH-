# ATH Staking Audit — Remediation Plan and Acceptance Gates

Status: planning only; no runtime changes authorized or made.
Branch: `audit/ath-staking-rank-decision-lock`
Main remains the production source of truth.

## Non-negotiable scope lock

- ATH Staking and directly coupled Staking price/oracle path only.
- Mining contract, Mining tests, Mining UI, Mining keepers, Mining schedule and Mining deployment configuration are out of scope.
- No deployment, no Mainnet transactions, no unpause, no listing activation.
- Keep all changes isolated from `main`; preserve existing production state.
- Do not change tokenomics, package rates/lock periods, Lifestyle Bonus nomenclature/rates, referral bonus rates, or salary amounts without explicit approval.

## Rank model target (approved qualification basis)

Rank turnover must be computed as:

`personalCumulativeStakingTurnoverUSDT + fullGroupCumulativeStakingTurnoverUSDT`

Where:
- Personal cumulative turnover is the sum of all stake amounts made by the account, retained historically after principal withdrawal.
- Full Group cumulative turnover is the sum of all stake amounts made by direct and indirect descendants in the account's referral tree.
- The account's own staking is not included a second time in Group turnover.
- Do not subtract the largest direct leg.
- Direct sponsor count remains a separate boolean gate only if the existing five-sponsor condition is confirmed as retained; it must never be part of the turnover arithmetic.

Approved threshold labels:
- Rank 3: $100
- Rank 4: $200
- Rank 5: $500
- Rank 6: $1,000
- Rank 7: $2,000
- Rank 8: $5,000

Unresolved business decision: disposition of Rank 1 and Rank 2, and whether the existing salary and referral-bonus amounts remain attached to their current Rank labels. Do not modify threshold/salary/referral arrays or silently reindex them before explicit confirmation.

## Remediation order

### P0 — Rank correctness and referral-tree safety
1. Add a dedicated cumulative personal-staking-turnover counter.
2. Reuse/replace group propagation with a single well-defined cumulative Group counter; prove each stake is counted once for each eligible ancestor.
3. Remove small-leg turnover from Rank qualification while retaining historical read methods/events for compatibility where safe.
4. Enforce a referral depth policy at binding time, or use a proven cycle/depth-safe design. Never silently stop traversal and report success.
5. Add tests for personal-only, direct-only, indirect-only, mixed, repeated stakes, withdrawn principal, threshold boundaries, duplicate prevention, deep chains and cycle attempts.

### P0 — Reward settlement isolation
1. Separate holder daily reward settlement from optional Network Reserve payouts.
2. Define atomicity for the Lifestyle Bonus path: holder reward must not be lost or permanently blocked by a separate reserve shortage. The chosen behavior must not create unfunded payouts or partial accounting.
3. Test sufficient Reward Reserve + insufficient Network Reserve, and the reverse, including batch keeper behavior.

### P1 — Reserve solvency and runway
1. Enumerate all liabilities charged to Reward Reserve and Network/Marketing Reserve.
2. Track or calculate accrued-but-unpaid reward liabilities, including positions after principal withdrawal.
3. Include Direct Referral, Rank Sponsor differential, Lifestyle Bonus and Rank Salary in Network Reserve runway.
4. Expose conservative runway or clearly label it as a partial metric; test zero-run-rate and price conversion edge cases.

### P1 — Price registry hardening
1. Define a trusted oracle policy, freshness requirements, valid price bounds and deviation circuit breaker.
2. Prevent arbitrary post-listing oracle replacement, or require an approved delayed/multisig governance path.
3. Fail closed on stale, invalid, or excessively deviating prices.
4. Test listing transition, oracle replacement attempts after activation, stale data, zero data, extreme values and recovery.

### P1 — Package boundary policy
Current package definitions leave fractional-value gaps because inputs support 18-decimal USDT but ranges are whole-dollar. Choose one explicit policy before code changes:
- enforce whole-dollar stake values on-chain; or
- make every package interval contiguous at the smallest supported unit.
Do not silently widen a package or alter package rates/lock durations.

### P2 — UI, keeper, ABI and event compatibility
1. Replace Rank-facing small-leg labels with personal, Group and combined turnover values.
2. Keep sponsor count as a separate eligibility display.
3. Update keeper previews and UI reads only after contract interface and compatibility plan are approved.
4. Preserve historical event interpretation; add a new event rather than changing the meaning of an existing event field.
5. Regenerate ABI only after tests and compatibility review pass.

## Required verification before closing any finding

- Clean install and deterministic Node version.
- Source self-check, syntax check, Solidity compile, full test suite.
- Dedicated new regression tests for each finding.
- ABI export diff reviewed for compatibility.
- Local release smoke and runtime security audit.
- CodeQL/security scan must have a successful run; a startup failure is not a pass.
- Draft PR review against the exact locked base SHA; no merge or deployment as part of this audit.
- Separate independent security review before any Mainnet release decision.

## Current completion statement

This plan does not fix findings. It records a safe order of work and test acceptance criteria. All previously recorded findings remain open until code, regression tests and verification evidence demonstrate closure.
