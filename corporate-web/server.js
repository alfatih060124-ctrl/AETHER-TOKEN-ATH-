const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 8080);
const PUBLIC = path.join(__dirname, "public");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".webmanifest": "application/manifest+json; charset=utf-8"
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
    "permissions-policy": "camera=(), microphone=(), geolocation=()",
    "x-frame-options": "SAMEORIGIN",
    "strict-transport-security": "max-age=31536000; includeSubDomains",
    "cross-origin-opener-policy": "same-origin",
    "cross-origin-resource-policy": "same-origin",
    "content-security-policy": "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'",
    ...headers
  });
  res.end(body);
}


const AI_SYSTEM = `You are AETHER AI, the official multilingual assistant on AETHER Corporate. Reply in the user's language. Be concise, factual, and helpful. Explain AETHER Wallet, ATH Token & Mining, AETHER AUTOTRADE, AETHER AI, security, and official ecosystem navigation. Official routes: Corporate https://aether.boats/ ; Wallet https://wallet.aether.boats/ ; ATH Mining https://mining.aether.boats/ ; AUTOTRADE https://aitrade.aether.boats/ ; Telegram bot https://t.me/Aetther_bot . Never ask for or accept seed phrases, private keys, passwords, OTPs, or recovery secrets. Never claim guaranteed profit, yield, token price, or trading return. If unsure, say so and direct the user to an official route.`;

function json(res,status,obj){ return send(res,status,JSON.stringify(obj),{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}); }
function readJson(req,limit=8192){return new Promise((resolve,reject)=>{let raw="";req.on("data",d=>{raw+=d;if(raw.length>limit){reject(new Error("too_large"));req.destroy();}});req.on("end",()=>{try{resolve(JSON.parse(raw||"{}"))}catch(e){reject(e)}});req.on("error",reject);});}
function sensitive(s){return /(seed phrase|private key|recovery phrase|mnemonic|frasa pemulihan|kunci pribadi|password|kata sandi|otp|12 words|24 words)/i.test(s);}
const aiHits=new Map();
function rateLimited(req){
  const ip=String(req.headers["x-forwarded-for"]||req.socket.remoteAddress||"unknown").split(",")[0].trim();
  const now=Date.now(), windowMs=60000, max=20;
  const row=aiHits.get(ip)||{start:now,count:0};
  if(now-row.start>windowMs){row.start=now;row.count=0;}
  row.count++; aiHits.set(ip,row);
  if(aiHits.size>5000) for(const [k,v] of aiHits) if(now-v.start>windowMs*2) aiHits.delete(k);
  return row.count>max;
}
function localAI(message,language){
  const m=message.toLowerCase();
  const id=/^(id|id-)/i.test(language)||/(apa|bagaimana|dompet|tambang|keamanan|aman|bagikan|saya|kami|tentang|adalah|untuk)/i.test(m);
  const L={
    wallet:id?"AETHER Wallet adalah bagian ekosistem AETHER untuk pengelolaan aset digital dan koneksi Web3. Gunakan hanya situs resmi: https://wallet.aether.boats/ dan jangan pernah membagikan seed phrase atau private key.":"AETHER Wallet is the AETHER ecosystem interface for digital assets and Web3 connectivity. Use only https://wallet.aether.boats/ and never share a seed phrase or private key.",
    mining:id?"ATH Mining dapat diakses melalui https://mining.aether.boats/. Informasi status, reward, dan aturan harus mengikuti halaman resmi; AETHER AI tidak menjanjikan profit atau hasil tertentu.":"ATH Mining is available at https://mining.aether.boats/. Status, rewards and rules should follow the official page; AETHER AI does not promise profit or returns.",
    trade:id?"AETHER AUTOTRADE dapat diakses di https://aitrade.aether.boats/. Status trading harus mengikuti informasi runtime resmi; jangan menganggap fitur LIVE aktif kecuali dinyatakan dan diverifikasi di layanan tersebut.":"AETHER AUTOTRADE is at https://aitrade.aether.boats/. Trading status must follow the official runtime information; do not assume LIVE trading is enabled unless the service explicitly verifies it.",
    security:id?"Untuk keamanan, jangan pernah berikan seed phrase, private key, password, OTP, atau recovery phrase kepada siapa pun, termasuk AETHER AI. Gunakan hanya domain resmi AETHER.":"For security, never give anyone your seed phrase, private key, password, OTP, or recovery phrase, including AETHER AI. Use only official AETHER domains.",
    general:id?"Saya AETHER AI Assistant. Saya dapat membantu tentang AETHER Wallet, ATH Token & Mining, AUTOTRADE, keamanan, dan navigasi ekosistem. Corporate: https://aether.boats/ • Wallet: https://wallet.aether.boats/ • Mining: https://mining.aether.boats/ • AUTOTRADE: https://aitrade.aether.boats/":"I’m AETHER AI Assistant. I can help with AETHER Wallet, ATH Token & Mining, AUTOTRADE, security, and ecosystem navigation. Corporate: https://aether.boats/ • Wallet: https://wallet.aether.boats/ • Mining: https://mining.aether.boats/ • AUTOTRADE: https://aitrade.aether.boats/"
  };
  if(/wallet|dompet/.test(m)) return L.wallet;
  if(/mining|mine|reward|ath token|token ath/.test(m)) return L.mining;
  if(/autotrade|ai trade|trading|trade/.test(m)) return L.trade;
  if(/security|secure|aman|keamanan|scam|phish/.test(m)) return L.security;
  return L.general;
}
async function callAI(message,language){
  const key=process.env.OPENAI_API_KEY;
  if(!key) return null;
  const body=JSON.stringify({model:process.env.AETHER_AI_MODEL||"gpt-5-mini",input:[{role:"system",content:AI_SYSTEM},{role:"user",content:"Browser language: "+language+"\
User: "+message}],max_output_tokens:500});
  const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"authorization":"Bearer "+key,"content-type":"application/json"},body});
  if(!r.ok) throw new Error("provider_"+r.status);
  const j=await r.json();
  if(j.output_text) return j.output_text;
  for(const o of (j.output||[])) for(const x of (o.content||[])) if(x.text) return x.text;
  return null;
}

