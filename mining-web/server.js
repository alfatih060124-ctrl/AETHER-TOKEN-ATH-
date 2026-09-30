const http = require("http");
const fs = require("fs");
const path = require("path");
const { streamWhitepaper } = require("./whitepaper");
const { answerQuestion, cleanQuestion } = require("./assistant");

const PORT = Number(process.env.PORT || 8080);
const PUBLIC_DIR = path.join(__dirname, "public");
const aiRate = new Map();

function clientIp(req) {
  return String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown")
    .split(",")[0]
    .trim();
}

function aiAllowed(req) {
  const key = clientIp(req);
  const now = Date.now();
  const windowMs = 60 * 1000;
  const max = 20;
  const state = aiRate.get(key) || { start: now, count: 0 };
  if (now - state.start >= windowMs) {
    state.start = now;
    state.count = 0;
  }
  state.count += 1;
  aiRate.set(key, state);
  return state.count <= max;
}

function readJson(req, maxBytes = 24 * 1024) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      raw += chunk;
      if (Buffer.byteLength(raw) > maxBytes) {
        reject(new Error("Payload too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(raw || "{}"));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
};

function configPayload() {
  return {
    appName: "AETHER ATH Mining",
    miningProtocolVersion: "3.3",
    whitepaperVersion: "1.1",
    networkMode: (process.env.NETWORK_MODE || "TESTNET").toUpperCase(),
    chainId: Number(process.env.PUBLIC_CHAIN_ID || 97),
    chainName: process.env.PUBLIC_CHAIN_NAME || "BSC Testnet",
    rpcUrl: process.env.PUBLIC_RPC_URL || "https://bsc-testnet-rpc.publicnode.com",
    explorerUrl: process.env.PUBLIC_EXPLORER_URL || "https://testnet.bscscan.com",
    miningAddress: (process.env.ATH_MINING_ADDRESS || "").trim(),
    tokenAddress: (process.env.ATH_TOKEN_ADDRESS || "").trim(),
    teamLockAddress: (process.env.ATH_TEAM_LOCK_ADDRESS || "").trim(),
    liquidityWallet: (process.env.PUBLIC_LIQUIDITY_WALLET || "").trim(),
    marketingWallet: (process.env.PUBLIC_MARKETING_WALLET || "").trim(),
    teamBeneficiary: (process.env.PUBLIC_TEAM_BENEFICIARY || "").trim(),
    powerPriceBnb: "0.001",
    boosterPriceBnb: "0.001",
    maxMiningDays: 180,
    mainnetEnabled: process.env.ALLOW_MAINNET_DEPLOY === "true",
    adminMainnetWritesEnabled: process.env.ADMIN_MAINNET_WRITES_ENABLED === "true",
  };
}

function send(res, status, body, type) {
  res.writeHead(status, {
    "content-type": type,
    "cache-control": type.includes("html") || type.includes("json")
      ? "no-store"
      : "public, max-age=300",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "strict-origin-when-cross-origin",
  });
  res.end(body);
}

function safePublicPath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const normalized = path.posix.normalize(decoded).replace(/^\.\.(\/|\\|$)/g, "");
  const relative = normalized === "/"
    ? "index.html"
    : normalized === "/admin" || normalized === "/admin/"
      ? "admin.html"
      : normalized.replace(/^\//, "");
  const full = path.join(PUBLIC_DIR, relative);
  if (!full.startsWith(PUBLIC_DIR)) return null;
  return full;
}

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    const cfg = configPayload();
    return send(
      res,
      200,
      JSON.stringify({
        ok: true,
        service: "aether-ath-mining-web",
        miningProtocolVersion: cfg.miningProtocolVersion,
        whitepaperVersion: cfg.whitepaperVersion,
        networkMode: cfg.networkMode,
        contractConfigured: Boolean(cfg.miningAddress),
        mainnetEnabled: cfg.mainnetEnabled,
        aiAssistant: {
          available: true,
          providerConfigured: Boolean(
            process.env.AI_API_KEY && process.env.AI_API_URL && process.env.AI_MODEL
          ),
          fallback: "aether-knowledge",
        },
      }),
      MIME[".json"]
    );
  }

  if (req.url === "/api/assistant" && req.method === "POST") {
    if (!aiAllowed(req)) {
      return send(
        res,
        429,
        JSON.stringify({ ok: false, error: "Too many requests. Please try again shortly." }),
        MIME[".json"]
      );
    }

    return readJson(req)
      .then(async (body) => {
        const question = cleanQuestion(body?.question || "");
        if (!question) {
          return send(
            res,
            400,
            JSON.stringify({ ok: false, error: "Please enter a question." }),
            MIME[".json"]
          );
        }

        const result = await answerQuestion(question, configPayload());
        return send(
          res,
          200,
          JSON.stringify({ ok: true, ...result }),
          MIME[".json"]
        );
      })
      .catch((error) =>
        send(
          res,
          error.message === "Payload too large" ? 413 : 400,
          JSON.stringify({ ok: false, error: error.message || "Invalid request." }),
          MIME[".json"]
        )
      );
  }

  if (
    req.url === "/ATH-Whitepaper-v1.1.pdf" ||
    req.url === "/ATH-Whitepaper-v1.0.pdf" ||
    req.url === "/whitepaper.pdf"
  ) {
    return streamWhitepaper(res);
  }

  if (req.url === "/config") {
    return send(res, 200, JSON.stringify(configPayload()), MIME[".json"]);
  }

  const full = safePublicPath(req.url || "/");
  if (!full) return send(res, 400, "Bad request", "text/plain; charset=utf-8");

  fs.stat(full, (statErr, stat) => {
    if (!statErr && stat.isFile()) {
      const ext = path.extname(full).toLowerCase();
      res.writeHead(200, {
        "content-type": MIME[ext] || "application/octet-stream",
        "cache-control": ext === ".html" ? "no-store" : "public, max-age=300",
        "x-content-type-options": "nosniff",
        "x-frame-options": "DENY",
        "referrer-policy": "strict-origin-when-cross-origin",
      });
      fs.createReadStream(full).pipe(res);
      return;
    }

    const index = path.join(PUBLIC_DIR, "index.html");
    fs.readFile(index, (err, data) => {
      if (err) return send(res, 404, "Not found", "text/plain; charset=utf-8");
      send(res, 200, data, MIME[".html"]);
    });
  });
});

server.listen(PORT, "0.0.0.0", () => {
  const cfg = configPayload();
  console.log(`AETHER ATH Mining web listening on ${PORT}; mode=${cfg.networkMode}; contractConfigured=${Boolean(cfg.miningAddress)}; mainnetEnabled=${cfg.mainnetEnabled}`);
});