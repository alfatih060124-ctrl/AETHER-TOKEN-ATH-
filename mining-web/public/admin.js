const $=(id)=>document.getElementById(id);

const MINING_ABI=[
  "function owner() view returns (address)",
  "function paused() view returns (bool)",
  "function treasury() view returns (address)",
  "function totalMined() view returns (uint256)",
  "function totalPowerSold() view returns (uint256)",
  "function totalBoosterSold() view returns (uint256)",
  "function totalDoublePowerBoosterSold() view returns (uint256)",
  "function totalMiners() view returns (uint256)",
  "function globalClaimed() view returns (uint256)",
  "function globalBurned() view returns (uint256)",
  "function powerBoosterPrice() view returns (uint256)",
  "function doublePowerBoosterPrice() view returns (uint256)",
  "function outstandingVestingLiability() view returns (uint256)",
  "function contractBalance() view returns (uint256)",
  "function MINING_POOL_ALLOCATION() view returns (uint256)",
  "function setTreasury(address)",
  "function setBoosterPrices(uint256,uint256)",
  "function pause()",
  "function unpause()",
  "function withdrawExcessATH(address,uint256)",
  "event PowerPurchased(address indexed user,address indexed referrer,uint256 timestamp)",
  "event PowerBoosterPurchased(address indexed user,uint256 price,uint256 startsAt,uint256 expiresAt)",
  "event DoublePowerBoosterPurchased(address indexed user,uint256 price,uint256 startsAt,uint256 expiresAt,uint256 referralCount)",
  "event RewardCalculated(address indexed user,uint256 indexed dayId,uint256 baseReward,uint256 referralBonusBps,uint256 boosterMultiplier,uint256 reward,uint256 claimOpensAt,uint256 claimDeadline)",
  "event RewardClaimed(address indexed user,uint256 indexed dayId,uint256 reward,uint256 positionIndex)",
  "event RewardExpired(address indexed user,uint256 indexed dayId,uint256 reward)",
  "event VestingCycleEntered(address indexed user,uint256 indexed positionIndex,uint8 indexed cycle,uint256 incomingAmount,uint256 burnedAmount,uint256 unlock30,uint256 unlock60,uint256 unlock90,uint256 rolloverAmount,uint256 scheduledStart)",
  "event ATHBurned(address indexed user,uint256 indexed positionIndex,uint8 indexed cycle,uint256 amount,uint8 burnType)",
  "event VestingFinalSettled(address indexed user,uint256 indexed positionIndex,uint256 principal,uint256 burned,uint256 distribution,uint256 scheduledAt)",
  "event TreasuryUpdated(address indexed oldTreasury,address indexed newTreasury)"
];
const TOKEN_ABI=[
  "function owner() view returns (address)",
  "function paused() view returns (bool)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function pause()",
  "function unpause()"
];
const LOCK_ABI=[
  "function beneficiary() view returns (address)",
  "function releaseTime() view returns (uint256)"
];
const PRICE_REGISTRY_ADMIN_ABI=[
  "function getPrice() view returns (uint256)",
  "function HOLDER_TARGET() view returns (uint256)",
  "function recordedHolderCount() view returns (uint256)",
  "function priceMode() view returns (uint8)",
  "function officialListingActivated() view returns (bool)"
];
const STAKING_ADMIN_ABI=[
  "function owner() view returns (address)",
  "function paused() view returns (bool)",
  "function principalLiabilityATH() view returns (uint256)",
  "function rewardReserveATH() view returns (uint256)",
  "function totalReferralPaidATH() view returns (uint256)",
  "function totalNetworkPaidATH() view returns (uint256)",
  "function totalRankSalaryPaidATH() view returns (uint256)",
  "function totalRankSalaryPaidUSDT() view returns (uint256)",
  "function pause()",
  "function unpause()"
];
const PRESALE_ADMIN_ABI=[
  "function owner() view returns (address)",
  "function paused() view returns (bool)",
  "function treasury() view returns (address)",
  "function paymentToken() view returns (address)",
  "function currentPriceUSD8() view returns (uint256)",
  "function totalSoldATH() view returns (uint256)",
  "function totalPaymentCollected() view returns (uint256)",
  "function remainingATH() view returns (uint256)",
  "function pause()",
  "function unpause()"
];

