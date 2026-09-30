const { ethers } = require("ethers");

const ABI = [
  "function MAX_KEEPER_BATCH() view returns (uint256)",
  "function MAX_MINER_PAGE() view returns (uint256)",
  "function totalMiners() view returns (uint256)",
  "function getMiners(uint256 offset,uint256 limit) view returns (address[] result)",
  "function snapshotDailyRewards(address[] accounts) returns (uint256 processed)",
  "function expireDailyRewards(address[] accounts,uint256 dayId) returns (uint256 processed)",
];

const DAY = 86400;
const CLAIM_OPEN_OFFSET = 300;

function flag(name, fallback = false) {
  const value = process.env[name];
  if (value == null || value === "") return fallback;
  return value.toLowerCase() === "true";
}

function required(name) {
  const value = process.env[name];
  if (!value || !value.trim()) throw new Error(`Missing required env: ${name}`);
  return value.trim();
}

function asPositiveInt(name, fallback) {
  const raw = process.env[name];
  const value = raw == null || raw === "" ? fallback : Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}

function chunk(values, size) {
  const out = [];
  for (let i = 0; i < values.length; i += size) out.push(values.slice(i, i + size));
  return out;
}

async function loadRegisteredMiners(contract, pageSize) {
  const total = Number(await contract.totalMiners());
  const miners = [];

  for (let offset = 0; offset < total; offset += pageSize) {
    const page = await contract.getMiners(offset, pageSize);
    for (const account of page) miners.push(ethers.getAddress(account));
  }

  if (miners.length !== total) {
    throw new Error(`Miner registry mismatch: loaded=${miners.length}, totalMiners=${total}`);
  }

  return miners;
}

async function main() {
  if (!flag("KEEPER_ENABLED")) {
    console.log("ATH reward keeper is disabled (KEEPER_ENABLED=false). No RPC calls or transactions performed.");
    return;
  }

  const miningAddress = required("ATH_MINING_ADDRESS");
  if (!ethers.isAddress(miningAddress) || miningAddress === ethers.ZeroAddress) {
    throw new Error("ATH_MINING_ADDRESS must be a non-zero EVM address");
  }

  const rpcUrl = process.env.BSC_TESTNET_RPC || "https://bsc-testnet-rpc.publicnode.com";
  const provider = new ethers.JsonRpcProvider(rpcUrl, 97);
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== 97) {
    throw new Error(`Keeper is Testnet-only until production audit; received chainId=${network.chainId}`);
  }

  const latestBlock = await provider.getBlock("latest");
  if (!latestBlock) throw new Error("Unable to read latest BSC Testnet block");

  const readContract = new ethers.Contract(miningAddress, ABI, provider);
  const [contractBatchMax, contractPageMax] = await Promise.all([
    readContract.MAX_KEEPER_BATCH(),
    readContract.MAX_MINER_PAGE(),
  ]);

  const batchMax = Number(contractBatchMax);
  const pageMax = Number(contractPageMax);
  const batchSize = asPositiveInt("KEEPER_BATCH_SIZE", 25);
  const pageSize = asPositiveInt("KEEPER_PAGE_SIZE", Math.min(200, pageMax));

  if (batchSize > batchMax) {
    throw new Error(`KEEPER_BATCH_SIZE=${batchSize} exceeds contract MAX_KEEPER_BATCH=${batchMax}`);
  }
  if (pageSize > pageMax) {
    throw new Error(`KEEPER_PAGE_SIZE=${pageSize} exceeds contract MAX_MINER_PAGE=${pageMax}`);
  }

  const miners = await loadRegisteredMiners(readContract, pageSize);
  const batches = chunk(miners, batchSize);

  const dayId = Math.floor(Number(latestBlock.timestamp) / DAY);
  const opensAt = dayId * DAY + CLAIM_OPEN_OFFSET;
  const dryRun = flag("KEEPER_DRY_RUN", true);

  let runner = readContract;
  let walletAddress = null;
  let keeperBalance = null;

  if (!dryRun) {
    const privateKey = required("PRIVATE_KEY");
    const wallet = new ethers.Wallet(privateKey, provider);
    walletAddress = wallet.address;

    const minBalance = ethers.parseEther(process.env.KEEPER_MIN_BNB || "0.005");
    const balance = await provider.getBalance(wallet.address);
    keeperBalance = ethers.formatEther(balance);

    if (balance < minBalance) {
      throw new Error(
        `Keeper gas balance too low: ${ethers.formatEther(balance)} tBNB; minimum ${ethers.formatEther(minBalance)}`
      );
    }

    runner = new ethers.Contract(miningAddress, ABI, wallet);
  }

  const evidence = {
    mode: dryRun ? "DRY_RUN" : "TRANSACT",
    chainId: 97,
    miningAddress: ethers.getAddress(miningAddress),
    keeperWallet: walletAddress,
    keeperBalanceTBNB: keeperBalance,
    latestBlock: latestBlock.number,
    latestTimestamp: Number(latestBlock.timestamp),
    dayId,
    minersRegistered: miners.length,
    pageSize,
    batchSize,
    batches: batches.length,
    expirePreviousDay: { dayId: dayId - 1, wouldProcess: 0, txs: 0 },
    snapshotToday: {
      dayId,
      opensAt,
      open: Number(latestBlock.timestamp) >= opensAt,
      wouldProcess: 0,
      txs: 0,
    },
  };

  if (dayId > 0) {
    for (const accounts of batches) {
      const processed = await readContract.expireDailyRewards.staticCall(accounts, dayId - 1);
      evidence.expirePreviousDay.wouldProcess += Number(processed);

      if (!dryRun && processed > 0n) {
        const tx = await runner.expireDailyRewards(accounts, dayId - 1);
        await tx.wait();
        evidence.expirePreviousDay.txs += 1;
      }
    }
  }

  if (Number(latestBlock.timestamp) >= opensAt) {
    for (const accounts of batches) {
      const processed = await readContract.snapshotDailyRewards.staticCall(accounts);
      evidence.snapshotToday.wouldProcess += Number(processed);

      if (!dryRun && processed > 0n) {
        const tx = await runner.snapshotDailyRewards(accounts);
        await tx.wait();
        evidence.snapshotToday.txs += 1;
      }
    }
  }

  console.log("ATH v3.3 REWARD KEEPER COMPLETE");
  console.log(JSON.stringify(evidence, null, 2));
}

main().catch((err) => {
  console.error("ATH reward keeper failed:", err.message || err);
  process.exit(1);
});