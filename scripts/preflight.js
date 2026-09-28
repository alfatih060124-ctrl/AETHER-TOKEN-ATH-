const ADDRESS = /^0x[a-fA-F0-9]{40}$/;

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error("Missing required env: " + name);
  return value;
}

function address(name) {
  const value = required(name);
  if (!ADDRESS.test(value) || /^0x0{40}$/i.test(value)) {
    throw new Error(name + " must be a non-zero EVM address");
  }
  return value;
}

function boolTrue(name) {
  return process.env[name] === "true";
}

const target = (process.argv[2] || "testnet").toLowerCase();
if (!["testnet", "mainnet"].includes(target)) {
  throw new Error("Usage: node scripts/preflight.js testnet|mainnet");
}

required("PRIVATE_KEY");
address("OWNER_ADDRESS");
address("TREASURY_ADDRESS");
address("TEAM_BENEFICIARY");

if (process.env.LIQUIDITY_WALLET) address("LIQUIDITY_WALLET");
if (process.env.MARKETING_WALLET) address("MARKETING_WALLET");

const teamLockDays = Number(required("TEAM_LOCK_DAYS"));
if (!Number.isInteger(teamLockDays) || teamLockDays < 365 || teamLockDays > 550) {
  throw new Error("TEAM_LOCK_DAYS must be an integer from 365 to 550");
}

if (target === "testnet") {
  required("BSC_TESTNET_RPC");
  console.log("ATH testnet preflight PASSED.");
  console.log("Owner:", process.env.OWNER_ADDRESS);
  console.log("Treasury:", process.env.TREASURY_ADDRESS);
  console.log("Team lock days:", teamLockDays);
  process.exit(0);
}

required("BSC_MAINNET_RPC");
for (const gate of [
  "ALLOW_MAINNET_DEPLOY",
  "MAINNET_AUDIT_PASSED",
  "MAINNET_MULTISIG_CONFIRMED",
  "LIQUIDITY_LOCK_CONFIRMED",
]) {
  if (!boolTrue(gate)) throw new Error("MAINNET BLOCKED: " + gate + "=true is required");
}

console.log("ATH mainnet preflight PASSED. Deployment is still an explicit operator action.");
