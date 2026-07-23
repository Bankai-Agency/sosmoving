import { readFileSync, writeFileSync, existsSync } from "node:fs";
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

  const abs = join(process.cwd(), path);
  if (!existsSync(abs)) return null;
  return readFileSync(abs, "utf-8");
}

export async function writePageHtml(
  slug: string,
  html: string,
  commitMessage: string,
  actor: string,
): Promise<void> {
  if (!isValidPageSlug(slug)) throw new Error(`Bad page slug: ${slug}`);
  const path = `${PAGES_DIR}/${slug}.html`;
  const msg = `${commitMessage}\n\nvia admin panel by ${actor}`;

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

  const abs = join(process.cwd(), path);
  if (!existsSync(abs)) throw new Error(`Page not found: ${path}`);
  writeFileSync(abs, html, "utf-8");
}
