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

## Wallet signing

`engine/athEngine.js` builds unsigned transaction requests. Aether Wallet signs the transaction locally and broadcasts it through the configured BSC RPC. The runtime adapter does not require a user private key.

## UI brand rules from the supplied blueprint

- Token icon: `assets/logo_ath_icon.png`.
- Splash / header: `assets/logo_aether_brand.png`.
- Primary brand colors: gold `#C9A227` and black `#000000`.
- Do not display the text `NON-CUSTODIAL` in the ATH UI.
