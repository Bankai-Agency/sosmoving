import { execSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { Octokit } from "@octokit/rest";

/**
 * Dashboard data helpers. Everything here is derived from the filesystem
 * or from `git log` — no DB hits, no external APIs. External-API widgets
 * (Vercel Analytics, Search Console, Sentry) render as "awaiting env var"
 * cards until the respective integration is wired.
 */

const BLOG_DIR = join(process.cwd(), "src/data/blog");

// ============================================================
// Git activity
// ============================================================

export type Commit = { hash: string; date: string; subject: string; author: string };

/**
 * Recent commits touching the blog directory. In prod the repo is not in
 * the function bundle (next.config excludes .git), so the list comes from
 * the GitHub API; `git log` is the dev fallback.
 */
export async function getRecentCommits(limit = 10): Promise<Commit[]> {
  const token = process.env.GITHUB_TOKEN ?? "";
  const repoSlug = process.env.GITHUB_REPO ?? "";
  if (token && repoSlug) {
    const [owner, repo] = repoSlug.split("/");
    try {
      const res = await new Octokit({ auth: token }).repos.listCommits({
        owner,
        repo,
        sha: process.env.GITHUB_BRANCH ?? "main",
        path: "src/data/blog",
        per_page: limit,
      });
      return res.data.map((c) => ({
        hash: c.sha.slice(0, 7),
        date: c.commit.author?.date ?? "",
        author: c.commit.author?.name ?? "",
        subject: c.commit.message.split("\n")[0],
      }));
    } catch (err) {
      console.warn("[dashboard] listCommits failed:", (err as Error).message);
      return [];
    }
  }
  try {
    // Use `%x09` (tab) as a field separator to avoid collisions with common
    // commit subjects. Limit to the blog folder so we only surface content
    // activity, not unrelated site perf churn.
    const out = execSync(
      `git log -n ${limit} --pretty=format:%h%x09%cI%x09%an%x09%s -- src/data/blog`,
      { encoding: "utf-8", cwd: process.cwd(), timeout: 3000 },
    );
    return out
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [hash, date, author, ...rest] = line.split("\t");
        return { hash, date, author, subject: rest.join("\t") };
      });
  } catch {
    return [];
  }
}

// ============================================================
// Content activity from the blog dir
// ============================================================

export type CategoryCount = { category: string; count: number };

export function getTopCategories(limit = 8): CategoryCount[] {
  try {
    const files = readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));
    const counts = new Map<string, number>();
    for (const f of files) {
      try {
        const { data } = matter(readFileSync(join(BLOG_DIR, f), "utf-8"));
        if (data.draft === true) continue; // don't count drafts
        const c = (data.category ?? "general").toString();
        counts.set(c, (counts.get(c) ?? 0) + 1);
      } catch {
        // skip
      }
    }
    return [...counts.entries()]
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  } catch {
    return [];
  }
}

export type StatusCounts = { published: number; drafts: number; scheduled: number };

export function getStatusCounts(): StatusCounts {
  const now = new Date();
  let published = 0;
  let drafts = 0;
  let scheduled = 0;
  try {
    const files = readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));
    for (const f of files) {
      try {
        const { data } = matter(readFileSync(join(BLOG_DIR, f), "utf-8"));
        if (data.draft === true) {
          if (data.publishAt && new Date(data.publishAt) > now) scheduled++;
          else drafts++;
        } else {
          published++;
        }
      } catch {
        // skip
      }
    }
  } catch {
    /* no blog dir */
  }
  return { published, drafts, scheduled };
}

// ============================================================
// Integration readiness
// ============================================================

export type IntegrationStatus = {
  key: string;
  name: string;
  ready: boolean;
  /** One-line explanation — "нужен X env var" or "подключено". */
  hint: string;
};

export function getIntegrations(): IntegrationStatus[] {
  return [
    {
      key: "db",
      name: "Postgres (Neon)",
      ready: Boolean(process.env.DATABASE_URL),
      hint: process.env.DATABASE_URL ? "подключено" : "DATABASE_URL не задан",
    },
    {
      key: "github",
      name: "GitHub commits",
      ready: Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_REPO),
      hint:
        process.env.GITHUB_TOKEN && process.env.GITHUB_REPO
          ? "подключено"
          : "GITHUB_TOKEN / GITHUB_REPO не заданы",
    },
    {
      key: "cron",
      name: "Cron (scheduled publish)",
      ready: Boolean(process.env.CRON_SECRET),
      hint: process.env.CRON_SECRET ? "защищён" : "CRON_SECRET не задан (прод)",
    },
    {
      key: "analytics",
      name: "Vercel Analytics",
      ready: false,
      hint: "нужно подключить в Vercel Dashboard + прокинуть ID",
    },
    {
      key: "search-console",
      name: "Search Console",
      ready: false,
      hint: "нужно добавить OAuth-ключ и property",
    },
    {
      key: "sentry",
      name: "Sentry (errors)",
      ready: false,
      hint: "нужен SENTRY_DSN",
    },
  ];
}
