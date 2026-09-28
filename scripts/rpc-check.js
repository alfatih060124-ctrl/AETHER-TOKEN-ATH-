const { ethers } = require("ethers");

async function main() {
  const rpcUrl = process.env.BSC_TESTNET_RPC;
  if (!rpcUrl) throw new Error("Missing required env: BSC_TESTNET_RPC");

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);

  if (chainId !== 97) {
    throw new Error(`Wrong BSC Testnet chain: expected 97, got ${chainId}`);
  }

  const [blockNumber, feeData] = await Promise.all([
    provider.getBlockNumber(),
    provider.getFeeData(),
  ]);

  if (!Number.isInteger(blockNumber) || blockNumber <= 0) {
    throw new Error("BSC Testnet RPC returned an invalid block number");
  }

  console.log("BSC Testnet RPC check PASSED");
  console.log("chainId:", chainId);
  console.log("latestBlock:", blockNumber);
  console.log("gasPriceWei:", feeData.gasPrice ? feeData.gasPrice.toString() : "unavailable");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
