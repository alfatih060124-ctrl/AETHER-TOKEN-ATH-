const http = require("http");
const crypto = require("crypto");
const config = require("./config");
const { createStorage } = require("./storage");
const { createATHReferralService, isAddress } = require("./services/athReferral");
const { createCommunity } = require("./community");
const { startScheduler } = require("./scheduler");

const API = config.token ? `https://api.telegram.org/bot${config.token}` : "";
const storage = createStorage(config.databaseUrl);
const athReferral = createATHReferralService(config);

let offset = 0;
let stopping = false;
let community = null;
let stopScheduler = () => {};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function telegram(method, body = {}) {
  const response = await fetch(`${API}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!payload.ok) {
    throw new Error(`Telegram ${method} failed: ${payload.description || response.status}`);
  }
  return payload.result;
}

function userFrom(message) {
  const from = message.from || {};
  return {
    telegramId: String(from.id),
    username: from.username || null,
    firstName: from.first_name || null,
    lastName: from.last_name || null,
  };
}

function referralPayload(text = "") {
  const m = text.match(/^\/start(?:@\w+)?\s+ref_(\d+)$/i);
  return m ? m[1] : null;
}

function inviteLink(userId) {
  if (!config.username) return "";
  return `https://t.me/${config.username}?start=ref_${userId}`;
}

function mainKeyboard() {
  const rows = [];
  if (config.appUrl) rows.push([{ text: "🚀 Open AETHER", url: config.appUrl }]);
  rows.push([
    { text: "🎁 ATH Airdrop", callback_data: "airdrop" },
    { text: "🔗 ATH Referral", callback_data: "referral" },
  ]);
  rows.push([
    { text: "👥 Invite Friends", callback_data: "invite" },
    { text: "📚 Education", callback_data: "edu:aether" },
  ]);
  if (config.communityUrl) rows.push([{ text: "💬 Community", url: config.communityUrl }]);
  if (config.websiteUrl) rows.push([{ text: "🌐 Official Website", url: config.websiteUrl }]);
  return { inline_keyboard: rows };
}

async function send(chatId, text, extra = {}) {
  return telegram("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...extra,
  });
}

async function showHome(message, referrerId = null) {
  const user = await storage.upsertUser(userFrom(message));
  if (referrerId) {
    await storage.recordReferral(user.telegramId, referrerId);
  }
  await storage.setOptOut(user.telegramId, false);

  const current = await storage.getUser(user.telegramId);
  const linked = current?.walletAddress
    ? `\nWallet: <code>${current.walletAddress}</code>`
    : "";

  return send(
    message.chat.id,
    `<b>AETHER ATH</b>\n\nWelcome to the official ATH community and referral bot.${linked}\n\nTelegram attribution is recorded when a new user starts the bot from a referral link. The official ATH on-chain referral is finalized only when Power is purchased through the ATH mining contract with an eligible sponsor wallet.\n\nThis bot never asks for a seed phrase or private key.`,
    { reply_markup: mainKeyboard() }
  );
}

async function showAirdrop(chatId) {
  return send(
    chatId,
    `<b>${escapeHtml(config.campaign)}</b>\n\nATH uses a referral mining program. A sponsor must already have Power before a new miner activates Power with that sponsor wallet. Referral tiers raise the sponsor's daily mining multiplier from +10% up to +50% according to the number of qualifying referrals.\n\nTelegram is used for acquisition, education and referral routing; the ATH smart contract remains the source of truth for the official on-chain referral count.`
  );
}

async function showInvite(chatId, userId) {
  const user = await storage.getUser(userId);
  const link = inviteLink(userId);
  const count = user?.referralCount || 0;

  let onchainText = "";
  if (!user?.walletAddress) {
    onchainText =
      "\n\n<b>ATH sponsor status:</b> wallet not linked. Use <code>/wallet 0xYOUR_PUBLIC_ADDRESS</code>.";
  } else if (!athReferral.enabled) {
    onchainText =
      "\n\n<b>ATH sponsor status:</b> Telegram referral tracking is ready; on-chain contract status will activate after ATH contract configuration.";
  } else {
    try {
      const status = await athReferral.sponsorStatus(user.walletAddress);
      onchainText = status.eligibleAsSponsor
        ? `\n\n<b>ATH sponsor status:</b> ACTIVE\nOn-chain referrals: <b>${status.referralCount}</b>\nMining referral bonus: <b>+${status.referralBonusPercent}%</b>`
        : "\n\n<b>ATH sponsor status:</b> wallet linked, but Power is not active yet. The ATH contract will not count this wallet as a sponsor until Power is activated.";
    } catch (err) {
      onchainText = "\n\n<b>ATH sponsor status:</b> temporarily unavailable; Telegram attribution remains recorded.";
      console.error("ATH sponsor status error:", err.message);
    }
  }

  const body = link
    ? `<b>Your ATH referral link</b>\n<code>${link}</code>\n\nTelegram referrals: <b>${count}</b>${onchainText}\n\nSelf-referral and repeat Telegram attribution are blocked. Official mining referral credit is determined by the ATH contract when the invited user buys Power.`
    : `BOT username has not been configured yet. Telegram referrals: <b>${count}</b>.${onchainText}`;

  return send(chatId, body);
}

