# AETHER ATH Telegram Bot

Production-oriented Telegram service for the ATH community, education, promotion, moderation, join verification and ATH referral routing.

The bot is isolated from ATH deployment credentials. It never needs a blockchain private key.

## Referral architecture

`Telegram invite → Telegram attribution → public wallet link → sponsor Power validation → AETHER Wallet deep link → MiningAirdrop.buyPower(referrer) → on-chain referral`

Two states are intentionally separated:

1. **Telegram attribution** records who referred a user to the bot.
2. **ATH on-chain referral** is official only when the ATH mining contract accepts the sponsor during `buyPower(referrer)`.

Telegram clicks alone never create ATH mining referral credit.

## Community features

- English-only user interface.
- Join-request verification with crypto-interest scoring.
- Country-aware scoring.
- Automatic approve/decline flow.
- Welcome onboarding.
- Anti-scam filters.
- Anti-flood protection.
- Warn, mute, unmute, kick, ban and unban.
- Persistent warning counts and moderation logs when PostgreSQL is configured.
- `/modlog` for recent moderation activity.
- Crypto and ATH education menus.
- Rotating daily education articles.
- Soft promotion with a long cooldown.
- Optional AI replies, disabled unless explicitly configured.
- Safe bot command registration and Telegram profile description.
- Target-group permission readiness checks at startup.

## ATH referral bridge

Before the bot presents a sponsor as ready for referral routing, it checks the configured ATH mining contract in read-only mode.

The ATH contract remains authoritative for:

- sponsor Power eligibility,
- self-referral protection,
- official referral assignment,
- active referral count,
- referral mining bonus.

When `AETHER_APP_URL` is configured, the bot can generate an AETHER Wallet handoff with:

- `source=telegram`
- `campaign=ath-airdrop`
- `ath_referrer=0x...`
- `ath_wallet=0x...`

AETHER Wallet must show the sponsor for review and pass it to `buyPower(referrer)`. The user signs locally.

## Member commands

- `/start`
- `/airdrop`
- `/invite`
- `/referral`
- `/wallet 0x...`
- `/stats`
- `/education`
- `/aether`
- `/article`
- `/myid`
- `/chatid`
- `/help`
- `/stop`

## Admin commands

Admin access is controlled by `ADMIN_TELEGRAM_IDS`.

- `/adminstats`
- `/promo`
- `/warn`
- `/warnings`
- `/mute`
- `/unmute`
- `/kick`
- `/ban`
- `/unban`
- `/modlog`
- `/broadcast <message>`

## Durable storage

When `DATABASE_URL` is configured, the bot automatically creates and maintains PostgreSQL tables for:

- users,
- groups,
- memberships,
- join verification,
- warning counters,
- moderation history.

Without `DATABASE_URL`, the bot intentionally falls back to in-memory storage for development. Referral and moderation state can then be lost on restart.

## Optional AI replies

AI replies are disabled by default.

Configuration:

```env
AI_REPLY_ENABLED=false
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
AI_RANDOM_REPLY_RATE=0.08
```

The AI safety prompt requires English replies, prohibits requesting seed phrases/private keys and prohibits guaranteed financial outcomes.

## Core environment

```env
BOT_ENABLED=false
TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_USERNAME=

ADMIN_TELEGRAM_IDS=
TARGET_CHAT_IDS=
COMMUNITY_FEATURES_ENABLED=true
JOIN_VERIFICATION_ENABLED=true
MIN_CRYPTO_SCORE=60

FLOOD_LIMIT=5
FLOOD_WINDOW_SECONDS=10
SOFT_PROMO_HOURS=8
ARTICLE_HOUR_UTC=2

DATABASE_URL=

ATH_RPC_URL=https://bsc-testnet-rpc.publicnode.com
ATH_CHAIN_ID=97
ATH_MINING_ADDRESS=
AETHER_APP_URL=
AETHER_COMMUNITY_URL=
AETHER_WEBSITE_URL=
```

## Security boundaries

- Never commit `.env`.
- Keep BotFather tokens in Railway secrets only.
- Never copy ATH deployment private keys into this service.
- Never request a seed phrase or private key.
- Keep bot permissions limited to the permissions required for moderation and join approval.
- No aggressive mass invite behavior.
- Broadcasts target only users who started the bot and have not opted out.
- Telegram attribution does not manufacture an ATH reward.
- Mainnet deployment controls remain separate from this bot.

## Railway

Recommended root directory:

`/telegram-bot`

Build command:

`npm install --no-audit --no-fund && npm test`

Start command:

`npm start`

Healthcheck:

`/health`

The health response reports community readiness, persistent-storage readiness, optional AI readiness, and ATH referral readiness.
