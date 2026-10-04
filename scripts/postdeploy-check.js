const { ethers } = require("ethers");
const fs = require("fs");

const MINING_VERSION = "3.3.0";
const STAKING_VERSION = "1.0.0";
const DAY = 24 * 60 * 60;

const TOKEN_ABI = [
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function owner() view returns (address)",
  "function paused() view returns (bool)",
];

const MINING_ABI = [
  "function athToken() view returns (address)",
  "function priceRegistry() view returns (address)",
  "function treasury() view returns (address)",
  "function owner() view returns (address)",
  "function paused() view returns (bool)",
  "function contractBalance() view returns (uint256)",
  "function outstandingVestingLiability() view returns (uint256)",
  "function MINING_POOL_ALLOCATION() view returns (uint256)",
  "function POWER_PRICE() view returns (uint256)",
  "function BASE_REWARD() view returns (uint256)",
  "function MAX_DAYS() view returns (uint256)",
  "function CLAIM_OPEN_OFFSET() view returns (uint256)",
  "function BOOSTER_HASH() view returns (uint256)",
  "function BOOSTER_DURATION() view returns (uint256)",
  "function DOUBLE_POWER_MIN_REFERRALS() view returns (uint256)",
  "function MAX_VESTING_CYCLES() view returns (uint256)",
  "function CYCLE_BURN_PCT() view returns (uint256)",
  "function FINAL_BURN_PCT() view returns (uint256)",
  "function MAX_KEEPER_BATCH() view returns (uint256)",
  "function MAX_MINER_PAGE() view returns (uint256)",
  "function powerBoosterPrice() view returns (uint256)",
  "function doublePowerBoosterPrice() view returns (uint256)",
  "function totalMined() view returns (uint256)",
  "function totalPowerSold() view returns (uint256)",
  "function totalBoosterSold() view returns (uint256)",
  "function totalDoublePowerBoosterSold() view returns (uint256)",
  "function totalMiners() view returns (uint256)",
  "function globalClaimed() view returns (uint256)",
  "function globalBurned() view returns (uint256)",
  "function getCurrentPrice() view returns (uint256)",
];

const PRICE_REGISTRY_ABI = [
  "function getPrice() view returns (uint256)",
  "function getReferencePrice() view returns (uint256)",
  "function PRICE_DECIMALS() view returns (uint256)",
  "function PRESALE_START_PRICE() view returns (uint256)",
  "function PRESALE_FINAL_PRICE() view returns (uint256)",
  "function presalePriceSource() view returns (address)",
  "function getPresalePrice() view returns (uint256)",
  "function HOLDER_TARGET() view returns (uint256)",
  "function recordedHolderCount() view returns (uint256)",
  "function priceMode() view returns (uint8)",
  "function officialListingActivated() view returns (bool)",
  "function marketPriceOracle() view returns (address)",
];

const PRESALE_ABI = [
  "function athToken() view returns (address)",
  "function paymentToken() view returns (address)",
  "function treasury() view returns (address)",
  "function owner() view returns (address)",
  "function paused() view returns (bool)",
  "function START_PRICE_USD8() view returns (uint256)",
  "function PRICE_STEP_USD8() view returns (uint256)",
  "function FINAL_PRICE_USD8() view returns (uint256)",
  "function STEP_SIZE_ATH() view returns (uint256)",
  "function SALE_ALLOCATION_ATH() view returns (uint256)",
  "function TOTAL_PRICE_STEPS() view returns (uint256)",
  "function totalSoldATH() view returns (uint256)",
  "function totalPaymentCollected() view returns (uint256)",
  "function currentPriceUSD8() view returns (uint256)",
  "function remainingATH() view returns (uint256)",
];

