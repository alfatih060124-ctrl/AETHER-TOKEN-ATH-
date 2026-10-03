# AETHER TOKEN (ATH) Engine — Checkpoint

## 2026-10-03 ECOSYSTEM TOKENOMICS v2 — MINING LOCK + STAKING v1

- ATH fixed supply remains **1,000,000,000 ATH**; no post-deployment mint.
- **Mining remains 700,000,000 ATH.** Power, Booster, referral, vesting, keeper, and reserve mechanics remain locked; base reward is now **10 ATH/day**.
- `contracts/MiningAirdrop.sol` keeps `BASE_REWARD = 10 ATH`; `getCurrentPrice()` now mirrors the unified **ATHPriceRegistry** official price.
- **Staking ecosystem allocation: 300,000,000 ATH**.
- Staking breakdown: 160M Reward Pool / 30M Presale / 50M Marketing / 30M Development Vesting / 20M Liquidity / 10M Ecosystem Reserve.
- Presale rule: **30,000,000 ATH**, opening **$0.070**, **+$0.001 per complete 100,000 ATH sold**, 300 steps, displayed sell-out price **$0.370**. The final live 100,000-ATH tranche is priced at $0.369; after that tranche sells, Presale is sold out at $0.370.
- Unified ATH official pre-listing reference price is **1 ATH = $0.37** across Mining and Staking. DEX market price may be visible separately; official market mode requires the **15,000-holder gate** and explicit activation.
- `ATHStakingPriceOracle` now reads `ATHPriceRegistry`, while Mining also reads the same registry so both modules share one price source.
- Added contracts: `ATHStaking.sol`, `ATHStakingPriceOracle.sol`, `ATHDevelopmentVesting.sol`.
- Staking packages: Starter 0.35%/180d, Basic 0.45%/180d, Silver 0.55%/365d, Gold 0.65%/365d, Platinum 0.75%/730d, Diamond 0.85%/730d.
- Direct referral: 10%; network reward: 10 levels (8%, 5%, 3%, 2%, 1%, then 0.5% for Levels 6–10).
- Staking principal liability is separated from the 160M reward reserve; referral/network rewards cannot consume protected principal.
- Existing stake economics are snapshotted; later package edits cannot rewrite existing rate/lock terms.
- Development Vesting: 30M ATH, 2-month cliff, 33 active vesting months; final month settles exactly 100% with no stranded 1% residual.
- Full automated suite: **37/37 PASS** (25 Mining tests + 12 Staking/Vesting tests) on the authorized VM.
- Local release rehearsal: **PASS** with 11 ATH/day for a +10% referral example.
- GitHub Actions runner is currently **externally blocked before job start** because GitHub reports the account is locked due to a billing issue; this is not a code/test failure.
- ABI export: **PASS**.
- Local rehearsal proves exact supply conservation: 700M Mining + 300M Staking = 1B ATH.
- Railway validator deployment `26b5913f-b2b0-4f73-b481-d840db2f1b02`: **SUCCESS**, healthcheck **PASSED**.
- Mainnet remains **fail-closed**. No blockchain deployment transaction was executed by this change.

## 2026-10-03 CURRENT LOCK — WEB / CONTROL PANEL / TESTNET PREFLIGHT

- ATH Mining multilingual production: **PASS + LOCK**.
- Supported languages: English, Indonesia, 中文, Español, العربية, Русский, 한국어, 日本語, Tiếng Việt, Português.
- Automated multilingual gate: **259 translation keys across 9 translated languages + English — PASS**.
- `https://mining.aether.boats` remains the public ATH Mining website.
- `https://pm.aether.boats` is the dedicated ATH Control Panel host.
- Control Panel mobile QC: **PASS**.
- Control Panel host isolation: **PASS**; admin routes/assets are restricted to `pm.aether.boats` and are no longer served from the public Mining host.
- Control Panel security headers include noindex/nofollow, DENY framing, HSTS, restrictive permissions policy and host-specific CSP.
- Owner wallet remains the on-chain write authorization boundary; the panel stores no private key.
- Mainnet admin writes remain fail-closed.
- Latest BSC Testnet preflight executed in read-only mode with `TESTNET_DEPLOY_APPROVED=false`, `RUN_ATH_TESTNET_DEPLOY=false`, and `ALLOW_MAINNET_DEPLOY=false`.
- RPC: **PASS**, BSC Testnet chain ID: **97**, source self-check: **PASS**, compile: **PASS**, tests: **25/25 PASS**.
- Testnet deployer: `0xD90aA494da8444222944f87Af5e8D714Dd5aCe44`.
- Latest deployer balance: **0.0 tBNB**.
- Required before Step 25: **at least 0.02 tBNB**.
- No deployment transaction was started.
- After the preflight, all execution flags were returned to false/fail-closed.

