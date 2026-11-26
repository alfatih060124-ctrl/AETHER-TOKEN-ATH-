"use strict";
// Only used on PUBLIC_SITE=staking. Fail closed until the VM link is configured.
const ORIGIN="https://staking.aether.boats";
const UPSTREAM="https://member-api.staking.aether.boats";
const ROUTES=new Map([["/api/member/challenge","POST"],["/api/member/verify","POST"],["/api/member/session","GET"],["/api/member/logout","POST"]]);
const cookie=req=>String(req.headers.cookie||"").match(/(?:^|;\s*)ath_member_session=([0-9a-f]{64})(?:;|$)/)?.[0]?.trim().replace(/^;\s*/,"")||"";
async function forward(req,path,body){
 const secret=process.env.STAKING_MEMBER_PROXY_SECRET;
 if(!secret||!/^[a-f0-9]{64}$/.test(secret)||process.env.STAKING_MEMBER_API_ENABLED!=="true"){
   console.warn("[staking-member] configuration gate:",process.env.STAKING_MEMBER_API_ENABLED!=="true"?"disabled":!secret?"credential_missing":"credential_format_invalid");
   return {status:503,body:JSON.stringify({ok:false,error:"MEMBER_API_UNAVAILABLE"})};
 }
 const method=ROUTES.get(path);
 if(!method||method!==req.method)return {status:405,body:'{"ok":false,"error":"METHOD_NOT_ALLOWED"}'};
 if(method==="POST"&&(req.headers.origin!==ORIGIN||!/^application\/json(?:;|$)/i.test(req.headers["content-type"]||"")))return {status:403,body:'{"ok":false,"error":"ORIGIN_REJECTED"}'};
 const headers={"X-ATH-Member-Proxy":secret,origin:ORIGIN,accept:"application/json"};
 const session=cookie(req);if(session)headers.cookie=session;
 if(method==="POST")headers["content-type"]="application/json";
 let r;
 try{r=await fetch(UPSTREAM+path,{method,headers,body:method==="POST"?JSON.stringify(body):undefined,redirect:"error",signal:AbortSignal.timeout(6000)});}
 catch(e){const code=e?.cause?.code||e?.name;const safe=["ENOTFOUND","EAI_AGAIN","ECONNREFUSED","ECONNRESET","ETIMEDOUT","UND_ERR_CONNECT_TIMEOUT","CERT_HAS_EXPIRED","UNABLE_TO_VERIFY_LEAF_SIGNATURE","ERR_TLS_CERT_ALTNAME_INVALID","TimeoutError","AbortError"].includes(code)?code:"network_error";console.warn("[staking-member] upstream connection:",safe);throw Error("Member upstream unavailable");}
 if(r.status>=400&&r.status!==401)console.warn("[staking-member] upstream HTTP",r.status);
 if(!String(r.headers.get("content-type")||"").startsWith("application/json"))throw Error("Invalid upstream response");
 const data=await r.text();if(data.length>32768)throw Error("Unexpected upstream size");
 const setCookie=r.headers.get("set-cookie");
 return {status:r.status,body:data,cookie:setCookie&&/^ath_member_session=(?:[a-f0-9]{64})?; Path=\/; HttpOnly; Secure; SameSite=Strict; Max-Age=(?:1800|0)$/.test(setCookie)?setCookie:null};
}
module.exports={forward,ROUTES};
