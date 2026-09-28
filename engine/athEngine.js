const { ethers } = require("ethers");

const MINING_ABI = [
  "function POWER_PRICE() view returns (uint256)",
  "function BOOSTER_PRICE() view returns (uint256)",
  "function totalMined() view returns (uint256)",
  "function totalPowerSold() view returns (uint256)",
  "function totalBoosterSold() view returns (uint256)",
  "function totalMiners() view returns (uint256)",
  "function treasury() view returns (address)",
  "function contractBalance() view returns (uint256)",
  "function getCurrentPrice() view returns (uint256)",
  "function getPositionsCount(address) view returns (uint256)",
  "function getUserInfo(address) view returns (bool hasPower,bool miningActive,uint256 startTime,uint256 lastClaimDay,uint256 currentDay,uint256 totalAllocated,uint256 totalClaimed,uint256 pendingVested,uint256 referralCount,uint256 referralBonusBps,uint256 boosterMultiplier,uint256 totalHash,uint256 positionsCount)",
  "function getVestingPosition(address,uint256) view returns (uint256 amount,uint256 amt30,uint256 amt60,uint256 amt90,uint256 amt180,uint256 startTime,uint256 claimed30,uint256 claimed60,uint256 claimed90,uint256 claimed180,uint256 claimable30,uint256 claimable60,uint256 claimable90,uint256 claimable180)",
  "function getReferrals(address) view returns (address[])",
  "function buyPower(address) payable",
  "function buyBooster() payable",
  "function claimDaily()",
  "function claimVested(uint256)",
  "function claimAllVested()"
];

const TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)"
];

class ATHEngine {
  constructor({ rpcUrl, miningAddress, tokenAddress }) {
    if (!rpcUrl || !miningAddress || !tokenAddress) {
      throw new Error("rpcUrl, miningAddress and tokenAddress are required");
    }
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.mining = new ethers.Contract(miningAddress, MINING_ABI, this.provider);
    this.token = new ethers.Contract(tokenAddress, TOKEN_ABI, this.provider);
    this.miningInterface = new ethers.Interface(MINING_ABI);
  }

  async health() {
    const network = await this.provider.getNetwork();
    const blockNumber = await this.provider.getBlockNumber();
    return { ok: true, chainId: Number(network.chainId), blockNumber };
  }

  async overview() {
    const [
      tokenName,
      tokenSymbol,
      totalSupply,
      totalMined,
      totalPowerSold,
      totalBoosterSold,
      totalMiners,
      treasury,
      miningPoolBalance,
      currentPriceMicroUsd
    ] = await Promise.all([
      this.token.name(),
      this.token.symbol(),
      this.token.totalSupply(),
      this.mining.totalMined(),
      this.mining.totalPowerSold(),
      this.mining.totalBoosterSold(),
      this.mining.totalMiners(),
      this.mining.treasury(),
      this.mining.contractBalance(),
      this.mining.getCurrentPrice()
    ]);

    return {
      tokenName,
      tokenSymbol,
      totalSupply: ethers.formatEther(totalSupply),
      totalMined: ethers.formatEther(totalMined),
      totalPowerSold: totalPowerSold.toString(),
      totalBoosterSold: totalBoosterSold.toString(),
      totalMiners: totalMiners.toString(),
      treasury,
      miningPoolBalance: ethers.formatEther(miningPoolBalance),
      currentPriceUsd: (Number(currentPriceMicroUsd) / 1_000_000).toFixed(6)
    };
  }

  async user(address) {
    if (!ethers.isAddress(address)) throw new Error("Invalid address");
    const u = await this.mining.getUserInfo(address);
    return {
      address,
      hasPower: u.hasPower,
      miningActive: u.miningActive,
      startTime: Number(u.startTime),
      lastClaimDay: Number(u.lastClaimDay),
      currentDay: Number(u.currentDay),
      totalAllocated: ethers.formatEther(u.totalAllocated),
      totalClaimed: ethers.formatEther(u.totalClaimed),
      pendingVested: ethers.formatEther(u.pendingVested),
      referralCount: Number(u.referralCount),
      referralBonusPercent: Number(u.referralBonusBps) / 100,
      boosterMultiplierX: Number(u.boosterMultiplier) / 10_000,
      totalHash: Number(u.totalHash),
      positionsCount: Number(u.positionsCount)
    };
  }

  async vesting(address, maxPositions = 180) {
    if (!ethers.isAddress(address)) throw new Error("Invalid address");
    const count = Math.min(Number(await this.mining.getPositionsCount(address)), maxPositions);
    const positions = [];
    for (let i = 0; i < count; i++) {
      const p = await this.mining.getVestingPosition(address, i);
      positions.push({
        index: i,
        amount: ethers.formatEther(p.amount),
        startTime: Number(p.startTime),
        tranches: {
          day30: { amount: ethers.formatEther(p.amt30), claimed: ethers.formatEther(p.claimed30), claimable: ethers.formatEther(p.claimable30) },
          day60: { amount: ethers.formatEther(p.amt60), claimed: ethers.formatEther(p.claimed60), claimable: ethers.formatEther(p.claimable60) },
          day90: { amount: ethers.formatEther(p.amt90), claimed: ethers.formatEther(p.claimed90), claimable: ethers.formatEther(p.claimable90) },
          day180: { amount: ethers.formatEther(p.amt180), claimed: ethers.formatEther(p.claimed180), claimable: ethers.formatEther(p.claimable180) }
        }
      });
    }
    return positions;
  }

  async referrals(address) {
    if (!ethers.isAddress(address)) throw new Error("Invalid address");
    return this.mining.getReferrals(address);
  }

  async buildBuyPower(referrer = ethers.ZeroAddress) {
    const value = await this.mining.POWER_PRICE();
    return { to: this.mining.target, value: value.toString(), data: this.miningInterface.encodeFunctionData("buyPower", [referrer]) };
  }

  async buildBuyBooster() {
    const value = await this.mining.BOOSTER_PRICE();
    return { to: this.mining.target, value: value.toString(), data: this.miningInterface.encodeFunctionData("buyBooster", []) };
  }

  buildClaimDaily() {
    return { to: this.mining.target, value: "0", data: this.miningInterface.encodeFunctionData("claimDaily", []) };
  }

  buildClaimVested(index) {
    return { to: this.mining.target, value: "0", data: this.miningInterface.encodeFunctionData("claimVested", [index]) };
  }

  buildClaimAllVested() {
    return { to: this.mining.target, value: "0", data: this.miningInterface.encodeFunctionData("claimAllVested", []) };
  }
}

module.exports = { ATHEngine, MINING_ABI, TOKEN_ABI };
