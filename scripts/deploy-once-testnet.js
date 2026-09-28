const { spawnSync } = require("child_process");

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
  "ATH_TEAM_LOCK_ADDRESS",
].filter((name) => process.env[name]);

if (existing.length > 0) {
  fail(
    "ATH Testnet deploy blocked: deployed contract variables already exist (" +
      existing.join(", ") +
      "). Refusing to create a second deployment."
  );
}

console.log("ATH one-shot Testnet deployment gate OPEN.");
console.log("Running preflight first; no private key will be printed.");

run("npm", ["run", "preflight:testnet"]);

console.log("Preflight passed. Starting BSC Testnet deployment.");
run("npm", ["run", "deploy:testnet"]);

console.log("ATH one-shot BSC Testnet deployment completed.");
console.log("Capture contract addresses from deployment output, then set ATH_TOKEN_ADDRESS, ATH_MINING_ADDRESS and ATH_TEAM_LOCK_ADDRESS.");
console.log("After addresses are stored, set TESTNET_DEPLOY_APPROVED=false.");
