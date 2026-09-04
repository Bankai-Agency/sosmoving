import { readFileSync, writeFileSync, unlinkSync, existsSync } from "node:fs";
import { join } from "node:path";
import { Octokit } from "@octokit/rest";
import { createHash } from "node:crypto";

/**
 * Page store — reads and writes the legacy Webflow page blobs
 * (`public/pages/*.html`) for the admin content editor.
 *
 * Same two-backend pattern as content-store:
 *   1. GitHub API (prod) when GITHUB_TOKEN + GITHUB_REPO are set — a save
 *      is a commit to main; Vercel rebuilds and the edit goes live.
 *   2. Local filesystem (dev) otherwise.
 *
 * Reads also prefer GitHub so the editor sees edits made since the last
 * deploy (the serverless FS only has the files from the last build).
 */

const PAGES_DIR = "public/pages";
const REPO = process.env.GITHUB_REPO ?? "";
const BRANCH = process.env.GITHUB_BRANCH ?? "main";
const TOKEN = process.env.GITHUB_TOKEN ?? "";

function viaGitHub() {
  return Boolean(TOKEN && REPO);
}

/** True when saves go through GitHub (prod) rather than the local fs. */
export function isGitHubBackend(): boolean {
  return viaGitHub();
}

/**
 * Commit-message marker that makes scripts/vercel-ignore-build.sh skip the
 * Vercel build for that commit ("save without publishing").
 */
export const SKIP_DEPLOY_MARKER = "[skip deploy]";

function splitRepo(): { owner: string; repo: string } {
  const [owner, repo] = REPO.split("/");
  if (!owner || !repo) throw new Error(`Invalid GITHUB_REPO=${REPO}. Expected "owner/repo".`);
  return { owner, repo };
}

let _octokit: Octokit | null = null;
function octokit(): Octokit {
  if (!_octokit) _octokit = new Octokit({ auth: TOKEN });
  return _octokit;
}

/** Only sane page slugs reach the fs/API — no path traversal. */
export function isValidPageSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9_-]*$/i.test(slug);
}

export function pageHash(html: string): string {
  return createHash("sha1").update(html, "utf-8").digest("hex").slice(0, 16);
}

export async function readPageHtml(slug: string): Promise<string | null> {
  if (!isValidPageSlug(slug)) return null;
  const path = `${PAGES_DIR}/${slug}.html`;

  if (viaGitHub()) {
    const { owner, repo } = splitRepo();
    try {
      const res = await octokit().repos.getContent({ owner, repo, path, ref: BRANCH });
      const data = res.data as { content?: string; encoding?: string };
      if (data.content && data.encoding === "base64") {
        return Buffer.from(data.content, "base64").toString("utf-8");
      }
      return null;
    } catch (err) {
      if ((err as { status?: number }).status === 404) return null;
      throw err;
    }
  }

  // Literal directory join — keeps Vercel's file tracer scoped to
  // public/pages instead of falling back to bundling the whole cwd.
  const abs = join(process.cwd(), "public/pages", `${slug}.html`);
  if (!existsSync(abs)) return null;
  return readFileSync(abs, "utf-8");
}

export async function writePageHtml(
  slug: string,
  html: string,
  commitMessage: string,
  actor: string,
  deferBuild = false,
): Promise<void> {
  if (!isValidPageSlug(slug)) throw new Error(`Bad page slug: ${slug}`);
  const path = `${PAGES_DIR}/${slug}.html`;
  const marker = deferBuild ? ` ${SKIP_DEPLOY_MARKER}` : "";
  const msg = `${commitMessage}${marker}\n\nvia admin panel by ${actor}`;

  if (viaGitHub()) {
    const { owner, repo } = splitRepo();
    const res = await octokit().repos.getContent({ owner, repo, path, ref: BRANCH });
    const sha = (res.data as { sha: string }).sha;
    await octokit().repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      branch: BRANCH,
      message: msg,
      content: Buffer.from(html, "utf-8").toString("base64"),
      sha,
    });
    return;
  }

  const abs = join(process.cwd(), "public/pages", `${slug}.html`);
  if (!existsSync(abs)) throw new Error(`Page not found: ${path}`);
  writeFileSync(abs, html, "utf-8");
}

/**
 * "Publish" — an empty commit (same tree, new message) on the branch.
 * It carries no marker, so Vercel builds it, and the build includes every
 * draft commit accumulated before it. GitHub's contents API can't make
 * empty commits, hence the git-data calls.
 */
