const FORBIDDEN_PATTERNS = [
  /(t\.me\/|telegram\.me\/).+(joinchat|add)/i,
  /(bit\.ly|tinyurl|cutt\.ly|rb\.gy)/i,
  /(airdrop|claim|free).+(http|t\.me)/i,
  /(seed phrase|private key|mnemonic)/i,
  /(giveaway|whitelisting).+(send|dm|pm)/i,
];

class FloodGuard {
  constructor({ limit = 5, windowSeconds = 10 } = {}) {
    this.limit = limit;
    this.windowMs = windowSeconds * 1000;
    this.events = new Map();
  }

  isFlooding(userId, now = Date.now()) {
    const key = String(userId);
    const previous = this.events.get(key) || [];
    const recent = previous.filter((ts) => now - ts < this.windowMs);
    recent.push(now);
    this.events.set(key, recent);
    return recent.length > this.limit;
  }
}

function containsForbidden(text = "") {
  return FORBIDDEN_PATTERNS.some((pattern) => pattern.test(String(text)));
}

function detectTopic(text = "") {
  const value = String(text).toLowerCase();
  const topics = {
    airdrop: ["airdrop", "air drop", "free token", "claim airdrop", "testnet"],
    mining: ["mining", "mine", "gpu mining", "asic", "hashrate", "pool mining"],
    staking: ["staking", "stake", "yield", "apy", "validator"],
    trading: ["trading", "chart", "entry", "leverage", "futures", "spot"],
    aether: ["aether", "aether wallet", "aetherwallet", "ath"],
  };

  for (const [topic, keywords] of Object.entries(topics)) {
    if (keywords.some((kw) => value.includes(kw))) return topic;
  }
  return null;
}

module.exports = {
  FORBIDDEN_PATTERNS,
  FloodGuard,
  containsForbidden,
  detectTopic,
};
