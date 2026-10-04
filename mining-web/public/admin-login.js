const statusEl=document.getElementById("gateStatus");
let cfg=null;

function setStatus(text,error=false){
  statusEl.textContent=text;
  statusEl.classList.toggle("error",Boolean(error));
}
async function authenticate(role){
  try{
    setStatus("Connecting wallet…");
    if(!window.ethereum)throw new Error("Open this page inside AETHER Wallet or another EVM-compatible wallet.");
    const provider=new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts",[]);
    const signer=await provider.getSigner();
    const address=await signer.getAddress();

    setStatus("Requesting one-time authentication challenge…");
    const challengeRes=await fetch("/api/admin/challenge?role="+encodeURIComponent(role)+"&address="+encodeURIComponent(address),{
      cache:"no-store",
      credentials:"same-origin"
    });
    const challenge=await challengeRes.json();
    if(!challengeRes.ok)throw new Error(challenge.error||"Wallet is not authorized for this role.");

    setStatus("Wallet verified for this role. Please sign the one-time AETHER authentication message.");
    const signature=await signer.signMessage(challenge.message);

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
    setStatus(err?.shortMessage||err?.message||"Authentication failed.",true);
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
