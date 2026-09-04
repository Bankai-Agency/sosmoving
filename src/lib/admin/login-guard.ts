import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

/**
 * Brute-force guard for the login form, backed by the `login_attempts` table.
 *
 * Counters live in Postgres rather than in memory: every Vercel function
 * instance has its own memory, so an attacker spread across cold starts
 * would never trip an in-process counter. The table is created lazily
 * (CREATE TABLE IF NOT EXISTS) so the protection is live right after a
 * deploy with no manual migration; scripts/db-setup.mjs creates the same
 * table for fresh databases.
 *
 * Two keys per attempt: `u:<username>` (5 failures in 15 min lock the name
 * for 15 min - stops a targeted guess) and `ip:<address>` (30 failures in
 * 15 min lock the host - stops one machine spraying usernames). A lock is
 * reported before the password is even compared. Any guard failure (DB
 * hiccup) fails open: the password check still runs, this one request is
 * just not counted.
 */

const WINDOW_MINUTES = 15;
const LOCK_MINUTES = 15;
const USER_MAX_FAILURES = 5;
const IP_MAX_FAILURES = 30;

const WINDOW = sql.raw(`interval '${WINDOW_MINUTES} minutes'`);
const LOCK = sql.raw(`interval '${LOCK_MINUTES} minutes'`);

export type LoginKeys = { user: string; ip: string | null };

export function loginKeys(username: string, req: Request | undefined): LoginKeys {
  const ip = clientIp(req);
  return { user: `u:${username}`, ip: ip ? `ip:${ip}` : null };
}

function clientIp(req: Request | undefined): string | null {
  if (!req) return null;
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || req.headers.get("x-real-ip")?.trim() || "";
  return ip && ip.length <= 64 ? ip : null;
}

let ensured: Promise<void> | null = null;

function ensureTable(): Promise<void> {
  if (!ensured) {
    ensured = db
      .execute(
        sql`CREATE TABLE IF NOT EXISTS login_attempts (
          key text PRIMARY KEY,
          failures integer DEFAULT 0 NOT NULL,
          window_started_at timestamp with time zone DEFAULT now() NOT NULL,
          locked_until timestamp with time zone
        )`,
      )
      .then(() => undefined)
      .catch((err: unknown) => {
        ensured = null;
        throw err;
      });
  }
  return ensured;
}

/** Whole minutes left on the longest active lock across the keys; 0 when none. */
export async function lockedMinutes(keys: LoginKeys): Promise<number> {
  await ensureTable();
  const list = keys.ip ? [keys.user, keys.ip] : [keys.user];
  const res = await db.execute(sql`
    SELECT ceil(extract(epoch from (max(locked_until) - now())) / 60)::int AS minutes
    FROM login_attempts
    WHERE key IN (${sql.join(list.map((k) => sql`${k}`), sql`, `)})
      AND locked_until > now()
  `);
  const row = res.rows[0] as { minutes?: number | string | null } | undefined;
  const minutes = Number(row?.minutes ?? 0);
  return Number.isFinite(minutes) && minutes > 0 ? minutes : 0;
}

/** A wrong username or password: bump both counters, lock when a limit is hit. */
export async function recordFailure(keys: LoginKeys): Promise<void> {
  await ensureTable();
  const bumps = [bump(keys.user, USER_MAX_FAILURES)];
  if (keys.ip) bumps.push(bump(keys.ip, IP_MAX_FAILURES));
  await Promise.all([
    ...bumps,
    // Rows from old windows are dead weight - sweep them on the rare failure.
    db.execute(sql`
      DELETE FROM login_attempts
      WHERE window_started_at < now() - interval '1 day'
        AND (locked_until IS NULL OR locked_until < now())
    `),
  ]);
}

/** A successful login: the username's failures no longer matter. */
export async function clearFailures(keys: LoginKeys): Promise<void> {
  await ensureTable();
  await db.execute(sql`DELETE FROM login_attempts WHERE key = ${keys.user}`);
}

/**
 * One atomic upsert: a stale window (older than WINDOW) restarts at 1,
 * otherwise the counter grows; reaching `max` sets the lock. Being a single
 * statement, concurrent failures cannot lose increments.
 */
async function bump(key: string, max: number): Promise<void> {
  await db.execute(sql`
    INSERT INTO login_attempts (key, failures, window_started_at, locked_until)
    VALUES (${key}, 1, now(), NULL)
    ON CONFLICT (key) DO UPDATE SET
      failures = CASE
        WHEN login_attempts.window_started_at < now() - ${WINDOW} THEN 1
        ELSE login_attempts.failures + 1
      END,
      window_started_at = CASE
        WHEN login_attempts.window_started_at < now() - ${WINDOW} THEN now()
        ELSE login_attempts.window_started_at
      END,
      locked_until = CASE
        WHEN (CASE
          WHEN login_attempts.window_started_at < now() - ${WINDOW} THEN 1
          ELSE login_attempts.failures + 1
        END) >= ${max} THEN now() + ${LOCK}
        ELSE login_attempts.locked_until
      END
  `);
}

export const LOGIN_GUARD = { WINDOW_MINUTES, LOCK_MINUTES, USER_MAX_FAILURES, IP_MAX_FAILURES };
