const PDFDocument = require("pdfkit");

const GOLD = "#d7a62c";
const GOLD_LIGHT = "#f6d778";
const BG = "#070502";
const PANEL = "#12100c";
const TEXT = "#f3ead6";
const MUTED = "#b5ad9d";

function pageBase(doc, pageNo, title) {
  doc.rect(0, 0, 595.28, 841.89).fill(BG);
  doc.rect(34, 34, 527, 773).lineWidth(0.6).strokeColor("#6d5118").stroke();
  doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(8).text("AETHER / ATH TOKEN", 50, 48);
  doc.fillColor(MUTED).font("Helvetica").fontSize(7).text(title.toUpperCase(), 50, 62);
  doc.fillColor("#7f725a").fontSize(7).text(`WHITEPAPER V1.1  |  30 SEPTEMBER 2026  |  PAGE ${pageNo}`, 50, 770, { width: 495, align: "right", lineBreak: false });
}

function heading(doc, kicker, title, y) {
  doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(8).text(kicker.toUpperCase(), 50, y);
  doc.fillColor(GOLD_LIGHT).font("Times-Roman").fontSize(27).text(title, 50, y + 16, { width: 495 });
  return doc.y + 8;
}

function body(doc, text, y, width = 495) {
  doc.fillColor(TEXT).font("Helvetica").fontSize(10).text(text, 50, y, { width, lineGap: 4 });
  return doc.y + 8;
}

function card(doc, x, y, w, h, label, value, note) {
  doc.roundedRect(x, y, w, h, 8).fillAndStroke(PANEL, "#4f3a12");
  doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(7).text(label.toUpperCase(), x + 12, y + 11, { width: w - 24 });
  doc.fillColor(GOLD_LIGHT).font("Times-Bold").fontSize(18).text(value, x + 12, y + 26, { width: w - 24 });
  doc.fillColor("#9e947f").font("Helvetica").fontSize(7).text(note, x + 12, y + 50, { width: w - 24, lineGap: 2 });
}

function bulletList(doc, items, y) {
  let cy = y;
  for (const item of items) {
    doc.fillColor(GOLD).circle(56, cy + 4, 1.6).fill();
    doc.fillColor(TEXT).font("Helvetica").fontSize(9.4).text(item, 66, cy, { width: 474, lineGap: 3 });
    cy = doc.y + 7;
  }
  return cy;
}

