# AETHER TOKEN (ATH) Engine v3.2 — Validation Evidence

Date: 2026-09-28

## Validated commit

`a181c715753ad686839a9aac33e4276e32be1289`

Railway validation deployment:

`2e4ff2ac-c7a6-4c6d-9d1b-7f0c5dbbd87e`

Result: **SUCCESS**

## Build evidence

- Zero-dependency source self-check: **PASSED**
- Solidity compiler: **0.8.20**
- Hardhat compiler mode: optimizer enabled, `viaIR: true`
- Solidity compile result: **18 files compiled successfully**
- EVM target: **paris**
- Automated test result: **13 passing**

## Covered behaviors

1. Fixed total supply: 1,000,000,000 ATH.
2. Power activation requires exactly 0.001 BNB.
3. Missed daily mining rewards do not accumulate.
4. Referral +10% is applied when the referred miner is active.
5. Booster applies x2 reward and adds 100 Hash.
6. First vesting tranche releases 10% after 30 days.
7. New mining rewards stop after the 180-day mining window.
8. Power + Booster BNB revenue is forwarded to the configured Treasury.
9. Self-referral is rejected.
10. Inactive referrer is not credited.
11. Emergency pause blocks mining actions until owner unpauses.
12. Mining reward allocation is blocked when ATH reserve is not funded.
13. Vesting tranches total exactly 100%: 10% + 5% + 5% + 80%.
14. TeamTokenLock holds 50,000,000 ATH before the cliff.
15. TeamTokenLock releases the full team allocation only after the cliff.
16. Display price starts at $3.00 reference value.

## Compiler findings fixed during validation

### Finding 1 — NatSpec parsing
Solidity rejected `@30d`, `@60d`, `@90d`, and `@180d` inside the contract NatSpec comment. The text was changed to ordinary prose.

### Finding 2 — Stack depth
`MiningAirdrop.getUserInfo` exceeded the legacy compiler stack-depth limit. Optimizer + IR compilation was enabled, preserving the contract ABI while allowing the current interface to compile successfully.

## Deployment boundary

This validation did **not** deploy any ATH smart contract to BSC Testnet or Mainnet.

Mainnet release gates remain fail-closed.
