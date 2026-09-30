const hre = require("hardhat");

function assertEq(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: got ${actual}, expected ${expected}`);
  }
}

async function main() {
  const [deployer, holder, referral, treasury, liquidity, team, marketing, child] =
    await hre.ethers.getSigners();

  const Token = await hre.ethers.getContractFactory("ATHToken");
  const token = await Token.deploy(deployer.address);
  await token.waitForDeployment();

  const Mining = await hre.ethers.getContractFactory("MiningAirdrop");
  const mining = await Mining.deploy(
    await token.getAddress(),
    treasury.address,
    deployer.address
  );
  await mining.waitForDeployment();

  const latest = await hre.ethers.provider.getBlock("latest");
  const releaseAt = Number(latest.timestamp) + 365 * 24 * 60 * 60;

  const Lock = await hre.ethers.getContractFactory("TeamTokenLock");
  const lock = await Lock.deploy(await token.getAddress(), team.address, releaseAt);
  await lock.waitForDeployment();

  const miningAllocation = hre.ethers.parseEther("700000000");
  const liquidityAllocation = hre.ethers.parseEther("200000000");
  const teamAllocation = hre.ethers.parseEther("50000000");
  const marketingAllocation = hre.ethers.parseEther("50000000");

  await (await token.transfer(await mining.getAddress(), miningAllocation)).wait();
  await (await token.transfer(liquidity.address, liquidityAllocation)).wait();
  await (await token.transfer(await lock.getAddress(), teamAllocation)).wait();
  await (await token.transfer(marketing.address, marketingAllocation)).wait();

  assertEq(await token.totalSupply(), hre.ethers.parseEther("1000000000"), "fixed supply");
  assertEq(await token.balanceOf(await mining.getAddress()), miningAllocation, "mining reserve");
  assertEq(await token.balanceOf(liquidity.address), liquidityAllocation, "liquidity reserve");
  assertEq(await token.balanceOf(await lock.getAddress()), teamAllocation, "team lock reserve");
  assertEq(await token.balanceOf(marketing.address), marketingAllocation, "marketing reserve");
  assertEq(await token.balanceOf(deployer.address), 0n, "deployer residual ATH");
  assertEq(await mining.MAX_VESTING_CYCLES(), 12n, "vesting cycles");
  assertEq(await mining.CYCLE_BURN_PCT(), 10n, "cycle burn");
  assertEq(await mining.FINAL_BURN_PCT(), 60n, "final burn");
  assertEq(await mining.CLAIM_OPEN_OFFSET(), 300n, "claim open offset");
  assertEq(await mining.MAX_KEEPER_BATCH(), 50n, "keeper batch cap");
  assertEq(await mining.MAX_MINER_PAGE(), 200n, "miner registry page cap");

  // Align local chain to a claimable UTC time (00:05 or later).
  const block = await hre.ethers.provider.getBlock("latest");
  const day = Math.floor(Number(block.timestamp) / 86400);
  const openAt = day * 86400 + 300;
  if (Number(block.timestamp) < openAt) {
    await hre.network.provider.send("evm_setNextBlockTimestamp", [openAt]);
    await hre.network.provider.send("evm_mine");
  }

  await (await mining.connect(referral).buyPower(hre.ethers.ZeroAddress, {
    value: hre.ethers.parseEther("0.001"),
  })).wait();
  await (await mining.connect(holder).buyPower(referral.address, {
    value: hre.ethers.parseEther("0.001"),
  })).wait();
  await (await mining.connect(child).buyPower(holder.address, {
    value: hre.ethers.parseEther("0.001"),
  })).wait();

  // Power purchased after today's 00:05 snapshot becomes eligible next UTC day.
  const afterPurchase = await hre.ethers.provider.getBlock("latest");
  const nextRewardDay = Math.floor(Number(afterPurchase.timestamp) / 86400) + 1;
  const nextOpen = nextRewardDay * 86400 + 300;
  await hre.network.provider.send("evm_setNextBlockTimestamp", [nextOpen]);
  await hre.network.provider.send("evm_mine");

  const rewardBlock = await hre.ethers.provider.getBlock("latest");
  const rewardDay = Math.floor(Number(rewardBlock.timestamp) / 86400);
  await (await mining.snapshotDailyRewards([holder.address])).wait();
  const status = await mining.getDailyRewardStatus(holder.address, rewardDay);
  assertEq(status.status, 1n, "daily reward status");
  assertEq(status.reward, hre.ethers.parseEther("1.1"), "referral-adjusted reward");

  await (await mining.connect(holder).claimDaily()).wait();

  const dash = await mining.getVestingDashboard(holder.address, 0);
  assertEq(dash.amount, hre.ethers.parseEther("1.1"), "vesting claim amount");
  assertEq(dash.unlock30, hre.ethers.parseEther("0.11"), "30-day unlock");
  assertEq(dash.unlock60, hre.ethers.parseEther("0.055"), "60-day unlock");
  assertEq(dash.unlock90, hre.ethers.parseEther("0.055"), "90-day unlock");
  assertEq(dash.cyclePrincipal, hre.ethers.parseEther("0.88"), "cycle principal");

  const cycle1 = await mining.getVestingCyclePreview(holder.address, 0, 1);
  assertEq(cycle1.burnedAmount, hre.ethers.parseEther("0.088"), "cycle-1 burn");
  assertEq(cycle1.rolloverAmount, hre.ethers.parseEther("0.616"), "cycle-1 rollover");

  const finalPreview = await mining.previewFinalSettlement(holder.address, 0);
  assertEq(
    finalPreview.burn60 + finalPreview.distribution40,
    finalPreview.principal,
    "final settlement conservation"
  );

  const evidence = {
    network: "hardhat-local",
    protocolVersion: "3.3",
    token: await token.getAddress(),
    mining: await mining.getAddress(),
    teamLock: await lock.getAddress(),
    fixedSupplyATH: "1000000000",
    allocationsATH: {
      mining: "700000000",
      liquidity: "200000000",
      teamLocked: "50000000",
      marketing: "50000000",
    },
    teamLockDays: 365,
    holderFlow: {
      referralCount: "1",
      dailyRewardATH: hre.ethers.formatEther(status.reward),
      vestingAmountATH: hre.ethers.formatEther(dash.amount),
      cycle1BurnATH: hre.ethers.formatEther(cycle1.burnedAmount),
      cycle1RolloverATH: hre.ethers.formatEther(cycle1.rolloverAmount),
      finalPrincipalATH: hre.ethers.formatEther(finalPreview.principal),
      finalBurn60ATH: hre.ethers.formatEther(finalPreview.burn60),
      finalDistribution40ATH: hre.ethers.formatEther(finalPreview.distribution40),
    },
  };

  console.log("ATH v3.3 LOCAL RELEASE REHEARSAL PASSED");
  console.log(JSON.stringify(evidence, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});