"use client";

import { useActionState, useState } from "react";
import { Copy, CheckCircle2 } from "lucide-react";
import { createInvite } from "@/app/(admin)/admin/users/actions";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";

export function InviteForm() {
  const [state, formAction, pending] = useActionState(createInvite, {});
  const [copied, setCopied] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="invite-label">Комментарий (необязательно)</Label>
        <Input id="invite-label" name="label" type="text" maxLength={80} placeholder="Напр. Иван — новый автор" />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Генерируем…" : "Создать ссылку"}
      </Button>

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {state.url && (
        <Alert variant="positive">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription className="flex flex-col gap-2">
            <span>Отправь эту ссылку (активна 7 дней):</span>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={state.url}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="font-mono text-xs"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(state.url!);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  } catch {
                    /* ignore */
                  }
                }}
                title={copied ? "Скопировано" : "Копировать"}
              >
                {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </form>
  );
}
