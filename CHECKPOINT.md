# AETHER TOKEN (ATH) Engine — Checkpoint

## CURRENT SOURCE LOCK — MINING v3.3

This section supersedes conflicting v3.2 booster/vesting assumptions lower in this historical checkpoint.

- Base reward remains **1 ATH per eligible UTC day**.
- Daily reward opens **00:05:00 UTC** and expires after **23:59:59 UTC** if not claimed.
- Referral multiplier is applied first.
- **Power Booster** multiplies the referral-adjusted reward by **2x**, lasts **30 days**, and adds 100 Hash.
- **Double Power Booster** requires an active Power Booster plus at least **5 referrals** and applies **3x on top of Power Booster**, giving a 6x booster factor in total.
- Double Power follows the same expiry as the active Power Booster and does not extend it.
- Both booster prices are owner-configurable on-chain through the ATH Control Panel.
- Each successful daily claim unlocks 10% @30d, 5% @60d and 5% @90d; the remaining 80% enters recurring vesting at day 180.
- Recurring vesting is capped at **12 cycles**. Every cycle burns 10% on entry, unlocks 10%/+30d, 5%/+60d, 5%/+90d, and rolls 70% to the next 180-day cycle.
- After Cycle 12, the last rollover settles **60% burn / 40% holder distribution** with zero residual.
- On-chain evidence includes RewardCalculated, RewardClaimed, RewardExpired, VestingCreated, VestingCycleEntered, ATHBurned, VestingTrancheClaimed and VestingFinalSettled.
- Holder-facing read functions expose daily reward status, deadline, allocated/claimed/burned balances, per-position vesting, all cycle previews, current cycle and final settlement preview.
- Automated v3.3 suite: **21 passing**.
- MiningAirdrop deployed bytecode: **18,702 bytes**, below the 24,576-byte EIP-170 limit.
- Web/admin JavaScript syntax QC: **PASSED**.
- Blockchain deployment status: **NOT DEPLOYED** for v3.3.
- Testnet deployer remains blocked at **0.0 tBNB**; at least **0.02 tBNB** is required.
- Mainnet gates remain **CLOSED**.

### v3.3 Deployment Hardening — DONE

- One-shot Testnet deploy now validates source self-check, script syntax, compile, all automated tests, and deterministic ABI fingerprints before preflight.
- Deployment script verifies v3.3 constants immediately after MiningAirdrop creation and before ATH allocations continue.
- Post-deploy verification now checks deployed bytecode existence, fixed supply, owner/treasury, pause state, 700M mining reserve, 50M team lock, all v3.3 reward/booster/vesting constants, zero-state counters, and 365-day lock timing.
- One-shot deploy automatically loads addresses from the generated manifest and runs post-deploy v3.3 invariants before reporting success.
- BscScan verification accepts the canonical manifest variable names `ATH_TOKEN_ADDRESS`, `ATH_MINING_ADDRESS`, and `ATH_TEAM_LOCK_ADDRESS` while preserving legacy aliases.
- Deterministic ABI/release package is generated under `deployments/abi/`.
- MiningAirdrop ABI SHA-256: `8f6eb017880d6dc4dedaa2629d5a2289e2b0c04954f4da878b906538c207fee4`.
- MiningAirdrop deployed-bytecode SHA-256: `dab7c755f796c51e63c62fd6072e9af7ae974ffbca61b99ec4f8735eca2ac7e5`.
- Fail-closed one-shot gate test: `TESTNET_DEPLOY_APPROVED=false` correctly exits before deployment.
- Remaining external blocker is unchanged: fund the Testnet deployer with at least **0.02 tBNB**.


## DONE — Steps 1–23 + Step 24A

1. Blueprint v3.1 converted into an explicit ATH engine architecture.
2. Fixed-supply ATH token retained at 1,000,000,000.
3. Mining engine rebuilt around the 180-day claim window.
4. Unsupported inherited 180-ATH hard cap removed; 180-day mining window retained.
5. Referral tier logic preserved (+10% to +50%).
6. Booster logic preserved as 100 Hash and x2 reward maximum.
7. 4-tier vesting implemented per daily mining allocation.
8. Mining reserve protection added.
9. Treasury update and emergency pause controls retained.
10. Tokenomics deploy flow expanded to distribute 70/20/5/5.
11. Team allocation cliff-lock contract added.
12. Aether Wallet runtime adapter added.
13. Automated Hardhat test suite added.
14. Security/release gates documented.
15. Mainnet deployment remains fail-closed.
16. Zero-dependency source self-check added.
17. Testnet/mainnet environment preflight added.
18. Blueprint decision register added.
19. CI workflow hardened.
20. GitHub Actions runner issue isolated.
21. Railway fallback build runner connected.
22. Compiler validation completed and findings fixed.
23. Full validation is GREEN.
24A. BSC Testnet RPC + single-wallet Testnet mode validated without blockchain deployment.

