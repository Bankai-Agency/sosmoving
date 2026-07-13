"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  readPost,
  writePost,
  deletePost,
  slugify,
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

/**
 * Create a brand-new post. Called by the "+ Новая статья" button.
 * Generates a slug from the title (unique-ified if collision), seeds frontmatter
 * with sensible defaults, commits a draft, then redirects to the editor.
 */
export async function createPost(formData: FormData): Promise<never> {
  const actor = await requireActor();
  const rawTitle = String(formData.get("title") ?? "").trim() || "Untitled";
  let slug = slugify(rawTitle) || `draft-${Date.now()}`;

  // If slug taken, suffix with a timestamp — rare but correct.
  const existing = await readPost(slug);
  if (existing) slug = `${slug}-${Date.now()}`;

  const frontmatter: PostFrontmatter = {
    slug,
    title: rawTitle,
    publishDate: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    lastUpdated: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    category: "general",
    author: { name: "SOS Moving", role: "", photo: "" },
    draft: true,
  };

  await writePost({ frontmatter, content: "Начни писать здесь…" }, `content: create ${slug} (draft)`, actor);
  revalidatePath("/admin/content");
  redirect(`/admin/content/${slug}`);
}

/**
 * Save the editor state — frontmatter + body. Status is derived from form:
 *   - `draft` checkbox checked → draft=true
 *   - `publishAt` datetime filled → scheduled (draft stays true, cron flips it later)
 */
export async function savePost(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  try {
    const actor = await requireActor();
    const slug = String(formData.get("slug") ?? "");
    if (!slug) return { error: "slug missing" };

    const existing = await readPost(slug);
    if (!existing) return { error: `Пост ${slug} не найден` };

    const draft = formData.get("draft") === "on";
    const publishAtRaw = String(formData.get("publishAt") ?? "").trim();
    const publishAt = publishAtRaw ? new Date(publishAtRaw).toISOString() : undefined;

    const frontmatter: PostFrontmatter = {
      ...existing.frontmatter,
      title: String(formData.get("title") ?? existing.frontmatter.title ?? ""),
      metaDescription: String(formData.get("metaDescription") ?? existing.frontmatter.metaDescription ?? ""),
      featuredImage: String(formData.get("featuredImage") ?? existing.frontmatter.featuredImage ?? ""),
      category: String(formData.get("category") ?? existing.frontmatter.category ?? "general"),
      draft: draft || Boolean(publishAt),
      publishAt,
      lastUpdated: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      // The admin's markdown is now the source of truth for this article —
      // the public route stops serving the scraped html snapshot.
      renderFrom: "md",
    };

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
    console.error("[savePost]", err);
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/** Flip draft=false immediately (and clear publishAt). */
export async function publishNow(formData: FormData): Promise<never> {
  const actor = await requireActor();
  const slug = String(formData.get("slug") ?? "");
  const existing = await readPost(slug);
  if (!existing) redirect("/admin/content");

  await writePost(
    {
      frontmatter: {
        ...existing.frontmatter,
        draft: false,
        publishAt: undefined,
        lastUpdated: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      },
      content: existing.content,
    },
    `content: publish ${slug}`,
    actor,
  );
  revalidatePath("/admin/content");
  revalidatePath(`/blog/${slug}`);
  redirect(`/admin/content/${slug}`);
}

/** Flip draft=true — unpublish without deleting. */
export async function unpublish(formData: FormData): Promise<never> {
  const actor = await requireActor();
  const slug = String(formData.get("slug") ?? "");
  const existing = await readPost(slug);
  if (!existing) redirect("/admin/content");

  await writePost(
    { frontmatter: { ...existing.frontmatter, draft: true, publishAt: undefined }, content: existing.content },
    `content: unpublish ${slug}`,
    actor,
  );
  revalidatePath("/admin/content");
  revalidatePath(`/blog/${slug}`);
  redirect(`/admin/content/${slug}`);
}

/** Hard delete. */
export async function removePost(formData: FormData): Promise<never> {
  const actor = await requireActor();
  const slug = String(formData.get("slug") ?? "");
  if (!slug) redirect("/admin/content");
  await deletePost(slug, actor);
  revalidatePath("/admin/content");
  redirect("/admin/content");
}
