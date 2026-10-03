// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ATH Staking Price Oracle
/// @notice Fixed protocol reference price for ATH Staking v1.
/// @dev 8 decimals: $0.10 = 10_000_000. This is a protocol valuation,
///      not a market-price guarantee.
contract ATHStakingPriceOracle {
    uint256 public constant PRICE_DECIMALS = 8;
    uint256 public constant ATH_PRICE_USD8 = 10_000_000;

    function getPrice() external pure returns (uint256) {
        return ATH_PRICE_USD8;
    }
}
