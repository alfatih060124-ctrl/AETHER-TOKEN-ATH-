// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IATHUnifiedPriceRegistry {
    function getPrice() external view returns (uint256 priceUSD8);
    function getMarketPrice() external view returns (uint256 priceUSD8);
}

/// @title ATH Staking Price Oracle
/// @notice Compatibility adapter for ATHStaking. The unified ATH Price Registry is the source of truth.
contract ATHStakingPriceOracle {
    uint256 public constant PRICE_DECIMALS = 8;
    IATHUnifiedPriceRegistry public immutable priceRegistry;

    constructor(address priceRegistry_) {
        require(priceRegistry_ != address(0), "zero price registry");
        priceRegistry = IATHUnifiedPriceRegistry(priceRegistry_);
    }

    function getPrice() external view returns (uint256) {
        return priceRegistry.getPrice();
    }

    function getMarketPrice() external view returns (uint256) {
        return priceRegistry.getMarketPrice();
    }
}
