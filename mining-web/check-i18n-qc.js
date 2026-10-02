const fs = require("fs");
const vm = require("vm");
const path = require("path");

const ROOT = __dirname;
const files = [
  ["public/i18n.js", "R"],
  ["public/i18n-runtime.js", "D"],
  ["public/i18n-bridge.js", "X"],
  ["public/i18n-static-complete.js", "X"],
  ["public/i18n-icons.js", "X"],
];
const LANGS = ["id","zh","es","ar","ru","ko","ja","vi","pt"];

function extractObject(src, varName) {
  const token = `const ${varName}={`;
  const start = src.indexOf(token);
  if (start < 0) throw new Error(`Missing ${varName} dictionary`);
  let i = start + token.length - 1;
  let depth = 0, quote = null, esc = false;
  for (; i < src.length; i++) {
    const ch = src[i];
    if (quote) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`") { quote = ch; continue; }
    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) {
        const literal = src.slice(start + token.length - 1, i + 1);
        return vm.runInNewContext("(" + literal + ")", Object.create(null), { timeout: 1000 });
      }
    }
  }
  throw new Error(`Unclosed ${varName} dictionary`);
}

function has(rx, s) { return rx.test(String(s)); }
function assertScript(lang, key, val, file) {
  const s = String(val);
  const arabic=/[\u0600-\u06FF]/, cyr=/[\u0400-\u04FF]/, hangul=/[\uAC00-\uD7AF]/, kana=/[\u3040-\u30FF]/, cjk=/[\u4E00-\u9FFF]/;
  let bad = false;
  if (["id","es","vi","pt"].includes(lang)) bad = has(arabic,s)||has(cyr,s)||has(hangul,s)||has(kana,s)||has(cjk,s);
  if (lang==="zh") bad = has(arabic,s)||has(cyr,s)||has(hangul,s)||has(kana,s);
  if (lang==="ar") bad = has(cyr,s)||has(hangul,s)||has(kana,s)||has(cjk,s);
  if (lang==="ru") bad = has(arabic,s)||has(hangul,s)||has(kana,s)||has(cjk,s);
  if (lang==="ko") bad = has(arabic,s)||has(cyr,s)||has(kana,s);
  if (lang==="ja") bad = has(arabic,s)||has(cyr,s)||has(hangul,s);
  if (lang==="id" && /[ăâđêôơưĂÂĐÊÔƠƯ]/.test(s)) bad = true;
  if (bad) throw new Error(`${file}: foreign script detected in ${lang} for key "${key}": ${s}`);
}

const dictionaries = {};
for (const [file, varName] of files) {
  const src = fs.readFileSync(path.join(ROOT, file), "utf8");
  const dict = extractObject(src, varName);
  dictionaries[file] = dict;
  for (const [key, values] of Object.entries(dict)) {
    if (!Array.isArray(values)) throw new Error(`${file}: "${key}" is not an array`);
    if (values.length !== LANGS.length) throw new Error(`${file}: "${key}" has ${values.length} translations; expected ${LANGS.length}`);
    values.forEach((v, i) => {
      if (typeof v !== "string" || !v.trim()) throw new Error(`${file}: empty ${LANGS[i]} translation for "${key}"`);
      assertScript(LANGS[i], key, v, file);
    });
  }
}

const requiredPublicKeys = [
  "Whitepaper v1.1",
  "The public ATH whitepaper documents Mining Protocol v3.3: fixed supply, 00:05 UTC daily rewards, Power and Double Power Boosters, recurring 12-cycle vesting with burn, security controls, Testnet gates, and the path toward a gated production launch.",
  "ATH's protocol display price is an internal contract metric. It is not a market-price guarantee, investment return, or listing promise.",
  "Milestones are labeled by actual implementation status. Mainnet remains fail-closed until the required security and liquidity gates are complete.",
  "Fixed 1B ATH supply, UTC daily rewards, referral logic, Power/Double Power Boosters, 12-cycle vesting, burn, and reserve protection.",
  "25 automated tests, source checks, deterministic ABI fingerprints, permissionless keeper hardening, on-chain miner registry, admin controls, responsive mining interface, and release-gate documentation.",
  "Fund Testnet gas, deploy once, auto-run v3.3 post-deploy invariants, capture verified addresses, then test the full Power → Claim → Boosters → Vesting flow.",
  "Freeze verified Testnet ABI/address data and connect ATH mining flows with AETHER Wallet for public testing.",
  "Independent security review, production multisig, operational controls, and final release-gate evidence.",
  "Mainnet activation and ATH/USDT liquidity only after audit, multisig, liquidity-lock, and explicit release approvals.",
  "Community utilities, wallet distribution, broader integrations, analytics, education, and post-launch ecosystem tooling.",
  "The profiles below use project aliases and illustrative portraits for public presentation. They are not presented as verified legal identities or employment credentials.",
  "PROJECT ALIAS",
  "CEO & Product Lead",
  "CMO & Community Growth",
  "CTO & Protocol Engineering",
  "Master Crypto / Blockchain Architect"
];
const main = dictionaries["public/i18n.js"];
for (const key of requiredPublicKeys) {
  if (!main[key]) throw new Error(`public/i18n.js: missing required public translation key: ${key}`);
}

console.log(`i18n QC passed: ${Object.values(dictionaries).reduce((n,d)=>n+Object.keys(d).length,0)} keys across 9 translated languages + English.`);
