"use client";

import { useActionState } from "react";
import { registerFromInvite } from "@/app/(admin)/admin/register/actions";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";

export function RegisterForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(registerFromInvite, {});

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="token" value={token} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="username">Логин</Label>
        <Input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          minLength={3}
          pattern="[a-zA-Z0-9_.\-]+"
          disabled={pending}
          placeholder="ivan-writer"
        />
        <span className="text-xs text-muted-foreground">Латинские буквы, цифры, _ . -</span>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Пароль</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          disabled={pending}
        />
        <span className="text-xs text-muted-foreground">Минимум 6 символов</span>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="repeat">Повторить пароль</Label>
        <Input
          id="repeat"
          name="repeat"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          disabled={pending}
        />
      </div>

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={pending} size="lg">
        {pending ? "Создаём…" : "Создать аккаунт"}
      </Button>
    </form>
  );
}
