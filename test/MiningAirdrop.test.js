const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("AETHER ATH Mining Engine v3.2", function () {
  async function deployFixture() {
    const [deployer, owner, treasury, liquidity, team, marketing, alice, bob] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("ATHToken");
    const token = await Token.deploy(deployer.address);
    await token.waitForDeployment();

    const Mining = await ethers.getContractFactory("MiningAirdrop");
    const mining = await Mining.deploy(await token.getAddress(), treasury.address, owner.address);
    await mining.waitForDeployment();

    await token.transfer(await mining.getAddress(), ethers.parseEther("700000000"));

    return { deployer, owner, treasury, alice, bob, token, mining };
  }

  it("mints a fixed supply of 1 billion ATH", async function () {
    const { token } = await deployFixture();
    expect(await token.totalSupply()).to.equal(ethers.parseEther("1000000000"));
  });

  it("starts mining with exactly 0.001 BNB and does not accumulate missed days", async function () {
    const { alice, mining } = await deployFixture();
    await mining.connect(alice).buyPower(ethers.ZeroAddress, { value: ethers.parseEther("0.001") });

    await time.increase(2 * 24 * 60 * 60);
    await mining.connect(alice).claimDaily();

    const info = await mining.getUserInfo(alice.address);
    expect(info.currentDay).to.equal(3n);
    expect(info.totalAllocated).to.equal(ethers.parseEther("1"));
  });

  it("applies referral +10% and booster x2 to today's reward", async function () {
    const { alice, bob, mining } = await deployFixture();
    await mining.connect(alice).buyPower(ethers.ZeroAddress, { value: ethers.parseEther("0.001") });
    await mining.connect(bob).buyPower(alice.address, { value: ethers.parseEther("0.001") });
    await mining.connect(alice).buyBooster({ value: ethers.parseEther("0.001") });

    await mining.connect(alice).claimDaily();
    const info = await mining.getUserInfo(alice.address);
    expect(info.totalAllocated).to.equal(ethers.parseEther("2.2"));
    expect(info.referralCount).to.equal(1n);
    expect(info.totalHash).to.equal(100n);
  });

  it("releases the first 10% vesting tranche after 30 days", async function () {
    const { alice, token, mining } = await deployFixture();
    await mining.connect(alice).buyPower(ethers.ZeroAddress, { value: ethers.parseEther("0.001") });
    await mining.connect(alice).claimDaily();

    await time.increase(30 * 24 * 60 * 60);
    await mining.connect(alice).claimVested(0);
    expect(await token.balanceOf(alice.address)).to.equal(ethers.parseEther("0.1"));
  });

  it("stops new daily rewards after the 180-day mining window", async function () {
    const { alice, mining } = await deployFixture();
    await mining.connect(alice).buyPower(ethers.ZeroAddress, { value: ethers.parseEther("0.001") });
    await time.increase(180 * 24 * 60 * 60);
    await expect(mining.connect(alice).claimDaily()).to.be.revertedWith("Mining period ended or not started");
  });

  it("forwards Power and Booster revenue to the configured treasury", async function () {
    const { treasury, alice, mining } = await deployFixture();
    const before = await ethers.provider.getBalance(treasury.address);

    await mining.connect(alice).buyPower(ethers.ZeroAddress, { value: ethers.parseEther("0.001") });
    await mining.connect(alice).buyBooster({ value: ethers.parseEther("0.001") });

    const after = await ethers.provider.getBalance(treasury.address);
    expect(after - before).to.equal(ethers.parseEther("0.002"));
  });

  it("rejects self-referral and ignores an inactive referrer", async function () {
    const { alice, bob, mining } = await deployFixture();

    await expect(
      mining.connect(alice).buyPower(alice.address, { value: ethers.parseEther("0.001") })
    ).to.be.revertedWith("Cannot refer yourself");

    await mining.connect(alice).buyPower(bob.address, { value: ethers.parseEther("0.001") });
    expect(await mining.referrerOf(alice.address)).to.equal(ethers.ZeroAddress);

    const bobInfo = await mining.getUserInfo(bob.address);
    expect(bobInfo.referralCount).to.equal(0n);
  });

  it("enforces owner-only pause controls on mining actions", async function () {
    const { owner, alice, mining } = await deployFixture();

    await mining.connect(owner).pause();
    await expect(
      mining.connect(alice).buyPower(ethers.ZeroAddress, { value: ethers.parseEther("0.001") })
    ).to.be.revertedWithCustomError(mining, "EnforcedPause");

    await mining.connect(owner).unpause();
    await expect(
      mining.connect(alice).buyPower(ethers.ZeroAddress, { value: ethers.parseEther("0.001") })
    ).to.not.be.reverted;
  });

  it("does not allocate mining rewards when the ATH reserve is unfunded", async function () {
    const [deployer, owner, treasury, , , , alice] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("ATHToken");
    const token = await Token.deploy(deployer.address);
    await token.waitForDeployment();

    const Mining = await ethers.getContractFactory("MiningAirdrop");
    const mining = await Mining.deploy(await token.getAddress(), treasury.address, owner.address);
    await mining.waitForDeployment();

    await mining.connect(alice).buyPower(ethers.ZeroAddress, { value: ethers.parseEther("0.001") });
    await expect(mining.connect(alice).claimDaily()).to.be.revertedWith("Mining reserve not funded");
  });

  it("releases all four vesting tranches to exactly 100% of an allocated reward", async function () {
    const { alice, token, mining } = await deployFixture();
    await mining.connect(alice).buyPower(ethers.ZeroAddress, { value: ethers.parseEther("0.001") });
    await mining.connect(alice).claimDaily();

    await time.increase(30 * 24 * 60 * 60);
    await mining.connect(alice).claimVested(0);
    expect(await token.balanceOf(alice.address)).to.equal(ethers.parseEther("0.1"));

    await time.increase(30 * 24 * 60 * 60);
    await mining.connect(alice).claimVested(0);
    expect(await token.balanceOf(alice.address)).to.equal(ethers.parseEther("0.15"));

    await time.increase(30 * 24 * 60 * 60);
    await mining.connect(alice).claimVested(0);
    expect(await token.balanceOf(alice.address)).to.equal(ethers.parseEther("0.2"));

    await time.increase(90 * 24 * 60 * 60);
    await mining.connect(alice).claimVested(0);
    expect(await token.balanceOf(alice.address)).to.equal(ethers.parseEther("1"));
  });

  it("allows only the mining owner to update treasury and forwards future revenue there", async function () {
    const { owner, treasury, alice, bob, mining } = await deployFixture();

    await expect(mining.connect(alice).setTreasury(bob.address))
      .to.be.revertedWithCustomError(mining, "OwnableUnauthorizedAccount");

    await mining.connect(owner).setTreasury(bob.address);
    expect(await mining.treasury()).to.equal(bob.address);

    const beforeOld = await ethers.provider.getBalance(treasury.address);
    const beforeNew = await ethers.provider.getBalance(bob.address);
    await mining.connect(alice).buyPower(ethers.ZeroAddress, { value: ethers.parseEther("0.001") });
    const afterOld = await ethers.provider.getBalance(treasury.address);
    const afterNew = await ethers.provider.getBalance(bob.address);

    expect(afterOld - beforeOld).to.equal(0n);
    expect(afterNew - beforeNew).to.equal(ethers.parseEther("0.001"));
  });

  it("enforces token emergency pause as an owner-only control", async function () {
    const { deployer, alice, token } = await deployFixture();

    await expect(token.connect(alice).pause())
      .to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");

    await token.connect(deployer).pause();
    expect(await token.paused()).to.equal(true);

    await expect(token.connect(alice).transfer(deployer.address, 1n))
      .to.be.revertedWithCustomError(token, "EnforcedPause");

    await token.connect(deployer).unpause();
    expect(await token.paused()).to.equal(false);
  });

  it("allows excess ATH recovery only while mining is paused and preserves vesting liabilities", async function () {
    const { owner, alice, bob, token, mining } = await deployFixture();

    await mining.connect(alice).buyPower(ethers.ZeroAddress, { value: ethers.parseEther("0.001") });
    await mining.connect(alice).claimDaily();

    const miningAddress = await mining.getAddress();
    const balance = await token.balanceOf(miningAddress);
    const liability = await mining.outstandingVestingLiability();
    const maxExcess = balance - liability;

    await expect(mining.connect(owner).withdrawExcessATH(bob.address, 1n))
      .to.be.revertedWithCustomError(mining, "ExpectedPause");

    await mining.connect(owner).pause();
    await expect(mining.connect(owner).withdrawExcessATH(bob.address, maxExcess + 1n))
      .to.be.revertedWith("Amount exceeds excess reserve");

    await mining.connect(owner).withdrawExcessATH(bob.address, maxExcess);
    expect(await token.balanceOf(miningAddress)).to.equal(liability);
    expect(await mining.outstandingVestingLiability()).to.equal(liability);
  });

  it("starts display price at $3.00 in micro-USD", async function () {
    const { mining } = await deployFixture();
    expect(await mining.getCurrentPrice()).to.equal(3_000_000n);
  });
});
