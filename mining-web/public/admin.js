const $=(id)=>document.getElementById(id);

const MINING_ABI=[
  "function owner() view returns (address)",
  "function paused() view returns (bool)",
  "function treasury() view returns (address)",
  "function totalMined() view returns (uint256)",
  "function totalPowerSold() view returns (uint256)",
  "function totalBoosterSold() view returns (uint256)",
  "function totalMiners() view returns (uint256)",
  "function globalClaimed() view returns (uint256)",
  "function outstandingVestingLiability() view returns (uint256)",
  "function contractBalance() view returns (uint256)",
  "function MINING_POOL_ALLOCATION() view returns (uint256)",
  "function setTreasury(address)",
  "function pause()",
  "function unpause()",
  "function withdrawExcessATH(address,uint256)",
  "event PowerPurchased(address indexed user,address indexed referrer,uint256 timestamp)",
  "event BoosterPurchased(address indexed user,uint256 hashAdded,uint256 totalHash,uint256 rewardMultiplier,uint256 timestamp)",
  "event DailyClaimed(address indexed user,uint256 reward,uint256 dayNumber,uint256 positionIndex)",
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

let cfg,readProvider,browserProvider,signer,account="",miningRead,tokenRead,miningWrite,tokenWrite;
let state={miningOwner:"",tokenOwner:"",miningPaused:false,tokenPaused:false};
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

function paintAccess(){
  const card=$("accessCard");
  card.classList.remove("authorized","denied");
  if(!account){
    $("accessTitle").textContent="Read-only";
    $("accessText").textContent="Connect the contract owner wallet to enable admin actions.";
  }else if(miningAuthorized()||tokenAuthorized()){
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
  $("withdrawExcessBtn").disabled=!miningAuthorized()||!state.miningPaused||!$("excessAck").checked;
  $("pauseTokenBtn").disabled=!tokenAuthorized()||state.tokenPaused;
  $("unpauseTokenBtn").disabled=!tokenAuthorized()||!state.tokenPaused;
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
      miningOwner,miningPaused,treasury,totalMined,totalPower,totalBooster,totalMiners,liability,reserve,
      tokenOwner,tokenPaused,totalSupply
    ]=await Promise.all([
      miningRead.owner(),miningRead.paused(),miningRead.treasury(),miningRead.totalMined(),
      miningRead.totalPowerSold(),miningRead.totalBoosterSold(),miningRead.totalMiners(),
      miningRead.outstandingVestingLiability(),miningRead.contractBalance(),
      tokenRead.owner(),tokenRead.paused(),tokenRead.totalSupply()
    ]);
    state={miningOwner,tokenOwner,miningPaused,tokenPaused};
    $("miningState").textContent="Connected";
    $("miningAddress").textContent=short(cfg.miningAddress);
    $("miningPause").textContent=miningPaused?"PAUSED":"ACTIVE";
    $("tokenPause").textContent=tokenPaused?"PAUSED":"ACTIVE";
    $("totalMiners").textContent=Number(totalMiners).toLocaleString();
    $("totalMined").textContent=ath(totalMined);
    $("liability").textContent=ath(liability);
    $("reserve").textContent=ath(reserve);
    $("sales").textContent=`${Number(totalPower).toLocaleString()} / ${Number(totalBooster).toLocaleString()}`;
    $("revenue").textContent=`${((Number(totalPower)+Number(totalBooster))*0.001).toFixed(3)} BNB revenue basis`;
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

    paintAccess();
    await loadActivity();
  }catch(err){console.error(err);toast("Unable to read ATH contracts from the configured network.",true)}
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
      ["Booster",miningRead.filters.BoosterPurchased()],
      ["Daily Claim",miningRead.filters.DailyClaimed()],
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
  $("setTreasuryBtn").addEventListener("click",()=>{
    const v=$("treasuryInput").value.trim();
    if(!ethers.isAddress(v)||v===ethers.ZeroAddress)return toast("Enter a valid non-zero treasury address.",true);
    return runTx("Update Treasury",()=>miningWrite.setTreasury(v));
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
      if(!accounts?.length){account="";signer=null;miningWrite=null;tokenWrite=null;$("connectBtn").textContent="Connect Admin Wallet";paintAccess();return}
      await connect();
    });
    window.ethereum.on?.("chainChanged",()=>window.location.reload());
  }
  await refresh();
}

boot().catch(err=>{console.error(err);toast("Unable to initialize ATH Control Panel.",true)});