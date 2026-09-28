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
21. Railway fallback build runner connected to `main`.
22. Compiler validation completed and findings fixed.
23. Full validation is GREEN.
24A. Latest code was revalidated on Railway without any blockchain transaction.

## LATEST GREEN EVIDENCE

- Validated code commit: `86b30e4611b0829398210f1e4f2c507b9a73010a`
- Railway deployment: `c5e1a309-fa60-4070-acc5-aabaea956786`
- Result: `SUCCESS`
- BSC Testnet chain ID: `97`
- Testnet single-wallet mode: `ENABLED`
- Source self-check: `PASSED`
- Script syntax checks: `PASSED`
- Solidity files compiled: `18`
- Automated tests: `13 passing`
- Mainnet gates: all `CLOSED`
- No blockchain deployment occurred during validation.

## CURRENT STEP — 24B: OPERATOR TESTNET PREFLIGHT

To make the phone workflow simpler, Testnet now supports:

`TESTNET_USE_DEPLOYER_ROLES=true`

In this Testnet-only mode the deployer address is automatically used for Owner, Treasury, Team Beneficiary, Liquidity Wallet and Marketing Wallet.

Therefore the remaining deployment input is now only:

- `PRIVATE_KEY` — dedicated funded BSC Testnet deployer secret, stored only in Railway.

The readiness runner confirms:

- safe configuration: `READY`
- missing deployment config: `PRIVATE_KEY`
- missing verification config: `BSCSCAN_API_KEY`
- Mainnet gates: all `CLOSED`

The Testnet deployer must also hold Testnet BNB for gas before `npm run preflight:testnet` can pass.

## NEXT — Steps 24B–28

24B. Operator stores the dedicated Testnet `PRIVATE_KEY` in Railway; run preflight and verify Testnet BNB balance.
25. Deploy ATHToken + MiningAirdrop + TeamTokenLock to BSC Testnet only.
26. Add `BSCSCAN_API_KEY`, verify contracts, then run the real Web3 flow: Power → Daily Claim → Booster → Vesting Claim.
27. Freeze verified Testnet addresses + ABI and connect them to Aether Wallet Mining.
28. Keep Mainnet blocked until audit, production multisig, exact Team lock period and ATH/USDT liquidity-lock decisions are complete.
