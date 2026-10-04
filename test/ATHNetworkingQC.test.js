const { expect } = require("chai");
const { ethers } = require("hardhat");

const DAY = 24 * 60 * 60;
const PRICE_007 = 7_000_000n;

function athForUsd(usd18, price8 = PRICE_007) {
  return (usd18 * 100_000_000n) / price8;
}

async function increase(seconds) {
  await ethers.provider.send("evm_increaseTime", [seconds]);
  await ethers.provider.send("evm_mine", []);
}

async function deployNetworkingFixture() {
  const signers = await ethers.getSigners();
  const [owner, treasury, presaleBuyer, sponsor, ...rest] = signers;

  const Token = await ethers.getContractFactory("ATHToken");
  const token = await Token.deploy(owner.address);
  await token.waitForDeployment();

  const Stable = await ethers.getContractFactory("MockStablecoin");
  const stable = await Stable.deploy(6);
  await stable.waitForDeployment();

  const Presale = await ethers.getContractFactory("ATHPresale");
  const presale = await Presale.deploy(
    await token.getAddress(),
    await stable.getAddress(),
    treasury.address,
    owner.address
  );
  await presale.waitForDeployment();
  await token.transfer(await presale.getAddress(), ethers.parseEther("30000000"));

  const Registry = await ethers.getContractFactory("ATHPriceRegistry");
  const registry = await Registry.deploy(await presale.getAddress(), owner.address);
  await registry.waitForDeployment();

  const Oracle = await ethers.getContractFactory("ATHStakingPriceOracle");
  const oracle = await Oracle.deploy(await registry.getAddress());
  await oracle.waitForDeployment();

  const Staking = await ethers.getContractFactory("ATHStaking");
  const staking = await Staking.deploy(
    await token.getAddress(),
    await oracle.getAddress(),
    owner.address
  );
  await staking.waitForDeployment();

  await token.approve(await staking.getAddress(), ethers.MaxUint256);
  await staking.fundRewards(ethers.parseEther("160000000"));
  await staking.fundNetworkReserve(ethers.parseEther("50000000"));

  const participants = [sponsor, ...rest];
  for (const signer of participants) {
    await token.transfer(signer.address, ethers.parseEther("20000000"));
    await token.connect(signer).approve(await staking.getAddress(), ethers.MaxUint256);
  }

  return { signers, owner, treasury, token, stable, presale, registry, oracle, staking, sponsor, rest };
}

async function advanceToRewardSlot(staking, account, stakeId) {
  const schedule = await staking.getRewardSchedule(account, stakeId);
  await ethers.provider.send("evm_setNextBlockTimestamp", [Number(schedule.nextRewardAt)]);
  await ethers.provider.send("evm_mine", []);
}

