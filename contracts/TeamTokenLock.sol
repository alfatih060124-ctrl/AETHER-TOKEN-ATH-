// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title TeamTokenLock
 * @notice Simple cliff lock for the 5% Team & Dev ATH allocation.
 * @dev Final ATH tokenomics fixes this allocation to a 12-month / 365-day cliff.
 *      Deployment and post-deployment gates enforce that policy.
 */
contract TeamTokenLock {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;
    address public immutable beneficiary;
    uint256 public immutable releaseTime;

    constructor(address token_, address beneficiary_, uint256 releaseTime_) {
        require(token_ != address(0), "Invalid token");
        require(beneficiary_ != address(0), "Invalid beneficiary");
        require(releaseTime_ > block.timestamp, "Release must be future");
        token = IERC20(token_);
        beneficiary = beneficiary_;
        releaseTime = releaseTime_;
    }

    function release() external {
        require(block.timestamp >= releaseTime, "Still locked");
        uint256 amount = token.balanceOf(address(this));
        require(amount > 0, "Nothing to release");
        token.safeTransfer(beneficiary, amount);
    }
}
