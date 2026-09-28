# AETHER TOKEN (ATH) Engine — Checkpoint

## DONE — Steps 1–23

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
23. Full validation is GREEN on Railway: source self-check PASSED, 18 Solidity files compiled, and 13 automated tests passed.

## GREEN VALIDATION EVIDENCE

- Commit: `a181c715753ad686839a9aac33e4276e32be1289`
- Railway deployment: `2e4ff2ac-c7a6-4c6d-9d1b-7f0c5dbbd87e`
- Result: `SUCCESS`
- Solidity files compiled: 18
- Automated tests: 13 passing
- No BSC deployment performed during validation.

## CURRENT STEP — 24: BSC TESTNET PREFLIGHT

The code gate is green. BSC Testnet deployment now requires operator-controlled configuration that must not be invented or committed:

- `PRIVATE_KEY` — dedicated funded BSC Testnet deployer key, stored only as a secret.
- `OWNER_ADDRESS` — intended testnet owner/admin address.
- `TREASURY_ADDRESS` — ATH Power/Booster revenue recipient.
- `TEAM_BENEFICIARY`.
- `LIQUIDITY_WALLET`.
- `MARKETING_WALLET`.
- `TEAM_LOCK_DAYS` — integer 365–550.
- `BSC_TESTNET_RPC`.
- `BSCSCAN_API_KEY` — required for automatic verification after deploy.

The deployer must also hold enough BSC Testnet BNB to pay deployment gas.

## NEXT — Steps 24–28

24. Load testnet-only secret/address configuration and run `npm run preflight:testnet`.
25. Deploy ATHToken + MiningAirdrop + TeamTokenLock to BSC Testnet only.
26. Verify contracts on BscScan and run real Web3 test flow: Power → Daily Claim → Booster → Vesting Claim.
27. Freeze verified Testnet contract addresses + ABI and connect them to the Aether Wallet Mining menu.
28. Keep BSC Mainnet fail-closed until external audit, production multisig, exact Team lock period and ATH/USDT liquidity-lock decisions are complete.