## FINAL TOKENOMICS LOCK

- Total supply: **1,000,000,000 ATH**.
- Mining reward reserve: **700,000,000 ATH (70%)**.
- Liquidity reserve: **200,000,000 ATH (20%)**; held for the later listing phase, not used by the mining engine.
- Team & Dev: **50,000,000 ATH (5%)**, fixed to an exact **365-day / 12-month lock**.
- Marketing & promotion: **50,000,000 ATH (5%)**.
- Mainnet liquidity remains a separate later launch decision; no Mainnet liquidity is opened by the Testnet deployment.

## LATEST GREEN EVIDENCE

- Current validated code commit: `4fd3751af389c15b0f5cbcf5844a38b71ab08b15`
- Railway deployer/validator service: `ath-testnet-deployer`
- Latest full validator deployment: `c83260a9-a4c1-46cd-8c1c-fcc21c68297f`
- Source self-check: `PASSED`
- BSC Testnet RPC: `PASSED`
- BSC chain ID: `97`
- Safe config: `READY`
- Deployment config: `READY`
- Solidity files compiled: `18`
- Automated tests: `16 passing`
- Admin safety tests: treasury authorization, token emergency pause, excess-reserve liability protection — `PASSED`
- Mainnet gates: all `CLOSED`

## STEP 24B — PREFLIGHT REACHED GAS CHECK

The operator private key is now connected to the deployer service through a Railway reference and is accepted as a valid EVM key.

A real BSC Testnet preflight was executed on Railway deployment:

`3f09d0d4-4ec9-4c5e-8b4d-c50883a95391`

Result:

- Private key: present and parseable.
- BSC Testnet RPC: reachable.
- Chain ID: 97.
- Single-wallet Testnet mode: enabled.
- Mainnet gates: closed.
- Testnet deployer BNB balance: `0.0`.
- Deployment transaction: **NOT STARTED**.

A conservative minimum gas reserve of `0.02 tBNB` is now enforced before deployment begins.

## SAFETY FIXES ADDED BEFORE DEPLOYMENT

- Single-wallet Testnet mode now correctly allows Liquidity + Marketing allocations to share the deployer address.
- Deployer ATH balance checks account for overlapping allocation destinations.
- Post-deployment checks now sum allocations for shared destination addresses instead of falsely expecting separate balances.
- The one-shot deployment runner remains blocked unless `TESTNET_DEPLOY_APPROVED=true`.
- Deployment remains blocked if existing ATH deployment address variables are already present.

## CURRENT BLOCKER

Fund the dedicated BSC Testnet wallet used by `PRIVATE_KEY` with at least:

`0.02 tBNB`

No real BNB is required for this Testnet deployment.

`BSCSCAN_API_KEY` remains a later Step 26 verification input and is not required for Step 25 deployment.

## NEXT — Steps 24B–28

24B. Fund the Testnet deployer with at least 0.02 tBNB and rerun preflight.
25. If preflight passes, temporarily open the Testnet approval gate, run the one-shot deployment, capture addresses, close the gate, and run post-deployment invariants.
26. Add `BSCSCAN_API_KEY`, verify contracts, then test Power → Daily Claim → Booster → Vesting Claim.
27. Freeze verified Testnet addresses + ABI and connect them to Aether Wallet Mining.
27A. ATH Control Panel Admin is implemented at `/admin` with owner-wallet authorization, mining/token pause controls, treasury update, reserve monitoring/recovery guardrails, tokenomics monitoring, team-lock visibility, and on-chain event history. It remains read-only until verified contract addresses exist.
28. Keep Mainnet blocked until audit, production multisig, and ATH/USDT liquidity-lock decisions are complete. Team lock is already fixed at 365 days.

## ATH TELEGRAM BOT — LIVE CHECKPOINT

The Telegram community/promotion bot is live on Railway as `@Aetther_bot` and is connected to the target group `ATH AIRDROP MINER`.

Current validated bot source commit:

`53c2c902d871e5380de0135ff56b80bf15504055`

Validation evidence:

