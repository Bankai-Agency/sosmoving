"use client";

import { useActionState } from "react";
import { revokeInviteAction } from "@/app/(admin)/admin/users/actions";
import { Button } from "./ui/button";

export function RevokeInviteButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(revokeInviteAction, {});
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Отозвать приглашение? Ссылка перестанет работать.")) e.preventDefault();
      }}
      className="flex items-center gap-2"
    >
      <input type="hidden" name="id" value={id} />
      {state.error && <span className="text-xs text-destructive">{state.error}</span>}
      <Button type="submit" variant="ghost" size="sm" disabled={pending} className="text-muted-foreground hover:text-destructive">
        {pending ? "…" : "Отозвать"}
      </Button>
    </form>
  );
}
