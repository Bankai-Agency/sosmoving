"use client";

import { revokeInviteAction } from "@/app/(admin)/admin/users/actions";
import { Button } from "./ui/button";

export function RevokeInviteButton({ id }: { id: string }) {
  return (
    <form
      action={revokeInviteAction}
      onSubmit={(e) => {
        if (!confirm("Отозвать приглашение? Ссылка перестанет работать.")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
        Отозвать
      </Button>
    </form>
  );
}
