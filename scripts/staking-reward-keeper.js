const { ethers } = require("ethers");

const ABI = [
  "function MAX_DAILY_REWARD_BATCH() view returns (uint256)",
  "function MAX_STAKING_MEMBER_PAGE() view returns (uint256)",
  "function totalStakingMembers() view returns (uint256)",
  "function getStakingMembers(uint256 offset,uint256 limit) view returns (address[] result)",
  "function stakeCount(address user) view returns (uint256)",
  "function getPendingRewardUSDT(address user,uint256 stakeId) view returns (uint256)",
  "function processDailyRewardBatch(address[] accounts,uint256[] stakeIds) returns (uint256 processed)",
  "function rewardReserveATH() view returns (uint256)",
  "function networkReserveATH() view returns (uint256)"
];

function flag(name, fallback = false) {
  const raw = process.env[name];
  if (raw == null || raw === "") return fallback;
  return String(raw).toLowerCase() === "true";
}
function required(name) {
  const v = process.env[name];
  if (!v || !v.trim()) throw new Error("Missing required env: " + name);
  return v.trim();
}
function positiveInt(name, fallback) {
  const raw = process.env[name];
  const value = raw == null || raw === "" ? fallback : Number(raw);
  if (!Number.isInteger(value) || value <= 0) throw new Error(name + " must be a positive integer");
  return value;
}
function in0050Window(timestamp) {
  const d = new Date(Number(timestamp) * 1000);
  return d.getUTCHours() === 0 && d.getUTCMinutes() >= 50;
}
function chunkPairs(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function loadMembers(contract, pageSize) {
  const total = Number(await contract.totalStakingMembers());
  const members = [];
  for (let offset = 0; offset < total; offset += pageSize) {
    const page = await contract.getStakingMembers(offset, pageSize);
    for (const account of page) members.push(ethers.getAddress(account));
  }
  if (members.length !== total) throw new Error("Staking member registry mismatch");
  return members;
}

async function main() {
  if (!flag("STAKING_REWARD_KEEPER_ENABLED")) {
    console.log("ATH Staking reward keeper disabled. No RPC calls or transactions performed.");
    return;
  }

  const stakingAddress = required("ATH_STAKING_ADDRESS");
  const expectedKeeperWallet = required("KEEPER_WALLET_ADDRESS");
  if (!ethers.isAddress(expectedKeeperWallet) || expectedKeeperWallet === ethers.ZeroAddress) {
    throw new Error("KEEPER_WALLET_ADDRESS must be a non-zero EVM address");
  }
  if (!ethers.isAddress(stakingAddress) || stakingAddress === ethers.ZeroAddress) {
    throw new Error("ATH_STAKING_ADDRESS must be a non-zero EVM address");
  }

  const rpcUrl = process.env.BSC_TESTNET_RPC || "https://bsc-testnet-rpc.publicnode.com";
  const provider = new ethers.JsonRpcProvider(rpcUrl, 97);
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== 97) {
    throw new Error("Staking reward keeper is Testnet-only until production audit");
  }

  const latest = await provider.getBlock("latest");
  if (!latest) throw new Error("Unable to read latest BSC Testnet block");

  const read = new ethers.Contract(stakingAddress, ABI, provider);
  const [maxBatch, maxPage, rewardReserve, networkReserve] = await Promise.all([
    read.MAX_DAILY_REWARD_BATCH(),
    read.MAX_STAKING_MEMBER_PAGE(),
    read.rewardReserveATH(),
    read.networkReserveATH()
  ]);

  const batchSize = positiveInt("STAKING_REWARD_KEEPER_BATCH_SIZE", Math.min(25, Number(maxBatch)));
  const pageSize = positiveInt("STAKING_REWARD_KEEPER_PAGE_SIZE", Math.min(200, Number(maxPage)));
  if (batchSize > Number(maxBatch)) throw new Error("Batch size exceeds contract cap");
  if (pageSize > Number(maxPage)) throw new Error("Page size exceeds contract cap");

  const members = await loadMembers(read, pageSize);
  const due = [];
  let dueRewardUSDT = 0n;

  for (const account of members) {
    const count = Number(await read.stakeCount(account));
    for (let stakeId = 0; stakeId < count; stakeId++) {
      const pending = await read.getPendingRewardUSDT(account, stakeId);
      if (pending > 0n) {
        due.push({ account, stakeId });
        dueRewardUSDT += pending;
      }
    }
  }

  const dryRun = flag("STAKING_REWARD_KEEPER_DRY_RUN", true);
  const scheduleGuard = flag("STAKING_REWARD_KEEPER_SCHEDULE_GUARD", true);
  const evidence = {
    mode: dryRun ? "DRY_RUN" : "TRANSACT",
    chainId: 97,
    stakingAddress: ethers.getAddress(stakingAddress),
    latestBlock: latest.number,
    utc: new Date(Number(latest.timestamp) * 1000).toISOString(),
    schedule: "00:50 UTC daily",
    in0050Window: in0050Window(latest.timestamp),
    stakingMembers: members.length,
    duePositions: due.length,
    dueRewardUSDT: ethers.formatEther(dueRewardUSDT),
    rewardReserveATH: ethers.formatEther(rewardReserve),
    networkReserveATH: ethers.formatEther(networkReserve),
    expectedKeeperWallet: ethers.getAddress(expectedKeeperWallet),
    transactions: 0,
    processedPositions: 0
  };

  if (dryRun) {
    console.log("ATH STAKING REWARD KEEPER DRY RUN COMPLETE");
    console.log(JSON.stringify(evidence, null, 2));
    return;
  }

  if (scheduleGuard && !in0050Window(latest.timestamp)) {
    console.log("Outside 00:50-00:59 UTC Staking settlement window. No transaction performed.");
    console.log(JSON.stringify(evidence, null, 2));
    return;
  }

  if (!due.length) {
    console.log("No Staking reward positions due.");
    console.log(JSON.stringify(evidence, null, 2));
    return;
  }

  const privateKey = required("PRIVATE_KEY");
  const wallet = new ethers.Wallet(privateKey, provider);
  if (wallet.address.toLowerCase() !== expectedKeeperWallet.toLowerCase()) {
    throw new Error(
      `Keeper private key mismatch: derived ${wallet.address}, expected ${ethers.getAddress(expectedKeeperWallet)}`
    );
  }
  const minBalance = ethers.parseEther(process.env.STAKING_REWARD_KEEPER_MIN_BNB || "0.005");
  const balance = await provider.getBalance(wallet.address);
  if (balance < minBalance) {
    throw new Error("Staking reward keeper gas balance below configured minimum");
  }

  const runner = new ethers.Contract(stakingAddress, ABI, wallet);
  for (const batch of chunkPairs(due, batchSize)) {
    const accounts = batch.map(x => x.account);
    const stakeIds = batch.map(x => BigInt(x.stakeId));
    const wouldProcess = await read.processDailyRewardBatch.staticCall(accounts, stakeIds);
    if (wouldProcess === 0n) continue;
    const tx = await runner.processDailyRewardBatch(accounts, stakeIds);
    await tx.wait();
    evidence.transactions += 1;
    evidence.processedPositions += Number(wouldProcess);
  }

  console.log("ATH STAKING REWARD KEEPER COMPLETE");
  console.log(JSON.stringify(evidence, null, 2));
}

main().catch(err => {
  console.error("ATH Staking reward keeper failed:", err.message || err);
  process.exit(1);
});
