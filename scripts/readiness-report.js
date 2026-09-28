const required = [
  "PRIVATE_KEY",
  "OWNER_ADDRESS",
  "TREASURY_ADDRESS",
  "TEAM_BENEFICIARY",
  "LIQUIDITY_WALLET",
  "MARKETING_WALLET",
  "BSCSCAN_API_KEY",
];

const safeRequired = [
  "BSC_TESTNET_RPC",
  "ATH_CHAIN_ID",
  "TEAM_LOCK_DAYS",
];

const mainnetGates = [
  "ALLOW_MAINNET_DEPLOY",
  "MAINNET_AUDIT_PASSED",
  "MAINNET_MULTISIG_CONFIRMED",
  "LIQUIDITY_LOCK_CONFIRMED",
];

const missingSecretsOrAddresses = required.filter((name) => !process.env[name]);
const missingSafe = safeRequired.filter((name) => !process.env[name]);

console.log("ATH Testnet Readiness Report");
console.log("safeConfig:", missingSafe.length === 0 ? "READY" : "MISSING");
console.log("operatorConfig:", missingSecretsOrAddresses.length === 0 ? "READY" : "BLOCKED");
console.log("missingSafe:", missingSafe.length ? missingSafe.join(", ") : "none");
console.log(
  "missingOperatorConfig:",
  missingSecretsOrAddresses.length ? missingSecretsOrAddresses.join(", ") : "none"
);

const gateState = Object.fromEntries(
  mainnetGates.map((name) => [name, process.env[name] === "true" ? "OPEN" : "CLOSED"])
);
console.log("mainnetGates:", JSON.stringify(gateState));

if (Object.values(gateState).some((state) => state !== "CLOSED")) {
  throw new Error("Safety check failed: one or more mainnet gates are not CLOSED");
}

if (missingSafe.length > 0) {
  throw new Error("Safe Testnet configuration is incomplete");
}

// This report intentionally exits 0 when only operator secrets/addresses are absent.
// Deployment remains blocked by preflight:testnet until those values exist.
console.log("readinessReport: PASSED (deployment may still be blocked by operator config)");
