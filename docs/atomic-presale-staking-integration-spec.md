# AETHER ATH Atomic Presale-to-Staking Integration Specification

Status: design gate only. This document does not implement or authorize deployment of a contract.

## Current source behavior

- The ATH Presale price is a **discrete step schedule**, not a continuously changing price formula: it starts at $0.07 per ATH and increases by exactly $0.001 per ATH for each completed 100,000 ATH sold, subject to the 30,000,000 ATH Presale allocation and the configured final stage.
- `ATHPresale.buyATH(athAmount, maxPaymentAmount)` collects the configured payment token and transfers ATH from the Presale reserve to the buyer. Its quote must follow the step schedule and the cumulative sold amount.
- `ATHStaking.stake(packageId, amountUSDT, referrer)` computes principal ATH from the staking price oracle, then transfers ATH from the buyer into Staking with `safeTransferFrom`.
- Consequently, the current source does not provide one atomic purchase-and-stake call. A UI sequence of two transactions is not an acceptable substitute for the requested flow.
- **No new or continuous pricing curve may be introduced.** The price starts at $0.070 and rises by exactly $0.001 per ATH after each completed 100,000 ATH sold. A purchase crossing a threshold is split into tranches: the remaining ATH in the current 100,000-token tranche is charged at the current stage price, and any further ATH is charged at the next stage price, continuing across each threshold. Example: buying 200,000 ATH at the opening stage costs 100,000 × $0.070 + 100,000 × $0.071 = $14,100. Buying 150,000 ATH costs 100,000 × $0.070 + 50,000 × $0.071 = $10,550. Quote and purchase must use the same tranche-by-tranche calculation, with explicit decimal conversion and upward rounding to payment-token units. The staking principal must reconcile with this price curve, not a mismatched oracle price.

## Required design decision

Prefer a reviewed integration entry point that calls the Presale and Staking logic in a single EVM transaction, with the buyer as the logical staking account. Before implementation, confirm the ownership/authorization model, contract deployment topology, price-oracle identity, payment-token decimals, and whether the existing contracts can safely support an authorized coordinator without changing their accounting assumptions.

Do not add a coordinator that simply calls `ATHStaking.stake` as itself: that would make the coordinator the staking account unless the staking contract is deliberately redesigned to support an authorized beneficiary. Do not transfer ATH to the buyer and then ask the buyer to stake in a second transaction.

## Required atomic flow

1. Validate the caller, nonzero beneficiary (if relayed), package ID, active package, package amount bounds, deadline, and slippage/max-payment limit.
2. Read the current authoritative Presale price and the authoritative Staking package from verified contracts. Do not trust UI-supplied price, duration, daily rate, or package bounds.
3. Compute the ATH principal with explicit token decimals and documented rounding. Ensure Presale quote and Staking principal use compatible pricing rules; revert if the values disagree beyond an explicitly approved tolerance (default: no tolerance).
4. Collect the configured payment token from the buyer using safe ERC-20 handling and verify the expected amount/recipient. Do not accept an arbitrary token address from the caller.
5. Consume/allocate the ATH reserve and create the Staking position for the buyer in the same transaction. Staking accounting must record the buyer as owner, not the coordinator.
6. Bind the referral only under the existing contract's first-binding and cycle-prevention rules. Preserve the existing bonus, rank, and turnover rules; do not change percentages or eligibility.
7. Emit linked purchase and staking events containing buyer, package ID, payment amount/token, ATH principal, stake ID, price snapshot, and transaction context.
8. If any step fails, the entire transaction must revert: no payment retained, no ATH consumed, no position opened, no referral/turnover updates.

## Security and edge-case test matrix

- Package ID out of range, inactive package, and amount below/above the authoritative bounds.
- Payment token with expected decimals and malformed/unsupported token behavior.
- Stale deadline, price movement, max-payment exceeded, zero/rounded-to-zero ATH principal.
- Presale reserve insufficient; Staking principal/reward reserve constraints fail.
- Staking paused, Presale paused, wrong chain, wrong contract addresses, or incompatible oracle.
- Referral self-reference, referral cycle, existing referrer binding, and no referrer.
- Reentrancy attempts from token hooks and malicious token mocks.
- Duplicate/replayed requests and signature nonce/deadline checks if relayed/meta-transactions are supported.
- Failure after payment collection but before position creation: assert complete transaction rollback.
- Successful flow: buyer owns the position; payment and ATH accounting reconcile; event IDs and package terms match on-chain state.
- Fuzz/property tests for decimal conversions, rounding boundaries, package limits, and invariant preservation.

