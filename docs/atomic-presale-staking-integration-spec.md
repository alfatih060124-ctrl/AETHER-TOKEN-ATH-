# AETHER ATH Atomic Presale-to-Staking Integration Specification

Status: design gate only. This document does not implement or authorize deployment of a contract.

## Current source behavior

- `ATHPresale.buyATH(athAmount, maxPaymentAmount)` collects the configured payment token and transfers ATH from the Presale reserve to the buyer.
- `ATHStaking.stake(packageId, amountUSDT, referrer)` computes principal ATH from the staking price oracle, then transfers ATH from the buyer into Staking with `safeTransferFrom`.
- Consequently, the current source does not provide one atomic purchase-and-stake call. A UI sequence of two transactions is not an acceptable substitute for the requested flow.

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
