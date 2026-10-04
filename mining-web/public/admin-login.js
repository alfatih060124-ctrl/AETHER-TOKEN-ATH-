const statusEl=document.getElementById("gateStatus");
let cfg=null;

function setStatus(text,error=false){
  statusEl.textContent=text;
  statusEl.classList.toggle("error",Boolean(error));
}

function utf8ToHex(value){
  const bytes=new TextEncoder().encode(String(value));
  return "0x"+Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("");
}

function isAddress(value){
  return /^0x[0-9a-fA-F]{40}$/.test(String(value||""));
}

async function requestWalletAddress(){
  if(!window.ethereum)throw new Error("Open this page inside AETHER Wallet or another EVM-compatible wallet.");
  const accounts=await window.ethereum.request({method:"eth_requestAccounts"});
  const address=Array.isArray(accounts)?accounts[0]:"";
  if(!isAddress(address))throw new Error("Wallet did not return a valid EVM address.");
  return address;
}

async function signAuthMessage(message,address){
  const data=utf8ToHex(message);
  try{
    return await window.ethereum.request({
      method:"personal_sign",
      params:[data,address]
    });
  }catch(err){
    if(err?.code===4001)throw err;
    // Some mobile EVM providers expose personal_sign with reversed parameters.
    return await window.ethereum.request({
      method:"personal_sign",
      params:[address,data]
    });
  }
}

async function authenticate(role){
  try{
    setStatus("Connecting wallet…");
    const address=await requestWalletAddress();

    setStatus("Checking wallet role…");
    const challengeRes=await fetch(
      "/api/admin/challenge?role="+encodeURIComponent(role)+"&address="+encodeURIComponent(address),
      {cache:"no-store",credentials:"same-origin"}
    );
    const challenge=await challengeRes.json();
    if(!challengeRes.ok)throw new Error(challenge.error||"Wallet is not authorized for this role.");

    setStatus("Wallet verified. Please sign the one-time AETHER authentication message.");
    const signature=await signAuthMessage(challenge.message,address);
    if(typeof signature!=="string"||!signature.startsWith("0x")){
      throw new Error("Wallet did not return a valid signature.");
    }

    setStatus("Verifying wallet signature…");
    const verifyRes=await fetch("/api/admin/verify",{
      method:"POST",
      headers:{"content-type":"application/json"},
      credentials:"same-origin",
      body:JSON.stringify({role,address,nonce:challenge.nonce,signature})
    });
    const verified=await verifyRes.json();
    if(!verifyRes.ok)throw new Error(verified.error||"Admin authentication failed.");

    setStatus("Authenticated. Opening "+verified.roleLabel+"…");
    window.location.assign("/admin");
  }catch(err){
    setStatus(err?.message||"Authentication failed.",true);
  }
}

async function boot(){
  cfg=await fetch("/config",{cache:"no-store",credentials:"same-origin"}).then(async r=>{
    const body=await r.json();
    if(!r.ok)throw new Error(body.error||"Unable to load network configuration.");
    return body;
  });
  document.querySelectorAll("[data-admin-role]").forEach(btn=>{
    btn.addEventListener("click",()=>authenticate(btn.dataset.adminRole));
  });
}

boot().catch(err=>setStatus(err?.message||"Unable to initialize admin access.",true));
