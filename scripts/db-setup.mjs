#!/usr/bin/env node
/**
 * scripts/db-setup.mjs
 *
 * Creates the admin DB schema (users + invites + login_attempts) idempotently.
 *
 * Run with:
 *   node --env-file=.env.local scripts/db-setup.mjs
 *
 * We do this directly instead of `drizzle-kit push` because push requires
 * an interactive TTY to confirm destructive changes — fine locally, breaks
 * in CI. Plain CREATE TABLE IF NOT EXISTS is safe and idempotent: re-running
 * it when tables already exist is a no-op.
 *
 * If the schema evolves in the future, migrate with `drizzle-kit generate`
 * to produce a versioned SQL file and extend this script (or a successor)
 * to apply it.
 */
import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set. Did you run with --env-file=.env.local ?");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function main() {
  console.log("→ ensuring uuid-ossp / pgcrypto for gen_random_uuid()…");
  // gen_random_uuid() comes from pgcrypto (or is built-in on PG 13+). Neon has it.
  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;

  console.log("→ creating users…");
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      username text NOT NULL,
      password_hash text NOT NULL,
      email text,
      name text,
      role text DEFAULT 'editor' NOT NULL,
      must_change_password boolean DEFAULT false NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      last_login_at timestamp with time zone,
      CONSTRAINT users_username_unique UNIQUE (username)
    )
  `;

  console.log("→ creating invites…");
  await sql`
    CREATE TABLE IF NOT EXISTS invites (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      token text NOT NULL,
      label text,
      created_by_id uuid NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      expires_at timestamp with time zone NOT NULL,
      used_at timestamp with time zone,
      used_by_user_id uuid,
      CONSTRAINT invites_token_unique UNIQUE (token)
    )
  `;

  console.log("→ creating login_attempts…");
  await sql`
    CREATE TABLE IF NOT EXISTS login_attempts (
      key text PRIMARY KEY,
      failures integer DEFAULT 0 NOT NULL,
      window_started_at timestamp with time zone DEFAULT now() NOT NULL,
      locked_until timestamp with time zone
    )
  `;

  // Quick sanity — list what's there now.
  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;
  console.log("\n✅ DB schema ready. Tables in public schema:");
  console.table(tables);
}

main().catch((err) => {
  console.error("❌ DB setup failed:", err);
  process.exit(1);
});
