const WALLET_URL = "https://wallet.aether.boats/";

const FEATURES = [
  {
    id: "create-import",
    title: "Create, Import & Watch-Only Wallet",
    status: "available",
    body: "Create a new wallet, import an existing wallet, or add a Watch-Only address for monitoring without exposing signing keys.",
  },
  {
    id: "multi-chain",
    title: "Multi-Chain & Multi-Wallet",
    status: "available",
    body: "Manage multiple wallets and supported blockchain networks from one AETHER interface.",
  },
  {
    id: "assets",
    title: "Assets & Live Balances",
    status: "available",
    body: "View supported native coins and tokens, wallet balances, and refreshed portfolio information.",
  },
  {
    id: "send",
    title: "Send Crypto",
    status: "available",
    body: "Prepare and sign native-coin or supported-token transfers locally from AETHER Wallet.",
  },
  {
    id: "receive",
    title: "Receive & QR",
    status: "available",
    body: "Receive crypto using an address or QR workflow. Amount-aware receive requests can be prepared where the network standard supports it.",
  },
  {
    id: "swap",
    title: "Swap & DEX Routing",
    status: "network-dependent",
    body: "Access token swap and DEX routing where enabled. Availability, quotes, liquidity and execution depend on the selected network and provider.",
  },
  {
    id: "market",
    title: "Market & DEX Data",
    status: "available",
    body: "Explore supported market information, token pricing and DEX-related data from connected public data providers.",
  },
  {
    id: "dapps",
    title: "Discover, DApps & Web3 Connections",
    status: "available",
    body: "Open approved Web3/DApp links from Discover and connect supported networks through the wallet connection flow.",
  },
  {
    id: "custom-token",
    title: "Import Custom Token",
    status: "available",
    body: "Add supported tokens using their smart-contract address when they are not shown automatically.",
  },
  {
    id: "network-rpc",
    title: "Custom Network & RPC Manager",
    status: "available",
    body: "Add supported EVM networks using HTTPS RPC endpoints, validate chain ID, check RPC health/latency and use fallback readiness.",
  },
  {
    id: "staking",
    title: "Staking & Earn",
    status: "provider-dependent",
    body: "Open supported staking/earn services and integrated DApps. Product terms, lockups and rewards are determined by the connected provider.",
  },
  {
    id: "mining",
    title: "Mining Access",
    status: "ecosystem",
    body: "Access supported AETHER/ATH mining routes and related education from the AETHER ecosystem. On-chain rules remain the source of truth.",
  },
  {
    id: "ai-trade",
    title: "AI-Trade Access",
    status: "gated",
    body: "AI-Trade discovery is part of the AETHER ecosystem. Availability is controlled by product, safety and execution gates; no profit is guaranteed.",
  },
  {
    id: "security",
    title: "Security Center",
    status: "available",
    body: "AETHER uses local signing controls, PIN protection and security guidance. Seed phrases and private keys must never be shared with the Telegram bot or admins.",
  },
  {
    id: "cold",
    title: "Watch-Only & Cold QR Workflow",
    status: "advanced",
    body: "Prepare unsigned requests from a Watch-Only workflow, review/sign on the signer side, then return signed data for broadcast where supported.",
  },
  {
    id: "refresh",
    title: "Automatic Refresh",
    status: "available",
    body: "Supported wallet and market views refresh automatically so users do not need to rely on a manual refresh button.",
  },
  {
    id: "pay",
    title: "AETHER Pay",
    status: "provider-gated",
    body: "Payment-related services can appear when the required provider and production gates are connected. Availability varies by deployment.",
  },
];

function escapeHtml(text = "") {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function statusLabel(status) {
  const labels = {
    available: "Available",
    "network-dependent": "Network dependent",
    "provider-dependent": "Provider dependent",
    ecosystem: "AETHER ecosystem",
    gated: "Gated",
    advanced: "Advanced workflow",
    "provider-gated": "Provider gated",
  };
  return labels[status] || status;
}

function overview(walletUrl = WALLET_URL) {
  const lines = [
    "<b>AETHER Wallet — Features & Services</b>",
    "",
    "AETHER is designed as a multi-service Web3 wallet. Main capabilities include:",
    "",
  ];

  for (const feature of FEATURES) {
    lines.push(`• <b>${escapeHtml(feature.title)}</b> — ${escapeHtml(statusLabel(feature.status))}`);
  }

  lines.push(
    "",
    "<b>Official AETHER Wallet</b>",
    escapeHtml(walletUrl || WALLET_URL),
    "",
    "Availability can differ by network, provider and release version. Always verify transaction details before signing. Never share a seed phrase or private key."
  );
  return lines.join("\n");
}

function featureText(feature, walletUrl = WALLET_URL) {
  if (!feature) return overview(walletUrl);
  return [
    `<b>AETHER Feature — ${escapeHtml(feature.title)}</b>`,
    "",
    escapeHtml(feature.body),
    "",
    `Status: <b>${escapeHtml(statusLabel(feature.status))}</b>`,
    "",
    "<b>Official AETHER Wallet</b>",
    escapeHtml(walletUrl || WALLET_URL),
  ].join("\n");
}

function featureForHour(date = new Date()) {
  const hourIndex = Math.floor(date.getTime() / 3600000);
  return FEATURES[Math.abs(hourIndex) % FEATURES.length];
}

function featureKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "Wallet Basics", callback_data: "features:create-import" },
        { text: "Assets", callback_data: "features:assets" },
      ],
      [
        { text: "Send / Receive", callback_data: "features:send" },
        { text: "Swap / DEX", callback_data: "features:swap" },
      ],
      [
        { text: "DApps", callback_data: "features:dapps" },
        { text: "Network / RPC", callback_data: "features:network-rpc" },
      ],
      [
        { text: "Staking", callback_data: "features:staking" },
        { text: "Mining", callback_data: "features:mining" },
      ],
      [
        { text: "AI-Trade", callback_data: "features:ai-trade" },
        { text: "Security", callback_data: "features:security" },
      ],
      [
        { text: "Cold / Watch-Only", callback_data: "features:cold" },
        { text: "All Features", callback_data: "features:all" },
      ],
      [{ text: "Open AETHER Wallet", url: WALLET_URL }],
    ],
  };
}

function getFeature(id) {
  return FEATURES.find((feature) => feature.id === id) || null;
}

module.exports = {
  FEATURES,
  WALLET_URL,
  overview,
  featureText,
  featureForHour,
  featureKeyboard,
  getFeature,
};