export async function publishPendingCommit(actor: string): Promise<void> {
  if (!viaGitHub()) {
    throw new Error("Публикация нужна только на проде: в dev правки применяются сразу.");
  }
  const { owner, repo } = splitRepo();
  const ref = await octokit().git.getRef({ owner, repo, ref: `heads/${BRANCH}` });
  const headSha = ref.data.object.sha;
  const head = await octokit().git.getCommit({ owner, repo, commit_sha: headSha });
  const commit = await octokit().git.createCommit({
    owner,
    repo,
    message: `content: publish pending admin edits\n\nvia admin panel by ${actor}`,
    tree: head.data.tree.sha,
    parents: [headSha],
  });
  await octokit().git.updateRef({ owner, repo, ref: `heads/${BRANCH}`, sha: commit.data.sha });
}

// ============================================================
// Multi-file commits (page duplication)
// ============================================================

/**
 * Repo text files the duplication flow reads and rewrites. An explicit
 * allowlist on purpose: the fs branch must join literal directory strings
 * (Vercel's file tracer otherwise bundles the whole cwd - see readPageHtml),
 * and the GitHub branch must never be handed an arbitrary path.
 */
function localAbs(path: string): string | null {
  const cwd = process.cwd();
  if (path === "src/data/seo-meta.json") return join(cwd, "src/data", "seo-meta.json");
  if (path === "public/wf-page-map.json") return join(cwd, "public", "wf-page-map.json");
  if (path === "public/wf-bundle-map.json") return join(cwd, "public", "wf-bundle-map.json");
  if (path === "src/data/cities/_registry.json") return join(cwd, "src/data/cities", "_registry.json");
  if (path === "src/data/services/_registry.json") return join(cwd, "src/data/services", "_registry.json");
  if (path === "src/data/broken-links-map-extra.csv") return join(cwd, "src/data", "broken-links-map-extra.csv");
  const page = /^public\/pages\/([a-z0-9][a-z0-9_-]*)\.html$/i.exec(path);
  if (page) return join(cwd, "public/pages", `${page[1]}.html`);
  const ld = /^src\/data\/jsonld\/([a-z0-9][a-z0-9_-]*)\.json$/i.exec(path);
  if (ld) return join(cwd, "src/data/jsonld", `${ld[1]}.json`);
  return null;
}

/**
 * Read a repo text file (GitHub in prod, fs in dev). Null when absent.
 * `ref` reads a historical version (restore from the trash); the fs
 * backend has no history and ignores it.
 */
export async function readRepoTextFile(path: string, ref: string = BRANCH): Promise<string | null> {
  const abs = localAbs(path);
  if (!abs) throw new Error(`Path outside the duplication allowlist: ${path}`);

  if (viaGitHub()) {
    const { owner, repo } = splitRepo();
    try {
      const res = await octokit().repos.getContent({ owner, repo, path, ref });
      const data = res.data as { content?: string; encoding?: string; sha?: string };
      if (data.content && data.encoding === "base64") {
        return Buffer.from(data.content, "base64").toString("utf-8");
      }
      // Files between 1 and 100 MB come back with an empty content field;
      // the blob endpoint has no such cap.
      if (data.sha) {
        const blob = await octokit().git.getBlob({ owner, repo, file_sha: data.sha });
        return Buffer.from(blob.data.content, "base64").toString("utf-8");
      }
      return null;
    } catch (err) {
      if ((err as { status?: number }).status === 404) return null;
      throw err;
    }
  }

  if (!existsSync(abs)) return null;
  return readFileSync(abs, "utf-8");
}

export async function pageExists(slug: string): Promise<boolean> {
  return (await readPageHtml(slug)) !== null;
}

/** content null = delete the file. */
export type RepoFileChange = { path: string; content: string | null };

/**
 * Write several files as ONE commit - a duplicated page is only consistent
 * when its html, seo entry, Webflow maps and registry land together. The
 * contents API is single-file, hence the git-data calls (tree + commit).
 * A concurrent push between getRef and updateRef makes updateRef fail;
 * the caller reports it and the editor simply retries.
 */