const STAKING_ABI = [
  "function athToken() view returns (address)",
  "function priceOracle() view returns (address)",
  "function owner() view returns (address)",
  "function paused() view returns (bool)",
  "function STAKING_ECOSYSTEM_ALLOCATION() view returns (uint256)",
  "function MAX_REWARD_POOL() view returns (uint256)",
  "function MAX_NETWORK_MARKETING_POOL() view returns (uint256)",
  "function MIN_STAKE_USDT() view returns (uint256)",
  "function REFERRAL_BPS() view returns (uint256)",
  "function packageCount() view returns (uint256)",
  "function rewardReserveATH() view returns (uint256)",
  "function networkReserveATH() view returns (uint256)",
  "function totalRewardFundedATH() view returns (uint256)",
  "function totalNetworkFundedATH() view returns (uint256)",
  "function principalLiabilityATH() view returns (uint256)",
  "function totalActiveStakedUSDT() view returns (uint256)",
  "function MIN_DIRECT_SPONSORS_FOR_RANK() view returns (uint256)",
  "function RANK_PAYOUT_UTC_OFFSET() view returns (uint256)",
  "function rankSmallLegThresholdUSDT(uint256) view returns (uint256)",
  "function rankWeeklySalaryUSDT(uint256) view returns (uint256)",
  "function totalRankSalaryPaidATH() view returns (uint256)",
  "function totalRankSalaryPaidUSDT() view returns (uint256)",
];

const ORACLE_ABI = [
  "function getPrice() view returns (uint256)",
  "function getMarketPrice() view returns (uint256)",
  "function PRICE_DECIMALS() view returns (uint256)",
  "function priceRegistry() view returns (address)",
];

const DEV_VESTING_ABI = [
  "function athToken() view returns (address)",
  "function beneficiary() view returns (address)",
  "function TOTAL_ALLOCATION() view returns (uint256)",
  "function CLIFF_MONTHS() view returns (uint256)",
  "function ACTIVE_VESTING_MONTHS() view returns (uint256)",
  "function claimedATH() view returns (uint256)",
];

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error("Missing required env: " + name);
  return value.trim();
}

function requiredAddress(name) {
  const value = required(name);
  if (!ethers.isAddress(value) || value === ethers.ZeroAddress) {
    throw new Error(name + " must be a non-zero EVM address");
  }
  return ethers.getAddress(value);
}

function eqAddr(a, b) {
  return a.toLowerCase() === b.toLowerCase();
}

