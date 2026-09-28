# AETHER ATH Telegram Promotion Bot

A separate Telegram-facing service for ATH campaign promotion. It is intentionally isolated from the ATH smart-contract deployer.

## Goals

- Opt-in ATH campaign onboarding.
- Referral deep links.
- Public wallet-address linking.
- Per-user referral/campaign stats.
- Admin aggregate stats.
- Admin broadcast only to users who started the bot and did not opt out.
- A direct button to AETHER Wallet / official community / website when configured.

## Safety boundaries

- The bot never asks for a private key or seed phrase.
- The bot does not custody funds.
- Campaign referrals are not automatically on-chain mining referrals.
- The bot does not mint, transfer, promise, or claim ATH.
- On-chain eligibility/claim actions must use the separately verified AETHER/ATH Web3 flow.
- Self-referral and repeat referral attribution are blocked.
- Users may opt out with `/stop`.

## Commands

- `/start`
- `/airdrop`
- `/invite`
- `/wallet 0x...`
- `/stats`
- `/stop`
- `/help`

Admin IDs configured in `ADMIN_TELEGRAM_IDS` additionally receive:

- `/adminstats`
- `/broadcast <message>`

## Referral format

When `TELEGRAM_BOT_USERNAME` is configured, each user receives:

`https://t.me/<bot_username>?start=ref_<telegram_user_id>`

A referral is attributed only once.

## Storage

If `DATABASE_URL` is provided, the bot creates and uses the `ath_bot_users` PostgreSQL table.

If no database is configured, it runs with memory storage for development only. Memory data is lost on restart.

## Railway

Recommended deployment is a separate Railway service rooted at:

`/telegram-bot`

Start with `BOT_ENABLED=false`. After the BotFather token, username and durable storage are ready, set `BOT_ENABLED=true`.

Do not copy `PRIVATE_KEY` from the ATH smart-contract deployment service into this Telegram service.
