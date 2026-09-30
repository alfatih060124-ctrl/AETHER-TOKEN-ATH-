const http = require("http");
const crypto = require("crypto");
const config = require("./config");
const { createStorage } = require("./storage");
const { createATHReferralService, isAddress } = require("./services/athReferral");
const { createCommunity } = require("./community");
const { startScheduler } = require("./scheduler");
const { GrowthCampaign } = require("./services/growthCampaign");
const { overview: aetherFeatureOverview, featureKeyboard, getFeature, featureText } = require("./content/aetherFeatures");
const { linksText, linksKeyboard } = require("./content/aetherLinks");

const API = config.token ? `https://api.telegram.org/bot${config.token}` : "";
const storage = createStorage(config.databaseUrl);
const athReferral = createATHReferralService(config);

let offset = 0;
let stopping = false;
let community = null;
let growthCampaign = null;
let stopScheduler = () => {};
let officialChannelId = config.channelSourceIds[0] || "";
let botIdentity = null;
const channelHubReady = new Set();
const routedChannelMessages = new Set();

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
    { text: "🧩 AETHER Features", callback_data: "features:all" },
    { text: "📚 Education", callback_data: "edu:aether" },
  ]);
  rows.push([{ text: "🔗 Official Links", callback_data: "links" }]);
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
    `<b>AETHER ATH</b>\n\nWelcome to the official ATH community and referral bot.${linked}\n\n<b>AETHER Wallet — Official Web3 Gateway</b>\n${escapeHtml(config.appUrl || "https://wallet.aether.boats/")}\nUse the official AETHER Wallet to explore supported Web3 features and ATH routes.\n\nTelegram attribution is recorded when a new user starts the bot from a referral link. The official ATH on-chain referral is finalized only when Power is purchased through the ATH mining contract with an eligible sponsor wallet.\n\nThis bot never asks for a seed phrase or private key.`,
    { reply_markup: mainKeyboard() }
  );
}

async function showLinks(chatId) {
  return send(chatId, linksText(config), { reply_markup: linksKeyboard(config) });
}

async function showFeatures(chatId, featureId = "all") {
  const walletUrl = config.appUrl || "https://wallet.aether.boats/";
  const body =
    featureId === "all"
      ? aetherFeatureOverview(walletUrl)
      : featureText(getFeature(featureId), walletUrl);
  return send(chatId, body, { reply_markup: featureKeyboard() });
}

