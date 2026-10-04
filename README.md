# AETHER TOKEN (ATH) — Mining v3.3 + Staking v1

Development package for the AETHER TOKEN (ATH) ecosystem on BNB Smart Chain.

## Fixed supply and ecosystem split

- Token: **Aether (ATH)**.
- Fixed supply: **1,000,000,000 ATH**.
- No post-deployment mint function.
- **Mining: 700,000,000 ATH**.
- **Staking ecosystem: 300,000,000 ATH**.
- Before official listing, the unified ATH reference price follows **ATH Presale**: opens at **$0.070**, rises **$0.001 after every complete 100,000 ATH sold**, and reaches the **$0.370 sold-out reference**. Mining and Staking read the same Presale-linked registry price.

### Staking 300M breakdown

- Reward Pool: **160,000,000 ATH**.
- Presale: **30,000,000 ATH** via `ATHPresale`: opens at **$0.070**, rises **$0.001 after each complete 100,000 ATH sold**, reaches **$0.370 at sold out**, and deploys **PAUSED/fail-closed** until the owner explicitly opens sales. The public Presale storefront quotes and settles purchases directly on-chain: holder approves the configured stablecoin, `buyATH()` sends payment directly to treasury, and ATH is delivered directly to the buyer wallet.
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
- Keeper/miner registry and Mining security gates remain intact. Production holder transactions are not gas-sponsored by AETHER; holders pay network gas from their own BNB.

See `docs/BLUEPRINT_DECISIONS.md`.

## Staking v1

Staking is a separate smart-contract module that uses the same ATH token.

- ATH price source: **ATHPresale → ATHPriceRegistry → Mining/Staking**, with a **15,000-holder target** and a one-way switch to live market pricing only after official listing activation.
- Minimum stake: **$10 USDT-equivalent**.
- Six packages: Starter, Basic, Silver, Gold, Platinum, Diamond.
- Daily rates: **0.35%–0.85%**.
- Locks: **180 / 365 / 730 days**.
- Direct referral: **10%**.
- Network reward: **10 levels**.
- Network Rank salary: **8 ranks**, requires at least **5 direct sponsors**; small-leg turnover is total direct-leg turnover minus the single largest dynamic leg.
- Rank thresholds / weekly salary: **$1k/$25, $5k/$75, $15k/$200, $50k/$500, $100k/$1k, $250k/$2k, $500k/$5k, $1M/$10k**.
- First salary slot: **00:30 UTC after at least 7 full days of qualification**, then weekly. USD salary converts to ATH at the current Presale-linked price.
- Principal liability is separated from the reward reserve; Rank salary also uses reward reserve and cannot consume principal.
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
- ATHPresale
- ATHPriceRegistry
- MiningAirdrop v3.3
- ATHStakingPriceOracle v1
- ATHStaking v1
- ATHDevelopmentVesting v1

## Mainnet

Mainnet remains fail-closed. Deployment requires all release gates to be explicitly opened only after Testnet validation, independent audit, multisig confirmation and liquidity-lock decisions.

Never copy the ATH deployer private key into public web, Telegram bot, or client applications.
