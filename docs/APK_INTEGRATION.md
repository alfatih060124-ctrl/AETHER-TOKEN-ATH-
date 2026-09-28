# AETHER Wallet → ATH Engine Integration

The ATH Engine is separate from the AutoTrade Execution Engine. It powers the AETHER TOKEN (ATH) mining module inside Aether Wallet.

## Read-only dashboard calls

- `getCurrentPrice()` → displayed ATH reference price in micro-USD.
- `getUserInfo(wallet)` → Power status, mining day, allocated ATH, claimed ATH, pending vesting, referral bonus, booster multiplier and Hash.
- `getPositionsCount(wallet)` + `getVestingPosition(wallet,index)` → vesting progress.
- `getReferrals(wallet)` → active referral addresses recorded by the contract.
- `contractBalance()` → ATH reserve currently held by the mining contract.

## User transaction flow

1. **Start Mining** → call `buyPower(referrer)` with exactly 0.001 BNB.
2. **Daily Claim** → call `claimDaily()` once per mining day. Missed days are not back-paid.
3. **Booster** → call `buyBooster()` with exactly 0.001 BNB. Each purchase adds 100 Hash; reward multiplier is 2x maximum under the supplied blueprint.
4. **Vesting** → show four tranches for each daily allocation: 10% / 5% / 5% / 80% at 30/60/90/180 days.
5. **Withdraw unlocked ATH** → `claimVested(index)` or `claimAllVested()`.

## Telegram → AETHER Wallet referral handoff

The official referral pipeline is:

`Telegram referral → sponsor wallet validation → AETHER Wallet → buyPower(referrer) → MiningAirdrop contract`

The Telegram bot may open the AETHER Wallet ATH mining page using these query parameters:

- `source=telegram`
- `campaign=ath-airdrop`
- `ath_referrer=0xSPONSOR_WALLET`
- `ath_wallet=0xMEMBER_WALLET` when already known

### Wallet behavior

When AETHER Wallet receives `ath_referrer`:

1. Validate it as a non-zero EVM address.
2. Reject it if it equals the connected user's wallet.
3. Read `getUserInfo(ath_referrer)`.
4. Show sponsor address and sponsor Power status to the user.
5. If sponsor `hasPower == false`, do not describe it as an active ATH referral.
6. If sponsor is valid, keep the value attached to the Start Mining review screen.
7. On user approval, call `buildBuyPower(ath_referrer)`.
8. The wallet signs locally and broadcasts the transaction.
9. After confirmation, read the user's on-chain referral through the MiningAirdrop state and display the confirmed sponsor.

The smart contract is authoritative. Telegram attribution alone does not grant an ATH referral bonus.

## Referral multiplier display

AETHER Wallet should display the referral bonus returned by `getUserInfo(wallet)` rather than calculating an independent authoritative balance.

Current referral tiers encoded in MiningAirdrop are:

- 1–5 qualifying referrals → +10%
- 6–10 → +15%
- 11–20 → +20%
- 21–25 → +25%
- 26–30 → +30%
- 31–35 → +35%
- 36–40 → +40%
- 41–45 → +45%
- 46+ → +50%

## Wallet signing

`engine/athEngine.js` builds unsigned transaction requests. Aether Wallet signs the transaction locally and broadcasts it through the configured BSC RPC. The runtime adapter does not require a user private key.

## UI brand rules from the supplied blueprint

- Token icon: `assets/logo_ath_icon.png`.
- Splash / header: `assets/logo_aether_brand.png`.
- Primary brand colors: gold `#C9A227` and black `#000000`.
- Do not display the text `NON-CUSTODIAL` in the ATH UI.
