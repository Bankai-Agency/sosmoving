import { Logo } from "./Logo";
import { NavLink } from "./NavLink";

/**
 * Icons — inline SVG so we don't pull in an icon library yet.
 * 20×20 viewBox, 1.5 stroke, currentColor. Easy to swap for lucide-react later.
 */
const Icon = {
  Dashboard: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect x="2.5" y="2.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11.5" y="2.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2.5" y="11.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11.5" y="11.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  Content: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M4 3h8l4 4v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 3v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M6.5 10.5h7M6.5 13.5h7M6.5 7.5h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  Pages: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect x="2.5" y="2.5" width="15" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.5 6.5h15M6 2.5v15" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  Users: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="7" r="3.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 17c.75-3 3.25-4.5 6.5-4.5s5.75 1.5 6.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  Settings: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 1.75v2M10 16.25v2M3.94 3.94l1.41 1.41M14.65 14.65l1.41 1.41M1.75 10h2M16.25 10h2M3.94 16.06l1.41-1.41M14.65 5.35l1.41-1.41"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  Logout: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M8.5 3.5H5a1.5 1.5 0 0 0-1.5 1.5v10A1.5 1.5 0 0 0 5 16.5h3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12.5 6.5 16 10l-3.5 3.5M16 10H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

export function Sidebar() {
  return (
    <aside className="flex h-dvh w-60 shrink-0 flex-col gap-6 bg-dark p-4 text-white">
      {/* Logo */}
      <div className="px-2 pt-2">
        <Logo />
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1">
        <NavLink href="/admin/dashboard" icon={Icon.Dashboard}>Dashboard</NavLink>
        <NavLink href="/admin/content" icon={Icon.Content}>Контент</NavLink>
        <NavLink href="/admin/pages" icon={Icon.Pages}>Страницы сайта</NavLink>
        <NavLink href="/admin/users" icon={Icon.Users}>Пользователи</NavLink>
        <NavLink href="/admin/settings" icon={Icon.Settings}>Настройки</NavLink>
      </nav>

      <div className="mt-auto flex flex-col gap-1">
        {/* Logout is a real form-post later; placeholder link now */}
        <NavLink href="/admin/logout" icon={Icon.Logout}>Выйти</NavLink>
      </div>
    </aside>
  );
}
