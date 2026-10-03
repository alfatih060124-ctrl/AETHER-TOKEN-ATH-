# AETHER TOKEN (ATH) — Mining v3.3 + Staking v1

Development package for the AETHER TOKEN (ATH) ecosystem on BNB Smart Chain.

## Fixed supply and ecosystem split

- Token: **Aether (ATH)**.
- Fixed supply: **1,000,000,000 ATH**.
- No post-deployment mint function.
- **Mining: 700,000,000 ATH**.
- **Staking ecosystem: 300,000,000 ATH**.
- Unified ATH official pre-listing reference price is **1 ATH = $0.37** across Mining, Staking, P2P and AETHER Wallet. A live DEX price may be visible separately, but the official price remains fixed until the **15,000-holder listing gate** and explicit listing activation.

### Staking 300M breakdown

- Reward Pool: **160,000,000 ATH**.
- Presale: **30,000,000 ATH** via `ATHPresale`: opens at **$0.070**, rises **$0.001 after each complete 100,000 ATH sold**, and reaches **$0.370 at sold out**.
- Marketing: **50,000,000 ATH**.
- Development Vesting: **30,000,000 ATH**.
- Liquidity: **20,000,000 ATH**.
- Ecosystem Reserve: **10,000,000 ATH**.

## Mining — current protocol rules

Mining keeps the existing Power, Booster, referral, vesting, keeper, and reserve mechanics. The current base reward and unified ATH protocol-price schedule are defined below.

- Mining allocation: **700,000,000 ATH**.
- Base reward: **10 ATH/day**.
- Reward claim window opens at **00:05 UTC**.
- Referral tiers: **+10% to +50%**.
- Power Booster: **2x / 30 days**.
- Double Power: **3x on top of Power**, requires at least 5 referrals.
- Recurring vesting: **12 cycles** with cycle burn and final 60/40 settlement.
- Keeper/miner registry and Mining security gates remain intact.

See `docs/BLUEPRINT_DECISIONS.md`.

## Staking v1

Staking is a separate smart-contract module that uses the same ATH token.

- ATH price source: **ATHPriceRegistry** with a fixed **$0.37 pre-listing reference**, a **15,000-holder target**, and a one-way switch to live market pricing only after official listing activation.
- Minimum stake: **$10 USDT-equivalent**.
- Six packages: Starter, Basic, Silver, Gold, Platinum, Diamond.
- Daily rates: **0.35%–0.85%**.
- Locks: **180 / 365 / 730 days**.
- Direct referral: **10%**.
- Network reward: **10 levels**.
- Principal liability is separated from the reward reserve.
- Existing stake terms are snapshotted and cannot be rewritten by later package changes.
- Reward Pool hard cap: **160M ATH**.
- Development Vesting: **30M ATH**, 2-month cliff, 33 active months, exact 100% final settlement.

See `docs/STAKING_V1_DECISIONS.md`.

## Install and validate

```bash
npm ci
npm run source:selfcheck
npm run syntax:check
npm run compile
npm test
npm run abi:export
npm run release:smoke:local
```

## Testnet deploy

Deployment is fail-closed and requires explicit Testnet approval plus sufficient tBNB gas.

```bash
npm run preflight:testnet
npm run deploy:once:testnet
```

The one-shot deployment deploys and validates:

- ATHToken
- MiningAirdrop v3.3
- ATHStakingPriceOracle v1
- ATHStaking v1
- ATHDevelopmentVesting v1

## Mainnet

Mainnet remains fail-closed. Deployment requires all release gates to be explicitly opened only after Testnet validation, independent audit, multisig confirmation and liquidity-lock decisions.

Never copy the ATH deployer private key into public web, Telegram bot, or client applications.
