import { classifyPage } from "./pages";
import { insertSeoEntry } from "./page-duplicate";

/**
 * Page deletion and restore - the pure planning half, mirror image of
 * page-duplicate. A deletion removes everything a duplicate creates
 * (html, seo entry, Webflow map entries, registry record, JSON-LD) and can
 * leave a 301 behind so the url keeps its rankings. Git history is the
 * trash: restore rebuilds the same set from the commit before the deletion.
 */

const SITE_HOST = "https://www.sosmovingla.net";
export const REDIRECT_KIND = "deleted-page";

type SeoEntry = {
  url: string;
  jsonldFile: string | null;
  [key: string]: unknown;
};

export type RepoFileChange = { path: string; content: string | null };

export type SupportFiles = {
  seoMetaJson: string;
  pageMapJson: string;
  bundleMapJson: string;
  citiesRegistryJson: string;
  servicesRegistryJson: string;
  extraRedirectsCsv: string;
};

export type DeletePlan = { files: RepoFileChange[]; url: string; notes: string[] };

/** "/services/local-moving" or a full www.sosmovingla.net url; nothing else. */
export function normalizeRedirectTarget(raw: string): string | null {
  let t = raw.trim();
  if (!t) return null;
  if (t.startsWith(SITE_HOST)) t = t.slice(SITE_HOST.length) || "/";
  if (!/^\/[A-Za-z0-9/_\-.]*$/.test(t)) return null;
  return t;
}

/** Same allowlist shape as page-store: data/jsonld/<name>.json only. */
function jsonldRepoPath(ref: string | null): string | null {
  if (!ref) return null;
  const m = /^data\/jsonld\/([a-z0-9_][a-z0-9_-]*)\.json$/i.exec(ref);
  return m ? `src/${ref}` : null;
}

function registryKey(slug: string): { child: string; parent: string | null } {
  const [parent, child] = slug.includes("__") ? slug.split("__") : [null, slug];
  return { child, parent };
}

function csvLines(csv: string): string[] {
  return csv.replace(/^﻿/, "").split(/\r?\n/);
}

function csvJoin(lines: string[]): string {
  const body = lines.filter((l, i) => i === 0 || l.trim() !== "");
  return `${body.join("\n")}\n`;
}

export function planDelete(input: { slug: string; redirectTo: string }, snap: SupportFiles): DeletePlan {
  const { slug } = input;
  const { url, type } = classifyPage(slug);
  const files: RepoFileChange[] = [];
  const notes: string[] = [];

  // 1. The page.
  files.push({ path: `public/pages/${slug}.html`, content: null });

  // 2. SEO entry (+ its JSON-LD file: files are not shared between pages,
  //    but check anyway before deleting one).
  const seo = JSON.parse(snap.seoMetaJson) as SeoEntry[];
  const entry = seo.find((e) => e.url === url) ?? null;
  if (entry) {
    const rest = seo.filter((e) => e.url !== url);
    files.push({ path: "src/data/seo-meta.json", content: `${JSON.stringify(rest, null, 2)}\n` });
    const ldPath = jsonldRepoPath(entry.jsonldFile);
    if (ldPath && !rest.some((e) => e.jsonldFile === entry.jsonldFile)) {
      files.push({ path: ldPath, content: null });
      notes.push("Удалена JSON-LD разметка страницы");
    }
  } else {
    notes.push("SEO-записи у страницы не было");
  }

  // 3. Webflow maps.
  for (const [path, json] of [
    ["public/wf-page-map.json", snap.pageMapJson],
    ["public/wf-bundle-map.json", snap.bundleMapJson],
  ] as const) {
    const map = JSON.parse(json) as Record<string, string>;
    if (url in map) {
      delete map[url];
      files.push({ path, content: JSON.stringify(map) });
    }
  }

  // 4. Registries (sitemap).
  if (type === "city" || type === "movers-city") {
    const reg = JSON.parse(snap.citiesRegistryJson) as { slug: string; parentSlug: string | null }[];
    const { child, parent } = registryKey(slug);
    const rest = reg.filter((r) => !(r.slug === child && (r.parentSlug ?? null) === parent));
    if (rest.length !== reg.length) {
      files.push({ path: "src/data/cities/_registry.json", content: `${JSON.stringify(rest, null, 2)}\n` });
      notes.push("Убрана из реестра городов и sitemap");
    }
  } else if (type === "service") {
    const reg = JSON.parse(snap.servicesRegistryJson) as { slug: string; title: string }[];
    const s = slug.replace(/^services__/, "");
    const rest = reg.filter((r) => r.slug !== s);
    if (rest.length !== reg.length) {
      files.push({ path: "src/data/services/_registry.json", content: `${JSON.stringify(rest, null, 2)}\n` });
      notes.push("Убрана из реестра услуг и sitemap");
    }
  }

  // 5. Optional 301 - keeps the url's link equity alive.
  const target = normalizeRedirectTarget(input.redirectTo);
  if (input.redirectTo.trim() && !target) {
    throw new Error("Адрес редиректа: путь вида /services/local-moving (без пробелов и запятых)");
  }
  if (target === url) throw new Error("Редирект не может вести на саму удаляемую страницу");
  if (target) {
    const lines = csvLines(snap.extraRedirectsCsv);
    const row = `${url},${target},${REDIRECT_KIND},0`;
    const at = lines.findIndex((l) => l.startsWith(`${url},`));
    if (at >= 0) lines[at] = row; // keep the row's position: restore puts the old one back there
    else lines.push(row);
    files.push({ path: "src/data/broken-links-map-extra.csv", content: csvJoin(lines) });
    notes.push(`301 ${url} → ${target} (вступит в силу после сборки)`);
  } else {
    notes.push(`Без редиректа: ${url} будет отдавать 404`);
  }

  return { files, url, notes };
}

