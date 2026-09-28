# AETHER TOKEN (ATH) Engine — Checkpoint

## DONE — Steps 1–23 + Step 24A

1. Blueprint v3.1 converted into an explicit ATH engine architecture.
2. Fixed-supply ATH token retained at 1,000,000,000.
3. Mining engine rebuilt around the 180-day claim window.
4. Removed the inherited hard cap of 180 ATH per user because that cap was not specified in the blueprint and would cancel part of the referral/booster economics.
5. Referral tier logic preserved (+10% to +50%).
6. Booster logic preserved as 100 Hash and x2 reward maximum.
7. 4-tier vesting implemented per daily mining allocation.
8. Mining reserve protection added.
9. Treasury update and emergency pause controls retained.
10. Tokenomics deploy flow expanded to distribute 70/20/5/5.
11. Team allocation cliff-lock contract added; exact 12–18 month duration remains a deployment choice.
12. Aether Wallet runtime adapter added for read state + unsigned transaction building.
13. Automated Hardhat test suite added.
14. Security/release gates documented.
15. Deployment config hardened: no fallback private key and mainnet is fail-closed behind explicit audit/multisig/liquidity gates.
16. Zero-dependency source self-check added.
17. Testnet/mainnet environment preflight added.
18. Blueprint ambiguity/decision register added.
19. CI workflow hardened.
20. GitHub Actions runner issue isolated: jobs ended before runner assignment; no Solidity result was produced there.
21. Railway fallback build runner created and connected to `main`.
22. Real compiler validation completed. NatSpec and stack-depth findings were fixed.
23. Full validation is GREEN on Railway.
24A. Latest `main` HEAD was revalidated on a fresh Railway service without any blockchain transaction.

## GREEN VALIDATION EVIDENCE

- Latest validated source commit: `6591dcd75ea8d8080cdfb261c0f9b85a34265347`
- Railway validation deployment: `5e722129-39ba-4cd6-94f2-588975191451`
- Result: `SUCCESS`
- Source self-check: `PASSED`
- Deployment-script syntax check: `PASSED`
- BSC Testnet RPC check: `PASSED`
- BSC chain ID observed: `97`
- Safe Testnet config: `READY`
- Mainnet gates: all `CLOSED`
- Solidity files compiled: `18`
- Automated tests: `13 passing`
- No BSC contract deployment was performed during validation.

## CURRENT STEP — 24B: OPERATOR TESTNET PREFLIGHT

The remaining Testnet deployment gate is intentionally operator-controlled. These values are still absent and must not be invented or committed:

- `PRIVATE_KEY` — dedicated funded BSC Testnet deployer secret; store only as a Railway secret.
- `OWNER_ADDRESS`
- `TREASURY_ADDRESS`
- `TEAM_BENEFICIARY`
- `LIQUIDITY_WALLET`
- `MARKETING_WALLET`

Safe values already loaded in the Railway Testnet validation service:

- `BSC_TESTNET_RPC`
- `ATH_CHAIN_ID=97`
- `TEAM_LOCK_DAYS=365` for Testnet validation only
- all four Mainnet release gates = `false`

The deployer must hold Testnet BNB before `npm run preflight:testnet` can pass.

`BSCSCAN_API_KEY` remains separate and is required only for Step 26 contract verification.

## NEXT — Steps 24B–28

24B. Load the operator-controlled Testnet secret/address configuration and run `npm run preflight:testnet`.
25. Deploy ATHToken + MiningAirdrop + TeamTokenLock to BSC Testnet only.
26. Verify contracts on BscScan and run real Web3 test flow: Power → Daily Claim → Booster → Vesting Claim.
27. Freeze verified Testnet contract addresses + ABI and connect them to the Aether Wallet Mining menu.
28. Keep BSC Mainnet fail-closed until external audit, production multisig, exact Team lock period and ATH/USDT liquidity-lock decisions are complete.
