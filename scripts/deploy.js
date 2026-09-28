const hre = require("hardhat");
const fs = require("fs");

const MAINNET_GATES = [
  "ALLOW_MAINNET_DEPLOY",
  "MAINNET_AUDIT_PASSED",
  "MAINNET_MULTISIG_CONFIRMED",
  "LIQUIDITY_LOCK_CONFIRMED",
];

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value.trim();
}

function requiredAddress(name) {
  const value = required(name);
  if (!hre.ethers.isAddress(value) || value === hre.ethers.ZeroAddress) {
    throw new Error(`${name} must be a non-zero EVM address`);
  }
  return hre.ethers.getAddress(value);
}

async function main() {
  if (!process.env.PRIVATE_KEY) throw new Error("Missing required env: PRIVATE_KEY");

  const network = await hre.ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  const isTestnet = hre.network.name === "bscTestnet";
  const isMainnet = hre.network.name === "bscMainnet";

  if (!isTestnet && !isMainnet) {
    throw new Error("ATH deployment is allowed only on configured BSC Testnet or BSC Mainnet networks");
  }
  if (isTestnet && chainId !== 97) throw new Error(`BSC Testnet chain mismatch: ${chainId}`);
  if (isMainnet && chainId !== 56) throw new Error(`BSC Mainnet chain mismatch: ${chainId}`);

  if (isTestnet) {
    for (const gate of MAINNET_GATES) {
      if (process.env[gate] === "true") {
        throw new Error(`Testnet safety check failed: ${gate} must remain false`);
      }
    }
  }

  if (isMainnet) {
    for (const gate of MAINNET_GATES) {
      if (process.env[gate] !== "true") {
        throw new Error(`Mainnet blocked: ${gate}=true is required`);
      }
    }
  }

  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) throw new Error("No deployer signer available");

  const singleWalletMode = isTestnet && process.env.TESTNET_USE_DEPLOYER_ROLES === "true";
  const roleAddress = (name) => singleWalletMode ? deployer.address : requiredAddress(name);

  const owner = roleAddress("OWNER_ADDRESS");
  const treasury = roleAddress("TREASURY_ADDRESS");
  const liquidityWallet = roleAddress("LIQUIDITY_WALLET");
  const teamBeneficiary = roleAddress("TEAM_BENEFICIARY");
  const marketingWallet = roleAddress("MARKETING_WALLET");
  const teamLockDays = Number(required("TEAM_LOCK_DAYS"));

  if (!Number.isInteger(teamLockDays) || teamLockDays < 365 || teamLockDays > 550) {
    throw new Error("TEAM_LOCK_DAYS must be an integer from 365 to 550");
  }

  const deployerBalance = await hre.ethers.provider.getBalance(deployer.address);
  if (deployerBalance <= 0n) throw new Error("Deployer has zero BNB balance");

  const latestBlock = await hre.ethers.provider.getBlock("latest");
  if (!latestBlock) throw new Error("Unable to read latest block");
  const releaseTime = Number(latestBlock.timestamp) + teamLockDays * 24 * 60 * 60;

  console.log("Network          :", hre.network.name);
  console.log("Chain ID         :", chainId);
  console.log("Deployer         :", deployer.address);
  console.log("Deployer BNB     :", hre.ethers.formatEther(deployerBalance));
  console.log("Testnet role mode:", singleWalletMode ? "DEPLOYER_FOR_ALL_ROLES" : "EXPLICIT_ADDRESSES");
  console.log("Owner / multisig :", owner);
  console.log("Treasury         :", treasury);
  console.log("Liquidity wallet :", liquidityWallet);
  console.log("Team beneficiary :", teamBeneficiary);
  console.log("Marketing wallet :", marketingWallet);
  console.log("Team lock days   :", teamLockDays);

  const ATHToken = await hre.ethers.getContractFactory("ATHToken");
  const token = await ATHToken.deploy(deployer.address);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();

  const MiningAirdrop = await hre.ethers.getContractFactory("MiningAirdrop");
  const mining = await MiningAirdrop.deploy(tokenAddress, treasury, owner);
  await mining.waitForDeployment();
  const miningAddress = await mining.getAddress();

  const TeamTokenLock = await hre.ethers.getContractFactory("TeamTokenLock");
  const teamLock = await TeamTokenLock.deploy(tokenAddress, teamBeneficiary, releaseTime);
  await teamLock.waitForDeployment();
  const teamLockAddress = await teamLock.getAddress();

  const miningAllocation = hre.ethers.parseUnits("700000000", 18);
  const liquidityAllocation = hre.ethers.parseUnits("200000000", 18);
  const teamAllocation = hre.ethers.parseUnits("50000000", 18);
  const marketingAllocation = hre.ethers.parseUnits("50000000", 18);

  await (await token.transfer(miningAddress, miningAllocation)).wait();
  await (await token.transfer(liquidityWallet, liquidityAllocation)).wait();
  await (await token.transfer(teamLockAddress, teamAllocation)).wait();
  await (await token.transfer(marketingWallet, marketingAllocation)).wait();

  const remaining = await token.balanceOf(deployer.address);
  if (remaining !== 0n) throw new Error(`Unexpected deployer ATH balance: ${remaining}`);

  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    await (await token.transferOwnership(owner)).wait();
  }

  const manifest = {
    network: hre.network.name,
    chainId,
    deployer: deployer.address,
    testnetSingleWalletMode: singleWalletMode,
    owner,
    treasury,
    liquidityWallet,
    teamBeneficiary,
    marketingWallet,
    teamLockDays,
    teamReleaseAt: releaseTime,
    contracts: {
      ATH_TOKEN_ADDRESS: tokenAddress,
      ATH_MINING_ADDRESS: miningAddress,
      ATH_TEAM_LOCK_ADDRESS: teamLockAddress,
    },
    allocationsATH: {
      mining: "700000000",
      liquidity: "200000000",
      teamLocked: "50000000",
      marketing: "50000000",
    },
    deployedAt: new Date().toISOString(),
  };

  fs.mkdirSync("deployments", { recursive: true });
  const manifestPath = `deployments/${hre.network.name}.json`;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

  console.log("\n========== ATH DEPLOYMENT ==========");
  console.log("ATH_TOKEN       =", tokenAddress);
  console.log("MINING_AIRDROP  =", miningAddress);
  console.log("TEAM_TOKEN_LOCK =", teamLockAddress);
  console.log("TEAM_RELEASE_AT =", releaseTime);
  console.log("MANIFEST        =", manifestPath);
  console.log("====================================");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
