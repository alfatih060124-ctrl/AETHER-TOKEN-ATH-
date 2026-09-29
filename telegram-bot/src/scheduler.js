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

  const promoHours = Math.max(4, Number(config.softPromoHours || 4));
  const promoEveryMs = promoHours * 60 * 60 * 1000;

  const sendCommunityPulse = async (label = "scheduled") => {
    for (const chatId of config.targetChats) {
      try {
        const sent = await community.sendScheduledPromotion(chatId);
        console.log(
          `ATH community pulse: label=${label}; chat=${chatId}; sent=${Boolean(sent)}.`
        );
      } catch (err) {
        console.error("Scheduled promo failed:", chatId, err.message);
      }
    }
  };

  const startupPromo = setTimeout(() => {
    sendCommunityPulse("startup").catch((err) => {
      console.error("Startup community pulse failed:", err.message);
    });
  }, 45 * 1000);

  const promoTimer = setInterval(() => {
    sendCommunityPulse("interval").catch((err) => {
      console.error("Community pulse failed:", err.message);
    });
  }, promoEveryMs);

  timers.push(startupPromo, promoTimer);

  const articleDelay = msUntilNextUtcHour(config.articleHourUtc);

  const sendDailyArticle = async () => {
    const walletCta = config.appUrl ? `\n\n<b>AETHER Wallet — Official Web3 Gateway</b>\n${config.appUrl}\nUse official links only. Never share your seed phrase or private key.` : "";
    const articleText = `${articleForDate(new Date())}${walletCta}`;
    for (const chatId of config.targetChats) {
      try {
        await send(chatId, articleText);
        console.log(`ATH daily article sent: chat=${chatId}.`);
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
    `Community scheduler active for ${config.targetChats.length} chat(s); startup pulse in 45s; soft promo every ${promoHours}h; article at UTC hour ${config.articleHourUtc}; growth=${growthCampaign?.enabled() ? "ready" : "off"}.`
  );

  return () => {
    for (const timer of timers) {
      clearInterval(timer);
      clearTimeout(timer);
    }
  };
}

module.exports = { startScheduler, msUntilNextUtcHour };
