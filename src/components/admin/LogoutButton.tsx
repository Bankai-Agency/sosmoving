"use client";

import { useActionState } from "react";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/(admin)/admin/logout/actions";

/** Sidebar "Выйти": a form, so nothing prefetches or hot-links a logout. */
export function LogoutButton() {
  const [, action, pending] = useActionState(async () => {
    await logoutAction();
  }, undefined);
  return (
    <form action={action}>
      <button
        type="submit"
        disabled={pending}
        className="group flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground disabled:opacity-60"
      >
        <span className="shrink-0">
          <LogOut className="h-4 w-4" />
        </span>
        <span className="truncate">Выйти</span>
      </button>
    </form>
  );
}
