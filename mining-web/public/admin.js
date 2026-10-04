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
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
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
  "function networkReserveATH() view returns (uint256)",
  "function totalRewardFundedATH() view returns (uint256)",
  "function totalNetworkFundedATH() view returns (uint256)",
  "function MAX_REWARD_POOL() view returns (uint256)",
  "function MAX_NETWORK_MARKETING_POOL() view returns (uint256)",
  "function DAILY_REWARD_UTC_OFFSET() view returns (uint256)",
  "function totalReferralPaidATH() view returns (uint256)",
  "function totalNetworkPaidATH() view returns (uint256)",
  "function totalRankSponsorPaidATH() view returns (uint256)",
  "function rankSponsorBonusBps(uint256) view returns (uint256)",
  "function totalRankSalaryPaidATH() view returns (uint256)",
  "function totalRankSalaryPaidUSDT() view returns (uint256)",
  "function totalWeeklyRankSalaryUSDT() view returns (uint256)",
  "function activeDailyRewardRunRateUSDT() view returns (uint256)",
  "function rewardReserveRunwayDays() view returns (uint256)",
  "function rankSalaryRunwayWeeks() view returns (uint256)",
  "function packageCount() view returns (uint256)",
  "function packages(uint256) view returns (uint256 minUSDT,uint256 maxUSDT,uint256 dailyRateBps,uint256 lockDays,bool active)",
  "function updatePackage(uint256,uint256,uint256,uint256,uint256,bool)",
  "function addPackage(uint256,uint256,uint256,uint256)",
  "function fundRewards(uint256)",
  "function fundNetworkReserve(uint256)",
  "function totalRankMembers() view returns (uint256)",
  "function getRankMembers(uint256,uint256) view returns (address[] result)",
  "function rankInfo(address) view returns (uint8 highestRank,uint64 firstRankAchievedAt,uint64 nextPayoutAt,uint256 totalSalaryPaidUSDT,uint256 totalSalaryPaidATH)",
  "function rankSalaryPreview(address) view returns (uint8 highestRank,uint8 payableRankNow,uint256 periodsDue,uint256 salaryUSDT,uint256 salaryATH,uint256 nextPayoutAt,uint256 smallLegTurnover,uint256 sponsors)",
  "function processRankSalary(address)",
  "function totalDirectLegs(address) view returns (uint256)",
  "function getDirectLegMembers(address,uint256,uint256) view returns (address[] result)",
  "function legTurnoverUSDT(address,address) view returns (uint256)",
  "function getSmallLegTurnoverUSDT(address) view returns (uint256 totalTurnover,uint256 largestTurnover,uint256 smallLegTurnover,address bigLeg)",
  "function totalRankSalaryPayments() view returns (uint256)",
  "function getRankSalaryPayments(uint256,uint256) view returns ((address account,uint8 payableRank,uint64 paidAt,uint16 periodsPaid,uint256 salaryUSDT,uint256 salaryATH,uint256 priceUSD8,uint256 nextPayoutAt)[] result)",
  "function MAX_RANK_HISTORY_PAGE() view returns (uint256)",
  "event RankSalaryPaid(address indexed account,uint8 indexed payableRank,uint256 periodsPaid,uint256 salaryUSDT,uint256 salaryATH,uint256 priceUSD8,uint256 nextPayoutAt)",
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
let state={miningOwner:"",tokenOwner:"",stakingOwner:"",presaleOwner:"",miningPaused:false,tokenPaused:false,stakingPaused:false,presalePaused:true,rewardFundingRemaining:0n,networkFundingRemaining:0n};
let toastTimer;
let rankPage=0;
const rankPageSize=25;
let selectedLegAccount="";
let legPage=0;
const legPageSize=50;
let rankHistoryPage=0;
const rankHistoryPageSize=25;

