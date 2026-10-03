const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AETHER ATH Presale", function () {
  async function deployFixture(paymentDecimals = 6) {
    const [owner, buyer, treasury, other] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("ATHToken");
    const ath = await Token.deploy(owner.address);
    await ath.waitForDeployment();

    const Stable = await ethers.getContractFactory("MockStablecoin");
    const usd = await Stable.deploy(paymentDecimals);
    await usd.waitForDeployment();

    const Presale = await ethers.getContractFactory("ATHPresale");
    const presale = await Presale.deploy(
      await ath.getAddress(),
      await usd.getAddress(),
      treasury.address,
      owner.address
    );
    await presale.waitForDeployment();

    await ath.transfer(await presale.getAddress(), ethers.parseEther("30000000"));

    const unit = 10n ** BigInt(paymentDecimals);
    await usd.mint(buyer.address, 10_000_000n * unit);
    await usd.connect(buyer).approve(await presale.getAddress(), ethers.MaxUint256);

    return { owner, buyer, treasury, other, ath, usd, presale, unit };
  }

  it("opens at $0.070 with exactly 30M ATH allocated across 300 price steps", async function () {
    const { presale } = await deployFixture();

    expect(await presale.START_PRICE_USD8()).to.equal(7_000_000n);
    expect(await presale.PRICE_STEP_USD8()).to.equal(100_000n);
    expect(await presale.FINAL_PRICE_USD8()).to.equal(37_000_000n);
    expect(await presale.STEP_SIZE_ATH()).to.equal(ethers.parseEther("100000"));
    expect(await presale.SALE_ALLOCATION_ATH()).to.equal(ethers.parseEther("30000000"));
    expect(await presale.TOTAL_PRICE_STEPS()).to.equal(300n);
    expect(await presale.currentPriceUSD8()).to.equal(7_000_000n);
  });

  it("raises price by exactly $0.001 after each complete 100,000 ATH sold", async function () {
    const { buyer, treasury, usd, presale, unit } = await deployFixture();

    const athAmount = ethers.parseEther("100000");
    expect(await presale.quotePaymentForATH(athAmount)).to.equal(7_000n * unit);

    const treasuryBefore = await usd.balanceOf(treasury.address);
    await presale.connect(buyer).buyATH(athAmount, 7_000n * unit);

    expect(await usd.balanceOf(treasury.address) - treasuryBefore).to.equal(7_000n * unit);
    expect(await presale.totalSoldATH()).to.equal(athAmount);
    expect(await presale.currentPriceUSD8()).to.equal(7_100_000n);
  });

  it("prices a purchase correctly when it crosses a 100k tranche boundary", async function () {
    const { buyer, presale, unit } = await deployFixture();

    // 100,000 ATH × $0.070 = $7,000
    //  50,000 ATH × $0.071 = $3,550
    // total = $10,550
    const athAmount = ethers.parseEther("150000");
    const quote = await presale.quotePaymentForATH(athAmount);
    expect(quote).to.equal(10_550n * unit);

    await presale.connect(buyer).buyATH(athAmount, quote);
    expect(await presale.currentPriceUSD8()).to.equal(7_100_000n);
  });

  it("sells the final live tranche at $0.369 and reaches $0.370 exactly at sold out", async function () {
    const { buyer, presale, unit } = await deployFixture();

    const first = ethers.parseEther("29900000");
    const firstQuote = await presale.quotePaymentForATH(first);
    await presale.connect(buyer).buyATH(first, firstQuote);

    expect(await presale.currentPriceUSD8()).to.equal(36_900_000n);

    const finalTranche = ethers.parseEther("100000");
    expect(await presale.quotePaymentForATH(finalTranche)).to.equal(36_900n * unit);
    await presale.connect(buyer).buyATH(finalTranche, 36_900n * unit);

    expect(await presale.totalSoldATH()).to.equal(ethers.parseEther("30000000"));
    expect(await presale.remainingATH()).to.equal(0n);
    expect(await presale.soldOut()).to.equal(true);
    expect(await presale.currentPriceUSD8()).to.equal(37_000_000n);
    await expect(
      presale.connect(buyer).buyATH(1n, ethers.MaxUint256)
    ).to.be.revertedWith("presale allocation exceeded");
  });

  it("collects $6.585M if the complete 30M allocation sells through the defined curve", async function () {
    const { presale, unit } = await deployFixture();
    const quote = await presale.quotePaymentForATH(ethers.parseEther("30000000"));
    expect(quote).to.equal(6_585_000n * unit);
  });

  it("enforces max-payment protection, pause controls, and protected unsold reserve", async function () {
    const { owner, buyer, other, ath, presale, unit } = await deployFixture();

    const amount = ethers.parseEther("100000");
    await expect(
      presale.connect(buyer).buyATH(amount, (7_000n * unit) - 1n)
    ).to.be.revertedWith("payment exceeds max");

    await presale.connect(owner).pause();
    await expect(
      presale.connect(buyer).buyATH(amount, 7_000n * unit)
    ).to.be.revertedWithCustomError(presale, "EnforcedPause");

    await expect(
      presale.connect(owner).recoverExcessATH(other.address, 1n)
    ).to.be.revertedWith("protected presale reserve");

    await ath.transfer(await presale.getAddress(), ethers.parseEther("5"));
    await presale.connect(owner).recoverExcessATH(other.address, ethers.parseEther("5"));
    expect(await ath.balanceOf(other.address)).to.equal(ethers.parseEther("5"));
  });
});
