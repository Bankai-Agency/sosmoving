import { readFileSync, writeFileSync, unlinkSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { Octokit } from "@octokit/rest";

/**
 * Content store — reads and writes blog `.md` files.
 *
 * Two backends, picked at call time:
 *   1. GitHub API (prod) — when GITHUB_TOKEN + GITHUB_REPO are set. Writes
 *      commit to `main`; Vercel's git-connected project rebuilds automatically.
 *   2. Local filesystem (dev) — when GITHUB_TOKEN is absent. Good enough for
 *      a single-machine dev loop; do NOT use this on Vercel — the serverless
 *      FS is read-only outside /tmp.
 *
 * The API is the same either way so the UI doesn't care which backend
 * is active.
 */

const BLOG_DIR = "src/data/blog";
const REPO = process.env.GITHUB_REPO ?? ""; // e.g. "Bankai-Agency/sosmoving"
const BRANCH = process.env.GITHUB_BRANCH ?? "main";
const TOKEN = process.env.GITHUB_TOKEN ?? "";

function viaGitHub() {
  return Boolean(TOKEN && REPO);
}

function splitRepo(): { owner: string; repo: string } {
  const [owner, repo] = REPO.split("/");
  if (!owner || !repo) {
    throw new Error(`Invalid GITHUB_REPO=${REPO}. Expected "owner/repo".`);
  }
  return { owner, repo };
}

let _octokit: Octokit | null = null;
function octokit(): Octokit {
  if (!_octokit) _octokit = new Octokit({ auth: TOKEN });
  return _octokit;
}

// ============================================================
// Public API
// ============================================================

export type PostFrontmatter = {
  slug: string;
  title: string;
  metaDescription?: string;
  featuredImage?: string;
  publishDate?: string;
  lastUpdated?: string;
  category?: string;
  readTime?: string;
  author?: { name?: string; role?: string; photo?: string };
  categories?: string[]; // multi-category (Webflow parity); `category` is the primary
  draft?: boolean;
  publishAt?: string; // ISO datetime — if set, cron will flip draft=false at this time
  // "md" → the public /blog/[slug] renders from markdown instead of the
  // scraped html snapshot. Stamped by savePost on every admin save.
  renderFrom?: 'md';
};

export type Post = {
  frontmatter: PostFrontmatter;
  content: string; // markdown body (no frontmatter)
};

/** Read a post. Returns null if the slug doesn't exist. */
export async function readPost(slug: string): Promise<Post | null> {
  const path = `${BLOG_DIR}/${slug}.md`;

  let raw: string | null = null;
  if (viaGitHub()) {
    const { owner, repo } = splitRepo();
    try {
      const res = await octokit().repos.getContent({ owner, repo, path, ref: BRANCH });
      const data = res.data as { content?: string; encoding?: string };
      if (data.content && data.encoding === "base64") {
        raw = Buffer.from(data.content, "base64").toString("utf-8");
      }
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 404) return null;
      throw err;
    }
  } else {
    const abs = join(process.cwd(), path);
    if (!existsSync(abs)) return null;
    raw = readFileSync(abs, "utf-8");
  }
  if (!raw) return null;

  const { data, content } = matter(raw);
  return {
    frontmatter: { ...(data as PostFrontmatter), slug },
    content,
  };
}

/** Write (create or update) a post. `commitMessage` labels the git commit. */
export async function writePost(post: Post, commitMessage: string, actor: string): Promise<void> {
  const slug = post.frontmatter.slug;
  if (!slug) throw new Error("slug is required");
  const path = `${BLOG_DIR}/${slug}.md`;
  const raw = matter.stringify(post.content, normalizeFrontmatter(post.frontmatter));

  const msg = `${commitMessage}\n\nvia admin panel by ${actor}`;

  if (viaGitHub()) {
    const { owner, repo } = splitRepo();
    // Need the sha for updates; fetch current, ignore 404 for creates.
    let sha: string | undefined;
    try {
      const res = await octokit().repos.getContent({ owner, repo, path, ref: BRANCH });
      sha = (res.data as { sha?: string }).sha;
    } catch (err) {
      if ((err as { status?: number }).status !== 404) throw err;
    }
    await octokit().repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      branch: BRANCH,
      message: msg,
      content: Buffer.from(raw, "utf-8").toString("base64"),
      sha,
    });
  } else {
    const absDir = join(process.cwd(), BLOG_DIR);
    if (!existsSync(absDir)) mkdirSync(absDir, { recursive: true });
    writeFileSync(join(absDir, `${slug}.md`), raw, "utf-8");
  }
}

/** Delete a post. */
export async function deletePost(slug: string, actor: string): Promise<void> {
  const path = `${BLOG_DIR}/${slug}.md`;
  const msg = `content: delete ${slug}\n\nvia admin panel by ${actor}`;

  if (viaGitHub()) {
    const { owner, repo } = splitRepo();
    const res = await octokit().repos.getContent({ owner, repo, path, ref: BRANCH });
    const sha = (res.data as { sha: string }).sha;
    await octokit().repos.deleteFile({ owner, repo, path, branch: BRANCH, sha, message: msg });
  } else {
    const abs = join(process.cwd(), path);
    if (existsSync(abs)) unlinkSync(abs);
  }
}

// ============================================================
// Helpers
// ============================================================

/** Keep frontmatter fields tidy — drop empties, clamp strings. */
function normalizeFrontmatter(fm: PostFrontmatter): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  out.slug = fm.slug;
  out.title = fm.title ?? "";
  if (fm.metaDescription) out.metaDescription = fm.metaDescription;
  if (fm.featuredImage) out.featuredImage = fm.featuredImage;
  if (fm.publishDate) out.publishDate = fm.publishDate;
  if (fm.lastUpdated) out.lastUpdated = fm.lastUpdated;
  if (fm.category) out.category = fm.category;
  if (fm.readTime) out.readTime = fm.readTime;
  if (fm.author) out.author = fm.author;
  if (fm.draft === true) out.draft = true;
  if (fm.publishAt) out.publishAt = fm.publishAt;
  // Fields the whitelist must NOT strip: multi-category parity data and
  // the md-render flag the public blog route depends on.
  if (Array.isArray((fm as { categories?: string[] }).categories)) {
    out.categories = (fm as { categories?: string[] }).categories;
  }
  if (fm.renderFrom) out.renderFrom = fm.renderFrom;
  return out;
}

/**
 * Slugs as GitHub sees them right now (one API call). The serverless
 * filesystem only has the files from the last build, so anything created
 * or deleted through the admin since then is invisible to fs reads —
 * merge with this list for a fresh view. Returns null when the GitHub
 * backend is not configured (local dev) or listing fails.
 */
export async function listSlugsGitHub(): Promise<string[] | null> {
  if (!viaGitHub()) return null;
  try {
    const { owner, repo } = splitRepo();
    const res = await octokit().repos.getContent({ owner, repo, path: BLOG_DIR, ref: BRANCH });
    if (!Array.isArray(res.data)) return null;
    return res.data
      .filter((e) => e.type === "file" && e.name.endsWith(".md"))
      .map((e) => e.name.replace(/\.md$/, ""));
  } catch (err) {
    console.warn("[content-store] listSlugsGitHub failed:", (err as Error).message);
    return null;
  }
}

/** Is this post currently visible on the public site? */
export function isPublic(fm: PostFrontmatter, now: Date = new Date()): boolean {
  if (fm.draft !== true) return true;
  if (fm.publishAt && new Date(fm.publishAt) <= now) return true;
  return false;
}

/** Convenience for generating a unique slug from a title. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}
