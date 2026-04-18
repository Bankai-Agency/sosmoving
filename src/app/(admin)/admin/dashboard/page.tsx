import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { TopBar } from "@/components/admin/TopBar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/admin/ui/card";
import { getSiteStats, getScheduledPosts } from "@/lib/admin/stats";
import {
  getRecentCommits,
  getTopCategories,
  getStatusCounts,
  getIntegrations,
} from "@/lib/admin/dashboard";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const stats = getSiteStats();
  const status = getStatusCounts();
  const scheduled = getScheduledPosts();
  const commits = getRecentCommits(8);
  const categories = getTopCategories(6);
  const integrations = getIntegrations();

  return (
    <AdminShell>
      <TopBar
        title="Dashboard"
        actions={<span className="text-xs text-muted-foreground">Последний билд: {stats.lastBuildHint}</span>}
      />
      <div className="flex-1 space-y-4 p-6">
        {/* Row 1 — hero metrics */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Metric label="Всего страниц в билде" value={stats.totalPages.toLocaleString("ru-RU")} hint="public/pages/*.html" />
          <Metric
            label="Статей в блоге"
            value={(status.published + status.drafts + status.scheduled).toString()}
            hint={`${status.published} published · ${status.drafts} draft · ${status.scheduled} scheduled`}
          />
          <Metric label="Городов" value={stats.totalCities.toString()} hint="landing-страницы" />
          <Metric label="Услуг" value={stats.totalServices.toString()} hint="service-страницы" />
        </div>

        {/* Row 2 — lists */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex-row items-baseline justify-between space-y-0 pb-3">
              <CardTitle>Запланировано</CardTitle>
              <Link href="/admin/content" className="text-xs text-muted-foreground hover:text-foreground">
                Все →
              </Link>
            </CardHeader>
            <CardContent>
              {scheduled.length === 0 ? (
                <p className="text-sm text-muted-foreground">Нет запланированных публикаций.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {scheduled.slice(0, 5).map((p) => (
                    <li key={p.slug} className="flex flex-col gap-1">
                      <Link href={`/admin/content/${p.slug}`} className="text-sm font-medium hover:underline">
                        {p.title}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {p.publishAt ? new Date(p.publishAt).toLocaleString("ru-RU") : "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="flex-row items-baseline justify-between space-y-0 pb-3">
              <CardTitle>Недавние правки контента</CardTitle>
              <span className="text-xs text-muted-foreground">git log · src/data/blog</span>
            </CardHeader>
            <CardContent>
              {commits.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Не удалось прочитать git log (или репо ещё не инициализирован).
                </p>
              ) : (
                <ul className="flex flex-col divide-y">
                  {commits.map((c) => (
                    <li key={c.hash} className="flex items-start gap-4 py-3 first:pt-0 last:pb-0">
                      <code className="w-14 shrink-0 font-mono text-xs text-muted-foreground">{c.hash}</code>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{c.subject}</div>
                        <div className="text-xs text-muted-foreground">
                          {c.author} ·{" "}
                          {new Date(c.date).toLocaleString("ru-RU", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Row 3 — categories + integrations */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Топ категорий блога</CardTitle>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground">Нет данных.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {categories.map((c) => {
                    const max = categories[0].count || 1;
                    const pct = Math.round((c.count / max) * 100);
                    return (
                      <li key={c.category} className="flex items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm">{c.category}</div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <span className="w-10 text-right text-xs font-semibold">{c.count}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Интеграции</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-3">
                {integrations.map((i) => (
                  <li key={i.key} className="flex items-start gap-3">
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        i.ready ? "bg-positive" : "bg-warning"
                      }`}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{i.name}</div>
                      <div className="text-xs text-muted-foreground">{i.hint}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Row 4 — pages by type */}
        <Card>
          <CardHeader>
            <CardTitle>Разбивка страниц по типам</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
              {stats.pagesByType.map((b) => (
                <div key={b.type} className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">{b.type}</div>
                  <div className="mt-1 text-lg font-semibold">{b.count}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </CardContent>
    </Card>
  );
}