function assertEq(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label} mismatch: got ${actual}, expected ${expected}`);
  }
}

async function assertCode(provider, address, label) {
  const code = await provider.getCode(address);
  if (!code || code === "0x") throw new Error(label + " has no deployed bytecode");
  return (code.length - 2) / 2;
}

async function main() {
  const rpcUrl = required("BSC_TESTNET_RPC");
  const tokenAddress = requiredAddress("ATH_TOKEN_ADDRESS");
  const priceRegistryAddress = requiredAddress("ATH_PRICE_REGISTRY_ADDRESS");
  const presaleAddress = requiredAddress("ATH_PRESALE_ADDRESS");
  const presalePaymentToken = requiredAddress("PRESALE_PAYMENT_TOKEN");
  const miningAddress = requiredAddress("ATH_MINING_ADDRESS");
  const stakingAddress = requiredAddress("ATH_STAKING_ADDRESS");
  const oracleAddress = requiredAddress("ATH_STAKING_ORACLE_ADDRESS");
  const developmentVestingAddress = requiredAddress("ATH_DEVELOPMENT_VESTING_ADDRESS");

  const singleWalletMode = process.env.TESTNET_USE_DEPLOYER_ROLES === "true";
  const deployerAddress = singleWalletMode ? requiredAddress("DEPLOYER_ADDRESS") : null;
  const roleAddress = (name) => singleWalletMode ? deployerAddress : requiredAddress(name);

  const ownerExpected = roleAddress("OWNER_ADDRESS");
  const treasuryExpected = roleAddress("TREASURY_ADDRESS");
  const presaleWallet = roleAddress("PRESALE_WALLET");
  const liquidityWallet = roleAddress("LIQUIDITY_WALLET");
  const stakingReserveWallet = roleAddress("STAKING_RESERVE_WALLET");
  const developmentBeneficiary = roleAddress("DEVELOPMENT_BENEFICIARY");

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== 97) {
    throw new Error("Postdeploy check must run on BSC Testnet chain 97");
  }

  const latestBlock = await provider.getBlock("latest");
  if (!latestBlock) throw new Error("Unable to read latest BSC Testnet block");

  const [
    tokenCodeBytes,
    priceRegistryCodeBytes,
    presaleCodeBytes,
    miningCodeBytes,
    stakingCodeBytes,
    oracleCodeBytes,
    developmentVestingCodeBytes,
  ] = await Promise.all([
      assertCode(provider, tokenAddress, "ATH token"),
      assertCode(provider, priceRegistryAddress, "ATHPriceRegistry"),
      assertCode(provider, presaleAddress, "ATHPresale"),
      assertCode(provider, miningAddress, "MiningAirdrop"),
      assertCode(provider, stakingAddress, "ATHStaking"),
      assertCode(provider, oracleAddress, "ATHStakingPriceOracle"),
      assertCode(provider, developmentVestingAddress, "ATHDevelopmentVesting"),
    ]);

  const token = new ethers.Contract(tokenAddress, TOKEN_ABI, provider);
  const priceRegistry = new ethers.Contract(priceRegistryAddress, PRICE_REGISTRY_ABI, provider);
  const presale = new ethers.Contract(presaleAddress, PRESALE_ABI, provider);
  const mining = new ethers.Contract(miningAddress, MINING_ABI, provider);
  const staking = new ethers.Contract(stakingAddress, STAKING_ABI, provider);
  const oracle = new ethers.Contract(oracleAddress, ORACLE_ABI, provider);
  const vesting = new ethers.Contract(developmentVestingAddress, DEV_VESTING_ABI, provider);

  const [
    totalSupply,
    tokenOwner,
    tokenPaused,
    presaleToken,
    presalePayment,
    presaleTreasury,
    presaleOwner,
    presalePaused,
    presaleStartPrice,
    presalePriceStep,
    presaleFinalPrice,
    presaleStepSize,
    presaleAllocation,
    presaleTotalSteps,
    presaleTotalSold,
    presaleTotalPayment,
    presaleCurrentPrice,
    presaleRemaining,
    presaleATHBalance,
    miningToken,
    miningPriceRegistry,
    miningOwner,
    treasury,
    miningPaused,
    miningBalance,
    miningAllocation,
    powerPrice,
    baseReward,
    maxDays,
    claimOpenOffset,
    boosterHash,
    boosterDuration,
    doublePowerMinReferrals,
    maxVestingCycles,
    cycleBurnPct,
    finalBurnPct,
    keeperBatchMax,
    maxMinerPage,
    powerBoosterPrice,
    doublePowerBoosterPrice,
    totalMined,
    totalPowerSold,
    totalBoosterSold,
    totalDoublePowerBoosterSold,
    totalMiners,
    globalClaimed,
    globalBurned,
    liability,
    miningReferencePrice,
    registryPrice,
    registryReferencePrice,
    registryDecimals,
    registryPresaleStartPrice,
    registryPresaleFinalPrice,
    registryPresaleSource,
    registryPresalePrice,
    registryHolderTarget,
    registryRecordedHolderCount,
    registryPriceMode,
    registryOfficialListing,
    registryMarketOracle,
    stakingToken,
    stakingOracle,
    stakingOwner,
    stakingPaused,
    stakingAllocation,
    maxRewardPool,
    maxNetworkMarketingPool,
    minStakeUSDT,
    referralBps,
    packageCount,
    rewardReserveATH,
    networkReserveATH,
    totalRewardFundedATH,
    totalNetworkFundedATH,
    principalLiabilityATH,
    totalActiveStakedUSDT,
    rankMinSponsors,
    rankPayoutUtcOffset,
    rank1Threshold,
    rank8Threshold,
    rank1Salary,
    rank8Salary,
    totalRankSalaryPaidATH,
    totalRankSalaryPaidUSDT,
    oraclePrice,
    oracleDecimals,
    oraclePriceRegistry,
    vestingToken,
    vestingBeneficiary,
    developmentAllocation,
    developmentCliffMonths,
    developmentActiveMonths,
    developmentClaimed,
    developmentBalance,
  ] = await Promise.all([
    token.totalSupply(),
    token.owner(),
    token.paused(),
    presale.athToken(),
    presale.paymentToken(),
    presale.treasury(),
    presale.owner(),
    presale.paused(),
    presale.START_PRICE_USD8(),
    presale.PRICE_STEP_USD8(),
    presale.FINAL_PRICE_USD8(),
    presale.STEP_SIZE_ATH(),
    presale.SALE_ALLOCATION_ATH(),
    presale.TOTAL_PRICE_STEPS(),
    presale.totalSoldATH(),
    presale.totalPaymentCollected(),
    presale.currentPriceUSD8(),
    presale.remainingATH(),
    token.balanceOf(presaleAddress),
    mining.athToken(),
    mining.priceRegistry(),
    mining.owner(),
    mining.treasury(),
    mining.paused(),
    mining.contractBalance(),
    mining.MINING_POOL_ALLOCATION(),
    mining.POWER_PRICE(),
    mining.BASE_REWARD(),
    mining.MAX_DAYS(),
    mining.CLAIM_OPEN_OFFSET(),
    mining.BOOSTER_HASH(),
    mining.BOOSTER_DURATION(),
    mining.DOUBLE_POWER_MIN_REFERRALS(),
    mining.MAX_VESTING_CYCLES(),
    mining.CYCLE_BURN_PCT(),
    mining.FINAL_BURN_PCT(),
    mining.MAX_KEEPER_BATCH(),
    mining.MAX_MINER_PAGE(),
    mining.powerBoosterPrice(),
    mining.doublePowerBoosterPrice(),
    mining.totalMined(),
    mining.totalPowerSold(),
    mining.totalBoosterSold(),
    mining.totalDoublePowerBoosterSold(),
    mining.totalMiners(),
    mining.globalClaimed(),
    mining.globalBurned(),
    mining.outstandingVestingLiability(),
    mining.getCurrentPrice(),
    priceRegistry.getPrice(),
    priceRegistry.getReferencePrice(),
    priceRegistry.PRICE_DECIMALS(),
    priceRegistry.PRESALE_START_PRICE(),
    priceRegistry.PRESALE_FINAL_PRICE(),
    priceRegistry.presalePriceSource(),
    priceRegistry.getPresalePrice(),
    priceRegistry.HOLDER_TARGET(),
    priceRegistry.recordedHolderCount(),
    priceRegistry.priceMode(),
    priceRegistry.officialListingActivated(),
    priceRegistry.marketPriceOracle(),
    staking.athToken(),
    staking.priceOracle(),
    staking.owner(),
    staking.paused(),
    staking.STAKING_ECOSYSTEM_ALLOCATION(),
    staking.MAX_REWARD_POOL(),
    staking.MAX_NETWORK_MARKETING_POOL(),
    staking.MIN_STAKE_USDT(),
    staking.REFERRAL_BPS(),
    staking.packageCount(),
    staking.rewardReserveATH(),
    staking.networkReserveATH(),
    staking.totalRewardFundedATH(),
    staking.totalNetworkFundedATH(),
    staking.principalLiabilityATH(),
    staking.totalActiveStakedUSDT(),
    staking.MIN_DIRECT_SPONSORS_FOR_RANK(),
    staking.RANK_PAYOUT_UTC_OFFSET(),
    staking.rankSmallLegThresholdUSDT(0),
    staking.rankSmallLegThresholdUSDT(7),
    staking.rankWeeklySalaryUSDT(0),
    staking.rankWeeklySalaryUSDT(7),
    staking.totalRankSalaryPaidATH(),
    staking.totalRankSalaryPaidUSDT(),
    oracle.getPrice(),
    oracle.PRICE_DECIMALS(),
    oracle.priceRegistry(),
    vesting.athToken(),
    vesting.beneficiary(),
    vesting.TOTAL_ALLOCATION(),
    vesting.CLIFF_MONTHS(),
    vesting.ACTIVE_VESTING_MONTHS(),
    vesting.claimedATH(),
    token.balanceOf(developmentVestingAddress),
  ]);

  const oneBillion = ethers.parseEther("1000000000");
  const sevenHundredM = ethers.parseEther("700000000");
  const threeHundredM = ethers.parseEther("300000000");
  const oneSixtyM = ethers.parseEther("160000000");
  const thirtyM = ethers.parseEther("30000000");
  const fiftyM = ethers.parseEther("50000000");
  const twentyM = ethers.parseEther("20000000");
  const tenM = ethers.parseEther("10000000");

  assertEq(totalSupply, oneBillion, "ATH total supply");
  if (!eqAddr(tokenOwner, ownerExpected)) throw new Error("ATH token owner mismatch");
  if (tokenPaused) throw new Error("ATH token unexpectedly paused after deployment");

  // Presale invariants.
  if (!eqAddr(presaleToken, tokenAddress)) throw new Error("Presale ATH token mismatch");
  if (!eqAddr(presalePayment, presalePaymentToken)) throw new Error("Presale payment token mismatch");
  if (!eqAddr(presaleTreasury, presaleWallet)) throw new Error("Presale treasury mismatch");
  if (!eqAddr(presaleOwner, ownerExpected)) throw new Error("Presale owner mismatch");
  if (!presalePaused) throw new Error("Presale must deploy PAUSED until explicit operator opening");
  assertEq(presaleStartPrice, 7_000_000n, "Presale opening price $0.07");
  assertEq(presalePriceStep, 100_000n, "Presale price step $0.001");
  assertEq(presaleFinalPrice, 37_000_000n, "Presale sold-out price $0.37");
  assertEq(presaleStepSize, ethers.parseEther("100000"), "Presale 100,000 ATH step");
  assertEq(presaleAllocation, thirtyM, "Presale 30M allocation");
  assertEq(presaleTotalSteps, 300n, "Presale total price steps");
  assertEq(presaleTotalSold, 0n, "Presale initial sold amount");
  assertEq(presaleTotalPayment, 0n, "Presale initial payment collected");
  assertEq(presaleCurrentPrice, 7_000_000n, "Presale initial current price");
  assertEq(presaleRemaining, thirtyM, "Presale initial remaining ATH");
  assertEq(presaleATHBalance, thirtyM, "Presale funded ATH balance");

  // Mining v3.3 locked invariants.
  if (!eqAddr(miningToken, tokenAddress)) throw new Error("Mining contract token mismatch");
  if (!eqAddr(miningPriceRegistry, priceRegistryAddress)) throw new Error("Mining price registry mismatch");
  if (!eqAddr(miningOwner, ownerExpected)) throw new Error("Mining owner mismatch");
  if (!eqAddr(treasury, treasuryExpected)) throw new Error("Mining treasury mismatch");
  if (miningPaused) throw new Error("Mining unexpectedly paused");
  assertEq(miningBalance, sevenHundredM, "Mining 700M reserve");
  assertEq(miningAllocation, sevenHundredM, "Mining allocation constant");
  assertEq(powerPrice, ethers.parseEther("0.001"), "Power price");
  assertEq(baseReward, ethers.parseEther("10"), "Base daily reward");
  assertEq(maxDays, 180n, "Mining days");
  assertEq(claimOpenOffset, 300n, "00:05 UTC claim offset");
  assertEq(boosterHash, 100n, "Power Booster hash");
  assertEq(boosterDuration, BigInt(30 * DAY), "Power Booster duration");
  assertEq(doublePowerMinReferrals, 5n, "Double Power referral gate");
  assertEq(maxVestingCycles, 12n, "Maximum mining vesting cycles");
  assertEq(cycleBurnPct, 10n, "Mining cycle entry burn");
  assertEq(finalBurnPct, 60n, "Mining final settlement burn");
  assertEq(keeperBatchMax, 50n, "Reward keeper batch cap");
  assertEq(maxMinerPage, 200n, "Miner registry page cap");
  assertEq(powerBoosterPrice, ethers.parseEther("0.001"), "Initial Power Booster price");
  assertEq(doublePowerBoosterPrice, ethers.parseEther("0.001"), "Initial Double Power price");
  assertEq(miningReferencePrice, 70_000n, "ATH Mining Presale-linked opening price $0.07");

  assertEq(registryPrice, 7_000_000n, "ATH registry Presale-linked opening price $0.07");
  assertEq(registryReferencePrice, 7_000_000n, "ATH registry reference price $0.07");
  assertEq(registryDecimals, 8n, "ATH registry price decimals");
  assertEq(registryPresaleStartPrice, 7_000_000n, "ATH registry Presale start price");
  assertEq(registryPresaleFinalPrice, 37_000_000n, "ATH registry Presale final price");
  if (!eqAddr(registryPresaleSource, presaleAddress)) throw new Error("ATH registry Presale source mismatch");
  assertEq(registryPresalePrice, presaleCurrentPrice, "ATH registry mirrors Presale current price");
  assertEq(registryHolderTarget, 15_000n, "ATH official listing holder target");
  assertEq(registryRecordedHolderCount, 0n, "ATH initial recorded holder count");
  assertEq(registryPriceMode, 0n, "ATH pre-listing price mode");
  if (registryOfficialListing) throw new Error("ATH official listing unexpectedly active");
  if (!eqAddr(registryMarketOracle, ethers.ZeroAddress)) {
    throw new Error("ATH market oracle should be unset on initial deployment");
  }

  for (const [label, value] of [
    ["totalMined", totalMined],
    ["totalPowerSold", totalPowerSold],
    ["totalBoosterSold", totalBoosterSold],
    ["totalDoublePowerBoosterSold", totalDoublePowerBoosterSold],
    ["totalMiners", totalMiners],
    ["globalClaimed", globalClaimed],
    ["globalBurned", globalBurned],
    ["outstandingVestingLiability", liability],
  ]) {
    assertEq(value, 0n, label);
  }

  // Staking v1 invariants.
  if (!eqAddr(stakingToken, tokenAddress)) throw new Error("Staking token mismatch");
  if (!eqAddr(stakingOracle, oracleAddress)) throw new Error("Staking oracle mismatch");
  if (!eqAddr(stakingOwner, ownerExpected)) throw new Error("Staking owner mismatch");
  if (stakingPaused) throw new Error("Staking unexpectedly paused");
  assertEq(stakingAllocation, threeHundredM, "Staking ecosystem allocation");
  assertEq(maxRewardPool, oneSixtyM, "Staking daily reward pool cap");
  assertEq(maxNetworkMarketingPool, fiftyM, "Staking Marketing/network pool cap");
  assertEq(rewardReserveATH, oneSixtyM, "Staking initial daily reward reserve");
  assertEq(networkReserveATH, fiftyM, "Staking initial Marketing/network reserve");
  assertEq(totalRewardFundedATH, oneSixtyM, "Staking initial daily reward funded");
  assertEq(totalNetworkFundedATH, fiftyM, "Staking initial network funded from Marketing");
  assertEq(minStakeUSDT, ethers.parseEther("10"), "Staking minimum");
  assertEq(referralBps, 1000n, "Direct referral rate");
  assertEq(packageCount, 6n, "Staking package count");
  assertEq(principalLiabilityATH, 0n, "Staking initial principal liability");
  assertEq(totalActiveStakedUSDT, 0n, "Staking initial active USDT");
  assertEq(rankMinSponsors, 5n, "Rank minimum direct sponsors");
  assertEq(rankPayoutUtcOffset, 1800n, "Rank salary payout time 00:30 UTC");
  assertEq(rank1Threshold, ethers.parseEther("1000"), "Rank 1 small-leg threshold");
  assertEq(rank8Threshold, ethers.parseEther("1000000"), "Rank 8 small-leg threshold");
  assertEq(rank1Salary, ethers.parseEther("25"), "Rank 1 weekly salary");
  assertEq(rank8Salary, ethers.parseEther("10000"), "Rank 8 weekly salary");
  assertEq(totalRankSalaryPaidATH, 0n, "Rank salary ATH initial state");
  assertEq(totalRankSalaryPaidUSDT, 0n, "Rank salary USDT initial state");
  assertEq(oraclePrice, 7_000_000n, "ATH Staking Presale-linked opening price $0.07");
  if (!eqAddr(oraclePriceRegistry, priceRegistryAddress)) throw new Error("Staking oracle price registry mismatch");
  assertEq(oracleDecimals, 8n, "ATH staking oracle decimals");

  if (!eqAddr(vestingToken, tokenAddress)) throw new Error("Development vesting token mismatch");
  if (!eqAddr(vestingBeneficiary, developmentBeneficiary)) {
    throw new Error("Development beneficiary mismatch");
  }
  assertEq(developmentAllocation, thirtyM, "Development allocation");
  assertEq(developmentBalance, thirtyM, "Development funded balance");
  assertEq(developmentCliffMonths, 2n, "Development cliff months");
  assertEq(developmentActiveMonths, 33n, "Development active vesting months");
  assertEq(developmentClaimed, 0n, "Development claimed initial state");

  const expectedByAddress = new Map();
  function addExpected(address, amount) {
    const key = address.toLowerCase();
    expectedByAddress.set(key, (expectedByAddress.get(key) || 0n) + amount);
  }
  addExpected(liquidityWallet, twentyM);
  addExpected(stakingReserveWallet, tenM);

  const destinationBalances = {};
  for (const [addressKey, expected] of expectedByAddress.entries()) {
    const actual = await token.balanceOf(addressKey);
    if (actual !== expected) {
      throw new Error(
        `ATH staking destination mismatch for ${addressKey}: got ${actual}, expected ${expected}`
      );
    }
    destinationBalances[addressKey] = ethers.formatEther(actual);
  }

  const totalAllocated =
    sevenHundredM + oneSixtyM + thirtyM + thirtyM + fiftyM + twentyM + tenM;
  assertEq(totalAllocated, oneBillion, "700M Mining + 300M Staking conservation");

  const report = {
    miningVersion: MINING_VERSION,
    stakingVersion: STAKING_VERSION,
    tokenomicsVersion: "2.0",
    chainId: 97,
    blockNumber: latestBlock.number,
    testnetSingleWalletMode: singleWalletMode,
    contracts: {
      tokenAddress,
      priceRegistryAddress,
      presaleAddress,
      miningAddress,
      stakingAddress,
      oracleAddress,
      developmentVestingAddress,
    },
    codeBytes: {
      token: tokenCodeBytes,
      priceRegistry: priceRegistryCodeBytes,
      presale: presaleCodeBytes,
      mining: miningCodeBytes,
      staking: stakingCodeBytes,
      oracle: oracleCodeBytes,
      developmentVesting: developmentVestingCodeBytes,
    },
    totalSupplyATH: ethers.formatEther(totalSupply),
    allocationsATH: {
      mining: "700000000",
      stakingEcosystem: "300000000",
      rewardPool: "160000000",
      presale: "30000000",
      marketing: "50000000",
      developmentVesting: "30000000",
      liquidity: "20000000",
      reserve: "10000000",
    },
    preListingPriceSource: "ATH_PRESALE",
    openingReferencePriceUSD: "0.07",
    listingHolderTarget: 15000,
    presale: {
      allocationATH: "30000000",
      openingPriceUSD: "0.07",
      priceStepUSD: "0.001",
      stepSizeATH: "100000",
      totalSteps: 300,
      soldOutPriceUSD: "0.37",
      paymentToken: presalePaymentToken,
      treasury: presaleWallet,
    },
    priceMode: "PRESALE_LINKED",
    rankRules: {
      minimumDirectSponsors: 5,
      smallLegThresholdUSDT: [1000, 5000, 15000, 50000, 100000, 250000, 500000, 1000000],
      weeklySalaryUSDT: [25, 75, 200, 500, 1000, 2000, 5000, 10000],
      payoutUtc: "00:30",
      firstPayoutDelayDays: 7,
    },
    stakingReservesATH: {
      dailyReward: ethers.formatEther(rewardReserveATH),
      marketingNetwork: ethers.formatEther(networkReserveATH),
      principalLiability: ethers.formatEther(principalLiabilityATH),
    },
    stakingDestinationBalancesATH: destinationBalances,
    miningReferencePriceUSD: (Number(miningReferencePrice) / 1_000_000).toFixed(3),
    checkedAt: new Date().toISOString(),
  };

  fs.mkdirSync("deployments", { recursive: true });
  fs.writeFileSync(
    "deployments/bsc-testnet-verified.json",
    JSON.stringify(report, null, 2) + "\n"
  );

  console.log(JSON.stringify(report, null, 2));
  console.log("ATH BSC Testnet Mining v3.3 + Staking v1 postdeploy verification PASSED");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
