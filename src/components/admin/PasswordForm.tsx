"use client";

import { useActionState } from "react";
import { changePassword } from "@/app/(admin)/admin/settings/actions";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field name="current" label="Текущий пароль" autoComplete="current-password" disabled={pending} />
      <Field name="next" label="Новый пароль" autoComplete="new-password" disabled={pending} />
      <Field name="repeat" label="Повторить новый" autoComplete="new-password" disabled={pending} />

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
          {pending ? "Сохраняем…" : "Сменить пароль"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  autoComplete,
  disabled,
}: {
  name: string;
  label: string;
  autoComplete: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type="password" autoComplete={autoComplete} required disabled={disabled} />
    </div>
  );
}
