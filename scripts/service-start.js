const { spawnSync, spawn } = require("child_process");

function runSync(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}

if (process.env.RUN_ATH_TESTNET_DEPLOY === "true") {
  console.log("RUN_ATH_TESTNET_DEPLOY=true: executing gated one-shot Testnet deployment.");
  runSync("npm", ["run", "deploy:once:testnet"]);
} else if (process.env.RUN_ATH_TESTNET_PREFLIGHT === "true") {
  console.log("RUN_ATH_TESTNET_PREFLIGHT=true: executing Testnet preflight only.");
  runSync("npm", ["run", "preflight:testnet"]);
} else if (process.env.RUN_ATH_POSTDEPLOY_CHECK === "true") {
  console.log("RUN_ATH_POSTDEPLOY_CHECK=true: executing Testnet post-deployment invariant checks.");
  runSync("npm", ["run", "postdeploy:testnet"]);
}

const child = spawn(process.execPath, ["scripts/ci-server.js"], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => process.exit(code ?? 0));
