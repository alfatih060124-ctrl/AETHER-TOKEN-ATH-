# AETHER TOKEN (ATH) Engine Architecture

## 1. Token Core

`ATHToken.sol` is the fixed-supply BEP-20 asset. It mints exactly 1,000,000,000 ATH once and has no later mint path. Owner may pause transfers for emergency response.

## 2. Tokenomics Distribution

Deployment allocates:

- 70% / 700,000,000 ATH → MiningAirdrop reserve.
- 20% / 200,000,000 ATH → liquidity wallet for ATH/USDT.
- 5% / 50,000,000 ATH → TeamTokenLock.
- 5% / 50,000,000 ATH → marketing wallet.

## 3. Mining Core

`MiningAirdrop.sol` is the deterministic on-chain mining/accounting engine. It records Power activation, claim day, referral count, Hash/Booster, reward allocation and vesting positions.

## 4. Revenue / Treasury

Power and Booster BNB payments are forwarded immediately to `treasury`. `setTreasury()` is owner-only so the AETHER admin layer can change the revenue wallet only through an authorized owner transaction.

## 5. Referral Engine

Referral is attached only when a new miner buys Power and the referrer already has Power. The tier table is encoded directly in contract logic.

## 6. Vesting Engine

Each daily claim creates one vesting position. This preserves a complete on-chain audit trail for every mining day. Unlock is 10/5/5/80 at 30/60/90/180 days from that daily allocation. AETHER does not sponsor holder gas: holder-triggered daily claims, explicit vesting processing and vested-token withdrawals are signed by the holder wallet and network gas is paid in BNB by that holder.

## 7. Price Display Engine

ATHPriceRegistry is the single official price source. Before listing it returns a fixed $0.37 reference price to Mining and Staking, while an optional DEX market oracle can be read separately. Official price mode cannot switch to MARKET until a recorded holder count reaches 15,000 and the owner explicitly activates listing. The $0.37 pre-listing value is a protocol/P2P reference, not a guaranteed redemption value.

## 8. Aether Wallet Runtime Adapter

`engine/athEngine.js` reads chain state and prepares unsigned transactions. It is designed for the Mining page in Aether Wallet: dashboard, Power, Booster, referrals, daily claim, vesting progress and unlocked-ATH claim.

## 9. Admin Boundary

The contract owner controls pause/unpause and treasury changes. Runtime services must not hold user seed phrases or user private keys. Production owner should be a multisig after testnet verification and audit.
