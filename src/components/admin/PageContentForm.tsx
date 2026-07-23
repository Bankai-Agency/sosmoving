"use client";

import { useActionState, useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { savePageContent, type SavePageState } from "@/app/(admin)/admin/pages/[slug]/actions";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Alert } from "./ui/alert";

type Props = {
  slug: string;
  baseHash: string;
  heroH1: string[] | null;
  heroSubtitle: string | null;
  faq: { q: string; a: string }[];
  images: { src: string; alt: string }[];
};

/**
 * The page content editor form. Fields are positional — the server action
 * re-extracts the slots from the current file and matches by index; the
 * base_hash guard rejects the save if the file changed in between.
 *
 * A successful save commits to GitHub → Vercel rebuilds → the edit is live
 * in ~2 minutes (in dev the file is written directly).
 */
export function PageContentForm({ slug, baseHash, heroH1, heroSubtitle, faq, images }: Props) {
  const [state, formAction, pending] = useActionState<SavePageState, FormData>(
    savePageContent.bind(null, slug),
    {},
  );

  return (
    <form action={formAction} className="mx-auto flex max-w-3xl flex-col gap-6">
      <input type="hidden" name="base_hash" value={baseHash} />

      {state.error && <Alert variant="destructive">{state.error}</Alert>}
      {state.ok && (
        <Alert>
          {state.changed && state.changed.length > 0
            ? state.deferred
              ? "Сохранено без публикации. Когда закончите все правки – нажмите «Опубликовать накопленное» на странице списка."
              : "Сохранено. Изменения появятся на сайте после пересборки (~2 минуты)."
            : "Изменений нет – сохранять нечего."}
        </Alert>
      )}

      {(heroH1 || heroSubtitle) && (
        <Card className="flex flex-col gap-4 p-5">
          <h3 className="text-sm font-semibold">Первый экран (hero)</h3>
          {heroH1 && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="hero_h1">Заголовок H1 · каждая строка формы = строка на сайте</Label>
              <Textarea
                id="hero_h1"
                name="hero_h1"
                defaultValue={heroH1.join("\n")}
                rows={Math.max(2, heroH1.length)}
                className="text-base font-medium"
              />
            </div>
          )}
          {heroSubtitle && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="hero_subtitle">
                Подзаголовок · цена вида $119/hr автоматически подсветится жёлтым
              </Label>
              <Input id="hero_subtitle" name="hero_subtitle" defaultValue={heroSubtitle} />
            </div>
          )}
        </Card>
      )}

      {faq.length > 0 && (
        <Card className="flex flex-col gap-5 p-5">
          <h3 className="text-sm font-semibold">FAQ ({faq.length})</h3>
          {faq.map((item, i) => (
            <div key={i} className="flex flex-col gap-1.5 border-t pt-4 first:border-t-0 first:pt-0">
              <Label htmlFor={`faq_q_${i}`}>Вопрос {i + 1}</Label>
              <Input id={`faq_q_${i}`} name={`faq_q_${i}`} defaultValue={item.q} />
              <Label htmlFor={`faq_a_${i}`} className="mt-1">
                Ответ · пустая строка = новый абзац
              </Label>
              <Textarea id={`faq_a_${i}`} name={`faq_a_${i}`} defaultValue={item.a} rows={3} />
            </div>
          ))}
        </Card>
      )}

      {images.length > 0 && (
        <Card className="flex flex-col gap-5 p-5">
          <h3 className="text-sm font-semibold">Картинки ({images.length})</h3>
          <p className="text-xs text-muted-foreground">
            Замена файла меняет картинку во всех местах страницы, где она используется. Alt-текст
            важен для SEO.
          </p>
          {images.map((img, i) => (
            <ImageRow key={i} index={i} src={img.src} alt={img.alt} />
          ))}
        </Card>
      )}

      <div className="sticky bottom-4 flex items-center justify-end gap-4 rounded-lg border bg-card p-3 shadow-lg">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" name="defer_build" className="h-4 w-4 accent-primary" />
          Сохранить без публикации (правлю ещё и другие страницы)
        </label>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Сохранить
        </Button>
      </div>
    </form>
  );
}

function ImageRow({ index, src, alt }: { index: number; src: string; alt: string }) {
  const [current, setCurrent] = useState(src);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPickFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("dir", "pages");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Загрузка не удалась");
      setCurrent(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Загрузка не удалась");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-start gap-4 border-t pt-4 first:border-t-0 first:pt-0">
      {/* eslint-disable-next-line @next/next/no-img-element -- превью произвольных путей из блоба */}
      <img
        src={current}
        alt={alt}
        className="h-16 w-24 shrink-0 rounded-md border object-cover"
        loading="lazy"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <input type="hidden" name={`img_src_${index}`} value={current} />
        <div className="truncate text-xs text-muted-foreground" title={current}>
          {current}
        </div>
        <Input name={`img_alt_${index}`} defaultValue={alt} placeholder="Alt-текст" />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => fileRef.current?.click()}
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />}
        {uploading ? "" : "Заменить"}
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onPickFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
