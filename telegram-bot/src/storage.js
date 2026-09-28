const { Pool } = require("pg");

class MemoryStorage {
  constructor() {
    this.users = new Map();
  }

  async init() {}

  async upsertUser(user) {
    const id = String(user.telegramId);
    const existing = this.users.get(id) || {
      telegramId: id,
      referrerId: null,
      referralCount: 0,
      walletAddress: null,
      optedOut: false,
      createdAt: new Date().toISOString(),
    };
    const next = {
      ...existing,
      username: user.username || existing.username || null,
      firstName: user.firstName || existing.firstName || null,
      lastName: user.lastName || existing.lastName || null,
      lastSeenAt: new Date().toISOString(),
    };
    this.users.set(id, next);
    return next;
  }

  async recordReferral(userId, referrerId) {
    userId = String(userId);
    referrerId = String(referrerId);
    if (!userId || !referrerId || userId === referrerId) return false;

    const user = this.users.get(userId);
    const referrer = this.users.get(referrerId);
    if (!user || !referrer || user.referrerId) return false;

    user.referrerId = referrerId;
    referrer.referralCount = Number(referrer.referralCount || 0) + 1;
    return true;
  }

  async getUser(userId) {
    return this.users.get(String(userId)) || null;
  }

  async setWallet(userId, walletAddress) {
    const user = this.users.get(String(userId));
    if (!user) return null;
    user.walletAddress = walletAddress;
    return user;
  }

  async setOptOut(userId, optedOut) {
    const user = this.users.get(String(userId));
    if (!user) return null;
    user.optedOut = Boolean(optedOut);
    return user;
  }

  async stats() {
    const users = [...this.users.values()];
    return {
      users: users.length,
      linkedWallets: users.filter((u) => u.walletAddress).length,
      referrals: users.filter((u) => u.referrerId).length,
      optedIn: users.filter((u) => !u.optedOut).length,
    };
  }

  async optedInChatIds() {
    return [...this.users.values()]
      .filter((u) => !u.optedOut)
      .map((u) => u.telegramId);
  }

  async close() {}
}

class PostgresStorage {
  constructor(connectionString) {
    this.pool = new Pool({
      connectionString,
      ssl: process.env.PGSSL === "disable" ? false : undefined,
      max: 5,
    });
  }

  async init() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS ath_bot_users (
        telegram_id BIGINT PRIMARY KEY,
        username TEXT,
        first_name TEXT,
        last_name TEXT,
        referrer_id BIGINT REFERENCES ath_bot_users(telegram_id),
        wallet_address TEXT,
        opted_out BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_ath_bot_users_referrer
        ON ath_bot_users(referrer_id);
    `);
  }

  async upsertUser(user) {
    const { rows } = await this.pool.query(
      `INSERT INTO ath_bot_users
        (telegram_id, username, first_name, last_name, last_seen_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (telegram_id) DO UPDATE SET
         username = EXCLUDED.username,
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         last_seen_at = NOW()
       RETURNING *`,
      [user.telegramId, user.username || null, user.firstName || null, user.lastName || null]
    );
    return mapRow(rows[0]);
  }

  async recordReferral(userId, referrerId) {
    userId = String(userId);
    referrerId = String(referrerId);
    if (!userId || !referrerId || userId === referrerId) return false;

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const ref = await client.query(
        "SELECT telegram_id FROM ath_bot_users WHERE telegram_id=$1 FOR UPDATE",
        [referrerId]
      );
      if (!ref.rowCount) {
        await client.query("ROLLBACK");
        return false;
      }

      const updated = await client.query(
        `UPDATE ath_bot_users
         SET referrer_id=$2
         WHERE telegram_id=$1 AND referrer_id IS NULL
         RETURNING telegram_id`,
        [userId, referrerId]
      );
      await client.query("COMMIT");
      return updated.rowCount === 1;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async getUser(userId) {
    const { rows } = await this.pool.query(
      `SELECT u.*,
        (SELECT COUNT(*)::int FROM ath_bot_users r WHERE r.referrer_id=u.telegram_id) AS referral_count
       FROM ath_bot_users u WHERE u.telegram_id=$1`,
      [String(userId)]
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async setWallet(userId, walletAddress) {
    const { rows } = await this.pool.query(
      "UPDATE ath_bot_users SET wallet_address=$2 WHERE telegram_id=$1 RETURNING *",
      [String(userId), walletAddress]
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async setOptOut(userId, optedOut) {
    const { rows } = await this.pool.query(
      "UPDATE ath_bot_users SET opted_out=$2 WHERE telegram_id=$1 RETURNING *",
      [String(userId), Boolean(optedOut)]
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async stats() {
    const { rows } = await this.pool.query(`
      SELECT
        COUNT(*)::int AS users,
        COUNT(*) FILTER (WHERE wallet_address IS NOT NULL)::int AS linked_wallets,
        COUNT(*) FILTER (WHERE referrer_id IS NOT NULL)::int AS referrals,
        COUNT(*) FILTER (WHERE opted_out=FALSE)::int AS opted_in
      FROM ath_bot_users
    `);
    const r = rows[0];
    return {
      users: r.users,
      linkedWallets: r.linked_wallets,
      referrals: r.referrals,
      optedIn: r.opted_in,
    };
  }

  async optedInChatIds() {
    const { rows } = await this.pool.query(
      "SELECT telegram_id FROM ath_bot_users WHERE opted_out=FALSE ORDER BY created_at ASC"
    );
    return rows.map((r) => String(r.telegram_id));
  }

  async close() {
    await this.pool.end();
  }
}

function mapRow(row) {
  return {
    telegramId: String(row.telegram_id),
    username: row.username || null,
    firstName: row.first_name || null,
    lastName: row.last_name || null,
    referrerId: row.referrer_id ? String(row.referrer_id) : null,
    walletAddress: row.wallet_address || null,
    optedOut: Boolean(row.opted_out),
    referralCount: Number(row.referral_count || 0),
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at,
  };
}

function createStorage(databaseUrl) {
  return databaseUrl ? new PostgresStorage(databaseUrl) : new MemoryStorage();
}

module.exports = { createStorage, MemoryStorage, PostgresStorage };
