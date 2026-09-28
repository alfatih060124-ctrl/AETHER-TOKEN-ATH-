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

- Base validated commit: `a181c715753ad686839a9aac33e4276e32be1289`
- Base Railway deployment: `2e4ff2ac-c7a6-4c6d-9d1b-7f0c5dbbd87e`
- Expanded Testnet-readiness deployment: `df8d0e22-4406-4eef-bc60-0d9587acfde2`
- Expanded deployment result: `SUCCESS`
- BSC Testnet RPC check: `PASSED`
- BSC chain ID observed: `97`
- Safe Testnet config: `READY`
- Mainnet gates: all `CLOSED`
- Solidity files compiled: `18`
- Automated tests: `13 passing`
- Railway healthcheck: `SUCCESS`
- No BSC contract deployment was performed during validation.

## CURRENT STEP — 24: BSC TESTNET PREFLIGHT

### Step 24A — DONE

- Railway can reach BSC Testnet successfully.
- RPC returned chain ID 97.
- Safe Testnet configuration is loaded.
- Mainnet release gates are confirmed CLOSED.
- Deployment scripts now validate the target chain, operator addresses, private-key format, deployer BNB balance, exact tokenomics destinations and Team-lock range.
- Post-deployment invariant checker is prepared for 70/20/5/5 distribution, owner, treasury, Team lock and initial ATH reference price.
- A syntax-validation stage was added for all deployment scripts; its latest Railway rollout is queued and does not authorize any blockchain transaction.

### Step 24B — BLOCKED ON OPERATOR-CONTROLLED TESTNET CONFIG

The readiness runner reports these values are still absent:

- `PRIVATE_KEY` — dedicated funded BSC Testnet deployer secret. Never commit or paste it into project files.
- `OWNER_ADDRESS`
- `TREASURY_ADDRESS`
- `TEAM_BENEFICIARY`
- `LIQUIDITY_WALLET`
- `MARKETING_WALLET`
- `BSCSCAN_API_KEY`

Safe defaults already loaded:

- `BSC_TESTNET_RPC`
- `ATH_CHAIN_ID=97`
- `TEAM_LOCK_DAYS=365` for Testnet validation only
- all Mainnet release gates = `false`

The deployer must hold Testnet BNB before `npm run preflight:testnet` can pass.

## NEXT — Steps 24–28

24. Load the operator-controlled Testnet secret/address configuration and run `npm run preflight:testnet`.
25. Deploy ATHToken + MiningAirdrop + TeamTokenLock to BSC Testnet only.
26. Verify contracts on BscScan and run real Web3 test flow: Power → Daily Claim → Booster → Vesting Claim.
27. Freeze verified Testnet contract addresses + ABI and connect them to the Aether Wallet Mining menu.
28. Keep BSC Mainnet fail-closed until external audit, production multisig, exact Team lock period and ATH/USDT liquidity-lock decisions are complete.
