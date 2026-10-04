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

function requiredAddressAny(names) {
  const name = names.find((candidate) => String(process.env[candidate] || "").trim());
  if (!name) throw new Error(`Missing required env: one of ${names.join(", ")}`);
  return requiredAddress(name);
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

  const token = requiredAddressAny(["ATH_TOKEN_ADDRESS", "ATH_TOKEN"]);
  const priceRegistry = requiredAddress("ATH_PRICE_REGISTRY_ADDRESS");
  const presale = requiredAddress("ATH_PRESALE_ADDRESS");
  const presalePaymentToken = requiredAddress("PRESALE_PAYMENT_TOKEN");
  const mining = requiredAddressAny(["ATH_MINING_ADDRESS", "MINING_AIRDROP"]);
  const staking = requiredAddress("ATH_STAKING_ADDRESS");
  const oracle = requiredAddress("ATH_STAKING_ORACLE_ADDRESS");
  const developmentVesting = requiredAddress("ATH_DEVELOPMENT_VESTING_ADDRESS");
  const deployerAddress = requiredAddress("DEPLOYER_ADDRESS");

  const singleWalletMode = isTestnet && process.env.TESTNET_USE_DEPLOYER_ROLES === "true";
  const roleAddress = (name) => singleWalletMode ? deployerAddress : requiredAddress(name);
  const miningOwner = roleAddress("MINING_OWNER_ADDRESS");
  const stakingOwner = roleAddress("STAKING_OWNER_ADDRESS");
  const presaleOwner = roleAddress("PRESALE_OWNER_ADDRESS");
  const treasury = miningOwner;
  const presaleTreasury = roleAddress("PRESALE_WALLET");
  const developmentBeneficiary = roleAddress("DEVELOPMENT_BENEFICIARY");

  console.log("Verifying ATH contracts on", hre.network.name, "chain", chainId);
  console.log("Testnet single-wallet mode:", singleWalletMode ? "ENABLED" : "DISABLED");
  console.log("ATH token:", token);
  console.log("ATH price registry:", priceRegistry);
  console.log("ATH presale:", presale);
  console.log("Mining:", mining);
  console.log("Staking:", staking);
  console.log("Staking oracle:", oracle);
  console.log("Development vesting:", developmentVesting);

  await hre.run("verify:verify", {
    address: token,
    constructorArguments: [deployerAddress],
  });

  await hre.run("verify:verify", {
    address: priceRegistry,
    constructorArguments: [presale, presaleOwner],
  });

  await hre.run("verify:verify", {
    address: presale,
    constructorArguments: [token, presalePaymentToken, presaleTreasury, presaleOwner],
  });

  await hre.run("verify:verify", {
    address: mining,
    constructorArguments: [token, treasury, priceRegistry, miningOwner],
  });

  await hre.run("verify:verify", {
    address: oracle,
    constructorArguments: [priceRegistry],
  });

  await hre.run("verify:verify", {
    address: staking,
    constructorArguments: [token, oracle, stakingOwner],
  });

  await hre.run("verify:verify", {
    address: developmentVesting,
    constructorArguments: [token, developmentBeneficiary],
  });

  console.log("ATH Mining v3.3 + Staking v1 BscScan verification complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
