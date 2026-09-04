"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  readPageHtml,
  pageExists,
  readRepoTextFile,
  commitFiles,
  isValidPageSlug,
  isGitHubBackend,
} from "@/lib/admin/page-store";
import { planDuplicate } from "@/lib/admin/page-duplicate";
import { classifyPage } from "@/lib/admin/pages";

export type DuplicateState = {
  error?: string;
  ok?: boolean;
  slug?: string;
  url?: string;
  editable?: boolean;
  deferred?: boolean;
  github?: boolean;
  notes?: string[];
};

/**
 * "Duplicate page" from /admin/pages. Copies the page html plus everything
 * a page needs to be a real page (seo entry, Webflow maps, registry,
 * JSON-LD) in a single commit - see planDuplicate for the list.
 */
export async function duplicatePage(_prev: DuplicateState, formData: FormData): Promise<DuplicateState> {
  const session = await auth();
  const actor = (session?.user as { username?: string } | undefined)?.username;
  if (!actor) return { error: "Сессия истекла - войдите заново." };

  const sourceSlug = String(formData.get("source_slug") ?? "").trim();
  const newSlug = String(formData.get("new_slug") ?? "").trim().toLowerCase();
  if (!isValidPageSlug(sourceSlug)) return { error: "Некорректный исходный slug." };
  if (!isValidPageSlug(newSlug)) {
    return { error: "Slug: только латиница, цифры, дефис и подчёркивание (например pomona-movers)." };
  }
  if (newSlug === sourceSlug) return { error: "Новый slug совпадает с исходным." };
  if (newSlug.split("__").length > 2) {
    return { error: "Допустим только один уровень вложенности (parent__child)." };
  }
  const sourceType = classifyPage(sourceSlug).type;
  if (sourceType === "home" || sourceType === "blog-post") {
    // Home: every href="/" would be rewritten to the copy. Blog posts: the
    // /blog/[slug] route is markdown-gated, an html copy alone would 404.
    return { error: "Главную и посты блога дублировать нельзя." };
  }

  const sourceHtml = await readPageHtml(sourceSlug);
  if (sourceHtml === null) return { error: `Исходная страница ${sourceSlug} не найдена.` };
  if (await pageExists(newSlug)) return { error: `Страница ${newSlug} уже существует.` };

  const [seoMetaJson, pageMapJson, bundleMapJson, citiesRegistryJson, servicesRegistryJson] = await Promise.all([
    readRepoTextFile("src/data/seo-meta.json"),
    readRepoTextFile("public/wf-page-map.json"),
    readRepoTextFile("public/wf-bundle-map.json"),
    readRepoTextFile("src/data/cities/_registry.json"),
    readRepoTextFile("src/data/services/_registry.json"),
  ]);
  if (!seoMetaJson || !pageMapJson || !bundleMapJson || !citiesRegistryJson || !servicesRegistryJson) {
    return { error: "Не удалось прочитать служебные файлы (seo-meta, карты Webflow, реестры)." };
  }

  const sourceUrl = classifyPage(sourceSlug).url;
  const jsonldRef =
    (JSON.parse(seoMetaJson) as { url: string; jsonldFile: string | null }[]).find((e) => e.url === sourceUrl)
      ?.jsonldFile ?? null;
  let sourceJsonld: string | null = null;
  if (jsonldRef) {
    try {
      sourceJsonld = await readRepoTextFile(`src/${jsonldRef}`);
    } catch (err) {
      // Outside the allowlist (odd filename) - the copy simply goes without
      // JSON-LD. Anything else (GitHub 401/5xx) must not silently drop it.
      if (err instanceof Error && err.message.includes("allowlist")) sourceJsonld = null;
      else return { error: "Не удалось прочитать JSON-LD исходной страницы - попробуйте ещё раз." };
    }
  }

  let plan;
  try {
    plan = planDuplicate(
      {
        sourceSlug,
        newSlug,
        replaceFrom: String(formData.get("replace_from") ?? ""),
        replaceTo: String(formData.get("replace_to") ?? ""),
        title: String(formData.get("title") ?? ""),
        description: String(formData.get("description") ?? ""),
        indexable: formData.get("indexable") === "on",
      },
      { sourceHtml, seoMetaJson, pageMapJson, bundleMapJson, citiesRegistryJson, servicesRegistryJson, sourceJsonld },
    );
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Не удалось подготовить копию." };
  }

  const deferBuild = formData.get("defer_build") === "on";
  try {
    await commitFiles(plan.files, `content(page): duplicate ${sourceSlug} -> ${newSlug}`, actor, deferBuild);
  } catch (err) {
    return { error: err instanceof Error ? `Не удалось сохранить: ${err.message}` : "Не удалось сохранить копию." };
  }

  revalidatePath("/admin/pages");
  return {
    ok: true,
    slug: newSlug,
    url: plan.newUrl,
    editable: plan.type === "city" || plan.type === "movers-city",
    deferred: deferBuild,
    github: isGitHubBackend(),
    notes: plan.notes,
  };
}
