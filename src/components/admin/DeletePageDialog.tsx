"use client";

import { useActionState, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { deletePage, type DeleteState } from "@/app/(admin)/admin/pages/actions";
import { Alert } from "./ui/alert";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

type Props = { slug: string; url: string };

/**
 * "Delete page" dialog. Type-the-slug confirmation, an optional 301 so the
 * url keeps its rankings, and the reassurance that matters: the deletion
 * is a git commit, the trash below the list can bring the page back.
 */
export function DeletePageDialog({ slug, url }: Props) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [state, formAction, pending] = useActionState<DeleteState, FormData>(deletePage, {});
  // The slug or the public path both confirm - whichever the editor copies.
  // Quotes copied along with the slug must not block the confirmation.
  const typed = confirm.replace(/^["'«»]+|["'«»]+$/g, "");
  const confirmed = typed === slug || typed === url;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" title="Удалить страницу">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogTitle>Удалить {url}</DialogTitle>
        <DialogDescription>
          Страница, её SEO-запись, разметка и место в sitemap удаляются одним коммитом. Это обратимо:
          удалённые страницы лежат в «Корзине» под списком, кнопка «Восстановить» возвращает всё как было.
        </DialogDescription>

        {state.ok ? (
          <div className="flex flex-col gap-3">
            <Alert>
              Страница {state.url} удалена.{" "}
              {state.github
                ? state.deferred
                  ? "Сохранено без публикации - на сайте она исчезнет после «Опубликовать накопленное»."
                  : "Сайт пересоберётся за ~2 минуты."
                : "Файлы удалены локально."}
            </Alert>
            {state.notes && state.notes.length > 0 && (
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {state.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            )}
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Закрыть
              </Button>
            </div>
          </div>
        ) : (
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="slug" value={slug} />
            {state.error && <Alert variant="destructive">{state.error}</Alert>}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="del_redirect">Перенаправить на (301, необязательно)</Label>
              <Input id="del_redirect" name="redirect_to" placeholder="/services/local-moving" />
              <p className="text-xs text-muted-foreground">
                Без редиректа адрес начнёт отдавать 404 и потеряет позиции в поиске. Для важных страниц
                укажите ближайшую по смыслу.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="del_confirm">Введите slug для подтверждения</Label>
              <p className="text-xs text-muted-foreground">
                Выделите и вставьте: &quot;<span className="select-all font-mono text-foreground">{slug}</span>&quot;
              </p>
              <Input
                id="del_confirm"
                name="confirm_slug"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value.trim())}
                placeholder={slug}
                autoComplete="off"
              />
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" name="defer_build" className="h-4 w-4 accent-primary" />
              Сохранить без публикации (правлю ещё и другие страницы)
            </label>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
                Отмена
              </Button>
              <Button type="submit" variant="destructive" disabled={pending || !confirmed}>
                {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Удалить страницу
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
