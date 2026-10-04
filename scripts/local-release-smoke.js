const hre = require("hardhat");

function assertEq(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: got ${actual}, expected ${expected}`);
  }
}

async function increase(seconds) {
  await hre.network.provider.send("evm_increaseTime", [seconds]);
  await hre.network.provider.send("evm_mine");
}

async function main() {
  const [
    deployer,
    miningHolder,
    miningReferral,
    miningTreasury,
    presale,
    marketing,
    liquidity,
    stakingReserveWallet,
    developmentBeneficiary,
    stakingUser,
    stakingReferrer,
    miningChild,
  ] = await hre.ethers.getSigners();

  const Token = await hre.ethers.getContractFactory("ATHToken");
  const token = await Token.deploy(deployer.address);
  await token.waitForDeployment();

  const Stable = await hre.ethers.getContractFactory("MockStablecoin");
  const presalePaymentToken = await Stable.deploy(6);
  await presalePaymentToken.waitForDeployment();

  const Presale = await hre.ethers.getContractFactory("ATHPresale");
  const presaleContract = await Presale.deploy(
    await token.getAddress(),
    await presalePaymentToken.getAddress(),
    presale.address,
    deployer.address
  );
  await presaleContract.waitForDeployment();

  const PriceRegistry = await hre.ethers.getContractFactory("ATHPriceRegistry");
  const priceRegistry = await PriceRegistry.deploy(
    await presaleContract.getAddress(),
    deployer.address
  );
  await priceRegistry.waitForDeployment();

  // Deploy Mining with current reward rules and the Presale-linked ATH price registry.
  const Mining = await hre.ethers.getContractFactory("MiningAirdrop");
  const mining = await Mining.deploy(
    await token.getAddress(),
    miningTreasury.address,
    await priceRegistry.getAddress(),
    deployer.address
  );
  await mining.waitForDeployment();

  // Staking accounting uses the same unified ATH price registry.
  const Oracle = await hre.ethers.getContractFactory("ATHStakingPriceOracle");
  const oracle = await Oracle.deploy(await priceRegistry.getAddress());
  await oracle.waitForDeployment();

  const Staking = await hre.ethers.getContractFactory("ATHStaking");
  const staking = await Staking.deploy(
    await token.getAddress(),
    await oracle.getAddress(),
    deployer.address
  );
  await staking.waitForDeployment();

  const DevelopmentVesting = await hre.ethers.getContractFactory("ATHDevelopmentVesting");
  const developmentVesting = await DevelopmentVesting.deploy(
    await token.getAddress(),
    developmentBeneficiary.address
  );
  await developmentVesting.waitForDeployment();

  const miningAllocation = hre.ethers.parseEther("700000000");
  const stakingRewardPool = hre.ethers.parseEther("160000000");
  const presaleAllocation = hre.ethers.parseEther("30000000");
  const marketingAllocation = hre.ethers.parseEther("50000000");
  const developmentAllocation = hre.ethers.parseEther("30000000");
  const liquidityAllocation = hre.ethers.parseEther("20000000");
  const reserveAllocation = hre.ethers.parseEther("10000000");

  await (await token.transfer(await mining.getAddress(), miningAllocation)).wait();

  await (await token.approve(await staking.getAddress(), stakingRewardPool + marketingAllocation)).wait();
  await (await staking.fundRewards(stakingRewardPool)).wait();
  await (await staking.fundNetworkReserve(marketingAllocation)).wait();

  await (await token.transfer(await presaleContract.getAddress(), presaleAllocation)).wait();
  await (await token.transfer(await developmentVesting.getAddress(), developmentAllocation)).wait();
  await (await token.transfer(liquidity.address, liquidityAllocation)).wait();
  await (await token.transfer(stakingReserveWallet.address, reserveAllocation)).wait();

  assertEq(await token.totalSupply(), hre.ethers.parseEther("1000000000"), "fixed supply");
  assertEq(await token.balanceOf(await mining.getAddress()), miningAllocation, "Mining reserve");
  assertEq(await staking.rewardReserveATH(), stakingRewardPool, "Staking daily reward reserve");
  assertEq(await staking.networkReserveATH(), marketingAllocation, "Staking Marketing/network reserve");
  assertEq(await staking.totalNetworkFundedATH(), marketingAllocation, "Staking network funding ledger");
  assertEq(await token.balanceOf(await developmentVesting.getAddress()), developmentAllocation, "Development vesting reserve");
  assertEq(await token.balanceOf(await presaleContract.getAddress()), presaleAllocation, "Presale 30M allocation");
  assertEq(await presaleContract.currentPriceUSD8(), 7_000_000n, "Presale opening price $0.07");
  assertEq(await presaleContract.FINAL_PRICE_USD8(), 37_000_000n, "Presale sold-out price $0.37");
  assertEq(await presaleContract.STEP_SIZE_ATH(), hre.ethers.parseEther("100000"), "Presale price step size");
  assertEq(await token.balanceOf(marketing.address), 0n, "Marketing allocation is reserved on-chain for network bonuses");
  assertEq(await token.balanceOf(liquidity.address), liquidityAllocation, "Staking liquidity allocation");
  assertEq(await token.balanceOf(stakingReserveWallet.address), reserveAllocation, "Staking reserve allocation");
  assertEq(await token.balanceOf(deployer.address), 0n, "deployer residual ATH");
  assertEq(await priceRegistry.getPrice(), 7_000_000n, "ATH unified Presale opening price $0.07");
  assertEq(await priceRegistry.HOLDER_TARGET(), 15_000n, "ATH holder listing target");
  assertEq(await oracle.getPrice(), 7_000_000n, "Unified ATH Staking Presale-linked price $0.07");
  assertEq(await mining.getCurrentPrice(), 70_000n, "Unified ATH Mining Presale-linked price $0.07");
  assertEq(await mining.MINING_POOL_ALLOCATION(), miningAllocation, "Mining allocation constant");
  assertEq(await mining.MAX_VESTING_CYCLES(), 12n, "Mining vesting cycles");
  assertEq(await mining.CYCLE_BURN_PCT(), 10n, "Mining cycle burn");
  assertEq(await mining.FINAL_BURN_PCT(), 60n, "Mining final burn");
  assertEq(await mining.CLAIM_OPEN_OFFSET(), 300n, "Mining claim open offset");
  assertEq(await mining.MAX_KEEPER_BATCH(), 50n, "Mining keeper batch cap");
  assertEq(await mining.MAX_MINER_PAGE(), 200n, "Mining miner registry page cap");
  assertEq(await staking.MIN_DIRECT_SPONSORS_FOR_RANK(), 5n, "Rank minimum direct sponsors");
  assertEq(await staking.rankSmallLegThresholdUSDT(0), hre.ethers.parseEther("1000"), "Rank 1 small-leg threshold");
  assertEq(await staking.rankSmallLegThresholdUSDT(7), hre.ethers.parseEther("1000000"), "Rank 8 small-leg threshold");
  assertEq(await staking.rankWeeklySalaryUSDT(0), hre.ethers.parseEther("25"), "Rank 1 weekly salary");
  assertEq(await staking.rankWeeklySalaryUSDT(7), hre.ethers.parseEther("10000"), "Rank 8 weekly salary");
  assertEq(await staking.RANK_PAYOUT_UTC_OFFSET(), 1800n, "Rank salary payout UTC offset");

  // ---------------- Mining smoke flow ----------------
  const block = await hre.ethers.provider.getBlock("latest");
  const day = Math.floor(Number(block.timestamp) / 86400);
  const openAt = day * 86400 + 300;
  if (Number(block.timestamp) < openAt) {
    await hre.network.provider.send("evm_setNextBlockTimestamp", [openAt]);
    await hre.network.provider.send("evm_mine");
  }

  await (await mining.connect(miningReferral).buyPower(hre.ethers.ZeroAddress, {
    value: hre.ethers.parseEther("0.001"),
  })).wait();
  await (await mining.connect(miningHolder).buyPower(miningReferral.address, {
    value: hre.ethers.parseEther("0.001"),
  })).wait();
  await (await mining.connect(miningChild).buyPower(miningHolder.address, {
    value: hre.ethers.parseEther("0.001"),
  })).wait();

  const afterPurchase = await hre.ethers.provider.getBlock("latest");
  const nextRewardDay = Math.floor(Number(afterPurchase.timestamp) / 86400) + 1;
  const nextOpen = nextRewardDay * 86400 + 300;
  await hre.network.provider.send("evm_setNextBlockTimestamp", [nextOpen]);
  await hre.network.provider.send("evm_mine");

  const rewardBlock = await hre.ethers.provider.getBlock("latest");
  const rewardDay = Math.floor(Number(rewardBlock.timestamp) / 86400);
  await (await mining.snapshotDailyRewards([miningHolder.address])).wait();
  const status = await mining.getDailyRewardStatus(miningHolder.address, rewardDay);
  assertEq(status.status, 1n, "Mining daily reward status");
  assertEq(status.reward, hre.ethers.parseEther("11"), "Mining referral-adjusted reward");

  await (await mining.connect(miningHolder).claimDaily()).wait();

  const dash = await mining.getVestingDashboard(miningHolder.address, 0);
  assertEq(dash.amount, hre.ethers.parseEther("11"), "Mining vesting claim amount");
  assertEq(dash.unlock30, hre.ethers.parseEther("1.1"), "Mining 30-day unlock");
  assertEq(dash.unlock60, hre.ethers.parseEther("0.55"), "Mining 60-day unlock");
  assertEq(dash.unlock90, hre.ethers.parseEther("0.55"), "Mining 90-day unlock");
  assertEq(dash.cyclePrincipal, hre.ethers.parseEther("8.8"), "Mining cycle principal");

  const cycle1 = await mining.getVestingCyclePreview(miningHolder.address, 0, 1);
  assertEq(cycle1.burnedAmount, hre.ethers.parseEther("0.88"), "Mining cycle-1 burn");
  assertEq(cycle1.rolloverAmount, hre.ethers.parseEther("6.16"), "Mining cycle-1 rollover");

  const finalPreview = await mining.previewFinalSettlement(miningHolder.address, 0);
  assertEq(
    finalPreview.burn60 + finalPreview.distribution40,
    finalPreview.principal,
    "Mining final settlement conservation"
  );

  // ---------------- Presale -> Staking smoke flow ----------------
  // Presale deploys fail-closed; owner explicitly opens it after deployment checks.
  assertEq(await presaleContract.paused(), true, "Presale deploys paused");
  await (await presaleContract.unpause()).wait();
  assertEq(await presaleContract.paused(), false, "Presale explicitly opened");
  // Staking user buys 200 ATH from Presale at opening price $0.07 = $14.00.
  const presalePaymentUnit = 1_000_000n;
  await (await presalePaymentToken.mint(stakingUser.address, 1_000n * presalePaymentUnit)).wait();
  await (await presalePaymentToken.connect(stakingUser).approve(
    await presaleContract.getAddress(),
    hre.ethers.MaxUint256
  )).wait();

  const presaleBuyATH = hre.ethers.parseEther("200");
  const presaleQuote = await presaleContract.quotePaymentForATH(presaleBuyATH);
  assertEq(presaleQuote, 14n * presalePaymentUnit, "Presale 200 ATH opening quote");

  const presaleTreasuryBefore = await presalePaymentToken.balanceOf(presale.address);
  await (await presaleContract.connect(stakingUser).buyATH(presaleBuyATH, presaleQuote)).wait();
  assertEq(
    (await presalePaymentToken.balanceOf(presale.address)) - presaleTreasuryBefore,
    presaleQuote,
    "Presale payment forwarded to treasury"
  );
  assertEq(await presaleContract.totalSoldATH(), presaleBuyATH, "Presale sold amount");
  assertEq(await presaleContract.currentPriceUSD8(), 7_000_000n, "Presale remains in first 100k tranche");

  await (await token.connect(stakingUser).approve(await staking.getAddress(), hre.ethers.parseEther("200"))).wait();

  const refBefore = await token.balanceOf(stakingReferrer.address);
  await (await staking.connect(stakingUser).stake(
    0,
    hre.ethers.parseEther("10"),
    stakingReferrer.address
  )).wait();

  const stakingPrincipalATH = 142857142857142857142n;
  const stakingDirectReferralATH = 14285714285714285714n;
  assertEq(await staking.principalLiabilityATH(), stakingPrincipalATH, "Staking principal liability");
  assertEq(
    (await token.balanceOf(stakingReferrer.address)) - refBefore,
    stakingDirectReferralATH,
    "Staking direct referral reward"
  );

  await increase(86400);
  const pendingStakingUSDT = await staking.getPendingRewardUSDT(stakingUser.address, 0);
  assertEq(pendingStakingUSDT, hre.ethers.parseEther("0.035"), "Staking Starter daily reward");

  const stakeUserBefore = await token.balanceOf(stakingUser.address);
  const stakingRefNetworkBefore = await token.balanceOf(stakingReferrer.address);
  await (await staking.connect(stakingUser).claimReward(0)).wait();

  assertEq(
    (await token.balanceOf(stakingUser.address)) - stakeUserBefore,
    500000000000000000n,
    "Staking $0.035 reward converts at the $0.07 Presale price"
  );
  assertEq(
    (await token.balanceOf(stakingReferrer.address)) - stakingRefNetworkBefore,
    40000000000000000n,
    "Staking level-1 network reward at the $0.07 Presale price"
  );

  const evidence = {
    network: "hardhat-local",
    miningVersion: "3.3",
    stakingVersion: "1.0",
    tokenomicsVersion: "2.0",
    token: await token.getAddress(),
    priceRegistry: await priceRegistry.getAddress(),
    presale: await presaleContract.getAddress(),
    mining: await mining.getAddress(),
    staking: await staking.getAddress(),
    stakingOracle: await oracle.getAddress(),
    developmentVesting: await developmentVesting.getAddress(),
    fixedSupplyATH: "1000000000",
    allocationsATH: {
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
    preListingReferencePrice: "PRESALE_LINKED",
    listingHolderTarget: "15000",
    presaleFlow: {
      allocationATH: "30000000",
      openingPriceUSD: "0.07",
      priceStepUSD: "0.001",
      stepSizeATH: "100000",
      soldOutPriceUSD: "0.37",
      purchasedATH: "200",
      paymentUSD: "14.00",
    },
    miningHolderFlow: {
      referralCount: "1",
      dailyRewardATH: hre.ethers.formatEther(status.reward),
      vestingAmountATH: hre.ethers.formatEther(dash.amount),
      cycle1BurnATH: hre.ethers.formatEther(cycle1.burnedAmount),
      cycle1RolloverATH: hre.ethers.formatEther(cycle1.rolloverAmount),
      finalPrincipalATH: hre.ethers.formatEther(finalPreview.principal),
      finalBurn60ATH: hre.ethers.formatEther(finalPreview.burn60),
      finalDistribution40ATH: hre.ethers.formatEther(finalPreview.distribution40),
    },
    stakingHolderFlow: {
      package: "Starter",
      stakeUSDT: "10",
      principalATH: "142.857142857142857142",
      directReferralATH: "14.285714285714285714",
      dailyRewardUSDT: "0.035",
      dailyRewardATH: "0.5",
      level1NetworkATH: "0.04",
      rankRule: "5 direct sponsors; small-leg = total direct-leg turnover - largest direct leg",
      rankPayoutUtc: "00:30 weekly after 7-day qualification",
      rankSalaryDuration: "LIFETIME",
      networkingBonusSource: "50M Marketing/network reserve",
    },
  };

  console.log("ATH Mining v3.3 + Presale + Staking v1 LOCAL RELEASE REHEARSAL PASSED");
  console.log(JSON.stringify(evidence, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
