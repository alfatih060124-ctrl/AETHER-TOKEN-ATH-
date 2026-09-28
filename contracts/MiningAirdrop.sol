// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Aether ATH Mining Engine v3.2
 * @notice Implements the ATH Mining System v3.1 blueprint:
 *  - 1 ATH base reward per mining day; user must claim that day or it is lost
 *  - mining access by buying Power for 0.001 BNB
 *  - 180 mining-day window
 *  - referral reward multiplier +10% through +50%
 *  - Booster: 0.001 BNB adds 100 Hash and enables a 2x reward multiplier
 *  - each daily reward is vested: 10% @30d, 5% @60d, 5% @90d, 80% @180d
 *  - display price: $3.00 + $0.001 for every 10,000 ATH allocated by mining
 *
 * @dev This contract allocates rewards into vesting positions. It does not mint ATH.
 *      The mining pool must be funded with ATH after deployment.
 */
contract MiningAirdrop is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable athToken;

    uint256 public constant POWER_PRICE = 0.001 ether;
    uint256 public constant BOOSTER_PRICE = 0.001 ether;
    uint256 public constant BASE_REWARD = 1 ether; // 1 ATH, 18 decimals
    uint256 public constant MAX_DAYS = 180;
    uint256 public constant DAY = 1 days;
    uint256 public constant MINING_POOL_ALLOCATION = 700_000_000 ether;

    uint256 public constant VEST_30 = 30 days;
    uint256 public constant VEST_60 = 60 days;
    uint256 public constant VEST_90 = 90 days;
    uint256 public constant VEST_180 = 180 days;

    uint256 public constant PCT_30 = 10;
    uint256 public constant PCT_60 = 5;
    uint256 public constant PCT_90 = 5;
    uint256 public constant PCT_180 = 80;

    uint256 public constant BOOSTER_HASH = 100;
    uint256 public constant ONE_X = 10_000;
    uint256 public constant TWO_X = 20_000;

    struct UserInfo {
        bool hasPower;
        uint256 startTime;
        uint256 lastClaimDay;
        uint256 totalAllocated;
        uint256 totalClaimed;
        uint256 referralCount;
        uint256 boosterMultiplier;
        uint256 totalHash;
    }

    struct VestingPosition {
        uint256 amount;
        uint256 amt30;
        uint256 amt60;
        uint256 amt90;
        uint256 amt180;
        uint256 startTime;
        uint256 claimed30;
        uint256 claimed60;
        uint256 claimed90;
        uint256 claimed180;
    }

    mapping(address => UserInfo) public users;
    mapping(address => VestingPosition[]) public vestingPositions;
    mapping(address => address) public referrerOf;
    mapping(address => address[]) private referrals;

    uint256 public totalMined;
    uint256 public totalPowerSold;
    uint256 public totalBoosterSold;
    uint256 public totalMiners;

    address public treasury;

    event PowerPurchased(address indexed user, address indexed referrer, uint256 timestamp);
    event BoosterPurchased(
        address indexed user,
        uint256 hashAdded,
        uint256 totalHash,
        uint256 rewardMultiplier,
        uint256 timestamp
    );
    event DailyClaimed(address indexed user, uint256 reward, uint256 dayNumber, uint256 positionIndex);
    event VestedClaimed(address indexed user, uint256 amount, uint256 positionIndex);
    event ReferralAdded(address indexed referrer, address indexed newUser);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event ExcessTokenWithdrawn(address indexed to, uint256 amount);

    constructor(address _athToken, address _treasury, address initialOwner)
        Ownable(initialOwner)
    {
        require(_athToken != address(0), "Invalid token");
        require(_treasury != address(0), "Invalid treasury");
        require(initialOwner != address(0), "Invalid owner");
        athToken = IERC20(_athToken);
        treasury = _treasury;
    }

    function buyPower(address referrer) external payable whenNotPaused nonReentrant {
        UserInfo storage user = users[msg.sender];
        require(!user.hasPower, "Already has Power");
        require(msg.value == POWER_PRICE, "Must send exactly 0.001 BNB");
        require(referrer != msg.sender, "Cannot refer yourself");

        user.hasPower = true;
        user.startTime = block.timestamp;
        user.lastClaimDay = 0;
        user.boosterMultiplier = ONE_X;

        totalPowerSold += 1;
        totalMiners += 1;

        if (referrer != address(0) && users[referrer].hasPower) {
            referrerOf[msg.sender] = referrer;
            referrals[referrer].push(msg.sender);
            users[referrer].referralCount += 1;
            emit ReferralAdded(referrer, msg.sender);
        }

        _forwardNative(msg.value);
        emit PowerPurchased(msg.sender, referrer, block.timestamp);
    }

    /**
     * @notice Each Booster purchase adds 100 Hash. Reward multiplier is capped at 2x,
     *         because the blueprint specifies Reward x2 (200%), not stacking x2 repeatedly.
     */
    function buyBooster() external payable whenNotPaused nonReentrant {
        UserInfo storage user = users[msg.sender];
        require(user.hasPower, "Must have Power first");
        require(msg.value == BOOSTER_PRICE, "Must send exactly 0.001 BNB");
        require(isMiningActive(msg.sender), "Mining period ended");

        user.totalHash += BOOSTER_HASH;
        user.boosterMultiplier = TWO_X;
        totalBoosterSold += 1;

        _forwardNative(msg.value);
        emit BoosterPurchased(
            msg.sender,
            BOOSTER_HASH,
            user.totalHash,
            user.boosterMultiplier,
            block.timestamp
        );
    }

    function claimDaily() external whenNotPaused nonReentrant {
        UserInfo storage user = users[msg.sender];
        require(user.hasPower, "No Power");

        uint256 currentDay = _getCurrentDay(user.startTime);
        require(currentDay >= 1 && currentDay <= MAX_DAYS, "Mining period ended or not started");
        require(currentDay > user.lastClaimDay, "Already claimed today");

        user.lastClaimDay = currentDay;

        uint256 referralMultiplier = _getReferralMultiplier(user.referralCount);
        uint256 finalMultiplier = (referralMultiplier * user.boosterMultiplier) / ONE_X;
        uint256 reward = (BASE_REWARD * finalMultiplier) / ONE_X;

        require(totalMined + reward <= MINING_POOL_ALLOCATION, "Mining allocation exhausted");
        uint256 fundedCapacity = athToken.balanceOf(address(this)) + globalClaimed;
        require(totalMined + reward <= fundedCapacity, "Mining reserve not funded");

        uint256 a30 = (reward * PCT_30) / 100;
        uint256 a60 = (reward * PCT_60) / 100;
        uint256 a90 = (reward * PCT_90) / 100;
        uint256 a180 = reward - a30 - a60 - a90;

        vestingPositions[msg.sender].push(
            VestingPosition({
                amount: reward,
                amt30: a30,
                amt60: a60,
                amt90: a90,
                amt180: a180,
                startTime: block.timestamp,
                claimed30: 0,
                claimed60: 0,
                claimed90: 0,
                claimed180: 0
            })
        );

        user.totalAllocated += reward;
        totalMined += reward;

        emit DailyClaimed(msg.sender, reward, currentDay, vestingPositions[msg.sender].length - 1);
    }

    function claimVested(uint256 positionIndex) external whenNotPaused nonReentrant {
        UserInfo storage user = users[msg.sender];
        require(user.hasPower, "No Power");
        require(positionIndex < vestingPositions[msg.sender].length, "Invalid position");

        VestingPosition storage pos = vestingPositions[msg.sender][positionIndex];
        uint256 claimable = _calculateClaimable(pos);
        require(claimable > 0, "Nothing to claim yet");

        _markClaimed(pos);
        user.totalClaimed += claimable;
        globalClaimed += claimable;
        athToken.safeTransfer(msg.sender, claimable);

        emit VestedClaimed(msg.sender, claimable, positionIndex);
    }

    function claimAllVested() external whenNotPaused nonReentrant {
        UserInfo storage user = users[msg.sender];
        require(user.hasPower, "No Power");

        uint256 totalClaimable;
        VestingPosition[] storage positions = vestingPositions[msg.sender];

        for (uint256 i = 0; i < positions.length; i++) {
            uint256 claimable = _calculateClaimable(positions[i]);
            if (claimable == 0) continue;
            _markClaimed(positions[i]);
            totalClaimable += claimable;
            emit VestedClaimed(msg.sender, claimable, i);
        }

        require(totalClaimable > 0, "Nothing to claim yet");
        user.totalClaimed += totalClaimable;
        globalClaimed += totalClaimable;
        athToken.safeTransfer(msg.sender, totalClaimable);
    }

    function isMiningActive(address account) public view returns (bool) {
        UserInfo memory user = users[account];
        if (!user.hasPower) return false;
        uint256 currentDay = _getCurrentDay(user.startTime);
        return currentDay >= 1 && currentDay <= MAX_DAYS;
    }

    function getUserInfo(address account)
        external
        view
        returns (
            bool hasPower,
            bool miningActive,
            uint256 startTime,
            uint256 lastClaimDay,
            uint256 currentDay,
            uint256 totalAllocated,
            uint256 totalClaimed,
            uint256 pendingVested,
            uint256 referralCount,
            uint256 referralBonusBps,
            uint256 boosterMultiplier,
            uint256 totalHash,
            uint256 positionsCount
        )
    {
        UserInfo memory u = users[account];
        hasPower = u.hasPower;
        startTime = u.startTime;
        lastClaimDay = u.lastClaimDay;
        currentDay = u.hasPower ? _getCurrentDay(u.startTime) : 0;
        miningActive = u.hasPower && currentDay >= 1 && currentDay <= MAX_DAYS;
        totalAllocated = u.totalAllocated;
        totalClaimed = u.totalClaimed;
        pendingVested = u.totalAllocated - u.totalClaimed;
        referralCount = u.referralCount;
        referralBonusBps = _getReferralMultiplier(u.referralCount) - ONE_X;
        boosterMultiplier = u.boosterMultiplier;
        totalHash = u.totalHash;
        positionsCount = vestingPositions[account].length;
    }

    function getVestingPosition(address account, uint256 index)
        external
        view
        returns (
            uint256 amount,
            uint256 amt30,
            uint256 amt60,
            uint256 amt90,
            uint256 amt180,
            uint256 startTime,
            uint256 claimed30,
            uint256 claimed60,
            uint256 claimed90,
            uint256 claimed180,
            uint256 claimable30,
            uint256 claimable60,
            uint256 claimable90,
            uint256 claimable180
        )
    {
        require(index < vestingPositions[account].length, "Invalid position");
        VestingPosition memory pos = vestingPositions[account][index];

        amount = pos.amount;
        amt30 = pos.amt30;
        amt60 = pos.amt60;
        amt90 = pos.amt90;
        amt180 = pos.amt180;
        startTime = pos.startTime;
        claimed30 = pos.claimed30;
        claimed60 = pos.claimed60;
        claimed90 = pos.claimed90;
        claimed180 = pos.claimed180;

        if (block.timestamp >= pos.startTime + VEST_30) claimable30 = pos.amt30 - pos.claimed30;
        if (block.timestamp >= pos.startTime + VEST_60) claimable60 = pos.amt60 - pos.claimed60;
        if (block.timestamp >= pos.startTime + VEST_90) claimable90 = pos.amt90 - pos.claimed90;
        if (block.timestamp >= pos.startTime + VEST_180) claimable180 = pos.amt180 - pos.claimed180;
    }

    function getPositionsCount(address account) external view returns (uint256) {
        return vestingPositions[account].length;
    }

    function getReferrals(address account) external view returns (address[] memory) {
        return referrals[account];
    }

    /** @return priceInMicroUSD Example: $3.001 = 3,001,000. */
    function getCurrentPrice() external view returns (uint256 priceInMicroUSD) {
        uint256 minedWhole = totalMined / 1 ether;
        uint256 steps = minedWhole / 10_000;
        priceInMicroUSD = 3_000_000 + (steps * 1_000);
    }

    function contractBalance() external view returns (uint256) {
        return athToken.balanceOf(address(this));
    }

    uint256 public globalClaimed;

    function outstandingVestingLiability() public view returns (uint256) {
        return totalMined - globalClaimed;
    }

    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury");
        address old = treasury;
        treasury = _treasury;
        emit TreasuryUpdated(old, _treasury);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Owner may withdraw only ATH above already-allocated but unclaimed vesting liability.
     */
    function withdrawExcessATH(address to, uint256 amount) external onlyOwner whenPaused {
        require(to != address(0), "Invalid recipient");
        uint256 balance = athToken.balanceOf(address(this));
        uint256 liability = totalMined - globalClaimed;
        require(balance >= liability, "Reserve underfunded");
        require(amount <= balance - liability, "Amount exceeds excess reserve");
        athToken.safeTransfer(to, amount);
        emit ExcessTokenWithdrawn(to, amount);
    }

    function _getCurrentDay(uint256 startTime) internal view returns (uint256) {
        if (block.timestamp < startTime) return 0;
        return ((block.timestamp - startTime) / DAY) + 1;
    }

    function _getReferralMultiplier(uint256 count) internal pure returns (uint256) {
        if (count >= 46) return 15_000;
        if (count >= 41) return 14_500;
        if (count >= 36) return 14_000;
        if (count >= 31) return 13_500;
        if (count >= 26) return 13_000;
        if (count >= 21) return 12_500;
        if (count >= 11) return 12_000;
        if (count >= 6) return 11_500;
        if (count >= 1) return 11_000;
        return ONE_X;
    }

    function _calculateClaimable(VestingPosition storage pos) internal view returns (uint256 claimable) {
        if (block.timestamp >= pos.startTime + VEST_30) claimable += pos.amt30 - pos.claimed30;
        if (block.timestamp >= pos.startTime + VEST_60) claimable += pos.amt60 - pos.claimed60;
        if (block.timestamp >= pos.startTime + VEST_90) claimable += pos.amt90 - pos.claimed90;
        if (block.timestamp >= pos.startTime + VEST_180) claimable += pos.amt180 - pos.claimed180;
    }

    function _markClaimed(VestingPosition storage pos) internal {
        if (block.timestamp >= pos.startTime + VEST_30) pos.claimed30 = pos.amt30;
        if (block.timestamp >= pos.startTime + VEST_60) pos.claimed60 = pos.amt60;
        if (block.timestamp >= pos.startTime + VEST_90) pos.claimed90 = pos.amt90;
        if (block.timestamp >= pos.startTime + VEST_180) pos.claimed180 = pos.amt180;
    }

    function _forwardNative(uint256 amount) internal {
        (bool success, ) = treasury.call{value: amount}("");
        require(success, "BNB transfer failed");
    }

    receive() external payable {}
}
