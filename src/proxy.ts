/**
 * Admin protection proxy (renamed from middleware.ts — Next 16 deprecated
 * the "middleware" file convention in favor of "proxy"). Uses the Auth.js v5
 * `auth` helper, which has the same (NextRequest) → NextResponse signature
 * and runs the `authorized` callback defined in src/lib/auth.ts.
 *
 * Matcher covers both /admin/* (the panel itself) and /preview/* (the
 * blog-style preview surface) — only authenticated editors should be able
 * to see a draft post laid out as if it were live.
 */
export { auth as proxy } from "@/lib/auth";

export const config = {
  matcher: ["/admin/:path*", "/preview/:path*"],
};