let cfg,readProvider,browserProvider,signer,account="",miningRead,tokenRead,miningWrite,tokenWrite,stakingRead,stakingWrite,presaleRead,presaleWrite;
let state={miningOwner:"",tokenOwner:"",stakingOwner:"",presaleOwner:"",miningPaused:false,tokenPaused:false,stakingPaused:false,presalePaused:true};
let toastTimer;

function toast(message,isError=false){
  const el=$("toast"); el.textContent=message; el.classList.toggle("error",isError); el.classList.add("show");
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove("show"),3600);
}
function short(v){return v?`${v.slice(0,6)}…${v.slice(-4)}`:"—"}
function ath(v){try{return `${Number(ethers.formatEther(v)).toLocaleString(undefined,{maximumFractionDigits:3})} ATH`}catch{return "0 ATH"}}
function addr(v){return Boolean(v&&ethers.isAddress(v))}
function mainnetWriteAllowed(){return cfg?.networkMode!=="MAINNET"||cfg?.adminMainnetWritesEnabled===true}
function miningAuthorized(){return account&&state.miningOwner&&account.toLowerCase()===state.miningOwner.toLowerCase()&&mainnetWriteAllowed()}
function tokenAuthorized(){return account&&state.tokenOwner&&account.toLowerCase()===state.tokenOwner.toLowerCase()&&mainnetWriteAllowed()}
function stakingAuthorized(){return account&&state.stakingOwner&&account.toLowerCase()===state.stakingOwner.toLowerCase()&&mainnetWriteAllowed()}
function presaleAuthorized(){return account&&state.presaleOwner&&account.toLowerCase()===state.presaleOwner.toLowerCase()&&mainnetWriteAllowed()}

function paintAccess(){
  const card=$("accessCard");
  card.classList.remove("authorized","denied");
  if(!account){
    $("accessTitle").textContent="Read-only";
    $("accessText").textContent="Connect the contract owner wallet to enable admin actions.";
  }else if(miningAuthorized()||tokenAuthorized()||stakingAuthorized()||presaleAuthorized()){
    card.classList.add("authorized");
    $("accessTitle").textContent="Owner verified";
    $("accessText").textContent=mainnetWriteAllowed()?"Admin transaction controls enabled.":"Mainnet writes remain fail-closed.";
  }else{
    card.classList.add("denied");
    $("accessTitle").textContent="Wallet not authorized";
    $("accessText").textContent="Connected wallet does not match the on-chain owner.";
  }
  $("pauseMiningBtn").disabled=!miningAuthorized()||state.miningPaused;
  $("unpauseMiningBtn").disabled=!miningAuthorized()||!state.miningPaused;
  $("setTreasuryBtn").disabled=!miningAuthorized();
  $("setBoosterPricesBtn").disabled=!miningAuthorized();
  $("withdrawExcessBtn").disabled=!miningAuthorized()||!state.miningPaused||!$("excessAck").checked;
  $("pauseTokenBtn").disabled=!tokenAuthorized()||state.tokenPaused;
  $("unpauseTokenBtn").disabled=!tokenAuthorized()||!state.tokenPaused;
  $("openPresaleBtn").disabled=!presaleAuthorized()||!state.presalePaused;
  $("pausePresaleBtn").disabled=!presaleAuthorized()||state.presalePaused;
}

