# AETHER ATH — Telegram Referral Integration Architecture

## Objective

Integrate the community/promotion Telegram bot with the ATH mining referral program without allowing Telegram to become the authoritative reward ledger.

## Architecture

```text
Telegram User
   │
   ├─ joins / starts through referral deep link
   ▼
Telegram Bot
   │
   ├─ acquisition attribution
   ├─ community verification / education / moderation
   ├─ public wallet linking
   └─ read-only sponsor qualification check
   ▼
ATH Referral Bridge
   │
   ├─ reads MiningAirdrop.getUserInfo(sponsor)
   ├─ requires sponsor.hasPower == true
   └─ builds AETHER Wallet link with ath_referrer
   ▼
AETHER Wallet
   │
   ├─ verifies connected member wallet
   ├─ shows sponsor wallet before transaction
   └─ builds unsigned buyPower(referrer)
   ▼
MiningAirdrop Smart Contract
   │
   ├─ rejects self-referral
   ├─ counts sponsor only if sponsor already has Power
   ├─ stores referrerOf(member)
   └─ increments sponsor referralCount
   ▼
ATH Referral Mining Multiplier
```

## Two referral states

### 1. Telegram referral

Created when an invited user opens:

`https://t.me/<bot>?start=ref_<telegram_user_id>`

Purpose:
- campaign attribution,
- acquisition analytics,
- route the member to the correct sponsor wallet.

Rules:
- first attribution wins,
- self-referral blocked,
- repeat attribution blocked.

### 2. ATH on-chain referral

Created only by:

`MiningAirdrop.buyPower(referrer)`

Purpose:
- official mining referral relationship,
- official sponsor referral count,
- mining multiplier.

The smart contract remains authoritative.

## Referral tiers

The bot may display the contract's current referral bonus, but it must not create its own authoritative reward count.

Current ATH tiers:

| Active on-chain referrals | Mining bonus |
| ---: | ---: |
| 1–5 | +10% |
| 6–10 | +15% |
| 11–20 | +20% |
| 21–25 | +25% |
| 26–30 | +30% |
| 31–35 | +35% |
| 36–40 | +40% |
| 41–45 | +45% |
| 46+ | +50% |

## Sponsor qualification

Before AETHER Wallet receives a Telegram sponsor:

1. Sponsor has a linked public EVM wallet.
2. Sponsor wallet is different from the invited member wallet.
3. Bot reads `getUserInfo(sponsorWallet)`.
4. `hasPower` must be true.
5. Only then is the sponsor shown as ATH referral-ready.

If the contract is not configured or unavailable, Telegram attribution is preserved but is not presented as an official ATH referral.

## AETHER Wallet handoff

Canonical query:

```text
?source=telegram
&campaign=ath-airdrop
&ath_referrer=0xSPONSOR
&ath_wallet=0xMEMBER
```

AETHER Wallet must:
- validate `ath_referrer`,
- block self-referral,
- read sponsor Power state,
- present sponsor to the member,
- pass the sponsor to `buyPower(referrer)` only after user approval,
- sign locally in the user's wallet,
- confirm `referrerOf(member)` after mining Power activation.

## Security

Telegram bot:
- does not hold blockchain private keys,
- does not ask for seed phrases,
- uses only read-only BSC RPC calls,
- never claims Telegram acquisition alone grants ATH,
- locks linked wallet identity against silent replacement,
- keeps promotional messaging opt-in,
- keeps admin broadcast separate from mining execution.

## Source architecture modules retained conceptually

The supplied community-bot architecture remains the product structure:

- join request / verification,
- moderation,
- anti-spam / anti-flood,
- education,
- articles,
- soft promotion,
- scheduler,
- AI community reply,
- PostgreSQL member state,
- Redis rate limits.

The ATH referral bridge is an additional business-logic service and should not be mixed into moderation or AI reply handlers.
