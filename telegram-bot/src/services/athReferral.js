const { ethers } = require("ethers");

const MINING_REFERRAL_ABI = [
  "function getUserInfo(address) view returns (bool hasPower,bool miningActive,uint256 startTime,uint256 lastClaimDay,uint256 currentDay,uint256 totalAllocated,uint256 totalClaimed,uint256 pendingVested,uint256 referralCount,uint256 referralBonusBps,uint256 boosterMultiplier,uint256 totalHash,uint256 positionsCount)",
  "function referrerOf(address) view returns (address)",
];

function isAddress(value) {
  return ethers.isAddress(value || "") && value !== ethers.ZeroAddress;
}

function buildAetherReferralUrl(appUrl, { referrerWallet, memberWallet } = {}) {
  if (!appUrl) return "";
  const url = new URL(appUrl);
  url.searchParams.set("source", "telegram");
  url.searchParams.set("campaign", "ath-airdrop");

  if (isAddress(referrerWallet)) {
    url.searchParams.set("ath_referrer", ethers.getAddress(referrerWallet));
  }

  if (isAddress(memberWallet)) {
    url.searchParams.set("ath_wallet", ethers.getAddress(memberWallet));
  }

  return url.toString();
}

class ATHReferralService {
  constructor({ rpcUrl, miningAddress, chainId = 97, appUrl = "" }) {
    this.rpcUrl = rpcUrl || "";
    this.miningAddress = miningAddress || "";
    this.chainId = Number(chainId || 97);
    this.appUrl = appUrl || "";
    this.enabled = Boolean(this.rpcUrl && isAddress(this.miningAddress));

    if (this.enabled) {
      this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
      this.mining = new ethers.Contract(
        ethers.getAddress(this.miningAddress),
        MINING_REFERRAL_ABI,
        this.provider
      );
    }
  }

  async health() {
    if (!this.enabled) {
      return { enabled: false, ready: false, reason: "ATH contract not configured" };
    }

    const network = await this.provider.getNetwork();
    const actualChainId = Number(network.chainId);
    return {
      enabled: true,
      ready: actualChainId === this.chainId,
      chainId: actualChainId,
      expectedChainId: this.chainId,
    };
  }

  async walletStatus(walletAddress) {
    if (!isAddress(walletAddress)) {
      return {
        configured: this.enabled,
        walletLinked: false,
        hasPower: false,
        miningActive: false,
        referralCount: 0,
        referralBonusPercent: 0,
        onchainReferrer: ethers.ZeroAddress,
      };
    }

    const wallet = ethers.getAddress(walletAddress);
    if (!this.enabled) {
      return {
        configured: false,
        walletLinked: true,
        wallet,
        hasPower: false,
        miningActive: false,
        referralCount: 0,
        referralBonusPercent: 0,
        onchainReferrer: ethers.ZeroAddress,
      };
    }

    const [u, onchainReferrer] = await Promise.all([
      this.mining.getUserInfo(wallet),
      this.mining.referrerOf(wallet),
    ]);

    return {
      configured: true,
      walletLinked: true,
      wallet,
      hasPower: Boolean(u.hasPower),
      miningActive: Boolean(u.miningActive),
      referralCount: Number(u.referralCount),
      referralBonusPercent: Number(u.referralBonusBps) / 100,
      onchainReferrer,
    };
  }

  async sponsorStatus(walletAddress) {
    const status = await this.walletStatus(walletAddress);
    return {
      ...status,
      eligibleAsSponsor: Boolean(status.configured && status.hasPower),
    };
  }

  buildMiningUrl({ referrerWallet, memberWallet } = {}) {
    return buildAetherReferralUrl(this.appUrl, { referrerWallet, memberWallet });
  }
}

function createATHReferralService(config) {
  return new ATHReferralService({
    rpcUrl: config.athRpcUrl,
    miningAddress: config.athMiningAddress,
    chainId: config.athChainId,
    appUrl: config.appUrl,
  });
}

module.exports = {
  ATHReferralService,
  createATHReferralService,
  buildAetherReferralUrl,
  isAddress,
};
