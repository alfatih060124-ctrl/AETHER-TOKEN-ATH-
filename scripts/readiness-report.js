const singleWalletMode = process.env.TESTNET_USE_DEPLOYER_ROLES === "true";

const deployRequired = singleWalletMode
  ? ["PRIVATE_KEY"]
  : [
      "PRIVATE_KEY",
      "OWNER_ADDRESS",
      "TREASURY_ADDRESS",
      "PRESALE_WALLET",
      "MARKETING_WALLET",
      "LIQUIDITY_WALLET",
      "STAKING_RESERVE_WALLET",
      "DEVELOPMENT_BENEFICIARY",
    ];

const verificationRequired = [
  "BSCSCAN_API_KEY",
];

const safeRequired = [
  "BSC_TESTNET_RPC",
  "ATH_CHAIN_ID",
  "TESTNET_USE_DEPLOYER_ROLES",
];

const mainnetGates = [
  "ALLOW_MAINNET_DEPLOY",
  "MAINNET_AUDIT_PASSED",
  "MAINNET_MULTISIG_CONFIRMED",
  "LIQUIDITY_LOCK_CONFIRMED",
];

const missingDeployConfig = deployRequired.filter((name) => !process.env[name]);
const missingVerificationConfig = verificationRequired.filter((name) => !process.env[name]);
const missingSafe = safeRequired.filter((name) => !process.env[name]);

console.log("ATH Testnet Readiness Report");
console.log("tokenomics:", "1B ATH = 700M Mining + 300M Staking");
console.log("preListingReferencePriceUSD:", "0.37");
console.log("officialListingHolderTarget:", "15000");
console.log("testnetSingleWalletMode:", singleWalletMode ? "ENABLED" : "DISABLED");
console.log("safeConfig:", missingSafe.length === 0 ? "READY" : "MISSING");
console.log("deploymentConfig:", missingDeployConfig.length === 0 ? "READY" : "BLOCKED");
console.log("verificationConfig:", missingVerificationConfig.length === 0 ? "READY" : "BLOCKED");
console.log("missingSafe:", missingSafe.length ? missingSafe.join(", ") : "none");
console.log("missingDeploymentConfig:", missingDeployConfig.length ? missingDeployConfig.join(", ") : "none");
console.log("missingVerificationConfig:", missingVerificationConfig.length ? missingVerificationConfig.join(", ") : "none");

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

console.log("readinessReport: PASSED (operator deployment/verification gates may still be blocked)");
