import { Logo } from "@/components/admin/Logo";
import { ChangePasswordForm } from "@/components/admin/ChangePasswordForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/admin/ui/card";
import { auth } from "@/lib/auth";

export const metadata = { title: "Смена пароля" };

export default async function ChangePasswordPage() {
  const session = await auth();
  const forced = Boolean((session?.user as { mustChangePassword?: boolean } | undefined)?.mustChangePassword);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/40 px-6 py-12">
      <Card className="w-full max-w-[440px]">
        <CardHeader>
          <div className="mb-6">
            <Logo />
          </div>
          <CardTitle className="text-2xl">Смена пароля</CardTitle>
          <CardDescription>
            {forced
              ? "Это первый вход — придумай новый пароль. Текущий (seed) пароль временный и его нужно заменить."
              : "Обнови пароль на новый — текущий тебе понадобится для подтверждения."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
