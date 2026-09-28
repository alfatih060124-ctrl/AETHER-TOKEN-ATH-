const hre = require("hardhat");

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

async function main() {
  if (!process.env.PRIVATE_KEY) {
    throw new Error("Missing required env: PRIVATE_KEY");
  }

  if (hre.network.name === "bscMainnet") {
    const requiredMainnetGates = [
      "ALLOW_MAINNET_DEPLOY",
      "MAINNET_AUDIT_PASSED",
      "MAINNET_MULTISIG_CONFIRMED",
      "LIQUIDITY_LOCK_CONFIRMED",
    ];
    for (const gate of requiredMainnetGates) {
      if (process.env[gate] !== "true") {
        throw new Error(`Mainnet blocked: ${gate}=true is required`);
      }
    }
  }

  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) throw new Error("No deployer signer available");
  const owner = required("OWNER_ADDRESS");
  const treasury = required("TREASURY_ADDRESS");
  const liquidityWallet = process.env.LIQUIDITY_WALLET || owner;
  const teamBeneficiary = required("TEAM_BENEFICIARY");
  const marketingWallet = process.env.MARKETING_WALLET || owner;
  const teamLockDays = Number(required("TEAM_LOCK_DAYS"));

  if (!Number.isFinite(teamLockDays) || teamLockDays < 365 || teamLockDays > 550) {
    throw new Error("TEAM_LOCK_DAYS must be 365-550 days (blueprint: 12-18 months)");
  }

  console.log("Network          :", hre.network.name);
  console.log("Deployer         :", deployer.address);
  console.log("Owner / multisig :", owner);
  console.log("Treasury         :", treasury);
  console.log("Liquidity wallet :", liquidityWallet);
  console.log("Team beneficiary :", teamBeneficiary);
  console.log("Marketing wallet :", marketingWallet);
  console.log("Team lock days   :", teamLockDays);

  const ATHToken = await hre.ethers.getContractFactory("ATHToken");
  const token = await ATHToken.deploy(deployer.address);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();

  const MiningAirdrop = await hre.ethers.getContractFactory("MiningAirdrop");
  const mining = await MiningAirdrop.deploy(tokenAddress, treasury, owner);
  await mining.waitForDeployment();
  const miningAddress = await mining.getAddress();

  const TeamTokenLock = await hre.ethers.getContractFactory("TeamTokenLock");
  const releaseTime = Math.floor(Date.now() / 1000) + teamLockDays * 24 * 60 * 60;
  const teamLock = await TeamTokenLock.deploy(tokenAddress, teamBeneficiary, releaseTime);
  await teamLock.waitForDeployment();
  const teamLockAddress = await teamLock.getAddress();

  const miningAllocation = hre.ethers.parseUnits("700000000", 18);
  const liquidityAllocation = hre.ethers.parseUnits("200000000", 18);
  const teamAllocation = hre.ethers.parseUnits("50000000", 18);
  const marketingAllocation = hre.ethers.parseUnits("50000000", 18);

  await (await token.transfer(miningAddress, miningAllocation)).wait();
  await (await token.transfer(liquidityWallet, liquidityAllocation)).wait();
  await (await token.transfer(teamLockAddress, teamAllocation)).wait();
  await (await token.transfer(marketingWallet, marketingAllocation)).wait();

  const remaining = await token.balanceOf(deployer.address);
  if (remaining !== 0n) throw new Error(`Unexpected deployer ATH balance: ${remaining}`);

  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    await (await token.transferOwnership(owner)).wait();
  }

  console.log("\n========== ATH DEPLOYMENT ==========");
  console.log("ATH_TOKEN       =", tokenAddress);
  console.log("MINING_AIRDROP  =", miningAddress);
  console.log("TEAM_TOKEN_LOCK =", teamLockAddress);
  console.log("TEAM_RELEASE_AT =", releaseTime);
  console.log("====================================");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
