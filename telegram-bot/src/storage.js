const { Pool } = require("pg");

function walletConflictError(currentWallet) {
  const err = new Error("WALLET_ALREADY_LINKED");
  err.code = "WALLET_ALREADY_LINKED";
  err.currentWallet = currentWallet;
  return err;
}

function joinKey(userId, chatId) {
  return String(userId) + ":" + String(chatId);
}

function warningKey(chatId, userId) {
  return String(chatId) + ":" + String(userId);
}

class MemoryStorage {
  constructor() {
    this.users = new Map();
    this.joinRequests = new Map();
    this.warningCounts = new Map();
    this.moderationLogs = [];
    this.groups = new Map();
    this.memberships = new Map();
  }

  async init() {}

  async upsertUser(user) {
    const id = String(user.telegramId);
    const existing = this.users.get(id) || {
      telegramId: id,
      referrerId: null,
      referralCount: 0,
      walletAddress: null,
      countryCode: "",
      cryptoScore: 0,
      isVerified: false,
      status: "active",
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

  async getReferrerForUser(userId) {
    const user = await this.getUser(userId);
    if (!user?.referrerId) return null;
    return this.getUser(user.referrerId);
  }

  async setWallet(userId, walletAddress) {
    const user = this.users.get(String(userId));
    if (!user) return null;

    if (
      user.walletAddress &&
      user.walletAddress.toLowerCase() !== walletAddress.toLowerCase()
    ) {
      throw walletConflictError(user.walletAddress);
    }

    user.walletAddress = walletAddress;
    return user;
  }

  async setOptOut(userId, optedOut) {
    const user = this.users.get(String(userId));
    if (!user) return null;
    user.optedOut = Boolean(optedOut);
    return user;
  }

  async recordGroup(group) {
    const chatId = String(group.chatId);
    const existing = this.groups.get(chatId) || {
      chatId,
      createdAt: new Date().toISOString(),
    };
    const next = {
      ...existing,
      title: group.title || existing.title || null,
      type: group.type || existing.type || "group",
      isActive: group.isActive !== false,
      updatedAt: new Date().toISOString(),
    };
    this.groups.set(chatId, next);
    return next;
  }

  async recordMembership({ userId, chatId, role = "member", joinMethod = "unknown", joinScore = 0 }) {
    const key = joinKey(userId, chatId);
    const existing = this.memberships.get(key) || {
      userId: String(userId),
      chatId: String(chatId),
      joinedAt: new Date().toISOString(),
    };
    const next = {
      ...existing,
      role,
      joinMethod,
      joinScore: Number(joinScore || 0),
      updatedAt: new Date().toISOString(),
    };
    this.memberships.set(key, next);
    return next;
  }

  async saveJoinRequest(state) {
    const key = joinKey(state.userId, state.chatId);
    const existing = this.joinRequests.get(key);
    const now = new Date().toISOString();
    const next = {
      userId: String(state.userId),
      chatId: String(state.chatId),
      interests: [...(state.interests || existing?.interests || [])],
      experience: state.experience || existing?.experience || "beginner",
      hasWallet: Boolean(state.hasWallet ?? existing?.hasWallet ?? false),
      countryCode: state.countryCode || existing?.countryCode || "",
      stage: state.stage || existing?.stage || "start",
      status: state.status || existing?.status || "pending",
      score: state.score ?? existing?.score ?? null,
      createdAt: existing?.createdAt || state.createdAt || now,
      updatedAt: now,
    };
    this.joinRequests.set(key, next);
    return next;
  }

  async getJoinRequest(userId, chatId) {
    return this.joinRequests.get(joinKey(userId, chatId)) || null;
  }

  async updateJoinRequest(userId, chatId, patch) {
    const current = await this.getJoinRequest(userId, chatId);
    if (!current) return null;
    return this.saveJoinRequest({ ...current, ...patch, userId, chatId });
  }

  async completeJoinRequest(userId, chatId, { status, score = null } = {}) {
    const completed = await this.updateJoinRequest(userId, chatId, {
      status: status || "completed",
      score,
      stage: "completed",
    });
    const user = this.users.get(String(userId));
    if (user && completed) {
      user.countryCode = completed.countryCode || user.countryCode || "";
      user.cryptoScore = Number(score || 0);
      user.isVerified = status === "approved";
    }
    return completed;
  }

  async addWarning(chatId, userId) {
    const key = warningKey(chatId, userId);
    const count = Number(this.warningCounts.get(key) || 0) + 1;
    this.warningCounts.set(key, count);
    return count;
  }

  async getWarnings(chatId, userId) {
    return Number(this.warningCounts.get(warningKey(chatId, userId)) || 0);
  }

  async logModeration(entry) {
    const row = {
      chatId: String(entry.chatId),
      targetUserId: entry.targetUserId ? String(entry.targetUserId) : null,
      actorUserId: entry.actorUserId ? String(entry.actorUserId) : null,
      action: String(entry.action || "unknown"),
      reason: entry.reason || null,
      metadata: entry.metadata || {},
      createdAt: new Date().toISOString(),
    };
    this.moderationLogs.push(row);
    if (this.moderationLogs.length > 1000) this.moderationLogs.shift();
    return row;
  }

  async recentModerationLogs(chatId, limit = 10) {
    const max = Math.max(1, Math.min(Number(limit) || 10, 50));
    return this.moderationLogs
      .filter((row) => String(row.chatId) === String(chatId))
      .slice(-max)
      .reverse();
  }

  async stats() {
    const users = [...this.users.values()];
    return {
      users: users.length,
      linkedWallets: users.filter((u) => u.walletAddress).length,
      referrals: users.filter((u) => u.referrerId).length,
      optedIn: users.filter((u) => !u.optedOut).length,
      joinRequests: this.joinRequests.size,
      moderationLogs: this.moderationLogs.length,
      groups: this.groups.size,
      memberships: this.memberships.size,
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
        country_code TEXT,
        crypto_score INTEGER NOT NULL DEFAULT 0,
        is_verified BOOLEAN NOT NULL DEFAULT FALSE,
        status TEXT NOT NULL DEFAULT 'active',
        opted_out BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      ALTER TABLE ath_bot_users ADD COLUMN IF NOT EXISTS country_code TEXT;
      ALTER TABLE ath_bot_users ADD COLUMN IF NOT EXISTS crypto_score INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE ath_bot_users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE ath_bot_users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
      CREATE INDEX IF NOT EXISTS idx_ath_bot_users_referrer
        ON ath_bot_users(referrer_id);

      CREATE TABLE IF NOT EXISTS ath_bot_groups (
        chat_id BIGINT PRIMARY KEY,
        title TEXT,
        type TEXT NOT NULL DEFAULT 'group',
        settings JSONB NOT NULL DEFAULT '{}'::jsonb,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ath_bot_memberships (
        telegram_id BIGINT NOT NULL REFERENCES ath_bot_users(telegram_id) ON DELETE CASCADE,
        chat_id BIGINT NOT NULL REFERENCES ath_bot_groups(chat_id) ON DELETE CASCADE,
        role TEXT NOT NULL DEFAULT 'member',
        join_method TEXT NOT NULL DEFAULT 'unknown',
        join_score INTEGER NOT NULL DEFAULT 0,
        joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (telegram_id, chat_id)
      );

      CREATE TABLE IF NOT EXISTS ath_bot_join_requests (
        telegram_id BIGINT NOT NULL,
        chat_id BIGINT NOT NULL,
        interests JSONB NOT NULL DEFAULT '[]'::jsonb,
        experience TEXT NOT NULL DEFAULT 'beginner',
        has_wallet BOOLEAN NOT NULL DEFAULT FALSE,
        country_code TEXT,
        stage TEXT NOT NULL DEFAULT 'start',
        status TEXT NOT NULL DEFAULT 'pending',
        score INTEGER,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (telegram_id, chat_id)
      );
      ALTER TABLE ath_bot_join_requests
        ADD COLUMN IF NOT EXISTS country_code TEXT;
      CREATE INDEX IF NOT EXISTS idx_ath_bot_join_requests_status
        ON ath_bot_join_requests(status, updated_at DESC);

      CREATE TABLE IF NOT EXISTS ath_bot_warnings (
        chat_id BIGINT NOT NULL,
        telegram_id BIGINT NOT NULL,
        warning_count INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (chat_id, telegram_id)
      );

      CREATE TABLE IF NOT EXISTS ath_bot_moderation_logs (
        id BIGSERIAL PRIMARY KEY,
        chat_id BIGINT NOT NULL,
        target_user_id BIGINT,
        actor_user_id BIGINT,
        action TEXT NOT NULL,
        reason TEXT,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_ath_bot_moderation_logs_chat_created
        ON ath_bot_moderation_logs(chat_id, created_at DESC);
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

  async getReferrerForUser(userId) {
    const { rows } = await this.pool.query(
      `SELECT r.*,
        (SELECT COUNT(*)::int FROM ath_bot_users x WHERE x.referrer_id=r.telegram_id) AS referral_count
       FROM ath_bot_users u
       JOIN ath_bot_users r ON r.telegram_id=u.referrer_id
       WHERE u.telegram_id=$1`,
      [String(userId)]
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async setWallet(userId, walletAddress) {
    const existing = await this.getUser(userId);
    if (!existing) return null;

    if (
      existing.walletAddress &&
      existing.walletAddress.toLowerCase() !== walletAddress.toLowerCase()
    ) {
      throw walletConflictError(existing.walletAddress);
    }

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

  async recordGroup(group) {
    const { rows } = await this.pool.query(
      `INSERT INTO ath_bot_groups (chat_id, title, type, is_active, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (chat_id) DO UPDATE SET
         title = EXCLUDED.title,
         type = EXCLUDED.type,
         is_active = EXCLUDED.is_active,
         updated_at = NOW()
       RETURNING *`,
      [
        String(group.chatId),
        group.title || null,
        group.type || "group",
        group.isActive !== false,
      ]
    );
    return rows[0];
  }

  async recordMembership({ userId, chatId, role = "member", joinMethod = "unknown", joinScore = 0 }) {
    const { rows } = await this.pool.query(
      `INSERT INTO ath_bot_memberships
        (telegram_id, chat_id, role, join_method, join_score, joined_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT (telegram_id, chat_id) DO UPDATE SET
         role = EXCLUDED.role,
         join_method = EXCLUDED.join_method,
         join_score = EXCLUDED.join_score,
         updated_at = NOW()
       RETURNING *`,
      [String(userId), String(chatId), role, joinMethod, Number(joinScore || 0)]
    );
    return rows[0];
  }

  async saveJoinRequest(state) {
    const { rows } = await this.pool.query(
      `INSERT INTO ath_bot_join_requests
        (telegram_id, chat_id, interests, experience, has_wallet, country_code, stage, status, score, created_at, updated_at)
       VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       ON CONFLICT (telegram_id, chat_id) DO UPDATE SET
         interests = EXCLUDED.interests,
         experience = EXCLUDED.experience,
         has_wallet = EXCLUDED.has_wallet,
         country_code = EXCLUDED.country_code,
         stage = EXCLUDED.stage,
         status = EXCLUDED.status,
         score = EXCLUDED.score,
         updated_at = NOW()
       RETURNING *`,
      [
        String(state.userId),
        String(state.chatId),
        JSON.stringify(state.interests || []),
        state.experience || "beginner",
        Boolean(state.hasWallet),
        state.countryCode || "",
        state.stage || "start",
        state.status || "pending",
        state.score == null ? null : Number(state.score),
      ]
    );
    return mapJoinRow(rows[0]);
  }

  async getJoinRequest(userId, chatId) {
    const { rows } = await this.pool.query(
      "SELECT * FROM ath_bot_join_requests WHERE telegram_id=$1 AND chat_id=$2",
      [String(userId), String(chatId)]
    );
    return rows[0] ? mapJoinRow(rows[0]) : null;
  }

  async updateJoinRequest(userId, chatId, patch) {
    const current = await this.getJoinRequest(userId, chatId);
    if (!current) return null;
    return this.saveJoinRequest({ ...current, ...patch, userId, chatId });
  }

  async completeJoinRequest(userId, chatId, { status, score = null } = {}) {
    const completed = await this.updateJoinRequest(userId, chatId, {
      status: status || "completed",
      score,
      stage: "completed",
    });
    if (completed) {
      await this.pool.query(
        `UPDATE ath_bot_users
         SET country_code=$2, crypto_score=$3, is_verified=$4
         WHERE telegram_id=$1`,
        [
          String(userId),
          completed.countryCode || null,
          Number(score || 0),
          status === "approved",
        ]
      );
    }
    return completed;
  }

  async addWarning(chatId, userId) {
    const { rows } = await this.pool.query(
      `INSERT INTO ath_bot_warnings (chat_id, telegram_id, warning_count, updated_at)
       VALUES ($1, $2, 1, NOW())
       ON CONFLICT (chat_id, telegram_id) DO UPDATE SET
         warning_count = ath_bot_warnings.warning_count + 1,
         updated_at = NOW()
       RETURNING warning_count`,
      [String(chatId), String(userId)]
    );
    return Number(rows[0].warning_count);
  }

  async getWarnings(chatId, userId) {
    const { rows } = await this.pool.query(
      "SELECT warning_count FROM ath_bot_warnings WHERE chat_id=$1 AND telegram_id=$2",
      [String(chatId), String(userId)]
    );
    return rows[0] ? Number(rows[0].warning_count) : 0;
  }

  async logModeration(entry) {
    const { rows } = await this.pool.query(
      `INSERT INTO ath_bot_moderation_logs
        (chat_id, target_user_id, actor_user_id, action, reason, metadata)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)
       RETURNING *`,
      [
        String(entry.chatId),
        entry.targetUserId ? String(entry.targetUserId) : null,
        entry.actorUserId ? String(entry.actorUserId) : null,
        String(entry.action || "unknown"),
        entry.reason || null,
        JSON.stringify(entry.metadata || {}),
      ]
    );
    return mapModerationRow(rows[0]);
  }

  async recentModerationLogs(chatId, limit = 10) {
    const max = Math.max(1, Math.min(Number(limit) || 10, 50));
    const { rows } = await this.pool.query(
      `SELECT * FROM ath_bot_moderation_logs
       WHERE chat_id=$1
       ORDER BY created_at DESC
       LIMIT $2`,
      [String(chatId), max]
    );
    return rows.map(mapModerationRow);
  }

  async stats() {
    const [
      { rows: userRows },
      { rows: joinRows },
      { rows: modRows },
      { rows: groupRows },
      { rows: membershipRows },
    ] = await Promise.all([
      this.pool.query(`
        SELECT
          COUNT(*)::int AS users,
          COUNT(*) FILTER (WHERE wallet_address IS NOT NULL)::int AS linked_wallets,
          COUNT(*) FILTER (WHERE referrer_id IS NOT NULL)::int AS referrals,
          COUNT(*) FILTER (WHERE opted_out=FALSE)::int AS opted_in
        FROM ath_bot_users
      `),
      this.pool.query("SELECT COUNT(*)::int AS join_requests FROM ath_bot_join_requests"),
      this.pool.query("SELECT COUNT(*)::int AS moderation_logs FROM ath_bot_moderation_logs"),
      this.pool.query("SELECT COUNT(*)::int AS groups FROM ath_bot_groups WHERE is_active=TRUE"),
      this.pool.query("SELECT COUNT(*)::int AS memberships FROM ath_bot_memberships"),
    ]);
    const r = userRows[0];
    return {
      users: r.users,
      linkedWallets: r.linked_wallets,
      referrals: r.referrals,
      optedIn: r.opted_in,
      joinRequests: joinRows[0].join_requests,
      moderationLogs: modRows[0].moderation_logs,
      groups: groupRows[0].groups,
      memberships: membershipRows[0].memberships,
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
    countryCode: row.country_code || "",
    cryptoScore: Number(row.crypto_score || 0),
    isVerified: Boolean(row.is_verified),
    status: row.status || "active",
    optedOut: Boolean(row.opted_out),
    referralCount: Number(row.referral_count || 0),
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at,
  };
}

function mapJoinRow(row) {
  return {
    userId: String(row.telegram_id),
    chatId: String(row.chat_id),
    interests: Array.isArray(row.interests) ? row.interests : [],
    experience: row.experience || "beginner",
    hasWallet: Boolean(row.has_wallet),
    countryCode: row.country_code || "",
    stage: row.stage || "start",
    status: row.status || "pending",
    score: row.score == null ? null : Number(row.score),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapModerationRow(row) {
  return {
    id: row.id == null ? null : String(row.id),
    chatId: String(row.chat_id),
    targetUserId: row.target_user_id ? String(row.target_user_id) : null,
    actorUserId: row.actor_user_id ? String(row.actor_user_id) : null,
    action: row.action,
    reason: row.reason || null,
    metadata: row.metadata || {},
    createdAt: row.created_at,
  };
}

function createStorage(databaseUrl) {
  return databaseUrl ? new PostgresStorage(databaseUrl) : new MemoryStorage();
}

module.exports = {
  createStorage,
  MemoryStorage,
  PostgresStorage,
  walletConflictError,
};
