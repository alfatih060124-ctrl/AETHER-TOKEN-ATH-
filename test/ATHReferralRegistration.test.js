const { expect } = require("chai");
const { ethers } = require("hardhat");

const MASTER = "0x240086965a9ed9672c649ac0538f049f14270112";

describe("ATH referral registration and Account Master", function () {
  let owner, member, other;
  let token, stable, presale, registry, oracle, staking;

  beforeEach(async function () {
    [owner, member, other] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("ATHToken");
    token = await Token.deploy(owner.address);
    await token.waitForDeployment();

    const Stable = await ethers.getContractFactory("MockStablecoin");
    stable = await Stable.deploy(6);
    await stable.waitForDeployment();

    const Presale = await ethers.getContractFactory("ATHPresale");
    presale = await Presale.deploy(await token.getAddress(), await stable.getAddress(), owner.address, owner.address);
    await presale.waitForDeployment();

    const Registry = await ethers.getContractFactory("ATHPriceRegistry");
    registry = await Registry.deploy(await presale.getAddress(), owner.address);
    await registry.waitForDeployment();

    const Oracle = await ethers.getContractFactory("ATHStakingPriceOracle");
    oracle = await Oracle.deploy(await registry.getAddress());
    await oracle.waitForDeployment();

    const Staking = await ethers.getContractFactory("ATHStaking");
    staking = await Staking.deploy(await token.getAddress(), await oracle.getAddress(), owner.address);
    await staking.waitForDeployment();
  });

  it("configures the specified Master once as registered Rank 8 while paused", async function () {
    expect(await staking.paused()).to.equal(true);
    await expect(staking.connect(owner).setMasterAccount(MASTER))
      .to.emit(staking, "MasterAccountConfigured").withArgs(MASTER);
    expect(await staking.masterAccount()).to.equal(MASTER);
    expect(await staking.isMemberRegistered(MASTER)).to.equal(true);
    expect((await staking.rankInfo(MASTER)).highestRank).to.equal(8n);
    await expect(staking.connect(owner).setMasterAccount(other.address)).to.be.revertedWith("master already configured");
  });

  it("allows referral registration without staking while the staking contract is paused", async function () {
    await staking.setMasterAccount(MASTER);
    await staking.connect(member).registerReferral(MASTER);
    expect(await staking.isMemberRegistered(member.address)).to.equal(true);
    expect((await staking.userInfo(member.address)).referrer).to.equal(MASTER);
    expect(await staking.directSponsorCount(MASTER)).to.equal(1n);
    expect(await staking.paused()).to.equal(true);
  });

  it("rejects unregistered sponsors, self-referrals and duplicate registration", async function () {
    await staking.setMasterAccount(MASTER);
    await expect(staking.connect(member).registerReferral(other.address)).to.be.revertedWith("sponsor not registered");
    await expect(staking.connect(member).registerReferral(member.address)).to.be.revertedWith("invalid sponsor");
    await staking.connect(member).registerReferral(MASTER);
    await expect(staking.connect(member).registerReferral(MASTER)).to.be.revertedWith("already registered");
  });

  it("blocks staking until the wallet registers, then enforces its bound sponsor", async function () {
    await staking.setMasterAccount(MASTER);
    await token.transfer(member.address, ethers.parseEther("1000"));
    await token.connect(member).approve(await staking.getAddress(), ethers.MaxUint256);
    await token.approve(await staking.getAddress(), ethers.MaxUint256);
    await staking.fundRewards(ethers.parseEther("160000000"));
    await staking.fundNetworkReserve(ethers.parseEther("50000000"));
    await staking.unpause();

    const tenUsd = ethers.parseEther("10");
    await expect(staking.connect(member).stake(0, tenUsd, MASTER))
      .to.be.revertedWith("register with referral first");

    await staking.connect(member).registerReferral(MASTER);
    await expect(staking.connect(member).stake(0, tenUsd, other.address))
      .to.be.revertedWith("sponsor mismatch");

    await expect(staking.connect(member).stake(0, tenUsd, MASTER))
      .to.emit(staking, "Staked");
  });

  it("requires Presale buy-and-stake buyers to register first and use the bound sponsor", async function () {
    await token.transfer(await presale.getAddress(), ethers.parseEther("30000000"));
    await token.approve(await staking.getAddress(), ethers.MaxUint256);
    await staking.setMasterAccount(MASTER);
    await staking.fundRewards(ethers.parseEther("160000000"));
    await staking.fundNetworkReserve(ethers.parseEther("50000000"));
    await staking.setPresaleSettlement(await presale.getAddress());
    await staking.unpause();
    await presale.setStakingSettlement(await staking.getAddress());

    const payment = await presale.quotePaymentForATH(ethers.parseEther("1000"));
    await stable.mint(member.address, 1_000_000_000n);
    await stable.connect(member).approve(await presale.getAddress(), ethers.MaxUint256);
    await presale.unpause();
    const deadline = BigInt((await ethers.provider.getBlock("latest")).timestamp + 3600);

    await expect(presale.connect(member).buyAndStake(
      ethers.parseEther("1000"), payment, 0, MASTER, deadline
    )).to.be.revertedWith("register with referral first");

    await staking.connect(member).registerReferral(MASTER);
    await expect(presale.connect(member).buyAndStake(
      ethers.parseEther("1000"), payment, 0, other.address, deadline
    )).to.be.revertedWith("sponsor mismatch");

    await expect(presale.connect(member).buyAndStake(
      ethers.parseEther("1000"), payment, 0, MASTER, deadline
    )).to.emit(presale, "ATHPurchasedAndStaked");

    expect(await staking.stakeCount(member.address)).to.equal(1n);
    expect((await staking.userInfo(member.address)).referrer).to.equal(MASTER);
  });

  it("does not allow a non-owner to configure the Master", async function () {
    await expect(staking.connect(member).setMasterAccount(MASTER))
      .to.be.revertedWithCustomError(staking, "OwnableUnauthorizedAccount").withArgs(member.address);
  });
});
