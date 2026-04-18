import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users } from "./db/schema";

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
      async authorize(raw) {
        const username = typeof raw?.username === "string" ? raw.username.trim().toLowerCase() : "";
        const password = typeof raw?.password === "string" ? raw.password : "";
        if (!username || !password) return null;

        const row = await db.query.users.findFirst({
          where: eq(users.username, username),
        });
        if (!row) return null;

        const ok = await bcrypt.compare(password, row.passwordHash);
        if (!ok) return null;

        // Fire-and-forget login timestamp.
        await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, row.id));

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
