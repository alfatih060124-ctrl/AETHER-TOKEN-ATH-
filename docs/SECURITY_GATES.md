# ATH Engine Security / Release Gates

## Gate A — Source / Logic

- [x] Fixed supply token: 1,000,000,000 ATH.
- [x] Mining allocation constant: 700,000,000 ATH.
- [x] Power: 0.001 BNB.
- [x] Base daily reward: 1 ATH.
- [x] Missed claim is not accumulated.
- [x] Referral multiplier: +10% to +50% by supplied tiers.
- [x] Booster: 0.001 BNB, +100 Hash, reward x2.
- [x] Vesting: 10% @30d, 5% @60d, 5% @90d, 80% @180d.
- [x] Display price formula: $3.00 + $0.001 / 10,000 ATH mined.
- [x] Treasury is owner-updatable.
- [x] Mining reserve protection prevents allocating rewards beyond funded reserve.

## Gate B — Automated tests

- [ ] `npm install` in a network-enabled development runner.
- [ ] `npm test` passes.
- [ ] Solidity compile passes with the pinned dependency range.
- [ ] Gas report reviewed for `claimAllVested()` worst-case positions.

## Gate C — BSC Testnet

- [ ] Deploy ATHToken + MiningAirdrop + TeamTokenLock.
- [ ] Confirm 70/20/5/5 allocation on-chain.
- [ ] Verify contracts on BscScan.
- [ ] Test real wallet flow: buy Power → daily claim → Booster → vesting claim.
- [ ] Test treasury update using intended owner / multisig.
- [ ] Test pause / unpause.

## Gate D — Mainnet prerequisites

- [x] Team & Dev lock fixed at exactly 12 months / 365 days.
- [ ] Choose liquidity lock provider and lock duration for ATH/USDT.
- [ ] External smart-contract audit completed and issues resolved.
- [ ] Owner changed to production multisig.
- [ ] Treasury/revenue wallet confirmed.
- [ ] BSC mainnet RPC provider and monitoring configured.
- [ ] Final contract addresses frozen in Aether Wallet configuration.

**Mainnet deployment remains blocked until Gate D is complete.**

## Technical fail-closed gate

- [x] No fallback/default deployment private key.
- [x] BSC mainnet deployment script requires four explicit `true` environment gates.
- [x] Default `.env.example` keeps every mainnet gate `false`.
