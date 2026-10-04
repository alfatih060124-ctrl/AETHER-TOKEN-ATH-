# AETHER ATH — No-BNB Completion Gate

This register defines everything that can and must be completed before any BSC Testnet gas is funded.

## Completed without BNB/tBNB

### Protocol and tokenomics
- Fixed ATH supply = **1,000,000,000 ATH**.
- Mining allocation = **700,000,000 ATH**.
- Staking ecosystem allocation = **300,000,000 ATH**:
  - 160M Daily Staking Reward Reserve.
  - 30M Presale.
  - 50M Marketing / Network Reserve.
  - 30M Development Vesting.
  - 20M Liquidity.
  - 10M Ecosystem Reserve.
- Presale starts at **$0.070**, rises **$0.001 per complete 100,000 ATH sold**, and reaches the **$0.370 sold-out reference**.
- Mining and Staking use the same Presale-linked ATH reference price before official listing.
- Official market/listing mode remains gated by **15,000 holders + explicit activation**.

### Mining
- Base Mining reward = **10 ATH/day**.
- Mining reward window = **00:05:00–23:59:59 UTC**.
- Missed Mining reward expires and does not accumulate.
- Mining referral multiplier = +10% through +50%.
- Power Booster = 2x, 30 days, +100 Hash.
- Double Power = 3x on top of Power and requires 5 referrals.
- 12-cycle recurring vesting and final 60/40 settlement are implemented.
- Mining reserve protection, events, holder reads, miner registry, batch transparency functions and fail-closed Mining keeper are implemented.

### Staking
- Package ladder and fixed lock/rate snapshots are implemented.
- Staking Daily Reward settles on the **00:50 UTC daily slot**.
- Principal liability is isolated from both the 160M Daily Reward Reserve and 50M Marketing/Network Reserve.
- Unified Direct Referral is implemented:
  - unranked direct sponsor = 10% total,
  - Rank 1–8 total referral rates = 13%, 16%, 19%, 22%, 25%, 28%, 31%, 35%.
- Rank uplift is differential and the full referral path can never exceed 35%.
- **Same Rank = skip, not stop**. Equal Rank receives no duplicate uplift, while traversal continues upward until a higher Rank is found.
- L1–L10 Staking Network Bonus is paid in real time during the downline reward settlement transaction.
- Rank Salary thresholds and lifetime weekly salary are implemented.
- Rank Salary schedule = weekly **00:30 UTC** after the qualification delay.
- Persistent Rank member registry, direct-leg pagination, Rank payout queue and complete on-chain Rank Salary history are implemented.
- Dedicated 00:50 Staking Reward Keeper and 00:30 Rank Salary Keeper are fail-closed and Testnet-only until activation.

### Admin and wallet-role security
- Mining, Staking and Presale/Token owners are separate wallet roles.
- Mining Treasury is a separate role from Mining Admin.
- Current policy maps Mining Treasury to the same destination as Presale Treasury.
- Keeper wallet is separate from all owner/treasury roles.
- Keeper scripts verify that the transactional private key derives exactly to the configured Keeper wallet.
- Control Panel is separated into Mining, Staking and Token/Presale operational workspaces.
- Public `pm.aether.boats` exposes only:
  - Connect Wallet Mining
  - Connect Wallet Staking
  - Connect Wallet Presale
- Full admin panel requires server-side nonce + wallet signature authentication.
- Admin session is time-limited and uses HttpOnly / Secure / SameSite=Strict cookies.
- Role-authenticated wallet can open only its authorized workspace.
- Changing the connected wallet locks the admin session.

### Public holder portal
- Public Mining and Staking holder areas are clearly separated.
- Holder chooses Mining Area or Staking Area after wallet connection.
- Inactive engine area is hidden from the active holder workspace.
- Mining area explicitly shows Mining reward/referral/vesting rules.
- Staking area explicitly shows 00:50 reward, Direct Referral/Rank, Network Bonus and Rank Salary rules.
- Presale remains a separate neutral area.
- Desktop/mobile responsive separation is implemented.

### Release, QC and security
- Source self-check.
- Script syntax gate.
- Production runtime dependency security audit.
- Public web production dependency audit.
- BSC Testnet RPC check.
- Explicit Non-BNB Readiness gate.
- Mainnet fail-closed gates.
- Solidity compile.
- Full automated contract tests.
- Deterministic ABI/release export.
- Local full release rehearsal.
- EIP-170 bytecode size checks.
- One-shot Testnet deployment gate.
- Post-deploy invariant checker.
- BscScan verification tooling.
- Public multilingual web.
- Whitepaper / roadmap / AETHER AI sync.
- Testnet acceptance checklist.
- Mining, Staking Reward and Rank Salary keeper runbooks.

## Latest no-BNB validation evidence

Latest validator evidence:
- Runtime high/critical vulnerabilities: **0**.
- Internal code and role configuration: **PASS**.
- Non-BNB readiness: **PASS**.
- Source self-check: **PASS**.
- Syntax checks: **PASS**.
- BSC Testnet RPC: **PASS**.
- Solidity compiled: **28 files**.
- Automated tests: **69 passing**.
- ABI export: **PASS**.
- Local release rehearsal: **PASS**.

Latest public web evidence:
- Production dependency audit: **0 vulnerabilities**.
- Multilingual QC: **284 keys across 9 translated languages + English**.
- Healthcheck: **PASS**.
- Runtime: TESTNET, contractConfigured=false, mainnetEnabled=false.

## External decisions / inputs that remain

These are not unfinished coding tasks and must not be invented by the release tooling:

- `PRESALE_PAYMENT_TOKEN`
- `LIQUIDITY_WALLET`
- `STAKING_RESERVE_WALLET`
- `DEVELOPMENT_BENEFICIARY`
- `BSCSCAN_API_KEY` (required only for explorer verification after deployment)

## Intentionally impossible before public-chain gas

The following require a real BSC Testnet transaction or deployed address:

1. Fund Testnet deployer with the required tBNB balance.
2. Deploy contracts to BSC Testnet.
3. Produce final public Testnet contract addresses.
4. Run post-deploy checks against those addresses.
5. Verify deployed source on BscScan.
6. Execute real Testnet Mining/Presale/Staking transactions.
7. Enable transactional keeper mode and produce real keeper transactions.
8. Bind AETHER Wallet to verified deployed Testnet contracts.

No real BNB is required for the Testnet phase. Mainnet remains closed.
