"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { readPageHtml, writePageHtml, pageHash, publishPendingCommit } from "@/lib/admin/page-store";
import { applySlots, extractSlots, type PageEdits } from "@/lib/admin/page-slots";
import { classifyPage } from "@/lib/admin/pages";

export type SavePageState = { error?: string; ok?: boolean; changed?: string[]; deferred?: boolean };

async function requireActor(): Promise<string> {
  const session = await auth();
  const username = (session?.user as { username?: string } | undefined)?.username;
  if (!username) throw new Error("Not authenticated");
  return username;
}

export type PublishState = { error?: string; ok?: boolean };

/**
 * "Опубликовать накопленное" on /admin/pages: an empty, unmarked commit —
 * Vercel builds it and picks up every [skip deploy] draft before it.
 */
export async function publishPending(_prev: PublishState, _formData: FormData): Promise<PublishState> {
  let actor: string;
  try {
    actor = await requireActor();
  } catch {
    return { error: "Сессия истекла – войдите заново." };
  }
  try {
    await publishPendingCommit(actor);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Не удалось запустить публикацию." };
  }
  return { ok: true };
}

/**
 * Save the page content editor form. The form carries positional fields
 * (hero_h1, hero_subtitle, faq_q_{i}/faq_a_{i}, img_src_{i}/img_alt_{i})
 * plus base_hash — the hash of the HTML the form was rendered from. If the
 * file changed since (another editor, a deploy), the save is rejected
 * instead of silently overwriting.
 */
export async function savePageContent(
  slug: string,
  _prev: SavePageState,
  formData: FormData,
): Promise<SavePageState> {
  let actor: string;
  try {
    actor = await requireActor();
  } catch {
    return { error: "Сессия истекла — войдите заново." };
  }

  const pageType = classifyPage(slug).type;
  if (pageType !== "city" && pageType !== "movers-city") {
    return { error: "Эта страница не поддерживается редактором (v1: только городские)." };
  }

  const html = await readPageHtml(slug);
  if (html === null) return { error: `Страница ${slug} не найдена.` };

  const baseHash = String(formData.get("base_hash") ?? "");
  if (baseHash !== pageHash(html)) {
    return { error: "Страница изменилась с момента загрузки формы. Обновите редактор и повторите правки." };
  }

  const slots = extractSlots(html);
  const edits: PageEdits = {};

  const h1 = formData.get("hero_h1");
  if (typeof h1 === "string" && slots.heroH1) {
    edits.heroH1 = h1.split("\n");
  }

  const subtitle = formData.get("hero_subtitle");
  if (typeof subtitle === "string" && slots.heroSubtitle) {
    edits.heroSubtitle = subtitle;
  }

  if (slots.faq.length > 0) {
    edits.faq = slots.faq.map((_slot, i) => ({
      q: String(formData.get(`faq_q_${i}`) ?? ""),
      a: String(formData.get(`faq_a_${i}`) ?? ""),
    }));
  }

  if (slots.images.length > 0) {
    edits.images = slots.images.map((_slot, i) => ({
      src: String(formData.get(`img_src_${i}`) ?? ""),
      alt: String(formData.get(`img_alt_${i}`) ?? ""),
    }));
  }

  let next: { html: string; changed: string[] };
  try {
    next = applySlots(html, edits);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Не удалось применить правки." };
  }

  if (next.changed.length === 0) return { ok: true, changed: [] };

  const deferBuild = formData.get("defer_build") === "on";

  try {
    await writePageHtml(
      slug,
      next.html,
      `content(page): update ${slug} (${next.changed.join(", ")})`,
      actor,
      deferBuild,
    );
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Не удалось сохранить страницу." };
  }

  revalidatePath(`/admin/pages/${slug}`);
  revalidatePath(classifyPage(slug).url);
  return { ok: true, changed: next.changed, deferred: deferBuild };
}
