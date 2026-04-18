import { NextResponse, type NextRequest } from "next/server";

/**
 * Admin protection proxy (renamed from middleware.ts — Next 16 deprecated
 * the "middleware" file convention in favor of "proxy").
 *
 * Current behavior (Phase 1 — shell only):
 *   - Any /admin/* request passes through.
 *   - Session checks will be added here in Phase 2 together with Auth.js.
 *
 * Planned (Phase 2) behavior:
 *   - Read the `next-auth.session-token` cookie.
 *   - If missing and path is not /admin/login or /admin/register → redirect to /admin/login.
 *   - If present and path is /admin/login → redirect to /admin/dashboard.
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Phase 1 stub — we let everything through so the shell can be reviewed.
  // Uncomment the block below in Phase 2 once Auth.js is wired.
  //
  // const isAuthed = Boolean(req.cookies.get("next-auth.session-token") || req.cookies.get("__Secure-next-auth.session-token"));
  // const isPublic = pathname === "/admin/login" || pathname.startsWith("/admin/register");
  // if (!isAuthed && !isPublic) {
  //   const url = req.nextUrl.clone();
  //   url.pathname = "/admin/login";
  //   url.searchParams.set("next", pathname);
  //   return NextResponse.redirect(url);
  // }
  // if (isAuthed && isPublic) {
  //   const url = req.nextUrl.clone();
  //   url.pathname = "/admin/dashboard";
  //   return NextResponse.redirect(url);
  // }

  void pathname;
  return NextResponse.next();
}

export const config = {
  // Only run for /admin/* — zero overhead on public pages.
  matcher: ["/admin/:path*"],
};
