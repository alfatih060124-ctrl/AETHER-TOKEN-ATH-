// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IATHMiningPriceSource {
    function getCurrentPrice() external view returns (uint256 priceInMicroUSD);
}

/// @title ATH Staking Price Oracle
/// @notice Uses the same ATH protocol price source as ATH Mining.
/// @dev Mining exposes 6-decimal micro-USD. Staking consumes 8-decimal USD,
///      so getPrice() multiplies the Mining value by 100.
///      Base: $0.10. Step: +$0.001 per complete 100,000 ATH mined.
contract ATHStakingPriceOracle {
    uint256 public constant PRICE_DECIMALS = 8;
    IATHMiningPriceSource public immutable miningPriceSource;

    constructor(address miningPriceSource_) {
        require(miningPriceSource_ != address(0), "zero mining price source");
        miningPriceSource = IATHMiningPriceSource(miningPriceSource_);
    }

    function getPrice() external view returns (uint256) {
        return miningPriceSource.getCurrentPrice() * 100;
    }
}
