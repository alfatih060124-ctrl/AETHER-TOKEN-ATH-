# ATH BSC Testnet Operator Handoff

Current engine validation is green. The remaining deployment gate is operator-controlled wallet configuration.

## Minimum manual inputs before Testnet deployment

1. Create or choose a **dedicated BSC Testnet wallet**.
2. Fund that wallet with **Testnet BNB** for deployment gas.
3. In Railway project `aether-ath-testnet` → service `ath-engine-ci` → Variables, add:
   - `PRIVATE_KEY` — store only in Railway. Do not commit it and do not paste it into chat.
   - `OWNER_ADDRESS`
   - `TREASURY_ADDRESS`
   - `TEAM_BENEFICIARY`
   - `LIQUIDITY_WALLET`
   - `MARKETING_WALLET`
4. Keep these existing safety values unchanged:
   - `ATH_CHAIN_ID=97`
   - all four Mainnet gates = `false`
5. Run `npm run preflight:testnet`. It verifies:
   - chain ID is 97,
   - addresses are valid,
   - private key is valid without printing it,
   - deployer has Testnet BNB,
   - Team lock is inside the configured 365–550 day range,
   - Mainnet gates remain closed.

## Fast Testnet-only option

For Testnet convenience, the operator may deliberately use the **same public Testnet address** for Owner, Treasury, Team Beneficiary, Liquidity Wallet and Marketing Wallet. This is only a Testnet simplification; it is not a production-governance recommendation and is not required by the blueprint.

If this option is chosen, only one public address needs to be supplied for those five role variables. The deployer private key must still remain a Railway secret.

## BscScan verification

`BSCSCAN_API_KEY` is not required to deploy to Testnet. Add it before running `npm run verify:testnet`.

After deployment, use the generated deployment manifest to set:
- `ATH_TOKEN`
- `MINING_AIRDROP`
- `TEAM_TOKEN_LOCK`
- `DEPLOYER_ADDRESS`
- `TEAM_RELEASE_AT`

Then run BscScan verification and the post-deployment invariant checker before connecting Aether Wallet.

## Production boundary

Do not reuse the Testnet private key for Mainnet. Mainnet remains blocked until audit, multisig, final Team lock selection and ATH/USDT liquidity-lock decisions are complete.
