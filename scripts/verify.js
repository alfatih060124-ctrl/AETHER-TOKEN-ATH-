const hre = require("hardhat");

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

async function main() {
  const token = required("ATH_TOKEN");
  const mining = required("MINING_AIRDROP");
  const teamLock = required("TEAM_TOKEN_LOCK");
  const owner = required("OWNER_ADDRESS");
  const treasury = required("TREASURY_ADDRESS");
  const teamBeneficiary = required("TEAM_BENEFICIARY");
  const teamReleaseAt = Number(required("TEAM_RELEASE_AT"));
  const deployerAddress = required("DEPLOYER_ADDRESS");

  await hre.run("verify:verify", {
    address: token,
    constructorArguments: [deployerAddress],
  });

  await hre.run("verify:verify", {
    address: mining,
    constructorArguments: [token, treasury, owner],
  });

  await hre.run("verify:verify", {
    address: teamLock,
    constructorArguments: [token, teamBeneficiary, teamReleaseAt],
  });

  console.log("Verification complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
