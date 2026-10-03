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

  // Deploy Mining with current reward and protocol pricing rules.
  const Mining = await hre.ethers.getContractFactory("MiningAirdrop");
  const mining = await Mining.deploy(
    await token.getAddress(),
    miningTreasury.address,
    deployer.address
  );
  await mining.waitForDeployment();

  // Staking accounting uses the unified ATH protocol price from Mining.
  const Oracle = await hre.ethers.getContractFactory("ATHStakingPriceOracle");
  const oracle = await Oracle.deploy(await mining.getAddress());
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

  await (await token.approve(await staking.getAddress(), stakingRewardPool)).wait();
  await (await staking.fundRewards(stakingRewardPool)).wait();

  await (await token.transfer(presale.address, presaleAllocation)).wait();
  await (await token.transfer(marketing.address, marketingAllocation)).wait();
  await (await token.transfer(await developmentVesting.getAddress(), developmentAllocation)).wait();
  await (await token.transfer(liquidity.address, liquidityAllocation)).wait();
  await (await token.transfer(stakingReserveWallet.address, reserveAllocation)).wait();

  assertEq(await token.totalSupply(), hre.ethers.parseEther("1000000000"), "fixed supply");
  assertEq(await token.balanceOf(await mining.getAddress()), miningAllocation, "Mining reserve");
  assertEq(await staking.rewardReserveATH(), stakingRewardPool, "Staking reward reserve");
  assertEq(await token.balanceOf(await developmentVesting.getAddress()), developmentAllocation, "Development vesting reserve");
  assertEq(await token.balanceOf(presale.address), presaleAllocation, "Staking presale allocation");
  assertEq(await token.balanceOf(marketing.address), marketingAllocation, "Staking marketing allocation");
  assertEq(await token.balanceOf(liquidity.address), liquidityAllocation, "Staking liquidity allocation");
  assertEq(await token.balanceOf(stakingReserveWallet.address), reserveAllocation, "Staking reserve allocation");
  assertEq(await token.balanceOf(deployer.address), 0n, "deployer residual ATH");
  assertEq(await oracle.getPrice(), 10_000_000n, "Unified ATH starting price $0.10");
  assertEq(await mining.MINING_POOL_ALLOCATION(), miningAllocation, "Mining allocation constant");
  assertEq(await mining.MAX_VESTING_CYCLES(), 12n, "Mining vesting cycles");
  assertEq(await mining.CYCLE_BURN_PCT(), 10n, "Mining cycle burn");
  assertEq(await mining.FINAL_BURN_PCT(), 60n, "Mining final burn");
  assertEq(await mining.CLAIM_OPEN_OFFSET(), 300n, "Mining claim open offset");
  assertEq(await mining.MAX_KEEPER_BATCH(), 50n, "Mining keeper batch cap");
  assertEq(await mining.MAX_MINER_PAGE(), 200n, "Mining miner registry page cap");

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

  // ---------------- Staking v1 smoke flow ----------------
  // Use 100 ATH from the Staking presale allocation to fund a $10 stake at $0.10/ATH.
  await (await token.connect(presale).transfer(stakingUser.address, hre.ethers.parseEther("100"))).wait();
  await (await token.connect(stakingUser).approve(await staking.getAddress(), hre.ethers.parseEther("100"))).wait();

  const refBefore = await token.balanceOf(stakingReferrer.address);
  await (await staking.connect(stakingUser).stake(
    0,
    hre.ethers.parseEther("10"),
    stakingReferrer.address
  )).wait();

  assertEq(await staking.principalLiabilityATH(), hre.ethers.parseEther("100"), "Staking principal liability");
  assertEq(
    (await token.balanceOf(stakingReferrer.address)) - refBefore,
    hre.ethers.parseEther("10"),
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
    hre.ethers.parseEther("0.35"),
    "Staking $0.035 reward converts to 0.35 ATH at $0.10"
  );
  assertEq(
    (await token.balanceOf(stakingReferrer.address)) - stakingRefNetworkBefore,
    hre.ethers.parseEther("0.028"),
    "Staking level-1 network reward"
  );

  const evidence = {
    network: "hardhat-local",
    miningVersion: "3.3",
    stakingVersion: "1.0",
    tokenomicsVersion: "2.0",
    token: await token.getAddress(),
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
        marketing: "50000000",
        developmentVesting: "30000000",
        liquidity: "20000000",
        reserve: "10000000",
      },
    },
    stakingReferencePriceUSD: "0.10",
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
      principalATH: "100",
      directReferralATH: "10",
      dailyRewardUSDT: "0.035",
      dailyRewardATH: "0.35",
      level1NetworkATH: "0.028",
    },
  };

  console.log("ATH Mining v3.3 + Staking v1 LOCAL RELEASE REHEARSAL PASSED");
  console.log(JSON.stringify(evidence, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
