# AETHER TOKEN (ATH) Engine v3.2

Development package for the AETHER TOKEN (ATH) Mining System, rebuilt from the supplied v3.1 blueprint and source package.

## Source-of-truth rules implemented

- BEP-20 token: **Aether (ATH)**.
- Fixed supply: **1,000,000,000 ATH**.
- Mining Pool: **700,000,000 ATH (70%)**.
- Liquidity: **200,000,000 ATH (20%)** for ATH/USDT.
- Team & Dev: **50,000,000 ATH (5%)**, locked for exactly **12 months / 365 days**.
- Marketing: **50,000,000 ATH (5%)**.
- Start Mining Power: **0.001 BNB**.
- Base reward: **1 ATH/day**, must be claimed each day; missed days are lost.
- Mining window: **180 days**.
- Referral bonus: **+10% to +50%** according to the supplied active-friend tiers.
- Booster: **0.001 BNB = +100 Hash = reward x2**.
- Vesting: **10% @30d, 5% @60d, 5% @90d, 80% @180d**.
- Display price: **$3.00 + $0.001 for each 10,000 ATH mined**.

## Install

```bash
npm install
cp .env.example .env
npm run compile
npm test
```

## Testnet deploy

Fill `.env`, then:

```bash
npm run deploy:testnet
```

## Aether Wallet integration

Use `engine/athEngine.js` to read dashboard state and build unsigned transactions for Power, Booster, daily claim and vesting claims. See `docs/APK_INTEGRATION.md`.

## ATH Telegram promotion bot

A separate service lives in `telegram-bot/`.

It provides:
- opt-in ATH campaign onboarding,
- Telegram referral deep links,
- campaign referral counts,
- public wallet-address linking,
- user campaign stats,
- admin aggregate stats,
- opt-in-only promotional broadcast,
- buttons to AETHER Wallet, community and website.

The Telegram bot is deliberately isolated from smart-contract deployment credentials. Never copy the ATH deployer `PRIVATE_KEY` into the bot service.

Campaign referrals inside Telegram are promotional tracking only. They do not automatically mint, transfer or grant ATH, and they are not silently treated as on-chain mining referrals.

See `telegram-bot/README.md`.

## Mainnet

Mainnet is **fail-closed**. `scripts/deploy.js` refuses BSC mainnet deployment unless all four explicit release gates are `true`: `ALLOW_MAINNET_DEPLOY`, `MAINNET_AUDIT_PASSED`, `MAINNET_MULTISIG_CONFIRMED`, and `LIQUIDITY_LOCK_CONFIRMED`. Keep them false until the items in `docs/SECURITY_GATES.md` are independently complete.
