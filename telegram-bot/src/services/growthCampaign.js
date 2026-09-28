function utcDayStartIso(date = new Date()) {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  return start.toISOString();
}

function growthMessage(config) {
  const inviteUrl = config.communityUrl;
  if (!inviteUrl) return "";

  return [
    "<b>AETHER ATH Crypto Community</b>",
    "",
    "Interested in crypto mining, airdrops, staking, trading, wallet security, and ATH updates?",
    "Join the official ATH community through the invite link below.",
    "",
    "Membership is opt-in and new join requests may be screened by the community bot.",
    "",
    `<a href="${inviteUrl}">Request to join ATH AIRDROP MINER</a>`,
  ].join("\n");
}

class GrowthCampaign {
  constructor({ config, storage, send }) {
    this.config = config;
    this.storage = storage;
    this.send = send;
    this.lastPostAt = new Map();
    this.cursor = 0;
  }

  enabled() {
    return Boolean(
      this.config.growthCampaignEnabled &&
      this.config.communityUrl &&
      this.config.growthSourceChats.length &&
      this.config.targetChats.length
    );
  }

  targetRange() {
    const min = Math.max(1, Number(this.config.growthDailyTargetMin || 15));
    const max = Math.max(min, Number(this.config.growthDailyTargetMax || 25));
    return { min, max };
  }

  async todayJoined() {
    const targetChatId = this.config.targetChats[0];
    if (!targetChatId) return 0;
    return this.storage.membershipCountSince(
      targetChatId,
      utcDayStartIso(new Date())
    );
  }

  eligibleSource(now = Date.now()) {
    if (!this.config.growthSourceChats.length) return null;
    const cooldownMs = 24 * 60 * 60 * 1000;

    for (let offset = 0; offset < this.config.growthSourceChats.length; offset += 1) {
      const index = (this.cursor + offset) % this.config.growthSourceChats.length;
      const chatId = this.config.growthSourceChats[index];
      const last = Number(this.lastPostAt.get(String(chatId)) || 0);
      if (now - last >= cooldownMs) {
        this.cursor = (index + 1) % this.config.growthSourceChats.length;
        return String(chatId);
      }
    }
    return null;
  }

  async pulse() {
    if (!this.enabled()) {
      return { status: "disabled" };
    }

    const { min, max } = this.targetRange();
    const joined = await this.todayJoined();

    if (joined >= max) {
      return { status: "daily-cap-reached", joined, min, max };
    }

    const sourceChatId = this.eligibleSource(Date.now());
    if (!sourceChatId) {
      return { status: "cooldown", joined, min, max };
    }

    const text = growthMessage(this.config);
    await this.send(sourceChatId, text, {
      disable_web_page_preview: false,
    });
    this.lastPostAt.set(sourceChatId, Date.now());

    return {
      status: joined < min ? "posted-below-target" : "posted-within-target",
      sourceChatId,
      joined,
      min,
      max,
    };
  }

  async status() {
    const { min, max } = this.targetRange();
    return {
      enabled: this.enabled(),
      sourceChats: this.config.growthSourceChats.length,
      priorityCountries: [...this.config.growthCountryCodes],
      joinedToday: await this.todayJoined(),
      min,
      max,
    };
  }
}

module.exports = {
  GrowthCampaign,
  growthMessage,
  utcDayStartIso,
};