async function showReferral(chatId, userId) {
  const user = await storage.getUser(userId);
  if (!user) return send(chatId, "User profile is not initialized. Send /start first.");

  if (!user.walletAddress) {
    return send(
      chatId,
      "<b>ATH Referral</b>\n\nLink your public BSC/EVM wallet first:\n<code>/wallet 0xYOUR_PUBLIC_ADDRESS</code>\n\nNever send a private key or seed phrase."
    );
  }

  let ownStatus = null;
  if (athReferral.enabled) {
    try {
      ownStatus = await athReferral.walletStatus(user.walletAddress);
    } catch (err) {
      console.error("ATH member status error:", err.message);
    }
  }

  if (
    ownStatus?.hasPower &&
    ownStatus.onchainReferrer &&
    !/^0x0{40}$/i.test(ownStatus.onchainReferrer)
  ) {
    return send(
      chatId,
      `<b>ATH Referral — ON-CHAIN CONFIRMED</b>\n\nYour wallet: <code>${user.walletAddress}</code>\nOfficial sponsor: <code>${ownStatus.onchainReferrer}</code>\nYour active referrals: <b>${ownStatus.referralCount}</b>\nYour referral mining bonus: <b>+${ownStatus.referralBonusPercent}%</b>\n\nThe smart contract is now the source of truth for this referral relationship.`
    );
  }

  const sponsor = await storage.getReferrerForUser(userId);
  if (!sponsor) {
    const ownText = ownStatus?.hasPower
      ? `\n\nYour Power is active. Active referrals: <b>${ownStatus.referralCount}</b>; bonus: <b>+${ownStatus.referralBonusPercent}%</b>.`
      : "";
    return send(
      chatId,
      `<b>ATH Referral</b>\n\nNo Telegram sponsor is attached to this account.${ownText}`
    );
  }

  if (!sponsor.walletAddress) {
    return send(
      chatId,
      "<b>ATH Referral — PENDING</b>\n\nYour Telegram sponsor is recorded, but the sponsor has not linked a public wallet yet. No on-chain sponsor address will be inserted until that is resolved."
    );
  }

  if (sponsor.walletAddress.toLowerCase() === user.walletAddress.toLowerCase()) {
    return send(
      chatId,
      "<b>ATH Referral — BLOCKED</b>\n\nSponsor and member wallet are identical. ATH does not allow self-referral."
    );
  }

  if (!athReferral.enabled) {
    return send(
      chatId,
      `<b>ATH Referral — TELEGRAM ATTRIBUTION READY</b>\n\nSponsor wallet: <code>${sponsor.walletAddress}</code>\n\nThe ATH mining contract is not configured in the bot yet, so no claim is made that the sponsor is on-chain eligible. Once the verified contract address is connected, the bot will validate Power before routing the referral into AETHER Wallet.`
    );
  }

  let sponsorStatus;
  try {
    sponsorStatus = await athReferral.sponsorStatus(sponsor.walletAddress);
  } catch (err) {
    console.error("ATH sponsor lookup error:", err.message);
    return send(
      chatId,
      "<b>ATH Referral</b>\n\nTelegram sponsor attribution is stored, but the on-chain sponsor status is temporarily unavailable. No referral transaction was created."
    );
  }

  if (!sponsorStatus.eligibleAsSponsor) {
    return send(
      chatId,
      `<b>ATH Referral — WAITING FOR SPONSOR POWER</b>\n\nSponsor wallet: <code>${sponsor.walletAddress}</code>\n\nThe sponsor does not currently qualify under the ATH contract because Power is not active. Telegram attribution is preserved, but the bot will not present this wallet as an active on-chain sponsor yet.`
    );
  }

  const miningUrl = athReferral.buildMiningUrl({
    referrerWallet: sponsor.walletAddress,
    memberWallet: user.walletAddress,
  });

  const keyboard = miningUrl
    ? {
        inline_keyboard: [
          [{ text: "⛏ Activate ATH Power with Sponsor", url: miningUrl }],
        ],
      }
    : undefined;

  return send(
    chatId,
    `<b>ATH Referral — READY</b>\n\nMember wallet: <code>${user.walletAddress}</code>\nEligible sponsor wallet: <code>${sponsor.walletAddress}</code>\nSponsor active referrals: <b>${sponsorStatus.referralCount}</b>\nSponsor mining bonus: <b>+${sponsorStatus.referralBonusPercent}%</b>\n\nWhen you activate Power in AETHER Wallet, the wallet must pass this sponsor address to <code>buyPower(referrer)</code>. The ATH contract makes the final referral decision.`,
    keyboard ? { reply_markup: keyboard } : {}
  );
}

