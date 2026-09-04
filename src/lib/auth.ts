import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users } from "./db/schema";
import { clearFailures, lockedMinutes, loginKeys, recordFailure } from "./admin/login-guard";

/**
 * Auth.js v5 config — credentials-only, JWT session.
 *
 * No OAuth, no email — the user explicitly asked for username+password.
 * Session is stored in a signed JWT cookie (stateless, no DB session table
 * needed), so we avoid the Drizzle adapter dance.
 *
 * `authorized` callback runs inside the proxy.ts (Next 16 "proxy" convention,
 * previously "middleware") — a single place for all route-level access
 * checks. Keep the logic tight; this runs on every /admin/* request.
 */

/**
 * Thrown from `authorize` while a username or the caller's address is
 * locked. Extends CredentialsSignin so Auth.js treats it as a client-safe
 * sign-in failure (server-side signIn rethrows it as-is to the login action).
 */
export class LoginLocked extends CredentialsSignin {
  code = "locked";
  minutes: number;
  constructor(minutes: number) {
    super(`Login locked for ${minutes} min`);
    this.minutes = minutes;
  }
}

/**
 * A JWT session outlives the database row it was minted from: a deleted
 * editor kept working until the cookie expired (30 days), and an admin
 * password reset did not reach the open session. So the `jwt` callback
 * re-reads the user this often and drops the session when the row is gone.
 * The proxy re-signs the cookie on every request, so the stamp sticks.
 */
const SESSION_RECHECK_MS = 60 * 1000;

// bcrypt.compare against a fixed hash when the username is unknown, so the
// response time does not tell an attacker which usernames exist.
const DUMMY_HASH = "$2b$12$VRZw8A/48JLwuHv/fT56e.3eEp5vW/JwoyMvdkJlHm0Al4GUleZRu";

export const { auth, handlers, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/admin/login",
  },
  providers: [
    Credentials({
      credentials: {
        username: { label: "Логин", type: "text" },
        password: { label: "Пароль", type: "password" },
      },
      async authorize(raw, request) {
        const username = typeof raw?.username === "string" ? raw.username.trim().toLowerCase() : "";
        const password = typeof raw?.password === "string" ? raw.password : "";
        if (!username || !password) return null;

        const keys = loginKeys(username, request);
        let locked = 0;
        try {
          locked = await lockedMinutes(keys);
        } catch (err) {
          console.error("[auth] login guard unavailable, continuing unguarded:", err);
        }
        if (locked > 0) throw new LoginLocked(locked);

        const row = await db.query.users.findFirst({
          where: eq(users.username, username),
        });
        const ok = await bcrypt.compare(password, row?.passwordHash ?? DUMMY_HASH);
        if (!row || !ok) {
          try {
            await recordFailure(keys);
          } catch (err) {
            console.error("[auth] login guard could not record a failure:", err);
          }
          return null;
        }

        await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, row.id));
        try {
          await clearFailures(keys);
        } catch (err) {
          console.error("[auth] login guard could not clear failures:", err);
        }

        return {
          id: row.id,
          name: row.name ?? row.username,
          email: row.email ?? undefined,
          // Extra fields are stashed in the JWT via the `jwt` callback below.
          // Typed loosely to avoid dragging module-augmentation boilerplate in Phase 2.
          username: row.username,
          role: row.role,
          mustChangePassword: row.mustChangePassword,
        } as unknown as { id: string; name: string };
      },
    }),
  ],
  callbacks: {
    /**
     * Gate every /admin/* request — runs from proxy.ts.
     * Returning `true` lets the request through; returning `false` triggers
     * a redirect to `pages.signIn`. Returning a `Response` shortcuts the
     * default behavior (used here to bounce logged-in users away from /login).
     */
    authorized({ auth: session, request }) {
      const { pathname } = request.nextUrl;
      const onAdminArea = pathname.startsWith("/admin");
      const onPreview = pathname.startsWith("/preview");
      const onLogin = pathname === "/admin/login";
      const onRegister = pathname.startsWith("/admin/register");
      const onChangePassword = pathname.startsWith("/admin/change-password");
      const onLogout = pathname === "/admin/logout";
      const isLoggedIn = Boolean(session?.user);
      const mustChange = Boolean(
        (session?.user as { mustChangePassword?: boolean } | undefined)?.mustChangePassword,
      );

      // Preview routes: editors only. Anon → bounce to login with a next-hop.
      if (onPreview) {
        if (!isLoggedIn) return false;
        // mustChangePassword users are allowed into preview — rotating their
        // password isn't the right friction for "look at your draft". If that
        // feels wrong later, flip to redirecting to /admin/change-password here.
        return true;
      }

      if (!onAdminArea) return true; // matcher limits us to /admin/* anyway

      if (isLoggedIn && (onLogin || onRegister)) {
        return Response.redirect(new URL("/admin/dashboard", request.nextUrl));
      }
      if (!isLoggedIn && !(onLogin || onRegister)) {
        return false;
      }

      if (isLoggedIn && mustChange && !onChangePassword && !onLogout) {
        return Response.redirect(new URL("/admin/change-password", request.nextUrl));
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        // `user` only present on initial sign-in — persist role and username into the JWT.
        const u = user as unknown as { id: string; username: string; role: string; mustChangePassword: boolean };
        token.id = u.id;
        token.username = u.username;
        token.role = u.role;
        token.mustChangePassword = u.mustChangePassword;
        token.checkedAt = Date.now();
        return token;
      }

      const checkedAt = typeof token.checkedAt === "number" ? token.checkedAt : 0;
      if (Date.now() - checkedAt < SESSION_RECHECK_MS) return token;

      // A token without an id predates the id claim - nothing to verify it
      // against, so it is not a session any more.
      if (typeof token.id !== "string") return null;

      try {
        const row = await db.query.users.findFirst({
          where: eq(users.id, token.id),
          columns: { id: true, username: true, role: true, mustChangePassword: true },
        });
        // Returning null drops the cookie: the user was deleted.
        if (!row) return null;
        token.username = row.username;
        token.role = row.role;
        token.mustChangePassword = row.mustChangePassword;
        token.checkedAt = Date.now();
      } catch (err) {
        // DB hiccup: keep the session as it is and retry on the next request.
        console.error("[auth] session re-check failed:", err);
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        const s = session.user as typeof session.user & {
          id?: string;
          username?: string;
          role?: string;
          mustChangePassword?: boolean;
        };
        s.id = token.id as string;
        s.username = token.username as string;
        s.role = token.role as string;
        s.mustChangePassword = token.mustChangePassword as boolean;
      }
      return session;
    },
  },
});
