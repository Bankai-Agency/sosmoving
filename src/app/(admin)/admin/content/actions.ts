"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  readPost,
  writePost,
  deletePost,
  slugify,
  isValidPostSlug,
  type Post,
  type PostFrontmatter,
} from "@/lib/admin/content-store";

type SaveState = { error?: string; ok?: boolean; slug?: string };

async function requireActor(): Promise<string> {
  const session = await auth();
  const username = (session?.user as { username?: string } | undefined)?.username;
  if (!username) throw new Error("Not authenticated");
  return username;
}

function today(): string {
  return new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

/**
 * The plain <form action> actions below cannot return state, so a failure
 * lands the editor on a page with ?error= and the page renders it. Without
 * this every GitHub/DB hiccup (or an expired session between page load and
 * click) surfaced as Next's generic error page.
 */
function withError(path: string, message: string): string {
  return `${path}?error=${encodeURIComponent(message)}`;
}

/**
 * Create a brand-new post. Called by the "+ Новая статья" button.
 * Generates a slug from the title (unique-ified if collision), seeds frontmatter
 * with sensible defaults, commits a draft, then redirects to the editor.
 */
export async function createPost(formData: FormData): Promise<never> {
  let slug = "";
  try {
    const actor = await requireActor();
    const rawTitle = String(formData.get("title") ?? "").trim() || "Untitled";
    slug = slugify(rawTitle);
    if (!isValidPostSlug(slug)) slug = `draft-${Date.now()}`;

    // If slug taken, suffix with a timestamp - rare but correct.
    const existing = await readPost(slug);
    if (existing) slug = `${slug}-${Date.now()}`;

    const frontmatter: PostFrontmatter = {
      slug,
      title: rawTitle,
      publishDate: today(),
      lastUpdated: today(),
      category: "general",
      author: { name: "SOS Moving", role: "", photo: "" },
      draft: true,
    };

    await writePost({ frontmatter, content: "Начни писать здесь…" }, `content: create ${slug} (draft)`, actor);
    revalidatePath("/admin/content");
  } catch (err) {
    unstable_rethrow(err);
    console.error("[createPost]", err);
    redirect(withError("/admin/content", errorMessage(err, "Не удалось создать статью")));
  }
  redirect(`/admin/content/${slug}`);
}

/**
 * Save the editor state - frontmatter + body. Status is derived from form:
 *   - `draft` checkbox checked → draft=true
 *   - `publishAt` in the future → scheduled (draft stays true, cron flips it later)
 *   - `publishAt` already in the past → published right away
 */
export async function savePost(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  try {
    const actor = await requireActor();
    const slug = String(formData.get("slug") ?? "");
    if (!isValidPostSlug(slug)) return { error: "Некорректный slug" };

    const existing = await readPost(slug);
    if (!existing) return { error: `Пост ${slug} не найден` };

    const draft = formData.get("draft") === "on";
    const publishAtRaw = String(formData.get("publishAt") ?? "").trim();
    const publishAtDate = publishAtRaw ? new Date(publishAtRaw) : null;
    if (publishAtDate && Number.isNaN(publishAtDate.getTime())) {
      return { error: "Некорректная дата публикации" };
    }
    // A date that has already passed means "publish now". If the draft box is
    // also ticked the intent is ambiguous (an overdue schedule reopened in the
    // editor shows the box ticked) - refuse instead of silently turning the
    // post into a plain draft or publishing something meant to stay hidden.
    const dueNow = publishAtDate !== null && publishAtDate <= new Date();
    if (dueNow && draft) {
      return {
        error:
          "Дата публикации уже прошла: снимите галочку черновика, чтобы опубликовать сейчас, или очистите дату, чтобы оставить черновик.",
      };
    }
    const publishAt = publishAtDate && !dueNow ? publishAtDate.toISOString() : undefined;

    const frontmatter: PostFrontmatter = {
      ...existing.frontmatter,
      title: String(formData.get("title") ?? existing.frontmatter.title ?? ""),
      metaDescription: String(formData.get("metaDescription") ?? existing.frontmatter.metaDescription ?? ""),
      featuredImage: String(formData.get("featuredImage") ?? existing.frontmatter.featuredImage ?? ""),
      category: String(formData.get("category") ?? existing.frontmatter.category ?? "general"),
      draft: draft || Boolean(publishAt),
      publishAt,
      lastUpdated: today(),
      // The admin's markdown is now the source of truth for this article -
      // the public route stops serving the scraped html snapshot.
      renderFrom: "md",
    };

    // Keep the multi-category list in sync with the selected primary -
    // otherwise a re-categorized post keeps filtering into its old
    // /category/* listings only.
    if (Array.isArray(frontmatter.categories) && frontmatter.category
        && !frontmatter.categories.includes(frontmatter.category)) {
      frontmatter.categories = [frontmatter.category, ...frontmatter.categories];
    }

    const body = String(formData.get("content") ?? existing.content);

    const msg = publishAt
      ? `content: schedule ${slug} for ${publishAt}`
      : draft
        ? `content: save draft ${slug}`
        : `content: publish ${slug}`;

    await writePost({ frontmatter, content: body } satisfies Post, msg, actor);
    revalidatePath("/admin/content");
    revalidatePath(`/admin/content/${slug}`);
    revalidatePath(`/blog/${slug}`);
    return { ok: true, slug };
  } catch (err) {
    unstable_rethrow(err);
    console.error("[savePost]", err);
    return { error: errorMessage(err, "Не удалось сохранить") };
  }
}

/** Flip draft=false immediately (and clear publishAt). */
export async function publishNow(formData: FormData): Promise<never> {
  const slug = String(formData.get("slug") ?? "");
  if (!isValidPostSlug(slug)) redirect("/admin/content");
  try {
    const actor = await requireActor();
    const existing = await readPost(slug);
    if (!existing) redirect(withError("/admin/content", "Статья не найдена"));
    await writePost(
      {
        frontmatter: { ...existing.frontmatter, draft: false, publishAt: undefined, lastUpdated: today() },
        content: existing.content,
      },
      `content: publish ${slug}`,
      actor,
    );
    revalidatePath("/admin/content");
    revalidatePath(`/admin/content/${slug}`);
    revalidatePath(`/blog/${slug}`);
  } catch (err) {
    unstable_rethrow(err);
    console.error("[publishNow]", err);
    redirect(withError(`/admin/content/${slug}`, errorMessage(err, "Не удалось опубликовать")));
  }
  redirect(`/admin/content/${slug}`);
}

/** Flip draft=true - unpublish without deleting. */
export async function unpublish(formData: FormData): Promise<never> {
  const slug = String(formData.get("slug") ?? "");
  if (!isValidPostSlug(slug)) redirect("/admin/content");
  try {
    const actor = await requireActor();
    const existing = await readPost(slug);
    if (!existing) redirect(withError("/admin/content", "Статья не найдена"));
    await writePost(
      { frontmatter: { ...existing.frontmatter, draft: true, publishAt: undefined }, content: existing.content },
      `content: unpublish ${slug}`,
      actor,
    );
    revalidatePath("/admin/content");
    revalidatePath(`/admin/content/${slug}`);
    revalidatePath(`/blog/${slug}`);
  } catch (err) {
    unstable_rethrow(err);
    console.error("[unpublish]", err);
    redirect(withError(`/admin/content/${slug}`, errorMessage(err, "Не удалось снять с публикации")));
  }
  redirect(`/admin/content/${slug}`);
}

/** Hard delete. Already-deleted posts are treated as success. */
export async function removePost(formData: FormData): Promise<never> {
  const slug = String(formData.get("slug") ?? "");
  if (!isValidPostSlug(slug)) redirect("/admin/content");
  try {
    const actor = await requireActor();
    await deletePost(slug, actor);
    revalidatePath("/admin/content");
  } catch (err) {
    unstable_rethrow(err);
    console.error("[removePost]", err);
    redirect(withError(`/admin/content/${slug}`, errorMessage(err, "Не удалось удалить статью")));
  }
  redirect("/admin/content");
}
