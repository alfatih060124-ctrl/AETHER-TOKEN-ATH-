const { articleForDate } = require("./content/articles");
const { CryptoNewsService } = require("./services/newsUpdate");
const { featureForHour, featureText } = require("./content/aetherFeatures");

function msUntilNextUtcHour(hour) {
  const now = new Date();
  const next = new Date(now);
  next.setUTCMinutes(0, 0, 0);
  next.setUTCHours(Number(hour));
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  return next.getTime() - now.getTime();
}

function startScheduler({ config, community, send, growthCampaign = null, publishUpdate = null }) {
  const timers = [];
  const news = new CryptoNewsService();
  const publish = async (text) => {
    if (publishUpdate) return publishUpdate(text);
    for (const chatId of config.targetChats) {
      await send(chatId, text);
    }
    return { mode: "group-fallback" };
  };

  if (!config.communityFeaturesEnabled || !config.targetChats.length) {
    return () => {};
  }

  const updateHours = Math.max(1, Number(config.softPromoHours || 1));
  const updateEveryMs = updateHours * 60 * 60 * 1000;

  const sendHourlyUpdate = async (label = "scheduled") => {
    let item = null;
    try {
      item = await news.latest();
    } catch (err) {
      console.error("Crypto news fetch failed:", err.message);
    }

    try {
      const feature = featureForHour(new Date());
      const featureSpotlight = featureText(feature, config.appUrl);
      const text = item
        ? `${news.format(item, config.appUrl)}\n\n────────────\n\n<b>AETHER Feature Spotlight</b>\n${featureSpotlight}`
        : `<b>AETHER Hourly Update</b>\n\nFresh external crypto news is temporarily unavailable, so here is an AETHER feature spotlight instead.\n\n${featureSpotlight}`;
      const result = await publish(text);
      console.log(
        `ATH hourly update: label=${label}; source=${item?.source || "internal"}; feature=${feature.id}; route=${result.mode}.`
      );
    } catch (err) {
      console.error("Hourly community update failed:", err.message);
    }
  };

  const startupUpdate = setTimeout(() => {
    sendHourlyUpdate("startup").catch((err) => {
      console.error("Startup hourly update failed:", err.message);
    });
  }, 10 * 1000);

  const hourlyTimer = setInterval(() => {
    sendHourlyUpdate("interval").catch((err) => {
      console.error("Hourly community update failed:", err.message);
    });
  }, updateEveryMs);

  timers.push(startupUpdate, hourlyTimer);

  const articleDelay = msUntilNextUtcHour(config.articleHourUtc);

  const sendDailyArticle = async () => {
    const walletCta = config.appUrl ? `\n\n<b>AETHER Wallet — Official Web3 Gateway</b>\n${config.appUrl}\nUse official links only. Never share your seed phrase or private key.` : "";
    const articleText = `${articleForDate(new Date())}${walletCta}`;
    try {
      const result = await publish(articleText);
      console.log(`ATH daily article sent: route=${result.mode}.`);
    } catch (err) {
      console.error("Scheduled article failed:", err.message);
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
    `Community scheduler active for ${config.targetChats.length} chat(s); first crypto/AETHER update in 10s; hourly update every ${updateHours}h; daily article at UTC hour ${config.articleHourUtc}; growth=${growthCampaign?.enabled() ? "ready" : "off"}.`
  );

  return () => {
    for (const timer of timers) {
      clearInterval(timer);
      clearTimeout(timer);
    }
  };
}

module.exports = { startScheduler, msUntilNextUtcHour };
