const ETH_ADDRESS=/^0x[a-fA-F0-9]{40}$/;

function requireValue(name){
  const value=String(process.env[name]||"").trim();
  if(!value) throw new Error("Missing internal non-BNB config: "+name);
  return value;
}
function requireAddress(name){
  const value=requireValue(name);
  if(!ETH_ADDRESS.test(value) || /^0x0{40}$/i.test(value)) {
    throw new Error("Invalid internal EVM address: "+name);
  }
  return value.toLowerCase();
}
function mustClosed(name){
  if(String(process.env[name]||"").toLowerCase()==="true") {
    throw new Error("Safety gate must remain CLOSED during non-BNB readiness: "+name);
  }
}

const chainId=requireValue("ATH_CHAIN_ID");
if(chainId!=="97") throw new Error("ATH_CHAIN_ID must remain 97 for BSC Testnet readiness");
requireValue("BSC_TESTNET_RPC");
if(String(process.env.TESTNET_USE_DEPLOYER_ROLES||"").toLowerCase()!=="false") {
  throw new Error("TESTNET_USE_DEPLOYER_ROLES must be false for separate-wallet mode");
}

const miningOwner=requireAddress("MINING_OWNER_ADDRESS");
const miningTreasury=requireAddress("MINING_TREASURY_ADDRESS");
const stakingOwner=requireAddress("STAKING_OWNER_ADDRESS");
const presaleOwner=requireAddress("PRESALE_OWNER_ADDRESS");
const keeper=requireAddress("KEEPER_WALLET_ADDRESS");
const presaleTreasury=requireAddress("PRESALE_WALLET");

const owners=[miningOwner,stakingOwner,presaleOwner];
if(new Set(owners).size!==owners.length) {
  throw new Error("Mining, Staking and Presale owners must remain separate wallets");
}
if(owners.includes(keeper) || keeper===miningTreasury || keeper===presaleTreasury) {
  throw new Error("Keeper wallet must remain separate from owner/treasury roles");
}
if(miningTreasury!==presaleTreasury) {
  throw new Error("Current policy requires Mining Treasury = Presale Treasury");
}

for(const gate of [
  "ALLOW_MAINNET_DEPLOY",
  "MAINNET_AUDIT_PASSED",
  "MAINNET_MULTISIG_CONFIRMED",
  "LIQUIDITY_LOCK_CONFIRMED",
  "RUN_ATH_TESTNET_DEPLOY",
  "TESTNET_DEPLOY_APPROVED",
  "RUN_ATH_POSTDEPLOY_CHECK"
]) mustClosed(gate);

for(const keeperGate of ["RANK_KEEPER_ENABLED","KEEPER_ENABLED"]) {
  if(String(process.env[keeperGate]||"").toLowerCase()==="true") {
    throw new Error(keeperGate+" must remain disabled before verified Testnet contracts");
  }
}

const userDecisionInputs=[
  "PRESALE_PAYMENT_TOKEN",
  "LIQUIDITY_WALLET",
  "STAKING_RESERVE_WALLET",
  "DEVELOPMENT_BENEFICIARY",
  "BSCSCAN_API_KEY"
];
const pendingUserInputs=userDecisionInputs.filter((name)=>!String(process.env[name]||"").trim());

console.log("ATH Non-BNB Readiness");
console.log("internalCodeAndRoleConfig: PASS");
console.log("network: BSC_TESTNET");
console.log("separateAdminWallets: PASS");
console.log("miningTreasuryPolicy: PASS (same destination as Presale Treasury)");
console.log("keeperFailClosed: PASS");
console.log("mainnetFailClosed: PASS");
console.log("pendingUserDecisionInputs:",pendingUserInputs.length?pendingUserInputs.join(", "):"none");
console.log("chainGasDependency: Testnet deployer still requires sufficient tBNB before any chain deployment");
console.log("nonBnbReadiness: PASSED");
