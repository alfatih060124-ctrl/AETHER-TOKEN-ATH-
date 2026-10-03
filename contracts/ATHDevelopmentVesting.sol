// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title ATH Development Vesting
/// @notice Locks the 30M ATH development allocation under the staking ecosystem.
/// @dev Two-month cliff, then 3% monthly; the final active month releases the
///      remaining balance so exactly 100% vests rather than leaving 1% stranded.
contract ATHDevelopmentVesting {
    using SafeERC20 for IERC20;

    uint256 public constant TOTAL_ALLOCATION = 30_000_000 ether;
    uint256 public constant CLIFF_MONTHS = 2;
    uint256 public constant ACTIVE_VESTING_MONTHS = 33;
    uint256 public constant MONTH = 30 days;
    uint256 public constant MONTHLY_BPS = 300; // 3%

    IERC20 public immutable athToken;
    address public immutable beneficiary;
    uint256 public immutable startTime;
    uint256 public claimedATH;

    event Claimed(address indexed beneficiary, uint256 amountATH);

    constructor(address token_, address beneficiary_) {
        require(token_ != address(0) && beneficiary_ != address(0), "zero address");
        athToken = IERC20(token_);
        beneficiary = beneficiary_;
        startTime = block.timestamp;
    }

    function vestedATH() public view returns (uint256) {
        uint256 monthsPassed = (block.timestamp - startTime) / MONTH;
        if (monthsPassed <= CLIFF_MONTHS) return 0;

        uint256 activeMonths = monthsPassed - CLIFF_MONTHS;
        if (activeMonths >= ACTIVE_VESTING_MONTHS) {
            return TOTAL_ALLOCATION;
        }

        return (TOTAL_ALLOCATION * MONTHLY_BPS * activeMonths) / 10_000;
    }

    function claimableATH() public view returns (uint256) {
        uint256 vested = vestedATH();
        return vested > claimedATH ? vested - claimedATH : 0;
    }

    function claim() external {
        require(msg.sender == beneficiary, "not beneficiary");
        uint256 amount = claimableATH();
        require(amount > 0, "nothing claimable");
        claimedATH += amount;
        athToken.safeTransfer(beneficiary, amount);
        emit Claimed(beneficiary, amount);
    }
}
