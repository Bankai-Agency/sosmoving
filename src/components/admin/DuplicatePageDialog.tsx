"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Copy, Loader2 } from "lucide-react";
import { duplicatePage, type DuplicateState } from "@/app/(admin)/admin/pages/actions";
import { classifyPage, guessPageName, pageTypeLabel, type PageType } from "@/lib/admin/page-types";
import { Alert } from "./ui/alert";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

type Props = { sourceSlug: string; sourceUrl: string; type: PageType };

const LOCATION_TYPES = new Set<PageType>(["city", "movers-city"]);

/**
 * "Duplicate page" dialog. One form, one server action, one commit: the
 * copy lands with its seo entry, Webflow maps, registry and JSON-LD, so a
 * new location is a real page right away and the slot editor can take
 * over for the copy.
 */
export function DuplicatePageDialog({ sourceSlug, sourceUrl, type }: Props) {
  const [open, setOpen] = useState(false);
  const [newSlug, setNewSlug] = useState("");
  const [typedReplaceTo, setTypedReplaceTo] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState<DuplicateState, FormData>(duplicatePage, {});

  const isLocation = LOCATION_TYPES.has(type);
  const fromGuess = guessPageName(sourceSlug);
  // The new name usually follows from the new slug - derived until the
  // editor types their own.
  const replaceTo = typedReplaceTo ?? (newSlug ? guessPageName(newSlug) : "");
  // What the slug will become - the type follows the slug pattern, and a
  // location duplicated under a non-city slug silently turns into "other":
  // no registry, no sitemap, no content editor.
  const target = newSlug ? classifyPage(newSlug) : null;
  const sameKind = target
    ? target.type === type || (LOCATION_TYPES.has(target.type) && LOCATION_TYPES.has(type))
    : true;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" title="Дублировать страницу">
          <Copy className="h-3.5 w-3.5" /> Дублировать
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogTitle>Дублировать {sourceUrl}</DialogTitle>
        <DialogDescription>
          Копия получит свою SEO-запись, карты Webflow (анимации), JSON-LD и место
          в sitemap. Текст на странице можно сразу заменить, остальное - в редакторе
          контента.
        </DialogDescription>

        {state.ok ? (
          <div className="flex flex-col gap-3">
            <Alert>
              Страница {state.url} создана.{" "}
              {state.github
                ? state.deferred
                  ? "Сохранена без публикации - нажмите «Опубликовать накопленное», когда закончите правки."
                  : "Сайт пересоберётся за ~2 минуты; в списке страниц она появится после сборки."
                : "Файлы записаны локально."}
            </Alert>
            {state.notes && state.notes.length > 0 && (
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {state.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              {state.editable && (
                <Button asChild>
                  <Link href={`/admin/pages/${state.slug}`}>Открыть редактор контента</Link>
                </Button>
              )}
              <Button variant="outline" onClick={() => setOpen(false)}>
                Закрыть
              </Button>
            </div>
          </div>
        ) : (
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="source_slug" value={sourceSlug} />
            {state.error && <Alert variant="destructive">{state.error}</Alert>}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dup_new_slug">Slug новой страницы</Label>
              <Input
                id="dup_new_slug"
                name="new_slug"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value.trim().toLowerCase())}
                placeholder={isLocation ? "pomona-movers" : `${sourceSlug}-copy`}
                pattern="[a-z0-9][a-z0-9_\-]*"
                required
                autoFocus
              />
              {target ? (
                <p className={sameKind ? "text-xs text-muted-foreground" : "text-xs text-amber-600 dark:text-amber-400"}>
                  Адрес: {target.url} · тип: {pageTypeLabel(target.type)}
                  {!sameKind &&
                    (isLocation
                      ? `. Для локации slug должен заканчиваться на -movers или начинаться с movers- (например pomona-movers), иначе копия станет типом «${pageTypeLabel(target.type)}»: без реестра городов, sitemap и редактора контента`
                      : type === "service"
                        ? ". Для услуги slug должен начинаться с services__ (например services__shared-load-moving)"
                        : `. Исходная страница - ${pageTypeLabel(type)}, копия получит другой тип`)}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Станет адресом страницы. Города - с окончанием -movers, вложенные - через двойное подчёркивание
                  (los-angeles-movers__pomona-movers), услуги - с префиксом services__.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="dup_from">{isLocation ? "Название в исходной" : "Заменить текст"}</Label>
                <Input id="dup_from" name="replace_from" defaultValue={isLocation ? fromGuess : ""} placeholder="Eastvale" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="dup_to">{isLocation ? "Название в копии" : "На что заменить"}</Label>
                <Input
                  id="dup_to"
                  name="replace_to"
                  value={replaceTo}
                  onChange={(e) => setTypedReplaceTo(e.target.value)}
                  placeholder="Pomona"
                />
              </div>
              <p className="col-span-2 text-xs text-muted-foreground">
                Заменяется по всей странице, в SEO-полях и JSON-LD (с учётом регистра);
                ссылки и пути к файлам не трогаются. Пусто - без замены.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dup_title">Title (необязательно)</Label>
              <Input id="dup_title" name="title" placeholder="Пусто - как у исходной, с заменой названия" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dup_description">Meta description (необязательно)</Label>
              <Textarea id="dup_description" name="description" rows={2} placeholder="Пусто - как у исходной, с заменой названия" />
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" name="indexable" defaultChecked className="h-4 w-4 accent-primary" />
              Индексировать: без noindex, добавить в sitemap и реестр
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" name="defer_build" className="h-4 w-4 accent-primary" />
              Сохранить без публикации (правлю ещё и другие страницы)
            </label>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
                Отмена
              </Button>
              <Button type="submit" disabled={pending || !newSlug}>
                {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Создать копию
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
