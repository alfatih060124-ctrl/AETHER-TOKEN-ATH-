// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IATHBurnable is IERC20 {
    function burn(uint256 amount) external;
}

/**
 * @title Aether ATH Mining Engine v3.3
 * @notice Transparent UTC daily rewards, referral + booster multipliers,
 *         recurring 12-cycle vesting and on-chain ATH burn accounting.
 * @dev No ATH is minted here. The contract must be funded from the fixed
 *      700,000,000 ATH mining allocation.
 */
contract MiningAirdrop is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IATHBurnable public immutable athToken;

    uint256 public constant POWER_PRICE = 0.001 ether;
    uint256 public constant BASE_REWARD = 10 ether;
    uint256 public constant MAX_DAYS = 180;
    uint256 public constant DAY = 1 days;
    uint256 public constant CLAIM_OPEN_OFFSET = 5 minutes;
    uint256 public constant MINING_POOL_ALLOCATION = 700_000_000 ether;

    uint256 public constant VEST_30 = 30 days;
    uint256 public constant VEST_60 = 60 days;
    uint256 public constant VEST_90 = 90 days;
    uint256 public constant VEST_180 = 180 days;

    uint256 public constant PCT_30 = 10;
    uint256 public constant PCT_60 = 5;
    uint256 public constant PCT_90 = 5;
    uint256 public constant PCT_180 = 80;

    uint256 public constant CYCLE_BURN_PCT = 10;
    uint256 public constant CYCLE_UNLOCK_30_PCT = 10;
    uint256 public constant CYCLE_UNLOCK_60_PCT = 5;
    uint256 public constant CYCLE_UNLOCK_90_PCT = 5;
    uint256 public constant MAX_VESTING_CYCLES = 12;
    uint256 public constant FINAL_BURN_PCT = 60;
    uint256 public constant MAX_KEEPER_BATCH = 50;
    uint256 public constant MAX_MINER_PAGE = 200;

    uint256 public constant BOOSTER_HASH = 100;
    uint256 public constant BOOSTER_DURATION = 30 days;
    uint256 public constant DOUBLE_POWER_MIN_REFERRALS = 5;
    uint256 public constant ONE_X = 10_000;
    uint256 public constant TWO_X = 20_000;
    uint256 public constant SIX_X = 60_000;

    uint8 public constant REWARD_NONE = 0;
    uint8 public constant REWARD_CLAIMABLE = 1;
    uint8 public constant REWARD_CLAIMED = 2;
    uint8 public constant REWARD_EXPIRED = 3;
    uint8 public constant REWARD_PENDING = 4;

    uint256 public powerBoosterPrice = 0.001 ether;
    uint256 public doublePowerBoosterPrice = 0.001 ether;

    struct UserInfo {
        bool hasPower;
        uint256 startTime;
        uint256 miningStartDayId;
        uint256 lastClaimDay;
        uint256 totalAllocated;
        uint256 totalClaimed;
        uint256 totalBurned;
        uint256 referralCount;
        uint256 totalHash;
    }

    struct ReferralRecord {
        address user;
        uint64 effectiveAt;
    }

    struct BoosterPeriod {
        uint64 startTime;
        uint64 endTime;
        uint64 doubleStartTime;
    }

    struct DailyRewardRecord {
        uint256 reward;
        uint256 referralBonusBps;
        uint256 boosterMultiplier;
        uint64 calculatedAt;
        uint8 status;
    }

    struct VestingPosition {
        uint256 amount;
        uint256 initial30;
        uint256 initial60;
        uint256 initial90;
        uint256 cyclePrincipal;
        uint256 startTime;
        uint256 claimedInitial30;
        uint256 claimedInitial60;
        uint256 claimedInitial90;
        uint256 rolloverPending;
        uint256 finalPrincipal;
        uint256 finalDistribution;
        uint256 finalBurned;
        uint8 currentCycle;
        bool finalSettled;
        bool finalClaimed;
    }

    struct VestingCycle {
        uint256 incomingAmount;
        uint256 burnedAmount;
        uint256 unlock30;
        uint256 unlock60;
        uint256 unlock90;
        uint256 rolloverAmount;
        uint256 startTime;
        uint256 claimed30;
        uint256 claimed60;
        uint256 claimed90;
        bool entered;
    }

    mapping(address => UserInfo) public users;
    address[] private miners;
    mapping(address => VestingPosition[]) private vestingPositions;
    mapping(address => mapping(uint256 => mapping(uint8 => VestingCycle))) private vestingCycles;
    mapping(address => mapping(uint256 => DailyRewardRecord)) private dailyRewards;
    mapping(address => address) public referrerOf;
    mapping(address => ReferralRecord[]) private referralRecords;
    mapping(address => BoosterPeriod[]) private boosterPeriods;

    uint256 public totalMined;
    uint256 public totalPowerSold;
    uint256 public totalBoosterSold;
    uint256 public totalDoublePowerBoosterSold;
    uint256 public totalMiners;
    uint256 public globalClaimed;
    uint256 public globalBurned;

    address public treasury;

    event PowerPurchased(address indexed user, address indexed referrer, uint256 timestamp);
    event ReferralAdded(address indexed referrer, address indexed newUser, uint256 effectiveAt);
    event BoosterPurchased(
        address indexed user,
        uint256 hashAdded,
        uint256 totalHash,
        uint256 rewardMultiplier,
        uint256 timestamp
    );
    event PowerBoosterPurchased(
        address indexed user,
        uint256 price,
        uint256 startsAt,
        uint256 expiresAt
    );
    event DoublePowerBoosterPurchased(
        address indexed user,
        uint256 price,
        uint256 startsAt,
        uint256 expiresAt,
        uint256 referralCount
    );
    event BoosterPricesUpdated(
        uint256 oldPowerBoosterPrice,
        uint256 newPowerBoosterPrice,
        uint256 oldDoublePowerBoosterPrice,
        uint256 newDoublePowerBoosterPrice
    );

    event RewardCalculated(
        address indexed user,
        uint256 indexed dayId,
        uint256 baseReward,
        uint256 referralBonusBps,
        uint256 boosterMultiplier,
        uint256 reward,
        uint256 claimOpensAt,
        uint256 claimDeadline
    );
    event RewardClaimed(
        address indexed user,
        uint256 indexed dayId,
        uint256 reward,
        uint256 positionIndex
    );
    event RewardExpired(address indexed user, uint256 indexed dayId, uint256 reward);
    event RewardBatchSnapshotted(uint256 indexed dayId, uint256 requested, uint256 processed);
    event RewardBatchExpired(uint256 indexed dayId, uint256 requested, uint256 processed);
    event DailyClaimed(address indexed user, uint256 reward, uint256 dayNumber, uint256 positionIndex);

    event VestingCreated(
        address indexed user,
        uint256 indexed positionIndex,
        uint256 amount,
        uint256 startTime,
        uint256 unlock30,
        uint256 unlock60,
        uint256 unlock90,
        uint256 cyclePrincipal
    );
    event VestingCycleEntered(
        address indexed user,
        uint256 indexed positionIndex,
        uint8 indexed cycle,
        uint256 incomingAmount,
        uint256 burnedAmount,
        uint256 unlock30,
        uint256 unlock60,
        uint256 unlock90,
        uint256 rolloverAmount,
        uint256 scheduledStart
    );
    event ATHBurned(
        address indexed user,
        uint256 indexed positionIndex,
        uint8 indexed cycle,
        uint256 amount,
        uint8 burnType
    );
    event VestingTrancheClaimed(
        address indexed user,
        uint256 indexed positionIndex,
        uint8 indexed cycle,
        uint16 trancheDays,
        uint256 amount
    );
    event VestingFinalSettled(
        address indexed user,
        uint256 indexed positionIndex,
        uint256 principal,
        uint256 burned,
        uint256 distribution,
        uint256 scheduledAt
    );
    event VestedClaimed(address indexed user, uint256 amount, uint256 positionIndex);

    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event ExcessTokenWithdrawn(address indexed to, uint256 amount);

    constructor(address _athToken, address _treasury, address initialOwner)
        Ownable(initialOwner)
    {
        require(_athToken != address(0), "Invalid token");
        require(_treasury != address(0), "Invalid treasury");
        require(initialOwner != address(0), "Invalid owner");
        athToken = IATHBurnable(_athToken);
        treasury = _treasury;
    }

    function buyPower(address referrer) external payable whenNotPaused nonReentrant {
        UserInfo storage user = users[msg.sender];
        require(!user.hasPower, "Already has Power");
        require(msg.value == POWER_PRICE, "Must send exactly 0.001 BNB");
        require(referrer != msg.sender, "Cannot refer yourself");

        uint256 startDayId = _effectiveRewardDay(block.timestamp);
        user.hasPower = true;
        user.startTime = block.timestamp;
        user.miningStartDayId = startDayId;

        totalPowerSold += 1;
        totalMiners += 1;
        miners.push(msg.sender);

        if (referrer != address(0) && users[referrer].hasPower) {
            referrerOf[msg.sender] = referrer;
            uint256 effectiveAt = _rewardSnapshotAt(startDayId);
            referralRecords[referrer].push(
                ReferralRecord({user: msg.sender, effectiveAt: uint64(effectiveAt)})
            );
            users[referrer].referralCount += 1;
            emit ReferralAdded(referrer, msg.sender, effectiveAt);
        }

        _forwardNative(msg.value);
        emit PowerPurchased(msg.sender, referrer, block.timestamp);
    }

    function buyBooster() external payable whenNotPaused nonReentrant {
        _buyPowerBooster();
    }

    function buyPowerBooster() external payable whenNotPaused nonReentrant {
        _buyPowerBooster();
    }

    function _buyPowerBooster() internal {
        UserInfo storage user = users[msg.sender];
        require(user.hasPower, "Must have Power first");
        require(_miningWindowNotEnded(user), "Mining period ended");
        require(msg.value == powerBoosterPrice, "Wrong Power Booster price");

        uint256 count = boosterPeriods[msg.sender].length;
        if (count > 0) {
            require(
                block.timestamp >= boosterPeriods[msg.sender][count - 1].endTime,
                "Power Booster already active"
            );
        }

        uint256 endTime = block.timestamp + BOOSTER_DURATION;
        boosterPeriods[msg.sender].push(
            BoosterPeriod({
                startTime: uint64(block.timestamp),
                endTime: uint64(endTime),
                doubleStartTime: 0
            })
        );

        user.totalHash += BOOSTER_HASH;
        totalBoosterSold += 1;

        _forwardNative(msg.value);
        emit BoosterPurchased(msg.sender, BOOSTER_HASH, user.totalHash, TWO_X, block.timestamp);
        emit PowerBoosterPurchased(msg.sender, msg.value, block.timestamp, endTime);
    }

    function buyDoublePowerBooster() external payable whenNotPaused nonReentrant {
        UserInfo storage user = users[msg.sender];
        require(user.hasPower, "Must have Power first");
        require(user.referralCount >= DOUBLE_POWER_MIN_REFERRALS, "Need at least 5 referrals");
        require(msg.value == doublePowerBoosterPrice, "Wrong Double Power Booster price");

        uint256 count = boosterPeriods[msg.sender].length;
        require(count > 0, "Power Booster required");
        BoosterPeriod storage period = boosterPeriods[msg.sender][count - 1];
        require(
            block.timestamp >= period.startTime && block.timestamp < period.endTime,
            "Power Booster not active"
        );
        require(period.doubleStartTime == 0, "Double Power Booster already active");

        period.doubleStartTime = uint64(block.timestamp);
        totalDoublePowerBoosterSold += 1;

        _forwardNative(msg.value);
        emit DoublePowerBoosterPurchased(
            msg.sender,
            msg.value,
            block.timestamp,
            period.endTime,
            user.referralCount
        );
    }

    function setBoosterPrices(
        uint256 newPowerBoosterPrice,
        uint256 newDoublePowerBoosterPrice
    ) external onlyOwner {
        require(newPowerBoosterPrice > 0, "Power Booster price must be positive");
        require(newDoublePowerBoosterPrice > 0, "Double Booster price must be positive");

        uint256 oldPower = powerBoosterPrice;
        uint256 oldDouble = doublePowerBoosterPrice;
        powerBoosterPrice = newPowerBoosterPrice;
        doublePowerBoosterPrice = newDoublePowerBoosterPrice;

        emit BoosterPricesUpdated(
            oldPower,
            newPowerBoosterPrice,
            oldDouble,
            newDoublePowerBoosterPrice
        );
    }

    function snapshotDailyReward(address account)
        external
        whenNotPaused
        returns (uint256 reward)
    {
        uint256 dayId = _utcDayId(block.timestamp);
        require(block.timestamp >= _rewardSnapshotAt(dayId), "Claim window not open");
        require(_isEligibleRewardDay(users[account], dayId), "Reward day not eligible");
        DailyRewardRecord storage record = _snapshotReward(account, dayId);
        return record.reward;
    }

    function expireDailyReward(address account, uint256 dayId)
        external
        whenNotPaused
    {
        require(block.timestamp >= (dayId + 1) * DAY, "Reward day not ended");
        require(_isEligibleRewardDay(users[account], dayId), "Reward day not eligible");

        DailyRewardRecord storage record = _snapshotReward(account, dayId);
        require(record.status != REWARD_CLAIMED, "Reward already claimed");
        require(record.status != REWARD_EXPIRED, "Reward already expired");

        record.status = REWARD_EXPIRED;
        emit RewardExpired(account, dayId, record.reward);
    }

    /**
     * @notice Permissionless keeper batch for today's 00:05 UTC reward evidence.
     * @dev Skips ineligible or already-snapshotted accounts so one stale entry
     *      cannot revert an otherwise valid keeper batch.
     */
    function snapshotDailyRewards(address[] calldata accounts)
        external
        whenNotPaused
        returns (uint256 processed)
    {
        uint256 count = accounts.length;
        require(count > 0 && count <= MAX_KEEPER_BATCH, "Invalid keeper batch");

        uint256 dayId = _utcDayId(block.timestamp);
        require(block.timestamp >= _rewardSnapshotAt(dayId), "Claim window not open");

        for (uint256 i = 0; i < count; i++) {
            address account = accounts[i];
            if (!_isEligibleRewardDay(users[account], dayId)) continue;

            DailyRewardRecord storage record = dailyRewards[account][dayId];
            if (record.status != REWARD_NONE) continue;

            _snapshotReward(account, dayId);
            processed += 1;
        }

        emit RewardBatchSnapshotted(dayId, count, processed);
    }

    /**
     * @notice Permissionless keeper batch that materializes RewardExpired events.
     * @dev Claimed, already-expired and ineligible accounts are skipped.
     */
    function expireDailyRewards(address[] calldata accounts, uint256 dayId)
        external
        whenNotPaused
        returns (uint256 processed)
    {
        uint256 count = accounts.length;
        require(count > 0 && count <= MAX_KEEPER_BATCH, "Invalid keeper batch");
        require(block.timestamp >= (dayId + 1) * DAY, "Reward day not ended");

        for (uint256 i = 0; i < count; i++) {
            address account = accounts[i];
            if (!_isEligibleRewardDay(users[account], dayId)) continue;

            DailyRewardRecord storage record = dailyRewards[account][dayId];
            if (record.status == REWARD_CLAIMED || record.status == REWARD_EXPIRED) continue;

            if (record.status == REWARD_NONE) {
                _snapshotReward(account, dayId);
            }

            record.status = REWARD_EXPIRED;
            emit RewardExpired(account, dayId, record.reward);
            processed += 1;
        }

        emit RewardBatchExpired(dayId, count, processed);
    }

    function claimDaily() external whenNotPaused nonReentrant {
        UserInfo storage user = users[msg.sender];
        require(user.hasPower, "No Power");

        uint256 dayId = _utcDayId(block.timestamp);
        require(_isEligibleRewardDay(user, dayId), "Mining period ended or not started");
        require(block.timestamp >= _rewardSnapshotAt(dayId), "Claim window not open");

        DailyRewardRecord storage record = _snapshotReward(msg.sender, dayId);
        require(record.status == REWARD_CLAIMABLE, "Reward not claimable");

        uint256 reward = record.reward;
        require(totalMined + reward <= MINING_POOL_ALLOCATION, "Mining allocation exhausted");
        uint256 fundedCapacity = athToken.balanceOf(address(this)) + globalClaimed + globalBurned;
        require(totalMined + reward <= fundedCapacity, "Mining reserve not funded");

        record.status = REWARD_CLAIMED;
        uint256 miningDayNumber = dayId - user.miningStartDayId + 1;
        user.lastClaimDay = miningDayNumber;

        uint256 a30 = (reward * PCT_30) / 100;
        uint256 a60 = (reward * PCT_60) / 100;
        uint256 a90 = (reward * PCT_90) / 100;
        uint256 cyclePrincipal = reward - a30 - a60 - a90;

        vestingPositions[msg.sender].push(
            VestingPosition({
                amount: reward,
                initial30: a30,
                initial60: a60,
                initial90: a90,
                cyclePrincipal: cyclePrincipal,
                startTime: block.timestamp,
                claimedInitial30: 0,
                claimedInitial60: 0,
                claimedInitial90: 0,
                rolloverPending: cyclePrincipal,
                finalPrincipal: 0,
                finalDistribution: 0,
                finalBurned: 0,
                currentCycle: 0,
                finalSettled: false,
                finalClaimed: false
            })
        );

        uint256 positionIndex = vestingPositions[msg.sender].length - 1;
        user.totalAllocated += reward;
        totalMined += reward;

        emit RewardClaimed(msg.sender, dayId, reward, positionIndex);
        emit DailyClaimed(msg.sender, reward, miningDayNumber, positionIndex);
        emit VestingCreated(
            msg.sender,
            positionIndex,
            reward,
            block.timestamp,
            a30,
            a60,
            a90,
            cyclePrincipal
        );
    }

    function processVestingPosition(address account, uint256 positionIndex)
        external
        whenNotPaused
        nonReentrant
    {
        _processVestingPosition(account, positionIndex);
    }

    function claimVested(uint256 positionIndex)
        external
        whenNotPaused
        nonReentrant
    {
        require(positionIndex < vestingPositions[msg.sender].length, "Invalid position");
        _processVestingPosition(msg.sender, positionIndex);

        uint256 claimable = _collectClaimable(msg.sender, positionIndex);
        require(claimable > 0, "Nothing to claim yet");

        users[msg.sender].totalClaimed += claimable;
        globalClaimed += claimable;
        IERC20(address(athToken)).safeTransfer(msg.sender, claimable);

        emit VestedClaimed(msg.sender, claimable, positionIndex);
    }

    function claimAllVested() external whenNotPaused nonReentrant {
        uint256 count = vestingPositions[msg.sender].length;
        uint256 totalClaimable;

        for (uint256 i = 0; i < count; i++) {
            _processVestingPosition(msg.sender, i);
            uint256 amount = _collectClaimable(msg.sender, i);
            if (amount > 0) {
                totalClaimable += amount;
                emit VestedClaimed(msg.sender, amount, i);
            }
        }

        require(totalClaimable > 0, "Nothing to claim yet");
        users[msg.sender].totalClaimed += totalClaimable;
        globalClaimed += totalClaimable;
        IERC20(address(athToken)).safeTransfer(msg.sender, totalClaimable);
    }

    function claimVestedRange(uint256 fromIndex, uint256 toIndex)
        external
        whenNotPaused
        nonReentrant
    {
        uint256 count = vestingPositions[msg.sender].length;
        require(fromIndex < toIndex && toIndex <= count, "Invalid range");
        require(toIndex - fromIndex <= 30, "Range too large");

        uint256 totalClaimable;
        for (uint256 i = fromIndex; i < toIndex; i++) {
            _processVestingPosition(msg.sender, i);
            uint256 amount = _collectClaimable(msg.sender, i);
            if (amount > 0) {
                totalClaimable += amount;
                emit VestedClaimed(msg.sender, amount, i);
            }
        }

        require(totalClaimable > 0, "Nothing to claim yet");
        users[msg.sender].totalClaimed += totalClaimable;
        globalClaimed += totalClaimable;
        IERC20(address(athToken)).safeTransfer(msg.sender, totalClaimable);
    }

    function _processVestingPosition(address account, uint256 positionIndex) internal {
        require(positionIndex < vestingPositions[account].length, "Invalid position");
        VestingPosition storage pos = vestingPositions[account][positionIndex];

        while (pos.currentCycle < MAX_VESTING_CYCLES) {
            uint8 nextCycle = pos.currentCycle + 1;
            uint256 scheduledStart = pos.startTime + (uint256(nextCycle) * VEST_180);
            if (block.timestamp < scheduledStart) break;

            uint256 incoming = pos.rolloverPending;
            if (incoming == 0) break;

            (
                uint256 burnAmount,
                uint256 unlock30,
                uint256 unlock60,
                uint256 unlock90,
                uint256 rollover
            ) = _cycleBreakdown(incoming);

            VestingCycle storage cycle = vestingCycles[account][positionIndex][nextCycle];
            cycle.incomingAmount = incoming;
            cycle.burnedAmount = burnAmount;
            cycle.unlock30 = unlock30;
            cycle.unlock60 = unlock60;
            cycle.unlock90 = unlock90;
            cycle.rolloverAmount = rollover;
            cycle.startTime = scheduledStart;
            cycle.entered = true;

            pos.currentCycle = nextCycle;

            _burnForPosition(account, positionIndex, nextCycle, burnAmount, 1);

            if (nextCycle < MAX_VESTING_CYCLES) {
                pos.rolloverPending = rollover;
            } else {
                pos.rolloverPending = 0;
                pos.finalPrincipal = rollover;
            }

            emit VestingCycleEntered(
                account,
                positionIndex,
                nextCycle,
                incoming,
                burnAmount,
                unlock30,
                unlock60,
                unlock90,
                rollover,
                scheduledStart
            );
        }

        if (
            pos.currentCycle == MAX_VESTING_CYCLES &&
            !pos.finalSettled &&
            block.timestamp >= pos.startTime + ((MAX_VESTING_CYCLES + 1) * VEST_180)
        ) {
            uint256 principal = pos.finalPrincipal;
            uint256 finalBurn = (principal * FINAL_BURN_PCT) / 100;
            uint256 distribution = principal - finalBurn;

            pos.finalBurned = finalBurn;
            pos.finalDistribution = distribution;
            pos.finalSettled = true;

            _burnForPosition(
                account,
                positionIndex,
                uint8(MAX_VESTING_CYCLES),
                finalBurn,
                2
            );

            emit VestingFinalSettled(
                account,
                positionIndex,
                principal,
                finalBurn,
                distribution,
                pos.startTime + ((MAX_VESTING_CYCLES + 1) * VEST_180)
            );
        }
    }

    function _burnForPosition(
        address account,
        uint256 positionIndex,
        uint8 cycle,
        uint256 amount,
        uint8 burnType
    ) internal {
        if (amount == 0) return;
        athToken.burn(amount);
        users[account].totalBurned += amount;
        globalBurned += amount;
        emit ATHBurned(account, positionIndex, cycle, amount, burnType);
    }

    function _collectClaimable(address account, uint256 positionIndex)
        internal
        returns (uint256 claimable)
    {
        VestingPosition storage pos = vestingPositions[account][positionIndex];

        if (block.timestamp >= pos.startTime + VEST_30 && pos.claimedInitial30 == 0) {
            pos.claimedInitial30 = pos.initial30;
            claimable += pos.initial30;
            emit VestingTrancheClaimed(account, positionIndex, 0, 30, pos.initial30);
        }
        if (block.timestamp >= pos.startTime + VEST_60 && pos.claimedInitial60 == 0) {
            pos.claimedInitial60 = pos.initial60;
            claimable += pos.initial60;
            emit VestingTrancheClaimed(account, positionIndex, 0, 60, pos.initial60);
        }
        if (block.timestamp >= pos.startTime + VEST_90 && pos.claimedInitial90 == 0) {
            pos.claimedInitial90 = pos.initial90;
            claimable += pos.initial90;
            emit VestingTrancheClaimed(account, positionIndex, 0, 90, pos.initial90);
        }

        for (uint8 cycleNo = 1; cycleNo <= pos.currentCycle; cycleNo++) {
            VestingCycle storage cycle = vestingCycles[account][positionIndex][cycleNo];
            if (block.timestamp >= cycle.startTime + VEST_30 && cycle.claimed30 == 0) {
                cycle.claimed30 = cycle.unlock30;
                claimable += cycle.unlock30;
                emit VestingTrancheClaimed(account, positionIndex, cycleNo, 30, cycle.unlock30);
            }
            if (block.timestamp >= cycle.startTime + VEST_60 && cycle.claimed60 == 0) {
                cycle.claimed60 = cycle.unlock60;
                claimable += cycle.unlock60;
                emit VestingTrancheClaimed(account, positionIndex, cycleNo, 60, cycle.unlock60);
            }
            if (block.timestamp >= cycle.startTime + VEST_90 && cycle.claimed90 == 0) {
                cycle.claimed90 = cycle.unlock90;
                claimable += cycle.unlock90;
                emit VestingTrancheClaimed(account, positionIndex, cycleNo, 90, cycle.unlock90);
            }
        }

        if (pos.finalSettled && !pos.finalClaimed) {
            pos.finalClaimed = true;
            claimable += pos.finalDistribution;
            emit VestingTrancheClaimed(
                account,
                positionIndex,
                uint8(MAX_VESTING_CYCLES),
                180,
                pos.finalDistribution
            );
        }
    }

    function getDailyRewardStatus(address account, uint256 dayId)
        external
        view
        returns (
            uint256 reward,
            uint256 referralBonusBps,
            uint256 boosterMultiplier,
            uint256 claimOpensAt,
            uint256 claimDeadline,
            uint8 status
        )
    {
        claimOpensAt = _rewardSnapshotAt(dayId);
        claimDeadline = ((dayId + 1) * DAY) - 1;

        if (!_isEligibleRewardDay(users[account], dayId)) {
            return (0, 0, ONE_X, claimOpensAt, claimDeadline, REWARD_NONE);
        }

        DailyRewardRecord storage stored = dailyRewards[account][dayId];
        if (stored.status != REWARD_NONE) {
            return (
                stored.reward,
                stored.referralBonusBps,
                stored.boosterMultiplier,
                claimOpensAt,
                claimDeadline,
                stored.status
            );
        }

        (reward, referralBonusBps, boosterMultiplier) = _rewardForDay(account, dayId);

        uint256 currentDayId = _utcDayId(block.timestamp);
        if (dayId < currentDayId) {
            status = REWARD_EXPIRED;
        } else if (dayId > currentDayId || block.timestamp < claimOpensAt) {
            status = REWARD_PENDING;
        } else {
            status = REWARD_CLAIMABLE;
        }
    }

    function getVestingSummary(address account)
        external
        view
        returns (
            uint256 positionsCount,
            uint256 totalAllocated,
            uint256 totalClaimed,
            uint256 totalBurned,
            uint256 totalStillVesting
        )
    {
        UserInfo storage user = users[account];
        positionsCount = vestingPositions[account].length;
        totalAllocated = user.totalAllocated;
        totalClaimed = user.totalClaimed;
        totalBurned = user.totalBurned;
        totalStillVesting = totalAllocated - totalClaimed - totalBurned;
    }

    function getVestingPositionSummary(address account, uint256 index)
        external
        view
        returns (VestingPosition memory position, uint256 claimableNow)
    {
        require(index < vestingPositions[account].length, "Invalid position");
        position = vestingPositions[account][index];
        claimableNow = _calculateClaimableView(account, index);
    }

    /**
     * @notice Explorer-friendly flat summary for one daily-claim vesting position.
     * @dev All values are directly readable on BscScan without relying on the web UI.
     */
    function getVestingDashboard(address account, uint256 index)
        external
        view
        returns (
            uint256 amount,
            uint256 startTime,
            uint8 currentCycle,
            uint256 claimableNow,
            uint256 unlock30,
            uint256 unlock60,
            uint256 unlock90,
            uint256 cyclePrincipal,
            uint256 burnedSoFar,
            uint256 finalPrincipal,
            uint256 finalDistribution,
            bool finalSettled
        )
    {
        require(index < vestingPositions[account].length, "Invalid position");
        VestingPosition storage pos = vestingPositions[account][index];

        amount = pos.amount;
        startTime = pos.startTime;
        currentCycle = pos.currentCycle;
        claimableNow = _calculateClaimableView(account, index);
        unlock30 = pos.initial30;
        unlock60 = pos.initial60;
        unlock90 = pos.initial90;
        cyclePrincipal = pos.cyclePrincipal;
        finalPrincipal = pos.finalPrincipal;
        finalDistribution = pos.finalDistribution;
        finalSettled = pos.finalSettled;

        for (uint8 cycleNo = 1; cycleNo <= pos.currentCycle; cycleNo++) {
            burnedSoFar += vestingCycles[account][index][cycleNo].burnedAmount;
        }
        burnedSoFar += pos.finalBurned;
    }

    /**
     * @notice Flat 12-cycle preview. Amounts are deterministic from the original claim.
     */
    function getVestingCyclePreview(address account, uint256 index, uint8 cycle)
        external
        view
        returns (
            uint256 incomingAmount,
            uint256 burnedAmount,
            uint256 unlock30,
            uint256 unlock60,
            uint256 unlock90,
            uint256 rolloverAmount,
            uint256 scheduledStart,
            bool entered
        )
    {
        require(index < vestingPositions[account].length, "Invalid position");
        require(cycle >= 1 && cycle <= MAX_VESTING_CYCLES, "Invalid cycle");

        VestingPosition storage pos = vestingPositions[account][index];
        incomingAmount = _previewCycleIncoming(pos.cyclePrincipal, cycle);
        (burnedAmount, unlock30, unlock60, unlock90, rolloverAmount) =
            _cycleBreakdown(incomingAmount);
        scheduledStart = pos.startTime + (uint256(cycle) * VEST_180);
        entered = vestingCycles[account][index][cycle].entered;
    }

    function getVestingCycle(address account, uint256 index, uint8 cycle)
        external
        view
        returns (VestingCycle memory)
    {
        require(index < vestingPositions[account].length, "Invalid position");
        require(cycle >= 1 && cycle <= MAX_VESTING_CYCLES, "Invalid cycle");
        return vestingCycles[account][index][cycle];
    }

    function previewVestingCycle(address account, uint256 index, uint8 cycle)
        external
        view
        returns (VestingCycle memory preview)
    {
        require(index < vestingPositions[account].length, "Invalid position");
        require(cycle >= 1 && cycle <= MAX_VESTING_CYCLES, "Invalid cycle");

        VestingPosition storage pos = vestingPositions[account][index];
        uint256 incoming = _previewCycleIncoming(pos.cyclePrincipal, cycle);
        (
            uint256 burnAmount,
            uint256 unlock30,
            uint256 unlock60,
            uint256 unlock90,
            uint256 rollover
        ) = _cycleBreakdown(incoming);

        preview = VestingCycle({
            incomingAmount: incoming,
            burnedAmount: burnAmount,
            unlock30: unlock30,
            unlock60: unlock60,
            unlock90: unlock90,
            rolloverAmount: rollover,
            startTime: pos.startTime + (uint256(cycle) * VEST_180),
            claimed30: 0,
            claimed60: 0,
            claimed90: 0,
            entered: vestingCycles[account][index][cycle].entered
        });
    }

    function previewFinalSettlement(address account, uint256 index)
        external
        view
        returns (
            uint256 principal,
            uint256 burn60,
            uint256 distribution40,
            uint256 scheduledAt,
            bool settled
        )
    {
        require(index < vestingPositions[account].length, "Invalid position");
        VestingPosition storage pos = vestingPositions[account][index];

        principal = _previewCycleIncoming(pos.cyclePrincipal, uint8(MAX_VESTING_CYCLES));
        (, , , , principal) = _cycleBreakdown(principal);
        burn60 = (principal * FINAL_BURN_PCT) / 100;
        distribution40 = principal - burn60;
        scheduledAt = pos.startTime + ((MAX_VESTING_CYCLES + 1) * VEST_180);
        settled = pos.finalSettled;
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
        UserInfo storage u = users[account];
        uint256 today = _utcDayId(block.timestamp);

        hasPower = u.hasPower;
        miningActive = _isEligibleRewardDay(u, today);
        startTime = u.startTime;
        lastClaimDay = u.lastClaimDay;

        if (u.hasPower && today >= u.miningStartDayId) {
            currentDay = today - u.miningStartDayId + 1;
        }

        totalAllocated = u.totalAllocated;
        totalClaimed = u.totalClaimed;
        pendingVested = u.totalAllocated - u.totalClaimed - u.totalBurned;
        referralCount = u.referralCount;
        referralBonusBps = _getReferralMultiplier(u.referralCount) - ONE_X;
        boosterMultiplier = _boosterMultiplierAt(account, block.timestamp);
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
        VestingPosition storage pos = vestingPositions[account][index];

        amount = pos.amount;
        amt30 = pos.initial30;
        amt60 = pos.initial60;
        amt90 = pos.initial90;
        amt180 = pos.cyclePrincipal;
        startTime = pos.startTime;
        claimed30 = pos.claimedInitial30;
        claimed60 = pos.claimedInitial60;
        claimed90 = pos.claimedInitial90;
        claimed180 = 0;

        if (block.timestamp >= pos.startTime + VEST_30) claimable30 = pos.initial30 - pos.claimedInitial30;
        if (block.timestamp >= pos.startTime + VEST_60) claimable60 = pos.initial60 - pos.claimedInitial60;
        if (block.timestamp >= pos.startTime + VEST_90) claimable90 = pos.initial90 - pos.claimedInitial90;
        claimable180 = 0;
    }

    function getMiners(uint256 offset, uint256 limit)
        external
        view
        returns (address[] memory result)
    {
        require(limit > 0 && limit <= MAX_MINER_PAGE, "Invalid miner page");
        uint256 count = miners.length;
        if (offset >= count) return new address[](0);

        uint256 end = offset + limit;
        if (end > count) end = count;

        result = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = miners[i];
        }
    }

    function getPositionsCount(address account) external view returns (uint256) {
        return vestingPositions[account].length;
    }

    function getReferrals(address account) external view returns (address[] memory result) {
        ReferralRecord[] storage records = referralRecords[account];
        result = new address[](records.length);
        for (uint256 i = 0; i < records.length; i++) result[i] = records[i].user;
    }

    function getReferralCountAt(address account, uint256 timestamp)
        external
        view
        returns (uint256)
    {
        return _referralCountAt(account, timestamp);
    }

    function getBoosterPeriodsCount(address account) external view returns (uint256) {
        return boosterPeriods[account].length;
    }

    function getBoosterPeriod(address account, uint256 index)
        external
        view
        returns (BoosterPeriod memory)
    {
        require(index < boosterPeriods[account].length, "Invalid booster period");
        return boosterPeriods[account][index];
    }

    function isMiningActive(address account) public view returns (bool) {
        return _isEligibleRewardDay(users[account], _utcDayId(block.timestamp));
    }

    /** @return priceInMicroUSD ATH protocol reference in 6-decimal micro-USD. */
    function getCurrentPrice() external view returns (uint256 priceInMicroUSD) {
        uint256 minedWhole = totalMined / 1 ether;
        uint256 steps = minedWhole / 100_000;
        priceInMicroUSD = 100_000 + (steps * 1_000);
    }

    function contractBalance() external view returns (uint256) {
        return athToken.balanceOf(address(this));
    }

    function outstandingVestingLiability() public view returns (uint256) {
        return totalMined - globalClaimed - globalBurned;
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

    function withdrawExcessATH(address to, uint256 amount) external onlyOwner whenPaused {
        require(to != address(0), "Invalid recipient");
        uint256 balance = athToken.balanceOf(address(this));
        uint256 liability = outstandingVestingLiability();
        require(balance >= liability, "Reserve underfunded");
        require(amount <= balance - liability, "Amount exceeds excess reserve");
        IERC20(address(athToken)).safeTransfer(to, amount);
        emit ExcessTokenWithdrawn(to, amount);
    }

    function _snapshotReward(address account, uint256 dayId)
        internal
        returns (DailyRewardRecord storage record)
    {
        record = dailyRewards[account][dayId];
        if (record.status != REWARD_NONE) return record;

        (
            uint256 reward,
            uint256 referralBonusBps,
            uint256 boosterMultiplier
        ) = _rewardForDay(account, dayId);

        record.reward = reward;
        record.referralBonusBps = referralBonusBps;
        record.boosterMultiplier = boosterMultiplier;
        record.calculatedAt = uint64(block.timestamp);
        record.status = REWARD_CLAIMABLE;

        emit RewardCalculated(
            account,
            dayId,
            BASE_REWARD,
            referralBonusBps,
            boosterMultiplier,
            reward,
            _rewardSnapshotAt(dayId),
            ((dayId + 1) * DAY) - 1
        );
    }

    function _rewardForDay(address account, uint256 dayId)
        internal
        view
        returns (
            uint256 reward,
            uint256 referralBonusBps,
            uint256 boosterMultiplier
        )
    {
        uint256 snapshotAt = _rewardSnapshotAt(dayId);
        uint256 referralCount = _referralCountAt(account, snapshotAt);
        uint256 referralMultiplier = _getReferralMultiplier(referralCount);
        referralBonusBps = referralMultiplier - ONE_X;
        boosterMultiplier = _boosterMultiplierAt(account, snapshotAt);

        uint256 finalMultiplier = (referralMultiplier * boosterMultiplier) / ONE_X;
        reward = (BASE_REWARD * finalMultiplier) / ONE_X;
    }

    function _referralCountAt(address account, uint256 timestamp)
        internal
        view
        returns (uint256 count)
    {
        ReferralRecord[] storage records = referralRecords[account];
        uint256 length = records.length;
        for (uint256 i = 0; i < length && count < 46; i++) {
            if (records[i].effectiveAt <= timestamp) {
                count += 1;
            } else {
                break;
            }
        }
    }

    function _boosterMultiplierAt(address account, uint256 timestamp)
        internal
        view
        returns (uint256)
    {
        BoosterPeriod[] storage periods = boosterPeriods[account];
        for (uint256 i = periods.length; i > 0; i--) {
            BoosterPeriod storage period = periods[i - 1];
            if (timestamp >= period.startTime && timestamp < period.endTime) {
                if (
                    period.doubleStartTime != 0 &&
                    timestamp >= period.doubleStartTime
                ) {
                    return SIX_X;
                }
                return TWO_X;
            }
            if (timestamp >= period.endTime) break;
        }
        return ONE_X;
    }

    function _calculateClaimableView(address account, uint256 positionIndex)
        internal
        view
        returns (uint256 claimable)
    {
        VestingPosition storage pos = vestingPositions[account][positionIndex];

        if (block.timestamp >= pos.startTime + VEST_30) claimable += pos.initial30 - pos.claimedInitial30;
        if (block.timestamp >= pos.startTime + VEST_60) claimable += pos.initial60 - pos.claimedInitial60;
        if (block.timestamp >= pos.startTime + VEST_90) claimable += pos.initial90 - pos.claimedInitial90;

        for (uint8 cycleNo = 1; cycleNo <= pos.currentCycle; cycleNo++) {
            VestingCycle storage cycle = vestingCycles[account][positionIndex][cycleNo];
            if (block.timestamp >= cycle.startTime + VEST_30) claimable += cycle.unlock30 - cycle.claimed30;
            if (block.timestamp >= cycle.startTime + VEST_60) claimable += cycle.unlock60 - cycle.claimed60;
            if (block.timestamp >= cycle.startTime + VEST_90) claimable += cycle.unlock90 - cycle.claimed90;
        }

        if (pos.finalSettled && !pos.finalClaimed) claimable += pos.finalDistribution;
    }

    function _cycleBreakdown(uint256 incoming)
        internal
        pure
        returns (
            uint256 burnAmount,
            uint256 unlock30,
            uint256 unlock60,
            uint256 unlock90,
            uint256 rollover
        )
    {
        burnAmount = (incoming * CYCLE_BURN_PCT) / 100;
        unlock30 = (incoming * CYCLE_UNLOCK_30_PCT) / 100;
        unlock60 = (incoming * CYCLE_UNLOCK_60_PCT) / 100;
        unlock90 = (incoming * CYCLE_UNLOCK_90_PCT) / 100;
        rollover = incoming - burnAmount - unlock30 - unlock60 - unlock90;
    }

    function _previewCycleIncoming(uint256 initialPrincipal, uint8 cycle)
        internal
        pure
        returns (uint256 incoming)
    {
        incoming = initialPrincipal;
        for (uint8 i = 1; i < cycle; i++) {
            (, , , , incoming) = _cycleBreakdown(incoming);
        }
    }

    function _utcDayId(uint256 timestamp) internal pure returns (uint256) {
        return timestamp / DAY;
    }

    function _rewardSnapshotAt(uint256 dayId) internal pure returns (uint256) {
        return (dayId * DAY) + CLAIM_OPEN_OFFSET;
    }

    function _effectiveRewardDay(uint256 timestamp) internal pure returns (uint256) {
        uint256 dayId = _utcDayId(timestamp);
        if ((timestamp % DAY) >= CLAIM_OPEN_OFFSET) return dayId + 1;
        return dayId;
    }

    function _isEligibleRewardDay(UserInfo storage user, uint256 dayId)
        internal
        view
        returns (bool)
    {
        if (!user.hasPower) return false;
        return (
            dayId >= user.miningStartDayId &&
            dayId < user.miningStartDayId + MAX_DAYS
        );
    }

    function _miningWindowNotEnded(UserInfo storage user)
        internal
        view
        returns (bool)
    {
        if (!user.hasPower) return false;
        return _utcDayId(block.timestamp) < user.miningStartDayId + MAX_DAYS;
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

    function _forwardNative(uint256 amount) internal {
        (bool success, ) = treasury.call{value: amount}("");
        require(success, "BNB transfer failed");
    }

    receive() external payable {}
}