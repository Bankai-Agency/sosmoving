"use client";

import { useActionState } from "react";
import { saveProfile } from "@/app/(admin)/admin/settings/actions";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";

type Props = {
  username: string;
  initialName: string;
  initialEmail: string;
};

export function ProfileForm({ username, initialName, initialEmail }: Props) {
  const [state, formAction, pending] = useActionState(saveProfile, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="prof-login">Логин</Label>
        <Input id="prof-login" defaultValue={username} readOnly />
        <span className="text-xs text-muted-foreground">Нельзя сменить.</span>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="prof-name">Имя</Label>
        <Input id="prof-name" name="name" defaultValue={initialName} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="prof-email">Email</Label>
        <Input id="prof-email" name="email" type="email" defaultValue={initialEmail} />
        <span className="text-xs text-muted-foreground">Для будущего password recovery (опционально).</span>
      </div>

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state.ok && (
        <Alert variant="positive">
          <AlertDescription>{state.ok}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Сохраняем…" : "Сохранить"}
        </Button>
      </div>
    </form>
  );
}
