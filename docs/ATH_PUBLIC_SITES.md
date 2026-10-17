# ATH Public Mining and Staking Sites

## Public host separation

The public web server supports `PUBLIC_SITE=unified` (backward-compatible default), `PUBLIC_SITE=mining`, and `PUBLIC_SITE=staking`.

- **Mining public site:** `https://mining.aether.boats` → Railway service `ath-mining-web`, `PUBLIC_SITE=mining`.
- **Staking public site:** `https://stake.aether.boats` → separate Railway service `ath-staking-web`, `PUBLIC_SITE=staking`.
- **Control panel:** `https://pm.aether.boats` remains on the existing service and continues to use its wallet-authenticated admin gate.

Both public services use repository root directory `mining-web`, start command `npm start`, port `8080`, and health path `/health`. The Staking site hides Mining-only operations and Presale controls; the Mining site hides Staking-only operations. The existing unified portal remains the default for any deployment without `PUBLIC_SITE` set.

## Release and DNS gates

1. Merge the public-site implementation to the intended production branch only after its checks pass.
2. Set `PUBLIC_SITE=mining` on the existing `ath-mining-web` service and verify the Mining-only UI and `/health` response.
3. Create a separate `ath-staking-web` service from the same repository and `mining-web` root, set `PUBLIC_SITE=staking`, and verify it before assigning the custom domain.
4. Attach `stake.aether.boats` to the Staking service in Railway and apply the exact DNS record(s) Railway returns. Do not guess the CNAME target.
5. Verify DNS, TLS certificate, page isolation, wallet connection, `/config`, and `/health` from the public internet.
6. Keep staking transactions fail-closed until the verified ATH Token and Staking contract addresses are configured on the correct testnet and all contract acceptance checks pass. The website split alone does not configure or deploy smart contracts.

## Safety note

`PUBLIC_SITE` changes presentation and routing only. It must not be treated as evidence that staking contracts are deployed, funded, unpaused, or production-ready. Mainnet remains disabled until separate release gates are approved.