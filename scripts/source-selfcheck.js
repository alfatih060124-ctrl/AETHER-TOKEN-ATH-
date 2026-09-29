const fs = require("fs");

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function must(text, pattern, label) {
  if (!pattern.test(text)) throw new Error("SELF-CHECK FAILED: " + label);
  console.log("OK:", label);
}

const token = read("contracts/ATHToken.sol");
const mining = read("contracts/MiningAirdrop.sol");
const deploy = read("scripts/deploy.js");
const preflight = read("scripts/preflight.js");
const env = read(".env.example");

must(token, /TOTAL_SUPPLY\s*=\s*1_000_000_000\s*\*\s*10\s*\*\*\s*18/, "ATH fixed supply is 1,000,000,000");
must(token, /ERC20\("Aether",\s*"ATH"\)/, "token identity Aether / ATH");
if (/function\s+mint\s*\(/.test(token)) {
  throw new Error("SELF-CHECK FAILED: unexpected mint() function found");
}
console.log("OK: no post-deployment mint() function");

must(mining, /POWER_PRICE\s*=\s*0\.001 ether/, "Power price is 0.001 BNB");
must(mining, /BOOSTER_PRICE\s*=\s*0\.001 ether/, "Booster price is 0.001 BNB");
must(mining, /BASE_REWARD\s*=\s*1 ether/, "base reward is 1 ATH");
must(mining, /MAX_DAYS\s*=\s*180/, "mining window is 180 days");
must(mining, /MINING_POOL_ALLOCATION\s*=\s*700_000_000 ether/, "mining allocation is 700,000,000 ATH");
must(mining, /PCT_30\s*=\s*10/, "30d vesting tranche is 10%");
must(mining, /PCT_60\s*=\s*5/, "60d vesting tranche is 5%");
must(mining, /PCT_90\s*=\s*5/, "90d vesting tranche is 5%");
must(mining, /PCT_180\s*=\s*80/, "180d vesting tranche is 80%");
must(mining, /BOOSTER_HASH\s*=\s*100/, "booster adds 100 Hash");
must(mining, /TWO_X\s*=\s*20_000/, "booster reward multiplier is capped at 2x");

for (const expected of [
  "if (count >= 46) return 15_000",
  "if (count >= 41) return 14_500",
  "if (count >= 36) return 14_000",
  "if (count >= 31) return 13_500",
  "if (count >= 26) return 13_000",
  "if (count >= 21) return 12_500",
  "if (count >= 11) return 12_000",
  "if (count >= 6) return 11_500",
  "if (count >= 1) return 11_000",
]) {
  if (!mining.includes(expected)) throw new Error("SELF-CHECK FAILED: referral tier missing: " + expected);
}
console.log("OK: referral tiers +10% through +50% are present");

must(deploy, /teamLockDays\s*!==\s*365/, "deployment fixes Team & Dev lock to 365 days");
must(preflight, /teamLockDays\s*!==\s*365/, "preflight fixes Team & Dev lock to 365 days");
must(env, /TEAM_LOCK_DAYS=365/, "default Team & Dev lock is 365 days");

must(mining, /3_000_000\s*\+\s*\(steps\s*\*\s*1_000\)/, "display-price formula starts at $3.00 and adds $0.001/10,000 ATH");
must(mining, /setTreasury\(address _treasury\) external onlyOwner/, "treasury update is owner-only");
must(mining, /withdrawExcessATH\(address to, uint256 amount\) external onlyOwner whenPaused/, "reserve withdrawal is owner-only and pause-gated");

for (const gate of [
  "ALLOW_MAINNET_DEPLOY",
  "MAINNET_AUDIT_PASSED",
  "MAINNET_MULTISIG_CONFIRMED",
  "LIQUIDITY_LOCK_CONFIRMED",
]) {
  if (!deploy.includes(gate)) throw new Error("SELF-CHECK FAILED: missing mainnet gate " + gate);
  if (!env.includes(gate + "=false")) throw new Error("SELF-CHECK FAILED: " + gate + " must default false");
}
console.log("OK: mainnet release gates are fail-closed");

console.log("\nAETHER ATH source self-check PASSED.");
