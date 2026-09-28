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

- Last fully validated code commit: `86b30e4611b0829398210f1e4f2c507b9a73010a`
- Railway deployment: `c5e1a309-fa60-4070-acc5-aabaea956786`
- Result: `SUCCESS`
- BSC Testnet chain ID: `97`
- Testnet single-wallet mode: `ENABLED`
- Source self-check: `PASSED`
- Script syntax checks: `PASSED`
- Solidity files compiled: `18`
- Automated tests: `13 passing`
- Mainnet gates: all `CLOSED`

## STEP 24B — DEPLOYMENT RUNNER READY

Additional fail-closed deployment controls are now prepared in GitHub:

- `TESTNET_USE_DEPLOYER_ROLES=true` reduces the Testnet role setup to the deployer wallet.
- `TESTNET_DEPLOY_APPROVED=false` is loaded in Railway.
- `npm run deploy:once:testnet` refuses to transact unless approval is explicitly true.
- The one-shot runner also refuses if deployed ATH contract address variables already exist.
- It runs `preflight:testnet` before any deployment transaction.

No blockchain transaction has been performed by these changes.

## CURRENT BLOCKER

The Railway service still has no `PRIVATE_KEY`.

The only remaining input before preflight is:

- `PRIVATE_KEY` — dedicated funded BSC Testnet deployer secret, stored only in Railway.

The deployer must hold Testnet BNB for gas.

`BSCSCAN_API_KEY` remains a later Step 26 verification input and is not required to deploy.

## NEXT — Steps 24B–28

24B. Operator stores `PRIVATE_KEY` in Railway; run preflight and verify Testnet BNB balance.
25. Set the Testnet approval gate for the authorized deployment, run the one-shot deploy, capture addresses, immediately close the gate, and run post-deploy invariants.
26. Add `BSCSCAN_API_KEY`, verify contracts, then test Power → Daily Claim → Booster → Vesting Claim.
27. Freeze verified Testnet addresses + ABI and connect them to Aether Wallet Mining.
28. Keep Mainnet blocked until audit, production multisig, exact Team lock period and ATH/USDT liquidity-lock decisions are complete.
