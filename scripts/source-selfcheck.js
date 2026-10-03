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
const priceRegistry = read("contracts/ATHPriceRegistry.sol");
const presale = read("contracts/ATHPresale.sol");
const staking = read("contracts/ATHStaking.sol");
const stakingOracle = read("contracts/ATHStakingPriceOracle.sol");
const developmentVesting = read("contracts/ATHDevelopmentVesting.sol");
const deploy = read("scripts/deploy.js");
const preflight = read("scripts/preflight.js");
const env = read(".env.example");
const miningWeb = read("mining-web/public/app.js");
const presaleWeb = read("mining-web/public/presale.js");
const presaleI18n = read("mining-web/public/presale-i18n.js");
const stakingWeb = read("mining-web/public/staking.js");
const adminWeb = read("mining-web/public/admin.js");
const adminHtml = read("mining-web/public/admin.html");
const portalHtml = read("mining-web/public/index.html");
const webServer = read("mining-web/server.js");

must(token, /TOTAL_SUPPLY\s*=\s*1_000_000_000\s*\*\s*10\s*\*\*\s*18/, "ATH fixed supply is 1,000,000,000");
must(token, /ERC20\("Aether",\s*"ATH"\)/, "token identity Aether / ATH");
if (/function\s+mint\s*\(/.test(token)) {
  throw new Error("SELF-CHECK FAILED: unexpected mint() function found");
}
console.log("OK: no post-deployment mint() function");

// Mining v3.3 is locked. These checks intentionally remain unchanged.
must(mining, /POWER_PRICE\s*=\s*0\.001 ether/, "Mining lock: Power price is 0.001 BNB");
must(mining, /powerBoosterPrice\s*=\s*0\.001 ether/, "Mining lock: Power Booster default price is 0.001 BNB");
must(mining, /doublePowerBoosterPrice\s*=\s*0\.001 ether/, "Mining lock: Double Power Booster default price is 0.001 BNB");
must(mining, /BASE_REWARD\s*=\s*10 ether/, "Mining rule: base reward is 10 ATH");
must(mining, /MAX_DAYS\s*=\s*180/, "Mining lock: window is 180 days");
must(mining, /MINING_POOL_ALLOCATION\s*=\s*700_000_000 ether/, "Mining lock: allocation is 700,000,000 ATH");
must(mining, /PCT_30\s*=\s*10/, "Mining lock: 30d vesting tranche is 10%");
must(mining, /PCT_60\s*=\s*5/, "Mining lock: 60d vesting tranche is 5%");
must(mining, /PCT_90\s*=\s*5/, "Mining lock: 90d vesting tranche is 5%");
must(mining, /PCT_180\s*=\s*80/, "Mining lock: 180d vesting tranche is 80%");
must(mining, /BOOSTER_HASH\s*=\s*100/, "Mining lock: booster adds 100 Hash");
must(mining, /TWO_X\s*=\s*20_000/, "Mining lock: Power Booster multiplier is 2x");
must(mining, /SIX_X\s*=\s*60_000/, "Mining lock: Double Power total factor is 6x");
must(mining, /BOOSTER_DURATION\s*=\s*30 days/, "Mining lock: Power Booster duration is 30 days");
must(mining, /DOUBLE_POWER_MIN_REFERRALS\s*=\s*5/, "Mining lock: Double Power requires 5 referrals");
must(mining, /CLAIM_OPEN_OFFSET\s*=\s*5 minutes/, "Mining lock: daily reward opens at 00:05 UTC");
must(mining, /MAX_VESTING_CYCLES\s*=\s*12/, "Mining lock: recurring vesting has 12 cycles");
must(mining, /CYCLE_BURN_PCT\s*=\s*10/, "Mining lock: cycle burn is 10%");
must(mining, /FINAL_BURN_PCT\s*=\s*60/, "Mining lock: final burn is 60%");
must(mining, /MAX_KEEPER_BATCH\s*=\s*50/, "Mining lock: keeper batch cap is 50");
must(mining, /MAX_MINER_PAGE\s*=\s*200/, "Mining lock: miner page cap is 200");
must(mining, /miners\.push\(msg\.sender\)/, "Mining lock: miner registry remains present");
must(mining, /function getMiners/, "Mining lock: paginated miner getter remains present");
must(mining, /function snapshotDailyRewards/, "Mining lock: reward snapshot remains present");
must(mining, /function expireDailyRewards/, "Mining lock: reward expiry remains present");
must(mining, /event RewardCalculated/, "Mining lock: RewardCalculated remains present");
must(mining, /event RewardClaimed/, "Mining lock: RewardClaimed remains present");
must(mining, /event RewardExpired/, "Mining lock: RewardExpired remains present");
must(mining, /event VestingCycleEntered/, "Mining lock: VestingCycleEntered remains present");
must(mining, /event ATHBurned/, "Mining lock: ATHBurned remains present");
must(mining, /event VestingFinalSettled/, "Mining lock: VestingFinalSettled remains present");
must(mining, /function setBoosterPrices[\s\S]*external onlyOwner/, "Mining lock: booster prices remain owner-controlled");
must(mining, /function processVestingPosition[\s\S]*require\(msg\.sender == account, "Holder only"\)/, "Mining gas policy: explicit vesting processing is holder-paid");

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
  if (!mining.includes(expected)) throw new Error("SELF-CHECK FAILED: Mining referral tier missing: " + expected);
}
console.log("OK: Mining referral tiers +10% through +50% remain locked");

