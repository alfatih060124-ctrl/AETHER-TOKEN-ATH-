const assert = require("assert");
const { MemoryStorage } = require("../src/storage");

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

  await storage.setWallet("200", "0x1111111111111111111111111111111111111111");
  const beta = await storage.getUser("200");
  assert.strictEqual(beta.walletAddress, "0x1111111111111111111111111111111111111111");

  await storage.setOptOut("200", true);
  const ids = await storage.optedInChatIds();
  assert.deepStrictEqual(ids, ["100"]);

  const stats = await storage.stats();
  assert.deepStrictEqual(stats, {
    users: 2,
    linkedWallets: 1,
    referrals: 1,
    optedIn: 1,
  });

  console.log("ATH Telegram bot self-check PASSED");
  await storage.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