async function handleWallet(message, args) {
  const user = await storage.upsertUser(userFrom(message));
  const address = (args || "").trim();

  if (!address) {
    const current = await storage.getUser(user.telegramId);
    const currentText = current?.walletAddress
      ? `Current wallet: <code>${current.walletAddress}</code>\n\n`
      : "";
    return send(
      message.chat.id,
      `${currentText}To link a public BSC/EVM address, send:\n<code>/wallet 0xYOUR_PUBLIC_ADDRESS</code>\n\nFor referral integrity, a linked wallet cannot be silently replaced. Never send a private key or seed phrase.`
    );
  }

  if (!isAddress(address)) {
    return send(message.chat.id, "That is not a valid non-zero EVM public address.");
  }

  try {
    await storage.setWallet(user.telegramId, address);
  } catch (err) {
    if (err.code === "WALLET_ALREADY_LINKED") {
      return send(
        message.chat.id,
        `A different wallet is already linked: <code>${err.currentWallet}</code>\n\nIt is locked to protect referral attribution. Wallet changes require an explicit account-verification flow rather than silently replacing the sponsor/member identity.`
      );
    }
    throw err;
  }

  await send(
    message.chat.id,
    `Wallet linked for ATH campaign/referral routing:\n<code>${address}</code>`
  );
  return showReferral(message.chat.id, user.telegramId);
}

async function handleAdmin(message, command, args) {
  const adminId = String(message.from?.id || "");
  if (!config.admins.has(adminId)) return false;

  if (command === "adminstats") {
    const s = await storage.stats();
    await send(
      message.chat.id,
      `<b>ATH Bot Stats</b>\nUsers: ${s.users}\nOpted-in: ${s.optedIn}\nLinked wallets: ${s.linkedWallets}\nAttributed Telegram referrals: ${s.referrals}`
    );
    return true;
  }

  if (command === "broadcast") {
    const text = (args || "").trim();
    if (!text) {
      await send(message.chat.id, "Usage: /broadcast your message");
      return true;
    }

    const ids = await storage.optedInChatIds();
    let delivered = 0;
    let failed = 0;

    for (const chatId of ids) {
      try {
        await send(chatId, `<b>ATH Update</b>\n\n${escapeHtml(text)}`);
        delivered += 1;
      } catch {
        failed += 1;
      }
      await sleep(60);
    }

    await send(
      message.chat.id,
      `Broadcast complete. Delivered: ${delivered}. Failed: ${failed}. Only opted-in bot users were targeted.`
    );
    return true;
  }

  return false;
}

