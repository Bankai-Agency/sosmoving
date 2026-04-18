"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import type { PageRow, PageType } from "@/lib/admin/page-types";
import { pageTypeLabel } from "@/lib/admin/page-types";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

type Props = { rows: PageRow[] };

const TYPE_ORDER: PageType[] = [
  "home",
  "city",
  "movers-city",
  "service",
  "services-listing",
  "moving-services",
  "blog-index",
  "blog-post",
  "about",
  "form",
  "sitemap",
  "confirmation",
  "other",
];

/**
 * Client-side table with type filter + free-text search. 907 rows rendered
 * as a single flat list — React handles this fine without virtualization.
 * If we ever cross ~5000 rows we can swap to react-virtual.
 */
export function PagesTable({ rows }: Props) {
  const [typeFilter, setTypeFilter] = useState<PageType | "all">("all");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(100);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (q && !r.slug.toLowerCase().includes(q) && !r.url.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, typeFilter, query]);

  const visible = filtered.slice(0, limit);

  const byType = useMemo(() => {
    const counts = new Map<PageType, number>();
    for (const r of rows) counts.set(r.type, (counts.get(r.type) ?? 0) + 1);
    return counts;
  }, [rows]);

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[240px] flex-1">
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по slug / URL"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as PageType | "all")}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="all">Все типы ({rows.length})</option>
          {TYPE_ORDER.map((t) => {
            const n = byType.get(t) ?? 0;
            if (!n) return null;
            return (
              <option key={t} value={t}>
                {pageTypeLabel(t)} ({n})
              </option>
            );
          })}
        </select>
        <span className="text-xs text-muted-foreground">
          показано {Math.min(limit, filtered.length)} из {filtered.length}
        </span>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Тип</TableHead>
              <TableHead>URL</TableHead>
              <TableHead className="text-right">Размер</TableHead>
              <TableHead className="text-right">Обновлено</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((r) => (
              <TableRow key={r.slug}>
                <TableCell>
                  <Badge variant="secondary">{pageTypeLabel(r.type)}</Badge>
                </TableCell>
                <TableCell>
                  <Link
                    href={r.url}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 font-mono text-sm hover:underline"
                  >
                    {r.url}
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </Link>
                </TableCell>
                <TableCell className="whitespace-nowrap text-right text-xs text-muted-foreground">
                  {(r.bytes / 1024).toFixed(1)} KB
                </TableCell>
                <TableCell className="whitespace-nowrap text-right text-xs text-muted-foreground">
                  {r.mtime.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {visible.length < filtered.length && (
          <div className="border-t p-3 text-center">
            <Button variant="outline" size="sm" onClick={() => setLimit((l) => l + 200)}>
              Показать ещё 200
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
