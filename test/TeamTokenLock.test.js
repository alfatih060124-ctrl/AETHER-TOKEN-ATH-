const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("AETHER ATH TeamTokenLock", function () {
  async function fixture() {
    const [deployer, beneficiary] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("ATHToken");
    const token = await Token.deploy(deployer.address);
    await token.waitForDeployment();

    const now = await time.latest();
    const releaseTime = now + 365 * 24 * 60 * 60;

    const Lock = await ethers.getContractFactory("TeamTokenLock");
    const lock = await Lock.deploy(
      await token.getAddress(),
      beneficiary.address,
      releaseTime
    );
    await lock.waitForDeployment();

    await token.transfer(await lock.getAddress(), ethers.parseEther("50000000"));

    return { beneficiary, token, lock, releaseTime };
  }

  it("holds the 50 million ATH Team & Dev allocation before release", async function () {
    const { beneficiary, token, lock } = await fixture();

    expect(await token.balanceOf(await lock.getAddress())).to.equal(
      ethers.parseEther("50000000")
    );
    expect(await token.balanceOf(beneficiary.address)).to.equal(0n);

    await expect(lock.release()).to.be.revertedWith("Still locked");
  });

  it("releases the full Team & Dev allocation only after the cliff", async function () {
    const { beneficiary, token, lock, releaseTime } = await fixture();

    await time.increaseTo(releaseTime);
    await lock.release();

    expect(await token.balanceOf(beneficiary.address)).to.equal(
      ethers.parseEther("50000000")
    );
    expect(await token.balanceOf(await lock.getAddress())).to.equal(0n);
  });
});