// Staking v1 is a separate module.
must(staking, /STAKING_ECOSYSTEM_ALLOCATION\s*=\s*300_000_000 ether/, "Staking allocation is 300,000,000 ATH");
must(staking, /MAX_REWARD_POOL\s*=\s*160_000_000 ether/, "Staking reward pool is capped at 160,000,000 ATH");
must(staking, /MIN_STAKE_USDT\s*=\s*10 ether/, "Staking minimum is $10 USDT");
must(staking, /REFERRAL_BPS\s*=\s*1_000/, "Staking direct referral is 10%");
must(staking, /uint256\[10\] public networkRates\s*=\s*\[800, 500, 300, 200, 100, 50, 50, 50, 50, 50\]/, "Staking network reward has 10 configured levels");
must(staking, /_addPackage\(10 ether, 99 ether, 35, 180\)/, "Staking Starter package is configured");
must(staking, /_addPackage\(100 ether, 499 ether, 45, 180\)/, "Staking Basic package is configured");
must(staking, /_addPackage\(500 ether, 1_999 ether, 55, 365\)/, "Staking Silver package is configured");
must(staking, /_addPackage\(2_000 ether, 9_999 ether, 65, 365\)/, "Staking Gold package is configured");
must(staking, /_addPackage\(10_000 ether, 49_999 ether, 75, 730\)/, "Staking Platinum package is configured");
must(staking, /_addPackage\(50_000 ether, type\(uint256\)\.max, 85, 730\)/, "Staking Diamond package is configured");
must(staking, /principalLiabilityATH/, "Staking protects principal liability");
must(staking, /rewardReserveATH/, "Staking separates reward reserve");
must(staking, /recoverExcessATH[\s\S]*onlyOwner whenPaused/, "Staking excess recovery is owner-only and pause-gated");

