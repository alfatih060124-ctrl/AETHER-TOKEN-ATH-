# AETHER ATH Telegram Bot — Checkpoint

Date: 2026-09-29

## LIVE RUNTIME STATUS

- Railway service: `ath-telegram-bot`
- Telegram bot: `@Aetther_bot`
- Target community: `ATH AIRDROP MINER`
- Bot runtime: enabled
- Community features: enabled
- Join verification: enabled
- Target-group permission readiness: PASS
- Railway deployment: SUCCESS
- Current bot package: v0.4.0
- User-facing language: English only

## COMPLETED

1. Telegram Bot API long-polling runtime with health endpoint.
2. BotFather token and username isolated in Railway variables.
3. Admin Telegram ID configured.
4. Target Telegram group configured.
5. Startup target-group permission verification:
   - administrator status,
   - delete messages,
   - restrict/ban members,
   - invite/approve members.
6. Telegram referral deep links using `?start=ref_<telegram_user_id>`.
7. First-attribution referral tracking with self-referral and duplicate protection.
8. Public BSC/EVM wallet linking with wallet identity lock.
9. ATH read-only referral bridge:
   - sponsor Power lookup,
   - on-chain referral count,
   - referral multiplier,
   - AETHER Wallet handoff,
   - no blockchain private key in the bot.
10. Join-request verification:
    - interest selection,
    - experience selection,
    - country/region selection,
    - wallet ownership question,
    - crypto-interest scoring,
    - configurable minimum score,
    - automatic approve/decline.
11. Source scoring preserved:
    - airdrop +25,
    - trading +20,
    - staking +20,
    - mining +15,
    - wallet +20,
    - advanced +15 / intermediate +10,
    - priority-country +10,
    - score capped at 100,
    - default eligibility threshold 60.
12. English welcome/onboarding flow.
13. Anti-scam pattern detection.
14. Anti-flood protection.
15. Admin moderation:
    - warn,
    - warning count,
    - mute,
    - unmute,
    - kick,
    - ban,
    - unban,
    - moderation log.
16. Durable-storage implementation for PostgreSQL:
    - users,
    - groups,
    - memberships,
    - join requests,
    - verification profile fields,
    - warnings,
    - moderation logs.
17. Development memory fallback when PostgreSQL is not configured.
18. English ATH education center.
19. Rotating daily education articles.
20. Soft promotion with long cooldown.
21. Scheduler for target communities.
22. English command registration and Telegram bot description.
23. Admin aggregate statistics.
24. Opt-out support with `/stop`.
25. Broadcast limited to users who started the bot and have not opted out.
26. Optional English AI reply module:
    - disabled by default,
    - never asks for seed phrase/private key,
    - no guaranteed financial outcomes,
    - short crypto-focused replies.
27. Automated syntax checks and self-check tests.
28. Latest validated build reports zero npm dependency vulnerabilities.
29. `ATH Telegram bot self-check PASSED`.
30. English-only runtime scan completed with no Indonesian user-facing strings detected.

## MEMBER COMMANDS

- `/start`
- `/airdrop`
- `/invite`
- `/referral`
- `/wallet`
- `/stats`
- `/education`
- `/aether`
- `/article`
- `/myid`
- `/chatid`
- `/help`
- `/stop`

## ADMIN COMMANDS

- `/adminstats`
- `/broadcast`
- `/promo`
- `/warn`
- `/warnings`
- `/mute`
- `/unmute`
- `/kick`
- `/ban`
- `/unban`
- `/modlog`

## ATH REFERRAL SOURCE OF TRUTH

Official flow:

`Telegram referral → public wallet → sponsor Power validation → AETHER Wallet → buyPower(referrer) → MiningAirdrop`

Telegram attribution alone does not create an ATH mining referral. The ATH mining contract remains authoritative for sponsor eligibility, the official referral relationship, official referral count and referral mining multiplier.

## SAFETY BOUNDARIES

- No aggressive mass invite.
- No unsolicited mass DM.
- Soft promotion uses a long cooldown.
- Users can opt out.
- The bot never asks for a seed phrase or private key.
- The bot does not custody funds.
- Blockchain access is read-only.
- Admin actions require configured admin IDs.
- Moderation is restricted to configured target chats.
- Mainnet deployment credentials are never stored in the Telegram bot service.

## LATEST VALIDATION

Validated code commit deployed before the documentation-only update:

`7db83f17e7658cb6f3960a705b4bf3264be02a31`

Railway deployment:

`a01f3e04-62e8-47ff-9c22-c02a4e5cbb99`

Result:

`SUCCESS`

Evidence:
- package version `0.4.0`,
- syntax checks passed,
- self-check passed,
- 0 npm vulnerabilities,
- bot connected as `@Aetther_bot`,
- target group detected,
- bot admin permission readiness = true,
- scheduler active for one target chat.

## EXTERNAL PRODUCTION GATES

The bot code is complete, but the following external integrations remain before full durable public operation:

1. Attach a Railway PostgreSQL database and set `DATABASE_URL`.
2. Configure official `AETHER_APP_URL`, community URL and website URL when finalized.
3. Configure `ATH_MINING_ADDRESS` after the verified ATH Testnet deployment.
4. Optional: configure `OPENAI_API_KEY` and enable `AI_REPLY_ENABLED=true` if AI replies are desired.

Until `DATABASE_URL` is attached, the live bot works but referral/community state is stored in memory and can reset when the container restarts.

## NEXT ACCEPTANCE TEST

After PostgreSQL is attached:

1. restart bot,
2. verify database table creation,
3. run `/adminstats`,
4. test join request → verification → approval,
5. test warn/mute/unmute and `/modlog`,
6. restart service,
7. confirm data remains,
8. after ATH Testnet deploy, complete the end-to-end referral test through `buyPower(referrer)`.