## CURRENT SOURCE LOCK — MINING v3.3

This section supersedes conflicting v3.2 booster/vesting assumptions lower in this historical checkpoint.

- Base reward is now **10 ATH per eligible UTC day**.
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
- Automated v3.3 suite: **25 passing**.
- MiningAirdrop deployed bytecode: **20,309 bytes**, below the 24,576-byte EIP-170 limit with **4,267 bytes headroom**.
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
- MiningAirdrop ABI SHA-256: `15ca610bcf463064e6057eb1cf0a5ba31eba6ba827ca1b5cc0ebe876f652280a`.
- MiningAirdrop deployed-bytecode SHA-256: `bfcdc69f7a9e5bd8307239642b4103a8e049f71978388069e63d19ac5c776d33`.
- Fail-closed one-shot gate test: `TESTNET_DEPLOY_APPROVED=false` correctly exits before deployment.
- Remaining external blocker is unchanged: fund the Testnet deployer with at least **0.02 tBNB**.

### Local Release Rehearsal — DONE

- Added a zero-cost Hardhat deployment rehearsal that deploys ATH, MiningAirdrop and TeamTokenLock from clean state.
- Rehearsal verifies the full fixed-supply allocation: 700M mining / 200M liquidity / 50M team lock / 50M marketing.
- Team lock is verified at 365 days and deployer residual ATH is verified at zero.
- Holder smoke flow verifies a real protocol path: Power activation, referral-effective reward, daily claim, initial vesting, Cycle-1 burn/rollover and final 60/40 conservation.
- Latest reward model: 1 referral (+10%) => 11 ATH daily reward; 11 ATH vesting position; 0.88 ATH Cycle-1 burn; 6.16 ATH Cycle-1 rollover.
- Local release rehearsal runs with `npm run release:smoke:local` and requires no BNB/tBNB.
- Full gate remains green: source self-check PASSED, syntax check PASSED, **25/25 automated tests PASS**, ABI export PASS, local release rehearsal PASS.
- This rehearsal does not create public blockchain addresses and does not alter Testnet/Mainnet gates.

### Reward Keeper / Transparency Hardening — DONE

- Added permissionless `snapshotDailyRewards(address[])` and `expireDailyRewards(address[],dayId)` batch functions.
- Batch execution is capped at **50 accounts** per transaction to bound gas exposure.
- Added `RewardBatchSnapshotted` and `RewardBatchExpired` summary events while preserving per-holder `RewardCalculated` / `RewardExpired` evidence.
- Added an on-chain miner registry populated at Power activation.
- Added paginated `getMiners(offset,limit)` with a **200-account page cap**, eliminating daily historical-log scans and external holder databases for keeper discovery.
- Keeper runtime is fail-closed: `KEEPER_ENABLED=false` performs no RPC call and no transaction.
- Keeper runtime defaults to dry-run, is **BSC Testnet chain 97 only**, and rejects Mainnet in v3.3.
- Keeper wallet is designed as a dedicated gas-only wallet with no owner, treasury, vesting, Booster-price, or token-control authority.
- Deployment and post-deploy invariant scripts verify `MAX_KEEPER_BATCH=50` and `MAX_MINER_PAGE=200`.
- Release ABI export requires the keeper batch functions and miner registry getters.
- Runbook: `docs/REWARD_KEEPER_RUNBOOK.md`.
- Testnet acceptance checklist: `docs/TESTNET_ACCEPTANCE_CHECKLIST.md`.
- No-BNB completion register: `docs/NO_BNB_COMPLETION.md`.

### No-BNB Completion Gate — DONE

All work that does not require a public-chain transaction is now represented by executable checks or documented release gates: contract rules, 25 automated tests, source self-check, script syntax checks, ABI/bytecode fingerprints, local full-tokenomics deployment rehearsal, holder-flow rehearsal, keeper hardening, deterministic npm lockfiles, deployment/post-deploy invariants, BscScan verification tooling, Control Panel, public web, AI knowledge, Whitepaper, runbooks and acceptance checklist.

Production dependency lockfiles are clean and reproducible: root engine and mining-web both install successfully with `npm ci`; the production-only npm audit reports **0 vulnerabilities** after removing an extraneous local Playwright QC dependency from the lockfiles.

The remaining Step 25 blocker is external: **>=0.02 tBNB** in the dedicated BSC Testnet deployer wallet. No real BNB is required for the Testnet phase.

