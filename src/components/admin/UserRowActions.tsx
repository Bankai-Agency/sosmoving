"use client";

import { useActionState } from "react";
import { Trash2, KeyRound } from "lucide-react";
import {
  deleteUserAction,
  resetPasswordAction,
} from "@/app/(admin)/admin/users/actions";
import { Button } from "./ui/button";

type Props = {
  id: string;
  isSelf: boolean;
  isOwner: boolean;
};

export function UserRowActions({ id, isSelf, isOwner }: Props) {
  const [resetState, resetAction, resetPending] = useActionState(resetPasswordAction, {});
  const deleteDisabled = isSelf || isOwner;

  return (
    <div className="flex items-center justify-end gap-2">
      <form action={resetAction}>
        <input type="hidden" name="id" value={id} />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={resetPending}
          title="Сгенерировать временный пароль"
        >
          <KeyRound className="h-3.5 w-3.5" />
          {resetPending ? "…" : "Сбросить"}
        </Button>
      </form>

      {resetState.ok && (
        <span className="max-w-[220px] rounded-md bg-warning/15 px-2 py-1 font-mono text-xs text-foreground">
          {resetState.ok}
        </span>
      )}
      {resetState.error && (
        <span className="rounded-md bg-destructive/15 px-2 py-1 text-xs text-destructive">
          {resetState.error}
        </span>
      )}

      <form
        action={deleteUserAction}
        onSubmit={(e) => {
          if (!confirm("Удалить пользователя? Это действие необратимо.")) e.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={id} />
        <Button
          type="submit"
          variant="destructive"
          size="sm"
          disabled={deleteDisabled}
          title={isSelf ? "Нельзя удалить самого себя" : isOwner ? "Нельзя удалить владельца" : ""}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Удалить
        </Button>
      </form>
    </div>
  );
}
