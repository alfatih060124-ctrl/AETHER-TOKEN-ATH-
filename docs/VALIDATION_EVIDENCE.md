# AETHER TOKEN (ATH) Engine v3.2 — Validation Evidence

Date: 2026-09-28

## Latest validated code commit

`86b30e4611b0829398210f1e4f2c507b9a73010a`

Railway validation deployment:

`c5e1a309-fa60-4070-acc5-aabaea956786`

Result: **SUCCESS**

## Build / readiness evidence

- Zero-dependency source self-check: **PASSED**
- Deployment-script syntax check: **PASSED**
- BSC Testnet RPC check: **PASSED**
- Observed BSC chain ID: **97**
- Testnet single-wallet mode: **ENABLED**
- Safe Testnet configuration: **READY**
- Mainnet gates: **all CLOSED**
- Solidity compiler: **0.8.20**
- Hardhat compiler mode: optimizer enabled, `viaIR: true`
- Solidity compile result: **18 files compiled successfully**
- EVM target: **paris**
- Automated test result: **13 passing**
- Railway validation service: **SUCCESS**

## Operator gates

The new Testnet-only single-wallet mode derives Owner, Treasury, Team Beneficiary, Liquidity Wallet and Marketing Wallet from the dedicated Testnet deployer address. It is ignored on Mainnet.

Current readiness now reports only:

- Deployment configuration missing: `PRIVATE_KEY`
- Verification configuration missing: `BSCSCAN_API_KEY`

The deployer private key remains operator-controlled and must be stored only as a Railway secret. It is not committed to GitHub and must not be pasted into chat.

## Covered behaviors

1. Fixed total supply: 1,000,000,000 ATH.
2. Power activation requires exactly 0.001 BNB.
3. Missed daily mining rewards do not accumulate.
4. Referral +10% is applied when the referred miner is active.
5. Booster applies x2 reward and adds 100 Hash.
6. First vesting tranche releases 10% after 30 days.
7. New mining rewards stop after the 180-day mining window.
8. Power + Booster BNB revenue is forwarded to Treasury.
9. Self-referral is rejected.
10. Inactive referrer is not credited.
11. Emergency pause blocks mining actions until owner unpauses.
12. Mining reward allocation is blocked when ATH reserve is not funded.
13. Vesting tranches total exactly 100%: 10% + 5% + 5% + 80%.
14. TeamTokenLock holds 50,000,000 ATH before the cliff.
15. TeamTokenLock releases the full team allocation only after the cliff.
16. ATHPriceRegistry fixes the official pre-listing price at $0.37; Mining and Staking read the same registry, with a 15,000-holder gate before official market-price activation.

## Deployment boundary

This validation did **not** deploy any ATH smart contract to BSC Testnet or Mainnet.

Mainnet release gates remain fail-closed.
