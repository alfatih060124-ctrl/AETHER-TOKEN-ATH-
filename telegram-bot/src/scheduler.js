const { articleForDate } = require("./content/articles");

function msUntilNextUtcHour(hour) {
  const now = new Date();
  const next = new Date(now);
  next.setUTCMinutes(0, 0, 0);
  next.setUTCHours(Number(hour));
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  return next.getTime() - now.getTime();
}

function startScheduler({ config, community, send }) {
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
    const articleText = articleForDate(new Date());
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

  console.log(
    `Community scheduler active for ${config.targetChats.length} chat(s); soft promo every ${Math.max(6, Number(config.softPromoHours))}h; article at UTC hour ${config.articleHourUtc}.`
  );

  return () => {
    for (const timer of timers) {
      clearInterval(timer);
      clearTimeout(timer);
    }
  };
}

module.exports = { startScheduler, msUntilNextUtcHour };
