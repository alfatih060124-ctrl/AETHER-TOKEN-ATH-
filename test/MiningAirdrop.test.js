const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

const DAY = 24 * 60 * 60;
const OPEN = 5 * 60;

async function moveToNextUtcSecond(secondOfDay) {
  const now = Number(await time.latest());
  const dayStart = Math.floor(now / DAY) * DAY;
  let target = dayStart + secondOfDay;
  if (target <= now) target += DAY;
  await time.increaseTo(target);
  return target;
}

async function moveToCurrentUtcOpen() {
  const now = Number(await time.latest());
  const dayStart = Math.floor(now / DAY) * DAY;
  const target = dayStart + OPEN;
  if (now < target) await time.increaseTo(target);
  return Math.floor(Number(await time.latest()) / DAY);
}

function modelFinal(amount) {
  const initial30 = amount * 10n / 100n;
  const initial60 = amount * 5n / 100n;
  const initial90 = amount * 5n / 100n;
  let incoming = amount - initial30 - initial60 - initial90;
  let distributed = initial30 + initial60 + initial90;
  let burned = 0n;

  for (let i = 0; i < 12; i++) {
    const burn = incoming * 10n / 100n;
    const u30 = incoming * 10n / 100n;
    const u60 = incoming * 5n / 100n;
    const u90 = incoming * 5n / 100n;
    const rollover = incoming - burn - u30 - u60 - u90;
    burned += burn;
    distributed += u30 + u60 + u90;
    incoming = rollover;
  }

  const finalBurn = incoming * 60n / 100n;
  burned += finalBurn;
  distributed += incoming - finalBurn;
  return { distributed, burned };
}

