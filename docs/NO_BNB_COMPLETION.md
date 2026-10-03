# ATH v3.3 No-BNB Completion Gate

This document defines what can be completed before any BSC Testnet gas is funded.

## Completed without BNB/tBNB

- Protocol source lock for reward, referral, Booster, vesting and burn rules.
- 10 ATH/day UTC reward engine.
- Daily expiry semantics.
- 12-cycle vesting and final settlement.
- Fixed-supply reserve accounting.
- Owner/admin authorization tests.
- Public holder read functions.
- Explorer-friendly vesting views.
- Daily transparency events.
- Permissionless batch reward snapshot and expiry.
- On-chain paginated miner registry for keeper discovery without historical log scans.
- Fail-closed Testnet reward keeper runtime.
- Local full deployment rehearsal.
- Local holder-flow rehearsal.
- Automated smart-contract test suite.
- Source self-check.
- Script syntax gate.
- EIP-170 bytecode size gate.
- Deterministic ABI/release export.
- One-shot Testnet deployment gate.
- Post-deploy invariant checker.
- BscScan verification script.
- Public landing page.
- Control Panel.
- Whitepaper v1.1.
- Roadmap.
- AETHER AI knowledge sync.
- Desktop/mobile web QC.
- Testnet acceptance checklist.
- Reward keeper runbook.

## Intentionally not completed before tBNB

The following require a real public-chain transaction or a real deployed address:

1. BSC Testnet contract deployment.
2. Public Testnet contract addresses.
3. BscScan source verification.
4. Real Testnet Power/claim/Booster transactions.
5. Live keeper transactions.
6. AETHER Wallet binding to verified Testnet contracts.

## External inputs still required

- >= 0.02 tBNB for the Testnet deployer.
- BscScan API key for explorer verification after deployment.
- A separate small Testnet gas balance for the dedicated keeper wallet before live keeper transactions.

No real BNB is needed for the Testnet phase.