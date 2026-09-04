import { AdminShell } from "@/components/admin/AdminShell";
import { TopBar } from "@/components/admin/TopBar";
import { PagesTable } from "@/components/admin/PagesTable";
import { PublishPendingButton } from "@/components/admin/PublishPendingButton";
import { Badge } from "@/components/admin/ui/badge";
import { listPagesFresh } from "@/lib/admin/pages";
import { listPageDeletions, isGitHubBackend } from "@/lib/admin/page-store";
import { PageTrash } from "@/components/admin/PageTrash";

export const metadata = { title: "Страницы сайта" };
export const dynamic = "force-dynamic";
// Duplicate / delete / restore run ~10 GitHub API calls and ship the whole
// seo-meta.json in one commit - the default 15 s function limit killed the
// first duplicate attempt in prod.
export const maxDuration = 60;

export default async function PagesHealthPage() {
  const rows = await listPagesFresh();
  const github = isGitHubBackend();
  // Formatted here, not in the client component: SSR runs in UTC and the
  // editor's browser in their own zone - a hydration mismatch on every row.
  const fmt = new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Los_Angeles" });
  const deletions = github
    ? (await listPageDeletions().catch(() => [])).map((d) => ({
        ...d,
        dateLabel: d.date ? `${fmt.format(new Date(d.date))} (LA)` : "-",
      }))
    : [];

  return (
    <AdminShell>
      <TopBar
        title="Страницы сайта"
        actions={
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Всего: {rows.length}</span>
            <PublishPendingButton />
          </div>
        }
      />
      <div className="flex-1 space-y-4 p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <ComingCard title="Core Web Vitals" hint="Vercel Speed Insights → LCP/INP/CLS" />
          <ComingCard title="SEO coverage" hint="Search Console → indexed / clicks / position" />
          <ComingCard title="Lighthouse" hint="GitHub Action → perf / SEO / a11y score" />
          <ComingCard title="Broken links" hint="Cron crawler → 404-checker" />
        </div>

        <PagesTable rows={rows} />

        <PageTrash entries={deletions} github={github} />
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
