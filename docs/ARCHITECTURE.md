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

Each daily claim creates one vesting position. This preserves a complete on-chain audit trail for every mining day. Unlock is 10/5/5/80 at 30/60/90/180 days from that daily allocation.

## 7. Price Display Engine

The on-chain function returns a reference/display price only. It begins at $3.00 and rises by $0.001 for each complete 10,000 ATH allocated by mining. It is not an oracle and does not guarantee a market trading price.

## 8. Aether Wallet Runtime Adapter

`engine/athEngine.js` reads chain state and prepares unsigned transactions. It is designed for the Mining page in Aether Wallet: dashboard, Power, Booster, referrals, daily claim, vesting progress and unlocked-ATH claim.

## 9. Admin Boundary

The contract owner controls pause/unpause and treasury changes. Runtime services must not hold user seed phrases or user private keys. Production owner should be a multisig after testnet verification and audit.