- English-only runtime gate: `PASSED`
- Bot self-check: `PASSED`
- Railway validation deployment: `fec661ff-4f1e-4ea3-b743-0dbbacaa3d9a` — `SUCCESS`
- Railway live deployment: `3d9586d9-c415-4f75-9b0e-7b96573e29c9` — `SUCCESS`
- Telegram bot identity: `@Aetther_bot`
- Target chat admin readiness: `ready=true`
- Delete permission: enabled
- Restrict/Ban permission: enabled
- Invite/Approve permission: enabled
- Community scheduler: active for one target chat
- Soft promotion interval: 8 hours
- Daily education article: 09:00 UTC
- Join verification + crypto-interest scoring: enabled
- Country scoring, group/member records, warnings and moderation-history storage: implemented
- English article center with Airdrop, Mining, Referral, Staking, Trading, Security and AETHER Wallet categories: implemented
- Dedicated `/aether` education route: implemented
- ATH referral attribution: first-attribution protection and self-referral protection implemented
- Blockchain referral bridge: read-only and remains inactive until a verified `ATH_MINING_ADDRESS` is available
- Optional AI replies: implemented but fail-closed unless `AI_REPLY_ENABLED=true` and `OPENAI_API_KEY` is configured
- Mainnet deployment/configuration: untouched

### Telegram Bot Remaining Production Dependency

`DATABASE_URL` is not configured on the live Railway bot service. The bot therefore currently falls back to in-memory storage; records can be lost on restart/redeploy.

Production persistence requires a durable PostgreSQL service and a Railway `DATABASE_URL` reference. This is the only infrastructure dependency currently preventing the bot from being marked fully production-persistent.

The Railway automation agent could not provision PostgreSQL because the Railway Agent usage limit was reached. No credentials were exposed and no temporary database was created.



## ATH MINING WEB — DEPLOYED FRONTEND

- Railway service: `ath-mining-web`
- Service ID: `3b78bd0c-c843-42b7-9530-59e6e71cd2de`
- Source: `/mining-web` on `main`
- Build command: `npm run check`
- Start command: `npm start`
- Health check: `/health`
- Latest deployment: `65c20143-50a7-4a6d-9fcd-2fef73708854` — `SUCCESS`
- Health check: `PASSED`
- Runtime mode: `TESTNET`
- Mainnet flag: `false`
- Mining contract configured: `false` (expected until BSC Testnet deployment)
- Custom domain attached in Railway: `mining.aether.boats`
- DNS authority for `aether.boats`: Spaceship (`launch1.spaceship.net`, `launch2.spaceship.net`)
- DNS CNAME: `PROPAGATED`
- Railway ownership verification: `VERIFIED`
- TLS certificate: `VALID`
- Public HTTPS check: `https://mining.aether.boats` returns HTTP 200
- Health check: `https://mining.aether.boats/health` returns `ok=true`
- Mining contract configured: `false` (expected until BSC Testnet deployment).

### Premium Mining Web UI — LIVE

- Official AETHER visual identity applied from the v3.1 blueprint: gold monogram/wordmark on black, primary gold `#C9A227`.
- Premium black-gold responsive interface deployed with hero branding, mining status, Power, Daily Claim, Booster, vesting, referral tiers and fail-closed security status.
- UI commit: `f14b8a45136034582a82edb74d56186db999044d`.
- Mining-web Railway config isolated from the engine build pipeline: `88eef77b45b9ec104766cd6dd6fae4f2f16354be`.
- Railway deployment: `d6d1ad75-40d5-48b4-9c51-50247640bbd9` — `SUCCESS`.
- ATH Control Panel deployment: `48d2b9ff-517b-4003-902c-382edcd651cc` — `SUCCESS`.
- Admin route: `/admin` with owner-wallet authorization and fail-closed Mainnet writes.
- Public homepage: HTTP 200.
- Stylesheet and application JavaScript: HTTP 200.
- Health endpoint: `ok=true`, `networkMode=TESTNET`, `contractConfigured=false`, `mainnetEnabled=false`.
- Service watch path restored to `mining-web/**`.



## NO-BNB WORK BATCH — CONTROL PANEL / ADMIN QC

Completed without any blockchain deployment transaction:

- ATH Control Panel route: `/admin`.
- Owner wallet is the write authorization boundary; no private key is stored in the browser UI.
- Mainnet admin writes are fail-closed behind `ADMIN_MAINNET_WRITES_ENABLED=true`.
- Read-only metrics prepared for miners, mined allocation, vesting liability, reserve, Power/Booster counts and revenue basis.
- Tokenomics policy shown as 700M / 200M / 50M / 50M.
- Listing policy records the >15,000 organic/original holder target without fabricating a live holder count.
- Admin actions prepared for Mining pause/unpause, ATH token pause/unpause, treasury update, and pause-gated excess reserve recovery.
- Team lock UI fixed to the 365-day policy.
- Recent on-chain Mining event viewer prepared for the latest 2,500 blocks after contract deployment.
- Additional automated tests cover treasury authorization, token emergency pause, and excess reserve liability protection.