import { AdminShell } from "@/components/admin/AdminShell";
import { TopBar } from "@/components/admin/TopBar";

export const metadata = { title: "Пользователи" };

// Phase 1: mock — will come from Postgres in Phase 2 (seed user + invites).
const mockUsers = [
  { username: "capitalism", createdAt: "18 апр 2026", lastLogin: "—", status: "owner" as const },
];

const mockInvites = [
  // { email: "writer1@example.com", invitedAt: "...", expiresAt: "..." }
];

export default function UsersPage() {
  return (
    <AdminShell>
      <TopBar
        title="Пользователи"
        actions={
          <button
            type="button"
            className="h-10 rounded-md bg-dark px-4 text-[15px] font-semibold text-white transition-colors hover:bg-dark/90"
          >
            + Пригласить
          </button>
        }
      />
      <div className="flex-1 p-6">
        <div className="mb-4 grid grid-cols-3 gap-4">
          <Stat label="Активных" value={mockUsers.length} />
          <Stat label="Приглашений в ожидании" value={mockInvites.length} />
          <Stat label="Лимит" value="5" />
        </div>

        {/* Users table */}
        <div className="mb-6 overflow-hidden rounded-xl bg-surface">
          <div className="border-b border-dark/6 p-5">
            <h3 className="h6 text-dark">Редакторы</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark/6 bg-dark/6">
                <th className="caption px-4 py-3 text-left font-semibold text-dark/56">Логин</th>
                <th className="caption px-4 py-3 text-left font-semibold text-dark/56">Роль</th>
                <th className="caption px-4 py-3 text-left font-semibold text-dark/56">Создан</th>
                <th className="caption px-4 py-3 text-left font-semibold text-dark/56">Последний вход</th>
                <th className="caption px-4 py-3 text-right font-semibold text-dark/56">Действия</th>
              </tr>
            </thead>
            <tbody>
              {mockUsers.map((u) => (
                <tr key={u.username} className="border-b border-dark/6 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand font-semibold text-dark">
                        {u.username[0].toUpperCase()}
                      </div>
                      <span className="p2 font-semibold text-dark">{u.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="caption rounded-full bg-dark/6 px-2.5 py-1 font-semibold text-dark">
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 caption text-dark/56">{u.createdAt}</td>
                  <td className="px-4 py-3 caption text-dark/56">{u.lastLogin}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="caption text-dark/56 hover:text-dark"
                      disabled
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pending invites */}
        <div className="rounded-xl border border-dashed border-dark/12 bg-surface p-5">
          <h3 className="h6 mb-2 text-dark">Ожидающие приглашения</h3>
          <p className="caption text-dark/56">
            {mockInvites.length === 0
              ? "Приглашений нет. Нажми «Пригласить» — сгенерируется одноразовая ссылка на 7 дней."
              : `${mockInvites.length} активных приглашений`}
          </p>
        </div>
      </div>
    </AdminShell>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl bg-surface p-4">
      <div className="caption text-dark/56">{label}</div>
      <div className="mt-1 h4 text-dark">{value}</div>
    </div>
  );
}
