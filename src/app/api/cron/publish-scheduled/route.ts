import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { NextResponse } from "next/server";
import { readPost, writePost } from "@/lib/admin/content-store";

/**
 * Scheduled-publish cron - schedule lives in vercel.json (daily at 00:00 UTC
 * at the time of writing; the editor copy points there).
 *
 * Finds posts with `draft: true` + `publishAt <= now` and flips `draft: false`
 * (also strips `publishAt`). Each flip is committed individually so Vercel's
 * git-connected project picks them up and rebuilds on each push. Batch mode
 * could reduce commits, but one-post-per-commit keeps the audit trail clean.
 *
 * Protection:
 *   Vercel signs cron requests with `Authorization: Bearer <CRON_SECRET>` if
 *   you set CRON_SECRET in env. We require a match to prevent a drive-by
 *   "POST /api/cron/publish-scheduled" from making random publishes.
 *   If CRON_SECRET isn't set (local dev) we allow unauthenticated calls.
 */
export const dynamic = "force-dynamic";
// Three serial GitHub calls per due post.
export const maxDuration = 60;

const BLOG_DIR = join(process.cwd(), "src/data/blog");

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const header = req.headers.get("authorization") ?? "";
    if (header !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();
  const files = readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));

  const due: { slug: string; publishAt: string }[] = [];
  for (const f of files) {
    try {
      const { data } = matter(readFileSync(join(BLOG_DIR, f), "utf-8"));
      if (data.draft === true && data.publishAt && new Date(data.publishAt) <= now) {
        due.push({ slug: f.replace(/\.md$/, ""), publishAt: String(data.publishAt) });
      }
    } catch {
      // unreadable — skip
    }
  }

  const published: string[] = [];
  for (const { slug } of due) {
    try {
      const post = await readPost(slug);
      if (!post) continue;
      // "due" came from the fs snapshot of the last build; the post may have
      // been rescheduled or unpublished through the admin since. Trust the
      // fresh frontmatter before flipping it.
      const fm = post.frontmatter;
      if (fm.draft !== true || !fm.publishAt || new Date(fm.publishAt) > now) continue;
      await writePost(
        {
          frontmatter: {
            ...post.frontmatter,
            draft: false,
            publishAt: undefined,
            lastUpdated: new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
          },
          content: post.content,
        },
        `content: auto-publish ${slug} (scheduled)`,
        "scheduled-cron",
      );
      published.push(slug);
    } catch (err) {
      console.error(`[cron publish-scheduled] failed for ${slug}:`, err);
    }
  }

  return NextResponse.json({
    ok: true,
    checkedAt: now.toISOString(),
    dueCount: due.length,
    publishedCount: published.length,
    published,
  });
}
