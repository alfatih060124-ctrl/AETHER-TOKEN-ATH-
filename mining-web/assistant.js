const DEFAULT_WALLET_URL = "https://wallet.aether.boats/";
const DEFAULT_MINING_URL = "https://mining.aether.boats/";
const DEFAULT_WEBSITE_URL = "https://aether.boats/";
const DEFAULT_BOT_URL = "https://t.me/Aetther_bot";

const KNOWLEDGE = [
  {
    keys: ["features", "services", "facilities", "fitur", "layanan", "what can aether do", "all aether"],
    answer: () => [
      "<b>AETHER Ecosystem — Features & Services</b>",
      "",
      "AETHER is designed as a multi-service Web3 ecosystem. Holder guidance covers:",
      "• Create / Import Wallet and Watch-Only",
      "• Multi-wallet and supported multi-chain access",
      "• Assets, balances and token views",
      "• Send / Receive and QR workflows",
      "• Import Custom Token",
      "• Swap / DEX and market data where supported",
      "• Discover / DApps / Web3 connections",
      "• Custom Network / RPC health and fallback",
      "• Staking & Earn through supported providers",
      "• ATH Mining and referral routes",
      "• AI-Trade access where product gates allow it",
      "• Security Center and cold/watch-only workflows",
      "• AETHER Pay where provider/production gates are connected",
      "• Automatic refresh on supported wallet and market views",
      "",
      "Some services are network-, provider-, version-, or gate-dependent. I will tell you when a feature is not universally available.",
      "",
      `AETHER Wallet: ${DEFAULT_WALLET_URL}`,
      `ATH Mining: ${DEFAULT_MINING_URL}`
    ].join("\n"),
  },
  {
    keys: ["asset", "assets", "balance", "portfolio", "token list"],
    answer: () => [
      "<b>Assets & Balances</b>",
      "",
      "AETHER Wallet can show supported native coins and tokens, balances, and portfolio information. Availability depends on the selected network and data providers.",
      "If a token does not appear automatically, verify the network and use Import Custom Token when supported."
    ].join("\n"),
  },
  {
    keys: ["custom token", "import token", "contract token", "token contract"],
    answer: () => [
      "<b>Import Custom Token</b>",
      "",
      "Use the token's verified smart-contract address on the correct network. Confirm the contract from a trusted explorer or official project source before importing.",
      "Never import a token based only on an unsolicited DM or unknown link."
    ].join("\n"),
  },
  {
    keys: ["cold", "cold qr", "cold signer", "unsigned", "signed qr", "offline signer"],
    answer: () => [
      "<b>Cold / Watch-Only QR Workflow</b>",
      "",
      "The advanced AETHER workflow can prepare an unsigned request from Watch-Only, review and sign it on the signer side, then return signed data for broadcast where supported.",
      "This is an advanced workflow and availability depends on the wallet release and selected network."
    ].join("\n"),
  },
  {
    keys: ["aether pay", "pay", "payment", "payments"],
    answer: () => [
      "<b>AETHER Pay</b>",
      "",
      "AETHER Pay is provider-gated. Payment services can be enabled only when the required provider and production gates are connected.",
      "If the Pay option is not available in your current wallet version, do not use unofficial payment links claiming to be AETHER Pay."
    ].join("\n"),
  },
  {
    keys: ["refresh", "auto refresh", "automatic refresh"],
    answer: () => [
      "<b>Automatic Refresh</b>",
      "",
      "Supported AETHER wallet and market views refresh automatically so holders do not need to depend on a manual refresh button.",
      "Refresh speed can vary with RPC, network and data-provider availability."
    ].join("\n"),
  },
  {
    keys: ["mining", "mine", "miner", "power", "booster", "claim"],
    answer: ({ cfg }) => [
      "<b>ATH Mining Guide</b>",
      "",
      "1. Connect your supported wallet.",
      "2. Confirm you are on the network shown by the AETHER Mining page.",
      "3. Review Power / Booster details before signing.",
      "4. Use the on-page claim controls when your position is eligible.",
      "",
      `Current page mode: <b>${escapeHtml(cfg.networkMode || "UNKNOWN")}</b>`,
      `Power price shown by this deployment: <b>${escapeHtml(cfg.powerPriceBnb || "-")} BNB</b>`,
      `Booster price shown by this deployment: <b>${escapeHtml(cfg.boosterPriceBnb || "-")} BNB</b>`,
      "",
      "On-chain rules and the connected smart contract are the final source of truth."
    ].join("\n"),
  },
  {
    keys: ["wallet", "aether wallet", "create wallet", "import wallet", "watch only", "watch-only"],
    answer: () => [
      "<b>AETHER Wallet</b>",
      "",
      "AETHER Wallet is the main Web3 gateway for the ecosystem. It includes wallet creation/import, Watch-Only monitoring, send/receive, asset views, DApp access, custom networks/RPC, security workflows, and other services where enabled.",
      "",
      `Open: ${DEFAULT_WALLET_URL}`,
      "",
      "Never share a seed phrase or private key with this AI, Telegram bot, admins, or any website form."
    ].join("\n"),
  },
  {
    keys: ["send", "receive", "qr", "transfer"],
    answer: () => [
      "<b>Send / Receive Guide</b>",
      "",
      "For receiving, select the asset/network, verify the address and QR, then share only the public address or QR.",
      "For sending, verify network, token, destination, amount and fees before signing locally in AETHER Wallet.",
      "",
      `Wallet: ${DEFAULT_WALLET_URL}`
    ].join("\n"),
  },
  {
    keys: ["swap", "dex", "market", "price", "liquidity"],
    answer: () => [
      "<b>Swap & DEX</b>",
      "",
      "AETHER can expose swap/DEX and market functions where the selected network and providers support them. Quotes, liquidity, routes and execution availability can change in real time.",
      "",
      "Always review token contract, expected output, slippage and network fee before signing."
    ].join("\n"),
  },
  {
    keys: ["staking", "earn", "stake"],
    answer: () => [
      "<b>Staking & Earn</b>",
      "",
      "AETHER can route users to supported staking/earn services and integrated DApps. Rewards, lock periods and smart-contract conditions are determined by the connected provider.",
      "",
      "Do not treat displayed yield as guaranteed."
    ].join("\n"),
  },
  {
    keys: ["ai trade", "ai-trade", "trading", "trade"],
    answer: () => [
      "<b>AETHER AI-Trade</b>",
      "",
      "AI-Trade is an AETHER ecosystem capability that may be gated by product, safety, network and execution readiness.",
      "It is not a promise of profit. Always review risk and transaction details before enabling any execution feature."
    ].join("\n"),
  },
  {
    keys: ["referral", "invite", "sponsor"],
    answer: () => [
      "<b>ATH Referral</b>",
      "",
      "Telegram can route referral attribution, but official ATH mining referral credit is determined by the on-chain mining contract.",
      "Self-referral should not be used. A sponsor must satisfy the on-chain eligibility rules.",
      "",
      `AETHER Bot: ${DEFAULT_BOT_URL}`
    ].join("\n"),
  },
  {
    keys: ["token", "ath", "coin", "aether coin"],
    answer: () => [
      "<b>AETHER / ATH</b>",
      "",
      "ATH is the token used within the AETHER mining ecosystem. Use only official AETHER links and verify the network and contract before interacting with any token.",
      "",
      `AETHER website: ${DEFAULT_WEBSITE_URL}`,
      `Mining: ${DEFAULT_MINING_URL}`
    ].join("\n"),
  },
  {
    keys: ["security", "seed", "private key", "phrase", "scam", "phishing"],
    answer: () => [
      "<b>AETHER Security Rule</b>",
      "",
      "• Never share a seed phrase or private key.",
      "• Never paste recovery words into this AI.",
      "• Verify domains and token/contract addresses.",
      "• Review every transaction before signing.",
      "• Ignore DMs asking for payment, seed words, or remote access."
    ].join("\n"),
  },
  {
    keys: ["dapp", "discover", "web3", "connect wallet"],
    answer: () => [
      "<b>DApps & Web3</b>",
      "",
      "Use AETHER Discover / DApp routes for supported Web3 services. When connecting a wallet, verify the domain, requested network and permissions.",
      "",
      `AETHER Wallet: ${DEFAULT_WALLET_URL}`
    ].join("\n"),
  },
  {
    keys: ["network", "rpc", "chain", "custom network"],
    answer: () => [
      "<b>Network & RPC</b>",
      "",
      "AETHER supports network/RPC management where enabled. Use HTTPS RPC endpoints, confirm chain ID and verify explorer/network details before using a custom network.",
      "",
      "If balances or DApps look wrong, check that the selected network matches the asset or service you are using."
    ].join("\n"),
  },
];

