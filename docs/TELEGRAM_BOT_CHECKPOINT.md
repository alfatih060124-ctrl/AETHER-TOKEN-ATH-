# AETHER ATH Telegram Promotion Bot — Checkpoint

Date: 2026-09-29

## DONE — COMMUNITY + ATH REFERRAL FOUNDATION

1. Added isolated `telegram-bot/` module to the ATH repository.
2. Added Telegram Bot API long-polling runtime with Railway health endpoint.
3. Added opt-in campaign onboarding.
4. Added referral deep links using `?start=ref_<telegram_user_id>`.
5. Added first-attribution referral tracking, duplicate prevention and self-referral blocking.
6. Added public EVM/BSC wallet linking; linked wallet identity cannot be silently replaced.
7. Added ATH read-only referral bridge:
   - reads sponsor `getUserInfo`,
   - requires sponsor `hasPower=true`,
   - reads on-chain referral count and multiplier,
   - builds AETHER Wallet handoff with `ath_referrer`,
   - never uses a blockchain private key.
8. Added user commands:
   - `/start`
   - `/airdrop`
   - `/invite`
   - `/referral`
   - `/wallet`
   - `/stats`
   - `/edukasi`
   - `/stop`
   - `/help`
9. Added restricted admin commands:
   - `/adminstats`
   - `/broadcast`
   - `/warn`
   - `/mute`
   - `/unmute`
   - `/kick`
   - `/ban`
   - `/unban`
   - `/warnings`
   - `/promo`
10. Added join-request verification flow:
   - interest selection,
   - experience selection,
   - wallet ownership question,
   - crypto-interest scoring,
   - configurable approval threshold,
   - automatic approve/decline.
11. Added anti-spam / anti-scam pattern checks and flood guard.
12. Added ATH-focused education module.
13. Added safe soft-promotion cooldown service.
14. Added scheduled community education/promotion for explicitly configured target chats.
15. Added PostgreSQL-compatible durable referral storage with memory fallback.
16. Added expanded self-check coverage:
   - referral attribution,
   - sponsor relation,
   - wallet lock,
   - AETHER Wallet referral deep link,
   - crypto scoring,
   - eligibility threshold,
   - scam pattern detection,
   - topic detection,
   - flood protection,
   - promo cooldown,
   - scheduler timing.
17. Railway validation service created:
   - `ath-telegram-bot-validation`
18. Validation deployment `8334ef6a-66c4-45f1-83d2-9208b10d5bcd` completed **SUCCESS**.
19. `npm test` completed and `ATH Telegram bot self-check PASSED`.
20. Bot remains intentionally disabled until real Telegram credentials are supplied.

## ATH REFERRAL SOURCE OF TRUTH

Telegram acquisition and the ATH mining referral ledger are separate.

Official flow:

`Telegram referral → public wallet → sponsor Power validation → AETHER Wallet → buyPower(referrer) → MiningAirdrop`

Telegram does **not** grant an ATH mining referral by itself.

The MiningAirdrop contract remains authoritative for:
- sponsor qualification,
- official referral relationship,
- official referral count,
- referral mining multiplier.

## COMMUNITY SAFETY BOUNDARY

- No mass DM.
- No aggressive mass invite.
- Soft promotion uses a long cooldown.
- User can opt out of promotional updates.
- Bot never asks for seed phrase/private key.
- Bot does not custody funds.
- Bot has read-only ATH RPC access only.
- Admin moderation requires configured Telegram admin IDs.

## GREEN VALIDATION EVIDENCE

Validated commit:

`62262ceff45e627db618c5e11c4a67d1a02255b5`

Railway validation deployment:

`8334ef6a-66c4-45f1-83d2-9208b10d5bcd`

Result:

`SUCCESS`

Build evidence:
- Node runtime detected.
- Dependencies installed.
- Syntax checks passed.
- Community/referral self-check passed.
- Health service started with `BOT_ENABLED=false`.

## CURRENT ACTIVATION GATES

Still required before the bot can be live on Telegram:

1. `TELEGRAM_BOT_TOKEN` from official `@BotFather`.
2. `TELEGRAM_BOT_USERNAME`.
3. `ADMIN_TELEGRAM_IDS`.
4. Durable `DATABASE_URL` before public referral launch.
5. Official `AETHER_APP_URL`, community URL and website URL.
6. Group/channel IDs in `TARGET_CHAT_IDS` if scheduled content is enabled.
7. Bot must be added to the Telegram group as admin with only the permissions required for join approval and moderation.
8. `ATH_MINING_ADDRESS` is connected after the verified ATH Testnet deployment.

## NEXT

1. Create/configure the official Telegram bot through `@BotFather`.
2. Store BotFather token and username only in Railway.
3. Attach PostgreSQL before public referral data collection.
4. Configure admin IDs + official group/channel.
5. Run live private-chat QC.
6. Run group join-request / moderation QC.
7. After ATH Testnet deployment, connect `ATH_MINING_ADDRESS`.
8. Run end-to-end referral QC:
   invite → Telegram attribution → wallet link → sponsor Power check → AETHER Wallet handoff → `buyPower(referrer)` → on-chain confirmation.
