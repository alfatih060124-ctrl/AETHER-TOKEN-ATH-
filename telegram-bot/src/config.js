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
  port: Number(process.env.PORT || 8080),
  enabled: bool("BOT_ENABLED", false),
  token: (process.env.TELEGRAM_BOT_TOKEN || "").trim(),
  username: (process.env.TELEGRAM_BOT_USERNAME || "").replace(/^@/, "").trim(),
  campaign: (process.env.ATH_CAMPAIGN_LABEL || "ATH Airdrop").trim(),
  appUrl: url("AETHER_APP_URL"),
  communityUrl: url("AETHER_COMMUNITY_URL"),
  websiteUrl: url("AETHER_WEBSITE_URL"),
  admins: new Set(list("ADMIN_TELEGRAM_IDS")),
  databaseUrl: (process.env.DATABASE_URL || "").trim(),

  // ATH referral bridge: read-only blockchain access only.
  athRpcUrl: url("ATH_RPC_URL") || url("BSC_TESTNET_RPC"),
  athMiningAddress: (process.env.ATH_MINING_ADDRESS || "").trim(),
  athChainId: Number(process.env.ATH_CHAIN_ID || 97),
};
