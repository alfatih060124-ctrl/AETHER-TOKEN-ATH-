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
13. Automated test suite added.
14. Security/release gates documented.
15. Deployment config hardened: no fallback private key and mainnet is fail-closed behind explicit audit/multisig/liquidity gates.

## IN PROGRESS / BLOCKED BY ENVIRONMENT

- GitHub Actions is the compile/test runner for repository validation.
- BSC Testnet deployment requires a funded testnet deployer, owner/multisig address, treasury address and the selected Team lock duration.

## NEXT

1. Confirm GitHub Actions compile/test is green.
2. Deploy to BSC Testnet only.
3. Verify on BscScan and perform end-to-end wallet transactions.
4. Integrate deployed testnet addresses into the Aether Wallet Mining menu.
5. Keep mainnet blocked until audit + multisig + liquidity lock decisions are complete.
