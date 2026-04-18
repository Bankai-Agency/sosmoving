"use client";

import { useActionState } from "react";
import { changePassword } from "@/app/(admin)/admin/change-password/actions";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, {});

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Field name="current" label="Текущий пароль" autoComplete="current-password" disabled={pending} />
      <Field name="next" label="Новый пароль" autoComplete="new-password" disabled={pending} />
      <Field name="repeat" label="Повторить новый" autoComplete="new-password" disabled={pending} />

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={pending} size="lg">
        {pending ? "Сохраняем…" : "Сменить пароль"}
      </Button>
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
