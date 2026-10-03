const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AETHER ATH Unified Price Registry", function () {
  it("locks the official pre-listing price at $0.37 with a 15,000 holder target", async function () {
    const [owner] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("ATHPriceRegistry");
    const registry = await Registry.deploy(owner.address);
    await registry.waitForDeployment();

    expect(await registry.PRICE_DECIMALS()).to.equal(8n);
    expect(await registry.PRE_LISTING_PRICE()).to.equal(37_000_000n);
    expect(await registry.HOLDER_TARGET()).to.equal(15_000n);
    expect(await registry.getPrice()).to.equal(37_000_000n);
    expect(await registry.priceMode()).to.equal(0n);
    expect(await registry.officialListingActivated()).to.equal(false);
  });

  it("can expose live DEX price before listing without changing the official $0.37 price", async function () {
    const [owner] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("ATHPriceRegistry");
    const registry = await Registry.deploy(owner.address);
    await registry.waitForDeployment();

    const Mock = await ethers.getContractFactory("MockATHMarketPriceOracle");
    const market = await Mock.deploy(41_250_000n);
    await market.waitForDeployment();

    await registry.setMarketPriceOracle(await market.getAddress());
    expect(await registry.getMarketPrice()).to.equal(41_250_000n);
    expect(await registry.getPrice()).to.equal(37_000_000n);
  });

  it("only switches to market price after the 15,000 holder listing gate", async function () {
    const [owner] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("ATHPriceRegistry");
    const registry = await Registry.deploy(owner.address);
    await registry.waitForDeployment();

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