const server = http.createServer(async (req, res) => {
  if (!["GET", "HEAD", "POST"].includes(req.method)) return send(res, 405, "Method Not Allowed", {"allow":"GET, HEAD, POST","cache-control":"no-store"});
  if (req.headers["content-length"] && Number(req.headers["content-length"]) > 8192) return json(res, 413, {reply:"Request too large."});
  const url = new URL(req.url, "http://localhost");
  if (req.method === "POST" && url.pathname !== "/api/ai") return send(res, 404, "Not found", {"cache-control":"no-store"});
  if (url.pathname === "/api/ai" && req.method === "POST") {
    if(!String(req.headers["content-type"]||"").toLowerCase().startsWith("application/json")) return json(res,415,{reply:"JSON content type required."});
    try {
      const data=await readJson(req);
      const message=String(data.message||"").trim().slice(0,1200);
      const language=String(data.language||"en").slice(0,32);
      if(!message) return json(res,400,{reply:"Please enter a message."});
      if(rateLimited(req)) return json(res,429,{reply:"Too many requests. Please wait a moment and try again."});
      if(sensitive(message)) return json(res,200,{reply:"For your security, never share a seed phrase, private key, recovery phrase, password or OTP with AETHER AI or anyone else. I can help without those secrets."});
      const reply=await callAI(message,language);
      if(!reply) return json(res,200,{reply:localAI(message,language),mode:"knowledge"});
      return json(res,200,{reply});
    } catch(e) { return json(res,200,{reply:localAI(String((e&&e.message)||""),"en"),mode:"knowledge"}); }
  }

  if (url.pathname === "/health") {
    return send(res, 200, JSON.stringify({
      ok: true,
      service: "aether-corporate-web",
      brand: "AETHER",
      version: "1.0.0"
    }), {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    });
  }

  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";
  if (pathname === "/knowledge" || pathname === "/product-knowledge") pathname = "/product-knowledge.html";
  if (pathname === "/knowledge" || pathname === "/product-knowledge") pathname = "/product-knowledge.html";
  if (pathname === "/favicon.ico") pathname = "/favicon.svg";
  const file = path.normalize(path.join(PUBLIC, pathname));
  if (!file.startsWith(PUBLIC)) return send(res, 403, "Forbidden");

  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) return send(res, 404, "Not found");
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, {
      "content-type": TYPES[ext] || "application/octet-stream",
      "cache-control": ext === ".html" ? "public, max-age=300" : "public, max-age=86400",
      "x-content-type-options": "nosniff",
      "referrer-policy": "strict-origin-when-cross-origin",
      "permissions-policy": "camera=(), microphone=(), geolocation=()",
      "x-frame-options": "SAMEORIGIN",
      "strict-transport-security": "max-age=31536000",
      "content-security-policy": "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'"
    });
    fs.createReadStream(file).pipe(res);
  });
});

server.requestTimeout=15000;
server.headersTimeout=10000;
server.keepAliveTimeout=5000;
server.maxHeadersCount=64;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`AETHER Corporate web listening on ${PORT}`);
});
