"use server";

import { AuthError } from "next-auth";
import { LoginLocked, signIn } from "@/lib/auth";

/**
 * Server action backing the login form. Called via `<form action={login}>`.
 *
 * signIn() with `redirect: true` (default) throws a `NEXT_REDIRECT` on
 * success — that's fine, Next re-throws it and navigates. On failure
 * Auth.js throws a CredentialsSignin (code "CredentialsSignin"); we
 * convert it to a URL search param so the page can render an error hint.
 * A LoginLocked (too many failures for this name or address) carries the
 * minutes left, so the message can say how long to wait.
 */
export async function login(_prevState: string | undefined, formData: FormData): Promise<string | undefined> {
  try {
    await signIn("credentials", {
      username: formData.get("username"),
      password: formData.get("password"),
      redirectTo: "/admin/dashboard",
    });
    return undefined;
  } catch (err) {
    if (err instanceof AuthError) {
      if (err instanceof LoginLocked || (err as { code?: string }).code === "locked") {
        const minutes = err instanceof LoginLocked ? err.minutes : 15;
        return `Слишком много попыток входа. Подождите ${minutes} мин и попробуйте снова`;
      }
      if (err.type === "CredentialsSignin") return "Неверный логин или пароль";
      return "Ошибка входа. Попробуй ещё раз";
    }
    // Re-throw Next redirects — they must reach the framework.
    throw err;
  }
}
