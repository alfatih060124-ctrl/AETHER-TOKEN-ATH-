const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "deployments", "abi");
const MINING_VERSION = "3.3.0";
const STAKING_VERSION = "1.0.0";

const contracts = [
  {
    name: "ATHToken",
    artifact: path.join(ROOT, "artifacts", "contracts", "ATHToken.sol", "ATHToken.json"),
    output: "ATHToken.json",
  },
  {
    name: "MiningAirdrop",
    artifact: path.join(ROOT, "artifacts", "contracts", "MiningAirdrop.sol", "MiningAirdrop.json"),
    output: "MiningAirdrop.v3.3.json",
  },
  {
    name: "ATHStaking",
    artifact: path.join(ROOT, "artifacts", "contracts", "ATHStaking.sol", "ATHStaking.json"),
    output: "ATHStaking.v1.json",
  },
  {
    name: "ATHStakingPriceOracle",
    artifact: path.join(ROOT, "artifacts", "contracts", "ATHStakingPriceOracle.sol", "ATHStakingPriceOracle.json"),
    output: "ATHStakingPriceOracle.v1.json",
  },
  {
    name: "ATHDevelopmentVesting",
    artifact: path.join(ROOT, "artifacts", "contracts", "ATHDevelopmentVesting.sol", "ATHDevelopmentVesting.json"),
    output: "ATHDevelopmentVesting.v1.json",
  },
];

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function stableJson(value) {
  return JSON.stringify(value, null, 2) + "\n";
}

function requiredFunctions(abi, names) {
  const functions = new Set(
    abi.filter((item) => item.type === "function").map((item) => item.name)
  );
  for (const name of names) {
    if (!functions.has(name)) throw new Error("Missing ABI function: " + name);
  }
}

fs.mkdirSync(OUT, { recursive: true });

const release = {
  format: 2,
  miningVersion: MINING_VERSION,
  stakingVersion: STAKING_VERSION,
  tokenomicsVersion: "2.0",
  contracts: {},
};

for (const spec of contracts) {
  const artifact = JSON.parse(fs.readFileSync(spec.artifact, "utf8"));

  if (spec.name === "MiningAirdrop") {
    requiredFunctions(artifact.abi, [
      "buyPower",
      "buyPowerBooster",
      "buyDoublePowerBooster",
      "claimDaily",
      "claimAllVested",
      "getDailyRewardStatus",
      "snapshotDailyRewards",
      "expireDailyRewards",
      "MAX_KEEPER_BATCH",
      "MAX_MINER_PAGE",
      "totalMiners",
      "getMiners",
      "getVestingSummary",
      "getVestingDashboard",
      "getVestingCyclePreview",
      "previewFinalSettlement",
      "setBoosterPrices",
    ]);
  }

  if (spec.name === "ATHStaking") {
    requiredFunctions(artifact.abi, [
      "stake",
      "claimReward",
      "withdrawPrincipal",
      "fundRewards",
      "getATHAmount",
      "getPendingRewardUSDT",
      "getPendingRewardATH",
      "availableExcessATH",
      "packageCount",
      "stakeCount",
      "rewardReserveATH",
      "principalLiabilityATH",
      "pause",
      "unpause",
    ]);
  }

  if (spec.name === "ATHStakingPriceOracle") {
    requiredFunctions(artifact.abi, ["getPrice", "ATH_PRICE_USD8", "PRICE_DECIMALS"]);
  }

  if (spec.name === "ATHDevelopmentVesting") {
    requiredFunctions(artifact.abi, ["vestedATH", "claimableATH", "claim"]);
  }

  const publicArtifact = {
    contractName: spec.name,
    miningVersion: MINING_VERSION,
    stakingVersion: STAKING_VERSION,
    abi: artifact.abi,
  };

  const outPath = path.join(OUT, spec.output);
  fs.writeFileSync(outPath, stableJson(publicArtifact));

  const deployedBytecode = artifact.deployedBytecode || "0x";
  release.contracts[spec.name] = {
    abiFile: path.relative(ROOT, outPath),
    abiSha256: sha256(JSON.stringify(artifact.abi)),
    deployedBytecodeSha256: sha256(deployedBytecode),
    deployedBytecodeBytes: Math.max(0, (deployedBytecode.length - 2) / 2),
  };
}

const miningBytes = release.contracts.MiningAirdrop.deployedBytecodeBytes;
if (miningBytes >= 24576) {
  throw new Error("MiningAirdrop exceeds EIP-170 deployed bytecode limit");
}

const stakingBytes = release.contracts.ATHStaking.deployedBytecodeBytes;
if (stakingBytes >= 24576) {
  throw new Error("ATHStaking exceeds EIP-170 deployed bytecode limit");
}

fs.writeFileSync(
  path.join(OUT, "release-mining-v3.3-staking-v1.json"),
  stableJson(release)
);

console.log(JSON.stringify(release, null, 2));
console.log("ATH Mining v3.3 + Staking v1 ABI/release package generated.");
