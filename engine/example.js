const { ATHEngine } = require("./athEngine");

async function main() {
  const engine = new ATHEngine({
    rpcUrl: process.env.ATH_RPC_URL,
    miningAddress: process.env.ATH_MINING_ADDRESS,
    tokenAddress: process.env.ATH_TOKEN_ADDRESS,
  });

  console.log(await engine.health());
  console.log(await engine.overview());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
