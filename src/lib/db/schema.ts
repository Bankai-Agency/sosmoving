import { pgTable, text, timestamp, uuid, boolean, integer } from "drizzle-orm/pg-core";

/**
 * Admin users (editors + owner).
 *
 * - `username` — primary login identifier (the user asked for login+password,
 *   not email). Unique, lowercase at insert-time.
 * - `passwordHash` — bcrypt (cost 12), computed in `/api/users` / seed script.
 * - `role` — 'owner' has no ceiling on anything; 'editor' is the default.
 *   We have no role-based UI gates yet (user said "роли не нужны"), but
 *   reserving the column is free and lets us distinguish the seed user from
 *   invitees for audit.
 * - `mustChangePassword` — flipped on the seed user; cleared on first password change.
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  email: text("email"),
  name: text("name"),
  role: text("role").notNull().default("editor"),
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
});

/**
 * Invite tokens for onboarding additional editors.
 *
 * Flow: owner presses "+ Invite" → row inserted with a random 32-char token,
 * expiresAt = now + 7d. Share link `/admin/register?token=...`. Invitee picks
 * username + password → we consume the invite (set usedAt, usedByUserId) and
 * create the user row.
 *
 * `label` is optional free-text shown in the invites list (e.g. "writer Ivan").
 */
export const invites = pgTable("invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  token: text("token").notNull().unique(),
  label: text("label"),
  createdById: uuid("created_by_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  usedByUserId: uuid("used_by_user_id"),
});

/**
 * Login brute-force counters (see src/lib/admin/login-guard.ts).
 *
 * `key` is `u:<username>` or `ip:<address>`. `failures` counts wrong
 * attempts inside the window that started at `windowStartedAt`; hitting the
 * limit sets `lockedUntil`. The guard creates this table itself on first use
 * (CREATE TABLE IF NOT EXISTS), db-setup.mjs mirrors it for fresh databases.
 */
export const loginAttempts = pgTable("login_attempts", {
  key: text("key").primaryKey(),
  failures: integer("failures").notNull().default(0),
  windowStartedAt: timestamp("window_started_at", { withTimezone: true }).notNull().defaultNow(),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Invite = typeof invites.$inferSelect;
