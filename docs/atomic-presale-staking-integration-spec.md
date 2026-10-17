# AETHER ATH Atomic Presale-to-Staking Integration Specification

Status: design gate only. This document does not implement or authorize deployment of a contract.

## Current source behavior

- The ATH Presale price is a **discrete step schedule**, not a continuously changing price formula: it starts at $0.07 per ATH and increases by exactly $0.001 per ATH for each completed 100,000 ATH sold, subject to the 30,000,000 ATH Presale allocation and the configured final stage.
- `ATHPresale.buyATH(athAmount, maxPaymentAmount)` collects the configured payment token and transfers ATH from the Presale reserve to the buyer. Its quote must follow the step schedule and the cumulative sold amount.
- `ATHStaking.stake(packageId, amountUSDT, referrer)` computes principal ATH from the staking price oracle, then transfers ATH from the buyer into Staking with `safeTransferFrom`.
- Consequently, the current source does not provide one atomic purchase-and-stake call. A UI sequence of two transactions is not an acceptable substitute for the requested flow.
- **No new or continuous pricing curve may be introduced.** The base price stage advances by exactly $0.001 per completed 100,000 ATH sold. For a purchase that would cross a stage threshold, apply the owner's specified **availability-majority rule**: let `requestedATH` be the quantity the buyer requests and `remainingAtCurrentStage` be the quantity still available before the next stage. If `remainingAtCurrentStage / requestedATH >= 50%`, the whole purchase uses the current stage price; if it is **less than 50%**, the whole purchase uses the next stage price. An exact 50:50 tie stays at the current (lower) stage price. Examples: 100 remaining / 1,000 requested => next stage price; 900 / 1,000 => current stage price; 500 / 1,000 => current stage price; 400 / 1,000 => next stage price. The contract must apply this rule deterministically using integer arithmetic (avoid floating-point percentages), and Presale payment, ATH quantity, stage accounting, and Staking principal must all use the same selected stage price.

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

## Implementation architecture gate (required before coding)

The implementation must resolve the existing contract boundary explicitly; do not add a superficial coordinator.

### Required contract interface changes

- Add an owner-configured, nonzero Presale settlement address to Staking, with an event and a pause-only configuration rule. Staking must reject settlement calls from any other address.
- Refactor the existing stake body into a shared internal routine that accepts the **beneficiary** and an explicitly supplied principal amount, while preserving the existing public stake(packageId, amountUSDT, referrer) behavior for normal users. The settlement-only routine must verify the package and amount against current on-chain package data, record all positions and referral/turnover accounting against the beneficiary, and must not pull principal ATH from that beneficiary.
- Presale settlement must calculate a payment-denominated quote from the configured payment token decimals and the authoritative sale curve. It must determine the ATH principal using a documented inverse-quote rule, reject zero amounts, enforce package min/max against the actual payment amount, and enforce a buyer-provided maxPaymentAmount plus deadline.
- The Presale must transfer the calculated ATH principal directly from its protected reserve to Staking and call the settlement-only routine in the same transaction. The entire transaction must revert if any validation or accounting step fails.
- The Staking principal price/oracle snapshot must be reconciled with the Presale curve. The integration must not silently accept a price mismatch or let the frontend supply an authoritative price. The spec default is strict reconciliation; any alternative tolerance requires explicit approval.
- Staking's existing 300M allocation, 160M reward pool, 50M network pool, direct-referral rules, Lifestyle Bonus L1-L10 percentages, rank eligibility, salary and turnover logic must remain unchanged. Presale principal transfers must not be counted as reward/network reserve funding.

### Implementation sequence

1. Implement the internal beneficiary-based staking routine and settlement authorization in a dedicated feature branch; preserve the existing public stake entry point and its semantics.
2. Add the Presale-to-Staking settlement path with a fixed configured Staking address and explicit price/decimal conversion rules.
3. Add tests that compare existing stake behavior before/after refactor, successful atomic settlement ownership, payment/ATH reconciliation, package bounds, pause/authorization, stale deadline, slippage, reserve shortage, referral rules, and full rollback after a deliberately forced downstream revert.
4. Run the complete Hardhat release gate (source:selfcheck, syntax check, compile, all tests, ABI export and local release smoke). Resolve failures rather than weakening assertions.
5. Keep Presale and Staking paused; keep the frontend purchase action disabled until the contracts are deployed to a non-production test environment and verified against the actual payment token, oracle and package configuration.

This architecture is a required implementation gate, not evidence that the integration has already been implemented or tested.
