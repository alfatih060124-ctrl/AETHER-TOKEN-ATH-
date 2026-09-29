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
  doc.fillColor("#7f725a").fontSize(7).text(`WHITEPAPER V1.0  |  29 SEPTEMBER 2026  |  PAGE ${pageNo}`, 50, 770, { width: 495, align: "right", lineBreak: false });
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
    "content-disposition": 'attachment; filename="ATH-Whitepaper-v1.0.pdf"',
    "cache-control": "public, max-age=3600",
    "x-content-type-options": "nosniff"
  });

  const doc = new PDFDocument({ size: "A4", margin: 50, info: {
    Title: "AETHER ATH Token Whitepaper v1.0",
    Author: "AETHER Project",
    Subject: "ATH Token, mining protocol, tokenomics, security gates and roadmap"
  }});
  doc.pipe(res);
  pageBase(doc, 1, "Executive Summary");
  doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(9).text("THE NEXT ERA OF DECENTRALIZED VALUE", 50, 135);
  doc.fillColor(GOLD_LIGHT).font("Times-Bold").fontSize(44).text("AETHER", 50, 160);
  doc.fillColor(TEXT).font("Times-Roman").fontSize(24).text("ATH Token Whitepaper", 50, 213);
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
  y = body(doc, "ATH uses a one-time fixed supply. Allocation policy is separated into mining, liquidity, team/development, and marketing reserves.", y);
  card(doc, 50, y + 12, 239, 88, "Mining Reserve", "700,000,000 ATH", "70% - reward reserve for the mining protocol");
  card(doc, 306, y + 12, 239, 88, "Liquidity Reserve", "200,000,000 ATH", "20% - reserved for later ATH/USDT liquidity decisions");
  card(doc, 50, y + 116, 239, 88, "Team and Development", "50,000,000 ATH", "5% - locked for 365 days under the current policy");
  card(doc, 306, y + 116, 239, 88, "Marketing", "50,000,000 ATH", "5% - ecosystem communication and promotion allocation");

  y = heading(doc, "Supply Controls", "Token Contract Properties", y + 240);
  y = bulletList(doc, [
    "Token name: Aether. Symbol: ATH. Standard: BEP-20 compatible ERC-20 implementation.",
    "TOTAL_SUPPLY constant: 1,000,000,000 ATH with 18 decimals.",
    "Supply is minted once to the initial owner during deployment.",
    "No external mint function exists after deployment.",
    "The owner can pause and unpause token transfers as an emergency control.",
    "Team allocation uses a dedicated lock contract with a 365-day release policy."
  ], y);
  doc.addPage();
  pageBase(doc, 3, "Mining Protocol");
  y = heading(doc, "02 / Mining Protocol", "Power, Daily Claim and Booster", 105);
  y = body(doc, "The ATH mining engine is a reward-allocation protocol. Users activate a 180-day mining window by purchasing Power. Each successful daily claim creates a vesting position backed by the pre-funded ATH reserve.", y);

  card(doc, 50, y + 12, 153, 86, "Power", "0.001 BNB", "Activates one 180-day mining window");
  card(doc, 221, y + 12, 153, 86, "Base Reward", "1 ATH/day", "Claim must be made for the current mining day");
  card(doc, 392, y + 12, 153, 86, "Booster", "0.001 BNB", "+100 Hash and reward multiplier up to 2x");

  y = heading(doc, "Claim Logic", "Daily Allocation Rules", y + 128);
  y = bulletList(doc, [
    "A mining day is calculated from the user's Power activation timestamp.",
    "A user can claim once for the current eligible mining day.",
    "Missed daily claims are not backfilled by the contract.",
    "The 180-day window limits eligibility; it is not an unlimited emissions schedule.",
    "The mining reserve must be funded before claims can allocate rewards.",
    "Allocated rewards become vesting positions and can only be transferred when their vesting tranches unlock."
  ], y);

  y = heading(doc, "Protocol Display Metric", "ATH Display Price Formula", y + 10);
  y = body(doc, "The mining contract exposes a protocol display metric beginning at $3.000 and adding $0.001 for each 10,000 whole ATH allocated by successful mining claims. This is an internal protocol metric only. It is not an exchange quote, guaranteed sale price, valuation, redemption promise, or investment-return forecast.", y);

  doc.addPage();
  pageBase(doc, 4, "Rewards and Vesting");
  y = heading(doc, "03 / Reward Design", "Referral, Booster and Vesting", 105);
  y = body(doc, "ATH combines a capped referral multiplier with a capped Booster multiplier. Reward allocations then follow a four-stage vesting schedule.", y);

  card(doc, 50, y + 12, 153, 82, "Referral Range", "+10% to +50%", "Based on active referred users that purchased Power");
  card(doc, 221, y + 12, 153, 82, "Booster Cap", "2.00x", "Repeated Booster purchases add Hash but do not stack x2 repeatedly");
  card(doc, 392, y + 12, 153, 82, "Mining Window", "180 days", "Per Power activation");

  y = heading(doc, "Vesting Schedule", "Four Unlock Tranches", y + 124);
  card(doc, 50, y + 12, 116, 76, "Day 30", "10%", "First unlock");
  card(doc, 176, y + 12, 116, 76, "Day 60", "5%", "Second unlock");
  card(doc, 302, y + 12, 116, 76, "Day 90", "5%", "Third unlock");
  card(doc, 428, y + 12, 116, 76, "Day 180", "80%", "Final unlock");

  y = heading(doc, "Referral Tiers", "Community Multiplier", y + 118);
  y = bulletList(doc, [
    "1-5 referrals: +10%; 6-10: +15%; 11-20: +20%; 21-25: +25%.",
    "26-30 referrals: +30%; 31-35: +35%; 36-40: +40%; 41-45: +45%.",
    "46 or more qualifying referrals: +50% maximum referral bonus.",
    "The protocol prevents self-referral. Referral accounting is on-chain after Power activation."
  ], y);
  doc.addPage();
  pageBase(doc, 5, "Security Architecture");
  y = heading(doc, "04 / Security", "Fail-Closed Release Architecture", 105);
  y = body(doc, "Production activation is deliberately separated from development progress. Code completion alone does not open Mainnet. Release gates require explicit evidence and operator approval.", y);

  y = bulletList(doc, [
    "Mainnet deployment gate: disabled by default.",
    "Independent audit gate: must be explicitly marked passed before production deployment.",
    "Production multisig gate: must be confirmed before Mainnet activation.",
    "Liquidity-lock gate: must be confirmed before Mainnet activation.",
    "Mining reserve protection: allocated but unclaimed vesting liabilities are protected from excess-reserve withdrawal.",
    "Administrative controls include emergency pause, treasury update, and pause-gated excess reserve recovery.",
    "Browser transactions use the connected wallet for signing; private deployment keys are not embedded in the public web interface."
  ], y + 10);

  y = heading(doc, "Current Status", "Testnet Before Production", y + 14);
  card(doc, 50, y + 12, 239, 92, "Validated", "Core Engine", "Solidity compilation, automated tests, reserve controls and public interfaces");
  card(doc, 306, y + 12, 239, 92, "Next Gate", "BSC Testnet", "Fund Testnet gas, deploy once, verify addresses, then test full user flow");
  card(doc, 50, y + 120, 239, 92, "Production", "Blocked", "Mainnet remains closed until audit, multisig and liquidity-lock gates pass");
  card(doc, 306, y + 120, 239, 92, "Team Lock", "365 days", "Current locked Team and Development policy");

  doc.addPage();
  pageBase(doc, 6, "Roadmap");
  y = heading(doc, "05 / Roadmap", "Build with Gates, Not Promises", 105);
  y = body(doc, "Roadmap phases distinguish completed engineering work from future gated milestones. Future items are plans and may change after testing, security review, legal review, market conditions, or ecosystem requirements.", y);

  const phases = [
    ["01", "COMPLETE", "Protocol Foundation", "Fixed supply, MiningAirdrop engine, referral, Booster, vesting and reserve protection."],
    ["02", "COMPLETE", "Validation and Interfaces", "Automated tests, source checks, admin controls, responsive web interface and release-gate documentation."],
    ["03", "NEXT GATE", "BSC Testnet Deployment", "Deploy once after Testnet gas funding, capture verified addresses and test Power -> Claim -> Booster -> Vesting."],
    ["04", "PLANNED", "Wallet Integration", "Freeze verified Testnet ABI/address data and connect ATH mining to AETHER Wallet public testing."],
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
  pageBase(doc, 7, "Public Project Team");
  y = heading(doc, "06 / Project Presentation", "Developer and Creative Team", 105);
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