function toast(message,isError=false){
  const el=$("toast"); el.textContent=message; el.classList.toggle("error",isError); el.classList.add("show");
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove("show"),3600);
}
function short(v){return v?`${v.slice(0,6)}…${v.slice(-4)}`:"—"}
function ath(v){try{return `${Number(ethers.formatEther(v)).toLocaleString(undefined,{maximumFractionDigits:3})} ATH`}catch{return "0 ATH"}}
function usd(v){try{return "$"+Number(ethers.formatEther(v)).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}catch{return "$0.00"}}
function runway(v,unit){try{return v===ethers.MaxUint256?"∞":Number(v).toLocaleString()+" "+unit}catch{return "—"}}
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
  $("pauseStakingBtn").disabled=!stakingAuthorized()||state.stakingPaused;
  $("unpauseStakingBtn").disabled=!stakingAuthorized()||!state.stakingPaused;
  $("fundRewardBtn").disabled=!stakingAuthorized()||state.rewardFundingRemaining<=0n;
  $("fundNetworkBtn").disabled=!stakingAuthorized()||state.networkFundingRemaining<=0n;
  $("updatePackageBtn").disabled=!stakingAuthorized();
  $("addPackageBtn").disabled=!stakingAuthorized();
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
      const [owner,paused,principal,rewardReserve,networkReserve,rewardFunded,networkFunded,rewardCap,networkCap,referralPaid,networkPaid,rankSponsorPaid,rankPaidAth,rankPaidUsd,dailyRunRate,weeklyRankLiability,rewardRunway,rankRunway]=await Promise.all([
        stakingRead.owner(),stakingRead.paused(),stakingRead.principalLiabilityATH(),stakingRead.rewardReserveATH(),stakingRead.networkReserveATH(),
        stakingRead.totalRewardFundedATH(),stakingRead.totalNetworkFundedATH(),stakingRead.MAX_REWARD_POOL(),stakingRead.MAX_NETWORK_MARKETING_POOL(),
        stakingRead.totalReferralPaidATH(),stakingRead.totalNetworkPaidATH(),stakingRead.totalRankSponsorPaidATH(),stakingRead.totalRankSalaryPaidATH(),stakingRead.totalRankSalaryPaidUSDT(),
        stakingRead.activeDailyRewardRunRateUSDT(),stakingRead.totalWeeklyRankSalaryUSDT(),stakingRead.rewardReserveRunwayDays(),stakingRead.rankSalaryRunwayWeeks()
      ]);
      state.stakingOwner=owner; state.stakingPaused=paused;
      state.rewardFundingRemaining=rewardCap>rewardFunded?rewardCap-rewardFunded:0n;
      state.networkFundingRemaining=networkCap>networkFunded?networkCap-networkFunded:0n;
      $("stakingState").textContent="Connected";
      $("stakingAddress").textContent=short(cfg.stakingAddress);
      $("stakingPrincipal").textContent=ath(principal);
      $("stakingRewardReserve").textContent=ath(rewardReserve);
      $("stakingNetworkReserve").textContent=ath(networkReserve);
      $("rankSalaryPaid").textContent=usd(rankPaidUsd);
      $("rankSalaryPaidAth").textContent=ath(rankPaidAth);
      $("stakingOwner").textContent=owner;
      $("stakingPause").textContent=paused?"PAUSED":"ACTIVE";
      $("stakingReserveDetail").textContent=ath(rewardReserve);
      $("stakingNetworkReserveDetail").textContent=ath(networkReserve);
      $("stakingReferralPaid").textContent=ath(referralPaid);
      $("stakingRankSponsorPaid").textContent=ath(rankSponsorPaid);
      $("rankSponsorPaid").textContent=ath(rankSponsorPaid);
      $("stakingNetworkPaid").textContent=ath(networkPaid);
      $("stakingRankPaidDetail").textContent=usd(rankPaidUsd)+" / "+ath(rankPaidAth);
      $("rewardFundingState").textContent=ath(rewardFunded)+" / 160,000,000 ATH";
      $("networkFundingState").textContent=ath(networkFunded)+" / 50,000,000 ATH";
      $("dailyRunRate").textContent=usd(dailyRunRate)+"/day";
      $("rewardRunway").textContent=runway(rewardRunway,"days");
      $("rankWeeklyLiability").textContent=usd(weeklyRankLiability)+"/week";
      $("rankRunway").textContent=runway(rankRunway,"weeks");
      const rankSponsorRates=await Promise.all(Array.from({length:8},(_,i)=>stakingRead.rankSponsorBonusBps(i)));
      $("rankSponsorRates").textContent=rankSponsorRates.map(v=>(Number(v)/100).toFixed(0)+"%").join(" · ");
      await Promise.all([loadPackageList(),loadRankDashboard(),loadRankHistory()]);
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