async function ensureChain(){
  if(!window.ethereum)return;
  const wanted=`0x${Number(cfg.chainId).toString(16)}`;
  const current=await window.ethereum.request({method:"eth_chainId"});
  if(current.toLowerCase()===wanted.toLowerCase())return;
  try{await window.ethereum.request({method:"wallet_switchEthereumChain",params:[{chainId:wanted}]});}
  catch(err){
    if(err?.code!==4902)throw err;
    await window.ethereum.request({method:"wallet_addEthereumChain",params:[{
      chainId:wanted,chainName:cfg.chainName,nativeCurrency:{name:"BNB",symbol:cfg.chainId===97?"tBNB":"BNB",decimals:18},
      rpcUrls:[cfg.rpcUrl],blockExplorerUrls:[cfg.explorerUrl]
    }]});
  }
}

async function connect(){
  if(!window.ethereum){toast("Open this page inside AETHER Wallet or another EVM-compatible wallet.",true);return;}
  try{
    await ensureChain();
    browserProvider=new ethers.BrowserProvider(window.ethereum);
    await browserProvider.send("eth_requestAccounts",[]);
    signer=await browserProvider.getSigner();
    account=await signer.getAddress();
    $("connectBtn").textContent=short(account);
    if(addr(cfg.miningAddress)) miningWrite=new ethers.Contract(cfg.miningAddress,MINING_ABI,signer);
    if(addr(cfg.tokenAddress)) tokenWrite=new ethers.Contract(cfg.tokenAddress,TOKEN_ABI,signer);
    if(addr(cfg.stakingAddress)) stakingWrite=new ethers.Contract(cfg.stakingAddress,STAKING_ADMIN_ABI,signer);
    if(addr(cfg.presaleAddress)) presaleWrite=new ethers.Contract(cfg.presaleAddress,PRESALE_ADMIN_ABI,signer);
    await refresh();
  }catch(err){toast(err?.shortMessage||err?.message||"Wallet connection failed.",true)}
}

async function refresh(){
  $("networkBadge").textContent=cfg?.chainName||"BSC Testnet";
  $("guardrailText").textContent=cfg?.networkMode==="MAINNET"&&!cfg?.adminMainnetWritesEnabled
    ?"Mainnet detected: all admin write buttons are fail-closed until ADMIN_MAINNET_WRITES_ENABLED=true."
    :"Admin writes require the on-chain owner wallet. Contract deployment is not triggered from this page.";

  if(!addr(cfg?.miningAddress)||!addr(cfg?.tokenAddress)){
    $("miningState").textContent="Pending Testnet deploy";
    $("miningAddress").textContent="Contract address not configured";
    paintAccess();
    return;
  }

  try{
    readProvider=new ethers.JsonRpcProvider(cfg.rpcUrl,cfg.chainId);
    miningRead=new ethers.Contract(cfg.miningAddress,MINING_ABI,readProvider);
    tokenRead=new ethers.Contract(cfg.tokenAddress,TOKEN_ABI,readProvider);
    const [
      miningOwner,miningPaused,treasury,totalMined,totalPower,totalBooster,totalDouble,totalMiners,
      liability,reserve,burned,powerBoosterPrice,doubleBoosterPrice,
      tokenOwner,tokenPaused,totalSupply
    ]=await Promise.all([
      miningRead.owner(),miningRead.paused(),miningRead.treasury(),miningRead.totalMined(),
      miningRead.totalPowerSold(),miningRead.totalBoosterSold(),miningRead.totalDoublePowerBoosterSold(),
      miningRead.totalMiners(),miningRead.outstandingVestingLiability(),miningRead.contractBalance(),
      miningRead.globalBurned(),miningRead.powerBoosterPrice(),miningRead.doublePowerBoosterPrice(),
      tokenRead.owner(),tokenRead.paused(),tokenRead.totalSupply()
    ]);
    state={...state,miningOwner,tokenOwner,miningPaused,tokenPaused};
    $("miningState").textContent="Connected";
    $("miningAddress").textContent=short(cfg.miningAddress);
    $("miningPause").textContent=miningPaused?"PAUSED":"ACTIVE";
    $("tokenPause").textContent=tokenPaused?"PAUSED":"ACTIVE";
    $("totalMiners").textContent=Number(totalMiners).toLocaleString();
    $("totalMined").textContent=ath(totalMined);
    $("liability").textContent=ath(liability);
    $("reserve").textContent=ath(reserve);
    $("sales").textContent=Number(totalPower).toLocaleString()+" / "+Number(totalBooster).toLocaleString()+" / "+Number(totalDouble).toLocaleString();
    $("globalBurned").textContent=ath(burned);
    $("powerBoosterPriceCurrent").textContent=ethers.formatEther(powerBoosterPrice)+" BNB";
    $("doubleBoosterPriceCurrent").textContent=ethers.formatEther(doubleBoosterPrice)+" BNB";
    $("powerBoosterPriceInput").placeholder=ethers.formatEther(powerBoosterPrice);
    $("doubleBoosterPriceInput").placeholder=ethers.formatEther(doubleBoosterPrice);
    $("miningOwner").textContent=miningOwner;
    $("tokenOwner").textContent=tokenOwner;
    $("treasury").textContent=treasury;
    $("totalSupply").textContent=ath(totalSupply);

    if(addr(cfg.teamLockAddress)){
      $("lockAddress").textContent=cfg.teamLockAddress;
      const lock=new ethers.Contract(cfg.teamLockAddress,LOCK_ABI,readProvider);
      const [beneficiary,releaseTime,teamBalance]=await Promise.all([
        lock.beneficiary(),lock.releaseTime(),tokenRead.balanceOf(cfg.teamLockAddress)
      ]);
      $("beneficiary").textContent=beneficiary;
      $("teamBalance").textContent=ath(teamBalance);
      $("releaseTime").textContent=new Date(Number(releaseTime)*1000).toLocaleString();
    }else{
      $("lockAddress").textContent="Pending Testnet deploy";
      $("beneficiary").textContent=cfg.teamBeneficiary||"Pending";
    }

    await refreshUnifiedModules();
    paintAccess();
    await loadActivity();
  }catch(err){console.error(err);toast("Unable to read ATH contracts from the configured network.",true)}
}