## Release gates

- Contract changes reviewed by a Solidity/security reviewer.
- Unit, integration, fuzz, and invariant tests pass in CI.
- Deploy only to a non-production test environment first; verify contract addresses, chain ID, oracle, payment token, package values, and reserve balances.
- Frontend remains fail-closed until verified deployment configuration and audit approval are available.
- Production deployment/activation requires explicit owner approval. This specification itself does not authorize either.

## Pricing consistency gate

Large purchases are intentionally allowed to cross multiple price stages. They are not charged at a single selected stage price: each 100,000-ATH tranche is charged at its own stage price, and the next tranche rises by $0.001 per ATH. This preserves the published price schedule regardless of purchase size. Keep real purchase execution disabled until the quote/buy behavior, token-decimal conversion, and staking principal reconciliation pass tests and review.

## Implementation architecture gate (required before coding)

The implementation must resolve the existing contract boundary explicitly; do not add a superficial coordinator.

### Required contract interface changes

- Implemented in the current feature branch: Staking has an owner-configured, nonzero Presale settlement address, an update event, and a pause-only configuration rule; settlement calls from other addresses are rejected.
- Implemented in the current feature branch: the existing stake body is shared through a beneficiary-based internal routine, preserving the public `stake(packageId, amountUSDT, referrer)` entry point. `stakeFromPresale` records the beneficiary as position owner and does not pull principal ATH from that beneficiary. It currently requires the supplied principal to equal `getATHAmount(amountUSDT)` from the unified oracle. This strict requirement must be reconciled with tranche-weighted Presale purchases before the Presale can call it successfully.
- Presale settlement must calculate a payment-denominated quote from the configured payment token decimals and the authoritative sale curve. It must determine the ATH principal using a documented inverse-quote rule, reject zero amounts, enforce package min/max against the actual payment amount, and enforce a buyer-provided maxPaymentAmount plus deadline.
- The Presale must transfer the calculated ATH principal directly from its protected reserve to Staking and call the settlement-only routine in the same transaction. The entire transaction must revert if any validation or accounting step fails.
- The Staking principal price/oracle snapshot must be reconciled with the Presale curve. The integration must not silently accept a price mismatch or let the frontend supply an authoritative price. The spec default is strict reconciliation; any alternative tolerance requires explicit approval.
- Staking's existing 300M allocation, 160M reward pool, 50M network pool, direct-referral rules, Lifestyle Bonus L1-L10 percentages, rank eligibility, salary and turnover logic must remain unchanged. Presale principal transfers must not be counted as reward/network reserve funding.

### Implementation sequence

1. Completed in source, tests added but not executed: implement the internal beneficiary-based staking routine and settlement authorization; preserve the public stake entry point.
2. Remaining: resolve how tranche-weighted Presale pricing produces the exact principal amount accepted by Staking. The current unified oracle is a single current-stage price, so it cannot automatically represent a purchase that spans multiple tranches. Do not bypass this mismatch by trusting frontend-supplied prices.
3. Remaining: implement the Presale-to-Staking settlement path with fixed contract configuration, explicit token-decimal conversion, deadline and slippage checks, and atomic rollback.
4. Remaining: add integration tests for successful settlement, payment/ATH reconciliation, package bounds, pause/authorization, deadline, slippage, reserve shortage, referral rules, and full rollback after a forced downstream revert.
5. Run the complete Hardhat release gate (source:selfcheck, syntax check, compile, all tests, ABI export and local release smoke). Resolve failures rather than weakening assertions.
6. Keep Presale and Staking paused; keep the frontend purchase action disabled until contracts are deployed to a non-production test environment and verified against actual payment token, oracle and package configuration.

This architecture is a required implementation gate, not evidence that the integration has already been implemented or tested.
