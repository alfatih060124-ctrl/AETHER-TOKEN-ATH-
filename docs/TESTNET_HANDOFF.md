# ATH BSC Testnet Operator Handoff

Current engine validation is green. The remaining deployment gate is operator-controlled wallet configuration.

## Recommended mobile-friendly Testnet path

For Testnet only, the repository supports `TESTNET_USE_DEPLOYER_ROLES=true`.

With that flag enabled, the dedicated BSC Testnet deployer address is also used as:
- Owner
- Treasury
- Team Beneficiary
- Liquidity Wallet
- Marketing Wallet

This reduces the operator setup to **one secret only**:

- `PRIVATE_KEY` — a dedicated BSC Testnet wallet private key, stored only in Railway.

The private key must never be committed to GitHub and must not be pasted into chat.

The Testnet wallet must hold enough **Testnet BNB** for deployment gas.

## One-shot transaction gate

The repository also contains `npm run deploy:once:testnet`.

It refuses to deploy unless:
- `TESTNET_DEPLOY_APPROVED=true`
- `PRIVATE_KEY` exists
- no existing `ATH_TOKEN_ADDRESS`, `ATH_MINING_ADDRESS`, or `ATH_TEAM_LOCK_ADDRESS` is configured

The command always runs `preflight:testnet` first. If any safety check fails, no contract deployment starts.

Keep `TESTNET_DEPLOY_APPROVED=false` until the Testnet key is stored and funded. After a successful deployment, store the generated contract addresses and return this flag to `false`.

## Safe Testnet values

Keep:
- `BSC_TESTNET_RPC`
- `ATH_CHAIN_ID=97`
- `TEAM_LOCK_DAYS=365` for Testnet validation
- `TESTNET_USE_DEPLOYER_ROLES=true`
- `TESTNET_DEPLOY_APPROVED=false` until the deploy moment
- all four Mainnet release gates = `false`

Run preflight before deployment:

```bash
npm run preflight:testnet
```

Preflight validates:
- BSC chain ID 97
- private-key validity without printing the key
- deployer Testnet BNB balance
- Team lock range
- Mainnet gates remain closed

## Explicit-address Testnet path

Set `TESTNET_USE_DEPLOYER_ROLES=false` if separate Testnet addresses are desired. In that mode also configure:
- `OWNER_ADDRESS`
- `TREASURY_ADDRESS`
- `TEAM_BENEFICIARY`
- `LIQUIDITY_WALLET`
- `MARKETING_WALLET`

## BscScan verification

`BSCSCAN_API_KEY` is not required for deployment. Add it before `npm run verify:testnet`.

After deployment, use the deployment manifest to set:
- `ATH_TOKEN`
- `MINING_AIRDROP`
- `TEAM_TOKEN_LOCK`
- `DEPLOYER_ADDRESS`
- `TEAM_RELEASE_AT`

When Testnet single-wallet mode is enabled, verification and post-deployment checks derive the expected role addresses from `DEPLOYER_ADDRESS`.

## Production boundary

The Testnet single-wallet shortcut and one-shot Testnet approval are not Mainnet authorization. Mainnet always requires explicit role addresses and remains blocked until audit, production multisig, exact Team lock selection and ATH/USDT liquidity-lock decisions are complete.