async function refreshUnifiedModules(){
  if(!readProvider)return;
  if(addr(cfg?.priceRegistryAddress)){
    try{
      const registry=new ethers.Contract(cfg.priceRegistryAddress,PRICE_REGISTRY_ADMIN_ABI,readProvider);
      const [price,target,count,mode,listed]=await Promise.all([registry.getPrice(),registry.HOLDER_TARGET(),registry.recordedHolderCount(),registry.priceMode(),registry.officialListingActivated()]);
      $("registryPrice").textContent="$"+(Number(price)/1e8).toFixed(4);
      $("registryMode").textContent=Number(mode)===0?"PRESALE-LINKED":"MARKET";
      $("holderGate").textContent=Number(count).toLocaleString()+" / "+Number(target).toLocaleString();
      $("listingState").textContent=listed?"Official listing active":Math.max(0,Number(target)-Number(count)).toLocaleString()+" holders remaining";
    }catch(err){console.error("registry admin",err)}
  }
  if(addr(cfg?.stakingAddress)){
    try{
      stakingRead=new ethers.Contract(cfg.stakingAddress,STAKING_ADMIN_ABI,readProvider);
      const [owner,paused,principal,rewardReserve,referralPaid,networkPaid,rankPaidAth,rankPaidUsd]=await Promise.all([
        stakingRead.owner(),stakingRead.paused(),stakingRead.principalLiabilityATH(),stakingRead.rewardReserveATH(),
        stakingRead.totalReferralPaidATH(),stakingRead.totalNetworkPaidATH(),stakingRead.totalRankSalaryPaidATH(),stakingRead.totalRankSalaryPaidUSDT()
      ]);
      state.stakingOwner=owner; state.stakingPaused=paused;
      $("stakingState").textContent="Connected";
      $("stakingAddress").textContent=short(cfg.stakingAddress);
      $("stakingPrincipal").textContent=ath(principal);
      $("stakingRewardReserve").textContent=ath(rewardReserve);
      $("rankSalaryPaid").textContent="$"+Number(ethers.formatEther(rankPaidUsd)).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
      $("rankSalaryPaidAth").textContent=ath(rankPaidAth);
      $("stakingOwner").textContent=owner;
      $("stakingPause").textContent=paused?"PAUSED":"ACTIVE";
      $("stakingReserveDetail").textContent=ath(rewardReserve);
      $("stakingReferralPaid").textContent=ath(referralPaid);
      $("stakingNetworkPaid").textContent=ath(networkPaid);
      $("stakingRankPaidDetail").textContent="$"+Number(ethers.formatEther(rankPaidUsd)).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})+" / "+ath(rankPaidAth);
    }catch(err){console.error("staking admin",err)}
  }
  if(addr(cfg?.presaleAddress)){
    try{
      presaleRead=new ethers.Contract(cfg.presaleAddress,PRESALE_ADMIN_ABI,readProvider);
      const [owner,paused,treasury,paymentToken,price,sold,collected,remaining]=await Promise.all([
        presaleRead.owner(),presaleRead.paused(),presaleRead.treasury(),presaleRead.paymentToken(),
        presaleRead.currentPriceUSD8(),presaleRead.totalSoldATH(),presaleRead.totalPaymentCollected(),presaleRead.remainingATH()
      ]);
      state.presaleOwner=owner; state.presalePaused=paused;
      $("presaleState").textContent=paused?"PAUSED":"OPEN";
      $("presaleAddress").textContent=short(cfg.presaleAddress);
      $("presalePrice").textContent="$"+(Number(price)/1e8).toFixed(3);
      $("presaleProgress").textContent=Number(ethers.formatEther(sold)).toLocaleString(undefined,{maximumFractionDigits:0})+" / 30,000,000 ATH";
      $("presaleOwner").textContent=owner;
      $("presaleTreasury").textContent=treasury;
      $("presalePaymentToken").textContent=paymentToken;
      $("presaleSoldAdmin").textContent=ath(sold);
      $("presaleRemainingAdmin").textContent=ath(remaining);
      $("presaleCollectedAdmin").textContent=collected.toString()+" payment units";
    }catch(err){console.error("presale admin",err)}
  }
  paintAccess();
}

