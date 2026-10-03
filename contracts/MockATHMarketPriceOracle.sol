// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @dev Test-only market price source with 8-decimal USD prices.
contract MockATHMarketPriceOracle {
    uint256 public price;

    constructor(uint256 initialPrice) {
        require(initialPrice > 0, "invalid price");
        price = initialPrice;
    }

    function setPrice(uint256 newPrice) external {
        require(newPrice > 0, "invalid price");
        price = newPrice;
    }

    function getPrice() external view returns (uint256) {
        return price;
    }
}
