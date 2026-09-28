# AETHER ATH Telegram Promotion Bot

A separate Telegram-facing service for ATH community growth, education, promotion and referral routing. It is intentionally isolated from ATH smart-contract deployment credentials.

## Referral integration architecture

The referral path is:

`Telegram invite → Telegram attribution → public wallet link → sponsor Power validation → AETHER Wallet deep link → MiningAirdrop.buyPower(referrer) → on-chain referral`

This deliberately separates two states:

1. **Telegram referral** — acquisition attribution after a user opens the bot through `?start=ref_<telegram_user_id>`.
2. **ATH on-chain referral** — official mining referral recorded only by `MiningAirdrop.buyPower(referrer)`.

The Telegram bot does not manufacture an ATH referral count. The smart contract remains the source of truth.

## ATH qualification rule

Before the bot presents a sponsor wallet as ready for ATH referral routing, it reads the configured MiningAirdrop contract and checks the sponsor's `hasPower` status.

The existing ATH contract itself performs the final checks:
- the new miner cannot refer themselves,
- the sponsor must already have Power to be counted,
- the referral is recorded when the invited user buys Power,
- the sponsor's mining multiplier rises according to the on-chain referral count.

## AETHER Wallet bridge

When `AETHER_APP_URL` is configured and the sponsor is eligible, the bot builds a link using:

- `source=telegram`
- `campaign=ath-airdrop`
- `ath_referrer=0x...`
- `ath_wallet=0x...` when the member wallet is known

AETHER Wallet must read `ath_referrer`, display it to the user for review, and pass it to:

`buyPower(referrer)`

The transaction is still signed locally by the user's wallet.

## Goals

- Opt-in ATH campaign onboarding.
- Referral deep links.
- Public wallet-address linking.
- Telegram and on-chain referral status.
- Per-user referral/campaign stats.
- Admin aggregate stats.
- Admin broadcast only to users who started the bot and did not opt out.
- Direct buttons to AETHER Wallet / official community / website.

## Safety boundaries

- The bot never asks for a private key or seed phrase.
- The bot does not custody funds.
- The bot has read-only ATH RPC access.
- Telegram referral attribution alone does not grant ATH.
- The bot does not mint, transfer, promise, or claim ATH.
- Self-referral and repeat Telegram attribution are blocked.
- A linked wallet is not silently replaced, protecting referral identity.
- Users may opt out with `/stop`.

## Commands

- `/start`
- `/airdrop`
- `/invite`
- `/referral`
- `/wallet 0x...`
- `/stats`
- `/stop`
- `/help`

Admin IDs configured in `ADMIN_TELEGRAM_IDS` additionally receive:

- `/adminstats`
- `/broadcast <message>`

## Storage

If `DATABASE_URL` is provided, the bot creates and uses the `ath_bot_users` PostgreSQL table.

If no database is configured, it runs with memory storage for development only. Memory data is lost on restart.

## Railway

Recommended deployment is a separate Railway service rooted at:

`/telegram-bot`

Keep `BOT_ENABLED=false` until the BotFather token, username, durable storage, official links and ATH contract address are ready.

Do not copy `PRIVATE_KEY` from the ATH smart-contract deployment service into this Telegram service.
