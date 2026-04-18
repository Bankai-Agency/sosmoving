import Link from "next/link";
import { Logo } from "@/components/admin/Logo";
import { RegisterForm } from "@/components/admin/RegisterForm";
import { Button } from "@/components/admin/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/admin/ui/card";
import { inspectInvite } from "@/lib/admin/users";

export const metadata = { title: "Регистрация" };
export const dynamic = "force-dynamic"; // token check hits the DB

type SearchParams = { token?: string };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { token = "" } = await searchParams;
  const invite = token ? await inspectInvite(token) : { valid: false, reason: "missing" as const };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/40 px-6 py-12">
      <Card className="w-full max-w-[440px]">
        <CardHeader>
          <div className="mb-6">
            <Logo />
          </div>
          {invite.valid ? (
            <>
              <CardTitle className="text-2xl">Приглашение в админку</CardTitle>
              <CardDescription>
                {invite.label ? `Для: ${invite.label}. ` : ""}
                Придумай логин и пароль — после создания тебя залогинит автоматически.
              </CardDescription>
            </>
          ) : (
            <>
              <CardTitle className="text-2xl">Приглашение не активно</CardTitle>
              <CardDescription>{reasonText(invite.reason)}</CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent>
          {invite.valid ? (
            <RegisterForm token={token} />
          ) : (
            <Button asChild variant="outline">
              <Link href="/admin/login">← Ко входу</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function reasonText(reason?: string): string {
  switch (reason) {
    case "not-found":
      return "Токен не найден. Возможно, ссылка была повреждена.";
    case "used":
      return "Это приглашение уже использовано. Если это ты регистрировался — просто залогинься. Если нет — попроси новую ссылку.";
    case "expired":
      return "Срок действия приглашения истёк (7 дней). Попроси новую ссылку у администратора.";
    case "missing":
    default:
      return "В ссылке нет токена. Открой полную ссылку из приглашения.";
  }
}
