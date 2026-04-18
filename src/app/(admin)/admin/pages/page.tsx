import { AdminShell } from "@/components/admin/AdminShell";
import { TopBar } from "@/components/admin/TopBar";
import { PagesTable } from "@/components/admin/PagesTable";
import { Badge } from "@/components/admin/ui/badge";
import { listPages } from "@/lib/admin/pages";

export const metadata = { title: "Страницы сайта" };
export const dynamic = "force-dynamic";

export default function PagesHealthPage() {
  const rows = listPages();

  return (
    <AdminShell>
      <TopBar title="Страницы сайта" actions={<span className="text-xs text-muted-foreground">Всего: {rows.length}</span>} />
      <div className="flex-1 space-y-4 p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <ComingCard title="Core Web Vitals" hint="Vercel Speed Insights → LCP/INP/CLS" />
          <ComingCard title="SEO coverage" hint="Search Console → indexed / clicks / position" />
          <ComingCard title="Lighthouse" hint="GitHub Action → perf / SEO / a11y score" />
          <ComingCard title="Broken links" hint="Cron crawler → 404-checker" />
        </div>

        <PagesTable rows={rows} />
      </div>
    </AdminShell>
  );
}

function ComingCard({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="rounded-xl border border-dashed bg-card p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">{title}</h4>
        <Badge variant="warning">план</Badge>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
