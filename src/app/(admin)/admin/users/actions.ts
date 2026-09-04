"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  issueInvite,
  revokeInvite,
  deleteUser as deleteUserDb,
  resetUserPassword,
} from "@/lib/admin/users";

type InviteState = { error?: string; url?: string };
type MessageState = { error?: string; ok?: string };

async function requireUser(): Promise<{ id: string; username: string; role: string }> {
  const session = await auth();
  const u = session?.user as { id?: string; username?: string; role?: string } | undefined;
  if (!u?.id) throw new Error("Сессия истекла - войдите заново");
  return { id: u.id, username: u.username ?? "unknown", role: u.role ?? "editor" };
}

/**
 * Compose the site's public origin for the invite link. We read from
 * request headers (x-forwarded-host / host) rather than hard-coding a
 * value, so dev (localhost:3000) and prod (the real domain) both yield
 * correct URLs.
 */
async function siteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function createInvite(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  try {
    const me = await requireUser();
    const label = String(formData.get("label") ?? "").trim() || null;
    const origin = await siteOrigin();
    const { url } = await issueInvite({ label, createdById: me.id, origin });
    revalidatePath("/admin/users");
    return { url };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "unknown error" };
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function revokeInviteAction(_prev: MessageState, formData: FormData): Promise<MessageState> {
  try {
    await requireUser();
    const id = String(formData.get("id") ?? "");
    if (!UUID_RE.test(id)) return { error: "Некорректный id" };
    await revokeInvite(id);
    revalidatePath("/admin/users");
    return { ok: "Отозвано" };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Не удалось отозвать приглашение" };
  }
}

export async function deleteUserAction(_prev: MessageState, formData: FormData): Promise<MessageState> {
  try {
    const me = await requireUser();
    const id = String(formData.get("id") ?? "");
    if (!UUID_RE.test(id)) return { error: "Некорректный id" };
    await deleteUserDb(id, me);
    revalidatePath("/admin/users");
    return { ok: "Удалён" };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Не удалось удалить пользователя" };
  }
}

export async function resetPasswordAction(
  _prev: MessageState,
  formData: FormData,
): Promise<MessageState> {
  try {
    const me = await requireUser();
    const id = String(formData.get("id") ?? "");
    if (!UUID_RE.test(id)) return { error: "Некорректный id" };
    // Generate a one-shot temporary password so the admin doesn't have to
    // think one up. The target user will be forced to rotate on next login
    // (resetUserPassword sets must_change_password=true).
    const temp = randomBytes(6).toString("base64url");
    await resetUserPassword(id, temp, me);
    revalidatePath("/admin/users");
    return { ok: `Временный пароль: ${temp}` };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "unknown error" };
  }
}