async function handleMessage(message) {
  if (!message?.chat?.id || !message?.from?.id) return;
  const text = (message.text || "").trim();
  const user = await storage.upsertUser(userFrom(message));

  if (text.startsWith("/start")) {
    return showHome(message, referralPayload(text));
  }

  const m = text.match(/^\/(\w+)(?:@\w+)?(?:\s+([\s\S]*))?$/);
  const command = m ? m[1].toLowerCase() : "";
  const args = m ? m[2] || "" : "";

  if (command && await handleAdmin(message, command, args)) return;

  if (command === "airdrop") return showAirdrop(message.chat.id);
  if (command === "invite") return showInvite(message.chat.id, user.telegramId);
  if (command === "referral") return showReferral(message.chat.id, user.telegramId);
  if (command === "wallet") return handleWallet(message, args);

  if (command === "stats") {
    const current = await storage.getUser(user.telegramId);
    let onchain = "";
    if (current?.walletAddress && athReferral.enabled) {
      try {
        const s = await athReferral.walletStatus(current.walletAddress);
        onchain =
          `\nOn-chain active referrals: ${s.referralCount}` +
          `\nMining referral bonus: +${s.referralBonusPercent}%`;
      } catch {
        onchain = "\nOn-chain status: temporarily unavailable";
      }
    }

    return send(
      message.chat.id,
      `<b>Your ATH Campaign Stats</b>\nTelegram referrals: ${current?.referralCount || 0}\nWallet linked: ${current?.walletAddress ? "yes" : "no"}${onchain}`
    );
  }

  if (command === "stop") {
    await storage.setOptOut(user.telegramId, true);
    return send(
      message.chat.id,
      "Promotional updates are disabled for this Telegram account. Send /start anytime to opt in again."
    );
  }

  if (command === "help") {
    return send(
      message.chat.id,
      "<b>Commands</b>\n/start — open ATH bot\n/airdrop — ATH campaign information\n/invite — Telegram referral link\n/referral — ATH sponsor/on-chain referral status\n/wallet — link public wallet\n/stats — campaign + on-chain stats\n/edukasi — crypto & ATH education\n/stop — opt out of promotional updates"
    );
  }

  if (community) {
    return community.handleMessage(message);
  }
}

async function handleCallback(query) {
  if (!query?.message?.chat?.id || !query?.from?.id) return;
  await storage.upsertUser({
    telegramId: String(query.from.id),
    username: query.from.username || null,
    firstName: query.from.first_name || null,
    lastName: query.from.last_name || null,
  });

  await telegram("answerCallbackQuery", { callback_query_id: query.id }).catch(() => {});

  if (query.data === "airdrop") return showAirdrop(query.message.chat.id);
  if (query.data === "invite") return showInvite(query.message.chat.id, String(query.from.id));
  if (query.data === "referral") return showReferral(query.message.chat.id, String(query.from.id));

  if (community) {
    return community.handleCallback(query);
  }
}

async function pollingLoop() {
  const me = await telegram("getMe");
  console.log(`ATH Telegram bot connected as @${me.username}`);

  while (!stopping) {
    try {
      const updates = await telegram("getUpdates", {
        offset,
        timeout: 30,
        allowed_updates: ["message", "callback_query", "chat_join_request"],
      });

      for (const update of updates) {
        offset = update.update_id + 1;
        if (update.chat_join_request && community) {
          await community.handleJoinRequest(update.chat_join_request);
        }
        if (update.message) await handleMessage(update.message);
        if (update.callback_query) await handleCallback(update.callback_query);
      }
    } catch (err) {
      console.error("Telegram polling error:", err.message);
      await sleep(2000);
    }
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

async function boot() {
  await storage.init();

  community = createCommunity({
    telegram,
    storage,
    config,
    send,
    escapeHtml,
  });

  const server = http.createServer(async (req, res) => {
    if (req.url === "/health") {
      const s = await storage.stats().catch(() => null);
      const referralHealth = await athReferral.health().catch(() => ({
        enabled: athReferral.enabled,
        ready: false,
      }));

      res.writeHead(s ? 200 : 503, { "content-type": "application/json" });
      res.end(JSON.stringify({
        ok: Boolean(s),
        botEnabled: config.enabled,
        storage: config.databaseUrl ? "postgres" : "memory",
        communityFeatures: config.communityFeaturesEnabled,
        joinVerification: config.joinVerificationEnabled,
        targetChats: config.targetChats.length,
        athReferralConfigured: athReferral.enabled,
        athReferralReady: Boolean(referralHealth.ready),
        nonce: crypto.randomBytes(4).toString("hex"),
      }));
      return;
    }

    res.writeHead(200, { "content-type": "text/plain" });
    res.end("AETHER ATH Telegram Bot");
  });

  server.listen(config.port, "0.0.0.0", () => {
    console.log(`ATH Telegram bot health server listening on ${config.port}`);
  });

  if (!config.enabled) {
    console.log("BOT_ENABLED=false; Telegram polling is intentionally disabled.");
    return;
  }

  if (!config.token) {
    throw new Error("BOT_ENABLED=true but TELEGRAM_BOT_TOKEN is missing");
  }

  stopScheduler = startScheduler({
    config,
    community,
    send,
    escapeHtml,
  });

  pollingLoop().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

async function shutdown() {
  stopping = true;
  stopScheduler();
  await storage.close().catch(() => {});
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

boot().catch((err) => {
  console.error(err);
  process.exit(1);
});
