function bool(name, fallback = false) {
  const value = process.env[name];
  if (value == null || value === "") return fallback;
  return value === "true";
}

function list(name) {
  return (process.env[name] || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function number(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
}

function url(name, fallback = "") {
  const value = (process.env[name] || fallback).trim();
  if (!value) return "";
  try {
    const parsed = new URL(value);
    if (!["https:", "http:"].includes(parsed.protocol)) return "";
    return parsed.toString();
  } catch {
    return "";
  }
}

module.exports = {
  port: number("PORT", 8080),
  enabled: bool("BOT_ENABLED", false),
  token: (process.env.TELEGRAM_BOT_TOKEN || "").trim(),
  username: (process.env.TELEGRAM_BOT_USERNAME || "").replace(/^@/, "").trim(),
  campaign: (process.env.ATH_CAMPAIGN_LABEL || "ATH Airdrop").trim(),
  appUrl: url("AETHER_APP_URL"),
  communityUrl: url("AETHER_COMMUNITY_URL"),
  websiteUrl: url("AETHER_WEBSITE_URL"),
  coinUrl: url("AETHER_COIN_URL"),
  channelUrl: url("AETHER_CHANNEL_URL"),
  groupUrl: url("AETHER_GROUP_URL"),
  channelSourceIds: list("AETHER_CHANNEL_IDS"),
  channelForwardEnabled: bool("CHANNEL_FORWARD_ENABLED", true),
  admins: new Set(list("ADMIN_TELEGRAM_IDS")),
  databaseUrl: (process.env.DATABASE_URL || "").trim(),
  webhookEnabled: bool("WEBHOOK_ENABLED", false),
  webhookBaseUrl: url("WEBHOOK_BASE_URL"),

  // Optional AI reply integration.
  aiReplyEnabled: bool("AI_REPLY_ENABLED", false),
  openAiApiKey: (process.env.OPENAI_API_KEY || "").trim(),
  openAiModel: (process.env.OPENAI_MODEL || "gpt-4o-mini").trim(),
  aiRandomReplyRate: Math.max(0, Math.min(number("AI_RANDOM_REPLY_RATE", 0.08), 1)),

  // ATH referral bridge: read-only blockchain access only.
  athRpcUrl: url("ATH_RPC_URL") || url("BSC_TESTNET_RPC"),
  athMiningAddress: (process.env.ATH_MINING_ADDRESS || "").trim(),
  athChainId: number("ATH_CHAIN_ID", 97),

  // Community architecture derived from the supplied bot guide.
  targetChats: list("TARGET_CHAT_IDS"),
  joinVerificationEnabled: bool("JOIN_VERIFICATION_ENABLED", true),
  minCryptoScore: number("MIN_CRYPTO_SCORE", 60),
  floodLimit: number("FLOOD_LIMIT", 5),
  floodWindowSeconds: number("FLOOD_WINDOW_SECONDS", 10),
  softPromoHours: Math.max(1, number("SOFT_PROMO_HOURS", 1)),
  articleHourUtc: number("ARTICLE_HOUR_UTC", 9),
  communityFeaturesEnabled: bool("COMMUNITY_FEATURES_ENABLED", true),

  // Opt-in growth campaign. This never scrapes members or sends unsolicited DMs.
  growthCampaignEnabled: bool("GROWTH_CAMPAIGN_ENABLED", false),
  growthSourceChats: list("GROWTH_SOURCE_CHAT_IDS"),
  growthCountryCodes: list("GROWTH_COUNTRY_CODES").length
    ? list("GROWTH_COUNTRY_CODES")
    : ["BR", "NG", "IN", "ID", "VN", "PH", "UA", "TH", "ZA", "TR", "US", "JP", "KR", "MX", "CA"],
  growthDailyTargetMin: Math.max(1, number("GROWTH_DAILY_TARGET_MIN", 15)),
  growthDailyTargetMax: Math.max(1, number("GROWTH_DAILY_TARGET_MAX", 25)),
  growthPulseHours: Math.max(4, number("GROWTH_PULSE_HOURS", 4)),
};
