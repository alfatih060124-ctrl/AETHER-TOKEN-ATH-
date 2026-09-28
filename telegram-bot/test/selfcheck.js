const assert = require("assert");
const { MemoryStorage } = require("../src/storage");
const { buildAetherReferralUrl } = require("../src/services/athReferral");

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
