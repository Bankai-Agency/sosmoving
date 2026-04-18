import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { TopBar } from "@/components/admin/TopBar";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { getSiteStats, getRecentPosts, getScheduledPosts } from "@/lib/admin/stats";

export const metadata = { title: "Dashboard" };

export default function DashboardPage() {
  const stats = getSiteStats();
  const recent = getRecentPosts(6);
  const scheduled = getScheduledPosts();

  return (
    <AdminShell>
      <TopBar
        title="Dashboard"
        actions={<span className="caption text-dark/56">Последний билд: {stats.lastBuildHint}</span>}
      />
      <div className="flex-1 p-6">
        {/* Row 1 — hero metrics */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Metric label="Всего страниц в билде" value={stats.totalPages.toLocaleString("ru-RU")} hint="public/pages/*.html" />
          <Metric label="Статей в блоге" value={stats.totalBlogPosts.toString()} hint="src/data/blog/*.md" />
          <Metric label="Городов" value={stats.totalCities.toString()} hint="landing-страницы" />
          <Metric label="Услуг" value={stats.totalServices.toString()} hint="service-страницы" />
        </div>

        {/* Row 2 — mocked perf widgets */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <PerfCard label="LCP (avg)" value="2.1s" delta="−8%" positive hint="Vercel Speed Insights — макет" />
          <PerfCard label="INP (avg)" value="140ms" delta="+12ms" hint="нужно подключить API" />
          <PerfCard label="Page Views (7d)" value="12 384" delta="+23%" positive hint="Vercel Analytics — макет" />
        </div>

        {/* Row 3 — lists */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Scheduled */}
          <div className="rounded-xl bg-surface p-5 lg:col-span-1">
            <div className="mb-4 flex items-baseline justify-between">
              <h3 className="h6 text-dark">Запланировано</h3>
              <Link href="/admin/content" className="caption text-link hover:underline">Все →</Link>
            </div>
            {scheduled.length === 0 ? (
              <p className="p2 text-dark/56">Нет запланированных публикаций.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {scheduled.slice(0, 5).map((p) => (
                  <li key={p.slug} className="flex flex-col gap-1">
                    <span className="p2 font-semibold text-dark">{p.title}</span>
                    <span className="caption text-dark/56">{p.publishAt}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Recent posts */}
          <div className="rounded-xl bg-surface p-5 lg:col-span-2">
            <div className="mb-4 flex items-baseline justify-between">
              <h3 className="h6 text-dark">Недавние публикации</h3>
              <Link href="/admin/content" className="caption text-link hover:underline">Все →</Link>
            </div>
            <ul className="flex flex-col divide-y divide-dark/6">
              {recent.map((p) => (
                <li key={p.slug} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <div className="truncate p2 font-semibold text-dark">{p.title}</div>
                    <div className="caption mt-0.5 text-dark/56">{p.publishDate}</div>
                  </div>
                  <StatusBadge status={p.status} />
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Row 4 — pages by type */}
        <div className="mt-4 rounded-xl bg-surface p-5">
          <h3 className="h6 mb-4 text-dark">Разбивка страниц по типам</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
            {stats.pagesByType.map((b) => (
              <div key={b.type} className="rounded-md border border-dark/6 p-3">
                <div className="caption text-dark/56">{b.type}</div>
                <div className="mt-1 h5 text-dark">{b.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl bg-surface p-5">
      <div className="caption text-dark/56">{label}</div>
      <div className="mt-2 h3 text-dark">{value}</div>
      <div className="caption mt-2 text-dark/32">{hint}</div>
    </div>
  );
}

function PerfCard({
  label,
  value,
  delta,
  positive,
  hint,
}: {
  label: string;
  value: string;
  delta: string;
  positive?: boolean;
  hint: string;
}) {
  return (
    <div className="rounded-xl bg-surface p-5">
      <div className="flex items-baseline justify-between">
        <span className="caption text-dark/56">{label}</span>
        <span
          className={`caption font-semibold ${
            positive ? "text-positive" : "text-negative"
          }`}
        >
          {delta}
        </span>
      </div>
      <div className="mt-2 h3 text-dark">{value}</div>
      <div className="caption mt-2 text-dark/32">{hint}</div>
    </div>
  );
}
