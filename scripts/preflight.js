const { ethers } = require("ethers");

const MAINNET_GATES = [
  "ALLOW_MAINNET_DEPLOY",
  "MAINNET_AUDIT_PASSED",
  "MAINNET_MULTISIG_CONFIRMED",
  "LIQUIDITY_LOCK_CONFIRMED",
];

const MIN_TESTNET_BNB = "0.02";

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error("Missing required env: " + name);
  return value.trim();
}

function address(name) {
  const value = required(name);
  if (!ethers.isAddress(value) || value === ethers.ZeroAddress) {
    throw new Error(name + " must be a non-zero EVM address");
  }
  return ethers.getAddress(value);
}

function gateOpen(name) {
  return process.env[name] === "true";
}

function testnetSingleWalletEnabled(target) {
  return target === "testnet" && process.env.TESTNET_USE_DEPLOYER_ROLES === "true";
}

async function main() {
  const target = (process.argv[2] || "testnet").toLowerCase();
  if (!["testnet", "mainnet"].includes(target)) {
    throw new Error("Usage: node scripts/preflight.js testnet|mainnet");
  }

  const privateKey = required("PRIVATE_KEY");
  const isTestnet = target === "testnet";
  const rpcUrl = required(isTestnet ? "BSC_TESTNET_RPC" : "BSC_MAINNET_RPC");
  const expectedChainId = isTestnet ? 97 : 56;

  if (isTestnet) {
    const configuredChainId = Number(required("ATH_CHAIN_ID"));
    if (configuredChainId !== 97) {
      throw new Error("ATH_CHAIN_ID must be 97 for BSC Testnet");
    }

    for (const gate of MAINNET_GATES) {
      if (gateOpen(gate)) {
        throw new Error("Testnet safety check failed: " + gate + " must remain false");
      }
    }
  } else {
    for (const gate of MAINNET_GATES) {
      if (!gateOpen(gate)) throw new Error("MAINNET BLOCKED: " + gate + "=true is required");
    }
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);
  if (chainId !== expectedChainId) {
    throw new Error(`Wrong chain: expected ${expectedChainId}, got ${chainId}`);
  }

  let wallet;
  try {
    wallet = new ethers.Wallet(privateKey, provider);
  } catch {
    throw new Error("PRIVATE_KEY is not a valid EVM private key");
  }

  const singleWalletMode = testnetSingleWalletEnabled(target);
  const roleAddress = (name) => singleWalletMode ? wallet.address : address(name);

  const miningOwner = roleAddress("MINING_OWNER_ADDRESS");
  const stakingOwner = roleAddress("STAKING_OWNER_ADDRESS");
  const presaleOwner = roleAddress("PRESALE_OWNER_ADDRESS");
  const tokenOwner = presaleOwner;
  const priceRegistryOwner = presaleOwner;
  const treasury = roleAddress("MINING_TREASURY_ADDRESS");
  const presaleWallet = roleAddress("PRESALE_WALLET");
  const keeperWallet = roleAddress("KEEPER_WALLET_ADDRESS");
  const presalePaymentToken = address("PRESALE_PAYMENT_TOKEN");
  const liquidityWallet = roleAddress("LIQUIDITY_WALLET");
  const stakingReserveWallet = roleAddress("STAKING_RESERVE_WALLET");
  const developmentBeneficiary = roleAddress("DEVELOPMENT_BENEFICIARY");

  const [balance, blockNumber] = await Promise.all([
    provider.getBalance(wallet.address),
    provider.getBlockNumber(),
  ]);

  // Public funding target only. PRIVATE_KEY is never printed.
  console.log("preflightDeployer:", wallet.address);
  console.log("preflightDeployerBNB:", ethers.formatEther(balance));

  if (isTestnet && balance < ethers.parseEther(MIN_TESTNET_BNB)) {
    throw new Error(
      `Deployer needs at least ${MIN_TESTNET_BNB} Testnet BNB before ATH deployment; current balance: ${ethers.formatEther(balance)}`
    );
  }
  if (!isTestnet && balance <= 0n) {
    throw new Error("Deployer has zero BNB balance on target chain");
  }

  console.log(`ATH ${target} preflight PASSED`);
  console.log("chainId:", chainId);
  console.log("latestBlock:", blockNumber);
  console.log("deployer:", wallet.address);
  console.log("deployerBNB:", ethers.formatEther(balance));
  console.log("testnetMinBNB:", isTestnet ? MIN_TESTNET_BNB : "n/a");
  console.log("testnetSingleWalletMode:", singleWalletMode ? "ENABLED" : "DISABLED");
  console.log("miningOwner:", miningOwner);
  console.log("stakingOwner:", stakingOwner);
  console.log("presaleOwner:", presaleOwner);
  console.log("tokenOwner:", tokenOwner);
  console.log("priceRegistryOwner:", priceRegistryOwner);
  console.log("keeperWallet:", keeperWallet);
  console.log("miningTreasury:", treasury);
  console.log("presaleTreasury:", presaleWallet);
  console.log("presalePaymentToken:", presalePaymentToken);
  console.log("presaleOpeningPriceUSD:", "0.07");
  console.log("presalePriceStepUSD:", "0.001 / 100000 ATH sold");
  console.log("presaleSoldOutPriceUSD:", "0.37");
  console.log("liquidityWallet:", liquidityWallet);
  console.log("stakingReserveWallet:", stakingReserveWallet);
  console.log("developmentBeneficiary:", developmentBeneficiary);
  console.log("tokenomics:", "700M Mining + 300M Staking");
  console.log("preListingPriceSource:", "ATH_PRESALE");
  console.log("presaleOpeningPriceUSD:", "0.07");
  console.log("presalePriceStep:", "$0.001 / 100000 ATH sold");
  console.log("presaleSoldOutReferenceUSD:", "0.37");
  console.log("officialListingHolderTarget:", "15000");
  console.log("privateKey: [REDACTED]");

  if (!isTestnet) {
    console.log("Mainnet gates are OPEN. Deployment is still a separate explicit operator action.");
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
