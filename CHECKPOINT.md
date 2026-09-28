# AETHER TOKEN (ATH) Engine — Checkpoint

## DONE — Steps 1–23 + Step 24A

1. Blueprint v3.1 converted into an explicit ATH engine architecture.
2. Fixed-supply ATH token retained at 1,000,000,000.
3. Mining engine rebuilt around the 180-day claim window.
4. Unsupported inherited 180-ATH hard cap removed; 180-day mining window retained.
5. Referral tier logic preserved (+10% to +50%).
6. Booster logic preserved as 100 Hash and x2 reward maximum.
7. 4-tier vesting implemented per daily mining allocation.
8. Mining reserve protection added.
9. Treasury update and emergency pause controls retained.
10. Tokenomics deploy flow expanded to distribute 70/20/5/5.
11. Team allocation cliff-lock contract added.
12. Aether Wallet runtime adapter added.
13. Automated Hardhat test suite added.
14. Security/release gates documented.
15. Mainnet deployment remains fail-closed.
16. Zero-dependency source self-check added.
17. Testnet/mainnet environment preflight added.
18. Blueprint decision register added.
19. CI workflow hardened.
20. GitHub Actions runner issue isolated.
21. Railway fallback build runner connected.
22. Compiler validation completed and findings fixed.
23. Full validation is GREEN.
24A. BSC Testnet RPC + single-wallet Testnet mode validated without blockchain deployment.

## LATEST GREEN EVIDENCE

- Current deployment-runner code commit: `9b7d57e12551b5e4be7fb82cdf72cb4521d894ac`
- Railway deployer service: `ath-testnet-deployer`
- Initial Railway deployment: `ac0ee8d2-12ed-4346-a58f-def732649935`
- Source self-check: `PASSED`
- BSC Testnet RPC: `PASSED`
- BSC chain ID: `97`
- Safe config: `READY`
- Deployment config: `READY`
- Solidity files compiled: `18`
- Automated tests: `13 passing`
- Mainnet gates: all `CLOSED`

## STEP 24B — PREFLIGHT REACHED GAS CHECK

The operator private key is now connected to the deployer service through a Railway reference and is accepted as a valid EVM key.

A real BSC Testnet preflight was executed on Railway deployment:

`3f09d0d4-4ec9-4c5e-8b4d-c50883a95391`

Result:

- Private key: present and parseable.
- BSC Testnet RPC: reachable.
- Chain ID: 97.
- Single-wallet Testnet mode: enabled.
- Mainnet gates: closed.
- Testnet deployer BNB balance: `0.0`.
- Deployment transaction: **NOT STARTED**.

A conservative minimum gas reserve of `0.02 tBNB` is now enforced before deployment begins.

## SAFETY FIXES ADDED BEFORE DEPLOYMENT

- Single-wallet Testnet mode now correctly allows Liquidity + Marketing allocations to share the deployer address.
- Deployer ATH balance checks account for overlapping allocation destinations.
- Post-deployment checks now sum allocations for shared destination addresses instead of falsely expecting separate balances.
- The one-shot deployment runner remains blocked unless `TESTNET_DEPLOY_APPROVED=true`.
- Deployment remains blocked if existing ATH deployment address variables are already present.

## CURRENT BLOCKER

Fund the dedicated BSC Testnet wallet used by `PRIVATE_KEY` with at least:

`0.02 tBNB`

No real BNB is required for this Testnet deployment.

`BSCSCAN_API_KEY` remains a later Step 26 verification input and is not required for Step 25 deployment.

## NEXT — Steps 24B–28

24B. Fund the Testnet deployer with at least 0.02 tBNB and rerun preflight.
25. If preflight passes, temporarily open the Testnet approval gate, run the one-shot deployment, capture addresses, close the gate, and run post-deployment invariants.
26. Add `BSCSCAN_API_KEY`, verify contracts, then test Power → Daily Claim → Booster → Vesting Claim.
27. Freeze verified Testnet addresses + ABI and connect them to Aether Wallet Mining.
28. Keep Mainnet blocked until audit, production multisig, exact Team lock period and ATH/USDT liquidity-lock decisions are complete.
