const http = require("http");
const crypto = require("crypto");
const config = require("./config");
const { createStorage } = require("./storage");

const API = config.token ? `https://api.telegram.org/bot${config.token}` : "";
const storage = createStorage(config.databaseUrl);
let offset = 0;
let stopping = false;

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

function isEvmAddress(value) {
  return /^0x[a-fA-F0-9]{40}$/.test(value || "");
}

function inviteLink(userId) {
  if (!config.username) return "";
  return `https://t.me/${config.username}?start=ref_${userId}`;
}

function mainKeyboard(userId) {
  const rows = [];
  if (config.appUrl) rows.push([{ text: "🚀 Open AETHER", url: config.appUrl }]);
  rows.push([{ text: "🎁 ATH Airdrop", callback_data: "airdrop" }]);
  rows.push([{ text: "👥 Invite Friends", callback_data: "invite" }]);
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
    `<b>AETHER ATH</b>\n\nWelcome to the official ATH promotion bot. Follow campaign updates, share your referral link, and connect a public wallet address when needed.${linked}\n\nThis bot never asks for a seed phrase or private key.`,
    { reply_markup: mainKeyboard(user.telegramId) }
  );
}

async function showAirdrop(chatId) {
  return send(
    chatId,
    `<b>${escapeHtml(config.campaign)}</b>\n\nCampaign tracking is active. On-chain ATH distribution is not performed by this Telegram bot. Final eligibility and claim actions will be connected to the verified AETHER/ATH Web3 flow.`
  );
}

async function showInvite(chatId, userId) {
  const user = await storage.getUser(userId);
  const link = inviteLink(userId);
  const count = user?.referralCount || 0;
  const body = link
    ? `<b>Your ATH referral link</b>\n<code>${link}</code>\n\nCampaign referrals: <b>${count}</b>\n\nOnly real users who start the bot are counted. Self-referral and repeat attribution are blocked.`
    : `BOT username has not been configured yet. Your campaign referral count is <b>${count}</b>.`;
  return send(chatId, body);
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
      `${currentText}To link a public BSC/EVM address, send:\n<code>/wallet 0xYOUR_PUBLIC_ADDRESS</code>\n\nNever send a private key or seed phrase.`
    );
  }

  if (!isEvmAddress(address)) {
    return send(message.chat.id, "That is not a valid 0x EVM public address.");
  }

  await storage.setWallet(user.telegramId, address);
  return send(message.chat.id, `Wallet linked for campaign tracking:\n<code>${address}</code>`);
}

async function handleAdmin(message, command, args) {
  const adminId = String(message.from?.id || "");
  if (!config.admins.has(adminId)) return false;

  if (command === "adminstats") {
    const s = await storage.stats();
    await send(
      message.chat.id,
      `<b>ATH Bot Stats</b>\nUsers: ${s.users}\nOpted-in: ${s.optedIn}\nLinked wallets: ${s.linkedWallets}\nAttributed referrals: ${s.referrals}`
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
  if (!m) return;
  const command = m[1].toLowerCase();
  const args = m[2] || "";

  if (await handleAdmin(message, command, args)) return;

  if (command === "airdrop") return showAirdrop(message.chat.id);
  if (command === "invite") return showInvite(message.chat.id, user.telegramId);
  if (command === "wallet") return handleWallet(message, args);

  if (command === "stats") {
    const current = await storage.getUser(user.telegramId);
    return send(
      message.chat.id,
      `<b>Your ATH Campaign Stats</b>\nReferrals: ${current?.referralCount || 0}\nWallet linked: ${current?.walletAddress ? "yes" : "no"}`
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
      "<b>Commands</b>\n/start — open ATH bot\n/airdrop — campaign information\n/invite — referral link\n/wallet — link public wallet\n/stats — your campaign stats\n/stop — opt out of promotional updates"
    );
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
}

async function pollingLoop() {
  const me = await telegram("getMe");
  console.log(`ATH Telegram bot connected as @${me.username}`);

  while (!stopping) {
    try {
      const updates = await telegram("getUpdates", {
        offset,
        timeout: 30,
        allowed_updates: ["message", "callback_query"],
      });

      for (const update of updates) {
        offset = update.update_id + 1;
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

  const server = http.createServer(async (req, res) => {
    if (req.url === "/health") {
      const s = await storage.stats().catch(() => null);
      res.writeHead(s ? 200 : 503, { "content-type": "application/json" });
      res.end(JSON.stringify({
        ok: Boolean(s),
        botEnabled: config.enabled,
        storage: config.databaseUrl ? "postgres" : "memory",
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

  pollingLoop().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

process.on("SIGTERM", async () => {
  stopping = true;
  await storage.close().catch(() => {});
  process.exit(0);
});

process.on("SIGINT", async () => {
  stopping = true;
  await storage.close().catch(() => {});
  process.exit(0);
});

boot().catch((err) => {
  console.error(err);
  process.exit(1);
});
