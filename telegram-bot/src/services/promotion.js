const DEFAULT_PROMOS = [
  "ATH referral resmi tercatat on-chain saat user baru mengaktifkan Power dengan sponsor yang sudah aktif. Gunakan /referral untuk cek status.",
  "Jangan pernah kirim seed phrase atau private key ke bot, admin, atau DM. Bot ATH hanya membutuhkan public wallet address.",
  "Gunakan /edukasi untuk memahami ATH, mining, referral, keamanan wallet, staking, dan trading.",
  "Referral Telegram membantu tracking promosi. Smart contract ATH tetap menjadi sumber data resmi untuk referral mining.",
];

class PromotionService {
  constructor({ cooldownHours = 8 } = {}) {
    this.cooldownMs = Number(cooldownHours) * 60 * 60 * 1000;
    this.lastSent = new Map();
  }

  canSend(chatId, now = Date.now()) {
    const key = String(chatId);
    if (!this.lastSent.has(key)) {
      this.lastSent.set(key, now);
      return true;
    }

    const last = this.lastSent.get(key);
    if (now - last < this.cooldownMs) return false;

    this.lastSent.set(key, now);
    return true;
  }

  pick() {
    return DEFAULT_PROMOS[Math.floor(Math.random() * DEFAULT_PROMOS.length)];
  }
}

module.exports = { PromotionService, DEFAULT_PROMOS };
