// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IATHStakingPriceOracle {
    function getPrice() external view returns (uint256);
}

/// @title AETHER ATH Staking v1
/// @notice Separate staking engine for the 300M ATH staking ecosystem allocation.
/// @dev MiningAirdrop is intentionally not referenced or modified by this contract.
contract ATHStaking is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant BPS = 10_000;
    uint256 public constant REFERRAL_BPS = 1_000; // 10%
    uint256 public constant STAKING_ECOSYSTEM_ALLOCATION = 300_000_000 ether;
    uint256 public constant MAX_REWARD_POOL = 160_000_000 ether;
    uint256 public constant MIN_STAKE_USDT = 10 ether;
    uint256 public constant MAX_DAILY_RATE_BPS = 100; // hard safety cap: 1.00% / day
    uint256 public constant MAX_PACKAGE_LOCK_DAYS = 3_650;
    uint256 public constant MAX_REFERRAL_DEPTH_CHECK = 64;

    IERC20 public immutable athToken;
    IATHStakingPriceOracle public immutable priceOracle;

    struct Package {
        uint256 minUSDT;
        uint256 maxUSDT;
        uint256 dailyRateBps;
        uint256 lockDays;
        bool active;
    }

    struct StakeInfo {
        uint256 amountUSDT;
        uint256 principalATH;
        uint256 packageId;
        uint256 dailyRateBps;
        uint256 lockDays;
        uint256 startTime;
        uint256 lastClaimTime;
        uint256 totalClaimedUSDT;
        bool principalWithdrawn;
    }

    struct UserInfo {
        address referrer;
        uint256 activeStakedUSDT;
        uint256 totalReferralEarnedATH;
        uint256 totalNetworkEarnedATH;
    }

    Package[] public packages;
    mapping(address => UserInfo) public userInfo;
    mapping(address => StakeInfo[]) public userStakes;

    uint256 public totalActiveStakedUSDT;
    uint256 public principalLiabilityATH;
    uint256 public rewardReserveATH;
    uint256 public totalRewardFundedATH;
    uint256 public totalRewardPaidATH;
    uint256 public totalReferralPaidATH;
    uint256 public totalNetworkPaidATH;

    // L1 8%, L2 5%, L3 3%, L4 2%, L5 1%, L6-L10 0.5%.
    uint256[10] public networkRates = [800, 500, 300, 200, 100, 50, 50, 50, 50, 50];

    event RewardReserveFunded(address indexed funder, uint256 amount, uint256 reserveAfter);
    event ReferrerBound(address indexed user, address indexed referrer);
    event Staked(
        address indexed user,
        uint256 indexed stakeId,
        uint256 packageId,
        uint256 amountUSDT,
        uint256 principalATH,
        uint256 dailyRateBps,
        uint256 lockDays
    );
    event ReferralPaid(address indexed referrer, address indexed user, uint256 amountATH);
    event RewardClaimed(
        address indexed user,
        uint256 indexed stakeId,
        uint256 rewardUSDT,
        uint256 rewardATH,
        uint256 networkATH
    );
    event NetworkRewardPaid(
        address indexed beneficiary,
        address indexed sourceUser,
        uint8 indexed level,
        uint256 amountATH
    );
    event PrincipalWithdrawn(address indexed user, uint256 indexed stakeId, uint256 principalATH);
    event PackageAdded(uint256 indexed packageId, uint256 minUSDT, uint256 maxUSDT, uint256 dailyRateBps, uint256 lockDays);
    event PackageUpdated(uint256 indexed packageId, uint256 minUSDT, uint256 maxUSDT, uint256 dailyRateBps, uint256 lockDays, bool active);
    event ExcessRecovered(address indexed to, uint256 amount);

    constructor(address token_, address oracle_, address initialOwner) Ownable(initialOwner) {
        require(token_ != address(0) && oracle_ != address(0) && initialOwner != address(0), "zero address");
        athToken = IERC20(token_);
        priceOracle = IATHStakingPriceOracle(oracle_);

        _addPackage(10 ether, 99 ether, 35, 180);
        _addPackage(100 ether, 499 ether, 45, 180);
        _addPackage(500 ether, 1_999 ether, 55, 365);
        _addPackage(2_000 ether, 9_999 ether, 65, 365);
        _addPackage(10_000 ether, 49_999 ether, 75, 730);
        _addPackage(50_000 ether, type(uint256).max, 85, 730);
    }

    function packageCount() external view returns (uint256) {
        return packages.length;
    }

    function stakeCount(address user) external view returns (uint256) {
        return userStakes[user].length;
    }

    function getATHAmount(uint256 amountUSDT) public view returns (uint256) {
        uint256 price = priceOracle.getPrice();
        require(price > 0, "invalid price");
        return (amountUSDT * 1e8) / price;
    }

    function rewardEnd(address user, uint256 stakeId) public view returns (uint256) {
        StakeInfo storage position = userStakes[user][stakeId];
        return position.startTime + (position.lockDays * 1 days);
    }

    function getPendingRewardUSDT(address user, uint256 stakeId) public view returns (uint256) {
        StakeInfo storage position = userStakes[user][stakeId];
        uint256 end = position.startTime + (position.lockDays * 1 days);
        uint256 effectiveNow = block.timestamp < end ? block.timestamp : end;
        if (effectiveNow <= position.lastClaimTime) return 0;

        uint256 fullDays = (effectiveNow - position.lastClaimTime) / 1 days;
        if (fullDays == 0) return 0;

        return (position.amountUSDT * position.dailyRateBps * fullDays) / BPS;
    }

    function getPendingRewardATH(address user, uint256 stakeId) external view returns (uint256) {
        return getATHAmount(getPendingRewardUSDT(user, stakeId));
    }

    function availableExcessATH() public view returns (uint256) {
        uint256 balance = athToken.balanceOf(address(this));
        uint256 protectedBalance = principalLiabilityATH + rewardReserveATH;
        return balance > protectedBalance ? balance - protectedBalance : 0;
    }

    function fundRewards(uint256 amount) external onlyOwner nonReentrant {
        require(amount > 0, "zero amount");
        require(totalRewardFundedATH + amount <= MAX_REWARD_POOL, "reward pool cap");
        athToken.safeTransferFrom(msg.sender, address(this), amount);
        totalRewardFundedATH += amount;
        rewardReserveATH += amount;
        emit RewardReserveFunded(msg.sender, amount, rewardReserveATH);
    }

    function stake(uint256 packageId, uint256 amountUSDT, address referrer)
        external
        nonReentrant
        whenNotPaused
    {
        require(packageId < packages.length, "invalid package");
        Package memory pkg = packages[packageId];
        require(pkg.active, "package inactive");
        require(amountUSDT >= MIN_STAKE_USDT, "minimum $10");
        require(amountUSDT >= pkg.minUSDT && amountUSDT <= pkg.maxUSDT, "amount out of range");

        UserInfo storage user = userInfo[msg.sender];
        if (user.referrer == address(0) && referrer != address(0)) {
            require(referrer != msg.sender, "self referral");
            require(!_createsReferralCycle(msg.sender, referrer), "referral cycle");
            user.referrer = referrer;
            emit ReferrerBound(msg.sender, referrer);
        }

        uint256 principalATH = getATHAmount(amountUSDT);
        require(principalATH > 0, "zero principal");
        athToken.safeTransferFrom(msg.sender, address(this), principalATH);

        principalLiabilityATH += principalATH;
        user.activeStakedUSDT += amountUSDT;
        totalActiveStakedUSDT += amountUSDT;

        userStakes[msg.sender].push(StakeInfo({
            amountUSDT: amountUSDT,
            principalATH: principalATH,
            packageId: packageId,
            dailyRateBps: pkg.dailyRateBps,
            lockDays: pkg.lockDays,
            startTime: block.timestamp,
            lastClaimTime: block.timestamp,
            totalClaimedUSDT: 0,
            principalWithdrawn: false
        }));

        uint256 stakeId = userStakes[msg.sender].length - 1;
        address boundReferrer = user.referrer;
        if (boundReferrer != address(0)) {
            uint256 referralReward = (principalATH * REFERRAL_BPS) / BPS;
            require(rewardReserveATH >= referralReward, "insufficient referral reserve");
            rewardReserveATH -= referralReward;
            totalRewardPaidATH += referralReward;
            totalReferralPaidATH += referralReward;
            userInfo[boundReferrer].totalReferralEarnedATH += referralReward;
            athToken.safeTransfer(boundReferrer, referralReward);
            emit ReferralPaid(boundReferrer, msg.sender, referralReward);
        }

        emit Staked(msg.sender, stakeId, packageId, amountUSDT, principalATH, pkg.dailyRateBps, pkg.lockDays);
    }

    function claimReward(uint256 stakeId) external nonReentrant whenNotPaused {
        require(stakeId < userStakes[msg.sender].length, "invalid stake");
        StakeInfo storage position = userStakes[msg.sender][stakeId];

        uint256 pendingUSDT = getPendingRewardUSDT(msg.sender, stakeId);
        require(pendingUSDT > 0, "no reward");

        uint256 rewardATH = getATHAmount(pendingUSDT);
        (address[10] memory uplines, uint256[10] memory payouts, uint256 networkTotal) =
            _previewNetwork(msg.sender, rewardATH);

        uint256 totalNeeded = rewardATH + networkTotal;
        require(rewardReserveATH >= totalNeeded, "insufficient reward reserve");

        uint256 end = position.startTime + (position.lockDays * 1 days);
        uint256 effectiveNow = block.timestamp < end ? block.timestamp : end;
        uint256 fullDays = (effectiveNow - position.lastClaimTime) / 1 days;
        position.lastClaimTime += fullDays * 1 days;
        position.totalClaimedUSDT += pendingUSDT;

        rewardReserveATH -= totalNeeded;
        totalRewardPaidATH += totalNeeded;

        athToken.safeTransfer(msg.sender, rewardATH);

        for (uint8 i = 0; i < 10; i++) {
            if (uplines[i] == address(0)) break;
            uint256 amount = payouts[i];
            if (amount == 0) continue;
            userInfo[uplines[i]].totalNetworkEarnedATH += amount;
            totalNetworkPaidATH += amount;
            athToken.safeTransfer(uplines[i], amount);
            emit NetworkRewardPaid(uplines[i], msg.sender, i + 1, amount);
        }

        emit RewardClaimed(msg.sender, stakeId, pendingUSDT, rewardATH, networkTotal);
    }

    function withdrawPrincipal(uint256 stakeId) external nonReentrant whenNotPaused {
        require(stakeId < userStakes[msg.sender].length, "invalid stake");
        StakeInfo storage position = userStakes[msg.sender][stakeId];
        require(!position.principalWithdrawn, "principal withdrawn");
        require(block.timestamp >= position.startTime + (position.lockDays * 1 days), "still locked");

        position.principalWithdrawn = true;
        principalLiabilityATH -= position.principalATH;
        userInfo[msg.sender].activeStakedUSDT -= position.amountUSDT;
        totalActiveStakedUSDT -= position.amountUSDT;

        athToken.safeTransfer(msg.sender, position.principalATH);
        emit PrincipalWithdrawn(msg.sender, stakeId, position.principalATH);
    }

    function addPackage(uint256 minUSDT, uint256 maxUSDT, uint256 dailyRateBps, uint256 lockDays)
        external
        onlyOwner
    {
        _addPackage(minUSDT, maxUSDT, dailyRateBps, lockDays);
    }

    function updatePackage(
        uint256 packageId,
        uint256 minUSDT,
        uint256 maxUSDT,
        uint256 dailyRateBps,
        uint256 lockDays,
        bool active
    ) external onlyOwner {
        require(packageId < packages.length, "invalid package");
        _validatePackage(minUSDT, maxUSDT, dailyRateBps, lockDays);
        packages[packageId] = Package(minUSDT, maxUSDT, dailyRateBps, lockDays, active);
        emit PackageUpdated(packageId, minUSDT, maxUSDT, dailyRateBps, lockDays, active);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function recoverExcessATH(address to, uint256 amount) external onlyOwner whenPaused nonReentrant {
        require(to != address(0), "zero recipient");
        require(amount <= availableExcessATH(), "protected balance");
        athToken.safeTransfer(to, amount);
        emit ExcessRecovered(to, amount);
    }

    function _addPackage(uint256 minUSDT, uint256 maxUSDT, uint256 dailyRateBps, uint256 lockDays) internal {
        _validatePackage(minUSDT, maxUSDT, dailyRateBps, lockDays);
        packages.push(Package(minUSDT, maxUSDT, dailyRateBps, lockDays, true));
        emit PackageAdded(packages.length - 1, minUSDT, maxUSDT, dailyRateBps, lockDays);
    }

    function _validatePackage(uint256 minUSDT, uint256 maxUSDT, uint256 dailyRateBps, uint256 lockDays)
        internal
        pure
    {
        require(minUSDT >= MIN_STAKE_USDT, "min below $10");
        require(maxUSDT >= minUSDT, "invalid range");
        require(dailyRateBps > 0 && dailyRateBps <= MAX_DAILY_RATE_BPS, "invalid daily rate");
        require(lockDays > 0 && lockDays <= MAX_PACKAGE_LOCK_DAYS, "invalid lock");
    }

    function _previewNetwork(address sourceUser, uint256 rewardATH)
        internal
        view
        returns (address[10] memory uplines, uint256[10] memory payouts, uint256 total)
    {
        address current = userInfo[sourceUser].referrer;
        for (uint8 i = 0; i < 10 && current != address(0); i++) {
            uplines[i] = current;
            uint256 amount = (rewardATH * networkRates[i]) / BPS;
            payouts[i] = amount;
            total += amount;
            current = userInfo[current].referrer;
        }
    }

    function _createsReferralCycle(address user, address candidate) internal view returns (bool) {
        address current = candidate;
        for (uint256 i = 0; i < MAX_REFERRAL_DEPTH_CHECK && current != address(0); i++) {
            if (current == user) return true;
            current = userInfo[current].referrer;
        }
        return false;
    }
}
