const EDUCATION = {
  airdrop: [
    "<b>ATH & Airdrop Education</b>",
    "",
    "Airdrop adalah distribusi token kepada pengguna yang memenuhi syarat tertentu.",
    "Untuk ATH, status promosi Telegram tidak otomatis menjadi reward on-chain.",
    "",
    "<b>Keamanan:</b>",
    "• Jangan pernah berikan seed phrase/private key.",
    "• Gunakan link resmi.",
    "• Verifikasi wallet dan transaksi sebelum signing.",
    "• Hindari pesan DM yang meminta pembayaran atau kredensial rahasia.",
  ].join("\n"),

  mining: [
    "<b>ATH Mining Program</b>",
    "",
    "ATH menggunakan Power untuk mengaktifkan program mining.",
    "Base reward mengikuti konfigurasi smart contract ATH dan claim dilakukan sesuai aturan on-chain.",
    "Referral resmi juga mengikuti smart contract, bukan jumlah klik Telegram.",
  ].join("\n"),

  staking: [
    "<b>Staking Education</b>",
    "",
    "Staking berarti mengunci atau mendelegasikan aset dalam mekanisme/protokol tertentu untuk memperoleh reward.",
    "Selalu pahami lock period, smart-contract risk, validator risk, dan kondisi token.",
  ].join("\n"),

  trading: [
    "<b>Trading Education</b>",
    "",
    "Trading memiliki risiko kerugian. Gunakan manajemen risiko, hindari FOMO, dan jangan menganggap konten komunitas sebagai jaminan profit.",
  ].join("\n"),

  aether: [
    "<b>AETHER Wallet</b>",
    "",
    "AETHER Wallet menjadi jalur Web3 untuk ATH. Referral Telegram dapat diarahkan ke Wallet, lalu user meninjau sponsor dan menandatangani transaksi sendiri.",
    "",
    "Bot Telegram tidak pernah memerlukan seed phrase atau private key wallet pengguna.",
  ].join("\n"),

  security: [
    "<b>Crypto Security</b>",
    "",
    "• Seed phrase/private key tidak boleh dibagikan.",
    "• Periksa domain dan alamat kontrak.",
    "• Pisahkan wallet eksperimen dari wallet utama.",
    "• Jangan menandatangani transaksi yang tidak dipahami.",
    "• Admin resmi tidak meminta private key melalui DM.",
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
