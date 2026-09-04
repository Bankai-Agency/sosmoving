"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth, signIn, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { MIN_PASSWORD } from "@/lib/admin/users";

type State = { error?: string; ok?: boolean };

/**
 * Server action behind the "change password" form.
 *
 * - Verifies the current password (prevents CSRF-style trivial pwn — even
 *   if someone hijacks the session, they still need the old password to rotate).
 * - Sets the new hash, clears `mustChangePassword`.
 * - Re-issues the session by calling signIn() — the new JWT picks up
 *   `mustChangePassword=false` so the proxy stops redirecting to this page.
 */
export async function changePassword(
  _prev: State,
  formData: FormData,
): Promise<State> {
  const session = await auth();
  if (!session?.user) return { error: "Нет сессии" };

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const repeat = String(formData.get("repeat") ?? "");

  if (!current || !next || !repeat) return { error: "Заполните все поля" };
  if (next !== repeat) return { error: "Пароли не совпадают" };
  if (next.length < MIN_PASSWORD) return { error: `Минимум ${MIN_PASSWORD}\u00a0символов` };
  if (next === current) return { error: "Новый пароль должен отличаться от текущего" };

  const userId = (session.user as { id?: string }).id;
  if (!userId) return { error: "Сессия без id — перелогинься" };

  let username: string;
  try {
    const row = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!row) return { error: "Пользователь не найден" };

    const ok = await bcrypt.compare(current, row.passwordHash);
    if (!ok) return { error: "Текущий пароль неверный" };

    const nextHash = await bcrypt.hash(next, 12);
    await db
      .update(users)
      .set({ passwordHash: nextHash, mustChangePassword: false })
      .where(eq(users.id, userId));
    username = row.username;
  } catch (err) {
    console.error("[changePassword]", err);
    return { error: "Не удалось сменить пароль - попробуйте ещё раз" };
  }

  // Rotate the session - re-issues JWT with mustChangePassword=false.
  try {
    await signIn("credentials", { username, password: next, redirect: false });
  } catch {
    // On rare failure, just force re-login (signOut throws the redirect itself).
    await signOut({ redirectTo: "/admin/login" });
  }

  redirect("/admin/dashboard");
}