function streamWhitepaper(res) {
  res.writeHead(200, {
    "content-type": "application/pdf",
    "content-disposition": 'attachment; filename="ATH-Whitepaper-v1.1.pdf"',
    "cache-control": "public, max-age=3600",
    "x-content-type-options": "nosniff"
  });

  const doc = new PDFDocument({ size: "A4", margin: 50, info: {
    Title: "AETHER ATH Token Whitepaper v1.1 - Mining Protocol v3.3",
    Author: "AETHER Project",
    Subject: "ATH Token, mining protocol, tokenomics, security gates and roadmap"
  }});
  doc.pipe(res);
  pageBase(doc, 1, "Executive Summary");
  doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(9).text("THE NEXT ERA OF DECENTRALIZED VALUE", 50, 135);
  doc.fillColor(GOLD_LIGHT).font("Times-Bold").fontSize(44).text("AETHER", 50, 160);
  doc.fillColor(TEXT).font("Times-Roman").fontSize(24).text("ATH Token Whitepaper v1.1", 50, 213);
  doc.fillColor(MUTED).font("Helvetica").fontSize(11).text("Fixed-supply utility token and community mining protocol on BNB Smart Chain.", 50, 255, { width: 460, lineGap: 5 });

  card(doc, 50, 320, 116, 78, "Ticker", "ATH", "Aether ecosystem token");
  card(doc, 176, 320, 116, 78, "Supply", "1B", "Fixed at deployment");
  card(doc, 302, 320, 116, 78, "Mining", "70%", "700,000,000 ATH");
  card(doc, 428, 320, 116, 78, "Network", "BSC", "Testnet before mainnet");

  let y = heading(doc, "Executive Summary", "Purpose and Design Principles", 455);
  y = body(doc, "AETHER (ATH) is designed as a fixed-supply BEP-20 token with a gated mining and vesting system. The protocol emphasizes auditable allocation rules, wallet-side transaction signing, explicit deployment gates, reserve protection, and a staged path from Testnet validation to production.", y);
  y = bulletList(doc, [
    "No post-deployment mint function: total supply is fixed at 1,000,000,000 ATH.",
    "Mining rewards are allocated from a pre-funded reserve; the mining engine does not mint new ATH.",
    "Mainnet deployment remains fail-closed until security, multisig, and liquidity-lock gates are independently satisfied.",
    "This document describes protocol mechanics and project plans. It does not promise market price, profit, yield, exchange listing, or investment return."
  ], y + 8);

  doc.addPage();
  pageBase(doc, 2, "Token Model");
  y = heading(doc, "01 / Token Model", "Fixed Supply and Allocation", 105);
  y = body(doc, "ATH uses a one-time fixed supply. The final ecosystem split is 700,000,000 ATH for Mining and 300,000,000 ATH for the Staking ecosystem.", y);
  card(doc, 50, y + 12, 239, 88, "Mining Reserve", "700,000,000 ATH", "70% - locked Mining reward allocation");
  card(doc, 306, y + 12, 239, 88, "Staking Reward Pool", "160,000,000 ATH", "Daily Staking reward reserve only");
  card(doc, 50, y + 116, 239, 88, "Presale + Marketing/Network", "80,000,000 ATH", "30M Presale + 50M Referral, Lifestyle/Matching and Rank Salary");
  card(doc, 306, y + 116, 239, 88, "Dev + Liquidity + Reserve", "60,000,000 ATH", "30M development + 20M liquidity + 10M reserve");

  y = heading(doc, "Supply Controls", "Token Contract Properties", y + 240);
  y = bulletList(doc, [
    "Token name: Aether. Symbol: ATH. Standard: BEP-20 compatible ERC-20 implementation.",
    "TOTAL_SUPPLY constant: 1,000,000,000 ATH with 18 decimals.",
    "Supply is minted once to the initial owner during deployment.",
    "No external mint function exists after deployment.",
    "The owner can pause and unpause token transfers as an emergency control.",
    "Staking ecosystem: 160M reward pool, 30M Presale, 50M marketing, 30M development vesting, 20M liquidity and 10M ecosystem reserve.",
    "Development allocation uses a dedicated 30M vesting contract with a two-month cliff and 33 active vesting months."
  ], y);
  doc.addPage();
  pageBase(doc, 3, "Mining Protocol");
  y = heading(doc, "02 / Mining Protocol", "Power, Daily Claim and Boosters", 105);
  y = body(doc, "The ATH mining engine is a reward-allocation protocol. Users activate a 180-day mining window by purchasing Power. Each successful UTC daily claim creates its own auditable vesting position backed by the pre-funded ATH reserve.", y);

  card(doc, 50, y + 12, 153, 86, "Power", "0.001 BNB", "Activates one 180-day mining window");
  card(doc, 221, y + 12, 153, 86, "Base Reward", "10 ATH/day", "Opens 00:05 UTC; missed reward expires");
  card(doc, 392, y + 12, 153, 86, "Power Booster", "2x / 30 days", "+100 Hash; price stored on-chain");

  y = heading(doc, "Claim Logic", "Daily Allocation Rules", y + 128);
  y = bulletList(doc, [
    "Daily reward status is determined by UTC blockchain time, not the user's local device clock.",
    "Each eligible reward opens at 00:05:00 UTC and closes at 23:59:59 UTC.",
    "An unclaimed daily reward expires at the next UTC day boundary and is never backfilled.",
    "Referral state and active Booster state are snapshotted for that reward at 00:05 UTC.",
    "Permissionless batch functions can materialize RewardCalculated and RewardExpired evidence, but AETHER does not fund them as a Mainnet holder-gas subsidy.",
    "An on-chain paginated miner registry lets the keeper discover Power holders without relying on an external holder database.",
    "The 180-day Power window limits eligibility; it is not an unlimited emissions schedule.",
    "The mining reserve must be funded before claims can allocate rewards."
  ], y);

  y = heading(doc, "Protocol Reference Metric", "ATH Reference Price", y + 10);
  y = body(doc, "Before official listing, the ATH reference price follows the on-chain Presale curve. It opens at $0.070 and rises by $0.001 after each complete 100,000 ATH sold, reaching a $0.370 sold-out reference after the 30,000,000 ATH Presale allocation is exhausted. Mining and Staking read this same Presale-linked registry price. A DEX quote may be visible separately before listing; market mode still requires the 15,000-holder gate and explicit activation. The reference price is not a guaranteed redemption promise or investment-return forecast.", y);

  doc.addPage();
  pageBase(doc, 4, "Rewards and Vesting");
  y = heading(doc, "03 / Reward Design", "Referral, Boosters and Recurring Vesting", 105);
  y = body(doc, "ATH applies the referral multiplier first, then optional Booster multipliers. Every successful claim creates an independent vesting position whose locked 80% can continue through recurring on-chain cycles.", y);

  card(doc, 50, y + 12, 153, 82, "Referral Range", "+10% to +50%", "Applied before Booster multiplication");
  card(doc, 221, y + 12, 153, 82, "Power Booster", "2x / 30 days", "Adds 100 Hash; non-overlapping active period");
  card(doc, 392, y + 12, 153, 82, "Double Power", "3x on Power", "Requires 5 referrals; same Booster expiry");

  y = heading(doc, "Initial Vesting", "20% Unlock + 80% Cycle Principal", y + 124);
  card(doc, 50, y + 12, 116, 76, "Day 30", "10%", "First unlock");
  card(doc, 176, y + 12, 116, 76, "Day 60", "5%", "Second unlock");
  card(doc, 302, y + 12, 116, 76, "Day 90", "5%", "Third unlock");
  card(doc, 428, y + 12, 116, 76, "Day 180", "80%", "Enters Vesting Cycle 1");

  y = heading(doc, "Referral + Recurring Vesting", "Community Multiplier and 12-Cycle Lock", y + 118);
  y = bulletList(doc, [
    "1-5 referrals: +10%; 6-10: +15%; 11-20: +20%; 21-25: +25%.",
    "26-30 referrals: +30%; 31-35: +35%; 36-40: +40%; 41-45: +45%; 46+: +50%.",
    "At each of 12 vesting-cycle entries: 10% burns, 10% unlocks at +30d, 5% at +60d, 5% at +90d, and 70% rolls forward.",
    "After Cycle 12, the last rollover is settled 60% burn / 40% holder distribution; there is no Cycle 13.",
    "Double Power requires at least 5 referrals and applies 3x on top of an active 2x Power Booster without extending its expiry."
  ], y);
  doc.addPage();
  pageBase(doc, 5, "Staking and Network");
  y = heading(doc, "04 / Staking", "Packages, Network and Rank Salary", 105);
  y = body(doc, "ATH Staking uses USDT-denominated package values while payment and rewards settle in ATH at the current Presale-linked ATH price. Holder principal is accounted separately from the protected Staking reward reserve.", y);

  card(doc, 50, y + 12, 153, 84, "Staking Allocation", "300M ATH", "160M reward pool + ecosystem allocations");
  card(doc, 221, y + 12, 153, 84, "Direct Referral", "10%-35%", "Unified referral path; Rank totals include the 10% base");
  card(doc, 392, y + 12, 153, 84, "Rank Minimum", "5 sponsors", "Direct sponsors required for salary rank");

  y = heading(doc, "Lifestyle Bonus / Matching Staking", "10-Level Real-Time Matching", y + 126);
  y = bulletList(doc, [
    "Lifestyle Bonus / Matching Staking: Level 1 8%; Level 2 5%; Level 3 3%; Level 4 2%; Level 5 1%; Levels 6-10 0.5% each.",
    "Direct Referral is 10% total without Rank. Ranked sponsor totals are R1 13%, R2 16%, R3 19%, R4 22%, R5 25%, R6 28%, R7 31%, R8 35%, including the common 10% base.",
    "Same Rank receives no duplicate uplift and is skipped; pass-up continues upward until a higher Rank is found.",
    "Each direct sponsor creates one direct network leg.",
    "The dynamic big leg is whichever direct leg currently has the largest cumulative USDT turnover.",
    "Small-leg turnover equals total direct-leg turnover minus the single largest dynamic leg."
  ], y);

  y = heading(doc, "Rank Salary", "Weekly Protocol-Defined Qualification", y + 12);
  y = bulletList(doc, [
    "Rank 1: $1,000 small-leg / $25 weekly; Rank 2: $5,000 / $75; Rank 3: $15,000 / $200; Rank 4: $50,000 / $500.",
    "Rank 5: $100,000 / $1,000; Rank 6: $250,000 / $2,000; Rank 7: $500,000 / $5,000; Rank 8: $1,000,000 / $10,000.",
    "First salary slot is 00:30 UTC after at least seven full days from qualification; subsequent slots advance weekly.",
    "Salary is denominated in USD accounting value and converted to ATH at the current Presale-linked price at payout.",
    "Direct Referral, Rank uplift, Lifestyle Bonus / Matching Staking and lifetime Rank Salary are paid only from the protected 50M Marketing / Network Reserve. Principal and the 160M Daily Staking Reward Reserve are not used for these network payouts."
  ], y);

  doc.addPage();
  pageBase(doc, 6, "Security Architecture");
  y = heading(doc, "05 / Security", "Fail-Closed Release Architecture", 105);
  y = body(doc, "Production activation is deliberately separated from development progress. Code completion alone does not open Mainnet. Release gates require explicit evidence and operator approval.", y);

  y = bulletList(doc, [
    "Mainnet deployment gate: disabled by default.",
    "Independent audit gate: must be explicitly marked passed before production deployment.",
    "Production multisig gate: must be confirmed before Mainnet activation.",
    "Liquidity-lock gate: must be confirmed before Mainnet activation.",
    "Mining reserve protection: allocated but unclaimed vesting liabilities are protected from excess-reserve withdrawal.",
    "Administrative controls include emergency pause, treasury update, and pause-gated excess reserve recovery.",
    "Permissionless reward-transparency batch functions remain capped at 50 accounts and use an on-chain miner registry paginated at 200 accounts.",
    "AETHER does not sponsor production holder gas. Holder state-changing actions are signed by the holder wallet and paid in BNB by the holder; any keeper wallet is Testnet/audit tooling only.",
    "Browser transactions use the connected wallet for signing; private deployment keys are not embedded in the public web interface."
  ], y + 10);

  y = heading(doc, "Current Status", "Testnet Before Production", y + 14);
  card(doc, 50, y + 12, 239, 92, "Validated", "Core Engine", "Solidity compilation, automated tests, reserve controls and public interfaces");
  card(doc, 306, y + 12, 239, 92, "Next Gate", "BSC Testnet", "Fund Testnet gas, deploy once, verify addresses, then test full user flow");
  card(doc, 50, y + 120, 239, 92, "Production", "Blocked", "Mainnet remains closed until audit, multisig and liquidity-lock gates pass");
  card(doc, 306, y + 120, 239, 92, "Staking Safety", "Protected", "Principal liability is separate from reward reserve");

  doc.addPage();
  pageBase(doc, 7, "Roadmap");
  y = heading(doc, "06 / Roadmap", "Build with Gates, Not Promises", 105);
  y = body(doc, "Roadmap phases distinguish completed engineering work from future gated milestones. Future items are plans and may change after testing, security review, legal review, market conditions, or ecosystem requirements.", y);

  const phases = [
    ["01", "COMPLETE", "Protocol Foundation", "Fixed supply, UTC daily rewards, referral, Power/Double Power Boosters, 12-cycle vesting, burn and reserve protection."],
    ["02", "COMPLETE", "Validation and Interfaces", "Mining, Presale, Staking, Rank salary, source checks, automated tests, ABI fingerprints, keeper hardening and admin controls."],
    ["03", "NEXT GATE", "BSC Testnet Deployment", "After Testnet gas funding, deploy once, auto-run v3.3 post-deploy invariants, verify addresses, then test the full holder flow."],
    ["04", "PLANNED", "Wallet Integration", "Freeze verified Testnet ABI/address data and connect Mining, Presale and Staking to AETHER Wallet public testing."],
    ["05", "REQUIRED", "Production Security", "Independent audit, production multisig, operational controls and release evidence."],
    ["06", "GATED", "Mainnet and Liquidity", "Mainnet and ATH/USDT liquidity only after all production release gates are satisfied."],
    ["07", "FUTURE", "Ecosystem Expansion", "Community utilities, analytics, education, integrations and post-launch ecosystem tooling."]
  ];
  let py = y + 8;
  for (const [n, status, name, desc] of phases) {
    doc.roundedRect(50, py, 495, 64, 7).fillAndStroke(PANEL, "#4f3a12");
    doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(8).text(n, 62, py + 11);
    doc.fillColor("#9a814a").font("Helvetica-Bold").fontSize(7).text(status, 100, py + 11);
    doc.fillColor(GOLD_LIGHT).font("Times-Bold").fontSize(13).text(name, 100, py + 24, { width: 420 });
    doc.fillColor(MUTED).font("Helvetica").fontSize(7.8).text(desc, 100, py + 41, { width: 420 });
    py += 72;
  }
  doc.addPage();
  pageBase(doc, 8, "Public Project Team");
  y = heading(doc, "07 / Project Presentation", "Developer and Creative Team", 105);
  y = body(doc, "The public landing page uses project aliases and illustrative portraits for presentation. These names are not represented as verified legal identities, employment histories, or third-party credentials.", y);

  const team = [
    ["Ethan Vale", "CEO and Product Lead", "Protocol direction, product architecture, governance gates and ecosystem coordination."],
    ["Maya Sterling", "CMO and Community Growth", "Community education, ecosystem communications, growth operations and documentation strategy."],
    ["Noah Kade", "CTO and Protocol Engineering", "Smart-contract engineering, runtime architecture, release validation and infrastructure reliability."],
    ["Riven Cross", "Master Crypto / Blockchain Architect", "Token mechanics, on-chain risk controls, reserve design, blockchain integration and protocol research."]
  ];
  py = y + 16;
  for (const [name, role, desc] of team) {
    doc.roundedRect(50, py, 495, 94, 8).fillAndStroke(PANEL, "#4f3a12");
    doc.circle(88, py + 47, 25).lineWidth(2).strokeColor(GOLD).stroke();
    const initials = name.split(" ").map(x => x[0]).join("");
    doc.fillColor(GOLD_LIGHT).font("Times-Bold").fontSize(16).text(initials, 68, py + 38, { width: 40, align: "center" });
    doc.fillColor("#9a814a").font("Helvetica-Bold").fontSize(7).text("PROJECT ALIAS", 128, py + 14);
    doc.fillColor(GOLD_LIGHT).font("Times-Bold").fontSize(16).text(name, 128, py + 27);
    doc.fillColor(TEXT).font("Helvetica-Bold").fontSize(8).text(role, 128, py + 48);
    doc.fillColor(MUTED).font("Helvetica").fontSize(7.6).text(desc, 128, py + 63, { width: 390, lineGap: 2 });
    py += 106;
  }

  y = heading(doc, "Risk Notice", "Important Information", 660);
  body(doc, "ATH is an experimental crypto protocol under staged development. Participation in blockchain systems can involve smart-contract, wallet, network, liquidity, market, regulatory and operational risks. Nothing in this document is financial, investment, tax, or legal advice. Users should independently verify contract addresses and understand the applicable risks before interacting with any deployed system.", y);

  doc.end();
}

module.exports = { streamWhitepaper };