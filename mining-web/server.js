const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { verifyMessage, isAddress, getAddress } = require("ethers");
const { streamWhitepaper } = require("./whitepaper");
const { answerQuestion, cleanQuestion } = require("./assistant");

const PORT = Number(process.env.PORT || 8080);
const PUBLIC_DIR = path.join(__dirname, "public");
const ETHERS_BROWSER_BUNDLE = path.join(
  path.dirname(require.resolve("ethers")),
  "..",
  "dist",
  "ethers.umd.min.js"
);
const aiRate = new Map();
const adminAuthRate = new Map();
const adminChallenges = new Map();
const adminSessions = new Map();
const ADMIN_CHALLENGE_TTL_MS = 5 * 60 * 1000;
const ADMIN_SESSION_TTL_MS = 30 * 60 * 1000;
const ADMIN_SESSION_COOKIE = "ath_admin_session";

function adminRoleAddress(role) {
  const envByRole = {
    mining: "MINING_OWNER_ADDRESS",
    staking: "STAKING_OWNER_ADDRESS",
    presale: "PRESALE_OWNER_ADDRESS",
  };
  const envName = envByRole[role];
  return envName ? String(process.env[envName] || "").trim() : "";
}

function adminRoleLabel(role) {
  return {
    mining: "Mining Control",
    staking: "Staking Control",
    presale: "Token & Presale Control",
  }[role] || "Admin Control";
}

function authAllowed(req) {
  const key = clientIp(req);
  const now = Date.now();
  const windowMs = 60 * 1000;
  const max = 12;
  const state = adminAuthRate.get(key) || { start: now, count: 0 };
  if (now - state.start >= windowMs) {
    state.start = now;
    state.count = 0;
  }
  state.count += 1;
  adminAuthRate.set(key, state);
  return state.count <= max;
}

