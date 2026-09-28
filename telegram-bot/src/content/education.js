const EDUCATION = {
  airdrop: [
    "<b>ATH & Airdrop Education</b>",
    "",
    "An airdrop is a token distribution to users who meet specific eligibility requirements.",
    "For ATH, Telegram promotional activity does not automatically become an on-chain reward.",
    "",
    "<b>Security:</b>",
    "• Never share your seed phrase or private key.",
    "• Use official links only.",
    "• Verify the wallet, contract, and transaction details before signing.",
    "• Avoid DMs that ask for payment or confidential credentials.",
  ].join("\n"),

  mining: [
    "<b>ATH Mining Program</b>",
    "",
    "ATH uses Power to activate the mining program.",
    "The base reward follows the ATH smart-contract configuration, and claims follow the on-chain rules.",
    "Official referral credit is determined by the smart contract, not by Telegram clicks.",
  ].join("\n"),

  staking: [
    "<b>Staking Education</b>",
    "",
    "Staking means locking or delegating assets within a specific mechanism or protocol to earn rewards.",
    "Always understand the lock period, smart-contract risk, validator risk, and token conditions.",
  ].join("\n"),

  trading: [
    "<b>Trading Education</b>",
    "",
    "Trading involves the risk of loss. Use risk management, avoid FOMO, and never treat community content as a guarantee of profit.",
  ].join("\n"),

  aether: [
    "<b>AETHER Wallet</b>",
    "",
    "AETHER Wallet is the Web3 route for ATH. Telegram referrals can be routed to the Wallet, where the user reviews the sponsor and signs the transaction locally.",
    "",
    "The Telegram bot never needs a user's wallet seed phrase or private key.",
  ].join("\n"),

  security: [
    "<b>Crypto Security</b>",
    "",
    "• Never share a seed phrase or private key.",
    "• Verify the domain and contract address.",
    "• Keep experimental wallets separate from your main wallet.",
    "• Do not sign transactions you do not understand.",
    "• Official admins will never ask for your private key by DM.",
  ].join("\n"),
};

function educationKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "🎁 Airdrop", callback_data: "edu:airdrop" },
        { text: "⛏ Mining", callback_data: "edu:mining" },
      ],
      [
        { text: "🔒 Staking", callback_data: "edu:staking" },
        { text: "📈 Trading", callback_data: "edu:trading" },
      ],
      [
        { text: "AETHER Wallet", callback_data: "edu:aether" },
        { text: "🛡 Security", callback_data: "edu:security" },
      ],
    ],
  };
}

module.exports = { EDUCATION, educationKeyboard };
