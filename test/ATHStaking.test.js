const { expect } = require("chai");
const { ethers } = require("hardhat");

const DAY = 24 * 60 * 60;
const MONTH = 30 * DAY;
const PRICE_007 = 7_000_000n;
const PRICE_0071 = 7_100_000n;

function athForUsd(usd18, price8) {
  return (usd18 * 100_000_000n) / price8;
}

async function increase(seconds) {
  await ethers.provider.send("evm_increaseTime", [seconds]);
  await ethers.provider.send("evm_mine", []);
}

async function setNextTimestamp(timestamp) {
  await ethers.provider.send("evm_setNextBlockTimestamp", [Number(timestamp)]);
  await ethers.provider.send("evm_mine", []);
}

async function advanceToRewardSlot(staking, account, stakeId, extraDays = 0) {
  const schedule = await staking.getRewardSchedule(account, stakeId);
  const target = Number(schedule.nextRewardAt) + (extraDays * DAY);
  await setNextTimestamp(target);
}

describe("AETHER ATH Staking v1", function () {
  let signers;
  let owner, user, referrer, second, treasury, presaleBuyer, leg1, leg2, leg3, leg4, leg5, keeper;
  let token, stable, presale, priceRegistry, oracle, staking;

  beforeEach(async function () {
    signers = await ethers.getSigners();
    [
      owner, user, referrer, second, treasury, presaleBuyer,
      leg1, leg2, leg3, leg4, leg5, keeper
    ] = signers;

    const Token = await ethers.getContractFactory("ATHToken");
    token = await Token.deploy(owner.address);
    await token.waitForDeployment();

    const Stable = await ethers.getContractFactory("MockStablecoin");
    stable = await Stable.deploy(6);
    await stable.waitForDeployment();

    const Presale = await ethers.getContractFactory("ATHPresale");
    presale = await Presale.deploy(
      await token.getAddress(),
      await stable.getAddress(),
      treasury.address,
      owner.address
    );
    await presale.waitForDeployment();
    await token.transfer(await presale.getAddress(), ethers.parseEther("30000000"));

    await stable.mint(presaleBuyer.address, 100_000_000n * 1_000_000n);
    await stable.connect(presaleBuyer).approve(await presale.getAddress(), ethers.MaxUint256);

    const Registry = await ethers.getContractFactory("ATHPriceRegistry");
    priceRegistry = await Registry.deploy(await presale.getAddress(), owner.address);
    await priceRegistry.waitForDeployment();

    const Oracle = await ethers.getContractFactory("ATHStakingPriceOracle");
    oracle = await Oracle.deploy(await priceRegistry.getAddress());
    await oracle.waitForDeployment();

    const Staking = await ethers.getContractFactory("ATHStaking");
    staking = await Staking.deploy(
      await token.getAddress(),
      await oracle.getAddress(),
      owner.address
    );
    await staking.waitForDeployment();

    for (const signer of [user, referrer, second, leg1, leg2, leg3, leg4, leg5]) {
      await token.transfer(signer.address, ethers.parseEther("6000000"));
      await token.connect(signer).approve(await staking.getAddress(), ethers.MaxUint256);
    }

    await token.approve(await staking.getAddress(), ethers.MaxUint256);
    await staking.fundRewards(ethers.parseEther("160000000"));
    await staking.fundNetworkReserve(ethers.parseEther("50000000"));
    expect(await staking.paused()).to.equal(true);
    await staking.unpause();
  });

  it("deploys PAUSED/fail-closed and only the owner can explicitly open Staking", async function () {
    const Staking = await ethers.getContractFactory("ATHStaking");
    const fresh = await Staking.deploy(
      await token.getAddress(),
      await oracle.getAddress(),
      owner.address
    );
    await fresh.waitForDeployment();

    expect(await fresh.paused()).to.equal(true);
    await expect(
      fresh.connect(user).stake(0, ethers.parseEther("10"), ethers.ZeroAddress)
    ).to.be.revertedWithCustomError(fresh, "EnforcedPause");

    await expect(fresh.connect(user).unpause())
      .to.be.revertedWithCustomError(fresh, "OwnableUnauthorizedAccount")
      .withArgs(user.address);

    await expect(fresh.connect(owner).unpause())
      .to.be.revertedWithCustomError(fresh, "StakingOpeningNotReady");

    await token.connect(owner).approve(await fresh.getAddress(), ethers.MaxUint256);
    await fresh.connect(owner).fundRewards(ethers.parseEther("160000000"));
    await expect(fresh.connect(owner).unpause())
      .to.be.revertedWithCustomError(fresh, "StakingOpeningNotReady");

    await fresh.connect(owner).fundNetworkReserve(ethers.parseEther("50000000"));
    await fresh.connect(owner).unpause();
    expect(await fresh.paused()).to.equal(false);
  });

  it("keeps ATH fixed at 1B while Staking follows the Presale opening price $0.070", async function () {
    expect(await token.totalSupply()).to.equal(ethers.parseEther("1000000000"));
    expect(await presale.currentPriceUSD8()).to.equal(PRICE_007);
    expect(await priceRegistry.getPrice()).to.equal(PRICE_007);
    expect(await oracle.getPrice()).to.equal(PRICE_007);
    expect(await staking.getATHAmount(ethers.parseEther("10"))).to.equal(
      athForUsd(ethers.parseEther("10"), PRICE_007)
    );
    expect(await staking.STAKING_ECOSYSTEM_ALLOCATION()).to.equal(
      ethers.parseEther("300000000")
    );
  });

  it("immediately follows the Presale price after 100,000 ATH are sold", async function () {
    const before = await staking.getATHAmount(ethers.parseEther("10"));
    expect(before).to.equal(athForUsd(ethers.parseEther("10"), PRICE_007));

    await presale.connect(owner).unpause();
    const amount = ethers.parseEther("100000");
    const quote = await presale.quotePaymentForATH(amount);
    await presale.connect(presaleBuyer).buyATH(amount, quote);

    expect(await presale.currentPriceUSD8()).to.equal(PRICE_0071);
    expect(await priceRegistry.getPrice()).to.equal(PRICE_0071);
    expect(await oracle.getPrice()).to.equal(PRICE_0071);
    expect(await staking.getATHAmount(ethers.parseEther("10"))).to.equal(
      athForUsd(ethers.parseEther("10"), PRICE_0071)
    );
  });

  it("loads the six blueprint staking packages", async function () {
    expect(await staking.packageCount()).to.equal(6n);
    const expected = [
      ["10", "99", 35n, 180n],
      ["100", "499", 45n, 180n],
      ["500", "1999", 55n, 365n],
      ["2000", "9999", 65n, 365n],
      ["10000", "49999", 75n, 730n],
    ];

    for (let i = 0; i < expected.length; i++) {
      const pkg = await staking.packages(i);
      expect(pkg.minUSDT).to.equal(ethers.parseEther(expected[i][0]));
      expect(pkg.maxUSDT).to.equal(ethers.parseEther(expected[i][1]));
      expect(pkg.dailyRateBps).to.equal(expected[i][2]);
      expect(pkg.lockDays).to.equal(expected[i][3]);
      expect(pkg.active).to.equal(true);
    }

    const diamond = await staking.packages(5);
    expect(diamond.minUSDT).to.equal(ethers.parseEther("50000"));
    expect(diamond.dailyRateBps).to.equal(85n);
    expect(diamond.lockDays).to.equal(730n);
  });

  it("assigns globally unique Staking Contract IDs and exposes the member owner/package snapshot", async function () {
    await staking.connect(user).stake(0, ethers.parseEther("10"), ethers.ZeroAddress);
    await staking.connect(user).stake(1, ethers.parseEther("100"), ethers.ZeroAddress);
    await staking.connect(second).stake(0, ethers.parseEther("20"), ethers.ZeroAddress);

    expect(await staking.totalStakingContracts()).to.equal(3n);
    expect(await staking.totalActiveStakingContracts()).to.equal(3n);
    expect(await staking.totalInactiveStakingContracts()).to.equal(0n);
    expect(await staking.totalStakingMembers()).to.equal(2n);
    expect(await staking.activeStakingMembers()).to.equal(2n);

    expect(await staking.stakingContractId(user.address, 0)).to.equal(1n);
    expect(await staking.stakingContractId(user.address, 1)).to.equal(2n);
    expect(await staking.stakingContractId(second.address, 0)).to.equal(3n);

    const c1 = await staking.getStakingContract(1);
    expect(c1.account).to.equal(user.address);
    expect(c1.stakeId).to.equal(0n);
    expect(c1.packageId).to.equal(0n);
    expect(c1.amountUSDT).to.equal(ethers.parseEther("10"));
    expect(c1.principalATH).to.equal(athForUsd(ethers.parseEther("10"), PRICE_007));
    expect(c1.dailyRateBps).to.equal(35n);
    expect(c1.lockDays).to.equal(180n);
    expect(c1.active).to.equal(true);
    expect(c1.principalWithdrawn).to.equal(false);

    const starter = await staking.getPackageContractStats(0);
    expect(starter.totalContracts).to.equal(2n);
    expect(starter.activeContracts).to.equal(2n);
    expect(starter.inactiveContracts).to.equal(0n);

    const basic = await staking.getPackageContractStats(1);
    expect(basic.totalContracts).to.equal(1n);
    expect(basic.activeContracts).to.equal(1n);
    expect(basic.inactiveContracts).to.equal(0n);
  });

  it("moves closed member contracts from ACTIVE to N-ACTIVE without changing Package IDs", async function () {
    await staking.connect(user).stake(0, ethers.parseEther("10"), ethers.ZeroAddress);
    await staking.connect(user).stake(1, ethers.parseEther("100"), ethers.ZeroAddress);
    await staking.connect(second).stake(0, ethers.parseEther("20"), ethers.ZeroAddress);

    expect(await staking.activeContractCountByMember(user.address)).to.equal(2n);
    expect(await staking.activeStakingMembers()).to.equal(2n);

    await increase(180 * DAY);
    await staking.connect(user).withdrawPrincipal(0);

    expect(await staking.totalStakingContracts()).to.equal(3n);
    expect(await staking.totalActiveStakingContracts()).to.equal(2n);
    expect(await staking.totalInactiveStakingContracts()).to.equal(1n);
    expect(await staking.activeContractCountByMember(user.address)).to.equal(1n);
    expect(await staking.activeStakingMembers()).to.equal(2n);

    let starter = await staking.getPackageContractStats(0);
    expect(starter.totalContracts).to.equal(2n);
    expect(starter.activeContracts).to.equal(1n);
    expect(starter.inactiveContracts).to.equal(1n);

    const closed = await staking.getStakingContract(1);
    expect(closed.active).to.equal(false);
    expect(closed.principalWithdrawn).to.equal(true);
    expect(closed.packageId).to.equal(0n);

    await staking.connect(user).withdrawPrincipal(1);
    expect(await staking.activeContractCountByMember(user.address)).to.equal(0n);
    expect(await staking.activeStakingMembers()).to.equal(1n);

    const basic = await staking.getPackageContractStats(1);
    expect(basic.totalContracts).to.equal(1n);
    expect(basic.activeContracts).to.equal(0n);
    expect(basic.inactiveContracts).to.equal(1n);
  });

  it("keeps principal liability separate from reward and network/marketing reserves", async function () {
    const rewardBefore = await staking.rewardReserveATH();
    const networkBefore = await staking.networkReserveATH();
    const principal = athForUsd(ethers.parseEther("10"), PRICE_007);
    await staking.connect(user).stake(0, ethers.parseEther("10"), ethers.ZeroAddress);

    expect(await staking.principalLiabilityATH()).to.equal(principal);
    expect(await staking.rewardReserveATH()).to.equal(rewardBefore);
    expect(await staking.networkReserveATH()).to.equal(networkBefore);
    expect(await token.balanceOf(await staking.getAddress())).to.equal(
      rewardBefore + networkBefore + principal
    );
  });

  it("pays the 10% direct referral from the 50M marketing/network reserve, not reward reserve or principal", async function () {
    const rewardBefore = await staking.rewardReserveATH();
    const networkBefore = await staking.networkReserveATH();
    const principal = athForUsd(ethers.parseEther("10"), PRICE_007);
    const expectedReferral = (principal * 1_000n) / 10_000n;
    const refBefore = await token.balanceOf(referrer.address);

    await staking.connect(user).stake(0, ethers.parseEther("10"), referrer.address);

    expect(await token.balanceOf(referrer.address) - refBefore).to.equal(expectedReferral);
    expect(await staking.principalLiabilityATH()).to.equal(principal);
    expect(await staking.rewardReserveATH()).to.equal(rewardBefore);
    expect(await staking.networkReserveATH()).to.equal(networkBefore - expectedReferral);
  });

  it("credits one daily Staking reward only at the 00:50 UTC reward slot", async function () {
    await staking.connect(user).stake(0, ethers.parseEther("10"), ethers.ZeroAddress);
    const schedule = await staking.getRewardSchedule(user.address, 0);
    expect(schedule.firstRewardAt % BigInt(DAY)).to.equal(3000n);
    expect(schedule.totalRewardDays).to.equal(180n);

    await setNextTimestamp(schedule.firstRewardAt - 1n);
    expect(await staking.getPendingRewardUSDT(user.address, 0)).to.equal(0n);

    await setNextTimestamp(schedule.firstRewardAt);
    expect(await staking.getPendingRewardUSDT(user.address, 0)).to.equal(
      ethers.parseEther("0.035")
    );

    const before = await token.balanceOf(user.address);
    await staking.connect(user).claimReward(0);
    expect(await token.balanceOf(user.address) - before).to.equal(
      athForUsd(ethers.parseEther("0.035"), PRICE_007)
    );

    const afterClaim = await staking.getRewardSchedule(user.address, 0);
    await setNextTimestamp(afterClaim.nextRewardAt - 1n);
    expect(await staking.getPendingRewardUSDT(user.address, 0)).to.equal(0n);
    await setNextTimestamp(afterClaim.nextRewardAt);
    expect(await staking.getPendingRewardUSDT(user.address, 0)).to.equal(
      ethers.parseEther("0.035")
    );
  });

  it("allows a permissionless 00:50 keeper to settle holder reward and Lifestyle Bonus / Matching Staking in real time", async function () {
    await staking.connect(user).stake(0, ethers.parseEther("10"), referrer.address);
    await advanceToRewardSlot(staking, user.address, 0);

    const rewardATH = athForUsd(ethers.parseEther("0.035"), PRICE_007);
    const networkATH = (rewardATH * 800n) / 10_000n;
    const userBefore = await token.balanceOf(user.address);
    const refBefore = await token.balanceOf(referrer.address);

    await expect(staking.connect(keeper).processDailyReward(user.address, 0))
      .to.emit(staking, "LifestyleMatchingStakingPaid")
      .withArgs(referrer.address, user.address, 1n, networkATH);

    expect((await token.balanceOf(user.address)) - userBefore).to.equal(rewardATH);
    expect((await token.balanceOf(referrer.address)) - refBefore).to.equal(networkATH);
    expect(await staking.getPendingRewardUSDT(user.address, 0)).to.equal(0n);
  });

  it("batch-settles multiple due positions at the 00:50 slot", async function () {
    await staking.connect(user).stake(0, ethers.parseEther("10"), ethers.ZeroAddress);
    await staking.connect(second).stake(0, ethers.parseEther("10"), ethers.ZeroAddress);

    const s1 = await staking.getRewardSchedule(user.address, 0);
    const s2 = await staking.getRewardSchedule(second.address, 0);
    const target = s1.nextRewardAt > s2.nextRewardAt ? s1.nextRewardAt : s2.nextRewardAt;
    await setNextTimestamp(target);

    expect(
      await staking.connect(keeper).processDailyRewardBatch.staticCall(
        [user.address, second.address],
        [0, 0]
      )
    ).to.equal(2n);

    await staking.connect(keeper).processDailyRewardBatch(
      [user.address, second.address],
      [0, 0]
    );
    expect(await staking.getPendingRewardUSDT(user.address, 0)).to.equal(0n);
    expect(await staking.getPendingRewardUSDT(second.address, 0)).to.equal(0n);
  });

  it("distributes Lifestyle Bonus / Matching Staking level 1 at 8% of the user's daily reward", async function () {
    await staking.connect(user).stake(0, ethers.parseEther("10"), referrer.address);
    await advanceToRewardSlot(staking, user.address, 0);

    const rewardATH = athForUsd(ethers.parseEther("0.035"), PRICE_007);
    const expectedNetwork = (rewardATH * 800n) / 10_000n;
    const refBefore = await token.balanceOf(referrer.address);
    await staking.connect(user).claimReward(0);

    expect((await token.balanceOf(referrer.address)) - refBefore).to.equal(expectedNetwork);
    expect((await staking.userInfo(referrer.address)).totalNetworkEarnedATH).to.equal(
      expectedNetwork
    );
  });

  it("exposes Lifestyle Bonus / Matching Staking aliases without changing the locked rates", async function () {
    const expected = [800n, 500n, 300n, 200n, 100n, 50n, 50n, 50n, 50n, 50n];
    for (let level = 1; level <= 10; level++) {
      expect(await staking.lifestyleMatchingRateBps(level)).to.equal(expected[level - 1]);
      expect(await staking.networkRates(level - 1)).to.equal(expected[level - 1]);
    }
    expect(await staking.totalLifestyleMatchingPaidATH()).to.equal(
      await staking.totalNetworkPaidATH()
    );
  });

  it("distributes the complete 10-level Lifestyle Bonus / Matching Staking schedule 8/5/3/2/1/0.5x5", async function () {
    const chain = signers.slice(1, 12);
    for (const member of chain) {
      await token.transfer(member.address, ethers.parseEther("1000000"));
      await token.connect(member).approve(await staking.getAddress(), ethers.MaxUint256);
    }

    await staking.connect(chain[0]).stake(0, ethers.parseEther("10"), ethers.ZeroAddress);
    for (let i = 1; i < chain.length; i++) {
      await staking.connect(chain[i]).stake(0, ethers.parseEther("10"), chain[i - 1].address);
    }

    const leaf = chain[10];
    await advanceToRewardSlot(staking, leaf.address, 0);
    const uplines = chain.slice(0, 10).reverse();
    const before = await Promise.all(uplines.map((u) => token.balanceOf(u.address)));

    const rewardATH = athForUsd(ethers.parseEther("0.035"), PRICE_007);
    const rates = [800n, 500n, 300n, 200n, 100n, 50n, 50n, 50n, 50n, 50n];

    await staking.connect(leaf).claimReward(0);

    for (let i = 0; i < 10; i++) {
      const after = await token.balanceOf(uplines[i].address);
      const expected = (rewardATH * rates[i]) / 10_000n;
      expect(after - before[i]).to.equal(expected);
    }
  });

  it("snapshots package economics so later admin edits do not rewrite existing stakes", async function () {
    await staking.connect(user).stake(0, ethers.parseEther("10"), ethers.ZeroAddress);
    await staking.updatePackage(
      0,
      ethers.parseEther("10"),
      ethers.parseEther("99"),
      100,
      30,
      true
    );

    const position = await staking.userStakes(user.address, 0);
    expect(position.dailyRateBps).to.equal(35n);
    expect(position.lockDays).to.equal(180n);

    await advanceToRewardSlot(staking, user.address, 0);
    expect(await staking.getPendingRewardUSDT(user.address, 0)).to.equal(
      ethers.parseEther("0.035")
    );
  });

  it("returns the exact ATH principal after lock without erasing accrued reward", async function () {
    const principal = athForUsd(ethers.parseEther("10"), PRICE_007);
    await staking.connect(user).stake(0, ethers.parseEther("10"), ethers.ZeroAddress);

    await expect(staking.connect(user).withdrawPrincipal(0)).to.be.revertedWith("still locked");

    await increase(180 * DAY);
    const before = await token.balanceOf(user.address);
    await staking.connect(user).withdrawPrincipal(0);
    expect((await token.balanceOf(user.address)) - before).to.equal(principal);
    expect(await staking.principalLiabilityATH()).to.equal(0n);

    const schedule = await staking.getRewardSchedule(user.address, 0);
    const now = BigInt((await ethers.provider.getBlock("latest")).timestamp);
    if (now < schedule.lastRewardAt) await setNextTimestamp(schedule.lastRewardAt);
    expect(await staking.getPendingRewardUSDT(user.address, 0)).to.equal(
      ethers.parseEther("6.3")
    );
    const rewardBefore = await token.balanceOf(user.address);
    await staking.connect(user).claimReward(0);
    expect((await token.balanceOf(user.address)) - rewardBefore).to.equal(
      athForUsd(ethers.parseEther("6.3"), PRICE_007)
    );
  });

  it("rejects referral cycles", async function () {
    await staking.connect(user).stake(0, ethers.parseEther("10"), referrer.address);
    await expect(
      staking.connect(referrer).stake(0, ethers.parseEther("10"), user.address)
    ).to.be.revertedWith("referral cycle");
  });

  it("caps cumulative reward funding at 160M ATH", async function () {
    const Staking = await ethers.getContractFactory("ATHStaking");
    const fresh = await Staking.deploy(
      await token.getAddress(),
      await oracle.getAddress(),
      owner.address
    );
    await fresh.waitForDeployment();
    await token.approve(await fresh.getAddress(), ethers.MaxUint256);

    await fresh.fundRewards(ethers.parseEther("160000000"));
    expect(await fresh.totalRewardFundedATH()).to.equal(
      ethers.parseEther("160000000")
    );
    await expect(fresh.fundRewards(1n)).to.be.revertedWith("reward pool cap");
  });

  it("caps all networking bonus funding at the fixed 50M ATH marketing allocation", async function () {
    const Staking = await ethers.getContractFactory("ATHStaking");
    const fresh = await Staking.deploy(
      await token.getAddress(),
      await oracle.getAddress(),
      owner.address
    );
    await fresh.waitForDeployment();
    await token.approve(await fresh.getAddress(), ethers.MaxUint256);

    await fresh.fundNetworkReserve(ethers.parseEther("50000000"));
    expect(await fresh.networkReserveATH()).to.equal(ethers.parseEther("50000000"));
    expect(await fresh.totalNetworkFundedATH()).to.equal(ethers.parseEther("50000000"));
    await expect(fresh.fundNetworkReserve(1n)).to.be.revertedWith("network pool cap");
  });

  it("only permits recovery of ATH above protected principal + reward reserve", async function () {
    await staking.connect(user).stake(0, ethers.parseEther("10"), ethers.ZeroAddress);
    await token.transfer(await staking.getAddress(), ethers.parseEther("5"));
    expect(await staking.availableExcessATH()).to.equal(ethers.parseEther("5"));

    await staking.pause();
    await expect(
      staking.recoverExcessATH(treasury.address, ethers.parseEther("6"))
    ).to.be.revertedWith("protected balance");

    await staking.recoverExcessATH(treasury.address, ethers.parseEther("5"));
    expect(await staking.availableExcessATH()).to.equal(0n);
  });

  it("locks the eight final rank thresholds and weekly salaries", async function () {
    const thresholds = ["1000","5000","15000","50000","100000","250000","500000","1000000"];
    const salaries = ["25","75","200","500","1000","2000","5000","10000"];
    for (let i = 0; i < 8; i++) {
      expect(await staking.rankSmallLegThresholdUSDT(i)).to.equal(ethers.parseEther(thresholds[i]));
      expect(await staking.rankWeeklySalaryUSDT(i)).to.equal(ethers.parseEther(salaries[i]));
    }
    expect(await staking.MIN_DIRECT_SPONSORS_FOR_RANK()).to.equal(5n);
  });

  it("calculates the user's five-leg example dynamically: 900 big leg and 3,539 small leg", async function () {
    const legs = [leg1, leg2, leg3, leg4, leg5];
    const values = ["900","899","890","880","870"];

    for (let i = 0; i < legs.length; i++) {
      await staking.connect(legs[i]).stake(2, ethers.parseEther(values[i]), user.address);
    }

    const snapshot = await staking.getSmallLegTurnoverUSDT(user.address);
    expect(snapshot.totalTurnover).to.equal(ethers.parseEther("4439"));
    expect(snapshot.largestTurnover).to.equal(ethers.parseEther("900"));
    expect(snapshot.smallLegTurnover).to.equal(ethers.parseEther("3539"));
    expect(snapshot.bigLeg).to.equal(leg1.address);
    expect(await staking.directSponsorCount(user.address)).to.equal(5n);
    expect(await staking.getEligibleRank(user.address)).to.equal(1n);
    expect((await staking.rankInfo(user.address)).highestRank).to.equal(1n);
    expect(await staking.totalRankMembers()).to.equal(1n);
    expect(await staking.isRankMember(user.address)).to.equal(true);
    expect(await staking.getRankMembers(0, 200)).to.deep.equal([user.address]);
    expect(await staking.totalDirectLegs(user.address)).to.equal(5n);
    expect(await staking.getDirectLegMembers(user.address, 0, 200)).to.deep.equal(legs.map(x => x.address));
    expect(await staking.totalWeeklyRankSalaryUSDT()).to.equal(ethers.parseEther("25"));
  });

  it("requires at least five direct sponsors even if four legs already meet small-leg turnover", async function () {
    for (const leg of [leg1, leg2, leg3, leg4]) {
      await staking.connect(leg).stake(2, ethers.parseEther("500"), user.address);
    }
    expect((await staking.getSmallLegTurnoverUSDT(user.address)).smallLegTurnover)
      .to.equal(ethers.parseEther("1500"));
    expect(await staking.getEligibleRank(user.address)).to.equal(0n);

    await staking.connect(leg5).stake(2, ethers.parseEther("500"), user.address);
    expect(await staking.directSponsorCount(user.address)).to.equal(5n);
    expect(await staking.getEligibleRank(user.address)).to.equal(1n);
  });

  it("changes the big leg dynamically when another direct leg overtakes it", async function () {
    const legs = [leg1, leg2, leg3, leg4, leg5];
    const values = ["900","899","890","880","870"];
    for (let i = 0; i < legs.length; i++) {
      await staking.connect(legs[i]).stake(2, ethers.parseEther(values[i]), user.address);
    }

    expect((await staking.getSmallLegTurnoverUSDT(user.address)).bigLeg).to.equal(leg1.address);

    await staking.connect(leg2).stake(1, ethers.parseEther("100"), user.address);
    const snapshot = await staking.getSmallLegTurnoverUSDT(user.address);
    expect(snapshot.bigLeg).to.equal(leg2.address);
    expect(snapshot.largestTurnover).to.equal(ethers.parseEther("999"));
    expect(snapshot.smallLegTurnover).to.equal(ethers.parseEther("3540"));
  });

  it("locks Rank Sponsor Bonus rates at 13/16/19/22/25/28/31/35 percent", async function () {
    const expected = [1300n, 1600n, 1900n, 2200n, 2500n, 2800n, 3100n, 3500n];
    for (let i = 0; i < expected.length; i++) {
      expect(await staking.rankSponsorBonusBps(i)).to.equal(expected[i]);
    }
  });

  it("treats Rank Sponsor rates as total Direct Referral rates inclusive of the common 10%", async function () {
    // Bind Rank-1 candidate (user) under future Rank-2 upline (referrer).
    await staking.connect(user).stake(0, ethers.parseEther("10"), referrer.address);

    // user -> Rank 1: small-leg = 1,000 (300 + 250 + 250 + 250 + 250; largest 300).
    const userLegs = [leg1, leg2, leg3, leg4, leg5];
    const userValues = ["300","250","250","250","250"];
    for (let i = 0; i < userLegs.length; i++) {
      await staking.connect(userLegs[i]).stake(1, ethers.parseEther(userValues[i]), user.address);
    }
    expect((await staking.rankInfo(user.address)).highestRank).to.equal(1n);

    // referrer -> Rank 2. Its A-leg already carries the user subtree;
    // five more direct legs bring small-leg turnover above $5,000 but below $15,000.
    const extraA = signers[12];
    const extraB = signers[13];
    for (const signer of [presaleBuyer, keeper, treasury, extraA, extraB]) {
      await token.transfer(signer.address, ethers.parseEther("100000"));
      await token.connect(signer).approve(await staking.getAddress(), ethers.MaxUint256);
    }
    const r2Legs = [second, presaleBuyer, keeper, treasury, extraA];
    const r2Values = ["1500","1000","1000","1000","1000"];
    for (let i = 0; i < r2Legs.length; i++) {
      await staking.connect(r2Legs[i]).stake(2, ethers.parseEther(r2Values[i]), referrer.address);
    }
    expect((await staking.rankInfo(referrer.address)).highestRank).to.equal(2n);

    // Fresh personally sponsored member under Rank 1.
    await token.transfer(extraB.address, ethers.parseEther("10000"));
    await token.connect(extraB).approve(await staking.getAddress(), ethers.MaxUint256);

    const principal = athForUsd(ethers.parseEther("100"), PRICE_007);
    const rank1Total = (principal * 1300n) / 10_000n;
    const rank1Uplift = (principal * 300n) / 10_000n;
    const rank2Diff = (principal * 300n) / 10_000n;

    const userBefore = await token.balanceOf(user.address);
    const refBefore = await token.balanceOf(referrer.address);
    const userRankEarnedBefore = await staking.rankSponsorEarnedATH(user.address);
    const refRankEarnedBefore = await staking.rankSponsorEarnedATH(referrer.address);
    const totalRankSponsorBefore = await staking.totalRankSponsorPaidATH();
    const reserveBefore = await staking.networkReserveATH();

    await staking.connect(extraB).stake(1, ethers.parseEther("100"), user.address);

    expect((await token.balanceOf(user.address)) - userBefore).to.equal(rank1Total);
    expect((await token.balanceOf(referrer.address)) - refBefore).to.equal(rank2Diff);
    expect((await staking.rankSponsorEarnedATH(user.address)) - userRankEarnedBefore).to.equal(rank1Uplift);
    expect((await staking.rankSponsorEarnedATH(referrer.address)) - refRankEarnedBefore).to.equal(rank2Diff);
    expect((await staking.totalRankSponsorPaidATH()) - totalRankSponsorBefore).to.equal(rank1Uplift + rank2Diff);
    expect(reserveBefore - (await staking.networkReserveATH())).to.equal(
      rank1Total + rank2Diff
    );
  });

  it("skips the same Rank but continues pass-up to a higher Rank", async function () {
    // Build hierarchy: referrer (future R2) -> second (future R1) -> user (future R1).
    await staking.connect(second).stake(0, ethers.parseEther("10"), referrer.address);
    await staking.connect(user).stake(0, ethers.parseEther("10"), second.address);

    // user -> Rank 1.
    const userLegs = [leg1, leg2, leg3, leg4, leg5];
    const userValues = ["300","250","250","250","250"];
    for (let i = 0; i < userLegs.length; i++) {
      await staking.connect(userLegs[i]).stake(1, ethers.parseEther(userValues[i]), user.address);
    }
    expect((await staking.rankInfo(user.address)).highestRank).to.equal(1n);

    // second -> Rank 1 using user as its big leg plus four direct legs.
    const midLegs = signers.slice(12, 16);
    for (const signer of midLegs) {
      await token.transfer(signer.address, ethers.parseEther("10000"));
      await token.connect(signer).approve(await staking.getAddress(), ethers.MaxUint256);
      await staking.connect(signer).stake(1, ethers.parseEther("300"), second.address);
    }
    expect((await staking.rankInfo(second.address)).highestRank).to.equal(1n);

    // referrer -> Rank 2 using second as one direct leg plus four additional direct legs.
    const topLegs = signers.slice(16, 20);
    for (const signer of topLegs) {
      await token.transfer(signer.address, ethers.parseEther("50000"));
      await token.connect(signer).approve(await staking.getAddress(), ethers.MaxUint256);
      await staking.connect(signer).stake(2, ethers.parseEther("1500"), referrer.address);
    }
    expect((await staking.rankInfo(referrer.address)).highestRank).to.equal(2n);

    // Bind a new personally sponsored member under user (R1).
    await token.transfer(treasury.address, ethers.parseEther("10000"));
    await token.connect(treasury).approve(await staking.getAddress(), ethers.MaxUint256);
    await staking.connect(treasury).stake(0, ethers.parseEther("10"), user.address);

    const principal = athForUsd(ethers.parseEther("100"), PRICE_007);
    const directR1Total = (principal * 1300n) / 10_000n;
    const r2Differential = (principal * 300n) / 10_000n;
    const directR1Uplift = (principal * 300n) / 10_000n;
    const expectedPathTotal = directR1Total + r2Differential;
    const expectedRankUplift = directR1Uplift + r2Differential;

    const preview = await staking.previewReferralPassUp(treasury.address, principal);
    expect(preview.directSponsorATH).to.equal(directR1Total);
    expect(preview.totalReferralPathATH).to.equal(expectedPathTotal);
    expect(preview.rankUpliftATH).to.equal(expectedRankUplift);
    expect(preview.highestPaidRank).to.equal(2n);
    expect(preview.firstSameRankSkippedAt).to.equal(second.address);

    const userBefore = await token.balanceOf(user.address);
    const secondBefore = await token.balanceOf(second.address);
    const topBefore = await token.balanceOf(referrer.address);
    const referralBefore = await staking.totalReferralPaidATH();
    const rankBefore = await staking.totalRankSponsorPaidATH();
    const reserveBefore = await staking.networkReserveATH();

    await expect(staking.connect(treasury).stake(1, ethers.parseEther("100"), user.address))
      .to.emit(staking, "RankSponsorSameRankSkipped")
      .withArgs(second.address, treasury.address, 1n);

    // Direct R1 receives 13% total. The same R1 above receives nothing.
    // Pass-up then continues and R2 receives the +3% differential.
    expect((await token.balanceOf(user.address)) - userBefore).to.equal(directR1Total);
    expect((await token.balanceOf(second.address)) - secondBefore).to.equal(0n);
    expect((await token.balanceOf(referrer.address)) - topBefore).to.equal(r2Differential);
    expect((await staking.totalReferralPaidATH()) - referralBefore).to.equal(directR1Total);
    expect((await staking.totalRankSponsorPaidATH()) - rankBefore).to.equal(expectedRankUplift);
    expect(reserveBefore - (await staking.networkReserveATH())).to.equal(expectedPathTotal);
  });

  it("caps a ranked direct sponsor at 35% total including the common 10% referral", async function () {
    const legs = [leg1, leg2, leg3, leg4, leg5];
    const values = ["300000","250000","250000","250000","250000"];
    for (let i = 0; i < legs.length; i++) {
      await staking.connect(legs[i]).stake(5, ethers.parseEther(values[i]), user.address);
    }
    expect((await staking.rankInfo(user.address)).highestRank).to.equal(8n);

    const newcomer = signers[12];
    await token.transfer(newcomer.address, ethers.parseEther("10000"));
    await token.connect(newcomer).approve(await staking.getAddress(), ethers.MaxUint256);

    const principal = athForUsd(ethers.parseEther("100"), PRICE_007);
    const expectedTotal = (principal * 3500n) / 10_000n;
    const expectedRankUplift = (principal * 2500n) / 10_000n;
    const userBefore = await token.balanceOf(user.address);
    const referralBefore = await staking.totalReferralPaidATH();
    const rankBefore = await staking.totalRankSponsorPaidATH();
    const reserveBefore = await staking.networkReserveATH();

    await staking.connect(newcomer).stake(1, ethers.parseEther("100"), user.address);

    expect((await token.balanceOf(user.address)) - userBefore).to.equal(expectedTotal);
    expect((await staking.totalReferralPaidATH()) - referralBefore).to.equal(expectedTotal);
    expect((await staking.totalRankSponsorPaidATH()) - rankBefore).to.equal(expectedRankUplift);
    expect(reserveBefore - (await staking.networkReserveATH())).to.equal(expectedTotal);
  });

  it("qualifies Rank 8 at $1,000,000 small-leg turnover with five direct sponsors", async function () {
    const legs = [leg1, leg2, leg3, leg4, leg5];
    const values = ["300000","250000","250000","250000","250000"];
    for (let i = 0; i < legs.length; i++) {
      await staking.connect(legs[i]).stake(5, ethers.parseEther(values[i]), user.address);
    }

    const snapshot = await staking.getSmallLegTurnoverUSDT(user.address);
    expect(snapshot.largestTurnover).to.equal(ethers.parseEther("300000"));
    expect(snapshot.smallLegTurnover).to.equal(ethers.parseEther("1000000"));
    expect(await staking.getEligibleRank(user.address)).to.equal(8n);
    expect((await staking.rankInfo(user.address)).highestRank).to.equal(8n);
  });

  it("pays Rank salary at the scheduled 00:30 UTC slot seven days after qualification", async function () {
    const legs = [leg1, leg2, leg3, leg4, leg5];
    const values = ["900","899","890","880","870"];
    for (let i = 0; i < legs.length; i++) {
      await staking.connect(legs[i]).stake(2, ethers.parseEther(values[i]), user.address);
    }

    const info = await staking.rankInfo(user.address);
    expect(info.highestRank).to.equal(1n);
    expect(info.nextPayoutAt).to.be.greaterThanOrEqual(info.firstRankAchievedAt + BigInt(7 * DAY));
    expect(info.nextPayoutAt % BigInt(DAY)).to.equal(1800n);

    await expect(staking.connect(user).claimRankSalary()).to.be.revertedWith("rank salary not due");

    await setNextTimestamp(info.nextPayoutAt);
    const before = await token.balanceOf(user.address);
    const rewardBefore = await staking.rewardReserveATH();
    const reserveBefore = await staking.networkReserveATH();
    const expectedSalaryATH = athForUsd(ethers.parseEther("25"), PRICE_007);

    await staking.connect(keeper).processRankSalary(user.address);

    expect((await token.balanceOf(user.address)) - before).to.equal(expectedSalaryATH);
    expect(await staking.rewardReserveATH()).to.equal(rewardBefore);
    expect(reserveBefore - (await staking.networkReserveATH())).to.equal(expectedSalaryATH);

    const afterInfo = await staking.rankInfo(user.address);
    expect(afterInfo.totalSalaryPaidUSDT).to.equal(ethers.parseEther("25"));
    expect(afterInfo.totalSalaryPaidATH).to.equal(expectedSalaryATH);
    expect(afterInfo.nextPayoutAt).to.equal(info.nextPayoutAt + BigInt(7 * DAY));

    expect(await staking.totalRankSalaryPayments()).to.equal(1n);
    const history = await staking.getRankSalaryPayments(0, 200);
    expect(history.length).to.equal(1);
    expect(history[0].account).to.equal(user.address);
    expect(history[0].payableRank).to.equal(1n);
    expect(history[0].periodsPaid).to.equal(1n);
    expect(history[0].salaryUSDT).to.equal(ethers.parseEther("25"));
    expect(history[0].salaryATH).to.equal(expectedSalaryATH);
    expect(history[0].priceUSD8).to.equal(PRICE_007);
    expect(history[0].nextPayoutAt).to.equal(afterInfo.nextPayoutAt);
  });

  it("keeps Rank Salary lifetime after staking principal is withdrawn", async function () {
    const legs = [leg1, leg2, leg3, leg4, leg5];
    const values = ["900","899","890","880","870"];
    for (let i = 0; i < legs.length; i++) {
      await staking.connect(legs[i]).stake(2, ethers.parseEther(values[i]), user.address);
    }

    const firstInfo = await staking.rankInfo(user.address);
    expect(firstInfo.highestRank).to.equal(1n);

    // The ranked account itself creates a stake, waits through its lock, then withdraws it.
    await staking.connect(user).stake(0, ethers.parseEther("10"), ethers.ZeroAddress);
    await increase(180 * DAY);
    await staking.connect(user).withdrawPrincipal(0);
    expect((await staking.rankInfo(user.address)).highestRank).to.equal(1n);

    // Rank Salary remains due on the perpetual weekly schedule after principal withdrawal.
    const infoAfterWithdraw = await staking.rankInfo(user.address);
    if (BigInt(await ethers.provider.getBlock("latest").then(b=>b.timestamp)) < infoAfterWithdraw.nextPayoutAt) {
      await setNextTimestamp(infoAfterWithdraw.nextPayoutAt);
    }
    const preview = await staking.rankSalaryPreview(user.address);
    expect(preview.payableRankNow).to.equal(1n);
    expect(preview.salaryUSDT).to.be.greaterThan(0n);
  });

  it("keeps the Rank salary fixed in USD while ATH amount follows the newer Presale price", async function () {
    const legs = [leg1, leg2, leg3, leg4, leg5];
    const values = ["900","899","890","880","870"];
    for (let i = 0; i < legs.length; i++) {
      await staking.connect(legs[i]).stake(2, ethers.parseEther(values[i]), user.address);
    }

    let info = await staking.rankInfo(user.address);
    await setNextTimestamp(info.nextPayoutAt);
    await staking.connect(keeper).processRankSalary(user.address);

    await presale.connect(owner).unpause();
    const tranche = ethers.parseEther("100000");
    const quote = await presale.quotePaymentForATH(tranche);
    await presale.connect(presaleBuyer).buyATH(tranche, quote);
    expect(await priceRegistry.getPrice()).to.equal(PRICE_0071);

    info = await staking.rankInfo(user.address);
    await setNextTimestamp(info.nextPayoutAt);

    const before = await token.balanceOf(user.address);
    const expectedAtNewPrice = athForUsd(ethers.parseEther("25"), PRICE_0071);
    await staking.connect(keeper).processRankSalary(user.address);

    expect((await token.balanceOf(user.address)) - before).to.equal(expectedAtNewPrice);
    expect((await staking.rankInfo(user.address)).totalSalaryPaidUSDT).to.equal(
      ethers.parseEther("50")
    );
  });
});

describe("ATH Development Vesting", function () {
  it("uses a two-month cliff and reaches exactly 100% of the 30M allocation", async function () {
    const [owner, beneficiary] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("ATHToken");
    const token = await Token.deploy(owner.address);
    await token.waitForDeployment();

    const Vesting = await ethers.getContractFactory("ATHDevelopmentVesting");
    const vesting = await Vesting.deploy(await token.getAddress(), beneficiary.address);
    await vesting.waitForDeployment();

    await token.transfer(await vesting.getAddress(), ethers.parseEther("30000000"));

    await increase(2 * MONTH);
    expect(await vesting.vestedATH()).to.equal(0n);

    await increase(MONTH);
    expect(await vesting.vestedATH()).to.equal(ethers.parseEther("900000"));

    await increase(32 * MONTH);
    expect(await vesting.vestedATH()).to.equal(ethers.parseEther("30000000"));
    expect(await vesting.claimableATH()).to.equal(ethers.parseEther("30000000"));

    await vesting.connect(beneficiary).claim();
    expect(await token.balanceOf(beneficiary.address)).to.equal(
      ethers.parseEther("30000000")
    );
  });
});
