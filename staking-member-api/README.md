# ATH Staking member API — deployment gate

This service is independent of Mining and AI Trade. Node 22, ethers 6 and pg 8 are required. The service must listen on 127.0.0.1:8185 on aitrade-ath-v3; PostgreSQL is bound to 127.0.0.1:15485. Inject POSTGRES_PASSWORD privately from the existing VM configuration; never commit it or expose the database.

Existing database objects: members, master_allocation, member_challenges, member_sessions and protect_member_identity trigger. Check schema and backup before deploying. Verify the single Master wallet and unfunded allocation before startup.

The API is not a transaction engine. No on-chain positions, funded stake or rewards are created. Master allocation must be labeled unfunded, separately from paid stake.

Routes:
- POST /api/member/challenge {wallet, referral}: returns a five-minute signable message.
- POST /api/member/verify {nonce, signature}: verifies EIP-191 signature and binds immutable sponsor on initial registration; sets a secure HttpOnly cookie.
- GET /api/member/session: returns only the authenticated account.
- POST /api/member/logout {}: revokes session.

All POST requests require JSON and Origin https://staking.aether.boats. Use a same-origin HTTPS reverse proxy for these routes; do not expose port 8185 or PostgreSQL publicly. Configure an authenticated private upstream between Railway and the VM and rate-limit by trusted ingress IP and global request volume before enabling public access. Do not trust client-supplied forwarded IP headers. Never expose upstream credentials to browser JavaScript.

Frontend: request challenge after wallet selection, sign the exact message with personal_sign, submit nonce/signature, then redirect only after HTTP 200 and verified session. Do not treat eth_requestAccounts or a deep-link callback as authentication. Guard the private member route at the server; remove local test signup and public preview when replacing them. Preserve referral through redirects.

QC on a disposable database before production:
1. Verify no referral / invalid sponsor / self-sponsor are rejected for new wallets.
2. Generate two test wallets and sign challenges; verify valid referral registration and persisted sponsor.
3. Verify incorrect signature, expired challenge and replay are rejected.
4. Verify simultaneous registration under different sponsors cannot reassign sponsor.
5. Verify session cookie, session expiry, logout, session isolation and protected direct URL.
6. Restart test service and confirm persistence.
7. Verify Master wallet login without referral using owner-approved signature on the actual device; never request seed/private key.
8. Test mobile Chrome deep links, wallet callback, and i18n; verify financial controls remain disabled.
9. Verify rate limits and database backup/restore, then release only Staking after all gates pass.

Status: source prepared; no runtime deployment or QC yet. VM was unreachable during implementation.
