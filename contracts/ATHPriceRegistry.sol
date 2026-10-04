// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IATHMarketPriceOracle {
    function getPrice() external view returns (uint256 priceUSD8);
}

interface IATHPresalePriceSource {
    function currentPriceUSD8() external view returns (uint256 priceUSD8);
    function totalSoldATH() external view returns (uint256);
    function remainingATH() external view returns (uint256);
}

/// @title AETHER ATH Unified Price Registry
/// @notice Before official listing, the ATH reference price follows the Presale curve:
///         $0.070 opening and +$0.001 after each complete 100,000 ATH sold.
///         Mining and Staking both consume this same reference price.
/// @dev After the holder gate and explicit owner activation, the registry may switch
///      one-way to a live market oracle.
contract ATHPriceRegistry is Ownable {
    uint256 public constant PRICE_DECIMALS = 8;
    uint256 public constant PRESALE_START_PRICE = 7_000_000; // $0.070
    uint256 public constant PRESALE_FINAL_PRICE = 37_000_000; // $0.370
    uint256 public constant HOLDER_TARGET = 15_000;

    enum PriceMode {
        PRESALE,
        MARKET
    }

    PriceMode public priceMode;
    IATHPresalePriceSource public immutable presalePriceSource;
    IATHMarketPriceOracle public marketPriceOracle;
    uint256 public recordedHolderCount;
    bool public officialListingActivated;

    event MarketPriceOracleUpdated(address indexed previousOracle, address indexed newOracle);
    event HolderCountRecorded(uint256 previousCount, uint256 newCount);
    event OfficialListingActivated(uint256 holderCount, address indexed marketOracle, uint256 marketPriceUSD8);

    constructor(address presalePriceSource_, address initialOwner) Ownable(initialOwner) {
        require(presalePriceSource_ != address(0), "zero presale source");
        require(initialOwner != address(0), "zero owner");
        presalePriceSource = IATHPresalePriceSource(presalePriceSource_);
    }

    function getPrice() external view returns (uint256) {
        if (!officialListingActivated) return _readPresalePrice();
        return _readMarketPrice();
    }

    function getReferencePrice() external view returns (uint256) {
        if (!officialListingActivated) return _readPresalePrice();
        return _readMarketPrice();
    }

    function getPresalePrice() external view returns (uint256) {
        return _readPresalePrice();
    }

    function getPresaleSoldATH() external view returns (uint256) {
        return presalePriceSource.totalSoldATH();
    }

    function getPresaleRemainingATH() external view returns (uint256) {
        return presalePriceSource.remainingATH();
    }

    /// @notice Live market price may be exposed before official listing without changing
    ///         the official Presale-linked reference price.
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

    function _readPresalePrice() internal view returns (uint256 price) {
        price = presalePriceSource.currentPriceUSD8();
        require(price >= PRESALE_START_PRICE && price <= PRESALE_FINAL_PRICE, "invalid presale price");
    }

    function _readMarketPrice() internal view returns (uint256 price) {
        require(address(marketPriceOracle) != address(0), "market oracle not set");
        price = marketPriceOracle.getPrice();
        require(price > 0, "invalid market price");
    }
}
