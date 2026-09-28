const ARTICLES = [
  {
    id: "referral-integrity",
    category: "referral",
    title: "ATH Referral Integrity",
    body: [
      "<b>ATH Education — Referral Integrity</b>",
      "",
      "Telegram referral links record campaign attribution, but official ATH mining referral credit is determined on-chain.",
      "A sponsor must be eligible under the ATH mining contract when the invited user activates Power.",
      "",
      "Never rely on screenshots or direct messages as proof of an on-chain referral. Use the wallet and contract state."
    ].join("\n"),
  },
  {
    id: "wallet-security",
    category: "security",
    title: "Wallet Security",
    body: [
      "<b>ATH Education — Wallet Security</b>",
      "",
      "Your seed phrase and private key must remain private at all times.",
      "The ATH Telegram bot only needs a public wallet address for referral routing and status checks.",
      "",
      "Review the destination, contract address, network, amount, and transaction details before signing."
    ].join("\n"),
  },
  {
    id: "mining-basics",
    category: "mining",
    title: "ATH Mining Basics",
    body: [
      "<b>ATH Education — Mining Basics</b>",
      "",
      "ATH mining activation and reward logic are enforced by the ATH smart contract.",
      "Telegram is used for education, community operations, and referral routing; it does not create mining rewards by itself.",
      "",
      "Use /referral to review your Telegram attribution and on-chain sponsor status."
    ].join("\n"),
  },
  {
    id: "airdrop-safety",
    category: "airdrop",
    title: "Airdrop Safety",
    body: [
      "<b>ATH Education — Airdrop Safety</b>",
      "",
      "Be cautious with messages that promise guaranteed rewards, ask for payment in a private chat, or request confidential wallet credentials.",
      "Use official AETHER/ATH links and verify transaction details before signing.",
      "",
      "The official bot will never ask for your seed phrase or private key."
    ].join("\n"),
  },
  {
    id: "trading-risk",
    category: "trading",
    title: "Trading Risk",
    body: [
      "<b>ATH Education — Trading Risk</b>",
      "",
      "Crypto trading can result in losses. Community content is educational and is not a guarantee of profit.",
      "Use position sizing, understand liquidity and slippage, and avoid signing transactions you do not understand."
    ].join("\n"),
  },
  {
    id: "staking-risk",
    category: "staking",
    title: "Staking Risk",
    body: [
      "<b>ATH Education — Staking Risk</b>",
      "",
      "Before staking, review the protocol, lock period, smart-contract risk, validator risk, withdrawal conditions, and token risk.",
      "A displayed reward rate does not remove these risks."
    ].join("\n"),
  },
  {
    id: "aether-wallet",
    category: "aether",
    title: "AETHER Wallet",
    body: [
      "<b>ATH Education — AETHER Wallet</b>",
      "",
      "AETHER Wallet is the Web3 handoff point for ATH referral activation.",
      "The user should review the sponsor address and transaction details before signing locally.",
      "",
      "The Telegram bot never signs blockchain transactions for the user."
    ].join("\n"),
  },
];

function articleForDate(date = new Date()) {
  const day = Math.floor(date.getTime() / 86400000);
  return ARTICLES[Math.abs(day) % ARTICLES.length].body;
}

function articlesByCategory(category) {
  return ARTICLES.filter((article) => article.category === category);
}

function articleById(id) {
  return ARTICLES.find((article) => article.id === id) || null;
}

function articleKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "Latest", callback_data: "article:latest" },
        { text: "Airdrop", callback_data: "article:cat:airdrop" },
      ],
      [
        { text: "Mining", callback_data: "article:cat:mining" },
        { text: "Referral", callback_data: "article:cat:referral" },
      ],
      [
        { text: "Staking", callback_data: "article:cat:staking" },
        { text: "Trading", callback_data: "article:cat:trading" },
      ],
      [
        { text: "Security", callback_data: "article:cat:security" },
        { text: "AETHER Wallet", callback_data: "article:cat:aether" },
      ],
    ],
  };
}

module.exports = {
  ARTICLES,
  articleForDate,
  articlesByCategory,
  articleById,
  articleKeyboard,
};
