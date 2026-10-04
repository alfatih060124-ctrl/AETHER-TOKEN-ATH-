const hre = require("hardhat");
const fs = require("fs");

const MAINNET_GATES = [
  "ALLOW_MAINNET_DEPLOY",
  "MAINNET_AUDIT_PASSED",
  "MAINNET_MULTISIG_CONFIRMED",
  "LIQUIDITY_LOCK_CONFIRMED",
];

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value.trim();
}

function requiredAddress(name) {
  const value = required(name);
  if (!hre.ethers.isAddress(value) || value === hre.ethers.ZeroAddress) {
    throw new Error(`${name} must be a non-zero EVM address`);
  }
  return hre.ethers.getAddress(value);
}

async function main() {
  if (!process.env.PRIVATE_KEY) throw new Error("Missing required env: PRIVATE_KEY");

  const network = await hre.ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  const isTestnet = hre.network.name === "bscTestnet";
  const isMainnet = hre.network.name === "bscMainnet";

  if (!isTestnet && !isMainnet) {
    throw new Error("ATH deployment is allowed only on configured BSC Testnet or BSC Mainnet networks");
  }
  if (isTestnet && chainId !== 97) throw new Error(`BSC Testnet chain mismatch: ${chainId}`);
  if (isMainnet && chainId !== 56) throw new Error(`BSC Mainnet chain mismatch: ${chainId}`);

  if (isTestnet) {
    for (const gate of MAINNET_GATES) {
      if (process.env[gate] === "true") {
        throw new Error(`Testnet safety check failed: ${gate} must remain false`);
      }
    }
  }

  if (isMainnet) {
    for (const gate of MAINNET_GATES) {
      if (process.env[gate] !== "true") {
        throw new Error(`Mainnet blocked: ${gate}=true is required`);
      }
    }
  }

  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) throw new Error("No deployer signer available");

  const singleWalletMode = isTestnet && process.env.TESTNET_USE_DEPLOYER_ROLES === "true";
  const roleAddress = (name) => singleWalletMode ? deployer.address : requiredAddress(name);

  const owner = roleAddress("OWNER_ADDRESS");
  const treasury = roleAddress("TREASURY_ADDRESS");
  const presaleWallet = roleAddress("PRESALE_WALLET");
  const presalePaymentToken = requiredAddress("PRESALE_PAYMENT_TOKEN");
  const marketingWallet = roleAddress("MARKETING_WALLET");
  const liquidityWallet = roleAddress("LIQUIDITY_WALLET");
  const stakingReserveWallet = roleAddress("STAKING_RESERVE_WALLET");
  const developmentBeneficiary = roleAddress("DEVELOPMENT_BENEFICIARY");

  const deployerBalance = await hre.ethers.provider.getBalance(deployer.address);
  if (deployerBalance <= 0n) throw new Error("Deployer has zero BNB balance");

  console.log("Network               :", hre.network.name);
  console.log("Chain ID              :", chainId);
  console.log("Deployer              :", deployer.address);
  console.log("Deployer BNB          :", hre.ethers.formatEther(deployerBalance));
  console.log("Testnet role mode     :", singleWalletMode ? "DEPLOYER_FOR_ALL_ROLES" : "EXPLICIT_ADDRESSES");
  console.log("Owner / multisig      :", owner);
  console.log("Mining treasury       :", treasury);
  console.log("Presale treasury      :", presaleWallet);
  console.log("Presale payment token :", presalePaymentToken);
  console.log("Staking marketing     :", marketingWallet);
  console.log("Staking liquidity     :", liquidityWallet);
  console.log("Staking reserve       :", stakingReserveWallet);
  console.log("Development beneficiary:", developmentBeneficiary);

  const ATHToken = await hre.ethers.getContractFactory("ATHToken");
  const token = await ATHToken.deploy(deployer.address);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();

  // Presale is the official pre-listing ATH price source.
  // It deploys paused/fail-closed and starts at $0.070.
  // Unified ATH price registry follows Presale before official listing.
  const PriceRegistry = await hre.ethers.getContractFactory("ATHPriceRegistry");
  const priceRegistry = await PriceRegistry.deploy(presaleAddress, owner);
  await priceRegistry.waitForDeployment();
  const priceRegistryAddress = await priceRegistry.getAddress();

  // Deploy ATH Mining v3.3 without changing reward/booster/vesting mechanics.
  // Only its compatibility price getter consumes the unified price registry.
  const MiningAirdrop = await hre.ethers.getContractFactory("MiningAirdrop");
  const mining = await MiningAirdrop.deploy(tokenAddress, treasury, priceRegistryAddress, owner);
  await mining.waitForDeployment();
  const miningAddress = await mining.getAddress();

  const [
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
  ] = await Promise.all([
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
  ]);

  const expectedRules = [
    [powerPrice, hre.ethers.parseEther("0.001"), "POWER_PRICE"],
    [baseReward, hre.ethers.parseEther("10"), "BASE_REWARD"],
    [maxDays, 180n, "MAX_DAYS"],
    [claimOpenOffset, 300n, "CLAIM_OPEN_OFFSET"],
    [boosterHash, 100n, "BOOSTER_HASH"],
    [boosterDuration, BigInt(30 * 24 * 60 * 60), "BOOSTER_DURATION"],
    [doublePowerMinReferrals, 5n, "DOUBLE_POWER_MIN_REFERRALS"],
    [maxVestingCycles, 12n, "MAX_VESTING_CYCLES"],
    [cycleBurnPct, 10n, "CYCLE_BURN_PCT"],
    [finalBurnPct, 60n, "FINAL_BURN_PCT"],
    [keeperBatchMax, 50n, "MAX_KEEPER_BATCH"],
    [maxMinerPage, 200n, "MAX_MINER_PAGE"],
    [powerBoosterPrice, hre.ethers.parseEther("0.001"), "powerBoosterPrice"],
    [doublePowerBoosterPrice, hre.ethers.parseEther("0.001"), "doublePowerBoosterPrice"],
  ];
  for (const [actual, expected, label] of expectedRules) {
    if (actual !== expected) {
      throw new Error(`Mining v3.3 invariant failed for ${label}: got ${actual}, expected ${expected}`);
    }
  }

  const Oracle = await hre.ethers.getContractFactory("ATHStakingPriceOracle");
  const oracle = await Oracle.deploy(priceRegistryAddress);
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();

  const Staking = await hre.ethers.getContractFactory("ATHStaking");
  const staking = await Staking.deploy(tokenAddress, oracleAddress, owner);
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();

  const Presale = await hre.ethers.getContractFactory("ATHPresale");
  const presale = await Presale.deploy(
    tokenAddress,
    presalePaymentToken,
    presaleWallet,
    owner
  );
  await presale.waitForDeployment();
  const presaleAddress = await presale.getAddress();

  const DevelopmentVesting = await hre.ethers.getContractFactory("ATHDevelopmentVesting");
  const developmentVesting = await DevelopmentVesting.deploy(tokenAddress, developmentBeneficiary);
  await developmentVesting.waitForDeployment();
  const developmentVestingAddress = await developmentVesting.getAddress();

  const miningAllocation = hre.ethers.parseEther("700000000");
  const stakingRewardPool = hre.ethers.parseEther("160000000");
  const stakingPresale = hre.ethers.parseEther("30000000");
  const stakingMarketing = hre.ethers.parseEther("50000000");
  const stakingDevelopment = hre.ethers.parseEther("30000000");
  const stakingLiquidity = hre.ethers.parseEther("20000000");
  const stakingReserve = hre.ethers.parseEther("10000000");
  const stakingEcosystem = hre.ethers.parseEther("300000000");

  const stakingBreakdown =
    stakingRewardPool +
    stakingPresale +
    stakingMarketing +
    stakingDevelopment +
    stakingLiquidity +
    stakingReserve;

  if (stakingBreakdown !== stakingEcosystem) {
    throw new Error("Staking 300M allocation arithmetic mismatch");
  }

  await (await token.transfer(miningAddress, miningAllocation)).wait();

  await (await token.approve(stakingAddress, stakingRewardPool + stakingMarketing)).wait();
  await (await staking.fundRewards(stakingRewardPool)).wait();
  await (await staking.fundNetworkReserve(stakingMarketing)).wait();

  await (await token.transfer(developmentVestingAddress, stakingDevelopment)).wait();
  await (await token.transfer(presaleAddress, stakingPresale)).wait();
  await (await token.transfer(liquidityWallet, stakingLiquidity)).wait();
  await (await token.transfer(stakingReserveWallet, stakingReserve)).wait();

  const expectedByAddress = new Map();
  function addExpected(address, amount) {
    const key = address.toLowerCase();
    expectedByAddress.set(key, (expectedByAddress.get(key) || 0n) + amount);
  }
  addExpected(liquidityWallet, stakingLiquidity);
  addExpected(stakingReserveWallet, stakingReserve);

  const expectedDeployerATH = expectedByAddress.get(deployer.address.toLowerCase()) || 0n;
  const remaining = await token.balanceOf(deployer.address);
  if (remaining !== expectedDeployerATH) {
    throw new Error(
      `Unexpected deployer ATH balance: got ${remaining}, expected ${expectedDeployerATH}`
    );
  }

  if ((await token.balanceOf(miningAddress)) !== miningAllocation) {
    throw new Error("Mining allocation is not exactly 700M ATH");
  }
  if ((await staking.rewardReserveATH()) !== stakingRewardPool) {
    throw new Error("Staking reward reserve is not exactly 160M ATH");
  }
  if ((await staking.networkReserveATH()) !== stakingMarketing) {
    throw new Error("Staking network/marketing reserve is not exactly 50M ATH");
  }
  if ((await staking.totalNetworkFundedATH()) !== stakingMarketing) {
    throw new Error("Staking network funding ledger is not exactly 50M ATH");
  }
  if ((await token.balanceOf(developmentVestingAddress)) !== stakingDevelopment) {
    throw new Error("Development vesting is not exactly 30M ATH");
  }
  if ((await token.balanceOf(presaleAddress)) !== stakingPresale) {
    throw new Error("ATH Presale contract is not funded with exactly 30M ATH");
  }
  if ((await presale.START_PRICE_USD8()) !== 7_000_000n) {
    throw new Error("ATH Presale does not open at $0.07");
  }
  if ((await presale.PRICE_STEP_USD8()) !== 100_000n) {
    throw new Error("ATH Presale price step is not $0.001");
  }
  if ((await presale.FINAL_PRICE_USD8()) !== 37_000_000n) {
    throw new Error("ATH Presale sell-out price is not $0.37");
  }
  if ((await presale.STEP_SIZE_ATH()) !== hre.ethers.parseEther("100000")) {
    throw new Error("ATH Presale step size is not 100,000 ATH");
  }
  if ((await priceRegistry.getPrice()) !== 7_000_000n) {
    throw new Error("ATH unified price is not reading the $0.07 Presale opening price");
  }
  if ((await priceRegistry.HOLDER_TARGET()) !== 15_000n) {
    throw new Error("ATH official listing holder target is not 15,000");
  }
  if ((await priceRegistry.officialListingActivated()) !== false) {
    throw new Error("ATH official listing must be inactive at deployment");
  }
  if ((await oracle.getPrice()) !== 7_000_000n) {
    throw new Error("ATH Staking oracle is not reading the Presale-linked registry price");
  }

  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    await (await token.transferOwnership(owner)).wait();
  }

  const manifest = {
    engineVersion: "3.3.0",
    stakingVersion: "1.0.0",
    tokenomicsVersion: "2.0",
    network: hre.network.name,
    chainId,
    deployer: deployer.address,
    testnetSingleWalletMode: singleWalletMode,
    owner,
    treasury,
    presaleWallet,
    presalePaymentToken,
    marketingWallet,
    liquidityWallet,
    stakingReserveWallet,
    developmentBeneficiary,
    contracts: {
      ATH_TOKEN_ADDRESS: tokenAddress,
      ATH_PRICE_REGISTRY_ADDRESS: priceRegistryAddress,
      ATH_PRESALE_ADDRESS: presaleAddress,
      ATH_MINING_ADDRESS: miningAddress,
      ATH_STAKING_ADDRESS: stakingAddress,
      ATH_STAKING_ORACLE_ADDRESS: oracleAddress,
      ATH_DEVELOPMENT_VESTING_ADDRESS: developmentVestingAddress,
    },
    allocationsATH: {
      totalSupply: "1000000000",
      mining: "700000000",
      stakingEcosystem: "300000000",
      stakingBreakdown: {
        rewardPool: "160000000",
        presale: "30000000",
        marketingNetworkReserve: "50000000",
        developmentVesting: "30000000",
        liquidity: "20000000",
        reserve: "10000000",
      },
    },
    priceRules: {
      source: "ATH_PRESALE",
      openingPriceUSD: "0.07",
      priceStepUSD: "0.001",
      stepSizeATH: "100000",
      soldOutReferencePriceUSD: "0.37",
      holderTarget: 15000,
      preListingMode: "PRESALE_LINKED",
      officialListingActivated: false,
      dexMarketPriceMayBeVisibleBeforeListing: true,
      officialPriceSwitch: "MARKET_AFTER_HOLDER_GATE_AND_OPERATOR_ACTIVATION",
    },
    presaleRules: {
      allocationATH: "30000000",
      openingPriceUSD: "0.07",
      priceStepUSD: "0.001",
      stepSizeATH: "100000",
      totalSteps: 300,
      soldOutPriceUSD: "0.37",
      paymentToken: presalePaymentToken,
      treasury: presaleWallet,
    },
    stakingRules: {
      referencePrice: "PRESALE_LINKED",
      minimumStakeUSDT: "10",
      directReferralPct: 10,
      networkLevels: 10,
      packageDailyRatePct: ["0.35", "0.45", "0.55", "0.65", "0.75", "0.85"],
      packageLockDays: [180, 180, 365, 365, 730, 730],
      rewardPoolATH: "160000000",
      developmentVestingATH: "30000000",
      developmentCliffMonths: 2,
      developmentActiveMonths: 33,
      rankMinimumDirectSponsors: 5,
      rankSmallLegThresholdUSDT: [1000, 5000, 15000, 50000, 100000, 250000, 500000, 1000000],
      rankWeeklySalaryUSDT: [25, 75, 200, 500, 1000, 2000, 5000, 10000],
      rankPayoutUtc: "00:30",
      rankFirstPayoutDelayDays: 7,
      rankSalaryDuration: "LIFETIME",
      networkingBonusSource: "50M_MARKETING_NETWORK_RESERVE",
    },
    miningRules: {
      baseRewardATH: "10",
      claimOpenUtc: "00:05:00",
      claimCloseUtc: "23:59:59",
      powerPriceBNB: "0.001",
      powerBoosterPriceBNB: hre.ethers.formatEther(powerBoosterPrice),
      doublePowerBoosterPriceBNB: hre.ethers.formatEther(doublePowerBoosterPrice),
      powerBoosterDurationDays: 30,
      doublePowerMinReferrals: Number(doublePowerMinReferrals),
      maxVestingCycles: Number(maxVestingCycles),
      cycleBurnPct: Number(cycleBurnPct),
      finalBurnPct: Number(finalBurnPct),
      keeperBatchMax: Number(keeperBatchMax),
      minerPageMax: Number(maxMinerPage),
    },
    deployerExpectedATH: hre.ethers.formatEther(expectedDeployerATH),
    deployedAt: new Date().toISOString(),
  };

  fs.mkdirSync("deployments", { recursive: true });
  const manifestPath = `deployments/${hre.network.name}.json`;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

  console.log("\n========== ATH DEPLOYMENT ==========");
  console.log("ATH_TOKEN                  =", tokenAddress);
  console.log("ATH_PRICE_REGISTRY         =", priceRegistryAddress);
  console.log("ATH_PRESALE                =", presaleAddress);
  console.log("MINING_AIRDROP             =", miningAddress);
  console.log("ATH_STAKING                =", stakingAddress);
  console.log("ATH_STAKING_ORACLE         =", oracleAddress);
  console.log("ATH_DEVELOPMENT_VESTING    =", developmentVestingAddress);
  console.log("DEPLOYER_ADDRESS           =", deployer.address);
  console.log("MANIFEST                   =", manifestPath);
  console.log("====================================");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
