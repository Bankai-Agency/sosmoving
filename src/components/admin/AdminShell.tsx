import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

/**
 * Shared shell for all authenticated admin pages. The /admin/login route
 * does NOT use this shell — it has its own full-viewport layout.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-app">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
