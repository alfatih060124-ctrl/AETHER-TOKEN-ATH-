const { articleForDate } = require("./content/articles");

function msUntilNextUtcHour(hour) {
  const now = new Date();
  const next = new Date(now);
  next.setUTCMinutes(0, 0, 0);
  next.setUTCHours(Number(hour));
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  return next.getTime() - now.getTime();
}

function startScheduler({ config, community, send, growthCampaign = null }) {
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

  const sendDailyArticle = async () => {
    const walletCta = config.appUrl ? `\n\n<b>AETHER Wallet — Official Web3 Gateway</b>\n${config.appUrl}\nUse official links only. Never share your seed phrase or private key.` : "";\n    const articleText = `${articleForDate(new Date())}${walletCta}`;
    for (const chatId of config.targetChats) {
      try {
        await send(chatId, articleText);
      } catch (err) {
        console.error("Scheduled article failed:", chatId, err.message);
      }
    }
  };

  const scheduleArticle = () => {
    const daily = setInterval(sendDailyArticle, 24 * 60 * 60 * 1000);
    timers.push(daily);
  };

  const initial = setTimeout(async () => {
    await sendDailyArticle();
    scheduleArticle();
  }, articleDelay);
  timers.push(initial);

  if (growthCampaign?.enabled()) {
    const pulseMs = Math.max(4, Number(config.growthPulseHours || 4)) * 60 * 60 * 1000;
    const runGrowthPulse = async () => {
      try {
        const result = await growthCampaign.pulse();
        console.log(
          `ATH growth pulse: status=${result.status}; joined=${result.joined ?? 0}; target=${result.min ?? config.growthDailyTargetMin}-${result.max ?? config.growthDailyTargetMax}.`
        );
      } catch (err) {
        console.error("ATH growth pulse failed:", err.message);
      }
    };

    const growthInitial = setTimeout(runGrowthPulse, 60 * 1000);
    const growthInterval = setInterval(runGrowthPulse, pulseMs);
    timers.push(growthInitial, growthInterval);
  }

  console.log(
    `Community scheduler active for ${config.targetChats.length} chat(s); soft promo every ${Math.max(6, Number(config.softPromoHours))}h; article at UTC hour ${config.articleHourUtc}; growth=${growthCampaign?.enabled() ? "ready" : "off"}.`
  );

  return () => {
    for (const timer of timers) {
      clearInterval(timer);
      clearTimeout(timer);
    }
  };
}

module.exports = { startScheduler, msUntilNextUtcHour };
