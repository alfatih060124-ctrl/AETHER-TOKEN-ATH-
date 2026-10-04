const { ethers } = require("ethers");

const ABI = [
  "function MAX_RANK_BATCH() view returns (uint256)",
  "function MAX_RANK_MEMBER_PAGE() view returns (uint256)",
  "function totalRankMembers() view returns (uint256)",
  "function getRankMembers(uint256 offset,uint256 limit) view returns (address[] result)",
  "function rankSalaryPreview(address account) view returns (uint8 highestRank,uint8 payableRankNow,uint256 periodsDue,uint256 salaryUSDT,uint256 salaryATH,uint256 nextPayoutAt,uint256 smallLegTurnover,uint256 sponsors)",
  "function processRankSalaryBatch(address[] accounts) returns (uint256 processed)",
  "function networkReserveATH() view returns (uint256)",
];

function flag(name, fallback = false) {
  const raw = process.env[name];
  if (raw == null || raw === "") return fallback;
  return String(raw).toLowerCase() === "true";
}

function required(name) {
  const value = process.env[name];
  if (!value || !value.trim()) throw new Error(`Missing required env: ${name}`);
  return value.trim();
}

function positiveInt(name, fallback) {
  const raw = process.env[name];
  const value = raw == null || raw === "" ? fallback : Number(raw);
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${name} must be a positive integer`);
  return value;
}

function chunks(values, size) {
  const out = [];
  for (let i = 0; i < values.length; i += size) out.push(values.slice(i, i + size));
  return out;
}

async function loadRankMembers(contract, pageSize) {
  const total = Number(await contract.totalRankMembers());
  const members = [];
  for (let offset = 0; offset < total; offset += pageSize) {
    const page = await contract.getRankMembers(offset, pageSize);
    for (const account of page) members.push(ethers.getAddress(account));
  }
  if (members.length !== total) {
    throw new Error(`Rank registry mismatch: loaded=${members.length}, total=${total}`);
  }
  return members;
}

function in0030Window(timestamp) {
  const d = new Date(Number(timestamp) * 1000);
  return d.getUTCHours() === 0 && d.getUTCMinutes() >= 30 && d.getUTCMinutes() <= 59;
}

async function main() {
  if (!flag("RANK_KEEPER_ENABLED")) {
    console.log("ATH Rank salary keeper is disabled (RANK_KEEPER_ENABLED=false). No RPC calls or transactions performed.");
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
    throw new Error(`Rank keeper is Testnet-only until production audit; received chainId=${network.chainId}`);
  }

  const latest = await provider.getBlock("latest");
  if (!latest) throw new Error("Unable to read latest BSC Testnet block");

  const dryRun = flag("RANK_KEEPER_DRY_RUN", true);
  const scheduleGuard = flag("RANK_KEEPER_SCHEDULE_GUARD", true);
  const read = new ethers.Contract(stakingAddress, ABI, provider);

  const [contractBatchMax, contractPageMax, networkReserve] = await Promise.all([
    read.MAX_RANK_BATCH(),
    read.MAX_RANK_MEMBER_PAGE(),
    read.networkReserveATH(),
  ]);

  const batchSize = positiveInt("RANK_KEEPER_BATCH_SIZE", Math.min(25, Number(contractBatchMax)));
  const pageSize = positiveInt("RANK_KEEPER_PAGE_SIZE", Math.min(200, Number(contractPageMax)));
  if (batchSize > Number(contractBatchMax)) {
    throw new Error(`RANK_KEEPER_BATCH_SIZE=${batchSize} exceeds MAX_RANK_BATCH=${contractBatchMax}`);
  }
  if (pageSize > Number(contractPageMax)) {
    throw new Error(`RANK_KEEPER_PAGE_SIZE=${pageSize} exceeds MAX_RANK_MEMBER_PAGE=${contractPageMax}`);
  }

  const members = await loadRankMembers(read, pageSize);
  const due = [];
  let dueSalaryUSDT = 0n;
  let dueSalaryATH = 0n;

  for (const account of members) {
    const preview = await read.rankSalaryPreview(account);
    if (preview.periodsDue > 0n && preview.salaryUSDT > 0n) {
      due.push(account);
      dueSalaryUSDT += preview.salaryUSDT;
      dueSalaryATH += preview.salaryATH;
    }
  }

  const evidence = {
    mode: dryRun ? "DRY_RUN" : "TRANSACT",
    chainId: 97,
    stakingAddress: ethers.getAddress(stakingAddress),
    latestBlock: latest.number,
    latestTimestamp: Number(latest.timestamp),
    utc: new Date(Number(latest.timestamp) * 1000).toISOString(),
    scheduleGuard,
    in0030Window: in0030Window(latest.timestamp),
    rankMembers: members.length,
    dueAccounts: due.length,
    dueSalaryUSDT: ethers.formatEther(dueSalaryUSDT),
    dueSalaryATH: ethers.formatEther(dueSalaryATH),
    networkMarketingReserveATH: ethers.formatEther(networkReserve),
    batchSize,
    pageSize,
    expectedKeeperWallet: ethers.getAddress(expectedKeeperWallet),
    transactions: 0,
    processedAccounts: 0,
  };

  if (dryRun) {
    console.log("ATH RANK SALARY KEEPER DRY RUN COMPLETE");
    console.log(JSON.stringify(evidence, null, 2));
    return;
  }

  if (scheduleGuard && !in0030Window(latest.timestamp)) {
    console.log("ATH Rank salary keeper outside 00:30-00:59 UTC guard window. No transaction performed.");
    console.log(JSON.stringify(evidence, null, 2));
    return;
  }

  if (due.length === 0) {
    console.log("ATH Rank salary keeper: no salary due.");
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
  const minBalance = ethers.parseEther(process.env.RANK_KEEPER_MIN_BNB || "0.005");
  const balance = await provider.getBalance(wallet.address);
  if (balance < minBalance) {
    throw new Error(
      `Rank keeper gas balance too low: ${ethers.formatEther(balance)} tBNB; minimum ${ethers.formatEther(minBalance)}`
    );
  }

  evidence.keeperWallet = wallet.address;
  evidence.keeperBalanceTBNB = ethers.formatEther(balance);

  const runner = new ethers.Contract(stakingAddress, ABI, wallet);
  for (const batch of chunks(due, batchSize)) {
    const wouldProcess = await read.processRankSalaryBatch.staticCall(batch);
    if (wouldProcess === 0n) continue;
    const tx = await runner.processRankSalaryBatch(batch);
    await tx.wait();
    evidence.transactions += 1;
    evidence.processedAccounts += Number(wouldProcess);
  }

  console.log("ATH RANK SALARY KEEPER COMPLETE");
  console.log(JSON.stringify(evidence, null, 2));
}

main().catch((err) => {
  console.error("ATH Rank salary keeper failed:", err.message || err);
  process.exit(1);
});
