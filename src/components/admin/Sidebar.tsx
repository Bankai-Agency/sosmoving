import {
  LayoutDashboard,
  FileText,
  LayoutList,
  Users,
  Settings,
  LogOut,
} from "lucide-react";
import { Logo } from "./Logo";
import { NavLink } from "./NavLink";
import { ThemeToggle } from "./ThemeToggle";
import { Separator } from "./ui/separator";

export function Sidebar() {
  return (
    <aside className="flex h-dvh w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="px-4 py-5">
        <Logo />
      </div>

      <Separator className="bg-sidebar-border" />

      <nav className="flex flex-col gap-1 p-3">
        <NavLink href="/admin/dashboard" icon={<LayoutDashboard className="h-4 w-4" />}>Dashboard</NavLink>
        <NavLink href="/admin/content" icon={<FileText className="h-4 w-4" />}>Контент</NavLink>
        <NavLink href="/admin/pages" icon={<LayoutList className="h-4 w-4" />}>Страницы сайта</NavLink>
        <NavLink href="/admin/users" icon={<Users className="h-4 w-4" />}>Пользователи</NavLink>
        <NavLink href="/admin/settings" icon={<Settings className="h-4 w-4" />}>Настройки</NavLink>
      </nav>

      <div className="mt-auto flex flex-col gap-1 p-3">
        <Separator className="mb-2 bg-sidebar-border" />
        <ThemeToggle />
        <NavLink href="/admin/logout" icon={<LogOut className="h-4 w-4" />}>Выйти</NavLink>
      </div>
    </aside>
  );
}