async function ensureStakingAllowance(amount){
  if(!tokenRead||!tokenWrite||!account)throw new Error("Connect owner wallet first.");
  const current=await tokenRead.allowance(account,cfg.stakingAddress);
  if(current>=amount)return;
  toast("ATH approval: confirm in your wallet.");
  const tx=await tokenWrite.approve(cfg.stakingAddress,amount);
  await tx.wait();
}

async function fundStakingReserve(kind){
  if(!stakingAuthorized())return toast("Connect the Staking owner wallet.",true);
  const input=kind==="reward"?$("rewardFundAmount"):$("networkFundAmount");
  let amount;try{amount=ethers.parseEther(input.value.trim())}catch{return toast("Enter a valid ATH funding amount.",true)}
  if(amount<=0n)return toast("Funding amount must be greater than zero.",true);
  const remaining=kind==="reward"?state.rewardFundingRemaining:state.networkFundingRemaining;
  if(amount>remaining)return toast("Amount exceeds the remaining fixed tokenomic allocation.",true);
  try{
    await ensureStakingAllowance(amount);
    await runTx(kind==="reward"?"Fund Daily Reward Reserve":"Fund Marketing / Network Reserve",()=>kind==="reward"?stakingWrite.fundRewards(amount):stakingWrite.fundNetworkReserve(amount));
    input.value="";
  }catch(err){toast(err?.shortMessage||err?.reason||err?.message||"Funding failed.",true)}
}

async function loadPackageList(){
  if(!stakingRead)return;
  const count=Number(await stakingRead.packageCount());
  const rows=await Promise.all(Array.from({length:count},(_,i)=>stakingRead.packages(i).then(p=>({i,p}))));
  $("packageList").innerHTML=rows.length?rows.map(({i,p})=>{
    const max=p.maxUSDT===ethers.MaxUint256?"∞":usd(p.maxUSDT);
    return '<div class="admin-list-row"><div><strong>#'+i+' · '+(p.active?"ACTIVE":"INACTIVE")+'</strong><small>'+usd(p.minUSDT)+' – '+max+' · '+(Number(p.dailyRateBps)/100).toFixed(2)+'%/day · '+Number(p.lockDays)+'d</small></div><button class="btn package-load" data-id="'+i+'">Load</button></div>';
  }).join(""):'<div class="empty">No Staking packages.</div>';
  document.querySelectorAll(".package-load").forEach(btn=>btn.addEventListener("click",()=>loadPackageEditor(Number(btn.dataset.id))));
}

async function loadPackageEditor(idOverride){
  if(!stakingRead)return toast("Staking contract is not configured.",true);
  const id=Number.isInteger(idOverride)?idOverride:Number($("packageIdInput").value);
  if(!Number.isInteger(id)||id<0)return toast("Enter a valid package ID.",true);
  try{
    const p=await stakingRead.packages(id);
    $("packageIdInput").value=String(id);
    $("packageMinInput").value=ethers.formatEther(p.minUSDT);
    $("packageMaxInput").value=p.maxUSDT===ethers.MaxUint256?"":ethers.formatEther(p.maxUSDT);
    $("packageMaxInput").placeholder=p.maxUSDT===ethers.MaxUint256?"MAX / unlimited":"Maximum USD";
    $("packageRateInput").value=(Number(p.dailyRateBps)/100).toFixed(2);
    $("packageLockInput").value=String(Number(p.lockDays));
    $("packageActiveInput").checked=Boolean(p.active);
  }catch(err){toast(err?.shortMessage||err?.message||"Package not found.",true)}
}

function packageForm(){
  const min=ethers.parseEther($("packageMinInput").value.trim());
  const maxRaw=$("packageMaxInput").value.trim();
  const max=maxRaw?ethers.parseEther(maxRaw):ethers.MaxUint256;
  const pct=Number($("packageRateInput").value);
  const rate=BigInt(Math.round(pct*100));
  const lock=BigInt(Number($("packageLockInput").value));
  if(min<=0n||max<min||!Number.isFinite(pct)||pct<=0||rate>100n||lock<=0n)throw new Error("Invalid package values.");
  return {min,max,rate,lock,active:$("packageActiveInput").checked};
}

