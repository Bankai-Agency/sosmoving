"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/admin/ui/button";

/**
 * Error boundary for every /admin/* segment. Without it an unhandled
 * server error shows Next's bare "This page couldn't load" with no way to
 * tell what happened; this one keeps the editor oriented, offers a retry
 * (re-renders the segment) and surfaces the digest that Vercel's runtime
 * logs are keyed by.
 */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[admin] unhandled error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-destructive" />
          <h1 className="text-lg font-semibold">Страница админки не загрузилась</h1>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Сервер вернул ошибку. Данные не потеряны: каждое сохранение в админке - это коммит в git.
          Попробуйте повторить; если повторяется, сообщите разработчику код ниже.
        </p>
        {error.digest && (
          <p className="mt-3 rounded bg-muted px-3 py-2 font-mono text-xs">digest: {error.digest}</p>
        )}
        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={() => reset()}>
            <RotateCcw className="h-4 w-4" /> Повторить
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/pages">К списку страниц</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/admin/dashboard">Дашборд</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
