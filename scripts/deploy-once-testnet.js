const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function fail(message) {
  console.error(message);
  process.exit(1);
}

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    fail(`Command failed: ${command} ${args.join(" ")}`);
  }
}

if (process.env.TESTNET_DEPLOY_APPROVED !== "true") {
  fail("ATH Testnet deploy blocked: TESTNET_DEPLOY_APPROVED=true is required");
}

if (!process.env.PRIVATE_KEY) {
  fail("ATH Testnet deploy blocked: PRIVATE_KEY is missing");
}

const existing = [
  "ATH_TOKEN_ADDRESS",
  "ATH_MINING_ADDRESS",
  "ATH_STAKING_ADDRESS",
  "ATH_STAKING_ORACLE_ADDRESS",
  "ATH_DEVELOPMENT_VESTING_ADDRESS",
].filter((name) => process.env[name]);

if (existing.length > 0) {
  fail(
    "ATH Testnet deploy blocked: deployed contract variables already exist (" +
      existing.join(", ") +
      "). Refusing to create a second deployment."
  );
}

console.log("ATH one-shot Testnet deployment gate OPEN.");
console.log("Validating exact ATH Mining v3.3 source before any deployment transaction.");

run("npm", ["run", "source:selfcheck"]);
run("npm", ["run", "syntax:check"]);
run("npm", ["run", "compile"]);
run("npm", ["test"]);
run("npm", ["run", "abi:export"]);

console.log("Source validation passed. Running BSC Testnet preflight; no private key will be printed.");
run("npm", ["run", "preflight:testnet"]);

console.log("Preflight passed. Starting BSC Testnet deployment.");
run("npm", ["run", "deploy:testnet"]);

const manifestPath = path.join(__dirname, "..", "deployments", "bscTestnet.json");
if (!fs.existsSync(manifestPath)) {
  fail("Deployment finished without deployments/bscTestnet.json manifest");
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
if (manifest.engineVersion !== "3.3.0" || manifest.stakingVersion !== "1.0.0") {
  fail(
    "Unexpected deployment manifest versions: mining=" +
      String(manifest.engineVersion) +
      ", staking=" +
      String(manifest.stakingVersion)
  );
}

const contracts = manifest.contracts || {};
for (const name of [
  "ATH_TOKEN_ADDRESS",
  "ATH_MINING_ADDRESS",
  "ATH_STAKING_ADDRESS",
  "ATH_STAKING_ORACLE_ADDRESS",
  "ATH_DEVELOPMENT_VESTING_ADDRESS",
]) {
  if (!contracts[name]) fail("Deployment manifest missing " + name);
  process.env[name] = contracts[name];
}
process.env.DEPLOYER_ADDRESS = manifest.deployer;

console.log("Deployment transactions confirmed. Running Mining v3.3 + Staking v1 post-deploy invariants.");
run("npm", ["run", "postdeploy:testnet"]);

console.log("ATH one-shot BSC Testnet Mining v3.3 + Staking v1 deployment + postdeploy verification PASSED.");
console.log("Persist the verified addresses from deployments/bscTestnet.json, then restore TESTNET_DEPLOY_APPROVED=false.");