describe("ATH Networking Bonus QC Matrix", function () {
  it("pays all 10 network levels at the locked 8/5/3/2/1/0.5x5 rates", async function () {
    const { staking, rest } = await deployNetworkingFixture();

    const source = rest[0];
    const uplines = rest.slice(1, 11);
    expect(uplines.length).to.equal(10);

    // Bind the referral chain top-down so source -> L1 -> ... -> L10.
    for (let i = 9; i >= 0; i--) {
      const user = uplines[i];
      const referrer = i === 9 ? ethers.ZeroAddress : uplines[i + 1].address;
      await staking.connect(user).stake(0, ethers.parseEther("10"), referrer);
    }
    await staking.connect(source).stake(0, ethers.parseEther("10"), uplines[0].address);

    const balancesBefore = [];
    for (const upline of uplines) {
      balancesBefore.push(await staking.athToken().then(async a => {
        const token = await ethers.getContractAt("ATHToken", a);
        return token.balanceOf(upline.address);
      }));
    }
    const rewardReserveBefore = await staking.rewardReserveATH();
    const networkReserveBefore = await staking.networkReserveATH();
    const totalNetworkBefore = await staking.totalNetworkPaidATH();

    await advanceToRewardSlot(staking, source.address, 0);
    await staking.connect(source).claimReward(0);

    const rewardATH = athForUsd(ethers.parseEther("0.035"));
    const rates = [800n, 500n, 300n, 200n, 100n, 50n, 50n, 50n, 50n, 50n];
    let expectedTotal = 0n;
    const token = await ethers.getContractAt("ATHToken", await staking.athToken());

    for (let i = 0; i < uplines.length; i++) {
      const expected = (rewardATH * rates[i]) / 10_000n;
      expectedTotal += expected;
      const after = await token.balanceOf(uplines[i].address);
      expect(after - balancesBefore[i], `Lifestyle Matching L${i + 1}`).to.equal(expected);
    }

    expect((await staking.totalNetworkPaidATH()) - totalNetworkBefore).to.equal(expectedTotal);
    expect(expectedTotal).to.equal((rewardATH * 2_150n) / 10_000n);
    expect(rewardReserveBefore - (await staking.rewardReserveATH())).to.equal(rewardATH);
    expect(networkReserveBefore - (await staking.networkReserveATH())).to.equal(expectedTotal);
  });

  it("qualifies Rank 1 through Rank 8 exactly at each locked small-leg threshold", async function () {
    const { token, staking, sponsor, rest } = await deployNetworkingFixture();
    const legs = rest.slice(0, 5);

    // Keep one leg permanently largest so every other incremental stake is small-leg turnover.
    await token.transfer(legs[0].address, ethers.parseEther("2000000"));
    await staking.connect(legs[0]).stake(5, ethers.parseEther("1100000"), sponsor.address);

    for (let i = 1; i < 5; i++) {
      await staking.connect(legs[i]).stake(0, ethers.parseEther("10"), sponsor.address);
    }

    expect(await staking.directSponsorCount(sponsor.address)).to.equal(5n);
    expect((await staking.getSmallLegTurnoverUSDT(sponsor.address)).smallLegTurnover)
      .to.equal(ethers.parseEther("40"));
    expect(await staking.getEligibleRank(sponsor.address)).to.equal(0n);

    const targets = ["1000", "5000", "15000", "50000", "100000", "250000", "500000", "1000000"];
    const increments = ["960", "4000", "10000", "35000", "50000", "150000", "250000", "500000"];
    const packageIds = [2, 3, 4, 4, 5, 5, 5, 5];

    for (let i = 0; i < targets.length; i++) {
      await staking.connect(legs[1]).stake(
        packageIds[i],
        ethers.parseEther(increments[i]),
        sponsor.address
      );

      const snapshot = await staking.getSmallLegTurnoverUSDT(sponsor.address);
      expect(snapshot.smallLegTurnover, `Rank ${i + 1} turnover`).to.equal(
        ethers.parseEther(targets[i])
      );
      expect(await staking.getEligibleRank(sponsor.address), `Rank ${i + 1} eligibility`).to.equal(
        BigInt(i + 1)
      );
      expect((await staking.rankInfo(sponsor.address)).highestRank).to.equal(BigInt(i + 1));
      expect(await staking.rankQualifiedAt(sponsor.address, i + 1)).to.be.greaterThan(0n);
    }

    const finalSnapshot = await staking.getSmallLegTurnoverUSDT(sponsor.address);
    expect(finalSnapshot.bigLeg).to.equal(legs[0].address);
    expect(finalSnapshot.largestTurnover).to.equal(ethers.parseEther("1100000"));
    expect(await staking.totalRankMembers()).to.equal(1n);
  });

  it("locks every Rank threshold and weekly salary pair", async function () {
    const { staking } = await deployNetworkingFixture();

    const thresholds = ["1000","5000","15000","50000","100000","250000","500000","1000000"];
    const salaries = ["25","75","200","500","1000","2000","5000","10000"];

    for (let i = 0; i < 8; i++) {
      expect(await staking.rankSmallLegThresholdUSDT(i), `Rank ${i + 1} threshold`)
        .to.equal(ethers.parseEther(thresholds[i]));
      expect(await staking.rankWeeklySalaryUSDT(i), `Rank ${i + 1} salary`)
        .to.equal(ethers.parseEther(salaries[i]));
    }
  });

  it("never consumes staking principal when paying Rank salary", async function () {
    const { staking, sponsor, rest } = await deployNetworkingFixture();
    const legs = rest.slice(0, 5);
    const values = ["900","899","890","880","870"];

    for (let i = 0; i < 5; i++) {
      await staking.connect(legs[i]).stake(2, ethers.parseEther(values[i]), sponsor.address);
    }

    const info = await staking.rankInfo(sponsor.address);
    const principalBefore = await staking.principalLiabilityATH();
    const rewardBefore = await staking.rewardReserveATH();
    const reserveBefore = await staking.networkReserveATH();

    await ethers.provider.send("evm_setNextBlockTimestamp", [Number(info.nextPayoutAt)]);
    await ethers.provider.send("evm_mine", []);

    const preview = await staking.rankSalaryPreview(sponsor.address);
    expect(preview.salaryUSDT).to.equal(ethers.parseEther("25"));

    await staking.processRankSalary(sponsor.address);

    expect(await staking.principalLiabilityATH()).to.equal(principalBefore);
    expect(await staking.rewardReserveATH()).to.equal(rewardBefore);
    expect(reserveBefore - (await staking.networkReserveATH())).to.equal(preview.salaryATH);
  });
});
