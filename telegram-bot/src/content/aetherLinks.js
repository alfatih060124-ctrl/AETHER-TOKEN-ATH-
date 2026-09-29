function esc(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildLinks(config = {}) {
  const botUrl = config.username ? `https://t.me/${config.username}` : "";
  return [
    ["AETHER Official Website", config.websiteUrl],
    ["AETHER Wallet", config.appUrl || "https://wallet.aether.boats/"],
    ["AETHER Coin / ATH Mining", config.coinUrl || "https://mining.aether.boats/"],
    ["AETHER Telegram Bot", botUrl],
    ["AETHER Official Channel", config.channelUrl],
    ["AETHER Community Group", config.groupUrl || config.communityUrl],
  ].filter(([, url]) => /^https?:\/\//i.test(String(url || "")));
}

function linksText(config = {}) {
  const links = buildLinks(config);
  const lines = [
    "<b>AETHER — Official Links Hub</b>",
    "",
    "Use only verified AETHER links:",
    "",
  ];
  for (const [label, url] of links) {
    lines.push(`• <b>${esc(label)}</b>`);
    lines.push(esc(url));
    lines.push("");
  }
  lines.push(
    "<b>Security</b>",
    "AETHER admins and the Telegram bot will never ask for your seed phrase or private key."
  );
  return lines.join("\n");
}

function linksKeyboard(config = {}) {
  return {
    inline_keyboard: buildLinks(config).map(([label, url]) => [
      { text: label, url },
    ]),
  };
}

module.exports = { buildLinks, linksText, linksKeyboard };
