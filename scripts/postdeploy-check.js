const { ethers } = require("ethers");
const fs = require("fs");

const TOKEN_ABI = [
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function owner() view returns (address)",
];

const MINING_ABI = [
  "function athToken() view returns (address)",
  "function treasury() view returns (address)",
  "function owner() view returns (address)",
  "function contractBalance() view returns (uint256)",
  "function MINING_POOL_ALLOCATION() view returns (uint256)",
  "function getCurrentPrice() view returns (uint256)",
];

const LOCK_ABI = [
  "function token() view returns (address)",
  "function beneficiary() view returns (address)",
  "function releaseTime() view returns (uint256)",
];

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error("Missing required env: " + name);
  return value.trim();
}

function requiredAddress(name) {
  const value = required(name);
  if (!ethers.isAddress(value) || value === ethers.ZeroAddress) {
    throw new Error(name + " must be a non-zero EVM address");
  }
  return ethers.getAddress(value);
}

function eqAddr(a, b) {
  return a.toLowerCase() === b.toLowerCase();
}

async function main() {
  const rpcUrl = required("BSC_TESTNET_RPC");
  const tokenAddress = requiredAddress("ATH_TOKEN_ADDRESS");
  const miningAddress = requiredAddress("ATH_MINING_ADDRESS");
  const teamLockAddress = requiredAddress("ATH_TEAM_LOCK_ADDRESS");

  const singleWalletMode = process.env.TESTNET_USE_DEPLOYER_ROLES === "true";
  const deployerAddress = singleWalletMode ? requiredAddress("DEPLOYER_ADDRESS") : null;
  const roleAddress = (name) => singleWalletMode ? deployerAddress : requiredAddress(name);

  const ownerExpected = roleAddress("OWNER_ADDRESS");
  const treasuryExpected = roleAddress("TREASURY_ADDRESS");
  const teamExpected = roleAddress("TEAM_BENEFICIARY");
  const liquidityWallet = roleAddress("LIQUIDITY_WALLET");
  const marketingWallet = roleAddress("MARKETING_WALLET");

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== 97) throw new Error("Postdeploy check must run on BSC Testnet chain 97");

  const token = new ethers.Contract(tokenAddress, TOKEN_ABI, provider);
  const mining = new ethers.Contract(miningAddress, MINING_ABI, provider);
  const lock = new ethers.Contract(teamLockAddress, LOCK_ABI, provider);

  const [
    totalSupply,
    tokenOwner,
    miningToken,
    miningOwner,
    treasury,
    miningBalance,
    miningAllocation,
    currentPrice,
    lockToken,
    teamBeneficiary,
    releaseTime,
    teamLockBalance,
  ] = await Promise.all([
    token.totalSupply(),
    token.owner(),
    mining.athToken(),
    mining.owner(),
    mining.treasury(),
    mining.contractBalance(),
    mining.MINING_POOL_ALLOCATION(),
    mining.getCurrentPrice(),
    lock.token(),
    lock.beneficiary(),
    lock.releaseTime(),
    token.balanceOf(teamLockAddress),
  ]);

  const oneBillion = ethers.parseEther("1000000000");
  const sevenHundredM = ethers.parseEther("700000000");
  const twoHundredM = ethers.parseEther("200000000");
  const fiftyM = ethers.parseEther("50000000");

  if (totalSupply !== oneBillion) throw new Error("Wrong ATH total supply");
  if (!eqAddr(tokenOwner, ownerExpected)) throw new Error("ATH token owner mismatch");
  if (!eqAddr(miningToken, tokenAddress)) throw new Error("Mining contract token mismatch");
  if (!eqAddr(miningOwner, ownerExpected)) throw new Error("Mining owner mismatch");
  if (!eqAddr(treasury, treasuryExpected)) throw new Error("Treasury mismatch");
  if (miningBalance !== sevenHundredM || miningAllocation !== sevenHundredM) throw new Error("Mining 70% allocation mismatch");
  if (teamLockBalance !== fiftyM) throw new Error("Team 5% allocation mismatch");
  if (!eqAddr(lockToken, tokenAddress)) throw new Error("Team lock token mismatch");
  if (!eqAddr(teamBeneficiary, teamExpected)) throw new Error("Team beneficiary mismatch");
  if (currentPrice !== 3_000_000n) throw new Error("ATH initial display price mismatch");

  const expectedByAddress = new Map();
  function addExpected(address, amount) {
    const key = address.toLowerCase();
    expectedByAddress.set(key, (expectedByAddress.get(key) || 0n) + amount);
  }
  addExpected(liquidityWallet, twoHundredM);
  addExpected(marketingWallet, fiftyM);

  const destinationBalances = {};
  for (const [addressKey, expected] of expectedByAddress.entries()) {
    const actual = await token.balanceOf(addressKey);
    if (actual !== expected) {
      throw new Error(
        `ATH destination allocation mismatch for ${addressKey}: got ${actual}, expected ${expected}`
      );
    }
    destinationBalances[addressKey] = ethers.formatEther(actual);
  }

  const report = {
    chainId: 97,
    testnetSingleWalletMode: singleWalletMode,
    tokenAddress,
    miningAddress,
    teamLockAddress,
    owner: tokenOwner,
    treasury,
    teamBeneficiary,
    teamReleaseAt: Number(releaseTime),
    totalSupplyATH: ethers.formatEther(totalSupply),
    miningPoolATH: ethers.formatEther(miningBalance),
    teamLockedATH: ethers.formatEther(teamLockBalance),
    allocationDestinationsATH: destinationBalances,
    initialDisplayPriceUSD: (Number(currentPrice) / 1_000_000).toFixed(3),
    checkedAt: new Date().toISOString(),
  };

  fs.mkdirSync("deployments", { recursive: true });
  fs.writeFileSync("deployments/bsc-testnet-verified.json", JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));
  console.log("ATH BSC Testnet postdeploy verification PASSED");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
