# ATH Staking Incident Response Runbook

## Severity
- SEV-1: signer compromise, unauthorized fund movement, invariant violation, oracle manipulation, exploit in progress.
- SEV-2: Keeper malfunction, reward-settlement failure, RPC instability, reserve-accounting anomaly.
- SEV-3: display, translation, indexing or non-fund-moving issue.

## SEV-1 immediate response
1. Stop all transactional keepers.
2. Use the authorized Staking owner/multisig to call pause() if not already paused.
3. Never use recoverExcessATH until protected balances are independently reconciled.
4. Preserve transaction hashes, blocks, logs, release commit, ABI and bytecode hashes.
5. Freeze website releases that could obscure evidence.
6. Reconcile principalLiabilityATH, rewardReserveATH, networkReserveATH and ATH token balance.
7. Obtain independent security review before reopening.

## Reserve anomaly
- Keep Staking PAUSED.
- Never use principal to refill reward or marketing/network reserves.
- Reconcile funding ledgers, paid totals and current balances.
- Reopening requires on-chain opening readiness plus operator review.

## Oracle anomaly
- Keep Staking PAUSED if price is zero, unexpected or unauthorized.
- Verify Presale-linked registry, holder gate, market oracle and listing activation.
- Do not alter package economics to compensate for an oracle incident.

## Keeper incident
- Disable transactional mode and return to dry-run.
- Verify Keeper address/private-key match, chain ID, Staking address, due set and schedule window.
- Keeper failure must never change owner permissions.

## Web/Admin compromise
- Treat web output as untrusted until rebuilt from the locked release commit.
- On-chain owner checks remain authoritative.
- Rotate server-side sessions/secrets without exposing them in GitHub or chat.
- Rebuild and compare ABI/release hashes.

## Reopening criteria
Root cause identified; invariant tests pass; source/ABI/bytecode reconcile; reserves and principal reconcile; SEV-1 has independent review; authorized owner/multisig explicitly approves reopening.
