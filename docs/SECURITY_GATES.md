# ATH Engine Security / Release Gates

## Gate A — Current protocol security
- [x] Fixed supply 1,000,000,000 ATH; no post-deployment mint.
- [x] 700M Mining + 300M Staking ecosystem allocation.
- [x] Staking: 160M Reward / 30M Presale / 50M Marketing-Network / 30M Development / 20M Liquidity / 10M Reserve.
- [x] Presale-linked price: $0.070 opening, +$0.001 per complete 100,000 ATH sold, $0.370 sold-out reference.
- [x] Official market-price activation requires 15,000 holders plus explicit owner activation.
- [x] ATH Presale deploys PAUSED/fail-closed.
- [x] ATH Staking deploys PAUSED/fail-closed.
- [x] ATH Staking cannot open until full 160M Reward + 50M Marketing/Network funding ledgers are complete.
- [x] Staking principal liability is isolated from reward/network reserves.
- [x] Mainnet gates default CLOSED.

## Gate B — Zero-cost validation
- [x] Dependency install validated on authorized VM.
- [x] Source self-check and JavaScript syntax gate PASS.
- [x] Solidity compile PASS.
- [x] Full automated contract test suite PASS.
- [x] Deterministic ABI/release export PASS.
- [x] Local full release rehearsal PASS.
- [x] Runtime production dependency audit: 0 high/critical.
- [x] Non-BNB readiness PASS with separate role wallets.
- [x] EIP-170 bytecode checks included in release export.
- [x] Admin and holder UI enforce Staking pause/opening boundary.
- [x] Incident runbook, multisig migration procedure and pre-audit scope prepared.

## Gate C — External inputs before BSC Testnet
- [ ] PRESALE_PAYMENT_TOKEN
- [ ] LIQUIDITY_WALLET
- [ ] STAKING_RESERVE_WALLET
- [ ] DEVELOPMENT_BENEFICIARY
- [ ] Dedicated Testnet key stored outside GitHub/chat.
- [ ] Testnet deployer funded with sufficient tBNB.

## Gate D — Testnet evidence requiring transactions
- [ ] One-shot deployment on chain ID 97.
- [ ] Post-deploy invariant checker PASS.
- [ ] BscScan verification.
- [ ] Real Presale/Staking wallet flows PASS.
- [ ] Explicit owner Staking opening after reserve verification.
- [ ] Keeper dry-run + transaction evidence.
- [ ] Verified addresses/ABI frozen into AETHER Wallet.

## Gate E — Mainnet prerequisites
- [ ] Independent smart-contract audit completed and accepted findings resolved.
- [ ] Production multisig signer set, threshold and addresses approved.
- [x] Multisig migration procedure documented.
- [x] Operational incident runbook documented.
- [ ] Liquidity provider/lock decision approved.
- [ ] ATH/USDT launch parameters approved.
- [ ] Production RPC/monitoring tested.
- [ ] Final operator approval.

Mainnet remains blocked until every required Gate E item is complete.

GitHub-hosted Actions are currently blocked before job start by a GitHub account billing lock. The same source is validated on the authorized AETHER VM; the billing lock is an external account blocker, not a code PASS.
