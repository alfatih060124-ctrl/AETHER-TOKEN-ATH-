const hre = require("hardhat");

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
  required("BSCSCAN_API_KEY");

  const network = await hre.ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  const isTestnet = hre.network.name === "bscTestnet";
  const isMainnet = hre.network.name === "bscMainnet";

  if (!isTestnet && !isMainnet) {
    throw new Error("ATH verification is allowed only on configured BSC Testnet or BSC Mainnet");
  }
  if (isTestnet && chainId !== 97) throw new Error(`BSC Testnet chain mismatch: ${chainId}`);
  if (isMainnet && chainId !== 56) throw new Error(`BSC Mainnet chain mismatch: ${chainId}`);

  const token = requiredAddress("ATH_TOKEN");
  const mining = requiredAddress("MINING_AIRDROP");
  const teamLock = requiredAddress("TEAM_TOKEN_LOCK");
  const deployerAddress = requiredAddress("DEPLOYER_ADDRESS");

  const singleWalletMode = isTestnet && process.env.TESTNET_USE_DEPLOYER_ROLES === "true";
  const owner = singleWalletMode ? deployerAddress : requiredAddress("OWNER_ADDRESS");
  const treasury = singleWalletMode ? deployerAddress : requiredAddress("TREASURY_ADDRESS");
  const teamBeneficiary = singleWalletMode ? deployerAddress : requiredAddress("TEAM_BENEFICIARY");

  const teamReleaseAt = Number(required("TEAM_RELEASE_AT"));
  if (!Number.isInteger(teamReleaseAt) || teamReleaseAt <= 0) {
    throw new Error("TEAM_RELEASE_AT must be a positive Unix timestamp");
  }

  console.log("Verifying ATH contracts on", hre.network.name, "chain", chainId);
  console.log("Testnet single-wallet mode:", singleWalletMode ? "ENABLED" : "DISABLED");
  console.log("ATH token:", token);
  console.log("Mining:", mining);
  console.log("Team lock:", teamLock);

  await hre.run("verify:verify", {
    address: token,
    constructorArguments: [deployerAddress],
  });

  await hre.run("verify:verify", {
    address: mining,
    constructorArguments: [token, treasury, owner],
  });

  await hre.run("verify:verify", {
    address: teamLock,
    constructorArguments: [token, teamBeneficiary, teamReleaseAt],
  });

  console.log("ATH BscScan verification complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
