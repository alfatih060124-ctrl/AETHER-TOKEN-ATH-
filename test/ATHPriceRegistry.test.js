const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AETHER ATH Unified Presale-linked Price Registry", function () {
  async function deployFixture() {
    const [owner, buyer, treasury] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("ATHToken");
    const ath = await Token.deploy(owner.address);
    await ath.waitForDeployment();

    const Stable = await ethers.getContractFactory("MockStablecoin");
    const usd = await Stable.deploy(6);
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
    await usd.mint(buyer.address, 10_000_000n * 1_000_000n);
    await usd.connect(buyer).approve(await presale.getAddress(), ethers.MaxUint256);

    const Registry = await ethers.getContractFactory("ATHPriceRegistry");
    const registry = await Registry.deploy(await presale.getAddress(), owner.address);
    await registry.waitForDeployment();

    return { owner, buyer, treasury, ath, usd, presale, registry };
  }

  it("starts at the Presale price $0.070 with a 15,000 holder listing target", async function () {
    const { presale, registry } = await deployFixture();

    expect(await registry.PRICE_DECIMALS()).to.equal(8n);
    expect(await registry.PRESALE_START_PRICE()).to.equal(7_000_000n);
    expect(await registry.PRESALE_FINAL_PRICE()).to.equal(37_000_000n);
    expect(await registry.HOLDER_TARGET()).to.equal(15_000n);
    expect(await registry.presalePriceSource()).to.equal(await presale.getAddress());
    expect(await registry.getPrice()).to.equal(7_000_000n);
    expect(await registry.getReferencePrice()).to.equal(7_000_000n);
    expect(await registry.priceMode()).to.equal(0n);
    expect(await registry.officialListingActivated()).to.equal(false);
  });

  it("tracks the Presale $0.001 step after each complete 100,000 ATH sold", async function () {
    const { owner, buyer, presale, registry } = await deployFixture();

    await presale.connect(owner).unpause();
    const amount = ethers.parseEther("100000");
    const quote = await presale.quotePaymentForATH(amount);
    await presale.connect(buyer).buyATH(amount, quote);

    expect(await presale.currentPriceUSD8()).to.equal(7_100_000n);
    expect(await registry.getPresalePrice()).to.equal(7_100_000n);
    expect(await registry.getPrice()).to.equal(7_100_000n);
    expect(await registry.getPresaleSoldATH()).to.equal(amount);
  });

  it("can expose live DEX price before listing without replacing the Presale-linked official price", async function () {
    const { owner, registry } = await deployFixture();

    const Mock = await ethers.getContractFactory("MockATHMarketPriceOracle");
    const market = await Mock.deploy(41_250_000n);
    await market.waitForDeployment();

    await registry.setMarketPriceOracle(await market.getAddress());
    expect(await registry.getMarketPrice()).to.equal(41_250_000n);
    expect(await registry.getPrice()).to.equal(7_000_000n);
  });

  it("only switches to market price after the 15,000 holder listing gate", async function () {
    const { owner, registry } = await deployFixture();

    const Mock = await ethers.getContractFactory("MockATHMarketPriceOracle");
    const market = await Mock.deploy(41_250_000n);
    await market.waitForDeployment();

    await registry.setMarketPriceOracle(await market.getAddress());
    await registry.recordHolderCount(14_999);
    await expect(registry.activateOfficialListing()).to.be.revertedWith("holder target not reached");

    await registry.recordHolderCount(15_000);
    expect(await registry.listingReady()).to.equal(true);
    await expect(registry.activateOfficialListing()).to.emit(registry, "OfficialListingActivated");

    expect(await registry.priceMode()).to.equal(1n);
    expect(await registry.officialListingActivated()).to.equal(true);
    expect(await registry.getPrice()).to.equal(41_250_000n);

    await market.setPrice(39_900_000n);
    expect(await registry.getPrice()).to.equal(39_900_000n);
    await expect(registry.activateOfficialListing()).to.be.revertedWith("listing already active");
  });
});
