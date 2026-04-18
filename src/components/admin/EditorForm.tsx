"use client";

import { useActionState } from "react";
import dynamic from "next/dynamic";
import { savePost } from "@/app/(admin)/admin/content/actions";
import type { PostFrontmatter } from "@/lib/admin/content-store";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";

/**
 * BlockNote (TipTap/ProseMirror) reads `window` / `navigator` at module top,
 * which explodes during SSR. Load it browser-only. The hidden input it
 * writes to is populated after hydration — the form still submits fine
 * because React waits for client JS before the action runs.
 */
const Editor = dynamic(() => import("./Editor").then((m) => m.Editor), {
  ssr: false,
  loading: () => (
    <Card>
      <CardContent className="flex h-[400px] items-center justify-center p-0">
        <span className="text-sm text-muted-foreground">Загружаем редактор…</span>
      </CardContent>
    </Card>
  ),
});

type Props = {
  slug: string;
  frontmatter: PostFrontmatter;
  content: string;
};

export function EditorForm({ slug, frontmatter, content }: Props) {
  const [state, formAction, pending] = useActionState(savePost, {});

  const publishAtLocal = frontmatter.publishAt
    ? new Date(frontmatter.publishAt).toISOString().slice(0, 16)
    : "";

  return (
    <form action={formAction} className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
      {/* Left — title + editor */}
      <div className="flex min-w-0 flex-col gap-4">
        <input
          name="title"
          defaultValue={frontmatter.title ?? ""}
          placeholder="Заголовок статьи"
          required
          className="h2 w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-foreground outline-none transition-colors hover:border-border focus:border-ring focus:bg-card"
        />
        <input type="hidden" name="slug" value={slug} />
        <Editor initialMarkdown={content} hiddenInputName="content" />
      </div>

      {/* Right — frontmatter sidebar */}
      <aside className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Публикация</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <label className="flex items-center gap-3 rounded-md border bg-background px-3 py-2.5 text-sm">
              <input
                type="checkbox"
                name="draft"
                defaultChecked={frontmatter.draft === true && !frontmatter.publishAt}
                className="h-4 w-4 accent-primary"
              />
              <span>Оставить как черновик</span>
            </label>

            <div className="flex flex-col gap-2">
              <Label htmlFor="publishAt">Запланировать публикацию</Label>
              <Input
                id="publishAt"
                type="datetime-local"
                name="publishAt"
                defaultValue={publishAtLocal}
              />
              <span className="text-xs text-muted-foreground">
                Если задано — станет публичным в указанное время (±5 мин, cron).
              </span>
            </div>

            <Button type="submit" disabled={pending} className="mt-2 w-full">
              {pending ? "Сохраняем…" : "Сохранить"}
            </Button>

            {state.ok && (
              <Alert variant="positive">
                <AlertDescription>Сохранено</AlertDescription>
              </Alert>
            )}
            {state.error && (
              <Alert variant="destructive">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SEO & Meta</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="metaDescription">Meta description</Label>
              <Textarea
                id="metaDescription"
                name="metaDescription"
                defaultValue={frontmatter.metaDescription ?? ""}
                rows={3}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="category">Категория</Label>
              <Input id="category" name="category" defaultValue={frontmatter.category ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="featuredImage">Главное изображение (URL)</Label>
              <Input id="featuredImage" name="featuredImage" defaultValue={frontmatter.featuredImage ?? ""} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Технические данные</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="flex flex-col gap-2 text-xs">
              <Row label="slug" value={<code className="font-mono">{slug}</code>} />
              <Row label="Создано" value={frontmatter.publishDate || "—"} />
              <Row label="Обновлено" value={frontmatter.lastUpdated || "—"} />
            </dl>
          </CardContent>
        </Card>
      </aside>
    </form>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}