async function updatePackage(){
  if(!stakingAuthorized())return toast("Connect the Staking owner wallet.",true);
  let v;try{v=packageForm()}catch(err){return toast(err.message,true)}
  const id=Number($("packageIdInput").value);
  if(!Number.isInteger(id)||id<0)return toast("Enter a valid package ID.",true);
  return runTx("Update Staking Package",()=>stakingWrite.updatePackage(id,v.min,v.max,v.rate,v.lock,v.active));
}

async function addPackage(){
  if(!stakingAuthorized())return toast("Connect the Staking owner wallet.",true);
  let v;try{v=packageForm()}catch(err){return toast(err.message,true)}
  if(!v.active)return toast("A new package is created ACTIVE. Add it first, then deactivate if required.",true);
  return runTx("Add Staking Package",()=>stakingWrite.addPackage(v.min,v.max,v.rate,v.lock));
}

async function loadRankDashboard(){
  if(!stakingRead)return;
  const total=Number(await stakingRead.totalRankMembers());
  const maxPage=Math.max(0,Math.ceil(total/rankPageSize)-1);
  if(rankPage>maxPage)rankPage=maxPage;
  const offset=rankPage*rankPageSize;
  const members=total?await stakingRead.getRankMembers(offset,rankPageSize):[];
  const rows=await Promise.all(members.map(async member=>{
    const [info,preview,legs]=await Promise.all([stakingRead.rankInfo(member),stakingRead.rankSalaryPreview(member),stakingRead.totalDirectLegs(member)]);
    return {member,info,preview,legs:Number(legs)};
  }));
  rows.sort((a,b)=>Number(b.preview[2])-Number(a.preview[2]));
  $("rankMemberCount").textContent=total.toLocaleString();
  $("rankPrevBtn").disabled=rankPage<=0;
  $("rankNextBtn").disabled=rankPage>=maxPage;
  if(!rows.length){
    $("rankMemberTable").innerHTML='<div class="empty">No Rank members yet.</div>';
    return;
  }
  let html='<table class="admin-table"><thead><tr><th>Member</th><th>Rank</th><th>Sponsors</th><th>Small-leg</th><th>Due</th><th>Next Slot</th><th>Actions</th></tr></thead><tbody>';
  for(const r of rows){
    const highest=Number(r.preview[0]),periods=Number(r.preview[2]),next=Number(r.preview[5]);
    const due=periods>0?usd(r.preview[3])+" · "+periods+" wk":"Not due";
    const nextText=next?new Date(next*1000).toLocaleString():"—";
    const payDisabled=!stakingAuthorized()||periods===0?" disabled":"";
    html+='<tr><td><code>'+short(r.member)+'</code></td><td>Rank '+highest+'</td><td>'+Number(r.preview[7])+'</td><td>'+usd(r.preview[6])+'</td><td>'+due+'</td><td>'+nextText+'</td><td><div class="table-actions"><button class="btn rank-legs" data-account="'+r.member+'">Legs ('+r.legs+')</button><button class="btn gold rank-pay" data-account="'+r.member+'"'+payDisabled+'>Pay Due</button></div></td></tr>';
  }
  html+='</tbody></table>';
  $("rankMemberTable").innerHTML=html;
  document.querySelectorAll(".rank-legs").forEach(btn=>btn.addEventListener("click",()=>loadRankLegs(btn.dataset.account)));
  document.querySelectorAll(".rank-pay").forEach(btn=>btn.addEventListener("click",()=>runTx("Process Rank Salary",()=>stakingWrite.processRankSalary(btn.dataset.account))));
}

