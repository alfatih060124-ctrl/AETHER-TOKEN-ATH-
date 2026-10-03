const DEFAULT_WALLET_URL = "https://wallet.aether.boats/";
const DEFAULT_MINING_URL = "https://mining.aether.boats/";
const DEFAULT_WEBSITE_URL = "https://aether.boats/";
const DEFAULT_BOT_URL = "https://t.me/Aetther_bot";
const DEFAULT_AUTOTRADE_URL = "https://aitrade.aether.boats";

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
      "• AETHER AUTOTRADE — https://aitrade.aether.boats",
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
    keys: ["mining", "mine", "miner", "power", "booster", "double power", "claim", "vesting", "reward", "burn", "00:05", "utc"],
    answer: ({ cfg }) => [
      "<b>ATH Mining v3.3 Guide</b>",
      "",
      "1. Buy Power for 0.001 BNB to activate the 180-day mining window.",
      "2. Base reward is 10 ATH per eligible UTC day. It opens at 00:05:00 UTC and expires after 23:59:59 UTC if not claimed.",
      "3. Referral multiplier (+10% to +50%) is applied first.",
      "4. Power Booster adds 100 Hash and multiplies the referral-adjusted reward by 2x for 30 days.",
      "5. Double Power requires at least 5 referrals and applies 3x on top of an active Power Booster. It shares the same expiry and does not extend it.",
      "6. Each successful claim unlocks 10% at 30d, 5% at 60d, 5% at 90d; the remaining 80% enters Cycle 1 at 180d.",
      "7. Each of 12 cycles burns 10% on entry, unlocks 10%/+30d, 5%/+60d, 5%/+90d, and rolls 70% forward. After Cycle 12, the final rollover settles 60% burn / 40% holder distribution.",
      "8. ATH official pre-listing reference price is fixed at $0.37. Mining and Staking read the same ATH Price Registry. A DEX market quote may be visible separately; official market mode requires the 15,000-holder gate and listing activation.",
      "9. Daily transparency can be materialized by a permissionless keeper in capped batches. The keeper uses the on-chain miner registry and has no owner/admin authority.",
      "",
      `Current page mode: <b>${escapeHtml(cfg.networkMode || "UNKNOWN")}</b>`,
      `Power price: <b>${escapeHtml(cfg.powerPriceBnb || "0.001")} BNB</b>`,
      "Booster prices are stored on-chain and owner-configurable; the v3.3 source default is 0.001 BNB for each Booster.",
      "",
      "The connected smart contract and explorer-readable on-chain records are the final source of truth."
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
    keys: ["ai trade", "ai-trade", "autotrade", "auto trade", "aether autotrade", "trading", "trade"],
    answer: () => [
      "<b>AETHER AUTOTRADE</b>",
      "",
      "AETHER AUTOTRADE is the official automated trading portal in the AETHER ecosystem.",
      "Use the official portal to review available trading features, supported modes, and execution controls.",
      "",
      `Open AETHER AUTOTRADE: ${DEFAULT_AUTOTRADE_URL}`,
      "",
      "AutoTrade does not guarantee profit. Always review risk, wallet permissions, network, and transaction details before enabling any execution feature."
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
  return /(seed phrase|private key|recovery phrase|mnemonic|12 words|24 words|frasa seed|kunci privat|private key|mnemonik|kata pemulihan)/i.test(text);
}

function detectLanguage(text = "") {
  const value = String(text).toLowerCase();
  const idSignals = [
    "bagaimana", "gimana", "gmn", "apa ", "apakah", "saya", "anda", "tolong",
    "bisa", "untuk", "dengan", "dan ", "yang ", "cara", "mulai", "fitur",
    "layanan", "keamanan", "wallet saya", "tambahkan", "gunakan", "menggunakan"
  ];
  const enSignals = [
    "how ", "what ", "where ", "when ", "why ", "can i", "could you", "please",
    "use ", "using ", "start ", "feature", "service", "security", "wallet my",
    "show me", "tell me", "help me", "do i"
  ];
  const idScore = idSignals.reduce((n, token) => n + (value.includes(token) ? 1 : 0), 0);
  const enScore = enSignals.reduce((n, token) => n + (value.includes(token) ? 1 : 0), 0);
  if (enScore > idScore) return "en";
  if (idScore > 0) return "id";
  return "en";
}

function indonesianAnswer(question, context = {}) {
  const q = cleanQuestion(question).toLowerCase();
  const cfg = context.cfg || {};

  if (!q) {
    return "Tanyakan kepada saya tentang ATH Mining, AETHER Wallet, AETHER AUTOTRADE, referral, staking, swap, DApps, network/RPC, keamanan, atau layanan AETHER lainnya.";
  }

  if (containsSecretRequest(q)) {
    return [
      "<b>Peringatan Keamanan</b>",
      "",
      "Jangan pernah mengirim atau menempelkan seed phrase, private key, mnemonic, password, atau kata pemulihan di sini.",
      "Saya tetap dapat membantu dengan informasi publik dan panduan langkah demi langkah tanpa meminta data rahasia."
    ].join("\n");
  }

  if (/(autotrade|auto trade|ai trade|ai-trade|trading|trade)/i.test(q)) {
    return [
      "<b>AETHER AUTOTRADE</b>",
      "",
      "AETHER AUTOTRADE adalah portal otomatisasi trading resmi dalam ekosistem AETHER.",
      "Gunakan portal resmi untuk melihat fitur trading, mode yang tersedia, dan kontrol eksekusi.",
      "",
      `Buka AETHER AUTOTRADE: ${DEFAULT_AUTOTRADE_URL}`,
      "",
      "AutoTrade tidak menjamin keuntungan. Selalu periksa risiko, izin wallet, jaringan, dan detail transaksi sebelum mengaktifkan fitur eksekusi."
    ].join("\n");
  }

  if (/(mining|miner|power|booster|double power|claim|vesting|reward|burn|00:05|utc|menambang|tambang|vesting|bakar)/i.test(q)) {
    return [
      "<b>Panduan ATH Mining v3.3</b>",
      "",
      "1. Beli Power 0.001 BNB untuk mengaktifkan mining window 180 hari.",
      "2. Base reward adalah 10 ATH per hari UTC yang eligible. Claim dibuka 00:05:00 UTC dan hangus setelah 23:59:59 UTC jika tidak di-claim.",
      "3. Referral multiplier (+10% sampai +50%) dihitung lebih dahulu.",
      "4. Power Booster menambah 100 Hash dan mengalikan reward setelah referral menjadi 2x selama 30 hari.",
      "5. Double Power membutuhkan minimal 5 referral dan memberi 3x di atas Power Booster aktif. Masa aktif mengikuti expiry Power Booster dan tidak memperpanjangnya.",
      "6. Setiap claim membuka 10% pada 30 hari, 5% pada 60 hari, 5% pada 90 hari; sisa 80% masuk Cycle 1 pada 180 hari.",
      "7. Setiap dari 12 cycle membakar 10% saat masuk cycle, membuka 10%/+30d, 5%/+60d, 5%/+90d, lalu 70% diteruskan. Setelah Cycle 12, sisa akhir diselesaikan 60% burn / 40% distribusi holder.",
      "8. Harga referensi resmi ATH sebelum listing dikunci $0,37. Mining dan Staking membaca ATH Price Registry yang sama. Harga pasar DEX dapat terlihat terpisah; mode harga pasar resmi baru aktif setelah target 15.000 holder dan aktivasi listing.",
      "9. Jejak transparansi harian dapat dimaterialisasi oleh keeper permissionless dalam batch terbatas. Keeper membaca miner registry on-chain dan tidak memiliki hak owner/admin.",
      "",
      `Mode halaman saat ini: <b>${escapeHtml(cfg.networkMode || "UNKNOWN")}</b>`,
      `Harga Power: <b>${escapeHtml(cfg.powerPriceBnb || "0.001")} BNB</b>`,
      "Harga Booster disimpan on-chain dan dapat diatur owner; default source v3.3 adalah 0.001 BNB untuk masing-masing Booster.",
      "",
      "Smart contract terhubung dan data on-chain yang dapat dibaca melalui explorer tetap menjadi sumber kebenaran utama."
    ].join("\n");
  }

  if (/(wallet|dompet|create wallet|import wallet|watch only|watch-only)/i.test(q)) {
    return [
      "<b>AETHER Wallet</b>",
      "",
      "AETHER Wallet adalah gerbang Web3 utama dalam ekosistem AETHER. Fiturnya mencakup pembuatan/import wallet, Watch-Only, send/receive, asset, DApp, custom network/RPC, workflow keamanan, dan layanan lain yang tersedia.",
      "",
      `Buka: ${DEFAULT_WALLET_URL}`,
      "",
      "Jangan pernah membagikan seed phrase atau private key kepada AI, bot Telegram, admin, atau formulir website apa pun."
    ].join("\n");
  }

  if (/(fitur|layanan|semua aether|features|services|facilities)/i.test(q)) {
    return [
      "<b>Ekosistem AETHER — Fitur & Layanan</b>",
      "",
      "AETHER dirancang sebagai ekosistem Web3 multi-layanan:",
      "• Create / Import Wallet dan Watch-Only",
      "• Multi-wallet dan akses multi-chain yang didukung",
      "• Asset, saldo, dan token view",
      "• Send / Receive dan QR",
      "• Import Custom Token",
      "• Swap / DEX dan market data jika didukung",
      "• Discover / DApps / Web3 connections",
      "• Custom Network / RPC health dan fallback",
      "• Staking & Earn melalui provider yang didukung",
      "• ATH Mining dan referral",
      `• AETHER AUTOTRADE — ${DEFAULT_AUTOTRADE_URL}`,
      "• Security Center dan cold/watch-only workflow",
      "• AETHER Pay jika provider/gate produksi sudah terhubung",
      "• Auto refresh pada tampilan wallet dan market yang didukung",
      "",
      "Sebagian layanan bergantung pada jaringan, provider, versi aplikasi, atau gate produksi.",
      "",
      `AETHER Wallet: ${DEFAULT_WALLET_URL}`,
      `ATH Mining: ${DEFAULT_MINING_URL}`
    ].join("\n");
  }

  if (/(send|receive|qr|kirim|terima|transfer)/i.test(q)) {
    return [
      "<b>Panduan Kirim / Terima</b>",
      "",
      "Untuk menerima, pilih asset dan jaringan, verifikasi alamat serta QR, lalu bagikan hanya alamat publik atau QR.",
      "Untuk mengirim, periksa jaringan, token, alamat tujuan, jumlah, dan biaya sebelum menandatangani transaksi di AETHER Wallet.",
      "",
      `Wallet: ${DEFAULT_WALLET_URL}`
    ].join("\n");
  }

  if (/(swap|dex|market|harga|price|liquidity|likuiditas)/i.test(q)) {
    return [
      "<b>Swap & DEX</b>",
      "",
      "AETHER dapat menyediakan fungsi swap/DEX dan market pada jaringan/provider yang didukung. Quote, likuiditas, rute, dan ketersediaan eksekusi dapat berubah secara real-time.",
      "",
      "Selalu periksa contract token, expected output, slippage, dan network fee sebelum menandatangani transaksi."
    ].join("\n");
  }

  if (/(staking|earn|stake)/i.test(q)) {
    return [
      "<b>Staking & Earn</b>",
      "",
      "AETHER dapat mengarahkan pengguna ke layanan staking/earn dan DApp yang didukung. Reward, lock period, dan ketentuan smart contract ditentukan oleh provider terkait.",
      "",
      "Jangan menganggap yield yang ditampilkan sebagai keuntungan yang dijamin."
    ].join("\n");
  }

  if (/(referral|invite|sponsor|referal|undang)/i.test(q)) {
    return [
      "<b>Referral ATH</b>",
      "",
      "Telegram dapat mencatat attribution referral, tetapi kredit referral resmi ATH Mining ditentukan oleh smart contract on-chain.",
      "Self-referral tidak boleh digunakan dan sponsor harus memenuhi syarat on-chain.",
      "",
      `AETHER Bot: ${DEFAULT_BOT_URL}`
    ].join("\n");
  }

  if (/(security|keamanan|seed|private key|scam|phishing)/i.test(q)) {
    return [
      "<b>Aturan Keamanan AETHER</b>",
      "",
      "• Jangan pernah membagikan seed phrase atau private key.",
      "• Jangan menempelkan recovery words ke AI.",
      "• Verifikasi domain dan alamat contract token.",
      "• Periksa semua transaksi sebelum sign.",
      "• Abaikan DM yang meminta pembayaran, seed words, atau remote access."
    ].join("\n");
  }

  if (/(dapp|discover|web3|connect wallet|hubungkan wallet)/i.test(q)) {
    return [
      "<b>DApps & Web3</b>",
      "",
      "Gunakan jalur Discover / DApp AETHER untuk layanan Web3 yang didukung. Saat menghubungkan wallet, verifikasi domain, jaringan, dan permission yang diminta.",
      "",
      `AETHER Wallet: ${DEFAULT_WALLET_URL}`
    ].join("\n");
  }

  if (/(network|rpc|chain|jaringan|custom network)/i.test(q)) {
    return [
      "<b>Network & RPC</b>",
      "",
      "AETHER mendukung pengelolaan network/RPC pada jaringan yang tersedia. Gunakan HTTPS RPC, pastikan chain ID benar, dan verifikasi explorer/network sebelum memakai custom network.",
      "",
      "Jika saldo atau DApp terlihat salah, periksa kembali jaringan yang sedang dipilih."
    ].join("\n");
  }

  if (/(token|ath|coin|aether coin)/i.test(q)) {
    return [
      "<b>AETHER / ATH</b>",
      "",
      "ATH adalah token dalam ekosistem mining AETHER. Gunakan hanya link resmi AETHER dan verifikasi jaringan serta contract sebelum berinteraksi dengan token.",
      "",
      `Website AETHER: ${DEFAULT_WEBSITE_URL}`,
      `Mining: ${DEFAULT_MINING_URL}`
    ].join("\n");
  }

  return [
    "<b>Panduan AETHER AI</b>",
    "",
    "Saya dapat membantu Anda mengenai:",
    "• ATH Mining / Power / Booster / Claim",
    "• AETHER Wallet dan keamanan",
    "• AETHER AUTOTRADE",
    "• Send / Receive / QR",
    "• Swap / DEX / market",
    "• Staking & Earn",
    "• DApps dan koneksi Web3",
    "• Network / RPC",
    "• Referral ATH dan link resmi ekosistem",
    "",
    `AETHER Wallet: ${DEFAULT_WALLET_URL}`,
    `AETHER AUTOTRADE: ${DEFAULT_AUTOTRADE_URL}`,
    `Mining: ${DEFAULT_MINING_URL}`
  ].join("\n");
}

function localAnswer(question, context = {}) {
  if (detectLanguage(question) === "id") {
    return indonesianAnswer(question, context);
  }
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
    "Always answer in the same language used by the user. If the user writes Indonesian, answer in Indonesian. If the user writes English, answer in English. For any other language, respond in that same language.",
    "Prefer concise step-by-step guidance.",
    `Official wallet: ${DEFAULT_WALLET_URL}`,
    `Official mining page: ${DEFAULT_MINING_URL}`,
    `Official website: ${DEFAULT_WEBSITE_URL}`,
    `Official AETHER AUTOTRADE: ${DEFAULT_AUTOTRADE_URL}`,
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
  const language = detectLanguage(clean);
  const local = localAnswer(clean, { cfg });
  try {
    const external = await providerAnswer({ question: clean, local, cfg });
    return {
      answer: external || local,
      mode: external ? "ai" : "knowledge",
      language,
      safety: language === "id" ? "Jangan pernah membagikan seed phrase atau private key." : "Never share seed phrases or private keys.",
    };
  } catch (error) {
    console.error("AETHER AI provider error:", error.message);
    return {
      answer: local,
      mode: "knowledge-fallback",
      language,
      safety: language === "id" ? "Jangan pernah membagikan seed phrase atau private key." : "Never share seed phrases or private keys.",
    };
  }
}

module.exports = { answerQuestion, localAnswer, cleanQuestion, detectLanguage };