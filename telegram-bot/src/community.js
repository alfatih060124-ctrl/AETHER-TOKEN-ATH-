const { FloodGuard, containsForbidden, detectTopic } = require("./services/moderation");
const { calculateCryptoScore, isEligible } = require("./services/scoring");
const { EDUCATION, educationKeyboard } = require("./content/education");
const {
  articleForDate,
  articlesByCategory,
  articleById,
  articleKeyboard,
} = require("./content/articles");
const { PromotionService } = require("./services/promotion");
const { createAIReplyService } = require("./services/aiReply");

function createCommunity({ telegram, storage, config, send, escapeHtml }) {
  const floodGuard = new FloodGuard({
    limit: config.floodLimit,
    windowSeconds: config.floodWindowSeconds,
  });
  const promotion = new PromotionService({ cooldownHours: config.softPromoHours });
  const aiReply = createAIReplyService(config);

  function isAdmin(userId) {
    return config.admins.has(String(userId));
  }

  function isTargetChat(chatId) {
    if (!config.targetChats.length) return false;
    return config.targetChats.includes(String(chatId));
  }

  function parseCommand(text = "") {
    const m = String(text).trim().match(/^\/(\w+)(?:@\w+)?(?:\s+([\s\S]*))?$/);
    return m ? { command: m[1].toLowerCase(), args: m[2] || "" } : null;
  }

  function targetFromMessage(message, args = "") {
    if (message.reply_to_message?.from?.id) {
      return {
        id: String(message.reply_to_message.from.id),
        name:
          message.reply_to_message.from.first_name ||
          message.reply_to_message.from.username ||
          String(message.reply_to_message.from.id),
        viaReply: true,
      };
    }

    const first = String(args).trim().split(/\s+/)[0];
    if (/^\d+$/.test(first)) return { id: first, name: first, viaReply: false };
    return null;
  }

  function aetherWalletCta() {
    if (!config.appUrl) return "";
    return `\n\n<b>AETHER Wallet — Official Web3 Gateway</b>\n${escapeHtml(config.appUrl)}\nUse the official AETHER Wallet to explore supported Web3 features. Never share your seed phrase or private key.`;
  }

  function muteMinutes(message, args = "", target) {
    const tokens = String(args).trim().split(/\s+/).filter(Boolean);
    const candidate = target?.viaReply ? tokens[0] : tokens[1];
    if (!/^\d+$/.test(candidate || "")) return 60;
    return Math.max(1, Math.min(Number(candidate), 10080));
  }

  async function handleJoinRequest(request) {
    if (!config.communityFeaturesEnabled || !config.joinVerificationEnabled) return false;
    if (!request?.from?.id || !request?.chat?.id) return false;
    if (!isTargetChat(request.chat.id)) return false;

    const userId = String(request.from.id);
    const chatId = String(request.chat.id);
    const verificationChatId = String(request.user_chat_id || request.from.id);

    // Do not resolve a guard-bot query before sending the verification DM.
    // Telegram only guarantees temporary access to user_chat_id while the
    // join request is still unprocessed.
    await storage.upsertUser({
      telegramId: userId,
      username: request.from.username || null,
      firstName: request.from.first_name || null,
      lastName: request.from.last_name || null,
    });
    await storage.recordGroup({
      chatId,
      title: request.chat.title || null,
      type: request.chat.type || "group",
      isActive: true,
    });

    await storage.saveJoinRequest({
      userId,
      chatId,
      interests: [],
      experience: "beginner",
      hasWallet: false,
      stage: "start",
      status: "pending",
    });

    // Bot API join-request queries must be acknowledged quickly. Queue the
    // decision first, then use the temporary user_chat_id for verification.
    if (request.query_id) {
      await telegram("answerChatJoinRequestQuery", {
        chat_join_request_query_id: request.query_id,
        result: "queue",
      }).catch((error) => {
        console.warn(
          "ATH join request query acknowledgement failed:",
          error?.message || error
        );
      });
    }

    try {
      await send(
        verificationChatId,
        `Hello ${escapeHtml(request.from.first_name || "friend")}!\n\nYou requested to join <b>${escapeHtml(request.chat.title || "the ATH community")}</b>. To help keep the community focused, please complete a short crypto-interest verification.`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Start Verification", callback_data: `verify:start:${chatId}` }],
            ],
          },
        }
      );
    } catch (error) {
      console.warn(
        "ATH join verification could not start:",
        error?.message || error,
        `query=${Boolean(request.query_id)} temporaryChat=${Boolean(request.user_chat_id)}`
      );

      await storage.updateJoinRequest(userId, chatId, {
        status: "pending_start_required",
      });
    }

    return true;
  }

  async function verificationCallback(query) {
    const data = String(query.data || "");
    if (!data.startsWith("verify:")) return false;

    const userId = String(query.from.id);
    const parts = data.split(":");
    const action = parts[1];
    const chatId = parts[2];
    if (!chatId || !isTargetChat(chatId)) return true;

    const state = await storage.getJoinRequest(userId, chatId);
    if (!state || state.status !== "pending") {
      await send(query.message.chat.id, "This verification request has expired or has already been completed.");
      return true;
    }

    if (action === "start") {
      await telegram("answerCallbackQuery", { callback_query_id: query.id }).catch(() => {});
      await storage.updateJoinRequest(userId, chatId, { stage: "interests" });
      await telegram("editMessageText", {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        text: "Select your crypto interests. You may choose more than one, then tap Done:",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "Airdrop", callback_data: `verify:interest:${chatId}:airdrop` },
              { text: "Trading", callback_data: `verify:interest:${chatId}:trading` },
            ],
            [
              { text: "Staking", callback_data: `verify:interest:${chatId}:staking` },
              { text: "Mining", callback_data: `verify:interest:${chatId}:mining` },
            ],
            [{ text: "Done", callback_data: `verify:interest:${chatId}:done` }],
          ],
        },
      });
      return true;
    }

    if (action === "interest") {
      const value = parts[3];

      if (value === "done") {
        if (!state.interests.length) {
          await telegram("answerCallbackQuery", {
            callback_query_id: query.id,
            text: "Please select at least one interest first.",
            show_alert: true,
          }).catch(() => {});
          return true;
        }

        await telegram("answerCallbackQuery", { callback_query_id: query.id }).catch(() => {});
        await storage.updateJoinRequest(userId, chatId, { stage: "experience" });
        await telegram("editMessageText", {
          chat_id: query.message.chat.id,
          message_id: query.message.message_id,
          text: "How experienced are you with crypto?",
          reply_markup: {
            inline_keyboard: [
              [{ text: "Beginner", callback_data: `verify:exp:${chatId}:beginner` }],
              [{ text: "Intermediate", callback_data: `verify:exp:${chatId}:intermediate` }],
              [{ text: "Advanced", callback_data: `verify:exp:${chatId}:advanced` }],
            ],
          },
        });
        return true;
      }

      const interests = [...new Set([...(state.interests || []), value])];
      await storage.updateJoinRequest(userId, chatId, { interests, stage: "interests" });
      await telegram("answerCallbackQuery", {
        callback_query_id: query.id,
        text: "Added: " + value,
      }).catch(() => {});
      return true;
    }

    if (action === "exp") {
      await telegram("answerCallbackQuery", { callback_query_id: query.id }).catch(() => {});
      const experience = parts[3];
      await storage.updateJoinRequest(userId, chatId, {
        experience,
        stage: "country",
      });

      await telegram("editMessageText", {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        text: "Select your country or region for community analytics and crypto-interest scoring:",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "Brazil", callback_data: `verify:country:${chatId}:BR` },
              { text: "Nigeria", callback_data: `verify:country:${chatId}:NG` },
            ],
            [
              { text: "India", callback_data: `verify:country:${chatId}:IN` },
              { text: "Indonesia", callback_data: `verify:country:${chatId}:ID` },
            ],
            [
              { text: "Vietnam", callback_data: `verify:country:${chatId}:VN` },
              { text: "Philippines", callback_data: `verify:country:${chatId}:PH` },
            ],
            [
              { text: "Ukraine", callback_data: `verify:country:${chatId}:UA` },
              { text: "Thailand", callback_data: `verify:country:${chatId}:TH` },
            ],
            [
              { text: "South Africa", callback_data: `verify:country:${chatId}:ZA` },
              { text: "Türkiye", callback_data: `verify:country:${chatId}:TR` },
            ],
            [
              { text: "United States", callback_data: `verify:country:${chatId}:US` },
              { text: "Japan", callback_data: `verify:country:${chatId}:JP` },
            ],
            [
              { text: "South Korea", callback_data: `verify:country:${chatId}:KR` },
              { text: "Mexico", callback_data: `verify:country:${chatId}:MX` },
            ],
            [
              { text: "Canada", callback_data: `verify:country:${chatId}:CA` },
              { text: "Other", callback_data: `verify:country:${chatId}:OTHER` },
            ],
          ],
        },
      });
      return true;
    }

    if (action === "country") {
      await telegram("answerCallbackQuery", { callback_query_id: query.id }).catch(() => {});
      const countryCode = parts[3] || "OTHER";
      await storage.updateJoinRequest(userId, chatId, {
        countryCode,
        stage: "wallet",
      });

      await telegram("editMessageText", {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        text: "Do you already have a crypto wallet?",
        reply_markup: {
          inline_keyboard: [
            [{ text: "Yes, I have a wallet", callback_data: `verify:wallet:${chatId}:yes` }],
            [{ text: "Not yet", callback_data: `verify:wallet:${chatId}:no` }],
          ],
        },
      });
      return true;
    }

    if (action === "wallet") {
      await telegram("answerCallbackQuery", { callback_query_id: query.id }).catch(() => {});
      const hasWallet = parts[3] === "yes";
      const latest = await storage.updateJoinRequest(userId, chatId, {
        hasWallet,
        stage: "scoring",
      });
      if (!latest) return true;

      const score = calculateCryptoScore(
        {
          interests: latest.interests,
          experience: latest.experience,
          hasWallet,
        },
        latest.countryCode
      );
      const eligible = isEligible(score, config.minCryptoScore);

      if (eligible) {
        await telegram("approveChatJoinRequest", {
          chat_id: chatId,
          user_id: Number(userId),
        });
      } else {
        await telegram("declineChatJoinRequest", {
          chat_id: chatId,
          user_id: Number(userId),
        });
      }

      await storage.completeJoinRequest(userId, chatId, {
        status: eligible ? "approved" : "declined_score",
        score,
      });

      await telegram("editMessageText", {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        text: eligible
          ? `Verification successful. Crypto score: <b>${score}/100</b>. Your join request has been approved.`
          : `Crypto score: <b>${score}/100</b>. The current community minimum is <b>${config.minCryptoScore}</b>. Please review the crypto education materials and try again later.`,
        parse_mode: "HTML",
      });
      return true;
    }

    return true;
  }

  async function educationCommand(message) {
    return send(
      message.chat.id,
      `<b>Crypto & ATH Education Center</b>\n\nChoose a topic:${aetherWalletCta()}`,
      { reply_markup: educationKeyboard() }
    );
  }

  async function articleCommand(message) {
    return send(
      message.chat.id,
      "<b>ATH Crypto Article Center</b>\n\nChoose a category or open today's featured article:",
      { reply_markup: articleKeyboard() }
    );
  }

  async function articleCallback(query) {
    const data = String(query.data || "");
    if (!data.startsWith("article:")) return false;

    await telegram("answerCallbackQuery", { callback_query_id: query.id }).catch(() => {});

    let body = "";
    if (data === "article:latest") {
      body = articleForDate();
    } else if (data.startsWith("article:cat:")) {
      const category = data.split(":")[2];
      const items = articlesByCategory(category);
      if (!items.length) {
        await telegram("answerCallbackQuery", {
          callback_query_id: query.id,
          text: "No article is available in this category yet.",
          show_alert: true,
        }).catch(() => {});
        return true;
      }
      body = items[0].body;
    } else if (data.startsWith("article:id:")) {
      const article = articleById(data.split(":").slice(2).join(":"));
      if (!article) return true;
      body = article.body;
    } else {
      return true;
    }

    await telegram("editMessageText", {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id,
      text: body,
      parse_mode: "HTML",
      reply_markup: articleKeyboard(),
    }).catch(async () => {
      await send(query.message.chat.id, body, { reply_markup: articleKeyboard() });
    });
    return true;
  }

  async function educationCallback(query) {
    const data = String(query.data || "");
    if (!data.startsWith("edu:")) return false;
    await telegram("answerCallbackQuery", { callback_query_id: query.id }).catch(() => {});
    const topic = data.split(":")[1];
    const body = EDUCATION[topic];
    if (!body) return true;

    await telegram("editMessageText", {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id,
      text: body,
      parse_mode: "HTML",
      reply_markup: educationKeyboard(),
    }).catch(async () => {
      await send(query.message.chat.id, body, { reply_markup: educationKeyboard() });
    });
    return true;
  }

  async function writeModerationLog(message, target, action, reason = null, metadata = {}) {
    return storage.logModeration({
      chatId: message.chat.id,
      targetUserId: target?.id || null,
      actorUserId: message.from?.id || null,
      action,
      reason,
      metadata,
    });
  }

  async function moderationAdmin(message, command, args) {
    if (!isAdmin(message.from?.id)) return false;

    const groupId = message.chat?.id;
    const groupType = message.chat?.type;
    const inGroup = groupType === "group" || groupType === "supergroup";

    if (command === "promo") {
      if (!isTargetChat(groupId)) {
        await send(groupId, "This chat is not configured as an ATH target community.");
        return true;
      }
      const body = promotion.pick();
      await send(groupId, `<b>ATH Community Update</b>\n\n${escapeHtml(body)}${aetherWalletCta()}`);
      await writeModerationLog(message, null, "manual_promo");
      return true;
    }

    if (command === "warnings") {
      const target = targetFromMessage(message, args);
      if (!target) {
        await send(groupId, "Reply to a user or use /warnings <user_id>");
        return true;
      }
      const count = await storage.getWarnings(groupId, target.id);
      await send(groupId, `Warnings for <code>${target.id}</code>: <b>${count}</b>`);
      return true;
    }

    if (command === "modlog") {
      const logs = await storage.recentModerationLogs(groupId, 10);
      if (!logs.length) {
        await send(groupId, "No moderation events have been recorded for this chat yet.");
        return true;
      }
      const lines = logs.map((row) => {
        const target = row.targetUserId ? ` target=${row.targetUserId}` : "";
        return `• ${row.action}${target} — ${new Date(row.createdAt).toISOString()}`;
      });
      await send(groupId, "<b>Recent Moderation Log</b>\n" + lines.join("\n"));
      return true;
    }

    if (!inGroup || !isTargetChat(groupId)) return false;

    if (["warn", "mute", "unmute", "kick", "ban", "unban"].includes(command)) {
      const target = targetFromMessage(message, args);
      if (!target) {
        await send(groupId, `Reply to a user for /${command}, or provide a user_id.`);
        return true;
      }

      if (command === "warn") {
        const count = await storage.addWarning(groupId, target.id);
        await writeModerationLog(message, target, "warn", null, { warningCount: count });
        await send(
          groupId,
          `Warning issued to <code>${target.id}</code>. Total warnings: <b>${count}</b>.`
        );
        return true;
      }

      if (command === "mute") {
        const minutes = muteMinutes(message, args, target);
        const until = Math.floor(Date.now() / 1000) + minutes * 60;
        await telegram("restrictChatMember", {
          chat_id: groupId,
          user_id: Number(target.id),
          until_date: until,
          permissions: {
            can_send_messages: false,
            can_send_audios: false,
            can_send_documents: false,
            can_send_photos: false,
            can_send_videos: false,
            can_send_video_notes: false,
            can_send_voice_notes: false,
            can_send_polls: false,
            can_send_other_messages: false,
            can_add_web_page_previews: false,
            can_change_info: false,
            can_invite_users: false,
            can_pin_messages: false,
            can_manage_topics: false,
          },
        });
        await writeModerationLog(message, target, "mute", null, { minutes });
        await send(groupId, `User <code>${target.id}</code> has been muted for ${minutes} minutes.`);
        return true;
      }

      if (command === "unmute") {
        await telegram("restrictChatMember", {
          chat_id: groupId,
          user_id: Number(target.id),
          permissions: {
            can_send_messages: true,
            can_send_audios: true,
            can_send_documents: true,
            can_send_photos: true,
            can_send_videos: true,
            can_send_video_notes: true,
            can_send_voice_notes: true,
            can_send_polls: true,
            can_send_other_messages: true,
            can_add_web_page_previews: true,
            can_change_info: false,
            can_invite_users: true,
            can_pin_messages: false,
            can_manage_topics: false,
          },
        });
        await writeModerationLog(message, target, "unmute");
        await send(groupId, `User <code>${target.id}</code> has been unmuted.`);
        return true;
      }

      if (command === "kick") {
        await telegram("banChatMember", { chat_id: groupId, user_id: Number(target.id) });
        await telegram("unbanChatMember", {
          chat_id: groupId,
          user_id: Number(target.id),
          only_if_banned: true,
        });
        await writeModerationLog(message, target, "kick");
        await send(groupId, `User <code>${target.id}</code> has been removed from the group.`);
        return true;
      }

      if (command === "ban") {
        await telegram("banChatMember", { chat_id: groupId, user_id: Number(target.id) });
        await writeModerationLog(message, target, "ban");
        await send(groupId, `User <code>${target.id}</code> has been banned from the group.`);
        return true;
      }

      if (command === "unban") {
        await telegram("unbanChatMember", {
          chat_id: groupId,
          user_id: Number(target.id),
          only_if_banned: true,
        });
        await writeModerationLog(message, target, "unban");
        await send(groupId, `User <code>${target.id}</code> has been unbanned.`);
        return true;
      }
    }

    return false;
  }

  async function groupMessage(message) {
    if (!config.communityFeaturesEnabled) return false;
    if (!message?.text || message.from?.is_bot) return false;
    if (!["group", "supergroup"].includes(message.chat?.type)) return false;
    if (!isTargetChat(message.chat.id)) return false;

    const text = String(message.text);

    if (containsForbidden(text)) {
      await telegram("deleteMessage", {
        chat_id: message.chat.id,
        message_id: message.message_id,
      }).catch(() => {});
      await storage.logModeration({
        chatId: message.chat.id,
        targetUserId: message.from.id,
        actorUserId: null,
        action: "auto_delete_risky",
        reason: "forbidden_pattern",
      });
      await send(
        message.chat.id,
        `A message from ${escapeHtml(message.from.first_name || "member")} was removed because it was detected as risky or spam.`
      );
      return true;
    }

    if (floodGuard.isFlooding(message.from.id)) {
      await telegram("deleteMessage", {
        chat_id: message.chat.id,
        message_id: message.message_id,
      }).catch(() => {});
      await storage.logModeration({
        chatId: message.chat.id,
        targetUserId: message.from.id,
        actorUserId: null,
        action: "auto_delete_flood",
        reason: "flood_limit",
      });
      return true;
    }

    const topic = detectTopic(text);
    if (topic && EDUCATION[topic]) {
      await send(message.chat.id, `${EDUCATION[topic]}${aetherWalletCta()}`);
      return true;
    }

    if (aiReply.enabled) {
      const lower = text.toLowerCase();
      const username = String(config.username || "").toLowerCase();
      const isMentioned = Boolean(username && lower.includes("@" + username));
      const isQuestion =
        text.includes("?") ||
        /\b(what|why|how|when|where|can|could|should|help|explain|tell me)\b/i.test(text);
      const shouldReply =
        isMentioned ||
        isQuestion ||
        Math.random() < Number(config.aiRandomReplyRate || 0);

      if (shouldReply) {
        try {
          const answer = await aiReply.generate({
            userMessage: text,
            userName: message.from.first_name || message.from.username || "member",
            groupName: message.chat.title || "ATH Community",
          });
          if (answer) {
            await send(message.chat.id, escapeHtml(answer));
            return true;
          }
        } catch (err) {
          console.error("AI community reply failed:", err.message);
        }
      }
    }

    return false;
  }

  async function handleMessage(message) {
    if (!message?.from?.id) return false;

    if (
      ["group", "supergroup"].includes(message.chat?.type) &&
      isTargetChat(message.chat?.id) &&
      Array.isArray(message.new_chat_members) &&
      message.new_chat_members.length
    ) {
      const humans = message.new_chat_members.filter((member) => !member.is_bot);
      await storage.recordGroup({
        chatId: message.chat.id,
        title: message.chat.title || null,
        type: message.chat.type || "group",
        isActive: true,
      });
      for (const member of humans) {
        await storage.upsertUser({
          telegramId: String(member.id),
          username: member.username || null,
          firstName: member.first_name || null,
          lastName: member.last_name || null,
        });
        const profile = await storage.getUser(member.id);
        await storage.recordMembership({
          userId: member.id,
          chatId: message.chat.id,
          role: "member",
          joinMethod: profile?.isVerified ? "verified_join_request" : "telegram_join",
          joinScore: profile?.cryptoScore || 0,
        });
        await storage.logModeration({
          chatId: message.chat.id,
          targetUserId: member.id,
          actorUserId: null,
          action: "member_join",
        });
      }
      if (humans.length) {
        const names = humans
          .map((member) => escapeHtml(member.first_name || member.username || "member"))
          .join(", ");
        await send(
          message.chat.id,
          `Welcome <b>${names}</b> to the ATH community. Use /education to learn about ATH, mining, referral safety, staking, trading, and wallet security.${aetherWalletCta()}`
        );
        return true;
      }
    }

    const parsed = parseCommand(message.text || "");

    if (parsed) {
      if (await moderationAdmin(message, parsed.command, parsed.args)) return true;
      if (parsed.command === "education") {
        return educationCommand(message);
      }
      if (parsed.command === "aether") {
        return send(message.chat.id, `${EDUCATION.aether}${aetherWalletCta()}`, {
          reply_markup: educationKeyboard(),
        });
      }
      if (parsed.command === "article") {
        return articleCommand(message);
      }
    }

    if (message.chat?.type === "private" && message.text) {
      const text = String(message.text).trim();
      if (/^(hi|hello|hey)\b/i.test(text)) {
        await send(
          message.chat.id,
          `Hello ${escapeHtml(message.from.first_name || "there")}! I am the AETHER ATH community bot. You can ask about airdrops, mining, staking, trading, referrals, AETHER Wallet, or wallet security. Use /help to view commands.${aetherWalletCta()}`
        );
        return true;
      }
      if (aiReply.enabled) {
        try {
          const answer = await aiReply.generate({
            userMessage: text,
            userName: message.from.first_name || message.from.username || "member",
            groupName: "Private Chat",
          });
          if (answer) {
            await send(message.chat.id, escapeHtml(answer));
            return true;
          }
        } catch (err) {
          console.error("AI private reply failed:", err.message);
        }
      }

      await send(
        message.chat.id,
        `I can help with ATH, airdrops, mining, staking, trading, referrals, AETHER Wallet, and wallet security. Use /education to browse topics or /help to view commands.${aetherWalletCta()}`
      );
      return true;
    }

    return groupMessage(message);
  }

  async function handleCallback(query) {
    if (await verificationCallback(query)) return true;
    if (await educationCallback(query)) return true;
    if (await articleCallback(query)) return true;
    return false;
  }

  async function sendScheduledPromotion(chatId) {
    if (!isTargetChat(chatId)) return false;
    if (!promotion.canSend(chatId)) return false;
    await send(
      chatId,
      `<b>ATH Community Update</b>\n\n${escapeHtml(promotion.pick())}${aetherWalletCta()}`
    );
    return true;
  }

  return {
    handleJoinRequest,
    handleMessage,
    handleCallback,
    sendScheduledPromotion,
    articleCommand,
  };
}

module.exports = { createCommunity };
