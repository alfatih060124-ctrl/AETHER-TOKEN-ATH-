function msUntilNextUtcHour(hour) {
  const now = new Date();
  const next = new Date(now);
  next.setUTCMinutes(0, 0, 0);
  next.setUTCHours(Number(hour));
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  return next.getTime() - now.getTime();
}

function startScheduler({ config, community, send, escapeHtml }) {
  const timers = [];

  if (!config.communityFeaturesEnabled || !config.targetChats.length) {
    return () => {};
  }

  const promoEveryMs = Math.max(6, Number(config.softPromoHours)) * 60 * 60 * 1000;
  const promoTimer = setInterval(async () => {
    for (const chatId of config.targetChats) {
      try {
        await community.sendScheduledPromotion(chatId);
      } catch (err) {
        console.error("Scheduled promo failed:", chatId, err.message);
      }
    }
  }, promoEveryMs);
  timers.push(promoTimer);

  const articleDelay = msUntilNextUtcHour(config.articleHourUtc);
  const articleText = [
    "<b>ATH Education — Referral & Security</b>",
    "",
    "Telegram referrals help bring new members into the ecosystem.",
    "Official mining referral credit is recorded only after Power is activated through the smart contract with a valid sponsor.",
    "",
    "Never provide a seed phrase or private key to the bot or an admin.",
    "",
    "Use /education for more learning materials.",
  ].join("\n");

  const scheduleArticle = () => {
    const daily = setInterval(async () => {
      for (const chatId of config.targetChats) {
        try {
          await send(chatId, articleText);
        } catch (err) {
          console.error("Scheduled article failed:", chatId, err.message);
        }
      }
    }, 24 * 60 * 60 * 1000);
    timers.push(daily);
  };

  const initial = setTimeout(async () => {
    for (const chatId of config.targetChats) {
      try {
        await send(chatId, articleText);
      } catch (err) {
        console.error("Initial scheduled article failed:", chatId, err.message);
      }
    }
    scheduleArticle();
  }, articleDelay);
  timers.push(initial);

  console.log(
    `Community scheduler active for ${config.targetChats.length} chat(s); soft promo every ${Math.max(6, Number(config.softPromoHours))}h; article at UTC hour ${config.articleHourUtc}.`
  );

  return () => {
    for (const timer of timers) clearInterval(timer);
  };
}

module.exports = { startScheduler, msUntilNextUtcHour };
