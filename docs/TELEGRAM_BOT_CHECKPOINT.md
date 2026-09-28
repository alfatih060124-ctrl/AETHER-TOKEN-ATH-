# AETHER ATH Telegram Promotion Bot — Checkpoint

Date: 2026-09-29

## DONE

1. Added isolated `telegram-bot/` module to the ATH repository.
2. Added Telegram Bot API long-polling runtime with Railway health endpoint.
3. Added opt-in campaign onboarding.
4. Added referral deep links using `?start=ref_<telegram_user_id>`.
5. Added one-time referral attribution, duplicate prevention and self-referral blocking.
6. Added public EVM/BSC wallet linking. The bot never requests private keys or seed phrases.
7. Added user commands:
   - `/start`
   - `/airdrop`
   - `/invite`
   - `/wallet`
   - `/stats`
   - `/stop`
   - `/help`
8. Added restricted admin commands:
   - `/adminstats`
   - `/broadcast`
9. Broadcast is limited to users who opted in by starting the bot and have not used `/stop`.
10. Added PostgreSQL-compatible durable storage with memory fallback for development.
11. Added self-check tests for referral attribution, wallet linking, opt-out and stats.
12. Added Railway service `ath-telegram-bot`.
13. Bot service is intentionally disabled until Telegram credentials are supplied.
14. Smart-contract deployer credentials are not copied to the Telegram service.

## IMPORTANT PRODUCT BOUNDARY

Telegram campaign referrals are promotional acquisition tracking only.

They do not automatically:
- grant ATH,
- mint ATH,
- transfer ATH,
- become MiningAirdrop contract referrals,
- satisfy future airdrop eligibility.

Any on-chain qualification must be connected later to the verified ATH Web3 flow.

## CURRENT RAILWAY STATE

Service: `ath-telegram-bot`

- Source: `alfatih060124-ctrl/AETHER-TOKEN-ATH-` / `main`
- Root directory configured: `/telegram-bot`
- `BOT_ENABLED=false`
- Build command: `npm install --no-audit --no-fund && npm test`
- Start command: `npm start`
- Healthcheck: `/health`
- Sleep: disabled, ready for long polling when enabled
- Current first deployment: queued on Railway

## REQUIRED BEFORE ACTIVATION

Operator creates a Telegram bot through official `@BotFather` and supplies to Railway only:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_BOT_USERNAME`

Recommended before public campaign launch:

- `DATABASE_URL` for durable referral records
- `ADMIN_TELEGRAM_IDS`
- `AETHER_APP_URL`
- `AETHER_COMMUNITY_URL`
- `AETHER_WEBSITE_URL`

Then set:

`BOT_ENABLED=true`

## NEXT

1. Wait for Railway bot validation deployment to complete.
2. Add BotFather token + username.
3. Attach durable PostgreSQL storage.
4. Set official AETHER Wallet/community/website links.
5. Enable bot and perform live Telegram QC.
6. After ATH Testnet contracts are deployed, add read-only Web3 campaign/eligibility status.
