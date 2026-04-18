import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { TopBar } from "@/components/admin/TopBar";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/admin/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/admin/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import { getAllPosts } from "@/lib/admin/stats";

export const metadata = { title: "Контент" };
export const dynamic = "force-dynamic";

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
          <Button asChild size="sm">
            <Link href="/admin/content/new">
              <Plus className="h-4 w-4" />
              Новая статья
            </Link>
          </Button>
        }
      />
      <div className="flex-1 space-y-4 p-6">
        <div className="grid grid-cols-3 gap-4">
          <Stat label="Опубликовано" value={published} />
          <Stat label="Черновики" value={drafts} />
          <Stat label="Запланировано" value={scheduled} />
        </div>

        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Статья</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Категория</TableHead>
                <TableHead>Опубликовано</TableHead>
                <TableHead>Обновлено</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.slice(0, 50).map((p) => (
                <TableRow key={p.slug}>
                  <TableCell className="max-w-[400px]">
                    <Link href={`/admin/content/${p.slug}`} className="block truncate font-medium hover:underline">
                      {p.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={p.status} />
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate text-xs text-muted-foreground">{p.category}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {p.publishDate || "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {p.lastUpdated || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {posts.length > 50 && (
            <div className="border-t p-3 text-center text-xs text-muted-foreground">
              Показано 50 из {posts.length}. Пагинация и поиск — в следующем шаге.
            </div>
          )}
        </Card>
      </div>
    </AdminShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent />
    </Card>
  );
}
