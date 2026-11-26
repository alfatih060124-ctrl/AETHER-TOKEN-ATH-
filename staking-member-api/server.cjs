"use strict";
// ATH Staking only. Local VM service; expose exclusively via audited HTTPS same-origin proxy.
const http=require("node:http");
const crypto=require("node:crypto");
const {Pool}=require("pg");
const {verifyMessage,getAddress}=require("ethers");
const ORIGIN="https://staking.aether.boats";
const pool=new Pool({host:"127.0.0.1",port:15485,database:"ath_member",user:"ath_member",password:process.env.POSTGRES_PASSWORD,max:8,connectionTimeoutMillis:3000,statement_timeout:5000});
if(!process.env.POSTGRES_PASSWORD)throw new Error("Database password required");
const proxySecret=process.env.STAKING_MEMBER_PROXY_SECRET||"";
if(!/^[a-f0-9]{64}$/.test(proxySecret))throw new Error("Staking proxy secret required");
const proxyDigest=crypto.createHash("sha256").update(proxySecret).digest();
function trustedProxy(req){
 const s=req.headers["x-ath-member-proxy"];
 return typeof s==="string"&&s.length===64&&crypto.timingSafeEqual(crypto.createHash("sha256").update(s).digest(),proxyDigest);
}
let totalWindow=0,totalCount=0;
function globalAllowed(){const now=Date.now();if(now>=totalWindow){totalWindow=now+60000;totalCount=0;}return ++totalCount<=240;}
const COOKIE="ath_member_session";
const hash=s=>crypto.createHash("sha256").update(s).digest("hex");
const address=s=>{if(typeof s!=="string"||!/^0x[0-9a-f]{40}$/i.test(s))throw new Error("Invalid wallet");const a=getAddress(s.toLowerCase()).toLowerCase();if(/^0x0{40}$/.test(a))throw new Error("Invalid wallet");return a;};
const random=()=>crypto.randomBytes(32).toString("hex");
function respond(res,status,data,cookie){res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff",...(cookie?{"Set-Cookie":cookie}:{})});res.end(JSON.stringify(data));}
function cookieToken(req){return String(req.headers.cookie||"").match(/(?:^|;\s*)ath_member_session=([0-9a-f]{64})(?:;|$)/)?.[1]||"";}
function body(req){return new Promise((resolve,reject)=>{let size=0;const chunks=[];req.on("data",chunk=>{size+=chunk.length;if(size>8192){reject(new Error("Payload too large"));req.destroy();}else chunks.push(chunk);});req.on("end",()=>{try{const b=JSON.parse(Buffer.concat(chunks).toString("utf8"));if(!b||typeof b!=="object"||Array.isArray(b))throw Error();resolve(b);}catch{reject(new Error("Invalid JSON"));}});req.on("error",reject);});}
const rate=new Map();
function allowed(key){const now=Date.now();if(rate.size>10000)return false;let r=rate.get(key);if(!r||r.end<now)r={end:now+60000,count:0};r.count++;rate.set(key,r);return r.count<=12;}
const prune=setInterval(()=>{for(const [k,v] of rate)if(v.end<Date.now())rate.delete(k);pool.query("DELETE FROM member_challenges WHERE expires_at<=now()").catch(()=>{});pool.query("DELETE FROM member_sessions WHERE expires_at<=now()").catch(()=>{});},60000);prune.unref();
async function profile(db,wallet){const q=await db.query("SELECT m.wallet,m.sponsor,m.is_master,m.created_at,a.allocation_usd,a.duration_days,a.rank,a.funded FROM members m LEFT JOIN master_allocation a ON a.wallet=m.wallet WHERE m.wallet=$1",[wallet]);return q.rows[0]||null;}
async function session(req){const t=cookieToken(req);if(!t)return null;const q=await pool.query("SELECT wallet FROM member_sessions WHERE token_hash=$1 AND expires_at>now()",[hash(t)]);return q.rows[0]?.wallet||null;}
const server=http.createServer(async(req,res)=>{
try{
const path=new URL(req.url,"http://localhost").pathname;
if(path==="/health"&&req.method==="GET"){await pool.query("SELECT 1");return respond(res,200,{ok:true,service:"ath-staking-member",transactionsEnabled:false});}
if(!path.startsWith("/api/member/"))return respond(res,404,{ok:false,error:"NOT_FOUND"});
if(!trustedProxy(req))return respond(res,403,{ok:false,error:"PROXY_AUTH_REQUIRED"});
if(!globalAllowed())return respond(res,429,{ok:false,error:"RATE_LIMIT"});
if(req.method==="POST"&&(req.headers.origin!==ORIGIN||!/^application\/json(?:;|$)/i.test(req.headers["content-type"]||"")))return respond(res,403,{ok:false,error:"ORIGIN_OR_CONTENT_TYPE"});
if(path==="/api/member/challenge"&&req.method==="POST"){
const b=await body(req);const wallet=address(b.wallet);if(!allowed("challenge:"+wallet))return respond(res,429,{ok:false,error:"RATE_LIMIT"});
const existing=await profile(pool,wallet);
let sponsor=existing?existing.sponsor:null;
if(!existing){if(!b.referral)return respond(res,403,{ok:false,error:"REFERRAL_REQUIRED"});sponsor=address(b.referral);if(sponsor===wallet||!(await profile(pool,sponsor)))return respond(res,403,{ok:false,error:"INVALID_SPONSOR"});}
const nonce=random(),expires=new Date(Date.now()+300000);
const message=["AETHER ATH Staking member authentication","Origin: "+ORIGIN,"Wallet: "+wallet,"Sponsor: "+(sponsor||"MASTER"),"Nonce: "+nonce,"Expires: "+expires.toISOString(),"Sign only to authenticate. No blockchain transaction or token approval is authorized."].join("\n");
await pool.query("INSERT INTO member_challenges(nonce,wallet,sponsor,message,expires_at) VALUES($1,$2,$3,$4,$5)",[nonce,wallet,sponsor,message,expires]);
return respond(res,200,{ok:true,nonce,message,expiresAt:expires.toISOString()});
}
if(path==="/api/member/verify"&&req.method==="POST"){
const b=await body(req);if(typeof b.nonce!=="string"||!/^[0-9a-f]{64}$/.test(b.nonce)||typeof b.signature!=="string"||!/^0x[0-9a-f]{130}$/i.test(b.signature))return respond(res,400,{ok:false,error:"INVALID_SIGNATURE"});
if(!allowed("verify:"+b.nonce))return respond(res,429,{ok:false,error:"RATE_LIMIT"});
const db=await pool.connect();try{
await db.query("BEGIN");
const q=await db.query("SELECT * FROM member_challenges WHERE nonce=$1 AND expires_at>now() FOR UPDATE",[b.nonce]);const c=q.rows[0];
if(!c){await db.query("ROLLBACK");return respond(res,401,{ok:false,error:"CHALLENGE_EXPIRED_OR_USED"});}
let recovered;try{recovered=address(verifyMessage(c.message,b.signature));}catch{}
if(recovered!==c.wallet){await db.query("ROLLBACK");return respond(res,401,{ok:false,error:"SIGNATURE_MISMATCH"});}
await db.query("DELETE FROM member_challenges WHERE nonce=$1",[b.nonce]);
await db.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))",[c.wallet]);
let member=await profile(db,c.wallet);
if(!member){if(!c.sponsor||c.sponsor===c.wallet||!(await profile(db,c.sponsor)))throw new Error("Sponsor unavailable");await db.query("INSERT INTO members(wallet,sponsor,is_master) VALUES($1,$2,false)",[c.wallet,c.sponsor]);member=await profile(db,c.wallet);}
if(member.sponsor!==c.sponsor){await db.query("ROLLBACK");return respond(res,409,{ok:false,error:"SPONSOR_CONFLICT"});}
const token=random();await db.query("INSERT INTO member_sessions(token_hash,wallet,expires_at) VALUES($1,$2,now()+interval '30 minutes')",[hash(token),c.wallet]);
await db.query("COMMIT");return respond(res,200,{ok:true,member,transactionsEnabled:false},COOKIE+"="+token+"; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=1800");
}catch(e){await db.query("ROLLBACK").catch(()=>{});throw e;}finally{db.release();}
}
if(path==="/api/member/session"&&req.method==="GET"){const wallet=await session(req);if(!wallet)return respond(res,401,{ok:false,error:"AUTH_REQUIRED"});return respond(res,200,{ok:true,member:await profile(pool,wallet),transactionsEnabled:false});}
if(path==="/api/member/logout"&&req.method==="POST"){const t=cookieToken(req);if(t)await pool.query("DELETE FROM member_sessions WHERE token_hash=$1",[hash(t)]);return respond(res,200,{ok:true},COOKIE+"=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0");}
return respond(res,404,{ok:false,error:"NOT_FOUND"});
}catch(e){console.error("ATH member request failed",e.code||e.name);return respond(res,400,{ok:false,error:"REQUEST_FAILED"});}
});
server.requestTimeout=10000;server.headersTimeout=8000;server.maxHeadersCount=64;
server.listen(8185,"127.0.0.1",()=>console.log("ATH Staking member API listening on loopback; transactions disabled"));
