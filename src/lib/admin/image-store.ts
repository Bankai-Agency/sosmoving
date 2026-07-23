import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { Octokit } from "@octokit/rest";
import { createHash } from "node:crypto";

/**
 * Image-store — parallel to content-store but targets `public/images/blog/`
 * (for blog post images uploaded from the BlockNote editor).
 *
 * Same two-backend pattern as content-store:
 *   1. GitHub API (prod) when GITHUB_TOKEN + GITHUB_REPO are set.
 *   2. Local filesystem (dev) otherwise.
 *
 * File naming:
 *   `<hash12>.<ext>` — collision-resistant, stable (same file content
 *   uploaded twice dedupes in git history).
 */

const REPO = process.env.GITHUB_REPO ?? "";
const BRANCH = process.env.GITHUB_BRANCH ?? "main";
const TOKEN = process.env.GITHUB_TOKEN ?? "";

function viaGitHub() {
  return Boolean(TOKEN && REPO);
}

function splitRepo(): { owner: string; repo: string } {
  const [owner, repo] = REPO.split("/");
  if (!owner || !repo) throw new Error(`Invalid GITHUB_REPO=${REPO}`);
  return { owner, repo };
}

let _octokit: Octokit | null = null;
function octokit(): Octokit {
  if (!_octokit) _octokit = new Octokit({ auth: TOKEN });
  return _octokit;
}

const ALLOWED_EXTS = new Set(["jpg", "jpeg", "png", "webp", "avif", "gif", "svg"]);
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB — generous for blog content

export type UploadResult = { url: string; filename: string; bytes: number };

/**
 * Upload destinations. "blog" is the BlockNote editor's target; "pages"
 * holds images uploaded through the page content editor.
 */
const UPLOAD_DIRS: Record<string, string> = {
  blog: "public/images/blog",
  pages: "public/images/pages",
};

/**
 * Save an uploaded image. Returns the public URL. The URL shape matches
 * what the rest of the site already uses: `/images/<dir>/<hash>.<ext>` —
 * served by Next's static handler.
 */
export async function saveImage(file: File, actor: string, dir: string = "blog"): Promise<UploadResult> {
  if (file.size > MAX_BYTES) {
    throw new Error(`Файл слишком большой (${(file.size / 1024 / 1024).toFixed(1)} MB). Лимит 8 MB.`);
  }
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  if (!ALLOWED_EXTS.has(ext)) {
    throw new Error(`Формат ${ext || "?"} не поддерживается. Разрешены: ${[...ALLOWED_EXTS].join(", ")}.`);
  }

  const imagesDir = UPLOAD_DIRS[dir];
  if (!imagesDir) throw new Error(`Недопустимая директория загрузки: ${dir}`);

  const buf = Buffer.from(await file.arrayBuffer());
  const hash = createHash("sha256").update(buf).digest("hex").slice(0, 12);
  const filename = `${hash}.${ext}`;
  const path = `${imagesDir}/${filename}`;
  const url = `/${imagesDir.replace(/^public\//, "")}/${filename}`;

  if (viaGitHub()) {
    const { owner, repo } = splitRepo();
    // Check if already exists (deduping).
    let existed = false;
    try {
      await octokit().repos.getContent({ owner, repo, path, ref: BRANCH });
      existed = true;
    } catch (err) {
      if ((err as { status?: number }).status !== 404) throw err;
    }
    if (!existed) {
      await octokit().repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        branch: BRANCH,
        message: `content: upload image ${filename}\n\nvia admin panel by ${actor}`,
        content: buf.toString("base64"),
      });
    }
  } else {
    const absDir = join(process.cwd(), imagesDir);
    if (!existsSync(absDir)) mkdirSync(absDir, { recursive: true });
    const absPath = join(absDir, filename);
    if (!existsSync(absPath)) writeFileSync(absPath, buf);
  }

  return { url, filename, bytes: file.size };
}
