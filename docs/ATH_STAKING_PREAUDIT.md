# ATH Staking Independent Audit Preparation

## Primary scope
ATHStaking.sol, ATHStakingPriceOracle.sol, ATHPriceRegistry.sol, ATHPresale.sol and ATHToken.sol, plus deployment/post-deploy tooling, Staking Reward Keeper, Rank Salary Keeper and release artifacts.

## Critical invariants
1. Principal liability is never spent as rewards or network compensation.
2. Reward funding cannot exceed 160M ATH.
3. Marketing/Network funding cannot exceed 50M ATH.
4. Staking deploys PAUSED.
5. Opening is impossible before both funding ledgers are complete.
6. Only owner can pause/unpause or modify packages.
7. Existing stakes snapshot rate and lock terms.
8. Self-referral and referral cycles are rejected.
9. Ranked Direct Referral path cannot exceed 35%.
10. Same Rank skips uplift but traversal continues to a higher Rank.
11. Rank uses small-leg turnover plus direct-sponsor minimum.
12. Keepers cannot acquire owner authority.
13. Excess recovery cannot invade protected balances.
14. Zero/invalid price cannot be used for conversion.
15. Batch/page limits bound operational loops.

## Independent review focus
Reentrancy; token-call ordering; reserve conservation; referral depth/cycles; Rank pass-up; 00:30/00:50 boundaries; package snapshotting; pause/recovery; oracle trust; denial of service; gas bounds; owner-compromise blast radius.

## Evidence package
Provide exact release commit, compiler version, package lock, current test output, ABI SHA-256, deployed-bytecode SHA-256, local rehearsal evidence and later Testnet evidence.

Internal review is not a substitute for the required independent audit before Mainnet.
