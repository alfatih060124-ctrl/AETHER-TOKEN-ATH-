const { ethers } = require("ethers");

const MAINNET_GATES = [
  "ALLOW_MAINNET_DEPLOY",
  "MAINNET_AUDIT_PASSED",
  "MAINNET_MULTISIG_CONFIRMED",
  "LIQUIDITY_LOCK_CONFIRMED",
];

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

async function main() {
  const target = (process.argv[2] || "testnet").toLowerCase();
  if (!["testnet", "mainnet"].includes(target)) {
    throw new Error("Usage: node scripts/preflight.js testnet|mainnet");
  }

  const privateKey = required("PRIVATE_KEY");
  const owner = address("OWNER_ADDRESS");
  const treasury = address("TREASURY_ADDRESS");
  const teamBeneficiary = address("TEAM_BENEFICIARY");
  const liquidityWallet = address("LIQUIDITY_WALLET");
  const marketingWallet = address("MARKETING_WALLET");

  const teamLockDays = Number(required("TEAM_LOCK_DAYS"));
  if (!Number.isInteger(teamLockDays) || teamLockDays < 365 || teamLockDays > 550) {
    throw new Error("TEAM_LOCK_DAYS must be an integer from 365 to 550");
  }

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

  const [balance, blockNumber] = await Promise.all([
    provider.getBalance(wallet.address),
    provider.getBlockNumber(),
  ]);

  if (balance <= 0n) {
    throw new Error("Deployer has zero BNB balance on target chain");
  }

  console.log(`ATH ${target} preflight PASSED`);
  console.log("chainId:", chainId);
  console.log("latestBlock:", blockNumber);
  console.log("deployer:", wallet.address);
  console.log("deployerBNB:", ethers.formatEther(balance));
  console.log("owner:", owner);
  console.log("treasury:", treasury);
  console.log("teamBeneficiary:", teamBeneficiary);
  console.log("liquidityWallet:", liquidityWallet);
  console.log("marketingWallet:", marketingWallet);
  console.log("teamLockDays:", teamLockDays);
  console.log("privateKey: [REDACTED]");

  if (!isTestnet) {
    console.log("Mainnet gates are OPEN. Deployment is still a separate explicit operator action.");
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