function escapeHtml(text = "") {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cleanQuestion(value = "") {
  return String(value).replace(/\s+/g, " ").trim().slice(0, 800);
}

function containsSecretRequest(text) {
  return /(seed phrase|private key|recovery phrase|mnemonic|12 words|24 words)/i.test(text);
}

function localAnswer(question, context = {}) {
  const q = cleanQuestion(question).toLowerCase();
  if (!q) return "Ask me about ATH Mining, AETHER Wallet, referral, staking, swap, DApps, network/RPC, security, or other AETHER services.";

  if (containsSecretRequest(q)) {
    return [
      "<b>Security warning</b>",
      "",
      "Do not send or paste any seed phrase, private key, mnemonic or recovery words here.",
      "I can help you with safe public information and step-by-step navigation without confidential credentials."
    ].join("\n");
  }

  let best = null;
  let score = 0;
  for (const item of KNOWLEDGE) {
    const hits = item.keys.reduce((n, key) => n + (q.includes(key) ? 1 : 0), 0);
    if (hits > score) {
      best = item;
      score = hits;
    }
  }

  if (best) return best.answer(context);

  return [
    "<b>AETHER AI Guide</b>",
    "",
    "I can guide you through:",
    "• ATH Mining / Power / Booster / Claim",
    "• AETHER Wallet setup and security",
    "• Send / Receive / QR",
    "• Swap / DEX / market",
    "• Staking & Earn",
    "• DApps and Web3 connections",
    "• Network / RPC",
    "• ATH referral and ecosystem links",
    "",
    `AETHER Wallet: ${DEFAULT_WALLET_URL}`,
    `Mining: ${DEFAULT_MINING_URL}`,
    "",
    "Tell me what you want to do, for example: “How do I start mining?”"
  ].join("\n");
}

function stripHtml(value = "") {
  return String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

async function providerAnswer({ question, local, cfg }) {
  const apiKey = (process.env.AI_API_KEY || "").trim();
  const apiUrl = (process.env.AI_API_URL || "").trim();
  const model = (process.env.AI_MODEL || "").trim();
  if (!apiKey || !apiUrl || !model) return null;

  const system = [
    "You are AETHER AI, the official holder support assistant for the AETHER/ATH ecosystem.",
    "Answer only about AETHER Wallet, ATH mining, ecosystem navigation, wallet security, supported Web3 concepts, and how to use official AETHER services.",
    "Never ask for or accept seed phrases, private keys, mnemonics, passwords, or recovery words.",
    "Never promise profits, guaranteed returns, guaranteed mining yield, or guaranteed token prices.",
    "Clearly distinguish live/available features from network-dependent, provider-dependent, gated, or planned features.",
    "For on-chain actions, remind the user to verify the network, contract, transaction details and sign locally in their own wallet.",
    "Prefer concise step-by-step guidance.",
    `Official wallet: ${DEFAULT_WALLET_URL}`,
    `Official mining page: ${DEFAULT_MINING_URL}`,
    `Official website: ${DEFAULT_WEBSITE_URL}`,
    `Current mining deployment mode: ${cfg.networkMode || "UNKNOWN"}`,
    `Fallback knowledge: ${stripHtml(local)}`,
  ].join("\n");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: question },
        ],
        temperature: 0.2,
        max_tokens: 500,
      }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`AI provider HTTP ${response.status}`);
    const data = await response.json();
    const text =
      data?.choices?.[0]?.message?.content ||
      data?.output_text ||
      data?.response ||
      "";
    return cleanQuestion(String(text)).slice(0, 4000) || null;
  } finally {
    clearTimeout(timeout);
  }
}

async function answerQuestion(question, cfg) {
  const clean = cleanQuestion(question);
  const local = localAnswer(clean, { cfg });
  try {
    const external = await providerAnswer({ question: clean, local, cfg });
    return {
      answer: external || local,
      mode: external ? "ai" : "knowledge",
      safety: "Never share seed phrases or private keys.",
    };
  } catch (error) {
    console.error("AETHER AI provider error:", error.message);
    return {
      answer: local,
      mode: "knowledge-fallback",
      safety: "Never share seed phrases or private keys.",
    };
  }
}

module.exports = { answerQuestion, localAnswer, cleanQuestion };
