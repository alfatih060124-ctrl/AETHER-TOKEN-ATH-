const DEFAULT_PROMOS = [
  "Official ATH referral credit is recorded on-chain when a new user activates Power with an already-active sponsor. Use /referral to check status.",
  "Never send a seed phrase or private key to the bot, an admin, or by DM. The ATH bot only needs a public wallet address.",
  "Use /education to learn about ATH, mining, referrals, wallet security, staking, and trading.",
  "Telegram referral tracking supports campaign attribution. The ATH smart contract remains the authoritative source for mining referral credit.",
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
