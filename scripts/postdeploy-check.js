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

const STAKING_ABI = [
  "function athToken() view returns (address)",
  "function priceOracle() view returns (address)",
  "function owner() view returns (address)",
  "function paused() view returns (bool)",
  "function STAKING_ECOSYSTEM_ALLOCATION() view returns (uint256)",
  "function MAX_REWARD_POOL() view returns (uint256)",
  "function MIN_STAKE_USDT() view returns (uint256)",
  "function REFERRAL_BPS() view returns (uint256)",
  "function packageCount() view returns (uint256)",
  "function rewardReserveATH() view returns (uint256)",
  "function totalRewardFundedATH() view returns (uint256)",
  "function principalLiabilityATH() view returns (uint256)",
  "function totalActiveStakedUSDT() view returns (uint256)",
];

const ORACLE_ABI = [
  "function getPrice() view returns (uint256)",
  "function PRICE_DECIMALS() view returns (uint256)",
  "function miningPriceSource() view returns (address)",
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
  const marketingWallet = roleAddress("MARKETING_WALLET");
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

  const [tokenCodeBytes, miningCodeBytes, stakingCodeBytes, oracleCodeBytes, developmentVestingCodeBytes] =
    await Promise.all([
      assertCode(provider, tokenAddress, "ATH token"),
      assertCode(provider, miningAddress, "MiningAirdrop"),
      assertCode(provider, stakingAddress, "ATHStaking"),
      assertCode(provider, oracleAddress, "ATHStakingPriceOracle"),
      assertCode(provider, developmentVestingAddress, "ATHDevelopmentVesting"),
    ]);

  const token = new ethers.Contract(tokenAddress, TOKEN_ABI, provider);
  const mining = new ethers.Contract(miningAddress, MINING_ABI, provider);
  const staking = new ethers.Contract(stakingAddress, STAKING_ABI, provider);
  const oracle = new ethers.Contract(oracleAddress, ORACLE_ABI, provider);
  const vesting = new ethers.Contract(developmentVestingAddress, DEV_VESTING_ABI, provider);

  const [
    totalSupply,
    tokenOwner,
    tokenPaused,
    miningToken,
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
    stakingToken,
    stakingOracle,
    stakingOwner,
    stakingPaused,
    stakingAllocation,
    maxRewardPool,
    minStakeUSDT,
    referralBps,
    packageCount,
    rewardReserveATH,
    totalRewardFundedATH,
    principalLiabilityATH,
    totalActiveStakedUSDT,
    oraclePrice,
    oracleDecimals,
    oracleMiningPriceSource,
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
    mining.athToken(),
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
    staking.athToken(),
    staking.priceOracle(),
    staking.owner(),
    staking.paused(),
    staking.STAKING_ECOSYSTEM_ALLOCATION(),
    staking.MAX_REWARD_POOL(),
    staking.MIN_STAKE_USDT(),
    staking.REFERRAL_BPS(),
    staking.packageCount(),
    staking.rewardReserveATH(),
    staking.totalRewardFundedATH(),
    staking.principalLiabilityATH(),
    staking.totalActiveStakedUSDT(),
    oracle.getPrice(),
    oracle.PRICE_DECIMALS(),
    oracle.miningPriceSource(),
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

  // Mining v3.3 locked invariants.
  if (!eqAddr(miningToken, tokenAddress)) throw new Error("Mining contract token mismatch");
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
  assertEq(miningReferencePrice, 100_000n, "ATH starting protocol price $0.10");

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
  assertEq(maxRewardPool, oneSixtyM, "Staking reward pool cap");
  assertEq(rewardReserveATH, oneSixtyM, "Staking initial reward reserve");
  assertEq(totalRewardFundedATH, oneSixtyM, "Staking initial reward funded");
  assertEq(minStakeUSDT, ethers.parseEther("10"), "Staking minimum");
  assertEq(referralBps, 1000n, "Direct referral rate");
  assertEq(packageCount, 6n, "Staking package count");
  assertEq(principalLiabilityATH, 0n, "Staking initial principal liability");
  assertEq(totalActiveStakedUSDT, 0n, "Staking initial active USDT");
  assertEq(oraclePrice, 10_000_000n, "ATH Staking starting price $0.10");
  if (!eqAddr(oracleMiningPriceSource, miningAddress)) throw new Error("Staking oracle Mining price source mismatch");
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
  addExpected(presaleWallet, thirtyM);
  addExpected(marketingWallet, fiftyM);
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
      miningAddress,
      stakingAddress,
      oracleAddress,
      developmentVestingAddress,
    },
    codeBytes: {
      token: tokenCodeBytes,
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
    stakingReferencePriceUSD: "0.10",
    stakingDestinationBalancesATH: destinationBalances,
    miningInternalDisplayMetricUSD: (Number(legacyMiningDisplayPrice) / 1_000_000).toFixed(3),
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
