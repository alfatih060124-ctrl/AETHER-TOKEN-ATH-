const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "deployments", "abi");
const ENGINE_VERSION = "3.3.0";

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
    name: "TeamTokenLock",
    artifact: path.join(ROOT, "artifacts", "contracts", "TeamTokenLock.sol", "TeamTokenLock.json"),
    output: "TeamTokenLock.json",
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
  format: 1,
  engineVersion: ENGINE_VERSION,
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

  const publicArtifact = {
    contractName: spec.name,
    engineVersion: ENGINE_VERSION,
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

fs.writeFileSync(
  path.join(OUT, "release-v3.3.json"),
  stableJson(release)
);

console.log(JSON.stringify(release, null, 2));
console.log("ATH v3.3 ABI/release package generated.");