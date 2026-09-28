const { FloodGuard, containsForbidden, detectTopic } = require("./services/moderation");
const { calculateCryptoScore, isEligible } = require("./services/scoring");
const { EDUCATION, educationKeyboard } = require("./content/education");
const { PromotionService } = require("./services/promotion");

function createCommunity({ telegram, storage, config, send, escapeHtml }) {
  const floodGuard = new FloodGuard({
    limit: config.floodLimit,
    windowSeconds: config.floodWindowSeconds,
  });
  const promotion = new PromotionService({ cooldownHours: config.softPromoHours });
  const joinStates = new Map();
  const warnings = new Map();

  function isAdmin(userId) {
    return config.admins.has(String(userId));
  }

  function joinKey(userId, chatId) {
    return String(userId) + ":" + String(chatId);
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
      };
    }

    const first = String(args).trim().split(/\s+/)[0];
    if (/^\d+$/.test(first)) return { id: first, name: first };
    return null;
  }

  async function handleJoinRequest(request) {
    if (!config.communityFeaturesEnabled || !config.joinVerificationEnabled) return false;
    if (!request?.from?.id || !request?.chat?.id) return false;

    const userId = String(request.from.id);
    const chatId = String(request.chat.id);
    joinStates.set(joinKey(userId, chatId), {
      userId,
      chatId,
      interests: [],
      experience: "beginner",
      hasWallet: false,
      stage: "start",
      createdAt: Date.now(),
    });

    try {
      await send(
        userId,
        `Hello ${escapeHtml(request.from.first_name || "friend")}!\n\nYou requested to join <b>${escapeHtml(request.chat.title || "the ATH community")}</b>. To help keep the community focused, please complete a short crypto-interest verification.`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Start Verification", callback_data: `verify:start:${chatId}` }],
            ],
          },
        }
      );
    } catch {
      await telegram("declineChatJoinRequest", {
        chat_id: chatId,
        user_id: Number(userId),
      }).catch(() => {});
    }

    return true;
  }

  async function verificationCallback(query) {
    const data = String(query.data || "");
    if (!data.startsWith("verify:")) return false;

    const userId = String(query.from.id);
    const parts = data.split(":");
    const action = parts[1];

    if (action === "start") {
      const chatId = parts[2];
      const key = joinKey(userId, chatId);
      const state = joinStates.get(key);
      if (!state) {
        await send(query.message.chat.id, "This verification request has expired.");
        return true;
      }
      state.stage = "interests";
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
      const chatId = parts[2];
      const value = parts[3];
      const key = joinKey(userId, chatId);
      const state = joinStates.get(key);
      if (!state) return true;

      if (value === "done") {
        if (!state.interests.length) {
          await telegram("answerCallbackQuery", {
            callback_query_id: query.id,
            text: "Please select at least one interest first.",
            show_alert: true,
          }).catch(() => {});
          return true;
        }

        state.stage = "experience";
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

      if (!state.interests.includes(value)) state.interests.push(value);
      await telegram("answerCallbackQuery", {
        callback_query_id: query.id,
        text: "Added: " + value,
      }).catch(() => {});
      return true;
    }

    if (action === "exp") {
      const chatId = parts[2];
      const exp = parts[3];
      const state = joinStates.get(joinKey(userId, chatId));
      if (!state) return true;
      state.experience = exp;
      state.stage = "wallet";

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
      const chatId = parts[2];
      const hasWallet = parts[3] === "yes";
      const key = joinKey(userId, chatId);
      const state = joinStates.get(key);
      if (!state) return true;

      state.hasWallet = hasWallet;
      const score = calculateCryptoScore({
        interests: state.interests,
        experience: state.experience,
        hasWallet,
      });
      const eligible = isEligible(score, config.minCryptoScore);

      if (eligible) {
        await telegram("approveChatJoinRequest", {
          chat_id: chatId,
          user_id: Number(userId),
        }).catch(() => {});
      } else {
        await telegram("declineChatJoinRequest", {
          chat_id: chatId,
          user_id: Number(userId),
        }).catch(() => {});
      }

      await telegram("editMessageText", {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        text: eligible
          ? `Verification successful. Crypto score: <b>${score}/100</b>. Your join request has been approved.`
          : `Crypto score: <b>${score}/100</b>. The current community minimum is <b>${config.minCryptoScore}</b>. Please review the crypto education materials and try again later.`,
        parse_mode: "HTML",
      });

      joinStates.delete(key);
      return true;
    }

    return true;
  }

  async function educationCommand(message) {
    return send(
      message.chat.id,
      "<b>Crypto & ATH Education Center</b>\n\nChoose a topic:",
      { reply_markup: educationKeyboard() }
    );
  }

  async function educationCallback(query) {
    const data = String(query.data || "");
    if (!data.startsWith("edu:")) return false;
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

  async function moderationAdmin(message, command, args) {
    if (!isAdmin(message.from?.id)) return false;

    const groupId = message.chat?.id;
    const groupType = message.chat?.type;
    const inGroup = groupType === "group" || groupType === "supergroup";

    if (command === "promo") {
      const body = promotion.pick();
      await send(groupId, `<b>ATH Community Update</b>\n\n${escapeHtml(body)}`);
      return true;
    }

    if (command === "warnings") {
      const target = targetFromMessage(message, args);
      if (!target) {
        await send(groupId, "Reply to a user or use /warnings <user_id>");
        return true;
      }
      await send(groupId, `Warnings for <code>${target.id}</code>: <b>${warnings.get(target.id) || 0}</b>`);
      return true;
    }

    if (!inGroup) return false;

    if (["warn", "mute", "unmute", "kick", "ban", "unban"].includes(command)) {
      const target = targetFromMessage(message, args);
      if (!target) {
        await send(groupId, `Reply to a user for /${command}, or provide a user_id.`);
        return true;
      }

      if (command === "warn") {
        const count = (warnings.get(target.id) || 0) + 1;
        warnings.set(target.id, count);
        await send(
          groupId,
          `Warning issued to <code>${target.id}</code>. Total warnings: <b>${count}</b>.`
        );
        return true;
      }

      if (command === "mute") {
        let minutes = 60;
        const first = String(args).trim().split(/\s+/)[0];
        if (/^\d+$/.test(first)) minutes = Math.max(1, Math.min(Number(first), 10080));
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
        await send(groupId, `User <code>${target.id}</code> has been removed from the group.`);
        return true;
      }

      if (command === "ban") {
        await telegram("banChatMember", { chat_id: groupId, user_id: Number(target.id) });
        await send(groupId, `User <code>${target.id}</code> has been banned from the group.`);
        return true;
      }

      if (command === "unban") {
        await telegram("unbanChatMember", {
          chat_id: groupId,
          user_id: Number(target.id),
          only_if_banned: true,
        });
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

    const text = String(message.text);

    if (containsForbidden(text)) {
      await telegram("deleteMessage", {
        chat_id: message.chat.id,
        message_id: message.message_id,
      }).catch(() => {});
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
      return true;
    }

    const topic = detectTopic(text);
    if (topic && EDUCATION[topic]) {
      await send(message.chat.id, EDUCATION[topic]);
      return true;
    }

    return false;
  }

  async function handleMessage(message) {
    if (!message?.from?.id) return false;
    const parsed = parseCommand(message.text || "");

    if (parsed) {
      if (await moderationAdmin(message, parsed.command, parsed.args)) return true;
      if (parsed.command === "education" || parsed.command === "aether") {
        return educationCommand(message);
      }
    }

    return groupMessage(message);
  }

  async function handleCallback(query) {
    if (await verificationCallback(query)) return true;
    if (await educationCallback(query)) return true;
    return false;
  }

  async function sendScheduledPromotion(chatId) {
    if (!promotion.canSend(chatId)) return false;
    await send(
      chatId,
      `<b>ATH Community Update</b>\n\n${escapeHtml(promotion.pick())}`
    );
    return true;
  }

  return {
    handleJoinRequest,
    handleMessage,
    handleCallback,
    sendScheduledPromotion,
  };
}

module.exports = { createCommunity };
