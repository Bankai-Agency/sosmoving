import type { ReactNode } from "react";

type Props = {
  title: string;
  actions?: ReactNode;
};

export function TopBar({ title, actions }: Props) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-background/80 px-6 backdrop-blur">
      <h1 className="text-base font-semibold tracking-tight">{title}</h1>
      <div className="flex items-center gap-3">{actions}</div>
    </header>
  );
}
