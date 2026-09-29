const DEFAULT_FEEDS = [
  {
    name: "Cointelegraph",
    url: "https://cointelegraph.com/?format=rss",
  },
];

const PRIORITY =
  /(mining|miner|hashrate|proof[- ]of[- ]work|wallet|self[- ]custody|custody|hardware wallet|seed phrase|private key|phishing|hack|security|web3|bitcoin|lightning)/i;

function decodeXml(value = "") {
  return String(value)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function tag(block, name) {
  const m = String(block).match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, "i"));
  return m ? decodeXml(m[1]) : "";
}

function parseRss(xml, source) {
  const items = String(xml).match(/<item\b[\s\S]*?<\/item>/gi) || [];
  return items
    .map((item) => ({
      source,
      title: tag(item, "title"),
      link: tag(item, "link"),
      description: tag(item, "description"),
      pubDate: tag(item, "pubDate"),
    }))
    .filter((item) => item.title && /^https?:\/\//i.test(item.link));
}

function score(item) {
  const text = `${item.title} ${item.description}`;
  let value = PRIORITY.test(text) ? 100 : 0;
  if (/wallet|self[- ]custody|custody|hardware wallet|seed phrase|private key/i.test(text)) value += 25;
  if (/mining|miner|hashrate|proof[- ]of[- ]work/i.test(text)) value += 25;
  if (/security|phishing|hack/i.test(text)) value += 15;
  const published = Date.parse(item.pubDate || "");
  if (Number.isFinite(published)) {
    const ageHours = Math.max(0, (Date.now() - published) / 3600000);
    value += Math.max(0, 24 - Math.min(ageHours, 24));
  }
  return value;
}

function escapeHtml(text = "") {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

class CryptoNewsService {
  constructor({ feeds = DEFAULT_FEEDS } = {}) {
    this.feeds = feeds;
    this.seen = new Set();
  }

  async fetchFeed(feed) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(feed.url, {
        headers: {
          "user-agent": "AETHER-ATH-CommunityBot/1.0 (+https://wallet.aether.boats/)",
          accept: "application/rss+xml, application/xml, text/xml, */*",
        },
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`${feed.name} HTTP ${response.status}`);
      return parseRss(await response.text(), feed.name);
    } finally {
      clearTimeout(timeout);
    }
  }

  async latest() {
    const batches = await Promise.allSettled(this.feeds.map((feed) => this.fetchFeed(feed)));
    const items = batches.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
    if (!items.length) return null;

    const ranked = items
      .filter((item) => !this.seen.has(item.link))
      .sort((a, b) => score(b) - score(a));

    const chosen = ranked[0] || items.sort((a, b) => score(b) - score(a))[0];
    if (!chosen) return null;

    this.seen.add(chosen.link);
    if (this.seen.size > 200) {
      this.seen = new Set(Array.from(this.seen).slice(-100));
    }
    return chosen;
  }

  format(item, walletUrl) {
    if (!item) return "";
    const published = item.pubDate
      ? `\nPublished: ${escapeHtml(item.pubDate)}`
      : "";
    const wallet = walletUrl || "https://wallet.aether.boats/";
    return [
      "<b>Hourly Crypto Update</b>",
      "",
      `<b>${escapeHtml(item.title)}</b>`,
      `Source: ${escapeHtml(item.source)}${published}`,
      `Read: ${escapeHtml(item.link)}`,
      "",
      "<b>Why AETHER tracks this:</b> Mining, wallet security, custody and Web3 infrastructure can change quickly. Verify sources and never share a seed phrase or private key.",
      "",
      "<b>AETHER Wallet — Official Web3 Gateway</b>",
      escapeHtml(wallet),
    ].join("\n");
  }
}

module.exports = { CryptoNewsService, parseRss, decodeXml, score };
