import { AdminShell } from "@/components/admin/AdminShell";
import { TopBar } from "@/components/admin/TopBar";
import { getSiteStats } from "@/lib/admin/stats";

export const metadata = { title: "Страницы сайта" };

export default function PagesHealthPage() {
  const stats = getSiteStats();
  const total = stats.pagesByType.reduce((a, b) => a + b.count, 0);

  return (
    <AdminShell>
      <TopBar title="Страницы сайта" actions={<span className="caption text-dark/56">Всего: {total}</span>} />
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Breakdown */}
          <div className="rounded-xl bg-surface p-5">
            <h3 className="h6 mb-4 text-dark">Разбивка по типу</h3>
            <ul className="flex flex-col divide-y divide-dark/6">
              {stats.pagesByType.map((b) => {
                const pct = Math.round((b.count / total) * 100);
                return (
                  <li key={b.type} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                    <div className="flex-1">
                      <div className="p2 font-semibold text-dark">{b.type}</div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-dark/6">
                        <div
                          className="h-full rounded-full bg-dark"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="h6 text-dark">{b.count}</div>
                      <div className="caption text-dark/56">{pct}%</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Coming soon widgets */}
          <div className="flex flex-col gap-4">
            <ComingCard
              title="Core Web Vitals per page"
              hint="Vercel Speed Insights API → худшие 20 страниц по LCP/INP/CLS"
            />
            <ComingCard
              title="SEO coverage"
              hint="Search Console API → сколько из 907 страниц в индексе"
            />
            <ComingCard
              title="Битые ссылки и картинки"
              hint="GitHub Action раз в сутки → crawler проходит public/pages/*.html"
            />
            <ComingCard
              title="Lighthouse per route"
              hint="Lighthouse CI в GitHub Actions → performance / seo / a11y score"
            />
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function ComingCard({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="rounded-xl border border-dashed border-dark/12 bg-surface p-5">
      <div className="flex items-center justify-between">
        <h4 className="h6 text-dark">{title}</h4>
        <span className="caption rounded-full bg-warning-soft px-2.5 py-1 font-semibold text-dark">
          В плане
        </span>
      </div>
      <p className="caption mt-2 text-dark/56">{hint}</p>
    </div>
  );
}
