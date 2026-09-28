const assert = require("assert");
const { MemoryStorage } = require("../src/storage");
const { buildAetherReferralUrl } = require("../src/services/athReferral");
const { calculateCryptoScore, isEligible } = require("../src/services/scoring");
const { FloodGuard, containsForbidden, detectTopic } = require("../src/services/moderation");
const { PromotionService } = require("../src/services/promotion");
const { msUntilNextUtcHour } = require("../src/scheduler");

(async () => {
  const storage = new MemoryStorage();
  await storage.init();

  await storage.upsertUser({ telegramId: "100", username: "alpha" });
  await storage.upsertUser({ telegramId: "200", username: "beta" });

  assert.strictEqual(await storage.recordReferral("200", "100"), true);
  assert.strictEqual(await storage.recordReferral("200", "100"), false);
  assert.strictEqual(await storage.recordReferral("100", "100"), false);

  let alpha = await storage.getUser("100");
  assert.strictEqual(alpha.referralCount, 1);

  const sponsor = await storage.getReferrerForUser("200");
  assert.strictEqual(sponsor.telegramId, "100");

  await storage.setWallet("100", "0x2222222222222222222222222222222222222222");
  await storage.setWallet("200", "0x1111111111111111111111111111111111111111");

  const beta = await storage.getUser("200");
  assert.strictEqual(beta.walletAddress, "0x1111111111111111111111111111111111111111");

  let walletConflict = false;
  try {
    await storage.setWallet("200", "0x3333333333333333333333333333333333333333");
  } catch (err) {
    walletConflict = err.code === "WALLET_ALREADY_LINKED";
  }
  assert.strictEqual(walletConflict, true);

  const deepLink = buildAetherReferralUrl("https://wallet.example/mining", {
    referrerWallet: "0x2222222222222222222222222222222222222222",
    memberWallet: "0x1111111111111111111111111111111111111111",
  });
  const parsed = new URL(deepLink);
  assert.strictEqual(parsed.searchParams.get("source"), "telegram");
  assert.strictEqual(parsed.searchParams.get("campaign"), "ath-airdrop");
  assert.strictEqual(
    parsed.searchParams.get("ath_referrer").toLowerCase(),
    "0x2222222222222222222222222222222222222222"
  );
  assert.strictEqual(
    parsed.searchParams.get("ath_wallet").toLowerCase(),
    "0x1111111111111111111111111111111111111111"
  );

  assert.strictEqual(
    calculateCryptoScore({
      interests: ["airdrop", "trading", "mining"],
      experience: "intermediate",
      hasWallet: true,
    }),
    90
  );
  assert.strictEqual(isEligible(60, 60), true);
  assert.strictEqual(isEligible(59, 60), false);

  assert.strictEqual(containsForbidden("please send your seed phrase"), true);
  assert.strictEqual(containsForbidden("hello ATH community"), false);
  assert.strictEqual(detectTopic("bagaimana mining ATH?"), "mining");

  const flood = new FloodGuard({ limit: 2, windowSeconds: 10 });
  assert.strictEqual(flood.isFlooding("100", 1000), false);
  assert.strictEqual(flood.isFlooding("100", 2000), false);
  assert.strictEqual(flood.isFlooding("100", 3000), true);

  const promo = new PromotionService({ cooldownHours: 8 });
  assert.strictEqual(promo.canSend("-100", 1000), true);
  assert.strictEqual(promo.canSend("-100", 2000), false);
  assert.strictEqual(
    promo.canSend("-100", 1000 + 8 * 60 * 60 * 1000 + 1),
    true
  );

  const wait = msUntilNextUtcHour(9);
  assert.ok(wait > 0 && wait <= 24 * 60 * 60 * 1000);

  await storage.setOptOut("200", true);
  const ids = await storage.optedInChatIds();
  assert.deepStrictEqual(ids, ["100"]);

  const stats = await storage.stats();
  assert.deepStrictEqual(stats, {
    users: 2,
    linkedWallets: 2,
    referrals: 1,
    optedIn: 1,
  });

  console.log("ATH Telegram bot self-check PASSED");
  await storage.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