must(priceRegistry, /PRE_LISTING_PRICE\s*=\s*37_000_000/, "ATH pre-listing reference price is fixed at $0.37");
must(priceRegistry, /HOLDER_TARGET\s*=\s*15_000/, "ATH official listing holder target is 15,000");
must(priceRegistry, /function getMarketPrice\(\) external view/, "DEX market price can be viewed separately before listing");
must(priceRegistry, /recordedHolderCount >= HOLDER_TARGET/, "Official listing requires the holder gate");
must(priceRegistry, /officialListingActivated = true/, "Official listing transition is explicit and on-chain");
must(presale, /START_PRICE_USD8\s*=\s*7_000_000/, "Presale opens at $0.07");
must(presale, /PRICE_STEP_USD8\s*=\s*100_000/, "Presale rises $0.001 per price step");
must(presale, /FINAL_PRICE_USD8\s*=\s*37_000_000/, "Presale sell-out price is $0.37");
must(presale, /STEP_SIZE_ATH\s*=\s*100_000 ether/, "Presale advances every 100,000 ATH sold");
must(presale, /SALE_ALLOCATION_ATH\s*=\s*30_000_000 ether/, "Presale allocation is exactly 30,000,000 ATH");
must(presale, /TOTAL_PRICE_STEPS\s*=\s*300/, "Presale curve has exactly 300 price steps");
must(presale, /paymentAmount <= maxPaymentAmount/, "Presale includes buyer max-payment protection");
must(presale, /_pause\(\)/, "Presale deploys fail-closed in PAUSED state");
must(presale, /protected presale reserve/, "Presale protects unsold ATH reserve");
must(mining, /IATHPriceRegistrySource public immutable priceRegistry/, "Mining reads the unified ATH price registry");
must(mining, /priceRegistry\.getPrice\(\) \/ 100/, "Mining compatibility price mirrors the unified registry");
must(stakingOracle, /priceRegistry/, "Staking oracle uses the unified ATH price registry");
must(stakingOracle, /return priceRegistry\.getPrice\(\)/, "Staking reads the same official ATH price");
must(miningWeb, /10 ATH × referral × booster/, "Mining frontend uses the 10 ATH base reward");
must(portalHtml, /id="buy-ath"/, "Unified portal exposes the on-chain Presale storefront");
must(portalHtml, /id="staking"/, "Unified portal exposes the Staking section");
must(presaleWeb, /quotePaymentForATH/, "Presale storefront reads contract-native quotes");
must(presaleWeb, /payment\.approve\(cfg\.presaleAddress, maxPayment\)/, "Presale storefront performs holder-signed payment approval");
must(presaleWeb, /presale\.buyATH\(amount, maxPayment\)/, "Presale storefront executes direct on-chain ATH purchase");
must(presaleWeb, /const maxPayment = freshQuote;/, "Presale storefront uses the exact current quote as max payment");
must(presaleWeb, /Network gas is paid by the holder/, "Presale storefront discloses holder-paid gas");
must(presaleI18n, /"Buy ATH Directly On-chain"/, "Presale storefront has dedicated multilingual translation coverage");
must(adminHtml, /Open Presale/, "Control Panel exposes explicit Presale opening control");
must(adminWeb, /presaleWrite\.unpause\(\)/, "Control Panel opens Presale only through owner transaction");
must(adminWeb, /presaleWrite\.pause\(\)/, "Control Panel can pause Presale");
must(adminHtml, /160M[\s\S]*30M[\s\S]*50M[\s\S]*30M[\s\S]*20M[\s\S]*10M/, "Control Panel shows current 300M Staking ecosystem breakdown");
must(stakingWeb, /getATHAmount/, "Staking frontend previews ATH principal from the contract");
must(stakingWeb, /claimReward/, "Staking frontend exposes reward claiming");
must(stakingWeb, /withdrawPrincipal/, "Staking frontend exposes principal withdrawal");
must(webServer, /preListingPriceUsd: "0.37"/, "Web config exposes the $0.37 pre-listing price");
must(webServer, /listingHolderTarget: 15000/, "Web config exposes the 15,000-holder listing gate");
must(webServer, /presaleAddress: \(process\.env\.ATH_PRESALE_ADDRESS/, "Web config exposes the deployed Presale address");
must(webServer, /presalePaymentToken: \(process\.env\.PRESALE_PAYMENT_TOKEN/, "Web config exposes the Presale payment-token address");

must(developmentVesting, /TOTAL_ALLOCATION\s*=\s*30_000_000 ether/, "Development vesting allocation is 30,000,000 ATH");
must(developmentVesting, /CLIFF_MONTHS\s*=\s*2/, "Development vesting cliff is 2 months");
must(developmentVesting, /ACTIVE_VESTING_MONTHS\s*=\s*33/, "Development active vesting period is 33 months");
must(developmentVesting, /if \(activeMonths >= ACTIVE_VESTING_MONTHS\)[\s\S]*return TOTAL_ALLOCATION/, "Development vesting settles exactly 100%");

// Deployment conservation: 700M Mining + 300M Staking.
must(deploy, /parseEther\("700000000"\)/, "Deployment preserves 700M Mining allocation");
must(deploy, /parseEther\("160000000"\)/, "Deployment funds 160M Staking reward pool");
must(deploy, /parseEther\("30000000"\)/, "Deployment contains 30M Staking allocations");
must(deploy, /parseEther\("50000000"\)/, "Deployment contains 50M Staking marketing allocation");
must(deploy, /parseEther\("20000000"\)/, "Deployment contains 20M Staking liquidity allocation");
must(deploy, /parseEther\("10000000"\)/, "Deployment contains 10M Staking reserve allocation");
must(deploy, /stakingBreakdown\s*!==\s*stakingEcosystem/, "Deployment asserts 300M Staking conservation");
must(preflight, /PRESALE_WALLET/, "Preflight requires Presale treasury role");
must(preflight, /PRESALE_PAYMENT_TOKEN/, "Preflight requires Presale payment token");
must(deploy, /ATHPresale/, "Deployment includes the ATH Presale engine");
must(deploy, /token\.transfer\(presaleAddress, stakingPresale\)/, "Deployment funds the Presale contract with 30M ATH");
must(preflight, /STAKING_RESERVE_WALLET/, "Preflight requires Staking reserve role");
must(preflight, /DEVELOPMENT_BENEFICIARY/, "Preflight requires Development beneficiary role");

for (const name of [
  "PRESALE_WALLET",
  "PRESALE_PAYMENT_TOKEN",
  "MARKETING_WALLET",
  "LIQUIDITY_WALLET",
  "STAKING_RESERVE_WALLET",
  "DEVELOPMENT_BENEFICIARY",
]) {
  if (!env.includes(name + "=")) throw new Error("SELF-CHECK FAILED: missing env template " + name);
}

for (const gate of [
  "ALLOW_MAINNET_DEPLOY",
  "MAINNET_AUDIT_PASSED",
  "MAINNET_MULTISIG_CONFIRMED",
  "LIQUIDITY_LOCK_CONFIRMED",
]) {
  if (!deploy.includes(gate)) throw new Error("SELF-CHECK FAILED: missing mainnet gate " + gate);
  if (!env.includes(gate + "=false")) throw new Error("SELF-CHECK FAILED: " + gate + " must default false");
}
console.log("OK: Mainnet release gates remain fail-closed");

console.log("\nAETHER ATH Mining + Staking + Presale + unified $0.37 Price Registry self-check PASSED.");