async function runTx(label,fn){
  try{
    toast(`${label}: confirm in your wallet.`);
    const tx=await fn();
    toast(`${label}: submitted ${short(tx.hash)}`);
    await tx.wait();
    toast(`${label}: confirmed.`);
    await refresh();
  }catch(err){toast(err?.shortMessage||err?.reason||err?.message||`${label} failed.`,true)}
}

async function loadActivity(){
  const box=$("activity");
  if(!miningRead){return}
  try{
    const latest=await readProvider.getBlockNumber();
    const from=Math.max(0,latest-2500);
    const defs=[
      ["Power",miningRead.filters.PowerPurchased()],
      ["Power Booster",miningRead.filters.PowerBoosterPurchased()],
      ["Double Power",miningRead.filters.DoublePowerBoosterPurchased()],
      ["Reward Calculated",miningRead.filters.RewardCalculated()],
      ["Reward Claimed",miningRead.filters.RewardClaimed()],
      ["Reward Expired",miningRead.filters.RewardExpired()],
      ["Vesting Cycle",miningRead.filters.VestingCycleEntered()],
      ["ATH Burned",miningRead.filters.ATHBurned()],
      ["Final Settlement",miningRead.filters.VestingFinalSettled()],
      ["Treasury",miningRead.filters.TreasuryUpdated()]
    ];
    const groups=await Promise.all(defs.map(async([label,filter])=>(await miningRead.queryFilter(filter,from,latest)).map(e=>({label,e}))));
    const events=groups.flat().sort((a,b)=>b.e.blockNumber-a.e.blockNumber).slice(0,20);
    if(!events.length){box.innerHTML='<div class="empty">No recent ATH Mining events in the latest 2,500 blocks.</div>';return}
    box.innerHTML=events.map(({label,e})=>`<div class="event"><strong>${label}</strong><code>${e.transactionHash}</code><small>Block ${e.blockNumber}</small></div>`).join("");
  }catch(err){console.error(err);box.innerHTML='<div class="empty">Event history is temporarily unavailable; contract metrics remain readable.</div>'}
}

