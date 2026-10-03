// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IATHMarketPriceOracle {
    function getPrice() external view returns (uint256 priceUSD8);
}

/// @title AETHER ATH Unified Price Registry
/// @notice Keeps the official ATH reference price fixed at $0.37 before listing,
///         while optionally exposing a separate live market price for DEX visibility.
/// @dev The switch to MARKET is one-way and requires a recorded holder count >= 15,000.
contract ATHPriceRegistry is Ownable {
    uint256 public constant PRICE_DECIMALS = 8;
    uint256 public constant PRE_LISTING_PRICE = 37_000_000; // $0.37, 8 decimals
    uint256 public constant HOLDER_TARGET = 15_000;

    enum PriceMode {
        PRE_LISTING_FIXED,
        MARKET
    }

    PriceMode public priceMode;
    IATHMarketPriceOracle public marketPriceOracle;
    uint256 public recordedHolderCount;
    bool public officialListingActivated;

    event MarketPriceOracleUpdated(address indexed previousOracle, address indexed newOracle);
    event HolderCountRecorded(uint256 previousCount, uint256 newCount);
    event OfficialListingActivated(uint256 holderCount, address indexed marketOracle, uint256 marketPriceUSD8);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function getPrice() external view returns (uint256) {
        if (!officialListingActivated) return PRE_LISTING_PRICE;
        return _readMarketPrice();
    }

    function getReferencePrice() external pure returns (uint256) {
        return PRE_LISTING_PRICE;
    }

    /// @notice Live market price can be viewed before listing without changing the official $0.37 reference.
    function getMarketPrice() external view returns (uint256) {
        return _readMarketPrice();
    }

    function listingReady() external view returns (bool) {
        return recordedHolderCount >= HOLDER_TARGET && address(marketPriceOracle) != address(0);
    }

    function setMarketPriceOracle(address newOracle) external onlyOwner {
        require(newOracle != address(0), "zero market oracle");
        address previous = address(marketPriceOracle);
        marketPriceOracle = IATHMarketPriceOracle(newOracle);
        emit MarketPriceOracleUpdated(previous, newOracle);
    }

    function recordHolderCount(uint256 newCount) external onlyOwner {
        uint256 previous = recordedHolderCount;
        recordedHolderCount = newCount;
        emit HolderCountRecorded(previous, newCount);
    }

    function activateOfficialListing() external onlyOwner {
        require(!officialListingActivated, "listing already active");
        require(recordedHolderCount >= HOLDER_TARGET, "holder target not reached");
        require(address(marketPriceOracle) != address(0), "market oracle not set");

        uint256 marketPrice = _readMarketPrice();
        officialListingActivated = true;
        priceMode = PriceMode.MARKET;

        emit OfficialListingActivated(recordedHolderCount, address(marketPriceOracle), marketPrice);
    }

    function _readMarketPrice() internal view returns (uint256 price) {
        require(address(marketPriceOracle) != address(0), "market oracle not set");
        price = marketPriceOracle.getPrice();
        require(price > 0, "invalid market price");
    }
}
