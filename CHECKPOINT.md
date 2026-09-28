# AETHER TOKEN (ATH) Engine — Checkpoint

## DONE

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
16. Zero-dependency source self-check added for token supply, mining constants, referral tiers, vesting, treasury permissions and mainnet gates.
17. Testnet/mainnet environment preflight script added; it validates required addresses, RPC selection and Team lock range without printing the deployer private key.
18. Blueprint ambiguity/decision register added so implementation assumptions are not silently treated as source requirements.
19. CI workflow hardened with manual dispatch, concurrency cancellation and the source self-check before dependency install.
20. Failed GitHub Actions run was explicitly retried; a fresh workflow was also triggered after CI hardening.

## CURRENT BLOCKER

- Latest GitHub Actions jobs terminate before any workflow step starts.
- Observed state: `runner_id = 0`, empty runner name, and zero executed steps.
- This means there is still no Solidity compile/test result to accept or reject; the job is failing before runner assignment.
- Do not deploy ATH to BSC Testnet until the compile/test gate is green.

## EXTERNAL FALLBACK STATUS

- The authorized Remote Desktop device `aether-v3-engine` is currently offline, so it cannot yet be used as a fallback build runner.
- Mainnet remains blocked regardless of runner availability.

## NEXT

21. Restore a working build runner (GitHub-hosted Actions or the authorized AETHER VM).
22. Run source self-check + `npm install` + Solidity compile + automated tests.
23. Fix any compiler/test findings and repeat until green.
24. Run `preflight:testnet`, then deploy ATHToken + MiningAirdrop + TeamTokenLock to BSC Testnet only.
25. Verify contracts on BscScan and test real Web3 flow: Power → Daily Claim → Booster → Vesting Claim.
26. Freeze verified testnet contract addresses/ABI for Aether Wallet.
27. Connect the Aether Wallet Mining menu to ATH Engine through Web3.
28. Keep BSC mainnet deployment fail-closed until external audit, multisig and ATH/USDT liquidity-lock decisions are complete.
