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
  DELETE_MESSAGE_PREFIX,
  RESTORE_MESSAGE_PREFIX,
} from "@/lib/admin/page-store";
import { planDuplicate } from "@/lib/admin/page-duplicate";
import { planDelete, planRestore, type SupportFiles } from "@/lib/admin/page-delete";
import { classifyPage } from "@/lib/admin/pages";
import { NON_DELETABLE_TYPES } from "@/lib/admin/page-types";

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

// ============================================================
// Delete + restore (git history is the trash)
// ============================================================

export type DeleteState = {
  error?: string;
  ok?: boolean;
  url?: string;
  deferred?: boolean;
  github?: boolean;
  notes?: string[];
};

async function readSupportFiles(ref?: string): Promise<SupportFiles | null> {
  const [seoMetaJson, pageMapJson, bundleMapJson, citiesRegistryJson, servicesRegistryJson, extraRedirectsCsv] =
    await Promise.all([
      readRepoTextFile("src/data/seo-meta.json", ref),
      readRepoTextFile("public/wf-page-map.json", ref),
      readRepoTextFile("public/wf-bundle-map.json", ref),
      readRepoTextFile("src/data/cities/_registry.json", ref),
      readRepoTextFile("src/data/services/_registry.json", ref),
      readRepoTextFile("src/data/broken-links-map-extra.csv", ref),
    ]);
  if (!seoMetaJson || !pageMapJson || !bundleMapJson || !citiesRegistryJson || !servicesRegistryJson || extraRedirectsCsv === null) {
    return null;
  }
  return { seoMetaJson, pageMapJson, bundleMapJson, citiesRegistryJson, servicesRegistryJson, extraRedirectsCsv };
}

/**
 * Delete a page: the html plus its seo entry, Webflow map entries,
 * registry record and JSON-LD go in one commit, optionally leaving a 301
 * behind. The commit message is what the trash lists, so keep the
 * `content(page): delete <slug>` prefix in sync with page-store.
 */
export async function deletePage(_prev: DeleteState, formData: FormData): Promise<DeleteState> {
  const session = await auth();
  const actor = (session?.user as { username?: string } | undefined)?.username;
  if (!actor) return { error: "Сессия истекла - войдите заново." };

  const slug = String(formData.get("slug") ?? "").trim();
  const confirm = String(formData.get("confirm_slug") ?? "").trim();
  if (!isValidPageSlug(slug)) return { error: "Некорректный slug." };
  if (confirm !== slug) return { error: "Для подтверждения введите slug страницы точно как в списке." };
  if (NON_DELETABLE_TYPES.has(classifyPage(slug).type)) {
    return { error: "Эту страницу удалять нельзя: она структурная (главная, листинги, формы) или управляется в разделе блога." };
  }
  if (!(await pageExists(slug))) return { error: `Страница ${slug} уже отсутствует.` };

  const snap = await readSupportFiles();
  if (!snap) return { error: "Не удалось прочитать служебные файлы (seo-meta, карты Webflow, реестры, редиректы)." };

  let plan;
  try {
    plan = planDelete({ slug, redirectTo: String(formData.get("redirect_to") ?? "") }, snap);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Не удалось подготовить удаление." };
  }

  const deferBuild = formData.get("defer_build") === "on";
  try {
    await commitFiles(plan.files, `${DELETE_MESSAGE_PREFIX}${slug}`, actor, deferBuild);
  } catch (err) {
    return { error: err instanceof Error ? `Не удалось сохранить: ${err.message}` : "Не удалось удалить страницу." };
  }

  revalidatePath("/admin/pages");
  return { ok: true, url: plan.url, deferred: deferBuild, github: isGitHubBackend(), notes: plan.notes };
}

export type RestoreState = { error?: string; ok?: boolean; url?: string; notes?: string[] };

/** Rebuild a deleted page from the commit before its deletion. */
export async function restorePage(_prev: RestoreState, formData: FormData): Promise<RestoreState> {
  const session = await auth();
  const actor = (session?.user as { username?: string } | undefined)?.username;
  if (!actor) return { error: "Сессия истекла - войдите заново." };
  if (!isGitHubBackend()) return { error: "Корзина работает только на проде (git-история через GitHub)." };

  const slug = String(formData.get("slug") ?? "").trim();
  const parentSha = String(formData.get("parent_sha") ?? "").trim();
  if (!isValidPageSlug(slug)) return { error: "Некорректный slug." };
  if (!/^[0-9a-f]{40}$/.test(parentSha)) return { error: "Некорректная ссылка на коммит." };
  if (await pageExists(slug)) return { error: `Страница ${slug} уже существует - восстанавливать нечего.` };

  const html = await readRepoTextFile(`public/pages/${slug}.html`, parentSha);
  if (html === null) return { error: "В истории нет такой страницы на момент перед удалением." };
  const [parentFiles, current] = await Promise.all([readSupportFiles(parentSha), readSupportFiles()]);
  if (!parentFiles || !current) return { error: "Не удалось прочитать служебные файлы." };

  const url = classifyPage(slug).url;
  const jsonldRef =
    (JSON.parse(parentFiles.seoMetaJson) as { url: string; jsonldFile: string | null }[]).find((e) => e.url === url)
      ?.jsonldFile ?? null;
  let jsonld: string | null = null;
  if (jsonldRef) {
    try {
      jsonld = await readRepoTextFile(`src/${jsonldRef}`, parentSha);
    } catch {
      jsonld = null;
    }
  }

  let plan;
  try {
    plan = planRestore(slug, { ...parentFiles, html, jsonld }, current);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Не удалось подготовить восстановление." };
  }
  try {
    await commitFiles(plan.files, `${RESTORE_MESSAGE_PREFIX}${slug}`, actor, false);
  } catch (err) {
    return { error: err instanceof Error ? `Не удалось сохранить: ${err.message}` : "Не удалось восстановить страницу." };
  }

  revalidatePath("/admin/pages");
  return { ok: true, url: plan.url, notes: plan.notes };
}