export async function commitFiles(
  files: RepoFileChange[],
  commitMessage: string,
  actor: string,
  deferBuild = false,
): Promise<void> {
  if (files.length === 0) return;
  for (const f of files) {
    if (!localAbs(f.path)) throw new Error(`Path outside the duplication allowlist: ${f.path}`);
  }
  const marker = deferBuild ? ` ${SKIP_DEPLOY_MARKER}` : "";
  const msg = `${commitMessage}${marker}\n\nvia admin panel by ${actor}`;

  if (viaGitHub()) {
    const { owner, repo } = splitRepo();
    const o = octokit();
    const ref = await o.git.getRef({ owner, repo, ref: `heads/${BRANCH}` });
    const headSha = ref.data.object.sha;
    const head = await o.git.getCommit({ owner, repo, commit_sha: headSha });
    const tree = await o.git.createTree({
      owner,
      repo,
      base_tree: head.data.tree.sha,
      tree: files.map((f) =>
        f.content === null
          ? { path: f.path, mode: "100644" as const, type: "blob" as const, sha: null }
          : { path: f.path, mode: "100644" as const, type: "blob" as const, content: f.content },
      ),
    });
    const commit = await o.git.createCommit({
      owner,
      repo,
      message: msg,
      tree: tree.data.sha,
      parents: [headSha],
    });
    await o.git.updateRef({ owner, repo, ref: `heads/${BRANCH}`, sha: commit.data.sha });
    return;
  }

  for (const f of files) {
    const abs = localAbs(f.path) as string;
    if (f.content === null) {
      if (existsSync(abs)) unlinkSync(abs);
    } else {
      writeFileSync(abs, f.content, "utf-8");
    }
  }
}

// ============================================================
// Fresh listing + trash (git history is the trash)
// ============================================================

/**
 * Page files as GitHub sees them right now: name + size. The serverless
 * fs only has the files from the last build, so pages duplicated or
 * deleted through the admin since then are invisible to fs reads. Null
 * when the GitHub backend is not configured or the listing fails.
 */
export async function listPageFilesGitHub(): Promise<{ name: string; size: number }[] | null> {
  if (!viaGitHub()) return null;
  try {
    const { owner, repo } = splitRepo();
    const res = await octokit().repos.getContent({ owner, repo, path: PAGES_DIR, ref: BRANCH });
    if (!Array.isArray(res.data)) return null;
    return res.data
      .filter((e) => e.type === "file" && e.name.endsWith(".html"))
      .map((e) => ({ name: e.name, size: e.size }));
  } catch (err) {
    console.warn("[page-store] listPageFilesGitHub failed:", (err as Error).message);
    return null;
  }
}

export const DELETE_MESSAGE_PREFIX = "content(page): delete ";
export const RESTORE_MESSAGE_PREFIX = "content(page): restore ";

export type PageDeletion = {
  slug: string;
  /** The deletion commit. */
  sha: string;
  /** Its first parent - the last commit where the page still existed. */
  parentSha: string;
  date: string;
  actor: string;
};

/**
 * Deletions that can still be restored: delete commits on public/pages
 * that no later restore commit has consumed. Newest first. GitHub only -
 * in dev the developer has git.
 */
export async function listPageDeletions(limit = 20): Promise<PageDeletion[]> {
  if (!viaGitHub()) return [];
  const { owner, repo } = splitRepo();
  const res = await octokit().repos.listCommits({ owner, repo, sha: BRANCH, path: PAGES_DIR, per_page: 100 });
  const restored = new Set<string>();
  const out: PageDeletion[] = [];
  for (const c of res.data) {
    const message = c.commit.message;
    const restore = message.startsWith(RESTORE_MESSAGE_PREFIX)
      ? message.slice(RESTORE_MESSAGE_PREFIX.length).split(/\s/)[0]
      : null;
    if (restore) {
      restored.add(restore);
      continue;
    }
    if (!message.startsWith(DELETE_MESSAGE_PREFIX)) continue;
    const slug = message.slice(DELETE_MESSAGE_PREFIX.length).split(/\s/)[0];
    if (!isValidPageSlug(slug)) continue;
    if (restored.has(slug)) {
      restored.delete(slug); // that restore belonged to this deletion
      continue;
    }
    const parentSha = c.parents[0]?.sha;
    if (!parentSha) continue;
    const actor = /via admin panel by (\S+)/.exec(message)?.[1] ?? "";
    out.push({ slug, sha: c.sha, parentSha, date: c.commit.author?.date ?? "", actor });
    if (out.length >= limit) break;
  }
  return out;
}
