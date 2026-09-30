const { ethers } = require("ethers");
const fs = require("fs");

const ENGINE_VERSION = "3.3.0";
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

const LOCK_ABI = [
  "function token() view returns (address)",
  "function beneficiary() view returns (address)",
  "function releaseTime() view returns (uint256)",
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
  const teamLockAddress = requiredAddress("ATH_TEAM_LOCK_ADDRESS");

  const singleWalletMode = process.env.TESTNET_USE_DEPLOYER_ROLES === "true";
  const deployerAddress = singleWalletMode ? requiredAddress("DEPLOYER_ADDRESS") : null;
  const roleAddress = (name) => singleWalletMode ? deployerAddress : requiredAddress(name);

  const ownerExpected = roleAddress("OWNER_ADDRESS");
  const treasuryExpected = roleAddress("TREASURY_ADDRESS");
  const teamExpected = roleAddress("TEAM_BENEFICIARY");
  const liquidityWallet = roleAddress("LIQUIDITY_WALLET");
  const marketingWallet = roleAddress("MARKETING_WALLET");

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== 97) {
    throw new Error("Postdeploy check must run on BSC Testnet chain 97");
  }

  const latestBlock = await provider.getBlock("latest");
  if (!latestBlock) throw new Error("Unable to read latest BSC Testnet block");

  const [tokenCodeBytes, miningCodeBytes, teamLockCodeBytes] = await Promise.all([
    assertCode(provider, tokenAddress, "ATH token"),
    assertCode(provider, miningAddress, "MiningAirdrop"),
    assertCode(provider, teamLockAddress, "TeamTokenLock"),
  ]);

  const token = new ethers.Contract(tokenAddress, TOKEN_ABI, provider);
  const mining = new ethers.Contract(miningAddress, MINING_ABI, provider);
  const lock = new ethers.Contract(teamLockAddress, LOCK_ABI, provider);

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
    currentPrice,
    lockToken,
    teamBeneficiary,
    releaseTime,
    teamLockBalance,
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
    lock.token(),
    lock.beneficiary(),
    lock.releaseTime(),
    token.balanceOf(teamLockAddress),
  ]);

  const oneBillion = ethers.parseEther("1000000000");
  const sevenHundredM = ethers.parseEther("700000000");
  const twoHundredM = ethers.parseEther("200000000");
  const fiftyM = ethers.parseEther("50000000");

  assertEq(totalSupply, oneBillion, "ATH total supply");
  if (!eqAddr(tokenOwner, ownerExpected)) throw new Error("ATH token owner mismatch");
  if (tokenPaused) throw new Error("ATH token unexpectedly paused after deployment");
  if (!eqAddr(miningToken, tokenAddress)) throw new Error("Mining contract token mismatch");
  if (!eqAddr(miningOwner, ownerExpected)) throw new Error("Mining owner mismatch");
  if (!eqAddr(treasury, treasuryExpected)) throw new Error("Treasury mismatch");
  if (miningPaused) throw new Error("Mining contract unexpectedly paused after deployment");

  assertEq(miningBalance, sevenHundredM, "Mining 70% reserve");
  assertEq(miningAllocation, sevenHundredM, "Mining allocation constant");
  assertEq(teamLockBalance, fiftyM, "Team 5% allocation");
  if (!eqAddr(lockToken, tokenAddress)) throw new Error("Team lock token mismatch");
  if (!eqAddr(teamBeneficiary, teamExpected)) throw new Error("Team beneficiary mismatch");

  assertEq(powerPrice, ethers.parseEther("0.001"), "Power price");
  assertEq(baseReward, ethers.parseEther("1"), "Base daily reward");
  assertEq(maxDays, 180n, "Mining days");
  assertEq(claimOpenOffset, 300n, "00:05 UTC claim offset");
  assertEq(boosterHash, 100n, "Power Booster hash");
  assertEq(boosterDuration, BigInt(30 * DAY), "Power Booster duration");
  assertEq(doublePowerMinReferrals, 5n, "Double Power referral gate");
  assertEq(maxVestingCycles, 12n, "Maximum vesting cycles");
  assertEq(cycleBurnPct, 10n, "Cycle entry burn");
  assertEq(finalBurnPct, 60n, "Final settlement burn");
  assertEq(powerBoosterPrice, ethers.parseEther("0.001"), "Initial Power Booster price");
  assertEq(doublePowerBoosterPrice, ethers.parseEther("0.001"), "Initial Double Power price");
  assertEq(currentPrice, 3_000_000n, "ATH initial display price");

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

  const remainingLockSeconds = Number(releaseTime) - Number(latestBlock.timestamp);
  const minExpectedLock = 364 * DAY;
  const maxExpectedLock = 365 * DAY;
  if (remainingLockSeconds < minExpectedLock || remainingLockSeconds > maxExpectedLock) {
    throw new Error("Team lock does not match the fixed 365-day ATH policy");
  }

  const expectedByAddress = new Map();
  function addExpected(address, amount) {
    const key = address.toLowerCase();
    expectedByAddress.set(key, (expectedByAddress.get(key) || 0n) + amount);
  }
  addExpected(liquidityWallet, twoHundredM);
  addExpected(marketingWallet, fiftyM);

  const destinationBalances = {};
  for (const [addressKey, expected] of expectedByAddress.entries()) {
    const actual = await token.balanceOf(addressKey);
    if (actual !== expected) {
      throw new Error(
        `ATH destination allocation mismatch for ${addressKey}: got ${actual}, expected ${expected}`
      );
    }
    destinationBalances[addressKey] = ethers.formatEther(actual);
  }

  const report = {
    engineVersion: ENGINE_VERSION,
    chainId: 97,
    blockNumber: latestBlock.number,
    testnetSingleWalletMode: singleWalletMode,
    tokenAddress,
    miningAddress,
    teamLockAddress,
    codeBytes: {
      token: tokenCodeBytes,
      mining: miningCodeBytes,
      teamLock: teamLockCodeBytes,
    },
    owner: tokenOwner,
    treasury,
    teamBeneficiary,
    teamReleaseAt: Number(releaseTime),
    totalSupplyATH: ethers.formatEther(totalSupply),
    miningPoolATH: ethers.formatEther(miningBalance),
    teamLockedATH: ethers.formatEther(teamLockBalance),
    allocationDestinationsATH: destinationBalances,
    initialDisplayPriceUSD: (Number(currentPrice) / 1_000_000).toFixed(3),
    miningRules: {
      baseRewardATH: ethers.formatEther(baseReward),
      claimOpenUtc: "00:05:00",
      claimCloseUtc: "23:59:59",
      powerPriceBNB: ethers.formatEther(powerPrice),
      powerBoosterPriceBNB: ethers.formatEther(powerBoosterPrice),
      doublePowerBoosterPriceBNB: ethers.formatEther(doublePowerBoosterPrice),
      boosterDurationDays: Number(boosterDuration) / DAY,
      doublePowerMinReferrals: Number(doublePowerMinReferrals),
      maxVestingCycles: Number(maxVestingCycles),
      cycleBurnPct: Number(cycleBurnPct),
      finalBurnPct: Number(finalBurnPct),
    },
    zeroState: {
      totalMined: totalMined.toString(),
      totalPowerSold: totalPowerSold.toString(),
      totalBoosterSold: totalBoosterSold.toString(),
      totalDoublePowerBoosterSold: totalDoublePowerBoosterSold.toString(),
      totalMiners: totalMiners.toString(),
      globalClaimed: globalClaimed.toString(),
      globalBurned: globalBurned.toString(),
      outstandingVestingLiability: liability.toString(),
    },
    checkedAt: new Date().toISOString(),
  };

  fs.mkdirSync("deployments", { recursive: true });
  fs.writeFileSync(
    "deployments/bsc-testnet-verified.json",
    JSON.stringify(report, null, 2) + "\n"
  );
  console.log(JSON.stringify(report, null, 2));
  console.log("ATH BSC Testnet v3.3 postdeploy verification PASSED");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});