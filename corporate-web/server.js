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
    "strict-transport-security": "max-age=31536000",
    "content-security-policy": "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'",
    ...headers
  });
  res.end(body);
}


const AI_SYSTEM = `You are AETHER AI, the official multilingual assistant on AETHER Corporate. Reply in the user's language. Be concise, factual, and helpful. Explain AETHER Wallet, ATH Token & Mining, AETHER AUTOTRADE, AETHER AI, security, and official ecosystem navigation. Official routes: Corporate https://aether.boats/ ; Wallet https://wallet.aether.boats/ ; ATH Mining https://mining.aether.boats/ ; AUTOTRADE https://aitrade.aether.boats/ ; Telegram bot https://t.me/Aetther_bot . Never ask for or accept seed phrases, private keys, passwords, OTPs, or recovery secrets. Never claim guaranteed profit, yield, token price, or trading return. If unsure, say so and direct the user to an official route.`;

function json(res,status,obj){ return send(res,status,JSON.stringify(obj),{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}); }
function readJson(req,limit=8192){return new Promise((resolve,reject)=>{let raw="";req.on("data",d=>{raw+=d;if(raw.length>limit){reject(new Error("too_large"));req.destroy();}});req.on("end",()=>{try{resolve(JSON.parse(raw||"{}"))}catch(e){reject(e)}});req.on("error",reject);});}
function sensitive(s){return /(seed phrase|private key|recovery phrase|mnemonic|frasa pemulihan|kunci pribadi|12 words|24 words)/i.test(s);}
async function callAI(message,language){
  const key=process.env.OPENAI_API_KEY;
  if(!key) return null;
  const body=JSON.stringify({model:process.env.AETHER_AI_MODEL||"gpt-5-mini",input:[{role:"system",content:AI_SYSTEM},{role:"user",content:"Browser language: "+language+"\\nUser: "+message}],max_output_tokens:500});
  const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"authorization":"Bearer "+key,"content-type":"application/json"},body});
  if(!r.ok) throw new Error("provider_"+r.status);
  const j=await r.json();
  if(j.output_text) return j.output_text;
  for(const o of (j.output||[])) for(const x of (o.content||[])) if(x.text) return x.text;
  return null;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/api/ai" && req.method === "POST") {\n    try {\n      const data=await readJson(req);\n      const message=String(data.message||"").trim().slice(0,1200);\n      const language=String(data.language||"en").slice(0,32);\n      if(!message) return json(res,400,{reply:"Please enter a message."});\n      if(sensitive(message)) return json(res,200,{reply:"For your security, never share a seed phrase, private key, recovery phrase, password or OTP with AETHER AI or anyone else. I can help without those secrets."});\n      const reply=await callAI(message,language);\n      if(!reply) return json(res,503,{reply:"AETHER AI is being activated. Meanwhile, please use the official AETHER links on this page."});\n      return json(res,200,{reply});\n    } catch(e) { return json(res,503,{reply:"AETHER AI is temporarily unavailable. Please use the official AETHER links on this page."}); }\n  }\n\n  if (url.pathname === "/health") {
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

server.listen(PORT, "0.0.0.0", () => {
  console.log(`AETHER Corporate web listening on ${PORT}`);
});
