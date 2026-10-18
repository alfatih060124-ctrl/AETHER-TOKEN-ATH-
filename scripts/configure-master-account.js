const hre = require("hardhat");

const MASTER_ACCOUNT = "0x240086965A9ED9672c649aC0538F049f14270112";

async function main() {
  const stakingAddress = process.env.ATH_STAKING_ADDRESS;
  if (!stakingAddress || !hre.ethers.isAddress(stakingAddress) || stakingAddress === hre.ethers.ZeroAddress) {
    throw new Error("Set ATH_STAKING_ADDRESS to the deployed ATHStaking contract address.");
  }
  const network = await hre.ethers.provider.getNetwork();
  if (network.chainId !== 97n && network.chainId !== 31337n) {
    throw new Error("Master setup is restricted to BSC Testnet or local Hardhat only. Mainnet setup requires a separate reviewed procedure.");
  }
  const [signer] = await hre.ethers.getSigners();
  if (!signer) throw new Error("No signer configured.");
  const staking = await hre.ethers.getContractAt("ATHStaking", stakingAddress, signer);
  const owner = await staking.owner();
  if (owner.toLowerCase() !== signer.address.toLowerCase()) {
    throw new Error("Configured signer is not the Staking contract owner.");
  }
  if (!(await staking.paused())) throw new Error("Staking must remain paused during Master setup.");
  const existing = await staking.masterAccount();
  if (existing !== hre.ethers.ZeroAddress) {
    if (existing.toLowerCase() !== MASTER_ACCOUNT.toLowerCase()) {
      throw new Error("A different Master account is already configured; refusing to overwrite.");
    }
    console.log("Master account already configured:", existing);
  } else {
    const tx = await staking.setMasterAccount(MASTER_ACCOUNT);
    console.log("Master setup transaction:", tx.hash);
    await tx.wait();
    console.log("Master account configured:", await staking.masterAccount());
  }
  const registered = await staking.isMemberRegistered(MASTER_ACCOUNT);
  const rank = await staking.rankInfo(MASTER_ACCOUNT);
  if (!registered || Number(rank.highestRank) !== 8) {
    throw new Error("Master verification failed: registration or Rank 8 is missing.");
  }
  console.log("Verified: Master is registered, Rank 8, and Staking remains paused.");
  console.log("Master referral URL format: https://mining.aether.boats/?page=member&ref=" + MASTER_ACCOUNT);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
