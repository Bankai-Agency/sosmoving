import type { ReactNode } from "react";

type Props = {
  title: string;
  /** Optional trailing content (buttons, filters, etc.) */
  actions?: ReactNode;
};

export function TopBar({ title, actions }: Props) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-dark/6 bg-surface px-6">
      <h1 className="h6">{title}</h1>
      <div className="flex items-center gap-3">{actions}</div>
    </header>
  );
}