### Public Documentation / AI Sync — DONE

- Whitepaper updated to **v1.1** and explicitly aligned to Mining Protocol **v3.3**.
- Public Whitepaper now documents the 00:05 UTC claim window, Power Booster 2x/30d, Double Power 3x with 5-referral gate, 12 recurring vesting cycles, cycle-entry burn, and final 60/40 settlement.
- AETHER AI English and Indonesian fallback knowledge now uses the same v3.3 rules and no longer describes the old 80% direct Day-180 final unlock.
- Landing page roadmap and Whitepaper links point to `/ATH-Whitepaper-v1.1.pdf`; `/ATH-Whitepaper-v1.0.pdf` remains a backward-compatible alias.
- `/health` and `/config` expose `miningProtocolVersion=3.3` and `whitepaperVersion=1.1`.
- Desktop 1440px and mobile 393px visual QC: no horizontal overflow; Whitepaper/roadmap/AI controls present with no page JavaScript errors.


## DONE — Steps 1–23 + Step 24A

1. Blueprint v3.1 converted into an explicit ATH engine architecture.
2. Fixed-supply ATH token retained at 1,000,000,000.
3. Mining engine rebuilt around the 180-day claim window.
4. Unsupported inherited 180-ATH hard cap removed; 180-day mining window retained.
5. Referral tier logic preserved (+10% to +50%).
6. Power Booster 2x/30d and Double Power 3x-on-Power logic implemented with configurable prices and 5-referral Double Power gate.
7. Initial 10%/5%/5% unlock plus 80% recurring 12-cycle vesting/burn implemented per daily mining allocation.
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

## FINAL TOKENOMICS LOCK — ECOSYSTEM v2

- Total supply: **1,000,000,000 ATH**.
- Mining reward reserve: **700,000,000 ATH (70%)** — Mining v3.3 remains locked and unchanged.
- Staking ecosystem: **300,000,000 ATH (30%)**.
  - Reward Pool: 160,000,000 ATH.
  - Presale: 30,000,000 ATH — $0.070 opening, +$0.001/100,000 ATH sold, $0.370 sold-out reference.
  - Marketing: 50,000,000 ATH.
  - Development Vesting: 30,000,000 ATH.
  - Liquidity: 20,000,000 ATH.
  - Ecosystem Reserve: 10,000,000 ATH.
- Pre-listing ATH reference valuation: **1 ATH = $0.37**; official listing holder target: **15,000**.
- Mainnet liquidity remains a separate later launch decision; no Mainnet liquidity is opened by Testnet deployment.

## LATEST GREEN EVIDENCE

- Current validated source: **ATH Mining v3.3 no-BNB completion gate**.
- Railway deployer/validator service: `ath-testnet-deployer`.
- Validator will be pinned to the merged keeper-hardening commit before any Testnet transaction.
- Source self-check: `PASSED`
- BSC Testnet RPC: `PASSED`
- BSC chain ID: `97`
- Safe config: `READY`
- Deployment config: `READY`
- Solidity files compiled: `18`
- Automated tests: **25 passing**
- Local release rehearsal: **PASSED**
- Reward keeper default/fail-closed test: **PASSED**
- MiningAirdrop bytecode: **20,309 bytes / 24,576 max**
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
## 2026-10-03 — Unified Mining + Staking / $0.37 Pre-Listing Revision

- Source branch: `revise/ath-unified-price-037`, based on main HEAD `e617b2a95d06ea816cee54d48fc649a5e8def7d4`.
- ATH total supply remains fixed at **1,000,000,000 ATH**.
- Mining allocation remains **700,000,000 ATH**; Mining v3.3 reward/booster/vesting logic remains unchanged.
- Mining base reward remains **10 ATH/day**; stale frontend 1 ATH defaults/formulas were corrected.
- Staking ecosystem allocation remains **300,000,000 ATH**.
- Added `ATHPriceRegistry`: official pre-listing price **1 ATH = $0.37**, `PRE_LISTING_FIXED`.
- Official listing holder gate: **15,000 holders**. Live DEX price may be exposed separately before listing without replacing the official $0.37 reference.
- Mining and Staking now consume the same ATH Price Registry.
- Added unified Mining + Staking portal, responsive Staking UI, stake/claim/withdraw workflow, and 10-language Staking translation layer.
- Mainnet remains fail-closed; no LIVE/mainnet deployment was enabled.
- QC evidence: source self-check PASS, web i18n QC PASS, **40 contract tests PASS**, ABI export PASS, local release rehearsal PASS, web /health + /config runtime smoke PASS.
