"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type Props = {
  href: string;
  icon: ReactNode;
  children: ReactNode;
  /** If true, active state matches only exact pathname. Otherwise prefix. */
  exact?: boolean;
};

export function NavLink({ href, icon, children, exact }: Props) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={[
        "group flex items-center gap-3 rounded-md px-3 py-2 text-[15px] leading-5 transition-colors",
        active
          ? "bg-white/12 text-white"
          : "text-white/56 hover:bg-white/6 hover:text-white",
      ].join(" ")}
    >
      <span
        className={[
          "shrink-0 transition-colors",
          active ? "text-white" : "text-white/56 group-hover:text-white",
        ].join(" ")}
      >
        {icon}
      </span>
      <span className="truncate">{children}</span>
    </Link>
  );
}