async function loadRankLegs(accountAddress,resetPage=true){
  if(!stakingRead||!ethers.isAddress(accountAddress))return;
  if(resetPage||selectedLegAccount.toLowerCase()!==accountAddress.toLowerCase())legPage=0;
  selectedLegAccount=accountAddress;
  $("selectedRankMember").textContent=accountAddress;

  const [totalRaw,snapshot]=await Promise.all([
    stakingRead.totalDirectLegs(accountAddress),
    stakingRead.getSmallLegTurnoverUSDT(accountAddress)
  ]);
  const total=Number(totalRaw);
  const maxPage=Math.max(0,Math.ceil(total/legPageSize)-1);
  if(legPage>maxPage)legPage=maxPage;
  const offset=legPage*legPageSize;
  const members=total?await stakingRead.getDirectLegMembers(accountAddress,offset,Math.min(legPageSize,total-offset)):[];
  const rows=await Promise.all(members.map(async leg=>({leg,turnover:await stakingRead.legTurnoverUSDT(accountAddress,leg)})));
  rows.sort((a,b)=>a.turnover===b.turnover?0:(a.turnover>b.turnover?-1:1));

  $("rankLegCount").textContent=total.toLocaleString()+" · page "+(legPage+1)+"/"+(maxPage+1);
  $("legPrevBtn").disabled=legPage<=0;
  $("legNextBtn").disabled=legPage>=maxPage;

  if(!rows.length){
    $("rankLegList").innerHTML='<div class="empty">No direct legs registered.</div>';
    return;
  }
  const bigLeg=String(snapshot.bigLeg||snapshot[3]||"").toLowerCase();
  let html="";
  rows.forEach(r=>{
    const isBig=r.leg.toLowerCase()===bigLeg;
    html+='<div class="admin-list-row"><div><strong>'+(isBig?"BIG LEG · ":"")+short(r.leg)+'</strong><small>'+usd(r.turnover)+' turnover</small></div><code>'+r.leg+'</code></div>';
  });
  $("rankLegList").innerHTML=html;
}

async function loadRankHistory(){
  if(!stakingRead)return;
  const box=$("rankHistory");
  try{
    const total=Number(await stakingRead.totalRankSalaryPayments());
    const maxPage=Math.max(0,Math.ceil(total/rankHistoryPageSize)-1);
    if(rankHistoryPage>maxPage)rankHistoryPage=maxPage;
    $("rankHistoryCount").textContent=total.toLocaleString()+" payments";
    $("historyPrevBtn").disabled=rankHistoryPage<=0;
    $("historyNextBtn").disabled=rankHistoryPage>=maxPage;

    if(!total){
      box.innerHTML='<div class="empty">No Rank Salary payments yet.</div>';
      return;
    }

    const endExclusive=Math.max(0,total-(rankHistoryPage*rankHistoryPageSize));
    const start=Math.max(0,endExclusive-rankHistoryPageSize);
    const records=await stakingRead.getRankSalaryPayments(start,endExclusive-start);
    const newest=[...records].reverse();

    box.innerHTML=newest.map(r=>{
      const paidAt=new Date(Number(r.paidAt)*1000).toLocaleString();
      const price="$"+(Number(r.priceUSD8)/1e8).toFixed(3);
      return '<div class="admin-list-row"><div><strong>Rank '+Number(r.payableRank)+' · '+usd(r.salaryUSDT)+'</strong><small>'+short(r.account)+' · '+Number(r.periodsPaid)+' period(s) · '+ath(r.salaryATH)+' · ATH '+price+'</small></div><small>'+paidAt+'</small></div>';
    }).join("");
  }catch(err){console.error("rank history",err);box.innerHTML='<div class="empty">Complete Rank Salary history temporarily unavailable.</div>'}
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
  $("fundRewardBtn").addEventListener("click",()=>fundStakingReserve("reward"));
  $("fundNetworkBtn").addEventListener("click",()=>fundStakingReserve("network"));
  $("loadPackageBtn").addEventListener("click",()=>loadPackageEditor());
  $("updatePackageBtn").addEventListener("click",updatePackage);
  $("addPackageBtn").addEventListener("click",addPackage);
  $("refreshRankBtn").addEventListener("click",async()=>{await Promise.all([loadRankDashboard(),loadRankHistory()]);toast("Rank data refreshed.");});
  $("rankPrevBtn").addEventListener("click",async()=>{if(rankPage>0){rankPage--;await loadRankDashboard();}});
  $("rankNextBtn").addEventListener("click",async()=>{rankPage++;await loadRankDashboard();});
  $("legPrevBtn").addEventListener("click",async()=>{if(selectedLegAccount&&legPage>0){legPage--;await loadRankLegs(selectedLegAccount,false);}});
  $("legNextBtn").addEventListener("click",async()=>{if(selectedLegAccount){legPage++;await loadRankLegs(selectedLegAccount,false);}});
  $("historyPrevBtn").addEventListener("click",async()=>{if(rankHistoryPage>0){rankHistoryPage--;await loadRankHistory();}});
  $("historyNextBtn").addEventListener("click",async()=>{rankHistoryPage++;await loadRankHistory();});
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