function parseCookies(req) {
  const out = {};
  String(req.headers.cookie || "").split(";").forEach((part) => {
    const i = part.indexOf("=");
    if (i <= 0) return;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

function pruneAdminAuth() {
  const now = Date.now();
  for (const [key, value] of adminChallenges) if (value.expiresAt <= now) adminChallenges.delete(key);
  for (const [key, value] of adminSessions) if (value.expiresAt <= now) adminSessions.delete(key);
}

function getAdminSession(req) {
  pruneAdminAuth();
  const id = parseCookies(req)[ADMIN_SESSION_COOKIE];
  if (!id) return null;
  const session = adminSessions.get(id);
  if (!session || session.expiresAt <= Date.now()) {
    if (id) adminSessions.delete(id);
    return null;
  }
  return { id, ...session };
}

function adminPublicConfig() {
  const cfg = configPayload();
  return {
    appName: cfg.appName,
    networkMode: cfg.networkMode,
    chainId: cfg.chainId,
    chainName: cfg.chainName,
    rpcUrl: cfg.rpcUrl,
    explorerUrl: cfg.explorerUrl,
    walletGate: true,
  };
}

function adminConfigForSession(session) {
  const cfg = configPayload();
  return {
    ...cfg,
    adminRole: session.role,
    adminRoleLabel: adminRoleLabel(session.role),
    authenticatedAddress: session.address,
    expectedMiningAdmin: session.role === "mining" ? cfg.expectedMiningAdmin : "",
    expectedMiningTreasury: session.role === "mining" ? cfg.expectedMiningTreasury : "",
    expectedStakingAdmin: session.role === "staking" ? cfg.expectedStakingAdmin : "",
    expectedKeeperWallet: session.role === "staking" ? cfg.expectedKeeperWallet : "",
    expectedPresaleAdmin: session.role === "presale" ? cfg.expectedPresaleAdmin : "",
    expectedPresaleTreasury: session.role === "presale" ? cfg.expectedPresaleTreasury : "",
  };
}

function sameOriginAdmin(req) {
  const origin = String(req.headers.origin || "");
  if (!origin) return true;
  try {
    const u = new URL(origin);
    return u.hostname.toLowerCase() === "pm.aether.boats";
  } catch {
    return false;
  }
}

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
    appName: "AETHER ATH",
    miningProtocolVersion: "3.3",
    stakingProtocolVersion: "1.0",
    whitepaperVersion: "1.1",
    networkMode: (process.env.NETWORK_MODE || "TESTNET").toUpperCase(),
    chainId: Number(process.env.PUBLIC_CHAIN_ID || 97),
    chainName: process.env.PUBLIC_CHAIN_NAME || "BSC Testnet",
    rpcUrl: process.env.PUBLIC_RPC_URL || "https://bsc-testnet-rpc.publicnode.com",
    explorerUrl: process.env.PUBLIC_EXPLORER_URL || "https://testnet.bscscan.com",
    miningAddress: (process.env.ATH_MINING_ADDRESS || "").trim(),
    stakingAddress: (process.env.ATH_STAKING_ADDRESS || "").trim(),
    stakingOracleAddress: (process.env.ATH_STAKING_ORACLE_ADDRESS || "").trim(),
    priceRegistryAddress: (process.env.ATH_PRICE_REGISTRY_ADDRESS || "").trim(),
    presaleAddress: (process.env.ATH_PRESALE_ADDRESS || "").trim(),
    presalePaymentToken: (process.env.PRESALE_PAYMENT_TOKEN || "").trim(),
    tokenAddress: (process.env.ATH_TOKEN_ADDRESS || "").trim(),
    expectedMiningAdmin: (process.env.MINING_OWNER_ADDRESS || "").trim(),
    expectedMiningTreasury: (process.env.MINING_TREASURY_ADDRESS || "").trim(),
    expectedStakingAdmin: (process.env.STAKING_OWNER_ADDRESS || "").trim(),
    expectedPresaleAdmin: (process.env.PRESALE_OWNER_ADDRESS || "").trim(),
    expectedKeeperWallet: (process.env.KEEPER_WALLET_ADDRESS || "").trim(),
    expectedPresaleTreasury: (process.env.PRESALE_WALLET || "").trim(),
    teamLockAddress: (process.env.ATH_TEAM_LOCK_ADDRESS || "").trim(),
    liquidityWallet: (process.env.PUBLIC_LIQUIDITY_WALLET || "").trim(),
    marketingWallet: (process.env.PUBLIC_MARKETING_WALLET || "").trim(),
    teamBeneficiary: (process.env.PUBLIC_TEAM_BENEFICIARY || "").trim(),
    powerPriceBnb: "0.001",
    boosterPriceBnb: "0.001",
    maxMiningDays: 180,
    preListingPriceUsd: "0.07",
    priceSource: "PRESALE_LINKED",
    presaleOpeningPriceUsd: "0.07",
    presalePriceStepUsd: "0.001",
    presaleStepSizeAth: 100000,
    presaleSoldOutPriceUsd: "0.37",
    listingHolderTarget: 15000,
    mainnetEnabled: process.env.ALLOW_MAINNET_DEPLOY === "true",
    adminMainnetWritesEnabled: process.env.ADMIN_MAINNET_WRITES_ENABLED === "true",
  };
}

function baseSecurityHeaders(controlPanelHost = false) {
  const headers = {
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": controlPanelHost ? "no-referrer" : "strict-origin-when-cross-origin",
    "strict-transport-security": "max-age=31536000; includeSubDomains",
    "permissions-policy": "camera=(), microphone=(), geolocation=()",
    "cross-origin-opener-policy": "same-origin",
  };
  if (controlPanelHost) {
    headers["x-robots-tag"] = "noindex, nofollow, noarchive";
    headers["content-security-policy"] = [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self'",
      "img-src 'self' data:",
      "connect-src 'self' https: wss:",
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "form-action 'self'",
    ].join("; ");
  }
  return headers;
}

function send(res, status, body, type, controlPanelHost = false, extraHeaders = {}) {
  res.writeHead(status, {
    "content-type": type,
    "cache-control": type.includes("html") || type.includes("json")
      ? "no-store"
      : "public, max-age=300",
    ...baseSecurityHeaders(controlPanelHost),
    ...extraHeaders,
  });
  res.end(body);
}

function isControlPanelHost(req) {
  const host = String(req.headers.host || "").split(":")[0].toLowerCase();
  return host === "pm.aether.boats";
}

const ADMIN_PUBLIC_FILES = new Set(["/admin", "/admin/", "/admin.html", "/admin.js", "/admin-login.html", "/admin-login.js", "/admin.css"]);
const CONTROL_PANEL_ALLOWED_FILES = new Set([
  "/", "/admin", "/admin/", "/admin.html", "/admin.js",
  "/admin-login.html", "/admin-login.js", "/admin.css", "/favicon.ico"
]);

function safePublicPath(urlPath, controlPanelHost = false) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const normalized = path.posix.normalize(decoded).replace(/^\.\.(\/|\\|$)/g, "");

  if (!controlPanelHost && ADMIN_PUBLIC_FILES.has(normalized)) return null;
  if (controlPanelHost && !CONTROL_PANEL_ALLOWED_FILES.has(normalized)) return null;

  let relative;
  if (controlPanelHost && normalized === "/") {
    relative = "admin-login.html";
  } else if (controlPanelHost && (normalized === "/admin" || normalized === "/admin/")) {
    relative = "admin.html";
  } else if (!controlPanelHost && (normalized === "/" || normalized === "/admin" || normalized === "/admin/")) {
    relative = "index.html";
  } else {
    relative = normalized.replace(/^\//, "");
  }
  const full = path.join(PUBLIC_DIR, relative);
  if (!full.startsWith(PUBLIC_DIR)) return null;
  return full;
}

const server = http.createServer((req, res) => {
  const controlPanelHost = isControlPanelHost(req);
  const requestPath = String(req.url || "/").split("?")[0];
  const controlPanelAllowedRequest = new Set([
    "/", "/admin", "/admin/", "/admin.html", "/admin.js",
    "/admin-login.html", "/admin-login.js", "/admin.css", "/vendor/ethers.umd.min.js",
    "/config", "/health", "/favicon.ico",
    "/api/admin/challenge", "/api/admin/verify", "/api/admin/session",
    "/api/admin/config", "/api/admin/logout",
  ]);

  if (controlPanelHost && !controlPanelAllowedRequest.has(requestPath)) {
    return send(res, 404, "Not found", "text/plain; charset=utf-8", true);
  }

  if (controlPanelHost && requestPath === "/vendor/ethers.umd.min.js" && req.method === "GET") {
    return fs.readFile(ETHERS_BROWSER_BUNDLE, (err, data) => {
      if (err) {
        console.error("Unable to load local ethers browser bundle:", err.message || err);
        return send(res, 500, "Vendor bundle unavailable", "text/plain; charset=utf-8", true);
      }
      return send(
        res,
        200,
        data,
        MIME[".js"],
        true,
        { "cache-control": "public, max-age=86400, immutable" }
      );
    });
  }

  if (controlPanelHost && requestPath === "/api/admin/challenge" && req.method === "GET") {
    if (!authAllowed(req)) {
      return send(res, 429, JSON.stringify({ ok: false, error: "Too many authentication attempts." }), MIME[".json"], true);
    }
    const url = new URL(req.url, "https://pm.aether.boats");
    const role = String(url.searchParams.get("role") || "").toLowerCase();
    const rawAddress = String(url.searchParams.get("address") || "");
    const expected = adminRoleAddress(role);
    if (!expected || !isAddress(expected) || !isAddress(rawAddress) || getAddress(rawAddress) !== getAddress(expected)) {
      return send(res, 403, JSON.stringify({ ok: false, error: "Wallet not authorized for the selected admin role." }), MIME[".json"], true);
    }
    pruneAdminAuth();
    const nonce = crypto.randomBytes(24).toString("hex");
    const expiresAt = Date.now() + ADMIN_CHALLENGE_TTL_MS;
    const address = getAddress(rawAddress);
    const message = [
      "AETHER ATH Admin Authentication",
      "Domain: pm.aether.boats",
      "Role: " + adminRoleLabel(role),
      "Address: " + address,
      "Chain ID: " + configPayload().chainId,
      "Nonce: " + nonce,
      "Expires: " + new Date(expiresAt).toISOString(),
      "",
      "Sign this message only to authenticate to the AETHER Control Panel.",
      "This signature does not authorize a blockchain transaction.",
    ].join("\n");
    adminChallenges.set(nonce, { role, address, message, expiresAt });
    return send(res, 200, JSON.stringify({ ok: true, nonce, message, expiresAt }), MIME[".json"], true);
  }

  if (controlPanelHost && requestPath === "/api/admin/verify" && req.method === "POST") {
    if (!sameOriginAdmin(req)) {
      return send(res, 403, JSON.stringify({ ok: false, error: "Invalid request origin." }), MIME[".json"], true);
    }
    if (!authAllowed(req)) {
      return send(res, 429, JSON.stringify({ ok: false, error: "Too many authentication attempts." }), MIME[".json"], true);
    }
    return readJson(req, 12 * 1024)
      .then((body) => {
        pruneAdminAuth();
        const role = String(body?.role || "").toLowerCase();
        const nonce = String(body?.nonce || "");
        const signature = String(body?.signature || "");
        const rawAddress = String(body?.address || "");
        const challenge = adminChallenges.get(nonce);
        adminChallenges.delete(nonce);
        if (!challenge || challenge.expiresAt <= Date.now() || challenge.role !== role || !isAddress(rawAddress)) {
          throw new Error("Invalid or expired authentication challenge.");
        }
        const address = getAddress(rawAddress);
        const expected = adminRoleAddress(role);
        if (!expected || getAddress(expected) !== address || challenge.address !== address) {
          throw new Error("Wallet not authorized for the selected admin role.");
        }
        const recovered = getAddress(verifyMessage(challenge.message, signature));
        if (recovered !== address) throw new Error("Wallet signature verification failed.");

        const sessionId = crypto.randomBytes(32).toString("hex");
        const expiresAt = Date.now() + ADMIN_SESSION_TTL_MS;
        adminSessions.set(sessionId, { role, address, expiresAt });
        const cookie = [
          ADMIN_SESSION_COOKIE + "=" + sessionId,
          "HttpOnly",
          "Secure",
          "SameSite=Strict",
          "Path=/",
          "Max-Age=" + Math.floor(ADMIN_SESSION_TTL_MS / 1000),
        ].join("; ");
        return send(
          res,
          200,
          JSON.stringify({ ok: true, role, roleLabel: adminRoleLabel(role), expiresAt }),
          MIME[".json"],
          true,
          { "set-cookie": cookie }
        );
      })
      .catch((error) =>
        send(res, 403, JSON.stringify({ ok: false, error: error.message || "Authentication failed." }), MIME[".json"], true)
      );
  }

  if (controlPanelHost && requestPath === "/api/admin/session" && req.method === "GET") {
    const session = getAdminSession(req);
    return send(
      res,
      session ? 200 : 401,
      JSON.stringify(session
        ? { ok: true, role: session.role, roleLabel: adminRoleLabel(session.role), address: session.address, expiresAt: session.expiresAt }
        : { ok: false, error: "No active admin session." }),
      MIME[".json"],
      true
    );
  }

  if (controlPanelHost && requestPath === "/api/admin/config" && req.method === "GET") {
    const session = getAdminSession(req);
    if (!session) {
      return send(res, 401, JSON.stringify({ ok: false, error: "Admin wallet authentication required." }), MIME[".json"], true);
    }
    return send(res, 200, JSON.stringify(adminConfigForSession(session)), MIME[".json"], true);
  }

  if (controlPanelHost && requestPath === "/api/admin/logout" && req.method === "POST") {
    if (!sameOriginAdmin(req)) {
      return send(res, 403, JSON.stringify({ ok: false, error: "Invalid request origin." }), MIME[".json"], true);
    }
    const session = getAdminSession(req);
    if (session) adminSessions.delete(session.id);
    return send(
      res,
      200,
      JSON.stringify({ ok: true }),
      MIME[".json"],
      true,
      { "set-cookie": ADMIN_SESSION_COOKIE + "=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0" }
    );
  }

  if (controlPanelHost && ["/admin", "/admin/", "/admin.html", "/admin.js"].includes(requestPath)) {
    const session = getAdminSession(req);
    if (!session) {
      if (requestPath === "/admin.js") {
        return send(res, 401, "Authentication required", "text/plain; charset=utf-8", true);
      }
      res.writeHead(302, { location: "/", "cache-control": "no-store", ...baseSecurityHeaders(true) });
      return res.end();
    }
  }

  if (req.url === "/health") {
    if (controlPanelHost) {
      return send(res, 200, JSON.stringify({ ok: true, service: "aether-ath-control-gate" }), MIME[".json"], true);
    }
    const cfg = configPayload();
    return send(
      res,
      200,
      JSON.stringify({
        ok: true,
        service: "aether-ath-unified-web",
        miningProtocolVersion: cfg.miningProtocolVersion,
        whitepaperVersion: cfg.whitepaperVersion,
        networkMode: cfg.networkMode,
        contractConfigured: Boolean(cfg.miningAddress),
        stakingConfigured: Boolean(cfg.stakingAddress),
        priceRegistryConfigured: Boolean(cfg.priceRegistryAddress),
        presaleConfigured: Boolean(cfg.presaleAddress && cfg.presalePaymentToken),
        mainnetEnabled: cfg.mainnetEnabled,
        aiAssistant: {
          available: true,
          providerConfigured: Boolean(
            process.env.AI_API_KEY && process.env.AI_API_URL && process.env.AI_MODEL
          ),
          fallback: "aether-knowledge",
        },
      }),
      MIME[".json"],
      controlPanelHost
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
    return send(
      res,
      200,
      JSON.stringify(controlPanelHost ? adminPublicConfig() : configPayload()),
      MIME[".json"],
      controlPanelHost
    );
  }

  const full = safePublicPath(req.url || "/", controlPanelHost);
  if (!full) return send(res, 404, "Not found", "text/plain; charset=utf-8", controlPanelHost);

  fs.stat(full, (statErr, stat) => {
    if (!statErr && stat.isFile()) {
      const ext = path.extname(full).toLowerCase();
      res.writeHead(200, {
        "content-type": MIME[ext] || "application/octet-stream",
        "cache-control": ext === ".html" ? "no-store" : "public, max-age=300",
        ...baseSecurityHeaders(controlPanelHost),
      });
      fs.createReadStream(full).pipe(res);
      return;
    }

    if (controlPanelHost) {
      return send(res, 404, "Not found", "text/plain; charset=utf-8", true);
    }
    const index = path.join(PUBLIC_DIR, "index.html");
    fs.readFile(index, (err, data) => {
      if (err) return send(res, 404, "Not found", "text/plain; charset=utf-8");
      send(res, 200, data, MIME[".html"]);
    });
  });
});

server.requestTimeout = 15000;
server.headersTimeout = 10000;
server.keepAliveTimeout = 5000;
server.maxHeadersCount = 64;

server.listen(PORT, "0.0.0.0", () => {
  const cfg = configPayload();
  console.log(`AETHER ATH Mining web listening on ${PORT}; mode=${cfg.networkMode}; contractConfigured=${Boolean(cfg.miningAddress)}; mainnetEnabled=${cfg.mainnetEnabled}`);
});