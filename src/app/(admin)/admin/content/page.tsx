import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { TopBar } from "@/components/admin/TopBar";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { getAllPosts } from "@/lib/admin/stats";

export const metadata = { title: "Контент" };

export default function ContentPage() {
  const posts = getAllPosts();
  const published = posts.filter((p) => p.status === "published").length;
  const drafts = posts.filter((p) => p.status === "draft").length;
  const scheduled = posts.filter((p) => p.status === "scheduled").length;

  return (
    <AdminShell>
      <TopBar
        title="Контент"
        actions={
          <button
            type="button"
            className="h-10 rounded-md bg-dark px-4 text-[15px] font-semibold text-white transition-colors hover:bg-dark/90"
          >
            + Новая статья
          </button>
        }
      />
      <div className="flex-1 p-6">
        {/* Stat strip */}
        <div className="mb-4 grid grid-cols-3 gap-4">
          <Stat label="Опубликовано" value={published} />
          <Stat label="Черновики" value={drafts} />
          <Stat label="Запланировано" value={scheduled} />
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl bg-surface">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark/6 bg-dark/6">
                <th className="caption px-4 py-3 text-left font-semibold text-dark/56">Статья</th>
                <th className="caption px-4 py-3 text-left font-semibold text-dark/56">Статус</th>
                <th className="caption px-4 py-3 text-left font-semibold text-dark/56">Категория</th>
                <th className="caption px-4 py-3 text-left font-semibold text-dark/56">Опубликовано</th>
                <th className="caption px-4 py-3 text-left font-semibold text-dark/56">Обновлено</th>
              </tr>
            </thead>
            <tbody>
              {posts.slice(0, 50).map((p) => (
                <tr key={p.slug} className="border-b border-dark/6 last:border-0 hover:bg-dark/6">
                  <td className="max-w-[400px] px-4 py-3">
                    <Link href={`/admin/content/${p.slug}`} className="p2 truncate font-semibold text-dark hover:text-link">
                      {p.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3 caption max-w-[220px] truncate text-dark/56">{p.category}</td>
                  <td className="px-4 py-3 caption whitespace-nowrap text-dark/56">{p.publishDate || "—"}</td>
                  <td className="px-4 py-3 caption whitespace-nowrap text-dark/56">{p.lastUpdated || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {posts.length > 50 && (
            <div className="border-t border-dark/6 p-3 text-center">
              <span className="caption text-dark/56">
                Показано 50 из {posts.length}. Пагинация и поиск — в следующем шаге.
              </span>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-surface p-4">
      <div className="caption text-dark/56">{label}</div>
      <div className="mt-1 h4 text-dark">{value}</div>
    </div>
  );
}