export type ParentSnapshot = SupportFiles & { html: string; jsonld: string | null };

export type RestorePlan = { files: RepoFileChange[]; url: string; notes: string[] };

/**
 * Rebuild the page from the commit before its deletion, merged into the
 * CURRENT support files (other pages may have changed since - never
 * overwrite them with the old versions wholesale).
 */
export function planRestore(slug: string, parent: ParentSnapshot, current: SupportFiles): RestorePlan {
  const { url, type } = classifyPage(slug);
  const files: RepoFileChange[] = [];
  const notes: string[] = [];

  files.push({ path: `public/pages/${slug}.html`, content: parent.html });

  const parentSeo = JSON.parse(parent.seoMetaJson) as SeoEntry[];
  const parentEntry = parentSeo.find((e) => e.url === url) ?? null;
  const currentSeo = JSON.parse(current.seoMetaJson) as SeoEntry[];
  if (parentEntry && !currentSeo.some((e) => e.url === url)) {
    files.push({
      path: "src/data/seo-meta.json",
      content: insertSeoEntry(current.seoMetaJson, parentEntry as Parameters<typeof insertSeoEntry>[1]),
    });
    const ldPath = jsonldRepoPath(parentEntry.jsonldFile);
    if (ldPath && parent.jsonld) {
      files.push({ path: ldPath, content: parent.jsonld });
      notes.push("Возвращена JSON-LD разметка");
    }
  } else if (!parentEntry) {
    notes.push("SEO-записи у страницы не было и до удаления");
  }

  for (const [path, parentJson, currentJson] of [
    ["public/wf-page-map.json", parent.pageMapJson, current.pageMapJson],
    ["public/wf-bundle-map.json", parent.bundleMapJson, current.bundleMapJson],
  ] as const) {
    const was = (JSON.parse(parentJson) as Record<string, string>)[url];
    const map = JSON.parse(currentJson) as Record<string, string>;
    if (was && !map[url]) {
      map[url] = was;
      files.push({ path, content: JSON.stringify(map) });
    }
  }

  if (type === "city" || type === "movers-city") {
    const { child, parent: parentSlug } = registryKey(slug);
    const had = (JSON.parse(parent.citiesRegistryJson) as { slug: string; parentSlug: string | null }[]).some(
      (r) => r.slug === child && (r.parentSlug ?? null) === parentSlug,
    );
    const reg = JSON.parse(current.citiesRegistryJson) as { slug: string; parentSlug: string | null }[];
    if (had && !reg.some((r) => r.slug === child && (r.parentSlug ?? null) === parentSlug)) {
      reg.push({ slug: child, parentSlug });
      files.push({ path: "src/data/cities/_registry.json", content: `${JSON.stringify(reg, null, 2)}\n` });
      notes.push("Возвращена в реестр городов и sitemap");
    }
  } else if (type === "service") {
    const s = slug.replace(/^services__/, "");
    const was = (JSON.parse(parent.servicesRegistryJson) as { slug: string; title: string }[]).find((r) => r.slug === s);
    const reg = JSON.parse(current.servicesRegistryJson) as { slug: string; title: string }[];
    if (was && !reg.some((r) => r.slug === s)) {
      reg.push(was);
      files.push({ path: "src/data/services/_registry.json", content: `${JSON.stringify(reg, null, 2)}\n` });
      notes.push("Возвращена в реестр услуг и sitemap");
    }
  }

  // A 301 left by the deletion would send the restored url away. Swap it
  // for whatever redirect row the url had BEFORE the deletion (some pages
  // were already 301-shadowed; the deletion replaced that row in place),
  // or drop it when there was none.
  const lines = csvLines(current.extraRedirectsCsv);
  const at = lines.findIndex((l) => l.startsWith(`${url},`) && l.split(",")[2] === REDIRECT_KIND);
  const before = csvLines(parent.extraRedirectsCsv).find(
    (l) => l.startsWith(`${url},`) && l.split(",")[2] !== REDIRECT_KIND,
  );
  if (at >= 0) {
    if (before) lines[at] = before;
    else lines.splice(at, 1);
    files.push({ path: "src/data/broken-links-map-extra.csv", content: csvJoin(lines) });
    notes.push(before ? "Снят 301 удаления, возвращён прежний редирект страницы" : "Снят 301-редирект, оставленный при удалении");
  } else if (before && !lines.includes(before)) {
    lines.push(before);
    files.push({ path: "src/data/broken-links-map-extra.csv", content: csvJoin(lines) });
    notes.push("Возвращён прежний редирект страницы");
  }

  return { files, url, notes };
}
