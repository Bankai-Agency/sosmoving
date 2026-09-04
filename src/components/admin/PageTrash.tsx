"use client";

import { useActionState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { restorePage, type RestoreState } from "@/app/(admin)/admin/pages/actions";
import type { PageDeletion } from "@/lib/admin/page-store";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

type Entry = PageDeletion & { dateLabel: string };
type Props = { entries: Entry[]; github: boolean };

/**
 * The trash under the pages list. No storage of its own: every deletion
 * is a commit, so the list is the delete commits nobody has restored yet,
 * and restore rebuilds the page from the commit before the deletion.
 */
export function PageTrash({ entries, github }: Props) {
  return (
    <Card className="flex flex-col gap-3 p-5">
      <div>
        <h3 className="text-sm font-semibold">Корзина</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Удалённые страницы остаются в git-истории. «Восстановить» возвращает страницу целиком: HTML,
          SEO-запись, анимации, место в sitemap, и снимает 301-редирект, если он был оставлен.
        </p>
      </div>
      {!github ? (
        <p className="text-sm text-muted-foreground">В dev-режиме корзина недоступна: история читается через GitHub.</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">Пусто - удалённых страниц нет.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Страница</TableHead>
              <TableHead>Удалена</TableHead>
              <TableHead>Кем</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((e) => (
              <TableRow key={e.sha}>
                <TableCell className="font-mono text-sm">{e.slug}</TableCell>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{e.dateLabel}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{e.actor || "-"}</TableCell>
                <TableCell className="text-right">
                  <RestoreButton slug={e.slug} parentSha={e.parentSha} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}

function RestoreButton({ slug, parentSha }: { slug: string; parentSha: string }) {
  const [state, formAction, pending] = useActionState<RestoreState, FormData>(restorePage, {});
  if (state.ok) {
    return <span className="text-xs text-muted-foreground">Восстановлена, сайт пересоберётся за ~2 минуты</span>;
  }
  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="parent_sha" value={parentSha} />
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
        Восстановить
      </Button>
      {state.error && <span className="text-xs text-destructive">{state.error}</span>}
    </form>
  );
}
