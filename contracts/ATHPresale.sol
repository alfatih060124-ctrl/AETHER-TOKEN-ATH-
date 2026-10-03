// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/// @title AETHER ATH Presale
/// @notice Sells exactly 30M ATH. Price opens at $0.07 and rises $0.001
///         after each complete 100,000 ATH sold. At sell-out the displayed
///         presale price reaches $0.37 and the sale is closed.
contract ATHPresale is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant PRICE_DECIMALS = 8;
    uint256 public constant START_PRICE_USD8 = 7_000_000;   // $0.070
    uint256 public constant PRICE_STEP_USD8 = 100_000;      // $0.001
    uint256 public constant FINAL_PRICE_USD8 = 37_000_000;  // $0.370
    uint256 public constant STEP_SIZE_ATH = 100_000 ether;
    uint256 public constant SALE_ALLOCATION_ATH = 30_000_000 ether;
    uint256 public constant TOTAL_PRICE_STEPS = 300;

    IERC20 public immutable athToken;
    IERC20Metadata public immutable paymentToken;
    uint256 public immutable paymentUnit;

    address public treasury;
    uint256 public totalSoldATH;
    uint256 public totalPaymentCollected;

    event ATHPurchased(
        address indexed buyer,
        uint256 athAmount,
        uint256 paymentAmount,
        uint256 openingPriceUSD8,
        uint256 closingPriceUSD8,
        uint256 totalSoldATH
    );
    event TreasuryUpdated(address indexed previousTreasury, address indexed newTreasury);

    constructor(
        address athToken_,
        address paymentToken_,
        address treasury_,
        address initialOwner
    ) Ownable(initialOwner) {
        require(athToken_ != address(0), "zero ATH token");
        require(paymentToken_ != address(0), "zero payment token");
        require(treasury_ != address(0), "zero treasury");
        uint8 decimals_ = IERC20Metadata(paymentToken_).decimals();
        require(decimals_ <= 18, "unsupported payment decimals");

        athToken = IERC20(athToken_);
        paymentToken = IERC20Metadata(paymentToken_);
        paymentUnit = 10 ** uint256(decimals_);
        treasury = treasury_;

        require(
            START_PRICE_USD8 + (TOTAL_PRICE_STEPS * PRICE_STEP_USD8) == FINAL_PRICE_USD8,
            "invalid price curve"
        );
        require(
            TOTAL_PRICE_STEPS * STEP_SIZE_ATH == SALE_ALLOCATION_ATH,
            "invalid sale curve"
        );
    }

    function currentPriceUSD8() public view returns (uint256) {
        uint256 steps = totalSoldATH / STEP_SIZE_ATH;
        uint256 price = START_PRICE_USD8 + (steps * PRICE_STEP_USD8);
        return price > FINAL_PRICE_USD8 ? FINAL_PRICE_USD8 : price;
    }

    function remainingATH() public view returns (uint256) {
        return SALE_ALLOCATION_ATH - totalSoldATH;
    }

    function soldOut() external view returns (bool) {
        return totalSoldATH == SALE_ALLOCATION_ATH;
    }

    /// @notice Returns payment-token units required for an exact ATH amount.
    /// @dev Correctly prices a purchase that crosses one or many 100k ATH tranches.
    function quotePaymentForATH(uint256 athAmount) public view returns (uint256) {
        require(athAmount > 0, "zero ATH amount");
        require(athAmount <= remainingATH(), "presale allocation exceeded");
        return _quotePayment(totalSoldATH, athAmount);
    }

    /// @param maxPaymentAmount Buyer protection if another purchase advances the curve first.
    function buyATH(uint256 athAmount, uint256 maxPaymentAmount)
        external
        whenNotPaused
        nonReentrant
        returns (uint256 paymentAmount)
    {
        require(athAmount > 0, "zero ATH amount");
        require(athAmount <= remainingATH(), "presale allocation exceeded");

        uint256 openingPrice = currentPriceUSD8();
        paymentAmount = _quotePayment(totalSoldATH, athAmount);
        require(paymentAmount <= maxPaymentAmount, "payment exceeds max");

        totalSoldATH += athAmount;
        totalPaymentCollected += paymentAmount;

        IERC20(address(paymentToken)).safeTransferFrom(msg.sender, treasury, paymentAmount);
        athToken.safeTransfer(msg.sender, athAmount);

        emit ATHPurchased(
            msg.sender,
            athAmount,
            paymentAmount,
            openingPrice,
            currentPriceUSD8(),
            totalSoldATH
        );
    }

    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "zero treasury");
        address previous = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(previous, newTreasury);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Only ATH above the unsold presale reserve can be recovered.
    function recoverExcessATH(address to, uint256 amount) external onlyOwner whenPaused {
        require(to != address(0), "zero recipient");
        uint256 balance = athToken.balanceOf(address(this));
        uint256 protectedUnsold = remainingATH();
        require(balance >= protectedUnsold, "presale reserve underfunded");
        require(amount <= balance - protectedUnsold, "protected presale reserve");
        athToken.safeTransfer(to, amount);
    }

    function _quotePayment(uint256 soldBefore, uint256 athAmount) internal view returns (uint256) {
        uint256 amountLeft = athAmount;
        uint256 index = soldBefore / STEP_SIZE_ATH;
        uint256 offset = soldBefore % STEP_SIZE_ATH;
        uint256 weightedPrice;

        if (offset != 0) {
            uint256 availableInCurrent = STEP_SIZE_ATH - offset;
            uint256 segment = amountLeft < availableInCurrent ? amountLeft : availableInCurrent;
            weightedPrice += segment * (START_PRICE_USD8 + (index * PRICE_STEP_USD8));
            amountLeft -= segment;
            if (segment == availableInCurrent) index += 1;
        }

        if (amountLeft >= STEP_SIZE_ATH) {
            uint256 fullSteps = amountLeft / STEP_SIZE_ATH;
            uint256 indexSum = (fullSteps * ((2 * index) + fullSteps - 1)) / 2;
            uint256 priceSum =
                (fullSteps * START_PRICE_USD8) + (PRICE_STEP_USD8 * indexSum);
            weightedPrice += STEP_SIZE_ATH * priceSum;
            amountLeft -= fullSteps * STEP_SIZE_ATH;
            index += fullSteps;
        }

        if (amountLeft > 0) {
            weightedPrice += amountLeft * (START_PRICE_USD8 + (index * PRICE_STEP_USD8));
        }

        uint256 denominator = 1e26; // 1e18 ATH decimals * 1e8 USD price decimals
        uint256 payment = Math.mulDiv(weightedPrice, paymentUnit, denominator);
        if (mulmod(weightedPrice, paymentUnit, denominator) > 0) payment += 1;
        return payment;
    }
}
