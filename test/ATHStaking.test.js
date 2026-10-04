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

  it("keeps principal liability separate from the reward reserve", async function () {
    const reserveBefore = await staking.rewardReserveATH();
    const principal = athForUsd(ethers.parseEther("10"), PRICE_007);
    await staking.connect(user).stake(0, ethers.parseEther("10"), ethers.ZeroAddress);

    expect(await staking.principalLiabilityATH()).to.equal(principal);
    expect(await staking.rewardReserveATH()).to.equal(reserveBefore);
    expect(await token.balanceOf(await staking.getAddress())).to.equal(
      reserveBefore + principal
    );
  });

  it("pays the 10% direct referral reward from reward reserve, not principal", async function () {
    const reserveBefore = await staking.rewardReserveATH();
    const principal = athForUsd(ethers.parseEther("10"), PRICE_007);
    const expectedReferral = (principal * 1_000n) / 10_000n;
    const refBefore = await token.balanceOf(referrer.address);

    await staking.connect(user).stake(0, ethers.parseEther("10"), referrer.address);

    expect(await token.balanceOf(referrer.address) - refBefore).to.equal(expectedReferral);
    expect(await staking.principalLiabilityATH()).to.equal(principal);
    expect(await staking.rewardReserveATH()).to.equal(reserveBefore - expectedReferral);
  });

  it("accrues rewards only by completed days and preserves partial-day time", async function () {
    await staking.connect(user).stake(0, ethers.parseEther("10"), ethers.ZeroAddress);

    await increase(DAY + DAY / 2);
    expect(await staking.getPendingRewardUSDT(user.address, 0)).to.equal(
      ethers.parseEther("0.035")
    );

    const before = await token.balanceOf(user.address);
    await staking.connect(user).claimReward(0);
    expect(await token.balanceOf(user.address) - before).to.equal(
      athForUsd(ethers.parseEther("0.035"), PRICE_007)
    );

    await increase(DAY / 2);
    expect(await staking.getPendingRewardUSDT(user.address, 0)).to.equal(
      ethers.parseEther("0.035")
    );
  });

  it("distributes level-1 network reward at 8% of the user's daily reward", async function () {
    await staking.connect(user).stake(0, ethers.parseEther("10"), referrer.address);
    await increase(DAY);

    const rewardATH = athForUsd(ethers.parseEther("0.035"), PRICE_007);
    const expectedNetwork = (rewardATH * 800n) / 10_000n;
    const refBefore = await token.balanceOf(referrer.address);
    await staking.connect(user).claimReward(0);

    expect((await token.balanceOf(referrer.address)) - refBefore).to.equal(expectedNetwork);
    expect((await staking.userInfo(referrer.address)).totalNetworkEarnedATH).to.equal(
      expectedNetwork
    );
  });

  it("distributes the complete 10-level network schedule 8/5/3/2/1/0.5x5", async function () {
    const chain = signers.slice(1, 12);
    for (const member of chain) {
      await token.transfer(member.address, ethers.parseEther("1000000"));
      await token.connect(member).approve(await staking.getAddress(), ethers.MaxUint256);
    }

    await staking.connect(chain[0]).stake(0, ethers.parseEther("10"), ethers.ZeroAddress);
    for (let i = 1; i < chain.length; i++) {
      await staking.connect(chain[i]).stake(0, ethers.parseEther("10"), chain[i - 1].address);
    }

    await increase(DAY);

    const leaf = chain[10];
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

    await increase(DAY);
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
    const reserveBefore = await staking.rewardReserveATH();
    const expectedSalaryATH = athForUsd(ethers.parseEther("25"), PRICE_007);

    await staking.connect(keeper).processRankSalary(user.address);

    expect((await token.balanceOf(user.address)) - before).to.equal(expectedSalaryATH);
    expect(reserveBefore - (await staking.rewardReserveATH())).to.equal(expectedSalaryATH);

    const afterInfo = await staking.rankInfo(user.address);
    expect(afterInfo.totalSalaryPaidUSDT).to.equal(ethers.parseEther("25"));
    expect(afterInfo.totalSalaryPaidATH).to.equal(expectedSalaryATH);
    expect(afterInfo.nextPayoutAt).to.equal(info.nextPayoutAt + BigInt(7 * DAY));
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
