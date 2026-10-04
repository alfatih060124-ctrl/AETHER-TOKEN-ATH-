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
const rankKeeper = read("scripts/rank-salary-keeper.js");
const stakingRewardKeeper = read("scripts/staking-reward-keeper.js");
const deploy = read("scripts/deploy.js");
const preflight = read("scripts/preflight.js");
const nonBnbReadiness = read("scripts/nonbnb-readiness.js");
const runtimeSecurityAudit = read("scripts/runtime-security-audit.js");
const env = read(".env.example");
const miningWeb = read("mining-web/public/app.js");
const holderWorkspaceWeb = read("mining-web/public/holder-workspace.js");
const presaleWeb = read("mining-web/public/presale.js");
const presaleI18n = read("mining-web/public/presale-i18n.js");
const stakingWeb = read("mining-web/public/staking.js");
const adminWeb = read("mining-web/public/admin.js");
const adminLoginHtml = read("mining-web/public/admin-login.html");
const adminLoginWeb = read("mining-web/public/admin-login.js");
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
must(staking, /rewardReserveATH/, "Staking separates daily reward reserve");
must(staking, /MAX_NETWORK_MARKETING_POOL\s*=\s*50_000_000 ether/, "Networking bonuses are capped by the 50M Marketing allocation");
must(staking, /networkReserveATH/, "Staking separates the Marketing/network bonus reserve");
must(staking, /function fundNetworkReserve\(/, "Staking exposes owner-only Marketing/network reserve funding");
must(staking, /totalNetworkFundedATH/, "Staking records cumulative Marketing/network reserve funding");
must(staking, /recoverExcessATH[\s\S]*onlyOwner whenPaused/, "Staking excess recovery is owner-only and pause-gated");
must(staking, /MIN_DIRECT_SPONSORS_FOR_RANK\s*=\s*5/, "Rank salary requires at least 5 direct sponsors");
must(staking, /rankSmallLegThresholdUSDT\[0\]\s*=\s*1_000 ether/, "Rank 1 small-leg threshold is $1,000");
must(staking, /rankSmallLegThresholdUSDT\[7\]\s*=\s*1_000_000 ether/, "Rank 8 small-leg threshold is $1,000,000");
must(staking, /rankWeeklySalaryUSDT\[0\]\s*=\s*25 ether/, "Rank 1 salary is $25 weekly");
must(staking, /rankWeeklySalaryUSDT\[7\]\s*=\s*10_000 ether/, "Rank 8 salary is $10,000 weekly");
must(staking, /rankSponsorBonusBps\s*=\s*\[1300, 1600, 1900, 2200, 2500, 2800, 3100, 3500\]/, "Ranked Direct Referral totals are 13/16/19/22/25/28/31/35%");
must(staking, /function _payReferralAndRankPassUp\(/, "Direct Referral and Rank uplift use one unified payout path");
must(staking, /directRank == 0 \? REFERRAL_BPS : rankSponsorBonusBps\[directRank - 1\]/, "Ranked Direct Referral total replaces the base 10% rather than adding to it");
must(staking, /totalReferralPaidATH \+= directAmount/, "Direct Referral accounting records the full 10%-35% direct sponsor payment");
must(staking, /directBps > REFERRAL_BPS/, "Rank uplift is measured only above the common 10% base");
must(staking, /currentBps - paidBps/, "Pass-up pays only the differential to the next higher Rank");
must(staking, /if \(highestPaidRank > 0 && rank == highestPaidRank\)/, "Same Rank is detected in the referral pass-up path");
must(staking, /RankSponsorSameRankSkipped/, "Same Rank emits skip evidence instead of stopping the path");
must(staking, /current = userInfo\[current\]\.referrer;\s*continue;/, "Same Rank is skipped and traversal continues upward");
must(staking, /totalRankSponsorPaidATH/, "Incremental Rank uplift total is auditable");
must(staking, /rankSponsorEarnedATH/, "Incremental Rank uplift per-member earnings are auditable");
must(staking, /RankSponsorSameRankSkipped/, "Same-Rank skip emits on-chain evidence");
must(staking, /function previewReferralPassUp\(/, "Unified referral path has an auditable preview getter");
must(staking, /RANK_PAYOUT_UTC_OFFSET\s*=\s*30 minutes/, "Rank salary schedule is 00:30 UTC");
must(staking, /DAILY_REWARD_UTC_OFFSET\s*=\s*50 minutes/, "Staking daily reward schedule is 00:50 UTC");
must(staking, /function getRewardSchedule\(/, "Staking exposes the 00:50 daily reward schedule");
must(staking, /_first0050AtOrAfter/, "Staking reward settlement aligns to 00:50 UTC");
must(staking, /rewardDaysClaimed/, "Staking tracks settled daily reward slots");
must(staking, /function processDailyReward\(/, "Staking supports permissionless 00:50 reward settlement");
must(staking, /function processDailyRewardBatch\(/, "Staking supports bounded 00:50 batch settlement");
must(staking, /MAX_DAILY_REWARD_BATCH\s*=\s*50/, "Staking reward settlement batch is capped at 50");
must(staking, /function getStakingMembers\(/, "Staking exposes paginated member registry for the keeper");
must(stakingRewardKeeper, /STAKING_REWARD_KEEPER_ENABLED/, "Staking reward keeper is fail-closed");
must(stakingRewardKeeper, /00:50 UTC daily/, "Staking reward keeper targets the 00:50 UTC schedule");
must(stakingRewardKeeper, /processDailyRewardBatch/, "Staking reward keeper uses on-chain batch settlement");
must(staking, /directLegMembers/, "Staking records direct legs for Control Panel inspection");
must(staking, /function getDirectLegMembers\(/, "Control Panel can page direct-leg members");
must(staking, /activeDailyRewardRunRateUSDT/, "Staking exposes active daily reward run-rate");
must(staking, /totalWeeklyRankSalaryUSDT/, "Staking exposes lifetime weekly Rank Salary liability");
must(staking, /function rewardReserveRunwayDays\(/, "Staking exposes daily reward reserve runway");
must(staking, /function rankSalaryRunwayWeeks\(/, "Staking exposes Rank Salary reserve runway");
must(staking, /RANK_FIRST_DELAY\s*=\s*7 days/, "Rank salary first payout waits at least 7 days");
must(staking, /smallLegTurnover = totalTurnover > largestTurnover \? totalTurnover - largestTurnover : 0/, "Small-leg turnover excludes the dynamic largest leg");
must(staking, /processRankSalaryBatch/, "Rank salary supports permissionless batch processing");
must(staking, /MAX_RANK_MEMBER_PAGE\s*=\s*200/, "Rank member registry page is capped at 200");
must(staking, /function totalRankMembers\(\)/, "Rank member registry count getter is present");
must(staking, /function getRankMembers\(/, "Rank member registry pagination getter is present");
must(staking, /RankSalaryPayment\[\] private rankSalaryPayments/, "Rank Salary complete on-chain history is persisted");
must(staking, /function totalRankSalaryPayments\(\)/, "Rank Salary history exposes a total count");
must(staking, /function getRankSalaryPayments\(/, "Rank Salary history is paginated");
must(staking, /MAX_RANK_HISTORY_PAGE\s*=\s*200/, "Rank Salary history page is bounded");
must(rankKeeper, /RANK_KEEPER_ENABLED/, "Rank keeper is fail-closed behind an explicit enable flag");
must(rankKeeper, /RANK_KEEPER_DRY_RUN/, "Rank keeper defaults to dry-run support");
must(rankKeeper, /00:30-00:59 UTC/, "Rank keeper enforces the 00:30 UTC schedule window");
must(rankKeeper, /totalRankMembers/, "Rank keeper reads the on-chain Rank registry");
must(staking, /networkReserveATH -= salaryATH/, "Rank salary is paid from the 50M Marketing/network reserve");
must(staking, /networkReserveATH -= directAmount/, "Unified Direct Referral is paid from the 50M Marketing/network reserve");
must(staking, /networkReserveATH -= networkTotal/, "L1-L10 Network reward is paid from the 50M Marketing/network reserve");
must(staking, /athToken\.safeTransfer\(directSponsor, directAmount\)/, "Unified Direct Referral is transferred in real time during stake");
must(staking, /athToken\.safeTransfer\(uplines\[i\], amount\)/, "L1-L10 Network Bonus is transferred in real time during reward settlement");
must(staking, /rewardReserveATH -= rewardATH/, "Daily Staking reward remains isolated to the 160M reward pool");
must(staking, /protectedBalance = principalLiabilityATH \+ rewardReserveATH \+ networkReserveATH/, "Principal, daily reward and network reserves are all protected from excess recovery");

must(priceRegistry, /PRESALE_START_PRICE\s*=\s*7_000_000/, "ATH unified price starts from Presale at $0.07");
must(priceRegistry, /PRESALE_FINAL_PRICE\s*=\s*37_000_000/, "ATH Presale-linked reference reaches $0.37 at sell-out");
must(priceRegistry, /presalePriceSource/, "ATH Price Registry is bound to the Presale price source");
must(priceRegistry, /return _readPresalePrice\(\)/, "ATH Price Registry reads Presale before official listing");
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
must(portalHtml, /id="holder-workspace"/, "Public portal exposes a clear Mining/Staking holder workspace selector");
must(portalHtml, /data-holder-view="mining"/, "Public holder workspace exposes Mining selection");
must(portalHtml, /data-holder-view="staking"/, "Public holder workspace exposes Staking selection");
must(portalHtml, /data-holder-zone="mining"/, "Mining holder operations are explicitly zoned");
must(portalHtml, /data-holder-zone="staking"/, "Staking holder operations are explicitly zoned");
must(portalHtml, /MINING HOLDER AREA/, "Public portal labels the Mining holder area");
must(portalHtml, /STAKING HOLDER AREA/, "Public portal labels the Staking holder area");
must(portalHtml, /Reward window: 00:05–23:59:59 UTC/, "Mining area shows its distinct daily reward window");
must(portalHtml, /Daily reward slot: 00:50 UTC/, "Staking area shows its distinct daily reward slot");
must(holderWorkspaceWeb, /zone\.hidden=zone\.dataset\.holderZone!==safe/, "Inactive holder engine area is hidden");
must(holderWorkspaceWeb, /localStorage\.setItem\("ath-holder-workspace"/, "Holder portal remembers Mining/Staking workspace");
must(holderWorkspaceWeb, /href="#mining"/, "Mining navigation opens the Mining workspace");
must(holderWorkspaceWeb, /href="#staking"/, "Staking navigation opens the Staking workspace");
must(portalHtml, /Mining Referral Program/, "Mining referral is explicitly labeled as Mining-only");
must(portalHtml, /Staking Direct Referral Earned/, "Staking referral earnings are explicitly labeled as Staking");
must(portalHtml, /Staking Network Earned/, "Staking network earnings are explicitly labeled as Staking");
must(presaleWeb, /quotePaymentForATH/, "Presale storefront reads contract-native quotes");
must(presaleWeb, /payment\.approve\(cfg\.presaleAddress, maxPayment\)/, "Presale storefront performs holder-signed payment approval");
must(presaleWeb, /presale\.buyATH\(amount, maxPayment\)/, "Presale storefront executes direct on-chain ATH purchase");
must(presaleWeb, /const maxPayment = freshQuote;/, "Presale storefront uses the exact current quote as max payment");
must(presaleWeb, /Network gas is paid by the holder/, "Presale storefront discloses holder-paid gas");
must(presaleI18n, /"Buy ATH Directly On-chain"/, "Presale storefront has dedicated multilingual translation coverage");
must(adminHtml, /Open Presale/, "Control Panel exposes explicit Presale opening control");
must(adminWeb, /presaleWrite\.unpause\(\)/, "Control Panel opens Presale only through owner transaction");
must(adminWeb, /presaleWrite\.pause\(\)/, "Control Panel can pause Presale");
must(adminWeb, /pauseStakingBtn[\s\S]*!stakingAuthorized\(\)\|\|state\.stakingPaused/, "Control Panel enables Staking pause only for the authorized owner");
must(adminWeb, /unpauseStakingBtn[\s\S]*!stakingAuthorized\(\)\|\|!state\.stakingPaused/, "Control Panel enables Staking unpause only for the authorized owner");
must(adminWeb, /stakingWrite\.pause\(\)/, "Control Panel executes owner-gated Staking pause");
must(adminWeb, /stakingWrite\.unpause\(\)/, "Control Panel executes owner-gated Staking unpause");
must(adminWeb, /stakingWrite\.fundRewards\(amount\)/, "Control Panel funds the 160M daily reward reserve");
must(adminWeb, /stakingWrite\.fundNetworkReserve\(amount\)/, "Control Panel funds the 50M Marketing/network reserve");
must(adminWeb, /stakingWrite\.updatePackage\(/, "Control Panel can update/activate/deactivate Staking packages");
must(adminWeb, /stakingWrite\.addPackage\(/, "Control Panel can add Staking packages");
must(adminWeb, /getRankMembers/, "Control Panel reads Rank member registry");
must(adminWeb, /getDirectLegMembers/, "Control Panel reads member leg details");
must(adminWeb, /RankSalaryPaid/, "Control Panel reads Rank Salary history");
must(adminWeb, /getRankSalaryPayments/, "Control Panel reads complete on-chain Rank Salary history");
must(adminWeb, /totalRankSalaryPayments/, "Control Panel paginates complete Rank Salary history");
must(adminWeb, /getDirectLegMembers/, "Control Panel paginates all direct network legs");
must(adminHtml, /Complete payment history/, "Control Panel labels Rank Salary history as complete");
must(adminWeb, /processRankSalary/, "Control Panel exposes due Rank payout processing");
must(adminHtml, /Reserve runway & Rank payout queue/, "Control Panel exposes reserve runway and Rank payout queue");
must(adminHtml, /00:50 UTC/, "Control Panel shows the Staking daily reward time");
must(adminHtml, /data-control-view="mining"/, "Control Panel exposes a dedicated Mining workspace");
must(adminHtml, /data-control-view="staking"/, "Control Panel exposes a dedicated Staking workspace");
must(adminHtml, /data-control-zone="mining"/, "Mining controls are isolated in Mining-only zones");
must(adminHtml, /data-control-zone="staking"/, "Staking controls are isolated in Staking-only zones");
must(adminHtml, /data-control-zone="system"/, "Token and Presale controls are isolated from both engines");
must(adminWeb, /function setControlWorkspace\(/, "Control Panel has explicit workspace switching logic");
must(adminWeb, /zone\.hidden=zone\.dataset\.controlZone!==safe/, "Inactive engine controls are hidden from the active workspace");
must(adminWeb, /localStorage\.setItem\("athAdminWorkspace"/, "Control Panel remembers the operator's selected workspace");
must(webServer, /expectedMiningAdmin: \(process\.env\.MINING_OWNER_ADDRESS/, "Web config exposes expected Mining Admin wallet");
must(webServer, /expectedStakingAdmin: \(process\.env\.STAKING_OWNER_ADDRESS/, "Web config exposes expected Staking Admin wallet");
must(webServer, /expectedPresaleAdmin: \(process\.env\.PRESALE_OWNER_ADDRESS/, "Web config exposes expected Token\/Presale Admin wallet");
must(webServer, /expectedKeeperWallet: \(process\.env\.KEEPER_WALLET_ADDRESS/, "Web config exposes expected Keeper wallet");
must(adminHtml, /id="requiredMiningAdmin"/, "Mining workspace displays its required Admin wallet");
must(adminHtml, /id="requiredStakingAdmin"/, "Staking workspace displays its required Admin wallet");
must(adminHtml, /id="requiredPresaleAdmin"/, "Token\/Presale workspace displays its required Admin wallet");
must(adminWeb, /requiredMiningAdmin/, "Control Panel binds expected Mining Admin wallet");
must(adminWeb, /requiredStakingAdmin/, "Control Panel binds expected Staking Admin wallet");
must(adminWeb, /requiredPresaleAdmin/, "Control Panel binds expected Token\/Presale Admin wallet");
must(adminLoginHtml, /Connect Wallet Mining/, "Public admin gate exposes only Mining wallet login");
must(adminLoginHtml, /Connect Wallet Staking/, "Public admin gate exposes only Staking wallet login");
must(adminLoginHtml, /Connect Wallet Presale/, "Public admin gate exposes only Presale wallet login");
must(adminLoginWeb, /signMessage\(challenge\.message\)/, "Admin login requires wallet signature");
must(adminLoginWeb, /\/api\/admin\/challenge/, "Admin login requests a one-time challenge");
must(adminLoginWeb, /\/api\/admin\/verify/, "Admin login verifies the signed challenge");
must(webServer, /ADMIN_CHALLENGE_TTL_MS\s*=\s*5 \* 60 \* 1000/, "Admin challenge expires after five minutes");
must(webServer, /ADMIN_SESSION_TTL_MS\s*=\s*30 \* 60 \* 1000/, "Admin session is time-limited");
must(webServer, /HttpOnly/, "Admin session cookie is HttpOnly");
must(webServer, /SameSite=Strict/, "Admin session cookie uses SameSite Strict");
must(webServer, /Secure/, "Admin session cookie is Secure");
must(webServer, /verifyMessage\(challenge\.message, signature\)/, "Server verifies wallet signatures");
must(webServer, /Wallet not authorized for the selected admin role/, "Server rejects the wrong wallet role");
must(webServer, /requestPath === "\/api\/admin\/config"/, "Full admin config is protected by session");
must(webServer, /controlPanelHost \? adminPublicConfig\(\) : configPayload\(\)/, "Public control-panel config is reduced");
must(webServer, /\["\/admin", "\/admin\/", "\/admin\.html", "\/admin\.js"\]\.includes\(requestPath\)/, "Admin panel files require an authenticated session");
must(adminWeb, /fetch\("\/api\/admin\/config"/, "Authenticated Control Panel loads protected config only");
must(adminWeb, /cfg\.authenticatedAddress/, "Control Panel binds signing wallet to authenticated address");
must(adminWeb, /accountsChanged[\s\S]*logoutAdmin/, "Changing wallet locks the authenticated Control Panel");
must(adminHtml, /160M[\s\S]*30M[\s\S]*50M[\s\S]*30M[\s\S]*20M[\s\S]*10M/, "Control Panel shows current 300M Staking ecosystem breakdown");
must(stakingWeb, /getATHAmount/, "Staking frontend previews ATH principal from the contract");
must(stakingWeb, /claimReward/, "Staking frontend exposes reward claiming");
must(stakingWeb, /withdrawPrincipal/, "Staking frontend exposes principal withdrawal");
must(webServer, /preListingPriceUsd: "0.07"/, "Web config exposes the Presale opening price $0.07");
must(webServer, /priceSource: "PRESALE_LINKED"/, "Web config identifies Presale as the ATH reference-price source");
must(webServer, /presalePriceStepUsd: "0.001"/, "Web config exposes the $0.001 Presale price step");
must(webServer, /presaleStepSizeAth: 100000/, "Web config exposes the 100,000 ATH price-step size");
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
must(deploy, /staking\.fundNetworkReserve\(stakingMarketing\)/, "Deployment routes the 50M Marketing allocation into the Staking network reserve");
must(deploy, /staking\.networkReserveATH\(\)/, "Deployment verifies the 50M Marketing/network reserve");
must(deploy, /staking\.totalNetworkFundedATH\(\)/, "Deployment verifies the network funding ledger");
must(deploy, /parseEther\("20000000"\)/, "Deployment contains 20M Staking liquidity allocation");
must(deploy, /parseEther\("10000000"\)/, "Deployment contains 10M Staking reserve allocation");
must(deploy, /stakingBreakdown\s*!==\s*stakingEcosystem/, "Deployment asserts 300M Staking conservation");
must(preflight, /MINING_OWNER_ADDRESS/, "Preflight requires dedicated Mining owner");
must(preflight, /MINING_TREASURY_ADDRESS/, "Preflight requires dedicated Mining treasury");
must(preflight, /STAKING_OWNER_ADDRESS/, "Preflight requires dedicated Staking owner");
must(preflight, /PRESALE_OWNER_ADDRESS/, "Preflight requires dedicated Presale\/Token owner");
must(preflight, /KEEPER_WALLET_ADDRESS/, "Preflight requires dedicated Keeper wallet");
must(deploy, /const treasury = roleAddress\("MINING_TREASURY_ADDRESS"\)/, "Deployment reads dedicated Mining Treasury");
must(deploy, /MiningAirdrop\.deploy\(tokenAddress, treasury, priceRegistryAddress, miningOwner\)/, "Deployment assigns Mining owner and treasury separately");
must(deploy, /ATHStaking[\s\S]*Staking\.deploy\(tokenAddress, oracleAddress, stakingOwner\)/, "Deployment assigns Staking to Staking Admin");
must(deploy, /presaleWallet,\s*presaleOwner/, "Deployment assigns Presale to Presale Admin");
must(deploy, /token\.transferOwnership\(tokenOwner\)/, "ATH Token ownership is transferred to Token\/Presale Admin");
must(deploy, /PriceRegistry\.deploy\(presaleAddress, priceRegistryOwner\)/, "Price Registry belongs to Token\/Presale Admin");
must(deploy, /const presaleAddress = await presale\.getAddress\(\)[\s\S]*PriceRegistry\.deploy\(presaleAddress/, "Presale deploys before Price Registry");
must(rankKeeper, /KEEPER_WALLET_ADDRESS/, "Rank Salary keeper validates the dedicated Keeper wallet");
must(rankKeeper, /Keeper private key mismatch/, "Rank Salary keeper rejects a mismatched private key");
must(stakingRewardKeeper, /KEEPER_WALLET_ADDRESS/, "Staking reward keeper validates the dedicated Keeper wallet");
must(stakingRewardKeeper, /Keeper private key mismatch/, "Staking reward keeper rejects a mismatched private key");
must(preflight, /PRESALE_WALLET/, "Preflight requires Presale treasury role");
must(preflight, /PRESALE_PAYMENT_TOKEN/, "Preflight requires Presale payment token");
must(deploy, /ATHPresale/, "Deployment includes the ATH Presale engine");
must(deploy, /token\.transfer\(presaleAddress, stakingPresale\)/, "Deployment funds the Presale contract with 30M ATH");
must(preflight, /STAKING_RESERVE_WALLET/, "Preflight requires Staking reserve role");
must(preflight, /DEVELOPMENT_BENEFICIARY/, "Preflight requires Development beneficiary role");

for (const name of [
  "MINING_OWNER_ADDRESS",
  "MINING_TREASURY_ADDRESS",
  "STAKING_OWNER_ADDRESS",
  "PRESALE_OWNER_ADDRESS",
  "KEEPER_WALLET_ADDRESS",
  "PRESALE_WALLET",
  "PRESALE_PAYMENT_TOKEN",
  "LIQUIDITY_WALLET",
  "STAKING_RESERVE_WALLET",
  "DEVELOPMENT_BENEFICIARY",
]) {
  if (!env.includes(name + "=")) throw new Error("SELF-CHECK FAILED: missing env template " + name);
}

must(nonBnbReadiness, /internalCodeAndRoleConfig: PASS/, "Non-BNB readiness reports internal completion");
must(nonBnbReadiness, /PRESALE_PAYMENT_TOKEN/, "Non-BNB readiness separates Presale payment-token user input");
must(nonBnbReadiness, /LIQUIDITY_WALLET/, "Non-BNB readiness separates liquidity-wallet user input");
must(nonBnbReadiness, /STAKING_RESERVE_WALLET/, "Non-BNB readiness separates Staking reserve wallet user input");
must(nonBnbReadiness, /DEVELOPMENT_BENEFICIARY/, "Non-BNB readiness separates Development beneficiary user input");
must(nonBnbReadiness, /Testnet deployer still requires sufficient tBNB/, "Non-BNB readiness separates chain-gas dependency");
must(nonBnbReadiness, /Mining, Staking and Presale owners must remain separate wallets/, "Separate admin wallet policy is enforced");
must(nonBnbReadiness, /Current policy requires Mining Treasury = Presale Treasury/, "Mining Treasury override is enforced");
must(nonBnbReadiness, /Keeper wallet must remain separate/, "Keeper role isolation is enforced");
console.log("OK: explicit non-BNB readiness classification");

must(runtimeSecurityAudit, /runtimeHighCritical/, "Runtime security audit reports high\/critical count");
must(runtimeSecurityAudit, /devToolingFindings/, "Runtime security audit separates dev-tooling findings");
must(runtimeSecurityAudit, /runtimeSecurityAudit: PASSED/, "Runtime security audit has explicit PASS marker");
console.log("OK: runtime dependency audit is locked to production tree");

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

console.log("\nAETHER ATH Mining + Staking + Presale-linked pricing + Rank salary self-check PASSED.");
