(() => {
  if (document.body.classList.contains("ath-public-loaded")) return;
  document.body.classList.add("ath-public-loaded");

  if (!document.querySelector('link[href="/ath-info.css"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/ath-info.css";
    document.head.appendChild(link);
  }

  const nav = document.querySelector(".main-nav");
  if (nav) {
    [...nav.querySelectorAll("a")].forEach((a) => {
      if (["Buy ATH", "Leaderboard"].includes(a.textContent.trim())) a.remove();
    });
    const docs = [...nav.querySelectorAll("a")].find((a) => a.getAttribute("href") === "#docs");
    for (const [label, href] of [["Whitepaper", "#whitepaper"], ["Roadmap", "#roadmap"], ["Developers", "#developers"]]) {
      if (!nav.querySelector(`a[href="${href}"]`)) {
        const a = document.createElement("a");
        a.href = href;
        a.textContent = label;
        nav.insertBefore(a, docs || null);
      }
    }
  }

  const heroButtons = document.querySelector(".hero-buttons");
  if (heroButtons && !heroButtons.querySelector('a[href="/ATH-Whitepaper-v1.1.pdf"]')) {
    const legacy = heroButtons.querySelector('a[href="/ATH-Whitepaper-v1.0.pdf"]');
    if (legacy) legacy.remove();
    const a = document.createElement("a");
    a.className = "btn btn-dark btn-large";
    a.href = "/ATH-Whitepaper-v1.1.pdf";
    a.innerHTML = "↓ &nbsp; Whitepaper";
    heroButtons.appendChild(a);
  }

  const docs = document.getElementById("docs");
  if (!docs || document.getElementById("whitepaper")) return;

  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <section id="whitepaper" class="shell content-section">
      <div class="whitepaper-panel">
        <div class="whitepaper-copy">
          <span class="section-kicker">ATH TOKEN DOCUMENTATION</span>
          <h2>Whitepaper v1.1</h2>
          <p>The public ATH whitepaper documents Mining Protocol v3.3: fixed supply, 00:05 UTC daily rewards, Power and Double Power Boosters, recurring 12-cycle vesting with burn, security controls, Testnet gates, and the path toward a gated production launch.</p>
          <div class="whitepaper-actions">
            <a class="btn btn-gold" href="/ATH-Whitepaper-v1.1.pdf">↓ &nbsp; Download Whitepaper PDF</a>
            <a class="btn btn-dark" href="#roadmap">View Roadmap</a>
          </div>
          <small class="doc-note">ATH's protocol display price is an internal contract metric. It is not a market-price guarantee, investment return, or listing promise.</small>
        </div>
        <div class="whitepaper-metrics">
          <div class="doc-metric"><span>Total Supply</span><strong>1B ATH</strong><small>Fixed supply · no post-deploy mint</small></div>
          <div class="doc-metric"><span>Mining Reserve</span><strong>70%</strong><small>700,000,000 ATH</small></div>
          <div class="doc-metric"><span>Liquidity Reserve</span><strong>20%</strong><small>200,000,000 ATH</small></div>
          <div class="doc-metric"><span>Team / Dev</span><strong>5%</strong><small>365-day lock</small></div>
          <div class="doc-metric"><span>Marketing</span><strong>5%</strong><small>50,000,000 ATH</small></div>
        </div>
      </div>
    </section>

    <section id="roadmap" class="shell content-section">
      <div class="section-head">
        <span class="section-kicker">BUILD WITH GATES, NOT PROMISES</span>
        <h2>ATH Roadmap</h2>
        <p>Milestones are labeled by actual implementation status. Mainnet remains fail-closed until the required security and liquidity gates are complete.</p>
      </div>
      <div class="roadmap-grid">
        <article class="roadmap-card"><span class="roadmap-status complete">COMPLETE</span><b>01</b><h3>Protocol Foundation</h3><p>Fixed 1B ATH supply, UTC daily rewards, referral logic, Power/Double Power Boosters, 12-cycle vesting, burn, and reserve protection.</p></article>
        <article class="roadmap-card"><span class="roadmap-status complete">COMPLETE</span><b>02</b><h3>Validation & Interfaces</h3><p>25 automated tests, source checks, deterministic ABI fingerprints, permissionless keeper hardening, on-chain miner registry, admin controls, responsive mining interface, and release-gate documentation.</p></article>
        <article class="roadmap-card"><span class="roadmap-status next">NEXT GATE</span><b>03</b><h3>BSC Testnet Deployment</h3><p>Fund Testnet gas, deploy once, auto-run v3.3 post-deploy invariants, capture verified addresses, then test the full Power → Claim → Boosters → Vesting flow.</p></article>
        <article class="roadmap-card"><span class="roadmap-status planned">PLANNED</span><b>04</b><h3>Wallet Integration</h3><p>Freeze verified Testnet ABI/address data and connect ATH mining flows with AETHER Wallet for public testing.</p></article>
        <article class="roadmap-card"><span class="roadmap-status gated">REQUIRED</span><b>05</b><h3>Production Security</h3><p>Independent security review, production multisig, operational controls, and final release-gate evidence.</p></article>
        <article class="roadmap-card"><span class="roadmap-status gated">GATED</span><b>06</b><h3>Mainnet & Liquidity</h3><p>Mainnet activation and ATH/USDT liquidity only after audit, multisig, liquidity-lock, and explicit release approvals.</p></article>
        <article class="roadmap-card"><span class="roadmap-status future">FUTURE</span><b>07</b><h3>Ecosystem Expansion</h3><p>Community utilities, wallet distribution, broader integrations, analytics, education, and post-launch ecosystem tooling.</p></article>
      </div>
    </section>

    <section id="developers" class="shell content-section">
      <div class="section-head">
        <span class="section-kicker">PROTOCOL & CREATIVE TEAM</span>
        <h2>Developer Team</h2>
        <p>The profiles below use project aliases and illustrative portraits for public presentation. They are not presented as verified legal identities or employment credentials.</p>
      </div>
      <div class="team-grid">
        <article class="team-card"><div class="team-portrait team-photo team-photo-ethan" role="img" aria-label="Illustrative project portrait for Ethan Vale"><span>EV</span></div><span class="alias-pill">PROJECT ALIAS</span><h3>Ethan Vale</h3><strong>CEO & Product Lead</strong><p>Protocol direction, product architecture, governance gates, and long-term ecosystem coordination.</p></article>
        <article class="team-card"><div class="team-portrait team-photo team-photo-maya" role="img" aria-label="Illustrative project portrait for Maya Sterling"><span>MS</span></div><span class="alias-pill">PROJECT ALIAS</span><h3>Maya Sterling</h3><strong>CMO & Community Growth</strong><p>Community education, ecosystem communications, growth operations, and public documentation strategy.</p></article>
        <article class="team-card"><div class="team-portrait team-photo team-photo-noah" role="img" aria-label="Illustrative project portrait for Noah Kade"><span>NK</span></div><span class="alias-pill">PROJECT ALIAS</span><h3>Noah Kade</h3><strong>CTO & Protocol Engineering</strong><p>Smart-contract engineering, runtime architecture, release validation, and infrastructure reliability.</p></article>
        <article class="team-card"><div class="team-portrait team-photo team-photo-riven" role="img" aria-label="Illustrative project portrait for Riven Cross"><span>RC</span></div><span class="alias-pill">PROJECT ALIAS</span><h3>Riven Cross</h3><strong>Master Crypto / Blockchain Architect</strong><p>Token mechanics, on-chain risk controls, reserve design, blockchain integration, and protocol research.</p></article>
      </div>
    </section>
  `;

  const fragment = document.createDocumentFragment();
  [...wrap.children].forEach((el) => fragment.appendChild(el));
  docs.parentNode.insertBefore(fragment, docs);
  requestAnimationFrame(() => window.dispatchEvent(new CustomEvent("aether-language-refresh")));

  async function loadTeamPortraitSprite() {
    try {
      const parts = await Promise.all(
        Array.from({ length: 6 }, (_, i) =>
          fetch(`/team/team-sprite.${String(i).padStart(2, "0")}.txt`, { cache: "force-cache" }).then((res) => {
            if (!res.ok) throw new Error(`team portrait sprite chunk ${i} failed`);
            return res.text();
          })
        )
      );
      const base64 = parts.join("").replace(/\s+/g, "");
      document.documentElement.style.setProperty("--ath-team-sprite", `url("data:image/webp;base64,${base64}")`);
      document.body.classList.add("ath-team-photos-ready");
    } catch (err) {
      console.warn("AETHER team portraits could not be loaded.", err);
    }
  }

  loadTeamPortraitSprite();
})();