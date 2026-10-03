const { expect } = require("chai");
const { ethers } = require("hardhat");

const DAY = 24 * 60 * 60;
const MONTH = 30 * DAY;
const PRINCIPAL_10_USDT_AT_037 = 27027027027027027027n;
const DIRECT_REFERRAL_AT_037 = 2702702702702702702n;
const DAILY_REWARD_0035_AT_037 = 94594594594594594n;
const NETWORK_L1_AT_037 = 7567567567567567n;
const REWARD_63_USDT_AT_037 = 17027027027027027027n;

async function increase(seconds) {
  await ethers.provider.send("evm_increaseTime", [seconds]);
  await ethers.provider.send("evm_mine", []);
}

describe("AETHER ATH Staking v1", function () {
  let owner, user, referrer, second, treasury;
  let token, priceRegistry, mining, oracle, staking;

  beforeEach(async function () {
    [owner, user, referrer, second, treasury] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("ATHToken");
    token = await Token.deploy(owner.address);
    await token.waitForDeployment();

    const PriceRegistry = await ethers.getContractFactory("ATHPriceRegistry");
    priceRegistry = await PriceRegistry.deploy(owner.address);
    await priceRegistry.waitForDeployment();

    const Mining = await ethers.getContractFactory("MiningAirdrop");
    mining = await Mining.deploy(
      await token.getAddress(),
      treasury.address,
      await priceRegistry.getAddress(),
      owner.address
    );
    await mining.waitForDeployment();

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

    for (const signer of [user, referrer, second]) {
      await token.transfer(signer.address, ethers.parseEther("1000000"));
      await token.connect(signer).approve(await staking.getAddress(), ethers.MaxUint256);
    }

    await token.approve(await staking.getAddress(), ethers.MaxUint256);
    await staking.fundRewards(ethers.parseEther("1000000"));
  });

  it("keeps ATH fixed at 1B while Staking uses the unified $0.37 pre-listing price registry", async function () {
    expect(await token.totalSupply()).to.equal(ethers.parseEther("1000000000"));
    expect(await priceRegistry.getPrice()).to.equal(37_000_000n);
    expect(await priceRegistry.HOLDER_TARGET()).to.equal(15_000n);
    expect(await oracle.getPrice()).to.equal(37_000_000n);
    expect(await oracle.priceRegistry()).to.equal(await priceRegistry.getAddress());
    expect(await staking.getATHAmount(ethers.parseEther("10"))).to.equal(
      PRINCIPAL_10_USDT_AT_037
    );
    expect(await staking.STAKING_ECOSYSTEM_ALLOCATION()).to.equal(
      ethers.parseEther("300000000")
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
    await staking.connect(user).stake(0, ethers.parseEther("10"), ethers.ZeroAddress);

    expect(await staking.principalLiabilityATH()).to.equal(PRINCIPAL_10_USDT_AT_037);
    expect(await staking.rewardReserveATH()).to.equal(reserveBefore);
    expect(await token.balanceOf(await staking.getAddress())).to.equal(
      reserveBefore + PRINCIPAL_10_USDT_AT_037
    );
  });

  it("pays the 10% direct referral reward from reward reserve, not principal", async function () {
    const reserveBefore = await staking.rewardReserveATH();
    const refBefore = await token.balanceOf(referrer.address);

    await staking.connect(user).stake(0, ethers.parseEther("10"), referrer.address);

    expect(await token.balanceOf(referrer.address) - refBefore).to.equal(
      DIRECT_REFERRAL_AT_037
    );
    expect(await staking.principalLiabilityATH()).to.equal(PRINCIPAL_10_USDT_AT_037);
    expect(await staking.rewardReserveATH()).to.equal(
      reserveBefore - DIRECT_REFERRAL_AT_037
    );
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
      DAILY_REWARD_0035_AT_037
    );

    await increase(DAY / 2);
    expect(await staking.getPendingRewardUSDT(user.address, 0)).to.equal(
      ethers.parseEther("0.035")
    );
  });

  it("distributes level-1 network reward at 8% of the user's daily reward", async function () {
    await staking.connect(user).stake(0, ethers.parseEther("10"), referrer.address);
    await increase(DAY);

    const refBefore = await token.balanceOf(referrer.address);
    await staking.connect(user).claimReward(0);
    const networkGain = (await token.balanceOf(referrer.address)) - refBefore;

    expect(networkGain).to.equal(NETWORK_L1_AT_037);
    expect((await staking.userInfo(referrer.address)).totalNetworkEarnedATH).to.equal(
      NETWORK_L1_AT_037
    );
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
    await staking.connect(user).stake(0, ethers.parseEther("10"), ethers.ZeroAddress);

    await expect(staking.connect(user).withdrawPrincipal(0)).to.be.revertedWith("still locked");

    await increase(180 * DAY);
    const before = await token.balanceOf(user.address);
    await staking.connect(user).withdrawPrincipal(0);
    expect((await token.balanceOf(user.address)) - before).to.equal(
      PRINCIPAL_10_USDT_AT_037
    );
    expect(await staking.principalLiabilityATH()).to.equal(0n);

    expect(await staking.getPendingRewardUSDT(user.address, 0)).to.equal(
      ethers.parseEther("6.3")
    );
    const rewardBefore = await token.balanceOf(user.address);
    await staking.connect(user).claimReward(0);
    expect((await token.balanceOf(user.address)) - rewardBefore).to.equal(
      REWARD_63_USDT_AT_037
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
