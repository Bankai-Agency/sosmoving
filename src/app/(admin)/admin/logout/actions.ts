"use server";

import { signOut } from "@/lib/auth";

/**
 * Sign out through a server action (POST with Next's origin check) rather
 * than the old GET route: a GET logout fired from <Link> prefetching and
 * could be triggered cross-site by any <img src="/admin/logout">.
 */
export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/admin/login" });
}