async function showAirdrop(chatId) {
  return send(
    chatId,
    `<b>${escapeHtml(config.campaign)}</b>\n\nATH uses a referral mining program. A sponsor must already have Power before a new miner activates Power with that sponsor wallet. Referral tiers raise the sponsor's daily mining multiplier from +10% up to +50% according to the number of qualifying referrals.\n\n<b>AETHER Wallet</b>\n${escapeHtml(config.appUrl || "https://wallet.aether.boats/")}\n\nTelegram is used for acquisition, education and referral routing; the ATH smart contract remains the source of truth for the official on-chain referral count.`
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
      `<b>ATH Bot Stats</b>\nUsers: ${s.users}\nOpted-in: ${s.optedIn}\nLinked wallets: ${s.linkedWallets}\nAttributed Telegram referrals: ${s.referrals}\nJoin requests: ${s.joinRequests || 0}\nGroups: ${s.groups || 0}\nMemberships: ${s.memberships || 0}\nModeration events: ${s.moderationLogs || 0}\nStorage: ${config.databaseUrl ? "PostgreSQL" : "memory"}`
    );
    return true;
  }

  if (command === "growthstatus") {
    if (!growthCampaign) {
      await send(message.chat.id, "ATH growth campaign is not initialized.");
      return true;
    }
    const g = await growthCampaign.status();
    await send(
      message.chat.id,
      `<b>ATH Growth Campaign</b>\nMode: opt-in community posts only\nEnabled: ${g.enabled ? "yes" : "no"}\nApproved source chats: ${g.sourceChats}\nJoined today: ${g.joinedToday}\nDaily target: ${g.min}-${g.max}\nPriority country codes: ${g.priorityCountries.join(", ")}\n\nThe bot does not scrape users or send unsolicited direct messages.`
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
      await sleep(250);
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

  if (command === "myid") {
    return send(
      message.chat.id,
      `Your Telegram User ID: <code>${message.from.id}</code>\n\nUse this numeric ID for <code>ADMIN_TELEGRAM_IDS</code> in Railway.`
    );
  }

  if (command === "chatid") {
    return send(
      message.chat.id,
      `Chat/Group ID: <code>${message.chat.id}</code>\n\nUse this ID for <code>TARGET_CHAT_IDS</code> when this group/channel should receive ATH scheduled content.`
    );
  }

  if (command && await handleAdmin(message, command, args)) return;

  if (command === "links") return showLinks(message.chat.id);
  if (command === "features") return showFeatures(message.chat.id);
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
      "<b>Commands</b>\n/start — open ATH bot\n/airdrop — ATH campaign information\n/invite — Telegram referral link\n/referral — ATH sponsor/on-chain referral status\n/wallet — link public wallet\n/stats — campaign + on-chain stats\n/education — crypto & ATH education\n/aether — AETHER Wallet education\n/features — AETHER Wallet features & services\n/links — official AETHER links\n/article — daily ATH education article\n/myid — show your Telegram User ID\n/chatid — show Chat/Group ID\n/help — command reference\n/stop — opt out of promotional updates\n\n<b>AETHER Wallet</b>\n" + escapeHtml(config.appUrl || "https://wallet.aether.boats/") +
      (config.admins.has(String(message.from.id))
        ? "\n\n<b>Admin Commands</b>\n/adminstats — aggregate bot stats\n/growthstatus — opt-in acquisition status\n/promo — send one soft promotion\n/warn — warn a member\n/warnings — check warnings\n/mute — mute a member\n/unmute — unmute a member\n/kick — remove a member\n/ban — ban a member\n/unban — unban a member\n/modlog — recent moderation log"
        : "")
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

  if (query.data === "airdrop") {
    await telegram("answerCallbackQuery", { callback_query_id: query.id }).catch(() => {});
    return showAirdrop(query.message.chat.id);
  }
  if (query.data === "invite") {
    await telegram("answerCallbackQuery", { callback_query_id: query.id }).catch(() => {});
    return showInvite(query.message.chat.id, String(query.from.id));
  }
  if (query.data === "referral") {
    await telegram("answerCallbackQuery", { callback_query_id: query.id }).catch(() => {});
    return showReferral(query.message.chat.id, String(query.from.id));
  }
  if (query.data === "links") {
    await telegram("answerCallbackQuery", { callback_query_id: query.id }).catch(() => {});
    return showLinks(query.message.chat.id);
  }
  if (String(query.data || "").startsWith("features:")) {
    await telegram("answerCallbackQuery", { callback_query_id: query.id }).catch(() => {});
    const featureId = String(query.data).split(":")[1] || "all";
    return showFeatures(query.message.chat.id, featureId);
  }

  if (community) {
    const handled = await community.handleCallback(query);
    if (handled) return;
  }

  await telegram("answerCallbackQuery", { callback_query_id: query.id }).catch(() => {});
}

async function configureTelegramProfile() {
  const commands = [
    { command: "start", description: "Open the AETHER ATH bot" },
    { command: "airdrop", description: "View ATH airdrop information" },
    { command: "invite", description: "Get your ATH referral link" },
    { command: "referral", description: "Check ATH sponsor and referral status" },
    { command: "wallet", description: "Link your public BSC/EVM wallet" },
    { command: "stats", description: "View your ATH campaign stats" },
    { command: "education", description: "Open crypto and ATH education" },
    { command: "aether", description: "Open AETHER Wallet education" },
    { command: "features", description: "Explore AETHER Wallet features and services" },
    { command: "links", description: "Open official AETHER links" },
    { command: "article", description: "Read the daily ATH education article" },
    { command: "myid", description: "Show your Telegram user ID" },
    { command: "chatid", description: "Show the current chat or group ID" },
    { command: "help", description: "Show the command reference" },
    { command: "stop", description: "Disable promotional updates" },
  ];

  await telegram("setMyCommands", { commands }).catch((err) => {
    console.warn("Unable to register Telegram commands:", err.message);
  });
  await telegram("setMyDescription", {
    description:
      "Official AETHER ecosystem bot for Wallet features, crypto education, hourly updates, ATH community and security. Never share a seed phrase or private key.",
  }).catch((err) => {
    console.warn("Unable to set bot description:", err.message);
  });
  await telegram("setMyShortDescription", {
    short_description: "AETHER Wallet features, crypto updates and ATH community.",
  }).catch((err) => {
    console.warn("Unable to set short bot description:", err.message);
  });
}

async function checkTargetChatAccess(me) {
  if (!config.targetChats.length) return;

  for (const chatId of config.targetChats) {
    try {
      const chat = await telegram("getChat", { chat_id: chatId });
      const member = await telegram("getChatMember", {
        chat_id: chatId,
        user_id: me.id,
      });

      const isAdmin = member.status === "administrator" || member.status === "creator";
      const canDelete = member.status === "creator" || Boolean(member.can_delete_messages);
      const canRestrict = member.status === "creator" || Boolean(member.can_restrict_members);
      const canInvite = member.status === "creator" || Boolean(member.can_invite_users);
      const ready = isAdmin && canDelete && canRestrict && canInvite;

      console.log(
        `ATH target chat ${chatId} (${chat.title || "untitled"}): status=${member.status}; ` +
        `delete=${canDelete}; restrict=${canRestrict}; invite/approve=${canInvite}; ready=${ready}`
      );

      if (!ready) {
        console.warn(
          `ATH target chat ${chatId} is not fully ready. Make @${me.username} an admin with ` +
          "Delete Messages, Restrict/Ban Members, and Invite/Approve permissions."
        );
      }
    } catch (err) {
      console.error(`ATH target chat ${chatId} readiness check failed: ${err.message}`);
    }
  }
}

async function mirrorChannelPost(targetChatId, post) {
  if (!post) return false;

  const common = { chat_id: targetChatId };
  if (post.text) {
    await telegram("sendMessage", {
      ...common,
      text: post.text,
      ...(post.entities ? { entities: post.entities } : {}),
      disable_web_page_preview: false,
    });
    return true;
  }

  const caption = post.caption || "";
  const captionExtra = post.caption_entities ? { caption_entities: post.caption_entities } : {};

  if (Array.isArray(post.photo) && post.photo.length) {
    await telegram("sendPhoto", {
      ...common,
      photo: post.photo[post.photo.length - 1].file_id,
      ...(caption ? { caption, ...captionExtra } : {}),
    });
    return true;
  }
  if (post.video?.file_id) {
    await telegram("sendVideo", { ...common, video: post.video.file_id, ...(caption ? { caption, ...captionExtra } : {}) });
    return true;
  }
  if (post.document?.file_id) {
    await telegram("sendDocument", { ...common, document: post.document.file_id, ...(caption ? { caption, ...captionExtra } : {}) });
    return true;
  }
  if (post.animation?.file_id) {
    await telegram("sendAnimation", { ...common, animation: post.animation.file_id, ...(caption ? { caption, ...captionExtra } : {}) });
    return true;
  }
  if (post.audio?.file_id) {
    await telegram("sendAudio", { ...common, audio: post.audio.file_id, ...(caption ? { caption, ...captionExtra } : {}) });
    return true;
  }
  if (post.voice?.file_id) {
    await telegram("sendVoice", { ...common, voice: post.voice.file_id, ...(caption ? { caption, ...captionExtra } : {}) });
    return true;
  }
  if (post.sticker?.file_id) {
    await telegram("sendSticker", { ...common, sticker: post.sticker.file_id });
    return true;
  }

  return false;
}

async function forwardChannelPostToGroups(channelId, messageId, sourcePost = null) {
  for (const targetChatId of config.targetChats) {
    if (String(targetChatId) === String(channelId)) continue;
    try {
      await telegram("forwardMessage", {
        chat_id: targetChatId,
        from_chat_id: channelId,
        message_id: messageId,
        disable_notification: false,
      });
      continue;
    } catch (err) {
      console.warn(`Forward channel post failed for ${targetChatId}: ${err.message}; trying copy.`);
    }

    try {
      await telegram("copyMessage", {
        chat_id: targetChatId,
        from_chat_id: channelId,
        message_id: messageId,
      });
      continue;
    } catch (err) {
      console.warn(`Copy channel post failed for ${targetChatId}: ${err.message}; trying mirror.`);
    }

    const mirrored = await mirrorChannelPost(targetChatId, sourcePost).catch((err) => {
      console.error(`Mirror channel post failed for ${targetChatId}: ${err.message}`);
      return false;
    });
    if (!mirrored) {
      console.warn(`Channel post ${messageId} could not be mirrored to ${targetChatId}; unsupported post type.`);
    }
  }
}

async function ensureChannelLinksHub(channelId) {
  const key = String(channelId);
  if (channelHubReady.has(key)) return;

  try {
    const chat = await telegram("getChat", { chat_id: channelId });
    if (chat?.pinned_message?.text?.includes("AETHER — Official Links Hub")) {
      channelHubReady.add(key);
      return;
    }
  } catch {}

  channelHubReady.add(key);
  const message = await send(channelId, linksText(config), {
    reply_markup: linksKeyboard(config),
  });
  await telegram("pinChatMessage", {
    chat_id: channelId,
    message_id: message.message_id,
    disable_notification: true,
  }).catch((err) => {
    console.warn("Unable to pin AETHER links hub:", err.message);
  });
}

async function handleChannelPost(post) {
  if (!config.channelForwardEnabled || !post?.chat?.id || !post?.message_id) return;
  const channelId = String(post.chat.id);

  if (config.channelSourceIds.length && !config.channelSourceIds.includes(channelId)) {
    return;
  }

  if (!config.channelSourceIds.length) {
    try {
      const me = botIdentity || await telegram("getMe");
      const member = await telegram("getChatMember", {
        chat_id: channelId,
        user_id: me.id,
      });
      if (!["administrator", "creator"].includes(member.status)) return;
    } catch (err) {
      console.warn("Channel auto-discovery rejected:", err.message);
      return;
    }
  }

  if (!officialChannelId) {
    officialChannelId = channelId;
    console.log(`AETHER official channel auto-discovered: ${channelId} (${post.chat.title || "untitled"}).`);
  }
  if (officialChannelId !== channelId) return;

  await ensureChannelLinksHub(channelId);

  const routeKey = `${channelId}:${post.message_id}`;
  if (routedChannelMessages.has(routeKey)) {
    routedChannelMessages.delete(routeKey);
    return;
  }

  await forwardChannelPostToGroups(channelId, post.message_id, post);
  console.log(`AETHER channel post forwarded: channel=${channelId}; message=${post.message_id}; groups=${config.targetChats.length}.`);
}

async function publishPrimaryUpdate(text, extra = {}) {
  if (officialChannelId) {
    await ensureChannelLinksHub(officialChannelId);
    const message = await send(officialChannelId, text, extra);
    const routeKey = `${officialChannelId}:${message.message_id}`;
    routedChannelMessages.add(routeKey);
    await forwardChannelPostToGroups(officialChannelId, message.message_id);
    return { mode: "channel-first", channelId: officialChannelId, messageId: message.message_id };
  }

  for (const targetChatId of config.targetChats) {
    await send(targetChatId, text, extra);
  }
  return { mode: "group-fallback", channelId: null, messageId: null };
}

async function handleUpdate(update) {
  if (!update || typeof update !== "object") return;
  if (typeof update.update_id === "number") {
    offset = Math.max(offset, update.update_id + 1);
  }
  if (update.chat_join_request && community) {
    await community.handleJoinRequest(update.chat_join_request);
  }
  if (update.channel_post) await handleChannelPost(update.channel_post);
  if (update.message) await handleMessage(update.message);
  if (update.callback_query) await handleCallback(update.callback_query);
}

function webhookSecurity() {
  const digest = crypto.createHash("sha256").update(config.token).digest("hex");
  return {
    path: `/telegram/webhook/${digest.slice(0, 32)}`,
    secret: digest.slice(32, 64),
  };
}

async function startWebhook() {
  if (!config.webhookBaseUrl) {
    throw new Error("WEBHOOK_ENABLED=true but WEBHOOK_BASE_URL is missing");
  }

  const { path, secret } = webhookSecurity();
  const base = config.webhookBaseUrl.replace(/\/+$/, "");
  const url = `${base}${path}`;

  await telegram("setWebhook", {
    url,
    secret_token: secret,
    drop_pending_updates: false,
    allowed_updates: ["message", "channel_post", "callback_query", "chat_join_request"],
    max_connections: 40,
  });

  console.log(`ATH Telegram webhook active at ${base}/telegram/webhook/[redacted]`);
}

async function pollingLoop() {
  await telegram("deleteWebhook", { drop_pending_updates: false }).catch(() => {});
  const me = await telegram("getMe");
  console.log(`ATH Telegram bot connected as @${me.username}`);
  await configureTelegramProfile();
  await checkTargetChatAccess(me);

  while (!stopping) {
    try {
      const updates = await telegram("getUpdates", {
        offset,
        timeout: 30,
        allowed_updates: ["message", "channel_post", "callback_query", "chat_join_request"],
      });

      for (const update of updates) {
        await handleUpdate(update);
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

  growthCampaign = new GrowthCampaign({
    config,
    storage,
    send,
  });

  const server = http.createServer(async (req, res) => {
    if (config.webhookEnabled && req.method === "POST") {
      const { path, secret } = webhookSecurity();
      if (req.url === path) {
        if (req.headers["x-telegram-bot-api-secret-token"] !== secret) {
          res.writeHead(403, { "content-type": "text/plain" });
          res.end("Forbidden");
          return;
        }

        let raw = "";
        req.setEncoding("utf8");
        req.on("data", (chunk) => {
          raw += chunk;
          if (raw.length > 1024 * 1024) req.destroy();
        });
        req.on("end", () => {
          let update;
          try {
            update = JSON.parse(raw || "{}");
          } catch {
            res.writeHead(400, { "content-type": "text/plain" });
            res.end("Bad Request");
            return;
          }

          res.writeHead(200, { "content-type": "text/plain" });
          res.end("OK");
          handleUpdate(update).catch((err) => {
            console.error("Telegram webhook update error:", err.message);
          });
        });
        return;
      }
    }

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
        transport: config.webhookEnabled ? "webhook" : "polling",
        webhookConfigured: Boolean(config.webhookEnabled && config.webhookBaseUrl),
        storage: config.databaseUrl ? "postgres" : "memory",
        communityFeatures: config.communityFeaturesEnabled,
        joinVerification: config.joinVerificationEnabled,
        targetChats: config.targetChats.length,
        athReferralConfigured: athReferral.enabled,
        athReferralReady: Boolean(referralHealth.ready),
        persistentStorage: Boolean(config.databaseUrl),
        adminsConfigured: config.admins.size,
        communityReady:
          config.enabled &&
          config.admins.size > 0 &&
          config.targetChats.length > 0 &&
          config.communityFeaturesEnabled,
        aiReplyEnabled: config.aiReplyEnabled,
        aiReplyReady: Boolean(config.aiReplyEnabled && config.openAiApiKey),
        growthCampaignEnabled: config.growthCampaignEnabled,
        growthCampaignReady: Boolean(growthCampaign?.enabled()),
        growthSourceChats: config.growthSourceChats.length,
        growthDailyTargetMin: config.growthDailyTargetMin,
        growthDailyTargetMax: config.growthDailyTargetMax,
        productionReady:
          config.enabled &&
          config.admins.size > 0 &&
          config.targetChats.length > 0 &&
          config.communityFeaturesEnabled &&
          Boolean(config.databaseUrl),
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

  if (!config.databaseUrl) {
    console.warn(
      "DATABASE_URL is not configured; the bot is running with non-persistent memory storage."
    );
  }

  stopScheduler = startScheduler({
    config,
    community,
    send,
    growthCampaign,
    publishUpdate: publishPrimaryUpdate,
  });

  if (config.webhookEnabled) {
    const me = await telegram("getMe");
    botIdentity = me;
    console.log(`ATH Telegram bot connected as @${me.username}`);
    await configureTelegramProfile();
    await checkTargetChatAccess(me);
    await startWebhook();
  } else {
    pollingLoop().catch((err) => {
      console.error(err);
      process.exit(1);
    });
  }
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
