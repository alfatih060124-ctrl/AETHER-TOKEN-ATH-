(()=>{
  const buttons=[...document.querySelectorAll("[data-holder-view]")];
  const zones=[...document.querySelectorAll("[data-holder-zone]")];
  const status=document.getElementById("holderWalletWorkspaceStatus");
  const connect=document.getElementById("connectBtn");
  const valid=new Set(["mining","staking"]);

  function normalize(view){return valid.has(view)?view:"mining"}

  function set(view,{scrollTo=null,persist=true}={}){
    const safe=normalize(view);
    document.body.dataset.holderView=safe;
    zones.forEach(zone=>{
      zone.hidden=zone.dataset.holderZone!==safe;
    });
    buttons.forEach(btn=>{
      const active=btn.dataset.holderView===safe;
      btn.classList.toggle("active",active);
      btn.setAttribute("aria-pressed",active?"true":"false");
    });
    document.querySelectorAll('.main-nav a[href="#mining"],.main-nav a[href="#staking"]').forEach(link=>{
      link.classList.toggle("holder-area-active",link.getAttribute("href")==="#"+safe);
    });
    if(persist){
      try{localStorage.setItem("ath-holder-workspace",safe)}catch{}
    }
    if(scrollTo){
      requestAnimationFrame(()=>{
        document.getElementById(scrollTo)?.scrollIntoView({behavior:"smooth",block:"start"});
      });
    }
    window.dispatchEvent(new CustomEvent("aether-holder-workspace-change",{detail:{view:safe}}));
  }

  function connectedAddress(){
    const text=String(connect?.textContent||"").trim();
    return /^0x[0-9a-fA-F]{3,}.*[0-9a-fA-F]{3,}$/.test(text.replace(/\s/g,"")) ||
      (text.startsWith("0x") && text.includes("…"));
  }

  function paintWallet(){
    if(!status)return;
    const connected=connectedAddress();
    status.classList.toggle("connected",connected);
    status.textContent=connected
      ? "Wallet connected · choose Mining or Staking area"
      : "Wallet not connected";
    document.body.classList.toggle("holder-wallet-connected",connected);
  }

  buttons.forEach(btn=>btn.addEventListener("click",()=>{
    const view=normalize(btn.dataset.holderView);
    set(view,{scrollTo:view});
  }));

  document.querySelectorAll('a[href="#mining"],a[href="#staking"]').forEach(link=>{
    link.addEventListener("click",event=>{
      event.preventDefault();
      const view=link.getAttribute("href")==="#staking"?"staking":"mining";
      set(view,{scrollTo:view});
    });
  });

  if(connect){
    new MutationObserver(paintWallet).observe(connect,{childList:true,subtree:true,characterData:true});
  }

  let initial="mining";
  try{
    const saved=localStorage.getItem("ath-holder-workspace");
    if(valid.has(saved))initial=saved;
  }catch{}
  if(location.hash==="#staking")initial="staking";
  if(location.hash==="#mining")initial="mining";
  set(initial,{persist:false});
  paintWallet();

  window.addEventListener("hashchange",()=>{
    if(location.hash==="#staking")set("staking",{persist:true});
    if(location.hash==="#mining")set("mining",{persist:true});
  });

  window.AetherHolderWorkspace={set,get:()=>normalize(document.body.dataset.holderView)};
})();