async function boot(){
  cfg=await fetch("/config",{cache:"no-store"}).then(r=>r.json());
  $("networkBadge").textContent=cfg.chainName;
  $("connectBtn").addEventListener("click",connect);
  $("refreshBtn").addEventListener("click",refresh);
  $("pauseMiningBtn").addEventListener("click",()=>runTx("Pause Mining",()=>miningWrite.pause()));
  $("unpauseMiningBtn").addEventListener("click",()=>runTx("Unpause Mining",()=>miningWrite.unpause()));
  $("pauseTokenBtn").addEventListener("click",()=>runTx("Pause ATH",()=>tokenWrite.pause()));
  $("unpauseTokenBtn").addEventListener("click",()=>runTx("Unpause ATH",()=>tokenWrite.unpause()));
  $("pauseStakingBtn").addEventListener("click",()=>runTx("Pause Staking",()=>stakingWrite.pause()));
  $("unpauseStakingBtn").addEventListener("click",()=>runTx("Unpause Staking",()=>stakingWrite.unpause()));
  $("openPresaleBtn").addEventListener("click",()=>runTx("Open Presale",()=>presaleWrite.unpause()));
  $("pausePresaleBtn").addEventListener("click",()=>runTx("Pause Presale",()=>presaleWrite.pause()));
  $("setTreasuryBtn").addEventListener("click",()=>{
    const v=$("treasuryInput").value.trim();
    if(!ethers.isAddress(v)||v===ethers.ZeroAddress)return toast("Enter a valid non-zero treasury address.",true);
    return runTx("Update Treasury",()=>miningWrite.setTreasury(v));
  });
  $("setBoosterPricesBtn").addEventListener("click",()=>{
    const powerRaw=$("powerBoosterPriceInput").value.trim()||$("powerBoosterPriceInput").placeholder;
    const doubleRaw=$("doubleBoosterPriceInput").value.trim()||$("doubleBoosterPriceInput").placeholder;
    let powerPrice,doublePrice;
    try{
      powerPrice=ethers.parseEther(powerRaw);
      doublePrice=ethers.parseEther(doubleRaw);
    }catch{
      return toast("Enter valid BNB prices for both boosters.",true);
    }
    if(powerPrice<=0n||doublePrice<=0n)return toast("Booster prices must be greater than zero.",true);
    return runTx("Update Booster Prices",()=>miningWrite.setBoosterPrices(powerPrice,doublePrice));
  });
  $("excessAck").addEventListener("change",paintAccess);
  $("withdrawExcessBtn").addEventListener("click",()=>{
    const recipient=$("excessRecipient").value.trim();
    const raw=$("excessAmount").value.trim();
    if(!ethers.isAddress(recipient)||recipient===ethers.ZeroAddress)return toast("Enter a valid recovery recipient.",true);
    let amount; try{amount=ethers.parseEther(raw)}catch{return toast("Enter a valid ATH amount.",true)}
    if(amount<=0n)return toast("ATH amount must be greater than zero.",true);
    return runTx("Recover Excess ATH",()=>miningWrite.withdrawExcessATH(recipient,amount));
  });
  if(window.ethereum){
    window.ethereum.on?.("accountsChanged",async(accounts)=>{
      if(!accounts?.length){account="";signer=null;miningWrite=null;tokenWrite=null;stakingWrite=null;presaleWrite=null;$("connectBtn").textContent="Connect Admin Wallet";paintAccess();return}
      await connect();
    });
    window.ethereum.on?.("chainChanged",()=>window.location.reload());
  }
  await refresh();
}

boot().catch(err=>{console.error(err);toast("Unable to initialize ATH Control Panel.",true)});