const STAKING_ABI=[
"function packages(uint256) view returns (uint256 minUSDT,uint256 maxUSDT,uint256 dailyRateBps,uint256 lockDays,bool active)",
"function packageCount() view returns (uint256)","function paused() view returns (bool)","function stakeCount(address) view returns (uint256)",
"function userInfo(address) view returns (address referrer,uint256 activeStakedUSDT,uint256 totalReferralEarnedATH,uint256 totalNetworkEarnedATH)",
"function userStakes(address,uint256) view returns (uint256 amountUSDT,uint256 principalATH,uint256 packageId,uint256 dailyRateBps,uint256 lockDays,uint256 startTime,uint256 lastClaimTime,uint256 totalClaimedUSDT,bool principalWithdrawn)",
"function getATHAmount(uint256) view returns (uint256)","function getPendingRewardUSDT(address,uint256) view returns (uint256)",
"function getPendingRewardATH(address,uint256) view returns (uint256)","function rewardEnd(address,uint256) view returns (uint256)",
"function getSmallLegTurnoverUSDT(address) view returns (uint256 totalTurnover,uint256 largestTurnover,uint256 smallLegTurnover,address bigLeg)",
"function totalDirectLegs(address) view returns (uint256)",
"function getDirectLegMembers(address,uint256,uint256) view returns (address[] result)",
"function legTurnoverUSDT(address,address) view returns (uint256)",
"function directSponsorCount(address) view returns (uint256)",
"function rankSalaryPreview(address) view returns (uint8 highestRank,uint8 payableRankNow,uint256 periodsDue,uint256 salaryUSDT,uint256 salaryATH,uint256 nextPayoutAt,uint256 smallLegTurnover,uint256 sponsors)",
"function rankInfo(address) view returns (uint8 highestRank,uint64 firstRankAchievedAt,uint64 nextPayoutAt,uint256 totalSalaryPaidUSDT,uint256 totalSalaryPaidATH)",
"function rankWeeklySalaryUSDT(uint256) view returns (uint256)","function claimRankSalary()",
"function stake(uint256,uint256,address)","function claimReward(uint256)","function withdrawPrincipal(uint256)"
];
const STAKING_TOKEN_ABI=["function balanceOf(address) view returns (uint256)","function allowance(address,address) view returns (uint256)","function approve(address,uint256) returns (bool)"];
const PRICE_REGISTRY_ABI=["function getPrice() view returns (uint256)","function HOLDER_TARGET() view returns (uint256)","function recordedHolderCount() view returns (uint256)","function priceMode() view returns (uint8)","function officialListingActivated() view returns (bool)","function marketPriceOracle() view returns (address)","function getMarketPrice() view returns (uint256)"];
const STAKING_NAMES=["Starter","Basic","Silver","Gold","Platinum","Diamond"];
let scfg=null,srpc=null,sbrowser=null,ssigner=null,saccount="",sstaking=null,stoken=null,sregistry=null,spackages=[],sPositionCount=0,sPaused=true;
const se=id=>document.getElementById(id);
function sToast(message,error=false){const el=se("toast");if(!el)return;el.textContent=message;el.classList.toggle("error",error);el.classList.add("show");setTimeout(()=>el.classList.remove("show"),3600)}
function sShort(v){return v?v.slice(0,6)+"…"+v.slice(-4):""}
function sFmtAth(v){try{return Number(ethers.formatEther(v)).toLocaleString(undefined,{maximumFractionDigits:6})+" ATH"}catch{return "0 ATH"}}
function sFmtUsd(v){try{return "$"+Number(ethers.formatEther(v)).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}catch{return "$0.00"}}
function sI18nRefresh(){window.dispatchEvent(new CustomEvent("aether-language-refresh"))}
const STAKING_TREE_PAGE=50;
const STAKING_TREE_MAX_DEPTH=5;
function sEsc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function sNetworkReset(message="Connect wallet to load your Staking network."){
  if(se("stakingDirectMembers"))se("stakingDirectMembers").textContent="0";
  if(se("stakingNetworkTurnover"))se("stakingNetworkTurnover").textContent="$0.00";
  if(se("stakingNetworkSmallLeg"))se("stakingNetworkSmallLeg").textContent="$0.00";
  if(se("stakingNetworkRank"))se("stakingNetworkRank").textContent="No Rank";
  if(se("stakingLifestyleEarned"))se("stakingLifestyleEarned").textContent="0 ATH";
  if(se("stakingNetworkBigLeg"))se("stakingNetworkBigLeg").textContent="—";
  if(se("stakingNetworkTreeStatus"))se("stakingNetworkTreeStatus").textContent=message;
  if(se("stakingNetworkTree"))se("stakingNetworkTree").innerHTML='<div class="staking-network-empty">No Staking network loaded.</div>';
}
function sNetworkNodeHtml({account,parent,depth,turnover,user,rank,children,bigLeg}){
  const highest=Number(rank.highestRank||0);
  const active=BigInt(user.activeStakedUSDT||0n);
  const rankText=highest>0?"Rank "+highest:"No Rank";
  const isBig=Boolean(bigLeg&&bigLeg!==ethers.ZeroAddress&&account.toLowerCase()===bigLeg.toLowerCase());
  const canExpand=Number(children)>0&&depth<STAKING_TREE_MAX_DEPTH;
  return '<div class="staking-tree-node depth-'+depth+'" data-tree-account="'+sEsc(account)+'">'+
    '<div class="staking-tree-row">'+
      '<div class="staking-tree-wallet"><strong>'+sEsc(sShort(account))+'</strong><small>'+sEsc(account)+'</small>'+
        '<div class="staking-tree-badges"><span class="staking-tree-badge">'+sEsc(rankText)+'</span>'+
        (isBig?'<span class="staking-tree-badge big">BIG LEG</span>':'')+
        '</div></div>'+
      '<div class="staking-tree-stat"><span>Leg Turnover</span><b>'+sEsc(sFmtUsd(turnover))+'</b></div>'+
      '<div class="staking-tree-stat"><span>Active Stake</span><b>'+sEsc(sFmtUsd(active))+'</b></div>'+
      '<div class="staking-tree-stat"><span>Direct Members</span><b>'+Number(children).toLocaleString()+'</b></div>'+
      '<div class="staking-tree-stat"><span>Lifestyle / Matching</span><b>'+sEsc(sFmtAth(user.totalNetworkEarnedATH||0n))+'</b></div>'+
      '<button class="staking-tree-expand" type="button" data-tree-expand="'+sEsc(account)+'" data-tree-parent="'+sEsc(parent||"")+'" data-tree-depth="'+depth+'" '+(canExpand?'':'disabled')+'>'+(canExpand?'Expand':'Leaf')+'</button>'+
    '</div>'+
    '<div class="staking-tree-children" data-tree-children="'+sEsc(account)+'" hidden></div>'+
  '</div>';
}
function sReady(){return Boolean(scfg&&ethers.isAddress(scfg.stakingAddress||"")&&ethers.isAddress(scfg.tokenAddress||""))}
async function sEnsureChain(){if(!window.ethereum||!scfg)return;const wanted="0x"+Number(scfg.chainId).toString(16),current=await window.ethereum.request({method:"eth_chainId"});if(current.toLowerCase()===wanted.toLowerCase())return;try{await window.ethereum.request({method:"wallet_switchEthereumChain",params:[{chainId:wanted}]})}catch(err){if(err&&err.code!==4902)throw err;await window.ethereum.request({method:"wallet_addEthereumChain",params:[{chainId:wanted,chainName:scfg.chainName,nativeCurrency:{name:"BNB",symbol:"BNB",decimals:18},rpcUrls:[scfg.rpcUrl],blockExplorerUrls:[scfg.explorerUrl]}]})}}
async function sLoadRegistry(){if(!ethers.isAddress(scfg&&scfg.priceRegistryAddress||""))return;try{sregistry=new ethers.Contract(scfg.priceRegistryAddress,PRICE_REGISTRY_ABI,srpc);const x=await Promise.all([sregistry.getPrice(),sregistry.HOLDER_TARGET(),sregistry.recordedHolderCount(),sregistry.priceMode(),sregistry.officialListingActivated(),sregistry.marketPriceOracle()]);const price=x[0],target=x[1],count=x[2],mode=x[3],listed=x[4],marketOracle=x[5];se("stakingPrice").textContent="$"+(Number(price)/1e8).toFixed(4);se("stakingHolderCount").textContent=Number(count).toLocaleString();se("stakingPriceMode").textContent=Number(mode)===0?"PRESALE-LINKED":"MARKET";se("stakingListingStatus").textContent=listed?"Official listing active":Math.max(0,Number(target)-Number(count)).toLocaleString()+" holders remaining";if(marketOracle!==ethers.ZeroAddress&&!listed){try{const market=await sregistry.getMarketPrice();se("stakingPriceMode").textContent+=" · DEX $"+(Number(market)/1e8).toFixed(4)}catch{}}sI18nRefresh()}catch(err){console.error("ATH price registry",err)}}
async function sLoadPackages(){if(!sReady())return;try{const read=new ethers.Contract(scfg.stakingAddress,STAKING_ABI,srpc),state=await Promise.all([read.packageCount(),read.paused()]),count=Number(state[0]);sPaused=Boolean(state[1]);spackages=await Promise.all(Array.from({length:count},(_,i)=>read.packages(i)));se("stakingPackageSelect").innerHTML=spackages.map((p,i)=>"<option value=\""+i+"\">"+(STAKING_NAMES[i]||("Package "+(i+1)))+" · "+(Number(p.dailyRateBps)/100).toFixed(2)+"%/day · "+p.lockDays+"d</option>").join("");se("stakingPackages").innerHTML=spackages.map((p,i)=>{const min=Number(ethers.formatEther(p.minUSDT)),max=p.maxUSDT>10n**50n?"∞":Number(ethers.formatEther(p.maxUSDT)).toLocaleString();return "<div class=\"staking-package\" data-package=\""+i+"\"><b>"+(STAKING_NAMES[i]||("Package "+(i+1)))+"</b><span>$"+min.toLocaleString()+"–"+max+"<br>"+(Number(p.dailyRateBps)/100).toFixed(2)+"% daily · "+p.lockDays+" days</span></div>"}).join("");if(spackages[0])se("stakingAmountUsd").value=Number(ethers.formatEther(spackages[0].minUSDT)).toString();se("stakingStakeBtn").disabled=!sReady()||sPaused;se("stakingContractStatus").textContent=sPaused?"Staking v1 PAUSED — opening verification in progress":"Staking v1 connected";await sPreview()}catch(err){console.error("Staking packages",err);se("stakingActionStatus").textContent="Unable to read Staking packages."}}
async function sPreview(){if(!sReady())return;try{const raw=String(se("stakingAmountUsd").value||"").trim();if(!raw||Number(raw)<=0){se("stakingRequiredAth").textContent="—";return}const read=new ethers.Contract(scfg.stakingAddress,STAKING_ABI,srpc),ath=await read.getATHAmount(ethers.parseEther(raw));se("stakingRequiredAth").textContent=sFmtAth(ath)}catch{se("stakingRequiredAth").textContent="Invalid amount"}}
async function sConnect(request=false){if(!window.ethereum){sToast("No EVM wallet detected. Open in AETHER Wallet or another compatible wallet.",true);return false}try{await sEnsureChain();sbrowser=new ethers.BrowserProvider(window.ethereum);const method=request?"eth_requestAccounts":"eth_accounts",accounts=await sbrowser.send(method,[]);if(!accounts.length){saccount="";se("stakingWalletStatus").textContent="Not Connected";se("stakingStakeBtn").disabled=true;return false}saccount=ethers.getAddress(accounts[0]);ssigner=await sbrowser.getSigner();sstaking=new ethers.Contract(scfg.stakingAddress,STAKING_ABI,ssigner);stoken=new ethers.Contract(scfg.tokenAddress,STAKING_TOKEN_ABI,ssigner);se("stakingWalletStatus").textContent=sShort(saccount);se("stakingStakeBtn").disabled=!sReady()||sPaused;await sRefreshAccount();return true}catch(err){console.error(err);sToast(err.shortMessage||err.message||"Wallet connection failed.",true);return false}}
async function sRefreshAccount(){
  if(!sReady()){se("stakingContractStatus").textContent="Contract pending";return}
  se("stakingContractStatus").textContent=sPaused?"Staking v1 PAUSED — opening verification in progress":"Staking v1 connected";
  if(!saccount){
    se("stakingActiveUsd").textContent="$0.00";se("stakingPositionCount").textContent="0";se("stakingReferralEarned").textContent="0 ATH";se("stakingNetworkEarned").textContent="0 ATH";
    se("stakingRank").textContent="No Rank";se("stakingSponsors").textContent="0 / 5";se("stakingSmallLeg").textContent="$0.00";se("stakingBigLeg").textContent="—";se("stakingRankSalary").textContent="$0 / week";se("stakingNextRankPayout").textContent="—";se("stakingRankSalaryPaid").textContent="$0.00";se("stakingRankDue").textContent="Not due";se("stakingRankClaimBtn").disabled=true;
    se("stakingPositionSelect").innerHTML="<option>No positions yet</option>";se("stakingClaimBtn").disabled=true;se("stakingWithdrawBtn").disabled=true;sNetworkReset();sI18nRefresh();return
  }
  try{
    const read=sstaking||new ethers.Contract(scfg.stakingAddress,STAKING_ABI,srpc);
    const x=await Promise.all([read.userInfo(saccount),read.stakeCount(saccount),read.rankSalaryPreview(saccount),read.getSmallLegTurnoverUSDT(saccount),read.rankInfo(saccount)]);
    const u=x[0],count=Number(x[1]),rank=x[2],legs=x[3],rankState=x[4];
    sPositionCount=count;
    se("stakingActiveUsd").textContent=sFmtUsd(u.activeStakedUSDT);se("stakingPositionCount").textContent=String(count);se("stakingReferralEarned").textContent=sFmtAth(u.totalReferralEarnedATH);se("stakingNetworkEarned").textContent=sFmtAth(u.totalNetworkEarnedATH);
    const highest=Number(rank.highestRank),periods=Number(rank.periodsDue),sponsors=Number(rank.sponsors);
    se("stakingRank").textContent=highest>0?"Rank "+highest:"No Rank";
    se("stakingSponsors").textContent=sponsors.toLocaleString()+" / 5";
    se("stakingSmallLeg").textContent=sFmtUsd(rank.smallLegTurnover);
    se("stakingBigLeg").textContent=legs.bigLeg&&legs.bigLeg!==ethers.ZeroAddress?sShort(legs.bigLeg):"—";
    const weekly=highest>0?await read.rankWeeklySalaryUSDT(highest-1):0n;
    se("stakingRankSalary").textContent=highest>0?sFmtUsd(weekly)+" / week":"$0 / week";
    se("stakingNextRankPayout").textContent=rank.nextPayoutAt>0n?new Date(Number(rank.nextPayoutAt)*1000).toLocaleString():"—";
    se("stakingRankSalaryPaid").textContent=sFmtUsd(rankState.totalSalaryPaidUSDT);
    se("stakingRankDue").textContent=periods>0&&rank.salaryUSDT>0n?sFmtUsd(rank.salaryUSDT)+" due":"Not due";
    se("stakingRankClaimBtn").disabled=!(periods>0&&rank.salaryUSDT>0n);
    se("stakingPositionSelect").innerHTML=count?Array.from({length:count},(_,n)=>count-1-n).map(i=>"<option value=\""+i+"\">Stake #"+(i+1)+(i===count-1?" · Latest":"")+"</option>").join(""):"<option>No positions yet</option>";
    if(count){se("stakingPositionSelect").value=String(count-1);await sLoadPosition(count-1)}else{sClearPosition()}
    await sLoadNetworkTree();
    sI18nRefresh();
  }catch(err){console.error("staking account",err);sToast("Unable to read Staking account.",true)}
}
function sClearPosition(){se("stakingPrincipal").textContent="0 ATH";se("stakingPendingReward").textContent="0 ATH";se("stakingUnlock").textContent="—";se("stakingPositionState").textContent="—";se("stakingClaimBtn").disabled=true;se("stakingWithdrawBtn").disabled=true}
async function sLoadPosition(index){if(!saccount||!sReady())return sClearPosition();try{const read=sstaking||new ethers.Contract(scfg.stakingAddress,STAKING_ABI,srpc),x=await Promise.all([read.userStakes(saccount,index),read.getPendingRewardATH(saccount,index),read.rewardEnd(saccount,index)]),p=x[0],pending=x[1],end=x[2],now=Math.floor(Date.now()/1000),withdrawn=Boolean(p.principalWithdrawn);se("stakingPrincipal").textContent=sFmtAth(p.principalATH);se("stakingPendingReward").textContent=sFmtAth(pending);se("stakingUnlock").textContent=new Date(Number(end)*1000).toLocaleDateString();se("stakingPositionState").textContent=withdrawn?"Principal withdrawn":(now>=Number(end)?"Unlocked":"Locked");se("stakingClaimBtn").disabled=pending<=0n;se("stakingWithdrawBtn").disabled=withdrawn||now<Number(end)}catch(err){console.error("stake position",err);sClearPosition()}}
async function sReadNetworkNode(read,account,parent,depth,parentBigLeg){
  const calls=[
    read.userInfo(account),
    read.rankInfo(account),
    read.totalDirectLegs(account)
  ];
  if(parent)calls.push(read.legTurnoverUSDT(parent,account));
  else calls.push(Promise.resolve(0n));
  const [user,rank,children,turnover]=await Promise.all(calls);
  return {account,parent,depth,turnover,user,rank,children,bigLeg:parentBigLeg};
}
async function sBindNetworkExpanders(){
  document.querySelectorAll("[data-tree-expand]").forEach(btn=>{
    if(btn.dataset.bound==="1")return;
    btn.dataset.bound="1";
    btn.addEventListener("click",()=>sExpandNetworkNode(btn));
  });
}
async function sExpandNetworkNode(btn){
  if(!sReady())return;
  const account=btn.dataset.treeExpand;
  const depth=Number(btn.dataset.treeDepth||0);
  const box=document.querySelector('[data-tree-children="'+account+'"]');
  if(!box)return;
  if(!box.hidden){
    box.hidden=true;
    btn.textContent="Expand";
    return;
  }
  if(box.dataset.loaded==="1"){
    box.hidden=false;
    btn.textContent="Collapse";
    return;
  }
  try{
    btn.disabled=true;btn.textContent="Loading…";
    const read=sstaking||new ethers.Contract(scfg.stakingAddress,STAKING_ABI,srpc);
    const [totalRaw,legState]=await Promise.all([
      read.totalDirectLegs(account),
      read.getSmallLegTurnoverUSDT(account)
    ]);
    const total=Number(totalRaw);
    const page=Math.min(total,STAKING_TREE_PAGE);
    const members=page?await read.getDirectLegMembers(account,0,page):[];
    const nodes=await Promise.all(members.map(child=>sReadNetworkNode(read,child,account,depth+1,legState.bigLeg)));
    box.innerHTML=nodes.length?nodes.map(sNetworkNodeHtml).join(""):'<div class="staking-network-empty">No direct members under this wallet.</div>';
    if(total>page)box.insertAdjacentHTML("beforeend",'<div class="staking-network-empty">Showing first '+page+' of '+total.toLocaleString()+' direct members for mobile performance.</div>');
    box.dataset.loaded="1";
    box.hidden=false;
    btn.textContent="Collapse";
    await sBindNetworkExpanders();
  }catch(err){
    console.error("staking network expand",err);
    box.innerHTML='<div class="staking-network-empty">Unable to load this network branch.</div>';
    box.hidden=false;
    btn.textContent="Retry";
  }finally{
    btn.disabled=false;
  }
}
async function sLoadNetworkTree(){
  if(!sReady())return sNetworkReset("Staking contract pending.");
  if(!saccount)return sNetworkReset();
  try{
    const read=sstaking||new ethers.Contract(scfg.stakingAddress,STAKING_ABI,srpc);
    const [user,rankState,legState,totalDirectRaw]=await Promise.all([
      read.userInfo(saccount),
      read.rankInfo(saccount),
      read.getSmallLegTurnoverUSDT(saccount),
      read.totalDirectLegs(saccount)
    ]);
    const totalDirect=Number(totalDirectRaw);
    se("stakingDirectMembers").textContent=totalDirect.toLocaleString();
    se("stakingNetworkTurnover").textContent=sFmtUsd(legState.totalTurnover);
    se("stakingNetworkSmallLeg").textContent=sFmtUsd(legState.smallLegTurnover);
    se("stakingNetworkRank").textContent=Number(rankState.highestRank)>0?"Rank "+Number(rankState.highestRank):"No Rank";
    se("stakingLifestyleEarned").textContent=sFmtAth(user.totalNetworkEarnedATH);
    se("stakingNetworkBigLeg").textContent=legState.bigLeg&&legState.bigLeg!==ethers.ZeroAddress?sShort(legState.bigLeg):"—";

    const rootNode=await sReadNetworkNode(read,saccount,"",0,ethers.ZeroAddress);
    rootNode.turnover=legState.totalTurnover;
    rootNode.bigLeg=ethers.ZeroAddress;
    se("stakingNetworkTree").innerHTML=sNetworkNodeHtml(rootNode);
    se("stakingNetworkTreeStatus").textContent=totalDirect
      ?"Your wallet is the root. Expand nodes to inspect sponsor hierarchy."
      :"No direct Staking members under this wallet yet.";
    await sBindNetworkExpanders();

    const rootButton=document.querySelector('[data-tree-expand="'+saccount+'"]');
    if(rootButton&&totalDirect>0)await sExpandNetworkNode(rootButton);
    sI18nRefresh();
  }catch(err){
    console.error("staking network tree",err);
    sNetworkReset("Unable to read Staking sponsor hierarchy.");
  }
}
async function sRun(label,fn){try{sToast(label+": confirm in your wallet.");const tx=await fn();sToast(label+": submitted "+sShort(tx.hash));await tx.wait();sToast(label+": confirmed.");await sLoadRegistry();await sRefreshAccount();await sPreview();return true}catch(err){console.error(err);sToast(err.shortMessage||err.reason||err.message||(label+" failed."),true);return false}}
async function sStake(){if(!(await sConnect(true)))return;if(sPaused)return sToast("ATH Staking is PAUSED until reserve funding and opening verification are complete.",true);try{const packageId=Number(se("stakingPackageSelect").value||0),raw=String(se("stakingAmountUsd").value||"").trim();if(!raw||Number(raw)<=0)return sToast("Enter a valid stake value.",true);const amountUsd=ethers.parseEther(raw),pkg=spackages[packageId];if(!pkg||amountUsd<pkg.minUSDT||amountUsd>pkg.maxUSDT)return sToast("Stake amount is outside the selected package range.",true);let ref=String(se("stakingReferrer").value||"").trim()||ethers.ZeroAddress;if(ref!==ethers.ZeroAddress&&!ethers.isAddress(ref))return sToast("Sponsor wallet is invalid.",true);if(ref!==ethers.ZeroAddress&&ref.toLowerCase()===saccount.toLowerCase())return sToast("Self-referral is not allowed.",true);const required=await sstaking.getATHAmount(amountUsd),balance=await stoken.balanceOf(saccount);if(balance<required)return sToast("Insufficient ATH balance. Required: "+sFmtAth(required),true);const allowance=await stoken.allowance(saccount,scfg.stakingAddress);if(allowance<required){const approved=await sRun("ATH approval",()=>stoken.approve(scfg.stakingAddress,required));if(!approved)return}await sRun("ATH Stake",()=>sstaking.stake(packageId,amountUsd,ref))}catch(err){console.error(err);sToast(err.shortMessage||err.message||"Stake failed.",true)}}
async function sClaim(){if(!(await sConnect(true)))return;const id=Number(se("stakingPositionSelect").value||0);await sRun("Staking reward",()=>sstaking.claimReward(id))}
async function sWithdraw(){if(!(await sConnect(true)))return;const id=Number(se("stakingPositionSelect").value||0);await sRun("Staking principal",()=>sstaking.withdrawPrincipal(id))}
async function sClaimRank(){if(!(await sConnect(true)))return;await sRun("Rank salary",()=>sstaking.claimRankSalary())}
async function sBoot(){try{scfg=await fetch("/config",{cache:"no-store"}).then(r=>r.json());srpc=new ethers.JsonRpcProvider(scfg.rpcUrl,scfg.chainId);se("stakingContractStatus").textContent=sReady()?"Staking v1 configured":"Contract pending";await Promise.all([sLoadRegistry(),sLoadPackages()]);await sConnect(false);se("stakingAmountUsd").addEventListener("input",sPreview);se("stakingPackageSelect").addEventListener("change",()=>{const i=Number(se("stakingPackageSelect").value||0),p=spackages[i];if(p)se("stakingAmountUsd").value=Number(ethers.formatEther(p.minUSDT)).toString();document.querySelectorAll(".staking-package").forEach((el,n)=>el.classList.toggle("active",n===i));sPreview()});se("stakingStakeBtn").addEventListener("click",sStake);se("stakingClaimBtn").addEventListener("click",sClaim);se("stakingWithdrawBtn").addEventListener("click",sWithdraw);se("stakingRankClaimBtn").addEventListener("click",sClaimRank);se("stakingNetworkRefreshBtn")?.addEventListener("click",sLoadNetworkTree);se("stakingPositionSelect").addEventListener("change",e=>sLoadPosition(Number(e.target.value||0)));se("connectBtn")?.addEventListener("click",()=>setTimeout(()=>sConnect(false),700));window.ethereum?.on?.("accountsChanged",()=>sConnect(false));window.ethereum?.on?.("chainChanged",()=>window.location.reload());document.querySelector(".staking-package")?.classList.add("active")}catch(err){console.error("staking boot",err);se("stakingActionStatus").textContent="Unable to initialize Staking portal."}}
sBoot();