describe("AETHER ATH Mining Engine v3.3", function () {
  async function deployFixture({ funded = true } = {}) {
    const signers = await ethers.getSigners();
    const [deployer, owner, treasury, alice, bob, carol, dave, erin, frank, george] = signers;

    const Token = await ethers.getContractFactory("ATHToken");
    const token = await Token.deploy(deployer.address);
    await token.waitForDeployment();

    const Mining = await ethers.getContractFactory("MiningAirdrop");
    const mining = await Mining.deploy(await token.getAddress(), treasury.address, owner.address);
    await mining.waitForDeployment();

    if (funded) {
      await token.transfer(await mining.getAddress(), ethers.parseEther("700000000"));
    }

    return {
      signers, deployer, owner, treasury, alice, bob, carol, dave, erin, frank, george,
      token, mining
    };
  }

  async function buyPowerBeforeOpen(mining, user, referrer = ethers.ZeroAddress) {
    await moveToNextUtcSecond(60);
    await mining.connect(user).buyPower(referrer, { value: ethers.parseEther("0.001") });
    await moveToCurrentUtcOpen();
  }

  it("mints a fixed supply of 1 billion ATH", async function () {
    const { token } = await deployFixture();
    expect(await token.totalSupply()).to.equal(ethers.parseEther("1000000000"));
  });

  it("makes exactly 1 ATH claimable from 00:05 UTC and records transparent reward data", async function () {
    const { alice, mining } = await deployFixture();
    await buyPowerBeforeOpen(mining, alice);

    const dayId = Math.floor(Number(await time.latest()) / DAY);
    const statusBefore = await mining.getDailyRewardStatus(alice.address, dayId);
    expect(statusBefore.reward).to.equal(ethers.parseEther("1"));
    expect(statusBefore.referralBonusBps).to.equal(0n);
    expect(statusBefore.boosterMultiplier).to.equal(10000n);
    expect(statusBefore.status).to.equal(1n);

    await expect(mining.connect(alice).claimDaily())
      .to.emit(mining, "RewardCalculated")
      .and.to.emit(mining, "RewardClaimed")
      .and.to.emit(mining, "VestingCreated");

    const info = await mining.getUserInfo(alice.address);
    expect(info.totalAllocated).to.equal(ethers.parseEther("1"));
    expect(info.positionsCount).to.equal(1n);
  });

  it("rejects a daily claim before 00:05 UTC", async function () {
    const { alice, mining } = await deployFixture();
    await moveToNextUtcSecond(60);
    await mining.connect(alice).buyPower(ethers.ZeroAddress, { value: ethers.parseEther("0.001") });
    await time.increaseTo(Math.floor(Number(await time.latest()) / DAY) * DAY + 180);

    await expect(mining.connect(alice).claimDaily())
      .to.be.revertedWith("Claim window not open");
  });

  it("does not accumulate missed daily rewards", async function () {
    const { alice, mining } = await deployFixture();
    await buyPowerBeforeOpen(mining, alice);

    await time.increase(2 * DAY);
    await mining.connect(alice).claimDaily();

    const info = await mining.getUserInfo(alice.address);
    expect(info.currentDay).to.equal(3n);
    expect(info.totalAllocated).to.equal(ethers.parseEther("1"));
  });

  it("applies referral first and Power Booster x2 second", async function () {
    const { alice, bob, mining } = await deployFixture();

    await moveToNextUtcSecond(60);
    await mining.connect(alice).buyPower(ethers.ZeroAddress, { value: ethers.parseEther("0.001") });
    await mining.connect(bob).buyPower(alice.address, { value: ethers.parseEther("0.001") });
    await mining.connect(alice).buyPowerBooster({ value: ethers.parseEther("0.001") });
    await moveToCurrentUtcOpen();

    await mining.connect(alice).claimDaily();
    const info = await mining.getUserInfo(alice.address);
    expect(info.totalAllocated).to.equal(ethers.parseEther("2.2"));
    expect(info.referralCount).to.equal(1n);
    expect(info.totalHash).to.equal(100n);
  });

  it("requires 5 referrals for Double Power and applies x3 on top of Power Booster", async function () {
    const { alice, bob, carol, dave, erin, frank, mining } = await deployFixture();

    await moveToNextUtcSecond(60);
    await mining.connect(alice).buyPower(ethers.ZeroAddress, { value: ethers.parseEther("0.001") });
    for (const referral of [bob, carol, dave, erin, frank]) {
      await mining.connect(referral).buyPower(alice.address, { value: ethers.parseEther("0.001") });
    }

    await mining.connect(alice).buyPowerBooster({ value: ethers.parseEther("0.001") });
    await mining.connect(alice).buyDoublePowerBooster({ value: ethers.parseEther("0.001") });

    const period = await mining.getBoosterPeriod(alice.address, 0);
    expect(period.doubleStartTime).to.be.greaterThan(0n);
    expect(period.endTime - period.startTime).to.equal(BigInt(30 * DAY));

    await moveToCurrentUtcOpen();
    await mining.connect(alice).claimDaily();

    // 5 referrals = +10%; 1 * 1.1 * 2 * 3 = 6.6 ATH.
    const info = await mining.getUserInfo(alice.address);
    expect(info.totalAllocated).to.equal(ethers.parseEther("6.6"));
    expect(info.boosterMultiplier).to.equal(60000n);
  });

  it("blocks Double Power when the holder has fewer than 5 referrals", async function () {
    const { alice, mining } = await deployFixture();
    await buyPowerBeforeOpen(mining, alice);
    await mining.connect(alice).buyPowerBooster({ value: ethers.parseEther("0.001") });

    await expect(
      mining.connect(alice).buyDoublePowerBooster({ value: ethers.parseEther("0.001") })
    ).to.be.revertedWith("Need at least 5 referrals");
  });

  it("expires Power Booster after 30 days and returns reward to referral-normal level", async function () {
    const { alice, mining } = await deployFixture();

    await moveToNextUtcSecond(60);
    await mining.connect(alice).buyPower(ethers.ZeroAddress, { value: ethers.parseEther("0.001") });
    await mining.connect(alice).buyPowerBooster({ value: ethers.parseEther("0.001") });
    await moveToCurrentUtcOpen();
    await mining.connect(alice).claimDaily();

    await time.increase(30 * DAY);
    await mining.connect(alice).claimDaily();

    const info = await mining.getUserInfo(alice.address);
    expect(info.totalAllocated).to.equal(ethers.parseEther("3"));
    expect(info.boosterMultiplier).to.equal(10000n);
  });

  it("lets only the owner set both booster prices", async function () {
    const { owner, alice, mining } = await deployFixture();

    await expect(
      mining.connect(alice).setBoosterPrices(ethers.parseEther("0.002"), ethers.parseEther("0.003"))
    ).to.be.revertedWithCustomError(mining, "OwnableUnauthorizedAccount");

    await mining.connect(owner).setBoosterPrices(
      ethers.parseEther("0.002"),
      ethers.parseEther("0.003")
    );
    expect(await mining.powerBoosterPrice()).to.equal(ethers.parseEther("0.002"));
    expect(await mining.doublePowerBoosterPrice()).to.equal(ethers.parseEther("0.003"));
  });

  it("marks an unclaimed reward expired and never carries it forward", async function () {
    const { alice, mining } = await deployFixture();
    await buyPowerBeforeOpen(mining, alice);

    const expiredDay = Math.floor(Number(await time.latest()) / DAY);
    await time.increase(DAY);

    await expect(mining.expireDailyReward(alice.address, expiredDay))
      .to.emit(mining, "RewardCalculated")
      .and.to.emit(mining, "RewardExpired");

    const oldStatus = await mining.getDailyRewardStatus(alice.address, expiredDay);
    expect(oldStatus.status).to.equal(3n);

    await mining.connect(alice).claimDaily();
    const info = await mining.getUserInfo(alice.address);
    expect(info.totalAllocated).to.equal(ethers.parseEther("1"));
  });



  it("keeps an on-chain paginated miner registry for keeper discovery", async function () {
    const { alice, bob, carol, mining } = await deployFixture();

    await moveToNextUtcSecond(60);
    for (const user of [alice, bob, carol]) {
      await mining.connect(user).buyPower(ethers.ZeroAddress, { value: ethers.parseEther("0.001") });
    }

    expect(await mining.totalMiners()).to.equal(3n);
    expect(await mining.MAX_MINER_PAGE()).to.equal(200n);

    const page1 = await mining.getMiners(0, 2);
    const page2 = await mining.getMiners(2, 2);
    const empty = await mining.getMiners(3, 2);

    expect(page1).to.deep.equal([alice.address, bob.address]);
    expect(page2).to.deep.equal([carol.address]);
    expect(empty).to.deep.equal([]);

    await expect(mining.getMiners(0, 201)).to.be.revertedWith("Invalid miner page");
  });

  it("snapshots daily rewards in permissionless keeper batches", async function () {
    const { alice, bob, carol, george, mining } = await deployFixture();

    await moveToNextUtcSecond(60);
    for (const user of [alice, bob, carol]) {
      await mining.connect(user).buyPower(ethers.ZeroAddress, { value: ethers.parseEther("0.001") });
    }
    await moveToCurrentUtcOpen();

    const dayId = BigInt(Math.floor(Number(await time.latest()) / DAY));
    await expect(
      mining.connect(george).snapshotDailyRewards([
        alice.address,
        bob.address,
        carol.address,
        ethers.ZeroAddress,
      ])
    )
      .to.emit(mining, "RewardBatchSnapshotted")
      .withArgs(dayId, 4n, 3n);

    for (const user of [alice, bob, carol]) {
      const status = await mining.getDailyRewardStatus(user.address, dayId);
      expect(status.reward).to.equal(ethers.parseEther("1"));
      expect(status.status).to.equal(1n);
    }
  });

  it("batch-expires only unclaimed eligible rewards and preserves claimed records", async function () {
    const { alice, bob, carol, george, mining } = await deployFixture();

    await moveToNextUtcSecond(60);
    for (const user of [alice, bob, carol]) {
      await mining.connect(user).buyPower(ethers.ZeroAddress, { value: ethers.parseEther("0.001") });
    }
    await moveToCurrentUtcOpen();

    const expiredDay = BigInt(Math.floor(Number(await time.latest()) / DAY));
    await mining.connect(george).snapshotDailyRewards([alice.address, bob.address, carol.address]);
    await mining.connect(alice).claimDaily();

    await time.increase(DAY);

    await expect(
      mining.connect(george).expireDailyRewards(
        [alice.address, bob.address, carol.address],
        expiredDay
      )
    )
      .to.emit(mining, "RewardBatchExpired")
      .withArgs(expiredDay, 3n, 2n);

    expect((await mining.getDailyRewardStatus(alice.address, expiredDay)).status).to.equal(2n);
    expect((await mining.getDailyRewardStatus(bob.address, expiredDay)).status).to.equal(3n);
    expect((await mining.getDailyRewardStatus(carol.address, expiredDay)).status).to.equal(3n);
  });

  it("caps permissionless keeper batches at 50 accounts", async function () {
    const { alice, mining } = await deployFixture();
    await buyPowerBeforeOpen(mining, alice);

    const oversized = Array.from({ length: 51 }, () => alice.address);
    await expect(mining.snapshotDailyRewards(oversized))
      .to.be.revertedWith("Invalid keeper batch");
  });

  it("exposes the complete 1 ATH initial vesting and Cycle 1 preview on-chain", async function () {
    const { alice, mining } = await deployFixture();
    await buyPowerBeforeOpen(mining, alice);
    await mining.connect(alice).claimDaily();

    const [position] = await mining.getVestingPositionSummary(alice.address, 0);
    expect(position.amount).to.equal(ethers.parseEther("1"));
    expect(position.initial30).to.equal(ethers.parseEther("0.1"));
    expect(position.initial60).to.equal(ethers.parseEther("0.05"));
    expect(position.initial90).to.equal(ethers.parseEther("0.05"));
    expect(position.cyclePrincipal).to.equal(ethers.parseEther("0.8"));

    const cycle = await mining.previewVestingCycle(alice.address, 0, 1);
    expect(cycle.incomingAmount).to.equal(ethers.parseEther("0.8"));
    expect(cycle.burnedAmount).to.equal(ethers.parseEther("0.08"));
    expect(cycle.unlock30).to.equal(ethers.parseEther("0.08"));
    expect(cycle.unlock60).to.equal(ethers.parseEther("0.04"));
    expect(cycle.unlock90).to.equal(ethers.parseEther("0.04"));
    expect(cycle.rolloverAmount).to.equal(ethers.parseEther("0.56"));
  });

  it("provides flat explorer-friendly vesting data for holders", async function () {
    const { alice, mining } = await deployFixture();
    await buyPowerBeforeOpen(mining, alice);
    await mining.connect(alice).claimDaily();

    const dashboard = await mining.getVestingDashboard(alice.address, 0);
    expect(dashboard.amount).to.equal(ethers.parseEther("1"));
    expect(dashboard.unlock30).to.equal(ethers.parseEther("0.1"));
    expect(dashboard.unlock60).to.equal(ethers.parseEther("0.05"));
    expect(dashboard.unlock90).to.equal(ethers.parseEther("0.05"));
    expect(dashboard.cyclePrincipal).to.equal(ethers.parseEther("0.8"));
    expect(dashboard.currentCycle).to.equal(0n);
    expect(dashboard.burnedSoFar).to.equal(0n);

    const cycle = await mining.getVestingCyclePreview(alice.address, 0, 1);
    expect(cycle.incomingAmount).to.equal(ethers.parseEther("0.8"));
    expect(cycle.burnedAmount).to.equal(ethers.parseEther("0.08"));
    expect(cycle.rolloverAmount).to.equal(ethers.parseEther("0.56"));

    const final = await mining.previewFinalSettlement(alice.address, 0);
    expect(final.principal + final.burn60 + final.distribution40).to.be.greaterThan(0n);
    expect(final.burn60 + final.distribution40).to.equal(final.principal);
  });

  it("burns 10% exactly when the 80% tranche enters Cycle 1", async function () {
    const { alice, token, mining } = await deployFixture();
    await buyPowerBeforeOpen(mining, alice);
    await mining.connect(alice).claimDaily();

    const supplyBefore = await token.totalSupply();
    const [, startTime] = [null, (await mining.getVestingPositionSummary(alice.address, 0))[0].startTime];
    await time.increaseTo(Number(startTime) + 180 * DAY);

    await expect(mining.processVestingPosition(alice.address, 0))
      .to.emit(mining, "VestingCycleEntered")
      .and.to.emit(mining, "ATHBurned");

    expect(await mining.globalBurned()).to.equal(ethers.parseEther("0.08"));
    expect(await token.totalSupply()).to.equal(supplyBefore - ethers.parseEther("0.08"));
    expect(await mining.outstandingVestingLiability()).to.equal(ethers.parseEther("0.92"));
  });

  it("settles all 12 cycles and final 60/40 split to the exact 1 ATH model", async function () {
    const { alice, token, mining } = await deployFixture();
    await buyPowerBeforeOpen(mining, alice);
    await mining.connect(alice).claimDaily();

    const [position] = await mining.getVestingPositionSummary(alice.address, 0);
    await time.increaseTo(Number(position.startTime) + (13 * 180 * DAY));

    await mining.processVestingPosition(alice.address, 0);
    const expected = modelFinal(ethers.parseEther("1"));

    expect(await mining.globalBurned()).to.equal(expected.burned);

    const finalPreview = await mining.previewFinalSettlement(alice.address, 0);
    expect(finalPreview.settled).to.equal(true);

    await mining.connect(alice).claimVested(0);
    expect(await token.balanceOf(alice.address)).to.equal(expected.distributed);

    const summary = await mining.getVestingSummary(alice.address);
    expect(summary.totalClaimed).to.equal(expected.distributed);
    expect(summary.totalBurned).to.equal(expected.burned);
    expect(summary.totalStillVesting).to.equal(0n);
    expect(expected.distributed + expected.burned).to.equal(ethers.parseEther("1"));
  });

  it("does not allocate rewards when the ATH mining reserve is unfunded", async function () {
    const { alice, mining } = await deployFixture({ funded: false });
    await buyPowerBeforeOpen(mining, alice);

    await expect(mining.connect(alice).claimDaily())
      .to.be.revertedWith("Mining reserve not funded");
  });

  it("stops new rewards after exactly 180 eligible UTC reward days", async function () {
    const { alice, mining } = await deployFixture();
    await buyPowerBeforeOpen(mining, alice);
    await time.increase(180 * DAY);

    await expect(mining.connect(alice).claimDaily())
      .to.be.revertedWith("Mining period ended or not started");
  });

  it("forwards Power and both Booster revenues to treasury", async function () {
    const { alice, bob, carol, dave, erin, frank, treasury, mining } = await deployFixture();

    await moveToNextUtcSecond(60);
    const before = await ethers.provider.getBalance(treasury.address);
    await mining.connect(alice).buyPower(ethers.ZeroAddress, { value: ethers.parseEther("0.001") });
    for (const referral of [bob, carol, dave, erin, frank]) {
      await mining.connect(referral).buyPower(alice.address, { value: ethers.parseEther("0.001") });
    }
    await mining.connect(alice).buyPowerBooster({ value: ethers.parseEther("0.001") });
    await mining.connect(alice).buyDoublePowerBooster({ value: ethers.parseEther("0.001") });
    const after = await ethers.provider.getBalance(treasury.address);

    // Alice Power + five referral Powers + two boosters = 0.008 BNB.
    expect(after - before).to.equal(ethers.parseEther("0.008"));
  });

  it("preserves owner-only pause, treasury and excess-reserve guardrails", async function () {
    const { owner, alice, bob, token, mining } = await deployFixture();

    await expect(mining.connect(alice).setTreasury(bob.address))
      .to.be.revertedWithCustomError(mining, "OwnableUnauthorizedAccount");

    await mining.connect(owner).setTreasury(bob.address);
    expect(await mining.treasury()).to.equal(bob.address);

    await buyPowerBeforeOpen(mining, alice);
    await mining.connect(alice).claimDaily();

    const balance = await token.balanceOf(await mining.getAddress());
    const liability = await mining.outstandingVestingLiability();
    const maxExcess = balance - liability;

    await expect(mining.connect(owner).withdrawExcessATH(bob.address, 1n))
      .to.be.revertedWithCustomError(mining, "ExpectedPause");

    await mining.connect(owner).pause();
    await expect(mining.connect(owner).withdrawExcessATH(bob.address, maxExcess + 1n))
      .to.be.revertedWith("Amount exceeds excess reserve");

    await mining.connect(owner).withdrawExcessATH(bob.address, maxExcess);
    expect(await token.balanceOf(await mining.getAddress())).to.equal(liability);
  });

  it("keeps the ATH protocol reference price fixed at $0.10 in micro-USD", async function () {
    const { mining } = await deployFixture();
    expect(await mining.getCurrentPrice()).to.equal(100_000n);
  });
});